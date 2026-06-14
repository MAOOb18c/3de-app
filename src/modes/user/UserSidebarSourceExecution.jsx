import UserStagedFetchLog from "./UserStagedFetchLog.jsx";

const ZERO_ANALYSIS_LABELS = {
  title: "\u5206\u6790\u5bfe\u8c61\u304c0\u4ef6\u306b\u306a\u3063\u305f\u7406\u7531",
  fetched: "\u53d6\u5f97\u6570",
  target: "\u5206\u6790\u5bfe\u8c61",
  clusters: "\u8868\u793a\u30af\u30e9\u30b9\u30bf",
  reason: "\u4e3b\u56e0",
  inspect: "\u78ba\u8a8d\u5834\u6240",
  inspectValue: "Zone 12\u3067\u9664\u5916\u30fb\u5883\u754c\u30fb\u30ce\u30a4\u30ba\u6295\u7a3f\u3092\u78ba\u8a8d",
  next: "\u6b21\u306e\u64cd\u4f5c",
  queryTooBroad: "query too broad",
  noiseDominated: "noise/exclusion dominated",
  boundaryOnly: "boundary-only posts",
  thresholdStrict: "scoring threshold too strict",
  noMust: "no matching MUST term",
  unknown: "unknown",
  nextQuery: "MUST / OR / \u9664\u5916\u8a9e\u3092\u8abf\u6574\u3057\u3001\u5fc5\u8981\u306a\u3089\u9664\u5916\u3092\u7de9\u3081\u3066\u518d\u53d6\u5f97\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  nextZone12: "Zone 12\u3067\u9664\u5916\u7406\u7531\u3092\u78ba\u8a8d\u3057\u3001\u691c\u7d22\u6761\u4ef6\u3092\u8abf\u6574\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
};

function buildZeroAnalysisDiagnostic({ result, stagedFetchState, stagedCurrentDataCount, noiseRelevanceThreshold }) {
  const noiseResult = result?.noiseProcessingResult || {};
  const diagnosis = stagedFetchState?.diagnosis || {};
  const fetchedCount = Number(
    diagnosis.fetchedCount ??
      stagedFetchState?.totalApiFetchedCount ??
      stagedFetchState?.fetchedCount ??
      stagedCurrentDataCount ??
      noiseResult.fetchedCount ??
      noiseResult.sourceCount ??
      0
  );
  const analysisTargetCount = Number(
    diagnosis.analysisCandidateCount ??
      noiseResult.analysisTargetCount ??
      noiseResult.candidateCount ??
      0
  );
  const displayedClusterCount = Array.isArray(result?.clusterTableRows) ? result.clusterTableRows.length : Number(noiseResult.clusterCount || 0);

  if (!(fetchedCount > 0 && analysisTargetCount === 0)) {
    return null;
  }

  const reasonText = [
    ...(Array.isArray(diagnosis.problemReasons) ? diagnosis.problemReasons : []),
    noiseResult.noiseReasonSummary || "",
  ].join(" ");
  const noiseRate = Number(diagnosis.noiseRate ?? noiseResult.noiseRate ?? 0);
  const excludedCount = Number(noiseResult.noiseExcludedCount ?? noiseResult.noiseRemovedCount ?? 0);
  const lowerReason = reasonText.toLowerCase();
  let mainReason = ZERO_ANALYSIS_LABELS.unknown;
  let nextStep = ZERO_ANALYSIS_LABELS.nextZone12;

  if (/must|center|\u4e2d\u5fc3|\u5fc5\u9808/.test(lowerReason)) {
    mainReason = ZERO_ANALYSIS_LABELS.noMust;
    nextStep = ZERO_ANALYSIS_LABELS.nextQuery;
  } else if (noiseRate >= 0.8 || excludedCount >= Math.max(1, fetchedCount * 0.8)) {
    mainReason = ZERO_ANALYSIS_LABELS.noiseDominated;
    nextStep = ZERO_ANALYSIS_LABELS.nextQuery;
  } else if (/boundary|\u5883\u754c/.test(lowerReason)) {
    mainReason = ZERO_ANALYSIS_LABELS.boundaryOnly;
  } else if (Number(noiseRelevanceThreshold) >= 0.7) {
    mainReason = ZERO_ANALYSIS_LABELS.thresholdStrict;
  } else if (/broad|generic|\u5e83\u3059\u304e|\u62bd\u8c61/.test(lowerReason)) {
    mainReason = ZERO_ANALYSIS_LABELS.queryTooBroad;
    nextStep = ZERO_ANALYSIS_LABELS.nextQuery;
  }

  return {
    fetchedCount,
    analysisTargetCount,
    displayedClusterCount,
    mainReason,
    nextStep,
  };
}

