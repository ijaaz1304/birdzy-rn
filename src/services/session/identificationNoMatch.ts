/** A completed no-match result can arrive as an error instead of an empty match list. */
export function isIdentificationNoMatch(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const item = error as {
    name?: string;
    code?: string;
    status?: number;
    statusCode?: number;
    message?: string;
    reason?: string;
    response?: { status?: number; data?: { reason?: string } };
  };
  if (
    ['AbortError', 'NetworkException', 'TimeoutException'].includes(
      item.name ?? '',
    ) ||
    ['ERR_CANCELED', 'ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(
      item.code ?? '',
    )
  )
    return false;
  const status = item.status ?? item.statusCode ?? item.response?.status;
  if (status !== undefined && ![200, 400, 404, 422].includes(status))
    return false;
  const message =
    item.reason ?? item.response?.data?.reason ?? item.message ?? '';
  return /\bno\s+(?:(?:matching|similar)\s+)?(?:matches|match|rocks?|minerals?|birds?|mushrooms?|plants?|insects?)\s+(?:were\s+)?found\b|\bno\s+matches\b|\b(?:could\s+not|couldn['’]t|cannot|unable\s+to)\s+identify\b/i.test(
    message,
  );
}
