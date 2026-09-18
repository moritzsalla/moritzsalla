// A strip chart that reads as texture.
//
// The original renderer thresholded noise per cell, so every input came out
// as mush. This one keeps the shape: a column's value is a height, and the
// partial cell at the top of that height is drawn with a lighter shade, so
// the curve gets antialiased instead of stepped.

const SHADES = [" ", "░", "▒", "▓", "█"] as const;

export type Strip = {
  /** one value per sample, 0..1; drawn as a column height */
  values: number[];
  /** optional second series, 0..1, dithered into the space above the fill */
  overlay?: number[];
  /** optional 0..1 multiplier on the glyph ramp inside the fill, so a second
   *  variable can darken or lighten the band instead of competing for space */
  shade?: number[];
};

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** linear resample of an arbitrary-length series onto `width` columns */
export const resample = (values: number[], width: number): number[] => {
  if (values.length === 0) return new Array(width).fill(0);
  if (values.length === 1) return new Array(width).fill(values[0]);

  return Array.from({ length: width }, (_, x) => {
    const pos = (x / (width - 1)) * (values.length - 1);
    const i = Math.floor(pos);
    const frac = pos - i;
    const a = values[i];
    const b = values[Math.min(values.length - 1, i + 1)];
    return a + (b - a) * frac;
  });
};

export const renderStrip = (strip: Strip, width: number, height: number): string => {
  const values = resample(strip.values, width);
  const overlay = strip.overlay ? resample(strip.overlay, width) : undefined;
  const shade = strip.shade ? resample(strip.shade, width) : undefined;

  const grid: string[][] = Array.from({ length: height }, () => new Array(width).fill(" "));

  for (let x = 0; x < width; x++) {
    const filled = clamp(values[x], 0, 1) * height;

    for (let row = 0; row < height; row++) {
      const fromBottom = height - 1 - row;
      const fill = clamp(filled - fromBottom, 0, 1);

      if (fill > 0) {
        // the topmost partial cell lands on a lighter shade, which is what
        // keeps a 3-row curve from looking like a bar chart
        const weight = shade ? fill * clamp(shade[x], 0, 1) : fill;
        grid[row][x] = SHADES[Math.max(1, Math.round(weight * 4))];
      } else if (overlay) {
        const o = clamp(overlay[x], 0, 1);
        // dithered so it reads as fall rather than a solid block
        if (o > 0.05 && (x + row) % 2 === 0) {
          grid[row][x] = SHADES[Math.max(1, Math.round(o * 2))];
        }
      }
    }
  }

  return grid.map((row) => row.join("")).join("\n");
};
