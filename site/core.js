import { cheats } from "./data/cheats.js";
import { stores } from "./data/stores.js";
import {
  assassinations,
  tradeSteps,
  completionCategories,
  collectibles,
  hobbies,
  miscellaneous,
  properties,
  playbook,
} from "./data/story.js";
import { wildlife, missionGuides } from "./data/lists.js";
export const LEGACY_KEY = "glovebox.gta-v-ps5.v1";
export const STORAGE_KEY = "glovebox.gta-v-ps5.v2";
export const RECOVERY_KEY = STORAGE_KEY + ".unreadable";
export const categories = [
  "all",
  "player",
  "combat",
  "wanted",
  "vehicles",
  "world",
  "extras",
];
export const characters = ["M", "F", "T"];
const cheatIds = cheats.map((x) => x.id),
  storeIds = stores.map((x) => x.id);
const checkIds = [
  ...hobbies.flatMap((g) => g.items),
  ...miscellaneous,
  ...properties,
  ...wildlife,
  ...missionGuides,
  ...playbook,
].map((x) => x.id);
const moneyIds = assassinations.flatMap((m) =>
  tradeSteps(m)
    .filter((s) => !s.info)
    .flatMap((s) =>
      s.character
        ? characters.map((c) => `${m.id}-${s.id}-${c}`)
        : [`${m.id}-${s.id}`],
    ),
);
export function freshState() {
  return {
    version: 2,
    favorites: [],
    stores: [],
    method: "phone",
    recent: [],
    checks: [],
    money: [],
    progress: Object.fromEntries(completionCategories.map((c) => [c.id, 0])),
    collectibles: Object.fromEntries(collectibles.map((c) => [c.id, 0])),
    settings: { bawsaq: true, hiddenCharacters: [] },
    timer: null,
    prices: {},
    note: "",
    lastStore: "SR7",
    activeMoney: "hotel",
    lastRoute: "#/play",
    lastExportAt: 0,
    changes: 0,
  };
}
const object = (v) => v && typeof v === "object" && !Array.isArray(v);
const bounded = (v, max) =>
  Number.isFinite(Number(v))
    ? Math.max(0, Math.min(max, Math.trunc(Number(v))))
    : 0;
