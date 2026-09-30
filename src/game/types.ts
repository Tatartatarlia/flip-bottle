export type Phase =
  | "ready"
  | "charging"
  | "air"
  | "riding"
  | "over";

export type FurnitureKind = "desk" | "tv" | "cabinet";
export type PlatformKind = FurnitureKind | "books" | "car";

export type Vec = { x: number; y: number };

export type Book = {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  vx: number;
  vy: number;
  omega: number;
  color: string;
  spine: string;
  dynamic: boolean;
  grounded: boolean;
};

export type Platform = {
  id: number;
  kind: PlatformKind;
  x: number;
  y: number;
  w: number;
  h: number;
  scored: boolean;
  hasSpring: boolean;
  springX: number;
  books: Book[];
  booksIntact: boolean;
  carX: number;
  carW: number;
  carH: number;
  carMoving: boolean;
  carTravel: number;
};

export type Bottle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
};

export type GameSnapshot = {
  score: number;
  highScore: number;
  phase: Phase;
  charge: number;
};
