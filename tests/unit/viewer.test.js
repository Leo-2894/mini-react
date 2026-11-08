import {describe,it,expect} from 'vitest';
import {JsonViewer} from '../../src/components/panels.ts';
import {createRenderer} from '../../src/mini-react/renderer.ts';
import {tree} from '../../src/mini-react/vnode.ts';
function render(value,extra={}){const host=document.createElement('div');createRenderer(host).render(tree(JsonViewer({value,expanded:{},onToggle:()=>{},...extra})));return host;}
describe('JSON viewer pure children',()=>{
 it('renders primitive values and hostile strings as text',()=>{const host=render({a:1,b:true,c:null,d:'<img src=x onerror=alert(1)>'});expect(host.textContent).toContain('true');expect(host.textContent).toContain('null');expect(host.querySelector('img')).toBeNull();});
 it('keeps JSON input immutable and delegates expansion to root callbacks',()=>{const value=Object.freeze({a:Object.freeze({b:1})});let call;const host=render(value,{onToggle:(...args)=>call=args});host.querySelector('button').click();expect(call).toEqual(['[]',true]);expect(value.a.b).toBe(1);});
 it('explicitly marks clipped long scalar values and leaves raw mode available',()=>{const host=render('x'.repeat(1500));expect(host.textContent).toContain('트리 일부');});
 it('bounds large trees at 200 rows',()=>{const host=render(Array.from({length:500},(_,i)=>i));expect(host.querySelectorAll('.json-row')).toHaveLength(200);expect(host.textContent).toContain('트리 일부');});
});
