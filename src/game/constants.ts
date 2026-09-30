export const GRAVITY = 1950;
export const AIR_DRAG = 0.08;
export const SPIN_DRAG = 0.35;

export const BOTTLE_W = 24;
export const BOTTLE_H = 68;

export const CHARGE_MAX_MS = 1100;
export const MIN_VX = 210;
export const MAX_VX = 620;
export const MIN_VY = -430;
export const MAX_VY = -780;
export const MIN_OMEGA = 7.2;
export const MAX_OMEGA = 18.5;

export const PLATFORM_GAP_MIN = 118;
export const PLATFORM_GAP_MAX = 248;

export const HIGH_SCORE_KEY = "flip-bottle-highscore";

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function rand(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

export function randInt(lo: number, hi: number) {
  return Math.floor(rand(lo, hi + 1));
}

export function wrapAngle(a: number) {
  let x = a % (Math.PI * 2);
  if (x > Math.PI) x -= Math.PI * 2;
  if (x < -Math.PI) x += Math.PI * 2;
  return x;
}

export function distToUpright(angle: number) {
  const a = wrapAngle(angle);
  return Math.min(Math.abs(a), Math.abs(wrapAngle(a - Math.PI)));
}

export function distToSide(angle: number) {
  const a = wrapAngle(angle);
  return Math.min(
    Math.abs(wrapAngle(a - Math.PI / 2)),
    Math.abs(wrapAngle(a + Math.PI / 2)),
  );
}
