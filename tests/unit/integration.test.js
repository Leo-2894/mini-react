import {historyEntry} from '../../src/api/history.js';
import {afterEach,it,expect,vi} from 'vitest';
import {FunctionComponent} from '../../src/mini-react/component.js';
import {useState,useEffect} from '../../src/mini-react/hooks.js';
import {h} from '../../src/mini-react/vnode.js';
const roots=[];function mount(App){const host=document.createElement('div'),root=new FunctionComponent(App);roots.push(root);root.mount(host);return{root,host};}
afterEach(()=>{for(const root of roots.splice(0))root.unmount();vi.restoreAllMocks();});
it('does not render a batch whose intermediate values return to the committed state',async()=>{
 let set,renders=0;const{host}=mount(()=>{const[n,s]=useState(0);set=s;renders++;return h('p',{},n);});const node=host.firstChild;set(n=>n+1);set(n=>n-1);await Promise.resolve();expect(renders).toBe(1);expect(host.firstChild).toBe(node);expect(host.textContent).toBe('0');
});
it('rejects setting another root from the active render',()=>{
 let set;const other=mount(()=>{const[n,s]=useState(0);set=s;return h('p',{},n);});const host=document.createElement('div'),root=new FunctionComponent(()=>{set(2);return null;});roots.push(root);expect(()=>root.mount(host)).toThrow(/Setter is forbidden/);expect(other.root.pending).toBe(false);expect(other.host.textContent).toBe('0');
});
it('completes all unmount cleanups once even if one throws',()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{});const log=[];const{root}=mount(()=>{useEffect(()=>()=>{log.push(1);throw Error('cleanup');},[]);useEffect(()=>()=>log.push(2),[]);return h('p');});root.unmount();root.unmount();expect(log).toEqual([1,2]);expect(root.hooks).toEqual([]);
});

it('redacts common long JWT/base64 path values before storing History',()=>{
 for(const token of ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature','abcdefghijklmnopqrstuvwx+abc=']) {
  const entry=historyEntry({method:'GET',url:'https://example.test/session/'+token},{status:200,elapsed:1},{id:'safe',time:1});
  expect(entry.url).toBe('https://example.test/session/[redacted]');
 }
});
