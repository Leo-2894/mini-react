import { isValueControl, errorMessage } from '../mini-react/types.js';
import type { ElementVNode, Container, VNode, Operation } from '../mini-react/types.js';
function required(selector: string): HTMLElement {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw Error('Missing Phase 1 control: ' + selector);
  return node;
}
import { h, tree } from '../mini-react/vnode.js';
import { createDOM, domToVNode, readTree } from '../mini-react/dom.js';
import { createRenderer } from '../mini-react/renderer.js';
import { createPhase1 } from './controller.js';
import { validatePolicy, protectEditor } from './html-policy.js';
// Capture control references before user DOM can introduce colliding IDs.
const inspector = required('.inspector');
const inspectorControls = new Map([...inspector.querySelectorAll<HTMLElement>('[id]')].map(node => [node.id, node]));
const initialNodes = new Map(['actual-host', 'edit-host', 'feedback-host'].map(id => [id, document.getElementById(id)]));
const $ = (id: string): HTMLElement => {
  const node = inspectorControls.get(id) || initialNodes.get(id);
  if (!node) throw Error('Missing Phase 1 control: ' + id); return node;
};
function value(id: string): string {
  const node = $(id); if (isValueControl(node)) return node.value;
  throw Error('Expected input control: ' + id);
}
const actual = $('actual-host'), editor = $('edit-host');
const app = createPhase1(actual, editor);
const feedback = createRenderer($('feedback-host'));
let message = '실제 DOM을 읽어 테스트 영역에 복제했습니다. 초기 상태 S0가 저장되었습니다.', isError = false, draft = false, serial = 0;
let lastOperations: readonly Operation[] | null = null;
const operationLabels: Record<Operation['type'], string> = {
  CREATE: '새 요소 만들기',
  TEXT: '글자 바꾸기',
  ATTRS: '속성 바꾸기',
  EVENTS: '이벤트 연결 바꾸기',
  PROPS: '입력값 맞추기',
  CHILDREN: '자식 구성 바꾸기'
};

function patchSummary() {
  if (lastOperations === null) return null;
  const counts = new Map<Operation['type'], number>();
  for (const operation of lastOperations) counts.set(operation.type, (counts.get(operation.type) ?? 0) + 1);
  return h('section', { key: 'patch-summary', attrs: { class: 'panel patch-summary', 'aria-label': '최근 Patch 명령' } },
    h('h2', {}, '최근 Patch 명령'),
    counts.size
      ? h('ul', {}, [...counts].map(([type, count]) => h('li', { key: type }, h('code', {}, type), ' · ' + operationLabels[type] + ' · ' + count + '개')))
      : h('p', { attrs: { class: 'hint' } }, '바뀐 곳이 없어 변경 명령이 없습니다.'));
}