export default function UserSidebarSourceExecution({ ctx }) {
  const {
    Bearer,
    DEFAULT_MAX_X_FETCH,
    JP_UI_LABELS,
    PUBLIC_PREVIEW_MAX_X_FETCH,
    PUBLIC_PREVIEW_MODE,
    QUERY_LABELS_JA,
    STAGED_FETCH_INITIAL_COUNT,
    advice,
    afterAnalysisCandidateCount,
    afterDuplicateRate,
    afterNoiseRate,
    afterQuery,
    afterStatus,
    aiQueryAdvice,
    analysisCandidateCount,
    autoFetchSafetyLimit,
    beforeAnalysisCandidateCount,
    beforeDuplicateRate,
    beforeNoiseRate,
    beforeQuery,
    beforeStatus,
    canAddImprovedQuery,
    canContinueStagedFetch,
    candidate,
    candidateCount,
    candidateRate,
    category,
    checked,
    continueRemainingCount,
    continueStagedFetch,
    count,
    currentBatchCount,
    diagnosis,
    diagnosisStatus,
    diagnosisSummary,
    duplicateRate,
    effectiveQuery,
    enabled,
    event,
    fetchX,
    fetchedCount,
    focusManualQueryEdit,
    formatPercent,
    handleFetchXButtonClick,
    improvedAddFetchCount,
    improvedQueryCandidates,
    improvedRefetchCount,
    improvementComparison,
    includes,
    index,
    is,
    isEffectiveQueryTooLong,
    item,
    join,
    lastAction,
    length,
    mainProblems,
    max,
    maxFetchCount,
    message,
    min,
    nextValue,
    noiseBreakdown,
    noiseProcessingResult,
    noiseRate,
    noiseRelevanceThreshold,
    normalizedCount,
    note,
    operationStatus,
    overallRetrievalQuality,
    previous,
    problem,
    problemReasons,
    qualityLabel,
    query,
    queryBuildStatusLabel,
    queryDiagnosisLabel,
    queryDirty,
    queryTermDiagnosis,
    reason,
    recommendedQuery,
    refetchWithImprovedQuery,
    result,
    retrievalKpi,
    retryDiagnosisWithWeakNoiseFilter,
    row,
    safeRuntimeText,
    selectedExcludeTermValues,
    selectedHashtagValues,
    selectedImprovedExecutionQuery,
    selectedImprovedQueryIndexes,
    selectedImprovedQueryIsSame,
    setStagedFetchState,
    setXMaxResults,
    shouldShowStagedActions,
    stagedCurrentDataCount,
    stagedFetchEnabled,
    stagedFetchState,
    stagedNextFetchCount,
    stagedRemainingCount,
    status,
    stopReasonLabel,
    suggestion,
    target,
    term,
    toggleImprovedQueryCandidate,
    totalApiFetchedCount,
    ul,
    userMessage,
    viewMode,
    warning,
    weakNoiseRetryAvailable,
    x,
    xMaxResults,
    xStatus,
  } = ctx;
  const zeroAnalysisDiagnostic = buildZeroAnalysisDiagnostic({
    result,
    stagedFetchState,
    stagedCurrentDataCount,
    noiseRelevanceThreshold,
  });

  return (
    <>
            <div className="x-fetch-grid">
              <label>
                最大件数
                <input
                  type="number"
                  min="10"
                  max={PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH}
                  value={xMaxResults}
                  onChange={(event) => {
                    const maxFetchCount = PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH;
                    const nextValue = event.target.value === "" ? "" : Math.min(maxFetchCount, Number(event.target.value) || 10);
                    setXMaxResults(nextValue);
                  }}
                />
                {PUBLIC_PREVIEW_MODE && <small>公開プレビューでは最大200件まで取得できます。</small>}
              </label>

              <label>
                反映方法
                <div className="readonly-field">毎回、今回の取得結果で置き換え</div>
              </label>
            </div>

            {viewMode === "developer" && (
            <div className="staged-fetch-setting">
              <div>
                <strong>段階取得</strong>
                <p>ON時はまず30件を取得してクエリ品質を診断し、良好なら本取得へ進みます。</p>
              </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={stagedFetchState.enabled}
                    onChange={(event) =>
                      setStagedFetchState((previous) => ({
                        ...previous,
                        enabled: event.target.checked,
                      }))
                    }
                  />
                  {stagedFetchEnabled ? "ON" : "OFF"}
                </label>
            </div>
            )}

            <button
              className={`action-button action-button-primary x-fetch-button ${
                operationStatus.fetchX.status === "running"
                  ? "is-running"
                  : operationStatus.fetchX.status === "success" && !queryDirty
                    ? "is-done"
                    : ""
              }`}
              onClick={handleFetchXButtonClick}
              disabled={isEffectiveQueryTooLong || operationStatus.fetchX.status === "running"}
            >
              {operationStatus.fetchX.status === "running"
                ? "取得中..."
                : operationStatus.fetchX.status === "success" && !queryDirty
                  ? "X取得済み"
                  : viewMode === "user"
                    ? "Xから取得して外部意見欄に反映"
                    : "Xから取得して外部意見欄に反映"}
            </button>

            {xStatus && <div className="x-status">{xStatus}</div>}

            <div className={`query-diagnosis-panel ${stagedFetchState.diagnosisStatus} ${viewMode === "developer" ? "developer-panel" : ""}`}>
              <div className="query-diagnosis-header">
                <strong>{viewMode === "user" ? "取得品質" : `取得診断：${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}`}</strong>
                <span>
                  {viewMode === "user"
                    ? operationStatus.fetchX.status === "running"
                      ? "外部意見を取得中です。"
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "取得品質を確認してください。"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "取得できました。"
                          : "取得前です。"
                    : stagedFetchState.message}
                </span>
              </div>
              {viewMode === "developer" && (
              <div className="staged-fetch-progress">
                <div><span>目標</span><b>{Number(xMaxResults) || 0}</b></div>
                <div><span>今回取得</span><b>{stagedFetchState.currentBatchCount || stagedFetchState.fetchedCount || 0}</b></div>
                <div><span>現在データ</span><b>{stagedCurrentDataCount}</b></div>
                <div><span>残り</span><b>{stagedRemainingCount}</b></div>
                <div><span>次回追加</span><b>{stagedNextFetchCount}</b></div>
                <div><span>API累計</span><b>{stagedFetchState.totalApiFetchedCount || stagedCurrentDataCount}</b></div>
                <div><span>分析対象</span><b>{stagedFetchState.diagnosis?.analysisCandidateCount ?? result.noiseProcessingResult.candidateCount}</b></div>
                <div><span>関連度基準</span><b>{noiseRelevanceThreshold}</b></div>
                <div><span>改善追加</span><b>{stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}</b></div>
                <div><span>このまま追加</span><b>{stagedFetchState.continueRemainingCount || 0}</b></div>
              </div>
              )}
              {viewMode === "user" && (
                <div className="user-fetch-summary">
                  <strong>
                    {operationStatus.fetchX.status === "running"
                      ? "外部意見を取得中..."
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "取得品質を確認してください"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "取得できました"
                          : "取得前です"}
                  </strong>
                  <span>
                    {operationStatus.fetchX.status === "running"
                      ? `${stagedCurrentDataCount} / ${Number(xMaxResults) || 0}件。検索条件を自動調整しています。`
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "外部意見の取得が十分に進みませんでした。"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "外部意見を取得できました。"
                          : "ボタンを押すと自動で取得します。"}
                  </span>
                  <small>
                    目標：{Number(xMaxResults) || 0}件 / 取得済み：{stagedCurrentDataCount}件 / 残り：{stagedRemainingCount}件
                  </small>
                </div>
              )}
              {zeroAnalysisDiagnostic && (
                <div className="zero-analysis-diagnostic">
                  <strong>{ZERO_ANALYSIS_LABELS.title}</strong>
                  <div className="zero-analysis-diagnostic-grid">
                    <span>{ZERO_ANALYSIS_LABELS.fetched}</span>
                    <b>{zeroAnalysisDiagnostic.fetchedCount}</b>
                    <span>{ZERO_ANALYSIS_LABELS.target}</span>
                    <b>{zeroAnalysisDiagnostic.analysisTargetCount}</b>
                    <span>{ZERO_ANALYSIS_LABELS.clusters}</span>
                    <b>{zeroAnalysisDiagnostic.displayedClusterCount}</b>
                    <span>{ZERO_ANALYSIS_LABELS.reason}</span>
                    <b>{zeroAnalysisDiagnostic.mainReason}</b>
                    <span>{ZERO_ANALYSIS_LABELS.inspect}</span>
                    <b>{ZERO_ANALYSIS_LABELS.inspectValue}</b>
                  </div>
                  <p>
                    <b>{ZERO_ANALYSIS_LABELS.next}</b>
                    {zeroAnalysisDiagnostic.nextStep}
                  </p>
                </div>
              )}
              {viewMode === "developer" && (selectedHashtagValues.length > 0 || selectedExcludeTermValues.length > 0) && (
                <div className="developer-panel query-change-panel">
                  {selectedHashtagValues.length > 0 && (
                    <div>
                      <strong>使用ハッシュタグ</strong>
                      <span>{selectedHashtagValues.join(" / ")}</span>
                    </div>
                  )}
                  {selectedExcludeTermValues.length > 0 && (
                    <div>
                      <strong>使用除外語</strong>
                      <span>{selectedExcludeTermValues.map((term) => `-${term}`).join(" ")}</span>
                    </div>
                  )}
                </div>
              )}
              {viewMode === "developer" && (
                <div className="developer-panel query-change-panel">
                  <div>
                    <strong>{JP_UI_LABELS.autoFetchSafetyLimit}</strong>
                    <span>無限ループを防ぐための安全上限です。取得件数の上限ではありません。</span>
                  </div>
                </div>
              )}
              {viewMode === "developer" && (stagedFetchState.beforeQuery || stagedFetchState.afterQuery) && (
                <div className="developer-panel query-change-panel">
                  {stagedFetchState.beforeQuery && (
                    <div>
                      <strong>変更前クエリ</strong>
                      <span>{stagedFetchState.beforeQuery}</span>
                    </div>
                  )}
                  {stagedFetchState.afterQuery && (
                    <div>
                      <strong>変更後クエリ</strong>
                      <span>{stagedFetchState.afterQuery}</span>
                    </div>
                  )}
                </div>
              )}
              {viewMode === "developer" && stagedFetchState.diagnosis && (
                <>
                  <div className="developer-panel query-diagnosis-metrics">
                    <div><span>取得</span><b>{stagedFetchState.diagnosis.fetchedCount}</b></div>
                    <div><span>正規化</span><b>{stagedFetchState.diagnosis.normalizedCount}</b></div>
                    <div><span>分析対象</span><b>{stagedFetchState.diagnosis.analysisCandidateCount}</b></div>
                    <div><span>ノイズ率</span><b>{formatPercent(stagedFetchState.diagnosis.noiseRate)}</b></div>
                    <div><span>候補率</span><b>{formatPercent(stagedFetchState.diagnosis.candidateRate)}</b></div>
                    <div><span>重複率</span><b>{formatPercent(stagedFetchState.diagnosis.duplicateRate)}</b></div>
                  </div>
                  {stagedFetchState.diagnosis.problemReasons.length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons">
                      <strong>主な理由</strong>
                      <ul>
                        {stagedFetchState.diagnosis.problemReasons.map((reason, index) => (
                          <li key={`diagnosis-reason-${index}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(stagedFetchState.noiseBreakdown || []).length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons noise-breakdown-panel">
                      <strong>ノイズ分類の内訳</strong>
                      <ul>
                        {stagedFetchState.noiseBreakdown.map((item) => (
                          <li key={`noise-breakdown-${item.category}`}>
                            {item.label}: {item.count}件。{item.advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(stagedFetchState.queryTermDiagnosis || []).length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons query-term-panel">
                      <strong>検索語ごとの診断</strong>
                      <ul>
                        {stagedFetchState.queryTermDiagnosis.map((item) => (
                          <li key={`query-term-${item.term}`}>
                            「{item.term}」: {item.status === "ok" ? "維持" : "見直し"} / {item.problem} {item.advice}
                            {item.suggestion ? ` 候補: ${item.suggestion}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stagedFetchState.aiQueryAdvice && (
                    <div className="developer-panel query-advice-panel">
                      <strong>AIによる取得改善アドバイス</strong>
                      <p>{stagedFetchState.aiQueryAdvice.diagnosisSummary}</p>
                      {(stagedFetchState.aiQueryAdvice.mainProblems || []).length > 0 && (
                        <ul>
                          {stagedFetchState.aiQueryAdvice.mainProblems.map((problem, index) => (
                            <li key={`ai-advice-problem-${index}`}>{problem}</li>
                          ))}
                        </ul>
                      )}
                      {stagedFetchState.aiQueryAdvice.recommendedQuery && (
                        <div className="recommended-query-box">
                          <span>推奨クエリ</span>
                          <b>{stagedFetchState.aiQueryAdvice.recommendedQuery}</b>
                        </div>
                      )}
                      {stagedFetchState.aiQueryAdvice.userMessage && <p>{stagedFetchState.aiQueryAdvice.userMessage}</p>}
                    </div>
                  )}
                  {stagedFetchState.improvementComparison && (
                    <div className={`developer-panel query-comparison-panel ${stagedFetchState.improvementComparison.improved ? "good" : "bad"}`}>
                      <strong>改善前後の比較</strong>
                      <div className="query-comparison-grid">
                        <div><span>分析対象</span><b>{stagedFetchState.improvementComparison.beforeAnalysisCandidateCount} → {stagedFetchState.improvementComparison.afterAnalysisCandidateCount}</b></div>
                        <div><span>ノイズ率</span><b>{formatPercent(stagedFetchState.improvementComparison.beforeNoiseRate)} → {formatPercent(stagedFetchState.improvementComparison.afterNoiseRate)}</b></div>
                        <div><span>重複率</span><b>{formatPercent(stagedFetchState.improvementComparison.beforeDuplicateRate)} → {formatPercent(stagedFetchState.improvementComparison.afterDuplicateRate)}</b></div>
                        <div><span>診断</span><b>{queryDiagnosisLabel(stagedFetchState.improvementComparison.beforeStatus)} → {queryDiagnosisLabel(stagedFetchState.improvementComparison.afterStatus)}</b></div>
                      </div>
                      <p>{stagedFetchState.improvementComparison.message}</p>
                    </div>
                  )}
                  {stagedFetchState.diagnosis.analysisCandidateCount < 5 && (
                    <div className="developer-panel query-diagnosis-reasons strong">
                      <strong>分析対象が少なすぎます</strong>
                      <p>
                        {stagedFetchState.diagnosis.fetchedCount}件取得しましたが、分析対象に残った投稿は
                        {stagedFetchState.diagnosis.analysisCandidateCount}件だけです。この状態ではクラスタリングやグラフ分析を行っても意味のある分布が出にくいです。
                      </p>
                      <ul>
                        <li>改善候補を複数選択して追加取得してください。既存データは保持されます。</li>
                        <li>このクエリのまま残りを追加取得して、該当投稿が増えるか確認できます。</li>
                        <li>ノイズ除去を弱めて再診断することもできます。</li>
                        <li>手動で検索語を追加する場合は、テーマに近い具体語を入れてください。</li>
                      </ul>
                    </div>
                  )}
                  {stagedFetchState.lastAction === "improved_add" && stagedFetchState.diagnosisStatus === "bad" && (
                    <div className="developer-panel query-diagnosis-reasons strong">
                      <strong>改善クエリで追加取得しても不調です</strong>
                      <ul>
                        <li>検索語がまだ狭すぎる可能性があります。</li>
                        <li>X上に該当投稿が少ない可能性があります。</li>
                        <li>ノイズ除去が強すぎる場合は「ノイズ除去を弱めて再診断」を試してください。</li>
                        <li>具体語を追加するか、保存済みデータでデモ確認することもできます。</li>
                      </ul>
                    </div>
                  )}
                  {shouldShowStagedActions && (
                    <div className="developer-panel query-diagnosis-actions">
                      {["warning", "bad"].includes(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality) && (
                        <div className="query-action-warning">
                          <strong>追加取得前の確認</strong>
                          <span>
                            現在の取得効率は{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}です。
                            このまま追加取得すると、X APIを消費してもノイズが増える可能性があります。
                            先に除外語・ハッシュタグ・検索語を調整することをおすすめします。
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="action-button action-button-primary"
                        onClick={() => refetchWithImprovedQuery()}
                        disabled={!canAddImprovedQuery}
                      >
                        {stagedNextFetchCount < STAGED_FETCH_INITIAL_COUNT && stagedNextFetchCount > 0
                          ? `改善クエリで残り${stagedNextFetchCount}件追加`
                          : `改善クエリで${stagedNextFetchCount || STAGED_FETCH_INITIAL_COUNT}件追加取得`}
                      </button>
                      <button
                        type="button"
                        className="action-button action-button-secondary"
                        onClick={continueStagedFetch}
                        disabled={!canContinueStagedFetch}
                      >
                        {stagedNextFetchCount < STAGED_FETCH_INITIAL_COUNT && stagedNextFetchCount > 0
                          ? `このクエリのまま残り${stagedNextFetchCount}件追加`
                          : `このクエリのまま${stagedNextFetchCount || STAGED_FETCH_INITIAL_COUNT}件追加取得`}
                      </button>
                      {stagedFetchState.weakNoiseRetryAvailable && (
                        <button type="button" className="action-button action-button-secondary" onClick={retryDiagnosisWithWeakNoiseFilter}>
                          ノイズ除去を弱めて再診断
                        </button>
                      )}
                      <button type="button" className="action-button action-button-secondary" onClick={focusManualQueryEdit}>
                        手動でクエリを直す
                      </button>
                    </div>
                  )}
                  {stagedFetchState.improvedQueryCandidates.length > 0 && (
                    <div className="developer-panel improved-query-list">
                      <div className="improved-query-context">
                        <div>
                          <strong>現在のクエリ</strong>
                          <span>{safeRuntimeText(effectiveQuery, viewMode)}</span>
                        </div>
                        <div>
                          <strong>適用後の実行クエリ</strong>
                          <span>{safeRuntimeText(selectedImprovedExecutionQuery || "候補を選択してください。", viewMode)}</span>
                        </div>
                        {selectedImprovedQueryIsSame && (
                          <div className="query-same-warning">
                            改善クエリが現在のクエリと同じです。追加取得は可能ですが、同じ傾向の投稿が増える可能性があります。
                          </div>
                        )}
                      </div>
                      {stagedFetchState.improvedQueryCandidates.map((candidate, index) => (
                        <button
                          key={`${candidate.label}-${candidate.query}`}
                          type="button"
                          className={
                            (stagedFetchState.selectedImprovedQueryIndexes || []).includes(index)
                              ? "option-button option-button-selected improved-query-button"
                              : "option-button improved-query-button"
                          }
                          onClick={() => toggleImprovedQueryCandidate(index)}
                        >
                          <em>{(stagedFetchState.selectedImprovedQueryIndexes || []).includes(index) ? "選択中" : "未選択"}</em>
                          <strong>{safeRuntimeText(candidate.label, viewMode)}</strong>
                          <span>{safeRuntimeText(candidate.query, viewMode)}</span>
                          <small>{safeRuntimeText(candidate.reason, viewMode)}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <UserStagedFetchLog
                formatPercent={formatPercent}
                QUERY_LABELS_JA={QUERY_LABELS_JA}
                queryBuildStatusLabel={queryBuildStatusLabel}
                queryDiagnosisLabel={queryDiagnosisLabel}
                safeRuntimeText={safeRuntimeText}
                stagedFetchState={stagedFetchState}
                stopReasonLabel={stopReasonLabel}
                viewMode={viewMode}
                xMaxResults={xMaxResults}
              />
            </div>

            {viewMode === "developer" && (
            <p className="x-note">
              Bearer Tokenはブラウザ側ではなく、同梱のserver.js側の.envに設定します。
              X APIのRecent Searchは1回100件までなので、1000件指定時はサーバー側でページング取得します。
            </p>
            )}
    </>
  );
}
