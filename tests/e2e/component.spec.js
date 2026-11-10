import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/phase1/');});
test('R01 real state batching uses shared patch and retains input focus/caret/Node',async({page})=>{
  await page.evaluate(async()=>{
    const {FunctionComponent}=await import('/src/mini-react/component.js');const {useState}=await import('/src/mini-react/hooks.js');const {h}=await import('/src/mini-react/vnode.js');
    const host=document.createElement('div');document.body.append(host);window.runtimeHost=host;window.renders=0;
    const Child=({n})=>h('output',{},n);
    window.root=new FunctionComponent(()=>{const[n,s]=useState(0);window.setCount=s;window.renders++;return h('section',{},h('label',{},'Runtime input',h('input',{key:'input',props:{value:'abcdef'}})),h(Child,{key:'child',n}),h('button',{events:{click:()=>{s(x=>x+1);s(x=>x+1);s(x=>x+1);}}},'Runtime +3'));});window.root.mount(host);window.originalInput=host.querySelector('input');
  });
  await page.getByRole('button',{name:'Runtime +3',exact:true}).click();await expect(page.locator('output')).toHaveText('3');
  await page.getByRole('textbox',{name:'Runtime input',exact:true}).focus();
  await page.evaluate(()=>{window.originalInput.setSelectionRange(2,4);window.setCount(7);});await expect(page.locator('output')).toHaveText('7');
  expect(await page.evaluate(()=>({same:window.runtimeHost.querySelector('input')===window.originalInput,focus:document.activeElement===window.originalInput,caret:[window.originalInput.selectionStart,window.originalInput.selectionEnd],renders:window.renders}))).toEqual({same:true,focus:true,caret:[2,4],renders:3});
});
test('R02 failed conditional Hook render leaves committed UI/state untouched',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {FunctionComponent}=await import('/src/mini-react/component.js');const {useState}=await import('/src/mini-react/hooks.js');const {h}=await import('/src/mini-react/vnode.js');
    const host=document.createElement('div');document.body.append(host);let extra=false,set;
    const root=new FunctionComponent(()=>{const[n,s]=useState(1);set=s;if(extra)useState(2);return h('p',{},n);});root.mount(host);const node=host.firstChild,hooks=root.hooks;extra=true;set(8);let error='';try{root.update();}catch(cause){error=cause.message;}
    const result={error:/Hook.*changed/.test(error),sameNode:host.firstChild===node,sameHooks:root.hooks===hooks,text:host.textContent,state:root.hooks[0].value};root.unmount();return result;
  });expect(result).toEqual({error:true,sameNode:true,sameHooks:true,text:'1',state:1});
});
test('R02 unmount invalidates queued state and detaches native listeners',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {FunctionComponent}=await import('/src/mini-react/component.js');const {useState}=await import('/src/mini-react/hooks.js');const {h}=await import('/src/mini-react/vnode.js');
    const host=document.createElement('div');document.body.append(host);let set,calls=0;
    const root=new FunctionComponent(()=>{const[n,s]=useState(0);set=s;return h('button',{events:{click:()=>calls++}},n);});root.mount(host);const old=host.firstChild;set(9);root.unmount();old.click();await Promise.resolve();return {children:host.childNodes.length,calls,pending:root.pending};
  });expect(result).toEqual({children:0,calls:0,pending:false});
});
