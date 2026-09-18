// Spike: renders both candidate sources through the shared strip renderer
// and writes the results to explorations/ for review. Not wired into the
// Regenerate workflow — nothing here touches README.md.

import { writeFile } from "node:fs/promises";
import { renderStrip } from "./strip.ts";
import { arc, dayLength, type Place } from "./daylight.ts";
import { illumination } from "./moon.ts";
import { skyStrip } from "./sky.ts";
import { characterOf, conditionOf, type Condition } from "./conditions.ts";
import { toForecast, type OpenMeteoResponse } from "./weather.ts";
import { WIDTH, HEIGHT } from "./cellular.ts";

const AMSTERDAM: Place = {
  latitude: 52.37,
  longitude: 4.9,
  label: "Amsterdam",
  timeZone: "Europe/Amsterdam",
};

const PLACES: Place[] = [
  AMSTERDAM,
  { latitude: 38.72, longitude: -9.14, label: "Lisbon, 38.7°N", timeZone: "Europe/Lisbon" },
  {
    latitude: 64.15,
    longitude: -21.94,
    label: "Reykjavik, 64.1°N",
    timeZone: "Atlantic/Reykjavik",
  },
];

const DATES = [
  ["Midwinter", "2026-12-21"],
  ["Spring equinox", "2026-03-20"],
  ["Midsummer", "2026-06-21"],
] as const;

