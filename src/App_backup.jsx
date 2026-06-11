import { useEffect, useMemo, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import "./App.css";

const APP_VERSION = "3DE MVP v3.8 File Link Edition";

const samples = {
  housing: {
    label: "サンプル1：住宅",
    theme: "日本の住宅市場はどう変わるべきか",
    axisLabels: {
      x: "X：人数・拡散量",
      y: "Y：議論の深さ",
      z: "Z：視座の高さ",
    },
    analysis:
      "住宅サンプルでは、生活実感から国家経済・資本形成・世代継承へと論点が広がる分布を可視化しています。",
    userOpinion: {
      text: "日本は新築偏重から、長寿命住宅・資産形成型住宅へ移行すべきだ。住宅は長期投資として価値を持つべきで、質の向上と維持が重要だ。",
      score: { x: 2, y: 8, z: 8 },
    },
    externalOpinions: [
      { text: "住宅は安ければ十分だ。", score: { x: 10, y: 1, z: 1 } },
      { text: "新築の方が気持ちいい。", score: { x: 9, y: 1, z: 1 } },
      { text: "住宅ローンが不安だ。", score: { x: 9, y: 2, z: 1 } },
      { text: "通勤しやすい場所に住みたい。", score: { x: 8, y: 2, z: 2 } },
      { text: "家のデザインは大事だと思う。", score: { x: 7, y: 3, z: 2 } },
      { text: "子育てしやすい住宅が必要だ。", score: { x: 7, y: 4, z: 3 } },
      { text: "高齢者向け住宅を増やすべきだ。", score: { x: 6, y: 4, z: 4 } },
      { text: "空き家を活用し、地域の暮らしを守るべきだ。", score: { x: 5, y: 5, z: 5 } },
      { text: "住宅価格の高騰は若者に厳しい。", score: { x: 7, y: 4, z: 3 } },
      { text: "中古住宅流通をもっと活性化すべきだ。", score: { x: 5, y: 6, z: 4 } },
      { text: "地方の住宅価値下落は地域経済の問題だ。", score: { x: 5, y: 6, z: 5 } },
      { text: "住宅市場は人口減少を前提に再設計すべきだ。", score: { x: 3, y: 7, z: 5 } },
      { text: "スクラップ＆ビルド文化から脱却すべきだ。", score: { x: 3, y: 7, z: 6 } },
      { text: "環境負荷を減らす住宅設計が重要になる。", score: { x: 4, y: 6, z: 6 } },
      { text: "住宅政策は少子化対策とも連動して考えるべきだ。", score: { x: 3, y: 7, z: 7 } },
      { text: "地域コミュニティ維持も住宅政策の役割だ。", score: { x: 3, y: 7, z: 7 } },
      { text: "住宅は個人資産だけでなく国全体の資本形成でもある。", score: { x: 2, y: 8, z: 8 } },
      { text: "長寿命住宅への転換は日本経済全体の構造改革につながる。", score: { x: 2, y: 9, z: 8 } },
      { text: "住宅を社会インフラとして長期管理する思想が必要だ。", score: { x: 2, y: 8, z: 9 } },
      { text: "住まいを世代間で受け継ぐ資本として再定義すべきだ。", score: { x: 1, y: 9, z: 9 } },
    ],
  },

  iran: {
    label: "サンプル2：イラン情勢",
    theme: "現在のイラン情勢をどう見るべきか",
    axisLabels: {
      x: "X：人数・拡散量",
      y: "Y：議論の深さ",
      z: "Z：視座の高さ",
    },
    analysis:
      "イラン情勢サンプルでは、生活不安・エネルギー価格・外交・市民生活・世界平和が混在するため、住宅サンプルよりも分布に揺らぎを持たせています。",
    userOpinion: {
      text: "イラン情勢は、日本の物価やエネルギー価格にも影響する。戦争拡大を阻止しつつ、市民生活への影響も冷静に見る必要がある。",
      score: { x: 5, y: 6, z: 6 },
    },
    externalOpinions: [
      { text: "ガソリン代が高くて困る。", score: { x: 10, y: 1, z: 1 } },
      { text: "また物価が上がるのは嫌だ。", score: { x: 9, y: 2, z: 1 } },
      { text: "電気代が高くなりそう。", score: { x: 9, y: 2, z: 2 } },
      { text: "戦争は怖いので早く終わってほしい。", score: { x: 8, y: 2, z: 3 } },
      { text: "生活への影響をもっと説明してほしい。", score: { x: 8, y: 4, z: 2 } },
      { text: "物流費が上がると家計が苦しい。", score: { x: 7, y: 3, z: 2 } },
      { text: "原油価格を安定させてほしい。", score: { x: 7, y: 4, z: 3 } },
      { text: "中東情勢は日本経済にも重要だ。", score: { x: 6, y: 5, z: 4 } },
      { text: "ホルムズ海峡の安全確保が必要だ。", score: { x: 5, y: 7, z: 5 } },
      { text: "まずは停戦を維持し、これ以上被害が広がらないようにすべきだ。", score: { x: 7, y: 5, z: 5 } },
      { text: "核問題は外交と査察によって解決すべきだ。", score: { x: 4, y: 8, z: 5 } },
      { text: "制裁だけでは市民生活が悪化する。", score: { x: 5, y: 7, z: 7 } },
      { text: "軍事攻撃は長期的には逆効果になる。", score: { x: 3, y: 8, z: 6 } },
      { text: "各国の恐怖と利害が連鎖している。", score: { x: 3, y: 8, z: 8 } },
      { text: "中東全体の安全保障構造を考える必要がある。", score: { x: 2, y: 9, z: 9 } },
      { text: "イラン市民の生活や人権も考慮すべきだ。", score: { x: 4, y: 7, z: 8 } },
      { text: "世界平和の視点では単純な善悪では語れない。", score: { x: 1, y: 9, z: 10 } },
    ],
  },

  coding: {
    label: "サンプル3：コーディング教室",
    theme: "コーディング教室で3DEをどう活用できるか",
    axisLabels: {
      x: "X：該当生徒数・発生頻度",
      y: "Y：難易度・理解負荷",
      z: "Z：介入優先度・教育効果",
    },
    analysis:
      "コーディング教室サンプルでは、3DEの軸を教育現場用に変更しています。Xは該当生徒数、Yは難易度、Zは介入優先度です。高難度でも教育改善につながる論点はZが高くなります。",
    userOpinion: {
      text: "コーディング教室では、生徒ごとの理解度や詰まりポイントを可視化し、初心者と上級者の両方に合った学習支援を行うべきだ。授業運営にもデータを活用できる。",
      score: { x: 6, y: 7, z: 9 },
    },
    externalOpinions: [
      { text: "エラーが出て動かないので困る。", score: { x: 9, y: 2, z: 6 } },
      { text: "先生の説明が早すぎてついていけない。", score: { x: 8, y: 3, z: 7 } },
      { text: "環境構築でつまずく人が多い。", score: { x: 8, y: 5, z: 8 } },
      { text: "課題の意味が分からない。", score: { x: 7, y: 3, z: 6 } },
      { text: "完成品を真似しながら作ると理解しやすい。", score: { x: 7, y: 4, z: 5 } },
      { text: "自分の進度に合った課題が欲しい。", score: { x: 7, y: 5, z: 8 } },
      { text: "上級者は物足りなく、初心者は置いていかれる。", score: { x: 6, y: 6, z: 9 } },
      { text: "生徒ごとの詰まり箇所を可視化したい。", score: { x: 6, y: 7, z: 9 } },
      { text: "AIがエラーの原因を分類してくれると助かる。", score: { x: 6, y: 7, z: 8 } },
      { text: "授業後に学習ログを分析したい。", score: { x: 5, y: 7, z: 8 } },
      { text: "理解度に応じて教材を分岐できるとよい。", score: { x: 5, y: 8, z: 9 } },
      { text: "先生の経験に依存しすぎない教室運営が必要だ。", score: { x: 5, y: 8, z: 8 } },
      { text: "教室運営をデータで改善できる。", score: { x: 5, y: 7, z: 8 } },
      { text: "学習者の自己効力感を高める仕組みが重要だ。", score: { x: 4, y: 8, z: 9 } },
      { text: "AI時代の学び方そのものを再設計する必要がある。", score: { x: 4, y: 9, z: 7 } },
      { text: "コーディング教育は将来の教育格差を縮める手段になり得る。", score: { x: 4, y: 8, z: 7 } },
    ],
  },
};

function clamp(value, min = 1, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function stableNoise(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return (Math.abs(hash) % 301) / 100 - 1.5;
}

function fallbackScore(text, sampleKey) {
  if (sampleKey === "coding") {
    return fallbackCodingScore(text);
  }

  return fallbackGeneralScore(text);
}

function fallbackGeneralScore(text) {
  let y = 2;
  let z = 2;
  let daily = 0;

  const dailyWords = [
    "ガソリン",
    "家計",
    "物価",
    "生活",
    "電気代",
    "不安",
    "困る",
    "高い",
    "安い",
    "通勤",
    "ローン",
    "食費",
    "怖い",
  ];

  const depthWords = [
    "構造",
    "制度",
    "市場",
    "政策",
    "管理",
    "外交",
    "安全保障",
    "経済",
    "資産形成",
    "投資",
    "流通",
    "供給",
    "査察",
    "核",
    "制裁",
    "連鎖",
    "再設計",
    "改革",
  ];

  const viewWords = [
    "世界",
    "平和",
    "社会",
    "文明",
    "国家",
    "人類",
    "未来",
    "世代",
    "人権",
    "地域",
    "市民",
    "文化",
    "中東全体",
    "環境",
    "コミュニティ",
  ];

  dailyWords.forEach((word) => {
    if (text.includes(word)) daily += 1;
  });

  depthWords.forEach((word) => {
    if (text.includes(word)) y += 1.1;
  });

  viewWords.forEach((word) => {
    if (text.includes(word)) z += 1.2;
  });

  if (text.includes("長期") || text.includes("維持") || text.includes("持続")) {
    y += 1;
    z += 1;
  }

  if (text.includes("単純") || text.includes("多面的") || text.includes("複雑")) {
    y += 1.5;
    z += 1.5;
  }

  y += Math.min(text.length / 90, 2);
  z += Math.min(text.length / 110, 2);

  y = Math.round(clamp(y));
  z = Math.round(clamp(z));

  const yzAverage = (y + z) / 2;
  let x = 11 - Math.pow(yzAverage, 1.35);

  x += daily * 0.5;
  x += stableNoise(text);

  return {
    x: Math.round(clamp(x)),
    y,
    z,
  };
}

function fallbackCodingScore(text) {
  let x = 5;
  let y = 3;
  let z = 5;

  const frequencyWords = ["多い", "みんな", "初心者", "生徒ごと", "つまずく", "説明", "エラー"];
  const difficultyWords = ["環境構築", "状態管理", "設計", "非同期", "理解度", "教材", "分析", "分類", "AI"];
  const priorityWords = ["可視化", "改善", "分岐", "支援", "置いていかれる", "自己効力感", "教室運営"];

  frequencyWords.forEach((word) => {
    if (text.includes(word)) x += 1;
  });

  difficultyWords.forEach((word) => {
    if (text.includes(word)) y += 1.1;
  });

  priorityWords.forEach((word) => {
    if (text.includes(word)) z += 1.2;
  });

  x += stableNoise(text) * 0.4;
  y += Math.min(text.length / 100, 2);
  z += Math.min(text.length / 120, 2);

  return {
    x: Math.round(clamp(x)),
    y: Math.round(clamp(y)),
    z: Math.round(clamp(z)),
  };
}

function scoreOpinion(text, sampleKey) {
  const key = text.trim();
  const sample = samples[sampleKey];

  if (sample.userOpinion.text === key) {
    return sample.userOpinion.score;
  }

  const matchedOpinion = sample.externalOpinions.find((item) => item.text === key);

  if (matchedOpinion) {
    return matchedOpinion.score;
  }

  return fallbackScore(key, sampleKey);
}

function sortRows(rows, sortKey, sortDirection) {
  return [...rows].sort((a, b) => {
    let primary = 0;

    if (sortKey === "x") primary = a.x - b.x;
    if (sortKey === "y") primary = a.y - b.y;
    if (sortKey === "z") primary = a.z - b.z;

    if (sortDirection === "desc") {
      primary = -primary;
    }

    if (primary !== 0) {
      return primary;
    }

    if (b.z !== a.z) return b.z - a.z;
    if (b.y !== a.y) return b.y - a.y;

    return a.x - b.x;
  });
}

export default function App() {
  const [sampleKey, setSampleKey] = useState("housing");
  const [theme, setTheme] = useState(samples.housing.theme);
  const [userOpinion, setUserOpinion] = useState(samples.housing.userOpinion.text);
  const [externalOpinions, setExternalOpinions] = useState(
    samples.housing.externalOpinions.map((item) => item.text).join("\n")
  );

  const [originCentered, setOriginCentered] = useState(false);
  const [sortKey, setSortKey] = useState("z");
  const [sortDirection, setSortDirection] = useState("desc");

  const plot3dRef = useRef(null);
  const plot2dRef = useRef(null);

  const currentSample = samples[sampleKey];
  const axisLabels = currentSample.axisLabels;

  function loadSample(key) {
    setSampleKey(key);
    setTheme(samples[key].theme);
    setUserOpinion(samples[key].userOpinion.text);
    setExternalOpinions(samples[key].externalOpinions.map((item) => item.text).join("\n"));
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  function sortLabel(key) {
    if (sortKey !== key) return "";
    return sortDirection === "desc" ? "▼" : "▲";
  }

  const result = useMemo(() => {
    const opinions = externalOpinions
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const baseRows = [
      {
        originalNo: "-",
        label: "自分の意見",
        type: "自分の意見",
        opinion: userOpinion,
        group: "user",
        ...scoreOpinion(userOpinion, sampleKey),
      },
      ...opinions.map((opinion, index) => ({
        originalNo: index + 1,
        label: String(index + 1),
        type: `外部意見${index + 1}`,
        opinion,
        group: "external",
        ...scoreOpinion(opinion, sampleKey),
      })),
    ];

    const externalRows = baseRows.filter((row) => row.group === "external");
    const user = baseRows.find((row) => row.group === "user");

    const avg = {
      originalNo: "-",
      label: "平均",
      type: "外部意見平均",
      group: "average",
      opinion: "外部意見の平均",
      x: Math.round(externalRows.reduce((sum, row) => sum + row.x, 0) / externalRows.length),
      y: Math.round(externalRows.reduce((sum, row) => sum + row.y, 0) / externalRows.length),
      z: Math.round(externalRows.reduce((sum, row) => sum + row.z, 0) / externalRows.length),
    };

    return {
      user,
      avg,
      rows: [...baseRows, avg],
      tableRows: sortRows(baseRows, sortKey, sortDirection),
    };
  }, [userOpinion, externalOpinions, sampleKey, sortKey, sortDirection]);

  function colorOf(row) {
    if (row.group === "user") return "#ef4444";
    if (row.group === "average") return "#7c3aed";
    return "#2563eb";
  }

  function sizeOf(row) {
    if (row.group === "user") return 14;
    if (row.group === "average") return 12;
    return 8;
  }

  function analysisText() {
    const user = result.user;
    const avg = result.avg;

    if (currentSample.analysis) {
      return currentSample.analysis;
    }

    if (user.z >= 8 && user.y >= 8 && user.x <= 3) {
      return "あなたの意見は、深さ・視座が高く、人数軸では少数派寄りです。3DE上では、まだ大衆化していない高次仮説として扱えます。";
    }

    if (user.x >= 8 && user.y <= 4 && user.z <= 4) {
      return "あなたの意見は、生活に近く、多くの人が反応しやすい位置にあります。現場感覚や生活実感を拾う意見です。";
    }

    if (user.y >= avg.y && user.z >= avg.z) {
      return "あなたの意見は、外部意見平均よりも深さ・視座が高めです。論点整理や提案の核になり得ます。";
    }

    return "あなたの意見は、外部意見の分布内にあります。どの軸を伸ばすかによって、生活密着型にも構造提案型にも展開できます。";
  }

  useEffect(() => {
    const rows = result.rows;

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

    function makeTrace(groupName, group) {
      const targets = rows.filter((row) => row.group === group);

      return {
        type: "scatter3d",
        mode: "markers+text",
        name: groupName,
        x: targets.map((row) => row.x),
        y: targets.map((row) => row.y),
        z: targets.map((row) => row.z),
        text: targets.map((row) => row.label),
        textposition: "top center",
        marker: {
          size: targets.map(sizeOf),
          color: targets.map(colorOf),
          opacity: 0.9,
          line: { color: "white", width: 1 },
        },
        hovertext: targets.map(
          (row) => `${row.type}<br>${axisLabels.x}:${row.x}<br>${axisLabels.y}:${row.y}<br>${axisLabels.z}:${row.z}<br>${row.opinion}`
        ),
        hoverinfo: "text",
      };
    }

    Plotly.newPlot(
      plot3dRef.current,
      [
        ...axisTraces,
        makeTrace("自分の意見", "user"),
        makeTrace("外部意見", "external"),
        makeTrace("外部意見平均", "average"),
      ],
      {
        title: theme,
        height: 700,
        paper_bgcolor: "#ffffff",
        font: { color: "#111827" },
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
      { responsive: true }
    );
  }, [result, theme, originCentered, axisLabels]);

  useEffect(() => {
    const rows = result.rows;

    const marker = {
      size: rows.map(sizeOf),
      color: rows.map(colorOf),
      opacity: 0.9,
      line: { color: "white", width: 1 },
    };

    Plotly.newPlot(
      plot2dRef.current,
      [
        {
          type: "scatter",
          mode: "markers+text",
          name: "XY",
          x: rows.map((row) => row.x),
          y: rows.map((row) => row.y),
          text: rows.map((row) => row.label),
          textposition: "top center",
          marker,
          xaxis: "x",
          yaxis: "y",
        },
        {
          type: "scatter",
          mode: "markers+text",
          name: "XZ",
          x: rows.map((row) => row.x),
          y: rows.map((row) => row.z),
          text: rows.map((row) => row.label),
          textposition: "top center",
          marker,
          xaxis: "x2",
          yaxis: "y2",
        },
        {
          type: "scatter",
          mode: "markers+text",
          name: "YZ",
          x: rows.map((row) => row.y),
          y: rows.map((row) => row.z),
          text: rows.map((row) => row.label),
          textposition: "top center",
          marker,
          xaxis: "x3",
          yaxis: "y3",
        },
      ],
      {
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
      { responsive: true }
    );
  }, [result, axisLabels]);

  return (
    <div className="app">
      <div className="header">
        <h1>3DE MVP</h1>
        <div className="version">{APP_VERSION}</div>
      </div>

      <section className="row row-1 card">
        <button className={sampleKey === "housing" ? "active" : ""} onClick={() => loadSample("housing")}>
          サンプル1：住宅
        </button>

        <button className={sampleKey === "iran" ? "active" : ""} onClick={() => loadSample("iran")}>
          サンプル2：イラン情勢
        </button>

        <button className={sampleKey === "coding" ? "active" : ""} onClick={() => loadSample("coding")}>
          サンプル3：コーディング教室
        </button>
      </section>

      <section className="row row-2 card">
        <div className="field">
          <h3>テーマ</h3>
          <input value={theme} onChange={(event) => setTheme(event.target.value)} />
        </div>

        <div className="field">
          <h3>自分の意見</h3>
          <textarea value={userOpinion} onChange={(event) => setUserOpinion(event.target.value)} />
        </div>

        <div className="field">
          <h3>外部意見（1行1意見）</h3>
          <textarea value={externalOpinions} onChange={(event) => setExternalOpinions(event.target.value)} />
        </div>
      </section>

      <section className="row row-3 card">
        <div className="section-title-row">
          <h2>3Dグラフ</h2>

          <button
            className={originCentered ? "view-button active" : "view-button"}
            onClick={() => setOriginCentered((previous) => !previous)}
          >
            {originCentered ? "通常表示に戻す" : "原点を中央に持ってきて作図"}
          </button>
        </div>

        <div ref={plot3dRef}></div>
      </section>

      <section className="row row-4 card">
        <h2>2Dグラフ</h2>
        <div ref={plot2dRef}></div>
      </section>

      <section className="row row-5 card analysis">
        <h2>分析結果</h2>
        <p>{analysisText()}</p>

        <div className="score-cards">
          <div>
            <span>{axisLabels.x}</span>
            <b>{result.user.x}</b>
            <small>外部平均 {result.avg.x}</small>
          </div>

          <div>
            <span>{axisLabels.y}</span>
            <b>{result.user.y}</b>
            <small>外部平均 {result.avg.y}</small>
          </div>

          <div>
            <span>{axisLabels.z}</span>
            <b>{result.user.z}</b>
            <small>外部平均 {result.avg.z}</small>
          </div>
        </div>
      </section>

      <section className="row row-6 card">
        <div className="section-title-row">
          <h2>意見一覧</h2>

          <div className="sort-status">
            現在の並び：{sortKey.toUpperCase()}軸 {sortDirection === "desc" ? "降順" : "昇順"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>順位</th>
              <th>元番号</th>
              <th>分類</th>
              <th>
                <button className="sort-button" onClick={() => handleSort("x")}>
                  {axisLabels.x} {sortLabel("x")}
                </button>
              </th>
              <th>
                <button className="sort-button" onClick={() => handleSort("y")}>
                  {axisLabels.y} {sortLabel("y")}
                </button>
              </th>
              <th>
                <button className="sort-button" onClick={() => handleSort("z")}>
                  {axisLabels.z} {sortLabel("z")}
                </button>
              </th>
              <th>意見</th>
            </tr>
          </thead>

          <tbody>
            {result.tableRows.map((row, index) => (
              <tr key={`${row.type}-${index}`} className={row.group === "user" ? "user-row" : ""}>
                <td>{index + 1}</td>
                <td>{row.originalNo}</td>
                <td>{row.type}</td>
                <td>{row.x}</td>
                <td>{row.y}</td>
                <td>{row.z}</td>
                <td className="opinion">{row.opinion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
