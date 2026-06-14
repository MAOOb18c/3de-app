import DeveloperSourceDiagnostics from "../../components/DeveloperSourceDiagnostics.jsx";

export default function UserSidebarIntroSections({ ctx }) {
  const {
    MVP,
    PUBLIC_PREVIEW_MODE,
    Zone,
    activeBeginnerResultSlot,
    activeUserResultSlot,
    beginnerXFetchDebug,
    buttonText,
    getNextAction,
    guide,
    handleNextAction,
    help,
    mode,
    note,
    row,
    sourceDiagnostics,
    stopReasonLabel,
    targetZone,
    userModeResultSourceLabel,
    viewMode,
  } = ctx;

  return (
    <>

          <section className="row card sidebar-mode-panel user-guide-panel">
            <h3>使い方</h3>
            <ol>
              <li>テーマと自分の意見を入力</li>
              <li>評価軸をAIで設定、または手動設定</li>
              <li>{PUBLIC_PREVIEW_MODE ? "検索条件を確認して外部の声を取得" : "検索クエリを確認してXから取得"}</li>
              <li>必要なら評価軸を変更して再スコアリング</li>
              <li>{PUBLIC_PREVIEW_MODE ? "似た意見のまとまりとAI要約を確認" : "クラスタリング・AI要約を実行"}</li>
              <li>Zone⑪のフィードバックを見る</li>
            </ol>
            {PUBLIC_PREVIEW_MODE && <p className="public-sample-note">まずはサンプルで試すこともできます。</p>}
            <button
              type="button"
              className="next-action-box next-action-button"
              onClick={handleNextAction}
              disabled={getNextAction().disabled}
            >
              <span>次に押す：{getNextAction().buttonText}</span>
              <small>{getNextAction().targetZone} / {getNextAction().help}</small>
            </button>
          </section>

          {viewMode === "developer" && (
            <DeveloperSourceDiagnostics
              sourceDiagnostics={beginnerXFetchDebug}
              activeBeginnerResultSlot={activeBeginnerResultSlot}
              activeUserResultSlot={activeUserResultSlot}
              userModeResultSourceLabel={userModeResultSourceLabel}
              stopReasonLabel={stopReasonLabel}
            />
          )}

          {PUBLIC_PREVIEW_MODE && (
            <section className="row card public-about-panel">
              <details>
                <summary>このアプリについて</summary>
                <p>
                  3DEは、自分の意見と外部の声を比較し、近い声・違う声・足りない視点を見つけるための試作アプリです。現在はMVP段階であり、取得精度や分析精度は改善中です。
                </p>
              </details>
            </section>
          )}
    </>
  );
}
