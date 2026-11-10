import { afterEach, it, expect } from 'vitest';
import { h, tree } from '../../src/mini-react/vnode.ts';
import { readTree, domToVNode, createDOM } from '../../src/mini-react/dom.ts';
import { createDOMScope, IDREF_ATTRS } from '../../src/mini-react/scope.ts';
import { createRenderer } from '../../src/mini-react/renderer.ts';
import { createPhase1 } from '../../src/phase1/controller.ts';
afterEach(() => document.body.replaceChildren());
it.each(['checkbox', 'radio', 'text'])('QA06-003 native %s label/control/labels remain within each host', type => {
  const actual = document.createElement('div'), edit = document.createElement('div');
  actual.innerHTML = `<label for="box"><span>Local name</span></label><input id="box" type="${type}">`;
  document.body.append(actual,edit); const original = actual.lastChild;
  const app = createPhase1(actual,edit);
  for (const host of [actual,edit]) {
    expect(host.querySelector('label').control).toBe(host.querySelector('input'));
    expect([...host.querySelector('input').labels]).toEqual([host.querySelector('label')]);
  }
  expect(actual.lastChild).toBe(original);
  expect(actual.lastChild.id).not.toBe(edit.lastChild.id);
  expect(app.history.current.tree.children[1].attrs.id).toBe('box');
});

