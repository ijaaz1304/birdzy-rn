/** Normalize file:// URIs (Android native often returns file:/path not file:///path). */
export const normalizeFileUri = (uri: string): string => {
  if (!uri) return uri;
  if (
    uri.startsWith("content://") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("ph://")
  ) {
    return uri;
  }
  if (uri.startsWith("file:///")) return uri;
  if (uri.startsWith("file:/")) {
    const path = uri.slice("file:/".length);
    return `file://${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (uri.startsWith("file://")) {
    const path = uri.slice("file://".length);
    return `file://${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (uri.includes("://")) return uri;
  return uri.startsWith("/") ? `file://${uri}` : `file://${uri}`;
};

export const fileUriToPath = (uri: string): string => {
  const normalized = normalizeFileUri(uri);
  return normalized.startsWith("file://") ? normalized.slice(7) : normalized;
};

export const ensureFilePrefix = (pathOrUri: string): string =>
  normalizeFileUri(pathOrUri);

export const stripFilePrefix = (uri: string): string => fileUriToPath(uri);
