import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const bearerToken = process.env.X_BEARER_TOKEN || process.env.X_API_KEY;
const openAiApiKey = String(process.env.OPENAI_API_KEY || "").trim();
const openAiEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const openAiSummaryModel = process.env.OPENAI_SUMMARY_MODEL || "gpt-4.1-mini";
const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

app.use(cors());
app.use(express.json());

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
}

function buildUrl(query, pageSize, nextToken) {
  const params = new URLSearchParams({
    query,
    max_results: String(pageSize),
    "tweet.fields": "created_at,public_metrics,author_id,lang,conversation_id",
    expansions: "author_id",
    "user.fields": "username,name,public_metrics,verified",
  });

  if (nextToken) {
    params.set("next_token", nextToken);
  }

  return `https://api.x.com/2/tweets/search/recent?${params.toString()}`;
}

function normalizePosts(payload) {
  const users = new Map();

  for (const user of payload.includes?.users || []) {
    users.set(user.id, user);
  }

  return (payload.data || []).map((post) => {
    const author = users.get(post.author_id);
    const metrics = post.public_metrics || {};

    return {
      id: post.id,
      text: post.text,
      author_id: post.author_id,
      username: author?.username || "",
      author_name: author?.name || "",
      created_at: post.created_at,
      lang: post.lang,
      like_count: metrics.like_count || 0,
      repost_count: metrics.retweet_count || 0,
      reply_count: metrics.reply_count || 0,
      quote_count: metrics.quote_count || 0,
      url: author?.username ? `https://x.com/${author.username}/status/${post.id}` : `https://x.com/i/web/status/${post.id}`,
    };
  });
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

function averageVector(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    return [];
  }

  const length = vectors[0]?.length || 0;
  if (length === 0) {
    return [];
  }

  const sums = Array.from({ length }, () => 0);

  vectors.forEach((vector) => {
    for (let index = 0; index < length; index += 1) {
      sums[index] += vector[index] || 0;
    }
  });

  return sums.map((value) => value / vectors.length);
}

function findRepresentativeItem(cluster, centroid) {
  if (!cluster?.items?.length) {
    return null;
  }

  return cluster.items.reduce((best, item) => {
    const itemSimilarity = cosineSimilarity(item.embedding, centroid);
    const bestSimilarity = cosineSimilarity(best.embedding, centroid);

    return itemSimilarity > bestSimilarity ? item : best;
  });
}

function clusterByCosine(items, embeddings, threshold) {
  const clusters = [];

  items.forEach((item, index) => {
    const itemWithEmbedding = {
      ...item,
      embedding: embeddings[index],
    };

    const targetCluster = clusters.find(
      (cluster) => cosineSimilarity(itemWithEmbedding.embedding, cluster.centroid) >= threshold
    );

    if (targetCluster) {
      targetCluster.items.push(itemWithEmbedding);
      targetCluster.centroid = averageVector(targetCluster.items.map((clusterItem) => clusterItem.embedding));
      return;
    }

    clusters.push({
      centroid: itemWithEmbedding.embedding,
      items: [itemWithEmbedding],
    });
  });

  return clusters.map((cluster, index) => {
    cluster.centroid = averageVector(cluster.items.map((item) => item.embedding));
    const representativeItem = findRepresentativeItem(cluster, cluster.centroid) || cluster.items[0];
    const cleanItems = cluster.items.map(({ embedding, ...item }) => item);
    const totalDuplicateCount = cleanItems.reduce(
      (sum, item) => sum + Math.max(1, Number(item.duplicateCount) || 1),
      0
    );

    return {
      id: `C${index + 1}`,
      count: cleanItems.length,
      duplicateCount: totalDuplicateCount,
      representativeText: representativeItem?.text || "",
      itemIds: cleanItems.map((item) => item.id),
      items: cleanItems,
    };
  });
}

function parseJsonObject(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    const match = String(value).match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (_innerError) {
      return null;
    }
  }
}

function normalizeSummaryResult(value, clusterId) {
  const keyPoints = Array.isArray(value?.keyPoints) ? value.keyPoints : [];
  const cautions = Array.isArray(value?.cautions) ? value.cautions : [];

  return {
    clusterId,
    title: String(value?.title || "クラスタ整理結果").trim(),
    summary: String(value?.summary || "").trim(),
    cleanOpinion: String(value?.cleanOpinion || "").trim(),
    keyPoints: keyPoints.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 6),
    cautions: cautions.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4),
  };
}

