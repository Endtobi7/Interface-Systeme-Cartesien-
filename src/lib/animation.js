/**
 * animation.js — geometry for the layered H-Bot animation shown on the
 * Home page.  Each moving sub-assembly translates along a 2-D screen vector
 * (MOTION_AXES) in "native" scene units, exactly like the original
 * standalone animation's sliders.
 *
 * CALIBRATION (Min / Max)
 * ───────────────────────
 * AXIS_RANGE holds the native Min/Max of each axis taken straight from the
 * original control panel (the Min/Max fields):
 *      X : -200 … 100   (span 300)
 *      Y : -250 …  30   (span 280)
 *      Z :    0 … 100   (span 100)
 * These ranges are SHIFTED so they become all-positive (Min → 0), to match
 * the positive coordinates (0…travel) the platform actually sends.  The live
 * machine coordinate is then mapped linearly onto the shifted positive range.
 */

export const SCENE_SIZE = {
  width: 1617,
  height: 1035,
}

/* Screen-space direction of one native unit on each machine axis. */
export const MOTION_AXES = {
  x: { x: 1, y: -0.576 },
  y: { x: 1, y: 0.58 },
  z: { x: 0, y: -1 },
}

/* Native Min/Max of each axis, from the original animation control panel.
   The platform's positive coordinate (0…travel) is mapped onto Min→Max, so
   the model reaches exactly these calibrated end positions. */
export const AXIS_RANGE = {
  x: { min: -200, max: 100 },
  y: { min: -250, max: 30 },
  z: { min: 0, max: 100 },
}

/**
 * Map a live machine coordinate (mm, 0…travel) onto the [Min, Max] native
 * range of an axis.  The platform sends positive coordinates; this places
 * machine-0 at Min and machine-travel at Max.  A small margin keeps the model
 * tracking slightly out-of-range values instead of freezing at an end.
 */
function nativeValue(axisKey, mm, travel) {
  const r = AXIS_RANGE[axisKey]
  let t = travel > 0 ? mm / travel : 0
  t = Math.max(-0.05, Math.min(1.05, t))
  return r.min + t * (r.max - r.min)
}

export function getAxisOffset(axisKey, mm, travel) {
  const vector = MOTION_AXES[axisKey]
  const value = nativeValue(axisKey, mm, travel)
  return { x: vector.x * value, y: vector.y * value }
}

export function combineOffsets(...offsets) {
  return offsets.reduce(
    (acc, o) => ({ x: acc.x + o.x, y: acc.y + o.y }),
    { x: 0, y: 0 },
  )
}

export function toLayerStyle(offset) {
  return {
    transform: `translate(${(offset.x / SCENE_SIZE.width) * 100}%, ${(offset.y / SCENE_SIZE.height) * 100}%)`,
  }
}

/**
 * Build the three layer offsets (green / blue / yellow) from a live machine
 * position and the configured travels.
 */
export function offsetsFromCoords(coords, travels) {
  const { x = 0, y = 0, z = 0 } = coords || {}
  const tx = travels?.x ?? 300
  const ty = travels?.y ?? 300
  const tz = travels?.z ?? 45

  const yOffset = getAxisOffset('y', y, ty)
  const xOffset = getAxisOffset('x', x, tx)
  const zOffset = getAxisOffset('z', z, tz)

  return {
    green: yOffset,
    blue: combineOffsets(yOffset, xOffset),
    yellow: combineOffsets(yOffset, xOffset, zOffset),
  }
}
