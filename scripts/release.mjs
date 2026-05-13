import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import yaml from "js-yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");

function run(cmd, silent) {
  return execSync(cmd, { encoding: "utf-8", cwd: ROOT, stdio: silent ? ["pipe", "pipe", "pipe"] : "pipe" }).trim();
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function generateVersion(existingVersion) {
  const now = new Date();
  const datePart = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  const prefix = `v${datePart}.`;

  let existingCount = 0;
  try {
    const tags = run("git tag -l").split("\n").filter(Boolean);
    for (const tag of tags) {
      if (tag.startsWith(prefix)) existingCount++;
    }
  } catch {
    // no tags yet
  }

  if (existingVersion && existingVersion.startsWith(`${datePart}.`)) {
    const existingSeq = parseInt(existingVersion.split(".").pop(), 10);
    if (existingSeq >= existingCount + 1) {
      existingCount = existingSeq;
    }
  }

  const seq = existingCount + 1;
  return `${datePart}.${seq}`;
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

// 4. Generate version
const registryContent = fs.readFileSync(REGISTRY_PATH, "utf-8");
const registry = yaml.load(registryContent);
const newVersion = generateVersion(registry.version);
const tagName = `v${newVersion}`;
console.log(`📌 Release version: ${tagName}`);

// 5. Update registry.yaml
const oldVersion = registry.version;

let newRegistryContent = registryContent;
newRegistryContent = newRegistryContent.replace(
  /^version:.*$/m,
  `version: "${newVersion}"`
);
newRegistryContent = newRegistryContent.replace(
  /^updated:.*$/m,
  `updated: "${new Date().toISOString().slice(0, 10)}"`
);
fs.writeFileSync(REGISTRY_PATH, newRegistryContent, "utf-8");
console.log(`📌 Registry version: ${oldVersion} → ${newVersion}`);

// 6. Generate changelog
let changelog = `## v${newVersion}\n\n`;
try {
  const lastTag = run("git describe --tags --abbrev=0 HEAD", true);
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

// 7. Commit
run("git add registry.yaml");
run(`git commit -m "release: v${newVersion}"`);
console.log(`\n✅ Committed: release: v${newVersion}`);

// 8. Tag
run(`git tag ${tagName}`);
console.log(`🏷️  Tagged: ${tagName}`);

// 9. Push
run("git push origin master");
run(`git push origin ${tagName}`);
console.log("📤 Pushed commit and tag");

// 10. Create GitHub Release (draft)
const notesFile = path.join(ROOT, ".release-notes.tmp.md");
fs.writeFileSync(notesFile, changelog, "utf-8");
try {
  run(`gh release create ${tagName} --title "${tagName}" --notes-file "${notesFile}" --draft`);
} finally {
  fs.unlinkSync(notesFile);
}
console.log(`🎉 Release draft created: ${tagName}`);
console.log("   Review and publish at: https://github.com/xmm1989218/moflow-skills/releases\n");
