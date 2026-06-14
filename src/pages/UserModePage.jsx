import UserMainContent from "../components/UserMainContent.jsx";

export default function UserModePage({
  activeMode,
  dashboardHeight,
  publicPreviewMode,
  sidebarWidth,
  dashboardContent,
  onDashboardResizeStart,
  sidebarContent,
  onSidebarResizeStart,
  main,
}) {
  return (
    <div className="app">
      <div
        className={activeMode === "developer" ? "header dashboard-resizable app-developer" : "header dashboard-resizable"}
        style={{ height: `${dashboardHeight}px` }}
      >
        {publicPreviewMode && (
          <div className="public-preview-header">
            <strong>3DE Public Preview</strong>
            <span>
              これは開発中の試用版です。分析結果は参考表示です。
            </span>
          </div>
        )}
        {dashboardContent}
      </div>
      <button
        type="button"
        className="dashboard-resize-handle"
        aria-label="上部ダッシュボードの高さを調整"
        title="ドラッグで上部ダッシュボードの高さを調整"
        onMouseDown={(event) => {
          event.preventDefault();
          onDashboardResizeStart();
        }}
      />

      <div className="app-shell" style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          {sidebarContent}
          <button
            type="button"
            className="sidebar-resize-handle"
            aria-label="サイドバー幅を調整"
            title="ドラッグでサイドバー幅を調整"
            onMouseDown={(event) => {
              event.preventDefault();
              onSidebarResizeStart();
            }}
          />
        </aside>

        <main className="main-content">
          <UserMainContent {...main} />
        </main>
      </div>
    </div>
  );
}
