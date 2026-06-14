import { BEGINNER_FIXED_X_COUNT } from "../app/appSupport.jsx";
import { createIdleSourceFetchDebug } from "../sourceAdapters/sourceFetchTypes.js";
import { SOURCE_TYPES } from "../sourceAdapters/sourceTypes.js";
import { createFetchedUserResultSnapshot } from "./applyFetchedResultModel.js";

export function prepareXFetchState({
  options = {},
  resetAutoSummaryState,
  setters,
}) {
  const { preserveBeginnerState = true, resetBeginnerState = false } = options;
  if (resetBeginnerState || !preserveBeginnerState) {
    setters.setBeginnerResult(null);
    setters.setBeginnerStatus("idle");
    setters.setBeginnerMessage("");
    setters.setBeginnerResultSlot(null);
    setters.setBeginnerXFetchDebug(createIdleSourceFetchDebug({
      sourceType: SOURCE_TYPES.X,
      requested: BEGINNER_FIXED_X_COUNT,
    }));
  }
  setters.setExternalOpinions("");
  setters.setXPosts([]);
  setters.setSemanticClusterRows([]);
  setters.setSemanticClusterStatus("");
  setters.setSemanticClusterError("");
  setters.setExpandedClusterIds({});
  setters.setSelectedClusterId("");
  setters.setClusterSummaries({});
  setters.setIsClusterSummaryLoadingById({});
  setters.setClusterSummaryErrorById({});
  resetAutoSummaryState();
  setters.setActiveDatasetId("");
  setters.setActiveClusterRunId("");
  setters.setXDataStatus("fetching");
  setters.setHistoryStatus("");
}

export function applyFetchedXPostsToState({
  axisConfig,
  clearActiveClusterRunState,
  context,
  currentModeInputKey,
  effectiveQuery,
  options = {},
  posts,
  resetAutoSummaryState,
  semanticClusterRows,
  setters,
  stagedFetchState,
  texts,
  xMaxResults,
}) {
  setters.setExternalOpinions(texts.join("\n"));
  setters.setXPosts(posts);
  setters.setXDataStatus("unsaved");
  setters.setHasScoredWithCurrentAxis(false);
  clearActiveClusterRunState();
  setters.setSemanticClusterRows([]);
  setters.setSemanticClusterStatus("");
  setters.setSemanticClusterError("");
  setters.setClusterSummaries({});
  resetAutoSummaryState();
  setters.setQueryDirty(false);

  const nextUserResultSlot = createFetchedUserResultSnapshot({
    appMode: context.appMode,
    options,
    currentModeInputKey,
    theme: context.theme,
    userOpinion: context.userOpinion,
    posts,
    texts,
    xMaxResults,
    stagedFetchState,
    semanticClusterRows,
    axisConfig,
    effectiveQuery,
  });

  if (nextUserResultSlot) {
    setters.setUserResultSlot(nextUserResultSlot);
  }
}
