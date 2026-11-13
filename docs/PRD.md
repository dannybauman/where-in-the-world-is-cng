# PRD: Where in the world is Cloud-Native Geospatial?

The guardrails for this game. Read this before changing what the game is, who it is for, or how it plays. When a change disagrees with this page, change the page on purpose (with the date and why) or change the plan, never drift.

## Why it exists

Danny, 2026-11-11: "a game based on Groundstation that is for non-technical non-geospatial-expert users to learn about geospatial technology and relevant open source tools and data. it should be browser based, and use Groundstation under the hood, but gradually walk the player through scenarios as if they were a detective or natural disaster responder or data journalist wanting to answer important questions and share insights."

Danny, 2026-11-12: "this game should not only be fun and use the CNG tools and data, it should also be purposeful in showing/teaching scenarios where CNG enables things that weren't possible otherwise, or were costly in money or time. maybe it can walk the player through (or simulate) an old way of doing something and then show how much better it is with CNG"

## Who it is for

People new to all of this: no GIS, no code, no remote sensing. If a step needs a word they would not know, the step teaches the word or drops it.

## Principles (the things that keep us on course)

1. **Every choice is fair.** The player can answer it from what is on screen. Numbers appear after a choice, never as the hint that makes it.
2. **Simple, short language.** One idea per sentence. Real terms (STAC, NDWI, embeddings) arrive as a Notebook note, after the player has used the thing.
3. **Gradual.** First Look before anything else. It opens the daily mystery round and the first case; the cases then open in order, each adding one new idea.
4. **Real data, honest answers.** Every case runs on live open data through Groundstation. When the data says the claim does not hold, the game says so. Each case ends with claim, evidence and limits.
5. **DevSeed-shaped cases.** Cases follow the kinds of problems Development Seed works on for partners and in Labs. A partner is named only when the work is public; otherwise the game describes the kind of problem.
6. **Probe before you write.** A new case is written only after a quick data check shows Groundstation returns what the case needs, at the place and dates it uses.
7. **A love letter, not a copy.** The feel of the geography detective games we grew up with (a mystery place, clues that teach real geography, travel by deduction, ranks to climb, someone one step ahead), with nothing taken from them: no characters, names, agency, art, music or lines.
8. **The open tools get the credit.** Every Notebook note links to the open project behind it.
9. **Free, open and gentle on it.** No signup, no API key, for the player or for us: every source is open and reachable anonymously. The game is a light guest on free services (Danny, 2026-11-12: "make sure our game doesn't overload free endpoints, and doesn't need signup"):
   - the server answers a repeat question from memory (a day for pictures and places, 10 minutes for live feeds);
   - picture tiles load only inside the case box, at zoom 8 to 14;
   - a case's place is found while writing the case, never looked up while playing;
   - a mystery round loads one small picture (a 640 px JPEG), and map tiles only after the answer lands, inside its box;
   - when a service says to slow down, we stop and come back later, never retry in a loop.

10. **Show what cloud-native makes possible.** Fun is the hook; the purpose is to show what cloud-native geospatial (CNG) made possible, cheap or fast that was not before. Each case and the mystery round carry one "Then and now" beat: a short re-creation of the old way beside the real new way.
    "CNG" here means the whole ecosystem, not only the file formats (Danny, 2026-11-12: "when i say CNG sometimes i mean the ecosystem of DevSeed things too, like embeddings/geoai/etc"): open formats (COG, Zarr, GeoParquet), STAC catalogs, dynamic tiling (TiTiler, eoAPI), Earth embeddings and GeoAI, and the open tools Development Seed and others build on them. Beats may show any of these, credited to the open project behind them.

## The feel

Updated 2026-11-12.

