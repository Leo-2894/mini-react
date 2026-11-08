# API Studio — 아키텍처 계약 v2.0
기준일: 2026-11-07 (Asia/Seoul) · 소유: Astra TURN 01 · 상위 규약: CODEX_LOOP_HARNESS.md v2.0

## 1. 적용 범위와 기존 설계 변경
이 문서가 저장소의 구현 기준이다. 채팅에서 먼저 작성된 외부 TURN 1 문서는 하네스를 읽기 전의 초안이며 이 문서로 대체한다. 기존 제품 코드는 없어 마이그레이션 대상은 없다. 구현·브라우저 검증을 마쳤다는 뜻이 아니다.

중요 변경: Phase 1은 실제 영역 DOM → VDOM → 테스트 영역 최초 렌더링을 수행한다. 테스트 영역의 실제 DOM을 사용자가 편집하고, Patch 버튼이 그 DOM을 다시 읽어 실제 영역을 갱신한다. 이전 초안의 “textarea 초안만 편집, 테스트 DOM 편집 금지” 계약은 폐기한다. Undo/Redo는 양쪽 영역을 함께 이동한다. 이 변경의 영향은 Phase 1 컨트롤러·History·E2E이며 D01/H01/H02/H03에서 검증한다.

정적 서버 + 브라우저 ES modules, Vanilla JavaScript/CSS를 사용한다. 제품 런타임 의존성 및 UI/CSS 프레임워크는 없다. Vitest/jsdom/Playwright는 개발 의존성만 허용한다. 번들러·빌드 작업은 기본 요건이 아니다. Git 초기화·테스트 환경 구성은 Sol TURN 02 담당이다. 현재 Git이 없으므로 실제 루트를 재확인한 뒤 원격 없는 로컬 git init을 허용한다. 기존 두 지침 파일을 보존한다.

지원 범위: HTML namespace의 요소, 텍스트, 주석, 다중 최상위 노드, class/style 문자열, boolean/ARIA 속성, value/checked/selected 프로퍼티, 이벤트. null/undefined/boolean children은 생략하고 숫자는 text로 정규화한다. SVG/MathML, template/custom elements, Shadow DOM, file input, multiple select, raw HTML 삽입 API는 초기 범위 밖이며 명시적 오류를 낸다. 추가 과제 원문이 요구하면 범위를 재검토한다. Fiber, keyed 최소 이동 최적화, React 전체 호환성은 구현하지 않는다.

## 2. 모듈과 의존 방향
~~~text
index.html                         Phase 2 host와 ES module 진입점
phase1/index.html                  샘플 실제 영역/편집 테스트 영역/버튼
src/mini-react/
  vnode.js                         h, 정규화, VNode 검증
  dom.js                           domToVNode, createDOM, 속성/prop/event
  diff.js                          순수 변경 계획
  patch.js                         참조 결속/검증/적용/정리
  renderer.js                      host, committedTree, revision
  component.js                     FunctionComponent
  hooks.js                         Hook 슬롯/활성 context/deps
src/phase1/
  main.js                          두 영역과 편집/Patch/History 연결
  html-policy.js                   편집 입력 허용 정책
  history.js                       독립 snapshot/cursor
src/api/
  request.js                       URL/query/header/body 검증·fetch
  response.js                      응답 해석·HTTP/네트워크 오류 구별
  history.js                       순수 메타데이터 정제 함수
src/components/                   Request/Response/Sidebar 등 순수 함수
src/App.js                         유일한 상태/Hook 보유 컴포넌트
src/main.js                        루트 mount
src/styles.css                     직접 작성 CSS
tests/unit/                       엔진/runtime/API, DOM 통합 포함
tests/e2e/                        Phase 1 + Phase 2
tests/fixtures/server.js           loopback mock HTTP/CORS 서버
docs/architecture.md
docs/loop/{STATE,HANDOFF,LOG,ISSUES}.md
docs/loop/reviews/{turn01,turn06,turn12}.md
AGENTS.md / README.md / package.json / package-lock.json
~~~
app → component/hooks → renderer → diff/patch/dom. Phase 1 → 같은 renderer/diff/patch/dom. 엔진은 앱/API 모듈을 import하지 않는다. 각 파일은 작게 시작하고 파일 수를 늘리기 위한 추상화는 만들지 않는다. scheduler는 처음에는 component 내부 함수로 충분하다.

## 3. VDOM과 생성 API
~~~js
// 설명용 타입. 구현은 JavaScript.
Tree = { kind: 'root', children: VNode[] } // 실제 고정 host를 감싸는 가상 루트
VNode =
  { kind: 'text', text: string } |
  { kind: 'comment', text: string } |
  { kind: 'element', tag: string, key: string | null,
    attrs: Record<string, string>,
    props: { value?: string, checked?: boolean, selected?: boolean },
    events: Record<string, Function>, children: VNode[] }