function normalizeAnalysisDraftResult(value) {
  const fallbackAxis = {
    label: "",
    highDescription: "",
    lowDescription: "",
  };
  const axisConfig = value?.axisConfig || {};
  const queryCandidates = Array.isArray(value?.queryCandidates) ? value.queryCandidates : [];
  const basicKeywords = Array.isArray(value?.basicKeywords) ? value.basicKeywords : [];
  const initialQuestions = Array.isArray(value?.initialQuestions) ? value.initialQuestions : [];
  const axisLinkedKeywords = value?.axisLinkedKeywords || {};
  const suggestedAnalysisMode =
    value?.suggestedAnalysisMode === "axisDriven" ? "axisDriven" : "exploratory";

  return {
    axisConfig: {
      presetKey: "aiDraft",
      x: {
        ...fallbackAxis,
        ...axisConfig.x,
        label: String(axisConfig.x?.label || "").trim() || "広がり",
        highDescription: String(axisConfig.x?.highDescription || axisConfig.x?.description || "").trim(),
        lowDescription: String(axisConfig.x?.lowDescription || "").trim(),
        description: String(axisConfig.x?.highDescription || axisConfig.x?.description || "").trim(),
      },
      y: {
        ...fallbackAxis,
        ...axisConfig.y,
        label: String(axisConfig.y?.label || "").trim() || "深さ",
        highDescription: String(axisConfig.y?.highDescription || axisConfig.y?.description || "").trim(),
        lowDescription: String(axisConfig.y?.lowDescription || "").trim(),
        description: String(axisConfig.y?.highDescription || axisConfig.y?.description || "").trim(),
      },
      z: {
        ...fallbackAxis,
        ...axisConfig.z,
        label: String(axisConfig.z?.label || "").trim() || "視座",
        highDescription: String(axisConfig.z?.highDescription || axisConfig.z?.description || "").trim(),
        lowDescription: String(axisConfig.z?.lowDescription || "").trim(),
        description: String(axisConfig.z?.highDescription || axisConfig.z?.description || "").trim(),
      },
    },
    basicKeywords: basicKeywords.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12),
    queryCandidates: queryCandidates
      .map((item, index) => ({
        id: String(item?.id || `ai-${index + 1}`).trim(),
        label: String(item?.label || `AI候補${index + 1}`).trim(),
        query: String(item?.query || "").trim(),
        description: String(item?.description || item?.note || "").trim(),
      }))
      .filter((item) => item.label && item.query)
      .slice(0, 8),
    axisLinkedKeywords: {
      x: Array.isArray(axisLinkedKeywords.x) ? axisLinkedKeywords.x.map(String).filter(Boolean).slice(0, 8) : [],
      y: Array.isArray(axisLinkedKeywords.y) ? axisLinkedKeywords.y.map(String).filter(Boolean).slice(0, 8) : [],
      z: Array.isArray(axisLinkedKeywords.z) ? axisLinkedKeywords.z.map(String).filter(Boolean).slice(0, 8) : [],
    },
    suggestedAnalysisMode,
    initialQuestions: initialQuestions.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5),
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/analysis-draft/health", (_request, response) => {
  if (!openai) {
    response.status(200).json({
      ok: false,
      openaiConfigured: false,
      model: openAiSummaryModel,
      error: "OPENAI_API_KEY is missing",
      code: "OPENAI_API_KEY_MISSING",
    });
    return;
  }

  response.json({
    ok: true,
    openaiConfigured: true,
    model: openAiSummaryModel,
  });
});

