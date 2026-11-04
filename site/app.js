import { cheats } from "./data/cheats.js";
import { stores, overview } from "./data/stores.js";
import { sources, checked } from "./data/sources.js";
import {
  parseRoute,
  routeURL,
  searchItems,
  chooseMethod,
  createStorage,
  sanitizeState,
  STORAGE_KEY,
} from "./core.js";

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const external = (url, label) =>
  `<a href="${escape(url)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a>`;
const sourceLinks = (ids) =>
  ids
    .map((id) => external(sources[id].url, escape(sources[id].name)))
    .join('<span aria-hidden="true"> / </span>');
const categoryNames = {
  quick: "Quick picks",
  all: "All",
  vehicles: "Vehicles",
  player: "Player",
  combat: "Combat",
  world: "World",
  wanted: "Wanted",
  extras: "Extras",
};
const storeRegionNames = {
  all: "All areas",
  city: "Los Santos",
  west: "West coast & hills",
  north: "Desert & north",
  east: "East coast",
};
const buttons = {
  cross: ["×", "Cross"],
  circle: ["○", "Circle"],
  square: ["□", "Square"],
  triangle: ["△", "Triangle"],
  left: ["←", "Left"],
  right: ["→", "Right"],
  up: ["↑", "Up"],
  down: ["↓", "Down"],
  l1: ["L1", "L1"],
  l2: ["L2", "L2"],
  r1: ["R1", "R1"],
  r2: ["R2", "R2"],
};
const storage = createStorage(
  () => window.localStorage,
  cheats.map((c) => c.id),
  stores.map((s) => s.id),
);
let state = storage.state;
let route = parseRoute(location.hash) || {
  view: "cheats",
  category: "quick",
  query: "",
};
let cheatListRoute = { view: "cheats", category: "quick", query: "" };
let storeListRoute = {
  view: "stores",
  query: "",
  filter: "all",
  region: "all",
};
let noticeTimer, announceTimer;
const listPositions = new Map();
function listKey(r) {
  if (r.view === "cheats")
    return routeURL("cheats", { c: r.category || "quick", q: r.query || "" });
  if (r.view === "stores")
    return routeURL("stores", {
      q: r.query || "",
      f: r.filter || "all",
      r: r.region || "all",
    });
  return r.view === "saved" ? "#/saved" : null;
}