h(tag, { key, attrs, props, events }, ...children) // element VNode
h(StatelessChild, childProps)                     // VNode 또는 null; childProps.children 전달
~~~
함수 자식 호출 지점의 key가 있으면 반환 VNode의 key로 사용하고 wrapper DOM은 만들지 않는다. 태그/HTML 속성 이름은 소문자, children 배열은 평탄화한다. 빈 text 및 공백·comment를 임의 삭제하지 않는다. attrs는 content attribute, props는 live form state, events는 소문자 타입과 함수다. on* 문자열은 attrs로 받지 않는다. style은 문자열 속성만 지원한다. boolean attribute는 참이면 빈 문자열로 존재, 거짓이면 제거한다. aria-*의 문자열 "false"는 보존한다.

key는 형제 범위의 정체성이다. 예약 속성 data-key로 DOM round trip한다. attrs에 중복 저장하지 않는다. 같은 부모의 중복 key는 오류. key 있는 노드는 key로, 없는 노드는 key 없는 형제끼리의 순번으로 대응한다. 혼합 목록도 허용하여 HTML 들여쓰기 text를 손실시키지 않는다. 대응된 kind/tag가 같으면 재사용, 다르면 교체한다. key가 달라지거나 다른 부모로 이동하면 새 노드다. unkeyed 순번 대응은 데이터 항목 정체성을 보장하지 않으므로 API 동적 행에는 안정적인 key를 부여한다. key는 생성 이벤트에서 정하고 render 때 난수/index로 재생성하지 않는다.

VNode 입력은 불변이며 DOM 참조·Hook 슬롯을 넣지 않는다. 일반 앱 VNode에는 함수가 있으므로 JSON 직렬화로 복제하지 않는다. Phase 1 snapshot은 이벤트가 없고 구조적 복제를 통해 저장한다. 개발 테스트에서 freeze된 입력도 동작해야 한다.

## 4. DOM 변환 계약
~~~js
domToVNode(node)             // Element/Text/Comment → VNode, 읽기 전용
readTree(host)              // host.childNodes → Tree; host 속성 자체는 제외
createDOM(vnode, document)  // detached Node, input VNode 불변
createRenderer(host, { role = 'managed' } = {}) // readTree로 채택; role은 managed/editable
~~~
readTree는 하네스 domToVNode의 다중 root 확장이다. childNodes를 읽으므로 공백·comment를 보존한다. document/doctype/지원 밖 namespace는 경로를 포함해 오류를 낸다. 원본 HTML의 문자열 표현이 아니라 브라우저가 파싱한 구조가 기준이다.

domToVNode는 attributes와 data-key를 읽으며 input.value/checked, textarea.value, select.value, option.selected를 별도로 읽는다. 기존 addEventListener 등록을 역추출할 수 없으므로 events={}다. Phase 1 샘플/History에는 제품 이벤트를 넣지 않는다. 엔진이 소유한 Phase 2 events는 committedTree에 유지한다.

createDOM은 children 생성 뒤 props를 적용한다. textarea.value와 select.value가 제어값으로 우선하며 select는 option.selected 적용 후 최종 value를 설정한다. 같은 프로퍼티값을 다시 대입하지 않는다. value/checked/selected 제어권을 제거하면 현재 값을 유지하는 uncontrolled 전환으로 정의하며 API 앱에서는 전환하지 않는다.

변환 정답: 지원 DOM → Tree → 새 DOM → Tree의 정규화된 구조가 동등하다. 외부 listener, focus, caret, scroll은 직렬화 대상이 아니다. Patch는 재사용 노드의 focus/caret을 보존해야 한다.

## 5. Diff와 Patch 인터페이스
~~~js
diff(oldTree, nextTree)                  // 순수 PatchPlan; DOM 접근/입력 변경 없음
patch(host, plan)                       // 성공: { root: host, tree: nextTree }; 실패: throw
renderer.preview(nextTree)              // plan에 rendererId/baseRevision 부여
renderer.commit(plan)                   // 검증 후 patch, 성공시에만 revision 증가
renderer.render(nextTree)               // preview + commit
renderer.adoptEditedDOM()               // editHost 전용: 현재 DOM 채택, revision 증가
renderer.destroy()                     // listener 정리 및 소유권 해제
~~~
하네스 rootDom은 이 설계에서 고정 host다. host 자체는 교체하지 않는다. renderer는 committedTree를 소유한다. 계획에는 oldTree/nextTree 및 refs가 포함되며 외부 mutation을 금지한다. preview는 DOM/History를 바꾸지 않는다. app/Phase 1은 renderer를 통해 같은 diff/patch를 사용한다. adoptEditedDOM은 Phase 1에서 role:'editable'로 생성한 editHost renderer에만 허용하고, 정책 검증 후 readTree 결과를 baseline으로 채택하며 DOM/History는 변경하지 않는다. actualHost 및 Phase 2 renderer에서 호출하면 오류다.

