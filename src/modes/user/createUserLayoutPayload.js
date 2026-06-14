import { createUserLayoutProps } from "./createUserLayoutProps.js";
export function createUserLayoutPayload(scope = {}) {
  const {
    activeMode,
    activeModeLabel,
    modeNav,
    publicPreviewMode,
    viewMode,
    workflowClass,
  } = scope;

  return createUserLayoutProps({
      activeMode, activeModeLabel, modeNav, publicPreviewMode: typeof publicPreviewMode === "undefined" ? undefined : publicPreviewMode, viewMode, workflowClass,
    });
}
