export function createScoringModel({ samples, normalizeOpinionText, uniqueValues, clamp, stableNoise }) {
function axisScoreOnly(score) {
  return {
    x: Number(score?.x) || 0,
    y: Number(score?.y) || 0,
    z: Number(score?.z) || 0,
  };
}

// Section: Scoring and display score helpers
function wordsInText(text, words) {
  return words.filter((word) => word && text.includes(word));
}

function scoreMeta(text, sampleKey, axisConfig, score) {
  const normalized = normalizeOpinionText(text);
  const axisWords = ["x", "y", "z"].flatMap((axis) => axisKeywords(axisConfig?.[axis]));
  const sample = samples[sampleKey] || {};
  const themeWords = uniqueValues(
    `${sample.theme || ""} ${sample.label || ""} ${axisWords.join(" ")}`
      .split(/[、。\s・,./／（）()「」『』:：]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2)
  ).slice(0, 40);
  const matchedThemeWords = wordsInText(normalized, themeWords);
  const noiseWords = [
    "広告",
    "PR",
    "キャンペーン",
    "無料",
    "募集",
    "カード",
    "ゲーム",
    "作品",
    "Claude",
    "ChatGPT",
    "Gemini",
    "AIツール",
    "比較",
    "ランキング",
    "構造だけ",
  ];
  const matchedNoiseWords = wordsInText(normalized, noiseWords);
  const textDetail = Math.min(normalized.length / 120, 2);
  const axisHitCount = matchedThemeWords.length;
  const averageScore = (Number(score?.x || 0) + Number(score?.y || 0) + Number(score?.z || 0)) / 3;
  const relevanceScore = Math.round(
    clamp(2 + axisHitCount * 1.2 + textDetail + (averageScore >= 6 ? 1 : 0) - matchedNoiseWords.length * 1.6, 1, 10)
  );
  const scoreConfidence = Math.round(
    clamp(3 + Math.min(axisHitCount, 4) + textDetail - matchedNoiseWords.length * 0.8, 1, 10)
  );
  const scoreWarnings = [];

  if (relevanceScore <= 3) {
    scoreWarnings.push("テーマまたは評価軸との関連が弱いため低めに採点しました。");
  }
  if (matchedNoiseWords.length > 0) {
    scoreWarnings.push(`ノイズ候補語: ${matchedNoiseWords.slice(0, 4).join(" / ")}`);
  }
  if (axisHitCount === 0) {
    scoreWarnings.push("評価軸説明に近い語が少なく、スコア信頼度は控えめです。");
  }

  return {
    relevanceScore,
    scoreConfidence,
    scoreWarnings,
  };
}

function scoreLevelLabel(score) {
  const value = Number(score) || 0;
  if (value >= 8) return "高い";
  if (value >= 6) return "やや高い";
  if (value >= 4) return "中程度";
  if (value >= 2) return "やや低い";
  return "低い";
}

function axisExplanationItems(axisConfig) {
  return ["x", "y", "z"].map((axis) => {
    const config = axisConfig?.[axis] || {};
    const label = config.label || axis.toUpperCase();
    const description = config.description || "説明未設定";
    const high = config.highDescription || config.high || `高いほど「${label}」が強く出ている意見です。`;
    const low = config.lowDescription || config.low || `低いほど「${label}」が弱い、または本文内の根拠が少ない意見です。`;

    return {
      axis,
      label,
      description,
      high,
      low,
    };
  });
}

function reasonKeywordsForAxis(axisConfig, axis) {
  const config = axisConfig?.[axis] || {};
  return uniqueValues(
    [
      ...(axisKeywords(config) || []),
      ...(config.highDescription ? axisKeywords({ description: config.highDescription }) : []),
      ...(config.lowDescription ? axisKeywords({ description: config.lowDescription }) : []),
    ]
      .map((word) => String(word || "").trim())
      .filter((word) => word.length >= 2)
  ).slice(0, 16);
}

function buildScoreReasonForAxis(text, score, axisConfig, axis, confidence = null) {
  const normalized = normalizeOpinionText(text || "");
  const axisItem = axisExplanationItems(axisConfig).find((item) => item.axis === axis);
  const evidenceKeywords = wordsInText(normalized, reasonKeywordsForAxis(axisConfig, axis)).slice(0, 6);
  const scoreValue = Math.round(Number(score?.[axis]) || 0);
  const reasonConfidence = Math.round(
    clamp(Number(confidence) || 3 + Math.min(evidenceKeywords.length, 4), 1, 10)
  );
  const reason =
    evidenceKeywords.length > 0
      ? `本文に「${evidenceKeywords.join(" / ")}」があり、${axisItem.label}は${scoreLevelLabel(scoreValue)}と評価しました。`
      : `${axisItem.label}に直結する根拠語が少ないため参考値です。軸説明との一致は弱めです。`;

  return {
    score: scoreValue,
    reason,
    evidenceKeywords,
    confidence: reasonConfidence,
  };
}

function buildScoreReasons(text, score, axisConfig, confidence = null) {
  return {
    x: buildScoreReasonForAxis(text, score, axisConfig, "x", confidence),
    y: buildScoreReasonForAxis(text, score, axisConfig, "y", confidence),
    z: buildScoreReasonForAxis(text, score, axisConfig, "z", confidence),
  };
}

function ensureScoreReasons(row, text, axisConfig) {
  if (row?.scoreReasons?.x && row?.scoreReasons?.y && row?.scoreReasons?.z) {
    return row.scoreReasons;
  }

  return buildScoreReasons(text || row?.scoredText || row?.opinion || "", axisScoreOnly(row), axisConfig, row?.scoreConfidence);
}

function calibrateScoreByRelevance(score, meta) {
  const base = axisScoreOnly(score);

  if (meta.relevanceScore <= 2) {
    return {
      x: Math.min(base.x, 2),
      y: Math.min(base.y, 2),
      z: Math.min(base.z, 2),
    };
  }

  if (meta.relevanceScore <= 4) {
    return {
      x: Math.min(base.x, 3),
      y: Math.min(base.y, 4),
      z: Math.min(base.z, 4),
    };
  }

  return base;
}

function withScoreMeta(score, text, sampleKey, axisConfig, trusted = false) {
  const initialScore = axisScoreOnly(score);
  const initialMeta = scoreMeta(text, sampleKey, axisConfig, initialScore);
  const calibratedScore = trusted ? initialScore : calibrateScoreByRelevance(initialScore, initialMeta);
  const finalMeta = trusted
    ? { relevanceScore: 10, scoreConfidence: 9, scoreWarnings: [] }
    : scoreMeta(text, sampleKey, axisConfig, calibratedScore);

  return {
    ...calibratedScore,
    ...finalMeta,
    scoreReasons: buildScoreReasons(text, calibratedScore, axisConfig, finalMeta.scoreConfidence),
  };
}

function fallbackScore(text, sampleKey, axisConfig) {
  if (axisConfig?.presetKey && axisConfig.presetKey !== "themeDefault") {
    return fallbackCustomAxisScore(text, axisConfig);
  }

  if (sampleKey === "coding") {
    return fallbackCodingScore(text);
  }

  if (sampleKey === "religion") {
    return fallbackReligionScore(text);
  }

  if (sampleKey === "democracy") {
    return fallbackDemocracyScore(text);
  }

  if (sampleKey === "romance") {
    return fallbackRomanceScore(text);
  }

  return fallbackGeneralScore(text);
}

function addKeywordScore(text, words, weight = 1) {
  return words.reduce((sum, word) => (text.includes(word) ? sum + weight : sum), 0);
}

function axisKeywords(axis) {
  return `${axis?.label || ""} ${axis?.description || ""}`
    .split(/[、。\s・,./／（）()]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 18);
}

function scoreByAxisKeywords(text, axis, base = 3) {
  const keywords = axisKeywords(axis);
  const keywordScore = addKeywordScore(text, keywords, 0.9);

  return Math.round(clamp(base + keywordScore + Math.min(text.length / 160, 2) + stableNoise(text) * 0.25));
}

function fallbackCustomAxisScore(text, axisConfig) {
  return {
    x: scoreByAxisKeywords(text, axisConfig.x),
    y: scoreByAxisKeywords(text, axisConfig.y),
    z: scoreByAxisKeywords(text, axisConfig.z),
  };
}

function fallbackReligionScore(text) {
  const xWords = ["救い", "心", "支え", "祈り", "信じ", "神", "苦しみ", "不安"];
  const yWords = ["政治", "制度", "社会", "共同体", "教育", "戦争", "対立", "カルト", "宗教二世", "被害"];
  const zWords = ["精神", "超越", "死", "愛", "瞑想", "意識", "成長", "自己理解", "死生観"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.1) + Math.min(text.length / 130, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
}

function fallbackDemocracyScore(text) {
  const xWords = ["投票", "選挙", "民意", "世論", "参加", "国民", "市民", "声"];
  const yWords = ["熟議", "対話", "制度", "多数決", "少数派", "分断", "合意", "構造", "限界"];
  const zWords = ["AI", "SNS", "広聴", "ブロードリスニング", "未来", "アップデート", "可視化", "参加型"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.15) + Math.min(text.length / 140, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
}

function fallbackRomanceScore(text) {
  const xWords = ["好き", "愛", "寂し", "安心", "承認", "モテ", "愛され", "感情", "欲望"];
  const yWords = ["結婚", "生活", "距離感", "相性", "マッチング", "アプリ", "男女", "束縛", "パートナー"];
  const zWords = ["自己理解", "成長", "癒し", "成熟", "自由", "自分らしく", "依存", "関係性"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.1) + Math.min(text.length / 130, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
}

function fallbackGeneralScore(text) {
  let y = 2;
  let z = 2;
  let daily = 0;

  const dailyWords = [
    "ガソリン",
    "家計",
    "物価",
    "生活",
    "電気代",
    "不安",
    "困る",
    "高い",
    "安い",
    "通勤",
    "ローン",
    "食費",
    "怖い",
  ];

  const depthWords = [
    "構造",
    "制度",
    "市場",
    "政策",
    "管理",
    "外交",
    "安全保障",
    "経済",
    "資産形成",
    "投資",
    "流通",
    "供給",
    "査察",
    "核",
    "制裁",
    "連鎖",
    "再設計",
    "改革",
  ];

  const viewWords = [
    "世界",
    "平和",
    "社会",
    "文明",
    "国家",
    "人類",
    "未来",
    "世代",
    "人権",
    "地域",
    "市民",
    "文化",
    "中東全体",
    "環境",
    "コミュニティ",
  ];

  dailyWords.forEach((word) => {
    if (text.includes(word)) daily += 1;
  });

  depthWords.forEach((word) => {
    if (text.includes(word)) y += 1.1;
  });

  viewWords.forEach((word) => {
    if (text.includes(word)) z += 1.2;
  });

  if (text.includes("長期") || text.includes("維持") || text.includes("持続")) {
    y += 1;
    z += 1;
  }

  if (text.includes("単純") || text.includes("多面的") || text.includes("複雑")) {
    y += 1.5;
    z += 1.5;
  }

  y += Math.min(text.length / 90, 2);
  z += Math.min(text.length / 110, 2);

  y = Math.round(clamp(y));
  z = Math.round(clamp(z));

  const yzAverage = (y + z) / 2;
  let x = 11 - Math.pow(yzAverage, 1.35);

  x += daily * 0.5;
  x += stableNoise(text);

  return {
    x: Math.round(clamp(x)),
    y,
    z,
  };
}

function fallbackCodingScore(text) {
  let x = 5;
  let y = 3;
  let z = 5;

  const frequencyWords = ["多い", "みんな", "初心者", "生徒ごと", "つまずく", "説明", "エラー"];
  const difficultyWords = ["環境構築", "状態管理", "設計", "非同期", "理解度", "教材", "分析", "分類", "AI"];
  const priorityWords = ["可視化", "改善", "分岐", "支援", "置いていかれる", "自己効力感", "教室運営"];

  frequencyWords.forEach((word) => {
    if (text.includes(word)) x += 1;
  });

  difficultyWords.forEach((word) => {
    if (text.includes(word)) y += 1.1;
  });

  priorityWords.forEach((word) => {
    if (text.includes(word)) z += 1.2;
  });

  x += stableNoise(text) * 0.4;
  y += Math.min(text.length / 100, 2);
  z += Math.min(text.length / 120, 2);

  return {
    x: Math.round(clamp(x)),
    y: Math.round(clamp(y)),
    z: Math.round(clamp(z)),
  };
}

function scoreOpinion(text, sampleKey, axisConfig) {
  const key = text.trim();
  const sample = samples[sampleKey];

  if (axisConfig?.presetKey === "themeDefault" && sample?.userOpinion?.text === key) {
    return withScoreMeta(sample.userOpinion.score, key, sampleKey, axisConfig, true);
  }

  const matchedOpinion = sample?.externalOpinions?.find((item) => item.text === key);

  if (axisConfig?.presetKey === "themeDefault" && matchedOpinion) {
    return withScoreMeta(matchedOpinion.score, key, sampleKey, axisConfig, true);
  }

  return withScoreMeta(fallbackScore(key, sampleKey, axisConfig), key, sampleKey, axisConfig);
}

function scoreFromRow(row) {
  return {
    x: Number(row?.x) || 0,
    y: Number(row?.y) || 0,
    z: Number(row?.z) || 0,
  };
}

function calculateAxisDistribution(rows, axis) {
  const values = rows
    .map((row) => Math.round(Number(row?.absoluteScore?.[axis] ?? row?.[axis]) || 0))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      standardDeviation: 0,
      uniqueScoreCount: 0,
      mostCommonScore: 0,
      mostCommonScoreRatio: 0,
      concentrated: false,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
  const counts = values.reduce((map, value) => {
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
  const [mostCommonScore, mostCommonCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostCommonScoreRatio = mostCommonCount / values.length;
  const standardDeviation = Math.sqrt(variance);
  const uniqueScoreCount = counts.size;
  const concentrated =
    standardDeviation < 0.7 || uniqueScoreCount <= 3 || mostCommonScoreRatio >= 0.6 || max - min <= 2;

  return {
    min,
    max,
    average,
    standardDeviation,
    uniqueScoreCount,
    mostCommonScore,
    mostCommonScoreRatio,
    concentrated,
  };
}

function calculateScoreDistribution(rows) {
  return {
    x: calculateAxisDistribution(rows, "x"),
    y: calculateAxisDistribution(rows, "y"),
    z: calculateAxisDistribution(rows, "z"),
  };
}

function normalizeRelativeScores(rows) {
  const ranges = ["x", "y", "z"].reduce((acc, axis) => {
    const values = rows.map((row) => Number(row.absoluteScore?.[axis]) || 0);
    acc[axis] = {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
    return acc;
  }, {});

  return rows.map((row) => {
    const relativeScore = ["x", "y", "z"].reduce((score, axis) => {
      const { min, max } = ranges[axis];
      const value = Number(row.absoluteScore?.[axis]) || 0;
      score[axis] = max === min ? 5 : Math.round(clamp(1 + (9 * (value - min)) / (max - min)));
      return score;
    }, {});

    return {
      ...row,
      relativeScore,
    };
  });
}

function hasConcentratedScoreDistribution(scoreDistribution) {
  return ["x", "y", "z"].some((axis) => scoreDistribution?.[axis]?.concentrated);
}

function selectDisplayScoreMode(scoreDisplayMode, scoreDistribution) {
  if (scoreDisplayMode === "absolute" || scoreDisplayMode === "relative") {
    return scoreDisplayMode;
  }

  return hasConcentratedScoreDistribution(scoreDistribution) ? "relative" : "absolute";
}

function applyDisplayScores(rows, mode) {
  return rows.map((row) => {
    const absoluteScore = axisScoreOnly(row.absoluteScore || scoreFromRow(row));
    const relativeScore = axisScoreOnly(row.relativeScore || absoluteScore);
    const displayScore = mode === "relative" ? relativeScore : absoluteScore;

    return {
      ...row,
      absoluteScore,
      relativeScore,
      displayScore,
      x: displayScore.x,
      y: displayScore.y,
      z: displayScore.z,
    };
  });
}

function getScoreForDisplay(row, axis, mode = "auto") {
  if (mode === "absolute") {
    return Number(row?.absoluteScore?.[axis] ?? row?.[axis]) || 0;
  }

  if (mode === "relative") {
    return Number(row?.relativeScore?.[axis] ?? row?.[axis]) || 0;
  }

  return Number(row?.displayScore?.[axis] ?? row?.[axis]) || 0;
}

function getScoreTripletForDisplay(row, mode = "auto") {
  return ["x", "y", "z"].map((axis) => getScoreForDisplay(row, axis, mode)).join("/");
}

function firstPositiveNumber(values, fallback = 1) {
  const value = values.find((item) => Number.isFinite(Number(item)) && Number(item) > 0);
  return value ? Number(value) : fallback;
}

function clusterVolumeFromRow(row) {
  const memberIdCount = Array.isArray(row?.memberIds) ? row.memberIds.length : null;
  const itemCount = Array.isArray(row?.items) ? row.items.length : null;
  const memberRowCount = Array.isArray(row?.memberRows) ? row.memberRows.length : null;
  const independent = firstPositiveNumber(
    [row?.independentOpinionVolume, row?.uniqueCount, row?.uniqueNormalizedTextCount, memberRowCount, memberIdCount, itemCount, row?.count],
    1
  );
  const graph = firstPositiveNumber([row?.volumeForGraph, independent], independent);
  const weighted = firstPositiveNumber(
    [row?.spreadVolume, row?.volume?.weighted, row?.volumeWeighted, row?.originalCount, row?.duplicateCount, row?.count],
    graph
  );

  return {
    raw: graph,
    weighted,
    independent,
    spread: weighted,
    graph,
  };
}

function withClusterVolume(row) {
  const volume = clusterVolumeFromRow(row);
  return {
    ...row,
    independentOpinionVolume: volume.independent,
    spreadVolume: volume.spread,
    volumeForGraph: volume.graph,
    volume,
  };
}

function clusterVolumeDomain(rows) {
  const volumes = rows.filter((row) => row.group === "cluster").map((row) => clusterVolumeFromRow(row).raw);

  if (volumes.length === 0) {
    return { min: 1, max: 1 };
  }

  return {
    min: Math.min(...volumes),
    max: Math.max(...volumes),
  };
}

function normalizeClusterVolume(row, domain) {
  const volume = clusterVolumeFromRow(row).raw;

  if (!domain || domain.max === domain.min) {
    return 0.5;
  }

  return clamp((volume - domain.min) / (domain.max - domain.min), 0, 1);
}

function markerSizeForVolume(row, domain) {
  if (row.group !== "cluster") {
    return null;
  }

  if (!domain || domain.max === domain.min) {
    return 14;
  }

  return 8 + normalizeClusterVolume(row, domain) * 28;
}

function scoreDisplayModeLabel(mode = "auto") {
  if (mode === "absolute") return "絶対スコア";
  if (mode === "relative") return "相対スコア";
  return "表示スコア";
}

function scoreAxisHeader(axisLabelText, mode = "auto") {
  const axisName = String(axisLabelText || "").split(/[：:]/)[0] || axisLabelText;
  return `${axisName}（${scoreDisplayModeLabel(mode).replace("スコア", "")}）`;
}  return {
    axisScoreOnly,
    wordsInText,
    scoreMeta,
    scoreLevelLabel,
    axisExplanationItems,
    reasonKeywordsForAxis,
    buildScoreReasonForAxis,
    buildScoreReasons,
    ensureScoreReasons,
    calibrateScoreByRelevance,
    withScoreMeta,
    fallbackScore,
    addKeywordScore,
    axisKeywords,
    scoreByAxisKeywords,
    fallbackCustomAxisScore,
    fallbackReligionScore,
    fallbackDemocracyScore,
    fallbackRomanceScore,
    fallbackGeneralScore,
    fallbackCodingScore,
    scoreOpinion,
    scoreFromRow,
    calculateAxisDistribution,
    calculateScoreDistribution,
    normalizeRelativeScores,
    hasConcentratedScoreDistribution,
    selectDisplayScoreMode,
    applyDisplayScores,
    getScoreForDisplay,
    getScoreTripletForDisplay,
    firstPositiveNumber,
    clusterVolumeFromRow,
    withClusterVolume,
    clusterVolumeDomain,
    normalizeClusterVolume,
    markerSizeForVolume,
    scoreDisplayModeLabel,
    scoreAxisHeader,
  };
}