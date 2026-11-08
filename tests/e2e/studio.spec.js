import { test, expect } from '@playwright/test';
const base='http://127.0.0.1:4174';
const urlInput=page=>page.getByRole('textbox',{name:'Request URL',exact:true});
const sendButton=page=>page.getByRole('button',{name:/Send request/});
async function send(page,url,method='GET') {await page.getByRole('combobox',{name:'HTTP method'}).selectOption(method);await urlInput(page).fill(url);await sendButton(page).click();}
async function raw(page) {await page.getByRole('tab',{name:'Raw',exact:true}).click();return page.getByLabel('Response body',{exact:true}).textContent();}
test.beforeEach(async({page})=>{await page.goto('/');});
for(const method of ['GET','POST','PUT','PATCH','DELETE'])test('A03 actual HTTP '+method+' query/header/body arrives at loopback',async({page})=>{
 await page.getByRole('combobox',{name:'HTTP method'}).selectOption(method);
 if(method!=='GET'){await page.getByRole('tab',{name:'Body',exact:true}).click();await page.getByRole('textbox',{name:'JSON request body'}).fill('{"hello":"world"}');}
 await page.getByRole('tab',{name:'Headers',exact:true}).click();await page.getByRole('button',{name:'+ Add header',exact:true}).click();await page.getByRole('textbox',{name:'header key 1',exact:true}).fill('X-Test');await page.getByRole('textbox',{name:'header value 1',exact:true}).fill('hello');
 await send(page,base+'/echo?q=a%20b',method);await expect(page.getByTestId('http-status')).toContainText('200');
 const result=JSON.parse(await raw(page));expect(result.method).toBe(method);expect(result.query).toEqual([['q','a b']]);expect(result.headers['x-test']).toBe('hello');expect(result.body).toBe(method==='GET'?'':'{"hello":"world"}');
});
test('A03 duplicate params and disabled rows use current input values',async({page})=>{
 await page.getByRole('button',{name:'+ Add parameter',exact:true}).click();await page.getByRole('textbox',{name:'parameter key 1',exact:true}).fill('q');await page.getByRole('textbox',{name:'parameter value 1',exact:true}).fill('a&b');
 await page.getByRole('button',{name:'+ Add parameter',exact:true}).click();await page.getByRole('textbox',{name:'parameter key 2',exact:true}).fill('q');await page.getByRole('textbox',{name:'parameter value 2',exact:true}).fill('한 글');
 await page.getByRole('button',{name:'+ Add parameter',exact:true}).click();await page.getByRole('checkbox',{name:'parameter enabled 3',exact:true}).uncheck();
 await send(page,base+'/echo?existing=a%20b');await expect(page.getByTestId('http-status')).toBeVisible();expect(JSON.parse(await raw(page)).query).toEqual([['existing','a b'],['q','a&b'],['q','한 글']]);
});
test('A05 privacy masks headers; History reuses safe metadata without sending or keeping secrets',async({page})=>{
 await page.getByRole('tab',{name:'Headers',exact:true}).click();await page.getByRole('button',{name:'+ Add header',exact:true}).click();await page.getByRole('textbox',{name:'header key 1',exact:true}).fill('Authorization');
 const secret=page.getByLabel('header value 1',{exact:true});await secret.fill('Bearer private-token');await expect(secret).toHaveAttribute('type','password');
 await page.getByRole('tab',{name:'Body',exact:true}).click();await page.getByRole('combobox',{name:'HTTP method'}).selectOption('POST');await page.getByRole('textbox',{name:'JSON request body'}).fill('{"password":"private-body"}');
 await send(page,base+'/echo?token=private-query','POST');await expect(page.getByTestId('http-status')).toBeVisible();
 await page.getByRole('tab',{name:'Response headers',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Response headers'})).toContainText('[masked]');await expect(page.getByRole('tabpanel',{name:'Response headers'})).not.toContainText('response-secret');
 const history=await page.evaluate(async()=>{const{root}=await import('/src/main.js');return root.hooks[0].value.history;});expect(history).toHaveLength(1);expect(JSON.stringify(history)).not.toMatch(/private|Authorization|password|response-secret/);
 let requests=0;page.on('request',request=>{if(request.url().startsWith(base))requests++;});await page.getByRole('button',{name:'Reuse POST '+base+'/echo',exact:true}).click();
 await expect(urlInput(page)).toHaveValue(base+'/echo');await expect(page.getByRole('textbox',{name:'JSON request body'})).toHaveValue('');expect(requests).toBe(0);
 await page.getByRole('tab',{name:'Headers',exact:true}).click();await expect(page.getByRole('textbox',{name:'header key 1',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(0);expect(await page.evaluate(()=>localStorage.length)).toBe(0);
});
for(const status of [400,500,204])test('A03 HTTP '+status+' remains a response',async({page})=>{
 await send(page,base+'/status/'+status);await expect(page.getByTestId('http-status')).toContainText(String(status));await expect(page.getByRole('alert')).toHaveCount(0);
 if(status===204)await expect(page.getByRole('tabpanel',{name:'JSON / Body'})).toContainText('No response body');
});
test('A05 invalid JSON/text/HTML stay inspectable without executing markup',async({page})=>{
 await send(page,base+'/invalid-json');await expect(page.getByTestId('http-status')).toBeVisible();await expect(page.getByText('올바른 JSON이 아닙니다. 원문을 표시합니다.')).toBeVisible();expect(await raw(page)).toBe('{broken');
 await send(page,base+'/text');await expect(page.getByTestId('http-status')).toBeVisible();expect(await raw(page)).toBe('<script>window.serverExecuted=true</script>');expect(await page.evaluate(()=>window.serverExecuted)).toBeUndefined();
});
test('A04 slow A then fast B preserves only the latest result and History',async({page})=>{
 const first=page.waitForRequest(request=>request.url().includes('/slow')&&request.url().includes('tag=A'));await send(page,base+'/slow?delay=350&tag=A');await first;
 await send(page,base+'/slow?delay=20&tag=B');await expect(page.getByTestId('http-status')).toBeVisible();expect(JSON.parse(await raw(page)).tag).toBe('B');await page.waitForTimeout(450);expect(JSON.parse(await raw(page)).tag).toBe('B');await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(1);
});
test('A04 cancel and unmount reject late completions',async({page})=>{
 const first=page.waitForRequest('**/slow?delay=250*');await send(page,base+'/slow?delay=250');await first;await page.getByRole('button',{name:'Cancel request',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Request cancelled');await page.waitForTimeout(300);await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(0);
 await send(page,base+'/slow?delay=250');await page.evaluate(async()=>{const{root}=await import('/src/main.js');root.unmount();});await page.waitForTimeout(300);expect(await page.locator('#app').evaluate(host=>host.childNodes.length)).toBe(0);
});
test('A03 browser CORS failure is explained and a following request succeeds',async({page})=>{
 await send(page,'http://127.0.0.1:4175/echo');await expect(page.getByRole('alert')).toContainText('CORS');await expect(page.getByRole('alert')).toContainText('Connection failed');
 await send(page,base+'/echo');await expect(page.getByTestId('http-status')).toContainText('200');
});
test('A04 real timeout is distinguished and does not block retry',async({page})=>{
 await page.evaluate(async()=>{const{root}=await import('/src/main.js');root.updateProps({timeout:20});});await send(page,base+'/slow?delay=200');await expect(page.getByRole('alert')).toContainText('Request timed out');await send(page,base+'/echo');await expect(page.getByTestId('http-status')).toContainText('200');
});
test('A05 JSON tree toggles, long text caps, input caret and keyboard send work',async({page})=>{
 await page.getByRole('tab',{name:'Headers',exact:true}).click();await page.getByRole('button',{name:'+ Add header',exact:true}).click();await page.getByRole('textbox',{name:'header key 1',exact:true}).fill('X-Test');const input=page.getByRole('textbox',{name:'header value 1',exact:true});await input.fill('abcdef');
 await input.evaluate(node=>{window.inputReference=node;node.focus();node.setSelectionRange(2,4);});await input.press('Z');await expect(input).toHaveValue('abZef');expect(await input.evaluate(node=>({same:node===window.inputReference,focus:node===document.activeElement,caret:[node.selectionStart,node.selectionEnd]}))).toEqual({same:true,focus:true,caret:[3,3]});
 await urlInput(page).fill(base+'/nested');await urlInput(page).press('Control+Enter');await expect(page.getByTestId('http-status')).toBeVisible();await page.getByRole('button',{name:'Toggle b',exact:true}).click();await expect(page.getByLabel('JSON tree')).toContainText('true');await expect(page.locator('img')).toHaveCount(0);
 await send(page,base+'/large');await expect(page.getByTestId('http-status')).toBeVisible();expect((await raw(page)).length).toBe(100000);await expect(page.getByText(/응답을 100,000자까지/)).toBeVisible();
});
test('A05 mobile viewport fits and normal workflows have no console errors',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});await page.setViewportSize({width:390,height:844});await page.reload();await send(page,base+'/echo');await expect(page.getByTestId('http-status')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('navigation',{name:'Recent requests'})).toBeVisible();await page.getByRole('button',{name:'Reuse GET '+base+'/echo',exact:true}).click();await expect(urlInput(page)).toHaveValue(base+'/echo');expect(errors).toEqual([]);
});
