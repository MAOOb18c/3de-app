import { JP_UI_LABELS } from "./uiLabels.js";

export const CLUSTER_THRESHOLD_OPTIONS = [
  { value: 0.15, label: "0.15 ゆるい" },
  { value: 0.25, label: "0.25 ややゆるい" },
  { value: 0.35, label: "0.35 標準" },
  { value: 0.45, label: "0.45 厳しい" },
];

export const SEMANTIC_THRESHOLD_OPTIONS = [
  { value: 0.6, label: "0.60 かなりゆるい" },
  { value: 0.65, label: "0.65 ゆるい" },
  { value: 0.7, label: "0.70" },
  { value: 0.75, label: "0.75" },
  { value: 0.78, label: "0.78 標準" },
  { value: 0.82, label: "0.82" },
  { value: 0.86, label: "0.86 厳しい" },
];

export const AUTO_SUMMARY_LIMIT_OPTIONS = [5, 10, 15];

// Section: Axis presets and persona configuration
export const AXIS_PRESETS = {
  themeDefault: {
    label: "テーマ標準",
  },
  basic3de: {
    label: "3DE基本軸",
    x: {
      label: "量・支持",
      description: "どれだけ多く語られているか、または支持・共感を集めやすい意見ほど高い。",
    },
    y: {
      label: "深さ・構造理解",
      description: "背景、制度、構造、因果関係まで見ている意見ほど高い。",
    },
    z: {
      label: "視座・未来性",
      description: "長期的、俯瞰的、未来志向、社会全体への視点を含む意見ほど高い。",
    },
  },
  emotionRealityGrowth: {
    label: "感情・現実・成長",
    x: {
      label: "感情・実感",
      description: "個人的な感情、体験、痛み、安心、不安に近い意見ほど高い。",
    },
    y: {
      label: "現実・関係性",
      description: "制度、生活、関係性、具体的な現実条件を見ている意見ほど高い。",
    },
    z: {
      label: "成長・意味",
      description: "自己理解、成熟、意味づけ、長期的な変化に関わる意見ほど高い。",
    },
  },
  individualSocialTranscendent: {
    label: "個人・社会・超越",
    x: {
      label: "個人の実感",
      description: "個人の体験、救い、悩み、心の支えに近い意見ほど高い。",
    },
    y: {
      label: "社会との関係",
      description: "共同体、制度、政治、法、教育、社会問題との関係を見ている意見ほど高い。",
    },
    z: {
      label: "超越・精神性",
      description: "死生観、祈り、愛、意識、精神性、超越性に関わる意見ほど高い。",
    },
  },
  custom: {
    label: "カスタム",
  },
};

