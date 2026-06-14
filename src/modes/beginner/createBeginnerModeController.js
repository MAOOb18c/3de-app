export function createBeginnerModeController({
  modeNav,
  themeInput,
  opinionInput,
  status,
  message,
  analysisResult,
  categories,
  onThemeChange,
  onOpinionChange,
  onRun,
}) {
  return {
    modeNav,
    input: {
      themeInput,
      opinionInput,
    },
    result: {
      status,
      message,
      analysisResult,
      categories,
    },
    actions: {
      onThemeChange,
      onOpinionChange,
      onRun,
    },
  };
}
