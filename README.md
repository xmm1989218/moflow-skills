# moflow-skills

Remote skill repository for [MoFlow](https://github.com/xmm1989218/moflow), following the [agentskills.io](https://agentskills.io) open standard.

## Structure

```
skills/                  # Distributable skills (registered in registry.yaml)
  documentation/         # Technical documentation writing
.agents/skills/          # Dev-only skills for coding agents
  create-skill/          # Scaffold new skills
registry.yaml            # Skill index
scripts/lint.mjs         # Validation script
```

## Quick Start

```bash
bun install
bun run lint
```

## Adding a Skill

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions.

1. Create `skills/<name>/SKILL.md`
2. Register in `registry.yaml`
3. Run `bun run lint`
4. Open a pull request
