import { BOTTLE_H, BOTTLE_W } from "./constants";
import type { Book, Bottle, Phase, Platform } from "./types";
import { su, view } from "./view";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawFloor(ctx: CanvasRenderingContext2D, camX: number) {
  const g = ctx.createLinearGradient(0, view.groundY - su(40), 0, view.h);
  g.addColorStop(0, "#d9c3a4");
  g.addColorStop(1, "#b8956a");
  ctx.fillStyle = g;
  ctx.fillRect(0, view.groundY, view.w, view.h - view.groundY);

  ctx.strokeStyle = "rgba(90, 60, 30, 0.18)";
  ctx.lineWidth = Math.max(1, su(2));
  const step = su(48);
  const start = Math.floor(camX / step) * step;
  for (let x = start; x < camX + view.w + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x - camX, view.groundY);
    ctx.lineTo(x - camX, view.h);
    ctx.stroke();
  }

  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(0, view.groundY - su(6), view.w, su(6));
}

function drawWall(ctx: CanvasRenderingContext2D, camX: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, view.groundY);
  bg.addColorStop(0, "#f3e4c8");
  bg.addColorStop(1, "#e8d2aa");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, view.w, view.groundY);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, view.w, Math.min(su(90), view.h * 0.14));

  const wx = su(180) - (camX * 0.25) % su(520);
  for (let i = -1; i < 5; i++) {
    const x = wx + i * su(520);
    roundRect(ctx, x, su(70), su(150), su(110), su(8));
    ctx.fillStyle = "#9fd4e8";
    ctx.fill();
    ctx.strokeStyle = "#f4eee4";
    ctx.lineWidth = su(10);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(1, su(2));
    ctx.beginPath();
    ctx.moveTo(x + su(75), su(70));
    ctx.lineTo(x + su(75), su(180));
    ctx.moveTo(x, su(125));
    ctx.lineTo(x + su(150), su(125));
    ctx.stroke();
  }
}

function drawDesk(ctx: CanvasRenderingContext2D, p: Platform) {
  ctx.fillStyle = "#8a5a32";
  roundRect(ctx, p.x, p.y, p.w, su(14), su(3));
  ctx.fill();
  ctx.fillStyle = "#6e4526";
  ctx.fillRect(p.x + su(10), p.y + su(14), su(10), p.h);
  ctx.fillRect(p.x + p.w - su(20), p.y + su(14), su(10), p.h);
  ctx.fillStyle = "#c48a52";
  roundRect(ctx, p.x - su(4), p.y - su(4), p.w + su(8), su(10), su(3));
  ctx.fill();
}

function drawTv(ctx: CanvasRenderingContext2D, p: Platform) {
  ctx.fillStyle = "#2b2f38";
  roundRect(ctx, p.x, p.y - su(8), p.w, su(52), su(6));
  ctx.fill();
  const screen = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + su(40));
  screen.addColorStop(0, "#3a6db5");
  screen.addColorStop(1, "#1d355e");
  ctx.fillStyle = screen;
  roundRect(ctx, p.x + su(8), p.y - su(2), p.w - su(16), su(36), su(3));
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.fillRect(p.x + p.w / 2 - su(8), p.y + su(44), su(16), su(10));
  ctx.fillStyle = "#444";
  ctx.fillRect(p.x + p.w / 2 - su(28), p.y + su(54), su(56), su(8));
}

function drawCabinet(ctx: CanvasRenderingContext2D, p: Platform) {
  ctx.fillStyle = "#7a4a2a";
  roundRect(ctx, p.x, p.y, p.w, p.h, su(4));
  ctx.fill();
  ctx.fillStyle = "#c08955";
  roundRect(ctx, p.x - su(3), p.y - su(6), p.w + su(6), su(10), su(3));
  ctx.fill();
  ctx.strokeStyle = "#5c371c";
  ctx.lineWidth = Math.max(1, su(2));
  ctx.beginPath();
  ctx.moveTo(p.x + p.w / 2, p.y + su(8));
  ctx.lineTo(p.x + p.w / 2, p.y + p.h - su(6));
  ctx.stroke();
  ctx.fillStyle = "#d4b07a";
  ctx.beginPath();
  ctx.arc(p.x + p.w / 2 - su(10), p.y + p.h * 0.45, su(4), 0, Math.PI * 2);
  ctx.arc(p.x + p.w / 2 + su(10), p.y + p.h * 0.45, su(4), 0, Math.PI * 2);
  ctx.fill();
}

