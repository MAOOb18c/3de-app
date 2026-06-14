export default function DashboardActionBar({
  statusIndicators,
  publishIndicators,
  showPublishGroup,
  scoreDisplayMode,
  onScoreDisplayModeChange,
  viewMode,
  graphMode,
  onGraphModeChange,
  saveDatasetButton,
  saveClusterButton,
  copyAnalysisButton,
  rescoreStatus,
  onRescore,
  canRescore,
  rescoreTitle,
  semanticClusterStatus,
  onSemanticCluster,
  canRunSemanticCluster,
  autoSummaryStatus,
  onAutoSummary,
  isAutoSummarizing,
  feedbackStatus,
  onFeedback,
  showForceStop,
  onForceStop,
}) {
  return (
    <div className="dashboard-operation-bar" aria-label="ダッシュボード操作バー">
      <div className="dashboard-operation-group dashboard-operation-status-group" aria-label="状態">
        <span className="dashboard-operation-label">状態</span>
        {statusIndicators.map((item) => (
          <span key={`${item.label}-${item.value}`} className={`dashboard-compact-indicator ${item.tone}`}>
            <b>{item.label}</b>
            <em>{item.value}</em>
          </span>
        ))}
      </div>
      <div className="dashboard-operation-group dashboard-operation-action-group" aria-label="実行">
        <span className="dashboard-operation-label">実行</span>
        <div className="zone-zero-mini-group compact" aria-label="スコア表示方式">
          <span>スコア</span>
          {[
            ["absolute", "絶対"],
            ["relative", "相対"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={scoreDisplayMode === value ? "zone0-mini-button active" : "zone0-mini-button"}
              onClick={() => onScoreDisplayModeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="zone-zero-mini-group compact" aria-label="クラスタ比較表示">
          <span>表示</span>
          {(viewMode === "user"
            ? [["processed", "最終"]]
            : [
                ["raw", "処理前"],
                ["processed", "処理後"],
                ["compare", "比較"],
              ]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={graphMode === value ? "zone0-mini-button active" : "zone0-mini-button"}
              onClick={() => onGraphModeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {saveDatasetButton}
        {saveClusterButton}
        {copyAnalysisButton}
        <button
          type="button"
          className={`action-status-button dashboard-compact-action ${rescoreStatus || "idle"}`}
          onClick={onRescore}
          disabled={!canRescore || rescoreStatus === "running"}
          title={rescoreTitle}
        >
          再スコア
        </button>
        <button
          type="button"
          className={`action-status-button dashboard-compact-action ${semanticClusterStatus || "idle"}`}
          onClick={onSemanticCluster}
          disabled={!canRunSemanticCluster || semanticClusterStatus === "running"}
          title={canRunSemanticCluster ? "意味クラスタを実行" : "分析対象が少なすぎます"}
        >
          クラスタ
        </button>
        <button
          type="button"
          className={`action-status-button dashboard-compact-action ${autoSummaryStatus || "idle"}`}
          onClick={onAutoSummary}
          disabled={isAutoSummarizing || autoSummaryStatus === "running"}
          title="上位クラスタをAI要約"
        >
          AI要約
        </button>
        <button
          type="button"
          className={`action-status-button dashboard-compact-action ${feedbackStatus || "idle"}`}
          onClick={onFeedback}
          title="Zone⑪のフィードバックを再生成"
        >
          FB
        </button>
        <span className="browser-storage-note compact">保存はこのブラウザ内のみ</span>
        {showForceStop && (
          <button type="button" className="zone0-force-stop-button compact" onClick={onForceStop}>
            停止
          </button>
        )}
      </div>
      {showPublishGroup && (
        <div className="dashboard-operation-group dashboard-operation-publish-group" aria-label="公開">
          <span className="dashboard-operation-label">公開</span>
          {publishIndicators.map((item) => (
            <span key={`${item.label}-${item.value}`} className={`dashboard-compact-indicator ${item.tone}`}>
              <b>{item.label}</b>
              <em>{item.value}</em>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
