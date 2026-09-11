import freezerClosed from "./assets/locked/freezer-closed.png";
import freezerOpen from "./assets/locked/freezer-open.png";
import microwaveSrc from "./assets/locked/microwave.png";
import microwaveDoorInner from "./assets/locked/microwave-door-inner.png";
import iconFreezerSrc from "./assets/locked/icon-freezer.png";
import iconMicrowaveSrc from "./assets/locked/icon-microwave.png";
import discardSrc from "./assets/locked/discard.png";
import dinnerSrc from "./assets/locked/vessels/dinner.png";
import sideSrc from "./assets/locked/vessels/side.png";
import bowlSrc from "./assets/locked/vessels/bowl.png";
import smallSrc from "./assets/locked/vessels/small.png";
import dinnerEdgeSrc from "./assets/locked/vessels/dinner-edge.png";
import sideEdgeSrc from "./assets/locked/vessels/side-edge.png";
import bowlEdgeSrc from "./assets/locked/vessels/bowl-edge.png";
import smallEdgeSrc from "./assets/locked/vessels/small-edge.png";
import beef from "./assets/locked/food/beef.png";
import curry from "./assets/locked/food/curry.png";
import gyudon from "./assets/locked/food/gyudon.png";
import jasmine from "./assets/locked/food/jasmine.png";
import lentil from "./assets/locked/food/lentil.png";
import mapo from "./assets/locked/food/mapo.png";
import pasta from "./assets/locked/food/pasta.png";
import peas from "./assets/locked/food/peas.png";
import pho from "./assets/locked/food/pho.png";
import polenta from "./assets/locked/food/polenta.png";
import ramen from "./assets/locked/food/ramen.png";
import shortgrain from "./assets/locked/food/shortgrain.png";
import sprouts from "./assets/locked/food/sprouts.png";
import veggies from "./assets/locked/food/veggies.png";
import { COOK, BURNT, PLATE_TILE, TILE, VESSELS } from "./constants";
import { Steam, SteamBurst } from "./steam";
import burntDinnerLeft from "./assets/locked/burnt/dinner-left.png";
import burntDinnerRight from "./assets/locked/burnt/dinner-right.png";
import burntSide from "./assets/locked/burnt/side.png";
import lavaBowlSrc from "./assets/locked/burnt/lava-bowl.png";
import lavaSmallSrc from "./assets/locked/burnt/lava-small.png";

const COOKED_IMG = Object.fromEntries(
  Object.entries(
    import.meta.glob("./assets/locked/cooked/*.png", {
      eager: true,
      import: "default",
    }),
  ).map(([path, src]) => [path.split("/").pop().replace(".png", ""), src]),
);

function cookedLayer(type, itemId, slot) {
  if (type === "dinnerPlate") {
    const side = slot === 1 ? "right" : "left";
    return COOKED_IMG[`${itemId}-dinner-${side}`];
  }
  if (type === "sidePlate") return COOKED_IMG[`${itemId}-side`];
  if (type === "bowl") return COOKED_IMG[`${itemId}-bowl`];
  if (type === "smallBowl") return COOKED_IMG[`${itemId}-small`];
  return null;
}

function burntLayer(type, slot) {
  if (type === "dinnerPlate") return slot === 1 ? burntDinnerRight : burntDinnerLeft;
  if (type === "sidePlate") return burntSide;
  return null;
}

function LavaFill({ type }) {
  const def = VESSELS[type];
  const src = type === "smallBowl" ? lavaSmallSrc : lavaBowlSrc;
  const frames = BURNT.lavaFrames;
  return (
    <div
      className="lava-fill"
      style={{
        width: def.w,
        height: def.h,
        backgroundImage: `url(${src})`,
        backgroundSize: `${def.w}px ${def.h * frames}px`,
        animationDuration: `${BURNT.lavaMs}ms`,
        "--lava-glow": BURNT.lavaGlow,
        "--lava-strip": `${def.h * frames}px`,
      }}
    />
  );
}

