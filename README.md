# @flivideo/core

The shared rules of a FliVideo video project, in one small library that every Fli app consumes: FliStudio, FliHub,
FliCut, FliCast and Teletubby.

It knows where a brand's projects live on this machine, what makes a folder a project (`fli.studio.json`), how the
project layout and file names work, where an app keeps working files outside the project, and how an app is told which
brand and project to open. It holds no business logic and no app code.

- TypeScript, ESM, strict. Every shape is a [zod](https://zod.dev) schema with the type inferred from it.
- Runtime dependency: `zod` only.
- Source of the rules: FliStudio's spec §3–§5, roadmap §1 and open contract §5 — `~/dev/ad/flivideo/flistudio/docs/`
  (`specification.md`, `roadmap.md`, `open-contract.md`).

**Status:** active, v0.19.0 · True at v0.19.0 (2026-10-05)

## Install

Pin a tag. Never use a `file:` path.

```json
{
  "dependencies": {
    "@flivideo/core": "github:flivideo/fli-core#v0.19.0"
  }
}
```

The package builds itself on install (`prepare` → `tsc`), so the git dependency ships `dist/` without committing it.

```ts
import { parseAppFile, labPath, listProjects } from '@flivideo/core';
import { SystemStatus, AppBusyDetails } from '@flivideo/core/contracts'; // browser-safe: zod only, no node:*
```

Browser code (a renderer, a Vite bundle) imports from **`@flivideo/core/contracts`**: the agent-drivable layer and the
pure naming parsers, with no `node:*` in its import graph. The main entry reads the disk and will not bundle for a
browser. Both entries re-export `z` (zod 4): an app still on zod 3 declares its capability shapes with it.

## Exports

| Export                                                                                                                                                                                                                                                                                                                           | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Brand`, `readBrands(opts?)`, `resolveBrandRoot(brand, machine?, opts?)`, `brandFolderName(brand, machine?, opts?)`                                                                                                                                                                                                              | Brands from `~/.config/appydave/brands.json` (registry only). One bad entry is left out and listed in `skipped`, never sinking the rest. A brand root rewrites any `/Users/<anyone>` prefix to this machine's home (A5); `machine.brandRoots[key]` overrides it. `brandFolderName` is the root's basename (`guy-monroe` → `v-guy`)                                                                                                                                                                                                                                     |
| `ProjectIdentity`, `readIdentity(dir)`, `writeIdentity(dir, identity)`, `projectIntents(identity)`                                                                                                                                                                                                                               | `fli.studio.json` = `{ schema: 1, id, brand, code, name, createdAt, aspect?, languages?, shape? }`. Intents (B584): `aspect` `16:9` \| `9:16` \| `1:1`, `languages` ISO codes dominant first; `shape` `single` \| `shorts` \| `episodes` is a hint only (no behaviour yet; brains `video-as-code/project-folder-convention.md` §8). `projectIntents` fills the defaults (`16:9`, `["en"]`, `single`). Reads never throw (`null` / `valid` / `invalid`). Writes are atomic and refuse a different `id` or an unreadable existing file                                   |
| `parseProjectFolder(name)`, `projectFolderName(x)`                                                                                                                                                                                                                                                                               | `<code>-<slug>`: `a01-xmen` → `{ code: 'a01', slug: 'xmen' }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `parseRecording(name)`, `recordingFileName(x)`                                                                                                                                                                                                                                                                                   | `NN-S-slug[-TAGS].ext` → `{ chapter, segment, slug, tags, ext }` (FliHub's naming rules)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `parseVideoFile(name, videoName)`, `videoFileName(x)`                                                                                                                                                                                                                                                                            | `videos/<name>/<name>-<kind>[-<variant>].<ext>` — `flivideo-tour-audio-a100.m4a`; kinds `cut`, `final`, `audio-<treatment>`, `overlay-<variant>`; anything else is `unknown-kind`. Needs the video name to split (names may contain kind words). No numbers (ruling "B only", 2026-09-22)                                                                                                                                                                                                                                                                              |
| `parseVideoFolder(name)`, `videoFolderName(x)`                                                                                                                                                                                                                                                                                   | A video folder is its kebab name (`flivideo-tour`); legacy layout names (`first-edit`, `edits`, …) never parse as videos                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `parseAppFile(name)`, `appFileName(x)`                                                                                                                                                                                                                                                                                           | `fli.<app>[.<subject>].json` → `{ app, subject? }`. `project.json`, `meta.json`, `fli.json` are not app files                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `classifyProjectEntry(relPath, isDirectory?)`                                                                                                                                                                                                                                                                                    | Zone of a path in a project (`ProjectZone` — the values are in [docs/schema-mirror.md](docs/schema-mirror.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `projectLayout(projectDir)` / `projectLayoutPaths(projectDir)` (+ `…Sync`)                                                                                                                                                                                                                                                       | `'hub' \| 'legacy'`, self-healing (David 2026-09-23): `hub/recordings/` → hub; a top-level `recordings/`, `recording-transcripts/` or `transcripts/` → legacy; anything else (new, empty) → hub, so no marker folder is needed. `{ layout, recordings, transcripts }` — `hub/…` or legacy `recordings/` + `recording-transcripts/`; never merged                                                                                                                                                                                                                       |
| `listProjects(brandRoot)`                                                                                                                                                                                                                                                                                                        | Members (valid `fli.studio.json`), other folders, and the archive one level deep. Every collection is `scanned` with a `scannedAt` stamp or `unscanned` — never confused with empty                                                                                                                                                                                                                                                                                                                                                                                    |
| `resolveProject(brandRootOrListing, ref)`                                                                                                                                                                                                                                                                                        | Folder name, identity `id`, or a whole code → `found`; two or more matches → `ambiguous` with candidates; also `not-a-project`, `not-found`, `unscanned`                                                                                                                                                                                                                                                                                                                                                                                                               |
| `nextCode(listing, letter)`                                                                                                                                                                                                                                                                                                      | Next `<letter><NN>` after every live, other and archived code (archived ranges like `a01-a49` count whole); refuses when anything is unscanned                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `BrandSettings`, `readBrandSettings(brandRoot)`, `writeBrandSettings(brandRoot, settings)`                                                                                                                                                                                                                                       | `<brandRoot>/fli.brand.json` = `{ schema: 1, brand, colour, transcription?, gitignore?, publish?, youtube?, studioDefaults?, research? }` — `publish` is FliHub's old brand-config verbatim (loose), `youtube` the brand's playlist ids `{ activePlaylists, defaultPlaylists }`, `research` the brand's source switches `{ autocomplete? (absent = on), allowUnofficial? (absent = off) }` (v0.22.0)                                                                                                                                                                                                                                                                                                   |
| `MachineSettings`, `readMachineSettings(opts?)`                                                                                                                                                                                                                                                                                  | `~/.fli/machine.json` = `{ schema: 1, brandRoots?, labRoot?, apps? }`; missing → defaults (`labRoot` = `~/fli/lab`)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `labPath({ brandRoot \| brand, project, app, subject? }, machine?)`                                                                                                                                                                                                                                                              | `<labRoot>/<brand folder>/<code>-<project>/<app>/[<subject>/]`. Pass `brandRoot` (from `resolveBrandRoot`): the folder is its basename. `brand` (`appydave` → `v-appydave`) is right only when the root is named `v-<key>`. Never touches the disk. **`resolveLabPath` (v0.9.0)** is the one to call when opening a project: it finds the lab by _code_, renaming a lab left under an old project name into place (FC-40)                                                                                                                                              |
| `OpenContext`, `OpenArgs`, `parseOpenArgs(argv, env?, opts?)`                                                                                                                                                                                                                                                                    | The open contract: `--brand`, `--project`, `--video` (and `--x=value`), then `FLIVIDEO_BRAND` / `FLIVIDEO_PROJECT` / `FLIVIDEO_VIDEO`; argv wins. Returns `{ context, missing }`. Pure                                                                                                                                                                                                                                                                                                                                                                                 |
| `resolveOpenContext(args, { brands, machine?, home?, requireVideo? })`, `OpenContextResult`                                                                                                                                                                                                                                      | Door 2 end to end: `parseOpenArgs(...).context` → `resolved` with an `OpenContext`, or a refusal saying why (the codes are in [docs/schema-mirror.md](docs/schema-mirror.md)). Read-only; never falls back to another project                                                                                                                                                                                                                                                                                                                                          |
| `placeWindow(saved, displays, opts)`, `loadWindow(key)`, `saveWindow(key, state)` / `saveWindowSync`, `trackWindow(win, key, opts?)`, `windowKey(app, role)`, `importWindowState(old, keyOf)`, `windowStatePath()`                                                                                                               | Windows reopen where they were left (David 2026-09-22): ONE store `~/.fli/window-state.json` (the real home, not `$HOME`) keyed `<app>/<role>` (`flicut/main`, `flicast/editor`, `teletubby/prompter`). A spot is kept while its title strip is grabbable on a current display; a monitor that is gone → centred on the main screen, clamped, never off-screen. `keepSize: false` restores position only. `trackWindow` saves after a move/resize settles and synchronously on close. Electron-free: pass `screen` displays and the `BrowserWindow`. Saves never throw |
| Result schemas: `ProjectListing`, `MemberProject`, `OtherFolder`, `ArchivedEntry`, `ResolveProjectResult`, `NextCodeResult`, `ReadIdentityResult`, `WriteIdentityResult`, `ReadBrandsResult`, `ReadBrandSettingsResult`, `MachineSettingsResult`, `ParsedOpenArgs`, … and the factories `scanned`, `validFile`, `readFileResult` | Every value a function returns has a zod schema exported under the same name as its type, so an app declares capability outputs with them instead of copying the shape                                                                                                                                                                                                                                                                                                                                                                                                 |
| `FliCoreError`, `InvalidFile`, `ProjectZone`, `IDENTITY_FILE`, `VIDEO_FOLDER_PATTERN`, …                                                                                                                                                                                                                                         | Shared error type, constants and small schemas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

**`parseRecording` is stricter than FliHub's `parseRecordingFilename`** (the working definition), in four places:
it rejects segment `0` (`01-0-intro.mov`), an empty slug (`01-1.mov`) and uppercase in the slug (`01-1-Intro.mov`),
and it reads a zero-padded segment as a number, so `01-01-intro.mov` rebuilds as `01-1-intro.mov`. Pinned in
`test/naming.test.ts`.

Name builders (`…FileName`, `…FolderName`) and `labPath` throw `FliCoreError` on input they must not turn into a
name. Readers and resolvers never throw: they return typed results.

## The agent-drivable layer (v0.7.0)

Every Fli app gives agents the same surface as FliCast (checklist:
`~/dev/ad/flivideo/flicast/docs/agent-drivable-reference.md`). The app keeps its handlers; fli-core holds the
contract, the fence, the codes, the spec and the page, so no app hand-rolls them.

```ts
const CAPS = defineCapabilities({
  'project.empty-trash': defineCapability({
    kind: 'command',
    input,
    output,
    sideEffects: 'destructive',
    idempotent: true,
    confirmationRequired: true,
    failureModes: ['confirm-required'],
    humanOnly: true,
    description,
  }),
});
const CODES = defineFailureCodes({ 'confirm-required': -32002 }); // suite names keep their numbers
const gate = authorize('project.empty-trash', CAPS['project.empty-trash'], 'agent:claude', input); // → forbidden
```

- **Contract and fence**: `defineCapability` / `defineCapabilities`, `authorize(name, contract, principal, input)`.
  Principals are `human[:surface]`, `agent:<name>`, `cli`, named in the `x-fli-principal` header. `humanOnly` is
  `true` or `{ when(input), note }` (a dry run open to agents, `apply: true` a person's). The fence guides
  cooperating agents; the bearer token is what keeps other machines and web pages out.
- **Refusals are data**: `SUITE_FAILURE_CODES` keeps the numbers FliCast published; `defineFailureCodes` adds an
  app's own and throws on a clash; `assertAppendOnly` pins a published table. Typed details: `SUITE_REFUSAL_DETAILS`.
- **Discovery**: `controlFilePath(app)` (`~/Library/Application Support/<app>/control.json`), `writeControlFile`
  (0600), `readControlFile` (`live` / `stale` when the pid is gone / `absent` / `invalid`), `bearerMatches`.
- **Spec and door**: `toOpenRpc(...)` + `openRpcText` for a committed `api/openrpc.json`; `answerJsonRpc(body, seam,
{ codes })` answers JSON-RPC 2.0 with `data.failureMode` on every error.
- **Page**: `renderApiPage(doc)` is the read-only reference; `renderApiPage(doc, { console: { rpcPath } })` is the
  console — pick a verb, fill the fields, fire it as a principal, see the answer (human-only verbs refuse in front of
  you). `console.dryRun: true` adds a Dry run box (v0.7.1). Self-contained, light-only.
- **Lifecycle**: `LIFECYCLE_CAPABILITIES` (`system.status`, `system.quit`, `system.restart`; `force` is human-only;
  a busy app refuses `app-busy`) and `appScriptArgs(verb, open?)` for driving `scripts/app.sh` from outside.

## Asking FliTools for a transcript (v0.8.0)

FliTools (`~/dev/ad/flivideo/flitools`) is the one transcription service. Apps call it through this client, never
their own engine: `transcribeQueued(path, { app, project })` queues a recording (FliTools writes `json`/`srt`/`txt`
beside it), `transcriptFor(path, { app })` says whether a current transcript exists, `transcriptJobs({ project },
{ app })` reads the app's own queue. Each answers `ok`, `refused` (FliTools' named refusal) or `unavailable` (not
running) — never a throw. Node only: it reads FliTools' control file.

## Folder access — one pattern for every app (v0.10.0)

David approved it on 2026-09-24. Wherever an app shows a location, it shows two quiet icons right after it, in this
order: FliHub's outline **folder** ("Open in Finder") and **`>_`** ("Copy full path"). They stay hidden until the
line or row is pointed at, and are visible on touch screens and on keyboard focus. A copy confirms with a tick in place
of the icon for about a second, not a toast. A file opens Finder with the file selected. Clicking an icon never opens
the row.

The server half is `revealPath(abs, { roots })`. It opens a folder, or a file selected (`open -R`), and only inside
the roots the app passes (a brand root, a project), with links resolved. It answers `revealed` or `refused` with a
reason. A reveal raises a window on the person's screen, so make the capability that calls it ★ human-only. Each app
draws the icons in its own stack (there is no shared UI code): the icon, the words and the behaviour above are the
shared part.

## The word store (v0.11.0)

David ruled on 2026-09-24 that names, spelling rules and filler lists live in one store that FliStudio owns and every
app reads ("FliCut just uses the information. That way, the other tools can also use it"). It is one file,
`fli.words.json`, at up to three levels: **global** (`~/.config/appydave/`, may be empty), **brand** (`v-<brand>/`) and
**project**. A lower level wins on the same key and can turn off an entry it inherits.

`readWords({ globalFile, brandRoot, projectDir })` reads and merges them. It is a plain file read that never throws,
and a file it cannot use counts as empty. `vocabularyOf(words)` gives the names to hint to a transcriber;
`fillersOf(words, lang)` gives the fillers and the words that are never fillers. Corrections made inside an edit stay
in the edit: nothing here rewrites a transcript.

**Writing (v0.14.0+).** Every write goes through one function, `changeWordsFile(file, change)`: under a lock file beside
it (`fli.words.json.lock`) it re-reads the file, applies the pure `addWord` / `removeWord` to what is on disk now, and
writes atomically, so two writers never lose each other's entry. `addWordAt` / `removeWordAt` wrap it for one file;
`rememberWord(level, { globalFile, brandRoot, projectDir }, entry, by)` picks the file by level — `'project'` is
"remember for this video". FliStudio's `words.add` uses it; an app with no FliStudio running calls it directly, so
the rules are the same either way. A name sent with `merge: true` (v0.15.0) is "remember", not "set": the level's
existing mishearings and spelling for that term are kept and the new ones added, under the lock — so a caller never
merges by hand. An unusable file is refused (`unusable-file`), never overwritten; a held lock waits
up to 3 s then answers `busy`. The pattern across words, brand settings and resources is written up once in
`flivideo/docs/shared-data-levels.md`.

Every entry carries a **`Stamp`**, `{ at, by }`, where `by` is the principal the change came through (`human:ui`,
`cli`, `agent:<name>`). That is the answer to "who changed this, and when". It is a separate export so other stores
can adopt it.

## Video resources (v0.12.0)

Everything that belongs to a video: launch titles and thumbnails (many candidates, some chosen), description,
chapters, keywords, Skool links, affiliate slots, artefacts and private provenance. The design is flivideo
`docs/briefs/video-resources-model.md` (David approved the thin slice on 2026-09-27). It is one file,
`fli.resources.json`, with the same shape at global, brand and project level. The **registry** of kinds and groups is
data at every level, and a lower level wins or turns a row `off`. The resources themselves live at project level, each
with a `video`.

`readResources({ globalFile, brandRoot, projectDir })` merges the registry and returns the project's resources. It is a
plain file read and never throws. Only FliStudio writes the file, using the pure edits `addResource`, `updateResource`,
`tagResource`, `setResourceStatus` (which applies the choosing rules), `removeResource`, `addRegistryRow` and
`removeRegistryRow`, then `writeResourcesFile`.

Code knows only the value types (`ResourceValue`) and the choosing rules (`ResourceChoose`). A kind with no row is still
stored and falls into `other`. Every resource carries `added` and `changed` `Stamp`s.

## Transcription providers per level (v0.13.0)

`TranscriptionChoice` = `{ fast?, editGrade? }`, plain provider names (FliTools owns the list). It is optional on
`BrandSettings` (`fli.brand.json`) and on `ProjectIdentity` (`fli.studio.json`), so a rewrite of either file keeps it.
FliTools reads the levels (its own global `flitools.json` → brand → project); FliStudio's Settings → Transcription
writes the brand and project levels and sets the global one through FliTools' `config.set`.

## J / K / L — the shared speed keys (v0.16.0)

David (2026-10-05): J / K / L "feels like a global system... it probably should be part of Core." Lifted from FliCut
and FliCast unchanged; pure and browser-safe (`@flivideo/core/contracts`). Each app binds the keys itself.

| Export                                        | What                                                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORWARD_SPEEDS`                              | The ladder J / L climb: `0.25 0.5 0.75 1 1.5 2 2.5 3 3.5 4`                                                                                                                                                             |
| `jkl(state, 'J' \| 'K' \| 'L')`               | David's ruling d06 (2026-09-27): L paused → 1×, else one step faster (ceiling 4×); J paused → 0.75×, else one step slower (floor 0.25×); K → 1×, playing stays (a reverse stops). Both forward. Off-ladder counts as 1× |
| `shuttle(state, action)`, `MAX_SHUTTLE`       | The NLE shuttle (FliCast, FliEdit, FliCut's ⇧J): `playForward` / `playBackward` double to ±8×, `stop`, `togglePlay`                                                                                                     |
| `shuttleLabel(playing, rate)`, `ShuttleState` | The badge (`❚❚ 1×`, `▶▶ 2×`, `◀ 1×`) and the `{ playing, rate }` shape (signed rate)                                                                                                                                    |

## Ready for YouTube — the Publish rules (v0.17.0)

David's four rulings (2026-10-05, mock https://claude.ai/artifact/9hLAvSeF9b6DJWEX3yMEmP): the final video is a
**marker**, not a copy; **video, audio and captions are resource kinds** (`CORE_KINDS`, merged into every registry
with `from: 'core'`, `choose: 'one'`; a file row may restyle them); final thumbnails live in
`<project>/resources/<video>/`; marking published records the **YouTube id**.

| Export                                                                   | What                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publishReadiness(facts)`                                                | Pure. The app gathers `PublishFacts` (the video's exports with their `.srt`, the edit files, the resources, YLO's `launch.json` via `launchFacts`) and gets nine `PublishRow`s — video, audio, captions, thumbnail, title, description, chapters, studio, published — each with `state`, `value`, `file`, `by` and a one-line `why` |
| `PublishState`                                                           | `set` (a person's choice) · `suggested` (an agent's or the CLI's choice) · `inferred` (a rule: `by` is `rule:<id>`, `PUBLISH_RULES`) · `default` · `missing` · `stale`. `ready` counts the first four; `suggestions` counts `suggested` + `inferred`                                                                                |
| `promoteFile(file, { kind, video, path }, registry, by)`                 | The marker: that file's resource becomes `chosen` (added if new); the previous chosen goes back to `candidate`                                                                                                                                                                                                                      |
| `markPublished(file, video, youtubeId, by)`                              | The chosen video becomes `published` with `meta.{youtubeId, url, publishedAt}`; the video's other chosen resources go `published` too. `NoFinalVideo` without a final                                                                                                                                                               |
| `publishedVideos(resources)`                                             | The hook for later steps (post-publish posts, related-videos linking): every published video, newest first                                                                                                                                                                                                                          |
| `acceptableRows`, `isPersonChoice`, `parseYoutubeId`, `AUDIO_TREATMENTS` | Helpers                                                                                                                                                                                                                                                                                                                             |

v0.19.0: an export may carry a `source` ("generated render", "placed file") that the rows name instead of guessing an app from the file name; a `part` or `overlay` is never inferred as the final.

The rules: a choice wins; the video is the newest export of the newest edit (stale if the edit changed after it);
captions come from the same export with a matching length; YLO texts made before the final video are stale; the rules
never choose a thumbnail or the visibility.

## Video structure — zones, parts, series, renders, `.gitignore` (v0.18.0)

Workstream C part 1 of the video-structure plan (brains `video-as-code/video-structure-composable-rendering-plan.md`
§4C), with the workstream B rulings (2026-10-05). Nothing here moves a file or changes FliCut.

| Export                                                                                                                     | What                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classifyProjectEntry`, `describeProjectEntry(relPath, isDirectory?)`                                                      | New zones: `motion` `overlay` `voice` `avatar` `script` `framing` `assembly` (FliCut's `first-edit/`, or `edit/`) `renders` (`-renders/`); `cast` stays. `describeProjectEntry` adds the tier (`authored` `input` `generated` `regenerable` `output`) and, under `overlay/`, `chapter` / `variant` / `role`. `overlay/<chapter>/beats.json` is authored; `overlay/<chapter>/<variant>/spec.json` is generated; `first-edit/<x>/work/` is regenerable    |
| `part` video kind, `VideoPart`                                                                                             | `videos/<name>/<name>-part-<intro\|body\|outro>.<ext>`. `exportApp('part')` is `flicut`                                                                                                                                                                                                                                                                                                                                                                 |
| `cloneFile(source, dest)`                                                                                                  | A copy-on-write clone (APFS `clonefile`, like `cp -c`), a plain copy where the volume has none; never overwrites (`EEXIST`). For `export.place` of a `part`                                                                                                                                                                                                                                                                                             |
| `SERIES_CAPABILITIES`, `listSeries`, `readSeries`, `createSeries`, `changeSeries`, `addSeriesMember`, `removeSeriesMember` | `series.*` over `<brand root>/series/<id>/fli.series.json`: members are named by project `id` (not folder), ordered, never listed twice. Writes are locked + atomic. `fli.studio.json` is unchanged and `ProjectIdentity` stays **non-strict** (it strips unknown keys): series membership lives in the series file, so identity needs no new key, and passing unknown keys through would widen the exported type with an index signature for every app |
| `adoptIdentity(dir, input?)`                                                                                               | `project.adopt`: keeps an identity\'s `id` on a re-run (`kept`), updates `code` / `name` / intents under the same `id` (`updated`, e.g. `a05` → `b05`), creates one with a given or fresh `id`, refuses a different `id`                                                                                                                                                                                                                                |
| `rendersPath`, `rendersOf`, `clearRenders`, `FOLDER_HEAVY`                                                                 | R2: `<project>/-renders/<tool>/`. `rendersOf` is size per tool; `clearRenders(projectDir, { tool? })` empties it like trash (never follows a link; keeps `-renders/`); `FOLDER_HEAVY` is FliStudio\'s `TRASH_HEAVY` (hidden under 1 MB, amber over 500 MB). `labPath` / `resolveLabPath` are **deprecated**, kept only to find an old `~/fli/lab` for the migration                                                                                     |
| `renderGitignore`, `checkGitignore`, `gitignoreRender(brandRoot, { check? })`                                              | `gitignore.render`: one generated block between `# >>> BEGIN generated by fli gitignore.render` and `# <<< END generated`; hand rules outside it are untouched; deterministic, no machine text. Overlay in `fli.brand.json` `gitignore: [{ pattern, reason, note? }]`. `--check` writes nothing: `ok` / `drift` / `no-block` / `broken-markers`, plus the committed files the rules now ignore                                                          |
| `recipePathWarnings`, `recipePathWarningsIn(projectDir)`                                                                   | The ingest rule: a recipe may only reference paths inside its own project. Finds absolute, `~/`, `file://` and `../`-escaping paths in `overlay/**` and `framing/**` JSON                                                                                                                                                                                                                                                                               |

## Data shapes

Every exported schema, generated from the code with file:line anchors: [docs/schema-mirror.md](docs/schema-mirror.md)
(verify with `dev-team:schema-mirror`'s `verify_mirror.py docs/schema-mirror.json`).

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

## YouTube mirror (read side)

A local copy of a brand's channel, playlists with members and public videos, at `<mirrorRoot>/<brandKey>/` (`channel.json`,
`playlists.json`, `avatar.jpg` (the channel picture, v0.21.0), `videos/<id>/metadata.json` + `thumbnail.jpg`, `sync.json`). YouTube stays the truth; apps read the copy.
Design: `flivideo/docs/youtube-channel-architecture.md`.

| Export                                                                                       | What it does                                                                                                       |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `syncYouTubeChannel({ mirrorRoot, brandKey, channel: {id}\|{handle}, apiKey, fetch?, by? })` | Refresh one brand: `synced` / `failed` (record says why; last good files kept) / `busy`. Records quota units spent |
| `readYouTubeChannel`, `readYouTubePlaylists`, `readYouTubeSync`, `readYouTubeVideos`         | Read the copy; never-synced → `null` / empty                                                                       |
| `YouTubeReader`                                                                              | The read-only Data API v3 client (API key; If-None-Match on playlist members)                                      |
