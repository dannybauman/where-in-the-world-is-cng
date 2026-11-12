# PRD: Where in the world is Cloud-Native Geospatial?

The guardrails for this game. Read this before changing what the game is, who it is for, or how it plays. When a change disagrees with this page, change the page on purpose (with the date and why) or change the plan, never drift.

## Why it exists

Danny, 2026-11-11: "a game based on Groundstation that is for non-technical non-geospatial-expert users to learn about geospatial technology and relevant open source tools and data. it should be browser based, and use Groundstation under the hood, but gradually walk the player through scenarios as if they were a detective or natural disaster responder or data journalist wanting to answer important questions and share insights."

## Who it is for

People new to all of this: no GIS, no code, no remote sensing. If a step needs a word they would not know, the step teaches the word or drops it.

## Principles (the things that keep us on course)

1. **Every choice is fair.** The player can answer it from what is on screen. Numbers appear after a choice, never as the hint that makes it.
2. **Simple, short language.** One idea per sentence. Real terms (STAC, NDWI, embeddings) arrive as a Notebook note, after the player has used the thing.
3. **Gradual.** First Look before any case. Cases open in order, each adding one new idea.
4. **Real data, honest answers.** Every case runs on live open data through Groundstation. When the data says the claim does not hold, the game says so. Each case ends with claim, evidence and limits.
5. **DevSeed-shaped cases.** Cases follow the kinds of problems Development Seed works on for partners and in Labs. A partner is named only when the work is public; otherwise the game describes the kind of problem.
6. **Probe before you write.** A new case is written only after a quick data check shows Groundstation returns what the case needs, at the place and dates it uses.
7. **A love letter, not a copy.** The feel of the geography detective games we grew up with (a mystery place, clues that teach real geography, travel by deduction, ranks to climb, someone one step ahead), with nothing taken from them: no characters, names, agency, art, music or lines.
8. **The open tools get the credit.** Every Notebook note links to the open project behind it.

## The feel

- Each case opens with a mystery: "Where in the world is this?" or a claim to check.
- Travel is a dotted flight line across the globe, with one fact about the place on landing.
- Ranks, named for the craft: Pixel Peeper, Band Reader, Orbit Sleuth, Ground Truther.
- The trickster is **a cheeky cloud** that drifts in front of the evidence. Beating it teaches real lessons: pick a clearer date, or use radar, which sees through clouds.
- Look: colors from infrared imagery (magenta `#b8285e` life and burn, teal `#1f7a8c` water, ink `#142a33`); Bricolage Grotesque headings, Lexend body. Big map, case text beside it (below on a phone).

## Cases

Order and status as of 2026-11-12.

| # | Case | Role | Idea it teaches | Status |
|---|---|---|---|---|
| 0 | First Look | Explorer | a satellite picture of a place you know; why only the part on screen loads (cloud-native files) | built; the cloud-native lesson to add |
| 1 | Forest case (working title) | Detective | was a forest cleared for farms after 2021: the player taps forest and farm spots, the game learns from them with embeddings and maps 2 years | next; needs a probed place |
| 2 | After the Fire | Responder | burn index before and after; then what grew back | built; "grew back" to add |
| 3 | Flood through clouds | Responder | radar sees through the cloud | idea; probe radar access first |
| 4 | Right Now, Near You | Reporter | live feeds plus newest picture; to become "ask a question, get a map" | built; reshape later |
| - | The Vanishing Lake | Detective | water index, honest debunk | built; to be replaced by the forest case |

Use-case themes behind this, ranked (from Danny's DevSeed notes, 2026-11-12): forests and embeddings; flood and radar; ask a question, get a map; fire and recovery; why the data stays put.

## How it is built

- Its own public repo, `dannybauman/where-in-the-world-is-cng`, installing Groundstation as a library pinned to a commit. Groundstation itself is not changed for the game.
- `src/wherecng/app.py`: a small FastAPI app, thin routes over `groundstation.tools` (geocode, events, weather, search, stats, tiles).
- `src/wherecng/static/index.html`: the whole game, vanilla JS and MapLibre with OpenFreeMap, no build step. Progress in localStorage (`gt2`).
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

- The forest case place: probed 2026-11-12 at 3 guessed Amazon hotspots (Lábrea, Apuí, Novo Progresso, 3 km boxes, July-August 2021 vs 2025); none showed a drop in plant health. Next: find a clearing from a published deforestation alert first, then probe the embeddings there.
- Can Groundstation reach Sentinel-1 radar for the flood case?
