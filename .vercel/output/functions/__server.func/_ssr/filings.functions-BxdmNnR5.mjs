import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/filings.functions-BxdmNnR5.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December|Oct\\.|Sept\\.";
var ABBR = [
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
	"L.L.C."
];
var BOILER = /forward-looking|safe harbor|securities act|exchange act|exchange commission|check the appropriate|emerging growth company|commission file|exact name of registrant|table of contents|shall not be deemed|incorporated by reference|incorporated herein|indicate by check|securities registered|principal executive|employer identification|telephone number|investor contact|media contact|https?:|thank you|cautionary|reconcil|united states securities|current report pursuant|referred to herein|hereinafter|title of each class|trading symbol|name of each exchange|inline xbrl|attached hereto|press release issued|cover page|interactive data file|exhibit no\b|\/s\/|please refer|additional information/i;
var FACT = /\$|\d|percent|%|\b(announc|report|elect|appoint|resign|retir|enter|acquir|divest|declar|increas|decreas|produc|deliver|deploy|approv|terminat|named|agree|complet|issued|impair|dividend|revenue|sales|were|was|expects|authoriz|will become|elected)\b/i;
function decodeEntities(raw) {
	return raw.replace(/&nbsp;|&#160;/gi, " ").replace(/&/gi, "&").replace(/"/gi, "\"").replace(/&#39;|'/gi, "'").replace(/</gi, "<").replace(/>/gi, ">").replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeChar(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, num) => safeChar(Number(num)));
}
function safeChar(code) {
	if (!Number.isFinite(code) || code < 1 || code > 65535) return " ";
	return String.fromCharCode(code);
}
function htmlToText(raw) {
	return decodeEntities(raw.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h[1-6]>/gi, " . ").replace(/<[^>]+>/g, " ")).replace(/\u00a0/g, " ").replace(/[\u2010\u2011\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, "\"").replace(/\*/g, "").replace(/\s+/g, " ").trim();
}
function protect(text) {
	let next = text.replace(/\b([A-Z])\.(?=\s+[A-Z])/g, "$1∯");
	for (const abbr of ABBR) next = next.replaceAll(abbr, abbr.replaceAll(".", "∯"));
	return next.replace(/(?<=\d)\.(?=\d)/g, "∯");
}
function restore(text) {
	return text.replaceAll("∯", ".");
}
function focusNarrative(text) {
	let next = text;
	if (/SECURITIES AND EXCHANGE COMMISSION/i.test(next.slice(0, 2500))) {
		const item = next.search(/Item\s+\d+\.\d+/i);
		if (item >= 0) next = next.slice(item).replace(/^Item\s+\d+\.\d+\s*/i, "");
	}
	next = next.replace(/^[\s\S]{0,240}?EX-99[\d.]*\s+Document\s+/i, "");
	next = next.replace(/\bExhibit\s+99[\d.]*\b/gi, " ");
	next = next.replace(/[•●▪◦]/g, " . ");
	next = next.replace(new RegExp(`\\s+(?!Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday\\b)([A-Z][A-Za-z]+,\\s+(?:[A-Z][A-Za-z.]{1,12},?\\s+)?[-]?\\s*(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4})`, "g"), " . $1");
	next = next.replace(/\s+(In the (?:first|second|third|fourth) quarter\b)/gi, " . $1");
	next = next.replace(new RegExp(`\\s+(On\\s+(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4}\\b)`, "g"), " . $1");
	return next.replace(/\s+/g, " ").trim();
}
function tighten(sentence) {
	if (sentence.split(/\s+/).length <= 42) return sentence;
	const match = sentence.match(/^(.{30,260}?\$\s?[\d,.]+\s*(?:billion|million)?)/);
	if (!match?.[1]) return "";
	const chunk = match[1].replace(/[\s,;:]+$/g, "");
	const count = chunk.split(/\s+/).length;
	if (count < 12 || count > 42) return "";
	return /[.!?]$/.test(chunk) ? chunk : `${chunk}.`;
}
function splitSentences(text) {
	const parts = protect(text).split(/(?<=[.!?])\s+(?=[A-Z("'])/);
	const sentences = [];
	for (const part of parts) {
		let sentence = restore(part).replace(/\s+/g, " ").replace(/^[\s.;:-]+|[\s.;:-]+$/g, "");
		sentence = sentence.replace(/^(?:\([a-z]\)|[a-z]\)|\d+\.)\s+/i, "");
		sentence = sentence.replace(/\s+,/g, ",").replace(/\s+\./g, ".").trim();
		if (!sentence) continue;
		sentences.push(/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
	}
	return sentences;
}
function acceptable(sentence) {
	const words = sentence.split(/\s+/);
	if (words.length < 8 || words.length > 42) return false;
	if (BOILER.test(sentence)) return false;
	if (/us-gaap|iso4217|xmlns|EX-99|Year-to-Date Results/i.test(sentence)) return false;
	if (/^item\s+\d/i.test(sentence)) return false;
	if (sentence.replace(/[^A-Za-z]/g, "").length < 30) return false;
	if ((sentence.match(/,/g) ?? []).length > 7) return false;
	const little = sentence.match(/\b(a|an|the|of|and|to|for|in|on|by|with|from|its|as|at|or|was|were|has|have|will|that)\b/gi);
	if (!little || little.length < 1) return false;
	if (!FACT.test(sentence)) return false;
	if (/\b(on|of|the|and|to|for|with|in|a|an|by|or|its)\.$/i.test(sentence)) return false;
	if (/\b(?:revenue|sales|eps|margin|profit)\s+\d{1,2}\s+(?:increased|decreased|rose|fell)\b/i.test(sentence)) return false;
	if (/:\s*\.\./.test(sentence)) return false;
	if (/\b[A-Z]\.$/.test(sentence)) return false;
	if (words.filter((word) => /^[A-Z]/.test(word)).length / words.length > .62) return false;
	return true;
}
function chooseBrief(sentences) {
	const leadAt = sentences.findIndex((sentence) => /today reported|today announced|announced today|has elected|approved certain officer/i.test(sentence));
	if (leadAt < 0) return sentences.slice(0, 2);
	const lead = sentences[leadAt];
	const after = sentences.slice(leadAt + 1, leadAt + 6);
	const earnings = /reported|announced/i.test(lead);
	const soonNumber = after.find((sentence) => /\$|percent|%/i.test(sentence));
	const second = (earnings ? soonNumber : after[0]) ?? after[0];
	return second ? [lead, second] : [lead];
}
/** Two short sentences lifted from the filing narrative, or "" if the text is only a cover page. */
function briefFromText(raw) {
	const focused = focusNarrative(raw.includes("<") ? htmlToText(raw) : raw).slice(0, 9e3);
	const unique = [];
	for (const sentence of splitSentences(focused)) {
		const tight = tighten(sentence);
		if (!tight || !acceptable(tight)) continue;
		if (unique.some((kept) => kept.slice(0, 48).toLowerCase() === tight.slice(0, 48).toLowerCase())) continue;
		unique.push(tight);
		if (unique.length === 8) break;
	}
	const picked = chooseBrief(unique);
	return picked.length === 2 ? picked.join(" ") : "";
}
var ITEM_COPY = {
	"1.01": {
		sentiment: "Good",
		label: "Material agreement"
	},
	"1.02": {
		sentiment: "Bad",
		label: "Agreement terminated"
	},
	"1.03": {
		sentiment: "Bad",
		label: "Bankruptcy or receivership"
	},
	"2.01": {
		sentiment: "Good",
		label: "Acquisition or disposition"
	},
	"2.02": {
		sentiment: "Neutral",
		label: "Results of operations"
	},
	"2.03": {
		sentiment: "Neutral",
		label: "New financial obligation"
	},
	"2.04": {
		sentiment: "Bad",
		label: "Debt acceleration trigger"
	},
	"2.05": {
		sentiment: "Bad",
		label: "Exit or disposal costs"
	},
	"2.06": {
		sentiment: "Bad",
		label: "Material impairment"
	},
	"3.01": {
		sentiment: "Bad",
		label: "Delisting notice"
	},
	"4.01": {
		sentiment: "Neutral",
		label: "Accountant change"
	},
	"4.02": {
		sentiment: "Bad",
		label: "Non-reliance on prior financials"
	},
	"5.01": {
		sentiment: "Neutral",
		label: "Change in control"
	},
	"5.02": {
		sentiment: "Neutral",
		label: "Officer or director change"
	},
	"5.03": {
		sentiment: "Neutral",
		label: "Charter or bylaw change"
	},
	"5.07": {
		sentiment: "Neutral",
		label: "Shareholder vote"
	},
	"7.01": {
		sentiment: "Neutral",
		label: "Regulation FD disclosure"
	},
	"8.01": {
		sentiment: "Neutral",
		label: "Other events"
	},
	"9.01": {
		sentiment: "Neutral",
		label: "Financial exhibits"
	}
};
var TIER1_ITEMS = /* @__PURE__ */ new Set([
	"1.01",
	"1.02",
	"1.03",
	"2.01",
	"2.02",
	"2.04",
	"2.05",
	"2.06",
	"4.02",
	"5.02"
]);
function parseItems(raw) {
	return raw.split(/[,;\s]+/).map((part) => part.trim()).filter((part) => /^\d+\.\d+$/.test(part));
}
function classifyFiling(form, itemsRaw) {
	const formName = form.trim().toUpperCase();
	const items = parseItems(itemsRaw);
	const notes = items.map((item) => ITEM_COPY[item]).filter(Boolean);
	let sentiment = "Neutral";
	if (notes.some((note) => note.sentiment === "Bad")) sentiment = "Bad";
	else if (notes.some((note) => note.sentiment === "Good")) sentiment = "Good";
	let tier = 3;
	if (formName.startsWith("8-K") && items.some((item) => TIER1_ITEMS.has(item))) tier = 1;
	else if (formName.startsWith("8-K") || formName === "10-K" || formName === "10-Q" || formName.startsWith("DEF 14")) tier = 2;
	const lead = notes[0]?.label;
	const headline = lead ? `${formName} · ${lead}` : formName === "10-K" ? "Annual report filed" : formName === "10-Q" ? "Quarterly report filed" : formName.startsWith("8-K") ? "Current report" : `${formName} filing`;
	const reason = notes.length > 0 ? notes.map((note) => note.label).join(" · ") : tier === 2 ? "Periodic report on the watchlist. Read the filing before treating it as a trade signal." : "Routine disclosure. Tier 3 stays off the default alert path.";
	if (formName === "10-K" || formName === "10-Q") sentiment = "Neutral";
	return {
		tier,
		sentiment,
		headline,
		reason
	};
}
function filingUrl(cik, accession, primary) {
	return `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${accession.replace(/-/g, "")}/${primary}`;
}
/** Zero-padded CIKs for the live EDGAR submissions API. */
var WATCHLIST = [
	{
		ticker: "AAPL",
		company: "Apple",
		cik: "0000320193"
	},
	{
		ticker: "MSFT",
		company: "Microsoft",
		cik: "0000789019"
	},
	{
		ticker: "NVDA",
		company: "NVIDIA",
		cik: "0001045810"
	},
	{
		ticker: "AMZN",
		company: "Amazon",
		cik: "0001018724"
	},
	{
		ticker: "GOOGL",
		company: "Alphabet",
		cik: "0001652044"
	},
	{
		ticker: "META",
		company: "Meta Platforms",
		cik: "0001326801"
	},
	{
		ticker: "TSLA",
		company: "Tesla",
		cik: "0001318605"
	},
	{
		ticker: "AVGO",
		company: "Broadcom",
		cik: "0001730168"
	},
	{
		ticker: "AMD",
		company: "Advanced Micro Devices",
		cik: "0000002488"
	},
	{
		ticker: "INTC",
		company: "Intel",
		cik: "0000050863"
	},
	{
		ticker: "NFLX",
		company: "Netflix",
		cik: "0001065280"
	},
	{
		ticker: "ORCL",
		company: "Oracle",
		cik: "0001341439"
	},
	{
		ticker: "CRM",
		company: "Salesforce",
		cik: "0001108524"
	},
	{
		ticker: "ADBE",
		company: "Adobe",
		cik: "0000796343"
	},
	{
		ticker: "QCOM",
		company: "Qualcomm",
		cik: "0000804328"
	},
	{
		ticker: "IBM",
		company: "IBM",
		cik: "0000051143"
	},
	{
		ticker: "JPM",
		company: "JPMorgan Chase",
		cik: "0000019617"
	},
	{
		ticker: "BAC",
		company: "Bank of America",
		cik: "0000070858"
	},
	{
		ticker: "GS",
		company: "Goldman Sachs",
		cik: "0000886982"
	},
	{
		ticker: "V",
		company: "Visa",
		cik: "0001403161"
	},
	{
		ticker: "MA",
		company: "Mastercard",
		cik: "0001141391"
	},
	{
		ticker: "UNH",
		company: "UnitedHealth",
		cik: "0000731766"
	},
	{
		ticker: "LLY",
		company: "Eli Lilly",
		cik: "0000059478"
	},
	{
		ticker: "JNJ",
		company: "Johnson & Johnson",
		cik: "0000200406"
	},
	{
		ticker: "PFE",
		company: "Pfizer",
		cik: "0000078003"
	},
	{
		ticker: "XOM",
		company: "Exxon Mobil",
		cik: "0000034088"
	},
	{
		ticker: "CVX",
		company: "Chevron",
		cik: "0000093410"
	},
	{
		ticker: "CAT",
		company: "Caterpillar",
		cik: "0000018230"
	},
	{
		ticker: "BA",
		company: "Boeing",
		cik: "0000012927"
	},
	{
		ticker: "GE",
		company: "GE Aerospace",
		cik: "0000040545"
	},
	{
		ticker: "HON",
		company: "Honeywell",
		cik: "0000773840"
	},
	{
		ticker: "DIS",
		company: "Walt Disney",
		cik: "0001744489"
	},
	{
		ticker: "WMT",
		company: "Walmart",
		cik: "0000104169"
	},
	{
		ticker: "COST",
		company: "Costco",
		cik: "0000909832"
	},
	{
		ticker: "HD",
		company: "Home Depot",
		cik: "0000354950"
	},
	{
		ticker: "KO",
		company: "Coca-Cola",
		cik: "0000021344"
	},
	{
		ticker: "PEP",
		company: "PepsiCo",
		cik: "0000077476"
	},
	{
		ticker: "NKE",
		company: "Nike",
		cik: "0000320187"
	},
	{
		ticker: "SBUX",
		company: "Starbucks",
		cik: "0000829224"
	},
	{
		ticker: "MCD",
		company: "McDonald's",
		cik: "0000063908"
	},
	{
		ticker: "PG",
		company: "Procter & Gamble",
		cik: "0000080424"
	},
	{
		ticker: "TXN",
		company: "Texas Instruments",
		cik: "0000097476"
	}
];
var USER_AGENT = "SecMonitorDesk/1.0 (research@secmonitor.app)";
var FORMS = /* @__PURE__ */ new Set([
	"8-K",
	"8-K/A",
	"10-K",
	"10-K/A",
	"10-Q",
	"10-Q/A"
]);
var PER_NAME = 4;
var BRIEF_COUNT = 5;
var cache = null;
var inflight = null;
var summaryMemo = /* @__PURE__ */ new Map();
var grokDisabled = false;
var headers = {
	"User-Agent": USER_AGENT,
	Accept: "application/json, text/html;q=0.9, */*;q=0.8"
};
async function loadName(name) {
	const response = await fetch(`https://data.sec.gov/submissions/CIK${name.cik}.json`, {
		headers,
		signal: AbortSignal.timeout(2e4)
	});
	if (!response.ok) throw new Error(`${name.ticker} ${response.status}`);
	const recent = (await response.json()).filings?.recent;
	if (!recent?.form) return [];
	const out = [];
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
			...scored
		});
	}
	return out;
}
async function pool(items, size, worker) {
	const filings = [];
	let errors = 0;
	let cursor = 0;
	async function next() {
		const index = cursor;
		cursor += 1;
		if (index >= items.length) return;
		try {
			filings.push(...await worker(items[index]));
		} catch {
			errors += 1;
		}
		await next();
	}
	await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => next()));
	return {
		filings,
		errors
	};
}
async function readCapped(response, cap) {
	const reader = response.body?.getReader();
	if (!reader) return (await response.text()).slice(0, cap);
	const chunks = [];
	let total = 0;
	while (total < cap) {
		const { done, value } = await reader.read();
		if (done || !value) break;
		chunks.push(value);
		total += value.byteLength;
	}
	await reader.cancel().catch(() => void 0);
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
async function fetchDoc(url) {
	const response = await fetch(url, {
		headers,
		signal: AbortSignal.timeout(2e4)
	});
	if (!response.ok) return "";
	return readCapped(response, 42e4);
}
function archiveDir(url) {
	const cut = url.lastIndexOf("/");
	return cut > 0 ? url.slice(0, cut) : url;
}
function exhibitScore(name, size) {
	let score = Number(size) || 0;
	if (/991|99[-_.]?1(?!\d)/i.test(name)) score += 1e6;
	if (/992|99[-_.]?2(?!\d)/i.test(name)) score -= 4e5;
	return score;
}
async function findExhibit(filing) {
	if (!filing.form.startsWith("8-K")) return null;
	try {
		const response = await fetch(`${archiveDir(filing.url)}/index.json`, {
			headers,
			signal: AbortSignal.timeout(15e3)
		});
		if (!response.ok) return null;
		const exhibits = ((await response.json()).directory?.item ?? []).filter((item) => {
			const name = item.name ?? "";
			return /\.(htm|html|txt)$/i.test(name) && /exhibit|ex[-_.]?99/i.test(name);
		});
		if (exhibits.length === 0) return null;
		exhibits.sort((a, b) => exhibitScore(b.name ?? "", b.size) - exhibitScore(a.name ?? "", a.size));
		const name = exhibits[0]?.name;
		return name ? `${archiveDir(filing.url)}/${encodeURIComponent(name)}` : null;
	} catch {
		return null;
	}
}
async function readBrief(filing) {
	try {
		const exhibit = await findExhibit(filing);
		const first = briefFromText(await fetchDoc(exhibit ?? filing.url));
		if (first) return first;
		if (!exhibit) return "";
		return briefFromText(await fetchDoc(filing.url));
	} catch {
		return "";
	}
}
async function polishWithGrok(items) {
	if (grokDisabled) return null;
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) {
		grokDisabled = true;
		return null;
	}
	const payload = items.map((item, index) => `${index + 1}. id=${item.id} ${item.ticker} (${item.company}) ${item.form}\n${item.text}`).join("\n\n");
	try {
		const response = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			signal: AbortSignal.timeout(12e3),
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .1,
				max_tokens: 500,
				messages: [{
					role: "system",
					content: "You write two short sentences per SEC filing for an investor. Use only the excerpt. Do not invent figures or events. Reply with JSON only: {\"briefs\":[{\"id\":\"...\",\"text\":\"...\"}]}"
				}, {
					role: "user",
					content: payload
				}]
			})
		});
		if (!response.ok) {
			grokDisabled = true;
			return null;
		}
		const raw = (await response.json()).choices?.[0]?.message?.content ?? "";
		const start = raw.indexOf("{");
		const end = raw.lastIndexOf("}");
		if (start < 0 || end <= start) {
			grokDisabled = true;
			return null;
		}
		const parsed = JSON.parse(raw.slice(start, end + 1));
		const out = /* @__PURE__ */ new Map();
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
async function attachBriefs(filings) {
	for (const filing of filings) {
		const saved = summaryMemo.get(filing.id);
		if (saved) filing.summary = saved;
	}
	const stories = filings.filter((filing) => filing.form.startsWith("8-K"));
	let successes = 0;
	let attempts = 0;
	let index = 0;
	while (successes < BRIEF_COUNT && index < stories.length && attempts < 12) {
		const wave = [];
		while (wave.length < 3 && index < stories.length && attempts < 12) {
			const filing = stories[index];
			index += 1;
			if (filing.summary) {
				successes += 1;
				continue;
			}
			wave.push(filing);
			attempts += 1;
		}
		const results = await Promise.all(wave.map(async (filing) => ({
			filing,
			summary: await readBrief(filing)
		})));
		for (const { filing, summary } of results) {
			if (!summary) continue;
			summaryMemo.set(filing.id, summary);
			filing.summary = summary;
			successes += 1;
		}
	}
	const top = filings.filter((filing) => filing.summary).slice(0, BRIEF_COUNT);
	if (top.length === 0 || grokDisabled) return;
	const polished = await polishWithGrok(top.map((filing) => ({
		id: filing.id,
		ticker: filing.ticker,
		company: filing.company,
		form: filing.form,
		text: filing.summary ?? ""
	})));
	if (!polished) return;
	for (const filing of top) {
		const text = polished.get(filing.id);
		if (!text) continue;
		summaryMemo.set(filing.id, text);
		filing.summary = text;
	}
}
async function loadDesk() {
	if (cache && Date.now() - cache.at < 18e4) return {
		filings: cache.filings,
		errors: cache.errors,
		watched: WATCHLIST.length,
		briefs: cache.filings.filter((filing) => filing.summary).length
	};
	const { filings, errors } = await pool(WATCHLIST, 6, loadName);
	filings.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : a.tier - b.tier);
	await attachBriefs(filings);
	cache = {
		at: Date.now(),
		filings,
		errors
	};
	return {
		filings,
		errors,
		watched: WATCHLIST.length,
		briefs: filings.filter((filing) => filing.summary).length
	};
}
var getFilings_createServerFn_handler = createServerRpc({
	id: "f429431baea15f184020b82cfc3737467386563dc2e803bb3019891ccce034ff",
	name: "getFilings",
	filename: "src/lib/filings.functions.ts"
}, (opts) => getFilings.__executeServer(opts));
var getFilings = createServerFn({ method: "GET" }).handler(getFilings_createServerFn_handler, async () => {
	if (!inflight) inflight = loadDesk().finally(() => {
		inflight = null;
	});
	return inflight;
});
//#endregion
export { getFilings_createServerFn_handler };
