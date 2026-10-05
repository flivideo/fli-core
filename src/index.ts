// @flivideo/core — the public surface (spec §4). Everything else in src/ is internal.
// Every shape is a zod schema exported under the same name as its inferred type.

export {
  FliCoreError,
  InvalidFile,
  readFileResult,
  validFile,
  type ReadFileResult,
  type ValidFile,
} from './results.js';

export {
  Brand,
  BrandsFile,
  BrandsRead,
  ReadBrandsResult,
  SkippedBrand,
  brandFolderName,
  brandsFilePath,
  readBrands,
  resolveBrandRoot,
  type ReadBrandsOptions,
  type ResolveBrandRootOptions,
} from './brands.js';

export {
  DEFAULT_ASPECT,
  DEFAULT_LANGUAGES,
  DEFAULT_SHAPE,
  ProjectAspect,
  ProjectIdentity,
  ProjectLanguage,
  ProjectShape,
  projectIntents,
  AdoptIdentityResult,
  ReadIdentityResult,
  WriteIdentityResult,
  adoptIdentity,
  readIdentity,
  writeIdentity,
  type AdoptIdentityInput,
} from './identity.js';

export {
  KebabSlug,
  ProjectCode,
  ProjectFolder,
  parseProjectFolder,
  projectFolderName,
} from './project-folder.js';

export { Recording, RecordingTag, parseRecording, recordingFileName } from './recording.js';

export {
  ParsedVideoFile,
  UnknownVideoFile,
  VIDEO_FOLDER_PATTERN,
  VideoFile,
  VideoFileKind,
  VideoFolder,
  VideoFolderName,
  VideoPart,
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  videoFolderName,
} from './video-file.js';

export {
  AppFile,
  AppName,
  AppSubject,
  IDENTITY_FILE,
  appFileName,
  parseAppFile,
} from './app-file.js';

export {
  ASSEMBLY_FOLDERS,
  HUB_FOLDER,
  LAYOUT_DIRS,
  LEGACY_FOLDERS,
  MOTION_MACHINERY,
  OverlayRole,
  ProjectEntry,
  ProjectLayout,
  ProjectLayoutPaths,
  ProjectTier,
  ProjectZone,
  RENDERS_FOLDER,
  TRASH_FOLDER,
  classifyProjectEntry,
  describeProjectEntry,
  projectLayout,
  projectLayoutPaths,
  projectLayoutPathsSync,
  projectLayoutSync,
} from './classify.js';

export {
  ARCHIVED_FOLDER,
  ArchivedEntry,
  MemberProject,
  NextCodeResult,
  OtherFolder,
  ProjectListing,
  ProjectRefusal,
  ResolveProjectResult,
  listProjects,
  nextCode,
  resolveProject,
  scanned,
  type Scanned,
} from './estate.js';

export {
  BRAND_SETTINGS_FILE,
  BrandSettings,
  ReadBrandSettingsResult,
  TranscriptionChoice,
  readBrandSettings,
  WriteBrandSettingsResult,
  writeBrandSettings,
} from './brand-settings.js';

export {
  MachineSettings,
  MachineSettingsResult,
  ResolvedMachineSettings,
  defaultLabRoot,
  machineSettingsPath,
  readMachineSettings,
  type MachineSettingsOptions,
} from './machine.js';

export { RevealResult, revealPath, type RevealOptions } from './reveal.js';

export { Stamp, stampOf } from './stamp.js';

export {
  EMPTY_RESOURCES,
  GroupInput,
  KindInput,
  OTHER_GROUP,
  RESOURCES_FILE,
  ReadResourcesFileResult,
  Resource,
  ResourceAudience,
  CORE_KINDS,
  RegistryLevel,
  ResourceChoose,
  ResourceGroup,
  ResourceInput,
  ResourceKind,
  ResourceNotFound,
  ResourceOff,
  ResourcePatch,
  ResourceRef,
  ResourceRegistry,
  ResourceStatus,
  ResourceValue,
  ResourceVideo,
  ResourcesFile,
  ResourcesRead,
  WriteResourcesResult,
  addRegistryRow,
  addResource,
  kindOf,
  mergeRegistry,
  newResourceId,
  readResources,
  readResourcesFile,
  removeRegistryRow,
  removeResource,
  resourcesFilePaths,
  setResourceStatus,
  tagResource,
  updateResource,
  writeResourcesFile,
  type ReadResourcesOptions,
  type ResourceChange,
} from './resources.js';

export {
  AUDIO_TREATMENTS,
  CAPTION_LENGTH_TOLERANCE_SEC,
  EditApp,
  NoFinalVideo,
  PUBLISH_PIECES,
  PUBLISH_RULES,
  PublishEdit,
  PublishExport,
  PublishFacts,
  PublishLaunch,
  PublishPiece,
  PublishReadiness,
  PublishRow,
  PublishState,
  PublishedVideo,
  READY_STATES,
  SUGGESTION_STATES,
  acceptableRows,
  clock,
  exportApp,
  isPersonChoice,
  launchFacts,
  markPublished,
  parseYoutubeId,
  promoteFile,
  publishReadiness,
  publishedVideos,
  youtubeUrl,
  type PublishRuleId,
} from './publish.js';

export {
  ChangeWordsResult,
  EMPTY_WORDS,
  MergedWords,
  ReadWordsFileResult,
  WORDS_FILE,
  WordFiller,
  WordInput,
  WordKind,
  WordLevel,
  WordName,
  WordOff,
  WordRef,
  WordRule,
  WordsFile,
  WordsRead,
  WriteWordsResult,
  addWord,
  addWordAt,
  changeWordsFile,
  fillersOf,
  mergeWords,
  readWords,
  readWordsFile,
  rememberWord,
  removeWord,
  removeWordAt,
  vocabularyOf,
  wordKey,
  wordsFilePaths,
  writeWordsFile,
  type ChangeWordsOptions,
  type ReadWordsOptions,
} from './words.js';

