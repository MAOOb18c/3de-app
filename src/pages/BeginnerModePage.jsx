import BeginnerInputPanel from "../components/BeginnerInputPanel.jsx";
import BeginnerResultPanel from "../components/BeginnerResultPanel.jsx";

export default function BeginnerModePage({
  modeNav,
  input,
  result,
  actions,
}) {
  const { themeInput, opinionInput } = input;
  const { status, message, analysisResult, categories } = result;
  const { onThemeChange, onOpinionChange, onRun } = actions;

  return (
    <main className="beginner-page">
      <div className="beginner-shell">
        <header className="beginner-hero">
          <div>
            {modeNav}
            <h1>自分の意見は、全体の中でどう見える？</h1>
            <p>テーマと自分の意見を入れるだけで、他の人の意見と比べて見られます。</p>
          </div>
        </header>

        <section className="beginner-layout">
          <BeginnerInputPanel
            themeInput={themeInput}
            opinionInput={opinionInput}
            status={status}
            onThemeChange={onThemeChange}
            onOpinionChange={onOpinionChange}
            onRun={onRun}
          />

          <BeginnerResultPanel
            status={status}
            message={message}
            result={analysisResult}
            categories={categories}
          />
        </section>
      </div>
    </main>
  );
}
