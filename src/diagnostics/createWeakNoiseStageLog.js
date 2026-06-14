import { createSourceStageLog } from "../sourceAdapters/sourceFetchWorkflow.js";

export function createWeakNoiseStageLog({
  previousStageLogs = [],
  query,
  diagnosis,
  accumulatedCount,
}) {
  return createSourceStageLog({
    outcome: null,
    fallbackQuery: query,
    stageNo: previousStageLogs.length + 1,
    action: "weak_noise_retry",
    query,
    fetchedCount: 0,
    accumulatedCount,
    diagnosis,
  });
}
