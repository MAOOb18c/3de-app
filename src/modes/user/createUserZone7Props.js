export function createUserZone7Props(ctx) {
  const {
    PUBLIC_PREVIEW_MODE,
    currentXDataStateLabel,
    effectiveQuery,
    externalOpinions,
    resetAutoSummaryState,
    setActiveClusterRunId,
    setActiveDatasetId,
    setClusterSummaries,
    setExternalOpinions,
    setHasScoredWithCurrentAxis,
    setHistoryStatus,
    setSemanticClusterError,
    setSemanticClusterRows,
    setSemanticClusterStatus,
    setXDataStatus,
    viewMode,
    xPosts,
    xStatus,
  } = ctx;

  return {
    value: externalOpinions,
    onChange: (value) => {
      setExternalOpinions(value);
      setActiveDatasetId("");
      setActiveClusterRunId("");
      setXDataStatus(value.trim() ? "unsaved" : "sample");
      setHasScoredWithCurrentAxis(false);
      setSemanticClusterRows([]);
      setSemanticClusterStatus("");
      setSemanticClusterError("");
      setClusterSummaries({});
      resetAutoSummaryState();
      setHistoryStatus("");
    },
    stateLabel: currentXDataStateLabel(),
    viewMode,
    effectiveQuery,
    publicPreviewMode: PUBLIC_PREVIEW_MODE,
    xStatus,
    posts: xPosts,
  };
}