~~~js
// old:0 = host, 나머지 번호는 oldTree preorder, fresh 번호는 계획 내 신규 subtree
Ref = { old: number } | { fresh: number }
Operation =
  { type: 'CREATE', id, subtree } |
  { type: 'TEXT', target: Ref, text } |
  { type: 'ATTRS', target: Ref, set, remove } |
  { type: 'EVENTS', target: Ref, next } |
  { type: 'CHILDREN', parent: Ref, previous: Ref[], next: Ref[] } |
  { type: 'PROPS', target: Ref, next }
~~~
CHILDREN은 최종 직접 자식 목록이다. 이전에만 있으면 REMOVE, 다음에만 있으면 INSERT, 같은 참조의 순서 변경은 MOVE, 대응 노드가 fresh로 바뀌면 REPLACE다. 다섯 필수 변경 유형을 이 모델로 표현하고 테스트한다. CREATE는 subtree 전체를 만들며 같은 계획이 그 내부를 또 수정하지 않는다.

적용 순서:
1. rendererId/revision 확인. 전체 oldTree와 host를 함께 순회해 모든 old 참조를 mutation 전에 결속한다. 이미 적용한 계획/다른 renderer의 계획은 거부한다.
2. 실제 구조·kind/tag/key/text/attrs와 oldTree 불일치는 외부 변경 오류다. 사용자가 바꾸는 live props는 구조 검증에서 제외한다. refs·중복·부모 관계·태그/속성 정책도 사전 검증한다.
3. detached CREATE를 준비하고 TEXT/ATTRS/EVENTS를 적용한다.
4. CHILDREN은 재사용된 깊은 부모부터 처리한다. next에 없는 직접 자식을 제거하고 next를 왼쪽부터 순회하여 실제 Node cursor 앞에 insertBefore한다. 이미 그 자리에 있으면 아무 작업도 하지 않는다.
5. 자손부터 props를 동기화하고 select.value는 마지막에 처리한다. 계획에 prop 차이가 없어도 제어 중인 실제값이 drift했으면 복구한다.
6. 제거된 subtree의 엔진 listener를 해제하고 성공한 tree/revision을 기록한다.

번호는 변경 전의 결속 용도일 뿐 영속 ID가 아니다. 삭제 후 childNodes[oldIndex]로 타깃을 다시 찾지 않는다. no-op은 실제 구조/속성/listener write가 없으며 live prop drift 복구만 예외다. 최소 변경은 해당 식별 규칙 안에서 필요 없는 쓰기와 전체 재생성을 피한다는 뜻으로, 전역 최단 편집/LIS를 보장하지 않는다.

엔진은 WeakMap으로 Node별 listener를 관리하고 동일 함수는 유지, 변경/삭제는 removeEventListener 후 갱신한다. 제거 subtree는 전체 정리한다. 지원 이벤트는 bubble listener이며 capture/options 확장은 이번 범위에 넣지 않는다.

mutation 전 host 내부 activeElement와 지원되는 selection을 기록한다. 이동 뒤 같은 Node가 살아 있고 focus/caret이 실제 유실된 경우에만 복원한다. 제거/교체된 Node는 복원하지 않는다. value가 짧아지면 selection을 범위 내로 제한한다. 예기치 않은 DOM 예외에는 오류 상태로 중단하고 History/Hook commit을 하지 않는다. 완전 원자적 rollback을 주장하거나 전체 innerHTML 재생성으로 숨기지 않는다.

## 6. Phase 1: 두 영역, 실제 편집, History
실제 영역 actualHost는 읽기 전용 샘플 DOM이며 editHost는 사용자가 바꾸는 테스트 DOM이다. DOM 직접 편집 예외는 editHost에만 적용된다. Phase 2에는 이 예외를 적용하지 않는다.

초기: sampleTree=readTree(actualHost) → 안전 정책 검사 → 빈 editHost에 shared engine으로 렌더 → 독립 snapshot S0 저장. 초기 실제 영역은 다시 만들지 않는다.

편집: editHost의 contenteditable로 text를 바꾸고, 선택 요소 inspector로 속성/요소 추가·삭제·교체를 제공한다. inspector 값은 DOM API로 적용하며 실제 editHost DOM이 변경되어야 한다. HTML 입력 보조 기능을 제공하더라도 detached 파싱/검증 뒤 editHost를 바꾸는 도구일 뿐, Patch가 읽는 원본은 항상 현재 editHost DOM이다. editor UI의 정적 버튼 연결은 허용한다.

편집 전 안전 정책: 허용 태그는 일반 HTML 구조/표/폼 입력 요소(div, span, p, section, article, header, footer, main, nav, aside, h1-h6, ul, ol, li, strong, em, b, i, small, code, pre, blockquote, br, hr, table, thead, tbody, tfoot, tr, th, td, caption, label, input, textarea, button, select, option). script/iframe/object/embed/form, custom elements, on*, srcdoc 및 URL/resource 속성(href/src/action 등)은 거부한다. 속성은 class/id/title/role/lang/dir/hidden/tabindex, data-*/aria-*, label for, 표 span, 입력 type/name/value/checked/selected/disabled/placeholder/readonly/min/max/step/rows/cols로 제한한다. input type은 text/number/checkbox/radio, button은 type=button이다. style은 color/background-color/font-size/font-weight/text-align/margin/padding/border의 값만 허용하고 url(), var(), expression(), @, escape 및 !important는 거부한다. 브라우저 CSS 파서로 유효한 속성값인지 확인한다. 정책 위반은 조용히 제거하지 않고 오류를 표시한다.

