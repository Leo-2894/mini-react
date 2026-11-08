import {test,expect} from '@playwright/test';
for(const slash of ['%2F','%2f'])test('QA12-001 History and Reuse redact encoded slash '+slash,async({page})=>{
 await page.goto('/');
 const url='http://127.0.0.1:4174/session/abcdefghijklmnopqrstuvwx'+slash+'abc?secret=fake-query';
 const input=page.getByRole('textbox',{name:'Request URL',exact:true});
 await input.fill(url);await page.getByRole('button',{name:/Send request/}).click();await expect(page.getByTestId('http-status')).toContainText('200');
 const entry=await page.evaluate(async()=>{const{root}=await import('/src/main.js');return root.hooks[0].value.history[0];});
 const button=page.getByRole('button',{name:/^Reuse GET /});await expect(button).toHaveCount(1);const label=await button.getAttribute('aria-label');await button.click();
 const result={storedURL:entry.url,label,reusedURL:await input.inputValue(),disabled:await page.getByRole('button',{name:/Send request/}).isDisabled(),tokenAbsent:!JSON.stringify(entry).includes('abcdefghijklmnopqrstuvwx')};
 console.log(slash,JSON.stringify(result));
 expect(result).toEqual({storedURL:'http://127.0.0.1:4174/session/[redacted]',label:'Reuse GET http://127.0.0.1:4174/session/[redacted]',reusedURL:'http://127.0.0.1:4174/session/[redacted]',disabled:true,tokenAbsent:true});
});
