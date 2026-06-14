export default function UserSidebarClusterSection({ ctx }) {
  const {
    CLUSTER_THRESHOLD_OPTIONS,
    OpenAI,
    SEMANTIC_THRESHOLD_OPTIONS,
    Zone,
    activeDataset,
    canRunSemanticCluster,
    clearActiveClusterRunState,
    cluster,
    clusterMethod,
    clusterRuns,
    clusterThreshold,
    currentClusterDisplayLabel,
    handleRunSemanticCluster,
    is,
    isSemanticClusterLoading,
    length,
    note,
    operationStatus,
    row,
    run,
    saveTarget,
    semanticCluster,
    semanticClusterRows,
    semanticClusterStateLabel,
    semanticThreshold,
    setClusterMethod,
    setClusterThreshold,
    setSemanticClusterError,
    setSemanticClusterRows,
    setSemanticClusterStatus,
    setSemanticThreshold,
    status,
    target,
    text,
    threshold,
    viewMode,
    warning,
  } = ctx;

  return (
    <>
<section className="row card sidebar-control-card zone-card zone-6">
            <h2>Zone④ クラスタリング</h2>
            <div className="status-panel">
              <div><strong>現在の方式：</strong>{viewMode === "user" ? "意味類似 OpenAI" : clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}</div>
              <div><strong>意味クラスタ状態：</strong>{semanticClusterStateLabel()}</div>
              {viewMode === "developer" && <div><strong>現在表示中：</strong>{currentClusterDisplayLabel()}</div>}
              <div><strong>保存済みクラスタ結果：</strong>{activeDataset?.clusterRuns?.length || 0}件</div>
            </div>

            {viewMode === "developer" && (
            <div className="cluster-method-controls">
              <div>クラスタ化方式：</div>
              <div className="cluster-method-buttons">
                <button
                  type="button"
                  className={
                    clusterMethod === "text"
                      ? "option-button option-button-selected cluster-method-button active"
                      : "option-button cluster-method-button"
                  }
                  onClick={() => {
                    setClusterMethod("text");
                    clearActiveClusterRunState();
                  }}
                >
                  文字類似
                </button>
                <button
                  type="button"
                  className={
                    clusterMethod === "semantic"
                      ? "option-button option-button-selected cluster-method-button active"
                      : "option-button cluster-method-button"
                  }
                  onClick={() => {
                    setClusterMethod("semantic");
                    clearActiveClusterRunState();
                  }}
                >
                  意味類似 OpenAI
                </button>
              </div>
            </div>
            )}

            {viewMode === "developer" && (
            <div className="threshold-controls">
              <div>文字類似しきい値：</div>
              <div className="threshold-buttons">
                {CLUSTER_THRESHOLD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      clusterThreshold === option.value
                        ? "option-button option-button-selected threshold-option-button threshold-button active"
                        : "option-button threshold-option-button threshold-button"
                    }
                    onClick={() => {
                      setClusterThreshold(option.value);
                      clearActiveClusterRunState();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            <div className="semantic-cluster-panel">
              {viewMode === "developer" ? (
              <>
              <div>意味類似しきい値：</div>
              <div className="semantic-threshold-buttons">
                {SEMANTIC_THRESHOLD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      semanticThreshold === option.value
                        ? "option-button option-button-selected threshold-option-button semantic-threshold-button active"
                        : "option-button threshold-option-button semantic-threshold-button"
                    }
                    onClick={() => {
                      setSemanticThreshold(option.value);
                      setSemanticClusterRows([]);
                      setSemanticClusterStatus("");
                      setSemanticClusterError("");
                      clearActiveClusterRunState();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              </>
              ) : (
                <div className="cluster-note">似た意見を意味の近さでまとめます。</div>
              )}
              <button
                type="button"
                className={`action-button action-button-primary semantic-run-button ${
                  isSemanticClusterLoading || operationStatus.semanticCluster.status === "running"
                    ? "is-running"
                    : operationStatus.semanticCluster.status === "success" && semanticClusterRows.length > 0
                      ? "is-done"
                      : ""
                }`}
                onClick={handleRunSemanticCluster}
                disabled={
                  !canRunSemanticCluster ||
                  isSemanticClusterLoading ||
                  operationStatus.semanticCluster.status === "running"
                }
              >
                {!canRunSemanticCluster
                  ? "分析対象が少なすぎるため実行不可"
                  : isSemanticClusterLoading || operationStatus.semanticCluster.status === "running"
                  ? "意味クラスタ実行中..."
                  : operationStatus.semanticCluster.status === "success" && semanticClusterRows.length > 0
                    ? "意味クラスタ実行済み"
                    : "意味クラスタを実行"}
              </button>
              {!canRunSemanticCluster && (
                <div className="cluster-note">
                  分析対象が少なすぎるため、意味クラスタを実行できません。先に取得条件を改善してください。
                </div>
              )}
            </div>

            <div className={saveTarget.warning ? "save-target-preview save-target-warning" : "save-target-preview"}>
              <strong>現在の保存対象：</strong>
              <span>{saveTarget.text}</span>
            </div>
          </section>

          {/* Zone⑤ AI要約 */}
    </>
  );
}
