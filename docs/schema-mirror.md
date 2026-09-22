# Schema mirror

> Generated from the code, not written about it. Do not hand-edit — every line below is anchored to a `file:line` and is re-derived on every run.

- **stack** `typescript` · **extractor** `extract_typescript.py`
- **commit** `aa0ed0ddb63e` · **generated** 2026-09-22T03:35:11+00:00
- **scope** include `*.ts`, `*.tsx` · exclude `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `*.stories.tsx`, `*.config.ts`, `*/test/*`, `*/tests/*`, `*/__tests__/*`, `*/e2e/*`, `*/__mocks__/*`, `*/fixtures/*`

| shapes | declared sets | derived sets | gaps | findings |
|---|---|---|---|---|
| 80 | 20 | 2 | 4 | 2 |

> **Read the gaps before trusting the shape.** Derived sets have no declaring symbol and will drift silently the next time one changes. Gaps are things this mirror could not reach — they are not absences in the code.

## Closed sets — declared

One symbol states each set. Adding a member changes that symbol, so these cannot drift.

### `src/brands.ReadBrandsResult.kind` — `src/brands.ts:45`

*the `kind` discriminator of the union `ReadBrandsResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `valid` | `src/brands.ts:36` |
| `invalid` | `src/results.ts:5` |

### `src/classify.ProjectZone` — `src/classify.ts:8-17`

*`z.enum` `ProjectZone` - a single declaring symbol*

| value | declared at |
|---|---|
| `identity` | `src/classify.ts:9` |
| `app-decisions` | `src/classify.ts:10` |
| `recordings` | `src/classify.ts:11` |
| `transcripts` | `src/classify.ts:12` |
| `cast` | `src/classify.ts:13` |
| `videos` | `src/classify.ts:14` |
| `legacy` | `src/classify.ts:15` |
| `other` | `src/classify.ts:16` |

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

### `src/identity.WriteIdentityResult.kind` — `src/identity.ts:36-42`

*the `kind` discriminator of the union `WriteIdentityResult` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `written` | `src/identity.ts:37` |
| `refused` | `src/identity.ts:30` |

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

### `src/video-file.VideoFileKind` — `src/video-file.ts:14`

*`z.enum` `VideoFileKind` - a single declaring symbol*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:14` |
| `audio` | `src/video-file.ts:14` |
| `overlay` | `src/video-file.ts:14` |
| `final` | `src/video-file.ts:14` |

### `src/video-file.VideoFile.kind` — `src/video-file.ts:17-32`

*the `kind` discriminator of `z.discriminatedUnion` `VideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:20` |
| `final` | `src/video-file.ts:26` |
| `audio` | `src/video-file.ts:30` |
| `overlay` | `src/video-file.ts:31` |

### `src/video-file.ParsedVideoFile.kind` — `src/video-file.ts:44`

*the `kind` discriminator of the union `ParsedVideoFile` - each value declared by a `z.literal` in one variant*

| value | declared at |
|---|---|
| `cut` | `src/video-file.ts:20` |
| `final` | `src/video-file.ts:26` |
| `audio` | `src/video-file.ts:30` |
| `overlay` | `src/video-file.ts:31` |
| `unknown-kind` | `src/video-file.ts:36` |

## Closed sets — derived (no declaring symbol)

Each set below was read out of the real authority — control flow, membership tests, dispatch tables — because nothing declares it. **Correct as of this commit and fragile after it.** Each carries the refactor that would make it declared.

### `src/classify.LEGACY_FOLDERS` — `src/classify.ts:29-36`

*module constant `LEGACY_FOLDERS` used in a `.includes()` test - one place to change, but no z.enum or literal union, so nothing checks a value against it*

| value | read from |
|---|---|
| `first-edit` | `src/classify.ts:30` |
| `edits` | `src/classify.ts:31` |
| `edit-1st` | `src/classify.ts:32` |
| `final` | `src/classify.ts:33` |
| `pipeline` | `src/classify.ts:34` |
| `animation` | `src/classify.ts:35` |

> **REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:29 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.**

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

### `src/app-file.AppName` — zod-scalar — `src/app-file.ts:15-18`

`z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'app must be kebab-case').refine((app) => app !== 'brand', 'app "brand" is reserved for fli.…`

### `src/app-file.AppSubject` — zod-scalar — `src/app-file.ts:19-24`

`z.string().regex(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/, 'subject must be letters, digits, _ or -, with single dots between words')`

### `src/app-file.AppFile` — zod-object — `src/app-file.ts:26-31`

| field | type | default | at |
|---|---|---|---|
| `app` | `AppName → src/app-file.AppName` | — | `src/app-file.ts:27` |
| `subject` | `AppSubject.optional() → src/app-file.AppSubject` | — | `src/app-file.ts:27` |

### `src/brand-settings.BrandSettings` — zod-object — `src/brand-settings.ts:9-15`

`v-<brand>/fli.brand.json` (D13, spec O6): per-brand display settings, travelling in the brand's repo.

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/brand-settings.ts:10` |
| `brand` | `z.string().min(1)` | — | `src/brand-settings.ts:11` |
| `colour` | `z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)')` | — | `src/brand-settings.ts:12` |

### `src/brands.Brand` — zod-object — `src/brands.ts:9-17`

A brand from the registry (R6, R29). Only the fields the Fli apps need; the rest of the entry is ignored.

| field | type | default | at |
|---|---|---|---|
| `key` | `z.string().min(1)` | — | `src/brands.ts:11` |
| `name` | `z.string().min(1)` | — | `src/brands.ts:12` |
| `shortcut` | `z.string().optional()` | — | `src/brands.ts:13` |
| `type` | `z.string().optional()` | — | `src/brands.ts:14` |
| `videoProjects` | `z.string().optional()` | — | `src/brands.ts:16` |

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

| field | type | default | at |
|---|---|---|---|
| `brands` | `z.record(z.string(), z.unknown())` | — | `src/brands.ts:28` |

### `src/brands.SkippedBrand` — zod-object — `src/brands.ts:32`

A registry entry `readBrands` could not use, and why.

| field | type | default | at |
|---|---|---|---|
| `key` | `z.string()` | — | `src/brands.ts:32` |
| `issues` | `z.array(z.string())` | — | `src/brands.ts:32` |

### `src/brands.BrandsRead` — zod-object — `src/brands.ts:35-42`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('valid')` | — | `src/brands.ts:36` |
| `path` | `z.string()` | — | `src/brands.ts:37` |
| `value` | `z.array(Brand) → src/brands.Brand` | — | `src/brands.ts:39` |
| `skipped` | `z.array(SkippedBrand) → src/brands.SkippedBrand` | — | `src/brands.ts:41` |

### `src/brands.ReadBrandsResult` — zod-union on `kind` — `src/brands.ts:45`

| field | type | default | at |
|---|---|---|---|
| `BrandsRead` | `BrandsRead → src/brands.BrandsRead` | — | `src/brands.ts:45` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/brands.ts:45` |
| `null` | `z.null()` | — | `src/brands.ts:45` |

### `src/brands.ReadBrandsOptions` — interface — `src/brands.ts:48-53`

| field | type | default | at |
|---|---|---|---|
| `path` | `?: string` | — | `src/brands.ts:50` |
| `home` | `?: string` | — | `src/brands.ts:52` |

### `src/brands.ResolveBrandRootOptions` — interface — `src/brands.ts:92-95`

| field | type | default | at |
|---|---|---|---|
| `home` | `?: string` | — | `src/brands.ts:94` |

### `src/estate.scanned()` — zod-factory (zod-discriminated-union) on `state` — `src/estate.ts:17-27`

A collection that was read, or one that could not be (R12): empty and unscanned are never the same thing.

| field | type | default | at |
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

| field | type | default | at |
|---|---|---|---|
| `folder` | `z.string()` | — | `src/estate.ts:32` |
| `path` | `z.string()` | — | `src/estate.ts:33` |
| `parsed` | `ProjectFolder.nullable() → src/project-folder.ProjectFolder` | — | `src/estate.ts:35` |
| `identity` | `ProjectIdentity → src/identity.ProjectIdentity` | — | `src/estate.ts:36` |

### `src/estate.OtherFolder` — zod-object — `src/estate.ts:41-49`

Any other top-level folder (R9): shown as *other folder*, never as an error.

| field | type | default | at |
|---|---|---|---|
| `folder` | `z.string()` | — | `src/estate.ts:42` |
| `path` | `z.string()` | — | `src/estate.ts:43` |
| `looksLikeProject` | `z.boolean()` | — | `src/estate.ts:45` |
| `parsed` | `ProjectFolder.nullable() → src/project-folder.ProjectFolder` | — | `src/estate.ts:46` |
| `identity` | `z.union([z.literal('absent'), InvalidFile]) → src/results.InvalidFile` | — | `src/estate.ts:48` |

### `src/estate.OtherFolder.identity` — zod-union — `src/estate.ts:48`

| field | type | default | at |
|---|---|---|---|
| `absent` | `z.literal('absent')` | — | `src/estate.ts:48` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/estate.ts:48` |

### `src/estate.ArchivedEntry` — zod-discriminated-union on `kind` — `src/estate.ts:53-63`

One folder directly under `<brandRoot>/archived/` (R13: listed, never descended into).

| field | type | default | at |
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

| field | type | default | at |
|---|---|---|---|
| `ProjectAmbiguous` | `ProjectAmbiguous → src/estate.ProjectAmbiguous` | — | `src/estate.ts:216` |
| `ProjectNotAProject` | `ProjectNotAProject → src/estate.ProjectNotAProject` | — | `src/estate.ts:217` |
| `ProjectNotFound` | `ProjectNotFound → src/estate.ProjectNotFound` | — | `src/estate.ts:218` |
| `ProjectUnscanned` | `ProjectUnscanned → src/estate.ProjectUnscanned` | — | `src/estate.ts:219` |

### `src/estate.ResolveProjectResult` — zod-discriminated-union on `kind` — `src/estate.ts:223-229`

| field | type | default | at |
|---|---|---|---|
| `ProjectFound` | `ProjectFound → src/estate.ProjectFound` | — | `src/estate.ts:224` |
| `ProjectAmbiguous` | `ProjectAmbiguous → src/estate.ProjectAmbiguous` | — | `src/estate.ts:225` |
| `ProjectNotAProject` | `ProjectNotAProject → src/estate.ProjectNotAProject` | — | `src/estate.ts:226` |
| `ProjectNotFound` | `ProjectNotFound → src/estate.ProjectNotFound` | — | `src/estate.ts:227` |
| `ProjectUnscanned` | `ProjectUnscanned → src/estate.ProjectUnscanned` | — | `src/estate.ts:228` |

### `src/estate.NextCodeResult` — zod-discriminated-union on `kind` — `src/estate.ts:280-287`

| field | type | default | at |
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

### `src/identity.ProjectIdentity` — zod-object — `src/identity.ts:10-17`

`fli.studio.json` (A3): the project's identity. Membership of a brand = this file exists and is valid (R8).

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/identity.ts:11` |
| `id` | `z.uuid()` | — | `src/identity.ts:12` |
| `brand` | `z.string().min(1)` | — | `src/identity.ts:13` |
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/identity.ts:14` |
| `name` | `z.string().min(1)` | — | `src/identity.ts:15` |
| `createdAt` | `z.iso.datetime({ offset: true })` | — | `src/identity.ts:16` |

### `src/identity.Refused()` — zod-factory — `src/identity.ts:28-34`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:30` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:31` |
| `path` | `z.string()` | — | `src/identity.ts:32` |
| `message` | `z.string()` | — | `src/identity.ts:33` |

### `src/identity.WriteIdentityResult` — zod-union on `kind` — `src/identity.ts:36-42`

| field | type | default | at |
|---|---|---|---|
| `written` | `z.object({ kind: z.literal('written'), path: z.string(), replaced: z.boolean() })` | — | `src/identity.ts:37` |
| `Refused('invalid-input')` | `Refused('invalid-input') → src/identity.Refused()` | — | `src/identity.ts:38` |
| `Refused('different-id').extend({ existingId: z.string() })` | `Refused('different-id').extend({ existingId: z.string() }) → src/identity.Refused()` | — | `src/identity.ts:39` |
| `Refused('existing-invalid')` | `Refused('existing-invalid') → src/identity.Refused()` | — | `src/identity.ts:40` |
| `Refused('io-error')` | `Refused('io-error') → src/identity.Refused()` | — | `src/identity.ts:41` |

### `src/identity.WriteIdentityResult[kind=written]` — zod-object — `src/identity.ts:37`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('written')` | — | `src/identity.ts:37` |
| `path` | `z.string()` | — | `src/identity.ts:37` |
| `replaced` | `z.boolean()` | — | `src/identity.ts:37` |

### `src/identity.WriteIdentityResult[2]` — zod-object — `src/identity.ts:39`

*extends* `Refused(...)`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('refused')` | — | `src/identity.ts:30` |
| `reason` | `z.literal(reason)` | — | `src/identity.ts:31` |
| `path` | `z.string()` | — | `src/identity.ts:32` |
| `message` | `z.string()` | — | `src/identity.ts:33` |
| `existingId` | `z.string()` | — | `src/identity.ts:39` |

### `src/lab-path.PathSegment` — zod-scalar — `src/lab-path.ts:6-12`

`z.string().min(1).refine((value) => !/[/\\]/.test(value) && value !== '.' && value !== '..', 'must be a single path segment')`

### `src/lab-path.LabPathInput` — zod-object — `src/lab-path.ts:14-37`

| field | type | default | at |
|---|---|---|---|
| `brandRoot` | `z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path').optional() → path (node:path)` | — | `src/lab-path.ts:20` |
| `brand` | `PathSegment.optional() → src/lab-path.PathSegment` | — | `src/lab-path.ts:28` |
| `project` | `PathSegment → src/lab-path.PathSegment` | — | `src/lab-path.ts:30` |
| `app` | `PathSegment → src/lab-path.PathSegment` | — | `src/lab-path.ts:31` |
| `subject` | `PathSegment.optional() → src/lab-path.PathSegment` | — | `src/lab-path.ts:32` |

### `src/machine.AbsolutePath` — zod-scalar — `src/machine.ts:7-9`

`z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path')`

### `src/machine.MachineSettings` — zod-object — `src/machine.ts:12-20`

`~/.fli/machine.json` (D5, roadmap §1.2b): this machine's settings.

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/machine.ts:13` |
| `brandRoots` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:15` |
| `labRoot` | `AbsolutePath.optional() → src/machine.AbsolutePath` | — | `src/machine.ts:17` |
| `apps` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:19` |

### `src/machine.ResolvedMachineSettings` — zod-object — `src/machine.ts:24`

Machine settings with the defaults filled in.

*extends* `MachineSettings`

| field | type | default | at |
|---|---|---|---|
| `schema` | `z.literal(1)` | — | `src/machine.ts:13` |
| `brandRoots` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:15` |
| `apps` | `z.record(z.string().min(1), AbsolutePath).optional() → src/machine.AbsolutePath` | — | `src/machine.ts:19` |
| `labRoot` | `AbsolutePath → src/machine.AbsolutePath` | — | `src/machine.ts:24` |

### `src/machine.MachineSettingsOptions` — interface — `src/machine.ts:27-30`

| field | type | default | at |
|---|---|---|---|
| `home` | `?: string` | — | `src/machine.ts:29` |

### `src/machine.MachineSettingsResult` — zod-discriminated-union on `kind` — `src/machine.ts:32-40`

| field | type | default | at |
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

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/open-args.ts:13` |
| `projectDir` | `z.string().min(1).refine((value) => path.isAbsolute(value), 'projectDir must be an absolute path') → path (node:path)` | — | `src/open-args.ts:15` |
| `projectId` | `z.uuid()` | — | `src/open-args.ts:20` |
| `video` | `VideoFolderName.optional() → src/video-file.VideoFolderName` | — | `src/open-args.ts:22` |

### `src/open-args.OpenArgs` — zod-object — `src/open-args.ts:27-33`

What door 2 carries before resolution: names, not paths or ids.

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1)` | — | `src/open-args.ts:28` |
| `project` | `z.string().min(1)` | — | `src/open-args.ts:30` |
| `video` | `VideoFolderName.optional() → src/video-file.VideoFolderName` | — | `src/open-args.ts:32` |

### `src/open-args.RawOpenArgs` — zod-object — `src/open-args.ts:40-44`

Door-2 values exactly as given (argv or env): present and non-empty, not yet validated or resolved.

| field | type | default | at |
|---|---|---|---|
| `brand` | `z.string().min(1).optional()` | — | `src/open-args.ts:41` |
| `project` | `z.string().min(1).optional()` | — | `src/open-args.ts:42` |
| `video` | `z.string().min(1).optional()` | — | `src/open-args.ts:43` |

### `src/open-args.ParseOpenArgsOptions` — interface — `src/open-args.ts:53-56`

| field | type | default | at |
|---|---|---|---|
| `requireVideo` | `?: boolean` | — | `src/open-args.ts:55` |

### `src/open-args.ParsedOpenArgs` — zod-object — `src/open-args.ts:58-62`

| field | type | default | at |
|---|---|---|---|
| `context` | `RawOpenArgs → src/open-args.RawOpenArgs` | — | `src/open-args.ts:59` |
| `missing` | `z.array(OpenArgName) → src/open-args.OpenArgName` | — | `src/open-args.ts:61` |

### `src/open-context.OpenContextResult` — zod-discriminated-union on `kind` — `src/open-context.ts:16-30`

Door 2 end to end (open contract §3, §5; C1, C3): turn the names an app was launched with into the `OpenContext` it

| field | type | default | at |
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

| field | type | default | at |
|---|---|---|---|
| `brands` | `readonly Brand[] → src/brands.Brand` | — | `src/open-context.ts:35` |
| `machine` | `?: Pick<MachineSettings, 'brandRoots'> | null → Pick (node_modules/typescript/lib/lib.es5.d.ts), src/machine.MachineSettings` | — | `src/open-context.ts:37` |
| `home` | `?: string` | — | `src/open-context.ts:39` |
| `requireVideo` | `?: boolean` | — | `src/open-context.ts:41` |

### `src/project-folder.ProjectCode` — zod-scalar — `src/project-folder.ts:5-7`

A project code: one lowercase letter and two digits (`a01`, `d02`).

`z.string().regex(/^[a-z]\d{2}$/, 'code must be one lowercase letter + two digits')`

### `src/project-folder.KebabSlug` — zod-scalar — `src/project-folder.ts:11-13`

Kebab-case: lowercase letters and digits, single hyphens between words.

`z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (a-z, 0-9, single hyphens)')`

### `src/project-folder.ProjectFolder` — zod-object — `src/project-folder.ts:15`

| field | type | default | at |
|---|---|---|---|
| `code` | `ProjectCode → src/project-folder.ProjectCode` | — | `src/project-folder.ts:15` |
| `slug` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/project-folder.ts:15` |

### `src/recording.RecordingTag` — zod-scalar — `src/recording.ts:14-16`

`z.string().regex(TAG, 'tag must be uppercase letters/digits with a letter')`

### `src/recording.Recording` — zod-object — `src/recording.ts:18-45`

| field | type | default | at |
|---|---|---|---|
| `chapter` | `z.number().int().min(1).max(99)` | — | `src/recording.ts:20` |
| `segment` | `z.number().int().min(1).nullable()` | — | `src/recording.ts:21` |
| `slug` | `z.string().regex(/^[a-z0-9.]+(?:-[a-z0-9.]+)*$/, 'slug must be kebab-case (a-z, 0-9, periods, hyphens)')` | — | `src/recording.ts:22` |
| `tags` | `z.array(RecordingTag) → src/recording.RecordingTag` | — | `src/recording.ts:28` |
| `ext` | `z.string().regex(/^[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*$/, 'ext must be letters/digits with a letter, without the dot')` | — | `src/recording.ts:29` |

### `src/results.InvalidFile` — zod-object — `src/results.ts:4-9`

A JSON file that was found but could not be used. Readers return this instead of throwing.

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

| field | type | default | at |
|---|---|---|---|
| `validFile` | `validFile(value) → src/results.validFile()` | — | `src/results.ts:20` |
| `InvalidFile` | `InvalidFile → src/results.InvalidFile` | — | `src/results.ts:20` |
| `null` | `z.null()` | — | `src/results.ts:20` |

### `src/video-file.VideoNumber` — zod-scalar — `src/video-file.ts:11`

Video files and folders (spec §3 L1): `videos/<NN>-<video-name>/<NN>-<kind>[-<variant>].<ext>`.

`z.number().int().min(1).max(99)`

### `src/video-file.Ext` — zod-scalar — `src/video-file.ts:12`

`z.string().regex(/^[A-Za-z0-9]+$/, 'ext must be letters/digits, without the dot')`

### `src/video-file.VideoFile` — zod-discriminated-union on `kind` — `src/video-file.ts:17-32`

| field | type | default | at |
|---|---|---|---|
| `cut` | `z.object({ video: VideoNumber, kind: z.literal('cut'), variant: z.null().default(null), ext: Ext }) → src/video-file.VideoNumber, src/video-file.Ext` | — | `src/video-file.ts:20` |
| `final` | `z.object({ video: VideoNumber, kind: z.literal('final'), variant: z.null().default(null), ext: Ext }) → src/video-file.VideoNumber, src/video-file.Ext` | — | `src/video-file.ts:26` |
| `audio` | `z.object({ video: VideoNumber, kind: z.literal('audio'), variant: KebabSlug, ext: Ext }) → src/video-file.VideoNumber, src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:30` |
| `overlay` | `z.object({ video: VideoNumber, kind: z.literal('overlay'), variant: KebabSlug, ext: Ext }) → src/video-file.VideoNumber, src/project-folder.KebabSlug, src/video-file.Ext` | — | `src/video-file.ts:31` |

### `src/video-file.VideoFile[kind=cut]` — zod-object — `src/video-file.ts:18-23`

| field | type | default | at |
|---|---|---|---|
| `video` | `VideoNumber → src/video-file.VideoNumber` | — | `src/video-file.ts:19` |
| `kind` | `z.literal('cut')` | — | `src/video-file.ts:20` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:21` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:22` |

### `src/video-file.VideoFile[kind=final]` — zod-object — `src/video-file.ts:24-29`

| field | type | default | at |
|---|---|---|---|
| `video` | `VideoNumber → src/video-file.VideoNumber` | — | `src/video-file.ts:25` |
| `kind` | `z.literal('final')` | — | `src/video-file.ts:26` |
| `variant` | `z.null().default(null)` | `null` | `src/video-file.ts:27` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:28` |

### `src/video-file.VideoFile[kind=audio]` — zod-object — `src/video-file.ts:30`

| field | type | default | at |
|---|---|---|---|
| `video` | `VideoNumber → src/video-file.VideoNumber` | — | `src/video-file.ts:30` |
| `kind` | `z.literal('audio')` | — | `src/video-file.ts:30` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:30` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:30` |

### `src/video-file.VideoFile[kind=overlay]` — zod-object — `src/video-file.ts:31`

| field | type | default | at |
|---|---|---|---|
| `video` | `VideoNumber → src/video-file.VideoNumber` | — | `src/video-file.ts:31` |
| `kind` | `z.literal('overlay')` | — | `src/video-file.ts:31` |
| `variant` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:31` |
| `ext` | `Ext → src/video-file.Ext` | — | `src/video-file.ts:31` |

### `src/video-file.UnknownVideoFile` — zod-object — `src/video-file.ts:35-41`

| field | type | default | at |
|---|---|---|---|
| `kind` | `z.literal('unknown-kind')` | — | `src/video-file.ts:36` |
| `name` | `z.string()` | — | `src/video-file.ts:37` |
| `video` | `VideoNumber.nullable() → src/video-file.VideoNumber` | — | `src/video-file.ts:39` |
| `ext` | `z.string().nullable()` | — | `src/video-file.ts:40` |

### `src/video-file.ParsedVideoFile` — zod-union on `kind` — `src/video-file.ts:44`

| field | type | default | at |
|---|---|---|---|
| `VideoFile` | `VideoFile → src/video-file.VideoFile` | — | `src/video-file.ts:44` |
| `UnknownVideoFile` | `UnknownVideoFile → src/video-file.UnknownVideoFile` | — | `src/video-file.ts:44` |

### `src/video-file.VideoFolder` — zod-object — `src/video-file.ts:83`

| field | type | default | at |
|---|---|---|---|
| `video` | `VideoNumber → src/video-file.VideoNumber` | — | `src/video-file.ts:83` |
| `name` | `KebabSlug → src/project-folder.KebabSlug` | — | `src/video-file.ts:83` |

### `src/video-file.VideoFolderName` — zod-scalar — `src/video-file.ts:90-92`

The same rule as a string schema, for contexts that carry the folder name (`OpenContext.video`).

`z.string().regex(VIDEO_FOLDER_PATTERN, 'video must be a video folder name, <NN>-<kebab-name>')`

## Cannot be mirrored

These were looked at and could not be resolved to an authority. **Nothing is guessed for them.** Each is a real gap in this page.

| subject | why | looked at |
|---|---|---|
| schemas built by `Refused(...)` (3 uses) | built by calling the schema factory `Refused(...)`; the factory's own shape is mirrored as `src/identity.Refused()`, but each parameterised result is not expanded here | `Refused('invalid-input') (src/identity.ts:38)`<br>`Refused('existing-invalid') (src/identity.ts:40)`<br>`Refused('io-error') (src/identity.ts:41)` |
| schemas built by `readFileResult(...)` (2 uses) | built by calling the schema factory `readFileResult(...)`; the factory's own shape is mirrored as `src/results.readFileResult()`, but each parameterised result is not expanded here | `readFileResult(BrandSettings) (src/brand-settings.ts:18)`<br>`readFileResult(ProjectIdentity) (src/identity.ts:20)` |
| schemas built by `scanned(...)` (3 uses) | built by calling the schema factory `scanned(...)`; the factory's own shape is mirrored as `src/estate.scanned()`, but each parameterised result is not expanded here | `scanned(MemberProject) (src/estate.ts:69)`<br>`scanned(OtherFolder) (src/estate.ts:70)`<br>`scanned(ArchivedEntry) (src/estate.ts:71)` |
| schemas built by `validFile(...)` (1 use) | built by calling the schema factory `validFile(...)`; the factory's own shape is mirrored as `src/results.validFile()`, but each parameterised result is not expanded here | `validFile(value) (src/results.ts:20)` |

## Findings — changes needed in the target application

These are refactors of the **application**, not of this mirror. Each one converts a derived section into a declared one.

1. `src/classify.ts:29-36` — REFACTOR (minor): `LEGACY_FOLDERS` at src/classify.ts:29 names the set but does not type it. A z.enum or `as const` + `typeof LEGACY_FOLDERS[number]` would make a wrong value a static error rather than a runtime miss.
2. `src/fs-utils.ts:32` — REFACTOR (minor): `NO_HARD_LINKS` at src/fs-utils.ts:32 names the set but does not type it. A z.enum or `as const` + `typeof NO_HARD_LINKS[number]` would make a wrong value a static error rather than a runtime miss.

---

Regenerate: `schema-mirror` skill → `extract_typescript.py` + `render_mirror.py`. Check for drift: `verify_mirror.py`.
