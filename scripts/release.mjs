import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import yaml from "js-yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", cwd: ROOT }).trim();
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

console.log("\n🚀 moflow-skills release\n");

// 1. Check branch
const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch !== "master") fail(`must be on master branch (current: ${branch})`);

// 2. Check clean working directory
const status = run("git status --porcelain");
if (status) fail("working directory is not clean, commit or stash changes first");

// 3. Run lint
console.log("Running lint...");
try {
  run("node scripts/lint.mjs");
} catch {
  fail("lint failed, fix errors before releasing");
}
console.log("✅ Lint passed\n");

// 4. Bump registry version + update date
const registryContent = fs.readFileSync(REGISTRY_PATH, "utf-8");
const registry = yaml.load(registryContent);
const oldVersion = registry.version;
const newVersion = oldVersion + 1;
const today = new Date().toISOString().slice(0, 10);

registry.version = newVersion;
registry.updated = today;

const newRegistryContent = yaml.dump(registry, { lineWidth: -1, quotingType: '"', forceQuotes: false });
fs.writeFileSync(REGISTRY_PATH, newRegistryContent, "utf-8");
console.log(`📌 Registry version: ${oldVersion} → ${newVersion}`);

// 5. Generate changelog
let changelog = `## v${newVersion}\n\n`;
try {
  const lastTag = run("git describe --tags --abbrev=0 HEAD");
  const log = run(`git log ${lastTag}..HEAD --pretty=format:"- %s" -- skills/`);
  if (log) {
    changelog += "### Changes\n\n" + log + "\n";
  } else {
    changelog += "No skill changes in this release.\n";
  }
} catch {
  changelog += "### Changes\n\nInitial release.\n";
}

console.log(`📝 Changelog:\n${changelog}`);

// 6. Commit
run("git add registry.yaml");
run(`git commit -m "release: v${newVersion}"`);
console.log(`\n✅ Committed: release: v${newVersion}`);

// 7. Tag
const tagName = `v${newVersion}`;
run(`git tag ${tagName}`);
console.log(`🏷️  Tagged: ${tagName}`);

// 8. Push
run("git push origin master");
run(`git push origin ${tagName}`);
console.log("📤 Pushed commit and tag");

// 9. Create GitHub Release
const delimiter = "CHANGELOG_" + Math.random().toString(36).slice(2);
process.env.RELEASE_BODY = "";
const escapedBody = changelog.replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$");
run(`gh release create ${tagName} --title "${tagName}" --notes "${escapedBody}" --draft`);
console.log(`🎉 Release draft created: ${tagName}`);
console.log("   Review and publish at: https://github.com/xmm1989218/moflow-skills/releases\n");
