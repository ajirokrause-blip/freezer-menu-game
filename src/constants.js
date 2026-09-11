// ─────────────────────────────────────────────────────────────
// THE FREEZER — tunable things
// Copy, sound, and the closing line live here on purpose.
// Tweak freely. You shouldn't need to open anything else.
// ─────────────────────────────────────────────────────────────

export const TILE = { w: 48, h: 36 };

// On-plate size. Two 48×36 tiles cannot sit inside the locked dinner-plate
// well with rim breathing room (well is ~93px wide at tile-corner height).
// 40×30 fits two side-by-side on dinner and one on the side plate.
export const PLATE_TILE = { w: 40, h: 30 };

// ── Sound mix ───────────────────────────────────────────────
// Foley clips in src/assets/sounds/ (see CREDITS.md there).
// Microwave hum/ding and reject (nope) stay synthesized — leave those at 1.
// Foley knobs sit under 1 on purpose (softer mix). Press M or the music icon to mute the bed (foley stays on).
// `music` is the looping bed (`beam.mp3`); on by default. `pour` is ready for the soup-fill pass (not wired yet).
// Mute/unmute ticks (`musicCut` / `musicPlay`) are synthesized and only fire from the music button / M — never on load.
// Submenu open/close and hover ticks (`panelOpen` / `panelClose` / `hover`) are also synthesized. Hover is the same tick on toolbar icons and submenu items.
// `microDoor` / `microSettle` / `steamPuff` are the cook-sequence cues (same clips as freezer door / tunk / poof, quieter).
// `smokePuff` is the burn-reveal belch (same poof, lower). `burn` is a quiet synthesized sizzle.
export const SOUND = {
  muted: false,
  master: 0.82,
  music: 0.065,
  hum: 1,
  ding: 1,
  clink: 0.72,
  door: 0.75,
  microDoor: 0.58,
  microSettle: 0.52,
  steamPuff: 0.34,
  smokePuff: 0.4,
  burn: 1,
  pickup: 0.7,
  drag: 0.2,
  tunk: 0.78,
  nope: 1,
  poof: 0.68,
  discard: 0.78,
  warm: 0.62,
  pour: 0.68,
  musicCut: 1,
  musicPlay: 1,
  panelOpen: 1,
  panelClose: 1,
  hover: 1,
};

// ── Microwave cook sequence ───────────────────────────────
// Eye knobs: `glow` (window light while humming) and `steamPuff`
// (reveal burst). Dial those after seeing it; timings are the feel.
export const COOK = {
  glow: 0.78,
  steamPuff: 1,

  w: 272,
  h: 184,
  door: { left: 8, top: 60, w: 176, h: 116 },
  inner: { w: 16, h: 116 },
  glass: { left: 24, top: 80, w: 136, h: 76 },
  cavity: { left: 8, top: 60, w: 176, h: 116 },
  floorPad: 10,

  receiveLeadMs: 90,
  doorMs: 380,
  handOffMs: 420,
  seatedMs: 340,
  closeMs: 360,
  humMs: 2050,
  dingHoldMs: 520,
  revealBeatMs: 720,
};

// ── Burnt gag (re-microwave) ────────────────────────────────
// Eye knobs: `lavaGlow` (0 = muted molten, 1 = hotter), `smoke` (vessel
// smoke amount), `smokePuff` (door-belch burst). `lavaMs` is the ooze cycle.
export const BURNT = {
  lavaGlow: 0.38,
  lavaMs: 9600,
  lavaFrames: 12,
  smoke: 1,
  smokePuff: 1.25,
};

export function cookFitScale(_def) {
  // Integer nearest-neighbor only. All four locked vessels fit at 1× in the
  // cavity (dinner is the tightest: 144×96 into 176×106). A fractional `fit`
  // (e.g. 0.9) blurs the in-well china vs the void china on high-DPI.
  return 1;
}

