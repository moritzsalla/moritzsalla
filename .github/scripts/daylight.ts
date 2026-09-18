// Solar position, computed rather than fetched: no API, no key, no network,
// and nothing leaves the runner except an approximate latitude.

const DEG = Math.PI / 180;

export type Place = {
  latitude: number;
  longitude: number;
  label: string;
  /** IANA zone, so the strip runs on local clock time and handles DST */
  timeZone: string;
};

/** UTC offset in hours for a zone on a given date, DST included */
export const utcOffsetHours = (date: Date, timeZone: string): number => {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? "");
  if (!match) return 0;

  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60);
};

export const dayOfYear = (date: Date): number => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
};

/** solar declination, standard cosine approximation (±0.5°) */
export const declination = (date: Date): number =>
  -23.44 * Math.cos(DEG * (360 / 365) * (dayOfYear(date) + 10));

/** sun altitude in degrees at a given UTC hour; negative means below horizon */
export const altitude = (date: Date, place: Place, utcHour: number): number => {
  const dec = declination(date) * DEG;
  const lat = place.latitude * DEG;
  // solar time, longitude-corrected; good enough without the equation of time
  const solarHour = utcHour + place.longitude / 15;
  const hourAngle = (solarHour - 12) * 15 * DEG;

  const sin = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle);

  return Math.asin(Math.min(1, Math.max(-1, sin))) / DEG;
};

/**
 * The sun's arc across one day, normalised against a true overhead sun.
 * Absolute rather than per-day normalisation, so winter reads as a low
 * shallow mound and midsummer fills the strip.
 *
 * Sampled on local clock time, so midnight sits at both edges and the arc
 * lands where the day actually falls rather than drifting with longitude.
 */
export const arc = (date: Date, place: Place, samples: number): number[] => {
  const offset = utcOffsetHours(date, place.timeZone);

  return Array.from({ length: samples }, (_, i) => {
    const localHour = (i / (samples - 1)) * 24;
    const alt = altitude(date, place, localHour - offset);
    return Math.max(0, alt / 90);
  });
};

/**
 * Hours between sunrise and sunset. Sunrise is conventionally the moment the
 * sun's upper limb clears the horizon, which refraction and the solar radius
 * put at -0.833 degrees rather than 0; leaving that out costs ~12 minutes at
 * this latitude in midsummer.
 */
const HORIZON = -0.833 * DEG;

export const dayLength = (date: Date, place: Place): number => {
  const dec = declination(date) * DEG;
  const lat = place.latitude * DEG;

  const cos = (Math.sin(HORIZON) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  if (cos <= -1) return 24;
  if (cos >= 1) return 0;

  return (2 * Math.acos(cos)) / DEG / 15;
};