/** centred rolling mean; a 24h window turns 7 diurnal spikes into 7 days */
const smooth = (values: number[], window: number): number[] =>
  values.map((_, i) => {
    const lo = Math.max(0, i - (window >> 1));
    const hi = Math.min(values.length, i + (window >> 1) + 1);
    const slice = values.slice(lo, hi);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

const fence = (art: string): string => "```\n" + art + "\n```";

/** deterministic stand-in for a real Open-Meteo week, so the spike runs offline */
const syntheticWeek = (): OpenMeteoResponse => {
  const hours = 24 * 7;
  const time: string[] = [];
  const temperature_2m: number[] = [];
  const precipitation: number[] = [];
  const cloud_cover: number[] = [];

  for (let h = 0; h < hours; h++) {
    const hourOfDay = h % 24;
    const day = Math.floor(h / 24);
    // diurnal swing around a slowly cooling baseline
    const baseline = 14 - day * 0.6;
    const diurnal = -5 * Math.cos(((hourOfDay - 3) / 24) * 2 * Math.PI);
    time.push(
      `2026-09-${String(19 + day).padStart(2, "0")}T${String(hourOfDay).padStart(2, "0")}:00`
    );
    temperature_2m.push(Number((baseline + diurnal).toFixed(1)));
    // two fronts: a wet afternoon on day 2, a longer band across day 5
    const wet =
      (day === 2 && hourOfDay > 13 && hourOfDay < 19) ||
      (day === 5 && hourOfDay > 6 && hourOfDay < 16);
    precipitation.push(wet ? Number((1.5 + 2 * Math.sin(hourOfDay)).toFixed(1)) : 0);
    // thick where it rains, breaking up either side of the fronts
    cloud_cover.push(wet ? 95 : Math.round(45 + 40 * Math.sin((h / 17) * Math.PI)));
  }

  return { hourly: { time, temperature_2m, precipitation, cloud_cover } };
};

const main = async (): Promise<void> => {
  const lines: string[] = [
    "# Spike: daylight and weather",
    "",
    "Both sources rendered through the shared strip renderer in `strip.ts`.",
    "A column's value is a height; the partial cell at the top of that height",
    "gets a lighter shade, so a curve antialiases instead of stepping.",
    "",
    "Nothing here is wired into the Regenerate workflow.",
    "",
    "---",
    "",
    "## Daylight",
    "",
    "The sun's arc across one day. 64 columns = 24 hours, height = altitude,",
    "normalised against a true overhead sun so latitude and season both read.",
    "No API and no key — this is computed from the date and a latitude.",
    "",
  ];

  for (const place of PLACES) {
    lines.push(`### ${place.label}`, "");
    for (const [name, iso] of DATES) {
      const date = new Date(`${iso}T12:00:00Z`);
      const art = renderStrip({ values: arc(date, place, 200) }, WIDTH, HEIGHT);
      lines.push(
        `**${name}** — ${dayLength(date, place).toFixed(1)}h of daylight`,
        "",
        fence(art),
        ""
      );
    }
  }

  const forecast = toForecast(syntheticWeek());
  const { min, max } = forecast.temperatureRange;

  lines.push(
    "---",
    "",
    "## Weather",
    "",
    "64 columns = the coming 7 days. Height is temperature across the week's",
    "own range; the dithered marks above the fill are precipitation.",
    "",
    "> Generated from a synthetic week — this sandbox cannot reach",
    "> api.open-meteo.com. The shape is representative; the numbers are not.",
    "",
    `**Temperature ${min.toFixed(1)}–${max.toFixed(1)}°C over ${forecast.hours}h, two rain fronts**`,
    "",
    fence(
      renderStrip({ values: forecast.temperature, overlay: forecast.precipitation }, WIDTH, HEIGHT)
    ),
    "",
    "**Temperature alone, no precipitation overlay** — near-identical, which is the problem",
    "",
    fence(renderStrip({ values: forecast.temperature }, WIDTH, HEIGHT)),
    "",
    "### Second encoding: rain darkens the band instead of sitting above it",
    "",
    "Temperature smoothed over a 24h window so the strip reads as seven days",
    "rather than seven spikes, with precipitation driving the shade.",
    "",
    "**Smoothed temperature, rain as shade**",
    "",
    fence(
      renderStrip(
        {
          values: smooth(forecast.temperature, 24),
          shade: forecast.precipitation.map((p) => 1 - 0.75 * p),
        },
        WIDTH,
        HEIGHT
      )
    ),
    "",
    "**Smoothed temperature alone, for comparison**",
    "",
    fence(renderStrip({ values: smooth(forecast.temperature, 24) }, WIDTH, HEIGHT)),
    "",
    "**Precipitation alone, as height**",
    "",
    fence(renderStrip({ values: forecast.precipitation }, WIDTH, HEIGHT)),
    ""
  );

  const berlin = AMSTERDAM;
  const today = new Date("2026-09-19T12:00:00Z");

  lines.push(
    "---",
    "",
    "## Both at once",
    "",
    "The two do not have to compete for the same three rows. Daylight gives",
    "the shape — the sun's arc for the day — and cloud cover drives the shade,",
    "so the strip shows the sun's path and whether you would actually see it.",
    "One variable per channel, which is what the grid can carry.",
    "",
    `**${berlin.label}, clear day**`,
    "",
    fence(renderStrip({ values: arc(today, berlin, 200) }, WIDTH, HEIGHT)),
    ""
  );

  // cloud is hourly across a week; take one day and stretch it over the arc
  const dayCloud = forecast.cloud.slice(0, 24);
  const wetDayCloud = forecast.cloud.slice(24 * 5, 24 * 6);

  lines.push(
    `**${berlin.label}, broken cloud**`,
    "",
    fence(
      renderStrip(
        { values: arc(today, berlin, 200), shade: dayCloud.map((c) => 1 - 0.8 * c) },
        WIDTH,
        HEIGHT
      )
    ),
    "",
    `**${berlin.label}, overcast and wet**`,
    "",
    fence(
      renderStrip(
        { values: arc(today, berlin, 200), shade: wetDayCloud.map((c) => 1 - 0.8 * c) },
        WIDTH,
        HEIGHT
      )
    ),
    ""
  );

  lines.push(
    "---",
    "",
    "## Night, without drawing a moon",
    "",
    "The strip already covers a full local day, and most of it is empty. Rather",
    "than put a symbol in that space, the moon draws its own arc in the same",
    "language as the sun, dimmed to its illuminated fraction. A full moon that",
    "rides high is a soft mound; a new moon is nothing at all. No glyph, no",
    "stars — night is simply a fainter version of the same shape.",
    "",
    `Amsterdam, one lunar month. Left edge is local midnight, right edge the next.`,
    ""
  );

  for (const iso of [
    "2026-09-26",
    "2026-09-30",
    "2026-10-04",
    "2026-10-08",
    "2026-10-16",
    "2026-10-22",
  ]) {
    const date = new Date(`${iso}T12:00:00Z`);
    const lit = illumination(new Date(`${iso}T22:00:00Z`));
    lines.push(
      `**${iso}** — ${(lit * 100).toFixed(0)}% lit, ${dayLength(date, AMSTERDAM).toFixed(1)}h of daylight`,
      "",
      fence(renderStrip(skyStrip(date, AMSTERDAM, 200), WIDTH, HEIGHT)),
      ""
    );
  }

  lines.push(
    "---",
    "",
    "## Weather as the arc's character",
    "",
    "Weather does not get its own rows — it acts on the arc. That is what it",
    "does in life: a clear day has a hard directional peak, thick low cloud",
    "turns the light diffuse until the peak flattens into a band, and rain and",
    "wind break up the edge. No symbols, same language as the sun and moon.",
    "",
    "The same Amsterdam day, 20 October, under each condition Open-Meteo",
    "reports.",
    ""
  );

  const day = new Date("2026-10-20T12:00:00Z");
  const CONDITIONS: Condition[] = [
    "clear",
    "cloudy",
    "overcast",
    "fog",
    "drizzle",
    "rain",
    "showers",
    "snow",
    "storm",
  ];

  for (const condition of CONDITIONS) {
    const art = renderStrip(
      skyStrip(day, AMSTERDAM, 200, { weather: characterOf(condition), normalise: "daily" }),
      WIDTH,
      HEIGHT
    );
    lines.push(`**${condition}**`, "", fence(art), "");
  }

  lines.push(
    "### Cloud height, not just cloud amount",
    "",
    "Open-Meteo splits cover into low, mid and high. Cirrus thins the light",
    "without killing the shadow; stratus sitting on the city does.",
    ""
  );

  for (const [label, character] of [
    ["high cirrus only, 80%", { diffuse: 0.16, agitate: 0, dim: 0.12 }],
    ["mid altocumulus, 80%", { diffuse: 0.4, agitate: 0, dim: 0.32 }],
    ["low stratus, 80%", { diffuse: 0.72, agitate: 0, dim: 0.52 }],
  ] as const) {
    lines.push(
      `**${label}**`,
      "",
      fence(
        renderStrip(
          skyStrip(day, AMSTERDAM, 200, { weather: character, normalise: "daily" }),
          WIDTH,
          HEIGHT
        )
      ),
      ""
    );
  }

  // the code mapping should be exhaustive over what the API actually sends
  const codes = [0, 1, 2, 3, 45, 48, 51, 55, 61, 65, 71, 75, 80, 82, 85, 95, 99];
  lines.push(
    "### WMO code mapping",
    "",
    "```",
    codes.map((c) => `${String(c).padStart(2)} -> ${conditionOf(c)}`).join("\n"),
    "```",
    ""
  );

  await writeFile("explorations/spike-daylight-weather.md", lines.join("\n"));
  console.log("wrote explorations/spike-daylight-weather.md");
};

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}