paste/drop은 HTML 기본 삽입을 막고 plain text만 삽입한다. inspector/보조 HTML은 DOM 삽입 전에 검증한다. Patch 때만 검사하는 것으로 스크립트 실행 방지를 대신하지 않는다. DevTools로 악의적으로 삽입한 코드를 안전하게 되돌릴 수 있다고 보장하지 않는다.

Patch: candidate=readTree(editHost) → 정책/VDOM 검증 → diff(actualRenderer.committedTree,candidate) → actualHost에 patch → 성공 시 snapshot append. 문자열 비교/초안 VDOM 캐시를 정답으로 쓰지 않는다. 성공 후 editHost는 이미 candidate 상태이므로 전체 재렌더하지 않는다. stale preview는 재계산 또는 명시적으로 거부한다.

History={entries:[{id,tree,summary}],cursor,limit:50}. snapshot은 live DOM/이전 snapshot과 mutable 객체를 공유하지 않는다. 성공한 변경만 append한다. Undo 뒤 새 변경 Patch는 redo 분기를 버린다. no-op은 append하지도 redo를 버리지도 않는다. 사용자 편집 draft는 History에 넣지 않는다.

Undo/Redo/History 선택: actual의 committedTree와 **현재 readTree(editHost)**를 각각 대상 snapshot과 비교한다. 편집 때문에 renderer의 이전 baseline이 낡을 수 있으므로 editHost renderer는 사용자 편집을 명시적으로 다시 채택(readTree)한 뒤 shared diff/patch한다. actualHost는 재채택으로 외부 변경을 숨기지 않는다. 양쪽 계획을 먼저 검증하고 모두 성공한 뒤 cursor를 바꾼다. 사전 검증 실패는 양쪽을 그대로 유지한다. 두 번째 적용 중 예기치 않은 오류라면 불일치를 명시하고 추가 조작을 차단한다. snapshot은 유지하고 명시적 복구만 허용한다.

Undo는 미적용 draft를 버리고 이전 committed snapshot으로 이동한다. Redo도 draft를 버린다. 초기에 Undo 불가라면 disabled하고 별도 “편집 되돌리기” 버튼이 현재 snapshot으로 editHost만 복원한다. 마지막/처음 cursor의 버튼 상태, 50개 초과 시 앞쪽 제거와 cursor 보정을 정의한다.

## 7. FunctionComponent와 루트 전용 Hooks
~~~js
const root = new FunctionComponent(App, initialProps);
root.hooks;                  // committed 슬롯 배열
root.mount(host);
root.update();               // 예약된 state queue를 적용, 루트 재실행
root.updateProps(nextProps);  // props 변경 후 동일 update 경로
root.unmount();
~~~
mount는 빈 host에 Tree를 render한다. App은 VNode 또는 null을 반환하고 runtime이 Tree로 감싼다. 중복 mount는 오류, unmount는 반복 가능하다. 인스턴스가 hooks, queues, hookIndex, renderer, mounted/error, pending 플래그를 소유한다. 지속적인 앱 상태를 module 변수에 두지 않는다. 활성 Hook context 같은 runtime 메타데이터 및 Phase 1 History는 이 제약의 앱 상태와 구분한다.

render 시작 때 index=0, 각 Hook은 {kind,...} 슬롯을 1개 사용한다. mount 이후 종류/개수가 다르면 DOM commit 전 오류다. 조건문/반복문/이벤트/effect/memo factory/자식/custom hook 내 Hook 호출은 금지한다. h(Child,props)는 root Hook 권한을 잠시 끄고 순수 함수를 평가한다. Child(props) 직접 호출은 금지하며 정적 검수한다. JavaScript의 모든 직접 호출 위반을 자동 탐지한다고 주장하지 않는다.

update는 pending queues → draft hooks → App → VDOM 검증 → 같은 diff/patch → hooks commit → effects 순서다. 실패한 render는 이전 UI/committed hooks/cache를 유지한다. 실패 queues를 폐기하고 오류 상태에서 자동 재시도하지 않는다. 명시적 재시도/재마운트가 필요하다. 부분 DOM 예외는 renderer 오류 정책을 따른다.

useState(initial): mount에서만 lazy 초기화, setter 참조 안정. 값 또는 updater 함수를 queue에 넣고 같은 tick의 setter를 microtask 1회로 배치한다. updater는 순서대로 직전 값을 받는다. Object.is가 같고 props 변경도 없으면 render를 생략한다. 함수 자체 저장은 setter(()=>fn). 객체 직접 mutation은 지원하지 않는다. render/memo factory의 setter는 오류다. updater는 순수해야 한다. effect의 setter는 현재 commit 종료 뒤 다음 update다. unmount 후 setter/예약 작업은 무시하고 개발 경고를 남긴다. 연속 자동 update 50회 초과는 loop 오류로 중단한다.