function drawSpring(ctx: CanvasRenderingContext2D, p: Platform) {
  if (!p.hasSpring) return;
  const sx = p.x + p.springX;
  const sy = p.y;
  ctx.strokeStyle = "#6aa84f";
  ctx.lineWidth = Math.max(1, su(3));
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = sy - su(4) - i * su(5);
    ctx.moveTo(sx - su(10), y);
    ctx.quadraticCurveTo(sx, y - su(4), sx + su(10), y);
  }
  ctx.stroke();
  ctx.fillStyle = "#8fd36a";
  roundRect(ctx, sx - su(14), sy - su(36), su(28), su(8), su(3));
  ctx.fill();
}

function drawBook(ctx: CanvasRenderingContext2D, b: Book) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);
  ctx.fillStyle = b.color;
  roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, su(2));
  ctx.fill();
  ctx.fillStyle = b.spine;
  ctx.fillRect(-b.w / 2, -b.h / 2, Math.max(2, b.w * 0.22), b.h);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(-b.w / 2 + su(6), -b.h / 2 + su(6), b.w - su(10), su(3));
  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, p: Platform) {
  const x = p.carX - p.carW / 2;
  const y = p.y - p.carH;
  ctx.fillStyle = "#e25b4c";
  roundRect(ctx, x, y + su(10), p.carW, su(22), su(6));
  ctx.fill();
  ctx.fillStyle = "#f3c9c4";
  roundRect(ctx, x + su(18), y, su(42), su(16), su(6));
  ctx.fill();
  ctx.fillStyle = "#7ec8e3";
  roundRect(ctx, x + su(22), y + su(3), su(16), su(10), su(3));
  ctx.fill();
  roundRect(ctx, x + su(42), y + su(3), su(14), su(10), su(3));
  ctx.fill();
  ctx.fillStyle = "#2b2b2b";
  ctx.beginPath();
  ctx.arc(x + su(20), p.y - su(4), su(8), 0, Math.PI * 2);
  ctx.arc(x + p.carW - su(20), p.y - su(4), su(8), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#bbb";
  ctx.beginPath();
  ctx.arc(x + su(20), p.y - su(4), su(3), 0, Math.PI * 2);
  ctx.arc(x + p.carW - su(20), p.y - su(4), su(3), 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform) {
  if (p.kind === "desk") drawDesk(ctx, p);
  else if (p.kind === "tv") drawTv(ctx, p);
  else if (p.kind === "cabinet") drawCabinet(ctx, p);
  else if (p.kind === "books") {
    ctx.fillStyle = "#9a6b43";
    roundRect(ctx, p.x, p.y, p.w, su(12), su(3));
    ctx.fill();
    ctx.fillStyle = "#6e4a2c";
    ctx.fillRect(p.x + su(8), p.y + su(12), su(8), su(40));
    ctx.fillRect(p.x + p.w - su(16), p.y + su(12), su(8), su(40));
    for (const b of p.books) drawBook(ctx, b);
  } else if (p.kind === "car") {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    roundRect(ctx, p.x, p.y + su(8), p.w, su(10), su(4));
    ctx.fill();
    drawCar(ctx, p);
  }
  drawSpring(ctx, p);
}

export function drawBottle(ctx: CanvasRenderingContext2D, b: Bottle) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);

  const w = su(BOTTLE_W);
  const h = su(BOTTLE_H);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(su(3), h / 2 - su(2), w * 0.55, su(6), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(190, 230, 245, 0.55)";
  roundRect(ctx, -w / 2, -h / 2 + su(10), w, h - su(14), su(8));
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, su(2));
  ctx.stroke();

  ctx.fillStyle = "rgba(70, 170, 210, 0.55)";
  roundRect(ctx, -w / 2 + su(2), -su(4), w - su(4), h / 2 - su(4), su(6));
  ctx.fill();

  ctx.fillStyle = "#e85d4c";
  roundRect(ctx, -w / 2 + su(1), -su(8), w - su(2), su(16), su(4));
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `bold ${Math.max(8, Math.min(11, w * 0.38))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("H2O", 0, su(4));

  ctx.fillStyle = "rgba(210, 240, 250, 0.9)";
  roundRect(ctx, -su(7), -h / 2 + su(2), su(14), su(12), su(4));
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  roundRect(ctx, -su(8), -h / 2 - su(4), su(16), su(8), su(3));
  ctx.fill();

  ctx.restore();
}

function drawCharge(
  ctx: CanvasRenderingContext2D,
  b: Bottle,
  charge: number,
  phase: Phase,
) {
  if (phase !== "charging") return;
  const x = b.x - su(40);
  const y = b.y - su(BOTTLE_H) / 2 - su(28);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, x, y, su(80), su(10), su(5));
  ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + su(80), 0);
  g.addColorStop(0, "#7bed9f");
  g.addColorStop(0.6, "#eccc68");
  g.addColorStop(1, "#ff6b6b");
  ctx.fillStyle = g;
  roundRect(ctx, x + su(1), y + su(1), su(78) * charge, su(8), su(4));
  ctx.fill();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  bottle: Bottle,
  camX: number,
  charge: number,
  phase: Phase,
  score: number,
) {
  ctx.clearRect(0, 0, view.w, view.h);
  drawWall(ctx, camX);
  drawFloor(ctx, camX);

  ctx.save();
  ctx.translate(-camX, 0);
  for (const p of platforms) {
    if (p.x + p.w < camX - su(40) || p.x > camX + view.w + su(40)) continue;
    drawPlatform(ctx, p);
  }
  drawBottle(ctx, bottle);
  drawCharge(ctx, bottle, charge, phase);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  const scoreSize = Math.min(64, view.h * 0.11, view.w * 0.08);
  ctx.font = `${scoreSize}px Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(String(score), view.w / 2, view.h * 0.22);
}

