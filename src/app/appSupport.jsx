import { createSamples } from "../data/sampleData.js";
import {
  DEFAULT_PERSONA_A_VOICE_DIRECTIONS,
  JP_UI_LABELS,
  VOICE_DIRECTION_KEY_ALIASES,
  VOICE_DIRECTION_OPTIONS,
  ZONE12_FILTERS,
} from "../data/uiLabels.js";
import {
  AUTO_SUMMARY_LIMIT_OPTIONS,
  AXIS_PRESETS,
  CLUSTER_THRESHOLD_OPTIONS,
  DEFAULT_X_QUERY_FILTERS,
  PERSONA_CONFIGS,
  SEMANTIC_THRESHOLD_OPTIONS,
} from "../data/userModeConfig.js";
import {
  PERSONA_A_EXCLUDE_TERMS,
  PERSONA_A_HASHTAG_CANDIDATES,
  PERSONA_A_QUERY_TERMS_BY_DIRECTION,
  THEME_EXCLUDE_TERM_LIBRARY,
  THEME_HASHTAG_LIBRARY,
} from "../data/queryCandidateConfig.js";
import { createOpinionClassification } from "../classification/createOpinionClassification.js";
import { createNoiseProcessingModel } from "../classification/noiseProcessing.js";
import { createScoringModel } from "../scoring/scoringModel.js";
// Section: App setup and environment configuration
export const APP_VERSION = "3DE MVP v4.00 Patch: Zone3 Controls / Diagnostics";
export const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_3DE_API_BASE || "http://localhost:3001"
  : "";
export const PUBLIC_PREVIEW_MODE = String(import.meta.env.VITE_PUBLIC_PREVIEW || "").toLowerCase() === "true";
export const LOCAL_PUBLISH_AVAILABLE = import.meta.env.DEV;
export const USER_INPUT_SAMPLE_KEY = "userInput";
export const USER_INPUT_SAMPLE_LABEL = "ユーザー入力";
export const PUBLIC_PREVIEW_MAX_X_FETCH = 200;
export const DEFAULT_MAX_X_FETCH = 1000;

// Section: Storage keys and layout sizing defaults
export const X_DATASET_HISTORY_STORAGE_KEY = "3de_x_dataset_history_v1";
export const SIDEBAR_WIDTH_STORAGE_KEY = "3de_sidebar_width_v2";
export const DASHBOARD_HEIGHT_STORAGE_KEY = "3de_dashboard_height_v1";
export const DASHBOARD_LEFT_WIDTH_STORAGE_KEY = "3de_dashboard_left_width_v1";
export const DASHBOARD_STATUS_HEIGHT_STORAGE_KEY = "3de_dashboard_status_height_v1";
export const DASHBOARD_ACTION_HEIGHT_STORAGE_KEY = "3de_dashboard_action_height_v1";
export const VIEW_MODE_STORAGE_KEY = "3de_view_mode";
export const MAX_X_DATASET_HISTORY = 10;
export const MAX_CLUSTER_RUN_HISTORY = 10;
export const SIDEBAR_MIN_WIDTH = 360;
export const SIDEBAR_DEFAULT_WIDTH = 380;
export const SIDEBAR_MAX_VIEWPORT_RATIO = 0.45;
export const DASHBOARD_MIN_HEIGHT = 180;
export const DASHBOARD_DEFAULT_HEIGHT = 240;
export const DASHBOARD_MAX_VIEWPORT_RATIO = 0.45;
export const DASHBOARD_LEFT_MIN_WIDTH = 260;
export const DASHBOARD_LEFT_DEFAULT_WIDTH = 310;
export const DASHBOARD_LEFT_MAX_VIEWPORT_RATIO = 0.45;
export const DASHBOARD_STATUS_MIN_HEIGHT = 44;
export const DASHBOARD_STATUS_DEFAULT_HEIGHT = 64;
export const DASHBOARD_ACTION_MIN_HEIGHT = 54;
export const DASHBOARD_ACTION_DEFAULT_HEIGHT = 66;

