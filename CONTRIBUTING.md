# Contributing to moflow-skills

## Prerequisites

- [Bun](https://bun.sh/)

## Setup

```bash
bun install
```

## Adding a Skill

### 1. Create the skill directory

```
skills/<name>/SKILL.md
```

Choose a name that follows the naming rules:

- 1-64 characters
- Lowercase alphanumeric with single hyphen separators
- Must not start or end with `-`
- Must not contain consecutive `--`
- Regex: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`

Examples: `documentation`, `polish-writing`, `api-docs`, `git-release`

### 2. Write SKILL.md

```markdown
---
name: <name>
description: "<1-1024 char description of what this skill does and when to use it>"
license: MIT
metadata:
  author: moflow
  version: "1.0"
---

## What I Do
<describe what this skill does>

## When to Use Me
<describe when the AI should activate this skill>

## Instructions
<detailed instructions for the AI when this skill is active>
```

**Required fields**: `name`, `description`

**Optional fields**: `license`, `compatibility`, `metadata`, `allowed-tools`

### 3. Add scripts (optional)

If your skill needs executable scripts, create a `scripts/` subdirectory:

```
skills/<name>/
  SKILL.md
  scripts/
    helper.py
```

Supported script extensions: `.py` (python3), `.js` (node), `.sh` (bash)

Scripts run with a 30s timeout and 30KB max output.

### 4. Register in registry.yaml

Add an entry to the `skills` list in `registry.yaml`:

```yaml
skills:
  - name: <name>
    description: "<same as SKILL.md description>"
    license: MIT
    hasScripts: false
    metadata:
      author: moflow
      version: "1.0"
```

Set `hasScripts: true` if the skill has a `scripts/` directory with files.

### 5. Validate

```bash
bun run lint
```

Fix any errors before committing.

### 6. Submit

Commit your changes and open a pull request against the `master` branch.

## Lint Rules

| # | Check |
|---|-------|
| 1 | SKILL.md frontmatter must include `name` and `description` |
| 2 | `name` must match the directory name |
| 3 | `name` must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (1-64 chars) |
| 4 | `description` must be 1-1024 characters |
| 5 | Skills in registry.yaml must have a corresponding `skills/<name>/` directory |
| 6 | Directories under `skills/` must be registered in registry.yaml |

## CI

Lint runs automatically on push and pull requests to `master`.
