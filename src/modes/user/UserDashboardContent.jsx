import DashboardActionBar from "../../components/DashboardActionBar.jsx";
import DashboardStatusPanel from "../../components/DashboardStatusPanel.jsx";
import EvaluationAxisPanel from "../../components/EvaluationAxisPanel.jsx";

export default function UserDashboardContent({ ctx }) {
  const {
    activeMode,
    activeModeLabel,
    axisConfig,
    axisExplanationItems,
    beginnerXFetchDebug,
    beginnerXSourceSummary,
    canRescoreWithCurrentAxis,
    canRunSemanticCluster,
    clusterMethod,
    compactDashboardLabel,
    currentPersonaConfig,
    dashboardActionHeight,
    dashboardActionPanelRef,
    dashboardCompactIndicators,
    dashboardCountBreakdownIndicators,
    dashboardLeftWidth,
    dashboardPanelRef,
    dashboardPublishIndicators,
    dashboardStatusHeight,
    dashboardStatusItems,
    dashboardStatusPanelRef,
    graphMode,
    graphModeLabel,
    handleForceStopRunningOperations,
    handleRunAutoSummary,
    handleRunSemanticCluster,
    isAutoSummarizing,
    JP_UI_LABELS,
    LOCAL_PUBLISH_AVAILABLE,
    modeNav,
    operationStatus,
    operationStatusClass,
    operationTimeLabel,
    PUBLIC_PREVIEW_MODE,
    regenerateFeedback,
    renderActionStatusButton,
    renderLocalPublishPanel,
    rescoreButtonText,
    rescoreWithCurrentAxis,
    scoreDisplayMode,
    scoreDisplayModeLabel,
    setDashboardResizeTarget,
    setGraphMode,
    setScoreDisplayMode,
    statusItemTitle,
    toast,
    userModeResultSourceLabel,
    viewMode,
    zone0StatusChipClass,
    zone0VersionLabel,
  } = ctx;

  return (
    <>
      <section
        ref={dashboardPanelRef}
        className="zone-zero-panel dashboard-layout-panel"
        aria-label="Zone? データ管理"
        style={{ gridTemplateColumns: `${dashboardLeftWidth}px 10px minmax(0, 1fr)` }}
      >
        <aside className="dashboard-left-column" aria-label="ダッシュボード基本情報">
          <div className="zone0-brand-block dashboard-brand-panel">
            {modeNav}
            <div className="zone-zero-brand">
              <h1>3DE MVP</h1>
              <div className="version">{zone0VersionLabel()}</div>
            </div>
            <div className="dashboard-left-meta">
              <span className="zone-zero-control-pill">現在のモード：{activeModeLabel}</span>
              <span className="zone-zero-control-pill" title={currentPersonaConfig.description}>
                利用目的：{currentPersonaConfig.dashboardLabel}
              </span>
              <span
                className={`dashboard-x-source-pill ${
                  beginnerXFetchDebug.fallbackUsed
                    ? "fallback"
                    : beginnerXFetchDebug.status === "success"
                      ? "success"
                      : ""
                }`}
                title={beginnerXFetchDebug.message}
              >
                X取得：{beginnerXSourceSummary}
              </span>
              {(activeMode === "user" || activeMode === "developer") && (
                <span className="zone-zero-control-pill" title="User modeで現在表示している結果スロット">
                  表示元：{userModeResultSourceLabel}
                </span>
              )}
            </div>
          </div>
          {renderLocalPublishPanel()}
        </aside>

        <button
          type="button"
          className="dashboard-column-resize-handle"
          aria-label="ダッシュボード左カラムの幅を調整"
          title="ドラッグで左カラムの幅を調整"
          onMouseDown={(event) => {
            event.preventDefault();
            setDashboardResizeTarget("left");
          }}
        />

        <div className="dashboard-right-column" aria-label="ダッシュボード作業エリア">
          <DashboardStatusPanel
            panelRef={dashboardStatusPanelRef}
            height={dashboardStatusHeight}
            statusItems={dashboardStatusItems()}
            getChipClass={zone0StatusChipClass}
            getItemTitle={statusItemTitle}
            formatLabel={compactDashboardLabel}
          />

          <button
            type="button"
            className="dashboard-row-resize-handle"
            aria-label="現在状態エリアの高さを調整"
            title="ドラッグで現在状態エリアの高さを調整"
            onMouseDown={(event) => {
              event.preventDefault();
              setDashboardResizeTarget("status");
            }}
          />

          <section
            ref={dashboardActionPanelRef}
            className="dashboard-right-section dashboard-actions-section"
            style={{ height: `${dashboardActionHeight}px` }}
            aria-label="実行ボタン"
          >
            <DashboardActionBar
              statusIndicators={[...dashboardCompactIndicators(), ...dashboardCountBreakdownIndicators()]}
              publishIndicators={dashboardPublishIndicators()}
              showPublishGroup={LOCAL_PUBLISH_AVAILABLE}
              scoreDisplayMode={scoreDisplayMode}
              onScoreDisplayModeChange={setScoreDisplayMode}
              viewMode={viewMode}
              graphMode={graphMode}
              onGraphModeChange={setGraphMode}
              saveDatasetButton={renderActionStatusButton("saveDataset", "dashboard-compact-action", "X保存")}
              saveClusterButton={renderActionStatusButton("saveCluster", "dashboard-compact-action", "クラスタ保存")}
              copyAnalysisButton={renderActionStatusButton("copyAnalysis", "dashboard-compact-action", "結果コピー")}
              rescoreStatus={operationStatus.rescore.status}
              onRescore={rescoreWithCurrentAxis}
              canRescore={canRescoreWithCurrentAxis}
              rescoreTitle={rescoreButtonText}
              semanticClusterStatus={operationStatus.semanticCluster.status}
              onSemanticCluster={handleRunSemanticCluster}
              canRunSemanticCluster={canRunSemanticCluster}
              autoSummaryStatus={operationStatus.autoSummary.status}
              onAutoSummary={handleRunAutoSummary}
              isAutoSummarizing={isAutoSummarizing}
              feedbackStatus={operationStatus.feedback.status}
              onFeedback={regenerateFeedback}
              showForceStop={
                PUBLIC_PREVIEW_MODE &&
                (operationStatus.fetchX.status === "running" ||
                  isAutoSummarizing ||
                  operationStatus.autoSummary.status === "running")
              }
              onForceStop={handleForceStopRunningOperations}
            />
          </section>

          <button
            type="button"
            className="dashboard-row-resize-handle"
            aria-label="実行ボタンエリアの高さを調整"
            title="ドラッグで実行ボタンエリアの高さを調整"
            onMouseDown={(event) => {
              event.preventDefault();
              setDashboardResizeTarget("actions");
            }}
          />

          <EvaluationAxisPanel
            title={JP_UI_LABELS.evaluationAxes}
            guide={JP_UI_LABELS.axisGuide}
            axisItems={axisExplanationItems(axisConfig)}
          />

          <details className="zone-zero-details dashboard-details">
            <summary>Zone?詳細を開く</summary>
            <div className="zone-zero-detail-body">
              <div className="zone-zero-status-grid">
                {dashboardStatusItems().map((item) => (
                  <div key={item.label} className={operationStatusClass(item.operation)}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                    <small>
                      {item.detail}
                      {operationTimeLabel(item.operation) ? ` / ${operationTimeLabel(item.operation)}` : ""}
                    </small>
                  </div>
                ))}
              </div>
              <div className="zone-zero-axis-strip" aria-label="現在のXYZ評価軸">
                {axisExplanationItems(axisConfig).map((item) => (
                  <div key={item.axis} className="zone-zero-axis-item">
                    <strong>{item.axis.toUpperCase()}：{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
              <div className="zone-zero-detail-notes">
                <div>
                  <strong>利用目的</strong>
                  <span>{currentPersonaConfig.description}</span>
                </div>
                <div>
                  <strong>表示設定</strong>
                  <span>
                    {viewMode === "user"
                      ? `スコア：${scoreDisplayModeLabel(scoreDisplayMode)} / グラフ：最終結果 / クラスタ方式：意味類似 OpenAI`
                      : `スコア：${scoreDisplayModeLabel(scoreDisplayMode)} / グラフ：${graphModeLabel(graphMode)} / クラスタ方式：${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}`}
                  </span>
                </div>
                <div>
                  <strong>保存状態</strong>
                  <span>
                    Xデータ：{operationStatus.saveDataset.message || "未保存"} / クラスタ：
                    {operationStatus.saveCluster.message || "未保存"} / コピー：
                    {operationStatus.copyAnalysis.message || "未コピー"}
                  </span>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>
      {PUBLIC_PREVIEW_MODE && (
        <div className="public-preview-notice">
          これは開発中の試用版です。分析結果は参考表示です。
        </div>
      )}
      {toast && <div className={`toast-message ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
