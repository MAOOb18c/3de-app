import { useEffect, useMemo, useRef, useState } from "react";
import { addKeywordScore, ANALYSIS_PURPOSE_CONFIGS, analysisPurposeConfigFor, API_BASE_URL, APP_VERSION, appendHashtagsToBase, applyDisplayScores, applyPersonaAStrictRelevance, applyPersonaUxLens, appModeFromPathname, attachFetchMetaToPosts, autoResizeTextarea, axisConfigFromPreset, axisExplanationItems, axisKeywords, axisLabel, axisPresetLabel, axisScoreOnly, BEGINNER_FIXED_X_COUNT, bindGenericQueryToTheme, buildAxisQualityWarnings, buildCombinedNoiseReasonCounts, buildCombinedXQuery, buildExcludeTermCandidates, buildFallbackSafeQuery, buildHashtagCandidates, buildImprovedQueryCandidates, buildImprovementComparison, buildNoiseBreakdown, buildNoiseProcessingResult, buildNoiseReasonCounts, buildPersonaQueryCandidates, buildPurposeFallbackIncludeGroups, buildPurposeFinalQueryWarnings, buildQueryAxisWarnings, buildQueryWithAxisKeywords, buildRecommendedNextActions, buildRetrievalKpi, buildRuleBasedQueryAdvice, buildSafeXQuery, buildSafeXQueryFromRaw, buildScoreReasonForAxis, buildScoreReasons, buildXQuery, buildXQueryWithHashtags, calculateAxisDistribution, calculateNextAddFetchCount, calculateScoreDistribution, calibrateScoreByRelevance, clamp, clampDashboardHeight, clampDashboardLeftWidth, clampDashboardSectionHeight, clampSidebarWidth, cleanupFinalXQuerySyntax, clusterCountJudgement, clusterOpinionsByText, clusterVolumeDomain, clusterVolumeFromRow, compactClusterRowsForHistory, createFallbackAnalysisDraft, createHistoryId, createInitialOperationStatus, createInitialStagedFetchState, createThemeAxisConfig, DASHBOARD_ACTION_DEFAULT_HEIGHT, DASHBOARD_ACTION_HEIGHT_STORAGE_KEY, DASHBOARD_ACTION_MIN_HEIGHT, DASHBOARD_DEFAULT_HEIGHT, DASHBOARD_HEIGHT_STORAGE_KEY, DASHBOARD_LEFT_DEFAULT_WIDTH, DASHBOARD_LEFT_MAX_VIEWPORT_RATIO, DASHBOARD_LEFT_MIN_WIDTH, DASHBOARD_LEFT_WIDTH_STORAGE_KEY, DASHBOARD_MAX_VIEWPORT_RATIO, DASHBOARD_MIN_HEIGHT, DASHBOARD_STATUS_DEFAULT_HEIGHT, DASHBOARD_STATUS_HEIGHT_STORAGE_KEY, DASHBOARD_STATUS_MIN_HEIGHT, dashboardLeftMaxWidth, dashboardMaxHeight, dashboardSectionMaxHeight, datasetSampleNo, DEFAULT_ADD_FETCH_COUNT, DEFAULT_MAX_X_FETCH, defaultAnalysisPurposeForPersona, detectGenericKeywordWarnings, detectNoiseCategory, detectSpreadTemplateCategory, diagnoseQueryQuality, diagnoseQueryTerms, EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED, EMPTY_OPERATION_STATUS, ensureScoreReasons, escapeMarkdownTableCell, extractFallbackKeywords, fallbackCodingScore, fallbackCustomAxisScore, fallbackDemocracyScore, fallbackGeneralScore, fallbackReligionScore, fallbackRomanceScore, fallbackScore, firstPositiveNumber, formatHistoryDate, formatNoiseReasonCounts, formatPercent, formatScore, gateAnalysisMarkdown, generateAxisLinkedKeywords, GENERIC_QUERY_TERMS, getPersonaAQueryCandidates, getScoreForDisplay, getScoreTripletForDisplay, getThemeAxisPreset, getThemeCategory, getThemeHashtagCandidates, getThemeQueryCandidates, hasConcentratedScoreDistribution, HASHTAG_NOISE_MARKERS, hasUrl, hideMojibakeQuery, includesAnyKeyword, inferLowAxisDescription, inferTopicKey, isPersonaARomanceQuery, isPersonaAUsableOpinion, isRetweetLike, isSimilarSpreadTemplate, isTooShortOpinion, jaccardSimilarity, LOCAL_PUBLISH_AVAILABLE, looksLikeMojibake, looksLikeSpreadTemplate, makeBigrams, makeClusterRepresentative, markerSizeForVolume, MAX_API_ZERO_RETRIES, MAX_CLUSTER_RUN_HISTORY, MAX_NO_NEW_UNIQUE_RETRIES, MAX_SAFE_QUERY_LENGTH, MAX_USER_AUTO_FETCH_ROUNDS, MAX_X_DATASET_HISTORY, mergeExcludeWords, mergePostsByText, migrateAppStateFromMojibake, migrateStageLogFromMojibake, MIN_ADD_FETCH_COUNT, NOISE_CATEGORY_LABELS, NOISE_RELEVANCE_THRESHOLD, noiseCategoryAdvice, normalizeAnalysisPurposeMode, normalizeAxisConfig, normalizeClusterVolume, normalizeHashtag, normalizeOpinionText, normalizeQueryForComparison, normalizeRelativeScores, normalizeSpreadTemplateText, normalizeThemeQueryCandidate, normalizeVoiceDirections, OPERATION_KEYS, parseJsonResponse, pathnameForAppMode, PERSONA_A_BROAD_QUERY_TERMS, personaAAllowsSpecialTopic, personaAQueryTermsForDirections, personaAxisConfig, personaConfigFor, personaExcludeTermCandidates, personaHashtagCandidates, personaQueryBaseText, postsFromExternalOpinions, postsFromTexts, PUBLIC_PREVIEW_MAX_X_FETCH, PUBLIC_PREVIEW_MODE, purposeCautionHashtags, purposeDisabledQueryTerms, purposeExcludeTerms, purposeHashtags, purposeQueryTerms, purposeVoiceDirections, qualityLabel, queriesAreEquivalent, QUERY_LABEL_DESCRIPTIONS_JA, QUERY_LABELS_JA, queryBaseLooksGenericOnly, queryBuildStatusLabel, queryDiagnosisLabel, queryKindLabel, QueryReviewChips, queryToSafeIncludeGroups, readDatasetHistory, reasonKeywordsForAxis, refineIncludeGroupsForPurpose, restoreClusterRowsFromHistory, retrievalKpiMessage, safeRuntimeText, sampleDisplayLabel, sampleForThemeCategory, sampleNoForKey, sampleNoLabel, samples, sampleTitle, sanitizeExcludeTerm, sanitizeExcludeTermDetail, sanitizeFinalQueryForXApi, sanitizeHashtag, sanitizeHashtagDetail, sanitizeXQueryPhrase, sanitizeXQueryTerm, scoreAxisHeader, scoreByAxisKeywords, scoreDisplayModeLabel, scoreFromRow, scoreLevelLabel, scoreMeta, scoreOpinion, selectDisplayScoreMode, selectedHashtagsBase, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MAX_VIEWPORT_RATIO, SIDEBAR_MIN_WIDTH, SIDEBAR_WIDTH_STORAGE_KEY, sidebarMaxWidth, sortRows, splitQueryTerms, splitWords, spreadTemplateTokens, stableNoise, STAGED_FETCH_DEFAULT_STAGES, STAGED_FETCH_INITIAL_COUNT, stagedFetchActionLabel, stopReasonLabel, stripAxisPrefix, stripRtPrefix, stripUrls, stripXCommonFilters, textsFromPosts, truncateText, uniqueByValue, uniqueValues, UNSAFE_EXCLUDE_TERM_PATTERN, USER_INPUT_SAMPLE_KEY, USER_INPUT_SAMPLE_LABEL, VIEW_MODE_STORAGE_KEY, voiceDirectionLabel, VOLUME_COLOR_SCALE, waitForNextPaint, withClusterVolume, withScoreMeta, wordsInText, writeDatasetHistory, X_DATASET_HISTORY_STORAGE_KEY } from "./app/appSupport.jsx";
import { DEFAULT_PERSONA_A_VOICE_DIRECTIONS, JP_UI_LABELS, VOICE_DIRECTION_OPTIONS, ZONE12_FILTERS } from "./data/uiLabels.js";
import { AUTO_SUMMARY_LIMIT_OPTIONS, AXIS_PRESETS, CLUSTER_THRESHOLD_OPTIONS, DEFAULT_X_QUERY_FILTERS, PERSONA_CONFIGS, SEMANTIC_THRESHOLD_OPTIONS } from "./data/userModeConfig.js";
import GuidePage from "./components/GuidePage.jsx";
import ModeNav from "./components/ModeNav.jsx";
import { createAnalysisMarkdown } from "./analysis/createAnalysisMarkdown.js";
import { createDashboardController } from "./dashboard/createDashboardController.jsx";
import { useResizableDashboardLayout } from "./dashboard/useResizableDashboardLayout.js";
import { createOpinionClassification } from "./classification/createOpinionClassification.js";
import { createNoiseProcessingModel } from "./classification/noiseProcessing.js";
import { createWeakNoiseStageLog } from "./diagnostics/createWeakNoiseStageLog.js";
import { createGraphViewModel } from "./graph/createGraphViewModel.js";
import { usePlotlyGraphRenderer } from "./graph/usePlotlyGraphRenderer.js";
import { createScoringModel } from "./scoring/scoringModel.js";
import { useAppLifecycleEffects } from "./hooks/useAppLifecycleEffects.js";
import { modeResultInputKey, stableHash } from "./hooks/useInputIdentity.js";
import { useResultSlots } from "./hooks/useResultSlots.js";
import { BEGINNER_OPINION_CATEGORIES, buildBeginnerXQuery } from "./modes/beginner/beginnerAnalysis.js";
import { createBeginnerModeController } from "./modes/beginner/createBeginnerModeController.js";
import { runBeginnerMode } from "./modes/beginner/runBeginnerMode.js";
import AiDraftPanel from "./modes/user/AiDraftPanel.jsx";
import { createUserModeController } from "./modes/user/createUserModeController.js";
import { createUserPagePayload } from "./modes/user/createUserPagePayload.js";
import { createAutoUserFetchResultSnapshot } from "./results/applyFetchedResultModel.js";
import { applyFetchedXPostsToState, prepareXFetchState } from "./results/resultApplicationController.js";
import BeginnerModePage from "./pages/BeginnerModePage.jsx";
import { usePublishController } from "./publish/usePublishController.jsx";
import { runAdditionalSourceFetchWorkflow } from "./sourceAdapters/additionalSourceFetchWorkflow.js";
import { runContinueSourceFetchWorkflow } from "./sourceAdapters/continueSourceFetchWorkflow.js";
import { runNormalSourceFetchWorkflow } from "./sourceAdapters/normalSourceFetchWorkflow.js";
import { createSourceWorkflowDependencies } from "./sourceAdapters/sourceFetchRequestModel.js";
import { createIdleSourceFetchDebug } from "./sourceAdapters/sourceFetchTypes.js";
import { runAutoUserStagedSourceFetchWorkflow, runDiagnosticStagedSourceFetchWorkflow } from "./sourceAdapters/stagedSourceFetchWorkflow.js";
import { SOURCE_TYPES } from "./sourceAdapters/sourceTypes.js";
import { validateXFetchRequest } from "./sourceAdapters/xFetchOrchestrator.js";
import { buildUserFeedback, createZone11ViewModel } from "./zones/createZone11ViewModel.js";
import { createZone12ViewModel } from "./zones/createZone12ViewModel.jsx";
import "./App.css";
export function useAppController() {
  // Section: Mode, persona, and primary input state
  const [appMode, setAppMode] = useState(() =>
    typeof window === "undefined" ? "beginner" : appModeFromPathname(window.location.pathname)
  );
  const [sampleKey, setSampleKey] = useState("housing");
  const [personaMode, setPersonaMode] = useState("dev");
  const [personaModeHistory, setPersonaModeHistory] = useState([]);
  const [analysisPurposeMode, setAnalysisPurposeMode] = useState(() => defaultAnalysisPurposeForPersona("dev"));
  const [hasManualVoiceDirectionSelection, setHasManualVoiceDirectionSelection] = useState(false);
  const [selectedVoiceDirections, setSelectedVoiceDirections] = useState(DEFAULT_PERSONA_A_VOICE_DIRECTIONS);
  const [selectedDemoSampleKey, setSelectedDemoSampleKey] = useState("housing");
  const [viewMode, setViewMode] = useState(() => {
    if (PUBLIC_PREVIEW_MODE) {
      return "user";
    }

    if (typeof window === "undefined") {
      return "user";
    }

    if (window.location.pathname === "/developer") {
      return "developer";
    }
    if (window.location.pathname === "/user") {
      return "user";
    }

    const savedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return savedMode === "developer" ? "developer" : "user";
  });
  const [isXDatasetHistoryExpanded, setIsXDatasetHistoryExpanded] = useState(false);
  // These shared input fields are the canonical session input used by User and Developer modes.
  // Beginner mode has draft inputs below, but those draft values are synchronized into this pair.
  const [theme, setTheme] = useState(samples.housing.theme);
  const [userOpinion, setUserOpinion] = useState(samples.housing.userOpinion.text);
  const [externalOpinions, setExternalOpinions] = useState(
    samples.housing.externalOpinions.map((item) => item.text).join("\n")
  );
  // Beginner inputs are editable drafts. handleBeginnerRun promotes trimmed values to theme/userOpinion.
  const [beginnerThemeInput, setBeginnerThemeInput] = useState("学校の宿題は必要か");
  const [beginnerOpinionInput, setBeginnerOpinionInput] = useState("宿題は必要だが、量が多すぎると逆効果だと思う");

  // Section: Beginner mode result state
  const [beginnerStatus, setBeginnerStatus] = useState("idle");
  const [beginnerMessage, setBeginnerMessage] = useState("");
  const [beginnerResult, setBeginnerResult] = useState(null);
  const [beginnerXFetchDebug, setBeginnerXFetchDebug] = useState(createIdleSourceFetchDebug({
    sourceType: SOURCE_TYPES.X,
    requested: BEGINNER_FIXED_X_COUNT,
  }));
  // Section: Graph, clustering, and summary state
  const [originCentered, setOriginCentered] = useState(false);
  const [graphMode, setGraphMode] = useState("raw");
  const [clusterThreshold, setClusterThreshold] = useState(0.35);
  const [clusterMethod, setClusterMethod] = useState("text");
  const [semanticThreshold, setSemanticThreshold] = useState(0.78);
  const [semanticClusterRows, setSemanticClusterRows] = useState([]);
  const [semanticClusterStatus, setSemanticClusterStatus] = useState("");
  const [semanticClusterError, setSemanticClusterError] = useState("");
  const [isSemanticClusterLoading, setIsSemanticClusterLoading] = useState(false);
  const [expandedClusterIds, setExpandedClusterIds] = useState({});
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [clusterSummaries, setClusterSummaries] = useState({});
  const [isClusterSummaryLoadingById, setIsClusterSummaryLoadingById] = useState({});
  const [clusterSummaryErrorById, setClusterSummaryErrorById] = useState({});
  const [autoSummaryLimit, setAutoSummaryLimit] = useState(10);
  const [isAutoSummarizing, setIsAutoSummarizing] = useState(false);
  const [autoSummaryStatus, setAutoSummaryStatus] = useState("未実行");
  const [autoSummaryError, setAutoSummaryError] = useState("");
  const [autoSummaryProgress, setAutoSummaryProgress] = useState({ completed: 0, total: 0, success: 0, failed: 0 });

  // Section: Dataset history, operation status, and publish panel state
  const [datasetHistory, setDatasetHistory] = useState({ datasets: [] });
  const [activeDatasetId, setActiveDatasetId] = useState("");
  const [activeClusterRunId, setActiveClusterRunId] = useState("");
  const [xDataStatus, setXDataStatus] = useState("sample");
  const [historyStatus, setHistoryStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [operationStatus, setOperationStatus] = useState(() => createInitialOperationStatus());
  const [toast, setToast] = useState(null);
  const {
    publishStatus,
    renderLocalPublishPanel,
  } = usePublishController({
    apiBaseUrl: API_BASE_URL,
    isAvailable: LOCAL_PUBLISH_AVAILABLE,
    setToast,
  });

  // Section: Query, filtering, and X fetch state
  const [queryDirty, setQueryDirty] = useState(false);
  const [scoreDisplayMode, setScoreDisplayMode] = useState("relative");
  const [isNoiseFilteringDisabled, setIsNoiseFilteringDisabled] = useState(false);
  const [noiseRelevanceThreshold, setNoiseRelevanceThreshold] = useState(NOISE_RELEVANCE_THRESHOLD);
  const [sortKey, setSortKey] = useState("z");
  const [sortDirection, setSortDirection] = useState("desc");
  const [zone12Filter, setZone12Filter] = useState("all");
  const [xQueryBase, setXQueryBase] = useState(samples.housing.xQueryCandidates[0].base);
  const [xQueryFilters, setXQueryFilters] = useState(DEFAULT_X_QUERY_FILTERS);
  const [xQuery, setXQuery] = useState(buildXQuery(samples.housing.xQueryCandidates[0].base, DEFAULT_X_QUERY_FILTERS));
  const [selectedXQueryCandidateIds, setSelectedXQueryCandidateIds] = useState(
    samples.housing.xQueryCandidates.map((candidate) => candidate.label)
  );
  const [selectedHashtagCandidates, setSelectedHashtagCandidates] = useState([]);
  const [hasManualHashtagSelection, setHasManualHashtagSelection] = useState(false);
  const [selectedExcludeTermCandidates, setSelectedExcludeTermCandidates] = useState([]);
  const [hasManualExcludeTermSelection, setHasManualExcludeTermSelection] = useState(false);
  const [generatedXQueryCandidates, setGeneratedXQueryCandidates] = useState(null);
  const [generatedBasicKeywords, setGeneratedBasicKeywords] = useState([]);
  const [generatedAxisLinkedKeywords, setGeneratedAxisLinkedKeywords] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiDraftStatus, setAiDraftStatus] = useState("");
  const [aiDraftError, setAiDraftError] = useState("");
  const [aiDraftErrorDetails, setAiDraftErrorDetails] = useState(null);
  const [aiDraftMode, setAiDraftMode] = useState("idle");
  const [isAiDraftApplied, setIsAiDraftApplied] = useState(false);
  const [aiDraftApiHealth, setAiDraftApiHealth] = useState({
    status: "unknown",
    label: "未確認",
    details: "",
  });
  const [isAiDraftLoading, setIsAiDraftLoading] = useState(false);
  const [aiDraftInitialQuestions, setAiDraftInitialQuestions] = useState([]);
  const [isManualXQuery, setIsManualXQuery] = useState(false);
  const [xMaxResults, setXMaxResults] = useState(100);
  const [sourceStatus, setSourceStatus] = useState("");
  const [sourcePosts, setSourcePosts] = useState([]);
  const xStatus = sourceStatus;
  const xPosts = sourcePosts;
  const setXStatus = setSourceStatus;
  const setXPosts = setSourcePosts;
  const [stagedFetchState, setStagedFetchState] = useState(() => createInitialStagedFetchState());
  const [analysisMode, setAnalysisMode] = useState("exploratory");
  const [selectedAxisLinkedKeywords, setSelectedAxisLinkedKeywords] = useState([]);
  const [axisConfig, setAxisConfig] = useState(() => createThemeAxisConfig(samples.housing));
  const [draftAxisConfig, setDraftAxisConfig] = useState(() => createThemeAxisConfig(samples.housing));
  const [axisLowDescriptionAutoGenerated, setAxisLowDescriptionAutoGenerated] = useState(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
  const [axisStatus, setAxisStatus] = useState("");
  const [hasScoredWithCurrentAxis, setHasScoredWithCurrentAxis] = useState(true);

  const {
    dashboardActionHeight,
    dashboardActionPanelRef,
    dashboardHeight,
    dashboardLeftWidth,
    dashboardPanelRef,
    dashboardStatusHeight,
    dashboardStatusPanelRef,
    setDashboardResizeTarget,
    setIsDashboardResizing,
    setIsSidebarResizing,
    sidebarWidth,
  } = useResizableDashboardLayout();

  const plot3dRef = useRef(null);
  const plot2dRef = useRef(null);
  const userOpinionTextareaRef = useRef(null);
  const xFetchAbortControllerRef = useRef(null);
  const autoSummaryAbortControllerRef = useRef(null);
  const autoSummaryStopRequestedRef = useRef(false);

  const isSampleSession = Boolean(samples[sampleKey]);
  const contentThemeCategory = useMemo(
    () => inferTopicKey("", theme, userOpinion),
    [theme, userOpinion]
  );
  const currentSample = isSampleSession
    ? samples[sampleKey]
    : sampleForThemeCategory(contentThemeCategory, samples.housing);
  const currentSessionSampleLabel = isSampleSession ? sampleDisplayLabel(sampleKey) : USER_INPUT_SAMPLE_LABEL;
  const currentPersonaConfig = personaConfigFor(personaMode);
  const currentAnalysisPurposeConfig = analysisPurposeConfigFor(analysisPurposeMode, personaMode);
  const themeCategory = useMemo(
    () => getThemeCategory(isSampleSession ? sampleKey : "", theme, userOpinion),
    [isSampleSession, sampleKey, theme, userOpinion]
  );
  const currentAxisSample = isSampleSession ? currentSample : samples[themeCategory] || null;
  // Result slots are keyed by the current input identity. Keep this identity aligned with inputKeyForValues.
  // A stale slot can stay in state, but active*Slot must hide it once theme/opinion/purpose/persona/category changes.
  const currentModeInputKey = useMemo(
    () =>
      modeResultInputKey({
        theme,
        userOpinion,
        purpose: analysisPurposeMode,
        persona: personaMode,
        category: themeCategory,
      }),
    [theme, userOpinion, analysisPurposeMode, personaMode, themeCategory]
  );
  const {
    beginnerResultSlot,
    userResultSlot,
    setBeginnerResultSlot,
    setUserResultSlot,
    activeBeginnerResultSlot,
    activeUserResultSlot,
  } = useResultSlots(currentModeInputKey);
  const themeQueryCandidates = useMemo(
    () => getThemeQueryCandidates(theme, themeCategory, isSampleSession ? currentSample : null),
    [theme, themeCategory, isSampleSession, currentSample]
  );
  const personaAQueryCandidates = useMemo(
    () =>
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : null,
    [personaMode, themeCategory, selectedVoiceDirections, analysisPurposeMode]
  );
  const axisLabels = useMemo(
    () => ({
      x: axisLabel("x", axisConfig),
      y: axisLabel("y", axisConfig),
      z: axisLabel("z", axisConfig),
    }),
    [axisConfig]
  );
  const xQueryCandidates = (generatedXQueryCandidates ?? personaAQueryCandidates ?? themeQueryCandidates ?? currentSample.xQueryCandidates ?? [])
    .filter((candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.base || ""} ${candidate?.query || ""}`));
  const hashtagCandidates = useMemo(
    () => buildHashtagCandidates(sampleKey, theme, userOpinion, stagedFetchState.aiQueryAdvice, personaMode, analysisPurposeMode),
    [sampleKey, theme, userOpinion, stagedFetchState.aiQueryAdvice, personaMode, analysisPurposeMode]
  );
  const excludeTermCandidates = useMemo(
    () => buildExcludeTermCandidates(sampleKey, theme, userOpinion, stagedFetchState.noiseBreakdown, personaMode, analysisPurposeMode),
    [sampleKey, theme, userOpinion, stagedFetchState.noiseBreakdown, personaMode, analysisPurposeMode]
  );
  const selectedXQueryCandidates = useMemo(() => {
    const selectedSet = new Set(selectedXQueryCandidateIds);

    return xQueryCandidates.filter((candidate) => selectedSet.has(candidate.label));
  }, [xQueryCandidates, selectedXQueryCandidateIds]);
  const selectedHashtagValues = useMemo(
    () =>
      hashtagCandidates
        .filter((candidate) => selectedHashtagCandidates.includes(candidate.hashtag))
        .map((candidate) => candidate.hashtag),
    [hashtagCandidates, selectedHashtagCandidates]
  );
  const autoSelectedHashtagValues = useMemo(
    () =>
      hashtagCandidates
        .filter((candidate) => candidate.selectionType !== "disabled")
        .map((candidate) => candidate.hashtag),
    [hashtagCandidates]
  );
  const selectedExcludeTermValues = useMemo(
    () =>
      excludeTermCandidates
        .filter((candidate) =>
          hasManualExcludeTermSelection
            ? selectedExcludeTermCandidates.includes(candidate.term)
            : true
        )
        .map((candidate) => candidate.term),
    [excludeTermCandidates, selectedExcludeTermCandidates, hasManualExcludeTermSelection]
  );
  const axisLinkedKeywords = useMemo(() => {
    if (generatedAxisLinkedKeywords) {
      const x = Array.isArray(generatedAxisLinkedKeywords.x) ? generatedAxisLinkedKeywords.x : [];
      const y = Array.isArray(generatedAxisLinkedKeywords.y) ? generatedAxisLinkedKeywords.y : [];
      const z = Array.isArray(generatedAxisLinkedKeywords.z) ? generatedAxisLinkedKeywords.z : [];

      return {
        x,
        y,
        z,
        all: uniqueValues([...x, ...y, ...z]),
      };
    }

    return generateAxisLinkedKeywords(axisConfig);
  }, [axisConfig, generatedAxisLinkedKeywords]);
  const effectiveQuery = useMemo(
    () =>
      buildQueryWithAxisKeywords(
        buildCombinedXQuery(xQueryCandidates, selectedXQueryCandidateIds, xQueryFilters, xQuery),
        selectedAxisLinkedKeywords,
        xQueryFilters,
        selectedHashtagValues,
        selectedExcludeTermValues
      ),
    [
      xQueryCandidates,
      selectedXQueryCandidateIds,
      xQueryFilters,
      xQuery,
      selectedAxisLinkedKeywords,
      selectedHashtagValues,
      selectedExcludeTermValues,
    ]
  );
  const queryAxisWarnings = useMemo(
    () => buildQueryAxisWarnings(axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode),
    [axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode]
  );
  const safeQueryPreview = useMemo(
    () =>
      buildSafeXQueryFromRaw(effectiveQuery, {
        sampleKey: themeCategory,
        theme,
        userOpinion,
        personaMode,
        analysisPurposeMode,
        hashtags: selectedHashtagValues,
        excludeTerms: selectedExcludeTermValues,
      }),
    [effectiveQuery, themeCategory, theme, userOpinion, personaMode, analysisPurposeMode, selectedHashtagValues, selectedExcludeTermValues]
  );
  const queryReviewParts = useMemo(() => {
    const parts = safeQueryPreview.queryParts || {};
    return {
      analysisPurposeLabel: currentAnalysisPurposeConfig.label,
      inputSourceLabel: currentInputSourceLabel(),
      retrievalPolicy: currentAnalysisPurposeConfig.retrievalPolicy,
      clusterPolicy: currentAnalysisPurposeConfig.clusterPolicy,
      zone11Policy: currentAnalysisPurposeConfig.zone11Policy,
      includeTerms: (parts.includeTerms || []).filter((item) => !looksLikeMojibake(item)),
      includeHashtags: (parts.includeHashtags || []).filter((item) => !looksLikeMojibake(item)),
      excludeTerms: (parts.excludeTerms || []).filter((item) => !looksLikeMojibake(item)),
      cautionTerms: hashtagCandidates
        .filter((candidate) => candidate.selectionType === "caution")
        .map((candidate) => candidate.hashtag)
        .concat(parts.cautionTerms || [])
        .filter((item) => !looksLikeMojibake(item)),
      disabledTerms: hashtagCandidates
        .filter((candidate) => candidate.selectionType === "disabled")
        .map((candidate) => candidate.hashtag)
        .concat(parts.disabledTerms || [])
        .filter((item) => !looksLikeMojibake(item)),
      finalQueryForXApi: safeRuntimeText(parts.finalQueryForXApi || safeQueryPreview.finalQueryForXApi || "", viewMode),
    };
  }, [safeQueryPreview, hashtagCandidates, viewMode, currentAnalysisPurposeConfig, xPosts.length, xDataStatus, externalOpinions]);
  const isEffectiveQueryTooLong = effectiveQuery.length > 450;
  const activeDataset = useMemo(
    () => datasetHistory.datasets.find((dataset) => dataset.datasetId === activeDatasetId) || null,
    [datasetHistory, activeDatasetId]
  );
  const activeClusterRun = useMemo(
    () => activeDataset?.clusterRuns?.find((run) => run.runId === activeClusterRunId) || null,
    [activeDataset, activeClusterRunId]
  );
  const datasetThemeMismatch = Boolean(activeDataset?.theme && activeDataset.theme !== theme);
  const datasetUserOpinionMismatch = Boolean(
    activeDataset?.userOpinion && activeDataset.userOpinion !== userOpinion
  );
  const activeDatasetMatchesCurrent = Boolean(
    activeDataset &&
      (activeDataset.theme || "") === (theme || "") &&
      (activeDataset.userOpinion || "") === (userOpinion || "") &&
      (Array.isArray(activeDataset.externalOpinions) ? activeDataset.externalOpinions.join("\n") : "") === externalOpinions
  );
  const currentOpinionCount = externalOpinions
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean).length;
  const noiseFilteringEnabled = viewMode !== "developer" || !isNoiseFilteringDisabled;
  const stagedFetchEnabled = viewMode !== "developer" || stagedFetchState.enabled;
  const currentDatasetHash = useMemo(
    () =>
      stableHash({
        sampleKey,
        theme,
        userOpinion,
        analysisPurposeMode,
        selectedVoiceDirections,
        effectiveQuery,
        externalOpinions,
        axisConfig,
        selectedXQueryCandidateIds,
        xMaxResults,
        stagedFetchEnabled,
        queryDiagnosisStatus: stagedFetchState.diagnosisStatus,
        noiseRelevanceThreshold,
      }),
    [sampleKey, theme, userOpinion, analysisPurposeMode, selectedVoiceDirections, effectiveQuery, externalOpinions, axisConfig, selectedXQueryCandidateIds, xMaxResults, stagedFetchEnabled, stagedFetchState.diagnosisStatus, noiseRelevanceThreshold]
  );
  const hasFetchedExternalData = Boolean(
    externalOpinions.trim() &&
      (xDataStatus === "unsaved" || xDataStatus === "cached" || (viewMode === "developer" && xDataStatus === "sample"))
  );
  const axisDirty = !hasScoredWithCurrentAxis;
  const canRescoreWithCurrentAxis = hasFetchedExternalData && axisDirty;
  const rescoreButtonText = !hasFetchedExternalData
    ? "外部意見を取得後に再スコアリングできます"
    : !axisDirty
      ? "評価軸は現在のスコアに反映済みです"
      : "現在の評価軸で再スコアリング";
  useAppLifecycleEffects({
    checkAnalysisDraftHealth,
    clusterMethod,
    graphMode,
    setAppMode,
    setClusterMethod,
    setDatasetHistory,
    setGraphMode,
    setToast,
    setViewMode,
    toast,
    userOpinion,
    userOpinionTextareaRef,
    viewMode,
  });

  function loadSample(key) {
    const nextSample = samples[key];
    if (!nextSample) {
      return;
    }
    const nextThemeCategory = getThemeCategory(key, nextSample.theme, nextSample.userOpinion.text);
    const nextVoiceDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(analysisPurposeMode, personaMode);
    const nextThemeQueries =
      personaMode === "personaA" && nextThemeCategory === "romance"
        ? getPersonaAQueryCandidates(nextVoiceDirections, analysisPurposeMode)
        : getThemeQueryCandidates(nextSample.theme, nextThemeCategory, nextSample);
    const nextPurposeTags =
      personaMode === "personaA" && nextThemeCategory === "romance" && !hasManualHashtagSelection
        ? purposeHashtags(analysisPurposeMode, personaMode)
        : [];
    const firstCandidate = nextThemeQueries?.[0];
    const nextBase = firstCandidate?.base || firstCandidate?.query || "";
    const nextFilters = { ...DEFAULT_X_QUERY_FILTERS };
    const nextAxisConfig = getThemeAxisPreset(nextSample.theme, nextThemeCategory, nextSample);

    setSampleKey(key);
    setSelectedVoiceDirections(nextVoiceDirections);
    setTheme(nextSample.theme);
    setUserOpinion(nextSample.userOpinion.text);
    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setAxisStatus("テーマに合わせた評価軸に切り替えました。利用目的は出力の見せ方に反映します。");
    setHasScoredWithCurrentAxis(true);
    setAnalysisMode("exploratory");
    setSelectedAxisLinkedKeywords([]);
    setExternalOpinions(nextSample.externalOpinions.map((item) => item.text).join("\n"));
    setGraphMode("raw");
    setScoreDisplayMode("relative");
    setIsNoiseFilteringDisabled(false);
    setClusterThreshold(0.35);
    setClusterMethod("text");
    setSemanticThreshold(0.78);
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setIsSemanticClusterLoading(false);
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus("sample");
    setHistoryStatus("");
    setCopyStatus("");
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setAiDraft(null);
    setIsAiDraftApplied(false);
    setAiDraftStatus("");
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("idle");
    setAiDraftInitialQuestions([]);
    setSelectedXQueryCandidateIds(nextThemeQueries.map((candidate) => candidate.label));
    setSelectedHashtagCandidates(nextPurposeTags);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setXQueryBase(nextBase);
    setXQueryFilters(nextFilters);
    setXQuery(buildXQuery(nextBase, nextFilters));
    setIsManualXQuery(false);
    setXStatus("");
    setXPosts([]);
    setBeginnerResult(null);
    setBeginnerStatus("idle");
    setBeginnerMessage("");
    setBeginnerResultSlot(null);
    setUserResultSlot(null);
    setStagedFetchState(createInitialStagedFetchState());
  }

  function applySelectedDemoSample() {
    const shouldConfirm = Boolean(theme.trim() || userOpinion.trim() || externalOpinions.trim());

    if (
      shouldConfirm &&
      !window.confirm("サンプルを反映すると、現在のテーマ・自分の意見・検索候補・評価軸が上書きされます。よろしいですか？")
    ) {
      return;
    }

    loadSample(selectedDemoSampleKey);
  }

  function normalizeAiDraftCandidates(candidates) {
    return (Array.isArray(candidates) ? candidates : [])
      .map((candidate, index) => {
        const label = String(candidate?.label || `AI候補${index + 1}`).trim();
        const base = bindGenericQueryToTheme(candidate?.query || candidate?.base || "", theme, userOpinion);

        return {
          id: String(candidate?.id || `ai-${index + 1}`).trim(),
          label,
          base,
          query: buildXQuery(base, DEFAULT_X_QUERY_FILTERS),
          note: String(candidate?.description || candidate?.note || "").trim(),
          description: String(candidate?.description || candidate?.note || "").trim(),
        };
      })
      .filter((candidate) => candidate.label && candidate.base)
      .filter((candidate) => !looksLikeMojibake(`${candidate.label} ${candidate.description} ${candidate.base} ${candidate.query}`));
  }

  function resetUserInputArea() {
    if (
      !window.confirm(
        "現在のテーマ、自分の意見、検索クエリ、評価軸候補を空欄にします。保存済みデータは削除されません。よろしいですか？"
      )
    ) {
      return;
    }

    const emptyAxisConfig = normalizeAxisConfig(
      {
        presetKey: "custom",
        x: { label: "", description: "", highDescription: "", lowDescription: "" },
        y: { label: "", description: "", highDescription: "", lowDescription: "" },
        z: { label: "", description: "", highDescription: "", lowDescription: "" },
      },
      currentSample
    );

    setTheme("");
    setUserOpinion("");
    setExternalOpinions("");
    setXPosts([]);
    setXQueryBase("");
    setXQuery("");
    setXQueryFilters({ ...DEFAULT_X_QUERY_FILTERS });
    setSelectedXQueryCandidateIds([]);
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setHasManualVoiceDirectionSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedXQueryCandidates([]);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setAiDraft(null);
    setIsAiDraftApplied(false);
    setAiDraftStatus("");
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("idle");
    setAiDraftInitialQuestions([]);
    setAxisConfig(emptyAxisConfig);
    setDraftAxisConfig(emptyAxisConfig);
    setAxisStatus("未設定です。テーマと自分の意見を入力し、「AIで評価軸を設定」を押してください。");
    setHasScoredWithCurrentAxis(false);
    setGraphMode("raw");
    setScoreDisplayMode("relative");
    setIsNoiseFilteringDisabled(false);
    setClusterMethod("text");
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus("empty");
    setHistoryStatus("ユーザー入力欄をリセットしました。保存済みXデータは削除していません。");
    setXStatus("");
    setBeginnerResult(null);
    setBeginnerStatus("idle");
    setBeginnerMessage("");
    setBeginnerResultSlot(null);
    setUserResultSlot(null);
    setStagedFetchState(createInitialStagedFetchState());
  }

  function resetMojibakeRuntimeData() {
    const normalizedDirections = purposeVoiceDirections(analysisPurposeMode, personaMode);
    const cleanQueryCandidates =
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(normalizedDirections, analysisPurposeMode)
        : getThemeQueryCandidates(theme, themeCategory, isSampleSession ? currentSample : null);
    const firstCandidate = cleanQueryCandidates[0];
    const nextBase = firstCandidate?.base || firstCandidate?.query || sanitizeXQueryPhrase(theme) || "意見";
    const migratedHistory = migrateAppStateFromMojibake(datasetHistory);

    setSelectedVoiceDirections(normalizedDirections);
    setHasManualVoiceDirectionSelection(false);
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setSelectedXQueryCandidateIds(cleanQueryCandidates.map((candidate) => candidate.label));
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setXQueryBase(nextBase);
    setXQuery(buildXQuery(nextBase, DEFAULT_X_QUERY_FILTERS));
    setXQueryFilters({ ...DEFAULT_X_QUERY_FILTERS });
    setStagedFetchState((previous) => ({
      ...previous,
      stageLogs: (previous.stageLogs || []).map(migrateStageLogFromMojibake),
      improvedQueryCandidates: (previous.improvedQueryCandidates || []).filter(
        (candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.base || ""} ${candidate?.query || ""}`)
      ),
      recommendedQuery: looksLikeMojibake(previous.recommendedQuery) ? "" : previous.recommendedQuery,
      beforeQuery: looksLikeMojibake(previous.beforeQuery) ? "" : previous.beforeQuery,
      afterQuery: looksLikeMojibake(previous.afterQuery) ? "" : previous.afterQuery,
      message: "文字化けデータをリセットしました。",
    }));
    persistDatasetHistory(migratedHistory);
    setHistoryStatus("文字化けデータをリセットしました。");
    setXStatus("検索条件を安全な形に再作成しました。");
    notify("success", "文字化けデータをリセットしました");
  }

  // Section: Input, theme, and AI draft handlers
  function handleThemeChange(nextTheme) {
    const nextThemeCategory = getThemeCategory("", nextTheme, userOpinion);
    const nextThemeAxisConfig = getThemeAxisPreset(nextTheme, nextThemeCategory, samples[nextThemeCategory] || null);
    const nextThemeQueries =
      personaMode === "personaA" && nextThemeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : getThemeQueryCandidates(nextTheme, nextThemeCategory, null);
    const nextPurposeTags =
      personaMode === "personaA" && nextThemeCategory === "romance" && !hasManualHashtagSelection
        ? purposeHashtags(analysisPurposeMode, personaMode)
        : [];
    const firstCandidate = nextThemeQueries[0];
    const nextBaseQuery = firstCandidate?.base || firstCandidate?.query || "";

    setSampleKey(USER_INPUT_SAMPLE_KEY);
    setTheme(nextTheme);
    setAxisConfig(nextThemeAxisConfig);
    setDraftAxisConfig(nextThemeAxisConfig);
    setAxisStatus("テーマ変更に合わせて評価軸を更新しました。利用目的は出力の見せ方に反映します。");
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setSelectedXQueryCandidateIds(nextThemeQueries.map((candidate) => candidate.label));
    setSelectedHashtagCandidates(nextPurposeTags);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setSelectedAxisLinkedKeywords([]);
    setXQueryBase(nextBaseQuery);
    setXQuery(buildXQuery(nextBaseQuery, xQueryFilters));
    setIsManualXQuery(false);
    setQueryDirty(true);
    setHasScoredWithCurrentAxis(false);
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus(externalOpinions.trim() ? "unsaved" : "sample");
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setXStatus("テーマ変更に合わせて、検索候補とハッシュタグ候補をテーマ優先で更新しました。");
  }

  async function checkAnalysisDraftHealth() {
    setAiDraftApiHealth({
      status: "checking",
      label: "確認中",
      details: "",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis-draft/health`);
      const parsed = await parseJsonResponse(response);

      if (!parsed.ok) {
        setAiDraftApiHealth({
          status: "error",
          label: "エラー",
          details: `${parsed.errorType ? `[${parsed.errorType}] ` : ""}${parsed.error}${
            parsed.details ? ` / ${parsed.details}` : ""
          }`,
        });
        return;
      }

      setAiDraftApiHealth({
        status: parsed.data?.openaiConfigured ? "ready" : "missing-key",
        label: parsed.data?.openaiConfigured ? "利用可能" : "APIキー未設定",
        details: parsed.data?.openaiConfigured
          ? `model: ${parsed.data.model || "unknown"}`
          : parsed.data?.error || "OPENAI_API_KEY が未設定です。",
      });

      if (parsed.data?.openaiConfigured) {
        setAiDraftError("");
        setAiDraftErrorDetails(null);
        if (aiDraftMode === "fallback") {
          setAiDraftMode("idle");
          setAiDraftStatus("");
        }
      }
    } catch (error) {
      setAiDraftApiHealth({
        status: "disconnected",
        label: "server.js未接続",
        details: error.message || "server.jsが起動していない可能性があります。",
      });
    }
  }

  async function handleGenerateAnalysisDraft() {
    if (!theme.trim() || !userOpinion.trim()) {
      setAiDraftError("テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。");
      setAiDraftErrorDetails(null);
      setAiDraftMode("idle");
      setOperationError("aiAxisDraft", "テーマと自分の意見を入力してください。");
      return;
    }

    setOperationRunning("aiAxisDraft", "AIで評価軸候補を作成中...", truncateText(theme, 80));
    setIsAiDraftLoading(true);
    setIsAiDraftApplied(false);
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("loading");
    setAiDraftStatus("AIで評価軸・検索クエリ候補を仮生成しています...");

    const requestPayload = {
      theme,
      themeCategory,
      userOpinion,
      analysisMode,
      personaMode,
      personaLabel: currentPersonaConfig.label,
      analysisPurposeMode,
      analysisPurposeLabel: currentAnalysisPurposeConfig.label,
      currentAxisConfig: axisConfig,
      draftAxisConfig,
      previousAxisCandidate: aiDraft?.axisConfig || null,
      regenerateInstruction: aiDraft
        ? "前回候補と違う切り口を少なくとも1つ入れてください。生活実感、構造、未来性、具体性、感情のいずれかの観点を前回より変えてください。"
        : "",
    };

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/analysis-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
    } catch (error) {
      const fallbackDraft = createFallbackAnalysisDraft(theme, userOpinion, personaMode, currentAxisSample);

      setAiDraft(fallbackDraft);
      setAiDraftInitialQuestions(fallbackDraft.initialQuestions);
      setAiDraftError("AI生成APIに接続できませんでした。簡易ルールで仮設定を作成しました。");
      setAiDraftErrorDetails({
        status: "network",
        code: "AI_DRAFT_NETWORK_ERROR",
        errorType: "server_not_ready",
        details: error.message || "server.jsが起動していない、またはAPIに接続できない可能性があります。",
      });
      setAiDraftStatus("AI生成に失敗したため、簡易ルールで仮設定を表示しています。この設定は後から自由に編集できます。");
      setAiDraftMode("fallback");
      setOperationError("aiAxisDraft", `AI評価軸生成に失敗しました。理由：${error.message || "不明"}`);
      setIsAiDraftLoading(false);
      return;
    }

    try {
      const parsed = await parseJsonResponse(response);

    if (!parsed.ok || parsed.data?.ok === false) {
      const fallbackDraft = createFallbackAnalysisDraft(theme, userOpinion, personaMode, currentAxisSample);
      const latestError = parsed.data?.message || parsed.data?.error || parsed.error || "AI生成に失敗しました。";
      const latestDetails = parsed.data?.details || parsed.details || "";

      setAiDraft(fallbackDraft);
      setAiDraftInitialQuestions(fallbackDraft.initialQuestions);
      setAiDraftError(`AI生成に失敗しました。${latestError}`);
      setAiDraftErrorDetails({
        status: parsed.data?.status || parsed.status,
        code: parsed.data?.code || parsed.code,
        errorType: parsed.data?.errorType || parsed.errorType || "api_error",
        details: latestDetails,
      });
      setAiDraftStatus("AI生成に失敗したため、簡易ルールで仮設定を表示しています。この設定は後から自由に編集できます。");
      setAiDraftMode("fallback");
      setOperationError("aiAxisDraft", `AI生成に失敗しました。${latestError}`);
      setIsAiDraftLoading(false);
      return;
    }

    const payload = parsed.data;
    setAiDraft(payload);
    setAiDraftInitialQuestions(Array.isArray(payload.initialQuestions) ? payload.initialQuestions : []);
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftStatus("AI仮生成が完了しました。内容を確認して「このAI候補を適用」を押してください。");
    setAiDraftMode("success");
    setOperationSuccess("aiAxisDraft", "AI評価軸候補を作成しました。", truncateText(theme, 80));
    setIsAiDraftLoading(false);
    return;
  } catch (error) {
    const fallbackDraft = createFallbackAnalysisDraft(theme, userOpinion, personaMode, currentAxisSample);

    setAiDraft(fallbackDraft);
    setAiDraftInitialQuestions(fallbackDraft.initialQuestions);
    setAiDraftError(`AI生成結果の反映中にエラーが発生しました。${error.message || ""}`);
    setAiDraftErrorDetails({
      status: "frontend",
      code: "AI_DRAFT_FRONTEND_ERROR",
      errorType: "frontend_apply_error",
      details: error.message || "AI生成POST後のフロント処理でエラーが発生しました。",
    });
    setAiDraftStatus("AI生成結果を画面に反映できなかったため、簡易ルールで仮設定を表示しています。");
    setAiDraftMode("fallback");
    setOperationError("aiAxisDraft", `AI生成結果の反映に失敗しました。理由：${error.message || "不明"}`);
    } finally {
      setIsAiDraftLoading(false);
    }
  }

  function prepareAxisConfigWithLowDescriptions(rawConfig, existingAutoGenerated = EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED) {
    const normalizedConfig = normalizeAxisConfig(rawConfig, currentAxisSample);
    const autoGenerated = { ...EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED };

    ["x", "y", "z"].forEach((axis) => {
      const rawLowDescription = String(rawConfig?.[axis]?.lowDescription || "").trim();
      if (!rawLowDescription || existingAutoGenerated[axis]) {
        const inferredLowDescription = inferLowAxisDescription(
          normalizedConfig[axis].description,
          normalizedConfig[axis].label
        );
        if (inferredLowDescription) {
          normalizedConfig[axis] = {
            ...normalizedConfig[axis],
            lowDescription: inferredLowDescription,
          };
          autoGenerated[axis] = true;
        }
      }
    });

    return { axisConfig: normalizedConfig, autoGenerated };
  }

  function applyAiDraft() {
    if (!aiDraft) {
      setAiDraftError("適用できるAI候補がありません。");
      return;
    }

    const draftPresetKey = aiDraft.axisConfig?.presetKey;
    const usesPersonaAxisPreset = Boolean(PERSONA_CONFIGS[draftPresetKey]);
    const themeAxisConfig = getThemeAxisPreset(theme, themeCategory, currentAxisSample);
    const rawNextAxisConfig = usesPersonaAxisPreset
      ? themeAxisConfig
      : {
          ...aiDraft.axisConfig,
          presetKey: "aiDraft",
          axisSource: aiDraft.axisConfig?.axisSource || "theme",
          themeCategory,
        };
    const { axisConfig: nextAxisConfig, autoGenerated } = prepareAxisConfigWithLowDescriptions(rawNextAxisConfig);
    const nextCandidates = normalizeAiDraftCandidates(aiDraft.queryCandidates);
    const resolvedCandidates =
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : nextCandidates.length
          ? nextCandidates
          : themeQueryCandidates;
    const nextAxisKeywords = aiDraft.axisLinkedKeywords || {};
    const nextSelectedAxisKeywords = uniqueValues([
      ...(Array.isArray(nextAxisKeywords.x) ? nextAxisKeywords.x : []),
      ...(Array.isArray(nextAxisKeywords.y) ? nextAxisKeywords.y : []),
      ...(Array.isArray(nextAxisKeywords.z) ? nextAxisKeywords.z : []),
    ]);

    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(autoGenerated);
    setIsAiDraftApplied(true);
    setGeneratedXQueryCandidates(resolvedCandidates);
    setGeneratedBasicKeywords(Array.isArray(aiDraft.basicKeywords) ? aiDraft.basicKeywords : []);
    setGeneratedAxisLinkedKeywords(nextAxisKeywords);
    setSelectedXQueryCandidateIds(resolvedCandidates.map((candidate) => candidate.label));
    setSelectedAxisLinkedKeywords(nextSelectedAxisKeywords);
    setAnalysisMode(aiDraft.suggestedAnalysisMode === "axisDriven" ? "axisDriven" : analysisMode);
    setXQueryBase(resolvedCandidates.map((candidate) => candidate.base).join("\n"));
    setXQuery("");
    setIsManualXQuery(false);
    setAxisStatus("AI候補の評価軸を適用しました。");
    setHasScoredWithCurrentAxis(false);
    setAiDraftStatus("AI候補を適用しました。検索クエリを確認してX取得に進めます。");
    setAiDraftError("");
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
  }

  function toggleXQueryCandidate(index) {
    const candidate = xQueryCandidates[index];

    if (!candidate) return;

    setSelectedXQueryCandidateIds((previous) =>
      previous.includes(candidate.label)
        ? previous.filter((id) => id !== candidate.label)
        : [...previous, candidate.label]
    );
    setQueryDirty(true);
    setIsManualXQuery(false);
    setXStatus(`検索クエリ候補「${candidate.label}」の選択を切り替えました。複数候補はORで結合されます。`);
  }

  function selectAllXQueryCandidates() {
    setSelectedXQueryCandidateIds(xQueryCandidates.map((candidate) => candidate.label));
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus("すべての検索クエリ候補を選択しました。");
  }

  function clearAllXQueryCandidates() {
    setSelectedXQueryCandidateIds([]);
    setIsManualXQuery(true);
    setQueryDirty(true);
    setXStatus("検索クエリ候補をすべて解除しました。手入力クエリを使います。");
  }

  function toggleHashtagCandidate(hashtag) {
    const normalized = normalizeHashtag(hashtag);
    const candidate = hashtagCandidates.find((item) => item.hashtag === normalized);
    if (candidate?.selectionType === "disabled") {
      return;
    }

    setHasManualHashtagSelection(true);
    setSelectedHashtagCandidates((previous) =>
      previous.includes(normalized) ? previous.filter((item) => item !== normalized) : [...previous, normalized]
    );
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus(`ハッシュタグ候補「${normalized}」の選択を切り替えました。`);
  }

  function toggleExcludeTermCandidate(term) {
    const cleanTerm = String(term || "").trim();
    if (!cleanTerm) return;
    const currentSelected = hasManualExcludeTermSelection
      ? selectedExcludeTermCandidates
      : personaMode === "personaA" && themeCategory === "romance"
        ? excludeTermCandidates.map((candidate) => candidate.term)
        : selectedExcludeTermCandidates;
    setHasManualExcludeTermSelection(true);
    setSelectedExcludeTermCandidates((previous) =>
      currentSelected.includes(cleanTerm)
        ? currentSelected.filter((item) => item !== cleanTerm)
        : [...currentSelected, cleanTerm]
    );
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus(`除外語「${cleanTerm}」の選択を切り替えました。`);
  }

  function toggleAxisLinkedKeyword(keyword) {
    setSelectedAxisLinkedKeywords((previous) =>
      previous.includes(keyword) ? previous.filter((item) => item !== keyword) : [...previous, keyword]
    );
    setQueryDirty(true);
  }

  function updateXQueryBase(value) {
    setXQueryBase(value);
    setSelectedXQueryCandidateIds([]);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(value, xQueryFilters));
    setQueryDirty(true);
  }

  function updateXQueryFilter(key, value) {
    const nextFilters = { ...xQueryFilters, [key]: value };

    setXQueryFilters(nextFilters);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(xQueryBase, nextFilters));
    setQueryDirty(true);
  }

  function resetXQueryFilters() {
    const nextFilters = { ...DEFAULT_X_QUERY_FILTERS };

    setXQueryFilters(nextFilters);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(xQueryBase, nextFilters));
    setQueryDirty(true);
    setXStatus("検索条件を初期状態に戻しました。");
  }

  function handlePersonaModeChange(nextMode) {
    if (nextMode === personaMode) {
      return;
    }

    const nextPersonaConfig = personaConfigFor(nextMode);
    const nextPurposeMode = defaultAnalysisPurposeForPersona(nextMode);
    const nextPurposeDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(nextPurposeMode, nextMode);

    setPersonaModeHistory((previous) => [
      ...previous.slice(-9),
      {
        from: personaMode,
        to: nextMode,
        changedAt: new Date().toISOString(),
      },
    ]);
    setPersonaMode(nextMode);
    setAnalysisPurposeMode(nextPurposeMode);
    setSelectedVoiceDirections(nextPurposeDirections);
    if (themeCategory === "romance") {
      const nextQueryCandidates =
        nextMode === "personaA"
          ? getPersonaAQueryCandidates(nextPurposeDirections, nextPurposeMode)
          : getThemeQueryCandidates(theme, themeCategory, isSampleSession ? currentSample : null);
      const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;
      const nextPurposeTags =
        nextMode === "personaA" && !hasManualHashtagSelection
          ? purposeHashtags(nextPurposeMode, nextMode)
          : selectedHashtagCandidates;

      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.map((candidate) => candidate.label));
      setSelectedHashtagCandidates(nextPurposeTags);
      setHasManualHashtagSelection(false);
      setSelectedExcludeTermCandidates([]);
      setHasManualExcludeTermSelection(false);
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
    }
    setAxisStatus(
      `利用目的を「${nextPersonaConfig.label}」に変更しました。評価軸はテーマ優先のまま、出力の見せ方を更新します。`
    );
    setXStatus(
      themeCategory === "romance"
        ? "恋愛テーマの利用目的に合わせて、検索候補を具体的な恋愛相談フレーズへ更新しました。"
        : "利用目的を変更しました。X取得条件は変更していません。"
    );
    notify("info", `利用目的を「${nextPersonaConfig.label}」に変更しました。`);
    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "利用目的に合わせて出力表現を更新しました。",
      },
    }));
  }

  function handleAnalysisPurposeChange(nextPurposeMode) {
    const normalizedPurposeMode = normalizeAnalysisPurposeMode(nextPurposeMode, personaMode);
    const purposeConfig = analysisPurposeConfigFor(normalizedPurposeMode, personaMode);
    const nextDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(normalizedPurposeMode, personaMode);

    setAnalysisPurposeMode(normalizedPurposeMode);
    setSelectedVoiceDirections(nextDirections);

    if (personaMode === "personaA" && themeCategory === "romance") {
      const nextQueryCandidates = getPersonaAQueryCandidates(nextDirections, normalizedPurposeMode);
      const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;
      const nextPurposeTags = hasManualHashtagSelection ? selectedHashtagCandidates : purposeHashtags(normalizedPurposeMode, personaMode);

      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.map((candidate) => candidate.label));
      setSelectedHashtagCandidates(nextPurposeTags);
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
      setXStatus(`${JP_UI_LABELS.analysisPurpose}を「${purposeConfig.label}」に更新しました。検索候補を再作成しました。`);
    } else {
      setXStatus(`${JP_UI_LABELS.analysisPurpose}を「${purposeConfig.label}」に更新しました。`);
    }

    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: `${JP_UI_LABELS.analysisPurpose}に合わせてZone11のまとめ方を更新しました。`,
      },
    }));
  }

  function applyPersonaAQueryDirections(nextDirections, nextPurposeMode = analysisPurposeMode) {
    const normalizedDirections = normalizeVoiceDirections(nextDirections);
    const nextQueryCandidates = getPersonaAQueryCandidates(normalizedDirections, nextPurposeMode);
    const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;

    setSelectedVoiceDirections(normalizedDirections);
    if (personaMode === "personaA" && themeCategory === "romance") {
      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.map((candidate) => candidate.label));
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
      setXStatus(`${JP_UI_LABELS.voicesToCollect}を更新しました。${JP_UI_LABELS.queryAdjustment}を反映しています。`);
    }
  }

  function toggleVoiceDirection(directionKey) {
    setHasManualVoiceDirectionSelection(true);
    const normalizedPrevious = normalizeVoiceDirections(selectedVoiceDirections);
    const nextDirections = normalizedPrevious.includes(directionKey)
      ? normalizedPrevious.filter((key) => key !== directionKey)
      : [...normalizedPrevious, directionKey];

    applyPersonaAQueryDirections(nextDirections.length ? nextDirections : DEFAULT_PERSONA_A_VOICE_DIRECTIONS);
  }

  function selectAxisPreset(presetKey) {
    if (presetKey === "custom") {
      setDraftAxisConfig((previous) => ({
        ...normalizeAxisConfig(previous, currentAxisSample),
        presetKey: "custom",
      }));
      setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
      setAxisStatus("カスタム評価軸を編集中です。適用すると反映されます。");
      setHasScoredWithCurrentAxis(false);
      return;
    }

    const nextAxisConfig = axisConfigFromPreset(presetKey, currentAxisSample);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setAxisStatus(`${AXIS_PRESETS[presetKey]?.label || "評価軸"}を選択しました。適用すると反映されます。`);
    setHasScoredWithCurrentAxis(false);
  }

  function updateDraftAxis(axis, key, value) {
    setDraftAxisConfig((previous) => {
      const nextAxis = {
        ...previous[axis],
        [key]: value,
      };

      if ((key === "label" || key === "description") && axisLowDescriptionAutoGenerated[axis]) {
        const nextLabel = key === "label" ? value : nextAxis.label;
        const nextHighDescription = key === "description" ? value : nextAxis.description;
        nextAxis.lowDescription = inferLowAxisDescription(nextHighDescription, nextLabel);
      }

      return {
        ...previous,
        presetKey: "custom",
        [axis]: nextAxis,
      };
    });
    if (key === "lowDescription") {
      setAxisLowDescriptionAutoGenerated((previous) => ({
        ...previous,
        [axis]: false,
      }));
    }
    setHasScoredWithCurrentAxis(false);
    setOperationStatus((previous) => ({
      ...previous,
      applyAxis: {
        ...(previous.applyAxis || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "評価軸が変更されています。",
      },
      rescore: {
        ...(previous.rescore || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "再スコアリングが必要です。",
      },
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "フィードバックは古い可能性があります。",
      },
    }));
  }

  function applyAxisConfig() {
    setOperationRunning("applyAxis", "評価軸を適用中...", axisPresetLabel(draftAxisConfig));
    const { axisConfig: nextAxisConfig, autoGenerated } = prepareAxisConfigWithLowDescriptions(
      draftAxisConfig,
      axisLowDescriptionAutoGenerated
    );

    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(autoGenerated);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setAxisStatus("評価軸を適用しました。現在の評価軸でスコアとフィードバックを再計算しました。");
    setHasScoredWithCurrentAxis(true);
    setOperationSuccess("applyAxis", "評価軸を適用しました。", axisPresetLabel(nextAxisConfig));
    setOperationSuccess("rescore", "現在の評価軸で再スコアリングしました。", axisPresetLabel(nextAxisConfig));
    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "success",
        message: "ルールベース表示中",
        lastSuccessAt: new Date().toISOString(),
      },
    }));
  }

  function resetAxisConfigToThemeDefault() {
    const nextAxisConfig = getThemeAxisPreset(theme, themeCategory, currentAxisSample);

    setDraftAxisConfig(nextAxisConfig);
    setAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setAxisStatus("テーマ標準の評価軸に戻しました。スコアとフィードバックを再計算しました。");
    setHasScoredWithCurrentAxis(true);
  }

  function regenerateFeedback() {
    setAxisStatus("現在の評価軸でフィードバックを再生成しました。");
  }

  function rescoreWithCurrentAxis() {
    if (!canRescoreWithCurrentAxis) {
      setAxisStatus(rescoreButtonText);
      return;
    }

    applyAxisConfig();
  }

  // Section: X fetch request helpers and user-mode fetch handlers
  function sourceWorkflowDependencies() {
    return createSourceWorkflowDependencies({
      apiBaseUrl: API_BASE_URL,
      themeCategory,
      theme,
      userOpinion,
      personaMode,
      analysisPurposeMode,
      selectedHashtagValues,
      selectedExcludeTermValues,
      xFetchAbortControllerRef,
    });
  }
  function prepareXFetch(options = {}) {
    prepareXFetchState({
      options,
      resetAutoSummaryState,
      setters: {
        setActiveClusterRunId,
        setActiveDatasetId,
        setBeginnerMessage,
        setBeginnerResult,
        setBeginnerResultSlot,
        setBeginnerStatus,
        setBeginnerXFetchDebug,
        setClusterSummaries,
        setClusterSummaryErrorById,
        setExpandedClusterIds,
        setExternalOpinions,
        setHistoryStatus,
        setIsClusterSummaryLoadingById,
        setSelectedClusterId,
        setSemanticClusterError,
        setSemanticClusterRows,
        setSemanticClusterStatus,
        setXDataStatus,
        setXPosts,
      },
    });
  }

  // Builds the identity for an explicit theme/opinion pair before React state has caught up.
  // Purpose and persona are intentionally read from current state; changing that would affect slot matching.
  function inputKeyForValues(nextTheme = theme, nextOpinion = userOpinion) {
    const nextCategory = getThemeCategory("", nextTheme, nextOpinion);
    return modeResultInputKey({
      theme: nextTheme,
      userOpinion: nextOpinion,
      purpose: analysisPurposeMode,
      persona: personaMode,
      category: nextCategory,
    });
  }

  function applyFetchedXPosts(posts, texts, options = {}) {
    applyFetchedXPostsToState({
      axisConfig,
      clearActiveClusterRunState,
      context: { appMode, theme, userOpinion },
      currentModeInputKey,
      effectiveQuery,
      options,
      posts,
      resetAutoSummaryState,
      semanticClusterRows,
      setters: {
        setClusterSummaries,
        setExternalOpinions,
        setHasScoredWithCurrentAxis,
        setQueryDirty,
        setSemanticClusterError,
        setSemanticClusterRows,
        setSemanticClusterStatus,
        setUserResultSlot,
        setXDataStatus,
        setXPosts,
      },
      stagedFetchState,
      texts,
      xMaxResults,
    });
  }

  function validateXFetchInput(query, limit) {
    const maxFetchCount = PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH;
    const validation = validateXFetchRequest({
      effectiveQuery,
      isEffectiveQueryTooLong,
      limit,
      maxFetchCount,
      query,
    });
    if (!validation.ok) {
      setXStatus(validation.statusMessage || validation.message);
      setOperationError("fetchX", validation.message);
      return false;
    }

    return true;
  }

  async function runNormalSourceFetch(query, limit, successSuffix = "") {
    return runNormalSourceFetchWorkflow({
      sourceType: SOURCE_TYPES.X,
      input: {
        query,
        limit,
        successSuffix,
        sourceMode: appMode === "beginner" ? "beginner" : "user",
      },
      dependencies: sourceWorkflowDependencies(),
      callbacks: {
        applyFetchedPosts: applyFetchedXPosts,
        prepareSourceFetch: prepareXFetch,
        setOperationError,
        setOperationRunning,
        setOperationSuccess,
        setSourcePosts,
        setSourceStatus,
        setStagedFetchState,
      },
    });
  }

  async function requestQueryDiagnosisAdvice(query, diagnosis, options = {}) {
    const noiseBreakdown = diagnosis?.noiseBreakdown || [];
    const queryTermDiagnosis = diagnosis?.queryTermDiagnosis || [];
    const fallback = buildRuleBasedQueryAdvice({
      theme,
      userOpinion,
      currentQuery: query,
      axisConfig,
      diagnosis,
      noiseBreakdown,
      queryTermDiagnosis,
    });

    if (!diagnosis || diagnosis.status === "good") {
      return fallback;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/query-diagnosis-improve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: options.signal || xFetchAbortControllerRef.current?.signal,
        body: JSON.stringify({
          theme,
          userOpinion,
          currentQuery: query,
          axisConfig,
          diagnosis,
          noiseBreakdown,
          queryTermDiagnosis,
          sampleKeptPosts: diagnosis.sampleKeptPosts || [],
          sampleNoisePosts: diagnosis.sampleNoisePosts || [],
          analysisMode,
          personaMode,
          personaLabel: currentPersonaConfig.label,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "取得改善アドバイスの取得に失敗しました。");
      }

      const improvedQueryCandidates = Array.isArray(payload.improvedQueryCandidates)
        ? payload.improvedQueryCandidates
            .map((candidate, index) => ({
              label: String(candidate.label || `改善候補${index + 1}`),
              query: stripXCommonFilters(candidate.query || "").trim(),
              reason: String(candidate.reason || candidate.description || "AIが提案した改善クエリです。"),
            }))
            .filter((candidate) => candidate.query)
        : [];
      const improvedHashtagCandidates = Array.isArray(payload.improvedHashtagCandidates)
        ? payload.improvedHashtagCandidates
            .map((candidate) => ({
              label: String(candidate.label || candidate.hashtag || "").replace(/^#/, ""),
              hashtag: normalizeHashtag(candidate.hashtag || candidate.label || ""),
              reason: String(candidate.reason || "AIが提案したハッシュタグ候補です。"),
              noiseRisk: String(candidate.noiseRisk || "中"),
              selectionType: String(candidate.selectionType || ""),
            }))
            .filter((candidate) => candidate.hashtag)
        : [];

      return {
        ...fallback,
        ...payload,
        mainProblems: Array.isArray(payload.mainProblems)
          ? payload.mainProblems
          : Array.isArray(payload.problemReasons)
            ? payload.problemReasons
            : fallback.mainProblems,
        queryTermAdvice: Array.isArray(payload.queryTermAdvice) ? payload.queryTermAdvice : fallback.queryTermAdvice,
        improvedQueryCandidates: improvedQueryCandidates.length ? improvedQueryCandidates : fallback.improvedQueryCandidates,
        improvedHashtagCandidates,
        recommendedQuery: payload.recommendedQuery || improvedQueryCandidates[0]?.query || fallback.recommendedQuery,
        source: payload.source || "api",
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      return fallback;
    }
  }

  async function fetchSourceOpinionsForCurrentInput(queryOverride = "", decision = "") {
    const query = String(queryOverride || effectiveQuery).trim();
    const limit = Number(xMaxResults);

    if (!validateXFetchInput(query, limit)) {
      return;
    }

    xFetchAbortControllerRef.current?.abort();
    xFetchAbortControllerRef.current = new AbortController();
    const shouldUseStagedFetch = stagedFetchEnabled && limit > STAGED_FETCH_INITIAL_COUNT;
    const activeNoiseRelevanceThreshold =
      decision === "weak_noise_retry" ? 3 : NOISE_RELEVANCE_THRESHOLD;
    const previousDiagnosisForComparison = stagedFetchState.diagnosis;

    if (!shouldUseStagedFetch) {
      setStagedFetchState((previous) => ({
        ...previous,
        targetCount: limit,
        diagnosisDecision: decision || "normal",
        diagnosisStatus: "idle",
        shouldPause: false,
        message: "通常取得で実行しました。",
      }));
      await runNormalSourceFetch(query, limit);
      return;
    }

    await runDiagnosticStagedSourceFetchWorkflow({
      sourceType: SOURCE_TYPES.X,
      input: { query, limit, decision },
      dependencies: sourceWorkflowDependencies(),
      context: {
        activeDatasetId,
        activeNoiseRelevanceThreshold,
        appMode,
        axisConfig,
        effectiveQuery,
        noiseFilteringEnabled,
        previousDiagnosisForComparison,
        selectedExcludeTermValues,
        selectedHashtagValues,
        stagedFetchState,
        theme,
        themeCategory,
        userOpinion,
      },
      services: {
        applyFetchedPosts: applyFetchedXPosts,
        diagnoseQueryQuality,
        requestQueryDiagnosisAdvice,
      },
      callbacks: {
        prepareXFetch,
        setNoiseRelevanceThreshold,
        setOperationError,
        setOperationRunning,
        setOperationSuccess,
        setStagedFetchState,
        setXDataStatus,
        setXStatus: setSourceStatus,
      },
    });
  }

  async function fetchSourceOpinionsUserAuto() {
    const initialQuery = String(effectiveQuery).trim();
    const targetCount = Number(xMaxResults);

    if (!validateXFetchInput(initialQuery, targetCount)) {
      return;
    }

    if (targetCount <= STAGED_FETCH_INITIAL_COUNT || !stagedFetchEnabled) {
      await fetchSourceOpinionsForCurrentInput(initialQuery);
      return;
    }

    await runAutoUserStagedSourceFetchWorkflow({
      sourceType: SOURCE_TYPES.X,
      input: { initialQuery, targetCount },
      dependencies: sourceWorkflowDependencies(),
      context: {
        activeDatasetId,
        analysisPurposeMode,
        axisConfig,
        currentModeInputKey,
        effectiveQuery,
        noiseFilteringEnabled,
        personaMode,
        result,
        sampleKey,
        selectedExcludeTermValues,
        selectedHashtagValues,
        theme,
        themeCategory,
        userOpinion,
        xQueryFilters,
      },
      services: {
        applyFetchedPosts: applyFetchedXPosts,
        diagnoseQueryQuality,
        requestQueryDiagnosisAdvice,
      },
      callbacks: {
        prepareXFetch,
        setHasManualHashtagSelection,
        setIsManualXQuery,
        setNoiseRelevanceThreshold,
        setOperationError,
        setOperationRunning,
        setOperationSuccess,
        setQueryDirty,
        setSelectedExcludeTermCandidates,
        setSelectedHashtagCandidates,
        setSelectedXQueryCandidateIds,
        setStagedFetchState,
        setUserResultSlot,
        setXDataStatus,
        setXQuery,
        setXQueryBase,
        setXStatus: setSourceStatus,
      },
    });

    xFetchAbortControllerRef.current = null;
  }

  function handleFetchXButtonClick() {
    if (viewMode === "user") {
      fetchSourceOpinionsUserAuto();
      return;
    }

    fetchSourceOpinionsForCurrentInput();
  }

  // Section: Mode switching and user input synchronization
  function handleAppModeChange(nextMode) {
    // Mode switching is display-only: do not clear slots and do not start source fetch here.
    setAppMode(nextMode);
    if (nextMode === "user") {
      setViewMode("user");
    }
    if (nextMode === "developer") {
      setViewMode("developer");
    }
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", pathnameForAppMode(nextMode));
    }
  }

  // Synchronizes the canonical User/Developer input session from Beginner or manual edits.
  // This refreshes derived query/axis state without triggering an X fetch by itself.
  function syncUserInputSessionQuery(nextTheme, nextOpinion, options = {}) {
    const { resetOutput = false, silent = false } = options;
    const nextThemeCategory = getThemeCategory("", nextTheme, nextOpinion);
    const nextCandidates =
      personaMode === "personaA" && nextThemeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : getThemeQueryCandidates(nextTheme, nextThemeCategory, null);
    const nextAxisConfig = getThemeAxisPreset(nextTheme, nextThemeCategory, samples[nextThemeCategory] || null);
    const firstCandidate = nextCandidates[0];
    const nextBaseQuery =
      firstCandidate?.base ||
      firstCandidate?.query ||
      stripXCommonFilters(buildBeginnerXQuery(nextTheme)) ||
      sanitizeXQueryPhrase(nextTheme) ||
      "意見";

    setSampleKey(USER_INPUT_SAMPLE_KEY);
    setSelectedDemoSampleKey("");
    setGeneratedXQueryCandidates(nextCandidates);
    setGeneratedBasicKeywords(beginnerKeywordParts(nextTheme));
    setGeneratedAxisLinkedKeywords(null);
    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setHasScoredWithCurrentAxis(false);
    setSelectedXQueryCandidateIds(nextCandidates.map((candidate) => candidate.label));
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setSelectedAxisLinkedKeywords([]);
    setXQueryBase(nextBaseQuery);
    setXQuery(buildXQuery(nextBaseQuery, DEFAULT_X_QUERY_FILTERS));
    setXQueryFilters({ ...DEFAULT_X_QUERY_FILTERS });
    setIsManualXQuery(false);
    setQueryDirty(false);
    if (!silent) {
      setXStatus("現在のテーマと自分の意見から検索クエリを生成しました。");
    }

    if (resetOutput) {
      // A new input run intentionally clears both slots so old input cannot appear under the new inputKey.
      setActiveDatasetId("");
      setActiveClusterRunId("");
      setXDataStatus("empty");
      setBeginnerResult(null);
      setBeginnerStatus("idle");
      setBeginnerMessage("");
      setBeginnerResultSlot(null);
      setUserResultSlot(null);
      clearActiveClusterRunState();
      setSemanticClusterRows([]);
      setSemanticClusterStatus("");
      setSemanticClusterError("");
      setClusterSummaries({});
      resetAutoSummaryState();
    }
  }

  // Section: Beginner mode handlers
  function handleBeginnerThemeChange(nextTheme) {
    setBeginnerThemeInput(nextTheme);
    setTheme(nextTheme);
    setSampleKey(USER_INPUT_SAMPLE_KEY);
    syncUserInputSessionQuery(nextTheme, userOpinion, { silent: true });
    setQueryDirty(true);
  }

  function handleBeginnerOpinionChange(nextOpinion) {
    setBeginnerOpinionInput(nextOpinion);
    setUserOpinion(nextOpinion);
    setSampleKey(USER_INPUT_SAMPLE_KEY);
    syncUserInputSessionQuery(theme, nextOpinion, { silent: true });
    setHasScoredWithCurrentAxis(false);
  }

  function regenerateQueryFromCurrentInput() {
    const nextTheme = theme.trim();
    const nextOpinion = userOpinion.trim();

    if (!nextTheme || !nextOpinion) {
      setXStatus("テーマと自分の意見を入力すると検索クエリを生成できます。");
      return;
    }

    syncUserInputSessionQuery(nextTheme, nextOpinion);
  }

  async function handleBeginnerRun(event) {
    await runBeginnerMode({
      event,
      beginnerThemeInput,
      beginnerOpinionInput,
      inputKeyForValues,
      syncUserInputSessionQuery,
      prepareXFetch,
      applyFetchedXPosts,
      setTheme,
      setUserOpinion,
      setBeginnerResult,
      setBeginnerResultSlot,
      setUserResultSlot,
      setBeginnerStatus,
      setBeginnerMessage,
      setBeginnerXFetchDebug,
      setXDataStatus,
    });
  }
  function handleForceStopRunningOperations() {
    let stopped = false;

    if (operationStatus.fetchX.status === "running" && xFetchAbortControllerRef.current) {
      xFetchAbortControllerRef.current.abort();
      stopped = true;
    }

    if ((isAutoSummarizing || operationStatus.autoSummary.status === "running") && autoSummaryAbortControllerRef.current) {
      autoSummaryStopRequestedRef.current = true;
      autoSummaryAbortControllerRef.current.abort();
      stopped = true;
    }

    if (stopped) {
      notify("info", "実行中の処理を停止しました。");
    }
  }

  async function continueStagedFetch() {
    const query = effectiveQuery.trim();
    const targetCount = Number(xMaxResults);
    const accumulatedCount = stagedFetchState.accumulatedCount || xPosts.length || currentOpinionCount;
    await runContinueSourceFetchWorkflow({
      sourceType: SOURCE_TYPES.X,
      input: { query },
      dependencies: sourceWorkflowDependencies(),
      context: {
        accumulatedCount,
        axisConfig,
        currentOpinionCount,
        effectiveQuery,
        externalOpinions,
        noiseFilteringEnabled,
        noiseRelevanceThreshold,
        selectedExcludeTermValues,
        selectedHashtagValues,
        stagedFetchState,
        targetCount,
        theme,
        themeCategory,
        userOpinion,
        xPosts,
      },
      services: {
        applyFetchedPosts: applyFetchedXPosts,
        diagnoseQueryQuality,
        requestQueryDiagnosisAdvice,
      },
      callbacks: {
        setOperationError,
        setOperationRunning,
        setOperationSuccess,
        setStagedFetchState,
        setSourceStatus,
      },
    });
  }

  function toggleImprovedQueryCandidate(index) {
    setStagedFetchState((previous) => {
      const selected = new Set(previous.selectedImprovedQueryIndexes || []);
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }

      return {
        ...previous,
        selectedImprovedQueryIndexes: Array.from(selected).sort((a, b) => a - b),
      };
    });
  }

  function selectedImprovedQueryBase(candidate = null) {
    if (candidate) {
      return candidate.query || "";
    }

    const selectedIndexes = stagedFetchState.selectedImprovedQueryIndexes?.length
      ? stagedFetchState.selectedImprovedQueryIndexes
      : [0];
    const selectedCandidates = selectedIndexes
      .map((index) => stagedFetchState.improvedQueryCandidates[index])
      .filter(Boolean);

    return selectedCandidates.map((item) => `(${item.query})`).join(" OR ");
  }

  async function refetchWithImprovedQuery(candidate = null) {
    const targetCount = Number(xMaxResults);
    const currentDataCount = stagedFetchState.accumulatedCount || xPosts.length || currentOpinionCount;
    await runAdditionalSourceFetchWorkflow({
      sourceType: SOURCE_TYPES.X,
      input: { candidate },
      dependencies: sourceWorkflowDependencies(),
      context: {
        axisConfig,
        currentDataCount,
        currentOpinionCount,
        effectiveQuery,
        externalOpinions,
        noiseFilteringEnabled,
        noiseRelevanceThreshold,
        sampleKey,
        selectedExcludeTermValues,
        selectedHashtagValues,
        stagedFetchState,
        targetCount,
        theme,
        userOpinion,
        xPosts,
        xQueryFilters,
      },
      services: {
        applyFetchedPosts: applyFetchedXPosts,
        diagnoseQueryQuality,
        requestQueryDiagnosisAdvice,
      },
      callbacks: {
        setIsManualSourceQuery: setIsManualXQuery,
        setOperationError,
        setOperationRunning,
        setOperationSuccess,
        setQueryDirty,
        setSelectedSourceQueryCandidateIds: setSelectedXQueryCandidateIds,
        setSourceQuery: setXQuery,
        setSourceQueryBase: setXQueryBase,
        setSourceStatus,
        setStagedFetchState,
      },
    });
  }

  function retryDiagnosisWithWeakNoiseFilter() {
    if (!xPosts.length) {
      setXStatus("再診断できる取得済みデータがありません。");
      return;
    }

    const nextThreshold = 3;
    const query = effectiveQuery.trim();
    const diagnosis = diagnoseQueryQuality(xPosts, query, themeCategory, axisConfig, true, theme, userOpinion, nextThreshold);
    const queryAdvice = buildRuleBasedQueryAdvice({
      theme,
      userOpinion,
      currentQuery: query,
      axisConfig,
      diagnosis,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
    });
    setNoiseRelevanceThreshold(nextThreshold);
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosis,
      diagnosisStatus: diagnosis.status,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
      aiQueryAdvice: queryAdvice,
      improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
        ? queryAdvice.improvedQueryCandidates
        : previous.improvedQueryCandidates,
      recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
      shouldPause: diagnosis.status !== "good",
      weakNoiseRetryAvailable: false,
      lastAction: "weak_noise_retry",
      diagnosisDecision: "weak_noise_retry",
      fetchedCount: xPosts.length,
      currentBatchCount: 0,
      totalFetchedCount: xPosts.length,
      accumulatedCount: xPosts.length,
      stageLogs: [
        ...(previous.stageLogs || []),
        createWeakNoiseStageLog({
          previousStageLogs: previous.stageLogs || [],
          query,
          diagnosis,
          accumulatedCount: xPosts.length,
        }),
      ],
      message:
        diagnosis.status === "good"
          ? "ノイズ除去を弱めて再診断した結果、取得診断は良好になりました。"
          : "ノイズ除去を弱めても取得は不調です。クエリをさらに具体化してください。",
    }));
    setXStatus(
      `ノイズ除去を弱めて再診断しました。分析対象${diagnosis.analysisCandidateCount}件 / ノイズ率${formatPercent(diagnosis.noiseRate)}。`
    );
  }

  function focusManualQueryEdit() {
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisDecision: "manual",
      message: "手動でクエリを修正してください。",
    }));
    const target = document.querySelector(".basic-keywords-input") || document.querySelector(".query-candidate-list");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof target?.focus === "function") {
      target.focus();
    }
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  function sortLabel(key) {
    if (sortKey !== key) return "";
    return sortDirection === "desc" ? "▼" : "▲";
  }

  function persistDatasetHistory(nextHistory) {
    const compactHistory = {
      datasets: (nextHistory.datasets || []).slice(0, MAX_X_DATASET_HISTORY),
    };

    setDatasetHistory(compactHistory);
    writeDatasetHistory(compactHistory);
  }

  async function saveCurrentXDatasetToHistory() {
    setOperationRunning("saveDataset", "Xデータを保存中...", truncateText(theme, 80), currentDatasetHash);
    await waitForNextPaint();

    try {
      const opinions = externalOpinions
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      if (opinions.length === 0) {
        throw new Error("保存する外部意見がありません。");
      }

      const savedAt = new Date().toISOString();
      const datasetId = createHistoryId("ds");
      const dataset = {
        datasetId,
        savedAt,
        sampleNo: isSampleSession ? currentSample.sampleNo || sampleNoForKey(sampleKey) : null,
        sampleKey: isSampleSession ? sampleKey : USER_INPUT_SAMPLE_KEY,
        sampleLabel: currentSessionSampleLabel,
        viewMode,
        userModeAutoFetchEnabled: viewMode === "user",
        personaMode,
        analysisPurposeMode,
        personaLabel: currentPersonaConfig.label,
        selectedVoiceDirections,
        theme,
        userOpinion,
        query: effectiveQuery,
        manualQuery: xQuery,
        selectedQueryCandidateIds: selectedXQueryCandidateIds,
        selectedQueryCandidateLabels: selectedXQueryCandidates.map((candidate) => candidate.label),
        selectedHashtagCandidates,
        selectedExcludeTermCandidates,
        queryCandidates: xQueryCandidates,
        generatedBasicKeywords,
        generatedAxisLinkedKeywords,
        effectiveQuery,
        axisConfig,
        axisPresetKey: axisConfig.presetKey,
        axisLabels: {
          x: axisConfig.x.label,
          y: axisConfig.y.label,
          z: axisConfig.z.label,
        },
        axisDescriptions: {
          x: axisConfig.x.description,
          y: axisConfig.y.description,
          z: axisConfig.z.description,
        },
        analysisMode,
        axisConfigAtFetch: axisConfig,
        axisLinkedKeywords,
        selectedAxisLinkedKeywords,
        queryAxisWarnings,
        scoreDisplayMode,
        stagedFetchEnabled,
        stagedFetchStageLogs: stagedFetchState.stageLogs,
        stagedFetchTargetCount: stagedFetchState.targetCount,
        stagedFetchAccumulatedCount: stagedFetchState.accumulatedCount,
        stagedFetchCurrentDataCount: stagedFetchState.currentDataCount || stagedFetchState.accumulatedCount || opinions.length,
        stagedFetchTotalApiFetchedCount: stagedFetchState.totalApiFetchedCount || stagedFetchState.accumulatedCount || opinions.length,
        stagedFetchRemainingCount: stagedFetchState.remainingCount,
        stagedFetchNextFetchCount: stagedFetchState.nextFetchCount,
        initialFetchCount: stagedFetchState.initialFetchCount,
        stagedFetchLastAction: stagedFetchState.lastAction,
        improvedRefetchCount: stagedFetchState.improvedRefetchCount,
        improvedAddFetchCount: stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0,
        continueRemainingCount: stagedFetchState.continueRemainingCount,
        queryDiagnosis: stagedFetchState.diagnosis,
        queryDiagnosisStatus: stagedFetchState.diagnosisStatus,
        queryDiagnosisNoiseBreakdown: stagedFetchState.noiseBreakdown,
        queryTermDiagnosis: stagedFetchState.queryTermDiagnosis,
        aiQueryAdvice: stagedFetchState.aiQueryAdvice,
        queryImprovementComparison: stagedFetchState.improvementComparison,
        improvedQueryCandidates: stagedFetchState.improvedQueryCandidates,
        selectedImprovedQueryIndexes: stagedFetchState.selectedImprovedQueryIndexes,
        diagnosisPaused: stagedFetchState.shouldPause,
        diagnosisDecision: stagedFetchState.diagnosisDecision,
        queryBeforeImprovement: stagedFetchState.beforeQuery,
        queryAfterImprovement: stagedFetchState.afterQuery,
        noiseRelevanceThreshold,
        noiseFilterEnabled: noiseFilteringEnabled,
        noiseProcessingResult: {
          noiseFilterEnabled: result.noiseProcessingResult.noiseFilterEnabled,
          noiseExcludedCount: result.noiseProcessingResult.noiseExcludedCount,
          analysisTargetCount: result.noiseProcessingResult.analysisTargetCount,
          noiseReasonCounts: result.noiseProcessingResult.noiseReasonCounts,
          noiseReasonSummary: result.noiseProcessingResult.noiseReasonSummary,
        },
        maxResults: Number(xMaxResults) || opinions.length,
        count: opinions.length,
        externalOpinions: opinions,
        clusterRuns: [],
      };
      const nextHistory = {
        datasets: [dataset, ...datasetHistory.datasets].slice(0, MAX_X_DATASET_HISTORY),
      };

      persistDatasetHistory(nextHistory);
      setActiveDatasetId(datasetId);
      setActiveClusterRunId("");
      setXDataStatus("cached");
      setHistoryStatus("X取得データを履歴に保存しました。");
      setOperationSuccess(
        "saveDataset",
        `保存済み ${formatHistoryDate(savedAt)} / ${opinions.length}件 / ${currentSessionSampleLabel} / ${truncateText(theme, 60)}`,
        datasetId,
        currentDatasetHash
      );
    } catch (error) {
      const message = error?.message || String(error);
      setHistoryStatus(message);
      setOperationError("saveDataset", `Xデータ保存に失敗しました。理由：${message}`, "", currentDatasetHash);
    }
  }

  function loadXDatasetFromHistory(datasetId) {
    const dataset = migrateAppStateFromMojibake({
      datasets: datasetHistory.datasets.filter((item) => item.datasetId === datasetId),
    }).datasets[0];

    if (!dataset) {
      setHistoryStatus("読み込むXデータ履歴が見つかりません。");
      return;
    }

    const datasetSample = samples[dataset.sampleKey] || null;
    const restoredAxisConfig = normalizeAxisConfig(dataset.axisConfig, datasetSample);
    const restoredPersonaMode = dataset.personaMode || "dev";
    const restoredAnalysisPurposeMode = normalizeAnalysisPurposeMode(dataset.analysisPurposeMode, restoredPersonaMode);
    const restoredVoiceDirections = normalizeVoiceDirections(
      dataset.selectedVoiceDirections || purposeVoiceDirections(restoredAnalysisPurposeMode, restoredPersonaMode)
    );
    const restoredTheme = dataset.theme || dataset.sampleLabel || theme;
    const restoredThemeCategory = getThemeCategory(dataset.sampleKey || sampleKey, restoredTheme, dataset.userOpinion ?? userOpinion);
    const restoredQueryCandidates =
      Array.isArray(dataset.queryCandidates) && dataset.queryCandidates.length > 0
        ? dataset.queryCandidates
        : restoredPersonaMode === "personaA" && restoredThemeCategory === "romance"
          ? getPersonaAQueryCandidates(restoredVoiceDirections, restoredAnalysisPurposeMode)
          : getThemeQueryCandidates(restoredTheme, restoredThemeCategory, datasetSample);
    const restoredQueryBase =
      !looksLikeMojibake(dataset.manualQuery || dataset.query || "")
        ? dataset.manualQuery || dataset.query || restoredQueryCandidates[0]?.base || restoredQueryCandidates[0]?.query || ""
        : restoredQueryCandidates[0]?.base || restoredQueryCandidates[0]?.query || "";

    setSampleKey(dataset.sampleKey || sampleKey);
    setPersonaMode(restoredPersonaMode);
    setAnalysisPurposeMode(restoredAnalysisPurposeMode);
    setSelectedVoiceDirections(restoredVoiceDirections);
    setHasManualVoiceDirectionSelection(Array.isArray(dataset.selectedVoiceDirections) && dataset.selectedVoiceDirections.length > 0);
    setTheme(restoredTheme);
    setUserOpinion(dataset.userOpinion ?? userOpinion);
    setAxisConfig(restoredAxisConfig);
    setDraftAxisConfig(restoredAxisConfig);
    setAxisStatus(dataset.axisConfig ? "保存済みXデータの評価軸を復元しました。" : "古い保存データのため、テーマ標準の評価軸を使います。");
    setHasScoredWithCurrentAxis(true);
    setAnalysisMode(dataset.analysisMode || "exploratory");
    setSelectedAxisLinkedKeywords(Array.isArray(dataset.selectedAxisLinkedKeywords) ? dataset.selectedAxisLinkedKeywords : []);
    setExternalOpinions((dataset.externalOpinions || []).join("\n"));
    setXQuery(buildXQuery(restoredQueryBase, DEFAULT_X_QUERY_FILTERS));
    setXQueryBase(restoredQueryBase);
    setGeneratedXQueryCandidates(restoredQueryCandidates);
    setGeneratedBasicKeywords(Array.isArray(dataset.generatedBasicKeywords) ? dataset.generatedBasicKeywords : []);
    setGeneratedAxisLinkedKeywords(dataset.generatedAxisLinkedKeywords || null);
    setSelectedXQueryCandidateIds(Array.isArray(dataset.selectedQueryCandidateIds) ? dataset.selectedQueryCandidateIds : []);
    setSelectedHashtagCandidates(Array.isArray(dataset.selectedHashtagCandidates) ? dataset.selectedHashtagCandidates : []);
    setHasManualHashtagSelection(Array.isArray(dataset.selectedHashtagCandidates) && dataset.selectedHashtagCandidates.length > 0);
    setSelectedExcludeTermCandidates(
      Array.isArray(dataset.selectedExcludeTermCandidates) ? dataset.selectedExcludeTermCandidates : []
    );
    setXMaxResults(dataset.maxResults || dataset.count || 100);
    setScoreDisplayMode(dataset.scoreDisplayMode === "absolute" ? "absolute" : "relative");
    setIsNoiseFilteringDisabled(dataset.noiseFilterEnabled === false);
    setNoiseRelevanceThreshold(dataset.noiseRelevanceThreshold || NOISE_RELEVANCE_THRESHOLD);
    setStagedFetchState((previous) => ({
      ...previous,
      enabled: dataset.stagedFetchEnabled !== false,
      targetCount: dataset.maxResults || dataset.count || previous.targetCount,
      stageLogs: Array.isArray(dataset.stagedFetchStageLogs) ? dataset.stagedFetchStageLogs : [],
      fetchedCount: dataset.queryDiagnosis?.fetchedCount || 0,
      currentBatchCount: 0,
      totalFetchedCount: dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      accumulatedCount: dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      currentDataCount: dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      totalApiFetchedCount:
        dataset.stagedFetchTotalApiFetchedCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      remainingCount: Math.max(
        0,
        (dataset.maxResults || dataset.count || previous.targetCount) -
          (dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0)
      ),
      nextFetchCount: Math.min(
        STAGED_FETCH_INITIAL_COUNT,
        Math.max(
          0,
          (dataset.maxResults || dataset.count || previous.targetCount) -
            (dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0)
        )
      ),
      initialFetchCount: dataset.initialFetchCount || (dataset.queryDiagnosis ? 1 : 0),
      diagnosisStatus: dataset.queryDiagnosisStatus || "idle",
      shouldPause: Boolean(dataset.diagnosisPaused),
      diagnosis: dataset.queryDiagnosis || null,
      noiseBreakdown: Array.isArray(dataset.queryDiagnosisNoiseBreakdown) ? dataset.queryDiagnosisNoiseBreakdown : [],
      queryTermDiagnosis: Array.isArray(dataset.queryTermDiagnosis) ? dataset.queryTermDiagnosis : [],
      aiQueryAdvice: dataset.aiQueryAdvice || null,
      improvementComparison: dataset.queryImprovementComparison || null,
      improvedQueryCandidates: Array.isArray(dataset.improvedQueryCandidates) ? dataset.improvedQueryCandidates : [],
      selectedImprovedQueryIndexes: Array.isArray(dataset.selectedImprovedQueryIndexes) ? dataset.selectedImprovedQueryIndexes : [0],
      recommendedQuery: Array.isArray(dataset.improvedQueryCandidates) ? dataset.improvedQueryCandidates[0]?.query || "" : "",
      diagnosisDecision: dataset.diagnosisDecision || "",
      lastAction: dataset.stagedFetchLastAction || "",
      beforeQuery: dataset.queryBeforeImprovement || "",
      afterQuery: dataset.queryAfterImprovement || "",
      improvedRefetchCount: dataset.improvedRefetchCount || 0,
      improvedAddFetchCount: dataset.improvedAddFetchCount ?? dataset.improvedRefetchCount ?? 0,
      continueRemainingCount: dataset.continueRemainingCount || 0,
      message: dataset.queryDiagnosisStatus ? `保存済みXデータの取得診断: ${queryDiagnosisLabel(dataset.queryDiagnosisStatus)}` : "未実行",
    }));
    setIsManualXQuery(!Array.isArray(dataset.selectedQueryCandidateIds) || dataset.selectedQueryCandidateIds.length === 0);
    setQueryDirty(false);
    setXPosts([]);
    setActiveDatasetId(dataset.datasetId);
    setActiveClusterRunId("");
    setXDataStatus("cached");
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setExpandedClusterIds({});
    setHistoryStatus("保存済みXデータを読み込みました。テーマ・自分の意見・検索条件も復元しました。X APIは実行していません。");
  }

  function deleteXDatasetHistory(datasetId) {
    if (!window.confirm("このXデータ履歴と紐づくクラスタ結果を削除しますか？")) {
      return;
    }

    const nextHistory = {
      datasets: datasetHistory.datasets.filter((dataset) => dataset.datasetId !== datasetId),
    };

    persistDatasetHistory(nextHistory);

    if (activeDatasetId === datasetId) {
      setActiveDatasetId("");
      setActiveClusterRunId("");
      setXDataStatus(externalOpinions.trim() ? "unsaved" : "sample");
    }

    setHistoryStatus("Xデータ履歴を削除しました。");
  }

  async function saveCurrentClusterRunToHistory() {
    setOperationRunning("saveCluster", "クラスタ結果を保存中...", currentClusterDisplayLabel(), currentClusterHash);
    await waitForNextPaint();

    try {
      if (!activeDatasetId) {
        throw new Error("先にX取得データを履歴に保存してください。");
      }

      if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
        throw new Error("意味類似 OpenAI は未実行です。先に「意味クラスタを実行」を押してください。");
      }

      const dataset = datasetHistory.datasets.find((item) => item.datasetId === activeDatasetId);
      if (!dataset) {
        throw new Error("保存先のXデータ履歴が見つかりません。");
      }

      const stats = result.noiseProcessingResult;
      const inputCount = stats.candidateCount || 0;
      const clusterCount = result.clusterTableRows.length;
      const compressionRate = inputCount > 0 ? (1 - clusterCount / inputCount) * 100 : 0;
      const savedClusterMethod = clusterMethod === "semantic" && semanticClusterRows.length > 0 ? "semantic" : "text";
      const methodLabel = savedClusterMethod === "semantic" ? "意味類似" : "文字類似";
      const threshold = savedClusterMethod === "semantic" ? semanticThreshold : clusterThreshold;
      const savedAt = new Date().toISOString();
      const runId = createHistoryId("run");
      const run = {
        runId,
        savedAt,
        datasetId: dataset.datasetId,
        datasetTheme: dataset.theme || "",
        datasetUserOpinion: dataset.userOpinion || "",
        datasetSampleKey: dataset.sampleKey || "",
        datasetSampleNo: dataset.sampleNo || sampleNoForKey(dataset.sampleKey),
        datasetSampleLabel: dataset.sampleLabel || "",
        axisConfig,
        axisPresetKey: axisConfig.presetKey,
        axisConfigUsedForScoring: axisConfig,
        scoringDate: savedAt,
        analysisMode,
        queryAxisWarnings,
        clusterMethod: savedClusterMethod,
        textThreshold: clusterThreshold,
        semanticThreshold,
        graphMode,
        scoreDisplayMode,
        resolvedScoreDisplayMode: result.resolvedScoreDisplayMode,
        scoreDistribution: result.scoreDistribution,
        scoreConcentrationDetected: result.scoreConcentrationDetected,
        axisQualityWarnings,
        inputCount,
        clusterCount,
        compressionRate,
        clusters: compactClusterRowsForHistory(result.clusterTableRows),
        noiseProcessingResult: {
          rawCount: stats.rawCount,
          processedUniqueTextCount: stats.processedUniqueTextCount,
          duplicateCount: stats.duplicateCount,
          independentOpinionCount: stats.independentOpinionCount,
          independentOpinionRate: stats.independentOpinionRate,
          spreadReferenceCount: stats.spreadReferenceCount,
          spreadDominanceRate: stats.spreadDominanceRate,
          spreadTemplateCount: stats.spreadTemplateCount,
          retweetLikeCount: stats.retweetLikeCount,
          urlCount: stats.urlCount,
          tooShortCount: stats.tooShortCount,
          noiseFilterEnabled: stats.noiseFilterEnabled,
          noiseExcludedCount: stats.noiseExcludedCount,
          analysisTargetCount: stats.analysisTargetCount,
          noiseReasonCounts: stats.noiseReasonCounts,
          noiseReasonSummary: stats.noiseReasonSummary,
          candidateCount: stats.candidateCount,
          clusterCount,
        },
        clusterSummaries,
        summary: `${methodLabel} ${threshold.toFixed(2)}：${inputCount}件→${clusterCount}クラスタ`,
      };
      const nextHistory = {
        datasets: datasetHistory.datasets.map((item) =>
          item.datasetId === activeDatasetId
            ? {
                ...item,
                clusterRuns: [run, ...(item.clusterRuns || [])].slice(0, MAX_CLUSTER_RUN_HISTORY),
              }
            : item
        ),
      };

      persistDatasetHistory(nextHistory);
      setActiveClusterRunId(runId);
      setHistoryStatus("現在のクラスタ結果を保存しました。");
      setOperationSuccess(
        "saveCluster",
        `保存済み ${formatHistoryDate(savedAt)} / ${clusterCount}クラスタ / ${methodLabel} ${threshold.toFixed(2)}`,
        runId,
        currentClusterHash
      );
    } catch (error) {
      const message = error?.message || String(error);
      setHistoryStatus(message);
      setOperationError("saveCluster", `クラスタ保存に失敗しました。理由：${message}`, "", currentClusterHash);
    }
  }

  function loadClusterRunFromHistory(datasetId, runId) {
    const dataset = datasetHistory.datasets.find((item) => item.datasetId === datasetId);
    const run = dataset?.clusterRuns?.find((item) => item.runId === runId);

    if (!dataset || !run) {
      setHistoryStatus("読み込むクラスタリング結果が見つかりません。");
      return;
    }

    setClusterMethod(run.clusterMethod || "text");
    setClusterThreshold(run.textThreshold || 0.35);
    setSemanticThreshold(run.semanticThreshold || 0.78);
    setAnalysisMode(run.analysisMode || analysisMode);
    if (run.axisConfig) {
      const restoredAxisConfig = normalizeAxisConfig(run.axisConfig, samples[dataset.sampleKey] || currentAxisSample);
      setAxisConfig(restoredAxisConfig);
      setDraftAxisConfig(restoredAxisConfig);
      setAxisStatus("保存済みクラスタ結果の評価軸を復元しました。");
    }
    setGraphMode(run.graphMode || graphMode);
    setScoreDisplayMode(run.scoreDisplayMode === "absolute" ? "absolute" : "relative");
    setIsNoiseFilteringDisabled(run.noiseProcessingResult?.noiseFilterEnabled === false);
    setActiveDatasetId(datasetId);
    setActiveClusterRunId(runId);
    setHasScoredWithCurrentAxis(true);
    setClusterSummaries(run.clusterSummaries || {});
    setExpandedClusterIds({});

    if (run.clusterMethod === "semantic") {
      setSemanticClusterRows(restoreClusterRowsFromHistory(run.clusters));
      setSemanticClusterStatus("保存済みクラスタ結果を読み込みました。OpenAI APIは実行していません。");
      setSemanticClusterError("");
    } else {
      setSemanticClusterRows([]);
      setSemanticClusterStatus("");
      setSemanticClusterError("");
    }

    setHistoryStatus("保存済みクラスタ結果を読み込みました。OpenAI APIは実行していません。");
  }

  function deleteClusterRunHistory(datasetId, runId) {
    if (!window.confirm("このクラスタリング結果を削除しますか？")) {
      return;
    }

    const nextHistory = {
      datasets: datasetHistory.datasets.map((dataset) =>
        dataset.datasetId === datasetId
          ? {
              ...dataset,
              clusterRuns: (dataset.clusterRuns || []).filter((run) => run.runId !== runId),
            }
          : dataset
      ),
    };

    persistDatasetHistory(nextHistory);

    if (activeClusterRunId === runId) {
      setActiveClusterRunId("");
    }

    setHistoryStatus("クラスタリング結果を削除しました。");
  }

  const result = useMemo(() => {
    const opinions = externalOpinions
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const user = {
      originalNo: "-",
      label: "自分の意見",
      type: "自分の意見",
      opinion: userOpinion,
      group: "user",
      ...scoreOpinion(userOpinion, themeCategory, axisConfig),
    };

    const rawExternalRows = opinions.map((opinion, index) => ({
      originalNo: index + 1,
      label: String(index + 1),
      type: `処理前外部意見 ${index + 1}`,
      opinion,
      group: "external",
      ...scoreOpinion(opinion, themeCategory, axisConfig),
    }));

    const makeAverageRow = (rows, label, type, group) => {
      if (rows.length === 0) {
        return {
          originalNo: "-",
          label,
          type,
          group,
          opinion: "平均対象がありません",
          x: 0,
          y: 0,
          z: 0,
        };
      }

      return {
        originalNo: "-",
        label,
        type,
        group,
        opinion: type,
        x: Math.round(rows.reduce((sum, row) => sum + row.x, 0) / rows.length),
        y: Math.round(rows.reduce((sum, row) => sum + row.y, 0) / rows.length),
        z: Math.round(rows.reduce((sum, row) => sum + row.z, 0) / rows.length),
      };
    };

    const noiseBaseResult = buildNoiseProcessingResult(
      opinions,
      themeCategory,
      axisConfig,
      noiseFilteringEnabled,
      noiseRelevanceThreshold
    );
    const personaAStrictActive = personaMode === "personaA" && themeCategory === "romance";
    const personaAStrictResult = applyPersonaAStrictRelevance(noiseBaseResult.candidateRows, {
      enabled: personaAStrictActive,
      theme,
      userOpinion,
    });
    const strictCandidateRows = personaAStrictResult.candidateRows;
    const strictExcludedRows = personaAStrictResult.excludedRows || [];
    const strictBorderlineRows = personaAStrictResult.borderlineRows || [];
    const strictAllExcludedRows = personaAStrictResult.allExcludedRows || [];
    const combinedNoiseReasonCounts = { ...(noiseBaseResult.noiseReasonCounts || {}) };
    Object.entries(personaAStrictResult.exclusionCounts || {}).forEach(([category, count]) => {
      combinedNoiseReasonCounts[category] = (combinedNoiseReasonCounts[category] || 0) + count;
    });
    const combinedNoiseExcludedRows = [
      ...(noiseBaseResult.noiseExcludedRows || []),
      ...strictExcludedRows.map((row) => ({
        ...row,
        noiseCategory: row.personaAExclusionReason || row.personaARelevanceCategory,
        noiseReason: "Persona A厳格フィルタで、恋愛相談として自然に読めない投稿を除外しました。",
      })),
    ];
    const combinedBorderlineRows = [
      ...(noiseBaseResult.borderlineUsefulRows || []),
      ...strictBorderlineRows.map((row) => ({
        ...row,
        noiseCategory: row.personaAExclusionReason || row.personaARelevanceCategory,
        borderlineReason: row.borderlineReason || "Persona A厳格フィルタで境界意見に分類しました。",
      })),
    ];
    const clusters = clusterOpinionsByText(strictCandidateRows, clusterThreshold);
    const textClusterRows = clusters.map((cluster, index) =>
      makeClusterRepresentative(cluster, index, themeCategory, axisConfig)
    );
    const visibleSemanticClusterRows = personaAStrictActive
      ? semanticClusterRows.filter((row) => isPersonaAUsableOpinion(row.opinion || row.scoredText || "", theme, userOpinion).keep)
      : semanticClusterRows;
    const hasSemanticRows = visibleSemanticClusterRows.length > 0;
    const baseProcessedClusterRows =
      clusterMethod === "semantic" && hasSemanticRows ? visibleSemanticClusterRows : textClusterRows;
    const processedClusterRowsWithAbsolute = baseProcessedClusterRows.map((row) => {
      const originalScore = axisScoreOnly(row.originalScore || row);
      const summary = clusterSummaries[`${clusterMethod}:${row.label}`];
      const fallbackReasons = ensureScoreReasons(row, row.scoredText || row.opinion, axisConfig);

      if (!summary) {
        return withClusterVolume({
          ...row,
          ...originalScore,
          absoluteScore: originalScore,
          originalScore,
          aiSummaryScore: null,
          scoreBasis: "representativeText",
          scoreReasons: fallbackReasons,
          independentOpinionVolume: row.independentOpinionVolume || row.uniqueCount || row.count || 1,
          spreadVolume: row.spreadVolume || row.originalCount || row.duplicateCount || row.count || 1,
          volumeForGraph: row.volumeForGraph || row.independentOpinionVolume || row.uniqueCount || row.count || 1,
          relevanceScore: row.relevanceScore ?? null,
          scoreConfidence: row.scoreConfidence ?? null,
          scoreWarnings: Array.isArray(row.scoreWarnings) ? row.scoreWarnings : [],
        });
      }

      const { text, basis } = chooseSummaryScoreText(summary, row.opinion);
      const aiSummaryScore = basis === "representativeText" ? null : scoreOpinion(text, themeCategory, axisConfig);
      const activeScore = axisScoreOnly(aiSummaryScore || originalScore);

      return withClusterVolume({
        ...row,
        ...activeScore,
        absoluteScore: activeScore,
        originalScore,
        aiSummaryScore,
        scoreBasis: basis,
        scoredText: text,
        scoreReasons: aiSummaryScore?.scoreReasons || fallbackReasons,
        independentOpinionVolume: row.independentOpinionVolume || row.uniqueCount || row.count || 1,
        spreadVolume: row.spreadVolume || row.originalCount || row.duplicateCount || row.count || 1,
        volumeForGraph: row.volumeForGraph || row.independentOpinionVolume || row.uniqueCount || row.count || 1,
        relevanceScore: aiSummaryScore?.relevanceScore ?? row.relevanceScore ?? null,
        scoreConfidence: aiSummaryScore?.scoreConfidence ?? row.scoreConfidence ?? null,
        scoreWarnings: Array.isArray(aiSummaryScore?.scoreWarnings)
          ? aiSummaryScore.scoreWarnings
          : Array.isArray(row.scoreWarnings)
            ? row.scoreWarnings
            : [],
      });
    });
    const scoreDistribution = calculateScoreDistribution(processedClusterRowsWithAbsolute);
    const resolvedScoreDisplayMode = selectDisplayScoreMode(scoreDisplayMode, scoreDistribution);
    const processedClusterRows = applyDisplayScores(
      normalizeRelativeScores(processedClusterRowsWithAbsolute),
      resolvedScoreDisplayMode
    );
    const strictStatsForKpi = {
      ...noiseBaseResult,
      candidateRows: strictCandidateRows,
      candidateCount: strictCandidateRows.length,
      analysisTargetCount: strictCandidateRows.length,
      independentOpinionCount: strictCandidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0),
      noiseExcludedRows: combinedNoiseExcludedRows,
      noiseExcludedCount: (noiseBaseResult.noiseExcludedCount || 0) + strictAllExcludedRows.length,
      borderlineUsefulRows: combinedBorderlineRows,
      borderlineUsefulCount: combinedBorderlineRows.length,
      noiseReasonCounts: combinedNoiseReasonCounts,
      noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
    };
    const retrievalKpi = buildRetrievalKpi(strictStatsForKpi, processedClusterRows, scoreDistribution);
    const semanticInputCount = hasSemanticRows
      ? visibleSemanticClusterRows.reduce((sum, row) => sum + (row.uniqueCount || 1), 0)
      : 0;
    const semanticOriginalCount = hasSemanticRows
      ? visibleSemanticClusterRows.reduce((sum, row) => sum + (row.originalCount || row.count || 0), 0)
      : 0;
    const noiseProcessingResult = {
      ...noiseBaseResult,
      candidateRows: strictCandidateRows,
      preStrictCandidateCount: noiseBaseResult.candidateRows.length,
      candidateCount: strictCandidateRows.length,
      analysisTargetCount: strictCandidateRows.length,
      independentOpinionCount: strictCandidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0),
      noiseExcludedRows: combinedNoiseExcludedRows,
      noiseExcludedCount: (noiseBaseResult.noiseExcludedCount || 0) + strictAllExcludedRows.length,
      borderlineUsefulRows: combinedBorderlineRows,
      borderlineUsefulCount: combinedBorderlineRows.length,
      noiseReasonCounts: combinedNoiseReasonCounts,
      noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
      personaAStrictRelevance: {
        enabled: personaAStrictResult.enabled,
        excludedCount: strictExcludedRows.length,
        ambiguousExcludedCount: strictBorderlineRows.length,
        borderlineCount: strictBorderlineRows.length,
        exclusionCounts: personaAStrictResult.exclusionCounts || {},
        referenceDisplay: personaAStrictResult.referenceDisplay,
      },
      clusterCount: processedClusterRows.length,
      textClusterCount: textClusterRows.length,
      threshold: clusterThreshold,
      clusterMethod,
      semanticThreshold,
      semanticInputCount,
      semanticClusterCount: hasSemanticRows ? visibleSemanticClusterRows.length : null,
      semanticClusterCompressionRate:
        semanticInputCount > 0 ? 1 - visibleSemanticClusterRows.length / semanticInputCount : null,
      semanticOriginalCount,
      noiseExcludedUniqueCount: noiseBaseResult.noiseExcludedCount,
      analysisTargetRate:
        noiseBaseResult.rawCount > 0 ? strictCandidateRows.length / noiseBaseResult.rawCount : 0,
      clusterCompressionRate:
        strictCandidateRows.length > 0
          ? 1 - processedClusterRows.length / strictCandidateRows.length
          : 0,
      retrievalKpi,
      overallRetrievalQuality: retrievalKpi.overallRetrievalQuality,
      diversityScore: retrievalKpi.diversityScore,
      readLoadScore: retrievalKpi.readLoadScore,
      costEfficiencyScore: retrievalKpi.costEfficiencyScore,
    };

    const rawRowsWithAbsolute = [user, ...rawExternalRows].map((row) => ({
      ...row,
      absoluteScore: axisScoreOnly(row.absoluteScore || row),
    }));
    const displayRawRows = applyDisplayScores(normalizeRelativeScores(rawRowsWithAbsolute), resolvedScoreDisplayMode);
    const displayUser = displayRawRows[0] || user;
    const displayRawExternalRows = displayRawRows.slice(1);
    const rawAverage = makeAverageRow(displayRawExternalRows, "取得直後の平均", "処理前外部意見平均", "average");
    const processedAverage = makeAverageRow(
      processedClusterRows,
      "分析対象クラスタの平均",
      "処理後クラスタ平均",
      "processed-average"
    );
    const baseRows = [displayUser, ...displayRawExternalRows];
    const rawAverageRows = displayRawExternalRows.length > 0 ? [rawAverage] : [];
    const processedAverageRows = processedClusterRows.length > 0 ? [processedAverage] : [];
    const graphRowsByMode = {
      raw: [displayUser, ...displayRawExternalRows, ...rawAverageRows],
      processed: [displayUser, ...processedClusterRows, ...processedAverageRows],
      compare: [displayUser, ...displayRawExternalRows, ...processedClusterRows, ...rawAverageRows, ...processedAverageRows],
    };

    return {
      user: displayUser,
      avg: rawAverage,
      rawAverage,
      processedAverage,
      noiseProcessingResult,
      rawExternalRows: displayRawExternalRows,
      textClusterRows,
      processedClusterRows,
      scoreDistribution,
      scoreDisplayMode,
      resolvedScoreDisplayMode,
      scoreConcentrationDetected: hasConcentratedScoreDistribution(scoreDistribution),
      clusterTableRows: [...processedClusterRows].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label, "en", { numeric: true });
      }),
      graphRows: viewMode === "user" ? graphRowsByMode.processed : graphRowsByMode[graphMode] || graphRowsByMode.raw,
      rows: [displayUser, ...displayRawExternalRows, rawAverage],
      tableRows: sortRows(baseRows, sortKey, sortDirection),
    };
  }, [
    userOpinion,
    externalOpinions,
        personaMode,
        analysisPurposeMode,
        selectedVoiceDirections,
    theme,
    themeCategory,
    axisConfig,
    graphMode,
    viewMode,
    clusterThreshold,
    clusterMethod,
    semanticThreshold,
    semanticClusterRows,
    clusterSummaries,
    scoreDisplayMode,
    noiseFilteringEnabled,
    noiseRelevanceThreshold,
    sortKey,
    sortDirection,
  ]);

  const personaUxLens = useMemo(
    () =>
      applyPersonaUxLens({
        personaMode,
        themeCategory,
        axisConfig,
        queryCandidates: xQueryCandidates,
        clusters: result.clusterTableRows,
        userOpinion,
      }),
    [personaMode, themeCategory, axisConfig, xQueryCandidates, result.clusterTableRows, userOpinion]
  );
  const userFeedback = useMemo(
    () =>
      buildUserFeedback({
        personaMode,
        analysisPurposeMode,
        themeCategory,
        personaUxLens,
        theme,
        sampleKey,
        userOpinion,
        axisConfig,
        userScore: result.user,
        clusters: result.clusterTableRows,
        processedAverage: result.processedAverage,
        clusterSummaries,
        activeClusterMethod: currentClusterDisplayLabel(),
        effectiveQuery,
        queryAxisWarnings,
        selectedAxisLinkedKeywords,
        scoreMode: scoreDisplayMode,
        noiseProcessingResult: result.noiseProcessingResult,
        axisLabel,
        getScoreForDisplay,
        scoreDisplayModeLabel,
        truncateText,
        personaConfigFor,
        analysisPurposeConfigFor,
        JP_UI_LABELS,
      }),
    [personaMode, analysisPurposeMode, themeCategory, personaUxLens, theme, sampleKey, userOpinion, axisConfig, result, clusterSummaries, effectiveQuery, queryAxisWarnings, selectedAxisLinkedKeywords, scoreDisplayMode]
  );
  const zone11DisplayTitle =
    personaMode === "personaA" && themeCategory === "romance"
      ? JP_UI_LABELS.romanceMap
      : "あなたの論点マップ";
  const mojibakeLabelWarnings = useMemo(() => {
    const userFacingLabels = [
      ["feedbackTitle", currentPersonaConfig.feedbackTitle],
      ...Object.entries(JP_UI_LABELS).map(([key, value]) => [`JP_UI_LABELS.${key}`, value]),
      ...userFeedback.personaSections.flatMap(([title], index) => [[`personaSections.${index}.title`, title]]),
    ];

    return uniqueValues(
      userFacingLabels
        .filter(([, label]) => looksLikeMojibake(label))
        .map(([key, label]) => `${key}: ${label}`)
    );
  }, [currentPersonaConfig.feedbackTitle, userFeedback]);
  const axisQualityWarnings = useMemo(() => buildAxisQualityWarnings(draftAxisConfig), [draftAxisConfig]);
  const scoreConcentrationMessages = useMemo(() => {
    const distribution = result.scoreDistribution || {};
    return ["x", "y", "z"]
      .filter((axis) => distribution[axis]?.concentrated)
      .map((axis) => {
        const stats = distribution[axis];
        return `${axisLabel(axis, axisConfig)} はスコアが${stats.mostCommonScore}付近に集中しています。標準偏差 ${stats.standardDeviation.toFixed(2)}、範囲 ${stats.min}-${stats.max}、最多値比率 ${formatPercent(stats.mostCommonScoreRatio)} です。この軸で差を見たい場合は、関連キーワードを追加して再取得してください。`;
      });
  }, [result.scoreDistribution, axisConfig]);
  const currentClusterHash = useMemo(
    () =>
      stableHash({
        dataset: currentDatasetHash,
        clusterMethod,
        clusterThreshold,
        semanticThreshold,
        axisConfig,
        scoreDisplayMode,
        noiseFilteringEnabled,
        clusters: (result.clusterTableRows || []).map((cluster) => ({
          label: cluster.label,
          count: cluster.count,
          independentOpinionVolume: cluster.independentOpinionVolume,
          spreadVolume: cluster.spreadVolume,
          volumeForGraph: cluster.volumeForGraph,
          x: cluster.x,
          y: cluster.y,
          z: cluster.z,
          summary: clusterSummaries[`${clusterMethod}:${cluster.label}`]?.title || "",
        })),
      }),
    [
      currentDatasetHash,
      clusterMethod,
      clusterThreshold,
      semanticThreshold,
      axisConfig,
      scoreDisplayMode,
      noiseFilteringEnabled,
      result.clusterTableRows,
      clusterSummaries,
    ]
  );
  const currentAnalysisHash = useMemo(
    () =>
      stableHash({
        dataset: currentDatasetHash,
        cluster: currentClusterHash,
        graphMode,
        scoreDisplayMode,
        noiseFilteringEnabled,
        personaMode,
        feedback: userFeedback,
        summaries: clusterSummaries,
      }),
    [currentDatasetHash, currentClusterHash, graphMode, scoreDisplayMode, noiseFilteringEnabled, personaMode, userFeedback, clusterSummaries]
  );

  useEffect(() => {
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveClusterRunId("");
  }, [externalOpinions, sampleKey, noiseFilteringEnabled]);

  useEffect(() => {
    setExpandedClusterIds({});
    setSelectedClusterId("");
  }, [clusterMethod, clusterThreshold]);

  useEffect(() => {
    if (hasManualHashtagSelection) {
      return;
    }

    setSelectedHashtagCandidates((previous) => {
      const next = autoSelectedHashtagValues;
      if (previous.length === next.length && previous.every((item, index) => item === next[index])) {
        return previous;
      }

      return next;
    });
  }, [autoSelectedHashtagValues, hasManualHashtagSelection]);

  useEffect(() => {
    const hashByKey = {
      saveDataset: currentDatasetHash,
      saveCluster: currentClusterHash,
      copyAnalysis: currentAnalysisHash,
    };

    setOperationStatus((previous) => {
      let changed = false;
      const next = { ...previous };

      Object.entries(hashByKey).forEach(([key, hash]) => {
        const operation = previous[key];
        if (operation?.status === "success" && operation.targetHash && operation.targetHash !== hash) {
          next[key] = {
            ...operation,
            status: "idle",
            message: key === "copyAnalysis" ? "未コピー" : "未保存",
            lastTargetSummary: "",
            targetHash: "",
          };
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [currentDatasetHash, currentClusterHash, currentAnalysisHash]);

  useEffect(() => {
    if (!activeDatasetMatchesCurrent || !activeDataset) {
      return;
    }

    setOperationStatus((previous) => {
      const current = previous.saveDataset || EMPTY_OPERATION_STATUS;
      if (current.status === "success" && current.targetHash === currentDatasetHash) {
        return previous;
      }

      return {
        ...previous,
        saveDataset: {
          ...current,
          status: "success",
          message: `保存済み ${formatHistoryDate(activeDataset.savedAt)} / ${activeDataset.count || currentOpinionCount}件 / ${truncateText(activeDataset.theme || theme, 60)}`,
          lastSuccessAt: activeDataset.savedAt || current.lastSuccessAt,
          lastTargetSummary: activeDataset.datasetId,
          lastErrorMessage: "",
          targetHash: currentDatasetHash,
        },
      };
    });
  }, [activeDatasetMatchesCurrent, activeDataset, currentDatasetHash, currentOpinionCount, theme]);

  function clusterExpansionKey(cluster) {
    return `${clusterMethod}:${cluster.label}`;
  }

  function clusterSummaryKey(cluster) {
    return `${clusterMethod}:${cluster.label}`;
  }

  function toggleClusterMembers(cluster) {
    const key = clusterExpansionKey(cluster);

    setExpandedClusterIds((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  function clusterRowDomId(label) {
    return `cluster-row-${stableHash(`${clusterMethod}:${label}`)}`;
  }

  function selectClusterFromGraph(label) {
    if (!label) {
      return;
    }

    const cluster = result.clusterTableRows.find((row) => row.label === label);
    setSelectedClusterId(label);

    if (cluster) {
      const key = clusterExpansionKey(cluster);
      setExpandedClusterIds((previous) => ({
        ...previous,
        [key]: true,
      }));
    }

    window.setTimeout(() => {
      const element = document.getElementById(clusterRowDomId(label));
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function clearActiveClusterRunState() {
    setActiveClusterRunId("");
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
  }

  function notify(type, message) {
    setToast({ type, message, createdAt: Date.now() });
  }

  function setOperationRunning(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "running",
        message,
        lastRunAt: now,
        lastTargetSummary: targetSummary,
        targetHash,
        lastErrorMessage: "",
      },
    }));
  }

  function setOperationSuccess(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "success",
        message,
        lastSuccessAt: now,
        lastTargetSummary: targetSummary,
        targetHash,
        lastErrorMessage: "",
      },
    }));
    notify("success", message);
  }

  function setOperationError(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "error",
        message,
        lastErrorAt: now,
        lastErrorMessage: message,
        lastTargetSummary: targetSummary,
        targetHash,
      },
    }));
    notify("error", message);
  }

  function resetAutoSummaryState() {
    setIsAutoSummarizing(false);
    setAutoSummaryStatus("未実行");
    setAutoSummaryError("");
    setAutoSummaryProgress({ completed: 0, total: 0, success: 0, failed: 0 });
  }

  function buildClusterSummaryItems(cluster) {
    const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];

    return memberRows
      .slice(0, 10)
      .map((member, index) => ({
        id: String(member.id || index + 1),
        text: String(member.text || "").slice(0, 800),
        duplicateCount: member.duplicateCount || 1,
      }))
      .filter((item) => item.text.trim());
  }

  function chooseSummaryScoreText(summary, representativeText) {
    const supportText = representativeText ? `\n\n代表本文: ${representativeText}` : "";

    if (summary?.cleanOpinion) {
      return { text: `${summary.cleanOpinion}${supportText}`, basis: "cleanOpinion" };
    }

    if (summary?.summary) {
      return { text: `${summary.summary}${supportText}`, basis: "summary" };
    }

    if (summary?.title && summary?.summary) {
      return { text: `${summary.title} ${summary.summary}${supportText}`, basis: "summary" };
    }

    return { text: representativeText || "", basis: "representativeText" };
  }

  function enrichClusterSummary(summary, cluster, sourceItems) {
    const originalScore = axisScoreOnly(cluster.originalScore || cluster);
    const { text, basis } = chooseSummaryScoreText(summary, cluster.opinion);
    const aiSummaryScore = basis === "representativeText" ? null : scoreOpinion(text, themeCategory, axisConfig);

    return {
      ...summary,
      sourceItems,
      scoredText: text,
      score: axisScoreOnly(aiSummaryScore || originalScore),
      originalScore,
      aiSummaryScore,
      scoreBasis: basis,
      scoreReasons: aiSummaryScore?.scoreReasons || ensureScoreReasons(cluster, text, axisConfig),
      relevanceScore: aiSummaryScore?.relevanceScore ?? cluster.relevanceScore ?? null,
      scoreConfidence: aiSummaryScore?.scoreConfidence ?? cluster.scoreConfidence ?? null,
      scoreWarnings: Array.isArray(aiSummaryScore?.scoreWarnings)
        ? aiSummaryScore.scoreWarnings
        : Array.isArray(cluster.scoreWarnings)
          ? cluster.scoreWarnings
          : [],
    };
  }

  async function requestClusterSummary(cluster, options = {}) {
    const items = buildClusterSummaryItems(cluster);

    if (items.length === 0) {
      throw new Error("要約対象の元意見がありません。");
    }

    const response = await fetch(`${API_BASE_URL}/api/cluster-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: options.signal || autoSummaryAbortControllerRef.current?.signal,
      body: JSON.stringify({
        clusterId: cluster.label,
        representativeText: cluster.opinion,
        items,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        PUBLIC_PREVIEW_MODE
          ? "AI要約に失敗しました。元意見の表示は引き続き利用できます。"
          : payload.error || "AI要約に失敗しました。元意見の表示は引き続き利用できます。"
      );
    }

    return enrichClusterSummary(payload, cluster, items);
  }

  async function handleRunClusterSummary(cluster) {
    const key = clusterSummaryKey(cluster);

    setClusterSummaryErrorById((previous) => ({ ...previous, [key]: "" }));
    setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: true }));

    try {
      const payload = await requestClusterSummary(cluster);

      setClusterSummaries((previous) => ({
        ...previous,
        [key]: payload,
      }));
    } catch (error) {
      setClusterSummaryErrorById((previous) => ({
        ...previous,
        [key]: error.message || "AI要約に失敗しました。元意見の表示は引き続き利用できます。",
      }));
    } finally {
      setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: false }));
    }
  }

  async function handleRunAutoSummary() {
    if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
      const shouldContinue = window.confirm(
        "現在、意味クラスタは未実行です。\nこのまま実行すると、文字類似クラスタを対象にAI要約します。\n意味クラスタを使いたい場合は、先に「意味クラスタを実行」を押してください。\nこのままAI要約しますか？"
      );

      if (!shouldContinue) {
        return;
      }
    }

    const sortedClusters = [...result.clusterTableRows].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label, "en", { numeric: true });
    });
    const targets = sortedClusters
      .filter((cluster) => !clusterSummaries[clusterSummaryKey(cluster)])
      .slice(0, Math.min(15, autoSummaryLimit));

    if (targets.length === 0) {
      setAutoSummaryStatus("要約対象の未要約クラスタはありません。");
      setAutoSummaryError("");
      setAutoSummaryProgress({ completed: 0, total: 0, success: 0, failed: 0 });
      setOperationSuccess("autoSummary", "要約対象の未要約クラスタはありません。");
      return;
    }

    if (
      !window.confirm(
        `上位${targets.length}クラスタをAI要約します。OpenAI APIを使用します。実行しますか？`
      )
    ) {
      return;
    }

    autoSummaryAbortControllerRef.current?.abort();
    autoSummaryAbortControllerRef.current = new AbortController();
    autoSummaryStopRequestedRef.current = false;
    setIsAutoSummarizing(true);
    setOperationRunning("autoSummary", `AI要約中... 0 / ${targets.length}`, `上位${targets.length}件`);
    setAutoSummaryError("");
    setAutoSummaryStatus(`実行中：0 / ${targets.length} 件完了`);
    setAutoSummaryProgress({ completed: 0, total: targets.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      if (autoSummaryStopRequestedRef.current) {
        break;
      }

      const cluster = targets[index];
      const key = clusterSummaryKey(cluster);

      setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: true }));
      setClusterSummaryErrorById((previous) => ({ ...previous, [key]: "" }));

      try {
        const payload = await requestClusterSummary(cluster, {
          signal: autoSummaryAbortControllerRef.current?.signal,
        });
        success += 1;
        setClusterSummaries((previous) => ({
          ...previous,
          [key]: payload,
        }));
      } catch (error) {
        if (error?.name === "AbortError" || autoSummaryStopRequestedRef.current) {
          setClusterSummaryErrorById((previous) => ({
            ...previous,
            [key]: "AI要約を停止しました。",
          }));
          break;
        }

        failed += 1;
        setClusterSummaryErrorById((previous) => ({
          ...previous,
          [key]: error.message || "AI要約に失敗しました。元意見の表示は引き続き利用できます。",
        }));
      } finally {
        const completed = index + 1;
        setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: false }));
        setAutoSummaryProgress({ completed, total: targets.length, success, failed });
        setAutoSummaryStatus(`実行中：${completed} / ${targets.length} 件完了`);
        setOperationRunning("autoSummary", `AI要約中... ${completed} / ${targets.length}`, `成功${success} / 失敗${failed}`);
      }
    }

    setIsAutoSummarizing(false);
    autoSummaryAbortControllerRef.current = null;

    if (autoSummaryStopRequestedRef.current) {
      setAutoSummaryStatus(`停止：${success}件のAI要約が完了しました`);
      setAutoSummaryError("");
      setOperationError("autoSummary", `AI要約を停止しました。完了 ${success}件`);
      return;
    }

    if (failed > 0) {
      setAutoSummaryStatus(`一部失敗：${targets.length}件中${success}件成功、${failed}件失敗`);
      setAutoSummaryError(`${failed}件のAI要約に失敗しました。失敗したクラスタは個別に再要約できます。`);
      setOperationError("autoSummary", `一部失敗：${targets.length}件中${success}件成功、${failed}件失敗`);
      return;
    }

    setAutoSummaryStatus(`完了：${success}件のクラスタをAI要約しました`);
    setOperationSuccess("autoSummary", `${success}件のクラスタをAI要約しました。`);
  }

  async function handleRunSemanticCluster() {
    const candidateRows = result.noiseProcessingResult.candidateRows || [];
    const limitedRows = candidateRows.slice(0, 100);

    setClusterMethod("semantic");
    setSemanticClusterError("");
    clearActiveClusterRunState();

    if (limitedRows.length < 5) {
      setSemanticClusterRows([]);
      setSemanticClusterStatus("分析対象が少なすぎるため、意味クラスタを実行できません。クラスタリング前に取得条件を改善してください。");
      setOperationError("semanticCluster", "分析対象が少なすぎるため、意味クラスタを実行できません。");
      return;
    }

    setIsSemanticClusterLoading(true);
    setSemanticClusterStatus(`意味クラスタを実行中... ${limitedRows.length}件を送信しています。`);
    setOperationRunning("semanticCluster", `意味クラスタ実行中... ${limitedRows.length}件`, `threshold ${semanticThreshold}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/semantic-cluster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threshold: semanticThreshold,
          items: limitedRows.map((row, index) => ({
            id: String(row.originalNo || index + 1),
            text: row.normalizedText,
            duplicateCount: row.duplicateCount || 1,
          })),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "意味クラスタに失敗しました。");
      }

      const rows = (payload.clusters || []).map((cluster, index) => {
        const representativeText = cluster.representativeText || "";
        const uniqueCount = Math.max(0, Number(cluster.count) || 0);
        const originalCount = Math.max(uniqueCount, Number(cluster.duplicateCount) || uniqueCount);
        const independentOpinionVolume = Math.max(1, uniqueCount || 1);
        const spreadVolume = Math.max(independentOpinionVolume, originalCount);

        return withClusterVolume({
          originalNo: "-",
          label: cluster.id || `C${index + 1}`,
          type: `意味クラスタ ${cluster.id || `C${index + 1}`}`,
          opinion: representativeText,
          group: "cluster",
          count: independentOpinionVolume,
          originalCount,
          uniqueCount,
          independentOpinionVolume,
          spreadVolume,
          volumeForGraph: independentOpinionVolume,
          duplicateCount: Math.max(0, spreadVolume - independentOpinionVolume),
          semanticItemIds: Array.isArray(cluster.itemIds) ? cluster.itemIds : [],
          memberRows: (cluster.items || []).map((item, memberIndex) => ({
            no: memberIndex + 1,
            id: String(item.id || memberIndex + 1),
            label: String(item.id || memberIndex + 1),
            duplicateCount: Math.max(1, Number(item.duplicateCount) || 1),
            independentOpinionVolume: 1,
            spreadVolume: Math.max(1, Number(item.duplicateCount) || 1),
            text: String(item.text || ""),
            originalText: String(item.text || ""),
          })),
          ...scoreOpinion(representativeText, themeCategory, axisConfig),
        });
      });

      setSemanticClusterRows(rows);
      setExpandedClusterIds({});
      setSemanticClusterStatus(
        `成功: ${payload.inputCount || limitedRows.length}件を${rows.length}クラスタにまとめました。`
      );
      setOperationSuccess(
        "semanticCluster",
        `${payload.inputCount || limitedRows.length}件を${rows.length}クラスタにまとめました。`,
        `threshold ${semanticThreshold}`
      );
    } catch (error) {
      setSemanticClusterRows([]);
      setSemanticClusterError(error.message || "意味クラスタに失敗しました。");
      setSemanticClusterStatus("");
      setOperationError("semanticCluster", `意味クラスタに失敗しました。理由：${error.message || "不明"}`);
    } finally {
      setIsSemanticClusterLoading(false);
    }
  }

  function buildAnalysisMarkdown() {
    return createAnalysisMarkdown({
      activeClusterRunId,
      activeDataset,
      activeDatasetId,
      analysisMode,
      axisConfig,
      axisLabels,
      axisLinkedKeywords,
      axisQualityWarnings,
      clusterMethod,
      clusterSummaries,
      clusterSummaryKey,
      currentAnalysisPurposeConfig,
      currentOpinionCount,
      currentPersonaConfig,
      currentSample,
      currentSessionSampleLabel,
      effectiveQuery,
      generatedBasicKeywords,
      generatedXQueryCandidates,
      graphMode,
      hashtagCandidates,
      isSampleSession,
      personaAAnalysisMemoItems,
      personaMode,
      personaModeHistory,
      queryAxisWarnings,
      queryReviewParts,
      result,
      safeQueryPreview,
      sampleKey,
      sampleNoForKey,
      scoreBasisLabel,
      scoreDisplayMode,
      scoreReasonForDisplay,
      selectedAxisLinkedKeywords,
      selectedExcludeTermValues,
      selectedHashtagValues,
      selectedVoiceDirections,
      selectedXQueryCandidates,
      semanticClusterError,
      semanticClusterRows,
      semanticClusterStatus,
      semanticThreshold,
      stagedCurrentDataCount,
      stagedFetchEnabled,
      stagedFetchState,
      stagedNextFetchCount,
      stagedRemainingCount,
      theme,
      themeCategory,
      userFeedback,
      userOpinion,
      userReferenceGraphMessage,
      userReferenceGraphWarning,
      viewMode,
      voiceDirectionLabel,
      xDataStatus,
      xMaxResults,
      xPosts,
      xQueryCandidates,
      zone11DisplayTitle,
      zone12Filter,
      zone12HighlightTerms,
      zone12TopNoiseReasons,
      zone12ZeroAnalysisSummary,
    });
  }

  async function handleCopyAnalysisResult() {
    setOperationRunning("copyAnalysis", "分析結果をコピー中...", `${result.clusterTableRows.length}クラスタ`, currentAnalysisHash);
    await waitForNextPaint();

    try {
      await navigator.clipboard.writeText(buildAnalysisMarkdown());
      setCopyStatus("success");
      setOperationSuccess(
        "copyAnalysis",
        `コピー済み ${formatHistoryDate(new Date().toISOString())} / 分析結果Markdownをコピーしました`,
        `${result.clusterTableRows.length}クラスタ / ${currentOpinionCount}件`,
        currentAnalysisHash
      );
    } catch (error) {
      setCopyStatus("error");
      setOperationError(
        "copyAnalysis",
        `コピーに失敗しました。理由：${error.message || "ブラウザ権限を確認してください。"}`,
        "",
        currentAnalysisHash
      );
    }

    window.setTimeout(() => setCopyStatus(""), 3500);
  }

  void useMemo(() => {
    const opinions = externalOpinions
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const baseRows = [
      {
        originalNo: "-",
        label: "自分の意見",
        type: "自分の意見",
        opinion: userOpinion,
        group: "user",
        ...scoreOpinion(userOpinion, themeCategory, axisConfig),
      },
      ...opinions.map((opinion, index) => ({
        originalNo: index + 1,
        label: String(index + 1),
        type: `外部意見${index + 1}`,
        opinion,
        group: "external",
        ...scoreOpinion(opinion, themeCategory, axisConfig),
      })),
    ];

    const externalRows = baseRows.filter((row) => row.group === "external");
    const user = baseRows.find((row) => row.group === "user");

    const avg = {
      originalNo: "-",
      label: "平均",
      type: "外部意見平均",
      group: "average",
      opinion: "外部意見の平均",
      x: Math.round(externalRows.reduce((sum, row) => sum + row.x, 0) / externalRows.length),
      y: Math.round(externalRows.reduce((sum, row) => sum + row.y, 0) / externalRows.length),
      z: Math.round(externalRows.reduce((sum, row) => sum + row.z, 0) / externalRows.length),
    };

    return {
      user,
      avg,
      rows: [...baseRows, avg],
      tableRows: sortRows(baseRows, sortKey, sortDirection),
    };
  }, [userOpinion, externalOpinions, themeCategory, axisConfig, sortKey, sortDirection]);

  function colorOf(row, volumeDomain = null) {
    if (row.group === "user") return "#ef4444";
    if (row.group === "average") return "#7c3aed";
    if (row.group === "processed-average") return "#a855f7";
    if (row.group === "cluster") return normalizeClusterVolume(row, volumeDomain);
    return "#2563eb";
  }

  function sizeOf(row, volumeDomain = null) {
    if (row.group === "user") return 14;
    if (row.group === "average" || row.group === "processed-average") return 12;
    if (row.group === "cluster") return markerSizeForVolume(row, volumeDomain);
    return 8;
  }

  function markerSymbolOf(row) {
    if (row.group === "user") return "diamond";
    if (row.group === "average" || row.group === "processed-average") return "square";
    return "circle";
  }

  function analysisText() {
    const user = result.user;
    const avg = result.avg;

    if (isSampleSession && currentSample.analysis) {
      return currentSample.analysis;
    }

    if (user.z >= 8 && user.y >= 8 && user.x <= 3) {
      return "あなたの意見は、深さ・視座が高く、人数軸では少数派寄りです。3DE上では、まだ大衆化していない高次仮説として扱えます。";
    }

    if (user.x >= 8 && user.y <= 4 && user.z <= 4) {
      return "あなたの意見は、生活に近く、多くの人が反応しやすい位置にあります。現場感覚や生活実感を拾う意見です。";
    }

    if (user.y >= avg.y && user.z >= avg.z) {
      return "あなたの意見は、外部意見平均よりも深さ・視座が高めです。論点整理や提案の核になり得ます。";
    }

    return "あなたの意見は、外部意見の分布内にあります。どの軸を伸ばすかによって、生活密着型にも構造提案型にも展開できます。";
  }

  function currentXDataStateLabel() {
    if (xDataStatus === "empty") return "未取得";
    if (xDataStatus === "cached") return "保存済みデータを使用中";
    if (xDataStatus === "unsaved") return "未保存の新規取得データ";
    if (xDataStatus === "fetching") return "X API取得中";
    return "サンプルまたは手入力データ";
  }

  function currentInputSourceLabel() {
    if (xDataStatus === "sample") return "サンプルデータ";
    if (xPosts.length > 0 || xDataStatus === "fetching" || xDataStatus === "cached") return "X";
    if (externalOpinions.trim()) return "手入力";
    return "未入力";
  }

  function currentClusterDisplayLabel() {
    if (clusterMethod === "semantic" && semanticClusterRows.length > 0) {
      return "意味クラスタ";
    }

    return "文字類似クラスタ";
  }

  function semanticClusterStateLabel() {
    if (isSemanticClusterLoading) return "実行中";
    if (semanticClusterError) return "エラー";
    if (semanticClusterRows.length > 0) {
      return `成功 ${result.noiseProcessingResult.semanticInputCount || 0}件 → ${semanticClusterRows.length}クラスタ`;
    }

    return "未実行";
  }

  function summaryTargetClusterLabel() {
    return currentClusterDisplayLabel();
  }

  function summarizedClusterCount() {
    return result.clusterTableRows.filter((cluster) => clusterSummaries[clusterSummaryKey(cluster)]).length;
  }

  function opinionRowClass(row) {
    const classes = [];
    if (row.group === "user") classes.push("user-row");
    if (row.noiseReason || row.type === "ノイズ" || row.type === "除外" || row.group === "noise") {
      classes.push("noise-row");
    }
    if (/広告|PR|業者|占い|文字化け|低関連/.test(`${row.type || ""} ${row.noiseReason || ""}`)) {
      classes.push("noise-row");
    }
    return classes.join(" ");
  }

  const {
    zone12HighlightTerms,
    zone12ExcludeTerms,
    zone12FilteredRows,
    zone12Counts,
    zone12TopNoiseReasons,
    zone12ZeroAnalysisSummary,
    zone12TermHits,
    extractZone12Hashtags,
    zone12StatusForRow,
    zone12ReasonForRow,
    renderHighlightedZone12Text,
  } = createZone12ViewModel({
    result,
    zone12Filter,
    queryReviewParts,
    stagedFetchState,
    themeCategory,
    axisConfig,
    viewMode,
    JP_UI_LABELS,
    NOISE_CATEGORY_LABELS,
    uniqueValues,
    looksLikeMojibake,
    safeRuntimeText,
    queryToSafeIncludeGroups,
  samples,
  scoreOpinion,
    normalizeOpinionText,
  });

  const {
    userReferenceGraphWarning,
    userReferenceGraphMessage,
    personaAAnalysisMemoItems,
  } = createZone11ViewModel({
    viewMode,
    result,
    currentOpinionCount,
    selectedVoiceDirections,
    currentAnalysisPurposeConfig,
    stagedFetchState,
    JP_UI_LABELS,
    NOISE_CATEGORY_LABELS,
    normalizeVoiceDirections,
    voiceDirectionLabel,
    queryDiagnosisLabel,
  });

  function workflowClass(status) {
    if (status === "done") return "workflow-step done";
    if (status === "current") return "workflow-step current";
    return "workflow-step pending";
  }

  function currentSaveTargetPreview() {
    const stats = result.noiseProcessingResult;
    const inputCount = stats.candidateCount || 0;
    const clusterCount = result.clusterTableRows.length;
    const compressionRate = inputCount > 0 ? (1 - clusterCount / inputCount) : 0;

    if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
      return {
        text: "意味類似 OpenAI は未実行です。先に「意味クラスタを実行」を押してください。",
        warning: true,
      };
    }

    const methodLabel = clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似";
    const threshold = clusterMethod === "semantic" ? semanticThreshold : clusterThreshold;

    return {
      text: `${methodLabel} / しきい値 ${threshold.toFixed(2)} / ${inputCount}件 → ${clusterCount}クラスタ / 圧縮率 ${formatPercent(compressionRate)}`,
      warning: false,
    };
  }

  function getNextAction() {
    const hasThemeAndOpinion = Boolean(theme.trim() && userOpinion.trim());
    const hasDraftOrQueryCandidates = Boolean(
      (generatedXQueryCandidates && generatedXQueryCandidates.length > 0) ||
        selectedXQueryCandidates.length > 0 ||
        effectiveQuery.trim()
    );
    const hasClusters = result.clusterTableRows.length > 0;
    const hasSemanticClusters = semanticClusterRows.length > 0;
    const hasSummaries = summarizedClusterCount() > 0;

    if (!hasThemeAndOpinion) {
      return {
        label: "テーマと自分の意見を入力",
        targetZone: "Zone①",
        actionType: "input",
        buttonText: "テーマと自分の意見を入力",
        help: "テーマと自分の意見を入力すると、分析を開始できます。",
        disabled: true,
      };
    }

    if (!hasDraftOrQueryCandidates) {
      return {
        label: "AIで評価軸を設定",
        targetZone: "Zone②",
        actionType: "aiDraft",
        buttonText: "AIで評価軸を設定",
        help: "テーマと自分の意見から、評価軸・検索クエリ候補を作ります。",
      };
    }

    if (!hasFetchedExternalData) {
      return {
        label: "Xから取得",
        targetZone: "Zone③",
        actionType: "fetchX",
        buttonText: "Xから取得して外部意見欄に反映",
        help: "検索条件を確認して、外部意見を取得します。",
        disabled: isEffectiveQueryTooLong,
      };
    }

    if (canRescoreWithCurrentAxis) {
      return {
        label: "現在の評価軸で再スコアリング",
        targetZone: "Zone②",
        actionType: "rescore",
        buttonText: "現在の評価軸で再スコアリング",
        help: "取得済みの外部意見を、現在の評価軸で評価し直します。",
      };
    }

    if (clusterMethod === "semantic" && !hasSemanticClusters) {
      return {
        label: "意味クラスタを実行",
        targetZone: "Zone④",
        actionType: "semanticCluster",
        buttonText: "意味クラスタを実行",
        help: "OpenAI embeddingsで意味が近い意見をまとめます。",
      };
    }

    if (!hasClusters) {
      return {
        label: "クラスタリングを確認",
        targetZone: "Zone④",
        actionType: "cluster",
        buttonText: "クラスタリングを確認",
        help: "処理後クラスタが表示されていません。外部意見と評価軸を確認してください。",
      };
    }

    if (!hasSummaries) {
      return {
        label: "上位クラスタを一括AI要約",
        targetZone: "Zone⑤",
        actionType: "summary",
        buttonText: `上位${autoSummaryLimit}クラスタを一括AI要約`,
        help: "クラスタ内の元意見をAIで読み取り、説明しやすい日本語に整理します。",
      };
    }

    return {
      label: "Zone⑪ ユーザーへのフィードバックを見る",
      targetZone: "Zone⑪",
      actionType: "viewFeedback",
      buttonText: "Zone⑪を見る",
      help: "自分の意見の位置づけ、近いクラスタ、足りない視点を確認します。",
    };
  }

  function handleNextAction() {
    const nextAction = getNextAction();

    if (nextAction.disabled) {
      return;
    }

    if (nextAction.actionType === "aiDraft") {
      handleGenerateAnalysisDraft();
      return;
    }

    if (nextAction.actionType === "fetchX") {
      handleFetchXButtonClick();
      return;
    }

    if (nextAction.actionType === "rescore") {
      rescoreWithCurrentAxis();
      return;
    }

    if (nextAction.actionType === "semanticCluster") {
      handleRunSemanticCluster();
      return;
    }

    if (nextAction.actionType === "summary") {
      handleRunAutoSummaries();
      return;
    }

    if (nextAction.actionType === "viewFeedback") {
      document.querySelector(".zone-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function scoreBasisLabel(value) {
    if (value === "cleanOpinion") return "AI整文済み意見";
    if (value === "summary") return "AI要約";
    return "代表本文";
  }

  function scoreReasonForDisplay(row, axis) {
    return ensureScoreReasons(row, row?.scoredText || row?.opinion || "", axisConfig)?.[axis];
  }

  function renderScoreReasonGrid(row) {
    return (
      <div className="score-reason-grid">
        {["x", "y", "z"].map((axis) => {
          const reason = scoreReasonForDisplay(row, axis);
          const axisItem = axisExplanationItems(axisConfig).find((item) => item.axis === axis);

          return (
            <div key={`${row.label}-${axis}`} className="score-reason-item">
              <strong>
                {axis.toUpperCase()} {axisItem.label}：{reason?.score ?? getScoreForDisplay(row, axis, "absolute")}
              </strong>
              <span>{reason?.reason || "理由は未生成です。"}</span>
              <small>
                根拠語：
                {Array.isArray(reason?.evidenceKeywords) && reason.evidenceKeywords.length > 0
                  ? reason.evidenceKeywords.join(" / ")
                  : "少ない"}
                {" / "}信頼度：{reason?.confidence ?? row.scoreConfidence ?? "-"}
              </small>
            </div>
          );
        })}
      </div>
    );
  }

  const graphViewModel = useMemo(
    () =>
      createGraphViewModel({
        result,
        theme,
        axisLabels,
        originCentered,
        scoreDisplayMode,
        clusterSummaries,
        clusterSummaryKey,
        clusterVolumeFromRow,
        clusterVolumeDomain,
        getScoreForDisplay,
        truncateText,
        sizeOf,
        colorOf,
        markerSymbolOf,
        VOLUME_COLOR_SCALE,
      }),
    [result, theme, axisLabels, originCentered, scoreDisplayMode, clusterSummaries, clusterMethod]
  );

  usePlotlyGraphRenderer({
    appMode,
    graphViewModel,
    plot2dRef,
    plot3dRef,
    onClusterSelect: selectClusterFromGraph,
  });

  const saveTarget = currentSaveTargetPreview();
  const stagedCurrentDataCount =
    stagedFetchState.currentDataCount || stagedFetchState.accumulatedCount || currentOpinionCount || 0;
  const stagedRemainingCount = Math.max(
    0,
    Number(xMaxResults || 0) - stagedCurrentDataCount
  );
  const stagedNextFetchCount = Math.min(
    stagedRemainingCount,
    calculateNextAddFetchCount(
      stagedCurrentDataCount,
      Number(xMaxResults || 0),
      stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
    )
  );
  const canContinueStagedFetch =
    stagedRemainingCount > 0 && operationStatus.fetchX.status !== "running";
  const canAddImprovedQuery =
    stagedRemainingCount > 0 && operationStatus.fetchX.status !== "running" && Boolean(selectedImprovedQueryBase());
  const shouldShowStagedActions =
    viewMode === "developer" &&
    Boolean(stagedFetchState.diagnosis) &&
    (stagedFetchState.shouldPause || stagedRemainingCount > 0);
  const selectedImprovedBaseQuery = selectedImprovedQueryBase();
  const selectedImprovedExecutionQuery = selectedImprovedBaseQuery
    ? buildXQueryWithHashtags(selectedImprovedBaseQuery, xQueryFilters, selectedHashtagValues, selectedExcludeTermValues)
    : "";
  const selectedImprovedQueryIsSame =
    Boolean(selectedImprovedExecutionQuery) && queriesAreEquivalent(effectiveQuery, selectedImprovedExecutionQuery);
  const canRunSemanticCluster = result.noiseProcessingResult.candidateCount >= 5;
  function renderAiDraftPanel() {
    return (
      <AiDraftPanel
        aiDraft={aiDraft}
        aiDraftApiHealth={aiDraftApiHealth}
        aiDraftError={aiDraftError}
        aiDraftErrorDetails={aiDraftErrorDetails}
        aiDraftInitialQuestions={aiDraftInitialQuestions}
        aiDraftMode={aiDraftMode}
        aiDraftStatus={aiDraftStatus}
        applyAiDraft={applyAiDraft}
        checkAnalysisDraftHealth={checkAnalysisDraftHealth}
        handleGenerateAnalysisDraft={handleGenerateAnalysisDraft}
        isAiDraftApplied={isAiDraftApplied}
        isAiDraftLoading={isAiDraftLoading}
        operationStatus={operationStatus}
        publicPreviewMode={PUBLIC_PREVIEW_MODE}
        theme={theme}
        userOpinion={userOpinion}
        viewMode={viewMode}
      />
    );
  }
  const {
    actionButtonClass,
    actionButtonConfig,
    actionButtonStatus,
    compactDashboardLabel,
    dashboardStatusItems,
    dashboardCompactIndicators,
    dashboardCountBreakdownIndicators,
    dashboardPublishIndicators,
    getActionButtonLabel,
    graphModeLabel,
    operationStatusClass,
    operationTimeLabel,
    renderActionStatusButton,
    statusItemTitle,
    zone0AxisSummary,
    zone0StatusChipClass,
    zone0VersionLabel,
  } = createDashboardController({
    activeBeginnerResultSlot,
    activeClusterRunId,
    activeDatasetMatchesCurrent,
    activeUserResultSlot,
    autoSummaryProgress,
    autoSummaryStatus,
    axisConfig,
    axisDirty,
    currentAnalysisHash,
    currentClusterHash,
    currentDatasetHash,
    currentOpinionCount,
    currentPersonaConfig,
    currentXDataStateLabel,
    handleCopyAnalysisResult,
    hasFetchedExternalData,
    isAutoSummarizing,
    operationStatus,
    personaMode,
    publishStatus,
    queryDirty,
    result,
    saveCurrentClusterRunToHistory,
    saveCurrentXDatasetToHistory,
    stagedCurrentDataCount,
    stagedFetchState,
    stagedNextFetchCount,
    stagedRemainingCount,
    summarizedClusterCount,
    xDataStatus,
    xMaxResults,
  });

  // Section: Final render mode selection
  const activeMode = appMode === "developer" ? "developer" : appMode === "user" ? "user" : appMode;
  const modeNav = <ModeNav activeMode={activeMode} onSelect={handleAppModeChange} />;
  const activeModeLabel = {
    guide: "使い方",
    beginner: "初心者mode",
    user: "ユーザーmode",
    developer: "開発者mode",
  }[activeMode] || "ユーザーmode";
  // Beginner mode displays only its matching simple slot; User mode prefers detailed userResultSlot.
  const beginnerDisplayResult = activeBeginnerResultSlot ? beginnerResult : null;
  const beginnerDisplayStatus =
    beginnerStatus === "running" || beginnerStatus === "error" || activeBeginnerResultSlot ? beginnerStatus : "idle";
  const beginnerDisplayMessage =
    beginnerStatus === "running" || beginnerStatus === "error" || activeBeginnerResultSlot ? beginnerMessage : "";
  const userModeResultSourceLabel = activeUserResultSlot
    ? "ユーザーmodeで再取得した結果を表示中"
    : activeBeginnerResultSlot
      ? "初心者modeの取得結果を表示中"
      : "まだ取得結果はありません";
  const beginnerXSourceSummary =
    beginnerXFetchDebug.status === "success"
      ? `初心者mode：実データ ${beginnerXFetchDebug.returned}件`
      : beginnerXFetchDebug.fallbackUsed
        ? "初心者mode：サンプル表示"
        : "初心者mode：未実行";
  const beginnerPageProps = createBeginnerModeController({
    modeNav,
    themeInput: beginnerThemeInput,
    opinionInput: beginnerOpinionInput,
    status: beginnerDisplayStatus,
    message: beginnerDisplayMessage,
    analysisResult: beginnerDisplayResult,
    categories: BEGINNER_OPINION_CATEGORIES,
    onThemeChange: handleBeginnerThemeChange,
    onOpinionChange: handleBeginnerOpinionChange,
    onRun: handleBeginnerRun,
  });

  if (appMode === "guide") {
    return <GuidePage modeNav={modeNav} />;
  }

  if (appMode === "beginner") {
    return <BeginnerModePage {...beginnerPageProps} />;
  }

  const userModeControllerPayload = createUserPagePayload({
    constants: { ANALYSIS_PURPOSE_CONFIGS: typeof ANALYSIS_PURPOSE_CONFIGS === "undefined" ? undefined : ANALYSIS_PURPOSE_CONFIGS, AUTO_SUMMARY_LIMIT_OPTIONS: typeof AUTO_SUMMARY_LIMIT_OPTIONS === "undefined" ? undefined : AUTO_SUMMARY_LIMIT_OPTIONS, AXIS_PRESETS: typeof AXIS_PRESETS === "undefined" ? undefined : AXIS_PRESETS, Bearer: typeof Bearer === "undefined" ? undefined : Bearer, CLUSTER_THRESHOLD_OPTIONS: typeof CLUSTER_THRESHOLD_OPTIONS === "undefined" ? undefined : CLUSTER_THRESHOLD_OPTIONS, DEFAULT_MAX_X_FETCH: typeof DEFAULT_MAX_X_FETCH === "undefined" ? undefined : DEFAULT_MAX_X_FETCH, JP_UI_LABELS: typeof JP_UI_LABELS === "undefined" ? undefined : JP_UI_LABELS, LOCAL_PUBLISH_AVAILABLE: typeof LOCAL_PUBLISH_AVAILABLE === "undefined" ? undefined : LOCAL_PUBLISH_AVAILABLE, MVP: typeof MVP === "undefined" ? undefined : MVP, NOISE_CATEGORY_LABELS: typeof NOISE_CATEGORY_LABELS === "undefined" ? undefined : NOISE_CATEGORY_LABELS, No: typeof No === "undefined" ? undefined : No, OpenAI: typeof OpenAI === "undefined" ? undefined : OpenAI, PERSONA_CONFIGS: typeof PERSONA_CONFIGS === "undefined" ? undefined : PERSONA_CONFIGS, PUBLIC_PREVIEW_MAX_X_FETCH: typeof PUBLIC_PREVIEW_MAX_X_FETCH === "undefined" ? undefined : PUBLIC_PREVIEW_MAX_X_FETCH, PUBLIC_PREVIEW_MODE: typeof PUBLIC_PREVIEW_MODE === "undefined" ? undefined : PUBLIC_PREVIEW_MODE, Q: typeof Q === "undefined" ? undefined : Q, QUERY_LABELS_JA: typeof QUERY_LABELS_JA === "undefined" ? undefined : QUERY_LABELS_JA, QUERY_LABEL_DESCRIPTIONS_JA: typeof QUERY_LABEL_DESCRIPTIONS_JA === "undefined" ? undefined : QUERY_LABEL_DESCRIPTIONS_JA, QueryReviewChips: typeof QueryReviewChips === "undefined" ? undefined : QueryReviewChips, SEMANTIC_THRESHOLD_OPTIONS: typeof SEMANTIC_THRESHOLD_OPTIONS === "undefined" ? undefined : SEMANTIC_THRESHOLD_OPTIONS, STAGED_FETCH_INITIAL_COUNT: typeof STAGED_FETCH_INITIAL_COUNT === "undefined" ? undefined : STAGED_FETCH_INITIAL_COUNT, USER_INPUT_SAMPLE_KEY: typeof USER_INPUT_SAMPLE_KEY === "undefined" ? undefined : USER_INPUT_SAMPLE_KEY, VOICE_DIRECTION_OPTIONS: typeof VOICE_DIRECTION_OPTIONS === "undefined" ? undefined : VOICE_DIRECTION_OPTIONS, ZONE12_FILTERS: typeof ZONE12_FILTERS === "undefined" ? undefined : ZONE12_FILTERS, Zone: typeof Zone === "undefined" ? undefined : Zone, ZoneP: typeof ZoneP === "undefined" ? undefined : ZoneP, ZoneQ: typeof ZoneQ === "undefined" ? undefined : ZoneQ, constants: typeof constants === "undefined" ? undefined : constants},
    modeState: { activeBeginnerResultSlot: typeof activeBeginnerResultSlot === "undefined" ? undefined : activeBeginnerResultSlot, activeMode: typeof activeMode === "undefined" ? undefined : activeMode, activeModeLabel: typeof activeModeLabel === "undefined" ? undefined : activeModeLabel, activeUserResultSlot: typeof activeUserResultSlot === "undefined" ? undefined : activeUserResultSlot, analysisMode: typeof analysisMode === "undefined" ? undefined : analysisMode, analysisPurpose: typeof analysisPurpose === "undefined" ? undefined : analysisPurpose, analysisPurposeHelp: typeof analysisPurposeHelp === "undefined" ? undefined : analysisPurposeHelp, analysisPurposeLabel: typeof analysisPurposeLabel === "undefined" ? undefined : analysisPurposeLabel, analysisPurposeMode: typeof analysisPurposeMode === "undefined" ? undefined : analysisPurposeMode, beginnerXFetchDebug: typeof beginnerXFetchDebug === "undefined" ? undefined : beginnerXFetchDebug, beginnerXSourceSummary: typeof beginnerXSourceSummary === "undefined" ? undefined : beginnerXSourceSummary, input: typeof input === "undefined" ? undefined : input, inputCount: typeof inputCount === "undefined" ? undefined : inputCount, inputSource: typeof inputSource === "undefined" ? undefined : inputSource, inputSourceLabel: typeof inputSourceLabel === "undefined" ? undefined : inputSourceLabel, mode: typeof mode === "undefined" ? undefined : mode, modeNav: typeof modeNav === "undefined" ? undefined : modeNav, personaAAnalysisMemoItems: typeof personaAAnalysisMemoItems === "undefined" ? undefined : personaAAnalysisMemoItems, personaMode: typeof personaMode === "undefined" ? undefined : personaMode, purposeMode: typeof purposeMode === "undefined" ? undefined : purposeMode, sampleDisplayLabel: typeof sampleDisplayLabel === "undefined" ? undefined : sampleDisplayLabel, sampleKey: typeof sampleKey === "undefined" ? undefined : sampleKey, sampleLabel: typeof sampleLabel === "undefined" ? undefined : sampleLabel, sampleNoLabel: typeof sampleNoLabel === "undefined" ? undefined : sampleNoLabel, sampleOpinionTrial: typeof sampleOpinionTrial === "undefined" ? undefined : sampleOpinionTrial, sampleTitle: typeof sampleTitle === "undefined" ? undefined : sampleTitle, samples: typeof samples === "undefined" ? undefined : samples, selectedDemoSampleKey: typeof selectedDemoSampleKey === "undefined" ? undefined : selectedDemoSampleKey, theme: typeof theme === "undefined" ? undefined : theme, themeCategory: typeof themeCategory === "undefined" ? undefined : themeCategory, userModeResultSourceLabel: typeof userModeResultSourceLabel === "undefined" ? undefined : userModeResultSourceLabel, userOpinion: typeof userOpinion === "undefined" ? undefined : userOpinion, userOpinionTextareaRef: typeof userOpinionTextareaRef === "undefined" ? undefined : userOpinionTextareaRef, viewMode: typeof viewMode === "undefined" ? undefined : viewMode, voiceDirectionLabel: typeof voiceDirectionLabel === "undefined" ? undefined : voiceDirectionLabel, voiceDirections: typeof voiceDirections === "undefined" ? undefined : voiceDirections, voicesToCollect: typeof voicesToCollect === "undefined" ? undefined : voicesToCollect },
    sourceState: { apiErrorMessage: typeof apiErrorMessage === "undefined" ? undefined : apiErrorMessage, apiReturnedCount: typeof apiReturnedCount === "undefined" ? undefined : apiReturnedCount, canAddImprovedQuery: typeof canAddImprovedQuery === "undefined" ? undefined : canAddImprovedQuery, canContinueStagedFetch: typeof canContinueStagedFetch === "undefined" ? undefined : canContinueStagedFetch, candidate: typeof candidate === "undefined" ? undefined : candidate, candidateCount: typeof candidateCount === "undefined" ? undefined : candidateCount, candidateRate: typeof candidateRate === "undefined" ? undefined : candidateRate, excludeLinks: typeof excludeLinks === "undefined" ? undefined : excludeLinks, excludeReplies: typeof excludeReplies === "undefined" ? undefined : excludeReplies, excludeRetweets: typeof excludeRetweets === "undefined" ? undefined : excludeRetweets, excludeTermCandidates: typeof excludeTermCandidates === "undefined" ? undefined : excludeTermCandidates, excludeTerms: typeof excludeTerms === "undefined" ? undefined : excludeTerms, excludeWords: typeof excludeWords === "undefined" ? undefined : excludeWords, excludedPosts: typeof excludedPosts === "undefined" ? undefined : excludedPosts, fetchX: typeof fetchX === "undefined" ? undefined : fetchX, fetchedCount: typeof fetchedCount === "undefined" ? undefined : fetchedCount, hashtag: typeof hashtag === "undefined" ? undefined : hashtag, hashtagCandidates: typeof hashtagCandidates === "undefined" ? undefined : hashtagCandidates, includeHashtags: typeof includeHashtags === "undefined" ? undefined : includeHashtags, includeTerms: typeof includeTerms === "undefined" ? undefined : includeTerms, includeWords: typeof includeWords === "undefined" ? undefined : includeWords, includes: typeof includes === "undefined" ? undefined : includes, isManualXQuery: typeof isManualXQuery === "undefined" ? undefined : isManualXQuery, query: typeof query === "undefined" ? undefined : query, queryAdjustment: typeof queryAdjustment === "undefined" ? undefined : queryAdjustment, queryAxisWarnings: typeof queryAxisWarnings === "undefined" ? undefined : queryAxisWarnings, queryBuildStatus: typeof queryBuildStatus === "undefined" ? undefined : queryBuildStatus, queryBuildStatusLabel: typeof queryBuildStatusLabel === "undefined" ? undefined : queryBuildStatusLabel, queryBuildWarnings: typeof queryBuildWarnings === "undefined" ? undefined : queryBuildWarnings, queryDiagnosisLabel: typeof queryDiagnosisLabel === "undefined" ? undefined : queryDiagnosisLabel, queryDirty: typeof queryDirty === "undefined" ? undefined : queryDirty, queryKind: typeof queryKind === "undefined" ? undefined : queryKind, queryLength: typeof queryLength === "undefined" ? undefined : queryLength, queryReview: typeof queryReview === "undefined" ? undefined : queryReview, queryReviewParts: typeof queryReviewParts === "undefined" ? undefined : queryReviewParts, queryTermDiagnosis: typeof queryTermDiagnosis === "undefined" ? undefined : queryTermDiagnosis, rawQuery: typeof rawQuery === "undefined" ? undefined : rawQuery, retrievalKpi: typeof retrievalKpi === "undefined" ? undefined : retrievalKpi, retrievalPolicy: typeof retrievalPolicy === "undefined" ? undefined : retrievalPolicy, safeQuery: typeof safeQuery === "undefined" ? undefined : safeQuery, safeQueryPreview: typeof safeQueryPreview === "undefined" ? undefined : safeQueryPreview, sanitizedExcludeRemovedParts: typeof sanitizedExcludeRemovedParts === "undefined" ? undefined : sanitizedExcludeRemovedParts, sanitizedExcludeTerms: typeof sanitizedExcludeTerms === "undefined" ? undefined : sanitizedExcludeTerms, sanitizedHashtagRemovedParts: typeof sanitizedHashtagRemovedParts === "undefined" ? undefined : sanitizedHashtagRemovedParts, sanitizedHashtags: typeof sanitizedHashtags === "undefined" ? undefined : sanitizedHashtags, sourceDiagnostics: typeof sourceDiagnostics === "undefined" ? undefined : sourceDiagnostics, sourceItems: typeof sourceItems === "undefined" ? undefined : sourceItems, stage: typeof stage === "undefined" ? undefined : stage, stageLogs: typeof stageLogs === "undefined" ? undefined : stageLogs, stageNo: typeof stageNo === "undefined" ? undefined : stageNo, stagedCurrentDataCount: typeof stagedCurrentDataCount === "undefined" ? undefined : stagedCurrentDataCount, stagedFetchEnabled: typeof stagedFetchEnabled === "undefined" ? undefined : stagedFetchEnabled, stagedFetchState: typeof stagedFetchState === "undefined" ? undefined : stagedFetchState, stagedNextFetchCount: typeof stagedNextFetchCount === "undefined" ? undefined : stagedNextFetchCount, stagedRemainingCount: typeof stagedRemainingCount === "undefined" ? undefined : stagedRemainingCount, urlCount: typeof urlCount === "undefined" ? undefined : urlCount, urlTextRemainingCount: typeof urlTextRemainingCount === "undefined" ? undefined : urlTextRemainingCount, weakNoiseRetryAvailable: typeof weakNoiseRetryAvailable === "undefined" ? undefined : weakNoiseRetryAvailable, x: typeof x === "undefined" ? undefined : x, xMaxResults: typeof xMaxResults === "undefined" ? undefined : xMaxResults, xPosts: typeof xPosts === "undefined" ? undefined : xPosts, xQuery: typeof xQuery === "undefined" ? undefined : xQuery, xQueryBase: typeof xQueryBase === "undefined" ? undefined : xQueryBase, xQueryCandidates: typeof xQueryCandidates === "undefined" ? undefined : xQueryCandidates, xQueryFilters: typeof xQueryFilters === "undefined" ? undefined : xQueryFilters, xStatus: typeof xStatus === "undefined" ? undefined : xStatus, externalOpinions: typeof externalOpinions === "undefined" ? undefined : externalOpinions},
    sourceActions: { continueRemainingCount: typeof continueRemainingCount === "undefined" ? undefined : continueRemainingCount, continueStagedFetch: typeof continueStagedFetch === "undefined" ? undefined : continueStagedFetch, refetchWithImprovedQuery: typeof refetchWithImprovedQuery === "undefined" ? undefined : refetchWithImprovedQuery, run: typeof run === "undefined" ? undefined : run, runId: typeof runId === "undefined" ? undefined : runId, setXDataStatus: typeof setXDataStatus === "undefined" ? undefined : setXDataStatus, setXMaxResults: typeof setXMaxResults === "undefined" ? undefined : setXMaxResults, setXQuery: typeof setXQuery === "undefined" ? undefined : setXQuery, stopReason: typeof stopReason === "undefined" ? undefined : stopReason, stopReasonLabel: typeof stopReasonLabel === "undefined" ? undefined : stopReasonLabel, syncUserInputSessionQuery: typeof syncUserInputSessionQuery === "undefined" ? undefined : syncUserInputSessionQuery, toggleExcludeTermCandidate: typeof toggleExcludeTermCandidate === "undefined" ? undefined : toggleExcludeTermCandidate, toggleHashtagCandidate: typeof toggleHashtagCandidate === "undefined" ? undefined : toggleHashtagCandidate, toggleImprovedQueryCandidate: typeof toggleImprovedQueryCandidate === "undefined" ? undefined : toggleImprovedQueryCandidate, toggleXQueryCandidate: typeof toggleXQueryCandidate === "undefined" ? undefined : toggleXQueryCandidate, updateXQueryBase: typeof updateXQueryBase === "undefined" ? undefined : updateXQueryBase, updateXQueryFilter: typeof updateXQueryFilter === "undefined" ? undefined : updateXQueryFilter },
    resultState: { absoluteScore: typeof absoluteScore === "undefined" ? undefined : absoluteScore, aiSummary: typeof aiSummary === "undefined" ? undefined : aiSummary, analysisCandidateCount: typeof analysisCandidateCount === "undefined" ? undefined : analysisCandidateCount, analysisCandidateRate: typeof analysisCandidateRate === "undefined" ? undefined : analysisCandidateRate, analysisTargetCount: typeof analysisTargetCount === "undefined" ? undefined : analysisTargetCount, analysisTargetRate: typeof analysisTargetRate === "undefined" ? undefined : analysisTargetRate, autoSummary: typeof autoSummary === "undefined" ? undefined : autoSummary, autoSummaryLimit: typeof autoSummaryLimit === "undefined" ? undefined : autoSummaryLimit, autoSummaryStatus: typeof autoSummaryStatus === "undefined" ? undefined : autoSummaryStatus, axis: typeof axis === "undefined" ? undefined : axis, axisConfig: typeof axisConfig === "undefined" ? undefined : axisConfig, axisDirty: typeof axisDirty === "undefined" ? undefined : axisDirty, axisExplanationItems: typeof axisExplanationItems === "undefined" ? undefined : axisExplanationItems, axisGuide: typeof axisGuide === "undefined" ? undefined : axisGuide, axisItems: typeof axisItems === "undefined" ? undefined : axisItems, axisLabels: typeof axisLabels === "undefined" ? undefined : axisLabels, axisLinkedKeywords: typeof axisLinkedKeywords === "undefined" ? undefined : axisLinkedKeywords, axisLowDescriptionAutoGenerated: typeof axisLowDescriptionAutoGenerated === "undefined" ? undefined : axisLowDescriptionAutoGenerated, axisQualityWarnings: typeof axisQualityWarnings === "undefined" ? undefined : axisQualityWarnings, axisStatus: typeof axisStatus === "undefined" ? undefined : axisStatus, borderlineOpinions: typeof borderlineOpinions === "undefined" ? undefined : borderlineOpinions, borderlineReason: typeof borderlineReason === "undefined" ? undefined : borderlineReason, borderlineUsefulCount: typeof borderlineUsefulCount === "undefined" ? undefined : borderlineUsefulCount, borderlineUsefulRows: typeof borderlineUsefulRows === "undefined" ? undefined : borderlineUsefulRows, canRescore: typeof canRescore === "undefined" ? undefined : canRescore, canRescoreWithCurrentAxis: typeof canRescoreWithCurrentAxis === "undefined" ? undefined : canRescoreWithCurrentAxis, canRunSemanticCluster: typeof canRunSemanticCluster === "undefined" ? undefined : canRunSemanticCluster, cluster: typeof cluster === "undefined" ? undefined : cluster, clusterCompressionRate: typeof clusterCompressionRate === "undefined" ? undefined : clusterCompressionRate, clusterCount: typeof clusterCount === "undefined" ? undefined : clusterCount, clusterExpansionKey: typeof clusterExpansionKey === "undefined" ? undefined : clusterExpansionKey, clusterJudgement: typeof clusterJudgement === "undefined" ? undefined : clusterJudgement, clusterMethod: typeof clusterMethod === "undefined" ? undefined : clusterMethod, clusterPolicy: typeof clusterPolicy === "undefined" ? undefined : clusterPolicy, clusterRowDomId: typeof clusterRowDomId === "undefined" ? undefined : clusterRowDomId, clusterRuns: typeof clusterRuns === "undefined" ? undefined : clusterRuns, clusterSummaries: typeof clusterSummaries === "undefined" ? undefined : clusterSummaries, clusterSummaryErrorById: typeof clusterSummaryErrorById === "undefined" ? undefined : clusterSummaryErrorById, clusterSummaryKey: typeof clusterSummaryKey === "undefined" ? undefined : clusterSummaryKey, clusterTableRows: typeof clusterTableRows === "undefined" ? undefined : clusterTableRows, clusterThreshold: typeof clusterThreshold === "undefined" ? undefined : clusterThreshold, clusterVolumeFromRow: typeof clusterVolumeFromRow === "undefined" ? undefined : clusterVolumeFromRow, currentClusterDisplayLabel: typeof currentClusterDisplayLabel === "undefined" ? undefined : currentClusterDisplayLabel, feedback: typeof feedback === "undefined" ? undefined : feedback, feedbackStatus: typeof feedbackStatus === "undefined" ? undefined : feedbackStatus, filteredRows: typeof filteredRows === "undefined" ? undefined : filteredRows, graph: typeof graph === "undefined" ? undefined : graph, graphMode: typeof graphMode === "undefined" ? undefined : graphMode, graphModeLabel: typeof graphModeLabel === "undefined" ? undefined : graphModeLabel, graphZones: typeof graphZones === "undefined" ? undefined : graphZones, isSummaryLoading: typeof isSummaryLoading === "undefined" ? undefined : isSummaryLoading, noiseBreakdown: typeof noiseBreakdown === "undefined" ? undefined : noiseBreakdown, noiseCategory: typeof noiseCategory === "undefined" ? undefined : noiseCategory, noiseCategoryLabels: typeof noiseCategoryLabels === "undefined" ? undefined : noiseCategoryLabels, noiseExcludedCount: typeof noiseExcludedCount === "undefined" ? undefined : noiseExcludedCount, noiseExcludedRows: typeof noiseExcludedRows === "undefined" ? undefined : noiseExcludedRows, noiseExcludedUniqueCount: typeof noiseExcludedUniqueCount === "undefined" ? undefined : noiseExcludedUniqueCount, noiseFilterEnabled: typeof noiseFilterEnabled === "undefined" ? undefined : noiseFilterEnabled, noiseFilteringEnabled: typeof noiseFilteringEnabled === "undefined" ? undefined : noiseFilteringEnabled, noiseProcessingResult: typeof noiseProcessingResult === "undefined" ? undefined : noiseProcessingResult, noiseRate: typeof noiseRate === "undefined" ? undefined : noiseRate, noiseReason: typeof noiseReason === "undefined" ? undefined : noiseReason, noiseReasonCounts: typeof noiseReasonCounts === "undefined" ? undefined : noiseReasonCounts, noiseReasonSummary: typeof noiseReasonSummary === "undefined" ? undefined : noiseReasonSummary, noiseRelevanceThreshold: typeof noiseRelevanceThreshold === "undefined" ? undefined : noiseRelevanceThreshold, noiseRemovedCount: typeof noiseRemovedCount === "undefined" ? undefined : noiseRemovedCount, noiseRisk: typeof noiseRisk === "undefined" ? undefined : noiseRisk, plot2dRef: typeof plot2dRef === "undefined" ? undefined : plot2dRef, plot3dRef: typeof plot3dRef === "undefined" ? undefined : plot3dRef, relativeScore: typeof relativeScore === "undefined" ? undefined : relativeScore, result: typeof result === "undefined" ? undefined : result, scoreAxisHeader: typeof scoreAxisHeader === "undefined" ? undefined : scoreAxisHeader, scoreBasis: typeof scoreBasis === "undefined" ? undefined : scoreBasis, scoreBasisLabel: typeof scoreBasisLabel === "undefined" ? undefined : scoreBasisLabel, scoreConcentrationDetected: typeof scoreConcentrationDetected === "undefined" ? undefined : scoreConcentrationDetected, scoreConcentrationMessages: typeof scoreConcentrationMessages === "undefined" ? undefined : scoreConcentrationMessages, scoreConfidence: typeof scoreConfidence === "undefined" ? undefined : scoreConfidence, scoreDisplayMode: typeof scoreDisplayMode === "undefined" ? undefined : scoreDisplayMode, scoreDisplayModeLabel: typeof scoreDisplayModeLabel === "undefined" ? undefined : scoreDisplayModeLabel, scoreWarnings: typeof scoreWarnings === "undefined" ? undefined : scoreWarnings, semanticCluster: typeof semanticCluster === "undefined" ? undefined : semanticCluster, semanticClusterCompressionRate: typeof semanticClusterCompressionRate === "undefined" ? undefined : semanticClusterCompressionRate, semanticClusterCount: typeof semanticClusterCount === "undefined" ? undefined : semanticClusterCount, semanticClusterRows: typeof semanticClusterRows === "undefined" ? undefined : semanticClusterRows, semanticClusterStateLabel: typeof semanticClusterStateLabel === "undefined" ? undefined : semanticClusterStateLabel, semanticClusterStatus: typeof semanticClusterStatus === "undefined" ? undefined : semanticClusterStatus, semanticInputCount: typeof semanticInputCount === "undefined" ? undefined : semanticInputCount, semanticThreshold: typeof semanticThreshold === "undefined" ? undefined : semanticThreshold, sort: typeof sort === "undefined" ? undefined : sort, sortDirection: typeof sortDirection === "undefined" ? undefined : sortDirection, sortKey: typeof sortKey === "undefined" ? undefined : sortKey, sortLabel: typeof sortLabel === "undefined" ? undefined : sortLabel, summarizedClusterCount: typeof summarizedClusterCount === "undefined" ? undefined : summarizedClusterCount, summaryError: typeof summaryError === "undefined" ? undefined : summaryError, summaryKey: typeof summaryKey === "undefined" ? undefined : summaryKey, summaryTargetClusterLabel: typeof summaryTargetClusterLabel === "undefined" ? undefined : summaryTargetClusterLabel, textClusterRows: typeof textClusterRows === "undefined" ? undefined : textClusterRows, userFeedback: typeof userFeedback === "undefined" ? undefined : userFeedback, zeroAnalysisSummary: typeof zeroAnalysisSummary === "undefined" ? undefined : zeroAnalysisSummary, zone0StatusChipClass: typeof zone0StatusChipClass === "undefined" ? undefined : zone0StatusChipClass, zone0VersionLabel: typeof zone0VersionLabel === "undefined" ? undefined : zone0VersionLabel, zone11DisplayTitle: typeof zone11DisplayTitle === "undefined" ? undefined : zone11DisplayTitle, zone11Policy: typeof zone11Policy === "undefined" ? undefined : zone11Policy, zone12Counts: typeof zone12Counts === "undefined" ? undefined : zone12Counts, zone12ExcludeTerms: typeof zone12ExcludeTerms === "undefined" ? undefined : zone12ExcludeTerms, zone12Filter: typeof zone12Filter === "undefined" ? undefined : zone12Filter, zone12FilteredRows: typeof zone12FilteredRows === "undefined" ? undefined : zone12FilteredRows, zone12HighlightTerms: typeof zone12HighlightTerms === "undefined" ? undefined : zone12HighlightTerms, zone12ReasonForRow: typeof zone12ReasonForRow === "undefined" ? undefined : zone12ReasonForRow, zone12StatusForRow: typeof zone12StatusForRow === "undefined" ? undefined : zone12StatusForRow, zone12TermHits: typeof zone12TermHits === "undefined" ? undefined : zone12TermHits, zone12TopNoiseReasons: typeof zone12TopNoiseReasons === "undefined" ? undefined : zone12TopNoiseReasons, zone12ZeroAnalysisSummary: typeof zone12ZeroAnalysisSummary === "undefined" ? undefined : zone12ZeroAnalysisSummary, zoneResultsContent: typeof zoneResultsContent === "undefined" ? undefined : zoneResultsContent },
    diagnosticsState: { advice: typeof advice === "undefined" ? undefined : advice, caution: typeof caution === "undefined" ? undefined : caution, cautionCandidates: typeof cautionCandidates === "undefined" ? undefined : cautionCandidates, cautionTerms: typeof cautionTerms === "undefined" ? undefined : cautionTerms, cautions: typeof cautions === "undefined" ? undefined : cautions, developer: typeof developer === "undefined" ? undefined : developer, diagnosis: typeof diagnosis === "undefined" ? undefined : diagnosis, diagnosisStatus: typeof diagnosisStatus === "undefined" ? undefined : diagnosisStatus, diagnosisSummary: typeof diagnosisSummary === "undefined" ? undefined : diagnosisSummary, diagnostics: typeof diagnostics === "undefined" ? undefined : diagnostics, errorTimestamp: typeof errorTimestamp === "undefined" ? undefined : errorTimestamp, errorType: typeof errorType === "undefined" ? undefined : errorType, historyStatus: typeof historyStatus === "undefined" ? undefined : historyStatus, labels: typeof labels === "undefined" ? undefined : labels, message: typeof message === "undefined" ? undefined : message, mojibakeLabelWarnings: typeof mojibakeLabelWarnings === "undefined" ? undefined : mojibakeLabelWarnings, operation: typeof operation === "undefined" ? undefined : operation, operationStatus: typeof operationStatus === "undefined" ? undefined : operationStatus, operationStatusClass: typeof operationStatusClass === "undefined" ? undefined : operationStatusClass, operationTimeLabel: typeof operationTimeLabel === "undefined" ? undefined : operationTimeLabel, reason: typeof reason === "undefined" ? undefined : reason, recommendedQuery: typeof recommendedQuery === "undefined" ? undefined : recommendedQuery, status: typeof status === "undefined" ? undefined : status, statusIndicators: typeof statusIndicators === "undefined" ? undefined : statusIndicators, statusItemTitle: typeof statusItemTitle === "undefined" ? undefined : statusItemTitle, statusItems: typeof statusItems === "undefined" ? undefined : statusItems, toast: typeof toast === "undefined" ? undefined : toast, warning: typeof warning === "undefined" ? undefined : warning },
    layoutState: { dashboard: typeof dashboard === "undefined" ? undefined : dashboard, dashboardActionHeight: typeof dashboardActionHeight === "undefined" ? undefined : dashboardActionHeight, dashboardActionPanelRef: typeof dashboardActionPanelRef === "undefined" ? undefined : dashboardActionPanelRef, dashboardCompactIndicators: typeof dashboardCompactIndicators === "undefined" ? undefined : dashboardCompactIndicators, dashboardContent: typeof dashboardContent === "undefined" ? undefined : dashboardContent, dashboardCountBreakdownIndicators: typeof dashboardCountBreakdownIndicators === "undefined" ? undefined : dashboardCountBreakdownIndicators, dashboardHeight: typeof dashboardHeight === "undefined" ? undefined : dashboardHeight, dashboardLabel: typeof dashboardLabel === "undefined" ? undefined : dashboardLabel, dashboardLeftWidth: typeof dashboardLeftWidth === "undefined" ? undefined : dashboardLeftWidth, dashboardPanelRef: typeof dashboardPanelRef === "undefined" ? undefined : dashboardPanelRef, dashboardPublishIndicators: typeof dashboardPublishIndicators === "undefined" ? undefined : dashboardPublishIndicators, dashboardStatusHeight: typeof dashboardStatusHeight === "undefined" ? undefined : dashboardStatusHeight, dashboardStatusItems: typeof dashboardStatusItems === "undefined" ? undefined : dashboardStatusItems, dashboardStatusPanelRef: typeof dashboardStatusPanelRef === "undefined" ? undefined : dashboardStatusPanelRef, height: typeof height === "undefined" ? undefined : height, layout: typeof layout === "undefined" ? undefined : layout, mainProblems: typeof mainProblems === "undefined" ? undefined : mainProblems, shouldShowStagedActions: typeof shouldShowStagedActions === "undefined" ? undefined : shouldShowStagedActions, showForceStop: typeof showForceStop === "undefined" ? undefined : showForceStop, sidebarContent: typeof sidebarContent === "undefined" ? undefined : sidebarContent, sidebarWidth: typeof sidebarWidth === "undefined" ? undefined : sidebarWidth, workflowClass: typeof workflowClass === "undefined" ? undefined : workflowClass },
    publishState: { publishIndicators: typeof publishIndicators === "undefined" ? undefined : publishIndicators, showPublishGroup: typeof showPublishGroup === "undefined" ? undefined : showPublishGroup },
    aiDraftState: { autoGeneratedLowDescription: typeof autoGeneratedLowDescription === "undefined" ? undefined : autoGeneratedLowDescription, draftAxisConfig: typeof draftAxisConfig === "undefined" ? undefined : draftAxisConfig },
    actions: { applyAxis: typeof applyAxis === "undefined" ? undefined : applyAxis, applyAxisConfig: typeof applyAxisConfig === "undefined" ? undefined : applyAxisConfig, copyAnalysis: typeof copyAnalysis === "undefined" ? undefined : copyAnalysis, copyAnalysisButton: typeof copyAnalysisButton === "undefined" ? undefined : copyAnalysisButton, copyStatus: typeof copyStatus === "undefined" ? undefined : copyStatus, saveCluster: typeof saveCluster === "undefined" ? undefined : saveCluster, saveClusterButton: typeof saveClusterButton === "undefined" ? undefined : saveClusterButton, setDashboardResizeTarget: typeof setDashboardResizeTarget === "undefined" ? undefined : setDashboardResizeTarget, setExternalOpinions: typeof setExternalOpinions === "undefined" ? undefined : setExternalOpinions, setGraphMode: typeof setGraphMode === "undefined" ? undefined : setGraphMode, setHasScoredWithCurrentAxis: typeof setHasScoredWithCurrentAxis === "undefined" ? undefined : setHasScoredWithCurrentAxis, setHistoryStatus: typeof setHistoryStatus === "undefined" ? undefined : setHistoryStatus, setIsDashboardResizing: typeof setIsDashboardResizing === "undefined" ? undefined : setIsDashboardResizing, setIsManualXQuery: typeof setIsManualXQuery === "undefined" ? undefined : setIsManualXQuery, setIsNoiseFilteringDisabled: typeof setIsNoiseFilteringDisabled === "undefined" ? undefined : setIsNoiseFilteringDisabled, setIsSidebarResizing: typeof setIsSidebarResizing === "undefined" ? undefined : setIsSidebarResizing, setIsXDatasetHistoryExpanded: typeof setIsXDatasetHistoryExpanded === "undefined" ? undefined : setIsXDatasetHistoryExpanded, setOriginCentered: typeof setOriginCentered === "undefined" ? undefined : setOriginCentered, setQueryDirty: typeof setQueryDirty === "undefined" ? undefined : setQueryDirty, setSampleKey: typeof setSampleKey === "undefined" ? undefined : setSampleKey, setScoreDisplayMode: typeof setScoreDisplayMode === "undefined" ? undefined : setScoreDisplayMode, setSelectedDemoSampleKey: typeof setSelectedDemoSampleKey === "undefined" ? undefined : setSelectedDemoSampleKey, setSelectedXQueryCandidateIds: typeof setSelectedXQueryCandidateIds === "undefined" ? undefined : setSelectedXQueryCandidateIds, setSemanticClusterError: typeof setSemanticClusterError === "undefined" ? undefined : setSemanticClusterError, setSemanticClusterRows: typeof setSemanticClusterRows === "undefined" ? undefined : setSemanticClusterRows, setSemanticClusterStatus: typeof setSemanticClusterStatus === "undefined" ? undefined : setSemanticClusterStatus, setSemanticThreshold: typeof setSemanticThreshold === "undefined" ? undefined : setSemanticThreshold, setZone12Filter: typeof setZone12Filter === "undefined" ? undefined : setZone12Filter, toggleAxisLinkedKeyword: typeof toggleAxisLinkedKeyword === "undefined" ? undefined : toggleAxisLinkedKeyword, toggleClusterMembers: typeof toggleClusterMembers === "undefined" ? undefined : toggleClusterMembers, updateDraftAxis: typeof updateDraftAxis === "undefined" ? undefined : updateDraftAxis },
    renderingState: { a: typeof a === "undefined" ? undefined : a, buttonText: typeof buttonText === "undefined" ? undefined : buttonText, description: typeof description === "undefined" ? undefined : description, filter: typeof filter === "undefined" ? undefined : filter, item: typeof item === "undefined" ? undefined : item, join: typeof join === "undefined" ? undefined : join, member: typeof member === "undefined" ? undefined : member, memberRows: typeof memberRows === "undefined" ? undefined : memberRows, opinion: typeof opinion === "undefined" ? undefined : opinion, row: typeof row === "undefined" ? undefined : row, slice: typeof slice === "undefined" ? undefined : slice, split: typeof split === "undefined" ? undefined : split, text: typeof text === "undefined" ? undefined : text, toFixed: typeof toFixed === "undefined" ? undefined : toFixed, toUpperCase: typeof toUpperCase === "undefined" ? undefined : toUpperCase, trim: typeof trim === "undefined" ? undefined : trim, ul: typeof ul === "undefined" ? undefined : ul, values: typeof values === "undefined" ? undefined : values },
    datasetState: { activeDataset: typeof activeDataset === "undefined" ? undefined : activeDataset, activeDatasetId: typeof activeDatasetId === "undefined" ? undefined : activeDatasetId, dataset: typeof dataset === "undefined" ? undefined : dataset, datasetHistory: typeof datasetHistory === "undefined" ? undefined : datasetHistory, datasetId: typeof datasetId === "undefined" ? undefined : datasetId, datasetThemeMismatch: typeof datasetThemeMismatch === "undefined" ? undefined : datasetThemeMismatch, datasetUserOpinionMismatch: typeof datasetUserOpinionMismatch === "undefined" ? undefined : datasetUserOpinionMismatch, datasets: typeof datasets === "undefined" ? undefined : datasets, deleteClusterRunHistory: typeof deleteClusterRunHistory === "undefined" ? undefined : deleteClusterRunHistory, deleteXDatasetHistory: typeof deleteXDatasetHistory === "undefined" ? undefined : deleteXDatasetHistory, formatHistoryDate: typeof formatHistoryDate === "undefined" ? undefined : formatHistoryDate, isXDatasetHistoryExpanded: typeof isXDatasetHistoryExpanded === "undefined" ? undefined : isXDatasetHistoryExpanded, loadClusterRunFromHistory: typeof loadClusterRunFromHistory === "undefined" ? undefined : loadClusterRunFromHistory, loadXDatasetFromHistory: typeof loadXDatasetFromHistory === "undefined" ? undefined : loadXDatasetFromHistory, saveDataset: typeof saveDataset === "undefined" ? undefined : saveDataset, saveDatasetButton: typeof saveDatasetButton === "undefined" ? undefined : saveDatasetButton, saveTarget: typeof saveTarget === "undefined" ? undefined : saveTarget, savedAt: typeof savedAt === "undefined" ? undefined : savedAt, setActiveDatasetId: typeof setActiveDatasetId === "undefined" ? undefined : setActiveDatasetId },
    queryState: { activeFilter: typeof activeFilter === "undefined" ? undefined : activeFilter, adoptedHashtags: typeof adoptedHashtags === "undefined" ? undefined : adoptedHashtags, adoptedIncludeTerms: typeof adoptedIncludeTerms === "undefined" ? undefined : adoptedIncludeTerms, afterAnalysisCandidateCount: typeof afterAnalysisCandidateCount === "undefined" ? undefined : afterAnalysisCandidateCount, afterQuery: typeof afterQuery === "undefined" ? undefined : afterQuery, aiQueryAdvice: typeof aiQueryAdvice === "undefined" ? undefined : aiQueryAdvice, beforeAnalysisCandidateCount: typeof beforeAnalysisCandidateCount === "undefined" ? undefined : beforeAnalysisCandidateCount, beforeQuery: typeof beforeQuery === "undefined" ? undefined : beforeQuery, clearAllXQueryCandidates: typeof clearAllXQueryCandidates === "undefined" ? undefined : clearAllXQueryCandidates, disabledCandidates: typeof disabledCandidates === "undefined" ? undefined : disabledCandidates, disabledTerms: typeof disabledTerms === "undefined" ? undefined : disabledTerms, effectiveQuery: typeof effectiveQuery === "undefined" ? undefined : effectiveQuery, extractZone12Hashtags: typeof extractZone12Hashtags === "undefined" ? undefined : extractZone12Hashtags, fallbackQuery: typeof fallbackQuery === "undefined" ? undefined : fallbackQuery, fallbackQueryLength: typeof fallbackQueryLength === "undefined" ? undefined : fallbackQueryLength, filters: typeof filters === "undefined" ? undefined : filters, finalQueryForXApi: typeof finalQueryForXApi === "undefined" ? undefined : finalQueryForXApi, finalQueryLength: typeof finalQueryLength === "undefined" ? undefined : finalQueryLength, finalTrustedQuery: typeof finalTrustedQuery === "undefined" ? undefined : finalTrustedQuery, focusManualQueryEdit: typeof focusManualQueryEdit === "undefined" ? undefined : focusManualQueryEdit, generatedBasicKeywords: typeof generatedBasicKeywords === "undefined" ? undefined : generatedBasicKeywords, getHashtagsForRow: typeof getHashtagsForRow === "undefined" ? undefined : getHashtagsForRow, getTermHits: typeof getTermHits === "undefined" ? undefined : getTermHits, highlightTerms: typeof highlightTerms === "undefined" ? undefined : highlightTerms, improvedQueryCandidates: typeof improvedQueryCandidates === "undefined" ? undefined : improvedQueryCandidates, isEffectiveQueryTooLong: typeof isEffectiveQueryTooLong === "undefined" ? undefined : isEffectiveQueryTooLong, isNoiseFilteringDisabled: typeof isNoiseFilteringDisabled === "undefined" ? undefined : isNoiseFilteringDisabled, keyword: typeof keyword === "undefined" ? undefined : keyword, minRetweets: typeof minRetweets === "undefined" ? undefined : minRetweets, normalizeVoiceDirections: typeof normalizeVoiceDirections === "undefined" ? undefined : normalizeVoiceDirections, onFilterChange: typeof onFilterChange === "undefined" ? undefined : onFilterChange, regenerateQueryFromCurrentInput: typeof regenerateQueryFromCurrentInput === "undefined" ? undefined : regenerateQueryFromCurrentInput, resetXQueryFilters: typeof resetXQueryFilters === "undefined" ? undefined : resetXQueryFilters, retryDiagnosisWithWeakNoiseFilter: typeof retryDiagnosisWithWeakNoiseFilter === "undefined" ? undefined : retryDiagnosisWithWeakNoiseFilter, retweet: typeof retweet === "undefined" ? undefined : retweet, retweetLikeCount: typeof retweetLikeCount === "undefined" ? undefined : retweetLikeCount, selectAllXQueryCandidates: typeof selectAllXQueryCandidates === "undefined" ? undefined : selectAllXQueryCandidates, selectedAxisLinkedKeywords: typeof selectedAxisLinkedKeywords === "undefined" ? undefined : selectedAxisLinkedKeywords, selectedExcludeTermValues: typeof selectedExcludeTermValues === "undefined" ? undefined : selectedExcludeTermValues, selectedHashtagCandidates: typeof selectedHashtagCandidates === "undefined" ? undefined : selectedHashtagCandidates, selectedHashtagValues: typeof selectedHashtagValues === "undefined" ? undefined : selectedHashtagValues, selectedImprovedExecutionQuery: typeof selectedImprovedExecutionQuery === "undefined" ? undefined : selectedImprovedExecutionQuery, selectedImprovedQueryIndexes: typeof selectedImprovedQueryIndexes === "undefined" ? undefined : selectedImprovedQueryIndexes, selectedImprovedQueryIsSame: typeof selectedImprovedQueryIsSame === "undefined" ? undefined : selectedImprovedQueryIsSame, selectedQueryCandidateIds: typeof selectedQueryCandidateIds === "undefined" ? undefined : selectedQueryCandidateIds, selectedQueryCandidateLabels: typeof selectedQueryCandidateLabels === "undefined" ? undefined : selectedQueryCandidateLabels, selectedVoiceDirections: typeof selectedVoiceDirections === "undefined" ? undefined : selectedVoiceDirections, selectedXQueryCandidateIds: typeof selectedXQueryCandidateIds === "undefined" ? undefined : selectedXQueryCandidateIds, selectedXQueryCandidates: typeof selectedXQueryCandidates === "undefined" ? undefined : selectedXQueryCandidates, setClusterMethod: typeof setClusterMethod === "undefined" ? undefined : setClusterMethod, term: typeof term === "undefined" ? undefined : term, toggleVoiceDirection: typeof toggleVoiceDirection === "undefined" ? undefined : toggleVoiceDirection, fallbackUsed: typeof fallbackUsed === "undefined" ? undefined : fallbackUsed, improvementComparison: typeof improvementComparison === "undefined" ? undefined : improvementComparison, lastAction: typeof lastAction === "undefined" ? undefined : lastAction},
    zoneState: { activeClusterRunId: typeof activeClusterRunId === "undefined" ? undefined : activeClusterRunId, afterDuplicateRate: typeof afterDuplicateRate === "undefined" ? undefined : afterDuplicateRate, afterNoiseRate: typeof afterNoiseRate === "undefined" ? undefined : afterNoiseRate, beforeDuplicateRate: typeof beforeDuplicateRate === "undefined" ? undefined : beforeDuplicateRate, beforeNoiseRate: typeof beforeNoiseRate === "undefined" ? undefined : beforeNoiseRate, clearActiveClusterRunState: typeof clearActiveClusterRunState === "undefined" ? undefined : clearActiveClusterRunState, costEfficiencyScore: typeof costEfficiencyScore === "undefined" ? undefined : costEfficiencyScore, diversityScore: typeof diversityScore === "undefined" ? undefined : diversityScore, duplicateCount: typeof duplicateCount === "undefined" ? undefined : duplicateCount, duplicateLikeRate: typeof duplicateLikeRate === "undefined" ? undefined : duplicateLikeRate, duplicateRate: typeof duplicateRate === "undefined" ? undefined : duplicateRate, duplicateSkippedCount: typeof duplicateSkippedCount === "undefined" ? undefined : duplicateSkippedCount, expandedClusterIds: typeof expandedClusterIds === "undefined" ? undefined : expandedClusterIds, formatScore: typeof formatScore === "undefined" ? undefined : formatScore, getOpinionRowClass: typeof getOpinionRowClass === "undefined" ? undefined : getOpinionRowClass, getScoreForDisplay: typeof getScoreForDisplay === "undefined" ? undefined : getScoreForDisplay, getScoreTripletForDisplay: typeof getScoreTripletForDisplay === "undefined" ? undefined : getScoreTripletForDisplay, handleRunAutoSummary: typeof handleRunAutoSummary === "undefined" ? undefined : handleRunAutoSummary, handleRunClusterSummary: typeof handleRunClusterSummary === "undefined" ? undefined : handleRunClusterSummary, handleRunSemanticCluster: typeof handleRunSemanticCluster === "undefined" ? undefined : handleRunSemanticCluster, handleSort: typeof handleSort === "undefined" ? undefined : handleSort, hasScoredWithCurrentAxis: typeof hasScoredWithCurrentAxis === "undefined" ? undefined : hasScoredWithCurrentAxis, independent: typeof independent === "undefined" ? undefined : independent, independentOpinionCount: typeof independentOpinionCount === "undefined" ? undefined : independentOpinionCount, independentOpinionRate: typeof independentOpinionRate === "undefined" ? undefined : independentOpinionRate, inferLowAxisDescription: typeof inferLowAxisDescription === "undefined" ? undefined : inferLowAxisDescription, isClusterSummaryLoadingById: typeof isClusterSummaryLoadingById === "undefined" ? undefined : isClusterSummaryLoadingById, isSelectedCluster: typeof isSelectedCluster === "undefined" ? undefined : isSelectedCluster, isSemanticClusterLoading: typeof isSemanticClusterLoading === "undefined" ? undefined : isSemanticClusterLoading, onAutoSummary: typeof onAutoSummary === "undefined" ? undefined : onAutoSummary, onFeedback: typeof onFeedback === "undefined" ? undefined : onFeedback, onGraphModeChange: typeof onGraphModeChange === "undefined" ? undefined : onGraphModeChange, onRescore: typeof onRescore === "undefined" ? undefined : onRescore, onScoreDisplayModeChange: typeof onScoreDisplayModeChange === "undefined" ? undefined : onScoreDisplayModeChange, onSemanticCluster: typeof onSemanticCluster === "undefined" ? undefined : onSemanticCluster, onSort: typeof onSort === "undefined" ? undefined : onSort, onToggleOriginCentered: typeof onToggleOriginCentered === "undefined" ? undefined : onToggleOriginCentered, opinionRowClass: typeof opinionRowClass === "undefined" ? undefined : opinionRowClass, originCentered: typeof originCentered === "undefined" ? undefined : originCentered, originalCount: typeof originalCount === "undefined" ? undefined : originalCount, originalErrorMessage: typeof originalErrorMessage === "undefined" ? undefined : originalErrorMessage, originalNo: typeof originalNo === "undefined" ? undefined : originalNo, originalScore: typeof originalScore === "undefined" ? undefined : originalScore, originalText: typeof originalText === "undefined" ? undefined : originalText, overallRetrievalQuality: typeof overallRetrievalQuality === "undefined" ? undefined : overallRetrievalQuality, readLoadScore: typeof readLoadScore === "undefined" ? undefined : readLoadScore, regenerateFeedback: typeof regenerateFeedback === "undefined" ? undefined : regenerateFeedback, relevanceScore: typeof relevanceScore === "undefined" ? undefined : relevanceScore, renderHighlightedText: typeof renderHighlightedText === "undefined" ? undefined : renderHighlightedText, renderHighlightedZone12Text: typeof renderHighlightedZone12Text === "undefined" ? undefined : renderHighlightedZone12Text, renderScoreReasonGrid: typeof renderScoreReasonGrid === "undefined" ? undefined : renderScoreReasonGrid, rescore: typeof rescore === "undefined" ? undefined : rescore, rescoreButtonText: typeof rescoreButtonText === "undefined" ? undefined : rescoreButtonText, rescoreStatus: typeof rescoreStatus === "undefined" ? undefined : rescoreStatus, rescoreTitle: typeof rescoreTitle === "undefined" ? undefined : rescoreTitle, rescoreWithCurrentAxis: typeof rescoreWithCurrentAxis === "undefined" ? undefined : rescoreWithCurrentAxis, resetAutoSummaryState: typeof resetAutoSummaryState === "undefined" ? undefined : resetAutoSummaryState, resolvedScoreDisplayMode: typeof resolvedScoreDisplayMode === "undefined" ? undefined : resolvedScoreDisplayMode, selectAxisPreset: typeof selectAxisPreset === "undefined" ? undefined : selectAxisPreset, selectedClusterId: typeof selectedClusterId === "undefined" ? undefined : selectedClusterId, setActiveClusterRunId: typeof setActiveClusterRunId === "undefined" ? undefined : setActiveClusterRunId, setAutoSummaryLimit: typeof setAutoSummaryLimit === "undefined" ? undefined : setAutoSummaryLimit, setClusterSummaries: typeof setClusterSummaries === "undefined" ? undefined : setClusterSummaries, setClusterThreshold: typeof setClusterThreshold === "undefined" ? undefined : setClusterThreshold, spread: typeof spread === "undefined" ? undefined : spread, spreadDominanceRate: typeof spreadDominanceRate === "undefined" ? undefined : spreadDominanceRate, spreadReferenceCount: typeof spreadReferenceCount === "undefined" ? undefined : spreadReferenceCount, targetZone: typeof targetZone === "undefined" ? undefined : targetZone, topNoiseReasons: typeof topNoiseReasons === "undefined" ? undefined : topNoiseReasons, userReferenceGraphMessage: typeof userReferenceGraphMessage === "undefined" ? undefined : userReferenceGraphMessage, userReferenceGraphWarning: typeof userReferenceGraphWarning === "undefined" ? undefined : userReferenceGraphWarning, volume: typeof volume === "undefined" ? undefined : volume, afterOverviewContent: typeof afterOverviewContent === "undefined" ? undefined : afterOverviewContent, compressionRate: typeof compressionRate === "undefined" ? undefined : compressionRate, evaluationAxes: typeof evaluationAxes === "undefined" ? undefined : evaluationAxes, expansionKey: typeof expansionKey === "undefined" ? undefined : expansionKey, hasDetailPanel: typeof hasDetailPanel === "undefined" ? undefined : hasDetailPanel, isAutoSummarizing: typeof isAutoSummarizing === "undefined" ? undefined : isAutoSummarizing, overview: typeof overview === "undefined" ? undefined : overview},
    runtimeDiagnosticsState: { afterStatus: typeof afterStatus === "undefined" ? undefined : afterStatus, beforeStatus: typeof beforeStatus === "undefined" ? undefined : beforeStatus, getReasonForRow: typeof getReasonForRow === "undefined" ? undefined : getReasonForRow, getStatusForRow: typeof getStatusForRow === "undefined" ? undefined : getStatusForRow, possibleMojibake: typeof possibleMojibake === "undefined" ? undefined : possibleMojibake, problem: typeof problem === "undefined" ? undefined : problem, problemReasons: typeof problemReasons === "undefined" ? undefined : problemReasons, qualityLabel: typeof qualityLabel === "undefined" ? undefined : qualityLabel, renderActionStatusButton: typeof renderActionStatusButton === "undefined" ? undefined : renderActionStatusButton, resetMojibakeRuntimeData: typeof resetMojibakeRuntimeData === "undefined" ? undefined : resetMojibakeRuntimeData, safeRuntimeText: typeof safeRuntimeText === "undefined" ? undefined : safeRuntimeText, selectionReason: typeof selectionReason === "undefined" ? undefined : selectionReason, setStagedFetchState: typeof setStagedFetchState === "undefined" ? undefined : setStagedFetchState },
    actionHandlers: { applySelectedDemoSample: typeof applySelectedDemoSample === "undefined" ? undefined : applySelectedDemoSample, autoResizeTextarea: typeof autoResizeTextarea === "undefined" ? undefined : autoResizeTextarea, currentAnalysisPurposeConfig: typeof currentAnalysisPurposeConfig === "undefined" ? undefined : currentAnalysisPurposeConfig, currentBatchCount: typeof currentBatchCount === "undefined" ? undefined : currentBatchCount, currentDataCount: typeof currentDataCount === "undefined" ? undefined : currentDataCount, currentInputSourceLabel: typeof currentInputSourceLabel === "undefined" ? undefined : currentInputSourceLabel, currentOpinionCount: typeof currentOpinionCount === "undefined" ? undefined : currentOpinionCount, currentPersonaConfig: typeof currentPersonaConfig === "undefined" ? undefined : currentPersonaConfig, currentSessionSampleLabel: typeof currentSessionSampleLabel === "undefined" ? undefined : currentSessionSampleLabel, currentXDataStateLabel: typeof currentXDataStateLabel === "undefined" ? undefined : currentXDataStateLabel, formatLabel: typeof formatLabel === "undefined" ? undefined : formatLabel, formatPercent: typeof formatPercent === "undefined" ? undefined : formatPercent, getChipClass: typeof getChipClass === "undefined" ? undefined : getChipClass, getItemTitle: typeof getItemTitle === "undefined" ? undefined : getItemTitle, getNextAction: typeof getNextAction === "undefined" ? undefined : getNextAction, handleAnalysisPurposeChange: typeof handleAnalysisPurposeChange === "undefined" ? undefined : handleAnalysisPurposeChange, handleFetchXButtonClick: typeof handleFetchXButtonClick === "undefined" ? undefined : handleFetchXButtonClick, handleForceStopRunningOperations: typeof handleForceStopRunningOperations === "undefined" ? undefined : handleForceStopRunningOperations, handleNextAction: typeof handleNextAction === "undefined" ? undefined : handleNextAction, handlePersonaModeChange: typeof handlePersonaModeChange === "undefined" ? undefined : handlePersonaModeChange, handleThemeChange: typeof handleThemeChange === "undefined" ? undefined : handleThemeChange, loadSample: typeof loadSample === "undefined" ? undefined : loadSample, preventDefault: typeof preventDefault === "undefined" ? undefined : preventDefault, renderAiDraftPanel: typeof renderAiDraftPanel === "undefined" ? undefined : renderAiDraftPanel, renderLocalPublishPanel: typeof renderLocalPublishPanel === "undefined" ? undefined : renderLocalPublishPanel, rendering: typeof rendering === "undefined" ? undefined : rendering, resetUserInputArea: typeof resetUserInputArea === "undefined" ? undefined : resetUserInputArea, retryCount: typeof retryCount === "undefined" ? undefined : retryCount, selectionType: typeof selectionType === "undefined" ? undefined : selectionType, setUserOpinion: typeof setUserOpinion === "undefined" ? undefined : setUserOpinion, truncateText: typeof truncateText === "undefined" ? undefined : truncateText, actions: typeof actions === "undefined" ? undefined : actions, onForceStop: typeof onForceStop === "undefined" ? undefined : onForceStop},
    dashboardState: { actionLabel: typeof actionLabel === "undefined" ? undefined : actionLabel, actionType: typeof actionType === "undefined" ? undefined : actionType, compactDashboardLabel: typeof compactDashboardLabel === "undefined" ? undefined : compactDashboardLabel, config: typeof config === "undefined" ? undefined : config, guide: typeof guide === "undefined" ? undefined : guide, help: typeof help === "undefined" ? undefined : help, onDashboardResizeStart: typeof onDashboardResizeStart === "undefined" ? undefined : onDashboardResizeStart, onSidebarResizeStart: typeof onSidebarResizeStart === "undefined" ? undefined : onSidebarResizeStart, publicPreviewMode: typeof publicPreviewMode === "undefined" ? undefined : publicPreviewMode, stateLabel: typeof stateLabel === "undefined" ? undefined : stateLabel, presetKey: typeof presetKey === "undefined" ? undefined : presetKey},
    runtimeLayoutState: { accumulatedCount: typeof accumulatedCount === "undefined" ? undefined : accumulatedCount, autoFetchSafetyLimit: typeof autoFetchSafetyLimit === "undefined" ? undefined : autoFetchSafetyLimit, checked: typeof checked === "undefined" ? undefined : checked, colSpan: typeof colSpan === "undefined" ? undefined : colSpan, count: typeof count === "undefined" ? undefined : count, counts: typeof counts === "undefined" ? undefined : counts, enabled: typeof enabled === "undefined" ? undefined : enabled, gridTemplateColumns: typeof gridTemplateColumns === "undefined" ? undefined : gridTemplateColumns, improvedAddFetchCount: typeof improvedAddFetchCount === "undefined" ? undefined : improvedAddFetchCount, improvedRefetchCount: typeof improvedRefetchCount === "undefined" ? undefined : improvedRefetchCount, index: typeof index === "undefined" ? undefined : index, isExpanded: typeof isExpanded === "undefined" ? undefined : isExpanded, length: typeof length === "undefined" ? undefined : length, limit: typeof limit === "undefined" ? undefined : limit, max: typeof max === "undefined" ? undefined : max, maxFetchCount: typeof maxFetchCount === "undefined" ? undefined : maxFetchCount, min: typeof min === "undefined" ? undefined : min, minLikes: typeof minLikes === "undefined" ? undefined : minLikes, min_likes: typeof min_likes === "undefined" ? undefined : min_likes, newUniqueCount: typeof newUniqueCount === "undefined" ? undefined : newUniqueCount, normalizedCount: typeof normalizedCount === "undefined" ? undefined : normalizedCount, open: typeof open === "undefined" ? undefined : open, panelRef: typeof panelRef === "undefined" ? undefined : panelRef, rawCount: typeof rawCount === "undefined" ? undefined : rawCount, remainingCount: typeof remainingCount === "undefined" ? undefined : remainingCount, requestedFetchCount: typeof requestedFetchCount === "undefined" ? undefined : requestedFetchCount, rtExtractSuccessCount: typeof rtExtractSuccessCount === "undefined" ? undefined : rtExtractSuccessCount, targetCount: typeof targetCount === "undefined" ? undefined : targetCount, timestamp: typeof timestamp === "undefined" ? undefined : timestamp, tooShortCount: typeof tooShortCount === "undefined" ? undefined : tooShortCount, totalApiFetchedCount: typeof totalApiFetchedCount === "undefined" ? undefined : totalApiFetchedCount, uniqueNormalizedCount: typeof uniqueNormalizedCount === "undefined" ? undefined : uniqueNormalizedCount },
    rowSnapshotState: { base: typeof base === "undefined" ? undefined : base, category: typeof category === "undefined" ? undefined : category, cleanOpinion: typeof cleanOpinion === "undefined" ? undefined : cleanOpinion, code: typeof code === "undefined" ? undefined : code, detail: typeof detail === "undefined" ? undefined : detail, en: typeof en === "undefined" ? undefined : en, event: typeof event === "undefined" ? undefined : event, has: typeof has === "undefined" ? undefined : has, is: typeof is === "undefined" ? undefined : is, ja: typeof ja === "undefined" ? undefined : ja, keyPoints: typeof keyPoints === "undefined" ? undefined : keyPoints, lang: typeof lang === "undefined" ? undefined : lang, language: typeof language === "undefined" ? undefined : language, links: typeof links === "undefined" ? undefined : links, lowDescription: typeof lowDescription === "undefined" ? undefined : lowDescription, misc: typeof misc === "undefined" ? undefined : misc, nextOpinion: typeof nextOpinion === "undefined" ? undefined : nextOpinion, nextValue: typeof nextValue === "undefined" ? undefined : nextValue, normalizedText: typeof normalizedText === "undefined" ? undefined : normalizedText, note: typeof note === "undefined" ? undefined : note, point: typeof point === "undefined" ? undefined : point, posts: typeof posts === "undefined" ? undefined : posts, preset: typeof preset === "undefined" ? undefined : preset, previous: typeof previous === "undefined" ? undefined : previous, reply: typeof reply === "undefined" ? undefined : reply, shortDescription: typeof shortDescription === "undefined" ? undefined : shortDescription, silent: typeof silent === "undefined" ? undefined : silent, suggestion: typeof suggestion === "undefined" ? undefined : suggestion, target: typeof target === "undefined" ? undefined : target, textThreshold: typeof textThreshold === "undefined" ? undefined : textThreshold, threshold: typeof threshold === "undefined" ? undefined : threshold, userMessage: typeof userMessage === "undefined" ? undefined : userMessage, y: typeof y === "undefined" ? undefined : y, z: typeof z === "undefined" ? undefined : z, entries: typeof entries === "undefined" ? undefined : entries, isArray: typeof isArray === "undefined" ? undefined : isArray, isFinite: typeof isFinite === "undefined" ? undefined : isFinite},

  });
  const userModeController = createUserModeController(userModeControllerPayload);

  return userModeController.pageElement;
}





































