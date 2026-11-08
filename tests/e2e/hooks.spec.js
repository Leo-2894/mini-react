import {test,expect} from '@playwright/test';
test('R03/R05 browser effects observe patched DOM, clean up and defer state updates',async({page})=>{
 await page.goto('/phase1/');
 const result=await page.evaluate(async()=>{
  const{FunctionComponent}=await import('/src/mini-react/component.js');const{useState,useEffect,useMemo}=await import('/src/mini-react/hooks.js');const{h}=await import('/src/mini-react/vnode.js');
  const host=document.createElement('div');document.body.append(host);const log=[];let computations=0;
  const root=new FunctionComponent(()=>{const[n,set]=useState(0);const value=useMemo(()=>{computations++;return 'v'+n;},[n]);useEffect(()=>{log.push('s:'+host.textContent);if(n===0)set(1);return()=>log.push('c:'+n);},[n]);return h('output',{},value);});root.mount(host);
  await Promise.resolve();const text=host.textContent;root.unmount();return{text,log,computations};
 });expect(result).toEqual({text:'v1',log:['s:v0','c:0','s:v1','c:1'],computations:2});
});
