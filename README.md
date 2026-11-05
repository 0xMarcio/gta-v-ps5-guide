# Glovebox · GTA V / PS5

A phone-friendly companion for GTA V Story Mode.

**[Open the guide](https://0xmarcio.github.io/gta-v-ps5-guide/)**

- **Play:** useful cheat shortcuts, a personal session note, recruitment and unlock guides, taxi/vehicle/save tips.
- **Cheats:** 36 phone entries and 31 DualSense sequences; search, categories, pins, recent cheats and full-screen Big view. Inputs follow the [GTA Base PlayStation list](https://www.gtabase.com/grand-theft-auto-v/gta-5-cheats-ps5-ps4-ps3-cheat-codes); Black cellphone is a sourced additional phone entry.
- **Places:** 19 original store close-ups, a picker, previous/next, Done & next, undo, zoom and an overview map. Existing store IDs and original image mappings are preserved.
- **Money:** all five assassination investment workflows, separate character checkboxes, price notes and whole-share profit calculation, heist crew roles/cuts and 15 income properties.
- **100%:** the five weighted game counters, all 42 hobbies and 16 miscellaneous requirements, collectible targets, 104 mission/side-mission walkthrough references and a 20-animal wildlife checklist.
- A manual five-minute invincibility reminder, browser screen wake lock, global search and JSON backup/import. No spoiler gates.

## Run locally

Requires Node 22+ for tests. The website itself has no build step or runtime dependencies.

```sh
npm test
python3 -m http.server 8765 --directory site
```

Open `http://localhost:8765`. Hash routes and relative assets work under the GitHub Pages project path. Pushing `main` runs tests and syntax checks before Pages deployment.

## Content and storage

See [CONTENT_AUDIT.md](CONTENT_AUDIT.md) for sources and data decisions. References are also beside the corresponding content in the guide.

All mission and ending information is available immediately. Expandable sections organize long lists; they do not require a story-stage setting.

The five completion counters are copied manually from the game's checklist. Individual planning checkboxes and collectible notes do not silently change those counters. Alternative heist approaches and endings are reference entries, not extra completion requirements.

Pins, checklists, notes and timer state are stored under `glovebox.gta-v-ps5.v2`. The first load migrates the original v1 data without deleting or modifying the v1 key. v1 and v2 backups import through a preview; applying an import downloads the current data first and offers Undo. Corrupt data gets a recovery copy where storage permits. Blocked storage remains usable in memory with a visible message.

Maps load from the credited external publishers and require a connection. App data is not connected to the game or synced between devices. Use Export/Import to transfer progress. The timer is a manual real-time reminder; pause it yourself when pausing the game. Screen wake lock depends on browser support and may be released by the OS.

## Tests

The regression suite covers exact GTA Base phone/controller transcription, the retained independent Xbox comparison, all 19 original map crosswalks, navigation, migration/recovery, input validation, trade order, whole-share arithmetic, completion weights, timer deadlines, routes and rendering without withheld content.

## Credits

Original game imagery and marks belong to their respective owners. Map imagery is loaded from Fiction Horizon and GosuNoob with attribution. This unofficial fan guide is not affiliated with Rockstar Games or Take-Two. Barlow Condensed and Overpass Mono are self-hosted under their included OFL licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
