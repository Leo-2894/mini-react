import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4174';
const input=page=>page.getByRole('textbox',{name:'Request URL',exact:true});
const submit=page=>page.getByRole('button',{name:/Send request/});
async function send(page,url){await input(page).fill(url);await submit(page).click();await expect(page.getByTestId('http-status')).toBeVisible();}
test.beforeEach(async({page})=>page.goto('/'));
test('A06 DOM Lab links back to the product root',async({page})=>{
 await page.getByRole('link',{name:'Open DOM Lab ↗'}).click();await expect(page.getByRole('heading',{name:'변경만 찾고, 필요한 곳만.'})).toBeVisible();const back=page.getByRole('link',{name:'API STUDIO / DOM LAB'});await expect(back).toHaveAttribute('href','../');await back.click();await expect(page.getByRole('combobox',{name:'HTTP method'})).toBeVisible();
});
test('A04 stale responses are ignored even when a transport ignores AbortSignal',async({page})=>{
 await page.addInitScript(()=>{const original=window.fetch.bind(window);window.abandonedCompletions=0;window.fetch=async(url,options)=>{if(String(url).includes('tag=lateA')){const result=await original(url,{...options,signal:undefined});window.abandonedCompletions++;return result;}return original(url,options);};});await page.reload();
 await input(page).fill(base+'/slow?delay=250&tag=lateA');const first=page.waitForRequest('**/slow?delay=250&tag=lateA');await submit(page).click();await first;
 await send(page,base+'/echo?tag=freshB');await page.getByRole('tab',{name:'Raw',exact:true}).click();await page.waitForFunction(()=>window.abandonedCompletions===1);expect(JSON.parse(await page.getByLabel('Response body',{exact:true}).textContent()).tag).toBe('freshB');await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(1);
});
test('A05 actual UI History is limited to 20 and reload clears session metadata',async({page})=>{
 for(let i=0;i<22;i++){
  await input(page).fill(base+'/echo?index='+i);const response=page.waitForResponse(base+'/echo?index='+i);await submit(page).click();await response;await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(Math.min(i+1,20));
 }
 const entries=await page.evaluate(async()=>{const{root}=await import('/src/main.js');return root.hooks[0].value.history;});expect(entries).toHaveLength(20);expect(new Set(entries.map(entry=>entry.id)).size).toBe(20);expect(entries.every(entry=>entry.url===base+'/echo')).toBe(true);
 await page.reload();await expect(page.getByRole('button',{name:/^Reuse /})).toHaveCount(0);
});
test('A05 redacted History requires URL editing before a new send',async({page})=>{
 await send(page,base+'/token/private-value?secret=private-query');await page.getByRole('button',{name:/^Reuse GET .*redacted/}).click();await expect(input(page)).toHaveValue(base+'/token/[redacted]');await expect(submit(page)).toBeDisabled();await expect(page.getByText('Edit the redacted URL before sending')).toBeVisible();await send(page,base+'/echo');await expect(page.getByTestId('http-status')).toContainText('200');
});
test('A05 invalid JSON never reaches the server; row removal preserves surviving Node',async({page})=>{
 await page.getByRole('combobox',{name:'HTTP method'}).selectOption('POST');await input(page).fill(base+'/echo');await page.getByRole('tab',{name:'Body',exact:true}).click();await page.getByRole('textbox',{name:'JSON request body'}).fill('{invalid');await expect(submit(page)).toBeDisabled();await expect(page.getByText('Body must be valid JSON')).toBeVisible();
 await page.getByRole('textbox',{name:'JSON request body'}).fill('{}');await page.getByRole('tab',{name:'Params',exact:true}).click();
 for(let i=1;i<=2;i++){await page.getByRole('button',{name:'+ Add parameter',exact:true}).click();await page.getByRole('textbox',{name:'parameter key '+i,exact:true}).fill('key'+i);}
 await page.getByRole('textbox',{name:'parameter key 2',exact:true}).evaluate(node=>window.survivingRow=node);await page.getByRole('button',{name:'Remove parameter row 1',exact:true}).click();const survivor=page.getByRole('textbox',{name:'parameter key 1',exact:true});await expect(survivor).toHaveValue('key2');expect(await survivor.evaluate(node=>node===window.survivingRow)).toBe(true);
 await submit(page).click();await expect(page.getByTestId('http-status')).toContainText('200');
});
test('A06 static root works while internal and outside paths stay inaccessible',async({request})=>{
 expect((await request.get('/')).status()).toBe(200);expect((await request.get('/.git/config')).status()).toBe(404);expect((await request.get('/%2e%2e%2fpackage.json')).status()).toBe(404);
});
