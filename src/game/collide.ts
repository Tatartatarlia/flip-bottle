import { BOTTLE_H, BOTTLE_W } from "./constants";
import type { Book, Bottle, Platform, Vec } from "./types";
import { su } from "./view";

function bottleWH() {
  return { w: su(BOTTLE_W), h: su(BOTTLE_H) };
}

export function bottleCorners(b: Bottle): Vec[] {
  const { w, h } = bottleWH();
  const hw = w / 2;
  const hh = h / 2;
  const c = Math.cos(b.angle);
  const s = Math.sin(b.angle);
  const pts: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  return pts.map(([px, py]) => ({
    x: b.x + px * c - py * s,
    y: b.y + px * s + py * c,
  }));
}

export function lowestPoint(pts: Vec[]): Vec {
  let m = pts[0];
  for (const p of pts) if (p.y > m.y) m = p;
  return m;
}

export function bottleBounds(b: Bottle) {
  const pts = bottleCorners(b);
  let minX = pts[0].x;
  let maxX = pts[0].x;
  let minY = pts[0].y;
  let maxY = pts[0].y;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY, pts };
}

export function bookCorners(book: Book): Vec[] {
  const hw = book.w / 2;
  const hh = book.h / 2;
  const c = Math.cos(book.angle);
  const s = Math.sin(book.angle);
  const pts: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  return pts.map(([px, py]) => ({
    x: book.x + px * c - py * s,
    y: book.y + px * s + py * c,
  }));
}

export function rotatedHalfHeight(w: number, h: number, angle: number) {
  return Math.abs(Math.cos(angle)) * (h / 2) + Math.abs(Math.sin(angle)) * (w / 2);
}

export function bookTop(book: Book) {
  return book.y - rotatedHalfHeight(book.w, book.h, book.angle);
}

export function bookBottom(book: Book) {
  return book.y + rotatedHalfHeight(book.w, book.h, book.angle);
}

export function pointInRotatedRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
) {
  const dx = px - cx;
  const dy = py - cy;
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

export function bottleHitsBook(b: Bottle, book: Book) {
  const pts = bottleCorners(b);
  for (const p of pts) {
    if (pointInRotatedRect(p.x, p.y, book.x, book.y, book.w, book.h, book.angle)) {
      return true;
    }
  }
  for (const p of bookCorners(book)) {
    if (pointInRotatedRect(p.x, p.y, b.x, b.y, su(BOTTLE_W), su(BOTTLE_H), b.angle)) {
      return true;
    }
  }
  return false;
}

export function overPlatformX(minX: number, maxX: number, p: Platform, pad = su(26)) {
  return maxX > p.x - pad && minX < p.x + p.w + pad;
}

export function platformTopHit(
  b: Bottle,
  p: Platform,
  prevLowY: number,
  pad = su(26),
) {
  const { minX, maxX, maxY } = bottleBounds(b);
  if (!overPlatformX(minX, maxX, p, pad)) return false;
  if (b.vy < su(-160)) return false;
  const near = maxY >= p.y - su(38) && maxY <= p.y + su(48);
  const crossed = prevLowY <= p.y + su(10) && maxY >= p.y - su(38);
  return near || crossed;
}

export function springHit(b: Bottle, p: Platform) {
  if (!p.hasSpring) return false;
  const sx = p.x + p.springX;
  const { maxY, pts } = bottleBounds(b);
  const low = lowestPoint(pts);
  return (
    Math.abs(low.x - sx) < su(26) &&
    maxY > p.y - su(40) &&
    maxY < p.y + su(28) &&
    b.vy > su(-80)
  );
}

export function carHit(b: Bottle, p: Platform) {
  if (p.kind !== "car") return false;
  const cx = p.carX - p.carW / 2;
  const top = p.y - p.carH;
  const { minX, maxX, maxY } = bottleBounds(b);
  return (
    maxX > cx - su(12) &&
    minX < cx + p.carW + su(12) &&
    maxY > top - su(28) &&
    maxY < p.y + su(22) &&
    b.vy > su(-120)
  );
}

export function landingOnBook(b: Bottle, book: Book, prevLowY: number) {
  const { minX, maxX, maxY } = bottleBounds(b);
  const halfW =
    Math.abs(Math.cos(book.angle)) * (book.w / 2) +
    Math.abs(Math.sin(book.angle)) * (book.h / 2);
  if (maxX < book.x - halfW - su(10) || minX > book.x + halfW + su(10)) return false;
  if (b.vy < su(-140)) return false;
  const top = bookTop(book);
  const near = maxY >= top - su(28) && maxY <= top + su(36);
  const crossed = prevLowY <= top + su(12) && maxY >= top - su(28);
  return near || crossed;
}