useEffect(setup,deps): 성공한 DOM patch 후 실행한다. paint 이후 실행이나 React StrictMode 동작은 보장하지 않는다. deps 생략은 매 commit, []는 mount, 배열은 길이 및 원소 Object.is로 비교한다. deps는 복사해서 저장한다. 변경 effect의 기존 cleanup들을 슬롯 순서로 먼저 수행하고 새 setup들을 순서대로 실행한다. cleanup 참조는 실행 전에 비워 중복을 막는다. unmount는 살아 있는 cleanup을 한 번씩 실행한다. setup은 undefined/cleanup 함수만 반환하고 async/Promise 반환은 오류다. cleanup 오류는 보고하되 다른 cleanup은 수행한다.

useMemo(factory,deps): 같은 비교 정책. mount/변경에서 계산, 동일 deps면 값과 참조 재사용. 생략은 매 render, []는 mount 동안 유지. factory는 순수하고 Hook/setter 호출 금지. render 실패 시 draft cache는 commit하지 않는다.

unmount는 먼저 mounted=false로 예약 작업을 무효화하고 cleanup, engine의 빈 Tree 렌더, listener 정리, 슬롯 해제를 수행한다.

## 8. API Studio 경계와 화면
App만 draft, request lifecycle, response, 선택 탭, 정제된 recent metadata를 state로 보유한다. Sidebar/RequestEditor/KeyValueRows/RequestActions/ResponsePanel/JsonViewer/ErrorBanner는 props만 받는다. 함수형 자식 객체/DOM에 상태를 숨기지 않는다. 화면은 좌측 최근 이력, 중앙 URL/method·Params/Headers/Body 탭·Send, 하단 응답 status/time/headers/body로 구성한다. label, keyboard focus, 진행/오류 안내와 좁은 화면의 세로 배치를 제공한다.

필수 HTTP 메서드는 GET/POST/PUT/PATCH/DELETE. URL은 절대 HTTP(S)이고 userinfo는 거부한다. 활성 query 행을 복제 URL에 append하고 중복 이름을 보존한다. 기존 query를 이중 인코딩하지 않는다. 빈 활성 이름은 오류다. header 개행/invalid name을 전송 전에 거부한다. JSON body는 빈 문자열 허용, 비어 있지 않으면 JSON 검증. GET body는 보내지 않는다. JSON body가 있고 Content-Type이 없을 때 application/json을 넣는다.

useMemo는 draft 검증/normalized preview에 사용한다. Send callback이 snapshot과 id를 root state job에 넣고 useEffect([job])가 fetch를 실행한다. AbortController와 timer는 effect 지역 closure에 둔다. 새 job/unmount/Cancel 시 cleanup은 active=false, timer 해제, abort. result 반영은 active와 현재 job.id를 모두 확인한다. 이전 요청의 늦은 완료가 result/History를 덮어쓰지 못한다. request status/result/history를 한 state 모델에서 순수 함수형 updater로 함께 확정해 경합을 막는다. 상태 updater 안에서 다른 setter를 호출하지 않는다.

timeout 기본 30초. HTTP 4xx/5xx는 응답이며 네트워크 실패와 구별한다. 204/빈 body/text/JSON/잘못된 JSON을 구분해 raw text로 fallback하고 JSON parse 오류를 HTTP 전송 실패로 바꾸지 않는다. 응답 Header, Status, elapsed time을 표시한다. 긴 응답은 raw 문자열의 앞 100,000자까지만 화면에 표시하고 잘림을 알린다. 전체 본문 수신 메모리 제한은 이번 범위에서 보장하지 않으므로 README에 한계를 적는다.

credentials:'omit'을 기본으로 하며 브라우저 forbidden header/CORS 제약을 설명한다. fetch TypeError만으로 CORS인지 DNS인지 확정하지 않는다. 임의 CORS proxy나 외부 서비스 자동 POST/DELETE는 금지한다.

최근 이력은 최대 20개 세션 메모리의 **정제된 요청 메타데이터만** 저장한다. 응답 body, 요청 body, raw headers, 원본 요청 snapshot은 History에 넣지 않는다. 저장 항목은 id/time/method, 정제된 URL(아래 정책), status/elapsed뿐이다. URL은 query/hash/userinfo를 제거하고 pathname에서 password/token/key/secret/auth/credential 류 이름 뒤의 값 및 긴 토큰형 segment를 [redacted]로 치환한다. 이력 재선택은 method와 안전한 URL만 복원하고 Params/Headers/Body는 비우며 재입력을 안내한다. redacted URL은 자동 전송하지 않고 수정 전 Send를 차단한다. 재선택 자체는 전송하지 않는다. 임의 경로에 숨은 모든 비밀을 자동 식별할 수 있다고 주장하지 않으며 Clear History를 제공한다.

