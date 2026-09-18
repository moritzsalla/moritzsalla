// Different mark languages for the same data. The geometry is settled — a
// column is a height, weather bends it — so what is left is the alphabet,
// and that choice changes the piece more than anything upstream of it.

export type Palette = {
  name: string;
  note: string;
  render: (values: number[], shade: number[], width: number, height: number) => string;
};

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** how full cell `row` is, given a column height in rows measured from the bottom */
const cellFill = (value: number, row: number, height: number): number =>
  clamp(clamp(value, 0, 1) * height - (height - 1 - row), 0, 1);

const ramp =
  (chars: string) =>
  (level: number): string =>
    chars[clamp(Math.round(level * (chars.length - 1)), 0, chars.length - 1)];

/** a palette that just maps (fill x shade) onto a ramp of characters */
const rampPalette = (name: string, note: string, chars: string, floor = true): Palette => ({
  name,
  note,
  render: (values, shade, width, height) => {
    const pick = ramp(chars);
    const rows: string[] = [];

    for (let row = 0; row < height; row++) {
      let line = "";
      for (let x = 0; x < width; x++) {
        const fill = cellFill(values[x], row, height);
        const weight = fill * clamp(shade[x], 0, 1);
        line += fill > 0 && floor ? pick(Math.max(1 / (chars.length - 1), weight)) : pick(weight);
      }
      rows.push(line);
    }
    return rows.join("\n");
  },
});

export const SHADE = rampPalette(
  "shade",
  "Block density. Soft and atmospheric; everything blends into everything.",
  " ░▒▓█"
);

export const ASCII = rampPalette(
  "ascii",
  "The classic terminal ramp. No Unicode at all, so it renders identically everywhere.",
  " .:-=+*#%@"
);

export const STIPPLE = rampPalette(
  "stipple",
  "Sparse dot matrix. Mostly negative space, closer to print halftone than to a chart.",
  " ·∙•◦○◍●"
);

/** vertical eighth blocks: eight sub-levels inside every cell */
export const COLUMN: Palette = {
  name: "column",
  note: "Vertical eighth-blocks. Three rows become twenty-four levels, so the curve is genuinely smooth rather than stepped.",
  render: (values, shade, width, height) => {
    const EIGHTHS = " ▁▂▃▄▅▆▇█";
    const rows: string[] = [];

    for (let row = 0; row < height; row++) {
      let line = "";
      for (let x = 0; x < width; x++) {
        const fill = cellFill(values[x], row, height) * clamp(shade[x], 0, 1);
        line += EIGHTHS[clamp(Math.round(fill * 8), 0, 8)];
      }
      rows.push(line);
    }
    return rows.join("\n");
  },
};

/** braille cells are 2 wide and 4 tall, the densest grid in plain text */
export const BRAILLE: Palette = {
  name: "braille",
  note: "Braille dots. Two by four per cell, so the strip carries 128x12 points — engraved rather than painted.",
  render: (values, shade, width, height) => {
    const DOT_BIT = [
      [0, 1, 2, 6],
      [3, 4, 5, 7],
    ];
    const rows: string[] = [];

    for (let row = 0; row < height; row++) {
      let line = "";
      for (let x = 0; x < width; x++) {
        let bits = 0;
        for (let sub = 0; sub < 2; sub++) {
          // sample between this column and the next, for the half-step
          const a = values[x];
          const b = values[Math.min(width - 1, x + 1)];
          const value = a + (b - a) * (sub / 2);
          const fill = cellFill(value, row, height) * clamp(shade[x], 0, 1);
          const dots = Math.round(fill * 4);
          for (let d = 0; d < dots; d++) bits |= 1 << DOT_BIT[sub][3 - d];
        }
        line += String.fromCharCode(0x2800 + bits);
      }
      rows.push(line);
    }
    return rows.join("\n");
  },
};

/** only the boundary, drawn as a line */
export const CONTOUR: Palette = {
  name: "contour",
  note: "Outline only. The arc as a drawn line over empty space, nearer to a plot than to a texture.",
  render: (values, shade, width, height) => {
    const grid: string[][] = Array.from({ length: height }, () => new Array(width).fill(" "));

    const rowOf = (x: number): number =>
      height - 1 - Math.min(height - 1, Math.floor(clamp(values[x], 0, 1) * height));

    for (let x = 0; x < width; x++) {
      if (clamp(values[x], 0, 1) <= 0.001) continue;

      const here = rowOf(x);
      const prev = x > 0 && values[x - 1] > 0.001 ? rowOf(x - 1) : here;
      const next = x < width - 1 && values[x + 1] > 0.001 ? rowOf(x + 1) : here;

      const faint = clamp(shade[x], 0, 1) < 0.5;
      grid[here][x] =
        prev === here && next === here
          ? faint
            ? "┄"
            : "─"
          : prev > here
            ? "╭"
            : next > here
              ? "╮"
              : faint
                ? "┄"
                : "─";

      // draw the riser so the line stays connected across a step
      for (let r = Math.min(here, prev) + 1; r < Math.max(here, prev); r++) grid[r][x] = "│";
    }
    return grid.map((r) => r.join("")).join("\n");
  },
};

export const PALETTES: Palette[] = [SHADE, COLUMN, BRAILLE, ASCII, STIPPLE, CONTOUR];
