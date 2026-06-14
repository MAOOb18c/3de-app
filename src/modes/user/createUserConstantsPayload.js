export function createUserConstantsPayload(scope = {}) {
  const {
    LOCAL_PUBLISH_AVAILABLE,
  } = scope;

  return {
      LOCAL_PUBLISH_AVAILABLE,
    };
}
