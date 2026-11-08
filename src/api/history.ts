import type { RequestSnapshot, HistoryEntry, RequestDraft } from './types.js';
const sensitive = /auth|cookie|key|token|secret|password|credential/i;
export const isSensitiveHeader = (name: string): boolean => sensitive.test(name);
export function sanitizeURL(raw: string): string {
  try {
    const url = new URL(raw); url.search = ''; url.hash = ''; url.username = ''; url.password = '';
    let redactNext = false;
    url.pathname = url.pathname.split('/').map(segment => {
      let decoded; try { decoded = decodeURIComponent(segment); } catch { decoded = segment; }
      const redact = redactNext || /^[a-z0-9_+=.\/-]{24,}$/i.test(decoded);
      redactNext = !redact && sensitive.test(decoded);
      return redact ? '[redacted]' : segment;
    }).join('/');
    return url.href;
  } catch { return '[redacted]'; }
}
export function historyEntry(snapshot: Pick<RequestSnapshot, 'method' | 'url'>, result: { status?: number; elapsed: number }, { id, time = Date.now() }: { id: string; time?: number }): HistoryEntry {
  return Object.freeze({ id, time, method: snapshot.method, url: sanitizeURL(snapshot.url), status: result.status ?? null, elapsed: result.elapsed });
}
export function appendHistory(entries: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] { return [entry, ...entries].slice(0, 20); }
export function reuseHistory(entry: HistoryEntry): RequestDraft {
  return { method: entry.method, url: entry.url, params: [], headers: [], body: '' };
}
