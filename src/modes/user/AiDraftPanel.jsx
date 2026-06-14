export default function AiDraftPanel({
  aiDraft,
  aiDraftApiHealth,
  aiDraftError,
  aiDraftErrorDetails,
  aiDraftInitialQuestions,
  aiDraftMode,
  aiDraftStatus,
  applyAiDraft,
  checkAnalysisDraftHealth,
  handleGenerateAnalysisDraft,
  isAiDraftApplied,
  isAiDraftLoading,
  operationStatus,
  publicPreviewMode,
  theme,
  userOpinion,
  viewMode,
}) {
  return (
    <div className="ai-draft-panel">
      <div className="ai-draft-header">
        <h3>まずここから</h3>
        <span>AI仮生成</span>
      </div>
      <p>
        テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。生成結果は編集してから適用できます。
      </p>
      <div className={`ai-draft-health ${aiDraftApiHealth.status} ${viewMode === "developer" ? "developer-panel" : ""}`}>
        <div>
          <strong>AI仮生成：</strong>{publicPreviewMode ? "利用状況を確認中" : aiDraftApiHealth.label}
        </div>
        {viewMode === "developer" ? (
          <>
            <span>{aiDraftApiHealth.details}</span>
            <button type="button" className="x-small-button" onClick={checkAnalysisDraftHealth}>
              再確認
            </button>
          </>
        ) : (
          <span>AIが使えない場合も、簡易ルールで仮設定を表示します。</span>
        )}
      </div>
      {(!theme.trim() || !userOpinion.trim()) && (
        <div className="ai-draft-warning">
          テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。
        </div>
      )}
      <button
        type="button"
        className={`action-button action-button-primary ${
          isAiDraftLoading || operationStatus.aiAxisDraft.status === "running"
            ? "is-running"
            : operationStatus.aiAxisDraft.status === "success"
              ? "is-done"
              : ""
        }`}
        disabled={isAiDraftLoading || operationStatus.aiAxisDraft.status === "running" || !theme.trim() || !userOpinion.trim()}
        onClick={handleGenerateAnalysisDraft}
      >
        {isAiDraftLoading || operationStatus.aiAxisDraft.status === "running"
          ? "AI生成中..."
          : operationStatus.aiAxisDraft.status === "success"
            ? "AI設定生成済み"
            : "AIで分析設定を仮生成"}
      </button>
      {isAiDraftLoading && <div className="ai-draft-status loading">実行中...</div>}
      {aiDraftStatus && (
        <div className={aiDraftMode === "fallback" ? "ai-draft-status fallback" : "ai-draft-status success"}>
          {aiDraftStatus}
        </div>
      )}
      {aiDraftError && (
        <div className="ai-draft-error-panel">
          <strong>{publicPreviewMode ? "AI仮生成に失敗しました。簡易ルールで続行できます。" : aiDraftError}</strong>
          <div className="ai-draft-error-grid">
            {publicPreviewMode ? (
              <div>
                <span>対処</span>
                <ol>
                  <li>少し時間をおいて再実行してください</li>
                  <li>そのまま簡易ルールの仮設定で試せます</li>
                </ol>
              </div>
            ) : aiDraftErrorDetails ? (
              <div>
                <span>今回のPOST結果</span>
                <ul>
                  <li>status: {String(aiDraftErrorDetails.status || "-")}</li>
                  <li>errorType: {aiDraftErrorDetails.errorType || "-"}</li>
                  <li>code: {aiDraftErrorDetails.code || "-"}</li>
                </ul>
              </div>
            ) : (
              <>
                <div>
                  <span>原因候補</span>
                  <ul>
                    <li>server.js が起動していない</li>
                    <li>OPENAI_API_KEY が .env に設定されていない</li>
                    <li>OpenAI APIの利用上限、課金設定、またはAPI側で問題が起きている</li>
                    <li>AI応答をJSONとして読み取れなかった</li>
                  </ul>
                </div>
                <div>
                  <span>対処</span>
                  <ol>
                    <li>server.js を起動してください</li>
                    <li>.env の OPENAI_API_KEY を確認してください</li>
                    <li>ブラウザを再読み込みしてください</li>
                    <li>もう一度 AI生成を実行してください</li>
                  </ol>
                </div>
              </>
            )}
          </div>
          {viewMode === "developer" && aiDraftErrorDetails && (
            <details className="developer-panel ai-draft-error-details">
              <summary>技術詳細</summary>
              <div>status: {String(aiDraftErrorDetails.status || "-")}</div>
              <div>errorType: {aiDraftErrorDetails.errorType || "-"}</div>
              <div>code: {aiDraftErrorDetails.code || "-"}</div>
              <pre>{String(aiDraftErrorDetails.details || "-")}</pre>
            </details>
          )}
        </div>
      )}
      {aiDraft && (
        <div className="ai-draft-result">
          {aiDraft.fallback && aiDraftMode === "fallback" && (
            <div className="ai-draft-status fallback">
              AI生成に失敗したため、簡易ルールで仮設定を作成しました。この設定は後から自由に編集できます。
            </div>
          )}
          <h4>仮生成された評価軸</h4>
          <div className="ai-draft-axis-grid">
            {["x", "y", "z"].map((axis) => (
              <div key={`ai-draft-${axis}`} className="ai-draft-axis-card">
                <strong>{axis.toUpperCase()}：{aiDraft.axisConfig?.[axis]?.label}</strong>
                <span>高い：{aiDraft.axisConfig?.[axis]?.highDescription || aiDraft.axisConfig?.[axis]?.description}</span>
                <span>低い：{aiDraft.axisConfig?.[axis]?.lowDescription || "-"}</span>
              </div>
            ))}
          </div>
          <h4>仮生成された検索クエリ候補</h4>
          <div className="ai-draft-query-list">
            {(aiDraft.queryCandidates || []).map((candidate) => (
              <div key={candidate.id || candidate.label} className="query-candidate-card">
                <div className="query-candidate-label">{candidate.label}</div>
                <div className="query-candidate-description">{candidate.description}</div>
                <div className="query-candidate-query">
                  <span className="query-candidate-query-label">検索式：</span>
                  {candidate.query}
                </div>
              </div>
            ))}
          </div>
          {aiDraftInitialQuestions.length > 0 && (
            <>
              <h4>最初に考える問い</h4>
              <ul className="ai-draft-question-list">
                {aiDraftInitialQuestions.map((question, index) => (
                  <li key={`ai-draft-question-${index}`}>{question}</li>
                ))}
              </ul>
            </>
          )}
          <div className="ai-draft-actions">
            <button
              type="button"
              className={`action-button action-button-save ${isAiDraftApplied ? "is-done" : ""}`}
              onClick={applyAiDraft}
            >
              {isAiDraftApplied ? "適用済み" : "このAI候補を適用"}
            </button>
            <button type="button" className="action-button action-button-secondary" onClick={handleGenerateAnalysisDraft}>
              AI候補を再生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
