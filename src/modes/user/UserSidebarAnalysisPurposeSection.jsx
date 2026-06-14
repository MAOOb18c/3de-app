export default function UserSidebarAnalysisPurposeSection({ ctx }) {
  const {
    ANALYSIS_PURPOSE_CONFIGS,
    JP_UI_LABELS,
    Q,
    Zone,
    ZoneQ,
    analysisPurpose,
    analysisPurposeHelp,
    analysisPurposeMode,
    clusterPolicy,
    config,
    currentAnalysisPurposeConfig,
    description,
    detail,
    entries,
    handleAnalysisPurposeChange,
    join,
    mode,
    purposeMode,
    retrievalPolicy,
    row,
    shortDescription,
    status,
    viewMode,
    voiceDirectionLabel,
    voiceDirections,
    voicesToCollect,
    zone11Policy,
  } = ctx;

  return (
    <>
<section className="row card zone-card zone-q analysis-purpose-panel">
        <div className="zone-heading">Zone Q {JP_UI_LABELS.analysisPurpose}</div>
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 4 / ZoneQ</div>}
        <p className="zone-lead">{JP_UI_LABELS.analysisPurposeHelp}</p>
        <div className="persona-mode-buttons analysis-purpose-buttons">
          {Object.entries(ANALYSIS_PURPOSE_CONFIGS).map(([purposeMode, config]) => (
            <button
              key={purposeMode}
              type="button"
              className={
                analysisPurposeMode === purposeMode
                  ? "option-button option-button-selected active analysis-purpose-button"
                  : "option-button analysis-purpose-button"
              }
              onClick={() => handleAnalysisPurposeChange(purposeMode)}
            >
              <strong>{config.label}</strong>
              <span>{config.shortDescription}</span>
            </button>
          ))}
        </div>
        <div className="analysis-purpose-selected-detail">
          <strong>選択中：{currentAnalysisPurposeConfig.label}</strong>
          <span>{currentAnalysisPurposeConfig.description}</span>
          {viewMode === "developer" && (
            <small>
              {JP_UI_LABELS.voicesToCollect}: {currentAnalysisPurposeConfig.voiceDirections.map(voiceDirectionLabel).join(" / ")}
            </small>
          )}
        </div>
        {viewMode === "developer" && (
          <div className="developer-panel persona-mode-status">
            <span>{JP_UI_LABELS.retrievalPolicy}: {currentAnalysisPurposeConfig.retrievalPolicy}</span>
            <span> / {JP_UI_LABELS.clusterPolicy}: {currentAnalysisPurposeConfig.clusterPolicy}</span>
            <span> / {JP_UI_LABELS.zone11Policy}: {currentAnalysisPurposeConfig.zone11Policy}</span>
          </div>
        )}
      </section>
    </>
  );
}
