import { createEmptySourceDiagnostics } from "../diagnostics/diagnosticsModel.js";
import { SOURCE_TYPES, createSourceMeta } from "./sourceTypes.js";

export const X_SOURCE_LABEL = "X";

// First concrete source adapter boundary. X is sourceType "x"; future
// web/csv/survey/manual/transcript adapters should produce the same normalized
// posts/texts shape before App.jsx consumes their results.
export function createXSourceMeta({
  fetchedAt = "",
  stopReason = "",
  fallbackUsed = false,
} = {}) {
  return createSourceMeta({
    sourceType: SOURCE_TYPES.X,
    sourceLabel: X_SOURCE_LABEL,
    fetchedAt,
    stopReason,
    fallbackUsed,
  });
}

export function normalizeXPostText(post) {
  return String(post?.text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeXPostsFromPayload(payload = {}) {
  const posts = Array.isArray(payload.posts) ? payload.posts : [];
  const texts = posts.map(normalizeXPostText).filter(Boolean);

  return {
    posts,
    texts,
  };
}

export function buildXSearchParams(query, maxResults) {
  return new URLSearchParams({
    query,
    max_results: String(maxResults),
  });
}

export function createXApiError({
  message,
  errorType = "x_api_error",
  originalErrorMessage = "",
  attemptedAt = "",
  queryInfo = {},
  finalQueryForXApi = "",
  apiErrorMessage = originalErrorMessage,
} = {}) {
  const error = new Error(message || apiErrorMessage || "X API request failed.");

  error.errorType = errorType;
  error.originalErrorMessage = originalErrorMessage;
  error.timestamp = attemptedAt;
  error.rawQuery = queryInfo.rawQuery;
  error.safeQuery = queryInfo.safeQuery;
  error.fallbackQuery = queryInfo.fallbackQuery;
  error.finalQueryForXApi = finalQueryForXApi;
  error.apiErrorMessage = apiErrorMessage;
  error.queryBuildWarnings = queryInfo.queryBuildWarnings;
  error.sanitizedHashtagRemovedParts = queryInfo.sanitizedHashtagRemovedParts || [];
  error.sanitizedExcludeRemovedParts = queryInfo.sanitizedExcludeRemovedParts || [];
  error.queryLength = finalQueryForXApi.length;

  return error;
}

export function createXFetchDebug({
  status,
  query,
  requested,
  returned = 0,
  fallbackUsed = false,
  httpStatus = null,
  errorCode = "",
  errorType = "",
  message = "",
  diagnostics = undefined,
} = {}) {
  return createEmptySourceDiagnostics({
    status,
    query,
    requested,
    returned,
    fallbackUsed,
    httpStatus,
    errorCode,
    errorType,
    message,
    diagnostics,
  });
}
