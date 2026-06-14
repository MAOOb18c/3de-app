import {
  attachFetchMetaToPosts,
  PUBLIC_PREVIEW_MODE,
  truncateText,
} from "../app/appSupport.jsx";
import { createSourceStageLog, sourceOutcomeApiReturnedCount, sourceOutcomeQuery } from "./sourceFetchWorkflow.js";
import { requestSourceOpinionsForWorkflow } from "./sourceFetchRequestModel.js";

export async function runNormalSourceFetchWorkflow({
  sourceType,
  input,
  dependencies = {},
  callbacks,
}) {
  const { query, limit, successSuffix = "" } = input;
  const {
    applyFetchedPosts,
    prepareSourceFetch,
    setOperationError,
    setOperationRunning,
    setOperationSuccess,
    setSourcePosts,
    setSourceStatus,
    setStagedFetchState,
  } = callbacks;
  const fetchSourceLabel = PUBLIC_PREVIEW_MODE ? "外部データ" : "X API";

  setOperationRunning("fetchX", `${fetchSourceLabel}から最大${limit}件を取得中...`, truncateText(query, 120));
  prepareSourceFetch({ preserveBeginnerState: true });
  setSourceStatus(`${fetchSourceLabel}から最大${limit}件を取得中...`);

  const batch = await requestSourceOpinionsForWorkflow({
    sourceType,
    query,
    limit,
    dependencies,
  });
  const executedQuery = sourceOutcomeQuery(batch, query);
  const stageLog = createSourceStageLog({
    outcome: batch,
    fallbackQuery: query,
    stageNo: 1,
    action: "normal_fetch",
    query: executedQuery,
    requestedCount: limit,
    apiReturnedCount: sourceOutcomeApiReturnedCount(batch),
    resultCount: batch.texts.length,
  });

  if (batch.texts.length === 0) {
    setSourceStatus("取得結果が0件でした。検索語を変えてください。");
    setSourcePosts([]);
    setOperationError("fetchX", "取得結果が0件でした。検索語を変えてください。", truncateText(query, 120));
    return {
      ok: false,
      reason: "empty",
      batch,
      executedQuery,
    };
  }

  applyFetchedPosts(
    attachFetchMetaToPosts(batch.posts, {
      stageNo: 1,
      fetchType: "normal",
      sourceQuery: executedQuery,
      fetchedAt: new Date().toISOString(),
      batchIndex: 1,
    }),
    batch.texts,
    {
      sourceMode: input.sourceMode,
      requested: limit,
      apiReturnedCount: sourceOutcomeApiReturnedCount(batch),
      generatedQuery: query,
      finalQuery: executedQuery,
      queryInfo: batch.queryInfo || null,
    }
  );
  if (typeof setStagedFetchState === "function") {
    setStagedFetchState((previous) => ({
      ...previous,
      afterQuery: executedQuery,
      currentBatchCount: batch.texts.length,
      fetchedCount: batch.texts.length,
      totalApiFetchedCount: sourceOutcomeApiReturnedCount(batch),
      stageLogs: [...(previous.stageLogs || []), stageLog],
    }));
  }
  setSourceStatus(`取得完了：${batch.texts.length}件。前回分を消して、今回の取得結果だけに置き換えました。${successSuffix}`);
  setOperationSuccess("fetchX", `${batch.texts.length}件取得しました。`, truncateText(query, 120));

  return {
    ok: true,
    batch,
    executedQuery,
    texts: batch.texts,
    posts: batch.posts,
  };
}
