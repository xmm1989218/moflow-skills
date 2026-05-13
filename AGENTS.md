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
| `bun run release` | Bump registry version, create tag and GitHub Release |

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
  lint.mjs               # Lint script (8 validation checks + version drift detection)
  release.mjs            # Release script (bump, tag, GitHub Release)
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
| 1 | SKILL.md frontmatter must include `name`, `description`, and `version` | error |
| 2 | `name` must match the directory name | error |
| 3 | `name` must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (1-64 chars) | error |
| 4 | `description` must be 1-1024 characters | error |
| 5 | Skills in registry.yaml must have a corresponding `skills/<name>/` directory | error |
| 6 | Directories under `skills/` must be registered in registry.yaml | error |
| 7 | `version` must match semver format `x.y.z` | error |
| 8 | `version` in SKILL.md and registry.yaml must be consistent | error |

Additional checks:
- Script files must have `.py`, `.js`, or `.sh` extensions
- registry.yaml must have a valid `version` field (auto-incremented integer)
- No duplicate skill names in registry.yaml
- Version drift detection: if skill content changed but version not updated → error (requires git history)

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
version: "1.0.0"                # Required, semver (x.y.z)
license: MIT                    # Optional
compatibility: ">=0.9.0"        # Optional, version constraint
metadata:                       # Optional, string-to-string map
  author: moflow
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

### Version rules

- Each skill has its own semver version (`x.y.z`)
- Any content change to `skills/<name>/` (SKILL.md body, scripts/) requires a version bump
- Version bumps:
  - **Patch** `1.0.0` → `1.0.1`: typo fixes, minor tweaks
  - **Minor** `1.0.0` → `1.1.0`: new content, feature enhancements
  - **Major** `1.0.0` → `2.0.0`: breaking changes
- Lint will detect content changes without version updates (version drift)

## registry.yaml Format

```yaml
version: "2026.5.14.1"           # Date-based: YYYY.M.D.N (N = daily sequence)
updated: "YYYY-MM-DD"           # Last release date
skills:
  - name: <name>
    description: "<same as SKILL.md>"
    version: "1.0.0"            # Same as SKILL.md version
    license: MIT
    hasScripts: false
    metadata:
      author: moflow
```

- Registry `version` uses date-based format: `YYYY.M.D.N` (e.g. `2026.5.14.1`, `2026.5.14.2` for same-day releases)
- Skill `version` must match the skill's SKILL.md version
- `hasScripts` must be `true` if the skill has a `scripts/` directory with files
- `updated` is set by the release script

## Two Skill Locations

| Path | Purpose | In registry.yaml? | Lint checked? |
|------|---------|--------------------|---------------|
| `skills/<name>/` | Distributable skills for moflow users | Yes | Yes |
| `.agents/skills/<name>/` | Dev-only skills for coding agents | No | No |

Skills in `.agents/skills/` are NOT distributed to moflow users. They exist only to help coding agents work with this repository.

## Adding a New Skill

1. Create `skills/<name>/SKILL.md` with valid frontmatter (including `version`) and body
2. Add entry to `registry.yaml` under `skills:` (including matching `version`)
3. Run `bun run lint`
4. Fix any errors
5. Commit and push
6. Open a pull request

Or use the `create-skill` meta-skill from `.agents/skills/` if available.

## Release Flow

1. Merge PR(s) to master
2. Run `bun run release`
   - Validates lint passes
   - Bumps `registry.yaml` version (auto-increment)
   - Generates changelog from git log (compared to last tag)
   - Commits, tags, pushes
   - Creates GitHub Release with changelog
3. MoFlow consumes via GitHub API:
   - `GET /releases/latest` → get tag
   - Read `registry.yaml` at that tag → discover skills
   - Download skill files from that tag → install locally
