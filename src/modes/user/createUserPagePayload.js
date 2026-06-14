import { createUserModeControllerPayload } from "../../results/createUserModeControllerPayload.js";
import { createUserLayoutPayload } from "./createUserLayoutPayload.js";
import { createUserDeveloperPayload } from "./createUserDeveloperPayload.js";
import { createUserInputPayload } from "./createUserInputPayload.js";
import { createUserDashboardPayload } from "./createUserDashboardPayload.js";
import { createUserActionsPayload } from "./createUserActionsPayload.js";
import { createUserDiagnosticsPayload } from "./createUserDiagnosticsPayload.js";
import { createUserGraphZonesPayload } from "./createUserGraphZonesPayload.js";
import { createUserRenderingPayload } from "./createUserRenderingPayload.js";
import { createUserConstantsPayload } from "./createUserConstantsPayload.js";
import { createUserMiscPayload } from "./createUserMiscPayload.js";

function flattenUserPagePayloadGroups(groups = {}) {
  const flatScope = {};
  for (const value of Object.values(groups || {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flatScope, value);
    }
  }
  return flatScope;
}

export function createUserPagePayload(groups = {}) {
  const scope = flattenUserPagePayloadGroups(groups);
  return createUserModeControllerPayload({
    layout: createUserLayoutPayload(scope),
    developer: createUserDeveloperPayload(scope),
    input: createUserInputPayload(scope),
    dashboard: createUserDashboardPayload(scope),
    actions: createUserActionsPayload(scope),
    diagnostics: createUserDiagnosticsPayload(scope),
    graphZones: createUserGraphZonesPayload(scope),
    rendering: createUserRenderingPayload(scope),
    constants: createUserConstantsPayload(scope),
    misc: createUserMiscPayload(scope),
  });
}
