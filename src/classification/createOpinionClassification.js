export function createOpinionClassification({ normalizeOpinionText, genericQueryTerms }) {
  const GENERIC_QUERY_TERMS = genericQueryTerms || [];
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
}  return {
    stripUrls,
    hasUrl,
    isRetweetLike,
    isTooShortOpinion,
    includesAnyKeyword,
    detectNoiseCategory,
  };
}