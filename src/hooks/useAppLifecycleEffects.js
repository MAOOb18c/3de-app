import { useEffect } from "react";
import {
  appModeFromPathname,
  autoResizeTextarea,
  PUBLIC_PREVIEW_MODE,
  readDatasetHistory,
  VIEW_MODE_STORAGE_KEY,
} from "../app/appSupport.jsx";

export function useAppLifecycleEffects({
  checkAnalysisDraftHealth,
  clusterMethod,
  graphMode,
  setAppMode,
  setClusterMethod,
  setDatasetHistory,
  setGraphMode,
  setToast,
  setViewMode,
  toast,
  userOpinion,
  userOpinionTextareaRef,
  viewMode,
}) {
  useEffect(() => {
    setDatasetHistory(readDatasetHistory());
  }, [setDatasetHistory]);

  useEffect(() => {
    if (PUBLIC_PREVIEW_MODE) {
      if (viewMode !== "user") {
        setViewMode("user");
      }
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "user");
      return;
    }

    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [setViewMode, viewMode]);

  useEffect(() => {
    function handlePopState() {
      setAppMode(appModeFromPathname(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setAppMode]);

  useEffect(() => {
    if (viewMode !== "user") return;
    if (graphMode === "compare") {
      setGraphMode("processed");
    }
    if (clusterMethod !== "semantic") {
      setClusterMethod("semantic");
    }
  }, [clusterMethod, graphMode, setClusterMethod, setGraphMode, viewMode]);

  useEffect(() => {
    autoResizeTextarea(userOpinionTextareaRef.current);
  }, [userOpinion, userOpinionTextareaRef]);

  useEffect(() => {
    checkAnalysisDraftHealth();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [setToast, toast]);
}