app.post("/api/analysis-draft", async (request, response) => {
  const theme = String(request.body?.theme || "").trim().slice(0, 800);
  const userOpinion = String(request.body?.userOpinion || "").trim().slice(0, 1600);
  const analysisMode = request.body?.analysisMode === "axisDriven" ? "axisDriven" : "exploratory";
  const personaMode = String(request.body?.personaMode || "dev").trim().slice(0, 80);
  const personaLabel = String(request.body?.personaLabel || "ペルソナ（開発）").trim().slice(0, 120);
  const themeCategory = String(request.body?.themeCategory || "general").trim().slice(0, 80);
  const analysisPurposeMode = String(request.body?.analysisPurposeMode || "").trim().slice(0, 80);
  const analysisPurposeLabel = String(request.body?.analysisPurposeLabel || "").trim().slice(0, 120);
  const regenerateInstruction = String(request.body?.regenerateInstruction || "").trim().slice(0, 600);
  const axisGenerationContext = JSON.stringify({
    currentAxisConfig: request.body?.currentAxisConfig || null,
    draftAxisConfig: request.body?.draftAxisConfig || null,
    previousAxisCandidate: request.body?.previousAxisCandidate || null,
  }).slice(0, 6000);

  if (!theme || !userOpinion) {
    response.status(400).json({
      error: "テーマと自分の意見を入力してください。",
      details: "AI仮生成には theme と userOpinion が必要です。",
      code: "AI_DRAFT_INPUT_MISSING",
    });
    return;
  }

  if (!openai) {
    response.status(400).json({
      error: "OPENAI_API_KEY が設定されていません。",
      details: ".env に OPENAI_API_KEY を設定し、server.js を再起動してください。",
      code: "OPENAI_API_KEY_MISSING",
    });
    return;
  }

  const prompt = [
    "Theme-first rule: evaluation axes and core X search query candidates must be derived from the theme and themeCategory.",
    "Persona rule: personaMode is only a UX/output lens for tone, emphasis, guidance, and output structure.",
    "Purpose rule: analysisPurposeMode changes retrieval direction, clustering emphasis, and report framing. It must not overwrite the theme-first axis logic.",
    "Regeneration rule: when previousAxisCandidate is provided, create a candidate that differs from the previous one in at least one meaningful angle such as lived experience, structure, future outlook, practicality, or emotion.",
    "Do not replace housing axes or housing queries with romance axes or romance queries just because personaMode is personaA.",
    "Only use romance axes when the themeCategory or theme itself is romance. Only use coding/classroom axes when the themeCategory or theme itself is coding/classroom.",
    "あなたは3DEの分析設計を支援する編集者です。",
    "ユーザーのテーマと自分の意見を読み、3DEで意見空間を立体的に分析しやすい評価軸とX検索クエリ候補を作ってください。",
    "",
    "必ず守ること:",
    "- 評価軸X/Y/Zは互いに意味が重なりすぎないようにする",
    "- 各軸には高い側と低い側の説明を付ける",
    "- 検索クエリ候補は視点が広がるように複数方向を出す",
    "- 似たクエリばかりにしない",
    "- 生活実感、制度・構造、感情、未来性、対立軸などが分かれるようにする",
    "- X検索で使える短めのqueryにする",
    "- queryに lang:ja や -is:retweet は含めない",
    "- 出力はJSONだけにする",
    "",
    "JSON形式:",
    "- queryCandidatesでは「成長」「変化」「意見」「深い」「視座」「構造」「制度」「感情」「不安」などの汎用語を単独候補にしない",
    "- 汎用語を使う場合は必ずテーマ語や評価軸に直結する具体語と組み合わせる",
    "- 各queryCandidateにはテーマ本文から取れる具体語を最低1つ含める",
    JSON.stringify({
      axisConfig: {
        presetKey: "aiDraft",
        x: { label: "...", highDescription: "...", lowDescription: "..." },
        y: { label: "...", highDescription: "...", lowDescription: "..." },
        z: { label: "...", highDescription: "...", lowDescription: "..." },
      },
      basicKeywords: ["...", "..."],
      queryCandidates: [{ id: "q1", label: "...", query: "... OR ...", description: "..." }],
      axisLinkedKeywords: { x: ["..."], y: ["..."], z: ["..."] },
      suggestedAnalysisMode: "exploratory",
      initialQuestions: ["...", "...", "..."],
    }),
    "",
    `現在の分析モード: ${analysisMode}`,
    `themeCategory: ${themeCategory}`,
    `analysisPurposeMode: ${analysisPurposeMode}`,
    `analysisPurposeLabel: ${analysisPurposeLabel}`,
    `regenerateInstruction: ${regenerateInstruction || "none"}`,
    `axisGenerationContext: ${axisGenerationContext}`,
    `利用目的 personaMode: ${personaMode}`,
    `利用目的ラベル: ${personaLabel}`,
    `テーマ: ${theme}`,
    `自分の意見: ${userOpinion}`,
  ].join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: openAiSummaryModel,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You return only a valid JSON object in Japanese. Do not include markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);

    if (!parsed) {
      response.status(500).json({
        error: "AI応答をJSONとして解析できませんでした。",
        details: content.slice(0, 500),
        code: "AI_RESPONSE_PARSE_FAILED",
      });
      return;
    }

    response.json(normalizeAnalysisDraftResult(parsed));
  } catch (error) {
    response.status(500).json({
      error: "AI分析設定の仮生成に失敗しました。",
      details: error.message || "",
      code: "AI_DRAFT_FAILED",
    });
  }
});

