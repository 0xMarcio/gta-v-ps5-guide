export const STORAGE_KEY = "glovebox.gta-v-ps5.v1";
export const RECOVERY_KEY = STORAGE_KEY + ".unreadable";
export const categories = [
  "quick",
  "all",
  "vehicles",
  "player",
  "combat",
  "world",
  "wanted",
  "extras",
];
export function parseRoute(hash) {
  if (!hash || hash === "#")
    return { view: "cheats", category: "quick", query: "" };
  if (!hash.startsWith("#/")) return null;
  const [path, search = ""] = hash.slice(2).split("?");
  let segments;
  try {
    segments = path.split("/").map(decodeURIComponent);
  } catch {
    return { view: "missing" };
  }
  const [view, id, extra] = segments;
  if (
    extra ||
    !["cheats", "cheat", "stores", "store", "saved", "guide"].includes(view)
  )
    return { view: "missing" };
  if (["cheat", "store"].includes(view) && !id) return { view: "missing" };
  if (!["cheat", "store"].includes(view) && id) return { view: "missing" };
  const params = new URLSearchParams(search);
  return {
    view,
    id,
    query: (params.get("q") || "").slice(0, 160),
    category: categories.includes(params.get("c")) ? params.get("c") : "quick",
    filter: ["todo", "done"].includes(params.get("f"))
      ? params.get("f")
      : "all",
    region: ["city", "west", "north", "east"].includes(params.get("r"))
      ? params.get("r")
      : "all",
  };
}
export function routeURL(view, params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  );
  const query = search.toString();
  return `#/${view}${query ? "?" + query : ""}`;
}
export const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export function searchItems(items, query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
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
        item.phone?.replace(/-/g, ""),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return tokens.every((token) => text.includes(token));
  });
}
export function chooseMethod(cheat, preferred) {
  if (preferred === "phone" && cheat.phone) return "phone";
  if (preferred === "pad" && cheat.buttons) return "pad";
  return cheat.phone ? "phone" : "pad";
}
export function sanitizeState(value, cheatIds, storeIds) {
  if (
    !value ||
    typeof value !== "object" ||
    value.version !== 1 ||
    !Array.isArray(value.favorites) ||
    !Array.isArray(value.stores)
  )
    throw new Error(
      "Backup format is not recognized. Use a Glovebox v1 backup.",
    );
  const keep = (list, ids) => [
    ...new Set(list.filter((id) => typeof id === "string" && ids.includes(id))),
  ];
  const favorites = keep(value.favorites, cheatIds),
    stores = keep(value.stores, storeIds);
  return {
    state: {
      version: 1,
      favorites,
      stores,
      method: value.method === "pad" ? "pad" : "phone",
    },
    dropped:
      value.favorites.length +
      value.stores.length -
      favorites.length -
      stores.length,
  };
}
export function createStorage(getStorage, cheatIds, storeIds) {
  let state = { version: 1, favorites: [], stores: [], method: "phone" },
    storage = null,
    warning = "",
    recovery = "",
    raw = null;
  try {
    storage = getStorage();
    if (!storage) throw new Error("Storage unavailable");
    raw = storage.getItem(STORAGE_KEY);
    recovery = storage.getItem(RECOVERY_KEY) || "";
  } catch {
    storage = null;
    warning =
      "Browser storage is unavailable. Changes last only until this page closes. Export a backup to keep them.";
  }
  if (raw) {
    try {
      const clean = sanitizeState(JSON.parse(raw), cheatIds, storeIds);
      state = clean.state;
      if (clean.dropped)
        warning = `${clean.dropped} unknown or duplicate saved items were removed.`;
    } catch {
      recovery = raw;
      // Preserve unreadable data before replacing it, including a newer schema.
      try {
        storage.setItem(RECOVERY_KEY, raw);
        warning =
          "Previous saved data could not be read. A recovery copy is available in Saved. New selections can be saved normally.";
      } catch {
        storage = null;
        warning =
          "Previous saved data could not be read or backed up. The original is untouched; new selections stay in memory. Export them before closing.";
      }
    }
  }
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      storage = null;
      warning =
        "Your browser cannot save changes. Selections stay in memory; export a backup before closing.";
    }
  }
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
    receive(raw) {
      if (!storage) return false;
      try {
        const clean =
          raw === null
            ? {
                state: {
                  version: 1,
                  favorites: [],
                  stores: [],
                  method: "phone",
                },
                dropped: 0,
              }
            : sanitizeState(JSON.parse(raw), cheatIds, storeIds);
        state = clean.state;
        warning = clean.dropped
          ? `${clean.dropped} unknown or duplicate saved items were ignored.`
          : "";
        return true;
      } catch {
        warning =
          "Another tab wrote unreadable saved data. Your current selections are still here; export a backup before reloading.";
        return false;
      }
    },
    save(next) {
      state = sanitizeState(next, cheatIds, storeIds).state;
      if (storage) {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          storage = null;
          warning =
            "Your browser could not save changes. This page keeps them in memory; export a backup before closing it.";
        }
      }
      return state;
    },
  };
}
export function t9(word) {
  return [...word.toUpperCase()]
    .map((char) => {
      const groups = ["ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
      if (/\d/.test(char)) return char;
      const i = groups.findIndex((group) => group.includes(char));
      if (i < 0) throw new Error(`Unsupported mnemonic character: ${char}`);
      return i + 2;
    })
    .join("");
}
