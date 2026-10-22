/** A completed no-match result can arrive as an error instead of an empty match list. */
export function isIdentificationNoMatch(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  type NoMatchPayload = {
    reason?: string;
    message?: string;
    code?: string;
    error?: string;
  };
  const item = error as NoMatchPayload & {
    name?: string;
    status?: number;
    statusCode?: number;
    data?: NoMatchPayload;
    payload?: NoMatchPayload;
    response?: { status?: number; data?: NoMatchPayload };
  };
  if (
    ["AbortError", "NetworkException", "TimeoutException"].includes(
      item.name ?? ""
    ) ||
    ["ERR_CANCELED", "ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(
      item.code ?? ""
    )
  )
    return false;
  const status = item.status ?? item.statusCode ?? item.response?.status;
  if (status !== undefined && ![200, 400, 404, 422].includes(status))
    return false;
  const payloads = [item, item.data, item.payload, item.response?.data];
  return payloads.some((payload) => {
    if (!payload) return false;
    if (
      /^(?:NO_MATCH(?:ES)?(?:_FOUND)?|IDENTIFICATION_NO_MATCH|UNRECOGNIZED_(?:IMAGE|SPECIES))$/i.test(
        payload.code ?? ""
      )
    )
      return true;
    return [payload.reason, payload.message, payload.error].some(
      (message) =>
        typeof message === "string" &&
        /\bno\s+(?:(?:matching|similar)\s+)?(?:matches|match|rocks?|minerals?|birds?|mushrooms?|plants?|insects?|species)\s+(?:were\s+)?(?:found|detected|identified)\b|\bno\s+match(?:es)?\b|\b(?:could\s+not|couldn['’]t|cannot|unable\s+to)\s+identify\b/i.test(
          message
        )
    );
  });
}
