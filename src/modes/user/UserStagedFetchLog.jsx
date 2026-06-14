export default function UserStagedFetchLog({
  formatPercent,
  QUERY_LABELS_JA,
  queryBuildStatusLabel,
  queryDiagnosisLabel,
  safeRuntimeText,
  stagedFetchState,
  stopReasonLabel,
  viewMode,
  xMaxResults,
}) {
  if (viewMode !== "developer" || !stagedFetchState.stageLogs.length) return null;

  return (
    <div className="developer-panel staged-fetch-log">
      <strong>段階取得ログ</strong>
      <ol>
        {stagedFetchState.stageLogs.map((stage) => (
          <li key={`${stage.stageNo}-${stage.createdAt}`}>
            <div>
              {stage.stageNo}回目：{stage.actionLabel} / 要求{stage.requestedFetchCount ?? stage.currentBatchCount}件 /
              API返却{stage.apiReturnedCount ?? stage.currentBatchCount}件 / 新規{stage.newUniqueCount ?? stage.currentBatchCount}件 /
              重複{stage.duplicateSkippedCount ?? 0}件 / ノイズ除外{stage.noiseRemovedCount ?? 0}件 /
              停止理由{stage.stopReason ? stopReasonLabel(stage.stopReason) : "なし"} / 現在{stage.currentDataCount ?? stage.accumulatedCount}件 /
              残り{stage.remainingCount ?? Math.max(0, (stage.targetCount || Number(xMaxResults) || 0) - (stage.accumulatedCount || 0))}件 /
              正規化{stage.normalizedCount}件 / 分析対象{stage.analysisCandidateCount}件 /
              ノイズ率{formatPercent(stage.noiseRate)} / {stage.queryKind || "通常語"} / {queryDiagnosisLabel(stage.diagnosisStatus)}
            </div>
            {(stage.newUniqueCount ?? stage.currentBatchCount) <= 1 && (stage.requestedFetchCount ?? 0) > 1 && (
              <small>
                {stage.requestedFetchCount}件を要求しましたが、新規追加は{stage.newUniqueCount ?? 0}件でした。
                {stage.apiReturnedCount > 0
                  ? "X APIは投稿を返しています。既存データとの重複、またはノイズ除去で追加されなかった可能性があります。"
                  : "X APIから投稿が返らなかった可能性があります。検索条件を広げてください。"}
              </small>
            )}
            <small>{safeRuntimeText(stage.query, viewMode)}</small>
            {(stage.rawQuery ||
              stage.safeQuery ||
              stage.fallbackQuery ||
              stage.finalQueryForXApi ||
              stage.apiErrorMessage ||
              stage.queryBuildWarnings?.length > 0) && (
              <details className="developer-panel stage-query-build-details">
                <summary>クエリビルダー詳細</summary>
                <div>
                  <strong>{QUERY_LABELS_JA.rawQuery}</strong>
                  <span>{safeRuntimeText(stage.rawQuery || "-", viewMode)}</span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.safeQuery}</strong>
                  <span>{safeRuntimeText(stage.safeQuery || "-", viewMode)}</span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.fallbackQuery}</strong>
                  <span>{safeRuntimeText(stage.fallbackQuery || "-", viewMode)}</span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.finalQueryForXApi}</strong>
                  <span>{safeRuntimeText(stage.finalQueryForXApi || stage.query || "-", viewMode)}</span>
                </div>
                <div>
                  <strong>整形状態</strong>
                  <span>{queryBuildStatusLabel(stage.queryBuildStatus)}</span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.fallbackUsed}</strong>
                  <span>{stage.fallbackUsed ? "あり" : "なし"}</span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.retryCount}</strong>
                  <span>{stage.retryCount || 0}</span>
                </div>
                {stage.apiErrorMessage && (
                  <div>
                    <strong>{QUERY_LABELS_JA.apiErrorMessage}</strong>
                    <span>{stage.apiErrorMessage}</span>
                  </div>
                )}
                {stage.errorType && (
                  <div>
                    <strong>errorType</strong>
                    <span>{stage.errorType}</span>
                  </div>
                )}
                {stage.originalErrorMessage && (
                  <div>
                    <strong>originalErrorMessage</strong>
                    <span>{stage.originalErrorMessage}</span>
                  </div>
                )}
                {stage.errorTimestamp && (
                  <div>
                    <strong>timestamp</strong>
                    <span>{stage.errorTimestamp}</span>
                  </div>
                )}
                {stage.queryBuildWarnings?.length > 0 && (
                  <div>
                    <strong>{QUERY_LABELS_JA.queryBuildWarnings}</strong>
                    <span>{stage.queryBuildWarnings.join(" / ")}</span>
                  </div>
                )}
                <div>
                  <strong>{QUERY_LABELS_JA.sanitizedHashtagRemovedParts}</strong>
                  <span>
                    {stage.sanitizedHashtagRemovedParts?.length
                      ? stage.sanitizedHashtagRemovedParts
                          .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                          .join(" / ")
                      : "なし"}
                  </span>
                </div>
                <div>
                  <strong>{QUERY_LABELS_JA.sanitizedExcludeRemovedParts}</strong>
                  <span>
                    {stage.sanitizedExcludeRemovedParts?.length
                      ? stage.sanitizedExcludeRemovedParts
                          .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                          .join(" / ")
                      : "なし"}
                  </span>
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
