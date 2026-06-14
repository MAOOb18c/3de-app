export default function UserGraphAndZones({
  graph,
  externalOpinionsContent,
  zoneResultsContent,
}) {
  return (
    <>
      <section className="row row-3 card zone-card zone-10">
        <div className="section-title-row">
          <h2>Zone⑩ グラフ（3D・2D）</h2>

          {graph.viewMode === "developer" && (
            <button
              className={graph.originCentered ? "view-button active" : "view-button"}
              onClick={graph.onToggleOriginCentered}
            >
              {graph.originCentered ? "通常表示に戻す" : "原点を中央に持ってきて作図"}
            </button>
          )}
        </div>

        <p className="zone-lead graph-zone-lead">
          グラフは長文を読む場所ではなく、意見空間の構造と距離感を見る場所です。点に触れると要約された情報を確認できます。
        </p>
        <div className="graph-axis-summary">
          <span>{graph.axisLabels.x}</span>
          <span>{graph.axisLabels.y}</span>
          <span>{graph.axisLabels.z}</span>
        </div>
        {graph.userReferenceGraphWarning && (
          <div className="reference-warning graph-reference-warning">
            <strong>参考表示</strong>
            <span>{graph.userReferenceGraphMessage}</span>
            {!graph.publicPreviewMode && (
              <span className="mode-assist-note">詳細は左上の開発者modeで確認できます。</span>
            )}
          </div>
        )}
        <div className="graph-legend-card">
          <div><strong>赤いひし形</strong><span>あなたの意見です。</span></div>
          <div><strong>青-赤の円</strong><span>外部意見クラスタです。</span></div>
          <div><strong>円の大きさ</strong><span>独立した類似意見の数です。RT数やコピー数ではありません。</span></div>
          <div><strong>円の色</strong><span>独立意見数。青=少ない、赤=多い。</span></div>
          <div><strong>四角</strong><span>分析対象クラスタの平均位置です。</span></div>
        </div>
        <div className="status-panel">
          {graph.viewMode === "user" ? (
            <>
              このグラフは、取得できた意見の中で似た意見がどこにまとまっているかを見るためのものです。
              円の大きさと色は今回の分析対象内での相対的な大きさで、市場全体の声量ではありません。
            </>
          ) : (
            <>
              グラフ表示：{graph.result.resolvedScoreDisplayMode === "relative" ? "相対スコア" : "絶対スコア"}。
              {graph.result.resolvedScoreDisplayMode === "relative"
                ? "今回の意見群内での相対差を表示しています。元の絶対スコアはクラスタ一覧で確認できます。"
                : "絶対スコアを表示しています。"}
              採点は評価軸説明との一致度、テーマ関連度、本文の具体性で補正し、ノイズ除去ON時は関連が弱い投稿をクラスタリング前に除外します。
              ボリューム表示：クラスタ点は半透明で、点が大きいほど独立した類似意見数が多く、青は小さいクラスタ、赤は大きいクラスタです。RT・同一コメント・類似テンプレートによる拡散量はグラフの円サイズに加算していません。
            </>
          )}
        </div>
        <div ref={graph.plot3dRef}></div>
      </section>

      <section className="row row-4 card zone-card zone-10">
        <h2>2Dグラフ</h2>
        <div ref={graph.plot2dRef}></div>
      </section>

      {externalOpinionsContent}

      <section className="zone-section zone-results">
        <div className="zone-heading">中央メインエリア：分析・可視化</div>
        <p className="zone-lead">
          Zone⑧-Zone⑫で、クラスタ化、クラスタ一覧、グラフ、フィードバック、根拠一覧を確認します。
        </p>
        {zoneResultsContent}
      </section>
    </>
  );
}
