# Expansion notes — brainstorm decisions

Companion to LOCKED_DECISIONS.md. That file is the source of truth for what's *built*.
This file records what we're *considering*, what we rejected, and the design rules that
decide it. Nothing here is locked until it moves into LOCKED_DECISIONS.md.

## Guiding spirit

- The game is a gift. Theme is **care and selection** — choosing, plating, warming.
- **Simplicity is the charm.** Every addition must earn its place; when in doubt, cut it.
  Prefer things with no new failure states.
- Tone lives in words. No emoji anywhere. (Carried from LOCKED_DECISIONS.md.)

## Design constraints (the "does it fit the void?" test)

1. **The void has one viewpoint: a gentle 3/4 tilt.** Plates and bowls are already angled
   3/4, not strict top-down. Anything placed in the void must share that tilt.
2. **Face-on / front-elevation art is allowed only in the toolbar** (freezer, microwave,
   chinaware icons). The toolbar is a separate "shelf" context, not the world. Do not drop
   face-on objects into the void.
3. **Float test.** A void prop must stand alone as an isolated object. Anything that implies
   enclosing architecture — a wall, floor, counter, sink, or **window** — breaks the void
   and would force a full room build-out.
4. **No third convention.** New art picks the void's 3/4 tilt (world objects) or toolbar
   face-on (shelf icons). Don't invent a new angle.
5. **Don't over-layer.** Multiple sweet ideas stacked on the same moment (e.g. notes +
   counters + hints on top of the cook reveal) read as "too much." Keep beats clean.
6. **Features must be standalone worlds, not addons.** The bar is the freezer/dishes/
   microwave system: a thing you interact with plus its own family of items, standing on
   its own legs. An idea that only decorates or piggybacks on the food loop (placemat,
   tray, candle, garnish) does *not* clear the bar — those are stickers, not features.
   A real feature owns its own interactions and its own objects.

## Decisions log

Three committed feature directions, each a standalone world (own interactions + own item
family): **cat**, **record/music player**, **drinks**. Detailed below.

| Idea | Status | Why |
|---|---|---|
| Cat (companion world) | Committed | A whole feature on its own — you interact with it and it has its own items (toys, tree, bowl). Clears the standalone-world bar. See below. |
| Record / music player | Committed | Owns a sense nothing else touches (sound as a handled object). Own items: player + a crate of records. Selection *is* the feature. See below. |
| Drinks (tea, liquor, pour) | Committed | Its own prep ritual and vessels. **Must ship a lean, curated list** — these interactions balloon fast. See below. |
| Plants to tend (indoor garden) | Candidate (alt) | Strong standalone world; pairs with the cat as living-care. Not chosen this round, kept as the leading alternative. |
| Wood stove / little hearth | Candidate (alt) | On-theme warmth as an interactive feature; the window's coziness done honestly. |
| Knickknack / fidget shelf | Parked | Loosest of the standalone ideas — a container for many tiny toys rather than one strong feature. |
| Table setting, serving tray, candle, cat food bowl | Out | Addons, not standalone features. Decorate the food loop; don't clear the standalone-world bar (constraint 6). |
| Special-occasion freezer stock | Out | Piggybacks on the food loop; not its own world. |
| "Pick for you" (random meal) | Out | Rides on the food loop; not a standalone feature. |
| Pairing hints / finishing-touch shelf | Out | Addons on the food loop; risk over-layering. |
| Window with time of day | Out | A window implies a wall/room; breaks the floating void. Would need a full room build-out — not worth it. |
| Hidden notes in meals | Out | Over-layers the cook reveal; too much on top of a simple beat. |
| Meal counter / tally | Out | Adds a "system" feel; cuts against the game's simplicity. |
| Fridge magnet / photo | Out | Nice, but not compelling enough to pursue. |

## Cat — interaction notes (not final)

Direction we like: **ambient-first, cursor-light, kept out of the meal loop.**

- Default is self-directed: wander, sit, loaf, groom, doze. That alone carries most of the charm.
- Cursor interaction is passive and occasional (eyes/head track when near, a slow blink on
  idle-hover). No chase-the-cursor toy — the cat must never *demand* attention.
- Toys: start with the lightest version (a 2D cat tree it climbs, a ball it bats on its own).
  A full drag-and-play toy chest is possible v2, only if it earns its place.
- One wordless tie to the theme: on a cook reveal, the cat may notice the steam and pad over
  to sit near the warm microwave. No copy (that's the "notes" trap).
- Hard rule: the cat never blocks or interferes with a drag. It sits near the void, not on a plate.

Open questions:
- Cursor interaction: none, or light? How light?
- Toys: none at launch, one or two, or a chest?
- Does the cat ever react to specific dishes, or stay meal-agnostic?

## Record / music player — notes (not final)

A tactile *sound* world. Turns the existing audio bed (currently just a background setting +
mute) into an object she actually handles.

- Own item family: the player itself and a small crate of records (or tapes) she flips through.
- Own interactions: pick a record, drop the needle, flip the side, swap it out.
- The selection *is* the feature — "what's the mood tonight." No transform/failure states needed;
  the payoff is the music playing and the record spinning.
- Fits the void: a player at the 3/4 tilt; no wall or shelf implied.

Open questions:
- How many records ship, and what moods/tracks? (Keep it curated, not a jukebox.)
- Does it replace the current mute/bed system or wrap around it?
- Where does it live — a void object she interacts with directly, or a toolbar station?

## Drinks — notes (not final)

Its own prep ritual and vessel family, separate from the food. Tea, liquor, a pour — warmth
and selection.

- **Hard scoping rule: ship a lean, curated select list.** These interactions balloon fast
  (every drink × every vessel × every garnish is a combinatorial trap). Pick a small, deliberate
  menu and stop there.
- Own item family: drink sources + their vessels (mug, glass), poured with the already-recorded
  (unwired) `pour.wav`.
- Own interactions: choose the drink, choose the vessel, the pour/prep gesture, a small reveal
  (steam for hot, settle/fizz for cold).
- Only counts as a feature if it has a real prep-and-reveal beat. A static "mug prop" is an addon
  and should be cut.

Open questions:
- What's the curated list? (e.g. one tea, one coffee/cocoa, one liquor — not a full bar.)
- Does it pair with a meal or stand fully on its own?
- Hot vs cold: one reveal style or two?
