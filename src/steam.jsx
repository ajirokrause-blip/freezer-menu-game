import { useMemo, useRef } from "react";
import { BURNT, VESSELS } from "./constants";
import puff0 from "./assets/locked/steam/puff-0.png";
import puff1 from "./assets/locked/steam/puff-1.png";
import puff2 from "./assets/locked/steam/puff-2.png";
import puff3 from "./assets/locked/steam/puff-3.png";
import smoke0 from "./assets/locked/smoke/puff-0.png";
import smoke1 from "./assets/locked/smoke/puff-1.png";
import smoke2 from "./assets/locked/smoke/puff-2.png";
import smoke3 from "./assets/locked/smoke/puff-3.png";

const KIND = {
  dinnerPlate: "dinner",
  sidePlate: "side",
  bowl: "bowl",
  smallBowl: "small",
};

const PUFFS = [puff0, puff1, puff2, puff3];
const SMOKE_PUFFS = [smoke0, smoke1, smoke2, smoke3];

// Vertical wisps across the food. Origins ease slowly so they don't
// keep rising from one hole. Long lives — steam, not sparks.
// x, hop1, hop2, drift, rise, life, delay, hop, sprite, haze
// [, from, lift1, lift2] — plates scatter off the food surface; bowls omit.
const WISPS = {
  dinner: [
    [18, 6, -4, 4, 48, 5.8, 0.0, 23.0, 0, 0, 18, 8, -6],
    [34, -5, 7, -3, 54, 7.2, 0.8, 28.0, 1, 0, -6, -8, 10],
    [50, 5, -6, 5, 44, 6.3, 1.8, 25.0, 2, 0, 12, 6, -10],
    [66, -7, 4, -2, 58, 7.8, 0.35, 31.0, 3, 0, 4, -5, 8],
    [82, 5, 8, 3, 46, 5.5, 2.5, 22.0, 0, 0, -10, 10, -4],
    [98, -4, -8, -4, 52, 7.0, 1.2, 28.0, 1, 0, 16, -6, 7],
    [114, 4, 6, 3, 42, 6.5, 3.6, 26.0, 2, 0, 2, 8, -8],
    [26, 8, -3, 5, 50, 7.4, 4.3, 29.0, 3, 0, -4, -7, 5],
    [58, -4, 5, -3, 56, 6.0, 5.0, 24.0, 0, 0, 22, 4, -9],
    [90, 6, -5, 3, 48, 7.6, 2.0, 30.0, 1, 0, 8, -10, 6],
    [42, -6, 3, -4, 40, 6.7, 5.6, 27.0, 2, 0, -8, 9, -3],
    [74, 4, -7, 4, 60, 5.8, 3.2, 23.0, 3, 0, 14, -4, 8],
    [126, -4, 4, -2, 44, 6.3, 4.0, 25.0, 0, 0, 6, 5, -7],
    [22, 4, 5, 2, 64, 10.0, 0.5, 40.0, 1, 1, 20, 3, -5],
    [70, -4, 4, -2, 68, 11.0, 2.2, 44.0, 2, 1, 10, -6, 4],
    [108, 3, -4, 3, 62, 9.6, 4.5, 38.0, 3, 1, 24, 5, -8],
  ],
  side: [
    [18, 5, -4, 3, 38, 5.8, 0.0, 23.0, 0, 0, 14, 6, -5],
    [34, -5, 5, -3, 44, 7.0, 1.0, 28.0, 1, 0, -4, -6, 8],
    [50, 4, -5, 4, 36, 6.0, 2.0, 24.0, 2, 0, 10, 5, -8],
    [66, -4, 4, -3, 48, 7.4, 0.45, 30.0, 3, 0, 2, -4, 6],
    [82, 5, 6, 3, 40, 5.5, 3.0, 22.0, 0, 0, -8, 8, -3],
    [26, -4, 5, 3, 42, 6.5, 3.9, 26.0, 1, 0, 16, -5, 7],
    [58, 4, -4, -2, 46, 7.2, 4.8, 24.0, 2, 0, 6, 4, -6],
    [74, -5, 3, 3, 34, 6.2, 1.6, 28.0, 3, 0, -6, 7, -4],
    [40, 4, -3, -2, 54, 9.6, 0.7, 38.0, 0, 1, 18, 3, -5],
    [70, -4, 4, 2, 50, 10.6, 3.2, 42.0, 1, 1, 8, -4, 5],
  ],
  bowl: [
    [20, 5, -4, 3, 40, 6.0, 0.0, 24.0, 0, 0],
    [36, -5, 5, -3, 46, 7.2, 0.9, 29.0, 1, 0],
    [52, 4, -6, 4, 38, 5.8, 1.9, 23.0, 2, 0],
    [68, -4, 4, -3, 50, 7.6, 0.45, 30.0, 3, 0],
    [84, 5, 5, 3, 42, 5.5, 2.8, 22.0, 0, 0],
    [28, -4, 6, 3, 44, 6.7, 3.8, 27.0, 1, 0],
    [60, 4, -4, -3, 48, 6.2, 4.8, 25.0, 2, 0],
    [76, -5, 3, 3, 36, 7.0, 1.6, 28.0, 3, 0],
    [44, 4, -4, -2, 52, 9.8, 0.6, 39.0, 0, 1],
    [72, -4, 4, 2, 56, 10.8, 3.1, 43.0, 1, 1],
    [96, 3, -4, -3, 44, 6.5, 4.4, 26.0, 2, 0],
  ],
  small: [
    [16, 4, -3, 3, 32, 5.5, 0.0, 22.0, 0, 0],
    [30, -4, 4, -3, 38, 6.7, 0.9, 27.0, 1, 0],
    [42, 4, -4, 3, 30, 5.8, 2.0, 23.0, 2, 0],
    [54, -4, 5, -2, 40, 7.2, 0.45, 29.0, 3, 0],
    [66, 5, 4, 3, 34, 5.3, 3.0, 21.0, 0, 0],
    [24, -4, 5, 3, 36, 6.2, 3.9, 25.0, 1, 0],
    [48, 4, -4, -2, 42, 6.5, 1.5, 28.0, 2, 0],
    [36, 3, -3, -2, 46, 9.2, 0.7, 37.0, 3, 1],
    [58, -3, 4, 2, 44, 10.1, 3.2, 40.0, 0, 1],
  ],
};