// Section: Shared display constants and labels
export const VOLUME_COLOR_SCALE = [
  [0, "#2563eb"],
  [0.5, "#f59e0b"],
  [1, "#dc2626"],
];
export const NOISE_RELEVANCE_THRESHOLD = 5;
export const GENERIC_QUERY_TERMS = ["成長", "変化", "意見", "深い", "視座", "構造", "制度", "感情", "不安"];
export const HASHTAG_NOISE_MARKERS = ["PR", "URL", "無料", "一括査定", "不動産投資", "勧誘", "キャンペーン", "登録"];
export const UNSAFE_EXCLUDE_TERM_PATTERN = /^(lang|is|has|url|min_likes|min_reposts|min_retweets)$/i;
export const PERSONA_A_BROAD_QUERY_TERMS = [
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
export const NOISE_CATEGORY_LABELS = {
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
export const STAGED_FETCH_INITIAL_COUNT = 30;
export const DEFAULT_ADD_FETCH_COUNT = 30;
export const MIN_ADD_FETCH_COUNT = 20;
export const MAX_USER_AUTO_FETCH_ROUNDS = 5;
export const MAX_SAFE_QUERY_LENGTH = 450;
export const MAX_NO_NEW_UNIQUE_RETRIES = 2;
export const MAX_API_ZERO_RETRIES = 2;
export const STAGED_FETCH_DEFAULT_STAGES = [30, 60, 100];
export const QUERY_LABELS_JA = {
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
export const QUERY_LABEL_DESCRIPTIONS_JA = {
  rawQuery: "AIまたはユーザー入力から作られた最初の検索文です。",
  safeQuery: "X APIに送る前に、危険な記号や重複条件を整理した検索文です。",
  fallbackQuery: "通常の検索文で失敗した時に使う代替検索文です。",
  finalQueryForXApi: "実際にX APIへ送った最終版の検索文です。",
};


// Section: Resizable layout helpers
export function sidebarMaxWidth() {
  if (typeof window === "undefined") {
    return 640;
  }

  return Math.max(SIDEBAR_MIN_WIDTH, Math.floor(window.innerWidth * SIDEBAR_MAX_VIEWPORT_RATIO));
}

export function clampSidebarWidth(width) {
  return Math.min(sidebarMaxWidth(), Math.max(SIDEBAR_MIN_WIDTH, width));
}

export function dashboardMaxHeight() {
  if (typeof window === "undefined") {
    return 420;
  }

  return Math.max(DASHBOARD_MIN_HEIGHT, Math.floor(window.innerHeight * DASHBOARD_MAX_VIEWPORT_RATIO));
}

export function clampDashboardHeight(height) {
  return Math.min(dashboardMaxHeight(), Math.max(DASHBOARD_MIN_HEIGHT, height));
}

export function dashboardLeftMaxWidth() {
  if (typeof window === "undefined") {
    return 520;
  }

  return Math.max(DASHBOARD_LEFT_MIN_WIDTH, Math.floor(window.innerWidth * DASHBOARD_LEFT_MAX_VIEWPORT_RATIO));
}

export function clampDashboardLeftWidth(width) {
  return Math.min(dashboardLeftMaxWidth(), Math.max(DASHBOARD_LEFT_MIN_WIDTH, width));
}

export function dashboardSectionMaxHeight() {
  if (typeof window === "undefined") {
    return 220;
  }

  return Math.max(120, Math.floor(window.innerHeight * 0.28));
}

export function clampDashboardSectionHeight(height, minHeight) {
  return Math.min(dashboardSectionMaxHeight(), Math.max(minHeight, height));
}

// Section: Analysis purpose configuration helpers
export const ANALYSIS_PURPOSE_CONFIGS = {
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

export function defaultAnalysisPurposeForPersona(mode) {
  return mode === "personaA" ? "empathy" : "position";
}

export function normalizeAnalysisPurposeMode(value, personaMode = "dev") {
  return ANALYSIS_PURPOSE_CONFIGS[value] ? value : defaultAnalysisPurposeForPersona(personaMode);
}

export function analysisPurposeConfigFor(value, personaMode = "dev") {
  return ANALYSIS_PURPOSE_CONFIGS[normalizeAnalysisPurposeMode(value, personaMode)];
}

export function purposeVoiceDirections(value, personaMode = "dev") {
  return analysisPurposeConfigFor(value, personaMode).voiceDirections;
}

export function purposeQueryTerms(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).queryTerms || []).filter((term) => !looksLikeMojibake(term));
}

export function purposeHashtags(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).hashtags || []).filter((tag) => sanitizeHashtag(tag));
}

