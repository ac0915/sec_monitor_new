import { createServerFn } from "@tanstack/react-start";
import { classifyFiling, filingUrl, type Filing } from "./classify";
import { WATCHLIST } from "./watchlist";

const USER_AGENT = "SecMonitorDesk/1.0 research@example.com";
const FORMS = new Set(["8-K", "8-K/A", "10-K", "10-K/A", "10-Q", "10-Q/A"]);
const PER_NAME = 4;

type Cache = { at: number; filings: Filing[]; errors: number };
let cache: Cache | null = null;

type Recent = {
  form?: string[];
  filingDate?: string[];
  accessionNumber?: string[];
  primaryDocument?: string[];
  items?: string[];
};

async function loadName(name: (typeof WATCHLIST)[number]): Promise<Filing[]> {
  const response = await fetch(`https://data.sec.gov/submissions/CIK${name.cik}.json`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`${name.ticker} ${response.status}`);
  const body = (await response.json()) as { filings?: { recent?: Recent } };
  const recent = body.filings?.recent;
  if (!recent?.form) return [];

  const out: Filing[] = [];
  for (let i = 0; i < recent.form.length && out.length < PER_NAME; i += 1) {
    const form = recent.form[i] ?? "";
    if (!FORMS.has(form)) continue;
    const accession = recent.accessionNumber?.[i] ?? "";
    const primary = recent.primaryDocument?.[i] ?? "";
    const date = recent.filingDate?.[i] ?? "";
    const items = recent.items?.[i] ?? "";
    if (!accession || !primary || !date) continue;
    const scored = classifyFiling(form, items);
    out.push({
      id: `${name.ticker}-${accession}`,
      ticker: name.ticker,
      company: name.company,
      form,
      date,
      items,
      url: filingUrl(name.cik, accession, primary),
      ...scored,
    });
  }
  return out;
}

async function pool<T>(items: T[], size: number, worker: (item: T) => Promise<Filing[]>): Promise<{ filings: Filing[]; errors: number }> {
  const filings: Filing[] = [];
  let errors = 0;
  let cursor = 0;
  async function next(): Promise<void> {
    const index = cursor;
    cursor += 1;
    if (index >= items.length) return;
    try {
      filings.push(...(await worker(items[index]!)));
    } catch {
      errors += 1;
    }
    await next();
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => next()));
  return { filings, errors };
}

export const getFilings = createServerFn({ method: "GET" }).handler(async () => {
  if (cache && Date.now() - cache.at < 3 * 60 * 1000) {
    return { filings: cache.filings, errors: cache.errors, source: "cache" as const, watched: WATCHLIST.length };
  }

  const { filings, errors } = await pool(WATCHLIST, 8, loadName);
  filings.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.tier - b.tier));
  cache = { at: Date.now(), filings, errors };
  return { filings, errors, source: "live" as const, watched: WATCHLIST.length };
});

const briefs = new Map<string, string>();

type BriefInput = {
  id: string;
  ticker: string;
  company: string;
  form: string;
  date: string;
  items: string;
  headline: string;
};

async function oneSentence(prompt: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(gemini)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 80, temperature: 0.2 },
      }),
    });
    if (!res.ok) return { ok: false, error: `Gemini error ${res.status}` };
    const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join(" ") ?? "";
    return { ok: true, text };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Set GEMINI_API_KEY for free summaries. No AI key is configured." };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 80,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return { ok: false, error: res.status === 403 ? "Grok credits are used up. Set a new GEMINI_API_KEY instead." : `AI error ${res.status}` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
}

export const summarizeNew = createServerFn({ method: "POST" })
  .validator((input: { filings: BriefInput[] }) => input)
  .handler(async ({ data }) => {
    const incoming = (data.filings ?? []).slice(0, 4);
    const out: { id: string; sentence: string }[] = [];

    for (const filing of incoming) {
      const saved = briefs.get(filing.id);
      if (saved) {
        out.push({ id: filing.id, sentence: saved });
        continue;
      }
      const prompt = [
        "Write exactly one sentence for an investor.",
        "No preamble. Do not invent numbers that are not in the facts.",
        `${filing.ticker} (${filing.company}) filed ${filing.form} on ${filing.date}.`,
        `Headline: ${filing.headline}. Items: ${filing.items || "none listed"}.`,
      ].join(" ");
      const result = await oneSentence(prompt);
      if (!result.ok) return { ok: false as const, error: result.error, briefs: out };
      const sentence = result.text.replace(/\s+/g, " ").trim();
      if (!sentence) continue;
      briefs.set(filing.id, sentence);
      out.push({ id: filing.id, sentence });
    }

    return { ok: true as const, briefs: out };
  });