// Burnt food / lava opaque x (from locked art), inset so hop stays on the well.
const SMOKE_FOOD_X = {
  dinnerPlate: { min: 26, max: 118, halves: { 0: [26, 70], 1: [74, 118] } },
  sidePlate: { min: 24, max: 80 },
  bowl: { min: 18, max: 94 },
  smallBowl: { min: 18, max: 66 },
};

function smokeSpans(type, slots) {
  const spec = SMOKE_FOOD_X[type];
  if (!spec) {
    const w = VESSELS[type]?.w ?? 128;
    return [[12, Math.max(24, w - 12)]];
  }
  if (spec.halves && slots?.length) {
    const spans = [...new Set(slots)]
      .map((slot) => spec.halves[slot])
      .filter(Boolean);
    if (spans.length) return spans;
  }
  return [[spec.min, spec.max]];
}

function spanForX(x, spans) {
  for (const span of spans) {
    if (x >= span[0] && x <= span[1]) return span;
  }
  let best = spans[0];
  let dist = Infinity;
  for (const span of spans) {
    const t = x < span[0] ? span[0] : span[1];
    const d = Math.abs(x - t);
    if (d < dist) {
      dist = d;
      best = span;
    }
  }
  return best;
}

function clamp(n, lo, hi) {
  if (lo > hi) return Math.round((lo + hi) / 2);
  return Math.min(hi, Math.max(lo, n));
}

function wrapIn(n, lo, hi) {
  const w = hi - lo;
  if (w <= 0) return lo;
  return lo + ((((n - lo) % w) + w) % w);
}

function hopPad(row) {
  return Math.max(6, Math.abs(row[1] || 0), Math.abs(row[2] || 0));
}

function pinSmokeX(x, row, spans) {
  const [a, b] = spanForX(x, spans);
  const pad = hopPad(row);
  return clamp(x, a + pad, b - pad);
}

function burstWisps(amount, spans) {
  const n = Math.max(1, Math.round(12 * amount));
  const haze = Math.max(0, Math.round(4 * amount));
  const [lo, hi] = spans[0];
  const span = Math.max(8, hi - lo);
  const list = [];
  for (let i = 0; i < n; i += 1) {
    const x = pinSmokeX(lo + ((i * 19) % span), [0, 0, 0], spans);
    list.push({
      x,
      drift: (i % 2 ? 1 : -1) * (10 + (i % 5) * 4),
      rise: -(46 + (i % 4) * 14),
      delay: (i % 6) * 0.045,
      life: 0.92 + (i % 3) * 0.16,
      sprite: i % 4,
      haze: false,
      from: (i % 5) * 3,
    });
  }
  for (let i = 0; i < haze; i += 1) {
    const x = pinSmokeX(lo + ((i * 31) % span), [0, 0, 0], spans);
    list.push({
      x,
      drift: i % 2 ? 10 : -14,
      rise: -(30 + i * 8),
      delay: 0.02 + i * 0.04,
      life: 1.12,
      sprite: i % 4,
      haze: true,
      from: (i % 4) * 4,
    });
  }
  return list;
}