export const FOOD_IMG = {
  beef,
  curry,
  gyudon,
  jasmine,
  lentil,
  mapo,
  pasta,
  peas,
  pho,
  polenta,
  ramen,
  shortgrain,
  sprouts,
  veggies,
};

export const VESSEL_IMG = {
  dinnerPlate: dinnerSrc,
  sidePlate: sideSrc,
  bowl: bowlSrc,
  smallBowl: smallSrc,
};

export const VESSEL_EDGE = {
  dinnerPlate: dinnerEdgeSrc,
  sidePlate: sideEdgeSrc,
  bowl: bowlEdgeSrc,
  smallBowl: smallEdgeSrc,
};

export function Pixel({ src, width, height, className = "", alt = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      className={`pixel ${className}`}
    />
  );
}

export function IconChinaware() {
  return <VesselArt type="dinnerPlate" size={1 / 3} />;
}

export function IconFreezer() {
  return <Pixel src={iconFreezerSrc} width={48} height={48} />;
}

export function IconMicrowave() {
  return <Pixel src={iconMicrowaveSrc} width={48} height={48} />;
}

export function IconDiscard() {
  return <Pixel src={discardSrc} width={32} height={32} className="discard-icon" />;
}

// Logical 48×88 (hi-res B; source PNG is already 3×). Whole sprite scales
// together — door and interior. 6 is the smallest integer bump that lets the
// three-column starch/veg row sit inside the well and clear the open door.
export const FREEZER_SCALE = 6;
export const FREEZER_SIZE = {
  closedW: 48 * FREEZER_SCALE,
  openW: 48 * FREEZER_SCALE,
  h: 88 * FREEZER_SCALE,
  cavity: {
    left: 7 * FREEZER_SCALE,
    top: 9 * FREEZER_SCALE,
    w: 34 * FREEZER_SCALE,
    h: 69 * FREEZER_SCALE,
  },
};

export function FreezerArt({ open }) {
  const src = open ? freezerOpen : freezerClosed;
  return (
    <Pixel
      src={src}
      width={FREEZER_SIZE.closedW}
      height={FREEZER_SIZE.h}
      className={`freezer-art ${open ? "is-open" : ""}`}
    />
  );
}

const DOOR_OPEN = new Set(["receive", "seated", "reveal", "holding"]);

export function MicrowaveArt({
  phase,
  vessel,
  dish,
  puffKey = 0,
  puffKind = "steam",
  onDishDown,
}) {
  const cooking = phase !== "idle";
  const open = DOOR_OPEN.has(phase);
  const humming = phase === "humming";
  const ding = phase === "ding";
  const receive = phase === "receive";
  const showDish =
    vessel &&
    dish &&
    ["seated", "closing", "humming", "ding", "reveal", "holding"].includes(phase);
  const canTake = phase === "reveal" || phase === "holding";
  const puffing = (phase === "reveal" || phase === "holding") && puffKey > 0;

  return (
    <div
      className={[
        "micro-art",
        humming ? "is-humming" : "",
        ding ? "is-ding" : "",
        receive ? "is-receive" : "",
        open ? "is-open" : "",
      ].join(" ")}
    >
      <div className="micro-body">
        <Pixel src={microwaveSrc} width={COOK.w} height={COOK.h} />
      </div>
      {cooking && (
        <>
          {open && (
            <div
              className="micro-cavity"
              style={{
                left: COOK.cavity.left,
                top: COOK.cavity.top,
                width: COOK.cavity.w,
                height: COOK.cavity.h,
              }}
            />
          )}
          {showDish && (
            <div
              className={`micro-dish${canTake ? " is-ready" : ""}`}
              style={{
                left: dish.left,
                top: dish.top,
                width: vessel.def.w,
                height: vessel.def.h,
                ...(dish.scale !== 1
                  ? { transform: `scale(${dish.scale})` }
                  : {}),
                pointerEvents: canTake ? "auto" : "none",
              }}
              onPointerDown={canTake ? onDishDown : undefined}
            >
              <div
                className={`micro-dish-inner${
                  phase === "seated" ? " is-settle" : ""
                }`}
              >
                <VesselStack
                  type={vessel.type}
                  tiles={vessel.tiles}
                  cooked={vessel.cooked}
                  burnt={vessel.burnt}
                  fresh={phase === "reveal"}
                />
                {puffing && (
                  <SteamBurst
                    key={puffKey}
                    type={vessel.type}
                    amount={puffKind === "smoke" ? BURNT.smokePuff : COOK.steamPuff}
                    tone={puffKind}
                    slots={vessel.tiles?.map((tile) => tile.slot)}
                  />
                )}
              </div>
            </div>
          )}
          {open && (
            <div
              className="micro-door-inner"
              style={{
                left: COOK.door.left,
                top: COOK.door.top,
                width: COOK.inner.w,
                height: COOK.inner.h,
              }}
            >
              <Pixel
                src={microwaveDoorInner}
                width={COOK.inner.w}
                height={COOK.inner.h}
              />
            </div>
          )}
        </>
      )}
      <div
        className="micro-window-glow"
        style={{
          left: COOK.glass.left,
          top: COOK.glass.top,
          width: COOK.glass.w,
          height: COOK.glass.h,
          "--glow": COOK.glow,
        }}
      />
    </div>
  );
}

