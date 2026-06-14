export function createQueryDiagnosticsModel({
  DEFAULT_ADD_FETCH_COUNT,
  GENERIC_QUERY_TERMS,
  MIN_ADD_FETCH_COUNT,
  NOISE_CATEGORY_LABELS,
  NOISE_RELEVANCE_THRESHOLD,
  buildNoiseProcessingResult,
  buildRetrievalKpi,
  buildSafeXQuery,
  calculateScoreDistribution,
  clusterOpinionsByText,
  extractFallbackKeywords,
  formatNoiseReasonCounts,
  formatPercent,
  makeClusterRepresentative,
  normalizeHashtag,
  normalizeOpinionText,
  queryToSafeIncludeGroups,
  stripXCommonFilters,
  uniqueValues,
}) {
function detectGenericKeywordWarnings(query, theme, userOpinion) {
  const source = stripXCommonFilters(query);
  const themeText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const tokens = source
    .split(/\s+OR\s+|\s+|\(|\)|　/gi)
    .map((token) => token.trim())
    .filter(Boolean);

  return uniqueValues(
    tokens.filter((token) => GENERIC_QUERY_TERMS.includes(token) && !themeText.includes(token))
  ).map((term) => `「${term}」が単独汎用語として使われています。テーマ語と組み合わせてください。`);
}

function splitQueryTerms(query) {
  return stripXCommonFilters(query)
    .replace(/[()]/g, " ")
    .split(/\s+OR\s+/i)
    .map((term) => term.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function diagnoseQueryTerms(query, theme, userOpinion) {
  const themeText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const terms = splitQueryTerms(query);
  const broadTerms = ["投票", "SNS", "エラー", "構造", "制度", "相談", "体験", "意見", "学習", "教育", "成長", "変化", "不安"];

  return terms.map((term) => {
    const normalized = normalizeOpinionText(term);
    const compact = normalized.replace(/\s+/g, "");
    const isBroad = broadTerms.includes(compact) || GENERIC_QUERY_TERMS.includes(compact);
    const isThemeBound = themeText.includes(compact) || normalized.includes(" ") || normalized.length >= 6;

    if (isBroad && !isThemeBound) {
      return {
        term,
        status: "too_broad",
        problem: "単独では広すぎる検索語です。",
        advice: `「${term}」をテーマ語と組み合わせてください。`,
        action: "narrow_with_and",
        suggestion: `${extractFallbackKeywords(theme, userOpinion)[0] || theme} ${term}`,
      };
    }

    if (/投票|SNS|エラー|構造|制度/.test(compact) && !normalized.includes(" ")) {
      return {
        term,
        status: "collision",
        problem: "別文脈の投稿も拾いやすい多義語です。",
        advice: `「${term}」だけでなく、政治・テーマ語を足して絞ってください。`,
        action: "narrow_with_and",
        suggestion: `${extractFallbackKeywords(theme, userOpinion)[0] || theme} ${term}`,
      };
    }

    if (normalized.length <= 2 && !themeText.includes(compact)) {
      return {
        term,
        status: "thin",
        problem: "短すぎて検索意図が伝わりにくい語です。",
        advice: "周辺語を追加するか、削除を検討してください。",
        action: "add_theme_word",
        suggestion: `${term} ${extractFallbackKeywords(theme, userOpinion)[0] || ""}`.trim(),
      };
    }

    return {
      term,
      status: "ok",
      problem: "テーマに比較的近い検索語です。",
      advice: "この語は残してよさそうです。",
      action: "keep",
      suggestion: term,
    };
  });
}

function noiseCategoryAdvice(category) {
  const advice = {
    promotion_or_ad: "PR、キャンペーン、紹介、無料、登録などを除外語に追加してください。",
    duplicate_or_repost: "RT除外を強め、重複本文を1件にまとめてください。",
    spread_template: "定型文・キャンペーン文の拡散です。独立意見数には加算せず、参考値として確認してください。",
    coordinated_campaign_suspected: "同じ呼びかけが集中しています。組織的拡散の可能性があるため、意見ボリュームから切り分けてください。",
    duplicate_like_spread: "末尾違いなどの類似コピー投稿です。1件の意見テンプレートとして圧縮してください。",
    unrelated_topic: "OR条件に広すぎる語が混じっている可能性があります。問題語を削るか、テーマ語と組み合わせてください。",
    broad_keyword_noise: "一般語を単独で使わず、テーマ語とのAND的な組み合わせにしてください。",
    query_term_collision: "多義語を単独で使わず、文脈語を足してください。",
    low_relevance: "検索語をテーマに近い名詞句へ寄せるか、関連度しきい値を一時的に下げて確認してください。",
    url_only_or_too_short: "URL付き投稿除外や短文除外を強めてください。",
  };

  return advice[category] || "該当カテゴリを生む検索語を削るか、テーマ語を足して絞ってください。";
}

function buildNoiseBreakdown(diagnosis) {
  return Object.entries(diagnosis?.noiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: NOISE_CATEGORY_LABELS[category] || category,
      count,
      advice: noiseCategoryAdvice(category),
    }));
}

function buildCombinedNoiseReasonCounts(stats) {
  const counts = { ...(stats?.noiseReasonCounts || {}) };
  const duplicateLikeCount = (Number(stats?.duplicateCount) || 0) + (Number(stats?.retweetLikeCount) || 0);
  const spreadTemplateCount = Number(stats?.spreadTemplateCount) || 0;
  const shortOrUrlOnlyCount =
    (Number(stats?.tooShortCount) || 0) +
    Math.max(0, (Number(stats?.urlCount) || 0) - (Number(stats?.urlTextRemainingCount) || 0));

  if (duplicateLikeCount > 0) {
    counts.duplicate_or_repost = (counts.duplicate_or_repost || 0) + duplicateLikeCount;
  }
  if (spreadTemplateCount > 0) {
    counts.spread_template = (counts.spread_template || 0) + spreadTemplateCount;
  }
  if (shortOrUrlOnlyCount > 0) {
    counts.url_only_or_too_short = (counts.url_only_or_too_short || 0) + shortOrUrlOnlyCount;
  }

  return counts;
}

function buildRecommendedNextActions(noiseBreakdown, queryTermDiagnosis, diagnosis) {
  const actions = [];
  const topNoise = noiseBreakdown?.[0];
  const weakTerms = (queryTermDiagnosis || []).filter((item) => item.status !== "ok");

  if (topNoise) {
    actions.push(`${topNoise.label}が多いです。${topNoise.advice}`);
  }
  if (weakTerms.length > 0) {
    actions.push(`検索語「${weakTerms[0].term}」を見直してください。${weakTerms[0].advice}`);
  }
  if ((diagnosis?.analysisCandidateCount || 0) < 5) {
    actions.push("分析対象が5件未満です。改善クエリで追加取得してからクラスタリングしてください。");
  }
  if (actions.length === 0) {
    actions.push("このクエリのまま追加取得できます。必要に応じて改善候補も比較してください。");
  }

  return actions;
}

function diagnoseQueryQuality(
  posts,
  query,
  sampleKey,
  axisConfig,
  noiseFilterEnabled,
  theme,
  userOpinion,
  relevanceThreshold = NOISE_RELEVANCE_THRESHOLD
) {
  const texts = (Array.isArray(posts) ? posts : [])
    .map((post) => String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const stats = buildNoiseProcessingResult(texts, sampleKey, axisConfig, noiseFilterEnabled, relevanceThreshold);
  const diagnosticClusters = clusterOpinionsByText(stats.candidateRows || [], 0.35).map((cluster, index) =>
    makeClusterRepresentative(cluster, index, sampleKey, axisConfig)
  );
  const diagnosticScoreDistribution = calculateScoreDistribution(diagnosticClusters);
  const retrievalKpi = buildRetrievalKpi(stats, diagnosticClusters, diagnosticScoreDistribution);
  const normalizedCount = stats.uniqueNormalizedCount || 0;
  const fetchedCount = texts.length;
  const duplicateRate = fetchedCount > 0 ? stats.duplicateCount / fetchedCount : 0;
  const duplicateLikeCount = stats.duplicateLikeCount || 0;
  const noiseCount = stats.noiseExcludedCount || 0;
  const noiseRate = normalizedCount > 0 ? noiseCount / normalizedCount : 0;
  const analysisCandidateCount = stats.analysisTargetCount || stats.candidateCount || 0;
  const candidateRate = normalizedCount > 0 ? analysisCandidateCount / normalizedCount : 0;
  const independentOpinionCount = stats.independentOpinionCount || analysisCandidateCount;
  const independentOpinionRate = fetchedCount > 0 ? independentOpinionCount / fetchedCount : 0;
  const spreadReferenceCount = stats.spreadReferenceCount || duplicateLikeCount;
  const spreadDominanceRate = fetchedCount > 0 ? spreadReferenceCount / fetchedCount : 0;
  const scoredRows = [...(stats.candidateRows || []), ...(stats.noiseExcludedRows || [])];
  const relevanceGoodCount = scoredRows.filter((row) => Number(row.relevanceScore) >= 5).length;
  const relevanceWeakCount = scoredRows.filter((row) => Number(row.relevanceScore) >= 3 && Number(row.relevanceScore) <= 4).length;
  const relevanceBadCount = scoredRows.filter((row) => Number(row.relevanceScore) <= 2).length;
  const genericKeywordWarnings = detectGenericKeywordWarnings(query, theme, userOpinion);
  const combinedNoiseReasonCounts = buildCombinedNoiseReasonCounts(stats);
  const noiseBreakdown = buildNoiseBreakdown({ noiseReasonCounts: combinedNoiseReasonCounts });
  const queryTermDiagnosis = diagnoseQueryTerms(query, theme, userOpinion);
  const weakQueryTermWarnings = queryTermDiagnosis
    .filter((item) => item.status !== "ok")
    .map((item) => `検索語「${item.term}」: ${item.problem} ${item.advice}`);
  const dominantNoiseCategories = Object.entries(combinedNoiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({
      category,
      label: NOISE_CATEGORY_LABELS[category] || category,
      count,
    }));

  let status = "good";
  if (
    analysisCandidateCount <= 7 ||
    candidateRate < 0.3 ||
    noiseRate >= 0.65 ||
    analysisCandidateCount === 0
  ) {
    status = "bad";
  } else if (
    analysisCandidateCount <= 14 ||
    candidateRate < 0.5 ||
    noiseRate >= 0.4 ||
    genericKeywordWarnings.length > 0 ||
    weakQueryTermWarnings.length > 0
  ) {
    status = "warning";
  }

  const problemReasons = [];
  if (analysisCandidateCount <= 14) {
    problemReasons.push(`分析対象に残った投稿が${analysisCandidateCount}件です。`);
  }
  if (candidateRate < 0.5) {
    problemReasons.push(`正規化後の候補率が${formatPercent(candidateRate)}です。`);
  }
  if (noiseRate >= 0.4) {
    problemReasons.push(`ノイズ率が${formatPercent(noiseRate)}です。`);
  }
  if (independentOpinionRate < 0.15 && fetchedCount > 0) {
    problemReasons.push(`独立意見率が${formatPercent(independentOpinionRate)}です。独立した意見の種類は少なめです。`);
  }
  if (spreadDominanceRate >= 0.25) {
    problemReasons.push(`拡散支配率が${formatPercent(spreadDominanceRate)}です。RT・類似テンプレートを世論量として扱わないでください。`);
  }
  if ((stats.spreadTemplateCount || 0) > 0) {
    problemReasons.push(`拡散テンプレートを${stats.spreadTemplateCount}件検出しました。`);
  }
  if (genericKeywordWarnings.length > 0) {
    problemReasons.push(...genericKeywordWarnings);
  }
  if (weakQueryTermWarnings.length > 0) {
    problemReasons.push(...weakQueryTermWarnings);
  }
  if (dominantNoiseCategories.length > 0) {
    problemReasons.push(`主なノイズ: ${dominantNoiseCategories.map((item) => `${item.label}${item.count}件`).join(" / ")}`);
  }
  if (retrievalKpi.overallRetrievalQuality !== "good") {
    problemReasons.push(retrievalKpi.message);
  }
  if (analysisCandidateCount === 0 && noiseFilterEnabled) {
    problemReasons.push("ノイズ除去により分析対象が0件になりました。クエリが広すぎるか、ノイズ除去が強すぎる可能性があります。");
  }

  return {
    status,
    fetchedCount,
    normalizedCount,
    duplicateCount: stats.duplicateCount,
    independentOpinionCount,
    independentOpinionRate,
    spreadReferenceCount,
    spreadDominanceRate,
    spreadTemplateCount: stats.spreadTemplateCount || 0,
    noiseCount,
    analysisCandidateCount,
    relevanceGoodCount,
    relevanceWeakCount,
    relevanceBadCount,
    noiseRate,
    candidateRate,
    duplicateRate,
    retrievalKpi,
    overallRetrievalQuality: retrievalKpi.overallRetrievalQuality,
    genericKeywordWarnings,
    queryTermDiagnosis,
    noiseBreakdown,
    recommendedNextActions: buildRecommendedNextActions(noiseBreakdown, queryTermDiagnosis, {
      analysisCandidateCount,
    }),
    dominantNoiseCategories,
    problemReasons,
    noiseReasonCounts: combinedNoiseReasonCounts,
    noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
    relevanceThreshold,
    sampleTexts: texts.slice(0, 5),
    sampleKeptPosts: (stats.candidateRows || []).slice(0, 5).map((row) => row.normalizedText || row.opinion || ""),
    sampleNoisePosts: (stats.noiseExcludedRows || []).slice(0, 5).map((row) => ({
      text: row.normalizedText || row.opinion || "",
      category: row.noiseCategory || "unknown",
      reason: row.noiseReason || "",
    })),
  };
}

function buildImprovedQueryCandidates(theme, userOpinion, currentQuery, diagnosis, axisConfig) {
  const themeWords = extractFallbackKeywords(theme, userOpinion)
    .filter((word) => !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const axisWords = uniqueValues([
    axisConfig?.x?.label,
    axisConfig?.y?.label,
    axisConfig?.z?.label,
    ...(axisConfig?.x?.description || "").split(/[、。\s]+/),
    ...(axisConfig?.y?.description || "").split(/[、。\s]+/),
    ...(axisConfig?.z?.description || "").split(/[、。\s]+/),
  ])
    .map((word) => String(word || "").trim())
    .filter((word) => word.length >= 2 && !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const baseTheme = themeWords[0] || String(theme || "").trim() || stripXCommonFilters(currentQuery);
  const themeText = `${theme} ${userOpinion} ${currentQuery}`;
  const domainPhrases = [];

  if (/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(themeText)) {
    domainPhrases.push("住宅価格", "住宅ローン", "家賃", "中古住宅", "空き家", "リノベーション", "住宅政策", "長寿命住宅", "資産形成");
  }
  if (/プログラミング|コード|Python|学習|教室|エラー|初心者/.test(themeText)) {
    domainPhrases.push("プログラミング学習", "Python 初心者", "エラー", "つまずき", "コーディング教室", "授業", "学習支援");
  }
  if (/民主主義|政治|選挙|投票|SNS|市民/.test(themeText)) {
    domainPhrases.push("民主主義 SNS", "選挙", "投票", "政治参加", "熟議", "世論", "市民参加");
  }
  if (/宗教|信仰|仏教|神|救い/.test(themeText)) {
    domainPhrases.push("宗教 信仰", "心の支え", "救い", "宗教二世", "カルト", "精神性");
  }

  const concreteTerms = uniqueValues([...domainPhrases, ...themeWords, ...axisWords])
    .filter((word) => word.length >= 2 && !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 8);
  const genericTerms = (diagnosis?.genericKeywordWarnings || [])
    .map((warning) => warning.match(/「(.+?)」/)?.[1])
    .filter(Boolean);
  const noiseLabels = (diagnosis?.dominantNoiseCategories || []).map((item) => item.label).join(" / ") || "ノイズ";
  const candidates = [
    ...(/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(themeText)
      ? [
          {
            label: "生活者の負担",
            query: "住宅価格 OR 住宅ローン OR 家賃 OR 住居費負担 OR 家計",
            reason: "住宅を生活費・負担として語る投稿を拾います。",
          },
          {
            label: "中古・空き家・リノベ",
            query: "中古住宅 OR 空き家 OR リノベーション OR 既存住宅 OR 住宅ストック",
            reason: "新築以外の選択肢や既存住宅活用の投稿を拾います。",
          },
          {
            label: "政策・資産形成",
            query: "住宅政策 OR 長寿命住宅 OR 資産形成 OR 新築費用 OR 住宅資産価値",
            reason: "制度・政策・資産価値の論点を拾います。",
          },
          {
            label: "若者・ローン問題",
            query: "若者 住宅ローン OR 50年ローン OR 住宅 高騰 OR 持ち家 諦めた",
            reason: "若い世代やローン負担に関する声を拾います。",
          },
          {
            label: "賃貸・生活不安",
            query: "家賃 高い OR 賃貸 高騰 OR 住居費 負担 OR 引越し 家賃",
            reason: "賃貸・生活不安の具体的な声を拾います。",
          },
        ]
      : []),
    {
      label: "テーマ語で絞る",
      query: uniqueValues(concreteTerms.slice(0, 5)).join(" OR ") || baseTheme,
      reason: "テーマ本文から取れる具体語を中心にし、広すぎる語を減らします。",
    },
    {
      label: "評価軸語を追加",
      query: uniqueValues([concreteTerms[0] || baseTheme, ...axisWords.slice(0, 4)]).join(" OR "),
      reason: "評価軸と関係する語を入れて、分析対象になりやすい投稿を増やします。",
    },
    {
      label: "悩み・具体体験を拾う",
      query: `${baseTheme} (${uniqueValues([...axisWords.slice(0, 2), "困った", "体験", "相談"]).join(" OR ")})`,
      reason: `主なノイズ（${noiseLabels}）を避け、具体的な体験・意見を拾いやすくします。`,
    },
  ];

  if (genericTerms.length > 0) {
    candidates.unshift({
      label: "汎用語をテーマ語に結合",
      query: uniqueValues(genericTerms.map((term) => `${baseTheme} ${term}`)).join(" OR "),
      reason: "単独汎用語をテーマ語と組み合わせて、無関係投稿の混入を減らします。",
    });
  }

  return candidates
    .map((candidate) => ({
      ...candidate,
      query: stripXCommonFilters(candidate.query).trim(),
    }))
    .filter((candidate) => candidate.query)
    .slice(0, 6);
}

function buildRuleBasedQueryAdvice({
  theme,
  userOpinion,
  currentQuery,
  axisConfig,
  diagnosis,
  noiseBreakdown,
  queryTermDiagnosis,
}) {
  const fallbackCandidates = buildImprovedQueryCandidates(theme, userOpinion, currentQuery, diagnosis, axisConfig);
  const weakTerms = (queryTermDiagnosis || []).filter((item) => item.status !== "ok");
  const topNoise = (noiseBreakdown || [])[0];
  const mainProblems = [
    ...(Array.isArray(diagnosis?.problemReasons) ? diagnosis.problemReasons.slice(0, 3) : []),
    ...(topNoise ? [`${topNoise.label}が${topNoise.count}件あります。${topNoise.advice}`] : []),
    ...(weakTerms.length ? [`検索語「${weakTerms[0].term}」がノイズ源になっている可能性があります。`] : []),
  ];
  const queryTermAdvice = (queryTermDiagnosis || []).map((item) => ({
    term: item.term,
    status: item.status,
    problem: item.problem,
    advice: item.advice,
    suggestion: item.suggestion,
  }));
  const recommendedQuery = fallbackCandidates[0]?.query || stripXCommonFilters(currentQuery);
  const improvedHashtagCandidates = extractFallbackKeywords(theme, userOpinion)
    .slice(0, 5)
    .map((word) => ({
      label: word,
      hashtag: normalizeHashtag(word),
      reason: "テーマ語から作ったハッシュタグ候補です。",
      noiseRisk: "中",
      selectionType: "recommended",
    }));

  return {
    diagnosisSummary:
      diagnosis?.status === "bad"
        ? "取得診断は不調です。検索語が広すぎる、別文脈を拾っている、または分析対象が少なすぎる可能性があります。"
        : diagnosis?.status === "warning"
          ? "取得診断は注意です。分析は可能ですが、ノイズ分類と検索語の見直しで改善できます。"
          : "取得診断は良好です。必要に応じて追加取得へ進めます。",
    mainProblems: uniqueValues(mainProblems).slice(0, 5),
    queryTermAdvice,
    improvedQueryCandidates: fallbackCandidates,
    improvedHashtagCandidates,
    recommendedQuery,
    userMessage:
      weakTerms.length > 0
        ? "広すぎる検索語は単独で使わず、テーマ語と組み合わせて30件を再診断してください。"
        : "上位のノイズ分類を見て、除外語追加またはテーマ語への寄せ直しを試してください。",
    source: "rule_fallback",
  };
}

function buildImprovementComparison(beforeDiagnosis, afterDiagnosis) {
  if (!beforeDiagnosis || !afterDiagnosis) {
    return null;
  }

  const beforeAnalysisCandidateCount = beforeDiagnosis.analysisCandidateCount || 0;
  const afterAnalysisCandidateCount = afterDiagnosis.analysisCandidateCount || 0;
  const beforeNoiseRate = beforeDiagnosis.noiseRate || 0;
  const afterNoiseRate = afterDiagnosis.noiseRate || 0;
  const beforeDuplicateRate = beforeDiagnosis.duplicateRate || 0;
  const afterDuplicateRate = afterDiagnosis.duplicateRate || 0;
  const improved =
    afterAnalysisCandidateCount > beforeAnalysisCandidateCount ||
    (afterAnalysisCandidateCount >= beforeAnalysisCandidateCount && afterNoiseRate < beforeNoiseRate);

  return {
    beforeAnalysisCandidateCount,
    afterAnalysisCandidateCount,
    beforeNoiseRate,
    afterNoiseRate,
    beforeDuplicateRate,
    afterDuplicateRate,
    beforeStatus: beforeDiagnosis.status || "idle",
    afterStatus: afterDiagnosis.status || "idle",
    improved,
    message: improved
      ? "改善クエリで分析対象またはノイズ率が改善しました。"
      : "改善クエリでも十分に改善していません。検索語をさらに具体化するか、ノイズ除去を弱めて再診断してください。",
  };
}

function queryDiagnosisLabel(status) {
  if (status === "checking") return "30件診断中";
  if (status === "good") return "良好";
  if (status === "warning") return "注意";
  if (status === "bad") return "不調・停止中";
  return "未実行";
}

function stagedFetchActionLabel(action) {
  if (action === "initial") return "初回30件診断";
  if (action === "improved_refetch") return "改善クエリで追加取得";
  if (action === "improved_add") return "改善クエリで追加取得";
  if (action === "continue_remaining") return "このクエリのまま残りを追加取得";
  if (action === "continue_add") return "このクエリのまま追加取得";
  if (action === "manual") return "手動修正後取得";
  if (action === "weak_noise_retry") return "ノイズ除去を弱めて再診断";
  if (action === "full_refetch") return "本取得";
  if (action === "auto_user_error") return "自動取得エラー";
  return "通常取得";
}

function normalizeQueryForComparison(query) {
  return stripXCommonFilters(query)
    .replace(/[()]/g, " ")
    .replace(/\s+OR\s+/gi, " OR ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function queriesAreEquivalent(a, b) {
  return normalizeQueryForComparison(a) === normalizeQueryForComparison(b);
}

function mergePostsByText(existingPosts, nextPosts, targetCount = Infinity) {
  const seen = new Set();
  const merged = [];

  [...(existingPosts || []), ...(nextPosts || [])].forEach((post) => {
    const text = String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!text || seen.has(text) || merged.length >= targetCount) {
      return;
    }

    seen.add(text);
    merged.push(typeof post === "string" ? { text } : post);
  });

  return merged;
}

function postsFromTexts(texts, fetchMeta = null) {
  return (Array.isArray(texts) ? texts : [])
    .map((text) => String(text || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((text) => (fetchMeta ? { text, fetchMeta } : { text }));
}

function postsFromExternalOpinions(externalOpinions, fetchMeta = null) {
  return postsFromTexts(String(externalOpinions || "").split("\n"), fetchMeta);
}

function attachFetchMetaToPosts(posts, fetchMeta) {
  return (Array.isArray(posts) ? posts : []).map((post) => ({
    ...(typeof post === "string" ? { text: post } : post),
    fetchMeta,
  }));
}

function calculateNextAddFetchCount(currentDataCount, targetCount, defaultCount = DEFAULT_ADD_FETCH_COUNT) {
  const remainingCount = Math.max(0, (Number(targetCount) || 0) - (Number(currentDataCount) || 0));
  if (remainingCount <= 0) return 0;
  if (remainingCount < MIN_ADD_FETCH_COUNT) return remainingCount;
  return Math.min(defaultCount, remainingCount);
}

function queryKindLabel(hashtagCount, normalQuery) {
  const hasNormal = Boolean(stripXCommonFilters(normalQuery).replace(/#[^\s)]+/g, "").trim());
  if (hashtagCount > 0 && hasNormal) return "混合";
  if (hashtagCount > 0) return "ハッシュタグ";
  return "通常語";
}

function textsFromPosts(posts) {
  return (Array.isArray(posts) ? posts : [])
    .map((post) => String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function stopReasonLabel(stopReason) {
  const labels = {
    api_returned_zero: "X APIから投稿が返りませんでした。検索条件が狭すぎる可能性があります。",
    api_returned_but_all_duplicate:
      "X APIから投稿は返りましたが、既存データと重複していたため新規追加はありませんでした。",
    api_returned_but_all_noise:
      "X APIから投稿は返りましたが、ノイズ除去後に分析対象が残りませんでした。",
    api_error: "X APIの取得中にエラーが発生しました。",
    api_credit_exhausted: "X APIのクレジットが不足しています。",
    invalid_query: "検索クエリの形式がX APIに合わなかったため、安全なクエリへ変換して再試行しました。",
    target_reached: "目標件数に到達しました。",
    max_rounds_reached: "自動取得の安全上限に到達しました。",
    safety_round_limit_reached: "自動取得の安全上限に到達しました。目標件数未満ですが、追加しても増えにくい状態です。",
    no_improvement_after_retries: "複数回試しても新規追加が伸びませんでした。",
    too_many_duplicates: "重複が多く、新しい意見を追加しにくい状態です。",
    too_many_noise_posts: "ノイズ投稿が多く、分析対象が増えにくい状態です。",
    no_next_token: "X APIの次ページがなく、目標件数より少ない件数で停止しました。",
    empty_result: "X APIは成功しましたが、表示できる意見が見つかりませんでした。",
    fetch_failed: "X取得に失敗したためサンプル表示へ切り替えました。",
    missing_token: "X APIの認証情報が読み込まれていません。",
    authentication_error: "X APIの認証エラーです。",
    permission_or_plan_error: "X APIの権限またはプラン条件で取得できませんでした。",
    rate_limit: "X APIのレート制限に達しました。",
    server_error: "X APIまたはサーバー側でエラーが発生しました。",
  };
  return labels[stopReason] || stopReason || "停止理由なし";
}

function queryBuildStatusLabel(status) {
  if (status === "fallback") return "予備クエリ";
  if (status === "error") return "エラー";
  if (status === "safe") return "整形済み";
  return status || "未実行";
}

function makeRetryQueryFromSafeInfo(queryInfo = {}, theme = "", userOpinion = "") {
  const fallbackBase = queryInfo.fallbackQuery || queryInfo.safeQuery || "";
  const compactKeywords = extractFallbackKeywords(theme, userOpinion)
    .filter((word) => !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const fallbackWithoutFilters = stripXCommonFilters(fallbackBase);
  return buildSafeXQuery({
    includeGroups: [
      ...queryToSafeIncludeGroups(fallbackWithoutFilters),
      ...compactKeywords.map((word) => [word]),
    ],
    hashtags: [],
    excludeTerms: [],
  }).query;
}

function makeStageLogEntry({
  stageNo,
  action,
  query,
  fetchedCount,
  accumulatedCount,
  diagnosis,
  beforeQuery = "",
  afterQuery = "",
  targetCount = 0,
  remainingCount = 0,
  nextFetchCount = 0,
  requestedFetchCount = fetchedCount,
  apiReturnedCount = fetchedCount,
  actualFetchedCount = apiReturnedCount,
  newUniqueCount = fetchedCount,
  duplicateSkippedCount = 0,
  queryKind = "通常語",
  usedHashtags = [],
  usedExcludeTerms = [],
  rawQuery = query,
  safeQuery = query,
  fallbackQuery = "",
  finalQueryForXApi = query,
  queryBuildStatus = "safe",
  queryBuildWarnings = [],
  apiErrorMessage = "",
  errorType = "",
  originalErrorMessage = "",
  errorTimestamp = "",
  retryCount = 0,
  fallbackUsed = false,
  rawFetchedCount = apiReturnedCount,
  noiseRemovedCount = 0,
  addedToCurrentDataCount = newUniqueCount,
  stopReason = "",
  sanitizedHashtagRemovedParts = [],
  sanitizedExcludeRemovedParts = [],
}) {
  // Stage count vocabulary:
  // targetCount is the run target, requestedFetchCount is this request size,
  // apiReturnedCount/rawFetchedCount are API-side returns,
  // newUniqueCount/addedToCurrentDataCount are after duplicate filtering,
  // noiseRemovedCount is app-side noise removal.
  return {
    stageNo,
    action,
    actionLabel: stagedFetchActionLabel(action),
    query,
    rawQuery,
    safeQuery,
    fallbackQuery,
    finalQueryForXApi,
    queryBuildStatus,
    queryBuildWarnings,
    apiErrorMessage,
    errorType,
    originalErrorMessage,
    errorTimestamp,
    retryCount,
    fallbackUsed,
    rawFetchedCount,
    noiseRemovedCount,
    addedToCurrentDataCount,
    stopReason,
    stopReasonLabel: stopReasonLabel(stopReason),
    sanitizedHashtagRemovedParts,
    sanitizedExcludeRemovedParts,
    beforeQuery,
    afterQuery,
    fetchedCount,
    currentBatchCount: fetchedCount,
    accumulatedCount,
    currentDataCount: accumulatedCount,
    totalFetchedCount: accumulatedCount,
    targetCount,
    remainingCount,
    nextFetchCount,
    requestedFetchCount,
    apiReturnedCount,
    actualFetchedCount,
    newUniqueCount,
    duplicateSkippedCount,
    queryKind,
    usedHashtags,
    usedExcludeTerms,
    normalizedCount: diagnosis?.normalizedCount ?? 0,
    analysisCandidateCount: diagnosis?.analysisCandidateCount ?? 0,
    noiseRate: diagnosis?.noiseRate ?? 0,
    candidateRate: diagnosis?.candidateRate ?? 0,
    diagnosisStatus: diagnosis?.status || "idle",
    createdAt: new Date().toISOString(),
  };
}

  return {
    detectGenericKeywordWarnings,
    splitQueryTerms,
    diagnoseQueryTerms,
    noiseCategoryAdvice,
    buildNoiseBreakdown,
    buildCombinedNoiseReasonCounts,
    buildRecommendedNextActions,
    diagnoseQueryQuality,
    buildImprovedQueryCandidates,
    buildRuleBasedQueryAdvice,
    buildImprovementComparison,
    queryDiagnosisLabel,
    stagedFetchActionLabel,
    normalizeQueryForComparison,
    queriesAreEquivalent,
    mergePostsByText,
    postsFromTexts,
    postsFromExternalOpinions,
    attachFetchMetaToPosts,
    calculateNextAddFetchCount,
    queryKindLabel,
    textsFromPosts,
    stopReasonLabel,
    queryBuildStatusLabel,
    makeRetryQueryFromSafeInfo,
    makeStageLogEntry,
  };
}



