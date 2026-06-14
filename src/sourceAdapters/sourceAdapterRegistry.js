import { SOURCE_TYPES } from "./sourceTypes.js";
import { requestXPostsWithFallback } from "./xFetchClient.js";

export const xOpinionSourceAdapter = {
  sourceType: SOURCE_TYPES.X,
  sourceLabel: "X",
  buildRequest(input = {}, options = {}) {
    return {
      query: input.query || "",
      limit: input.limit,
      options,
    };
  },
  async fetch(request, dependencies = {}) {
    return requestXPostsWithFallback({
      query: request.query,
      limit: request.limit,
      options: request.options,
      context: dependencies.context,
    });
  },
  normalizeResponse(outcome) {
    return outcome;
  },
  normalizeError(error) {
    return error;
  },
  createDiagnostics(outcome) {
    return outcome?.queryInfo?.apiDiagnostics || null;
  },
};

export const sourceAdapterRegistry = {
  [SOURCE_TYPES.X]: xOpinionSourceAdapter,
};

export function getSourceAdapter(sourceType) {
  return sourceAdapterRegistry[sourceType] || null;
}
