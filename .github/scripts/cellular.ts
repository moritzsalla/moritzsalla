import { readFile, writeFile } from "node:fs/promises";

const CHARS = [" ", "░", "▒", "▓", "█"] as const;
const WIDTH = 64;
const HEIGHT = 3;

type Metric = "euclidean" | "manhattan" | "chebyshev";

type Point = {
  x: number;
  y: number;
};

type Options = {
  pointCount?: number;
  metric?: Metric;
  invert?: boolean;
};

const mulberry32 = (seed: number): (() => number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const distance = (x1: number, y1: number, x2: number, y2: number, metric: Metric): number => {
  switch (metric) {
    case "euclidean":
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    case "manhattan":
      return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    case "chebyshev":
      return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  }
};

const generateCellular = (
  width: number,
  height: number,
  seed: number,
  options: Options = {}
): string => {
  const { pointCount = 8, metric = "euclidean", invert = false } = options;

  const random = mulberry32(seed);
  const points: Point[] = Array.from({ length: pointCount }, () => ({
    x: random() * width,
    y: random() * height,
  }));

  let maxDist = 0;
  const grid: number[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      const distances = points.map((p) => distance(x, y, p.x, p.y, metric)).sort((a, b) => a - b);
      grid[y][x] = distances[1] - distances[0];
      maxDist = Math.max(maxDist, grid[y][x]);
    }
  }

  let art = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = grid[y][x] / maxDist;
      if (invert) value = 1 - value;
      const charIndex = Math.min(CHARS.length - 1, Math.floor(value * CHARS.length));
      art += CHARS[charIndex];
    }
    art += "\n";
  }

  return art.trim();
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const main = async (): Promise<void> => {
  const seed = Date.now();
  const art = generateCellular(WIDTH, HEIGHT, seed, {
    pointCount: 25,
    metric: "manhattan",
    invert: false,
  });

  const date = formatDate(new Date());
  const readme = await readFile("README.md", "utf8");
  const updated = readme.replace(
    /```\n[\s\S]*?\n```\nGenerated: \[.*?\]/,
    "```\n" + art + "\n```\nGenerated: [" + date + "]"
  );
  await writeFile("README.md", updated);

  console.log("Updated ASCII art with seed:", seed);
  console.log(art);
};

main().catch(console.error);
