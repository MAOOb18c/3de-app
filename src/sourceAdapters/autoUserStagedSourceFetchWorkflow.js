import {
  attachFetchMetaToPosts,
  buildExcludeTermCandidates,
  buildImprovedQueryCandidates,
  buildImprovementComparison,
  buildXQueryWithHashtags,
  calculateNextAddFetchCount,
  DEFAULT_ADD_FETCH_COUNT,
  MAX_API_ZERO_RETRIES,
  MAX_NO_NEW_UNIQUE_RETRIES,
  MAX_USER_AUTO_FETCH_ROUNDS,
  MIN_ADD_FETCH_COUNT,
  NOISE_RELEVANCE_THRESHOLD,
  PUBLIC_PREVIEW_MODE,
  queriesAreEquivalent,
  qualityLabel,
  queryKindLabel,
  STAGED_FETCH_INITIAL_COUNT,
  stopReasonLabel,
  stripXCommonFilters,
  textsFromPosts,
  truncateText,
  uniqueByValue,
  normalizeHashtag,
  mergePostsByText,
} from "../app/appSupport.jsx";
import { JP_UI_LABELS } from "../data/uiLabels.js";
import { createAutoUserFetchResultSnapshot } from "../results/applyFetchedResultModel.js";
import { isInvalidXQueryErrorMessage } from "./xFetchClient.js";
import {
  createSourceErrorStageLog,
  createSourceStageLog,
  sourceOutcomeQuery,
  sourceOutcomeRetryQuery,
} from "./sourceFetchWorkflow.js";
import { requestSourceOpinionsForWorkflow } from "./sourceFetchRequestModel.js";

