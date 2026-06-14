export const SOURCE_TYPES = {
  X: "x",
  WEB: "web",
  CSV: "csv",
  SURVEY: "survey",
  MANUAL: "manual",
  TRANSCRIPT: "transcript",
  CLASSROOM_RESPONSES: "classroom-responses",
  UPLOADED_FREE_TEXT: "uploaded-free-text",
};

export function createSourceMeta({
  sourceType = SOURCE_TYPES.X,
  sourceLabel = "X",
  fetchedAt = "",
  stopReason = "",
  fallbackUsed = false,
} = {}) {
  return {
    sourceType,
    sourceLabel,
    fetchedAt,
    stopReason,
    fallbackUsed,
  };
}
