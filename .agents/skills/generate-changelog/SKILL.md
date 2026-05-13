---
name: generate-changelog
description: Generate changelog entries for moflow-skills releases. Analyzes git changes since the last tag, identifies skill-level changes, and updates CHANGELOG.md and registry.yaml.
version: "1.0.0"
metadata:
  author: moflow
---

## What I Do

I prepare a release by generating a changelog entry. I handle:

1. Analyzing git changes since the last release tag
2. Identifying which skills were added, updated, or removed
3. Writing a new version entry in CHANGELOG.md
4. Updating registry.yaml with the new version and date
5. Running `bun run lint` to validate

## When to Use Me

Use me when preparing for a release, **before** running `bun run release`. After PRs are merged to master, activate this skill to generate the changelog entry.

## Version Format

Release versions use date-based format: `YYYY.M.D.N`

- `YYYY.M.D` — release date
- `.N` — daily sequence number (1, 2, 3...), incremented for same-day releases

Examples: `2026.5.14.1`, `2026.5.14.2`, `2026.5.15.1`

## How to Determine the Next Version

1. Get today's date: `YYYY.M.D`
2. Check existing git tags: `git tag -l "vYYYY.M.D.*"`
3. Check registry.yaml current version — if it's today's date, use its sequence number as baseline
4. Next version = `YYYY.M.D.(max(existing tags count, registry sequence) + 1)`

## Workflow

Follow these steps in order:

### 1. Find the last release tag

```bash
git describe --tags --abbrev=0
```

If no tags exist, this is the first release.

### 2. Identify skill-level changes

```bash
# Get list of changed files under skills/
git diff --name-only <lastTag>...HEAD -- skills/
```

Extract unique skill directory names from the paths.

### 3. Compare registry.yaml at last tag vs current

```bash
# Get old registry
git show <lastTag>:registry.yaml
```

Compare the `skills` list between old and current registry to detect:

| Type | Detection |
|------|-----------|
| **new** | Skill exists in current but not in old |
| **updated** | Skill exists in both, but version differs |
| **removed** | Skill exists in old but not in current |

### 4. Get per-skill commit details

For each changed skill:

```bash
git log <lastTag>..HEAD --pretty=format:"- %s" -- skills/<name>/
```

### 5. Write CHANGELOG.md entry

Insert a new section at the top (after the `# Changelog` heading):

```markdown
## v<VERSION>

### Skills

- **<name>** v1.0.0 (new)
- **<name>** v1.0.0 → v1.1.0 (updated)
  - specific change from git log
  - another change from git log
- **<name>** v1.0.0 (removed)

### Changes

- global commit message 1
- global commit message 2
```

Get global changes with:

```bash
git log <lastTag>..HEAD --pretty=format:"- %s"
```

### 6. Update registry.yaml

Update two fields:

```yaml
version: "<VERSION>"     # The new date-based version
updated: "YYYY-MM-DD"    # Today's date
```

Use string replacement on the existing file to preserve formatting:

- Replace the `version:` line
- Replace the `updated:` line

**Do NOT use yaml.dump** — it will reformat the file and lose quotes/formatting.

### 7. Validate

```bash
bun run lint
```

Fix any errors before committing.

### 8. Commit

```bash
git add CHANGELOG.md registry.yaml
git commit -m "chore: update changelog for v<VERSION>"
git push
```

## Changelog Format Rules

- Each version entry starts with `## v<VERSION>`
- `### Skills` section lists skill-level changes with version numbers
- `### Changes` section lists all commit messages
- For updated skills, show the version transition (`v1.0.0 → v1.1.0`)
- For updated skills, list specific commit messages indented under the skill entry
- For new skills, just show the initial version
- For removed skills, show the last version
- Keep descriptions concise and user-facing

## Important Notes

- This skill lives in `.agents/skills/`, not `skills/` — it is NOT distributed to moflow users
- Only `bun run release` should create git tags and GitHub Releases — this skill only prepares CHANGELOG.md and registry.yaml
- If no skill changes are detected, ask the user if they still want to create a release
- Always run `bun run lint` after making changes
