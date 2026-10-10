import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/filings.functions-DVEKTxHt.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var USER_AGENT = "SecMonitorDesk/1.0 research@example.com";
var FORMS = /* @__PURE__ */ new Set([
	"8-K",
	"8-K/A",
	"10-K",
	"10-K/A",
	"10-Q",
	"10-Q/A"
]);
var PER_NAME = 4;
var cache = null;
async function loadName(name) {
	const response = await fetch(`https://data.sec.gov/submissions/CIK${name.cik}.json`, { headers: {
		"User-Agent": USER_AGENT,
		Accept: "application/json"
	} });
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
var getFilings_createServerFn_handler = createServerRpc({
	id: "f429431baea15f184020b82cfc3737467386563dc2e803bb3019891ccce034ff",
	name: "getFilings",
	filename: "src/lib/filings.functions.ts"
}, (opts) => getFilings.__executeServer(opts));
var getFilings = createServerFn({ method: "GET" }).handler(getFilings_createServerFn_handler, async () => {
	if (cache && Date.now() - cache.at < 18e4) return {
		filings: cache.filings,
		errors: cache.errors,
		source: "cache",
		watched: WATCHLIST.length
	};
	const { filings, errors } = await pool(WATCHLIST, 8, loadName);
	filings.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : a.tier - b.tier);
	cache = {
		at: Date.now(),
		filings,
		errors
	};
	return {
		filings,
		errors,
		source: "live",
		watched: WATCHLIST.length
	};
});
//#endregion
export { getFilings_createServerFn_handler };
