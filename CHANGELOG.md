# Changelog

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
