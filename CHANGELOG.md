# Changelog

## v2026.5.14.4

### Skills

- **documentation** v1.0.0 (new)

### Changes

- init: scaffold moflow-skills repo with lint, CI, and documentation skill
- feat: add semver versioning, version drift detection, release script
- feat: use date-based version format (YYYY.M.D.N) for releases
- feat: create release as draft
- fix: release version considers existing registry.yaml version
- fix: use --notes-file for release and preserve registry.yaml format
- fix: suppress git describe stderr in release script
