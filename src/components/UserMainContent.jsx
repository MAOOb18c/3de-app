import UserGraphAndZones from "./UserGraphAndZones.jsx";

export default function UserMainContent({
  overview,
  axis,
  externalOpinions,
  graph,
  afterOverviewContent,
  zoneResultsContent,
}) {
  const externalOpinionCount = externalOpinions.value
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean).length;
  const xPostTotals = externalOpinions.posts.reduce(
    (totals, post) => ({
      likes: totals.likes + (post.like_count || 0),
      reposts: totals.reposts + (post.repost_count || 0),
      replies: totals.replies + (post.reply_count || 0),
      quotes: totals.quotes + (post.quote_count || 0),
    }),
    { likes: 0, reposts: 0, replies: 0, quotes: 0 },
  );
  const externalOpinionsContent = (
    <section className="zone-section zone-external-opinions card zone-card zone-7">
      <div className="zone-heading">Zone⑦ 外部意見</div>
      <p className="zone-lead">
        X取得後または手入力された、分析元の外部意見を確認します。
      </p>
      <div className="field main-external-opinions">
        <div className="section-title-row compact-title-row">
          <h3>外部意見（1行1意見）</h3>
          <span className="zone-count-badge">
            {externalOpinionCount}件
          </span>
        </div>
        <textarea
          value={externalOpinions.value}
          onChange={(event) => externalOpinions.onChange(event.target.value)}
        />
      </div>

      <div className="status-panel">
        <div><strong>取得状態：</strong>{externalOpinions.stateLabel}</div>
        <div>
          <strong>{externalOpinions.viewMode === "developer" ? "実行されるX検索クエリ：" : "検索条件："}</strong>
          {externalOpinions.viewMode === "developer"
            ? externalOpinions.effectiveQuery || "（未入力）"
            : "アプリが安全な形に整えて送信します"}
        </div>
        <div><strong>X取得ステータス：</strong>{externalOpinions.xStatus || "未実行"}</div>
      </div>

      {externalOpinions.posts.length > 0 && (
        <div className="x-posts-zone-summary">
          <h3>X取得メタデータ</h3>
          <div className="x-posts-summary">
            取得件数：{externalOpinions.posts.length}件 / いいね合計：
            {xPostTotals.likes} / リポスト合計：
            {xPostTotals.reposts} / 返信合計：
            {xPostTotals.replies} / 引用合計：
            {xPostTotals.quotes}
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      <section className="zone-section zone-input-data card zone-card zone-6">
        <div className="zone-heading">Zone⑥ 現在のテーマ・自分の意見</div>
        <p className="zone-lead">
          今、何について分析しているのかを最初に確認します。
        </p>

        <div className="input-zone-grid">
          <div className="input-zone-panel">
            <h3>サンプル名</h3>
            <p>{overview.currentSessionSampleLabel}</p>
          </div>
          <div className="input-zone-panel">
            <h3>現在のテーマ</h3>
            <p>{overview.theme || "（未入力）"}</p>
          </div>
          <div className="input-zone-panel">
            <h3>自分の意見</h3>
            <p>{overview.userOpinion || "（未入力）"}</p>
          </div>
          <div className="input-zone-panel">
            <h3>現在の分析対象の概要</h3>
            <p>
              外部意見 {externalOpinionCount}件 /
              分析対象候補 {overview.candidateCount}件 /
              表示クラスタ {overview.clusterCount}件
            </p>
          </div>
        </div>

        <div className="axis-summary-panel">
          <h3>評価軸</h3>
          <div className="axis-summary-grid">
            <div>
              <b>{axis.labels.x}</b>
              <span>{axis.config.x.description}</span>
            </div>
            <div>
              <b>{axis.labels.y}</b>
              <span>{axis.config.y.description}</span>
            </div>
            <div>
              <b>{axis.labels.z}</b>
              <span>{axis.config.z.description}</span>
            </div>
          </div>
        </div>
      </section>

      {afterOverviewContent}

      <UserGraphAndZones
        graph={graph}
        externalOpinionsContent={externalOpinionsContent}
        zoneResultsContent={zoneResultsContent}
      />
    </>
  );
}
