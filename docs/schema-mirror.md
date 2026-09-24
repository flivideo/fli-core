# Schema mirror

> Generated from the code, not written about it. Do not hand-edit — every line below is anchored to a `file:line` and is re-derived on every run. `verify_mirror.py` fails when this page no longer matches its JSON. To record a gap the extractor cannot find, use `docs/schema-mirror.known-gaps.json`.

- **stack** `typescript` · **extractor** `extract_typescript.py`
- **commit** `22adda946569` · **generated** 2026-09-24T01:40:49+00:00
- **scope** include `src/**` · exclude `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `*.stories.tsx`, `*.config.ts`, `*/test/*`, `*/tests/*`, `*/__tests__/*`, `*/e2e/*`, `*/__mocks__/*`, `*/fixtures/*`, `*.d.ts`, `*/dist/*`, `*/build/*`, `*/out/*`
- **zod bound** in 22 file(s) by a direct import, 0 through a re-export, 0 by call shape only

| shapes | declared sets | derived sets | gaps | declared but not read | findings |
|---|---|---|---|---|---|
| 150 | 36 | 2 | 4 | 15 | 2 |

> **Read the gaps, the census and the never-read list before trusting the shape.** Derived sets have no declaring symbol and will drift silently. Gaps are things this mirror could not reach — they are not absences in the code.

## Index

Top-level entries by file, with the line each is declared on. Search the page for the name.

- `src/api-page.ts` — `ApiPageOptions` :16
- `src/app-file.ts` — `AppName` :15 · `AppSubject` :19 · `AppFile` :26
- `src/brand-settings.ts` — `BrandSettings` :9
- `src/brands.ts` — `Brand` :9 · `RegistryEntry` :20 · `BrandsFile` :28 · `SkippedBrand` :32 · `BrandsRead` :35 · `ReadBrandsResult` :45 · `ReadBrandsOptions` :48 · `ResolveBrandRootOptions` :92
- `src/capability.ts` — `PrincipalKind` (set) :17 · `PrincipalName` :20 · `CapabilityKind` (set) :35 · `SideEffects` (set) :39 · `ExpectedDuration` (set) :47 · `CapabilityName` :51 · `HumanOnlyWhen` :59 · `CapabilityContract` :61 · `Authorization` :122 · `CapabilityMeta` :187
- `src/classify.ts` — `ProjectZone` (set) :11 · `LEGACY_FOLDERS` (set) :36 · `ProjectLayout` (set) :97 · `ProjectLayoutPaths` :100
- `src/control-file.ts` — `ControlFile` :18 · `ControlFileRead` :30 · `ControlFileOptions` :39
- `src/estate.ts` — `scanned()` :17 · `MemberProject` :31 · `OtherFolder` :41 · `ArchivedEntry` :53 · `ProjectListing` :66 · `ProjectFound` :189 · `ProjectAmbiguous` :195 · `ProjectNotAProject` :201 · `ProjectNotFound` :206 · `ProjectUnscanned` :207 · `ProjectRefusal` :215 · `ResolveProjectResult` :223 · `NextCodeResult` :280
- `src/failure-codes.ts` — `FailureCodeTable` :52 · `Refusal` :132 · `ForbiddenDetails` :140 · `MissingDetails` :149 · `BusyWork` :153 · `AppBusyDetails` :160
- `src/flitools.ts` — `TranscriptFiles` :13 · `TranscriptJobStatus` (set) :16 · `TranscriptJob` :20 · `TranscriptFound` :35 · `FliToolsAnswer` :44 · `FliToolsOptions` :49 · `TranscribeOptions` :58
- `src/fs-utils.ts` — `NO_HARD_LINKS` (set) :32
- `src/identity.ts` — `ProjectAspect` (set) :11 · `ProjectShape` (set) :21 · `ProjectLanguage` :26 · `ProjectIdentity` :29 · `Refused()` :53 · `WriteIdentityResult` :61
- `src/lab-path.ts` — `PathSegment` :8 · `LabPathInput` :16 · `ResolvedLabPath` :79
- `src/lifecycle.ts` — `LifecycleVerb` (set) :18 · `SystemStatus` :21 · `SystemQuitInput` :34 · `SystemQuitOutput` :40 · `AppScriptOpen` :84
- `src/machine.ts` — `AbsolutePath` :7 · `MachineSettings` :12 · `ResolvedMachineSettings` :24 · `MachineSettingsOptions` :27 · `MachineSettingsResult` :32
- `src/open-args.ts` — `OpenContext` :11 · `OpenArgs` :27 · `OpenArgName` (set) :36 · `RawOpenArgs` :40 · `ParseOpenArgsOptions` :53 · `ParsedOpenArgs` :58
- `src/open-context.ts` — `OpenContextResult` :16 · `ResolveOpenContextOptions` :33
- `src/openrpc.ts` — `OpenRpcServer` :18 · `OpenRpcDocument` :29 · `OpenRpcOptions` :52 · `JsonRpcRequest` :174 · `CallAnswer` :183 · `JsonRpcOptions` :185
- `src/project-folder.ts` — `ProjectCode` :5 · `KebabSlug` :11 · `ProjectFolder` :15
- `src/recording.ts` — `RecordingTag` :14 · `Recording` :18
- `src/results.ts` — `InvalidFile` :4 · `validFile()` :13 · `readFileResult()` :19
- `src/reveal.ts` — `RevealResult` :13 · `RevealOptions` :24
- `src/video-file.ts` — `Ext` :14 · `VideoFileKind` (set) :16 · `VideoFile` :19 · `UnknownVideoFile` :32 · `ParsedVideoFile` :39 · `VideoFolder` :74 · `VideoFolderName` :86
- `src/window-state.ts` — `WindowRect` :16 · `SavedWindow` :24 · `WindowStateFile` :32 · `DisplayArea` :39 · `PlaceOptions` :47 · `TrackedWindow` :255 · `TrackOptions` :264

## Never read by this extractor

These constructs are outside what this extractor reads **on every run, in every repo**. A page with no gaps is still partial by exactly this list.

- classes - a class's fields are never mirrored (the census lists each one)
- generic, mapped and conditional type aliases
- template-literal types, and unions that contain one
- aliases of another type or value (`X = Y`), and utility-type aliases (`Pick<>`, `Omit<>`, `Record<>`)
- `keyof typeof X` / indexed-access types, unless X itself is read as a closed set
- results of `.pick` / `.omit` / `.partial` / `.required` (listed as gaps where met)
- zod schemas built inside function bodies, other than a function that returns one zod expression
- the parameterised result of a schema helper or factory call (listed as gaps where met)
- constants that are not exported (the census does not count them)
- `*.d.ts` files and build output (`dist/`, `build/`, `out/`) - excluded by default
- regex-encoded sets, JSON Schema files, and the data actually on disk

## Coverage census

**191** top-level declarations counted = **172** mirrored + **4** listed as gaps + **15** declared but not read.

Counted: every top-level interface, enum, class and type alias (exported or not) and every exported constant, in the files in scope.
Not counted, as not schema-bearing: 1 function, 9 literal constants.

| file | declared | mirrored | gaps | not read |
|---|---|---|---|---|
| `src/capability.ts` | 17 | 16 | 0 | **1** |
| `src/classify.ts` | 8 | 7 | 0 | **1** |
| `src/estate.ts` | 15 | 14 | 0 | **1** |
| `src/failure-codes.ts` | 18 | 12 | 0 | **6** |
| `src/identity.ts` | 12 | 9 | 2 | **1** |
| `src/lifecycle.ts` | 11 | 10 | 0 | **1** |
| `src/open-args.ts` | 12 | 11 | 0 | **1** |
| `src/results.ts` | 5 | 2 | 0 | **3** |

## Closed sets — declared

One symbol states each set. Adding a member changes that symbol, so these cannot drift.

### `src/brands.ReadBrandsResult.kind` — `src/brands.ts:45`

*the `kind` discriminator of the union `ReadBrandsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `valid` | `src/brands.ts:36` |
| `invalid` | `src/results.ts:5` |

### `src/capability.PrincipalKind` — `src/capability.ts:17`

Who is calling, by kind. The principal NAME is `human` or `human:<surface>`, `agent:<name>`, or `cli`.

*`z.enum` `PrincipalKind` - a single declaring symbol*

*aliases* `PrincipalKind` `src/capability.ts:18`

| value | declared at |
|---|---|
| `human` | `src/capability.ts:17` |
| `agent` | `src/capability.ts:17` |
| `cli` | `src/capability.ts:17` |

### `src/capability.CapabilityKind` — `src/capability.ts:35`

*`z.enum` `CapabilityKind` - a single declaring symbol*

*aliases* `CapabilityKind` `src/capability.ts:36`

| value | declared at |
|---|---|
| `query` | `src/capability.ts:35` |
| `command` | `src/capability.ts:35` |
| `task` | `src/capability.ts:35` |
| `event` | `src/capability.ts:35` |

### `src/capability.SideEffects` — `src/capability.ts:39-44`

What calling it does to the world: nothing, an edit that can be taken back, one that cannot, or something outside.

*`z.enum` `SideEffects` - a single declaring symbol*

*aliases* `SideEffects` `src/capability.ts:45`

| value | declared at |
|---|---|
| `read-only` | `src/capability.ts:40` |
| `reversible-write` | `src/capability.ts:41` |
| `destructive` | `src/capability.ts:42` |
| `external-side-effect` | `src/capability.ts:43` |

### `src/capability.ExpectedDuration` — `src/capability.ts:47`

*`z.enum` `ExpectedDuration` - a single declaring symbol*

*aliases* `ExpectedDuration` `src/capability.ts:48`

| value | declared at |
|---|---|
| `fast` | `src/capability.ts:47` |
| `slow` | `src/capability.ts:47` |

### `src/capability.Authorization.ok` — `src/capability.ts:122`

*the `ok` discriminator of union type `Authorization` - each value declared by a literal type in one variant*

| value | declared at |
|---|---|
| `true` | `src/capability.ts:122` |
| `false` | `src/capability.ts:122` |

### `src/classify.ProjectZone` — `src/classify.ts:11-22`

Which zone of the project layout (spec §3, roadmap §1) a path inside a project belongs to.

*`z.enum` `ProjectZone` - a single declaring symbol*

*aliases* `ProjectZone` `src/classify.ts:25`

| value | declared at |
|---|---|
| `identity` | `src/classify.ts:12` |
| `app-decisions` | `src/classify.ts:13` |
| `recordings` | `src/classify.ts:14` |
| `transcripts` | `src/classify.ts:15` |
| `cast` | `src/classify.ts:16` |
| `videos` | `src/classify.ts:17` |
| `legacy` | `src/classify.ts:18` |
| `trash` | `src/classify.ts:20` |
| `other` | `src/classify.ts:21` |

### `src/classify.ProjectLayout` — `src/classify.ts:97`

*`z.enum` `ProjectLayout` - a single declaring symbol*

*aliases* `ProjectLayout` `src/classify.ts:98`

| value | declared at |
|---|---|
| `hub` | `src/classify.ts:97` |
| `legacy` | `src/classify.ts:97` |

### `src/control-file.ControlFileRead.kind` — `src/control-file.ts:30-36`

*the `kind` discriminator of `z.discriminatedUnion` `ControlFileRead` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `live` | `src/control-file.ts:31` |
| `stale` | `src/control-file.ts:33` |
| `absent` | `src/control-file.ts:34` |
| `invalid` | `src/control-file.ts:35` |

### `src/estate.scanned().state` — `src/estate.ts:17-27`

*the `state` discriminator of `z.discriminatedUnion` `scanned()` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `scanned` | `src/estate.ts:19` |
| `unscanned` | `src/estate.ts:21` |

### `src/estate.ArchivedEntry.kind` — `src/estate.ts:53-63`

*the `kind` discriminator of `z.discriminatedUnion` `ArchivedEntry` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `range` | `src/estate.ts:55` |
| `project` | `src/estate.ts:61` |
| `other` | `src/estate.ts:62` |

### `src/estate.ProjectFound.matchedBy` — `src/estate.ts:192`

*`z.enum` `matchedBy` - a single declaring symbol*

| value | declared at |
|---|---|
| `folder` | `src/estate.ts:192` |
| `id` | `src/estate.ts:192` |
| `code` | `src/estate.ts:192` |

### `src/estate.ProjectAmbiguous.matchedBy` — `src/estate.ts:198`

*`z.enum` `matchedBy` - a single declaring symbol*

| value | declared at |
|---|---|
| `id` | `src/estate.ts:198` |
| `code` | `src/estate.ts:198` |

### `src/estate.ProjectRefusal.kind` — `src/estate.ts:215-220`

*the `kind` discriminator of `z.discriminatedUnion` `ProjectRefusal` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `ambiguous` | `src/estate.ts:196` |
| `not-a-project` | `src/estate.ts:202` |
| `not-found` | `src/estate.ts:206` |
| `unscanned` | `src/estate.ts:208` |

### `src/estate.ResolveProjectResult.kind` — `src/estate.ts:223-229`

*the `kind` discriminator of `z.discriminatedUnion` `ResolveProjectResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `found` | `src/estate.ts:190` |
| `ambiguous` | `src/estate.ts:196` |
| `not-a-project` | `src/estate.ts:202` |
| `not-found` | `src/estate.ts:206` |
| `unscanned` | `src/estate.ts:208` |

### `src/estate.NextCodeResult.kind` — `src/estate.ts:280-287`

*the `kind` discriminator of `z.discriminatedUnion` `NextCodeResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `allocated` | `src/estate.ts:281` |
| `refused` | `src/estate.ts:283` |

### `src/estate.NextCodeResult[kind=refused].reason` — `src/estate.ts:284`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-letter` | `src/estate.ts:284` |
| `unscanned` | `src/estate.ts:284` |
| `exhausted` | `src/estate.ts:284` |

### `src/failure-codes.ForbiddenDetails.allowed[]` — `src/failure-codes.ts:143`

*`z.enum` `allowed[]` - a single declaring symbol*

| value | declared at |
|---|---|
| `human` | `src/failure-codes.ts:143` |
| `agent` | `src/failure-codes.ts:143` |
| `cli` | `src/failure-codes.ts:143` |

### `src/flitools.TranscriptJobStatus` — `src/flitools.ts:16`

*`z.enum` `TranscriptJobStatus` - a single declaring symbol*

*aliases* `TranscriptJobStatus` `src/flitools.ts:17`

| value | declared at |
|---|---|
| `queued` | `src/flitools.ts:16` |
| `running` | `src/flitools.ts:16` |
| `done` | `src/flitools.ts:16` |
| `failed` | `src/flitools.ts:16` |

### `src/flitools.FliToolsAnswer.kind` — `src/flitools.ts:44-47`

*the `kind` discriminator of union type `FliToolsAnswer` - each value declared by a literal type in one variant*

| value | declared at |
|---|---|
| `ok` | `src/flitools.ts:45` |
| `refused` | `src/flitools.ts:46` |
| `unavailable` | `src/flitools.ts:47` |

### `src/identity.ProjectAspect` — `src/identity.ts:11`

The shape a project's videos are made for (David 2026-09-23, B584). Absent → `16:9`.

*`z.enum` `ProjectAspect` - a single declaring symbol*

*aliases* `ProjectAspect` `src/identity.ts:12`

| value | declared at |
|---|---|
| `16:9` | `src/identity.ts:11` |
| `9:16` | `src/identity.ts:11` |
| `1:1` | `src/identity.ts:11` |

### `src/identity.ProjectShape` — `src/identity.ts:21`

What the project is for — a HINT only, no behaviour yet (David 2026-09-23; brains `video-as-code/

*`z.enum` `ProjectShape` - a single declaring symbol*

*aliases* `ProjectShape` `src/identity.ts:22`

| value | declared at |
|---|---|
| `single` | `src/identity.ts:21` |
| `shorts` | `src/identity.ts:21` |
| `episodes` | `src/identity.ts:21` |

### `src/identity.WriteIdentityResult.kind` — `src/identity.ts:61-67`

*the `kind` discriminator of the union `WriteIdentityResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/identity.ts:62` |
| `refused` | `src/identity.ts:55` |

### `src/lifecycle.LifecycleVerb` — `src/lifecycle.ts:18`

The lifecycle verb contract (agent-drivable step 2, David 2026-09-23: "Do we have support for closing them down

*`z.enum` `LifecycleVerb` - a single declaring symbol*

*aliases* `LifecycleVerb` `src/lifecycle.ts:19`

| value | declared at |
|---|---|
| `status` | `src/lifecycle.ts:18` |
| `start` | `src/lifecycle.ts:18` |
| `stop` | `src/lifecycle.ts:18` |
| `restart` | `src/lifecycle.ts:18` |

### `src/machine.MachineSettingsResult.kind` — `src/machine.ts:32-40`

*the `kind` discriminator of `z.discriminatedUnion` `MachineSettingsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `valid` | `src/machine.ts:34` |
| `invalid` | `src/results.ts:5` |

### `src/machine.MachineSettingsResult[kind=valid].source` — `src/machine.ts:36`

*`z.enum` `source` - a single declaring symbol*

| value | declared at |
|---|---|
| `file` | `src/machine.ts:36` |
| `default` | `src/machine.ts:36` |

### `src/open-args.OpenArgName` — `src/open-args.ts:36`

*`z.enum` `OpenArgName` - a single declaring symbol*

*aliases* `OpenArgName` `src/open-args.ts:37`

| value | declared at |
|---|---|
| `brand` | `src/open-args.ts:36` |
| `project` | `src/open-args.ts:36` |
| `video` | `src/open-args.ts:36` |

### `src/open-context.OpenContextResult.kind` — `src/open-context.ts:16-30`

*the `kind` discriminator of `z.discriminatedUnion` `OpenContextResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `resolved` | `src/open-context.ts:17` |
| `missing` | `src/open-context.ts:19` |
| `unknown-brand` | `src/open-context.ts:20` |
| `no-brand-root` | `src/open-context.ts:21` |
| `project-refused` | `src/open-context.ts:22` |
| `video-invalid` | `src/open-context.ts:23` |
| `video-not-found` | `src/open-context.ts:25` |

### `src/openrpc.CallAnswer.ok` — `src/openrpc.ts:183`

*the `ok` discriminator of union type `CallAnswer` - each value declared by a literal type in one variant*

| value | declared at |
|---|---|
| `true` | `src/openrpc.ts:183` |
| `false` | `src/openrpc.ts:183` |

### `src/results.InvalidFile.reason` — `src/results.ts:7`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `unreadable` | `src/results.ts:7` |
| `not-json` | `src/results.ts:7` |
| `schema` | `src/results.ts:7` |

### `src/results.readFileResult().kind` — `src/results.ts:19-21`

*the `kind` discriminator of the union `readFileResult()` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `valid` | `src/results.ts:14` |
| `invalid` | `src/results.ts:5` |

### `src/reveal.RevealResult.kind` — `src/reveal.ts:13-21`

*the `kind` discriminator of `z.discriminatedUnion` `RevealResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `revealed` | `src/reveal.ts:14` |
| `refused` | `src/reveal.ts:16` |

### `src/reveal.RevealResult[kind=refused].reason` — `src/reveal.ts:18`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `outside-roots` | `src/reveal.ts:18` |
| `not-found` | `src/reveal.ts:18` |
| `not-absolute` | `src/reveal.ts:18` |
| `failed` | `src/reveal.ts:18` |

### `src/video-file.VideoFileKind` — `src/video-file.ts:16`

*`z.enum` `VideoFileKind` - a single declaring symbol*

*aliases* `VideoFileKind` `src/video-file.ts:17`

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:16` |
| `audio` | `src/video-file.ts:16` |
| `overlay` | `src/video-file.ts:16` |
| `final` | `src/video-file.ts:16` |

### `src/video-file.VideoFile.kind` — `src/video-file.ts:19-29`

*the `kind` discriminator of `z.discriminatedUnion` `VideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:20` |
| `final` | `src/video-file.ts:23` |
| `audio` | `src/video-file.ts:27` |
| `overlay` | `src/video-file.ts:28` |

### `src/video-file.ParsedVideoFile.kind` — `src/video-file.ts:39`

*the `kind` discriminator of the union `ParsedVideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:20` |
| `final` | `src/video-file.ts:23` |
| `audio` | `src/video-file.ts:27` |
| `overlay` | `src/video-file.ts:28` |
| `unknown-kind` | `src/video-file.ts:33` |

## Closed sets — derived (no declaring symbol)

Each set below was read out of the real authority — control flow, membership tests, dispatch tables — because nothing declares it. **Correct as of this commit and fragile after it.** Each carries the refactor that would make it declared.

### `src/classify.LEGACY_FOLDERS` — `src/classify.ts:36-43`

*module constant `LEGACY_FOLDERS` used in a `.includes()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `first-edit` | `src/classify.ts:37` |
| `edits` | `src/classify.ts:38` |
| `edit-1st` | `src/classify.ts:39` |
| `final` | `src/classify.ts:40` |
| `pipeline` | `src/classify.ts:41` |
| `animation` | `src/classify.ts:42` |

> **REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:36 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.**

### `src/fs-utils.NO_HARD_LINKS` — `src/fs-utils.ts:32`

*module constant `NO_HARD_LINKS` used in a `.has()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `EPERM` | `src/fs-utils.ts:32` |
| `ENOTSUP` | `src/fs-utils.ts:32` |
| `EOPNOTSUPP` | `src/fs-utils.ts:32` |
| `ENOSYS` | `src/fs-utils.ts:32` |
| `EXDEV` | `src/fs-utils.ts:32` |

> **REFACTOR (minor): `NO_HARD_LINKS` at src/fs-utils.ts:32 names the set but does not type it. A z.enum or `as const` + `typeof NO_HARD_LINKS[number]` would make a wrong value a static error rather than a runtime miss.**

## Shapes

### `src/api-page.ApiPageOptions` — interface — `src/api-page.ts:16-33`

The self-describing surface as ONE served HTML page (agent-drivable step 2). Two modes from one renderer:

| field | type | default | at | note |
|---|---|---|---|---|
| `console` | `?: { /** Same-origin JSON-RPC endpoint, e.g. `/api/rpc`. */ rpcPath: string; /** Principal the console fires as; an agent name shows the fence…` | — | `src/api-page.ts:18` | Present → the console; absent → the read-only reference. |
| `otherPage` | `?: { href: string; label: string }` | — | `src/api-page.ts:32` | A link back to the other mode (reference ↔ console). |

### `src/api-page.ApiPageOptions.console` — type — `src/api-page.ts:18-30`

| field | type | default | at | note |
|---|---|---|---|---|
| `rpcPath` | `string` | — | `src/api-page.ts:20` | Same-origin JSON-RPC endpoint, e.g. `/api/rpc`. |
| `principal` | `?: string` | — | `src/api-page.ts:22` | Principal the console fires as; an agent name shows the fence working. Default `agent:console`. |
| `tokenPath` | `?: string` | — | `src/api-page.ts:24` | Same-origin GET answering `{ token }`, when the door needs a bearer token and there is no bridge. |
| `dryRun` | `?: boolean` | — | `src/api-page.ts:29` | Show a "Dry run" box. Ticked, a call goes as `window.fliConsole.call(method, params, { dryRun: true })` or with |

### `src/api-page.ApiPageOptions.otherPage` — type — `src/api-page.ts:32`

| field | type | default | at |
|---|---|---|---|
| `href` | `string` | — | `src/api-page.ts:32` |
| `label` | `string` | — | `src/api-page.ts:32` |

### `src/app-file.AppName` — zod-scalar — `src/app-file.ts:15-18`

`z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'app must be kebab-case').refine((app) => app !== 'brand', 'app "brand" is reserved for fli.…`

### `src/app-file.AppSubject` — zod-scalar — `src/app-file.ts:19-24`

`z.string().regex(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/, 'subject must be letters, digits, _ or -, with single dots between words')`

### `src/app-file.AppFile` — zod-object — `src/app-file.ts:26-31`

*aliases* `AppFile` `src/app-file.ts:32`

| field | type | default | at |
|---|---|---|---|
| `app` | `AppName → src/app-file.AppName` | — | `src/app-file.ts:27` |
| `subject` | `AppSubject.optional() → src/app-file.AppSubject` | — | `src/app-file.ts:27` |

### `src/brand-settings.BrandSettings` — zod-object — `src/brand-settings.ts:9-15`

`v-<brand>/fli.brand.json` (D13, spec O6): per-brand display settings, travelling in the brand's repo.

*aliases* `BrandSettings` `src/brand-settings.ts:16`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/brand-settings.ts:10` |
| `brand` | `z.string().min(1)` | — | `src/brand-settings.ts:11` |
| `colour` | `z.string().regex(/^#(?:[0-9a-fA-F]{3}\|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)')` | — | `src/brand-settings.ts:12` |

### `src/brands.Brand` — zod-object — `src/brands.ts:9-17`

A brand from the registry (R6, R29). Only the fields the Fli apps need; the rest of the entry is ignored.

*aliases* `Brand` `src/brands.ts:18`

| field | type | default | at | note |
|---|---|---|---|---|
| `key` | `z.string().min(1)` | — | `src/brands.ts:11` | The `brands.json` key: the join key across registries. |
| `name` | `z.string().min(1)` | — | `src/brands.ts:12` |  |
| `shortcut` | `z.string().optional()` | — | `src/brands.ts:13` |  |
| `type` | `z.string().optional()` | — | `src/brands.ts:14` |  |
| `videoProjects` | `z.string().optional()` | — | `src/brands.ts:16` | `locations.video_projects` exactly as the registry holds it (before the A5 rewrite). |

### `src/brands.RegistryEntry` — zod-object — `src/brands.ts:20-25`

| field | type | default | at |
|---|---|---|---|
| `name` | `z.string().min(1)` | — | `src/brands.ts:21` |
| `shortcut` | `z.string().optional()` | — | `src/brands.ts:22` |
| `type` | `z.string().optional()` | — | `src/brands.ts:23` |
| `locations` | `z.looseObject({ video_projects: z.string().min(1).optional() }).optional()` | — | `src/brands.ts:24` |

### `src/brands.RegistryEntry.locations` — zod-object — `src/brands.ts:24`

| field | type | default | at |
|---|---|---|---|
| `video_projects` | `z.string().min(1).optional()` | — | `src/brands.ts:24` |

### `src/brands.BrandsFile` — zod-object — `src/brands.ts:28`

The top level of `~/.config/appydave/brands.json`. Entries are checked one by one (see `readBrands`).

*aliases* `BrandsFile` `src/brands.ts:29`

| field | type | default | at |
|---|---|---|---|
| `brands` | `z.record(z.string(), z.unknown())` | — | `src/brands.ts:28` |

### `src/brands.SkippedBrand` — zod-object — `src/brands.ts:32`

A registry entry `readBrands` could not use, and why.

*aliases* `SkippedBrand` `src/brands.ts:33`

| field | type | default | at |
|---|---|---|---|
| `key` | `z.string()` | — | `src/brands.ts:32` |
| `issues` | `z.array(z.string())` | — | `src/brands.ts:32` |

### `src/brands.BrandsRead` — zod-object — `src/brands.ts:35-42`

*aliases* `BrandsRead` `src/brands.ts:43`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.literal('valid')` | — | `src/brands.ts:36` |  |
| `path` | `z.string()` | — | `src/brands.ts:37` |  |
| `value` | `z.array(Brand) → src/brands.Brand` | — | `src/brands.ts:39` | Usable brands, in registry order. |
| `skipped` | `z.array(SkippedBrand) → src/brands.SkippedBrand` | — | `src/brands.ts:41` | Entries left out because they do not match the registry shape. |

### `src/brands.ReadBrandsResult` — zod-union on `kind` — `src/brands.ts:45`

*aliases* `ReadBrandsResult` `src/brands.ts:46`

| variant | shape | default | at |
|---|---|---|---|
| `BrandsRead` | `BrandsRead → src/brands.BrandsRead` | — | `src/brands.ts:45` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/brands.ts:45` |
| `null` | `z.null()` | — | `src/brands.ts:45` |

### `src/brands.ReadBrandsOptions` — interface — `src/brands.ts:48-53`

| field | type | default | at | note |
|---|---|---|---|---|
| `path` | `?: string` | — | `src/brands.ts:50` | Path to `brands.json`; default `<home>/.config/appydave/brands.json`. |
| `home` | `?: string` | — | `src/brands.ts:52` | Home directory; default `os.homedir()`. |

### `src/brands.ResolveBrandRootOptions` — interface — `src/brands.ts:92-95`

| field | type | default | at | note |
|---|---|---|---|---|
| `home` | `?: string` | — | `src/brands.ts:94` | Home directory used for the A5 rewrite; default `os.homedir()`. |

### `src/capability.PrincipalName` — zod-scalar — `src/capability.ts:20-22`

*aliases* `PrincipalName` `src/capability.ts:23`

`z.string().regex(/^(human(:[\w.-]+)?|cli|agent:[\w.-]+)$/, 'human[:surface], agent:<name> or cli')`

### `src/capability.CapabilityName` — zod-scalar — `src/capability.ts:51-53`

Capability names are `family.verb` (`project.create`, `app.stop`, `system.quit`).

`z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z][a-zA-Z0-9-]*)+$/, 'family.verb')`

### `src/capability.HumanOnlyWhen` — type — `src/capability.ts:59`

Human-only by input: the capability is open to agents, except when the input asks for the part only a person may

| field | type | default | at |
|---|---|---|---|
| `when` | `(input: I): boolean` | — | `src/capability.ts:59` |
| `note` | `string` | — | `src/capability.ts:59` |

### `src/capability.CapabilityContract` — type — `src/capability.ts:61-77`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `CapabilityKind → src/capability.CapabilityKind` | — | `src/capability.ts:62` |  |
| `description` | `string` | — | `src/capability.ts:63` |  |
| `input` | `I` | — | `src/capability.ts:64` |  |
| `output` | `O` | — | `src/capability.ts:65` |  |
| `sideEffects` | `SideEffects → src/capability.SideEffects` | — | `src/capability.ts:66` |  |
| `idempotent` | `boolean` | — | `src/capability.ts:67` |  |
| `confirmationRequired` | `boolean` | — | `src/capability.ts:69` | The UI asks a person before calling it. Metadata only — the fence is `humanOnly`. |
| `expectedDuration` | `ExpectedDuration → src/capability.ExpectedDuration` | — | `src/capability.ts:70` |  |
| `failureModes` | `readonly string[]` | — | `src/capability.ts:72` | The refusals this capability can make on top of the ones any call can. |
| `principals` | `readonly PrincipalKind[] → src/capability.PrincipalKind` | — | `src/capability.ts:74` | Who may call it. A human-only capability allows `human` alone. |
| `humanOnly` | `boolean \| HumanOnlyWhen<z.infer<I>> → src/capability.HumanOnlyWhen, output (../core/index.cjs)` | — | `src/capability.ts:76` | ★ `true`: never an agent or the CLI. An object: only for the inputs `when` picks out. |

### `src/capability.Authorization` — type-union on `ok` — `src/capability.ts:122`

The result of `authorize`: the caller's kind, or a `forbidden` refusal with typed details.

| variant | shape | default | at |
|---|---|---|---|
| `true` | `{ ok: true; kind: PrincipalKind }` | — | `src/capability.ts:122` |
| `false` | `{ ok: false; refusal: Refusal }` | — | `src/capability.ts:122` |

### `src/capability.Authorization[ok=false]` — type — `src/capability.ts:122`

| field | type | default | at |
|---|---|---|---|
| `ok` | `false` | — | `src/capability.ts:122` |
| `refusal` | `Refusal → src/failure-codes.Refusal` | — | `src/capability.ts:122` |

### `src/capability.Authorization[ok=true]` — type — `src/capability.ts:122`

| field | type | default | at |
|---|---|---|---|
| `ok` | `true` | — | `src/capability.ts:122` |
| `kind` | `PrincipalKind → src/capability.PrincipalKind` | — | `src/capability.ts:122` |

### `src/capability.CapabilityMeta` — zod-object — `src/capability.ts:187-203`

One capability as data, for `GET …/capabilities`, a CLI's `list` and the OpenRPC generator.

*aliases* `CapabilityMeta` `src/capability.ts:204`

| field | type | default | at | note |
|---|---|---|---|---|
| `name` | `z.string()` | — | `src/capability.ts:188` |  |
| `family` | `z.string()` | — | `src/capability.ts:189` |  |
| `kind` | `CapabilityKind → src/capability.CapabilityKind` | — | `src/capability.ts:190` |  |
| `description` | `z.string()` | — | `src/capability.ts:191` |  |
| `sideEffects` | `SideEffects → src/capability.SideEffects` | — | `src/capability.ts:192` |  |
| `idempotent` | `z.boolean()` | — | `src/capability.ts:193` |  |
| `confirmationRequired` | `z.boolean()` | — | `src/capability.ts:194` |  |
| `expectedDuration` | `ExpectedDuration → src/capability.ExpectedDuration` | — | `src/capability.ts:195` |  |
| `failureModes` | `z.array(z.string())` | — | `src/capability.ts:196` |  |
| `principals` | `z.array(PrincipalKind) → src/capability.PrincipalKind` | — | `src/capability.ts:197` |  |
| `humanOnly` | `z.union([z.boolean(), z.object({ when: z.string() })])` | — | `src/capability.ts:199` | `true`, `false`, or the note saying which inputs are human-only. |
| `required` | `z.array(z.string())` | — | `src/capability.ts:200` |  |
| `input` | `z.unknown()` | — | `src/capability.ts:201` |  |
| `output` | `z.unknown()` | — | `src/capability.ts:202` |  |

### `src/capability.CapabilityMeta.humanOnly` — zod-union — `src/capability.ts:199`

| variant | shape | default | at |
|---|---|---|---|
| `boolean` | `z.boolean()` | — | `src/capability.ts:199` |
| `object` | `z.object({ when: z.string() })` | — | `src/capability.ts:199` |

### `src/capability.CapabilityMeta.humanOnly[1]` — zod-object — `src/capability.ts:199`

| field | type | default | at |
|---|---|---|---|
| `when` | `z.string()` | — | `src/capability.ts:199` |

### `src/classify.ProjectLayoutPaths` — zod-object — `src/classify.ts:100-107`

*aliases* `ProjectLayoutPaths` `src/classify.ts:108`

| field | type | default | at | note |
|---|---|---|---|---|
| `layout` | `ProjectLayout → src/classify.ProjectLayout` | — | `src/classify.ts:102` | Detected by `projectLayout` (D14). |
| `recordings` | `z.string()` | — | `src/classify.ts:104` | Absolute path of the recordings folder for this layout (it may not exist yet). |
| `transcripts` | `z.string()` | — | `src/classify.ts:106` | Absolute path of the transcripts folder for this layout (it may not exist yet). |

### `src/control-file.ControlFile` — zod-object — `src/control-file.ts:18-27`

Control-file discovery (agent-drivable step 2, David 2026-09-23): a running app publishes where its door is and the

*aliases* `ControlFile` `src/control-file.ts:28`

| field | type | default | at | note |
|---|---|---|---|---|
| `port` | `z.number().int().positive()` | — | `src/control-file.ts:19` |  |
| `token` | `z.string().min(16)` | — | `src/control-file.ts:21` | Bearer token for this run; a new one every launch. |
| `pid` | `z.number().int().positive().optional()` | — | `src/control-file.ts:23` | The process serving the door. Optional only so older files still read; every writer sets it. |
| `startedAt` | `z.iso.datetime().optional()` | — | `src/control-file.ts:24` |  |
| `version` | `z.string().optional()` | — | `src/control-file.ts:26` | The app's version, for a caller that must know what it is talking to. |

### `src/control-file.ControlFileRead` — zod-discriminated-union on `kind` — `src/control-file.ts:30-36`

*aliases* `ControlFileRead` `src/control-file.ts:37`

| variant | shape | default | at |
|---|---|---|---|
| `live` | `z.object({ kind: z.literal('live'), path: z.string(), control: ControlFile }) → src/control-file.ControlFile` | — | `src/control-file.ts:31` |
| `stale` | `z.object({ kind: z.literal('stale'), path: z.string(), control: ControlFile }) → src/control-file.ControlFile` | — | `src/control-file.ts:33` |
| `absent` | `z.object({ kind: z.literal('absent'), path: z.string() })` | — | `src/control-file.ts:34` |
| `invalid` | `z.object({ kind: z.literal('invalid'), path: z.string(), message: z.string() })` | — | `src/control-file.ts:35` |

### `src/control-file.ControlFileRead[kind=live]` — zod-object — `src/control-file.ts:31`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('live')` | — | `src/control-file.ts:31` |
| `path` | `z.string()` | — | `src/control-file.ts:31` |
| `control` | `ControlFile → src/control-file.ControlFile` | — | `src/control-file.ts:31` |

### `src/control-file.ControlFileRead[kind=stale]` — zod-object — `src/control-file.ts:33`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('stale')` | — | `src/control-file.ts:33` |
| `path` | `z.string()` | — | `src/control-file.ts:33` |
| `control` | `ControlFile → src/control-file.ControlFile` | — | `src/control-file.ts:33` |

### `src/control-file.ControlFileRead[kind=absent]` — zod-object — `src/control-file.ts:34`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('absent')` | — | `src/control-file.ts:34` |
| `path` | `z.string()` | — | `src/control-file.ts:34` |

### `src/control-file.ControlFileRead[kind=invalid]` — zod-object — `src/control-file.ts:35`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('invalid')` | — | `src/control-file.ts:35` |
| `path` | `z.string()` | — | `src/control-file.ts:35` |
| `message` | `z.string()` | — | `src/control-file.ts:35` |

### `src/control-file.ControlFileOptions` — interface — `src/control-file.ts:39-42`

| field | type | default | at | note |
|---|---|---|---|---|
| `home` | `?: string` | — | `src/control-file.ts:41` | Defaults to `os.homedir()`; tests pass a temp home. |

### `src/estate.scanned()` — zod-factory (zod-discriminated-union) on `state` — `src/estate.ts:17-27`

A collection that was read, or one that could not be (R12): empty and unscanned are never the same thing.

| variant | shape | default | at |
|---|---|---|---|
| `scanned` | `z.object({ state: z.literal('scanned'), scannedAt: z.iso.datetime(), items: z.array(item) })` | — | `src/estate.ts:19` |
| `unscanned` | `z.object({ state: z.literal('unscanned'), scannedAt: z.iso.datetime(), path: z.string(), message: z.string() })` | — | `src/estate.ts:21` |

### `src/estate.scanned()[state=scanned]` — zod-object — `src/estate.ts:19`

| field | type | default | at |
|---|---|---|---|
| `state` | `z.literal('scanned')` | — | `src/estate.ts:19` |
| `scannedAt` | `z.iso.datetime()` | — | `src/estate.ts:19` |
| `items` | `z.array(item)` | — | `src/estate.ts:19` |

### `src/estate.scanned()[state=unscanned]` — zod-object — `src/estate.ts:20-25`

| field | type | default | at |
|---|---|---|---|
| `state` | `z.literal('unscanned')` | — | `src/estate.ts:21` |
| `scannedAt` | `z.iso.datetime()` | — | `src/estate.ts:22` |
| `path` | `z.string()` | — | `src/estate.ts:23` |
| `message` | `z.string()` | — | `src/estate.ts:24` |

### `src/estate.MemberProject` — zod-object — `src/estate.ts:31-37`

A folder holding a valid `fli.studio.json` (R8).

*aliases* `MemberProject` `src/estate.ts:38`

| field | type | default | at | note |
|---|---|---|---|---|
| `folder` | `z.string()` | — | `src/estate.ts:32` |  |
| `path` | `z.string()` | — | `src/estate.ts:33` |  |
| `parsed` | `ProjectFolder.nullable() → src/project-folder.ProjectFolder` | — | `src/estate.ts:35` | The folder name parsed as `<code>-<slug>`, or `null` when it does not follow that shape. |
| `identity` | `ProjectIdentity → src/identity.ProjectIdentity` | — | `src/estate.ts:36` |  |

### `src/estate.OtherFolder` — zod-object — `src/estate.ts:41-49`

Any other top-level folder (R9): shown as *other folder*, never as an error.

*aliases* `OtherFolder` `src/estate.ts:50`

| field | type | default | at | note |
|---|---|---|---|---|
| `folder` | `z.string()` | — | `src/estate.ts:42` |  |
| `path` | `z.string()` | — | `src/estate.ts:43` |  |
| `looksLikeProject` | `z.boolean()` | — | `src/estate.ts:45` | Named like a project (`d02-cutty-audio-cleanup`) rather than a plain folder (`docs`). |
| `parsed` | `ProjectFolder.nullable() → src/project-folder.ProjectFolder` | — | `src/estate.ts:46` |  |
| `identity` | `z.union([z.literal('absent'), InvalidFile]) → src/results.InvalidFile` | — | `src/estate.ts:48` | `absent`, or the `invalid` result when a `fli.studio.json` is there but not valid. |

### `src/estate.OtherFolder.identity` — zod-union — `src/estate.ts:48`

| variant | shape | default | at |
|---|---|---|---|
| `absent` | `z.literal('absent')` | — | `src/estate.ts:48` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/estate.ts:48` |

### `src/estate.ArchivedEntry` — zod-discriminated-union on `kind` — `src/estate.ts:53-63`

One folder directly under `<brandRoot>/archived/` (R13: listed, never descended into).

*aliases* `ArchivedEntry` `src/estate.ts:64`

| variant | shape | default | at |
|---|---|---|---|
| `range` | `z.object({ kind: z.literal('range'), name: z.string(), letter: z.string().regex(/^[a-z]$/), from: z.number().int().min(0).max(99), to: z.nu…` | — | `src/estate.ts:55` |
| `project` | `z.object({ kind: z.literal('project'), name: z.string(), code: ProjectCode, slug: z.string() }) → src/project-folder.ProjectCode` | — | `src/estate.ts:61` |
| `other` | `z.object({ kind: z.literal('other'), name: z.string() })` | — | `src/estate.ts:62` |

### `src/estate.ArchivedEntry[kind=range]` — zod-object — `src/estate.ts:54-60`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('range')` | — | `src/estate.ts:55` |
| `name` | `z.string()` | — | `src/estate.ts:56` |
| `letter` | `z.string().regex(/^[a-z]$/)` | — | `src/estate.ts:57` |
| `from` | `z.number().int().min(0).max(99)` | — | `src/estate.ts:58` |
| `to` | `z.number().int().min(0).max(99)` | — | `src/estate.ts:59` |

### `src/estate.ArchivedEntry[kind=project]` — zod-object — `src/estate.ts:61`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('project')` | — | `src/estate.ts:61` |
| `name` | `z.string()` | — | `src/estate.ts:61` |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/estate.ts:61` |
| `slug` | `z.string()` | — | `src/estate.ts:61` |

### `src/estate.ArchivedEntry[kind=other]` — zod-object — `src/estate.ts:62`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('other')` | — | `src/estate.ts:62` |
| `name` | `z.string()` | — | `src/estate.ts:62` |

### `src/estate.ProjectListing` — zod-object — `src/estate.ts:66-72`

*aliases* `ProjectListing` `src/estate.ts:73`

| field | type | default | at |
|---|---|---|---|
| `brandRoot` | `z.string()` | — | `src/estate.ts:67` |
| `scannedAt` | `z.iso.datetime()` | — | `src/estate.ts:68` |
| `members` | `scanned(MemberProject) → src/estate.scanned(), src/estate.MemberProject` | — | `src/estate.ts:69` |
| `otherFolders` | `scanned(OtherFolder) → src/estate.scanned(), src/estate.OtherFolder` | — | `src/estate.ts:70` |
| `archived` | `scanned(ArchivedEntry) → src/estate.scanned(), src/estate.ArchivedEntry` | — | `src/estate.ts:71` |

### `src/estate.ProjectFound` — zod-object — `src/estate.ts:189-194`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('found')` | — | `src/estate.ts:190` |
| `ref` | `z.string()` | — | `src/estate.ts:191` |
| `matchedBy` | `z.enum(['folder', 'id', 'code'])` | — | `src/estate.ts:192` |
| `project` | `MemberProject → src/estate.MemberProject` | — | `src/estate.ts:193` |

### `src/estate.ProjectAmbiguous` — zod-object — `src/estate.ts:195-200`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('ambiguous')` | — | `src/estate.ts:196` |
| `ref` | `z.string()` | — | `src/estate.ts:197` |
| `matchedBy` | `z.enum(['id', 'code'])` | — | `src/estate.ts:198` |
| `candidates` | `z.array(MemberProject) → src/estate.MemberProject` | — | `src/estate.ts:199` |

### `src/estate.ProjectNotAProject` — zod-object — `src/estate.ts:201-205`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('not-a-project')` | — | `src/estate.ts:202` |
| `ref` | `z.string()` | — | `src/estate.ts:203` |
| `folder` | `OtherFolder → src/estate.OtherFolder` | — | `src/estate.ts:204` |

### `src/estate.ProjectNotFound` — zod-object — `src/estate.ts:206`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('not-found')` | — | `src/estate.ts:206` |
| `ref` | `z.string()` | — | `src/estate.ts:206` |

### `src/estate.ProjectUnscanned` — zod-object — `src/estate.ts:207-212`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('unscanned')` | — | `src/estate.ts:208` |
| `ref` | `z.string()` | — | `src/estate.ts:209` |
| `path` | `z.string()` | — | `src/estate.ts:210` |
| `message` | `z.string()` | — | `src/estate.ts:211` |

### `src/estate.ProjectRefusal` — zod-discriminated-union on `kind` — `src/estate.ts:215-220`

Every `resolveProject` outcome except `found`: why a reference did not resolve (R31, C3).

*aliases* `ProjectRefusal` `src/estate.ts:221`

| variant | shape | default | at |
|---|---|---|---|
| `ProjectAmbiguous` | `ProjectAmbiguous → src/estate.ProjectAmbiguous` | — | `src/estate.ts:216` |
| `ProjectNotAProject` | `ProjectNotAProject → src/estate.ProjectNotAProject` | — | `src/estate.ts:217` |
| `ProjectNotFound` | `ProjectNotFound → src/estate.ProjectNotFound` | — | `src/estate.ts:218` |
| `ProjectUnscanned` | `ProjectUnscanned → src/estate.ProjectUnscanned` | — | `src/estate.ts:219` |

### `src/estate.ResolveProjectResult` — zod-discriminated-union on `kind` — `src/estate.ts:223-229`

*aliases* `ResolveProjectResult` `src/estate.ts:230`

| variant | shape | default | at |
|---|---|---|---|
| `ProjectFound` | `ProjectFound → src/estate.ProjectFound` | — | `src/estate.ts:224` |
| `ProjectAmbiguous` | `ProjectAmbiguous → src/estate.ProjectAmbiguous` | — | `src/estate.ts:225` |
| `ProjectNotAProject` | `ProjectNotAProject → src/estate.ProjectNotAProject` | — | `src/estate.ts:226` |
| `ProjectNotFound` | `ProjectNotFound → src/estate.ProjectNotFound` | — | `src/estate.ts:227` |
| `ProjectUnscanned` | `ProjectUnscanned → src/estate.ProjectUnscanned` | — | `src/estate.ts:228` |

### `src/estate.NextCodeResult` — zod-discriminated-union on `kind` — `src/estate.ts:280-287`

*aliases* `NextCodeResult` `src/estate.ts:288`

| variant | shape | default | at |
|---|---|---|---|
| `allocated` | `z.object({ kind: z.literal('allocated'), code: ProjectCode }) → src/project-folder.ProjectCode` | — | `src/estate.ts:281` |
| `refused` | `z.object({ kind: z.literal('refused'), reason: z.enum(['invalid-letter', 'unscanned', 'exhausted']), message: z.string() })` | — | `src/estate.ts:283` |

### `src/estate.NextCodeResult[kind=allocated]` — zod-object — `src/estate.ts:281`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('allocated')` | — | `src/estate.ts:281` |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/estate.ts:281` |

### `src/estate.NextCodeResult[kind=refused]` — zod-object — `src/estate.ts:282-286`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/estate.ts:283` |
| `reason` | `z.enum(['invalid-letter', 'unscanned', 'exhausted'])` | — | `src/estate.ts:284` |
| `message` | `z.string()` | — | `src/estate.ts:285` |

### `src/failure-codes.FailureCodeTable` — zod-scalar — `src/failure-codes.ts:52`

An app's frozen name → code table.

*aliases* `FailureCodeTable` `src/failure-codes.ts:53`

`z.record(z.string().min(1), z.number().int())`

### `src/failure-codes.Refusal` — zod-object — `src/failure-codes.ts:132-136`

A refusal as data: the name, a neutral sentence saying WHAT IS TRUE (never what to click), and details typed per

*aliases* `Refusal` `src/failure-codes.ts:137`

| field | type | default | at |
|---|---|---|---|
| `failureMode` | `z.string().min(1)` | — | `src/failure-codes.ts:133` |
| `message` | `z.string()` | — | `src/failure-codes.ts:134` |
| `details` | `z.unknown().optional()` | — | `src/failure-codes.ts:135` |

### `src/failure-codes.ForbiddenDetails` — zod-object — `src/failure-codes.ts:140-145`

`forbidden`: this principal may not call the capability. `humanOnly` says no agent ever may.

*aliases* `ForbiddenDetails` `src/failure-codes.ts:146`

| field | type | default | at |
|---|---|---|---|
| `capability` | `z.string()` | — | `src/failure-codes.ts:141` |
| `principal` | `z.string()` | — | `src/failure-codes.ts:142` |
| `allowed` | `z.array(z.enum(['human', 'agent', 'cli']))` | — | `src/failure-codes.ts:143` |
| `humanOnly` | `z.boolean()` | — | `src/failure-codes.ts:144` |

### `src/failure-codes.MissingDetails` — zod-object — `src/failure-codes.ts:149`

`missing`: the required fields the call left out.

*aliases* `MissingDetails` `src/failure-codes.ts:150`

| field | type | default | at |
|---|---|---|---|
| `missing` | `z.array(z.string())` | — | `src/failure-codes.ts:149` |

### `src/failure-codes.BusyWork` — zod-object — `src/failure-codes.ts:153-156`

What an app is doing that a quit would lose.

*aliases* `BusyWork` `src/failure-codes.ts:157`

| field | type | default | at |
|---|---|---|---|
| `what` | `z.string()` | — | `src/failure-codes.ts:154` |
| `since` | `z.iso.datetime().optional()` | — | `src/failure-codes.ts:155` |

### `src/failure-codes.AppBusyDetails` — zod-object — `src/failure-codes.ts:160`

`app-busy`: what is in progress, so a caller can wait and retry rather than force it.

*aliases* `AppBusyDetails` `src/failure-codes.ts:161`

| field | type | default | at |
|---|---|---|---|
| `busy` | `z.array(BusyWork) → src/failure-codes.BusyWork` | — | `src/failure-codes.ts:160` |

### `src/flitools.TranscriptFiles` — zod-object — `src/flitools.ts:13`

Where a transcript's three files live: json (words + timings), srt, txt.

*aliases* `TranscriptFiles` `src/flitools.ts:14`

| field | type | default | at |
|---|---|---|---|
| `json` | `z.string()` | — | `src/flitools.ts:13` |
| `srt` | `z.string()` | — | `src/flitools.ts:13` |
| `txt` | `z.string()` | — | `src/flitools.ts:13` |

### `src/flitools.TranscriptJob` — zod-object — `src/flitools.ts:20-31`

One FliTools job (`transcribe.jobs`, or `transcribe.run { wait: false }`).

*aliases* `TranscriptJob` `src/flitools.ts:32`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.string()` | — | `src/flitools.ts:21` |  |
| `status` | `TranscriptJobStatus → src/flitools.TranscriptJobStatus` | — | `src/flitools.ts:22` |  |
| `phase` | `z.string()` | — | `src/flitools.ts:23` |  |
| `pct` | `z.number()` | — | `src/flitools.ts:24` |  |
| `source` | `z.string()` | — | `src/flitools.ts:26` | The recording's absolute path. |
| `app` | `z.string()` | — | `src/flitools.ts:27` |  |
| `project` | `z.string()` | — | `src/flitools.ts:28` |  |
| `queuedAt` | `z.string()` | — | `src/flitools.ts:29` |  |
| `error` | `z.string().optional()` | — | `src/flitools.ts:30` |  |

### `src/flitools.TranscriptFound` — zod-object — `src/flitools.ts:35-41`

`transcribe.find`: is there a transcript for this recording, and is it for its current content.

*aliases* `TranscriptFound` `src/flitools.ts:42`

| field | type | default | at |
|---|---|---|---|
| `path` | `z.string()` | — | `src/flitools.ts:36` |
| `files` | `TranscriptFiles → src/flitools.TranscriptFiles` | — | `src/flitools.ts:37` |
| `exists` | `z.boolean()` | — | `src/flitools.ts:38` |
| `current` | `z.boolean()` | — | `src/flitools.ts:39` |
| `wordTimings` | `z.boolean()` | — | `src/flitools.ts:40` |

### `src/flitools.FliToolsAnswer` — type-union on `kind` — `src/flitools.ts:44-47`

| variant | shape | default | at |
|---|---|---|---|
| `ok` | `{ kind: 'ok'; value: T }` | — | `src/flitools.ts:45` |
| `refused` | `{ kind: 'refused'; failureMode: string; message: string; details?: unknown }` | — | `src/flitools.ts:46` |
| `unavailable` | `{ kind: 'unavailable'; reason: string }` | — | `src/flitools.ts:47` |

### `src/flitools.FliToolsAnswer[kind=ok]` — type — `src/flitools.ts:45`

| field | type | default | at |
|---|---|---|---|
| `kind` | `'ok'` | — | `src/flitools.ts:45` |
| `value` | `T` | — | `src/flitools.ts:45` |

### `src/flitools.FliToolsAnswer[kind=refused]` — type — `src/flitools.ts:46`

| field | type | default | at |
|---|---|---|---|
| `kind` | `'refused'` | — | `src/flitools.ts:46` |
| `failureMode` | `string` | — | `src/flitools.ts:46` |
| `message` | `string` | — | `src/flitools.ts:46` |
| `details` | `?: unknown` | — | `src/flitools.ts:46` |

### `src/flitools.FliToolsAnswer[kind=unavailable]` — type — `src/flitools.ts:47`

| field | type | default | at |
|---|---|---|---|
| `kind` | `'unavailable'` | — | `src/flitools.ts:47` |
| `reason` | `string` | — | `src/flitools.ts:47` |

### `src/flitools.FliToolsOptions` — interface — `src/flitools.ts:49-56`

| field | type | default | at | note |
|---|---|---|---|---|
| `app` | `string` | — | `src/flitools.ts:51` | The calling app; FliTools records it and scopes its queue by it. Sent as `agent:<app>`. |
| `controlFile` | `?: string` | — | `src/flitools.ts:53` | FliTools' control file. Default `<home>/Library/Application Support/flitools/control.json`. |
| `home` | `?: string` | — | `src/flitools.ts:54` |  |
| `timeoutMs` | `?: number` | — | `src/flitools.ts:55` |  |

### `src/flitools.TranscribeOptions` — interface — `src/flitools.ts:58-64`

*extends* `FliToolsOptions`

| field | type | default | at | note |
|---|---|---|---|---|
| `project` | `?: string` | — | `src/flitools.ts:59` |  |
| `wait` | `?: boolean` | — | `src/flitools.ts:61` | Default true: answer with the transcript. false: answer with the queued job. |
| `language` | `?: string` | — | `src/flitools.ts:62` |  |
| `vocabulary` | `?: string[]` | — | `src/flitools.ts:63` |  |

### `src/identity.ProjectLanguage` — zod-scalar — `src/identity.ts:26`

A spoken language, as a lower-case ISO 639-1 code (`en`, `th`).

`z.string().regex(/^[a-z]{2}$/)`

### `src/identity.ProjectIdentity` — zod-object — `src/identity.ts:29-42`

*aliases* `ProjectIdentity` `src/identity.ts:43`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/identity.ts:30` |  |
| `id` | `z.uuid()` | — | `src/identity.ts:31` |  |
| `brand` | `z.string().min(1)` | — | `src/identity.ts:32` |  |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/identity.ts:33` |  |
| `name` | `z.string().min(1)` | — | `src/identity.ts:34` |  |
| `createdAt` | `z.iso.datetime({ offset: true })` | — | `src/identity.ts:35` |  |
| `aspect` | `ProjectAspect.optional() → src/identity.ProjectAspect` | — | `src/identity.ts:37` | Intent (B584): the aspect the videos are made for. Absent → `16:9` (`projectIntents`). |
| `languages` | `z.array(ProjectLanguage).min(1).optional() → src/identity.ProjectLanguage` | — | `src/identity.ts:39` | Intent (B584): what is spoken, dominant first — `["en"]`, `["th"]`, `["en","th"]`. Absent → `["en"]`. |
| `shape` | `ProjectShape.optional() → src/identity.ProjectShape` | — | `src/identity.ts:41` | Hint (§8): `single` \| `shorts` \| `episodes`. Absent → `single`. No behaviour yet. |

### `src/identity.Refused()` — zod-factory — `src/identity.ts:53-59`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:55` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:56` |
| `path` | `z.string()` | — | `src/identity.ts:57` |
| `message` | `z.string()` | — | `src/identity.ts:58` |

### `src/identity.WriteIdentityResult` — zod-union on `kind` — `src/identity.ts:61-67`

*aliases* `WriteIdentityResult` `src/identity.ts:68`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string(), replaced: z.boolean() })` | — | `src/identity.ts:62` |
| `Refused('invalid-input')` | `Refused('invalid-input') → src/identity.Refused()` | — | `src/identity.ts:63` |
| `Refused('different-id').extend({ existingId: z.string() })` | `Refused('different-id').extend({ existingId: z.string() }) → src/identity.Refused()` | — | `src/identity.ts:64` |
| `Refused('existing-invalid')` | `Refused('existing-invalid') → src/identity.Refused()` | — | `src/identity.ts:65` |
| `Refused('io-error')` | `Refused('io-error') → src/identity.Refused()` | — | `src/identity.ts:66` |

### `src/identity.WriteIdentityResult[kind=written]` — zod-object — `src/identity.ts:62`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/identity.ts:62` |
| `path` | `z.string()` | — | `src/identity.ts:62` |
| `replaced` | `z.boolean()` | — | `src/identity.ts:62` |

### `src/identity.WriteIdentityResult[2]` — zod-object — `src/identity.ts:64`

*extends* `Refused(...)`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:55` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:56` |
| `path` | `z.string()` | — | `src/identity.ts:57` |
| `message` | `z.string()` | — | `src/identity.ts:58` |
| `existingId` | `z.string()` | — | `src/identity.ts:64` |

### `src/lab-path.PathSegment` — zod-scalar — `src/lab-path.ts:8-14`

`z.string().min(1).refine((value) => !/[/\\]/.test(value) && value !== '.' && value !== '..', 'must be a single path segment')`

### `src/lab-path.LabPathInput` — zod-object — `src/lab-path.ts:16-39`

*aliases* `LabPathInput` `src/lab-path.ts:40`

| field | type | default | at | note |
|---|---|---|---|---|
| `brandRoot` | `z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path').optional() → path (node:path)` | — | `src/lab-path.ts:22` | The resolved brand root (`resolveBrandRoot`). Preferred: the lab folder is its basename, so a brand whose root is |
| `brand` | `PathSegment.optional() → src/lab-path.PathSegment` | — | `src/lab-path.ts:30` | Brand key (`appydave` → `v-appydave`) or brand folder name (`v-appydave`). Correct only when the brand root is |
| `project` | `PathSegment → src/lab-path.PathSegment` | — | `src/lab-path.ts:32` | The project folder name, `<code>-<project>` (`a01-xmen`). |
| `app` | `PathSegment → src/lab-path.PathSegment` | — | `src/lab-path.ts:33` |  |
| `subject` | `PathSegment.optional() → src/lab-path.PathSegment` | — | `src/lab-path.ts:34` |  |

### `src/lab-path.ResolvedLabPath` — zod-object — `src/lab-path.ts:79-86`

Where a project's lab is after `resolveLabPath`: the path, and what (if anything) was moved into place.

*aliases* `ResolvedLabPath` `src/lab-path.ts:87`

| field | type | default | at | note |
|---|---|---|---|---|
| `path` | `z.string()` | — | `src/lab-path.ts:81` | Same as `labPath(input)`. |
| `migratedFrom` | `z.string().nullable()` | — | `src/lab-path.ts:83` | The old project lab folder (`<code>-<old name>`) renamed into place, or null. |
| `ambiguous` | `z.array(z.string())` | — | `src/lab-path.ts:85` | Two or more `<code>-*` labs and none under the current name: nothing was moved; they are listed. |

### `src/lifecycle.SystemStatus` — zod-object — `src/lifecycle.ts:21-31`

*aliases* `SystemStatus` `src/lifecycle.ts:32`

| field | type | default | at | note |
|---|---|---|---|---|
| `app` | `z.string()` | — | `src/lifecycle.ts:22` |  |
| `version` | `z.string()` | — | `src/lifecycle.ts:23` |  |
| `pid` | `z.number().int().positive()` | — | `src/lifecycle.ts:24` |  |
| `startedAt` | `z.iso.datetime()` | — | `src/lifecycle.ts:25` |  |
| `context` | `z.object({ brand: z.string(), project: z.string(), video: z.string().optional() }).nullable()` | — | `src/lifecycle.ts:27` | The brand + project this run is pointed at, when it has one. |
| `busy` | `z.array(BusyWork) → src/failure-codes.BusyWork` | — | `src/lifecycle.ts:30` |  |

### `src/lifecycle.SystemStatus.context` — zod-object — `src/lifecycle.ts:27`

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string()` | — | `src/lifecycle.ts:28` |
| `project` | `z.string()` | — | `src/lifecycle.ts:28` |
| `video` | `z.string().optional()` | — | `src/lifecycle.ts:28` |

### `src/lifecycle.SystemQuitInput` — zod-object — `src/lifecycle.ts:34-37`

*aliases* `SystemQuitInput` `src/lifecycle.ts:38`

| field | type | default | at | note |
|---|---|---|---|---|
| `force` | `z.boolean().optional()` | — | `src/lifecycle.ts:36` | Quit even while busy. Human-only: an agent waits for the work to finish instead. |

### `src/lifecycle.SystemQuitOutput` — zod-object — `src/lifecycle.ts:40-44`

*aliases* `SystemQuitOutput` `src/lifecycle.ts:45`

| field | type | default | at | note |
|---|---|---|---|---|
| `pid` | `z.number().int().positive()` | — | `src/lifecycle.ts:41` |  |
| `quittingInMs` | `z.number().int().min(0)` | — | `src/lifecycle.ts:43` | When the process will be gone, roughly — the reply leaves first. |

### `src/lifecycle.AppScriptOpen` — zod-object — `src/lifecycle.ts:84-88`

*aliases* `AppScriptOpen` `src/lifecycle.ts:89`

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/lifecycle.ts:85` |
| `project` | `z.string().min(1)` | — | `src/lifecycle.ts:86` |
| `video` | `z.string().min(1).optional()` | — | `src/lifecycle.ts:87` |

### `src/machine.AbsolutePath` — zod-scalar — `src/machine.ts:7-9`

`z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path')`

### `src/machine.MachineSettings` — zod-object — `src/machine.ts:12-20`

`~/.fli/machine.json` (D5, roadmap §1.2b): this machine's settings.

*aliases* `MachineSettings` `src/machine.ts:21`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/machine.ts:13` |  |
| `brandRoots` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:15` | Per-brand override of the brand root, keyed by `brands.json` key (A5). |
| `labRoot` | `AbsolutePath.optional() → src/machine.AbsolutePath` | — | `src/machine.ts:17` | Root of working files outside projects. Default `<home>/fli/lab`. |
| `apps` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:19` | Per-app checkout path, keyed by app name. |

### `src/machine.ResolvedMachineSettings` — zod-object — `src/machine.ts:24`

Machine settings with the defaults filled in.

*extends* `MachineSettings`

*aliases* `ResolvedMachineSettings` `src/machine.ts:25`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/machine.ts:13` |  |
| `brandRoots` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:15` | Per-brand override of the brand root, keyed by `brands.json` key (A5). |
| `apps` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:19` | Per-app checkout path, keyed by app name. |
| `labRoot` | `AbsolutePath → src/machine.AbsolutePath` | — | `src/machine.ts:24` |  |

### `src/machine.MachineSettingsOptions` — interface — `src/machine.ts:27-30`

| field | type | default | at | note |
|---|---|---|---|---|
| `home` | `?: string` | — | `src/machine.ts:29` | Home directory; default `os.homedir()`. The file is `<home>/.fli/machine.json`. |

### `src/machine.MachineSettingsResult` — zod-discriminated-union on `kind` — `src/machine.ts:32-40`

*aliases* `MachineSettingsResult` `src/machine.ts:41`

| variant | shape | default | at |
|---|---|---|---|
| `valid` | `z.object({ kind: z.literal('valid'), path: z.string(), source: z.enum(['file', 'default']), value: ResolvedMachineSettings }) → src/machine.ResolvedMachineSettings` | — | `src/machine.ts:34` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/machine.ts:39` |

### `src/machine.MachineSettingsResult[kind=valid]` — zod-object — `src/machine.ts:33-38`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('valid')` | — | `src/machine.ts:34` |
| `path` | `z.string()` | — | `src/machine.ts:35` |
| `source` | `z.enum(['file', 'default'])` | — | `src/machine.ts:36` |
| `value` | `ResolvedMachineSettings → src/machine.ResolvedMachineSettings` | — | `src/machine.ts:37` |

### `src/open-args.OpenContext` — zod-object — `src/open-args.ts:11-23`

The resolved context an app is pointed at.

*aliases* `OpenContext` `src/open-args.ts:24`

| field | type | default | at | note |
|---|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/open-args.ts:13` | `brands.json` key. |
| `projectDir` | `z.string().min(1).refine((value) => path.isAbsolute(value), 'projectDir must be an absolute path') → path (node:path)` | — | `src/open-args.ts:15` | Absolute path of the project folder on this machine (D4). |
| `projectId` | `z.uuid()` | — | `src/open-args.ts:20` | `fli.studio.json` `id`. |
| `video` | `VideoFolderName.optional() → src/video-file.VideoFolderName` | — | `src/open-args.ts:22` | Video folder name: the video's kebab name (`flivideo-tour`). |

### `src/open-args.OpenArgs` — zod-object — `src/open-args.ts:27-33`

What door 2 carries before resolution: names, not paths or ids.

*aliases* `OpenArgs` `src/open-args.ts:34`

| field | type | default | at | note |
|---|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/open-args.ts:28` |  |
| `project` | `z.string().min(1)` | — | `src/open-args.ts:30` | Project folder name (or anything `resolveProject` accepts). |
| `video` | `VideoFolderName.optional() → src/video-file.VideoFolderName` | — | `src/open-args.ts:32` | Video folder name: the video's kebab name (`flivideo-tour`). |

### `src/open-args.RawOpenArgs` — zod-object — `src/open-args.ts:40-44`

Door-2 values exactly as given (argv or env): present and non-empty, not yet validated or resolved.

*aliases* `RawOpenArgs` `src/open-args.ts:45`

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1).optional()` | — | `src/open-args.ts:41` |
| `project` | `z.string().min(1).optional()` | — | `src/open-args.ts:42` |
| `video` | `z.string().min(1).optional()` | — | `src/open-args.ts:43` |

### `src/open-args.ParseOpenArgsOptions` — interface — `src/open-args.ts:53-56`

| field | type | default | at | note |
|---|---|---|---|---|
| `requireVideo` | `?: boolean` | — | `src/open-args.ts:55` | Report `video` as missing when absent. Default `false`. |

### `src/open-args.ParsedOpenArgs` — zod-object — `src/open-args.ts:58-62`

*aliases* `ParsedOpenArgs` `src/open-args.ts:63`

| field | type | default | at | note |
|---|---|---|---|---|
| `context` | `RawOpenArgs → src/open-args.RawOpenArgs` | — | `src/open-args.ts:59` |  |
| `missing` | `z.array(OpenArgName) → src/open-args.OpenArgName` | — | `src/open-args.ts:61` | Each missing argument, in `brand`, `project`, `video` order — each becomes a picker (R25). |

### `src/open-context.OpenContextResult` — zod-discriminated-union on `kind` — `src/open-context.ts:16-30`

Door 2 end to end (open contract §3, §5; C1, C3): turn the names an app was launched with into the `OpenContext` it

*aliases* `OpenContextResult` `src/open-context.ts:31`

| variant | shape | default | at |
|---|---|---|---|
| `resolved` | `z.object({ kind: z.literal('resolved'), context: OpenContext }) → src/open-args.OpenContext` | — | `src/open-context.ts:17` |
| `missing` | `z.object({ kind: z.literal('missing'), missing: z.array(OpenArgName) }) → src/open-args.OpenArgName` | — | `src/open-context.ts:19` |
| `unknown-brand` | `z.object({ kind: z.literal('unknown-brand'), brand: z.string() })` | — | `src/open-context.ts:20` |
| `no-brand-root` | `z.object({ kind: z.literal('no-brand-root'), brand: z.string(), message: z.string() })` | — | `src/open-context.ts:21` |
| `project-refused` | `z.object({ kind: z.literal('project-refused'), result: ProjectRefusal }) → src/estate.ProjectRefusal` | — | `src/open-context.ts:22` |
| `video-invalid` | `z.object({ kind: z.literal('video-invalid'), video: z.string() })` | — | `src/open-context.ts:23` |
| `video-not-found` | `z.object({ kind: z.literal('video-not-found'), video: z.string(), path: z.string(), message: z.string() })` | — | `src/open-context.ts:25` |

### `src/open-context.OpenContextResult[kind=resolved]` — zod-object — `src/open-context.ts:17`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('resolved')` | — | `src/open-context.ts:17` |
| `context` | `OpenContext → src/open-args.OpenContext` | — | `src/open-context.ts:17` |

### `src/open-context.OpenContextResult[kind=missing]` — zod-object — `src/open-context.ts:19`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('missing')` | — | `src/open-context.ts:19` |
| `missing` | `z.array(OpenArgName) → src/open-args.OpenArgName` | — | `src/open-context.ts:19` |

### `src/open-context.OpenContextResult[kind=unknown-brand]` — zod-object — `src/open-context.ts:20`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('unknown-brand')` | — | `src/open-context.ts:20` |
| `brand` | `z.string()` | — | `src/open-context.ts:20` |

### `src/open-context.OpenContextResult[kind=no-brand-root]` — zod-object — `src/open-context.ts:21`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('no-brand-root')` | — | `src/open-context.ts:21` |
| `brand` | `z.string()` | — | `src/open-context.ts:21` |
| `message` | `z.string()` | — | `src/open-context.ts:21` |

### `src/open-context.OpenContextResult[kind=project-refused]` — zod-object — `src/open-context.ts:22`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('project-refused')` | — | `src/open-context.ts:22` |
| `result` | `ProjectRefusal → src/estate.ProjectRefusal` | — | `src/open-context.ts:22` |

### `src/open-context.OpenContextResult[kind=video-invalid]` — zod-object — `src/open-context.ts:23`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('video-invalid')` | — | `src/open-context.ts:23` |
| `video` | `z.string()` | — | `src/open-context.ts:23` |

### `src/open-context.OpenContextResult[kind=video-not-found]` — zod-object — `src/open-context.ts:24-29`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('video-not-found')` | — | `src/open-context.ts:25` |
| `video` | `z.string()` | — | `src/open-context.ts:26` |
| `path` | `z.string()` | — | `src/open-context.ts:27` |
| `message` | `z.string()` | — | `src/open-context.ts:28` |

### `src/open-context.ResolveOpenContextOptions` — interface — `src/open-context.ts:33-42`

| field | type | default | at | note |
|---|---|---|---|---|
| `brands` | `readonly Brand[] → src/brands.Brand` | — | `src/open-context.ts:35` | The registry, from `readBrands`. |
| `machine` | `?: Pick<MachineSettings, 'brandRoots'> \| null → src/machine.MachineSettings` | — | `src/open-context.ts:37` | This machine's settings, from `readMachineSettings` (for `brandRoots`). |
| `home` | `?: string` | — | `src/open-context.ts:39` | Home directory for the A5 rewrite; default `os.homedir()`. |
| `requireVideo` | `?: boolean` | — | `src/open-context.ts:41` | Refuse with `missing: ['video']` when no video is given. Default `false`. |

### `src/openrpc.OpenRpcServer` — zod-object — `src/openrpc.ts:18-25`

One OpenRPC generator for every Fli app (agent-drivable step 2), built from FliCast's `scripts/gen-openrpc.mjs`.

*aliases* `OpenRpcServer` `src/openrpc.ts:26`

| field | type | default | at |
|---|---|---|---|
| `name` | `z.string()` | — | `src/openrpc.ts:19` |
| `url` | `z.string()` | — | `src/openrpc.ts:20` |
| `summary` | `z.string().optional()` | — | `src/openrpc.ts:21` |
| `variables` | `z.record(z.string(), z.object({ default: z.string(), description: z.string().optional() })).optional()` | — | `src/openrpc.ts:22` |

### `src/openrpc.OpenRpcDocument` — zod-object — `src/openrpc.ts:29-49`

The generated document, loosely typed: enough for the page renderer and tests to read.

*aliases* `OpenRpcDocument` `src/openrpc.ts:50`

| field | type | default | at |
|---|---|---|---|
| `openrpc` | `z.literal('1.3.2')` | — | `src/openrpc.ts:30` |
| `info` | `z.looseObject({ title: z.string(), version: z.string(), description: z.string().optional() })` | — | `src/openrpc.ts:31` |
| `servers` | `z.array(OpenRpcServer) → src/openrpc.OpenRpcServer` | — | `src/openrpc.ts:36` |
| `methods` | `z.array(z.looseObject({ name: z.string(), summary: z.string(), params: z.array(z.looseObject({ name: z.string(), required: z.boolean(), sch…` | — | `src/openrpc.ts:37` |

### `src/openrpc.OpenRpcDocument.info` — zod-object — `src/openrpc.ts:31`

| field | type | default | at |
|---|---|---|---|
| `title` | `z.string()` | — | `src/openrpc.ts:32` |
| `version` | `z.string()` | — | `src/openrpc.ts:33` |
| `description` | `z.string().optional()` | — | `src/openrpc.ts:34` |

### `src/openrpc.OpenRpcDocument.methods[]` — zod-object — `src/openrpc.ts:37`

| field | type | default | at |
|---|---|---|---|
| `name` | `z.string()` | — | `src/openrpc.ts:39` |
| `summary` | `z.string()` | — | `src/openrpc.ts:40` |
| `params` | `z.array(z.looseObject({ name: z.string(), required: z.boolean(), schema: z.unknown() }))` | — | `src/openrpc.ts:41` |
| `errors` | `z.array(z.looseObject({ code: z.number(), message: z.string() }))` | — | `src/openrpc.ts:44` |
| `x-principals` | `z.array(z.string())` | — | `src/openrpc.ts:45` |
| `x-human-only` | `z.union([z.boolean(), z.object({ when: z.string() })])` | — | `src/openrpc.ts:46` |

### `src/openrpc.OpenRpcDocument.methods[].params[]` — zod-object — `src/openrpc.ts:41`

| field | type | default | at |
|---|---|---|---|
| `name` | `z.string()` | — | `src/openrpc.ts:42` |
| `required` | `z.boolean()` | — | `src/openrpc.ts:42` |
| `schema` | `z.unknown()` | — | `src/openrpc.ts:42` |

### `src/openrpc.OpenRpcDocument.methods[].errors[]` — zod-object — `src/openrpc.ts:44`

| field | type | default | at |
|---|---|---|---|
| `code` | `z.number()` | — | `src/openrpc.ts:44` |
| `message` | `z.string()` | — | `src/openrpc.ts:44` |

### `src/openrpc.OpenRpcDocument.methods[].x-human-only` — zod-union — `src/openrpc.ts:46`

| variant | shape | default | at |
|---|---|---|---|
| `boolean` | `z.boolean()` | — | `src/openrpc.ts:46` |
| `object` | `z.object({ when: z.string() })` | — | `src/openrpc.ts:46` |

### `src/openrpc.OpenRpcDocument.methods[].x-human-only[1]` — zod-object — `src/openrpc.ts:46`

| field | type | default | at |
|---|---|---|---|
| `when` | `z.string()` | — | `src/openrpc.ts:46` |

### `src/openrpc.OpenRpcOptions` — interface — `src/openrpc.ts:52-67`

| field | type | default | at | note |
|---|---|---|---|---|
| `title` | `string` | — | `src/openrpc.ts:53` |  |
| `version` | `string` | — | `src/openrpc.ts:55` | App version, and the API version when it moves separately (`0.3.1+api1`). |
| `description` | `?: string` | — | `src/openrpc.ts:56` |  |
| `servers` | `OpenRpcServer[] → src/openrpc.OpenRpcServer` | — | `src/openrpc.ts:57` |  |
| `capabilities` | `Record<string, CapabilityContract> → src/capability.CapabilityContract` | — | `src/openrpc.ts:58` |  |
| `codes` | `Readonly<Record<string, number>>` | — | `src/openrpc.ts:60` | The app's frozen name → code table (`defineFailureCodes`). |
| `refusalDetails` | `?: Readonly<Record<string, z.ZodType>> → ZodType (zod)` | — | `src/openrpc.ts:62` | Typed details per refusal name (zod), e.g. `{ ...SUITE_REFUSAL_DETAILS, overlap: OverlapDetails }`. |
| `alwaysPossible` | `?: readonly string[]` | — | `src/openrpc.ts:64` | Refusals ANY call can make (a bad principal, bad input, an unknown name, a fault) — listed on every method. |
| `generatedBy` | `?: string` | — | `src/openrpc.ts:66` | Where the document came from, for `x-generated-by`. |

### `src/openrpc.JsonRpcRequest` — zod-object — `src/openrpc.ts:174-179`

*aliases* `JsonRpcRequest` `src/openrpc.ts:180`

| field | type | default | at |
|---|---|---|---|
| `jsonrpc` | `z.literal('2.0')` | — | `src/openrpc.ts:175` |
| `method` | `z.string().min(1)` | — | `src/openrpc.ts:176` |
| `params` | `z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional()` | — | `src/openrpc.ts:177` |
| `id` | `z.union([z.string(), z.number(), z.null()]).optional()` | — | `src/openrpc.ts:178` |

### `src/openrpc.JsonRpcRequest.params` — zod-union — `src/openrpc.ts:177`

| variant | shape | default | at |
|---|---|---|---|
| `record` | `z.record(z.string(), z.unknown())` | — | `src/openrpc.ts:177` |
| `array` | `z.array(z.unknown())` | — | `src/openrpc.ts:177` |

### `src/openrpc.JsonRpcRequest.id` — zod-union — `src/openrpc.ts:178`

| variant | shape | default | at |
|---|---|---|---|
| `string` | `z.string()` | — | `src/openrpc.ts:178` |
| `number` | `z.number()` | — | `src/openrpc.ts:178` |
| `null` | `z.null()` | — | `src/openrpc.ts:178` |

### `src/openrpc.CallAnswer` — type-union on `ok` — `src/openrpc.ts:183`

What an app's seam answers: the value, or a named refusal.

| variant | shape | default | at |
|---|---|---|---|
| `true` | `{ ok: true; value: unknown }` | — | `src/openrpc.ts:183` |
| `false` | `{ ok: false; error: Refusal }` | — | `src/openrpc.ts:183` |

### `src/openrpc.CallAnswer[ok=false]` — type — `src/openrpc.ts:183`

| field | type | default | at |
|---|---|---|---|
| `ok` | `false` | — | `src/openrpc.ts:183` |
| `error` | `Refusal → src/failure-codes.Refusal` | — | `src/openrpc.ts:183` |

### `src/openrpc.CallAnswer[ok=true]` — type — `src/openrpc.ts:183`

| field | type | default | at |
|---|---|---|---|
| `ok` | `true` | — | `src/openrpc.ts:183` |
| `value` | `unknown` | — | `src/openrpc.ts:183` |

### `src/openrpc.JsonRpcOptions` — interface — `src/openrpc.ts:185-189`

| field | type | default | at | note |
|---|---|---|---|---|
| `codes` | `Readonly<Record<string, number>>` | — | `src/openrpc.ts:186` |  |
| `names` | `?: { unknownCapability?: string; invalidInput?: string; internal?: string }` | — | `src/openrpc.ts:188` | The app's names for the three standard cases, when it does not use these. |

### `src/openrpc.JsonRpcOptions.names` — type — `src/openrpc.ts:188`

| field | type | default | at |
|---|---|---|---|
| `unknownCapability` | `?: string` | — | `src/openrpc.ts:188` |
| `invalidInput` | `?: string` | — | `src/openrpc.ts:188` |
| `internal` | `?: string` | — | `src/openrpc.ts:188` |

### `src/project-folder.ProjectCode` — zod-scalar — `src/project-folder.ts:5-7`

A project code: one lowercase letter and two digits (`a01`, `d02`).

*aliases* `ProjectCode` `src/project-folder.ts:8`

`z.string().regex(/^[a-z]\d{2}$/, 'code must be one lowercase letter + two digits')`

### `src/project-folder.KebabSlug` — zod-scalar — `src/project-folder.ts:11-13`

Kebab-case: lowercase letters and digits, single hyphens between words.

`z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (a-z, 0-9, single hyphens)')`

### `src/project-folder.ProjectFolder` — zod-object — `src/project-folder.ts:15`

*aliases* `ProjectFolder` `src/project-folder.ts:16`

| field | type | default | at |
|---|---|---|---|
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/project-folder.ts:15` |
| `slug` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/project-folder.ts:15` |

### `src/recording.RecordingTag` — zod-scalar — `src/recording.ts:14-16`

`z.string().regex(TAG, 'tag must be uppercase letters/digits with a letter')`

### `src/recording.Recording` — zod-object — `src/recording.ts:18-45`

*aliases* `Recording` `src/recording.ts:46`

| field | type | default | at |
|---|---|---|---|
| `chapter` | `z.number().int().min(1).max(99)` | — | `src/recording.ts:20` |
| `segment` | `z.number().int().min(1).nullable()` | — | `src/recording.ts:21` |
| `slug` | `z.string().regex(/^[a-z0-9.]+(?:-[a-z0-9.]+)*$/, 'slug must be kebab-case (a-z, 0-9, periods, hyphens)')` | — | `src/recording.ts:22` |
| `tags` | `z.array(RecordingTag) → src/recording.RecordingTag` | — | `src/recording.ts:28` |
| `ext` | `z.string().regex(/^[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*$/, 'ext must be letters/digits with a letter, without the dot')` | — | `src/recording.ts:29` |

### `src/results.InvalidFile` — zod-object — `src/results.ts:4-9`

A JSON file that was found but could not be used. Readers return this instead of throwing.

*aliases* `InvalidFile` `src/results.ts:10`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('invalid')` | — | `src/results.ts:5` |
| `path` | `z.string()` | — | `src/results.ts:6` |
| `reason` | `z.enum(['unreadable', 'not-json', 'schema'])` | — | `src/results.ts:7` |
| `message` | `z.string()` | — | `src/results.ts:8` |

### `src/results.validFile()` — zod-factory — `src/results.ts:13-15`

A JSON file that was found and matched `value`'s schema.

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('valid')` | — | `src/results.ts:14` |
| `path` | `z.string()` | — | `src/results.ts:14` |
| `value` | `value` | — | `src/results.ts:14` |

### `src/results.readFileResult()` — zod-factory (zod-union) on `kind` — `src/results.ts:19-21`

Absent → `null`; present and valid → `ValidFile`; present and unusable → `InvalidFile`.

| variant | shape | default | at |
|---|---|---|---|
| `validFile` | `validFile(value) → src/results.validFile()` | — | `src/results.ts:20` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/results.ts:20` |
| `null` | `z.null()` | — | `src/results.ts:20` |

### `src/reveal.RevealResult` — zod-discriminated-union on `kind` — `src/reveal.ts:13-21`

Open a location in Finder (David 2026-09-24, folder access — "Open in Finder" and "Copy full path" on every location

*aliases* `RevealResult` `src/reveal.ts:22`

| variant | shape | default | at |
|---|---|---|---|
| `revealed` | `z.object({ kind: z.literal('revealed'), path: z.string(), selected: z.boolean() })` | — | `src/reveal.ts:14` |
| `refused` | `z.object({ kind: z.literal('refused'), path: z.string(), reason: z.enum(['outside-roots', 'not-found', 'not-absolute', 'failed']), message:…` | — | `src/reveal.ts:16` |

### `src/reveal.RevealResult[kind=revealed]` — zod-object — `src/reveal.ts:14`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('revealed')` | — | `src/reveal.ts:14` |
| `path` | `z.string()` | — | `src/reveal.ts:14` |
| `selected` | `z.boolean()` | — | `src/reveal.ts:14` |

### `src/reveal.RevealResult[kind=refused]` — zod-object — `src/reveal.ts:15-20`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/reveal.ts:16` |
| `path` | `z.string()` | — | `src/reveal.ts:17` |
| `reason` | `z.enum(['outside-roots', 'not-found', 'not-absolute', 'failed'])` | — | `src/reveal.ts:18` |
| `message` | `z.string()` | — | `src/reveal.ts:19` |

### `src/reveal.RevealOptions` — interface — `src/reveal.ts:24-29`

| field | type | default | at | note |
|---|---|---|---|---|
| `roots` | `readonly string[]` | — | `src/reveal.ts:26` | Absolute folders the path must be inside (after resolving links). |
| `run` | `?: (args: string[]) => Promise<void>` | — | `src/reveal.ts:28` | Runs `open`; tests pass a stub so no window is ever raised. |

### `src/video-file.Ext` — zod-scalar — `src/video-file.ts:14`

Video files and folders (ruling "B only", 👤 David 2026-09-22 — supersedes the 09-09 numbered shape):

`z.string().regex(/^[A-Za-z0-9]+$/, 'ext must be letters/digits, without the dot')`

### `src/video-file.VideoFile` — zod-discriminated-union on `kind` — `src/video-file.ts:19-29`

*aliases* `VideoFile` `src/video-file.ts:30`

| variant | shape | default | at |
|---|---|---|---|
| `cut` | `z.object({ name: KebabSlug, kind: z.literal('cut'), variant: z.null().default(null), ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:20` |
| `final` | `z.object({ name: KebabSlug, kind: z.literal('final'), variant: z.null().default(null), ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:23` |
| `audio` | `z.object({ name: KebabSlug, kind: z.literal('audio'), variant: KebabSlug, ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:27` |
| `overlay` | `z.object({ name: KebabSlug, kind: z.literal('overlay'), variant: KebabSlug, ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:28` |

### `src/video-file.VideoFile[kind=cut]` — zod-object — `src/video-file.ts:20`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:20` |
| `kind` | `z.literal('cut')` | — | `src/video-file.ts:20` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:20` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:20` |

### `src/video-file.VideoFile[kind=final]` — zod-object — `src/video-file.ts:21-26`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:22` |
| `kind` | `z.literal('final')` | — | `src/video-file.ts:23` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:24` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:25` |

### `src/video-file.VideoFile[kind=audio]` — zod-object — `src/video-file.ts:27`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:27` |
| `kind` | `z.literal('audio')` | — | `src/video-file.ts:27` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:27` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:27` |

### `src/video-file.VideoFile[kind=overlay]` — zod-object — `src/video-file.ts:28`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:28` |
| `kind` | `z.literal('overlay')` | — | `src/video-file.ts:28` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:28` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:28` |

### `src/video-file.UnknownVideoFile` — zod-object — `src/video-file.ts:32-36`

*aliases* `UnknownVideoFile` `src/video-file.ts:37`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('unknown-kind')` | — | `src/video-file.ts:33` |
| `name` | `z.string()` | — | `src/video-file.ts:34` |
| `ext` | `z.string().nullable()` | — | `src/video-file.ts:35` |

### `src/video-file.ParsedVideoFile` — zod-union on `kind` — `src/video-file.ts:39`

*aliases* `ParsedVideoFile` `src/video-file.ts:40`

| variant | shape | default | at |
|---|---|---|---|
| `VideoFile` | `VideoFile → src/video-file.VideoFile` | — | `src/video-file.ts:39` |
| `UnknownVideoFile` | `UnknownVideoFile → src/video-file.UnknownVideoFile` | — | `src/video-file.ts:39` |

### `src/video-file.VideoFolder` — zod-object — `src/video-file.ts:74-79`

*aliases* `VideoFolder` `src/video-file.ts:80`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug.refine((name) => !LEGACY_FOLDERS.includes(name), 'a legacy layout name (first-edit, edits, …) is never a video') → src/project-folder.KebabSlug, src/classify.LEGACY_FOLDERS` | — | `src/video-file.ts:75` |

### `src/video-file.VideoFolderName` — zod-scalar — `src/video-file.ts:86-91`

The same rule as a string schema, for contexts that carry the folder name (`OpenContext.video`).

`z.string().regex(VIDEO_FOLDER_PATTERN, 'video must be a video folder name: a kebab-case name, e.g. flivideo-tour')`

### `src/window-state.WindowRect` — zod-object — `src/window-state.ts:16-21`

Window positions that survive a restart (David, 2026-09-22): every Fli app window reopens where he last put it —

*aliases* `WindowRect` `src/window-state.ts:22`

| field | type | default | at |
|---|---|---|---|
| `x` | `z.number()` | — | `src/window-state.ts:17` |
| `y` | `z.number()` | — | `src/window-state.ts:18` |
| `width` | `z.number()` | — | `src/window-state.ts:19` |
| `height` | `z.number()` | — | `src/window-state.ts:20` |

### `src/window-state.SavedWindow` — zod-object — `src/window-state.ts:24-28`

*extends* `WindowRect`

*aliases* `SavedWindow` `src/window-state.ts:29`

| field | type | default | at | note |
|---|---|---|---|---|
| `x` | `z.number()` | — | `src/window-state.ts:17` |  |
| `y` | `z.number()` | — | `src/window-state.ts:18` |  |
| `width` | `z.number()` | — | `src/window-state.ts:19` |  |
| `height` | `z.number()` | — | `src/window-state.ts:20` |  |
| `maximized` | `z.boolean().optional()` | — | `src/window-state.ts:25` |  |
| `displayId` | `z.number().optional()` | — | `src/window-state.ts:27` | Electron display id the window was on — informational; placement is decided by geometry. |

### `src/window-state.WindowStateFile` — zod-object — `src/window-state.ts:32-35`

The store: `{ schema: 1, windows: { "<app>/<role>": SavedWindow } }`.

*aliases* `WindowStateFile` `src/window-state.ts:36`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/window-state.ts:33` |
| `windows` | `z.record(z.string(), SavedWindow) → src/window-state.SavedWindow` | — | `src/window-state.ts:34` |

### `src/window-state.DisplayArea` — zod-object — `src/window-state.ts:39-44`

One display as the app sees it: Electron's `display.id`, `display.workArea` and whether it is the primary one.

*aliases* `DisplayArea` `src/window-state.ts:45`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.number()` | — | `src/window-state.ts:40` |  |
| `workArea` | `WindowRect → src/window-state.WindowRect` | — | `src/window-state.ts:42` | The display's work area (excludes the menu bar and Dock). |
| `primary` | `z.boolean().optional()` | — | `src/window-state.ts:43` |  |

### `src/window-state.PlaceOptions` — interface — `src/window-state.ts:47-57`

| field | type | default | at | note |
|---|---|---|---|---|
| `width` | `number` | — | `src/window-state.ts:48` |  |
| `height` | `number` | — | `src/window-state.ts:49` |  |
| `minWidth` | `?: number` | — | `src/window-state.ts:50` |  |
| `minHeight` | `?: number` | — | `src/window-state.ts:51` |  |
| `keepSize` | `?: boolean` | — | `src/window-state.ts:56` | `false`: restore the monitor and position but open at `width` × `height` (FliCast's uat harness — its layout |

### `src/window-state.TrackedWindow` — type — `src/window-state.ts:255-262`

The part of an Electron `BrowserWindow` that `trackWindow` needs. Methods, not data — so a structural type rather

| field | type | default | at |
|---|---|---|---|
| `on` | `(event: 'move' \| 'resize' \| 'close', listener: () => void): unknown` | — | `src/window-state.ts:256` |
| `isDestroyed` | `(): boolean` | — | `src/window-state.ts:257` |
| `isMinimized` | `(): boolean` | — | `src/window-state.ts:258` |
| `isFullScreen` | `(): boolean` | — | `src/window-state.ts:259` |
| `isMaximized` | `(): boolean` | — | `src/window-state.ts:260` |
| `getNormalBounds` | `(): WindowRect` | — | `src/window-state.ts:261` |

### `src/window-state.TrackOptions` — interface — `src/window-state.ts:264-270`

| field | type | default | at | note |
|---|---|---|---|---|
| `displayIdOf` | `?: (bounds: WindowRect) => number → src/window-state.WindowRect` | — | `src/window-state.ts:266` | `screen.getDisplayMatching(bounds).id`, to record which monitor it was on. |
| `file` | `?: string` | — | `src/window-state.ts:267` |  |
| `debounceMs` | `?: number` | — | `src/window-state.ts:269` | Wait this long after the last move/resize before saving; default 400 ms. |

## Cannot be mirrored

These were looked at and could not be resolved to an authority. **Nothing is guessed for them.** Each is a real gap in this page.

| subject | why | looked at |
|---|---|---|
| schemas built by `Refused(...)` (3 uses) | built by calling the schema factory `Refused(...)`; the factory's own shape is mirrored as `src/identity.Refused()`, but each parameterised result is not expanded here | `Refused('invalid-input') (src/identity.ts:63)`<br>`Refused('existing-invalid') (src/identity.ts:65)`<br>`Refused('io-error') (src/identity.ts:66)` |
| schemas built by `readFileResult(...)` (2 uses) | built by calling the schema factory `readFileResult(...)`; the factory's own shape is mirrored as `src/results.readFileResult()`, but each parameterised result is not expanded here | `readFileResult(BrandSettings) (src/brand-settings.ts:18)`<br>`readFileResult(ProjectIdentity) (src/identity.ts:45)` |
| schemas built by `scanned(...)` (3 uses) | built by calling the schema factory `scanned(...)`; the factory's own shape is mirrored as `src/estate.scanned()`, but each parameterised result is not expanded here | `scanned(MemberProject) (src/estate.ts:69)`<br>`scanned(OtherFolder) (src/estate.ts:70)`<br>`scanned(ArchivedEntry) (src/estate.ts:71)` |
| schemas built by `validFile(...)` (1 use) | built by calling the schema factory `validFile(...)`; the factory's own shape is mirrored as `src/results.validFile()`, but each parameterised result is not expanded here | `validFile(value) (src/results.ts:20)` |

### Declared but not read

The census found these top-level declarations and the extractor did not mirror them. Nothing else about them is on this page.

| family | count | declarations |
|---|---|---|
| object constant | 5 | `src/classify.LAYOUT_DIRS` `src/classify.ts:111`<br>`src/failure-codes.FAILURE_CODE_RANGE` `src/failure-codes.ts:31`<br>`src/failure-codes.JSONRPC_CODES` `src/failure-codes.ts:22`<br>`src/lifecycle.LIFECYCLE_CAPABILITIES` `src/lifecycle.ts:48`<br>`src/open-args.OPEN_ENV` `src/open-args.ts:47` |
| generic type alias | 4 | `src/capability.ContractInput` `src/capability.ts:79`<br>`src/estate.Scanned` `src/estate.ts:28`<br>`src/results.ReadFileResult` `src/results.ts:22`<br>`src/results.ValidFile` `src/results.ts:16` |
| class | 2 | `src/failure-codes.CapabilityRefusal` `src/failure-codes.ts:171`<br>`src/results.FliCoreError` `src/results.ts:25` |
| const built by a call (helper or non-zod call) | 2 | `src/failure-codes.SUITE_FAILURE_CODES` `src/failure-codes.ts:34`<br>`src/failure-codes.SUITE_REFUSAL_DETAILS` `src/failure-codes.ts:164` |
| array constant | 1 | `src/identity.DEFAULT_LANGUAGES` `src/identity.ts:27` |
| derived type (`keyof typeof`, indexed access, `typeof`) | 1 | `src/failure-codes.SuiteFailureMode` `src/failure-codes.ts:49` |

## Findings — changes needed in the target application

These are refactors of the **application**, not of this mirror. Each one converts a derived section into a declared one.

1. `src/classify.ts:36-43` — REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:36 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.
2. `src/fs-utils.ts:32` — REFACTOR (minor): `NO_HARD_LINKS` at src/fs-utils.ts:32 names the set but does not type it. A z.enum or `as const` + `typeof NO_HARD_LINKS[number]` would make a wrong value a static error rather than a runtime miss.

---

Regenerate: `schema-mirror` skill → `extract_typescript.py` + `render_mirror.py`. Check for drift: `verify_mirror.py`.
