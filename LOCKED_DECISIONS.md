# Locked decisions

Source of truth for art and interaction. Future passes follow this file. Do not reopen a locked item unless the art director unlocks it.

Letter codes were chosen during the art pass. Do not mix appliance letters with vessel or food letters. Canonical sprites live in `src/assets/locked/`.

---

## Overall style

Cozy-warm **flat 2D pixel art**. Higher pixel density / crisp (hi-res pass, ~2px texels). Not the over-chunky first sheet.

No isometric extrusion. No 3D top-face + side-walls on any object, including food.

## Palette

Hearth-kitchen register from gallery **B**:

- Creams: `#fff6e8` highlight, `#f0dcc0` body, `#faf6f0` void
- Warm browns: `#4a2e1c` outline, `#d4b48a` mid, `#b08964` shade, `#8b5e3c` handle
- Amber accent: `#e8b44a` LED

Food is the most saturated color on screen. Appliances and vessels stay quieter.

## Freezer — hearth kitchen B

Single-door commercial freezer, cream 3-tone body, brown outline, left highlight / right shade.

- **Closed:** door with window, handle, top vents, small amber badge. Layout language from the Santoniche fridge study, redrawn as one commercial door (not a two-door home fridge).
- **Open:** same cabinet, door swung, warm dark cavity, shelves of food tiles.

Display: the whole freezer sprite scales together (door and interior, same aspect). Size is just large enough that the three-column starch/veg row sits inside the well with a little breathing room and clears the swung door. Frozen tiles stay 48×36.

Implement from the **hi-res B** drawing, not the chunky first sheet.

## Microwave — hearth kitchen B

Faithful warm remap of Santoniche `Microondas.png` (34×28): window glare, keypad column, handle, amber/green LED. Cream body, brown window. Decorative keypad buttons are part of the art.

Implement from **hi-res B**.

The door is only the left glass-window slab (not the keypad, not the top cream band). Open is an **instant snap** (same as the freezer) plus the door sound — no squeeze, no tilt. The open door is the **inner face**: a cream vertical slab with a small vertical lock slot in the center. Interior (and the cooked vessel) exist only in that door rectangle. Canonical inner-face sprite: `src/assets/locked/microwave-door-inner.png`.

## Toolbar icons — hearth kitchen B

Same B palette, hi-res density:

- **Chinaware** — the locked dinner plate sprite, scaled down
- **Freezer** — 24×24 tall cabinet + door + handle
- **Microwave** — 24×24 wide box, dark window, keypad, LED

## Vessels — design E

Outline-less cream china, plus a **soft tan outer rim** (`#d2ba96` / `(210,186,150)`) inset on the existing silhouette — same value as the plate rim already in the locked sprites. No black ink. No change to vessel size, slots, or fill-masks. Use this design for all four, sized consistently:

| Vessel | Role |
|---|---|
| Dinner plate | 2 slots; mains + starches. Veg rejected. |
| Side plate | 1 slot; veg only. |
| Bowl | 1 soup (fill render, not a slot grid). Pho, ramen, or lentil. |
| Small bowl | 1 soup (fill render); lentil only. |

Canonical sprites: `src/assets/locked/vessels/`

- `dinner.png` + `dinner-edge.png`
- `side.png` + `side-edge.png`
- `bowl.png` + `bowl-mask.png` + `bowl-edge.png`
- `small.png` + `small-mask.png` + `small-edge.png`

The `*-edge.png` overlays are the same size as the china sprites. They paint a 3px inset tan outline on already-opaque pixels so plate rims close at the top/bottom/left/right and bowls pick up the same outer silhouette. Locked china, fill-masks, slots, and footprints stay as they are.

Bowls are **angled 3/4** so the well is visible (Large A / Small A). Same Design E language: inner rim around the mouth, one darker well color, widest at the mouth with no waist. Fill-mask black is the exact well soup paints into. Frozen soup sits in the fill seat; after microwave, the locked fill layer paints the well. The tan outer edge is cosmetic only — it does not move the inner rim or the fill well.

**Small bowl mouth (Small A):** independently taller/rounder than Large A — not a scale of the large sprite. Native recipe `rx=12.2`, `ry_k=0.46`, `wall=3`, outer mouth `n=2.0` (true ellipse), then 3× nearest-neighbor, pinned to **84×48** with well centroid **(42, 17)**. The lentil cooked fill (`lentil-small.png`) and `small-edge.png` are rebuilt from that same well. Do not edit the mask without rebuilding the cooked fill in the same pass.

## UI philosophy

No action buttons anywhere.

The three toolbar stations (chinaware, freezer, microwave) are **fixed anchors**. Hover panels, the freezer door, and a vessel entering the microwave must not move a station or its neighbors.

