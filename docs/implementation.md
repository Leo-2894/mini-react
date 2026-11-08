# API Studio 구현 설명과 검증 지도

이 문서는 구현 설명이다. 승인 계약은 architecture.md, 독립 검수 원문은 loop/reviews/를 따른다. TURN06은 Phase1의 당시 SHA를 승인했으며 이후 변경/Phase2는 TURN12 별도 독립 검수 대상이다.

## DOM → VDOM → Diff → Patch

- vnode.js는 element/text/comment/root Tree를 구별하고 속성/live props/events를 분리한다. h(Child, props)는 wrapper DOM 없이 순수 함수 결과를 검증하며 Hook 권한을 잠시 차단한다.
- dom.js는 childNodes를 읽어 공백·주석과 입력 live 값을 보존한다. 이벤트는 역추출하지 않고 엔진 소유 WeakMap/committedTree에서 관리한다.
- diff.js는 이전 Tree의 preorder Ref와 CREATE/TEXT/ATTRS/EVENTS/CHILDREN/PROPS 계획을 만든다. key가 있으면 key, 없으면 unkeyed 순서로 대응한다. 입력 Tree와 DOM은 수정하지 않는다.
- patch.js는 모든 이전 참조와 외부 구조/속성을 먼저 검증한다. 깊은 부모부터 CHILDREN을 적용하고 살아 있는 노드 cursor로 이동하므로 삭제된 형제 인덱스로 다시 조회하지 않는다. 불변 Node와 listener/focus/caret을 보존한다. 전체 최단 편집/LIS는 보장하지 않는다.
- renderer.js는 계획 발급자와 revision을 검증해 stale/foreign/replayed 계획을 거부한다. Phase1 actual과 Phase2는 managed이고 editable만 명시적 DOM 채택이 가능하다.

## Phase1 History와 ID 경계

controller는 매 작업에서 현재 edit DOM을 다시 읽는다. actual은 committed Tree를 기준으로 유지한다. 성공한 작업만 독립 snapshot/cursor를 진행한다. Undo 뒤 no-op은 Redo를 유지하고 새 변경은 미래 분기를 버린다. 최대 50개다.

host별 physical id/IDREF와 radio form owner를 분리하되 VDOM/History/Inspector에는 logical 값이 남는다. native label.control/input.labels와 Chrome AX 이름을 별도로 검사한다. 자세한 정책/선택적 API는 id-scope.md 참고.

읽기 전용 candidate/첫 actual preflight 실패는 두 DOM/cursor를 보존하고 잠그지 않는다. projection 첫 쓰기부터 준비/commit 중 예상 밖 실패는 원본 오류를 전달하고 잠근다. 완전 rollback을 주장하지 않는다. QA06-005 및 projection-failure 시험이 이 경계를 검증한다.

## FunctionComponent와 Hook transaction

FunctionComponent 인스턴스는 committed hooks/queues/index/props/renderer/오류/예약표를 소유한다. module 전역에는 현재 Hook 실행 권한 같은 일시적 메타데이터만 있다.

1. setter는 안정된 슬롯·mount generation을 참조하고 값/updater를 호출 순서대로 queue에 넣는다.
2. 같은 tick의 호출은 한 microtask로 합친다. draft state의 최종값이 Object.is로 같고 props 변화도 없으면 App을 실행하지 않는다.
3. App 재실행은 draft 슬롯에서만 계산한다. Hook 종류·개수와 VDOM을 검증하고 기존 renderer의 같은 Diff/Patch를 호출한다.
4. DOM 성공 뒤 hooks/props/cache를 commit한다. 변경 effect들의 cleanup 전체를 슬롯 순서대로 실행한 후 setup 전체를 실행한다. effect setter는 다음 microtask다.
5. render 실패는 이전 UI/hooks/memo cache를 유지하고 실패 queue를 폐기한다. 자동 재시도하지 않는다. 부분 DOM 오류 및 post-commit effect 오류는 render 실패와 구별한다.
6. unmount는 예약 ticket/generation을 무효화하고 cleanup·같은 엔진의 빈 Tree·listener/슬롯 정리를 수행한다. 연속 자동 update 50회 초과는 중단한다.

State/Hooks는 App 루트만 소유한다. 자식은 props 전용이다. 자식/이벤트/initializer/updater/effect/memo factory 안의 Hook, render/updater/memo 안의 setter를 제한한다. JavaScript의 모든 조건부/custom Hook/직접 Child 호출 위반을 자동 탐지할 수는 없어 정적 검수도 필요하다. React Fiber/Concurrent/StrictMode 및 전체 호환성을 구현하지 않았다.

## 요청 수명과 데이터 경계

App의 draft/검증 memo → Send에서 immutable snapshot/job.id → useEffect([job]) → AbortController + sendRequest → response와 안전한 metadata를 한 함수형 state updater에서 확정한다.

새 job/Cancel/unmount의 cleanup은 active=false와 abort를 수행한다. 완료 처리에서 active 및 현재 job.id를 모두 확인한다. 취소를 무시하는 transport에서도 늦은 결과를 무시하는 별도 통합 시험이 있다.

buildRequest는 URL/query/header/JSON을 전송 전에 검증한다. Fetch는 credentials:omit, 기본 30초 timeout이며 CORS를 우회하지 않는다. 4xx/5xx는 HTTP 응답으로 유지하고 잘못된 JSON은 raw fallback, 네트워크/CORS/DNS는 단정하지 않은 별도 오류다. Cookie/Host 같은 금지 헤더는 브라우저가 제어한다.

History는 20개 세션 메모리이며 query/hash/userinfo/민감 경로를 제거한 URL과 method/id/time/status/elapsed만 저장한다. raw headers/body/response/snapshot/localStorage 저장은 없다. 긴 segment는 24자 이상의 영숫자·_+=.-를 대상으로 JWT/base64형을 포함한다. 경로 정제는 heuristic이며 임의 비밀을 모두 발견하는 보장은 없다. 재사용은 인증·Params·Body를 지우며 자동 Send하지 않는다.

JSON은 VDOM text만 사용한다. 트리 200개/8단계, scalar 생략 안내, pretty/raw 100000자 제한을 제공한다. 전체 응답 수신 메모리 제한은 보장하지 않는다.

## 시험과 설명 위치

- D01~P05: vdom/diff/patch unit; phase1 E2E의 참조/listener/caret/stale plan.
- H01~H04, QA06-001~005: history/review06/id-scope/projection-failure unit 및 Chromium E2E.
- R01/R02: component unit/E2E. R03~R05: hooks unit/E2E와 integration의 교차 root/cleanup 경계.
- A01/A02: api unit의 Mock Fetch/시간 제어. 실제 전송 증거와 구분한다.
- A03~A05: studio/integration E2E가 loopback4174에서 5 methods/query/header/body, 4175에서 CORS 실패, race/cancel/timeout/privacy/History/JSON/모바일을 검증한다.
- A06: main→App→component→renderer→diff/patch 경로와 의존성/직접 DOM 우회 정적 자체 검토, 두 페이지 이동 및 내부 경로 차단 E2E.

수치는 README와 loop의 최신 기록을 따른다. 기존 독립 보고를 수정하지 않으며 최종 제품 승인 여부는 TURN12 독립 검수에서 결정한다.