function announce(message) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    $("#announcement").textContent = message;
  }, 150);
}
function toast(message) {
  clearTimeout(noticeTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  announce(message);
  noticeTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 3500);
}
function persist() {
  storage.save(state);
  showStorageWarning();
}
function showStorageWarning() {
  $("#storage-warning").hidden = !storage.warning;
  if ($("#storage-warning").textContent !== storage.warning)
    $("#storage-warning").textContent = storage.warning;
}
function methodSwitch() {
  return `<fieldset class="method-switch"><legend class="sr-only">Input method</legend>${[
    ["phone", "Phone"],
    ["pad", "Controller"],
  ]
    .map(
      ([id, text]) =>
        `<label><input type="radio" name="method" value="${id}" ${state.method === id ? "checked" : ""}><span>${text}</span></label>`,
    )
    .join("")}</fieldset>`;
}
function favoriteButton(cheat) {
  return `<button class="favorite" data-favorite="${cheat.id}" aria-label="Save ${escape(cheat.title)}" aria-pressed="${state.favorites.includes(cheat.id)}"><span aria-hidden="true">${state.favorites.includes(cheat.id) ? "★" : "☆"}</span></button>`;
}
function smallInput(cheat) {
  const method = chooseMethod(cheat, state.method);
  if (method === "phone")
    return `<span class="mini-phone">${cheat.phone}</span>${state.method === "pad" ? '<span class="tiny">Phone input</span>' : ""}`;
  return `<span class="mini-sequence"><span class="sr-only">${cheat.buttons.map((key) => buttons[key][1]).join(", ")}</span>${cheat.buttons.map((key) => `<span class="key-${key}" aria-hidden="true">${buttons[key][0]}</span>`).join("")}</span>${state.method === "phone" ? '<span class="tiny">Controller input · phone disputed</span>' : ""}`;
}
function cheatRows(items, activeId) {
  return items
    .map(
      (cheat) =>
        `<article class="cheat-row ${cheat.id === activeId ? "selected" : ""}"><a class="row-link" href="#/cheat/${cheat.id}"><span class="row-top"><span class="row-title">${escape(cheat.title)}</span>${cheat.unlock ? '<span class="tag">Unlock first</span>' : ""}</span>${smallInput(cheat)}${cheat.dispute ? '<span class="source-flag">Sources differ</span>' : ""}</a>${favoriteButton(cheat)}</article>`,
    )
    .join("");
}
function filteredCheats() {
  const r = cheatListRoute;
  // Searching always covers the full list, even from Quick picks.
  const pool = r.query
    ? cheats
    : cheats.filter(
        (c) =>
          r.category === "all" ||
          (r.category === "quick" ? c.quick : c.category === r.category),
      );
  return searchItems(pool, r.query || "");
}
function cheatListContent(activeId) {
  const list = filteredCheats();
  const query = cheatListRoute.query || "";
  const missing = /money|cash|tank|jet/i.test(query)
    ? `<aside class="note"><strong>No built-in ${/money|cash/i.test(query) ? "money" : "tank or jet spawn"} cheat.</strong> These are not hidden unlocks. See ${sourceLinks(["gtabase"])}.</aside>`
    : "";
  return `<div class="list-meta"><span>${list.length} ${query ? "matches · searching all cheats" : "cheats & extras"}</span><span>PS4 / PS5 inputs</span></div>${missing}${list.length ? cheatRows(list, activeId) : `<div class="empty"><h2>No matching cheats</h2><p>Nothing matched “${escape(query)}”. Try a vehicle, effect or code word.</p><button data-action="clear-cheat-search">Clear search</button></div>`}`;
}
function cheatDetail(cheat, standalone) {
  const method = chooseMethod(cheat, state.method);
  const fallback =
    method !== state.method
      ? `<div class="note">${cheat.dispute ? "Using the agreed " + (method === "pad" ? "controller sequence" : "phone number") + " because the other method is disputed." : "This entry is phone-only."}</div>`
      : "";
  const input =
    method === "phone"
      ? `<div class="phone-block"><span class="eyebrow">DIAL ON THE IN-GAME PHONE</span><div class="phone-number" id="phone-number" tabindex="-1" role="group" aria-label="Phone number ${cheat.phone}">${cheat.phone
          .split("-")
          .map(
            (group, i, groups) =>
              `<span class="${i < 2 ? "prefix" : ""}">${group}${i < groups.length - 1 ? '<span class="hyphen">-</span>' : ""}</span>`,
          )
          .join(
            "",
          )}</div><div class="phone-actions"><button class="primary" data-copy="${cheat.id}">Copy number <span aria-hidden="true">⧉</span></button><span class="mono">${cheat.mnemonic}</span></div><p class="tiny">Copying is a reference aid. Enter the number manually in GTA V.</p></div>`
      : `<div class="pad-block"><div class="input-label"><span class="eyebrow">ENTER LEFT TO RIGHT, ROW BY ROW</span><span class="tiny">${cheat.buttons.length} inputs</span></div><ol class="sequence" role="list">${cheat.buttons.map((key, i) => `<li class="input-tile key-${key}"><span class="sr-only">Step ${i + 1}:</span><span class="step" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="glyph" aria-hidden="true">${buttons[key][0]}</span><span class="key-name">${buttons[key][1]}</span></li>`).join("")}</ol><p class="tiny">Arrows = D-pad. Cross = the × button. Enter during gameplay, with the pause menu closed.</p></div>`;
  return `<section class="detail-panel" aria-label="Cheat details"><div class="detail-toolbar"><a class="back-link" href="${routeURL("cheats", { c: cheatListRoute.category, q: cheatListRoute.query })}">← All cheats</a>${favoriteButton(cheat)}</div><div class="detail-heading"><span class="eyebrow">${escape(categoryNames[cheat.category])} / ${cheat.unlock ? "UNLOCK REQUIRED" : "STORY MODE"}</span><${standalone ? "h1" : "h2"} tabindex="-1">${escape(cheat.title)}</${standalone ? "h1" : "h2"}><p>${escape(cheat.effect)}</p><a class="save-reminder" href="#/guide">Cheats temporarily disable trophies. Save first →</a></div>${cheat.unlock ? `<div class="unlock"><span aria-hidden="true">◇</span><div><strong>Unlock this vehicle first</strong><p>${escape(cheat.note)}</p></div></div>` : ""}${fallback}${input}${!cheat.unlock && cheat.note ? `<p class="usage-note">${escape(cheat.note)}</p>` : ""}${cheat.dispute ? `<details class="source-note"><summary>Why an input is withheld</summary><p>${escape(cheat.dispute)}</p></details>` : ""}<div class="entry-sources"><span class="eyebrow">CHECK THE SOURCES</span><div>${sourceLinks(cheat.sources)}</div><p>Source-checked ${checked} · not tested on a PS5.</p></div><a class="text-link" href="#/guide">How to enter cheats & protect a clean save →</a></section>`;
}
function cheatsView() {
  const standalone = route.view === "cheat";
  if (!standalone) cheatListRoute = { ...route };
  const selected = standalone
    ? cheats.find((c) => c.id === route.id)
    : filteredCheats()[0];
  if (standalone && !selected) return missingView();
  return `<div class="view ${standalone ? "detail-context" : ""}"><div class="page-heading"><div><span class="eyebrow">LOS SANTOS, AT YOUR FINGERTIPS</span><h1 tabindex="-1">Cheat sheet<span class="heading-count">${cheats.length}</span></h1><p>Phone numbers. PlayStation inputs. Straight to the good stuff.</p></div><a class="help-link" href="#/guide">Story Mode only<br><span>Save before using cheats →</span></a></div><div class="workspace"><section class="master" aria-label="Find a cheat"><div class="controls"><label class="search"><span aria-hidden="true">⌕</span><input id="cheat-search" type="search" maxlength="160" placeholder="Search cheats, vehicles, effects…" aria-label="Search all cheats" value="${escape(cheatListRoute.query || "")}"><kbd aria-hidden="true">/</kbd></label>${!standalone ? methodSwitch() : ""}<div class="chips" aria-label="Cheat categories">${Object.entries(
    categoryNames,
  )
    .map(
      ([id, title]) =>
        `<a href="${routeURL("cheats", { c: id })}" ${!cheatListRoute.query && cheatListRoute.category === id ? 'aria-current="true"' : ""}>${title}</a>`,
    )
    .join(
      "",
    )}</div></div><div id="cheat-list">${cheatListContent(selected?.id)}</div></section><div class="detail-column">${standalone ? `<div class="detail-method">${methodSwitch()}</div>` : ""}<div id="cheat-detail">${selected ? cheatDetail(selected, standalone) : '<aside class="detail-panel empty"><h2>Find your next code</h2><p>Search a vehicle or effect to see its inputs here.</p></aside>'}</div></div></div><div class="mode-note"><span aria-hidden="true">ⓘ</span><p>Built-in cheats are for <strong>GTA V Story Mode</strong>. They do not work in GTA Online. <a href="#/guide">Read the essentials</a></p></div></div>`;
}
function mapFigure(id, compact = false) {
  const store = stores.find((s) => s.id === id);
  const isOverview = id === "overview";
  const url = isOverview ? overview.image : store.image;
  return `<figure class="map-figure ${isOverview ? "overview-figure" : "closeup-figure"} ${compact ? "compact-map" : ""}"><div class="map-load" data-map="${id}" role="group" aria-label="${isOverview ? "Original overview map" : escape(store.area) + " map close-up"}"><p class="map-status">Loading map from ${isOverview ? "GosuNoob" : "Fiction Horizon"}…</p></div><figcaption><div><strong>${isOverview ? "The original overview" : `Close-up ${store.sequence} of 19`}</strong><span>${isOverview ? "GosuNoob · SR / PR labels" : `Fiction Horizon · overview marker ${store.id}`}</span></div><button data-open-map="${id}" aria-label="Enlarge ${isOverview ? "overview map" : escape(store.area) + " map"}">Enlarge ⤢</button></figcaption><div class="map-links">${external(url, "Open image")}${external(isOverview ? overview.source : sources.fictionhorizon.url, "Source page")}</div></figure>`;
}
function progress() {
  return `<div class="progress-line"><label for="store-progress"><strong>${state.stores.length} / 19</strong> checked <span>· this browser</span></label><progress id="store-progress" max="19" value="${state.stores.length}">${state.stores.length} of 19</progress></div>`;
}
function storeCheckbox(store, full = false) {
  return `<label class="store-check ${full ? "full-check" : ""}"><input type="checkbox" data-store-check="${store.id}" ${state.stores.includes(store.id) ? "checked" : ""}><span class="${full ? "" : "sr-only"}">${full ? "Mark this store checked" : "Mark " + store.id + " " + escape(store.area) + " checked"}</span></label>`;
}
function filteredStores() {
  const r = storeListRoute;
  return searchItems(
    stores.filter(
      (s) =>
        (r.region === "all" || !r.region || s.region === r.region) &&
        (r.filter === "done"
          ? state.stores.includes(s.id)
          : r.filter === "todo"
            ? !state.stores.includes(s.id)
            : true),
    ),
    r.query || "",
  );
}
function storeListContent(activeId) {
  const items = filteredStores();
  return `<div class="list-meta"><span>${items.length} stores</span><span>Original overview markers</span></div>${items.map((store) => `<article class="store-row ${activeId === store.id ? "selected" : ""}"><a class="store-row-link" href="#/store/${store.id}"><span class="exit-badge">${store.id}</span><span><strong>${escape(store.area)}</strong><small>${escape(store.name)} · ${escape(store.street)}</small></span><span class="chevron" aria-hidden="true">›</span></a>${storeCheckbox(store)}</article>`).join("") || `<div class="empty"><h2>No matching stores</h2><p>Try another area or show the full checklist.</p><button data-action="clear-store-search">Show all stores</button></div>`}`;
}
function storeDetail(store, standalone) {
  return `<section class="detail-panel store-detail"><div class="detail-toolbar"><a class="back-link" href="${routeURL("stores", { q: storeListRoute.query, f: storeListRoute.filter, r: storeListRoute.region })}">← All stores</a><span class="exit-badge">${store.id}</span></div><div class="detail-heading"><span class="eyebrow">${escape(store.name)} / ${escape(store.street)}</span><${standalone ? "h1" : "h2"} tabindex="-1">${escape(store.area)}</${standalone ? "h1" : "h2"}></div>${mapFigure(store.id)}<p class="pin-note"><span aria-hidden="true">⌖</span> Match the map around the central crosshair. Other POI markers in the screenshot belong to its author.</p>${storeCheckbox(store, true)}${store.note ? `<aside class="note"><strong>Location-name disagreement</strong><p>${escape(store.note)}</p></aside>` : ""}<details class="overview-details"><summary>Locate ${store.id} on the overview</summary><div data-deferred-overview></div></details><div class="entry-sources">${sourceLinks(["gosunoob", "fictionhorizon", "powerpyx"])}<p>Original game screenshots; no generated map coordinates. The screenshots show Xbox prompts—use the PS5 on-screen map legend.</p></div></section>`;
}
function storesView() {
  const standalone = route.view === "store";
  if (!standalone) storeListRoute = { ...route };
  const selected = standalone ? stores.find((s) => s.id === route.id) : null;
  if (standalone && !selected) return missingView();
  return `<div class="view stores-view ${standalone ? "detail-context" : ""}"><div class="page-heading"><div><span class="eyebrow">THE HOLD-UP ROUTE BOOK</span><h1 tabindex="-1">Store finder<span class="heading-count">${stores.length}</span></h1><p>Real map screenshots. Original markers. Your own checklist.</p></div><a class="help-link" href="#/guide">Map guide<br><span>How these labels work →</span></a></div><div class="workspace"><section class="master" aria-label="Find a store"><div class="controls"><label class="search"><span aria-hidden="true">⌕</span><input id="store-search" type="search" maxlength="160" aria-label="Search stores" placeholder="Area, street, or SR / PR marker…" value="${escape(storeListRoute.query || "")}"></label><div class="store-filters"><select id="store-region" aria-label="Store area">${Object.entries(
    storeRegionNames,
  )
    .map(
      ([id, title]) =>
        `<option value="${id}" ${storeListRoute.region === id ? "selected" : ""}>${title}</option>`,
    )
    .join(
      "",
    )}</select><select id="store-filter" aria-label="Checklist filter">${[
    ["all", "All stores"],
    ["todo", "To do"],
    ["done", "Checked"],
  ]
    .map(
      ([id, title]) =>
        `<option value="${id}" ${storeListRoute.filter === id ? "selected" : ""}>${title}</option>`,
    )
    .join(
      "",
    )}</select></div><div id="store-progress-area">${progress()}</div></div><div class="mobile-overview">${!standalone ? `<button type="button" class="overview-link" data-action="overview">⌖ Open the original overview map <span aria-hidden="true">⤢</span></button>` : ""}</div><div id="store-list">${storeListContent(selected?.id)}</div></section><div class="detail-column">${selected ? storeDetail(selected, true) : `<section class="detail-panel overview-panel"><div class="detail-heading"><span class="eyebrow">SAN ANDREAS / 19 STOPS</span><h2>Pick a store. Get your bearings.</h2><p>Select an area to see its exact in-game map close-up.</p></div>${mapFigure("overview")}<p class="tiny">SR = “store to rob”; PR = “place to rob”. Both label hold-up shops on this original map. Close-up numbers use a separate order.</p></section>`}</div></div><div class="mode-note"><span aria-hidden="true">ⓘ</span><p>This is a personal checklist of the 19 standard Story Mode hold-up shops, not a live game tracker. Checking all 19 is not required for the “hold up a store” part of 100% completion. ${sourceLinks(["powerpyx"])}</p></div></div>`;
}
function savedView() {
  const saved = cheats.filter((c) => state.favorites.includes(c.id));
  return `<div class="view saved-view"><div class="page-heading"><div><span class="eyebrow">YOUR PERSONAL SHORTLIST</span><h1 tabindex="-1">Saved for later<span class="heading-count">${saved.length}</span></h1><p>The good stuff, one tap away.</p></div>${methodSwitch()}</div><div class="saved-grid"><section><div class="section-label"><h2>Favorite cheats</h2><a href="#/cheats">Browse all →</a></div>${saved.length ? cheatRows(saved) : '<div class="empty"><span class="big-star" aria-hidden="true">☆</span><h2>Make this yours</h2><p>Tap the star beside a cheat to keep it here.</p><a class="button primary" href="#/cheats">Find a favorite →</a></div>'}</section><section class="saved-tools"><div class="panel"><span class="eyebrow">YOUR STORE RUN</span><h2>Keep your place.</h2>${progress()}<a class="button" href="#/stores?f=todo">Find an unchecked store →</a><p class="tiny">Saved in this browser only. There is no account or game sync. Clearing browser data can erase this checklist.</p></div><details class="backup"><summary>Back up or move your list</summary><p>Export a small text file, then paste its contents here on another browser. Import merges favorites and checked stores; it does not clear your existing list.</p><button data-action="export" class="primary">Export backup ↓</button>${storage.recovery ? '<aside class="note"><p>An older saved value could not be read. Its original contents are kept separately; this does not replace your current selections.</p><button data-action="export-recovery">Export recovery copy ↓</button></aside>' : ""}<label for="backup-text">Backup contents</label><textarea id="backup-text" rows="6" maxlength="50000" spellcheck="false" placeholder="Paste a Glovebox backup here"></textarea><button data-action="import">Merge backup</button><p id="backup-status" role="status"></p></details></section></div></div>`;
}
function guideView() {
  return `<div class="view guide-view"><div class="page-heading"><div><span class="eyebrow">READ ONCE. KEEP PLAYING.</span><h1 tabindex="-1">The essentials</h1><p>Getting codes in, finding stores, and knowing what to trust.</p></div><span class="checked-stamp">CHECKED<br><strong>${checked.toUpperCase()}</strong></span></div><div class="guide-grid"><section class="panel"><span class="eyebrow">01 / PLAYSTATION INPUTS</span><h2>Two ways to enter a cheat.</h2><h3>With the in-game phone</h3><ol class="howto"><li>D-pad <strong>Up</strong> to open the phone.</li><li>Open <strong>Contacts</strong>, then press <strong>Square</strong> for the keypad.</li><li>Enter the number. Press <strong>Square</strong> to call it.</li></ol><p>These are GTA V numbers. Use your character’s phone, not your real phone. The “Copy” button only copies text on this device.</p><h3>With the controller</h3><p>Close the pause menu and enter the sequence promptly during gameplay. Directions use the D-pad. Read across each row, then continue on the next; Cross means the × button.</p><p>${sourceLinks(["gtabase", "phoneGuide"])}</p></section><section class="panel"><span class="eyebrow">02 / SAVES & TROPHIES</span><h2>Keep a clean save.</h2><blockquote>“Saving is allowed when cheat codes are enabled but achievements are temporarily disabled.”<cite>${sourceLinks(["rockstar"])} · retrieved ${checked}</cite></blockquote><p>Rockstar says reloading a save or rebooting the console resets cheats. Re-entering a code usually turns it off, but there are exceptions. A mission can also disable free-roam cheats.</p><div class="note"><strong>Our suggestion</strong><p>Make a separate manual save before experimenting. Reload your clean save before returning to trophy or story progress.</p></div></section><section class="panel"><span class="eyebrow">03 / CHEAT DENIED?</span><h2>Check the situation.</h2><ul class="plain-list"><li><strong>Story Mode only.</strong> These codes do not activate in GTA Online.</li><li><strong>Finish the current mission or activity.</strong> Some cheats are unavailable in certain contexts.</li><li><strong>Give vehicles clear space.</strong> Buildings, interiors and cramped roads can prevent a spawn.</li><li><strong>Check the unlock badge.</strong> Dodo needs Sea Plane, Duke O’Death needs Duel, and Kraken needs the Wildlife Photography Challenge.</li><li><strong>Skyfall has its own restrictions.</strong> It is not a helicopter substitute; you cannot open a parachute during it.</li></ul><p>${sourceLinks(["rockstar", "gtabase"])}</p><p>No built-in money, tank or jet spawn code is included because none is published in the checked GTA V code lists.</p></section><section class="panel"><span class="eyebrow">04 / THE REAL MAPS</span><h2>Match the pin, not the numbering.</h2><p>The overview retains GosuNoob’s <strong>SR1–SR9</strong> and <strong>PR1–PR10</strong> labels. Fiction Horizon’s <strong>close-up 1–19</strong> is a different order. Every store detail shows both identifiers.</p><p>The central crosshair in a close-up is your target. Match nearby streets and coastline on your in-game map, then follow the PS5 map’s own Point of Interest control. Other pins and Xbox button prompts belong to the source screenshot.</p><p>The checklist does not add pins in GTA V. Images load from the original publishers and need an internet connection. If an embed fails, use its source link.</p><p>${sourceLinks(["gosunoob", "fictionhorizon", "powerpyx"])}</p></section><section class="panel wide"><span class="eyebrow">05 / THE HONEST BITS</span><h2>Source-checked. Not console-tested.</h2><p>Published guides make mistakes too. Inputs were compared across sources; no cheat was tested on a physical PS5 for this guide. These disagreements remain visible rather than being presented as settled facts.</p><div class="disputes"><div><strong>Fast run & drunk mode</strong><p>Published phone numbers conflict. Their agreed controller inputs remain available. A phone-keypad mnemonic is a useful typo check, not proof that a code activates in the game.</p></div><div><strong>Rapid GT</strong><p>One or two opening R2 presses? Published controller lists differ. The agreed phone number is shown instead.</p></div><div><strong>Strawberry & northwest-hills stores</strong><p>Street or district names conflict. Both retain the original screenshot and overview marker; the naming issue is explained on the store page.</p></div><div><strong>Corrections applied</strong><p>PCJ-600 and Sanchez codes are not swapped. Trashmaster keeps all seven digits after 1-999. The weapons cheat gives a loadout, not every weapon or infinite ammo.</p></div></div></section><section class="panel"><span class="eyebrow">06 / KEEP IT HANDY</span><h2>One tap from your phone.</h2><p>Bookmark this page or use your browser’s <strong>Add to Home Screen</strong> option. On iPhone, look in Safari’s Share menu; on Android, look in your browser’s menu. ${sourceLinks(["apple"])}</p><p>Favorites and the checklist are local to the browser you use. A Home Screen shortcut or another browser may have separate storage. Use <a href="#/saved">Saved → Back up or move your list</a> when switching.</p><p>There is no offline guarantee. Open the guide while connected; publisher-hosted maps can become unavailable.</p></section><section class="panel"><span class="eyebrow">07 / PRIVACY & CREDITS</span><h2>A small, independent guide.</h2><p>No accounts, analytics, advertising or tracking scripts. Your saved selections stay in browser storage unless you export them. GitHub serves the site; map requests go directly to the image publishers, which can receive standard request information.</p><p>Map art and game screenshots belong to their respective rights holders. They are embedded from the attributed publishers, not regenerated or included in this repository’s code license.</p><p>Barlow Condensed and Overpass Mono are self-hosted under the SIL Open Font License. The guide’s original code uses MIT.</p><p>Unofficial; not affiliated with Rockstar Games or Take-Two.</p></section><section class="panel wide"><span class="eyebrow">SOURCE REGISTER</span><h2>Follow the evidence.</h2><div class="source-register">${Object.values(
    sources,
  )
    .map(
      (s) =>
        `<div><h3>${external(s.url, escape(s.name))}</h3><p>${escape(s.scope)}</p></div>`,
    )
    .join(
      "",
    )}</div><p class="tiny">All sources accessed ${checked}. Agreement between websites is not the same as independent in-game testing. Store articles may share upstream information.</p></section></div></div>`;
}
function missingView() {
  return '<div class="view empty"><span class="eyebrow">WRONG TURN</span><h1 tabindex="-1">That page is not in the glovebox.</h1><p>The link may be incomplete or refer to a removed entry.</p><a class="button primary" href="#/cheats">Back to cheats →</a></div>';
}
function render({ focus = true } = {}) {
  const isCheat = ["cheats", "cheat"].includes(route.view),
    isStore = ["stores", "store"].includes(route.view);
  const view = isCheat ? "cheats" : isStore ? "stores" : route.view;
  $("#app").innerHTML = isCheat
    ? cheatsView()
    : isStore
      ? storesView()
      : route.view === "saved"
        ? savedView()
        : route.view === "guide"
          ? guideView()
          : missingView();
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const title =
    route.view === "cheat"
      ? cheats.find((c) => c.id === route.id)?.title
      : route.view === "store"
        ? stores.find((s) => s.id === route.id)?.area
        : {
            cheats: "Cheat sheet",
            stores: "Store finder",
            saved: "Saved",
            guide: "The essentials",
          }[view];
  document.title = `${title || "Page not found"} · Glovebox / GTA V`;
  mountMaps();
  showStorageWarning();
  if (focus) {
    const h =
      route.view === "cheat" || route.view === "store"
        ? $(".detail-panel h1") || $("#app h1")
        : $("#app h1");
    h?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
function mountMaps(root = document) {
  root.querySelectorAll("[data-map]").forEach((holder) => {
    if (holder.dataset.mounted) return;
    holder.dataset.mounted = "true";
    const id = holder.dataset.map;
    const data = id === "overview" ? overview : stores.find((s) => s.id === id);
    const img = new Image();
    img.width = data.width;
    img.height = data.height;
    img.alt =
      id === "overview"
        ? "Original GTA V overview map with SR1–SR9 and PR1–PR10 hold-up store labels."
        : `${data.name}, ${data.area}: original in-game map close-up ${data.sequence}, corresponding to overview marker ${id}. Locate the central crosshair.`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("load", () => {
      holder.querySelector(".map-status")?.remove();
      holder.classList.add("loaded");
    });
    img.addEventListener(
      "error",
      () => {
        img.remove();
        holder.classList.add("failed");
        holder.innerHTML = `<div class="map-error"><strong>Map didn’t load.</strong><p>The publisher may block embedding, or you may be offline.</p>${external(id === "overview" ? overview.source : sources.fictionhorizon.url, "Open source page")}<button data-retry-map="${id}">Retry image</button></div>`;
      },
      { once: true },
    );
    // Attach handlers before src: cached failures must be visible too.
    holder.append(img);
    img.src = data.image;
  });
  root.querySelectorAll(".overview-details").forEach((detail) =>
    detail.addEventListener(
      "toggle",
      () => {
        const holder = detail.querySelector("[data-deferred-overview]");
        if (detail.open && !holder.children.length) {
          holder.innerHTML = mapFigure("overview");
          mountMaps(holder);
        }
      },
      { once: true },
    ),
  );
}
function openMap(id) {
  const store = stores.find((s) => s.id === id);
  $("#map-title").textContent =
    id === "overview"
      ? "Original overview · SR / PR markers"
      : `${store.id} · ${store.area} · close-up ${store.sequence}`;
  $("#map-viewport").className = "map-viewport";
  document
    .querySelectorAll("[data-zoom]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.zoom === "fit"),
      ),
    );
  $("#map-viewport").innerHTML =
    `<div class="map-load" data-map="${id}"><p class="map-status">Loading original image…</p></div>`;
  $("#map-dialog").showModal();
  mountMaps($("#map-dialog"));
}
function updateSearch(view, value) {
  const leavingDetail = route.view === "cheat" || route.view === "store";
  const caret = document.activeElement?.selectionStart;
  const r = view === "cheats" ? cheatListRoute : storeListRoute;
  r.query = value;
  history.replaceState(
    null,
    "",
    routeURL(
      view,
      view === "cheats"
        ? { c: r.category, q: value }
        : { q: value, f: r.filter, r: r.region },
    ),
  );
  route = { ...r };
  if (leavingDetail) {
    render({ focus: false });
    const input = $(view === "cheats" ? "#cheat-search" : "#store-search");
    input.focus({ preventScroll: true });
    if (typeof caret === "number") input.setSelectionRange(caret, caret);
    announce(
      `${view === "cheats" ? filteredCheats().length : filteredStores().length} matching ${view}`,
    );
    return;
  }
  if (view === "cheats") {
    const selected = filteredCheats()[0];
    $("#cheat-list").innerHTML = cheatListContent(selected?.id);
    $("#cheat-detail").innerHTML = selected
      ? cheatDetail(selected, false)
      : '<aside class="detail-panel empty"><h2>No matching cheat</h2><p>Try a different search.</p></aside>';
    announce(`${filteredCheats().length} matching cheats`);
  } else {
    $("#store-list").innerHTML = storeListContent();
    announce(`${filteredStores().length} matching stores`);
  }
}

document.addEventListener("input", (event) => {
  if (event.target.id === "cheat-search")
    updateSearch("cheats", event.target.value);
  if (event.target.id === "store-search")
    updateSearch("stores", event.target.value);
});
document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.name === "method") {
    state.method = target.value;
    persist();
    render({ focus: false });
    document
      .querySelector(`input[name="method"][value="${state.method}"]`)
      ?.focus();
  }
  if (target.dataset.storeCheck) {
    const id = target.dataset.storeCheck;
    state.stores = target.checked
      ? [...new Set([...state.stores, id])]
      : state.stores.filter((value) => value !== id);
    persist();
    document.querySelectorAll(`[data-store-check="${id}"]`).forEach((input) => {
      input.checked = target.checked;
    });
    if ($("#store-progress-area"))
      $("#store-progress-area").innerHTML = progress();
    if (["todo", "done"].includes(storeListRoute.filter) && $("#store-list")) {
      $("#store-list").innerHTML = storeListContent(route.id);
      if (!target.isConnected) $("#store-filter")?.focus();
    }
    announce(
      `${id} ${target.checked ? "checked" : "unchecked"}. ${state.stores.length} of 19 checked.`,
    );
  }
  if (target.id === "store-filter" || target.id === "store-region") {
    const leavingDetail = route.view === "store";
    const oldY = window.scrollY;
    storeListRoute.filter = $("#store-filter").value;
    storeListRoute.region = $("#store-region").value;
    history.replaceState(
      null,
      "",
      routeURL("stores", {
        q: storeListRoute.query,
        f: storeListRoute.filter,
        r: storeListRoute.region,
      }),
    );
    route = { ...storeListRoute };
    if (leavingDetail) {
      render({ focus: false });
      document.getElementById(target.id)?.focus({ preventScroll: true });
      window.scrollTo({ top: oldY, behavior: "instant" });
    } else $("#store-list").innerHTML = storeListContent();
    announce(`${filteredStores().length} matching stores`);
  }
});
document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest(".row-link, .store-row-link");
    const key = listKey(route);
    if (link && key)
      listPositions.set(key, {
        y: window.scrollY,
        href: link.getAttribute("href"),
      });
  },
  true,
);
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a[data-action]");
  if (!target) return;
  if (target.dataset.favorite) {
    const id = target.dataset.favorite,
      present = state.favorites.includes(id);
    const favoriteIndex = [
      ...document.querySelectorAll("[data-favorite]"),
    ].indexOf(target);
    const oldY = window.scrollY;
    state.favorites = present
      ? state.favorites.filter((item) => item !== id)
      : [...state.favorites, id];
    persist();
    if (route.view === "saved") {
      render({ focus: false });
      const remaining = [...document.querySelectorAll("[data-favorite]")];
      (
        remaining[Math.min(favoriteIndex, remaining.length - 1)] ||
        $(".section-label a")
      )?.focus({ preventScroll: true });
      window.scrollTo({ top: oldY, behavior: "instant" });
    } else
      document.querySelectorAll(`[data-favorite="${id}"]`).forEach((button) => {
        button.setAttribute("aria-pressed", String(!present));
        button.innerHTML = `<span aria-hidden="true">${present ? "☆" : "★"}</span>`;
      });
    announce(
      `${cheats.find((c) => c.id === id).title} ${present ? "removed from" : "added to"} saved cheats.`,
    );
  }
  if (target.dataset.copy) {
    const cheat = cheats.find((c) => c.id === target.dataset.copy);
    const number = $("#phone-number");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(cheat.phone);
      toast("Number copied. Enter it on the in-game phone.");
    } catch {
      if (!number?.isConnected) {
        toast(`Copy unavailable. In-game number: ${cheat.phone}`);
        return;
      }
      const range = document.createRange();
      range.selectNodeContents(number);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      number.focus();
      toast(
        "Copy unavailable. Number selected—use your device’s Copy command.",
      );
    }
  }
  if (target.dataset.openMap) openMap(target.dataset.openMap);
  if (target.dataset.retryMap) {
    const holder = target.closest("[data-map]");
    delete holder.dataset.mounted;
    holder.classList.remove("failed");
    holder.innerHTML = '<p class="map-status">Retrying image…</p>';
    mountMaps(holder.parentElement);
  }
  if (target.dataset.zoom) {
    document
      .querySelectorAll("[data-zoom]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button === target)),
      );
    $("#map-viewport").className =
      `map-viewport ${target.dataset.zoom === "fit" ? "" : "zoom-" + target.dataset.zoom}`;
    $("#map-viewport").scrollTo(0, 0);
  }
  switch (target.dataset.action) {
    case "close-map":
      $("#map-dialog").close();
      break;
    case "overview":
      event.preventDefault();
      openMap("overview");
      break;
    case "clear-cheat-search":
      location.hash = "#/cheats?c=all";
      break;
    case "clear-store-search":
      location.hash = "#/stores";
      break;
    case "export-recovery":
    case "export": {
      const isRecovery = target.dataset.action === "export-recovery";
      const content = isRecovery
        ? storage.recovery
        : JSON.stringify(state, null, 2);
      $("#backup-text").value = content;
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = isRecovery
        ? "glovebox-recovery.txt"
        : "glovebox-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $("#backup-status").textContent =
        "Backup prepared for download. The same contents are in the box below if your browser cannot download it.";
      break;
    }
    case "import": {
      try {
        const raw = $("#backup-text").value;
        if (raw.length > 50000) throw new Error("Backup is too large.");
        const clean = sanitizeState(
          JSON.parse(raw),
          cheats.map((c) => c.id),
          stores.map((s) => s.id),
        );
        state.favorites = [
          ...new Set([...state.favorites, ...clean.state.favorites]),
        ];
        state.stores = [...new Set([...state.stores, ...clean.state.stores])];
        persist();
        render({ focus: false });
        $(".backup").open = true;
        $("#backup-status").textContent =
          `Backup merged. ${clean.dropped ? clean.dropped + " unknown or duplicate items skipped." : "All items recognized."}`;
        $("#backup-status").tabIndex = -1;
        $("#backup-status").focus();
      } catch (error) {
        $("#backup-status").textContent =
          error instanceof SyntaxError
            ? "That is not valid JSON. Paste the full contents of a Glovebox backup."
            : error.message;
      }
      break;
    }
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) &&
    !$("#map-dialog").open
  ) {
    const input = $("#cheat-search") || $("#store-search");
    if (input) {
      event.preventDefault();
      input.focus();
    }
  }
});
window.addEventListener("hashchange", () => {
  const next = parseRoute(location.hash);
  if (!next) return;
  if ($("#map-dialog").open) $("#map-dialog").close();
  const returning =
    (route.view === "cheat" && ["cheats", "saved"].includes(next.view)) ||
    (route.view === "store" && next.view === "stores");
  route = next;
  const position = returning ? listPositions.get(listKey(route)) : null;
  render({ focus: !position });
  if (position) {
    [...document.querySelectorAll(".row-link, .store-row-link")]
      .find((link) => link.getAttribute("href") === position.href)
      ?.focus({ preventScroll: true });
    requestAnimationFrame(() =>
      window.scrollTo({ top: position.y, behavior: "instant" }),
    );
  }
});
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  if (storage.receive(event.newValue)) {
    state = storage.state;
    const active = document.activeElement,
      oldY = window.scrollY;
    const draft = $("#backup-text")?.value,
      backupOpen = $(".backup")?.open;
    const selection = active?.selectionStart;
    render({ focus: false });
    if (draft !== undefined && $("#backup-text"))
      $("#backup-text").value = draft;
    if (backupOpen && $(".backup")) $(".backup").open = true;
    const replacement = active?.isConnected
      ? active
      : active?.id
        ? document.getElementById(active.id)
        : active?.dataset.favorite
          ? document.querySelector(
              `[data-favorite="${active.dataset.favorite}"]`,
            )
          : null;
    replacement?.focus({ preventScroll: true });
    if (replacement?.setSelectionRange && typeof selection === "number")
      replacement.setSelectionRange(selection, selection);
    window.scrollTo({ top: oldY, behavior: "instant" });
    announce("Saved selections updated from another tab.");
  }
  showStorageWarning();
});
render({ focus: false });
