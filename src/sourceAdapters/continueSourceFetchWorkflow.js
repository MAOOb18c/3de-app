import {
  attachFetchMetaToPosts,
  calculateNextAddFetchCount,
  DEFAULT_ADD_FETCH_COUNT,
  mergePostsByText,
  postsFromExternalOpinions,
  queryKindLabel,
  textsFromPosts,
  truncateText,
} from "../app/appSupport.jsx";
import { createSourceStageLog, sourceOutcomeQuery } from "./sourceFetchWorkflow.js";
import { requestSourceOpinionsForWorkflow } from "./sourceFetchRequestModel.js";

export async function runContinueSourceFetchWorkflow({
  sourceType,
  input,
  context,
  dependencies = {},
  services,
  callbacks,
}) {
  const { query } = input;
  const {
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
  } = context;
  const { applyFetchedPosts, diagnoseQueryQuality, requestQueryDiagnosisAdvice } = services;
  const {
    setOperationError,
    setOperationRunning,
    setOperationSuccess,
    setStagedFetchState,
    setSourceStatus,
  } = callbacks;
  const remainingCount = Math.max(0, targetCount - accumulatedCount);

  if (remainingCount <= 0) {
    setStagedFetchState((previous) => ({
      ...previous,
      shouldPause: false,
      diagnosisDecision: "continued",
      message: `目標${targetCount}件に到達しています。追加取得はできません。`,
    }));
    setSourceStatus(`目標${targetCount}件に到達しています。追加取得はできません。`);
    return { ok: false, reason: "target_reached" };
  }

  const nextFetchCount = calculateNextAddFetchCount(
    accumulatedCount,
    targetCount,
    stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
  );
  const nextTargetCount = Math.min(targetCount, accumulatedCount + nextFetchCount);

  setOperationRunning("fetchX", `このまま追加取得中... 累計最大${nextTargetCount}件`, truncateText(query, 120));
  setSourceStatus(`現在の${accumulatedCount}件を維持して、累計最大${nextTargetCount}件まで追加取得中...`);
  setStagedFetchState((previous) => ({
    ...previous,
    shouldPause: false,
    diagnosisDecision: "continued",
    lastAction: "continue_remaining",
    remainingCount,
    nextFetchCount,
    message: "現在の診断データを維持して、このクエリのまま残りを追加取得します。",
  }));

  try {
    const stageNo = (stagedFetchState.stageLogs || []).length + 1;
    const fetchMeta = {
      stageNo,
      fetchType: "continue_add",
      sourceQuery: query,
      fetchedAt: new Date().toISOString(),
      batchIndex: (stagedFetchState.continueRemainingCount || 0) + 1,
    };
    const nextBatch = await requestSourceOpinionsForWorkflow({
      sourceType,
      query,
      limit: nextFetchCount,
      dependencies,
    });
    const nextExecutedQuery = sourceOutcomeQuery(nextBatch, query);
    fetchMeta.sourceQuery = nextExecutedQuery;
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
    const addedCount = Math.max(0, mergedTexts.length - accumulatedCount);
    const diagnosis = diagnoseQueryQuality(
      mergedPosts,
      nextExecutedQuery,
      themeCategory,
      axisConfig,
      noiseFilteringEnabled,
      theme,
      userOpinion,
      noiseRelevanceThreshold
    );
    const queryAdvice = await requestQueryDiagnosisAdvice(nextExecutedQuery, diagnosis);

    applyFetchedPosts(mergedPosts, mergedTexts);
    setStagedFetchState((previous) => ({
      ...previous,
      currentStage: (previous.stageLogs || []).length + 1,
      fetchedCount: addedCount,
      currentBatchCount: addedCount,
      totalFetchedCount: mergedTexts.length,
      accumulatedCount: mergedTexts.length,
      currentDataCount: mergedTexts.length,
      totalApiFetchedCount: (previous.totalApiFetchedCount || accumulatedCount) + nextBatch.texts.length,
      remainingCount: Math.max(0, targetCount - mergedTexts.length),
      nextFetchCount: Math.min(
        previous.stageSize || DEFAULT_ADD_FETCH_COUNT,
        calculateNextAddFetchCount(mergedTexts.length, targetCount, previous.stageSize || DEFAULT_ADD_FETCH_COUNT)
      ),
      diagnosisStatus: diagnosis.status,
      shouldPause: diagnosis.status !== "good",
      diagnosis,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
      aiQueryAdvice: queryAdvice,
      improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
        ? queryAdvice.improvedQueryCandidates
        : previous.improvedQueryCandidates,
      recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
      stageLogs: [
        ...(previous.stageLogs || []),
        createSourceStageLog({
          outcome: nextBatch,
          fallbackQuery: query,
          stageNo: (previous.stageLogs || []).length + 1,
          action: "continue_add",
          query: nextExecutedQuery,
          fetchedCount: addedCount,
          accumulatedCount: mergedTexts.length,
          diagnosis,
          targetCount,
          remainingCount: Math.max(0, targetCount - mergedTexts.length),
          nextFetchCount: calculateNextAddFetchCount(
            mergedTexts.length,
            targetCount,
            previous.stageSize || DEFAULT_ADD_FETCH_COUNT
          ),
          requestedFetchCount: nextFetchCount,
          apiReturnedCount: nextBatch.texts.length,
          newUniqueCount: addedCount,
          duplicateSkippedCount: Math.max(0, nextBatch.texts.length - addedCount),
          queryKind: queryKindLabel(selectedHashtagValues.length, nextExecutedQuery),
          usedHashtags: selectedHashtagValues,
          usedExcludeTerms: selectedExcludeTermValues,
        }),
      ],
      message:
        mergedTexts.length >= targetCount
          ? `累計${mergedTexts.length}/${targetCount}件に到達しました。`
          : `累計${mergedTexts.length}/${targetCount}件です。追加取得後も目標未満です。`,
      continueRemainingCount: (previous.continueRemainingCount || 0) + 1,
    }));
    setSourceStatus(`追加取得完了：今回追加${addedCount}件 / 累計${mergedTexts.length}/${targetCount}件。`);
    setOperationSuccess("fetchX", `累計${mergedTexts.length}件取得しました。`, truncateText(query, 120));
    return { ok: true, addedCount, mergedPosts, mergedTexts, batch: nextBatch };
  } catch (error) {
    setSourceStatus(`継続取得に失敗しました：${error.message}`);
    setOperationError("fetchX", `継続取得に失敗しました。理由：${error.message}`, truncateText(query, 120));
    return { ok: false, reason: "error", error };
  }
}
