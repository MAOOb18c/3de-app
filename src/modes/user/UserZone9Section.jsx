export default function UserZone9Section({ ctx }) {
  const {
    axisLabels,
    clusterExpansionKey,
    clusterMethod,
    clusterRowDomId,
    clusterSummaries,
    clusterSummaryErrorById,
    clusterSummaryKey,
    clusterVolumeFromRow,
    expandedClusterIds,
    getScoreForDisplay,
    getScoreTripletForDisplay,
    handleRunClusterSummary,
    isClusterSummaryLoadingById,
    renderScoreReasonGrid,
    result,
    scoreAxisHeader,
    scoreBasisLabel,
    scoreDisplayMode,
    selectedClusterId,
    semanticClusterRows,
    toggleClusterMembers,
    truncateText,
    viewMode,
  } = ctx;

  return (
    <>
      {/* Zone⑨ クラスタ一覧 */}
      <section className="row card cluster-table-card zone-card zone-9">
        <div className="section-title-row">
          <h2>Zone⑨ クラスタ一覧</h2>
        </div>

        {clusterMethod === "semantic" && semanticClusterRows.length === 0 && (
          <div className="cluster-note">意味クラスタは未実行です。現在は文字類似クラスタを表示しています。</div>
        )}

        {result.clusterTableRows.length === 0 ? (
          <div className="cluster-note">クラスタはありません</div>
        ) : viewMode === "user" ? (
          <div className="user-cluster-card-grid">
            {result.clusterTableRows.map((cluster) => {
              const summary = clusterSummaries[clusterSummaryKey(cluster)];
              const volume = clusterVolumeFromRow(cluster);
              const expansionKey = clusterExpansionKey(cluster);
              const isExpanded = Boolean(expandedClusterIds[expansionKey]);
              const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];

              return (
                <article key={`${cluster.label}-user-card`} className="user-cluster-card">
                  <div className="user-cluster-card-header">
                    <strong>{cluster.label}</strong>
                    <span>独立意見数 {volume.independent}</span>
                  </div>
                  <h3>{summary?.title || truncateText(cluster.opinion, 54)}</h3>
                  <p>{summary?.cleanOpinion || summary?.summary || truncateText(cluster.opinion, 140)}</p>
                  <div className="user-cluster-score-row">
                    <span>X {getScoreForDisplay(cluster, "x", scoreDisplayMode)}</span>
                    <span>Y {getScoreForDisplay(cluster, "y", scoreDisplayMode)}</span>
                    <span>Z {getScoreForDisplay(cluster, "z", scoreDisplayMode)}</span>
                  </div>
                  {renderScoreReasonGrid(cluster)}
                  <button
                    type="button"
                    className="option-button cluster-expand-button"
                    onClick={() => toggleClusterMembers(cluster)}
                  >
                    {isExpanded ? "元意見を閉じる" : "元意見を見る"}
                  </button>
                  {isExpanded && (
                    <ol className="cluster-member-list user-cluster-members">
                      {memberRows.slice(0, 6).map((member, index) => (
                        <li key={`${cluster.label}-user-member-${member.id}-${index}`} className="cluster-member-item">
                          <div className="cluster-member-text">{member.text}</div>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <table className="cluster-table">
            <thead>
              <tr>
                <th>クラスタID</th>
                <th>独立意見数</th>
                <th>拡散参考数</th>
                <th>グラフ反映</th>
                <th>表示内容</th>
                <th>元投稿件数</th>
                <th>重複件数</th>
                <th>{scoreAxisHeader(axisLabels.x, scoreDisplayMode)}</th>
                <th>{scoreAxisHeader(axisLabels.y, scoreDisplayMode)}</th>
                <th>{scoreAxisHeader(axisLabels.z, scoreDisplayMode)}</th>
                <th>スコア根拠</th>
                <th>元意見</th>
                <th>AI整理</th>
              </tr>
            </thead>
            <tbody>
              {result.clusterTableRows.map((cluster) => {
                const expansionKey = clusterExpansionKey(cluster);
                const summaryKey = clusterSummaryKey(cluster);
                const isExpanded = Boolean(expandedClusterIds[expansionKey]);
                const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];
                const aiSummary = clusterSummaries[summaryKey];
                const isSummaryLoading = Boolean(isClusterSummaryLoadingById[summaryKey]);
                const summaryError = clusterSummaryErrorById[summaryKey];
                const hasDetailPanel = isExpanded || aiSummary || isSummaryLoading || summaryError;
                const volume = clusterVolumeFromRow(cluster);
                const isSelectedCluster = selectedClusterId === cluster.label;

                return [
                  <tr
                    key={`${cluster.label}-row`}
                    id={clusterRowDomId(cluster.label)}
                    className={isSelectedCluster ? "cluster-row selected-cluster-row" : "cluster-row"}
                  >
                    <td>{cluster.label}</td>
                    <td>{volume.independent}</td>
                    <td>{volume.spread}</td>
                    <td>{volume.graph}</td>
                    <td className="cluster-representative-text cluster-summary-cell" title={cluster.opinion}>
                      {aiSummary ? (
                        <>
                          <div className="cluster-summary-title">クラスタ名：{aiSummary.title}</div>
                          <div className="cluster-summary-clean-opinion">整文済み意見：{aiSummary.cleanOpinion}</div>
                          <div className="cluster-summary-short">要約：{aiSummary.summary}</div>
                        </>
                      ) : (
                        <>
                          <div className="cluster-summary-title">未要約</div>
                          <div className="cluster-summary-short">
                            AI要約を実行すると、グラフ上の表示も読みやすくなります。
                          </div>
                          <div className="cluster-summary-clean-opinion">
                            代表本文：{truncateText(cluster.opinion)}
                          </div>
                        </>
                      )}
                    </td>
                    <td>{cluster.originalCount}</td>
                    <td>{cluster.duplicateCount}</td>
                    <td>{getScoreForDisplay(cluster, "x", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(cluster, "y", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(cluster, "z", scoreDisplayMode)}</td>
                    <td>
                      <div className="score-basis-cell">
                        <div>表示X/Y/Z：{getScoreTripletForDisplay(cluster, scoreDisplayMode)}</div>
                        <div>独立意見数：{volume.independent}</div>
                        <div>拡散参考数：{volume.spread}</div>
                        <div>グラフ反映：{volume.graph}</div>
                        {volume.spread > volume.independent && (
                          <div className="spread-volume-warning">
                            注意：拡散参考数は大きいですが、グラフのボリュームには加算していません。同一文面や類似テンプレートの拡散が含まれる可能性があります。
                          </div>
                        )}
                        <div>絶対：{cluster.absoluteScore?.x ?? cluster.x} / {cluster.absoluteScore?.y ?? cluster.y} / {cluster.absoluteScore?.z ?? cluster.z}</div>
                        <div>相対：{cluster.relativeScore?.x ?? cluster.x} / {cluster.relativeScore?.y ?? cluster.y} / {cluster.relativeScore?.z ?? cluster.z}</div>
                        <div>スコア根拠：{scoreBasisLabel(cluster.scoreBasis)}</div>
                        {renderScoreReasonGrid(cluster)}
                        {cluster.relevanceScore !== null && cluster.relevanceScore !== undefined && (
                          <div>関連度：{cluster.relevanceScore} / 信頼度：{cluster.scoreConfidence ?? "-"}</div>
                        )}
                        {Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length > 0 && (
                          <div>警告：{cluster.scoreWarnings.join(" / ")}</div>
                        )}
                        {result.scoreConcentrationDetected && (
                          <div>分布注意：集中軸では絶対値だけでなく、今回の意見群内での相対位置も見てください。</div>
                        )}
                      </div>
                    </td>
                    <td className="cluster-table-actions">
                      <button
                        type="button"
                        className="option-button cluster-expand-button"
                        onClick={() => toggleClusterMembers(cluster)}
                      >
                        {isExpanded ? "元意見を閉じる" : "元意見を表示"}
                      </button>
                    </td>
                    <td className="cluster-table-actions">
                      <button
                        type="button"
                        className="action-button action-button-secondary cluster-ai-summary-button"
                        onClick={() => handleRunClusterSummary(cluster)}
                        disabled={isSummaryLoading}
                      >
                        {isSummaryLoading ? "要約中..." : aiSummary ? "再要約" : "AI要約"}
                      </button>
                    </td>
                  </tr>,
                  hasDetailPanel && (
                    <tr key={`${cluster.label}-detail`} className={isSelectedCluster ? "selected-cluster-detail" : ""}>
                      <td colSpan="12">
                        <div className="cluster-member-panel">
                          {isSummaryLoading && (
                            <div className="cluster-ai-summary-loading">AI要約を実行中...</div>
                          )}
                          {summaryError && (
                            <div className="cluster-ai-summary-error">{summaryError}</div>
                          )}
                          {aiSummary && (
                            <div className="cluster-ai-summary-panel">
                              <div className="cluster-ai-summary-title">AI整理結果</div>
                              <div className="cluster-ai-summary-section">
                                <strong>クラスタ名：</strong>
                                <span>{aiSummary.title}</span>
                              </div>
                              <div className="cluster-ai-summary-section">
                                <strong>要約：</strong>
                                <p>{aiSummary.summary}</p>
                              </div>
                              <div className="cluster-ai-summary-section">
                                <strong>整文済み意見：</strong>
                                <p>{aiSummary.cleanOpinion}</p>
                              </div>
                              {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
                                <div className="cluster-ai-summary-section">
                                  <strong>主要論点：</strong>
                                  <ol className="cluster-ai-summary-keypoints">
                                    {aiSummary.keyPoints.map((point, index) => (
                                      <li key={`${summaryKey}-point-${index}`}>{point}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              {Array.isArray(aiSummary.cautions) && aiSummary.cautions.length > 0 && (
                                <div className="cluster-ai-summary-section">
                                  <strong>注意点：</strong>
                                  <ul className="cluster-ai-summary-keypoints">
                                    {aiSummary.cautions.map((caution, index) => (
                                      <li key={`${summaryKey}-caution-${index}`}>{caution}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="cluster-ai-summary-section">
                                <strong>スコアリング：</strong>
                                <ul className="cluster-ai-summary-keypoints">
                                  <li>対象文：{aiSummary.scoreBasis || cluster.scoreBasis}</li>
                                  <li>独立意見数：{clusterVolumeFromRow(cluster).independent}</li>
                                  <li>拡散参考数：{clusterVolumeFromRow(cluster).spread}</li>
                                  <li>グラフ反映：{clusterVolumeFromRow(cluster).graph}</li>
                                  <li>X/Y/Z：{getScoreTripletForDisplay(cluster, scoreDisplayMode)}</li>
                                  <li>
                                    元スコア：{cluster.originalScore?.x ?? "-"} / {cluster.originalScore?.y ?? "-"} /{" "}
                                    {cluster.originalScore?.z ?? "-"}
                                  </li>
                                  <li>関連度：{cluster.relevanceScore ?? "-"} / 信頼度：{cluster.scoreConfidence ?? "-"}</li>
                                  <li>
                                    警告：
                                    {Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length > 0
                                      ? cluster.scoreWarnings.join(" / ")
                                      : "なし"}
                                  </li>
                                  <li>スコア根拠：{scoreBasisLabel(cluster.scoreBasis)}</li>
                                </ul>
                                {renderScoreReasonGrid(cluster)}
                              </div>
                              <details className="cluster-ai-summary-section cluster-summary-source">
                                <summary>要約元の意見</summary>
                                <ol className="cluster-member-list">
                                  {(aiSummary.sourceItems || memberRows.slice(0, 10)).map((item, index) => (
                                    <li key={`${summaryKey}-source-${item.id}-${index}`} className="cluster-member-item">
                                      <div className="cluster-member-meta">
                                        id: {item.id || "-"} / duplicateCount: {item.duplicateCount || 1}
                                      </div>
                                      <div className="cluster-member-text">{item.text}</div>
                                    </li>
                                  ))}
                                </ol>
                              </details>
                            </div>
                          )}
                          {isExpanded && (
                            <>
                          <div className="cluster-member-title">
                            {cluster.label} の元意見 {memberRows.length}件
                          </div>
                          {memberRows.length === 0 ? (
                            <div className="cluster-note">元意見はありません</div>
                          ) : (
                            <ol className="cluster-member-list">
                              {memberRows.map((member, index) => (
                                <li key={`${cluster.label}-${member.id}-${index}`} className="cluster-member-item">
                                  <div className="cluster-member-meta">
                                    No.{member.no || index + 1} / id: {member.id || "-"} / duplicateCount:{" "}
                                    {member.duplicateCount || 1}
                                  </div>
                                  <div className="cluster-member-text">
                                    {member.text}
                                  </div>
                                  {member.originalText && member.originalText !== member.text && (
                                    <details className="cluster-member-original">
                                      <summary>元本文を表示</summary>
                                      <div>{member.originalText}</div>
                                    </details>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
