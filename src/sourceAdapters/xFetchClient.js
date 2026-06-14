import {
  buildPurposeFallbackIncludeGroups,
  buildSafeXQuery,
  buildSafeXQueryFromRaw,
  looksLikeMojibake,
  uniqueByValue,
} from "../app/appSupport.jsx";
import { JP_UI_LABELS } from "../data/uiLabels.js";
import {
  buildXSearchParams,
  createXApiError,
  normalizeXPostsFromPayload,
} from "./xSourceAdapter.js";

export function isInvalidXQueryErrorMessage(message) {
  return /invalid|parameter|query|演算子|検索/i.test(String(message || ""));
}

export function isApiCreditErrorMessage(message) {
  return /does not have any credits|no credits|credits to fulfill this request|credit/i.test(String(message || ""));
}

export async function requestXPostsWithFallback({
  query,
  limit,
  options = {},
  context,
}) {
  const {
    apiBaseUrl,
    themeCategory,
    theme,
    userOpinion,
    personaMode,
    analysisPurposeMode,
    selectedHashtagValues,
    selectedExcludeTermValues,
    xFetchAbortControllerRef,
  } = context;

  const queryInfo = buildSafeXQueryFromRaw(query, {
    sampleKey: themeCategory,
    theme,
    userOpinion,
    personaMode,
    analysisPurposeMode,
    hashtags: options.hashtags ?? selectedHashtagValues,
    excludeTerms: options.excludeTerms ?? selectedExcludeTermValues,
  });
  const purposeFallbackGroups = buildPurposeFallbackIncludeGroups({
    sampleKey: themeCategory,
    theme,
    userOpinion,
    personaMode,
    analysisPurposeMode,
  });
  const attempts = uniqueByValue([
    queryInfo.finalQueryForXApi,
    queryInfo.fallbackQueryForXApi,
    buildSafeXQuery({
      includeGroups: purposeFallbackGroups.length
        ? purposeFallbackGroups.slice(0, 3)
        : [["恋愛相談 不安"]],
      hashtags: [],
      excludeTerms: [],
    }).query,
  ]).filter((attemptQuery) => attemptQuery && !looksLikeMojibake(attemptQuery));
  const attemptedQueries = [];
  let lastErrorMessage = "";

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
    const attemptQuery = attempts[attemptIndex];
    attemptedQueries.push(attemptQuery);
    const attemptedAt = new Date().toISOString();
    const params = buildXSearchParams(attemptQuery, limit);
    const response = await fetch(`${apiBaseUrl}/api/x-search?${params.toString()}`, {
      signal: options.signal || xFetchAbortControllerRef.current?.signal,
    });
    const payload = await response.json();

    if (!response.ok) {
      lastErrorMessage = payload.error || "X API取得に失敗しました。";
      const isCreditError = isApiCreditErrorMessage(lastErrorMessage);
      if (attemptIndex < attempts.length - 1 && isInvalidXQueryErrorMessage(lastErrorMessage)) {
        continue;
      }

      throw createXApiError({
        message: isCreditError
          ? JP_UI_LABELS.apiCreditExhaustedMessage
          : isInvalidXQueryErrorMessage(lastErrorMessage)
            ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
            : lastErrorMessage,
        errorType: isCreditError ? "api_credit_exhausted" : "x_api_error",
        originalErrorMessage: lastErrorMessage,
        attemptedAt,
        queryInfo: {
          ...queryInfo,
          attemptedQueries: [...attemptedQueries],
          finalQuery: attemptQuery,
          finalQueryForXApi: attemptQuery,
        },
        finalQueryForXApi: attemptQuery,
        apiErrorMessage: lastErrorMessage,
      });
    }

    const { posts, texts } = normalizeXPostsFromPayload(payload);

    return {
      posts,
      texts,
      queryInfo: {
        ...queryInfo,
        finalQuery: attemptQuery,
        finalQueryForXApi: attemptQuery,
        attemptedQueries: [...attemptedQueries],
        retryQueries: attemptedQueries.slice(1),
        queryBuildStatus: attemptIndex > 0 ? "fallback" : "safe",
        fallbackUsed: attemptIndex > 0,
        retryCount: attemptIndex,
        apiDiagnostics: payload.diagnostics || null,
        requestedMaxResults: payload.requested_max_results ?? limit,
        apiReturnedCount: payload.count ?? posts.length,
        apiErrorMessage: lastErrorMessage,
      },
    };
  }

  throw new Error("X API取得に失敗しました。");
}
