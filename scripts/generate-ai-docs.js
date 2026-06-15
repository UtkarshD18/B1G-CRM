const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function copy(source, target) {
  const src = path.join(root, source);
  const dst = path.join(root, target);

  if (!fs.existsSync(src)) {
    throw new Error(`Missing source file: ${source}`);
  }

  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function gitOutput(args, fallback = "") {
  try {
    return execSync(`git ${args}`, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

function buildCurrentSession() {
  const branch = gitOutput("branch --show-current", "unknown");
  const lastCompleted = "AI handoff system redesign";
  const sprint = "AI workflow freeze";
  const priority = "Keep the handoff compact, current, and synchronized.";
  const feature = "Production-ready Claude handoff system";
  const nextTask = "Regenerate docs after the next successful implementation.";
  const blockers = "None identified in documentation and tooling; legacy docs remain supporting references.";

  return [
    "## Current Session",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Current branch | \`${branch}\` |`,
    `| Current sprint | \`${sprint}\` |`,
    `| Current priority | \`${priority}\` |`,
    `| Current feature in progress | \`${feature}\` |`,
    `| Last completed feature | \`${lastCompleted}\` |`,
    `| Recommended next task | \`${nextTask}\` |`,
    `| Known blockers | \`${blockers}\` |`,
    "",
  ].join("\n");
}

function injectCurrentSession(content) {
  const pattern = /## Current Session[\s\S]*?\n## Architecture Summary/;
  const replacement = `${buildCurrentSession()}## Architecture Summary`;

  if (!pattern.test(content)) {
    throw new Error("Could not find Current Session block in PROJECT_CONTEXT source");
  }

  return content.replace(pattern, replacement);
}

const projectSource = fs.readFileSync(path.join(root, "docs/PROJECT_CONTEXT.source.md"), "utf8");
const projectContext = injectCurrentSession(projectSource);
fs.writeFileSync(path.join(root, "docs/PROJECT_CONTEXT.md"), projectContext.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
copy("docs/CHANGELOG_AI.source.md", "docs/CHANGELOG_AI.md");

console.log("Generated docs/PROJECT_CONTEXT.md and docs/CHANGELOG_AI.md");
