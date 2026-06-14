import { useState } from "react";

export function createInitialPublishStatus() {
  return {
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
  };
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

function stageKeyFromName(stage) {
  if (stage === "ビルド中") return "build";
  if (stage === "確認中" || stage === "変更確認中") return "check";
  if (stage === "コミット中") return "commit";
  if (stage === "GitHubへpush中") return "push";
  if (stage === "完了") return "complete";
  if (stage === "失敗") return "error";
  return "";
}

export function usePublishController({
  apiBaseUrl,
  isAvailable,
  setToast,
}) {
  const [publishStatus, setPublishStatus] = useState(() => createInitialPublishStatus());

  async function handlePublishLocalUpdates() {
    if (!isAvailable || publishStatus.status === "running") {
      return;
    }

    const confirmed = window.confirm("現在のローカル修正をGitHub mainへpushし、Vercel公開URLへ反映します。よろしいですか？");
    if (!confirmed) {
      return;
    }

    setPublishStatus({
      ...createInitialPublishStatus(),
      status: "running",
      mode: "publish",
      stage: "ビルド中",
      message: "公開反映を開始しました。",
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/publish`, { method: "POST" });
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
        ...createInitialPublishStatus(),
        status: "error",
        mode: "publish",
        stage: "失敗",
        message: "公開反映APIへの接続に失敗しました。",
        error: error.message || String(error),
      });
    }
  }

  async function handlePublishDryRun() {
    if (!isAvailable || publishStatus.status === "running") {
      return;
    }

    setPublishStatus({
      ...createInitialPublishStatus(),
      status: "running",
      mode: "dry-run",
      stage: "ビルド中",
      message: "公開テストを開始しました。",
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/publish-dry-run`, { method: "POST" });
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
          vercelUrl: payload.vercelUrl || "https://3de-app.vercel.app",
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
        ...createInitialPublishStatus(),
        status: "error",
        mode: "dry-run",
        stage: "失敗",
        message: "公開テストAPIへの接続に失敗しました。",
        error: error.message || String(error),
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
    if (!isAvailable) {
      return null;
    }

    const isRunning = publishStatus.status === "running";
    const dryRunIsCurrent = publishStatus.mode === "dry-run" && publishStatus.status !== "idle";
    const publishIsCurrent = publishStatus.mode === "publish" && publishStatus.status !== "idle";
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
    const publishModeLabel = publishStatus.mode === "dry-run" ? "公開テスト" : publishStatus.mode === "publish" ? "公開反映" : "未実行";
    const publishSummaryText = publishStatus.status === "idle"
      ? "未実行"
      : `${publishModeLabel} / ${publishStatus.stage || publishStatus.message || "確認中"}`;
    const hasPublishDetails = publishStatus.status !== "idle";

    return (
      <div className={`local-publish-panel ${publishStatus.status}`}>
        <div className="local-publish-header">
          <strong>ローカル公開反映</strong>
          <span>{publishSummaryText}</span>
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
            {isRunning && publishStatus.mode === "publish" ? "公開反映中" : "公開反映"}
          </button>
        </div>
        <p className="local-publish-message">{publishStatus.message}</p>
        <details className="local-publish-details" open={publishStatus.status === "error"}>
          <summary>{hasPublishDetails ? "詳細を開く" : "詳細"}</summary>
          <div className="local-publish-detail-body">
            <div className="local-publish-stages" aria-label="公開反映ステータス">
              {publishStageItems().map((stage) => (
                <span key={stage.key} className={stage.status}>
                  {stage.label}
                </span>
              ))}
            </div>
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
        </details>
      </div>
    );
  }

  return {
    publishStatus,
    renderLocalPublishPanel,
  };
}
