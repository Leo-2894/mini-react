import {it,expect} from 'vitest';
import {createDOMScope} from '../../src/mini-react/scope.ts';
import {h,tree} from '../../src/mini-react/vnode.ts';
it('preserves projection rejection when an element target is actually a text node',()=>{
 const host=document.createElement('div');host.textContent='foreign';
 const scope=createDOMScope(host),before=host.innerHTML;
 expect(()=>scope.projectTree(tree(h('input',{attrs:{id:'box'}})))).toThrow();
 expect(host.innerHTML).toBe(before);
});
