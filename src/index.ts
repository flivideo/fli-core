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
  LegacyVideoFile,
  ParsedVideoFile,
  RetiredVideoTag,
  UnknownVideoFile,
  VIDEO_FOLDER_PATTERN,
  VideoFile,
  VideoFileKind,
  VideoFolder,
  VideoFolderName,
  VideoPart,
  WholeVideoApp,
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  videoFolderName,
} from './video-file.js';

export { WholeVideoOwner, wholeVideoOwner } from './whole-video.js';

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
  OVERLAY_FOLDER,
  OverlayPaths,
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
  overlayPaths,
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
  BrandPublishSettings,
  BrandResearchSettings,
  BrandSettings,
  BrandStudioDefaults,
  BrandYouTubeSettings,
  ReadBrandSettingsResult,
  TranscriptionChoice,
  readBrandSettings,
  WriteBrandSettingsResult,
  writeBrandSettings,
  UpdateBrandSettingsResult,
  brandSettingsVersion,
  updateBrandSettings,
  type UpdateBrandSettingsOptions,
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

// fli-notes (v0.27.0; life states v0.28.0): notes, asks and changes, one line each in fli.notes.jsonl.
export {
  NOTES_FILE,
  NOTE_ENTITY,
  NOTE_REFUSALS,
  NOTE_EXCERPT_CONTEXT,
  NOTE_FULL_LIMIT,
  ChangeInput,
  ChangeSnapshot,
  NoteChannel,
  NoteExcerpt,
  NoteFilter,
  NoteForm,
  NoteInput,
  LifeState,
  NoteKind,
  NoteLinks,
  NoteProducer,
  NoteRecord,
  NoteRefusal,
  NoteScope,
  NoteState,
  NoteStatus,
  NoteTarget,
  NoteWhere,
  ResolveAskInput,
  SETTLE_FIELD,
  SettleInput,
  isSettleLine,
  matchesNote,
  noteChannelOf,
  noteRecordOf,
  noteStates,
  snapshotChange,
  type SnapshotOptions,
} from './note-record.js';

export {
  AddNoteResult,
  NoteLineProblem,
  NotesRead,
  NotesScan,
  ScannedNote,
  addNote,
  logChange,
  newNoteId,
  notesFilePath,
  readNotes,
  resolveAsk,
  scanNotes,
  settleNote,
  type AddNoteOptions,
  type ScanNotesOptions,
} from './notes.js';

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
  PUBLISH_PLATFORMS,
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
  type PublishPlatform,
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
  ChangeGroupResult,
  GROUP_CAPABILITIES,
  GROUP_FILE,
  GROUPS_FOLDER,
  Group,
  GroupFile,
  GroupHome,
  GroupListing,
  GroupMember,
  GroupRefusalReason,
  ReadGroupResult,
  addGroupMember,
  changeGroup,
  createGroup,
  groupAsSeries,
  groupFilePath,
  groupIdOf,
  listGroups,
  orderedGroupOf,
  readGroup,
  removeGroupMember,
  type ChangeGroupOptions,
} from './groups.js';

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

export { cloneFile, takeLock } from './fs-utils.js';

// Point and tell: the message saved on a note and the door for typing into a live conversation.
// Browser-safe half also in ./contracts. How an app adopts it: docs/point-and-tell.md.
export {
  TELL_DELIVERY_FIELD,
  TELL_ENTITY,
  TELL_MAX_CHARS,
  TELL_META_KEY,
  TellDelivery,
  TellMessage,
  TellMoment,
  TellOpen,
  TellOutcome,
  TellPosition,
  TellSaid,
  TellTo,
  tellDeliveryChange,
  tellLine,
  tellNoteInput,
  type TellLineOptions,
  type TellNoteOptions,
} from './tell.js';

export {
  AT_PROMPT_STATUSES,
  CONVERSATION_MAX_CHARS,
  CONVERSATION_TAIL_BYTES,
  ConversationList,
  ConversationMessage,
  ConversationRefusal,
  ConversationTail,
  LiveConversation,
  SendResult,
  cleanForPrompt,
  isLocalRequest,
  lastConversationMessages,
  listLiveConversations,
  readConversationTail,
  realConversationRun,
  sendToConversation,
  type ConversationOptions,
  type ConversationRun,
  type SendOptions,
} from './conversations.js';

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
  cameThroughServe,
  decodeTailscaleValue,
  hopsOf,
  isLoopback,
  isTailscaleHeader,
  plainAddress,
  serveCallerOf,
  serveLoginsFrom,
  servePrincipalOf,
  type ServeCaller,
  type ServeHeaders,
} from './serve.js';

export {
  TranscriptFiles,
  TranscriptFound,
  TranscriptJob,
  TranscriptJobStatus,
  flitoolsCall,
  flitoolsEndpoint,
  transcribe,
  transcribeQueued,
  transcriptFor,
  transcriptJobs,
  type FliToolsAnswer,
  type FliToolsEndpoint,
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
  speedWindow,
  type JklKey,
  type ShuttleAction,
  type SpeedWindow,
} from './transport.js';

/**
 * The zod this package is built with (v4). Declare capability inputs and outputs with it when the app itself is on
 * zod 3 (Teletubby, FliCut): a zod 3 schema is not a `z.ZodType` here, and a copy of zod 4 from elsewhere may not be.
 */
export { z } from 'zod';

export {
  ReadYouTubeChannelResult,
  ReadYouTubePlaylistsResult,
  ReadYouTubeSyncResult,
  SyncYouTubeResult,
  YOUTUBE_API_BASE,
  YOUTUBE_AVATAR_FILE,
  YOUTUBE_CHANNEL_FILE,
  YOUTUBE_PLAYLISTS_FILE,
  YOUTUBE_SYNC_FILE,
  YOUTUBE_THUMBNAIL_FILE,
  YOUTUBE_VIDEO_FILE,
  YOUTUBE_VIDEOS_FOLDER,
  YouTubeApiError,
  YouTubeChannel,
  YouTubePlaylist,
  YouTubePlaylistItem,
  YouTubePlaylistsFile,
  YouTubeReader,
  YouTubeSyncCounts,
  YouTubeSyncRecord,
  YouTubeVideo,
  YouTubeVideoListing,
  readYouTubeChannel,
  readYouTubePlaylists,
  readYouTubeSync,
  readYouTubeVideos,
  syncYouTubeChannel,
  youtubeMirrorDir,
  type SyncYouTubeOptions,
  type YouTubeFetch,
} from './youtube.js';

export {
  HELP_SCREENS,
  HelpGroup,
  HelpRow,
  HelpScreen,
  HelpScreenId,
  searchHelp,
  speedTip,
  tip,
} from './help.js';

export {
  GUIDE_REQUIRED,
  GUIDE_SCHEMA,
  GuideDoc,
  GuideDocAppliesTo,
  GuideDocLayer,
  GuideDocLevel,
  GuideDocType,
  GUIDE_DOC_TYPES,
  GUIDE_META_KEYS,
  GUIDE_TYPE_ALIASES,
  normaliseGuideType,
  isGuide,
  parseGuide,
  splitFrontmatter,
  type ParsedGuide,
} from './guide-doc.js';