app.post("/api/analysis-draft", async (request, response) => {
  const theme = String(request.body?.theme || "").trim().slice(0, 800);
  const userOpinion = String(request.body?.userOpinion || "").trim().slice(0, 1600);
  const analysisMode = request.body?.analysisMode === "axisDriven" ? "axisDriven" : "exploratory";
  const personaMode = String(request.body?.personaMode || "dev").trim().slice(0, 80);
  const personaLabel = String(request.body?.personaLabel || "ペルソナ（開発）").trim().slice(0, 120);

  if (!theme || !userOpinion) {
    response.status(400).json({ error: "テーマと自分の意見を入力してください。" });
    return;
  }

  if (!openai) {
    response.status(500).json({
      error: "AI仮生成を実行できません。OPENAI_API_KEY が未設定です。",
    });
    return;
  }

  const prompt = [
    "あなたは3DEの分析設計を支援する編集者です。",
    "ユーザーのテーマと自分の意見を読み、3DEで意見空間を立体的に分析しやすい評価軸とX検索クエリ候補を作ってください。",
    "",
    "必ず守ること:",
    "- 評価軸X/Y/Zは互いに意味が重なりすぎないようにする",
    "- 各軸には高い側と低い側の説明を付ける",
    "- 検索クエリ候補は視点が広がるように複数方向を出す",
    "- 似たクエリばかりにしない",
    "- 生活実感、制度・構造、感情、未来性、対立軸などが分かれるようにする",
    "- X検索で使える短めのqueryにする",
    "- queryに lang:ja や -is:retweet は含めない",
    "- 出力はJSONだけにする",
    "",
    "JSON形式:",
    "- queryCandidatesでは「成長」「変化」「意見」「深い」「視座」「構造」「制度」「感情」「不安」などの汎用語を単独候補にしない",
    "- 汎用語を使う場合は必ずテーマ語や評価軸に直結する具体語と組み合わせる",
    "- 各queryCandidateにはテーマ本文から取れる具体語を最低1つ含める",
    JSON.stringify({
      axisConfig: {
        presetKey: "aiDraft",
        x: { label: "...", highDescription: "...", lowDescription: "..." },
        y: { label: "...", highDescription: "...", lowDescription: "..." },
        z: { label: "...", highDescription: "...", lowDescription: "..." },
      },
      basicKeywords: ["...", "..."],
      queryCandidates: [
        { id: "q1", label: "...", query: "... OR ...", description: "..." },
      ],
      axisLinkedKeywords: { x: ["..."], y: ["..."], z: ["..."] },
      suggestedAnalysisMode: "exploratory",
      initialQuestions: ["...", "...", "..."],
    }),
    "",
    `現在の分析モード: ${analysisMode}`,
    `利用目的 personaMode: ${personaMode}`,
    `利用目的ラベル: ${personaLabel}`,
    `テーマ: ${theme}`,
    `自分の意見: ${userOpinion}`,
  ].join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: openAiSummaryModel,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You return only a valid JSON object in Japanese. Do not include markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);

    if (!parsed) {
      response.status(500).json({ error: "AI仮生成のJSON解析に失敗しました。" });
      return;
    }

    response.json(normalizeAnalysisDraftResult(parsed));
  } catch (error) {
    response.status(500).json({
      error: "AI仮生成に失敗しました。",
      detail: error.message || "",
    });
  }
});

