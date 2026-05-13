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
    metadata:
      author: moflow
```

Set `hasScripts: true` only if the skill includes a `scripts/` subdirectory.

## Skill with Scripts

If the skill needs executable scripts:

1. Create `skills/<name>/scripts/` directory
2. Place scripts with appropriate extensions: `.py`, `.js`, or `.sh`
3. Set `hasScripts: true` in registry.yaml

Script execution is handled by moflow's Rust backend:
- `.py` → python3
- `.js` → node
- `.sh` → bash
- 30s timeout, max 30KB output
- Scripts must be under the skills/ directory (path security check)

## Workflow

When asked to create a new skill, follow these steps:

1. **Ask for name and description** if not provided
2. **Validate name** against naming rules
3. **Create directory** `skills/<name>/`
4. **Write SKILL.md** with proper frontmatter (including `version: "1.0.0"`) and body
5. **Update registry.yaml** — add the new skill entry to the `skills` list (including matching `version`)
6. **Run lint** — execute `bun run lint` and fix any errors
7. **Confirm** — report what was created and the lint result

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
