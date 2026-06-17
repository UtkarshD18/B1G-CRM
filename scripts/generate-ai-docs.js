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

const projectSourcePath = path.join(root, "docs/PROJECT_CONTEXT.source.md");
const projectTargetPath = path.join(root, "docs/PROJECT_CONTEXT.md");

if (!fs.existsSync(projectSourcePath)) {
  throw new Error(`Missing project source file: docs/PROJECT_CONTEXT.source.md`);
}

const projectSource = fs.readFileSync(projectSourcePath, "utf8");
const branch = gitOutput("branch --show-current", "unknown");
const projectContext = projectSource.replace("__AUTO_BRANCH__", branch);

fs.writeFileSync(projectTargetPath, projectContext.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
copy("docs/CHANGELOG_AI.source.md", "docs/CHANGELOG_AI.md");

console.log("Generated docs/PROJECT_CONTEXT.md and docs/CHANGELOG_AI.md");
