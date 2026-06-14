import { useEffect } from "react";
import Plotly from "plotly.js-dist-min";

export function usePlotlyGraphRenderer({
  appMode,
  graphViewModel,
  plot2dRef,
  plot3dRef,
  onClusterSelect,
}) {
  useEffect(() => {
    if (appMode !== "user" && appMode !== "developer") {
      return undefined;
    }
    if (!plot3dRef.current) {
      return undefined;
    }

    const plotElement = plot3dRef.current;
    const { traces, layout, config } = graphViewModel.plot3d;

    Plotly.newPlot(plotElement, traces, layout, config).then(() => {
      plotElement?.removeAllListeners?.("plotly_click");
      plotElement?.on?.("plotly_click", (event) => {
        const point = event?.points?.[0];
        const group = point?.customdata?.[6];
        const label = point?.customdata?.[5];
        if (group === "cluster") {
          onClusterSelect(label);
        }
      });
    });

    return () => {
      plotElement?.removeAllListeners?.("plotly_click");
    };
  }, [appMode, graphViewModel, onClusterSelect, plot3dRef]);

  useEffect(() => {
    if (appMode !== "user" && appMode !== "developer") {
      return undefined;
    }
    if (!plot2dRef.current) {
      return undefined;
    }

    const plotElement = plot2dRef.current;
    const { traces, layout, config } = graphViewModel.plot2d;

    Plotly.newPlot(plotElement, traces, layout, config).then(() => {
      plotElement?.removeAllListeners?.("plotly_click");
      plotElement?.on?.("plotly_click", (event) => {
        const point = event?.points?.[0];
        const group = point?.customdata?.[6];
        const label = point?.customdata?.[5];
        if (group === "cluster") {
          onClusterSelect(label);
        }
      });
    });

    return () => {
      plotElement?.removeAllListeners?.("plotly_click");
    };
  }, [appMode, graphViewModel, onClusterSelect, plot2dRef]);
}
