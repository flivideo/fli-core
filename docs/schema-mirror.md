# Schema mirror

> Generated from the code, not written about it. Do not hand-edit — every line below is anchored to a `file:line` and is re-derived on every run. `verify_mirror.py` fails when this page no longer matches its JSON. To record a gap the extractor cannot find, use `docs/schema-mirror.known-gaps.json`.

- **stack** `typescript` · **extractor** `extract_typescript.py`
- **commit** `bea2cdf5395d` · **generated** 2026-10-06T14:16:02+00:00
- **scope** include `*.ts`, `*.tsx` · exclude `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `*.stories.tsx`, `*.config.ts`, `*/test/*`, `*/tests/*`, `*/__tests__/*`, `*/e2e/*`, `*/__mocks__/*`, `*/fixtures/*`, `*.d.ts`, `*/dist/*`, `*/build/*`, `*/out/*`
- **zod bound** in 33 file(s) by a direct import, 0 through a re-export, 0 by call shape only

| shapes | declared sets | derived sets | gaps | declared but not read | findings |
|---|---|---|---|---|---|
| 268 | 74 | 6 | 9 | 33 | 6 |

> **Read the gaps, the census and the never-read list before trusting the shape.** Derived sets have no declaring symbol and will drift silently. Gaps are things this mirror could not reach — they are not absences in the code.

## Index

Top-level entries by file, with the line each is declared on. Search the page for the name.

- `src/api-page.ts` — `ApiPageOptions` :16
- `src/app-file.ts` — `AppName` :15 · `AppSubject` :19 · `AppFile` :26
- `src/brand-settings.ts` — `TranscriptionChoice` :14 · `BrandPublishSettings` :28 · `BrandYouTubeSettings` :45 · `BrandStudioDefaults` :54 · `BrandSettings` :61 · `WriteBrandSettingsResult` :91
- `src/brands.ts` — `Brand` :9 · `RegistryEntry` :20 · `BrandsFile` :28 · `SkippedBrand` :32 · `BrandsRead` :35 · `ReadBrandsResult` :45 · `ReadBrandsOptions` :48 · `ResolveBrandRootOptions` :92
- `src/capability.ts` — `PrincipalKind` (set) :17 · `PrincipalName` :20 · `CapabilityKind` (set) :35 · `SideEffects` (set) :39 · `ExpectedDuration` (set) :47 · `CapabilityName` :51 · `HumanOnlyWhen` :59 · `CapabilityContract` :61 · `Authorization` :122 · `CapabilityMeta` :187
- `src/classify.ts` — `ProjectZone` (set) :11 · `ASSEMBLY_FOLDERS` (set) :63 · `LEGACY_FOLDERS` (set) :66 · `MOTION_MACHINERY` (set) :122 · `ProjectTier` (set) :136 · `OverlayRole` (set) :147 · `ProjectEntry` :150 · `ProjectLayout` (set) :245 · `ProjectLayoutPaths` :248
- `src/control-file.ts` — `ControlFile` :18 · `ControlFileRead` :30 · `ControlFileOptions` :39
- `src/estate.ts` — `scanned()` :17 · `MemberProject` :31 · `OtherFolder` :41 · `ArchivedEntry` :53 · `ProjectListing` :66 · `ProjectFound` :189 · `ProjectAmbiguous` :195 · `ProjectNotAProject` :201 · `ProjectNotFound` :206 · `ProjectUnscanned` :207 · `ProjectRefusal` :215 · `ResolveProjectResult` :223 · `NextCodeResult` :280
- `src/failure-codes.ts` — `FailureCodeTable` :52 · `Refusal` :132 · `ForbiddenDetails` :140 · `MissingDetails` :149 · `BusyWork` :153 · `AppBusyDetails` :160
- `src/flitools.ts` — `TranscriptFiles` :13 · `TranscriptJobStatus` (set) :16 · `TranscriptJob` :20 · `TranscriptFound` :35 · `FliToolsAnswer` :44 · `FliToolsOptions` :49 · `TranscribeOptions` :58
- `src/fs-utils.ts` — `NO_HARD_LINKS` (set) :32
- `src/gitignore-rules.ts` — `GITIGNORE_BASE_VERSION` :19 · `Tag` :24 · `GitignoreOverlayRule` :38 · `GitignoreGroup` :45 · `GitignoreRenderOptions` :161 · `Located` :194 · `GitignoreRenderResult` :238 · `GitignoreCheckResult` :334
- `src/gitignore.ts` — `TrackedIgnored` :23 · `GitignoreOptions` :31 · `GitignoreRefusal` :42 · `GitignoreRenderedFile` :49 · `GitignoreCheckedFile` :57 · `GitignoreResult` :63
- `src/identity.ts` — `ProjectAspect` (set) :13 · `ProjectShape` (set) :23 · `ProjectLanguage` :28 · `ProjectIdentity` :31 · `Refused()` :57 · `WriteIdentityResult` :65 · `AdoptIdentityResult` :178 · `AdoptIdentityInput` :193
- `src/lab-path.ts` — `PathSegment` :8 · `LabPathInput` :16 · `ResolvedLabPath` :84
- `src/lifecycle.ts` — `LifecycleVerb` (set) :18 · `SystemStatus` :21 · `SystemQuitInput` :34 · `SystemQuitOutput` :40 · `AppScriptOpen` :84
- `src/machine.ts` — `AbsolutePath` :7 · `MachineSettings` :12 · `ResolvedMachineSettings` :24 · `MachineSettingsOptions` :27 · `MachineSettingsResult` :32
- `src/open-args.ts` — `OpenContext` :11 · `OpenArgs` :27 · `OpenArgName` (set) :36 · `RawOpenArgs` :40 · `ParseOpenArgsOptions` :53 · `ParsedOpenArgs` :58
- `src/open-context.ts` — `OpenContextResult` :16 · `ResolveOpenContextOptions` :33
- `src/openrpc.ts` — `OpenRpcServer` :18 · `OpenRpcDocument` :29 · `OpenRpcOptions` :52 · `JsonRpcRequest` :174 · `CallAnswer` :183 · `JsonRpcOptions` :185
- `src/project-folder.ts` — `ProjectCode` :5 · `KebabSlug` :11 · `ProjectFolder` :15
- `src/publish.ts` — `PublishPiece` (set) :41 · `PublishState` (set) :61 · `PUBLISH_RULES` (set) :75 · `EditApp` (set) :85 · `Iso` :88 · `PublishExport` :91 · `PublishEdit` :112 · `PublishLaunch` :116 · `PublishFacts` :128 · `PublishRow` :139 · `PublishReadiness` :160 · `LIVE` (set) :193 · `PublishedVideo` :680
- `src/recipe-paths.ts` — `RecipePathProblem` (set) :15 · `RecipePathWarning` :18 · `SKIP` (set) :77
- `src/recording.ts` — `RecordingTag` :14 · `Recording` :18
- `src/renders.ts` — `PathSegment` :15 · `RendersPathInput` :23 · `RendersTool` :52 · `RendersTally` :59 · `ClearRendersResult` :121
- `src/resources.ts` — `Text` :25 · `Key` :26 · `ResourceValue` (set) :31 · `ResourceChoose` (set) :47 · `ResourceStatus` (set) :50 · `ResourceAudience` (set) :53 · `ResourceGroup` :56 · `ResourceKind` :64 · `ResourceOff` :79 · `ResourceVideo` :85 · `ResourceRef` :90 · `Resource` :97 · `ResourcesFile` :118 · `ResourceRegistry` :147 · `ReadResourcesOptions` :156 · `ResourcesRead` :162 · `ResourceInput` :285 · `ResourceChange` :309 · `ResourcePatch` :387 · `WriteResourcesResult` :531
- `src/results.ts` — `InvalidFile` :4 · `validFile()` :13 · `readFileResult()` :19
- `src/reveal.ts` — `RevealResult` :13 · `RevealOptions` :24
- `src/series.ts` — `SeriesMember` :22 · `SeriesFile` :32 · `SeriesListing` :74 · `Refusal` :102 · `ChangeSeriesResult` :117 · `ChangeSeriesOptions` :123 · `SeriesRef` :271 · `Changed` :272
- `src/stamp.ts` — `Stamp` :9
- `src/transport.ts` — `ShuttleState` :15 · `JklKey` (set) :27 · `ShuttleAction` (set) :45
- `src/video-file.ts` — `Ext` :15 · `VideoFileKind` (set) :17 · `VideoPart` (set) :21 · `VideoFile` :24 · `UnknownVideoFile` :38 · `ParsedVideoFile` :45 · `VideoFolder` :80 · `VideoFolderName` :92
- `src/window-state.ts` — `WindowRect` :16 · `SavedWindow` :24 · `WindowStateFile` :32 · `DisplayArea` :39 · `PlaceOptions` :47 · `TrackedWindow` :255 · `TrackOptions` :264
- `src/words.ts` — `WordLevel` (set) :25 · `Text` :29 · `WordName` :32 · `WordRule` :40 · `WordFiller` :44 · `WordKind` (set) :52 · `WordOff` :56 · `WordsFile` :59 · `WordInput` :72 · `WordRef` :95 · `MergedWords` :99 · `WordsRead` :108 · `ReadWordsOptions` :121 · `WriteWordsResult` :287 · `ChangeWordsResult` :320 · `ChangeWordsOptions` :335
- `src/youtube.ts` — `YouTubeChannel` :34 · `YouTubePlaylistItem` :48 · `YouTubePlaylist` :57 · `YouTubePlaylistsFile` :72 · `YouTubeVideo` :79 · `YouTubeSyncCounts` :99 · `YouTubeSyncRecord` :107 · `YouTubeVideoListing` :156 · `SyncYouTubeOptions` :432 · `SyncYouTubeResult` :445

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

**397** top-level declarations counted = **342** mirrored + **22** listed as gaps + **33** declared but not read.

Counted: every top-level interface, enum, class and type alias (exported or not) and every exported constant, in the files in scope.
Not counted, as not schema-bearing: 1 function, 1 function type, 28 literal constants.

| file | declared | mirrored | gaps | not read |
|---|---|---|---|---|
| `src/capability.ts` | 17 | 16 | 0 | **1** |
| `src/classify.ts` | 16 | 15 | 0 | **1** |
| `src/estate.ts` | 15 | 14 | 0 | **1** |
| `src/failure-codes.ts` | 18 | 12 | 0 | **6** |
| `src/gitignore-rules.ts` | 13 | 10 | 0 | **3** |
| `src/identity.ts` | 15 | 12 | 2 | **1** |
| `src/lifecycle.ts` | 11 | 10 | 0 | **1** |
| `src/open-args.ts` | 12 | 11 | 0 | **1** |
| `src/publish.ts` | 27 | 22 | 0 | **5** |
| `src/renders.ts` | 9 | 8 | 0 | **1** |
| `src/resources.ts` | 44 | 33 | 8 | **3** |
| `src/results.ts` | 5 | 2 | 0 | **3** |
| `src/series.ts` | 12 | 9 | 2 | **1** |
| `src/transport.ts` | 5 | 4 | 0 | **1** |
| `src/words.ts` | 31 | 28 | 2 | **1** |
| `src/youtube.ts` | 28 | 19 | 6 | **3** |

## Closed sets — declared

One symbol states each set. Adding a member changes that symbol, so these cannot drift.

### `src/brand-settings.WriteBrandSettingsResult.kind` — `src/brand-settings.ts:91-99`

*the `kind` discriminator of the union `WriteBrandSettingsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/brand-settings.ts:92` |
| `refused` | `src/brand-settings.ts:94` |

### `src/brand-settings.WriteBrandSettingsResult[kind=refused].reason` — `src/brand-settings.ts:95`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/brand-settings.ts:95` |
| `io-error` | `src/brand-settings.ts:95` |

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

### `src/classify.ProjectZone` — `src/classify.ts:11-36`

Which zone of the project layout (spec §3, roadmap §1) a path inside a project belongs to.

*`z.enum` `ProjectZone` - a single declaring symbol*

*aliases* `ProjectZone` `src/classify.ts:41`

| value | declared at |
|---|---|
| `identity` | `src/classify.ts:12` |
| `app-decisions` | `src/classify.ts:13` |
| `recordings` | `src/classify.ts:14` |
| `transcripts` | `src/classify.ts:15` |
| `cast` | `src/classify.ts:16` |
| `voice` | `src/classify.ts:18` |
| `avatar` | `src/classify.ts:19` |
| `script` | `src/classify.ts:20` |
| `motion` | `src/classify.ts:22` |
| `overlay` | `src/classify.ts:24` |
| `framing` | `src/classify.ts:26` |
| `assembly` | `src/classify.ts:28` |
| `renders` | `src/classify.ts:30` |
| `videos` | `src/classify.ts:31` |
| `legacy` | `src/classify.ts:32` |
| `trash` | `src/classify.ts:34` |
| `other` | `src/classify.ts:35` |

### `src/classify.ProjectTier` — `src/classify.ts:136-143`

How much a path matters (the plan §1.1 tier test: "if you deleted it, could you get it back by re-running a tool?"):

*`z.enum` `ProjectTier` - a single declaring symbol*

*aliases* `ProjectTier` `src/classify.ts:144`

| value | declared at |
|---|---|
| `authored` | `src/classify.ts:137` |
| `input` | `src/classify.ts:138` |
| `generated` | `src/classify.ts:139` |
| `regenerable` | `src/classify.ts:140` |
| `output` | `src/classify.ts:141` |
| `other` | `src/classify.ts:142` |

### `src/classify.OverlayRole` — `src/classify.ts:147`

What a file under `overlay/` is (B ruling): `beats.json` and `framing.json` are authored, `spec.json` is generated.

*`z.enum` `OverlayRole` - a single declaring symbol*

*aliases* `OverlayRole` `src/classify.ts:148`

| value | declared at |
|---|---|
| `beats` | `src/classify.ts:147` |
| `framing` | `src/classify.ts:147` |
| `spec` | `src/classify.ts:147` |
| `variant-file` | `src/classify.ts:147` |

### `src/classify.ProjectLayout` — `src/classify.ts:245`

*`z.enum` `ProjectLayout` - a single declaring symbol*

*aliases* `ProjectLayout` `src/classify.ts:246`

| value | declared at |
|---|---|
| `hub` | `src/classify.ts:245` |
| `legacy` | `src/classify.ts:245` |

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

### `src/gitignore-rules.GitignoreRenderResult.status` — `src/gitignore-rules.ts:239`

*`z.enum` `status` - a single declaring symbol*

| value | declared at |
|---|---|
| `created` | `src/gitignore-rules.ts:239` |
| `updated` | `src/gitignore-rules.ts:239` |
| `unchanged` | `src/gitignore-rules.ts:239` |
| `refused` | `src/gitignore-rules.ts:239` |

### `src/gitignore-rules.GitignoreCheckResult.status` — `src/gitignore-rules.ts:336`

*`z.enum` `status` - a single declaring symbol*

| value | declared at |
|---|---|
| `ok` | `src/gitignore-rules.ts:336` |
| `drift` | `src/gitignore-rules.ts:336` |
| `no-block` | `src/gitignore-rules.ts:336` |
| `broken-markers` | `src/gitignore-rules.ts:336` |

### `src/gitignore.GitignoreRefusal.reason` — `src/gitignore.ts:44`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `no-brand-root` | `src/gitignore.ts:44` |
| `brand-settings-invalid` | `src/gitignore.ts:44` |
| `damaged-markers` | `src/gitignore.ts:44` |
| `io-error` | `src/gitignore.ts:44` |

### `src/gitignore.GitignoreResult.kind` — `src/gitignore.ts:63-67`

*the `kind` discriminator of the union `GitignoreResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `rendered` | `src/gitignore.ts:50` |
| `checked` | `src/gitignore.ts:58` |
| `refused` | `src/gitignore.ts:43` |

### `src/identity.ProjectAspect` — `src/identity.ts:13`

The shape a project's videos are made for (David 2026-09-23, B584). Absent → `16:9`.

*`z.enum` `ProjectAspect` - a single declaring symbol*

*aliases* `ProjectAspect` `src/identity.ts:14`

| value | declared at |
|---|---|
| `16:9` | `src/identity.ts:13` |
| `9:16` | `src/identity.ts:13` |
| `1:1` | `src/identity.ts:13` |

### `src/identity.ProjectShape` — `src/identity.ts:23`

What the project is for — a HINT only, no behaviour yet (David 2026-09-23; brains `video-as-code/

*`z.enum` `ProjectShape` - a single declaring symbol*

*aliases* `ProjectShape` `src/identity.ts:24`

| value | declared at |
|---|---|
| `single` | `src/identity.ts:23` |
| `shorts` | `src/identity.ts:23` |
| `episodes` | `src/identity.ts:23` |

### `src/identity.WriteIdentityResult.kind` — `src/identity.ts:65-71`

*the `kind` discriminator of the union `WriteIdentityResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/identity.ts:66` |
| `refused` | `src/identity.ts:59` |

### `src/identity.AdoptIdentityResult[0].kind` — `src/identity.ts:181`

*`z.enum` `kind` - a single declaring symbol*

| value | declared at |
|---|---|
| `created` | `src/identity.ts:181` |
| `updated` | `src/identity.ts:181` |
| `kept` | `src/identity.ts:181` |

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

### `src/publish.PublishPiece` — `src/publish.ts:41`

*`z.enum` `PublishPiece` - members read through `PUBLISH_PIECES` (src/publish.PUBLISH_PIECES) - a single declaring symbol*

*aliases* `PublishPiece` `src/publish.ts:42`

| value | declared at |
|---|---|
| `video` | `src/publish.ts:31` |
| `audio` | `src/publish.ts:32` |
| `captions` | `src/publish.ts:33` |
| `thumbnail` | `src/publish.ts:34` |
| `title` | `src/publish.ts:35` |
| `description` | `src/publish.ts:36` |
| `chapters` | `src/publish.ts:37` |
| `studio` | `src/publish.ts:38` |
| `published` | `src/publish.ts:39` |

### `src/publish.PublishState` — `src/publish.ts:61`

Human vs AI must be visible (David 2026-10-05): `set` — a person's choice; `suggested` — an agent's choice (Tuber,

*`z.enum` `PublishState` - a single declaring symbol*

*aliases* `PublishState` `src/publish.ts:62`

| value | declared at |
|---|---|
| `set` | `src/publish.ts:61` |
| `suggested` | `src/publish.ts:61` |
| `inferred` | `src/publish.ts:61` |
| `default` | `src/publish.ts:61` |
| `missing` | `src/publish.ts:61` |
| `stale` | `src/publish.ts:61` |

### `src/publish.PUBLISH_RULES` — `src/publish.ts:75-81`

*`as const` object keys `PUBLISH_RULES`, typed from by `keyof typeof PUBLISH_RULES` - a single declaring symbol*

| value | declared at |
|---|---|
| `newest-export` | `src/publish.ts:76` |
| `audio-from-name` | `src/publish.ts:77` |
| `same-export-captions` | `src/publish.ts:78` |
| `ylo-launch` | `src/publish.ts:79` |
| `brand-default` | `src/publish.ts:80` |

### `src/publish.EditApp` — `src/publish.ts:85`

The app that writes an export kind: FliCut writes `-cut` and `-audio-<treatment>`, FliEdit `-final` (+ overlays).

*`z.enum` `EditApp` - a single declaring symbol*

*aliases* `EditApp` `src/publish.ts:86`

| value | declared at |
|---|---|
| `flicut` | `src/publish.ts:85` |
| `fliedit` | `src/publish.ts:85` |

### `src/publish.PublishExport.kind` — `src/publish.ts:95`

*`z.enum` `kind` - a single declaring symbol*

| value | declared at |
|---|---|
| `cut` | `src/publish.ts:95` |
| `audio` | `src/publish.ts:95` |
| `final` | `src/publish.ts:95` |
| `overlay` | `src/publish.ts:95` |
| `part` | `src/publish.ts:95` |

### `src/publish.PublishRow.source` — `src/publish.ts:148`

*`z.enum` `source` - a single declaring symbol*

| value | declared at |
|---|---|
| `choice` | `src/publish.ts:148` |
| `rule` | `src/publish.ts:148` |
| `brand` | `src/publish.ts:148` |
| `ylo` | `src/publish.ts:148` |
| `none` | `src/publish.ts:148` |

### `src/recipe-paths.RecipePathProblem` — `src/recipe-paths.ts:15`

The ingest rule (workstream B ruling, 2026-10-05): **a recipe may only reference paths inside its own project.**

*`z.enum` `RecipePathProblem` - a single declaring symbol*

*aliases* `RecipePathProblem` `src/recipe-paths.ts:16`

| value | declared at |
|---|---|
| `absolute` | `src/recipe-paths.ts:15` |
| `home` | `src/recipe-paths.ts:15` |
| `file-url` | `src/recipe-paths.ts:15` |
| `escapes-project` | `src/recipe-paths.ts:15` |

### `src/renders.ClearRendersResult.kind` — `src/renders.ts:121-134`

*the `kind` discriminator of the union `ClearRendersResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cleared` | `src/renders.ts:123` |
| `refused` | `src/renders.ts:130` |

### `src/renders.ClearRendersResult[kind=refused].reason` — `src/renders.ts:131`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/renders.ts:131` |
| `not-a-folder` | `src/renders.ts:131` |
| `io-error` | `src/renders.ts:131` |

### `src/resources.ResourceValue` — `src/resources.ts:31-40`

How a value is drawn. A new one is code (a renderer); everything else is data.

*`z.enum` `ResourceValue` - a single declaring symbol*

*aliases* `ResourceValue` `src/resources.ts:41`

| value | declared at |
|---|---|
| `text` | `src/resources.ts:32` |
| `url` | `src/resources.ts:33` |
| `path` | `src/resources.ts:34` |
| `image` | `src/resources.ts:35` |
| `list` | `src/resources.ts:36` |
| `chapters` | `src/resources.ts:37` |
| `ref` | `src/resources.ts:38` |
| `meta` | `src/resources.ts:39` |

### `src/resources.ResourceChoose` — `src/resources.ts:47`

How candidates of a kind are chosen: `one` — at most one `chosen` per video; `one+test` — that, plus any number

*`z.enum` `ResourceChoose` - a single declaring symbol*

*aliases* `ResourceChoose` `src/resources.ts:48`

| value | declared at |
|---|---|
| `none` | `src/resources.ts:47` |
| `one` | `src/resources.ts:47` |
| `one+test` | `src/resources.ts:47` |
| `published` | `src/resources.ts:47` |

### `src/resources.ResourceStatus` — `src/resources.ts:50`

*`z.enum` `ResourceStatus` - a single declaring symbol*

*aliases* `ResourceStatus` `src/resources.ts:51`

| value | declared at |
|---|---|
| `candidate` | `src/resources.ts:50` |
| `in-test` | `src/resources.ts:50` |
| `chosen` | `src/resources.ts:50` |
| `published` | `src/resources.ts:50` |
| `retired` | `src/resources.ts:50` |

### `src/resources.ResourceAudience` — `src/resources.ts:53`

*`z.enum` `ResourceAudience` - a single declaring symbol*

*aliases* `ResourceAudience` `src/resources.ts:54`

| value | declared at |
|---|---|
| `youtube` | `src/resources.ts:53` |
| `skool` | `src/resources.ts:53` |
| `internal` | `src/resources.ts:53` |

### `src/resources.WriteResourcesResult.kind` — `src/resources.ts:531-539`

*the `kind` discriminator of `z.discriminatedUnion` `WriteResourcesResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/resources.ts:532` |
| `refused` | `src/resources.ts:534` |

### `src/resources.WriteResourcesResult[kind=refused].reason` — `src/resources.ts:535`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/resources.ts:535` |
| `io-error` | `src/resources.ts:535` |

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

### `src/series.Refusal.reason` — `src/series.ts:104`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/series.ts:105` |
| `series-exists` | `src/series.ts:106` |
| `series-not-found` | `src/series.ts:107` |
| `member-not-found` | `src/series.ts:108` |
| `unusable-file` | `src/series.ts:109` |
| `busy` | `src/series.ts:110` |
| `io-error` | `src/series.ts:111` |

### `src/series.ChangeSeriesResult.kind` — `src/series.ts:117-120`

*the `kind` discriminator of the union `ChangeSeriesResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/series.ts:118` |
| `refused` | `src/series.ts:103` |

### `src/transport.JklKey` — `src/transport.ts:27`

*literal union type alias `JklKey` - a single declaring symbol*

| value | declared at |
|---|---|
| `J` | `src/transport.ts:27` |
| `K` | `src/transport.ts:27` |
| `L` | `src/transport.ts:27` |

### `src/transport.ShuttleAction` — `src/transport.ts:45`

*literal union type alias `ShuttleAction` - a single declaring symbol*

| value | declared at |
|---|---|
| `togglePlay` | `src/transport.ts:45` |
| `playForward` | `src/transport.ts:45` |
| `playBackward` | `src/transport.ts:45` |
| `stop` | `src/transport.ts:45` |

### `src/video-file.VideoFileKind` — `src/video-file.ts:17`

*`z.enum` `VideoFileKind` - a single declaring symbol*

*aliases* `VideoFileKind` `src/video-file.ts:18`

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:17` |
| `audio` | `src/video-file.ts:17` |
| `overlay` | `src/video-file.ts:17` |
| `final` | `src/video-file.ts:17` |
| `part` | `src/video-file.ts:17` |

### `src/video-file.VideoPart` — `src/video-file.ts:21`

Which section of a video a `part` file is. A closed set: `<name>-part-<intro|body|outro>`.

*`z.enum` `VideoPart` - a single declaring symbol*

*aliases* `VideoPart` `src/video-file.ts:22`

| value | declared at |
|---|---|
| `intro` | `src/video-file.ts:21` |
| `body` | `src/video-file.ts:21` |
| `outro` | `src/video-file.ts:21` |

### `src/video-file.VideoFile.kind` — `src/video-file.ts:24-35`

*the `kind` discriminator of `z.discriminatedUnion` `VideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:25` |
| `final` | `src/video-file.ts:28` |
| `audio` | `src/video-file.ts:32` |
| `overlay` | `src/video-file.ts:33` |
| `part` | `src/video-file.ts:34` |

### `src/video-file.ParsedVideoFile.kind` — `src/video-file.ts:45`

*the `kind` discriminator of the union `ParsedVideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:25` |
| `final` | `src/video-file.ts:28` |
| `audio` | `src/video-file.ts:32` |
| `overlay` | `src/video-file.ts:33` |
| `part` | `src/video-file.ts:34` |
| `unknown-kind` | `src/video-file.ts:39` |

### `src/words.WordLevel` — `src/words.ts:25`

*`z.enum` `WordLevel` - a single declaring symbol*

*aliases* `WordLevel` `src/words.ts:26`

| value | declared at |
|---|---|
| `global` | `src/words.ts:25` |
| `brand` | `src/words.ts:25` |
| `project` | `src/words.ts:25` |

### `src/words.WordKind` — `src/words.ts:52`

*`z.enum` `WordKind` - a single declaring symbol*

*aliases* `WordKind` `src/words.ts:53`

| value | declared at |
|---|---|
| `name` | `src/words.ts:52` |
| `rule` | `src/words.ts:52` |
| `filler` | `src/words.ts:52` |

### `src/words.WordInput.kind` — `src/words.ts:72-91`

*the `kind` discriminator of `z.discriminatedUnion` `WordInput` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `name` | `src/words.ts:74` |
| `rule` | `src/words.ts:83` |
| `filler` | `src/words.ts:85` |
| `off` | `src/words.ts:90` |

### `src/words.WordRef.kind` — `src/words.ts:95`

*`z.enum` `kind` - a single declaring symbol*

| value | declared at |
|---|---|
| `name` | `src/words.ts:95` |
| `rule` | `src/words.ts:95` |
| `filler` | `src/words.ts:95` |
| `off` | `src/words.ts:95` |

### `src/words.WriteWordsResult.kind` — `src/words.ts:287-295`

*the `kind` discriminator of `z.discriminatedUnion` `WriteWordsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/words.ts:288` |
| `refused` | `src/words.ts:290` |

### `src/words.WriteWordsResult[kind=refused].reason` — `src/words.ts:291`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/words.ts:291` |
| `io-error` | `src/words.ts:291` |

### `src/words.ChangeWordsResult.kind` — `src/words.ts:320-332`

*the `kind` discriminator of `z.discriminatedUnion` `ChangeWordsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/words.ts:321` |
| `refused` | `src/words.ts:323` |

### `src/words.ChangeWordsResult[kind=refused].reason` — `src/words.ts:328`

*`z.enum` `reason` - a single declaring symbol*

| value | declared at |
|---|---|
| `invalid-input` | `src/words.ts:328` |
| `io-error` | `src/words.ts:328` |
| `unusable-file` | `src/words.ts:328` |
| `not-found` | `src/words.ts:328` |
| `busy` | `src/words.ts:328` |

### `src/youtube.SyncYouTubeResult.kind` — `src/youtube.ts:445-449`

*the `kind` discriminator of the union `SyncYouTubeResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `synced` | `src/youtube.ts:446` |
| `failed` | `src/youtube.ts:447` |
| `busy` | `src/youtube.ts:448` |

## Closed sets — derived (no declaring symbol)

Each set below was read out of the real authority — control flow, membership tests, dispatch tables — because nothing declares it. **Correct as of this commit and fragile after it.** Each carries the refactor that would make it declared.

### `src/classify.ASSEMBLY_FOLDERS` — `src/classify.ts:63`

*module constant `ASSEMBLY_FOLDERS` used in a `.includes()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `first-edit` | `src/classify.ts:63` |
| `edit` | `src/classify.ts:63` |

> **REFACTOR (minor): `ASSEMBLY_FOLDERS` at src/classify.ts:63 names the set but does not type it. A z.enum or `as const` + `typeof ASSEMBLY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.**

### `src/classify.LEGACY_FOLDERS` — `src/classify.ts:66-73`

*module constant `LEGACY_FOLDERS` used in a `.includes()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `first-edit` | `src/classify.ts:67` |
| `edits` | `src/classify.ts:68` |
| `edit-1st` | `src/classify.ts:69` |
| `final` | `src/classify.ts:70` |
| `pipeline` | `src/classify.ts:71` |
| `animation` | `src/classify.ts:72` |

> **REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:66 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.**

### `src/classify.MOTION_MACHINERY` — `src/classify.ts:122-129`

*module constant `MOTION_MACHINERY` used in a `.includes()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `out` | `src/classify.ts:123` |
| `.cache` | `src/classify.ts:124` |
| `.transcode-cache` | `src/classify.ts:125` |
| `dist` | `src/classify.ts:126` |
| `build` | `src/classify.ts:127` |
| `node_modules` | `src/classify.ts:128` |

> **REFACTOR (minor): `MOTION_MACHINERY` at src/classify.ts:122 names the set but does not type it. A z.enum or `as const` + `typeof MOTION_MACHINERY[number]` would make a wrong value a static error rather than a runtime miss.**

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

### `src/publish.LIVE` — `src/publish.ts:193`

*module constant `LIVE` used in a `.has()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `chosen` | `src/publish.ts:193` |
| `published` | `src/publish.ts:193` |

> **REFACTOR (minor): `LIVE` at src/publish.ts:193 names the set but does not type it. A z.enum or `as const` + `typeof LIVE[number]` would make a wrong value a static error rather than a runtime miss.**

### `src/recipe-paths.SKIP` — `src/recipe-paths.ts:77`

*module constant `SKIP` used in a `.has()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `node_modules` | `src/recipe-paths.ts:77` |
| `.cache` | `src/recipe-paths.ts:77` |
| `out` | `src/recipe-paths.ts:77` |
| `-renders` | `src/recipe-paths.ts:77` |
| `-trash` | `src/recipe-paths.ts:77` |

> **REFACTOR (minor): `SKIP` at src/recipe-paths.ts:77 names the set but does not type it. A z.enum or `as const` + `typeof SKIP[number]` would make a wrong value a static error rather than a runtime miss.**

## Declared constants

| constant | value in code | declared at |
|---|---|---|
| `src/gitignore-rules.GITIGNORE_BASE_VERSION` | `1` | `src/gitignore-rules.ts:19` |

> These are what the **code** says. This mirror does not read the data on disk, so a disagreement between the two is still invisible here.

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

### `src/brand-settings.TranscriptionChoice` — zod-object — `src/brand-settings.ts:14-19`

A level's transcription providers (FliTools reads them: global `flitools.json` → brand `fli.brand.json` → project

*aliases* `TranscriptionChoice` `src/brand-settings.ts:20`

| field | type | default | at | note |
|---|---|---|---|---|
| `fast` | `z.string().min(1).optional()` | — | `src/brand-settings.ts:16` | Pass 1 (fast): `auto`, `groq-whisper`, `mlx-whisper`, … |
| `editGrade` | `z.string().min(1).optional()` | — | `src/brand-settings.ts:18` | Pass 2 (edit-grade): `crisperwhisper`, `elevenlabs`, `off`, … |

### `src/brand-settings.BrandPublishSettings` — zod-object — `src/brand-settings.ts:28-38`

The brand's publishing settings, authored by the brand (CTAs, affiliates, legal…). Moved verbatim from FliHub's

*aliases* `BrandPublishSettings` `src/brand-settings.ts:39`

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.looseObject({}).optional()` | — | `src/brand-settings.ts:29` |
| `socialLinks` | `z.record(z.string(), z.string()).optional()` | — | `src/brand-settings.ts:30` |
| `ctas` | `z.record(z.string(), z.looseObject({ label: z.string(), url: z.string() })).optional()` | — | `src/brand-settings.ts:31` |
| `affiliates` | `z.array(z.looseObject({ name: z.string(), url: z.string(), active: z.boolean().optional() })).optional()` | — | `src/brand-settings.ts:32` |
| `playlists` | `z.record(z.string(), z.string()).optional()` | — | `src/brand-settings.ts:35` |
| `descriptionTemplate` | `z.looseObject({}).optional()` | — | `src/brand-settings.ts:36` |
| `_meta` | `z.looseObject({}).optional()` | — | `src/brand-settings.ts:37` |

### `src/brand-settings.BrandPublishSettings.brand` — zod-object — `src/brand-settings.ts:29`

*No annotated fields found — this shape declares its fields elsewhere.*

### `src/brand-settings.BrandPublishSettings.affiliates[]` — zod-object — `src/brand-settings.ts:32`

| field | type | default | at |
|---|---|---|---|
| `name` | `z.string()` | — | `src/brand-settings.ts:33` |
| `url` | `z.string()` | — | `src/brand-settings.ts:33` |
| `active` | `z.boolean().optional()` | — | `src/brand-settings.ts:33` |

### `src/brand-settings.BrandPublishSettings.descriptionTemplate` — zod-object — `src/brand-settings.ts:36`

*No annotated fields found — this shape declares its fields elsewhere.*

### `src/brand-settings.BrandPublishSettings._meta` — zod-object — `src/brand-settings.ts:37`

*No annotated fields found — this shape declares its fields elsewhere.*

### `src/brand-settings.BrandYouTubeSettings` — zod-object — `src/brand-settings.ts:45-50`

The brand's YouTube choices, made by a person. Playlist **ids**; titles come from the YouTube mirror. Everything YouTube

*aliases* `BrandYouTubeSettings` `src/brand-settings.ts:51`

| field | type | default | at | note |
|---|---|---|---|---|
| `activePlaylists` | `z.array(z.string().min(1)).default([])` | `[]` | `src/brand-settings.ts:47` | The playlists this brand uses: offered in Launch, shown first on the brand's YouTube page. |
| `defaultPlaylists` | `z.array(z.string().min(1)).default([])` | `[]` | `src/brand-settings.ts:49` | The brand's usual picks, pre-ticked for a new video. |

### `src/brand-settings.BrandStudioDefaults` — zod-object — `src/brand-settings.ts:54-58`

The YouTube Studio defaults a new video starts with (category, audience, language). Each absent → the app's own.

*aliases* `BrandStudioDefaults` `src/brand-settings.ts:59`

| field | type | default | at |
|---|---|---|---|
| `category` | `z.string().min(1).optional()` | — | `src/brand-settings.ts:55` |
| `audience` | `z.string().min(1).optional()` | — | `src/brand-settings.ts:56` |
| `language` | `z.string().min(1).optional()` | — | `src/brand-settings.ts:57` |

### `src/brand-settings.BrandSettings` — zod-object — `src/brand-settings.ts:61-80`

*aliases* `BrandSettings` `src/brand-settings.ts:81`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/brand-settings.ts:62` |  |
| `brand` | `z.string().min(1)` | — | `src/brand-settings.ts:63` |  |
| `colour` | `z.string().regex(/^#(?:[0-9a-fA-F]{3}\|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)')` | — | `src/brand-settings.ts:64` |  |
| `transcription` | `TranscriptionChoice.optional() → src/brand-settings.TranscriptionChoice` | — | `src/brand-settings.ts:68` | The brand's transcription providers, over the suite default; absent → the suite default. |
| `gitignore` | `z.array(GitignoreOverlayRule).optional() → src/gitignore-rules.GitignoreOverlayRule` | — | `src/brand-settings.ts:73` | The brand's own `.gitignore` rules, on top of the base `gitignore.render` generates (`broll/` clips, a recipe's |
| `publish` | `BrandPublishSettings.optional() → src/brand-settings.BrandPublishSettings` | — | `src/brand-settings.ts:75` | Publishing settings (CTAs, affiliates, legal…); optional, so older readers are unaffected. |
| `youtube` | `BrandYouTubeSettings.optional() → src/brand-settings.BrandYouTubeSettings` | — | `src/brand-settings.ts:77` | The brand's YouTube playlist choices. |
| `studioDefaults` | `BrandStudioDefaults.optional() → src/brand-settings.BrandStudioDefaults` | — | `src/brand-settings.ts:79` | YouTube Studio defaults for a new video. |

### `src/brand-settings.WriteBrandSettingsResult` — zod-union on `kind` — `src/brand-settings.ts:91-99`

*aliases* `WriteBrandSettingsResult` `src/brand-settings.ts:100`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string() })` | — | `src/brand-settings.ts:92` |
| `refused` | `z.object({ kind: z.literal('refused'), reason: z.enum(['invalid-input', 'io-error']), path: z.string(), message: z.string() })` | — | `src/brand-settings.ts:94` |

### `src/brand-settings.WriteBrandSettingsResult[kind=written]` — zod-object — `src/brand-settings.ts:92`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/brand-settings.ts:92` |
| `path` | `z.string()` | — | `src/brand-settings.ts:92` |

### `src/brand-settings.WriteBrandSettingsResult[kind=refused]` — zod-object — `src/brand-settings.ts:93-98`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/brand-settings.ts:94` |
| `reason` | `z.enum(['invalid-input', 'io-error'])` | — | `src/brand-settings.ts:95` |
| `path` | `z.string()` | — | `src/brand-settings.ts:96` |
| `message` | `z.string()` | — | `src/brand-settings.ts:97` |

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

### `src/classify.ProjectEntry` — zod-object — `src/classify.ts:150-158`

*aliases* `ProjectEntry` `src/classify.ts:159`

| field | type | default | at | note |
|---|---|---|---|---|
| `zone` | `ProjectZone → src/classify.ProjectZone` | — | `src/classify.ts:151` |  |
| `tier` | `ProjectTier → src/classify.ProjectTier` | — | `src/classify.ts:152` |  |
| `chapter` | `z.string().nullable()` | — | `src/classify.ts:154` | `overlay/<chapter>/…` only; null for a flat overlay (`ships` = one video) and for every other zone. |
| `variant` | `z.string().nullable()` | — | `src/classify.ts:156` | `overlay/[<chapter>/]<variant>/…` only. |
| `role` | `OverlayRole.nullable() → src/classify.OverlayRole` | — | `src/classify.ts:157` |  |

### `src/classify.ProjectLayoutPaths` — zod-object — `src/classify.ts:248-255`

*aliases* `ProjectLayoutPaths` `src/classify.ts:256`

| field | type | default | at | note |
|---|---|---|---|---|
| `layout` | `ProjectLayout → src/classify.ProjectLayout` | — | `src/classify.ts:250` | Detected by `projectLayout` (D14). |
| `recordings` | `z.string()` | — | `src/classify.ts:252` | Absolute path of the recordings folder for this layout (it may not exist yet). |
| `transcripts` | `z.string()` | — | `src/classify.ts:254` | Absolute path of the transcripts folder for this layout (it may not exist yet). |

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

### `src/gitignore-rules.Tag` — zod-scalar — `src/gitignore-rules.ts:24`

`z.string().regex(/^[A-Z][A-Z0-9-]*$/, 'a reason tag is UPPER-KEBAB (DAMIT-MASTER)')`

### `src/gitignore-rules.GitignoreOverlayRule` — zod-object — `src/gitignore-rules.ts:38-42`

A brand's own rule, kept in its `fli.brand.json` (`gitignore: [...]`) so it travels with the repo.

*aliases* `GitignoreOverlayRule` `src/gitignore-rules.ts:43`

| field | type | default | at |
|---|---|---|---|
| `pattern` | `GitignorePattern → src/gitignore-rules.GitignorePattern` | — | `src/gitignore-rules.ts:39` |
| `reason` | `Tag → src/gitignore-rules.Tag` | — | `src/gitignore-rules.ts:40` |
| `note` | `OneLine('a note').optional() → src/gitignore-rules.OneLine` | — | `src/gitignore-rules.ts:41` |

### `src/gitignore-rules.GitignoreGroup` — zod-object — `src/gitignore-rules.ts:45-49`

*aliases* `GitignoreGroup` `src/gitignore-rules.ts:50`

| field | type | default | at |
|---|---|---|---|
| `reason` | `Tag → src/gitignore-rules.Tag` | — | `src/gitignore-rules.ts:46` |
| `note` | `z.string()` | — | `src/gitignore-rules.ts:47` |
| `patterns` | `z.array(z.string())` | — | `src/gitignore-rules.ts:48` |

### `src/gitignore-rules.GitignoreRenderOptions` — interface — `src/gitignore-rules.ts:161-165`

| field | type | default | at | note |
|---|---|---|---|---|
| `brand` | `string` | — | `src/gitignore-rules.ts:163` | The brand key (`aitldr`), as in `fli.brand.json`. Named in the marker; no path, host or user ever is. |
| `overlay` | `?: readonly GitignoreOverlayRule[] → src/gitignore-rules.GitignoreOverlayRule` | — | `src/gitignore-rules.ts:164` |  |

### `src/gitignore-rules.Located` — interface — `src/gitignore-rules.ts:194-199`

| field | type | default | at | note |
|---|---|---|---|---|
| `start` | `number` | — | `src/gitignore-rules.ts:196` | Offset of the BEGIN line's first character. |
| `end` | `number` | — | `src/gitignore-rules.ts:198` | Offset just past the END line's newline (or the end of the file). |

### `src/gitignore-rules.GitignoreRenderResult` — zod-object — `src/gitignore-rules.ts:238-252`

*aliases* `GitignoreRenderResult` `src/gitignore-rules.ts:253`

| field | type | default | at | note |
|---|---|---|---|---|
| `status` | `z.enum(['created', 'updated', 'unchanged', 'refused'])` | — | `src/gitignore-rules.ts:239` |  |
| `content` | `z.string()` | — | `src/gitignore-rules.ts:241` | The whole file after the render (the existing text, untouched, when refused). |
| `added` | `z.array(z.string())` | — | `src/gitignore-rules.ts:243` | Lines in the new block that were not in the old one. |
| `removed` | `z.array(z.string())` | — | `src/gitignore-rules.ts:245` | Lines in the old block that are not in the new one. |
| `legacyDuplicates` | `z.array(z.string())` | — | `src/gitignore-rules.ts:247` | Hand-written pattern lines outside the block that the block now also emits: reported, never deleted. |
| `blockNotLast` | `z.boolean()` | — | `src/gitignore-rules.ts:249` | The block is not the last thing in the file: a hand rule after it could undo a re-include. Reported, not moved. |
| `message` | `z.string().optional()` | — | `src/gitignore-rules.ts:251` | Why a render was refused: the markers are broken. |

### `src/gitignore-rules.GitignoreCheckResult` — zod-object — `src/gitignore-rules.ts:334-350`

*aliases* `GitignoreCheckResult` `src/gitignore-rules.ts:351`

| field | type | default | at | note |
|---|---|---|---|---|
| `status` | `z.enum(['ok', 'drift', 'no-block', 'broken-markers'])` | — | `src/gitignore-rules.ts:336` | `ok`: the block is what would be rendered. `drift`: it differs. `no-block`: never generated. `broken-markers`. |
| `ok` | `z.boolean()` | — | `src/gitignore-rules.ts:338` | `status === 'ok'`: the exit code of a hook or a fleet sweep is non-zero for everything else. |
| `missing` | `z.array(z.string())` | — | `src/gitignore-rules.ts:340` | Lines the rendered block has that the file's does not. |
| `extra` | `z.array(z.string())` | — | `src/gitignore-rules.ts:342` | Lines the file's block has that the rendered one does not (someone edited between the markers). |
| `fileBaseVersion` | `z.number().int().nullable()` | — | `src/gitignore-rules.ts:344` | The base version in the file's marker, when there is one. |
| `baseVersion` | `z.number().int()` | — | `src/gitignore-rules.ts:345` |  |
| `reason` | `z.string().optional()` | — | `src/gitignore-rules.ts:347` | Why, in a sentence, when not ok. |
| `legacyDuplicates` | `z.array(z.string())` | — | `src/gitignore-rules.ts:348` |  |
| `blockNotLast` | `z.boolean()` | — | `src/gitignore-rules.ts:349` |  |

### `src/gitignore.TrackedIgnored` — zod-object — `src/gitignore.ts:23-28`

*aliases* `TrackedIgnored` `src/gitignore.ts:29`

| field | type | default | at | note |
|---|---|---|---|---|
| `count` | `z.number().int()` | — | `src/gitignore.ts:25` | How many committed files the rendered rules now ignore. Ignoring a path does not untrack it. |
| `files` | `z.array(z.string())` | — | `src/gitignore.ts:27` | The first 100, `/`-separated, exactly as git names them (`core.quotepath=false`: no octal escapes). |

### `src/gitignore.GitignoreOptions` — interface — `src/gitignore.ts:31-40`

| field | type | default | at | note |
|---|---|---|---|---|
| `check` | `?: boolean` | — | `src/gitignore.ts:33` | Check only: write nothing. |
| `brand` | `?: string` | — | `src/gitignore.ts:35` | The brand key; default `fli.brand.json`'s `brand`, else the folder name without `v-`. |
| `overlay` | `?: readonly GitignoreOverlayRule[] → src/gitignore-rules.GitignoreOverlayRule` | — | `src/gitignore.ts:37` | Override the overlay (a scratch run); default `fli.brand.json`'s `gitignore`. |
| `tracked` | `?: boolean` | — | `src/gitignore.ts:39` | List tracked files the rules ignore (needs `git`; default `true` for a check). `null` in the result when git cannot say. |

### `src/gitignore.GitignoreRefusal` — zod-object — `src/gitignore.ts:42-47`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/gitignore.ts:43` |
| `reason` | `z.enum(['no-brand-root', 'brand-settings-invalid', 'damaged-markers', 'io-error'])` | — | `src/gitignore.ts:44` |
| `path` | `z.string()` | — | `src/gitignore.ts:45` |
| `message` | `z.string()` | — | `src/gitignore.ts:46` |

### `src/gitignore.GitignoreRenderedFile` — zod-object — `src/gitignore.ts:49-56`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.literal('rendered')` | — | `src/gitignore.ts:50` |  |
| `path` | `z.string()` | — | `src/gitignore.ts:51` |  |
| `wrote` | `z.boolean()` | — | `src/gitignore.ts:53` | `true` when the file on disk was changed (never in a check). |
| `render` | `GitignoreRenderResult → src/gitignore-rules.GitignoreRenderResult` | — | `src/gitignore.ts:54` |  |
| `trackedIgnored` | `TrackedIgnored.nullable() → src/gitignore.TrackedIgnored` | — | `src/gitignore.ts:55` |  |

### `src/gitignore.GitignoreCheckedFile` — zod-object — `src/gitignore.ts:57-62`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('checked')` | — | `src/gitignore.ts:58` |
| `path` | `z.string()` | — | `src/gitignore.ts:59` |
| `check` | `GitignoreCheckResult → src/gitignore-rules.GitignoreCheckResult` | — | `src/gitignore.ts:60` |
| `trackedIgnored` | `TrackedIgnored.nullable() → src/gitignore.TrackedIgnored` | — | `src/gitignore.ts:61` |

### `src/gitignore.GitignoreResult` — zod-union on `kind` — `src/gitignore.ts:63-67`

*aliases* `GitignoreResult` `src/gitignore.ts:68`

| variant | shape | default | at |
|---|---|---|---|
| `GitignoreRenderedFile` | `GitignoreRenderedFile → src/gitignore.GitignoreRenderedFile` | — | `src/gitignore.ts:64` |
| `GitignoreCheckedFile` | `GitignoreCheckedFile → src/gitignore.GitignoreCheckedFile` | — | `src/gitignore.ts:65` |
| `GitignoreRefusal` | `GitignoreRefusal → src/gitignore.GitignoreRefusal` | — | `src/gitignore.ts:66` |

### `src/identity.ProjectLanguage` — zod-scalar — `src/identity.ts:28`

A spoken language, as a lower-case ISO 639-1 code (`en`, `th`).

`z.string().regex(/^[a-z]{2}$/)`

### `src/identity.ProjectIdentity` — zod-object — `src/identity.ts:31-46`

*aliases* `ProjectIdentity` `src/identity.ts:47`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/identity.ts:32` |  |
| `id` | `z.uuid()` | — | `src/identity.ts:33` |  |
| `brand` | `z.string().min(1)` | — | `src/identity.ts:34` |  |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/identity.ts:35` |  |
| `name` | `z.string().min(1)` | — | `src/identity.ts:36` |  |
| `createdAt` | `z.iso.datetime({ offset: true })` | — | `src/identity.ts:37` |  |
| `aspect` | `ProjectAspect.optional() → src/identity.ProjectAspect` | — | `src/identity.ts:39` | Intent (B584): the aspect the videos are made for. Absent → `16:9` (`projectIntents`). |
| `languages` | `z.array(ProjectLanguage).min(1).optional() → src/identity.ProjectLanguage` | — | `src/identity.ts:41` | Intent (B584): what is spoken, dominant first — `["en"]`, `["th"]`, `["en","th"]`. Absent → `["en"]`. |
| `shape` | `ProjectShape.optional() → src/identity.ProjectShape` | — | `src/identity.ts:43` | Hint (§8): `single` \| `shorts` \| `episodes`. Absent → `single`. No behaviour yet. |
| `transcription` | `TranscriptionChoice.optional() → src/brand-settings.TranscriptionChoice` | — | `src/identity.ts:45` | The project's transcription providers, over the brand's and the suite's (FliTools reads them). |

### `src/identity.Refused()` — zod-factory — `src/identity.ts:57-63`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:59` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:60` |
| `path` | `z.string()` | — | `src/identity.ts:61` |
| `message` | `z.string()` | — | `src/identity.ts:62` |

### `src/identity.WriteIdentityResult` — zod-union on `kind` — `src/identity.ts:65-71`

*aliases* `WriteIdentityResult` `src/identity.ts:72`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string(), replaced: z.boolean() })` | — | `src/identity.ts:66` |
| `Refused('invalid-input')` | `Refused('invalid-input') → src/identity.Refused()` | — | `src/identity.ts:67` |
| `Refused('different-id').extend({ existingId: z.string() })` | `Refused('different-id').extend({ existingId: z.string() }) → src/identity.Refused()` | — | `src/identity.ts:68` |
| `Refused('existing-invalid')` | `Refused('existing-invalid') → src/identity.Refused()` | — | `src/identity.ts:69` |
| `Refused('io-error')` | `Refused('io-error') → src/identity.Refused()` | — | `src/identity.ts:70` |

### `src/identity.WriteIdentityResult[kind=written]` — zod-object — `src/identity.ts:66`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/identity.ts:66` |
| `path` | `z.string()` | — | `src/identity.ts:66` |
| `replaced` | `z.boolean()` | — | `src/identity.ts:66` |

### `src/identity.WriteIdentityResult[2]` — zod-object — `src/identity.ts:68`

*extends* `Refused(...)`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:59` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:60` |
| `path` | `z.string()` | — | `src/identity.ts:61` |
| `message` | `z.string()` | — | `src/identity.ts:62` |
| `existingId` | `z.string()` | — | `src/identity.ts:68` |

### `src/identity.AdoptIdentityResult` — zod-union — `src/identity.ts:178-189`

*aliases* `AdoptIdentityResult` `src/identity.ts:190`

| variant | shape | default | at |
|---|---|---|---|
| `object` | `z.object({ /** `created`: a new `fli.studio.json`. `updated`: the same `id`, other fields changed. `kept`: nothing to change. */ kind: z.en… → src/identity.ProjectIdentity` | — | `src/identity.ts:179` |
| `Refused('invalid-input')` | `Refused('invalid-input') → src/identity.Refused()` | — | `src/identity.ts:185` |
| `Refused('different-id').extend({ existingId: z.string() })` | `Refused('different-id').extend({ existingId: z.string() }) → src/identity.Refused()` | — | `src/identity.ts:186` |
| `Refused('existing-invalid')` | `Refused('existing-invalid') → src/identity.Refused()` | — | `src/identity.ts:187` |
| `Refused('io-error')` | `Refused('io-error') → src/identity.Refused()` | — | `src/identity.ts:188` |

### `src/identity.AdoptIdentityResult[0]` — zod-object — `src/identity.ts:179-184`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.enum(['created', 'updated', 'kept'])` | — | `src/identity.ts:181` | `created`: a new `fli.studio.json`. `updated`: the same `id`, other fields changed. `kept`: nothing to change. |
| `path` | `z.string()` | — | `src/identity.ts:182` |  |
| `identity` | `ProjectIdentity → src/identity.ProjectIdentity` | — | `src/identity.ts:183` |  |

