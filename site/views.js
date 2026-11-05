import { cheats } from "./data/cheats.js";
import { stores, overview } from "./data/stores.js";
import { sources, checked } from "./data/sources.js";
import {
  assassinations,
  tradeSteps,
  crews,
  properties,
  completionCategories,
  hobbies,
  miscellaneous,
  collectibles,
  playbook,
} from "./data/story.js";
import { wildlife, missionGuides } from "./data/lists.js";
import {
  searchItems,
  chooseMethod,
  completionPercent,
  characters,
} from "./core.js";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const external = (url, label, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
export const sourceButton = (ids) =>
  `<button class="source-link" data-action="sources" data-ids="${ids.join(",")}">Sources</button>`;
export const moneyFormat = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  }).format(n);
const titles = {
  player: "Player",
  combat: "Combat",
  wanted: "Wanted level",
  vehicles: "Vehicles",
  world: "World",
  extras: "Extras",
};
export const segbar = (done, total, current = -1) =>
  `<div class="segbar ${total > 20 ? "continuous" : ""}" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${(Array.isArray(done) ? done[i] : i < done) ? "done " : ""}${i === current ? "current" : ""}"></span>`).join("")}</div>`;
export const head = (title, sub = "", label = "") =>
  `<div class="page-head"><div>${label ? `<div class="label">${label}</div>` : ""}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
const section = (title, link = "") =>
  `<div class="section-head"><h2>${title}</h2>${link}</div>`;
const subnav = (active) =>
  `<nav class="subnav" aria-label="Money guides">${[
    ["money", "Stocks"],
    ["crews", "Heist crews"],
    ["properties", "Properties"],
  ]
    .map(
      ([r, l]) =>
        `<a href="#/${r}" ${r === active ? 'aria-current="page"' : ""}>${l}</a>`,
    )
    .join("")}</nav>`;
export function glyph(key) {
  const shapes = {
    circle: '<circle cx="20" cy="20" r="14"/>',
    cross: '<path d="M8 8 32 32M32 8 8 32"/>',
    triangle: '<path d="M20 5 36 33H4Z"/>',
    square: '<rect x="7" y="7" width="26" height="26"/>',
  };
  if (shapes[key])
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${shapes[key]}</svg>`;
  if (["up", "down", "left", "right"].includes(key)) {
    const arms = {
      up: "M14 2H26V14H14Z",
      down: "M14 26H26V38H14Z",
      left: "M2 14H14V26H2Z",
      right: "M26 14H38V26H26Z",
    };
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path class="dpad" d="M14 2H26V14H38V26H26V38H14V26H2V14H14Z"/><path class="pressed" d="${arms[key]}"/></svg>`;
  }
  return key.toUpperCase();
}
export function padRun(c) {
  return `<div class="pad-run" role="img" aria-label="${esc(c.buttons.map((k) => ({ cross: "Cross", circle: "Circle", triangle: "Triangle", square: "Square", up: "D-pad up", down: "D-pad down", left: "D-pad left", right: "D-pad right" })[k] || k.toUpperCase()).join(", "))}">${Array.from(
    { length: Math.ceil(c.buttons.length / 4) },
    (_, g) =>
      `<div class="pad-group" aria-hidden="true"><span class="group-index">${g * 4 + 1}</span>${c.buttons
        .slice(g * 4, g * 4 + 4)
        .map((k) => `<span class="key">${glyph(k)}</span>`)
        .join("")}</div>`,
  ).join("")}</div>`;
}
export const phoneCode = (c) =>
  `<div class="phone-code" aria-label="Phone code ${c.phone}"><span class="prefix">1-999-</span>${esc(c.phone.slice(6))}</div><div class="mnemonic">${esc(c.mnemonic)}</div>`;
