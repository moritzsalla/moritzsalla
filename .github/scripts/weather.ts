// Open-Meteo needs no API key and no account, so the workflow stays
// secret-free. fetchJson is injectable so the mapping can be tested
// against a fixture without network access.

import type { Place } from "./daylight.ts";

export type Forecast = {
  /** normalised 0..1 across the window's own min/max */
  temperature: number[];
  /** normalised 0..1 against a wet-hour reference, not the window max */
  precipitation: number[];
  /** 0..1 total cloud cover */
  cloud: number[];
  temperatureRange: { min: number; max: number };
  hours: number;
};

export type OpenMeteoResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    cloud_cover: number[];
  };
};

export const forecastUrl = (place: Place, days: number): string =>
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${place.latitude}&longitude=${place.longitude}` +
  "&hourly=temperature_2m,precipitation,cloud_cover" +
  `&forecast_days=${days}&timezone=auto`;

/** 4mm in an hour is heavy rain; anything above that saturates */
const HEAVY_RAIN_MM = 4;

export const toForecast = (data: OpenMeteoResponse): Forecast => {
  const temps = data.hourly.temperature_2m;
  const rain = data.hourly.precipitation;

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = max - min || 1;

  return {
    temperature: temps.map((t) => (t - min) / span),
    precipitation: rain.map((mm) => Math.min(1, mm / HEAVY_RAIN_MM)),
    cloud: (data.hourly.cloud_cover ?? []).map((pct) => Math.min(1, pct / 100)),
    temperatureRange: { min, max },
    hours: temps.length,
  };
};

export const fetchForecast = async (
  place: Place,
  days: number,
  fetchJson: (url: string) => Promise<unknown> = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`open-meteo returned ${res.status}`);
    return res.json();
  }
): Promise<Forecast> =>
  toForecast((await fetchJson(forecastUrl(place, days))) as OpenMeteoResponse);
