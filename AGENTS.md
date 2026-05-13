# AGENTS.md

## Project Overview

moflow-skills is the remote skill repository for [MoFlow](https://github.com/xmm1989218/moflow), a desktop Markdown editor. It follows the [agentskills.io](https://agentskills.io) open standard. MoFlow can search and download skills from this repository.

## Tech Stack

- **Skill format**: SKILL.md (YAML frontmatter + Markdown body)
- **Registry**: registry.yaml (skill index)
- **Lint**: Node.js script (`scripts/lint.mjs`) with `js-yaml` and `gray-matter`
- **CI**: GitHub Actions

## Commands

| Command | Description |
|---|---|
| `bun run lint` | Validate all skills and registry.yaml |

**Always run after adding or modifying a skill:**
- `bun run lint` — ensure all checks pass

## Repository Structure

```
.agents/skills/          # Development-only skills (for coding agents, not distributed)
  create-skill/          # Meta-skill: helps agents scaffold new skills
    SKILL.md
.github/workflows/
  lint.yml               # CI: run lint on PR/push to master
scripts/
  lint.mjs               # Lint script (6 validation checks)
skills/                  # Distributable skills (registered in registry.yaml)
  documentation/
    SKILL.md
    scripts/             # Optional: executable scripts (.py, .js, .sh)
AGENTS.md                # This file
CONTRIBUTING.md          # Contribution guide
README.md                # Repository overview
registry.yaml            # Skill index (only skills/ entries, NOT .agents/skills/)
package.json             # bun scripts and dev dependencies
```

## Lint Rules

The lint script (`bun run lint`) enforces these checks:

| # | Check | Level |
|---|-------|-------|
| 1 | SKILL.md frontmatter must include `name` and `description` | error |
| 2 | `name` must match the directory name | error |
| 3 | `name` must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (1-64 chars) | error |
| 4 | `description` must be 1-1024 characters | error |
| 5 | Skills in registry.yaml must have a corresponding `skills/<name>/` directory | error |
| 6 | Directories under `skills/` must be registered in registry.yaml | error |

Additional checks:
- Script files must have `.py`, `.js`, or `.sh` extensions
- registry.yaml must have a valid `version` field
- No duplicate skill names in registry.yaml

## Skill Format

### Directory structure

```
skills/<name>/
  SKILL.md               # Required: frontmatter + body
  scripts/               # Optional: executable scripts
    helper.py
```

### SKILL.md frontmatter

```yaml
---
name: <name>                    # Required, must match directory name
description: "<text>"           # Required, 1-1024 chars
license: MIT                    # Optional
compatibility: ">=0.9.0"        # Optional, version constraint
metadata:                       # Optional, string-to-string map
  author: moflow
  version: "1.0"
allowed-tools: "outline,read"   # Optional, comma-separated tool list
---
```

### SKILL.md body

The body is injected into the AI's context when the skill is activated. Structure:

```markdown
## What I Do
<what this skill does>

## When to Use Me
<when the AI should activate this skill>

## Instructions
<detailed instructions for the AI>
```

### Naming rules

- 1-64 characters
- Lowercase alphanumeric with single hyphen separators
- Must not start or end with `-`
- Must not contain consecutive `--`
- Regex: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`

## registry.yaml Format

```yaml
version: 1
updated: "YYYY-MM-DD"
skills:
  - name: <name>
    description: "<same as SKILL.md>"
    license: MIT
    hasScripts: false
    metadata:
      author: moflow
      version: "1.0"
```

- `hasScripts` must be `true` if the skill has a `scripts/` directory with files
- `updated` should reflect the last modification date

## Two Skill Locations

| Path | Purpose | In registry.yaml? | Lint checked? |
|------|---------|--------------------|---------------|
| `skills/<name>/` | Distributable skills for moflow users | Yes | Yes |
| `.agents/skills/<name>/` | Dev-only skills for coding agents | No | No |

Skills in `.agents/skills/` are NOT distributed to moflow users. They exist only to help coding agents work with this repository.

## Adding a New Skill

1. Create `skills/<name>/SKILL.md` with valid frontmatter and body
2. Add entry to `registry.yaml` under `skills:`
3. Run `bun run lint`
4. Fix any errors
5. Commit and push

Or use the `create-skill` meta-skill from `.agents/skills/` if available.