export function exitBtn() {
  return {
    x: view.w - view.padSide - 100,
    y: view.padTop,
    w: 100,
    h: 30,
  };
}

export function retryBtn() {
  const ch = 188;
  const cy = (view.h - ch) / 2;
  return {
    x: view.w / 2 - 60,
    y: cy + 128,
    w: 120,
    h: 36,
  };
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  text: string,
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#fff8ee";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  phase: Phase,
  overReason: "fail" | "exit" | null,
) {
  pill(
    ctx,
    view.padSide,
    view.padTop,
    108,
    30,
    "rgba(20,14,24,0.62)",
    `最高分 ${highScore}`,
  );
  if (phase !== "over") {
    const b = exitBtn();
    pill(ctx, b.x, b.y, b.w, b.h, "#e25b4c", "退出结算");
  }

  if (phase === "ready") {
    const hintW = Math.min(340, view.w - 24);
    const hintY = view.h - Math.max(view.padBottom, 20) - 14;
    ctx.fillStyle = "rgba(255,248,235,0.78)";
    roundRect(ctx, (view.w - hintW) / 2, hintY - 12, hintW, 24, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(40,24,16,0.78)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      view.w < 640 ? "按住蓄力，松手翻转" : "按住蓄力，松手翻转 · 正着或横着落在平台上均可",
      view.w / 2,
      hintY,
    );
  }

  if (phase === "over") {
    ctx.fillStyle = "rgba(18,12,20,0.55)";
    ctx.fillRect(0, 0, view.w, view.h);
    const cw = Math.min(300, view.w - 32);
    const ch = 188;
    const cx = (view.w - cw) / 2;
    const cy = (view.h - ch) / 2;
    ctx.fillStyle = "#fff8ee";
    roundRect(ctx, cx, cy, cw, ch, 14);
    ctx.fill();
    ctx.fillStyle = "#2b2118";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(overReason === "exit" ? "本局结算" : "水瓶落地了", view.w / 2, cy + 44);
    ctx.font = "14px sans-serif";
    ctx.fillText(`本局得分：${score}`, view.w / 2, cy + 76);
    ctx.fillText(`历史最高：${highScore}`, view.w / 2, cy + 98);
    const rb = retryBtn();
    ctx.fillStyle = "#2ecc71";
    roundRect(ctx, rb.x, rb.y, rb.w, rb.h, rb.h / 2);
    ctx.fill();
    ctx.fillStyle = "#123018";
    ctx.font = "bold 14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("再来一局", rb.x + rb.w / 2, rb.y + rb.h / 2 + 1);
  }
}

export function hitRect(
  px: number,
  py: number,
  r: { x: number; y: number; w: number; h: number },
) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
