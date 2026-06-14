import {
  attachFetchMetaToPosts,
  buildImprovementComparison,
  buildXQueryWithHashtags,
  calculateNextAddFetchCount,
  DEFAULT_ADD_FETCH_COUNT,
  mergePostsByText,
  postsFromExternalOpinions,
  queriesAreEquivalent,
  queryKindLabel,
  textsFromPosts,
  truncateText,
} from "../app/appSupport.jsx";
import { createSourceStageLog, sourceOutcomeQuery } from "./sourceFetchWorkflow.js";
import { requestSourceOpinionsForWorkflow } from "./sourceFetchRequestModel.js";

function selectedImprovedQueryBase(stagedFetchState, candidate = null) {
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

export async function runAdditionalSourceFetchWorkflow({
  sourceType,
  input,
  context,
  dependencies = {},
  services,
  callbacks,
}) {
  const { candidate = null } = input;
  const {
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
  } = context;
  const { applyFetchedPosts, diagnoseQueryQuality, requestQueryDiagnosisAdvice } = services;
  const {
    setIsManualSourceQuery,
    setOperationError,
    setOperationRunning,
    setOperationSuccess,
    setQueryDirty,
    setSelectedSourceQueryCandidateIds,
    setSourceQuery,
    setSourceQueryBase,
    setSourceStatus,
    setStagedFetchState,
  } = callbacks;
  const nextBaseQuery = selectedImprovedQueryBase(stagedFetchState, candidate);

  if (!nextBaseQuery) {
    setSourceStatus("適用できる改善クエリ候補がありません。");
    return { ok: false, reason: "missing_candidate" };
  }

  const nextQuery = buildXQueryWithHashtags(
    nextBaseQuery,
    xQueryFilters,
    selectedHashtagValues,
    selectedExcludeTermValues
  );
  const remainingCount = Math.max(0, targetCount - currentDataCount);

  if (remainingCount <= 0) {
    setStagedFetchState((previous) => ({
      ...previous,
      shouldPause: false,
      remainingCount: 0,
      nextFetchCount: 0,
      message: `目標${targetCount}件に到達しています。改善クエリで追加取得はできません。`,
    }));
    setSourceStatus(`目標${targetCount}件に到達しています。追加取得はできません。`);
    return { ok: false, reason: "target_reached" };
  }

  const nextFetchCount = calculateNextAddFetchCount(
    currentDataCount,
    targetCount,
    stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
  );
  const isSameQuery = queriesAreEquivalent(effectiveQuery, nextQuery);
  const beforeDiagnosis = stagedFetchState.diagnosis;

  setSelectedSourceQueryCandidateIds([]);
  setIsManualSourceQuery(false);
  setSourceQueryBase(nextBaseQuery);
  setSourceQuery(nextQuery);
  setQueryDirty(false);
  setStagedFetchState((previous) => ({
    ...previous,
    diagnosisDecision: "improved",
    lastAction: "improved_add",
    beforeQuery: effectiveQuery,
    afterQuery: nextQuery,
    currentBatchCount: 0,
    remainingCount,
    nextFetchCount,
    shouldPause: false,
    message: isSameQuery
      ? "改善クエリが現在のクエリと同じです。追加取得は可能ですが、同じ傾向の投稿が増える可能性があります。"
      : `既存の${currentDataCount}件を保持したまま、改善クエリで${nextFetchCount}件追加取得します。`,
  }));
  setOperationRunning("fetchX", `改善クエリで${nextFetchCount}件追加取得中...`, truncateText(nextQuery, 120));
  setSourceStatus(
    `現在の${currentDataCount}件を保持したまま、改善クエリで${nextFetchCount}件追加取得中...`
  );

  try {
    const stageNo = (stagedFetchState.stageLogs || []).length + 1;
    const fetchMeta = {
      stageNo,
      fetchType: "improved_add",
      sourceQuery: nextQuery,
      fetchedAt: new Date().toISOString(),
      batchIndex: (stagedFetchState.improvedAddFetchCount || stagedFetchState.improvedRefetchCount || 0) + 1,
    };
    const nextBatch = await requestSourceOpinionsForWorkflow({
      sourceType,
      query: nextQuery,
      limit: nextFetchCount,
      dependencies,
    });
    const nextExecutedQuery = sourceOutcomeQuery(nextBatch, nextQuery);
    fetchMeta.sourceQuery = nextExecutedQuery;
    if (nextBatch.texts.length === 0) {
      throw new Error("改善クエリの追加取得結果が0件でした。別の候補を選んでください。");
    }

    const existingPosts = xPosts.length
      ? xPosts
      : postsFromExternalOpinions(externalOpinions, {
          stageNo: 1,
          fetchType: "restored",
          sourceQuery: effectiveQuery,
          fetchedAt: "",
          batchIndex: 1,
        });
    const mergedPosts = mergePostsByText(
      existingPosts,
      attachFetchMetaToPosts(nextBatch.posts, fetchMeta),
      targetCount
    );
    const mergedTexts = textsFromPosts(mergedPosts);
    const addedCount = Math.max(0, mergedTexts.length - currentDataCount);
    const diagnosis = diagnoseQueryQuality(
      mergedPosts,
      nextExecutedQuery,
      sampleKey,
      axisConfig,
      noiseFilteringEnabled,
      theme,
      userOpinion,
      noiseRelevanceThreshold
    );
    const queryAdvice = await requestQueryDiagnosisAdvice(nextExecutedQuery, diagnosis);
    const improvementComparison = buildImprovementComparison(beforeDiagnosis, diagnosis);
    const nextRemainingCount = Math.max(0, targetCount - mergedTexts.length);
    const nextStageFetchCount = calculateNextAddFetchCount(
      mergedTexts.length,
      targetCount,
      stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
    );

    applyFetchedPosts(mergedPosts, mergedTexts);
    setStagedFetchState((previous) => ({
      ...previous,
      currentStage: (previous.stageLogs || []).length + 1,
      fetchedCount: addedCount,
      currentBatchCount: addedCount,
      totalFetchedCount: mergedTexts.length,
      accumulatedCount: mergedTexts.length,
      currentDataCount: mergedTexts.length,
      totalApiFetchedCount: (previous.totalApiFetchedCount || currentDataCount) + nextBatch.texts.length,
      remainingCount: nextRemainingCount,
      nextFetchCount: nextStageFetchCount,
      diagnosisStatus: diagnosis.status,
      shouldPause: diagnosis.status !== "good" && nextRemainingCount > 0,
      diagnosis,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
      aiQueryAdvice: queryAdvice,
      improvementComparison,
      improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
        ? queryAdvice.improvedQueryCandidates
        : previous.improvedQueryCandidates,
      selectedImprovedQueryIndexes: previous.selectedImprovedQueryIndexes || [0],
      recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
      stageLogs: [
        ...(previous.stageLogs || []),
        createSourceStageLog({
          outcome: nextBatch,
          fallbackQuery: nextQuery,
          stageNo: (previous.stageLogs || []).length + 1,
          action: "improved_add",
          query: nextExecutedQuery,
          fetchedCount: addedCount,
          accumulatedCount: mergedTexts.length,
          diagnosis,
          beforeQuery: effectiveQuery,
          afterQuery: nextExecutedQuery,
          targetCount,
          remainingCount: nextRemainingCount,
          nextFetchCount: nextStageFetchCount,
          requestedFetchCount: nextFetchCount,
          apiReturnedCount: nextBatch.texts.length,
          newUniqueCount: addedCount,
          duplicateSkippedCount: Math.max(0, nextBatch.texts.length - addedCount),
          queryKind: queryKindLabel(selectedHashtagValues.length, nextExecutedQuery),
          usedHashtags: selectedHashtagValues,
          usedExcludeTerms: selectedExcludeTermValues,
        }),
      ],
      improvedRefetchCount: (previous.improvedRefetchCount || 0) + 1,
      improvedAddFetchCount: (previous.improvedAddFetchCount || previous.improvedRefetchCount || 0) + 1,
      message:
        nextRemainingCount <= 0
          ? `目標${targetCount}件に到達しました。次はクラスタリングへ進めます。`
          : addedCount <= 1
            ? `${nextFetchCount}件を要求しましたが、新規追加は${addedCount}件でした。既存データとの重複、検索結果不足、またはnext_token不足の可能性があります。別の候補やハッシュタグ追加を試してください。`
            : `${addedCount}件を追加し、現在${mergedTexts.length}/${targetCount}件です。残り${nextRemainingCount}件を追加取得できます。`,
    }));
    setSourceStatus(
      `改善クエリで追加取得しました：今回追加${addedCount}件 / 現在${mergedTexts.length}/${targetCount}件。`
    );
    setOperationSuccess("fetchX", `改善クエリで${addedCount}件追加しました。`, truncateText(nextQuery, 120));
    return { ok: true, addedCount, mergedPosts, mergedTexts, batch: nextBatch };
  } catch (error) {
    setSourceStatus(`改善クエリの追加取得に失敗しました：${error.message}`);
    setOperationError("fetchX", `改善クエリの追加取得に失敗しました。理由：${error.message}`, truncateText(nextQuery, 120));
    setStagedFetchState((previous) => ({
      ...previous,
      shouldPause: true,
      message: error.message || "改善クエリの追加取得に失敗しました。",
    }));
    return { ok: false, reason: "error", error };
  }
}
