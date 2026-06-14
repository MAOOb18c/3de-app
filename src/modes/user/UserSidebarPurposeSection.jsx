export default function UserSidebarPurposeSection({ ctx }) {
  const {
    JP_UI_LABELS,
    PERSONA_CONFIGS,
    Zone,
    ZoneP,
    axisDirty,
    config,
    currentPersonaConfig,
    dashboardLabel,
    description,
    entries,
    handlePersonaModeChange,
    join,
    length,
    mode,
    mojibakeLabelWarnings,
    note,
    personaMode,
    possibleMojibake,
    query,
    resetMojibakeRuntimeData,
    row,
    status,
    themeCategory,
    viewMode,
    warning,
  } = ctx;

  return (
    <>
<section className="row card zone-card zone-p persona-mode-panel">
        <div className="zone-heading">Zone P 利用目的・ペルソナ設定</div>
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 3 / ZoneP</div>}
        <p className="zone-lead">
          同じテーマでも、使う目的によってアウトプットの見せ方は変わります。
          まず、このテーマを何のために使うか選んでください。
        </p>
        <p className="persona-mode-note">
          利用目的は、分析結果の見せ方を変えます。評価軸と検索条件は、原則としてテーマを優先します。
        </p>
        <div className="persona-mode-buttons">
          {Object.entries(PERSONA_CONFIGS).map(([mode, config]) => (
            <button
              key={mode}
              type="button"
              className={personaMode === mode ? "option-button option-button-selected active persona-mode-button" : "option-button persona-mode-button"}
              onClick={() => handlePersonaModeChange(mode)}
            >
              <strong>{config.label}</strong>
              <span>{config.description}</span>
            </button>
          ))}
        </div>
        <div className="persona-mode-status">
          現在の利用目的：<strong>{currentPersonaConfig.dashboardLabel}</strong>
          <span> / テーマカテゴリ：{themeCategory}</span>
          {axisDirty && <span> / 評価軸・検索クエリ・フィードバックは再確認してください。</span>}
        </div>
        {viewMode === "developer" && mojibakeLabelWarnings.length > 0 && (
          <div className="developer-panel mojibake-warning-panel">
            <strong>{JP_UI_LABELS.possibleMojibake}</strong>
            <span>{mojibakeLabelWarnings.join(" / ")}</span>
          </div>
        )}
        {viewMode === "developer" && (
          <details className="developer-panel safe-query-preview developer-maintenance-panel">
            <summary>開発者向けメンテナンス</summary>
            <p>
              古い保存状態に残った文字化け候補やクエリを削除し、現在のテーマから候補を再生成します。
            </p>
            <button type="button" className="action-button action-button-secondary" onClick={resetMojibakeRuntimeData}>
              文字化けデータをリセット
            </button>
          </details>
        )}
      </section>
    </>
  );
}
