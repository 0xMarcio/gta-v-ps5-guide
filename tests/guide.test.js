import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cheats } from "../site/data/cheats.js";
import { stores, overview } from "../site/data/stores.js";
import { sources } from "../site/data/sources.js";
import {
  parseRoute,
  searchItems,
  chooseMethod,
  createStorage,
  sanitizeState,
  STORAGE_KEY,
  t9,
} from "../site/core.js";

const cheatIds = cheats.map((c) => c.id),
  storeIds = stores.map((s) => s.id);
const byId = (id) => cheats.find((c) => c.id === id);
const fresh = () => ({
  version: 1,
  favorites: [],
  stores: [],
  method: "phone",
});

test("every published entry is usable and cites known sources", () => {
  assert.equal(cheats.length, 36);
  assert.equal(new Set(cheatIds).size, 36);
  const tokens = new Set([
    "cross",
    "circle",
    "square",
    "triangle",
    "left",
    "right",
    "up",
    "down",
    "l1",
    "l2",
    "r1",
    "r2",
  ]);
  for (const c of cheats) {
    assert.ok(c.phone || c.buttons?.length, c.id);
    assert.ok(
      c.sources.length >= 2 && c.sources.every((s) => sources[s]),
      c.id,
    );
    if (c.buttons)
      assert.ok(
        c.buttons.every((key) => tokens.has(key)),
        c.id,
      );
    for (const preferred of ["phone", "pad"])
      assert.ok(
        chooseMethod(c, preferred) === "phone" ? c.phone : c.buttons?.length,
        c.id,
      );
  }
});
test("published phone digits agree with their independently published mnemonic", () => {
  for (const c of cheats.filter((c) => c.phone))
    assert.equal(c.phone.replace(/-/g, ""), "1999" + t9(c.mnemonic), c.id);
  assert.equal(t9("HOLEIN1"), "4653461");
  assert.throws(() => t9("BAD!"));
});
test("all 30 published controller sequences match an independent Xbox source transcription", () => {
  const evidence = JSON.parse(
    readFileSync(new URL("./xbox-evidence.json", import.meta.url)),
  );
  const map = {
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
  for (const c of cheats.filter((c) => c.buttons))
    assert.deepEqual(
      c.buttons,
      evidence.sequences[c.id].map((key) => map[key]),
      c.id,
    );
});
test("known source errors and unavailable variants cannot silently reappear", () => {
  assert.equal(byId("sanchez").phone, "1-999-633-7623");
  assert.equal(byId("pcj-600").phone, "1-999-762-538");
  assert.equal(byId("trashmaster").phone.replace(/-/g, ""), "19998727433");
  assert.equal(byId("fast-run").phone, null);
  assert.equal(byId("drunk").phone, null);
  assert.equal(byId("rapid-gt").buttons, null);
  assert.equal(chooseMethod(byId("fast-run"), "phone"), "pad");
  assert.equal(chooseMethod(byId("rapid-gt"), "pad"), "phone");
  for (const id of ["dodo", "kraken", "duke-odeath"]) {
    assert.equal(byId(id).unlock, true);
    assert.equal(byId(id).quick, false);
    assert.ok(byId(id).note);
  }
});
test("19 original marker IDs and close-up sequence numbers form complete distinct sets", () => {
  assert.equal(stores.length, 19);
  assert.equal(new Set(storeIds).size, 19);
  assert.deepEqual(
    [...storeIds].sort(),
    [
      ...Array.from({ length: 9 }, (_, i) => `SR${i + 1}`),
      ...Array.from({ length: 10 }, (_, i) => `PR${i + 1}`),
    ].sort(),
  );
  assert.deepEqual(
    stores.map((s) => s.sequence).sort((a, b) => a - b),
    Array.from({ length: 19 }, (_, i) => i + 1),
  );
  assert.equal(stores.find((s) => s.id === "SR5").area, "Chumash");
  assert.equal(stores.find((s) => s.id === "SR7").sequence, 1);
  for (const s of stores) {
    assert.ok(s.width > 500 && s.height > 200);
    assert.equal(new URL(s.image).hostname, "fictionhorizon.com");
    assert.equal(s.latitude, undefined);
    assert.equal(s.longitude, undefined);
  }
});
test("hash routing is safe under a GitHub Pages project path and ignores normal anchors", () => {
  assert.equal(parseRoute("#main"), null);
  assert.equal(parseRoute("#/cheat/%E0%A4%A").view, "missing");
  assert.equal(parseRoute("#/store").view, "missing");
  assert.equal(parseRoute("#/guide/nope").view, "missing");
  assert.equal(parseRoute("#/cheat/rapid-gt").id, "rapid-gt");
  const route = parseRoute("#/stores?q=Chumash&f=todo&r=west");
  assert.equal(route.query, "Chumash");
  assert.equal(route.filter, "todo");
  assert.equal(route.region, "west");
  assert.equal(parseRoute("#/cheats?c=nonsense").category, "quick");
});
test("search handles aliases, accents, punctuation, original markers and digits", () => {
  assert.deepEqual(
    searchItems(cheats, "god mode").map((c) => c.id),
    ["invincibility"],
  );
  assert.ok(searchItems(cheats, "heli").some((c) => c.id === "buzzard"));
  assert.ok(searchItems(cheats, "bike").some((c) => c.id === "sanchez"));
  assert.deepEqual(
    searchItems(cheats, "19996337623").map((c) => c.id),
    ["sanchez"],
  );
  assert.deepEqual(
    searchItems(cheats, "Duke O'Death").map((c) => c.id),
    ["duke-odeath"],
  );
  assert.equal(searchItems(stores, "sr5")[0].area, "Chumash");
  assert.equal(searchItems(stores, "Richman Glen")[0].id, "PR4");
  assert.equal(searchItems(stores, "<script>").length, 0);
});
test("local state validates imports, removes unknown IDs and retains only supported properties", () => {
  const cleaned = sanitizeState(
    {
      ...fresh(),
      favorites: ["buzzard", "buzzard", "<img>", 2],
      stores: ["SR5", "SR99"],
      method: "bad",
      token: "private",
    },
    cheatIds,
    storeIds,
  );
  assert.deepEqual(cleaned.state, {
    version: 1,
    favorites: ["buzzard"],
    stores: ["SR5"],
    method: "phone",
  });
  assert.equal(cleaned.dropped, 4);
  for (const bad of [
    null,
    {},
    { ...fresh(), version: 2 },
    { ...fresh(), stores: "SR5" },
  ])
    assert.throws(() => sanitizeState(bad, cheatIds, storeIds));
});
test("blocked storage getter, null storage, corrupted JSON and quota failures produce a visible warning", () => {
  for (const get of [
    () => {
      throw new Error("Denied");
    },
    () => null,
    () => ({ getItem: () => "{broken", setItem() {} }),
  ]) {
    const store = createStorage(get, cheatIds, storeIds);
    assert.ok(store.warning);
    store.save({ ...fresh(), favorites: ["buzzard"] });
    assert.deepEqual(store.state.favorites, ["buzzard"]);
  }
  let calls = 0;
  const store = createStorage(
    () => ({
      getItem: () => null,
      setItem() {
        if (calls++) throw new Error("Quota");
      },
    }),
    cheatIds,
    storeIds,
  );
  assert.equal(store.warning, "");
  store.save({ ...fresh(), stores: ["SR5"] });
  assert.ok(store.warning);
  assert.deepEqual(store.state.stores, ["SR5"]);
});
test("storage survives reload with a guide-specific key and does not mutate another project", () => {
  const data = new Map([["unrelated", "leave me alone"]]);
  const api = {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
  };
  const a = createStorage(() => api, cheatIds, storeIds);
  a.save({
    ...fresh(),
    favorites: ["sanchez"],
    stores: ["SR5"],
    method: "pad",
  });
  const b = createStorage(() => api, cheatIds, storeIds);
  assert.deepEqual(b.state, a.state);
  assert.equal(data.get("unrelated"), "leave me alone");
  assert.ok(data.has(STORAGE_KEY));
});
test("mobile metadata prevents telephone links and permits zoom; CSP permits exactly the image publishers", () => {
  const html = readFileSync(
    new URL("../site/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /name="format-detection" content="telephone=no"/);
  assert.match(html, /width=device-width, initial-scale=1, viewport-fit=cover/);
  assert.doesNotMatch(html, /maximum-scale|user-scalable|tel:/);
  const policy = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
  )[1];
  const imageSources = policy
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith("img-src "))
    .split(/\s+/)
    .slice(1);
  const expected = [
    "'self'",
    ...new Set(
      [overview.image, ...stores.map((s) => s.image)].map(
        (url) => new URL(url).origin,
      ),
    ),
  ];
  assert.deepEqual(imageSources.sort(), expected.sort());
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
});