export function sanitizeState(v) {
  if (
    !object(v) ||
    ![1, 2].includes(v.version) ||
    !Array.isArray(v.favorites) ||
    !Array.isArray(v.stores)
  )
    throw new Error("Use a Glovebox v1 or v2 backup file.");
  let dropped = 0;
  const keep = (v, ids, max = 1000) => {
    const a = Array.isArray(v) ? v : [];
    const b = [
      ...new Set(a.filter((x) => typeof x === "string" && ids.includes(x))),
    ].slice(0, max);
    dropped += a.length - b.length;
    return b;
  };
  const s = freshState();
  s.favorites = keep(v.favorites, cheatIds);
  s.stores = keep(v.stores, storeIds);
  s.method = v.method === "pad" ? "pad" : "phone";
  if (v.version === 1) return { state: s, dropped };
  s.recent = keep(v.recent, cheatIds, 3);
  s.checks = keep(v.checks, checkIds);
  s.money = keep(v.money, moneyIds);
  for (const c of completionCategories)
    s.progress[c.id] = bounded(v.progress?.[c.id], c.total);
  for (const c of collectibles)
    s.collectibles[c.id] = bounded(v.collectibles?.[c.id], c.total);
  s.settings = {
    bawsaq: v.settings?.bawsaq !== false,
    hiddenCharacters: keep(v.settings?.hiddenCharacters, characters),
  };
  if (
    object(v.timer) &&
    ["running", "paused", "expired"].includes(v.timer.status)
  ) {
    const endsAt = Number(v.timer.endsAt),
      remainingMs = bounded(v.timer.remainingMs, 300000);
    if (
      v.timer.status === "running" &&
      Number.isFinite(endsAt) &&
      endsAt > 0 &&
      endsAt <= Date.now() + 301000
    )
      s.timer = { status: "running", endsAt, remainingMs: 0 };
    else if (v.timer.status !== "running")
      s.timer = { status: v.timer.status, endsAt: 0, remainingMs };
  }
  for (const m of assassinations)
    if (object(v.prices?.[m.id])) {
      s.prices[m.id] = {};
      for (const c of characters) {
        const p = v.prices[m.id][c];
        if (object(p))
          s.prices[m.id][c] = Object.fromEntries(
            ["cash", "buy", "sell"].map((k) => [
              k,
              typeof p[k] === "string" ? p[k].slice(0, 24) : "",
            ]),
          );
      }
    }
  s.note = typeof v.note === "string" ? v.note.slice(0, 3000) : "";
  s.lastStore = storeIds.includes(v.lastStore) ? v.lastStore : s.lastStore;
  s.activeMoney = assassinations.some((m) => m.id === v.activeMoney)
    ? v.activeMoney
    : "hotel";
  s.lastRoute =
    typeof v.lastRoute === "string" &&
    parseRoute(v.lastRoute)?.view !== "missing" &&
    v.lastRoute.startsWith("#/")
      ? v.lastRoute.slice(0, 400)
      : "#/play";
  s.lastExportAt = bounded(v.lastExportAt, Date.now());
  s.changes = bounded(v.changes, 1000000);
  return { state: s, dropped };
}
export function createStorage(getStorage) {
  let state = freshState(),
    storage = null,
    warning = "",
    recovery = "",
    raw = null;
  const memoryWarning =
    "Changes are staying in this tab because browser storage is unavailable. Export a backup in Settings before closing.";
  try {
    storage = getStorage();
    if (!storage) throw Error("Unavailable");
    raw = storage.getItem(STORAGE_KEY);
    recovery = storage.getItem(RECOVERY_KEY) || "";
    if (raw === null) raw = storage.getItem(LEGACY_KEY);
  } catch (e) {
    storage = null;
    warning = memoryWarning;
  }
  if (raw !== null)
    try {
      const clean = sanitizeState(JSON.parse(raw));
      state = clean.state;
      if (clean.dropped)
        warning = `Ignored ${clean.dropped} unknown or duplicate saved entries.`;
    } catch (e) {
      recovery = raw;
      try {
        if (!storage) throw Error("Unavailable");
        storage.setItem(RECOVERY_KEY, raw);
        warning =
          "Previous saved data could not be read. A recovery copy is available in Settings.";
      } catch (e) {
        storage = null;
        warning =
          "Previous saved data could not be backed up. The original is untouched; new changes stay in memory. Export before closing.";
      }
    }
  function persist() {
    if (storage)
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        storage = null;
        warning = memoryWarning;
      }
  }
  persist();
  return {
    get state() {
      return structuredClone(state);
    },
    get warning() {
      return warning;
    },
    get recovery() {
      return recovery;
    },
    save(next) {
      state = sanitizeState(next).state;
      persist();
      return this.state;
    },
    receive(raw) {
      try {
        state =
          raw === null ? freshState() : sanitizeState(JSON.parse(raw)).state;
        return true;
      } catch (e) {
        warning =
          "Another tab wrote unreadable saved data. Your current selections are still here; export a backup before reloading.";
        return false;
      }
    },
  };
}
export function parseRoute(hash) {
  if (!hash || hash === "#")
    return {
      view: "play",
      query: "",
      category: "all",
      filter: "all",
      region: "all",
    };
  if (!hash.startsWith("#/")) return null;
  const [path, query = ""] = hash.slice(2).split("?");
  let parts;
  try {
    parts = path.split("/").map(decodeURIComponent);
  } catch (e) {
    return { view: "missing" };
  }
  let [view, id, extra] = parts;
  const p = new URLSearchParams(query);
  if (view === "saved") {
    view = "cheats";
    p.set("c", "saved");
  }
  if (view === "guide") view = "about";
  if (view === "places") view = "stores";
  if (view === "100") view = "progress";
  if (
    extra ||
    ![
      "play",
      "cheats",
      "cheat",
      "stores",
      "store",
      "money",
      "progress",
      "wildlife",
      "missions",
      "properties",
      "crews",
      "about",
    ].includes(view) ||
    (["cheat", "store"].includes(view) ? !id : !!id)
  )
    return { view: "missing" };
  return {
    view,
    id,
    query: (p.get("q") || "").slice(0, 160),
    category: [...categories, "saved", "quick"].includes(p.get("c"))
      ? p.get("c")
      : "all",
    filter: ["todo", "done"].includes(p.get("f")) ? p.get("f") : "all",
    region: ["city", "west", "north", "east"].includes(p.get("r"))
      ? p.get("r")
      : "all",
  };
}
export function routeURL(view, params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  ).toString();
  return "#/" + view + (q ? "?" + q : "");
}
export const normalize = (v) =>
  String(v)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
