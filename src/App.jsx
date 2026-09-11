import { useEffect, useRef, useState } from "react";
import {
  CLOSING_LINE,
  COOK,
  COPY,
  MENU,
  PLATE_TILE,
  TILE,
  cookDishLayout,
  nextOpenSlot,
  rejectKeyFor,
  VESSEL_ORDER,
  VESSELS,
  vesselTakes,
} from "./constants";
import {
  FoodTile,
  FreezerArt,
  FREEZER_SIZE,
  IconChinaware,
  IconFreezer,
  IconDiscard,
  IconMicrowave,
  MicrowaveArt,
  VesselArt,
  VesselStack,
} from "./illustrations";
import {
  isMuted,
  playClink,
  playDing,
  playDoor,
  playHum,
  playMicroDoor,
  playMicroSettle,
  playNope,
  playPickup,
  startDragSound,
  stopDragSound,
  playPoof,
  playDiscard,
  playSteamPuff,
  playBurn,
  playBurnPuff,
  playTunk,
  playWarm,
  playHover,
  playPanelOpen,
  playPanelClose,
  startBed,
  toggleMute,
  unlockSound,
} from "./sounds";

const uid = () => Math.random().toString(36).slice(2, 9);
const RAIL_MIN_X = 98;

// Primary input is touch (phones/tablets). Desktop keeps hover-to-open untouched.
const IS_TOUCH =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function useRotatingLine() {
  const index = useRef({});
  return (key) => {
    const lines = COPY[key];
    if (!lines) return "";
    if (typeof lines === "string") return lines;
    const i = index.current[key] ?? 0;
    index.current[key] = (i + 1) % lines.length;
    return lines[i];
  };
}