export function VesselArt({ type, size = 1 }) {
  const def = VESSELS[type];
  const w = Math.round(def.w * size);
  const h = Math.round(def.h * size);
  return (
    <span className="vessel-art">
      <Pixel src={VESSEL_IMG[type]} width={w} height={h} />
      <Pixel src={VESSEL_EDGE[type]} width={w} height={h} className="vessel-edge" />
    </span>
  );
}

export function FoodTile({ id, name, className = "", w = TILE.w, h = TILE.h }) {
  return (
    <div className={`food-tile ${className}`} style={{ width: w, height: h }}>
      <Pixel src={FOOD_IMG[id]} width={w} height={h} />
      {name ? <span className="food-name">{name}</span> : null}
    </div>
  );
}

export function VesselStack({
  type,
  tiles,
  hideId,
  onTileDown,
  cooked,
  burnt = false,
  fresh = false,
}) {
  const def = VESSELS[type];
  const lava = burnt && (type === "bowl" || type === "smallBowl");
  return (
    <div className="vessel-figure">
      <div className="vessel-body">
        <VesselArt type={type} />
        {cooked ? (
          <div className={`pile pile-cooked${burnt ? " is-burnt" : ""}`}>
            {lava ? (
              <LavaFill type={type} />
            ) : (
              tiles.map((tile, i) => {
                const src = burnt
                  ? burntLayer(type, tile.slot)
                  : cookedLayer(type, tile.item.id, tile.slot);
                if (!src) return null;
                return (
                  <div
                    key={tile.instanceId}
                    className="cooked-serving"
                    style={{ zIndex: i + 1 }}
                  >
                    <Pixel src={src} width={def.w} height={def.h} />
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="pile">
            {tiles.map((tile, i) => {
              if (hideId && tile.instanceId === hideId) return null;
              const seat = def.slots[tile.slot] ?? def.slots[0];
              return (
                <div
                  key={tile.instanceId}
                  className={`pile-tile ${tile.justLanded ? "is-settle" : ""}`}
                  style={{
                    left: seat.x,
                    top: seat.y,
                    width: PLATE_TILE.w,
                    height: PLATE_TILE.h,
                    zIndex: i + 1,
                  }}
                  onPointerDown={onTileDown ? (e) => onTileDown(e, tile) : undefined}
                >
                  <FoodTile
                    id={tile.item.id}
                    name={onTileDown ? tile.item.name : undefined}
                    w={PLATE_TILE.w}
                    h={PLATE_TILE.h}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {cooked ? (
        <Steam
          key={burnt ? "smoke" : "steam"}
          type={type}
          fresh={fresh}
          tone={burnt ? "smoke" : "steam"}
          slots={tiles.map((tile) => tile.slot)}
        />
      ) : null}
    </div>
  );
}
