import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Activity, i as ExternalLink, n as Search, r as RefreshCw } from "../_libs/lucide-react.mjs";
import { n as Route } from "./router-D8JqBIUH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B0U_lZwz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TIERS = [
	"all",
	1,
	2,
	3
];
var MOODS = [
	"all",
	"Good",
	"Bad",
	"Neutral"
];
function Desk() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const [tier, setTier] = (0, import_react.useState)(1);
	const [mood, setMood] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const rows = (0, import_react.useMemo)(() => {
		const q = query.trim().toUpperCase();
		return data.filings.filter((filing) => {
			if (tier !== "all" && filing.tier !== tier) return false;
			if (mood !== "all" && filing.sentiment !== mood) return false;
			if (!q) return true;
			return filing.ticker.includes(q) || filing.company.toUpperCase().includes(q) || filing.form.includes(q);
		});
	}, [
		data.filings,
		tier,
		mood,
		query
	]);
	const open = rows.find((filing) => filing.id === openId) ?? rows[0] ?? null;
	const counts = (0, import_react.useMemo)(() => count(data.filings), [data.filings]);
	async function refresh() {
		setBusy(true);
		await router.invalidate();
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-[0.18em] text-accent uppercase",
						children: "EDGAR desk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-3xl font-semibold tracking-tight",
						children: "Sec Monitor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 max-w-xl text-sm leading-relaxed text-muted",
						children: [data.watched, " names. Live 8-K, 10-Q, and 10-K filings, scored into three tiers. Sentiment is a filing-item read, not a price call."]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: refresh,
					disabled: busy,
					className: "inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: busy ? "size-4 animate-spin" : "size-4" }), "Refresh tape"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "On tape",
						value: String(data.filings.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Tier 1",
						value: String(counts.tier1)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Adverse items",
						value: String(counts.bad),
						tone: "bad"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Constructive items",
						value: String(counts.good),
						tone: "good"
					})
				]
			}),
			data.errors > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 font-mono text-xs text-muted",
				children: [data.errors, " names did not answer EDGAR this pass."]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						TIERS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: tier === value,
							onClick: () => setTier(value),
							children: value === "all" ? "All tiers" : `Tier ${value}`
						}, String(value))),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-1 hidden w-px bg-line sm:inline-block" }),
						MOODS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: mood === value,
							onClick: () => setMood(value),
							children: value === "all" ? "Any read" : value
						}, value))
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Ticker or name",
						className: "w-40 bg-transparent text-sm outline-none placeholder:text-muted sm:w-52"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line overflow-hidden rounded-md border border-line bg-surface",
					children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-4 py-10 text-sm text-muted",
						children: "Nothing in this cut of the tape."
					}) : rows.map((filing) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setOpenId(filing.id),
						className: `flex w-full items-start gap-3 px-4 py-3 text-left ${open?.id === filing.id ? "bg-surface-2" : ""}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 w-14 shrink-0 font-mono text-sm font-medium",
								children: filing.ticker
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm",
									children: filing.headline
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-0.5 block font-mono text-xs text-muted",
									children: [
										filing.date,
										" · ",
										filing.form
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tone, { filing })
						]
					}) }, filing.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "rounded-md border border-line bg-surface p-4 lg:sticky lg:top-4 lg:self-start",
					children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, { filing: open }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Select a filing."
					})
				})]
			})
		]
	});
}
function count(filings) {
	return filings.reduce((acc, filing) => {
		if (filing.tier === 1) acc.tier1 += 1;
		if (filing.sentiment === "Good") acc.good += 1;
		if (filing.sentiment === "Bad") acc.bad += 1;
		return acc;
	}, {
		tier1: 0,
		good: 0,
		bad: 0
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-line bg-surface px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-xs tracking-wide text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `mt-1 font-mono text-2xl ${tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-fg"}`,
			children: value
		})]
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: `h-10 rounded-md border px-3 text-sm ${active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-fg"}`,
		children
	});
}
function Tone({ filing }) {
	const color = filing.sentiment === "Good" ? "text-good" : filing.sentiment === "Bad" ? "text-bad" : "text-neutral";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `shrink-0 font-mono text-xs ${color}`,
		children: [
			"T",
			filing.tier,
			" ",
			filing.sentiment
		]
	});
}
function Detail({ filing }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-xs tracking-wide uppercase",
				children: ["Tier ", filing.tier]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mt-2 text-xl font-semibold",
			children: [
				filing.ticker,
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-normal text-muted",
					children: filing.company
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed",
			children: filing.headline
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted",
			children: filing.reason
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-4 grid grid-cols-2 gap-3 font-mono text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Filed"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "mt-1",
					children: filing.date
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Form"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "mt-1",
					children: filing.form
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted",
						children: "Items"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1",
						children: filing.items || "—"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: filing.url,
			target: "_blank",
			rel: "noreferrer",
			className: "mt-5 inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm",
			children: ["Open on EDGAR", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4" })]
		})
	] });
}
//#endregion
export { Desk as component };
