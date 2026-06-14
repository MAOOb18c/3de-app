export default function UserSidebarSummarySection({ ctx }) {
  const {
    AUTO_SUMMARY_LIMIT_OPTIONS,
    Zone,
    autoSummary,
    autoSummaryLimit,
    autoSummaryStatus,
    copyStatus,
    handleRunAutoSummary,
    is,
    isAutoSummarizing,
    limit,
    operationStatus,
    row,
    run,
    setAutoSummaryLimit,
    status,
    summarizedClusterCount,
    summaryTargetClusterLabel,
  } = ctx;

  return (
    <>
<section className="row card sidebar-control-card zone-card zone-7">
            <h2>Zone⑤ AI要約</h2>
            <div className="auto-summary-controls">
              {AUTO_SUMMARY_LIMIT_OPTIONS.map((limit) => (
                <button
                  key={limit}
                  type="button"
                  className={
                    autoSummaryLimit === limit
                      ? "option-button option-button-selected summary-limit-option-button auto-summary-button active"
                      : "option-button summary-limit-option-button auto-summary-button"
                  }
                  onClick={() => setAutoSummaryLimit(limit)}
                  disabled={isAutoSummarizing}
                >
                  上位{limit}件
                </button>
              ))}
              <button
                type="button"
                className={`action-button action-button-primary summary-run-button auto-summary-button primary ${
                  isAutoSummarizing || operationStatus.autoSummary.status === "running"
                    ? "is-running"
                    : operationStatus.autoSummary.status === "success" || summarizedClusterCount() > 0
                      ? "is-done"
                      : ""
                }`}
                onClick={handleRunAutoSummary}
                disabled={isAutoSummarizing || operationStatus.autoSummary.status === "running"}
              >
                {isAutoSummarizing || operationStatus.autoSummary.status === "running"
                  ? "AI要約中..."
                  : operationStatus.autoSummary.status === "success" || summarizedClusterCount() > 0
                    ? "AI要約済み"
                    : "上位クラスタを一括AI要約"}
              </button>
            </div>
            <div className="status-panel">
              <div><strong>AI要約対象：</strong>上位{autoSummaryLimit}件</div>
              <div><strong>AI要約状態：</strong>{autoSummaryStatus}</div>
              <div><strong>現在の要約元：</strong>{summaryTargetClusterLabel()}</div>
            </div>
            {copyStatus === "success" && (
              <span className="copy-analysis-status success">コピーしました。ChatGPTに貼り付けできます。</span>
            )}
            {copyStatus === "error" && (
              <span className="copy-analysis-status error">コピーに失敗しました。ブラウザの権限を確認してください。</span>
            )}
          </section>
    </>
  );
}