export function cookDishLayout(def) {
  const scale = cookFitScale(def);
  const { cavity, floorPad } = COOK;
  const w = def.w * scale;
  const h = def.h * scale;
  return {
    scale,
    left: Math.round(cavity.left + (cavity.w - w) / 2),
    top: Math.round(cavity.top + cavity.h - floorPad - h),
  };
}

// ── Closing moment ──────────────────────────────────────────
// Brief flourish after a ding — not a full-screen ending.
export const CLOSING_LINE = "enjoy";

// ── Copy ────────────────────────────────────────────────────
// Tone: affectionate teasing. Warm. A little flirty. Never scolding.
// Errors rotate so she doesn't see the same line twice in a row.

export const COPY = {
  voidHint: "grab a dish",

  freezerLocked: [
    "something to put it on, first",
    "plate first, then we raid it",
    "you'll want a dish before the goods",
    "chinaware first, then it's all yours",
  ],

  freezerOpen: [
    "help yourself",
    "take what you want",
    "the good stuff",
  ],

  freezerUnlocked: "the freezer's yours",

  nowhere: [
    "it has to land somewhere",
    "needs a plate first",
    "almost, drop it on a dish",
    "find it a home first",
  ],

  dinnerPlateVeg: [
    "grab a side plate",
    "greens get their own dish, house rule",
    "that one's a side, not a main event",
    "pretty, but it wants a smaller plate",
    "the greens have their own little throne",
  ],

  needsABowl: [
    "that one wants a bowl",
    "soups don't sit on a plate",
    "grab a bowl for the brothy ones",
    "a bowl, not a plate. house physics",
  ],

  needsABigBowl: [
    "that's a whole meal. big bowl.",
    "too much soup for a sidekick bowl",
    "dinner-sized. try the big one.",
    "the little bowl can't hold that",
  ],

  sidePlateMain: [
    "ambitious. that's not a side.",
    "that's a main event, not a side",
    "this little plate is for the sides",
    "save that one for a bigger dish",
  ],

  smallBowlMain: [
    "cute bowl, wrong dish",
    "that's a main. this is a sidekick bowl.",
    "sides and little soups only",
    "the big bowl won't mind. this one might.",
  ],

  dropItIn: "drop it in",
  lookInside: "have a look",
  putAway: "put away",

  cookEmpty: [
    "something on a dish, then we cook",
    "load it up, then we'll warm it",
    "an empty dish won't cook",
    "a little something on it first",
  ],

  microwaveLocked: [
    "load a dish first",
    "it wants something to warm",
    "food on a plate, then we cook",
    "nothing to heat yet",
  ],

  microwaveBusy: [
    "one dish at a time",
    "this one's still humming",
    "let this one ding first",
  ],

  alreadyCooked: [
    "already warm",
    "that one's done",
    "it's ready to eat",
  ],

  burntReveal: [
    "you microwaved it twice",
    "hope you like it crispy",
    "well, it's cooked... thoroughly",
  ],

  alreadyBurnt: [
    "it's already ruined",
    "there's no saving that one",
    "you've done enough",
  ],

  cookedNoAdd: [
    "that one's already served",
    "it's a finished plate",
    "leave that one as it is",
  ],

  // Bowl schema — drop rules are live. Cooked fill is the locked serving layer.
  bowlNotSoup: [
    "bowls are for the soupy stuff",
    "that one's not a soup",
    "save the bowl for something brothy",
  ],

  soupOnPlate: [
    "that one wants a bowl",
    "too soupy for a plate",
    "give it a bowl, it'll thank you",
  ],

  smallBowlNotLentil: [
    "the little bowl's just for the lentil soup",
    "that one needs the big bowl",
  ],

  bowlAlreadyFull: [
    "one soup's plenty",
    "this bowl's already full",
  ],

  dinnerPlateFull: [
    "two's plenty for a plate",
    "the plate's full",
    "no room left on that one",
  ],

  sidePlateFull: [
    "one veg to a side plate",
    "that little plate's taken",
  ],
};

