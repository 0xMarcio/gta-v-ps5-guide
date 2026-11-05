import { cheats } from "./data/cheats.js";
import { stores } from "./data/stores.js";
import { sources } from "./data/sources.js";
import {
  assassinations,
  properties,
  completionCategories,
  collectibles,
  playbook,
  crews,
  hobbies,
  miscellaneous,
} from "./data/story.js";
import { wildlife, missionGuides } from "./data/lists.js";
import {
  createStorage,
  sanitizeState,
  STORAGE_KEY,
  parseRoute,
  searchItems,
  nextStore,
  remainingTime,
  calculateTrade,
  completionPercent,
  toggle,
  characters,
} from "./core.js";
import {
  esc,
  external,
  renderView,
  sourcesHTML,
  storeList,
  missionRows,
  padRun,
  phoneCode,
  moneyFormat,
} from "./views.js";
const app = document.querySelector("#app"),
  sheet = document.querySelector("#sheet"),
  big = document.querySelector("#big");
const db = createStorage(() => localStorage);
let state = db.state,
  route = parseRoute(location.hash) || { view: "play" },
  activeMoney = state.activeMoney;
let storeReturn = null,
  cheatReturn = null,
  cheatPosition = null,
  moneyTargetPending = false,
  undoAction = null,
  toastTimeout = null,
  activeBig = null,
  returnFocus = null,
  zoom = 1,
  priceCharacter = "M",
  priceMission = null,
  pendingImport = null;
let lastSessionKey = "";
let renderedView = null, renderedStore = null, wakeFromBig = false;
let wakeWanted = false,
  wakeSentinel = null,
  wakePending = false,
  wakeError = "";
const names = { M: "Michael", F: "Franklin", T: "Trevor" };
if (!location.hash || location.hash === "#")
  history.replaceState(null, "", state.lastRoute);
