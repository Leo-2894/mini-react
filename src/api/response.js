import { isSensitiveHeader } from './history.js';
export const DISPLAY_LIMIT = 100000;
export async function parseResponse(response) {
  const text = await response.text();
  let format = text === '' ? 'empty' : 'text', json, parseError = false;
  if (text !== '') {
    try { json = JSON.parse(text); format = 'json'; }
    catch { parseError = /(?:\/|\+)json(?:;|$)/i.test(response.headers.get('content-type') || ''); }
  }
  const headers = Array.from(response.headers, ([name, value]) => ({ name, value: isSensitiveHeader(name) ? '[masked]' : value }));
  return { status: response.status, statusText: response.statusText, ok: response.ok, headers, text, format, json, parseError };
}
export function displayBody(result) {
  let text = result.text || '';
  if (result.format === 'json') {
    try { text = JSON.stringify(result.json, null, 2); } catch { /* Deep JSON stays available as raw text. */ }
  }
  return { text: text.slice(0, DISPLAY_LIMIT), truncated: text.length > DISPLAY_LIMIT };
}
