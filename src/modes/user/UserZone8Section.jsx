export default function UserZone8Section({ ctx }) {
  const {
    PUBLIC_PREVIEW_MODE,
    JP_UI_LABELS,
    NOISE_CATEGORY_LABELS,
    clusterMethod,
    currentClusterDisplayLabel,
    formatPercent,
    formatScore,
    graphMode,
    qualityLabel,
    queryDiagnosisLabel,
    result,
    semanticClusterStateLabel,
    semanticThreshold,
    setGraphMode,
    stagedFetchState,
    truncateText,
    userReferenceGraphMessage,
    userReferenceGraphWarning,
    viewMode,
  } = ctx;

  return (
    <>
      {/* Zone⑧ クラスタ化比較 */}
      <section className="row card noise-summary-card zone-card zone-8">
        <div className="section-title-row">
          <h2>Zone⑧ クラスタ化比較</h2>
        </div>

        {viewMode === "user" ? (
          <div className="user-flow-summary">
            <h3>分析の流れ</h3>
            <div className="user-flow-steps">
              <span>取得 {result.noiseProcessingResult.rawCount}件</span>
              <b>→</b>
              <span>分析に使えた意見 {result.noiseProcessingResult.analysisTargetCount}件</span>
              <b>→</b>
              <span>似た意見のまとまり {result.clusterTableRows.length}件</span>
            </div>
            <p>{result.noiseProcessingResult.retrievalKpi.message}</p>
            {userReferenceGraphWarning && (
              <div className="reference-warning">
                <strong>参考表示</strong>
                <span>{userReferenceGraphMessage}</span>
                {!PUBLIC_PREVIEW_MODE && (
                  <span className="mode-assist-note">詳細は左上の開発者modeで確認できます。</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
        <div className="developer-panel graph-mode-tabs">
          <button className={graphMode === "raw" ? "active" : ""} onClick={() => setGraphMode("raw")}>
            処理前
          </button>
          <button
            className={graphMode === "processed" ? "active" : ""}
            onClick={() => setGraphMode("processed")}
          >
            処理後
          </button>
          <button className={graphMode === "compare" ? "active" : ""} onClick={() => setGraphMode("compare")}>
            前後比較
          </button>
        </div>

        <div className="developer-panel status-panel">
          <div><strong>現在採用中のクラスタ方式：</strong>{clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}</div>
          <div><strong>現在表示中：</strong>{currentClusterDisplayLabel()}</div>
          <div><strong>Zone⑨クラスタ一覧・Zone⑩グラフに反映中：</strong>{currentClusterDisplayLabel()}</div>
          <div><strong>文字類似しきい値：</strong>{result.noiseProcessingResult.threshold.toFixed(2)}</div>
          <div><strong>意味類似しきい値：</strong>{semanticThreshold.toFixed(2)}</div>
          <div><strong>意味クラスタ状態：</strong>{semanticClusterStateLabel()}</div>
          <div><strong>取得診断：</strong>{queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / {stagedFetchState.message}</div>
        </div>

        <div className={`developer-panel retrieval-kpi-panel ${result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality}`}>
          <div className="retrieval-kpi-header">
            <strong>取得品質KPI：{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}</strong>
            <span>{result.noiseProcessingResult.retrievalKpi.message}</span>
          </div>
          <div className="retrieval-kpi-grid">
            <div>
              <span>分析対象率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.analysisCandidateRate)}</b>
            </div>
            <div>
              <span>ノイズ率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.noiseRate)}</b>
            </div>
            <div>
              <span>重複/RT率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.duplicateLikeRate)}</b>
            </div>
            <div>
              <span>クラスタ数判定</span>
              <b>{result.noiseProcessingResult.retrievalKpi.clusterJudgement.label}</b>
            </div>
            <div>
              <span>多様性</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.diversityScore)}</b>
            </div>
            <div>
              <span>読みやすさ</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.readLoadScore)}</b>
            </div>
            <div>
              <span>コスト効率</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.costEfficiencyScore)}</b>
            </div>
            <div>
              <span>境界意見</span>
              <b>{result.noiseProcessingResult.borderlineUsefulCount || 0}</b>
            </div>
          </div>
          <p>{result.noiseProcessingResult.retrievalKpi.clusterJudgement.message}</p>
        </div>

        <div className="developer-panel noise-filter-panel">
          <div className="noise-filter-header">
            <strong>ノイズ除去結果</strong>
            <span className={result.noiseProcessingResult.noiseFilterEnabled ? "status-pill success" : "status-pill muted"}>
              {result.noiseProcessingResult.noiseFilterEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <div className="noise-filter-summary">
            除外 {result.noiseProcessingResult.noiseExcludedCount}件 / 分析対象 {result.noiseProcessingResult.analysisTargetCount}件 / 理由 {result.noiseProcessingResult.noiseReasonSummary}
          </div>
          <div className="noise-reason-list">
            {Object.entries(result.noiseProcessingResult.noiseReasonCounts || {}).length === 0 ? (
              <span>主な除外理由はありません。</span>
            ) : (
              Object.entries(result.noiseProcessingResult.noiseReasonCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <span key={category}>
                    {NOISE_CATEGORY_LABELS[category] || category}: {count}
                  </span>
                ))
            )}
          </div>
          {viewMode === "developer" && result.noiseProcessingResult.noiseExcludedRows.length > 0 && (
            <details className="developer-panel noise-excluded-details">
              <summary>{JP_UI_LABELS.excludedPosts}（{result.noiseProcessingResult.noiseExcludedRows.length}件）</summary>
              <ol className="noise-excluded-list">
                {result.noiseProcessingResult.noiseExcludedRows.slice(0, 30).map((row) => (
                  <li key={`noise-${row.originalNo}`}>
                    <strong>No.{row.originalNo} / {NOISE_CATEGORY_LABELS[row.noiseCategory] || row.noiseCategory}</strong>
                    <span>{row.noiseReason}</span>
                    <p>{truncateText(row.normalizedText, 180)}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {viewMode === "developer" && result.noiseProcessingResult.borderlineUsefulRows.length > 0 && (
            <details className="developer-panel noise-excluded-details">
              <summary>{JP_UI_LABELS.borderlineOpinions}（{result.noiseProcessingResult.borderlineUsefulRows.length}件）</summary>
              <ol className="noise-excluded-list">
                {result.noiseProcessingResult.borderlineUsefulRows.slice(0, 20).map((row) => (
                  <li key={`borderline-${row.originalNo}`}>
                    <strong>No.{row.originalNo} / 境界意見</strong>
                    <span>{row.borderlineReason}</span>
                    <p>{truncateText(row.normalizedText, 180)}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>

        <div className="cluster-comparison-table-wrap">
          <table className="cluster-comparison-table">
            <thead>
              <tr>
                <th>方式</th>
                <th>入力件数</th>
                <th>クラスタ数</th>
                <th>圧縮率</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>文字類似</td>
                <td>{result.noiseProcessingResult.candidateCount}</td>
                <td>
                  {clusterMethod === "text"
                    ? result.noiseProcessingResult.clusterCount
                    : result.textClusterRows.length}
                </td>
                <td>
                  {formatPercent(
                    result.noiseProcessingResult.candidateCount > 0
                      ? 1 -
                        (clusterMethod === "text"
                          ? result.noiseProcessingResult.clusterCount
                          : result.textClusterRows.length) /
                          result.noiseProcessingResult.candidateCount
                      : 0
                  )}
                </td>
                <td>{clusterMethod === "text" ? "現在表示中" : "比較用に再計算済み"}</td>
              </tr>
              <tr>
                <td>意味類似 OpenAI</td>
                <td>{result.noiseProcessingResult.semanticInputCount || "未実行"}</td>
                <td>
                  {result.noiseProcessingResult.semanticClusterCount === null
                    ? "未実行"
                    : result.noiseProcessingResult.semanticClusterCount}
                </td>
                <td>
                  {result.noiseProcessingResult.semanticClusterCompressionRate === null
                    ? "未実行"
                    : formatPercent(result.noiseProcessingResult.semanticClusterCompressionRate)}
                </td>
                <td>{semanticClusterStateLabel()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="noise-summary-grid">
          <div className="noise-metric">
            <span>クラスタ方式</span>
            <b>{clusterMethod === "semantic" ? "意味" : "文字"}</b>
          </div>
          <div className="noise-metric">
            <span>現在のしきい値</span>
            <b>{result.noiseProcessingResult.threshold.toFixed(2)}</b>
          </div>
          <div className="noise-metric">
            <span>処理前意見数</span>
            <b>{result.noiseProcessingResult.rawCount}</b>
          </div>
          <div className="noise-metric">
            <span>正規化後ユニーク本文数</span>
            <b>{result.noiseProcessingResult.uniqueNormalizedCount}</b>
          </div>
          <div className="noise-metric">
            <span>完全重複数</span>
            <b>{result.noiseProcessingResult.duplicateCount}</b>
          </div>
          <div className="noise-metric">
            <span>独立意見数</span>
            <b>{result.noiseProcessingResult.independentOpinionCount}</b>
          </div>
          <div className="noise-metric">
            <span>独立意見率</span>
            <b>{formatPercent(result.noiseProcessingResult.independentOpinionRate || 0)}</b>
          </div>
          <div className="noise-metric">
            <span>拡散参考数</span>
            <b>{result.noiseProcessingResult.spreadReferenceCount}</b>
          </div>
          <div className="noise-metric">
            <span>拡散支配率</span>
            <b>{formatPercent(result.noiseProcessingResult.spreadDominanceRate || 0)}</b>
          </div>
          <div className="noise-metric">
            <span>RT風投稿数</span>
            <b>{result.noiseProcessingResult.retweetLikeCount}</b>
          </div>
          <div className="noise-metric">
            <span>RT本文抽出成功数</span>
            <b>{result.noiseProcessingResult.rtExtractSuccessCount}</b>
          </div>
          <div className="noise-metric">
            <span>URL付き投稿数</span>
            <b>{result.noiseProcessingResult.urlCount}</b>
          </div>
          <div className="noise-metric">
            <span>URL除去後本文あり数</span>
            <b>{result.noiseProcessingResult.urlTextRemainingCount}</b>
          </div>
          <div className="noise-metric">
            <span>短すぎる投稿数</span>
            <b>{result.noiseProcessingResult.tooShortCount}</b>
          </div>
          <div className="noise-metric">
            <span>分析対象候補数</span>
            <b>{result.noiseProcessingResult.candidateCount}</b>
          </div>
          <div className="noise-metric">
            <span>処理後クラスタ数</span>
            <b>{result.noiseProcessingResult.clusterCount}</b>
          </div>
          <div className="noise-metric">
            <span>ノイズ除外ユニーク数</span>
            <b>{result.noiseProcessingResult.noiseExcludedUniqueCount}</b>
          </div>
          <div className="noise-metric">
            <span>分析対象率</span>
            <b>{formatPercent(result.noiseProcessingResult.analysisTargetRate)}</b>
          </div>
          <div className="noise-metric">
            <span>クラスタ圧縮率</span>
            <b>{formatPercent(result.noiseProcessingResult.clusterCompressionRate)}</b>
          </div>
          <div className="noise-metric">
            <span>意味類似しきい値</span>
            <b>{semanticThreshold.toFixed(2)}</b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ実行件数</span>
            <b>{result.noiseProcessingResult.semanticInputCount || "未実行"}</b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ数</span>
            <b>
              {result.noiseProcessingResult.semanticClusterCount === null
                ? "未実行"
                : result.noiseProcessingResult.semanticClusterCount}
            </b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ圧縮率</span>
            <b>
              {result.noiseProcessingResult.semanticClusterCompressionRate === null
                ? "未実行"
                : formatPercent(result.noiseProcessingResult.semanticClusterCompressionRate)}
            </b>
          </div>
        </div>

        <p className="cluster-note">
          処理後は、RT接頭辞やURLを取り除いて本文を抽出し、完全重複と短すぎる投稿を整理したうえで、本文類似度により代表クラスタ点として表示しています。
        </p>
          </>
        )}

      </section>
    </>
  );
}
