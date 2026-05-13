import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import yaml from "js-yaml";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");

const NAME_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const REGISTRY_VERSION_REGEX = /^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

let errors = 0;
let warnings = 0;

function error(file, message) {
  console.error(`  ✗ ${file}: ${message}`);
  errors++;
}

function ok(file, message) {
  console.log(`  ✓ ${file}: ${message}`);
}

function warn(file, message) {
  console.warn(`  ⚠ ${file}: ${message}`);
  warnings++;
}

function getSkillDirs() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function getRegistrySkills() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
  const data = yaml.load(content);
  if (!data || !Array.isArray(data.skills)) return [];
  return data.skills;
}

function validateSkillDir(name, registrySkill) {
  const skillPath = path.join(SKILLS_DIR, name);
  const skillMdPath = path.join(skillPath, "SKILL.md");

  if (!fs.existsSync(skillMdPath)) {
    error(name, "missing SKILL.md");
    return;
  }

  const content = fs.readFileSync(skillMdPath, "utf-8");
  let parsed;
  try {
    parsed = matter(content);
  } catch (e) {
    error(name, `invalid frontmatter: ${e.message}`);
    return;
  }

  const fm = parsed.data || {};

  // Check 1: required fields
  let hasAllRequired = true;
  for (const field of ["name", "description", "version"]) {
    if (!fm[field]) {
      error(name, `missing required field: ${field}`);
      hasAllRequired = false;
    }
  }
  if (hasAllRequired) ok(name, "required fields present");

  // Check 2: name matches directory
  if (fm.name && fm.name !== name) {
    error(name, `name "${fm.name}" does not match directory name "${name}"`);
  } else if (fm.name) {
    ok(name, "name matches directory");
  }

  // Check 3: name format
  if (fm.name) {
    if (!NAME_REGEX.test(fm.name)) {
      error(name, `name "${fm.name}" does not match pattern ^[a-z][a-z0-9]*(-[a-z0-9]+)*$`);
    } else if (fm.name.length > MAX_NAME_LENGTH) {
      error(name, `name exceeds ${MAX_NAME_LENGTH} characters`);
    } else {
      ok(name, "name format valid");
    }
  }

  // Check 4: description length
  if (fm.description) {
    if (fm.description.length < 1 || fm.description.length > MAX_DESCRIPTION_LENGTH) {
      error(name, `description length ${fm.description.length} not in range 1-${MAX_DESCRIPTION_LENGTH}`);
    } else {
      ok(name, "description length valid");
    }
  }

  // Check 7: version format (semver)
  if (fm.version) {
    if (!SEMVER_REGEX.test(fm.version)) {
      error(name, `version "${fm.version}" does not match semver format (x.y.z)`);
    } else {
      ok(name, "version format valid");
    }
  }

  // Check 8: version consistency between SKILL.md and registry.yaml
  if (fm.version && registrySkill) {
    if (fm.version !== registrySkill.version) {
      error(name, `version mismatch: SKILL.md has "${fm.version}", registry.yaml has "${registrySkill.version}"`);
    } else {
      ok(name, "version consistent with registry.yaml");
    }
  }

  // Scripts check
  const scriptsDir = path.join(skillPath, "scripts");
  const hasScripts = fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length > 0;
  if (hasScripts) {
    const scripts = fs.readdirSync(scriptsDir);
    const validExts = [".py", ".js", ".sh"];
    for (const script of scripts) {
      const ext = path.extname(script);
      if (!validExts.includes(ext)) {
        error(name, `script "${script}" has unsupported extension (allowed: ${validExts.join(", ")})`);
      }
    }
  }
}

function validateRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    error("registry.yaml", "file not found");
    return { names: [], entries: [] };
  }

  let data;
  try {
    const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
    data = yaml.load(content);
  } catch (e) {
    error("registry.yaml", `parse error: ${e.message}`);
    return { names: [], entries: [] };
  }

  if (!data || typeof data !== "object") {
    error("registry.yaml", "invalid structure");
    return { names: [], entries: [] };
  }

  if (typeof data.version !== "string" || !REGISTRY_VERSION_REGEX.test(data.version)) {
    error("registry.yaml", "missing or invalid version (expected format: YYYY.M.D.N)");
  }

  if (!Array.isArray(data.skills)) {
    error("registry.yaml", "missing or invalid skills array");
    return { names: [], entries: [] };
  }

  const names = [];
  for (const entry of data.skills) {
    if (!entry.name) {
      error("registry.yaml", "skill entry missing name");
      continue;
    }
    if (names.includes(entry.name)) {
      error("registry.yaml", `duplicate skill name: ${entry.name}`);
    }
    names.push(entry.name);

    if (!entry.description) {
      error("registry.yaml", `skill "${entry.name}" missing description`);
    }
    if (!entry.version) {
      error("registry.yaml", `skill "${entry.name}" missing version`);
    } else if (!SEMVER_REGEX.test(entry.version)) {
      error("registry.yaml", `skill "${entry.name}" version "${entry.version}" does not match semver format`);
    }
  }

  ok("registry.yaml", `parsed ${names.length} skill(s)`);
  return { names, entries: data.skills };
}

