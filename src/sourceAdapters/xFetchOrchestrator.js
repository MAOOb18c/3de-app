export function queryBuildFieldsForStage(queryInfo = {}, fallbackQuery = "") {
  return {
    rawQuery: queryInfo.rawQuery || fallbackQuery,
    safeQuery: queryInfo.safeQuery || queryInfo.finalQuery || fallbackQuery,
    fallbackQuery: queryInfo.fallbackQuery || "",
    finalQueryForXApi: queryInfo.finalQueryForXApi || queryInfo.finalQuery || queryInfo.safeQuery || fallbackQuery,
    queryBuildStatus: queryInfo.queryBuildStatus || "safe",
    queryBuildWarnings: queryInfo.queryBuildWarnings || [],
    apiErrorMessage: queryInfo.apiErrorMessage || "",
    errorType: queryInfo.errorType || "",
    originalErrorMessage: queryInfo.originalErrorMessage || "",
    errorTimestamp: queryInfo.errorTimestamp || "",
    retryCount: queryInfo.retryCount || 0,
    attemptedQueries: queryInfo.attemptedQueries || [],
    retryQueries: queryInfo.retryQueries || [],
    fallbackUsed: Boolean(queryInfo.fallbackUsed),
    sanitizedHashtagRemovedParts: queryInfo.sanitizedHashtagRemovedParts || [],
    sanitizedExcludeRemovedParts: queryInfo.sanitizedExcludeRemovedParts || [],
  };
}

export function validateXFetchRequest({
  effectiveQuery,
  isEffectiveQueryTooLong,
  limit,
  maxFetchCount,
  query,
}) {
  if (!query) {
    return {
      ok: false,
      message: "X検索キーワードを入力してください。",
    };
  }

  if (isEffectiveQueryTooLong && query === effectiveQuery.trim()) {
    return {
      ok: false,
      message: "検索クエリが長すぎる可能性があります。",
      statusMessage: "検索クエリが長すぎる可能性があります。候補を減らしてください。",
    };
  }

  if (!Number.isFinite(limit) || limit < 10 || limit > maxFetchCount) {
    const message = `取得件数は10-${maxFetchCount}の範囲で指定してください。`;
    return {
      ok: false,
      message,
    };
  }

  return { ok: true };
}
