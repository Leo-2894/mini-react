import { test, expect } from '@playwright/test';
async function setup(page, markup) {
  await page.goto('/phase1/'); await expect(page.getByRole('status')).toBeVisible();
  await page.evaluate(async markup => {
    const {createPhase1} = await import('/src/phase1/controller.js');
    const actual=document.createElement('div'), edit=document.createElement('div');
    actual.dataset.fixture='actual'; edit.dataset.fixture='edit'; actual.innerHTML=markup; edit.contentEditable='true';
    document.body.append(actual,edit); const original=actual.lastChild;
    window.scopeFixture={actual,edit,original,app:createPhase1(actual,edit)};
  },markup);
}
for (const type of ['checkbox','radio','text']) test(`QA06-003 native relationships and accessible name: ${type}`, async ({page}) => {
  await setup(page,`<label for="box"><span>Local consent</span></label><input id="box" type="${type}">`);
  const native=await page.evaluate(() => {const {actual,edit}=window.scopeFixture;return [actual,edit].map(host=>({local:host.querySelector('label').control===host.querySelector('input'),labels:host.querySelector('input').labels.length}));});
  expect(native).toEqual([{local:true,labels:1},{local:true,labels:1}]);
  await expect(page.locator('[data-fixture="actual"] input')).toHaveAccessibleName('Local consent');
  await expect(page.locator('[data-fixture="edit"] input')).toHaveAccessibleName('Local consent');
});
test('QA06-003 ARIA name follows its local edited text',async({page})=>{
  await setup(page,'<span id="caption">Original caption</span><input type="text" aria-labelledby="caption">');
  await page.evaluate(()=>{window.scopeFixture.edit.querySelector('span').textContent='Edited caption';});
  await expect(page.locator('[data-fixture="actual"] input')).toHaveAccessibleName('Original caption');
  await expect(page.locator('[data-fixture="edit"] input')).toHaveAccessibleName('Edited caption');
});

