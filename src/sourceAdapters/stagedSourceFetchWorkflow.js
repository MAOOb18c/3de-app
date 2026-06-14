import {
  attachFetchMetaToPosts,
  buildExcludeTermCandidates,
  buildImprovedQueryCandidates,
  buildImprovementComparison,
  buildXQueryWithHashtags,
  calculateNextAddFetchCount,
  DEFAULT_ADD_FETCH_COUNT,
  formatPercent,
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
  sourceOutcomeApiReturnedCount,
  sourceOutcomeQuery,
  sourceOutcomeRetryQuery,
} from "./sourceFetchWorkflow.js";
import { requestSourceOpinionsForWorkflow } from "./sourceFetchRequestModel.js";

export async function runDiagnosticStagedSourceFetchWorkflow({
  sourceType,
  input,
  context,
  dependencies = {},
  services,
  callbacks,
}) {
  const { query, limit, decision = "" } = input;
  const {
    activeDatasetId,
    activeNoiseRelevanceThreshold,
    appMode,
    axisConfig,
    effectiveQuery,
    noiseFilteringEnabled,
    previousDiagnosisForComparison,
    selectedExcludeTermValues,
    selectedHashtagValues,
    stagedFetchState,
    theme,
    themeCategory,
    userOpinion,
  } = context;
  const {
    applyFetchedPosts,
    diagnoseQueryQuality,
    requestQueryDiagnosisAdvice,
  } = services;
  const {
    prepareXFetch,
    setNoiseRelevanceThreshold,
    setOperationError,
    setOperationRunning,
    setOperationSuccess,
    setStagedFetchState,
    setXDataStatus,
    setXStatus,
  } = callbacks;

  try {
    if (decision !== "weak_noise_retry") {
      setNoiseRelevanceThreshold(NOISE_RELEVANCE_THRESHOLD);
    }

    setOperationRunning("fetchX", `まず${STAGED_FETCH_INITIAL_COUNT}件で取得診断中...`, truncateText(query, 120));
    prepareXFetch();
    setStagedFetchState((previous) => ({
      ...previous,
      enabled: true,
      targetCount: limit,
      currentStage: STAGED_FETCH_INITIAL_COUNT,
      stageLogs: decision === "improved" || decision === "manual" ? previous.stageLogs || [] : [],
      fetchedCount: 0,
      totalFetchedCount: 0,
      currentBatchCount: 0,
      accumulatedCount: 0,
      currentDataCount: 0,
      totalApiFetchedCount: 0,
      remainingCount: limit,
      nextFetchCount: calculateNextAddFetchCount(0, limit),
      initialFetchCount: decision === "improved" ? previous.initialFetchCount || 0 : 0,
      diagnosisStatus: "checking",
      shouldPause: false,
      diagnosis: null,
      noiseBreakdown: [],
      queryTermDiagnosis: [],
      aiQueryAdvice: null,
      improvementComparison: decision === "improved" ? previous.improvementComparison : null,
      improvedQueryCandidates: [],
      selectedImprovedQueryIndexes: [0],
      recommendedQuery: "",
      diagnosisDecision: decision,
      lastAction: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
      beforeQuery: decision === "improved" ? previous.beforeQuery || effectiveQuery : previous.beforeQuery || "",
      afterQuery: query,
      weakNoiseRetryAvailable: false,
      message: `${STAGED_FETCH_INITIAL_COUNT}件でクエリ品質を診断中...`,
    }));
    setXStatus(`${STAGED_FETCH_INITIAL_COUNT}件で取得診断中...`);

    const firstBatch = await requestSourceOpinionsForWorkflow({
      sourceType,
      query,
      limit: STAGED_FETCH_INITIAL_COUNT,
      dependencies,
    });
    const firstExecutedQuery = sourceOutcomeQuery(firstBatch, query);
    if (firstBatch.texts.length === 0) {
      throw new Error("30件診断の取得結果が0件でした。検索語を変えてください。");
    }

    const initialFetchMeta = {
      stageNo:
        decision === "improved" || decision === "manual"
          ? (stagedFetchState.stageLogs || []).length + 1
          : 1,
      fetchType: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
      sourceQuery: firstExecutedQuery,
      fetchedAt: new Date().toISOString(),
      batchIndex:
        decision === "improved"
          ? (stagedFetchState.improvedAddFetchCount || stagedFetchState.improvedRefetchCount || 0) + 1
          : 1,
    };
    applyFetchedPosts(attachFetchMetaToPosts(firstBatch.posts, initialFetchMeta), firstBatch.texts, {
      sourceMode: appMode === "beginner" ? "beginner" : "user",
      requested: limit,
      apiReturnedCount: sourceOutcomeApiReturnedCount(firstBatch),
      generatedQuery: query,
      finalQuery: firstExecutedQuery,
    });
    const diagnosis = diagnoseQueryQuality(
      firstBatch.posts,
      firstExecutedQuery,
      themeCategory,
      axisConfig,
      noiseFilteringEnabled,
      theme,
      userOpinion,
      activeNoiseRelevanceThreshold
    );
    const queryAdvice = await requestQueryDiagnosisAdvice(firstExecutedQuery, diagnosis);
    const improvedQueryCandidates = queryAdvice.improvedQueryCandidates?.length
      ? queryAdvice.improvedQueryCandidates
      : buildImprovedQueryCandidates(theme, userOpinion, firstExecutedQuery, diagnosis, axisConfig);
    const recommendedQuery = queryAdvice.recommendedQuery || improvedQueryCandidates[0]?.query || "";
    const improvementComparison =
      decision === "improved" ? buildImprovementComparison(previousDiagnosisForComparison, diagnosis) : null;
    const initialStageLog = createSourceStageLog({
      outcome: firstBatch,
      fallbackQuery: query,
      stageNo:
        decision === "improved" || decision === "manual"
          ? (stagedFetchState.stageLogs || []).length + 1
          : 1,
      action: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
      query: firstExecutedQuery,
      fetchedCount: firstBatch.texts.length,
      accumulatedCount: firstBatch.texts.length,
      diagnosis,
      beforeQuery: decision === "improved" ? stagedFetchState.beforeQuery || effectiveQuery : "",
      afterQuery: firstExecutedQuery,
      targetCount: limit,
      remainingCount: Math.max(0, limit - firstBatch.texts.length),
      nextFetchCount: calculateNextAddFetchCount(firstBatch.texts.length, limit),
      requestedFetchCount: STAGED_FETCH_INITIAL_COUNT,
      apiReturnedCount: firstBatch.texts.length,
      newUniqueCount: firstBatch.texts.length,
      duplicateSkippedCount: 0,
      queryKind: queryKindLabel(selectedHashtagValues.length, firstExecutedQuery),
      usedHashtags: selectedHashtagValues,
      usedExcludeTerms: selectedExcludeTermValues,
    });

    setStagedFetchState((previous) => ({
      ...previous,
      currentStage: STAGED_FETCH_INITIAL_COUNT,
      fetchedCount: firstBatch.texts.length,
      currentBatchCount: firstBatch.texts.length,
      totalFetchedCount: firstBatch.texts.length,
      accumulatedCount: firstBatch.texts.length,
      currentDataCount: firstBatch.texts.length,
      totalApiFetchedCount:
        decision === "improved"
          ? (previous.totalApiFetchedCount || 0) + firstBatch.texts.length
          : firstBatch.texts.length,
      remainingCount: Math.max(0, limit - firstBatch.texts.length),
      nextFetchCount: calculateNextAddFetchCount(firstBatch.texts.length, limit),
      stageLogs:
        decision === "improved" || decision === "manual"
          ? [...(previous.stageLogs || []), initialStageLog]
          : [initialStageLog],
      diagnosisStatus: diagnosis.status,
      shouldPause: diagnosis.status !== "good",
      diagnosis,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
      aiQueryAdvice: queryAdvice,
      improvementComparison,
      improvedQueryCandidates,
      selectedImprovedQueryIndexes: [0],
      recommendedQuery,
      weakNoiseRetryAvailable: diagnosis.analysisCandidateCount === 0 && noiseFilteringEnabled,
      improvedRefetchCount:
        decision === "improved" ? (previous.improvedRefetchCount || 0) + 1 : previous.improvedRefetchCount || 0,
      improvedAddFetchCount:
        decision === "improved"
          ? (previous.improvedAddFetchCount || previous.improvedRefetchCount || 0) + 1
          : previous.improvedAddFetchCount || 0,
      initialFetchCount: decision === "improved" ? previous.initialFetchCount || 1 : (previous.initialFetchCount || 0) + 1,
      message:
        diagnosis.status === "good"
          ? "取得診断は良好です。本取得へ進みます。"
          : decision === "improved" && diagnosis.status === "bad"
            ? "改善クエリでも取得が不調です。検索語がまだ狭すぎる、該当投稿が少ない、またはノイズ除去が強すぎる可能性があります。"
            : diagnosis.status === "warning"
              ? "取得は可能ですが、ノイズがやや多いです。改善クエリを検討できます。"
              : "取得が不調です。現在のクエリでは分析対象が十分に集まっていません。",
    }));

    if (diagnosis.status !== "good") {
      setXStatus(
        `取得診断：${diagnosis.status === "warning" ? "注意" : "不調"}。${firstBatch.texts.length}件中、分析対象は${diagnosis.analysisCandidateCount}件です。`
      );
      setOperationError(
        "fetchX",
        `取得診断で停止中：分析対象${diagnosis.analysisCandidateCount}件 / ノイズ率${formatPercent(diagnosis.noiseRate)}`,
        truncateText(query, 120)
      );
      return { completed: false, diagnosis, firstBatch };
    }

    setXStatus(`取得診断は良好です。目標${limit}件まで本取得します...`);
    setOperationRunning("fetchX", `取得診断後、本取得中... 最大${limit}件`, truncateText(query, 120));
    const fullBatch = await requestSourceOpinionsForWorkflow({
      sourceType,
      query,
      limit,
      dependencies,
    });
    const fullExecutedQuery = sourceOutcomeQuery(fullBatch, query);
    if (fullBatch.texts.length === 0) {
      throw new Error("本取得の結果が0件でした。検索語を変えてください。");
    }

    applyFetchedPosts(fullBatch.posts, fullBatch.texts, {
      sourceMode: appMode === "beginner" ? "beginner" : "user",
      requested: limit,
      apiReturnedCount: sourceOutcomeApiReturnedCount(fullBatch),
      generatedQuery: query,
      finalQuery: fullExecutedQuery,
      diagnosis,
    });
    setStagedFetchState((previous) => ({
      ...previous,
      currentStage: limit,
      fetchedCount: fullBatch.texts.length,
      currentBatchCount: fullBatch.texts.length,
      totalFetchedCount: fullBatch.texts.length,
      accumulatedCount: fullBatch.texts.length,
      currentDataCount: fullBatch.texts.length,
      totalApiFetchedCount: (previous.totalApiFetchedCount || 0) + fullBatch.texts.length,
      remainingCount: Math.max(0, limit - fullBatch.texts.length),
      nextFetchCount: calculateNextAddFetchCount(fullBatch.texts.length, limit),
      stageLogs: [
        ...(previous.stageLogs || []),
        createSourceStageLog({
          outcome: fullBatch,
          fallbackQuery: query,
          stageNo: (previous.stageLogs || []).length + 1,
          action: "full_refetch",
          query: fullExecutedQuery,
          fetchedCount: fullBatch.texts.length,
          accumulatedCount: fullBatch.texts.length,
          diagnosis,
          targetCount: limit,
          remainingCount: Math.max(0, limit - fullBatch.texts.length),
          nextFetchCount: calculateNextAddFetchCount(fullBatch.texts.length, limit),
          requestedFetchCount: limit,
          apiReturnedCount: fullBatch.texts.length,
          newUniqueCount: fullBatch.texts.length,
          duplicateSkippedCount: 0,
          queryKind: queryKindLabel(selectedHashtagValues.length, fullExecutedQuery),
          usedHashtags: selectedHashtagValues,
          usedExcludeTerms: selectedExcludeTermValues,
        }),
      ],
      diagnosisStatus: "good",
      shouldPause: false,
      diagnosisDecision: decision || "continued",
      lastAction: "full_refetch",
      message: "診断後、本取得まで完了しました。",
    }));
    setXStatus(`取得完了：${fullBatch.texts.length}件。診断後、本取得のために再取得しました。`);
    setOperationSuccess("fetchX", `${fullBatch.texts.length}件取得しました。診断結果は良好です。`, truncateText(query, 120));
    return { completed: true, diagnosis, fullBatch };
  } catch (error) {
    if (error?.name === "AbortError") {
      setXDataStatus(activeDatasetId ? "cached" : "sample");
      setXStatus("外部意見取得を停止しました。");
      setOperationError("fetchX", "外部意見取得を停止しました。");
      setStagedFetchState((previous) => ({
        ...previous,
        diagnosisStatus: "bad",
        shouldPause: true,
        stopReason: "user_stopped",
        message: "ユーザー操作で外部意見取得を停止しました。",
      }));
      return { aborted: true };
    }

    setXDataStatus(activeDatasetId ? "cached" : "sample");
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisStatus: "bad",
      shouldPause: true,
      message: error.message || "取得診断またはX取得に失敗しました。",
    }));
    setXStatus(`取得失敗：${error.message}`);
    setOperationError("fetchX", `X取得に失敗しました。理由：${error.message}`, truncateText(query, 120));
    return { error };
  }
}

export { runAutoUserStagedSourceFetchWorkflow } from "./autoUserStagedSourceFetchWorkflow.js";
