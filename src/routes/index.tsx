import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, ExternalLink, RefreshCw, Search, Sparkles } from "lucide-react";
import { getFilings, summarizeNew } from "@/lib/filings.functions";
import type { Filing, Sentiment, Tier } from "@/lib/classify";

const STORE = "sec-monitor-briefs";

export const Route = createFileRoute("/")({
  loader: () => getFilings(),
  component: Desk,
});

const TIERS: Array<Tier | "all"> = ["all", 1, 2, 3];
const MOODS: Array<Sentiment | "all"> = ["all", "Good", "Bad", "Neutral"];

function loadBriefs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function Desk() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [tier, setTier] = useState<Tier | "all">(1);
  const [mood, setMood] = useState<Sentiment | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [note, setNote] = useState("");
  const [briefs, setBriefs] = useState<Record<string, string>>({});

  useEffect(() => {
    setBriefs(loadBriefs());
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    return data.filings.filter((filing) => {
      if (tier !== "all" && filing.tier !== tier) return false;
      if (mood !== "all" && filing.sentiment !== mood) return false;
      if (!q) return true;
      return filing.ticker.includes(q) || filing.company.toUpperCase().includes(q) || filing.form.includes(q);
    });
  }, [data.filings, tier, mood, query]);

  const open = rows.find((filing) => filing.id === openId) ?? rows[0] ?? null;
  const counts = useMemo(() => count(data.filings), [data.filings]);
  const unseen = data.filings.filter((filing) => filing.tier <= 2 && !briefs[filing.id]).length;

  async function refresh() {
    setBusy(true);
    await router.invalidate();
    setBusy(false);
  }

  async function summarize() {
    const pending = data.filings
      .filter((filing) => filing.tier <= 2 && !briefs[filing.id])
      .slice(0, 4);
    if (pending.length === 0) {
      setNote("No new tier 1–2 filings to summarize.");
      return;
    }
    setSummarizing(true);
    setNote("");
    const result = await summarizeNew({
      data: {
        filings: pending.map((filing) => ({
          id: filing.id,
          ticker: filing.ticker,
          company: filing.company,
          form: filing.form,
          date: filing.date,
          items: filing.items,
          headline: filing.headline,
        })),
      },
    });
    setSummarizing(false);
    if (!result.ok && result.briefs.length === 0) {
      setNote(result.error);
      return;
    }
    const next = { ...briefs };
    for (const item of result.briefs) next[item.id] = item.sentence;
    setBriefs(next);
    localStorage.setItem(STORE, JSON.stringify(next));
    setNote(
      result.ok
        ? `Wrote ${result.briefs.length} new sentence${result.briefs.length === 1 ? "" : "s"}. Already-seen filings were skipped.`
        : result.error,
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">EDGAR desk</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sec Monitor</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            {data.watched} names. Each filing is summarized once. Press the button to write a sentence only for new tier
            1–2 filings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={summarize}
            disabled={summarizing}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
          >
            <Sparkles className="size-4" />
            {summarizing ? "Writing…" : `Summarize new (${unseen})`}
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-sm disabled:opacity-60"
          >
            <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
            Refresh tape
          </button>
        </div>
      </header>

      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="On tape" value={String(data.filings.length)} />
        <Stat label="Tier 1" value={String(counts.tier1)} />
        <Stat label="Adverse items" value={String(counts.bad)} tone="bad" />
        <Stat label="Constructive items" value={String(counts.good)} tone="good" />
      </section>

      {data.errors > 0 ? (
        <p className="mt-3 font-mono text-xs text-muted">{data.errors} names did not answer EDGAR this pass.</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TIERS.map((value) => (
            <Chip key={String(value)} active={tier === value} onClick={() => setTier(value)}>
              {value === "all" ? "All tiers" : `Tier ${value}`}
            </Chip>
          ))}
          <span className="mx-1 hidden w-px bg-line sm:inline-block" />
          {MOODS.map((value) => (
            <Chip key={value} active={mood === value} onClick={() => setMood(value)}>
              {value === "all" ? "Any read" : value}
            </Chip>
          ))}
        </div>
        <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3">
          <Search className="size-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ticker or name"
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted sm:w-52"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
          {rows.length === 0 ? (
            <li className="px-4 py-10 text-sm text-muted">Nothing in this cut of the tape.</li>
          ) : (
            rows.map((filing) => (
              <li key={filing.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(filing.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left ${open?.id === filing.id ? "bg-surface-2" : ""}`}
                >
                  <span className="mt-0.5 w-14 shrink-0 font-mono text-sm font-medium">{filing.ticker}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{briefs[filing.id] ?? filing.headline}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">
                      {filing.date} · {filing.form}
                      {briefs[filing.id] ? "" : " · not summarized"}
                    </span>
                  </span>
                  <Tone filing={filing} />
                </button>
              </li>
            ))
          )}
        </ul>

        <aside className="rounded-md border border-line bg-surface p-4 lg:sticky lg:top-4 lg:self-start">
          {open ? <Detail filing={open} sentence={briefs[open.id]} /> : <p className="text-sm text-muted">Select a filing.</p>}
        </aside>
      </div>
    </main>
  );
}

function count(filings: Filing[]) {
  return filings.reduce(
    (acc, filing) => {
      if (filing.tier === 1) acc.tier1 += 1;
      if (filing.sentiment === "Good") acc.good += 1;
      if (filing.sentiment === "Bad") acc.bad += 1;
      return acc;
    },
    { tier1: 0, good: 0, bad: 0 },
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-fg";
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <p className="font-mono text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-md border px-3 text-sm ${active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-fg"}`}
    >
      {children}
    </button>
  );
}

function Tone({ filing }: { filing: Filing }) {
  const color =
    filing.sentiment === "Good" ? "text-good" : filing.sentiment === "Bad" ? "text-bad" : "text-neutral";
  return (
    <span className={`shrink-0 font-mono text-xs ${color}`}>
      T{filing.tier} {filing.sentiment}
    </span>
  );
}

function Detail({ filing, sentence }: { filing: Filing; sentence?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted">
        <Activity className="size-4 text-accent" />
        <span className="font-mono text-xs tracking-wide uppercase">Tier {filing.tier}</span>
      </div>
      <h2 className="mt-2 text-xl font-semibold">
        {filing.ticker} <span className="font-normal text-muted">{filing.company}</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed">{filing.headline}</p>
      <p className="mt-3 text-sm leading-relaxed">{sentence ?? "No AI sentence yet. Use Summarize new — this filing is skipped once it has one."}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{filing.reason}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <dt className="text-muted">Filed</dt>
          <dd className="mt-1">{filing.date}</dd>
        </div>
        <div>
          <dt className="text-muted">Form</dt>
          <dd className="mt-1">{filing.form}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Items</dt>
          <dd className="mt-1">{filing.items || "—"}</dd>
        </div>
      </dl>
      <a
        href={filing.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm"
      >
        Open on EDGAR
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}