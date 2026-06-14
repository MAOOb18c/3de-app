import {
  APP_VERSION,
  axisExplanationItems,
  clusterVolumeFromRow,
  escapeMarkdownTableCell,
  formatHistoryDate,
  formatPercent,
  gateAnalysisMarkdown,
  getScoreForDisplay,
  getScoreTripletForDisplay,
  MAX_USER_AUTO_FETCH_ROUNDS,
  normalizeVoiceDirections,
  NOISE_CATEGORY_LABELS,
  personaConfigFor,
  PUBLIC_PREVIEW_MODE,
  queryBuildStatusLabel,
  queryKindLabel,
  scoreAxisHeader,
  scoreDisplayModeLabel,
  stopReasonLabel,
  truncateText,
} from "../app/appSupport.jsx";
import { JP_UI_LABELS, ZONE12_FILTERS } from "../data/uiLabels.js";

export function createAnalysisMarkdown(context) {
  const {
    activeClusterRunId,
    activeDataset,
    activeDatasetId,
    analysisMode,
    axisConfig,
    axisLabels,
    axisLinkedKeywords,
    axisQualityWarnings,
    clusterMethod,
    clusterSummaries,
    clusterSummaryKey,
    currentAnalysisPurposeConfig,
    currentOpinionCount,
    currentPersonaConfig,
    currentSample,
    currentSessionSampleLabel,
    effectiveQuery,
    generatedBasicKeywords,
    generatedXQueryCandidates,
    graphMode,
    hashtagCandidates,
    isSampleSession,
    personaAAnalysisMemoItems,
    personaMode,
    personaModeHistory,
    queryAxisWarnings,
    queryReviewParts,
    result,
    safeQueryPreview,
    sampleKey,
    sampleNoForKey,
    scoreBasisLabel,
    scoreDisplayMode,
    scoreReasonForDisplay,
    selectedAxisLinkedKeywords,
    selectedExcludeTermValues,
    selectedHashtagValues,
    selectedVoiceDirections,
    selectedXQueryCandidates,
    semanticClusterError,
    semanticClusterRows,
    semanticClusterStatus,
    semanticThreshold,
    stagedCurrentDataCount,
    stagedFetchEnabled,
    stagedFetchState,
    stagedNextFetchCount,
    stagedRemainingCount,
    theme,
    themeCategory,
    userFeedback,
    userOpinion,
    userReferenceGraphMessage,
    userReferenceGraphWarning,
    viewMode,
    voiceDirectionLabel,
    xDataStatus,
    xMaxResults,
    xPosts,
    xQueryCandidates,
    zone11DisplayTitle,
    zone12Filter,
    zone12HighlightTerms,
    zone12TopNoiseReasons,
    zone12ZeroAnalysisSummary,
  } = context;    const stats = result.noiseProcessingResult;
    const sampleNo = isSampleSession ? currentSample.sampleNo || sampleNoForKey(sampleKey) : null;
    const sampleLabel = currentSessionSampleLabel;
    const xFetchCount = xPosts.length > 0 ? `${xPosts.length}件` : "未取得または不明";
    const clusterRows = result.clusterTableRows;
    const opinionRows = result.tableRows.slice(0, 20);
    const summarizedCount = clusterRows.filter((cluster) => clusterSummaries[clusterSummaryKey(cluster)]).length;
    const unsummarizedCount = Math.max(0, clusterRows.length - summarizedCount);
    const scoreReasonMarkdown = (cluster, axis) => {
      const reason = scoreReasonForDisplay(cluster, axis);
      return reason
        ? `${axis.toUpperCase()}:${reason.score} ${reason.reason} 根拠語:${reason.evidenceKeywords?.join("/") || "少ない"} 信頼度:${reason.confidence}`
        : `${axis.toUpperCase()}:理由なし`;
    };
    const semanticStatusText =
      semanticClusterError || semanticClusterStatus || (semanticClusterRows.length > 0 ? "実行済み" : "未実行");
    const xDataStateLabel =
      xDataStatus === "empty"
        ? "未取得"
        : xDataStatus === "cached"
        ? "保存済みデータを使用中"
        : xDataStatus === "unsaved"
          ? "未保存の新規取得データ"
          : xDataStatus === "fetching"
            ? "X API取得中"
            : "サンプルまたは手入力データ";
    const personaAStrict = stats.personaAStrictRelevance || {};
    const personaATopExclusionCategories = Object.entries(personaAStrict.exclusionCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
      .join(" / ") || "なし";
    const purposeMarkdownLines = [
      `- ${JP_UI_LABELS.analysisPurpose}: ${currentAnalysisPurposeConfig.label}`,
      `- ${JP_UI_LABELS.retrievalPolicy}: ${currentAnalysisPurposeConfig.retrievalPolicy}`,
      `- ${JP_UI_LABELS.clusterPolicy}: ${currentAnalysisPurposeConfig.clusterPolicy}`,
      `- ${JP_UI_LABELS.zone11Policy}: ${currentAnalysisPurposeConfig.zone11Policy}`,
    ];
    const zone12ZeroAnalysisMessage = zone12ZeroAnalysisSummary
      ? `分析対象が0件です。X APIから投稿は返っていますが、ノイズ除去後に残りませんでした。取得本文数:${zone12ZeroAnalysisSummary.fetchedCount}件 / ノイズ除外:${zone12ZeroAnalysisSummary.noiseRemovedCount}件 / 主な理由:${zone12ZeroAnalysisSummary.reasons.join(" / ") || "なし"}`
      : "なし";
    const zone12InspectionMarkdownLines = [
      "- Zone⑫表示仕様: 採用・境界・ノイズ投稿を検証できる一覧",
      `- 黄色マーカー対象語: ${zone12HighlightTerms.length ? zone12HighlightTerms.join(" / ") : "なし"}`,
      `- 表示対象フィルタ: ${ZONE12_FILTERS.find((item) => item.value === zone12Filter)?.label || zone12Filter}`,
      "- ノイズ背景表示: ON",
      "- ハッシュタグ表示: ON",
      `- 主なノイズ理由: ${zone12TopNoiseReasons.length ? zone12TopNoiseReasons.join(" / ") : "なし"}`,
      `- 分析対象0件診断: ${zone12ZeroAnalysisMessage}`,
    ];

    if (viewMode === "user") {
      const userLines = [
        "# 3DE 分析結果",
        "",
        "## 基本情報",
        `- バージョン: ${APP_VERSION}`,
        `- 利用目的: ${currentPersonaConfig.label}`,
        ...purposeMarkdownLines,
        `- テーマカテゴリ: ${themeCategory}`,
        `- 評価軸の決定方法: テーマ優先`,
        `- ペルソナ補正: 出力表現のみ`,
        `- ${JP_UI_LABELS.voicesToCollect}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
        `- テーマ: ${theme || "なし"}`,
        `- 自分の意見: ${userOpinion || "なし"}`,
        `- 実行した検索条件: ${PUBLIC_PREVIEW_MODE ? "検索条件レビューに表示された語をもとに安全化して送信" : effectiveQuery || "なし"}`,
        ...(!PUBLIC_PREVIEW_MODE ? [`- 最終送信クエリ: ${safeQueryPreview.finalQueryForXApi || "なし"}`] : []),
        `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
        `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
        `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
        `- 取得件数: ${xFetchCount}`,
        `- 分析に使えた意見: ${stats.analysisTargetCount}件`,
        `- 似た意見のまとまり: ${clusterRows.length}件`,
        `- 取得品質メッセージ: ${stats.retrievalKpi.message}`,
        `- Persona A strict relevance mode: ${personaAStrict.enabled ? "ON" : "OFF"}`,
        `- 除外された曖昧な意見: ${personaAStrict.ambiguousExcludedCount || 0}件`,
        `- ${JP_UI_LABELS.borderlineOpinions}: ${personaAStrict.borderlineCount || 0}件`,
        `- Top exclusion categories: ${personaATopExclusionCategories}`,
        `- ${JP_UI_LABELS.referenceDisplay}: ${personaAStrict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"}`,
        userReferenceGraphWarning ? `- グラフ表示: 参考表示。${userReferenceGraphMessage}` : "- グラフ表示: 通常表示",
        "",
        "## Zone⑫ 検証表示",
        ...zone12InspectionMarkdownLines,
        "",
        `## Zone⑪ ${zone11DisplayTitle}`,
        ...(personaMode === "personaA"
          ? [
              `### ${JP_UI_LABELS.empathy}`,
              ...userFeedback.personaSections.map(([title, body]) => `- ${title}: ${body}`),
              "",
              `### ${JP_UI_LABELS.analysisMemo}`,
              ...personaAAnalysisMemoItems().map(([label, value]) => `- ${label}: ${value}`),
            ]
          : [
              `- 今回の意見空間の傾向: ${userFeedback.overview}`,
              `- あなたの意見の位置づけ: ${userFeedback.userPosition}`,
              `- 外部意見とのズレ: ${userFeedback.gap}`,
              "- 足りない視点:",
              ...userFeedback.missingPerspectives.map((item) => `  - ${item}`),
              "- 次に考えるべき問い:",
              ...userFeedback.nextQuestions.map((question) => `  - ${question}`),
            ]),
        "",
        "## クラスタ一覧の要約",
        ...(clusterRows.length
          ? clusterRows.map((cluster) => {
              const summary = clusterSummaries[clusterSummaryKey(cluster)];
              const volume = clusterVolumeFromRow(cluster);
              return `- ${cluster.label}: 独立意見数 ${volume.independent} / ${summary?.title || truncateText(cluster.opinion, 80)}`;
            })
          : ["- クラスタはありません"]),
      ];

      return gateAnalysisMarkdown(userLines.join("\n"), viewMode);
    }

    const lines = [
      "# 3DE 分析結果",
      "",
      "## 基本情報",
      `- バージョン: ${APP_VERSION}`,
      `- サンプルNo: ${sampleNo || "No未設定"}`,
      `- サンプル: ${sampleLabel}`,
      `- テーマカテゴリ: ${themeCategory}`,
      `- テーマ: ${theme}`,
      `- viewMode: ${viewMode}`,
      `- personaMode: ${personaMode}`,
      `- 利用目的: ${currentPersonaConfig.label}`,
      `- 利用目的説明: ${currentPersonaConfig.description}`,
      ...purposeMarkdownLines,
      `- 評価軸の決定方法: テーマ優先`,
      `- 選択中の軸ソース: ${axisConfig.axisSource || "theme"}`,
      `- ペルソナ補正: 出力表現のみ`,
      `- ${JP_UI_LABELS.voicesToCollect}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
      `- ${JP_UI_LABELS.queryAdjustment}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
      `- Persona A strict relevance mode: ${personaAStrict.enabled ? "ON" : "OFF"}`,
      `- 除外された曖昧な意見: ${personaAStrict.ambiguousExcludedCount || 0}件`,
      `- ${JP_UI_LABELS.borderlineOpinions}: ${personaAStrict.borderlineCount || 0}件`,
      `- Top exclusion categories: ${personaATopExclusionCategories}`,
      `- ${JP_UI_LABELS.referenceDisplay}: ${personaAStrict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"}`,
      `- 保存データのテーマ: ${activeDataset?.theme || "なし"}`,
      `- 保存データの自分の意見: ${activeDataset?.userOpinion || "なし"}`,
      `- 現在画面のテーマ: ${theme || "なし"}`,
      `- 現在画面の自分の意見: ${userOpinion || "なし"}`,
      `- 表示モード: ${graphMode}`,
      `- クラスタ方式: ${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}`,
      `- 文字類似しきい値: ${stats.threshold.toFixed(2)}`,
      `- 意味類似しきい値: ${semanticThreshold.toFixed(2)}`,
      `- 意味クラスタ実行状態: ${semanticStatusText}`,
      `- 意味クラスタ数: ${semanticClusterRows.length > 0 ? semanticClusterRows.length : "未実行"}`,
      `- 現在のXデータ状態: ${xDataStateLabel}`,
      `- activeDatasetId: ${activeDatasetId || "なし"}`,
      `- Xデータ保存日時: ${activeDataset?.savedAt ? formatHistoryDate(activeDataset.savedAt) : "なし"}`,
      `- クラスタリング結果保存状態: ${activeClusterRunId ? "保存済みrunを表示中" : "未保存または未選択"}`,
      `- activeClusterRunId: ${activeClusterRunId || "なし"}`,
      `- クラスタリング履歴件数: ${activeDataset?.clusterRuns?.length || 0}`,
      `- 選択クエリ候補数: ${selectedXQueryCandidates.length}`,
      `- AI生成クエリ候補使用中: ${generatedXQueryCandidates ? "はい" : "いいえ"}`,
      `- AI生成基本キーワード: ${generatedBasicKeywords.length ? generatedBasicKeywords.join(" / ") : "なし"}`,
      `- 選択ハッシュタグ候補: ${selectedHashtagValues.length ? selectedHashtagValues.join(" / ") : "なし"}`,
      `- 選択除外語: ${selectedExcludeTermValues.length ? selectedExcludeTermValues.join(" / ") : "なし"}`,
      `- テーマ別検索クエリ候補: ${
        xQueryCandidates.length ? xQueryCandidates.map((candidate) => candidate.base || candidate.query || candidate.label).join(" / ") : "なし"
      }`,
      `- テーマ別ハッシュタグ候補: ${
        hashtagCandidates.length ? hashtagCandidates.map((candidate) => `${candidate.hashtag}:${candidate.selectionType}`).join(" / ") : "なし"
      }`,
      `- personaMode変更履歴: ${
        personaModeHistory.length
          ? personaModeHistory
              .map((item) => `${formatHistoryDate(item.changedAt)} ${personaConfigFor(item.from).label}→${personaConfigFor(item.to).label}`)
              .join(" / ")
          : "なし"
      }`,
      `- 実行クエリ種別: ${queryKindLabel(selectedHashtagValues.length, effectiveQuery)}`,
      `- 選択クエリ候補: ${
        selectedXQueryCandidates.length > 0
          ? selectedXQueryCandidates.map((candidate) => candidate.label).join(" / ")
          : "なし"
      }`,
      `- 実行X検索クエリ: ${effectiveQuery || "なし"}`,
      `- 元クエリ: ${safeQueryPreview.rawQuery || "なし"}`,
      `- 整形後クエリ: ${safeQueryPreview.safeQuery || "なし"}`,
      `- 予備クエリ: ${safeQueryPreview.fallbackQuery || "なし"}`,
      `- 最終送信クエリ: ${safeQueryPreview.finalQueryForXApi || "なし"}`,
      `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.cautionTerms}: ${queryReviewParts.cautionTerms.length ? queryReviewParts.cautionTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.disabledTerms}: ${queryReviewParts.disabledTerms.length ? queryReviewParts.disabledTerms.join(" / ") : "なし"}`,
      `- クエリ長: ${safeQueryPreview.queryLength || 0}`,
      `- 最終送信クエリ長: ${safeQueryPreview.finalQueryLength || 0}`,
      `- 予備クエリ長: ${safeQueryPreview.fallbackQueryLength || 0}`,
      `- 整形時の注意: ${
        safeQueryPreview.queryBuildWarnings?.length ? safeQueryPreview.queryBuildWarnings.join(" / ") : "なし"
      }`,
      `- サニタイズ結果: ${
        safeQueryPreview.sanitizedHashtags?.length ? safeQueryPreview.sanitizedHashtags.join(" / ") : "なし"
      }`,
      `- 除外されたハッシュタグ: ${
        safeQueryPreview.sanitizedHashtagRemovedParts?.length
          ? safeQueryPreview.sanitizedHashtagRemovedParts
              .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
              .join(" / ")
          : "なし"
      }`,
      `- 整形後の除外語: ${
        safeQueryPreview.sanitizedExcludeTerms?.length ? safeQueryPreview.sanitizedExcludeTerms.join(" / ") : "なし"
      }`,
      `- 除外された除外語: ${
        safeQueryPreview.sanitizedExcludeRemovedParts?.length
          ? safeQueryPreview.sanitizedExcludeRemovedParts
              .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
              .join(" / ")
          : "なし"
      }`,
      `- X取得件数: ${xFetchCount}`,
      "- ボリューム定義: グラフの円サイズ・色は独立した類似意見数（independentOpinionVolume）だけを使います。",
      "- 拡散ボリューム: RT、同一コメント、コピペ、類似テンプレート投稿はspreadVolumeとして参考保持し、基本分析・グラフボリュームには採用しません。",
      "- 注意: このボリュームは世論調査や市場全体の量ではありません。今回取得できた分析対象内での相対的なまとまりです。",
      `- 分析モード: ${analysisMode === "axisDriven" ? "評価軸に合わせて取得する" : "広く探索する"}`,
      `- 評価軸連動キーワード: ${axisLinkedKeywords.all.length ? axisLinkedKeywords.all.join(" / ") : "なし"}`,
      `- 選択された評価軸連動キーワード: ${selectedAxisLinkedKeywords.length ? selectedAxisLinkedKeywords.join(" / ") : "なし"}`,
      "- 評価軸と検索クエリの噛み合い警告:",
      ...(queryAxisWarnings.length ? queryAxisWarnings.map((warning) => `  - ${warning}`) : ["  - なし"]),
      `- 評価軸プリセット: ${axisPresetLabel(axisConfig)}`,
      `- スコア表示方式: ${scoreDisplayModeLabel(scoreDisplayMode)}（実表示: ${scoreDisplayModeLabel(result.resolvedScoreDisplayMode)}）`,
      `- ノイズ除去: ${stats.noiseFilterEnabled ? "ON" : "OFF"}`,
      `- ノイズ除外件数: ${stats.noiseExcludedCount}`,
      `- 分析対象件数: ${stats.analysisTargetCount}`,
      `- 独立意見数: ${stats.independentOpinionCount}`,
      `- 独立意見率: ${formatPercent(stats.independentOpinionRate || 0)}`,
      `- 拡散参考数: ${stats.spreadReferenceCount}`,
      `- 拡散支配率: ${formatPercent(stats.spreadDominanceRate || 0)}`,
      `- 拡散テンプレート検出数: ${stats.spreadTemplateCount || 0}`,
      `- ノイズ除外理由: ${stats.noiseReasonSummary}`,
      `- 段階取得: ${stagedFetchEnabled ? "ON" : "OFF"}`,
      `- ユーザーmode自動取得: ${viewMode === "user" ? "ON" : "OFF"}`,
      `- ${JP_UI_LABELS.autoFetchSafetyLimit}: ${MAX_USER_AUTO_FETCH_ROUNDS}回以上。無限ループ防止用であり、取得件数の上限ではありません。`,
      `- 取得診断状態: ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}`,
      `- 取得診断判断: ${stagedFetchState.diagnosisDecision || "なし"}`,
      `- 目標件数: ${Number(xMaxResults) || 0}件`,
      `- 現在データ件数: ${stagedCurrentDataCount}件`,
      `- 残り取得可能件数: ${stagedRemainingCount}件`,
      `- 次回追加取得件数: ${stagedNextFetchCount}件`,
      `- X API取得累計件数: ${stagedFetchState.totalApiFetchedCount || stagedCurrentDataCount}件`,
      `- 改善クエリ追加取得回数: ${stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}`,
      `- このクエリのまま追加取得回数: ${stagedFetchState.continueRemainingCount || 0}`,
      `- 変更前クエリ: ${stagedFetchState.beforeQuery || "なし"}`,
      `- 変更後クエリ: ${stagedFetchState.afterQuery || "なし"}`,
      `- 停止理由: ${stopReasonLabel(stagedFetchState.stopReason)}`,
      "- 評価軸:",
      ...axisExplanationItems(axisConfig).flatMap((item) => [
        `  - ${item.axis.toUpperCase()} ${item.label}: ${item.description}`,
        `    - 高: ${item.high}`,
        `    - 低: ${item.low}`,
      ]),
      "- 評価軸品質チェック:",
      ...(axisQualityWarnings.length ? axisQualityWarnings.map((warning) => `  - ${warning}`) : ["  - 注意なし"]),
      "",
      "## スコア分布",
      "| 軸 | min | max | average | standardDeviation | uniqueScoreCount | mostCommonScore | mostCommonScoreRatio | 集中 |",
      "|---|---:|---:|---:|---:|---:|---:|---:|---|",
      ...["x", "y", "z"].map((axis) => {
        const statsForAxis = result.scoreDistribution?.[axis] || {};
        return `| ${escapeMarkdownTableCell(axisLabel(axis, axisConfig))} | ${statsForAxis.min ?? 0} | ${statsForAxis.max ?? 0} | ${Number(statsForAxis.average || 0).toFixed(2)} | ${Number(statsForAxis.standardDeviation || 0).toFixed(2)} | ${statsForAxis.uniqueScoreCount ?? 0} | ${statsForAxis.mostCommonScore ?? 0} | ${formatPercent(statsForAxis.mostCommonScoreRatio || 0)} | ${statsForAxis.concentrated ? "あり" : "なし"} |`;
      }),
      "",
      "## スコア集中アラート",
      ...(scoreConcentrationMessages.length ? scoreConcentrationMessages.map((message) => `- ${message}`) : ["- なし"]),
      "",
      "## グラフ表示",
      "- X/Y/Z: 現在の評価軸スコア",
      "- 青/赤の円: 外部意見クラスタ",
      "- 点の大きさ: volumeForGraph。原則として independentOpinionVolume と同じです。",
      "- 点の色: volumeForGraph（青=独立意見少、黄=中、赤=多）",
      "- spreadVolume: 拡散参考数として保持しますが、グラフの円サイズ・色には使いません。",
      "- ひし形: 自分の意見",
      "- 四角: 取得直後の平均、または分析対象クラスタの平均",
      "- クラスタ点クリック: Zone⑨の該当クラスタへ移動",
      "",
      "## ハッシュタグ自動選択",
      `- 自動選択状態: ${hasManualHashtagSelection ? "ユーザーが手動調整済み" : "推奨候補を最大3件まで自動選択"}`,
      `- 選択中: ${selectedHashtagValues.length ? selectedHashtagValues.join(" / ") : "なし"}`,
      `- 自動推奨候補: ${autoSelectedHashtagValues.length ? autoSelectedHashtagValues.join(" / ") : "なし"}`,
      `- 注意候補: ${hashtagCandidates.filter((candidate) => candidate.selectionType === "caution").map((candidate) => candidate.hashtag).join(" / ") || "なし"}`,
      `- 非推奨候補: ${hashtagCandidates.filter((candidate) => candidate.selectionType === "disabled").map((candidate) => candidate.hashtag).join(" / ") || "なし"}`,
      "",
      `## ${JP_UI_LABELS.queryReview}`,
      `- ${JP_UI_LABELS.analysisPurpose}: ${queryReviewParts.analysisPurposeLabel}`,
      `- ${JP_UI_LABELS.retrievalPolicy}: ${queryReviewParts.retrievalPolicy}`,
      `- ${JP_UI_LABELS.clusterPolicy}: ${queryReviewParts.clusterPolicy}`,
      `- ${JP_UI_LABELS.zone11Policy}: ${queryReviewParts.zone11Policy}`,
      `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.cautionTerms}: ${queryReviewParts.cautionTerms.length ? queryReviewParts.cautionTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.disabledTerms}: ${queryReviewParts.disabledTerms.length ? queryReviewParts.disabledTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.finalTrustedQuery}: ${queryReviewParts.finalQueryForXApi || "なし"}`,
      "",
      "## Zone⑫ 検証表示",
      ...zone12InspectionMarkdownLines,
      "",
      "## 検索クエリ候補",
      "| ラベル | 説明 | 検索式 |",
      "|---|---|---|",
      ...(xQueryCandidates.length > 0
        ? xQueryCandidates.map(
            (candidate) =>
              `| ${escapeMarkdownTableCell(candidate.label)} | ${escapeMarkdownTableCell(
                candidate.description || candidate.note || ""
              )} | ${escapeMarkdownTableCell(candidate.base || candidate.query || "")} |`
          )
        : ["| なし | なし | なし |"]),
      "",
      `## Zone⑪ ${zone11DisplayTitle}`,
      ...(personaMode === "personaA"
        ? [
            `### ${JP_UI_LABELS.empathy}`,
            ...userFeedback.personaSections.map(([title, body]) => `- ${title}: ${body}`),
            "",
            `### ${JP_UI_LABELS.analysisMemo}`,
            ...personaAAnalysisMemoItems().map(([label, value]) => `- ${label}: ${value}`),
          ]
        : userFeedback.personaSections.length
          ? userFeedback.personaSections.flatMap(([title, body], index) => [`- ${index + 1}. ${title}: ${body}`])
          : []),
      `- 今回の意見空間の傾向: ${userFeedback.overview}`,
      `- あなたの意見の位置づけ: ${userFeedback.userPosition}`,
      `- 外部意見とのズレ: ${userFeedback.gap}`,
      `- 評価軸と検索クエリの噛み合い: ${userFeedback.queryAxisFit}`,
      "- スコア分布の注意:",
      ...(scoreConcentrationMessages.length ? scoreConcentrationMessages.map((message) => `  - ${message}`) : ["  - 現在のクラスタでは大きな集中は検出されていません。"]),
      "- 近いクラスタ:",
      ...userFeedback.nearClusters.map(
        (cluster) => `  - ${cluster.label}: 距離 ${cluster.distance.toFixed(1)} / ${truncateText(cluster.title, 120)}`
      ),
      "- 遠いクラスタ:",
      ...userFeedback.farClusters.map(
        (cluster) => `  - ${cluster.label}: 距離 ${cluster.distance.toFixed(1)} / ${truncateText(cluster.title, 120)}`
      ),
      "- 足りない視点:",
      ...userFeedback.missingPerspectives.map((item) => `  - ${item}`),
      "- 次に考えるべき問い:",
      ...userFeedback.nextQuestions.map((question) => `  - ${question}`),
      "",
      "## 自分の意見",
      userOpinion || "（未入力）",
      "",
      "## X検索条件",
      effectiveQuery || xQuery || "（未入力）",
      "",
      "## ②ノイズ処理・クラスタ化 集計",
      "| 指標 | 値 |",
      "|---|---:|",
      `| 処理意見数 | ${stats.rawCount} |`,
      `| 正規化後ユニーク本文数 | ${stats.uniqueNormalizedCount} |`,
      `| 完全重複数 | ${stats.duplicateCount} |`,
      `| 独立意見数 | ${stats.independentOpinionCount} |`,
      `| 独立意見率 | ${formatPercent(stats.independentOpinionRate || 0)} |`,
      `| 拡散参考数 | ${stats.spreadReferenceCount} |`,
      `| 拡散支配率 | ${formatPercent(stats.spreadDominanceRate || 0)} |`,
      `| 拡散テンプレート検出数 | ${stats.spreadTemplateCount || 0} |`,
      `| RT風投稿数 | ${stats.retweetLikeCount} |`,
      `| RT本文抽出成功数 | ${stats.rtExtractSuccessCount} |`,
      `| URL付き投稿数 | ${stats.urlCount} |`,
      `| URL除去後本文あり数 | ${stats.urlTextRemainingCount} |`,
      `| 短すぎる投稿数 | ${stats.tooShortCount} |`,
      `| 取得診断状態 | ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} |`,
      `| 取得診断取得件数 | ${stagedFetchState.diagnosis?.fetchedCount ?? 0} |`,
      `| 取得診断分析対象件数 | ${stagedFetchState.diagnosis?.analysisCandidateCount ?? 0} |`,
      `| 取得診断ノイズ率 | ${formatPercent(stagedFetchState.diagnosis?.noiseRate ?? 0)} |`,
      `| 取得診断候補率 | ${formatPercent(stagedFetchState.diagnosis?.candidateRate ?? 0)} |`,
      `| 取得診断理由 | ${escapeMarkdownTableCell((stagedFetchState.diagnosis?.problemReasons || []).join(" / ") || "なし")} |`,
      `| 取得品質総合 | ${escapeMarkdownTableCell(qualityLabel(stats.retrievalKpi.overallRetrievalQuality))} |`,
      `| 取得品質メッセージ | ${escapeMarkdownTableCell(stats.retrievalKpi.message)} |`,
      `| 分析対象率 | ${formatPercent(stats.retrievalKpi.analysisCandidateRate)} |`,
      `| 重複/RT率 | ${formatPercent(stats.retrievalKpi.duplicateLikeRate)} |`,
      `| 多様性スコア | ${formatScore(stats.retrievalKpi.diversityScore)} |`,
      `| 読みやすさスコア | ${formatScore(stats.retrievalKpi.readLoadScore)} |`,
      `| コスト効率スコア | ${formatScore(stats.retrievalKpi.costEfficiencyScore)} |`,
      `| クラスタ数判定 | ${escapeMarkdownTableCell(stats.retrievalKpi.clusterJudgement.label)} |`,
      `| 境界意見件数 | ${stats.borderlineUsefulCount || 0} |`,
      `| 関連度しきい値 | ${noiseRelevanceThreshold} |`,
      `| ノイズ除去 | ${stats.noiseFilterEnabled ? "ON" : "OFF"} |`,
      `| ノイズ除外件数 | ${stats.noiseExcludedCount} |`,
      `| Persona A strict relevance | ${personaAStrict.enabled ? "ON" : "OFF"} |`,
      `| Persona A除外数 | ${personaAStrict.excludedCount || 0} |`,
      `| Persona A境界意見数 | ${personaAStrict.borderlineCount || 0} |`,
      `| Persona A上位除外カテゴリ | ${escapeMarkdownTableCell(personaATopExclusionCategories)} |`,
      `| ノイズ除外理由 | ${escapeMarkdownTableCell(stats.noiseReasonSummary)} |`,
      `| 分析対象候補数 | ${stats.candidateCount} |`,
      `| 処理後クラスタ数 | ${stats.clusterCount} |`,
      `| クラスタ方式 | ${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"} |`,
      `| 文字類似しきい値 | ${stats.threshold.toFixed(2)} |`,
      `| 意味類似しきい値 | ${semanticThreshold.toFixed(2)} |`,
      `| 意味クラスタ実行状態 | ${escapeMarkdownTableCell(semanticStatusText)} |`,
      `| 意味クラスタ数 | ${semanticClusterRows.length > 0 ? semanticClusterRows.length : "未実行"} |`,
      `| ノイズ除外ユニーク数 | ${stats.noiseExcludedUniqueCount} |`,
      `| 分析対象率 | ${formatPercent(stats.analysisTargetRate)} |`,
      `| クラスタ圧縮率 | ${formatPercent(stats.clusterCompressionRate)} |`,
      "",
      "## 取得品質診断",
      `- AI改善アドバイス: ${stagedFetchState.aiQueryAdvice?.diagnosisSummary || "なし"}`,
      `- 推奨クエリ: ${stagedFetchState.aiQueryAdvice?.recommendedQuery || stagedFetchState.recommendedQuery || "なし"}`,
      `- ユーザー向けメッセージ: ${stagedFetchState.aiQueryAdvice?.userMessage || "なし"}`,
      "",
      "### ノイズ分類内訳",
      "| 分類 | 件数 | 対策 |",
      "|---|---:|---|",
      ...((stagedFetchState.noiseBreakdown || []).length
        ? stagedFetchState.noiseBreakdown.map(
            (item) =>
              `| ${escapeMarkdownTableCell(item.label)} | ${item.count} | ${escapeMarkdownTableCell(item.advice)} |`
          )
        : ["| なし | 0 | なし |"]),
      "",
      "### 検索語ごとの診断",
      "| 検索語 | 状態 | 問題 | 対策 | 候補 |",
      "|---|---|---|---|---|",
      ...((stagedFetchState.queryTermDiagnosis || []).length
        ? stagedFetchState.queryTermDiagnosis.map(
            (item) =>
              `| ${escapeMarkdownTableCell(item.term)} | ${escapeMarkdownTableCell(item.status)} | ${escapeMarkdownTableCell(item.problem)} | ${escapeMarkdownTableCell(item.advice)} | ${escapeMarkdownTableCell(item.suggestion || "")} |`
          )
        : ["| なし | なし | なし | なし | なし |"]),
      "",
      "### AI改善アドバイスの主な問題",
      ...((stagedFetchState.aiQueryAdvice?.mainProblems || []).length
        ? stagedFetchState.aiQueryAdvice.mainProblems.map((problem) => `- ${problem}`)
        : ["- なし"]),
      "",
      "### 改善前後比較",
      "| 指標 | 改善前 | 改善後 |",
      "|---|---:|---:|",
      ...(stagedFetchState.improvementComparison
        ? [
            `| 分析対象 | ${stagedFetchState.improvementComparison.beforeAnalysisCandidateCount} | ${stagedFetchState.improvementComparison.afterAnalysisCandidateCount} |`,
            `| ノイズ率 | ${formatPercent(stagedFetchState.improvementComparison.beforeNoiseRate)} | ${formatPercent(stagedFetchState.improvementComparison.afterNoiseRate)} |`,
            `| 重複率 | ${formatPercent(stagedFetchState.improvementComparison.beforeDuplicateRate)} | ${formatPercent(stagedFetchState.improvementComparison.afterDuplicateRate)} |`,
          ]
        : ["| なし | 0 | 0 |"]),
      `- 次アクション: ${
        stagedFetchState.improvementComparison?.message ||
        (stagedFetchState.diagnosis?.recommendedNextActions || []).join(" / ") ||
        "なし"
      }`,
      "",
      "## 段階取得ログ",
      "| 回 | 方法 | 要求 | API返却数 | 取得本文数 | 新規追加数 | 重複スキップ数 | ノイズ除外数 | 分析対象数 | 追加後件数 | 残り | 停止理由 | 予備クエリ使用 | 警告 | クエリ |",
      "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|",
      ...((stagedFetchState.stageLogs || []).length
        ? stagedFetchState.stageLogs.map(
            (stage) =>
              `| ${stage.stageNo} | ${escapeMarkdownTableCell(stage.actionLabel)} | ${stage.requestedFetchCount ?? stage.currentBatchCount} | ${stage.apiReturnedCount ?? stage.currentBatchCount} | ${stage.rawFetchedCount ?? stage.apiReturnedCount ?? 0} | ${stage.newUniqueCount ?? stage.currentBatchCount} | ${stage.duplicateSkippedCount ?? 0} | ${stage.noiseRemovedCount ?? 0} | ${stage.analysisCandidateCount} | ${stage.addedToCurrentDataCount ?? stage.newUniqueCount ?? 0} | ${stage.remainingCount ?? 0} | ${escapeMarkdownTableCell(stopReasonLabel(stage.stopReason))} | ${stage.fallbackUsed ? "あり" : "なし"} | ${escapeMarkdownTableCell((stage.queryBuildWarnings || []).join(" / ") || "なし")} | ${escapeMarkdownTableCell(stage.query)} |`
          )
        : ["| 0 | 未実行 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 停止理由なし | false | なし | なし |"]),
      "",
      "### クエリビルダー詳細ログ",
      "| 回 | 整形状態 | 予備クエリ使用 | 再試行回数 | 元クエリ | 整形後クエリ | 予備クエリ | 最終送信クエリ | APIエラー | 除外されたハッシュタグ | 除外された除外語 | 整形時の注意 |",
      "|---:|---|---|---:|---|---|---|---|---|---|---|---|",
      ...((stagedFetchState.stageLogs || []).length
        ? stagedFetchState.stageLogs.map(
            (stage) =>
              `| ${stage.stageNo} | ${escapeMarkdownTableCell(queryBuildStatusLabel(stage.queryBuildStatus))} | ${stage.fallbackUsed ? "あり" : "なし"} | ${stage.retryCount || 0} | ${escapeMarkdownTableCell(stage.rawQuery || "")} | ${escapeMarkdownTableCell(stage.safeQuery || "")} | ${escapeMarkdownTableCell(stage.fallbackQuery || "")} | ${escapeMarkdownTableCell(stage.finalQueryForXApi || stage.query || "")} | ${escapeMarkdownTableCell(stage.apiErrorMessage || "")} | ${escapeMarkdownTableCell((stage.sanitizedHashtagRemovedParts || []).map((item) => `${item.input}->${item.output || "除外"}:${item.reason}`).join(" / ") || "なし")} | ${escapeMarkdownTableCell((stage.sanitizedExcludeRemovedParts || []).map((item) => `${item.input}->${item.output || "除外"}:${item.reason}`).join(" / ") || "なし")} | ${escapeMarkdownTableCell((stage.queryBuildWarnings || []).join(" / ") || "なし")} |`
          )
        : ["| 0 | 未実行 | false | 0 | なし | なし | なし | なし | なし | なし | なし | なし |"]),
      "",
      "## クラスタ一覧",
      `- 要約済みクラスタ数: ${summarizedCount}`,
      `- 未要約クラスタ数: ${unsummarizedCount}`,
      `| クラスタ | 独立意見数 | 拡散参考数 | グラフ反映 | ${scoreAxisHeader(axisLabels.x, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.y, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.z, scoreDisplayMode)} | XYZ評価理由 | スコア詳細 | スコア根拠 | 代表本文またはAI整理 |`,
      "|---|---:|---:|---:|---:|---:|---:|---|---|---|---|",
    ];

    if (clusterRows.length === 0) {
      lines.push("| なし | 0 | 0 | 0 |  |  |  |  |  |  | クラスタはありません |");
    } else {
      clusterRows.forEach((cluster) => {
        const volume = clusterVolumeFromRow(cluster);
        const summary = clusterSummaries[clusterSummaryKey(cluster)];
        const displayText = summary
          ? `${summary.title} / ${summary.cleanOpinion || summary.summary}`
          : cluster.opinion;
        const scoreDetail = [
          `表示方式:${scoreDisplayModeLabel(scoreDisplayMode)}`,
          `independentOpinionVolume:${volume.independent}`,
          `spreadVolume:${volume.spread}`,
          `volumeForGraph:${volume.graph}`,
          `表示:${getScoreTripletForDisplay(cluster, scoreDisplayMode)}`,
          `絶対:${cluster.absoluteScore?.x ?? cluster.x}/${cluster.absoluteScore?.y ?? cluster.y}/${cluster.absoluteScore?.z ?? cluster.z}`,
          `相対:${cluster.relativeScore?.x ?? cluster.x}/${cluster.relativeScore?.y ?? cluster.y}/${cluster.relativeScore?.z ?? cluster.z}`,
          `関連度:${cluster.relevanceScore ?? "-"}`,
          `信頼度:${cluster.scoreConfidence ?? "-"}`,
          `警告:${Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length ? cluster.scoreWarnings.join(" / ") : "なし"}`,
        ].join(" / ");
        lines.push(
          `| ${escapeMarkdownTableCell(cluster.label)} | ${volume.independent} | ${volume.spread} | ${volume.graph} | ${getScoreForDisplay(cluster, "x", scoreDisplayMode)} | ${getScoreForDisplay(cluster, "y", scoreDisplayMode)} | ${getScoreForDisplay(cluster, "z", scoreDisplayMode)} | ${escapeMarkdownTableCell(["x", "y", "z"].map((axis) => scoreReasonMarkdown(cluster, axis)).join(" / "))} | ${escapeMarkdownTableCell(scoreDetail)} | ${escapeMarkdownTableCell(scoreBasisLabel(cluster.scoreBasis))} | ${escapeMarkdownTableCell(displayText)} |`
        );
      });
    }

    lines.push("", "## クラスタ別 元意見一覧");

    if (clusterRows.length === 0) {
      lines.push("クラスタはありません。");
    } else {
      clusterRows.forEach((cluster) => {
        const members = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];
        lines.push("", `### ${escapeMarkdownTableCell(cluster.label)} 元意見 ${members.length}件`);

        if (members.length === 0) {
          lines.push("元意見はありません。");
          return;
        }

        members.slice(0, 5).forEach((member, index) => {
          const meta = `No.${member.no || index + 1} / id:${member.id || "-"} / duplicateCount:${member.duplicateCount || 1}`;
          lines.push(`${index + 1}. ${escapeMarkdownTableCell(meta)} - ${escapeMarkdownTableCell(member.text)}`);
        });

        if (members.length > 5) {
          lines.push(`...ほか${members.length - 5}件`);
        }
      });
    }

    const summarizedClusters = clusterRows
      .map((cluster) => ({
        cluster,
        summary: clusterSummaries[clusterSummaryKey(cluster)],
      }))
      .filter((item) => item.summary);

    if (summarizedClusters.length > 0) {
      lines.push("", "## クラスタAI整理結果");

      summarizedClusters.forEach(({ cluster, summary }) => {
        lines.push("", `### ${escapeMarkdownTableCell(cluster.label)} ${escapeMarkdownTableCell(summary.title)}`);
        lines.push("要約：", escapeMarkdownTableCell(summary.summary), "");
        lines.push("整文済み意見：", escapeMarkdownTableCell(summary.cleanOpinion), "");

        if (Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0) {
          lines.push("主要論点：");
          summary.keyPoints.forEach((point) => {
            lines.push(`- ${escapeMarkdownTableCell(point)}`);
          });
        }

        if (Array.isArray(summary.cautions) && summary.cautions.length > 0) {
          lines.push("注意点：");
          summary.cautions.forEach((caution) => {
            lines.push(`- ${escapeMarkdownTableCell(caution)}`);
          });
        }

        lines.push(
          "",
          "スコアリング：",
          `- 対象文：${escapeMarkdownTableCell(summary.scoreBasis || cluster.scoreBasis || "representativeText")}`,
          `- independentOpinionVolume：${clusterVolumeFromRow(cluster).independent}`,
          `- spreadVolume：${clusterVolumeFromRow(cluster).spread}`,
          `- volumeForGraph：${clusterVolumeFromRow(cluster).graph}`,
          `- X/Y/Z：${getScoreTripletForDisplay(cluster, scoreDisplayMode)}`,
          `- 元スコア：${cluster.originalScore?.x ?? "-"} / ${cluster.originalScore?.y ?? "-"} / ${cluster.originalScore?.z ?? "-"}`,
          `- 関連度：${cluster.relevanceScore ?? "-"}`,
          `- 信頼度：${cluster.scoreConfidence ?? "-"}`,
          `- 警告：${Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length ? escapeMarkdownTableCell(cluster.scoreWarnings.join(" / ")) : "なし"}`,
          `- スコア根拠：${escapeMarkdownTableCell(scoreBasisLabel(cluster.scoreBasis))}`,
          `- XYZ評価理由：${escapeMarkdownTableCell(["x", "y", "z"].map((axis) => scoreReasonMarkdown(cluster, axis)).join(" / "))}`,
          "",
          "要約元の意見："
        );

        const sourceItems = Array.isArray(summary.sourceItems) ? summary.sourceItems : [];
        if (sourceItems.length === 0) {
          lines.push("要約元の意見は保存されていません。");
        } else {
          sourceItems.slice(0, 10).forEach((item, index) => {
            lines.push(
              `${index + 1}. id:${escapeMarkdownTableCell(item.id || "-")} / duplicateCount:${item.duplicateCount || 1}`,
              `   ${escapeMarkdownTableCell(truncateText(item.text, 500))}`
            );
          });
        }
      });
    }

    lines.push(
      "",
      "## 意見一覧 上位20件",
      `| No | 種別 | ラベル | ${scoreAxisHeader(axisLabels.x, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.y, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.z, scoreDisplayMode)} | 本文 |`,
      "|---:|---|---|---:|---:|---:|---|"
    );

    if (opinionRows.length === 0) {
      lines.push("| 0 | なし |  |  |  |  | 意見はありません |");
    } else {
      opinionRows.forEach((row, index) => {
        lines.push(
          `| ${index + 1} | ${escapeMarkdownTableCell(row.group)} | ${escapeMarkdownTableCell(row.label)} | ${getScoreForDisplay(row, "x", scoreDisplayMode)} | ${getScoreForDisplay(row, "y", scoreDisplayMode)} | ${getScoreForDisplay(row, "z", scoreDisplayMode)} | ${escapeMarkdownTableCell(row.opinion)} |`
        );
      });
    }

    return gateAnalysisMarkdown(lines.join("\n"), viewMode);
}