function getVersionDrift() {
  let baseRef;
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    if (branch === "master") {
      baseRef = "HEAD~1";
    } else {
      try {
        execSync("git rev-parse --verify origin/master", { encoding: "utf-8", stdio: "pipe" });
        baseRef = "origin/master";
      } catch {
        try {
          baseRef = "HEAD~1";
          execSync(`git rev-parse --verify ${baseRef}`, { encoding: "utf-8", stdio: "pipe" });
        } catch {
          return null;
        }
      }
    }
  } catch {
    return null;
  }

  let diffOutput;
  try {
    diffOutput = execSync(`git diff --name-only ${baseRef}...HEAD -- skills/`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }

  if (!diffOutput) return { changedSkills: [], baseRef };

  const changedSkills = new Set();
  for (const line of diffOutput.split("\n")) {
    const match = line.match(/^skills\/([^/]+)\//);
    if (match) changedSkills.add(match[1]);
  }

  return { changedSkills: [...changedSkills], baseRef };
}

function getOldVersion(skillName, baseRef) {
  try {
    const content = execSync(`git show ${baseRef}:skills/${skillName}/SKILL.md`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const parsed = matter(content);
    return parsed.data?.version || null;
  } catch {
    return null;
  }
}

function checkVersionDrift() {
  const drift = getVersionDrift();
  if (!drift) {
    console.log("\n  (skipping version drift check: no git history available)");
    return;
  }

  const { changedSkills, baseRef } = drift;

  if (changedSkills.length === 0) {
    console.log("\n  (no skill changes detected)");
    return;
  }

  console.log(`\n🔄 Version drift check (base: ${baseRef}):\n`);

  for (const name of changedSkills) {
    const skillMdPath = path.join(SKILLS_DIR, name, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;

    const oldVersion = getOldVersion(name, baseRef);
    if (oldVersion === null) {
      ok(name, "new skill (no drift check needed)");
      continue;
    }

    const currentContent = fs.readFileSync(skillMdPath, "utf-8");
    const currentParsed = matter(currentContent);
    const newVersion = currentParsed.data?.version;

    if (!newVersion) {
      error(name, "version missing (cannot check drift)");
      continue;
    }

    if (oldVersion === newVersion) {
      const oldContent = execSync(`git show ${baseRef}:skills/${name}/SKILL.md`, { encoding: "utf-8" });
      const oldBody = matter(oldContent).content;
      const newBody = currentParsed.content;

      const scriptsDir = path.join(SKILLS_DIR, name, "scripts");
      const hasScriptsNow = fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length > 0;
      let scriptsChanged = false;

      if (hasScriptsNow) {
        try {
          const oldScripts = execSync(`git ls-tree -r --name-only ${baseRef} -- skills/${name}/scripts/`, {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          }).trim();
          const newScripts = fs.readdirSync(scriptsDir).join("\n");
          if (oldScripts !== newScripts) scriptsChanged = true;

          if (!scriptsChanged && oldScripts) {
            for (const scriptFile of oldScripts.split("\n")) {
              const scriptName = path.posix.basename(scriptFile);
              try {
                const oldScript = execSync(`git show ${baseRef}:${scriptFile}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
                const currentScript = fs.readFileSync(path.join(scriptsDir, scriptName), "utf-8");
                if (oldScript !== currentScript) {
                  scriptsChanged = true;
                  break;
                }
              } catch { /* deleted script */ }
            }
          }
        } catch {
          scriptsChanged = true;
        }
      }

      if (oldBody !== newBody || scriptsChanged) {
        error(name, `content changed but version not updated (still ${oldVersion})`);
      } else {
        ok(name, "no content change (version unchanged is correct)");
      }
    } else {
      ok(name, `version updated: ${oldVersion} → ${newVersion}`);
    }
  }
}

console.log("\n🔍 Linting moflow-skills\n");

console.log("📋 Registry:");
const { names: registryNames, entries: registryEntries } = validateRegistry();
const registryByName = Object.fromEntries(registryEntries.map((e) => [e.name, e]));

console.log("\n📁 Skills:");
const skillDirs = getSkillDirs();

for (const name of skillDirs) {
  console.log(`\n  ${name}/`);
  validateSkillDir(name, registryByName[name] || null);
}

console.log("\n🔗 Registry ↔ Skills consistency:");

const registrySet = new Set(registryNames);
const dirSet = new Set(skillDirs);

for (const name of registryNames) {
  if (!dirSet.has(name)) {
    error("registry.yaml", `skill "${name}" registered but directory skills/${name}/ not found`);
  } else {
    ok("registry.yaml", `skill "${name}" has matching directory`);
  }
}

for (const name of skillDirs) {
  if (!registrySet.has(name)) {
    error(name, `directory exists but not registered in registry.yaml`);
  } else {
    ok(name, "registered in registry.yaml");
  }
}

checkVersionDrift();

console.log("");
if (errors > 0) {
  console.error(`❌ Lint failed with ${errors} error(s)${warnings > 0 ? ` and ${warnings} warning(s)` : ""}\n`);
  process.exit(1);
} else {
  console.log(`✅ All checks passed${warnings > 0 ? ` (${warnings} warning(s))` : ""}\n`);
}
