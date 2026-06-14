// sourceDiagnostics is source-specific fetch information: HTTP status,
// requested/returned counts, stopReason, fallback, fetchedAt, and API errors.
export function createEmptySourceDiagnostics({
  status = "idle",
  query = "",
  requested = 0,
  returned = 0,
  fallbackUsed = false,
  httpStatus = null,
  errorCode = "",
  errorType = "",
  message = "",
  diagnostics = undefined,
} = {}) {
  return {
    status,
    query,
    requested,
    returned,
    fallbackUsed,
    httpStatus,
    errorCode,
    errorType,
    message,
    ...(diagnostics === undefined ? {} : { diagnostics }),
  };
}

export function normalizeSourceDiagnostics(value = {}, defaults = {}) {
  return createEmptySourceDiagnostics({
    ...defaults,
    ...value,
    diagnostics: value.diagnostics ?? defaults.diagnostics,
  });
}

// countDiagnostics is source-independent count and analysis availability
// information: fetched/displayed/analysis-target/adopted/boundary/noise counts.
export function createEmptyCountDiagnostics({
  requested = 0,
  returned = 0,
  apiReturnedCount = 0,
  stopReason = "",
  diagnosisStatus = "",
} = {}) {
  return {
    requested,
    returned,
    apiReturnedCount,
    stopReason,
    diagnosisStatus,
  };
}

export function normalizeCountDiagnostics(value = {}, defaults = {}) {
  return createEmptyCountDiagnostics({
    ...defaults,
    ...value,
  });
}

export function isSourceDiagnosticsEmpty(value = {}) {
  const normalized = normalizeSourceDiagnostics(value);
  return (
    normalized.status === "idle" &&
    !normalized.query &&
    !normalized.requested &&
    !normalized.returned &&
    !normalized.fallbackUsed &&
    !normalized.httpStatus &&
    !normalized.errorCode &&
    !normalized.errorType
  );
}

export function isCountDiagnosticsEmpty(value = {}) {
  const normalized = normalizeCountDiagnostics(value);
  return (
    !normalized.requested &&
    !normalized.returned &&
    !normalized.apiReturnedCount &&
    !normalized.stopReason &&
    !normalized.diagnosisStatus
  );
}

export function createDashboardCountBreakdownIndicators({
  activeDisplaySlot,
  currentOpinionCount = 0,
  defaultTargetCount = 0,
  hasRealSourceData = false,
  noiseProcessingResult = {},
  stagedCurrentDataCount = 0,
  stagedFetchState = {},
  clusterCount = 0,
  stopReasonLabel = (value) => value,
} = {}) {
  const stageLogs = Array.isArray(stagedFetchState.stageLogs) ? stagedFetchState.stageLogs : [];
  const latestStage = stageLogs.length > 0 ? stageLogs[stageLogs.length - 1] : null;
  const stageTotals = stageLogs.reduce(
    (acc, stage) => ({
      requested: acc.requested + (Number(stage.requestedFetchCount) || 0),
      apiReturned: acc.apiReturned + (Number(stage.apiReturnedCount ?? stage.rawFetchedCount) || 0),
      newUnique: acc.newUnique + (Number(stage.newUniqueCount ?? stage.addedToCurrentDataCount) || 0),
      duplicates: acc.duplicates + (Number(stage.duplicateSkippedCount) || 0),
      noiseRemoved: acc.noiseRemoved + (Number(stage.noiseRemovedCount) || 0),
    }),
    { requested: 0, apiReturned: 0, newUnique: 0, duplicates: 0, noiseRemoved: 0 }
  );
  const slotDiagnostics = normalizeCountDiagnostics(activeDisplaySlot?.countDiagnostics || {});
  const targetCount = activeDisplaySlot
    ? Number(slotDiagnostics.requested) || activeDisplaySlot.texts?.length || defaultTargetCount
    : defaultTargetCount || stagedFetchState.targetCount || 0;
  const apiReturnedCount = hasRealSourceData
    ? Number(slotDiagnostics.apiReturnedCount ?? slotDiagnostics.count) ||
      stagedFetchState.totalApiFetchedCount ||
      stageTotals.apiReturned ||
      stagedCurrentDataCount ||
      currentOpinionCount
    : 0;
  const textExtractedCount = currentOpinionCount;
  const uniqueCount = noiseProcessingResult.uniqueNormalizedCount || stageTotals.newUnique || stagedCurrentDataCount || textExtractedCount;
  const duplicateCount = noiseProcessingResult.duplicateCount || stageTotals.duplicates || 0;
  const noiseExcludedCount = noiseProcessingResult.noiseExcludedCount || stageTotals.noiseRemoved || 0;
  const analysisTargetCount = noiseProcessingResult.analysisTargetCount || 0;
  const boundaryCount =
    noiseProcessingResult.borderlineUsefulCount ||
    noiseProcessingResult.personaAStrictRelevance?.borderlineCount ||
    0;
  const rawStopReason =
    slotDiagnostics.stopReason ||
    activeDisplaySlot?.stopReason ||
    stagedFetchState.stopReason ||
    latestStage?.stopReason ||
    "";
  const stopReason = rawStopReason ? stopReasonLabel(rawStopReason) : "";

  return [
    { label: "目標", value: `${targetCount}件`, tone: targetCount > 0 ? "idle" : "warning" },
    { label: "API返却", value: `${apiReturnedCount}件`, tone: apiReturnedCount > 0 ? "success" : "idle" },
    { label: "抽出", value: `${textExtractedCount}件`, tone: textExtractedCount > 0 ? "success" : "idle" },
    { label: "重複後", value: `${uniqueCount}件`, tone: uniqueCount > 0 ? "success" : "idle" },
    { label: "重複除外", value: `${duplicateCount}件`, tone: duplicateCount > 0 ? "warning" : "idle" },
    { label: "ノイズ除外", value: `${noiseExcludedCount}件`, tone: noiseExcludedCount > 0 ? "warning" : "idle" },
    { label: "分析対象", value: `${analysisTargetCount}件`, tone: analysisTargetCount > 0 ? "success" : "warning" },
    { label: "境界", value: `${boundaryCount}件`, tone: boundaryCount > 0 ? "warning" : "idle" },
    { label: "クラスタ", value: `${clusterCount}件`, tone: clusterCount > 0 ? "success" : "idle" },
    { label: "表示件数", value: `${currentOpinionCount}件`, tone: currentOpinionCount > 0 ? "success" : "idle" },
    ...(stopReason ? [{ label: "停止理由", value: stopReason, tone: rawStopReason === "target_reached" ? "idle" : "warning" }] : []),
  ];
}
