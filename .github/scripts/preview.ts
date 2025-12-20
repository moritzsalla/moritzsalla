import { writeFile } from "node:fs/promises";
import {
  calculateActivityParams,
  generateCellular,
  formatDailyRhythm,
  WIDTH,
  HEIGHT,
  type GitHubStats,
  type DailyCount,
} from "./cellular.ts";

const SEED = 42;

// helper to create daily breakdown from counts array
const makeDays = (counts: number[]): DailyCount[] =>
  counts.map((count, i) => ({ date: `2025-12-${14 + i}`, count }));

type Scenario = {
  name: string;
  description: string;
  stats: GitHubStats;
};

const SCENARIOS: Scenario[] = [
  // temporal patterns
  {
    name: "Monday Start",
    description: "burst of energy at week start",
    stats: {
      totalContributions: 20,
      commits: 15,
      prs: 2,
      reviews: 0,
      issues: 0,
      activeDays: 3,
      dailyBreakdown: makeDays([12, 5, 3, 0, 0, 0, 0]),
    },
  },
  {
    name: "Friday Deadline",
    description: "crunch at end of week",
    stats: {
      totalContributions: 25,
      commits: 18,
      prs: 3,
      reviews: 1,
      issues: 0,
      activeDays: 4,
      dailyBreakdown: makeDays([0, 2, 3, 5, 15, 0, 0]),
    },
  },
  {
    name: "Weekend Warrior",
    description: "only works on weekends",
    stats: {
      totalContributions: 18,
      commits: 12,
      prs: 2,
      reviews: 0,
      issues: 0,
      activeDays: 2,
      dailyBreakdown: makeDays([0, 0, 0, 0, 0, 10, 8]),
    },
  },
  {
    name: "9-to-5 Steady",
    description: "consistent weekday work",
    stats: {
      totalContributions: 25,
      commits: 15,
      prs: 5,
      reviews: 2,
      issues: 0,
      activeDays: 5,
      dailyBreakdown: makeDays([5, 5, 5, 5, 5, 0, 0]),
    },
  },
  {
    name: "Mid-week Peak",
    description: "builds up then tapers",
    stats: {
      totalContributions: 30,
      commits: 20,
      prs: 4,
      reviews: 2,
      issues: 0,
      activeDays: 5,
      dailyBreakdown: makeDays([2, 5, 10, 8, 5, 0, 0]),
    },
  },
  {
    name: "Scattered",
    description: "sporadic bursts",
    stats: {
      totalContributions: 15,
      commits: 10,
      prs: 2,
      reviews: 0,
      issues: 0,
      activeDays: 3,
      dailyBreakdown: makeDays([8, 0, 0, 5, 0, 0, 2]),
    },
  },
  {
    name: "Quiet Week",
    description: "minimal activity",
    stats: {
      totalContributions: 2,
      commits: 2,
      prs: 0,
      reviews: 0,
      issues: 0,
      activeDays: 1,
      dailyBreakdown: makeDays([0, 0, 0, 2, 0, 0, 0]),
    },
  },
  {
    name: "Hectic Week",
    description: "crunch all week",
    stats: {
      totalContributions: 60,
      commits: 40,
      prs: 10,
      reviews: 5,
      issues: 3,
      activeDays: 7,
      dailyBreakdown: makeDays([8, 10, 12, 8, 10, 6, 6]),
    },
  },
];

const main = async (): Promise<void> => {
  let output = `# Temporal Visualization Preview\n\n`;
  output += `Each pattern shows weekly rhythm: left = start of week, right = end of week\n\n`;

  for (const scenario of SCENARIOS) {
    const params = calculateActivityParams(scenario.stats);
    const dailyWeights = scenario.stats.dailyBreakdown.map((d) => d.count);
    const rhythm = formatDailyRhythm(scenario.stats.dailyBreakdown);

    const art = generateCellular(WIDTH, HEIGHT, SEED, {
      pointCount: params.pointCount,
      metric: params.metric,
      invert: params.invert,
      dailyWeights,
    });

    output += `---\n\n`;
    output += `## ${scenario.name}\n`;
    output += `> ${scenario.description}\n\n`;
    output += `**Rhythm:** \`${rhythm}\` (${scenario.stats.dailyBreakdown.map((d) => d.count).join("-")})\n\n`;
    output += `**Params:** ${params.metric} / ${params.pointCount} pts${params.invert ? " / inverted" : ""}\n\n`;
    output += "```\n" + art + "\n```\n\n";
  }

  await writeFile("preview.md", output);

  console.log("Written: preview.md");
};

main().catch(console.error);
