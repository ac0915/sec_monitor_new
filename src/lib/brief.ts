const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December|Oct\\.|Sept\\.";
const ABBR = [
  "Inc.",
  "Corp.",
  "Ltd.",
  "U.S.",
  "N.Y.",
  "D.C.",
  "L.P.",
  "N.A.",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "No.",
  "Jr.",
  "Sr.",
  "Co.",
  "a.m.",
  "p.m.",
  "St.",
  "Sept.",
  "LLC.",
  "L.L.C.",
];

const BOILER =
  /forward-looking|safe harbor|securities act|exchange act|exchange commission|check the appropriate|emerging growth company|commission file|exact name of registrant|table of contents|shall not be deemed|incorporated by reference|incorporated herein|indicate by check|securities registered|principal executive|employer identification|telephone number|investor contact|media contact|https?:|thank you|cautionary|reconcil|united states securities|current report pursuant|referred to herein|hereinafter|title of each class|trading symbol|name of each exchange|inline xbrl|attached hereto|press release issued|cover page|interactive data file|exhibit no\b|\/s\/|please refer|additional information/i;

const FACT =
  /\$|\d|percent|%|\b(announc|report|elect|appoint|resign|retir|enter|acquir|divest|declar|increas|decreas|produc|deliver|deploy|approv|terminat|named|agree|complet|issued|impair|dividend|revenue|sales|were|was|expects|authoriz|will become|elected)\b/i;

function decodeEntities(raw: string): string {
  return raw
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"/gi, '"')
    .replace(/&#39;|'/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeChar(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => safeChar(Number(num)));
}

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code < 1 || code > 0xffff) return " ";
  return String.fromCharCode(code);
}

export function htmlToText(raw: string): string {
  const stripped = raw
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h[1-6]>/gi, " . ")
    .replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(stripped)
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010\u2011\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\*/g, "");
  return decoded.replace(/\s+/g, " ").trim();
}

function protect(text: string): string {
  let next = text.replace(/\b([A-Z])\.(?=\s+[A-Z])/g, "$1∯");
  for (const abbr of ABBR) next = next.replaceAll(abbr, abbr.replaceAll(".", "∯"));
  return next.replace(/(?<=\d)\.(?=\d)/g, "∯");
}

function restore(text: string): string {
  return text.replaceAll("∯", ".");
}

function focusNarrative(text: string): string {
  let next = text;
  if (/SECURITIES AND EXCHANGE COMMISSION/i.test(next.slice(0, 2500))) {
    const item = next.search(/Item\s+\d+\.\d+/i);
    if (item >= 0) next = next.slice(item).replace(/^Item\s+\d+\.\d+\s*/i, "");
  }
  next = next.replace(/^[\s\S]{0,240}?EX-99[\d.]*\s+Document\s+/i, "");
  next = next.replace(/\bExhibit\s+99[\d.]*\b/gi, " ");
  next = next.replace(/[•●▪◦]/g, " . ");
  next = next.replace(
    new RegExp(
      `\\s+(?!Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday\\b)([A-Z][A-Za-z]+,\\s+(?:[A-Z][A-Za-z.]{1,12},?\\s+)?[-]?\\s*(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4})`,
      "g",
    ),
    " . $1",
  );
  next = next.replace(/\s+(In the (?:first|second|third|fourth) quarter\b)/gi, " . $1");
  next = next.replace(
    new RegExp(`\\s+(On\\s+(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4}\\b)`, "g"),
    " . $1",
  );
  return next.replace(/\s+/g, " ").trim();
}

function tighten(sentence: string): string {
  const words = sentence.split(/\s+/);
  if (words.length <= 42) return sentence;
  const match = sentence.match(/^(.{30,260}?\$\s?[\d,.]+\s*(?:billion|million)?)/);
  if (!match?.[1]) return "";
  const chunk = match[1].replace(/[\s,;:]+$/g, "");
  const count = chunk.split(/\s+/).length;
  if (count < 12 || count > 42) return "";
  return /[.!?]$/.test(chunk) ? chunk : `${chunk}.`;
}

function splitSentences(text: string): string[] {
  const parts = protect(text).split(/(?<=[.!?])\s+(?=[A-Z("'])/);
  const sentences: string[] = [];
  for (const part of parts) {
    let sentence = restore(part).replace(/\s+/g, " ").replace(/^[\s.;:-]+|[\s.;:-]+$/g, "");
    sentence = sentence.replace(/^(?:\([a-z]\)|[a-z]\)|\d+\.)\s+/i, "");
    sentence = sentence.replace(/\s+,/g, ",").replace(/\s+\./g, ".").trim();
    if (!sentence) continue;
    sentences.push(/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
  }
  return sentences;
}

function acceptable(sentence: string): boolean {
  const words = sentence.split(/\s+/);
  if (words.length < 8 || words.length > 42) return false;
  if (BOILER.test(sentence)) return false;
  if (/us-gaap|iso4217|xmlns|EX-99|Year-to-Date Results/i.test(sentence)) return false;
  if (/^item\s+\d/i.test(sentence)) return false;
  const letters = sentence.replace(/[^A-Za-z]/g, "").length;
  if (letters < 30) return false;
  if ((sentence.match(/,/g) ?? []).length > 7) return false;
  const little = sentence.match(
    /\b(a|an|the|of|and|to|for|in|on|by|with|from|its|as|at|or|was|were|has|have|will|that)\b/gi,
  );
  if (!little || little.length < 1) return false;
  if (!FACT.test(sentence)) return false;
  if (/\b(on|of|the|and|to|for|with|in|a|an|by|or|its)\.$/i.test(sentence)) return false;
  if (/\b(?:revenue|sales|eps|margin|profit)\s+\d{1,2}\s+(?:increased|decreased|rose|fell)\b/i.test(sentence)) {
    return false;
  }
  if (/:\s*\.\./.test(sentence)) return false;
  if (/\b[A-Z]\.$/.test(sentence)) return false;
  const caps = words.filter((word) => /^[A-Z]/.test(word)).length;
  if (caps / words.length > 0.62) return false;
  return true;
}

function chooseBrief(sentences: string[]): string[] {
  const leadAt = sentences.findIndex((sentence) =>
    /today reported|today announced|announced today|has elected|approved certain officer/i.test(sentence),
  );
  if (leadAt < 0) return sentences.slice(0, 2);
  const lead = sentences[leadAt]!;
  const after = sentences.slice(leadAt + 1, leadAt + 6);
  const earnings = /reported|announced/i.test(lead);
  const soonNumber = after.find((sentence) => /\$|percent|%/i.test(sentence));
  const second = (earnings ? soonNumber : after[0]) ?? after[0];
  return second ? [lead, second] : [lead];
}

/** Two short sentences lifted from the filing narrative, or "" if the text is only a cover page. */
export function briefFromText(raw: string): string {
  const plain = raw.includes("<") ? htmlToText(raw) : raw;
  const focused = focusNarrative(plain).slice(0, 9000);
  const unique: string[] = [];
  for (const sentence of splitSentences(focused)) {
    const tight = tighten(sentence);
    if (!tight || !acceptable(tight)) continue;
    if (unique.some((kept) => kept.slice(0, 48).toLowerCase() === tight.slice(0, 48).toLowerCase())) {
      continue;
    }
    unique.push(tight);
    if (unique.length === 8) break;
  }
  const picked = chooseBrief(unique);
  return picked.length === 2 ? picked.join(" ") : "";
}
