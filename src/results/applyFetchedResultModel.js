import { createModeResultSnapshot } from "./createModeResultSnapshot.js";

export function shouldStoreFetchedUserResult({ sourceMode, appMode } = {}) {
  return sourceMode === "user" || (!sourceMode && appMode !== "beginner" && appMode !== "guide");
}

export function createFetchedUserResultSnapshot({
  appMode,
  options = {},
  currentModeInputKey,
  theme,
  userOpinion,
  posts = [],
  texts = [],
  xMaxResults,
  stagedFetchState = {},
  semanticClusterRows = [],
  axisConfig,
  effectiveQuery = "",
} = {}) {
  if (!shouldStoreFetchedUserResult({ sourceMode: options.sourceMode, appMode })) {
    return null;
  }

  return createModeResultSnapshot({
    sourceMode: "user",
    inputKey: options.inputKey || currentModeInputKey,
    theme,
    userOpinion,
    posts,
    texts,
    // User-mode result slots keep only the normalized count fields consumed by
    // dashboardCountBreakdownIndicators. Future sourceDiagnostics can sit
    // beside countDiagnostics without changing Beginner/User displays.
    countDiagnostics: {
      requested: options.requested ?? Number(xMaxResults) ?? texts.length,
      returned: texts.length,
      apiReturnedCount: options.apiReturnedCount ?? texts.length,
      stopReason: options.stopReason || stagedFetchState.stopReason || "",
      diagnosisStatus: options.diagnosis?.status || stagedFetchState.diagnosisStatus || "",
    },
    analysisResult: options.analysisResult || null,
    clusters: semanticClusterRows,
    axisSettings: axisConfig,
    zone11Report: options.zone11Report || "",
    zone12Diagnostics: options.zone12Diagnostics || null,
    fallbackUsed: Boolean(options.fallbackUsed),
    fetchStatus: options.fetchStatus || "success",
    generatedQuery: options.generatedQuery || effectiveQuery,
    finalQuery: options.finalQuery || effectiveQuery,
    queryInfo: options.queryInfo || null,
    sourceDiagnostics: options.sourceDiagnostics || null,
    stopReason: options.stopReason || stagedFetchState.stopReason || "",
  });
}

export function createBeginnerResultComments(result = {}) {
  return {
    otherOpinionComment: result.otherOpinionComment,
    userEvaluationComment: result.userEvaluationComment,
  };
}

export function createAutoUserFetchResultSnapshot({
  inputKey,
  theme,
  userOpinion,
  posts = [],
  texts = [],
  targetCount,
  stageLogs = [],
  stopReason = "",
  latestDiagnosis = null,
  analysisResult,
  axisConfig,
  initialQuery = "",
  finalQuery = "",
} = {}) {
  return createModeResultSnapshot({
    sourceMode: "user",
    inputKey,
    theme,
    userOpinion,
    posts,
    texts,
    // Auto User fetch keeps accumulated counts: requested target, returned
    // displayed texts, and apiReturnedCount as the raw stage total.
    countDiagnostics: {
      requested: targetCount,
      returned: texts.length,
      apiReturnedCount: stageLogs.reduce((sum, stage) => sum + (Number(stage.apiReturnedCount) || 0), 0),
      stopReason,
      diagnosisStatus: latestDiagnosis?.status || "",
    },
    analysisResult,
    clusters: analysisResult?.clusterTableRows || [],
    axisSettings: axisConfig,
    zone11Report: "",
    zone12Diagnostics: {
      noiseExcludedCount:
        latestDiagnosis?.noiseExcludedCount ?? analysisResult?.noiseProcessingResult?.noiseExcludedCount,
      analysisTargetCount:
        latestDiagnosis?.analysisCandidateCount ?? analysisResult?.noiseProcessingResult?.analysisTargetCount,
    },
    fallbackUsed: false,
    fetchStatus: "success",
    generatedQuery: initialQuery,
    finalQuery: finalQuery || initialQuery,
    queryInfo: {
      finalQueryForXApi: finalQuery || initialQuery,
      attemptedQueries: stageLogs.map((stage) => stage.finalQueryForXApi || stage.query).filter(Boolean),
    },
    stopReason,
  });
}

export function createBeginnerSuccessResultSnapshot({
  inputKey,
  theme,
  userOpinion,
  posts = [],
  texts = [],
  payload = {},
  analysisResult,
  generatedQuery = "",
  requested = 100,
} = {}) {
  return createModeResultSnapshot({
    sourceMode: "beginner",
    inputKey,
    theme,
    userOpinion,
    posts,
    texts,
    countDiagnostics: {
      requested,
      returned: texts.length,
      apiReturnedCount: payload.diagnostics?.apiReturnedCount ?? payload.count ?? texts.length,
      stopReason: payload.diagnostics?.stopReason || "",
    },
    graphData: analysisResult?.counts || null,
    comments: createBeginnerResultComments(analysisResult),
    fallbackUsed: false,
    fetchStatus: "success",
    generatedQuery,
    finalQuery: generatedQuery,
    queryInfo: {
      finalQueryForXApi: generatedQuery,
      attemptedQueries: generatedQuery ? [generatedQuery] : [],
    },
    sourceDiagnostics: payload.diagnostics || null,
    stopReason: payload.diagnostics?.stopReason || "",
  });
}

export function createBeginnerFallbackResultSnapshot({
  inputKey,
  theme,
  userOpinion,
  posts = [],
  texts = [],
  analysisResult,
  generatedQuery = "",
  errorType = "",
  requested = 100,
} = {}) {
  return createModeResultSnapshot({
    sourceMode: "beginner",
    inputKey,
    theme,
    userOpinion,
    posts,
    texts,
    countDiagnostics: {
      requested,
      returned: texts.length,
      apiReturnedCount: 0,
      stopReason: errorType,
    },
    graphData: analysisResult?.counts || null,
    comments: createBeginnerResultComments(analysisResult),
    fallbackUsed: true,
    fetchStatus: "fallback",
    generatedQuery,
    finalQuery: generatedQuery,
    queryInfo: {
      finalQueryForXApi: generatedQuery,
      attemptedQueries: generatedQuery ? [generatedQuery] : [],
    },
    stopReason: errorType,
  });
}
