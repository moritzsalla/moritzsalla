// Solar position, computed rather than fetched: no API, no key, no network,
// and nothing leaves the runner except an approximate latitude.

const DEG = Math.PI / 180;

export type Place = { latitude: number; longitude: number; label: string };

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
 */
export const arc = (date: Date, place: Place, samples: number): number[] =>
  Array.from({ length: samples }, (_, i) => {
    const alt = altitude(date, place, (i / (samples - 1)) * 24);
    return Math.max(0, alt / 90);
  });

/** hours between sunrise and sunset */
export const dayLength = (date: Date, place: Place): number => {
  const dec = declination(date) * DEG;
  const lat = place.latitude * DEG;
  const cos = -Math.tan(lat) * Math.tan(dec);
  if (cos <= -1) return 24;
  if (cos >= 1) return 0;
  return (2 * Math.acos(cos)) / DEG / 15;
};
