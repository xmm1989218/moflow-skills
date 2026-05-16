---
name: create-skill
description: Scaffold a new skill for the moflow-skills repo. Creates the skill directory with SKILL.md, updates registry.yaml, and runs lint to validate.
version: "1.0.0"
metadata:
  author: moflow
---

## What I Do

I help you create a new skill that conforms to the moflow-skills repository conventions. I handle:

1. Creating the skill directory and SKILL.md
2. Registering the skill in registry.yaml
3. Running `bun run lint` to validate

## When to Use Me

Use me when you need to add a new skill to this repository. I will ask you for the skill name and description, then scaffold everything correctly.

## Naming Rules

The skill `name` must:

- Be 1-64 characters
- Use lowercase alphanumeric with single hyphen separators
- Not start or end with `-`
- Not contain consecutive `--`
- Match the directory name that contains SKILL.md

Equivalent regex: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`

## SKILL.md Format

Every skill lives in `skills/<name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: <name>
description: "<1-1024 char description>"
version: "1.0.0"
license: MIT
metadata:
  author: moflow
---

## What I Do
<describe what this skill does>

## When to Use Me
<describe when the AI should activate this skill>

## Instructions
<detailed instructions for the AI when this skill is active>
```

### Required frontmatter fields

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Must match directory name, follow naming rules above |
| `description` | Yes | 1-1024 characters |
| `version` | Yes | Semver format: `x.y.z` |

### Optional frontmatter fields

| Field | Type | Description |
|-------|------|-------------|
| `license` | string | License identifier (e.g. MIT) |
| `compatibility` | string | Version constraint (e.g. >=0.9.0) |
| `metadata` | map | Arbitrary string-to-string key-value pairs |
| `allowed-tools` | string | Comma-separated list of allowed AI tools |

## registry.yaml Format

After creating the skill directory, add an entry to `registry.yaml` under `skills:`:

```yaml
skills:
  - name: <name>
    description: "<same as SKILL.md description>"
    version: "1.0.0"
    license: MIT
    hasScripts: false
    hasDeps: false
    metadata:
      author: moflow
```

Set `hasScripts: true` if the skill has a `scripts/` directory with files.
Set `hasDeps: true` if the scripts have external dependencies (package.json with deps).

## Skill with Scripts

If the skill needs executable scripts:

1. Create `skills/<name>/scripts/` directory
2. Create `scripts/package.json` with `name` and `version` fields, and declare dependencies
3. Place `.js` script files in `scripts/`
4. Run `bun install` in the `scripts/` directory to generate `bun.lockb`
5. Set `hasScripts: true` and `hasDeps: true` in registry.yaml

Script execution is handled by MoFlow's `runSkillScript` tool:
- Only `.js` scripts are supported
- Scripts run via bun
- **Scripts must support `--help` flag** — this is enforced by lint
- **`--help` output must use `runSkillScript` format** — e.g. `Usage: runSkillScript("convert.js", "<args>")`, NOT `bun convert.js` or `node convert.js`
- AI agents call `runSkillScript("<script_name>", "<args>")` to execute scripts
- AI agents call `runSkillScript("<script_name>", "--help")` to view usage information
- 30s timeout, max 30KB output
- Scripts must be under the skills/ directory (path security check)
- Dependencies in `node_modules/` are resolved from the `scripts/` directory

## Workflow

When asked to create a new skill, follow these steps:

1. **Ask for name and description** if not provided
2. **Validate name** against naming rules
3. **Create branch** from master: `git checkout -b skill/<name>`
4. **Create directory** `skills/<name>/`
5. **Write SKILL.md** with proper frontmatter (including `version: "1.0.0"`) and body
6. **Update registry.yaml** — add the new skill entry to the `skills` list (including matching `version`)
7. **Run lint** — execute `bun run lint` and fix any errors
8. **Commit and push** the branch
9. **Create merge request** against master

## Updating an Existing Skill

When asked to update an existing skill, follow these steps:

1. **Create branch** from master: `git checkout -b update/<name>`
2. **Bump version** in both `skills/<name>/SKILL.md` and `registry.yaml` (see Version Rules)
3. **Make changes** to SKILL.md body, scripts/, etc.
4. **Run lint** — execute `bun run lint` and fix any errors
5. **Commit and push** the branch
6. **Create merge request** against master

## Version Rules

- New skills always start at `version: "1.0.0"`
- Any content change requires a version bump:
  - **Patch** `1.0.0` → `1.0.1`: typo fixes, minor tweaks
  - **Minor** `1.0.0` → `1.1.0`: new content, feature enhancements
  - **Major** `1.0.0` → `2.0.0`: breaking changes
- Lint will detect content changes without a version update (version drift)
- Update `version` in **both** SKILL.md and registry.yaml

## Important Notes

- Do NOT register this skill (create-skill) in registry.yaml — it lives in `.agents/skills/`, not `skills/`
- Only skills under `skills/` should be registered in registry.yaml
- Skills under `.agents/skills/` are development aids for coding agents, not distributable skills for moflow users
- **Never commit directly to master** — always create a branch (`skill/<name>` for new skills, `update/<name>` for updates) and open a merge request
