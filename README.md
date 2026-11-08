# API Studio / Mini React

현재 진행: Phase 1은 TURN 06 별도 독립 APPROVED. TURN 07~11 자체 Mini React Hooks·API Studio·통합 검증을 완료했다. 전체 제품은 TURN 12 별도 독립 검수 대기다.

## 실행 (Windows PowerShell)

```powershell
Set-Location -LiteralPath 'C:\Users\Leo\Desktop\API 1'
npm ci
npx playwright install chromium
npm run dev
```

API Studio는 `http://127.0.0.1:4173/`, DOM Lab은 `http://127.0.0.1:4173/phase1/`에서 실행한다. 서버는 127.0.0.1에서만 실행한다. Node 24.22.1 / npm 11.19.1에서 검증.

```powershell
npm run test:unit
npm run test:e2e
npm run test:all
```

E2E는 앱/HTTP/CORS 서버를 자체 시작·종료하므로 실행 전 수동 서버를 종료해 4173/4174/4175 포트를 비운다. 실패 시 `test-results/`에 screenshot/trace, `playwright-report/`에 HTML 보고서가 남는다. 초기 실패 증거는 `output/playwright/turn05-attempt1/`에 별도 보존했다.

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

HTTP 통신·CORS·민감 요청 이력 정제 및 Phase 2 사용법은 아래에 설명했다. Phase 1은 TURN 06 독립 승인을 받았고 이후 구현 변경은 TURN 12 독립 검수 대상이다. 기술 계약은 `docs/architecture.md`, 실제 진행/인계/실패 기록은 `docs/loop/` 참고.

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

## useEffect / useMemo (TURN 08)

useEffect(setup, deps)는 성공한 DOM Patch와 Hook commit 뒤에 실행한다. 변경된 슬롯의 cleanup을 먼저 모두 실행하고 새 setup을 슬롯 순서로 실행한다. deps 생략은 매 commit, []는 mount, 배열은 길이 및 각 원소 Object.is 비교이며 배열은 복사한다. unmount는 살아 있는 cleanup을 한 번씩 실행한다. cleanup 오류가 있어도 다른 cleanup을 계속 수행한다. setup은 undefined 또는 동기 cleanup 함수만 반환할 수 있다.

useMemo(factory, deps)는 같은 deps 정책으로 값과 참조를 재사용한다. 계산은 render draft에만 저장하므로 render 실패 시 committed cache를 보존한다. memo factory의 Hook/setter는 금지한다. effect의 setter는 현재 commit 뒤 별도 microtask로 처리하며 연속 자동 update 50회 초과를 오류로 중단한다. effect/cleanup 실패는 이미 반영된 UI를 rollback하지 않고 오류를 보고한다. 실패한 effect를 확실히 다시 시작하려면 원인을 수정한 뒤 unmount/mount한다.

## HTTP 모듈 (TURN 09)

`src/api/request.js`의 buildRequest는 GET/POST/PUT/PATCH/DELETE, 절대 HTTP(S) URL, 중복 query와 Headers, JSON body를 검증한다. GET body는 보내지 않고 JSON body가 있을 때만 누락 Content-Type을 보충한다. userinfo·개행 header·정제된 [redacted] URL의 전송을 거부한다. sendRequest는 Fetch/credentials:omit, 기본 30초 timeout, 외부 AbortSignal을 사용한다.

HTTP 4xx/5xx는 상태·headers·body가 있는 응답이다. 잘못된 JSON은 raw text로 표시하고 parse 경고를 구분한다. 네트워크 오류만으로 CORS/DNS 원인을 확정하지 않으며 우회 proxy를 사용하지 않는다. response header의 auth/cookie/key/token/secret/password/credential 이름 값은 마스킹한다. 응답 표시는 100,000자로 제한하고 잘림을 알린다. 전체 수신 메모리 제한은 보장하지 않는다. 깊은 JSON은 pretty stringify 실패 시 raw text로 fallback한다.

