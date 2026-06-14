export default function Zone12Diagnostics({
  sortKey,
  sortDirection,
  filters,
  activeFilter,
  onFilterChange,
  counts,
  zeroAnalysisSummary,
  highlightTerms,
  topNoiseReasons,
  filteredRows,
  getStatusForRow,
  getHashtagsForRow,
  getTermHits,
  excludeTerms,
  getOpinionRowClass,
  getScoreForDisplay,
  scoreDisplayMode,
  scoreAxisHeader,
  axisLabels,
  sortLabel,
  onSort,
  renderHighlightedText,
  labels,
  getReasonForRow,
  viewMode,
  noiseCategoryLabels,
  safeRuntimeText,
}) {
  return (
    <section className="row row-6 card zone-card zone-12">
      <div className="section-title-row">
        <h2>Zone⑫ 意見一覧</h2>

        <div className="sort-status">
          現在の並び：{sortKey.toUpperCase()}軸 {sortDirection === "desc" ? "降順" : "昇順"}
        </div>
      </div>

      <div className="zone12-filter-tabs" aria-label="Zone12表示フィルタ">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`zone12-filter-button ${activeFilter === filter.value ? "active" : ""}`}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
            <span>{counts[filter.value]}</span>
          </button>
        ))}
      </div>

      {/* Zone 12 is a diagnostic list: adopted rows are analysis targets,
          boundary/reference rows are review material, and noise rows explain why
          fetched posts did not affect the graph or analysis. */}
      {zeroAnalysisSummary && (
        <div className="zone12-zero-summary">
          <strong>分析対象が0件です。</strong>
          <span>
            X APIから投稿は返っていますが、現在の条件では比較に使える外部意見が残りませんでした。境界・参考、またはノイズとして判定された投稿はこの一覧で確認できます。取得本文数:
            {zeroAnalysisSummary.fetchedCount}件 / ノイズ除外:
            {zeroAnalysisSummary.noiseRemovedCount}件
          </span>
          <span>
            主な理由: {zeroAnalysisSummary.reasons.length ? zeroAnalysisSummary.reasons.join(" / ") : "未分類"}
          </span>
        </div>
      )}

      <div className="zone12-inspection-summary">
        <div>
          <strong>黄色マーカー対象</strong>
          <span>{highlightTerms.length ? highlightTerms.join(" / ") : "なし"}</span>
        </div>
        <div>
          <strong>表示</strong>
          <span>ハッシュタグ表示 ON / ノイズ背景 ON</span>
        </div>
        <div>
          <strong>主なノイズ理由</strong>
          <span>{topNoiseReasons.length ? topNoiseReasons.join(" / ") : "なし"}</span>
        </div>
      </div>

      <table className="zone12-opinion-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>元番号</th>
            <th>判定</th>
            <th>分類</th>
            <th>
              <button className="sort-button" onClick={() => onSort("x")}>
                {scoreAxisHeader(axisLabels.x, scoreDisplayMode)} {sortLabel("x")}
              </button>
            </th>
            <th>
              <button className="sort-button" onClick={() => onSort("y")}>
                {scoreAxisHeader(axisLabels.y, scoreDisplayMode)} {sortLabel("y")}
              </button>
            </th>
            <th>
              <button className="sort-button" onClick={() => onSort("z")}>
                {scoreAxisHeader(axisLabels.z, scoreDisplayMode)} {sortLabel("z")}
              </button>
            </th>
            <th>意見</th>
          </tr>
        </thead>

        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={8} className="zone12-empty-cell">表示対象の意見はありません。</td>
            </tr>
          ) : (
            filteredRows.map((row, index) => {
              const status = getStatusForRow(row);
              const hashtags = getHashtagsForRow(row);
              const matchedTerms = getTermHits(row, highlightTerms);
              const excludeHits = getTermHits(row, excludeTerms);
              const rowClass = [
                getOpinionRowClass(row),
                `opinion-row-${status.key}`,
                status.key === "noise" && /広告|PR|宣伝|promotion|ad/i.test(`${row.noiseCategory || ""} ${row.noiseReason || ""}`)
                  ? "opinion-row-ad"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr key={`${status.key}-${row.originalNo || row.no || index}-${index}`} className={rowClass}>
                  <td>{index + 1}</td>
                  <td>{row.originalNo || row.no || "-"}</td>
                  <td>
                    <span className={`zone12-status-badge ${status.key}`}>{status.label}</span>
                  </td>
                  <td>{row.type}</td>
                  <td>{getScoreForDisplay(row, "x", scoreDisplayMode)}</td>
                  <td>{getScoreForDisplay(row, "y", scoreDisplayMode)}</td>
                  <td>{getScoreForDisplay(row, "z", scoreDisplayMode)}</td>
                  <td className="opinion zone12-opinion-cell">
                    <div className="zone12-opinion-text">{renderHighlightedText(row.opinion)}</div>
                    <div className="zone12-row-reason">{labels.zone12Reason}: {getReasonForRow(row)}</div>
                    <div className="zone12-chip-row">
                      {hashtags.length > 0 ? (
                        hashtags.map((tag) => (
                          <span key={tag} className="zone12-hashtag-chip">{tag}</span>
                        ))
                      ) : (
                        <span className="zone12-muted-chip">{labels.zone12NoHashtag}</span>
                      )}
                      {matchedTerms.map((term) => (
                        <span key={`hit-${term}`} className="zone12-term-chip">{labels.zone12MatchedTerm}: {term}</span>
                      ))}
                      {excludeHits.map((term) => (
                        <span key={`exclude-${term}`} className="zone12-exclude-chip">{labels.zone12ExcludeHit}: {term}</span>
                      ))}
                    </div>
                    {viewMode === "developer" && (
                      <details className="zone12-developer-details developer-panel">
                        <summary>{labels.zone12DeveloperDetails}</summary>
                        <div><strong>relevance score</strong><span>{row.relevanceScore ?? "-"}</span></div>
                        <div><strong>duplicateCount</strong><span>{row.duplicateCount ?? 1}</span></div>
                        <div><strong>strict relevance</strong><span>{row.personaARelevanceCategory || row.personaAExclusionReason || "-"}</span></div>
                        <div><strong>noise category</strong><span>{row.noiseCategory ? (noiseCategoryLabels[row.noiseCategory] || row.noiseCategory) : "-"}</span></div>
                        <div><strong>matched include terms</strong><span>{matchedTerms.length ? matchedTerms.join(" / ") : "なし"}</span></div>
                        <div><strong>matched hashtags</strong><span>{hashtags.length ? hashtags.join(" / ") : "なし"}</span></div>
                        <div><strong>matched exclude terms</strong><span>{excludeHits.length ? excludeHits.join(" / ") : "なし"}</span></div>
                        <div><strong>normalized text</strong><span>{safeRuntimeText(row.normalizedText || row.processedText || row.opinion || "", viewMode)}</span></div>
                        <div><strong>raw text</strong><span>{safeRuntimeText(row.rawNormalizedText || row.rawText || row.opinion || "", viewMode)}</span></div>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
