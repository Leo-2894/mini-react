# API Studio / Mini React

현재 진행: TURN 06은 별도 Sol 6.1/HIGH 독립 검수에서 PASS / APPROVED. TURN 07 FunctionComponent와 루트 useState를 구현했다. 제품 페이지(`index.html`)는 TURN 10 대상이다.

## 실행 (Windows PowerShell)

```powershell
Set-Location -LiteralPath 'C:\Users\Leo\Desktop\API 1'
npm ci
npx playwright install chromium
npm run dev
```

브라우저에서 `http://127.0.0.1:4173/phase1/` 접속. 서버는 127.0.0.1에서만 실행한다. 루트 `/` 페이지는 TURN 10 대상이며 현재 제공하지 않는다. Node 24.22.1 / npm 11.19.1에서 검증.

```powershell
npm run test:unit
npm run test:e2e
npm run test:all
```

E2E는 자체 로컬 서버를 시작·종료하므로 실행 전 별도의 `npm run dev`를 종료해 4173 포트를 비운다. 실패 시 `test-results/`에 screenshot/trace, `playwright-report/`에 HTML 보고서가 남는다. 초기 실패 증거는 `output/playwright/turn05-attempt1/`에 별도 보존했다.

## Phase 1 시연

1. 실제 영역의 샘플 DOM을 읽어 테스트 영역에 복제한다. 실제 영역을 처음부터 재생성하지 않는다.
2. 테스트 영역에서 제목을 직접 타이핑하거나 Inspector로 요소/속성을 편집한다. 실제 영역은 Patch 전까지 그대로다.
3. Patch 적용: 현재 테스트 DOM을 다시 읽어 Diff한 뒤 실제 영역의 필요한 부분만 바꾼다.
4. 두 번 변경 후 Undo/Redo 또는 History 버튼으로 양 영역을 함께 이동한다. 미적용 편집은 이동 시 버린다. 초기 상태에서는 편집 되돌리기를 사용한다.
5. Undo 후 변경 없는 Patch는 Redo를 유지한다. 새 변경을 적용하면 미래 분기를 폐기한다. History는 최대 50개 독립 스냅샷이다.

Inspector 대상은 테스트 영역 내부의 CSS 선택자다. 예: `[data-key="heading"]`, `ul`, `li:last-child`. 지원 태그 목록은 `src/phase1/html-policy.js`에 있다. on*·URL/resource 속성·script/iframe/form·위험 CSS는 삽입 전에 거부한다. paste/drop은 plain text만 넣는다. DevTools로 이미 실행된 악성 코드를 복구하는 샌드박스는 아니다.

## 핵심 동작

- `vnode.js` / `dom.js`: root Tree와 element/text/comment를 구분한다. childNodes를 읽어 공백과 주석을 보존하며 attrs와 live form props를 분리한다. h는 평탄화/정규화/중복 key 검증을 수행한다.
- `diff.js`: DOM을 건드리지 않는 순수 함수다. 변경 전 preorder 참조와 CREATE/TEXT/ATTRS/EVENTS/CHILDREN/PROPS 명령을 만든다. key는 형제 내 정체성이며 unkeyed는 unkeyed 순번으로 대응한다.
- `patch.js`: 전체 old DOM과 모든 참조를 먼저 검증·결속한다. 깊은 부모의 CHILDREN을 먼저 처리하고 노드 cursor로 삭제·삽입·이동한다. 변경된 형제 인덱스로 타깃을 재검색하지 않는다. listener는 WeakMap으로 갱신·정리한다.
- `renderer.js`: immutable committedTree와 revision을 관리해 stale/foreign/replayed 계획을 거부한다. editable 역할만 사용자 편집 baseline을 재채택한다.
- `controller.js` / `history.js`: 미적용 draft와 snapshot을 구분한다. 두 영역 계획을 모두 사전 검증한 뒤 적용하고 마지막에 History cursor를 옮긴다. 예기치 않은 부분 적용 실패는 오류를 표시하고 추가 조작을 잠근다. 완전 rollback을 보장하지 않는다.

제품 런타임 의존성은 없다. 외부 React/VDOM/Hooks/UI/CSS 프레임워크를 사용하지 않는다. 테스트 도구는 devDependencies뿐이다. Phase 2 컴포넌트도 같은 renderer/Diff/Patch를 사용하며 루트만 state/hooks를 갖는다.

## 지원 한계와 검수 경계

HTML namespace의 제한된 DOM을 지원한다. SVG/MathML/template/custom element/Shadow DOM/file input/multiple select는 범위 밖이며 오류를 낸다. 전역 최단 편집/LIS/Fiber/Concurrent React 호환성을 보장하지 않는다. 구조/속성 외부 변경은 거부하고 제어 중인 live prop drift만 복구한다. 현재 브라우저 검증은 Chromium이다.

