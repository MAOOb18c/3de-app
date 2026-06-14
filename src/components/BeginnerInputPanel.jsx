export default function BeginnerInputPanel({
  themeInput,
  opinionInput,
  status,
  onThemeChange,
  onOpinionChange,
  onRun,
}) {
  return (
    <form className="beginner-form-card" onSubmit={onRun}>
      <label>
        <span>テーマ</span>
        <input
          value={themeInput}
          onChange={(event) => onThemeChange(event.target.value)}
          placeholder="学校の宿題は必要か"
        />
      </label>
      <label>
        <span>自分の意見</span>
        <textarea
          value={opinionInput}
          onChange={(event) => onOpinionChange(event.target.value)}
          placeholder="宿題は必要だが、量が多すぎると逆効果だと思う"
        />
      </label>
      <button type="submit" className="beginner-run-button" disabled={status === "running"}>
        {status === "running" ? "見ています..." : "他の意見を見てみる"}
      </button>
      <p className="beginner-form-note">取得件数は100件固定です。細かい設定は必要ありません。</p>
    </form>
  );
}
