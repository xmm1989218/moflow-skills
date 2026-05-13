import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import yaml from "js-yaml";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");

function run(cmd, silent) {
  return execSync(cmd, { encoding: "utf-8", cwd: ROOT, stdio: silent ? ["pipe", "pipe", "pipe"] : "pipe" }).trim();
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function generateVersion(registryVersion) {
  const now = new Date();
  const datePart = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  const prefix = `v${datePart}.`;

  let existingCount = 0;
  try {
    const tags = run("git tag -l", true).split("\n").filter(Boolean);
    for (const tag of tags) {
      if (tag.startsWith(prefix)) existingCount++;
    }
  } catch {}

  if (registryVersion && registryVersion.startsWith(`${datePart}.`)) {
    const existingSeq = parseInt(registryVersion.split(".").pop(), 10);
    if (existingSeq >= existingCount + 1) {
      existingCount = existingSeq;
    }
  }

  const seq = existingCount + 1;
  return `${datePart}.${seq}`;
}

function getLastTag() {
  try {
    return run("git describe --tags --abbrev=0", true);
  } catch {
    return null;
  }
}

function getRegistryAtTag(tag) {
  try {
    const content = run(`git show ${tag}:registry.yaml`, true);
    return yaml.load(content);
  } catch {
    return null;
  }
}

function getSkillChanges(oldRegistry, newRegistry) {
  const oldSkills = Object.fromEntries((oldRegistry?.skills || []).map((s) => [s.name, s]));
  const newSkills = Object.fromEntries((newRegistry?.skills || []).map((s) => [s.name, s]));
  const changes = [];

  for (const [name, skill] of Object.entries(newSkills)) {
    if (!oldSkills[name]) {
      changes.push({ name, type: "new", newVersion: skill.version, description: skill.description });
    } else if (oldSkills[name].version !== skill.version) {
      changes.push({ name, type: "updated", oldVersion: oldSkills[name].version, newVersion: skill.version, description: skill.description });
    }
  }

  for (const [name, skill] of Object.entries(oldSkills)) {
    if (!newSkills[name]) {
      changes.push({ name, type: "removed", oldVersion: skill.version, description: skill.description });
    }
  }

  return changes;
}

function getCommitsForSkill(tag, name) {
  try {
    const log = run(`git log ${tag}..HEAD --pretty=format:"- %s" -- skills/${name}/`, true);
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

function getGlobalCommits(tag) {
  try {
    const log = run(`git log ${tag}..HEAD --pretty=format:"- %s"`, true);
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

// --- Main ---

console.log("\n📝 Generating changelog entry\n");

// 1. Get last tag
const lastTag = getLastTag();
if (lastTag) {
  console.log(`📌 Last tag: ${lastTag}`);
} else {
  console.log("📌 No previous tags found (first release)");
}

// 2. Read current registry
const registryContent = fs.readFileSync(REGISTRY_PATH, "utf-8");
const currentRegistry = yaml.load(registryContent);

// 3. Generate version
const newVersion = generateVersion(currentRegistry.version);
console.log(`📌 Next version: v${newVersion}\n`);

// 4. Detect skill changes
const oldRegistry = lastTag ? getRegistryAtTag(lastTag) : null;
const skillChanges = getSkillChanges(oldRegistry, currentRegistry);

if (skillChanges.length === 0) {
  console.log("  No skill changes detected.");
  console.log("  If you still want to release, edit CHANGELOG.md manually.\n");
  process.exit(0);
}

// 5. Get per-skill commits and global commits
const lastTagOrInit = lastTag || "HEAD";
for (const change of skillChanges) {
  change.commits = getCommitsForSkill(lastTagOrInit, change.name);
}
const globalCommits = lastTag ? getGlobalCommits(lastTag) : [];

// 6. Build changelog entry
let entry = `## v${newVersion}\n\n`;
entry += `### Skills\n\n`;

for (const change of skillChanges) {
  if (change.type === "new") {
    entry += `- **${change.name}** v${change.newVersion} (new) — ${change.description}\n`;
  } else if (change.type === "updated") {
    entry += `- **${change.name}** v${change.oldVersion} → v${change.newVersion} (updated)\n`;
    entry += `  TODO: describe what changed\n`;
  } else if (change.type === "removed") {
    entry += `- **${change.name}** v${change.oldVersion} (removed)\n`;
  }
  for (const commit of change.commits) {
    entry += `  ${commit}\n`;
  }
}

if (globalCommits.length > 0) {
  entry += `\n### Changes\n\n`;
  for (const commit of globalCommits) {
    entry += `${commit}\n`;
  }
}

// 7. Update CHANGELOG.md
entry += "\n";
let changelogContent = "";
if (fs.existsSync(CHANGELOG_PATH)) {
  changelogContent = fs.readFileSync(CHANGELOG_PATH, "utf-8");
}

const header = "# Changelog\n\n";
if (changelogContent.startsWith(header)) {
  changelogContent = header + entry + changelogContent.slice(header.length);
} else if (changelogContent.startsWith("# Changelog")) {
  changelogContent = "# Changelog\n\n" + entry + changelogContent.slice("# Changelog".length).replace(/^\n*/, "\n");
} else {
  changelogContent = "# Changelog\n\n" + entry;
}

fs.writeFileSync(CHANGELOG_PATH, changelogContent, "utf-8");
console.log("✅ CHANGELOG.md updated");

// 8. Update registry.yaml
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
console.log("✅ registry.yaml updated");

// 9. Summary
console.log(`\n📋 Generated entry for v${newVersion}:`);
console.log("---");
console.log(entry.trim());
console.log("---\n");
console.log("Next steps:");
console.log("  1. Review CHANGELOG.md entry");
console.log("  2. Run: bun run lint");
console.log("  3. Commit and push");
console.log("  4. Run: bun run release\n");
