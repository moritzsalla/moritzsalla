// Renders the same day through every mark language and several compositions,
// so the artistic direction can be picked by looking rather than arguing.

import { writeFile } from "node:fs/promises";
import { skyStrip } from "./sky.ts";
import { characterOf } from "./conditions.ts";
import { PALETTES, SHADE, COLUMN, BRAILLE, CONTOUR, type Palette } from "./palettes.ts";
import { resample } from "./strip.ts";
import type { Place } from "./daylight.ts";

const WIDTH = 64;

const AMSTERDAM: Place = {
  latitude: 52.37,
  longitude: 4.9,
  label: "Amsterdam",
  timeZone: "Europe/Amsterdam",
};

const fence = (art: string): string => "```\n" + art + "\n```";

type Scene = { values: number[]; shade: number[] };

const scene = (iso: string, condition: Parameters<typeof characterOf>[0]): Scene => {
  const strip = skyStrip(new Date(`${iso}T12:00:00Z`), AMSTERDAM, 240, {
    weather: characterOf(condition),
    normalise: "daily",
  });
  return {
    values: resample(strip.values, WIDTH),
    shade: resample(strip.shade ?? strip.values.map(() => 1), WIDTH),
  };
};

const draw = (palette: Palette, s: Scene, height: number): string =>
  palette.render(s.values, s.shade, WIDTH, height);

/** sky filled and the arc carved out of it, rather than drawn onto nothing */
const inverted = (s: Scene): Scene => ({
  values: s.values.map((v) => 1 - v),
  shade: s.shade,
});

/** arc floated to the middle instead of sitting on the floor */
const centred = (s: Scene, lift: number): Scene => ({
  values: s.values.map((v) => v * (1 - lift) + lift),
  shade: s.shade,
});

const main = async (): Promise<void> => {
  const clear = scene("2026-10-20", "clear");
  const rain = scene("2026-10-20", "rain");
  const winter = scene("2026-12-21", "overcast");

  const lines: string[] = [
    "# Gallery: picking a direction",
    "",
    "Same data throughout — Amsterdam, the sun's arc across a local day, the",
    "moon taking over at night, weather bending the shape. What changes below",
    "is the alphabet and the composition.",
    "",
    "---",
    "",
    "## One: the alphabet",
    "",
    "A clear day on the left of each pair, the same day under rain beneath it.",
    "",
  ];

  for (const palette of PALETTES) {
    lines.push(
      `### ${palette.name}`,
      "",
      palette.note,
      "",
      "clear",
      "",
      fence(draw(palette, clear, 3)),
      "",
      "rain",
      "",
      fence(draw(palette, rain, 3)),
      ""
    );
  }

  lines.push(
    "---",
    "",
    "## Two: the composition",
    "",
    "The alphabet is only half of it. These all use the same data again.",
    "",
    "### Carved rather than drawn",
    "",
    "The sky is the solid thing and the sun's path is the absence in it.",
    "",
    fence(draw(SHADE, inverted(clear), 3)),
    "",
    "### Floated off the floor",
    "",
    "The arc lifted clear of the baseline, so it reads as something in the air.",
    "",
    fence(draw(COLUMN, centred(clear, 0.35), 3)),
    "",
    "### Taller",
    "",
    "Five rows instead of three. More room for the curve, a heavier block on",
    "the page.",
    "",
    fence(draw(SHADE, clear, 5)),
    "",
    "### One row",
    "",
    "A single line. Almost a signature rather than a picture.",
    "",
    fence(draw(COLUMN, clear, 1)),
    "",
    "### Braille, tall",
    "",
    "The densest option: four rows of braille is 128 by 16 points.",
    "",
    fence(draw(BRAILLE, clear, 4)),
    "",
    "### Contour, tall",
    "",
    fence(draw(CONTOUR, clear, 5)),
    "",
    "---",
    "",
    "## Three: does it still read in midwinter?",
    "",
    "The shortest, greyest day of the year — overcast, 7.7 hours of light.",
    "A direction that collapses here is not worth having.",
    ""
  );

  for (const palette of [SHADE, COLUMN, BRAILLE, CONTOUR]) {
    lines.push(`**${palette.name}**`, "", fence(draw(palette, winter, 3)), "");
  }

  await writeFile("explorations/gallery.md", lines.join("\n"));
  console.log("wrote explorations/gallery.md");
};

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}
