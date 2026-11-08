import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildRequest, sendRequest } from '../../src/api/request.ts';
import { parseResponse, displayBody } from '../../src/api/response.ts';
import { sanitizeURL, historyEntry, appendHistory, reuseHistory } from '../../src/api/history.ts';
const draft=extra=>({method:'GET',url:'https://example.test/items?old=a%20b',params:[],headers:[],body:'',...extra});
afterEach(()=>vi.useRealTimers());
describe('A01 request validation',()=>{
 it.each(['GET','POST','PUT','PATCH','DELETE'])('builds %s without mutating the draft',method=>{
  const input=draft({method,body:'{"hello":"world"}'}),before=JSON.stringify(input),request=buildRequest(input);
  expect(request.method).toBe(method);expect(request.body).toBe(method==='GET'?undefined:'{"hello":"world"}');expect(JSON.stringify(input)).toBe(before);
  expect(request.headers['content-type']).toBe(method==='GET'?undefined:'application/json');expect(Object.isFrozen(request)).toBe(true);
 });
 it('preserves duplicate query names, encodes once and ignores disabled rows',()=>{
  const request=buildRequest(draft({params:[{name:'q',value:'a&b'},{name:'q',value:'한 글'},{name:'',value:'x',enabled:false}]}));
  expect(request.url).toBe('https://example.test/items?old=a+b&q=a%26b&q=%ED%95%9C+%EA%B8%80');
 });
 it.each(['/relative','ftp://example.test','https://user:password@example.test','https://example.test/[redacted]'])('rejects unsafe/incomplete URL %s',url=>expect(()=>buildRequest(draft({url}))).toThrow());
 it('rejects bad method/query/header/body before any network call',()=>{
  for(const extra of [{method:'TRACE'},{params:[{name:'  '}]},{headers:[{name:'bad name',value:'x'}]},{headers:[{name:'x\r\nsecret',value:'x'}]},{headers:[{name:'x',value:'a\nb'}]},{method:'POST',body:'{bad'}])expect(()=>buildRequest(draft(extra))).toThrow();
 });
 it('preserves explicit content type and merges case-insensitive headers',()=>{
  const request=buildRequest(draft({method:'POST',body:'{}',headers:[{name:'Content-Type',value:'application/problem+json'},{name:'X-Test',value:'A'},{name:'x-test',value:'B'},{name:'invalid',value:'x',enabled:false}]}));
  expect(request.headers).toEqual({'content-type':'application/problem+json','x-test':'A, B'});
 });
});
describe('A02 response and transport',()=>{
 it.each([200,400,500])('treats HTTP %s as an inspectable response',async status=>{
  const fetchImpl=vi.fn(async()=>new Response('{"ok":true}',{status,headers:{'content-type':'application/json','x-api-key':'response-secret'}}));
  let time=10;const result=await sendRequest(buildRequest(draft()),{fetchImpl,now:()=>time+=5});
  expect(result.type).toBe('response');expect(result.status).toBe(status);expect(result.ok).toBe(status===200);expect(result.json).toEqual({ok:true});expect(result.elapsed).toBe(5);
  expect(result.headers.find(h=>h.name==='x-api-key').value).toBe('[masked]');expect(fetchImpl.mock.calls[0][1].credentials).toBe('omit');
 });
 it.each([
  [null,204,{},'empty',false],['hello',200,{'content-type':'text/plain'},'text',false],['{bad',200,{'content-type':'application/problem+json'},'text',true],['null',200,{},'json',false]
 ])('parses body %s without turning invalid JSON into transport failure',async(text,status,headers,format,parseError)=>{
  const response=await parseResponse(new Response(text,{status,headers}));expect(response.format).toBe(format);expect(response.parseError).toBe(parseError);expect(response.text).toBe(text||'');
 });
 it('returns a generic uncertain network/CORS error without leaking request or exception secrets',async()=>{
  const result=await sendRequest(buildRequest(draft()),{fetchImpl:async()=>{throw new TypeError('Authorization secret-value');}});
  expect(result).toMatchObject({type:'error',kind:'network'});expect(result.message).toMatch(/CORS/);expect(JSON.stringify(result)).not.toContain('secret-value');
 });
 it('distinguishes timeout from explicit cancellation and cleans timers/listeners',async()=>{
  vi.useFakeTimers();const fetchImpl=vi.fn((url,{signal})=>new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('aborted'));else signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});}));
  const pending=sendRequest(buildRequest(draft()),{fetchImpl,timeout:20});await vi.advanceTimersByTimeAsync(20);expect((await pending).kind).toBe('timeout');expect(vi.getTimerCount()).toBe(0);
  const controller=new AbortController(),remove=vi.spyOn(controller.signal,'removeEventListener');const cancel=sendRequest(buildRequest(draft()),{fetchImpl,signal:controller.signal});controller.abort();expect((await cancel).kind).toBe('aborted');expect(remove).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
 });
 it('honors an already-aborted signal',async()=>{
  const controller=new AbortController();controller.abort();const result=await sendRequest(buildRequest(draft()),{signal:controller.signal,fetchImpl:async(url,{signal})=>{expect(signal.aborted).toBe(true);throw Error();}});expect(result.kind).toBe('aborted');
 });
 it('falls back to raw text when valid deeply nested JSON exceeds stringify depth',()=>{
  const text='['.repeat(12000)+'0'+']'.repeat(12000);expect(displayBody({format:'json',json:JSON.parse(text),text})).toEqual({text,truncated:false});
 });
 it('caps rendered body at 100000 characters and marks truncation',()=>{
  expect(displayBody({format:'text',text:'x'.repeat(100001)})).toEqual({text:'x'.repeat(100000),truncated:true});
  expect(displayBody({format:'json',json:{a:1},text:'{"a":1}'}).text).toBe('{\n  "a": 1\n}');
 });
});
describe('A02 metadata privacy and reuse',()=>{
 it('removes query/hash/userinfo and redacts named secret values and long path tokens',()=>{
  expect(sanitizeURL('https://user:password@example.test/token/secret-value/items?key=private#secret')).toBe('https://example.test/token/[redacted]/items');
  expect(sanitizeURL('https://example.test/a/abcdefghijklmnopqrstuvwxyz')).toBe('https://example.test/a/[redacted]');
 });
 it('stores only safe metadata, bounds at 20 and reuses no private request fields',()=>{
  const request=buildRequest(draft({method:'POST',url:'https://example.test/items?token=secret',body:'{"password":"private"}',headers:[{name:'Authorization',value:'Bearer private'}]}));
  const entry=historyEntry(request,{status:400,elapsed:8,text:'response-secret'},{id:'i1',time:100});expect(entry).toEqual({id:'i1',time:100,method:'POST',url:'https://example.test/items',status:400,elapsed:8});
  expect(reuseHistory(entry)).toEqual({method:'POST',url:'https://example.test/items',params:[],headers:[],body:''});
  let entries=[];for(let i=0;i<25;i++)entries=appendHistory(entries,{...entry,id:i});expect(entries).toHaveLength(20);expect(entries[0].id).toBe(24);expect(entries[19].id).toBe(5);expect(JSON.stringify(entries)).not.toMatch(/private|response-secret/);
 });
});