app.post("/api/query-diagnosis-improve", async (request, response) => {
  const theme = String(request.body?.theme || "").trim().slice(0, 800);
  const userOpinion = String(request.body?.userOpinion || "").trim().slice(0, 1600);
  const currentQuery = String(request.body?.currentQuery || "").trim().slice(0, 1200);
  const diagnosis = request.body?.diagnosis || {};
  const axisConfig = request.body?.axisConfig || {};
  const analysisMode = String(request.body?.analysisMode || "").trim().slice(0, 80);
  const personaMode = String(request.body?.personaMode || "dev").trim().slice(0, 80);
  const personaLabel = String(request.body?.personaLabel || "ペルソナ（開発）").trim().slice(0, 120);
  const noiseBreakdown = Array.isArray(request.body?.noiseBreakdown) ? request.body.noiseBreakdown.slice(0, 12) : [];
  const queryTermDiagnosis = Array.isArray(request.body?.queryTermDiagnosis)
    ? request.body.queryTermDiagnosis.slice(0, 16)
    : [];
  const sampleKeptPosts = Array.isArray(request.body?.sampleKeptPosts) ? request.body.sampleKeptPosts.slice(0, 8) : [];
  const sampleNoisePosts = Array.isArray(request.body?.sampleNoisePosts) ? request.body.sampleNoisePosts.slice(0, 8) : [];

  const extractWords = (text) =>
    String(text || "")
      .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー\s]/gu, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !["from", "lang", "is", "retweet"].includes(word.toLowerCase()));
  const uniqueWords = Array.from(
    new Set([
      ...extractWords(`${theme} ${userOpinion}`).slice(0, 8),
      ...extractWords(
        ["x", "y", "z"]
          .flatMap((axis) => [
            axisConfig?.[axis]?.label,
            axisConfig?.[axis]?.description,
            axisConfig?.[axis]?.highDescription,
            axisConfig?.[axis]?.lowDescription,
          ])
          .join(" ")
      ).slice(0, 8),
    ])
  );
  const anchor = uniqueWords[0] || theme || currentQuery || "テーマ";
  const weakTerms = queryTermDiagnosis.filter((item) => item && item.status && item.status !== "ok");
  const topNoise = noiseBreakdown[0];
  const suggestedTerms = Array.from(
    new Set([...weakTerms.map((item) => item.suggestion).filter(Boolean), ...uniqueWords])
  ).slice(0, 6);
  const fallbackCandidates = [
    {
      label: "テーマ語で絞る",
      query: suggestedTerms.slice(0, 4).join(" OR ") || anchor,
      reason: "テーマ本文と評価軸から具体語を選び、広すぎる単独語を減らします。",
    },
    {
      label: "広い語をテーマ語に結合",
      query:
        weakTerms.length > 0
          ? weakTerms.map((item) => `${anchor} ${item.term}`).join(" OR ")
          : `${anchor} ${uniqueWords[1] || ""}`.trim(),
      reason: "多義語や一般語を単独で使わず、テーマ語とAND的に組み合わせます。",
    },
    {
      label: "具体的な意見を拾う",
      query: `${anchor} (${Array.from(new Set([...uniqueWords.slice(1, 3), "困った", "体験", "相談", "意見"])).join(" OR ")})`,
      reason: "広告・短文・別文脈を避け、分析対象になりやすい体験や意見の投稿へ寄せます。",
    },
  ].filter((item) => item.query.trim());
  const fallbackHashtags = uniqueWords
    .slice(0, 5)
    .map((word) => ({
      label: word,
      hashtag: `#${String(word).replace(/\s+/g, "")}`,
      reason: "テーマ語から作ったハッシュタグ候補です。",
      noiseRisk: "中",
      selectionType: "recommended",
    }));
  const mainProblems = [
    ...(Array.isArray(diagnosis?.problemReasons) ? diagnosis.problemReasons.slice(0, 4) : []),
    ...(topNoise ? [`${topNoise.label || topNoise.category}が${topNoise.count}件あります。${topNoise.advice || ""}`] : []),
    ...weakTerms.slice(0, 2).map((item) => `検索語「${item.term}」は${item.problem || "見直しが必要"}。${item.advice || ""}`),
  ];
  const fallback = {
    diagnosisSummary:
      diagnosis?.status === "bad"
        ? "取得診断は不調です。分析対象が少ないため、検索語の広さ・多義語・ノイズ分類を見直してください。"
        : diagnosis?.status === "warning"
          ? "取得診断は注意です。分析は可能ですが、ノイズ率または検索語の広さが改善余地です。"
          : "取得診断は良好です。必要に応じて追加取得に進めます。",
    mainProblems,
    queryTermAdvice: queryTermDiagnosis,
    improvedQueryCandidates: fallbackCandidates,
    improvedHashtagCandidates: fallbackHashtags,
    recommendedQuery: fallbackCandidates[0]?.query || currentQuery,
    userMessage:
      topNoise || weakTerms.length
        ? "上位ノイズ分類と見直し対象の検索語を確認し、改善候補を選んで30件を再診断してください。"
        : "このクエリのまま追加取得できます。改善候補は比較用として使えます。",
    source: "rule_fallback",
  };

  if (!openai) {
    response.json(fallback);
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: openAiSummaryModel,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return only a valid JSON object in Japanese. Schema: { diagnosisSummary, mainProblems, queryTermAdvice, improvedQueryCandidates:[{label,query,reason}], improvedHashtagCandidates:[{label,hashtag,reason,noiseRisk,selectionType}], recommendedQuery, userMessage }. selectionType must be recommended, caution, or disabled.",
        },
        {
          role: "user",
          content: [
            "3DEのX検索クエリ診断です。分析対象が少ない理由を、ノイズ分類と検索語ごとの問題から説明し、改善クエリ候補を作ってください。",
            "単独の広い語は避け、テーマ語や評価軸語と組み合わせてください。PR、RT、URL短文、別分野、商品、娯楽、日常報告などのノイズには具体的な対策を出してください。",
            `theme: ${theme}`,
            `userOpinion: ${userOpinion}`,
            `analysisMode: ${analysisMode}`,
            `personaMode: ${personaMode}`,
            `personaLabel: ${personaLabel}`,
            `currentQuery: ${currentQuery}`,
            `diagnosis: ${JSON.stringify(diagnosis).slice(0, 2500)}`,
            `noiseBreakdown: ${JSON.stringify(noiseBreakdown).slice(0, 2000)}`,
            `queryTermDiagnosis: ${JSON.stringify(queryTermDiagnosis).slice(0, 2500)}`,
            `sampleKeptPosts: ${JSON.stringify(sampleKeptPosts).slice(0, 1500)}`,
            `sampleNoisePosts: ${JSON.stringify(sampleNoisePosts).slice(0, 1500)}`,
          ].join("\n"),
        },
      ],
    });
    const parsed = parseJsonObject(completion.choices?.[0]?.message?.content || "");
    response.json(parsed || fallback);
  } catch (_error) {
    response.json(fallback);
  }
});

