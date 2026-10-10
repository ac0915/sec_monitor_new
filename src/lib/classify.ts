export type Sentiment = "Good" | "Bad" | "Neutral";
export type Tier = 1 | 2 | 3;

export type Filing = {
  id: string;
  ticker: string;
  company: string;
  form: string;
  date: string;
  items: string;
  tier: Tier;
  sentiment: Sentiment;
  headline: string;
  reason: string;
  url: string;
};

const ITEM_COPY: Record<string, { sentiment: Sentiment; label: string }> = {
  "1.01": { sentiment: "Good", label: "Material agreement" },
  "1.02": { sentiment: "Bad", label: "Agreement terminated" },
  "1.03": { sentiment: "Bad", label: "Bankruptcy or receivership" },
  "2.01": { sentiment: "Good", label: "Acquisition or disposition" },
  "2.02": { sentiment: "Neutral", label: "Results of operations" },
  "2.03": { sentiment: "Neutral", label: "New financial obligation" },
  "2.04": { sentiment: "Bad", label: "Debt acceleration trigger" },
  "2.05": { sentiment: "Bad", label: "Exit or disposal costs" },
  "2.06": { sentiment: "Bad", label: "Material impairment" },
  "3.01": { sentiment: "Bad", label: "Delisting notice" },
  "4.01": { sentiment: "Neutral", label: "Accountant change" },
  "4.02": { sentiment: "Bad", label: "Non-reliance on prior financials" },
  "5.01": { sentiment: "Neutral", label: "Change in control" },
  "5.02": { sentiment: "Neutral", label: "Officer or director change" },
  "5.03": { sentiment: "Neutral", label: "Charter or bylaw change" },
  "5.07": { sentiment: "Neutral", label: "Shareholder vote" },
  "7.01": { sentiment: "Neutral", label: "Regulation FD disclosure" },
  "8.01": { sentiment: "Neutral", label: "Other events" },
  "9.01": { sentiment: "Neutral", label: "Financial exhibits" },
};

const TIER1_ITEMS = new Set(["1.01", "1.02", "1.03", "2.01", "2.02", "2.04", "2.05", "2.06", "4.02", "5.02"]);

function parseItems(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter((part) => /^\d+\.\d+$/.test(part));
}

export function classifyFiling(form: string, itemsRaw: string): Pick<Filing, "tier" | "sentiment" | "headline" | "reason"> {
  const formName = form.trim().toUpperCase();
  const items = parseItems(itemsRaw);
  const notes = items.map((item) => ITEM_COPY[item]).filter(Boolean);

  let sentiment: Sentiment = "Neutral";
  if (notes.some((note) => note.sentiment === "Bad")) sentiment = "Bad";
  else if (notes.some((note) => note.sentiment === "Good")) sentiment = "Good";

  let tier: Tier = 3;
  if (formName.startsWith("8-K") && items.some((item) => TIER1_ITEMS.has(item))) tier = 1;
  else if (formName.startsWith("8-K") || formName === "10-K" || formName === "10-Q" || formName.startsWith("DEF 14")) tier = 2;

  const lead = notes[0]?.label;
  const headline = lead
    ? `${formName} · ${lead}`
    : formName === "10-K"
      ? "Annual report filed"
      : formName === "10-Q"
        ? "Quarterly report filed"
        : formName.startsWith("8-K")
          ? "Current report"
          : `${formName} filing`;

  const reason =
    notes.length > 0
      ? notes.map((note) => note.label).join(" · ")
      : tier === 2
        ? "Periodic report on the watchlist. Read the filing before treating it as a trade signal."
        : "Routine disclosure. Tier 3 stays off the default alert path.";

  if (formName === "10-K" || formName === "10-Q") sentiment = "Neutral";

  return { tier, sentiment, headline, reason };
}

export function filingUrl(cik: string, accession: string, primary: string): string {
  const bare = cik.replace(/^0+/, "");
  const acc = accession.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${bare}/${acc}/${primary}`;
}
