---
name: generate-changelog
description: Generate changelog entries for moflow-skills releases. Analyzes git changes since the last tag, identifies skill-level changes, and updates CHANGELOG.md and registry.yaml.
version: "1.0.0"
metadata:
  author: moflow
---

## What I Do

I prepare a release by generating a changelog entry. I handle:

1. Calculating the next version number (date-based: YYYY.M.D.N)
2. Detecting which skills were added, updated, or removed
3. Extracting per-skill and global commit messages
4. Updating CHANGELOG.md with the new version entry
5. Updating registry.yaml with the new version and date

## When to Use Me

Use me when preparing for a release, **before** running `bun run release`. After PRs are merged to master, activate this skill to generate the changelog entry. **This skill runs directly on the master branch.**

## Instructions

### 1. Run the changelog script

```bash
node .agents/skills/generate-changelog/scripts/changelog.mjs
```

This script will:
- Calculate the next version number
- Compare the current registry.yaml with the last tagged version
- Detect new, updated, and removed skills
- Insert a new entry at the top of CHANGELOG.md
- Update registry.yaml version and updated date

### 2. Review and complete the CHANGELOG.md entry

The script auto-generates the entry. You need to review and complete it:

- **New skills**: The script pulls the description from registry.yaml automatically. Verify it reads well.
- **Updated skills**: The script inserts a `TODO: describe what changed` placeholder. **You must replace it** with a brief description of what changed (e.g. `added API docs section`, `fixed typo in README section`). Refer to the commit messages listed below for context.
- **Removed skills**: No additional text needed, but verify correctness.
- Ensure version transitions are accurate

### 3. Validate

```bash
bun run lint
```

Fix any errors before committing.

### 4. Commit and push

```bash
git add CHANGELOG.md registry.yaml
git commit -m "chore: update changelog for v<VERSION>"
git push
```

Note: This runs directly on master (no branch needed for release preparation).

### 5. Release

```bash
bun run release
```

## Version Format

Release versions use date-based format: `YYYY.M.D.N`

- `YYYY.M.D` — release date
- `.N` — daily sequence number (1, 2, 3...), incremented for same-day releases

Examples: `2026.5.14.1`, `2026.5.14.2`, `2026.5.15.1`

The script automatically calculates the correct version by checking existing tags and registry.yaml.

## CHANGELOG.md Format

```markdown
## v2026.5.14.5

### Skills

- **documentation** v1.0.0 → v1.1.0 (updated)
  added API documentation guidelines and fixed typo
  - add API docs section
  - fix typo in README section
- **translation** v1.0.0 (new) — Translate text between languages with context awareness
  - add translation skill

### Changes

- update documentation skill
- add translation skill
```

Rules:
- `### Skills` section lists skill-level changes with version numbers
- For new skills: description from registry.yaml is auto-appended after `—`
- For updated skills: write a brief human-readable description of what changed (replace the `TODO` placeholder)
- For removed skills: show last version
- Commit messages are listed indented below each skill entry as reference
- `### Changes` section lists all commit messages globally

## Important Notes

- This skill lives in `.agents/skills/`, not `skills/` — it is NOT distributed to moflow users
- Only `bun run release` should create git tags and GitHub Releases — this skill only prepares CHANGELOG.md and registry.yaml
- If no skill changes are detected, the script will exit without modifying files — ask the user if they still want to create a release
- Always run `bun run lint` after making changes
