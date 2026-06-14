const MODE_NAV_ITEMS = [
  { key: "guide", label: "使い方" },
  { key: "beginner", label: "初心者mode" },
  { key: "user", label: "ユーザーmode" },
  { key: "developer", label: "開発者mode" },
];

export default function ModeNav({ activeMode, onSelect }) {
  return (
    <nav className="global-mode-nav" aria-label="モード切替">
      {MODE_NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={activeMode === item.key ? "global-mode-button active" : "global-mode-button"}
          onClick={() => onSelect(item.key)}
          aria-pressed={activeMode === item.key}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