- Two ways to play. **Cases** are the story path: a claim to check, a few short steps, a case file at the end. **The mystery round** is the replay: "Where in the world is this?"
- Travel is a dotted flight line along the great circle, from the player's pin to the answer. The map then lands on the place and lays the same picture into it. This is the one big moment; everything else stays quiet.
- Ranks, named for the craft, rise from every star (cases plus the best score on each mystery place): Pixel Peeper 0, Band Reader 6, Orbit Sleuth 16, Ground Truther 30. Home shows the rank, a meter, and how many stars the next one needs.
- The trickster is **a cheeky cloud**, a small drawn character. It drifts over the picture in some mystery rounds, over a real cloudy date of that place. The player beats it with "Pick a clearer date". Radar, which sees through clouds, waits for the flood case.
- Words: one idea per sentence. Buttons say what happens. Errors say what to do. Long waits say which part they're on. A Notebook note shows once, the first time it's earned.
- Look: Development Seed branding (Danny, 2026-11-12: "let's redo the design/colors to align with DevSeed branding"), checked on developmentseed.org that day. Primary orange `#CF3F02` for buttons, highlights, active states, the case box and progress; secondary teal `#46D6CD` for accents and fills only (too light for text on white, so teal text uses a darker `#0B6B66`); text `#443F3F` on white, warm neutrals `#F7F4EF` and `#DEDAD4`; a green for right answers and a deep red for wrong ones, the only places color carries meaning in the interface. Corners are 4 px and buttons carry no shadow; pills only on the Map/From space toggle. Roboto Condensed headings, Roboto body: DevSeed's own site uses Antarctica, a paid font that cannot be loaded freely, so Roboto stands in, as on DevSeed's posters. No DevSeed logo. Every text pair meets 4.5:1 (ratios listed in `tokens.css`). The map data colors (burn and water indexes) are unchanged. Big map, game text beside it (below on a phone). Checked at 390 px and 1280 px.

## The mystery round

Added 2026-11-12. One satellite picture of a famous place, with no labels. Up to 3 short clues, one at a time, each teaching a bit of geography or remote sensing ("the fields are circles: center-pivot irrigation"). The player drops a pin on the world map and locks it in. The game flies the dotted line to the answer and scores by distance: within 300 km 3 stars, 1,000 km 2, 3,000 km 1. It ends with one fact and a Notebook note.

- Everyone gets the same place each day (picked by date). "Play another" draws a place not yet solved with 3 stars.
- 12 places, each with one Sentinel-2 scene picked by hand on 2026-11-12: under 1% cloud, covering the whole box, checked to draw. Nothing is searched while playing. Palm Jumeirah, the Exuma Cays, the Al Jawf circle farms, the Richat Structure, the Nile at Luxor, Manhattan, Mount Fuji, Venice, the Afsluitdijk, the Mississippi delta, Rondônia, the Grand Canyon.
- The Afsluitdijk and the Mississippi delta also keep a real cloudy date, for the cloud character.
- Keyboard: arrow keys move the map, Enter drops the pin at its center.

## Then and now

One beat per case, at the moment the player has just done the new way, so the contrast lands on something they felt.