### `src/identity.AdoptIdentityResult[2]` — zod-object — `src/identity.ts:186`

*extends* `Refused(...)`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:59` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:60` |
| `path` | `z.string()` | — | `src/identity.ts:61` |
| `message` | `z.string()` | — | `src/identity.ts:62` |
| `existingId` | `z.string()` | — | `src/identity.ts:186` |

### `src/identity.AdoptIdentityInput` — type — `src/identity.ts:193-204`

What `adoptIdentity` may be told; everything but `brand` (when no identity exists yet) can be left out.

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `?: string` | — | `src/identity.ts:195` | Keep this id: a re-run, or a project re-routed from another folder, must not mint a new uuid (plan §4C item 5). |
| `brand` | `?: string` | — | `src/identity.ts:196` |  |
| `code` | `?: string` | — | `src/identity.ts:198` | Default: the folder's `<code>-<name>`. |
| `name` | `?: string` | — | `src/identity.ts:199` |  |
| `aspect` | `?: ProjectAspect → src/identity.ProjectAspect` | — | `src/identity.ts:200` |  |
| `languages` | `?: string[]` | — | `src/identity.ts:201` |  |
| `shape` | `?: ProjectShape → src/identity.ProjectShape` | — | `src/identity.ts:202` |  |
| `createdAt` | `?: string` | — | `src/identity.ts:203` |  |

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