function pointInRect(r, x, y) {
  return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function hitVesselFromRects(x, y, vessels, rects) {
  let best = null;
  let bestDist = Infinity;
  for (const vessel of vessels) {
    const r = rects.get(vessel.id);
    if (!r || !pointInRect(r, x, y)) continue;
    const d = (x - r.cx) ** 2 + (y - r.cy) ** 2;
    if (d < bestDist) {
      best = vessel;
      bestDist = d;
    }
  }
  return best;
}

function hitVessel(x, y, vessels, pad = 6) {
  const rects = new Map();
  for (const vessel of vessels) {
    const el = document.querySelector(`[data-vessel="${vessel.id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    rects.set(vessel.id, {
      left: r.left - pad,
      right: r.right + pad,
      top: r.top - pad,
      bottom: r.bottom + pad,
      cx: (r.left + r.right) / 2,
      cy: (r.top + r.bottom) / 2,
    });
  }
  return hitVesselFromRects(x, y, vessels, rects);
}

function hitDrop(x, y, name) {
  return document
    .elementsFromPoint(x, y)
    .some((el) => el.closest(`[data-drop="${name}"]`));
}

function overStation(x, y, id) {
  return document
    .elementsFromPoint(x, y)
    .some((el) => el.closest(`[data-station="${id}"]`));
}

function overIconColumn(x, y) {
  return document.elementsFromPoint(x, y).some((el) => el.closest(".rail-icon"));
}

function canLand(vessel, item, drag) {
  if (vessel.cooked) return false;
  if (!vesselTakes(vessel.type, item)) return false;
  if (drag?.kind === "tile-move" && drag.vesselId === vessel.id) return true;
  return nextOpenSlot(vessel.tiles, vessel.def.slots) >= 0;
}

function clampVessel(x, y, def) {
  const pad = 8;
  const minX = RAIL_MIN_X;
  const maxX = window.innerWidth - def.w - pad;
  const minY = pad;
  const maxY = window.innerHeight - def.h - pad;
  return {
    x: minX <= maxX ? Math.min(maxX, Math.max(minX, x)) : Math.max(pad, maxX),
    y: minY <= maxY ? Math.min(maxY, Math.max(minY, y)) : Math.max(0, maxY),
  };
}

function vesselDropOrigin(x, y, def, offsetX, offsetY) {
  return clampVessel(x - offsetX, y - offsetY, def);
}

export default function App() {
  const [vessels, setVessels] = useState([]);
  const [freezerOpen, setFreezerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [holdPanel, setHoldPanel] = useState(false);
  const [drag, setDrag] = useState(null);
  const [hotId, setHotId] = useState(null);
  const [hotMicro, setHotMicro] = useState(false);
  const [hotDiscard, setHotDiscard] = useState(false);
  const [shakeId, setShakeId] = useState(null);
  const [cook, setCook] = useState("idle");
  const [cookMode, setCookMode] = useState("cook");
  const [cookingId, setCookingId] = useState(null);
  const [puffKey, setPuffKey] = useState(0);
  const [notice, setNotice] = useState(null);
  const [muted, setMuted] = useState(isMuted);
  const [hintLeaving, setHintLeaving] = useState(false);
  const [hintGone, setHintGone] = useState(false);

  const line = useRotatingLine();
  const dragRef = useRef(null);
  const vesselsRef = useRef(vessels);
  const cookingIdRef = useRef(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, scale: 1, scaleTarget: 1 });
  const ghostRef = useRef(null);
  const stageRef = useRef(null);
  const scaleRafRef = useRef(0);
  const motionRafRef = useRef(0);
  const dragGenRef = useRef(0);
  const captureRef = useRef(null);
  const dragRectsRef = useRef({
    vessels: new Map(),
    drops: {},
    stations: {},
  });
  const lastHotRef = useRef({ id: null, micro: false, discard: false });
  const noticeTimer = useRef(0);
  const hintTimer = useRef(0);
  const closeTimer = useRef(0);
  const activePanelRef = useRef(null);
  const cookTimers = useRef([]);
  const unlockedOnce = useRef(false);
  const skipFreezerClick = useRef(false);
  const takeoutRef = useRef(false);

  vesselsRef.current = vessels;
  dragRef.current = drag;
  cookingIdRef.current = cookingId;
  activePanelRef.current = activePanel;

  const hasVessel = vessels.length > 0;
  const hasFoodOnCanvas = vessels.some((v) => v.tiles.length > 0);
  const cooking = cook !== "idle";
  const openPanel = cooking ? "microwave" : activePanel;
  const showHint = !hintGone;

  useEffect(() => {
    clearTimeout(hintTimer.current);
    if (!hasVessel) {
      setHintGone(false);
      setHintLeaving(false);
      return;
    }
    setHintLeaving(true);
    hintTimer.current = setTimeout(() => setHintGone(true), 800);
    return () => clearTimeout(hintTimer.current);
  }, [hasVessel]);

  function say(text, ms = 2100) {
    clearTimeout(noticeTimer.current);
    setNotice({ text, leaving: false, id: uid() });
    noticeTimer.current = setTimeout(() => {
      setNotice((n) => (n ? { ...n, leaving: true } : n));
      noticeTimer.current = setTimeout(() => setNotice(null), 280);
    }, ms);
  }

  function cueHover() {
    if (dragRef.current) return;
    playHover();
  }

  function setPanel(id) {
    if (cookingIdRef.current) return;
    clearTimeout(closeTimer.current);
    if (id && id !== activePanelRef.current) playPanelOpen();
    activePanelRef.current = id;
    setActivePanel(id);
  }

  function enterStation(id) {
    const already = activePanelRef.current === id;
    setPanel(id);
    if (already) cueHover();
  }

  // Touch: tap an icon to open its panel; tap the same icon again to close it.
  function toggleStation(id) {
    if (cookingIdRef.current) return;
    if (activePanelRef.current === id) {
      clearTimeout(closeTimer.current);
      playPanelClose();
      activePanelRef.current = null;
      setActivePanel(null);
      return;
    }
    setPanel(id);
  }

  function leavePanel(id) {
    if (holdPanel || cookingIdRef.current) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActivePanel((current) => {
        if (current === id) {
          playPanelClose();
          activePanelRef.current = null;
          return null;
        }
        return current;
      });
    }, 180);
  }

  function placeGhost() {
    const el = ghostRef.current;
    if (!el) return;
    const s = pos.current.scale ?? 1;
    const d = dragRef.current;
    const x = pos.current.x;
    const y = pos.current.y;
    if (d && (d.kind === "vessel-new" || d.kind === "vessel-move")) {
      const ox = d.offsetX;
      const oy = d.offsetY;
      el.style.transformOrigin = `${ox}px ${oy}px`;
      el.style.transform = `translate(${x - ox}px, ${y - oy}px) scale(${s})`;
      return;
    }
    el.style.transformOrigin = "50% 50%";
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
  }

  function cacheDragRects() {
    const pad = 6;
    const skipId =
      dragRef.current?.kind === "vessel-move" ? dragRef.current.vesselId : null;
    const vessels = new Map();
    for (const vessel of vesselsRef.current) {
      if (vessel.id === skipId) continue;
      if (cookingIdRef.current === vessel.id) continue;
      const el = document.querySelector(`[data-vessel="${vessel.id}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      vessels.set(vessel.id, {
        left: r.left - pad,
        right: r.right + pad,
        top: r.top - pad,
        bottom: r.bottom + pad,
        cx: (r.left + r.right) / 2,
        cy: (r.top + r.bottom) / 2,
      });
    }
    const drops = {};
    for (const name of ["discard", "microwave", "microwave-icon"]) {
      const el = document.querySelector(`[data-drop="${name}"]`);
      if (el) drops[name] = el.getBoundingClientRect();
    }
    const stations = {};
    for (const id of ["chinaware", "freezer", "microwave"]) {
      const el = document.querySelector(`[data-station="${id}"]`);
      if (el) stations[id] = el.getBoundingClientRect();
    }
    dragRectsRef.current = { vessels, drops, stations };
  }

  function hitDropCached(x, y, name) {
    return pointInRect(dragRectsRef.current.drops[name], x, y);
  }

  function overStationCached(x, y, id) {
    return pointInRect(dragRectsRef.current.stations[id], x, y);
  }

  function cancelMotion() {
    cancelAnimationFrame(scaleRafRef.current);
    cancelAnimationFrame(motionRafRef.current);
    scaleRafRef.current = 0;
    motionRafRef.current = 0;
  }

  function releaseCapture() {
    const cap = captureRef.current;
    captureRef.current = null;
    if (!cap) return;
    try {
      if (cap.el.hasPointerCapture?.(cap.id)) cap.el.releasePointerCapture(cap.id);
    } catch {
      /* already released / detached */
    }
  }

  function startScaleLoop() {
    if (scaleRafRef.current) return;
    const tick = () => {
      const d = dragRef.current;
      if (!d || d.returning || d.swallowing) {
        scaleRafRef.current = 0;
        return;
      }
      const target = pos.current.scaleTarget ?? 1;
      const s = pos.current.scale ?? 1;
      const next = s + (target - s) * 0.32;
      if (Math.abs(next - target) < 0.002) {
        pos.current.scale = target;
        placeGhost();
        scaleRafRef.current = 0;
        return;
      }
      pos.current.scale = next;
      placeGhost();
      scaleRafRef.current = requestAnimationFrame(tick);
    };
    scaleRafRef.current = requestAnimationFrame(tick);
  }

  function updateHot(x, y) {
    const d = dragRef.current;
    if (!d || d.returning || d.swallowing) return;
    let nextId = null;
    let nextMicro = false;
    let nextDiscard = false;
    if (d.kind === "tile-new" || d.kind === "tile-move") {
      const target = hitVesselFromRects(
        x,
        y,
        vesselsRef.current,
        dragRectsRef.current.vessels,
      );
      nextId = target && canLand(target, d.item, d) ? target.id : null;
    } else if (d.kind === "vessel-move") {
      const moving = vesselsRef.current.find((v) => v.id === d.vesselId);
      const overMicro =
        hitDropCached(x, y, "microwave") ||
        hitDropCached(x, y, "microwave-icon") ||
        overStationCached(x, y, "microwave");
      nextMicro = Boolean(
        overMicro && moving && !moving.burnt && moving.tiles.length > 0,
      );
      nextDiscard = hitDropCached(x, y, "discard");
      if (overMicro && activePanelRef.current !== "microwave") {
        setPanel("microwave");
        requestAnimationFrame(cacheDragRects);
      }
    }
    const prev = lastHotRef.current;
    if (prev.id !== nextId) setHotId(nextId);
    if (prev.micro !== nextMicro) setHotMicro(nextMicro);
    if (prev.discard !== nextDiscard) setHotDiscard(nextDiscard);
    lastHotRef.current = { id: nextId, micro: nextMicro, discard: nextDiscard };
  }

  function moveGhostTo(x, y) {
    const d = dragRef.current;
    if (!d || d.returning || d.swallowing) return;
    pos.current.x = x;
    pos.current.y = y;
    pos.current.tx = x;
    pos.current.ty = y;
    const overDiscard = d.kind === "vessel-move" && hitDropCached(x, y, "discard");
    pos.current.scaleTarget = overDiscard ? 0.56 : 1;
    placeGhost();
    if (Math.abs((pos.current.scale ?? 1) - pos.current.scaleTarget) >= 0.002) {
      startScaleLoop();
    }
    updateHot(x, y);
  }

  function beginDrag(next, pointerEvent) {
    dragGenRef.current += 1;
    cancelMotion();
    releaseCapture();
    lastHotRef.current = { id: null, micro: false, discard: false };
    setHotId(null);
    setHotMicro(false);
    setHotDiscard(false);
    pos.current = {
      x: next.x,
      y: next.y,
      tx: next.x,
      ty: next.y,
      scale: next.scale ?? 1,
      scaleTarget: 1,
    };
    dragRef.current = next;
    const keepFreezer = next.kind === "tile-new";
    if (next.kind === "vessel-new") {
      setActivePanel(null);
      setHoldPanel(false);
    } else if (next.kind === "vessel-move") {
      setActivePanel((p) => (p === "microwave" ? p : null));
      setHoldPanel(true);
    } else {
      setHoldPanel(keepFreezer);
    }
    const capEl = stageRef.current;
    const pointerId = pointerEvent?.pointerId;
    if (capEl && pointerId != null) {
      try {
        capEl.setPointerCapture(pointerId);
        captureRef.current = { el: capEl, id: pointerId };
      } catch {
        captureRef.current = null;
      }
    }
    setDrag(next);
    document.body.classList.add("is-dragging");
    cacheDragRects();
    placeGhost();
    if (Math.abs((pos.current.scale ?? 1) - 1) >= 0.002) startScaleLoop();
    startDragSound();
  }

  function clearDrag() {
    stopDragSound();
    cancelMotion();
    releaseCapture();
    document.body.classList.remove("is-dragging");
    lastHotRef.current = { id: null, micro: false, discard: false };
    setDrag(null);
    setHotId(null);
    setHotMicro(false);
    setHotDiscard(false);
    if (!cookingIdRef.current) setHoldPanel(false);
    dragRef.current = null;
    requestAnimationFrame(() => {
      if (cookingIdRef.current) return;
      const over = document
        .elementsFromPoint(pos.current.x, pos.current.y)
        .some((el) => el.closest(".rail-item"));
      if (!over) setActivePanel(null);
    });
  }

  function bounceBack(onDone) {
    const gen = dragGenRef.current;
    const start = { x: pos.current.x, y: pos.current.y };
    const end = { x: dragRef.current.originX, y: dragRef.current.originY };
    const t0 = performance.now();
    const dur = 420;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    cancelAnimationFrame(scaleRafRef.current);
    scaleRafRef.current = 0;
    setDrag((d) => (d ? { ...d, returning: true } : d));
    if (dragRef.current) dragRef.current = { ...dragRef.current, returning: true };
    const step = (now) => {
      if (gen !== dragGenRef.current) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - t) ** 3;
      const hop = reduceMotion
        ? 0
        : Math.sin(t * Math.PI) * 10;
      pos.current.x = start.x + (end.x - start.x) * e;
      pos.current.y = start.y + (end.y - start.y) * e - hop;
      pos.current.scale = 1;
      placeGhost();
      if (t < 1) motionRafRef.current = requestAnimationFrame(step);
      else {
        if (gen !== dragGenRef.current) return;
        onDone?.();
        clearDrag();
      }
    };
    motionRafRef.current = requestAnimationFrame(step);
  }

  function handOffIntoMicrowave(vessel, onDone) {
    const d = dragRef.current;
    const stillThisDrag =
      d &&
      d.kind === "vessel-move" &&
      d.vesselId === vessel.id &&
      d.swallowing;
    if (!stillThisDrag) {
      onDone();
      return;
    }
    const micro = document.querySelector("[data-drop=microwave]");
    const r = micro
      ? micro.getBoundingClientRect()
      : { left: 200, top: 200, width: COOK.w, height: COOK.h };
    const layout = cookDishLayout(vessel.def);
    const sx = r.width / COOK.w;
    const sy = r.height / COOK.h;
    const startLeft = pos.current.x - (d?.offsetX ?? 0);
    const startTop = pos.current.y - (d?.offsetY ?? 0);
    const startScale = pos.current.scale ?? 1;
    const endLeft = r.left + layout.left * sx;
    const endTop = r.top + layout.top * sy;
    const endScale = layout.scale * sx;

    if (d) {
      dragRef.current = { ...d, swallowing: true, offsetX: 0, offsetY: 0 };
      setDrag(dragRef.current);
    }
    cancelAnimationFrame(scaleRafRef.current);
    scaleRafRef.current = 0;
    pos.current.x = startLeft;
    pos.current.y = startTop;

    const t0 = performance.now();
    const dur = COOK.handOffMs;
    const gen = dragGenRef.current;
    const step = (now) => {
      if (gen !== dragGenRef.current) {
        onDone();
        return;
      }
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - t) ** 2;
      pos.current.x = startLeft + (endLeft - startLeft) * e;
      pos.current.y = startTop + (endTop - startTop) * e;
      pos.current.scale = startScale + (endScale - startScale) * e;
      placeGhost();
      if (t < 1) motionRafRef.current = requestAnimationFrame(step);
      else onDone();
    };
    motionRafRef.current = requestAnimationFrame(step);
  }

  function addTileToVessel(vesselId, item) {
    const landed = uid();
    setVessels((list) =>
      list.map((v) => {
        if (v.id !== vesselId) return v;
        const slot = nextOpenSlot(v.tiles, v.def.slots);
        if (slot < 0) return v;
        return {
          ...v,
          tiles: [
            ...v.tiles,
            { instanceId: landed, item, slot, justLanded: true },
          ],
        };
      }),
    );
    setTimeout(() => {
      setVessels((list) =>
        list.map((v) => ({
          ...v,
          tiles: v.tiles.map((t) =>
            t.instanceId === landed ? { ...t, justLanded: false } : t,
          ),
        })),
      );
    }, 380);
  }

  function dropTile(x, y, d) {
    const vessel = hitVessel(x, y, vesselsRef.current);
    if (vessel) {
      if (vessel.cooked) {
        playNope();
        say(line("cookedNoAdd"));
        setShakeId(vessel.id);
        setTimeout(() => setShakeId(null), 420);
        bounceBack();
        return;
      }
      if (!vesselTakes(vessel.type, d.item)) {
        playNope();
        say(line(rejectKeyFor(vessel.type, d.item)));
        setShakeId(vessel.id);
        setTimeout(() => setShakeId(null), 420);
        bounceBack();
        return;
      }
      if (d.kind === "tile-move" && vessel.id === d.vesselId) {
        clearDrag();
        return;
      }
      const slot = nextOpenSlot(vessel.tiles, vessel.def.slots);
      if (slot < 0) {
        playNope();
        say(line(rejectKeyFor(vessel.type, d.item, "full")));
        setShakeId(vessel.id);
        setTimeout(() => setShakeId(null), 420);
        bounceBack();
        return;
      }
      if (d.kind === "tile-move") {
        playTunk();
        const landed = d.instanceId;
        setVessels((list) =>
          list.map((v) => {
            if (v.id === d.vesselId) {
              return {
                ...v,
                tiles: v.tiles.filter((t) => t.instanceId !== d.instanceId),
              };
            }
            if (v.id === vessel.id) {
              return {
                ...v,
                tiles: [
                  ...v.tiles,
                  {
                    instanceId: landed,
                    item: d.item,
                    slot,
                    justLanded: true,
                  },
                ],
              };
            }
            return v;
          }),
        );
        setTimeout(() => {
          setVessels((list) =>
            list.map((v) => ({
              ...v,
              tiles: v.tiles.map((t) =>
                t.instanceId === landed ? { ...t, justLanded: false } : t,
              ),
            })),
          );
        }, 380);
        setNotice(null);
        clearDrag();
        return;
      }
      playTunk();
      addTileToVessel(vessel.id, d.item);
      setNotice(null);
      clearDrag();
      return;
    }

    if (d.kind === "tile-move") {
      playPoof();
      setVessels((list) =>
        list.map((v) =>
          v.id === d.vesselId
            ? { ...v, tiles: v.tiles.filter((t) => t.instanceId !== d.instanceId) }
            : v,
        ),
      );
      clearDrag();
      return;
    }

    playNope();
    say(line("nowhere"));
    bounceBack();
  }

  function dropVesselNew(x, y, d) {
    const type = d.type;
    if (overStation(x, y, "chinaware") || overIconColumn(x, y) || hitDrop(x, y, "discard")) {
      bounceBack();
      return;
    }
    playClink(type, "place");
    const def = VESSELS[type];
    const next = vesselDropOrigin(x, y, def, d.offsetX, d.offsetY);
    const first = vesselsRef.current.length === 0;
    setVessels((list) => [
      ...list,
      { id: uid(), type, def, x: next.x, y: next.y, tiles: [], cooked: false, burnt: false },
    ]);
    if (first && !unlockedOnce.current) {
      unlockedOnce.current = true;
      say(COPY.freezerUnlocked);
    }
    clearDrag();
  }

  function beginCookSequence(vessel) {
    const burning = Boolean(vessel.cooked && !vessel.burnt);
    cookTimers.current.forEach(clearTimeout);
    cookTimers.current = [];
    setVessels((list) =>
      list.map((v) => (v.justCooked ? { ...v, justCooked: false } : v)),
    );
    setCookingId(vessel.id);
    cookingIdRef.current = vessel.id;
    setActivePanel("microwave");
    setHoldPanel(true);
    setNotice(null);
    setCook("receive");
    setCookMode(burning ? "burn" : "cook");
    playMicroDoor(true);
    if (dragRef.current) {
      dragRef.current = { ...dragRef.current, swallowing: true };
    }
    setDrag((d) => (d ? { ...d, swallowing: true } : d));
    const cookGen = dragGenRef.current;
    let seated = false;

    const afterHandOff = () => {
      if (seated) return;
      seated = true;
      playMicroSettle();
      setCook("seated");
      if (dragGenRef.current === cookGen) clearDrag();
      const cookedId = vessel.id;
      cookTimers.current.forEach(clearTimeout);
      cookTimers.current = [
        setTimeout(() => {
          playMicroDoor(false);
          setCook("closing");
        }, COOK.seatedMs),
        setTimeout(() => {
          playHum(COOK.humMs / 1000);
          setCook("humming");
        }, COOK.seatedMs + COOK.closeMs),
        setTimeout(() => {
          playDing();
          setCook("ding");
        }, COOK.seatedMs + COOK.closeMs + COOK.humMs),
        setTimeout(() => {
          setVessels((list) =>
            list.map((v) =>
              v.id === cookedId
                ? burning
                  ? { ...v, cooked: true, burnt: true, justCooked: false }
                  : { ...v, cooked: true, burnt: false }
                : v,
            ),
          );
          playMicroDoor(true);
          if (burning) {
            playBurnPuff();
            playBurn();
            say(line("burntReveal"), 2400);
          } else {
            playSteamPuff();
            playWarm();
            say(CLOSING_LINE, 2200);
          }
          setPuffKey((k) => k + 1);
          setCook("reveal");
        }, COOK.seatedMs + COOK.closeMs + COOK.humMs + COOK.dingHoldMs),
        setTimeout(() => {
          setCook("holding");
        }, COOK.seatedMs + COOK.closeMs + COOK.humMs + COOK.dingHoldMs + COOK.revealBeatMs),
      ];
    };

    const lead = window.setTimeout(() => {
      if (dragGenRef.current === cookGen) {
        handOffIntoMicrowave(vessel, afterHandOff);
      } else {
        afterHandOff();
      }
    }, COOK.receiveLeadMs);
    cookTimers.current.push(lead);
  }

  function finishMicrowaveTakeout() {
    if (!takeoutRef.current) return;
    takeoutRef.current = false;
    playMicroDoor(false);
    setCook("closing");
    setPuffKey(0);
    cookTimers.current.forEach(clearTimeout);
    cookTimers.current = [
      setTimeout(() => {
        setCook("idle");
        setHoldPanel(false);
        setActivePanel(null);
      }, COOK.doorMs),
    ];
  }

  function dropVesselMove(x, y, d) {
    const vessel = vesselsRef.current.find((v) => v.id === d.vesselId);
    if (!vessel) {
      clearDrag();
      return;
    }

    if (
      hitDrop(x, y, "microwave") ||
      hitDrop(x, y, "microwave-icon") ||
      overStation(x, y, "microwave")
    ) {
      if (d.fromMicrowave || takeoutRef.current) {
        takeoutRef.current = false;
        setCookingId(vessel.id);
        cookingIdRef.current = vessel.id;
        setCook("holding");
        setHoldPanel(true);
        clearDrag();
        return;
      }
      if (cookingIdRef.current) {
        playNope();
        say(line("microwaveBusy"));
        bounceBack();
        return;
      }
      if (vessel.burnt) {
        playNope();
        say(line("alreadyBurnt"));
        bounceBack();
        return;
      }
      if (vessel.tiles.length === 0) {
        playNope();
        say(line("cookEmpty"));
        bounceBack();
        return;
      }
      beginCookSequence(vessel);
      return;
    }

    if (hitDrop(x, y, "discard")) {
      playDiscard();
      setVessels((list) => list.filter((v) => v.id !== d.vesselId));
      if (vesselsRef.current.length <= 1) {
        unlockedOnce.current = false;
        setFreezerOpen(false);
      }
      finishMicrowaveTakeout();
      clearDrag();
      return;
    }

    if (overStation(x, y, "chinaware")) {
      playClink(vessel.type, "putAway");
      setVessels((list) => list.filter((v) => v.id !== d.vesselId));
      if (vesselsRef.current.length <= 1) {
        unlockedOnce.current = false;
        setFreezerOpen(false);
      }
      finishMicrowaveTakeout();
      clearDrag();
      return;
    }

    playClink(vessel.type, "nudge");
    const next = vesselDropOrigin(x, y, d.def, d.offsetX, d.offsetY);
    setVessels((list) =>
      list.map((v) => (v.id === d.vesselId ? { ...v, x: next.x, y: next.y } : v)),
    );
    finishMicrowaveTakeout();
    clearDrag();
  }

  useEffect(() => {
    const move = (e) => {
      if (!dragRef.current || dragRef.current.returning || dragRef.current.swallowing) {
        return;
      }
      moveGhostTo(e.clientX, e.clientY);
    };
    const up = (e) => {
      const d = dragRef.current;
      if (!d || d.returning || d.swallowing) return;
      const x = e.clientX;
      const y = e.clientY;
      cacheDragRects();
      if (d.kind === "tile-new" || d.kind === "tile-move") dropTile(x, y, d);
      else if (d.kind === "vessel-new") dropVesselNew(x, y, d);
      else if (d.kind === "vessel-move") dropVesselMove(x, y, d);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    const down = () => unlockSound();
    const key = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setMuted(toggleMute());
        unlockSound();
      }
    };
    startBed();
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    const onResize = () => {
      setVessels((list) => {
        let changed = false;
        const next = list.map((v) => {
          const pos = clampVessel(v.x, v.y, v.def);
          if (pos.x === v.x && pos.y === v.y) return v;
          changed = true;
          return { ...v, x: pos.x, y: pos.y };
        });
        return changed ? next : list;
      });
      if (dragRef.current) cacheDragRects();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(
    () => () => {
      clearTimeout(noticeTimer.current);
      clearTimeout(closeTimer.current);
      cookTimers.current.forEach(clearTimeout);
      cancelAnimationFrame(scaleRafRef.current);
      cancelAnimationFrame(motionRafRef.current);
      releaseCapture();
      stopDragSound();
    },
    [],
  );

  useEffect(() => {
    if (vessels.length === 0) {
      setFreezerOpen(false);
      unlockedOnce.current = false;
    }
  }, [vessels.length]);

  // Touch: tapping anywhere outside the rail closes an open panel.
  useEffect(() => {
    if (!IS_TOUCH) return;
    const onDocClick = (e) => {
      if (cookingIdRef.current) return;
      if (!activePanelRef.current) return;
      if (e.target.closest?.(".rail")) return;
      playPanelClose();
      activePanelRef.current = null;
      setActivePanel(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function onTileNewDown(e, item) {
    e.preventDefault();
    e.stopPropagation();
    skipFreezerClick.current = true;
    playPickup();
    const rect = e.currentTarget.getBoundingClientRect();
    beginDrag({
      kind: "tile-new",
      item,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      x: e.clientX,
      y: e.clientY,
    }, e);
  }

  function onTileMoveDown(e, vessel, tile) {
    if (vessel.cooked) return;
    e.preventDefault();
    e.stopPropagation();
    playPickup();
    setVessels((list) => {
      const i = list.findIndex((v) => v.id === vessel.id);
      if (i < 0) return list;
      const next = [...list];
      const [picked] = next.splice(i, 1);
      next.push(picked);
      return next;
    });
    const rect = e.currentTarget.getBoundingClientRect();
    beginDrag({
      kind: "tile-move",
      item: tile.item,
      vesselId: vessel.id,
      instanceId: tile.instanceId,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      x: e.clientX,
      y: e.clientY,
    }, e);
  }

  function onWareDown(e, type) {
    e.preventDefault();
    playPickup();
    const def = VESSELS[type];
    const art =
      e.currentTarget.querySelector(".vessel-art") || e.currentTarget;
    const rect = art.getBoundingClientRect();
    const sx = rect.width / def.w || 1;
    const sy = rect.height / def.h || 1;
    beginDrag({
      kind: "vessel-new",
      type,
      def,
      offsetX: (e.clientX - rect.left) / sx,
      offsetY: (e.clientY - rect.top) / sy,
      originX: e.clientX,
      originY: e.clientY,
      x: e.clientX,
      y: e.clientY,
    }, e);
  }

  function onVesselDown(e, vessel, fromMicrowave = false) {
    if (e.target.closest(".pile-tile")) return;
    e.preventDefault();
    playPickup();
    if (fromMicrowave) {
      e.stopPropagation();
      takeoutRef.current = true;
      setCookingId(null);
      cookingIdRef.current = null;
    } else if (cookingId === vessel.id) {
      return;
    }
    setVessels((list) => {
      const i = list.findIndex((v) => v.id === vessel.id);
      if (i < 0) return list;
      const next = [...list];
      const [picked] = next.splice(i, 1);
      next.push({ ...picked, justCooked: false });
      return next;
    });
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = rect.width / vessel.def.w || 1;
    const sy = rect.height / vessel.def.h || 1;
    beginDrag({
      kind: "vessel-move",
      type: vessel.type,
      vesselId: vessel.id,
      def: vessel.def,
      fromMicrowave,
      scale: fromMicrowave ? cookDishLayout(vessel.def).scale : 1,
      offsetX: (e.clientX - rect.left) / sx,
      offsetY: (e.clientY - rect.top) / sy,
      originX: e.clientX,
      originY: e.clientY,
      x: e.clientX,
      y: e.clientY,
    }, e);
  }

  function onFreezerClick(e) {
    if (skipFreezerClick.current) {
      skipFreezerClick.current = false;
      return;
    }
    if (!hasVessel) {
      say(line("freezerLocked"));
      return;
    }
    const next = !freezerOpen;
    setFreezerOpen(next);
    playDoor(next);
    if (next) say(line("freezerOpen"), 1600);
  }

  function onLockedFreezerIcon(e) {
    if (hasVessel) return;
    say(line("freezerLocked"));
  }

  function onLockedMicrowaveIcon() {
    if (hasFoodOnCanvas) return;
    say(line("microwaveLocked"));
  }

  const draggingTileId =
    drag?.kind === "tile-move" ? drag.instanceId : null;
  const draggingVesselId =
    drag?.kind === "vessel-move" ? drag.vesselId : null;
  const innerVessel = cookingId
    ? vessels.find((v) => v.id === cookingId)
    : null;
  const innerDish = innerVessel ? cookDishLayout(innerVessel.def) : null;

  return (
    <div className="stage" ref={stageRef}>
      {showHint && (
        <p className={`void-hint${hintLeaving ? " is-leaving" : ""}`}>
          {COPY.voidHint}
        </p>
      )}

      {vessels.map((vessel, i) => {
        if (draggingVesselId === vessel.id) return null;
        if (cookingId === vessel.id) return null;
        return (
          <div
            key={vessel.id}
            data-vessel={vessel.id}
            className={[
              "vessel",
              hotId === vessel.id ? "is-hot" : "",
              shakeId === vessel.id ? "is-shake" : "",
              vessel.justCooked ? "is-just-cooked" : "",
            ].join(" ")}
            style={{
              left: vessel.x,
              top: vessel.y,
              width: vessel.def.w,
              height: vessel.def.h,
              zIndex: 5 + i,
            }}
            onPointerDown={(e) => onVesselDown(e, vessel)}
          >
            <div className="vessel-hit" />
            <VesselStack
              type={vessel.type}
              tiles={vessel.tiles}
              hideId={draggingTileId}
              cooked={vessel.cooked}
              burnt={vessel.burnt}
              fresh={vessel.justCooked}
              onTileDown={
                vessel.cooked
                  ? undefined
                  : (e, tile) => onTileMoveDown(e, vessel, tile)
              }
            />
          </div>
        );
      })}

      <aside className="rail">
        <div
          className="rail-stack"
          onPointerLeave={() => {
            if (IS_TOUCH) return;
            if (openPanel) leavePanel(openPanel);
          }}
        >
          <RailItem
            id="chinaware"
            label="chinaware"
            open={openPanel === "chinaware"}
            onEnter={() => enterStation("chinaware")}
            onToggle={() => toggleStation("chinaware")}
            onIconEnter={cueHover}
            icon={<IconChinaware />}
          >
            {openPanel === "chinaware" && (
              <div className="panel" data-station="chinaware">
                <div className="panel-card">
                  <div className="ware-grid">
                    {VESSEL_ORDER.map((type) => (
                      <div
                        key={type}
                        className="ware-item"
                        onPointerEnter={cueHover}
                        onPointerDown={(e) => onWareDown(e, type)}
                      >
                        <VesselArt type={type} />
                        <span className="ware-caption">{VESSELS[type].name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </RailItem>
          <RailItem
            id="freezer"
            label="freezer"
            open={openPanel === "freezer"}
            onEnter={() => enterStation("freezer")}
            onToggle={() => toggleStation("freezer")}
            onIconEnter={cueHover}
            onIconClick={onLockedFreezerIcon}
            icon={<IconFreezer />}
          >
            {openPanel === "freezer" && (
              <div className="panel" data-station="freezer">
                <div className="panel-card">
                  <div
                    className={`freezer-hit ${!hasVessel ? "is-locked" : ""}`}
                    style={{
                      width: FREEZER_SIZE.closedW,
                      height: FREEZER_SIZE.h,
                    }}
                    onClick={onFreezerClick}
                  >
                    <FreezerArt open={freezerOpen && hasVessel} />
                    {hasVessel && !freezerOpen && (
                      <div className="hover-hint">{COPY.lookInside}</div>
                    )}
                    {freezerOpen && hasVessel && (
                      <div
                        className="freezer-cavity"
                        style={{
                          left: FREEZER_SIZE.cavity.left,
                          top: FREEZER_SIZE.cavity.top,
                          width: FREEZER_SIZE.cavity.w,
                          height: FREEZER_SIZE.cavity.h,
                        }}
                      >
                        {["protein", "starch", "veg"].map((cat) => (
                          <div key={cat} className={`shelf-group shelf-${cat}`}>
                            <div className="shelf-rack">
                              {MENU.filter((item) => item.category === cat).map(
                                (item, i) => (
                                  <div
                                    key={item.id}
                                    className={`rack-tile ${
                                      drag?.kind === "tile-new" &&
                                      drag.item.id === item.id
                                        ? "is-ghosted"
                                        : ""
                                    }`}
                                    style={{ animationDelay: `${40 + i * 22}ms` }}
                                    onPointerEnter={cueHover}
                                    onPointerDown={(e) => onTileNewDown(e, item)}
                                  >
                                    <FoodTile id={item.id} name={item.name} />
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="shelf-board" aria-hidden="true" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </RailItem>
          <RailItem
            id="microwave"
            label="microwave"
            open={openPanel === "microwave"}
            onEnter={() => enterStation("microwave")}
            onToggle={() => toggleStation("microwave")}
            onIconEnter={cueHover}
            onIconClick={onLockedMicrowaveIcon}
            drop="microwave-icon"
            icon={<IconMicrowave />}
          >
            {openPanel === "microwave" && (
              <div className="panel" data-station="microwave">
                <div className="panel-card">
                  <div
                    className={`micro-wrap ${hotMicro ? "is-hot" : ""} ${
                      !hasFoodOnCanvas ? "is-locked" : ""
                    }`}
                    data-drop="microwave"
                    onPointerEnter={cueHover}
                    onClick={() => {
                      if (!hasFoodOnCanvas) say(line("microwaveLocked"));
                    }}
                  >
                    <MicrowaveArt
                      phase={cook}
                      vessel={innerVessel}
                      dish={innerDish}
                      puffKey={puffKey}
                      puffKind={cookMode === "burn" ? "smoke" : "steam"}
                      onDishDown={(e) =>
                        innerVessel && onVesselDown(e, innerVessel, true)
                      }
                    />
                    {cook === "idle" && hasFoodOnCanvas && (
                      <div className="hover-hint">{COPY.dropItIn}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </RailItem>
        </div>
        <div
          className={`discard-slot${hotDiscard ? " is-hot" : ""}`}
          data-drop="discard"
          aria-label="put away"
        >
          <IconDiscard />
          {hotDiscard && (
            <div className="hover-hint">{COPY.putAway}</div>
          )}
        </div>
      </aside>

      {drag && (
        <div
          ref={(el) => {
            ghostRef.current = el;
            if (el) placeGhost();
          }}
          className="ghost"
        >
          <div
            className={
              drag.returning || drag.swallowing
                ? "ghost-inner"
                : "ghost-inner is-lifted"
            }
          >
            {drag.kind === "tile-new" || drag.kind === "tile-move" ? (
              <FoodTile
                id={drag.item.id}
                w={drag.kind === "tile-move" ? PLATE_TILE.w : TILE.w}
                h={drag.kind === "tile-move" ? PLATE_TILE.h : TILE.h}
              />
            ) : drag.kind === "vessel-move" ? (
              <VesselStack
                type={drag.type}
                tiles={
                  vessels.find((v) => v.id === drag.vesselId)?.tiles ?? []
                }
                cooked={
                  vessels.find((v) => v.id === drag.vesselId)?.cooked ?? false
                }
                burnt={
                  vessels.find((v) => v.id === drag.vesselId)?.burnt ?? false
                }
              />
            ) : (
              <div className="vessel-body">
                <VesselArt type={drag.type} />
              </div>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="dialogue-dock">
          <div
            key={notice.id}
            className={`dialogue ${notice.leaving ? "is-leaving" : ""}`}
          >
            {notice.text}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`sound-toggle${muted ? " is-off" : ""}`}
        aria-label={muted ? "music off" : "music on"}
        aria-pressed={!muted}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setMuted(toggleMute());
          unlockSound();
        }}
      >
        <svg className="sound-icon" viewBox="0 0 24 24" aria-hidden="true">
          <ellipse
            cx="7.2"
            cy="17.4"
            rx="2.9"
            ry="2.2"
            fill="currentColor"
            transform="rotate(-22 7.2 17.4)"
          />
          <ellipse
            cx="15.6"
            cy="15.6"
            rx="2.9"
            ry="2.2"
            fill="currentColor"
            transform="rotate(-22 15.6 15.6)"
          />
          <path
            d="M9.8 16.8V7.1M18.2 15V5.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M9.8 7.1L18.2 5.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <line
            className="sound-slash"
            x1="2.4"
            y1="21.6"
            x2="21.6"
            y2="2.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function RailItem({
  id,
  label,
  open,
  onEnter,
  onToggle,
  onIconEnter,
  onIconClick,
  drop,
  icon,
  children,
}) {
  return (
    <div
      className={`rail-item ${open ? "is-open" : ""}`}
      data-station={id}
      onPointerEnter={IS_TOUCH ? undefined : onEnter}
    >
      <div
        className={`rail-icon ${open ? "is-open" : ""}`}
        data-drop={drop}
        role="img"
        aria-label={label}
        onPointerEnter={IS_TOUCH ? undefined : onIconEnter}
        onClick={(e) => {
          if (IS_TOUCH) onToggle?.(e);
          onIconClick?.(e);
        }}
      >
        {icon}
      </div>
      {children}
    </div>
  );
}
