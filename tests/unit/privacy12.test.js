import {describe,it,expect} from 'vitest';
import {historyEntry,sanitizeURL,reuseHistory} from '../../src/api/history.ts';
import {buildRequest} from '../../src/api/request.ts';
describe('QA12-001 raw segment boundary and encoded base64',()=>{
 it.each(['%2F','%2f'])('redacts one long base64 segment containing %s',slash=>{
  const token='abcdefghijklmnopqrstuvwx/abc';
  expect(btoa(atob(token))).toBe(token);
  const entry=historyEntry({method:'GET',url:'http://127.0.0.1:4174/session/abcdefghijklmnopqrstuvwx'+slash+'abc?secret=fake-query#private'},{status:200,elapsed:1},{id:'safe',time:1});
  expect(entry.url).toBe('http://127.0.0.1:4174/session/[redacted]');
  expect(JSON.stringify(entry)).not.toContain('abcdefghijklmnopqrstuvwx');
  expect(reuseHistory(entry).url).toBe('http://127.0.0.1:4174/session/[redacted]');
  expect(()=>buildRequest(reuseHistory(entry))).toThrow(/redacted/);
 });
 it.each([
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
  'abcdefghijklmnopqrstuvwx%2Babc%3D',
  'abcdefghijklmnopqrstuvwx_abc',
  'abcdefghijklmnopqrstuvwx-abc',
  'abcdefghijklmnopqrstuvwx%3D%3D'
 ])('keeps existing long-token variants redacted: %s',token=>{
  expect(sanitizeURL('https://example.test/session/'+token)).toBe('https://example.test/session/[redacted]');
 });
 it('preserves ordinary raw segment boundaries and strips query/hash/userinfo',()=>{
  expect(sanitizeURL('https://user:pass@example.test/catalog/a%2Fb/items?secret=x#private')).toBe('https://example.test/catalog/a%2Fb/items');
  expect(sanitizeURL('https://example.test/token/short-secret/items?x=1')).toBe('https://example.test/token/[redacted]/items');
 });
});
