import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const CHARS = [" ", "░", "▒", "▓", "█"] as const;
export const WIDTH = 64;
export const HEIGHT = 3;

export type Metric = "euclidean" | "manhattan" | "chebyshev";

type Point = {
  x: number;
  y: number;
};

export type Options = {
  pointCount?: number;
  metric?: Metric;
  invert?: boolean;
};

export type GitHubStats = {
  totalContributions: number;
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  activeDays: number;
};

export type ActivityParams = {
  pointCount: number;
  metric: Metric;
  invert: boolean;
  stats: GitHubStats;
};

const fetchGitHubStats = (username: string): GitHubStats | null => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = execSync(
      `gh api graphql -f query='${query.replace(/\n/g, " ")}' -F login='${username}' -F from='${weekAgo.toISOString()}' -F to='${now.toISOString()}'`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );

    const data = JSON.parse(result);
    const contrib = data.data.user.contributionsCollection;

    const allDays = contrib.contributionCalendar.weeks.flatMap(
      (w: { contributionDays: { contributionCount: number; date: string }[] }) => w.contributionDays
    );
    const recentDays = allDays.filter((d: { date: string }) => new Date(d.date) >= weekAgo);
    const activeDays = recentDays.filter(
      (d: { contributionCount: number }) => d.contributionCount > 0
    ).length;

    return {
      totalContributions: contrib.contributionCalendar.totalContributions,
      commits: contrib.totalCommitContributions,
      prs: contrib.totalPullRequestContributions,
      reviews: contrib.totalPullRequestReviewContributions,
      issues: contrib.totalIssueContributions,
      activeDays,
    };
  } catch {
    console.error("Failed to fetch GitHub stats, using defaults");
    return null;
  }
};

export const calculateActivityParams = (stats: GitHubStats): ActivityParams => {
  // PRs weigh more since they represent larger chunks of work
  const activityScore =
    stats.commits * 1.0 + stats.prs * 3 + stats.reviews * 1.5 + stats.issues * 2;

  // more activity → more voronoi points → busier pattern
  const pointCount = Math.min(60, Math.max(5, Math.floor(5 + activityScore * 0.8)));

  // consistent work → smooth curves, sporadic → angular
  let metric: Metric;
  if (stats.activeDays >= 5) {
    metric = "euclidean";
  } else if (stats.activeDays >= 3) {
    metric = "manhattan";
  } else {
    metric = "chebyshev";
  }

  // flip if consuming more than creating
  const invert = stats.reviews > stats.commits + stats.prs;

  return { pointCount, metric, invert, stats };
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

export const generateCellular = (
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

export const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatActivityMeta = (params: ActivityParams, date: string): string => {
  const { pointCount, metric, stats } = params;
  const activityParts: string[] = [];
  if (stats.commits) activityParts.push(`${stats.commits} commit${stats.commits !== 1 ? "s" : ""}`);
  if (stats.prs) activityParts.push(`${stats.prs} PR${stats.prs !== 1 ? "s" : ""}`);
  if (stats.reviews) activityParts.push(`${stats.reviews} review${stats.reviews !== 1 ? "s" : ""}`);
  if (stats.issues) activityParts.push(`${stats.issues} issue${stats.issues !== 1 ? "s" : ""}`);

  const activitySummary = activityParts.length > 0 ? activityParts.join(", ") : "quiet week";
  const daysActive = `${stats.activeDays}/7 days`;

  return `Generated: [${date}] • ${activitySummary} • ${daysActive} • ${metric}/${pointCount}pts`;
};

const main = async (): Promise<void> => {
  const username = process.env.GITHUB_REPOSITORY_OWNER || "moritzsalla";
  const seed = Date.now();

  console.log(`Fetching GitHub stats for ${username}...`);
  const stats = fetchGitHubStats(username);

  if (!stats) {
    console.error("Aborting: could not fetch GitHub stats");
    process.exit(1);
  }

  const params = calculateActivityParams(stats);

  console.log("Activity params:", params);

  const art = generateCellular(WIDTH, HEIGHT, seed, {
    pointCount: params.pointCount,
    metric: params.metric,
    invert: params.invert,
  });

  const date = formatDate(new Date());
  const meta = formatActivityMeta(params, date);

  const readme = await readFile("README.md", "utf8");
  const updated = readme.replace(
    /```\n[\s\S]*?\n```\n+Generated: \[.*$/m,
    "```\n" + art + "\n```\n\n" + meta
  );
  await writeFile("README.md", updated);

  console.log(meta);
  console.log(art);
};

// only run when executed directly, not when imported
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}
