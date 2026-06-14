function BeginnerOpinionGraph({ result, categories }) {
  const total = Math.max(1, result?.total || 0);
  const userCategoryKey = result?.userCategoryKey || "";

  return (
    <div className="beginner-graph" aria-label="意見分布グラフ">
      {categories.map((category) => {
        const count = result?.counts?.[category.key] || 0;
        const percentage = Math.round((count / total) * 100);
        const isUserPosition = userCategoryKey === category.key;

        return (
          <div className={isUserPosition ? "beginner-graph-row user-position" : "beginner-graph-row"} key={category.key}>
            <div className="beginner-graph-label">
              <strong>{category.label}</strong>
              {isUserPosition && <span>あなたの意見はこのあたり</span>}
            </div>
            <div className="beginner-graph-track">
              <div
                className="beginner-graph-bar"
                style={{
                  width: `${Math.max(4, percentage)}%`,
                  background: category.color,
                }}
              />
            </div>
            <div className="beginner-graph-count">
              {result ? `${count}件` : "-"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BeginnerResultPanel({ status, message, result, categories }) {
  return (
    <section className="beginner-result-card">
      <div className={`beginner-status ${status}`}>
        {status === "idle" ? "まだ実行していません" : message}
      </div>
      <BeginnerOpinionGraph result={result} categories={categories} />
      {result ? (
        <div className="beginner-comments">
          <article>
            <h2>他にはどんな意見があるか</h2>
            <p>{result.otherOpinionComment}</p>
          </article>
          <article>
            <h2>自分の意見に対する評価</h2>
            <p>{result.userEvaluationComment}</p>
          </article>
        </div>
      ) : (
        <div className="beginner-empty-result">
          <h2>結果はここに表示されます</h2>
          <p>入力してボタンを押すと、他の人の意見とあなたの位置を短く表示します。</p>
        </div>
      )}
    </section>
  );
}