function setup(markup = '<label for="box">Name</label><input id="box" type="text"><span id="caption">Caption</span>') {
  const actual=document.createElement('div'), edit=document.createElement('div'); actual.innerHTML=markup; document.body.append(actual,edit);
  const app=createPhase1(actual,edit); return {actual,edit,app};
}
it('preserves independent literal logical id/for/IDREF values and whitespace, while native refs differ',()=>{
  const value='caption \t box';
  const {actual,edit,app}=setup('<label for="box">Name</label><input id="box" type="text" aria-labelledby="caption \t box" aria-hidden="false"><span id="caption">Caption</span>');
  for (const [host,scope] of [[actual,app.actualScope],[edit,app.editScope]]) {
    const logical=readTree(host,scope);
    expect(logical.children[0].attrs).toEqual({for:'box'});
    expect(logical.children[1].attrs).toEqual({id:'box',type:'text','aria-labelledby':value,'aria-hidden':'false'});
    const physical=host.querySelector('input').getAttribute('aria-labelledby').split(/[ \t]+/);
    expect(physical).toEqual([host.querySelector('span').id,host.querySelector('input').id]);
    expect(host.querySelector('input').getAttribute('aria-hidden')).toBe('false');
  }
  expect(app.history.current.tree.children[1].attrs.id).toBe('box');
});
it('maps every documented IDREF token while preserving normal aria strings',()=>{
  const host=document.createElement('div'); document.body.append(host); const scope=createDOMScope(host), renderer=createRenderer(host,{scope});
  const refs=Object.fromEntries(IDREF_ATTRS.map(name=>[name,name==='for'||name==='aria-activedescendant'?'target':'target \t missing']));
  renderer.render(tree(h('div',{attrs:{id:'target'}}),h('label',{attrs:{...refs,'aria-label':'Literal name','aria-expanded':'false'}})));
  const label=host.lastChild;
  for (const name of IDREF_ATTRS) {
    expect(label.getAttribute(name).split(/[ \t]+/)[0]).toBe(host.firstChild.id);
    expect(domToVNode(label,scope).attrs[name]).toBe(refs[name]);
  }
  expect(label.getAttribute('aria-label')).toBe('Literal name'); expect(label.getAttribute('aria-expanded')).toBe('false');
});
it('reads raw user logical edits without stale overwrite, and restores them through History',()=>{
  const {actual,edit,app}=setup(); const source=actual.querySelector('input');
  edit.querySelector('input').id='next'; edit.querySelector('label').htmlFor='next';
  edit.querySelector('input').setAttribute('aria-describedby','caption');
  app.apply(); expect(app.history.current.tree.children[1].attrs.id).toBe('next');
  expect(actual.querySelector('input')).toBe(source); expect(edit.querySelector('label').control).toBe(edit.querySelector('input'));
  app.travel(0); expect(readTree(edit,app.editScope).children[1].attrs.id).toBe('box');
  app.travel(1); expect(readTree(actual,app.actualScope).children[1].attrs.id).toBe('next');
  edit.querySelector('input').removeAttribute('id'); edit.querySelector('label').removeAttribute('for'); app.apply();
  expect(actual.querySelector('input').hasAttribute('id')).toBe(false); expect(actual.querySelector('label').control).toBeNull();
  app.travel(1); expect(actual.querySelector('label').control).toBe(source);
});
it('rejects empty/duplicate logical IDs before managed writes',()=>{
  const {actual,edit,app}=setup(); const before=actual.innerHTML, cursor=app.history.cursor;
  edit.querySelector('input').id=''; expect(()=>app.apply()).toThrow(/ID must/); expect(actual.innerHTML).toBe(before);
  edit.querySelector('input').id='caption'; expect(()=>app.apply()).toThrow(/Duplicate logical ID/);
  expect(app.history.cursor).toBe(cursor); expect(actual.innerHTML).toBe(before);
});
it.each(['id','for','aria-describedby'])('rejects foreign physical %s before writes or cursor movement',name=>{
  const {actual,edit,app}=setup();
  edit.querySelector('input').setAttribute('aria-describedby','caption'); app.apply();
  const node=name==='for'?actual.querySelector('label'):actual.querySelector('input');
  node.setAttribute(name,'outside'); const beforeA=actual.innerHTML,beforeE=edit.innerHTML,cursor=app.history.cursor;
  expect(()=>app.travel(0)).toThrow(/External DOM change/);
  expect(actual.innerHTML).toBe(beforeA); expect(edit.innerHTML).toBe(beforeE); expect(app.history.cursor).toBe(cursor);
});
it('no-op preserves physical mapping and writes zero DOM mutations',()=>{
  const {actual,edit,app}=setup(); const ids=[actual.querySelector('input').id,edit.querySelector('input').id];
  const observer=new MutationObserver(()=>{}); observer.observe(document.body,{subtree:true,attributes:true,childList:true,characterData:true});
  expect(app.apply().changed).toBe(false); expect(observer.takeRecords()).toEqual([]); observer.disconnect();
  expect([actual.querySelector('input').id,edit.querySelector('input').id]).toEqual(ids);
});
it('logical selectors use exact IDs, attr operators, compound selectors and current edited DOM',()=>{
  const {edit,app}=setup();
  for(const selector of ['#box','[id="box"]','input[id^="bo"]']) expect(app.editScope.querySelector(selector)).toBe(edit.querySelector('input'));
  expect(app.editScope.querySelector('label[for="box"]')).toBe(edit.querySelector('label'));
  edit.querySelector('input').id='raw'; expect(app.editScope.querySelector('#raw')).toBe(edit.querySelector('input'));
  expect(app.editScope.querySelector('#box')).toBeNull();
});
it('does not strip user prefixes or decode physical-looking raw values on unowned nodes',()=>{
  const {edit,app}=setup(); const physical=edit.querySelector('input').id;
  const user=document.createElement('b'); user.id=physical; edit.append(user);
  expect(domToVNode(user,app.editScope).attrs.id).toBe(physical);
  user.id='api-dom-user'; expect(domToVNode(user,app.editScope).attrs.id).toBe('api-dom-user');
  app.apply(); expect(app.history.current.tree.children.at(-1).attrs.id).toBe('api-dom-user');
});
it('default APIs retain literal physical IDs, and scoped createDOM remains detached',()=>{
  const vnode=h('label',{attrs:{id:'literal',for:'literal-target'}},'Label');
  const plain=createDOM(vnode); expect(plain.id).toBe('literal'); expect(domToVNode(plain)).toEqual(vnode);
  const host=document.createElement('div'), scope=createDOMScope(host), scoped=createDOM(vnode,document,scope);
  expect(scoped.isConnected).toBe(false); expect(scoped.id).not.toBe('literal'); expect(domToVNode(scoped,scope)).toEqual(vnode);
});
it('external-only ID never becomes a native target in either host',()=>{
  const outside=document.createElement('input'); outside.id='outside'; document.body.append(outside);
  const {actual,edit}=setup('<label for="outside">Outside name</label><input type="text" aria-describedby="outside">');
  for(const host of [actual,edit]){expect(host.querySelector('label').control).toBeNull(); expect(host.querySelector('label').htmlFor).not.toBe('outside');}
  expect(outside.labels).toHaveLength(0);
});
