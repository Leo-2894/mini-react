import type { Method, RequestDraft, RequestSnapshot, RequestResult } from './types.js';
import { parseResponse } from './response.js';
const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
function isMethod(value: string): value is Method { return methods.has(value); }
export function buildRequest(draft: RequestDraft): RequestSnapshot {
  const method = String(draft.method || '').toUpperCase();
  if (!isMethod(method)) throw Error('Unsupported HTTP method');
  let url;
  try { url = new URL(draft.url); } catch { throw Error('URL must be absolute HTTP(S)'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('URL must be HTTP(S) without user credentials');
  for (const row of draft.params || []) if (row.enabled !== false) {
    if (typeof row.name !== 'string' || !row.name.trim()) throw Error('Query name is required');
    url.searchParams.append(row.name, String(row.value ?? ''));
  }
  if (/\[redacted\]|%5bredacted%5d/i.test(url.href)) throw Error('Edit the redacted URL before sending');
  const headers = new Headers();
  for (const row of draft.headers || []) if (row.enabled !== false) {
    if (typeof row.name !== 'string' || !/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(row.name)) throw Error('Invalid header name');
    const value = String(row.value ?? '');
    if (/[\r\n]/.test(value)) throw Error('Invalid header value');
    try { headers.append(row.name, value); } catch { throw Error('Invalid header value'); }
  }
  let body;
  if (method !== 'GET' && String(draft.body || '').trim()) {
    body = String(draft.body);
    try { JSON.parse(body); } catch { throw Error('Body must be valid JSON'); }
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }
  url.hash = '';
  return Object.freeze({ method, url: url.href, headers: Object.freeze(Object.fromEntries(headers)), body });
}
export async function sendRequest(snapshot: RequestSnapshot, { signal, timeout = 30000, fetchImpl = globalThis.fetch, now = () => performance.now() }: { signal?: AbortSignal; timeout?: number; fetchImpl?: typeof globalThis.fetch; now?: () => number } = {}): Promise<RequestResult> {
  if (!Number.isFinite(timeout) || timeout <= 0) throw Error('Timeout must be positive');
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', forwardAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  const started = now();
  try {
    const response = await fetchImpl(snapshot.url, { method: snapshot.method, headers: snapshot.headers, body: snapshot.body, credentials: 'omit', signal: controller.signal });
    return { type: 'response', ...await parseResponse(response), elapsed: Math.max(0, Math.round(now() - started)) };
  } catch {
    const kind = timedOut ? 'timeout' : controller.signal.aborted ? 'aborted' : 'network';
    const message = kind === 'timeout' ? '요청 제한 시간(기본 30초)을 초과했습니다.' : kind === 'aborted' ? '요청을 취소했습니다.' : '네트워크 요청에 실패했습니다. CORS, DNS 또는 연결 문제일 수 있습니다. 브라우저 연결과 서버의 CORS 설정을 확인하세요.';
    return { type: 'error', kind, message, elapsed: Math.max(0, Math.round(now() - started)) };
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', forwardAbort); }
}
