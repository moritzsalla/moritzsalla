// One strip for a whole local day: the sun draws the shape while it is up,
// and once it sets the moon draws its own arc in the same language, dimmed
// to its illuminated fraction. No moon glyph and no stars — a bright night
// is simply a fainter mound than a bright day.

import { altitude as sunAltitude, utcOffsetHours, type Place } from "./daylight.ts";
import { altitude as moonAltitude, illumination } from "./moon.ts";
import type { Strip } from "./strip.ts";

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
  /** 0..1 per sample, dims the daylit part of the arc */
  cloud?: number[];
};

export const skyStrip = (
  date: Date,
  place: Place,
  samples: number,
  options: SkyOptions = {}
): Strip => {
  const offset = utcOffsetHours(date, place.timeZone);
  const lit = illumination(date);

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
      values.push(sun / 90);
      shade.push(options.cloud ? 1 - 0.8 * (options.cloud[i % options.cloud.length] ?? 0) : 1);
      continue;
    }

    const moon = moonAltitude(instant, place.latitude, place.longitude);
    values.push(lit >= NEW_MOON_FLOOR ? Math.max(0, moon / 90) : 0);
    shade.push(lit * MOON_CEILING);
  }

  return { values, shade };
};
