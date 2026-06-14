function uniqueByValue(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

export const BEGINNER_OPINION_CATEGORIES = [
  { key: "support", label: "賛成", color: "#2563eb" },
  { key: "conditional", label: "条件付きで賛成", color: "#f59e0b" },
  { key: "oppose", label: "反対", color: "#dc2626" },
  { key: "neutral", label: "中立・その他", color: "#64748b" },
];

export const BEGINNER_FALLBACK_OPINIONS = [
  "必要だと思うが、やり方は見直した方がいい。",
  "今のままでは負担が大きいので、量を減らすべきだ。",
  "完全になくすより、目的に合う形に変えるのがよい。",
  "人によって合う方法が違うので、選べる形がいい。",
  "反対。時間を奪いすぎていると思う。",
  "賛成。続けることで力がつくと思う。",
  "条件付きで賛成。内容が意味のあるものならよい。",
  "家庭の状況によって差が出るので注意が必要だ。",
  "多すぎるのは問題だが、少しはあった方がいい。",
  "やり方次第だと思う。目的がはっきりしていれば納得できる。",
  "反対ではないが、今より柔軟にするべきだ。",
  "必要ないと思う。学校の時間内で終わらせるべきだ。",
  "賛成。自分で考える習慣につながる。",
  "中立。テーマによって答えが変わると思う。",
  "全員同じではなく、必要な人に合わせる形がいい。",
  "今の仕組みを続けるより、質を上げる方が大事だ。",
];

function beginnerKeywordParts(themeText) {
  const parts = extractFallbackKeywords(themeText, "")
    .filter((part) => !/^(について|どう|すれば|べき|必要|増やす|減らす|とは)$/.test(part));

  return uniqueByValue(parts).filter(Boolean).slice(0, 4);
}

export function buildBeginnerXQuery(themeText) {
  const keywords = beginnerKeywordParts(themeText);
  const queryCore = keywords.length > 0 ? keywords.join(" OR ") : String(themeText || "").trim();
  return `${queryCore} lang:ja -is:retweet`;
}

function classifyBeginnerOpinion(text) {
  const value = String(text || "");
  const hasConditional = /条件|ただし|一方|場合|なら|次第|やり方|量|多すぎ|少な|見直|柔軟|バランス|必要だが|賛成だが|反対ではない/.test(value);
  const hasOppose = /反対|不要|いらない|なくす|やめる|廃止|逆効果|負担|問題|無理|よくない|必要ない/.test(value);
  const hasSupport = /賛成|必要|大事|重要|続ける|増やす|使うべき|良い|よい|効果|役立つ|助かる/.test(value);

  if (hasConditional || (hasSupport && hasOppose)) return "conditional";
  if (hasOppose) return "oppose";
  if (hasSupport) return "support";
  return "neutral";
}

export function analyzeBeginnerOpinions(themeText, userOpinionText, opinionTexts, source) {
  const texts = (Array.isArray(opinionTexts) && opinionTexts.length ? opinionTexts : BEGINNER_FALLBACK_OPINIONS)
    .map((text) => String(text || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const counts = BEGINNER_OPINION_CATEGORIES.reduce((acc, category) => ({ ...acc, [category.key]: 0 }), {});

  texts.forEach((text) => {
    counts[classifyBeginnerOpinion(text)] += 1;
  });

  const userCategoryKey = classifyBeginnerOpinion(userOpinionText);
  const total = Math.max(1, texts.length);
  const sortedCategories = [...BEGINNER_OPINION_CATEGORIES].sort((a, b) => counts[b.key] - counts[a.key]);
  const topCategory = sortedCategories[0];
  const secondCategory = sortedCategories[1];
  const userCategory = BEGINNER_OPINION_CATEGORIES.find((category) => category.key === userCategoryKey) || BEGINNER_OPINION_CATEGORIES[3];
  const userShare = Math.round((counts[userCategory.key] / total) * 100);
  const topShare = Math.round((counts[topCategory.key] / total) * 100);

  const otherOpinionComment =
    topCategory.key === "conditional"
      ? "他の人の意見を見ると、賛成・反対だけでなく、「条件付きで賛成」「やり方次第」という中間的な意見が多く見られます。"
      : `他の人の意見では「${topCategory.label}」が比較的多く、次に「${secondCategory.label}」の考えも見られます。`;

  const userEvaluationComment =
    userCategory.key === "conditional"
      ? "あなたの意見は、全体の中では「条件付きで賛成」に近い立場です。極端な意見ではなく、比較的多くの人に受け入れられやすい意見です。"
      : userShare >= topShare * 0.7
        ? `あなたの意見は、全体の中では「${userCategory.label}」に近い立場です。近い考えを持つ人も一定数います。`
        : `あなたの意見は、全体の中では「${userCategory.label}」に近い立場です。多い意見とは少し違うため、別の視点として見られます。`;

  return {
    theme: themeText,
    userOpinion: userOpinionText,
    source,
    texts,
    counts,
    total,
    userCategoryKey,
    userCategoryLabel: userCategory.label,
    otherOpinionComment,
    userEvaluationComment,
  };
}

import { extractFallbackKeywords } from "../../app/appSupport.jsx";
