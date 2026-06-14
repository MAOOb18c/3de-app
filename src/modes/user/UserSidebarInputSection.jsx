export default function UserSidebarInputSection({ ctx }) {
  const {
    JP_UI_LABELS,
    USER_INPUT_SAMPLE_KEY,
    Zone,
    applySelectedDemoSample,
    autoResizeTextarea,
    currentInputSourceLabel,
    event,
    handleThemeChange,
    inputSource,
    loadSample,
    nextOpinion,
    opinion,
    resetUserInputArea,
    row,
    sampleDisplayLabel,
    sampleKey,
    sampleOpinionTrial,
    samples,
    selectedDemoSampleKey,
    setHasScoredWithCurrentAxis,
    setSampleKey,
    setSelectedDemoSampleKey,
    setUserOpinion,
    silent,
    syncUserInputSessionQuery,
    target,
    theme,
    userOpinion,
    userOpinionTextareaRef,
    viewMode,
  } = ctx;

  return (
    <>
<section className="row row-2 card zone-card zone-1 user-input-panel">
            <div className="zone-heading">Zone① テーマ・自分の意見</div>
            {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 2 / Zone①</div>}
            <p className="zone-lead">まずここから。調べたいテーマと、自分の意見を入力します。</p>
            <div className="input-source-pill">{JP_UI_LABELS.inputSource}: {currentInputSourceLabel()}</div>
            {viewMode === "developer" && (
              <div className="developer-panel dev-demo-panel-inner zone1-sample-panel">
                <div className="developer-panel-title dev-demo-label">開発・デモ用サンプル</div>
                <p>
                  サンプルを選んでも即時反映せず、下の実行ボタンでテーマ・自分の意見・検索条件をまとめて反映します。
                </p>
                <div className="demo-sample-buttons">
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "housing" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("housing")}
                  >
                    <span className="sample-number">1.</span>住宅
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "iran" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("iran")}
                  >
                    <span className="sample-number">2.</span>イラン情勢
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "coding" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("coding")}
                  >
                    <span className="sample-number">3.</span>コーディング教室
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "religion" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("religion")}
                  >
                    <span className="sample-number">4.</span>宗教
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "democracy" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("democracy")}
                  >
                    <span className="sample-number">5.</span>民主主義
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "romance" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("romance")}
                  >
                    <span className="sample-number">6.</span>恋愛
                  </button>
                </div>
                <div className="demo-sample-preview">
                  <strong>選択中：</strong>{sampleDisplayLabel(selectedDemoSampleKey)}
                </div>
                <button type="button" className="action-button action-button-primary" onClick={applySelectedDemoSample}>
                  このサンプルを反映
                </button>
              </div>
            )}
            <div className="field">
              <h3>テーマ</h3>
              <input value={theme} onChange={(event) => handleThemeChange(event.target.value)} />
            </div>

            <div className="field">
              <h3>自分の意見</h3>
              <textarea
                ref={userOpinionTextareaRef}
                className="user-opinion-textarea"
            value={userOpinion}
            onChange={(event) => {
              const nextOpinion = event.target.value;
              setUserOpinion(nextOpinion);
              setSampleKey(USER_INPUT_SAMPLE_KEY);
              syncUserInputSessionQuery(theme, nextOpinion, { silent: true });
              setHasScoredWithCurrentAxis(false);
              autoResizeTextarea(event.target);
            }}
          />
        </div>

        <button type="button" className="action-button action-button-secondary" onClick={resetUserInputArea}>
          入力欄をリセット
        </button>
        <button type="button" className="action-button action-button-secondary" onClick={() => loadSample(samples[sampleKey] ? sampleKey : "housing")}>
          {JP_UI_LABELS.sampleOpinionTrial}
        </button>
      </section>
    </>
  );
}