History는 세션 메모리 20개이며 id/time/method/정제 URL/status/elapsed만 저장한다. query/hash/userinfo를 제거하고 민감 이름 뒤 경로 값과 24자 이상의 영숫자·_+=.-로 이루어진 JWT/base64형을 포함한 긴 토큰 segment를 [redacted]로 가린다. 임의 경로에 숨은 모든 비밀을 탐지하는 보장은 없다. 재사용은 method/정제 URL만 복원하며 Params/Headers/Body를 비운다. 자동 전송하지 않는다. localStorage와 console에 요청·응답 본문이나 인증값을 기록하지 않는다.

## API Studio 시연 (TURN 10)

1. URL과 HTTP method를 선택한다. Params/Headers에서 행을 추가하고 체크박스로 전송 여부를 바꾼다. Body 탭은 GET 외 메서드의 JSON을 편집한다.
2. Send request 또는 Ctrl/⌘+Enter로 전송한다. 다시 보내면 이전 작업을 취소하며 최신 요청만 결과/이력에 반영한다. Cancel request도 제공한다.
3. 상태·소요 시간과 JSON 트리/Raw/Response headers를 확인한다. 트리는 최대 200개 항목·8단계이며 긴 scalar는 생략을 알린다. Raw/pretty 본문은 최대 100,000자다. HTML은 문자열로 표시한다.
4. Recent requests는 method와 정제 URL만 복원한다. 인증/Params/Body는 다시 입력한다. Clear로 이력을 비우며 reload하면 세션 이력도 사라진다. [redacted] 경로는 편집하기 전 Send가 차단된다.
5. Cookie/Host 등 forbidden header는 브라우저가 제어하며 입력한다고 전송되는 것이 아니다. CORS 허용 여부도 대상 서버가 결정한다. credentials는 omit이며 명시적 Authorization header는 해당 Send 요청에 사용한다.

외부 API 없이 재현하려면 dev 서버와 별도 터미널에서 `node tests/fixtures/server.js`를 실행한다. 앱에 `http://127.0.0.1:4174/echo`를 입력하면 로컬 method/query/header/body echo를 확인한다. 4174는 4173 origin만 CORS 허용, 4175는 CORS 미허용 대조군이다. 두 서버는 테스트 전용이며 E2E는 4173/4174/4175를 자체 시작·종료하므로 수동 서버를 먼저 종료한다.

## 최종 자체 검증 (TURN 11)

| 명령 | 종료 코드 | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 152 | 0 | 0 |
| npm run test:e2e | 0 | 59 Chromium | 0 | 0 |
| npm run test:all | 0 | 152 unit + 59 Chromium | 0 | 0 |

현재 고유 정규 시험 211개이며 반복 실행은 합산하지 않았다. 단계별 실제 수치는 TURN07 102+35, TURN08 118+36, TURN09 144+36, TURN10 148+53, TURN11 152+59다. 증거는 output/playwright/turn07~turn11/, 최종 test-unit/test-e2e/test-all.log 및 results.json이다. 실패→수정 증거도 별도 보존했다.

TURN11은 취소 신호를 무시하는 transport의 늦은 응답, 실제 UI History20개/reload, 정제 URL 전송 차단, 동적 행 Node 보존, 두 페이지 왕복, 경로 경계 및 긴 JWT/base64 경로 정제를 추가 검증했다. timeout E2E는 짧은60ms와 지연200ms를 대조한 뒤 기본30초로 복구해 정상 재전송을 확인한다. 시험 삭제/skip/기대값 완화로 통과시키지 않았다.

구현 설명과 시험 지도는 [docs/implementation.md](docs/implementation.md), ID 경계는 [docs/id-scope.md](docs/id-scope.md)를 참고한다. 독립 TURN06 보고와 architecture 원문은 보존했다. 이후 코드의 최종 독립 승인으로 확대하지 않는다.

미검증: Firefox/WebKit, 실제 스크린리더 운용, clean dependency reinstall, 실제 외부 API의 가용성/CORS, 예외 주입의 자연 발생 빈도. 현재 설치 환경에서 전체 시험을 실행했으며 최종 제품 승인과 별개다. 원격 push/PR/배포는 수행하지 않았다.
