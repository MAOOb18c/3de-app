export function createGraphViewModel({
  result,
  theme,
  axisLabels,
  originCentered,
  scoreDisplayMode,
  clusterSummaries,
  clusterSummaryKey,
  clusterVolumeFromRow,
  clusterVolumeDomain,
  getScoreForDisplay,
  truncateText,
  sizeOf,
  colorOf,
  markerSymbolOf,
  VOLUME_COLOR_SCALE,
}) {
  const rows = result.graphRows;
  const activeGraphScoreMode = scoreDisplayMode;
  const volumeDomain = clusterVolumeDomain(rows);

  function summaryForCluster(cluster) {
    return clusterSummaries[clusterSummaryKey(cluster)] || null;
  }

  function graphLabelForRow(row) {
    if (row.group === "cluster") return row.label;
    if (row.group === "user") return "自分";
    return "";
  }

  function hoverDataForRow(row) {
    const isCluster = row.group === "cluster";
    const summary = isCluster ? summaryForCluster(row) : null;
    const volume = clusterVolumeFromRow(row);
    const title = isCluster ? row.label : `${row.label || row.type}`;
    const body = isCluster ? summary?.title || "未要約クラスタ" : truncateText(row.opinion, 60);

    return [
      title,
      isCluster ? `独立意見：${volume.independent}件` : "",
      truncateText(body, 48),
      isCluster
        ? `今回の分析対象内では${volume.independent >= 5 ? "比較的大きい" : "小さめの"}クラスタです。世論全体の大きさではありません。`
        : row.type || "",
      isCluster ? "詳細を見るには点をクリックしてZone⑨へ移動" : "",
      row.label || "",
      row.group || "",
    ];
  }

  const camera = originCentered
    ? {
        eye: { x: 1.35, y: 1.35, z: 1.15 },
        center: { x: -0.35, y: -0.35, z: -0.35 },
      }
    : {
        eye: { x: 1.5, y: 1.5, z: 1.2 },
        center: { x: 0, y: 0, z: 0 },
      };

  const axisTraces = [
    {
      type: "scatter3d",
      mode: "lines",
      x: [0, 9.6],
      y: [0, 0],
      z: [0, 0],
      line: { width: 7, color: "#111827" },
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "scatter3d",
      mode: "lines",
      x: [0, 0],
      y: [0, 9.6],
      z: [0, 0],
      line: { width: 7, color: "#111827" },
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "scatter3d",
      mode: "lines",
      x: [0, 0],
      y: [0, 0],
      z: [0, 9.6],
      line: { width: 7, color: "#111827" },
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "cone",
      x: [9.8],
      y: [0],
      z: [0],
      u: [1],
      v: [0],
      w: [0],
      sizemode: "absolute",
      sizeref: 0.55,
      anchor: "tip",
      colorscale: [[0, "#111827"], [1, "#111827"]],
      showscale: false,
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "cone",
      x: [0],
      y: [9.8],
      z: [0],
      u: [0],
      v: [1],
      w: [0],
      sizemode: "absolute",
      sizeref: 0.55,
      anchor: "tip",
      colorscale: [[0, "#111827"], [1, "#111827"]],
      showscale: false,
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "cone",
      x: [0],
      y: [0],
      z: [9.8],
      u: [0],
      v: [0],
      w: [1],
      sizemode: "absolute",
      sizeref: 0.55,
      anchor: "tip",
      colorscale: [[0, "#111827"], [1, "#111827"]],
      showscale: false,
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "scatter3d",
      mode: "text",
      x: [8.2, 0.8, 0.8],
      y: [0.8, 8.2, 0.8],
      z: [0.3, 0.3, 8.2],
      text: [axisLabels.x, axisLabels.y, axisLabels.z],
      textfont: { color: "#111827", size: 13 },
      showlegend: false,
      hoverinfo: "skip",
    },
  ];
  const labeledClusterIds = new Set(
    rows
      .filter((row) => row.group === "cluster")
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map((row) => row.label)
  );

  function make3dTrace(groupName, group) {
    const targets = rows.filter((row) => row.group === group);
    const isClusterTrace = group === "cluster";

    return {
      type: "scatter3d",
      mode: "markers+text",
      name: groupName,
      x: targets.map((row) => getScoreForDisplay(row, "x", activeGraphScoreMode)),
      y: targets.map((row) => getScoreForDisplay(row, "y", activeGraphScoreMode)),
      z: targets.map((row) => getScoreForDisplay(row, "z", activeGraphScoreMode)),
      text: targets.map((row) =>
        row.group === "cluster" && !labeledClusterIds.has(row.label) ? "" : graphLabelForRow(row)
      ),
      textposition: "top center",
      marker: {
        size: targets.map((row) => sizeOf(row, volumeDomain)),
        color: targets.map((row) => colorOf(row, volumeDomain)),
        symbol: targets.map(markerSymbolOf),
        colorscale: isClusterTrace ? VOLUME_COLOR_SCALE : undefined,
        cmin: isClusterTrace ? 0 : undefined,
        cmax: isClusterTrace ? 1 : undefined,
        showscale: isClusterTrace && targets.length > 0,
        colorbar: isClusterTrace
          ? {
              title: "独立意見数",
              tickmode: "array",
              tickvals: [0, 0.5, 1],
              ticktext: ["小", "中", "大"],
            }
          : undefined,
        opacity: isClusterTrace ? 0.65 : 1,
        line: { color: "white", width: 1 },
      },
      customdata: targets.map(hoverDataForRow),
      hovertemplate:
        "%{customdata[0]}<br>" +
        "%{customdata[1]}<br>" +
        "%{customdata[2]}<br>" +
        "%{customdata[3]}<br>" +
        "%{customdata[4]}<br>" +
        `${axisLabels.x}：%{x}<br>${axisLabels.y}：%{y}<br>${axisLabels.z}：%{z}<extra></extra>`,
    };
  }

  const clusterRows = rows.filter((row) => row.group === "cluster");
  const otherRows = rows.filter((row) => row.group !== "cluster");
  const planes = [
    { name: "XY", xAxis: "x", yAxis: "y", xaxis: "x", yaxis: "y", xLabel: axisLabels.x, yLabel: axisLabels.y },
    { name: "XZ", xAxis: "x", yAxis: "z", xaxis: "x2", yaxis: "y2", xLabel: axisLabels.x, yLabel: axisLabels.z },
    { name: "YZ", xAxis: "y", yAxis: "z", xaxis: "x3", yaxis: "y3", xLabel: axisLabels.y, yLabel: axisLabels.z },
  ];

  function make2dTrace(targets, plane, isClusterTrace) {
    return {
      type: "scatter",
      mode: "markers+text",
      name: isClusterTrace ? "クラスタ（独立意見数）" : "基準点・外部意見",
      x: targets.map((row) => getScoreForDisplay(row, plane.xAxis, activeGraphScoreMode)),
      y: targets.map((row) => getScoreForDisplay(row, plane.yAxis, activeGraphScoreMode)),
      text: targets.map(graphLabelForRow),
      textposition: "top center",
      customdata: targets.map(hoverDataForRow),
      hovertemplate:
        "%{customdata[0]}<br>%{customdata[1]}<br>%{customdata[2]}<br>%{customdata[3]}<br>" +
        "%{customdata[4]}<br>" +
        `${plane.xLabel}：%{x}<br>${plane.yLabel}：%{y}<extra></extra>`,
      marker: {
        size: targets.map((row) => sizeOf(row, volumeDomain)),
        color: targets.map((row) => colorOf(row, volumeDomain)),
        symbol: targets.map(markerSymbolOf),
        colorscale: isClusterTrace ? VOLUME_COLOR_SCALE : undefined,
        cmin: isClusterTrace ? 0 : undefined,
        cmax: isClusterTrace ? 1 : undefined,
        showscale: isClusterTrace && plane.name === "XY" && targets.length > 0,
        colorbar:
          isClusterTrace && plane.name === "XY"
            ? {
                title: "独立意見数",
                tickmode: "array",
                tickvals: [0, 0.5, 1],
                ticktext: ["小", "中", "大"],
              }
            : undefined,
        opacity: isClusterTrace ? 0.65 : 1,
        line: { color: "white", width: 1 },
      },
      xaxis: plane.xaxis,
      yaxis: plane.yaxis,
      showlegend: plane.name === "XY",
    };
  }

  return {
    plot3d: {
      traces: [
        ...axisTraces,
        make3dTrace("処理後クラスタ", "cluster"),
        make3dTrace("処理後平均", "processed-average"),
        make3dTrace("自分の意見", "user"),
        make3dTrace("外部意見", "external"),
        make3dTrace("外部意見平均", "average"),
      ],
      layout: {
        title: theme,
        height: 700,
        paper_bgcolor: "#ffffff",
        font: { color: "#111827" },
        hoverlabel: {
          font: { size: 12 },
          align: "left",
        },
        legend: {
          orientation: "h",
          y: -0.12,
          x: 0.35,
        },
        scene: {
          bgcolor: "#f8fafc",
          xaxis: {
            title: "",
            range: [0, 10],
            gridcolor: "#d1d5db",
            zeroline: false,
          },
          yaxis: {
            title: "",
            range: [0, 10],
            gridcolor: "#d1d5db",
            zeroline: false,
          },
          zaxis: {
            title: "",
            range: [0, 10],
            gridcolor: "#d1d5db",
            zeroline: false,
          },
          camera,
          aspectmode: "cube",
        },
        margin: { l: 0, r: 0, t: 70, b: 20 },
      },
      config: { responsive: true },
    },
    plot2d: {
      traces: planes.flatMap((plane) => [
        make2dTrace(clusterRows, plane, true),
        make2dTrace(otherRows, plane, false),
      ]),
      layout: {
        title: "2Dグラフ",
        height: 520,
        grid: {
          rows: 1,
          columns: 3,
          pattern: "independent",
        },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        font: { color: "#111827" },
        hoverlabel: {
          font: { size: 12 },
          align: "left",
        },
        legend: {
          orientation: "h",
          y: -0.22,
          x: 0.2,
        },
        xaxis: { title: axisLabels.x, range: [0, 10], gridcolor: "#e5e7eb" },
        yaxis: { title: axisLabels.y, range: [0, 10], gridcolor: "#e5e7eb" },
        xaxis2: { title: axisLabels.x, range: [0, 10], gridcolor: "#e5e7eb" },
        yaxis2: { title: axisLabels.z, range: [0, 10], gridcolor: "#e5e7eb" },
        xaxis3: { title: axisLabels.y, range: [0, 10], gridcolor: "#e5e7eb" },
        yaxis3: { title: axisLabels.z, range: [0, 10], gridcolor: "#e5e7eb" },
        margin: { l: 50, r: 30, t: 70, b: 90 },
      },
      config: { responsive: true },
    },
  };
}