function updateFeedback() {
  const history = app.history;
  feedback.render(tree(
    h('div', { key: 'status', attrs: { class: isError ? 'status error' : 'status', role: isError ? 'alert' : 'status' } }, message),
    patchSummary(),
    h('section', { key: 'history', attrs: { class: 'panel history' } },
      h('div', { attrs: { class: 'panel-heading' } }, h('h2', {}, 'State History'), h('span', {}, `${history.cursor + 1} / ${history.entries.length} · MAX 50`)),
      h('ol', {}, history.entries.map((entry, index) => h('li', { key: entry.id }, h('button', { attrs: { type: 'button', 'aria-current': index === history.cursor ? 'true' : 'false' }, events: { click: () => run(() => { app.travel(index); draft = false; return `S${entry.id}로 양 영역을 복원했습니다.`; }) } }, `S${entry.id} · ${entry.summary}`))))
    )
  ));
  // Button state changes also use the same engine, without owning the editable DOM.
  controls.render(tree(...controlTree()));
}
function controlTree() {
  const attrs = (disabled: boolean) => ({ type: 'button', disabled });
  return [
    h('button', { key: 'patch', attrs: { ...attrs(app.locked), id: 'patch', class: 'primary' }, events: { click: apply } }, 'Patch 적용'),
    h('button', { key: 'undo', attrs: { ...attrs(app.locked || app.history.cursor === 0), id: 'undo' }, events: { click: () => travel(-1) } }, 'Undo'),
    h('button', { key: 'redo', attrs: { ...attrs(app.locked || app.history.cursor === app.history.entries.length - 1), id: 'redo' }, events: { click: () => travel(1) } }, 'Redo'),
    h('button', { key: 'restore', attrs: { ...attrs(app.locked || !draft), id: 'restore' }, events: { click: () => run(() => { app.restoreDraft(); draft = false; return '미적용 편집을 되돌렸습니다.'; }) } }, '편집 되돌리기')
  ];
}
const controls = createRenderer(required('.toolbar'));
function run(action: () => string): void {
  try { message = action(); isError = false; }
  catch (error) { message = errorMessage(error); isError = true; }
  updateFeedback();
}
function apply() { run(() => { const result = app.apply(); lastOperations = result.operations; draft = false; return result.changed ? `Patch 완료: ${result.operations.length}개 명령을 적용하고 양 영역 상태를 저장했습니다.` : '변경 없음: History와 Redo 경로를 유지했습니다.'; }); }
function travel(offset: number): void { run(() => { app.travel(app.history.cursor + offset); draft = false; return '양 영역과 History 커서를 함께 이동했습니다.'; }); }
function edited() { draft = true; message = '미적용 편집이 있습니다. Patch를 적용하거나 편집을 되돌리세요.'; isError = false; updateFeedback(); }
function target() {
  const node = app.editScope.querySelector(value('target'));
  if (!node) throw Error('대상 선택자에 해당하는 요소가 없습니다.');
  return node;
}
function edit(action: (value: ElementVNode) => ElementVNode | null): void {
  run(() => {
    const node = target(), vnode = domToVNode(node, app.editScope);
    // Validate an independent detached candidate before any editable-host write.
    if (vnode.kind !== 'element') throw Error('Expected editable element');
    const candidate = action(vnode);
    const next = readTree(editor, app.editScope), path: number[] = [];
    for (let current: Node = node; current !== editor;) {
      const container = current.parentNode; if (!container) throw Error('Detached editor target');
      path.unshift([...container.childNodes].findIndex(child => child === current)); current = container;
    }
    let parent: Container = next;
    for (const index of path.slice(0, -1)) {
      const child: VNode = parent.children[index]; if (child.kind !== 'element') throw Error('Invalid editor path'); parent = child;
    }
    const last = path.at(-1); if (last === undefined) throw Error('Missing editor path');
    parent.children.splice(last, 1, ...(candidate ? [candidate] : []));
    validatePolicy(next); app.editScope.validateTree(next);
    if (candidate) node.replaceWith(createDOM(candidate, document, app.editScope)); else node.remove();
    draft = true;
    return '테스트 DOM 편집 완료. 실제 영역에는 아직 적용되지 않았습니다.';
  });
}
$('set-text').addEventListener('click', () => edit(v => ({ ...v, children: [{ kind: 'text', text: value('edit-text') }], props: ['textarea', 'select'].includes(v.tag) ? { ...v.props, value: value('edit-text') } : v.props })));
$('add-node').addEventListener('click', () => edit(v => ({ ...v, children: [...v.children, h(value('tag'), { key: `added-${++serial}` }, value('edit-text'))] })));
$('remove-node').addEventListener('click', () => edit(() => null));
$('replace-node').addEventListener('click', () => edit(v => h(value('tag'), { key: v.key }, value('edit-text'))));
$('set-attr').addEventListener('click', () => edit(v => {
  const name = value('attr-name').trim().toLowerCase();
  const next = h(v.tag, { key: v.key, attrs: { ...v.attrs, [name]: value('attr-value') }, props: v.props, events: v.events }, v.children);
  if (name === 'value' && Object.hasOwn(v.props, 'value')) next.props.value = value('attr-value');
  return next;
}));
$('remove-attr').addEventListener('click', () => edit(v => { const attrs = { ...v.attrs }; delete attrs[value('attr-name').trim().toLowerCase()]; return { ...v, attrs }; }));
editor.addEventListener('input', edited);
protectEditor(editor, edited);
updateFeedback();
