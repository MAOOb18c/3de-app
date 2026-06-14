import { runSourceFetchWorkflow } from "./sourceFetchWorkflow.js";

export function createSourceWorkflowDependencies({
  apiBaseUrl,
  themeCategory,
  theme,
  userOpinion,
  personaMode,
  analysisPurposeMode,
  selectedHashtagValues,
  selectedExcludeTermValues,
  xFetchAbortControllerRef,
} = {}) {
  return {
    context: {
      apiBaseUrl,
      themeCategory,
      theme,
      userOpinion,
      personaMode,
      analysisPurposeMode,
      selectedHashtagValues,
      selectedExcludeTermValues,
      xFetchAbortControllerRef,
    },
  };
}

export async function requestSourceOpinionsForWorkflow({
  sourceType,
  query,
  limit,
  options = {},
  dependencies = {},
}) {
  return runSourceFetchWorkflow({
    sourceType,
    input: { query, limit },
    options,
    dependencies,
  });
}
