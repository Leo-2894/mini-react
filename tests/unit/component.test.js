import { afterEach, describe, expect, it, vi } from 'vitest';
import { FunctionComponent } from '../../src/mini-react/component.ts';
import { useState } from '../../src/mini-react/hooks.ts';
import { h } from '../../src/mini-react/vnode.ts';
const roots = [];
const tick = () => Promise.resolve();
function mount(App, props) {
  const host = document.createElement('div'); document.body.append(host);
  const root = new FunctionComponent(App, props); roots.push(root); root.mount(host);
  return { root, host };
}
afterEach(() => { for (const root of roots.splice(0)) root.unmount(); document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('R01 root FunctionComponent and useState', () => {
  it('preserves independent slots, lazy initialization and setter identity while batching +3', async () => {
    let setCount, setName, initialize = 0, renders = 0; const setters = [];
    const {root, host} = mount(() => {
      const [count, countSetter] = useState(() => { initialize++; return 2; });
      const [name, nameSetter] = useState('A'); setCount=countSetter; setName=nameSetter; setters.push(countSetter); renders++;
      return h('p', {}, name, ':', count);
    });
    setCount(n=>n+1); setCount(n=>n+1); setCount(n=>n+1); setName('B');
    expect(host.textContent).toBe('A:2'); expect(root.pending).toBe(true);
    await tick(); expect(host.textContent).toBe('B:5'); expect(renders).toBe(2);
    expect(initialize).toBe(1); expect(setters[0]).toBe(setters[1]); expect(root.hooks.map(s=>s.value)).toEqual([5,'B']);
  });
  it('reduces replacement/updater queues in call order and stores functions through an updater', async () => {
    let set; const fn=()=>9;
    const {root}=mount(()=>{const [value,setter]=useState(0);set=setter;return h('p',{},typeof value==='function'?'fn':value);});
    set(4);set(n=>n+2);set(10);set(n=>n*2);await tick();expect(root.hooks[0].value).toBe(20);
    set(()=>fn);await tick();expect(root.hooks[0].value).toBe(fn);
  });
  it('uses Object.is for NaN and signed zero and skips render/DOM writes on final no-op', async () => {
    let set,renders=0; const {host}=mount(()=>{const [n,s]=useState(NaN);set=s;renders++;return h('p',{},String(n));});
    const observer=new MutationObserver(()=>{});observer.observe(host,{subtree:true,attributes:true,characterData:true,childList:true});
    set(NaN);set(n=>n);await tick();expect(renders).toBe(1);expect(observer.takeRecords()).toEqual([]);
    set(-0);await tick();set(0);await tick();expect(renders).toBe(3);observer.disconnect();
  });
  it('batches props and state through the same renderer and reuses keyed stateless children', async () => {
    let set,renders=0;const Child=({value})=>h('span',{},value);
    const {root,host}=mount(({prefix})=>{const [n,s]=useState(0);set=s;renders++;return h('section',{},h(Child,{key:'child',value:prefix+n}),h('input',{key:'stable',props:{value:'abcdef'}}));},{prefix:'A'});
    const span=host.querySelector('span'),input=host.querySelector('input');input.focus();input.setSelectionRange(2,4);
    root.updateProps({prefix:'B'});set(3);await tick();
    expect(host.querySelector('span')).toBe(span);expect(span.textContent).toBe('B3');expect(host.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,4]);expect(renders).toBe(2);
    root.updateProps(root.props);await tick();expect(renders).toBe(2);
  });
  it('keeps two roots independent and allows null output', async () => {
    const sets=[];function App(){const [n,s]=useState(0);sets.push(s);return n?h('b',{},n):null;}
    const a=mount(App),b=mount(App);sets[0](1);await tick();expect(a.host.textContent).toBe('1');expect(b.host.textContent).toBe('');
    expect(a.root.hooks).not.toBe(b.root.hooks);
  });
});

describe('R02 Hook rules, errors and lifetime', () => {
  it('rejects Hooks outside the root, in event callbacks and inside h(Child)', () => {
    expect(()=>useState(0)).toThrow(/only allowed/);
    let event;mount(()=>{event=()=>useState(0);return h('p');});expect(event).toThrow(/only allowed/);
    const host=document.createElement('div'), root=new FunctionComponent(()=>h(()=>{useState(0);return h('p');}));roots.push(root);
    expect(()=>root.mount(host)).toThrow(/only allowed/);expect(host.childNodes).toHaveLength(0);
  });
  it('restores Hook permissions after evaluating a pure nested child and forwards children/key', () => {
    const Child=({children})=>h('div',{},children);
    const {root,host}=mount(()=>{const child=h(Child,{key:'c'},'text');useState(7);return child;});
    expect(root.hooks).toHaveLength(1);expect(host.textContent).toBe('text');expect(host.firstChild.getAttribute('data-key')).toBe('c');
  });
  it.each([true,false])('rejects changed Hook count before committing (initial extra=%s)', initial => {
    let extra=initial,set;const {root,host}=mount(()=>{const[n,s]=useState(1);set=s;if(extra)useState(2);return h('p',{},n);});
    const before=root.hooks,node=host.firstChild;extra=!extra;set(9);
    expect(()=>root.update()).toThrow(/Hook.*changed/);expect(root.hooks).toBe(before);expect(host.firstChild).toBe(node);expect(host.textContent).toBe('1');
    extra=initial;root.update();expect(root.hooks[0].value).toBe(1);expect(root.error).toBeNull();
  });
  it('checks existing Hook kind before a DOM commit', () => {
    let set;const {root,host}=mount(()=>{const[n,s]=useState(1);set=s;return h('p',{},n);});
    root.hooks[0].kind='memo';set(2);expect(()=>root.update()).toThrow(/Hook kind/);expect(host.textContent).toBe('1');
  });
  it('rejects render setters without changing committed state/UI', () => {
    let set,bad=false;const {root,host}=mount(()=>{const[n,s]=useState(1);set=s;if(bad)s(4);return h('p',{},n);});
    bad=true;set(2);const hooks=root.hooks;expect(()=>root.update()).toThrow(/Setter is forbidden/);expect(root.hooks).toBe(hooks);expect(host.textContent).toBe('1');
  });
  it('rejects Hook calls in a lazy initializer and updater', () => {
    const host=document.createElement('div'),root=new FunctionComponent(()=>{useState(()=>useState(0));return null;});roots.push(root);
    expect(()=>root.mount(host)).toThrow(/only allowed/);
    let set;const fixture=mount(()=>{const[n,s]=useState(1);set=s;return h('p',{},n);});set(()=>useState(2));expect(()=>fixture.root.update()).toThrow(/only allowed/);expect(fixture.host.textContent).toBe('1');
  });
  it('discards failed queues and allows an explicit render retry without automatic retries', async () => {
    let set,fail=false,renders=0;const error=new Error('render failed');const logged=vi.spyOn(console,'error').mockImplementation(()=>{});
    const {root,host}=mount(()=>{const[n,s]=useState(1);set=s;renders++;if(fail)throw error;return h('p',{},n);});const hooks=root.hooks;
    fail=true;set(9);await tick();expect(root.error).toBe(error);expect(root.hooks).toBe(hooks);expect(host.textContent).toBe('1');
    await tick();expect(renders).toBe(2);expect(logged).toHaveBeenCalledTimes(1);expect(()=>set(3)).toThrow(/explicitly/);
    fail=false;root.update();expect(root.error).toBeNull();expect(root.hooks[0].value).toBe(1);
  });
  it('rejects an invalid VNode before publishing state or props', () => {
    let set;const {root,host}=mount(({bad})=>{const[n,s]=useState(1);set=s;return bad?{kind:'bad'}:h('p',{},n);},{bad:false});
    const props=root.props,hooks=root.hooks;root.updateProps({bad:true});set(3);expect(()=>root.update()).toThrow();
    expect(root.props).toBe(props);expect(root.hooks).toBe(hooks);expect(host.textContent).toBe('1');
  });
  it('clears listeners, ignores scheduled work and invalidates stale setters across remounts', async () => {
    vi.spyOn(console,'warn').mockImplementation(()=>{});let set,calls=0;
    const {root,host}=mount(()=>{const[n,s]=useState(0);set=s;return h('button',{events:{click:()=>calls++}},n);});const button=host.firstChild,oldSetter=set;
    set(2);root.unmount();button.click();await tick();expect(calls).toBe(0);expect(host.childNodes).toHaveLength(0);
    oldSetter(7);expect(root.pending).toBe(false);root.unmount();root.mount(host);oldSetter(8);await tick();expect(host.textContent).toBe('0');
  });
  it('validates mount lifetime and empty-host ownership', () => {
    const {root,host}=mount(()=>h('p'));expect(()=>root.mount(host)).toThrow(/already mounted/);
    const second=new FunctionComponent(()=>null);expect(()=>second.mount(host)).toThrow(/empty host/);expect(()=>new FunctionComponent(null)).toThrow(/root function/);
  });
  it('rejects nested setter calls in an updater', () => {
    let set;const {root,host}=mount(()=>{const[n,s]=useState(0);set=s;return h('p',{},n);});set(()=>{set(5);return 3;});expect(()=>root.update()).toThrow(/Setter is forbidden/);expect(host.textContent).toBe('0');
  });
});
