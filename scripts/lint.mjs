import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const REGISTRY_PATH = path.join(ROOT, "registry.yaml");

const NAME_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

let errors = 0;

function error(file, message) {
  console.error(`  ✗ ${file}: ${message}`);
  errors++;
}

function ok(file, message) {
  console.log(`  ✓ ${file}: ${message}`);
}

function getSkillDirs() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function getRegistrySkillNames() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
  const data = yaml.load(content);
  if (!data || !Array.isArray(data.skills)) return [];
  return data.skills.map((s) => s.name);
}

function validateSkillDir(name) {
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

  if (!fm.name) {
    error(name, "missing required field: name");
  } else {
    if (fm.name !== name) {
      error(name, `name "${fm.name}" does not match directory name "${name}"`);
    } else {
      ok(name, "name matches directory");
    }

    if (!NAME_REGEX.test(fm.name)) {
      error(name, `name "${fm.name}" does not match pattern ^[a-z][a-z0-9]*(-[a-z0-9]+)*$`);
    } else if (fm.name.length > MAX_NAME_LENGTH) {
      error(name, `name exceeds ${MAX_NAME_LENGTH} characters`);
    } else {
      ok(name, "name format valid");
    }
  }

  if (!fm.description) {
    error(name, "missing required field: description");
  } else {
    if (fm.description.length < 1 || fm.description.length > MAX_DESCRIPTION_LENGTH) {
      error(name, `description length ${fm.description.length} not in range 1-${MAX_DESCRIPTION_LENGTH}`);
    } else {
      ok(name, "description length valid");
    }
  }

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
    if (!errors) ok(name, "scripts valid");
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

  if (typeof data.version !== "number") {
    error("registry.yaml", "missing or invalid version");
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
  }

  ok("registry.yaml", `parsed ${names.length} skill(s)`);
  return { names, entries: data.skills };
}

console.log("\n🔍 Linting moflow-skills\n");

console.log("📋 Registry:");
const { names: registryNames } = validateRegistry();

console.log("\n📁 Skills:");
const skillDirs = getSkillDirs();

for (const name of skillDirs) {
  console.log(`\n  ${name}/`);
  validateSkillDir(name);
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

console.log("");
if (errors > 0) {
  console.error(`❌ Lint failed with ${errors} error(s)\n`);
  process.exit(1);
} else {
  console.log("✅ All checks passed\n");
}
