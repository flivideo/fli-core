# Brand settings folders

The contract for the `-` folders at the top of a brand repo. Code: `src/brand-folders.ts`
(`isBrandSettingsFolder`, `BRAND_SETTINGS_FOLDERS`, `brandPackCandidates`).

## The rule

A top-level folder in a brand repo (`v-<brand>/`) whose name starts with `-` is **brand settings**:

- it is committed with the brand, like any project;
- it is read by the app or skill that owns it;
- it is **never a project**. The estate scan (`listProjects`) skips it, so it never shows up in project lists or
  next-code counting.

A new settings folder needs no code change: the dash is the rule. Add it to the register below (and to
`BRAND_SETTINGS_FOLDERS`) so readers know who owns it.

Inside a **project**, a `-` folder means something else: `-renders/`, `-trash/` and `-chapters/` are project zones
(`classify.ts`), not brand settings.

## The register

| Folder | Owner | Holds |
|---|---|---|
| `-theme` | FliStudio (white labelling) | the brand's look: the fonts, logo and studio mark files that `fli.theme.json` names |
| `-storypilot` | Story Pilot (a FliStudio module) | the brand's Story Pilot settings, templates, guides, narrators and kinds |
| `-reference` | the brand (any app or skill) | reference material for the brand that is not a project |
| `-thumbnails` | thumbnail skills and teams (FliStudio reads it, optionally) | the brand's canonical thumbnail and title rules: `brand-pack.md` or `brand.yaml` |

## Thumbnail rules: one file, found the same way by every reader

A brand's thumbnail and title rules live in **one** file, in its own repo: `-thumbnails/brand-pack.md` (or
`brand.yaml`). Skills, agent teams and apps all read that file, and none keeps a copy.

**Lookup order** (`brandPackCandidates`). The first file that exists wins, and the reader says which one it used:

1. **The brand repo:** `<brand repo>/-thumbnails/brand-pack.md`, then `<brand repo>/-thumbnails/brand.yaml`. The brand
   repo is the parent of the project folder.
2. **A user config path:** `~/.config/creator-skills/brand.yaml`. A creator with no brand repo, or no FliVideo folder
   layout at all, points this at their own rules.
3. **The reader's own defaults.**

**No FliStudio is needed.** This is a plain file in git plus a fixed search order, so a skill run on its own gets the
same rules as a team started from FliStudio.
