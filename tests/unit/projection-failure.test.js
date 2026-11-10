import { afterEach, describe, expect, it } from 'vitest';
import { createPhase1 } from '../../src/phase1/controller.ts';
afterEach(() => document.body.replaceChildren());
function setup() {
  const actual=document.createElement('div'), editor=document.createElement('div');
  actual.innerHTML='<label for="box">Local</label><input id="box" type="text"><p>S0</p>';
  document.body.append(actual,editor); const app=createPhase1(actual,editor);
  editor.querySelector('p').textContent='S1'; app.apply();
  const label=editor.querySelector('label'),input=editor.querySelector('input');
  label.htmlFor='renamed'; input.id='renamed';
  return {actual,editor,app,label,input};
}
const invoke=(app,method)=>method==='travel'?app.travel(0):app[method]();
function thrown(action) {try{action();}catch(error){return error;}return null;}
function postFailure(app) {return ['apply','travel','restoreDraft'].map(method=>/잠겼습니다/.test(thrown(()=>invoke(app,method))?.message||''));}
describe('QA06-005 projection mutation error boundary',()=>{
  it.each(['apply','travel','restoreDraft'])('%s locks after label projection succeeds and input ID write fails',method=>{
    const {actual,editor,app,label,input}=setup();
    const original=input.setAttribute, injected=new Error('Injected projection write failure');
    const actualBefore=actual.innerHTML, entries=app.history.entries,cursor=app.history.cursor;
    input.setAttribute=function(name,value){if(name==='id')throw injected;return original.call(this,name,value);};
    const observer=new MutationObserver(()=>{});observer.observe(editor,{attributes:true,subtree:true,childList:true});
    const error=thrown(()=>invoke(app,method)); const mutations=observer.takeRecords();observer.disconnect();
    const summary={errorIdentity:error===injected,partialLabel:label.htmlFor!=='renamed',inputStillRaw:input.id==='renamed',onlyFirstWrite:mutations.length===1&&mutations[0].target===label&&mutations[0].attributeName==='for',actualStable:actual.innerHTML===actualBefore,historyStable:app.history.cursor===cursor&&app.history.entries.length===entries.length&&app.history.entries.every((entry,i)=>entry===entries[i]),locked:app.locked};
    input.setAttribute=original;summary.blockedAfterRemoval=postFailure(app);
    expect(summary).toEqual({errorIdentity:true,partialLabel:true,inputStillRaw:true,onlyFirstWrite:true,actualStable:true,historyStable:true,locked:true,blockedAfterRemoval:[true,true,true]});
  });
  it.each(['travel','restoreDraft'])('%s protects preparation errors after projection writes',method=>{
    const {actual,editor,app,label,input}=setup(), original=app.editScope.readAttrs;
    const injected=new Error('Injected post-projection read failure'),before=actual.innerHTML,entries=app.history.entries,cursor=app.history.cursor;
    app.editScope.readAttrs=node=>{if(node===input&&input.id!=='renamed')throw injected;return original(node);};
    const error=thrown(()=>invoke(app,method));
    const result={errorIdentity:error===injected,projected:label.htmlFor!=='renamed'&&input.id!=='renamed',locked:app.locked,actualStable:actual.innerHTML===before,historyStable:app.history.cursor===cursor&&app.history.entries.every((entry,i)=>entry===entries[i])};
    app.editScope.readAttrs=original;result.blockedAfterRemoval=postFailure(app);
    expect(result).toEqual({errorIdentity:true,projected:true,locked:true,actualStable:true,historyStable:true,blockedAfterRemoval:[true,true,true]});
  });
});
describe('QA06-005 read-only rejection remains unlocked',()=>{
  it.each(['apply','travel','restoreDraft'])('%s invalid candidate preserves both DOMs/cursor and can be retried',method=>{
    const {actual,editor,app,input}=setup();input.id='';
    const before=[actual.innerHTML,editor.innerHTML],cursor=app.history.cursor,entries=app.history.entries;
    const observer=new MutationObserver(()=>{});observer.observe(document.body,{attributes:true,childList:true,characterData:true,subtree:true});
    expect(()=>invoke(app,method)).toThrow(/ID must/);expect(observer.takeRecords()).toEqual([]);observer.disconnect();
    expect([actual.innerHTML,editor.innerHTML]).toEqual(before);expect(app.history.cursor).toBe(cursor);expect(app.history.entries).toEqual(entries);expect(app.locked).toBe(false);
    input.id='renamed';expect(()=>invoke(app,method)).not.toThrow();
  });
  it.each(['apply','travel'])('%s actual preflight rejection happens before projection without locking',method=>{
    const {actual,editor,app}=setup();actual.querySelector('input').setAttribute('title','external');
    const before=[actual.innerHTML,editor.innerHTML],cursor=app.history.cursor;
    const observer=new MutationObserver(()=>{});observer.observe(document.body,{attributes:true,childList:true,characterData:true,subtree:true});
    expect(()=>invoke(app,method)).toThrow(/External DOM change/);expect(observer.takeRecords()).toEqual([]);observer.disconnect();
    expect([actual.innerHTML,editor.innerHTML]).toEqual(before);expect(app.history.cursor).toBe(cursor);expect(app.locked).toBe(false);
    actual.querySelector('input').removeAttribute('title');expect(()=>invoke(app,method)).not.toThrow();
  });
});