export async function runAutoUserStagedSourceFetchWorkflow({
  sourceType,
  input,
  context,
  dependencies = {},
  services,
  callbacks,
}) {
  const { initialQuery, targetCount } = input;
  const {
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
  } = context;
  const {
    applyFetchedPosts,
    diagnoseQueryQuality,
    requestQueryDiagnosisAdvice,
  } = services;
  const {
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
    setXStatus,
  } = callbacks;

  const startedAt = new Date().toISOString();
  let activeQuery = initialQuery;
  let accumulatedPosts = [];
  let accumulatedTexts = [];
  let stageLogs = [];
  let latestDiagnosis = null;
  let latestAdvice = null;
  let latestImprovedCandidates = [];
  let latestRecommendedQuery = "";
  let latestComparison = null;
  let previousDiagnosis = null;
  let stopReason = "";
  let noImprovementRounds = 0;
  let improvedAddFetchCount = 0;
  let continueRemainingCount = 0;
  let beforeQuery = "";
  let afterQuery = initialQuery;
  let activeHashtags = selectedHashtagValues;
  let activeExcludeTerms = selectedExcludeTermValues;
  let apiZeroRetries = 0;
  let noNewUniqueRetries = 0;

  try {
    setNoiseRelevanceThreshold(NOISE_RELEVANCE_THRESHOLD);
    setOperationRunning(
      "fetchX",
      `外部意見を自動取得中... 0 / ${targetCount}件`,
      truncateText(initialQuery, 120)
    );
    prepareXFetch();
    setXStatus(`外部意見を取得中... 0 / ${targetCount}件。検索条件を自動調整しています。`);
    setStagedFetchState((previous) => ({
      ...previous,
      enabled: true,
      targetCount,
      currentStage: 0,
      stageLogs: [],
      fetchedCount: 0,
      totalFetchedCount: 0,
      currentBatchCount: 0,
      accumulatedCount: 0,
      currentDataCount: 0,
      totalApiFetchedCount: 0,
      remainingCount: targetCount,
      nextFetchCount: calculateNextAddFetchCount(0, targetCount),
      initialFetchCount: 0,
      diagnosisStatus: "checking",
      shouldPause: false,
      diagnosis: null,
      noiseBreakdown: [],
      queryTermDiagnosis: [],
      aiQueryAdvice: null,
      improvementComparison: null,
      improvedQueryCandidates: [],
      selectedImprovedQueryIndexes: [0],
      recommendedQuery: "",
      diagnosisDecision: "auto_user",
      lastAction: "auto_user_start",
      beforeQuery: "",
      afterQuery: initialQuery,
      improvedRefetchCount: 0,
      improvedAddFetchCount: 0,
      continueRemainingCount: 0,
      weakNoiseRetryAvailable: false,
      message: "外部意見を自動取得中です。まず30件を取得して品質を診断します。",
    }));

    const autoFetchSafetyRoundLimit = Math.max(
      MAX_USER_AUTO_FETCH_ROUNDS,
      Math.ceil(targetCount / Math.max(1, MIN_ADD_FETCH_COUNT)) + MAX_API_ZERO_RETRIES + MAX_NO_NEW_UNIQUE_RETRIES + 10
    );

    for (let round = 1; round <= autoFetchSafetyRoundLimit; round += 1) {
      const remainingCount = Math.max(0, targetCount - accumulatedTexts.length);
      if (remainingCount <= 0) {
        stopReason = "target_reached";
        break;
      }

      const requestedFetchCount = calculateNextAddFetchCount(
        accumulatedTexts.length,
        targetCount,
        round === 1 ? STAGED_FETCH_INITIAL_COUNT : DEFAULT_ADD_FETCH_COUNT
      );
      const action = round === 1 ? "initial" : activeQuery === initialQuery ? "continue_add" : "improved_add";
      const actionLabel =
        round === 1
          ? "初回30件診断"
          : action === "improved_add"
            ? "自動調整クエリで追加取得"
            : "このクエリのまま追加取得";

      setXStatus(
        `外部意見を取得中... ${accumulatedTexts.length} / ${targetCount}件。${round}回目：${actionLabel}`
      );
      setOperationRunning(
        "fetchX",
        `外部意見を自動取得中... ${accumulatedTexts.length} / ${targetCount}件`,
        truncateText(activeQuery, 120)
      );
      setStagedFetchState((previous) => ({
        ...previous,
        diagnosisStatus: "checking",
        lastAction: action,
        message: `${round}回目：${actionLabel}中です。`,
        nextFetchCount: requestedFetchCount,
      }));

      const batch = await requestSourceOpinionsForWorkflow({
        sourceType,
        query: activeQuery,
        limit: requestedFetchCount,
        options: {
          hashtags: activeHashtags,
          excludeTerms: activeExcludeTerms,
        },
        dependencies,
      });
      const executedQuery = sourceOutcomeQuery(batch, activeQuery);
      const apiReturnedCount = batch.texts.length;
      if (batch.texts.length === 0) {
        apiZeroRetries += 1;
        const roundStopReason = "api_returned_zero";
        const stageLog = createSourceStageLog({
          outcome: batch,
          fallbackQuery: activeQuery,
          stageNo: round,
          action,
          query: executedQuery,
          fetchedCount: 0,
          accumulatedCount: accumulatedTexts.length,
          diagnosis: latestDiagnosis,
          beforeQuery,
          afterQuery: executedQuery,
          targetCount,
          remainingCount: Math.max(0, targetCount - accumulatedTexts.length),
          nextFetchCount: calculateNextAddFetchCount(accumulatedTexts.length, targetCount),
          requestedFetchCount,
          apiReturnedCount: 0,
          rawFetchedCount: 0,
          newUniqueCount: 0,
          duplicateSkippedCount: 0,
          noiseRemovedCount: 0,
          addedToCurrentDataCount: 0,
          stopReason: roundStopReason,
          queryKind: queryKindLabel(activeHashtags.length, executedQuery),
          usedHashtags: activeHashtags,
          usedExcludeTerms: activeExcludeTerms,
        });
        stageLogs = [...stageLogs, stageLog];
        setStagedFetchState((previous) => ({
          ...previous,
          stageLogs,
          currentStage: round,
          currentBatchCount: 0,
          fetchedCount: 0,
          totalApiFetchedCount: previous.totalApiFetchedCount || 0,
          remainingCount: Math.max(0, targetCount - accumulatedTexts.length),
          stopReason: roundStopReason,
          message: stopReasonLabel(roundStopReason),
        }));

        if (apiZeroRetries <= MAX_API_ZERO_RETRIES && round < autoFetchSafetyRoundLimit) {
          beforeQuery = beforeQuery || executedQuery;
          activeHashtags = [];
          activeExcludeTerms = activeExcludeTerms.slice(0, 4);
          activeQuery = sourceOutcomeRetryQuery(batch, theme, userOpinion, executedQuery);
          afterQuery = activeQuery;
          continue;
        }

        stopReason = apiZeroRetries > MAX_API_ZERO_RETRIES ? "api_returned_zero" : roundStopReason;
        break;
      }

      const fetchMeta = {
        stageNo: round,
        fetchType: action,
        sourceQuery: executedQuery,
        fetchedAt: new Date().toISOString(),
        batchIndex: round,
      };
      const nextPosts = attachFetchMetaToPosts(batch.posts, fetchMeta);
      const mergedPosts = mergePostsByText(accumulatedPosts, nextPosts, targetCount);
      const mergedTexts = textsFromPosts(mergedPosts);
      const addedCount = Math.max(0, mergedTexts.length - accumulatedTexts.length);
      const duplicateSkippedCount = Math.max(0, apiReturnedCount - addedCount);

      latestDiagnosis = diagnoseQueryQuality(
        mergedPosts,
        executedQuery,
        themeCategory,
        axisConfig,
        noiseFilteringEnabled,
        theme,
        userOpinion,
        NOISE_RELEVANCE_THRESHOLD
      );
      const batchDiagnosis = diagnoseQueryQuality(
        nextPosts,
        executedQuery,
        themeCategory,
        axisConfig,
        noiseFilteringEnabled,
        theme,
        userOpinion,
        NOISE_RELEVANCE_THRESHOLD
      );
      latestAdvice = await requestQueryDiagnosisAdvice(executedQuery, latestDiagnosis);
      latestImprovedCandidates = latestAdvice.improvedQueryCandidates?.length
        ? latestAdvice.improvedQueryCandidates
        : buildImprovedQueryCandidates(theme, userOpinion, activeQuery, latestDiagnosis, axisConfig);
      latestRecommendedQuery = latestAdvice.recommendedQuery || latestImprovedCandidates[0]?.query || "";
      latestComparison = previousDiagnosis ? buildImprovementComparison(previousDiagnosis, latestDiagnosis) : null;

      accumulatedPosts = mergedPosts;
      accumulatedTexts = mergedTexts;
      previousDiagnosis = latestDiagnosis;

      if (addedCount <= 1 && round > 1) {
        noImprovementRounds += 1;
      } else {
        noImprovementRounds = 0;
      }
      if (addedCount === 0) {
        noNewUniqueRetries += 1;
      } else {
        noNewUniqueRetries = 0;
      }

      if (action === "improved_add") {
        improvedAddFetchCount += 1;
      } else if (action === "continue_add") {
        continueRemainingCount += 1;
      }

      const nextRemainingCount = Math.max(0, targetCount - accumulatedTexts.length);
      const nextFetchCount = calculateNextAddFetchCount(accumulatedTexts.length, targetCount);
      const roundStopReason =
        apiReturnedCount > 0 && addedCount === 0
          ? "api_returned_but_all_duplicate"
          : batchDiagnosis.analysisCandidateCount === 0
            ? "api_returned_but_all_noise"
            : "";
      const stageLog = createSourceStageLog({
        outcome: batch,
        fallbackQuery: activeQuery,
        stageNo: round,
        action,
        query: executedQuery,
        fetchedCount: addedCount,
        accumulatedCount: accumulatedTexts.length,
        diagnosis: latestDiagnosis,
        beforeQuery,
        afterQuery: executedQuery,
        targetCount,
        remainingCount: nextRemainingCount,
        nextFetchCount,
        requestedFetchCount,
        apiReturnedCount,
        rawFetchedCount: apiReturnedCount,
        newUniqueCount: addedCount,
        duplicateSkippedCount,
        noiseRemovedCount: Math.max(0, apiReturnedCount - batchDiagnosis.analysisCandidateCount),
        addedToCurrentDataCount: addedCount,
        stopReason: roundStopReason,
        queryKind: queryKindLabel(activeHashtags.length, executedQuery),
        usedHashtags: activeHashtags,
        usedExcludeTerms: activeExcludeTerms,
      });
      stageLogs = [...stageLogs, stageLog];

      applyFetchedPosts(accumulatedPosts, accumulatedTexts, {
        sourceMode: "user",
        requested: targetCount,
        apiReturnedCount,
        generatedQuery: initialQuery,
        finalQuery: executedQuery,
        diagnosis: latestDiagnosis,
        stopReason: roundStopReason,
      });
      setStagedFetchState((previous) => ({
        ...previous,
        currentStage: round,
        fetchedCount: addedCount,
        currentBatchCount: addedCount,
        totalFetchedCount: accumulatedTexts.length,
        accumulatedCount: accumulatedTexts.length,
        currentDataCount: accumulatedTexts.length,
        totalApiFetchedCount: (previous.totalApiFetchedCount || 0) + batch.texts.length,
        remainingCount: nextRemainingCount,
        nextFetchCount,
        initialFetchCount: 1,
        diagnosisStatus: latestDiagnosis.status,
        shouldPause: false,
        diagnosis: latestDiagnosis,
        noiseBreakdown: latestDiagnosis.noiseBreakdown || [],
        queryTermDiagnosis: latestDiagnosis.queryTermDiagnosis || [],
        aiQueryAdvice: latestAdvice,
        improvementComparison: latestComparison,
        improvedQueryCandidates: latestImprovedCandidates,
        selectedImprovedQueryIndexes: [0],
        recommendedQuery: latestRecommendedQuery,
        diagnosisDecision: "auto_user",
        lastAction: action,
        beforeQuery,
        afterQuery: executedQuery,
        improvedAddFetchCount,
        improvedRefetchCount: improvedAddFetchCount,
        continueRemainingCount,
        stageLogs,
        stopReason: roundStopReason,
        message:
          roundStopReason
            ? `${stopReasonLabel(roundStopReason)} 検索条件を自動調整します。`
            : nextRemainingCount <= 0
              ? `取得完了：${accumulatedTexts.length}/${targetCount}件。クラスタリングに進めます。`
              : latestDiagnosis.status === "good"
                ? `取得品質は良好です。${accumulatedTexts.length}/${targetCount}件まで取得しました。`
                : `検索条件を自動調整中です。${accumulatedTexts.length}/${targetCount}件まで取得しました。`,
      }));

      if (roundStopReason === "api_returned_but_all_duplicate" && noNewUniqueRetries <= MAX_NO_NEW_UNIQUE_RETRIES && round < autoFetchSafetyRoundLimit) {
        beforeQuery = beforeQuery || executedQuery;
        activeHashtags = activeHashtags.slice(0, 1);
        activeExcludeTerms = activeExcludeTerms.slice(0, 4);
        activeQuery = sourceOutcomeRetryQuery(batch, theme, userOpinion, latestRecommendedQuery || executedQuery);
        afterQuery = activeQuery;
        continue;
      }

      if (roundStopReason === "api_returned_but_all_noise" && noNewUniqueRetries <= MAX_NO_NEW_UNIQUE_RETRIES && round < autoFetchSafetyRoundLimit) {
        beforeQuery = beforeQuery || executedQuery;
        activeHashtags = [];
        activeExcludeTerms = uniqueByValue([...activeExcludeTerms, "PR", "無料", "キャンペーン"]).slice(0, 5);
        activeQuery = sourceOutcomeRetryQuery(batch, theme, userOpinion, latestRecommendedQuery || executedQuery);
        afterQuery = activeQuery;
        continue;
      }

      if (roundStopReason) {
        stopReason =
          roundStopReason === "api_returned_but_all_duplicate"
            ? "too_many_duplicates"
            : roundStopReason === "api_returned_but_all_noise"
              ? "too_many_noise_posts"
              : roundStopReason;
        break;
      }

      if (nextRemainingCount <= 0) {
        stopReason = "target_reached";
        break;
      }

      if (round >= autoFetchSafetyRoundLimit) {
        stopReason = accumulatedTexts.length >= targetCount ? "target_reached" : "safety_round_limit_reached";
        break;
      }

      if (noImprovementRounds >= 3) {
        stopReason = "no_improvement_after_retries";
        break;
      }

      const shouldTuneQuery =
        latestDiagnosis.status !== "good" ||
        latestDiagnosis.analysisCandidateCount < 10 ||
        latestDiagnosis.noiseRate > 0.45 ||
        noImprovementRounds > 0;

      if (shouldTuneQuery && latestRecommendedQuery) {
        const adviceHashtags = (latestAdvice?.improvedHashtagCandidates || [])
          .filter((candidate) => candidate.selectionType !== "disabled")
          .map((candidate) => normalizeHashtag(candidate.hashtag || candidate.label))
          .filter(Boolean)
          .slice(0, 3);
        const autoExcludeTerms = buildExcludeTermCandidates(
          sampleKey,
          theme,
          userOpinion,
          latestDiagnosis.noiseBreakdown || [],
          personaMode,
          analysisPurposeMode
        )
          .map((candidate) => candidate.term)
          .filter(Boolean)
          .slice(0, 5);
        activeHashtags = uniqueByValue([...(adviceHashtags.length ? adviceHashtags : activeHashtags)]);
        activeExcludeTerms = uniqueByValue([...activeExcludeTerms, ...autoExcludeTerms]).slice(0, 8);
        const nextQuery = buildXQueryWithHashtags(
          latestRecommendedQuery,
          xQueryFilters,
          activeHashtags,
          activeExcludeTerms
        );
        if (!queriesAreEquivalent(activeQuery, nextQuery)) {
          beforeQuery = beforeQuery || executedQuery;
          activeQuery = nextQuery;
          afterQuery = nextQuery;
        } else {
          activeQuery = executedQuery;
          afterQuery = executedQuery;
        }
      } else {
        activeQuery = executedQuery;
        afterQuery = executedQuery;
      }
    }

    if (accumulatedTexts.length === 0) {
      throw new Error(stopReason || "外部意見を取得できませんでした。");
    }

    setSelectedHashtagCandidates(activeHashtags);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates(activeExcludeTerms);
    if (!queriesAreEquivalent(initialQuery, afterQuery)) {
      setSelectedXQueryCandidateIds([]);
      setIsManualXQuery(false);
      setXQueryBase(stripXCommonFilters(afterQuery));
      setXQuery(afterQuery);
      setQueryDirty(false);
    }

    const finalStatus =
      accumulatedTexts.length >= targetCount
        ? `取得完了：${accumulatedTexts.length}件取得しました。`
        : `取得完了：${accumulatedTexts.length}/${targetCount}件取得しました。${stopReasonLabel(stopReason)}`;
    setXStatus(
      `${finalStatus} ${
        latestDiagnosis
          ? `分析対象は${latestDiagnosis.analysisCandidateCount}件、品質は${qualityLabel(latestDiagnosis.status)}です。`
          : ""
      }`
    );
    setUserResultSlot(
      createAutoUserFetchResultSnapshot({
        inputKey: currentModeInputKey,
        theme,
        userOpinion,
        posts: accumulatedPosts,
        texts: accumulatedTexts,
        targetCount,
        stageLogs,
        stopReason,
        latestDiagnosis,
        analysisResult: result,
        axisConfig,
        initialQuery,
        finalQuery: afterQuery || initialQuery,
      })
    );
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisStatus: latestDiagnosis?.status || previous.diagnosisStatus,
      shouldPause: false,
      message:
        accumulatedTexts.length >= targetCount
          ? `取得完了：${accumulatedTexts.length}/${targetCount}件。クラスタリングに進めます。`
          : `取得完了：${accumulatedTexts.length}/${targetCount}件。${stopReasonLabel(stopReason) || "取得可能な範囲まで集めました。"}`,
      lastAction: "auto_user_complete",
      afterQuery,
      stopReason,
    }));
    setOperationSuccess(
      "fetchX",
      `${accumulatedTexts.length}件取得しました。自動調整${improvedAddFetchCount}回。`,
      truncateText(afterQuery || initialQuery, 120)
    );

    return {
      posts: accumulatedPosts,
      texts: accumulatedTexts,
      stageLogs,
      stopReason,
      latestDiagnosis,
      afterQuery,
      improvedAddFetchCount,
    };
  } catch (error) {
    setXDataStatus(activeDatasetId ? "cached" : "sample");
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisStatus: "bad",
      shouldPause: true,
      lastAction: "auto_user_error",
      stageLogs: [
        ...(previous.stageLogs || []),
        createSourceErrorStageLog({
          error,
          fallbackQuery: afterQuery || initialQuery,
          stageNo: (previous.stageLogs || []).length + 1,
          action: "auto_user_error",
          query: error.safeQuery || error.rawQuery || afterQuery || initialQuery,
          fetchedCount: 0,
          accumulatedCount: accumulatedTexts.length,
          diagnosis: latestDiagnosis,
          stopReason:
            error.errorType === "api_credit_exhausted"
              ? "api_credit_exhausted"
              :
            error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
              ? "invalid_query"
              : "api_error",
        }),
      ],
      stopReason:
        error.errorType === "api_credit_exhausted"
          ? "api_credit_exhausted"
          :
        error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
          ? "invalid_query"
          : "api_error",
      message:
        error.errorType === "api_credit_exhausted"
          ? JP_UI_LABELS.apiCreditExhaustedMessage
          :
        error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
          ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
          : error.message || "自動取得に失敗しました。",
    }));
    const userMessage =
      error.errorType === "api_credit_exhausted"
        ? JP_UI_LABELS.apiCreditExhaustedMessage
        :
      error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
        ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
        : PUBLIC_PREVIEW_MODE
          ? "外部意見の取得に失敗しました。時間をおいて再度お試しください。"
          : `取得失敗：${error.message} 詳細を確認するには開発者modeに切り替えてください。`;
    setXStatus(userMessage);
    setOperationError("fetchX", `自動取得に失敗しました。理由：${userMessage}`, truncateText(error.safeQuery || afterQuery || initialQuery, 120));
    return { error };
  }
}
