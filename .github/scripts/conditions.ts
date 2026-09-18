// WMO weather codes, as Open-Meteo reports them, reduced to what the strip
// can actually express. Nothing here draws a symbol: weather acts on the
// arc itself, because that is what it does in life. A clear day has a hard
// directional peak; under thick low cloud the light goes diffuse and the
// peak flattens out; rain and wind break up its edge.

export type Condition =
  | "clear"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "snow"
  | "storm";

export type Character = {
  /** 0..1 pull of the arc toward flat, diffuse light with no peak */
  diffuse: number;
  /** 0..1 break-up of the arc's edge */
  agitate: number;
  /** 0..1 loss of overall brightness */
  dim: number;
};

/** the floor a condition imposes, before live cloud and rain figures raise it */
const CHARACTER: Record<Condition, Character> = {
  clear: { diffuse: 0.0, agitate: 0.0, dim: 0.0 },
  cloudy: { diffuse: 0.25, agitate: 0.05, dim: 0.15 },
  overcast: { diffuse: 0.85, agitate: 0.1, dim: 0.45 },
  fog: { diffuse: 1.0, agitate: 0.15, dim: 0.55 },
  drizzle: { diffuse: 0.8, agitate: 0.35, dim: 0.45 },
  rain: { diffuse: 0.9, agitate: 0.6, dim: 0.55 },
  showers: { diffuse: 0.55, agitate: 0.75, dim: 0.4 },
  snow: { diffuse: 0.95, agitate: 0.5, dim: 0.3 },
  storm: { diffuse: 0.9, agitate: 1.0, dim: 0.65 },
};

export const conditionOf = (wmoCode: number): Condition => {
  if (wmoCode === 0) return "clear";
  if (wmoCode <= 2) return "cloudy";
  if (wmoCode === 3) return "overcast";
  if (wmoCode <= 48) return "fog";
  if (wmoCode <= 57) return "drizzle";
  if (wmoCode <= 67) return "rain";
  if (wmoCode <= 77) return "snow";
  if (wmoCode <= 82) return "showers";
  if (wmoCode <= 86) return "snow";
  return "storm";
};

export const characterOf = (condition: Condition): Character => CHARACTER[condition];

/**
 * Cloud height matters as much as cloud amount. Cirrus thins the light
 * without killing the shadow; stratus sitting on the city does.
 */
export const layeredDiffusion = (low: number, mid: number, high: number): number =>
  Math.min(1, low * 0.9 + mid * 0.5 + high * 0.2);

export const layeredDimming = (low: number, mid: number, high: number): number =>
  Math.min(1, low * 0.65 + mid * 0.4 + high * 0.15);