### `src/lab-path.ResolvedLabPath` — zod-object — `src/lab-path.ts:84-91`

Where a project's lab is after `resolveLabPath`: the path, and what (if anything) was moved into place.

*aliases* `ResolvedLabPath` `src/lab-path.ts:92`

| field | type | default | at | note |
|---|---|---|---|---|
| `path` | `z.string()` | — | `src/lab-path.ts:86` | Same as `labPath(input)`. |
| `migratedFrom` | `z.string().nullable()` | — | `src/lab-path.ts:88` | The old project lab folder (`<code>-<old name>`) renamed into place, or null. |
| `ambiguous` | `z.array(z.string())` | — | `src/lab-path.ts:90` | Two or more `<code>-*` labs and none under the current name: nothing was moved; they are listed. |

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

### `src/publish.Iso` — zod-scalar — `src/publish.ts:88`

`z.iso.datetime({ offset: true })`

### `src/publish.PublishExport` — zod-object — `src/publish.ts:91-108`

One file in `videos/<name>/` that a person could ship, with its caption file beside it (same stem) if any.

*aliases* `PublishExport` `src/publish.ts:109`

| field | type | default | at | note |
|---|---|---|---|---|
| `file` | `z.string().min(1)` | — | `src/publish.ts:93` | Project-relative, `/`-separated. |
| `kind` | `z.enum(['cut', 'audio', 'final', 'overlay', 'part']).nullable()` | — | `src/publish.ts:95` | `cut` · `audio` · `final` · `overlay` (D15) · `part`, or null for a file that does not parse. |
| `variant` | `z.string().nullable()` | — | `src/publish.ts:96` |  |
| `app` | `EditApp.nullable() → src/publish.EditApp` | — | `src/publish.ts:97` |  |
| `source` | `z.string().nullable().default(null)` | `null` | `src/publish.ts:102` | Where the file came from, in words, when the app knows better than the kind does ("FliCut export", "FliEdit |
| `modifiedAt` | `Iso → src/publish.Iso` | — | `src/publish.ts:103` |  |
| `durationSec` | `z.number().nullable()` | — | `src/publish.ts:104` |  |
| `srt` | `z.object({ file: z.string().min(1), modifiedAt: Iso, durationSec: z.number().nullable() }).nullable() → src/publish.Iso` | — | `src/publish.ts:105` |  |

### `src/publish.PublishExport.srt` — zod-object — `src/publish.ts:105`

| field | type | default | at |
|---|---|---|---|
| `file` | `z.string().min(1)` | — | `src/publish.ts:106` |
| `modifiedAt` | `Iso → src/publish.Iso` | — | `src/publish.ts:106` |
| `durationSec` | `z.number().nullable()` | — | `src/publish.ts:106` |

### `src/publish.PublishEdit` — zod-object — `src/publish.ts:112`

An edit document for the video: FliCut's `fli.cut.<name>.json` or FliEdit's `fli.edit.<name>.json`.

*aliases* `PublishEdit` `src/publish.ts:113`

| field | type | default | at |
|---|---|---|---|
| `file` | `z.string().min(1)` | — | `src/publish.ts:112` |
| `app` | `EditApp → src/publish.EditApp` | — | `src/publish.ts:112` |
| `modifiedAt` | `Iso → src/publish.Iso` | — | `src/publish.ts:112` |

### `src/publish.PublishLaunch` — zod-object — `src/publish.ts:116-125`

What YLO's `launch.json` (the workshop) offers, reduced to what the rules need.

*aliases* `PublishLaunch` `src/publish.ts:126`

| field | type | default | at | note |
|---|---|---|---|---|
| `file` | `z.string().min(1)` | — | `src/publish.ts:117` |  |
| `madeAt` | `Iso → src/publish.Iso` | — | `src/publish.ts:119` | When its texts were made (`updated_at`, else the file's time). |
| `titles` | `z.array(z.object({ id: z.string().nullable(), text: z.string() }))` | — | `src/publish.ts:121` | The titles bound to YLO's variant slots, slot 1 first. |
| `description` | `z.string().nullable()` | — | `src/publish.ts:122` |  |
| `chapters` | `z.array(z.record(z.string(), z.unknown()))` | — | `src/publish.ts:124` | YLO's `Chapter{n,title,timestamp}` list (empty when none). |

### `src/publish.PublishLaunch.titles[]` — zod-object — `src/publish.ts:121`

| field | type | default | at |
|---|---|---|---|
| `id` | `z.string().nullable()` | — | `src/publish.ts:121` |
| `text` | `z.string()` | — | `src/publish.ts:121` |

### `src/publish.PublishFacts` — zod-object — `src/publish.ts:128-136`

*aliases* `PublishFacts` `src/publish.ts:137`

| field | type | default | at | note |
|---|---|---|---|---|
| `video` | `z.string().nullable()` | — | `src/publish.ts:130` | The video folder name, or null for a project with no video yet. |
| `exports` | `z.array(PublishExport) → src/publish.PublishExport` | — | `src/publish.ts:131` |  |
| `edits` | `z.array(PublishEdit) → src/publish.PublishEdit` | — | `src/publish.ts:132` |  |
| `resources` | `z.array(Resource) → src/resources.Resource` | — | `src/publish.ts:134` | The project's resources for this video (and the project's own, `video: null`). |
| `launch` | `PublishLaunch.nullable() → src/publish.PublishLaunch` | — | `src/publish.ts:135` |  |

### `src/publish.PublishRow` — zod-object — `src/publish.ts:139-157`

*aliases* `PublishRow` `src/publish.ts:158`

| field | type | default | at | note |
|---|---|---|---|---|
| `piece` | `PublishPiece → src/publish.PublishPiece` | — | `src/publish.ts:140` |  |
| `label` | `z.string()` | — | `src/publish.ts:141` |  |
| `state` | `PublishState → src/publish.PublishState` | — | `src/publish.ts:142` |  |
| `value` | `z.string().nullable()` | — | `src/publish.ts:144` | What would ship, in a few words (a file name, a title, "Strong noise removal"). |
| `file` | `z.string().nullable()` | — | `src/publish.ts:146` | The project-relative file behind it, when there is one. |
| `source` | `z.enum(['choice', 'rule', 'brand', 'ylo', 'none'])` | — | `src/publish.ts:148` | Where the answer came from: `choice`, `rule`, `brand`, `ylo`, or `none`. |
| `why` | `z.string()` | — | `src/publish.ts:150` | One line: why this state. Kept for the audit trail. |
| `resourceId` | `z.string().nullable()` | — | `src/publish.ts:152` | The resource behind a choice, so a person or agent can change it. |
| `by` | `z.string().nullable()` | — | `src/publish.ts:154` | Who made it: a principal (`human:ui`, `agent:tuber`, `cli`) or `rule:<id>`; null when nothing is there. |
| `at` | `Iso.nullable() → src/publish.Iso` | — | `src/publish.ts:156` | When the thing behind it was made or chosen (for an ⓘ, never shown as a timestamp). |

### `src/publish.PublishReadiness` — zod-object — `src/publish.ts:160-173`

*aliases* `PublishReadiness` `src/publish.ts:174`

| field | type | default | at | note |
|---|---|---|---|---|
| `video` | `z.string().nullable()` | — | `src/publish.ts:161` |  |
| `rows` | `z.array(PublishRow) → src/publish.PublishRow` | — | `src/publish.ts:162` |  |
| `ready` | `z.number().int()` | — | `src/publish.ts:163` |  |
| `total` | `z.number().int()` | — | `src/publish.ts:164` |  |
| `suggestions` | `z.number().int()` | — | `src/publish.ts:166` | Ready rows a person has not decided (agent choices + rule guesses). |
| `counts` | `z.object({ set: z.number().int(), suggested: z.number().int(), inferred: z.number().int(), notReady: z.number().int() })` | — | `src/publish.ts:167` |  |

### `src/publish.PublishReadiness.counts` — zod-object — `src/publish.ts:167`

| field | type | default | at |
|---|---|---|---|
| `set` | `z.number().int()` | — | `src/publish.ts:168` |
| `suggested` | `z.number().int()` | — | `src/publish.ts:169` |
| `inferred` | `z.number().int()` | — | `src/publish.ts:170` |
| `notReady` | `z.number().int()` | — | `src/publish.ts:171` |

### `src/publish.PublishedVideo` — zod-object — `src/publish.ts:680-688`

The hook for whatever comes after publishing (post-publish posts, YLO's related-videos linking): every published

*aliases* `PublishedVideo` `src/publish.ts:689`

| field | type | default | at |
|---|---|---|---|
| `resourceId` | `z.string()` | — | `src/publish.ts:681` |
| `video` | `z.string().nullable()` | — | `src/publish.ts:682` |
| `path` | `z.string().nullable()` | — | `src/publish.ts:683` |
| `youtubeId` | `z.string()` | — | `src/publish.ts:684` |
| `url` | `z.string()` | — | `src/publish.ts:685` |
| `publishedAt` | `Iso → src/publish.Iso` | — | `src/publish.ts:686` |
| `by` | `z.string()` | — | `src/publish.ts:687` |

### `src/recipe-paths.RecipePathWarning` — zod-object — `src/recipe-paths.ts:18-27`

*aliases* `RecipePathWarning` `src/recipe-paths.ts:28`

| field | type | default | at | note |
|---|---|---|---|---|
| `file` | `z.string()` | — | `src/recipe-paths.ts:20` | Project-relative file, `/`-separated; empty for a bare value. |
| `pointer` | `z.string()` | — | `src/recipe-paths.ts:22` | RFC 6901 JSON pointer to the string (`/audio/arms/0/path`). |
| `value` | `z.string()` | — | `src/recipe-paths.ts:23` |  |
| `problem` | `RecipePathProblem → src/recipe-paths.RecipePathProblem` | — | `src/recipe-paths.ts:24` |  |
| `insideProject` | `z.boolean().nullable()` | — | `src/recipe-paths.ts:26` | An absolute path that is inside this project is still absolute (it breaks on another machine); null when unknown. |

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

### `src/renders.PathSegment` — zod-scalar — `src/renders.ts:15-21`

`<project>/-renders/<tool>/` (R2, David 2026-10-05: "they only need to live around long enough for the video to get

`z.string().min(1).refine((value) => !/[/\\]/.test(value) && value !== '.' && value !== '..', 'must be a single path segment')`

### `src/renders.RendersPathInput` — zod-object — `src/renders.ts:23-29`

*aliases* `RendersPathInput` `src/renders.ts:30`

| field | type | default | at | note |
|---|---|---|---|---|
| `projectDir` | `z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path') → path (node:path)` | — | `src/renders.ts:25` | The absolute project folder (`<brand root>/<code>-<name>`). |
| `tool` | `PathSegment → src/renders.PathSegment` | — | `src/renders.ts:27` | The tool that renders: `remotion`, `hyperframes`, `ffmpeg`, `flicut`… |
| `subject` | `PathSegment.optional() → src/renders.PathSegment` | — | `src/renders.ts:28` |  |

### `src/renders.RendersTool` — zod-object — `src/renders.ts:52-56`

*aliases* `RendersTool` `src/renders.ts:57`

| field | type | default | at |
|---|---|---|---|
| `tool` | `z.string()` | — | `src/renders.ts:53` |
| `files` | `z.number().int()` | — | `src/renders.ts:54` |
| `bytes` | `z.number().int()` | — | `src/renders.ts:55` |

### `src/renders.RendersTally` — zod-object — `src/renders.ts:59-68`

*aliases* `RendersTally` `src/renders.ts:69`

| field | type | default | at | note |
|---|---|---|---|---|
| `present` | `z.boolean()` | — | `src/renders.ts:61` | Is `-renders/` a real folder here (never a link elsewhere)? |
| `files` | `z.number().int()` | — | `src/renders.ts:62` |  |
| `bytes` | `z.number().int()` | — | `src/renders.ts:63` |  |
| `heavy` | `z.boolean()` | — | `src/renders.ts:65` | Over `FOLDER_HEAVY.heavyBytes`: amber. |
| `tools` | `z.array(RendersTool) → src/renders.RendersTool` | — | `src/renders.ts:67` | One row per tool folder, biggest first. Loose files directly in `-renders/` count under the tool `""`. |

### `src/renders.ClearRendersResult` — zod-union on `kind` — `src/renders.ts:121-134`

*aliases* `ClearRendersResult` `src/renders.ts:135`

| variant | shape | default | at |
|---|---|---|---|
| `cleared` | `z.object({ kind: z.literal('cleared'), /** Top-level entries of `-renders/` removed (a tool folder, or a loose file). */ removed: z.array(z…` | — | `src/renders.ts:123` |
| `refused` | `z.object({ kind: z.literal('refused'), reason: z.enum(['invalid-input', 'not-a-folder', 'io-error']), message: z.string() })` | — | `src/renders.ts:130` |

### `src/renders.ClearRendersResult[kind=cleared]` — zod-object — `src/renders.ts:122-128`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.literal('cleared')` | — | `src/renders.ts:123` |  |
| `removed` | `z.array(z.string())` | — | `src/renders.ts:125` | Top-level entries of `-renders/` removed (a tool folder, or a loose file). |
| `files` | `z.number().int()` | — | `src/renders.ts:126` |  |
| `bytes` | `z.number().int()` | — | `src/renders.ts:127` |  |

### `src/renders.ClearRendersResult[kind=refused]` — zod-object — `src/renders.ts:129-133`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/renders.ts:130` |
| `reason` | `z.enum(['invalid-input', 'not-a-folder', 'io-error'])` | — | `src/renders.ts:131` |
| `message` | `z.string()` | — | `src/renders.ts:132` |

### `src/resources.Text` — zod-scalar — `src/resources.ts:25`

`z.string().trim().min(1).max(200)`

### `src/resources.Key` — zod-scalar — `src/resources.ts:26-28`

`z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'a kind or group is kebab-case, e.g. shorts-hook')`

### `src/resources.ResourceGroup` — zod-object — `src/resources.ts:56-61`

*aliases* `ResourceGroup` `src/resources.ts:62`

| field | type | default | at |
|---|---|---|---|
| `group` | `Key → src/resources.Key` | — | `src/resources.ts:57` |
| `label` | `Text → src/resources.Text` | — | `src/resources.ts:58` |
| `order` | `z.number().int().default(50)` | `50` | `src/resources.ts:59` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/resources.ts:60` |

### `src/resources.ResourceKind` — zod-object — `src/resources.ts:64-75`

*aliases* `ResourceKind` `src/resources.ts:76`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `Key → src/resources.Key` | — | `src/resources.ts:65` |  |
| `group` | `Key → src/resources.Key` | — | `src/resources.ts:66` |  |
| `label` | `Text → src/resources.Text` | — | `src/resources.ts:67` |  |
| `value` | `ResourceValue → src/resources.ResourceValue` | — | `src/resources.ts:68` |  |
| `many` | `z.boolean().default(false)` | `false` | `src/resources.ts:69` |  |
| `choose` | `ResourceChoose.default('none') → src/resources.ResourceChoose` | `'none'` | `src/resources.ts:70` |  |
| `audience` | `z.array(ResourceAudience).optional() → src/resources.ResourceAudience` | — | `src/resources.ts:72` | Who sees it by default when a resource gives none. |
| `hint` | `z.string().max(300).optional()` | — | `src/resources.ts:73` |  |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/resources.ts:74` |  |

### `src/resources.ResourceOff` — zod-object — `src/resources.ts:79-81`

A lower level switching off an inherited kind or group.

*aliases* `ResourceOff` `src/resources.ts:82`

| field | type | default | at |
|---|---|---|---|
| `kind` | `Key.optional() → src/resources.Key` | — | `src/resources.ts:80` |
| `group` | `Key.optional() → src/resources.Key` | — | `src/resources.ts:80` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/resources.ts:80` |

### `src/resources.ResourceVideo` — zod-scalar — `src/resources.ts:85-88`

A video name in the `videos/` naming; the folder need not exist yet (ideas come first). `null` = the project's.

`z.string().regex(VIDEO_FOLDER_PATTERN, 'video must be a kebab-case video name').nullable()`

### `src/resources.ResourceRef` — zod-object — `src/resources.ts:90-94`

*aliases* `ResourceRef` `src/resources.ts:95`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.string().min(1).max(80)` | — | `src/resources.ts:91` |
| `id` | `z.string().max(200).optional()` | — | `src/resources.ts:92` |
| `file` | `z.string().max(1000).optional()` | — | `src/resources.ts:93` |

### `src/resources.Resource` — zod-object — `src/resources.ts:97-115`

*aliases* `Resource` `src/resources.ts:116`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.string().regex(/^r_[a-z0-9]{6 }$/)` | — | `src/resources.ts:98` |  |
| `kind` | `Key → src/resources.Key` | — | `src/resources.ts:99` |  |
| `video` | `ResourceVideo.default(null) → src/resources.ResourceVideo` | `null` | `src/resources.ts:100` |  |
| `title` | `z.string().max(300).optional()` | — | `src/resources.ts:101` |  |
| `text` | `z.string().max(20_000).optional()` | — | `src/resources.ts:102` |  |
| `url` | `z.string().max(2000).optional()` | — | `src/resources.ts:104` | Where it came from on the web. A file's own copy is `path`; the url is then only provenance. |
| `path` | `z.string().max(1000).optional()` | — | `src/resources.ts:106` | Project-relative (`resources/…`) when inside the project, else absolute. |
| `tags` | `z.array(z.string().trim().min(1).max(60)).default([])` | `[]` | `src/resources.ts:107` |  |
| `audience` | `z.array(ResourceAudience).default([]) → src/resources.ResourceAudience` | `[]` | `src/resources.ts:108` |  |
| `status` | `ResourceStatus.default('candidate') → src/resources.ResourceStatus` | `'candidate'` | `src/resources.ts:109` |  |
| `ref` | `ResourceRef.optional() → src/resources.ResourceRef` | — | `src/resources.ts:110` |  |
| `meta` | `z.record(z.string(), z.unknown()).optional()` | — | `src/resources.ts:112` | The producer's payload, stored as given (a thumbnail's generation_record, chapters, provenance fields…). |
| `added` | `Stamp → src/stamp.Stamp` | — | `src/resources.ts:113` |  |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/resources.ts:114` |  |

### `src/resources.ResourcesFile` — zod-object — `src/resources.ts:118-124`

*aliases* `ResourcesFile` `src/resources.ts:125`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/resources.ts:119` |
| `groups` | `z.array(ResourceGroup).default([]) → src/resources.ResourceGroup` | `[]` | `src/resources.ts:120` |
| `kinds` | `z.array(ResourceKind).default([]) → src/resources.ResourceKind` | `[]` | `src/resources.ts:121` |
| `off` | `z.array(ResourceOff).default([]) → src/resources.ResourceOff` | `[]` | `src/resources.ts:122` |
| `resources` | `z.array(Resource).default([]) → src/resources.Resource` | `[]` | `src/resources.ts:123` |

### `src/resources.ResourceRegistry` — zod-object — `src/resources.ts:147-150`

The merged registry: each row with the level it came from.

*aliases* `ResourceRegistry` `src/resources.ts:151`

| field | type | default | at |
|---|---|---|---|
| `groups` | `z.array(ResourceGroup.extend(From)) → src/resources.ResourceGroup, src/resources.From` | — | `src/resources.ts:148` |
| `kinds` | `z.array(ResourceKind.extend(From)) → src/resources.ResourceKind, src/resources.From` | — | `src/resources.ts:149` |

### `src/resources.ReadResourcesOptions` — interface — `src/resources.ts:156-160`

| field | type | default | at |
|---|---|---|---|
| `globalFile` | `?: string` | — | `src/resources.ts:157` |
| `brandRoot` | `?: string` | — | `src/resources.ts:158` |
| `projectDir` | `?: string` | — | `src/resources.ts:159` |

### `src/resources.ResourcesRead` — zod-object — `src/resources.ts:162-172`

*aliases* `ResourcesRead` `src/resources.ts:173`

| field | type | default | at | note |
|---|---|---|---|---|
| `registry` | `ResourceRegistry → src/resources.ResourceRegistry` | — | `src/resources.ts:163` |  |
| `resources` | `z.array(Resource) → src/resources.Resource` | — | `src/resources.ts:165` | The project's resources (empty without a project). |
| `levels` | `z.object({ global: ResourcesFile.nullable(), brand: ResourcesFile.nullable(), project: ResourcesFile.nullable() }) → src/resources.ResourcesFile` | — | `src/resources.ts:166` |  |
| `invalid` | `z.array(InvalidFile) → src/results.InvalidFile` | — | `src/resources.ts:171` |  |

### `src/resources.ResourcesRead.levels` — zod-object — `src/resources.ts:166`

| field | type | default | at |
|---|---|---|---|
| `global` | `ResourcesFile.nullable() → src/resources.ResourcesFile` | — | `src/resources.ts:167` |
| `brand` | `ResourcesFile.nullable() → src/resources.ResourcesFile` | — | `src/resources.ts:168` |
| `project` | `ResourcesFile.nullable() → src/resources.ResourcesFile` | — | `src/resources.ts:169` |

### `src/resources.ResourceInput` — zod-object — `src/resources.ts:285-298`

*aliases* `ResourceInput` `src/resources.ts:299`

| field | type | default | at |
|---|---|---|---|
| `video` | `ResourceVideo.optional() → src/resources.ResourceVideo` | — | `src/resources.ts:294` |
| `tags` | `z.array(z.string().trim().min(1).max(60)).optional()` | — | `src/resources.ts:295` |
| `audience` | `z.array(ResourceAudience).optional() → src/resources.ResourceAudience` | — | `src/resources.ts:296` |
| `status` | `ResourceStatus.optional() → src/resources.ResourceStatus` | — | `src/resources.ts:297` |

### `src/resources.ResourceChange` — type — `src/resources.ts:309`

| field | type | default | at |
|---|---|---|---|
| `file` | `ResourcesFile → src/resources.ResourcesFile` | — | `src/resources.ts:309` |
| `resource` | `Resource → src/resources.Resource` | — | `src/resources.ts:309` |
| `warnings` | `string[]` | — | `src/resources.ts:309` |

### `src/resources.ResourcePatch` — zod-object — `src/resources.ts:387-394`

*aliases* `ResourcePatch` `src/resources.ts:395`

| field | type | default | at |
|---|---|---|---|
| `video` | `ResourceVideo.optional() → src/resources.ResourceVideo` | — | `src/resources.ts:394` |
| `audience` | `z.array(ResourceAudience).optional() → src/resources.ResourceAudience` | — | `src/resources.ts:394` |

### `src/resources.WriteResourcesResult` — zod-discriminated-union on `kind` — `src/resources.ts:531-539`

*aliases* `WriteResourcesResult` `src/resources.ts:540`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string() })` | — | `src/resources.ts:532` |
| `refused` | `z.object({ kind: z.literal('refused'), reason: z.enum(['invalid-input', 'io-error']), path: z.string(), message: z.string() })` | — | `src/resources.ts:534` |

### `src/resources.WriteResourcesResult[kind=written]` — zod-object — `src/resources.ts:532`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/resources.ts:532` |
| `path` | `z.string()` | — | `src/resources.ts:532` |

### `src/resources.WriteResourcesResult[kind=refused]` — zod-object — `src/resources.ts:533-538`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/resources.ts:534` |
| `reason` | `z.enum(['invalid-input', 'io-error'])` | — | `src/resources.ts:535` |
| `path` | `z.string()` | — | `src/resources.ts:536` |
| `message` | `z.string()` | — | `src/resources.ts:537` |

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

### `src/series.SeriesMember` — zod-object — `src/series.ts:22-29`

*aliases* `SeriesMember` `src/series.ts:30`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.uuid()` | — | `src/series.ts:24` | The project's identity `id`. |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/series.ts:26` | The project's code when it was added; display only. |
| `label` | `z.string().min(1).optional()` | — | `src/series.ts:28` | A label for the member in this series ("Day 5"); absent → the project's name. |

### `src/series.SeriesFile` — zod-object — `src/series.ts:32-40`

*aliases* `SeriesFile` `src/series.ts:41`

| field | type | default | at | note |
|---|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/series.ts:33` |  |
| `id` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/series.ts:35` | The folder name under `series/`. |
| `brand` | `z.string().min(1)` | — | `src/series.ts:36` |  |
| `title` | `z.string().min(1)` | — | `src/series.ts:37` |  |
| `createdAt` | `z.iso.datetime({ offset: true })` | — | `src/series.ts:38` |  |
| `members` | `z.array(SeriesMember) → src/series.SeriesMember` | — | `src/series.ts:39` |  |

### `src/series.SeriesListing` — zod-object — `src/series.ts:74-78`

*aliases* `SeriesListing` `src/series.ts:79`

| field | type | default | at | note |
|---|---|---|---|---|
| `series` | `z.array(SeriesFile) → src/series.SeriesFile` | — | `src/series.ts:75` |  |
| `invalid` | `z.array(z.object({ folder: z.string(), message: z.string() }))` | — | `src/series.ts:77` | Folders under `series/` whose file is missing or unusable: listed, never hidden. |

### `src/series.SeriesListing.invalid[]` — zod-object — `src/series.ts:77`

| field | type | default | at |
|---|---|---|---|
| `folder` | `z.string()` | — | `src/series.ts:77` |
| `message` | `z.string()` | — | `src/series.ts:77` |

### `src/series.Refusal` — zod-object — `src/series.ts:102-115`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/series.ts:103` |
| `reason` | `z.enum(['invalid-input', 'series-exists', 'series-not-found', 'member-not-found', 'unusable-file', 'busy', 'io-error'])` | — | `src/series.ts:104` |
| `path` | `z.string()` | — | `src/series.ts:113` |
| `message` | `z.string()` | — | `src/series.ts:114` |

### `src/series.ChangeSeriesResult` — zod-union on `kind` — `src/series.ts:117-120`

*aliases* `ChangeSeriesResult` `src/series.ts:121`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string(), series: SeriesFile }) → src/series.SeriesFile` | — | `src/series.ts:118` |
| `Refusal` | `Refusal → src/series.Refusal` | — | `src/series.ts:119` |

### `src/series.ChangeSeriesResult[kind=written]` — zod-object — `src/series.ts:118`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/series.ts:118` |
| `path` | `z.string()` | — | `src/series.ts:118` |
| `series` | `SeriesFile → src/series.SeriesFile` | — | `src/series.ts:118` |

### `src/series.ChangeSeriesOptions` — interface — `src/series.ts:123-128`

| field | type | default | at | note |
|---|---|---|---|---|
| `waitMs` | `?: number` | — | `src/series.ts:125` | How long to wait for another writer's lock (default 3 s). |
| `staleMs` | `?: number` | — | `src/series.ts:127` | A lock older than this is a crashed writer's and is broken (default 10 s). |

### `src/series.SeriesRef` — zod-object — `src/series.ts:271`

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/series.ts:271` |
| `series` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/series.ts:271` |

### `src/series.Changed` — zod-object — `src/series.ts:272`

| field | type | default | at |
|---|---|---|---|
| `path` | `z.string()` | — | `src/series.ts:272` |
| `series` | `SeriesFile → src/series.SeriesFile` | — | `src/series.ts:272` |

### `src/stamp.Stamp` — zod-object — `src/stamp.ts:9-12`

Who changed a record, and when (David 2026-09-24: "keep a time updated and a who agent versus human"). `by` is the

*aliases* `Stamp` `src/stamp.ts:13`

| field | type | default | at |
|---|---|---|---|
| `at` | `z.iso.datetime({ offset: true })` | — | `src/stamp.ts:10` |
| `by` | `PrincipalName → src/capability.PrincipalName` | — | `src/stamp.ts:11` |

### `src/transport.ShuttleState` — zod-object — `src/transport.ts:15-18`

Playing or not, and the signed rate: +1 forward at 1×, −2 backward at 2×.

*aliases* `ShuttleState` `src/transport.ts:19`

| field | type | default | at |
|---|---|---|---|
| `playing` | `z.boolean()` | — | `src/transport.ts:16` |
| `rate` | `z.number()` | — | `src/transport.ts:17` |

### `src/video-file.Ext` — zod-scalar — `src/video-file.ts:15`

Video files and folders (ruling "B only", 👤 David 2026-09-22 — supersedes the 09-09 numbered shape):

`z.string().regex(/^[A-Za-z0-9]+$/, 'ext must be letters/digits, without the dot')`

### `src/video-file.VideoFile` — zod-discriminated-union on `kind` — `src/video-file.ts:24-35`

*aliases* `VideoFile` `src/video-file.ts:36`

| variant | shape | default | at |
|---|---|---|---|
| `cut` | `z.object({ name: KebabSlug, kind: z.literal('cut'), variant: z.null().default(null), ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:25` |
| `final` | `z.object({ name: KebabSlug, kind: z.literal('final'), variant: z.null().default(null), ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:28` |
| `audio` | `z.object({ name: KebabSlug, kind: z.literal('audio'), variant: KebabSlug, ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:32` |
| `overlay` | `z.object({ name: KebabSlug, kind: z.literal('overlay'), variant: KebabSlug, ext: Ext }) → src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:33` |
| `part` | `z.object({ name: KebabSlug, kind: z.literal('part'), variant: VideoPart, ext: Ext }) → src/project-folder.KebabSlug, src/video-file.VideoPart, src/video-file.Ext` | — | `src/video-file.ts:34` |

### `src/video-file.VideoFile[kind=cut]` — zod-object — `src/video-file.ts:25`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:25` |
| `kind` | `z.literal('cut')` | — | `src/video-file.ts:25` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:25` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:25` |

### `src/video-file.VideoFile[kind=final]` — zod-object — `src/video-file.ts:26-31`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:27` |
| `kind` | `z.literal('final')` | — | `src/video-file.ts:28` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:29` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:30` |

### `src/video-file.VideoFile[kind=audio]` — zod-object — `src/video-file.ts:32`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:32` |
| `kind` | `z.literal('audio')` | — | `src/video-file.ts:32` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:32` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:32` |

### `src/video-file.VideoFile[kind=overlay]` — zod-object — `src/video-file.ts:33`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:33` |
| `kind` | `z.literal('overlay')` | — | `src/video-file.ts:33` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:33` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:33` |

### `src/video-file.VideoFile[kind=part]` — zod-object — `src/video-file.ts:34`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:34` |
| `kind` | `z.literal('part')` | — | `src/video-file.ts:34` |
| `variant` | `VideoPart → src/video-file.VideoPart` | — | `src/video-file.ts:34` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:34` |

### `src/video-file.UnknownVideoFile` — zod-object — `src/video-file.ts:38-42`

*aliases* `UnknownVideoFile` `src/video-file.ts:43`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('unknown-kind')` | — | `src/video-file.ts:39` |
| `name` | `z.string()` | — | `src/video-file.ts:40` |
| `ext` | `z.string().nullable()` | — | `src/video-file.ts:41` |

### `src/video-file.ParsedVideoFile` — zod-union on `kind` — `src/video-file.ts:45`

*aliases* `ParsedVideoFile` `src/video-file.ts:46`

| variant | shape | default | at |
|---|---|---|---|
| `VideoFile` | `VideoFile → src/video-file.VideoFile` | — | `src/video-file.ts:45` |
| `UnknownVideoFile` | `UnknownVideoFile → src/video-file.UnknownVideoFile` | — | `src/video-file.ts:45` |

### `src/video-file.VideoFolder` — zod-object — `src/video-file.ts:80-85`

*aliases* `VideoFolder` `src/video-file.ts:86`

| field | type | default | at |
|---|---|---|---|
| `name` | `KebabSlug.refine((name) => !LEGACY_FOLDERS.includes(name), 'a legacy layout name (first-edit, edits, …) is never a video') → src/project-folder.KebabSlug, src/classify.LEGACY_FOLDERS` | — | `src/video-file.ts:81` |

### `src/video-file.VideoFolderName` — zod-scalar — `src/video-file.ts:92-97`

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

### `src/words.Text` — zod-scalar — `src/words.ts:29`

`z.string().trim().min(1).max(200)`

### `src/words.WordName` — zod-object — `src/words.ts:32-36`

A name spelled exactly like this. `heardAs` are the ways the transcriber gets it wrong (proposed fixes).

*aliases* `WordName` `src/words.ts:37`

| field | type | default | at |
|---|---|---|---|
| `term` | `Text → src/words.Text` | — | `src/words.ts:33` |
| `heardAs` | `z.array(Text).optional() → src/words.Text` | — | `src/words.ts:34` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/words.ts:35` |

### `src/words.WordRule` — zod-object — `src/words.ts:40`

A literal, whole-word, case-insensitive spelling rule: `find` in a transcript is proposed as `write`.

*aliases* `WordRule` `src/words.ts:41`

| field | type | default | at |
|---|---|---|---|
| `find` | `Text → src/words.Text` | — | `src/words.ts:40` |
| `write` | `Text → src/words.Text` | — | `src/words.ts:40` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/words.ts:40` |

### `src/words.WordFiller` — zod-object — `src/words.ts:44-49`

A filler word for a language, or with `never: true` a word that is never proposed as a filler.

*aliases* `WordFiller` `src/words.ts:50`

| field | type | default | at |
|---|---|---|---|
| `word` | `Text → src/words.Text` | — | `src/words.ts:45` |
| `lang` | `z.string().min(2).max(10).default('en')` | `'en'` | `src/words.ts:46` |
| `never` | `z.boolean().optional()` | — | `src/words.ts:47` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/words.ts:48` |

### `src/words.WordOff` — zod-object — `src/words.ts:56`

Turns off an entry inherited from a higher level (`text` is its term, `find`, or `lang:word`).

*aliases* `WordOff` `src/words.ts:57`

| field | type | default | at |
|---|---|---|---|
| `kind` | `WordKind → src/words.WordKind` | — | `src/words.ts:56` |
| `text` | `Text → src/words.Text` | — | `src/words.ts:56` |
| `changed` | `Stamp → src/stamp.Stamp` | — | `src/words.ts:56` |

### `src/words.WordsFile` — zod-object — `src/words.ts:59-65`

*aliases* `WordsFile` `src/words.ts:66`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/words.ts:60` |
| `names` | `z.array(WordName).default([]) → src/words.WordName` | `[]` | `src/words.ts:61` |
| `rules` | `z.array(WordRule).default([]) → src/words.WordRule` | `[]` | `src/words.ts:62` |
| `fillers` | `z.array(WordFiller).default([]) → src/words.WordFiller` | `[]` | `src/words.ts:63` |
| `off` | `z.array(WordOff).default([]) → src/words.WordOff` | `[]` | `src/words.ts:64` |

### `src/words.WordInput` — zod-discriminated-union on `kind` — `src/words.ts:72-91`

What a caller asks to add. The stamp is added by `addWord`.

*aliases* `WordInput` `src/words.ts:92`

| variant | shape | default | at |
|---|---|---|---|
| `name` | `z.object({ kind: z.literal('name'), term: Text, heardAs: z.array(Text).optional(), /** * "Remember" rather than "set": keep this level's ex… → src/words.Text` | — | `src/words.ts:74` |
| `rule` | `z.object({ kind: z.literal('rule'), find: Text, write: Text }) → src/words.Text` | — | `src/words.ts:83` |
| `filler` | `z.object({ kind: z.literal('filler'), word: Text, lang: z.string().min(2).max(10).optional(), never: z.boolean().optional() }) → src/words.Text` | — | `src/words.ts:85` |
| `off` | `z.object({ kind: z.literal('off'), of: WordKind, text: Text }) → src/words.WordKind, src/words.Text` | — | `src/words.ts:90` |

### `src/words.WordInput[kind=name]` — zod-object — `src/words.ts:73-82`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.literal('name')` | — | `src/words.ts:74` |  |
| `term` | `Text → src/words.Text` | — | `src/words.ts:75` |  |
| `heardAs` | `z.array(Text).optional() → src/words.Text` | — | `src/words.ts:76` |  |
| `merge` | `z.boolean().optional()` | — | `src/words.ts:81` | "Remember" rather than "set": keep this level's existing mishearings for the term (and its spelling), adding |

### `src/words.WordInput[kind=rule]` — zod-object — `src/words.ts:83`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('rule')` | — | `src/words.ts:83` |
| `find` | `Text → src/words.Text` | — | `src/words.ts:83` |
| `write` | `Text → src/words.Text` | — | `src/words.ts:83` |

### `src/words.WordInput[kind=filler]` — zod-object — `src/words.ts:84-89`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('filler')` | — | `src/words.ts:85` |
| `word` | `Text → src/words.Text` | — | `src/words.ts:86` |
| `lang` | `z.string().min(2).max(10).optional()` | — | `src/words.ts:87` |
| `never` | `z.boolean().optional()` | — | `src/words.ts:88` |

### `src/words.WordInput[kind=off]` — zod-object — `src/words.ts:90`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('off')` | — | `src/words.ts:90` |
| `of` | `WordKind → src/words.WordKind` | — | `src/words.ts:90` |
| `text` | `Text → src/words.Text` | — | `src/words.ts:90` |

### `src/words.WordRef` — zod-object — `src/words.ts:95`

Which entry to remove: its kind (or `off`) and its text, as `wordKey` reads it.

*aliases* `WordRef` `src/words.ts:96`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.enum(['name', 'rule', 'filler', 'off'])` | — | `src/words.ts:95` |
| `text` | `Text → src/words.Text` | — | `src/words.ts:95` |

### `src/words.MergedWords` — zod-object — `src/words.ts:99-105`

*aliases* `MergedWords` `src/words.ts:106`

| field | type | default | at | note |
|---|---|---|---|---|
| `names` | `z.array(WordName.extend(From)) → src/words.WordName, src/words.From` | — | `src/words.ts:100` |  |
| `rules` | `z.array(WordRule.extend(From)) → src/words.WordRule, src/words.From` | — | `src/words.ts:101` |  |
| `fillers` | `z.array(WordFiller.extend(From)) → src/words.WordFiller, src/words.From` | — | `src/words.ts:102` |  |
| `off` | `z.array(WordOff.extend(From)) → src/words.WordOff, src/words.From` | — | `src/words.ts:104` | The entries a level turned off, and which level did it. |

### `src/words.WordsRead` — zod-object — `src/words.ts:108-118`

*aliases* `WordsRead` `src/words.ts:119`

| field | type | default | at | note |
|---|---|---|---|---|
| `words` | `MergedWords → src/words.MergedWords` | — | `src/words.ts:109` |  |
| `levels` | `z.object({ global: WordsFile.nullable(), brand: WordsFile.nullable(), project: WordsFile.nullable() }) → src/words.WordsFile` | — | `src/words.ts:111` | Each level as found: its file, and `null` when that level has no file (or was not asked for). |
| `invalid` | `z.array(InvalidFile) → src/results.InvalidFile` | — | `src/words.ts:117` | Files that exist but could not be used. Their level counts as empty; never an error. |

### `src/words.WordsRead.levels` — zod-object — `src/words.ts:111`

| field | type | default | at |
|---|---|---|---|
| `global` | `WordsFile.nullable() → src/words.WordsFile` | — | `src/words.ts:112` |
| `brand` | `WordsFile.nullable() → src/words.WordsFile` | — | `src/words.ts:113` |
| `project` | `WordsFile.nullable() → src/words.WordsFile` | — | `src/words.ts:114` |

### `src/words.ReadWordsOptions` — interface — `src/words.ts:121-128`

| field | type | default | at | note |
|---|---|---|---|---|
| `globalFile` | `?: string` | — | `src/words.ts:123` | The global file (FliStudio: `~/.config/appydave/fli.words.json`). |
| `brandRoot` | `?: string` | — | `src/words.ts:125` | The brand folder, `v-<brand>/`. |
| `projectDir` | `?: string` | — | `src/words.ts:127` | The project folder. |

### `src/words.WriteWordsResult` — zod-discriminated-union on `kind` — `src/words.ts:287-295`

*aliases* `WriteWordsResult` `src/words.ts:296`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string() })` | — | `src/words.ts:288` |
| `refused` | `z.object({ kind: z.literal('refused'), reason: z.enum(['invalid-input', 'io-error']), path: z.string(), message: z.string() })` | — | `src/words.ts:290` |

### `src/words.WriteWordsResult[kind=written]` — zod-object — `src/words.ts:288`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/words.ts:288` |
| `path` | `z.string()` | — | `src/words.ts:288` |

### `src/words.WriteWordsResult[kind=refused]` — zod-object — `src/words.ts:289-294`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/words.ts:290` |
| `reason` | `z.enum(['invalid-input', 'io-error'])` | — | `src/words.ts:291` |
| `path` | `z.string()` | — | `src/words.ts:292` |
| `message` | `z.string()` | — | `src/words.ts:293` |

### `src/words.ChangeWordsResult` — zod-discriminated-union on `kind` — `src/words.ts:320-332`

*aliases* `ChangeWordsResult` `src/words.ts:333`

| variant | shape | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string(), words: WordsFile }) → src/words.WordsFile` | — | `src/words.ts:321` |
| `refused` | `z.object({ kind: z.literal('refused'), /** * `unusable-file`: the file exists but is not a usable word list — never overwritten, fix it by …` | — | `src/words.ts:323` |

### `src/words.ChangeWordsResult[kind=written]` — zod-object — `src/words.ts:321`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/words.ts:321` |
| `path` | `z.string()` | — | `src/words.ts:321` |
| `words` | `WordsFile → src/words.WordsFile` | — | `src/words.ts:321` |

### `src/words.ChangeWordsResult[kind=refused]` — zod-object — `src/words.ts:322-331`

| field | type | default | at | note |
|---|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/words.ts:323` |  |
| `reason` | `z.enum(['invalid-input', 'io-error', 'unusable-file', 'not-found', 'busy'])` | — | `src/words.ts:328` | `unusable-file`: the file exists but is not a usable word list — never overwritten, fix it by hand. |
| `path` | `z.string()` | — | `src/words.ts:329` |  |
| `message` | `z.string()` | — | `src/words.ts:330` |  |

### `src/words.ChangeWordsOptions` — interface — `src/words.ts:335-342`

| field | type | default | at | note |
|---|---|---|---|---|
| `createDir` | `?: boolean` | — | `src/words.ts:337` | Create the file's folder first (the global level only; a brand or project folder is never created). |
| `waitMs` | `?: number` | — | `src/words.ts:339` | How long to wait for another writer's lock (default 3 s). |
| `staleMs` | `?: number` | — | `src/words.ts:341` | A lock older than this is a crashed writer's and is broken (default 10 s). |

### `src/youtube.YouTubeChannel` — zod-object — `src/youtube.ts:34-45`

*aliases* `YouTubeChannel` `src/youtube.ts:46`

| field | type | default | at |
|---|---|---|---|
| `id` | `z.string().min(1)` | — | `src/youtube.ts:35` |
| `handle` | `z.string()` | — | `src/youtube.ts:36` |
| `title` | `z.string()` | — | `src/youtube.ts:37` |
| `description` | `z.string()` | — | `src/youtube.ts:38` |
| `publishedAt` | `z.string()` | — | `src/youtube.ts:39` |
| `uploadsPlaylistId` | `z.string().min(1)` | — | `src/youtube.ts:40` |
| `subscriberCount` | `z.number()` | — | `src/youtube.ts:41` |
| `viewCount` | `z.number()` | — | `src/youtube.ts:42` |
| `videoCount` | `z.number()` | — | `src/youtube.ts:43` |
| `fetchedAt` | `z.string()` | — | `src/youtube.ts:44` |

### `src/youtube.YouTubePlaylistItem` — zod-object — `src/youtube.ts:48-54`

*aliases* `YouTubePlaylistItem` `src/youtube.ts:55`

| field | type | default | at | note |
|---|---|---|---|---|
| `videoId` | `z.string().min(1)` | — | `src/youtube.ts:49` |  |
| `position` | `z.number().int()` | — | `src/youtube.ts:50` |  |
| `addedAt` | `z.string().optional()` | — | `src/youtube.ts:52` | When the video was added to the playlist (`snippet.publishedAt` of the playlist item). |
| `videoPublishedAt` | `z.string().optional()` | — | `src/youtube.ts:53` |  |

### `src/youtube.YouTubePlaylist` — zod-object — `src/youtube.ts:57-69`

*aliases* `YouTubePlaylist` `src/youtube.ts:70`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.string().min(1)` | — | `src/youtube.ts:58` |  |
| `title` | `z.string()` | — | `src/youtube.ts:59` |  |
| `description` | `z.string()` | — | `src/youtube.ts:60` |  |
| `itemCount` | `z.number().int()` | — | `src/youtube.ts:61` |  |
| `privacy` | `z.string()` | — | `src/youtube.ts:63` | `public` \| `unlisted` \| `private`, as YouTube reports it. |
| `publishedAt` | `z.string()` | — | `src/youtube.ts:64` |  |
| `thumbnailUrl` | `z.string()` | — | `src/youtube.ts:65` |  |
| `itemsEtag` | `z.string().optional()` | — | `src/youtube.ts:67` | The playlistItems listing's HTTP ETag, sent back as If-None-Match on the next sync. |
| `items` | `z.array(YouTubePlaylistItem) → src/youtube.YouTubePlaylistItem` | — | `src/youtube.ts:68` |  |

### `src/youtube.YouTubePlaylistsFile` — zod-object — `src/youtube.ts:72-75`

*aliases* `YouTubePlaylistsFile` `src/youtube.ts:76`

| field | type | default | at |
|---|---|---|---|
| `fetchedAt` | `z.string()` | — | `src/youtube.ts:73` |
| `playlists` | `z.array(YouTubePlaylist) → src/youtube.YouTubePlaylist` | — | `src/youtube.ts:74` |

### `src/youtube.YouTubeVideo` — zod-object — `src/youtube.ts:79-96`

A mirrored video. The fields before `privacy` are the retired yt-mirror's shape, so its files still read.

*aliases* `YouTubeVideo` `src/youtube.ts:97`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.string().min(1)` | — | `src/youtube.ts:80` |  |
| `title` | `z.string()` | — | `src/youtube.ts:81` |  |
| `description` | `z.string()` | — | `src/youtube.ts:82` |  |
| `publishedAt` | `z.string()` | — | `src/youtube.ts:83` |  |
| `channelId` | `z.string()` | — | `src/youtube.ts:84` |  |
| `tags` | `z.array(z.string()).default([])` | `[]` | `src/youtube.ts:85` |  |
| `categoryId` | `z.string().optional()` | — | `src/youtube.ts:86` |  |
| `duration` | `z.string()` | — | `src/youtube.ts:88` | ISO 8601 duration (`PT12M3S`). |
| `viewCount` | `z.number()` | — | `src/youtube.ts:89` |  |
| `likeCount` | `z.number()` | — | `src/youtube.ts:90` |  |
| `commentCount` | `z.number()` | — | `src/youtube.ts:91` |  |
| `thumbnailUrl` | `z.string()` | — | `src/youtube.ts:92` |  |
| `fetchedAt` | `z.string()` | — | `src/youtube.ts:93` |  |
| `privacy` | `z.string().optional()` | — | `src/youtube.ts:95` | `public` \| `unlisted` \| `private`; absent in files written before playlists were mirrored. |

### `src/youtube.YouTubeSyncCounts` — zod-object — `src/youtube.ts:99-104`

*aliases* `YouTubeSyncCounts` `src/youtube.ts:105`

| field | type | default | at |
|---|---|---|---|
| `videos` | `z.number().int()` | — | `src/youtube.ts:100` |
| `playlists` | `z.number().int()` | — | `src/youtube.ts:101` |
| `memberships` | `z.number().int()` | — | `src/youtube.ts:102` |
| `thumbnailsDownloaded` | `z.number().int()` | — | `src/youtube.ts:103` |

### `src/youtube.YouTubeSyncRecord` — zod-object — `src/youtube.ts:107-119`

*aliases* `YouTubeSyncRecord` `src/youtube.ts:120`

| field | type | default | at | note |
|---|---|---|---|---|
| `lastSyncAt` | `z.string()` | — | `src/youtube.ts:108` |  |
| `ok` | `z.boolean()` | — | `src/youtube.ts:109` |  |
| `durationMs` | `z.number().int()` | — | `src/youtube.ts:110` |  |
| `quotaUnits` | `z.number().int()` | — | `src/youtube.ts:112` | API calls made, each 1 unit. |
| `channelId` | `z.string().optional()` | — | `src/youtube.ts:113` |  |
| `counts` | `YouTubeSyncCounts → src/youtube.YouTubeSyncCounts` | — | `src/youtube.ts:114` |  |
| `warnings` | `z.array(z.string())` | — | `src/youtube.ts:115` |  |
| `error` | `z.string().optional()` | — | `src/youtube.ts:117` | Why the sync stopped, when `ok` is false. The mirror keeps what the last good sync wrote. |
| `by` | `Stamp.optional() → src/stamp.Stamp` | — | `src/youtube.ts:118` |  |

### `src/youtube.YouTubeVideoListing` — zod-object — `src/youtube.ts:156-166`

*aliases* `YouTubeVideoListing` `src/youtube.ts:167`

| field | type | default | at | note |
|---|---|---|---|---|
| `videos` | `z.array(YouTubeVideo.extend({ /** Absolute path of the thumbnail when one is mirrored. */ thumbnailPath: z.string().nullable(), hasTranscri… → src/youtube.YouTubeVideo` | — | `src/youtube.ts:157` |  |
| `issues` | `z.array(z.string())` | — | `src/youtube.ts:165` | Video folders whose metadata.json is missing or malformed, as `<id>: <message>`. |

### `src/youtube.YouTubeVideoListing.videos[]` — zod-object — `src/youtube.ts:157`

*extends* `YouTubeVideo`

| field | type | default | at | note |
|---|---|---|---|---|
| `id` | `z.string().min(1)` | — | `src/youtube.ts:80` |  |
| `title` | `z.string()` | — | `src/youtube.ts:81` |  |
| `description` | `z.string()` | — | `src/youtube.ts:82` |  |
| `publishedAt` | `z.string()` | — | `src/youtube.ts:83` |  |
| `channelId` | `z.string()` | — | `src/youtube.ts:84` |  |
| `tags` | `z.array(z.string()).default([])` | `[]` | `src/youtube.ts:85` |  |
| `categoryId` | `z.string().optional()` | — | `src/youtube.ts:86` |  |
| `duration` | `z.string()` | — | `src/youtube.ts:88` | ISO 8601 duration (`PT12M3S`). |
| `viewCount` | `z.number()` | — | `src/youtube.ts:89` |  |
| `likeCount` | `z.number()` | — | `src/youtube.ts:90` |  |
| `commentCount` | `z.number()` | — | `src/youtube.ts:91` |  |
| `thumbnailUrl` | `z.string()` | — | `src/youtube.ts:92` |  |
| `fetchedAt` | `z.string()` | — | `src/youtube.ts:93` |  |
| `privacy` | `z.string().optional()` | — | `src/youtube.ts:95` | `public` \| `unlisted` \| `private`; absent in files written before playlists were mirrored. |
| `thumbnailPath` | `z.string().nullable()` | — | `src/youtube.ts:160` | Absolute path of the thumbnail when one is mirrored. |
| `hasTranscript` | `z.boolean()` | — | `src/youtube.ts:161` |  |

### `src/youtube.SyncYouTubeOptions` — interface — `src/youtube.ts:432-443`

| field | type | default | at | note |
|---|---|---|---|---|
| `mirrorRoot` | `string` | — | `src/youtube.ts:433` |  |
| `brandKey` | `string` | — | `src/youtube.ts:434` |  |
| `channel` | `{ id: string } \| { handle: string }` | — | `src/youtube.ts:436` | The channel's id from the brand registry (preferred), or its handle. |
| `apiKey` | `string` | — | `src/youtube.ts:437` |  |
| `fetch` | `?: YouTubeFetch → src/youtube.YouTubeFetch` | — | `src/youtube.ts:438` |  |
| `download` | `?: (url: string) => Promise<Response> → Response (@types/node)` | — | `src/youtube.ts:440` | Downloads thumbnails; defaults to `fetch`. |
| `now` | `?: () => Date` | — | `src/youtube.ts:441` |  |
| `by` | `?: Stamp → src/stamp.Stamp` | — | `src/youtube.ts:442` |  |

### `src/youtube.SyncYouTubeResult` — zod-union on `kind` — `src/youtube.ts:445-449`

*aliases* `SyncYouTubeResult` `src/youtube.ts:450`

| variant | shape | default | at |
|---|---|---|---|
| `synced` | `z.object({ kind: z.literal('synced'), record: YouTubeSyncRecord }) → src/youtube.YouTubeSyncRecord` | — | `src/youtube.ts:446` |
| `failed` | `z.object({ kind: z.literal('failed'), record: YouTubeSyncRecord }) → src/youtube.YouTubeSyncRecord` | — | `src/youtube.ts:447` |
| `busy` | `z.object({ kind: z.literal('busy'), message: z.string() })` | — | `src/youtube.ts:448` |

### `src/youtube.SyncYouTubeResult[kind=synced]` — zod-object — `src/youtube.ts:446`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('synced')` | — | `src/youtube.ts:446` |
| `record` | `YouTubeSyncRecord → src/youtube.YouTubeSyncRecord` | — | `src/youtube.ts:446` |

### `src/youtube.SyncYouTubeResult[kind=failed]` — zod-object — `src/youtube.ts:447`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('failed')` | — | `src/youtube.ts:447` |
| `record` | `YouTubeSyncRecord → src/youtube.YouTubeSyncRecord` | — | `src/youtube.ts:447` |

### `src/youtube.SyncYouTubeResult[kind=busy]` — zod-object — `src/youtube.ts:448`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('busy')` | — | `src/youtube.ts:448` |
| `message` | `z.string()` | — | `src/youtube.ts:448` |

## Cannot be mirrored

These were looked at and could not be resolved to an authority. **Nothing is guessed for them.** Each is a real gap in this page.

| subject | why | looked at |
|---|---|---|
| schemas built by `OneLine(...)` (1 use) | built by calling `OneLine(...)`, which does not return a single zod expression this reader can follow | `OneLine('a note').optional() (src/gitignore-rules.ts:41)` |
| schemas built by `Refused(...)` (6 uses) | built by calling the schema factory `Refused(...)`; the factory's own shape is mirrored as `src/identity.Refused()`, but each parameterised result is not expanded here | `Refused('invalid-input') (src/identity.ts:67)`<br>`Refused('existing-invalid') (src/identity.ts:69)`<br>`Refused('io-error') (src/identity.ts:70)`<br>`Refused('invalid-input') (src/identity.ts:185)`<br>`Refused('existing-invalid') (src/identity.ts:187)`<br>`Refused('io-error') (src/identity.ts:188)` |
| schemas built by `promisify(...)` (1 use) | built by calling `promisify(...)` imported from `node:util`; package helpers are not expanded - see that package's own mirror | `promisify(execFile) (src/gitignore.ts:17)` |
| schemas built by `readFileResult(...)` (8 uses) | built by calling the schema factory `readFileResult(...)`; the factory's own shape is mirrored as `src/results.readFileResult()`, but each parameterised result is not expanded here | `readFileResult(BrandSettings) (src/brand-settings.ts:83)`<br>`readFileResult(ProjectIdentity) (src/identity.ts:49)`<br>`readFileResult(ResourcesFile) (src/resources.ts:135)`<br>`readFileResult(SeriesFile) (src/series.ts:43)`<br>`readFileResult(WordsFile) (src/words.ts:68)`<br>`readFileResult(YouTubeChannel) (src/youtube.ts:122)`<br>`readFileResult(YouTubePlaylistsFile) (src/youtube.ts:124)`<br>`readFileResult(YouTubeSyncRecord) (src/youtube.ts:126)` |
| schemas built by `scanned(...)` (3 uses) | built by calling the schema factory `scanned(...)`; the factory's own shape is mirrored as `src/estate.scanned()`, but each parameterised result is not expanded here | `scanned(MemberProject) (src/estate.ts:69)`<br>`scanned(OtherFolder) (src/estate.ts:70)`<br>`scanned(ArchivedEntry) (src/estate.ts:71)` |
| schemas built by `validFile(...)` (1 use) | built by calling the schema factory `validFile(...)`; the factory's own shape is mirrored as `src/results.validFile()`, but each parameterised result is not expanded here | `validFile(value) (src/results.ts:20)` |
| src/resources.GroupInput | shape computed by `.omit(...)` - a transform of another schema, not expanded | `ResourceGroup.omit({ changed: true }) (src/resources.ts:460)` |
| src/resources.KindInput | shape computed by `.omit(...)` - a transform of another schema, not expanded | `ResourceKind.omit({ changed: true }) (src/resources.ts:458)` |
| src/resources.RegistryLevel | a z.enum whose members are computed or imported - this reader could not reach a literal list | `z.enum(['core', ...WordLevel.options])` |

### Declared but not read

The census found these top-level declarations and the extractor did not mirror them. Nothing else about them is on this page.

| family | count | declarations |
|---|---|---|
| object constant | 8 | `src/classify.LAYOUT_DIRS` `src/classify.ts:259`<br>`src/failure-codes.FAILURE_CODE_RANGE` `src/failure-codes.ts:31`<br>`src/failure-codes.JSONRPC_CODES` `src/failure-codes.ts:22`<br>`src/lifecycle.LIFECYCLE_CAPABILITIES` `src/lifecycle.ts:48`<br>`src/open-args.OPEN_ENV` `src/open-args.ts:47`<br>`src/renders.FOLDER_HEAVY` `src/renders.ts:47`<br>`src/resources.EMPTY_RESOURCES` `src/resources.ts:127`<br>`src/words.EMPTY_WORDS` `src/words.ts:151` |
| array constant | 6 | `src/gitignore-rules.GITIGNORE_BASE` `src/gitignore-rules.ts:55`<br>`src/identity.DEFAULT_LANGUAGES` `src/identity.ts:29`<br>`src/publish.PUBLISH_PIECES` `src/publish.ts:30`<br>`src/publish.READY_STATES` `src/publish.ts:65`<br>`src/publish.SUGGESTION_STATES` `src/publish.ts:67`<br>`src/transport.FORWARD_SPEEDS` `src/transport.ts:25` |
| class | 6 | `src/failure-codes.CapabilityRefusal` `src/failure-codes.ts:171`<br>`src/publish.NoFinalVideo` `src/publish.ts:789`<br>`src/resources.ResourceNotFound` `src/resources.ts:381`<br>`src/results.FliCoreError` `src/results.ts:25`<br>`src/youtube.YouTubeApiError` `src/youtube.ts:216`<br>`src/youtube.YouTubeReader` `src/youtube.ts:232` |
| const built by a call (helper or non-zod call) | 6 | `src/failure-codes.SUITE_FAILURE_CODES` `src/failure-codes.ts:34`<br>`src/failure-codes.SUITE_REFUSAL_DETAILS` `src/failure-codes.ts:164`<br>`src/gitignore-rules.GitignorePattern` `src/gitignore-rules.ts:32`<br>`src/publish.AUDIO_TREATMENTS` `src/publish.ts:177`<br>`src/resources.CORE_KINDS` `src/resources.ts:195`<br>`src/series.SERIES_CAPABILITIES` `src/series.ts:282` |
| generic type alias | 4 | `src/capability.ContractInput` `src/capability.ts:79`<br>`src/estate.Scanned` `src/estate.ts:28`<br>`src/results.ReadFileResult` `src/results.ts:22`<br>`src/results.ValidFile` `src/results.ts:16` |
| derived type (`keyof typeof`, indexed access, `typeof`) | 1 | `src/failure-codes.SuiteFailureMode` `src/failure-codes.ts:49` |
| union of named or mixed types | 1 | `src/gitignore-rules.BlockLocation` `src/gitignore-rules.ts:201` |
| utility-type alias (`Pick` / `Omit` / `Record` / generic instance) | 1 | `src/youtube.Thumbs` `src/youtube.ts:227` |

## Findings — changes needed in the target application

These are refactors of the **application**, not of this mirror. Each one converts a derived section into a declared one.

1. `src/classify.ts:63` — REFACTOR (minor): `ASSEMBLY_FOLDERS` at src/classify.ts:63 names the set but does not type it. A z.enum or `as const` + `typeof ASSEMBLY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.
2. `src/classify.ts:66-73` — REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:66 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.
3. `src/classify.ts:122-129` — REFACTOR (minor): `MOTION_MACHINERY` at src/classify.ts:122 names the set but does not type it. A z.enum or `as const` + `typeof MOTION_MACHINERY[number]` would make a wrong value a static error rather than a runtime miss.
4. `src/fs-utils.ts:32` — REFACTOR (minor): `NO_HARD_LINKS` at src/fs-utils.ts:32 names the set but does not type it. A z.enum or `as const` + `typeof NO_HARD_LINKS[number]` would make a wrong value a static error rather than a runtime miss.
5. `src/publish.ts:193` — REFACTOR (minor): `LIVE` at src/publish.ts:193 names the set but does not type it. A z.enum or `as const` + `typeof LIVE[number]` would make a wrong value a static error rather than a runtime miss.
6. `src/recipe-paths.ts:77` — REFACTOR (minor): `SKIP` at src/recipe-paths.ts:77 names the set but does not type it. A z.enum or `as const` + `typeof SKIP[number]` would make a wrong value a static error rather than a runtime miss.

---

Regenerate: `schema-mirror` skill → `extract_typescript.py` + `render_mirror.py`. Check for drift: `verify_mirror.py`.
