# Changelog

## v2026.5.17.2

### Skills

- **markdown-ppt** v1.5.1 → v1.5.2 (updated)
  rename run_skill_script to runSkillScript
  - rename run_skill_script to runSkillScript across all files

### Changes

- rename run_skill_script to runSkillScript across all files

## v2026.5.17.1

### Skills

- **markdown-ppt** v1.5.0 → v1.5.1 (updated)
  unify input param name to <input.md> in docs
  - update(markdown-ppt): unify input param name to <input.md> in docs

### Changes

- update(markdown-ppt): unify input param name to <input.md> in docs

## v2026.5.16.1

### Skills

- **markdown-ppt** v1.4.0 → v1.5.0 (updated)
  update --help output to use run_skill_script format instead of bun/node CLI
  - Enforce run_skill_script format in script --help output

### Changes

- Merge pull request #2 from xmm1989218/update/markdown-ppt
- Enforce run_skill_script format in script --help output

## v2026.5.15.4

### Skills

- **markdown-ppt** v1.3.0 → v1.4.0 (updated)
  update script invocation to use run_skill_script tool instead of bash commands

### Changes

- fix: SKILL.md and docs use run_skill_script tool for script execution instead of bash

## v2026.5.15.3

### Skills

- **markdown-ppt** v1.2.0 → v1.3.0 (updated)
  add --help and --output flags to convert.js; enforce --help support in lint

### Changes

- feat: add lint check 12 — .js scripts must support --help
- feat: add --help and --output flags to convert.js

## v2026.5.15.2

### Skills

- **markdown-ppt** v1.1.1 → v1.2.0 (updated)
  fix cross-platform script execution using bunx instead of direct bin path

### Changes

- fix: convert.js use bunx for cross-platform CLI resolution

## v2026.5.15.1

### Skills

- **markdown-ppt** v1.1.0 → v1.1.1 (updated)
  use bun instead of node for script execution

### Changes

- chore: use bun instead of node for script execution in all skill documentation

## v2026.5.14.6

### Skills

- **markdown-ppt** v1.0.0 → v1.1.0 (updated)
  add package.json dependency management and convert.js cross-platform support; restrict scripts to .js only

### Changes

- feat: restrict scripts to .js only, add package.json/bun.lock dependency management, add lint checks 9/10/11
- fix: replace convert.sh with convert.js for cross-platform support

## v2026.5.14.5

### Skills

- **markdown-ppt** v1.0.0 (new) — Convert Markdown to HTML/PDF presentations using Marp. Guides writing slide-ready Markdown and provides a conversion script.
  - add Marp syntax guide, writing guidelines, and example presentation
  - add cross-platform conversion script (convert.js)

### Changes

- fix: replace convert.sh with convert.js for cross-platform support
- feat: add markdown-ppt skill for Marp presentation generation
- feat: enforce branch + MR workflow for creating and updating skills

## v2026.5.14.4

### Skills

- **documentation** v1.0.0 (new) — Write clear, well-structured technical documentation. Use when writing README, API docs, architecture docs, or any technical documentation.

### Changes

- init: scaffold moflow-skills repo with lint, CI, and documentation skill
- feat: add semver versioning, version drift detection, release script
- feat: use date-based version format (YYYY.M.D.N) for releases
- feat: create release as draft
- fix: release version considers existing registry.yaml version
- fix: use --notes-file for release and preserve registry.yaml format
- fix: suppress git describe stderr in release script