function smokeWisps(type, amount, slots) {
  const kind = KIND[type];
  const list = WISPS[kind];
  if (!list) return [];
  const spans = smokeSpans(type, slots);
  const onFood = list.filter((row) => {
    const [a, b] = spanForX(row[0], spans);
    return row[0] >= a - 8 && row[0] <= b + 8;
  });
  const source = onFood.length ? onFood : list;
  const base = source.map((row) => {
    const next = [...row];
    next[0] = pinSmokeX(row[0], row, spans);
    return next;
  });
  const extraN = Math.round(list.length * 0.45 * amount);
  const extra = base.slice(0, extraN).map((row, i) => {
    const next = [...row];
    const [a, b] = spanForX(row[0], spans);
    const pad = hopPad(row);
    next[0] = wrapIn(row[0] + 8 + (i % 5) * 4, a + pad, b - pad);
    next[4] = row[4] + 12;
    next[6] = row[6] * 0.45;
    next[9] = 0;
    return next;
  });
  return [...base, ...extra];
}

export function SteamBurst({ type, amount = 1, tone = "steam", slots }) {
  const kind = KIND[type] || "dinner";
  const width = VESSELS[type]?.w ?? 144;
  const slotKey = Array.isArray(slots) ? slots.join(",") : "";
  const spans = useMemo(() => {
    const parsed = slotKey === "" ? undefined : slotKey.split(",").map(Number);
    return tone === "smoke" ? smokeSpans(type, parsed) : [[10, Math.max(26, width - 10)]];
  }, [tone, type, width, slotKey]);
  const list = useMemo(() => burstWisps(amount, spans), [amount, spans]);
  const strips = tone === "smoke" ? SMOKE_PUFFS : PUFFS;
  return (
    <div
      className={`steam steam-burst steam-${kind}${tone === "smoke" ? " is-smoke" : ""}`}
      style={{ "--burst": amount }}
      aria-hidden="true"
    >
      {list.map((wisp, i) => (
        <span
          key={i}
          className={`wisp${wisp.haze ? " is-haze" : ""}`}
          style={{
            left: wisp.x,
            "--from": `${wisp.from}px`,
            animationDuration: `${wisp.life * 2.2}s`,
            animationDelay: `${wisp.delay}s`,
            animationIterationCount: 1,
          }}
        >
          <i
            className="puff"
            style={{
              backgroundImage: `url(${strips[wisp.sprite]})`,
              "--drift": `${wisp.drift * (0.7 + 0.3 * amount)}px`,
              "--rise": `${wisp.rise * (0.75 + 0.25 * amount)}px`,
              animationDuration: `${wisp.life}s, ${wisp.life}s`,
              animationDelay: `${wisp.delay}s, ${wisp.delay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

export function Steam({ type, fresh = false, tone = "steam", slots }) {
  // Capture on mount so later justCooked flips don't restart CSS delays.
  const burst = useRef(fresh).current;
  const kind = KIND[type];
  const slotKey = Array.isArray(slots) ? slots.join(",") : "";
  const list = useMemo(() => {
    if (tone !== "smoke") return WISPS[kind];
    const parsed = slotKey === "" ? undefined : slotKey.split(",").map(Number);
    return smokeWisps(type, BURNT.smoke, parsed);
  }, [tone, type, kind, slotKey]);
  const strips = tone === "smoke" ? SMOKE_PUFFS : PUFFS;
  if (!list) return null;
  return (
    <div className={`steam steam-${kind}${tone === "smoke" ? " is-smoke" : ""}`} aria-hidden="true">
      {list.map(([x, hop1, hop2, drift, rise, life, delay, _hop, sprite, haze, from = 0, lift1 = 0, lift2 = 0], i) => {
        if (haze && !burst) return null;
        const start = burst ? delay : -((i * 1.37 + delay) % life);
        return (
          <span
            key={i}
            className={`wisp${haze ? " is-haze" : ""}`}
            style={{
              left: x,
              "--from": `${from}px`,
              "--hop1": `${hop1}px`,
              "--hop2": `${hop2}px`,
              "--lift1": `${lift1}px`,
              "--lift2": `${lift2}px`,
              animationDuration: `${life * 4}s`,
              animationDelay: `${start}s`,
            }}
          >
            <i
              className="puff"
              style={{
                backgroundImage: `url(${strips[sprite]})`,
                "--drift": `${drift}px`,
                "--rise": `-${rise}px`,
                animationDuration: `${life}s, ${life}s`,
                animationDelay: `${start}s, ${start}s`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
