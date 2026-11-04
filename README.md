# Glovebox — GTA V / PS5 field guide

A phone-first Story Mode reference: 36 cheats and extras, 19 original store map close-ups, searchable PlayStation inputs and in-game phone numbers, favorite cheats, and a local store checklist.

**[Open the guide](https://0xmarcio.github.io/gta-v-ps5-guide/)**

## Scope and accuracy

Sources were checked on **4 November 2026**. This is a comparison of published guides, not a claim that the inputs were tested on a physical PS5. Built-in cheats are for Story Mode, not GTA Online.

Every entry links to its sources. Conflicting Fast Run / Drunk phone variants and the Rapid GT controller variant are withheld; an agreed alternate input method remains available. Two store naming disagreements are visible on their detail pages. Read [the content audit](CONTENT_AUDIT.md) for the source register and corrections.

Maps are the original publisher-hosted game screenshots. There are no generated coordinates or redrawn location pins. The guide retains the overview's SR/PR labels and explicitly distinguishes them from the close-up numbering.

## Use

- Search any cheat, effect, vehicle, code word or phone digits. Search covers all entries, even when Quick picks is selected.
- Switch between Phone and Controller. An unavailable input method automatically falls back to the usable one, with an explanation.
- Star favorites and tick stores. Selections are stored only in this browser; export/import a backup from Saved to move them.
- Enlarge a store map, use 2×/3× zoom, or open the publisher's original image. External images require a connection and may become unavailable.
- Bookmark the site or add it to your phone's Home Screen. There is no offline guarantee or account/game sync.

## Local development

No build step or runtime dependencies. Use Node 22+ for tests and any static HTTP server for `site/`.

```sh
npm test
node --check site/app.js
python3 -m http.server 8765 --directory site
```

All assets use relative paths and routes use `#/…`, so GitHub Pages project paths and deep links work without server rewrites. The workflow checks the content and utility behavior before deploying only `site/` to Pages. Configure the repository's Pages source as **GitHub Actions**.

The 16 automated checks include regression coverage for older-browser query handling, recovery of unreadable saved data, cross-tab state updates, and preservation of the original 19-image crosswalk. Browser QA separately exercised 320px and 390px phone layouts, landscape and desktop layouts, deep links, keyboard filters, favorites/checklist persistence, backup import/export, two tabs, blocked clipboard/storage, and failed image/module downloads. All 19 close-ups and the overview loaded on the public Pages origin. These were Chrome viewport tests, not tests on physical iOS/Android devices.

The independent Xbox sequence fixture is transcribed from source material, not produced from the app's PlayStation data. Tests check all 30 published controller sequences, phone mnemonic consistency, source-error regressions, hash routing, search, backup validation, and blocked/corrupt/quota-limited storage. A mnemonic consistency test catches transcription errors; it cannot prove in-game activation.

## Privacy and licenses

No analytics, tracking scripts, accounts or backend. GitHub serves the site; image requests go directly to GosuNoob and Fiction Horizon. Browser storage uses a guide-specific key because GitHub Pages projects share an origin.

Original code and writing: [MIT](LICENSE). Barlow Condensed and Overpass Mono: SIL Open Font License, included beside the self-hosted fonts. Third-party images, game art, names and trademarks remain with their respective rights holders and are **not** covered by the code license. Images are linked/embedded from attributed publishers, not redistributed in the repository.

Unofficial; not affiliated with Rockstar Games or Take-Two.
