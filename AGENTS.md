# AGENTS.md

## Project

Home navigator application lives in `usecases-home/`.
Use case apps live under `usecases/`.

The home app is the entrypoint for:

- navigating to all use case demos
- quick guidance (how to use the demos)
- wallet setup/download links
- credential issuance guidance
- general Vidos context

JIT packages: server + shared export `.ts` source directly; no build step required.

## Commands

```bash
bun run build        # workspace build tasks
bun run check-types  # type-check all workspaces
bun run lint         # biome lint
bun run format       # biome format --write
bunx shadcn@latest add <component> --cwd <path_to_workspace> --path src/components/ui # add shadcn component to workspace
```

Do not run long-lived dev servers unless explicitly requested.

## Workspace Rules

- Keep use case-specific code under `usecases/<name>/`.
- Keep shared homepage/navigation content under `usecases-home/`.
- Prefer relative imports, except for Shadcn components that have TS Path aliases imports.

## Style

- Biome formatting: tabs + double quotes.
- TypeScript strict mode.
- Keep shared schemas as source of truth; derive types from Zod.
- Do not edit generated files unless explicitly asked.
- Keep files and components small. One component per file; extract early.
