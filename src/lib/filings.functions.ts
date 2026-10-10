import { createServerFn } from "@tanstack/react-start";
import { briefFromText } from "./brief";
import { classifyFiling, filingUrl, type Filing } from "./classify";
import { WATCHLIST } from "./watchlist";

const USER_AGENT = "SecMonitorDesk/1.0 (research@secmonitor.app)";
const FORMS = new Set(["8-K", "8-K/A", "10-K", "10-K/A", "10-Q", "10-Q/A"]);
const PER_NAME = 4;
const BRIEF_COUNT = 5;

type Cache = { at: number; filings: Filing[]; errors: number };
let cache: Cache | null = null;
let inflight: Promise<{ filings: Filing[]; errors: number; watched: number; briefs: number }> | null =
  null;
const summaryMemo = new Map<string, string>();
let grokDisabled = false;

type Recent = {
  form?: string[];
  filingDate?: string[];
  accessionNumber?: string[];
  primaryDocument?: string[];
  items?: string[];
};

const headers = {
  "User-Agent": USER_AGENT,
  Accept: "application/json, text/html;q=0.9, */*;q=0.8",
};

async function loadName(name: (typeof WATCHLIST)[number]): Promise<Filing[]> {
  const response = await fetch(`https://data.sec.gov/submissions/CIK${name.cik}.json`, {
    headers,
    signal: AbortSignal.timeout(20000),
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

async function pool<T>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<Filing[]>,
): Promise<{ filings: Filing[]; errors: number }> {
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

async function readCapped(response: Response, cap: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, cap);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  const merged = new Uint8Array(Math.min(total, cap));
  let offset = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.byteLength, merged.length - offset);
    if (take <= 0) break;
    merged.set(chunk.subarray(0, take), offset);
    offset += take;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

async function fetchDoc(url: string): Promise<string> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) return "";
  return readCapped(response, 420_000);
}

function archiveDir(url: string): string {
  const cut = url.lastIndexOf("/");
  return cut > 0 ? url.slice(0, cut) : url;
}

function exhibitScore(name: string, size: string | undefined): number {
  let score = Number(size) || 0;
  if (/991|99[-_.]?1(?!\d)/i.test(name)) score += 1_000_000;
  if (/992|99[-_.]?2(?!\d)/i.test(name)) score -= 400_000;
  return score;
}

async function findExhibit(filing: Filing): Promise<string | null> {
  if (!filing.form.startsWith("8-K")) return null;
  try {
    const response = await fetch(`${archiveDir(filing.url)}/index.json`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      directory?: { item?: { name?: string; size?: string }[] };
    };
    const items = body.directory?.item ?? [];
    const exhibits = items.filter((item) => {
      const name = item.name ?? "";
      return /\.(htm|html|txt)$/i.test(name) && /exhibit|ex[-_.]?99/i.test(name);
    });
    if (exhibits.length === 0) return null;
    exhibits.sort(
      (a, b) => exhibitScore(b.name ?? "", b.size) - exhibitScore(a.name ?? "", a.size),
    );
    const name = exhibits[0]?.name;
    return name ? `${archiveDir(filing.url)}/${encodeURIComponent(name)}` : null;
  } catch {
    return null;
  }
}

async function readBrief(filing: Filing): Promise<string> {
  try {
    const exhibit = await findExhibit(filing);
    const firstUrl = exhibit ?? filing.url;
    const first = briefFromText(await fetchDoc(firstUrl));
    if (first) return first;
    if (!exhibit) return "";
    return briefFromText(await fetchDoc(filing.url));
  } catch {
    return "";
  }
}

type PolishInput = { id: string; ticker: string; company: string; form: string; text: string };

async function polishWithGrok(items: PolishInput[]): Promise<Map<string, string> | null> {
  if (grokDisabled) return null;
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    grokDisabled = true;
    return null;
  }
  const payload = items
    .map(
      (item, index) =>
        `${index + 1}. id=${item.id} ${item.ticker} (${item.company}) ${item.form}\n${item.text}`,
    )
    .join("\n\n");
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You write two short sentences per SEC filing for an investor. Use only the excerpt. Do not invent figures or events. Reply with JSON only: {\"briefs\":[{\"id\":\"...\",\"text\":\"...\"}]}",
          },
          { role: "user", content: payload },
        ],
      }),
    });
    if (!response.ok) {
      grokDisabled = true;
      return null;
    }
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      grokDisabled = true;
      return null;
    }
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      briefs?: { id?: string; text?: string }[];
    };
    const out = new Map<string, string>();
    for (const brief of parsed.briefs ?? []) {
      const text = (brief.text ?? "").replace(/\s+/g, " ").trim();
      const id = brief.id ?? "";
      if (!id || text.length < 40 || text.length > 500) continue;
      out.set(id, text);
    }
    if (out.size === 0) {
      grokDisabled = true;
      return null;
    }
    return out;
  } catch {
    grokDisabled = true;
    return null;
  }
}

async function attachBriefs(filings: Filing[]): Promise<void> {
  for (const filing of filings) {
    const saved = summaryMemo.get(filing.id);
    if (saved) filing.summary = saved;
  }

  const stories = filings.filter((filing) => filing.form.startsWith("8-K"));
  let successes = 0;
  let attempts = 0;
  let index = 0;
  while (successes < BRIEF_COUNT && index < stories.length && attempts < 12) {
    const wave: Filing[] = [];
    while (wave.length < 3 && index < stories.length && attempts < 12) {
      const filing = stories[index]!;
      index += 1;
      if (filing.summary) {
        successes += 1;
        continue;
      }
      wave.push(filing);
      attempts += 1;
    }
    const results = await Promise.all(
      wave.map(async (filing) => ({ filing, summary: await readBrief(filing) })),
    );
    for (const { filing, summary } of results) {
      if (!summary) continue;
      summaryMemo.set(filing.id, summary);
      filing.summary = summary;
      successes += 1;
    }
  }

  const top = filings.filter((filing) => filing.summary).slice(0, BRIEF_COUNT);
  if (top.length === 0 || grokDisabled) return;
  const polished = await polishWithGrok(
    top.map((filing) => ({
      id: filing.id,
      ticker: filing.ticker,
      company: filing.company,
      form: filing.form,
      text: filing.summary ?? "",
    })),
  );
  if (!polished) return;
  for (const filing of top) {
    const text = polished.get(filing.id);
    if (!text) continue;
    summaryMemo.set(filing.id, text);
    filing.summary = text;
  }
}

async function loadDesk() {
  if (cache && Date.now() - cache.at < 3 * 60 * 1000) {
    return {
      filings: cache.filings,
      errors: cache.errors,
      watched: WATCHLIST.length,
      briefs: cache.filings.filter((filing) => filing.summary).length,
    };
  }
  const { filings, errors } = await pool(WATCHLIST, 6, loadName);
  filings.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.tier - b.tier));
  await attachBriefs(filings);
  cache = { at: Date.now(), filings, errors };
  return {
    filings,
    errors,
    watched: WATCHLIST.length,
    briefs: filings.filter((filing) => filing.summary).length,
  };
}

export const getFilings = createServerFn({ method: "GET" }).handler(async () => {
  if (!inflight) {
    inflight = loadDesk().finally(() => {
      inflight = null;
    });
  }
  return inflight;
});
