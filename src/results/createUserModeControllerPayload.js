export function createUserModeControllerPayload(groups = {}) {
  const payload = {};
  for (const group of Object.values(groups)) {
    if (group && typeof group === "object") {
      Object.assign(payload, group);
    }
  }
  return payload;
}