app.post("/api/query-diagnosis-improve-legacy", async (request, response) => {
  const theme = String(request.body?.theme || "").trim().slice(0, 800);
  const userOpinion = String(request.body?.userOpinion || "").trim().slice(0, 1600);
  const currentQuery = String(request.body?.currentQuery || "").trim().slice(0, 1200);
  const diagnosis = request.body?.diagnosis || {};
  const axisConfig = request.body?.axisConfig || {};
  const samplePosts = Array.isArray(request.body?.samplePosts) ? request.body.samplePosts.slice(0, 10) : [];

  const words = `${theme} ${userOpinion}`
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 8);
  const axisWords = ["x", "y", "z"]
    .flatMap((axis) => [
      axisConfig?.[axis]?.label,
      axisConfig?.[axis]?.description,
      axisConfig?.[axis]?.highDescription,
      axisConfig?.[axis]?.lowDescription,
    ])
    .join(" ")
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 8);
  const uniqueWords = Array.from(new Set([...words, ...axisWords]));
  const anchor = uniqueWords[0] || theme || currentQuery || "意見";
  const fallbackCandidates = [
    {
      label: "テーマ語で絞る",
      query: Array.from(new Set(uniqueWords.slice(0, 4))).join(" OR ") || anchor,
      reason: "テーマ本文と評価軸から具体語を選び、広すぎる語を減らします。",
    },
    {
      label: "具体体験を拾う",
      query: `${anchor} (${Array.from(new Set([...uniqueWords.slice(1, 3), "体験", "困った", "相談"])).join(" OR ")})`,
      reason: "分析対象になりやすい具体的な意見・体験を拾います。",
    },
    {
      label: "学習・支援に寄せる",
      query: `${anchor} (${Array.from(new Set([...uniqueWords.slice(2, 4), "学習", "支援", "課題"])).join(" OR ")})`,
      reason: "ノイズが多い場合に、対象領域の文脈を明示します。",
    },
  ].filter((item) => item.query.trim());

  const fallback = {
    diagnosisSummary:
      diagnosis?.status === "bad"
        ? "取得診断は不調です。現在のクエリでは分析対象が十分に集まっていません。"
        : diagnosis?.status === "warning"
          ? "取得診断は注意です。取得は可能ですが、ノイズがやや多い状態です。"
          : "取得診断は良好です。",
    problemReasons: Array.isArray(diagnosis?.problemReasons) ? diagnosis.problemReasons : [],
    improvedQueryCandidates: fallbackCandidates,
    recommendedQuery: fallbackCandidates[0]?.query || currentQuery,
    samplePostCount: samplePosts.length,
    source: "rule_fallback",
  };

  if (!openai) {
    response.json(fallback);
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: openAiSummaryModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return only a valid JSON object in Japanese. Do not include markdown.",
        },
        {
          role: "user",
          content: [
            "3DEのX検索クエリ診断に基づき、改善クエリ候補を作成してください。",
            "単独の汎用語は避け、テーマ語・評価軸語と組み合わせてください。",
            "JSON形式: { diagnosisSummary, problemReasons, improvedQueryCandidates:[{label,query,reason}], recommendedQuery }",
            `theme: ${theme}`,
            `userOpinion: ${userOpinion}`,
            `currentQuery: ${currentQuery}`,
            `diagnosis: ${JSON.stringify(diagnosis).slice(0, 2000)}`,
            `samplePosts: ${JSON.stringify(samplePosts).slice(0, 2000)}`,
          ].join("\n"),
        },
      ],
    });
    const parsed = parseJsonObject(completion.choices?.[0]?.message?.content || "");
    response.json(parsed || fallback);
  } catch (_error) {
    response.json(fallback);
  }
});

