import {
  BOTTLE_H,
  PLATFORM_GAP_MAX,
  PLATFORM_GAP_MIN,
  rand,
  randInt,
} from "./constants";
import { su, view } from "./view";
import type { Book, FurnitureKind, Platform, PlatformKind } from "./types";

const BOOK_COLORS = [
  { color: "#c45c4a", spine: "#8f3a2e" },
  { color: "#3d6ea8", spine: "#274a76" },
  { color: "#d4a24a", spine: "#9a7428" },
  { color: "#5a8f62", spine: "#3b6244" },
  { color: "#7a5ea8", spine: "#53407a" },
];

let nextId = 1;

function furnitureSize(kind: FurnitureKind): { w: number; h: number } {
  if (kind === "desk") return { w: rand(su(118), su(158)), h: rand(su(58), su(78)) };
  if (kind === "tv") return { w: rand(su(128), su(168)), h: rand(su(72), su(96)) };
  return { w: rand(su(96), su(132)), h: rand(su(88), su(128)) };
}

function makeBooks(px: number, py: number, w: number, count: number): Book[] {
  const bw = su(16);
  const bh = su(44);
  const gap = su(3);
  const totalW = count * bw + (count - 1) * gap;
  const start = px + (w - totalW) / 2 + bw / 2;
  const books: Book[] = [];
  for (let i = 0; i < count; i++) {
    const pal = BOOK_COLORS[i % BOOK_COLORS.length];
    books.push({
      x: start + i * (bw + gap),
      y: py - bh / 2,
      w: bw,
      h: bh,
      angle: rand(-0.04, 0.04),
      vx: 0,
      vy: 0,
      omega: 0,
      color: pal.color,
      spine: pal.spine,
      dynamic: false,
      grounded: false,
    });
  }
  return books;
}

export function makePlatform(
  kind: PlatformKind,
  x: number,
  prevY?: number,
): Platform {
  let w: number;
  let h: number;
  if (kind === "books") {
    w = rand(su(90), su(124));
    h = rand(su(52), su(70));
  } else if (kind === "car") {
    w = rand(su(108), su(140));
    h = rand(su(40), su(52));
  } else {
    const s = furnitureSize(kind);
    w = s.w;
    h = s.h;
  }

  let y = rand(view.surfaceMin, view.surfaceMax);
  if (prevY !== undefined) {
    y = prevY + rand(su(-70), su(70));
    y = Math.max(view.surfaceMin, Math.min(view.surfaceMax, y));
  }

  const isFurniture =
    kind === "desk" || kind === "tv" || kind === "cabinet";
  const hasSpring = isFurniture && Math.random() < 0.28;
  const bookCount = kind === "books" ? randInt(1, 5) : 0;

  return {
    id: nextId++,
    kind,
    x,
    y,
    w,
    h,
    scored: false,
    hasSpring,
    springX: w * rand(0.28, 0.72),
    books: kind === "books" ? makeBooks(x, y, w, bookCount) : [],
    booksIntact: kind === "books",
    carX: x + w * 0.5,
    carW: su(92),
    carH: su(36),
    carMoving: false,
    carTravel: 0,
  };
}

export function pickKind(index: number): PlatformKind {
  if (index === 0) return "desk";
  const roll = Math.random();
  if (roll < 0.42) {
    const f: FurnitureKind[] = ["desk", "tv", "cabinet"];
    return f[randInt(0, 2)];
  }
  if (roll < 0.66) return "books";
  if (roll < 0.84) return "car";
  const f: FurnitureKind[] = ["desk", "tv", "cabinet"];
  return f[randInt(0, 2)];
}

export function gapAfter(p: Platform): number {
  let gap = rand(su(PLATFORM_GAP_MIN), su(PLATFORM_GAP_MAX));
  if (p.hasSpring) gap += su(36);
  if (p.kind === "car") gap += su(28);
  return gap;
}

export function spawnInitial(): Platform[] {
  nextId = 1;
  const list: Platform[] = [];
  let x = su(70);
  let prevY = view.surfaceMax - su(20);
  for (let i = 0; i < 8; i++) {
    const p = makePlatform(pickKind(i), x, prevY);
    list.push(p);
    prevY = p.y;
    x = p.x + p.w + gapAfter(p);
  }
  return list;
}

export function ensureAhead(list: Platform[], cameraX: number) {
  while (list.length > 0) {
    const last = list[list.length - 1];
    if (last.x > cameraX + Math.max(1600, view.w * 2.2)) break;
    const p = makePlatform(
      pickKind(list.length),
      last.x + last.w + gapAfter(last),
      last.y,
    );
    list.push(p);
  }
  while (list.length > 6 && list[0].x + list[0].w < cameraX - su(420)) {
    const first = list[0];
    const booksStillInView = first.books.some((b) => b.x > cameraX - su(520));
    if (booksStillInView) break;
    list.shift();
  }
}

export function standBottleY(surfaceY: number) {
  return surfaceY - su(BOTTLE_H) / 2;
}
