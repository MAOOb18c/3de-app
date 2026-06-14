import { normalizeSourceDiagnostics } from "../diagnostics/diagnosticsModel.js";
import { SOURCE_TYPES } from "../sourceAdapters/sourceTypes.js";

export default function DeveloperSourceDiagnostics({
  sourceType = SOURCE_TYPES.X,
  sourceLabel = "X",
  sourceDiagnostics = {},
  activeBeginnerResultSlot,
  activeUserResultSlot,
  userModeResultSourceLabel,
  stopReasonLabel,
}) {
  const source = normalizeSourceDiagnostics(sourceDiagnostics);
  const diagnostics = source.diagnostics || {};
  const formatStopReason = (reason) => (stopReasonLabel ? stopReasonLabel(reason) : reason);
  const stopReason = diagnostics.stopReason
    ? formatStopReason(diagnostics.stopReason)
    : source.fallbackUsed
      ? formatStopReason(source.errorType || "fetch_failed")
      : "-";

  return (
    <section className="row card developer-panel beginner-x-debug-panel">
      <div className="developer-panel-title">初心者mode X取得ステータス</div>
      {/* X is the first sourceDiagnostics case. Future sources should feed
          this display through the same sourceType/sourceDiagnostics boundary.
          Count diagnostics stay separate: analysis target, boundary/noise, and
          displayed counts do not belong to this source-specific fetch panel. */}
      <div className="beginner-x-debug-grid">
        <span>sourceType</span>
        <strong>{sourceType}</strong>
        <span>source</span>
        <strong>{sourceLabel}</strong>
        <span>status</span>
        <strong>{source.status}</strong>
        <span>HTTP</span>
        <strong>{source.httpStatus ?? "-"}</strong>
        <span>requested</span>
        <strong>{source.requested}</strong>
        <span>returned</span>
        <strong>{source.returned}</strong>
        <span>apiReturned</span>
        <strong>{diagnostics.apiReturnedCount ?? source.returned}</strong>
        <span>stopReason</span>
        <strong>{stopReason}</strong>
        <span>fallback</span>
        <strong>{source.fallbackUsed ? "used" : "not used"}</strong>
        <span>type</span>
        <strong>{source.errorType || "-"}</strong>
        <span>beginnerSlot</span>
        <strong>{activeBeginnerResultSlot ? `${activeBeginnerResultSlot.texts?.length || 0}件` : "なし"}</strong>
        <span>beginnerQuery</span>
        <strong>{activeBeginnerResultSlot?.finalQuery || activeBeginnerResultSlot?.generatedQuery || "-"}</strong>
        <span>beginnerStop</span>
        <strong>{activeBeginnerResultSlot?.stopReason ? formatStopReason(activeBeginnerResultSlot.stopReason) : "-"}</strong>
        <span>userSlot</span>
        <strong>{activeUserResultSlot ? `${activeUserResultSlot.texts?.length || 0}件` : "なし"}</strong>
        <span>userQuery</span>
        <strong>{activeUserResultSlot?.finalQuery || activeUserResultSlot?.generatedQuery || "-"}</strong>
        <span>userStop</span>
        <strong>{activeUserResultSlot?.stopReason ? formatStopReason(activeUserResultSlot.stopReason) : "-"}</strong>
        <span>User表示</span>
        <strong>{userModeResultSourceLabel}</strong>
        <span>Beginner表示</span>
        <strong>{activeBeginnerResultSlot ? "beginnerResult" : "未実行"}</strong>
      </div>
      <div className="beginner-x-debug-message">{source.message}</div>
      {source.errorCode && (
        <div className="beginner-x-debug-message">code: {source.errorCode}</div>
      )}
      {source.query && (
        <details className="beginner-x-debug-query">
          <summary>実行クエリ</summary>
          <code>{source.query}</code>
        </details>
      )}
    </section>
  );
}