test('QA06-003 logical edits, independent DOM oracle, snapshot, History and no-op',async({page})=>{
  await setup(page,'<label data-key="label" for="box">Label</label><input data-key="input" id="box" type="text" aria-labelledby="caption" aria-describedby="help"><span data-key="caption" id="caption">Caption</span><small data-key="help" id="help">Help text</small>');
  await page.evaluate(()=>{
    const {edit}=window.scopeFixture;
    edit.querySelector('input').id='renamed'; edit.querySelector('label').htmlFor='renamed';
    edit.querySelector('span').id='new-caption'; edit.querySelector('span').textContent='New caption';
    edit.querySelector('input').setAttribute('aria-labelledby','new-caption');
    window.scopeFixture.app.apply();
  });
  for(const role of ['actual','edit']) {
    await expect(page.locator(`[data-fixture="${role}"] input`)).toHaveAccessibleName('New caption');
    await expect(page.locator(`[data-fixture="${role}"] input`)).toHaveAccessibleDescription('Help text');
  }
  const oracle=await page.evaluate(()=>{
    const {actual,edit,app}=window.scopeFixture;
    // Independent oracle: data-key identifies known logical fixture IDs. No production decoder.
    const expectedIds={input:'renamed',caption:'new-caption',help:'help'};
    function shape(host) {
      const logical=new Map(Object.entries(expectedIds).map(([key,id])=>[host.querySelector(`[data-key="${key}"]`).id,id]));
      const refs=new Set(['for','aria-labelledby','aria-describedby']);
      function visit(node){
        if(node.nodeType!==1)return {type:node.nodeType,text:node.data};
        const attrs=[...node.attributes].map(a=>[a.name,a.name==='id'?logical.get(a.value):refs.has(a.name)?a.value.replace(/[^ \t\r\n]+/g,token=>logical.get(token)??token):a.value]).sort((a,b)=>a[0].localeCompare(b[0]));
        return {tag:node.tagName,attrs,children:[...node.childNodes].map(visit)};
      }
      return [...host.childNodes].map(visit);
    }
    const beforeIds=[actual.querySelector('input').id,edit.querySelector('input').id];
    const observer=new MutationObserver(()=>{}); observer.observe(document.body,{attributes:true,childList:true,characterData:true,subtree:true});
    const noop=app.apply().changed,writes=observer.takeRecords().length; observer.disconnect();
    return {shapes:[shape(actual),shape(edit)],native:[actual,edit].map(host=>host.querySelector('label').control===host.querySelector('input')),logical:app.history.current.tree.children[1].attrs,noop,writes,beforeIds,afterIds:[actual.querySelector('input').id,edit.querySelector('input').id]};
  });
  expect(oracle.shapes[0]).toEqual(oracle.shapes[1]); expect(oracle.shapes[0][0].attrs).toContainEqual(['for','renamed']); expect(oracle.shapes[0][1].attrs).toContainEqual(['id','renamed']);
  expect(oracle.native).toEqual([true,true]); expect(oracle.logical).toEqual({id:'renamed',type:'text','aria-labelledby':'new-caption','aria-describedby':'help'});
  expect(oracle.noop).toBe(false); expect(oracle.writes).toBe(0); expect(oracle.beforeIds).toEqual(oracle.afterIds);
  await page.evaluate(()=>{const {edit,app}=window.scopeFixture;edit.querySelector('input').id='draft';app.travel(0);});
  await expect(page.locator('[data-fixture="edit"] input')).toHaveAccessibleName('Caption');
  await page.evaluate(()=>window.scopeFixture.app.travel(1));
  await expect(page.locator('[data-fixture="edit"] input')).toHaveAccessibleName('New caption');
  await page.evaluate(()=>{const {edit,app}=window.scopeFixture;edit.querySelector('input').removeAttribute('id');edit.querySelector('input').removeAttribute('aria-labelledby');edit.querySelector('label').removeAttribute('for');app.apply();});
  expect(await page.evaluate(()=>{const {actual,edit}=window.scopeFixture;return [actual,edit].map(host=>[host.querySelector('input').hasAttribute('id'),host.querySelector('label').control===null]);})).toEqual([[false,true],[false,true]]);
  await page.evaluate(()=>window.scopeFixture.app.travel(1)); await expect(page.locator('[data-fixture="edit"] input')).toHaveAccessibleName('New caption');
});
test('QA06-003 external-only refs, implicit native labels and keyboard remain isolated',async({page})=>{
  await setup(page,'<label for="edit-text">External target</label><input type="text" aria-describedby="external-description"><label><span>Implicit consent</span><input type="checkbox"></label>');
  await page.evaluate(()=>{const outside=document.createElement('p');outside.id='external-description';outside.textContent='Outside secret';document.body.append(outside);});
  for(const role of ['actual','edit']) {
    await expect(page.locator(`[data-fixture="${role}"] input[type=text]`)).toHaveAccessibleDescription('');
    await expect(page.locator(`[data-fixture="${role}"] input[type=checkbox]`)).toHaveAccessibleName('Implicit consent');
  }
  expect(await page.evaluate(()=>{const {actual,edit}=window.scopeFixture;return [actual,edit].map(host=>host.querySelector('label').control===null);})).toEqual([true,true]);
  await page.locator('[data-fixture="edit"] label span').click();
  await expect(page.locator('[data-fixture="edit"] input[type=checkbox]')).toBeChecked(); await expect(page.locator('[data-fixture="actual"] input[type=checkbox]')).not.toBeChecked();
  await page.locator('[data-fixture="edit"] input[type=checkbox]').focus(); await page.keyboard.press('Space'); await expect(page.locator('[data-fixture="edit"] input[type=checkbox]')).not.toBeChecked();
});
test('QA06-003 initial source focus/caret and native label connection survive boundary setup',async({page})=>{
  await page.goto('/phase1/'); await expect(page.getByRole('status')).toBeVisible();
  const result=await page.evaluate(async()=>{
    const {createPhase1}=await import('/src/phase1/controller.js');
    const actual=document.createElement('div'),edit=document.createElement('div');actual.innerHTML='<label for="focused">Focused field</label><input id="focused" type="text" value="abcdef">';document.body.append(actual,edit);
    const original=actual.lastChild;original.focus();original.setSelectionRange(2,5,'backward');const app=createPhase1(actual,edit);
    return {identity:actual.lastChild===original,focus:document.activeElement===original,selection:[original.selectionStart,original.selectionEnd,original.selectionDirection],logical:app.history.current.tree.children[1].attrs.id,native:actual.querySelector('label').control===original};
  });
  expect(result).toEqual({identity:true,focus:true,selection:[2,5,'backward'],logical:'focused',native:true});
});
for(const attr of ['id','for','aria-labelledby']) test(`QA06-003 foreign physical ${attr} rejects before writes`,async({page})=>{
  await setup(page,'<label for="box">Local</label><input id="box" type="text" aria-labelledby="caption"><span id="caption">Caption</span>');
  const result=await page.evaluate(attr=>{
    const {actual,edit,app}=window.scopeFixture,node=attr==='for'?actual.querySelector('label'):actual.querySelector('input');
    node.setAttribute(attr,'external-value');const before=[actual.innerHTML,edit.innerHTML],cursor=app.history.cursor;
    const observer=new MutationObserver(()=>{});observer.observe(document.body,{subtree:true,attributes:true,characterData:true,childList:true});let error='';try{app.apply();}catch(cause){error=cause.message;}
    const writes=observer.takeRecords().length;observer.disconnect();return {reject:/External DOM change/.test(error),writes,stable:before[0]===actual.innerHTML&&before[1]===edit.innerHTML,cursor:app.history.cursor===cursor};
  },attr);
  expect(result).toEqual({reject:true,writes:0,stable:true,cursor:true});
});
test('QA06-003 Inspector supports logical ID/for selectors through rename and History',async({page})=>{
  await page.goto('/phase1/'); await expect(page.getByRole('status')).toBeVisible();const controls=page.locator('.inspector');
  async function attr(selector,name,value){await controls.locator('#target').fill(selector);await controls.locator('#attr-name').fill(name);await controls.locator('#attr-value').fill(value);await page.getByRole('button',{name:'속성 설정',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);}
  async function apply(){await page.getByRole('button',{name:'Patch 적용',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);}
  await attr('input','id','box');await attr('label','for','box');await apply();
  await attr('#box','title','Logical selector');await apply();await expect(page.locator('#actual-host input')).toHaveAttribute('title','Logical selector');
  await attr('[id="box"]','id','renamed');await attr('label[for="box"]','for','renamed');await apply();
  await attr('label[for="renamed"]','title','Local label');await apply();
  await page.getByRole('button',{name:'Undo',exact:true}).click();await page.getByRole('button',{name:'Redo',exact:true}).click();
  expect(await page.evaluate(()=>['actual-host','edit-host'].map(id=>{const host=document.getElementById(id);return host.querySelector('label').control===host.querySelector('input');}))).toEqual([true,true]);
  expect(await page.locator('#actual-host input').getAttribute('id')).not.toBe('renamed');
  await expect(page.locator('#edit-host label')).toHaveAttribute('title','Local label');
});

for(const type of ['checkbox','radio','text']) test(`QA06-003 native Chrome AX tree names each local ${type} once`,async({page})=>{
  await setup(page,`<label for="ax-box">Native AX name</label><input id="ax-box" type="${type}">`);
  const cdp=await page.context().newCDPSession(page);
  const {root}=await cdp.send('DOM.getDocument');
  for(const area of ['actual','edit']) {
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:`[data-fixture="${area}"] input`});
    const {node}=await cdp.send('DOM.describeNode',{nodeId});
    const {nodes}=await cdp.send('Accessibility.getPartialAXTree',{backendNodeId:node.backendNodeId,fetchRelatives:false});
    const ax=nodes.find(value=>value.backendDOMNodeId===node.backendNodeId);
    expect(ax.ignored).toBe(false); expect(ax.name.value).toBe('Native AX name'); expect(ax.role.value).toBe(type==='text'?'textbox':type);
  }
  await cdp.detach();
});
