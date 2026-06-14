export default function UserSidebarHistorySection({ ctx }) {
  const {
    Zone,
    actionType,
    activeClusterRunId,
    activeDataset,
    activeDatasetId,
    analysisTargetCount,
    checked,
    cluster,
    clusterCount,
    clusterMethod,
    clusterRuns,
    clusterTableRows,
    compressionRate,
    copyAnalysis,
    count,
    currentSessionSampleLabel,
    currentXDataStateLabel,
    dataset,
    datasetHistory,
    datasetId,
    datasetThemeMismatch,
    datasetUserOpinionMismatch,
    datasets,
    deleteClusterRunHistory,
    deleteXDatasetHistory,
    description,
    detail,
    duplicateCount,
    effectiveQuery,
    event,
    externalOpinions,
    fetchX,
    filter,
    formatHistoryDate,
    getNextAction,
    hasScoredWithCurrentAxis,
    historyStatus,
    includes,
    index,
    inputCount,
    isFinite,
    isNoiseFilteringDisabled,
    isXDatasetHistoryExpanded,
    join,
    length,
    loadClusterRunFromHistory,
    loadXDatasetFromHistory,
    noiseExcludedCount,
    noiseFilteringEnabled,
    noiseProcessingResult,
    previous,
    query,
    renderActionStatusButton,
    rescore,
    result,
    retweetLikeCount,
    row,
    run,
    runId,
    sampleKey,
    sampleLabel,
    sampleNoLabel,
    sampleTitle,
    saveCluster,
    saveDataset,
    savedAt,
    selectedQueryCandidateIds,
    selectedQueryCandidateLabels,
    selectedXQueryCandidateIds,
    semanticCluster,
    semanticThreshold,
    setIsNoiseFilteringDisabled,
    setIsXDatasetHistoryExpanded,
    split,
    status,
    summarizedClusterCount,
    target,
    textThreshold,
    theme,
    toFixed,
    trim,
    truncateText,
    uniqueNormalizedCount,
    userOpinion,
    viewMode,
    warning,
    workflowClass,
    x,
  } = ctx;

  return (
    <>
<section className="row card history-panel control-panel x-data-panel zone-card zone-4">
        <div className="section-title-row">
          <h2 className="control-panel-title">データ詳細確認</h2>
        </div>
        <p className="control-panel-description">
          現在扱っているXデータと保存済み履歴を確認します。保存とコピーはZone?とこのパネルの共通ボタンから実行できます。
        </p>
        <div className="sidebar-action-status-buttons">
          {renderActionStatusButton("saveDataset", "sidebar-action-button")}
          {renderActionStatusButton("saveCluster", "sidebar-action-button")}
          {renderActionStatusButton("copyAnalysis", "sidebar-action-button")}
        </div>

        <div className={`noise-filter-panel compact ${viewMode === "developer" ? "developer-panel" : ""}`}>
          <div className="noise-filter-header">
            <strong>ノイズ除去</strong>
            <span className={noiseFilteringEnabled ? "status-pill success" : "status-pill muted"}>
              {noiseFilteringEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <div className="noise-filter-summary">
            除外 {result.noiseProcessingResult.noiseExcludedCount}件 / 分析対象 {result.noiseProcessingResult.analysisTargetCount}件
          </div>
          {viewMode === "developer" && (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={isNoiseFilteringDisabled}
                onChange={(event) => setIsNoiseFilteringDisabled(event.target.checked)}
              />
              開発用：ノイズ除去を一時的にOFF
            </label>
          )}
        </div>

        <div className="workflow-steps">
          <div className={workflowClass(["input", "aiDraft", "fetchX"].includes(getNextAction().actionType) ? "current" : "done")}>
            <span>1. X取得</span>
            <span className="workflow-badge">{["input", "aiDraft", "fetchX"].includes(getNextAction().actionType) ? "未完了" : "完了"}</span>
          </div>
          <div className={workflowClass(getNextAction().actionType === "rescore" ? "current" : hasScoredWithCurrentAxis ? "done" : "pending")}>
            <span>2. 再スコアリング</span>
            <span className="workflow-badge">{hasScoredWithCurrentAxis ? "完了" : "未実行"}</span>
          </div>
          <div className={workflowClass(["cluster", "semanticCluster"].includes(getNextAction().actionType) ? "current" : result.clusterTableRows.length > 0 ? "done" : "pending")}>
            <span>3. クラスタリング</span>
            <span className="workflow-badge">{result.clusterTableRows.length > 0 ? "完了" : "未実行"}</span>
          </div>
          <div className={workflowClass(getNextAction().actionType === "summary" ? "current" : summarizedClusterCount() > 0 ? "done" : "pending")}>
            <span>4. AI要約・フィードバック</span>
            <span className="workflow-badge">{summarizedClusterCount() > 0 ? "完了" : "未実行"}</span>
          </div>
        </div>

        {historyStatus && <div className="history-status">{historyStatus}</div>}
        {(datasetThemeMismatch || datasetUserOpinionMismatch) && (
          <div className="save-target-warning">
            {datasetThemeMismatch && (
              <div>注意：保存済みXデータのテーマと現在入力中のテーマが一致していません。</div>
            )}
            {datasetUserOpinionMismatch && (
              <div>注意：保存済みXデータの自分の意見と現在入力中の自分の意見が一致していません。</div>
            )}
          </div>
        )}

        <div className="active-dataset-panel">
          <h3>現在のXデータ</h3>
          <div className="history-meta">
            <div>状態：{currentXDataStateLabel()}</div>
            <div>X取得件数：{externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}件</div>
            {viewMode === "developer" && (
              <>
            <div>正規化後ユニーク件数：{result.noiseProcessingResult.uniqueNormalizedCount}</div>
            <div>完全重複数：{result.noiseProcessingResult.duplicateCount}</div>
            <div>RT風投稿数：{result.noiseProcessingResult.retweetLikeCount}</div>
            <div>保存日時：{activeDataset?.savedAt ? formatHistoryDate(activeDataset.savedAt) : "-"}</div>
              </>
            )}
            <div>
              サンプル：
              {activeDataset
                ? `${sampleNoLabel(activeDataset.sampleKey, activeDataset.sampleNo)}：${sampleTitle(null, activeDataset.sampleLabel || activeDataset.sampleKey)}`
                : currentSessionSampleLabel}
            </div>
            <div>テーマ：{activeDataset?.theme || theme || "-"}</div>
            {viewMode === "developer" && (
              <>
            <div>保存データの自分の意見：{truncateText(activeDataset?.userOpinion || "-", 120)}</div>
            <div>選択クエリ候補数：{activeDataset?.selectedQueryCandidateIds?.length ?? selectedXQueryCandidateIds.length}</div>
            <div>実行X検索クエリ：{activeDataset?.effectiveQuery || activeDataset?.query || effectiveQuery || "-"}</div>
              </>
            )}
            <div>
              件数：
              {activeDataset?.count ||
                externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}
              件
            </div>
            {viewMode === "developer" && <div>datasetId：{activeDatasetId || "-"}</div>}
          </div>
        </div>

        <div className="history-section zone-subsection">
          <button
            type="button"
            className="collapse-header"
            onClick={() => {
              if (viewMode === "developer") {
                setIsXDatasetHistoryExpanded((previous) => !previous);
              }
            }}
          >
            <span>{viewMode === "developer" ? (isXDatasetHistoryExpanded ? "-" : "+") : ""} 保存済みXデータ履歴</span>
            <strong>{datasetHistory.datasets.length}件</strong>
          </button>
          {datasetHistory.datasets.length === 0 ? (
            <div className="history-empty">保存済みXデータはありません。</div>
          ) : viewMode === "user" || !isXDatasetHistoryExpanded ? (
            <div className="collapsed-dataset-summary">
              {datasetHistory.datasets.map((dataset) => (
                <div
                  key={dataset.datasetId}
                  className={dataset.datasetId === activeDatasetId ? "dataset-summary-row active" : "dataset-summary-row"}
                >
                  <div className="dataset-summary-main">
                    <strong>
                      {`${sampleNoLabel(dataset.sampleKey, dataset.sampleNo)}：${sampleTitle(
                        null,
                        dataset.sampleLabel || dataset.sampleKey || "-"
                      )}`}
                    </strong>
                    <span>テーマ：{truncateText(dataset.theme || dataset.sampleLabel || "-", 72)}</span>
                    <span>{dataset.count || 0}件 / 保存日時：{formatHistoryDate(dataset.savedAt)}</span>
                    {viewMode === "developer" && <span>datasetId：{dataset.datasetId}</span>}
                  </div>
                  <div className="dataset-summary-actions">
                    <button type="button" className="history-button" onClick={() => loadXDatasetFromHistory(dataset.datasetId)}>
                      読み込む
                    </button>
                    <button
                      type="button"
                      className="history-button danger"
                      onClick={() => deleteXDatasetHistory(dataset.datasetId)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-list">
              {datasetHistory.datasets.map((dataset, index) => (
                <div
                  key={dataset.datasetId}
                  className={dataset.datasetId === activeDatasetId ? "history-card dataset-detail-card active" : "history-card dataset-detail-card"}
                >
                  <div className="history-card-title">
                    {index + 1}. {formatHistoryDate(dataset.savedAt)}
                  </div>
                  <div className="history-meta">
                    <div>
                      サンプル：
                      {`${sampleNoLabel(dataset.sampleKey, dataset.sampleNo)}：${sampleTitle(null, dataset.sampleLabel || dataset.sampleKey || "-")}`}
                    </div>
                    <div>テーマ：{truncateText(dataset.theme || dataset.sampleLabel || "-", 160)}</div>
                    <div>自分の意見：{truncateText(dataset.userOpinion || "-", 160)}</div>
                    <div>選択クエリ候補数：{dataset.selectedQueryCandidateIds?.length || 0}</div>
                    <div>
                      選択クエリ候補：
                      {dataset.selectedQueryCandidateLabels?.length
                        ? dataset.selectedQueryCandidateLabels.join(" / ")
                        : "なし"}
                    </div>
                    <div>実行X検索クエリ：{truncateText(dataset.effectiveQuery || dataset.query || "-", 180)}</div>
                    <div>件数：{dataset.count}件</div>
                    <div>クラスタ結果：{dataset.clusterRuns?.length || 0}件</div>
                    {viewMode === "developer" && <div>datasetId：{dataset.datasetId}</div>}
                  </div>
                  <div className="history-actions">
                    <button type="button" className="history-button" onClick={() => loadXDatasetFromHistory(dataset.datasetId)}>
                      読み込む
                    </button>
                    <button
                      type="button"
                      className="history-button danger"
                      onClick={() => deleteXDatasetHistory(dataset.datasetId)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeDataset && (
          <div className="history-section control-panel cluster-save-panel">
            <h3>クラスタリング履歴</h3>
            {activeDataset.clusterRuns.length === 0 ? (
              <div className="history-empty">このXデータに保存されたクラスタリング結果はありません。</div>
            ) : (
              <div className="cluster-run-list">
                {activeDataset.clusterRuns.map((run, index) => (
                  <div
                    key={run.runId}
                    className={run.runId === activeClusterRunId ? "history-card active" : "history-card"}
                  >
                    <div className="history-card-title">
                      {index + 1}. {formatHistoryDate(run.savedAt)}｜{run.summary}
                    </div>
                    <div className="history-meta">
                      <div>
                        {run.inputCount}件→{run.clusterCount}クラスタ｜圧縮率
                        {Number.isFinite(run.compressionRate) ? run.compressionRate.toFixed(1) : "0.0"}%
                      </div>
                      <div>
                        方式：{run.clusterMethod === "semantic" ? "意味類似" : "文字類似"}｜
                        文字 {Number(run.textThreshold || 0).toFixed(2)}｜
                        意味 {Number(run.semanticThreshold || 0).toFixed(2)}
                      </div>
                      <div>
                        サンプル：
                        {`${sampleNoLabel(run.datasetSampleKey || activeDataset.sampleKey, run.datasetSampleNo)}：${sampleTitle(null, run.datasetSampleLabel || activeDataset.sampleLabel || activeDataset.sampleKey)}`}
                      </div>
                      {viewMode === "developer" && <div>runId：{run.runId}</div>}
                    </div>
                    <div className="history-actions">
                      <button
                        type="button"
                        className="history-button"
                        onClick={() => loadClusterRunFromHistory(activeDataset.datasetId, run.runId)}
                      >
                        結果を読み込む
                      </button>
                      <button
                        type="button"
                        className="history-button danger"
                        onClick={() => deleteClusterRunHistory(activeDataset.datasetId, run.runId)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

          {/* Zone④ クラスタリング */}
    </>
  );
}
