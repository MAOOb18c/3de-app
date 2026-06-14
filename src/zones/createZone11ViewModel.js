function distance3d(a, b) {
  return Math.sqrt(
    Math.pow((a?.x || 0) - (b?.x || 0), 2) +
      Math.pow((a?.y || 0) - (b?.y || 0), 2) +
      Math.pow((a?.z || 0) - (b?.z || 0), 2)
  );
}

function strongestAxis(score) {
  const entries = [
    ["x", score?.x || 0],
    ["y", score?.y || 0],
    ["z", score?.z || 0],
  ].sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}

function weakestAxis(score) {
  const entries = [
    ["x", score?.x || 0],
    ["y", score?.y || 0],
    ["z", score?.z || 0],
  ].sort((a, b) => a[1] - b[1]);

  return entries[0][0];
}

export function buildUserFeedback({
  personaMode = "dev",
  analysisPurposeMode = "position",
  sampleKey,
  themeCategory,
  personaUxLens,
  theme,
  axisConfig,
  userScore,
  clusters,
  processedAverage,
  activeClusterMethod,
  effectiveQuery,
  queryAxisWarnings,
  selectedAxisLinkedKeywords,
  scoreMode = "relative",
  noiseProcessingResult,
  axisLabel,
  getScoreForDisplay,
  scoreDisplayModeLabel,
  truncateText,
  personaConfigFor,
  analysisPurposeConfigFor,
  JP_UI_LABELS,
}) {
  const axisNames = {
    x: axisLabel("x", axisConfig),
    y: axisLabel("y", axisConfig),
    z: axisLabel("z", axisConfig),
  };
  const rows = Array.isArray(clusters) ? clusters : [];
  const noiseStats = noiseProcessingResult || {};
  const hasZeroAnalysisTarget =
    (noiseStats.analysisTargetCount ?? noiseStats.candidateCount ?? rows.length) === 0 &&
    ((noiseStats.rawCount || 0) > 0 || rows.length === 0);
  const noiseSummary =
    noiseStats.noiseFilterEnabled === false
      ? "ノイズ除去はOFFです。分析対象には短文・重複整理後の候補をそのまま使っています。"
      : `ノイズ除去はONです。${noiseStats.noiseExcludedCount || 0}件を除外し、${noiseStats.analysisTargetCount ?? noiseStats.candidateCount ?? 0}件を分析対象にしています。主な理由: ${noiseStats.noiseReasonSummary || "なし"}。`;
  const displayUserScore = {
    x: getScoreForDisplay(userScore, "x", scoreMode),
    y: getScoreForDisplay(userScore, "y", scoreMode),
    z: getScoreForDisplay(userScore, "z", scoreMode),
  };
  const externalAverage =
    processedAverage && processedAverage.x + processedAverage.y + processedAverage.z > 0
      ? {
          x: getScoreForDisplay(processedAverage, "x", scoreMode),
          y: getScoreForDisplay(processedAverage, "y", scoreMode),
          z: getScoreForDisplay(processedAverage, "z", scoreMode),
        }
      : rows.length > 0
        ? {
            x: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "x", scoreMode), 0) / rows.length),
            y: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "y", scoreMode), 0) / rows.length),
            z: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "z", scoreMode), 0) / rows.length),
          }
        : { x: 0, y: 0, z: 0 };
  const diffs = ["x", "y", "z"].map((axis) => ({
    axis,
    value: (displayUserScore?.[axis] || 0) - (externalAverage?.[axis] || 0),
  }));
  const strongestUserAxis = strongestAxis(displayUserScore);
  const weakestUserAxis = weakestAxis(displayUserScore);
  const strongestExternalAxis = strongestAxis(externalAverage);
  const largestGap = [...diffs].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  const sortedByDistance = rows
    .map((cluster) => {
      const displayClusterScore = {
        x: getScoreForDisplay(cluster, "x", scoreMode),
        y: getScoreForDisplay(cluster, "y", scoreMode),
        z: getScoreForDisplay(cluster, "z", scoreMode),
      };

      return {
        label: cluster.label,
        title: cluster.opinion,
        count: cluster.count || 1,
        distance: distance3d(displayUserScore, displayClusterScore),
        ...displayClusterScore,
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const nearClusters = sortedByDistance.slice(0, 3);
  const farClusters = sortedByDistance.slice(-3).reverse();
  const themeHints = {
    housing:
      "このテーマでは、生活負担や市場構造、長期的な住まいの価値を分けて見ることが重要です。",
    coding:
      "このテーマでは、学習者のつまずき、授業運営、改善アクションを分けて見ることが重要です。",
    religion:
      "このテーマでは、宗教が個人の救いや精神性として語られているのか、社会摩擦・制度リスクとして語られているのかの差が重要です。",
    democracy:
      "このテーマでは、多数派の量だけでなく、熟議の深さや未来の制度設計への視点を見ることが重要です。",
    romance:
      "このテーマでは、感情や承認だけでなく、現実の関係性や自己理解の深さを見ることが重要です。",
  };
  const resolvedThemeCategory = themeCategory || personaUxLens?.themeCategory || sampleKey;
  const overview =
    hasZeroAnalysisTarget
      ? "今回は分析に使える意見が残りませんでした。Xから投稿は取得できましたが、関連度や視認性の条件で除外された可能性があります。検索語・除外語・ハッシュタグを調整してください。"
      : rows.length === 0
      ? "外部クラスタがまだないため、意見空間の傾向は仮表示です。X取得またはクラスタリング後に、より具体的な比較ができます。"
      : `今回の意見空間では、${activeClusterMethod}で${rows.length}件のクラスタが表示されています。外部意見群の平均は ${axisNames.x}=${externalAverage.x}、${axisNames.y}=${externalAverage.y}、${axisNames.z}=${externalAverage.z} です。近い/遠いクラスタの判定は${scoreDisplayModeLabel(scoreMode)}に基づいています。${noiseSummary}${themeHints[resolvedThemeCategory] || ""}`;
  const userPosition = `あなたの意見は ${axisNames.x}=${displayUserScore.x}、${axisNames.y}=${displayUserScore.y}、${axisNames.z}=${displayUserScore.z} です。特に ${axisNames[strongestUserAxis]} の方向が強く出ています。`;
  const gap =
    hasZeroAnalysisTarget
      ? "今回は比較できる外部意見が残っていないため、あなたの意見との位置関係は表示していません。参考表示として、取得投稿の一部を確認できます。"
      : rows.length === 0
      ? "外部意見とのズレは、クラスタ生成後に表示されます。"
      : largestGap.value >= 0
        ? `外部意見群と比べると、あなたの意見は ${axisNames[largestGap.axis]} の方向に ${Math.abs(largestGap.value)} ポイント強く寄っています。`
        : `外部意見群と比べると、あなたの意見は ${axisNames[largestGap.axis]} の方向が ${Math.abs(largestGap.value)} ポイント低く、ここにズレがあります。`;
  const missingPerspectives = [
    `${axisNames[weakestUserAxis]} の観点を補うと、意見の射程が広がります。`,
    strongestExternalAxis !== strongestUserAxis
      ? `外部意見では ${axisNames[strongestExternalAxis]} が相対的に強いため、この視点を取り込むとSNS上の問題意識に接続しやすくなります。`
      : `あなたの強い軸と外部意見の強い軸は近いため、具体例や制度・生活への接続を増やすと説得力が出ます。`,
  ];
  const nextQuestions = [
    `${axisNames[strongestUserAxis]} を、${axisNames[weakestUserAxis]} とどう接続できるか？`,
    `${axisNames[strongestExternalAxis]} の視点を取り入れると、自分の意見はどう変わるか？`,
    "少数派の深い視点と、多数派が感じている不安やリスクをどう両立できるか？",
  ];
  const queryAxisFit =
    queryAxisWarnings?.length > 0
      ? `${queryAxisWarnings[0]} 評価軸を主軸に見るなら、関連キーワードを追加して再取得すると差が出やすくなります。`
      : selectedAxisLinkedKeywords?.length > 0
        ? `今回の検索クエリには、評価軸連動キーワード（${selectedAxisLinkedKeywords.join(" / ")}）が含まれています。評価軸に沿った意見差を拾いやすい設計です。`
        : `今回の検索クエリは「${truncateText(effectiveQuery, 120)}」です。広く探索する設計ですが、特定軸で差を出したい場合は評価軸連動キーワードを追加してください。`;
  const personaConfig = personaConfigFor(personaMode);
  const purposeConfig = analysisPurposeConfigFor(analysisPurposeMode, personaMode);
  const nearClusterText = nearClusters.length
    ? nearClusters.map((cluster) => `${cluster.label}: ${truncateText(cluster.title, 70)}`).join(" / ")
    : "外部の声を取得すると表示されます。";
  const farClusterText = farClusters.length
    ? farClusters.map((cluster) => `${cluster.label}: ${truncateText(cluster.title, 70)}`).join(" / ")
    : "外部の声を取得すると表示されます。";
  const personaALowRetrievalNote = noiseStats.personaAStrictRelevance?.referenceDisplay
    ? "今回は、恋愛相談として自然に読める声だけを残したため、読める声は少なめです。関係の薄い投稿を混ぜるより、安心して読める声を優先しています。"
    : "";
  const basePersonaASections =
    resolvedThemeCategory === "romance"
      ? {
          feeling: [JP_UI_LABELS.feelingSummary, `あなたの悩みは、${axisNames[strongestUserAxis]}が強く出ている状態に近いようです。まずはその気持ちを否定せず、何が不安なのかを分けて見てみましょう。${personaALowRetrievalNote}`],
          similar: [JP_UI_LABELS.similarVoices, `近い声: ${nearClusterText}`],
          different: [JP_UI_LABELS.differentVoices, `こういう見方もあります: ${farClusterText}`],
          trends: [JP_UI_LABELS.concernTrends, `今回の声では、${axisNames[strongestExternalAxis]}に寄った悩みが目立ちます。`],
          easier: [JP_UI_LABELS.easierPerspective, "相手の気持ちを決めつけず、返信頻度・会った時の態度・自分が言えることを分けて考えると少し楽になります。"],
          next: [JP_UI_LABELS.nextQuestions, nextQuestions[0]],
        }
      : {
          feeling: [JP_UI_LABELS.feelingSummary, `${theme}について、あなたの意見は${axisNames[strongestUserAxis]}の観点が強く出ています。まず不安や違和感を、生活への影響・制度や市場の背景・将来への見通しに分けて見てみましょう。`],
          similar: ["あなたの意見に近い考え", `近い考え: ${nearClusterText}`],
          different: ["違う立場の考え", `違う立場の考え: ${farClusterText}`],
          trends: ["多い意見の傾向", `今回の声では、${axisNames[strongestExternalAxis]}に寄った関心が目立ちます。`],
          easier: [JP_UI_LABELS.easierPerspective, "感情、生活条件、長期的な判断を分けると、いま何を心配していて、何を調べればよいかが見えやすくなります。"],
          next: [JP_UI_LABELS.nextQuestions, nextQuestions[0]],
        };
  const personaASections =
    hasZeroAnalysisTarget
      ? [
          ["今回は分析に使える意見が残りませんでした", "Xから投稿は取得できましたが、関連度や視認性の条件で除外されました。"],
          ["次に試すこと", "検索語・除外語・ハッシュタグを調整して、もう一度取得してください。"],
          ["参考表示", "必要なら、取得投稿の一部を見て検索条件を見直せます。"],
        ]
      : analysisPurposeMode === "debate"
      ? [basePersonaASections.different, basePersonaASections.feeling, basePersonaASections.trends, basePersonaASections.similar, basePersonaASections.easier, basePersonaASections.next]
      : analysisPurposeMode === "advice"
        ? [basePersonaASections.easier, basePersonaASections.next, basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.different, basePersonaASections.trends]
        : analysisPurposeMode === "position"
          ? [basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.different, basePersonaASections.trends, [JP_UI_LABELS.retrievalPolicy, purposeConfig.retrievalPolicy], basePersonaASections.next]
          : [basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.easier, basePersonaASections.different, basePersonaASections.trends, basePersonaASections.next];
  const personaSections =
    personaMode === "personaA"
      ? personaASections
      : personaMode === "personaB"
        ? [
            ["今回の論点分布", overview],
            ["読者が反応している悩み", `${axisNames[strongestExternalAxis]}に近い投稿が反応入口になりそうです。`],
            ["自分の意見のポジション", userPosition],
            ["発信するなら刺さりそうな切り口", `まず${axisNames[strongestExternalAxis]}で共感入口を作り、次に${axisNames[strongestUserAxis]}の自分の視点へ展開すると届きやすくなります。`],
            ["投稿タイトル案", `${theme}で本当に見落とされていること / ${theme}にモヤモヤする人へ / ${theme}はなぜ変わらないのか`],
            ["note / X / ショート動画向けの使い分け", "Xは共感入口、noteは構造整理、ショート動画は一つの違和感に絞ると使いやすいです。"],
            ["炎上・誤解リスク", "断定しすぎると反発を招きやすいため、反対側の声も一度受け止める構成が安全です。"],
            ["次に深掘りすべき問い", nextQuestions[1]],
          ]
        : personaMode === "personaC"
          ? [
              ["困りごとの分類", `今回の困りごとは、${axisNames[strongestExternalAxis]}に寄ったものが目立ちます。`],
              ["対応優先度", `${axisNames.z}が高いクラスタから対応すると、離脱や不満の予防につながります。`],
              ["多くの人に起きている問題", `近いクラスタ: ${nearClusterText}`],
              ["個別フォローが必要な問題", `少し離れたクラスタ: ${farClusterText}`],
              ["次回授業で補足すべきこと", "最初に共通のつまずきを10分だけ扱い、質問例と確認手順を配ると改善しやすいです。"],
              ["教材・FAQに追加すべき内容", "エラー文の読み方、質問テンプレート、環境構築で止まった時の確認リストを追加してください。"],
              ["講師へのアクションリスト", "多い困りごとを先に説明し、個別事情は授業後フォローに分けると運営しやすくなります。"],
              ["運営改善案", "初回に前提知識チェックを入れ、つまずきやすい人向けの補助資料を用意してください。"],
            ]
          : [];

  return {
    personaMode,
    analysisPurposeMode,
    feedbackTitle: personaConfig.feedbackTitle,
    personaSections,
    overview,
    userPosition,
    gap,
    queryAxisFit,
    nearClusters,
    farClusters,
    missingPerspectives,
    nextQuestions,
    noiseSummary,
    theme,
  };
}

export function createZone11ViewModel({
  viewMode,
  result,
  currentOpinionCount,
  selectedVoiceDirections,
  currentAnalysisPurposeConfig,
  stagedFetchState,
  JP_UI_LABELS,
  NOISE_CATEGORY_LABELS,
  normalizeVoiceDirections,
  voiceDirectionLabel,
  queryDiagnosisLabel,
}) {
  const userReferenceGraphWarning =
    viewMode === "user" &&
    (result.noiseProcessingResult.analysisTargetCount < 10 ||
      result.noiseProcessingResult.personaAStrictRelevance?.referenceDisplay ||
      result.clusterTableRows.length < 5 ||
      result.noiseProcessingResult.independentOpinionCount < 8);
  const hasDisplayedPostsWithoutAnalysisTargets =
    result.noiseProcessingResult.analysisTargetCount === 0 && currentOpinionCount > 0;

  const userReferenceGraphMessage =
    hasDisplayedPostsWithoutAnalysisTargets
      ? "Xから投稿は取得・表示されていますが、現在の条件では比較に使える外部意見が残っていません。境界またはノイズとして判定された投稿はZone⑫で確認できます。グラフには、分析対象として採用された外部意見だけを表示します。"
      : result.noiseProcessingResult.personaAStrictRelevance?.enabled
      ? `今回の分析対象は${result.noiseProcessingResult.analysisTargetCount}件です。今回は、恋愛相談として自然に読める意見だけを残したため参考表示です。関係の薄い投稿を混ぜるより、安心して読める声を優先しています。`
      : `今回の分析対象は${result.noiseProcessingResult.analysisTargetCount}件です。` +
        "このグラフは市場全体や世論の傾向ではなく、取得できた少数の意見の配置を示す参考表示です。" +
        "より信頼できる意見空間を作るには、取得条件の改善が必要です。";

  function personaAAnalysisMemoItems() {
    const strict = result.noiseProcessingResult.personaAStrictRelevance || {};
    const normalizedDirections = normalizeVoiceDirections(selectedVoiceDirections);
    const preferredNextDirections = ["personalExperiences", "opposingOpinions", "adviceHints", "differentViewpoints", "values", "empatheticVoices"];
    const missingDirections = preferredNextDirections.filter((direction) => !normalizedDirections.includes(direction));
    const suggestedDirections = (result.noiseProcessingResult.analysisTargetCount < 10 ? missingDirections.slice(0, 2) : []).map(voiceDirectionLabel);
    const suggestedQueryDirections = (result.noiseProcessingResult.analysisTargetCount < 10 ? missingDirections.slice(0, 2) : []).map(voiceDirectionLabel);
    const topCategories = Object.entries(strict.exclusionCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
      .join(" / ");

    return [
      [JP_UI_LABELS.analysisPurpose, currentAnalysisPurposeConfig.label],
      [JP_UI_LABELS.retrievalPolicy, currentAnalysisPurposeConfig.retrievalPolicy],
      [JP_UI_LABELS.clusterPolicy, currentAnalysisPurposeConfig.clusterPolicy],
      [JP_UI_LABELS.zone11Policy, currentAnalysisPurposeConfig.zone11Policy],
      [JP_UI_LABELS.usedOpinions, `${result.noiseProcessingResult.analysisTargetCount}件`],
      [JP_UI_LABELS.excludedPosts, `${result.noiseProcessingResult.noiseExcludedCount}件`],
      [JP_UI_LABELS.borderlineOpinions, `${strict.borderlineCount || 0}件`],
      [JP_UI_LABELS.referenceDisplay, strict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"],
      [JP_UI_LABELS.retrievalQuality, `${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / ${result.noiseProcessingResult.retrievalKpi.message}`],
      [JP_UI_LABELS.voicesToCollect, normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")],
      ["Persona A strict relevance", strict.enabled ? "ON" : "OFF"],
      ["Top exclusion categories", topCategories || "なし"],
      [JP_UI_LABELS.queryAdjustment, normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")],
      [JP_UI_LABELS.missingVoiceDirections, suggestedDirections.join(" / ") || "なし"],
      [JP_UI_LABELS.suggestedNextQueryDirection, suggestedQueryDirections.join(" / ") || "なし"],
      [JP_UI_LABELS.clusterQuality, result.noiseProcessingResult.retrievalKpi.clusterJudgement.message],
    ];
  }

  return {
    userReferenceGraphWarning,
    userReferenceGraphMessage,
    personaAAnalysisMemoItems,
  };
}