The toolbar sits on one warm, translucent chrome strip (palette tan at low opacity — not gray, not frosted). Icons rest on that surface with no drop-shadow, so they read as controls, not as floating content. All station submenus open at the **same shared vertical center** (the toolbar’s midline), immediately to the right of the strip, regardless of which icon was hovered.

A **discard** drop-target sits below the toolbar in the void — not on the chrome strip. Drag a vessel onto it to put it away. The vessel shrinks while held over it. World-layer pixel art, but **smaller and quieter than the toolbar** — a minimal outline can, not a third station. Canonical sprite: `src/assets/locked/discard.png`. Not a click button.

Submenu contents (chinaware, freezer, microwave) sit flat — **no drop-shadow**. Chinaware gains a shadow the moment it is picked up (same opacity as a placed vessel). Placed vessels on the void keep theirs.

Interactions are hover-reveals-text on objects. Example: hover the microwave → “click to prepare” → click the microwave itself.

**Pixel art is the game world. Smooth/flat warm is the system layer.** Mute and notification cards sit *over* the scene, not in it. They share one system style: clean vector shapes, soft rounded corners, slightly translucent cream/warm fill, Nunito (no Silkscreen), quiet and unobtrusive. Notice cards are talk bubbles with a smooth tail off the bottom-right. The discard can lives in the scene (world pixel art), not on the system layer. In-world hover labels on food and stations stay pixel. Do not restyle world objects to match system chrome.

Decorative buttons drawn as part of the microwave sprite are fine.

Food tiles and stations are unlabeled until hover.

No emoji anywhere in the app — copy, hover text, closing line, notifications. Tone lives in the words.

## Food — locked crops

Flat **2D top-down rectangular tiles**. Uniform footprint **48×36 texels** (integer nearest-neighbor only — some sources crop smaller and scale 3× / 6×). Same size for every dish so they grid cleanly.

- No bowl / plate / dishware under the food
- No category colors, borders, or tints on the tiles
- No 3D, no isometric, no invented side faces
- Hover reveals the dish name in small pixel text
- Global style: **low-detail** (texture and color, not ingredient-readable)

Canonical sprites: `src/assets/locked/food/` (`{id}.png`, 48×36).

| Dish | Pick | Source (native crop) | Scale |
|---|---|---|---|
| Japanese curry | Low-detail A | `curry-field-low-a.png` (0,0,16,12) — gravy + orange carrot + potato, no rice | 16×12 ×3 |
| Pho | Amber | `pho-broth-amber.png` (0,0,16,12) — solid `#c99252` | 16×12 ×3 |
| Gyudon | Low-detail B | `g-rice-fried.png` (12,11,8,6) | 8×6 ×6 |
| Lentil soup | Low-detail B | `g-gruel.png` (13,11,8,6) | 8×6 ×6 |
| Vietnamese seared beef | Low-detail B | `g-braised.png` (13,12,8,6) | 8×6 ×6 |
| Mapo tofu | Low-detail A | `mapo-field-low-a.png` (0,0,16,12) — chili-oil + tofu cubes | 16×12 ×3 |
| Tonkatsu ramen | Low-detail B | `fp-ramen.png` (102,122,16,12) | 16×12 ×3 |
| Pasta | Low-detail B | `fp-spaghetti.png` (108,115,16,12) | 16×12 ×3 |
| Jasmine rice | same as short-grain Low-detail A | `g-rice-bowl.png` (10,8,8,6) | 8×6 ×6 |
| Short grain rice | Low-detail A | `g-rice-bowl.png` (10,8,8,6) | 8×6 ×6 |
| Polenta | Low-detail A | `fp-mac.png` (127,128,16,12) | 16×12 ×3 |
| Charred mixed veggies | Low-detail B | `fp-salad.png` (80,55,16,12) | 16×12 ×3 |
| Peas | Low-detail A | `g-spinach.png` (13,12,8,6) | 8×6 ×6 |
| Sesame-oil bean sprouts | Low-detail A | `g-slaw.png` (12,5,8,6) | 8×6 ×6 |

Curry and mapo are composed interiors (sourced bowls could not crop rice-free kare or cube tofu in chili oil). Pho is a flat broth field — no noodles, no specks.

Vietnamese seared beef is thinly sliced stir-fry (velveted, fish sauce / soy / garlic / onion / chili, hard cast-iron sear). Not a steak. The locked crop is still a low-detail brown-red interior.

### Menu

**Mains / proteins:** Japanese curry · Pho · Gyudon · Lentil soup · Vietnamese seared beef · Mapo tofu · Tonkatsu ramen · Pasta

**Starches:** Jasmine rice · Short grain rice · Polenta

**Vegetables / sides:** Charred mixed veggies · Peas · Sesame-oil bean sprouts

## Cooked servings

Cooked food is a **plated serving**, not a tinted cube. Same dish as its frozen tile: same ingredients, same texture density, same palette — derived from that tile’s own cells, reshaped to fill the slot.

