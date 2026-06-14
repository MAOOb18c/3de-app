export function createUserZone6Props(ctx) {
  const {
    axisConfig,
    axisLabels,
    currentSessionSampleLabel,
    result,
    theme,
    userOpinion,
  } = ctx;

  return {
    overview: {
      currentSessionSampleLabel,
      theme,
      userOpinion,
      candidateCount: result.noiseProcessingResult.candidateCount,
      clusterCount: result.clusterTableRows.length,
    },
    axis: {
      labels: axisLabels,
      config: axisConfig,
    },
  };
}
