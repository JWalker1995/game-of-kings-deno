import * as Honeycomb from 'honeycomb-grid';

export interface Cell {
  neighborIndices: number[];

  q: number;
  r: number;
  s: number;

  x: number;
  y: number;
}

export type Board = Cell[];

export type BoardVariant = { radius: number };

export const Hex = Honeycomb.defineHex({
  // size: 1,
  orientation: Honeycomb.Orientation.POINTY,
});

const makeBoard = (variant: BoardVariant): Board => {
  const grid = new Honeycomb.Grid(
    Hex,
    Honeycomb.spiral({ radius: variant.radius }),
  );
  const arr = grid.toArray();
  return arr.map((hex): Cell => ({
    neighborIndices: [
      Honeycomb.Direction.NE,
      Honeycomb.Direction.E,
      Honeycomb.Direction.SE,
      Honeycomb.Direction.SW,
      Honeycomb.Direction.W,
      Honeycomb.Direction.NW,
    ]
      .map((dir) => grid.neighborOf(hex, dir, { allowOutside: false }))
      .map((n) => n ? arr.indexOf(n) : -1),

    q: hex.q,
    r: hex.r,
    s: hex.s,

    x: hex.x,
    y: hex.y,
  }));
};

const boardCache = new WeakMap<BoardVariant, Board>();
export const getBoard = (variant: BoardVariant): Board =>
  boardCache.get(variant) ||
  (() => {
    const board = makeBoard(variant);
    boardCache.set(variant, board);
    return board;
  })();
