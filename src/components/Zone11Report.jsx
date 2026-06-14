export default function Zone11Report({
  personaMode,
  viewMode,
  title,
  result,
  currentOpinionCount,
  userFeedback,
  stagedFetchState,
  stagedCurrentDataCount,
  stagedRemainingCount,
  stagedNextFetchCount,
  scoreConcentrationMessages,
  axisLabels,
  scoreDisplayMode,
  userReferenceGraphWarning,
  userReferenceGraphMessage,
  JP_UI_LABELS,
  personaAAnalysisMemoItems,
  safeRuntimeText,
  queryDiagnosisLabel,
  formatPercent,
  qualityLabel,
  formatScore,
  truncateText,
  scoreAxisHeader,
  getScoreForDisplay,
}) {
  return (
    <section className={`row row-5 card analysis zone-card zone-11 ${personaMode === "personaA" ? "persona-a-zone11" : ""}`}>
      <h2>Zone⑪ {title}</h2>
      <div className="feedback-panel">
        {/* Display policy: fetched/displayed posts can exist even when no posts remain
            as analysis targets. In that state, Zone 11 should explain the empty
            comparison rather than present a normal full analysis. */}
        {result.noiseProcessingResult.analysisTargetCount === 0 && currentOpinionCount > 0 && (
          <div className="feedback-section no-analysis-target-notice">
            <h3>今回は分析に使える意見が残りませんでした</h3>
            <p>Xから投稿は取得・表示されていますが、現在の条件では比較に使える外部意見が残っていません。</p>
            <p>境界またはノイズとして判定された投稿はZone⑫で確認できます。検索語・除外語・ハッシュタグを調整してください。</p>
          </div>
        )}
        {personaMode === "personaA" && viewMode === "user" ? (
          <div className="persona-a-ux-split">
            <section className="persona-a-empathy-panel persona-a-empathy-section" aria-label={JP_UI_LABELS.empathy}>
              <h3 className="persona-a-section-title">{JP_UI_LABELS.empathy}</h3>
              <div className="persona-feedback-sections">
                {userFeedback.personaSections.map(([sectionTitle, body], index) => (
                  <div key={`persona-a-empathy-${index}`} className="feedback-section persona-feedback-section persona-a-empathy-item">
                    <h4>{sectionTitle}</h4>
                    <p>{safeRuntimeText(body, viewMode)}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="persona-a-analysis-panel persona-a-analysis-section" aria-label={JP_UI_LABELS.analysisMemo}>
              <h3 className="persona-a-section-title">{JP_UI_LABELS.analysisMemo}</h3>
              <div className="persona-a-analysis-grid">
                {personaAAnalysisMemoItems().map(([label, value]) => (
                  <div key={`persona-a-memo-${label}`} className="persona-a-analysis-item">
                    <strong>{label}</strong>
                    <span>{safeRuntimeText(value, viewMode)}</span>
                  </div>
                ))}
              </div>
              {userReferenceGraphWarning && (
                <p className="persona-a-reference-note">{safeRuntimeText(userReferenceGraphMessage, viewMode)}</p>
              )}
              {scoreConcentrationMessages.length > 0 && (
                <ul className="persona-a-analysis-list">
                  {scoreConcentrationMessages.map((message, index) => (
                    <li key={`persona-a-score-note-${index}`}>{safeRuntimeText(message, viewMode)}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : personaMode !== "dev" && (
          <div className="persona-feedback-sections">
            {userFeedback.personaSections.map(([sectionTitle, body], index) => (
              <div key={`persona-feedback-${index}`} className="feedback-section persona-feedback-section">
                <h3>{index + 1}. {sectionTitle}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        )}
        {!(personaMode === "personaA" && viewMode === "user") && (
          <>
            <div className="feedback-section">
              <h3>1. 今回の意見空間の傾向</h3>
              <p>{userFeedback.overview}</p>
              <p>{userFeedback.noiseSummary}</p>
            </div>
            <div className="feedback-section">
              <h3>ボリュームの読み方</h3>
              <p>
                3DEでは、RTやコピー投稿による拡散量は、基本的に意見ボリュームとして採用していません。
                意図的な拡散やキャンペーン投稿に分析が振り回されないよう、グラフのボリュームは独立した類似意見数をもとにしています。
              </p>
              <p>
                拡散量は参考情報として保持しますが、意見の種類や市場傾向とは区別して扱います。このボリュームは世論調査ではありません。
                X上の投稿はRT、キャンペーン、ボット、界隈ノリの影響を受けるため、単純な投稿数を世論量として扱うことはできません。
              </p>
            </div>
            <div className="feedback-section">
              <h3>2. 目立った論点</h3>
              <p>
                近いクラスタと遠いクラスタを見ると、現在の意見群で強く出ている論点と、あなたの意見から離れた論点を確認できます。
              </p>
            </div>
            <div className="feedback-section">
              <h3>3. あなたの意見とのズレ</h3>
              <p>{userFeedback.userPosition}</p>
              <p>{userFeedback.gap}</p>
            </div>
            <div className="feedback-section">
              <h3>4. 評価軸と検索クエリの噛み合い</h3>
              <p>{userFeedback.queryAxisFit}</p>
              <p>
                取得診断は{queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}です。
                {stagedFetchState.diagnosis
                  ? ` 最初の${stagedFetchState.diagnosis.fetchedCount}件のうち、分析対象は${stagedFetchState.diagnosis.analysisCandidateCount}件、ノイズ率は${formatPercent(stagedFetchState.diagnosis.noiseRate)}でした。${(stagedFetchState.diagnosis.problemReasons || []).slice(0, 2).join(" ")}`
                  : " X取得後に、30件時点のクエリ品質がここに表示されます。"}
              </p>
              {stagedFetchState.aiQueryAdvice && (
                <p>
                  取得改善アドバイス: {stagedFetchState.aiQueryAdvice.diagnosisSummary}
                  {stagedFetchState.aiQueryAdvice.recommendedQuery
                    ? ` 推奨クエリは「${stagedFetchState.aiQueryAdvice.recommendedQuery}」です。`
                    : ""}
                </p>
              )}
              <p>
                現在{stagedCurrentDataCount}件を保持しています。残り{stagedRemainingCount}件まで追加取得でき、次回は
                {stagedNextFetchCount}件を取得します。改善クエリ追加は
                {stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}回実行済みです。
              </p>
              <p>
                取得品質は{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}です。
                {result.noiseProcessingResult.retrievalKpi.message}
                コスト効率は{formatScore(result.noiseProcessingResult.retrievalKpi.costEfficiencyScore)}、
                多様性は{formatScore(result.noiseProcessingResult.retrievalKpi.diversityScore)}です。
              </p>
              {(stagedFetchState.noiseBreakdown || []).length > 0 && (
                <ul>
                  {stagedFetchState.noiseBreakdown.slice(0, 3).map((item) => (
                    <li key={`feedback-noise-${item.category}`}>
                      {item.label}: {item.count}件 / {item.advice}
                    </li>
                  ))}
                </ul>
              )}
              {(stagedFetchState.queryTermDiagnosis || []).some((item) => item.status !== "ok") && (
                <ul>
                  {stagedFetchState.queryTermDiagnosis
                    .filter((item) => item.status !== "ok")
                    .slice(0, 3)
                    .map((item) => (
                      <li key={`feedback-query-term-${item.term}`}>
                        検索語「{item.term}」: {item.advice}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="feedback-section">
              <h3>5. スコア分布の注意</h3>
              {scoreConcentrationMessages.length === 0 ? (
                <p>現在のクラスタでは、X/Y/Zのスコアは大きく集中していません。絶対スコアでも意見空間の差を読み取りやすい状態です。</p>
              ) : (
                <ul>
                  {scoreConcentrationMessages.map((message, index) => (
                    <li key={`score-concentration-${index}`}>{message}</li>
                  ))}
                </ul>
              )}
              <p>
                グラフ表示は{result.resolvedScoreDisplayMode === "relative" ? "相対スコア" : "絶対スコア"}です。
                {result.resolvedScoreDisplayMode === "relative"
                  ? " 今回の意見群内での相対差を見えるようにしています。"
                  : " 元の評価軸に基づく素点を表示しています。"}
                採点は評価軸説明との一致度、テーマ関連度、本文の具体性を見て補正し、関連が弱い投稿は低めに扱います。
              </p>
            </div>
            <div className="feedback-grid">
              <div className="feedback-section">
                <h3>近いクラスタ</h3>
                {userFeedback.nearClusters.length === 0 ? (
                  <p>クラスタ生成後に表示されます。</p>
                ) : (
                  <ol>
                    {userFeedback.nearClusters.map((cluster) => (
                      <li key={`near-${cluster.label}`}>
                        {cluster.label} / 距離 {cluster.distance.toFixed(1)} / {truncateText(cluster.title, 70)}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="feedback-section">
                <h3>遠いクラスタ</h3>
                {userFeedback.farClusters.length === 0 ? (
                  <p>クラスタ生成後に表示されます。</p>
                ) : (
                  <ol>
                    {userFeedback.farClusters.map((cluster) => (
                      <li key={`far-${cluster.label}`}>
                        {cluster.label} / 距離 {cluster.distance.toFixed(1)} / {truncateText(cluster.title, 70)}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
            <div className="feedback-section">
              <h3>足りない視点</h3>
              <ul>
                {userFeedback.missingPerspectives.map((item, index) => (
                  <li key={`missing-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="feedback-section">
              <h3>6. 次に試すべきこと</h3>
              <ol>
                {userFeedback.nextQuestions.map((question, index) => (
                  <li key={`question-${index}`}>{question}</li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>

      <div className="score-cards">
        <div>
          <span>{scoreAxisHeader(axisLabels.x, scoreDisplayMode)}</span>
          <b>{getScoreForDisplay(result.user, "x", scoreDisplayMode)}</b>
          <small>外部平均 {getScoreForDisplay(result.avg, "x", scoreDisplayMode)}</small>
        </div>

        <div>
          <span>{scoreAxisHeader(axisLabels.y, scoreDisplayMode)}</span>
          <b>{getScoreForDisplay(result.user, "y", scoreDisplayMode)}</b>
          <small>外部平均 {getScoreForDisplay(result.avg, "y", scoreDisplayMode)}</small>
        </div>

        <div>
          <span>{scoreAxisHeader(axisLabels.z, scoreDisplayMode)}</span>
          <b>{getScoreForDisplay(result.user, "z", scoreDisplayMode)}</b>
          <small>外部平均 {getScoreForDisplay(result.avg, "z", scoreDisplayMode)}</small>
        </div>
      </div>
    </section>
  );
}
