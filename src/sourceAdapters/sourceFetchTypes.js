import { SOURCE_TYPES } from "./sourceTypes.js";
import { createXFetchDebug } from "./xSourceAdapter.js";

export function createIdleSourceFetchDebug({
  sourceType = SOURCE_TYPES.X,
  query = "",
  requested = 0,
  message = "未実行",
} = {}) {
  if (sourceType === SOURCE_TYPES.X) {
    return createXFetchDebug({
      status: "idle",
      query,
      requested,
      message,
    });
  }

  return {
    status: "idle",
    query,
    requested,
    returned: 0,
    fallbackUsed: false,
    message,
  };
}