export function cheatRow(c, state, selected = false, query = "") {
  return `<a class="row ${selected ? "selected" : ""}" href="#/cheat/${c.id}${query}" data-cheat="${c.id}"><span class="grow"><span class="row-title">${state.favorites.includes(c.id) ? '<span class="star" aria-label="Pinned">★</span> ' : ""}${esc(c.title)}</span><small>${esc(c.effect)}</small></span><span class="${chooseMethod(c, state.method) === "phone" ? "digits" : "meta"}">${chooseMethod(c, state.method) === "phone" ? esc(c.phone.slice(6)) : `${c.buttons.length} inputs ›`}</span></a>`;
}
export function cheatDetail(c, state) {
  const phone = `<div class="code-block"><div class="label">In-game phone</div>${phoneCode(c)}</div>`,
    pad = c.buttons
      ? `<div class="code-block"><div class="label">DualSense sequence</div>${padRun(c)}</div>`
      : "";
  return `<div class="heading"><div><div class="label">${titles[c.category]}${!c.buttons ? " · Phone only" : ""}</div><h2>${esc(c.title)}</h2></div><button data-action="favorite" data-id="${c.id}" aria-pressed="${state.favorites.includes(c.id)}" aria-label="${state.favorites.includes(c.id) ? "Unpin" : "Pin"} ${esc(c.title)}">${state.favorites.includes(c.id) ? "★" : "☆"}</button></div><p class="effect">${esc(c.effect)}</p><div class="inline-actions"><button class="primary" data-action="big" data-id="${c.id}">Big view ↗</button>${c.id === "invincibility" ? '<button data-action="timer-start">Start 5:00 reminder</button>' : ""}</div>${state.method === "pad" ? pad + phone : phone + pad}${c.note ? `<div class="condition">${esc(c.note)}${c.id === "kraken" ? ' <a href="#/wildlife">Open animal checklist →</a>' : ""}</div>` : ""}${sourceButton(c.sources)}`;
}
export function cheatsView(route, state) {
  const current = cheats.find((c) => c.id === route.id);
  if (route.view === "cheat" && !current) return missing();
  let list = searchItems(cheats, route.query || "");
  if (route.category === "saved")
    list = list.filter((c) => state.favorites.includes(c.id));
  else if (titles[route.category])
    list = list.filter((c) => c.category === route.category);
  const groups = [];
  const used = new Set();
  const add = (title, items) => {
    const rows = items.filter((c) => list.includes(c) && !used.has(c.id));
    if (rows.length) {
      rows.forEach((c) => used.add(c.id));
      groups.push(
        `<div class="section-label">${title}</div>${rows.map((c) => cheatRow(c, state, current?.id === c.id, "?" + new URLSearchParams({ c: route.category || "all", q: route.query || "" }))).join("")}`,
      );
    }
  };
  if (!route.query && route.category !== "saved") {
    add(
      "Pinned",
      state.favorites.map((id) => cheats.find((c) => c.id === id)),
    );
    add(
      "Recent",
      state.recent.map((id) => cheats.find((c) => c.id === id)),
    );
  }
  if (route.query || route.category === "saved")
    add(
      `${list.length} ${route.category === "saved" ? "pinned cheats" : "matches"}`,
      list,
    );
  else
    for (const [id, title] of Object.entries(titles))
      add(
        title,
        cheats.filter((c) => c.category === id),
      );
  const detail =
    current ||
    (route.query || !["all", "quick", undefined].includes(route.category)
      ? list[0]
      : cheats.find((c) => c.id === state.favorites[0]) ||
        cheats.find((c) => c.id === "buzzard"));
  return `${route.view === "cheat" ? '<div class="desktop-only">' : ""}${head("Cheats", "36 phone codes. 31 controller sequences.", "Story Mode / PlayStation 5")}${route.view === "cheat" ? "</div>" : ""}<div class="cheat-browser ${current ? "detail-route" : ""}"><section class="list" aria-label="Cheat list"><div class="toolbar"><input id="cheat-search" type="search" placeholder="Name, effect or code…" aria-label="Search cheats" value="${esc(route.query || "")}" autocomplete="off"/><select id="cheat-category" aria-label="Cheat category"><option value="all">All cheats</option><option value="saved" ${route.category === "saved" ? "selected" : ""}>Pinned</option>${Object.entries(
    titles,
  )
    .map(
      ([id, t]) =>
        `<option value="${id}" ${route.category === id ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="toolbar secondary"><span class="meta">Phone prefix <span class="mono">1-999</span></span><div class="method" aria-label="Preferred input"><button data-action="method" data-id="phone" aria-pressed="${state.method === "phone"}">Phone</button><button data-action="method" data-id="pad" aria-pressed="${state.method === "pad"}">Controller</button></div></div><details class="help"><summary>How to enter · saves & trophies</summary><div class="instructions"><p><strong>Phone:</strong> D-pad Up → Contacts → Square → enter number → Square.</p><p><strong>Controller:</strong> enter the sequence quickly during gameplay. Arrows use the D-pad.</p><p>Save before using cheats. Cheats suspend trophies and cap mission medals at Bronze for that session. Restart the game and load your clean save before a trophy run. Cheats work in Story Mode. There is no money cheat.</p>${sourceButton(["gtabase", "rockstar", "phoneGuide"])}</div></details><div id="cheat-rows">${groups.join("") || '<p class="empty">No cheats here. Try another search or pin a cheat with ☆.</p>'}</div></section><section class="detail" aria-label="Selected cheat"><a class="back mobile-only" href="${esc(state.cheatBack || "#/cheats")}" data-back-cheats>← All cheats</a>${detail ? cheatDetail(detail, state) : '<p class="empty">Choose another search or category.</p>'}</section></div>`;
}
export function playView(route, state) {
  const quick = [
    "lower-wanted",
    "health-armor",
    "weapons",
    "buzzard",
    "sanchez",
    "invincibility",
  ];
  const labels = [
    "Lose the cops",
    "Heal & repair",
    "Gear up",
    "Take to the skies",
    "Go off-road",
    "Five minutes of chaos",
  ];
  const book = searchItems(playbook, route.query || "");
  if (route.query) return `${head("Playbook results", `Matching “${esc(route.query)}”`)}<a class="back" href="#/play">← All playbook tips</a>${book.map((t) => tip(t, state)).join("") || '<p class="empty">No matching tips.</p>'}`;
  return `${head("Back in Los Santos", "Your shortcuts, plans and next things to try.", "Story Mode / PlayStation 5")}<div class="two-column"><section>${section("Right now", '<a href="#/cheats">Every cheat →</a>')}<div class="meta">In-game phone · prefix <span class="mono">1-999</span></div>${quick
    .map((id, i) => {
      const c = cheats.find((c) => c.id === id);
      return `<a class="row quick-row" href="#/cheat/${id}"><span class="grow"><span class="row-title">${labels[i]}</span><small>${esc(c.title)}</small></span><span class="digits">${c.phone.slice(6)}</span></a>`;
    })
    .join(
      "",
    )}<div class="notebook"><h2><label for="session-note">Next time I play</label></h2><p class="meta">Your own notes, saved on this device.</p><textarea id="session-note" maxlength="3000" placeholder="Finish the heist setup, pick up Packie, try the stunt plane…">${esc(state.note)}</textarea><span class="meta" id="note-status">Saved locally</span></div></section><section><div class="start-actions"><a href="#/store/${state.lastStore}"><span class="num">${String(state.stores.length).padStart(2, "0")}<small> / 19 checked</small></span><strong>Pick a store →</strong><small>Original maps. Done & next.</small></a><a href="#/money"><span class="num">LCN<span class="meta"> / BAWSAQ</span></span><strong>Plan your trades →</strong><small>Before, after, rebound.</small></a><a href="#/progress"><span class="num">${completionPercent(state.progress).toFixed(1)}<small>%</small></span><strong>Work toward 100% →</strong><small>Requirements & planning lists.</small></a><a href="#/wildlife"><span class="num">${wildlife.filter((a) => state.checks.includes(a.id)).length}<small> / 20 animals</small></span><strong>Earn the Kraken →</strong><small>A reason to explore.</small></a></div>${
    state.favorites.length
      ? section("Pinned", '<a href="#/cheats?c=saved">All pins →</a>') +
        state.favorites
          .slice(0, 4)
          .map((id) =>
            cheatRow(
              cheats.find((c) => c.id === id),
              state,
            ),
          )
          .join("")
      : ""
  }<div class="setting"><button class="full-width" data-action="wake">Keep screen awake <span data-wake-label></span></button><p>Keep this guide visible while your hands are on the controller.</p></div></section></div>${section(route.query ? "Playbook results" : "The useful little things", '<a href="#/missions">Mission guides →</a>')}<div class="two-column"><div>${book
    .filter((_, i) => i % 2 === 0)
    .map((t) => tip(t, state))
    .join("")}</div><div>${book
    .filter((_, i) => i % 2 === 1)
    .map((t) => tip(t, state))
    .join(
      "",
    )}</div></div>${route.query ? '<a class="back" href="#/play">Show the whole playbook</a>' : ""}<p class="footer-note">Glovebox is an unofficial fan guide. <a href="#/about">Sources & credits</a> · <button class="source-link" data-action="settings">Backup & settings</button></p>`;
}
function tip(t, state) {
  return `<article class="tip"><div class="label">${t.group}</div><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p><div class="inline-actions">${t.link ? `<a href="${t.link}">${t.label} →</a>` : t.url ? external(t.url, "Event guide") : ""}<button class="text-button" data-action="check" data-id="${t.id}" aria-pressed="${state.checks.includes(t.id)}">${state.checks.includes(t.id) ? "✓ Tried it" : "Mark tried"}</button>${sourceButton(t.sources)}</div></article>`;
}
export function storeList(route, state, picker = false) {
  const list = searchItems(stores, route.query || "").filter(
    (s) =>
      (route.filter !== "todo" || !state.stores.includes(s.id)) &&
      (route.filter !== "done" || state.stores.includes(s.id)) &&
      (route.region === "all" || !route.region || route.region === s.region),
  );
  return (
    list
      .map(
        (s) =>
          `<a class="row ${picker && s.id === route.id ? "selected" : ""}" href="#/store/${s.id}" data-store="${s.id}"><span class="index">${String(s.sequence).padStart(2, "0")}</span><span class="grow"><span class="row-title">${esc(s.name)} · ${esc(s.area)}</span><small>${esc(s.street)} · ${s.id}</small></span><span aria-label="${state.stores.includes(s.id) ? "Checked" : "Not checked"}">${state.stores.includes(s.id) ? "✓" : "›"}</span></a>`,
      )
      .join("") ||
    '<p class="empty">No stores match. Try All or clear the search.</p>'
  );
}
export function storesView(route, state) {
  return `${head("Find your next stop", "19 Story Mode store close-ups, with the original map pins.")}<div class="places-layout"><section><div class="toolbar"><input id="store-search" type="search" placeholder="Area, street or map label…" aria-label="Search stores" value="${esc(route.query)}"/></div><div class="list-tools"><select id="store-filter" aria-label="Store checklist filter">${[
    ["all", "All stores"],
    ["todo", "Not checked"],
    ["done", "Checked"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${route.filter === v ? "selected" : ""}>${t}</option>`,
    )
    .join("")}</select><select id="store-region" aria-label="Region">${[
    ["all", "All areas"],
    ["city", "Los Santos"],
    ["west", "West coast & hills"],
    ["north", "Blaine County & north"],
    ["east", "East coast"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${route.region === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></div>${segbar(state.stores.length, 19)}<div class="inline-actions"><span class="meta">${state.stores.length} checked · ${19 - state.stores.length} left</span><a class="back" href="#/store/${state.lastStore}">Resume map →</a></div><div id="store-rows" class="place-list">${storeList(route, state)}</div></section><aside><div class="section-label">Overview · original SR / PR map labels</div><a href="${overview.image}" target="_blank" rel="noopener noreferrer"><img class="map-overview" src="${overview.image}" width="${overview.width}" height="${overview.height}" alt="Original GosuNoob overview of 19 store locations, labeled SR1–SR9 and PR1–PR10"/></a><p class="map-caption">GosuNoob overview. Numbers in the close-ups follow Fiction Horizon’s order; SR / PR labels connect the two maps.</p>${sourceButton(["gosunoob", "fictionhorizon", "powerpyx"])}<p class="meta">For 100% completion you need to hold up one store, not all 19. Your checks here are a personal route list.</p></aside></div>`;
}
export function storeView(route, state) {
  const s = stores.find((s) => s.id === route.id);
  if (!s) return missing();
  return `<section class="viewer" tabindex="-1" aria-label="Store ${s.sequence} of 19, ${esc(s.name)}, ${state.stores.includes(s.id) ? "checked" : "not checked"}"><div class="viewer-top"><a href="#/stores" data-back-stores>← Stores</a><span class="mono">${String(s.sequence).padStart(2, "0")} / 19 · ${s.id}</span><button data-action="pick-store">Jump to…</button></div><div class="map-stage" id="map-stage" tabindex="0" aria-label="Store map; scroll to pan when zoomed"><div class="map-loading" id="map-loading">Loading original close-up…</div><img id="store-image" src="${s.image}" width="${s.width}" height="${s.height}" alt="${esc(s.name)} in ${esc(s.area)}: original in-game map close-up ${s.sequence}, marker ${s.id}"/></div><div id="map-changed" class="warning" hidden>Image dimensions changed at the publisher. Check the original source.</div><div class="viewer-caption"><div><h1>${esc(s.name)} · ${esc(s.area)}</h1><p class="muted">${esc(s.street)}</p></div><button data-action="store-toggle" data-id="${s.id}" aria-pressed="${state.stores.includes(s.id)}">${state.stores.includes(s.id) ? "✓ Checked" : "Mark checked"}</button></div><div class="viewer-controls"><button data-action="store-prev" aria-label="Previous store">←</button><button class="primary" data-action="store-next-undone">${state.stores.length === 19 ? "All 19 checked" : "Done & next"}</button><button data-action="store-next" aria-label="Next store">→</button></div><nav class="place-jumps" aria-label="Jump to store">${stores.map((place) => `<button data-action="store-jump" data-id="${place.id}" ${place.id === s.id ? 'aria-current="location"' : ''} class="${state.stores.includes(place.id) ? 'done' : ''}" aria-label="Store ${place.sequence}, ${esc(place.area)}, ${state.stores.includes(place.id) ? 'checked' : 'not checked'}">${place.sequence}${state.stores.includes(place.id) ? '<span aria-hidden="true">✓</span>' : ''}</button>`).join('')}</nav><div class="viewer-meta"><span>${state.stores.length} checked · ${19 - state.stores.length} left</span><div class="inline-actions"><button data-zoom="1" aria-pressed="true">Fit</button><button data-zoom="2" aria-pressed="false">2×</button><button data-zoom="3" aria-pressed="false">3×</button></div><span>${external(s.image, "Original")} · ${sourceButton(["fictionhorizon", "gosunoob"])}</span></div>${s.note ? `<p class="meta">${esc(s.note)}</p>` : ""}<p class="meta">Scroll to pan when zoomed. Pinch uses browser zoom. <span class="desktop-only">Keys: ← / → · D to check · + / − to zoom · 0 to fit.</span></p></section>`;
}
function stockLabel(s) {
  return `<span class="stock">${s[0]} <span class="mono">${s[1]}</span></span><span class="meta">${s[2]}</span>`;
}
export function moneyView(state) {
  return `${head("Stocks & heists", "Lester’s investments, one trade at a time.")} ${subnav("money")}<div class="note-box"><p><strong>Do Hotel when the story requires it. Save the other four for after the main story’s final payout.</strong></p><p>Make a manual save, then trade separately with each character. Check My Portfolio between sleeps; sell after the rise. Peak returns vary.</p></div><details class="help"><summary>Buying, selling & BAWSAQ availability</summary><div class="instructions"><p>Open the in-game phone → Internet → Money and Services → LCN or BAWSAQ. Buy the listed ticker. Check My Portfolio regularly after the mission; note prices between sleeps, and sell each character’s holding when you choose to take the gain.</p><p>If BAWSAQ is unavailable, check the game’s network connection and try later. LCN trades remain a separate path; do not substitute an LCN company for a BAWSAQ ticker. You can still advance the required Hotel mission without that investment.</p><label class="check-row"><input type="checkbox" data-setting="bawsaq" ${state.settings.bawsaq ? "checked" : ""}/><span>BAWSAQ is available in my game</span></label><p>Character sleep: Michael 6 hours · Franklin 8 hours · Trevor 12 hours. A real-world timer does not predict a stock peak.</p>${sourceButton(["stocks", "sleep"])}</div></details><div class="toolbar"><label for="money-jump" class="label">Jump to</label><select id="money-jump" class="grow" aria-label="Assassination checklist">${assassinations.map((m) => `<option value="${m.id}" ${state.activeMoney === m.id ? "selected" : ""}>${m.title}</option>`).join("")}</select></div>${assassinations.map((m, i) => assassination(m, i, state)).join("")}<div class="section-head"><h2>Before the final choice</h2></div>${`<div class="note-box"><p><strong>Ending C keeps all three protagonists playable.</strong> Choose it if you want to continue using all three portfolios afterward. With another ending, use only the available characters in this checklist.</p>${external("https://www.gtabase.com/grand-theft-auto-v/missions/the-third-way-ending-c", "Ending C guide")}<p><button class="text-button" data-action="settings">Choose available characters in Settings</button></p></div>`}<p class="footer-note">For GTA V’s in-game stock market. All trades are your manual notes; this page does not connect to your game. ${sourceButton(["stocks"])}</p>`;
}
function assassination(m, i, state) {
  const steps = tradeSteps(m),
    done = state.money.includes(`${m.id}-mission`);
  return `<details class="accordion" ${m.id === state.activeMoney || (!state.activeMoney && i === 0) ? "open" : ""} data-money-accordion="${m.id}"><summary><span class="mono">0${i + 1}</span><h2>${esc(m.title)}</h2>${done ? '<span class="meta">✓ Mission</span>' : ""}</summary><div class="accordion-body"><p class="muted">${esc(m.note)}</p>${!state.settings.bawsaq && [m.before, m.after, m.rebound].some((s) => s?.[2] === "BAWSAQ") ? '<div class="note-box"><p>BAWSAQ marked unavailable. Leave its trades unchecked until you can access that exchange; LCN steps are labeled separately.</p></div>' : ""}${steps
    .map(
      (s, n) =>
        `<div class="trade-step"><span class="index">${n + 1}</span><div><span class="label">${s.text}</span>${s.stock ? stockLabel(s.stock) : ""}</div>${
          s.info
            ? ""
            : s.character
              ? `<div class="char-chips" role="group" aria-label="${esc(s.text)} ${esc(s.stock?.[1] || "")}">${characters
                  .filter((c) => !state.settings.hiddenCharacters.includes(c))
                  .map(
                    (c) =>
                      `<label class="char-${c}" title="${{ M: "Michael", F: "Franklin", T: "Trevor" }[c]}"><input type="checkbox" data-money="${m.id}-${s.id}-${c}" ${state.money.includes(`${m.id}-${s.id}-${c}`) ? "checked" : ""} aria-label="${{ M: "Michael", F: "Franklin", T: "Trevor" }[c]}: ${esc(s.text)} ${s.stock?.[1] || ""}"/><span>${c}</span></label>`,
                  )
                  .join("")}</div>`
              : `<label class="trade-done"><input type="checkbox" data-money="${m.id}-${s.id}" ${state.money.includes(`${m.id}-${s.id}`) ? "checked" : ""}/><span class="meta">Done</span></label>`
        }</div>`,
    )
    .join(
      "",
    )}<div class="inline-actions"><button data-action="prices" data-id="${m.id}">Price notes & profit</button><button class="text-button" data-action="reset-money" data-id="${m.id}">Reset this checklist</button>${sourceButton(m.sources)}</div></div></details>`;
}
export function crewView(state, query = "") {
  return (
    head(
      "Put a crew together",
      "Approach, role and cut—without digging through a walkthrough.",
    ) +
    subnav("crews") +
    `<div class="note-box"><p>Recruit Packie and Taliana before you need them. Crew availability and experience depend on earlier choices.</p><a href="#/play?q=recruit">Recruitment locations →</a></div>${searchItems(crews, query).map((c) => `<section class="tip"><div class="label">${c.approach}</div><h2>${c.title}</h2><table class="crew-table"><caption class="sr-only">${c.title} crew</caption><tbody>${c.rows.map(([role, name, cut]) => `<tr><th scope="row">${role}</th><td>${name}</td><td>${cut}</td></tr>`).join("")}</tbody></table><p>${c.note}</p>${sourceButton(c.sources)}</section>`).join("")}`
  );
}
export function propertiesView(state) {
  const own = properties.filter((p) => state.checks.includes(p.id));
  return (
    head(
      "A place of your own",
      "15 income properties, sorted by purchase price.",
    ) +
    subnav("properties") +
    `<div class="note-box"><p><strong>${own.length} owned · ${moneyFormat(own.reduce((n, p) => n + p.price, 0))} purchase cost</strong></p><p>Five purchased income properties meet the property requirement for 100%. Vehicle-storage purchases and the awarded Vanilla Unicorn do not count toward these five. Availability opens as the story advances.</p></div>${properties.map((p) => `<label class="check-row"><input type="checkbox" data-check="${p.id}" ${state.checks.includes(p.id) ? "checked" : ""}/><span class="grow"><strong class="row-title">${p.title}</strong><small>${p.owner} · ${p.area}${p.id === "towing" ? " · Complete Tonya’s towing strand" : ""}</small></span><span class="amount">${moneyFormat(p.price)}</span></label>`).join("")}${sourceButton(["powerpyx", "completion", "towing"])}`
  );
}
const stepper = (kind, id, count, max, title) =>
  `<div class="stepper"><button data-action="step" data-kind="${kind}" data-id="${id}" data-delta="-1" aria-label="Decrease ${esc(title)}">−</button><input type="number" inputmode="numeric" min="0" max="${max}" step="1" value="${count || 0}" data-count="${kind}" data-id="${id}" aria-label="${esc(title)} completed"/><button data-action="step" data-kind="${kind}" data-id="${id}" data-delta="1" aria-label="Increase ${esc(title)}">+</button><span>/ ${max}</span></div>`;
const checkRow = (item, state) =>
  `<label class="check-row"><input type="checkbox" data-check="${item.id}" ${state.checks.includes(item.id) ? "checked" : ""}/><span class="grow"><strong>${esc(item.title)}</strong>${item.area ? `<small>${esc(item.area)}</small>` : ""}</span></label>`;
export function progressView(state, query = "") {
  const percent = completionPercent(state.progress);
  return `<div class="page-head"><div class="completion-heading"><span class="completion-number">${percent.toFixed(1)}<span class="meta">%</span></span><div><div class="label">Your recorded totals</div><h1>The road to 100%</h1></div></div></div><div class="two-column"><section><p class="muted">Copy the five category totals from <strong>Pause → Stats → 100% Checklist</strong>. The game is the source of these totals; the planning lists below are separate.</p>${completionCategories.map((c) => `<div class="progress-row"><div class="top"><div><h3>${c.title}</h3><span class="meta">${c.weight}% of completion</span></div>${stepper("progress", c.id, state.progress[c.id], c.total, c.title)}</div>${segbar(state.progress[c.id] || 0, c.total)}<p>${c.note}</p></div>`).join("")}${sourceButton(["completion"])}</section><aside>${section("Collectible targets")}<p class="meta">Record how many you found. Source maps provide the actual locations.</p>${collectibles.map((c) => `<div class="collector"><div class="top"><h3>${c.title}</h3>${stepper("collectibles", c.id, state.collectibles[c.id], c.total, c.title)}</div><p>${c.required} needed for 100% · ${c.total} in the full set.<br/>${c.note}</p>${external(c.url, "Open location guide")}${c.id === "spaceship" ? sourceButton(["farout"]) : ""}</div>`).join("")}</aside></div>${section("Planning lists")}<p class="meta">These checkboxes help you remember individual tasks. They do not overwrite the five in-game category totals above.</p><details class="accordion" ${query.startsWith("hobby-") ? "open" : ""}><summary><h2>Hobbies & pastimes</h2><span class="mono">${hobbies.flatMap((h) => h.items).filter((i) => state.checks.includes(i.id)).length}/42</span></summary><div class="accordion-body">${hobbies.map((g) => `<div class="section-head"><h3>${g.title}</h3></div><p class="meta">${g.note}</p>${g.items.map((i) => checkRow(i, state)).join("")}`).join("")}<p>${external(sources.parachuting.url, "All 13 parachute locations")}</p>${sourceButton(["completion", "powerpyx", "parachuting", "flightSchool"])}</div></details><details class="accordion" ${query.startsWith("misc-") ? "open" : ""}><summary><h2>Miscellaneous</h2><span class="mono">${miscellaneous.filter((i) => state.checks.includes(i.id)).length}/16</span></summary><div class="accordion-body">${miscellaneous.map((i) => checkRow(i, state)).join("")}${sourceButton(["completion", "powerpyx"])}</div></details><a class="row" href="#/missions"><span class="grow"><span class="row-title">Story & Franklin’s side missions</span><small>Walkthrough links and personal checkboxes</small></span><span class="arrow">→</span></a><a class="row" href="#/wildlife"><span class="grow"><span class="row-title">Wildlife photography</span><small>A separate 20-animal challenge for the Kraken unlock</small></span><span class="arrow">→</span></a><a class="row" href="${sources.random.url}" target="_blank" rel="noopener noreferrer"><span class="grow"><span class="row-title">Random-event locations</span><small>Pick any 14 qualifying events for 100%</small></span><span class="arrow">↗</span></a>`;
}
export function wildlifeView(route, state) {
  const done = wildlife.filter((a) => state.checks.includes(a.id)).length;
  return `<a class="back" href="#/progress">← Progress & challenges</a>${head("The wildlife assignment", `${done} of 20 photos recorded. Earn the Kraken submarine.`)}<div class="note-box"><p>Play as Franklin. After the first Paparazzo mission and the Tourist Board email, use Snapmatic to photograph the animals alive, centered and unobstructed. Send accepted shots to the Tourist Board; avoid filters, borders and selfies.</p><p>Finish the set to unlock the Kraken at Cape Catfish pier and <a href="#/cheat/kraken">its phone cheat</a>. Animal spawns vary; these are search areas.</p></div><div class="toolbar"><input id="animal-search" type="search" placeholder="Animal or search area…" aria-label="Search animals" value="${esc(route.query)}"/></div>${segbar(done, 20)}<div id="animal-rows">${
    searchItems(wildlife, route.query)
      .map((i) => checkRow(i, state))
      .join("") || '<p class="empty">No animal matches.</p>'
  }</div>${sourceButton(["wildlife", "wildlifeUpdate", "gtabase"])}`;
}
export function missionsView(route, state) {
  return `<a class="back" href="#/progress">← Completion</a>${head("Mission reference", "Walkthroughs, objectives and your own done list.")}${`<div class="note-box"><p><strong>80 story walkthroughs include alternative heist approaches and endings.</strong> Your playthrough needs 69 story missions for 100%, not every branch here. Franklin’s list has 24 required side-mission steps; four do not increment the game’s 20-mission counter.</p></div><div class="toolbar"><input id="mission-search" type="search" placeholder="Find a mission…" aria-label="Search missions" value="${esc(route.query)}"/></div><div id="mission-rows">${missionRows(route.query, state)}</div>${sourceButton(["completion"])}`}`;
}
export function missionRows(query, state) {
  return (
    ["story", "strangers"]
      .map((group) => {
        const list = searchItems(
          missionGuides.filter((m) => m.group === group),
          query,
        );
        return list.length
          ? `<div class="section-label">${group === "story" ? "Story missions & alternate approaches" : "Franklin · Strangers & Freaks"}</div>${list.map((i) => `<div class="check-row"><label class="grow inline-actions"><input type="checkbox" data-check="${i.id}" ${state.checks.includes(i.id) ? "checked" : ""}/><strong>${esc(i.title)}</strong></label>${external(i.url, "Guide")}</div>`).join("")}`
          : "";
      })
      .join("") || '<p class="empty">No mission matches.</p>'
  );
}
export function aboutView() {
  return `${head("The references", "Source links live beside the information they support.")}<p>Cheat inputs follow the PlayStation list on GTA Base, checked ${checked}. Black cellphone is an additional phone-only entry from GTA BOOM. Store images are the original publishers’ in-game map close-ups.</p>${sourcesHTML(Object.keys(sources))}<p class="footer-note">Unofficial fan project, not affiliated with Rockstar Games or Take-Two. Game names and original map images belong to their respective owners. Images load from the credited publishers and need a connection. Your pins, checklists and notes live in this browser; export a backup to move them between devices.</p>${external("https://github.com/0xMarcio/gta-v-ps5-guide", "Source code & issue reports")}`;
}
export function sourcesHTML(ids) {
  return ids
    .filter((id) => sources[id])
    .map((id) => {
      const s = sources[id];
      return `<div class="source-item">${external(s.url, s.name)}<p>${esc(s.scope)}</p><span class="meta">Checked ${s.retrieved}</span></div>`;
    })
    .join("");
}
export function missing() {
  return `${head("That page isn’t here", "The link may be incomplete or out of date.")}<a class="back" href="#/play">← Open Glovebox</a>`;
}
export function renderView(route, state) {
  switch (route.view) {
    case "play":
      return playView(route, state);
    case "cheats":
    case "cheat":
      return cheatsView(route, state);
    case "stores":
      return storesView(route, state);
    case "store":
      return storeView(route, state);
    case "money":
      return moneyView(state);
    case "crews":
      return crewView(state, route.query);
    case "properties":
      return propertiesView(state);
    case "progress":
      return progressView(state, route.query);
    case "wildlife":
      return wildlifeView(route, state);
    case "missions":
      return missionsView(route, state);
    case "about":
      return aboutView();
    default:
      return missing();
  }
}
