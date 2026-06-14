export function stableHash(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || {});
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function normalizeModeInputIdentity({ theme = "", userOpinion = "", purpose = "", persona = "", category = "" } = {}) {
  return {
    theme: String(theme || "").trim(),
    userOpinion: String(userOpinion || "").trim(),
    purpose: String(purpose || "").trim(),
    persona: String(persona || "").trim(),
    category: String(category || "").trim(),
  };
}

export function modeResultInputKey({ theme = "", userOpinion = "", purpose = "", persona = "", category = "" } = {}) {
  return stableHash(normalizeModeInputIdentity({ theme, userOpinion, purpose, persona, category }));
}
