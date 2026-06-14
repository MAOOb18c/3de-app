export function createUserInputPayload(scope = {}) {
  const {
    USER_INPUT_SAMPLE_KEY,
    beginnerXFetchDebug,
    beginnerXSourceSummary,
    currentInputSourceLabel,
    externalOpinions,
    handleThemeChange,
    inputCount,
    inputSource,
    inputSourceLabel,
    resetUserInputArea,
    sampleDisplayLabel,
    sampleKey,
    sampleLabel,
    sampleNoLabel,
    sampleOpinionTrial,
    sampleTitle,
    samples,
    syncUserInputSessionQuery,
    theme,
    themeCategory,
    userOpinion,
    userOpinionTextareaRef,
  } = scope;

  return {
      beginnerXFetchDebug, beginnerXSourceSummary, currentInputSourceLabel, externalOpinions, handleThemeChange, inputCount: typeof inputCount === "undefined" ? undefined : inputCount, inputSource: typeof inputSource === "undefined" ? undefined : inputSource, inputSourceLabel: typeof inputSourceLabel === "undefined" ? undefined : inputSourceLabel, resetUserInputArea, sampleDisplayLabel, sampleKey, sampleLabel: typeof sampleLabel === "undefined" ? undefined : sampleLabel, sampleNoLabel, sampleOpinionTrial: typeof sampleOpinionTrial === "undefined" ? undefined : sampleOpinionTrial, samples, sampleTitle, syncUserInputSessionQuery, theme, themeCategory, USER_INPUT_SAMPLE_KEY, userOpinion, userOpinionTextareaRef,
    };
}
