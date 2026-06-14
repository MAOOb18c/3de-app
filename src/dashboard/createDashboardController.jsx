import { createDiagnosticsViewModel } from "../diagnostics/createDiagnosticsViewModel.js";
import {
  APP_VERSION,
  axisExplanationItems,
  axisPresetLabel,
  BEGINNER_FIXED_X_COUNT,
  EMPTY_OPERATION_STATUS,
  formatHistoryDate,
  qualityLabel,
  queryDiagnosisLabel,
  stopReasonLabel,
} from "../app/appSupport.jsx";

export function createDashboardController({
  activeBeginnerResultSlot,
  activeClusterRunId,
  activeDatasetMatchesCurrent,
  activeUserResultSlot,
  autoSummaryProgress,
  autoSummaryStatus,
  axisConfig,
  axisDirty,
  currentAnalysisHash,
  currentClusterHash,
  currentDatasetHash,
  currentOpinionCount,
  currentPersonaConfig,
  currentXDataStateLabel,
  handleCopyAnalysisResult,
  hasFetchedExternalData,
  isAutoSummarizing,
  operationStatus,
  personaMode,
  publishStatus,
  queryDirty,
  result,
  saveCurrentClusterRunToHistory,
  saveCurrentXDatasetToHistory,
  stagedCurrentDataCount,
  stagedFetchState,
  stagedNextFetchCount,
  stagedRemainingCount,
  summarizedClusterCount,
  xDataStatus,
  xMaxResults,
}) {
  function operationTimeLabel(operation) {
    const time = operation?.lastSuccessAt || operation?.lastErrorAt || operation?.lastRunAt;
    return time ? formatHistoryDate(time) : "";
  }

  function operationStatusClass(operation) {
    return `dashboard-status ${operation?.status || "idle"}`;
  }

  function zone0StatusTone(item) {
    const status = item?.operation?.status || "idle";
    const value = item?.value || "";
    const detail = item?.detail || "";

    if (status === "running" || value.includes("中")) return "running";
    if (status === "error" || value.includes("失敗") || value.includes("不調")) return "error";
    if (
      value.includes("要再実行") ||
      value.includes("変更あり") ||
      value.includes("古い可能性") ||
      value.includes("未保存") ||
      value.includes("一部完了") ||
      detail.includes("古い可能性")
    ) {
      return "warning";
    }
    if (
      status === "success" ||
      value.includes("保存済み") ||
      value.includes("コピー済み") ||
      value.includes("反映済み") ||
      value.includes("実行済み") ||
      value.includes("完了") ||
      value.includes("表示中")
    ) {
      return "success";
    }

    return "idle";
  }

  function zone0StatusChipClass(item) {
    return `zone0-status-chip ${zone0StatusTone(item)}`;
  }

  function compactDashboardLabel(label = "") {
    return label.replace(/（[^）]+）/g, "");
  }

  function statusItemTitle(item) {
    return [
      `${item.label}: ${item.value}`,
      item.detail,
      operationTimeLabel(item.operation),
    ].filter(Boolean).join("\n");
  }

  function zone0VersionLabel() {
    return APP_VERSION.replace(/^3DE MVP\s*/, "");
  }

  function zone0AxisSummary() {
    return axisExplanationItems(axisConfig)
      .map((item) => `${item.axis.toUpperCase()} ${item.label}`)
      .join(" / ");
  }

  function graphModeLabel(mode) {
    if (mode === "processed") return "処理後";
    if (mode === "compare") return "前後比較";
    return "処理前";
  }

  function actionButtonConfig(type) {
    const configs = {
      saveDataset: {
        operationKey: "saveDataset",
        zoneLabel: "Zone③",
        idle: "Xデータ保存",
        running: "保存中...",
        success: "Xデータ保存済み",
        error: "Xデータ保存失敗",
        targetHash: currentDatasetHash,
        onClick: saveCurrentXDatasetToHistory,
      },
      saveCluster: {
        operationKey: "saveCluster",
        zoneLabel: "Zone④",
        idle: "クラスタ保存",
        running: "保存中...",
        success: "クラスタ保存済み",
        error: "クラスタ保存失敗",
        targetHash: currentClusterHash,
        onClick: saveCurrentClusterRunToHistory,
      },
      copyAnalysis: {
        operationKey: "copyAnalysis",
        zoneLabel: "結果",
        idle: "分析結果コピー",
        running: "コピー中...",
        success: "分析結果コピー済み",
        error: "コピー失敗",
        targetHash: currentAnalysisHash,
        onClick: handleCopyAnalysisResult,
      },
    };

    return configs[type];
  }

  function actionButtonStatus(type) {
    const config = actionButtonConfig(type);
    const operation = operationStatus[config?.operationKey] || EMPTY_OPERATION_STATUS;

    if (type === "saveDataset" && operation.status === "success" && !activeDatasetMatchesCurrent) {
      return "idle";
    }
    if (type === "saveCluster" && operation.status === "success" && !activeClusterRunId) {
      return "idle";
    }
    if (operation.status === "success" && operation.targetHash && operation.targetHash !== config.targetHash) {
      return "idle";
    }

    return operation.status || "idle";
  }

  function getActionButtonLabel(type, status = "idle") {
    const config = actionButtonConfig(type);
    const label = config?.[status] || config?.idle || "";
    return config?.zoneLabel ? `${label}（${config.zoneLabel}）` : label;
  }

  function actionButtonClass(type) {
    return `action-status-button ${actionButtonStatus(type)}`;
  }

  function renderActionStatusButton(type, extraClass = "", labelOverride = "") {
    const config = actionButtonConfig(type);
    const status = actionButtonStatus(type);

    return (
      <button
        type="button"
        className={`${actionButtonClass(type)} ${extraClass}`.trim()}
        onClick={config.onClick}
        disabled={status === "running"}
      >
        {labelOverride || getActionButtonLabel(type, status)}
      </button>
    );
  }

  return {
    ...createDiagnosticsViewModel({
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
      beginnerFixedXCount: BEGINNER_FIXED_X_COUNT,
    }),
    actionButtonClass,
    actionButtonConfig,
    actionButtonStatus,
    compactDashboardLabel,
    getActionButtonLabel,
    graphModeLabel,
    operationStatusClass,
    operationTimeLabel,
    renderActionStatusButton,
    statusItemTitle,
    zone0AxisSummary,
    zone0StatusChipClass,
    zone0VersionLabel,
  };
}
