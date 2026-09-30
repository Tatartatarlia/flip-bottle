import {
  AIR_DRAG,
  BOTTLE_H,
  BOTTLE_W,
  CHARGE_MAX_MS,
  GRAVITY,
  HIGH_SCORE_KEY,
  MAX_OMEGA,
  MAX_VX,
  MAX_VY,
  MIN_OMEGA,
  MIN_VX,
  MIN_VY,
  SPIN_DRAG,
  clamp,
  distToSide,
  distToUpright,
  lerp,
  wrapAngle,
} from "./constants";
import {
  bookBottom,
  bookTop,
  bottleHitsBook,
  bottleBounds,
  carHit,
  landingOnBook,
  platformTopHit,
  springHit,
} from "./collide";
import { drawHud, drawWorld, exitBtn, hitRect, retryBtn } from "./draw";
import type { Book, Bottle, GameSnapshot, Phase, Platform } from "./types";
import { layoutView, su, view, viewportCssSize } from "./view";
import { ensureAhead, spawnInitial, standBottleY } from "./world";

export type EngineHooks = {
  onChange: (snap: GameSnapshot) => void;
};

function loadHigh(): number {
  const n = Number(localStorage.getItem(HIGH_SCORE_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
}

function saveHigh(n: number) {
  localStorage.setItem(HIGH_SCORE_KEY, String(n));
}

export class FlipEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hooks: EngineHooks;
  private raf = 0;
  private last = 0;
  private platforms: Platform[] = [];
  private bottle: Bottle = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, omega: 0 };
  private phase: Phase = "ready";
  private charge = 0;
  private chargeStart = 0;
  private score = 0;
  private highScore = 0;
  private camX = 0;
  private restPlatform: Platform | null = null;
  private restBook: Book | null = null;
  private prevLowY = 0;
  private overReason: "fail" | "exit" | null = null;
  private pointerDown = false;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D 不可用");
    this.ctx = ctx;
    this.hooks = hooks;
    this.highScore = loadHigh();
    this.resize();
    this.reset(false);
    this.bind();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    this.emit();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("pointerup", this.onUp);
  }

  getOverReason() {
    return this.overReason;
  }

  exitSettle() {
    if (this.phase === "over") return;
    this.finish("exit");
  }

  restart() {
    this.reset(true);
  }

  private bind() {
    this.onResize = this.onResize.bind(this);
    this.onDown = this.onDown.bind(this);
    this.onUp = this.onUp.bind(this);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
    window.visualViewport?.addEventListener("resize", this.onResize);
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    window.addEventListener("pointerup", this.onUp);
  }

  private onResize = () => this.resize();

  private resize() {
    const { w, h } = viewportCssSize();
    layoutView(w, h);
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = bw;
    this.canvas.height = bh;
    this.ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    if (this.phase === "ready" && this.restPlatform) {
      this.bottle.y = this.restY();
    }
  }

  private reset(emit: boolean) {
    this.platforms = spawnInitial();
    const start = this.platforms[0];
    this.bottle = {
      x: start.x + start.w * 0.35,
      y: standBottleY(start.y),
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
    };
    this.phase = "ready";
    this.charge = 0;
    this.score = 0;
    this.camX = this.bottle.x - Math.min(220, view.w * 0.28);
    this.restPlatform = start;
    this.restBook = null;
    this.prevLowY = this.bottle.y + su(BOTTLE_H) / 2;
    start.scored = true;
    this.overReason = null;
    this.pointerDown = false;
    if (emit) this.emit();
  }

  private emit() {
    this.hooks.onChange({
      score: this.score,
      highScore: this.highScore,
      phase: this.phase,
      charge: this.charge,
    });
  }

  private finish(reason: "fail" | "exit") {
    this.phase = "over";
    this.overReason = reason;
    this.pointerDown = false;
    this.charge = 0;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHigh(this.highScore);
    }
    this.emit();
  }

  private canvasPoint(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * view.w,
      y: ((e.clientY - r.top) / r.height) * view.h,
    };
  }

  private onDown = (e: PointerEvent) => {
    e.preventDefault();
    const p = this.canvasPoint(e);
    if (this.phase === "over") {
      if (hitRect(p.x, p.y, retryBtn())) this.reset(true);
      return;
    }
    if (hitRect(p.x, p.y, exitBtn())) {
      this.finish("exit");
      return;
    }
    if (this.phase !== "ready") return;
    this.pointerDown = true;
    this.phase = "charging";
    this.chargeStart = performance.now();
    this.charge = 0;
    this.emit();
  };

  private onUp = () => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    if (this.phase !== "charging") return;
    this.launch();
  };

  private launch() {
    const t = clamp(this.charge, 0.12, 1);
    this.bottle.vx = lerp(su(MIN_VX), su(MAX_VX), t);
    this.bottle.vy = lerp(su(MIN_VY), su(MAX_VY), t);
    this.bottle.omega = lerp(MIN_OMEGA, MAX_OMEGA, t);
    this.phase = "air";
    this.restPlatform = null;
    this.restBook = null;
    this.charge = 0;
    this.emit();
  }

  private loop(now: number) {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.update(dt, now);
    this.camX = lerp(this.camX, this.bottle.x - Math.min(su(220), view.w * 0.28), 0.12);
    ensureAhead(this.platforms, this.camX);
    drawWorld(
      this.ctx,
      this.platforms,
      this.bottle,
      this.camX,
      this.charge,
      this.phase,
      this.score,
    );
    drawHud(this.ctx, this.score, this.highScore, this.phase, this.overReason);
    this.raf = requestAnimationFrame(this.loop);
  }

  private update(dt: number, now: number) {
    if (this.phase === "charging" || (this.phase === "ready" && this.restBook)) {
      if (this.phase === "charging") {
        this.charge = clamp((now - this.chargeStart) / CHARGE_MAX_MS, 0, 1);
        this.bottle.angle = Math.sin(now / 90) * 0.04 * this.charge;
      }
      this.bottle.y = this.restY();
    }

    this.updateBooks(dt);

    if (this.phase === "riding") {
      this.updateRide(dt);
      return;
    }

    if (this.phase === "air") {
      this.integrateBottle(dt);
      this.resolveAir();
    }
  }

  private integrateBottle(dt: number) {
    this.prevLowY = bottleBounds(this.bottle).maxY;
    this.bottle.vy += su(GRAVITY) * dt;
    this.bottle.vx *= 1 - AIR_DRAG * dt;
    this.bottle.omega *= 1 - SPIN_DRAG * dt;
    this.bottle.x += this.bottle.vx * dt;
    this.bottle.y += this.bottle.vy * dt;
    this.bottle.angle += this.bottle.omega * dt;
  }

  private updateBooks(dt: number) {
    for (const p of this.platforms) {
      if (p.kind !== "books") continue;
      for (const b of p.books) {
        if (!b.dynamic) continue;
        b.vy += su(GRAVITY) * dt;
        b.omega *= 1 - 0.55 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += b.omega * dt;

        const bottom = bookBottom(b);
        const onTable =
          bottom >= p.y - su(2) &&
          b.x > p.x - su(16) &&
          b.x < p.x + p.w + su(16) &&
          !b.grounded;

        if (onTable) {
          b.y -= bottom - p.y;
          b.vy = 0;
          b.vx *= 0.88;
          b.omega *= 0.72;
          if (Math.abs(b.vx) < 18 && Math.abs(b.omega) < 1.4) {
            b.vx = 0;
            b.omega = 0;
          }
        }

        const groundHit = bookBottom(b);
        if (groundHit >= view.groundY) {
          b.y -= groundHit - view.groundY;
          b.vy = 0;
          b.vx *= 0.82;
          b.omega *= 0.55;
          b.grounded = true;
          const side = Math.round(b.angle / (Math.PI / 2));
          const target = side * (Math.PI / 2);
          b.angle += (target - b.angle) * 0.35;
          if (Math.abs(b.vx) < 12 && Math.abs(b.omega) < 0.8) {
            b.vx = 0;
            b.omega = 0;
            b.angle = target;
          }
        }
      }
    }
  }

  private updateRide(dt: number) {
    const p = this.restPlatform;
    if (!p || p.kind !== "car") {
      this.phase = "ready";
      return;
    }
    const speed = su(260);
    p.carX += speed * dt;
    p.carTravel += speed * dt;
    this.bottle.x = p.carX;
    this.bottle.y = p.y - p.carH - su(BOTTLE_H) / 2 + su(6);
    this.bottle.vx = speed;
    this.bottle.vy = 0;
    this.bottle.angle *= 0.8;
    if (p.carTravel > su(240)) {
      p.carMoving = false;
      this.phase = "ready";
      this.bottle.vx = 0;
      this.snapRest(p.y - p.carH + su(6));
      this.emit();
    }
  }

  private restSurface(): number {
    if (this.restBook) return bookTop(this.restBook);
    const p = this.restPlatform;
    if (!p) return this.bottle.y + su(BOTTLE_H) / 2;
    if (p.kind === "car") return p.y - p.carH + su(6);
    if (p.kind === "books" && p.booksIntact && p.books.length) {
      return Math.min(...p.books.map((b) => bookTop(b)));
    }
    return p.y;
  }

  private restY() {
    const surface = this.restSurface();
    const side = distToSide(this.bottle.angle) < distToUpright(this.bottle.angle);
    return side ? surface - su(BOTTLE_W) / 2 : surface - su(BOTTLE_H) / 2;
  }

  private snapRest(surfaceY: number) {
    const up = distToUpright(this.bottle.angle);
    const side = distToSide(this.bottle.angle);
    if (up <= side) {
      this.bottle.angle = Math.abs(wrapAngle(this.bottle.angle)) > Math.PI / 2 ? Math.PI : 0;
      this.bottle.y = surfaceY - su(BOTTLE_H) / 2;
    } else {
      this.bottle.angle = wrapAngle(this.bottle.angle) > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.bottle.y = surfaceY - su(BOTTLE_W) / 2;
    }
    this.bottle.vx = 0;
    this.bottle.vy = 0;
    this.bottle.omega = 0;
  }

  private landOn(surfaceY: number, p: Platform, book: Book | null) {
    this.snapRest(surfaceY);
    this.phase = "ready";
    this.restPlatform = p;
    this.restBook = book;
    this.markScore(p);
  }

  private markScore(p: Platform) {
    if (p.scored) return;
    p.scored = true;
    this.score += 1;
    this.emit();
  }

  private toppleBooks(p: Platform, hitX: number) {
    p.booksIntact = false;
    const dir = this.bottle.vx >= 0 ? 1 : -1;
    p.books.forEach((b, i) => {
      b.dynamic = true;
      const off = (b.x - hitX) / su(18);
      b.omega = dir * (2.2 + i * 1.1) + off * 2.4;
      b.vx = this.bottle.vx * (0.55 + i * 0.06) + dir * (su(18) + Math.abs(off) * su(22));
      b.vy = su(12) + Math.abs(off) * su(18);
    });
  }

  private tryLandOnBooks(): boolean {
    for (const p of this.platforms) {
      if (p.kind !== "books") continue;
      for (const book of p.books) {
        if (!landingOnBook(this.bottle, book, this.prevLowY)) continue;
        const top = bookTop(book);
        const slowEnough =
          Math.abs(this.bottle.vx) < su(90) &&
          this.bottle.vy > su(-40) &&
          Math.abs(this.bottle.omega) < 8;
        if (slowEnough || book.grounded) {
          this.landOn(top, p, book);
          return true;
        }
        const { maxY } = bottleBounds(this.bottle);
        this.bottle.y -= maxY - top;
        this.bottle.vy *= 0.88;
        this.bottle.vx *= 0.985;
        this.bottle.omega *= 0.96;
        if (!book.dynamic) this.toppleBooks(p, this.bottle.x);
        return true;
      }
    }
    return false;
  }

  private knockBooks() {
    for (const p of this.platforms) {
      if (p.kind !== "books") continue;
      for (const book of p.books) {
        if (!bottleHitsBook(this.bottle, book)) continue;
        const stackCenter =
          p.books.reduce((s, b) => s + b.x, 0) / Math.max(1, p.books.length);
        const upright = distToUpright(this.bottle.angle) < 0.55;
        const side = distToSide(this.bottle.angle) < 0.5;
        const dx = this.bottle.x - stackCenter;
        const stable =
          p.booksIntact &&
          Math.abs(dx) < su(14) + p.books.length * su(2.5) &&
          (upright || side) &&
          this.bottle.vy >= su(-20) &&
          Math.abs(this.bottle.omega) < 10;

        if (stable) {
          this.landOn(Math.min(...p.books.map((b) => bookTop(b))), p, null);
          return true;
        }

        if (p.booksIntact) this.toppleBooks(p, this.bottle.x);
        this.bottle.vx *= 0.985;
        if (this.bottle.vy < 0) this.bottle.vy *= 0.75;
        this.bottle.omega *= 0.97;
        this.bottle.x += su(4);
        book.vx += this.bottle.vx * 0.2;
        book.vy += su(16);
        book.omega += 1.6;
      }
    }
    return false;
  }

  private resolveAir() {
    if (this.tryLandOnBooks()) return;
    if (this.knockBooks()) return;

    for (const p of this.platforms) {
      if (springHit(this.bottle, p)) {
        this.bottle.vy = su(-520);
        this.bottle.vx += su(240);
        this.bottle.omega += 5.5;
        this.bottle.y = p.y - su(40);
        this.restBook = null;
        return;
      }

      if (carHit(this.bottle, p)) {
        this.restBook = null;
        this.snapRest(p.y - p.carH + su(6));
        this.bottle.x = p.carX;
        this.phase = "riding";
        p.carMoving = true;
        p.carTravel = 0;
        this.restPlatform = p;
        this.markScore(p);
        return;
      }

      if (p.kind === "books") {
        const blocking = p.booksIntact || p.books.some((b) => !b.grounded && b.x > p.x - su(8) && b.x < p.x + p.w + su(8));
        if (blocking) continue;
      }
      if (p.kind !== "car" && platformTopHit(this.bottle, p, this.prevLowY)) {
        this.restBook = null;
        this.landOn(p.y, p, null);
        return;
      }
    }

    const { maxY } = bottleBounds(this.bottle);
    if (maxY >= view.groundY - su(4)) {
      for (const p of this.platforms) {
        if (p.kind !== "books") continue;
        for (const book of p.books) {
          if (landingOnBook(this.bottle, book, this.prevLowY) || bottleHitsBook(this.bottle, book)) {
            this.landOn(bookTop(book), p, book);
            return;
          }
        }
      }
      this.bottle.y += view.groundY - 1 - maxY;
      this.finish("fail");
    }
  }
}
