// One strip for a whole local day: the sun draws the shape while it is up,
// and once it sets the moon draws its own arc in the same language, dimmed
// to its illuminated fraction. No moon glyph and no stars — a bright night
// is simply a fainter mound than a bright day.

import { altitude as sunAltitude, utcOffsetHours, type Place } from "./daylight.ts";
import { altitude as moonAltitude, illumination } from "./moon.ts";
import type { Strip } from "./strip.ts";
import type { Character } from "./conditions.ts";

/** below this the moon gives no usable light, so it draws nothing at all */
const NEW_MOON_FLOOR = 0.08;

/**
 * Moonlight is some five orders of magnitude weaker than daylight. Matching
 * that literally would erase it, but letting a full moon reach the same shade
 * as noon flattens the day. Capping night here keeps a full moon at a middle
 * shade, so the hierarchy still reads at a glance.
 */
const MOON_CEILING = 0.55;

export type SkyOptions = {
  /** how the weather acts on the daylit arc; night is left alone */
  weather?: Character;
  /**
   * "absolute" measures the arc against a true overhead sun, so latitude and
   * season read as height — but at 52°N that caps the arc at two thirds of
   * the strip, and in winter at a sixth, leaving nothing for weather to act
   * on. "daily" scales each day to its own peak instead. Season still reads,
   * because it is the arc's *width* that tracks day length, which frees the
   * vertical axis for the sky.
   */
  normalise?: "absolute" | "daily";
};

/** deterministic per-column noise, so a given day always renders the same */
const jitter = (seed: number): number => {
  const x = Math.sin(seed * 127.1) * 43_758.545;
  return x - Math.floor(x);
};

export const skyStrip = (
  date: Date,
  place: Place,
  samples: number,
  options: SkyOptions = {}
): Strip => {
  const offset = utcOffsetHours(date, place.timeZone);
  const lit = illumination(date);

  const weather = options.weather;

  // the mean height of the daylit arc, which is what fully diffuse light
  // collapses onto: bright, but with nowhere in particular to point
  const daylit: number[] = [];
  for (let i = 0; i < samples; i++) {
    const sun = sunAltitude(date, place, (i / (samples - 1)) * 24 - offset);
    if (sun > 0) daylit.push(sun / 90);
  }

  const peak = daylit.length > 0 ? Math.max(...daylit) : 1;
  const scale = options.normalise === "daily" && peak > 0 ? 1 / peak : 1;

  const diffuseLevel =
    daylit.length > 0 ? (daylit.reduce((a, b) => a + b, 0) / daylit.length) * scale : 0;

  const values: number[] = [];
  const shade: number[] = [];

  for (let i = 0; i < samples; i++) {
    const localHour = (i / (samples - 1)) * 24;
    const utcHour = localHour - offset;
    const at = new Date(date.getTime());
    at.setUTCHours(0, 0, 0, 0);
    const instant = new Date(at.getTime() + utcHour * 3_600_000);

    const sun = sunAltitude(date, place, utcHour);

    if (sun > 0) {
      let height = (sun / 90) * scale;

      if (weather) {
        // thick low cloud pulls the arc toward a flat diffuse band
        height = height + (diffuseLevel - height) * weather.diffuse;
        // rain and wind chew at its edge
        height *= 1 - weather.agitate * 0.45 * jitter(i + 1);
      }

      values.push(Math.max(0, height));
      shade.push(weather ? 1 - weather.dim : 1);
      continue;
    }

    const moon = moonAltitude(instant, place.latitude, place.longitude);
    values.push(lit >= NEW_MOON_FLOOR ? Math.max(0, moon / 90) : 0);
    shade.push(lit * MOON_CEILING);
  }

  return { values, shade };
};
