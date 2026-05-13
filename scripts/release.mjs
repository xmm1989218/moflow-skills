import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import yaml from "js-yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");

function run(cmd, silent) {
  return execSync(cmd, { encoding: "utf-8", cwd: ROOT, stdio: silent ? ["pipe", "pipe", "pipe"] : "pipe" }).trim();
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function getLatestChangelogEntry(content) {
  const match = content.match(/^## (v[^\n]+)\n([\s\S]*?)(?=\n## v|\n*$)/);
  if (!match) return null;
  return {
    heading: match[1],
    version: match[1].replace(/^v/, ""),
    body: match[2].trim(),
  };
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

// 4. Read version from CHANGELOG.md
if (!fs.existsSync(CHANGELOG_PATH)) {
  fail("CHANGELOG.md not found");
}
const changelogContent = fs.readFileSync(CHANGELOG_PATH, "utf-8");
const entry = getLatestChangelogEntry(changelogContent);
if (!entry) {
  fail("no version entry found in CHANGELOG.md (expected ## vYYYY.M.D.N)");
}

const newVersion = entry.version;
const tagName = `v${newVersion}`;
console.log(`📌 Release version: ${tagName} (from CHANGELOG.md)`);

// 5. Validate registry.yaml version matches CHANGELOG
const registryContent = fs.readFileSync(REGISTRY_PATH, "utf-8");
const registry = yaml.load(registryContent);
if (registry.version !== newVersion) {
  fail(`version mismatch: registry.yaml has "${registry.version}", CHANGELOG.md has "${newVersion}". Update registry.yaml first.`);
}
console.log(`✅ Registry version matches: ${newVersion}`);

// 6. Check tag doesn't already exist
try {
  run(`git rev-parse ${tagName}`, true);
  fail(`tag ${tagName} already exists`);
} catch {
  // tag doesn't exist, good
}

// 7. Build release notes from CHANGELOG entry
const releaseNotes = `## ${entry.heading}\n\n${entry.body}`;
const notesFile = path.join(ROOT, ".release-notes.tmp.md");
fs.writeFileSync(notesFile, releaseNotes, "utf-8");

// 8. Commit (if there are staged changes)
run("git add registry.yaml CHANGELOG.md");
try {
  run(`git commit -m "release: v${newVersion}"`, true);
  console.log(`\n✅ Committed: release: v${newVersion}`);
} catch {
  console.log("\n  (nothing new to commit)");
}

// 9. Tag
run(`git tag ${tagName}`);
console.log(`🏷️  Tagged: ${tagName}`);

// 10. Push
run("git push origin master");
run(`git push origin ${tagName}`);
console.log("📤 Pushed commit and tag");

// 11. Create GitHub Release (draft)
try {
  run(`gh release create ${tagName} --title "${tagName}" --notes-file "${notesFile}" --draft`);
} finally {
  fs.unlinkSync(notesFile);
}
console.log(`🎉 Release draft created: ${tagName}`);
console.log("   Review and publish at: https://github.com/xmm1989218/moflow-skills/releases\n");
