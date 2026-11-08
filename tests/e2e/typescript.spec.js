import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
test('TypeScript build serves current generated JS and no TS source',async({request,page})=>{
 const infoResponse=await request.get('/build-info.json');expect(infoResponse.status()).toBe(200);const info=await infoResponse.json();
 const productFiles=readdirSync('src',{recursive:true}).filter(name=>String(name).endsWith('.ts')).map(name=>'src/'+String(name).split(path.sep).join('/')).sort();
 expect(productFiles.length).toBeGreaterThanOrEqual(19);expect(readdirSync('src',{recursive:true}).filter(name=>String(name).endsWith('.js'))).toEqual([]);
 expect(Object.keys(info.sourceHashes).sort()).toEqual(productFiles);expect(info.typescript).toBe(JSON.parse(readFileSync('package.json','utf8')).devDependencies.typescript);
 for(const name of productFiles)expect(info.sourceHashes[name],name).toBe(createHash('sha256').update(readFileSync(name)).digest('hex'));
 for(const name of ['/src/main.js','/src/phase1/main.js','/src/mini-react/renderer.js']){
  const result=await request.get(name);expect(result.status()).toBe(200);expect(result.headers()['content-type']).toContain('javascript');
 }
 expect((await request.get('/src/main.ts')).status()).toBe(404);
 await page.goto('/');await expect(page.getByRole('combobox',{name:'HTTP method'})).toBeVisible();
 await page.goto('/phase1/');await expect(page.getByRole('heading',{name:'변경만 찾고, 필요한 곳만.'})).toBeVisible();
});
