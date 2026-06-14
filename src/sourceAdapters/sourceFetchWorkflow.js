import { makeRetryQueryFromSafeInfo, makeStageLogEntry } from "../app/appSupport.jsx";
import { fetchSourceOpinions } from "./fetchSourceOpinions.js";
import { queryBuildFieldsForStage } from "./xFetchOrchestrator.js";

export async function runSourceFetchWorkflow({
  sourceType,
  input,
  options = {},
  dependencies = {},
}) {
  const outcome = await fetchSourceOpinions({
    sourceType,
    input,
    options,
    dependencies,
  });

  return createSourceFetchOutcome({
    sourceType,
    outcome,
    requested: input?.limit,
    query: input?.query,
  });
}

export function createSourceFetchOutcome({
  sourceType,
  outcome,
  requested,
  query,
}) {
  const queryInfo = outcome?.queryInfo || {};
  const finalQuery = queryInfo.finalQuery || query;

  return {
    ...outcome,
    sourceType: outcome?.sourceType || sourceType,
    sourceLabel: outcome?.sourceLabel || "X",
    sourceOutcome: outcome,
    queryInfo,
    finalQuery,
    requested,
    returned: Array.isArray(outcome?.texts) ? outcome.texts.length : 0,
    apiReturnedCount: queryInfo.apiReturnedCount ?? outcome?.texts?.length ?? 0,
    fallbackUsed: Boolean(queryInfo.fallbackUsed),
    sourceDiagnostics: outcome?.sourceDiagnostics || queryInfo.apiDiagnostics || null,
  };
}

export function createSourceStageLog({
  outcome,
  fallbackQuery = "",
  ...stageFields
}) {
  return makeStageLogEntry({
    ...stageFields,
    ...queryBuildFieldsForStage(outcome?.queryInfo || {}, fallbackQuery),
  });
}

export function sourceOutcomeQuery(outcome, fallbackQuery = "") {
  return outcome?.finalQuery || outcome?.queryInfo?.finalQuery || fallbackQuery;
}

export function sourceOutcomeApiReturnedCount(outcome) {
  return outcome?.apiReturnedCount ?? outcome?.texts?.length ?? 0;
}

export function sourceOutcomeRetryQuery(outcome, theme, userOpinion, fallbackQuery = "") {
  return makeRetryQueryFromSafeInfo(outcome?.queryInfo || {}, theme, userOpinion) || fallbackQuery;
}

export function createSourceErrorStageLog({
  error,
  fallbackQuery = "",
  ...stageFields
}) {
  return makeStageLogEntry({
    ...stageFields,
    rawQuery: error.rawQuery || fallbackQuery,
    safeQuery: error.safeQuery || "",
    fallbackQuery: error.fallbackQuery || "",
    finalQueryForXApi: error.finalQueryForXApi || error.safeQuery || fallbackQuery,
    queryBuildStatus: "error",
    queryBuildWarnings: error.queryBuildWarnings || [],
    apiErrorMessage: error.apiErrorMessage || error.message || "",
    errorType: error.errorType || "",
    originalErrorMessage: error.originalErrorMessage || error.apiErrorMessage || "",
    errorTimestamp: error.timestamp || new Date().toISOString(),
    retryCount: error.fallbackQuery ? 1 : 0,
    fallbackUsed: Boolean(error.fallbackQuery),
    sanitizedHashtagRemovedParts: error.sanitizedHashtagRemovedParts || [],
    sanitizedExcludeRemovedParts: error.sanitizedExcludeRemovedParts || [],
  });
}