export function purposeCautionHashtags(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).cautionHashtags || []).filter((tag) => sanitizeHashtag(tag));
}

export function purposeExcludeTerms(value, personaMode = "dev") {
  return uniqueByValue(analysisPurposeConfigFor(value, personaMode).excludeTerms || []).filter((term) => !looksLikeMojibake(term));
}

export function purposeDisabledQueryTerms(value, personaMode = "dev") {
  return uniqueByValue([
    ...PERSONA_A_BROAD_QUERY_TERMS,
    ...(analysisPurposeConfigFor(value, personaMode).disabledQueryTerms || []),
  ]).filter((term) => !looksLikeMojibake(term));
}

// Section: Operation status helpers
export const EMPTY_OPERATION_STATUS = {
  status: "idle",
  message: "",
  lastRunAt: "",
  lastSuccessAt: "",
  lastErrorAt: "",
  lastErrorMessage: "",
  lastTargetSummary: "",
};

export const OPERATION_KEYS = [
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

export function createInitialOperationStatus() {
  return Object.fromEntries(OPERATION_KEYS.map((key) => [key, { ...EMPTY_OPERATION_STATUS }]));
}

export function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      setTimeout(resolve, 0);
      return;
    }

    window.requestAnimationFrame(() => window.setTimeout(resolve, 0));
  });
}

// Section: Query text sanitizing and X query builders
export function splitWords(value) {
  return String(value || "")
    .split(/[\s,、]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function uniqueByValue(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean)));
}

