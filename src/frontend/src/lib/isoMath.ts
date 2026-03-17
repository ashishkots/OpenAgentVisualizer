interface IsoOptions {
  tileW: number;
  tileH: number;
  originX: number;
  originY: number;
}

export function worldToScreen(wx: number, wy: number, opts: IsoOptions): { x: number; y: number } {
  return {
    x: opts.originX + (wx - wy) * (opts.tileW / 2),
    y: opts.originY + (wx + wy) * (opts.tileH / 2),
  };
}

export function screenToWorld(sx: number, sy: number, opts: IsoOptions): { x: number; y: number } {
  const dx = sx - opts.originX;
  const dy = sy - opts.originY;
  return {
    x: (dx / (opts.tileW / 2) + dy / (opts.tileH / 2)) / 2,
    y: (dy / (opts.tileH / 2) - dx / (opts.tileW / 2)) / 2,
  };
}
