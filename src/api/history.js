const sensitive = /auth|cookie|key|token|secret|password|credential/i;
export const isSensitiveHeader = name => sensitive.test(name);
export function sanitizeURL(raw) {
  try {
    const url = new URL(raw); url.search = ''; url.hash = ''; url.username = ''; url.password = '';
    let redactNext = false;
    url.pathname = url.pathname.split('/').map(segment => {
      let decoded; try { decoded = decodeURIComponent(segment); } catch { decoded = segment; }
      const redact = redactNext || /^[a-z0-9_=-]{24,}$/i.test(decoded);
      redactNext = !redact && sensitive.test(decoded);
      return redact ? '[redacted]' : segment;
    }).join('/');
    return url.href;
  } catch { return '[redacted]'; }
}
export function historyEntry(snapshot, result, { id, time = Date.now() }) {
  return Object.freeze({ id, time, method: snapshot.method, url: sanitizeURL(snapshot.url), status: result.status ?? null, elapsed: result.elapsed });
}
export function appendHistory(entries, entry) { return [entry, ...entries].slice(0, 20); }
export function reuseHistory(entry) {
  return { method: entry.method, url: entry.url, params: [], headers: [], body: '' };
}
