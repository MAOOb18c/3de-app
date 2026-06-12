import { useEffect, useMemo, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import "./App.css";

const APP_VERSION = "3DE MVP v3.97 Open Public Preview 200 Fetch";
const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_3DE_API_BASE || "http://localhost:3001"
  : "";
const PUBLIC_PREVIEW_MODE = String(import.meta.env.VITE_PUBLIC_PREVIEW || "").toLowerCase() === "true";
const LOCAL_PUBLISH_AVAILABLE = import.meta.env.DEV;
const PUBLIC_PREVIEW_MAX_X_FETCH = 200;
const DEFAULT_MAX_X_FETCH = 1000;
const X_DATASET_HISTORY_STORAGE_KEY = "3de_x_dataset_history_v1";
const SIDEBAR_WIDTH_STORAGE_KEY = "3de_sidebar_width_v2";
const VIEW_MODE_STORAGE_KEY = "3de_view_mode";
const MAX_X_DATASET_HISTORY = 10;
const MAX_CLUSTER_RUN_HISTORY = 10;
const SIDEBAR_MIN_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 380;
const SIDEBAR_MAX_VIEWPORT_RATIO = 0.45;
const VOLUME_COLOR_SCALE = [
  [0, "#2563eb"],
  [0.5, "#f59e0b"],
  [1, "#dc2626"],
];
const NOISE_RELEVANCE_THRESHOLD = 5;
const GENERIC_QUERY_TERMS = ["成長", "変化", "意見", "深い", "視座", "構造", "制度", "感情", "不安"];
const HASHTAG_NOISE_MARKERS = ["PR", "URL", "無料", "一括査定", "不動産投資", "勧誘", "キャンペーン", "登録"];
const UNSAFE_EXCLUDE_TERM_PATTERN = /^(lang|is|has|url|min_likes|min_reposts|min_retweets)$/i;
const PERSONA_A_BROAD_QUERY_TERMS = [
  "恋愛",
  "恋愛とは",
  "現代の恋愛",
  "承認",
  "癒し",
  "成長",
  "自由",
  "性的魅力",
  "アドバイス",
  "ヒント",
  "解決策",
  "反対意見",
  "議論",
  "批判",
  "論点",
];
const NOISE_CATEGORY_LABELS = {
  low_relevance: "低関連度",
  unrelated_topic: "全然違う話題",
  broad_keyword_noise: "一般語が広すぎる",
  duplicate_or_repost: "同一コメント・RT重複",
  spread_template: "拡散テンプレート",
  coordinated_campaign_suspected: "組織的拡散疑い",
  duplicate_like_spread: "類似コピー拡散",
  promotion_or_ad: "宣伝・広告",
  url_only_or_too_short: "URLのみ・短文",
  fiction_or_fan_content: "創作・作品紹介",
  game_anime_entertainment: "ゲーム・アニメ・娯楽",
  product_or_shopping: "商品・買い物",
  sports_or_event: "スポーツ・イベント",
  personal_daily_life: "日常報告",
  system_error_other_domain: "別分野のエラー",
  political_but_not_theme: "政治だがテーマとズレ",
  query_term_collision: "検索語の意味衝突",
  fandom_not_romance_consultation: "ファン文脈",
  celebrity_or_idol_topic: "芸能・アイドル文脈",
  political_or_historical_topic: "政治・歴史文脈",
  fortune_telling: "占い・運勢",
  spirituality_not_requested: "スピリチュアル文脈",
  weak_relationship_relevance: "恋愛相談との関連が弱い",
  generic_self_help: "一般的な自己啓発",
  advertisement_or_promotion: "宣伝・勧誘",
  adult_or_solicitation: "成人向け・募集",
  unknown: "その他",
  fiction: "創作・作品",
  pet_garden: "ペット・園芸",
  game_anime: "ゲーム・アニメ・競技",
  product_pr: "商品PR・広告",
  generic_keyword: "汎用語のみ",
};
const STAGED_FETCH_INITIAL_COUNT = 30;
const DEFAULT_ADD_FETCH_COUNT = 30;
const MIN_ADD_FETCH_COUNT = 20;
const MAX_USER_AUTO_FETCH_ROUNDS = 5;
const MAX_SAFE_QUERY_LENGTH = 450;
const MAX_NO_NEW_UNIQUE_RETRIES = 2;
const MAX_API_ZERO_RETRIES = 2;
const STAGED_FETCH_DEFAULT_STAGES = [30, 60, 100];
const QUERY_LABELS_JA = {
  rawQuery: "元クエリ",
  safeQuery: "整形後クエリ",
  fallbackQuery: "予備クエリ",
  finalQueryForXApi: "最終送信クエリ",
  queryLength: "クエリ長",
  finalQueryLength: "最終送信クエリ長",
  fallbackQueryLength: "予備クエリ長",
  queryBuildWarnings: "整形時の注意",
  sanitizedHashtags: "サニタイズ結果",
  sanitizedHashtagRemovedParts: "除外されたハッシュタグ",
  sanitizedExcludeRemovedParts: "除外された除外語",
  apiErrorMessage: "APIエラー",
  fallbackUsed: "予備クエリ使用",
  retryCount: "再試行回数",
};
const QUERY_LABEL_DESCRIPTIONS_JA = {
  rawQuery: "AIまたはユーザー入力から作られた最初の検索文です。",
  safeQuery: "X APIに送る前に、危険な記号や重複条件を整理した検索文です。",
  fallbackQuery: "通常の検索文で失敗した時に使う代替検索文です。",
  finalQueryForXApi: "実際にX APIへ送った最終版の検索文です。",
};

const JP_UI_LABELS = {
  romanceMap: "あなたの恋愛マップ",
  empathy: "寄り添い",
  analysisMemo: "分析メモ",
  feelingSummary: "あなたの気持ちの整理",
  similarVoices: "近い声",
  differentVoices: "少し違う声",
  concernTrends: "みんなの悩み傾向",
  easierPerspective: "少し楽になる見方",
  nextQuestions: "次に考える問い",
  voicesToCollect: "取得したい声",
  empatheticVoices: "共感の声",
  differentViewpoints: "違う見方",
  personalExperiences: "体験談",
  adviceHints: "助言・ヒント",
  values: "価値観",
  opposingOpinions: "反対意見",
  referenceDisplay: "参考表示",
  borderlineOpinions: "境界意見",
  evaluationAxes: "評価軸",
  axisGuide: "軸の見方",
  usedOpinions: "分析に使えた意見",
  excludedPosts: "除外した投稿",
  developerModeCheck: "開発者modeで確認",
  retrievalQuality: "取得品質",
  queryAdjustment: "検索条件の調整",
  queryReview: "検索条件レビュー",
  analysisPurpose: "取得・分析の目的",
  analysisPurposeHelp: "どんな声を集め、どのようにまとめるかを選びます。",
  adoptedIncludeTerms: "採用して取得する語",
  adoptedHashtags: "採用して取得するハッシュタグ",
  cautionCandidates: "注意候補",
  disabledCandidates: "非推奨候補",
  inputSource: "入力ソース",
  sampleOpinionTrial: "サンプル意見で試す",
  empathyPurpose: "共感",
  debatePurpose: "議論",
  advicePurpose: "アドバイス",
  positionPurpose: "現在地",
  retrievalPolicy: "取得方針",
  clusterPolicy: "クラスタ化方針",
  zone11Policy: "Zone11レポート方針",
  includeTerms: "取得する語",
  includeHashtags: "取得するハッシュタグ",
  excludeTerms: "除外する語",
  cautionTerms: "注意候補",
  disabledTerms: "非推奨候補",
  finalTrustedQuery: "最終送信クエリ",
  autoFetchSafetyLimit: "自動取得の安全上限",
  missingVoiceDirections: "不足している声",
  suggestedNextQueryDirection: "次に試す検索方向",
  clusterQuality: "クラスタ品質",
  mojibakeWarning: "文字化け検出",
  possibleMojibake: "文字化け検出",
  autoGeneratedLowDescription: "自動生成された低い説明",
  apiCreditExhausted: "X APIのクレジット不足",
  apiCreditExhaustedMessage: "X APIのクレジットが不足しています。外部意見の取得を続けるには、X API側でクレジット追加またはプラン変更が必要です。クレジット追加後に、もう一度取得してください。",
  zone12FilterAll: "すべて",
  zone12FilterAccepted: "採用のみ",
  zone12FilterBorderline: "境界のみ",
  zone12FilterNoise: "ノイズのみ",
  zone12StatusUser: "自分",
  zone12StatusAccepted: "採用",
  zone12StatusBorderline: "境界",
  zone12StatusNoise: "ノイズ",
  zone12StatusDuplicate: "重複",
  zone12StatusExcluded: "除外",
  zone12NoHashtag: "ハッシュタグなし",
  zone12Reason: "理由",
  zone12MatchedTerm: "一致",
  zone12ExcludeHit: "除外語ヒット",
  zone12DeveloperDetails: "開発者詳細",
};

const ZONE12_FILTERS = [
  { value: "all", label: JP_UI_LABELS.zone12FilterAll },
  { value: "accepted", label: JP_UI_LABELS.zone12FilterAccepted },
  { value: "borderline", label: JP_UI_LABELS.zone12FilterBorderline },
  { value: "noise", label: JP_UI_LABELS.zone12FilterNoise },
];

const VOICE_DIRECTION_OPTIONS = [
  { key: "empatheticVoices", label: JP_UI_LABELS.empatheticVoices },
  { key: "differentViewpoints", label: JP_UI_LABELS.differentViewpoints },
  { key: "personalExperiences", label: JP_UI_LABELS.personalExperiences },
  { key: "adviceHints", label: JP_UI_LABELS.adviceHints },
  { key: "values", label: JP_UI_LABELS.values },
  { key: "opposingOpinions", label: JP_UI_LABELS.opposingOpinions },
];
const VOICE_DIRECTION_KEY_ALIASES = {
  empathy: "empatheticVoices",
  different: "differentViewpoints",
  experience: "personalExperiences",
  advice: "adviceHints",
  opposing: "opposingOpinions",
  "蜈ｱ諢溘・螢ｰ": "empatheticVoices",
  "驕輔≧隕区婿": "differentViewpoints",
  "蜉ｩ險繝ｻ繝偵Φ繝・": "adviceHints",
  "菴馴ｨ楢ｫ・": "personalExperiences",
  "蜿榊ｯｾ諢剰ｦ・": "opposingOpinions",
  "共感の声": "empatheticVoices",
  "違う見方": "differentViewpoints",
  "助言・ヒント": "adviceHints",
  "体験談": "personalExperiences",
  "反対意見": "opposingOpinions",
};
const DEFAULT_PERSONA_A_VOICE_DIRECTIONS = ["empatheticVoices", "differentViewpoints", "adviceHints"];

function sidebarMaxWidth() {
  if (typeof window === "undefined") {
    return 640;
  }

  return Math.max(SIDEBAR_MIN_WIDTH, Math.floor(window.innerWidth * SIDEBAR_MAX_VIEWPORT_RATIO));
}

function clampSidebarWidth(width) {
  return Math.min(sidebarMaxWidth(), Math.max(SIDEBAR_MIN_WIDTH, width));
}

const ANALYSIS_PURPOSE_CONFIGS = {
  empathy: {
    label: JP_UI_LABELS.empathyPurpose,
    shortDescription: "近い声を集める",
    description: "同じような悩みや近い感情の声を集めます。安心したい、自分だけではないと感じたい時に使います。",
    voiceDirections: ["empatheticVoices"],
    queryTerms: [
      "恋愛相談 不安",
      "彼氏 連絡 不安",
      "好きな人 返信こない",
      "愛されたい",
      "恋愛 寂しい",
      "重いと思われたくない",
      "恋愛 つらい",
      "恋愛 疲れた",
      "返信 待ってしまう",
    ],
    retrievalPolicy: "近い悩み、同じ感情、共感表現、安心したい声、自分だけではないと感じられる声を集めます。",
    clusterPolicy: "近い声と感情ごとのまとまりを優先します。反対意見は少なめに扱います。",
    zone11Policy: "寄り添いを強め、近い声と少し楽になる見方を上に出します。",
    hashtags: ["#恋愛相談", "#恋愛の悩み", "#片思い"],
    cautionHashtags: ["#恋愛", "#復縁", "#婚活", "#マッチングアプリ"],
    excludeTerms: [
      "無料相談",
      "プロフィールのリンク",
      "予約",
      "鑑定",
      "占い",
      "カウンセラー",
      "講座",
      "公式LINE",
      "LINE登録",
      "note",
      "相談サービス",
      "心理相談室",
      "恋愛カウンセラー",
      "お問い合わせ",
      "受付中",
      "出会い系",
      "アダルト",
      "業者",
      "PR",
    ],
    disabledQueryTerms: ["現代の恋愛とは", "何を満たすものなのか", "恋愛とは", "承認", "癒し", "成長", "自由", "性的魅力"],
  },
  debate: {
    label: JP_UI_LABELS.debatePurpose,
    shortDescription: "違う見方を集める",
    description: "反対意見、違う立場、高い視座の意見を集めます。自分の意見を深めたい、反論を見たい時に使います。",
    voiceDirections: ["differentViewpoints", "opposingOpinions"],
    queryTerms: [
      "返信遅い 気にしすぎ",
      "連絡頻度 愛情ではない",
      "恋愛 依存",
      "恋愛 自立",
      "恋愛 重い",
      "恋愛 期待しすぎ",
      "恋愛 距離感",
      "恋愛 価値観 違い",
    ],
    retrievalPolicy: "反対意見、違う立場、高い視座、論点化された意見、自分の考えと距離がある意見を集めます。",
    clusterPolicy: "賛成系、反対系、別視点系を分け、自分の意見から遠いクラスタやY/Z軸が高い意見を重視します。",
    zone11Policy: "違う見方を上に出し、反対意見を攻撃的にせず視野を広げる表現にします。",
    hashtags: ["#恋愛相談", "#恋愛観", "#恋愛の悩み", "#人間関係"],
    cautionHashtags: ["#恋愛", "#婚活", "#マッチングアプリ"],
    excludeTerms: ["占い", "ツインレイ", "ツインソウル", "スピリチュアル", "無料相談", "公式LINE", "鑑定", "アダルト", "出会い系", "業者", "PR"],
    disabledQueryTerms: ["反対意見", "議論", "批判", "論点"],
  },
  advice: {
    label: JP_UI_LABELS.advicePurpose,
    shortDescription: "解決のヒントを集める",
    description: "助言、解決策、経験知、高い視座の意見を集めます。次にどう考えるか、どう動くかを知りたい時に使います。",
    voiceDirections: ["adviceHints", "personalExperiences"],
    queryTerms: [
      "恋愛相談 伝え方",
      "彼氏 話し合い",
      "不安 伝え方 恋愛",
      "恋愛 自己肯定感",
      "恋愛 境界線",
      "恋愛 距離感 作り方",
      "恋愛 不安 対処",
      "連絡 不安 対処",
      "恋愛 依存 やめたい",
    ],
    retrievalPolicy: "助言、解決策、経験知、話し合い方、伝え方、自己理解、高い視座を集めます。",
    clusterPolicy: "行動案ごとにまとめ、相談者が次にできることとZ軸の高い意見を優先します。",
    zone11Policy: "助言・ヒントを上に出し、次に考える問いと行動案を具体的にします。",
    hashtags: ["#恋愛相談", "#恋愛の悩み", "#自己肯定感", "#マッチングアプリ"],
    cautionHashtags: ["#恋愛", "#婚活", "#復縁"],
    excludeTerms: ["無料相談", "公式LINE", "プロフィールのリンク", "鑑定", "占い", "カウンセラー募集", "講座", "アダルト", "出会い系", "業者", "PR"],
    disabledQueryTerms: ["アドバイス", "ヒント", "解決策"],
  },
  position: {
    label: JP_UI_LABELS.positionPurpose,
    shortDescription: "全体像を見る",
    description: "多様な意見と多様な視座を集めます。自分の意見が全体のどこにあるかを知りたい時に使います。",
    voiceDirections: ["empatheticVoices", "differentViewpoints", "personalExperiences", "opposingOpinions"],
    queryTerms: [
      "恋愛 価値観",
      "恋愛 承認欲求",
      "恋愛 自己理解",
      "恋愛 自由",
      "恋愛 結婚観",
      "恋愛 距離感",
      "恋愛 依存",
      "恋愛 自立",
      "マッチングアプリ 不安",
      "彼氏 連絡 不安",
    ],
    retrievalPolicy: "多様な意見、多様な視座、近い声、遠い声、少数派、構造的な意見を集めます。",
    clusterPolicy: "近い声、遠い声、足りない視点をバランスよく出し、3Dグラフとの相性と多様性を重視します。",
    zone11Policy: "現在地マップとして、自分の意見の位置づけ、近いクラスタ、遠いクラスタ、足りない視点を出します。",
    hashtags: ["#恋愛相談", "#恋愛の悩み", "#恋愛観", "#マッチングアプリ", "#婚活"],
    cautionHashtags: ["#恋愛", "#復縁", "#片思い"],
    excludeTerms: ["出会い系", "アダルト", "業者", "PR", "無料登録", "占い", "鑑定", "公式LINE", "副業", "パパ活"],
    disabledQueryTerms: ["現代の恋愛とは", "何を満たすものなのか", "単に交際や結婚に向かう制度的な関係ではない", "自分が誰かにどう見られたいか", "誰といると自分らしくいられるか"],
  },
};

function defaultAnalysisPurposeForPersona(mode) {
  return mode === "personaA" ? "empathy" : "position";
}

function normalizeAnalysisPurposeMode(value, personaMode = "dev") {
  return ANALYSIS_PURPOSE_CONFIGS[value] ? value : defaultAnalysisPurposeForPersona(personaMode);
}

function analysisPurposeConfigFor(value, personaMode = "dev") {
  return ANALYSIS_PURPOSE_CONFIGS[normalizeAnalysisPurposeMode(value, personaMode)];
}

function purposeVoiceDirections(value, personaMode = "dev") {
  return analysisPurposeConfigFor(value, personaMode).voiceDirections;
}

function purposeQueryTerms(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).queryTerms || []).filter((term) => !looksLikeMojibake(term));
}

function purposeHashtags(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).hashtags || []).filter((tag) => sanitizeHashtag(tag));
}

function purposeCautionHashtags(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).cautionHashtags || []).filter((tag) => sanitizeHashtag(tag));
}

function purposeExcludeTerms(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).excludeTerms || []).filter((term) => !looksLikeMojibake(term));
}

function purposeDisabledQueryTerms(value, personaMode = "dev") {
  return uniqueByValue([
    ...PERSONA_A_BROAD_QUERY_TERMS,
    ...(analysisPurposeConfigFor(value, personaMode).disabledQueryTerms || []),
  ]).filter((term) => !looksLikeMojibake(term));
}

const CLUSTER_THRESHOLD_OPTIONS = [
  { value: 0.15, label: "0.15 ゆるい" },
  { value: 0.25, label: "0.25 ややゆるい" },
  { value: 0.35, label: "0.35 標準" },
  { value: 0.45, label: "0.45 厳しい" },
];

const SEMANTIC_THRESHOLD_OPTIONS = [
  { value: 0.6, label: "0.60 かなりゆるい" },
  { value: 0.65, label: "0.65 ゆるい" },
  { value: 0.7, label: "0.70" },
  { value: 0.75, label: "0.75" },
  { value: 0.78, label: "0.78 標準" },
  { value: 0.82, label: "0.82" },
  { value: 0.86, label: "0.86 厳しい" },
];

const AUTO_SUMMARY_LIMIT_OPTIONS = [5, 10, 15];

const AXIS_PRESETS = {
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

const PERSONA_CONFIGS = {
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

const DEFAULT_X_QUERY_FILTERS = {
  excludeRetweets: true,
  excludeReplies: false,
  excludeLinks: false,
  language: "ja",
  minLikes: "",
  minRetweets: "",
  includeWords: "",
  excludeWords: "",
};

const EMPTY_OPERATION_STATUS = {
  status: "idle",
  message: "",
  lastRunAt: "",
  lastSuccessAt: "",
  lastErrorAt: "",
  lastErrorMessage: "",
  lastTargetSummary: "",
};

const OPERATION_KEYS = [
  "fetchX",
  "saveDataset",
  "aiAxisDraft",
  "applyAxis",
  "rescore",
  "semanticCluster",
  "saveCluster",
  "autoSummary",
  "feedback",
  "copyAnalysis",
];

function createInitialOperationStatus() {
  return Object.fromEntries(OPERATION_KEYS.map((key) => [key, { ...EMPTY_OPERATION_STATUS }]));
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      setTimeout(resolve, 0);
      return;
    }

    window.requestAnimationFrame(() => window.setTimeout(resolve, 0));
  });
}

function splitWords(value) {
  return String(value || "")
    .split(/[\s,、]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function uniqueByValue(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function sanitizeHashtagDetail(value) {
  const original = String(value || "").trim();
  const detail = { input: original, value: "", removed: "", reason: "" };
  if (!original) {
    detail.reason = "empty";
    return detail;
  }
  if (looksLikeMojibake(original)) {
    detail.removed = original;
    detail.reason = "mojibake_detected";
    return detail;
  }

  let clean = original.replace(/^#+/, "").trim();
  clean = clean.split(/[\s,、。。，！？!?()[\]{}"“”'`]+/)[0] || "";
  HASHTAG_NOISE_MARKERS.forEach((marker) => {
    const index = clean.indexOf(marker);
    if (index > 0) {
      detail.removed = `${detail.removed}${detail.removed ? " " : ""}${clean.slice(index)}`;
      clean = clean.slice(0, index);
    }
  });
  if (clean.includes("-")) {
    const [head, ...tail] = clean.split("-");
    detail.removed = `${detail.removed}${detail.removed ? " " : ""}${tail.join("-")}`;
    clean = head;
  }
  clean = clean.replace(/^#+/, "").replace(/#+/g, "").trim();

  if (!clean) {
    detail.reason = "empty_after_sanitize";
    return detail;
  }
  if (clean.length > 12) {
    detail.reason = "too_long";
    return detail;
  }
  if (!/^[\p{L}\p{N}_ー]+$/u.test(clean)) {
    detail.reason = "invalid_chars";
    return detail;
  }
  if (GENERIC_QUERY_TERMS.includes(clean)) {
    detail.reason = "too_generic";
    return detail;
  }
  if (clean.split(/[・_ー]/).filter(Boolean).length > 4) {
    detail.reason = "too_many_words";
    return detail;
  }

  detail.value = `#${clean}`;
  return detail;
}

function sanitizeHashtag(value) {
  return sanitizeHashtagDetail(value).value;
}

function sanitizeExcludeTermDetail(value) {
  const original = String(value || "").trim();
  if (looksLikeMojibake(original)) {
    return {
      input: original,
      values: [],
      removed: original,
      reason: "mojibake_detected",
    };
  }
  const clean = sanitizeXQueryTerm(original.replace(/^#+/, "").replace(/^-+/, ""));
  const parts = clean
    .split(/\s+/)
    .map((term) => term.trim().replace(/^#+/, "").replace(/^-+/, ""))
    .filter((term) => term && term.length <= 18 && !UNSAFE_EXCLUDE_TERM_PATTERN.test(term));
  return {
    input: original,
    values: uniqueByValue(parts),
    removed: original && parts.length === 0 ? original : "",
    reason: original && parts.length === 0 ? "invalid_or_too_long" : "",
  };
}

function sanitizeExcludeTerm(value) {
  return sanitizeExcludeTermDetail(value).values;
}

function normalizeHashtag(value) {
  return sanitizeHashtag(value);
}

function selectedHashtagsBase(hashtags) {
  return uniqueByValue((Array.isArray(hashtags) ? hashtags : []).map(sanitizeHashtag)).join(" OR ");
}

function appendHashtagsToBase(base, hashtags) {
  const cleanBase = stripXCommonFilters(base);
  const hashtagBase = selectedHashtagsBase(hashtags);
  if (cleanBase && hashtagBase) return `(${cleanBase}) OR (${hashtagBase})`;
  return cleanBase || hashtagBase;
}

function mergeExcludeWords(filters, excludeTerms) {
  const excludeWords = uniqueByValue(
    [...splitWords(filters?.excludeWords), ...(Array.isArray(excludeTerms) ? excludeTerms : [])].flatMap(sanitizeExcludeTerm)
  ).join(" ");
  return { ...(filters || DEFAULT_X_QUERY_FILTERS), excludeWords };
}

function buildXQueryWithHashtags(base, filters = DEFAULT_X_QUERY_FILTERS, hashtags = [], excludeTerms = []) {
  return buildXQuery(appendHashtagsToBase(base, hashtags), mergeExcludeWords(filters, excludeTerms));
}

function buildXQuery(base, filters = DEFAULT_X_QUERY_FILTERS) {
  const parts = [];
  const cleanBase = String(base || "").trim();
  if (cleanBase) {
    parts.push(cleanBase);
  }

  splitWords(filters.includeWords).forEach((word) => parts.push(word));
  splitWords(filters.excludeWords).forEach((word) => parts.push(`-${word}`));

  if (filters.language) {
    parts.push(`lang:${filters.language}`);
  }
  if (filters.excludeRetweets) {
    parts.push("-is:retweet");
  }
  if (filters.excludeReplies) {
    parts.push("-is:reply");
  }
  if (filters.excludeLinks) {
    parts.push("-has:links");
  }

  const minLikes = String(filters.minLikes || "").trim();
  if (minLikes) {
    parts.push(`min_likes:${minLikes}`);
  }

  const minRetweets = String(filters.minRetweets || "").trim();
  if (minRetweets) {
    parts.push(`min_reposts:${minRetweets}`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function stripXCommonFilters(query) {
  return String(query || "")
    .replace(/\blang:[a-z]{2}\b/gi, " ")
    .replace(/-is:retweet\b/gi, " ")
    .replace(/-is:reply\b/gi, " ")
    .replace(/-has:links\b/gi, " ")
    .replace(/\bmin_likes:\d+\b/gi, " ")
    .replace(/\bmin_reposts:\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeXQueryTerm(value) {
  return String(value || "")
    .replace(/\bAND\b/gi, " ")
    .replace(/\bOR\b/gi, " ")
    .replace(/\blang:[a-z]{2}\b/gi, " ")
    .replace(/-is:(retweet|reply|quote|short)\b/gi, " ")
    .replace(/-has:links\b/gi, " ")
    .replace(/-url\b/gi, " ")
    .replace(/\burl\b/gi, " ")
    .replace(/\bmin_(likes|reposts|retweets):\d+\b/gi, " ")
    .replace(/[()[\]{}"“”'`]+/g, " ")
    .replace(/^[-+]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeXQueryPhrase(value) {
  const phrase = sanitizeXQueryTerm(value);
  if (looksLikeMojibake(phrase)) return "";
  if (!phrase || phrase === "-" || /^#?$/.test(phrase)) return "";
  if (/^(AND|OR)$/i.test(phrase)) return "";
  return phrase.length > 40 ? phrase.slice(0, 40).trim() : phrase;
}

function queryToSafeIncludeGroups(query) {
  const base = stripXCommonFilters(query)
    .replace(/\bAND\b/gi, " ")
    .replace(/-url\b/gi, " ")
    .replace(/-is:short\b/gi, " ");
  return base
    .split(/\s+OR\s+/i)
    .map((part) => sanitizeXQueryPhrase(part))
    .filter(Boolean)
    .slice(0, 10)
    .map((part) => [part]);
}

function isPersonaARomanceQuery(options = {}) {
  return (
    options.personaMode === "personaA" &&
    getThemeCategory(options.sampleKey || "", options.theme || "", options.userOpinion || "") === "romance"
  );
}

function buildPurposeFallbackIncludeGroups(options = {}) {
  if (!isPersonaARomanceQuery(options)) {
    return [];
  }

  const mode = normalizeAnalysisPurposeMode(options.analysisPurposeMode, options.personaMode);
  return purposeQueryTerms(mode, options.personaMode)
    .slice(0, 8)
    .map((term) => [term]);
}

function refineIncludeGroupsForPurpose(rawGroups, options = {}) {
  if (!isPersonaARomanceQuery(options)) {
    return {
      includeGroups: rawGroups,
      warnings: [],
      removedParts: [],
    };
  }

  const mode = normalizeAnalysisPurposeMode(options.analysisPurposeMode, options.personaMode);
  const disabledTerms = purposeDisabledQueryTerms(mode, options.personaMode);
  const removedParts = [];
  const includeGroups = (Array.isArray(rawGroups) ? rawGroups : [])
    .map((group) => (Array.isArray(group) ? group : [group]))
    .map((group) =>
      group
        .map((term) => sanitizeXQueryPhrase(term))
        .filter(Boolean)
        .filter((term) => {
          const normalized = term.replace(/\s+/g, "");
          const disabled = disabledTerms.some((blocked) => {
            const blockedNormalized = sanitizeXQueryPhrase(blocked).replace(/\s+/g, "");
            if (!blockedNormalized) {
              return false;
            }
            if (blockedNormalized.length <= 3) {
              return normalized === blockedNormalized;
            }
            return normalized === blockedNormalized || normalized.includes(blockedNormalized);
          });
          const tooLong = term.length > 24;
          const tooAbstract = PERSONA_A_BROAD_QUERY_TERMS.includes(term);
          if (disabled || tooLong || tooAbstract) {
            removedParts.push({
              input: term,
              output: "",
              removed: term,
              reason: disabled ? "purpose_disabled_query_term" : tooLong ? "too_long_user_phrase" : "too_abstract_single_term",
            });
            return false;
          }
          return true;
        })
    )
    .filter((group) => group.length > 0);

  return {
    includeGroups,
    warnings: removedParts.length ? [`${JP_UI_LABELS.analysisPurpose}に合わない検索語を${removedParts.length}件除外しました。`] : [],
    removedParts,
  };
}

function buildPurposeFinalQueryWarnings(finalQuery, options = {}) {
  if (!isPersonaARomanceQuery(options)) {
    return [];
  }

  const normalizedQuery = String(finalQuery || "").replace(/\s+/g, "");
  const disabledTerms = purposeDisabledQueryTerms(options.analysisPurposeMode, options.personaMode);
  const warnings = [];
  const hasDisabledTerm = disabledTerms.some((term) => {
    const normalizedTerm = sanitizeXQueryPhrase(term).replace(/\s+/g, "");
    if (!normalizedTerm) {
      return false;
    }
    if (normalizedTerm.length <= 3) {
      return normalizedQuery.split(/OR|[()#\-\s]/).filter(Boolean).includes(normalizedTerm);
    }
    return normalizedQuery.includes(normalizedTerm);
  });
  const hasInvalidHashtag = /#[^\s)]*[-、。，！？!?][^\s)]*/.test(finalQuery);
  const hasLongPhrase = String(finalQuery || "")
    .split(/\s+OR\s+|\(|\)|\s+-|\s+lang:|\s+-is:/i)
    .map((term) => term.trim())
    .filter(Boolean)
    .some((term) => term.length > 28 && !term.startsWith("#"));

  if (hasDisabledTerm) {
    warnings.push("目的モードで使わない検索語が最終クエリに残ったためfallbackを使います。");
  }
  if (hasInvalidHashtag) {
    warnings.push("不自然な複合ハッシュタグが最終クエリに残ったためfallbackを使います。");
  }
  if (hasLongPhrase) {
    warnings.push("長文のユーザー意見らしき検索語が最終クエリに残ったためfallbackを使います。");
  }

  return warnings;
}

function buildSafeXQuery({
  includeGroups = [],
  hashtags = [],
  excludeTerms = [],
  lang = "ja",
  excludeRetweets = true,
  maxLength = MAX_SAFE_QUERY_LENGTH,
} = {}) {
  const warnings = [];
  const includeSanitizeResults = (Array.isArray(includeGroups) ? includeGroups : []).map((group) => {
    const terms = Array.isArray(group) ? group : [group];
    const sanitizedTerms = terms.map((term) => ({
      input: String(term || ""),
      output: sanitizeXQueryPhrase(term),
    }));
    return {
      input: terms.map((term) => String(term || "")).join(" "),
      output: sanitizedTerms.map((item) => item.output).filter(Boolean).join(" "),
      removedTerms: sanitizedTerms.filter((item) => item.input && !item.output),
    };
  });
  const includeParts = uniqueByValue(includeSanitizeResults.map((item) => item.output).filter(Boolean));
  const mojibakeIncludeRemovedParts = includeSanitizeResults
    .flatMap((item) => item.removedTerms)
    .filter((item) => looksLikeMojibake(item.input))
    .map((item) => ({
      input: item.input,
      output: "",
      removed: item.input,
      reason: "mojibake_detected",
    }));
  if (mojibakeIncludeRemovedParts.length > 0) {
    warnings.push(`文字化けの可能性がある検索語候補を${mojibakeIncludeRemovedParts.length}件除外しました。`);
  }
  const hashtagSanitizeResults = (Array.isArray(hashtags) ? hashtags : []).filter(Boolean).map(sanitizeHashtagDetail);
  const safeHashtags = uniqueByValue(hashtagSanitizeResults.map((item) => item.value).filter(Boolean));
  const unsafeHashtagCount = hashtagSanitizeResults.filter((item) => !item.value).length;
  const sanitizedHashtagRemovedParts = hashtagSanitizeResults
    .filter((item) => item.removed || (!item.value && item.input))
    .map((item) => ({
      input: item.input,
      output: item.value,
      removed: item.removed || item.input,
      reason: item.reason || "trimmed_noise_suffix",
    }));
  if (unsafeHashtagCount > 0) {
    warnings.push(`安全でないハッシュタグ候補を${unsafeHashtagCount}件除外しました。`);
  }

  const excludeSanitizeResults = (Array.isArray(excludeTerms) ? excludeTerms : []).filter(Boolean).map(sanitizeExcludeTermDetail);
  const safeExcludeTerms = uniqueByValue(excludeSanitizeResults.flatMap((item) => item.values)).slice(0, 8);
  const sanitizedExcludeRemovedParts = excludeSanitizeResults
    .filter((item) => item.removed || item.values.length === 0)
    .map((item) => ({
      input: item.input,
      output: item.values.join(" / "),
      removed: item.removed || item.input,
      reason: item.reason || "invalid_or_too_long",
    }));
  if (excludeSanitizeResults.some((item) => item.values.length === 0 && item.input)) {
    warnings.push("安全でない除外語候補を除外しました。");
  }
  const orParts = [...includeParts, ...safeHashtags].slice(0, 12);
  const body = orParts.length > 1 ? `(${orParts.join(" OR ")})` : orParts[0] || "";
  const filters = [
    ...safeExcludeTerms.map((term) => `-${term}`),
    lang ? `lang:${lang}` : "",
    excludeRetweets ? "-is:retweet" : "",
  ].filter(Boolean);
  let query = [body, ...filters].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  while (query.length > maxLength && orParts.length > 1) {
    orParts.pop();
    const nextBody = orParts.length > 1 ? `(${orParts.join(" OR ")})` : orParts[0] || "";
    query = [nextBody, ...filters].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    warnings.push("クエリが長すぎたため、優先度の低いOR条件を削りました。");
  }

  if (query.length > maxLength) {
    const compactFilters = [lang ? `lang:${lang}` : "", excludeRetweets ? "-is:retweet" : ""].filter(Boolean);
    const availableLength = Math.max(20, maxLength - compactFilters.join(" ").length - 4);
    const compactBody = sanitizeXQueryPhrase(body).slice(0, availableLength).trim();
    query = [compactBody, ...compactFilters].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    warnings.push("クエリが長すぎたため、除外語と一部条件を削って短縮しました。");
  }

  return {
    query,
    warnings: uniqueByValue(warnings),
    includeParts,
    safeHashtags,
    safeExcludeTerms,
    sanitizedHashtagRemovedParts,
    sanitizedExcludeRemovedParts,
    sanitizedQueryRemovedParts: mojibakeIncludeRemovedParts,
    queryLength: query.length,
  };
}

function cleanupFinalXQuerySyntax(query) {
  let next = String(query || "")
    .replace(/\bAND\b/gi, " ")
    .replace(/\s+OR\s+(?=\))/gi, " ")
    .replace(/\(\s+OR\s+/gi, "(")
    .replace(/\(\s*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  while (/\(\s*\)/.test(next) || /\s+OR\s+(?=\))|\(\s+OR\s+/i.test(next)) {
    next = next
      .replace(/\s+OR\s+(?=\))/gi, " ")
      .replace(/\(\s+OR\s+/gi, "(")
      .replace(/\(\s*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return next;
}

function sanitizeFinalQueryForXApi(query, maxLength = MAX_SAFE_QUERY_LENGTH) {
  const warnings = [];
  const sanitizedHashtagRemovedParts = [];
  const sanitizedExcludeRemovedParts = [];
  let next = String(query || "");

  next = next
    .replace(/-url\b/gi, " ")
    .replace(/\burl\b/gi, " ")
    .replace(/-is:(reply|quote|short)\b/gi, " ")
    .replace(/-has:links\b/gi, " ")
    .replace(/\bmin_(likes|reposts|retweets):\d+\b/gi, " ");

  next = next.replace(/[^\s()]+/g, (token) => {
    if (!looksLikeMojibake(token)) return token;
    sanitizedExcludeRemovedParts.push({
      input: token,
      output: "",
      removed: token,
      reason: "mojibake_detected",
    });
    warnings.push("X API送信直前に文字化けの可能性がある検索語を除外しました。");
    return " ";
  });

  next = next.replace(/#([^\s)]+)/g, (match) => {
    const detail = sanitizeHashtagDetail(match);
    if (detail.value !== match) {
      sanitizedHashtagRemovedParts.push({
        input: match,
        output: detail.value,
        removed: detail.removed || match,
        reason: detail.reason || "final_query_sanitize",
      });
      warnings.push("X API送信直前に不正なハッシュタグを補正しました。");
    }
    return detail.value || " ";
  });

  next = next.replace(/(^|\s)-([^\s)]+)/g, (match, prefix, term) => {
    if (/^is:retweet$/i.test(term)) {
      return `${prefix}-is:retweet`;
    }
    if (/^(is:|has:|url$|min_)/i.test(term)) {
      sanitizedExcludeRemovedParts.push({
        input: `-${term}`,
        output: "",
        removed: `-${term}`,
        reason: "unsafe_x_operator",
      });
      warnings.push("X API送信直前に危険な検索演算子を除外しました。");
      return prefix || " ";
    }

    const detail = sanitizeExcludeTermDetail(term);
    if (detail.values.length === 0) {
      sanitizedExcludeRemovedParts.push({
        input: `-${term}`,
        output: "",
        removed: detail.removed || `-${term}`,
        reason: detail.reason || "invalid_exclude_term",
      });
      warnings.push("X API送信直前に不正な除外語を除外しました。");
      return prefix || " ";
    }
    if (detail.values.join(" ") !== term) {
      sanitizedExcludeRemovedParts.push({
        input: `-${term}`,
        output: detail.values.map((value) => `-${value}`).join(" "),
        removed: detail.removed || "",
        reason: "final_query_sanitize",
      });
    }
    return `${prefix}${detail.values.map((value) => `-${value}`).join(" ")}`;
  });

  next = cleanupFinalXQuerySyntax(next);

  if (next.length > maxLength) {
    next = cleanupFinalXQuerySyntax(next.slice(0, maxLength));
    warnings.push("X API送信直前に長すぎるクエリを短縮しました。");
  }

  return {
    query: next,
    queryLength: next.length,
    warnings: uniqueByValue(warnings),
    sanitizedHashtagRemovedParts,
    sanitizedExcludeRemovedParts,
  };
}

function buildFallbackSafeQuery({ sampleKey, theme, userOpinion, hashtags = [], excludeTerms = [] } = {}) {
  const options = arguments[0] || {};
  const purposeGroups = buildPurposeFallbackIncludeGroups(options);
  if (purposeGroups.length > 0) {
    return buildSafeXQuery({
      includeGroups: purposeGroups,
      hashtags,
      excludeTerms: [...purposeExcludeTerms(options.analysisPurposeMode, options.personaMode), ...excludeTerms],
    });
  }

  const sampleCandidates = samples?.[sampleKey]?.xQueryCandidates || [];
  const candidateTerms = sampleCandidates
    .flatMap((candidate) => queryToSafeIncludeGroups(candidate.base || candidate.query || ""))
    .flat()
    .slice(0, 5);
  const fallbackKeywords = extractFallbackKeywords(theme, userOpinion)
    .filter((word) => !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 6);
  return buildSafeXQuery({
    includeGroups: [...candidateTerms, ...fallbackKeywords].map((term) => [term]),
    hashtags,
    excludeTerms,
  });
}

function buildSafeXQueryFromRaw(rawQuery, options = {}) {
  const rawGroups = queryToSafeIncludeGroups(rawQuery);
  const refinedGroups = refineIncludeGroupsForPurpose(rawGroups, options);
  const fallback = buildFallbackSafeQuery(options);
  const safe = buildSafeXQuery({
    includeGroups: refinedGroups.includeGroups.length ? refinedGroups.includeGroups : fallback.includeParts.map((part) => [part]),
    hashtags: options.hashtags || [],
    excludeTerms: isPersonaARomanceQuery(options)
      ? [...purposeExcludeTerms(options.analysisPurposeMode, options.personaMode), ...(options.excludeTerms || [])]
      : options.excludeTerms || [],
  });
  const query = safe.query || fallback.query;
  const finalSafe = sanitizeFinalQueryForXApi(query);
  const finalFallback = sanitizeFinalQueryForXApi(fallback.query);
  const finalQueryForXApi = finalSafe.query || finalFallback.query;
  const cleanFallbackBase =
    isPersonaARomanceQuery(options)
      ? purposeQueryTerms(options.analysisPurposeMode, options.personaMode)[0] || "恋愛相談 不安"
      : sanitizeXQueryPhrase(options.theme || "") || "意見";
  const cleanFallback = buildSafeXQuery({
    includeGroups: queryToSafeIncludeGroups(cleanFallbackBase),
    hashtags: [],
    excludeTerms: isPersonaARomanceQuery(options) ? purposeExcludeTerms(options.analysisPurposeMode, options.personaMode) : [],
  });
  const finalCleanFallback = sanitizeFinalQueryForXApi(cleanFallback.query);
  const finalQueryBlockedByMojibake = looksLikeMojibake(finalQueryForXApi);
  const purposeFinalWarnings = buildPurposeFinalQueryWarnings(finalQueryForXApi, options);
  const finalQueryBlockedByPurpose = purposeFinalWarnings.length > 0;
  const safeFinalQueryForXApi = finalQueryBlockedByMojibake || finalQueryBlockedByPurpose
    ? finalCleanFallback.query
    : finalQueryForXApi;

  return {
    rawQuery: String(rawQuery || "").trim(),
    safeQuery: query,
    fallbackQuery: fallback.query,
    finalQueryForXApi: safeFinalQueryForXApi,
    fallbackQueryForXApi: finalFallback.query,
    queryBuildWarnings: uniqueByValue([
      ...(safe.warnings || []),
      ...(fallback.warnings || []),
      ...(finalSafe.warnings || []),
      ...(finalFallback.warnings || []),
      ...(refinedGroups.warnings || []),
      ...(rawGroups.length && refinedGroups.includeGroups.length ? [] : ["元クエリから安全な検索語を抽出できなかったためfallbackを使います。"]),
      ...(finalQueryBlockedByMojibake ? ["検索条件を安全な形に再作成しました。"] : []),
      ...purposeFinalWarnings,
    ]),
    queryLength: query.length,
    finalQueryLength: safeFinalQueryForXApi.length,
    fallbackQueryLength: fallback.query.length,
    finalFallbackQueryLength: finalFallback.query.length,
    sanitizedHashtags: safe.safeHashtags || [],
    sanitizedExcludeTerms: safe.safeExcludeTerms || [],
    sanitizedHashtagRemovedParts: uniqueByValue([
      ...(safe.sanitizedHashtagRemovedParts || []),
      ...(fallback.sanitizedHashtagRemovedParts || []),
      ...(finalSafe.sanitizedHashtagRemovedParts || []),
      ...(finalFallback.sanitizedHashtagRemovedParts || []),
    ].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    sanitizedExcludeRemovedParts: uniqueByValue([
      ...(safe.sanitizedExcludeRemovedParts || []),
      ...(safe.sanitizedQueryRemovedParts || []),
      ...(fallback.sanitizedExcludeRemovedParts || []),
      ...(fallback.sanitizedQueryRemovedParts || []),
      ...(finalSafe.sanitizedExcludeRemovedParts || []),
      ...(finalFallback.sanitizedExcludeRemovedParts || []),
    ].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    sanitizedQueryRemovedParts: uniqueByValue([
      ...(safe.sanitizedQueryRemovedParts || []),
      ...(fallback.sanitizedQueryRemovedParts || []),
      ...(refinedGroups.removedParts || []),
    ].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    queryParts: {
      includeTerms: safe.includeParts || [],
      includeHashtags: safe.safeHashtags || [],
      excludeTerms: safe.safeExcludeTerms || [],
      cautionTerms: isPersonaARomanceQuery(options) ? purposeCautionHashtags(options.analysisPurposeMode, options.personaMode) : [],
      disabledTerms: isPersonaARomanceQuery(options) ? purposeDisabledQueryTerms(options.analysisPurposeMode, options.personaMode) : [],
      finalQueryForXApi: safeFinalQueryForXApi,
    },
  };
}

function queryBaseLooksGenericOnly(base) {
  const terms = String(base || "")
    .split(/\s+OR\s+|\s+|\(|\)|\u3000/gi)
    .map((term) => term.trim())
    .filter(Boolean);

  return terms.length > 0 && terms.every((term) => GENERIC_QUERY_TERMS.includes(term));
}

function bindGenericQueryToTheme(base, theme, userOpinion) {
  const cleanBase = stripXCommonFilters(base);
  if (!cleanBase) {
    return cleanBase;
  }

  if (!queryBaseLooksGenericOnly(cleanBase)) {
    return cleanBase;
  }

  const themeWords = extractFallbackKeywords(theme, userOpinion).filter((word) => !GENERIC_QUERY_TERMS.includes(word));
  const themeAnchor = themeWords.slice(0, 2).join(" OR ") || String(theme || "").trim();

  return themeAnchor ? `(${themeAnchor}) (${cleanBase})` : cleanBase;
}

function buildCombinedXQuery(candidates, selectedIds, filters, manualQuery, hashtags = [], excludeTerms = []) {
  if (!selectedIds.length) {
    return buildXQueryWithHashtags(manualQuery, filters, hashtags, excludeTerms);
  }

  const selectedSet = new Set(selectedIds);
  const combinedBase = candidates
    .filter((candidate) => selectedSet.has(candidate.label))
    .map((candidate) => stripXCommonFilters(candidate.base || candidate.query || ""))
    .filter(Boolean)
    .map((query) => `(${query})`)
    .join(" OR ");

  return buildXQueryWithHashtags(combinedBase, filters, hashtags, excludeTerms);
}

const samples = {
  housing: {
    sampleNo: 1,
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
    xQueryCandidates: [
      {
        label: "生活者の負担",
        base: "住宅価格 OR 住宅ローン OR 家賃",
        query: buildXQuery("住宅価格 OR 住宅ローン OR 家賃"),
        note: "家計・ローン・賃料など、一般生活者の不安を広く拾う",
      },
      {
        label: "中古・空き家",
        base: "中古住宅 OR 空き家 OR リノベーション",
        query: buildXQuery("中古住宅 OR 空き家 OR リノベーション"),
        note: "中古流通・空き家活用・既存住宅の論点を拾う",
      },
      {
        label: "政策・構造論",
        base: "住宅政策 OR 長寿命住宅 OR 資産形成",
        query: buildXQuery("住宅政策 OR 長寿命住宅 OR 資産形成"),
        note: "制度・社会構造・資産形成寄りの意見を拾う",
      },
    ],
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
    sampleNo: 2,
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
    xQueryCandidates: [
      {
        label: "生活影響",
        base: "イラン OR 原油価格 OR ガソリン価格",
        query: buildXQuery("イラン OR 原油価格 OR ガソリン価格"),
        note: "物価・エネルギー・家計影響を拾う",
      },
      {
        label: "中東安全保障",
        base: "イラン OR 中東 OR ホルムズ海峡",
        query: buildXQuery("イラン OR 中東 OR ホルムズ海峡"),
        note: "地政学・海上輸送・安全保障の論点を拾う",
      },
      {
        label: "外交・核問題",
        base: "イラン核合意 OR 核開発 OR 制裁",
        query: buildXQuery("イラン核合意 OR 核開発 OR 制裁"),
        note: "核問題・制裁・外交解決の論点を拾う",
      },
    ],
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
    sampleNo: 3,
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
    xQueryCandidates: [
      {
        label: "学習のつまずき",
        base: "プログラミング学習 OR エラー OR つまずく",
        query: buildXQuery("プログラミング学習 OR エラー OR つまずく"),
        note: "初心者の困りごと・理解負荷を拾う",
      },
      {
        label: "教室運営",
        base: "プログラミング教室 OR コーディング教室 OR 授業改善",
        query: buildXQuery("プログラミング教室 OR コーディング教室 OR 授業改善"),
        note: "教室・講師・運営改善に関する声を拾う",
      },
      {
        label: "AI時代の教育",
        base: "AI教育 OR プログラミング教育 OR 学習支援",
        query: buildXQuery("AI教育 OR プログラミング教育 OR 学習支援"),
        note: "教育の再設計・将来性の論点を拾う",
      },
    ],
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

  religion: {
    sampleNo: 4,
    label: "宗教",
    theme: "宗教は、現代人にとってどのような意味を持つべきか？",
    axisLabels: {
      x: "X：信仰・実感",
      y: "Y：社会・制度理解",
      z: "Z：精神性・超越性",
    },
    axisDescriptions: {
      x: "個人の救い、心の支え、祈り、実感に近い意見ほど高い。",
      y: "宗教と共同体、政治、教育、法制度、社会問題の関係を見ている意見ほど高い。",
      z: "人間の成長、愛、死生観、超越性、意識の深化に関わる意見ほど高い。",
    },
    analysis:
      "このテーマでは、個人の救い、社会制度との関係、精神性・超越性のどこに意見が寄っているかを見ることが重要です。",
    userOpinion: {
      text: "宗教は、単に信じるか信じないかの問題ではなく、人間が苦しみや死、罪、救い、共同体、超越性とどう向き合うかを扱う装置だと思う。現代では教義の正しさだけでなく、人の精神性を高め、他者への愛や自己理解を深める力があるかが重要だ。",
      score: { x: 7, y: 7, z: 9 },
    },
    xQueryCandidates: [
      { label: "宗教と現代社会", base: "宗教 OR 信仰 OR 現代社会", query: buildXQuery("宗教 OR 信仰 OR 現代社会"), note: "宗教と現代社会の関係を広く拾う" },
      { label: "宗教と救い", base: "宗教 救い OR 信仰 救い OR 神 救い", query: buildXQuery("宗教 救い OR 信仰 救い OR 神 救い"), note: "救い・信仰・神への実感を拾う" },
      { label: "宗教と心の支え", base: "宗教 心の支え OR 信仰 心の支え OR スピリチュアル", query: buildXQuery("宗教 心の支え OR 信仰 心の支え OR スピリチュアル"), note: "心の支えや精神的ケアの論点を拾う" },
      { label: "宗教と争い", base: "宗教 戦争 OR 宗教 対立 OR 宗教 争い", query: buildXQuery("宗教 戦争 OR 宗教 対立 OR 宗教 争い"), note: "宗教対立や社会的リスクを拾う" },
      { label: "宗教離れ", base: "宗教離れ OR 無宗教 OR 信仰離れ", query: buildXQuery("宗教離れ OR 無宗教 OR 信仰離れ"), note: "無宗教化・信仰離れの声を拾う" },
      { label: "仏教・キリスト教", base: "仏教 OR キリスト教 OR 神道", query: buildXQuery("仏教 OR キリスト教 OR 神道"), note: "具体的な宗教伝統への意見を拾う" },
      { label: "カルト・危険性", base: "カルト OR 宗教二世 OR 旧統一教会", query: buildXQuery("カルト OR 宗教二世 OR 旧統一教会"), note: "被害・危険性・制度対応の論点を拾う" },
      { label: "精神性", base: "精神性 OR 祈り OR 瞑想", query: buildXQuery("精神性 OR 祈り OR 瞑想"), note: "祈り・瞑想・超越性を拾う" },
    ],
    externalOpinions: [
      { text: "宗教は困った時の心の支えになると思う。", score: { x: 9, y: 3, z: 5 } },
      { text: "無宗教でも倫理や思いやりは持てる。", score: { x: 5, y: 5, z: 5 } },
      { text: "宗教団体と政治の距離はもっと慎重に見るべきだ。", score: { x: 3, y: 9, z: 4 } },
      { text: "カルト被害を防ぐ制度や教育が必要だ。", score: { x: 4, y: 8, z: 4 } },
      { text: "祈りや瞑想は、現代人が自分を取り戻す時間になる。", score: { x: 7, y: 4, z: 9 } },
      { text: "宗教は共同体を支える一方で、排他性も生みやすい。", score: { x: 5, y: 8, z: 7 } },
      { text: "死や苦しみに向き合う言葉を持っている点で宗教は重要だ。", score: { x: 8, y: 5, z: 9 } },
      { text: "教義よりも、他者への愛を育てるかどうかが大事だ。", score: { x: 7, y: 5, z: 9 } },
    ],
  },

  democracy: {
    sampleNo: 5,
    label: "民主主義",
    theme: "民主主義は、SNS時代にどのようにアップデートされるべきか？",
    axisLabels: {
      x: "X：民意・参加",
      y: "Y：熟議・構造理解",
      z: "Z：未来の民主主義",
    },
    axisDescriptions: {
      x: "投票、世論、市民参加、民意の反映を重視する意見ほど高い。",
      y: "多数決の限界、制度設計、分断、熟議、合意形成の構造を見ている意見ほど高い。",
      z: "AI、SNS、広聴、参加型民主主義など、民主主義のアップデートを考える意見ほど高い。",
    },
    analysis:
      "このテーマでは、多数派の量だけでなく、熟議の深さや未来の制度設計への視点を見ることが重要です。",
    userOpinion: {
      text: "民主主義は単に多数決をする仕組みではなく、多様な意見を可視化し、少数派や深い視点も含めて社会の意思形成に活かす仕組みであるべきだと思う。SNS時代には、いいね数や感情的な拡散に流されず、意見の量、深さ、視座を分けて見られる新しい道具が必要だ。",
      score: { x: 7, y: 9, z: 10 },
    },
    xQueryCandidates: [
      { label: "民主主義とSNS", base: "民主主義 SNS OR 世論 SNS OR 政治 SNS", query: buildXQuery("民主主義 SNS OR 世論 SNS OR 政治 SNS"), note: "SNS時代の世論形成を拾う" },
      { label: "多数決の限界", base: "多数決 限界 OR 民主主義 多数派 OR 少数派 意見", query: buildXQuery("多数決 限界 OR 民主主義 多数派 OR 少数派 意見"), note: "多数決・少数派・制度限界を拾う" },
      { label: "熟議・対話", base: "熟議 OR 対話 OR 市民参加", query: buildXQuery("熟議 OR 対話 OR 市民参加"), note: "熟議民主主義や対話の声を拾う" },
      { label: "選挙・投票", base: "選挙 OR 投票 OR 政治参加", query: buildXQuery("選挙 OR 投票 OR 政治参加"), note: "選挙・投票・参加の論点を拾う" },
      { label: "ポピュリズム", base: "ポピュリズム OR 分断 OR 炎上", query: buildXQuery("ポピュリズム OR 分断 OR 炎上"), note: "分断や炎上政治の論点を拾う" },
      { label: "民意・世論", base: "民意 OR 世論 OR 国民の声", query: buildXQuery("民意 OR 世論 OR 国民の声"), note: "民意や世論への期待を拾う" },
      { label: "民主主義の危機", base: "民主主義 危機 OR 民主主義 劣化 OR 権威主義", query: buildXQuery("民主主義 危機 OR 民主主義 劣化 OR 権威主義"), note: "民主主義の劣化や危機感を拾う" },
      { label: "広聴・ブロードリスニング", base: "広聴 OR ブロードリスニング OR 意見 可視化", query: buildXQuery("広聴 OR ブロードリスニング OR 意見 可視化"), note: "広聴・意見可視化・新しい道具を拾う" },
    ],
    externalOpinions: [
      { text: "選挙に行く人を増やすことがまず大事だ。", score: { x: 9, y: 4, z: 4 } },
      { text: "SNSの炎上が世論のように扱われるのは危険だ。", score: { x: 6, y: 8, z: 5 } },
      { text: "多数決だけでは少数派の声が消えてしまう。", score: { x: 6, y: 8, z: 6 } },
      { text: "市民が対話する場をもっと増やすべきだ。", score: { x: 8, y: 7, z: 6 } },
      { text: "政治家は国民の声をもっと聞くべきだ。", score: { x: 9, y: 4, z: 4 } },
      { text: "AIで大量の意見を整理できれば民主主義は進化する。", score: { x: 6, y: 8, z: 10 } },
      { text: "ポピュリズムは感情を煽るだけで問題解決にならない。", score: { x: 5, y: 8, z: 6 } },
      { text: "熟議と広聴を組み合わせる制度設計が必要だ。", score: { x: 6, y: 9, z: 10 } },
    ],
  },

  romance: {
    sampleNo: 6,
    label: "恋愛",
    theme: "現代の恋愛は、何を満たすものなのか？",
    axisLabels: {
      x: "X：感情・承認",
      y: "Y：関係性・現実理解",
      z: "Z：自己理解・成長",
    },
    axisDescriptions: {
      x: "好き、愛されたい、寂しさ、安心、承認欲求など感情面に近い意見ほど高い。",
      y: "結婚、生活、距離感、相性、マッチングアプリ、男女のすれ違いなど関係の現実を見ている意見ほど高い。",
      z: "恋愛を通じた自己理解、癒し、成熟、自由、愛のあり方に関する意見ほど高い。",
    },
    analysis:
      "このテーマでは、感情や承認だけでなく、現実の関係性や自己理解の深さを見ることが重要です。",
    userOpinion: {
      text: "恋愛は、単に交際や結婚に向かう制度的な関係ではなく、自分が誰かにどう見られたいか、誰といると自分らしくいられるか、どのように愛情や欲望や安心を交換するかという、自己理解と他者理解の深い体験だと思う。現代では、恋愛は結婚だけでなく、承認、癒し、成長、性的魅力、自由とのバランスの問題になっている。",
      score: { x: 8, y: 8, z: 9 },
    },
    xQueryCandidates: [
      { label: "恋愛と結婚", base: "恋愛 結婚 OR 付き合う 結婚 OR 婚活", query: buildXQuery("恋愛 結婚 OR 付き合う 結婚 OR 婚活"), note: "恋愛と結婚・婚活の論点を拾う" },
      { label: "恋愛と承認欲求", base: "恋愛 承認欲求 OR 愛されたい OR モテたい", query: buildXQuery("恋愛 承認欲求 OR 愛されたい OR モテたい"), note: "承認欲求や愛されたい気持ちを拾う" },
      { label: "恋愛と安心感", base: "恋愛 安心感 OR 一緒にいて落ち着く OR パートナー 安心", query: buildXQuery("恋愛 安心感 OR 一緒にいて落ち着く OR パートナー 安心"), note: "安心感・癒し・信頼を拾う" },
      { label: "恋愛と自由", base: "恋愛 自由 OR 束縛 OR 距離感", query: buildXQuery("恋愛 自由 OR 束縛 OR 距離感"), note: "自由・束縛・距離感の論点を拾う" },
      { label: "マッチングアプリ", base: "マッチングアプリ OR Tinder OR ペアーズ", query: buildXQuery("マッチングアプリ OR Tinder OR ペアーズ"), note: "アプリ時代の出会いを拾う" },
      { label: "恋愛離れ", base: "恋愛離れ OR 若者 恋愛 OR 結婚しない", query: buildXQuery("恋愛離れ OR 若者 恋愛 OR 結婚しない"), note: "恋愛離れや非婚化を拾う" },
      { label: "性的魅力", base: "色気 OR 性的魅力 OR セックス 恋愛", query: buildXQuery("色気 OR 性的魅力 OR セックス 恋愛"), note: "性的魅力や欲望の論点を拾う" },
      { label: "男女関係", base: "男性心理 OR 女性心理 OR 男女関係", query: buildXQuery("男性心理 OR 女性心理 OR 男女関係"), note: "男女関係やすれ違いの声を拾う" },
    ],
    externalOpinions: [
      { text: "恋愛は好きな人に愛されたい気持ちが一番大きい。", score: { x: 10, y: 3, z: 4 } },
      { text: "一緒にいて安心できる人がいい。", score: { x: 9, y: 5, z: 5 } },
      { text: "結婚を考えるなら生活力や価値観の一致が大事だ。", score: { x: 5, y: 9, z: 5 } },
      { text: "マッチングアプリは効率的だけど人を条件で見すぎる。", score: { x: 5, y: 8, z: 6 } },
      { text: "束縛される恋愛より、お互い自由でいられる関係がいい。", score: { x: 6, y: 7, z: 8 } },
      { text: "恋愛を通じて、自分の弱さや依存に気づくことがある。", score: { x: 7, y: 6, z: 9 } },
      { text: "性的魅力も大事だけど、それだけでは長く続かない。", score: { x: 8, y: 7, z: 7 } },
      { text: "恋愛しない自由も、現代では尊重されるべきだ。", score: { x: 4, y: 7, z: 8 } },
    ],
  },
};

function stripAxisPrefix(label) {
  return String(label || "").replace(/^[XYZ]\s*[:：]\s*/i, "").trim();
}

function createThemeAxisConfig(sample) {
  const axisLabels = sample?.axisLabels || {};
  const axisDescriptions = sample?.axisDescriptions || {};

  return {
    presetKey: "themeDefault",
    axisSource: "theme",
    x: {
      label: stripAxisPrefix(axisLabels.x) || "量・支持",
      description: axisDescriptions.x || "どれだけ多く語られているか、または支持・共感を集めやすい意見ほど高い。",
      lowDescription: "この軸が低い意見は、この観点が弱い、または別の観点を重視しています。",
    },
    y: {
      label: stripAxisPrefix(axisLabels.y) || "深さ・構造理解",
      description: axisDescriptions.y || "背景、制度、構造、因果関係まで見ている意見ほど高い。",
      lowDescription: "この軸が低い意見は、この観点が弱い、または別の観点を重視しています。",
    },
    z: {
      label: stripAxisPrefix(axisLabels.z) || "視座・未来性",
      description: axisDescriptions.z || "長期的、俯瞰的、未来志向、社会全体への視点を含む意見ほど高い。",
      lowDescription: "この軸が低い意見は、この観点が弱い、または別の観点を重視しています。",
    },
  };
}

function getThemeCategory(sampleKey, theme, userOpinion) {
  const contentTopic = inferTopicKey("", theme, userOpinion);
  return contentTopic !== "general" ? contentTopic : inferTopicKey(sampleKey, theme, userOpinion);
}

function sampleForThemeCategory(themeCategory, fallbackSample = samples.housing) {
  return samples[themeCategory] || fallbackSample || samples.housing;
}

function getThemeAxisPreset(theme, themeCategory, fallbackSample = samples.housing) {
  const themeSample = sampleForThemeCategory(themeCategory, fallbackSample);
  const axisConfig = createThemeAxisConfig(themeSample);

  return {
    ...axisConfig,
    presetKey: "themeDefault",
    axisSource: "theme",
    themeCategory: themeCategory || "general",
    themeLabel: String(theme || themeSample?.theme || "").trim(),
  };
}

function normalizeAxisConfig(config, sample = samples.housing) {
  const fallback = createThemeAxisConfig(sample);

  return {
    presetKey: config?.presetKey || fallback.presetKey,
    axisSource: config?.axisSource || fallback.axisSource || (config?.presetKey === "themeDefault" ? "theme" : "custom"),
    themeCategory: config?.themeCategory || fallback.themeCategory || "",
    themeLabel: config?.themeLabel || fallback.themeLabel || "",
    x: {
      label: String(config?.x?.label || fallback.x.label).trim(),
      description: String(config?.x?.description || fallback.x.description).trim(),
      lowDescription: String(config?.x?.lowDescription || fallback.x.lowDescription).trim(),
    },
    y: {
      label: String(config?.y?.label || fallback.y.label).trim(),
      description: String(config?.y?.description || fallback.y.description).trim(),
      lowDescription: String(config?.y?.lowDescription || fallback.y.lowDescription).trim(),
    },
    z: {
      label: String(config?.z?.label || fallback.z.label).trim(),
      description: String(config?.z?.description || fallback.z.description).trim(),
      lowDescription: String(config?.z?.lowDescription || fallback.z.lowDescription).trim(),
    },
  };
}

function axisConfigFromPreset(presetKey, sample) {
  if (presetKey === "themeDefault") {
    return createThemeAxisConfig(sample);
  }

  const preset = AXIS_PRESETS[presetKey];

  if (!preset?.x) {
    return {
      ...createThemeAxisConfig(sample),
      presetKey: presetKey || "themeDefault",
    };
  }

  return normalizeAxisConfig({ ...preset, presetKey }, sample);
}

function axisLabel(axis, config) {
  return `${axis.toUpperCase()}：${config?.[axis]?.label || ""}`;
}

function axisPresetLabel(config) {
  return AXIS_PRESETS[config?.presetKey]?.label || PERSONA_CONFIGS[config?.presetKey]?.shortLabel || "カスタム";
}

function sampleTitle(sample, fallback = "") {
  return String(sample?.sampleLabel || sample?.label || fallback)
    .replace(/^サンプル\d+\s*[:：]\s*/, "")
    .trim();
}

function sampleNoForKey(key) {
  return samples[key]?.sampleNo || null;
}

function sampleNoLabel(key, fallbackNo = null) {
  const no = fallbackNo || sampleNoForKey(key);
  return no ? `サンプル${no}` : "No未設定";
}

function sampleDisplayLabel(key, fallbackLabel = "") {
  const sample = samples[key];
  const title = sampleTitle(sample, fallbackLabel || key);
  const no = sample?.sampleNo;

  return no ? `サンプル${no}：${title}` : title;
}

function datasetSampleNo(dataset) {
  return dataset?.sampleNo || sampleNoForKey(dataset?.sampleKey) || null;
}

function autoResizeTextarea(textarea) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function uniqueValues(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function generateAxisLinkedKeywords(axisConfig) {
  const rules = [
    {
      pattern: /性差|男女|男性|女性|ジェンダー|性別/i,
      keywords: ["男女差", "男性心理", "女性心理", "ジェンダー", "性別役割", "奢り割り勘", "男らしさ", "女らしさ"],
    },
    {
      pattern: /精神性|超越|祈り|死生観|救い|スピリチュアル/i,
      keywords: ["精神性", "死生観", "祈り", "救い", "スピリチュアル", "意識", "愛"],
    },
    {
      pattern: /社会|制度|政治|法|共同体|教育/i,
      keywords: ["社会問題", "制度", "法律", "政治", "共同体", "教育", "社会構造"],
    },
    {
      pattern: /感情|不安|安心|承認|悩み|寂し/i,
      keywords: ["不安", "安心", "承認欲求", "寂しい", "愛されたい", "悩み", "相談"],
    },
    {
      pattern: /成長|自己理解|成熟|癒し|自分らし/i,
      keywords: ["自己理解", "成長", "成熟", "癒し", "自分らしさ", "変化"],
    },
  ];
  const result = { x: [], y: [], z: [], all: [] };

  ["x", "y", "z"].forEach((axis) => {
    const source = `${axisConfig?.[axis]?.label || ""} ${axisConfig?.[axis]?.description || ""}`;
    const keywords = rules.flatMap((rule) => (rule.pattern.test(source) ? rule.keywords : []));

    result[axis] = uniqueValues(keywords);
  });

  result.all = uniqueValues([...result.x, ...result.y, ...result.z]);

  return result;
}

function buildQueryWithAxisKeywords(baseQuery, keywords, filters) {
  const selectedKeywords = uniqueValues(keywords);

  if (selectedKeywords.length === 0) {
    return baseQuery;
  }

  const cleanBase = stripXCommonFilters(baseQuery);
  const axisQuery = selectedKeywords.join(" OR ");
  const combinedBase = cleanBase ? `(${cleanBase}) OR (${axisQuery})` : axisQuery;

  return buildXQuery(combinedBase, filters);
}

function buildQueryAxisWarnings(axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode) {
  if (analysisMode !== "axisDriven") {
    return [];
  }

  const query = String(effectiveQuery || "").toLowerCase();

  return ["x", "y", "z"].flatMap((axis) => {
    const keywords = axisLinkedKeywords?.[axis] || [];
    const hasKeyword = keywords.some((keyword) => query.includes(keyword.toLowerCase()));

    if (keywords.length === 0 || hasKeyword) {
      return [];
    }

    return [
      `現在の${axis.toUpperCase()}軸は「${axisConfig?.[axis]?.label || axis}」ですが、検索クエリに ${keywords
        .slice(0, 3)
        .join("・")} などの関連語が含まれていません。このまま取得すると、${axis.toUpperCase()}軸で差が出にくい可能性があります。`,
    ];
  });
}

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

const THEME_HASHTAG_LIBRARY = {
  democracy: [
    ["民主主義", "#民主主義", "民主主義を明示的に語る投稿を拾います。", "中"],
    ["選挙参加", "#選挙に行こう", "投票行動や政治参加の投稿を拾います。", "中"],
    ["国民投票", "#国民投票", "投票制度や民意に関する投稿を拾います。", "中"],
    ["政治参加", "#政治参加", "政治参加に関する投稿を拾います。", "低"],
    ["熟議", "#熟議民主主義", "熟議や対話に寄った投稿を拾います。", "低"],
    ["投票に行こう", "#投票に行こう", "選挙参加の呼びかけを拾います。", "中"],
    ["選挙制度", "#選挙制度", "制度面の論点を拾います。", "低"],
    ["ブロードリスニング", "#ブロードリスニング", "意見可視化・広聴の投稿を拾います。", "低"],
  ],
  housing: [
    ["住宅ローン", "#住宅ローン", "住宅ローン負担の声を拾います。", "低"],
    ["家づくり", "#家づくり", "住まいづくりの実感を拾います。", "中"],
    ["マイホーム", "#マイホーム", "持ち家や購入の投稿を拾います。", "中"],
    ["空き家", "#空き家", "空き家活用の論点を拾います。", "低"],
    ["中古住宅", "#中古住宅", "中古住宅市場の投稿を拾います。", "低"],
    ["リノベーション", "#リノベーション", "既存住宅活用の投稿を拾います。", "中"],
    ["住宅政策", "#住宅政策", "政策面の投稿を拾います。", "低"],
  ],
  coding: [
    ["プログラミング初心者", "#プログラミング初心者", "初学者のつまずきを拾います。", "中"],
    ["駆け出しエンジニア", "#駆け出しエンジニアと繋がりたい", "学習者コミュニティの投稿を拾います。", "中"],
    ["今日の積み上げ", "#今日の積み上げ", "学習継続の投稿を拾います。", "中"],
    ["Python初心者", "#Python初心者", "Python初学者の声を拾います。", "低"],
    ["プログラミング学習", "#プログラミング学習", "学習全般の投稿を拾います。", "低"],
    ["コーディング", "#コーディング", "実装や学習の投稿を拾います。", "低"],
  ],
  religion: [
    ["宗教", "#宗教", "宗教を明示的に語る投稿を拾います。", "中"],
    ["信仰", "#信仰", "信仰の実感を拾います。", "低"],
    ["祈り", "#祈り", "祈りや精神性の投稿を拾います。", "中"],
    ["スピリチュアル", "#スピリチュアル", "精神性の投稿を拾いますがPR混入に注意します。", "高"],
    ["宗教観", "#宗教観", "宗教観に関する投稿を拾います。", "低"],
  ],
  romance: [
    ["恋愛", "#恋愛", "恋愛全般の投稿を拾います。", "中"],
    ["婚活", "#婚活", "結婚や出会いの投稿を拾います。", "中"],
    ["マッチングアプリ", "#マッチングアプリ", "アプリ時代の出会いを拾います。", "高"],
    ["結婚観", "#結婚観", "結婚観に関する投稿を拾います。", "低"],
    ["恋愛相談", "#恋愛相談", "相談系投稿を拾います。", "中"],
  ],
};

const THEME_EXCLUDE_TERM_LIBRARY = {
  democracy: ["ミクチャ", "人気投票", "楽曲投票", "イベント投票", "ゲーム", "競馬", "ライブ", "コス投票", "TGC", "JRA", "PR"],
  coding: ["求人", "転職", "無料相談", "教材販売", "スクール勧誘", "副業", "PR"],
  housing: ["PR", "無料相談", "一括査定", "不動産投資", "勧誘", "キャンペーン"],
  religion: ["占い", "開運", "無料鑑定", "スピ商材", "PR"],
  romance: ["出会い系", "アダルト", "業者", "PR", "無料登録"],
};

const PERSONA_A_QUERY_TERMS_BY_DIRECTION = {
  empatheticVoices: [
    "恋愛相談 不安",
    "彼氏 連絡 不安",
    "好きな人 返信こない",
    "愛されたい",
    "恋愛 寂しい",
    "大切にされたい",
  ],
  differentViewpoints: [
    "返信遅い 気にしすぎ",
    "恋愛 自立",
    "恋愛 距離感",
    "依存しない 恋愛",
    "恋愛 相手に期待しすぎ",
    "LINE 返信 愛情ではない",
  ],
  personalExperiences: [
    "彼氏 連絡 体験談",
    "マッチングアプリ 不安 体験談",
    "恋愛 うまくいかなかった",
    "恋愛 距離感 体験談",
  ],
  adviceHints: [
    "恋愛相談 伝え方",
    "彼氏 話し合い",
    "不安 伝え方 恋愛",
    "恋愛 自己肯定感",
    "恋愛 境界線",
  ],
  values: [
    "恋愛 価値観",
    "恋愛 結婚観",
    "恋愛 自由",
    "恋愛 承認欲求",
    "恋愛 自分らしさ",
  ],
  opposingOpinions: [
    "恋愛 重い",
    "返信遅い 愛情じゃない",
    "恋愛 依存",
    "恋愛 自立",
    "連絡頻度 気にしすぎ",
  ],
};

const PERSONA_A_HASHTAG_CANDIDATES = [
  ["恋愛相談", "#恋愛相談", "恋愛相談として自然に読める投稿を拾います。", "低", "recommended"],
  ["恋愛の悩み", "#恋愛の悩み", "悩み相談に近い投稿を拾います。", "低", "recommended"],
  ["マッチングアプリ", "#マッチングアプリ", "マッチングアプリ文脈の不安を拾います。", "中", "recommended"],
  ["恋愛", "#恋愛", "広すぎるため自動選択しない注意候補です。", "高", "caution"],
  ["婚活", "#婚活", "結婚・出会い文脈に偏りやすいため注意候補です。", "高", "caution"],
  ["失恋", "#失恋", "失恋文脈に偏りやすいため注意候補です。", "高", "caution"],
  ["復縁", "#復縁", "復縁商材や占い宣伝が混ざりやすいため注意候補です。", "高", "caution"],
  ["片思い", "#片思い", "片思い文脈に偏りやすいため注意候補です。", "中", "caution"],
];

const PERSONA_A_EXCLUDE_TERMS = [
  "アニメ",
  "漫画",
  "マンガ",
  "ゲーム",
  "ブルーロック",
  "推し",
  "アイドル",
  "占い",
  "運勢",
  "星座",
  "ツインソウル",
  "ツインレイ",
  "スピリチュアル",
  "政治",
  "田中角栄",
  "歴史",
  "PR",
  "無料相談",
  "副業",
  "出会い系",
  "業者",
  "アダルト",
  "パパ活",
  "繧｢繝九Γ",
  "貍ｫ逕ｻ",
  "繧ｲ繝ｼ繝",
  "繝悶Ν繝ｼ繝ｭ繝・け",
  "謗ｨ縺・",
  "繧｢繧､繝峨Ν",
  "蜊縺・",
  "驕句兇",
  "譏溷ｺｧ",
  "繝・う繝ｳ繧ｽ繧ｦ繝ｫ",
  "繝・う繝ｳ繝ｬ繧､",
  "繧ｹ繝斐Μ繝√Η繧｢繝ｫ",
  "謾ｿ豐ｻ",
  "逕ｰ荳ｭ隗呈・",
  "豁ｴ蜿ｲ",
  "辟｡譁咏嶌隲・",
  "蜑ｯ讌ｭ",
  "蜃ｺ莨壹＞邉ｻ",
  "讌ｭ閠・",
  "繧｢繝繝ｫ繝・",
  "繝代ヱ豢ｻ",
];

function inferTopicKey(sampleKey, theme, userOpinion) {
  const text = `${sampleKey} ${theme} ${userOpinion}`;
  if (/民主主義|政治|選挙|投票|SNS|民意/.test(text)) return "democracy";
  if (/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(text)) return "housing";
  if (/プログラミング|コード|Python|学習|教室|エラー|初心者/.test(text)) return "coding";
  if (/宗教|信仰|仏教|神|祈り|救い/.test(text)) return "religion";
  if (/恋愛|婚活|結婚|マッチング|男女/.test(text)) return "romance";
  return sampleKey || "general";
}

function buildHashtagCandidates(sampleKey, theme, userOpinion, aiAdvice = null, personaMode = "dev", analysisPurposeMode = "position") {
  const topicKey = getThemeCategory(sampleKey, theme, userOpinion);
  const purposeMode = normalizeAnalysisPurposeMode(analysisPurposeMode, personaMode);
  const purposeRecommendedTags = personaMode === "personaA" && topicKey === "romance" ? purposeHashtags(purposeMode, personaMode) : [];
  const purposeCautionTags = personaMode === "personaA" && topicKey === "romance" ? purposeCautionHashtags(purposeMode, personaMode) : [];
  const purposeCandidates = [
    ...purposeRecommendedTags.map((tag) => [tag.replace(/^#/, ""), tag, `${JP_UI_LABELS.analysisPurpose}: ${analysisPurposeConfigFor(purposeMode, personaMode).label}の推奨ハッシュタグです。`, "低", "recommended"]),
    ...purposeCautionTags.map((tag) => [tag.replace(/^#/, ""), tag, `${JP_UI_LABELS.analysisPurpose}: ${analysisPurposeConfigFor(purposeMode, personaMode).label}では広がりすぎる注意候補です。`, "高", "caution"]),
  ];
  const libraryCandidates =
    personaMode === "personaA" && topicKey === "romance"
      ? PERSONA_A_HASHTAG_CANDIDATES
      : getThemeHashtagCandidates(theme, topicKey);
  const aiCandidates = Array.isArray(aiAdvice?.improvedHashtagCandidates)
    ? aiAdvice.improvedHashtagCandidates.map((item) => [
        item.label || item.hashtag,
        item.hashtag,
        item.reason || "AIが提案したハッシュタグ候補です。",
        item.noiseRisk || "中",
        item.selectionType || "",
      ])
    : [];
  const fallbackKeywords = extractFallbackKeywords(theme, userOpinion)
    .slice(0, 4)
    .map((word) => [word, normalizeHashtag(word), "テーマ語から作ったハッシュタグ候補です。", "中", "recommended"]);

  const seen = new Set();
  return [...purposeCandidates, ...libraryCandidates, ...aiCandidates, ...fallbackKeywords]
    .map(([label, hashtag, reason, noiseRisk, selectionType]) => {
      if (looksLikeMojibake(`${label || ""} ${hashtag || ""} ${reason || ""}`)) {
        return null;
      }
      const normalizedHashtag = normalizeHashtag(hashtag);
      const risk = String(noiseRisk || "中");
      const explicitType = String(selectionType || "").toLowerCase();
      const isTooBroad =
        normalizedHashtag.length > 24 ||
        GENERIC_QUERY_TERMS.some((term) => normalizedHashtag.replace(/^#/, "") === term) ||
        /[。、，,.！？!?]/.test(normalizedHashtag);
      const normalizedSelectionType =
        explicitType === "disabled" || explicitType === "not_recommended" || isTooBroad
          ? "disabled"
          : explicitType === "caution" || risk === "高"
            ? "caution"
            : "recommended";

      return {
        label: String(label || hashtag || "").replace(/^#/, ""),
        hashtag: normalizedHashtag,
        reason: String(reason || ""),
        noiseRisk: risk,
        selectionType: normalizedSelectionType,
        selectionReason:
          normalizedSelectionType === "recommended"
            ? "初期選択対象です。関連投稿を拾いやすい候補として扱います。"
            : normalizedSelectionType === "caution"
              ? "注意候補です。ノイズが混じりやすいため初期選択しません。"
              : "非推奨候補です。広すぎる、またはノイズ化しやすいため選択できません。",
      };
    })
    .filter(Boolean)
    .filter((item) => item.hashtag && !seen.has(item.hashtag) && seen.add(item.hashtag))
    .slice(0, 10);
}

function buildExcludeTermCandidates(sampleKey, theme, userOpinion, noiseBreakdown = [], personaMode = "dev", analysisPurposeMode = "position") {
  const topicKey = getThemeCategory(sampleKey, theme, userOpinion);
  const baseTerms = THEME_EXCLUDE_TERM_LIBRARY[topicKey] || ["PR", "キャンペーン", "無料", "登録", "ゲーム"];
  const personaAExcludeTerms = personaMode === "personaA" && topicKey === "romance" ? PERSONA_A_EXCLUDE_TERMS : [];
  const purposeTerms = personaMode === "personaA" && topicKey === "romance"
    ? purposeExcludeTerms(analysisPurposeMode, personaMode)
    : [];
  const noiseTerms = (Array.isArray(noiseBreakdown) ? noiseBreakdown : []).flatMap((item) => {
    if (item.category === "promotion_or_ad") return ["PR", "キャンペーン", "無料", "登録"];
    if (item.category === "game_anime_entertainment") return ["ゲーム", "アニメ", "ガチャ"];
    if (item.category === "sports_or_event") return ["競馬", "試合", "イベント"];
    if (item.category === "product_or_shopping") return ["販売", "購入", "レビュー"];
    return [];
  });

  return uniqueByValue([...purposeTerms, ...baseTerms, ...personaAExcludeTerms, ...noiseTerms])
    .filter((term) => !looksLikeMojibake(term))
    .slice(0, 24)
    .map((term) => ({
      label: term,
      term,
      reason: "ハッシュタグ検索時の宣伝・別文脈ノイズを減らします。",
    }));
}

function stableHash(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || {});
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function axisScoreOnly(score) {
  return {
    x: Number(score?.x) || 0,
    y: Number(score?.y) || 0,
    z: Number(score?.z) || 0,
  };
}

function wordsInText(text, words) {
  return words.filter((word) => word && text.includes(word));
}

function scoreMeta(text, sampleKey, axisConfig, score) {
  const normalized = normalizeOpinionText(text);
  const axisWords = ["x", "y", "z"].flatMap((axis) => axisKeywords(axisConfig?.[axis]));
  const sample = samples[sampleKey] || {};
  const themeWords = uniqueValues(
    `${sample.theme || ""} ${sample.label || ""} ${axisWords.join(" ")}`
      .split(/[、。\s・,./／（）()「」『』:：]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2)
  ).slice(0, 40);
  const matchedThemeWords = wordsInText(normalized, themeWords);
  const noiseWords = [
    "広告",
    "PR",
    "キャンペーン",
    "無料",
    "募集",
    "カード",
    "ゲーム",
    "作品",
    "Claude",
    "ChatGPT",
    "Gemini",
    "AIツール",
    "比較",
    "ランキング",
    "構造だけ",
  ];
  const matchedNoiseWords = wordsInText(normalized, noiseWords);
  const textDetail = Math.min(normalized.length / 120, 2);
  const axisHitCount = matchedThemeWords.length;
  const averageScore = (Number(score?.x || 0) + Number(score?.y || 0) + Number(score?.z || 0)) / 3;
  const relevanceScore = Math.round(
    clamp(2 + axisHitCount * 1.2 + textDetail + (averageScore >= 6 ? 1 : 0) - matchedNoiseWords.length * 1.6, 1, 10)
  );
  const scoreConfidence = Math.round(
    clamp(3 + Math.min(axisHitCount, 4) + textDetail - matchedNoiseWords.length * 0.8, 1, 10)
  );
  const scoreWarnings = [];

  if (relevanceScore <= 3) {
    scoreWarnings.push("テーマまたは評価軸との関連が弱いため低めに採点しました。");
  }
  if (matchedNoiseWords.length > 0) {
    scoreWarnings.push(`ノイズ候補語: ${matchedNoiseWords.slice(0, 4).join(" / ")}`);
  }
  if (axisHitCount === 0) {
    scoreWarnings.push("評価軸説明に近い語が少なく、スコア信頼度は控えめです。");
  }

  return {
    relevanceScore,
    scoreConfidence,
    scoreWarnings,
  };
}

function scoreLevelLabel(score) {
  const value = Number(score) || 0;
  if (value >= 8) return "高い";
  if (value >= 6) return "やや高い";
  if (value >= 4) return "中程度";
  if (value >= 2) return "やや低い";
  return "低い";
}

function axisExplanationItems(axisConfig) {
  return ["x", "y", "z"].map((axis) => {
    const config = axisConfig?.[axis] || {};
    const label = config.label || axis.toUpperCase();
    const description = config.description || "説明未設定";
    const high = config.highDescription || config.high || `高いほど「${label}」が強く出ている意見です。`;
    const low = config.lowDescription || config.low || `低いほど「${label}」が弱い、または本文内の根拠が少ない意見です。`;

    return {
      axis,
      label,
      description,
      high,
      low,
    };
  });
}

function reasonKeywordsForAxis(axisConfig, axis) {
  const config = axisConfig?.[axis] || {};
  return uniqueValues(
    [
      ...(axisKeywords(config) || []),
      ...(config.highDescription ? axisKeywords({ description: config.highDescription }) : []),
      ...(config.lowDescription ? axisKeywords({ description: config.lowDescription }) : []),
    ]
      .map((word) => String(word || "").trim())
      .filter((word) => word.length >= 2)
  ).slice(0, 16);
}

function buildScoreReasonForAxis(text, score, axisConfig, axis, confidence = null) {
  const normalized = normalizeOpinionText(text || "");
  const axisItem = axisExplanationItems(axisConfig).find((item) => item.axis === axis);
  const evidenceKeywords = wordsInText(normalized, reasonKeywordsForAxis(axisConfig, axis)).slice(0, 6);
  const scoreValue = Math.round(Number(score?.[axis]) || 0);
  const reasonConfidence = Math.round(
    clamp(Number(confidence) || 3 + Math.min(evidenceKeywords.length, 4), 1, 10)
  );
  const reason =
    evidenceKeywords.length > 0
      ? `本文に「${evidenceKeywords.join(" / ")}」があり、${axisItem.label}は${scoreLevelLabel(scoreValue)}と評価しました。`
      : `${axisItem.label}に直結する根拠語が少ないため参考値です。軸説明との一致は弱めです。`;

  return {
    score: scoreValue,
    reason,
    evidenceKeywords,
    confidence: reasonConfidence,
  };
}

function buildScoreReasons(text, score, axisConfig, confidence = null) {
  return {
    x: buildScoreReasonForAxis(text, score, axisConfig, "x", confidence),
    y: buildScoreReasonForAxis(text, score, axisConfig, "y", confidence),
    z: buildScoreReasonForAxis(text, score, axisConfig, "z", confidence),
  };
}

function ensureScoreReasons(row, text, axisConfig) {
  if (row?.scoreReasons?.x && row?.scoreReasons?.y && row?.scoreReasons?.z) {
    return row.scoreReasons;
  }

  return buildScoreReasons(text || row?.scoredText || row?.opinion || "", axisScoreOnly(row), axisConfig, row?.scoreConfidence);
}

function calibrateScoreByRelevance(score, meta) {
  const base = axisScoreOnly(score);

  if (meta.relevanceScore <= 2) {
    return {
      x: Math.min(base.x, 2),
      y: Math.min(base.y, 2),
      z: Math.min(base.z, 2),
    };
  }

  if (meta.relevanceScore <= 4) {
    return {
      x: Math.min(base.x, 3),
      y: Math.min(base.y, 4),
      z: Math.min(base.z, 4),
    };
  }

  return base;
}

function withScoreMeta(score, text, sampleKey, axisConfig, trusted = false) {
  const initialScore = axisScoreOnly(score);
  const initialMeta = scoreMeta(text, sampleKey, axisConfig, initialScore);
  const calibratedScore = trusted ? initialScore : calibrateScoreByRelevance(initialScore, initialMeta);
  const finalMeta = trusted
    ? { relevanceScore: 10, scoreConfidence: 9, scoreWarnings: [] }
    : scoreMeta(text, sampleKey, axisConfig, calibratedScore);

  return {
    ...calibratedScore,
    ...finalMeta,
    scoreReasons: buildScoreReasons(text, calibratedScore, axisConfig, finalMeta.scoreConfidence),
  };
}

function fallbackScore(text, sampleKey, axisConfig) {
  if (axisConfig?.presetKey && axisConfig.presetKey !== "themeDefault") {
    return fallbackCustomAxisScore(text, axisConfig);
  }

  if (sampleKey === "coding") {
    return fallbackCodingScore(text);
  }

  if (sampleKey === "religion") {
    return fallbackReligionScore(text);
  }

  if (sampleKey === "democracy") {
    return fallbackDemocracyScore(text);
  }

  if (sampleKey === "romance") {
    return fallbackRomanceScore(text);
  }

  return fallbackGeneralScore(text);
}

function addKeywordScore(text, words, weight = 1) {
  return words.reduce((sum, word) => (text.includes(word) ? sum + weight : sum), 0);
}

function axisKeywords(axis) {
  return `${axis?.label || ""} ${axis?.description || ""}`
    .split(/[、。\s・,./／（）()]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 18);
}

function scoreByAxisKeywords(text, axis, base = 3) {
  const keywords = axisKeywords(axis);
  const keywordScore = addKeywordScore(text, keywords, 0.9);

  return Math.round(clamp(base + keywordScore + Math.min(text.length / 160, 2) + stableNoise(text) * 0.25));
}

function fallbackCustomAxisScore(text, axisConfig) {
  return {
    x: scoreByAxisKeywords(text, axisConfig.x),
    y: scoreByAxisKeywords(text, axisConfig.y),
    z: scoreByAxisKeywords(text, axisConfig.z),
  };
}

function fallbackReligionScore(text) {
  const xWords = ["救い", "心", "支え", "祈り", "信じ", "神", "苦しみ", "不安"];
  const yWords = ["政治", "制度", "社会", "共同体", "教育", "戦争", "対立", "カルト", "宗教二世", "被害"];
  const zWords = ["精神", "超越", "死", "愛", "瞑想", "意識", "成長", "自己理解", "死生観"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.1) + Math.min(text.length / 130, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
}

function fallbackDemocracyScore(text) {
  const xWords = ["投票", "選挙", "民意", "世論", "参加", "国民", "市民", "声"];
  const yWords = ["熟議", "対話", "制度", "多数決", "少数派", "分断", "合意", "構造", "限界"];
  const zWords = ["AI", "SNS", "広聴", "ブロードリスニング", "未来", "アップデート", "可視化", "参加型"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.15) + Math.min(text.length / 140, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
}

function fallbackRomanceScore(text) {
  const xWords = ["好き", "愛", "寂し", "安心", "承認", "モテ", "愛され", "感情", "欲望"];
  const yWords = ["結婚", "生活", "距離感", "相性", "マッチング", "アプリ", "男女", "束縛", "パートナー"];
  const zWords = ["自己理解", "成長", "癒し", "成熟", "自由", "自分らしく", "依存", "関係性"];

  return {
    x: Math.round(clamp(3 + addKeywordScore(text, xWords, 1.1) + stableNoise(text) * 0.3)),
    y: Math.round(clamp(3 + addKeywordScore(text, yWords, 1.1) + Math.min(text.length / 130, 2))),
    z: Math.round(clamp(3 + addKeywordScore(text, zWords, 1.2) + Math.min(text.length / 150, 2))),
  };
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

function scoreOpinion(text, sampleKey, axisConfig) {
  const key = text.trim();
  const sample = samples[sampleKey];

  if (axisConfig?.presetKey === "themeDefault" && sample?.userOpinion?.text === key) {
    return withScoreMeta(sample.userOpinion.score, key, sampleKey, axisConfig, true);
  }

  const matchedOpinion = sample?.externalOpinions?.find((item) => item.text === key);

  if (axisConfig?.presetKey === "themeDefault" && matchedOpinion) {
    return withScoreMeta(matchedOpinion.score, key, sampleKey, axisConfig, true);
  }

  return withScoreMeta(fallbackScore(key, sampleKey, axisConfig), key, sampleKey, axisConfig);
}

function scoreFromRow(row) {
  return {
    x: Number(row?.x) || 0,
    y: Number(row?.y) || 0,
    z: Number(row?.z) || 0,
  };
}

function calculateAxisDistribution(rows, axis) {
  const values = rows
    .map((row) => Math.round(Number(row?.absoluteScore?.[axis] ?? row?.[axis]) || 0))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      standardDeviation: 0,
      uniqueScoreCount: 0,
      mostCommonScore: 0,
      mostCommonScoreRatio: 0,
      concentrated: false,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
  const counts = values.reduce((map, value) => {
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
  const [mostCommonScore, mostCommonCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostCommonScoreRatio = mostCommonCount / values.length;
  const standardDeviation = Math.sqrt(variance);
  const uniqueScoreCount = counts.size;
  const concentrated =
    standardDeviation < 0.7 || uniqueScoreCount <= 3 || mostCommonScoreRatio >= 0.6 || max - min <= 2;

  return {
    min,
    max,
    average,
    standardDeviation,
    uniqueScoreCount,
    mostCommonScore,
    mostCommonScoreRatio,
    concentrated,
  };
}

function calculateScoreDistribution(rows) {
  return {
    x: calculateAxisDistribution(rows, "x"),
    y: calculateAxisDistribution(rows, "y"),
    z: calculateAxisDistribution(rows, "z"),
  };
}

function normalizeRelativeScores(rows) {
  const ranges = ["x", "y", "z"].reduce((acc, axis) => {
    const values = rows.map((row) => Number(row.absoluteScore?.[axis]) || 0);
    acc[axis] = {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
    return acc;
  }, {});

  return rows.map((row) => {
    const relativeScore = ["x", "y", "z"].reduce((score, axis) => {
      const { min, max } = ranges[axis];
      const value = Number(row.absoluteScore?.[axis]) || 0;
      score[axis] = max === min ? 5 : Math.round(clamp(1 + (9 * (value - min)) / (max - min)));
      return score;
    }, {});

    return {
      ...row,
      relativeScore,
    };
  });
}

function hasConcentratedScoreDistribution(scoreDistribution) {
  return ["x", "y", "z"].some((axis) => scoreDistribution?.[axis]?.concentrated);
}

function selectDisplayScoreMode(scoreDisplayMode, scoreDistribution) {
  if (scoreDisplayMode === "absolute" || scoreDisplayMode === "relative") {
    return scoreDisplayMode;
  }

  return hasConcentratedScoreDistribution(scoreDistribution) ? "relative" : "absolute";
}

function applyDisplayScores(rows, mode) {
  return rows.map((row) => {
    const absoluteScore = axisScoreOnly(row.absoluteScore || scoreFromRow(row));
    const relativeScore = axisScoreOnly(row.relativeScore || absoluteScore);
    const displayScore = mode === "relative" ? relativeScore : absoluteScore;

    return {
      ...row,
      absoluteScore,
      relativeScore,
      displayScore,
      x: displayScore.x,
      y: displayScore.y,
      z: displayScore.z,
    };
  });
}

function getScoreForDisplay(row, axis, mode = "auto") {
  if (mode === "absolute") {
    return Number(row?.absoluteScore?.[axis] ?? row?.[axis]) || 0;
  }

  if (mode === "relative") {
    return Number(row?.relativeScore?.[axis] ?? row?.[axis]) || 0;
  }

  return Number(row?.displayScore?.[axis] ?? row?.[axis]) || 0;
}

function getScoreTripletForDisplay(row, mode = "auto") {
  return ["x", "y", "z"].map((axis) => getScoreForDisplay(row, axis, mode)).join("/");
}

function firstPositiveNumber(values, fallback = 1) {
  const value = values.find((item) => Number.isFinite(Number(item)) && Number(item) > 0);
  return value ? Number(value) : fallback;
}

function clusterVolumeFromRow(row) {
  const memberIdCount = Array.isArray(row?.memberIds) ? row.memberIds.length : null;
  const itemCount = Array.isArray(row?.items) ? row.items.length : null;
  const memberRowCount = Array.isArray(row?.memberRows) ? row.memberRows.length : null;
  const independent = firstPositiveNumber(
    [row?.independentOpinionVolume, row?.uniqueCount, row?.uniqueNormalizedTextCount, memberRowCount, memberIdCount, itemCount, row?.count],
    1
  );
  const graph = firstPositiveNumber([row?.volumeForGraph, independent], independent);
  const weighted = firstPositiveNumber(
    [row?.spreadVolume, row?.volume?.weighted, row?.volumeWeighted, row?.originalCount, row?.duplicateCount, row?.count],
    graph
  );

  return {
    raw: graph,
    weighted,
    independent,
    spread: weighted,
    graph,
  };
}

function withClusterVolume(row) {
  const volume = clusterVolumeFromRow(row);
  return {
    ...row,
    independentOpinionVolume: volume.independent,
    spreadVolume: volume.spread,
    volumeForGraph: volume.graph,
    volume,
  };
}

function clusterVolumeDomain(rows) {
  const volumes = rows.filter((row) => row.group === "cluster").map((row) => clusterVolumeFromRow(row).raw);

  if (volumes.length === 0) {
    return { min: 1, max: 1 };
  }

  return {
    min: Math.min(...volumes),
    max: Math.max(...volumes),
  };
}

function normalizeClusterVolume(row, domain) {
  const volume = clusterVolumeFromRow(row).raw;

  if (!domain || domain.max === domain.min) {
    return 0.5;
  }

  return clamp((volume - domain.min) / (domain.max - domain.min), 0, 1);
}

function markerSizeForVolume(row, domain) {
  if (row.group !== "cluster") {
    return null;
  }

  if (!domain || domain.max === domain.min) {
    return 14;
  }

  return 8 + normalizeClusterVolume(row, domain) * 28;
}

function scoreDisplayModeLabel(mode = "auto") {
  if (mode === "absolute") return "絶対スコア";
  if (mode === "relative") return "相対スコア";
  return "表示スコア";
}

function scoreAxisHeader(axisLabelText, mode = "auto") {
  const axisName = String(axisLabelText || "").split(/[：:]/)[0] || axisLabelText;
  return `${axisName}（${scoreDisplayModeLabel(mode).replace("スコア", "")}）`;
}

function buildAxisQualityWarnings(axisConfig) {
  const categoryPairs = [
    ["男性", "女性"],
    ["男", "女"],
    ["賛成", "反対"],
    ["保守", "リベラル"],
    ["右派", "左派"],
    ["個人", "社会"],
  ];

  return ["x", "y", "z"].flatMap((axis) => {
    const config = axisConfig?.[axis] || {};
    const label = String(config.label || "").trim();
    const high = String(config.description || config.highDescription || "").trim();
    const low = String(config.lowDescription || "").trim();
    const warnings = [];

    if (label.length <= 1) {
      warnings.push(`${axis.toUpperCase()}軸は軸名が短く、意図が伝わりにくい可能性があります。`);
    }
    if (!high) {
      warnings.push(`${axis.toUpperCase()}軸は「高い説明」が未入力です。`);
    }
    if (!low) {
      warnings.push(`${axis.toUpperCase()}軸は「低い説明」が未入力です。`);
    }

    const categoryLike = categoryPairs.some(([a, b]) => high.includes(a) && low.includes(b));
    if (categoryLike || /差|分類|タイプ|属性/.test(label)) {
      warnings.push(
        `${axis.toUpperCase()}軸「${label || "-"}」は、強弱ではなくカテゴリ分類になっている可能性があります。高い=その特徴が強い、低い=その特徴が弱い形にすると安定します。`
      );
    }

    return warnings;
  });
}

function inferLowAxisDescription(highDescription, axisLabelText = "") {
  const high = String(highDescription || "").trim();
  const label = String(axisLabelText || "").trim();
  if (!high && !label) {
    return "";
  }

  return `${label || "この観点"}が弱い、または反対方向の価値観を重視する意見ほど低い。`;
}

const EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED = { x: false, y: false, z: false };

function QueryReviewChips({ values, emptyLabel = "なし", className = "" }) {
  const cleanValues = uniqueValues(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter((value) => value && !looksLikeMojibake(value))
  );

  if (!cleanValues.length) {
    return <span className="query-review-empty">{emptyLabel}</span>;
  }

  return (
    <div className={`query-review-chip-list ${className}`.trim()}>
      {cleanValues.map((value) => (
        <span key={value} className="query-review-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function normalizeOpinionText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeMojibake(text) {
  return /邵ｺ|郢・|陝・|陋ｻ|雎・|隰ｨ|髴・|陞｢|隴・|陷ｿ|驕・|郢ｧ|髫・|闔ｨ|鬨ｾ|隲ｱ|騾ｶ|髫ｲ|闕ｳ|讎・|縺|繝|蜿|諱|譚|螢|隕|\uFFFD|・ｮ|・ｽ/.test(String(text || ""));
}

function safeRuntimeText(value, mode = "user") {
  const text = String(value || "");
  if (!looksLikeMojibake(text)) return text;
  return mode === "developer" ? "文字化け検出: 文字化けの可能性があるため非表示" : "文字化けの可能性があるため非表示";
}

function gateAnalysisMarkdown(markdown, mode = "user") {
  const lines = String(markdown || "").split("\n");
  return lines
    .map((line, index) => {
      if (!looksLikeMojibake(line)) return line;
      return mode === "developer"
        ? `- 文字化け検出（行${index + 1}）: 文字化けの可能性があるため非表示`
        : "文字化けの可能性があるため非表示";
    })
    .join("\n");
}

function hideMojibakeQuery(value) {
  const text = String(value || "");
  return looksLikeMojibake(text) ? "文字化けのため非表示" : text;
}

function migrateStageLogFromMojibake(stage = {}) {
  const queryFields = ["query", "rawQuery", "safeQuery", "fallbackQuery", "finalQueryForXApi", "beforeQuery", "afterQuery"];
  const nextStage = { ...stage };
  queryFields.forEach((field) => {
    if (field in nextStage) {
      nextStage[field] = hideMojibakeQuery(nextStage[field]);
    }
  });
  nextStage.queryBuildWarnings = [
    ...(Array.isArray(stage.queryBuildWarnings) ? stage.queryBuildWarnings.filter((warning) => !looksLikeMojibake(warning)) : []),
    ...(queryFields.some((field) => looksLikeMojibake(stage[field])) ? ["文字化けしたクエリを非表示にしました。"] : []),
  ];
  return nextStage;
}

function migrateAppStateFromMojibake(state = {}) {
  const datasets = (Array.isArray(state.datasets) ? state.datasets : []).map((dataset) => {
    const themeCategory = getThemeCategory(dataset.sampleKey || "", dataset.theme || "", dataset.userOpinion || "");
    const personaMode = dataset.personaMode || "dev";
    const analysisPurposeMode = normalizeAnalysisPurposeMode(dataset.analysisPurposeMode, personaMode);
    const cleanQueryCandidates = (Array.isArray(dataset.queryCandidates) ? dataset.queryCandidates : []).filter(
      (candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.note || ""} ${candidate?.base || ""} ${candidate?.query || ""}`)
    );
    const fallbackCandidates =
      cleanQueryCandidates.length > 0
        ? cleanQueryCandidates
        : personaMode === "personaA" && themeCategory === "romance"
          ? getPersonaAQueryCandidates(dataset.selectedVoiceDirections || purposeVoiceDirections(analysisPurposeMode, personaMode), analysisPurposeMode)
          : getThemeQueryCandidates(dataset.theme || "", themeCategory, samples[dataset.sampleKey] || samples.housing);

    return {
      ...dataset,
      appVersion: APP_VERSION,
      analysisPurposeMode,
      selectedVoiceDirections: normalizeVoiceDirections(dataset.selectedVoiceDirections || DEFAULT_PERSONA_A_VOICE_DIRECTIONS),
      selectedQueryCandidateIds: (Array.isArray(dataset.selectedQueryCandidateIds) ? dataset.selectedQueryCandidateIds : []).filter((item) => !looksLikeMojibake(item)),
      selectedQueryCandidateLabels: (Array.isArray(dataset.selectedQueryCandidateLabels) ? dataset.selectedQueryCandidateLabels : []).filter((item) => !looksLikeMojibake(item)),
      query: looksLikeMojibake(dataset.query) ? "" : dataset.query,
      manualQuery: looksLikeMojibake(dataset.manualQuery) ? "" : dataset.manualQuery,
      effectiveQuery: looksLikeMojibake(dataset.effectiveQuery) ? "" : dataset.effectiveQuery,
      queryCandidates: fallbackCandidates,
      stagedFetchStageLogs: (Array.isArray(dataset.stagedFetchStageLogs) ? dataset.stagedFetchStageLogs : []).map(migrateStageLogFromMojibake),
      improvedQueryCandidates: (Array.isArray(dataset.improvedQueryCandidates) ? dataset.improvedQueryCandidates : []).filter(
        (candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.base || ""} ${candidate?.query || ""}`)
      ),
      clusterRuns: (Array.isArray(dataset.clusterRuns) ? dataset.clusterRuns : []).map((run) => ({
        ...run,
        clusters: Array.isArray(run.clusters) ? run.clusters : [],
      })),
    };
  });

  return { ...state, appVersion: APP_VERSION, datasets };
}

function stripRtPrefix(text) {
  return normalizeOpinionText(text).replace(/^rt\s+@[A-Za-z0-9_]+:?\s*/i, "").trim();
}

function stripUrls(text) {
  return normalizeOpinionText(text)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/(?:^|\s)t\.co\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasUrl(text) {
  const normalizedText = normalizeOpinionText(text).toLowerCase();

  return (
    normalizedText.includes("http://") ||
    normalizedText.includes("https://") ||
    normalizedText.includes("t.co/")
  );
}

function isRetweetLike(text) {
  const normalizedText = normalizeOpinionText(text);
  const lowerText = normalizedText.toLowerCase();

  return lowerText.startsWith("rt @") || normalizedText.includes("RT @");
}

function isTooShortOpinion(text) {
  return normalizeOpinionText(text).length < 20;
}

function includesAnyKeyword(text, keywords) {
  const normalizedText = String(text || "").toLowerCase();
  return keywords.some((keyword) => normalizedText.includes(String(keyword).toLowerCase()));
}

function detectNoiseCategory(text) {
  const normalizedText = normalizeOpinionText(text);
  const compactText = normalizedText.replace(/\s+/g, "");

  if (!normalizedText) {
    return { noiseCategory: "url_only_or_too_short", noiseReason: "本文が空、またはURL除去後に内容が残っていません。" };
  }

  if (GENERIC_QUERY_TERMS.includes(compactText) || (compactText.length <= 8 && includesAnyKeyword(compactText, GENERIC_QUERY_TERMS))) {
    return { noiseCategory: "broad_keyword_noise", noiseReason: "一般語だけでテーマとの具体的な接点が弱い投稿です。" };
  }

  if (
    includesAnyKeyword(normalizedText, [
      "小説",
      "ライトノベル",
      "漫画",
      "マンガ",
      "登場人物",
      "キャラクター",
      "創作",
      "あらすじ",
      "ネタバレ",
      "二次創作",
      "作品紹介",
    ])
  ) {
    return { noiseCategory: "fiction_or_fan_content", noiseReason: "創作・作品紹介・ファン文脈に寄った投稿です。" };
  }

  if (includesAnyKeyword(normalizedText, ["ペット", "犬", "猫", "庭", "園芸", "ガーデン", "観葉植物", "家庭菜園"])) {
    return { noiseCategory: "personal_daily_life", noiseReason: "ペット・庭・園芸など日常紹介に寄った投稿です。" };
  }

  if (
    includesAnyKeyword(normalizedText, [
      "ゲーム",
      "アニメ",
      "ガチャ",
      "カード",
      "競馬",
      "ウマ娘",
      "スポーツ選手",
      "選手",
      "実況",
    ])
  ) {
    return { noiseCategory: "game_anime_entertainment", noiseReason: "ゲーム・アニメ・娯楽・競技文脈に寄った投稿です。" };
  }

  if (includesAnyKeyword(normalizedText, ["試合", "大会", "リーグ", "野球", "サッカー", "バスケ", "競技", "イベント"])) {
    return { noiseCategory: "sports_or_event", noiseReason: "スポーツ・イベント文脈に寄った投稿です。" };
  }

  if (
    includesAnyKeyword(normalizedText, [
      "PR",
      "広告",
      "商品紹介",
      "セール",
      "送料無料",
      "購入",
      "販売",
      "レビュー",
      "革製品",
      "バッグ",
      "財布",
      "診断",
      "占い",
      "ブログ更新",
    ])
  ) {
    return { noiseCategory: "promotion_or_ad", noiseReason: "商品PR・広告・外部誘導に寄った投稿です。" };
  }

  if (includesAnyKeyword(normalizedText, ["バッグ", "財布", "革製品", "購入", "販売", "レビュー", "買った", "おすすめ商品"])) {
    return { noiseCategory: "product_or_shopping", noiseReason: "商品・買い物・レビュー文脈に寄った投稿です。" };
  }

  if (includesAnyKeyword(normalizedText, ["ログインエラー", "サーバーエラー", "アプリ エラー", "システム障害", "バグ", "障害情報"])) {
    return { noiseCategory: "system_error_other_domain", noiseReason: "別分野のシステムエラー・障害文脈です。" };
  }

  if (includesAnyKeyword(normalizedText, ["今日の", "おはよう", "日記", "ランチ", "寝る", "疲れた", "散歩"])) {
    return { noiseCategory: "personal_daily_life", noiseReason: "日常報告に寄った投稿です。" };
  }

  return null;
}

function personaAAllowsSpecialTopic(theme, userOpinion, topicPattern) {
  return topicPattern.test(normalizeOpinionText(`${theme} ${userOpinion}`));
}

function isPersonaAUsableOpinion(text, theme, userOpinion) {
  const normalizedText = normalizeOpinionText(text);
  const compactText = normalizedText.replace(/\s+/g, "");
  const contextText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const romanceAnchors = [
    "恋愛",
    "彼氏",
    "彼女",
    "好きな人",
    "恋人",
    "パートナー",
    "付き合",
    "片思い",
    "復縁",
    "婚活",
    "結婚",
    "マッチングアプリ",
    "デート",
    "別れ",
    "浮気",
    "両思い",
  ];
  const consultationSignals = [
    "返信",
    "連絡",
    "不安",
    "愛され",
    "安心",
    "寂し",
    "距離感",
    "温度差",
    "重い",
    "依存",
    "嫉妬",
    "信頼",
    "束縛",
    "すれ違",
    "話し合",
    "言えない",
    "気持ち",
    "優先順位",
    "価値観",
    "将来",
    "相性",
    "告白",
    "承認欲求",
    "自己表現",
  ];
  const selfConcernSignals = ["私", "自分", "悩", "相談", "つらい", "苦しい", "怖い", "迷", "どうしたら", "どうすれば"];
  const hasRomanceAnchor = includesAnyKeyword(normalizedText, romanceAnchors);
  const consultationHitCount = consultationSignals.filter((word) => normalizedText.includes(word)).length;
  const selfConcernHitCount = selfConcernSignals.filter((word) => normalizedText.includes(word)).length;
  const themeRequestsSpirituality = personaAAllowsSpecialTopic(theme, userOpinion, /スピリチュアル|ツインソウル|ツインレイ|運命|占い|星座|信仰|精神/i);
  const themeRequestsFandom = personaAAllowsSpecialTopic(theme, userOpinion, /推し|アイドル|芸能|有名人|二次創作|作品|ファン|ブルーロック|アニメ|漫画|ゲーム/i);

  const exclusionRules = [
    {
      category: "fandom_not_romance_consultation",
      pattern: /ブルーロック|アニメ|漫画|マンガ|ゲーム|キャラ|カップリング|二次創作|同人|作品|ネタバレ|推しカプ|BL|CP/i,
      allowed: themeRequestsFandom,
    },
    {
      category: "celebrity_or_idol_topic",
      pattern: /アイドル|推し|芸能人|俳優|女優|声優|熱愛報道|匂わせ|ファン/i,
      allowed: themeRequestsFandom && selfConcernHitCount > 0,
    },
    {
      category: "fortune_telling",
      pattern: /占い|星座|運勢|今日の恋愛運|恋愛運|タロット|鑑定/i,
      allowed: themeRequestsSpirituality,
    },
    {
      category: "spirituality_not_requested",
      pattern: /ツインソウル|ツインレイ|ツインフレーム|魂の伴侶|運命の人|スピリチュアル|前世/i,
      allowed: themeRequestsSpirituality,
    },
    {
      category: "political_or_historical_topic",
      pattern: /田中角栄|政治|総理|首相|議員|選挙|歴史|家系|派閥|政党/i,
      allowed: false,
    },
    {
      category: "advertisement_or_promotion",
      pattern: /PR|無料相談|無料鑑定|公式LINE|LINE登録|副業|講座|コーチング|キャンペーン|業者|勧誘|モニター募集/i,
      allowed: false,
    },
    {
      category: "adult_or_solicitation",
      pattern: /アダルト|パパ活|セフレ|援交|出会い系|成人向け|エロ|性的サービス/i,
      allowed: false,
    },
    {
      category: "generic_self_help",
      pattern: /心理学|自己啓発|本|書籍|読書|貸した|名言|人生論|メンタル/i,
      allowed: hasRomanceAnchor && consultationHitCount > 0,
    },
  ];
  const matchedExclusion = exclusionRules.find((rule) => rule.pattern.test(normalizedText) && !rule.allowed);

  if (matchedExclusion) {
    return {
      keep: false,
      relevanceCategory: matchedExclusion.category,
      exclusionReason: matchedExclusion.category,
      confidence: 0.95,
    };
  }

  if (!hasRomanceAnchor) {
    return {
      keep: false,
      relevanceCategory: "weak_relationship_relevance",
      exclusionReason: "weak_relationship_relevance",
      confidence: 0.35,
    };
  }

  const confidence = clamp(
    0.35 + consultationHitCount * 0.16 + selfConcernHitCount * 0.1 + (compactText.length >= 35 ? 0.08 : 0),
    0,
    0.98
  );

  if (consultationHitCount >= 2 || (consultationHitCount >= 1 && selfConcernHitCount >= 1) || confidence >= 0.68) {
    return {
      keep: true,
      relevanceCategory: "romance_consultation",
      exclusionReason: null,
      confidence,
    };
  }

  return {
    keep: false,
    relevanceCategory: "weak_relationship_relevance",
    exclusionReason: "weak_relationship_relevance",
    confidence,
  };
}

function applyPersonaAStrictRelevance(candidateRows, { enabled, theme, userOpinion } = {}) {
  if (!enabled) {
    return {
      enabled: false,
      candidateRows: Array.isArray(candidateRows) ? candidateRows : [],
      excludedRows: [],
      borderlineRows: [],
      exclusionCounts: {},
      referenceDisplay: false,
    };
  }

  const keptRows = [];
  const excludedRows = [];
  const borderlineRows = [];

  (Array.isArray(candidateRows) ? candidateRows : []).forEach((row) => {
    const judgement = isPersonaAUsableOpinion(row.normalizedText || row.processedText || row.opinion, theme, userOpinion);
    const enrichedRow = {
      ...row,
      personaARelevanceCategory: judgement.relevanceCategory,
      personaARelevanceConfidence: judgement.confidence,
      personaAExclusionReason: judgement.exclusionReason,
    };

    if (judgement.keep) {
      keptRows.push(enrichedRow);
      return;
    }

    if (judgement.confidence < 0.68 || judgement.exclusionReason === "weak_relationship_relevance") {
      borderlineRows.push({
        ...enrichedRow,
        borderlineReason: "Persona Aでは恋愛相談として自然に読める投稿だけを残すため、曖昧な投稿はユーザー表示から外しました。",
      });
    } else {
      excludedRows.push(enrichedRow);
    }
  });

  const allExcludedRows = [...excludedRows, ...borderlineRows];
  const exclusionCounts = allExcludedRows.reduce((counts, row) => {
    const category = row.personaAExclusionReason || row.personaARelevanceCategory || "weak_relationship_relevance";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  return {
    enabled: true,
    candidateRows: keptRows,
    excludedRows,
    borderlineRows,
    allExcludedRows,
    exclusionCounts,
    referenceDisplay: keptRows.length < 10,
  };
}

function buildNoiseReasonCounts(excludedRows) {
  return (Array.isArray(excludedRows) ? excludedRows : []).reduce((counts, row) => {
    const category = row.noiseCategory || "low_relevance";
    counts[category] = (counts[category] || 0) + (Number(row.noiseCount) || 1);
    return counts;
  }, {});
}

function formatNoiseReasonCounts(counts) {
  const entries = Object.entries(counts || {});
  if (entries.length === 0) {
    return "なし";
  }

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
    .join(" / ");
}

function createInitialStagedFetchState() {
  return {
    enabled: true,
    targetCount: 100,
    stageSize: STAGED_FETCH_INITIAL_COUNT,
    currentStage: 0,
    stageLogs: [],
    fetchedCount: 0,
    totalFetchedCount: 0,
    currentBatchCount: 0,
    accumulatedCount: 0,
    currentDataCount: 0,
    totalApiFetchedCount: 0,
    remainingCount: 100,
    nextFetchCount: STAGED_FETCH_INITIAL_COUNT,
    initialFetchCount: 0,
    diagnosisStatus: "idle",
    shouldPause: false,
    diagnosis: null,
    noiseBreakdown: [],
    queryTermDiagnosis: [],
    aiQueryAdvice: null,
    improvementComparison: null,
    improvedQueryCandidates: [],
    selectedImprovedQueryIndexes: [0],
    recommendedQuery: "",
    diagnosisDecision: "",
    lastAction: "",
    beforeQuery: "",
    afterQuery: "",
    improvedRefetchCount: 0,
    improvedAddFetchCount: 0,
    continueRemainingCount: 0,
    weakNoiseRetryAvailable: false,
    message: "未実行",
  };
}

function detectGenericKeywordWarnings(query, theme, userOpinion) {
  const source = stripXCommonFilters(query);
  const themeText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const tokens = source
    .split(/\s+OR\s+|\s+|\(|\)|　/gi)
    .map((token) => token.trim())
    .filter(Boolean);

  return uniqueValues(
    tokens.filter((token) => GENERIC_QUERY_TERMS.includes(token) && !themeText.includes(token))
  ).map((term) => `「${term}」が単独汎用語として使われています。テーマ語と組み合わせてください。`);
}

function splitQueryTerms(query) {
  return stripXCommonFilters(query)
    .replace(/[()]/g, " ")
    .split(/\s+OR\s+/i)
    .map((term) => term.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function diagnoseQueryTerms(query, theme, userOpinion) {
  const themeText = normalizeOpinionText(`${theme} ${userOpinion}`);
  const terms = splitQueryTerms(query);
  const broadTerms = ["投票", "SNS", "エラー", "構造", "制度", "相談", "体験", "意見", "学習", "教育", "成長", "変化", "不安"];

  return terms.map((term) => {
    const normalized = normalizeOpinionText(term);
    const compact = normalized.replace(/\s+/g, "");
    const isBroad = broadTerms.includes(compact) || GENERIC_QUERY_TERMS.includes(compact);
    const isThemeBound = themeText.includes(compact) || normalized.includes(" ") || normalized.length >= 6;

    if (isBroad && !isThemeBound) {
      return {
        term,
        status: "too_broad",
        problem: "単独では広すぎる検索語です。",
        advice: `「${term}」をテーマ語と組み合わせてください。`,
        action: "narrow_with_and",
        suggestion: `${extractFallbackKeywords(theme, userOpinion)[0] || theme} ${term}`,
      };
    }

    if (/投票|SNS|エラー|構造|制度/.test(compact) && !normalized.includes(" ")) {
      return {
        term,
        status: "collision",
        problem: "別文脈の投稿も拾いやすい多義語です。",
        advice: `「${term}」だけでなく、政治・テーマ語を足して絞ってください。`,
        action: "narrow_with_and",
        suggestion: `${extractFallbackKeywords(theme, userOpinion)[0] || theme} ${term}`,
      };
    }

    if (normalized.length <= 2 && !themeText.includes(compact)) {
      return {
        term,
        status: "thin",
        problem: "短すぎて検索意図が伝わりにくい語です。",
        advice: "周辺語を追加するか、削除を検討してください。",
        action: "add_theme_word",
        suggestion: `${term} ${extractFallbackKeywords(theme, userOpinion)[0] || ""}`.trim(),
      };
    }

    return {
      term,
      status: "ok",
      problem: "テーマに比較的近い検索語です。",
      advice: "この語は残してよさそうです。",
      action: "keep",
      suggestion: term,
    };
  });
}

function noiseCategoryAdvice(category) {
  const advice = {
    promotion_or_ad: "PR、キャンペーン、紹介、無料、登録などを除外語に追加してください。",
    duplicate_or_repost: "RT除外を強め、重複本文を1件にまとめてください。",
    spread_template: "定型文・キャンペーン文の拡散です。独立意見数には加算せず、参考値として確認してください。",
    coordinated_campaign_suspected: "同じ呼びかけが集中しています。組織的拡散の可能性があるため、意見ボリュームから切り分けてください。",
    duplicate_like_spread: "末尾違いなどの類似コピー投稿です。1件の意見テンプレートとして圧縮してください。",
    unrelated_topic: "OR条件に広すぎる語が混じっている可能性があります。問題語を削るか、テーマ語と組み合わせてください。",
    broad_keyword_noise: "一般語を単独で使わず、テーマ語とのAND的な組み合わせにしてください。",
    query_term_collision: "多義語を単独で使わず、文脈語を足してください。",
    low_relevance: "検索語をテーマに近い名詞句へ寄せるか、関連度しきい値を一時的に下げて確認してください。",
    url_only_or_too_short: "URL付き投稿除外や短文除外を強めてください。",
  };

  return advice[category] || "該当カテゴリを生む検索語を削るか、テーマ語を足して絞ってください。";
}

function buildNoiseBreakdown(diagnosis) {
  return Object.entries(diagnosis?.noiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: NOISE_CATEGORY_LABELS[category] || category,
      count,
      advice: noiseCategoryAdvice(category),
    }));
}

function buildCombinedNoiseReasonCounts(stats) {
  const counts = { ...(stats?.noiseReasonCounts || {}) };
  const duplicateLikeCount = (Number(stats?.duplicateCount) || 0) + (Number(stats?.retweetLikeCount) || 0);
  const spreadTemplateCount = Number(stats?.spreadTemplateCount) || 0;
  const shortOrUrlOnlyCount =
    (Number(stats?.tooShortCount) || 0) +
    Math.max(0, (Number(stats?.urlCount) || 0) - (Number(stats?.urlTextRemainingCount) || 0));

  if (duplicateLikeCount > 0) {
    counts.duplicate_or_repost = (counts.duplicate_or_repost || 0) + duplicateLikeCount;
  }
  if (spreadTemplateCount > 0) {
    counts.spread_template = (counts.spread_template || 0) + spreadTemplateCount;
  }
  if (shortOrUrlOnlyCount > 0) {
    counts.url_only_or_too_short = (counts.url_only_or_too_short || 0) + shortOrUrlOnlyCount;
  }

  return counts;
}

function buildRecommendedNextActions(noiseBreakdown, queryTermDiagnosis, diagnosis) {
  const actions = [];
  const topNoise = noiseBreakdown?.[0];
  const weakTerms = (queryTermDiagnosis || []).filter((item) => item.status !== "ok");

  if (topNoise) {
    actions.push(`${topNoise.label}が多いです。${topNoise.advice}`);
  }
  if (weakTerms.length > 0) {
    actions.push(`検索語「${weakTerms[0].term}」を見直してください。${weakTerms[0].advice}`);
  }
  if ((diagnosis?.analysisCandidateCount || 0) < 5) {
    actions.push("分析対象が5件未満です。改善クエリで追加取得してからクラスタリングしてください。");
  }
  if (actions.length === 0) {
    actions.push("このクエリのまま追加取得できます。必要に応じて改善候補も比較してください。");
  }

  return actions;
}

function diagnoseQueryQuality(
  posts,
  query,
  sampleKey,
  axisConfig,
  noiseFilterEnabled,
  theme,
  userOpinion,
  relevanceThreshold = NOISE_RELEVANCE_THRESHOLD
) {
  const texts = (Array.isArray(posts) ? posts : [])
    .map((post) => String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const stats = buildNoiseProcessingResult(texts, sampleKey, axisConfig, noiseFilterEnabled, relevanceThreshold);
  const diagnosticClusters = clusterOpinionsByText(stats.candidateRows || [], 0.35).map((cluster, index) =>
    makeClusterRepresentative(cluster, index, sampleKey, axisConfig)
  );
  const diagnosticScoreDistribution = calculateScoreDistribution(diagnosticClusters);
  const retrievalKpi = buildRetrievalKpi(stats, diagnosticClusters, diagnosticScoreDistribution);
  const normalizedCount = stats.uniqueNormalizedCount || 0;
  const fetchedCount = texts.length;
  const duplicateRate = fetchedCount > 0 ? stats.duplicateCount / fetchedCount : 0;
  const noiseCount = stats.noiseExcludedCount || 0;
  const noiseRate = normalizedCount > 0 ? noiseCount / normalizedCount : 0;
  const analysisCandidateCount = stats.analysisTargetCount || stats.candidateCount || 0;
  const candidateRate = normalizedCount > 0 ? analysisCandidateCount / normalizedCount : 0;
  const independentOpinionCount = stats.independentOpinionCount || analysisCandidateCount;
  const independentOpinionRate = fetchedCount > 0 ? independentOpinionCount / fetchedCount : 0;
  const spreadReferenceCount = stats.spreadReferenceCount || duplicateLikeCount;
  const spreadDominanceRate = fetchedCount > 0 ? spreadReferenceCount / fetchedCount : 0;
  const scoredRows = [...(stats.candidateRows || []), ...(stats.noiseExcludedRows || [])];
  const relevanceGoodCount = scoredRows.filter((row) => Number(row.relevanceScore) >= 5).length;
  const relevanceWeakCount = scoredRows.filter((row) => Number(row.relevanceScore) >= 3 && Number(row.relevanceScore) <= 4).length;
  const relevanceBadCount = scoredRows.filter((row) => Number(row.relevanceScore) <= 2).length;
  const genericKeywordWarnings = detectGenericKeywordWarnings(query, theme, userOpinion);
  const combinedNoiseReasonCounts = buildCombinedNoiseReasonCounts(stats);
  const noiseBreakdown = buildNoiseBreakdown({ noiseReasonCounts: combinedNoiseReasonCounts });
  const queryTermDiagnosis = diagnoseQueryTerms(query, theme, userOpinion);
  const weakQueryTermWarnings = queryTermDiagnosis
    .filter((item) => item.status !== "ok")
    .map((item) => `検索語「${item.term}」: ${item.problem} ${item.advice}`);
  const dominantNoiseCategories = Object.entries(combinedNoiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({
      category,
      label: NOISE_CATEGORY_LABELS[category] || category,
      count,
    }));

  let status = "good";
  if (
    analysisCandidateCount <= 7 ||
    candidateRate < 0.3 ||
    noiseRate >= 0.65 ||
    analysisCandidateCount === 0
  ) {
    status = "bad";
  } else if (
    analysisCandidateCount <= 14 ||
    candidateRate < 0.5 ||
    noiseRate >= 0.4 ||
    genericKeywordWarnings.length > 0 ||
    weakQueryTermWarnings.length > 0
  ) {
    status = "warning";
  }

  const problemReasons = [];
  if (analysisCandidateCount <= 14) {
    problemReasons.push(`分析対象に残った投稿が${analysisCandidateCount}件です。`);
  }
  if (candidateRate < 0.5) {
    problemReasons.push(`正規化後の候補率が${formatPercent(candidateRate)}です。`);
  }
  if (noiseRate >= 0.4) {
    problemReasons.push(`ノイズ率が${formatPercent(noiseRate)}です。`);
  }
  if (independentOpinionRate < 0.15 && fetchedCount > 0) {
    problemReasons.push(`独立意見率が${formatPercent(independentOpinionRate)}です。独立した意見の種類は少なめです。`);
  }
  if (spreadDominanceRate >= 0.25) {
    problemReasons.push(`拡散支配率が${formatPercent(spreadDominanceRate)}です。RT・類似テンプレートを世論量として扱わないでください。`);
  }
  if ((stats.spreadTemplateCount || 0) > 0) {
    problemReasons.push(`拡散テンプレートを${stats.spreadTemplateCount}件検出しました。`);
  }
  if (genericKeywordWarnings.length > 0) {
    problemReasons.push(...genericKeywordWarnings);
  }
  if (weakQueryTermWarnings.length > 0) {
    problemReasons.push(...weakQueryTermWarnings);
  }
  if (dominantNoiseCategories.length > 0) {
    problemReasons.push(`主なノイズ: ${dominantNoiseCategories.map((item) => `${item.label}${item.count}件`).join(" / ")}`);
  }
  if (retrievalKpi.overallRetrievalQuality !== "good") {
    problemReasons.push(retrievalKpi.message);
  }
  if (analysisCandidateCount === 0 && noiseFilterEnabled) {
    problemReasons.push("ノイズ除去により分析対象が0件になりました。クエリが広すぎるか、ノイズ除去が強すぎる可能性があります。");
  }

  return {
    status,
    fetchedCount,
    normalizedCount,
    duplicateCount: stats.duplicateCount,
    independentOpinionCount,
    independentOpinionRate,
    spreadReferenceCount,
    spreadDominanceRate,
    spreadTemplateCount: stats.spreadTemplateCount || 0,
    noiseCount,
    analysisCandidateCount,
    relevanceGoodCount,
    relevanceWeakCount,
    relevanceBadCount,
    noiseRate,
    candidateRate,
    duplicateRate,
    retrievalKpi,
    overallRetrievalQuality: retrievalKpi.overallRetrievalQuality,
    genericKeywordWarnings,
    queryTermDiagnosis,
    noiseBreakdown,
    recommendedNextActions: buildRecommendedNextActions(noiseBreakdown, queryTermDiagnosis, {
      analysisCandidateCount,
    }),
    dominantNoiseCategories,
    problemReasons,
    noiseReasonCounts: combinedNoiseReasonCounts,
    noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
    relevanceThreshold,
    sampleTexts: texts.slice(0, 5),
    sampleKeptPosts: (stats.candidateRows || []).slice(0, 5).map((row) => row.normalizedText || row.opinion || ""),
    sampleNoisePosts: (stats.noiseExcludedRows || []).slice(0, 5).map((row) => ({
      text: row.normalizedText || row.opinion || "",
      category: row.noiseCategory || "unknown",
      reason: row.noiseReason || "",
    })),
  };
}

function buildImprovedQueryCandidates(theme, userOpinion, currentQuery, diagnosis, axisConfig) {
  const themeWords = extractFallbackKeywords(theme, userOpinion)
    .filter((word) => !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const axisWords = uniqueValues([
    axisConfig?.x?.label,
    axisConfig?.y?.label,
    axisConfig?.z?.label,
    ...(axisConfig?.x?.description || "").split(/[、。\s]+/),
    ...(axisConfig?.y?.description || "").split(/[、。\s]+/),
    ...(axisConfig?.z?.description || "").split(/[、。\s]+/),
  ])
    .map((word) => String(word || "").trim())
    .filter((word) => word.length >= 2 && !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const baseTheme = themeWords[0] || String(theme || "").trim() || stripXCommonFilters(currentQuery);
  const themeText = `${theme} ${userOpinion} ${currentQuery}`;
  const domainPhrases = [];

  if (/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(themeText)) {
    domainPhrases.push("住宅価格", "住宅ローン", "家賃", "中古住宅", "空き家", "リノベーション", "住宅政策", "長寿命住宅", "資産形成");
  }
  if (/プログラミング|コード|Python|学習|教室|エラー|初心者/.test(themeText)) {
    domainPhrases.push("プログラミング学習", "Python 初心者", "エラー", "つまずき", "コーディング教室", "授業", "学習支援");
  }
  if (/民主主義|政治|選挙|投票|SNS|市民/.test(themeText)) {
    domainPhrases.push("民主主義 SNS", "選挙", "投票", "政治参加", "熟議", "世論", "市民参加");
  }
  if (/宗教|信仰|仏教|神|救い/.test(themeText)) {
    domainPhrases.push("宗教 信仰", "心の支え", "救い", "宗教二世", "カルト", "精神性");
  }

  const concreteTerms = uniqueValues([...domainPhrases, ...themeWords, ...axisWords])
    .filter((word) => word.length >= 2 && !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 8);
  const genericTerms = (diagnosis?.genericKeywordWarnings || [])
    .map((warning) => warning.match(/「(.+?)」/)?.[1])
    .filter(Boolean);
  const noiseLabels = (diagnosis?.dominantNoiseCategories || []).map((item) => item.label).join(" / ") || "ノイズ";
  const candidates = [
    ...(/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(themeText)
      ? [
          {
            label: "生活者の負担",
            query: "住宅価格 OR 住宅ローン OR 家賃 OR 住居費負担 OR 家計",
            reason: "住宅を生活費・負担として語る投稿を拾います。",
          },
          {
            label: "中古・空き家・リノベ",
            query: "中古住宅 OR 空き家 OR リノベーション OR 既存住宅 OR 住宅ストック",
            reason: "新築以外の選択肢や既存住宅活用の投稿を拾います。",
          },
          {
            label: "政策・資産形成",
            query: "住宅政策 OR 長寿命住宅 OR 資産形成 OR 新築費用 OR 住宅資産価値",
            reason: "制度・政策・資産価値の論点を拾います。",
          },
          {
            label: "若者・ローン問題",
            query: "若者 住宅ローン OR 50年ローン OR 住宅 高騰 OR 持ち家 諦めた",
            reason: "若い世代やローン負担に関する声を拾います。",
          },
          {
            label: "賃貸・生活不安",
            query: "家賃 高い OR 賃貸 高騰 OR 住居費 負担 OR 引越し 家賃",
            reason: "賃貸・生活不安の具体的な声を拾います。",
          },
        ]
      : []),
    {
      label: "テーマ語で絞る",
      query: uniqueValues(concreteTerms.slice(0, 5)).join(" OR ") || baseTheme,
      reason: "テーマ本文から取れる具体語を中心にし、広すぎる語を減らします。",
    },
    {
      label: "評価軸語を追加",
      query: uniqueValues([concreteTerms[0] || baseTheme, ...axisWords.slice(0, 4)]).join(" OR "),
      reason: "評価軸と関係する語を入れて、分析対象になりやすい投稿を増やします。",
    },
    {
      label: "悩み・具体体験を拾う",
      query: `${baseTheme} (${uniqueValues([...axisWords.slice(0, 2), "困った", "体験", "相談"]).join(" OR ")})`,
      reason: `主なノイズ（${noiseLabels}）を避け、具体的な体験・意見を拾いやすくします。`,
    },
  ];

  if (genericTerms.length > 0) {
    candidates.unshift({
      label: "汎用語をテーマ語に結合",
      query: uniqueValues(genericTerms.map((term) => `${baseTheme} ${term}`)).join(" OR "),
      reason: "単独汎用語をテーマ語と組み合わせて、無関係投稿の混入を減らします。",
    });
  }

  return candidates
    .map((candidate) => ({
      ...candidate,
      query: stripXCommonFilters(candidate.query).trim(),
    }))
    .filter((candidate) => candidate.query)
    .slice(0, 6);
}

function buildRuleBasedQueryAdvice({
  theme,
  userOpinion,
  currentQuery,
  axisConfig,
  diagnosis,
  noiseBreakdown,
  queryTermDiagnosis,
}) {
  const fallbackCandidates = buildImprovedQueryCandidates(theme, userOpinion, currentQuery, diagnosis, axisConfig);
  const weakTerms = (queryTermDiagnosis || []).filter((item) => item.status !== "ok");
  const topNoise = (noiseBreakdown || [])[0];
  const mainProblems = [
    ...(Array.isArray(diagnosis?.problemReasons) ? diagnosis.problemReasons.slice(0, 3) : []),
    ...(topNoise ? [`${topNoise.label}が${topNoise.count}件あります。${topNoise.advice}`] : []),
    ...(weakTerms.length ? [`検索語「${weakTerms[0].term}」がノイズ源になっている可能性があります。`] : []),
  ];
  const queryTermAdvice = (queryTermDiagnosis || []).map((item) => ({
    term: item.term,
    status: item.status,
    problem: item.problem,
    advice: item.advice,
    suggestion: item.suggestion,
  }));
  const recommendedQuery = fallbackCandidates[0]?.query || stripXCommonFilters(currentQuery);
  const improvedHashtagCandidates = extractFallbackKeywords(theme, userOpinion)
    .slice(0, 5)
    .map((word) => ({
      label: word,
      hashtag: normalizeHashtag(word),
      reason: "テーマ語から作ったハッシュタグ候補です。",
      noiseRisk: "中",
      selectionType: "recommended",
    }));

  return {
    diagnosisSummary:
      diagnosis?.status === "bad"
        ? "取得診断は不調です。検索語が広すぎる、別文脈を拾っている、または分析対象が少なすぎる可能性があります。"
        : diagnosis?.status === "warning"
          ? "取得診断は注意です。分析は可能ですが、ノイズ分類と検索語の見直しで改善できます。"
          : "取得診断は良好です。必要に応じて追加取得へ進めます。",
    mainProblems: uniqueValues(mainProblems).slice(0, 5),
    queryTermAdvice,
    improvedQueryCandidates: fallbackCandidates,
    improvedHashtagCandidates,
    recommendedQuery,
    userMessage:
      weakTerms.length > 0
        ? "広すぎる検索語は単独で使わず、テーマ語と組み合わせて30件を再診断してください。"
        : "上位のノイズ分類を見て、除外語追加またはテーマ語への寄せ直しを試してください。",
    source: "rule_fallback",
  };
}

function buildImprovementComparison(beforeDiagnosis, afterDiagnosis) {
  if (!beforeDiagnosis || !afterDiagnosis) {
    return null;
  }

  const beforeAnalysisCandidateCount = beforeDiagnosis.analysisCandidateCount || 0;
  const afterAnalysisCandidateCount = afterDiagnosis.analysisCandidateCount || 0;
  const beforeNoiseRate = beforeDiagnosis.noiseRate || 0;
  const afterNoiseRate = afterDiagnosis.noiseRate || 0;
  const beforeDuplicateRate = beforeDiagnosis.duplicateRate || 0;
  const afterDuplicateRate = afterDiagnosis.duplicateRate || 0;
  const improved =
    afterAnalysisCandidateCount > beforeAnalysisCandidateCount ||
    (afterAnalysisCandidateCount >= beforeAnalysisCandidateCount && afterNoiseRate < beforeNoiseRate);

  return {
    beforeAnalysisCandidateCount,
    afterAnalysisCandidateCount,
    beforeNoiseRate,
    afterNoiseRate,
    beforeDuplicateRate,
    afterDuplicateRate,
    beforeStatus: beforeDiagnosis.status || "idle",
    afterStatus: afterDiagnosis.status || "idle",
    improved,
    message: improved
      ? "改善クエリで分析対象またはノイズ率が改善しました。"
      : "改善クエリでも十分に改善していません。検索語をさらに具体化するか、ノイズ除去を弱めて再診断してください。",
  };
}

function queryDiagnosisLabel(status) {
  if (status === "checking") return "30件診断中";
  if (status === "good") return "良好";
  if (status === "warning") return "注意";
  if (status === "bad") return "不調・停止中";
  return "未実行";
}

function stagedFetchActionLabel(action) {
  if (action === "initial") return "初回30件診断";
  if (action === "improved_refetch") return "改善クエリで追加取得";
  if (action === "improved_add") return "改善クエリで追加取得";
  if (action === "continue_remaining") return "このクエリのまま残りを追加取得";
  if (action === "continue_add") return "このクエリのまま追加取得";
  if (action === "manual") return "手動修正後取得";
  if (action === "weak_noise_retry") return "ノイズ除去を弱めて再診断";
  if (action === "full_refetch") return "本取得";
  if (action === "auto_user_error") return "自動取得エラー";
  return "通常取得";
}

function normalizeQueryForComparison(query) {
  return stripXCommonFilters(query)
    .replace(/[()]/g, " ")
    .replace(/\s+OR\s+/gi, " OR ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function queriesAreEquivalent(a, b) {
  return normalizeQueryForComparison(a) === normalizeQueryForComparison(b);
}

function mergePostsByText(existingPosts, nextPosts, targetCount = Infinity) {
  const seen = new Set();
  const merged = [];

  [...(existingPosts || []), ...(nextPosts || [])].forEach((post) => {
    const text = String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!text || seen.has(text) || merged.length >= targetCount) {
      return;
    }

    seen.add(text);
    merged.push(typeof post === "string" ? { text } : post);
  });

  return merged;
}

function postsFromTexts(texts, fetchMeta = null) {
  return (Array.isArray(texts) ? texts : [])
    .map((text) => String(text || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((text) => (fetchMeta ? { text, fetchMeta } : { text }));
}

function postsFromExternalOpinions(externalOpinions, fetchMeta = null) {
  return postsFromTexts(String(externalOpinions || "").split("\n"), fetchMeta);
}

function attachFetchMetaToPosts(posts, fetchMeta) {
  return (Array.isArray(posts) ? posts : []).map((post) => ({
    ...(typeof post === "string" ? { text: post } : post),
    fetchMeta,
  }));
}

function calculateNextAddFetchCount(currentDataCount, targetCount, defaultCount = DEFAULT_ADD_FETCH_COUNT) {
  const remainingCount = Math.max(0, (Number(targetCount) || 0) - (Number(currentDataCount) || 0));
  if (remainingCount <= 0) return 0;
  if (remainingCount < MIN_ADD_FETCH_COUNT) return remainingCount;
  return Math.min(defaultCount, remainingCount);
}

function queryKindLabel(hashtagCount, normalQuery) {
  const hasNormal = Boolean(stripXCommonFilters(normalQuery).replace(/#[^\s)]+/g, "").trim());
  if (hashtagCount > 0 && hasNormal) return "混合";
  if (hashtagCount > 0) return "ハッシュタグ";
  return "通常語";
}

function textsFromPosts(posts) {
  return (Array.isArray(posts) ? posts : [])
    .map((post) => String(post?.text || post || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function stopReasonLabel(stopReason) {
  const labels = {
    api_returned_zero: "X APIから投稿が返りませんでした。検索条件が狭すぎる可能性があります。",
    api_returned_but_all_duplicate:
      "X APIから投稿は返りましたが、既存データと重複していたため新規追加はありませんでした。",
    api_returned_but_all_noise:
      "X APIから投稿は返りましたが、ノイズ除去後に分析対象が残りませんでした。",
    api_error: "X APIの取得中にエラーが発生しました。",
    api_credit_exhausted: "X APIのクレジットが不足しています。",
    invalid_query: "検索クエリの形式がX APIに合わなかったため、安全なクエリへ変換して再試行しました。",
    target_reached: "目標件数に到達しました。",
    max_rounds_reached: "自動取得の安全上限に到達しました。",
    safety_round_limit_reached: "自動取得の安全上限に到達しました。目標件数未満ですが、追加しても増えにくい状態です。",
    no_improvement_after_retries: "複数回試しても新規追加が伸びませんでした。",
    too_many_duplicates: "重複が多く、新しい意見を追加しにくい状態です。",
    too_many_noise_posts: "ノイズ投稿が多く、分析対象が増えにくい状態です。",
  };
  return labels[stopReason] || stopReason || "停止理由なし";
}

function queryBuildStatusLabel(status) {
  if (status === "fallback") return "予備クエリ";
  if (status === "error") return "エラー";
  if (status === "safe") return "整形済み";
  return status || "未実行";
}

function makeRetryQueryFromSafeInfo(queryInfo = {}, theme = "", userOpinion = "") {
  const fallbackBase = queryInfo.fallbackQuery || queryInfo.safeQuery || "";
  const compactKeywords = extractFallbackKeywords(theme, userOpinion)
    .filter((word) => !GENERIC_QUERY_TERMS.includes(word))
    .slice(0, 4);
  const fallbackWithoutFilters = stripXCommonFilters(fallbackBase);
  return buildSafeXQuery({
    includeGroups: [
      ...queryToSafeIncludeGroups(fallbackWithoutFilters),
      ...compactKeywords.map((word) => [word]),
    ],
    hashtags: [],
    excludeTerms: [],
  }).query;
}

function makeStageLogEntry({
  stageNo,
  action,
  query,
  fetchedCount,
  accumulatedCount,
  diagnosis,
  beforeQuery = "",
  afterQuery = "",
  targetCount = 0,
  remainingCount = 0,
  nextFetchCount = 0,
  requestedFetchCount = fetchedCount,
  apiReturnedCount = fetchedCount,
  actualFetchedCount = apiReturnedCount,
  newUniqueCount = fetchedCount,
  duplicateSkippedCount = 0,
  queryKind = "通常語",
  usedHashtags = [],
  usedExcludeTerms = [],
  rawQuery = query,
  safeQuery = query,
  fallbackQuery = "",
  finalQueryForXApi = query,
  queryBuildStatus = "safe",
  queryBuildWarnings = [],
  apiErrorMessage = "",
  errorType = "",
  originalErrorMessage = "",
  errorTimestamp = "",
  retryCount = 0,
  fallbackUsed = false,
  rawFetchedCount = apiReturnedCount,
  noiseRemovedCount = 0,
  addedToCurrentDataCount = newUniqueCount,
  stopReason = "",
  sanitizedHashtagRemovedParts = [],
  sanitizedExcludeRemovedParts = [],
}) {
  return {
    stageNo,
    action,
    actionLabel: stagedFetchActionLabel(action),
    query,
    rawQuery,
    safeQuery,
    fallbackQuery,
    finalQueryForXApi,
    queryBuildStatus,
    queryBuildWarnings,
    apiErrorMessage,
    errorType,
    originalErrorMessage,
    errorTimestamp,
    retryCount,
    fallbackUsed,
    rawFetchedCount,
    noiseRemovedCount,
    addedToCurrentDataCount,
    stopReason,
    stopReasonLabel: stopReasonLabel(stopReason),
    sanitizedHashtagRemovedParts,
    sanitizedExcludeRemovedParts,
    beforeQuery,
    afterQuery,
    fetchedCount,
    currentBatchCount: fetchedCount,
    accumulatedCount,
    currentDataCount: accumulatedCount,
    totalFetchedCount: accumulatedCount,
    targetCount,
    remainingCount,
    nextFetchCount,
    requestedFetchCount,
    apiReturnedCount,
    actualFetchedCount,
    newUniqueCount,
    duplicateSkippedCount,
    queryKind,
    usedHashtags,
    usedExcludeTerms,
    normalizedCount: diagnosis?.normalizedCount ?? 0,
    analysisCandidateCount: diagnosis?.analysisCandidateCount ?? 0,
    noiseRate: diagnosis?.noiseRate ?? 0,
    candidateRate: diagnosis?.candidateRate ?? 0,
    diagnosisStatus: diagnosis?.status || "idle",
    createdAt: new Date().toISOString(),
  };
}

function makeBigrams(text) {
  const normalizedText = normalizeOpinionText(text).replace(/\s+/g, "");

  if (normalizedText.length === 0) {
    return [];
  }

  if (normalizedText.length === 1) {
    return [normalizedText];
  }

  return Array.from({ length: normalizedText.length - 1 }, (_, index) =>
    normalizedText.slice(index, index + 2)
  );
}

function jaccardSimilarity(a, b) {
  const aSet = new Set(a);
  const bSet = new Set(b);

  if (aSet.size === 0 && bSet.size === 0) {
    return 1;
  }

  if (aSet.size === 0 || bSet.size === 0) {
    return 0;
  }

  let intersection = 0;

  aSet.forEach((value) => {
    if (bSet.has(value)) {
      intersection += 1;
    }
  });

  return intersection / (aSet.size + bSet.size - intersection);
}

function normalizeSpreadTemplateText(text) {
  return stripUrls(stripRtPrefix(text))
    .replace(/@[A-Za-z0-9_]+/g, " ")
    .replace(/[#＃][\p{L}\p{N}_ー-]+/gu, " ")
    .replace(/[0-9０-９]+/g, " ")
    .replace(/[!-/:-@[-`{-~、。，．・！？!?「」『』（）()【】［］\[\]…♪★☆????]+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/\b[a-zA-Z0-9]{1,6}\b/g, " ")
    .replace(/[ぁ-んァ-ンー]{1,5}$/u, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function personaConfigFor(mode) {
  return PERSONA_CONFIGS[mode] || PERSONA_CONFIGS.dev;
}

function personaAxisConfig(mode, sample) {
  const config = personaConfigFor(mode);
  if (mode === "dev" || !config.axisConfig) {
    return createThemeAxisConfig(sample);
  }

  return {
    ...config.axisConfig,
    x: { ...config.axisConfig.x },
    y: { ...config.axisConfig.y },
    z: { ...config.axisConfig.z },
  };
}

function personaQueryBaseText(mode, theme) {
  const cleanTheme = String(theme || "").trim();
  if (mode === "personaB") {
    return cleanTheme || "テーマ";
  }

  const candidates = personaConfigFor(mode).queryCandidates || [];
  return candidates[0] || cleanTheme || "意見";
}

function buildPersonaQueryCandidates(mode, theme) {
  const config = personaConfigFor(mode);
  if (mode === "dev") {
    return null;
  }

  const cleanTheme = String(theme || "").trim() || "テーマ";
  const bases = Array.isArray(config.queryCandidates)
    ? config.queryCandidates
    : (config.queryTemplate || []).map((suffix) => `${cleanTheme} ${suffix}`);

  return bases.map((base, index) => ({
    id: `${mode}-query-${index + 1}`,
    label: `${config.shortLabel}${index + 1}`,
    description: `${config.label}向けの検索候補です。`,
    base,
    query: base,
  }));
}

function normalizeThemeQueryCandidate(candidate, index, themeCategory) {
  if (typeof candidate === "string") {
    const base = candidate.trim();
    return {
      id: `theme-${themeCategory || "general"}-${index + 1}`,
      label: `テーマ候補${index + 1}`,
      description: "テーマから作った検索候補です。",
      base,
      query: base,
      source: "theme",
    };
  }

  const base = String(candidate?.base || candidate?.query || candidate?.label || "").trim();
  const label = String(candidate?.label || `テーマ候補${index + 1}`).trim();

  return {
    id: String(candidate?.id || `theme-${themeCategory || "general"}-${index + 1}`).trim(),
    label,
    description: String(candidate?.description || candidate?.note || "テーマから作った検索候補です。").trim(),
    base,
    query: base,
    source: "theme",
  };
}

function getThemeQueryCandidates(theme, themeCategory, fallbackSample = samples.housing) {
  const themeSample = sampleForThemeCategory(themeCategory, fallbackSample);
  const sampleCandidates = Array.isArray(themeSample?.xQueryCandidates) ? themeSample.xQueryCandidates : [];
  const normalizedSampleCandidates = sampleCandidates
    .map((candidate, index) => normalizeThemeQueryCandidate(candidate, index, themeCategory))
    .filter((candidate) => candidate.label && candidate.base);

  if (normalizedSampleCandidates.length > 0) {
    return normalizedSampleCandidates;
  }

  const keywords = extractFallbackKeywords(theme, themeSample?.userOpinion?.text || "");
  const baseQuery = keywords.length ? keywords.slice(0, 4).join(" OR ") : String(theme || "意見").trim();

  return [
    {
      id: `theme-${themeCategory || "general"}-fallback`,
      label: "テーマ基本",
      description: "テーマ語から作った検索候補です。",
      base: baseQuery,
      query: baseQuery,
      source: "theme",
    },
  ];
}

function voiceDirectionLabel(key) {
  return VOICE_DIRECTION_OPTIONS.find((option) => option.key === key)?.label || key;
}

function normalizeVoiceDirections(directions) {
  const selected = uniqueValues(Array.isArray(directions) ? directions : [])
    .map((key) => VOICE_DIRECTION_KEY_ALIASES[key] || key);
  const validKeys = new Set(VOICE_DIRECTION_OPTIONS.map((option) => option.key));
  const filtered = selected.filter((key) => validKeys.has(key));

  return filtered.length ? filtered : DEFAULT_PERSONA_A_VOICE_DIRECTIONS;
}

function personaAQueryTermsForDirections(directions, analysisPurposeMode = "position") {
  const selectedDirections = normalizeVoiceDirections(directions);
  const purposeTerms = purposeQueryTerms(analysisPurposeMode, "personaA");
  const terms = [
    ...purposeTerms,
    ...selectedDirections.flatMap((direction) => PERSONA_A_QUERY_TERMS_BY_DIRECTION[direction] || []),
  ];

  return uniqueValues(terms).filter((term) => !looksLikeMojibake(term)).slice(0, 12);
}

function getPersonaAQueryCandidates(directions = DEFAULT_PERSONA_A_VOICE_DIRECTIONS, analysisPurposeMode = "position") {
  const selectedDirections = normalizeVoiceDirections(directions);
  const purposeMode = normalizeAnalysisPurposeMode(analysisPurposeMode, "personaA");
  const purposeConfig = analysisPurposeConfigFor(purposeMode, "personaA");
  const terms = personaAQueryTermsForDirections(selectedDirections, purposeMode);
  const purposeTerms = uniqueValues(purposeConfig.queryTerms || [])
    .filter((term) => !looksLikeMojibake(term))
    .slice(0, 4);
  const groups = selectedDirections
    .map((direction) => ({
      direction,
      label: voiceDirectionLabel(direction),
      terms: uniqueValues(PERSONA_A_QUERY_TERMS_BY_DIRECTION[direction] || []).filter((term) => !looksLikeMojibake(term)).slice(0, 3),
    }))
    .filter((group) => group.terms.length > 0)
    .slice(0, 4);

  const purposeCandidate =
    purposeTerms.length > 0
      ? [
          {
            id: `persona-a-purpose-${purposeMode}`,
            label: `${JP_UI_LABELS.analysisPurpose}: ${purposeConfig.label}`,
            description: `${purposeConfig.retrievalPolicy} ${purposeConfig.clusterPolicy}`,
            base: purposeTerms.join(" OR "),
            query: purposeTerms.join(" OR "),
            source: "analysis-purpose",
            analysisPurposeMode: purposeMode,
            selectedVoiceDirections: selectedDirections,
            allTerms: terms,
          },
        ]
      : [];

  return [
    ...purposeCandidate,
    ...groups.map((group, index) => ({
    id: `persona-a-${group.direction}-${index + 1}`,
    label: group.label,
    description: `${JP_UI_LABELS.voicesToCollect}: ${group.label}`,
    base: group.terms.join(" OR "),
    query: group.terms.join(" OR "),
    source: "theme-persona-a-voice-direction",
    voiceDirection: group.direction,
    selectedVoiceDirections: selectedDirections,
    allTerms: terms,
    })),
  ];
}

function getThemeHashtagCandidates(theme, themeCategory) {
  const libraryCandidates = THEME_HASHTAG_LIBRARY[themeCategory] || [];

  if (libraryCandidates.length > 0) {
    return libraryCandidates;
  }

  return extractFallbackKeywords(theme, "")
    .slice(0, 4)
    .map((word) => [word, normalizeHashtag(word), "テーマ語から作ったハッシュタグ候補です。", "中", "recommended"]);
}

function applyPersonaUxLens({ personaMode = "dev", themeCategory = "general", axisConfig, queryCandidates, clusters, userOpinion }) {
  const config = personaConfigFor(personaMode);

  return {
    personaMode,
    themeCategory,
    feedbackTitle: config.feedbackTitle,
    dashboardLabel: config.dashboardLabel,
    toneLabel: personaMode === "dev" ? "technical" : config.shortLabel,
    axisConfig,
    queryCandidates,
    clusterCount: Array.isArray(clusters) ? clusters.length : 0,
    userOpinion,
    axisPolicy: "theme-first",
  };
}

function personaHashtagCandidates(mode, theme) {
  const config = personaConfigFor(mode);
  if (mode === "dev") {
    return [];
  }

  if (Array.isArray(config.hashtags) && config.hashtags.length > 0) {
    return config.hashtags;
  }

  return extractFallbackKeywords(theme, "")
    .slice(0, 5)
    .map((word, index) => [
      word,
      normalizeHashtag(word),
      `${config.label}向けに、話題化しやすいテーマ語から作った候補です。`,
      index < 3 ? "中" : "高",
      index < 3 ? "recommended" : "caution",
    ]);
}

function personaExcludeTermCandidates(mode) {
  const config = personaConfigFor(mode);
  return mode === "dev" ? [] : config.excludeTerms || [];
}

function spreadTemplateTokens(text) {
  const normalized = normalizeSpreadTemplateText(text).replace(/\s+/g, "");
  return makeBigrams(normalized);
}

function looksLikeSpreadTemplate(text) {
  const normalized = normalizeOpinionText(text);
  return includesAnyKeyword(normalized, [
    "投票",
    "拡散",
    "RT",
    "リポスト",
    "キャンペーン",
    "応募",
    "当選",
    "迅速",
    "デュオリレー",
    "リレー",
    "辞退",
    "A4",
    "参加者募集",
    "固定",
  ]);
}

function detectSpreadTemplateCategory(text) {
  const normalized = normalizeOpinionText(text);
  const compact = normalized.replace(/\s+/g, "");
  const campaignKeywords = [
    "拡散希望",
    "RTお願いします",
    "リポストお願いします",
    "応募",
    "当選",
    "キャンペーン",
    "参加者募集",
    "デュオリレー",
    "A4投票",
    "辞退いつでも",
  ];
  const coordinatedKeywords = ["一斉", "固定文", "テンプレ", "同じ文面", "組織票", "投票依頼"];

  if (includesAnyKeyword(normalized, coordinatedKeywords)) {
    return {
      noiseCategory: "coordinated_campaign_suspected",
      noiseReason: "同じ呼びかけや定型文の拡散が疑われる投稿です。",
    };
  }

  if (includesAnyKeyword(compact, campaignKeywords)) {
    return {
      noiseCategory: "spread_template",
      noiseReason: "キャンペーン・拡散依頼・類似テンプレートに近い投稿です。",
    };
  }

  return null;
}

function isSimilarSpreadTemplate(row, representative) {
  if (!row?.templateBigrams?.length || !representative?.templateBigrams?.length) {
    return false;
  }

  const similarity = jaccardSimilarity(row.templateBigrams, representative.templateBigrams);
  return similarity >= 0.75 || (looksLikeSpreadTemplate(row.processedText) && similarity >= 0.6);
}

function buildNoiseProcessingResult(
  opinions,
  sampleKey,
  axisConfig,
  noiseFilterEnabled = true,
  relevanceThreshold = NOISE_RELEVANCE_THRESHOLD
) {
  const rawRows = opinions.map((opinion, index) => {
    const rawNormalizedText = normalizeOpinionText(opinion);
    const isRt = isRetweetLike(rawNormalizedText);
    const includesUrl = hasUrl(rawNormalizedText);
    const rtStrippedText = stripRtPrefix(rawNormalizedText);
    const processedText = normalizeOpinionText(stripUrls(rtStrippedText));
    const isTooShort = processedText.length < 20;

    return {
      originalNo: index + 1,
      opinion,
      rawNormalizedText,
      normalizedText: processedText,
      processedText,
      templateText: normalizeSpreadTemplateText(processedText),
      templateBigrams: spreadTemplateTokens(processedText),
      isRetweetLike: isRt,
      hasUrl: includesUrl,
      rtExtracted: isRt && !isTooShort,
      rtEmptyOrTooShort: isRt && isTooShort,
      urlTextRemaining: includesUrl && !isTooShort,
      isTooShort,
    };
  });

  const normalizedCounts = new Map();

  rawRows.forEach((row) => {
    if (!row.processedText) {
      return;
    }

    normalizedCounts.set(row.processedText, (normalizedCounts.get(row.processedText) || 0) + 1);
  });

  const seenCandidates = new Set();
  const templateRepresentatives = [];
  const spreadTemplateRows = [];
  const candidateRows = [];
  const noiseExcludedRows = [];
  const borderlineUsefulRows = [];

  rawRows.forEach((row) => {
    const isDuplicate = (normalizedCounts.get(row.processedText) || 0) > 1;

    if (!row.processedText || row.isTooShort) {
      return;
    }

    if (seenCandidates.has(row.processedText)) {
      return;
    }

    seenCandidates.add(row.processedText);
    const scored = scoreOpinion(row.processedText, sampleKey, axisConfig);
    const detectedNoise = detectSpreadTemplateCategory(row.processedText) || detectNoiseCategory(row.processedText);
    const lowRelevanceNoise =
      scored.relevanceScore < relevanceThreshold
        ? {
            noiseCategory: "low_relevance",
            noiseReason: `テーマ関連度が${scored.relevanceScore}で基準${relevanceThreshold}未満です。`,
          }
        : null;
    const noiseMeta = detectedNoise || lowRelevanceNoise;
    const candidate = {
      ...row,
      isDuplicate,
      duplicateCount: normalizedCounts.get(row.processedText) || 1,
      independentOpinionVolume: 1,
      spreadVolume: normalizedCounts.get(row.processedText) || 1,
      volumeForGraph: 1,
      spreadTemplateCount: 0,
      spreadTemplateExamples: [],
      bigrams: makeBigrams(row.processedText),
      relevanceScore: scored.relevanceScore,
      scoreConfidence: scored.scoreConfidence,
      scoreWarnings: Array.isArray(scored.scoreWarnings) ? scored.scoreWarnings : [],
      noiseCategory: noiseMeta?.noiseCategory || "",
      noiseReason: noiseMeta?.noiseReason || "",
    };
    const similarTemplate = templateRepresentatives.find((representative) => isSimilarSpreadTemplate(candidate, representative));

    if (similarTemplate) {
      const spreadCount = candidate.spreadVolume || 1;
      similarTemplate.candidate.spreadVolume += spreadCount;
      similarTemplate.candidate.spreadTemplateCount += spreadCount;
      similarTemplate.candidate.duplicateCount += spreadCount;
      similarTemplate.candidate.spreadTemplateExamples.push(row.processedText);
      spreadTemplateRows.push({
        ...candidate,
        noiseCategory: looksLikeSpreadTemplate(row.processedText)
          ? "spread_template"
          : "duplicate_like_spread",
        noiseReason: "同一文面ではありませんが、正規化後に類似テンプレート投稿と判定したため独立意見数には加算していません。",
        noiseCount: spreadCount,
        matchedTemplateText: similarTemplate.candidate.processedText,
      });
      return;
    }

    templateRepresentatives.push({
      templateBigrams: candidate.templateBigrams,
      candidate,
    });

    if (noiseFilterEnabled && noiseMeta) {
      noiseExcludedRows.push(candidate);
      if (
        noiseMeta.noiseCategory === "low_relevance" &&
        scored.relevanceScore >= Math.max(3, relevanceThreshold - 2)
      ) {
        borderlineUsefulRows.push({
          ...candidate,
          borderlineReason: "テーマとの直接関連は弱いが、評価軸や少数派視点として参考になる可能性があります。",
        });
      }
      return;
    }

    candidateRows.push(candidate);
  });

  const processedTextCount = rawRows.filter((row) => row.processedText).length;
  const noiseReasonCounts = buildNoiseReasonCounts([...noiseExcludedRows, ...spreadTemplateRows]);
  const spreadTemplateCount = spreadTemplateRows.reduce((sum, row) => sum + (Number(row.noiseCount) || 1), 0);
  const duplicateLikeCount = Math.max(
    0,
    Math.max(0, processedTextCount - normalizedCounts.size) + rawRows.filter((row) => row.isRetweetLike).length + spreadTemplateCount
  );
  const independentOpinionCount = candidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0);
  const spreadReferenceCount =
    candidateRows.reduce((sum, row) => sum + (Number(row.spreadVolume) || 1), 0) +
    noiseExcludedRows.reduce((sum, row) => sum + (Number(row.spreadVolume) || Number(row.duplicateCount) || 1), 0);

  return {
    rawCount: rawRows.length,
    uniqueNormalizedCount: normalizedCounts.size,
    processedUniqueTextCount: normalizedCounts.size,
    duplicateCount: Math.max(0, processedTextCount - normalizedCounts.size),
    duplicateLikeCount,
    independentOpinionCount,
    independentOpinionRate: rawRows.length > 0 ? independentOpinionCount / rawRows.length : 0,
    spreadReferenceCount,
    spreadTemplateCount,
    spreadDominanceRate: rawRows.length > 0 ? spreadReferenceCount / rawRows.length : 0,
    retweetLikeCount: rawRows.filter((row) => row.isRetweetLike).length,
    rtExtractSuccessCount: rawRows.filter((row) => row.rtExtracted).length,
    rtEmptyOrTooShortCount: rawRows.filter((row) => row.rtEmptyOrTooShort).length,
    urlCount: rawRows.filter((row) => row.hasUrl).length,
    urlTextRemainingCount: rawRows.filter((row) => row.urlTextRemaining).length,
    tooShortCount: rawRows.filter((row) => row.isTooShort).length,
    candidateCount: candidateRows.length,
    analysisTargetCount: candidateRows.length,
    noiseFilterEnabled,
    noiseExcludedRows,
    spreadTemplateRows,
    noiseExcludedCount: noiseExcludedRows.length + spreadTemplateRows.length,
    borderlineUsefulRows,
    borderlineUsefulCount: borderlineUsefulRows.length,
    noiseReasonCounts,
    noiseReasonSummary: formatNoiseReasonCounts(noiseReasonCounts),
    clusterCount: 0,
    rawRows,
    candidateRows,
  };
}

function clusterOpinionsByText(candidateRows, threshold) {
  const clusters = [];

  candidateRows.forEach((row) => {
    const targetCluster = clusters.find(
      (cluster) => jaccardSimilarity(row.bigrams, cluster.representativeBigrams) >= threshold
    );

    if (targetCluster) {
      targetCluster.items.push(row);

      const longestItem = targetCluster.items.reduce((longest, item) =>
        item.normalizedText.length > longest.normalizedText.length ? item : longest
      );

      targetCluster.representativeText = longestItem.normalizedText;
      targetCluster.representativeBigrams = makeBigrams(longestItem.normalizedText);
      return;
    }

    clusters.push({
      representativeText: row.normalizedText,
      representativeBigrams: row.bigrams,
      items: [row],
    });
  });

  return clusters;
}

function makeClusterRepresentative(cluster, index, sampleKey, axisConfig) {
  const representative = cluster.items.reduce((longest, item) =>
    item.normalizedText.length > longest.normalizedText.length ? item : longest
  );
  const independentOpinionVolume = cluster.items.reduce(
    (sum, item) => sum + (Number(item.independentOpinionVolume) || 1),
    0
  );
  const spreadVolume = cluster.items.reduce(
    (sum, item) => sum + (Number(item.spreadVolume) || Number(item.duplicateCount) || 1),
    0
  );
  const uniqueCount = independentOpinionVolume;
  const memberRows = cluster.items.map((item, memberIndex) => ({
    no: memberIndex + 1,
    id: String(item.originalNo || memberIndex + 1),
    label: String(item.originalNo || memberIndex + 1),
    duplicateCount: item.duplicateCount || 1,
    independentOpinionVolume: item.independentOpinionVolume || 1,
    spreadVolume: item.spreadVolume || item.duplicateCount || 1,
    spreadTemplateCount: item.spreadTemplateCount || 0,
    text: item.normalizedText,
    originalText: item.opinion,
  }));

  return withClusterVolume({
    originalNo: "-",
    label: `C${index + 1}`,
    type: `処理後クラスタ C${index + 1}`,
    opinion: representative.normalizedText,
    group: "cluster",
    count: independentOpinionVolume,
    originalCount: spreadVolume,
    uniqueCount,
    independentOpinionVolume,
    spreadVolume,
    volumeForGraph: independentOpinionVolume,
    duplicateCount: Math.max(0, spreadVolume - independentOpinionVolume),
    spreadTemplateCount: cluster.items.reduce((sum, item) => sum + (Number(item.spreadTemplateCount) || 0), 0),
    memberRows,
    ...scoreOpinion(representative.normalizedText, sampleKey, axisConfig),
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value) {
  return `${Math.round(Number(value) || 0)}`;
}

function clusterCountJudgement(clusterCount, analysisCandidateCount) {
  if (clusterCount <= 4) return { label: "少なすぎる", message: "意見の種類がやや少ない可能性があります。" };
  if (clusterCount <= 7) return { label: "やや少ない", message: "読める量ですが、多様性は少し弱い可能性があります。" };
  if (clusterCount <= 20) return { label: "読みやすい", message: "意見の多様性と読みやすさのバランスが良い状態です。" };
  if (clusterCount <= 40) return { label: "多め", message: "多様ですが、読むにはやや多いです。上位クラスタ要約を優先してください。" };
  return { label: "多すぎる", message: "クラスタが多すぎます。しきい値を下げるか、要約を優先してください。" };
}

function qualityLabel(value) {
  if (value === "good") return "良好";
  if (value === "usable") return "使用可";
  if (value === "warning") return "注意";
  if (value === "bad") return "不調";
  return "未評価";
}

function retrievalKpiMessage(kpi) {
  if (!kpi) return "";
  if (kpi.overallRetrievalQuality === "good") {
    return `取得品質は良好です。分析対象率${formatPercent(kpi.analysisCandidateRate)}、クラスタ${kpi.clusterCount}件で、読める量に整理されています。`;
  }
  if (kpi.overallRetrievalQuality === "usable") {
    return `取得効率は高くありませんが、使える分析対象が${kpi.analysisCandidateCount}件あり、クラスタに整理されています。デモ用途ならこのまま進めます。`;
  }
  if (kpi.overallRetrievalQuality === "warning") {
    return `取得品質は注意です。分析対象率${formatPercent(kpi.analysisCandidateRate)}、クラスタ${kpi.clusterCount}件です。多様性やノイズ条件を見直すと改善できます。`;
  }
  return `取得品質は不調です。X APIコストに対して使える分析対象やクラスタが少ないため、検索語・除外語・ハッシュタグを調整してください。`;
}

function buildRetrievalKpi(noiseResult, clusterRows, scoreDistribution) {
  const fetchedCount = noiseResult?.rawCount || 0;
  const normalizedCount = noiseResult?.uniqueNormalizedCount || 0;
  const analysisCandidateCount = noiseResult?.candidateCount || 0;
  const noiseCount = noiseResult?.noiseExcludedCount || 0;
  const duplicateLikeCount = noiseResult?.duplicateLikeCount || 0;
  const independentOpinionCount = noiseResult?.independentOpinionCount || analysisCandidateCount;
  const independentOpinionRate = fetchedCount > 0 ? independentOpinionCount / fetchedCount : 0;
  const spreadReferenceCount = noiseResult?.spreadReferenceCount || duplicateLikeCount;
  const spreadDominanceRate = fetchedCount > 0 ? spreadReferenceCount / fetchedCount : 0;
  const clusterCount = Array.isArray(clusterRows) ? clusterRows.length : 0;
  const analysisCandidateRate = fetchedCount > 0 ? analysisCandidateCount / fetchedCount : 0;
  const noiseRate = normalizedCount > 0 ? noiseCount / normalizedCount : 0;
  const duplicateLikeRate = fetchedCount > 0 ? duplicateLikeCount / fetchedCount : 0;
  const clusterCompressionRate = analysisCandidateCount > 0 ? 1 - clusterCount / analysisCandidateCount : 0;
  const topClusterShare =
    clusterRows?.length && analysisCandidateCount > 0
      ? Math.max(...clusterRows.map((row) => row.uniqueCount || 1)) / analysisCandidateCount
      : 0;
  const clusterCountScore =
    clusterCount >= 8 && clusterCount <= 20
      ? 100
      : clusterCount >= 5 && clusterCount <= 7
        ? 72
        : clusterCount >= 21 && clusterCount <= 40
          ? 66
          : clusterCount > 40
            ? 42
            : clusterCount > 0
              ? 45
              : 0;
  const balanceScore = Math.round((1 - Math.min(0.75, topClusterShare)) / 0.75 * 100);
  const scoreSpread = ["x", "y", "z"].reduce(
    (sum, axis) => sum + Math.min(1, (scoreDistribution?.[axis]?.standardDeviation || 0) / 2.5),
    0
  ) / 3;
  const diversityScore = Math.round(clamp(clusterCountScore * 0.45 + balanceScore * 0.3 + scoreSpread * 100 * 0.25, 0, 100));
  const readLoadScore =
    clusterCount >= 8 && clusterCount <= 20
      ? 100
      : clusterCount >= 5 && clusterCount <= 7
        ? 78
        : clusterCount >= 21 && clusterCount <= 40
          ? 58
          : clusterCount > 40
            ? 24
            : clusterCount > 0
              ? 42
              : 0;
  const costEfficiencyScore = Math.round(
    clamp(analysisCandidateRate * 100 * 0.65 + Math.min(1, clusterCount / Math.max(8, fetchedCount / 8 || 1)) * 100 * 0.35, 0, 100)
  );
  const clusterJudgement = clusterCountJudgement(clusterCount, analysisCandidateCount);
  let overallRetrievalQuality = "bad";

  if (analysisCandidateRate >= 0.3 && noiseRate < 0.5 && diversityScore >= 65 && clusterCount >= 8 && clusterCount <= 20) {
    overallRetrievalQuality = "good";
  } else if (analysisCandidateRate >= 0.15 && clusterCount >= 6 && clusterCount <= 30 && diversityScore >= 45) {
    overallRetrievalQuality = "usable";
  } else if (analysisCandidateRate >= 0.1 || clusterCount >= 5) {
    overallRetrievalQuality = "warning";
  }

  return {
    fetchedCount,
    normalizedCount,
    analysisCandidateCount,
    analysisCandidateRate,
    noiseCount,
    noiseRate,
    duplicateLikeCount,
    duplicateLikeRate,
    independentOpinionCount,
    independentOpinionRate,
    spreadReferenceCount,
    spreadDominanceRate,
    clusterCount,
    clusterCompressionRate,
    topClusterShare,
    diversityScore,
    readLoadScore,
    costEfficiencyScore,
    overallRetrievalQuality,
    clusterJudgement,
    message: retrievalKpiMessage({ analysisCandidateRate, analysisCandidateCount, clusterCount, overallRetrievalQuality }),
  };
}

function truncateText(text, maxLength = 120) {
  const value = String(text || "");

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function escapeMarkdownTableCell(text) {
  return String(text ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "｜")
    .trim();
}

async function parseJsonResponse(response) {
  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    return {
      ok: false,
      error: "AI生成APIから想定外の応答が返りました。",
      details:
        text?.slice(0, 500) ||
        "応答本文が空です。server.jsが起動していない、またはAPI側でエラーが起きている可能性があります。",
      status: response.status,
      code: "AI_DRAFT_RESPONSE_NOT_JSON",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: data?.error || "AI生成APIでエラーが発生しました。",
      details: data?.details || data?.detail || data?.message || "",
      status: response.status,
      code: data?.code || "AI_DRAFT_API_ERROR",
    };
  }

  return {
    ok: true,
    data,
    status: response.status,
    code: data?.code || "OK",
  };
}

function extractFallbackKeywords(theme, userOpinion) {
  const words = uniqueValues(
    `${theme} ${userOpinion}`
      .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー\s]/gu, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2)
  );

  return words.slice(0, 6);
}

function createFallbackAnalysisDraft(theme, userOpinion, personaMode = "dev", sample = null) {
  if (personaMode !== "dev") {
    const themeCategory = getThemeCategory(sample?.sampleKey || "", theme, userOpinion);
    const themeSample = sampleForThemeCategory(themeCategory, sample || samples.housing);
    const themeAxisConfig = getThemeAxisPreset(theme, themeCategory, themeSample);
    const themeQueries = getThemeQueryCandidates(theme, themeCategory, themeSample);
    return {
      fallback: true,
      axisConfig: themeAxisConfig,
      basicKeywords: extractFallbackKeywords(theme, userOpinion),
      queryCandidates: themeQueries,
      axisLinkedKeywords: {
        x: axisKeywords(themeAxisConfig.x).slice(0, 4),
        y: axisKeywords(themeAxisConfig.y).slice(0, 4),
        z: axisKeywords(themeAxisConfig.z).slice(0, 4),
      },
      suggestedAnalysisMode: "axisDriven",
      initialQuestions: [
        `${personaConfigFor(personaMode).label}として、このテーマで一番見たい声は何か？`,
        "近い声と違う声をどう使い分けるか？",
        "次に行動へつなげるなら何を確認するか？",
      ],
    };
  }

  const keywords = extractFallbackKeywords(theme, userOpinion);
  const baseQuery = keywords.length ? keywords.slice(0, 4).join(" OR ") : String(theme || "意見").trim();

  return {
    fallback: true,
    axisConfig: {
      presetKey: "aiDraftFallback",
      x: {
        label: "感情・実感",
        highDescription: "個人的な感情、体験、不安、安心、承認欲求が強く出ている。",
        lowDescription: "個人的感情よりも、制度、一般論、情報共有が中心。",
        description: "個人的な感情、体験、不安、安心、承認欲求が強く出ている。",
      },
      y: {
        label: "現実・関係性",
        highDescription: "生活、関係性、制度、具体的な条件や行動に関する視点が強い。",
        lowDescription: "具体的な現実条件よりも、抽象的・感情的・断片的な意見。",
        description: "生活、関係性、制度、具体的な条件や行動に関する視点が強い。",
      },
      z: {
        label: "意味・成長",
        highDescription: "自己理解、成長、人生観、長期的な意味づけを含む。",
        lowDescription: "その場の反応、短期的な感情、単発の情報共有が中心。",
        description: "自己理解、成長、人生観、長期的な意味づけを含む。",
      },
    },
    basicKeywords: keywords,
    queryCandidates: [
      {
        id: "fallback-basic",
        label: "基本意見",
        description: "テーマに関する一般的な意見を広く集めます。",
        query: baseQuery,
      },
      {
        id: "fallback-worry",
        label: "悩み・不安",
        description: "不安、悩み、相談に関する意見を集めます。",
        query: `${baseQuery} OR 悩み OR 不安 OR 相談`,
      },
      {
        id: "fallback-social",
        label: "社会・制度",
        description: "制度、社会、ルールに関する意見を集めます。",
        query: `${baseQuery} OR 社会 OR 制度 OR ルール`,
      },
      {
        id: "fallback-values",
        label: "価値観",
        description: "価値観や考え方の違いに関する意見を集めます。",
        query: `${baseQuery} OR 価値観 OR 考え方 OR 違い`,
      },
    ],
    axisLinkedKeywords: {
      x: ["感情", "不安", "安心", "体験"],
      y: ["生活", "制度", "関係性", "条件"],
      z: ["成長", "意味", "人生観", "長期"],
    },
    suggestedAnalysisMode: "exploratory",
    initialQuestions: [
      "このテーマで、生活実感として一番強い不満や不安は何か？",
      "制度や関係性の問題として見ると、どこに論点があるか？",
      "長期的には、どんな価値観の違いが表れているか？",
    ],
  };
}

function createHistoryId(prefix) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 7);

  return `${prefix}_${timestamp}_${suffix}`;
}

function formatHistoryDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readDatasetHistory() {
  try {
    const raw = window.localStorage.getItem(X_DATASET_HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const datasets = Array.isArray(parsed.datasets) ? parsed.datasets : [];

    const migrated = migrateAppStateFromMojibake({
      datasets: datasets.map((dataset) => ({
        ...dataset,
        clusterRuns: Array.isArray(dataset.clusterRuns) ? dataset.clusterRuns : [],
      })),
    });
    if (raw && JSON.stringify(parsed) !== JSON.stringify(migrated)) {
      window.localStorage.setItem(X_DATASET_HISTORY_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (_error) {
    return { datasets: [] };
  }
}

function writeDatasetHistory(history) {
  const datasets = Array.isArray(history?.datasets) ? history.datasets : [];
  window.localStorage.setItem(
    X_DATASET_HISTORY_STORAGE_KEY,
    JSON.stringify({ datasets: datasets.slice(0, MAX_X_DATASET_HISTORY) })
  );
}

function compactClusterRowsForHistory(rows) {
  return rows.map((cluster) => ({
    label: cluster.label,
    type: cluster.type,
    opinion: cluster.opinion,
    group: cluster.group,
    count: cluster.count,
    originalCount: cluster.originalCount,
    uniqueCount: cluster.uniqueCount,
    independentOpinionVolume: cluster.independentOpinionVolume,
    spreadVolume: cluster.spreadVolume,
    volumeForGraph: cluster.volumeForGraph,
    spreadTemplateCount: cluster.spreadTemplateCount,
    duplicateCount: cluster.duplicateCount,
    volume: cluster.volume || clusterVolumeFromRow(cluster),
    x: cluster.x,
    y: cluster.y,
    z: cluster.z,
    absoluteScore: cluster.absoluteScore,
    relativeScore: cluster.relativeScore,
    displayScore: cluster.displayScore,
    originalScore: cluster.originalScore,
    aiSummaryScore: cluster.aiSummaryScore,
    scoreBasis: cluster.scoreBasis,
    relevanceScore: cluster.relevanceScore,
    scoreConfidence: cluster.scoreConfidence,
    scoreWarnings: cluster.scoreWarnings,
    memberRows: (cluster.memberRows || []).map((member) => ({
      no: member.no,
      id: member.id,
      label: member.label,
      duplicateCount: member.duplicateCount,
      text: member.text,
      originalText: member.originalText,
    })),
  }));
}

function restoreClusterRowsFromHistory(rows) {
  return (Array.isArray(rows) ? rows : []).map((cluster) =>
    withClusterVolume({
      originalNo: "-",
      label: cluster.label,
      type: cluster.type || `保存済みクラスタ ${cluster.label}`,
      opinion: cluster.opinion || "",
      group: "cluster",
      count: cluster.independentOpinionVolume || cluster.uniqueCount || cluster.count || 1,
      originalCount: cluster.originalCount || cluster.count || 1,
      uniqueCount: cluster.uniqueCount || 1,
      independentOpinionVolume: cluster.independentOpinionVolume || cluster.uniqueCount || cluster.count || 1,
      spreadVolume: cluster.spreadVolume || cluster.originalCount || cluster.duplicateCount || cluster.count || 1,
      volumeForGraph: cluster.volumeForGraph || cluster.independentOpinionVolume || cluster.uniqueCount || cluster.count || 1,
      spreadTemplateCount: cluster.spreadTemplateCount || 0,
      duplicateCount: cluster.duplicateCount || 0,
      volume: cluster.volume,
      x: cluster.x || 0,
      y: cluster.y || 0,
      z: cluster.z || 0,
      absoluteScore: cluster.absoluteScore || { x: cluster.x || 0, y: cluster.y || 0, z: cluster.z || 0 },
      relativeScore: cluster.relativeScore || cluster.absoluteScore || { x: cluster.x || 0, y: cluster.y || 0, z: cluster.z || 0 },
      displayScore: cluster.displayScore || cluster.relativeScore || cluster.absoluteScore || { x: cluster.x || 0, y: cluster.y || 0, z: cluster.z || 0 },
      originalScore: cluster.originalScore || { x: cluster.x || 0, y: cluster.y || 0, z: cluster.z || 0 },
      aiSummaryScore: cluster.aiSummaryScore || null,
      scoreBasis: cluster.scoreBasis || "representativeText",
      relevanceScore: cluster.relevanceScore ?? null,
      scoreConfidence: cluster.scoreConfidence ?? null,
      scoreWarnings: Array.isArray(cluster.scoreWarnings) ? cluster.scoreWarnings : [],
      memberRows: Array.isArray(cluster.memberRows) ? cluster.memberRows : [],
    })
  );
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

function distance3d(a, b) {
  return Math.sqrt(
    Math.pow((a?.x || 0) - (b?.x || 0), 2) +
      Math.pow((a?.y || 0) - (b?.y || 0), 2) +
      Math.pow((a?.z || 0) - (b?.z || 0), 2)
  );
}

function strongestAxis(score) {
  const entries = [
    ["x", score?.x || 0],
    ["y", score?.y || 0],
    ["z", score?.z || 0],
  ].sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}

function weakestAxis(score) {
  const entries = [
    ["x", score?.x || 0],
    ["y", score?.y || 0],
    ["z", score?.z || 0],
  ].sort((a, b) => a[1] - b[1]);

  return entries[0][0];
}

function buildUserFeedback({
  personaMode = "dev",
  analysisPurposeMode = "position",
  sampleKey,
  themeCategory,
  personaUxLens,
  theme,
  axisConfig,
  userScore,
  clusters,
  processedAverage,
  activeClusterMethod,
  effectiveQuery,
  queryAxisWarnings,
  selectedAxisLinkedKeywords,
  scoreMode = "relative",
  noiseProcessingResult,
}) {
  const axisNames = {
    x: axisLabel("x", axisConfig),
    y: axisLabel("y", axisConfig),
    z: axisLabel("z", axisConfig),
  };
  const rows = Array.isArray(clusters) ? clusters : [];
  const noiseStats = noiseProcessingResult || {};
  const noiseSummary =
    noiseStats.noiseFilterEnabled === false
      ? "ノイズ除去はOFFです。分析対象には短文・重複整理後の候補をそのまま使っています。"
      : `ノイズ除去はONです。${noiseStats.noiseExcludedCount || 0}件を除外し、${noiseStats.analysisTargetCount ?? noiseStats.candidateCount ?? 0}件を分析対象にしています。主な理由: ${noiseStats.noiseReasonSummary || "なし"}。`;
  const displayUserScore = {
    x: getScoreForDisplay(userScore, "x", scoreMode),
    y: getScoreForDisplay(userScore, "y", scoreMode),
    z: getScoreForDisplay(userScore, "z", scoreMode),
  };
  const externalAverage =
    processedAverage && processedAverage.x + processedAverage.y + processedAverage.z > 0
      ? {
          x: getScoreForDisplay(processedAverage, "x", scoreMode),
          y: getScoreForDisplay(processedAverage, "y", scoreMode),
          z: getScoreForDisplay(processedAverage, "z", scoreMode),
        }
      : rows.length > 0
        ? {
            x: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "x", scoreMode), 0) / rows.length),
            y: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "y", scoreMode), 0) / rows.length),
            z: Math.round(rows.reduce((sum, row) => sum + getScoreForDisplay(row, "z", scoreMode), 0) / rows.length),
          }
        : { x: 0, y: 0, z: 0 };
  const diffs = ["x", "y", "z"].map((axis) => ({
    axis,
    value: (displayUserScore?.[axis] || 0) - (externalAverage?.[axis] || 0),
  }));
  const strongestUserAxis = strongestAxis(displayUserScore);
  const weakestUserAxis = weakestAxis(displayUserScore);
  const strongestExternalAxis = strongestAxis(externalAverage);
  const largestGap = [...diffs].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  const sortedByDistance = rows
    .map((cluster) => {
      const displayClusterScore = {
        x: getScoreForDisplay(cluster, "x", scoreMode),
        y: getScoreForDisplay(cluster, "y", scoreMode),
        z: getScoreForDisplay(cluster, "z", scoreMode),
      };

      return {
        label: cluster.label,
        title: cluster.opinion,
        count: cluster.count || 1,
        distance: distance3d(displayUserScore, displayClusterScore),
        ...displayClusterScore,
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const nearClusters = sortedByDistance.slice(0, 3);
  const farClusters = sortedByDistance.slice(-3).reverse();
  const themeHints = {
    housing:
      "このテーマでは、生活負担や市場構造、長期的な住まいの価値を分けて見ることが重要です。",
    coding:
      "このテーマでは、学習者のつまずき、授業運営、改善アクションを分けて見ることが重要です。",
    religion:
      "このテーマでは、宗教が個人の救いや精神性として語られているのか、社会摩擦・制度リスクとして語られているのかの差が重要です。",
    democracy:
      "このテーマでは、多数派の量だけでなく、熟議の深さや未来の制度設計への視点を見ることが重要です。",
    romance:
      "このテーマでは、感情や承認だけでなく、現実の関係性や自己理解の深さを見ることが重要です。",
  };
  const resolvedThemeCategory = themeCategory || personaUxLens?.themeCategory || sampleKey;
  const overview =
    rows.length === 0
      ? "外部クラスタがまだないため、意見空間の傾向は仮表示です。X取得またはクラスタリング後に、より具体的な比較ができます。"
      : `今回の意見空間では、${activeClusterMethod}で${rows.length}件のクラスタが表示されています。外部意見群の平均は ${axisNames.x}=${externalAverage.x}、${axisNames.y}=${externalAverage.y}、${axisNames.z}=${externalAverage.z} です。近い/遠いクラスタの判定は${scoreDisplayModeLabel(scoreMode)}に基づいています。${noiseSummary}${themeHints[resolvedThemeCategory] || ""}`;
  const userPosition = `あなたの意見は ${axisNames.x}=${displayUserScore.x}、${axisNames.y}=${displayUserScore.y}、${axisNames.z}=${displayUserScore.z} です。特に ${axisNames[strongestUserAxis]} の方向が強く出ています。`;
  const gap =
    rows.length === 0
      ? "外部意見とのズレは、クラスタ生成後に表示されます。"
      : largestGap.value >= 0
        ? `外部意見群と比べると、あなたの意見は ${axisNames[largestGap.axis]} の方向に ${Math.abs(largestGap.value)} ポイント強く寄っています。`
        : `外部意見群と比べると、あなたの意見は ${axisNames[largestGap.axis]} の方向が ${Math.abs(largestGap.value)} ポイント低く、ここにズレがあります。`;
  const missingPerspectives = [
    `${axisNames[weakestUserAxis]} の観点を補うと、意見の射程が広がります。`,
    strongestExternalAxis !== strongestUserAxis
      ? `外部意見では ${axisNames[strongestExternalAxis]} が相対的に強いため、この視点を取り込むとSNS上の問題意識に接続しやすくなります。`
      : `あなたの強い軸と外部意見の強い軸は近いため、具体例や制度・生活への接続を増やすと説得力が出ます。`,
  ];
  const nextQuestions = [
    `${axisNames[strongestUserAxis]} を、${axisNames[weakestUserAxis]} とどう接続できるか？`,
    `${axisNames[strongestExternalAxis]} の視点を取り入れると、自分の意見はどう変わるか？`,
    "少数派の深い視点と、多数派が感じている不安やリスクをどう両立できるか？",
  ];
  const queryAxisFit =
    queryAxisWarnings?.length > 0
      ? `${queryAxisWarnings[0]} 評価軸を主軸に見るなら、関連キーワードを追加して再取得すると差が出やすくなります。`
      : selectedAxisLinkedKeywords?.length > 0
        ? `今回の検索クエリには、評価軸連動キーワード（${selectedAxisLinkedKeywords.join(" / ")}）が含まれています。評価軸に沿った意見差を拾いやすい設計です。`
        : `今回の検索クエリは「${truncateText(effectiveQuery, 120)}」です。広く探索する設計ですが、特定軸で差を出したい場合は評価軸連動キーワードを追加してください。`;
  const personaConfig = personaConfigFor(personaMode);
  const purposeConfig = analysisPurposeConfigFor(analysisPurposeMode, personaMode);
  const nearClusterText = nearClusters.length
    ? nearClusters.map((cluster) => `${cluster.label}: ${truncateText(cluster.title, 70)}`).join(" / ")
    : "外部の声を取得すると表示されます。";
  const farClusterText = farClusters.length
    ? farClusters.map((cluster) => `${cluster.label}: ${truncateText(cluster.title, 70)}`).join(" / ")
    : "外部の声を取得すると表示されます。";
  const personaALowRetrievalNote = noiseStats.personaAStrictRelevance?.referenceDisplay
    ? "今回は、恋愛相談として自然に読める声だけを残したため、読める声は少なめです。関係の薄い投稿を混ぜるより、安心して読める声を優先しています。"
    : "";
  const basePersonaASections =
    resolvedThemeCategory === "romance"
      ? {
          feeling: [JP_UI_LABELS.feelingSummary, `あなたの悩みは、${axisNames[strongestUserAxis]}が強く出ている状態に近いようです。まずはその気持ちを否定せず、何が不安なのかを分けて見てみましょう。${personaALowRetrievalNote}`],
          similar: [JP_UI_LABELS.similarVoices, `近い声: ${nearClusterText}`],
          different: [JP_UI_LABELS.differentVoices, `こういう見方もあります: ${farClusterText}`],
          trends: [JP_UI_LABELS.concernTrends, `今回の声では、${axisNames[strongestExternalAxis]}に寄った悩みが目立ちます。`],
          easier: [JP_UI_LABELS.easierPerspective, "相手の気持ちを決めつけず、返信頻度・会った時の態度・自分が言えることを分けて考えると少し楽になります。"],
          next: [JP_UI_LABELS.nextQuestions, nextQuestions[0]],
        }
      : {
          feeling: [JP_UI_LABELS.feelingSummary, `${theme}について、あなたの意見は${axisNames[strongestUserAxis]}の観点が強く出ています。まず不安や違和感を、生活への影響・制度や市場の背景・将来への見通しに分けて見てみましょう。`],
          similar: [JP_UI_LABELS.similarVoices, `近い声: ${nearClusterText}`],
          different: [JP_UI_LABELS.differentVoices, `少し違う声: ${farClusterText}`],
          trends: [JP_UI_LABELS.concernTrends, `今回の声では、${axisNames[strongestExternalAxis]}に寄った関心が目立ちます。`],
          easier: [JP_UI_LABELS.easierPerspective, "感情、生活条件、長期的な判断を分けると、いま何を心配していて、何を調べればよいかが見えやすくなります。"],
          next: [JP_UI_LABELS.nextQuestions, nextQuestions[0]],
        };
  const personaASections =
    analysisPurposeMode === "debate"
      ? [basePersonaASections.different, basePersonaASections.feeling, basePersonaASections.trends, basePersonaASections.similar, basePersonaASections.easier, basePersonaASections.next]
      : analysisPurposeMode === "advice"
        ? [basePersonaASections.easier, basePersonaASections.next, basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.different, basePersonaASections.trends]
        : analysisPurposeMode === "position"
          ? [basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.different, basePersonaASections.trends, [JP_UI_LABELS.retrievalPolicy, purposeConfig.retrievalPolicy], basePersonaASections.next]
          : [basePersonaASections.feeling, basePersonaASections.similar, basePersonaASections.easier, basePersonaASections.different, basePersonaASections.trends, basePersonaASections.next];
  const personaSections =
    personaMode === "personaA"
      ? personaASections
      : personaMode === "personaB"
        ? [
            ["今回の論点分布", overview],
            ["読者が反応している悩み", `${axisNames[strongestExternalAxis]}に近い投稿が反応入口になりそうです。`],
            ["自分の意見のポジション", userPosition],
            ["発信するなら刺さりそうな切り口", `まず${axisNames[strongestExternalAxis]}で共感入口を作り、次に${axisNames[strongestUserAxis]}の自分の視点へ展開すると届きやすくなります。`],
            ["投稿タイトル案", `${theme}で本当に見落とされていること / ${theme}にモヤモヤする人へ / ${theme}はなぜ変わらないのか`],
            ["note / X / ショート動画向けの使い分け", "Xは共感入口、noteは構造整理、ショート動画は一つの違和感に絞ると使いやすいです。"],
            ["炎上・誤解リスク", "断定しすぎると反発を招きやすいため、反対側の声も一度受け止める構成が安全です。"],
            ["次に深掘りすべき問い", nextQuestions[1]],
          ]
        : personaMode === "personaC"
          ? [
              ["困りごとの分類", `今回の困りごとは、${axisNames[strongestExternalAxis]}に寄ったものが目立ちます。`],
              ["対応優先度", `${axisNames.z}が高いクラスタから対応すると、離脱や不満の予防につながります。`],
              ["多くの人に起きている問題", `近いクラスタ: ${nearClusterText}`],
              ["個別フォローが必要な問題", `少し離れたクラスタ: ${farClusterText}`],
              ["次回授業で補足すべきこと", "最初に共通のつまずきを10分だけ扱い、質問例と確認手順を配ると改善しやすいです。"],
              ["教材・FAQに追加すべき内容", "エラー文の読み方、質問テンプレート、環境構築で止まった時の確認リストを追加してください。"],
              ["講師へのアクションリスト", "多い困りごとを先に説明し、個別事情は授業後フォローに分けると運営しやすくなります。"],
              ["運営改善案", "初回に前提知識チェックを入れ、つまずきやすい人向けの補助資料を用意してください。"],
            ]
          : [];

  return {
    personaMode,
    analysisPurposeMode,
    feedbackTitle: personaConfig.feedbackTitle,
    personaSections,
    overview,
    userPosition,
    gap,
    queryAxisFit,
    nearClusters,
    farClusters,
    missingPerspectives,
    nextQuestions,
    noiseSummary,
    theme,
  };
}

function GuidePage() {
  const guideSections = [
    {
      title: "3DEとは？",
      body: [
        "自分の意見と、外部の多様な意見を比べるためのツールです。",
        "どの意見が多いか、どの意見が深いか、どの意見が長期視点を含むかを見やすくします。",
        "単なるアンケートではなく、意見の広がりや位置関係を可視化するものです。",
      ],
    },
    {
      title: "画面の構成",
      body: [
        "3DEの画面は、大きく分けて次のエリアで構成されています。",
        "上部ヘッダー：現在のモードや主要な操作ボタンが並ぶ場所です。表示切替、スコアリング、分析結果の確認など、全体操作に使います。",
        "左側の操作パネル：テーマ、自分の意見、X取得、保存、設定などを扱う場所です。入力や操作は主にここから行います。左パネルはドラッグで幅を調整できます。",
        "中央のメイン表示エリア：外部意見、評価結果、クラスタ、フィードバックなどを見る場所です。3DEの分析結果を確認する中心エリアです。",
        "評価軸・スコア表示エリア：X軸、Y軸、Z軸などの評価軸や、各意見のスコアを確認する場所です。「人数・拡散量」「議論の深さ」「視座の高さ」などを見ます。",
        "Zone表示・フィードバックエリア：Zone11など、分析結果から得られたフィードバックを見る場所です。自分の意見と外部意見の違いや、次に考える視点を確認します。",
        "保存・コピー関連：Xデータ保存、クラスタ保存、分析結果コピーなどを行う場所です。保存内容は原則として、このブラウザ内に保存されます。",
        "最初はすべての機能を使う必要はありません。まずは「テーマ」「自分の意見」「外部意見」「Zone11のフィードバック」を見るだけで十分です。",
        "詳細な設定や保存機能は、慣れてから使ってください。現時点ではPC画面での利用を推奨しています。",
      ],
    },
    {
      title: "まず見る場所",
      body: [
        "現在のテーマ：いま分析している話題です。",
        "自分の意見：比較の基準になるあなた側の意見です。",
        "現在の分析対象の概要：外部意見の量や状態を確認します。",
        "評価軸：意見をどう見るかの物差しです。",
      ],
    },
    {
      title: "基本の流れ",
      steps: [
        "テーマと自分の意見を確認する",
        "評価軸を確認する",
        "Xから外部意見を取得する",
        "必要に応じてスコアリングする",
        "クラスタリング・AI要約を見る",
        "Zone11のフィードバックを見る",
      ],
    },
    {
      title: "画面上の主なボタン",
      body: [
        "Xデータ保存：取得したXの投稿データを作業用に保存します。",
        "クラスタ保存：似た意見ごとのまとまりを保存します。",
        "分析結果コピー：現在の分析結果を文章としてクリップボードにコピーします。",
        "スコア / 絶対 / 相対：スコアの見方を切り替えます。",
        "表示 / 最終結果：処理前後や最終結果の見え方を切り替えます。",
      ],
    },
    {
      title: "データの保存場所について",
      body: [
        "3DEで保存したXデータ、クラスタ、分析結果などは、原則として利用者本人のブラウザ内に保存されます。",
        "サーバーや外部データベースに自動共有されるものではありません。",
        "他の人が同じURLを開いても、あなたの保存データがそのまま見えるわけではありません。",
        "同じPC・同じブラウザでは保存内容を再利用できます。",
        "別のPC、別のブラウザ、シークレットモードでは保存内容は引き継がれない場合があります。",
        "ブラウザの閲覧データやサイトデータを削除すると、保存内容も消える場合があります。",
        "秘密性の高い内容を扱う場合は、共有PCでは使わないでください。",
        "3DEは現時点では、各ユーザーが自分の端末上で分析を試すためのプレビュー版です。",
      ],
    },
    {
      title: "評価軸の意味",
      body: [
        "X：人数・拡散量。どれくらい多くの人や反応があるかを見ます。",
        "Y：議論の深さ。理由や背景まで考えられているかを見ます。",
        "Z：視座の高さ。短期だけでなく、長期や社会全体の視点を含むかを見ます。",
      ],
    },
    {
      title: "注意点",
      body: [
        "X取得は検索条件によって結果が変わります。",
        "ノイズや重複が含まれることがあります。",
        "3DEは正解を出すものではなく、意見の構造を見やすくするものです。",
        "現時点ではPC利用推奨です。スマホ表示は今後対応予定です。",
      ],
    },
    {
      title: "最初に試すおすすめ操作",
      body: [
        "まずは現在表示されているサンプルを眺めます。",
        "次に「Xから取得して外部意見欄に反映」を押します。",
        "その後、Zone11のフィードバックを見て、意見空間の偏りや次の問いを確認します。",
      ],
    },
  ];

  return (
    <main className="guide-page">
      <div className="guide-shell">
        <nav className="guide-nav" aria-label="使い方ページのナビゲーション">
          <a href="/" className="guide-back-link">3DEに戻る</a>
        </nav>
        <header className="guide-hero">
          <p>初めて使う人のためのクイックガイド</p>
          <h1>3DEの使い方</h1>
          <span>意見の量、深さ、視点の高さを並べて見ながら、いまのテーマを立体的に捉えるためのページです。</span>
        </header>
        <section className="guide-grid" aria-label="3DEの使い方">
          {guideSections.map((section) => (
            <article key={section.title} className="guide-card">
              <h2>{section.title}</h2>
              {section.steps ? (
                <ol>
                  {section.steps.map((item) => <li key={item}>{item}</li>)}
                </ol>
              ) : (
                <ul>
                  {section.body.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </article>
          ))}
        </section>
        <div className="guide-footer">
          <a href="/" className="guide-primary-link">3DEに戻る</a>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/guide") {
    return <GuidePage />;
  }

  const [sampleKey, setSampleKey] = useState("housing");
  const [personaMode, setPersonaMode] = useState("dev");
  const [personaModeHistory, setPersonaModeHistory] = useState([]);
  const [analysisPurposeMode, setAnalysisPurposeMode] = useState(() => defaultAnalysisPurposeForPersona("dev"));
  const [hasManualVoiceDirectionSelection, setHasManualVoiceDirectionSelection] = useState(false);
  const [selectedVoiceDirections, setSelectedVoiceDirections] = useState(DEFAULT_PERSONA_A_VOICE_DIRECTIONS);
  const [selectedDemoSampleKey, setSelectedDemoSampleKey] = useState("housing");
  const [viewMode, setViewMode] = useState(() => {
    if (PUBLIC_PREVIEW_MODE) {
      return "user";
    }

    if (typeof window === "undefined") {
      return "user";
    }

    const savedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return savedMode === "developer" ? "developer" : "user";
  });
  const [isXDatasetHistoryExpanded, setIsXDatasetHistoryExpanded] = useState(false);
  const [theme, setTheme] = useState(samples.housing.theme);
  const [userOpinion, setUserOpinion] = useState(samples.housing.userOpinion.text);
  const [externalOpinions, setExternalOpinions] = useState(
    samples.housing.externalOpinions.map((item) => item.text).join("\n")
  );

  const [originCentered, setOriginCentered] = useState(false);
  const [graphMode, setGraphMode] = useState("raw");
  const [clusterThreshold, setClusterThreshold] = useState(0.35);
  const [clusterMethod, setClusterMethod] = useState("text");
  const [semanticThreshold, setSemanticThreshold] = useState(0.78);
  const [semanticClusterRows, setSemanticClusterRows] = useState([]);
  const [semanticClusterStatus, setSemanticClusterStatus] = useState("");
  const [semanticClusterError, setSemanticClusterError] = useState("");
  const [isSemanticClusterLoading, setIsSemanticClusterLoading] = useState(false);
  const [expandedClusterIds, setExpandedClusterIds] = useState({});
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [clusterSummaries, setClusterSummaries] = useState({});
  const [isClusterSummaryLoadingById, setIsClusterSummaryLoadingById] = useState({});
  const [clusterSummaryErrorById, setClusterSummaryErrorById] = useState({});
  const [autoSummaryLimit, setAutoSummaryLimit] = useState(10);
  const [isAutoSummarizing, setIsAutoSummarizing] = useState(false);
  const [autoSummaryStatus, setAutoSummaryStatus] = useState("未実行");
  const [autoSummaryError, setAutoSummaryError] = useState("");
  const [autoSummaryProgress, setAutoSummaryProgress] = useState({ completed: 0, total: 0, success: 0, failed: 0 });
  const [datasetHistory, setDatasetHistory] = useState({ datasets: [] });
  const [activeDatasetId, setActiveDatasetId] = useState("");
  const [activeClusterRunId, setActiveClusterRunId] = useState("");
  const [xDataStatus, setXDataStatus] = useState("sample");
  const [historyStatus, setHistoryStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [operationStatus, setOperationStatus] = useState(() => createInitialOperationStatus());
  const [toast, setToast] = useState(null);
  const [publishStatus, setPublishStatus] = useState({
    status: "idle",
    mode: "",
    stage: "",
    message: "未実行",
    error: "",
    steps: [],
    changedFiles: [],
    buildOk: null,
    envIncluded: false,
    commitExecuted: false,
    pushExecuted: false,
    vercelUrl: "https://3de-app.vercel.app",
  });
  const [queryDirty, setQueryDirty] = useState(false);
  const [scoreDisplayMode, setScoreDisplayMode] = useState("relative");
  const [isNoiseFilteringDisabled, setIsNoiseFilteringDisabled] = useState(false);
  const [noiseRelevanceThreshold, setNoiseRelevanceThreshold] = useState(NOISE_RELEVANCE_THRESHOLD);
  const [sortKey, setSortKey] = useState("z");
  const [sortDirection, setSortDirection] = useState("desc");
  const [zone12Filter, setZone12Filter] = useState("all");
  const [xQueryBase, setXQueryBase] = useState(samples.housing.xQueryCandidates[0].base);
  const [xQueryFilters, setXQueryFilters] = useState(DEFAULT_X_QUERY_FILTERS);
  const [xQuery, setXQuery] = useState(buildXQuery(samples.housing.xQueryCandidates[0].base, DEFAULT_X_QUERY_FILTERS));
  const [selectedXQueryCandidateIds, setSelectedXQueryCandidateIds] = useState([
    samples.housing.xQueryCandidates[0].label,
  ]);
  const [selectedHashtagCandidates, setSelectedHashtagCandidates] = useState([]);
  const [hasManualHashtagSelection, setHasManualHashtagSelection] = useState(false);
  const [selectedExcludeTermCandidates, setSelectedExcludeTermCandidates] = useState([]);
  const [hasManualExcludeTermSelection, setHasManualExcludeTermSelection] = useState(false);
  const [generatedXQueryCandidates, setGeneratedXQueryCandidates] = useState(null);
  const [generatedBasicKeywords, setGeneratedBasicKeywords] = useState([]);
  const [generatedAxisLinkedKeywords, setGeneratedAxisLinkedKeywords] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiDraftStatus, setAiDraftStatus] = useState("");
  const [aiDraftError, setAiDraftError] = useState("");
  const [aiDraftErrorDetails, setAiDraftErrorDetails] = useState(null);
  const [aiDraftMode, setAiDraftMode] = useState("idle");
  const [isAiDraftApplied, setIsAiDraftApplied] = useState(false);
  const [aiDraftApiHealth, setAiDraftApiHealth] = useState({
    status: "unknown",
    label: "未確認",
    details: "",
  });
  const [isAiDraftLoading, setIsAiDraftLoading] = useState(false);
  const [aiDraftInitialQuestions, setAiDraftInitialQuestions] = useState([]);
  const [isManualXQuery, setIsManualXQuery] = useState(false);
  const [xMaxResults, setXMaxResults] = useState(100);
  const [xStatus, setXStatus] = useState("");
  const [xPosts, setXPosts] = useState([]);
  const [stagedFetchState, setStagedFetchState] = useState(() => createInitialStagedFetchState());
  const [analysisMode, setAnalysisMode] = useState("exploratory");
  const [selectedAxisLinkedKeywords, setSelectedAxisLinkedKeywords] = useState([]);
  const [axisConfig, setAxisConfig] = useState(() => createThemeAxisConfig(samples.housing));
  const [draftAxisConfig, setDraftAxisConfig] = useState(() => createThemeAxisConfig(samples.housing));
  const [axisLowDescriptionAutoGenerated, setAxisLowDescriptionAutoGenerated] = useState(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
  const [axisStatus, setAxisStatus] = useState("");
  const [hasScoredWithCurrentAxis, setHasScoredWithCurrentAxis] = useState(true);
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

  const plot3dRef = useRef(null);
  const plot2dRef = useRef(null);
  const userOpinionTextareaRef = useRef(null);
  const xFetchAbortControllerRef = useRef(null);
  const autoSummaryAbortControllerRef = useRef(null);
  const autoSummaryStopRequestedRef = useRef(false);

  const currentSample = samples[sampleKey];
  const currentPersonaConfig = personaConfigFor(personaMode);
  const currentAnalysisPurposeConfig = analysisPurposeConfigFor(analysisPurposeMode, personaMode);
  const themeCategory = useMemo(
    () => getThemeCategory(sampleKey, theme, userOpinion),
    [sampleKey, theme, userOpinion]
  );
  const themeQueryCandidates = useMemo(
    () => getThemeQueryCandidates(theme, themeCategory, currentSample),
    [theme, themeCategory, currentSample]
  );
  const personaAQueryCandidates = useMemo(
    () =>
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : null,
    [personaMode, themeCategory, selectedVoiceDirections, analysisPurposeMode]
  );
  const axisLabels = useMemo(
    () => ({
      x: axisLabel("x", axisConfig),
      y: axisLabel("y", axisConfig),
      z: axisLabel("z", axisConfig),
    }),
    [axisConfig]
  );
  const xQueryCandidates = (generatedXQueryCandidates ?? personaAQueryCandidates ?? themeQueryCandidates ?? currentSample.xQueryCandidates ?? [])
    .filter((candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.base || ""} ${candidate?.query || ""}`));
  const hashtagCandidates = useMemo(
    () => buildHashtagCandidates(sampleKey, theme, userOpinion, stagedFetchState.aiQueryAdvice, personaMode, analysisPurposeMode),
    [sampleKey, theme, userOpinion, stagedFetchState.aiQueryAdvice, personaMode, analysisPurposeMode]
  );
  const excludeTermCandidates = useMemo(
    () => buildExcludeTermCandidates(sampleKey, theme, userOpinion, stagedFetchState.noiseBreakdown, personaMode, analysisPurposeMode),
    [sampleKey, theme, userOpinion, stagedFetchState.noiseBreakdown, personaMode, analysisPurposeMode]
  );
  const selectedXQueryCandidates = useMemo(() => {
    const selectedSet = new Set(selectedXQueryCandidateIds);

    return xQueryCandidates.filter((candidate) => selectedSet.has(candidate.label));
  }, [xQueryCandidates, selectedXQueryCandidateIds]);
  const selectedHashtagValues = useMemo(
    () =>
      hashtagCandidates
        .filter((candidate) => selectedHashtagCandidates.includes(candidate.hashtag))
        .map((candidate) => candidate.hashtag),
    [hashtagCandidates, selectedHashtagCandidates]
  );
  const autoSelectedHashtagValues = useMemo(
    () =>
      hashtagCandidates
        .filter((candidate) => candidate.selectionType === "recommended")
        .slice(0, 3)
        .map((candidate) => candidate.hashtag),
    [hashtagCandidates]
  );
  const selectedExcludeTermValues = useMemo(
    () =>
      excludeTermCandidates
        .filter((candidate) =>
          hasManualExcludeTermSelection
            ? selectedExcludeTermCandidates.includes(candidate.term)
            : personaMode === "personaA" && themeCategory === "romance"
        )
        .map((candidate) => candidate.term),
    [excludeTermCandidates, selectedExcludeTermCandidates, hasManualExcludeTermSelection, personaMode, themeCategory]
  );
  const axisLinkedKeywords = useMemo(() => {
    if (generatedAxisLinkedKeywords) {
      const x = Array.isArray(generatedAxisLinkedKeywords.x) ? generatedAxisLinkedKeywords.x : [];
      const y = Array.isArray(generatedAxisLinkedKeywords.y) ? generatedAxisLinkedKeywords.y : [];
      const z = Array.isArray(generatedAxisLinkedKeywords.z) ? generatedAxisLinkedKeywords.z : [];

      return {
        x,
        y,
        z,
        all: uniqueValues([...x, ...y, ...z]),
      };
    }

    return generateAxisLinkedKeywords(axisConfig);
  }, [axisConfig, generatedAxisLinkedKeywords]);
  const effectiveQuery = useMemo(
    () =>
      buildQueryWithAxisKeywords(
        buildCombinedXQuery(xQueryCandidates, selectedXQueryCandidateIds, xQueryFilters, xQuery),
        selectedAxisLinkedKeywords,
        xQueryFilters,
        selectedHashtagValues,
        selectedExcludeTermValues
      ),
    [
      xQueryCandidates,
      selectedXQueryCandidateIds,
      xQueryFilters,
      xQuery,
      selectedAxisLinkedKeywords,
      selectedHashtagValues,
      selectedExcludeTermValues,
    ]
  );
  const queryAxisWarnings = useMemo(
    () => buildQueryAxisWarnings(axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode),
    [axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode]
  );
  const safeQueryPreview = useMemo(
    () =>
      buildSafeXQueryFromRaw(effectiveQuery, {
        sampleKey: themeCategory,
        theme,
        userOpinion,
        personaMode,
        analysisPurposeMode,
        hashtags: selectedHashtagValues,
        excludeTerms: selectedExcludeTermValues,
      }),
    [effectiveQuery, themeCategory, theme, userOpinion, personaMode, analysisPurposeMode, selectedHashtagValues, selectedExcludeTermValues]
  );
  const queryReviewParts = useMemo(() => {
    const parts = safeQueryPreview.queryParts || {};
    return {
      analysisPurposeLabel: currentAnalysisPurposeConfig.label,
      inputSourceLabel: currentInputSourceLabel(),
      retrievalPolicy: currentAnalysisPurposeConfig.retrievalPolicy,
      clusterPolicy: currentAnalysisPurposeConfig.clusterPolicy,
      zone11Policy: currentAnalysisPurposeConfig.zone11Policy,
      includeTerms: (parts.includeTerms || []).filter((item) => !looksLikeMojibake(item)),
      includeHashtags: (parts.includeHashtags || []).filter((item) => !looksLikeMojibake(item)),
      excludeTerms: (parts.excludeTerms || []).filter((item) => !looksLikeMojibake(item)),
      cautionTerms: hashtagCandidates
        .filter((candidate) => candidate.selectionType === "caution")
        .map((candidate) => candidate.hashtag)
        .concat(parts.cautionTerms || [])
        .filter((item) => !looksLikeMojibake(item)),
      disabledTerms: hashtagCandidates
        .filter((candidate) => candidate.selectionType === "disabled")
        .map((candidate) => candidate.hashtag)
        .concat(parts.disabledTerms || [])
        .filter((item) => !looksLikeMojibake(item)),
      finalQueryForXApi: safeRuntimeText(parts.finalQueryForXApi || safeQueryPreview.finalQueryForXApi || "", viewMode),
    };
  }, [safeQueryPreview, hashtagCandidates, viewMode, currentAnalysisPurposeConfig, xPosts.length, xDataStatus, externalOpinions]);
  const isEffectiveQueryTooLong = effectiveQuery.length > 450;
  const activeDataset = useMemo(
    () => datasetHistory.datasets.find((dataset) => dataset.datasetId === activeDatasetId) || null,
    [datasetHistory, activeDatasetId]
  );
  const activeClusterRun = useMemo(
    () => activeDataset?.clusterRuns?.find((run) => run.runId === activeClusterRunId) || null,
    [activeDataset, activeClusterRunId]
  );
  const datasetThemeMismatch = Boolean(activeDataset?.theme && activeDataset.theme !== theme);
  const datasetUserOpinionMismatch = Boolean(
    activeDataset?.userOpinion && activeDataset.userOpinion !== userOpinion
  );
  const activeDatasetMatchesCurrent = Boolean(
    activeDataset &&
      (activeDataset.theme || "") === (theme || "") &&
      (activeDataset.userOpinion || "") === (userOpinion || "") &&
      (Array.isArray(activeDataset.externalOpinions) ? activeDataset.externalOpinions.join("\n") : "") === externalOpinions
  );
  const currentOpinionCount = externalOpinions
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean).length;
  const noiseFilteringEnabled = viewMode !== "developer" || !isNoiseFilteringDisabled;
  const stagedFetchEnabled = viewMode !== "developer" || stagedFetchState.enabled;
  const currentDatasetHash = useMemo(
    () =>
      stableHash({
        sampleKey,
        theme,
        userOpinion,
        analysisPurposeMode,
        selectedVoiceDirections,
        effectiveQuery,
        externalOpinions,
        axisConfig,
        selectedXQueryCandidateIds,
        xMaxResults,
        stagedFetchEnabled,
        queryDiagnosisStatus: stagedFetchState.diagnosisStatus,
        noiseRelevanceThreshold,
      }),
    [sampleKey, theme, userOpinion, analysisPurposeMode, selectedVoiceDirections, effectiveQuery, externalOpinions, axisConfig, selectedXQueryCandidateIds, xMaxResults, stagedFetchEnabled, stagedFetchState.diagnosisStatus, noiseRelevanceThreshold]
  );
  const hasFetchedExternalData = Boolean(
    externalOpinions.trim() &&
      (xDataStatus === "unsaved" || xDataStatus === "cached" || (viewMode === "developer" && xDataStatus === "sample"))
  );
  const axisDirty = !hasScoredWithCurrentAxis;
  const canRescoreWithCurrentAxis = hasFetchedExternalData && axisDirty;
  const rescoreButtonText = !hasFetchedExternalData
    ? "外部意見を取得後に再スコアリングできます"
    : !axisDirty
      ? "評価軸は現在のスコアに反映済みです"
      : "現在の評価軸で再スコアリング";

  useEffect(() => {
    setDatasetHistory(readDatasetHistory());
  }, []);

  useEffect(() => {
    if (PUBLIC_PREVIEW_MODE) {
      if (viewMode !== "user") {
        setViewMode("user");
      }
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "user");
      return;
    }

    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "user") return;
    if (graphMode === "compare") {
      setGraphMode("processed");
    }
    if (clusterMethod !== "semantic") {
      setClusterMethod("semantic");
    }
  }, [viewMode, graphMode, clusterMethod]);

  useEffect(() => {
    autoResizeTextarea(userOpinionTextareaRef.current);
  }, [userOpinion]);

  useEffect(() => {
    checkAnalysisDraftHealth();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
    function handleWindowResize() {
      setSidebarWidth((currentWidth) => {
        const nextWidth = clampSidebarWidth(currentWidth);
        window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(nextWidth)));
        return nextWidth;
      });
    }

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  function loadSample(key) {
    const nextSample = samples[key];
    const nextThemeCategory = getThemeCategory(key, nextSample.theme, nextSample.userOpinion.text);
    const nextVoiceDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(analysisPurposeMode, personaMode);
    const nextThemeQueries =
      personaMode === "personaA" && nextThemeCategory === "romance"
        ? getPersonaAQueryCandidates(nextVoiceDirections, analysisPurposeMode)
        : getThemeQueryCandidates(nextSample.theme, nextThemeCategory, nextSample);
    const nextPurposeTags =
      personaMode === "personaA" && nextThemeCategory === "romance" && !hasManualHashtagSelection
        ? purposeHashtags(analysisPurposeMode, personaMode)
        : [];
    const firstCandidate = nextThemeQueries?.[0];
    const nextBase = firstCandidate?.base || firstCandidate?.query || "";
    const nextFilters = { ...DEFAULT_X_QUERY_FILTERS };
    const nextAxisConfig = getThemeAxisPreset(nextSample.theme, nextThemeCategory, nextSample);

    setSampleKey(key);
    setSelectedVoiceDirections(nextVoiceDirections);
    setTheme(nextSample.theme);
    setUserOpinion(nextSample.userOpinion.text);
    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setAxisStatus("テーマに合わせた評価軸に切り替えました。利用目的は出力の見せ方に反映します。");
    setHasScoredWithCurrentAxis(true);
    setAnalysisMode("exploratory");
    setSelectedAxisLinkedKeywords([]);
    setExternalOpinions(nextSample.externalOpinions.map((item) => item.text).join("\n"));
    setGraphMode("raw");
    setScoreDisplayMode("relative");
    setIsNoiseFilteringDisabled(false);
    setClusterThreshold(0.35);
    setClusterMethod("text");
    setSemanticThreshold(0.78);
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setIsSemanticClusterLoading(false);
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus("sample");
    setHistoryStatus("");
    setCopyStatus("");
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setAiDraft(null);
    setIsAiDraftApplied(false);
    setAiDraftStatus("");
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("idle");
    setAiDraftInitialQuestions([]);
    setSelectedXQueryCandidateIds(nextThemeQueries.slice(0, 3).map((candidate) => candidate.label));
    setSelectedHashtagCandidates(nextPurposeTags);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setXQueryBase(nextBase);
    setXQueryFilters(nextFilters);
    setXQuery(buildXQuery(nextBase, nextFilters));
    setIsManualXQuery(false);
    setXStatus("");
    setXPosts([]);
    setStagedFetchState(createInitialStagedFetchState());
  }

  function applySelectedDemoSample() {
    const shouldConfirm = Boolean(theme.trim() || userOpinion.trim() || externalOpinions.trim());

    if (
      shouldConfirm &&
      !window.confirm("サンプルを反映すると、現在のテーマ・自分の意見・検索候補・評価軸が上書きされます。よろしいですか？")
    ) {
      return;
    }

    loadSample(selectedDemoSampleKey);
  }

  function normalizeAiDraftCandidates(candidates) {
    return (Array.isArray(candidates) ? candidates : [])
      .map((candidate, index) => {
        const label = String(candidate?.label || `AI候補${index + 1}`).trim();
        const base = bindGenericQueryToTheme(candidate?.query || candidate?.base || "", theme, userOpinion);

        return {
          id: String(candidate?.id || `ai-${index + 1}`).trim(),
          label,
          base,
          query: buildXQuery(base, DEFAULT_X_QUERY_FILTERS),
          note: String(candidate?.description || candidate?.note || "").trim(),
          description: String(candidate?.description || candidate?.note || "").trim(),
        };
      })
      .filter((candidate) => candidate.label && candidate.base)
      .filter((candidate) => !looksLikeMojibake(`${candidate.label} ${candidate.description} ${candidate.base} ${candidate.query}`));
  }

  function resetUserInputArea() {
    if (
      !window.confirm(
        "現在のテーマ、自分の意見、検索クエリ、評価軸候補を空欄にします。保存済みデータは削除されません。よろしいですか？"
      )
    ) {
      return;
    }

    const emptyAxisConfig = normalizeAxisConfig(
      {
        presetKey: "custom",
        x: { label: "", description: "", highDescription: "", lowDescription: "" },
        y: { label: "", description: "", highDescription: "", lowDescription: "" },
        z: { label: "", description: "", highDescription: "", lowDescription: "" },
      },
      currentSample
    );

    setTheme("");
    setUserOpinion("");
    setExternalOpinions("");
    setXPosts([]);
    setXQueryBase("");
    setXQuery("");
    setXQueryFilters({ ...DEFAULT_X_QUERY_FILTERS });
    setSelectedXQueryCandidateIds([]);
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setHasManualVoiceDirectionSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedXQueryCandidates([]);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setAiDraft(null);
    setIsAiDraftApplied(false);
    setAiDraftStatus("");
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("idle");
    setAiDraftInitialQuestions([]);
    setAxisConfig(emptyAxisConfig);
    setDraftAxisConfig(emptyAxisConfig);
    setAxisStatus("未設定です。テーマと自分の意見を入力し、「AIで評価軸を設定」を押してください。");
    setHasScoredWithCurrentAxis(false);
    setGraphMode("raw");
    setScoreDisplayMode("relative");
    setIsNoiseFilteringDisabled(false);
    setClusterMethod("text");
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus("empty");
    setHistoryStatus("ユーザー入力欄をリセットしました。保存済みXデータは削除していません。");
    setXStatus("");
    setStagedFetchState(createInitialStagedFetchState());
  }

  function resetMojibakeRuntimeData() {
    const normalizedDirections = purposeVoiceDirections(analysisPurposeMode, personaMode);
    const cleanQueryCandidates =
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(normalizedDirections, analysisPurposeMode)
        : getThemeQueryCandidates(theme, themeCategory, currentSample);
    const firstCandidate = cleanQueryCandidates[0];
    const nextBase = firstCandidate?.base || firstCandidate?.query || sanitizeXQueryPhrase(theme) || "意見";
    const migratedHistory = migrateAppStateFromMojibake(datasetHistory);

    setSelectedVoiceDirections(normalizedDirections);
    setHasManualVoiceDirectionSelection(false);
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setSelectedXQueryCandidateIds(cleanQueryCandidates.slice(0, 3).map((candidate) => candidate.label));
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setXQueryBase(nextBase);
    setXQuery(buildXQuery(nextBase, DEFAULT_X_QUERY_FILTERS));
    setXQueryFilters({ ...DEFAULT_X_QUERY_FILTERS });
    setStagedFetchState((previous) => ({
      ...previous,
      stageLogs: (previous.stageLogs || []).map(migrateStageLogFromMojibake),
      improvedQueryCandidates: (previous.improvedQueryCandidates || []).filter(
        (candidate) => !looksLikeMojibake(`${candidate?.label || ""} ${candidate?.description || ""} ${candidate?.base || ""} ${candidate?.query || ""}`)
      ),
      recommendedQuery: looksLikeMojibake(previous.recommendedQuery) ? "" : previous.recommendedQuery,
      beforeQuery: looksLikeMojibake(previous.beforeQuery) ? "" : previous.beforeQuery,
      afterQuery: looksLikeMojibake(previous.afterQuery) ? "" : previous.afterQuery,
      message: "文字化けデータをリセットしました。",
    }));
    persistDatasetHistory(migratedHistory);
    setHistoryStatus("文字化けデータをリセットしました。");
    setXStatus("検索条件を安全な形に再作成しました。");
    notify("success", "文字化けデータをリセットしました");
  }

  function handleThemeChange(nextTheme) {
    const nextThemeCategory = getThemeCategory(sampleKey, nextTheme, userOpinion);
    const nextThemeAxisConfig = getThemeAxisPreset(nextTheme, nextThemeCategory, currentSample);
    const nextThemeQueries =
      personaMode === "personaA" && nextThemeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : getThemeQueryCandidates(nextTheme, nextThemeCategory, currentSample);
    const nextPurposeTags =
      personaMode === "personaA" && nextThemeCategory === "romance" && !hasManualHashtagSelection
        ? purposeHashtags(analysisPurposeMode, personaMode)
        : selectedHashtagCandidates;
    const firstCandidate = nextThemeQueries[0];
    const nextBaseQuery = firstCandidate?.base || firstCandidate?.query || "";

    setTheme(nextTheme);
    setAxisConfig(nextThemeAxisConfig);
    setDraftAxisConfig(nextThemeAxisConfig);
    setAxisStatus("テーマ変更に合わせて評価軸を更新しました。利用目的は出力の見せ方に反映します。");
    setGeneratedXQueryCandidates(null);
    setGeneratedBasicKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    setSelectedXQueryCandidateIds(nextThemeQueries.slice(0, 3).map((candidate) => candidate.label));
    setSelectedHashtagCandidates(nextPurposeTags);
    setSelectedHashtagCandidates([]);
    setHasManualHashtagSelection(false);
    setSelectedExcludeTermCandidates([]);
    setHasManualExcludeTermSelection(false);
    setSelectedAxisLinkedKeywords([]);
    setXQueryBase(nextBaseQuery);
    setXQuery(buildXQuery(nextBaseQuery, xQueryFilters));
    setIsManualXQuery(false);
    setQueryDirty(true);
    setHasScoredWithCurrentAxis(false);
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus(externalOpinions.trim() ? "unsaved" : "sample");
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setXStatus("テーマ変更に合わせて、検索候補とハッシュタグ候補をテーマ優先で更新しました。");
  }

  async function checkAnalysisDraftHealth() {
    setAiDraftApiHealth({
      status: "checking",
      label: "確認中",
      details: "",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis-draft/health`);
      const parsed = await parseJsonResponse(response);

      if (!parsed.ok) {
        setAiDraftApiHealth({
          status: "error",
          label: "エラー",
          details: `${parsed.error}${parsed.details ? ` / ${parsed.details}` : ""}`,
        });
        return;
      }

      setAiDraftApiHealth({
        status: parsed.data?.openaiConfigured ? "ready" : "missing-key",
        label: parsed.data?.openaiConfigured ? "利用可能" : "APIキー未設定",
        details: parsed.data?.openaiConfigured
          ? `model: ${parsed.data.model || "unknown"}`
          : parsed.data?.error || "OPENAI_API_KEY が未設定です。",
      });
    } catch (error) {
      setAiDraftApiHealth({
        status: "disconnected",
        label: "server.js未接続",
        details: error.message || "server.jsが起動していない可能性があります。",
      });
    }
  }

  async function handleGenerateAnalysisDraft() {
    if (!theme.trim() || !userOpinion.trim()) {
      setAiDraftError("テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。");
      setAiDraftErrorDetails(null);
      setAiDraftMode("idle");
      setOperationError("aiAxisDraft", "テーマと自分の意見を入力してください。");
      return;
    }

    setOperationRunning("aiAxisDraft", "AIで評価軸候補を作成中...", truncateText(theme, 80));
    setIsAiDraftLoading(true);
    setIsAiDraftApplied(false);
    setAiDraftError("");
    setAiDraftErrorDetails(null);
    setAiDraftMode("loading");
    setAiDraftStatus("AIで評価軸・検索クエリ候補を仮生成しています...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          themeCategory,
          userOpinion,
          analysisMode,
          personaMode,
          personaLabel: currentPersonaConfig.label,
          analysisPurposeMode,
          analysisPurposeLabel: currentAnalysisPurposeConfig.label,
          currentAxisConfig: axisConfig,
          draftAxisConfig,
          previousAxisCandidate: aiDraft?.axisConfig || null,
          regenerateInstruction: aiDraft
            ? "前回候補と違う切り口を少なくとも1つ入れてください。生活実感、構造、未来性、具体性、感情のいずれかの観点を前回より変えてください。"
            : "",
        }),
      });
      const parsed = await parseJsonResponse(response);

      if (!parsed.ok) {
        const fallbackDraft = createFallbackAnalysisDraft(theme, userOpinion, personaMode, currentSample);

        setAiDraft(fallbackDraft);
        setAiDraftInitialQuestions(fallbackDraft.initialQuestions);
        setAiDraftError("AI生成に失敗しました。簡易ルールで仮設定を作成しました。");
        setAiDraftErrorDetails({
          status: parsed.status,
          code: parsed.code,
          details: parsed.details,
        });
        setAiDraftStatus("AI生成に失敗したため、簡易ルールで仮設定を表示しています。この設定は後から自由に編集できます。");
        setAiDraftMode("fallback");
        setOperationError("aiAxisDraft", `AI生成に失敗しました。${parsed.error || ""}`);
        return;
      }

      const payload = parsed.data;
      setAiDraft(payload);
      setAiDraftInitialQuestions(Array.isArray(payload.initialQuestions) ? payload.initialQuestions : []);
      setAiDraftStatus("AI仮生成が完了しました。内容を確認して「このAI候補を適用」を押してください。");
      setAiDraftMode("success");
      setOperationSuccess("aiAxisDraft", "AI評価軸候補を作成しました。", truncateText(theme, 80));
    } catch (error) {
      const fallbackDraft = createFallbackAnalysisDraft(theme, userOpinion, personaMode, currentSample);

      setAiDraft(fallbackDraft);
      setAiDraftInitialQuestions(fallbackDraft.initialQuestions);
      setAiDraftError("AI生成APIに接続できませんでした。簡易ルールで仮設定を作成しました。");
      setAiDraftErrorDetails({
        status: "network",
        code: "AI_DRAFT_NETWORK_ERROR",
        details: error.message || "server.jsが起動していない、またはAPIに接続できない可能性があります。",
      });
      setAiDraftStatus("AI生成に失敗したため、簡易ルールで仮設定を表示しています。この設定は後から自由に編集できます。");
      setAiDraftMode("fallback");
      setOperationError("aiAxisDraft", `AI評価軸生成に失敗しました。理由：${error.message || "不明"}`);
    } finally {
      setIsAiDraftLoading(false);
    }
  }

  function prepareAxisConfigWithLowDescriptions(rawConfig, existingAutoGenerated = EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED) {
    const normalizedConfig = normalizeAxisConfig(rawConfig, currentSample);
    const autoGenerated = { ...EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED };

    ["x", "y", "z"].forEach((axis) => {
      const rawLowDescription = String(rawConfig?.[axis]?.lowDescription || "").trim();
      if (!rawLowDescription || existingAutoGenerated[axis]) {
        const inferredLowDescription = inferLowAxisDescription(
          normalizedConfig[axis].description,
          normalizedConfig[axis].label
        );
        if (inferredLowDescription) {
          normalizedConfig[axis] = {
            ...normalizedConfig[axis],
            lowDescription: inferredLowDescription,
          };
          autoGenerated[axis] = true;
        }
      }
    });

    return { axisConfig: normalizedConfig, autoGenerated };
  }

  function applyAiDraft() {
    if (!aiDraft) {
      setAiDraftError("適用できるAI候補がありません。");
      return;
    }

    const draftPresetKey = aiDraft.axisConfig?.presetKey;
    const usesPersonaAxisPreset = Boolean(PERSONA_CONFIGS[draftPresetKey]);
    const themeAxisConfig = getThemeAxisPreset(theme, themeCategory, currentSample);
    const rawNextAxisConfig = usesPersonaAxisPreset
      ? themeAxisConfig
      : {
          ...aiDraft.axisConfig,
          presetKey: "aiDraft",
          axisSource: aiDraft.axisConfig?.axisSource || "theme",
          themeCategory,
        };
    const { axisConfig: nextAxisConfig, autoGenerated } = prepareAxisConfigWithLowDescriptions(rawNextAxisConfig);
    const nextCandidates = normalizeAiDraftCandidates(aiDraft.queryCandidates);
    const resolvedCandidates =
      personaMode === "personaA" && themeCategory === "romance"
        ? getPersonaAQueryCandidates(selectedVoiceDirections, analysisPurposeMode)
        : nextCandidates.length
          ? nextCandidates
          : themeQueryCandidates;
    const nextAxisKeywords = aiDraft.axisLinkedKeywords || {};
    const nextSelectedAxisKeywords = uniqueValues([
      ...(Array.isArray(nextAxisKeywords.x) ? nextAxisKeywords.x : []),
      ...(Array.isArray(nextAxisKeywords.y) ? nextAxisKeywords.y : []),
      ...(Array.isArray(nextAxisKeywords.z) ? nextAxisKeywords.z : []),
    ]);

    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(autoGenerated);
    setIsAiDraftApplied(true);
    setGeneratedXQueryCandidates(resolvedCandidates);
    setGeneratedBasicKeywords(Array.isArray(aiDraft.basicKeywords) ? aiDraft.basicKeywords : []);
    setGeneratedAxisLinkedKeywords(nextAxisKeywords);
    setSelectedXQueryCandidateIds(resolvedCandidates.map((candidate) => candidate.label));
    setSelectedAxisLinkedKeywords(nextSelectedAxisKeywords);
    setAnalysisMode(aiDraft.suggestedAnalysisMode === "axisDriven" ? "axisDriven" : analysisMode);
    setXQueryBase(resolvedCandidates.map((candidate) => candidate.base).join("\n"));
    setXQuery("");
    setIsManualXQuery(false);
    setAxisStatus("AI候補の評価軸を適用しました。");
    setHasScoredWithCurrentAxis(false);
    setAiDraftStatus("AI候補を適用しました。検索クエリを確認してX取得に進めます。");
    setAiDraftError("");
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
  }

  function toggleXQueryCandidate(index) {
    const candidate = xQueryCandidates[index];

    if (!candidate) return;

    setSelectedXQueryCandidateIds((previous) =>
      previous.includes(candidate.label)
        ? previous.filter((id) => id !== candidate.label)
        : [...previous, candidate.label]
    );
    setQueryDirty(true);
    setIsManualXQuery(false);
    setXStatus(`検索クエリ候補「${candidate.label}」の選択を切り替えました。複数候補はORで結合されます。`);
  }

  function selectAllXQueryCandidates() {
    setSelectedXQueryCandidateIds(xQueryCandidates.map((candidate) => candidate.label));
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus("すべての検索クエリ候補を選択しました。");
  }

  function clearAllXQueryCandidates() {
    setSelectedXQueryCandidateIds([]);
    setIsManualXQuery(true);
    setQueryDirty(true);
    setXStatus("検索クエリ候補をすべて解除しました。手入力クエリを使います。");
  }

  function toggleHashtagCandidate(hashtag) {
    const normalized = normalizeHashtag(hashtag);
    const candidate = hashtagCandidates.find((item) => item.hashtag === normalized);
    if (candidate?.selectionType === "disabled") {
      return;
    }

    setHasManualHashtagSelection(true);
    setSelectedHashtagCandidates((previous) =>
      previous.includes(normalized) ? previous.filter((item) => item !== normalized) : [...previous, normalized]
    );
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus(`ハッシュタグ候補「${normalized}」の選択を切り替えました。`);
  }

  function toggleExcludeTermCandidate(term) {
    const cleanTerm = String(term || "").trim();
    if (!cleanTerm) return;
    const currentSelected = hasManualExcludeTermSelection
      ? selectedExcludeTermCandidates
      : personaMode === "personaA" && themeCategory === "romance"
        ? excludeTermCandidates.map((candidate) => candidate.term)
        : selectedExcludeTermCandidates;
    setHasManualExcludeTermSelection(true);
    setSelectedExcludeTermCandidates((previous) =>
      currentSelected.includes(cleanTerm)
        ? currentSelected.filter((item) => item !== cleanTerm)
        : [...currentSelected, cleanTerm]
    );
    setIsManualXQuery(false);
    setQueryDirty(true);
    setXStatus(`除外語「${cleanTerm}」の選択を切り替えました。`);
  }

  function toggleAxisLinkedKeyword(keyword) {
    setSelectedAxisLinkedKeywords((previous) =>
      previous.includes(keyword) ? previous.filter((item) => item !== keyword) : [...previous, keyword]
    );
    setQueryDirty(true);
  }

  function updateXQueryBase(value) {
    setXQueryBase(value);
    setSelectedXQueryCandidateIds([]);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(value, xQueryFilters));
    setQueryDirty(true);
  }

  function updateXQueryFilter(key, value) {
    const nextFilters = { ...xQueryFilters, [key]: value };

    setXQueryFilters(nextFilters);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(xQueryBase, nextFilters));
    setQueryDirty(true);
  }

  function resetXQueryFilters() {
    const nextFilters = { ...DEFAULT_X_QUERY_FILTERS };

    setXQueryFilters(nextFilters);
    setIsManualXQuery(false);
    setXQuery(buildXQuery(xQueryBase, nextFilters));
    setQueryDirty(true);
    setXStatus("検索条件を初期状態に戻しました。");
  }

  function handlePersonaModeChange(nextMode) {
    if (nextMode === personaMode) {
      return;
    }

    const nextPersonaConfig = personaConfigFor(nextMode);
    const nextPurposeMode = defaultAnalysisPurposeForPersona(nextMode);
    const nextPurposeDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(nextPurposeMode, nextMode);

    setPersonaModeHistory((previous) => [
      ...previous.slice(-9),
      {
        from: personaMode,
        to: nextMode,
        changedAt: new Date().toISOString(),
      },
    ]);
    setPersonaMode(nextMode);
    setAnalysisPurposeMode(nextPurposeMode);
    setSelectedVoiceDirections(nextPurposeDirections);
    if (themeCategory === "romance") {
      const nextQueryCandidates =
        nextMode === "personaA"
          ? getPersonaAQueryCandidates(nextPurposeDirections, nextPurposeMode)
          : getThemeQueryCandidates(theme, themeCategory, currentSample);
      const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;
      const nextPurposeTags =
        nextMode === "personaA" && !hasManualHashtagSelection
          ? purposeHashtags(nextPurposeMode, nextMode)
          : selectedHashtagCandidates;

      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.slice(0, 3).map((candidate) => candidate.label));
      setSelectedHashtagCandidates(nextPurposeTags);
      setHasManualHashtagSelection(false);
      setSelectedExcludeTermCandidates([]);
      setHasManualExcludeTermSelection(false);
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
    }
    setAxisStatus(
      `利用目的を「${nextPersonaConfig.label}」に変更しました。評価軸はテーマ優先のまま、出力の見せ方を更新します。`
    );
    setXStatus(
      themeCategory === "romance"
        ? "恋愛テーマの利用目的に合わせて、検索候補を具体的な恋愛相談フレーズへ更新しました。"
        : "利用目的を変更しました。X取得条件は変更していません。"
    );
    notify("info", `利用目的を「${nextPersonaConfig.label}」に変更しました。`);
    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "利用目的に合わせて出力表現を更新しました。",
      },
    }));
  }

  function handleAnalysisPurposeChange(nextPurposeMode) {
    const normalizedPurposeMode = normalizeAnalysisPurposeMode(nextPurposeMode, personaMode);
    const purposeConfig = analysisPurposeConfigFor(normalizedPurposeMode, personaMode);
    const nextDirections = hasManualVoiceDirectionSelection
      ? normalizeVoiceDirections(selectedVoiceDirections)
      : purposeVoiceDirections(normalizedPurposeMode, personaMode);

    setAnalysisPurposeMode(normalizedPurposeMode);
    setSelectedVoiceDirections(nextDirections);

    if (personaMode === "personaA" && themeCategory === "romance") {
      const nextQueryCandidates = getPersonaAQueryCandidates(nextDirections, normalizedPurposeMode);
      const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;
      const nextPurposeTags = hasManualHashtagSelection ? selectedHashtagCandidates : purposeHashtags(normalizedPurposeMode, personaMode);

      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.slice(0, 3).map((candidate) => candidate.label));
      setSelectedHashtagCandidates(nextPurposeTags);
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
      setXStatus(`${JP_UI_LABELS.analysisPurpose}を「${purposeConfig.label}」に更新しました。検索候補を再作成しました。`);
    } else {
      setXStatus(`${JP_UI_LABELS.analysisPurpose}を「${purposeConfig.label}」に更新しました。`);
    }

    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: `${JP_UI_LABELS.analysisPurpose}に合わせてZone11のまとめ方を更新しました。`,
      },
    }));
  }

  function applyPersonaAQueryDirections(nextDirections, nextPurposeMode = analysisPurposeMode) {
    const normalizedDirections = normalizeVoiceDirections(nextDirections);
    const nextQueryCandidates = getPersonaAQueryCandidates(normalizedDirections, nextPurposeMode);
    const nextBase = nextQueryCandidates[0]?.base || nextQueryCandidates[0]?.query || xQueryBase;

    setSelectedVoiceDirections(normalizedDirections);
    if (personaMode === "personaA" && themeCategory === "romance") {
      setGeneratedXQueryCandidates(null);
      setSelectedXQueryCandidateIds(nextQueryCandidates.map((candidate) => candidate.label));
      setXQueryBase(nextBase);
      setXQuery(buildXQuery(nextBase, xQueryFilters));
      setIsManualXQuery(false);
      setQueryDirty(true);
      setXStatus(`${JP_UI_LABELS.voicesToCollect}を更新しました。${JP_UI_LABELS.queryAdjustment}を反映しています。`);
    }
  }

  function toggleVoiceDirection(directionKey) {
    setHasManualVoiceDirectionSelection(true);
    const normalizedPrevious = normalizeVoiceDirections(selectedVoiceDirections);
    const nextDirections = normalizedPrevious.includes(directionKey)
      ? normalizedPrevious.filter((key) => key !== directionKey)
      : [...normalizedPrevious, directionKey];

    applyPersonaAQueryDirections(nextDirections.length ? nextDirections : DEFAULT_PERSONA_A_VOICE_DIRECTIONS);
  }

  function selectAxisPreset(presetKey) {
    if (presetKey === "custom") {
      setDraftAxisConfig((previous) => ({
        ...normalizeAxisConfig(previous, currentSample),
        presetKey: "custom",
      }));
      setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
      setAxisStatus("カスタム評価軸を編集中です。適用すると反映されます。");
      setHasScoredWithCurrentAxis(false);
      return;
    }

    const nextAxisConfig = axisConfigFromPreset(presetKey, currentSample);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setAxisStatus(`${AXIS_PRESETS[presetKey]?.label || "評価軸"}を選択しました。適用すると反映されます。`);
    setHasScoredWithCurrentAxis(false);
  }

  function updateDraftAxis(axis, key, value) {
    setDraftAxisConfig((previous) => {
      const nextAxis = {
        ...previous[axis],
        [key]: value,
      };

      if ((key === "label" || key === "description") && axisLowDescriptionAutoGenerated[axis]) {
        const nextLabel = key === "label" ? value : nextAxis.label;
        const nextHighDescription = key === "description" ? value : nextAxis.description;
        nextAxis.lowDescription = inferLowAxisDescription(nextHighDescription, nextLabel);
      }

      return {
        ...previous,
        presetKey: "custom",
        [axis]: nextAxis,
      };
    });
    if (key === "lowDescription") {
      setAxisLowDescriptionAutoGenerated((previous) => ({
        ...previous,
        [axis]: false,
      }));
    }
    setHasScoredWithCurrentAxis(false);
    setOperationStatus((previous) => ({
      ...previous,
      applyAxis: {
        ...(previous.applyAxis || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "評価軸が変更されています。",
      },
      rescore: {
        ...(previous.rescore || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "再スコアリングが必要です。",
      },
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "idle",
        message: "フィードバックは古い可能性があります。",
      },
    }));
  }

  function applyAxisConfig() {
    setOperationRunning("applyAxis", "評価軸を適用中...", axisPresetLabel(draftAxisConfig));
    const { axisConfig: nextAxisConfig, autoGenerated } = prepareAxisConfigWithLowDescriptions(
      draftAxisConfig,
      axisLowDescriptionAutoGenerated
    );

    setAxisConfig(nextAxisConfig);
    setDraftAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(autoGenerated);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setAxisStatus("評価軸を適用しました。現在の評価軸でスコアとフィードバックを再計算しました。");
    setHasScoredWithCurrentAxis(true);
    setOperationSuccess("applyAxis", "評価軸を適用しました。", axisPresetLabel(nextAxisConfig));
    setOperationSuccess("rescore", "現在の評価軸で再スコアリングしました。", axisPresetLabel(nextAxisConfig));
    setOperationStatus((previous) => ({
      ...previous,
      feedback: {
        ...(previous.feedback || EMPTY_OPERATION_STATUS),
        status: "success",
        message: "ルールベース表示中",
        lastSuccessAt: new Date().toISOString(),
      },
    }));
  }

  function resetAxisConfigToThemeDefault() {
    const nextAxisConfig = createThemeAxisConfig(currentSample);

    setDraftAxisConfig(nextAxisConfig);
    setAxisConfig(nextAxisConfig);
    setAxisLowDescriptionAutoGenerated(EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED);
    setSelectedAxisLinkedKeywords([]);
    setGeneratedAxisLinkedKeywords(null);
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setAxisStatus("テーマ標準の評価軸に戻しました。スコアとフィードバックを再計算しました。");
    setHasScoredWithCurrentAxis(true);
  }

  function regenerateFeedback() {
    setAxisStatus("現在の評価軸でフィードバックを再生成しました。");
  }

  function rescoreWithCurrentAxis() {
    if (!canRescoreWithCurrentAxis) {
      setAxisStatus(rescoreButtonText);
      return;
    }

    applyAxisConfig();
  }

  function isInvalidXQueryErrorMessage(message) {
    return /invalid|parameter|query|演算子|検索/i.test(String(message || ""));
  }

  function isApiCreditErrorMessage(message) {
    return /does not have any credits|no credits|credits to fulfill this request|credit/i.test(String(message || ""));
  }

  async function requestXPosts(query, limit, options = {}) {
    const queryInfo = buildSafeXQueryFromRaw(query, {
      sampleKey: themeCategory,
      theme,
      userOpinion,
      personaMode,
      analysisPurposeMode,
      hashtags: options.hashtags ?? selectedHashtagValues,
      excludeTerms: options.excludeTerms ?? selectedExcludeTermValues,
    });
    const attempts = uniqueByValue([
      queryInfo.finalQueryForXApi,
      queryInfo.fallbackQueryForXApi,
      buildSafeXQuery({
        includeGroups: buildPurposeFallbackIncludeGroups({ sampleKey: themeCategory, theme, userOpinion, personaMode, analysisPurposeMode }).length
          ? buildPurposeFallbackIncludeGroups({ sampleKey: themeCategory, theme, userOpinion, personaMode, analysisPurposeMode }).slice(0, 3)
          : [["恋愛相談 不安"]],
        hashtags: [],
        excludeTerms: [],
      }).query,
    ]).filter((query) => query && !looksLikeMojibake(query));
    let lastErrorMessage = "";

    for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
      const attemptQuery = attempts[attemptIndex];
      const attemptedAt = new Date().toISOString();
      const params = new URLSearchParams({
        query: attemptQuery,
        max_results: String(limit),
      });
      const response = await fetch(`${API_BASE_URL}/api/x-search?${params.toString()}`, {
        signal: options.signal || xFetchAbortControllerRef.current?.signal,
      });
      const payload = await response.json();

      if (!response.ok) {
        lastErrorMessage = payload.error || "X API取得に失敗しました。";
        const isCreditError = isApiCreditErrorMessage(lastErrorMessage);
        if (attemptIndex < attempts.length - 1 && isInvalidXQueryErrorMessage(lastErrorMessage)) {
          continue;
        }

        const error = new Error(
          isCreditError
            ? JP_UI_LABELS.apiCreditExhaustedMessage
            : isInvalidXQueryErrorMessage(lastErrorMessage)
              ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
              : lastErrorMessage
        );
        error.errorType = isCreditError ? "api_credit_exhausted" : "x_api_error";
        error.originalErrorMessage = lastErrorMessage;
        error.timestamp = attemptedAt;
        error.rawQuery = queryInfo.rawQuery;
        error.safeQuery = queryInfo.safeQuery;
        error.fallbackQuery = queryInfo.fallbackQuery;
        error.finalQueryForXApi = attemptQuery;
        error.apiErrorMessage = lastErrorMessage;
        error.queryBuildWarnings = queryInfo.queryBuildWarnings;
        error.sanitizedHashtagRemovedParts = queryInfo.sanitizedHashtagRemovedParts || [];
        error.sanitizedExcludeRemovedParts = queryInfo.sanitizedExcludeRemovedParts || [];
        error.queryLength = attemptQuery.length;
        throw error;
      }

    const posts = Array.isArray(payload.posts) ? payload.posts : [];
    const texts = posts
      .map((post) => String(post.text || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);

      return {
        posts,
        texts,
        queryInfo: {
          ...queryInfo,
          finalQuery: attemptQuery,
          finalQueryForXApi: attemptQuery,
          queryBuildStatus: attemptIndex > 0 ? "fallback" : "safe",
          fallbackUsed: attemptIndex > 0,
          retryCount: attemptIndex,
          apiErrorMessage: lastErrorMessage,
        },
      };
    }

    throw new Error("X API取得に失敗しました。");
  }

  function queryBuildFieldsForStage(queryInfo = {}, fallbackQuery = "") {
    return {
      rawQuery: queryInfo.rawQuery || fallbackQuery,
      safeQuery: queryInfo.safeQuery || queryInfo.finalQuery || fallbackQuery,
      fallbackQuery: queryInfo.fallbackQuery || "",
      finalQueryForXApi: queryInfo.finalQueryForXApi || queryInfo.finalQuery || queryInfo.safeQuery || fallbackQuery,
      queryBuildStatus: queryInfo.queryBuildStatus || "safe",
      queryBuildWarnings: queryInfo.queryBuildWarnings || [],
      apiErrorMessage: queryInfo.apiErrorMessage || "",
      errorType: queryInfo.errorType || "",
      originalErrorMessage: queryInfo.originalErrorMessage || "",
      errorTimestamp: queryInfo.errorTimestamp || "",
      retryCount: queryInfo.retryCount || 0,
      fallbackUsed: Boolean(queryInfo.fallbackUsed),
      sanitizedHashtagRemovedParts: queryInfo.sanitizedHashtagRemovedParts || [],
      sanitizedExcludeRemovedParts: queryInfo.sanitizedExcludeRemovedParts || [],
    };
  }

  function prepareXFetch() {
    setExternalOpinions("");
    setXPosts([]);
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setExpandedClusterIds({});
    setSelectedClusterId("");
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveDatasetId("");
    setActiveClusterRunId("");
    setXDataStatus("fetching");
    setHistoryStatus("");
  }

  function applyFetchedXPosts(posts, texts) {
    setExternalOpinions(texts.join("\n"));
    setXPosts(posts);
    setXDataStatus("unsaved");
    setHasScoredWithCurrentAxis(false);
    clearActiveClusterRunState();
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    resetAutoSummaryState();
    setQueryDirty(false);
  }

  function validateXFetchInput(query, limit) {
    const maxFetchCount = PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH;
    if (!query) {
      setXStatus("X検索キーワードを入力してください。");
      setOperationError("fetchX", "X検索キーワードを入力してください。");
      return false;
    }

    if (isEffectiveQueryTooLong && query === effectiveQuery.trim()) {
      setXStatus("検索クエリが長すぎる可能性があります。候補を減らしてください。");
      setOperationError("fetchX", "検索クエリが長すぎる可能性があります。");
      return false;
    }

    if (!Number.isFinite(limit) || limit < 10 || limit > maxFetchCount) {
      const message = `取得件数は10-${maxFetchCount}の範囲で指定してください。`;
      setXStatus(message);
      setOperationError("fetchX", message);
      return false;
    }

    return true;
  }

  async function runNormalXFetch(query, limit, successSuffix = "") {
    const fetchSourceLabel = PUBLIC_PREVIEW_MODE ? "外部データ" : "X API";
    setOperationRunning("fetchX", `${fetchSourceLabel}から最大${limit}件を取得中...`, truncateText(query, 120));
    prepareXFetch();
    setXStatus(`${fetchSourceLabel}から最大${limit}件を取得中...`);

    const { posts, texts, queryInfo } = await requestXPosts(query, limit);
    const executedQuery = queryInfo?.finalQuery || query;
    if (texts.length === 0) {
      setXStatus("取得結果が0件でした。検索語を変えてください。");
      setXPosts([]);
      setOperationError("fetchX", "取得結果が0件でした。検索語を変えてください。", truncateText(query, 120));
      return;
    }

    applyFetchedXPosts(
      attachFetchMetaToPosts(posts, {
        stageNo: 1,
        fetchType: "normal",
        sourceQuery: executedQuery,
        fetchedAt: new Date().toISOString(),
        batchIndex: 1,
      }),
      texts
    );
    setXStatus(`取得完了：${texts.length}件。前回分を消して、今回の取得結果だけに置き換えました。${successSuffix}`);
    setOperationSuccess("fetchX", `${texts.length}件取得しました。`, truncateText(query, 120));
  }

  async function requestQueryDiagnosisAdvice(query, diagnosis, options = {}) {
    const noiseBreakdown = diagnosis?.noiseBreakdown || [];
    const queryTermDiagnosis = diagnosis?.queryTermDiagnosis || [];
    const fallback = buildRuleBasedQueryAdvice({
      theme,
      userOpinion,
      currentQuery: query,
      axisConfig,
      diagnosis,
      noiseBreakdown,
      queryTermDiagnosis,
    });

    if (!diagnosis || diagnosis.status === "good") {
      return fallback;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/query-diagnosis-improve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: options.signal || xFetchAbortControllerRef.current?.signal,
        body: JSON.stringify({
          theme,
          userOpinion,
          currentQuery: query,
          axisConfig,
          diagnosis,
          noiseBreakdown,
          queryTermDiagnosis,
          sampleKeptPosts: diagnosis.sampleKeptPosts || [],
          sampleNoisePosts: diagnosis.sampleNoisePosts || [],
          analysisMode,
          personaMode,
          personaLabel: currentPersonaConfig.label,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "取得改善アドバイスの取得に失敗しました。");
      }

      const improvedQueryCandidates = Array.isArray(payload.improvedQueryCandidates)
        ? payload.improvedQueryCandidates
            .map((candidate, index) => ({
              label: String(candidate.label || `改善候補${index + 1}`),
              query: stripXCommonFilters(candidate.query || "").trim(),
              reason: String(candidate.reason || candidate.description || "AIが提案した改善クエリです。"),
            }))
            .filter((candidate) => candidate.query)
        : [];
      const improvedHashtagCandidates = Array.isArray(payload.improvedHashtagCandidates)
        ? payload.improvedHashtagCandidates
            .map((candidate) => ({
              label: String(candidate.label || candidate.hashtag || "").replace(/^#/, ""),
              hashtag: normalizeHashtag(candidate.hashtag || candidate.label || ""),
              reason: String(candidate.reason || "AIが提案したハッシュタグ候補です。"),
              noiseRisk: String(candidate.noiseRisk || "中"),
              selectionType: String(candidate.selectionType || ""),
            }))
            .filter((candidate) => candidate.hashtag)
        : [];

      return {
        ...fallback,
        ...payload,
        mainProblems: Array.isArray(payload.mainProblems)
          ? payload.mainProblems
          : Array.isArray(payload.problemReasons)
            ? payload.problemReasons
            : fallback.mainProblems,
        queryTermAdvice: Array.isArray(payload.queryTermAdvice) ? payload.queryTermAdvice : fallback.queryTermAdvice,
        improvedQueryCandidates: improvedQueryCandidates.length ? improvedQueryCandidates : fallback.improvedQueryCandidates,
        improvedHashtagCandidates,
        recommendedQuery: payload.recommendedQuery || improvedQueryCandidates[0]?.query || fallback.recommendedQuery,
        source: payload.source || "api",
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      return fallback;
    }
  }

  async function fetchXOpinions(queryOverride = "", decision = "") {
    const query = String(queryOverride || effectiveQuery).trim();
    const limit = Number(xMaxResults);

    if (!validateXFetchInput(query, limit)) {
      return;
    }

    xFetchAbortControllerRef.current?.abort();
    xFetchAbortControllerRef.current = new AbortController();
    const shouldUseStagedFetch = stagedFetchEnabled && limit > STAGED_FETCH_INITIAL_COUNT;
    const activeNoiseRelevanceThreshold =
      decision === "weak_noise_retry" ? 3 : NOISE_RELEVANCE_THRESHOLD;
    const previousDiagnosisForComparison = stagedFetchState.diagnosis;

    try {
      if (decision !== "weak_noise_retry") {
        setNoiseRelevanceThreshold(NOISE_RELEVANCE_THRESHOLD);
      }

      if (!shouldUseStagedFetch) {
        setStagedFetchState((previous) => ({
          ...previous,
          targetCount: limit,
          diagnosisDecision: decision || "normal",
          diagnosisStatus: "idle",
          shouldPause: false,
          message: "通常取得で実行しました。",
        }));
        await runNormalXFetch(query, limit);
        return;
      }

      setOperationRunning("fetchX", `まず${STAGED_FETCH_INITIAL_COUNT}件で取得診断中...`, truncateText(query, 120));
      prepareXFetch();
      setStagedFetchState((previous) => ({
        ...previous,
        enabled: true,
        targetCount: limit,
        currentStage: STAGED_FETCH_INITIAL_COUNT,
        stageLogs: decision === "improved" || decision === "manual" ? previous.stageLogs || [] : [],
        fetchedCount: 0,
        totalFetchedCount: 0,
        currentBatchCount: 0,
        accumulatedCount: 0,
        currentDataCount: 0,
        totalApiFetchedCount: 0,
        remainingCount: limit,
        nextFetchCount: calculateNextAddFetchCount(0, limit),
        initialFetchCount: decision === "improved" ? previous.initialFetchCount || 0 : 0,
        diagnosisStatus: "checking",
        shouldPause: false,
        diagnosis: null,
        noiseBreakdown: [],
        queryTermDiagnosis: [],
        aiQueryAdvice: null,
        improvementComparison: decision === "improved" ? previous.improvementComparison : null,
        improvedQueryCandidates: [],
        selectedImprovedQueryIndexes: [0],
        recommendedQuery: "",
        diagnosisDecision: decision,
        lastAction: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
        beforeQuery: decision === "improved" ? previous.beforeQuery || effectiveQuery : previous.beforeQuery || "",
        afterQuery: query,
        weakNoiseRetryAvailable: false,
        message: `${STAGED_FETCH_INITIAL_COUNT}件でクエリ品質を診断中...`,
      }));
      setXStatus(`${STAGED_FETCH_INITIAL_COUNT}件で取得診断中...`);

      const firstBatch = await requestXPosts(query, STAGED_FETCH_INITIAL_COUNT);
      const firstQueryInfo = firstBatch.queryInfo || {};
      const firstExecutedQuery = firstQueryInfo.finalQuery || query;
      if (firstBatch.texts.length === 0) {
        throw new Error("30件診断の取得結果が0件でした。検索語を変えてください。");
      }

      const initialFetchMeta = {
        stageNo:
          decision === "improved" || decision === "manual"
            ? (stagedFetchState.stageLogs || []).length + 1
            : 1,
        fetchType: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
        sourceQuery: firstExecutedQuery,
        fetchedAt: new Date().toISOString(),
        batchIndex:
          decision === "improved"
            ? (stagedFetchState.improvedAddFetchCount || stagedFetchState.improvedRefetchCount || 0) + 1
            : 1,
      };
      applyFetchedXPosts(attachFetchMetaToPosts(firstBatch.posts, initialFetchMeta), firstBatch.texts);
      const diagnosis = diagnoseQueryQuality(
        firstBatch.posts,
        firstExecutedQuery,
        themeCategory,
        axisConfig,
        noiseFilteringEnabled,
        theme,
        userOpinion,
        activeNoiseRelevanceThreshold
      );
      const queryAdvice = await requestQueryDiagnosisAdvice(firstExecutedQuery, diagnosis);
      const improvedQueryCandidates = queryAdvice.improvedQueryCandidates?.length
        ? queryAdvice.improvedQueryCandidates
        : buildImprovedQueryCandidates(theme, userOpinion, firstExecutedQuery, diagnosis, axisConfig);
      const recommendedQuery = queryAdvice.recommendedQuery || improvedQueryCandidates[0]?.query || "";
      const improvementComparison =
        decision === "improved" ? buildImprovementComparison(previousDiagnosisForComparison, diagnosis) : null;
      const initialStageLog = makeStageLogEntry({
        stageNo:
          decision === "improved" || decision === "manual"
            ? (stagedFetchState.stageLogs || []).length + 1
            : 1,
        action: decision === "improved" ? "improved_add" : decision === "manual" ? "manual" : "initial",
        query: firstExecutedQuery,
        fetchedCount: firstBatch.texts.length,
        accumulatedCount: firstBatch.texts.length,
        diagnosis,
        beforeQuery: decision === "improved" ? stagedFetchState.beforeQuery || effectiveQuery : "",
        afterQuery: firstExecutedQuery,
        targetCount: limit,
        remainingCount: Math.max(0, limit - firstBatch.texts.length),
        nextFetchCount: calculateNextAddFetchCount(firstBatch.texts.length, limit),
        requestedFetchCount: STAGED_FETCH_INITIAL_COUNT,
        apiReturnedCount: firstBatch.texts.length,
        newUniqueCount: firstBatch.texts.length,
        duplicateSkippedCount: 0,
        queryKind: queryKindLabel(selectedHashtagValues.length, firstExecutedQuery),
        usedHashtags: selectedHashtagValues,
        usedExcludeTerms: selectedExcludeTermValues,
        ...queryBuildFieldsForStage(firstQueryInfo, query),
      });

      setStagedFetchState((previous) => ({
        ...previous,
        currentStage: STAGED_FETCH_INITIAL_COUNT,
        fetchedCount: firstBatch.texts.length,
        currentBatchCount: firstBatch.texts.length,
        totalFetchedCount: firstBatch.texts.length,
        accumulatedCount: firstBatch.texts.length,
        currentDataCount: firstBatch.texts.length,
        totalApiFetchedCount:
          decision === "improved"
            ? (previous.totalApiFetchedCount || 0) + firstBatch.texts.length
            : firstBatch.texts.length,
        remainingCount: Math.max(0, limit - firstBatch.texts.length),
        nextFetchCount: calculateNextAddFetchCount(firstBatch.texts.length, limit),
        stageLogs:
          decision === "improved" || decision === "manual"
            ? [...(previous.stageLogs || []), initialStageLog]
            : [initialStageLog],
        diagnosisStatus: diagnosis.status,
        shouldPause: diagnosis.status !== "good",
        diagnosis,
        noiseBreakdown: diagnosis.noiseBreakdown || [],
        queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
        aiQueryAdvice: queryAdvice,
        improvementComparison,
        improvedQueryCandidates,
        selectedImprovedQueryIndexes: [0],
        recommendedQuery,
        weakNoiseRetryAvailable: diagnosis.analysisCandidateCount === 0 && noiseFilteringEnabled,
        improvedRefetchCount:
          decision === "improved" ? (previous.improvedRefetchCount || 0) + 1 : previous.improvedRefetchCount || 0,
        improvedAddFetchCount:
          decision === "improved"
            ? (previous.improvedAddFetchCount || previous.improvedRefetchCount || 0) + 1
            : previous.improvedAddFetchCount || 0,
        initialFetchCount: decision === "improved" ? previous.initialFetchCount || 1 : (previous.initialFetchCount || 0) + 1,
        message:
          diagnosis.status === "good"
            ? "取得診断は良好です。本取得へ進みます。"
            : decision === "improved" && diagnosis.status === "bad"
              ? "改善クエリでも取得が不調です。検索語がまだ狭すぎる、該当投稿が少ない、またはノイズ除去が強すぎる可能性があります。"
              : diagnosis.status === "warning"
              ? "取得は可能ですが、ノイズがやや多いです。改善クエリを検討できます。"
              : "取得が不調です。現在のクエリでは分析対象が十分に集まっていません。",
      }));

      if (diagnosis.status !== "good") {
        setXStatus(
          `取得診断：${diagnosis.status === "warning" ? "注意" : "不調"}。${firstBatch.texts.length}件中、分析対象は${diagnosis.analysisCandidateCount}件です。`
        );
        setOperationError(
          "fetchX",
          `取得診断で停止中：分析対象${diagnosis.analysisCandidateCount}件 / ノイズ率${formatPercent(diagnosis.noiseRate)}`,
          truncateText(query, 120)
        );
        return;
      }

      setXStatus(`取得診断は良好です。目標${limit}件まで本取得します...`);
      setOperationRunning("fetchX", `取得診断後、本取得中... 最大${limit}件`, truncateText(query, 120));
      const fullBatch = await requestXPosts(query, limit);
      const fullQueryInfo = fullBatch.queryInfo || {};
      const fullExecutedQuery = fullQueryInfo.finalQuery || query;
      if (fullBatch.texts.length === 0) {
        throw new Error("本取得の結果が0件でした。検索語を変えてください。");
      }

      applyFetchedXPosts(fullBatch.posts, fullBatch.texts);
      setStagedFetchState((previous) => ({
        ...previous,
        currentStage: limit,
        fetchedCount: fullBatch.texts.length,
        currentBatchCount: fullBatch.texts.length,
        totalFetchedCount: fullBatch.texts.length,
        accumulatedCount: fullBatch.texts.length,
        currentDataCount: fullBatch.texts.length,
        totalApiFetchedCount: (previous.totalApiFetchedCount || 0) + fullBatch.texts.length,
        remainingCount: Math.max(0, limit - fullBatch.texts.length),
        nextFetchCount: calculateNextAddFetchCount(fullBatch.texts.length, limit),
        stageLogs: [
          ...(previous.stageLogs || []),
          makeStageLogEntry({
            stageNo: (previous.stageLogs || []).length + 1,
            action: "full_refetch",
            query: fullExecutedQuery,
            fetchedCount: fullBatch.texts.length,
            accumulatedCount: fullBatch.texts.length,
            diagnosis,
            targetCount: limit,
            remainingCount: Math.max(0, limit - fullBatch.texts.length),
            nextFetchCount: calculateNextAddFetchCount(fullBatch.texts.length, limit),
            requestedFetchCount: limit,
            apiReturnedCount: fullBatch.texts.length,
            newUniqueCount: fullBatch.texts.length,
            duplicateSkippedCount: 0,
            queryKind: queryKindLabel(selectedHashtagValues.length, fullExecutedQuery),
            usedHashtags: selectedHashtagValues,
            usedExcludeTerms: selectedExcludeTermValues,
            ...queryBuildFieldsForStage(fullQueryInfo, query),
          }),
        ],
        diagnosisStatus: "good",
        shouldPause: false,
        diagnosisDecision: decision || "continued",
        lastAction: "full_refetch",
        message: "診断後、本取得まで完了しました。",
      }));
      setXStatus(`取得完了：${fullBatch.texts.length}件。診断後、本取得のために再取得しました。`);
      setOperationSuccess("fetchX", `${fullBatch.texts.length}件取得しました。診断結果は良好です。`, truncateText(query, 120));
    } catch (error) {
      if (error?.name === "AbortError") {
        setXDataStatus(activeDatasetId ? "cached" : "sample");
        setXStatus("外部意見取得を停止しました。");
        setOperationError("fetchX", "外部意見取得を停止しました。");
        setStagedFetchState((previous) => ({
          ...previous,
          diagnosisStatus: "bad",
          shouldPause: true,
          stopReason: "user_stopped",
          message: "ユーザー操作で外部意見取得を停止しました。",
        }));
        return;
      }

      setXDataStatus(activeDatasetId ? "cached" : "sample");
      setStagedFetchState((previous) => ({
        ...previous,
        diagnosisStatus: "bad",
        shouldPause: true,
        message: error.message || "取得診断またはX取得に失敗しました。",
      }));
      setXStatus(`取得失敗：${error.message}`);
      setOperationError("fetchX", `X取得に失敗しました。理由：${error.message}`, truncateText(query, 120));
    }
  }

  async function fetchXOpinionsUserAuto() {
    const initialQuery = String(effectiveQuery).trim();
    const targetCount = Number(xMaxResults);

    if (!validateXFetchInput(initialQuery, targetCount)) {
      return;
    }

    if (targetCount <= STAGED_FETCH_INITIAL_COUNT || !stagedFetchEnabled) {
      await fetchXOpinions(initialQuery);
      return;
    }

    const startedAt = new Date().toISOString();
    let activeQuery = initialQuery;
    let accumulatedPosts = [];
    let accumulatedTexts = [];
    let stageLogs = [];
    let latestDiagnosis = null;
    let latestAdvice = null;
    let latestImprovedCandidates = [];
    let latestRecommendedQuery = "";
    let latestComparison = null;
    let previousDiagnosis = null;
    let stopReason = "";
    let noImprovementRounds = 0;
    let improvedAddFetchCount = 0;
    let continueRemainingCount = 0;
    let beforeQuery = "";
    let afterQuery = initialQuery;
    let activeHashtags = selectedHashtagValues;
    let activeExcludeTerms = selectedExcludeTermValues;
    let apiZeroRetries = 0;
    let noNewUniqueRetries = 0;

    try {
      setNoiseRelevanceThreshold(NOISE_RELEVANCE_THRESHOLD);
      setOperationRunning(
        "fetchX",
        `外部意見を自動取得中... 0 / ${targetCount}件`,
        truncateText(initialQuery, 120)
      );
      prepareXFetch();
      setXStatus(`外部意見を取得中... 0 / ${targetCount}件。検索条件を自動調整しています。`);
      setStagedFetchState((previous) => ({
        ...previous,
        enabled: true,
        targetCount,
        currentStage: 0,
        stageLogs: [],
        fetchedCount: 0,
        totalFetchedCount: 0,
        currentBatchCount: 0,
        accumulatedCount: 0,
        currentDataCount: 0,
        totalApiFetchedCount: 0,
        remainingCount: targetCount,
        nextFetchCount: calculateNextAddFetchCount(0, targetCount),
        initialFetchCount: 0,
        diagnosisStatus: "checking",
        shouldPause: false,
        diagnosis: null,
        noiseBreakdown: [],
        queryTermDiagnosis: [],
        aiQueryAdvice: null,
        improvementComparison: null,
        improvedQueryCandidates: [],
        selectedImprovedQueryIndexes: [0],
        recommendedQuery: "",
        diagnosisDecision: "auto_user",
        lastAction: "auto_user_start",
        beforeQuery: "",
        afterQuery: initialQuery,
        improvedRefetchCount: 0,
        improvedAddFetchCount: 0,
        continueRemainingCount: 0,
        weakNoiseRetryAvailable: false,
        message: "外部意見を自動取得中です。まず30件を取得して品質を診断します。",
      }));

      const autoFetchSafetyRoundLimit = Math.max(
        MAX_USER_AUTO_FETCH_ROUNDS,
        Math.ceil(targetCount / Math.max(1, MIN_ADD_FETCH_COUNT)) + MAX_API_ZERO_RETRIES + MAX_NO_NEW_UNIQUE_RETRIES + 10
      );

      for (let round = 1; round <= autoFetchSafetyRoundLimit; round += 1) {
        const remainingCount = Math.max(0, targetCount - accumulatedTexts.length);
        if (remainingCount <= 0) {
          stopReason = "target_reached";
          break;
        }

        const requestedFetchCount = calculateNextAddFetchCount(
          accumulatedTexts.length,
          targetCount,
          round === 1 ? STAGED_FETCH_INITIAL_COUNT : DEFAULT_ADD_FETCH_COUNT
        );
        const action = round === 1 ? "initial" : activeQuery === initialQuery ? "continue_add" : "improved_add";
        const actionLabel =
          round === 1
            ? "初回30件診断"
            : action === "improved_add"
              ? "自動調整クエリで追加取得"
              : "このクエリのまま追加取得";

        setXStatus(
          `外部意見を取得中... ${accumulatedTexts.length} / ${targetCount}件。${round}回目：${actionLabel}`
        );
        setOperationRunning(
          "fetchX",
          `外部意見を自動取得中... ${accumulatedTexts.length} / ${targetCount}件`,
          truncateText(activeQuery, 120)
        );
        setStagedFetchState((previous) => ({
          ...previous,
          diagnosisStatus: "checking",
          lastAction: action,
          message: `${round}回目：${actionLabel}中です。`,
          nextFetchCount: requestedFetchCount,
        }));

        const batch = await requestXPosts(activeQuery, requestedFetchCount, {
          hashtags: activeHashtags,
          excludeTerms: activeExcludeTerms,
        });
        const queryInfo = batch.queryInfo || {};
        const executedQuery = queryInfo.finalQuery || activeQuery;
        const apiReturnedCount = batch.texts.length;
        if (batch.texts.length === 0) {
          apiZeroRetries += 1;
          const roundStopReason = "api_returned_zero";
          const stageLog = makeStageLogEntry({
            stageNo: round,
            action,
            query: executedQuery,
            fetchedCount: 0,
            accumulatedCount: accumulatedTexts.length,
            diagnosis: latestDiagnosis,
            beforeQuery,
            afterQuery: executedQuery,
            targetCount,
            remainingCount: Math.max(0, targetCount - accumulatedTexts.length),
            nextFetchCount: calculateNextAddFetchCount(accumulatedTexts.length, targetCount),
            requestedFetchCount,
            apiReturnedCount: 0,
            rawFetchedCount: 0,
            newUniqueCount: 0,
            duplicateSkippedCount: 0,
            noiseRemovedCount: 0,
            addedToCurrentDataCount: 0,
            stopReason: roundStopReason,
            queryKind: queryKindLabel(activeHashtags.length, executedQuery),
            usedHashtags: activeHashtags,
            usedExcludeTerms: activeExcludeTerms,
            ...queryBuildFieldsForStage(queryInfo, activeQuery),
          });
          stageLogs = [...stageLogs, stageLog];
          setStagedFetchState((previous) => ({
            ...previous,
            stageLogs,
            currentStage: round,
            currentBatchCount: 0,
            fetchedCount: 0,
            totalApiFetchedCount: previous.totalApiFetchedCount || 0,
            remainingCount: Math.max(0, targetCount - accumulatedTexts.length),
            stopReason: roundStopReason,
            message: stopReasonLabel(roundStopReason),
          }));

          if (apiZeroRetries <= MAX_API_ZERO_RETRIES && round < autoFetchSafetyRoundLimit) {
            beforeQuery = beforeQuery || executedQuery;
            activeHashtags = [];
            activeExcludeTerms = activeExcludeTerms.slice(0, 4);
            activeQuery = makeRetryQueryFromSafeInfo(queryInfo, theme, userOpinion) || executedQuery;
            afterQuery = activeQuery;
            continue;
          }

          stopReason = apiZeroRetries > MAX_API_ZERO_RETRIES ? "api_returned_zero" : roundStopReason;
          break;
        }

        const fetchMeta = {
          stageNo: round,
          fetchType: action,
          sourceQuery: executedQuery,
          fetchedAt: new Date().toISOString(),
          batchIndex: round,
        };
        const nextPosts = attachFetchMetaToPosts(batch.posts, fetchMeta);
        const mergedPosts = mergePostsByText(accumulatedPosts, nextPosts, targetCount);
        const mergedTexts = textsFromPosts(mergedPosts);
        const addedCount = Math.max(0, mergedTexts.length - accumulatedTexts.length);
        const duplicateSkippedCount = Math.max(0, apiReturnedCount - addedCount);

        latestDiagnosis = diagnoseQueryQuality(
          mergedPosts,
          executedQuery,
          themeCategory,
          axisConfig,
          noiseFilteringEnabled,
          theme,
          userOpinion,
          NOISE_RELEVANCE_THRESHOLD
        );
        const batchDiagnosis = diagnoseQueryQuality(
          nextPosts,
          executedQuery,
          themeCategory,
          axisConfig,
          noiseFilteringEnabled,
          theme,
          userOpinion,
          NOISE_RELEVANCE_THRESHOLD
        );
        latestAdvice = await requestQueryDiagnosisAdvice(executedQuery, latestDiagnosis);
        latestImprovedCandidates = latestAdvice.improvedQueryCandidates?.length
          ? latestAdvice.improvedQueryCandidates
          : buildImprovedQueryCandidates(theme, userOpinion, activeQuery, latestDiagnosis, axisConfig);
        latestRecommendedQuery = latestAdvice.recommendedQuery || latestImprovedCandidates[0]?.query || "";
        latestComparison = previousDiagnosis ? buildImprovementComparison(previousDiagnosis, latestDiagnosis) : null;

        accumulatedPosts = mergedPosts;
        accumulatedTexts = mergedTexts;
        previousDiagnosis = latestDiagnosis;

        if (addedCount <= 1 && round > 1) {
          noImprovementRounds += 1;
        } else {
          noImprovementRounds = 0;
        }
        if (addedCount === 0) {
          noNewUniqueRetries += 1;
        } else {
          noNewUniqueRetries = 0;
        }

        if (action === "improved_add") {
          improvedAddFetchCount += 1;
        } else if (action === "continue_add") {
          continueRemainingCount += 1;
        }

        const nextRemainingCount = Math.max(0, targetCount - accumulatedTexts.length);
        const nextFetchCount = calculateNextAddFetchCount(accumulatedTexts.length, targetCount);
        const roundStopReason =
          apiReturnedCount > 0 && addedCount === 0
            ? "api_returned_but_all_duplicate"
            : batchDiagnosis.analysisCandidateCount === 0
              ? "api_returned_but_all_noise"
              : "";
        const stageLog = makeStageLogEntry({
          stageNo: round,
          action,
          query: executedQuery,
          fetchedCount: addedCount,
          accumulatedCount: accumulatedTexts.length,
          diagnosis: latestDiagnosis,
          beforeQuery,
          afterQuery: executedQuery,
          targetCount,
          remainingCount: nextRemainingCount,
          nextFetchCount,
          requestedFetchCount,
          apiReturnedCount,
          rawFetchedCount: apiReturnedCount,
          newUniqueCount: addedCount,
          duplicateSkippedCount,
          noiseRemovedCount: Math.max(0, apiReturnedCount - batchDiagnosis.analysisCandidateCount),
          addedToCurrentDataCount: addedCount,
          stopReason: roundStopReason,
          queryKind: queryKindLabel(activeHashtags.length, executedQuery),
          usedHashtags: activeHashtags,
          usedExcludeTerms: activeExcludeTerms,
          rawQuery: queryInfo.rawQuery || activeQuery,
          safeQuery: queryInfo.safeQuery || executedQuery,
          fallbackQuery: queryInfo.fallbackQuery || "",
          finalQueryForXApi: queryInfo.finalQueryForXApi || executedQuery,
          queryBuildStatus: queryInfo.queryBuildStatus || "safe",
          queryBuildWarnings: queryInfo.queryBuildWarnings || [],
          apiErrorMessage: queryInfo.apiErrorMessage || "",
          retryCount: queryInfo.retryCount || 0,
          fallbackUsed: Boolean(queryInfo.fallbackUsed),
          sanitizedHashtagRemovedParts: queryInfo.sanitizedHashtagRemovedParts || [],
          sanitizedExcludeRemovedParts: queryInfo.sanitizedExcludeRemovedParts || [],
        });
        stageLogs = [...stageLogs, stageLog];

        applyFetchedXPosts(accumulatedPosts, accumulatedTexts);
        setStagedFetchState((previous) => ({
          ...previous,
          currentStage: round,
          fetchedCount: addedCount,
          currentBatchCount: addedCount,
          totalFetchedCount: accumulatedTexts.length,
          accumulatedCount: accumulatedTexts.length,
          currentDataCount: accumulatedTexts.length,
          totalApiFetchedCount: (previous.totalApiFetchedCount || 0) + batch.texts.length,
          remainingCount: nextRemainingCount,
          nextFetchCount,
          initialFetchCount: 1,
          diagnosisStatus: latestDiagnosis.status,
          shouldPause: false,
          diagnosis: latestDiagnosis,
          noiseBreakdown: latestDiagnosis.noiseBreakdown || [],
          queryTermDiagnosis: latestDiagnosis.queryTermDiagnosis || [],
          aiQueryAdvice: latestAdvice,
          improvementComparison: latestComparison,
          improvedQueryCandidates: latestImprovedCandidates,
          selectedImprovedQueryIndexes: [0],
          recommendedQuery: latestRecommendedQuery,
          diagnosisDecision: "auto_user",
          lastAction: action,
          beforeQuery,
          afterQuery: executedQuery,
          improvedAddFetchCount,
          improvedRefetchCount: improvedAddFetchCount,
          continueRemainingCount,
          stageLogs,
          stopReason: roundStopReason,
          message:
            roundStopReason
              ? `${stopReasonLabel(roundStopReason)} 検索条件を自動調整します。`
              : nextRemainingCount <= 0
                ? `取得完了：${accumulatedTexts.length}/${targetCount}件。クラスタリングに進めます。`
                : latestDiagnosis.status === "good"
                  ? `取得品質は良好です。${accumulatedTexts.length}/${targetCount}件まで取得しました。`
                  : `検索条件を自動調整中です。${accumulatedTexts.length}/${targetCount}件まで取得しました。`,
        }));

        if (roundStopReason === "api_returned_but_all_duplicate" && noNewUniqueRetries <= MAX_NO_NEW_UNIQUE_RETRIES && round < autoFetchSafetyRoundLimit) {
          beforeQuery = beforeQuery || executedQuery;
          activeHashtags = activeHashtags.slice(0, 1);
          activeExcludeTerms = activeExcludeTerms.slice(0, 4);
          activeQuery = makeRetryQueryFromSafeInfo(queryInfo, theme, userOpinion) || latestRecommendedQuery || executedQuery;
          afterQuery = activeQuery;
          continue;
        }

        if (roundStopReason === "api_returned_but_all_noise" && noNewUniqueRetries <= MAX_NO_NEW_UNIQUE_RETRIES && round < autoFetchSafetyRoundLimit) {
          beforeQuery = beforeQuery || executedQuery;
          activeHashtags = [];
          activeExcludeTerms = uniqueByValue([...activeExcludeTerms, "PR", "無料", "キャンペーン"]).slice(0, 5);
          activeQuery = makeRetryQueryFromSafeInfo(queryInfo, theme, userOpinion) || latestRecommendedQuery || executedQuery;
          afterQuery = activeQuery;
          continue;
        }

        if (roundStopReason) {
          stopReason =
            roundStopReason === "api_returned_but_all_duplicate"
              ? "too_many_duplicates"
              : roundStopReason === "api_returned_but_all_noise"
                ? "too_many_noise_posts"
                : roundStopReason;
          break;
        }

        if (nextRemainingCount <= 0) {
          stopReason = "target_reached";
          break;
        }

        if (round >= autoFetchSafetyRoundLimit) {
          stopReason = accumulatedTexts.length >= targetCount ? "target_reached" : "safety_round_limit_reached";
          break;
        }

        if (noImprovementRounds >= 3) {
          stopReason = "no_improvement_after_retries";
          break;
        }

        const shouldTuneQuery =
          latestDiagnosis.status !== "good" ||
          latestDiagnosis.analysisCandidateCount < 10 ||
          latestDiagnosis.noiseRate > 0.45 ||
          noImprovementRounds > 0;

        if (shouldTuneQuery && latestRecommendedQuery) {
          const adviceHashtags = (latestAdvice?.improvedHashtagCandidates || [])
            .filter((candidate) => candidate.selectionType !== "disabled")
            .map((candidate) => normalizeHashtag(candidate.hashtag || candidate.label))
            .filter(Boolean)
            .slice(0, 3);
          const autoExcludeTerms = buildExcludeTermCandidates(
            sampleKey,
            theme,
            userOpinion,
            latestDiagnosis.noiseBreakdown || [],
            personaMode,
            analysisPurposeMode
          )
            .map((candidate) => candidate.term)
            .filter(Boolean)
            .slice(0, 5);
          activeHashtags = uniqueByValue([...(adviceHashtags.length ? adviceHashtags : activeHashtags)]);
          activeExcludeTerms = uniqueByValue([...activeExcludeTerms, ...autoExcludeTerms]).slice(0, 8);
          const nextQuery = buildXQueryWithHashtags(
            latestRecommendedQuery,
            xQueryFilters,
            activeHashtags,
            activeExcludeTerms
          );
          if (!queriesAreEquivalent(activeQuery, nextQuery)) {
            beforeQuery = beforeQuery || executedQuery;
            activeQuery = nextQuery;
            afterQuery = nextQuery;
          } else {
            activeQuery = executedQuery;
            afterQuery = executedQuery;
          }
        } else {
          activeQuery = executedQuery;
          afterQuery = executedQuery;
        }
      }

      if (accumulatedTexts.length === 0) {
        throw new Error(stopReason || "外部意見を取得できませんでした。");
      }

      setSelectedHashtagCandidates(activeHashtags);
      setHasManualHashtagSelection(false);
      setSelectedExcludeTermCandidates(activeExcludeTerms);
      if (!queriesAreEquivalent(initialQuery, afterQuery)) {
        setSelectedXQueryCandidateIds([]);
        setIsManualXQuery(false);
        setXQueryBase(stripXCommonFilters(afterQuery));
        setXQuery(afterQuery);
        setQueryDirty(false);
      }

      const finalStatus =
        accumulatedTexts.length >= targetCount
          ? `取得完了：${accumulatedTexts.length}件取得しました。`
          : `取得完了：${accumulatedTexts.length}/${targetCount}件取得しました。${stopReasonLabel(stopReason)}`;
      setXStatus(
        `${finalStatus} ${
          latestDiagnosis
            ? `分析対象は${latestDiagnosis.analysisCandidateCount}件、品質は${qualityLabel(latestDiagnosis.status)}です。`
            : ""
        }`
      );
      setStagedFetchState((previous) => ({
        ...previous,
        diagnosisStatus: latestDiagnosis?.status || previous.diagnosisStatus,
        shouldPause: false,
        message:
          accumulatedTexts.length >= targetCount
            ? `取得完了：${accumulatedTexts.length}/${targetCount}件。クラスタリングに進めます。`
            : `取得完了：${accumulatedTexts.length}/${targetCount}件。${stopReasonLabel(stopReason) || "取得可能な範囲まで集めました。"}`,
        lastAction: "auto_user_complete",
        afterQuery,
        stopReason,
      }));
      setOperationSuccess(
        "fetchX",
        `${accumulatedTexts.length}件取得しました。自動調整${improvedAddFetchCount}回。`,
        truncateText(afterQuery || initialQuery, 120)
      );
    } catch (error) {
      setXDataStatus(activeDatasetId ? "cached" : "sample");
      setStagedFetchState((previous) => ({
        ...previous,
        diagnosisStatus: "bad",
        shouldPause: true,
        lastAction: "auto_user_error",
        stageLogs: [
          ...(previous.stageLogs || []),
          makeStageLogEntry({
            stageNo: (previous.stageLogs || []).length + 1,
            action: "auto_user_error",
            query: error.safeQuery || error.rawQuery || afterQuery || initialQuery,
            fetchedCount: 0,
            accumulatedCount: accumulatedTexts.length,
            diagnosis: latestDiagnosis,
            rawQuery: error.rawQuery || afterQuery || initialQuery,
            safeQuery: error.safeQuery || "",
            fallbackQuery: error.fallbackQuery || "",
            finalQueryForXApi: error.finalQueryForXApi || error.safeQuery || afterQuery || initialQuery,
            queryBuildStatus: "error",
            queryBuildWarnings: error.queryBuildWarnings || [],
            apiErrorMessage: error.apiErrorMessage || error.message || "",
            errorType: error.errorType || "",
            originalErrorMessage: error.originalErrorMessage || error.apiErrorMessage || "",
            errorTimestamp: error.timestamp || new Date().toISOString(),
            retryCount: error.fallbackQuery ? 1 : 0,
            fallbackUsed: Boolean(error.fallbackQuery),
            stopReason:
              error.errorType === "api_credit_exhausted"
                ? "api_credit_exhausted"
                :
              error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
                ? "invalid_query"
                : "api_error",
            sanitizedHashtagRemovedParts: error.sanitizedHashtagRemovedParts || [],
            sanitizedExcludeRemovedParts: error.sanitizedExcludeRemovedParts || [],
          }),
        ],
        stopReason:
          error.errorType === "api_credit_exhausted"
            ? "api_credit_exhausted"
            :
          error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
            ? "invalid_query"
            : "api_error",
        message:
          error.errorType === "api_credit_exhausted"
            ? JP_UI_LABELS.apiCreditExhaustedMessage
            :
          error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
            ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
            : error.message || "自動取得に失敗しました。",
      }));
      const userMessage =
        error.errorType === "api_credit_exhausted"
          ? JP_UI_LABELS.apiCreditExhaustedMessage
          :
        error.apiErrorMessage && isInvalidXQueryErrorMessage(error.apiErrorMessage)
          ? "取得クエリがX APIの形式に合わなかったため、安全なクエリに直して再試行しましたが失敗しました。"
          : PUBLIC_PREVIEW_MODE
            ? "外部意見の取得に失敗しました。時間をおいて再度お試しください。"
            : `取得失敗：${error.message} 詳細を確認するには開発者modeに切り替えてください。`;
      setXStatus(userMessage);
      setOperationError("fetchX", `自動取得に失敗しました。理由：${userMessage}`, truncateText(error.safeQuery || afterQuery || initialQuery, 120));
    } finally {
      xFetchAbortControllerRef.current = null;
    }
  }

  function handleFetchXButtonClick() {
    if (viewMode === "user") {
      fetchXOpinionsUserAuto();
      return;
    }

    fetchXOpinions();
  }

  function handleForceStopRunningOperations() {
    let stopped = false;

    if (operationStatus.fetchX.status === "running" && xFetchAbortControllerRef.current) {
      xFetchAbortControllerRef.current.abort();
      stopped = true;
    }

    if ((isAutoSummarizing || operationStatus.autoSummary.status === "running") && autoSummaryAbortControllerRef.current) {
      autoSummaryStopRequestedRef.current = true;
      autoSummaryAbortControllerRef.current.abort();
      stopped = true;
    }

    if (stopped) {
      notify("info", "実行中の処理を停止しました。");
    }
  }

  async function continueStagedFetch() {
    const query = effectiveQuery.trim();
    const targetCount = Number(xMaxResults);
    const accumulatedCount = stagedFetchState.accumulatedCount || xPosts.length || currentOpinionCount;
    const remainingCount = Math.max(0, targetCount - accumulatedCount);

    if (remainingCount <= 0) {
      setStagedFetchState((previous) => ({
        ...previous,
        shouldPause: false,
        diagnosisDecision: "continued",
        message: `目標${targetCount}件に到達しています。追加取得はできません。`,
      }));
      setXStatus(`目標${targetCount}件に到達しています。追加取得はできません。`);
      return;
    }

    const nextFetchCount = calculateNextAddFetchCount(accumulatedCount, targetCount, stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT);
    const nextTargetCount = Math.min(targetCount, accumulatedCount + nextFetchCount);

    setOperationRunning("fetchX", `このまま追加取得中... 累計最大${nextTargetCount}件`, truncateText(query, 120));
    setXStatus(`現在の${accumulatedCount}件を維持して、累計最大${nextTargetCount}件まで追加取得中...`);
    setStagedFetchState((previous) => ({
      ...previous,
      shouldPause: false,
      diagnosisDecision: "continued",
      lastAction: "continue_remaining",
      remainingCount,
      nextFetchCount,
      message: "現在の診断データを維持して、このクエリのまま残りを追加取得します。",
    }));
    try {
      const stageNo = (stagedFetchState.stageLogs || []).length + 1;
      const fetchMeta = {
        stageNo,
        fetchType: "continue_add",
        sourceQuery: query,
        fetchedAt: new Date().toISOString(),
        batchIndex: (stagedFetchState.continueRemainingCount || 0) + 1,
      };
      const nextBatch = await requestXPosts(query, nextFetchCount);
      const nextQueryInfo = nextBatch.queryInfo || {};
      const nextExecutedQuery = nextQueryInfo.finalQuery || query;
      fetchMeta.sourceQuery = nextExecutedQuery;
      const existingPosts = xPosts.length
        ? xPosts
        : postsFromExternalOpinions(externalOpinions, {
            stageNo: 1,
            fetchType: "restored",
            sourceQuery: effectiveQuery,
            fetchedAt: "",
            batchIndex: 1,
          });
      const mergedPosts = mergePostsByText(existingPosts, attachFetchMetaToPosts(nextBatch.posts, fetchMeta), targetCount);
      const mergedTexts = textsFromPosts(mergedPosts);
      const addedCount = Math.max(0, mergedTexts.length - accumulatedCount);
      const diagnosis = diagnoseQueryQuality(
        mergedPosts,
        nextExecutedQuery,
        themeCategory,
        axisConfig,
        noiseFilteringEnabled,
        theme,
        userOpinion,
        noiseRelevanceThreshold
      );
      const queryAdvice = await requestQueryDiagnosisAdvice(nextExecutedQuery, diagnosis);

      applyFetchedXPosts(mergedPosts, mergedTexts);
      setStagedFetchState((previous) => ({
        ...previous,
        currentStage: (previous.stageLogs || []).length + 1,
        fetchedCount: addedCount,
        currentBatchCount: addedCount,
        totalFetchedCount: mergedTexts.length,
        accumulatedCount: mergedTexts.length,
        currentDataCount: mergedTexts.length,
        totalApiFetchedCount: (previous.totalApiFetchedCount || accumulatedCount) + nextBatch.texts.length,
        remainingCount: Math.max(0, targetCount - mergedTexts.length),
        nextFetchCount: Math.min(
          previous.stageSize || DEFAULT_ADD_FETCH_COUNT,
          calculateNextAddFetchCount(mergedTexts.length, targetCount, previous.stageSize || DEFAULT_ADD_FETCH_COUNT)
        ),
        diagnosisStatus: diagnosis.status,
        shouldPause: diagnosis.status !== "good",
        diagnosis,
        noiseBreakdown: diagnosis.noiseBreakdown || [],
        queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
        aiQueryAdvice: queryAdvice,
        improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
          ? queryAdvice.improvedQueryCandidates
          : previous.improvedQueryCandidates,
        recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
        stageLogs: [
          ...(previous.stageLogs || []),
          makeStageLogEntry({
            stageNo: (previous.stageLogs || []).length + 1,
            action: "continue_add",
            query: nextExecutedQuery,
            fetchedCount: addedCount,
            accumulatedCount: mergedTexts.length,
            diagnosis,
            targetCount,
            remainingCount: Math.max(0, targetCount - mergedTexts.length),
            nextFetchCount: calculateNextAddFetchCount(mergedTexts.length, targetCount, previous.stageSize || DEFAULT_ADD_FETCH_COUNT),
            requestedFetchCount: nextFetchCount,
            apiReturnedCount: nextBatch.texts.length,
            newUniqueCount: addedCount,
            duplicateSkippedCount: Math.max(0, nextBatch.texts.length - addedCount),
            queryKind: queryKindLabel(selectedHashtagValues.length, nextExecutedQuery),
            usedHashtags: selectedHashtagValues,
            usedExcludeTerms: selectedExcludeTermValues,
            ...queryBuildFieldsForStage(nextQueryInfo, query),
          }),
        ],
        message:
          mergedTexts.length >= targetCount
            ? `累計${mergedTexts.length}/${targetCount}件に到達しました。`
            : `累計${mergedTexts.length}/${targetCount}件です。追加取得後も目標未満です。`,
        continueRemainingCount: (previous.continueRemainingCount || 0) + 1,
      }));
      setXStatus(`追加取得完了：今回追加${addedCount}件 / 累計${mergedTexts.length}/${targetCount}件。`);
      setOperationSuccess("fetchX", `累計${mergedTexts.length}件取得しました。`, truncateText(query, 120));
    } catch (error) {
      setXStatus(`継続取得に失敗しました：${error.message}`);
      setOperationError("fetchX", `継続取得に失敗しました。理由：${error.message}`, truncateText(query, 120));
    }
  }

  function toggleImprovedQueryCandidate(index) {
    setStagedFetchState((previous) => {
      const selected = new Set(previous.selectedImprovedQueryIndexes || []);
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }

      return {
        ...previous,
        selectedImprovedQueryIndexes: Array.from(selected).sort((a, b) => a - b),
      };
    });
  }

  function selectedImprovedQueryBase(candidate = null) {
    if (candidate) {
      return candidate.query || "";
    }

    const selectedIndexes = stagedFetchState.selectedImprovedQueryIndexes?.length
      ? stagedFetchState.selectedImprovedQueryIndexes
      : [0];
    const selectedCandidates = selectedIndexes
      .map((index) => stagedFetchState.improvedQueryCandidates[index])
      .filter(Boolean);

    return selectedCandidates.map((item) => `(${item.query})`).join(" OR ");
  }

  async function refetchWithImprovedQuery(candidate = null) {
    const nextBaseQuery = selectedImprovedQueryBase(candidate);
    if (!nextBaseQuery) {
      setXStatus("適用できる改善クエリ候補がありません。");
      return;
    }
    const nextQuery = buildXQueryWithHashtags(
      nextBaseQuery,
      xQueryFilters,
      selectedHashtagValues,
      selectedExcludeTermValues
    );
    const targetCount = Number(xMaxResults);
    const currentDataCount = stagedFetchState.accumulatedCount || xPosts.length || currentOpinionCount;
    const remainingCount = Math.max(0, targetCount - currentDataCount);

    if (remainingCount <= 0) {
      setStagedFetchState((previous) => ({
        ...previous,
        shouldPause: false,
        remainingCount: 0,
        nextFetchCount: 0,
        message: `目標${targetCount}件に到達しています。改善クエリで追加取得はできません。`,
      }));
      setXStatus(`目標${targetCount}件に到達しています。追加取得はできません。`);
      return;
    }

    const nextFetchCount = calculateNextAddFetchCount(
      currentDataCount,
      targetCount,
      stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
    );
    const isSameQuery = queriesAreEquivalent(effectiveQuery, nextQuery);
    const beforeDiagnosis = stagedFetchState.diagnosis;

    setSelectedXQueryCandidateIds([]);
    setIsManualXQuery(false);
    setXQueryBase(nextBaseQuery);
    setXQuery(nextQuery);
    setQueryDirty(false);
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisDecision: "improved",
      lastAction: "improved_add",
      beforeQuery: effectiveQuery,
      afterQuery: nextQuery,
      currentBatchCount: 0,
      remainingCount,
      nextFetchCount,
      shouldPause: false,
      message: isSameQuery
        ? "改善クエリが現在のクエリと同じです。追加取得は可能ですが、同じ傾向の投稿が増える可能性があります。"
        : `既存の${currentDataCount}件を保持したまま、改善クエリで${nextFetchCount}件追加取得します。`,
    }));
    setOperationRunning("fetchX", `改善クエリで${nextFetchCount}件追加取得中...`, truncateText(nextQuery, 120));
    setXStatus(
      `現在の${currentDataCount}件を保持したまま、改善クエリで${nextFetchCount}件追加取得中...`
    );

    try {
      const stageNo = (stagedFetchState.stageLogs || []).length + 1;
      const fetchMeta = {
        stageNo,
        fetchType: "improved_add",
        sourceQuery: nextQuery,
        fetchedAt: new Date().toISOString(),
        batchIndex: (stagedFetchState.improvedAddFetchCount || stagedFetchState.improvedRefetchCount || 0) + 1,
      };
      const nextBatch = await requestXPosts(nextQuery, nextFetchCount);
      const nextQueryInfo = nextBatch.queryInfo || {};
      const nextExecutedQuery = nextQueryInfo.finalQuery || nextQuery;
      fetchMeta.sourceQuery = nextExecutedQuery;
      if (nextBatch.texts.length === 0) {
        throw new Error("改善クエリの追加取得結果が0件でした。別の候補を選んでください。");
      }

      const existingPosts = xPosts.length
        ? xPosts
        : postsFromExternalOpinions(externalOpinions, {
            stageNo: 1,
            fetchType: "restored",
            sourceQuery: effectiveQuery,
            fetchedAt: "",
            batchIndex: 1,
          });
      const mergedPosts = mergePostsByText(existingPosts, attachFetchMetaToPosts(nextBatch.posts, fetchMeta), targetCount);
      const mergedTexts = textsFromPosts(mergedPosts);
      const addedCount = Math.max(0, mergedTexts.length - currentDataCount);
      const diagnosis = diagnoseQueryQuality(
        mergedPosts,
        nextExecutedQuery,
        sampleKey,
        axisConfig,
        noiseFilteringEnabled,
        theme,
        userOpinion,
        noiseRelevanceThreshold
      );
      const queryAdvice = await requestQueryDiagnosisAdvice(nextExecutedQuery, diagnosis);
      const improvementComparison = buildImprovementComparison(beforeDiagnosis, diagnosis);
      const nextRemainingCount = Math.max(0, targetCount - mergedTexts.length);
      const nextStageFetchCount = calculateNextAddFetchCount(
        mergedTexts.length,
        targetCount,
        stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
      );

      applyFetchedXPosts(mergedPosts, mergedTexts);
      setStagedFetchState((previous) => ({
        ...previous,
        currentStage: (previous.stageLogs || []).length + 1,
        fetchedCount: addedCount,
        currentBatchCount: addedCount,
        totalFetchedCount: mergedTexts.length,
        accumulatedCount: mergedTexts.length,
        currentDataCount: mergedTexts.length,
        totalApiFetchedCount: (previous.totalApiFetchedCount || currentDataCount) + nextBatch.texts.length,
        remainingCount: nextRemainingCount,
        nextFetchCount: nextStageFetchCount,
        diagnosisStatus: diagnosis.status,
        shouldPause: diagnosis.status !== "good" && nextRemainingCount > 0,
        diagnosis,
        noiseBreakdown: diagnosis.noiseBreakdown || [],
        queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
        aiQueryAdvice: queryAdvice,
        improvementComparison,
        improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
          ? queryAdvice.improvedQueryCandidates
          : previous.improvedQueryCandidates,
        selectedImprovedQueryIndexes: previous.selectedImprovedQueryIndexes || [0],
        recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
        stageLogs: [
          ...(previous.stageLogs || []),
          makeStageLogEntry({
            stageNo: (previous.stageLogs || []).length + 1,
            action: "improved_add",
            query: nextExecutedQuery,
            fetchedCount: addedCount,
            accumulatedCount: mergedTexts.length,
            diagnosis,
            beforeQuery: effectiveQuery,
            afterQuery: nextExecutedQuery,
            targetCount,
            remainingCount: nextRemainingCount,
            nextFetchCount: nextStageFetchCount,
            requestedFetchCount: nextFetchCount,
            apiReturnedCount: nextBatch.texts.length,
            newUniqueCount: addedCount,
            duplicateSkippedCount: Math.max(0, nextBatch.texts.length - addedCount),
            queryKind: queryKindLabel(selectedHashtagValues.length, nextExecutedQuery),
            usedHashtags: selectedHashtagValues,
            usedExcludeTerms: selectedExcludeTermValues,
            ...queryBuildFieldsForStage(nextQueryInfo, nextQuery),
          }),
        ],
        improvedRefetchCount: (previous.improvedRefetchCount || 0) + 1,
        improvedAddFetchCount: (previous.improvedAddFetchCount || previous.improvedRefetchCount || 0) + 1,
        message:
          nextRemainingCount <= 0
            ? `目標${targetCount}件に到達しました。次はクラスタリングへ進めます。`
            : addedCount <= 1
              ? `${nextFetchCount}件を要求しましたが、新規追加は${addedCount}件でした。既存データとの重複、検索結果不足、またはnext_token不足の可能性があります。別の候補やハッシュタグ追加を試してください。`
            : `${addedCount}件を追加し、現在${mergedTexts.length}/${targetCount}件です。残り${nextRemainingCount}件を追加取得できます。`,
      }));
      setXStatus(
        `改善クエリで追加取得しました：今回追加${addedCount}件 / 現在${mergedTexts.length}/${targetCount}件。`
      );
      setOperationSuccess("fetchX", `改善クエリで${addedCount}件追加しました。`, truncateText(nextQuery, 120));
    } catch (error) {
      setXStatus(`改善クエリの追加取得に失敗しました：${error.message}`);
      setOperationError("fetchX", `改善クエリの追加取得に失敗しました。理由：${error.message}`, truncateText(nextQuery, 120));
      setStagedFetchState((previous) => ({
        ...previous,
        shouldPause: true,
        message: error.message || "改善クエリの追加取得に失敗しました。",
      }));
    }
  }

  function retryDiagnosisWithWeakNoiseFilter() {
    if (!xPosts.length) {
      setXStatus("再診断できる取得済みデータがありません。");
      return;
    }

    const nextThreshold = 3;
    const query = effectiveQuery.trim();
    const diagnosis = diagnoseQueryQuality(xPosts, query, themeCategory, axisConfig, true, theme, userOpinion, nextThreshold);
    const queryAdvice = buildRuleBasedQueryAdvice({
      theme,
      userOpinion,
      currentQuery: query,
      axisConfig,
      diagnosis,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
    });
    setNoiseRelevanceThreshold(nextThreshold);
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosis,
      diagnosisStatus: diagnosis.status,
      noiseBreakdown: diagnosis.noiseBreakdown || [],
      queryTermDiagnosis: diagnosis.queryTermDiagnosis || [],
      aiQueryAdvice: queryAdvice,
      improvedQueryCandidates: queryAdvice.improvedQueryCandidates?.length
        ? queryAdvice.improvedQueryCandidates
        : previous.improvedQueryCandidates,
      recommendedQuery: queryAdvice.recommendedQuery || previous.recommendedQuery || "",
      shouldPause: diagnosis.status !== "good",
      weakNoiseRetryAvailable: false,
      lastAction: "weak_noise_retry",
      diagnosisDecision: "weak_noise_retry",
      fetchedCount: xPosts.length,
      currentBatchCount: 0,
      totalFetchedCount: xPosts.length,
      accumulatedCount: xPosts.length,
      stageLogs: [
        ...(previous.stageLogs || []),
        makeStageLogEntry({
          stageNo: (previous.stageLogs || []).length + 1,
          action: "weak_noise_retry",
          query,
          fetchedCount: 0,
          accumulatedCount: xPosts.length,
          diagnosis,
        }),
      ],
      message:
        diagnosis.status === "good"
          ? "ノイズ除去を弱めて再診断した結果、取得診断は良好になりました。"
          : "ノイズ除去を弱めても取得は不調です。クエリをさらに具体化してください。",
    }));
    setXStatus(
      `ノイズ除去を弱めて再診断しました。分析対象${diagnosis.analysisCandidateCount}件 / ノイズ率${formatPercent(diagnosis.noiseRate)}。`
    );
  }

  function focusManualQueryEdit() {
    setStagedFetchState((previous) => ({
      ...previous,
      diagnosisDecision: "manual",
      message: "手動でクエリを修正してください。",
    }));
    const target = document.querySelector(".basic-keywords-input") || document.querySelector(".query-candidate-list");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof target?.focus === "function") {
      target.focus();
    }
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

  function persistDatasetHistory(nextHistory) {
    const compactHistory = {
      datasets: (nextHistory.datasets || []).slice(0, MAX_X_DATASET_HISTORY),
    };

    setDatasetHistory(compactHistory);
    writeDatasetHistory(compactHistory);
  }

  async function saveCurrentXDatasetToHistory() {
    setOperationRunning("saveDataset", "Xデータを保存中...", truncateText(theme, 80), currentDatasetHash);
    await waitForNextPaint();

    try {
      const opinions = externalOpinions
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      if (opinions.length === 0) {
        throw new Error("保存する外部意見がありません。");
      }

      const savedAt = new Date().toISOString();
      const datasetId = createHistoryId("ds");
      const dataset = {
        datasetId,
        savedAt,
        sampleNo: currentSample.sampleNo || sampleNoForKey(sampleKey),
        sampleKey,
        sampleLabel: sampleTitle(currentSample, sampleKey),
        viewMode,
        userModeAutoFetchEnabled: viewMode === "user",
        personaMode,
        analysisPurposeMode,
        personaLabel: currentPersonaConfig.label,
        selectedVoiceDirections,
        theme,
        userOpinion,
        query: effectiveQuery,
        manualQuery: xQuery,
        selectedQueryCandidateIds: selectedXQueryCandidateIds,
        selectedQueryCandidateLabels: selectedXQueryCandidates.map((candidate) => candidate.label),
        selectedHashtagCandidates,
        selectedExcludeTermCandidates,
        queryCandidates: xQueryCandidates,
        generatedBasicKeywords,
        generatedAxisLinkedKeywords,
        effectiveQuery,
        axisConfig,
        axisPresetKey: axisConfig.presetKey,
        axisLabels: {
          x: axisConfig.x.label,
          y: axisConfig.y.label,
          z: axisConfig.z.label,
        },
        axisDescriptions: {
          x: axisConfig.x.description,
          y: axisConfig.y.description,
          z: axisConfig.z.description,
        },
        analysisMode,
        axisConfigAtFetch: axisConfig,
        axisLinkedKeywords,
        selectedAxisLinkedKeywords,
        queryAxisWarnings,
        scoreDisplayMode,
        stagedFetchEnabled,
        stagedFetchStageLogs: stagedFetchState.stageLogs,
        stagedFetchTargetCount: stagedFetchState.targetCount,
        stagedFetchAccumulatedCount: stagedFetchState.accumulatedCount,
        stagedFetchCurrentDataCount: stagedFetchState.currentDataCount || stagedFetchState.accumulatedCount || opinions.length,
        stagedFetchTotalApiFetchedCount: stagedFetchState.totalApiFetchedCount || stagedFetchState.accumulatedCount || opinions.length,
        stagedFetchRemainingCount: stagedFetchState.remainingCount,
        stagedFetchNextFetchCount: stagedFetchState.nextFetchCount,
        initialFetchCount: stagedFetchState.initialFetchCount,
        stagedFetchLastAction: stagedFetchState.lastAction,
        improvedRefetchCount: stagedFetchState.improvedRefetchCount,
        improvedAddFetchCount: stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0,
        continueRemainingCount: stagedFetchState.continueRemainingCount,
        queryDiagnosis: stagedFetchState.diagnosis,
        queryDiagnosisStatus: stagedFetchState.diagnosisStatus,
        queryDiagnosisNoiseBreakdown: stagedFetchState.noiseBreakdown,
        queryTermDiagnosis: stagedFetchState.queryTermDiagnosis,
        aiQueryAdvice: stagedFetchState.aiQueryAdvice,
        queryImprovementComparison: stagedFetchState.improvementComparison,
        improvedQueryCandidates: stagedFetchState.improvedQueryCandidates,
        selectedImprovedQueryIndexes: stagedFetchState.selectedImprovedQueryIndexes,
        diagnosisPaused: stagedFetchState.shouldPause,
        diagnosisDecision: stagedFetchState.diagnosisDecision,
        queryBeforeImprovement: stagedFetchState.beforeQuery,
        queryAfterImprovement: stagedFetchState.afterQuery,
        noiseRelevanceThreshold,
        noiseFilterEnabled: noiseFilteringEnabled,
        noiseProcessingResult: {
          noiseFilterEnabled: result.noiseProcessingResult.noiseFilterEnabled,
          noiseExcludedCount: result.noiseProcessingResult.noiseExcludedCount,
          analysisTargetCount: result.noiseProcessingResult.analysisTargetCount,
          noiseReasonCounts: result.noiseProcessingResult.noiseReasonCounts,
          noiseReasonSummary: result.noiseProcessingResult.noiseReasonSummary,
        },
        maxResults: Number(xMaxResults) || opinions.length,
        count: opinions.length,
        externalOpinions: opinions,
        clusterRuns: [],
      };
      const nextHistory = {
        datasets: [dataset, ...datasetHistory.datasets].slice(0, MAX_X_DATASET_HISTORY),
      };

      persistDatasetHistory(nextHistory);
      setActiveDatasetId(datasetId);
      setActiveClusterRunId("");
      setXDataStatus("cached");
      setHistoryStatus("X取得データを履歴に保存しました。");
      setOperationSuccess(
        "saveDataset",
        `保存済み ${formatHistoryDate(savedAt)} / ${opinions.length}件 / ${sampleNoLabel(sampleKey, currentSample.sampleNo)} / ${truncateText(theme, 60)}`,
        datasetId,
        currentDatasetHash
      );
    } catch (error) {
      const message = error?.message || String(error);
      setHistoryStatus(message);
      setOperationError("saveDataset", `Xデータ保存に失敗しました。理由：${message}`, "", currentDatasetHash);
    }
  }

  function loadXDatasetFromHistory(datasetId) {
    const dataset = migrateAppStateFromMojibake({
      datasets: datasetHistory.datasets.filter((item) => item.datasetId === datasetId),
    }).datasets[0];

    if (!dataset) {
      setHistoryStatus("読み込むXデータ履歴が見つかりません。");
      return;
    }

    const datasetSample = samples[dataset.sampleKey] || currentSample;
    const restoredAxisConfig = normalizeAxisConfig(dataset.axisConfig, datasetSample);
    const restoredPersonaMode = dataset.personaMode || "dev";
    const restoredAnalysisPurposeMode = normalizeAnalysisPurposeMode(dataset.analysisPurposeMode, restoredPersonaMode);
    const restoredVoiceDirections = normalizeVoiceDirections(
      dataset.selectedVoiceDirections || purposeVoiceDirections(restoredAnalysisPurposeMode, restoredPersonaMode)
    );
    const restoredTheme = dataset.theme || dataset.sampleLabel || theme;
    const restoredThemeCategory = getThemeCategory(dataset.sampleKey || sampleKey, restoredTheme, dataset.userOpinion ?? userOpinion);
    const restoredQueryCandidates =
      Array.isArray(dataset.queryCandidates) && dataset.queryCandidates.length > 0
        ? dataset.queryCandidates
        : restoredPersonaMode === "personaA" && restoredThemeCategory === "romance"
          ? getPersonaAQueryCandidates(restoredVoiceDirections, restoredAnalysisPurposeMode)
          : getThemeQueryCandidates(restoredTheme, restoredThemeCategory, datasetSample);
    const restoredQueryBase =
      !looksLikeMojibake(dataset.manualQuery || dataset.query || "")
        ? dataset.manualQuery || dataset.query || restoredQueryCandidates[0]?.base || restoredQueryCandidates[0]?.query || ""
        : restoredQueryCandidates[0]?.base || restoredQueryCandidates[0]?.query || "";

    setSampleKey(dataset.sampleKey || sampleKey);
    setPersonaMode(restoredPersonaMode);
    setAnalysisPurposeMode(restoredAnalysisPurposeMode);
    setSelectedVoiceDirections(restoredVoiceDirections);
    setHasManualVoiceDirectionSelection(Array.isArray(dataset.selectedVoiceDirections) && dataset.selectedVoiceDirections.length > 0);
    setTheme(restoredTheme);
    setUserOpinion(dataset.userOpinion ?? userOpinion);
    setAxisConfig(restoredAxisConfig);
    setDraftAxisConfig(restoredAxisConfig);
    setAxisStatus(dataset.axisConfig ? "保存済みXデータの評価軸を復元しました。" : "古い保存データのため、テーマ標準の評価軸を使います。");
    setHasScoredWithCurrentAxis(true);
    setAnalysisMode(dataset.analysisMode || "exploratory");
    setSelectedAxisLinkedKeywords(Array.isArray(dataset.selectedAxisLinkedKeywords) ? dataset.selectedAxisLinkedKeywords : []);
    setExternalOpinions((dataset.externalOpinions || []).join("\n"));
    setXQuery(buildXQuery(restoredQueryBase, DEFAULT_X_QUERY_FILTERS));
    setXQueryBase(restoredQueryBase);
    setGeneratedXQueryCandidates(restoredQueryCandidates);
    setGeneratedBasicKeywords(Array.isArray(dataset.generatedBasicKeywords) ? dataset.generatedBasicKeywords : []);
    setGeneratedAxisLinkedKeywords(dataset.generatedAxisLinkedKeywords || null);
    setSelectedXQueryCandidateIds(Array.isArray(dataset.selectedQueryCandidateIds) ? dataset.selectedQueryCandidateIds : []);
    setSelectedHashtagCandidates(Array.isArray(dataset.selectedHashtagCandidates) ? dataset.selectedHashtagCandidates : []);
    setHasManualHashtagSelection(Array.isArray(dataset.selectedHashtagCandidates) && dataset.selectedHashtagCandidates.length > 0);
    setSelectedExcludeTermCandidates(
      Array.isArray(dataset.selectedExcludeTermCandidates) ? dataset.selectedExcludeTermCandidates : []
    );
    setXMaxResults(dataset.maxResults || dataset.count || 100);
    setScoreDisplayMode(dataset.scoreDisplayMode === "absolute" ? "absolute" : "relative");
    setIsNoiseFilteringDisabled(dataset.noiseFilterEnabled === false);
    setNoiseRelevanceThreshold(dataset.noiseRelevanceThreshold || NOISE_RELEVANCE_THRESHOLD);
    setStagedFetchState((previous) => ({
      ...previous,
      enabled: dataset.stagedFetchEnabled !== false,
      targetCount: dataset.maxResults || dataset.count || previous.targetCount,
      stageLogs: Array.isArray(dataset.stagedFetchStageLogs) ? dataset.stagedFetchStageLogs : [],
      fetchedCount: dataset.queryDiagnosis?.fetchedCount || 0,
      currentBatchCount: 0,
      totalFetchedCount: dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      accumulatedCount: dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      currentDataCount: dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      totalApiFetchedCount:
        dataset.stagedFetchTotalApiFetchedCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0,
      remainingCount: Math.max(
        0,
        (dataset.maxResults || dataset.count || previous.targetCount) -
          (dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0)
      ),
      nextFetchCount: Math.min(
        STAGED_FETCH_INITIAL_COUNT,
        Math.max(
          0,
          (dataset.maxResults || dataset.count || previous.targetCount) -
            (dataset.stagedFetchCurrentDataCount || dataset.stagedFetchAccumulatedCount || dataset.count || 0)
        )
      ),
      initialFetchCount: dataset.initialFetchCount || (dataset.queryDiagnosis ? 1 : 0),
      diagnosisStatus: dataset.queryDiagnosisStatus || "idle",
      shouldPause: Boolean(dataset.diagnosisPaused),
      diagnosis: dataset.queryDiagnosis || null,
      noiseBreakdown: Array.isArray(dataset.queryDiagnosisNoiseBreakdown) ? dataset.queryDiagnosisNoiseBreakdown : [],
      queryTermDiagnosis: Array.isArray(dataset.queryTermDiagnosis) ? dataset.queryTermDiagnosis : [],
      aiQueryAdvice: dataset.aiQueryAdvice || null,
      improvementComparison: dataset.queryImprovementComparison || null,
      improvedQueryCandidates: Array.isArray(dataset.improvedQueryCandidates) ? dataset.improvedQueryCandidates : [],
      selectedImprovedQueryIndexes: Array.isArray(dataset.selectedImprovedQueryIndexes) ? dataset.selectedImprovedQueryIndexes : [0],
      recommendedQuery: Array.isArray(dataset.improvedQueryCandidates) ? dataset.improvedQueryCandidates[0]?.query || "" : "",
      diagnosisDecision: dataset.diagnosisDecision || "",
      lastAction: dataset.stagedFetchLastAction || "",
      beforeQuery: dataset.queryBeforeImprovement || "",
      afterQuery: dataset.queryAfterImprovement || "",
      improvedRefetchCount: dataset.improvedRefetchCount || 0,
      improvedAddFetchCount: dataset.improvedAddFetchCount ?? dataset.improvedRefetchCount ?? 0,
      continueRemainingCount: dataset.continueRemainingCount || 0,
      message: dataset.queryDiagnosisStatus ? `保存済みXデータの取得診断: ${queryDiagnosisLabel(dataset.queryDiagnosisStatus)}` : "未実行",
    }));
    setIsManualXQuery(!Array.isArray(dataset.selectedQueryCandidateIds) || dataset.selectedQueryCandidateIds.length === 0);
    setQueryDirty(false);
    setXPosts([]);
    setActiveDatasetId(dataset.datasetId);
    setActiveClusterRunId("");
    setXDataStatus("cached");
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setExpandedClusterIds({});
    setHistoryStatus("保存済みXデータを読み込みました。テーマ・自分の意見・検索条件も復元しました。X APIは実行していません。");
  }

  function deleteXDatasetHistory(datasetId) {
    if (!window.confirm("このXデータ履歴と紐づくクラスタ結果を削除しますか？")) {
      return;
    }

    const nextHistory = {
      datasets: datasetHistory.datasets.filter((dataset) => dataset.datasetId !== datasetId),
    };

    persistDatasetHistory(nextHistory);

    if (activeDatasetId === datasetId) {
      setActiveDatasetId("");
      setActiveClusterRunId("");
      setXDataStatus(externalOpinions.trim() ? "unsaved" : "sample");
    }

    setHistoryStatus("Xデータ履歴を削除しました。");
  }

  async function saveCurrentClusterRunToHistory() {
    setOperationRunning("saveCluster", "クラスタ結果を保存中...", currentClusterDisplayLabel(), currentClusterHash);
    await waitForNextPaint();

    try {
      if (!activeDatasetId) {
        throw new Error("先にX取得データを履歴に保存してください。");
      }

      if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
        throw new Error("意味類似 OpenAI は未実行です。先に「意味クラスタを実行」を押してください。");
      }

      const dataset = datasetHistory.datasets.find((item) => item.datasetId === activeDatasetId);
      if (!dataset) {
        throw new Error("保存先のXデータ履歴が見つかりません。");
      }

      const stats = result.noiseProcessingResult;
      const inputCount = stats.candidateCount || 0;
      const clusterCount = result.clusterTableRows.length;
      const compressionRate = inputCount > 0 ? (1 - clusterCount / inputCount) * 100 : 0;
      const savedClusterMethod = clusterMethod === "semantic" && semanticClusterRows.length > 0 ? "semantic" : "text";
      const methodLabel = savedClusterMethod === "semantic" ? "意味類似" : "文字類似";
      const threshold = savedClusterMethod === "semantic" ? semanticThreshold : clusterThreshold;
      const savedAt = new Date().toISOString();
      const runId = createHistoryId("run");
      const run = {
        runId,
        savedAt,
        datasetId: dataset.datasetId,
        datasetTheme: dataset.theme || "",
        datasetUserOpinion: dataset.userOpinion || "",
        datasetSampleKey: dataset.sampleKey || "",
        datasetSampleNo: dataset.sampleNo || sampleNoForKey(dataset.sampleKey),
        datasetSampleLabel: dataset.sampleLabel || "",
        axisConfig,
        axisPresetKey: axisConfig.presetKey,
        axisConfigUsedForScoring: axisConfig,
        scoringDate: savedAt,
        analysisMode,
        queryAxisWarnings,
        clusterMethod: savedClusterMethod,
        textThreshold: clusterThreshold,
        semanticThreshold,
        graphMode,
        scoreDisplayMode,
        resolvedScoreDisplayMode: result.resolvedScoreDisplayMode,
        scoreDistribution: result.scoreDistribution,
        scoreConcentrationDetected: result.scoreConcentrationDetected,
        axisQualityWarnings,
        inputCount,
        clusterCount,
        compressionRate,
        clusters: compactClusterRowsForHistory(result.clusterTableRows),
        noiseProcessingResult: {
          rawCount: stats.rawCount,
          processedUniqueTextCount: stats.processedUniqueTextCount,
          duplicateCount: stats.duplicateCount,
          independentOpinionCount: stats.independentOpinionCount,
          independentOpinionRate: stats.independentOpinionRate,
          spreadReferenceCount: stats.spreadReferenceCount,
          spreadDominanceRate: stats.spreadDominanceRate,
          spreadTemplateCount: stats.spreadTemplateCount,
          retweetLikeCount: stats.retweetLikeCount,
          urlCount: stats.urlCount,
          tooShortCount: stats.tooShortCount,
          noiseFilterEnabled: stats.noiseFilterEnabled,
          noiseExcludedCount: stats.noiseExcludedCount,
          analysisTargetCount: stats.analysisTargetCount,
          noiseReasonCounts: stats.noiseReasonCounts,
          noiseReasonSummary: stats.noiseReasonSummary,
          candidateCount: stats.candidateCount,
          clusterCount,
        },
        clusterSummaries,
        summary: `${methodLabel} ${threshold.toFixed(2)}：${inputCount}件→${clusterCount}クラスタ`,
      };
      const nextHistory = {
        datasets: datasetHistory.datasets.map((item) =>
          item.datasetId === activeDatasetId
            ? {
                ...item,
                clusterRuns: [run, ...(item.clusterRuns || [])].slice(0, MAX_CLUSTER_RUN_HISTORY),
              }
            : item
        ),
      };

      persistDatasetHistory(nextHistory);
      setActiveClusterRunId(runId);
      setHistoryStatus("現在のクラスタ結果を保存しました。");
      setOperationSuccess(
        "saveCluster",
        `保存済み ${formatHistoryDate(savedAt)} / ${clusterCount}クラスタ / ${methodLabel} ${threshold.toFixed(2)}`,
        runId,
        currentClusterHash
      );
    } catch (error) {
      const message = error?.message || String(error);
      setHistoryStatus(message);
      setOperationError("saveCluster", `クラスタ保存に失敗しました。理由：${message}`, "", currentClusterHash);
    }
  }

  function loadClusterRunFromHistory(datasetId, runId) {
    const dataset = datasetHistory.datasets.find((item) => item.datasetId === datasetId);
    const run = dataset?.clusterRuns?.find((item) => item.runId === runId);

    if (!dataset || !run) {
      setHistoryStatus("読み込むクラスタリング結果が見つかりません。");
      return;
    }

    setClusterMethod(run.clusterMethod || "text");
    setClusterThreshold(run.textThreshold || 0.35);
    setSemanticThreshold(run.semanticThreshold || 0.78);
    setAnalysisMode(run.analysisMode || analysisMode);
    if (run.axisConfig) {
      const restoredAxisConfig = normalizeAxisConfig(run.axisConfig, samples[dataset.sampleKey] || currentSample);
      setAxisConfig(restoredAxisConfig);
      setDraftAxisConfig(restoredAxisConfig);
      setAxisStatus("保存済みクラスタ結果の評価軸を復元しました。");
    }
    setGraphMode(run.graphMode || graphMode);
    setScoreDisplayMode(run.scoreDisplayMode === "absolute" ? "absolute" : "relative");
    setIsNoiseFilteringDisabled(run.noiseProcessingResult?.noiseFilterEnabled === false);
    setActiveDatasetId(datasetId);
    setActiveClusterRunId(runId);
    setHasScoredWithCurrentAxis(true);
    setClusterSummaries(run.clusterSummaries || {});
    setExpandedClusterIds({});

    if (run.clusterMethod === "semantic") {
      setSemanticClusterRows(restoreClusterRowsFromHistory(run.clusters));
      setSemanticClusterStatus("保存済みクラスタ結果を読み込みました。OpenAI APIは実行していません。");
      setSemanticClusterError("");
    } else {
      setSemanticClusterRows([]);
      setSemanticClusterStatus("");
      setSemanticClusterError("");
    }

    setHistoryStatus("保存済みクラスタ結果を読み込みました。OpenAI APIは実行していません。");
  }

  function deleteClusterRunHistory(datasetId, runId) {
    if (!window.confirm("このクラスタリング結果を削除しますか？")) {
      return;
    }

    const nextHistory = {
      datasets: datasetHistory.datasets.map((dataset) =>
        dataset.datasetId === datasetId
          ? {
              ...dataset,
              clusterRuns: (dataset.clusterRuns || []).filter((run) => run.runId !== runId),
            }
          : dataset
      ),
    };

    persistDatasetHistory(nextHistory);

    if (activeClusterRunId === runId) {
      setActiveClusterRunId("");
    }

    setHistoryStatus("クラスタリング結果を削除しました。");
  }

  const result = useMemo(() => {
    const opinions = externalOpinions
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const user = {
      originalNo: "-",
      label: "自分の意見",
      type: "自分の意見",
      opinion: userOpinion,
      group: "user",
      ...scoreOpinion(userOpinion, themeCategory, axisConfig),
    };

    const rawExternalRows = opinions.map((opinion, index) => ({
      originalNo: index + 1,
      label: String(index + 1),
      type: `処理前外部意見 ${index + 1}`,
      opinion,
      group: "external",
      ...scoreOpinion(opinion, themeCategory, axisConfig),
    }));

    const makeAverageRow = (rows, label, type, group) => {
      if (rows.length === 0) {
        return {
          originalNo: "-",
          label,
          type,
          group,
          opinion: "平均対象がありません",
          x: 0,
          y: 0,
          z: 0,
        };
      }

      return {
        originalNo: "-",
        label,
        type,
        group,
        opinion: type,
        x: Math.round(rows.reduce((sum, row) => sum + row.x, 0) / rows.length),
        y: Math.round(rows.reduce((sum, row) => sum + row.y, 0) / rows.length),
        z: Math.round(rows.reduce((sum, row) => sum + row.z, 0) / rows.length),
      };
    };

    const noiseBaseResult = buildNoiseProcessingResult(
      opinions,
      themeCategory,
      axisConfig,
      noiseFilteringEnabled,
      noiseRelevanceThreshold
    );
    const personaAStrictActive = personaMode === "personaA" && themeCategory === "romance";
    const personaAStrictResult = applyPersonaAStrictRelevance(noiseBaseResult.candidateRows, {
      enabled: personaAStrictActive,
      theme,
      userOpinion,
    });
    const strictCandidateRows = personaAStrictResult.candidateRows;
    const strictExcludedRows = personaAStrictResult.excludedRows || [];
    const strictBorderlineRows = personaAStrictResult.borderlineRows || [];
    const strictAllExcludedRows = personaAStrictResult.allExcludedRows || [];
    const combinedNoiseReasonCounts = { ...(noiseBaseResult.noiseReasonCounts || {}) };
    Object.entries(personaAStrictResult.exclusionCounts || {}).forEach(([category, count]) => {
      combinedNoiseReasonCounts[category] = (combinedNoiseReasonCounts[category] || 0) + count;
    });
    const combinedNoiseExcludedRows = [
      ...(noiseBaseResult.noiseExcludedRows || []),
      ...strictExcludedRows.map((row) => ({
        ...row,
        noiseCategory: row.personaAExclusionReason || row.personaARelevanceCategory,
        noiseReason: "Persona A厳格フィルタで、恋愛相談として自然に読めない投稿を除外しました。",
      })),
    ];
    const combinedBorderlineRows = [
      ...(noiseBaseResult.borderlineUsefulRows || []),
      ...strictBorderlineRows.map((row) => ({
        ...row,
        noiseCategory: row.personaAExclusionReason || row.personaARelevanceCategory,
        borderlineReason: row.borderlineReason || "Persona A厳格フィルタで境界意見に分類しました。",
      })),
    ];
    const clusters = clusterOpinionsByText(strictCandidateRows, clusterThreshold);
    const textClusterRows = clusters.map((cluster, index) =>
      makeClusterRepresentative(cluster, index, themeCategory, axisConfig)
    );
    const visibleSemanticClusterRows = personaAStrictActive
      ? semanticClusterRows.filter((row) => isPersonaAUsableOpinion(row.opinion || row.scoredText || "", theme, userOpinion).keep)
      : semanticClusterRows;
    const hasSemanticRows = visibleSemanticClusterRows.length > 0;
    const baseProcessedClusterRows =
      clusterMethod === "semantic" && hasSemanticRows ? visibleSemanticClusterRows : textClusterRows;
    const processedClusterRowsWithAbsolute = baseProcessedClusterRows.map((row) => {
      const originalScore = axisScoreOnly(row.originalScore || row);
      const summary = clusterSummaries[`${clusterMethod}:${row.label}`];
      const fallbackReasons = ensureScoreReasons(row, row.scoredText || row.opinion, axisConfig);

      if (!summary) {
        return withClusterVolume({
          ...row,
          ...originalScore,
          absoluteScore: originalScore,
          originalScore,
          aiSummaryScore: null,
          scoreBasis: "representativeText",
          scoreReasons: fallbackReasons,
          independentOpinionVolume: row.independentOpinionVolume || row.uniqueCount || row.count || 1,
          spreadVolume: row.spreadVolume || row.originalCount || row.duplicateCount || row.count || 1,
          volumeForGraph: row.volumeForGraph || row.independentOpinionVolume || row.uniqueCount || row.count || 1,
          relevanceScore: row.relevanceScore ?? null,
          scoreConfidence: row.scoreConfidence ?? null,
          scoreWarnings: Array.isArray(row.scoreWarnings) ? row.scoreWarnings : [],
        });
      }

      const { text, basis } = chooseSummaryScoreText(summary, row.opinion);
      const aiSummaryScore = basis === "representativeText" ? null : scoreOpinion(text, themeCategory, axisConfig);
      const activeScore = axisScoreOnly(aiSummaryScore || originalScore);

      return withClusterVolume({
        ...row,
        ...activeScore,
        absoluteScore: activeScore,
        originalScore,
        aiSummaryScore,
        scoreBasis: basis,
        scoredText: text,
        scoreReasons: aiSummaryScore?.scoreReasons || fallbackReasons,
        independentOpinionVolume: row.independentOpinionVolume || row.uniqueCount || row.count || 1,
        spreadVolume: row.spreadVolume || row.originalCount || row.duplicateCount || row.count || 1,
        volumeForGraph: row.volumeForGraph || row.independentOpinionVolume || row.uniqueCount || row.count || 1,
        relevanceScore: aiSummaryScore?.relevanceScore ?? row.relevanceScore ?? null,
        scoreConfidence: aiSummaryScore?.scoreConfidence ?? row.scoreConfidence ?? null,
        scoreWarnings: Array.isArray(aiSummaryScore?.scoreWarnings)
          ? aiSummaryScore.scoreWarnings
          : Array.isArray(row.scoreWarnings)
            ? row.scoreWarnings
            : [],
      });
    });
    const scoreDistribution = calculateScoreDistribution(processedClusterRowsWithAbsolute);
    const resolvedScoreDisplayMode = selectDisplayScoreMode(scoreDisplayMode, scoreDistribution);
    const processedClusterRows = applyDisplayScores(
      normalizeRelativeScores(processedClusterRowsWithAbsolute),
      resolvedScoreDisplayMode
    );
    const strictStatsForKpi = {
      ...noiseBaseResult,
      candidateRows: strictCandidateRows,
      candidateCount: strictCandidateRows.length,
      analysisTargetCount: strictCandidateRows.length,
      independentOpinionCount: strictCandidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0),
      noiseExcludedRows: combinedNoiseExcludedRows,
      noiseExcludedCount: (noiseBaseResult.noiseExcludedCount || 0) + strictAllExcludedRows.length,
      borderlineUsefulRows: combinedBorderlineRows,
      borderlineUsefulCount: combinedBorderlineRows.length,
      noiseReasonCounts: combinedNoiseReasonCounts,
      noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
    };
    const retrievalKpi = buildRetrievalKpi(strictStatsForKpi, processedClusterRows, scoreDistribution);
    const semanticInputCount = hasSemanticRows
      ? visibleSemanticClusterRows.reduce((sum, row) => sum + (row.uniqueCount || 1), 0)
      : 0;
    const semanticOriginalCount = hasSemanticRows
      ? visibleSemanticClusterRows.reduce((sum, row) => sum + (row.originalCount || row.count || 0), 0)
      : 0;
    const noiseProcessingResult = {
      ...noiseBaseResult,
      candidateRows: strictCandidateRows,
      preStrictCandidateCount: noiseBaseResult.candidateRows.length,
      candidateCount: strictCandidateRows.length,
      analysisTargetCount: strictCandidateRows.length,
      independentOpinionCount: strictCandidateRows.reduce((sum, row) => sum + (Number(row.independentOpinionVolume) || 1), 0),
      noiseExcludedRows: combinedNoiseExcludedRows,
      noiseExcludedCount: (noiseBaseResult.noiseExcludedCount || 0) + strictAllExcludedRows.length,
      borderlineUsefulRows: combinedBorderlineRows,
      borderlineUsefulCount: combinedBorderlineRows.length,
      noiseReasonCounts: combinedNoiseReasonCounts,
      noiseReasonSummary: formatNoiseReasonCounts(combinedNoiseReasonCounts),
      personaAStrictRelevance: {
        enabled: personaAStrictResult.enabled,
        excludedCount: strictExcludedRows.length,
        ambiguousExcludedCount: strictBorderlineRows.length,
        borderlineCount: strictBorderlineRows.length,
        exclusionCounts: personaAStrictResult.exclusionCounts || {},
        referenceDisplay: personaAStrictResult.referenceDisplay,
      },
      clusterCount: processedClusterRows.length,
      textClusterCount: textClusterRows.length,
      threshold: clusterThreshold,
      clusterMethod,
      semanticThreshold,
      semanticInputCount,
      semanticClusterCount: hasSemanticRows ? visibleSemanticClusterRows.length : null,
      semanticClusterCompressionRate:
        semanticInputCount > 0 ? 1 - visibleSemanticClusterRows.length / semanticInputCount : null,
      semanticOriginalCount,
      noiseExcludedUniqueCount: noiseBaseResult.noiseExcludedCount,
      analysisTargetRate:
        noiseBaseResult.rawCount > 0 ? strictCandidateRows.length / noiseBaseResult.rawCount : 0,
      clusterCompressionRate:
        strictCandidateRows.length > 0
          ? 1 - processedClusterRows.length / strictCandidateRows.length
          : 0,
      retrievalKpi,
      overallRetrievalQuality: retrievalKpi.overallRetrievalQuality,
      diversityScore: retrievalKpi.diversityScore,
      readLoadScore: retrievalKpi.readLoadScore,
      costEfficiencyScore: retrievalKpi.costEfficiencyScore,
    };

    const rawRowsWithAbsolute = [user, ...rawExternalRows].map((row) => ({
      ...row,
      absoluteScore: axisScoreOnly(row.absoluteScore || row),
    }));
    const displayRawRows = applyDisplayScores(normalizeRelativeScores(rawRowsWithAbsolute), resolvedScoreDisplayMode);
    const displayUser = displayRawRows[0] || user;
    const displayRawExternalRows = displayRawRows.slice(1);
    const rawAverage = makeAverageRow(displayRawExternalRows, "取得直後の平均", "処理前外部意見平均", "average");
    const processedAverage = makeAverageRow(
      processedClusterRows,
      "分析対象クラスタの平均",
      "処理後クラスタ平均",
      "processed-average"
    );
    const baseRows = [displayUser, ...displayRawExternalRows];
    const rawAverageRows = displayRawExternalRows.length > 0 ? [rawAverage] : [];
    const processedAverageRows = processedClusterRows.length > 0 ? [processedAverage] : [];
    const graphRowsByMode = {
      raw: [displayUser, ...displayRawExternalRows, ...rawAverageRows],
      processed: [displayUser, ...processedClusterRows, ...processedAverageRows],
      compare: [displayUser, ...displayRawExternalRows, ...processedClusterRows, ...rawAverageRows, ...processedAverageRows],
    };

    return {
      user: displayUser,
      avg: rawAverage,
      rawAverage,
      processedAverage,
      noiseProcessingResult,
      rawExternalRows: displayRawExternalRows,
      textClusterRows,
      processedClusterRows,
      scoreDistribution,
      scoreDisplayMode,
      resolvedScoreDisplayMode,
      scoreConcentrationDetected: hasConcentratedScoreDistribution(scoreDistribution),
      clusterTableRows: [...processedClusterRows].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label, "en", { numeric: true });
      }),
      graphRows: viewMode === "user" ? graphRowsByMode.processed : graphRowsByMode[graphMode] || graphRowsByMode.raw,
      rows: [displayUser, ...displayRawExternalRows, rawAverage],
      tableRows: sortRows(baseRows, sortKey, sortDirection),
    };
  }, [
    userOpinion,
    externalOpinions,
        personaMode,
        analysisPurposeMode,
        selectedVoiceDirections,
    theme,
    themeCategory,
    axisConfig,
    graphMode,
    viewMode,
    clusterThreshold,
    clusterMethod,
    semanticThreshold,
    semanticClusterRows,
    clusterSummaries,
    scoreDisplayMode,
    noiseFilteringEnabled,
    noiseRelevanceThreshold,
    sortKey,
    sortDirection,
  ]);

  const personaUxLens = useMemo(
    () =>
      applyPersonaUxLens({
        personaMode,
        themeCategory,
        axisConfig,
        queryCandidates: xQueryCandidates,
        clusters: result.clusterTableRows,
        userOpinion,
      }),
    [personaMode, themeCategory, axisConfig, xQueryCandidates, result.clusterTableRows, userOpinion]
  );
  const userFeedback = useMemo(
    () =>
      buildUserFeedback({
        personaMode,
        analysisPurposeMode,
        themeCategory,
        personaUxLens,
        theme,
        sampleKey,
        userOpinion,
        axisConfig,
        userScore: result.user,
        clusters: result.clusterTableRows,
        processedAverage: result.processedAverage,
        clusterSummaries,
        activeClusterMethod: currentClusterDisplayLabel(),
        effectiveQuery,
        queryAxisWarnings,
        selectedAxisLinkedKeywords,
        scoreMode: scoreDisplayMode,
        noiseProcessingResult: result.noiseProcessingResult,
      }),
    [personaMode, analysisPurposeMode, themeCategory, personaUxLens, theme, sampleKey, userOpinion, axisConfig, result, clusterSummaries, effectiveQuery, queryAxisWarnings, selectedAxisLinkedKeywords, scoreDisplayMode]
  );
  const mojibakeLabelWarnings = useMemo(() => {
    const userFacingLabels = [
      ["feedbackTitle", currentPersonaConfig.feedbackTitle],
      ...Object.entries(JP_UI_LABELS).map(([key, value]) => [`JP_UI_LABELS.${key}`, value]),
      ...userFeedback.personaSections.flatMap(([title], index) => [[`personaSections.${index}.title`, title]]),
    ];

    return uniqueValues(
      userFacingLabels
        .filter(([, label]) => looksLikeMojibake(label))
        .map(([key, label]) => `${key}: ${label}`)
    );
  }, [currentPersonaConfig.feedbackTitle, userFeedback]);
  const axisQualityWarnings = useMemo(() => buildAxisQualityWarnings(draftAxisConfig), [draftAxisConfig]);
  const scoreConcentrationMessages = useMemo(() => {
    const distribution = result.scoreDistribution || {};
    return ["x", "y", "z"]
      .filter((axis) => distribution[axis]?.concentrated)
      .map((axis) => {
        const stats = distribution[axis];
        return `${axisLabel(axis, axisConfig)} はスコアが${stats.mostCommonScore}付近に集中しています。標準偏差 ${stats.standardDeviation.toFixed(2)}、範囲 ${stats.min}-${stats.max}、最多値比率 ${formatPercent(stats.mostCommonScoreRatio)} です。この軸で差を見たい場合は、関連キーワードを追加して再取得してください。`;
      });
  }, [result.scoreDistribution, axisConfig]);
  const currentClusterHash = useMemo(
    () =>
      stableHash({
        dataset: currentDatasetHash,
        clusterMethod,
        clusterThreshold,
        semanticThreshold,
        axisConfig,
        scoreDisplayMode,
        noiseFilteringEnabled,
        clusters: (result.clusterTableRows || []).map((cluster) => ({
          label: cluster.label,
          count: cluster.count,
          independentOpinionVolume: cluster.independentOpinionVolume,
          spreadVolume: cluster.spreadVolume,
          volumeForGraph: cluster.volumeForGraph,
          x: cluster.x,
          y: cluster.y,
          z: cluster.z,
          summary: clusterSummaries[`${clusterMethod}:${cluster.label}`]?.title || "",
        })),
      }),
    [
      currentDatasetHash,
      clusterMethod,
      clusterThreshold,
      semanticThreshold,
      axisConfig,
      scoreDisplayMode,
      noiseFilteringEnabled,
      result.clusterTableRows,
      clusterSummaries,
    ]
  );
  const currentAnalysisHash = useMemo(
    () =>
      stableHash({
        dataset: currentDatasetHash,
        cluster: currentClusterHash,
        graphMode,
        scoreDisplayMode,
        noiseFilteringEnabled,
        personaMode,
        feedback: userFeedback,
        summaries: clusterSummaries,
      }),
    [currentDatasetHash, currentClusterHash, graphMode, scoreDisplayMode, noiseFilteringEnabled, personaMode, userFeedback, clusterSummaries]
  );

  useEffect(() => {
    setSemanticClusterRows([]);
    setSemanticClusterStatus("");
    setSemanticClusterError("");
    setExpandedClusterIds({});
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
    setActiveClusterRunId("");
  }, [externalOpinions, sampleKey, noiseFilteringEnabled]);

  useEffect(() => {
    setExpandedClusterIds({});
    setSelectedClusterId("");
  }, [clusterMethod, clusterThreshold]);

  useEffect(() => {
    if (hasManualHashtagSelection) {
      return;
    }

    setSelectedHashtagCandidates((previous) => {
      const next = autoSelectedHashtagValues;
      if (previous.length === next.length && previous.every((item, index) => item === next[index])) {
        return previous;
      }

      return next;
    });
  }, [autoSelectedHashtagValues, hasManualHashtagSelection]);

  useEffect(() => {
    const hashByKey = {
      saveDataset: currentDatasetHash,
      saveCluster: currentClusterHash,
      copyAnalysis: currentAnalysisHash,
    };

    setOperationStatus((previous) => {
      let changed = false;
      const next = { ...previous };

      Object.entries(hashByKey).forEach(([key, hash]) => {
        const operation = previous[key];
        if (operation?.status === "success" && operation.targetHash && operation.targetHash !== hash) {
          next[key] = {
            ...operation,
            status: "idle",
            message: key === "copyAnalysis" ? "未コピー" : "未保存",
            lastTargetSummary: "",
            targetHash: "",
          };
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [currentDatasetHash, currentClusterHash, currentAnalysisHash]);

  useEffect(() => {
    if (!activeDatasetMatchesCurrent || !activeDataset) {
      return;
    }

    setOperationStatus((previous) => {
      const current = previous.saveDataset || EMPTY_OPERATION_STATUS;
      if (current.status === "success" && current.targetHash === currentDatasetHash) {
        return previous;
      }

      return {
        ...previous,
        saveDataset: {
          ...current,
          status: "success",
          message: `保存済み ${formatHistoryDate(activeDataset.savedAt)} / ${activeDataset.count || currentOpinionCount}件 / ${truncateText(activeDataset.theme || theme, 60)}`,
          lastSuccessAt: activeDataset.savedAt || current.lastSuccessAt,
          lastTargetSummary: activeDataset.datasetId,
          lastErrorMessage: "",
          targetHash: currentDatasetHash,
        },
      };
    });
  }, [activeDatasetMatchesCurrent, activeDataset, currentDatasetHash, currentOpinionCount, theme]);

  function clusterExpansionKey(cluster) {
    return `${clusterMethod}:${cluster.label}`;
  }

  function clusterSummaryKey(cluster) {
    return `${clusterMethod}:${cluster.label}`;
  }

  function toggleClusterMembers(cluster) {
    const key = clusterExpansionKey(cluster);

    setExpandedClusterIds((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  function clusterRowDomId(label) {
    return `cluster-row-${stableHash(`${clusterMethod}:${label}`)}`;
  }

  function selectClusterFromGraph(label) {
    if (!label) {
      return;
    }

    const cluster = result.clusterTableRows.find((row) => row.label === label);
    setSelectedClusterId(label);

    if (cluster) {
      const key = clusterExpansionKey(cluster);
      setExpandedClusterIds((previous) => ({
        ...previous,
        [key]: true,
      }));
    }

    window.setTimeout(() => {
      const element = document.getElementById(clusterRowDomId(label));
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function clearActiveClusterRunState() {
    setActiveClusterRunId("");
    setClusterSummaries({});
    setIsClusterSummaryLoadingById({});
    setClusterSummaryErrorById({});
    resetAutoSummaryState();
  }

  function notify(type, message) {
    setToast({ type, message, createdAt: Date.now() });
  }

  function setOperationRunning(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "running",
        message,
        lastRunAt: now,
        lastTargetSummary: targetSummary,
        targetHash,
        lastErrorMessage: "",
      },
    }));
  }

  function setOperationSuccess(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "success",
        message,
        lastSuccessAt: now,
        lastTargetSummary: targetSummary,
        targetHash,
        lastErrorMessage: "",
      },
    }));
    notify("success", message);
  }

  function setOperationError(key, message, targetSummary = "", targetHash = "") {
    const now = new Date().toISOString();
    setOperationStatus((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || EMPTY_OPERATION_STATUS),
        status: "error",
        message,
        lastErrorAt: now,
        lastErrorMessage: message,
        lastTargetSummary: targetSummary,
        targetHash,
      },
    }));
    notify("error", message);
  }

  function resetAutoSummaryState() {
    setIsAutoSummarizing(false);
    setAutoSummaryStatus("未実行");
    setAutoSummaryError("");
    setAutoSummaryProgress({ completed: 0, total: 0, success: 0, failed: 0 });
  }

  function buildClusterSummaryItems(cluster) {
    const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];

    return memberRows
      .slice(0, 10)
      .map((member, index) => ({
        id: String(member.id || index + 1),
        text: String(member.text || "").slice(0, 800),
        duplicateCount: member.duplicateCount || 1,
      }))
      .filter((item) => item.text.trim());
  }

  function chooseSummaryScoreText(summary, representativeText) {
    const supportText = representativeText ? `\n\n代表本文: ${representativeText}` : "";

    if (summary?.cleanOpinion) {
      return { text: `${summary.cleanOpinion}${supportText}`, basis: "cleanOpinion" };
    }

    if (summary?.summary) {
      return { text: `${summary.summary}${supportText}`, basis: "summary" };
    }

    if (summary?.title && summary?.summary) {
      return { text: `${summary.title} ${summary.summary}${supportText}`, basis: "summary" };
    }

    return { text: representativeText || "", basis: "representativeText" };
  }

  function enrichClusterSummary(summary, cluster, sourceItems) {
    const originalScore = axisScoreOnly(cluster.originalScore || cluster);
    const { text, basis } = chooseSummaryScoreText(summary, cluster.opinion);
    const aiSummaryScore = basis === "representativeText" ? null : scoreOpinion(text, themeCategory, axisConfig);

    return {
      ...summary,
      sourceItems,
      scoredText: text,
      score: axisScoreOnly(aiSummaryScore || originalScore),
      originalScore,
      aiSummaryScore,
      scoreBasis: basis,
      scoreReasons: aiSummaryScore?.scoreReasons || ensureScoreReasons(cluster, text, axisConfig),
      relevanceScore: aiSummaryScore?.relevanceScore ?? cluster.relevanceScore ?? null,
      scoreConfidence: aiSummaryScore?.scoreConfidence ?? cluster.scoreConfidence ?? null,
      scoreWarnings: Array.isArray(aiSummaryScore?.scoreWarnings)
        ? aiSummaryScore.scoreWarnings
        : Array.isArray(cluster.scoreWarnings)
          ? cluster.scoreWarnings
          : [],
    };
  }

  async function requestClusterSummary(cluster, options = {}) {
    const items = buildClusterSummaryItems(cluster);

    if (items.length === 0) {
      throw new Error("要約対象の元意見がありません。");
    }

    const response = await fetch(`${API_BASE_URL}/api/cluster-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: options.signal || autoSummaryAbortControllerRef.current?.signal,
      body: JSON.stringify({
        clusterId: cluster.label,
        representativeText: cluster.opinion,
        items,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        PUBLIC_PREVIEW_MODE
          ? "AI要約に失敗しました。元意見の表示は引き続き利用できます。"
          : payload.error || "AI要約に失敗しました。元意見の表示は引き続き利用できます。"
      );
    }

    return enrichClusterSummary(payload, cluster, items);
  }

  async function handleRunClusterSummary(cluster) {
    const key = clusterSummaryKey(cluster);

    setClusterSummaryErrorById((previous) => ({ ...previous, [key]: "" }));
    setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: true }));

    try {
      const payload = await requestClusterSummary(cluster);

      setClusterSummaries((previous) => ({
        ...previous,
        [key]: payload,
      }));
    } catch (error) {
      setClusterSummaryErrorById((previous) => ({
        ...previous,
        [key]: error.message || "AI要約に失敗しました。元意見の表示は引き続き利用できます。",
      }));
    } finally {
      setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: false }));
    }
  }

  async function handleRunAutoSummary() {
    if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
      const shouldContinue = window.confirm(
        "現在、意味クラスタは未実行です。\nこのまま実行すると、文字類似クラスタを対象にAI要約します。\n意味クラスタを使いたい場合は、先に「意味クラスタを実行」を押してください。\nこのままAI要約しますか？"
      );

      if (!shouldContinue) {
        return;
      }
    }

    const sortedClusters = [...result.clusterTableRows].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label, "en", { numeric: true });
    });
    const targets = sortedClusters
      .filter((cluster) => !clusterSummaries[clusterSummaryKey(cluster)])
      .slice(0, Math.min(15, autoSummaryLimit));

    if (targets.length === 0) {
      setAutoSummaryStatus("要約対象の未要約クラスタはありません。");
      setAutoSummaryError("");
      setAutoSummaryProgress({ completed: 0, total: 0, success: 0, failed: 0 });
      setOperationSuccess("autoSummary", "要約対象の未要約クラスタはありません。");
      return;
    }

    if (
      !window.confirm(
        `上位${targets.length}クラスタをAI要約します。OpenAI APIを使用します。実行しますか？`
      )
    ) {
      return;
    }

    autoSummaryAbortControllerRef.current?.abort();
    autoSummaryAbortControllerRef.current = new AbortController();
    autoSummaryStopRequestedRef.current = false;
    setIsAutoSummarizing(true);
    setOperationRunning("autoSummary", `AI要約中... 0 / ${targets.length}`, `上位${targets.length}件`);
    setAutoSummaryError("");
    setAutoSummaryStatus(`実行中：0 / ${targets.length} 件完了`);
    setAutoSummaryProgress({ completed: 0, total: targets.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      if (autoSummaryStopRequestedRef.current) {
        break;
      }

      const cluster = targets[index];
      const key = clusterSummaryKey(cluster);

      setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: true }));
      setClusterSummaryErrorById((previous) => ({ ...previous, [key]: "" }));

      try {
        const payload = await requestClusterSummary(cluster, {
          signal: autoSummaryAbortControllerRef.current?.signal,
        });
        success += 1;
        setClusterSummaries((previous) => ({
          ...previous,
          [key]: payload,
        }));
      } catch (error) {
        if (error?.name === "AbortError" || autoSummaryStopRequestedRef.current) {
          setClusterSummaryErrorById((previous) => ({
            ...previous,
            [key]: "AI要約を停止しました。",
          }));
          break;
        }

        failed += 1;
        setClusterSummaryErrorById((previous) => ({
          ...previous,
          [key]: error.message || "AI要約に失敗しました。元意見の表示は引き続き利用できます。",
        }));
      } finally {
        const completed = index + 1;
        setIsClusterSummaryLoadingById((previous) => ({ ...previous, [key]: false }));
        setAutoSummaryProgress({ completed, total: targets.length, success, failed });
        setAutoSummaryStatus(`実行中：${completed} / ${targets.length} 件完了`);
        setOperationRunning("autoSummary", `AI要約中... ${completed} / ${targets.length}`, `成功${success} / 失敗${failed}`);
      }
    }

    setIsAutoSummarizing(false);
    autoSummaryAbortControllerRef.current = null;

    if (autoSummaryStopRequestedRef.current) {
      setAutoSummaryStatus(`停止：${success}件のAI要約が完了しました`);
      setAutoSummaryError("");
      setOperationError("autoSummary", `AI要約を停止しました。完了 ${success}件`);
      return;
    }

    if (failed > 0) {
      setAutoSummaryStatus(`一部失敗：${targets.length}件中${success}件成功、${failed}件失敗`);
      setAutoSummaryError(`${failed}件のAI要約に失敗しました。失敗したクラスタは個別に再要約できます。`);
      setOperationError("autoSummary", `一部失敗：${targets.length}件中${success}件成功、${failed}件失敗`);
      return;
    }

    setAutoSummaryStatus(`完了：${success}件のクラスタをAI要約しました`);
    setOperationSuccess("autoSummary", `${success}件のクラスタをAI要約しました。`);
  }

  async function handleRunSemanticCluster() {
    const candidateRows = result.noiseProcessingResult.candidateRows || [];
    const limitedRows = candidateRows.slice(0, 100);

    setClusterMethod("semantic");
    setSemanticClusterError("");
    clearActiveClusterRunState();

    if (limitedRows.length < 5) {
      setSemanticClusterRows([]);
      setSemanticClusterStatus("分析対象が少なすぎるため、意味クラスタを実行できません。クラスタリング前に取得条件を改善してください。");
      setOperationError("semanticCluster", "分析対象が少なすぎるため、意味クラスタを実行できません。");
      return;
    }

    setIsSemanticClusterLoading(true);
    setSemanticClusterStatus(`意味クラスタを実行中... ${limitedRows.length}件を送信しています。`);
    setOperationRunning("semanticCluster", `意味クラスタ実行中... ${limitedRows.length}件`, `threshold ${semanticThreshold}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/semantic-cluster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threshold: semanticThreshold,
          items: limitedRows.map((row, index) => ({
            id: String(row.originalNo || index + 1),
            text: row.normalizedText,
            duplicateCount: row.duplicateCount || 1,
          })),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "意味クラスタに失敗しました。");
      }

      const rows = (payload.clusters || []).map((cluster, index) => {
        const representativeText = cluster.representativeText || "";
        const uniqueCount = Math.max(0, Number(cluster.count) || 0);
        const originalCount = Math.max(uniqueCount, Number(cluster.duplicateCount) || uniqueCount);
        const independentOpinionVolume = Math.max(1, uniqueCount || 1);
        const spreadVolume = Math.max(independentOpinionVolume, originalCount);

        return withClusterVolume({
          originalNo: "-",
          label: cluster.id || `C${index + 1}`,
          type: `意味クラスタ ${cluster.id || `C${index + 1}`}`,
          opinion: representativeText,
          group: "cluster",
          count: independentOpinionVolume,
          originalCount,
          uniqueCount,
          independentOpinionVolume,
          spreadVolume,
          volumeForGraph: independentOpinionVolume,
          duplicateCount: Math.max(0, spreadVolume - independentOpinionVolume),
          semanticItemIds: Array.isArray(cluster.itemIds) ? cluster.itemIds : [],
          memberRows: (cluster.items || []).map((item, memberIndex) => ({
            no: memberIndex + 1,
            id: String(item.id || memberIndex + 1),
            label: String(item.id || memberIndex + 1),
            duplicateCount: Math.max(1, Number(item.duplicateCount) || 1),
            independentOpinionVolume: 1,
            spreadVolume: Math.max(1, Number(item.duplicateCount) || 1),
            text: String(item.text || ""),
            originalText: String(item.text || ""),
          })),
          ...scoreOpinion(representativeText, themeCategory, axisConfig),
        });
      });

      setSemanticClusterRows(rows);
      setExpandedClusterIds({});
      setSemanticClusterStatus(
        `成功: ${payload.inputCount || limitedRows.length}件を${rows.length}クラスタにまとめました。`
      );
      setOperationSuccess(
        "semanticCluster",
        `${payload.inputCount || limitedRows.length}件を${rows.length}クラスタにまとめました。`,
        `threshold ${semanticThreshold}`
      );
    } catch (error) {
      setSemanticClusterRows([]);
      setSemanticClusterError(error.message || "意味クラスタに失敗しました。");
      setSemanticClusterStatus("");
      setOperationError("semanticCluster", `意味クラスタに失敗しました。理由：${error.message || "不明"}`);
    } finally {
      setIsSemanticClusterLoading(false);
    }
  }

  function buildAnalysisMarkdown() {
    const stats = result.noiseProcessingResult;
    const sampleNo = currentSample.sampleNo || sampleNoForKey(sampleKey);
    const sampleLabel = sampleTitle(currentSample, sampleKey);
    const xFetchCount = xPosts.length > 0 ? `${xPosts.length}件` : "未取得または不明";
    const clusterRows = result.clusterTableRows;
    const opinionRows = result.tableRows.slice(0, 20);
    const summarizedCount = clusterRows.filter((cluster) => clusterSummaries[clusterSummaryKey(cluster)]).length;
    const unsummarizedCount = Math.max(0, clusterRows.length - summarizedCount);
    const scoreReasonMarkdown = (cluster, axis) => {
      const reason = scoreReasonForDisplay(cluster, axis);
      return reason
        ? `${axis.toUpperCase()}:${reason.score} ${reason.reason} 根拠語:${reason.evidenceKeywords?.join("/") || "少ない"} 信頼度:${reason.confidence}`
        : `${axis.toUpperCase()}:理由なし`;
    };
    const semanticStatusText =
      semanticClusterError || semanticClusterStatus || (semanticClusterRows.length > 0 ? "実行済み" : "未実行");
    const xDataStateLabel =
      xDataStatus === "empty"
        ? "未取得"
        : xDataStatus === "cached"
        ? "保存済みデータを使用中"
        : xDataStatus === "unsaved"
          ? "未保存の新規取得データ"
          : xDataStatus === "fetching"
            ? "X API取得中"
            : "サンプルまたは手入力データ";
    const personaAStrict = stats.personaAStrictRelevance || {};
    const personaATopExclusionCategories = Object.entries(personaAStrict.exclusionCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
      .join(" / ") || "なし";
    const purposeMarkdownLines = [
      `- ${JP_UI_LABELS.analysisPurpose}: ${currentAnalysisPurposeConfig.label}`,
      `- ${JP_UI_LABELS.retrievalPolicy}: ${currentAnalysisPurposeConfig.retrievalPolicy}`,
      `- ${JP_UI_LABELS.clusterPolicy}: ${currentAnalysisPurposeConfig.clusterPolicy}`,
      `- ${JP_UI_LABELS.zone11Policy}: ${currentAnalysisPurposeConfig.zone11Policy}`,
    ];
    const zone12ZeroAnalysisMessage = zone12ZeroAnalysisSummary
      ? `分析対象が0件です。X APIから投稿は返っていますが、ノイズ除去後に残りませんでした。取得本文数:${zone12ZeroAnalysisSummary.fetchedCount}件 / ノイズ除外:${zone12ZeroAnalysisSummary.noiseRemovedCount}件 / 主な理由:${zone12ZeroAnalysisSummary.reasons.join(" / ") || "なし"}`
      : "なし";
    const zone12InspectionMarkdownLines = [
      "- Zone⑫表示仕様: 採用・境界・ノイズ投稿を検証できる一覧",
      `- 黄色マーカー対象語: ${zone12HighlightTerms.length ? zone12HighlightTerms.join(" / ") : "なし"}`,
      `- 表示対象フィルタ: ${ZONE12_FILTERS.find((item) => item.value === zone12Filter)?.label || zone12Filter}`,
      "- ノイズ背景表示: ON",
      "- ハッシュタグ表示: ON",
      `- 主なノイズ理由: ${zone12TopNoiseReasons.length ? zone12TopNoiseReasons.join(" / ") : "なし"}`,
      `- 分析対象0件診断: ${zone12ZeroAnalysisMessage}`,
    ];

    if (viewMode === "user") {
      const userLines = [
        "# 3DE 分析結果",
        "",
        "## 基本情報",
        `- バージョン: ${APP_VERSION}`,
        `- 利用目的: ${currentPersonaConfig.label}`,
        ...purposeMarkdownLines,
        `- テーマカテゴリ: ${themeCategory}`,
        `- 評価軸の決定方法: テーマ優先`,
        `- ペルソナ補正: 出力表現のみ`,
        `- ${JP_UI_LABELS.voicesToCollect}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
        `- テーマ: ${theme || "なし"}`,
        `- 自分の意見: ${userOpinion || "なし"}`,
        `- 実行した検索条件: ${PUBLIC_PREVIEW_MODE ? "検索条件レビューに表示された語をもとに安全化して送信" : effectiveQuery || "なし"}`,
        ...(!PUBLIC_PREVIEW_MODE ? [`- 最終送信クエリ: ${safeQueryPreview.finalQueryForXApi || "なし"}`] : []),
        `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
        `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
        `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
        `- 取得件数: ${xFetchCount}`,
        `- 分析に使えた意見: ${stats.analysisTargetCount}件`,
        `- 似た意見のまとまり: ${clusterRows.length}件`,
        `- 取得品質メッセージ: ${stats.retrievalKpi.message}`,
        `- Persona A strict relevance mode: ${personaAStrict.enabled ? "ON" : "OFF"}`,
        `- 除外された曖昧な意見: ${personaAStrict.ambiguousExcludedCount || 0}件`,
        `- ${JP_UI_LABELS.borderlineOpinions}: ${personaAStrict.borderlineCount || 0}件`,
        `- Top exclusion categories: ${personaATopExclusionCategories}`,
        `- ${JP_UI_LABELS.referenceDisplay}: ${personaAStrict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"}`,
        userReferenceGraphWarning ? `- グラフ表示: 参考表示。${userReferenceGraphMessage}` : "- グラフ表示: 通常表示",
        "",
        "## Zone⑫ 検証表示",
        ...zone12InspectionMarkdownLines,
        "",
        `## Zone⑪ ${userFeedback.feedbackTitle}`,
        ...(personaMode === "personaA"
          ? [
              `### ${JP_UI_LABELS.empathy}`,
              ...userFeedback.personaSections.map(([title, body]) => `- ${title}: ${body}`),
              "",
              `### ${JP_UI_LABELS.analysisMemo}`,
              ...personaAAnalysisMemoItems().map(([label, value]) => `- ${label}: ${value}`),
            ]
          : [
              `- 今回の意見空間の傾向: ${userFeedback.overview}`,
              `- あなたの意見の位置づけ: ${userFeedback.userPosition}`,
              `- 外部意見とのズレ: ${userFeedback.gap}`,
              "- 足りない視点:",
              ...userFeedback.missingPerspectives.map((item) => `  - ${item}`),
              "- 次に考えるべき問い:",
              ...userFeedback.nextQuestions.map((question) => `  - ${question}`),
            ]),
        "",
        "## クラスタ一覧の要約",
        ...(clusterRows.length
          ? clusterRows.map((cluster) => {
              const summary = clusterSummaries[clusterSummaryKey(cluster)];
              const volume = clusterVolumeFromRow(cluster);
              return `- ${cluster.label}: 独立意見数 ${volume.independent} / ${summary?.title || truncateText(cluster.opinion, 80)}`;
            })
          : ["- クラスタはありません"]),
      ];

      return gateAnalysisMarkdown(userLines.join("\n"), viewMode);
    }

    const lines = [
      "# 3DE 分析結果",
      "",
      "## 基本情報",
      `- バージョン: ${APP_VERSION}`,
      `- サンプルNo: ${sampleNo || "No未設定"}`,
      `- サンプル: ${sampleLabel}`,
      `- テーマカテゴリ: ${themeCategory}`,
      `- テーマ: ${theme}`,
      `- viewMode: ${viewMode}`,
      `- personaMode: ${personaMode}`,
      `- 利用目的: ${currentPersonaConfig.label}`,
      `- 利用目的説明: ${currentPersonaConfig.description}`,
      ...purposeMarkdownLines,
      `- 評価軸の決定方法: テーマ優先`,
      `- 選択中の軸ソース: ${axisConfig.axisSource || "theme"}`,
      `- ペルソナ補正: 出力表現のみ`,
      `- ${JP_UI_LABELS.voicesToCollect}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
      `- ${JP_UI_LABELS.queryAdjustment}: ${normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}`,
      `- Persona A strict relevance mode: ${personaAStrict.enabled ? "ON" : "OFF"}`,
      `- 除外された曖昧な意見: ${personaAStrict.ambiguousExcludedCount || 0}件`,
      `- ${JP_UI_LABELS.borderlineOpinions}: ${personaAStrict.borderlineCount || 0}件`,
      `- Top exclusion categories: ${personaATopExclusionCategories}`,
      `- ${JP_UI_LABELS.referenceDisplay}: ${personaAStrict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"}`,
      `- 保存データのテーマ: ${activeDataset?.theme || "なし"}`,
      `- 保存データの自分の意見: ${activeDataset?.userOpinion || "なし"}`,
      `- 現在画面のテーマ: ${theme || "なし"}`,
      `- 現在画面の自分の意見: ${userOpinion || "なし"}`,
      `- 表示モード: ${graphMode}`,
      `- クラスタ方式: ${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}`,
      `- 文字類似しきい値: ${stats.threshold.toFixed(2)}`,
      `- 意味類似しきい値: ${semanticThreshold.toFixed(2)}`,
      `- 意味クラスタ実行状態: ${semanticStatusText}`,
      `- 意味クラスタ数: ${semanticClusterRows.length > 0 ? semanticClusterRows.length : "未実行"}`,
      `- 現在のXデータ状態: ${xDataStateLabel}`,
      `- activeDatasetId: ${activeDatasetId || "なし"}`,
      `- Xデータ保存日時: ${activeDataset?.savedAt ? formatHistoryDate(activeDataset.savedAt) : "なし"}`,
      `- クラスタリング結果保存状態: ${activeClusterRunId ? "保存済みrunを表示中" : "未保存または未選択"}`,
      `- activeClusterRunId: ${activeClusterRunId || "なし"}`,
      `- クラスタリング履歴件数: ${activeDataset?.clusterRuns?.length || 0}`,
      `- 選択クエリ候補数: ${selectedXQueryCandidates.length}`,
      `- AI生成クエリ候補使用中: ${generatedXQueryCandidates ? "はい" : "いいえ"}`,
      `- AI生成基本キーワード: ${generatedBasicKeywords.length ? generatedBasicKeywords.join(" / ") : "なし"}`,
      `- 選択ハッシュタグ候補: ${selectedHashtagValues.length ? selectedHashtagValues.join(" / ") : "なし"}`,
      `- 選択除外語: ${selectedExcludeTermValues.length ? selectedExcludeTermValues.join(" / ") : "なし"}`,
      `- テーマ別検索クエリ候補: ${
        xQueryCandidates.length ? xQueryCandidates.map((candidate) => candidate.base || candidate.query || candidate.label).join(" / ") : "なし"
      }`,
      `- テーマ別ハッシュタグ候補: ${
        hashtagCandidates.length ? hashtagCandidates.map((candidate) => `${candidate.hashtag}:${candidate.selectionType}`).join(" / ") : "なし"
      }`,
      `- personaMode変更履歴: ${
        personaModeHistory.length
          ? personaModeHistory
              .map((item) => `${formatHistoryDate(item.changedAt)} ${personaConfigFor(item.from).label}→${personaConfigFor(item.to).label}`)
              .join(" / ")
          : "なし"
      }`,
      `- 実行クエリ種別: ${queryKindLabel(selectedHashtagValues.length, effectiveQuery)}`,
      `- 選択クエリ候補: ${
        selectedXQueryCandidates.length > 0
          ? selectedXQueryCandidates.map((candidate) => candidate.label).join(" / ")
          : "なし"
      }`,
      `- 実行X検索クエリ: ${effectiveQuery || "なし"}`,
      `- 元クエリ: ${safeQueryPreview.rawQuery || "なし"}`,
      `- 整形後クエリ: ${safeQueryPreview.safeQuery || "なし"}`,
      `- 予備クエリ: ${safeQueryPreview.fallbackQuery || "なし"}`,
      `- 最終送信クエリ: ${safeQueryPreview.finalQueryForXApi || "なし"}`,
      `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.cautionTerms}: ${queryReviewParts.cautionTerms.length ? queryReviewParts.cautionTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.disabledTerms}: ${queryReviewParts.disabledTerms.length ? queryReviewParts.disabledTerms.join(" / ") : "なし"}`,
      `- クエリ長: ${safeQueryPreview.queryLength || 0}`,
      `- 最終送信クエリ長: ${safeQueryPreview.finalQueryLength || 0}`,
      `- 予備クエリ長: ${safeQueryPreview.fallbackQueryLength || 0}`,
      `- 整形時の注意: ${
        safeQueryPreview.queryBuildWarnings?.length ? safeQueryPreview.queryBuildWarnings.join(" / ") : "なし"
      }`,
      `- サニタイズ結果: ${
        safeQueryPreview.sanitizedHashtags?.length ? safeQueryPreview.sanitizedHashtags.join(" / ") : "なし"
      }`,
      `- 除外されたハッシュタグ: ${
        safeQueryPreview.sanitizedHashtagRemovedParts?.length
          ? safeQueryPreview.sanitizedHashtagRemovedParts
              .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
              .join(" / ")
          : "なし"
      }`,
      `- 整形後の除外語: ${
        safeQueryPreview.sanitizedExcludeTerms?.length ? safeQueryPreview.sanitizedExcludeTerms.join(" / ") : "なし"
      }`,
      `- 除外された除外語: ${
        safeQueryPreview.sanitizedExcludeRemovedParts?.length
          ? safeQueryPreview.sanitizedExcludeRemovedParts
              .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
              .join(" / ")
          : "なし"
      }`,
      `- X取得件数: ${xFetchCount}`,
      "- ボリューム定義: グラフの円サイズ・色は独立した類似意見数（independentOpinionVolume）だけを使います。",
      "- 拡散ボリューム: RT、同一コメント、コピペ、類似テンプレート投稿はspreadVolumeとして参考保持し、基本分析・グラフボリュームには採用しません。",
      "- 注意: このボリュームは世論調査や市場全体の量ではありません。今回取得できた分析対象内での相対的なまとまりです。",
      `- 分析モード: ${analysisMode === "axisDriven" ? "評価軸に合わせて取得する" : "広く探索する"}`,
      `- 評価軸連動キーワード: ${axisLinkedKeywords.all.length ? axisLinkedKeywords.all.join(" / ") : "なし"}`,
      `- 選択された評価軸連動キーワード: ${selectedAxisLinkedKeywords.length ? selectedAxisLinkedKeywords.join(" / ") : "なし"}`,
      "- 評価軸と検索クエリの噛み合い警告:",
      ...(queryAxisWarnings.length ? queryAxisWarnings.map((warning) => `  - ${warning}`) : ["  - なし"]),
      `- 評価軸プリセット: ${axisPresetLabel(axisConfig)}`,
      `- スコア表示方式: ${scoreDisplayModeLabel(scoreDisplayMode)}（実表示: ${scoreDisplayModeLabel(result.resolvedScoreDisplayMode)}）`,
      `- ノイズ除去: ${stats.noiseFilterEnabled ? "ON" : "OFF"}`,
      `- ノイズ除外件数: ${stats.noiseExcludedCount}`,
      `- 分析対象件数: ${stats.analysisTargetCount}`,
      `- 独立意見数: ${stats.independentOpinionCount}`,
      `- 独立意見率: ${formatPercent(stats.independentOpinionRate || 0)}`,
      `- 拡散参考数: ${stats.spreadReferenceCount}`,
      `- 拡散支配率: ${formatPercent(stats.spreadDominanceRate || 0)}`,
      `- 拡散テンプレート検出数: ${stats.spreadTemplateCount || 0}`,
      `- ノイズ除外理由: ${stats.noiseReasonSummary}`,
      `- 段階取得: ${stagedFetchEnabled ? "ON" : "OFF"}`,
      `- ユーザーmode自動取得: ${viewMode === "user" ? "ON" : "OFF"}`,
      `- ${JP_UI_LABELS.autoFetchSafetyLimit}: ${MAX_USER_AUTO_FETCH_ROUNDS}回以上。無限ループ防止用であり、取得件数の上限ではありません。`,
      `- 取得診断状態: ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}`,
      `- 取得診断判断: ${stagedFetchState.diagnosisDecision || "なし"}`,
      `- 目標件数: ${Number(xMaxResults) || 0}件`,
      `- 現在データ件数: ${stagedCurrentDataCount}件`,
      `- 残り取得可能件数: ${stagedRemainingCount}件`,
      `- 次回追加取得件数: ${stagedNextFetchCount}件`,
      `- X API取得累計件数: ${stagedFetchState.totalApiFetchedCount || stagedCurrentDataCount}件`,
      `- 改善クエリ追加取得回数: ${stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}`,
      `- このクエリのまま追加取得回数: ${stagedFetchState.continueRemainingCount || 0}`,
      `- 変更前クエリ: ${stagedFetchState.beforeQuery || "なし"}`,
      `- 変更後クエリ: ${stagedFetchState.afterQuery || "なし"}`,
      `- 停止理由: ${stopReasonLabel(stagedFetchState.stopReason)}`,
      "- 評価軸:",
      ...axisExplanationItems(axisConfig).flatMap((item) => [
        `  - ${item.axis.toUpperCase()} ${item.label}: ${item.description}`,
        `    - 高: ${item.high}`,
        `    - 低: ${item.low}`,
      ]),
      "- 評価軸品質チェック:",
      ...(axisQualityWarnings.length ? axisQualityWarnings.map((warning) => `  - ${warning}`) : ["  - 注意なし"]),
      "",
      "## スコア分布",
      "| 軸 | min | max | average | standardDeviation | uniqueScoreCount | mostCommonScore | mostCommonScoreRatio | 集中 |",
      "|---|---:|---:|---:|---:|---:|---:|---:|---|",
      ...["x", "y", "z"].map((axis) => {
        const statsForAxis = result.scoreDistribution?.[axis] || {};
        return `| ${escapeMarkdownTableCell(axisLabel(axis, axisConfig))} | ${statsForAxis.min ?? 0} | ${statsForAxis.max ?? 0} | ${Number(statsForAxis.average || 0).toFixed(2)} | ${Number(statsForAxis.standardDeviation || 0).toFixed(2)} | ${statsForAxis.uniqueScoreCount ?? 0} | ${statsForAxis.mostCommonScore ?? 0} | ${formatPercent(statsForAxis.mostCommonScoreRatio || 0)} | ${statsForAxis.concentrated ? "あり" : "なし"} |`;
      }),
      "",
      "## スコア集中アラート",
      ...(scoreConcentrationMessages.length ? scoreConcentrationMessages.map((message) => `- ${message}`) : ["- なし"]),
      "",
      "## グラフ表示",
      "- X/Y/Z: 現在の評価軸スコア",
      "- 青/赤の円: 外部意見クラスタ",
      "- 点の大きさ: volumeForGraph。原則として independentOpinionVolume と同じです。",
      "- 点の色: volumeForGraph（青=独立意見少、黄=中、赤=多）",
      "- spreadVolume: 拡散参考数として保持しますが、グラフの円サイズ・色には使いません。",
      "- ひし形: 自分の意見",
      "- 四角: 取得直後の平均、または分析対象クラスタの平均",
      "- クラスタ点クリック: Zone⑨の該当クラスタへ移動",
      "",
      "## ハッシュタグ自動選択",
      `- 自動選択状態: ${hasManualHashtagSelection ? "ユーザーが手動調整済み" : "推奨候補を最大3件まで自動選択"}`,
      `- 選択中: ${selectedHashtagValues.length ? selectedHashtagValues.join(" / ") : "なし"}`,
      `- 自動推奨候補: ${autoSelectedHashtagValues.length ? autoSelectedHashtagValues.join(" / ") : "なし"}`,
      `- 注意候補: ${hashtagCandidates.filter((candidate) => candidate.selectionType === "caution").map((candidate) => candidate.hashtag).join(" / ") || "なし"}`,
      `- 非推奨候補: ${hashtagCandidates.filter((candidate) => candidate.selectionType === "disabled").map((candidate) => candidate.hashtag).join(" / ") || "なし"}`,
      "",
      `## ${JP_UI_LABELS.queryReview}`,
      `- ${JP_UI_LABELS.analysisPurpose}: ${queryReviewParts.analysisPurposeLabel}`,
      `- ${JP_UI_LABELS.retrievalPolicy}: ${queryReviewParts.retrievalPolicy}`,
      `- ${JP_UI_LABELS.clusterPolicy}: ${queryReviewParts.clusterPolicy}`,
      `- ${JP_UI_LABELS.zone11Policy}: ${queryReviewParts.zone11Policy}`,
      `- ${JP_UI_LABELS.includeTerms}: ${queryReviewParts.includeTerms.length ? queryReviewParts.includeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.includeHashtags}: ${queryReviewParts.includeHashtags.length ? queryReviewParts.includeHashtags.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.excludeTerms}: ${queryReviewParts.excludeTerms.length ? queryReviewParts.excludeTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.cautionTerms}: ${queryReviewParts.cautionTerms.length ? queryReviewParts.cautionTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.disabledTerms}: ${queryReviewParts.disabledTerms.length ? queryReviewParts.disabledTerms.join(" / ") : "なし"}`,
      `- ${JP_UI_LABELS.finalTrustedQuery}: ${queryReviewParts.finalQueryForXApi || "なし"}`,
      "",
      "## Zone⑫ 検証表示",
      ...zone12InspectionMarkdownLines,
      "",
      "## 検索クエリ候補",
      "| ラベル | 説明 | 検索式 |",
      "|---|---|---|",
      ...(xQueryCandidates.length > 0
        ? xQueryCandidates.map(
            (candidate) =>
              `| ${escapeMarkdownTableCell(candidate.label)} | ${escapeMarkdownTableCell(
                candidate.description || candidate.note || ""
              )} | ${escapeMarkdownTableCell(candidate.base || candidate.query || "")} |`
          )
        : ["| なし | なし | なし |"]),
      "",
      `## Zone⑪ ${userFeedback.feedbackTitle}`,
      ...(personaMode === "personaA"
        ? [
            `### ${JP_UI_LABELS.empathy}`,
            ...userFeedback.personaSections.map(([title, body]) => `- ${title}: ${body}`),
            "",
            `### ${JP_UI_LABELS.analysisMemo}`,
            ...personaAAnalysisMemoItems().map(([label, value]) => `- ${label}: ${value}`),
          ]
        : userFeedback.personaSections.length
          ? userFeedback.personaSections.flatMap(([title, body], index) => [`- ${index + 1}. ${title}: ${body}`])
          : []),
      `- 今回の意見空間の傾向: ${userFeedback.overview}`,
      `- あなたの意見の位置づけ: ${userFeedback.userPosition}`,
      `- 外部意見とのズレ: ${userFeedback.gap}`,
      `- 評価軸と検索クエリの噛み合い: ${userFeedback.queryAxisFit}`,
      "- スコア分布の注意:",
      ...(scoreConcentrationMessages.length ? scoreConcentrationMessages.map((message) => `  - ${message}`) : ["  - 現在のクラスタでは大きな集中は検出されていません。"]),
      "- 近いクラスタ:",
      ...userFeedback.nearClusters.map(
        (cluster) => `  - ${cluster.label}: 距離 ${cluster.distance.toFixed(1)} / ${truncateText(cluster.title, 120)}`
      ),
      "- 遠いクラスタ:",
      ...userFeedback.farClusters.map(
        (cluster) => `  - ${cluster.label}: 距離 ${cluster.distance.toFixed(1)} / ${truncateText(cluster.title, 120)}`
      ),
      "- 足りない視点:",
      ...userFeedback.missingPerspectives.map((item) => `  - ${item}`),
      "- 次に考えるべき問い:",
      ...userFeedback.nextQuestions.map((question) => `  - ${question}`),
      "",
      "## 自分の意見",
      userOpinion || "（未入力）",
      "",
      "## X検索条件",
      effectiveQuery || xQuery || "（未入力）",
      "",
      "## ②ノイズ処理・クラスタ化 集計",
      "| 指標 | 値 |",
      "|---|---:|",
      `| 処理意見数 | ${stats.rawCount} |`,
      `| 正規化後ユニーク本文数 | ${stats.uniqueNormalizedCount} |`,
      `| 完全重複数 | ${stats.duplicateCount} |`,
      `| 独立意見数 | ${stats.independentOpinionCount} |`,
      `| 独立意見率 | ${formatPercent(stats.independentOpinionRate || 0)} |`,
      `| 拡散参考数 | ${stats.spreadReferenceCount} |`,
      `| 拡散支配率 | ${formatPercent(stats.spreadDominanceRate || 0)} |`,
      `| 拡散テンプレート検出数 | ${stats.spreadTemplateCount || 0} |`,
      `| RT風投稿数 | ${stats.retweetLikeCount} |`,
      `| RT本文抽出成功数 | ${stats.rtExtractSuccessCount} |`,
      `| URL付き投稿数 | ${stats.urlCount} |`,
      `| URL除去後本文あり数 | ${stats.urlTextRemainingCount} |`,
      `| 短すぎる投稿数 | ${stats.tooShortCount} |`,
      `| 取得診断状態 | ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} |`,
      `| 取得診断取得件数 | ${stagedFetchState.diagnosis?.fetchedCount ?? 0} |`,
      `| 取得診断分析対象件数 | ${stagedFetchState.diagnosis?.analysisCandidateCount ?? 0} |`,
      `| 取得診断ノイズ率 | ${formatPercent(stagedFetchState.diagnosis?.noiseRate ?? 0)} |`,
      `| 取得診断候補率 | ${formatPercent(stagedFetchState.diagnosis?.candidateRate ?? 0)} |`,
      `| 取得診断理由 | ${escapeMarkdownTableCell((stagedFetchState.diagnosis?.problemReasons || []).join(" / ") || "なし")} |`,
      `| 取得品質総合 | ${escapeMarkdownTableCell(qualityLabel(stats.retrievalKpi.overallRetrievalQuality))} |`,
      `| 取得品質メッセージ | ${escapeMarkdownTableCell(stats.retrievalKpi.message)} |`,
      `| 分析対象率 | ${formatPercent(stats.retrievalKpi.analysisCandidateRate)} |`,
      `| 重複/RT率 | ${formatPercent(stats.retrievalKpi.duplicateLikeRate)} |`,
      `| 多様性スコア | ${formatScore(stats.retrievalKpi.diversityScore)} |`,
      `| 読みやすさスコア | ${formatScore(stats.retrievalKpi.readLoadScore)} |`,
      `| コスト効率スコア | ${formatScore(stats.retrievalKpi.costEfficiencyScore)} |`,
      `| クラスタ数判定 | ${escapeMarkdownTableCell(stats.retrievalKpi.clusterJudgement.label)} |`,
      `| 境界意見件数 | ${stats.borderlineUsefulCount || 0} |`,
      `| 関連度しきい値 | ${noiseRelevanceThreshold} |`,
      `| ノイズ除去 | ${stats.noiseFilterEnabled ? "ON" : "OFF"} |`,
      `| ノイズ除外件数 | ${stats.noiseExcludedCount} |`,
      `| Persona A strict relevance | ${personaAStrict.enabled ? "ON" : "OFF"} |`,
      `| Persona A除外数 | ${personaAStrict.excludedCount || 0} |`,
      `| Persona A境界意見数 | ${personaAStrict.borderlineCount || 0} |`,
      `| Persona A上位除外カテゴリ | ${escapeMarkdownTableCell(personaATopExclusionCategories)} |`,
      `| ノイズ除外理由 | ${escapeMarkdownTableCell(stats.noiseReasonSummary)} |`,
      `| 分析対象候補数 | ${stats.candidateCount} |`,
      `| 処理後クラスタ数 | ${stats.clusterCount} |`,
      `| クラスタ方式 | ${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"} |`,
      `| 文字類似しきい値 | ${stats.threshold.toFixed(2)} |`,
      `| 意味類似しきい値 | ${semanticThreshold.toFixed(2)} |`,
      `| 意味クラスタ実行状態 | ${escapeMarkdownTableCell(semanticStatusText)} |`,
      `| 意味クラスタ数 | ${semanticClusterRows.length > 0 ? semanticClusterRows.length : "未実行"} |`,
      `| ノイズ除外ユニーク数 | ${stats.noiseExcludedUniqueCount} |`,
      `| 分析対象率 | ${formatPercent(stats.analysisTargetRate)} |`,
      `| クラスタ圧縮率 | ${formatPercent(stats.clusterCompressionRate)} |`,
      "",
      "## 取得品質診断",
      `- AI改善アドバイス: ${stagedFetchState.aiQueryAdvice?.diagnosisSummary || "なし"}`,
      `- 推奨クエリ: ${stagedFetchState.aiQueryAdvice?.recommendedQuery || stagedFetchState.recommendedQuery || "なし"}`,
      `- ユーザー向けメッセージ: ${stagedFetchState.aiQueryAdvice?.userMessage || "なし"}`,
      "",
      "### ノイズ分類内訳",
      "| 分類 | 件数 | 対策 |",
      "|---|---:|---|",
      ...((stagedFetchState.noiseBreakdown || []).length
        ? stagedFetchState.noiseBreakdown.map(
            (item) =>
              `| ${escapeMarkdownTableCell(item.label)} | ${item.count} | ${escapeMarkdownTableCell(item.advice)} |`
          )
        : ["| なし | 0 | なし |"]),
      "",
      "### 検索語ごとの診断",
      "| 検索語 | 状態 | 問題 | 対策 | 候補 |",
      "|---|---|---|---|---|",
      ...((stagedFetchState.queryTermDiagnosis || []).length
        ? stagedFetchState.queryTermDiagnosis.map(
            (item) =>
              `| ${escapeMarkdownTableCell(item.term)} | ${escapeMarkdownTableCell(item.status)} | ${escapeMarkdownTableCell(item.problem)} | ${escapeMarkdownTableCell(item.advice)} | ${escapeMarkdownTableCell(item.suggestion || "")} |`
          )
        : ["| なし | なし | なし | なし | なし |"]),
      "",
      "### AI改善アドバイスの主な問題",
      ...((stagedFetchState.aiQueryAdvice?.mainProblems || []).length
        ? stagedFetchState.aiQueryAdvice.mainProblems.map((problem) => `- ${problem}`)
        : ["- なし"]),
      "",
      "### 改善前後比較",
      "| 指標 | 改善前 | 改善後 |",
      "|---|---:|---:|",
      ...(stagedFetchState.improvementComparison
        ? [
            `| 分析対象 | ${stagedFetchState.improvementComparison.beforeAnalysisCandidateCount} | ${stagedFetchState.improvementComparison.afterAnalysisCandidateCount} |`,
            `| ノイズ率 | ${formatPercent(stagedFetchState.improvementComparison.beforeNoiseRate)} | ${formatPercent(stagedFetchState.improvementComparison.afterNoiseRate)} |`,
            `| 重複率 | ${formatPercent(stagedFetchState.improvementComparison.beforeDuplicateRate)} | ${formatPercent(stagedFetchState.improvementComparison.afterDuplicateRate)} |`,
          ]
        : ["| なし | 0 | 0 |"]),
      `- 次アクション: ${
        stagedFetchState.improvementComparison?.message ||
        (stagedFetchState.diagnosis?.recommendedNextActions || []).join(" / ") ||
        "なし"
      }`,
      "",
      "## 段階取得ログ",
      "| 回 | 方法 | 要求 | API返却数 | 取得本文数 | 新規追加数 | 重複スキップ数 | ノイズ除外数 | 分析対象数 | 追加後件数 | 残り | 停止理由 | 予備クエリ使用 | 警告 | クエリ |",
      "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|",
      ...((stagedFetchState.stageLogs || []).length
        ? stagedFetchState.stageLogs.map(
            (stage) =>
              `| ${stage.stageNo} | ${escapeMarkdownTableCell(stage.actionLabel)} | ${stage.requestedFetchCount ?? stage.currentBatchCount} | ${stage.apiReturnedCount ?? stage.currentBatchCount} | ${stage.rawFetchedCount ?? stage.apiReturnedCount ?? 0} | ${stage.newUniqueCount ?? stage.currentBatchCount} | ${stage.duplicateSkippedCount ?? 0} | ${stage.noiseRemovedCount ?? 0} | ${stage.analysisCandidateCount} | ${stage.addedToCurrentDataCount ?? stage.newUniqueCount ?? 0} | ${stage.remainingCount ?? 0} | ${escapeMarkdownTableCell(stopReasonLabel(stage.stopReason))} | ${stage.fallbackUsed ? "あり" : "なし"} | ${escapeMarkdownTableCell((stage.queryBuildWarnings || []).join(" / ") || "なし")} | ${escapeMarkdownTableCell(stage.query)} |`
          )
        : ["| 0 | 未実行 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 停止理由なし | false | なし | なし |"]),
      "",
      "### クエリビルダー詳細ログ",
      "| 回 | 整形状態 | 予備クエリ使用 | 再試行回数 | 元クエリ | 整形後クエリ | 予備クエリ | 最終送信クエリ | APIエラー | 除外されたハッシュタグ | 除外された除外語 | 整形時の注意 |",
      "|---:|---|---|---:|---|---|---|---|---|---|---|---|",
      ...((stagedFetchState.stageLogs || []).length
        ? stagedFetchState.stageLogs.map(
            (stage) =>
              `| ${stage.stageNo} | ${escapeMarkdownTableCell(queryBuildStatusLabel(stage.queryBuildStatus))} | ${stage.fallbackUsed ? "あり" : "なし"} | ${stage.retryCount || 0} | ${escapeMarkdownTableCell(stage.rawQuery || "")} | ${escapeMarkdownTableCell(stage.safeQuery || "")} | ${escapeMarkdownTableCell(stage.fallbackQuery || "")} | ${escapeMarkdownTableCell(stage.finalQueryForXApi || stage.query || "")} | ${escapeMarkdownTableCell(stage.apiErrorMessage || "")} | ${escapeMarkdownTableCell((stage.sanitizedHashtagRemovedParts || []).map((item) => `${item.input}->${item.output || "除外"}:${item.reason}`).join(" / ") || "なし")} | ${escapeMarkdownTableCell((stage.sanitizedExcludeRemovedParts || []).map((item) => `${item.input}->${item.output || "除外"}:${item.reason}`).join(" / ") || "なし")} | ${escapeMarkdownTableCell((stage.queryBuildWarnings || []).join(" / ") || "なし")} |`
          )
        : ["| 0 | 未実行 | false | 0 | なし | なし | なし | なし | なし | なし | なし | なし |"]),
      "",
      "## クラスタ一覧",
      `- 要約済みクラスタ数: ${summarizedCount}`,
      `- 未要約クラスタ数: ${unsummarizedCount}`,
      `| クラスタ | 独立意見数 | 拡散参考数 | グラフ反映 | ${scoreAxisHeader(axisLabels.x, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.y, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.z, scoreDisplayMode)} | XYZ評価理由 | スコア詳細 | スコア根拠 | 代表本文またはAI整理 |`,
      "|---|---:|---:|---:|---:|---:|---:|---|---|---|---|",
    ];

    if (clusterRows.length === 0) {
      lines.push("| なし | 0 | 0 | 0 |  |  |  |  |  |  | クラスタはありません |");
    } else {
      clusterRows.forEach((cluster) => {
        const volume = clusterVolumeFromRow(cluster);
        const summary = clusterSummaries[clusterSummaryKey(cluster)];
        const displayText = summary
          ? `${summary.title} / ${summary.cleanOpinion || summary.summary}`
          : cluster.opinion;
        const scoreDetail = [
          `表示方式:${scoreDisplayModeLabel(scoreDisplayMode)}`,
          `independentOpinionVolume:${volume.independent}`,
          `spreadVolume:${volume.spread}`,
          `volumeForGraph:${volume.graph}`,
          `表示:${getScoreTripletForDisplay(cluster, scoreDisplayMode)}`,
          `絶対:${cluster.absoluteScore?.x ?? cluster.x}/${cluster.absoluteScore?.y ?? cluster.y}/${cluster.absoluteScore?.z ?? cluster.z}`,
          `相対:${cluster.relativeScore?.x ?? cluster.x}/${cluster.relativeScore?.y ?? cluster.y}/${cluster.relativeScore?.z ?? cluster.z}`,
          `関連度:${cluster.relevanceScore ?? "-"}`,
          `信頼度:${cluster.scoreConfidence ?? "-"}`,
          `警告:${Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length ? cluster.scoreWarnings.join(" / ") : "なし"}`,
        ].join(" / ");
        lines.push(
          `| ${escapeMarkdownTableCell(cluster.label)} | ${volume.independent} | ${volume.spread} | ${volume.graph} | ${getScoreForDisplay(cluster, "x", scoreDisplayMode)} | ${getScoreForDisplay(cluster, "y", scoreDisplayMode)} | ${getScoreForDisplay(cluster, "z", scoreDisplayMode)} | ${escapeMarkdownTableCell(["x", "y", "z"].map((axis) => scoreReasonMarkdown(cluster, axis)).join(" / "))} | ${escapeMarkdownTableCell(scoreDetail)} | ${escapeMarkdownTableCell(scoreBasisLabel(cluster.scoreBasis))} | ${escapeMarkdownTableCell(displayText)} |`
        );
      });
    }

    lines.push("", "## クラスタ別 元意見一覧");

    if (clusterRows.length === 0) {
      lines.push("クラスタはありません。");
    } else {
      clusterRows.forEach((cluster) => {
        const members = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];
        lines.push("", `### ${escapeMarkdownTableCell(cluster.label)} 元意見 ${members.length}件`);

        if (members.length === 0) {
          lines.push("元意見はありません。");
          return;
        }

        members.slice(0, 5).forEach((member, index) => {
          const meta = `No.${member.no || index + 1} / id:${member.id || "-"} / duplicateCount:${member.duplicateCount || 1}`;
          lines.push(`${index + 1}. ${escapeMarkdownTableCell(meta)} - ${escapeMarkdownTableCell(member.text)}`);
        });

        if (members.length > 5) {
          lines.push(`...ほか${members.length - 5}件`);
        }
      });
    }

    const summarizedClusters = clusterRows
      .map((cluster) => ({
        cluster,
        summary: clusterSummaries[clusterSummaryKey(cluster)],
      }))
      .filter((item) => item.summary);

    if (summarizedClusters.length > 0) {
      lines.push("", "## クラスタAI整理結果");

      summarizedClusters.forEach(({ cluster, summary }) => {
        lines.push("", `### ${escapeMarkdownTableCell(cluster.label)} ${escapeMarkdownTableCell(summary.title)}`);
        lines.push("要約：", escapeMarkdownTableCell(summary.summary), "");
        lines.push("整文済み意見：", escapeMarkdownTableCell(summary.cleanOpinion), "");

        if (Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0) {
          lines.push("主要論点：");
          summary.keyPoints.forEach((point) => {
            lines.push(`- ${escapeMarkdownTableCell(point)}`);
          });
        }

        if (Array.isArray(summary.cautions) && summary.cautions.length > 0) {
          lines.push("注意点：");
          summary.cautions.forEach((caution) => {
            lines.push(`- ${escapeMarkdownTableCell(caution)}`);
          });
        }

        lines.push(
          "",
          "スコアリング：",
          `- 対象文：${escapeMarkdownTableCell(summary.scoreBasis || cluster.scoreBasis || "representativeText")}`,
          `- independentOpinionVolume：${clusterVolumeFromRow(cluster).independent}`,
          `- spreadVolume：${clusterVolumeFromRow(cluster).spread}`,
          `- volumeForGraph：${clusterVolumeFromRow(cluster).graph}`,
          `- X/Y/Z：${getScoreTripletForDisplay(cluster, scoreDisplayMode)}`,
          `- 元スコア：${cluster.originalScore?.x ?? "-"} / ${cluster.originalScore?.y ?? "-"} / ${cluster.originalScore?.z ?? "-"}`,
          `- 関連度：${cluster.relevanceScore ?? "-"}`,
          `- 信頼度：${cluster.scoreConfidence ?? "-"}`,
          `- 警告：${Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length ? escapeMarkdownTableCell(cluster.scoreWarnings.join(" / ")) : "なし"}`,
          `- スコア根拠：${escapeMarkdownTableCell(scoreBasisLabel(cluster.scoreBasis))}`,
          `- XYZ評価理由：${escapeMarkdownTableCell(["x", "y", "z"].map((axis) => scoreReasonMarkdown(cluster, axis)).join(" / "))}`,
          "",
          "要約元の意見："
        );

        const sourceItems = Array.isArray(summary.sourceItems) ? summary.sourceItems : [];
        if (sourceItems.length === 0) {
          lines.push("要約元の意見は保存されていません。");
        } else {
          sourceItems.slice(0, 10).forEach((item, index) => {
            lines.push(
              `${index + 1}. id:${escapeMarkdownTableCell(item.id || "-")} / duplicateCount:${item.duplicateCount || 1}`,
              `   ${escapeMarkdownTableCell(truncateText(item.text, 500))}`
            );
          });
        }
      });
    }

    lines.push(
      "",
      "## 意見一覧 上位20件",
      `| No | 種別 | ラベル | ${scoreAxisHeader(axisLabels.x, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.y, scoreDisplayMode)} | ${scoreAxisHeader(axisLabels.z, scoreDisplayMode)} | 本文 |`,
      "|---:|---|---|---:|---:|---:|---|"
    );

    if (opinionRows.length === 0) {
      lines.push("| 0 | なし |  |  |  |  | 意見はありません |");
    } else {
      opinionRows.forEach((row, index) => {
        lines.push(
          `| ${index + 1} | ${escapeMarkdownTableCell(row.group)} | ${escapeMarkdownTableCell(row.label)} | ${getScoreForDisplay(row, "x", scoreDisplayMode)} | ${getScoreForDisplay(row, "y", scoreDisplayMode)} | ${getScoreForDisplay(row, "z", scoreDisplayMode)} | ${escapeMarkdownTableCell(row.opinion)} |`
        );
      });
    }

    return gateAnalysisMarkdown(lines.join("\n"), viewMode);
  }

  async function handleCopyAnalysisResult() {
    setOperationRunning("copyAnalysis", "分析結果をコピー中...", `${result.clusterTableRows.length}クラスタ`, currentAnalysisHash);
    await waitForNextPaint();

    try {
      await navigator.clipboard.writeText(buildAnalysisMarkdown());
      setCopyStatus("success");
      setOperationSuccess(
        "copyAnalysis",
        `コピー済み ${formatHistoryDate(new Date().toISOString())} / 分析結果Markdownをコピーしました`,
        `${result.clusterTableRows.length}クラスタ / ${currentOpinionCount}件`,
        currentAnalysisHash
      );
    } catch (error) {
      setCopyStatus("error");
      setOperationError(
        "copyAnalysis",
        `コピーに失敗しました。理由：${error.message || "ブラウザ権限を確認してください。"}`,
        "",
        currentAnalysisHash
      );
    }

    window.setTimeout(() => setCopyStatus(""), 3500);
  }

  void useMemo(() => {
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
        ...scoreOpinion(userOpinion, themeCategory, axisConfig),
      },
      ...opinions.map((opinion, index) => ({
        originalNo: index + 1,
        label: String(index + 1),
        type: `外部意見${index + 1}`,
        opinion,
        group: "external",
        ...scoreOpinion(opinion, themeCategory, axisConfig),
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
  }, [userOpinion, externalOpinions, themeCategory, axisConfig, sortKey, sortDirection]);

  function colorOf(row, volumeDomain = null) {
    if (row.group === "user") return "#ef4444";
    if (row.group === "average") return "#7c3aed";
    if (row.group === "processed-average") return "#a855f7";
    if (row.group === "cluster") return normalizeClusterVolume(row, volumeDomain);
    return "#2563eb";
  }

  function sizeOf(row, volumeDomain = null) {
    if (row.group === "user") return 14;
    if (row.group === "average" || row.group === "processed-average") return 12;
    if (row.group === "cluster") return markerSizeForVolume(row, volumeDomain);
    return 8;
  }

  function markerSymbolOf(row) {
    if (row.group === "user") return "diamond";
    if (row.group === "average" || row.group === "processed-average") return "square";
    return "circle";
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

  function currentXDataStateLabel() {
    if (xDataStatus === "empty") return "未取得";
    if (xDataStatus === "cached") return "保存済みデータを使用中";
    if (xDataStatus === "unsaved") return "未保存の新規取得データ";
    if (xDataStatus === "fetching") return "X API取得中";
    return "サンプルまたは手入力データ";
  }

  function currentInputSourceLabel() {
    if (xPosts.length > 0 || xDataStatus === "fetching" || xDataStatus === "cached") return "X";
    if (xDataStatus === "sample") return "サンプルデータ";
    if (externalOpinions.trim()) return "手入力";
    return "未入力";
  }

  function currentClusterDisplayLabel() {
    if (clusterMethod === "semantic" && semanticClusterRows.length > 0) {
      return "意味クラスタ";
    }

    return "文字類似クラスタ";
  }

  function semanticClusterStateLabel() {
    if (isSemanticClusterLoading) return "実行中";
    if (semanticClusterError) return "エラー";
    if (semanticClusterRows.length > 0) {
      return `成功 ${result.noiseProcessingResult.semanticInputCount || 0}件 → ${semanticClusterRows.length}クラスタ`;
    }

    return "未実行";
  }

  function summaryTargetClusterLabel() {
    return currentClusterDisplayLabel();
  }

  function summarizedClusterCount() {
    return result.clusterTableRows.filter((cluster) => clusterSummaries[clusterSummaryKey(cluster)]).length;
  }

  function opinionRowClass(row) {
    const classes = [];
    if (row.group === "user") classes.push("user-row");
    if (row.noiseReason || row.type === "ノイズ" || row.type === "除外" || row.group === "noise") {
      classes.push("noise-row");
    }
    if (/広告|PR|業者|占い|文字化け|低関連/.test(`${row.type || ""} ${row.noiseReason || ""}`)) {
      classes.push("noise-row");
    }
    return classes.join(" ");
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function zone12TextForRow(row) {
    return safeRuntimeText(
      row?.normalizedText || row?.processedText || row?.opinion || row?.rawNormalizedText || row?.text || "",
      viewMode
    );
  }

  function zone12SearchableText(row) {
    return [
      row?.opinion,
      row?.normalizedText,
      row?.processedText,
      row?.rawNormalizedText,
      row?.text,
      row?.rawText,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function zone12TermHits(row, terms) {
    const searchableText = zone12SearchableText(row).toLowerCase();
    return uniqueValues(terms)
      .filter((term) => !looksLikeMojibake(term))
      .filter((term) => {
        const normalizedTerm = String(term || "").replace(/^#/, "").trim().toLowerCase();
        return normalizedTerm.length >= 2 && searchableText.includes(normalizedTerm);
      });
  }

  function extractZone12Hashtags(row) {
    const structuredHashtags = [
      ...(Array.isArray(row?.hashtags) ? row.hashtags : []),
      ...(Array.isArray(row?.matchedHashtags) ? row.matchedHashtags : []),
      row?.hashtag,
    ];
    const textHashtags = zone12SearchableText(row).match(/#[^\s#。、，,.!?！？)）\]】」』]+/g) || [];

    return uniqueValues([...structuredHashtags, ...textHashtags]
      .map((tag) => String(tag || "").trim())
      .filter((tag) => tag.startsWith("#") && !looksLikeMojibake(tag)));
  }

  function zone12StatusForRow(row) {
    const status = row?.zone12Status || "";
    const categoryText = `${row?.type || ""} ${row?.group || ""} ${row?.noiseCategory || ""} ${row?.noiseReason || ""}`;

    if (status === "user" || row?.group === "user") return { key: "user", label: JP_UI_LABELS.zone12StatusUser };
    if (status === "borderline" || row?.borderlineReason) return { key: "borderline", label: JP_UI_LABELS.zone12StatusBorderline };
    if (status === "duplicate" || /duplicate|重複|RT|コピー|拡散/.test(categoryText)) {
      return { key: "duplicate", label: JP_UI_LABELS.zone12StatusDuplicate };
    }
    if (status === "excluded" || row?.type === JP_UI_LABELS.zone12StatusExcluded) return { key: "excluded", label: JP_UI_LABELS.zone12StatusExcluded };
    if (status === "noise" || row?.noiseReason || row?.group === "noise") return { key: "noise", label: JP_UI_LABELS.zone12StatusNoise };
    return { key: "accepted", label: JP_UI_LABELS.zone12StatusAccepted };
  }

  function zone12ReasonForRow(row) {
    const status = zone12StatusForRow(row);
    const categoryLabel = row?.noiseCategory ? (NOISE_CATEGORY_LABELS[row.noiseCategory] || row.noiseCategory) : "";

    if (status.key === "user") return "自分の意見です。比較の基準として表示しています。";
    if (row?.borderlineReason) return row.borderlineReason;
    if (row?.noiseReason) return `${categoryLabel ? `${categoryLabel}: ` : ""}${row.noiseReason}`;
    if (status.key === "duplicate") return "同一または類似した拡散・重複投稿として扱っています。";
    if (status.key === "excluded") return "分析対象から除外された投稿です。";
    if ((row?.duplicateCount || 1) > 1) return `採用。類似・重複を${row.duplicateCount}件まとめています。`;
    return "採用。検索条件とテーマに照らして分析対象にしています。";
  }

  function zone12DecorateRow(row, status, fallbackType) {
    const text = zone12TextForRow(row);
    const scored = row?.x !== undefined && row?.y !== undefined && row?.z !== undefined
      ? {}
      : scoreOpinion(text, themeCategory, axisConfig);

    return {
      ...row,
      ...scored,
      zone12Status: status,
      type: row?.type || fallbackType,
      opinion: text,
    };
  }

  function zone12RowKey(row) {
    return normalizeOpinionText(row?.processedText || row?.normalizedText || row?.opinion || row?.rawNormalizedText || row?.text || "");
  }

  const zone12HighlightTerms = uniqueValues([
    ...queryReviewParts.includeTerms,
    ...queryReviewParts.includeHashtags,
    ...queryReviewParts.includeHashtags.map((tag) => String(tag || "").replace(/^#/, "")),
  ]).filter((term) => term.length >= 2 && !looksLikeMojibake(term));
  const zone12ExcludeTerms = uniqueValues(queryReviewParts.excludeTerms).filter((term) => term.length >= 2 && !looksLikeMojibake(term));
  const zone12InspectionRows = (() => {
    const stats = result.noiseProcessingResult || {};
    const borderlineRows = Array.isArray(stats.borderlineUsefulRows) ? stats.borderlineUsefulRows : [];
    const borderlineKeys = new Set(borderlineRows.map(zone12RowKey));
    const acceptedRows = (Array.isArray(stats.candidateRows) ? stats.candidateRows : []).map((row) =>
      zone12DecorateRow(row, "accepted", JP_UI_LABELS.zone12StatusAccepted)
    );
    const visibleBorderlineRows = borderlineRows.map((row) => zone12DecorateRow(row, "borderline", JP_UI_LABELS.borderlineOpinions));
    const noiseRows = (Array.isArray(stats.noiseExcludedRows) ? stats.noiseExcludedRows : [])
      .filter((row) => !borderlineKeys.has(zone12RowKey(row)))
      .map((row) => zone12DecorateRow(row, "noise", JP_UI_LABELS.zone12StatusNoise));
    const userRow = result.user ? [zone12DecorateRow(result.user, "user", "自分の意見")] : [];
    const rows = [...userRow, ...acceptedRows, ...visibleBorderlineRows, ...noiseRows];

    if (rows.length > 0) return rows;

    return result.tableRows.map((row) => zone12DecorateRow(row, row.group === "user" ? "user" : "accepted", row.type || "意見"));
  })();
  const zone12FilteredRows = zone12InspectionRows.filter((row) => {
    if (zone12Filter === "all") return true;
    const status = zone12StatusForRow(row).key;
    if (zone12Filter === "noise") return ["noise", "duplicate", "excluded"].includes(status);
    return status === zone12Filter;
  });
  const zone12Counts = zone12InspectionRows.reduce(
    (counts, row) => {
      const status = zone12StatusForRow(row).key;
      counts.all += 1;
      if (status === "accepted") counts.accepted += 1;
      if (status === "borderline") counts.borderline += 1;
      if (["noise", "duplicate", "excluded"].includes(status)) counts.noise += 1;
      return counts;
    },
    { all: 0, accepted: 0, borderline: 0, noise: 0 }
  );
  const zone12TopNoiseReasons = Object.entries(result.noiseProcessingResult.noiseReasonCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`);
  const zone12ZeroAnalysisSummary =
    result.noiseProcessingResult.analysisTargetCount === 0 &&
    (result.noiseProcessingResult.rawCount > 0 || (stagedFetchState.totalApiFetchedCount || 0) > 0)
      ? {
          fetchedCount: stagedFetchState.totalApiFetchedCount || result.noiseProcessingResult.rawCount,
          noiseRemovedCount: result.noiseProcessingResult.noiseExcludedCount || 0,
          reasons: zone12TopNoiseReasons,
        }
      : null;

  function renderHighlightedZone12Text(text) {
    const sourceText = String(text || "");
    const sortedTerms = [...zone12HighlightTerms].sort((a, b) => b.length - a.length);

    if (!sourceText || sortedTerms.length === 0) {
      return sourceText;
    }

    const pattern = new RegExp(`(${sortedTerms.map(escapeRegExp).join("|")})`, "gi");

    return sourceText.split(pattern).map((part, index) => {
      const matched = sortedTerms.some((term) => part.toLowerCase() === term.toLowerCase());
      return matched ? (
        <mark key={`${part}-${index}`} className="query-hit-highlight">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  }

  const userReferenceGraphWarning =
    viewMode === "user" &&
    (result.noiseProcessingResult.analysisTargetCount < 10 ||
      result.noiseProcessingResult.personaAStrictRelevance?.referenceDisplay ||
      result.clusterTableRows.length < 5 ||
      result.noiseProcessingResult.independentOpinionCount < 8);

  const userReferenceGraphMessage =
    result.noiseProcessingResult.personaAStrictRelevance?.enabled
      ? `今回の分析対象は${result.noiseProcessingResult.analysisTargetCount}件です。今回は、恋愛相談として自然に読める意見だけを残したため参考表示です。関係の薄い投稿を混ぜるより、安心して読める声を優先しています。`
      : `今回の分析対象は${result.noiseProcessingResult.analysisTargetCount}件です。` +
        "このグラフは市場全体や世論の傾向ではなく、取得できた少数の意見の配置を示す参考表示です。" +
        "より信頼できる意見空間を作るには、取得条件の改善が必要です。";

  function personaAAnalysisMemoItems() {
    const strict = result.noiseProcessingResult.personaAStrictRelevance || {};
    const normalizedDirections = normalizeVoiceDirections(selectedVoiceDirections);
    const preferredNextDirections = ["personalExperiences", "opposingOpinions", "adviceHints", "differentViewpoints", "values", "empatheticVoices"];
    const missingDirections = preferredNextDirections.filter((direction) => !normalizedDirections.includes(direction));
    const suggestedDirections = (result.noiseProcessingResult.analysisTargetCount < 10 ? missingDirections.slice(0, 2) : []).map(voiceDirectionLabel);
    const suggestedQueryDirections = (result.noiseProcessingResult.analysisTargetCount < 10 ? missingDirections.slice(0, 2) : []).map(voiceDirectionLabel);
    const topCategories = Object.entries(strict.exclusionCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => `${NOISE_CATEGORY_LABELS[category] || category}:${count}`)
      .join(" / ");

    return [
      [JP_UI_LABELS.analysisPurpose, currentAnalysisPurposeConfig.label],
      [JP_UI_LABELS.retrievalPolicy, currentAnalysisPurposeConfig.retrievalPolicy],
      [JP_UI_LABELS.clusterPolicy, currentAnalysisPurposeConfig.clusterPolicy],
      [JP_UI_LABELS.zone11Policy, currentAnalysisPurposeConfig.zone11Policy],
      [JP_UI_LABELS.usedOpinions, `${result.noiseProcessingResult.analysisTargetCount}件`],
      [JP_UI_LABELS.excludedPosts, `${result.noiseProcessingResult.noiseExcludedCount}件`],
      [JP_UI_LABELS.borderlineOpinions, `${strict.borderlineCount || 0}件`],
      [JP_UI_LABELS.referenceDisplay, strict.referenceDisplay || userReferenceGraphWarning ? "ON" : "OFF"],
      [JP_UI_LABELS.retrievalQuality, `${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / ${result.noiseProcessingResult.retrievalKpi.message}`],
      [JP_UI_LABELS.voicesToCollect, normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")],
      ["Persona A strict relevance", strict.enabled ? "ON" : "OFF"],
      ["Top exclusion categories", topCategories || "なし"],
      [JP_UI_LABELS.queryAdjustment, normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")],
      [JP_UI_LABELS.missingVoiceDirections, suggestedDirections.join(" / ") || "なし"],
      [JP_UI_LABELS.suggestedNextQueryDirection, suggestedQueryDirections.join(" / ") || "なし"],
      [JP_UI_LABELS.clusterQuality, result.noiseProcessingResult.retrievalKpi.clusterJudgement.message],
    ];
  }

  function workflowClass(status) {
    if (status === "done") return "workflow-step done";
    if (status === "current") return "workflow-step current";
    return "workflow-step pending";
  }

  function currentSaveTargetPreview() {
    const stats = result.noiseProcessingResult;
    const inputCount = stats.candidateCount || 0;
    const clusterCount = result.clusterTableRows.length;
    const compressionRate = inputCount > 0 ? (1 - clusterCount / inputCount) : 0;

    if (clusterMethod === "semantic" && semanticClusterRows.length === 0) {
      return {
        text: "意味類似 OpenAI は未実行です。先に「意味クラスタを実行」を押してください。",
        warning: true,
      };
    }

    const methodLabel = clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似";
    const threshold = clusterMethod === "semantic" ? semanticThreshold : clusterThreshold;

    return {
      text: `${methodLabel} / しきい値 ${threshold.toFixed(2)} / ${inputCount}件 → ${clusterCount}クラスタ / 圧縮率 ${formatPercent(compressionRate)}`,
      warning: false,
    };
  }

  function getNextAction() {
    const hasThemeAndOpinion = Boolean(theme.trim() && userOpinion.trim());
    const hasDraftOrQueryCandidates = Boolean(
      (generatedXQueryCandidates && generatedXQueryCandidates.length > 0) ||
        selectedXQueryCandidates.length > 0 ||
        effectiveQuery.trim()
    );
    const hasClusters = result.clusterTableRows.length > 0;
    const hasSemanticClusters = semanticClusterRows.length > 0;
    const hasSummaries = summarizedClusterCount() > 0;

    if (!hasThemeAndOpinion) {
      return {
        label: "テーマと自分の意見を入力",
        targetZone: "Zone①",
        actionType: "input",
        buttonText: "テーマと自分の意見を入力",
        help: "テーマと自分の意見を入力すると、分析を開始できます。",
        disabled: true,
      };
    }

    if (!hasDraftOrQueryCandidates) {
      return {
        label: "AIで評価軸を設定",
        targetZone: "Zone②",
        actionType: "aiDraft",
        buttonText: "AIで評価軸を設定",
        help: "テーマと自分の意見から、評価軸・検索クエリ候補を作ります。",
      };
    }

    if (!hasFetchedExternalData) {
      return {
        label: "Xから取得",
        targetZone: "Zone③",
        actionType: "fetchX",
        buttonText: "Xから取得して外部意見欄に反映",
        help: "検索条件を確認して、外部意見を取得します。",
        disabled: isEffectiveQueryTooLong,
      };
    }

    if (canRescoreWithCurrentAxis) {
      return {
        label: "現在の評価軸で再スコアリング",
        targetZone: "Zone②",
        actionType: "rescore",
        buttonText: "現在の評価軸で再スコアリング",
        help: "取得済みの外部意見を、現在の評価軸で評価し直します。",
      };
    }

    if (clusterMethod === "semantic" && !hasSemanticClusters) {
      return {
        label: "意味クラスタを実行",
        targetZone: "Zone④",
        actionType: "semanticCluster",
        buttonText: "意味クラスタを実行",
        help: "OpenAI embeddingsで意味が近い意見をまとめます。",
      };
    }

    if (!hasClusters) {
      return {
        label: "クラスタリングを確認",
        targetZone: "Zone④",
        actionType: "cluster",
        buttonText: "クラスタリングを確認",
        help: "処理後クラスタが表示されていません。外部意見と評価軸を確認してください。",
      };
    }

    if (!hasSummaries) {
      return {
        label: "上位クラスタを一括AI要約",
        targetZone: "Zone⑤",
        actionType: "summary",
        buttonText: `上位${autoSummaryLimit}クラスタを一括AI要約`,
        help: "クラスタ内の元意見をAIで読み取り、説明しやすい日本語に整理します。",
      };
    }

    return {
      label: "Zone⑪ ユーザーへのフィードバックを見る",
      targetZone: "Zone⑪",
      actionType: "viewFeedback",
      buttonText: "Zone⑪を見る",
      help: "自分の意見の位置づけ、近いクラスタ、足りない視点を確認します。",
    };
  }

  function handleNextAction() {
    const nextAction = getNextAction();

    if (nextAction.disabled) {
      return;
    }

    if (nextAction.actionType === "aiDraft") {
      handleGenerateAnalysisDraft();
      return;
    }

    if (nextAction.actionType === "fetchX") {
      handleFetchXButtonClick();
      return;
    }

    if (nextAction.actionType === "rescore") {
      rescoreWithCurrentAxis();
      return;
    }

    if (nextAction.actionType === "semanticCluster") {
      handleRunSemanticCluster();
      return;
    }

    if (nextAction.actionType === "summary") {
      handleRunAutoSummaries();
      return;
    }

    if (nextAction.actionType === "viewFeedback") {
      document.querySelector(".zone-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function summaryForCluster(cluster) {
    return clusterSummaries[clusterSummaryKey(cluster)] || null;
  }

  function clusterDisplayTitle(cluster) {
    const summary = summaryForCluster(cluster);

    if (summary?.title) {
      return summary.title;
    }

    return "未要約クラスタ";
  }

  function clusterDisplayBody(cluster) {
    const summary = summaryForCluster(cluster);

    if (summary?.cleanOpinion) {
      return summary.cleanOpinion;
    }

    if (summary?.summary) {
      return summary.summary;
    }

    return cluster.opinion || "";
  }

  function scoreBasisLabel(value) {
    if (value === "cleanOpinion") return "AI整文済み意見";
    if (value === "summary") return "AI要約";
    return "代表本文";
  }

  function scoreReasonForDisplay(row, axis) {
    return ensureScoreReasons(row, row?.scoredText || row?.opinion || "", axisConfig)?.[axis];
  }

  function renderScoreReasonGrid(row) {
    return (
      <div className="score-reason-grid">
        {["x", "y", "z"].map((axis) => {
          const reason = scoreReasonForDisplay(row, axis);
          const axisItem = axisExplanationItems(axisConfig).find((item) => item.axis === axis);

          return (
            <div key={`${row.label}-${axis}`} className="score-reason-item">
              <strong>
                {axis.toUpperCase()} {axisItem.label}：{reason?.score ?? getScoreForDisplay(row, axis, "absolute")}
              </strong>
              <span>{reason?.reason || "理由は未生成です。"}</span>
              <small>
                根拠語：
                {Array.isArray(reason?.evidenceKeywords) && reason.evidenceKeywords.length > 0
                  ? reason.evidenceKeywords.join(" / ")
                  : "少ない"}
                {" / "}信頼度：{reason?.confidence ?? row.scoreConfidence ?? "-"}
              </small>
            </div>
          );
        })}
      </div>
    );
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

  useEffect(() => {
    const rows = result.graphRows;
    const activeGraphScoreMode = scoreDisplayMode;
    const volumeDomain = clusterVolumeDomain(rows);

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

    function makeTrace(groupName, group) {
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

    const plotElement = plot3dRef.current;
    Plotly.newPlot(
      plot3dRef.current,
      [
        ...axisTraces,
        makeTrace("処理後クラスタ", "cluster"),
        makeTrace("処理後平均", "processed-average"),
        makeTrace("自分の意見", "user"),
        makeTrace("外部意見", "external"),
        makeTrace("外部意見平均", "average"),
      ],
      {
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
      { responsive: true }
    ).then(() => {
      plotElement?.removeAllListeners?.("plotly_click");
      plotElement?.on?.("plotly_click", (event) => {
        const point = event?.points?.[0];
        const group = point?.customdata?.[6];
        const label = point?.customdata?.[5];
        if (group === "cluster") {
          selectClusterFromGraph(label);
        }
      });
    });

    return () => {
      plotElement?.removeAllListeners?.("plotly_click");
    };
  }, [result, theme, originCentered, axisLabels, clusterSummaries, clusterMethod, scoreDisplayMode]);

  useEffect(() => {
    const rows = result.graphRows;
    const activeGraphScoreMode = scoreDisplayMode;
    const volumeDomain = clusterVolumeDomain(rows);
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

    const plotElement = plot2dRef.current;
    Plotly.newPlot(
      plot2dRef.current,
      planes.flatMap((plane) => [
        make2dTrace(clusterRows, plane, true),
        make2dTrace(otherRows, plane, false),
      ]),
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
      { responsive: true }
    ).then(() => {
      plotElement?.removeAllListeners?.("plotly_click");
      plotElement?.on?.("plotly_click", (event) => {
        const point = event?.points?.[0];
        const group = point?.customdata?.[6];
        const label = point?.customdata?.[5];
        if (group === "cluster") {
          selectClusterFromGraph(label);
        }
      });
    });

    return () => {
      plotElement?.removeAllListeners?.("plotly_click");
    };
  }, [result, axisLabels, clusterSummaries, clusterMethod, scoreDisplayMode]);

  const saveTarget = currentSaveTargetPreview();
  const stagedCurrentDataCount =
    stagedFetchState.currentDataCount || stagedFetchState.accumulatedCount || currentOpinionCount || 0;
  const stagedRemainingCount = Math.max(
    0,
    Number(xMaxResults || 0) - stagedCurrentDataCount
  );
  const stagedNextFetchCount = Math.min(
    stagedRemainingCount,
    calculateNextAddFetchCount(
      stagedCurrentDataCount,
      Number(xMaxResults || 0),
      stagedFetchState.stageSize || DEFAULT_ADD_FETCH_COUNT
    )
  );
  const canContinueStagedFetch =
    stagedRemainingCount > 0 && operationStatus.fetchX.status !== "running";
  const canAddImprovedQuery =
    stagedRemainingCount > 0 && operationStatus.fetchX.status !== "running" && Boolean(selectedImprovedQueryBase());
  const shouldShowStagedActions =
    viewMode === "developer" &&
    Boolean(stagedFetchState.diagnosis) &&
    (stagedFetchState.shouldPause || stagedRemainingCount > 0);
  const selectedImprovedBaseQuery = selectedImprovedQueryBase();
  const selectedImprovedExecutionQuery = selectedImprovedBaseQuery
    ? buildXQueryWithHashtags(selectedImprovedBaseQuery, xQueryFilters, selectedHashtagValues, selectedExcludeTermValues)
    : "";
  const selectedImprovedQueryIsSame =
    Boolean(selectedImprovedExecutionQuery) && queriesAreEquivalent(effectiveQuery, selectedImprovedExecutionQuery);
  const canRunSemanticCluster = result.noiseProcessingResult.candidateCount >= 5;

  function renderAiDraftPanel() {
    return (
      <div className="ai-draft-panel">
        <div className="ai-draft-header">
          <h3>まずここから</h3>
          <span>AI仮生成</span>
        </div>
        <p>
          テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。生成結果は編集してから適用できます。
        </p>
        <div className={`ai-draft-health ${aiDraftApiHealth.status} ${viewMode === "developer" ? "developer-panel" : ""}`}>
          <div>
            <strong>AI仮生成：</strong>{PUBLIC_PREVIEW_MODE ? "利用状況を確認中" : aiDraftApiHealth.label}
          </div>
          {viewMode === "developer" ? (
            <>
              <span>{aiDraftApiHealth.details}</span>
              <button type="button" className="x-small-button" onClick={checkAnalysisDraftHealth}>
                再確認
              </button>
            </>
          ) : (
            <span>AIが使えない場合も、簡易ルールで仮設定を表示します。</span>
          )}
        </div>
        {(!theme.trim() || !userOpinion.trim()) && (
          <div className="ai-draft-warning">
            テーマと自分の意見を入力すると、AIで評価軸候補を作成できます。
          </div>
        )}
        <button
          type="button"
          className={`action-button action-button-primary ${
            isAiDraftLoading || operationStatus.aiAxisDraft.status === "running"
              ? "is-running"
              : operationStatus.aiAxisDraft.status === "success"
                ? "is-done"
                : ""
          }`}
          disabled={isAiDraftLoading || operationStatus.aiAxisDraft.status === "running" || !theme.trim() || !userOpinion.trim()}
          onClick={handleGenerateAnalysisDraft}
        >
          {isAiDraftLoading || operationStatus.aiAxisDraft.status === "running"
            ? "AI生成中..."
            : operationStatus.aiAxisDraft.status === "success"
              ? "AI設定生成済み"
              : "AIで分析設定を仮生成"}
        </button>
        {isAiDraftLoading && <div className="ai-draft-status loading">実行中...</div>}
        {aiDraftStatus && (
          <div className={aiDraftMode === "fallback" ? "ai-draft-status fallback" : "ai-draft-status success"}>
            {aiDraftStatus}
          </div>
        )}
        {aiDraftError && (
          <div className="ai-draft-error-panel">
            <strong>{PUBLIC_PREVIEW_MODE ? "AI仮生成に失敗しました。簡易ルールで続行できます。" : aiDraftError}</strong>
            <div className="ai-draft-error-grid">
              {PUBLIC_PREVIEW_MODE ? (
                <div>
                  <span>対処</span>
                  <ol>
                    <li>少し時間をおいて再実行してください</li>
                    <li>そのまま簡易ルールの仮設定で試せます</li>
                  </ol>
                </div>
              ) : (
                <>
                  <div>
                    <span>原因候補</span>
                    <ul>
                      <li>server.js が起動していない</li>
                      <li>OPENAI_API_KEY が .env に設定されていない</li>
                      <li>OpenAI APIの利用上限、課金設定、またはAPI側で問題が起きている</li>
                      <li>AI応答をJSONとして読み取れなかった</li>
                    </ul>
                  </div>
                  <div>
                    <span>対処</span>
                    <ol>
                      <li>server.js を起動してください</li>
                      <li>.env の OPENAI_API_KEY を確認してください</li>
                      <li>ブラウザを再読み込みしてください</li>
                      <li>もう一度 AI生成を実行してください</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
            {viewMode === "developer" && aiDraftErrorDetails && (
              <details className="developer-panel ai-draft-error-details">
                <summary>技術詳細</summary>
                <div>status: {String(aiDraftErrorDetails.status || "-")}</div>
                <div>code: {aiDraftErrorDetails.code || "-"}</div>
                <pre>{String(aiDraftErrorDetails.details || "-")}</pre>
              </details>
            )}
          </div>
        )}
        {aiDraft && (
          <div className="ai-draft-result">
            {aiDraft.fallback && (
              <div className="ai-draft-status fallback">
                AI生成に失敗したため、簡易ルールで仮設定を作成しました。この設定は後から自由に編集できます。
              </div>
            )}
            <h4>仮生成された評価軸</h4>
            <div className="ai-draft-axis-grid">
              {["x", "y", "z"].map((axis) => (
                <div key={`ai-draft-${axis}`} className="ai-draft-axis-card">
                  <strong>{axis.toUpperCase()}：{aiDraft.axisConfig?.[axis]?.label}</strong>
                  <span>高い：{aiDraft.axisConfig?.[axis]?.highDescription || aiDraft.axisConfig?.[axis]?.description}</span>
                  <span>低い：{aiDraft.axisConfig?.[axis]?.lowDescription || "-"}</span>
                </div>
              ))}
            </div>
            <h4>仮生成された検索クエリ候補</h4>
            <div className="ai-draft-query-list">
              {(aiDraft.queryCandidates || []).map((candidate) => (
                <div key={candidate.id || candidate.label} className="query-candidate-card">
                  <div className="query-candidate-label">{candidate.label}</div>
                  <div className="query-candidate-description">{candidate.description}</div>
                  <div className="query-candidate-query">
                    <span className="query-candidate-query-label">検索式：</span>
                    {candidate.query}
                  </div>
                </div>
              ))}
            </div>
            {aiDraftInitialQuestions.length > 0 && (
              <>
                <h4>最初に考える問い</h4>
                <ul className="ai-draft-question-list">
                  {aiDraftInitialQuestions.map((question, index) => (
                    <li key={`ai-draft-question-${index}`}>{question}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="ai-draft-actions">
              <button
                type="button"
                className={`action-button action-button-save ${isAiDraftApplied ? "is-done" : ""}`}
                onClick={applyAiDraft}
              >
                {isAiDraftApplied ? "適用済み" : "このAI候補を適用"}
              </button>
              <button type="button" className="action-button action-button-secondary" onClick={handleGenerateAnalysisDraft}>
                AI候補を再生成
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function operationTimeLabel(operation) {
    const time = operation?.lastSuccessAt || operation?.lastErrorAt || operation?.lastRunAt;
    return time ? formatHistoryDate(time) : "";
  }

  function operationStatusClass(operation) {
    return `dashboard-status ${operation?.status || "idle"}`;
  }

  function zone0StatusTone(item) {
    const status = item?.operation?.status || "idle";
    const value = item?.value || "";
    const detail = item?.detail || "";

    if (status === "running" || value.includes("中")) return "running";
    if (status === "error" || value.includes("失敗") || value.includes("不調")) return "error";
    if (
      value.includes("要再実行") ||
      value.includes("変更あり") ||
      value.includes("古い可能性") ||
      value.includes("未保存") ||
      value.includes("一部完了") ||
      detail.includes("古い可能性")
    ) {
      return "warning";
    }
    if (
      status === "success" ||
      value.includes("保存済み") ||
      value.includes("コピー済み") ||
      value.includes("反映済み") ||
      value.includes("実行済み") ||
      value.includes("完了") ||
      value.includes("表示中")
    ) {
      return "success";
    }

    return "idle";
  }

  function zone0StatusChipClass(item) {
    return `zone0-status-chip ${zone0StatusTone(item)}`;
  }

  function compactDashboardLabel(label = "") {
    return label.replace(/（[^）]+）/g, "");
  }

  function statusItemTitle(item) {
    return [
      `${item.label}: ${item.value}`,
      item.detail,
      operationTimeLabel(item.operation),
    ].filter(Boolean).join("\n");
  }

  function zone0VersionLabel() {
    return APP_VERSION.replace(/^3DE MVP\s*/, "");
  }

  function zone0AxisSummary() {
    return axisExplanationItems(axisConfig)
      .map((item) => `${item.axis.toUpperCase()} ${item.label}`)
      .join(" / ");
  }

  function graphModeLabel(mode) {
    if (mode === "processed") return "処理後";
    if (mode === "compare") return "前後比較";
    return "処理前";
  }

  function actionButtonConfig(type) {
    const configs = {
      saveDataset: {
        operationKey: "saveDataset",
        zoneLabel: "Zone③",
        idle: "Xデータ保存",
        running: "保存中...",
        success: "Xデータ保存済み",
        error: "Xデータ保存失敗",
        targetHash: currentDatasetHash,
        onClick: saveCurrentXDatasetToHistory,
      },
      saveCluster: {
        operationKey: "saveCluster",
        zoneLabel: "Zone④",
        idle: "クラスタ保存",
        running: "保存中...",
        success: "クラスタ保存済み",
        error: "クラスタ保存失敗",
        targetHash: currentClusterHash,
        onClick: saveCurrentClusterRunToHistory,
      },
      copyAnalysis: {
        operationKey: "copyAnalysis",
        zoneLabel: "結果",
        idle: "分析結果コピー",
        running: "コピー中...",
        success: "分析結果コピー済み",
        error: "コピー失敗",
        targetHash: currentAnalysisHash,
        onClick: handleCopyAnalysisResult,
      },
    };

    return configs[type];
  }

  function actionButtonStatus(type) {
    const config = actionButtonConfig(type);
    const operation = operationStatus[config?.operationKey] || EMPTY_OPERATION_STATUS;

    if (type === "saveDataset" && operation.status === "success" && !activeDatasetMatchesCurrent) {
      return "idle";
    }
    if (type === "saveCluster" && operation.status === "success" && !activeClusterRunId) {
      return "idle";
    }
    if (operation.status === "success" && operation.targetHash && operation.targetHash !== config.targetHash) {
      return "idle";
    }

    return operation.status || "idle";
  }

  function getActionButtonLabel(type, status = "idle") {
    const config = actionButtonConfig(type);
    const label = config?.[status] || config?.idle || "";
    return config?.zoneLabel ? `${label}（${config.zoneLabel}）` : label;
  }

  function actionButtonClass(type) {
    return `action-status-button ${actionButtonStatus(type)}`;
  }

  function renderActionStatusButton(type, extraClass = "") {
    const config = actionButtonConfig(type);
    const status = actionButtonStatus(type);

    return (
      <button
        type="button"
        className={`${actionButtonClass(type)} ${extraClass}`.trim()}
        onClick={config.onClick}
        disabled={status === "running"}
      >
        {getActionButtonLabel(type, status)}
      </button>
    );
  }

  function formatPublishErrorDetails(payload, fallbackMessage) {
    const details = payload?.errorDetails;
    if (details && typeof details === "object") {
      return [
        `command: ${details.command || "-"}`,
        `cwd: ${details.cwd || "-"}`,
        `exitCode: ${details.exitCode ?? "-"}`,
        "stdout:",
        details.stdout || "(empty)",
        "stderr:",
        details.stderr || "(empty)",
        `message: ${details.message || payload?.message || fallbackMessage || "-"}`,
      ].join("\n");
    }

    return [
      payload?.error,
      payload?.message,
      fallbackMessage,
    ].filter(Boolean).join("\n") || "詳細はありません。";
  }

  async function handlePublishLocalUpdates() {
    if (!LOCAL_PUBLISH_AVAILABLE || publishStatus.status === "running") {
      return;
    }

    const confirmed = window.confirm("現在のローカル修正をGitHub mainへpushし、Vercel公開URLへ反映します。よろしいですか？");
    if (!confirmed) {
      return;
    }

    setPublishStatus({
      status: "running",
      mode: "publish",
      stage: "ビルド中",
      message: "公開反映を開始しました。",
      error: "",
      steps: [],
      changedFiles: [],
      buildOk: null,
      envIncluded: false,
      commitExecuted: false,
      pushExecuted: false,
      vercelUrl: "https://3de-app.vercel.app",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/publish`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setPublishStatus({
          status: "error",
          mode: "publish",
          stage: payload.stage || "失敗",
          message: payload.message || "公開反映に失敗しました。",
          error: formatPublishErrorDetails(payload, `HTTP ${response.status}`),
          steps: payload.steps || [],
          changedFiles: payload.changedFiles || [],
          buildOk: payload.buildOk ?? null,
          envIncluded: Boolean(payload.envIncluded),
          commitExecuted: Boolean(payload.commitExecuted),
          pushExecuted: Boolean(payload.pushExecuted),
          vercelUrl: payload.vercelUrl || "https://3de-app.vercel.app",
        });
        return;
      }

      setPublishStatus({
        status: "success",
        mode: "publish",
        stage: payload.stage || "完了",
        message: "公開へ反映が完了しました。GitHubへpushしました。Vercelで自動デプロイが開始されます。",
        error: "",
        steps: payload.steps || [],
        changedFiles: payload.changedFiles || [],
        buildOk: payload.buildOk ?? true,
        envIncluded: Boolean(payload.envIncluded),
        commitExecuted: true,
        pushExecuted: true,
        vercelUrl: payload.vercelUrl || "https://3de-app.vercel.app",
      });
    } catch (error) {
      setPublishStatus({
        status: "error",
        mode: "publish",
        stage: "失敗",
        message: "公開反映APIへの接続に失敗しました。",
        error: error.message || String(error),
        steps: [],
        changedFiles: [],
        buildOk: null,
        envIncluded: false,
        commitExecuted: false,
        pushExecuted: false,
        vercelUrl: "https://3de-app.vercel.app",
      });
    }
  }

  async function handlePublishDryRun() {
    if (!LOCAL_PUBLISH_AVAILABLE || publishStatus.status === "running") {
      return;
    }

    setPublishStatus({
      status: "running",
      mode: "dry-run",
      stage: "ビルド中",
      message: "公開テストを開始しました。",
      error: "",
      steps: [],
      changedFiles: [],
      buildOk: null,
      envIncluded: false,
      commitExecuted: false,
      pushExecuted: false,
      vercelUrl: "https://3de-app.vercel.app",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/publish-dry-run`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setPublishStatus({
          status: "error",
          mode: "dry-run",
          stage: payload.stage || "失敗",
          message: payload.message || "公開テストに失敗しました。",
          error: formatPublishErrorDetails(payload, `HTTP ${response.status}`),
          steps: payload.steps || [],
          changedFiles: payload.changedFiles || [],
          buildOk: payload.buildOk ?? false,
          envIncluded: Boolean(payload.envIncluded),
          commitExecuted: Boolean(payload.commitExecuted),
          pushExecuted: Boolean(payload.pushExecuted),
          vercelUrl: "https://3de-app.vercel.app",
        });
        return;
      }

      setPublishStatus({
        status: "success",
        mode: "dry-run",
        stage: "完了",
        message: "公開テストが完了しました。commit / push は実行していません。",
        error: "",
        steps: payload.steps || [],
        changedFiles: payload.changedFiles || [],
        buildOk: Boolean(payload.buildOk),
        envIncluded: Boolean(payload.envIncluded),
        commitExecuted: Boolean(payload.commitExecuted),
        pushExecuted: Boolean(payload.pushExecuted),
        vercelUrl: "https://3de-app.vercel.app",
      });
    } catch (error) {
      setPublishStatus({
        status: "error",
        mode: "dry-run",
        stage: "失敗",
        message: "公開テストAPIへの接続に失敗しました。",
        error: error.message || String(error),
        steps: [],
        changedFiles: [],
        buildOk: null,
        envIncluded: false,
        commitExecuted: false,
        pushExecuted: false,
        vercelUrl: "https://3de-app.vercel.app",
      });
    }
  }

  async function copyPublishError() {
    if (!publishStatus.error) return;

    try {
      await navigator.clipboard.writeText(publishStatus.error);
      setToast({ type: "success", message: "公開反映エラーをコピーしました。" });
    } catch (_error) {
      setToast({ type: "error", message: "公開反映エラーをコピーできませんでした。" });
    }
  }

  function renderLocalPublishPanel() {
    if (!LOCAL_PUBLISH_AVAILABLE) {
      return null;
    }

    const isRunning = publishStatus.status === "running";
    const dryRunIsCurrent = publishStatus.mode === "dry-run" && publishStatus.status !== "idle";
    const publishIsCurrent = publishStatus.mode === "publish" && publishStatus.status !== "idle";
    const stageKeyFromName = (stage) => {
      if (stage === "ビルド中") return "build";
      if (stage === "確認中" || stage === "変更確認中") return "check";
      if (stage === "コミット中") return "commit";
      if (stage === "GitHubへpush中") return "push";
      if (stage === "完了") return "complete";
      if (stage === "失敗") return "error";
      return "";
    };
    const publishStageItems = () => {
      const mode = publishStatus.mode;
      const runningKey = publishStatus.status === "running" ? stageKeyFromName(publishStatus.stage) : "";
      const failedKey = publishStatus.status === "error" ? stageKeyFromName(publishStatus.stage) || "error" : "";
      const completedStepKeys = new Set(
        (publishStatus.steps || [])
          .filter((step) => step?.ok)
          .map((step) => stageKeyFromName(step.stage))
          .filter(Boolean)
      );
      const done = (key) => {
        if (publishStatus.status === "success") {
          if (mode === "dry-run") {
            return key === "build" || key === "check" || key === "complete";
          }

          return key === "build" || key === "check" || key === "commit" || key === "push" || key === "complete";
        }

        return completedStepKeys.has(key);
      };
      const statusFor = (key) => {
        if (failedKey === key || (failedKey === "error" && key === "complete")) return "error";
        if (runningKey === key) return "running";
        if (done(key)) return "done";
        return "pending";
      };
      const labelFor = (key, runningLabel, doneLabel, pendingLabel = runningLabel) => {
        const status = statusFor(key);
        if (status === "running") return runningLabel;
        if (status === "done") return doneLabel;
        return pendingLabel;
      };

      const baseStages = [
        { key: "build", label: labelFor("build", "ビルド中", "ビルド完了", "ビルド未実行"), status: statusFor("build") },
        { key: "check", label: labelFor("check", "確認中", "確認完了", "確認未実行"), status: statusFor("check") },
      ];

      if (mode === "dry-run") {
        return [
          ...baseStages,
          { key: "complete", label: statusFor("complete") === "done" ? "公開テスト完了" : statusFor("complete") === "error" ? "失敗" : "完了待ち", status: statusFor("complete") },
        ];
      }

      return [
        ...baseStages,
        { key: "commit", label: labelFor("commit", "コミット中", "コミット完了", "コミット未実行"), status: statusFor("commit") },
        { key: "push", label: labelFor("push", "GitHub push中", "GitHub push完了", "GitHub push未実行"), status: statusFor("push") },
        { key: "complete", label: statusFor("complete") === "done" ? "公開反映完了" : statusFor("complete") === "error" ? "失敗" : "完了待ち", status: statusFor("complete") },
      ];
    };
    const publishStepSucceeded = (stepKey) => (publishStatus.steps || [])
      .some((step) => step?.ok && stageKeyFromName(step.stage) === stepKey);
    const publishResultLabel = (done) => {
      if (publishStatus.status === "running") return "確認中";
      if (publishStatus.status === "error" && !done) return "失敗";
      return done ? "成功" : "未確認";
    };

    return (
      <div className={`local-publish-panel ${publishStatus.status}`}>
        <div className="local-publish-header">
          <strong>ローカル公開反映</strong>
          <span>{publishStatus.stage || publishStatus.message}</span>
        </div>
        <div className="local-publish-buttons">
          <button
            type="button"
            className={`local-publish-test-button ${dryRunIsCurrent ? "active" : ""}`}
            onClick={handlePublishDryRun}
            disabled={isRunning}
            aria-pressed={dryRunIsCurrent}
          >
            {isRunning && publishStatus.mode === "dry-run" ? "公開テスト中" : "公開テスト"}
          </button>
          <button
            type="button"
            className={`local-publish-button ${publishIsCurrent ? "active" : ""}`}
            onClick={handlePublishLocalUpdates}
            disabled={isRunning}
            aria-pressed={publishIsCurrent}
          >
            {isRunning && publishStatus.mode === "publish" ? "公開反映中" : "公開へ反映"}
          </button>
        </div>
        <div className="local-publish-stages" aria-label="公開反映ステータス">
          {publishStageItems().map((stage) => (
            <span
              key={stage.key}
              className={stage.status}
            >
              {stage.label}
            </span>
          ))}
        </div>
        <p className="local-publish-message">{publishStatus.message}</p>
        {publishStatus.mode === "dry-run" && publishStatus.status !== "idle" && (
          <div className="local-publish-dry-run-result">
            <div><strong>build</strong><span>{publishStatus.buildOk ? "成功" : publishStatus.buildOk === false ? "失敗" : "未確認"}</span></div>
            <div><strong>.env</strong><span>{publishStatus.envIncluded ? ".env 系ファイルは除外済み" : ".env 系ファイルなし"}</span></div>
            <div className="local-publish-changed-files">
              <strong>変更ファイル</strong>
              <span>{publishStatus.changedFiles.length > 0 ? publishStatus.changedFiles.join("\n") : "なし"}</span>
            </div>
          </div>
        )}
        {publishStatus.mode === "publish" && publishStatus.status !== "idle" && (
          <div className="local-publish-dry-run-result">
            <div><strong>build</strong><span>{publishResultLabel(publishStatus.buildOk === true || publishStepSucceeded("build"))}</span></div>
            <div><strong>commit</strong><span>{publishResultLabel(publishStatus.commitExecuted || publishStepSucceeded("commit"))}</span></div>
            <div><strong>push</strong><span>{publishResultLabel(publishStatus.pushExecuted || publishStepSucceeded("push"))}</span></div>
            <div className="local-publish-changed-files">
              <strong>変更ファイル</strong>
              <span>{publishStatus.changedFiles.length > 0 ? publishStatus.changedFiles.join("\n") : "なし"}</span>
            </div>
          </div>
        )}
        {publishStatus.status === "success" && publishStatus.mode === "publish" && (
          <a href={publishStatus.vercelUrl} target="_blank" rel="noreferrer">
            公開URLを開く
          </a>
        )}
        {publishStatus.error && (
          <div className="local-publish-error">
            <pre>{publishStatus.error}</pre>
            <button type="button" className="x-small-button" onClick={copyPublishError}>
              エラー内容をコピー
            </button>
          </div>
        )}
      </div>
    );
  }

  function dashboardStatusItems() {
    const saveDatasetStatus = actionButtonStatus("saveDataset");
    const saveClusterStatus = actionButtonStatus("saveCluster");
    const copyStatusValue = actionButtonStatus("copyAnalysis");
    const xDataValue =
      saveDatasetStatus === "running"
        ? "保存中..."
        : saveDatasetStatus === "success"
          ? "保存済み"
          : saveDatasetStatus === "error"
            ? "保存失敗"
            : xDataStatus === "fetching"
              ? "取得中"
              : operationStatus.fetchX.status === "error"
                ? "取得失敗"
                : currentXDataStateLabel();
    const scoringLabel = operationStatus.rescore.status === "running"
      ? "実行中"
      : axisDirty
        ? "要再実行"
        : hasFetchedExternalData
          ? "実行済み"
          : "未実行";
    const clusterSaved = Boolean(activeClusterRunId);
    const clusterLabel =
      saveClusterStatus === "running"
        ? "保存中..."
        : saveClusterStatus === "success"
          ? "保存済み"
          : saveClusterStatus === "error"
            ? "保存失敗"
            : operationStatus.semanticCluster.status === "running"
              ? "実行中"
              : operationStatus.semanticCluster.status === "error"
                ? "実行失敗"
                : result.clusterTableRows.length > 0
                  ? clusterSaved
                    ? "保存済み"
                    : "実行済み・未保存"
                  : "未実行";
    const summaryLabel = isAutoSummarizing
      ? `実行中 ${autoSummaryProgress.completed} / ${autoSummaryProgress.total}`
      : operationStatus.autoSummary.status === "error"
        ? "実行失敗"
        : autoSummaryProgress.failed > 0
          ? "一部完了"
          : summarizedClusterCount() > 0
            ? "完了"
            : "未実行";

    return [
      {
        label: "利用目的（Zone P）",
        value: currentPersonaConfig.dashboardLabel,
        detail: currentPersonaConfig.description,
        operation: { status: personaMode === "dev" ? "idle" : "success" },
      },
      {
        label: "Xデータ（Zone③）",
        value: xDataValue,
        detail: saveDatasetStatus === "running" || saveDatasetStatus === "success" || saveDatasetStatus === "error"
          ? operationStatus.saveDataset.message
          : operationStatus.fetchX.message || `取得診断 ${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / ${currentOpinionCount}件`,
        operation: saveDatasetStatus === "idle" ? operationStatus.fetchX : operationStatus.saveDataset,
      },
      {
        label: "取得診断（Zone③）",
        value: queryDiagnosisLabel(stagedFetchState.diagnosisStatus),
        detail: `品質 ${qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)} / 現在 ${stagedCurrentDataCount} / ${Number(xMaxResults) || 0}件 / 残り ${stagedRemainingCount}件 / 次回 ${stagedNextFetchCount}件 / 分析対象 ${stagedFetchState.diagnosis?.analysisCandidateCount ?? result.noiseProcessingResult.candidateCount}件 / 主因 ${
          stagedFetchState.noiseBreakdown?.[0]?.label || "未分類"
        } / 改善追加 ${stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}回 / このまま追加 ${stagedFetchState.continueRemainingCount || 0}回`,
        operation: operationStatus.fetchX,
      },
      {
        label: "評価軸（Zone②）",
        value: axisDirty ? "変更あり・再スコアリング未実行" : axisConfig?.x?.label ? "現在のスコアに反映済み" : "未設定",
        detail: axisPresetLabel(axisConfig),
        operation: operationStatus.applyAxis,
      },
      {
        label: "スコアリング（Zone②）",
        value: scoringLabel,
        detail: operationStatus.rescore.message || (axisDirty ? "現在の評価軸で再スコアリングしてください。" : "最新です。"),
        operation: operationStatus.rescore,
      },
      {
        label: "クラスタ（Zone④）",
        value: clusterLabel,
        detail: saveClusterStatus === "running" || saveClusterStatus === "success" || saveClusterStatus === "error"
          ? operationStatus.saveCluster.message
          : queryDirty || axisDirty ? "古い可能性あり" : `${result.clusterTableRows.length}クラスタ`,
        operation: saveClusterStatus === "idle" ? operationStatus.semanticCluster : operationStatus.saveCluster,
      },
      {
        label: "AI要約（Zone⑤）",
        value: summaryLabel,
        detail: queryDirty || axisDirty ? "古い可能性あり" : autoSummaryStatus,
        operation: operationStatus.autoSummary,
      },
      {
        label: "フィードバック（Zone⑪）",
        value: axisDirty ? "古い可能性あり" : "ルールベース表示中",
        detail: operationStatus.feedback.message || "Zone⑪に表示中",
        operation: operationStatus.feedback,
      },
      {
        label: "コピー（結果）",
        value: copyStatusValue === "running" ? "コピー中..." : copyStatusValue === "success" ? "コピー済み" : copyStatusValue === "error" ? "コピー失敗" : "未コピー",
        detail: operationStatus.copyAnalysis.message || "未コピー",
        operation: operationStatus.copyAnalysis,
      },
    ];
  }

  return (
    <div className="app">
      <div className="header">
        {PUBLIC_PREVIEW_MODE && (
          <div className="public-preview-header">
            <strong>3DE Public Preview</strong>
            <span>
              これは開発中の試用版です。分析結果は参考表示です。
            </span>
          </div>
        )}
        <section className="zone-zero-panel" aria-label="Zone? データ管理">
          <div className="zone-zero-top-row">
            <div className="zone0-brand-block">
              <div className="zone-zero-brand">
                <h1>3DE MVP</h1>
                <div className="version">{zone0VersionLabel()}</div>
              </div>
              <span className="zone-zero-control-pill" title={currentPersonaConfig.description}>
                利用目的：{currentPersonaConfig.dashboardLabel}
              </span>
              <span className="zone-zero-axis-summary" title={axisExplanationItems(axisConfig).map((item) => `${item.axis.toUpperCase()}：${item.label} - ${item.description}`).join("\n")}>
                軸：{zone0AxisSummary()}
              </span>
              <a href="/guide" className="guide-entry-link">
                使い方を見る
              </a>
            </div>

            <div className="zone0-status-block" aria-label="Zone? 状態チップ">
              <span className="zone0-block-label">現在状態</span>
              <div className="zone-zero-status-row">
                {dashboardStatusItems().map((item) => (
                  <div key={item.label} className={zone0StatusChipClass(item)} title={statusItemTitle(item)}>
                    <strong className="zone0-status-chip-title">{compactDashboardLabel(item.label)}</strong>
                    <span className="zone0-status-chip-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="zone0-control-block">
              <div className="zone0-control-row" aria-label="Zone? 表示切替">
                <span className="zone0-block-label">表示切替</span>
                <div className="zone-zero-mini-group" aria-label="スコア表示方式">
                  <span>スコア</span>
                  {[
                    ["absolute", "絶対"],
                    ["relative", "相対"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={scoreDisplayMode === value ? "zone0-mini-button active" : "zone0-mini-button"}
                      onClick={() => setScoreDisplayMode(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="zone-zero-mini-group" aria-label="クラスタ比較表示">
                  <span>表示</span>
                  {(viewMode === "user"
                    ? [["processed", "最終結果"]]
                    : [
                        ["raw", "処理前"],
                        ["processed", "処理後"],
                        ["compare", "比較"],
                      ]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={graphMode === value ? "zone0-mini-button active" : "zone0-mini-button"}
                      onClick={() => setGraphMode(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="zone-zero-actions">
                <span className="zone0-block-label">実行</span>
                <span className="browser-storage-note">保存内容はこのブラウザ内に保存されます。他の人には共有されません。</span>
                {renderActionStatusButton("saveDataset")}
                {renderActionStatusButton("saveCluster")}
                {renderActionStatusButton("copyAnalysis")}
                {PUBLIC_PREVIEW_MODE && (operationStatus.fetchX.status === "running" || isAutoSummarizing || operationStatus.autoSummary.status === "running") && (
                  <button type="button" className="zone0-force-stop-button" onClick={handleForceStopRunningOperations}>
                    強制ストップ
                  </button>
                )}
                {renderLocalPublishPanel()}
              </div>
            </div>
          </div>

          <div className="zone-zero-axis-readable-panel" aria-label={JP_UI_LABELS.evaluationAxes}>
            <div className="zone-zero-axis-readable-heading">
              <strong>{JP_UI_LABELS.evaluationAxes}</strong>
              <span>{JP_UI_LABELS.axisGuide}</span>
            </div>
            <div className="zone-zero-axis-readable-grid">
              {axisExplanationItems(axisConfig).map((item) => (
                <div key={`zone0-readable-${item.axis}`} className="zone-zero-axis-readable-item">
                  <b>{item.axis.toUpperCase()} {item.label}</b>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>

          <details className="zone-zero-details">
            <summary>Zone?詳細を開く</summary>
            <div className="zone-zero-detail-body">
              <div className="zone-zero-status-grid">
              {dashboardStatusItems().map((item) => (
                <div key={item.label} className={operationStatusClass(item.operation)}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                  <small>
                    {item.detail}
                    {operationTimeLabel(item.operation) ? ` / ${operationTimeLabel(item.operation)}` : ""}
                  </small>
                </div>
              ))}
              </div>
              <div className="zone-zero-axis-strip" aria-label="現在のXYZ評価軸">
                {axisExplanationItems(axisConfig).map((item) => (
                  <div key={item.axis} className="zone-zero-axis-item">
                    <strong>{item.axis.toUpperCase()}：{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
              <div className="zone-zero-detail-notes">
                <div>
                  <strong>利用目的</strong>
                  <span>{currentPersonaConfig.description}</span>
                </div>
                <div>
                  <strong>表示設定</strong>
                  <span>
                    {viewMode === "user"
                      ? `スコア：${scoreDisplayModeLabel(scoreDisplayMode)} / グラフ：最終結果 / クラスタ方式：意味類似 OpenAI`
                      : `スコア：${scoreDisplayModeLabel(scoreDisplayMode)} / グラフ：${graphModeLabel(graphMode)} / クラスタ方式：${clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}`}
                  </span>
                </div>
                <div>
                  <strong>保存状態</strong>
                  <span>
                    Xデータ：{operationStatus.saveDataset.message || "未保存"} / クラスタ：
                    {operationStatus.saveCluster.message || "未保存"} / コピー：
                    {operationStatus.copyAnalysis.message || "未コピー"}
                  </span>
                </div>
              </div>
            </div>
          </details>
        </section>
        {PUBLIC_PREVIEW_MODE && (
          <div className="public-preview-notice">
            これは開発中の試用版です。分析結果は参考表示です。
          </div>
        )}
        {toast && <div className={`toast-message ${toast.type}`}>{toast.message}</div>}
      </div>

      <div className="app-shell" style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          <section className="row card sidebar-mode-panel user-guide-panel">
            <h3>使い方</h3>
            <ol>
              <li>テーマと自分の意見を入力</li>
              <li>評価軸をAIで設定、または手動設定</li>
              <li>{PUBLIC_PREVIEW_MODE ? "検索条件を確認して外部の声を取得" : "検索クエリを確認してXから取得"}</li>
              <li>必要なら評価軸を変更して再スコアリング</li>
              <li>{PUBLIC_PREVIEW_MODE ? "似た意見のまとまりとAI要約を確認" : "クラスタリング・AI要約を実行"}</li>
              <li>Zone⑪のフィードバックを見る</li>
            </ol>
            {PUBLIC_PREVIEW_MODE && <p className="public-sample-note">まずはサンプルで試すこともできます。</p>}
            <button
              type="button"
              className="next-action-box next-action-button"
              onClick={handleNextAction}
              disabled={getNextAction().disabled}
            >
              <span>次に押す：{getNextAction().buttonText}</span>
              <small>{getNextAction().targetZone} / {getNextAction().help}</small>
            </button>
          </section>

          {PUBLIC_PREVIEW_MODE && (
            <section className="row card public-about-panel">
              <details>
                <summary>このアプリについて</summary>
                <p>
                  3DEは、自分の意見と外部の声を比較し、近い声・違う声・足りない視点を見つけるための試作アプリです。現在はMVP段階であり、取得精度や分析精度は改善中です。
                </p>
              </details>
            </section>
          )}

      {!PUBLIC_PREVIEW_MODE && (
      <section className="row card mode-toggle-panel">
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 1 / mode切替</div>}
        <div className="mode-switcher">
          <button
            type="button"
            className={viewMode === "user" ? "mode-toggle-button user-active" : "mode-toggle-button"}
            onClick={() => setViewMode("user")}
          >
            ユーザーmode
          </button>
          <button
            type="button"
            className={viewMode === "developer" ? "mode-toggle-button dev-active" : "mode-toggle-button"}
            onClick={() => setViewMode("developer")}
          >
            開発者mode
          </button>
        </div>
        <div className="mode-description">
          現在：{viewMode === "developer" ? "開発者mode" : "ユーザーmode"}。
          {viewMode === "developer"
            ? "取得診断ログ、改善クエリ候補、保存データ詳細、デバッグ情報を表示しています。"
            : "途中の手動調整を隠し、X取得時はアプリが検索条件を自動調整します。"}
        </div>
      </section>
      )}

          <section className="row row-2 card zone-card zone-1 user-input-panel">
            <div className="zone-heading">Zone① テーマ・自分の意見</div>
            {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 2 / Zone①</div>}
            <p className="zone-lead">まずここから。調べたいテーマと、自分の意見を入力します。</p>
            <div className="input-source-pill">{JP_UI_LABELS.inputSource}: {currentInputSourceLabel()}</div>
            {viewMode === "developer" && (
              <div className="developer-panel dev-demo-panel-inner zone1-sample-panel">
                <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                  ユーザーmodeに戻る
                </button>
                <div className="developer-panel-title dev-demo-label">開発・デモ用サンプル</div>
                <p>
                  サンプルを選んでも即時反映せず、下の実行ボタンでテーマ・自分の意見・検索条件をまとめて反映します。
                </p>
                <div className="demo-sample-buttons">
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "housing" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("housing")}
                  >
                    <span className="sample-number">1.</span>住宅
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "iran" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("iran")}
                  >
                    <span className="sample-number">2.</span>イラン情勢
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "coding" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("coding")}
                  >
                    <span className="sample-number">3.</span>コーディング教室
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "religion" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("religion")}
                  >
                    <span className="sample-number">4.</span>宗教
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "democracy" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("democracy")}
                  >
                    <span className="sample-number">5.</span>民主主義
                  </button>
                  <button
                    type="button"
                    className={selectedDemoSampleKey === "romance" ? "option-button option-button-selected active" : "option-button"}
                    onClick={() => setSelectedDemoSampleKey("romance")}
                  >
                    <span className="sample-number">6.</span>恋愛
                  </button>
                </div>
                <div className="demo-sample-preview">
                  <strong>選択中：</strong>{sampleDisplayLabel(selectedDemoSampleKey)}
                </div>
                <button type="button" className="action-button action-button-primary" onClick={applySelectedDemoSample}>
                  このサンプルを反映
                </button>
              </div>
            )}
            <div className="field">
              <h3>テーマ</h3>
              <input value={theme} onChange={(event) => handleThemeChange(event.target.value)} />
            </div>

            <div className="field">
              <h3>自分の意見</h3>
              <textarea
                ref={userOpinionTextareaRef}
                className="user-opinion-textarea"
            value={userOpinion}
            onChange={(event) => {
              setUserOpinion(event.target.value);
              autoResizeTextarea(event.target);
            }}
          />
        </div>

        <button type="button" className="action-button action-button-secondary" onClick={resetUserInputArea}>
          入力欄をリセット
        </button>
        <button type="button" className="action-button action-button-secondary" onClick={() => loadSample(sampleKey)}>
          {JP_UI_LABELS.sampleOpinionTrial}
        </button>
      </section>

      <section className="row card zone-card zone-p persona-mode-panel">
        <div className="zone-heading">Zone P 利用目的・ペルソナ設定</div>
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 3 / ZoneP</div>}
        <p className="zone-lead">
          同じテーマでも、使う目的によってアウトプットの見せ方は変わります。
          まず、このテーマを何のために使うか選んでください。
        </p>
        <p className="persona-mode-note">
          利用目的は、分析結果の見せ方を変えます。評価軸と検索条件は、原則としてテーマを優先します。
        </p>
        <div className="persona-mode-buttons">
          {Object.entries(PERSONA_CONFIGS).map(([mode, config]) => (
            <button
              key={mode}
              type="button"
              className={personaMode === mode ? "option-button option-button-selected active persona-mode-button" : "option-button persona-mode-button"}
              onClick={() => handlePersonaModeChange(mode)}
            >
              <strong>{config.label}</strong>
              <span>{config.description}</span>
            </button>
          ))}
        </div>
        <div className="persona-mode-status">
          現在の利用目的：<strong>{currentPersonaConfig.dashboardLabel}</strong>
          <span> / テーマカテゴリ：{themeCategory}</span>
          {axisDirty && <span> / 評価軸・検索クエリ・フィードバックは再確認してください。</span>}
        </div>
        {viewMode === "developer" && mojibakeLabelWarnings.length > 0 && (
          <div className="developer-panel mojibake-warning-panel">
            <strong>{JP_UI_LABELS.possibleMojibake}</strong>
            <span>{mojibakeLabelWarnings.join(" / ")}</span>
          </div>
        )}
        {viewMode === "developer" && (
          <details className="developer-panel safe-query-preview developer-maintenance-panel">
            <summary>開発者向けメンテナンス</summary>
            <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
              ユーザーmodeに戻る
            </button>
            <p>
              古い保存状態に残った文字化け候補やクエリを削除し、現在のテーマから候補を再生成します。
            </p>
            <button type="button" className="action-button action-button-secondary" onClick={resetMojibakeRuntimeData}>
              文字化けデータをリセット
            </button>
          </details>
        )}
      </section>

      <section className="row card zone-card zone-q analysis-purpose-panel">
        <div className="zone-heading">Zone Q {JP_UI_LABELS.analysisPurpose}</div>
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 4 / ZoneQ</div>}
        <p className="zone-lead">{JP_UI_LABELS.analysisPurposeHelp}</p>
        <div className="persona-mode-buttons analysis-purpose-buttons">
          {Object.entries(ANALYSIS_PURPOSE_CONFIGS).map(([purposeMode, config]) => (
            <button
              key={purposeMode}
              type="button"
              className={
                analysisPurposeMode === purposeMode
                  ? "option-button option-button-selected active analysis-purpose-button"
                  : "option-button analysis-purpose-button"
              }
              onClick={() => handleAnalysisPurposeChange(purposeMode)}
            >
              <strong>{config.label}</strong>
              <span>{config.shortDescription}</span>
            </button>
          ))}
        </div>
        <div className="analysis-purpose-selected-detail">
          <strong>選択中：{currentAnalysisPurposeConfig.label}</strong>
          <span>{currentAnalysisPurposeConfig.description}</span>
          {viewMode === "developer" && (
            <small>
              {JP_UI_LABELS.voicesToCollect}: {currentAnalysisPurposeConfig.voiceDirections.map(voiceDirectionLabel).join(" / ")}
            </small>
          )}
        </div>
        {viewMode === "developer" && (
          <div className="developer-panel persona-mode-status">
            <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
              ユーザーmodeに戻る
            </button>
            <span>{JP_UI_LABELS.retrievalPolicy}: {currentAnalysisPurposeConfig.retrievalPolicy}</span>
            <span> / {JP_UI_LABELS.clusterPolicy}: {currentAnalysisPurposeConfig.clusterPolicy}</span>
            <span> / {JP_UI_LABELS.zone11Policy}: {currentAnalysisPurposeConfig.zone11Policy}</span>
          </div>
        )}
      </section>

          <section className="row card axis-config-card zone-card zone-2">
            <div className="zone-heading">Zone② 評価軸設定</div>
            {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 5 / Zone②</div>}
            {renderAiDraftPanel()}
            <details open>
              <summary>評価軸を編集する</summary>
              <div className="axis-config-content">
                <p className="zone-lead">
                  評価軸は、取得後の分析だけでなく、どんな意見を集めるべきかにも影響します。
                </p>
                <p className="axis-policy-note">
                  評価軸：テーマ優先。ペルソナは出力表現に反映します。
                </p>
                <div className="analysis-mode-summary">
                  <strong>取得モード</strong>
                  <span>
                    {analysisMode === "axisDriven" ? "評価軸に合わせて取得" : "広く探索"} /
                    ZoneQの「{currentAnalysisPurposeConfig.label}」に合わせて検索条件レビューへ反映します。
                  </span>
                </div>
                <div className="axis-preset-buttons">
                  {Object.entries(AXIS_PRESETS)
                    .filter(([key]) => key !== "themeDefault")
                    .map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className={
                        draftAxisConfig.presetKey === key
                          ? "option-button option-button-selected axis-preset-button"
                          : "option-button axis-preset-button"
                      }
                      onClick={() => selectAxisPreset(key)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {["x", "y", "z"].map((axis) => (
                  <div key={axis} className="axis-edit-group">
                    <label>
                      {axis.toUpperCase()}軸名
                      <input
                        value={draftAxisConfig[axis].label}
                        onChange={(event) => updateDraftAxis(axis, "label", event.target.value)}
                      />
                    </label>
                    <label>
                      {axis.toUpperCase()}軸の高い説明
                      <textarea
                        value={draftAxisConfig[axis].description}
                        onChange={(event) => updateDraftAxis(axis, "description", event.target.value)}
                      />
                    </label>
                    <label>
                      {axis.toUpperCase()}軸の低い説明
                      <textarea
                        className={`axis-low-description-textarea ${
                          axisLowDescriptionAutoGenerated[axis] ? "auto-generated" : "manual"
                        }`}
                        value={draftAxisConfig[axis].lowDescription || ""}
                        placeholder={inferLowAxisDescription(draftAxisConfig[axis].description, draftAxisConfig[axis].label)}
                        onChange={(event) => updateDraftAxis(axis, "lowDescription", event.target.value)}
                      />
                    </label>
                    {axisLowDescriptionAutoGenerated[axis] && draftAxisConfig[axis].lowDescription && (
                      <div className="axis-auto-low-description">
                        {JP_UI_LABELS.autoGeneratedLowDescription}: {draftAxisConfig[axis].lowDescription}
                      </div>
                    )}
                  </div>
                ))}

                <div className="axis-config-actions">
                  <button
                    type="button"
                    className={`action-button action-button-primary ${
                      operationStatus.applyAxis.status === "running"
                        ? "is-running"
                        : operationStatus.applyAxis.status === "success" && !axisDirty
                          ? "is-done"
                          : ""
                    }`}
                    onClick={applyAxisConfig}
                  >
                    {operationStatus.applyAxis.status === "running"
                      ? "評価軸適用中..."
                      : operationStatus.applyAxis.status === "success" && !axisDirty
                        ? "評価軸適用済み"
                        : "評価軸を適用"}
                  </button>
                  <button
                    type="button"
                    className={`action-button action-button-secondary ${
                      operationStatus.rescore.status === "running"
                        ? "is-running"
                        : operationStatus.rescore.status === "success" && !axisDirty
                          ? "is-done"
                          : ""
                    }`}
                    onClick={rescoreWithCurrentAxis}
                    disabled={!canRescoreWithCurrentAxis}
                  >
                    {operationStatus.rescore.status === "running"
                      ? "再スコアリング中..."
                      : operationStatus.rescore.status === "success" && !axisDirty
                        ? "再スコアリング済み"
                        : rescoreButtonText}
                  </button>
                </div>
                <div className="score-display-mode-panel">
                  <strong>スコア表示方式</strong>
                  <div className="analysis-mode-buttons">
                    {[
                      ["absolute", "絶対スコア"],
                      ["relative", "相対スコア"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={scoreDisplayMode === value ? "option-button option-button-selected" : "option-button"}
                        onClick={() => setScoreDisplayMode(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="status-panel">
                    現在のグラフ表示：{result.resolvedScoreDisplayMode === "relative" ? "相対スコア" : "絶対スコア"}。
                    相対スコアは今回の意見群内での差を見やすくし、絶対スコアは評価軸定義に基づく素点をそのまま表示します。
                  </div>
                </div>

                {axisStatus && <div className="axis-status">{axisStatus}</div>}
                {axisQualityWarnings.length > 0 && (
                  <div className="query-axis-warning">
                    <strong>評価軸の注意</strong>
                    {axisQualityWarnings.map((warning, index) => (
                      <div key={`axis-quality-${index}`}>{warning}</div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </section>


      <section className="row card zone-card zone-3 x-query-zone">
        {viewMode === "developer" && <div className="zone-order-marker developer-panel-badge">表示順: 6 / Zone③</div>}
        <div className="field external-field">
          <h3>外部意見（1行1意見）</h3>
          <textarea
            value={externalOpinions}
            onChange={(event) => {
              setExternalOpinions(event.target.value);
              setActiveDatasetId("");
              setActiveClusterRunId("");
              setXDataStatus(event.target.value.trim() ? "unsaved" : "sample");
              setHasScoredWithCurrentAxis(false);
              setSemanticClusterRows([]);
              setSemanticClusterStatus("");
              setSemanticClusterError("");
              setClusterSummaries({});
              resetAutoSummaryState();
              setHistoryStatus("");
            }}
          />

          <div className="x-fetch-panel">
            <div className="zone-heading">{PUBLIC_PREVIEW_MODE ? "Zone③ 検索条件・意見取得" : "Zone③ 意見取得・検索クエリ"}</div>
            <p className="zone-lead">
              {PUBLIC_PREVIEW_MODE
                ? "テーマと評価軸に合った意見を取得します。評価軸に関連する語を選ぶと、検索条件に追加されます。"
                : "テーマと評価軸に合った意見を取得します。評価軸連動キーワードを選ぶと、実行クエリにOR条件で追加されます。"}
            </p>

            <div className="axis-linked-keyword-panel">
              <h3>評価軸に関連する検索語</h3>
              {["x", "y", "z"].map((axis) => (
                <div key={axis} className="axis-linked-keyword-row">
                  <strong>現在の{axis.toUpperCase()}軸「{axisConfig[axis].label}」に関連する検索語：</strong>
                  {axisLinkedKeywords[axis].length === 0 ? (
                    <span>関連語はまだありません。</span>
                  ) : (
                    <div className="axis-linked-keyword-list">
                      {axisLinkedKeywords[axis].map((keyword) => (
                        <label key={`${axis}-${keyword}`} className="axis-linked-keyword-check">
                          <input
                            type="checkbox"
                            checked={selectedAxisLinkedKeywords.includes(keyword)}
                            onChange={() => toggleAxisLinkedKeyword(keyword)}
                          />
                          <span>{keyword}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {queryAxisWarnings.length > 0 && (
                <div className="query-axis-warning">
                  {queryAxisWarnings.map((warning, index) => (
                    <div key={`query-axis-warning-${index}`}>警告：{warning}</div>
                  ))}
                </div>
              )}
            </div>

            {personaMode === "personaA" && themeCategory === "romance" && (
              <div className="voice-direction-panel">
                <div className="voice-direction-header">
                  <h3>{JP_UI_LABELS.voicesToCollect}</h3>
                  <span>{JP_UI_LABELS.queryAdjustment}</span>
                </div>
                <div className="voice-direction-chip-list">
                  {VOICE_DIRECTION_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={
                        selectedVoiceDirections.includes(option.key)
                          ? "option-button option-button-selected voice-direction-chip active"
                          : "option-button voice-direction-chip"
                      }
                      onClick={() => toggleVoiceDirection(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p>
                  {JP_UI_LABELS.voicesToCollect}:{" "}
                  {normalizeVoiceDirections(selectedVoiceDirections).map(voiceDirectionLabel).join(" / ")}
                </p>
              </div>
            )}

            <div className="x-query-candidates">
              <div className="x-query-candidates-title">{PUBLIC_PREVIEW_MODE ? "検索条件候補" : "検索クエリ候補"}</div>
              <div className="query-candidate-actions">
                <button type="button" className="option-button" onClick={selectAllXQueryCandidates}>
                  すべて選択
                </button>
                <button type="button" className="option-button" onClick={clearAllXQueryCandidates}>
                  すべて解除
                </button>
              </div>
              <div className="x-query-buttons query-candidate-list">
                {xQueryCandidates.length === 0 && (
                  <div className="query-candidate-empty">
                    {PUBLIC_PREVIEW_MODE
                      ? "検索条件候補はまだありません。テーマと自分の意見を入力して「AIで評価軸を設定」を押してください。"
                      : "検索クエリ候補はまだありません。テーマと自分の意見を入力して「AIで評価軸を設定」を押すか、手入力クエリを使ってください。"}
                  </div>
                )}
                {xQueryCandidates.map((candidate, index) => (
                  <button
                    key={candidate.label}
                    type="button"
                    className={
                      selectedXQueryCandidateIds.includes(candidate.label)
                        ? "x-query-button option-button option-button-selected query-candidate-button query-candidate-card selected active"
                        : "x-query-button option-button query-candidate-button query-candidate-card"
                    }
                    onClick={() => toggleXQueryCandidate(index)}
                  >
                    <span className="query-candidate-check">
                      {selectedXQueryCandidateIds.includes(candidate.label) ? "選択中" : "未選択"}
                    </span>
                    <span className="query-candidate-label">{candidate.label}</span>
                    {viewMode === "developer" && (
                      <>
                        <small className="query-candidate-description">{candidate.description || candidate.note}</small>
                        <span className="query-candidate-query">
                          <span className="query-candidate-query-label">検索式：</span>
                          {candidate.base || candidate.query}
                        </span>
                        <small className="query-candidate-description">id: {candidate.id || candidate.label}</small>
                      </>
                    )}
                  </button>
                ))}
              </div>
              {generatedBasicKeywords.length > 0 && (
                <div className="generated-keyword-list">
                  <strong>AI生成基本キーワード：</strong>
                  {generatedBasicKeywords.join(" / ")}
                </div>
              )}
              <div className="selected-query-summary">
                選択中：{selectedXQueryCandidates.length}件
                {selectedXQueryCandidates.length > 0
                  ? `（${selectedXQueryCandidates.map((candidate) => candidate.label).join(" / ")}）`
                  : "（候補未選択。手入力クエリを使います）"}
              </div>
            </div>

            <div className="x-query-candidates hashtag-query-panel">
              <div className="x-query-candidates-title">ハッシュタグ候補</div>
              <p className="hashtag-query-note">
                ハッシュタグ検索は、その話題に意識的に投稿している人を拾いやすい一方、宣伝・自己PR・話題便乗の投稿も混じりやすくなります。必要に応じて除外語とセットで使ってください。
              </p>
              <div className="x-query-buttons query-candidate-list">
                {hashtagCandidates.map((candidate) => (
                  <button
                    key={candidate.hashtag}
                    type="button"
                    className={`x-query-button option-button query-candidate-button query-candidate-card hashtag-candidate ${candidate.selectionType} ${
                      selectedHashtagCandidates.includes(candidate.hashtag)
                        ? "option-button-selected selected active"
                        : ""
                    }`}
                    onClick={() => toggleHashtagCandidate(candidate.hashtag)}
                    disabled={candidate.selectionType === "disabled"}
                  >
                    <span className="query-candidate-check">
                      {candidate.selectionType === "disabled"
                        ? "非推奨"
                        : selectedHashtagCandidates.includes(candidate.hashtag)
                          ? "選択中"
                          : "未選択"}
                    </span>
                    <span className="query-candidate-label">{candidate.hashtag}</span>
                    <span className={`hashtag-selection-badge ${candidate.selectionType}`}>
                      {candidate.selectionType === "recommended"
                        ? "推奨"
                        : candidate.selectionType === "caution"
                          ? "注意"
                          : "非推奨"}
                    </span>
                    {viewMode === "developer" && (
                      <>
                        <small className="query-candidate-description">{candidate.reason}</small>
                        <small className="query-candidate-description">ノイズリスク: {candidate.noiseRisk}</small>
                        <small className="query-candidate-description">{candidate.selectionReason}</small>
                      </>
                    )}
                  </button>
                ))}
              </div>
              <div className="selected-query-summary">
                選択中ハッシュタグ：{selectedHashtagValues.length ? selectedHashtagValues.join(" / ") : "なし"}
              </div>
            </div>

            <div className="x-query-candidates exclude-term-panel">
              <div className="x-query-candidates-title">除外語候補</div>
              <div className="x-query-buttons query-candidate-list">
                {excludeTermCandidates.map((candidate) => (
                  <button
                    key={candidate.term}
                    type="button"
                    className={
                      selectedExcludeTermValues.includes(candidate.term)
                        ? "x-query-button option-button option-button-selected query-candidate-button query-candidate-card selected active"
                        : "x-query-button option-button query-candidate-button query-candidate-card"
                    }
                    onClick={() => toggleExcludeTermCandidate(candidate.term)}
                  >
                    <span className="query-candidate-check">
                      {selectedExcludeTermValues.includes(candidate.term) ? "除外中" : "未選択"}
                    </span>
                    <span className="query-candidate-label">-{candidate.term}</span>
                    {viewMode === "developer" && (
                      <small className="query-candidate-description">{candidate.reason}</small>
                    )}
                  </button>
                ))}
              </div>
              <div className="selected-query-summary">
                選択中除外語：{selectedExcludeTermValues.length ? selectedExcludeTermValues.join(" / ") : "なし"}
              </div>
            </div>

            {viewMode === "developer" && (
            <div className="developer-panel x-query-lab">
              <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                ユーザーmodeに戻る
              </button>
              <div className="developer-panel-title x-query-lab-title">開発用：X検索条件を調整する</div>
              <p className="x-query-lab-note">
                取得前に条件を変えて、重複・ノイズ・意見の質がどう変わるか確認します。まずは100件で比較してください。
              </p>

              <label>
                基本キーワード
                <textarea
                  className="basic-keywords-input query-keyword-field"
                  value={xQueryBase}
                  onChange={(event) => updateXQueryBase(event.target.value)}
                />
              </label>

              <div className="x-filter-checks">
                <label className="x-filter-check">
                  <input
                    type="checkbox"
                    checked={xQueryFilters.excludeRetweets}
                    onChange={(event) => updateXQueryFilter("excludeRetweets", event.target.checked)}
                  />
                  <span>リポスト除外</span>
                </label>

                <label className="x-filter-check">
                  <input
                    type="checkbox"
                    checked={xQueryFilters.excludeReplies}
                    onChange={(event) => updateXQueryFilter("excludeReplies", event.target.checked)}
                  />
                  <span>返信除外</span>
                </label>

                <label className="x-filter-check">
                  <input
                    type="checkbox"
                    checked={xQueryFilters.excludeLinks}
                    onChange={(event) => updateXQueryFilter("excludeLinks", event.target.checked)}
                  />
                  <span>リンク付き投稿除外</span>
                </label>
              </div>

              <div className="x-filter-grid">
                <label>
                  言語
                  <select
                    value={xQueryFilters.language}
                    onChange={(event) => updateXQueryFilter("language", event.target.value)}
                  >
                    <option value="ja">日本語 lang:ja</option>
                    <option value="en">英語 lang:en</option>
                    <option value="">指定しない</option>
                  </select>
                </label>

                <label>
                  最低いいね数
                  <input
                    type="number"
                    min=""
                    placeholder="例：5"
                    value={xQueryFilters.minLikes}
                    onChange={(event) => updateXQueryFilter("minLikes", event.target.value)}
                  />
                </label>

                <label>
                  最低リポスト数
                  <input
                    type="number"
                    min=""
                    placeholder="例：3"
                    value={xQueryFilters.minRetweets}
                    onChange={(event) => updateXQueryFilter("minRetweets", event.target.value)}
                  />
                </label>

                <label>
                  追加で探す言葉
                  <input
                    placeholder="例：政策 生活"
                    value={xQueryFilters.includeWords}
                    onChange={(event) => updateXQueryFilter("includeWords", event.target.value)}
                  />
                </label>

                <label>
                  取得しない言葉
                  <input
                    placeholder="例：PR 広告 キャンペーン"
                    value={xQueryFilters.excludeWords}
                    onChange={(event) => updateXQueryFilter("excludeWords", event.target.value)}
                  />
                </label>
              </div>

              <div className="x-filter-actions">
                <button type="button" className="x-small-button" onClick={resetXQueryFilters}>
                  検索条件を初期状態に戻す
                </button>
                <span className="x-manual-mode">
                  {isManualXQuery ? "下のクエリを手動編集しています" : "条件からクエリを自動生成しています"}
                </span>
              </div>
            </div>
            )}

            {viewMode === "developer" ? (
              <>
                <label>
                  手入力X検索式（候補未選択時に使います）
                  <input
                    value={xQuery}
                    onChange={(event) => {
                      setXQuery(event.target.value);
                      setSelectedXQueryCandidateIds([]);
                      setIsManualXQuery(true);
                      setQueryDirty(true);
                    }}
                  />
                </label>

                <div className={isEffectiveQueryTooLong ? "developer-panel effective-query-preview warning" : "developer-panel effective-query-preview"}>
                  <strong>実行されるX検索クエリ</strong>
                  <div>{safeRuntimeText(effectiveQuery || "（未入力）", viewMode)}</div>
                  <small>{effectiveQuery.length} / 450文字</small>
                  {isEffectiveQueryTooLong && (
                    <p>検索クエリが長すぎる可能性があります。候補を減らしてください。</p>
                  )}
                </div>
              </>
            ) : (
              <div className="user-query-summary">
                <strong>検索条件</strong>
                <span>アプリが安全な形に整えて送信します。</span>
              </div>
            )}

            {viewMode === "developer" && (
              <div className="developer-panel safe-query-preview">
                <button type="button" className="mode-assist-button mode-assist-button-dark" onClick={() => setViewMode("user")}>
                  ユーザーmodeに戻る
                </button>
                <strong>クエリビルダー確認</strong>
                <div>
                  <span>{QUERY_LABELS_JA.rawQuery}</span>
                  <code>{safeRuntimeText(safeQueryPreview.rawQuery || "（未入力）", viewMode)}</code>
                  <small>{QUERY_LABEL_DESCRIPTIONS_JA.rawQuery}</small>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.safeQuery}</span>
                  <code>{safeRuntimeText(safeQueryPreview.safeQuery || "（生成なし）", viewMode)}</code>
                  <small>{QUERY_LABEL_DESCRIPTIONS_JA.safeQuery}</small>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.fallbackQuery}</span>
                  <code>{safeRuntimeText(safeQueryPreview.fallbackQuery || "（生成なし）", viewMode)}</code>
                  <small>{QUERY_LABEL_DESCRIPTIONS_JA.fallbackQuery}</small>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.finalQueryForXApi}</span>
                  <code>{safeRuntimeText(safeQueryPreview.finalQueryForXApi || "（生成なし）", viewMode)}</code>
                  <small>{QUERY_LABEL_DESCRIPTIONS_JA.finalQueryForXApi}</small>
                </div>
                <div className="safe-query-preview-meta">
                  <span>{QUERY_LABELS_JA.queryLength}</span>
                  <b>{safeQueryPreview.queryLength || 0} / 450</b>
                  <span>{QUERY_LABELS_JA.fallbackQueryLength}</span>
                  <b>{safeQueryPreview.fallbackQueryLength || 0} / 450</b>
                  <span>{QUERY_LABELS_JA.finalQueryLength}</span>
                  <b>{safeQueryPreview.finalQueryLength || 0} / 450</b>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.sanitizedHashtags}</span>
                  <code>{safeQueryPreview.sanitizedHashtags?.length ? safeQueryPreview.sanitizedHashtags.join(" / ") : "なし"}</code>
                </div>
                <div>
                  <span>整形後の除外語</span>
                  <code>{safeQueryPreview.sanitizedExcludeTerms?.length ? safeQueryPreview.sanitizedExcludeTerms.join(" / ") : "なし"}</code>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.sanitizedHashtagRemovedParts}</span>
                  <code>
                    {safeQueryPreview.sanitizedHashtagRemovedParts?.length
                      ? safeQueryPreview.sanitizedHashtagRemovedParts
                          .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                          .join(" / ")
                      : "なし"}
                  </code>
                </div>
                <div>
                  <span>{QUERY_LABELS_JA.sanitizedExcludeRemovedParts}</span>
                  <code>
                    {safeQueryPreview.sanitizedExcludeRemovedParts?.length
                      ? safeQueryPreview.sanitizedExcludeRemovedParts
                          .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                          .join(" / ")
                      : "なし"}
                  </code>
                </div>
                {safeQueryPreview.queryBuildWarnings?.length > 0 && (
                  <ul>
                    {safeQueryPreview.queryBuildWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="safe-query-preview query-review-card">
              <strong>{JP_UI_LABELS.queryReview}</strong>
              <div>
                <span>{JP_UI_LABELS.analysisPurpose}</span>
                <code>{queryReviewParts.analysisPurposeLabel}</code>
              </div>
              <div>
                <span>{JP_UI_LABELS.inputSource}</span>
                <code>{queryReviewParts.inputSourceLabel}</code>
              </div>
              <div>
                <span>{JP_UI_LABELS.retrievalPolicy}</span>
                <code>{queryReviewParts.retrievalPolicy}</code>
              </div>
              {viewMode === "developer" && (
                <>
                  <div>
                    <span>{JP_UI_LABELS.clusterPolicy}</span>
                    <code>{queryReviewParts.clusterPolicy}</code>
                  </div>
                  <div>
                    <span>{JP_UI_LABELS.zone11Policy}</span>
                    <code>{queryReviewParts.zone11Policy}</code>
                  </div>
                </>
              )}
              <div>
                <span>{JP_UI_LABELS.adoptedIncludeTerms}</span>
                <QueryReviewChips values={queryReviewParts.includeTerms} className="include" />
              </div>
              <div>
                <span>{JP_UI_LABELS.adoptedHashtags}</span>
                <QueryReviewChips values={queryReviewParts.includeHashtags} className="hashtag" />
              </div>
              <div>
                <span>{JP_UI_LABELS.excludeTerms}</span>
                <QueryReviewChips values={queryReviewParts.excludeTerms} className="exclude" />
              </div>
              {viewMode === "developer" && (
                <>
                  <div>
                    <span>{JP_UI_LABELS.cautionCandidates}</span>
                    <QueryReviewChips values={queryReviewParts.cautionTerms} className="caution" />
                  </div>
                  <div>
                    <span>{JP_UI_LABELS.disabledCandidates}</span>
                    <QueryReviewChips values={queryReviewParts.disabledTerms} className="disabled" />
                  </div>
                  <div>
                    <span>{JP_UI_LABELS.finalTrustedQuery}</span>
                    <code>{queryReviewParts.finalQueryForXApi || "なし"}</code>
                  </div>
                </>
              )}
            </div>

            {viewMode === "developer" && (
            <div className="developer-panel x-query-help">
              <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                ユーザーmodeに戻る
              </button>
              <div><strong>-is:retweet</strong>：リポスト投稿を取らない条件です。コピペ投稿までは除けません。</div>
              <div><strong>-is:reply</strong>：返信投稿を取らない条件です。単独投稿だけを拾いやすくします。</div>
              <div><strong>-has:links</strong>：URL付き投稿を取得しません。ニュース転載・宣伝を減らします。</div>
              <div><strong>min_likes</strong>：最低いいね数です。反応がある投稿に絞れますが、少数意見は減ります。</div>
            </div>
            )}

            <div className="x-fetch-grid">
              <label>
                最大件数
                <input
                  type="number"
                  min="10"
                  max={PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH}
                  value={xMaxResults}
                  onChange={(event) => {
                    const maxFetchCount = PUBLIC_PREVIEW_MODE ? PUBLIC_PREVIEW_MAX_X_FETCH : DEFAULT_MAX_X_FETCH;
                    const nextValue = event.target.value === "" ? "" : Math.min(maxFetchCount, Number(event.target.value) || 10);
                    setXMaxResults(nextValue);
                  }}
                />
                {PUBLIC_PREVIEW_MODE && <small>公開プレビューでは最大200件まで取得できます。</small>}
              </label>

              <label>
                反映方法
                <div className="readonly-field">毎回、今回の取得結果で置き換え</div>
              </label>
            </div>

            {viewMode === "developer" && (
            <div className="staged-fetch-setting">
              <div>
                <strong>段階取得</strong>
                <p>ON時はまず30件を取得してクエリ品質を診断し、良好なら本取得へ進みます。</p>
              </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={stagedFetchState.enabled}
                    onChange={(event) =>
                      setStagedFetchState((previous) => ({
                        ...previous,
                        enabled: event.target.checked,
                      }))
                    }
                  />
                  {stagedFetchEnabled ? "ON" : "OFF"}
                </label>
            </div>
            )}

            <button
              className={`action-button action-button-primary x-fetch-button ${
                operationStatus.fetchX.status === "running"
                  ? "is-running"
                  : operationStatus.fetchX.status === "success" && !queryDirty
                    ? "is-done"
                    : ""
              }`}
              onClick={handleFetchXButtonClick}
              disabled={isEffectiveQueryTooLong || operationStatus.fetchX.status === "running"}
            >
              {operationStatus.fetchX.status === "running"
                ? "取得中..."
                : operationStatus.fetchX.status === "success" && !queryDirty
                  ? "X取得済み"
                  : viewMode === "user"
                    ? "Xから取得して外部意見欄に反映"
                    : "Xから取得して外部意見欄に反映"}
            </button>

            {xStatus && <div className="x-status">{xStatus}</div>}

            <div className={`query-diagnosis-panel ${stagedFetchState.diagnosisStatus} ${viewMode === "developer" ? "developer-panel" : ""}`}>
              <div className="query-diagnosis-header">
                <strong>{viewMode === "user" ? "取得品質" : `取得診断：${queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}`}</strong>
                <span>
                  {viewMode === "user"
                    ? operationStatus.fetchX.status === "running"
                      ? "外部意見を取得中です。"
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "取得品質を確認してください。"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "取得できました。"
                          : "取得前です。"
                    : stagedFetchState.message}
                </span>
              </div>
              {viewMode === "developer" && (
              <div className="staged-fetch-progress">
                <div><span>目標</span><b>{Number(xMaxResults) || 0}</b></div>
                <div><span>今回取得</span><b>{stagedFetchState.currentBatchCount || stagedFetchState.fetchedCount || 0}</b></div>
                <div><span>現在データ</span><b>{stagedCurrentDataCount}</b></div>
                <div><span>残り</span><b>{stagedRemainingCount}</b></div>
                <div><span>次回追加</span><b>{stagedNextFetchCount}</b></div>
                <div><span>API累計</span><b>{stagedFetchState.totalApiFetchedCount || stagedCurrentDataCount}</b></div>
                <div><span>分析対象</span><b>{stagedFetchState.diagnosis?.analysisCandidateCount ?? result.noiseProcessingResult.candidateCount}</b></div>
                <div><span>関連度基準</span><b>{noiseRelevanceThreshold}</b></div>
                <div><span>改善追加</span><b>{stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}</b></div>
                <div><span>このまま追加</span><b>{stagedFetchState.continueRemainingCount || 0}</b></div>
              </div>
              )}
              {viewMode === "user" && (
                <div className="user-fetch-summary">
                  <strong>
                    {operationStatus.fetchX.status === "running"
                      ? "外部意見を取得中..."
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "取得品質を確認してください"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "取得できました"
                          : "取得前です"}
                  </strong>
                  <span>
                    {operationStatus.fetchX.status === "running"
                      ? `${stagedCurrentDataCount} / ${Number(xMaxResults) || 0}件。検索条件を自動調整しています。`
                      : stagedFetchState.diagnosisStatus === "bad"
                        ? "外部意見の取得が十分に進みませんでした。"
                        : stagedFetchState.diagnosisStatus === "good"
                          ? "外部意見を取得できました。"
                          : "ボタンを押すと自動で取得します。"}
                  </span>
                  <small>
                    目標：{Number(xMaxResults) || 0}件 / 取得済み：{stagedCurrentDataCount}件 / 残り：{stagedRemainingCount}件
                  </small>
                  {!PUBLIC_PREVIEW_MODE && (operationStatus.fetchX.status === "error" || stagedFetchState.diagnosisStatus === "bad") && (
                    <button type="button" className="mode-assist-button" onClick={() => setViewMode("developer")}>
                      開発者modeで詳細を見る
                    </button>
                  )}
                </div>
              )}
              {viewMode === "developer" && (selectedHashtagValues.length > 0 || selectedExcludeTermValues.length > 0) && (
                <div className="developer-panel query-change-panel">
                  <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                    ユーザーmodeに戻る
                  </button>
                  {selectedHashtagValues.length > 0 && (
                    <div>
                      <strong>使用ハッシュタグ</strong>
                      <span>{selectedHashtagValues.join(" / ")}</span>
                    </div>
                  )}
                  {selectedExcludeTermValues.length > 0 && (
                    <div>
                      <strong>使用除外語</strong>
                      <span>{selectedExcludeTermValues.map((term) => `-${term}`).join(" ")}</span>
                    </div>
                  )}
                </div>
              )}
              {viewMode === "developer" && (
                <div className="developer-panel query-change-panel">
                  <div>
                    <strong>{JP_UI_LABELS.autoFetchSafetyLimit}</strong>
                    <span>無限ループを防ぐための安全上限です。取得件数の上限ではありません。</span>
                  </div>
                </div>
              )}
              {viewMode === "developer" && (stagedFetchState.beforeQuery || stagedFetchState.afterQuery) && (
                <div className="developer-panel query-change-panel">
                  {stagedFetchState.beforeQuery && (
                    <div>
                      <strong>変更前クエリ</strong>
                      <span>{stagedFetchState.beforeQuery}</span>
                    </div>
                  )}
                  {stagedFetchState.afterQuery && (
                    <div>
                      <strong>変更後クエリ</strong>
                      <span>{stagedFetchState.afterQuery}</span>
                    </div>
                  )}
                </div>
              )}
              {viewMode === "developer" && stagedFetchState.diagnosis && (
                <>
                  <div className="developer-panel query-diagnosis-metrics">
                    <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                      ユーザーmodeに戻る
                    </button>
                    <div><span>取得</span><b>{stagedFetchState.diagnosis.fetchedCount}</b></div>
                    <div><span>正規化</span><b>{stagedFetchState.diagnosis.normalizedCount}</b></div>
                    <div><span>分析対象</span><b>{stagedFetchState.diagnosis.analysisCandidateCount}</b></div>
                    <div><span>ノイズ率</span><b>{formatPercent(stagedFetchState.diagnosis.noiseRate)}</b></div>
                    <div><span>候補率</span><b>{formatPercent(stagedFetchState.diagnosis.candidateRate)}</b></div>
                    <div><span>重複率</span><b>{formatPercent(stagedFetchState.diagnosis.duplicateRate)}</b></div>
                  </div>
                  {stagedFetchState.diagnosis.problemReasons.length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons">
                      <strong>主な理由</strong>
                      <ul>
                        {stagedFetchState.diagnosis.problemReasons.map((reason, index) => (
                          <li key={`diagnosis-reason-${index}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(stagedFetchState.noiseBreakdown || []).length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons noise-breakdown-panel">
                      <strong>ノイズ分類の内訳</strong>
                      <ul>
                        {stagedFetchState.noiseBreakdown.map((item) => (
                          <li key={`noise-breakdown-${item.category}`}>
                            {item.label}: {item.count}件。{item.advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(stagedFetchState.queryTermDiagnosis || []).length > 0 && (
                    <div className="developer-panel query-diagnosis-reasons query-term-panel">
                      <strong>検索語ごとの診断</strong>
                      <ul>
                        {stagedFetchState.queryTermDiagnosis.map((item) => (
                          <li key={`query-term-${item.term}`}>
                            「{item.term}」: {item.status === "ok" ? "維持" : "見直し"} / {item.problem} {item.advice}
                            {item.suggestion ? ` 候補: ${item.suggestion}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stagedFetchState.aiQueryAdvice && (
                    <div className="developer-panel query-advice-panel">
                      <strong>AIによる取得改善アドバイス</strong>
                      <p>{stagedFetchState.aiQueryAdvice.diagnosisSummary}</p>
                      {(stagedFetchState.aiQueryAdvice.mainProblems || []).length > 0 && (
                        <ul>
                          {stagedFetchState.aiQueryAdvice.mainProblems.map((problem, index) => (
                            <li key={`ai-advice-problem-${index}`}>{problem}</li>
                          ))}
                        </ul>
                      )}
                      {stagedFetchState.aiQueryAdvice.recommendedQuery && (
                        <div className="recommended-query-box">
                          <span>推奨クエリ</span>
                          <b>{stagedFetchState.aiQueryAdvice.recommendedQuery}</b>
                        </div>
                      )}
                      {stagedFetchState.aiQueryAdvice.userMessage && <p>{stagedFetchState.aiQueryAdvice.userMessage}</p>}
                    </div>
                  )}
                  {stagedFetchState.improvementComparison && (
                    <div className={`developer-panel query-comparison-panel ${stagedFetchState.improvementComparison.improved ? "good" : "bad"}`}>
                      <strong>改善前後の比較</strong>
                      <div className="query-comparison-grid">
                        <div><span>分析対象</span><b>{stagedFetchState.improvementComparison.beforeAnalysisCandidateCount} → {stagedFetchState.improvementComparison.afterAnalysisCandidateCount}</b></div>
                        <div><span>ノイズ率</span><b>{formatPercent(stagedFetchState.improvementComparison.beforeNoiseRate)} → {formatPercent(stagedFetchState.improvementComparison.afterNoiseRate)}</b></div>
                        <div><span>重複率</span><b>{formatPercent(stagedFetchState.improvementComparison.beforeDuplicateRate)} → {formatPercent(stagedFetchState.improvementComparison.afterDuplicateRate)}</b></div>
                        <div><span>診断</span><b>{queryDiagnosisLabel(stagedFetchState.improvementComparison.beforeStatus)} → {queryDiagnosisLabel(stagedFetchState.improvementComparison.afterStatus)}</b></div>
                      </div>
                      <p>{stagedFetchState.improvementComparison.message}</p>
                    </div>
                  )}
                  {stagedFetchState.diagnosis.analysisCandidateCount < 5 && (
                    <div className="developer-panel query-diagnosis-reasons strong">
                      <strong>分析対象が少なすぎます</strong>
                      <p>
                        {stagedFetchState.diagnosis.fetchedCount}件取得しましたが、分析対象に残った投稿は
                        {stagedFetchState.diagnosis.analysisCandidateCount}件だけです。この状態ではクラスタリングやグラフ分析を行っても意味のある分布が出にくいです。
                      </p>
                      <ul>
                        <li>改善候補を複数選択して追加取得してください。既存データは保持されます。</li>
                        <li>このクエリのまま残りを追加取得して、該当投稿が増えるか確認できます。</li>
                        <li>ノイズ除去を弱めて再診断することもできます。</li>
                        <li>手動で検索語を追加する場合は、テーマに近い具体語を入れてください。</li>
                      </ul>
                    </div>
                  )}
                  {stagedFetchState.lastAction === "improved_add" && stagedFetchState.diagnosisStatus === "bad" && (
                    <div className="developer-panel query-diagnosis-reasons strong">
                      <strong>改善クエリで追加取得しても不調です</strong>
                      <ul>
                        <li>検索語がまだ狭すぎる可能性があります。</li>
                        <li>X上に該当投稿が少ない可能性があります。</li>
                        <li>ノイズ除去が強すぎる場合は「ノイズ除去を弱めて再診断」を試してください。</li>
                        <li>具体語を追加するか、保存済みデータでデモ確認することもできます。</li>
                      </ul>
                    </div>
                  )}
                  {shouldShowStagedActions && (
                    <div className="developer-panel query-diagnosis-actions">
                      {["warning", "bad"].includes(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality) && (
                        <div className="query-action-warning">
                          <strong>追加取得前の確認</strong>
                          <span>
                            現在の取得効率は{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}です。
                            このまま追加取得すると、X APIを消費してもノイズが増える可能性があります。
                            先に除外語・ハッシュタグ・検索語を調整することをおすすめします。
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="action-button action-button-primary"
                        onClick={() => refetchWithImprovedQuery()}
                        disabled={!canAddImprovedQuery}
                      >
                        {stagedNextFetchCount < STAGED_FETCH_INITIAL_COUNT && stagedNextFetchCount > 0
                          ? `改善クエリで残り${stagedNextFetchCount}件追加`
                          : `改善クエリで${stagedNextFetchCount || STAGED_FETCH_INITIAL_COUNT}件追加取得`}
                      </button>
                      <button
                        type="button"
                        className="action-button action-button-secondary"
                        onClick={continueStagedFetch}
                        disabled={!canContinueStagedFetch}
                      >
                        {stagedNextFetchCount < STAGED_FETCH_INITIAL_COUNT && stagedNextFetchCount > 0
                          ? `このクエリのまま残り${stagedNextFetchCount}件追加`
                          : `このクエリのまま${stagedNextFetchCount || STAGED_FETCH_INITIAL_COUNT}件追加取得`}
                      </button>
                      {stagedFetchState.weakNoiseRetryAvailable && (
                        <button type="button" className="action-button action-button-secondary" onClick={retryDiagnosisWithWeakNoiseFilter}>
                          ノイズ除去を弱めて再診断
                        </button>
                      )}
                      <button type="button" className="action-button action-button-secondary" onClick={focusManualQueryEdit}>
                        手動でクエリを直す
                      </button>
                    </div>
                  )}
                  {stagedFetchState.improvedQueryCandidates.length > 0 && (
                    <div className="developer-panel improved-query-list">
                      <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                        ユーザーmodeに戻る
                      </button>
                      <div className="improved-query-context">
                        <div>
                          <strong>現在のクエリ</strong>
                          <span>{safeRuntimeText(effectiveQuery, viewMode)}</span>
                        </div>
                        <div>
                          <strong>適用後の実行クエリ</strong>
                          <span>{safeRuntimeText(selectedImprovedExecutionQuery || "候補を選択してください。", viewMode)}</span>
                        </div>
                        {selectedImprovedQueryIsSame && (
                          <div className="query-same-warning">
                            改善クエリが現在のクエリと同じです。追加取得は可能ですが、同じ傾向の投稿が増える可能性があります。
                          </div>
                        )}
                      </div>
                      {stagedFetchState.improvedQueryCandidates.map((candidate, index) => (
                        <button
                          key={`${candidate.label}-${candidate.query}`}
                          type="button"
                          className={
                            (stagedFetchState.selectedImprovedQueryIndexes || []).includes(index)
                              ? "option-button option-button-selected improved-query-button"
                              : "option-button improved-query-button"
                          }
                          onClick={() => toggleImprovedQueryCandidate(index)}
                        >
                          <em>{(stagedFetchState.selectedImprovedQueryIndexes || []).includes(index) ? "選択中" : "未選択"}</em>
                          <strong>{safeRuntimeText(candidate.label, viewMode)}</strong>
                          <span>{safeRuntimeText(candidate.query, viewMode)}</span>
                          <small>{safeRuntimeText(candidate.reason, viewMode)}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {viewMode === "developer" && stagedFetchState.stageLogs.length > 0 && (
                <div className="developer-panel staged-fetch-log">
                  <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
                    ユーザーmodeに戻る
                  </button>
                  <strong>段階取得ログ</strong>
                  <ol>
                    {stagedFetchState.stageLogs.map((stage) => (
                      <li key={`${stage.stageNo}-${stage.createdAt}`}>
                        <div>
                          {stage.stageNo}回目：{stage.actionLabel} / 要求{stage.requestedFetchCount ?? stage.currentBatchCount}件 /
                          API返却{stage.apiReturnedCount ?? stage.currentBatchCount}件 / 新規{stage.newUniqueCount ?? stage.currentBatchCount}件 /
                          重複{stage.duplicateSkippedCount ?? 0}件 / ノイズ除外{stage.noiseRemovedCount ?? 0}件 /
                          停止理由{stage.stopReason ? stopReasonLabel(stage.stopReason) : "なし"} / 現在{stage.currentDataCount ?? stage.accumulatedCount}件 /
                          残り{stage.remainingCount ?? Math.max(0, (stage.targetCount || Number(xMaxResults) || 0) - (stage.accumulatedCount || 0))}件 /
                          正規化{stage.normalizedCount}件 / 分析対象{stage.analysisCandidateCount}件 /
                          ノイズ率{formatPercent(stage.noiseRate)} / {stage.queryKind || "通常語"} / {queryDiagnosisLabel(stage.diagnosisStatus)}
                        </div>
                        {(stage.newUniqueCount ?? stage.currentBatchCount) <= 1 && (stage.requestedFetchCount ?? 0) > 1 && (
                          <small>
                            {stage.requestedFetchCount}件を要求しましたが、新規追加は{stage.newUniqueCount ?? 0}件でした。
                            {stage.apiReturnedCount > 0
                              ? "X APIは投稿を返しています。既存データとの重複、またはノイズ除去で追加されなかった可能性があります。"
                              : "X APIから投稿が返らなかった可能性があります。検索条件を広げてください。"}
                          </small>
                        )}
                        <small>{safeRuntimeText(stage.query, viewMode)}</small>
                        {(stage.rawQuery ||
                          stage.safeQuery ||
                          stage.fallbackQuery ||
                          stage.finalQueryForXApi ||
                          stage.apiErrorMessage ||
                          stage.queryBuildWarnings?.length > 0) && (
                          <details className="developer-panel stage-query-build-details">
                            <summary>クエリビルダー詳細</summary>
                            <div>
                              <strong>{QUERY_LABELS_JA.rawQuery}</strong>
                              <span>{safeRuntimeText(stage.rawQuery || "-", viewMode)}</span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.safeQuery}</strong>
                              <span>{safeRuntimeText(stage.safeQuery || "-", viewMode)}</span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.fallbackQuery}</strong>
                              <span>{safeRuntimeText(stage.fallbackQuery || "-", viewMode)}</span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.finalQueryForXApi}</strong>
                              <span>{safeRuntimeText(stage.finalQueryForXApi || stage.query || "-", viewMode)}</span>
                            </div>
                            <div>
                              <strong>整形状態</strong>
                              <span>{queryBuildStatusLabel(stage.queryBuildStatus)}</span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.fallbackUsed}</strong>
                              <span>{stage.fallbackUsed ? "あり" : "なし"}</span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.retryCount}</strong>
                              <span>{stage.retryCount || 0}</span>
                            </div>
                            {stage.apiErrorMessage && (
                              <div>
                                <strong>{QUERY_LABELS_JA.apiErrorMessage}</strong>
                                <span>{stage.apiErrorMessage}</span>
                              </div>
                            )}
                            {stage.errorType && (
                              <div>
                                <strong>errorType</strong>
                                <span>{stage.errorType}</span>
                              </div>
                            )}
                            {stage.originalErrorMessage && (
                              <div>
                                <strong>originalErrorMessage</strong>
                                <span>{stage.originalErrorMessage}</span>
                              </div>
                            )}
                            {stage.errorTimestamp && (
                              <div>
                                <strong>timestamp</strong>
                                <span>{stage.errorTimestamp}</span>
                              </div>
                            )}
                            {stage.queryBuildWarnings?.length > 0 && (
                              <div>
                                <strong>{QUERY_LABELS_JA.queryBuildWarnings}</strong>
                                <span>{stage.queryBuildWarnings.join(" / ")}</span>
                              </div>
                            )}
                            <div>
                              <strong>{QUERY_LABELS_JA.sanitizedHashtagRemovedParts}</strong>
                              <span>
                                {stage.sanitizedHashtagRemovedParts?.length
                                  ? stage.sanitizedHashtagRemovedParts
                                      .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                                      .join(" / ")
                                  : "なし"}
                              </span>
                            </div>
                            <div>
                              <strong>{QUERY_LABELS_JA.sanitizedExcludeRemovedParts}</strong>
                              <span>
                                {stage.sanitizedExcludeRemovedParts?.length
                                  ? stage.sanitizedExcludeRemovedParts
                                      .map((item) => `${item.input} -> ${item.output || "除外"} (${item.reason})`)
                                      .join(" / ")
                                  : "なし"}
                              </span>
                            </div>
                          </details>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {viewMode === "developer" && (
            <p className="x-note">
              Bearer Tokenはブラウザ側ではなく、同梱のserver.js側の.envに設定します。
              X APIのRecent Searchは1回100件までなので、1000件指定時はサーバー側でページング取得します。
            </p>
            )}
          </div>
        </div>
      </section>

      {/* データ詳細確認 */}
      <section className="row card history-panel control-panel x-data-panel zone-card zone-4">
        <div className="section-title-row">
          <h2 className="control-panel-title">データ詳細確認</h2>
        </div>
        <p className="control-panel-description">
          現在扱っているXデータと保存済み履歴を確認します。保存とコピーはZone?とこのパネルの共通ボタンから実行できます。
        </p>
        <div className="sidebar-action-status-buttons">
          {renderActionStatusButton("saveDataset", "sidebar-action-button")}
          {renderActionStatusButton("saveCluster", "sidebar-action-button")}
          {renderActionStatusButton("copyAnalysis", "sidebar-action-button")}
        </div>

        <div className={`noise-filter-panel compact ${viewMode === "developer" ? "developer-panel" : ""}`}>
          <div className="noise-filter-header">
            <strong>ノイズ除去</strong>
            <span className={noiseFilteringEnabled ? "status-pill success" : "status-pill muted"}>
              {noiseFilteringEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <div className="noise-filter-summary">
            除外 {result.noiseProcessingResult.noiseExcludedCount}件 / 分析対象 {result.noiseProcessingResult.analysisTargetCount}件
          </div>
          {viewMode === "developer" && (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={isNoiseFilteringDisabled}
                onChange={(event) => setIsNoiseFilteringDisabled(event.target.checked)}
              />
              開発用：ノイズ除去を一時的にOFF
            </label>
          )}
        </div>

        <div className="workflow-steps">
          <div className={workflowClass(["input", "aiDraft", "fetchX"].includes(getNextAction().actionType) ? "current" : "done")}>
            <span>1. X取得</span>
            <span className="workflow-badge">{["input", "aiDraft", "fetchX"].includes(getNextAction().actionType) ? "未完了" : "完了"}</span>
          </div>
          <div className={workflowClass(getNextAction().actionType === "rescore" ? "current" : hasScoredWithCurrentAxis ? "done" : "pending")}>
            <span>2. 再スコアリング</span>
            <span className="workflow-badge">{hasScoredWithCurrentAxis ? "完了" : "未実行"}</span>
          </div>
          <div className={workflowClass(["cluster", "semanticCluster"].includes(getNextAction().actionType) ? "current" : result.clusterTableRows.length > 0 ? "done" : "pending")}>
            <span>3. クラスタリング</span>
            <span className="workflow-badge">{result.clusterTableRows.length > 0 ? "完了" : "未実行"}</span>
          </div>
          <div className={workflowClass(getNextAction().actionType === "summary" ? "current" : summarizedClusterCount() > 0 ? "done" : "pending")}>
            <span>4. AI要約・フィードバック</span>
            <span className="workflow-badge">{summarizedClusterCount() > 0 ? "完了" : "未実行"}</span>
          </div>
        </div>

        {historyStatus && <div className="history-status">{historyStatus}</div>}
        {(datasetThemeMismatch || datasetUserOpinionMismatch) && (
          <div className="save-target-warning">
            {datasetThemeMismatch && (
              <div>注意：保存済みXデータのテーマと現在入力中のテーマが一致していません。</div>
            )}
            {datasetUserOpinionMismatch && (
              <div>注意：保存済みXデータの自分の意見と現在入力中の自分の意見が一致していません。</div>
            )}
          </div>
        )}

        <div className="active-dataset-panel">
          <h3>現在のXデータ</h3>
          <div className="history-meta">
            <div>状態：{currentXDataStateLabel()}</div>
            <div>X取得件数：{externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}件</div>
            {viewMode === "developer" && (
              <>
            <div>正規化後ユニーク件数：{result.noiseProcessingResult.uniqueNormalizedCount}</div>
            <div>完全重複数：{result.noiseProcessingResult.duplicateCount}</div>
            <div>RT風投稿数：{result.noiseProcessingResult.retweetLikeCount}</div>
            <div>保存日時：{activeDataset?.savedAt ? formatHistoryDate(activeDataset.savedAt) : "-"}</div>
              </>
            )}
            <div>
              サンプル：
              {activeDataset
                ? `${sampleNoLabel(activeDataset.sampleKey, activeDataset.sampleNo)}：${sampleTitle(null, activeDataset.sampleLabel || activeDataset.sampleKey)}`
                : sampleDisplayLabel(sampleKey)}
            </div>
            <div>テーマ：{activeDataset?.theme || theme || "-"}</div>
            {viewMode === "developer" && (
              <>
            <div>保存データの自分の意見：{truncateText(activeDataset?.userOpinion || "-", 120)}</div>
            <div>選択クエリ候補数：{activeDataset?.selectedQueryCandidateIds?.length ?? selectedXQueryCandidateIds.length}</div>
            <div>実行X検索クエリ：{activeDataset?.effectiveQuery || activeDataset?.query || effectiveQuery || "-"}</div>
              </>
            )}
            <div>
              件数：
              {activeDataset?.count ||
                externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}
              件
            </div>
            {viewMode === "developer" && <div>datasetId：{activeDatasetId || "-"}</div>}
          </div>
        </div>

        <div className="history-section zone-subsection">
          <button
            type="button"
            className="collapse-header"
            onClick={() => {
              if (viewMode === "developer") {
                setIsXDatasetHistoryExpanded((previous) => !previous);
              }
            }}
          >
            <span>{viewMode === "developer" ? (isXDatasetHistoryExpanded ? "-" : "+") : ""} 保存済みXデータ履歴</span>
            <strong>{datasetHistory.datasets.length}件</strong>
          </button>
          {datasetHistory.datasets.length === 0 ? (
            <div className="history-empty">保存済みXデータはありません。</div>
          ) : viewMode === "user" || !isXDatasetHistoryExpanded ? (
            <div className="collapsed-dataset-summary">
              {datasetHistory.datasets.map((dataset) => (
                <div
                  key={dataset.datasetId}
                  className={dataset.datasetId === activeDatasetId ? "dataset-summary-row active" : "dataset-summary-row"}
                >
                  <div className="dataset-summary-main">
                    <strong>
                      {`${sampleNoLabel(dataset.sampleKey, dataset.sampleNo)}：${sampleTitle(
                        null,
                        dataset.sampleLabel || dataset.sampleKey || "-"
                      )}`}
                    </strong>
                    <span>テーマ：{truncateText(dataset.theme || dataset.sampleLabel || "-", 72)}</span>
                    <span>{dataset.count || 0}件 / 保存日時：{formatHistoryDate(dataset.savedAt)}</span>
                    {viewMode === "developer" && <span>datasetId：{dataset.datasetId}</span>}
                  </div>
                  <div className="dataset-summary-actions">
                    <button type="button" className="history-button" onClick={() => loadXDatasetFromHistory(dataset.datasetId)}>
                      読み込む
                    </button>
                    <button
                      type="button"
                      className="history-button danger"
                      onClick={() => deleteXDatasetHistory(dataset.datasetId)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-list">
              {datasetHistory.datasets.map((dataset, index) => (
                <div
                  key={dataset.datasetId}
                  className={dataset.datasetId === activeDatasetId ? "history-card dataset-detail-card active" : "history-card dataset-detail-card"}
                >
                  <div className="history-card-title">
                    {index + 1}. {formatHistoryDate(dataset.savedAt)}
                  </div>
                  <div className="history-meta">
                    <div>
                      サンプル：
                      {`${sampleNoLabel(dataset.sampleKey, dataset.sampleNo)}：${sampleTitle(null, dataset.sampleLabel || dataset.sampleKey || "-")}`}
                    </div>
                    <div>テーマ：{truncateText(dataset.theme || dataset.sampleLabel || "-", 160)}</div>
                    <div>自分の意見：{truncateText(dataset.userOpinion || "-", 160)}</div>
                    <div>選択クエリ候補数：{dataset.selectedQueryCandidateIds?.length || 0}</div>
                    <div>
                      選択クエリ候補：
                      {dataset.selectedQueryCandidateLabels?.length
                        ? dataset.selectedQueryCandidateLabels.join(" / ")
                        : "なし"}
                    </div>
                    <div>実行X検索クエリ：{truncateText(dataset.effectiveQuery || dataset.query || "-", 180)}</div>
                    <div>件数：{dataset.count}件</div>
                    <div>クラスタ結果：{dataset.clusterRuns?.length || 0}件</div>
                    {viewMode === "developer" && <div>datasetId：{dataset.datasetId}</div>}
                  </div>
                  <div className="history-actions">
                    <button type="button" className="history-button" onClick={() => loadXDatasetFromHistory(dataset.datasetId)}>
                      読み込む
                    </button>
                    <button
                      type="button"
                      className="history-button danger"
                      onClick={() => deleteXDatasetHistory(dataset.datasetId)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeDataset && (
          <div className="history-section control-panel cluster-save-panel">
            <h3>クラスタリング履歴</h3>
            {activeDataset.clusterRuns.length === 0 ? (
              <div className="history-empty">このXデータに保存されたクラスタリング結果はありません。</div>
            ) : (
              <div className="cluster-run-list">
                {activeDataset.clusterRuns.map((run, index) => (
                  <div
                    key={run.runId}
                    className={run.runId === activeClusterRunId ? "history-card active" : "history-card"}
                  >
                    <div className="history-card-title">
                      {index + 1}. {formatHistoryDate(run.savedAt)}｜{run.summary}
                    </div>
                    <div className="history-meta">
                      <div>
                        {run.inputCount}件→{run.clusterCount}クラスタ｜圧縮率
                        {Number.isFinite(run.compressionRate) ? run.compressionRate.toFixed(1) : "0.0"}%
                      </div>
                      <div>
                        方式：{run.clusterMethod === "semantic" ? "意味類似" : "文字類似"}｜
                        文字 {Number(run.textThreshold || 0).toFixed(2)}｜
                        意味 {Number(run.semanticThreshold || 0).toFixed(2)}
                      </div>
                      <div>
                        サンプル：
                        {`${sampleNoLabel(run.datasetSampleKey || activeDataset.sampleKey, run.datasetSampleNo)}：${sampleTitle(null, run.datasetSampleLabel || activeDataset.sampleLabel || activeDataset.sampleKey)}`}
                      </div>
                      {viewMode === "developer" && <div>runId：{run.runId}</div>}
                    </div>
                    <div className="history-actions">
                      <button
                        type="button"
                        className="history-button"
                        onClick={() => loadClusterRunFromHistory(activeDataset.datasetId, run.runId)}
                      >
                        結果を読み込む
                      </button>
                      <button
                        type="button"
                        className="history-button danger"
                        onClick={() => deleteClusterRunHistory(activeDataset.datasetId, run.runId)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

          {/* Zone④ クラスタリング */}
          <section className="row card sidebar-control-card zone-card zone-6">
            <h2>Zone④ クラスタリング</h2>
            <div className="status-panel">
              <div><strong>現在の方式：</strong>{viewMode === "user" ? "意味類似 OpenAI" : clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}</div>
              <div><strong>意味クラスタ状態：</strong>{semanticClusterStateLabel()}</div>
              {viewMode === "developer" && <div><strong>現在表示中：</strong>{currentClusterDisplayLabel()}</div>}
              <div><strong>保存済みクラスタ結果：</strong>{activeDataset?.clusterRuns?.length || 0}件</div>
            </div>

            {viewMode === "developer" && (
            <div className="cluster-method-controls">
              <div>クラスタ化方式：</div>
              <div className="cluster-method-buttons">
                <button
                  type="button"
                  className={
                    clusterMethod === "text"
                      ? "option-button option-button-selected cluster-method-button active"
                      : "option-button cluster-method-button"
                  }
                  onClick={() => {
                    setClusterMethod("text");
                    clearActiveClusterRunState();
                  }}
                >
                  文字類似
                </button>
                <button
                  type="button"
                  className={
                    clusterMethod === "semantic"
                      ? "option-button option-button-selected cluster-method-button active"
                      : "option-button cluster-method-button"
                  }
                  onClick={() => {
                    setClusterMethod("semantic");
                    clearActiveClusterRunState();
                  }}
                >
                  意味類似 OpenAI
                </button>
              </div>
            </div>
            )}

            {viewMode === "developer" && (
            <div className="threshold-controls">
              <div>文字類似しきい値：</div>
              <div className="threshold-buttons">
                {CLUSTER_THRESHOLD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      clusterThreshold === option.value
                        ? "option-button option-button-selected threshold-option-button threshold-button active"
                        : "option-button threshold-option-button threshold-button"
                    }
                    onClick={() => {
                      setClusterThreshold(option.value);
                      clearActiveClusterRunState();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            <div className="semantic-cluster-panel">
              {viewMode === "developer" ? (
              <>
              <div>意味類似しきい値：</div>
              <div className="semantic-threshold-buttons">
                {SEMANTIC_THRESHOLD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      semanticThreshold === option.value
                        ? "option-button option-button-selected threshold-option-button semantic-threshold-button active"
                        : "option-button threshold-option-button semantic-threshold-button"
                    }
                    onClick={() => {
                      setSemanticThreshold(option.value);
                      setSemanticClusterRows([]);
                      setSemanticClusterStatus("");
                      setSemanticClusterError("");
                      clearActiveClusterRunState();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              </>
              ) : (
                <div className="cluster-note">似た意見を意味の近さでまとめます。</div>
              )}
              <button
                type="button"
                className={`action-button action-button-primary semantic-run-button ${
                  isSemanticClusterLoading || operationStatus.semanticCluster.status === "running"
                    ? "is-running"
                    : operationStatus.semanticCluster.status === "success" && semanticClusterRows.length > 0
                      ? "is-done"
                      : ""
                }`}
                onClick={handleRunSemanticCluster}
                disabled={
                  !canRunSemanticCluster ||
                  isSemanticClusterLoading ||
                  operationStatus.semanticCluster.status === "running"
                }
              >
                {!canRunSemanticCluster
                  ? "分析対象が少なすぎるため実行不可"
                  : isSemanticClusterLoading || operationStatus.semanticCluster.status === "running"
                  ? "意味クラスタ実行中..."
                  : operationStatus.semanticCluster.status === "success" && semanticClusterRows.length > 0
                    ? "意味クラスタ実行済み"
                    : "意味クラスタを実行"}
              </button>
              {!canRunSemanticCluster && (
                <div className="cluster-note">
                  分析対象が少なすぎるため、意味クラスタを実行できません。先に取得条件を改善してください。
                </div>
              )}
            </div>

            <div className={saveTarget.warning ? "save-target-preview save-target-warning" : "save-target-preview"}>
              <strong>現在の保存対象：</strong>
              <span>{saveTarget.text}</span>
            </div>
          </section>

          {/* Zone⑤ AI要約 */}
          <section className="row card sidebar-control-card zone-card zone-7">
            <h2>Zone⑤ AI要約</h2>
            <div className="auto-summary-controls">
              {AUTO_SUMMARY_LIMIT_OPTIONS.map((limit) => (
                <button
                  key={limit}
                  type="button"
                  className={
                    autoSummaryLimit === limit
                      ? "option-button option-button-selected summary-limit-option-button auto-summary-button active"
                      : "option-button summary-limit-option-button auto-summary-button"
                  }
                  onClick={() => setAutoSummaryLimit(limit)}
                  disabled={isAutoSummarizing}
                >
                  上位{limit}件
                </button>
              ))}
              <button
                type="button"
                className={`action-button action-button-primary summary-run-button auto-summary-button primary ${
                  isAutoSummarizing || operationStatus.autoSummary.status === "running"
                    ? "is-running"
                    : operationStatus.autoSummary.status === "success" || summarizedClusterCount() > 0
                      ? "is-done"
                      : ""
                }`}
                onClick={handleRunAutoSummary}
                disabled={isAutoSummarizing || operationStatus.autoSummary.status === "running"}
              >
                {isAutoSummarizing || operationStatus.autoSummary.status === "running"
                  ? "AI要約中..."
                  : operationStatus.autoSummary.status === "success" || summarizedClusterCount() > 0
                    ? "AI要約済み"
                    : "上位クラスタを一括AI要約"}
              </button>
            </div>
            <div className="status-panel">
              <div><strong>AI要約対象：</strong>上位{autoSummaryLimit}件</div>
              <div><strong>AI要約状態：</strong>{autoSummaryStatus}</div>
              <div><strong>現在の要約元：</strong>{summaryTargetClusterLabel()}</div>
            </div>
            {copyStatus === "success" && (
              <span className="copy-analysis-status success">コピーしました。ChatGPTに貼り付けできます。</span>
            )}
            {copyStatus === "error" && (
              <span className="copy-analysis-status error">コピーに失敗しました。ブラウザの権限を確認してください。</span>
            )}
          </section>

          <button
            type="button"
            className="sidebar-resize-handle"
            aria-label="サイドバー幅を調整"
            title="ドラッグでサイドバー幅を調整"
            onMouseDown={(event) => {
              event.preventDefault();
              setIsSidebarResizing(true);
            }}
          />
        </aside>

        <main className="main-content">
          {/* Zone⑥ 現在のテーマ・自分の意見 */}
          <section className="zone-section zone-input-data card zone-card zone-6">
            <div className="zone-heading">Zone⑥ 現在のテーマ・自分の意見</div>
            <p className="zone-lead">
              今、何について分析しているのかを最初に確認します。
            </p>

            <div className="input-zone-grid">
              <div className="input-zone-panel">
                <h3>サンプル名</h3>
                <p>{sampleDisplayLabel(sampleKey)}</p>
              </div>
              <div className="input-zone-panel">
                <h3>現在のテーマ</h3>
                <p>{theme || "（未入力）"}</p>
              </div>
              <div className="input-zone-panel">
                <h3>自分の意見</h3>
                <p>{userOpinion || "（未入力）"}</p>
              </div>
              <div className="input-zone-panel">
                <h3>現在の分析対象の概要</h3>
                <p>
                  外部意見 {externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}件 /
                  分析対象候補 {result.noiseProcessingResult.candidateCount}件 /
                  表示クラスタ {result.clusterTableRows.length}件
                </p>
              </div>
            </div>

            <div className="axis-summary-panel">
              <h3>評価軸</h3>
              <div className="axis-summary-grid">
                <div>
                  <b>{axisLabels.x}</b>
                  <span>{axisConfig.x.description}</span>
                </div>
                <div>
                  <b>{axisLabels.y}</b>
                  <span>{axisConfig.y.description}</span>
                </div>
                <div>
                  <b>{axisLabels.z}</b>
                  <span>{axisConfig.z.description}</span>
                </div>
              </div>
            </div>

          </section>

          {/* Zone⑪ ユーザーへのフィードバック */}
          <section className={`row row-5 card analysis zone-card zone-11 ${personaMode === "personaA" ? "persona-a-zone11" : ""}`}>
            <h2>Zone⑪ {personaMode === "personaA" ? JP_UI_LABELS.romanceMap : safeRuntimeText(userFeedback.feedbackTitle, viewMode)}</h2>
            <div className="feedback-panel">
              {personaMode === "personaA" && viewMode === "user" ? (
                <div className="persona-a-ux-split">
                  <section className="persona-a-empathy-panel persona-a-empathy-section" aria-label={JP_UI_LABELS.empathy}>
                    <h3 className="persona-a-section-title">{JP_UI_LABELS.empathy}</h3>
                    <div className="persona-feedback-sections">
                      {userFeedback.personaSections.map(([title, body], index) => (
                        <div key={`persona-a-empathy-${index}`} className="feedback-section persona-feedback-section persona-a-empathy-item">
                          <h4>{title}</h4>
                          <p>{safeRuntimeText(body, viewMode)}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="persona-a-analysis-panel persona-a-analysis-section" aria-label={JP_UI_LABELS.analysisMemo}>
                    <h3 className="persona-a-section-title">{JP_UI_LABELS.analysisMemo}</h3>
                    <div className="persona-a-analysis-grid">
                      {personaAAnalysisMemoItems().map(([label, value]) => (
                        <div key={`persona-a-memo-${label}`} className="persona-a-analysis-item">
                          <strong>{label}</strong>
                          <span>{safeRuntimeText(value, viewMode)}</span>
                        </div>
                      ))}
                    </div>
                    {userReferenceGraphWarning && (
                      <p className="persona-a-reference-note">{safeRuntimeText(userReferenceGraphMessage, viewMode)}</p>
                    )}
                    {scoreConcentrationMessages.length > 0 && (
                      <ul className="persona-a-analysis-list">
                        {scoreConcentrationMessages.map((message, index) => (
                          <li key={`persona-a-score-note-${index}`}>{safeRuntimeText(message, viewMode)}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : personaMode !== "dev" && (
                <div className="persona-feedback-sections">
                  {userFeedback.personaSections.map(([title, body], index) => (
                    <div key={`persona-feedback-${index}`} className="feedback-section persona-feedback-section">
                      <h3>{index + 1}. {title}</h3>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              )}
              {!(personaMode === "personaA" && viewMode === "user") && (
              <>
              <div className="feedback-section">
                <h3>1. 今回の意見空間の傾向</h3>
                <p>{userFeedback.overview}</p>
                <p>{userFeedback.noiseSummary}</p>
              </div>
              <div className="feedback-section">
                <h3>ボリュームの読み方</h3>
                <p>
                  3DEでは、RTやコピー投稿による拡散量は、基本的に意見ボリュームとして採用していません。
                  意図的な拡散やキャンペーン投稿に分析が振り回されないよう、グラフのボリュームは独立した類似意見数をもとにしています。
                </p>
                <p>
                  拡散量は参考情報として保持しますが、意見の種類や市場傾向とは区別して扱います。このボリュームは世論調査ではありません。
                  X上の投稿はRT、キャンペーン、ボット、界隈ノリの影響を受けるため、単純な投稿数を世論量として扱うことはできません。
                </p>
              </div>
              <div className="feedback-section">
                <h3>2. 目立った論点</h3>
                <p>
                  近いクラスタと遠いクラスタを見ると、現在の意見群で強く出ている論点と、あなたの意見から離れた論点を確認できます。
                </p>
              </div>
              <div className="feedback-section">
                <h3>3. あなたの意見とのズレ</h3>
                <p>{userFeedback.userPosition}</p>
                <p>{userFeedback.gap}</p>
              </div>
              <div className="feedback-section">
                <h3>4. 評価軸と検索クエリの噛み合い</h3>
                <p>{userFeedback.queryAxisFit}</p>
                <p>
                  取得診断は{queryDiagnosisLabel(stagedFetchState.diagnosisStatus)}です。
                  {stagedFetchState.diagnosis
                    ? ` 最初の${stagedFetchState.diagnosis.fetchedCount}件のうち、分析対象は${stagedFetchState.diagnosis.analysisCandidateCount}件、ノイズ率は${formatPercent(stagedFetchState.diagnosis.noiseRate)}でした。${(stagedFetchState.diagnosis.problemReasons || []).slice(0, 2).join(" ")}`
                    : " X取得後に、30件時点のクエリ品質がここに表示されます。"}
                </p>
                {stagedFetchState.aiQueryAdvice && (
                  <p>
                    取得改善アドバイス: {stagedFetchState.aiQueryAdvice.diagnosisSummary}
                    {stagedFetchState.aiQueryAdvice.recommendedQuery
                      ? ` 推奨クエリは「${stagedFetchState.aiQueryAdvice.recommendedQuery}」です。`
                      : ""}
                  </p>
                )}
                <p>
                  現在{stagedCurrentDataCount}件を保持しています。残り{stagedRemainingCount}件まで追加取得でき、次回は
                  {stagedNextFetchCount}件を取得します。改善クエリ追加は
                  {stagedFetchState.improvedAddFetchCount ?? stagedFetchState.improvedRefetchCount ?? 0}回実行済みです。
                </p>
                <p>
                  取得品質は{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}です。
                  {result.noiseProcessingResult.retrievalKpi.message}
                  コスト効率は{formatScore(result.noiseProcessingResult.retrievalKpi.costEfficiencyScore)}、
                  多様性は{formatScore(result.noiseProcessingResult.retrievalKpi.diversityScore)}です。
                </p>
                {(stagedFetchState.noiseBreakdown || []).length > 0 && (
                  <ul>
                    {stagedFetchState.noiseBreakdown.slice(0, 3).map((item) => (
                      <li key={`feedback-noise-${item.category}`}>
                        {item.label}: {item.count}件 / {item.advice}
                      </li>
                    ))}
                  </ul>
                )}
                {(stagedFetchState.queryTermDiagnosis || []).some((item) => item.status !== "ok") && (
                  <ul>
                    {stagedFetchState.queryTermDiagnosis
                      .filter((item) => item.status !== "ok")
                      .slice(0, 3)
                      .map((item) => (
                        <li key={`feedback-query-term-${item.term}`}>
                          検索語「{item.term}」: {item.advice}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div className="feedback-section">
                <h3>5. スコア分布の注意</h3>
                {scoreConcentrationMessages.length === 0 ? (
                  <p>現在のクラスタでは、X/Y/Zのスコアは大きく集中していません。絶対スコアでも意見空間の差を読み取りやすい状態です。</p>
                ) : (
                  <ul>
                    {scoreConcentrationMessages.map((message, index) => (
                      <li key={`score-concentration-${index}`}>{message}</li>
                    ))}
                  </ul>
                )}
                <p>
                  グラフ表示は{result.resolvedScoreDisplayMode === "relative" ? "相対スコア" : "絶対スコア"}です。
                  {result.resolvedScoreDisplayMode === "relative"
                    ? " 今回の意見群内での相対差を見えるようにしています。"
                    : " 元の評価軸に基づく素点を表示しています。"}
                  採点は評価軸説明との一致度、テーマ関連度、本文の具体性を見て補正し、関連が弱い投稿は低めに扱います。
                </p>
              </div>
              <div className="feedback-grid">
                <div className="feedback-section">
                  <h3>近いクラスタ</h3>
                  {userFeedback.nearClusters.length === 0 ? (
                    <p>クラスタ生成後に表示されます。</p>
                  ) : (
                    <ol>
                      {userFeedback.nearClusters.map((cluster) => (
                        <li key={`near-${cluster.label}`}>
                          {cluster.label} / 距離 {cluster.distance.toFixed(1)} / {truncateText(cluster.title, 70)}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <div className="feedback-section">
                  <h3>遠いクラスタ</h3>
                  {userFeedback.farClusters.length === 0 ? (
                    <p>クラスタ生成後に表示されます。</p>
                  ) : (
                    <ol>
                      {userFeedback.farClusters.map((cluster) => (
                        <li key={`far-${cluster.label}`}>
                          {cluster.label} / 距離 {cluster.distance.toFixed(1)} / {truncateText(cluster.title, 70)}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
              <div className="feedback-section">
                <h3>足りない視点</h3>
                <ul>
                  {userFeedback.missingPerspectives.map((item, index) => (
                    <li key={`missing-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="feedback-section">
                <h3>6. 次に試すべきこと</h3>
                <ol>
                  {userFeedback.nextQuestions.map((question, index) => (
                    <li key={`question-${index}`}>{question}</li>
                  ))}
                </ol>
              </div>
              </>
              )}
            </div>

            <div className="score-cards">
              <div>
                <span>{scoreAxisHeader(axisLabels.x, scoreDisplayMode)}</span>
                <b>{getScoreForDisplay(result.user, "x", scoreDisplayMode)}</b>
                <small>外部平均 {getScoreForDisplay(result.avg, "x", scoreDisplayMode)}</small>
              </div>

              <div>
                <span>{scoreAxisHeader(axisLabels.y, scoreDisplayMode)}</span>
                <b>{getScoreForDisplay(result.user, "y", scoreDisplayMode)}</b>
                <small>外部平均 {getScoreForDisplay(result.avg, "y", scoreDisplayMode)}</small>
              </div>

              <div>
                <span>{scoreAxisHeader(axisLabels.z, scoreDisplayMode)}</span>
                <b>{getScoreForDisplay(result.user, "z", scoreDisplayMode)}</b>
                <small>外部平均 {getScoreForDisplay(result.avg, "z", scoreDisplayMode)}</small>
              </div>
            </div>
          </section>

          {/* Zone⑩ グラフ（3D・2D） */}
          <section className="row row-3 card zone-card zone-10">
            <div className="section-title-row">
              <h2>Zone⑩ グラフ（3D・2D）</h2>

              {viewMode === "developer" && (
              <button
                className={originCentered ? "view-button active" : "view-button"}
                onClick={() => setOriginCentered((previous) => !previous)}
              >
                {originCentered ? "通常表示に戻す" : "原点を中央に持ってきて作図"}
              </button>
              )}
            </div>

            <p className="zone-lead graph-zone-lead">
              グラフは長文を読む場所ではなく、意見空間の構造と距離感を見る場所です。点に触れると要約された情報を確認できます。
            </p>
            <div className="graph-axis-summary">
              <span>{axisLabels.x}</span>
              <span>{axisLabels.y}</span>
              <span>{axisLabels.z}</span>
            </div>
            {userReferenceGraphWarning && (
              <div className="reference-warning graph-reference-warning">
                <strong>参考表示</strong>
                <span>{userReferenceGraphMessage}</span>
                {!PUBLIC_PREVIEW_MODE && (
                  <button type="button" className="mode-assist-button" onClick={() => setViewMode("developer")}>
                    開発者modeで詳細を見る
                  </button>
                )}
              </div>
            )}
            <div className="graph-legend-card">
              <div><strong>赤いひし形</strong><span>あなたの意見です。</span></div>
              <div><strong>青?赤の円</strong><span>外部意見クラスタです。</span></div>
              <div><strong>円の大きさ</strong><span>独立した類似意見の数です。RT数やコピー数ではありません。</span></div>
              <div><strong>円の色</strong><span>独立意見数。青=少ない、赤=多い。</span></div>
              <div><strong>四角</strong><span>分析対象クラスタの平均位置です。</span></div>
            </div>
            <div className="status-panel">
              {viewMode === "user" ? (
                <>
                  このグラフは、取得できた意見の中で似た意見がどこにまとまっているかを見るためのものです。
                  円の大きさと色は今回の分析対象内での相対的な大きさで、市場全体の声量ではありません。
                </>
              ) : (
                <>
              グラフ表示：{result.resolvedScoreDisplayMode === "relative" ? "相対スコア" : "絶対スコア"}。
              {result.resolvedScoreDisplayMode === "relative"
                ? "今回の意見群内での相対差を表示しています。元の絶対スコアはクラスタ一覧で確認できます。"
                : "絶対スコアを表示しています。"}
              採点は評価軸説明との一致度、テーマ関連度、本文の具体性で補正し、ノイズ除去ON時は関連が弱い投稿をクラスタリング前に除外します。
              ボリューム表示：クラスタ点は半透明で、点が大きいほど独立した類似意見数が多く、青は小さいクラスタ、赤は大きいクラスタです。RT・同一コメント・類似テンプレートによる拡散量はグラフの円サイズに加算していません。
                </>
              )}
            </div>
            <div ref={plot3dRef}></div>
          </section>

          <section className="row row-4 card zone-card zone-10">
            <h2>2Dグラフ</h2>
            <div ref={plot2dRef}></div>
          </section>

          {/* Zone⑦ 外部意見 */}
          <section className="zone-section zone-external-opinions card zone-card zone-7">
            <div className="zone-heading">Zone⑦ 外部意見</div>
            <p className="zone-lead">
              X取得後または手入力された、分析元の外部意見を確認します。
            </p>
            <div className="field main-external-opinions">
              <div className="section-title-row compact-title-row">
                <h3>外部意見（1行1意見）</h3>
                <span className="zone-count-badge">
                  {externalOpinions.split("\n").map((value) => value.trim()).filter(Boolean).length}件
                </span>
              </div>
              <textarea
                value={externalOpinions}
                onChange={(event) => {
                  setExternalOpinions(event.target.value);
                  setActiveDatasetId("");
                  setActiveClusterRunId("");
                  setXDataStatus(event.target.value.trim() ? "unsaved" : "sample");
                  setHasScoredWithCurrentAxis(false);
                  setSemanticClusterRows([]);
                  setSemanticClusterStatus("");
                  setSemanticClusterError("");
                  setClusterSummaries({});
                  resetAutoSummaryState();
                  setHistoryStatus("");
                }}
              />
            </div>

            <div className="status-panel">
              <div><strong>取得状態：</strong>{currentXDataStateLabel()}</div>
              <div>
                <strong>{viewMode === "developer" ? "実行されるX検索クエリ：" : "検索条件："}</strong>
                {viewMode === "developer" ? effectiveQuery || "（未入力）" : "アプリが安全な形に整えて送信します"}
              </div>
              <div><strong>X取得ステータス：</strong>{xStatus || "未実行"}</div>
            </div>

            {xPosts.length > 0 && (
              <div className="x-posts-zone-summary">
                <h3>X取得メタデータ</h3>
                <div className="x-posts-summary">
                  取得件数：{xPosts.length}件 / いいね合計：
                  {xPosts.reduce((sum, post) => sum + (post.like_count || 0), 0)} / リポスト合計：
                  {xPosts.reduce((sum, post) => sum + (post.repost_count || 0), 0)} / 返信合計：
                  {xPosts.reduce((sum, post) => sum + (post.reply_count || 0), 0)} / 引用合計：
                  {xPosts.reduce((sum, post) => sum + (post.quote_count || 0), 0)}
                </div>
              </div>
            )}
          </section>

          <section className="zone-section zone-results">
            <div className="zone-heading">中央メインエリア：分析・可視化</div>
            <p className="zone-lead">
              Zone⑧-Zone⑫で、クラスタ化、クラスタ一覧、グラフ、フィードバック、根拠一覧を確認します。
            </p>

      {/* Zone⑧ クラスタ化比較 */}
      <section className="row card noise-summary-card zone-card zone-8">
        <div className="section-title-row">
          <h2>Zone⑧ クラスタ化比較</h2>
        </div>

        {viewMode === "user" ? (
          <div className="user-flow-summary">
            <h3>分析の流れ</h3>
            <div className="user-flow-steps">
              <span>取得 {result.noiseProcessingResult.rawCount}件</span>
              <b>→</b>
              <span>分析に使えた意見 {result.noiseProcessingResult.analysisTargetCount}件</span>
              <b>→</b>
              <span>似た意見のまとまり {result.clusterTableRows.length}件</span>
            </div>
            <p>{result.noiseProcessingResult.retrievalKpi.message}</p>
            {userReferenceGraphWarning && (
              <div className="reference-warning">
                <strong>参考表示</strong>
                <span>{userReferenceGraphMessage}</span>
                {!PUBLIC_PREVIEW_MODE && (
                  <button type="button" className="mode-assist-button" onClick={() => setViewMode("developer")}>
                    開発者modeで詳細を見る
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
        <div className="developer-panel graph-mode-tabs">
          <button type="button" className="developer-panel-button" onClick={() => setViewMode("user")}>
            ユーザーmodeに戻る
          </button>
          <button className={graphMode === "raw" ? "active" : ""} onClick={() => setGraphMode("raw")}>
            処理前
          </button>
          <button
            className={graphMode === "processed" ? "active" : ""}
            onClick={() => setGraphMode("processed")}
          >
            処理後
          </button>
          <button className={graphMode === "compare" ? "active" : ""} onClick={() => setGraphMode("compare")}>
            前後比較
          </button>
        </div>

        <div className="developer-panel status-panel">
          <div><strong>現在採用中のクラスタ方式：</strong>{clusterMethod === "semantic" ? "意味類似 OpenAI" : "文字類似"}</div>
          <div><strong>現在表示中：</strong>{currentClusterDisplayLabel()}</div>
          <div><strong>Zone⑨クラスタ一覧・Zone⑩グラフに反映中：</strong>{currentClusterDisplayLabel()}</div>
          <div><strong>文字類似しきい値：</strong>{result.noiseProcessingResult.threshold.toFixed(2)}</div>
          <div><strong>意味類似しきい値：</strong>{semanticThreshold.toFixed(2)}</div>
          <div><strong>意味クラスタ状態：</strong>{semanticClusterStateLabel()}</div>
          <div><strong>取得診断：</strong>{queryDiagnosisLabel(stagedFetchState.diagnosisStatus)} / {stagedFetchState.message}</div>
        </div>

        <div className={`developer-panel retrieval-kpi-panel ${result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality}`}>
          <div className="retrieval-kpi-header">
            <strong>取得品質KPI：{qualityLabel(result.noiseProcessingResult.retrievalKpi.overallRetrievalQuality)}</strong>
            <span>{result.noiseProcessingResult.retrievalKpi.message}</span>
          </div>
          <div className="retrieval-kpi-grid">
            <div>
              <span>分析対象率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.analysisCandidateRate)}</b>
            </div>
            <div>
              <span>ノイズ率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.noiseRate)}</b>
            </div>
            <div>
              <span>重複/RT率</span>
              <b>{formatPercent(result.noiseProcessingResult.retrievalKpi.duplicateLikeRate)}</b>
            </div>
            <div>
              <span>クラスタ数判定</span>
              <b>{result.noiseProcessingResult.retrievalKpi.clusterJudgement.label}</b>
            </div>
            <div>
              <span>多様性</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.diversityScore)}</b>
            </div>
            <div>
              <span>読みやすさ</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.readLoadScore)}</b>
            </div>
            <div>
              <span>コスト効率</span>
              <b>{formatScore(result.noiseProcessingResult.retrievalKpi.costEfficiencyScore)}</b>
            </div>
            <div>
              <span>境界意見</span>
              <b>{result.noiseProcessingResult.borderlineUsefulCount || 0}</b>
            </div>
          </div>
          <p>{result.noiseProcessingResult.retrievalKpi.clusterJudgement.message}</p>
        </div>

        <div className="developer-panel noise-filter-panel">
          <div className="noise-filter-header">
            <strong>ノイズ除去結果</strong>
            <span className={result.noiseProcessingResult.noiseFilterEnabled ? "status-pill success" : "status-pill muted"}>
              {result.noiseProcessingResult.noiseFilterEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <div className="noise-filter-summary">
            除外 {result.noiseProcessingResult.noiseExcludedCount}件 / 分析対象 {result.noiseProcessingResult.analysisTargetCount}件 / 理由 {result.noiseProcessingResult.noiseReasonSummary}
          </div>
          <div className="noise-reason-list">
            {Object.entries(result.noiseProcessingResult.noiseReasonCounts || {}).length === 0 ? (
              <span>主な除外理由はありません。</span>
            ) : (
              Object.entries(result.noiseProcessingResult.noiseReasonCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <span key={category}>
                    {NOISE_CATEGORY_LABELS[category] || category}: {count}
                  </span>
                ))
            )}
          </div>
          {viewMode === "developer" && result.noiseProcessingResult.noiseExcludedRows.length > 0 && (
            <details className="developer-panel noise-excluded-details">
              <summary>{JP_UI_LABELS.excludedPosts}（{result.noiseProcessingResult.noiseExcludedRows.length}件）</summary>
              <ol className="noise-excluded-list">
                {result.noiseProcessingResult.noiseExcludedRows.slice(0, 30).map((row) => (
                  <li key={`noise-${row.originalNo}`}>
                    <strong>No.{row.originalNo} / {NOISE_CATEGORY_LABELS[row.noiseCategory] || row.noiseCategory}</strong>
                    <span>{row.noiseReason}</span>
                    <p>{truncateText(row.normalizedText, 180)}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {viewMode === "developer" && result.noiseProcessingResult.borderlineUsefulRows.length > 0 && (
            <details className="developer-panel noise-excluded-details">
              <summary>{JP_UI_LABELS.borderlineOpinions}（{result.noiseProcessingResult.borderlineUsefulRows.length}件）</summary>
              <ol className="noise-excluded-list">
                {result.noiseProcessingResult.borderlineUsefulRows.slice(0, 20).map((row) => (
                  <li key={`borderline-${row.originalNo}`}>
                    <strong>No.{row.originalNo} / 境界意見</strong>
                    <span>{row.borderlineReason}</span>
                    <p>{truncateText(row.normalizedText, 180)}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>

        <div className="cluster-comparison-table-wrap">
          <table className="cluster-comparison-table">
            <thead>
              <tr>
                <th>方式</th>
                <th>入力件数</th>
                <th>クラスタ数</th>
                <th>圧縮率</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>文字類似</td>
                <td>{result.noiseProcessingResult.candidateCount}</td>
                <td>
                  {clusterMethod === "text"
                    ? result.noiseProcessingResult.clusterCount
                    : result.textClusterRows.length}
                </td>
                <td>
                  {formatPercent(
                    result.noiseProcessingResult.candidateCount > 0
                      ? 1 -
                        (clusterMethod === "text"
                          ? result.noiseProcessingResult.clusterCount
                          : result.textClusterRows.length) /
                          result.noiseProcessingResult.candidateCount
                      : 0
                  )}
                </td>
                <td>{clusterMethod === "text" ? "現在表示中" : "比較用に再計算済み"}</td>
              </tr>
              <tr>
                <td>意味類似 OpenAI</td>
                <td>{result.noiseProcessingResult.semanticInputCount || "未実行"}</td>
                <td>
                  {result.noiseProcessingResult.semanticClusterCount === null
                    ? "未実行"
                    : result.noiseProcessingResult.semanticClusterCount}
                </td>
                <td>
                  {result.noiseProcessingResult.semanticClusterCompressionRate === null
                    ? "未実行"
                    : formatPercent(result.noiseProcessingResult.semanticClusterCompressionRate)}
                </td>
                <td>{semanticClusterStateLabel()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="noise-summary-grid">
          <div className="noise-metric">
            <span>クラスタ方式</span>
            <b>{clusterMethod === "semantic" ? "意味" : "文字"}</b>
          </div>
          <div className="noise-metric">
            <span>現在のしきい値</span>
            <b>{result.noiseProcessingResult.threshold.toFixed(2)}</b>
          </div>
          <div className="noise-metric">
            <span>処理前意見数</span>
            <b>{result.noiseProcessingResult.rawCount}</b>
          </div>
          <div className="noise-metric">
            <span>正規化後ユニーク本文数</span>
            <b>{result.noiseProcessingResult.uniqueNormalizedCount}</b>
          </div>
          <div className="noise-metric">
            <span>完全重複数</span>
            <b>{result.noiseProcessingResult.duplicateCount}</b>
          </div>
          <div className="noise-metric">
            <span>独立意見数</span>
            <b>{result.noiseProcessingResult.independentOpinionCount}</b>
          </div>
          <div className="noise-metric">
            <span>独立意見率</span>
            <b>{formatPercent(result.noiseProcessingResult.independentOpinionRate || 0)}</b>
          </div>
          <div className="noise-metric">
            <span>拡散参考数</span>
            <b>{result.noiseProcessingResult.spreadReferenceCount}</b>
          </div>
          <div className="noise-metric">
            <span>拡散支配率</span>
            <b>{formatPercent(result.noiseProcessingResult.spreadDominanceRate || 0)}</b>
          </div>
          <div className="noise-metric">
            <span>RT風投稿数</span>
            <b>{result.noiseProcessingResult.retweetLikeCount}</b>
          </div>
          <div className="noise-metric">
            <span>RT本文抽出成功数</span>
            <b>{result.noiseProcessingResult.rtExtractSuccessCount}</b>
          </div>
          <div className="noise-metric">
            <span>URL付き投稿数</span>
            <b>{result.noiseProcessingResult.urlCount}</b>
          </div>
          <div className="noise-metric">
            <span>URL除去後本文あり数</span>
            <b>{result.noiseProcessingResult.urlTextRemainingCount}</b>
          </div>
          <div className="noise-metric">
            <span>短すぎる投稿数</span>
            <b>{result.noiseProcessingResult.tooShortCount}</b>
          </div>
          <div className="noise-metric">
            <span>分析対象候補数</span>
            <b>{result.noiseProcessingResult.candidateCount}</b>
          </div>
          <div className="noise-metric">
            <span>処理後クラスタ数</span>
            <b>{result.noiseProcessingResult.clusterCount}</b>
          </div>
          <div className="noise-metric">
            <span>ノイズ除外ユニーク数</span>
            <b>{result.noiseProcessingResult.noiseExcludedUniqueCount}</b>
          </div>
          <div className="noise-metric">
            <span>分析対象率</span>
            <b>{formatPercent(result.noiseProcessingResult.analysisTargetRate)}</b>
          </div>
          <div className="noise-metric">
            <span>クラスタ圧縮率</span>
            <b>{formatPercent(result.noiseProcessingResult.clusterCompressionRate)}</b>
          </div>
          <div className="noise-metric">
            <span>意味類似しきい値</span>
            <b>{semanticThreshold.toFixed(2)}</b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ実行件数</span>
            <b>{result.noiseProcessingResult.semanticInputCount || "未実行"}</b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ数</span>
            <b>
              {result.noiseProcessingResult.semanticClusterCount === null
                ? "未実行"
                : result.noiseProcessingResult.semanticClusterCount}
            </b>
          </div>
          <div className="noise-metric">
            <span>意味クラスタ圧縮率</span>
            <b>
              {result.noiseProcessingResult.semanticClusterCompressionRate === null
                ? "未実行"
                : formatPercent(result.noiseProcessingResult.semanticClusterCompressionRate)}
            </b>
          </div>
        </div>

        <p className="cluster-note">
          処理後は、RT接頭辞やURLを取り除いて本文を抽出し、完全重複と短すぎる投稿を整理したうえで、本文類似度により代表クラスタ点として表示しています。
        </p>
          </>
        )}

      </section>

      {/* Zone⑨ クラスタ一覧 */}
      <section className="row card cluster-table-card zone-card zone-9">
        <div className="section-title-row">
          <h2>Zone⑨ クラスタ一覧</h2>
        </div>

        {clusterMethod === "semantic" && semanticClusterRows.length === 0 && (
          <div className="cluster-note">意味クラスタは未実行です。現在は文字類似クラスタを表示しています。</div>
        )}

        {result.clusterTableRows.length === 0 ? (
          <div className="cluster-note">クラスタはありません</div>
        ) : viewMode === "user" ? (
          <div className="user-cluster-card-grid">
            {result.clusterTableRows.map((cluster) => {
              const summary = clusterSummaries[clusterSummaryKey(cluster)];
              const volume = clusterVolumeFromRow(cluster);
              const expansionKey = clusterExpansionKey(cluster);
              const isExpanded = Boolean(expandedClusterIds[expansionKey]);
              const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];

              return (
                <article key={`${cluster.label}-user-card`} className="user-cluster-card">
                  <div className="user-cluster-card-header">
                    <strong>{cluster.label}</strong>
                    <span>独立意見数 {volume.independent}</span>
                  </div>
                  <h3>{summary?.title || truncateText(cluster.opinion, 54)}</h3>
                  <p>{summary?.cleanOpinion || summary?.summary || truncateText(cluster.opinion, 140)}</p>
                  <div className="user-cluster-score-row">
                    <span>X {getScoreForDisplay(cluster, "x", scoreDisplayMode)}</span>
                    <span>Y {getScoreForDisplay(cluster, "y", scoreDisplayMode)}</span>
                    <span>Z {getScoreForDisplay(cluster, "z", scoreDisplayMode)}</span>
                  </div>
                  {renderScoreReasonGrid(cluster)}
                  <button
                    type="button"
                    className="option-button cluster-expand-button"
                    onClick={() => toggleClusterMembers(cluster)}
                  >
                    {isExpanded ? "元意見を閉じる" : "元意見を見る"}
                  </button>
                  {isExpanded && (
                    <ol className="cluster-member-list user-cluster-members">
                      {memberRows.slice(0, 6).map((member, index) => (
                        <li key={`${cluster.label}-user-member-${member.id}-${index}`} className="cluster-member-item">
                          <div className="cluster-member-text">{member.text}</div>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <table className="cluster-table">
            <thead>
              <tr>
                <th>クラスタID</th>
                <th>独立意見数</th>
                <th>拡散参考数</th>
                <th>グラフ反映</th>
                <th>表示内容</th>
                <th>元投稿件数</th>
                <th>重複件数</th>
                <th>{scoreAxisHeader(axisLabels.x, scoreDisplayMode)}</th>
                <th>{scoreAxisHeader(axisLabels.y, scoreDisplayMode)}</th>
                <th>{scoreAxisHeader(axisLabels.z, scoreDisplayMode)}</th>
                <th>スコア根拠</th>
                <th>元意見</th>
                <th>AI整理</th>
              </tr>
            </thead>
            <tbody>
              {result.clusterTableRows.map((cluster) => {
                const expansionKey = clusterExpansionKey(cluster);
                const summaryKey = clusterSummaryKey(cluster);
                const isExpanded = Boolean(expandedClusterIds[expansionKey]);
                const memberRows = Array.isArray(cluster.memberRows) ? cluster.memberRows : [];
                const aiSummary = clusterSummaries[summaryKey];
                const isSummaryLoading = Boolean(isClusterSummaryLoadingById[summaryKey]);
                const summaryError = clusterSummaryErrorById[summaryKey];
                const hasDetailPanel = isExpanded || aiSummary || isSummaryLoading || summaryError;
                const volume = clusterVolumeFromRow(cluster);
                const isSelectedCluster = selectedClusterId === cluster.label;

                return [
                  <tr
                    key={`${cluster.label}-row`}
                    id={clusterRowDomId(cluster.label)}
                    className={isSelectedCluster ? "cluster-row selected-cluster-row" : "cluster-row"}
                  >
                    <td>{cluster.label}</td>
                    <td>{volume.independent}</td>
                    <td>{volume.spread}</td>
                    <td>{volume.graph}</td>
                    <td className="cluster-representative-text cluster-summary-cell" title={cluster.opinion}>
                      {aiSummary ? (
                        <>
                          <div className="cluster-summary-title">クラスタ名：{aiSummary.title}</div>
                          <div className="cluster-summary-clean-opinion">整文済み意見：{aiSummary.cleanOpinion}</div>
                          <div className="cluster-summary-short">要約：{aiSummary.summary}</div>
                        </>
                      ) : (
                        <>
                          <div className="cluster-summary-title">未要約</div>
                          <div className="cluster-summary-short">
                            AI要約を実行すると、グラフ上の表示も読みやすくなります。
                          </div>
                          <div className="cluster-summary-clean-opinion">
                            代表本文：{truncateText(cluster.opinion)}
                          </div>
                        </>
                      )}
                    </td>
                    <td>{cluster.originalCount}</td>
                    <td>{cluster.duplicateCount}</td>
                    <td>{getScoreForDisplay(cluster, "x", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(cluster, "y", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(cluster, "z", scoreDisplayMode)}</td>
                    <td>
                      <div className="score-basis-cell">
                        <div>表示X/Y/Z：{getScoreTripletForDisplay(cluster, scoreDisplayMode)}</div>
                        <div>独立意見数：{volume.independent}</div>
                        <div>拡散参考数：{volume.spread}</div>
                        <div>グラフ反映：{volume.graph}</div>
                        {volume.spread > volume.independent && (
                          <div className="spread-volume-warning">
                            注意：拡散参考数は大きいですが、グラフのボリュームには加算していません。同一文面や類似テンプレートの拡散が含まれる可能性があります。
                          </div>
                        )}
                        <div>絶対：{cluster.absoluteScore?.x ?? cluster.x} / {cluster.absoluteScore?.y ?? cluster.y} / {cluster.absoluteScore?.z ?? cluster.z}</div>
                        <div>相対：{cluster.relativeScore?.x ?? cluster.x} / {cluster.relativeScore?.y ?? cluster.y} / {cluster.relativeScore?.z ?? cluster.z}</div>
                        <div>スコア根拠：{scoreBasisLabel(cluster.scoreBasis)}</div>
                        {renderScoreReasonGrid(cluster)}
                        {cluster.relevanceScore !== null && cluster.relevanceScore !== undefined && (
                          <div>関連度：{cluster.relevanceScore} / 信頼度：{cluster.scoreConfidence ?? "-"}</div>
                        )}
                        {Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length > 0 && (
                          <div>警告：{cluster.scoreWarnings.join(" / ")}</div>
                        )}
                        {result.scoreConcentrationDetected && (
                          <div>分布注意：集中軸では絶対値だけでなく、今回の意見群内での相対位置も見てください。</div>
                        )}
                      </div>
                    </td>
                    <td className="cluster-table-actions">
                      <button
                        type="button"
                        className="option-button cluster-expand-button"
                        onClick={() => toggleClusterMembers(cluster)}
                      >
                        {isExpanded ? "元意見を閉じる" : "元意見を表示"}
                      </button>
                    </td>
                    <td className="cluster-table-actions">
                      <button
                        type="button"
                        className="action-button action-button-secondary cluster-ai-summary-button"
                        onClick={() => handleRunClusterSummary(cluster)}
                        disabled={isSummaryLoading}
                      >
                        {isSummaryLoading ? "要約中..." : aiSummary ? "再要約" : "AI要約"}
                      </button>
                    </td>
                  </tr>,
                  hasDetailPanel && (
                    <tr key={`${cluster.label}-detail`} className={isSelectedCluster ? "selected-cluster-detail" : ""}>
                      <td colSpan="12">
                        <div className="cluster-member-panel">
                          {isSummaryLoading && (
                            <div className="cluster-ai-summary-loading">AI要約を実行中...</div>
                          )}
                          {summaryError && (
                            <div className="cluster-ai-summary-error">{summaryError}</div>
                          )}
                          {aiSummary && (
                            <div className="cluster-ai-summary-panel">
                              <div className="cluster-ai-summary-title">AI整理結果</div>
                              <div className="cluster-ai-summary-section">
                                <strong>クラスタ名：</strong>
                                <span>{aiSummary.title}</span>
                              </div>
                              <div className="cluster-ai-summary-section">
                                <strong>要約：</strong>
                                <p>{aiSummary.summary}</p>
                              </div>
                              <div className="cluster-ai-summary-section">
                                <strong>整文済み意見：</strong>
                                <p>{aiSummary.cleanOpinion}</p>
                              </div>
                              {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
                                <div className="cluster-ai-summary-section">
                                  <strong>主要論点：</strong>
                                  <ol className="cluster-ai-summary-keypoints">
                                    {aiSummary.keyPoints.map((point, index) => (
                                      <li key={`${summaryKey}-point-${index}`}>{point}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              {Array.isArray(aiSummary.cautions) && aiSummary.cautions.length > 0 && (
                                <div className="cluster-ai-summary-section">
                                  <strong>注意点：</strong>
                                  <ul className="cluster-ai-summary-keypoints">
                                    {aiSummary.cautions.map((caution, index) => (
                                      <li key={`${summaryKey}-caution-${index}`}>{caution}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="cluster-ai-summary-section">
                                <strong>スコアリング：</strong>
                                <ul className="cluster-ai-summary-keypoints">
                                  <li>対象文：{aiSummary.scoreBasis || cluster.scoreBasis}</li>
                                  <li>独立意見数：{clusterVolumeFromRow(cluster).independent}</li>
                                  <li>拡散参考数：{clusterVolumeFromRow(cluster).spread}</li>
                                  <li>グラフ反映：{clusterVolumeFromRow(cluster).graph}</li>
                                  <li>X/Y/Z：{getScoreTripletForDisplay(cluster, scoreDisplayMode)}</li>
                                  <li>
                                    元スコア：{cluster.originalScore?.x ?? "-"} / {cluster.originalScore?.y ?? "-"} /{" "}
                                    {cluster.originalScore?.z ?? "-"}
                                  </li>
                                  <li>関連度：{cluster.relevanceScore ?? "-"} / 信頼度：{cluster.scoreConfidence ?? "-"}</li>
                                  <li>
                                    警告：
                                    {Array.isArray(cluster.scoreWarnings) && cluster.scoreWarnings.length > 0
                                      ? cluster.scoreWarnings.join(" / ")
                                      : "なし"}
                                  </li>
                                  <li>スコア根拠：{scoreBasisLabel(cluster.scoreBasis)}</li>
                                </ul>
                                {renderScoreReasonGrid(cluster)}
                              </div>
                              <details className="cluster-ai-summary-section cluster-summary-source">
                                <summary>要約元の意見</summary>
                                <ol className="cluster-member-list">
                                  {(aiSummary.sourceItems || memberRows.slice(0, 10)).map((item, index) => (
                                    <li key={`${summaryKey}-source-${item.id}-${index}`} className="cluster-member-item">
                                      <div className="cluster-member-meta">
                                        id: {item.id || "-"} / duplicateCount: {item.duplicateCount || 1}
                                      </div>
                                      <div className="cluster-member-text">{item.text}</div>
                                    </li>
                                  ))}
                                </ol>
                              </details>
                            </div>
                          )}
                          {isExpanded && (
                            <>
                          <div className="cluster-member-title">
                            {cluster.label} の元意見 {memberRows.length}件
                          </div>
                          {memberRows.length === 0 ? (
                            <div className="cluster-note">元意見はありません</div>
                          ) : (
                            <ol className="cluster-member-list">
                              {memberRows.map((member, index) => (
                                <li key={`${cluster.label}-${member.id}-${index}`} className="cluster-member-item">
                                  <div className="cluster-member-meta">
                                    No.{member.no || index + 1} / id: {member.id || "-"} / duplicateCount:{" "}
                                    {member.duplicateCount || 1}
                                  </div>
                                  <div className="cluster-member-text">
                                    {member.text}
                                  </div>
                                  {member.originalText && member.originalText !== member.text && (
                                    <details className="cluster-member-original">
                                      <summary>元本文を表示</summary>
                                      <div>{member.originalText}</div>
                                    </details>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Zone⑫ 意見一覧 */}
      <section className="row row-6 card zone-card zone-12">
        <div className="section-title-row">
          <h2>Zone⑫ 意見一覧</h2>

          <div className="sort-status">
            現在の並び：{sortKey.toUpperCase()}軸 {sortDirection === "desc" ? "降順" : "昇順"}
          </div>
        </div>

        <div className="zone12-filter-tabs" aria-label="Zone12表示フィルタ">
          {ZONE12_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`zone12-filter-button ${zone12Filter === filter.value ? "active" : ""}`}
              onClick={() => setZone12Filter(filter.value)}
            >
              {filter.label}
              <span>{zone12Counts[filter.value]}</span>
            </button>
          ))}
        </div>

        {zone12ZeroAnalysisSummary && (
          <div className="zone12-zero-summary">
            <strong>分析対象が0件です。</strong>
            <span>
              X APIから投稿は返っていますが、ノイズ除去後に残りませんでした。取得本文数:
              {zone12ZeroAnalysisSummary.fetchedCount}件 / ノイズ除外:
              {zone12ZeroAnalysisSummary.noiseRemovedCount}件
            </span>
            <span>
              主な理由: {zone12ZeroAnalysisSummary.reasons.length ? zone12ZeroAnalysisSummary.reasons.join(" / ") : "未分類"}
            </span>
          </div>
        )}

        <div className="zone12-inspection-summary">
          <div>
            <strong>黄色マーカー対象</strong>
            <span>{zone12HighlightTerms.length ? zone12HighlightTerms.join(" / ") : "なし"}</span>
          </div>
          <div>
            <strong>表示</strong>
            <span>ハッシュタグ表示 ON / ノイズ背景 ON</span>
          </div>
          <div>
            <strong>主なノイズ理由</strong>
            <span>{zone12TopNoiseReasons.length ? zone12TopNoiseReasons.join(" / ") : "なし"}</span>
          </div>
        </div>

        <table className="zone12-opinion-table">
          <thead>
            <tr>
              <th>順位</th>
              <th>元番号</th>
              <th>判定</th>
              <th>分類</th>
              <th>
                <button className="sort-button" onClick={() => handleSort("x")}>
                  {scoreAxisHeader(axisLabels.x, scoreDisplayMode)} {sortLabel("x")}
                </button>
              </th>
              <th>
                <button className="sort-button" onClick={() => handleSort("y")}>
                  {scoreAxisHeader(axisLabels.y, scoreDisplayMode)} {sortLabel("y")}
                </button>
              </th>
              <th>
                <button className="sort-button" onClick={() => handleSort("z")}>
                  {scoreAxisHeader(axisLabels.z, scoreDisplayMode)} {sortLabel("z")}
                </button>
              </th>
              <th>意見</th>
            </tr>
          </thead>

          <tbody>
            {zone12FilteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="zone12-empty-cell">表示対象の意見はありません。</td>
              </tr>
            ) : (
              zone12FilteredRows.map((row, index) => {
                const status = zone12StatusForRow(row);
                const hashtags = extractZone12Hashtags(row);
                const matchedTerms = zone12TermHits(row, zone12HighlightTerms);
                const excludeHits = zone12TermHits(row, zone12ExcludeTerms);
                const rowClass = [
                  opinionRowClass(row),
                  `opinion-row-${status.key}`,
                  status.key === "noise" && /広告|PR|宣伝|promotion|ad/i.test(`${row.noiseCategory || ""} ${row.noiseReason || ""}`)
                    ? "opinion-row-ad"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={`${status.key}-${row.originalNo || row.no || index}-${index}`} className={rowClass}>
                    <td>{index + 1}</td>
                    <td>{row.originalNo || row.no || "-"}</td>
                    <td>
                      <span className={`zone12-status-badge ${status.key}`}>{status.label}</span>
                    </td>
                    <td>{row.type}</td>
                    <td>{getScoreForDisplay(row, "x", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(row, "y", scoreDisplayMode)}</td>
                    <td>{getScoreForDisplay(row, "z", scoreDisplayMode)}</td>
                    <td className="opinion zone12-opinion-cell">
                      <div className="zone12-opinion-text">{renderHighlightedZone12Text(row.opinion)}</div>
                      <div className="zone12-row-reason">{JP_UI_LABELS.zone12Reason}: {zone12ReasonForRow(row)}</div>
                      <div className="zone12-chip-row">
                        {hashtags.length > 0 ? (
                          hashtags.map((tag) => (
                            <span key={tag} className="zone12-hashtag-chip">{tag}</span>
                          ))
                        ) : (
                          <span className="zone12-muted-chip">{JP_UI_LABELS.zone12NoHashtag}</span>
                        )}
                        {matchedTerms.map((term) => (
                          <span key={`hit-${term}`} className="zone12-term-chip">{JP_UI_LABELS.zone12MatchedTerm}: {term}</span>
                        ))}
                        {excludeHits.map((term) => (
                          <span key={`exclude-${term}`} className="zone12-exclude-chip">{JP_UI_LABELS.zone12ExcludeHit}: {term}</span>
                        ))}
                      </div>
                      {viewMode === "developer" && (
                        <details className="zone12-developer-details developer-panel">
                          <summary>{JP_UI_LABELS.zone12DeveloperDetails}</summary>
                          <div><strong>relevance score</strong><span>{row.relevanceScore ?? "-"}</span></div>
                          <div><strong>duplicateCount</strong><span>{row.duplicateCount ?? 1}</span></div>
                          <div><strong>strict relevance</strong><span>{row.personaARelevanceCategory || row.personaAExclusionReason || "-"}</span></div>
                          <div><strong>noise category</strong><span>{row.noiseCategory ? (NOISE_CATEGORY_LABELS[row.noiseCategory] || row.noiseCategory) : "-"}</span></div>
                          <div><strong>matched include terms</strong><span>{matchedTerms.length ? matchedTerms.join(" / ") : "なし"}</span></div>
                          <div><strong>matched hashtags</strong><span>{hashtags.length ? hashtags.join(" / ") : "なし"}</span></div>
                          <div><strong>matched exclude terms</strong><span>{excludeHits.length ? excludeHits.join(" / ") : "なし"}</span></div>
                          <div><strong>normalized text</strong><span>{safeRuntimeText(row.normalizedText || row.processedText || row.opinion || "", viewMode)}</span></div>
                          <div><strong>raw text</strong><span>{safeRuntimeText(row.rawNormalizedText || row.rawText || row.opinion || "", viewMode)}</span></div>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
          </section>
        </main>
      </div>
    </div>
  );
}


