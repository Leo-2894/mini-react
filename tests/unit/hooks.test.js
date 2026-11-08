import { afterEach, describe, expect, it, vi } from 'vitest';
import { FunctionComponent } from '../../src/mini-react/component.js';
import { useState, useEffect, useMemo } from '../../src/mini-react/hooks.js';
import { h } from '../../src/mini-react/vnode.js';
const roots=[];const tick=async(n=4)=>{for(let i=0;i<n;i++)await Promise.resolve();};
function mount(App,props={}) {const host=document.createElement('div');document.body.append(host);const root=new FunctionComponent(App,props);roots.push(root);root.mount(host);return{root,host};}
afterEach(()=>{for(const root of roots.splice(0))root.unmount();document.body.replaceChildren();vi.restoreAllMocks();});
describe('R03 effect dependencies and cleanup',()=>{
 it('runs setups after DOM patch and all changed cleanups before ordered setups',async()=>{
  const log=[];let host;const f=mount(({n})=>{useEffect(()=>{log.push('a'+n+':'+host?.textContent);return()=>log.push('ca'+n);},[n]);useEffect(()=>{log.push('b'+n);return()=>log.push('cb'+n);},[n]);return h('p',{},n);},{n:0});host=f.host;log.length=0;
  f.root.updateProps({n:1});await tick();expect(log).toEqual(['ca0','cb0','a1:1','b1']);
  f.root.unmount();f.root.unmount();expect(log.slice(-2)).toEqual(['ca1','cb1']);
 });
 it('distinguishes omitted, empty, stable, changed and length-changing dependencies',async()=>{
  const calls=[0,0,0];const {root}=mount(({deps})=>{useEffect(()=>{calls[0]++;});useEffect(()=>{calls[1]++;},[]);useEffect(()=>{calls[2]++;},deps);return null;},{deps:[1]});
  for(const deps of [[1],[2],[2,3]]){root.updateProps({deps});await tick();}
  expect(calls).toEqual([4,1,3]);
 });
 it('copies dependencies and compares NaN and signed zero with Object.is',async()=>{
  let calls=0;const deps=[NaN,-0];const {root}=mount(({deps})=>{useEffect(()=>{calls++;},deps);return null;},{deps});
  deps[1]=0;root.updateProps({deps});await tick();root.updateProps({deps:[NaN,0]});await tick();expect(calls).toBe(2);
 });
 it('does not clean up or set up effects from a failed render',()=>{
  const log=[];let set,bad=false;const{root,host}=mount(()=>{const[n,s]=useState(0);set=s;useEffect(()=>{log.push('s'+n);return()=>log.push('c'+n);},[n]);if(bad)throw Error('bad render');return h('p',{},n);});
  bad=true;set(2);expect(()=>root.update()).toThrow(/bad render/);expect(log).toEqual(['s0']);expect(host.textContent).toBe('0');root.unmount();expect(log).toEqual(['s0','c0']);
 });
 it.each([()=>Promise.resolve(),()=>3])('rejects invalid setup returns after DOM commit',setup=>{
  const host=document.createElement('div');const root=new FunctionComponent(()=>{useEffect(setup,[]);return h('p',{},'committed');});roots.push(root);
  expect(()=>root.mount(host)).toThrow(/synchronous cleanup/);expect(host.textContent).toBe('committed');expect(root.committed).toBe(true);expect(root.error).toBeInstanceOf(Error);
 });
 it('continues remaining cleanups and setups when one cleanup throws',async()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});const log=[];
  const {root}=mount(({n})=>{useEffect(()=>{log.push('s1');return()=>{log.push('c1');throw Error('cleanup');};},[n]);useEffect(()=>{log.push('s2');return()=>log.push('c2');},[n]);return null;},{n:0});
  root.updateProps({n:1});await tick();expect(log).toEqual(['s1','s2','c1','c2','s1','s2']);expect(root.error.message).toBe('cleanup');
  root.unmount();expect(log.slice(-2)).toEqual(['c1','c2']);
 });
});
describe('R04 memo',()=>{
 it('reuses value identity and computes only for changed/omitted deps',async()=>{
  let once=0,always=0,byDep=0;const values=[];const{root}=mount(({n})=>{useMemo(()=>++always);useMemo(()=>++once,[]);values.push(useMemo(()=>{byDep++;return {n};},[n]));return null;},{n:1});
  root.updateProps({n:1});await tick();root.updateProps({n:2});await tick();expect([once,always,byDep]).toEqual([1,3,2]);expect(values[0]).toBe(values[1]);expect(values[2]).not.toBe(values[0]);
 });
 it('preserves committed cache on a failed render and discards failed state queues',()=>{
  let set,bad=false,calls=0;const{root}=mount(()=>{const[n,s]=useState(0);set=s;useMemo(()=>{calls++;return {n};},[n]);if(bad)throw Error('bad');return null;});
  const hooks=root.hooks,value=hooks[1].value;bad=true;set(2);expect(()=>root.update()).toThrow(/bad/);expect(root.hooks).toBe(hooks);expect(root.hooks[1].value).toBe(value);
  bad=false;root.update();expect(calls).toBe(2);expect(root.hooks[0].value).toBe(0);expect(root.hooks[1].value).toBe(value);
 });
 it('copies memo deps and detects NaN/-0/length differences',async()=>{
  let calls=0;const deps=[NaN,-0];const{root}=mount(({deps})=>{useMemo(()=>++calls,deps);return null;},{deps});
  deps[1]=0;root.updateProps({deps});await tick();root.updateProps({deps:[NaN,0]});await tick();root.updateProps({deps:[NaN]});await tick();expect(calls).toBe(3);
 });
});
describe('R05 runtime safety',()=>{
 it('defers effect setters to a fresh update without render reentry',async()=>{
  const log=[];const{root,host}=mount(()=>{const[n,set]=useState(0);log.push('render'+n);useEffect(()=>{log.push('effect'+n);if(n===0)set(1);},[n]);return h('p',{},n);});
  expect(host.textContent).toBe('0');await tick();expect(host.textContent).toBe('1');expect(log).toEqual(['render0','effect0','render1','effect1']);expect(root.error).toBeNull();
 });
 it('stops an automatic effect update loop after 50 updates',async()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});const{root}=mount(()=>{const[n,set]=useState(0);useEffect(()=>{set(n+1);});return h('p',{},n);});
  await tick(120);expect(root.error.message).toMatch(/50 updates/);expect(root.hooks[0].value).toBe(50);expect(root.pending).toBe(false);
 });
 it('blocks memo/effect/child Hooks and setters inside memo factories',()=>{
  expect(()=>useMemo(()=>1,[])).toThrow(/only allowed/);expect(()=>useEffect(()=>{},[])).toThrow(/only allowed/);
  for(const factory of [()=>useState(1),()=>useEffect(()=>{},[])]){
   const root=new FunctionComponent(()=>useMemo(factory,[]));roots.push(root);expect(()=>root.mount(document.createElement('div'))).toThrow(/only allowed/);
  }
  let set,bad=false;const{root}=mount(()=>{const[n,s]=useState(0);set=s;useMemo(()=>{if(bad)s(3);return n;},[n]);return null;});bad=true;set(2);expect(()=>root.update()).toThrow(/Setter is forbidden/);
 });
 it('detects natural Hook-kind changes before committing',()=>{
  let memo=false;const{root,host}=mount(({n})=>{if(memo)useMemo(()=>0,[]);else useState(0);return h('p',{},n);},{n:0});memo=true;root.updateProps({n:1});expect(()=>root.update()).toThrow(/Hook kind/);expect(host.textContent).toBe('0');
 });
 it('rejects malformed dependency inputs',()=>{
  const root=new FunctionComponent(()=>{useEffect(()=>{},null);return null;});roots.push(root);expect(()=>root.mount(document.createElement('div'))).toThrow(/Dependencies/);
 });
 it('ignores cleanup setters and cancels queued props across unmount/remount',async()=>{
  vi.spyOn(console,'warn').mockImplementation(()=>{});const{root,host}=mount(({label})=>{const[n,set]=useState(0);useEffect(()=>()=>set(9),[]);return h('p',{},label+n);},{label:'A'});
  root.updateProps({label:'B'});root.unmount();root.mount(host);await tick();expect(host.textContent).toBe('A0');
 });
});
