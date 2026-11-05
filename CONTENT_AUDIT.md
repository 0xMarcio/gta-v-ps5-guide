# Content audit — 5 November 2026

## Cheats

The published PlayStation inputs follow [GTA Base](https://www.gtabase.com/grand-theft-auto-v/gta-5-cheats-ps5-ps4-ps3-cheat-codes). `tests/gtabase-evidence.json` contains a separately captured transcription of its 35 entries. The suite compares every digit and controller token; the 30 previously compared Xbox sequences remain an additional regression fixture.

Restored inputs:

- Fast run: **1-999-2288-463**.
- Drunk mode: **1-999-547-861**.
- Rapid GT: **R2, R2, L1, Circle, Right, L1, R1, Right, Left, Circle, R2**.

A mnemonic conversion is not used to override the chosen source. Health & armor also repairs an occupied vehicle. Weapons gives a loadout and ammo; it does not grant every weapon or infinite ammo. Three intensity levels followed by a fourth activation to disable slow motion/aim follow GTA Base.

[GTA BOOM](https://www.gtaboom.com/every-gta-5-cheat-console-code-and-phone-number-0740) supplies the extra Black cellphone entry. [Rockstar Support](https://support.rockstargames.com/articles/4ewFY12QOE4O7V1uWDEekt/information-about-saving-and-achievements-while-using-gta-v-cheat-codes) supplies saving and trophy guidance. Website testing does not constitute an in-game PS5 test; the guide displays the published codes without a speculative “unverified” gate.

## Maps

The 19 close-ups retain the original image URLs, dimensions, sequence numbers and SR/PR marker crosswalk. `tests/closeup-evidence.json` records the previously inspected original images and hashes. All 19 live image downloads were rechecked on 5 November 2026 and matched those SHA-256 hashes exactly. No coordinates or generated map placements were added.

Sources: [Fiction Horizon close-ups](https://fictionhorizon.com/heres-what-convenience-stores-in-gta-v-are-how-to-rob-them/), [GosuNoob overview](https://www.gosunoob.com/grand-theft-auto-5/gta-5-stores-places-you-can-rob/), [PowerPyx Story Mode checklist](https://www.powerpyx.com/gta-v-100-completion-checklist-guide/). Alternative labels for Strawberry and the northwest-hills shop are shown quietly beside the map. The 19 checks are a personal store tour, not 19 requirements for 100%.

## Investments and crews

The [GTA Base assassination guide](https://www.gtabase.com/grand-theft-auto-v/side-missions/gta-5-lester-s-assassinations-guide-how-to-make-2-billion-with-stock-market) supplies the trade order:

| Mission      | Before       | After / rebound                                         |
| ------------ | ------------ | ------------------------------------------------------- |
| Hotel        | BET / BAWSAQ | Sell BET; buy and later sell BIL / LCN                  |
| Multi Target | DEB / LCN    | Sell DEB; buy and later sell RWC / LCN                  |
| Vice         | FRT / BAWSAQ | Sell FRT; buy and later sell FAC / BAWSAQ               |
| Bus          | No purchase  | Buy VAP / BAWSAQ after the mission, sell after recovery |
| Construction | GCD / LCN    | Sell GCD after the rise                                 |

Only Hotel is mandatory for story progression. The other four are best saved for after the final story payout. Peak percentages differ between editions and playthroughs; the UI gives actionable order and manual price notes without a guaranteed percentage or countdown to a peak. All three portfolios are separate. Ending C advice is directly available, as requested.

Crew sources: [Jewel Store planning](https://www.gtabase.com/grand-theft-auto-v/missions/casing-the-jewel-store), [Paleto planning](https://www.gtabase.com/grand-theft-auto-v/missions/paleto-score-setup), [Bureau planning](https://www.gtabase.com/grand-theft-auto-v/missions/architect-s-plans), [Big Score planning](https://www.gtabase.com/grand-theft-auto-v/missions/planning-the-big-score). Role assignment matters: Taliana in the helicopter, inexperienced Karim on the train. Earlier casualties and recruitment affect availability.

## Completion and activities

[GTA Base’s 100% guide](https://www.gtabase.com/grand-theft-auto-v/guides/gta-5-100-completion-guide-checklist) supplies the five totals/weights: 69 story (55%), 20 Strangers & Freaks (10%), 42 hobbies (10%), 14 random events (5%), 16 miscellaneous (20%). Some other guides use different weight headings; the UI consistently follows GTA Base.

The hobby checklist has 42 entries: six shooting categories, 12 flight lessons, five street races, six off-road races, four sea races, three triathlons, tennis, darts, golf, a private dance and two parachuting groups. A weapon category requires all three challenges. Parachuting requires all five base jumps and all eight helicopter jumps.

The mission reference contains 80 distinct story/approach/ending walkthroughs and 24 required Franklin side-mission steps, of which four do not increment the in-game counter. These are not counted as 80/24 required missions. The user copies the five official in-game counters; planning lists remain separate to prevent double counting.

Collectible goals are 50 spaceship parts, 50 letters, 25/50 stunts, 25/50 bridges and 8/15 knife flights. Links go to PowerPyx’s actual location guides; no fabricated collectible coordinates or numbering.

Property prices and owners follow the PowerPyx checklist. The 20-animal list and Kraken unlock follow [GTA Base wildlife photography](https://www.gtabase.com/grand-theft-auto-v/side-missions/wildlife-photography-challenge). Recruitment, free vehicle unlocks and the Animal Ark reward follow [GTA Base random events](https://www.gtabase.com/grand-theft-auto-v/side-missions/random-events). Additional save, travel, time and recovery references are in `site/data/sources.js` and the in-app source register.

Unlock details also have direct references: [Flight School](https://www.gtabase.com/grand-theft-auto-v/side-missions/flight-school-challenges), [Far Out](https://www.gtabase.com/grand-theft-auto-v/strangers/far-out), and [LSPD Auto Impound](https://www.gtabase.com/grand-theft-auto-v/properties/story-mode/lspd-auto-impound). [GTA Guide’s availability update](https://gtaguide.net/gta5/misc/wildlife-photography-challenge/) describes the later availability of wildlife photography to non-returning players, including PS5; an old returning-player restriction is not added to this guide.

## Independent review and verification

Claude Opus 5.5 reviewed the requirements and plan before implementation, then reviewed the actual diff, source captures and rendered screenshots. Both runs used `claude -p --model opus --effort max --permission-mode plan`; the returned model identifier was `claude-opus-5-5`.

Verified review findings addressed include timer updates replacing focused controls, ambiguous focus restoration on counter buttons, list position being lost, missing activities in global search, map zoom moving the pin out of view, browser shortcuts being intercepted, and wake lock outliving Big view. The review also led to larger code displays, a tighter map layout, numbered store jumps, a corrected Ending C URL, restored map-fixture assertions and explicit font/image notices.

Suggestions rejected after checking:

- Deriving phone numbers from T9 instead of the chosen GTA Base source. The displayed published inputs remain intact.
- Spoiler gates and progress-based reveal controls. All mission, ending and unlock information is available immediately.
- A speculative returning-player-only warning for PS5. The older source descriptions do not establish that restriction for the current version.
- Changing the five PowerPyx collectible links based on their slugs. All five returned HTTP 200 at the exact published URLs.

The trophy wording recommends restarting and loading the clean save before a trophy run. Rockstar also explicitly supports reloading a save or rebooting the console to reset cheats; the stronger claim that reload alone cannot reset them was not adopted.

Validation includes 21 passing automated tests and Chrome interaction checks at phone, tablet and desktop viewport widths (320, 390, 767 and 1440 CSS pixels), plus landscape Big view. Browser checks exercised search destinations, store navigation and image failure/retry, zoom persistence, keyboard counter focus, timer persistence/expiry, wake state, backup/import/undo, migration, cross-tab updates, price calculations and module-load failure. These are browser and source checks, not a claim of physical PS5 or iPhone testing.
