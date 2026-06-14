const TEXT = {
  adoptedQuery: "\u63a1\u7528\u30af\u30a8\u30ea",
  adoptedQueryEmpty: "\u63a1\u7528\u4e2d\u306e\u691c\u7d22\u8a9e\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002",
  adoptedQueryLabel: "\u63a1\u7528\u30af\u30a8\u30ea",
  adoptedOne: "\u63a1\u75281",
  addExcludeHashtag: "\u9664\u5916\u30cf\u30c3\u30b7\u30e5\u30bf\u30b0\u3092\u8ffd\u52a0",
  addExcludeWord: "\u9664\u5916\u30ef\u30fc\u30c9\u3092\u8ffd\u52a0",
  addMustWord: "MUST\u30ef\u30fc\u30c9\u3092\u8ffd\u52a0",
  addOrWord: "OR\u30ef\u30fc\u30c9\u3092\u8ffd\u52a0",
  empty: "\u672a\u8a2d\u5b9a",
  exclude: "\u9664\u5916",
  excludeHashtagLane: "\u9664\u5916\u30cf\u30c3\u30b7\u30e5\u30bf\u30b0",
  excludeWordLane: "\u9664\u5916\u30ef\u30fc\u30c9",
  excludeWordPlaceholder: "\u9664\u5916\u3057\u305f\u3044\u8a9e",
  heading: "Zone 3 \u610f\u898b\u53d6\u5f97\u306e\u691c\u7d22\u30af\u30a8\u30ea",
  headingHelp:
    "MUST / OR / \u9664\u5916\u3092\u3001\u30ef\u30fc\u30c9\u3068\u30cf\u30c3\u30b7\u30e5\u30bf\u30b0\u306b\u5206\u3051\u3066\u8abf\u6574\u3057\u307e\u3059\u3002",
  mustHashtagLane: "MUST\u30cf\u30c3\u30b7\u30e5\u30bf\u30b0",
  mustWordLane: "MUST\u30ef\u30fc\u30c9",
  mustWordPlaceholder: "\u4e2d\u5fc3\u306b\u3057\u305f\u3044\u8a9e",
  none: "\u306a\u3057",
  orHashtagLane: "OR\u30cf\u30c3\u30b7\u30e5\u30bf\u30b0",
  orHashtagNote:
    "\u30c1\u30c3\u30d7\u3092\u62bc\u3059\u3068\u63a1\u7528/\u89e3\u9664\u3067\u304d\u307e\u3059\u3002",
  orWordLane: "OR\u30ef\u30fc\u30c9",
  orWordNote:
    "\u5165\u529b\u3057\u305f\u8a9e\u306fOR\u6761\u4ef6\u3068\u3057\u3066X\u53d6\u5f97\u6761\u4ef6\u306b\u53cd\u6620\u3055\u308c\u307e\u3059\u3002",
  orWordPlaceholder: "\u8ffd\u52a0\u3057\u305f\u3044\u691c\u7d22\u8a9e",
};

const DEFAULT_EXCLUDE_TERMS = [
  "PR",
  "\u5e83\u544a",
  "\u5ba3\u4f1d",
  "\u30ad\u30e3\u30f3\u30da\u30fc\u30f3",
  "\u7121\u6599",
  "\u767b\u9332",
  "\u30b2\u30fc\u30e0",
  "\u526f\u696d",
  "\u30bb\u30df\u30ca\u30fc",
  "\u30a2\u30d5\u30a3\u30ea\u30a8\u30a4\u30c8",
  "\u30e2\u30cb\u30bf\u30fc\u52df\u96c6",
  "\u30d7\u30ec\u30bc\u30f3\u30c8",
  "\u61f8\u8cde",
];

const DEFAULT_EXCLUDE_HASHTAGS = [
  "#PR",
  "#\u5e83\u544a",
  "#\u5ba3\u4f1d",
  "#\u30ad\u30e3\u30f3\u30da\u30fc\u30f3",
  "#\u7121\u6599",
  "#\u526f\u696d",
  "#\u30bb\u30df\u30ca\u30fc",
  "#\u30a2\u30d5\u30a3\u30ea\u30a8\u30a4\u30c8",
  "#\u30d7\u30ec\u30bc\u30f3\u30c8",
  "#\u61f8\u8cde",
  "#\u30e2\u30cb\u30bf\u30fc\u52df\u96c6",
];

const CENTER_TERM_MOJIBAKE = "\u95a0\u221d\uff6e\uff73";
const STANDALONE_BLOCK_TERMS = ["\u879f\uff71\u9049\uff7c"];