route = parseRoute(location.hash) || { view: "play" };
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function save(next, changed = true) {
  state = db.save({ ...next, changes: next.changes + (changed ? 1 : 0) });
  activeMoney = state.activeMoney;
  showWarning();
}
function change(fn, renderAfter = false) {
  const next = structuredClone(state);
  fn(next);
  save(next);
  if (renderAfter) render();
}
function showWarning() {
  const el = document.querySelector("#storage-warning");
  el.textContent = db.warning;
  el.hidden = !db.warning;
}
function toast(message, undo = null) {
  clearTimeout(toastTimeout);
  undoAction = undo;
  document.querySelectorAll("#toast, #big-status").forEach((host) => { host.hidden = true; });
  const el = big.open ? document.querySelector("#big-status") : document.querySelector("#toast");
  el.innerHTML = `<span>${esc(message)}</span>${undo ? '<button data-action="undo">Undo</button>' : ""}`;
  el.hidden = false;
  toastTimeout = setTimeout(
    () => {
      el.hidden = true;
      undoAction = null;
    },
    undo ? 8000 : 5000,
  );
}
function announce(message) {
  document.querySelector("#announcement").textContent = message;
}
function cheatRowPosition(row) {
  return row ? { id: row.dataset.cheat, group: row.dataset.group, top: row.getBoundingClientRect().top } : null;
}
function restoreCheatRow(position, focus = false) {
  const list = position && document.querySelector("#cheat-rows");
  if (!list) return false;
  const id = `[data-cheat="${CSS.escape(position.id)}"]`;
  const row = list.querySelector(`${id}[data-group="${CSS.escape(position.group)}"]`) || list.querySelector(id);
  if (!row) return false;
  scrollBy(0, row.getBoundingClientRect().top - position.top);
  if (focus) row.focus({ preventScroll: true });
  return true;
}
function go(hash, replace = false) {
  if (replace) {
    history.replaceState(null, "", hash);
    onRoute();
  } else if (location.hash === hash) onRoute();
  else location.hash = hash;
}
function onRoute() {
  const parsed = parseRoute(location.hash);
  if (!parsed) return;
  const previous = route;
  route = parsed;
  const sameCheatDesktop = matchMedia("(min-width: 701px)").matches &&
    ["cheat", "cheats"].includes(previous.view) && route.view === "cheat";
  const previousY = scrollY;
  if (!["store", "stores"].includes(route.view)) storeReturn = null;
  if (route.view === "store" && !["store", "stores"].includes(previous.view))
    storeReturn = null;
  if (!["cheat", "cheats"].includes(route.view)) cheatReturn = null;
  closeDialogs();
  if (route.view === "cheat" && cheats.some((c) => c.id === route.id))
    change((s) => {
      s.recent = [route.id, ...s.recent.filter((id) => id !== route.id)].slice(
        0,
        3,
      );
    }, false);
  if (route.view === "store" && stores.some((s) => s.id === route.id))
    change((s) => {
      s.lastStore = route.id;
    }, false);
  save({ ...state, lastRoute: location.hash }, false);
  render(false);
  let restored = false;
  if (previous.view === "store" && route.view === "stores" && storeReturn?.hash === location.hash) {
    window.scrollTo(0, storeReturn.y);
    document
      .querySelector(`[data-store="${storeReturn.id}"]`)
      ?.focus({ preventScroll: true });
    storeReturn = null;
    restored = true;
  } else if (previous.view === "cheat" && route.view === "cheats" && cheatReturn?.hash === location.hash) {
    window.scrollTo(0, cheatReturn.y);
    restored = restoreCheatRow(cheatReturn, true);
    cheatReturn = null;
  } else if (sameCheatDesktop) {
    window.scrollTo(0, previousY);
    restoreCheatRow(cheatPosition, true);
  }
  else if (previous.view !== "store" || route.view !== "store")
    window.scrollTo(0, 0);
  if (route.view === "store") {
    const viewer = document.querySelector(".viewer");
    if (!viewer?.contains(document.activeElement)) viewer?.focus({ preventScroll: true });
    const currentStore = stores.find((s) => s.id === route.id);
    if (currentStore) announce(`Store ${currentStore.sequence} of 19: ${currentStore.name}, ${currentStore.area}.`);
  }
  else if (!restored && !sameCheatDesktop)
    document.querySelector("#main").focus({ preventScroll: true });
  if (route.view === "money" && moneyTargetPending)
    document.querySelector(`[data-money-accordion="${activeMoney}"]`)?.scrollIntoView({ block: "start" });
  moneyTargetPending = false;
  cheatPosition = null;
  if (route.view === "progress" && route.query)
    document.querySelector(`[data-check="${CSS.escape(route.query)}"], [data-count][data-id="${CSS.escape(route.query)}"]`)?.closest(".check-row, .collector")?.scrollIntoView({ block: "center" });
}
function focusLocator(element) {
  const focusAttrs = ["action", "id", "delta", "kind", "count", "check", "money", "setting", "character", "zoom", "cheat", "group"];
  return element?.id ? `#${CSS.escape(element.id)}` :
    focusAttrs.filter((key) => element?.dataset[key] !== undefined)
      .map((key) => `[data-${key}="${CSS.escape(element.dataset[key])}"]`).join("");
}
function render(keepPanels = true) {
  const focus = document.activeElement;
  const focusSelector = focusLocator(focus);
  const openerSelector = app.contains(returnFocus) ? focusLocator(returnFocus) : null;
  const listAnchor = keepPanels && matchMedia("(min-width: 701px)").matches
    ? cheatRowPosition([...app.querySelectorAll("#cheat-rows [data-cheat]")].find((r) => r.getBoundingClientRect().top >= 150 && r.getBoundingClientRect().top < innerHeight)) : null;
  const panelKey = (d) => d.dataset.moneyAccordion || d.querySelector("summary")?.textContent.replace(/\d+\/\d+/g, "");
  const openPanels = keepPanels && renderedView === route.view
    ? [...app.querySelectorAll("details[open]:not([data-money-accordion])")].map(panelKey) : [];
  const stage = document.querySelector("#map-stage");
  const mapState = renderedStore === route.id && stage ? { zoom, left: stage.scrollLeft, top: stage.scrollTop } : null;
  document.body.dataset.view = route.view;
  document.body.classList.toggle("viewer-mode", route.view === "store");
  app.innerHTML = renderView(route, { ...state, activeMoney, cheatBack: cheatReturn?.hash });
  if (openerSelector) returnFocus = app.querySelector(openerSelector);
  app.querySelectorAll("details").forEach((d) => { if (openPanels.includes(panelKey(d))) d.open = true; });
  renderedView = route.view;
  renderedStore = route.view === "store" ? route.id : null;
  const active = ["cheat", "cheats"].includes(route.view)
    ? "cheats"
    : ["store", "stores"].includes(route.view)
      ? "stores"
      : ["money", "crews", "properties"].includes(route.view)
        ? "money"
        : ["progress", "wildlife", "missions"].includes(route.view)
          ? "progress"
          : "play";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const title =
    route.view === "cheat"
      ? cheats.find((c) => c.id === route.id)?.title
      : route.view === "store"
        ? stores.find((s) => s.id === route.id)?.area
        : {
            play: "Play",
            cheats: "Cheats",
            stores: "Places",
            money: "Stock trades",
            progress: "100%",
            wildlife: "Wildlife",
            crews: "Heist crews",
            properties: "Properties",
            missions: "Mission reference",
            about: "Sources",
          }[route.view];
  document.title = `${title || "Guide"} · Glovebox / PS5`;
  bindImage(mapState);
  showWarning();
  updateSession();
  updateWakeLabels();
  if (focusSelector && app.contains(focus) === false)
    app.querySelector(focusSelector)?.focus({ preventScroll: true });
  restoreCheatRow(listAnchor);
  if (route.view === "store" && document.activeElement === document.body)
    document.querySelector(".viewer")?.focus({ preventScroll: true });
}
function openSheet(title, html) {
  if (sheet.open) sheet.close();
  returnFocus = document.activeElement;
  document.querySelector("#sheet-title").textContent = title;
  document.querySelector("#sheet-body").innerHTML = html;
  sheet.showModal();
}
function closeDialogs() {
  returnFocus = document.querySelector("#main");
  if (sheet.open) sheet.close();
  if (big.open) big.close();
}
function restoreOpener() {
  const selector = focusLocator(returnFocus);
  let target = returnFocus?.isConnected ? returnFocus : selector ? document.querySelector(selector) : null;
  if (!target?.getClientRects().length) target = document.querySelector("#main");
  target?.focus({ preventScroll: true });
}
sheet.addEventListener("close", () => {
  pendingImport = null;
  restoreOpener();
});
big.addEventListener("close", () => {
  activeBig = null;
  if (wakeFromBig) { wakeFromBig = false; void setWake(false); }
  updateSession();
  restoreOpener();
});
function showSettings() {
  openSheet(
    "Make it yours",
    `
 <div class="setting"><div class="label">Input preference</div><label>Cheat method first <select id="preferred-method"><option value="phone" ${state.method === "phone" ? "selected" : ""}>Phone number</option><option value="pad" ${state.method === "pad" ? "selected" : ""}>Controller sequence</option></select></label><p>Both methods are always in the cheat detail.</p></div>
 <div class="setting"><button data-action="wake" class="full-width">Keep screen awake <span data-wake-label></span></button><p id="wake-description">${"wakeLock" in navigator ? "Works while this page is visible. Your browser may release it when you change apps." : "This browser cannot keep the screen on. Use Auto-Lock in your device settings."}</p></div>
 <div class="setting"><div class="label">Available characters for stock checklists</div><p>All three are available by default. Uncheck only a character you cannot currently play.</p>${characters.map((c) => `<label class="char-${c}"><input type="checkbox" data-character="${c}" ${!state.settings.hiddenCharacters.includes(c) ? "checked" : ""}/>${names[c]}</label>`).join("")}</div>
 <div class="setting"><h3>Keep your progress</h3><p>${state.favorites.length} pins · ${state.stores.length} stores · ${state.checks.length} task checks · ${state.money.length} trade checks. Saved on this device. Backups also include totals, price notes and your session note.</p><div class="inline-actions"><button class="primary" data-action="export">Export backup</button><button data-action="import">Import backup</button></div><p>${db.warning ? esc(db.warning) : "Local storage is working."} No account or game connection is needed.</p>${db.recovery ? '<button data-action="recovery">Download recovered old data</button>' : ""}</div>
 <div class="setting"><h3>Put it on your Home Screen</h3><p>iPhone: Share → Add to Home Screen. Android Chrome: menu → Add to Home screen. Keep a backup when switching browsers or devices.</p><a href="#/about">Sources & credits →</a></div>`,
  );
  updateWakeLabels();
}
function showSearch() {
  openSheet(
    "Find anything",
    `<div class="toolbar"><input id="global-search" type="search" placeholder="Cheat, stock, mission, animal, place…" aria-label="Search the whole guide" autocomplete="off"/></div><div id="global-results" class="search-results"><p class="meta">Try “repair”, “Vapid”, “Packie”, or a mission name.</p></div>`,
  );
  document.querySelector("#global-search").focus();
}
function searchAll(q) {
  if (!q.trim()) {
    document.querySelector("#global-results").innerHTML =
      '<p class="meta">Search cheats, maps, stocks, missions, activities and properties.</p>';
    return;
  }
  const entries = [
    ...cheats.map((c) => ({ ...c, url: `#/cheat/${c.id}`, kind: "Cheat" })),
    ...stores.map((s) => ({
      ...s,
      title: `${s.name} · ${s.area}`,
      url: `#/store/${s.id}`,
      kind: "Store map",
    })),
    ...playbook.map((t) => ({
      ...t,
      url: `#/play?q=${encodeURIComponent(t.title)}`,
      kind: "Playbook",
    })),
    ...crews.map((c) => ({ ...c, aliases: c.rows.flat().join(" "), url: `#/crews?q=${encodeURIComponent(c.title)}`, kind: "Heist crew" })),
    ...hobbies.flatMap((g) => g.items.map((item) => ({ ...item, aliases: g.title, url: `#/progress?q=${item.id}`, kind: g.title }))),
    ...miscellaneous.map((item) => ({ ...item, url: `#/progress?q=${item.id}`, kind: "100% activity" })),
    ...assassinations.map((m) => ({
      ...m,
      aliases: [m.before, m.after, m.rebound].flat().filter(Boolean).join(" "),
      url: "#/money",
      kind: "Stock plan",
      target: m.id,
    })),
    ...properties.map((p) => ({ ...p, url: "#/properties", kind: "Property" })),
    ...wildlife.map((a) => ({
      ...a,
      url: `#/wildlife?q=${encodeURIComponent(a.title)}`,
      kind: "Wildlife",
    })),
    ...collectibles.map((c) => ({
      ...c,
      url: `#/progress?q=${c.id}`,
      kind: "Collectibles",
    })),
    ...missionGuides.map((m) => ({ ...m, kind: "Mission walkthrough" })),
  ];
  const hits = searchItems(entries, q);
  document.querySelector("#global-results").innerHTML = hits.length
    ? `<p class="meta">${hits.length} results${hits.length > 30 ? " · first 30 shown" : ""}</p>${hits
        .slice(0, 30)
        .map(
          (h) =>
            `<a class="row" href="${esc(h.url)}" ${h.url.startsWith("https:") ? 'target="_blank" rel="noopener noreferrer"' : ""} ${h.target ? `data-money-target="${h.target}"` : ""}><span class="grow"><span class="row-title">${esc(h.title)}</span><small>${h.kind}${h.phone ? " · " + h.phone : ""}</small></span><span class="arrow">${h.url.startsWith("https:") ? "↗" : "→"}</span></a>`,
        )
        .join("")}`
    : `<p class="empty">No matches for “${esc(q)}”. Try a shorter name.</p>`;
}
function showBig(id) {
  const c = cheats.find((c) => c.id === id);
  if (!c) return;
  const opening = !big.open;
  const focusedAction = big.contains(document.activeElement)
    ? document.activeElement.dataset.action
    : null;
  if (opening) returnFocus = document.activeElement;
  activeBig = id;
  const pad = state.method === "pad" && c.buttons;
  const pinned = state.favorites.length > 1;
  big.innerHTML = `<div class="big-top"><div><div class="label">${c.mnemonic}</div><h2 id="big-title">${esc(c.title)}</h2></div><div class="inline-actions">${c.buttons ? `<button data-action="big-method">${pad ? "Phone" : "Controller"}</button>` : ""}<button data-action="close-big" aria-label="Close big view">✕</button></div></div><div class="big-code">${pad ? padRun(c) : phoneCode(c)}</div><div id="big-reminder" class="big-reminder"></div><div id="big-status" class="big-status" role="status" hidden></div><div class="bottom"><div class="inline-actions">${pinned ? '<button data-action="big-prev" aria-label="Previous pinned cheat">← Pin</button><button data-action="big-next" aria-label="Next pinned cheat">Pin →</button>' : ""}<button data-action="wake">Awake <span data-wake-label></span></button></div>${pad ? `<p class="mono">${c.phone}</p>` : "<p>Dial on the in-game phone.</p>"}</div>`;
  if (opening) {
    big.showModal();
    if ("wakeLock" in navigator && !wakeWanted) { wakeFromBig = true; void setWake(true); }
  } else if (focusedAction)
    big.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  updateWakeLabels();
  updateSession();
}
function download(text, name, type = "application/json") {
  const blob = new Blob([text], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportBackup(value = state, label = "backup") {
  download(
    JSON.stringify({ ...value, exportedAt: new Date().toISOString() }, null, 2),
    `glovebox-${label}-${new Date().toISOString().slice(0, 10)}.json`,
  );
  if (value === state)
    change((s) => {
      s.lastExportAt = Date.now();
    }, false);
}
function showImport() {
  openSheet(
    "Import your backup",
    `<p>Accepts the original v1 and current v2 backups. You’ll review the contents before replacing anything.</p><label class="check-row">Choose JSON file <input id="import-file" type="file" accept=".json,application/json"/></label><p class="meta">Or paste a backup:</p><textarea id="import-text" rows="6" aria-label="Backup JSON" spellcheck="false"></textarea><button data-action="import-preview" class="primary">Review import</button><div id="import-result" role="status"></div>`,
  );
}
function previewImport(raw) {
  try {
    if (raw.length > 300000)
      throw Error("This file is too large for a Glovebox backup.");
    const result = sanitizeState(JSON.parse(raw));
    pendingImport = result.state;
    document.querySelector("#import-result").innerHTML =
      `<div class="note-box"><p><strong>Ready to import</strong></p><p>${pendingImport.favorites.length} pins · ${pendingImport.stores.length} stores · ${pendingImport.checks.length} task checks · ${pendingImport.money.length} trade checks.</p><p>${result.dropped ? `${result.dropped} unknown or duplicate entries will be ignored. ` : ""}Applying downloads a backup of your current data first.</p><button class="primary" data-action="import-apply">Back up current & import</button></div>`;
  } catch (error) {
    pendingImport = null;
    document.querySelector("#import-result").textContent =
      `Could not import: ${error.message}`;
  }
}
function showPrices(id, char = priceCharacter) {
  priceMission = id;
  priceCharacter = char;
  const m = assassinations.find((x) => x.id === id),
    p = state.prices[id]?.[char] || {};
  openSheet(
    "Price notes & profit",
    `<div class="label">${esc(m.title)}</div><p>Enter one trade from your game. These are your notes, not live quotes. Replace them when you move to a rebound trade.</p><label>Portfolio <select id="price-character">${characters.map((c) => `<option value="${c}" ${char === c ? "selected" : ""}>${names[c]}</option>`).join("")}</select></label><div class="price-grid">${[
      ["cash", "Cash to invest"],
      ["buy", "Buy price"],
      ["sell", "Sell price"],
    ]
      .map(
        ([k, l]) =>
          `<label>${l}<input inputmode="decimal" type="text" data-price="${k}" value="${esc(p[k] || "")}" placeholder="${k === "cash" ? "1,000,000" : "100.00"}" autocomplete="off"/></label>`,
      )
      .join(
        "",
      )}</div><div id="price-result" aria-live="polite"></div><p class="meta">Whole shares, with leftover cash kept. The game’s $2,147,483,647 character balance limit is separate from the calculated trade value.</p>`,
  );
  calculatePrices();
}
function calculatePrices() {
  const p = state.prices[priceMission]?.[priceCharacter] || {},
    result = document.querySelector("#price-result");
  if (!result) return;
  if (!["cash", "buy", "sell"].every((k) => p[k]?.trim())) {
    result.innerHTML =
      '<p class="meta">Enter all three amounts to calculate. Notes save as you type.</p>';
    return;
  }
  try {
    const r = calculateTrade(p.cash, p.buy, p.sell);
    result.innerHTML = `<div class="calc-result"><p class="${r.profit < 0 ? "loss" : "gain"}"><strong>${r.profit < 0 ? "" : "+"}${moneyFormat(r.profit)} · ${r.percent.toFixed(2)}%</strong></p><p>${r.shares.toLocaleString("en-US")} shares · ${moneyFormat(r.unspent)} unspent</p><p>After sale: ${moneyFormat(r.total)}</p>${r.aboveCap ? '<p class="error">Above the game’s character balance limit; the full calculated amount cannot be retained.</p>' : ""}</div>`;
  } catch (error) {
    result.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  }
}
function startTimer() {
  change((s) => {
    s.timer = {
      status: "running",
      endsAt: Date.now() + 300000,
      remainingMs: 0,
    };
  });
  updateSession();
  toast(
    "5-minute reminder started. Pause it yourself when you pause the game.",
  );
}
function updateSession() {
  let t = state.timer;
  if (t?.status === "running" && remainingTime(t) === 0) {
    change((s) => {
      s.timer = { status: "expired", endsAt: 0, remainingMs: 0 };
    }, false);
    t = state.timer;
    announce("Invincibility reminder expired.");
  }
  const panel = document.querySelector("#session");
  panel.hidden = !t && !wakeWanted;
  document.documentElement.style.setProperty(
    "--bar",
    panel.hidden ? "0px" : "48px",
  );
  const seconds = Math.ceil(remainingTime(t) / 1000),
    clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  updateBigTimer(t, clock);
  const sessionKey = [
    t?.status || "",
    wakeWanted,
    !!wakeSentinel,
    wakePending,
    route.view,
  ].join("|");
  if (lastSessionKey === sessionKey) {
    const value = panel.querySelector(".timer-value");
    if (value) value.textContent = t?.status === "expired" ? "0:00" : clock;
    return;
  }
  lastSessionKey = sessionKey;
  const focusedAction = panel.contains(document.activeElement)
    ? document.activeElement.dataset.action
    : null;
  panel.innerHTML = `${t ? `<div class="inline-actions"><span class="timer-label">Invincibility reminder</span><span class="timer-value ${t.status === "expired" ? "loss" : ""}">${t.status === "expired" ? "0:00" : clock}</span><button data-action="timer-pause" aria-label="${t.status === "running" ? "Pause reminder" : t.status === "expired" ? "Restart reminder" : "Resume reminder"}">${t.status === "running" ? "Ⅱ" : t.status === "expired" ? "Restart" : "▶"}</button><button data-action="timer-stop" aria-label="Stop reminder">✕</button></div>` : ""}${wakeWanted ? `<button data-action="wake" class="awake-state">${wakeSentinel ? "☀ Awake" : "☀ " + (wakePending ? "Starting…" : "Paused")}</button>` : ""}${!["store", "money"].includes(route.view) ? '<button data-action="resume" class="resume-label">Resume cheat ↗</button>' : ""}`;
  if (focusedAction)
    panel
      .querySelector(`[data-action="${focusedAction}"]`)
      ?.focus({ preventScroll: true });
}
function updateBigTimer(timer, clock) {
  const host = big.querySelector("#big-reminder");
  if (!big.open || !host) return;
  const status = timer?.status || "off";
  if (host.dataset.status !== status) {
    const action = host.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    host.dataset.status = status;
    host.innerHTML = timer
      ? `<span class="meta">Invincibility reminder</span><strong class="big-time mono"></strong><button data-action="timer-pause">${status === "running" ? "Pause" : status === "expired" ? "Restart 5:00" : "Resume"}</button><button data-action="timer-stop">Stop</button>`
      : activeBig === "invincibility" ? '<button data-action="timer-start">Start 5:00 reminder</button>' : "";
    host.hidden = !timer && activeBig !== "invincibility";
    if (action) (host.querySelector(`[data-action="${action}"]`) || host.querySelector("button") || big.querySelector('[data-action="close-big"]'))?.focus({ preventScroll: true });
  }
  const value = host.querySelector(".big-time");
  if (value) value.textContent = status === "expired" ? "Expired" : clock;
}
setInterval(() => {
  if (state.timer) updateSession();
}, 1000);
async function setWake(want) {
  wakeWanted = want;
  wakeError = "";
  if (!want) {
    if (wakeSentinel) {
      const held = wakeSentinel;
      wakeSentinel = null;
      try {
        await held.release();
      } catch (error) {
        wakeError = error.name;
        toast(`Screen lock release: ${error.name}`);
      }
    }
    updateWakeLabels();
    updateSession();
    return;
  }
  if (!("wakeLock" in navigator)) {
    wakeWanted = false;
    toast(
      "This browser cannot keep the screen on. Use Auto-Lock in device settings.",
    );
    updateWakeLabels();
    return;
  }
  if (wakePending || wakeSentinel || document.visibilityState !== "visible")
    return;
  wakePending = true;
  updateSession();
  try {
    const held = await navigator.wakeLock.request("screen");
    if (!wakeWanted) {
      await held.release();
      return;
    }
    wakeSentinel = held;
    held.addEventListener("release", () => {
      if (wakeSentinel === held) wakeSentinel = null;
      updateWakeLabels();
      updateSession();
    });
  } catch (error) {
    wakeError = error.name;
    wakeWanted = false;
    toast(
      `Could not keep the screen awake: ${error.name}. Check browser or battery settings.`,
    );
  } finally {
    wakePending = false;
    updateWakeLabels();
    updateSession();
  }
}
function updateWakeLabels() {
  document.querySelectorAll("[data-wake-label]").forEach((e) => {
    e.textContent = wakeSentinel ? "· On" : wakeWanted ? "· Paused" : "· Off";
  });
  document.querySelectorAll('[data-action="wake"]').forEach((b) => {
    b.setAttribute("aria-pressed", String(!!wakeSentinel));
    if (!("wakeLock" in navigator)) {
      b.disabled = true;
      b.title = "Use Auto-Lock in system settings";
    }
  });
  const note = document.querySelector("#wake-description");
  if (note && wakeError)
    note.textContent = `Screen wake request failed: ${wakeError}. Use device Auto-Lock settings if needed.`;
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (state.timer) updateSession();
    if (wakeWanted && !wakeSentinel) void setWake(true);
  }
});
function bindImage(mapState = null) {
  zoom = mapState?.zoom || 1;
  const img = document.querySelector("#store-image");
  if (!img) return;
  const s = stores.find((s) => s.id === route.id);
  const loaded = () => {
    if (!img.isConnected) return;
    document.querySelector("#map-loading")?.setAttribute("hidden", "");
    const changed = document.querySelector("#map-changed");
    if (changed)
      changed.hidden =
        img.naturalWidth === s.width && img.naturalHeight === s.height;
    setZoom(zoom, false);
    if (mapState) requestAnimationFrame(() => {
      if (img.isConnected) document.querySelector("#map-stage")?.scrollTo(mapState.left, mapState.top);
    });
  };
  const failed = () => {
    if (!img.isConnected) return;
    document.querySelector("#map-stage").innerHTML =
      `<div class="map-error"><h2>The close-up didn’t load</h2><p>The image is hosted by Fiction Horizon. You can retry or open the original; store navigation still works.</p><div class="inline-actions"><button data-action="retry-map">Retry image</button>${external(s.image, "Original image")}${external(sources.fictionhorizon.url, "Publisher page")}</div></div>`;
  };
  img.addEventListener("load", loaded, { once: true });
  img.addEventListener("error", failed, { once: true });
  if (img.complete) {
    if (img.naturalWidth) loaded();
    else failed();
  }
  const strip = document.querySelector(".place-jumps");
  const selected = strip?.querySelector('[aria-current="location"]');
  if (selected) strip.scrollLeft = selected.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2;
}
function setZoom(n, center = true) {
  const stage = document.querySelector("#map-stage");
  if (!stage) return;
  zoom = Math.max(1, Math.min(3, n));
  stage.className = `map-stage${zoom > 1 ? " zoom-" + zoom : ""}`;
  if (zoom === 1) stage.scrollTo(0, 0);
  else if (center) requestAnimationFrame(() => {
    if (stage.isConnected) stage.scrollTo((stage.scrollWidth - stage.clientWidth) / 2, (stage.scrollHeight - stage.clientHeight) / 2);
  });
  document
    .querySelectorAll("[data-zoom]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.zoom) === zoom)),
    );
}
function markStore(id) {
  const previous = [...state.stores];
  change((s) => {
    s.stores = toggle(s.stores, id);
  }, true);
  toast(state.stores.includes(id) ? "Store checked" : "Store unchecked", () => {
    change((s) => {
      s.stores = previous;
    }, true);
  });
}
function doneNext() {
  if (state.stores.length === stores.length) {
    openSheet(
      "All 19 stores checked",
      `<p>Your store tour is complete. Start a fresh checklist whenever you like.</p><button class="primary" data-action="reset-stores">Reset store checks</button>`,
    );
    return;
  }
  const old = [...state.stores],
    id = route.id;
  change((s) => {
    if (!s.stores.includes(id)) s.stores.push(id);
  });
  const next = nextStore(id, state.stores, true);
  if (next) go(`#/store/${next}`, true);
  else render();
  toast(
    next ? "Checked. Next unchecked store." : "All 19 stores checked.",
    () => {
      change((s) => {
        s.stores = old;
      });
      go(`#/store/${id}`, true);
    },
  );
}
function setCount(kind, id, value, renderAfter = true) {
  const spec = (kind === "progress" ? completionCategories : collectibles).find(
    (x) => x.id === id,
  );
  if (!spec) return;
  const n = Number(value);
  change((s) => {
    s[kind][id] = Number.isFinite(n)
      ? Math.max(0, Math.min(spec.total, Math.trunc(n)))
      : 0;
  }, renderAfter);
}
function updateQuery(key, value) {
  const p = new URLSearchParams(location.hash.split("?")[1] || "");
  if (value) p.set(key, value);
  else p.delete(key);
  const path = location.hash.split("?")[0],
    q = p.toString();
  history.replaceState(null, "", path + (q ? "?" + q : ""));
  route = parseRoute(location.hash);
  save({ ...state, lastRoute: location.hash }, false);
}
document.addEventListener("click", async (e) => {
  const moneySummary = e.target.closest("[data-money-accordion] > summary");
  if (moneySummary && !moneySummary.parentElement.open) {
    change((s) => { s.activeMoney = moneySummary.parentElement.dataset.moneyAccordion; });
    const picker = document.querySelector("#money-jump");
    if (picker) picker.value = activeMoney;
  }
  const anchor = e.target.closest("a[href]");
  if (anchor) {
    if (anchor.dataset.cheat) {
      cheatPosition = cheatRowPosition(anchor);
      if (route.view === "cheats") cheatReturn = { hash: location.hash, y: scrollY, ...cheatPosition };
      else if (route.view === "cheat") {
        e.preventDefault();
        go(anchor.getAttribute("href"), true);
        return;
      }
    }
    if (anchor.hasAttribute("data-back-cheats") && cheatReturn) {
      e.preventDefault();
      history.back();
      return;
    }
    if (anchor.dataset.moneyTarget) {
      moneyTargetPending = true;
      activeMoney = anchor.dataset.moneyTarget;
      change((s) => {
        s.activeMoney = activeMoney;
      }, false);
    }
    if (anchor.dataset.store) {
      if (route.view === "stores")
        storeReturn = {
          hash: location.hash,
          y: scrollY,
          id: anchor.dataset.store,
        };
      else if (route.view === "store") {
        e.preventDefault();
        closeDialogs();
        go(anchor.getAttribute("href"), true);
        return;
      }
    }
    if (anchor.hasAttribute("data-back-stores") && storeReturn) {
      e.preventDefault();
      history.back();
      return;
    }
    if (anchor.getAttribute("href").startsWith("#/")) {
      closeDialogs();
      if (anchor.getAttribute("href") === location.hash) {
        render(!anchor.dataset.moneyTarget);
        if (anchor.dataset.moneyTarget)
          document
            .querySelector(`[data-money-accordion="${activeMoney}"]`)
            ?.scrollIntoView({ block: "start" });
        moneyTargetPending = false;
      }
    }
  }
  const z = e.target.closest("[data-zoom]");
  if (z) {
    setZoom(Number(z.dataset.zoom));
    return;
  }
  const button = e.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  switch (action) {
    case "search":
      showSearch();
      break;
    case "settings":
      showSettings();
      break;
    case "close-sheet":
      sheet.close();
      break;
    case "sources":
      openSheet("Sources", sourcesHTML(button.dataset.ids.split(",")));
      break;
    case "favorite":
      change((s) => {
        s.favorites = toggle(s.favorites, id);
      }, true);
      toast(
        state.favorites.includes(id) ? "Pinned for next time" : "Pin removed",
      );
      break;
    case "method":
      change((s) => {
        s.method = id;
      }, true);
      break;
    case "big":
      showBig(id);
      break;
    case "close-big":
      big.close();
      break;
    case "big-method":
      change((s) => {
        s.method = s.method === "phone" ? "pad" : "phone";
      });
      showBig(activeBig);
      render();
      break;
    case "big-next":
    case "big-prev": {
      const pins = state.favorites;
      const i = pins.indexOf(activeBig);
      showBig(
        pins[
          i < 0
            ? action === "big-next"
              ? 0
              : pins.length - 1
            : (i + (action === "big-next" ? 1 : -1) + pins.length) % pins.length
        ],
      );
      break;
    }
    case "check":
      change((s) => {
        s.checks = toggle(s.checks, id);
      }, true);
      break;
    case "pick-store":
      openSheet(
        "Jump to a store",
        storeList(
          { id: route.id, query: "", filter: "all", region: "all" },
          state,
          true,
        ),
      );
      break;
    case "store-prev":
    case "store-next":
      go(
        `#/store/${nextStore(route.id, state.stores, false, action === "store-next" ? 1 : -1)}`,
        true,
      );
      break;
    case "store-jump":
      go(`#/store/${id}`, true);
      break;
    case "store-toggle":
      markStore(id);
      break;
    case "store-next-undone":
      doneNext();
      break;
    case "retry-map":
      render();
      break;
    case "reset-stores": {
      const old = [...state.stores];
      change((s) => {
        s.stores = [];
      }, true);
      sheet.close();
      toast("Store checks reset", () =>
        change((s) => {
          s.stores = old;
        }, true),
      );
      break;
    }
    case "timer-start":
      startTimer();
      break;
    case "timer-stop":
      change((s) => {
        s.timer = null;
      });
      updateSession();
      break;
    case "timer-pause":
      if (state.timer?.status === "expired") startTimer();
      else
        change((s) => {
          s.timer =
            s.timer.status === "running"
              ? {
                  status: "paused",
                  endsAt: 0,
                  remainingMs: remainingTime(s.timer),
                }
              : {
                  status: "running",
                  endsAt: Date.now() + s.timer.remainingMs,
                  remainingMs: 0,
                };
        });
      updateSession();
      break;
    case "wake":
      wakeFromBig = false;
      await setWake(!wakeWanted);
      break;
    case "resume":
      if (route.view === "store" || route.view === "money")
        document.querySelector("#main").focus();
      else showBig(activeBig || state.recent[0] || "invincibility");
      break;
    case "undo": {
      const undo = undoAction;
      undoAction = null;
      document.querySelector("#toast").hidden = true;
      if (undo) undo();
      break;
    }
    case "prices":
      showPrices(id);
      break;
    case "reset-money": {
      const old = state.money.filter((k) => k.startsWith(id + "-"));
      change((s) => {
        s.money = s.money.filter((k) => !k.startsWith(id + "-"));
      }, true);
      toast("Trade checklist reset", () =>
        change((s) => {
          s.money = [...new Set([...s.money, ...old])];
        }, true),
      );
      break;
    }
    case "step":
      setCount(
        button.dataset.kind,
        id,
        (state[button.dataset.kind][id] || 0) + Number(button.dataset.delta),
      );
      break;
    case "export":
      exportBackup();
      toast("Backup downloaded");
      break;
    case "recovery":
      download(db.recovery, "glovebox-recovery.txt", "text/plain");
      break;
    case "import":
      showImport();
      break;
    case "import-preview":
      previewImport(document.querySelector("#import-text").value);
      break;
    case "import-apply": {
      if (!pendingImport) return;
      const previous = structuredClone(state),
        incoming = pendingImport;
      exportBackup(previous, "before-import");
      save(incoming);
      sheet.close();
      render();
      toast("Backup imported", () => {
        save(previous);
        render();
      });
      break;
    }
  }
});
document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.matches("[data-check]")) {
    change((s) => {
      s.checks = toggle(s.checks, el.dataset.check);
    });
    refreshCheckedCounts();
  }
  if (el.matches("[data-money]"))
    change((s) => {
      s.money = toggle(s.money, el.dataset.money);
    });
  if (el.matches("[data-count]"))
    setCount(el.dataset.count, el.dataset.id, el.value);
  if (el.matches("[data-setting]")) {
    change((s) => {
      s.settings[el.dataset.setting] = el.checked;
    });
    render();
  }
  if (el.matches("[data-character]")) {
    change((s) => {
      s.settings.hiddenCharacters = toggle(
        s.settings.hiddenCharacters,
        el.dataset.character,
      );
    });
    render();
  }
  if (el.id === "preferred-method") {
    change((s) => {
      s.method = el.value;
    }, true);
  }
  if (el.id === "cheat-category") {
    updateQuery("c", el.value);
    render();
  }
  if (el.id === "store-filter" || el.id === "store-region") {
    updateQuery(el.id === "store-filter" ? "f" : "r", el.value);
    render();
  }
  if (el.id === "money-jump") {
    activeMoney = el.value;
    change((s) => {
      s.activeMoney = activeMoney;
    }, true);
    document
      .querySelector(`[data-money-accordion="${activeMoney}"]`)
      ?.scrollIntoView({ block: "start" });
  }
  if (el.id === "price-character") showPrices(priceMission, el.value);
  if (el.id === "import-file" && el.files[0]) {
    try {
      if (el.files[0].size > 300000)
        throw Error("File too large. Choose a Glovebox JSON backup.");
      previewImport(await el.files[0].text());
    } catch (error) {
      document.querySelector("#import-result").textContent = error.message;
    }
  }
});
function refreshCheckedCounts() {
  const y = scrollY;
  render();
  scrollTo(0, y);
}
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "global-search") searchAll(el.value);
  if (el.matches("[data-count]")) {
    setCount(el.dataset.count, el.dataset.id, el.value, false);
    const total = document.querySelector(".completion-number");
    if (total)
      total.innerHTML =
        completionPercent(state.progress).toFixed(1) +
        '<span class="meta">%</span>';
    const bars = el.closest(".progress-row")?.querySelectorAll(".segbar span");
    bars?.forEach((bar, i) =>
      bar.classList.toggle("done", i < (state.progress[el.dataset.id] || 0)),
    );
  }
  if (el.id === "session-note") {
    change((s) => {
      s.note = el.value;
    });
    document.querySelector("#note-status").textContent = db.warning
      ? "Kept in this tab · export a backup"
      : "Saved locally";
  }
  if (el.matches("[data-price]")) {
    change((s) => {
      s.prices[priceMission] ??= {};
      s.prices[priceMission][priceCharacter] ??= {};
      s.prices[priceMission][priceCharacter][el.dataset.price] = el.value;
    });
    calculatePrices();
  }
  if (el.id === "cheat-search") {
    updateQuery("q", el.value);
    const parsed = new DOMParser().parseFromString(
      renderView(route, { ...state, activeMoney }),
      "text/html",
    );
    document.querySelector("#cheat-rows").innerHTML =
      parsed.querySelector("#cheat-rows").innerHTML;
    document.querySelector(".cheat-browser .detail").innerHTML =
      parsed.querySelector(".cheat-browser .detail").innerHTML;
  }
  if (el.id === "store-search") {
    updateQuery("q", el.value);
    document.querySelector("#store-rows").innerHTML = storeList(route, state);
  }
  if (el.id === "animal-search") {
    updateQuery("q", el.value);
    const parsed = new DOMParser().parseFromString(
      renderView(route, state),
      "text/html",
    );
    document.querySelector("#animal-rows").innerHTML =
      parsed.querySelector("#animal-rows").innerHTML;
  }
  if (el.id === "mission-search") {
    updateQuery("q", el.value);
    document.querySelector("#mission-rows").innerHTML = missionRows(
      el.value,
      state,
    );
  }
});
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = e.target.matches("input,textarea,select,[contenteditable]");
  if (typing) {
    if (e.key === "Enter" && e.target.id === "cheat-search") {
      document.querySelector("#cheat-rows a")?.click();
    }
    return;
  }
  if (e.key === "/" && !sheet.open && !big.open) {
    e.preventDefault();
    showSearch();
    return;
  }
  if (sheet.open || big.open) return;
  if (route.view === "store" && document.querySelector(".viewer")?.contains(e.target)) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (zoom > 1 && e.target.closest("#map-stage")) return;
      e.preventDefault();
      go(
        `#/store/${nextStore(route.id, state.stores, false, e.key === "ArrowLeft" ? -1 : 1)}`,
        true,
      );
    }
    if (e.key.toLowerCase() === "d") markStore(route.id);
    if (["+", "=", "-", "0"].includes(e.key)) {
      e.preventDefault();
      setZoom(e.key === "0" ? 1 : zoom + (e.key === "-" ? -1 : 1));
    }
    if (e.key === "Escape") go("#/stores");
  }
});
document.addEventListener("dblclick", (e) => {
  if (e.target.id === "store-image") setZoom(zoom === 1 ? 2 : 1);
});
window.addEventListener("hashchange", onRoute);
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY) return;
  if (db.receive(e.newValue)) {
    state = db.state;
    activeMoney = state.activeMoney;
    render();
    if (sheet.open)
      toast(
        "Saved data updated in another tab. Reopen this panel to see the latest values.",
      );
  }
  showWarning();
});
render();