app.get("/api/x-search", async (request, response) => {
  if (!bearerToken) {
    response.status(500).json({ error: "X API token is missing. Set X_BEARER_TOKEN or X_API_KEY in .env." });
    return;
  }

  if (!bearerToken) {
    response.status(500).json({
      error: "X_BEARER_TOKENが未設定です。.envにX_BEARER_TOKEN=...を設定してください。",
    });
    return;
  }

  const query = String(request.query.query || "").trim();
  const requestedMax = toPositiveInteger(request.query.max_results, 100);
  const maxResults = Math.max(10, Math.min(1000, requestedMax));

  if (!query) {
    response.status(400).json({ error: "query is required." });
    return;
  }

  if (!query) {
    response.status(400).json({ error: "queryが空です。" });
    return;
  }

  const allPosts = [];
  let nextToken = undefined;
  let page = 0;

  try {
    while (allPosts.length < maxResults && page < 10) {
      const remaining = maxResults - allPosts.length;
      const pageSize = Math.max(10, Math.min(100, remaining));
      const url = buildUrl(query, pageSize, nextToken);

      const apiResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const payload = await apiResponse.json();

      if (!apiResponse.ok) {
        response.status(apiResponse.status).json({
          error: payload.detail || payload.title || payload.errors?.[0]?.detail || "X API request failed",
          raw: payload,
        });
        return;
      }

      const posts = normalizePosts(payload);
      allPosts.push(...posts);
      nextToken = payload.meta?.next_token;
      page += 1;

      if (!nextToken || posts.length === 0) break;
    }

    response.json({
      query,
      requested_max_results: maxResults,
      count: allPosts.length,
      posts: allPosts.slice(0, maxResults),
    });
  } catch (error) {
    response.status(500).json({ error: error.message || "unknown server error" });
  }
});

