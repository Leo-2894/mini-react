import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/phase1/');await expect(page.getByRole('status')).toBeVisible();});
for(const method of ['apply','travel','restoreDraft'])test(`QA06-005 ${method} partial projection locks and rejects every subsequent action`,async({page},testInfo)=>{
  const result=await page.evaluate(async method=>{
    const {createPhase1}=await import('/src/phase1/controller.js');
    const actual=document.createElement('div'),editor=document.createElement('div');actual.innerHTML='<label for="box">Local</label><input id="box" type="text"><p>S0</p>';document.body.append(actual,editor);
    const app=createPhase1(actual,editor);editor.querySelector('p').textContent='S1';app.apply();
    const label=editor.querySelector('label'),input=editor.querySelector('input');label.htmlFor='renamed';input.id='renamed';
    const original=input.setAttribute,injected=new Error('Injected projection write failure'),before=actual.innerHTML,cursor=app.history.cursor,entries=app.history.entries;
    input.setAttribute=function(name,value){if(name==='id')throw injected;return original.call(this,name,value);};
    const invoke=method=>method==='travel'?app.travel(0):app[method]();
    const observer=new MutationObserver(()=>{});observer.observe(editor,{attributes:true,subtree:true,childList:true});
    let error;try{invoke(method);}catch(cause){error=cause;}
    const mutations=observer.takeRecords();observer.disconnect();
    const result={errorIdentity:error===injected,partialLabel:label.htmlFor!=='renamed',inputStillRaw:input.id==='renamed',onlyFirstWrite:mutations.length===1&&mutations[0].target===label&&mutations[0].attributeName==='for',actualStable:actual.innerHTML===before,historyStable:app.history.cursor===cursor&&app.history.entries.length===entries.length&&app.history.entries.every((entry,i)=>entry===entries[i]),locked:app.locked};
    input.setAttribute=original;result.blockedAfterRemoval=['apply','travel','restoreDraft'].map(action=>{try{invoke(action);return false;}catch(cause){return /잠겼습니다/.test(cause.message);}});
    return result;
  },method);
  console.log(method,JSON.stringify(result));await testInfo.attach('projection-failure-matrix',{body:JSON.stringify({method,result},null,2),contentType:'application/json'});
  expect(result).toEqual({errorIdentity:true,partialLabel:true,inputStillRaw:true,onlyFirstWrite:true,actualStable:true,historyStable:true,locked:true,blockedAfterRemoval:[true,true,true]});
});
test('QA06-005 read-only candidate/preflight failures preserve DOMs and remain unlocked',async({page})=>{
  const results=await page.evaluate(async()=>{
    const {createPhase1}=await import('/src/phase1/controller.js');const results=[];
    for(const method of ['apply','travel','restoreDraft'])for(const stage of ['candidate','preflight']){
      if(method==='restoreDraft'&&stage==='preflight')continue;
      const actual=document.createElement('div'),editor=document.createElement('div');actual.innerHTML='<label for="box">Local</label><input id="box"><p>S0</p>';document.body.append(actual,editor);
      const app=createPhase1(actual,editor);editor.querySelector('p').textContent='S1';app.apply();editor.querySelector('label').htmlFor='renamed';editor.querySelector('input').id='renamed';
      if(stage==='candidate')editor.querySelector('input').id='';else actual.querySelector('input').setAttribute('title','external');
      const before=[actual.innerHTML,editor.innerHTML],cursor=app.history.cursor;
      const observer=new MutationObserver(()=>{});observer.observe(document.body,{attributes:true,subtree:true,childList:true,characterData:true});let error='';try{if(method==='travel')app.travel(0);else app[method]();}catch(cause){error=cause.message;}
      const writes=observer.takeRecords().length;observer.disconnect();
      results.push({method,stage,rejected:stage==='candidate'?/ID must/.test(error):/External DOM change/.test(error),writes,stable:before[0]===actual.innerHTML&&before[1]===editor.innerHTML&&cursor===app.history.cursor,unlocked:!app.locked});
    }
    return results;
  });
  console.log('read-only',JSON.stringify(results));expect(results).toHaveLength(5);
  for(const {method,stage,...result}of results)expect(result,method+' '+stage).toEqual({rejected:true,writes:0,stable:true,unlocked:true});
});