- Irregular scatter across the **whole serving**. No tiled/repeating swatch, no visible seams, no solid field with two garnish specks.
- Same pixel grid as the frozen blocks. Nearest-neighbor, whole-number scaling only. No non-integer scale, no resampling that slices pixels.
- Cooked reads from **shape** (the spread filling the slot) and vessel steam, not from a tint.
- **Dinner plate:** equal left and right halves, split at the well center (`x=73` on the locked dinner sprite). Left serving is `x < 73`. Right serving is the horizontal mirror, then the empty seam column is closed and the right half nibbles 1px onto `x=72` on alternating 3px bands (native grid) so two servings touch — no plate gap, no hard cut. One item on a dinner plate stays a half-portion — it does not flood the empty half. Left-slot PNGs are unchanged.
- **Side plate:** one serving fills the well.
- **Bowls:** soup paints into the locked fill-mask well. Pho stays a flat broth field (that is the locked tile). Lentil may use the small bowl.

Canonical serving layers: `src/assets/locked/cooked/` — transparent food-only PNGs, same size as the vessel sprite, composited over empty china.

| Layer | Dishes |
|---|---|
| `{id}-dinner-left.png` / `{id}-dinner-right.png` | plate-mains + starches |
| `{id}-side.png` | veg sides |
| `{id}-bowl.png` | pho, ramen, lentil |
| `lentil-small.png` | lentil in the small bowl |

App: a loaded vessel comes back from the microwave as **COOKED**. Frozen 40×30 blocks are replaced by these serving layers (slot 0 = left dinner half, slot 1 = right). Bowls paint the fill-mask well. No color tint.

## Steam

Vessel-scoped **pixel-art steam**, not snakes, pillars, or vector ribbons. Vertical wisps in the cream grid (`#f0dcc0` body, `#fff6e8` highlight), nearest-neighbor sprite strips. One effect per cooked vessel, over the food, sized per vessel type. Persists while the cooked vessel sits on the void, and while it sits in the open microwave after the reveal. The denser haze / heat flash is a **one-shot at the reveal** (door opens on cooked food) — not when she later picks up or moves the vessel. A separate **steam puff** (same locked puff strips, one-shot billow) escapes as the door opens on the reveal; it comes **off the vessel in the well**, not the top of the microwave. Same for the burn-reveal smoke. Amount is `COOK.steamPuff` / `BURNT.smokePuff` in `src/constants.js`.

- Emit from **many scattered points** across the food — not a single floor-line. On plates, origins sit across the serving (back of the well to the front) and ease slowly so they don’t keep rising from one hole.
- Wisps are **ephemeral** and **taller than wide**: they form, rise gently, thin out, and fade. Not pancakes, not a stable line from plate to tip.
- **Slow rise:** denser near the food, then taller, softer, and hazier up top — steam, not sparks.

Dinner carries the most wisps; side plate and bowls fewer. Two servings on a dinner plate still share one steam. Canonical puffs: `src/assets/locked/steam/`. Lightweight CSS — the same four puff strips are reused so several cooked vessels can steam at once.

## Core loop

Vessel first (free placement, multiple vessels). Freezer stays locked until a vessel is staged; stock is infinite. Microwave stays locked until a vessel with food is on the void. Drag food onto a legal vessel — it snaps into the next open slot (plates) or the fill seat (bowls). No free positioning, no overlap checks. Wrong category or a full vessel bounces with rotating affectionate teasing copy. Drag a loaded vessel into the microwave → cook sequence (below) → brief `enjoy` flourish. Drag a **cooked** vessel in again → it burns (char / lava + smoke). Burnt is terminal. No hard ending. Microwave holds one vessel at a time. Cooked and burnt vessels accumulate on the void. The void persists.

**Slots**

- Dinner plate: 2, side by side inside the well. Frozen: 40×30 tiles. Cooked: equal half-servings, split at `x=73`, with a 1px overlap/feather on the right half at that join. One item stays a half-portion.
- Side plate: 1, centered in the well. Frozen: 40×30 tile. Cooked: serving fills the well.
- Bowls: not a slot grid. One soup. Frozen: tile in the fill seat. Cooked: locked fill layer in the fill-mask well.
- On-plate tiles are **40×30** (freezer tiles stay 48×36). Two 48×36 tiles cannot fit inside the locked dinner-plate well with rim breathing room.

## Microwave cook sequence

Receive → cook → reveal. The dish does not vanish and pop back cooked; the microwave takes it.