HTTP 통신·CORS 설명·민감 요청 이력 정제와 Phase 2 사용법은 TURN 09~11에서 구현 및 검증 후 문서화한다. Phase 1은 TURN 06 독립 승인을 받았고 이후 구현 변경은 TURN 12 독립 검수 대상이다. 기술 계약은 `docs/architecture.md`, 실제 진행/인계/실패 기록은 `docs/loop/` 참고.

## TURN 06 폼/ID 경계 보완 (독립 승인 완료)

- 엔진은 input의 attrs와 live props를 계속 분리한다. checkbox/radio의 value setter 및 type 전환은 value content attribute를 바꿀 수 있으므로, 엔진 반영 직후의 logical/physical value 매핑을 Node별 WeakMap으로 보관해 정확히 검증한다. 이는 input.value 속성 하나의 엔진 반영 추적이며 managed Tree 재채택이 아니다. 외부 value/다른 속성 변경은 그대로 거부한다. 제어 props 제거 시 현재 값을 보존한다.
- Phase 1은 host 바깥에 서로 다른 form wrapper를 둔다. 실제/테스트 radio는 같은 name을 유지하면서 서로 다른 native form owner를 갖는다. wrapper는 snapshot의 children 밖에 있으며 원본 노드와 논리 Tree를 재생성하지 않는다. form submit은 차단한다.
- REVIEW_REWORK 2는 Astra의 승인된 ID 경계 계약에 따라 logical id/for/ARIA IDREF는 Tree·History·Inspector에 보존하고 host별 physical ID로 native 관계를 분리한다. 초기 source Node를 유지하며 id/IDREF 속성만 경계 보정한다. 이전 label 클릭 우회 guard는 제거했고 native label.control/input.labels 및 접근성 이름을 검증한다. 상세 선택적 API/IDREF/빈·중복 ID/selector/오류 정책은 docs/id-scope.md 참고. TURN 06 독립 QA는 최종 추가 재검수에서 APPROVED됐다.
- Inspector는 초기 제어 노드 참조를 보관하므로 같은 사용자 id가 생겨도 제어 입력 조회를 가로채지 못한다.
- Playwright CLI 기본 screenshot이 caret 숨김 처리 후 text input에 style=""를 남기는 현상을 실제 속성 전후 로그로 확인했다. 엔진은 이를 외부 변경으로 거부한다. screenshot은 기능 검증 마지막에 찍고, 이후 상호작용을 이어가려면 reload한다. 테스트 도구의 변경을 제품에서 무시하지 않는다.

## FunctionComponent / 루트 useState (TURN 07)

```js
import { FunctionComponent } from './src/mini-react/component.js';
import { useState } from './src/mini-react/hooks.js';
import { h } from './src/mini-react/vnode.js';
function Counter() {
  const [n, set] = useState(() => 0);
  return h('button', { events: { click: () => set(x => x + 1) } }, n);
}
const root = new FunctionComponent(Counter, {});
root.mount(document.querySelector('#empty-host'));
// root.updateProps(nextProps); root.update(); root.unmount();
```

인스턴스가 committed hooks/queues/index/props를 소유한다. setter는 안정적이며 값과 함수형 updater를 호출 순서대로 처리한다. 같은 tick은 microtask 한 번으로 배치하고 Object.is 동일 상태면 App 재실행과 DOM 쓰기를 생략한다. updateProps도 같은 queue/render/공유 Patch 경로를 사용한다.

자식은 h(Child, props)로 평가하는 순수 함수다. 자식/initializer/updater/이벤트에서 Hook을 호출하거나 render/updater 중 setter를 실행하면 오류다. Hook 종류·개수 변경은 commit 전에 거부한다. 조건부/custom Hook 및 Child(props) 직접 호출의 모든 위반을 자동 탐지하지 않으므로 정적 검수도 필요하다. 객체 상태를 직접 mutation하지 않는다.

실패 render는 committed hooks/props/UI를 유지하고 실패 queue를 폐기한다. 자동 microtask 오류는 console.error와 root.error로 보고하며 자동 재시도하지 않는다. 원인을 고친 뒤 root.update()로 명시 재시도한다. 부분 DOM 오류는 기존 renderer의 오류 정책을 따르며 rollback을 보장하지 않는다. unmount는 예약 작업을 무효화하고 같은 엔진으로 빈 Tree를 반영한 뒤 listener/슬롯을 정리한다. 오래된 setter는 경고 후 무시한다.
