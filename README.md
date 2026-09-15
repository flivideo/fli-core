# @flivideo/core

The shared rules of a FliVideo video project, in one small library that every Fli app consumes: FliStudio, FliHub,
FliCut, FliCast and Teletubby.

It knows where a brand's projects live on this machine, what makes a folder a project (`fli.studio.json`), how the
project layout and file names work, where an app keeps working files outside the project, and how an app is told which
brand and project to open. It holds no business logic and no app code.

- TypeScript, ESM, strict. Every shape is a [zod](https://zod.dev) schema with the type inferred from it.
- Runtime dependency: `zod` only.
- Source of the rules: FliStudio `docs/specification.md` §3–§5, `docs/roadmap.md` §1, `docs/open-contract.md` §5.

## Install

Pin a tag. Never use a `file:` path.

```json
{
  "dependencies": {
    "@flivideo/core": "github:flivideo/fli-core#v0.1.0"
  }
}
```

The package builds itself on install (`prepare` → `tsc`), so the git dependency ships `dist/` without committing it.

```ts
import { parseAppFile, labPath, listProjects } from '@flivideo/core';
```

## Exports

| Export                                                                                                                                                                                                                                                                                                                           | What                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Brand`, `readBrands(opts?)`, `resolveBrandRoot(brand, machine?, opts?)`, `brandFolderName(brand, machine?, opts?)`                                                                                                                                                                                                              | Brands from `~/.config/appydave/brands.json` (registry only). One bad entry is left out and listed in `skipped`, never sinking the rest. A brand root rewrites any `/Users/<anyone>` prefix to this machine's home (A5); `machine.brandRoots[key]` overrides it. `brandFolderName` is the root's basename (`guy-monroe` → `v-guy`) |
| `ProjectIdentity`, `readIdentity(dir)`, `writeIdentity(dir, identity)`                                                                                                                                                                                                                                                           | `fli.studio.json` = `{ schema: 1, id, brand, code, name, createdAt }`. Reads never throw (`null` / `valid` / `invalid`). Writes are atomic and refuse a different `id` or an unreadable existing file                                                                                                                              |
| `parseProjectFolder(name)`, `projectFolderName(x)`                                                                                                                                                                                                                                                                               | `<code>-<slug>`: `a01-xmen` → `{ code: 'a01', slug: 'xmen' }`                                                                                                                                                                                                                                                                      |
| `parseRecording(name)`, `recordingFileName(x)`                                                                                                                                                                                                                                                                                   | `NN-S-slug[-TAGS].ext` → `{ chapter, segment, slug, tags, ext }` (FliHub's naming rules)                                                                                                                                                                                                                                           |
| `parseVideoFile(name)`, `videoFileName(x)`                                                                                                                                                                                                                                                                                       | `<NN>-<kind>[-<variant>].<ext>` for `cut`, `audio-<treatment>`, `overlay-<variant>`, `final`; anything else is `unknown-kind`                                                                                                                                                                                                      |
| `parseVideoFolder(name)`, `videoFolderName(x)`                                                                                                                                                                                                                                                                                   | `videos/<NN>-<name>/`                                                                                                                                                                                                                                                                                                              |
| `parseAppFile(name)`, `appFileName(x)`                                                                                                                                                                                                                                                                                           | `fli.<app>[.<subject>].json` → `{ app, subject? }`. `project.json`, `meta.json`, `fli.json` are not app files                                                                                                                                                                                                                      |
| `classifyProjectEntry(relPath, isDirectory?)`                                                                                                                                                                                                                                                                                    | Zone of a path in a project: `identity`, `app-decisions`, `recordings`, `transcripts` (also `recording-transcripts/`), `cast`, `videos`, `legacy`, `other`                                                                                                                                                                         |
| `listProjects(brandRoot)`                                                                                                                                                                                                                                                                                                        | Members (valid `fli.studio.json`), other folders, and the archive one level deep. Every collection is `scanned` with a `scannedAt` stamp or `unscanned` — never confused with empty                                                                                                                                                |
| `resolveProject(brandRootOrListing, ref)`                                                                                                                                                                                                                                                                                        | Folder name, identity `id`, or a whole code → `found`; two or more matches → `ambiguous` with candidates; also `not-a-project`, `not-found`, `unscanned`                                                                                                                                                                           |
| `nextCode(listing, letter)`                                                                                                                                                                                                                                                                                                      | Next `<letter><NN>` after every live, other and archived code (archived ranges like `a01-a49` count whole); refuses when anything is unscanned                                                                                                                                                                                     |
| `BrandSettings`, `readBrandSettings(brandRoot)`                                                                                                                                                                                                                                                                                  | `<brandRoot>/fli.brand.json` = `{ schema: 1, brand, colour }`                                                                                                                                                                                                                                                                      |
| `MachineSettings`, `readMachineSettings(opts?)`                                                                                                                                                                                                                                                                                  | `~/.fli/machine.json` = `{ schema: 1, brandRoots?, labRoot?, apps? }`; missing → defaults (`labRoot` = `~/fli/lab`)                                                                                                                                                                                                                |
| `labPath({ brandRoot \| brand, project, app, subject? }, machine?)`                                                                                                                                                                                                                                                              | `<labRoot>/<brand folder>/<code>-<project>/<app>/[<subject>/]`. Pass `brandRoot` (from `resolveBrandRoot`): the folder is its basename. `brand` (`appydave` → `v-appydave`) is right only when the root is named `v-<key>`. Never touches the disk                                                                                 |
| `OpenContext`, `OpenArgs`, `parseOpenArgs(argv, env?, opts?)`                                                                                                                                                                                                                                                                    | The open contract: `--brand`, `--project`, `--video` (and `--x=value`), then `FLIVIDEO_BRAND` / `FLIVIDEO_PROJECT` / `FLIVIDEO_VIDEO`; argv wins. Returns `{ context, missing }`. Pure                                                                                                                                             |
| `resolveOpenContext(args, { brands, machine?, home?, requireVideo? })`, `OpenContextResult`                                                                                                                                                                                                                                      | Door 2 end to end: `parseOpenArgs(...).context` → `resolved` with an `OpenContext`, or a refusal saying why: `missing`, `video-invalid`, `unknown-brand`, `no-brand-root`, `project-refused` (the `resolveProject` refusal), `video-not-found`. Read-only; never falls back to another project                                     |
| Result schemas: `ProjectListing`, `MemberProject`, `OtherFolder`, `ArchivedEntry`, `ResolveProjectResult`, `NextCodeResult`, `ReadIdentityResult`, `WriteIdentityResult`, `ReadBrandsResult`, `ReadBrandSettingsResult`, `MachineSettingsResult`, `ParsedOpenArgs`, … and the factories `scanned`, `validFile`, `readFileResult` | Every value a function returns has a zod schema exported under the same name as its type, so an app declares capability outputs with them instead of copying the shape                                                                                                                                                             |
| `FliCoreError`, `InvalidFile`, `ProjectZone`, `IDENTITY_FILE`, `VIDEO_FOLDER_PATTERN`, …                                                                                                                                                                                                                                         | Shared error type, constants and small schemas                                                                                                                                                                                                                                                                                     |

**`parseRecording` is stricter than FliHub's `parseRecordingFilename`** (the working definition), in four places:
it rejects segment `0` (`01-0-intro.mov`), an empty slug (`01-1.mov`) and uppercase in the slug (`01-1-Intro.mov`),
and it reads a zero-padded segment as a number, so `01-01-intro.mov` rebuilds as `01-1-intro.mov`. Pinned in
`test/naming.test.ts`.

Name builders (`…FileName`, `…FolderName`) and `labPath` throw `FliCoreError` on input they must not turn into a
name. Readers and resolvers never throw: they return typed results.

## Develop

```bash
npm install
npm test              # vitest + v8 coverage; fails below 90% lines
npm run typecheck
npm run lint          # eslint, zero warnings; src/ may import only relative modules, zod and node:*
npm run format:check
npm run build
```

**Tests never touch the live estate.** Every fixture tree is built in a temp directory under `os.tmpdir()` and removed
after the test, and every test file runs with `HOME` pointed at an empty temp directory, so no default path can reach
the real `~/dev/video-projects`, `~/.config/appydave` or `~/.fli`.

## License

MIT