export const PERSONA_CONFIGS = {
  dev: {
    label: "ペルソナ（開発）",
    shortLabel: "開発",
    dashboardLabel: "ペルソナ（開発）",
    description: "今までのロジックを維持します。既存の評価軸・クエリ・アウトプットを使います。",
    feedbackTitle: "Zone⑪ ユーザーへのフィードバック",
  },
  personaA: {
    label: "ペルソナA：恋愛相談",
    shortLabel: "恋愛相談",
    dashboardLabel: "ペルソナA：恋愛相談",
    description:
      "若い女性が恋愛の悩みや自分の意見を入力し、近い声・違う声・少し楽になる視点を見て楽しいと思えるUXにします。",
    feedbackTitle: JP_UI_LABELS.romanceMap,
    axisConfig: {
      presetKey: "personaA",
      x: {
        label: "安心を求める度",
        description: "相手からの愛情確認、返信、優先順位、安心感を強く求める意見ほど高い。",
        highDescription: "相手からの愛情確認、返信、優先順位、安心感を強く求める意見ほど高い。",
        lowDescription: "一人の時間、自立、自由、相手に干渉しない関係を重視する意見ほど低い。",
      },
      y: {
        label: "関係の深さ志向",
        description: "特別感、一体感、将来性、深い愛情、長期的な関係を求める意見ほど高い。",
        highDescription: "特別感、一体感、将来性、深い愛情、長期的な関係を求める意見ほど高い。",
        lowDescription: "軽さ、距離感、今の楽しさ、重すぎない関係を重視する意見ほど低い。",
      },
      z: {
        label: "自己表現度",
        description: "自分の気持ちを言葉で伝える、話し合う、要求を伝える意見ほど高い。",
        highDescription: "自分の気持ちを言葉で伝える、話し合う、要求を伝える意見ほど高い。",
        lowDescription: "我慢する、察してほしい、言えない、相手に合わせる意見ほど低い。",
      },
    },
    queryCandidates: [
      "恋愛相談 返信遅い",
      "彼氏 連絡 不安",
      "好きな人 返信こない",
      "マッチングアプリ 不安",
      "恋愛 温度差",
      "愛されてるか不安",
      "重いと思われたくない",
      "彼氏 優先順位",
      "恋愛 自分ばかり",
    ],
    hashtags: [
      ["恋愛相談", "#恋愛相談", "恋愛相談の投稿を拾います。", "低", "recommended"],
      ["恋愛", "#恋愛", "恋愛全般の悩みを拾います。", "中", "recommended"],
      ["マッチングアプリ", "#マッチングアプリ", "マッチングアプリ文脈の不安を拾います。", "中", "recommended"],
      ["婚活", "#婚活", "将来や関係の深さに関する悩みを拾います。", "中", "recommended"],
      ["恋愛の悩み", "#恋愛の悩み", "悩み相談寄りの投稿を拾います。", "低", "recommended"],
      ["惚気", "#惚気", "幸せ報告が多く混ざるため注意候補です。", "高", "caution"],
      ["失恋", "#失恋", "失恋文脈に偏りやすいため注意候補です。", "高", "caution"],
      ["復縁", "#復縁", "復縁商材や占い宣伝が混ざりやすいため注意候補です。", "高", "caution"],
      ["片思い", "#片思い", "片思い文脈に偏りやすいため注意候補です。", "中", "caution"],
    ],
    excludeTerms: ["出会い系宣伝", "副業", "業者", "LINE交換", "投資", "パパ活", "成人向け", "占い宣伝"],
  },
  personaB: {
    label: "ペルソナB：発信者",
    shortLabel: "発信者",
    dashboardLabel: "ペルソナB：発信者向け分析",
    description: "発信者が、論点分布・読者インサイト・発信切り口・投稿ネタを得られるUXにします。",
    feedbackTitle: "発信者向けインサイト",
    axisConfig: {
      presetKey: "personaB",
      x: {
        label: "共感性",
        description: "生活実感、感情、悩み、当事者感覚に刺さる意見ほど高い。",
        highDescription: "生活実感、感情、悩み、当事者感覚に刺さる意見ほど高い。",
        lowDescription: "抽象論、専門論、制度論に寄っていて感情的共感が弱い意見ほど低い。",
      },
      y: {
        label: "独自性",
        description: "ありきたりでない、新しい視点、逆張り、深い構造理解を含む意見ほど高い。",
        highDescription: "ありきたりでない、新しい視点、逆張り、深い構造理解を含む意見ほど高い。",
        lowDescription: "よくある反応、一般論、既に広く言われている意見ほど低い。",
      },
      z: {
        label: "発信化しやすさ",
        description: "投稿タイトル、note記事、ショート動画、スレッド化しやすい意見ほど高い。",
        highDescription: "投稿タイトル、note記事、ショート動画、スレッド化しやすい意見ほど高い。",
        lowDescription: "複雑すぎる、専門的すぎる、短く伝えにくい意見ほど低い。",
      },
    },
    queryTemplate: ["悩み", "不満", "問題", "体験談", "なぜ", "炎上", "賛否", "本音", "課題", "変わるべき"],
    hashtags: [],
    excludeTerms: ["キャンペーン", "無料", "登録", "PR", "まとめ売り", "求人", "bot", "スパム", "人気投票"],
  },
  personaC: {
    label: "ペルソナC：教室運営者",
    shortLabel: "教室運営者",
    dashboardLabel: "ペルソナC：教室運営者",
    description: "教室や講座の運営者が、困りごと分類・対応優先度・授業改善案を得られるUXにします。",
    feedbackTitle: "運営改善レポート",
    axisConfig: {
      presetKey: "personaC",
      x: {
        label: "該当人数・発生頻度",
        description: "多くの参加者・生徒に共通して起きている問題ほど高い。",
        highDescription: "多くの参加者・生徒に共通して起きている問題ほど高い。",
        lowDescription: "一部の個別事情に近い問題ほど低い。",
      },
      y: {
        label: "理解負荷・難易度",
        description: "背景理解、構造理解、前提知識が必要で、つまずきやすい問題ほど高い。",
        highDescription: "背景理解、構造理解、前提知識が必要で、つまずきやすい問題ほど高い。",
        lowDescription: "すぐ説明すれば解決できる軽い問題ほど低い。",
      },
      z: {
        label: "介入優先度・改善効果",
        description: "放置すると離脱や不満につながりやすく、対応すると効果が大きい問題ほど高い。",
        highDescription: "放置すると離脱や不満につながりやすく、対応すると効果が大きい問題ほど高い。",
        lowDescription: "今すぐ対応しなくても大きな支障がない問題ほど低い。",
      },
    },
    queryCandidates: [
      "プログラミング 初心者 つまずく",
      "プログラミング エラー 初心者",
      "Python 初心者 エラー",
      "プログラミング 学習 わからない",
      "コーディング 教室 初心者",
      "プログラミング 質問できない",
      "環境構築 つまずく",
      "エラー文 読めない",
      "授業 ついていけない",
    ],
    hashtags: [
      ["プログラミング初心者", "#プログラミング初心者", "初心者のつまずきを拾います。", "低", "recommended"],
      ["プログラミング学習", "#プログラミング学習", "学習中の困りごとを拾います。", "低", "recommended"],
      ["Python初心者", "#Python初心者", "Python初学者のエラーや不安を拾います。", "低", "recommended"],
      ["今日の積み上げ", "#今日の積み上げ", "学習ログが多いため注意しつつ拾います。", "中", "recommended"],
      ["駆け出しエンジニアと繋がりたい", "#駆け出しエンジニアと繋がりたい", "相互フォローや転職文脈が混ざりやすい注意候補です。", "高", "caution"],
      ["エンジニア転職", "#エンジニア転職", "転職・求人文脈が混ざりやすい注意候補です。", "高", "caution"],
    ],
    excludeTerms: ["求人", "転職", "副業", "無料相談", "教材販売", "スクール勧誘", "PR", "案件募集"],
  },
};

export const DEFAULT_X_QUERY_FILTERS = {
  excludeRetweets: true,
  excludeReplies: false,
  excludeLinks: false,
  language: "ja",
  minLikes: "",
  minRetweets: "",
  includeWords: "",
  excludeWords: "",
};