How it plays:
- The old way is a short, skippable re-creation, labeled as one ("How this was done in 2010"), with a fast-forward. It never makes the player wait for real.
- The new way is what they just did, with its real numbers measured in the game: seconds taken, megabytes read (from the browser's own timing of the tiles and requests).
- The end card puts the two side by side in plain words: time, money, data moved, who could do it.

Honesty rules (principle 4 holds here too):
- Every "then" number names its source and date in the Notebook note (for example: what a scene cost before Landsat went free in 2008, the size of a full Sentinel-2 product, a typical download speed of the time). No number goes in the game until its source is checked.
- "Now" numbers are measured live, never typed in.
- Where the old way was not slow but impossible (no archive, no free data, no global embeddings), say that instead of inventing a time.

Which idea each beat shows:

| Where | Then | Now (the CNG idea) |
|---|---|---|
| First Look | order and download a whole scene (around 1 GB), open it in desktop software, crop it | the map reads only the few tiles on screen (cloud-optimized files) |
| Mystery round | find a picture agency by agency, often paid or by request | one search across the whole open archive in about a second (STAC) |
| After the Fire | download every band for both dates, compute the burn index on your own computer | the index is computed next to the data and only the answer travels (dynamic tiling, TiTiler) |
| Forest case | hand-label many field samples and train a model for weeks | a few taps on precomputed embeddings map the change |
| Right Now, Near You | wait for a report or a press release | live feeds plus the newest picture, open to anyone |

Status: designed 2026-11-12. First Look built 2026-11-12: the map counts the tile bytes it fetches (TiTiler sends no Timing-Allow-Origin, so resource timing reads 0), and `/api/size` sizes the whole scene by HEAD from Earth Search. Mystery round built 2026-11-12: `/api/find` times one real, uncached STAC search of Earth Search's Sentinel-2 archive for the place's box and reports how many pictures it holds; the re-creation plays the first time, later rounds show only the card. Source for "agency by agency": stacspec.org/en/about. The other beats are not built yet.

## Cases

Order and status as of 2026-11-12.

| # | Case | Role | Idea it teaches | Status |
|---|---|---|---|---|
| 0 | First Look | Explorer | a satellite picture of a place you know; why only the part on screen loads (cloud-native files) | built; 3 steps; picks the recent clear picture that covers the most of the box |
| - | The mystery round | Explorer | reading a picture: water color, circle fields, cities, seasons, size | built; opens after First Look; daily plus replay |
| 1 | Forest case (working title) | Detective | was a forest cleared for farms after 2021: the player taps forest and farm spots, the game learns from them with embeddings and maps 2 years | next; needs a probed place |
| 2 | After the Fire | Responder | burn index before and after; then what grew back | built; "grew back" to add |
| 3 | Flood through clouds | Responder | radar sees through the cloud | built (Flood Under the Clouds, 6 steps, 3 stars); Sentinel-1 radar from Planetary Computer over north Porto Alegre, May 2024: about 6 km² of a 43 km² box under water vs under 1 km² in Dec 2021 |
| 4 | Right Now, Near You | Reporter | live feeds, then the nearest fire a satellite can see: fly there, before and after, burn score, tap the scar | rebuilt 2026-11-12 (slice 5): 5 steps, 2 stars; wildfires from NASA EONET first, planned burns as fallback; a fire counts only with a clear picture before it and one after with under 20% cloud over its box; quakes and storms are listed, not looked at |
| - | The Vanishing Lake | Detective | water index, honest debunk | built, opens second for now; to be replaced by the forest case |

Lesson from a trial case on the 2025 Los Angeles fires (built and removed 2026-11-12, too close to After the Fire): over burned towns the mean burn score is unusable, because ash and dark roofs push both bands near zero and a few pixels divide by almost nothing (Altadena read 1.79, Palisades -1.05, and TiTiler failed outright on some boxes). Count the share of ground under a line instead (`burn<0.1`: Altadena box 16% to 46%, Palisades 19% to 70%, Sentinel-2 Jan 2 and Feb 21 2025). Do not add 1 to the denominator to dodge the division: TiTiler scales the bands to 0 to 1, so +1 dragged a 0.29 score to 0.07.

Use-case themes behind this, ranked (from Danny's DevSeed notes, 2026-11-12): forests and embeddings; flood and radar; ask a question, get a map; fire and recovery; why the data stays put.

## Pass 2: one cohesive polish (planned 2026-11-12)

Danny, 2026-11-12: "make it better ... better actual game content, onboarding, and story. better design, better UX, better gameplay, better polish, better smooth progression from easy/new to more challenging/replay-value, reduce complications and use simple concise language". Done as one designed pass in the slices below, each its own commit, not a run of patches.

**The main goal (Danny, 2026-11-12, correcting the first draft of this plan):** "it was much better having it walk through real live historical events and changes and seeing different images and layers and seeing the actual problems needing solving and how imagery and geo data can help, and calculating changes, all the is the main goal. the "guess where" stuff is a nice quick intro or something to come back to sometimes". So the cases carry the game. The mystery round is a warm-up and a side pocket, and gets no new machinery in this pass.

The calls (made 2026-11-12, Danny's "your call" on the rest):
- **Cases are the game.** Each case is a real event or change, with a real problem someone had to solve. The player looks at more than one picture and more than one layer (true color, infrared, an index, a live feed), measures the change with a number, and uses it to decide something. Depth over count.
- **Story.** Each case opens with the real problem in one or two lines (who needed to know what, and when) and closes with what the player found and what it means for them. No chase plot, no borrowed characters; the cheeky cloud stays the only trickster.
- **Progression.** Cases go from one picture, to two dates, to an index, to measuring change over an area, to combining layers (radar, embeddings, live feeds). Replay comes from new real events and from cases with more than one place to investigate, not from scores alone.
- **Mystery round.** Stays as the quick intro after First Look and a thing to come back to. No tiers, streaks or new places this pass.
- **Language and design.** One copy sweep over every screen (one idea per sentence, buttons say what happens), then one design pass with the frontend-design checklist, checked at 390 px and 1280 px.

Slices, in order (each about 15 minutes, each shown in Danny's window before the next):
1. A fresh-eyes playthrough by a helper, start to finish, listing every friction point in plain words, with the most weight on the cases. It grounds the rest; the slices below change if it finds something bigger.
2. Deepen After the Fire: add "what grew back" (a later date, the same index, the change measured).
3. Rebuild The Vanishing Lake around a number that holds (playthrough: the average water score over a mostly-desert box gave -0.13 vs -0.16 and a shaky verdict, and 2025 vs 2026 look the same). Measure the water's area inside the lake, over years far enough apart to see, and show the published lake level beside it. Or replace it with the Forest case once INPE DETER gives a clearing.
4. A new case from the ranked themes: flood through clouds with radar. Done 2026-11-12.
5. Give Right Now, Near You real content (playthrough: a quiet place gives a lookup and a quiz, no picture or layer). When nothing is near, go to the nearest live event and look at it. Done 2026-11-12: always goes to the nearest fire a picture can show (Portland found the Bras fire, Montana, 648 km; tap read 0.33 to 0.18).
6. Copy sweep and story lines across all cases, including a closing "what you found, what it means" line on every case, a visible rule for stars with one retry, and plain words for STAC, COG and TiTiler. Done 2026-11-13: every case closes on what you found and what it means; a right call the first time earns a star, and a miss gets one more try (picks, pictures and taps); the case header shows stars as you go.
7. Design and polish pass, including the phone map (taller, controls off the area being judged), cases above the mystery card on a phone, and a spinner on every wait over a second. Done 2026-11-13: phone map 55% of the screen; a case box is framed clear of the top buttons and the switch; cases above the mystery card everywhere; the map says "Drawing the picture…" after a second, and previewing a picture shows a wait line; the switch fits a 390 px phone; radar pictures credit Planetary Computer. Checked at 390 and 1280 px on the flood case. The no-fire path of Right Now was read, not played.
8. Replay every case once, then fix what it finds as one change. Done 2026-11-13: all 5 cases replayed to Case closed with one wrong try each. Fixed: After the Fire's first map tap (a right tap threw an error, a miss printed "undefined"); First Look's switch step now takes both taps and leaves the picture on; answer order is shuffled and the wrong headlines are as long and specific as the right one, so the player has to judge the claim; Lake copy that disagreed with itself (100% vs "most", 2022 vs 2026, "main body", "3 days"); "burn score" is now "plant health score" (it falls when land burns); Right Now compares a tapped spot with the change over the whole box, and says "no clear burn scar yet" in the headline and case file when nothing stands out (so on a small or hazy fire the tap star can't be earned; accepted for an honest claim); weather gives up after 8 seconds. Added: "Recent developments" under Then and now (Zarr, reading straight from cloud storage) with 2 Notebook notes; "Why you can trust this" on every Case closed screen (who made it, how it reached you, why it holds up, a link to each picture's catalog item), built from each case's `pics`, `ground` and `also` by one function in `moves.js`. Checked: "spring 2020 was the fullest since these satellites launched" holds (March 2020, 1,098.59 ft, is the highest end-of-month level since June 2015, US Bureau of Reclamation). Not replayed after the fix: Lake and Flood (copy and the shared trust block only).

Status: built 2026-11-13 as **Who Did It?** (Investigator, 11 steps, 4 stars, `cases/who.js`, after Flood). Three scenes, each verdict from a measurement the player triggers. Mississippi, April 2020: 3 cross-sections of the plant health score change give a band 1.5, 1.2 and 0.9 km wide along about 20 km (90 stats calls, about 8 s cold), so a tornado, not straight-line winds. Dominica, Maria 2017: green forest share by quarter fell NW 59% to 26%, NE 31% to 16%, SW 30% to 20%, SE 47% to 13%, so a hurricane, not a flash flood down one valley. Sindh 2022: water share of the Manchar Lake box was 10% June, 52% Sept, 42% Oct, 27% Nov, 21% Dec, so a monsoon flood, not a dam break. The event feed check could not be done because Groundstation's events tool lists only open events, so the Mississippi scene checks against the National Weather Service survey (EF4) instead. One new note, "Reading the mark". The Sindh hunch earns no star, because the tap and the 3 line-ups already fill the 4 stars. Boxes and scene ids: `docs/who-did-it-pictures.md`.

The bar for this case (Danny, 2026-11-13): "make sure it's utilizing CNG well with Groundstation, showcasing what we've been trying to showcase, not just general weather info. but still compelling and understandable real world scenarios". So every verdict comes from something the player does with the open data, never from a fact about weather:
- Each scene is a real event with a real person who needed the answer (an insurer, a county planner, an aid team).
- The player searches the catalog by place and date (STAC), flips before and after, and measures the mark with a Groundstation tool: its width and length, the area that changed, the plant health or water score.
- Time is evidence too: one search shows how long the mark lasts. Monsoon water stays for weeks; a flash flood is gone in days and leaves mud. Reading 3 dates costs seconds because a COG is read in pieces.
- At least one scene needs a second layer to settle it (radar through cloud, or an index), and one checks the picture against the event feed's own record.
- A line-up card states a mark only if a picture in the game shows it, or says plainly that this resolution can't show it.
- The case closes with the same trust block and a case file that names its limits.

Playthrough (slice 1, 2026-11-12): First Look, Lake, Fire and Right Now plus the mystery round at 1280 px, First Look and Fire at 390 px. Fire is the strongest case. The place-name bug ("Portland (US is totally safe") was fixed on the spot.

## How it is built

- Its own public repo, `dannybauman/where-in-the-world-is-cng` (MIT), installing Groundstation as a library pinned to a commit, so the game calls Groundstation's tools rather than copying them. Groundstation itself is not changed for the game. A Groundstation update reaches the game when the pin is moved on purpose and the game is tried.
- No cloud AI model is used while playing, so hosting it needs no AI key; an "ask a question" case would change that, and waits.
- `src/wherecng/app.py`: a small FastAPI app, thin routes over `groundstation.tools` (geocode, events, weather, search, stats, tiles, and preview: one picture of a box, for the mystery round).
- A picture is one satellite pass, not one tile: `passes.py` groups the same satellite's tiles from one date, gives each part of the box to one tile so overlaps count once, and the map paints every tile of the pass. A case box can cross tile edges and still be fully covered (Lake Mead takes 5 tiles).
- `src/wherecng/static/index.html`: the page shell only. Vanilla JS (native ES modules) and MapLibre with OpenFreeMap, no build step. Progress in localStorage (`gt2`): case stars, notes, best stars per mystery place and today's result. Old saves load as they are; fields are only ever added, and a save that can't be read is set aside under `gt2-unreadable`, never deleted.
- `static/css/tokens.css` holds every design value (colors, fonts, type, space, radii, shadows, motion) as custom properties named by role. `static/css/app.css` reads only those, in layers (`reset, base, layout, components, utilities`), phone layout first and the wide one at 900px.
- `static/js/`: small modules (api, map, engine, notes, save, home, main, mystery). One file per case in `js/cases/`; a new case is one new file plus one line in `js/cases/index.js`. Mystery places live in `js/places.js`; a new place is one entry with a scene id checked by hand.
- `src/wherecng/app.py` serves `static/` at `/static`.
- Smoke test, no network: `uv run python tests/test_smoke.py` (page loads, every file is served, imports resolve, JS parses).
- Outside text (place names, alert titles, scene ids) is escaped where it enters the game.
- New dependencies only when a few lines cannot do it.

## Not doing (for now)

- Accounts, scores online, multiplayer.
- A build step or a frontend framework.
- Cases that need data Groundstation cannot reach.
- Tests beyond a smoke check while it is a prototype; they arrive when it is hardened or others rely on it.

## How we work on it

- Danny makes the product calls when he wants to; otherwise the agent makes them to keep moving and says which way it went.
- Public repo: ask Danny before each push. Commits are short and generic, in Danny's name, with the model's Co-Authored-By trailer.
- Change this page in the same commit as any change to the principles, the case list or the build.

## Open questions

- The forest case place, probed 2026-11-12:
  - Compare 2021 with 2025 only through `compare_dates`, which corrects for the offset Sentinel-2 added in 2022; raw stats hid a real drop at Lábrea (0.81 to 0.72).
  - Lábrea's drop looks like fire-scorched forest (the 2024 drought), not farms: a possible later case, not this one.
  - A 36-box sweep of Triunfo do Xingu found only pasture changing with the season. A box average cannot find a clearing.
  - Next: a clearing from INPE's DETER alerts (open, no signup; its WFS was overloaded on 2026-11-12, so try later, gently). MapBiomas Alerta and Global Forest Watch need an account, so they are out.
  - The embeddings (OlmoEarth on Source Cooperative) are read anonymously; a 3 km box keeps each play to a few MB.
- Can Groundstation reach Sentinel-1 radar for the flood case? Yes, probed 2026-11-12: search, statistics and tiles all work on Planetary Computer `sentinel-1-rtc` (asset `vv`). Tile expressions are ignored there, so radar is drawn plain gray; the water count (`vv<0.02`) goes through statistics.
