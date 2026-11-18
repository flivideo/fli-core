# @flivideo/core

**The shared rules of a FliVideo video project, in one small library every Fli app consumes** — so FliStudio, FliHub,
FliCut, FliCast, Teletubby, FliEdit and FliTools agree on what a project is without copying each other's code.

```ts
import { readBrands, resolveBrandRoot, listProjects, parseProjectFolder } from '@flivideo/core';

parseProjectFolder('a01-xmen'); // → { code: 'a01', slug: 'xmen' }
```

It knows where a brand's projects live on a machine, what makes a folder a project (`fli.studio.json`), how the project
layout and file names work, where an app keeps working files outside the project, and how an app is told which brand
and project to open. It also holds the suite's shared agent-drivable layer (capability contracts, the human-only fence,
failure codes, OpenRPC and the API page) and the `describe/1` document an app answers at `/describe` and draws at `/map`.
It holds no business logic and no app code.

- TypeScript, ESM, strict. Every shape is a [zod](https://zod.dev) schema with the type inferred from it. The only
  runtime dependency is `zod`; `react` is an optional peer, needed only by the UI entry point.
- Readers and resolvers never throw: they return typed results. Name builders throw `FliCoreError` on input they must
  not turn into a name.

## Install

Pin a tag. Never use a `file:` path.

```json
{ "dependencies": { "@flivideo/core": "github:flivideo/fli-core#v0.42.0" } }
```

The package builds itself on install (`prepare` runs `tsc`), so the git dependency ships `dist/` without committing it.
**Needs:** Node (see `engines` in `package.json`).

## Entry points

| Import | For |
| --- | --- |
| `@flivideo/core` | The whole library. Reads the disk, so it will not bundle for a browser |
| `@flivideo/core/contracts` | Browser-safe: the agent-drivable layer and the pure naming parsers, no `node:*` in its graph |
| `@flivideo/core/ui` · `./ui/speed.css` | Shared React UI (the speed control); the only entry that imports `react` |
| `@flivideo/core/serve` | Reading who called through Tailscale Serve |

Both main entries re-export `z` (zod 4), so an app on zod 3 declares its capability shapes with it.

## What is in it

Each area is described, with its exports and the version it arrived in, in
[docs/api-reference.md](docs/api-reference.md):

- **Estate**: brands, project identity, project folder and file naming, layout (`hub` or legacy), project listing and
  resolving, lab paths, window state, the open contract (`--brand`, `--project`, `--video`).
- **Agent-drivable layer**: `defineCapability`, `authorize`, failure codes, control files, OpenRPC, the API page and the
  lifecycle verbs.
- **Per-project data**: the word store, video resources, the Publish rules, groups and series, renders, `.gitignore`
  rules, fli-notes, brand settings.
- **Clients**: FliTools' transcript queue, a read-side mirror of a brand's YouTube channel.

## Docs

| Read | For |
| --- | --- |
| [docs/schema-mirror.md](docs/schema-mirror.md) | Every exported schema and closed set, generated from the code with `file:line` anchors |
| [docs/api-reference.md](docs/api-reference.md) | The exports by area |
| [docs/brand-settings-folders.md](docs/brand-settings-folders.md) | Which brand folders are settings, not projects |
| [docs/point-and-tell.md](docs/point-and-tell.md) | Marking a moment in an app and sending it to a live Claude conversation |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release since v0.26.0 |

## Develop

```bash
npm install && npm test && npm run typecheck && npm run lint && npm run build
```

Tests never touch a live estate: every fixture is built in a temp directory and every test file runs with `HOME` pointed
at an empty one.

## Suite

Part of the FliVideo suite — map: [flivideo/flivideo](https://github.com/flivideo/flivideo#readme). Consumers: FliStudio ·
FliHub · FliCut · FliCast · Teletubby · FliEdit · FliTools.

## Status

**Active; tagged releases, consumers pin a tag.** True at `82f2594` (2026-11-18).

Public repo `flivideo/fli-core` · MIT, see [LICENSE](LICENSE)
