export const DESIGN_W = 960;
export const DESIGN_H = 540;

export const view = {
  w: DESIGN_W,
  h: DESIGN_H,
  u: 1,
  scale: 1,
  groundY: 508,
  surfaceMin: 268,
  surfaceMax: 428,
  padTop: 16,
  padSide: 16,
  padBottom: 16,
};

export function su(n: number) {
  return n * view.u;
}

export function layoutView(cssW: number, cssH: number) {
  view.w = cssW;
  view.h = cssH;
  const landscape = cssW / Math.max(1, cssH) >= 1.05;
  view.u = landscape ? cssH / DESIGN_H : cssW / 560;
  view.scale = view.u;

  view.groundY = cssH - Math.max(su(28), cssH * 0.06);
  const floor = view.groundY;
  view.surfaceMin = floor - Math.min(su(280), floor * 0.52);
  view.surfaceMax = floor - Math.min(su(78), floor * 0.16);

  const narrow = cssW < 700;
  view.padTop = su(narrow ? 28 : 16);
  view.padSide = su(narrow ? 14 : 16);
  view.padBottom = su(narrow ? 36 : 16);
}

export function viewportCssSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? window.innerHeight)),
  };
}
