import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cheats } from "../site/data/cheats.js";
import { stores, overview } from "../site/data/stores.js";
import { sources } from "../site/data/sources.js";
import {
  assassinations,
  tradeSteps,
  completionCategories,
  hobbies,
  miscellaneous,
  properties,
  playbook,
  collectibles,
  crews,
} from "../site/data/story.js";
import { wildlife, missionGuides } from "../site/data/lists.js";
import {
  parseRoute,
  routeURL,
  searchItems,
  chooseMethod,
  freshState,
  sanitizeState,
  createStorage,
  STORAGE_KEY,
  LEGACY_KEY,
  RECOVERY_KEY,
  nextStore,
  remainingTime,
  completionPercent,
  parseCents,
  calculateTrade,
} from "../site/core.js";
import { renderView, esc } from "../site/views.js";
const fixture = (name) =>
  JSON.parse(readFileSync(new URL(name, import.meta.url)));
const byId = (id) => cheats.find((c) => c.id === id);
const memory = (entries = []) => {
  const data = new Map(entries);
  return {
    data,
    api: {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
    },
  };
};
test("all 35 GTA Base entries match the separately captured PlayStation phone and button transcription", () => {
  const evidence = fixture("./gtabase-evidence.json");
  assert.equal(evidence.entries.length, 35);
  assert.equal(evidence.source, sources.gtabase.url);
  const map = {
    O: "circle",
    X: "cross",
    TRIANGLE: "triangle",
    SQUARE: "square",
  };
  for (const original of evidence.entries) {
    const c = byId(original.id);
    assert.equal(c.phone, original.phone, c.id);
    assert.deepEqual(
      c.buttons,
      original.buttons.length
        ? original.buttons.map((k) => map[k] || k.toLowerCase())
        : null,
      c.id,
    );
  }
  assert.equal(cheats.length, 36);
  assert.equal(cheats.filter((c) => c.phone).length, 36);
  assert.equal(cheats.filter((c) => c.buttons).length, 31);
});
test("GTA Base values are authoritative even where a mnemonic predicts different digits", () => {
  assert.equal(byId("fast-run").phone, "1-999-2288-463");
  assert.equal(byId("drunk").phone, "1-999-547-861");
  assert.deepEqual(byId("rapid-gt").buttons, [
    "r2",
    "r2",
    "l1",
    "circle",
    "right",
    "l1",
    "r1",
    "right",
    "left",
    "circle",
    "r2",
  ]);
  assert.equal(byId("black-cellphone").phone, "1-999-367-3767");
  assert.deepEqual(byId("black-cellphone").sources, ["gtaboom"]);
  assert.equal(byId("sanchez").phone, "1-999-633-7623");
  assert.equal(byId("pcj-600").phone, "1-999-762-538");
  assert.equal(byId("trashmaster").phone.replace(/-/g, ""), "19998727433");
  for (const c of cheats) {
    assert.equal(c.dispute, undefined);
    assert.ok(c.sources.every((s) => sources[s]));
    for (const pref of ["pad", "phone"])
      assert.ok(chooseMethod(c, pref) === "pad" ? c.buttons : c.phone);
  }
});
test("the 30 existing independently compared Xbox-to-PlayStation sequences remain unchanged", () => {
  const evidence = fixture("./xbox-evidence.json"),
    map = {
      a: "cross",
      b: "circle",
      x: "square",
      y: "triangle",
      lb: "l1",
      rb: "r1",
      lt: "l2",
      rt: "r2",
      left: "left",
      right: "right",
      up: "up",
      down: "down",
    };
  assert.equal(Object.keys(evidence.sequences).length, 30);
  for (const [id, seq] of Object.entries(evidence.sequences))
    assert.deepEqual(
      byId(id).buttons,
      seq.map((k) => map[k]),
      id,
    );
});
test("all 19 close-ups retain their original image-to-marker mapping and dimensions", () => {
  const evidence = fixture("./closeup-evidence.json");
  assert.equal(stores.length, 19);
  assert.equal(new Set(stores.map((s) => s.id)).size, 19);
  for (const ref of evidence.images) {
    const s = stores.find((s) => s.id === ref.label);
    assert.equal(s.image, ref.image);
    assert.equal(s.sequence, ref.sequence);
    assert.match(ref.sha256, /^[a-f0-9]{64}$/);
    assert.ok(s.width > 500 && s.height > 200);
    assert.equal(s.latitude, undefined);
  }
  for (const [id, observation] of Object.entries(evidence.reviewRechecks)) {
    assert.equal(
      stores.find((s) => s.id === id).sequence,
      Number(observation.printedNumber.split("/")[0]),
    );
  }
  assert.deepEqual(
    stores.map((s) => s.sequence),
    Array.from({ length: 19 }, (_, i) => i + 1),
  );
});
test("store navigation wraps, skips completed stores and terminates when all are complete", () => {
  assert.equal(nextStore("PR7", []), "PR6");
  assert.equal(nextStore("SR8", []), "SR7");
  assert.equal(nextStore("SR7", [], false, -1), "SR8");
  assert.equal(nextStore("PR7", ["PR6"], true), "PR4");
  assert.equal(
    nextStore(
      "SR7",
      stores.map((s) => s.id),
      true,
    ),
    null,
  );
  assert.equal(
    nextStore(
      "SR7",
      stores.filter((s) => s.id !== "SR7").map((s) => s.id),
      true,
    ),
    "SR7",
  );
});
test("all old routes work under a project path, malformed routes fail safely", () => {
  assert.equal(parseRoute("#/saved").category, "saved");
  assert.equal(parseRoute("#/guide").view, "about");
  assert.equal(parseRoute("#/cheats?c=quick").view, "cheats");
  assert.equal(parseRoute("#/cheats").category, "all");
  assert.equal(parseRoute("#main"), null);
  for (const hash of [
    "#/cheat/%E0%A4%A",
    "#/store",
    "#/guide/nope",
    "#/random/thing",
  ])
    assert.equal(parseRoute(hash).view, "missing");
  const url = new URL(
    routeURL("stores", { q: "Sandy Shores", f: "todo" }),
    "https://example.github.io/gta-v-ps5-guide/",
  );
  assert.equal(url.pathname, "/gta-v-ps5-guide/");
  assert.equal(parseRoute(url.hash).query, "Sandy Shores");
  assert.equal(parseRoute(url.hash).filter, "todo");
});
test("search covers effects, minor typos, aliases, numbers and map markers", () => {
  assert.ok(searchItems(cheats, "repair").some((c) => c.id === "health-armor"));
  assert.ok(
    searchItems(cheats, "invincibilty").some((c) => c.id === "invincibility"),
  );
  assert.deepEqual(
    searchItems(cheats, "19996337623").map((c) => c.id),
    ["sanchez"],
  );
  assert.deepEqual(
    searchItems(cheats, "1-999-547-861").map((c) => c.id),
    ["drunk"],
  );
  assert.equal(searchItems(stores, "Richman Glen")[0].id, "PR4");
  assert.equal(searchItems(stores, "sr5")[0].area, "Chumash");
  assert.equal(searchItems(cheats, "<script>").length, 0);
});
test("v1 migration preserves pins, checks and method; repeated migration is idempotent", () => {
  const legacy = {
      version: 1,
      favorites: ["buzzard", "sanchez"],
      stores: ["SR5", "PR7"],
      method: "pad",
    },
    raw = JSON.stringify(legacy);
  const { data, api } = memory([
    [LEGACY_KEY, raw],
    ["unrelated", "untouched"],
  ]);
  const a = createStorage(() => api);
  assert.deepEqual(a.state.favorites, legacy.favorites);
  assert.deepEqual(a.state.stores, legacy.stores);
  assert.equal(a.state.method, "pad");
  assert.equal(data.get(LEGACY_KEY), raw);
  assert.equal(data.get("unrelated"), "untouched");
  assert.deepEqual(createStorage(() => api).state, a.state);
  assert.deepEqual(sanitizeState(a.state).state, a.state);
});
test("v2 backup retains each feature and filters invalid IDs without executing user content", () => {
  const v = {
    ...freshState(),
    favorites: ["buzzard", "buzzard", "invalid"],
    stores: ["SR5"],
    recent: ["sanchez", "buzzard"],
    checks: ["animal-1", "hobby-0-0", "mission-2831", "hen-house", "invalid"],
    money: ["bus-after-buy-F", "bus-buy-M"],
    progress: { story: 900, hobbies: -1, misc: 3 },
    collectibles: { stunts: 999 },
    note: "<img src=x onerror=alert(1)>",
    prices: { hotel: { M: { cash: "1,000", buy: "10", sell: "12" } } },
    settings: { bawsaq: false, hiddenCharacters: ["M", "X"] },
    arbitrary: "drop",
  };
  const clean = sanitizeState(v);
  assert.deepEqual(clean.state.favorites, ["buzzard"]);
  assert.equal(clean.state.progress.story, 69);
  assert.equal(clean.state.progress.hobbies, 0);
  assert.equal(clean.state.collectibles.stunts, 50);
  assert.deepEqual(clean.state.money, ["bus-after-buy-F"]);
  assert.deepEqual(clean.state.settings.hiddenCharacters, ["M"]);
  assert.equal(clean.state.arbitrary, undefined);
  assert.equal(clean.state.prices.hotel.M.cash, "1,000");
  assert.equal(clean.state.note, v.note);
  assert.match(renderView(parseRoute("#/play"), clean.state), /&lt;img/);
  assert.ok(clean.dropped >= 4);
});
test("malformed or future schemas cannot overwrite saved state silently", () => {
  for (const bad of [
    null,
    {},
    [],
    { ...freshState(), version: 3 },
    { ...freshState(), stores: "SR5" },
  ])
    assert.throws(() => sanitizeState(bad));
  for (const raw of [
    "{broken",
    JSON.stringify({ version: 3, favorites: ["future"] }),
  ]) {
    const { api, data } = memory([[STORAGE_KEY, raw]]);
    const db = createStorage(() => api);
    assert.equal(db.recovery, raw);
    assert.equal(data.get(RECOVERY_KEY), raw);
    assert.match(db.warning, /recovery copy/);
    db.save({ ...db.state, favorites: ["buzzard"] });
    assert.deepEqual(createStorage(() => api).state.favorites, ["buzzard"]);
  }
});
test("blocked storage, quota failures and failed recovery retain in-memory selections", () => {
  for (const get of [
    () => {
      throw Error("Denied");
    },
    () => null,
  ]) {
    const db = createStorage(get);
    assert.ok(db.warning);
    db.save({ ...db.state, stores: ["SR5"] });
    assert.deepEqual(db.state.stores, ["SR5"]);
  }
  const { data, api } = memory([[STORAGE_KEY, "broken"]]);
  const failing = {
    ...api,
    setItem(k, v) {
      if (k === RECOVERY_KEY) throw Error("Quota");
      api.setItem(k, v);
    },
  };
  const db = createStorage(() => failing);
  db.save({ ...db.state, stores: ["SR5"] });
  assert.equal(data.get(STORAGE_KEY), "broken");
  assert.match(db.warning, /original is untouched/);
  let writes = 0;
  const quota = createStorage(() => ({
    getItem: () => null,
    setItem() {
      if (writes++) throw Error("Quota");
    },
  }));
  quota.save({ ...quota.state, favorites: ["sanchez"] });
  assert.ok(quota.warning);
  assert.deepEqual(quota.state.favorites, ["sanchez"]);
});
test("cross-tab receive does not write back, rejects corrupt state and handles key removal", () => {
  let writes = 0;
  const db = createStorage(() => ({
      getItem: () => null,
      setItem() {
        writes++;
      },
    })),
    before = writes;
  assert.equal(
    db.receive(JSON.stringify({ ...freshState(), stores: ["SR5"] })),
    true,
  );
  assert.equal(writes, before);
  assert.deepEqual(db.state.stores, ["SR5"]);
  assert.equal(db.receive("{broken"), false);
  assert.deepEqual(db.state.stores, ["SR5"]);
  assert.equal(db.receive(null), true);
  assert.deepEqual(db.state, freshState());
});
test("all five trade plans match the sourced before/after/rebound table, especially the Bus exception", () => {
  assert.deepEqual(
    assassinations.map((m) => [
      m.id,
      m.before?.[1] ?? null,
      m.after?.[1] ?? null,
      m.rebound?.[1] ?? null,
    ]),
    [
      ["hotel", "BET", null, "BIL"],
      ["multi", "DEB", null, "RWC"],
      ["vice", "FRT", null, "FAC"],
      ["bus", null, "VAP", null],
      ["construction", "GCD", null, null],
    ],
  );
  assert.deepEqual(
    assassinations.map((m) => [
      m.before?.[2] || m.after?.[2],
      m.rebound?.[2] || null,
    ]),
    [
      ["BAWSAQ", "LCN"],
      ["LCN", "LCN"],
      ["BAWSAQ", "BAWSAQ"],
      ["BAWSAQ", null],
      ["LCN", null],
    ],
  );
  const bus = tradeSteps(assassinations[3]);
  assert.equal(
    bus.some((s) => s.id === "buy"),
    false,
  );
  assert.ok(
    bus.findIndex((s) => s.id === "mission") <
      bus.findIndex((s) => s.id === "after-buy"),
  );
  assert.equal(assassinations.filter((m) => m.required).length, 1);
});
test("cash calculations use whole shares, preserve remainder, support losses and reject malformed or unsafe numbers", () => {
  assert.equal(parseCents("$1,234.56"), 123456);
  assert.deepEqual(calculateTrade("1,000", "30", "45"), {
    shares: 33,
    unspent: 10,
    profit: 495,
    total: 1495,
    percent: 50,
    aboveCap: false,
  });
  assert.equal(calculateTrade("100", "10", "5").profit, -50);
  assert.equal(calculateTrade("10", "20", "30").shares, 0);
  assert.equal(calculateTrade("2,147,483,647", "1", "2").aboveCap, true);
  for (const bad of [
    "0",
    "-1",
    "NaN",
    "Infinity",
    "1,2",
    "1.234",
    "1e6",
    "12abc",
    "",
    "2,147,483,648",
  ])
    assert.throws(() => parseCents(bad), bad);
  assert.throws(() => calculateTrade("2147483647", "0.01", "2147483647"));
});
test("completion weights and activity counts match GTA Base; 100.0 requires every category", () => {
  assert.deepEqual(
    completionCategories.map((c) => [c.total, c.weight]),
    [
      [69, 55],
      [20, 10],
      [42, 10],
      [14, 5],
      [16, 20],
    ],
  );
  assert.equal(
    completionCategories.reduce((s, c) => s + c.weight, 0),
    100,
  );
  assert.equal(hobbies.flatMap((h) => h.items).length, 42);
  assert.equal(miscellaneous.length, 16);
  assert.equal(wildlife.length, 20);
  assert.equal(properties.length, 15);
  const full = Object.fromEntries(
    completionCategories.map((c) => [c.id, c.total]),
  );
  assert.equal(completionPercent({}), 0);
  assert.equal(completionPercent(full), 100);
  assert.ok(completionPercent({ ...full, story: 68 }) < 100);
  assert.equal(completionPercent({ story: 69 }), 55);
  assert.equal(completionPercent({ ...full, story: 999 }), 100);
  assert.equal(missionGuides.filter((m) => m.group === "story").length, 80);
  assert.equal(missionGuides.filter((m) => m.group === "strangers").length, 24);
  assert.equal(new Set(missionGuides.map((m) => m.id)).size, 104);
});
test("timer uses wall-clock deadlines, supports pause and expires without accumulating interval drift", () => {
  const t = { status: "running", endsAt: 300100, remainingMs: 0 };
  assert.equal(remainingTime(t, 100), 300000);
  assert.equal(remainingTime(t, 291100), 9000);
  assert.equal(remainingTime(t, 310100), 0);
  assert.equal(
    remainingTime({ status: "paused", remainingMs: 9000 }, 9999999),
    9000,
  );
  assert.equal(remainingTime(null), 0);
  assert.equal(remainingTime({ status: "expired" }, 100), 0);
  const live = {
    ...freshState(),
    timer: { status: "running", endsAt: Date.now() + 90000, remainingMs: 0 },
  };
  assert.equal(sanitizeState(live).state.timer.endsAt, live.timer.endsAt);
});
test("story information and all cheats are available without spoiler gates or verification blockers", () => {
  const state = freshState();
  for (const view of [
    "play",
    "cheats",
    "money",
    "progress",
    "crews",
    "properties",
    "missions",
    "wildlife",
  ]) {
    const html = renderView(parseRoute("#/" + view), state);
    assert.doesNotMatch(
      html,
      /data-action="reveal"|unverified|withheld|spoilers hidden/i,
      view,
    );
  }
  const money = renderView(parseRoute("#/money"), state);
  for (const m of assassinations) assert.ok(money.includes(m.title));
  assert.match(money, /Ending C keeps all three protagonists/);
  assert.match(renderView(parseRoute("#/crews"), state), /The Big Score/);
  assert.match(renderView(parseRoute("#/missions"), state), /The Third Way/);
  const all = renderView(parseRoute("#/cheats"), state);
  for (const c of cheats) assert.ok(all.includes(`#/cheat/${c.id}`));
});
test("every published data source exists and all local routes render", () => {
  for (const item of [
    ...cheats,
    ...assassinations,
    ...crews,
    ...properties,
    ...playbook,
    ...hobbies,
    ...miscellaneous,
    ...collectibles,
    ...wildlife,
    ...missionGuides,
  ])
    assert.ok(
      item.sources.every((id) => sources[id]),
      item.id || item.title,
    );
  for (const s of Object.values(sources)) {
    assert.equal(new URL(s.url).protocol, "https:");
    assert.match(s.retrieved, /^2026-11-05$/);
  }
  for (const view of [
    "play",
    "cheats",
    "stores",
    "money",
    "progress",
    "wildlife",
    "missions",
    "properties",
    "crews",
    "about",
    "cheat/buzzard",
    "store/PR7",
  ])
    assert.ok(
      renderView(parseRoute("#/" + view), freshState()).length > 100,
      view,
    );
});
test("metadata permits mobile zoom, prevents real telephone links, and CSP allows only credited image origins", () => {
  const html = readFileSync(
    new URL("../site/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /name="format-detection" content="telephone=no"/);
  assert.match(html, /width=device-width, initial-scale=1, viewport-fit=cover/);
  assert.doesNotMatch(html, /maximum-scale|user-scalable|tel:/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
  const policy = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
  )[1];
  const image = policy
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith("img-src "))
    .split(/\s+/)
    .slice(1);
  assert.deepEqual(
    image.sort(),
    [
      "'self'",
      ...new Set(
        [overview.image, ...stores.map((s) => s.image)].map(
          (u) => new URL(u).origin,
        ),
      ),
    ].sort(),
  );
  assert.equal(esc("<script>\"&'"), "&lt;script&gt;&quot;&amp;&#39;");
});

test("global-style exact matches rank above typo-tolerant matches", () => {
  const items = [
    { id: "rapid", title: "Rapid GT" },
    { id: "bus", title: "The Bus Assassination", aliases: "Vapid VAP BAWSAQ" },
  ];
  assert.deepEqual(
    searchItems(items, "Vapid").map((x) => x.id),
    ["bus", "rapid"],
  );
});

test("the desktop detail follows a search result instead of displaying an unrelated code", () => {
  const html = renderView(parseRoute("#/cheats?q=god+mode"), freshState());
  const detail = html.split('aria-label="Selected cheat"')[1];
  assert.match(detail, /Invincibility/);
  assert.doesNotMatch(detail, /Buzzard/);
  const empty = renderView(parseRoute("#/cheats?q=doesnotexist"), freshState());
  assert.match(empty, /Choose another search/);
  assert.doesNotMatch(empty, /Phone code 1-999-/);
});