민감 header(Authorization, Cookie, Set-Cookie, X-API-Key 및 token/key/secret/password/auth 패턴)는 UI에서 마스킹하고 History/console/localStorage에는 기록하지 않는다. 사용자가 입력한 인증값은 명시적 Send 요청의 메모리 범위에서만 사용한다. response/URL/error는 VDOM text로 렌더링하여 HTML 실행을 막는다. App 직접 DOM 갱신/innerHTML/별도 렌더러는 금지한다.

## 9. 테스트 매트릭스 및 명령
Sol TURN 02에서 npm run dev / test:unit / test:e2e / test:all을 정의한다. test:unit은 watch 없이 종료, test:all은 unit과 E2E를 실행하며 하나라도 실패하면 비0 종료다. 실행 서버는 loopback에만 bind한다. unit은 Vitest/jsdom, E2E는 실제 Playwright browser. 아래는 미래 통과 조건이며 실행 결과가 아니다.

| ID | TURN | 시험과 판정 조건 |
|---|---|---|
| D01 | 02 | 실제 샘플 readTree → createDOM 복제 구조 동등, 최초 원본 DOM 참조 유지 |
| D02 | 02 | 중첩/공백/comment/빈 text/특수문자/boolean/ARIA/class/style/form live props, 지원 밖 입력 오류 |
| F01 | 03 | TEXT/ATTRS add-change-remove/INSERT/REMOVE/REPLACE/no-op의 정확한 계획 |
| F02 | 03 | freeze 입력 불변, 깊은 변경, 복수 형제와 key 중복/혼합/재정렬 계약 |
| P01 | 04 | 결과 구조와 별개로 무변경 Node ===, no-op DOM 쓰기 0 |
| P02 | 04 | 연속 삭제/삽입, 마지막 자식 삭제, text↔element, 부모 이동+자손 갱신 |
| P03 | 04 | listener A→B→제거, 반복 render에도 호출 1회, 제거 subtree 정리 |
| P04 | 04 | controlled value drift 복구, 불필요 대입 없음, select/textarea, 이동 시 focus/caret |
| P05 | 04 | stale/다른 renderer 계획·외부 구조 변경은 mutation 전에 거부 |
| H01 | 05/06 | 최초 두 영역, 실제 editHost 편집 → DOM 재독해 → actual에 부분 Patch, 문자열 비교 금지 |
| H02 | 05/06 | S0→S1→S2→Undo→S3, redo 폐기; no-op은 redo 유지; 양 영역 동기화 |
| H03 | 05/06 | 미적용 draft 이후 Undo/Redo/복구, snapshot 독립성, 한계/버튼, 오류 cursor 보존 |
| H04 | 05/06 | paste/drop HTML/위험 속성/style/URL/script는 삽입 전 거부, class/style 안전 편집 성공 |
| R01 | 07 | 여러 state 슬롯, lazy 초기화 1회, 안정 setter, +1 updater 3회 결과 +3 |
| R02 | 07 | 같은 state no-op, child/outside/조건부 Hook 오류, render setter, unmount 예약 무효 |
| R03 | 08 | effect 생략/[]/동일/변경/길이 변화, cleanup→setup/unmount 1회, Promise 반환 오류 |
| R04 | 08 | memo 호출 수/반환 ===, Object.is의 NaN/-0, 실패 render cache 비commit |
| R05 | 08 | cleanup 예외 뒤 다른 cleanup, effect update 재진입 방지, Phase 1 회귀 |
| A01 | 09 | Mock Fetch 5메서드, URL/query/header/body, JSON 검증/GET body 제외 |
| A02 | 09 | 2xx/4xx/5xx/204/text/invalid JSON/network/timeout, 민감 metadata 정제 |
| A03 | 10/11/12 | loopback HTTP echo가 실제 method/query/header/body 수신; 오류 후 재전송 |
| A04 | 10/11/12 | 느린 A→빠른 B, 취소/unmount 이후 늦은 결과 무시, 이력 오염 없음 |
| A05 | 10/11/12 | 입력 focus/caret, 탭/행/이력 재선택, 긴 JSON, HTML 응답 비실행, console 오류 없음 |
| A06 | 11/12 | shared 엔진 import/실행 경로, 금지 런타임/직접 DOM 우회 없음, README 재현 |

기대값은 독립 literal 구조/실제 Node 참조/호출 수로 검증한다. 같은 production 함수를 기대값 생성에 재사용하지 않는다. snapshot 문자열 비교만으로 참조 보존을 주장하지 않는다. MutationObserver는 쓰기 검증 보조로만 사용한다. API unit의 mock과 실제 브라우저 전송 증거를 구별한다. CORS 실패는 다른 origin의 loopback fixture로 재현한다. 공개 API는 선택 사항이며 CI 통과 의존성으로 삼지 않는다.