function oneEdit(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0,
    j = 0,
    n = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++n > 1) return false;
    if (a.length >= b.length) i++;
    if (a.length <= b.length) j++;
  }
  return n + (i < a.length || j < b.length ? 1 : 0) <= 1;
}
export function searchItems(items, query) {
  const norm = normalize(query);
  const numeric = /^[\d\s-]+$/.test(query) && /\d/.test(query);
  const tokens = norm.split(/\s+/).filter(Boolean);
  return items
    .map((item, index) => {
      if (numeric && item.phone)
        return {
          item,
          index,
          score: item.phone
            .replace(/\D/g, "")
            .includes(query.replace(/\D/g, ""))
            ? 0
            : Infinity,
        };
      const text = normalize(
        [
          item.id,
          item.title,
          item.name,
          item.area,
          item.street,
          item.aliases,
          item.mnemonic,
          item.phone,
          item.effect,
          item.body,
        ]
          .filter(Boolean)
          .join(" "),
      );
      let score = 0;
      for (const token of tokens) {
        if (text.includes(token)) continue;
        if (
          /^[a-z]{5,}$/.test(token) &&
          text.split(" ").some((w) => oneEdit(token, w))
        )
          score += 10;
        else return { item, index, score: Infinity };
      }
      if (norm && normalize(item.title || item.name || "") === norm) score -= 2;
      return { item, index, score };
    })
    .filter((r) => Number.isFinite(r.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((r) => r.item);
}
export const chooseMethod = (c, p) =>
  p === "pad" && c.buttons?.length ? "pad" : "phone";
export function nextStore(id, done, onlyUndone = false, direction = 1) {
  const start = storeIds.indexOf(id);
  for (let i = 1; i <= storeIds.length; i++) {
    const next =
      storeIds[(start + direction * i + storeIds.length * 2) % storeIds.length];
    if (!onlyUndone || !done.includes(next)) return next;
  }
  return null;
}
export function completionPercent(progress) {
  const raw = completionCategories.reduce(
    (sum, c) => sum + (bounded(progress[c.id], c.total) / c.total) * c.weight,
    0,
  );
  return Math.floor((raw + 1e-9) * 10) / 10;
}
export function remainingTime(timer, now = Date.now()) {
  if (!timer) return 0;
  return timer.status === "running"
    ? Math.max(0, Math.min(300000, timer.endsAt - now))
    : timer.status === "paused"
      ? timer.remainingMs
      : 0;
}
export function parseCents(value) {
  const text = String(value)
    .trim()
    .replace(/^\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text))
    throw new Error("Enter a positive dollar amount, for example 1,234.56.");
  const [whole, part = ""] = text.replace(/,/g, "").split(".");
  const cents = Number(whole) * 100 + Number(part.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 214748364700)
    throw new Error("Use a value above zero and no more than $2,147,483,647.");
  return cents;
}
export function calculateTrade(cash, buy, sell) {
  const c = parseCents(cash),
    b = parseCents(buy),
    s = parseCents(sell),
    shares = Math.floor(c / b),
    unspent = c - shares * b,
    proceeds = shares * s + unspent;
  if (!Number.isSafeInteger(proceeds))
    throw new Error("That result is too large to calculate reliably.");
  return {
    shares,
    unspent: unspent / 100,
    profit: (proceeds - c) / 100,
    total: proceeds / 100,
    percent: ((s - b) / b) * 100,
    aboveCap: proceeds > 214748364700,
  };
}
export function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
