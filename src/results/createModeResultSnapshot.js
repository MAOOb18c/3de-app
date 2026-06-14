export function createModeResultSnapshot({
  sourceMode,
  inputKey,
  theme,
  userOpinion,
  posts = [],
  texts = [],
  // countDiagnostics is source-independent count and analysis availability:
  // requested, returned/displayed, apiReturnedCount, analysis target,
  // adopted/boundary/noise, and graph-visible external opinion counts.
  // X-specific HTTP/status/fallback/stopReason details belong to
  // sourceDiagnostics, currently represented by beginnerXFetchDebug.
  countDiagnostics = {},
  graphData = null,
  comments = null,
  analysisResult = null,
  clusters = [],
  axisSettings = null,
  zone11Report = "",
  zone12Diagnostics = null,
  fallbackUsed = false,
  fetchStatus = "idle",
  generatedQuery = "",
  finalQuery = "",
  queryInfo = null,
  sourceDiagnostics = null,
  stopReason = "",
} = {}) {
  // Future sourceType model direction, without migrating existing data yet:
  // { sourceType, sourceLabel, posts, sourceDiagnostics, countDiagnostics,
  //   fetchedAt, fallbackUsed, stopReason }.
  return {
    sourceMode,
    inputKey,
    theme,
    userOpinion,
    posts,
    texts,
    countDiagnostics,
    graphData,
    comments,
    analysisResult,
    clusters,
    axisSettings,
    zone11Report,
    zone12Diagnostics,
    fallbackUsed,
    fetchStatus,
    generatedQuery,
    finalQuery,
    queryInfo,
    sourceDiagnostics,
    stopReason,
    createdAt: new Date().toISOString(),
  };
}