TURN 06/12는 기존 테스트 실행 외에도 아래 반례를 독립 선정해 재현한다. 리뷰 중 제품/기존 테스트를 임의 수정하지 않으며 추가 저장소 테스트는 별도 승인 범위다. 브라우저 검증 턴에 Playwright Skill을 읽어 절차를 따른다. 미설치/실행 불가면 TEST_BLOCKED이지 PASS가 아니다.

## 10. 설계 반례 검토 (추론, 제품 테스트 아님)
| 반례 | 예상 계약과 방어 |
|---|---|
| keyed [A,B,C,D]→[B,E,D] | A/C만 제거, E 생성, B/D 참조 유지; old index 재조회 없음 |
| 같은 key div→span 및 text→element | old 참조 교체를 CHILDREN next의 fresh로 표현, leaf 변경과 구별 |
| 부모 B 이동 + B 내부 text 변경 | 참조를 모두 먼저 결속하고 깊은 부모부터 처리하여 올바른 B 수정 |
| S2에서 editHost만 추가 편집 후 Undo | editHost를 현재 DOM으로 읽어 diff, actual은 committed baseline 유지, 두 영역 S1 |
| Undo 후 no-op Patch | cursor/redo 유지; snapshot 공유 mutation 금지 |
| input 실제값≠VDOM의 같은 목표값 | structural plan no-op이어도 controlled prop 비교로 복구, history append 불필요 |
| effect deps 동일 및 state→실패 render | cleanup/setup 미실행, 기존 memo/effect 슬롯 유지 |
| A 요청 완료가 B보다 늦음 | effect active + job.id guard로 결과/메타데이터 모두 B 유지 |
이 표는 설계가 요구 사례를 표현하는지 검토한 증거다. 실제 엔진 테스트 PASS로 집계하지 않는다.

## 11. 12턴 게이트와 인계
| TURN | 담당 | 종료 조건 |
|---|---|---|
| 01 | Astra | 본 계약·반례·24개 테스트 기준·짧은 AGENTS·루프 기록 완성 |
| 02 | Sol | 로컬 환경/Git 판단/스크립트, D01~D02 unit |
| 03 | Sol | 순수 diff/계획, F01~F02 unit |
| 04 | Sol | patch/events/참조, P01~P05 unit/DOM 통합 |
| 05 | Sol | 두 영역/직접 편집/History, H01~H04 unit+실제 E2E 후 STOP |
| 06 | Astra | Phase 1 독립 코드/테스트/브라우저 검수, CRITICAL/HIGH 0 및 미검증 필수항목 0 |
| 07 | Sol | FunctionComponent/hooks/useState, R01~R02 |
| 08 | Sol | effect/memo/실패 처리, R03~R05와 Phase 1 회귀 |
| 09 | Sol | API 순수 모델/fetch/history, A01~A02 |
| 10 | Sol | 전체 자체 엔진 UI, A03~A05 브라우저 |
| 11 | Sol | 전체 unit+E2E/README/제약 점검, A06, 인계 후 STOP |
| 12 | Astra | 전체 독립 반례/실행/문서 검증, 최종 포트폴리오 승인 |

현재 TURN 01만 승인한다. CRITICAL/HIGH 또는 필수 미검증은 QA PASS 금지. 검수 반려 수정은 동일 TURN의 REVIEW_REWORK이며 하네스의 3회 구현 수정/2회 QA 재검수 한도를 따른다.

Sol 인계 증거: 실제 commit 또는 none, git status, 명령/종료코드/통과·실패·skip, trace 경로, 관련 파일·테스트 ID, 제한 사항. 검수 시작/끝의 작업 트리를 대조하고 동시 변경이면 중단한다. README에는 두 페이지 실행, Mini React 차이·제약, 핵심 알고리즘, 테스트 재현, CORS/History 개인정보 정책, 시연 절차를 포함한다.


---

## TURN 06 첫 재검수 보완 계약 — Phase 1 ID 경계 (2026-11-07)
설계 판정: **아래 제한적 보완을 Astra가 승인한다. 구현 및 TURN 06 QA는 미승인(REJECTED)**. 이 절은 위 §4~6의 Phase 1 입출력에만 추가되는 경계 계약이며 default renderer/Phase 2의 attrs 계약은 유지한다. 실제 구현은 Sol REVIEW_REWORK 2 담당이다.

### 필요성과 대안
612bea5의 별개 form wrapper는 radio 그룹을 분리하지만 duplicate id/for의 문서 전역 연결을 바꾸지 못한다. 독립 Chromium에서 editor label.control이 actual input을 가리키고 actual labels=2/editor labels=0, editor 접근성 이름 없음이 재현됐다. capture click 우회는 입력 동작 일부만 복구한다.
Phase 1 host별 물리 ID/IDREF 격리를 채택한다. 클릭 우회만 유지하거나 aria-label을 덧씌우는 대안은 native 연결을 해결하지 않는다. iframe/별도 document는 문서 소유권·포커스·선택/UI 영향이 크고 Shadow DOM은 현 범위 밖이므로 이번 수정에 도입하지 않는다.

