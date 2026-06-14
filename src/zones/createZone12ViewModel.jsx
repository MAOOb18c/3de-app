function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createZone12ViewModel({
  result,
  zone12Filter,
  queryReviewParts,
  stagedFetchState,
  themeCategory,
  axisConfig,
  viewMode,
  JP_UI_LABELS,
  NOISE_CATEGORY_LABELS,
  uniqueValues,
  looksLikeMojibake,
  safeRuntimeText,
  scoreOpinion,
  normalizeOpinionText,
}) {
  function zone12TextForRow(row) {
    return safeRuntimeText(
      row?.normalizedText || row?.processedText || row?.opinion || row?.rawNormalizedText || row?.text || "",
      viewMode
    );
  }

  function zone12SearchableText(row) {
    return [
      row?.opinion,
      row?.normalizedText,
      row?.processedText,
      row?.rawNormalizedText,
      row?.text,
      row?.rawText,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function zone12TermHits(row, terms) {
    const searchableText = zone12SearchableText(row).toLowerCase();
    return uniqueValues(terms)
      .filter((term) => !looksLikeMojibake(term))
      .filter((term) => {
        const normalizedTerm = String(term || "").replace(/^#/, "").trim().toLowerCase();
        return normalizedTerm.length >= 2 && searchableText.includes(normalizedTerm);
      });
  }

  function extractZone12Hashtags(row) {
    const structuredHashtags = [
      ...(Array.isArray(row?.hashtags) ? row.hashtags : []),
      ...(Array.isArray(row?.matchedHashtags) ? row.matchedHashtags : []),
      row?.hashtag,
    ];
    const textHashtags = zone12SearchableText(row).match(/#[^\s#。、，,.!?！？)）\]】」』]+/g) || [];

    return uniqueValues([...structuredHashtags, ...textHashtags]
      .map((tag) => String(tag || "").trim())
      .filter((tag) => tag.startsWith("#") && !looksLikeMojibake(tag)));
  }

  function zone12StatusForRow(row) {
    const status = row?.zone12Status || "";
    const categoryText = `${row?.type || ""} ${row?.group || ""} ${row?.noiseCategory || ""} ${row?.noiseReason || ""}`;

    if (status === "user" || row?.group === "user") return { key: "user", label: JP_UI_LABELS.zone12StatusUser };
    if (status === "borderline" || row?.borderlineReason) return { key: "borderline", label: JP_UI_LABELS.zone12StatusBorderline };
    if (status === "duplicate" || /duplicate|重複|RT|コピー|拡散/.test(categoryText)) {
      return { key: "duplicate", label: JP_UI_LABELS.zone12StatusDuplicate };
    }
    if (status === "excluded" || row?.type === JP_UI_LABELS.zone12StatusExcluded) return { key: "excluded", label: JP_UI_LABELS.zone12StatusExcluded };
    if (status === "noise" || row?.noiseReason || row?.group === "noise") return { key: "noise", label: JP_UI_LABELS.zone12StatusNoise };
    return { key: "accepted", label: JP_UI_LABELS.zone12StatusAccepted };
  }

  function zone12ReasonForRow(row) {
    const status = zone12StatusForRow(row);
    const categoryLabel = row?.noiseCategory ? (NOISE_CATEGORY_LABELS[row.noiseCategory] || row.noiseCategory) : "";

    if (status.key === "user") return "自分の意見です。比較の基準として表示しています。";
    if (row?.borderlineReason) return row.borderlineReason;
    if (row?.noiseReason) return `${categoryLabel ? `${categoryLabel}: ` : ""}${row.noiseReason}`;
    if (status.key === "duplicate") return "同一または類似した拡散・重複投稿として扱っています。";
    if (status.key === "excluded") return "分析対象から除外された投稿です。";
    if ((row?.duplicateCount || 1) > 1) return `採用。類似・重複を${row.duplicateCount}件まとめています。`;
    return "採用。検索条件とテーマに照らして分析対象にしています。";
  }

  function zone12DecorateRow(row, status, fallbackType) {
    const text = zone12TextForRow(row);
    const scored = row?.x !== undefined && row?.y !== undefined && row?.z !== undefined
      ? {}
      : scoreOpinion(text, themeCategory, axisConfig);

    return {
      ...row,
      ...scored,
      zone12Status: status,
      type: row?.type || fallbackType,
      opinion: text,
    };
  }

  function zone12RowKey(row) {
    return normalizeOpinionText(row?.processedText || row?.normalizedText || row?.opinion || row?.rawNormalizedText || row?.text || "");
  }

  const zone12HighlightTerms = uniqueValues([
    ...queryReviewParts.includeTerms,
    ...queryReviewParts.includeHashtags,
    ...queryReviewParts.includeHashtags.map((tag) => String(tag || "").replace(/^#/, "")),
  ]).filter((term) => term.length >= 2 && !looksLikeMojibake(term));
  const zone12ExcludeTerms = uniqueValues(queryReviewParts.excludeTerms).filter((term) => term.length >= 2 && !looksLikeMojibake(term));
  const zone12InspectionRows = (() => {
    const stats = result.noiseProcessingResult || {};
    const borderlineRows = Array.isArray(stats.borderlineUsefulRows) ? stats.borderlineUsefulRows : [];
    const borderlineKeys = new Set(borderlineRows.map(zone12RowKey));
    const acceptedRows = (Array.isArray(stats.candidateRows) ? stats.candidateRows : []).map((row) =>
      zone12DecorateRow(row, "accepted", JP_UI_LABELS.zone12StatusAccepted)
    );
    const visibleBorderlineRows = borderlineRows.map((row) => zone12DecorateRow(row, "borderline", JP_UI_LABELS.borderlineOpinions));
    const noiseRows = (Array.isArray(stats.noiseExcludedRows) ? stats.noiseExcludedRows : [])
      .filter((row) => !borderlineKeys.has(zone12RowKey(row)))
      .map((row) => zone12DecorateRow(row, "noise", JP_UI_LABELS.zone12StatusNoise));
    const userRow = result.user ? [zone12DecorateRow(result.user, "user", "自分の意見")] : [];
    const rows = [...userRow, ...acceptedRows, ...visibleBorderlineRows, ...noiseRows];

    if (rows.length > 0) return rows;

    return result.tableRows.map((row) => zone12DecorateRow(row, row.group === "user" ? "user" : "accepted", row.type || "意見"));
  })();
  const zone12FilteredRows = zone12InspectionRows.filter((row) => {
    if (zone12Filter === "all") return true;
    const status = zone12StatusForRow(row).key;
    if (zone12Filter === "noise") return ["noise", "duplicate", "excluded"].includes(status);
    return status === zone12Filter;
  });
  const zone12Counts = zone12InspectionRows.reduce(
    (counts, row) => {
      const status = zone12StatusForRow(row).key;
      counts.all += 1;
      if (status === "accepted") counts.accepted += 1;
      if (status === "borderline") counts.borderline += 1;
      if (["noise", "duplicate", "excluded"].includes(status)) counts.noise += 1;
      return counts;
    },
    { all: 0, accepted: 0, borderline: 0, noise: 0 }
  );
  const zone12TopNoiseReasons = Object.entries(result.noiseProcessingResult.noiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`);
  const zone12ZeroAnalysisSummary =
    result.noiseProcessingResult.analysisTargetCount === 0 &&
    (result.noiseProcessingResult.rawCount > 0 || (stagedFetchState.totalApiFetchedCount || 0) > 0)
      ? {
          fetchedCount: stagedFetchState.totalApiFetchedCount || result.noiseProcessingResult.rawCount,
          noiseRemovedCount: result.noiseProcessingResult.noiseExcludedCount || 0,
          reasons: zone12TopNoiseReasons,
        }
      : null;

  function renderHighlightedZone12Text(text) {
    const sourceText = String(text || "");
    const sortedTerms = [...zone12HighlightTerms].sort((a, b) => b.length - a.length);

    if (!sourceText || sortedTerms.length === 0) {
      return sourceText;
    }

    const pattern = new RegExp(`(${sortedTerms.map(escapeRegExp).join("|")})`, "gi");

    return sourceText.split(pattern).map((part, index) => {
      const matched = sortedTerms.some((term) => part.toLowerCase() === term.toLowerCase());
      return matched ? (
        <mark key={`${part}-${index}`} className="query-hit-highlight">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  }

  return {
    zone12HighlightTerms,
    zone12ExcludeTerms,
    zone12InspectionRows,
    zone12FilteredRows,
    zone12Counts,
    zone12TopNoiseReasons,
    zone12ZeroAnalysisSummary,
    zone12TermHits,
    extractZone12Hashtags,
    zone12StatusForRow,
    zone12ReasonForRow,
    renderHighlightedZone12Text,
  };
}
