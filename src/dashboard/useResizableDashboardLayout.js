import { useEffect, useRef, useState } from "react";
import {
  clampDashboardHeight,
  clampDashboardLeftWidth,
  clampDashboardSectionHeight,
  clampSidebarWidth,
  DASHBOARD_ACTION_DEFAULT_HEIGHT,
  DASHBOARD_ACTION_HEIGHT_STORAGE_KEY,
  DASHBOARD_ACTION_MIN_HEIGHT,
  DASHBOARD_DEFAULT_HEIGHT,
  DASHBOARD_HEIGHT_STORAGE_KEY,
  DASHBOARD_LEFT_DEFAULT_WIDTH,
  DASHBOARD_LEFT_MIN_WIDTH,
  DASHBOARD_LEFT_WIDTH_STORAGE_KEY,
  DASHBOARD_MIN_HEIGHT,
  DASHBOARD_STATUS_DEFAULT_HEIGHT,
  DASHBOARD_STATUS_HEIGHT_STORAGE_KEY,
  DASHBOARD_STATUS_MIN_HEIGHT,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from "../app/appSupport.jsx";

export function useResizableDashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return SIDEBAR_DEFAULT_WIDTH;
    }

    const savedSidebarWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const savedWidth = Number(savedSidebarWidth);

    if (savedSidebarWidth === null || !Number.isFinite(savedWidth) || savedWidth < SIDEBAR_MIN_WIDTH) {
      return SIDEBAR_DEFAULT_WIDTH;
    }

    return clampSidebarWidth(savedWidth);
  });
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const [dashboardHeight, setDashboardHeight] = useState(() => {
    if (typeof window === "undefined") {
      return DASHBOARD_DEFAULT_HEIGHT;
    }

    const savedDashboardHeight = window.localStorage.getItem(DASHBOARD_HEIGHT_STORAGE_KEY);
    const savedHeight = Number(savedDashboardHeight);

    if (savedDashboardHeight === null || !Number.isFinite(savedHeight) || savedHeight < DASHBOARD_MIN_HEIGHT) {
      return DASHBOARD_DEFAULT_HEIGHT;
    }

    return clampDashboardHeight(savedHeight);
  });
  const [isDashboardResizing, setIsDashboardResizing] = useState(false);
  const [dashboardLeftWidth, setDashboardLeftWidth] = useState(() => {
    if (typeof window === "undefined") {
      return DASHBOARD_LEFT_DEFAULT_WIDTH;
    }

    const savedDashboardLeftWidth = window.localStorage.getItem(DASHBOARD_LEFT_WIDTH_STORAGE_KEY);
    const savedWidth = Number(savedDashboardLeftWidth);

    if (savedDashboardLeftWidth === null || !Number.isFinite(savedWidth) || savedWidth < DASHBOARD_LEFT_MIN_WIDTH) {
      return DASHBOARD_LEFT_DEFAULT_WIDTH;
    }

    return clampDashboardLeftWidth(savedWidth);
  });
  const [dashboardStatusHeight, setDashboardStatusHeight] = useState(() => {
    if (typeof window === "undefined") {
      return DASHBOARD_STATUS_DEFAULT_HEIGHT;
    }

    const savedHeightValue = Number(window.localStorage.getItem(DASHBOARD_STATUS_HEIGHT_STORAGE_KEY));
    return Number.isFinite(savedHeightValue) && savedHeightValue >= DASHBOARD_STATUS_MIN_HEIGHT
      ? clampDashboardSectionHeight(savedHeightValue, DASHBOARD_STATUS_MIN_HEIGHT)
      : DASHBOARD_STATUS_DEFAULT_HEIGHT;
  });
  const [dashboardActionHeight, setDashboardActionHeight] = useState(() => {
    if (typeof window === "undefined") {
      return DASHBOARD_ACTION_DEFAULT_HEIGHT;
    }

    const savedHeightValue = Number(window.localStorage.getItem(DASHBOARD_ACTION_HEIGHT_STORAGE_KEY));
    return Number.isFinite(savedHeightValue) && savedHeightValue >= DASHBOARD_ACTION_MIN_HEIGHT
      ? clampDashboardSectionHeight(savedHeightValue, DASHBOARD_ACTION_MIN_HEIGHT)
      : DASHBOARD_ACTION_DEFAULT_HEIGHT;
  });
  const [dashboardResizeTarget, setDashboardResizeTarget] = useState("");

  const dashboardPanelRef = useRef(null);
  const dashboardStatusPanelRef = useRef(null);
  const dashboardActionPanelRef = useRef(null);

  useEffect(() => {
    if (!isSidebarResizing) {
      return undefined;
    }

    function handleSidebarMouseMove(event) {
      const nextWidth = clampSidebarWidth(event.clientX);
      setSidebarWidth(nextWidth);
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(nextWidth)));
    }

    function handleSidebarMouseUp() {
      setIsSidebarResizing(false);
    }

    document.body.classList.add("is-resizing-sidebar");
    window.addEventListener("mousemove", handleSidebarMouseMove);
    window.addEventListener("mouseup", handleSidebarMouseUp);

    return () => {
      document.body.classList.remove("is-resizing-sidebar");
      window.removeEventListener("mousemove", handleSidebarMouseMove);
      window.removeEventListener("mouseup", handleSidebarMouseUp);
    };
  }, [isSidebarResizing]);

  useEffect(() => {
    if (!isDashboardResizing) {
      return undefined;
    }

    function handleDashboardMouseMove(event) {
      const nextHeight = clampDashboardHeight(event.clientY);
      setDashboardHeight(nextHeight);
      window.localStorage.setItem(DASHBOARD_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
    }

    function handleDashboardMouseUp() {
      setIsDashboardResizing(false);
    }

    document.body.classList.add("is-resizing-dashboard");
    window.addEventListener("mousemove", handleDashboardMouseMove);
    window.addEventListener("mouseup", handleDashboardMouseUp);

    return () => {
      document.body.classList.remove("is-resizing-dashboard");
      window.removeEventListener("mousemove", handleDashboardMouseMove);
      window.removeEventListener("mouseup", handleDashboardMouseUp);
    };
  }, [isDashboardResizing]);

  useEffect(() => {
    if (!dashboardResizeTarget) {
      return undefined;
    }

    function handleDashboardPaneMouseMove(event) {
      if (dashboardResizeTarget === "left") {
        const panelLeft = dashboardPanelRef.current?.getBoundingClientRect().left ?? 0;
        const nextWidth = clampDashboardLeftWidth(event.clientX - panelLeft);
        setDashboardLeftWidth(nextWidth);
        window.localStorage.setItem(DASHBOARD_LEFT_WIDTH_STORAGE_KEY, String(Math.round(nextWidth)));
        return;
      }

      if (dashboardResizeTarget === "status") {
        const panelTop = dashboardStatusPanelRef.current?.getBoundingClientRect().top ?? 0;
        const nextHeight = clampDashboardSectionHeight(event.clientY - panelTop, DASHBOARD_STATUS_MIN_HEIGHT);
        setDashboardStatusHeight(nextHeight);
        window.localStorage.setItem(DASHBOARD_STATUS_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
        return;
      }

      if (dashboardResizeTarget === "actions") {
        const panelTop = dashboardActionPanelRef.current?.getBoundingClientRect().top ?? 0;
        const nextHeight = clampDashboardSectionHeight(event.clientY - panelTop, DASHBOARD_ACTION_MIN_HEIGHT);
        setDashboardActionHeight(nextHeight);
        window.localStorage.setItem(DASHBOARD_ACTION_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
      }
    }

    function handleDashboardPaneMouseUp() {
      setDashboardResizeTarget("");
    }

    document.body.classList.add("is-resizing-dashboard-pane");
    window.addEventListener("mousemove", handleDashboardPaneMouseMove);
    window.addEventListener("mouseup", handleDashboardPaneMouseUp);

    return () => {
      document.body.classList.remove("is-resizing-dashboard-pane");
      window.removeEventListener("mousemove", handleDashboardPaneMouseMove);
      window.removeEventListener("mouseup", handleDashboardPaneMouseUp);
    };
  }, [dashboardResizeTarget]);

  useEffect(() => {
    function handleWindowResize() {
      setSidebarWidth((currentWidth) => {
        const nextWidth = clampSidebarWidth(currentWidth);
        window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(nextWidth)));
        return nextWidth;
      });
      setDashboardHeight((currentHeight) => {
        const nextHeight = clampDashboardHeight(currentHeight);
        window.localStorage.setItem(DASHBOARD_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
        return nextHeight;
      });
      setDashboardLeftWidth((currentWidth) => {
        const nextWidth = clampDashboardLeftWidth(currentWidth);
        window.localStorage.setItem(DASHBOARD_LEFT_WIDTH_STORAGE_KEY, String(Math.round(nextWidth)));
        return nextWidth;
      });
      setDashboardStatusHeight((currentHeight) => {
        const nextHeight = clampDashboardSectionHeight(currentHeight, DASHBOARD_STATUS_MIN_HEIGHT);
        window.localStorage.setItem(DASHBOARD_STATUS_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
        return nextHeight;
      });
      setDashboardActionHeight((currentHeight) => {
        const nextHeight = clampDashboardSectionHeight(currentHeight, DASHBOARD_ACTION_MIN_HEIGHT);
        window.localStorage.setItem(DASHBOARD_ACTION_HEIGHT_STORAGE_KEY, String(Math.round(nextHeight)));
        return nextHeight;
      });
    }

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return {
    dashboardActionHeight,
    dashboardActionPanelRef,
    dashboardHeight,
    dashboardLeftWidth,
    dashboardPanelRef,
    dashboardStatusHeight,
    dashboardStatusPanelRef,
    setDashboardResizeTarget,
    setIsDashboardResizing,
    setIsSidebarResizing,
    sidebarWidth,
  };
}