1. **Hand-off.** She drops a loaded vessel on the microwave. It leaves her hand and the sequence takes over. The vessel **snaps to a centered seat inside** (not wherever she released). Door snaps open to receive, the dish settles on that seat, door snaps shut. Instant — the door clip plays on the snap. The cook sequence fires this; it is not a click like the freezer.
2. **Cooking.** Door stays closed. Existing pulse on the appliance. Warm amber **glow** builds behind the opaque glass, brightening with the pulse. Glass stays opaque — no see-through to the food. Glow intensity is `COOK.glow` in `src/constants.js`.
3. **Reveal.** Ding, then the door opens. Frozen → **COOKED** steaming food, steam puff, `enjoy`. Re-microwave of a cooked vessel → **BURNT**, black smoke belch, teasing line (`burntReveal`). Same beat, different payoff.
4. **Holding.** Microwave stays **open** with the vessel sitting inside. The microwave submenu stays open. No auto-close, no auto-eject.
5. **Take-out.** She drags the vessel out onto the void (shadow + steam or smoke). **Then** the door closes and the submenu can return to normal.

One vessel at a time.

## Cooked-state rules

Tracked per vessel (`cooked`, `burnt`). Frozen → cooked → burnt. Burnt is terminal.

- **Re-microwave cooks, then burns.** A frozen loaded vessel cooks as before. A **cooked** vessel can go back in — that is the gag. It comes out **BURNT** (charred plate / lava bowl + black smoke). No more “already warm” bounce.
- **Burnt rejects.** Microwaving a burnt vessel again does not change it. Gentle rotating tease (`alreadyBurnt` in `src/constants.js`).
- **No editing.** Cooked and burnt servings are locked. She cannot add frozen blocks, and cannot drag cooked/burnt servings between vessels. Dropping a frozen block onto one → `cookedNoAdd`.
- **Discard.** Drag the whole vessel onto the discard icon below the toolbar (same put-away as dropping back on the chinaware icon). Trash can plays the whoosh (`poof.wav`, lower); chinaware put-away stays the soft ceramic. Works for frozen, cooked, and burnt. Drop target only, not a click button.

## Burnt assets

Generic ruined look — **not per-dish**. Canonical layers: `src/assets/locked/burnt/`.

- **Plates:** one charred serving (`dinner-left.png`), mirrored + seam-feathered for the right half, plus a side-plate well fill (`side.png`). Slot for slot: two dinner servings → both halves char; one serving → only that half. Side plate chars the whole well.
- **Bowls:** molten lava fills (`lava-bowl.png`, `lava-small.png`) — 12-frame strips, slow ooze. Own footprints via the locked fill-masks. Gentle emissive warmth: `BURNT.lavaGlow` / `BURNT.lavaMs` in `src/constants.js`.
- **Smoke:** vessel-scoped, same system as steam (rise, dissipate, one per vessel). Grey/black, heavier. Replaces steam on burnt plates **and** lava bowls. The denser haze / flash is a **one-shot at the reveal** — not when she later picks up or moves the vessel. Door-open reveal belches smoke instead of steam (`BURNT.smokePuff`). Strips: `src/assets/locked/smoke/`. Amount: `BURNT.smoke`.

## Sound

Recorded CC0 foley in `src/assets/sounds/`, played from `src/sounds.js`. Mix knobs in `src/constants.js` (`SOUND`). Looping bed is `beam.mp3` (on by default) — **one** `Audio` element, `loop` on that element, never stacked. Smooth vector music notes, bottom-right; slash overlaid when the bed is off. Press **M** or the music icon to mute **only the bed** (remembered). Mute plays a tiny synthesized cut; unmute plays a tiny start chirp. Neither plays when the bed starts on its own. Foley, hum, ding, and reject stay on. Drag uses one looping mid-scrape voice (`drag-scrape.wav`) started from `beginDrag` and faded out from `clearDrag` — no per-frame / move-loop audio. Pickup stays the lift one-shot. Place clinks are unchanged. Submenu open/close get their own quiet ticks. Hovering toolbar icons and submenu items (chinaware, freezer tiles, microwave) shares one even quieter tick — not on the hover that opens a menu, so open and hover do not stack.

Microwave **hum + ding** stay synthesized (unchanged). Reject / wrong-drop (`nope`) stays the soft two-note blip. Burn reveal adds a quiet synthesized sizzle + descending sigh (`SOUND.burn`) and a lower poof (`SOUND.smokePuff`). Everything else is a **real recording**, kept tactile but **warm and soft** — rounded attack, treble rolled off, sitting quietly in the mix. Not sharp, clacky, or piercing. Freezer open and close stay two different clips. Microwave cook-sequence doors reuse those clips at a quieter, slightly higher pitch (`SOUND.microDoor`), distinct from the freezer. Vessel settle inside is a soft tunk (`SOUND.microSettle`). Reveal steam puff is a quiet poof (`SOUND.steamPuff`). Soup pour sample is ready; still not wired (bowl fill is visual on cook, not a pour gesture).

## Still unlocked

Soup pour sound.
