import { getSourceAdapter } from "./sourceAdapterRegistry.js";

export async function fetchSourceOpinions({
  sourceType,
  input = {},
  options = {},
  dependencies = {},
}) {
  const adapter = getSourceAdapter(sourceType);

  if (!adapter) {
    const error = new Error(`Unsupported source type: ${sourceType || "unknown"}`);
    error.errorType = "unsupported_source_type";
    error.sourceType = sourceType || "";
    throw error;
  }

  const request = adapter.buildRequest(input, options);

  try {
    const response = await adapter.fetch(request, dependencies);
    const outcome = adapter.normalizeResponse(response);
    return {
      ...outcome,
      sourceType: adapter.sourceType,
      sourceLabel: adapter.sourceLabel,
      sourceDiagnostics: adapter.createDiagnostics(outcome),
    };
  } catch (error) {
    throw adapter.normalizeError(error);
  }
}