function uniqueList(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function toShortSearchTerms(value) {
  return uniqueList(
    String(value || "")
      .replace(/\b(AND|OR)\b/gi, " ")
      .replace(/[#\-]/g, " ")
      .split(/[\s\u3000,.;:(){}\[\]"'`/|]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2)
      .filter((part) => !/^(lang|is|has|min_likes|min_retweets|min_reposts|filter)$/i.test(part))
      .filter((part) => !DEFAULT_EXCLUDE_TERMS.includes(part))
  ).slice(0, 8);
}

function buildAdoptedRows({ mustTerms, orTerms, safeRuntimeText, viewMode }) {
  const must = mustTerms[0] || "";
  const cleanOrTerms = uniqueList(orTerms).filter((term) => term && term !== must);

  if (!must) {
    return cleanOrTerms
      .filter((term) => !STANDALONE_BLOCK_TERMS.includes(term))
      .slice(0, 1)
      .map((term) => ({
        id: `or-only-${term}`,
        label: TEXT.adoptedOne,
        query: safeRuntimeText(term, viewMode),
      }));
  }

  const compactOrTerms = cleanOrTerms.slice(0, 10);
  return [
    {
      id: "must-or-query",
      label: TEXT.adoptedQueryLabel,
      query: safeRuntimeText(compactOrTerms.length ? `${must} (${compactOrTerms.join(" OR ")})` : must, viewMode),
    },
  ];
}

function Chip({ value, tone = "default", onClick, disabled = false }) {
  const className = `zone3-condition-chip ${tone}${onClick ? " clickable" : ""}`;
  if (!onClick) {
    return <span className={className}>{value}</span>;
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {value}
    </button>
  );
}

function Lane({ title, chips, emptyText = TEXT.empty, inputLabel, inputValue, inputPlaceholder, onInputChange, note }) {
  const shouldShowInput = Boolean(inputLabel && onInputChange);

  return (
    <div className="zone3-condition-lane">
      <div className="zone3-condition-lane-title">{title}</div>
      <div className="zone3-condition-chip-list">
        {chips.length === 0 ? <span className="zone3-muted-chip">{emptyText}</span> : chips}
      </div>
      {shouldShowInput && (
        <label className="zone3-condition-input">
          <span>{inputLabel}</span>
          <input
            value={inputValue ?? ""}
            placeholder={inputPlaceholder}
            onChange={onInputChange}
          />
        </label>
      )}
      {note && <p className="zone3-free-input-note">{note}</p>}
    </div>
  );
}

export default function UserSidebarSourceQuerySetup({ searchConditionProps }) {
  const {
    excludeTermCandidates,
    generatedBasicKeywords,
    hashtagCandidates,
    queryReviewParts,
    safeRuntimeText,
    selectedExcludeTermValues,
    selectedHashtagCandidates,
    selectedHashtagValues,
    selectedXQueryCandidates,
    updateXQueryBase,
    theme,
    toggleExcludeTermCandidate,
    toggleHashtagCandidate,
    userOpinion,
    viewMode,
    xQueryCandidates,
    xQueryFilters,
    updateXQueryFilter,
  } = searchConditionProps;

  const formatRuntimeText = typeof safeRuntimeText === "function" ? safeRuntimeText : (value) => value;
  const handleUpdateFilter = typeof updateXQueryFilter === "function" ? updateXQueryFilter : () => {};
  const handleUpdateBase = typeof updateXQueryBase === "function" ? updateXQueryBase : () => {};
  const handleToggleExcludeTerm = typeof toggleExcludeTermCandidate === "function" ? toggleExcludeTermCandidate : () => {};
  const handleToggleHashtag = typeof toggleHashtagCandidate === "function" ? toggleHashtagCandidate : () => {};
  const safeCandidates = Array.isArray(xQueryCandidates) ? xQueryCandidates : [];
  const safeSelectedCandidates = Array.isArray(selectedXQueryCandidates) ? selectedXQueryCandidates : [];
  const safeHashtagCandidates = Array.isArray(hashtagCandidates) ? hashtagCandidates : [];
  const safeExcludeTermCandidates = Array.isArray(excludeTermCandidates) ? excludeTermCandidates : [];
  const safeGeneratedKeywords = Array.isArray(generatedBasicKeywords) ? generatedBasicKeywords : [];
  const safeSelectedHashtagCandidates = Array.isArray(selectedHashtagCandidates) ? selectedHashtagCandidates : [];
  const safeSelectedExcludeTerms = Array.isArray(selectedExcludeTermValues) ? selectedExcludeTermValues : [];
  const generatedSearchTerms = uniqueList([
    ...safeGeneratedKeywords,
    ...(Array.isArray(queryReviewParts?.includeTerms) ? queryReviewParts.includeTerms : []),
  ]);
  const candidateSourceTerms = uniqueList(
    (safeSelectedCandidates.length ? safeSelectedCandidates : safeCandidates).flatMap((candidate) =>
      toShortSearchTerms(`${candidate.base || ""} ${candidate.query || ""} ${candidate.label || ""}`)
    )
  );
  const themeTerms = toShortSearchTerms(theme);
  const opinionTerms = toShortSearchTerms(userOpinion);
  const includeWords = String(xQueryFilters?.includeWords || "");
  const excludeWords = String(xQueryFilters?.excludeWords || "");
  const freeIncludeTerms = toShortSearchTerms(includeWords);
  const allTerms = uniqueList([...themeTerms, ...generatedSearchTerms, ...candidateSourceTerms, ...opinionTerms, ...freeIncludeTerms]);
  const specialMustTerm = allTerms.find((term) => term === CENTER_TERM_MOJIBAKE || term.includes(CENTER_TERM_MOJIBAKE));
  const mustTerms = specialMustTerm ? [CENTER_TERM_MOJIBAKE] : uniqueList([themeTerms[0], generatedSearchTerms[0], candidateSourceTerms[0]]).slice(0, 1);
  const orTerms = uniqueList([...candidateSourceTerms, ...generatedSearchTerms, ...opinionTerms, ...freeIncludeTerms])
    .filter((term) => !mustTerms.includes(term))
    .filter((term) => !DEFAULT_EXCLUDE_TERMS.includes(term))
    .slice(0, 16);
  const selectedHashtags = Array.isArray(selectedHashtagValues) ? selectedHashtagValues : [];
  const mustHashtags = uniqueList(selectedHashtags.filter((tag) => mustTerms.some((term) => tag.includes(term)))).slice(0, 4);
  const orHashtagCandidates = safeHashtagCandidates.filter((candidate) => candidate.selectionType !== "disabled");
  const excludedHashtagValues = uniqueList([
    ...safeHashtagCandidates.filter((candidate) => candidate.selectionType === "disabled").map((candidate) => candidate.hashtag),
    ...DEFAULT_EXCLUDE_HASHTAGS,
  ]);
  const adoptedQueryRows = buildAdoptedRows({ mustTerms, orTerms, safeRuntimeText: formatRuntimeText, viewMode });
  const adoptedQueryText = adoptedQueryRows.map((row) => row.query).join(" / ");

  return (
    <div className="zone3-condition-panel">
      <div className="zone3-condition-heading">
        <strong>{TEXT.heading}</strong>
        <span>{TEXT.headingHelp}</span>
      </div>

      <section className="zone3-condition-group">
        <h4>MUST</h4>
        <Lane
          title={TEXT.mustWordLane}
          chips={mustTerms.map((term) => <Chip key={term} value={term} tone="must" />)}
          inputLabel={TEXT.addMustWord}
          inputValue={mustTerms[0] || ""}
          inputPlaceholder={TEXT.mustWordPlaceholder}
          onInputChange={(event) => handleUpdateBase(event.target.value)}
        />
        <Lane
          title={TEXT.mustHashtagLane}
          chips={mustHashtags.map((tag) => <Chip key={tag} value={tag} tone="must" />)}
        />
      </section>

      <section className="zone3-condition-group">
        <h4>OR</h4>
        <Lane
          title={TEXT.orWordLane}
          chips={orTerms.map((term) => <Chip key={term} value={term} tone="or" />)}
          inputLabel={TEXT.addOrWord}
          inputValue={includeWords}
          inputPlaceholder={TEXT.orWordPlaceholder}
          onInputChange={(event) => handleUpdateFilter("includeWords", event.target.value)}
          note={TEXT.orWordNote}
        />
        <Lane
          title={TEXT.orHashtagLane}
          chips={orHashtagCandidates.map((candidate) => (
            <Chip
              key={candidate.hashtag}
              value={candidate.hashtag}
              tone={safeSelectedHashtagCandidates.includes(candidate.hashtag) ? "or selected" : "or"}
              onClick={() => handleToggleHashtag(candidate.hashtag)}
            />
          ))}
          note={TEXT.orHashtagNote}
        />
      </section>

      <section className="zone3-condition-group">
        <h4>{TEXT.exclude}</h4>
        <Lane
          title={TEXT.excludeWordLane}
          chips={[
            ...safeExcludeTermCandidates.map((candidate) => (
              <Chip
                key={candidate.term}
                value={`-${candidate.term}`}
                tone={safeSelectedExcludeTerms.includes(candidate.term) ? "exclude selected" : "exclude"}
                onClick={() => handleToggleExcludeTerm(candidate.term)}
              />
            )),
            ...DEFAULT_EXCLUDE_TERMS.filter((term) => !safeExcludeTermCandidates.some((candidate) => candidate.term === term)).map((term) => (
              <Chip key={term} value={`-${term}`} tone="exclude" />
            )),
          ]}
          inputLabel={TEXT.addExcludeWord}
          inputValue={excludeWords}
          inputPlaceholder={TEXT.excludeWordPlaceholder}
          onInputChange={(event) => handleUpdateFilter("excludeWords", event.target.value)}
        />
        <Lane
          title={TEXT.excludeHashtagLane}
          chips={excludedHashtagValues.map((tag) => <Chip key={tag} value={tag} tone="exclude" />)}
        />
      </section>

      <span className="zone3-internal-adopted-query" hidden data-adopted-query={adoptedQueryText} />
    </div>
  );
}