export { LabPathInput, ResolvedLabPath, labPath, resolveLabPath } from './lab-path.js';

export {
  ClearRendersResult,
  FOLDER_HEAVY,
  RendersPathInput,
  RendersTally,
  RendersTool,
  clearRenders,
  rendersOf,
  rendersPath,
} from './renders.js';

export {
  ChangeSeriesResult,
  ReadSeriesResult,
  SERIES_CAPABILITIES,
  SERIES_FILE,
  SERIES_FOLDER,
  SeriesFile,
  SeriesListing,
  SeriesMember,
  addSeriesMember,
  changeSeries,
  createSeries,
  listSeries,
  readSeries,
  removeSeriesMember,
  seriesFilePath,
  type ChangeSeriesOptions,
} from './series.js';

export {
  RecipePathProblem,
  RecipePathWarning,
  recipePathWarnings,
  recipePathWarningsIn,
} from './recipe-paths.js';

export {
  GITIGNORE_BASE,
  GITIGNORE_BASE_VERSION,
  GITIGNORE_BEGIN,
  GITIGNORE_END,
  GitignoreCheckResult,
  GitignoreGroup,
  GitignoreOverlayRule,
  GitignorePattern,
  GitignoreRenderResult,
  checkGitignore,
  locateBlock,
  patternLines,
  renderGitignore,
  renderGitignoreBlock,
  type GitignoreRenderOptions,
} from './gitignore-rules.js';

export {
  GITIGNORE_FILE,
  GitignoreResult,
  TrackedIgnored,
  gitignoreRender,
  trackedIgnored,
  type GitignoreOptions,
} from './gitignore.js';

export { cloneFile } from './fs-utils.js';

export {
  OPEN_ENV,
  OpenArgName,
  OpenArgs,
  OpenContext,
  ParsedOpenArgs,
  RawOpenArgs,
  parseOpenArgs,
  type ParseOpenArgsOptions,
} from './open-args.js';

export {
  OpenContextResult,
  resolveOpenContext,
  type ResolveOpenContextOptions,
} from './open-context.js';

export {
  DisplayArea,
  SavedWindow,
  WindowRect,
  WindowStateFile,
  importWindowState,
  loadWindow,
  placeWindow,
  saveWindow,
  saveWindowSync,
  trackWindow,
  windowKey,
  windowStatePath,
  type PlaceOptions,
  type TrackOptions,
  type TrackedWindow,
} from './window-state.js';

// ── The agent-drivable layer (v0.7.0, David 2026-09-23): one contract, one fence, one spec, one page. ──

export {
  CapabilityKind,
  CapabilityMeta,
  CapabilityName,
  ExpectedDuration,
  PRINCIPAL_HEADER,
  PrincipalKind,
  PrincipalName,
  SideEffects,
  authorize,
  defineCapabilities,
  defineCapability,
  describeCapabilities,
  familyOf,
  isHumanOnly,
  principalKind,
  requiredFields,
  type Authorization,
  type CapabilityContract,
  type HumanOnlyWhen,
} from './capability.js';

export {
  AppBusyDetails,
  BusyWork,
  CapabilityRefusal,
  FAILURE_CODE_RANGE,
  FailureCodeTable,
  ForbiddenDetails,
  JSONRPC_CODES,
  MissingDetails,
  Refusal,
  SUITE_FAILURE_CODES,
  SUITE_REFUSAL_DETAILS,
  assertAppendOnly,
  defineFailureCodes,
  failureCode,
  nextFailureCode,
  type SuiteFailureMode,
} from './failure-codes.js';

export {
  ControlFile,
  ControlFileRead,
  bearerMatches,
  controlFilePath,
  newControlToken,
  pidAlive,
  readControlFile,
  removeControlFile,
  writeControlFile,
  type ControlFileOptions,
} from './control-file.js';

export {
  JsonRpcRequest,
  OpenRpcDocument,
  OpenRpcServer,
  answerJsonRpc,
  openRpcText,
  toOpenRpc,
  type CallAnswer,
  type JsonRpcOptions,
  type OpenRpcOptions,
} from './openrpc.js';

export { renderApiPage, type ApiPageOptions } from './api-page.js';

export {
  TranscriptFiles,
  TranscriptFound,
  TranscriptJob,
  TranscriptJobStatus,
  flitoolsCall,
  transcribe,
  transcribeQueued,
  transcriptFor,
  transcriptJobs,
  type FliToolsAnswer,
  type FliToolsOptions,
  type TranscribeOptions,
} from './flitools.js';

export {
  AppScriptOpen,
  LIFECYCLE_CAPABILITIES,
  LifecycleVerb,
  SystemQuitInput,
  SystemQuitOutput,
  SystemStatus,
  appScriptArgs,
} from './lifecycle.js';

export {
  FORWARD_SPEEDS,
  MAX_SHUTTLE,
  ShuttleState,
  jkl,
  shuttle,
  shuttleLabel,
  type JklKey,
  type ShuttleAction,
} from './transport.js';

/**
 * The zod this package is built with (v4). Declare capability inputs and outputs with it when the app itself is on
 * zod 3 (Teletubby, FliCut): a zod 3 schema is not a `z.ZodType` here, and a copy of zod 4 from elsewhere may not be.
 */
export { z } from 'zod';
