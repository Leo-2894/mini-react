import { createRenderer } from '../mini-react/renderer.js';
import { readTree } from '../mini-react/dom.js';
import { validatePatch } from '../mini-react/patch.js';
import { validatePolicy } from './html-policy.js';
import { createHistory } from './history.js';
import { isolateHost } from './boundaries.js';
export function createPhase1(actualHost, editHost) {
  const document = actualHost.ownerDocument;
  const initial = validatePolicy(readTree(actualHost), document);
  const releaseActual = isolateHost(actualHost), releaseEditor = isolateHost(editHost);
  const actualRenderer = createRenderer(actualHost);
  const editRenderer = createRenderer(editHost, { role: 'editable' });
  editRenderer.render(initial);
  const history = createHistory(initial);
  let locked = false;
  const guard = () => { if (locked) throw Error('부분 적용 오류로 잠겼습니다. 페이지를 새로고침해 복구하세요.'); };
  const candidate = () => validatePolicy(readTree(editHost), document);
  return {
    history,
    get locked() { return locked; },
    apply() {
      guard();
      const next = candidate(), plan = actualRenderer.preview(next);
      validatePatch(actualHost, plan);
      try { actualRenderer.commit(plan); } catch (error) { locked = true; throw error; }
      const changed = history.append(next, `${plan.operations.length}개 변경 명령`);
      return { changed, operations: plan.operations };
    },
    travel(index) {
      guard();
      const entry = history.entries[index];
      if (!entry) throw Error('Invalid history cursor');
      candidate(); // Safety before editable baseline adoption.
      const actualPlan = actualRenderer.preview(entry.tree);
      editRenderer.adoptEditedDOM();
      const editPlan = editRenderer.preview(entry.tree);
      validatePatch(actualHost, actualPlan); validatePatch(editHost, editPlan);
      try { actualRenderer.commit(actualPlan); editRenderer.commit(editPlan); }
      catch (error) { locked = true; throw error; }
      history.select(index);
    },
    restoreDraft() {
      guard(); candidate(); editRenderer.adoptEditedDOM();
      const plan = editRenderer.preview(history.current.tree);
      validatePatch(editHost, plan);
      try { editRenderer.commit(plan); } catch (error) { locked = true; throw error; }
    },
    destroy() { actualRenderer.destroy(); editRenderer.destroy(); releaseActual(); releaseEditor(); }
  };
}
