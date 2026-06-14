import {
  API_BASE_URL,
  BEGINNER_FIXED_X_COUNT,
  postsFromTexts,
} from "../../app/appSupport.jsx";
import {
  analyzeBeginnerOpinions,
  BEGINNER_FALLBACK_OPINIONS,
  buildBeginnerXQuery,
} from "./beginnerAnalysis.js";
import {
  createBeginnerFallbackResultSnapshot,
  createBeginnerSuccessResultSnapshot,
} from "../../results/applyFetchedResultModel.js";
import {
  buildXSearchParams,
  createXFetchDebug,
  normalizeXPostsFromPayload,
} from "../../sourceAdapters/xSourceAdapter.js";

export async function runBeginnerMode({
  event,
  beginnerThemeInput,
  beginnerOpinionInput,
  inputKeyForValues,
  syncUserInputSessionQuery,
  prepareXFetch,
  applyFetchedXPosts,
  setTheme,
  setUserOpinion,
  setBeginnerResult,
  setBeginnerResultSlot,
  setUserResultSlot,
  setBeginnerStatus,
  setBeginnerMessage,
  setBeginnerXFetchDebug,
  setXDataStatus,
}) {
  event.preventDefault();
  const nextTheme = beginnerThemeInput.trim();
  const nextOpinion = beginnerOpinionInput.trim();

  if (!nextTheme || !nextOpinion) {
    setBeginnerStatus("error");
    setBeginnerMessage("テーマと自分の意見を入力してください。");
    return;
  }

  setTheme(nextTheme);
  setUserOpinion(nextOpinion);
  syncUserInputSessionQuery(nextTheme, nextOpinion, { resetOutput: true });
  const nextInputKey = inputKeyForValues(nextTheme, nextOpinion);
  setBeginnerResult(null);
  setBeginnerResultSlot(null);
  setUserResultSlot(null);
  setBeginnerStatus("running");
  setBeginnerMessage("他の人の意見を見ています...");
  prepareXFetch({ preserveBeginnerState: true });

  const query = buildBeginnerXQuery(nextTheme);
  setBeginnerXFetchDebug(createXFetchDebug({
    status: "running",
    query,
    requested: BEGINNER_FIXED_X_COUNT,
    message: "Xから100件取得を試しています。",
  }));

  try {
    const params = buildXSearchParams(query, BEGINNER_FIXED_X_COUNT);
    const response = await fetch(`${API_BASE_URL}/api/x-search?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(payload.error || payload.message || "Xから取得できませんでした。");
      error.httpStatus = response.status;
      error.errorCode = payload.code || payload.errorCode || "";
      error.errorType = payload.errorType || payload.type || "";
      error.raw = payload.raw || payload;
      throw error;
    }

    const { posts, texts } = normalizeXPostsFromPayload(payload);

    if (texts.length === 0) {
      const error = new Error("X APIは成功しましたが、表示できる意見が見つかりませんでした。");
      error.httpStatus = response.status;
      error.errorType = "empty_result";
      error.raw = payload;
      throw error;
    }

    applyFetchedXPosts(posts, texts, { sourceMode: "beginner" });
    const nextBeginnerResult = analyzeBeginnerOpinions(nextTheme, nextOpinion, texts, "x");
    const nextDebug = createXFetchDebug({
      status: "success",
      query,
      requested: BEGINNER_FIXED_X_COUNT,
      returned: texts.length,
      httpStatus: response.status,
      message: payload.diagnostics?.stopReason && payload.diagnostics.stopReason !== "target_reached"
        ? `X APIから${texts.length}件取得しました。停止理由: ${payload.diagnostics.stopReason}`
        : `X APIから${texts.length}件取得しました。`,
      diagnostics: payload.diagnostics || null,
    });
    setBeginnerResult(nextBeginnerResult);
    setBeginnerStatus("success");
    setBeginnerMessage(`${BEGINNER_FIXED_X_COUNT}件で取得を試し、${texts.length}件を表示に使いました。`);
    setBeginnerXFetchDebug(nextDebug);
    setBeginnerResultSlot(
      createBeginnerSuccessResultSnapshot({
        inputKey: nextInputKey,
        theme: nextTheme,
        userOpinion: nextOpinion,
        posts,
        texts,
        payload,
        analysisResult: nextBeginnerResult,
        generatedQuery: query,
        requested: BEGINNER_FIXED_X_COUNT,
      })
    );
  } catch (error) {
    const fallbackTexts = BEGINNER_FALLBACK_OPINIONS;
    const fallbackPosts = postsFromTexts(fallbackTexts, {
      fetchType: "beginner_sample",
      sourceQuery: query,
      fetchedAt: new Date().toISOString(),
    });

    applyFetchedXPosts(fallbackPosts, fallbackTexts, { sourceMode: "beginner" });
    setXDataStatus("sample");
    const nextBeginnerResult = analyzeBeginnerOpinions(nextTheme, nextOpinion, fallbackTexts, "sample");
    const nextDebug = createXFetchDebug({
      status: "error",
      query,
      requested: BEGINNER_FIXED_X_COUNT,
      fallbackUsed: true,
      httpStatus: error.httpStatus || null,
      errorCode: error.errorCode || "",
      errorType: error.errorType || "fetch_failed",
      message: error.message || "X取得に失敗しました。",
    });
    setBeginnerResult(nextBeginnerResult);
    setBeginnerStatus("success");
    setBeginnerMessage("Xから取得できなかったため、サンプルの意見で表示しています。");
    setBeginnerXFetchDebug(nextDebug);
    setBeginnerResultSlot(
      createBeginnerFallbackResultSnapshot({
        inputKey: nextInputKey,
        theme: nextTheme,
        userOpinion: nextOpinion,
        posts: fallbackPosts,
        texts: fallbackTexts,
        analysisResult: nextBeginnerResult,
        generatedQuery: query,
        errorType: nextDebug.errorType,
        requested: BEGINNER_FIXED_X_COUNT,
      })
    );
  }
}
