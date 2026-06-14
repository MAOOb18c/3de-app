import { createDashboardCountBreakdownIndicators } from "./diagnosticsModel.js";

function compactStatusTone(status) {
  if (status === "running") return "running";
  if (status === "success") return "success";
  if (status === "error") return "error";
  return "idle";
}

export function createDiagnosticsViewModel({
  actionButtonStatus,
  activeBeginnerResultSlot,
  activeClusterRunId,
  activeUserResultSlot,
  autoSummaryProgress,
  autoSummaryStatus,
  axisConfig,
  axisDirty,
  axisPresetLabel,
  currentOpinionCount,
  currentPersonaConfig,
  currentXDataStateLabel,
  hasFetchedExternalData,
  isAutoSummarizing,
  operationStatus,
  personaMode,
  publishStatus,
  qualityLabel,
  queryDiagnosisLabel,
  queryDirty,
  result,
  stagedCurrentDataCount,
  stagedFetchState,
  stagedNextFetchCount,
  stagedRemainingCount,
  stopReasonLabel,
  summarizedClusterCount,
  xDataStatus,
  xMaxResults,
  beginnerFixedXCount,
}) {
  function dashboardStatusItems() {
    const saveDatasetStatus = actionButtonStatus("saveDataset");
    const saveClusterStatus = actionButtonStatus("saveCluster");
    const copyStatusValue = actionButtonStatus("copyAnalysis");
    const xDataValue =
      saveDatasetStatus === "running"
        ? "保存中..."
        : saveDatasetStatus === "success"
          ? "保存済み"
          : saveDatasetStatus === "error"
            ? "保存失敗"
            : xDataStatus === "fetching"
              ? "取得中"
              : operationStatus.fetchX.status === "error"
                ? "取得失敗"
                : currentXDataStateLabel();
    const scoringLabel = operationStatus.rescore.status === "running"
      ? "実行中"
      : axisDirty
        ? "要再実行"
        : hasFetchedExternalData
          ? "実行済み"
          : "未実行";
    const clusterSaved = Boolean(activeClusterRunId);
    const clusterLabel =
      saveClusterStatus === "running"
        ? "保存中..."
        : saveClusterStatus === "success"
          ? "保存済み"
          : saveClusterStatus === "error"
            ? "保存失敗"
            : operationStatus.semanticCluster.status === "running"
              ? "実行中"
              : operationStatus.semanticCluster.status === "error"
                ? "実行失敗"
                : result.clusterTableRows.length > 0
                  ? clusterSaved
                    ? "保存済み"
                    : "実行済み・未保存"
                  : "未実行";
    const summaryLabel = isAutoSummarizing
      ? `実行中 ${autoSummaryProgress.completed} / ${autoSummaryProgress.total}`
      : operationStatus.autoSummary.status === "error"
        ? "実行失敗"
        : autoSummaryProgress.failed > 0
          ? "一部完了"
          : summarizedClusterCount() > 0
            ? "完了"
            : "未実行";

    return [
      {
        label: "利用目的（Zone P）",
        value: currentPersonaConfig.dashboardLabel,
        detail: currentPersonaConfig.description,
        operation: { status: personaMode === "dev" ? "idle" : "success" },
      },
      {
        label: "Xデータ（Zone③）",
        value: xDataValue,
        detail: saveDatasetStatus === "running" || saveDatasetStatus === "success" || saveDatasetStatus === "error"
          ? operationStatus.saveDataset.message
          : operationStatus.fetchX.message || `取得診断 ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / ${currentOpinionCount}件`,
        operation: saveDatasetStatus === "idle" ? operationStatus.fetchX : operationStatus.saveDataset,
      },
      {
        label: "取得診断（Zone③）",
        value: queryDiagnosisLabel(stagedFetchState.diagnosisStatus),
        detail: `品質 ${qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)} / 現在 ${stagedCurrentDataCount} / ${Number(xMaxResults) || 0}件 / 残り ${stagedRemainingCount}件 / 次回 ${stagedNextFetchCount}件 / 分析対象 ${stagedFetchState.diagnosis?.analysisCandidateCount ?? result.noiseProcessingResult.candidateCount}件 / 主因 ${
          stagedFetchState.noiseBreakdown?.[0]?.label || "未分類"
        } / 改善追加 ${stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}回 / このまま追加 ${stagedFetchState.continueRemainingCount || 0}回`,
        operation: operationStatus.fetchX,
      },
      {
        label: "評価軸（Zone②）",
        value: axisDirty ? "変更あり・再スコアリング未実行" : axisConfig?.x?.label ? "現在のスコアに反映済み" : "未設定",
        detail: axisPresetLabel(axisConfig),
        operation: operationStatus.applyAxis,
      },
      {
        label: "スコアリング（Zone②）",
        value: scoringLabel,
        detail: operationStatus.rescore.message || (axisDirty ? "現在の評価軸で再スコアリングしてください。" : "最新です。"),
        operation: operationStatus.rescore,
      },
      {
        label: "クラスタ（Zone④）",
        value: clusterLabel,
        detail: saveClusterStatus === "running" || saveClusterStatus === "success" || saveClusterStatus === "error"
          ? operationStatus.saveCluster.message
          : queryDirty || axisDirty ? "古い可能性あり" : `${result.clusterTableRows.length}クラスタ`,
        operation: saveClusterStatus === "idle" ? operationStatus.semanticCluster : operationStatus.saveCluster,
      },
      {
        label: "AI要約（Zone⑤）",
        value: summaryLabel,
        detail: queryDirty || axisDirty ? "古い可能性あり" : autoSummaryStatus,
        operation: operationStatus.autoSummary,
      },
      {
        label: "フィードバック（Zone⑪）",
        value: axisDirty ? "古い可能性あり" : "ルールベース表示中",
        detail: operationStatus.feedback.message || "Zone⑪に表示中",
        operation: operationStatus.feedback,
      },
      {
        label: "コピー（結果）",
        value: copyStatusValue === "running" ? "コピー中..." : copyStatusValue === "success" ? "コピー済み" : copyStatusValue === "error" ? "コピー失敗" : "未コピー",
        detail: operationStatus.copyAnalysis.message || "未コピー",
        operation: operationStatus.copyAnalysis,
      },
    ];
  }

  function dashboardCompactIndicators() {
    const saveDatasetStatus = actionButtonStatus("saveDataset");
    const saveClusterStatus = actionButtonStatus("saveCluster");
    const fetchTone = compactStatusTone(operationStatus.fetchX.status);
    const hasRealXData = xDataStatus === "unsaved" || xDataStatus === "cached";
    const activeDisplaySlot = activeUserResultSlot || activeBeginnerResultSlot;
    const fetchLabel =
      operationStatus.fetchX.status === "running"
        ? "取得中"
        : operationStatus.fetchX.status === "error"
          ? "失敗"
          : hasRealXData
            ? "成功"
            : "未取得";
    const sourceLabel = hasRealXData ? "実データ" : "サンプル";

    return [
      { label: "X取得", value: fetchLabel, tone: fetchTone },
      { label: "表示", value: sourceLabel, tone: hasRealXData ? "success" : "idle" },
      { label: "分析", value: `${result.noiseProcessingResult.analysisTargetCount || 0}件`, tone: result.noiseProcessingResult.analysisTargetCount > 0 ? "success" : "warning" },
      { label: "X保存", value: saveDatasetStatus === "success" ? "済" : saveDatasetStatus === "running" ? "保存中" : saveDatasetStatus === "error" ? "失敗" : "未実行", tone: compactStatusTone(saveDatasetStatus) },
      { label: "クラスタ", value: saveClusterStatus === "success" ? "済" : saveClusterStatus === "running" ? "保存中" : saveClusterStatus === "error" ? "失敗" : "未実行", tone: compactStatusTone(saveClusterStatus) },
      { label: "fallback", value: activeDisplaySlot?.fallbackUsed ? "あり" : "なし", tone: activeDisplaySlot?.fallbackUsed ? "warning" : "idle" },
    ];
  }

  function dashboardCountBreakdownIndicators() {
    const hasRealXData = xDataStatus === "unsaved" || xDataStatus === "cached";
    const activeDisplaySlot = activeUserResultSlot || activeBeginnerResultSlot;

    return createDashboardCountBreakdownIndicators({
      activeDisplaySlot,
      currentOpinionCount,
      defaultTargetCount: activeDisplaySlot ? beginnerFixedXCount : Number(xMaxResults) || 0,
      hasRealSourceData: hasRealXData,
      noiseProcessingResult: result.noiseProcessingResult,
      stagedCurrentDataCount,
      stagedFetchState,
      clusterCount: result.clusterTableRows.length,
      stopReasonLabel,
    });
  }

  function dashboardPublishIndicators() {
    const publishLabel =
      publishStatus.status === "success"
        ? "済"
        : publishStatus.status === "running"
          ? "実行中"
          : publishStatus.status === "error"
            ? "失敗"
            : "未実行";

    return [
      { label: "公開", value: publishLabel, tone: compactStatusTone(publishStatus.status) },
      { label: "公開テスト", value: publishStatus.mode === "dry-run" ? publishLabel : "左で実行", tone: publishStatus.mode === "dry-run" ? compactStatusTone(publishStatus.status) : "idle" },
      { label: "公開反映", value: publishStatus.mode === "publish" ? publishLabel : "左で実行", tone: publishStatus.mode === "publish" ? compactStatusTone(publishStatus.status) : "idle" },
    ];
  }

  return {
    dashboardStatusItems,
    dashboardCompactIndicators,
    dashboardCountBreakdownIndicators,
    dashboardPublishIndicators,
  };
}