app.post("/api/semantic-cluster", async (request, response) => {
  const rawItems = Array.isArray(request.body?.items) ? request.body.items : [];
  const threshold = Number.isFinite(Number(request.body?.threshold))
    ? Math.max(0, Math.min(1, Number(request.body.threshold)))
    : 0.78;

  if (rawItems.length > 200) {
    response.status(400).json({ error: "items は最大200件までです。" });
    return;
  }

  const items = rawItems
    .map((item, index) => ({
      id: String(item?.id || index + 1),
      text: String(item?.text || "").trim(),
      duplicateCount: Math.max(1, Number(item?.duplicateCount) || 1),
    }))
    .filter((item) => item.text);

  if (items.length === 0) {
    response.json({
      method: "semantic",
      threshold,
      model: openAiEmbeddingModel,
      inputCount: 0,
      clusterCount: 0,
      clusters: [],
    });
    return;
  }

  if (!openai) {
    response.status(500).json({
      error: "OPENAI_API_KEY が未設定です。.env に OPENAI_API_KEY=... を設定してください。",
    });
    return;
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: openAiEmbeddingModel,
      input: items.map((item) => item.text),
    });

    const embeddings = [...embeddingResponse.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    const clusters = clusterByCosine(items, embeddings, threshold);

    response.json({
      method: "semantic",
      threshold,
      model: openAiEmbeddingModel,
      inputCount: items.length,
      clusterCount: clusters.length,
      clusters,
    });
  } catch (error) {
    response.status(500).json({
      error: error.message || "OpenAI embeddings の取得に失敗しました。",
    });
  }
});

app.post("/api/cluster-summary", async (request, response) => {
  const clusterId = String(request.body?.clusterId || "").trim() || "C?";
  const representativeText = String(request.body?.representativeText || "").trim().slice(0, 1200);
  const rawItems = Array.isArray(request.body?.items) ? request.body.items : [];
  const items = rawItems
    .slice(0, 10)
    .map((item, index) => ({
      id: String(item?.id || index + 1),
      text: String(item?.text || "").trim().slice(0, 800),
      duplicateCount: Math.max(1, Number(item?.duplicateCount) || 1),
    }))
    .filter((item) => item.text);

  if (items.length === 0) {
    response.status(400).json({ error: "要約対象の元意見がありません。" });
    return;
  }

  if (!openai) {
    response.status(500).json({
      error: "AI要約を実行できません。OPENAI_API_KEY が未設定です。",
    });
    return;
  }

  const opinionsText = items
    .map((item, index) => `${index + 1}. id=${item.id} duplicateCount=${item.duplicateCount}\n${item.text}`)
    .join("\n\n");
  const prompt = [
    "あなたは3DEの意見クラスタを整理する編集者です。",
    "クラスタ内のSNS投稿を読み、第三者に説明できる自然な日本語に整理してください。",
    "",
    "必ず守ること:",
    "- 元意見の主張を勝手に変えない",
    "- 事実確認はしない",
    "- SNS投稿の乱れた日本語を、第三者に説明できる自然な日本語に整える",
    "- 断定しすぎない",
    "- 複数意見の共通点と相違点を分ける",
    "- 皮肉、怒り、煽り表現は中立的な表現に変換する",
    "- 個人攻撃や差別的表現は、意味を保ちながら穏当な表現に置き換える",
    "- このクラスタは何についての意見群かが分かるようにする",
    "- 出力はJSONだけにする",
    "",
    "JSON形式:",
    '{ "title": "...", "summary": "...", "cleanOpinion": "...", "keyPoints": ["..."], "cautions": ["..."] }',
    "",
    `clusterId: ${clusterId}`,
    `representativeText: ${representativeText}`,
    "",
    "元意見:",
    opinionsText,
  ].join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: openAiSummaryModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You return only a valid JSON object in Japanese. Do not include markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);

    if (!parsed) {
      response.status(500).json({ error: "AI要約のJSON解析に失敗しました。" });
      return;
    }

    response.json(normalizeSummaryResult(parsed, clusterId));
  } catch (error) {
    response.status(500).json({
      error: "AI要約に失敗しました。元意見の表示は引き続き利用できます。",
      detail: error.message || "",
    });
  }
});

app.listen(port, () => {
  console.log(`3DE X API server running at http://localhost:${port}`);
});