export const MENU = [
  {
    id: "curry",
    name: "Japanese curry",
    category: "protein",
    role: "plate-main",
  },
  {
    id: "pho",
    name: "Pho",
    category: "protein",
    role: "soup-main",
  },
  {
    id: "gyudon",
    name: "Gyudon",
    category: "protein",
    role: "plate-main",
  },
  {
    id: "lentil",
    name: "Lentil soup",
    category: "protein",
    role: "side-soup",
  },
  {
    id: "beef",
    name: "Vietnamese seared beef",
    category: "protein",
    role: "plate-main",
  },
  {
    id: "mapo",
    name: "Mapo tofu",
    category: "protein",
    role: "plate-main",
  },
  {
    id: "ramen",
    name: "Tonkatsu ramen",
    category: "protein",
    role: "soup-main",
  },
  {
    id: "pasta",
    name: "Pasta",
    category: "protein",
    role: "plate-main",
  },
  {
    id: "jasmine",
    name: "Jasmine rice",
    category: "starch",
    role: "starch",
  },
  {
    id: "shortgrain",
    name: "Short grain rice",
    category: "starch",
    role: "starch",
  },
  {
    id: "polenta",
    name: "Polenta",
    category: "starch",
    role: "starch",
  },
  {
    id: "veggies",
    name: "Charred mixed veggies",
    category: "veg",
    role: "side",
  },
  {
    id: "peas",
    name: "Peas",
    category: "veg",
    role: "side",
  },
  {
    id: "sprouts",
    name: "Sesame-oil bean sprouts",
    category: "veg",
    role: "side",
  },
];

// How a dish is actually eaten — not its freezer shelf.
const SERVE = {
  "soup-main": ["bowl"],
  "plate-main": ["dinnerPlate"],
  "side-soup": ["bowl", "smallBowl"],
  starch: ["dinnerPlate"],
  side: ["sidePlate"],
};

export function vesselTakes(vesselId, item) {
  return SERVE[item.role].includes(vesselId);
}

export function nextOpenSlot(tiles, slots) {
  const used = new Set(tiles.map((t) => t.slot));
  for (let i = 0; i < slots.length; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

export function rejectKeyFor(vesselId, item, reason) {
  if (reason === "full") {
    if (vesselId === "dinnerPlate") return "dinnerPlateFull";
    if (vesselId === "sidePlate") return "sidePlateFull";
    return "bowlAlreadyFull";
  }
  if (item.role === "soup-main" || item.role === "side-soup") {
    if (vesselId === "smallBowl" && item.role === "soup-main") return "smallBowlNotLentil";
    if (vesselId === "dinnerPlate" || vesselId === "sidePlate") return "soupOnPlate";
  }
  if (vesselId === "bowl" || vesselId === "smallBowl") return "bowlNotSoup";
  if (vesselId === "dinnerPlate") return "dinnerPlateVeg";
  if (vesselId === "sidePlate") return "sidePlateMain";
  return "sidePlateMain";
}

// Native locked PNG sizes (vessel design E, already 3×).
// Slot {x,y} is the tile center on the vessel, in sprite pixels.
// Bowls: angled 3/4. One fill seat (not a plate slot grid) — frozen soup sits
// there until cook; then the locked fill layer paints the well.
export const VESSELS = {
  dinnerPlate: {
    id: "dinnerPlate",
    name: "dinner plate",
    file: "dinner",
    w: 144,
    h: 96,
    slots: [
      { x: 49, y: 49 },
      { x: 95, y: 49 },
    ],
  },
  sidePlate: {
    id: "sidePlate",
    name: "side plate",
    file: "side",
    w: 102,
    h: 72,
    slots: [{ x: 51, y: 37 }],
  },
  bowl: {
    id: "bowl",
    name: "bowl",
    file: "bowl",
    w: 114,
    h: 57,
    fill: true,
    slots: [{ x: 56, y: 19 }],
  },
  smallBowl: {
    id: "smallBowl",
    name: "small bowl",
    file: "small",
    w: 84,
    h: 48,
    fill: true,
    slots: [{ x: 42, y: 17 }],
  },
};

export const VESSEL_ORDER = ["dinnerPlate", "sidePlate", "bowl", "smallBowl"];
