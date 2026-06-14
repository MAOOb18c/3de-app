export function createClusterModel({
  clamp,
  normalizeOpinionText,
  scoreOpinion,
  stripRtPrefix,
  stripUrls,
  withClusterVolume,
}) {
function makeBigrams(text) {
  const normalizedText = normalizeOpinionText(text).replace(/\s+/g, "");

  if (normalizedText.length === 0) {
    return [];
  }

  if (normalizedText.length === 1) {
    return [normalizedText];
  }

  return Array.from({ length: normalizedText.length - 1 }, (_, index) =>
    normalizedText.slice(index, index + 2)
  );
}

function jaccardSimilarity(a, b) {
  const aSet = new Set(a);
  const bSet = new Set(b);

  if (aSet.size === 0 && bSet.size === 0) {
    return 1;
  }

  if (aSet.size === 0 || bSet.size === 0) {
    return 0;
  }

  let intersection = 0;

  aSet.forEach((value) => {
    if (bSet.has(value)) {
      intersection += 1;
    }
  });

  return intersection / (aSet.size + bSet.size - intersection);
}

// Section: Persona and theme query helpers
function normalizeSpreadTemplateText(text) {
  return stripUrls(stripRtPrefix(text))
    .replace(/@[A-Za-z0-9_]+/g, " ")
    .replace(/[#＃][\p{L}\p{N}_ー-]+/gu, " ")
    .replace(/[0-9０-９]+/g, " ")
    .replace(/[!-/:-@[-`{-~、。，．・！？!?「」『』（）()【】［］\[\]…♪★☆????]+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/\b[a-zA-Z0-9]{1,6}\b/g, " ")
    .replace(/[ぁ-んァ-ンー]{1,5}$/u, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clusterOpinionsByText(candidateRows, threshold) {
  const clusters = [];

  candidateRows.forEach((row) => {
    const targetCluster = clusters.find(
      (cluster) => jaccardSimilarity(row.bigrams, cluster.representativeBigrams) >= threshold
    );

    if (targetCluster) {
      targetCluster.items.push(row);

      const longestItem = targetCluster.items.reduce((longest, item) =>
        item.normalizedText.length > longest.normalizedText.length ? item : longest
      );

      targetCluster.representativeText = longestItem.normalizedText;
      targetCluster.representativeBigrams = makeBigrams(longestItem.normalizedText);
      return;
    }

    clusters.push({
      representativeText: row.normalizedText,
      representativeBigrams: row.bigrams,
      items: [row],
    });
  });

  return clusters;
}

function makeClusterRepresentative(cluster, index, sampleKey, axisConfig) {
  const representative = cluster.items.reduce((longest, item) =>
    item.normalizedText.length > longest.normalizedText.length ? item : longest
  );
  const independentOpinionVolume = cluster.items.reduce(
    (sum, item) => sum + (Number(item.independentOpinionVolume) || 1),
    0
  );
  const spreadVolume = cluster.items.reduce(
    (sum, item) => sum + (Number(item.spreadVolume) || Number(item.duplicateCount) || 1),
    0
  );
  const uniqueCount = independentOpinionVolume;
  const memberRows = cluster.items.map((item, memberIndex) => ({
    no: memberIndex + 1,
    id: String(item.originalNo || memberIndex + 1),
    label: String(item.originalNo || memberIndex + 1),
    duplicateCount: item.duplicateCount || 1,
    independentOpinionVolume: item.independentOpinionVolume || 1,
    spreadVolume: item.spreadVolume || item.duplicateCount || 1,
    spreadTemplateCount: item.spreadTemplateCount || 0,
    text: item.normalizedText,
    originalText: item.opinion,
  }));

  return withClusterVolume({
    originalNo: "-",
    label: `C${index + 1}`,
    type: `処理後クラスタ C${index + 1}`,
    opinion: representative.normalizedText,
    group: "cluster",
    count: independentOpinionVolume,
    originalCount: spreadVolume,
    uniqueCount,
    independentOpinionVolume,
    spreadVolume,
    volumeForGraph: independentOpinionVolume,
    duplicateCount: Math.max(0, spreadVolume - independentOpinionVolume),
    spreadTemplateCount: cluster.items.reduce((sum, item) => sum + (Number(item.spreadTemplateCount) || 0), 0),
    memberRows,
    ...scoreOpinion(representative.normalizedText, sampleKey, axisConfig),
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value) {
  return `${Math.round(Number(value) || 0)}`;
}

function clusterCountJudgement(clusterCount, analysisCandidateCount) {
  if (clusterCount <= 4) return { label: "少なすぎる", message: "意見の種類がやや少ない可能性があります。" };
  if (clusterCount <= 7) return { label: "やや少ない", message: "読める量ですが、多様性は少し弱い可能性があります。" };
  if (clusterCount <= 20) return { label: "読みやすい", message: "意見の多様性と読みやすさのバランスが良い状態です。" };
  if (clusterCount <= 40) return { label: "多め", message: "多様ですが、読むにはやや多いです。上位クラスタ要約を優先してください。" };
  return { label: "多すぎる", message: "クラスタが多すぎます。しきい値を下げるか、要約を優先してください。" };
}

function qualityLabel(value) {
  if (value === "good") return "良好";
  if (value === "usable") return "使用可";
  if (value === "warning") return "注意";
  if (value === "bad") return "不調";
  return "未評価";
}

function retrievalKpiMessage(kpi) {
  if (!kpi) return "";
  if (kpi.overallRetrievalQuality === "good") {
    return `取得品質は良好です。分析対象率${formatPercent(kpi.analysisCandidateRate)}、クラスタ${kpi.clusterCount}件で、読める量に整理されています。`;
  }
  if (kpi.overallRetrievalQuality === "usable") {
    return `取得効率は高くありませんが、使える分析対象が${kpi.analysisCandidateCount}件あり、クラスタに整理されています。デモ用途ならこのまま進めます。`;
  }
  if (kpi.overallRetrievalQuality === "warning") {
    return `取得品質は注意です。分析対象率${formatPercent(kpi.analysisCandidateRate)}、クラスタ${kpi.clusterCount}件です。多様性やノイズ条件を見直すと改善できます。`;
  }
  return `取得品質は不調です。X APIコストに対して使える分析対象やクラスタが少ないため、検索語・除外語・ハッシュタグを調整してください。`;
}

function buildRetrievalKpi(noiseResult, clusterRows, scoreDistribution) {
  const fetchedCount = noiseResult?.rawCount || 0;
  const normalizedCount = noiseResult?.uniqueNormalizedCount || 0;
  const analysisCandidateCount = noiseResult?.candidateCount || 0;
  const noiseCount = noiseResult?.noiseExcludedCount || 0;
  const duplicateLikeCount = noiseResult?.duplicateLikeCount || 0;
  const independentOpinionCount = noiseResult?.independentOpinionCount || analysisCandidateCount;
  const independentOpinionRate = fetchedCount > 0 ? independentOpinionCount / fetchedCount : 0;
  const spreadReferenceCount = noiseResult?.spreadReferenceCount || duplicateLikeCount;
  const spreadDominanceRate = fetchedCount > 0 ? spreadReferenceCount / fetchedCount : 0;
  const clusterCount = Array.isArray(clusterRows) ? clusterRows.length : 0;
  const analysisCandidateRate = fetchedCount > 0 ? analysisCandidateCount / fetchedCount : 0;
  const noiseRate = normalizedCount > 0 ? noiseCount / normalizedCount : 0;
  const duplicateLikeRate = fetchedCount > 0 ? duplicateLikeCount / fetchedCount : 0;
  const clusterCompressionRate = analysisCandidateCount > 0 ? 1 - clusterCount / analysisCandidateCount : 0;
  const topClusterShare =
    clusterRows?.length && analysisCandidateCount > 0
      ? Math.max(...clusterRows.map((row) => row.uniqueCount || 1)) / analysisCandidateCount
      : 0;
  const clusterCountScore =
    clusterCount >= 8 && clusterCount <= 20
      ? 100
      : clusterCount >= 5 && clusterCount <= 7
        ? 72
        : clusterCount >= 21 && clusterCount <= 40
          ? 66
          : clusterCount > 40
            ? 42
            : clusterCount > 0
              ? 45
              : 0;
  const balanceScore = Math.round((1 - Math.min(0.75, topClusterShare)) / 0.75 * 100);
  const scoreSpread = ["x", "y", "z"].reduce(
    (sum, axis) => sum + Math.min(1, (scoreDistribution?.[axis]?.standardDeviation || 0) / 2.5),
    0
  ) / 3;
  const diversityScore = Math.round(clamp(clusterCountScore * 0.45 + balanceScore * 0.3 + scoreSpread * 100 * 0.25, 0, 100));
  const readLoadScore =
    clusterCount >= 8 && clusterCount <= 20
      ? 100
      : clusterCount >= 5 && clusterCount <= 7
        ? 78
        : clusterCount >= 21 && clusterCount <= 40
          ? 58
          : clusterCount > 40
            ? 24
            : clusterCount > 0
              ? 42
              : 0;
  const costEfficiencyScore = Math.round(
    clamp(analysisCandidateRate * 100 * 0.65 + Math.min(1, clusterCount / Math.max(8, fetchedCount / 8 || 1)) * 100 * 0.35, 0, 100)
  );
  const clusterJudgement = clusterCountJudgement(clusterCount, analysisCandidateCount);
  let overallRetrievalQuality = "bad";

  if (analysisCandidateRate >= 0.3 && noiseRate < 0.5 && diversityScore >= 65 && clusterCount >= 8 && clusterCount <= 20) {
    overallRetrievalQuality = "good";
  } else if (analysisCandidateRate >= 0.15 && clusterCount >= 6 && clusterCount <= 30 && diversityScore >= 45) {
    overallRetrievalQuality = "usable";
  } else if (analysisCandidateRate >= 0.1 || clusterCount >= 5) {
    overallRetrievalQuality = "warning";
  }

  return {
    fetchedCount,
    normalizedCount,
    analysisCandidateCount,
    analysisCandidateRate,
    noiseCount,
    noiseRate,
    duplicateLikeCount,
    duplicateLikeRate,
    independentOpinionCount,
    independentOpinionRate,
    spreadReferenceCount,
    spreadDominanceRate,
    clusterCount,
    clusterCompressionRate,
    topClusterShare,
    diversityScore,
    readLoadScore,
    costEfficiencyScore,
    overallRetrievalQuality,
    clusterJudgement,
    message: retrievalKpiMessage({ analysisCandidateRate, analysisCandidateCount, clusterCount, overallRetrievalQuality }),
  };
}

  return {
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
  };
}