export function sanitizeHashtagDetail(value) {
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

export function sanitizeHashtag(value) {
  return sanitizeHashtagDetail(value).value;
}

export function sanitizeExcludeTermDetail(value) {
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

export function sanitizeExcludeTerm(value) {
  return sanitizeExcludeTermDetail(value).values;
}

export function normalizeHashtag(value) {
  return sanitizeHashtag(value);
}

export function selectedHashtagsBase(hashtags) {
  return uniqueByValue((Array.isArray(hashtags) ? hashtags : []).map(sanitizeHashtag)).join(" OR ");
}

export function appendHashtagsToBase(base, hashtags) {
  const cleanBase = stripXCommonFilters(base);
  const hashtagBase = selectedHashtagsBase(hashtags);
  if (cleanBase && hashtagBase) return `(${cleanBase}) OR (${hashtagBase})`;
  return cleanBase || hashtagBase;
}

export function mergeExcludeWords(filters, excludeTerms) {
  const excludeWords = uniqueByValue(
    [...splitWords(filters?.excludeWords), ...(Array.isArray(excludeTerms) ? excludeTerms : [])].flatMap(sanitizeExcludeTerm)
  ).join(" ");
  return { ...(filters || DEFAULT_X_QUERY_FILTERS), excludeWords };
}

export function buildXQueryWithHashtags(base, filters = DEFAULT_X_QUERY_FILTERS, hashtags = [], excludeTerms = []) {
  return buildXQuery(appendHashtagsToBase(base, hashtags), mergeExcludeWords(filters, excludeTerms));
}

export function buildXQuery(base, filters = DEFAULT_X_QUERY_FILTERS) {
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

export function stripXCommonFilters(query) {
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

export function sanitizeXQueryTerm(value) {
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

export function sanitizeXQueryPhrase(value) {
  const phrase = sanitizeXQueryTerm(value);
  if (looksLikeMojibake(phrase)) return "";
  if (!phrase || phrase === "-" || /^#?$/.test(phrase)) return "";
  if (/^(AND|OR)$/i.test(phrase)) return "";
  return phrase.length > 40 ? phrase.slice(0, 40).trim() : phrase;
}

export function queryToSafeIncludeGroups(query) {
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

export function isPersonaARomanceQuery(options = {}) {
  return (
    options.personaMode === "personaA" &&
    getThemeCategory(options.sampleKey || "", options.theme || "", options.userOpinion || "") === "romance"
  );
}

export function buildPurposeFallbackIncludeGroups(options = {}) {
  if (!isPersonaARomanceQuery(options)) {
    return [];
  }

  const mode = normalizeAnalysisPurposeMode(options.analysisPurposeMode, options.personaMode);
  return purposeQueryTerms(mode, options.personaMode)
    .slice(0, 8)
    .map((term) => [term]);
}

export function refineIncludeGroupsForPurpose(rawGroups, options = {}) {
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

export function buildPurposeFinalQueryWarnings(finalQuery, options = {}) {
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

export function buildSafeXQuery({
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

export function cleanupFinalXQuerySyntax(query) {
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

export function sanitizeFinalQueryForXApi(query, maxLength = MAX_SAFE_QUERY_LENGTH) {
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

export function buildFallbackSafeQuery({ sampleKey, theme, userOpinion, hashtags = [], excludeTerms = [] } = {}) {
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

export function buildSafeXQueryFromRaw(rawQuery, options = {}) {
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

export function queryBaseLooksGenericOnly(base) {
  const terms = String(base || "")
    .split(/\s+OR\s+|\s+|\(|\)|\u3000/gi)
    .map((term) => term.trim())
    .filter(Boolean);

  return terms.length > 0 && terms.every((term) => GENERIC_QUERY_TERMS.includes(term));
}

export function bindGenericQueryToTheme(base, theme, userOpinion) {
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

const SOURCE_QUERY_DEFAULT_EXCLUDE_TERMS = ["PR", "広告", "キャンペーン", "無料", "登録", "販売", "購入", "レビュー", "プレゼント", "プロモーション"];
const SOURCE_QUERY_DEFAULT_EXCLUDE_HASHTAGS = ["#PR", "#広告", "#キャンペーン", "#プレゼント企画"];
const SOURCE_QUERY_STANDALONE_BLOCK_TERMS = ["螟ｱ遉ｼ"];

function sourceQueryTermsFromText(value) {
  return uniqueByValue(
    String(value || "")
      .replace(/\b(AND|OR)\b/gi, " ")
      .replace(/[#\-]/g, " ")
      .split(/[\s\u3000、,，。()（）「」『』"“”'`・/|]+/)
      .map((term) => sanitizeXQueryPhrase(term))
      .filter((term) => term.length >= 2)
      .filter((term) => !GENERIC_QUERY_TERMS.includes(term))
      .filter((term) => !SOURCE_QUERY_STANDALONE_BLOCK_TERMS.includes(term))
      .filter((term) => !SOURCE_QUERY_DEFAULT_EXCLUDE_TERMS.includes(term))
  );
}

function buildSourceMustOrQueryBase(queries) {
  const terms = uniqueByValue((Array.isArray(queries) ? queries : []).flatMap(sourceQueryTermsFromText));
  if (terms.length === 0) {
    return "";
  }

  const mustTerm = terms.find((term) => term === "閠∝ｮｳ" || term.includes("閠∝ｮｳ")) || terms[0];
  const normalizedMustTerm = mustTerm.includes("閠∝ｮｳ") ? "閠∝ｮｳ" : mustTerm;
  const orTerms = terms
    .filter((term) => term !== mustTerm && term !== normalizedMustTerm)
    .filter((term) => !SOURCE_QUERY_STANDALONE_BLOCK_TERMS.includes(term))
    .slice(0, 10);

  if (normalizedMustTerm && orTerms.length > 0) {
    return `${normalizedMustTerm} (${orTerms.join(" OR ")})`;
  }
  return normalizedMustTerm || orTerms.join(" OR ");
}

export function buildCombinedXQuery(candidates, selectedIds, filters, manualQuery, hashtags = [], excludeTerms = []) {
  if (!selectedIds.length) {
    const cleanManualQuery = stripXCommonFilters(manualQuery);
    return buildXQueryWithHashtags(buildSourceMustOrQueryBase([cleanManualQuery]) || cleanManualQuery, filters, hashtags, excludeTerms);
  }

  const selectedSet = new Set(selectedIds);
  const selectedQueries = candidates
    .filter((candidate) => selectedSet.has(candidate.label))
    .map((candidate) => stripXCommonFilters(candidate.base || candidate.query || ""))
    .filter(Boolean);
  const combinedBase = buildSourceMustOrQueryBase(selectedQueries);

  return buildXQueryWithHashtags(combinedBase, filters, hashtags, excludeTerms);
}

// Section: Sample data and theme defaults
export const samples = createSamples(buildXQuery);

export function stripAxisPrefix(label) {
  return String(label || "").replace(/^[XYZ]\s*[:：]\s*/i, "").trim();
}

export function createThemeAxisConfig(sample) {
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

export function getThemeCategory(sampleKey, theme, userOpinion) {
  const contentTopic = inferTopicKey("", theme, userOpinion);
  return contentTopic !== "general" ? contentTopic : inferTopicKey(sampleKey, theme, userOpinion);
}

export function sampleForThemeCategory(themeCategory, fallbackSample = samples.housing) {
  return samples[themeCategory] || fallbackSample || null;
}

export function getThemeAxisPreset(theme, themeCategory, fallbackSample = samples.housing) {
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

export function normalizeAxisConfig(config, sample = samples.housing) {
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

export function axisConfigFromPreset(presetKey, sample) {
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

export function axisLabel(axis, config) {
  return `${axis.toUpperCase()}：${config?.[axis]?.label || ""}`;
}

export function axisPresetLabel(config) {
  return AXIS_PRESETS[config?.presetKey]?.label || PERSONA_CONFIGS[config?.presetKey]?.shortLabel || "カスタム";
}

export function sampleTitle(sample, fallback = "") {
  return String(sample?.sampleLabel || sample?.label || fallback)
    .replace(/^サンプル\d+\s*[:：]\s*/, "")
    .trim();
}

export function sampleNoForKey(key) {
  return samples[key]?.sampleNo || null;
}

export function sampleNoLabel(key, fallbackNo = null) {
  const no = fallbackNo || sampleNoForKey(key);
  if (key === USER_INPUT_SAMPLE_KEY) return "サンプルなし";
  return no ? `サンプル${no}` : "No未設定";
}

export function sampleDisplayLabel(key, fallbackLabel = "") {
  const sample = samples[key];
  if (!sample) {
    return fallbackLabel || USER_INPUT_SAMPLE_LABEL;
  }
  const title = sampleTitle(sample, fallbackLabel || key);
  const no = sample?.sampleNo;

  return no ? `サンプル${no}：${title}` : title;
}

export function datasetSampleNo(dataset) {
  return dataset?.sampleNo || sampleNoForKey(dataset?.sampleKey) || null;
}

export function autoResizeTextarea(textarea) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function uniqueValues(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

export function generateAxisLinkedKeywords(axisConfig) {
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

export function buildQueryWithAxisKeywords(baseQuery, keywords, filters) {
  const selectedKeywords = uniqueValues(keywords);

  if (selectedKeywords.length === 0) {
    return baseQuery;
  }

  const cleanBase = stripXCommonFilters(baseQuery);
  const axisQuery = selectedKeywords.join(" OR ");
  const combinedBase = cleanBase ? `(${cleanBase}) OR (${axisQuery})` : axisQuery;

  return buildXQuery(combinedBase, filters);
}

export function buildQueryAxisWarnings(axisConfig, axisLinkedKeywords, effectiveQuery, analysisMode) {
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

export function clamp(value, min = 1, max = 10) {
  return Math.max(min, Math.min(max, value));
}

export function stableNoise(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return (Math.abs(hash) % 301) / 100 - 1.5;
}

export function inferTopicKey(sampleKey, theme, userOpinion) {
  const text = `${sampleKey} ${theme} ${userOpinion}`;
  if (/民主主義|政治|選挙|投票|SNS|民意/.test(text)) return "democracy";
  if (/住宅|家賃|ローン|中古|空き家|リノベ|不動産/.test(text)) return "housing";
  if (/学校|宿題|授業|教育|教員|教師|生徒|学生|校則|学力|入試|受験/.test(text)) return "education";
  if (/プログラミング|コード|Python|学習|教室|エラー|初心者/.test(text)) return "coding";
  if (/宗教|信仰|仏教|神|祈り|救い/.test(text)) return "religion";
  if (/恋愛|婚活|結婚|マッチング|男女/.test(text)) return "romance";
  return sampleKey && samples[sampleKey] ? sampleKey : "general";
}

export function buildHashtagCandidates(sampleKey, theme, userOpinion, aiAdvice = null, personaMode = "dev", analysisPurposeMode = "position") {
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
  const defaultExcludedTags = SOURCE_QUERY_DEFAULT_EXCLUDE_HASHTAGS.map((tag) => [
    tag.replace(/^#/, ""),
    tag,
    "宣伝・懸賞・広告系のノイズを避けるため、初期状態では除外候補として扱います。",
    "高",
    "disabled",
  ]);

  const seen = new Set();
  return [...purposeCandidates, ...libraryCandidates, ...aiCandidates, ...fallbackKeywords, ...defaultExcludedTags]
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

export function buildExcludeTermCandidates(sampleKey, theme, userOpinion, noiseBreakdown = [], personaMode = "dev", analysisPurposeMode = "position") {
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

  return uniqueByValue([...SOURCE_QUERY_DEFAULT_EXCLUDE_TERMS, ...purposeTerms, ...baseTerms, ...personaAExcludeTerms, ...noiseTerms])
    .filter((term) => !looksLikeMojibake(term))
    .slice(0, 24)
    .map((term) => ({
      label: term,
      term,
      reason: "ハッシュタグ検索時の宣伝・別文脈ノイズを減らします。",
    }));
}

export const {
  axisScoreOnly,
  wordsInText,
  scoreMeta,
  scoreLevelLabel,
  axisExplanationItems,
  reasonKeywordsForAxis,
  buildScoreReasonForAxis,
  buildScoreReasons,
  ensureScoreReasons,
  calibrateScoreByRelevance,
  withScoreMeta,
  fallbackScore,
  addKeywordScore,
  axisKeywords,
  scoreByAxisKeywords,
  fallbackCustomAxisScore,
  fallbackReligionScore,
  fallbackDemocracyScore,
  fallbackRomanceScore,
  fallbackGeneralScore,
  fallbackCodingScore,
  scoreOpinion,
  scoreFromRow,
  calculateAxisDistribution,
  calculateScoreDistribution,
  normalizeRelativeScores,
  hasConcentratedScoreDistribution,
  selectDisplayScoreMode,
  applyDisplayScores,
  getScoreForDisplay,
  getScoreTripletForDisplay,
  firstPositiveNumber,
  clusterVolumeFromRow,
  withClusterVolume,
  clusterVolumeDomain,
  normalizeClusterVolume,
  markerSizeForVolume,
  scoreDisplayModeLabel,
  scoreAxisHeader,
} = createScoringModel({
  samples,
  normalizeOpinionText,
  uniqueValues,
  clamp,
  stableNoise,
});

export function buildAxisQualityWarnings(axisConfig) {
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

export function inferLowAxisDescription(highDescription, axisLabelText = "") {
  const high = String(highDescription || "").trim();
  const label = String(axisLabelText || "").trim();
  if (!high && !label) {
    return "";
  }

  return `${label || "この観点"}が弱い、または反対方向の価値観を重視する意見ほど低い。`;
}

export const EMPTY_AXIS_LOW_DESCRIPTION_AUTO_GENERATED = { x: false, y: false, z: false };

// Section: Small inline display components and runtime text safety
export function QueryReviewChips({ values, emptyLabel = "なし", className = "" }) {
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

export function normalizeOpinionText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeMojibake(text) {
  const mojibakePattern = new RegExp(
    [
      "\\u90b5\\uff7a",
      "\\u90e2\\u30fb",
      "\\u965d\\u30fb",
      "\\u964b\\uff7b",
      "\\u96ce\\u30fb",
      "\\u96b0\\uff68",
      "\\u9af4\\u30fb",
      "\\u965e\\uff62",
      "\\u96b4\\u30fb",
      "\\u9677\\uff7f",
      "\\u9a55\\u30fb",
      "\\u90e2\\uff67",
      "\\u9aeb\\u30fb",
      "\\u95d4\\uff68",
      "\\u9b28\\uff7e",
      "\\u96b2\\uff71",
      "\\u9a3e\\uff76",
      "\\u9aeb\\uff72",
      "\\u95d5\\uff73",
      "\\u8b8e\\u30fb",
      "\\u7e3a",
      "\\u7e5d",
      "\\u873f",
      "\\u8af1",
      "\\u8b5a",
      "\\u87a2",
      "\\u9695",
      "\\ufffd",
      "\\u30fb\\uff6e",
      "\\u30fb\\uff7d",
    ].join("|")
  );
  return mojibakePattern.test(String(text || ""));
}

export function safeRuntimeText(value, mode = "user") {
  const text = String(value || "");
  if (!looksLikeMojibake(text)) return text;
  return mode === "developer" ? "文字化け検出: 文字化けの可能性があるため非表示" : "文字化けの可能性があるため非表示";
}

export function gateAnalysisMarkdown(markdown, mode = "user") {
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

export function hideMojibakeQuery(value) {
  const text = String(value || "");
  return looksLikeMojibake(text) ? "文字化けのため非表示" : text;
}

export function migrateStageLogFromMojibake(stage = {}) {
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

// Section: Saved state migration helpers
export function migrateAppStateFromMojibake(state = {}) {
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
          : getThemeQueryCandidates(dataset.theme || "", themeCategory, samples[dataset.sampleKey] || null);

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

export function stripRtPrefix(text) {
  return normalizeOpinionText(text).replace(/^rt\s+@[A-Za-z0-9_]+:?\s*/i, "").trim();
}

// Section: Noise filtering and relevance classification
export const {
  stripUrls,
  hasUrl,
  isRetweetLike,
  isTooShortOpinion,
  includesAnyKeyword,
  detectNoiseCategory,
} = createOpinionClassification({
  normalizeOpinionText,
  genericQueryTerms: GENERIC_QUERY_TERMS,
});

export const {
  personaAAllowsSpecialTopic,
  isPersonaAUsableOpinion,
  applyPersonaAStrictRelevance,
  buildNoiseReasonCounts,
  formatNoiseReasonCounts,
  createInitialStagedFetchState,
  detectGenericKeywordWarnings,
  splitQueryTerms,
  diagnoseQueryTerms,
  noiseCategoryAdvice,
  buildNoiseBreakdown,
  buildCombinedNoiseReasonCounts,
  buildRecommendedNextActions,
  diagnoseQueryQuality,
  buildImprovedQueryCandidates,
  buildRuleBasedQueryAdvice,
  buildImprovementComparison,
  queryDiagnosisLabel,
  stagedFetchActionLabel,
  normalizeQueryForComparison,
  queriesAreEquivalent,
  mergePostsByText,
  postsFromTexts,
  postsFromExternalOpinions,
  attachFetchMetaToPosts,
  calculateNextAddFetchCount,
  queryKindLabel,
  textsFromPosts,
  stopReasonLabel,
  queryBuildStatusLabel,
  makeRetryQueryFromSafeInfo,
  makeStageLogEntry,
  makeBigrams,
  jaccardSimilarity,
  normalizeSpreadTemplateText,
  personaConfigFor,
  personaAxisConfig,
  personaQueryBaseText,
  buildPersonaQueryCandidates,
  normalizeThemeQueryCandidate,
  getThemeQueryCandidates,
  voiceDirectionLabel,
  normalizeVoiceDirections,
  personaAQueryTermsForDirections,
  getPersonaAQueryCandidates,
  getThemeHashtagCandidates,
  applyPersonaUxLens,
  personaHashtagCandidates,
  personaExcludeTermCandidates,
  spreadTemplateTokens,
  looksLikeSpreadTemplate,
  detectSpreadTemplateCategory,
  isSimilarSpreadTemplate,
  buildNoiseProcessingResult,
  clusterOpinionsByText,
  makeClusterRepresentative,
  formatPercent,
  formatScore,
  clusterCountJudgement,
  qualityLabel,
  retrievalKpiMessage,
  buildRetrievalKpi,
} = createNoiseProcessingModel({
  DEFAULT_ADD_FETCH_COUNT,
  DEFAULT_PERSONA_A_VOICE_DIRECTIONS,
  GENERIC_QUERY_TERMS,
  JP_UI_LABELS,
  MIN_ADD_FETCH_COUNT,
  NOISE_CATEGORY_LABELS,
  NOISE_RELEVANCE_THRESHOLD,
  PERSONA_A_QUERY_TERMS_BY_DIRECTION,
  PERSONA_CONFIGS,
  STAGED_FETCH_INITIAL_COUNT,
  THEME_HASHTAG_LIBRARY,
  VOICE_DIRECTION_KEY_ALIASES,
  VOICE_DIRECTION_OPTIONS,
  analysisPurposeConfigFor,
  buildSafeXQuery,
  calculateScoreDistribution,
  clamp,
  createThemeAxisConfig,
  detectNoiseCategory,
  extractFallbackKeywords,
  hasUrl,
  includesAnyKeyword,
  isRetweetLike,
  isTooShortOpinion,
  normalizeHashtag,
  normalizeOpinionText,
  queryToSafeIncludeGroups,
  samples,
  scoreOpinion,
  stripRtPrefix,
  stripUrls,
  stripXCommonFilters,
  uniqueValues,
  withClusterVolume,
});
export function truncateText(text, maxLength = 120) {
  const value = String(text || "");

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function escapeMarkdownTableCell(text) {
  return String(text ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "｜")
    .trim();
}

export async function parseJsonResponse(response) {
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
      errorType: "json_parse_error",
      code: "AI_DRAFT_RESPONSE_NOT_JSON",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: data?.message || data?.error || "AI生成APIでエラーが発生しました。",
      details: data?.details || data?.detail || data?.error || "",
      status: response.status,
      errorType: data?.errorType || data?.type || "",
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

// Section: API response parsing and fallback analysis draft helpers
const FALLBACK_KEYWORD_STOPWORDS = [
  "について",
  "どうすれば",
  "どうしたら",
  "すべき",
  "べき",
  "必要か",
  "必要",
  "とは",
  "するには",
  "するべきか",
  "よいか",
  "良いか",
  "いいか",
];

function splitJapaneseSearchPhrase(value) {
  return String(value || "")
    .replace(/[「」『』（）()[\]【】,，.。!?！？]/g, " ")
    .split(/\s+|について|どうすれば|どうしたら|するには|すれば|すべき|べき|必要か|必要|とは|よいか|良いか|いいか|には|では|から|まで|より|として|の|は|が|を|に|で|と|も|や|か/gu)
    .map((word) => word.trim())
    .filter(Boolean);
}

function normalizeFallbackKeyword(value) {
  const word = sanitizeXQueryPhrase(value);
  if (!word || word.length < 2) return "";
  if (FALLBACK_KEYWORD_STOPWORDS.includes(word)) return "";
  return word.length > 16 ? word.slice(0, 16).trim() : word;
}

export function extractFallbackKeywords(theme, userOpinion) {
  const rawText = `${theme || ""} ${userOpinion || ""}`;
  const normalized = rawText
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rawWords = normalized.split(/\s+/).filter(Boolean);
  const words = uniqueValues(
    rawWords
      .flatMap((word) => {
        const splitWords = splitJapaneseSearchPhrase(word);
        const looksLikeJapaneseSentence =
          /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(word) &&
          (word.length > 8 || /について|どうすれば|どうしたら|するには|すれば|すべき|べき|必要か|とは|には|では|の|は|が|を|に|で|と|も|や|か/u.test(word));
        return looksLikeJapaneseSentence && splitWords.length > 0 ? splitWords : [word, ...splitWords];
      })
      .map(normalizeFallbackKeyword)
      .filter(Boolean)
  );

  return words.slice(0, 6);
}

export function createFallbackAnalysisDraft(theme, userOpinion, personaMode = "dev", sample = null) {
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

export function createHistoryId(prefix) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 7);

  return `${prefix}_${timestamp}_${suffix}`;
}

// Section: Dataset and cluster history helpers
export function formatHistoryDate(value) {
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

export function readDatasetHistory() {
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

export function writeDatasetHistory(history) {
  const datasets = Array.isArray(history?.datasets) ? history.datasets : [];
  window.localStorage.setItem(
    X_DATASET_HISTORY_STORAGE_KEY,
    JSON.stringify({ datasets: datasets.slice(0, MAX_X_DATASET_HISTORY) })
  );
}

export function compactClusterRowsForHistory(rows) {
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

export function restoreClusterRowsFromHistory(rows) {
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

export function sortRows(rows, sortKey, sortDirection) {
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

export const BEGINNER_FIXED_X_COUNT = 100;

// Section: Mode routing helpers
export function appModeFromPathname(pathname = "") {
  if (pathname === "/guide") return "guide";
  if (pathname === "/beginner") return "beginner";
  if (pathname === "/user") return "user";
  if (pathname === "/developer") return "developer";
  return "beginner";
}

export function pathnameForAppMode(mode) {
  if (mode === "guide") return "/guide";
  if (mode === "beginner") return "/beginner";
  if (mode === "user") return "/user";
  if (mode === "developer") return "/developer";
  return "/beginner";
}