### 필수 불변식과 구현 경계
1. VDOM/History/Inspector의 사용자 id 및 label for는 논리 값이다. 두 host는 같은 논리 Tree를 가지되 물리 DOM ID는 host별 namespace로 달라질 수 있다. ID 생성은 다른 host 및 Inspector ID와 충돌하지 않아야 한다. 단순 문자열 prefix 제거로 임의 사용자 값을 오인하지 말고 소유권 있는 mapping을 사용한다.
2. Phase 1에만 선택적 scope/context를 적용한다. DOM→Tree, createDOM, attrs patch, preflight, Inspector 후보 생성/선택이 동일한 변환을 사용해야 한다. context 없는 기존 API/default renderer는 그대로 동작한다. 새 Diff/Patch 엔진, DOM 전체 교체, managed DOM 재채택은 금지한다. 필요한 선택적 인자와 내부 helper는 구현 문서에 명시한다.
3. 초기에는 실제 sample DOM을 먼저 논리 Tree로 읽고 검증한다. 실제 source Node 자체는 보존한다. 이 경계 설정을 위한 id/IDREF 물리 속성 변환만 초기화 예외로 허용한다. snapshot은 초기 논리 값과 live 상태를 보존하며 복제 노드는 이미 격리된 속성으로 삽입한다. 초기 radio 상태나 focus를 바꾸지 않는다.
4. label.for는 같은 host의 논리 id만 참조한다. native label.control/input.labels와 접근성 이름이 각각 해당 host에 결속되어야 한다. 외부에만 같은 id가 있는 경우 그 외부 control/Inspector에 연결하지 않는다. implicit label 및 직접 control 클릭/키보드는 native 의미를 유지한다.
5. 기존 지원 aria-* 중 ID를 참조하는 값도 같은 경계를 따라야 한다. 최소 aria-labelledby/aria-describedby와 지원하는 다른 단일/목록 IDREF 속성을 명시하여 처리한다. 일반 문자열/boolean ARIA는 원문 보존한다. IDREF 목록의 순서/공백 의미 및 존재하지 않는 내부 대상 처리 방침을 기록한다. ID 격리를 위해 aria 지원을 조용히 제거하지 않는다.
6. 사용자 편집은 현재 edit DOM에서 다시 읽는다. 도구가 적용한 알려진 physical 값만 logical 값으로 복원하며, 사용자가 새로 편집한 logical ID를 오래된 캐시로 덮어쓰지 않는다. Inspector의 논리 ID 선택과 속성 선택(예: #box, [id="box"], label[for="box"])은 계속 동작해야 한다. namespace를 UI/History에 노출하지 않는다. 동일 host 내 중복/빈 ID는 명시적 정책과 시험을 두고 임의의 다른 host 대상으로 fallback하지 않는다.
7. 실제 managed DOM의 외부 id/for/IDREF 변경은 mutation 전에 거부한다. physical projection은 엔진이 소유한 값만 증명하며 현재 DOM을 무조건 신뢰하는 검증 예외가 아니다. 나머지 attrs/구조 검증 및 value projection을 유지한다.
8. id/for 대상 변경·삭제·노드 이동, no-op, Undo/Redo와 미적용 draft를 처리한다. no-op mapping 재할당/불필요 DOM write 없음, Node === 및 focus/caret 유지. History와 양 영역 비교 oracle는 논리 구조를 비교하되 native 관계 검증을 별도로 둔다. 물리 값 차이가 예상된다는 이유로 id/for 검증 자체를 제거하지 않는다.

### 영향 및 추가 완료 기준
영향은 Phase 1 경계 관리, 공유 dom/patch/renderer의 선택적 context, Inspector의 logical selector/생성 경로 및 관련 테스트에 한정한다. 순수 diff와 Tree 형식, hooks/Phase 2 계획은 유지한다. 일반 CSS selector를 다루기 위한 대규모 parser/렌더링 재작성은 허용하지 않는다. 구현 방식이 이 경계를 벗어나야 하면 실제 변경안/비용을 기록하고 중단한다.
추가 gate: 두 host에서 explicit label.control===자기 input, input.labels에 다른 host label 없음, 동일 접근성 이름 각각 유지, implicit/중첩/checkbox/radio/text/Space/focus 정상. 외부-only 참조가 native 연결/편집/Inspector를 침범하지 않음. 논리 id/for 및 ARIA IDREF round trip·Inspector 편집·삭제/재지정·History, 초기 source 참조·radio checked, no-op 쓰기0, 실제 외부 physical attr 거부를 unit/실제 Chromium으로 검증한다.
기존 60 unit/14 E2E 및 QA06-001/002/004 회귀를 유지한다. 기존 DOM oracle 변경이 필요하면 물리 표현과 논리 구조의 독립 oracle 및 native 관계 assertion을 함께 제공하고 검증을 약화하지 않는다. 추가 테스트 작성은 이 Sol 결함 수정 범위에 포함되며 Astra QA는 제품/테스트를 직접 수정하지 않는다.
