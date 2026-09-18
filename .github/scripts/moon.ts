// Lunar position and phase, low-precision Meeus. Accurate to a few arcminutes,
// which is far past what a 64x3 grid can show, and like daylight.ts it needs
// no network.

const DEG = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = DEG * 23.4397;
const SUN_DISTANCE_KM = 149_598_000;

const toDays = (date: Date): number => date.getTime() / 86_400_000 - 0.5 + J1970 - J2000;

type Equatorial = { ra: number; dec: number };

const rightAscension = (l: number, b: number): number =>
  Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));

const declination = (l: number, b: number): number =>
  Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));

const siderealTime = (d: number, lw: number): number => DEG * (280.16 + 360.9856235 * d) - lw;

const sunCoords = (d: number): Equatorial => {
  const meanAnomaly = DEG * (357.5291 + 0.98560028 * d);
  const centre =
    DEG *
    (1.9148 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly) +
      0.0003 * Math.sin(3 * meanAnomaly));
  const longitude = meanAnomaly + centre + DEG * 102.9372 + Math.PI;

  return { ra: rightAscension(longitude, 0), dec: declination(longitude, 0) };
};

const moonCoords = (d: number): Equatorial & { distance: number } => {
  const meanLongitude = DEG * (218.316 + 13.176396 * d);
  const meanAnomaly = DEG * (134.963 + 13.064993 * d);
  const meanDistance = DEG * (93.272 + 13.22935 * d);

  const longitude = meanLongitude + DEG * 6.289 * Math.sin(meanAnomaly);
  const latitude = DEG * 5.128 * Math.sin(meanDistance);

  return {
    ra: rightAscension(longitude, latitude),
    dec: declination(longitude, latitude),
    distance: 385_001 - 20_905 * Math.cos(meanAnomaly),
  };
};

/** moon altitude in degrees; negative means below the horizon */
export const altitude = (date: Date, latitude: number, longitude: number): number => {
  const d = toDays(date);
  const moon = moonCoords(d);
  const hourAngle = siderealTime(d, DEG * -longitude) - moon.ra;

  const sin =
    Math.sin(DEG * latitude) * Math.sin(moon.dec) +
    Math.cos(DEG * latitude) * Math.cos(moon.dec) * Math.cos(hourAngle);

  return Math.asin(Math.min(1, Math.max(-1, sin))) / DEG;
};

/** illuminated fraction of the disc, 0 at new and 1 at full */
export const illumination = (date: Date): number => {
  const d = toDays(date);
  const sun = sunCoords(d);
  const moon = moonCoords(d);

  const elongation = Math.acos(
    Math.sin(sun.dec) * Math.sin(moon.dec) +
      Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra)
  );

  const phaseAngle = Math.atan2(
    SUN_DISTANCE_KM * Math.sin(elongation),
    moon.distance - SUN_DISTANCE_KM * Math.cos(elongation)
  );

  return (1 + Math.cos(phaseAngle)) / 2;
};
