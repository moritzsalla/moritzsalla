import { writeFile } from "node:fs/promises";
import {
  calculateActivityParams,
  generateCellular,
  WIDTH,
  HEIGHT,
  type GitHubStats,
} from "./cellular.ts";

const SEED = 42; // fixed seed for reproducible previews

type Scenario = {
  name: string;
  description: string;
  stats: GitHubStats;
};

const SCENARIOS: Scenario[] = [
  {
    name: "Quiet Week",
    description: "minimal activity, single day",
    stats: { totalContributions: 1, commits: 1, prs: 0, reviews: 0, issues: 0, activeDays: 1 },
  },
  {
    name: "Light Week",
    description: "casual contributions",
    stats: { totalContributions: 5, commits: 2, prs: 1, reviews: 0, issues: 0, activeDays: 3 },
  },
  {
    name: "Normal Week",
    description: "steady work rhythm",
    stats: { totalContributions: 15, commits: 8, prs: 2, reviews: 1, issues: 0, activeDays: 5 },
  },
  {
    name: "Busy Week",
    description: "high output",
    stats: { totalContributions: 35, commits: 20, prs: 5, reviews: 3, issues: 2, activeDays: 6 },
  },
  {
    name: "Hectic Week",
    description: "crunch mode",
    stats: { totalContributions: 60, commits: 40, prs: 10, reviews: 5, issues: 3, activeDays: 7 },
  },
  {
    name: "Reviewer Week",
    description: "more consuming than creating (inverted)",
    stats: { totalContributions: 20, commits: 2, prs: 0, reviews: 15, issues: 1, activeDays: 5 },
  },
  {
    name: "Sporadic Burst",
    description: "intense but inconsistent (angular)",
    stats: { totalContributions: 25, commits: 15, prs: 3, reviews: 2, issues: 1, activeDays: 2 },
  },
];

const formatTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const main = async (): Promise<void> => {
  const timestamp = formatTimestamp();

  let output = `# Activity Visualization Preview\n`;
  output += `Generated: ${timestamp}\n\n`;

  for (const scenario of SCENARIOS) {
    const params = calculateActivityParams(scenario.stats);
    const art = generateCellular(WIDTH, HEIGHT, SEED, {
      pointCount: params.pointCount,
      metric: params.metric,
      invert: params.invert,
    });

    output += `---\n\n`;
    output += `## ${scenario.name}\n`;
    output += `> ${scenario.description}\n\n`;
    output += `**Stats:** ${scenario.stats.commits} commits, ${scenario.stats.prs} PRs, ${scenario.stats.reviews} reviews, ${scenario.stats.activeDays}/7 days\n\n`;
    output += `**Params:** ${params.metric} / ${params.pointCount} pts${params.invert ? " / inverted" : ""}\n\n`;
    output += "```\n" + art + "\n```\n\n";
  }

  const filepath = `preview-${timestamp}.md`;
  await writeFile(filepath, output);

  console.log(`Written: ${filepath}`);
};

main().catch(console.error);
