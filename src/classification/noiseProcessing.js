import { createClusterModel } from "../clustering/clusterModel.js";
import { createQueryDiagnosticsModel } from "../query/queryDiagnostics.js";

export function createNoiseProcessingModel({
  DEFAULT_ADD_FETCH_COUNT,
  DEFAULT_PERSONA_A_VOICE_DIRECTIONS,
  GENERIC_QUERY_TERMS,
  JP_UI_LABELS,
  MIN_ADD_FETCH_COUNT,
  NOISE_CATEGORY_LABELS,
  NOISE_RELEVANCE_THRESHOLD,
  PERSONA_A_QUERY_TERMS_BY_DIRECTION,
  PERSONA_CONFIGS,
  STAGED_FETCH_INITIAL_COUNT,
  THEME_HASHTAG_LIBRARY,
  VOICE_DIRECTION_KEY_ALIASES,
  VOICE_DIRECTION_OPTIONS,
  analysisPurposeConfigFor,
  buildSafeXQuery,
  calculateScoreDistribution,
  clamp,
  createThemeAxisConfig,
  detectNoiseCategory,
  extractFallbackKeywords,
  hasUrl,
  includesAnyKeyword,
  isRetweetLike,
  isTooShortOpinion,
  normalizeHashtag,
  normalizeOpinionText,
  queryToSafeIncludeGroups,
  samples,
  scoreOpinion,
  stripRtPrefix,
  stripUrls,
  stripXCommonFilters,
  uniqueValues,
  withClusterVolume,
}) {
const {
  makeBigrams,
  jaccardSimilarity,
  normalizeSpreadTemplateText,
  clusterOpinionsByText,
  makeClusterRepresentative,
  formatPercent,
  formatScore,
  clusterCountJudgement,
  qualityLabel,
  retrievalKpiMessage,
  buildRetrievalKpi,
} = createClusterModel({
  clamp,
  normalizeOpinionText,
  scoreOpinion,
  stripRtPrefix,
  stripUrls,
  withClusterVolume,
});
function personaAAllowsSpecialTopic(theme, userOpinion, topicPattern) {
  return topicPattern.test(normalizeOpinionText(`${theme} ${userOpinion}`));
}

function isPersonaAUsableOpinion(text, theme, userOpinion) {
  const normalizedText = normalizeOpinionText(text);
  const compactText = normalizedText.replace(/\s+/g, "");
  const contextText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const romanceAnchors = [
    "恋愛",
    "彼氏",
    "彼女",
    "好きな人",
    "恋人",
    "パートナー",
    "付き合",
    "片思い",
    "復縁",
    "婚活",
    "結婚",
    "マッチングアプリ",
    "デート",
    "別れ",
    "浮気",
    "両思い",
  ];
  const consultationSignals = [
    "返信",
    "連絡",
    "不安",
    "愛され",
    "安心",
    "寂し",
    "距離感",
    "温度差",
    "重い",
    "依存",
    "嫉妬",
    "信頼",
    "束縛",
    "すれ違",
    "話し合",
    "言えない",
    "気持ち",
    "優先順位",
    "価値観",
    "将来",
    "相性",
    "告白",
    "承認欲求",
    "自己表現",
  ];
  const selfConcernSignals = ["私", "自分", "悩", "相談", "つらい", "苦しい", "怖い", "迷", "どうしたら", "どうすれば"];
  const hasRomanceAnchor = includesAnyKeyword(normalizedText, romanceAnchors);
  const consultationHitCount = consultationSignals.filter((word) => normalizedText.includes(word)).length;
  const selfConcernHitCount = selfConcernSignals.filter((word) => normalizedText.includes(word)).length;
  const themeRequestsSpirituality = personaAAllowsSpecialTopic(theme, userOpinion, /スピリチュアル|ツインソウル|ツインレイ|運命|占い|星座|信仰|精神/i);
  const themeRequestsFandom = personaAAllowsSpecialTopic(theme, userOpinion, /推し|アイドル|芸能|有名人|二次創作|作品|ファン|ブルーロック|アニメ|漫画|ゲーム/i);

  const exclusionRules = [
    {
      category: "fandom_not_romance_consultation",
      pattern: /ブルーロック|アニメ|漫画|マンガ|ゲーム|キャラ|カップリング|二次創作|同人|作品|ネタバレ|推しカプ|BL|CP/i,
      allowed: themeRequestsFandom,
    },
    {
      category: "celebrity_or_idol_topic",
      pattern: /アイドル|推し|芸能人|俳優|女優|声優|熱愛報道|匂わせ|ファン/i,
      allowed: themeRequestsFandom && selfConcernHitCount > 0,
    },
    {
      category: "fortune_telling",
      pattern: /占い|星座|運勢|今日の恋愛運|恋愛運|タロット|鑑定/i,
      allowed: themeRequestsSpirituality,
    },
    {
      category: "spirituality_not_requested",
      pattern: /ツインソウル|ツインレイ|ツインフレーム|魂の伴侶|運命の人|スピリチュアル|前世/i,
      allowed: themeRequestsSpirituality,
    },
    {
      category: "political_or_historical_topic",
      pattern: /田中角栄|政治|総理|首相|議員|選挙|歴史|家系|派閥|政党/i,
      allowed: false,
    },
    {
      category: "advertisement_or_promotion",
      pattern: /PR|無料相談|無料鑑定|公式LINE|LINE登録|副業|講座|コーチング|キャンペーン|業者|勧誘|モニター募集/i,
      allowed: false,
    },
    {
      category: "adult_or_solicitation",
      pattern: /アダルト|パパ活|セフレ|援交|出会い系|成人向け|エロ|性的サービス/i,
      allowed: false,
    },
    {
      category: "generic_self_help",
      pattern: /心理学|自己啓発|本|書籍|読書|貸した|名言|人生論|メンタル/i,
      allowed: hasRomanceAnchor && consultationHitCount > 0,
    },
  ];
  const matchedExclusion = exclusionRules.find((rule) => rule.pattern.test(normalizedText) && !rule.allowed);

  if (matchedExclusion) {
    return {
      keep: false,
      relevanceCategory: matchedExclusion.category,
      exclusionReason: matchedExclusion.category,
      confidence: 0.95,
    };
  }

  if (!hasRomanceAnchor) {
    return {
      keep: false,
      relevanceCategory: "weak_relationship_relevance",
      exclusionReason: "weak_relationship_relevance",
      confidence: 0.35,
    };
  }

  const confidence = clamp(
    0.35 + consultationHitCount * 0.16 + selfConcernHitCount * 0.1 + (compactText.length >= 35 ? 0.08 : 0),
    0,
    0.98
  );

  if (consultationHitCount >= 2 || (consultationHitCount >= 1 && selfConcernHitCount >= 1) || confidence >= 0.68) {
    return {
      keep: true,
      relevanceCategory: "romance_consultation",
      exclusionReason: null,
      confidence,
    };
  }

  return {
    keep: false,
    relevanceCategory: "weak_relationship_relevance",
    exclusionReason: "weak_relationship_relevance",
    confidence,
  };
}

function applyPersonaAStrictRelevance(candidateRows, { enabled, theme, userOpinion } = {}) {
  if (!enabled) {
    return {
      enabled: false,
      candidateRows: Array.isArray(candidateRows) ? candidateRows : [],
      excludedRows: [],
      borderlineRows: [],
      exclusionCounts: {},
      referenceDisplay: false,
    };
  }

  const keptRows = [];
  const excludedRows = [];
  const borderlineRows = [];

  (Array.isArray(candidateRows) ? candidateRows : []).forEach((row) => {
    const judgement = isPersonaAUsableOpinion(row.normalizedText || row.processedText || row.opinion, theme, userOpinion);
    const enrichedRow = {
      ...row,
      personaARelevanceCategory: judgement.relevanceCategory,
      personaARelevanceConfidence: judgement.confidence,
      personaAExclusionReason: judgement.exclusionReason,
    };

    if (judgement.keep) {
      keptRows.push(enrichedRow);
      return;
    }

    if (judgement.confidence < 0.68 || judgement.exclusionReason === "weak_relationship_relevance") {
      borderlineRows.push({
        ...enrichedRow,
        borderlineReason: "Persona Aでは恋愛相談として自然に読める投稿だけを残すため、曖昧な投稿はユーザー表示から外しました。",
      });
    } else {
      excludedRows.push(enrichedRow);
    }
  });

  const allExcludedRows = [...excludedRows, ...borderlineRows];
  const exclusionCounts = allExcludedRows.reduce((counts, row) => {
    const category = row.personaAExclusionReason || row.personaARelevanceCategory || "weak_relationship_relevance";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  return {
    enabled: true,
    candidateRows: keptRows,
    excludedRows,
    borderlineRows,
    allExcludedRows,
    exclusionCounts,
    referenceDisplay: keptRows.length < 10,
  };
}

function buildNoiseReasonCounts(excludedRows) {
  return (Array.isArray(excludedRows) ? excludedRows : []).reduce((counts, row) => {
    const category = row.noiseCategory || "low_relevance";
    counts[category] = (counts[category] || 0) + (Number(row.noiseCount) || 1);
    return counts;
  }, {});
}

function formatNoiseReasonCounts(counts) {
  const entries = Object.entries(counts || {});
  if (entries.length === 0) {
    return "なし";
  }

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
    .join(" / ");
}

function createInitialStagedFetchState() {
  return {
    enabled: true,
    targetCount: 100,
    stageSize: STAGED_FETCH_INITIAL_COUNT,
    currentStage: 0,
    stageLogs: [],
    fetchedCount: 0,
    totalFetchedCount: 0,
    currentBatchCount: 0,
    accumulatedCount: 0,
    currentDataCount: 0,
    totalApiFetchedCount: 0,
    remainingCount: 100,
    nextFetchCount: STAGED_FETCH_INITIAL_COUNT,
    initialFetchCount: 0,
    diagnosisStatus: "idle",
    shouldPause: false,
    diagnosis: null,
    noiseBreakdown: [],
    queryTermDiagnosis: [],
    aiQueryAdvice: null,
    improvementComparison: null,
    improvedQueryCandidates: [],
    selectedImprovedQueryIndexes: [0],
    recommendedQuery: "",
    diagnosisDecision: "",
    lastAction: "",
    beforeQuery: "",
    afterQuery: "",
    improvedRefetchCount: 0,
    improvedAddFetchCount: 0,
    continueRemainingCount: 0,
    weakNoiseRetryAvailable: false,
    message: "未実行",
  };
}

// Section: Staged X fetch diagnostics and query improvement
function personaConfigFor(mode) {
  return PERSONA_CONFIGS[mode] || PERSONA_CONFIGS.dev;
}

function personaAxisConfig(mode, sample) {
  const config = personaConfigFor(mode);
  if (mode === "dev" || !config.axisConfig) {
    return createThemeAxisConfig(sample);
  }

  return {
    ...config.axisConfig,
    x: { ...config.axisConfig.x },
    y: { ...config.axisConfig.y },
    z: { ...config.axisConfig.z },
  };
}

function personaQueryBaseText(mode, theme) {
  const cleanTheme = String(theme || "").trim();
  if (mode === "personaB") {
    return cleanTheme || "テーマ";
  }

  const candidates = personaConfigFor(mode).queryCandidates || [];
  return candidates[0] || cleanTheme || "意見";
}

function buildPersonaQueryCandidates(mode, theme) {
  const config = personaConfigFor(mode);
  if (mode === "dev") {
    return null;
  }

  const cleanTheme = String(theme || "").trim() || "テーマ";
  const bases = Array.isArray(config.queryCandidates)
    ? config.queryCandidates
    : (config.queryTemplate || []).map((suffix) => `${cleanTheme} ${suffix}`);

  return bases.map((base, index) => ({
    id: `${mode}-query-${index + 1}`,
    label: `${config.shortLabel}${index + 1}`,
    description: `${config.label}向けの検索候補です。`,
    base,
    query: base,
  }));
}

function normalizeThemeQueryCandidate(candidate, index, themeCategory) {
  if (typeof candidate === "string") {
    const base = candidate.trim();
    return {
      id: `theme-${themeCategory || "general"}-${index + 1}`,
      label: `テーマ候補${index + 1}`,
      description: "テーマから作った検索候補です。",
      base,
      query: base,
      source: "theme",
    };
  }

  const base = String(candidate?.base || candidate?.query || candidate?.label || "").trim();
  const label = String(candidate?.label || `テーマ候補${index + 1}`).trim();

  return {
    id: String(candidate?.id || `theme-${themeCategory || "general"}-${index + 1}`).trim(),
    label,
    description: String(candidate?.description || candidate?.note || "テーマから作った検索候補です。").trim(),
    base,
    query: base,
    source: "theme",
  };
}

function getThemeQueryCandidates(theme, themeCategory, fallbackSample = null) {
  const themeSample = samples[themeCategory] || fallbackSample || null;
  const sampleCandidates = Array.isArray(themeSample?.xQueryCandidates) ? themeSample.xQueryCandidates : [];
  const normalizedSampleCandidates = sampleCandidates
    .map((candidate, index) => normalizeThemeQueryCandidate(candidate, index, themeCategory))
    .filter((candidate) => candidate.label && candidate.base);

  if (normalizedSampleCandidates.length > 0) {
    return normalizedSampleCandidates;
  }

  const keywords = extractFallbackKeywords(theme, "");
  const baseQuery = keywords.length ? keywords.slice(0, 4).join(" OR ") : String(theme || "意見").trim();

  return [
    {
      id: `theme-${themeCategory || "general"}-fallback`,
      label: "テーマ基本",
      description: "テーマ語から作った検索候補です。",
      base: baseQuery,
      query: baseQuery,
      source: "theme",
    },
  ];
}

function voiceDirectionLabel(key) {
  return VOICE_DIRECTION_OPTIONS.find((option) => option.key === key)?.label || key;
}

function normalizeVoiceDirections(directions) {
  const selected = uniqueValues(Array.isArray(directions) ? directions : [])
    .map((key) => VOICE_DIRECTION_KEY_ALIASES[key] || key);
  const validKeys = new Set(VOICE_DIRECTION_OPTIONS.map((option) => option.key));
  const filtered = selected.filter((key) => validKeys.has(key));

  return filtered.length ? filtered : DEFAULT_PERSONA_A_VOICE_DIRECTIONS;
}

function personaAQueryTermsForDirections(directions, analysisPurposeMode = "position") {
  const selectedDirections = normalizeVoiceDirections(directions);
  const purposeTerms = purposeQueryTerms(analysisPurposeMode, "personaA");
  const terms = [
    ...purposeTerms,
    ...selectedDirections.flatMap((direction) => PERSONA_A_QUERY_TERMS_BY_DIRECTION[direction] || []),
  ];

  return uniqueValues(terms).filter((term) => !looksLikeMojibake(term)).slice(0, 12);
}

function getPersonaAQueryCandidates(directions = DEFAULT_PERSONA_A_VOICE_DIRECTIONS, analysisPurposeMode = "position") {
  const selectedDirections = normalizeVoiceDirections(directions);
  const purposeMode = normalizeAnalysisPurposeMode(analysisPurposeMode, "personaA");
  const purposeConfig = analysisPurposeConfigFor(purposeMode, "personaA");
  const terms = personaAQueryTermsForDirections(selectedDirections, purposeMode);
  const purposeTerms = uniqueValues(purposeConfig.queryTerms || [])
    .filter((term) => !looksLikeMojibake(term))
    .slice(0, 4);
  const groups = selectedDirections
    .map((direction) => ({
      direction,
      label: voiceDirectionLabel(direction),
      terms: uniqueValues(PERSONA_A_QUERY_TERMS_BY_DIRECTION[direction] || []).filter((term) => !looksLikeMojibake(term)).slice(0, 3),
    }))
    .filter((group) => group.terms.length > 0)
    .slice(0, 4);

  const purposeCandidate =
    purposeTerms.length > 0
      ? [
          {
            id: `persona-a-purpose-${purposeMode}`,
            label: `${JP_UI_LABELS.analysisPurpose}: ${purposeConfig.label}`,
            description: `${purposeConfig.retrievalPolicy} ${purposeConfig.clusterPolicy}`,
            base: purposeTerms.join(" OR "),
            query: purposeTerms.join(" OR "),
            source: "analysis-purpose",
            analysisPurposeMode: purposeMode,
            selectedVoiceDirections: selectedDirections,
            allTerms: terms,
          },
        ]
      : [];

  return [
    ...purposeCandidate,
    ...groups.map((group, index) => ({
    id: `persona-a-${group.direction}-${index + 1}`,
    label: group.label,
    description: `${JP_UI_LABELS.voicesToCollect}: ${group.label}`,
    base: group.terms.join(" OR "),
    query: group.terms.join(" OR "),
    source: "theme-persona-a-voice-direction",
    voiceDirection: group.direction,
    selectedVoiceDirections: selectedDirections,
    allTerms: terms,
    })),
  ];
}

function getThemeHashtagCandidates(theme, themeCategory) {
  const libraryCandidates = THEME_HASHTAG_LIBRARY[themeCategory] || [];

  if (libraryCandidates.length > 0) {
    return libraryCandidates;
  }

  return extractFallbackKeywords(theme, "")
    .slice(0, 4)
    .map((word) => [word, normalizeHashtag(word), "テーマ語から作ったハッシュタグ候補です。", "中", "recommended"]);
}

function applyPersonaUxLens({ personaMode = "dev", themeCategory = "general", axisConfig, queryCandidates, clusters, userOpinion }) {
  const config = personaConfigFor(personaMode);

  return {
    personaMode,
    themeCategory,
    feedbackTitle: config.feedbackTitle,
    dashboardLabel: config.dashboardLabel,
    toneLabel: personaMode === "dev" ? "technical" : config.shortLabel,
    axisConfig,
    queryCandidates,
    clusterCount: Array.isArray(clusters) ? clusters.length : 0,
    userOpinion,
    axisPolicy: "theme-first",
  };
}

function personaHashtagCandidates(mode, theme) {
  const config = personaConfigFor(mode);
  if (mode === "dev") {
    return [];
  }

  if (Array.isArray(config.hashtags) && config.hashtags.length > 0) {
    return config.hashtags;
  }

  return extractFallbackKeywords(theme, "")
    .slice(0, 5)
    .map((word, index) => [
      word,
      normalizeHashtag(word),
      `${config.label}向けに、話題化しやすいテーマ語から作った候補です。`,
      index < 3 ? "中" : "高",
      index < 3 ? "recommended" : "caution",
    ]);
}

function personaExcludeTermCandidates(mode) {
  const config = personaConfigFor(mode);
  return mode === "dev" ? [] : config.excludeTerms || [];
}

function spreadTemplateTokens(text) {
  const normalized = normalizeSpreadTemplateText(text).replace(/\s+/g, "");
  return makeBigrams(normalized);
}

function looksLikeSpreadTemplate(text) {
  const normalized = normalizeOpinionText(text);
  return includesAnyKeyword(normalized, [
    "投票",
    "拡散",
    "RT",
    "リポスト",
    "キャンペーン",
    "応募",
    "当選",
    "迅速",
    "デュオリレー",
    "リレー",
    "辞退",
    "A4",
    "参加者募集",
    "固定",
  ]);
}

function detectSpreadTemplateCategory(text) {
  const normalized = normalizeOpinionText(text);
  const compact = normalized.replace(/\s+/g, "");
  const campaignKeywords = [
    "拡散希望",
    "RTお願いします",
    "リポストお願いします",
    "応募",
    "当選",
    "キャンペーン",
    "参加者募集",
    "デュオリレー",
    "A4投票",
    "辞退いつでも",
  ];
  const coordinatedKeywords = ["一斉", "固定文", "テンプレ", "同じ文面", "組織票", "投票依頼"];

  if (includesAnyKeyword(normalized, coordinatedKeywords)) {
    return {
      noiseCategory: "coordinated_campaign_suspected",
      noiseReason: "同じ呼びかけや定型文の拡散が疑われる投稿です。",
    };
  }

  if (includesAnyKeyword(compact, campaignKeywords)) {
    return {
      noiseCategory: "spread_template",
      noiseReason: "キャンペーン・拡散依頼・類似テンプレートに近い投稿です。",
    };
  }

  return null;
}

function isSimilarSpreadTemplate(row, representative) {
  if (!row?.templateBigrams?.length || !representative?.templateBigrams?.length) {
    return false;
  }

  const similarity = jaccardSimilarity(row.templateBigrams, representative.templateBigrams);
  return similarity >= 0.75 || (looksLikeSpreadTemplate(row.processedText) && similarity >= 0.6);
}

function buildNoiseProcessingResult(
  opinions,
  sampleKey,
  axisConfig,
  noiseFilterEnabled = true,
  relevanceThreshold = NOISE_RELEVANCE_THRESHOLD
) {
  const rawRows = opinions.map((opinion, index) => {
    const rawNormalizedText = normalizeOpinionText(opinion);
    const isRt = isRetweetLike(rawNormalizedText);
    const includesUrl = hasUrl(rawNormalizedText);
    const rtStrippedText = stripRtPrefix(rawNormalizedText);
    const processedText = normalizeOpinionText(stripUrls(rtStrippedText));
    const isTooShort = processedText.length < 20;

    return {
      originalNo: index + 1,
      opinion,
      rawNormalizedText,
      normalizedText: processedText,
      processedText,
      templateText: normalizeSpreadTemplateText(processedText),
      templateBigrams: spreadTemplateTokens(processedText),
      isRetweetLike: isRt,
      hasUrl: includesUrl,
      rtExtracted: isRt && !isTooShort,
      rtEmptyOrTooShort: isRt && isTooShort,
      urlTextRemaining: includesUrl && !isTooShort,
      isTooShort,
    };
  });

  const normalizedCounts = new Map();

  rawRows.forEach((row) => {
    if (!row.processedText) {
      return;
    }

    normalizedCounts.set(row.processedText, (normalizedCounts.get(row.processedText) || 0) + 1);
  });

  const seenCandidates = new Set();
  const templateRepresentatives = [];
  const spreadTemplateRows = [];
  const candidateRows = [];
  const noiseExcludedRows = [];
  const borderlineUsefulRows = [];

  rawRows.forEach((row) => {
    const isDuplicate = (normalizedCounts.get(row.processedText) || 0) > 1;

    if (!row.processedText || row.isTooShort) {
      return;
    }

    if (seenCandidates.has(row.processedText)) {
      return;
    }

    seenCandidates.add(row.processedText);
    const scored = scoreOpinion(row.processedText, sampleKey, axisConfig);
    const detectedNoise = detectSpreadTemplateCategory(row.processedText) || detectNoiseCategory(row.processedText);
    const lowRelevanceNoise =
      scored.relevanceScore < relevanceThreshold
        ? {
            noiseCategory: "low_relevance",
            noiseReason: `テーマ関連度が${scored.relevanceScore}で基準${relevanceThreshold}未満です。`,
          }
        : null;
    const noiseMeta = detectedNoise || lowRelevanceNoise;
    const candidate = {
      ...row,
      isDuplicate,
      duplicateCount: normalizedCounts.get(row.processedText) || 1,
      independentOpinionVolume: 1,
      spreadVolume: normalizedCounts.get(row.processedText) || 1,
      volumeForGraph: 1,
      spreadTemplateCount: 0,
      spreadTemplateExamples: [],
      bigrams: makeBigrams(row.processedText),
      relevanceScore: scored.relevanceScore,
      scoreConfidence: scored.scoreConfidence,
      scoreWarnings: Array.isArray(scored.scoreWarnings) ? scored.scoreWarnings : [],
      noiseCategory: noiseMeta?.noiseCategory || "",
      noiseReason: noiseMeta?.noiseReason || "",
    };
    const similarTemplate = templateRepresentatives.find((representative) => isSimilarSpreadTemplate(candidate, representative));

    if (similarTemplate) {
      const spreadCount = candidate.spreadVolume || 1;
      similarTemplate.candidate.spreadVolume += spreadCount;
      similarTemplate.candidate.spreadTemplateCount += spreadCount;
      similarTemplate.candidate.duplicateCount += spreadCount;
      similarTemplate.candidate.spreadTemplateExamples.push(row.processedText);
      spreadTemplateRows.push({
        ...candidate,
        noiseCategory: looksLikeSpreadTemplate(row.processedText)
          ? "spread_template"
          : "duplicate_like_spread",
        noiseReason: "同一文面ではありませんが、正規化後に類似テンプレート投稿と判定したため独立意見数には加算していません。",
        noiseCount: spreadCount,
        matchedTemplateText: similarTemplate.candidate.processedText,
      });
      return;
    }

    templateRepresentatives.push({
      templateBigrams: candidate.templateBigrams,
      candidate,
    });

    if (noiseFilterEnabled && noiseMeta) {
      noiseExcludedRows.push(candidate);
      if (
        noiseMeta.noiseCategory === "low_relevance" &&
        scored.relevanceScore >= Math.max(3, relevanceThreshold - 2)
      ) {
        borderlineUsefulRows.push({
          ...candidate,
          borderlineReason: "テーマとの直接関連は弱いが、評価軸や少数派視点として参考になる可能性があります。",
        });
      }
      return;
    }

    candidateRows.push(candidate);
  });

  const processedTextCount = rawRows.filter((row) => row.processedText).length;
  const noiseReasonCounts = buildNoiseReasonCounts([...noiseExcludedRows, ...spreadTemplateRows]);
  const spreadTemplateCount = spreadTemplateRows.reduce((sum, row) => sum + (Number(row.noiseCount) || 1), 0);
  const duplicateLikeCount = Math.max(
    0,
    Math.max(0, processedTextCount - normalizedCounts.size) + rawRows.filter((row) => row.isRetweetLike).length + spreadTemplateCount
  );
  const independentOpinionCount = candidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0);
  const spreadReferenceCount =
    candidateRows.reduce((sum, row) => sum + (Number(row.spreadVolume) || 1), 0) +
    noiseExcludedRows.reduce((sum, row) => sum + (Number(row.spreadVolume) || Number(row.duplicateCount) || 1), 0);

  return {
    rawCount: rawRows.length,
    uniqueNormalizedCount: normalizedCounts.size,
    processedUniqueTextCount: normalizedCounts.size,
    duplicateCount: Math.max(0, processedTextCount - normalizedCounts.size),
    duplicateLikeCount,
    independentOpinionCount,
    independentOpinionRate: rawRows.length > 0 ? independentOpinionCount / rawRows.length : 0,
    spreadReferenceCount,
    spreadTemplateCount,
    spreadDominanceRate: rawRows.length > 0 ? spreadReferenceCount / rawRows.length : 0,
    retweetLikeCount: rawRows.filter((row) => row.isRetweetLike).length,
    rtExtractSuccessCount: rawRows.filter((row) => row.rtExtracted).length,
    rtEmptyOrTooShortCount: rawRows.filter((row) => row.rtEmptyOrTooShort).length,
    urlCount: rawRows.filter((row) => row.hasUrl).length,
    urlTextRemainingCount: rawRows.filter((row) => row.urlTextRemaining).length,
    tooShortCount: rawRows.filter((row) => row.isTooShort).length,
    candidateCount: candidateRows.length,
    analysisTargetCount: candidateRows.length,
    noiseFilterEnabled,
    noiseExcludedRows,
    spreadTemplateRows,
    noiseExcludedCount: noiseExcludedRows.length + spreadTemplateRows.length,
    borderlineUsefulRows,
    borderlineUsefulCount: borderlineUsefulRows.length,
    noiseReasonCounts,
    noiseReasonSummary: formatNoiseReasonCounts(noiseReasonCounts),
    clusterCount: 0,
    rawRows,
    candidateRows,
  };
}

// Section: Clustering and retrieval quality helpers
const {
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
} = createQueryDiagnosticsModel({
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
});
  return {
    personaAAllowsSpecialTopic,
    isPersonaAUsableOpinion,
    applyPersonaAStrictRelevance,
    buildNoiseReasonCounts,
    formatNoiseReasonCounts,
    createInitialStagedFetchState,
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
    makeBigrams,
    jaccardSimilarity,
    normalizeSpreadTemplateText,
    personaConfigFor,
    personaAxisConfig,
    personaQueryBaseText,
    buildPersonaQueryCandidates,
    normalizeThemeQueryCandidate,
    getThemeQueryCandidates,
    voiceDirectionLabel,
    normalizeVoiceDirections,
    personaAQueryTermsForDirections,
    getPersonaAQueryCandidates,
    getThemeHashtagCandidates,
    applyPersonaUxLens,
    personaHashtagCandidates,
    personaExcludeTermCandidates,
    spreadTemplateTokens,
    looksLikeSpreadTemplate,
    detectSpreadTemplateCategory,
    isSimilarSpreadTemplate,
    buildNoiseProcessingResult,
    clusterOpinionsByText,
    makeClusterRepresentative,
    formatPercent,
    formatScore,
    clusterCountJudgement,
    qualityLabel,
    retrievalKpiMessage,
    buildRetrievalKpi,
  };
}








