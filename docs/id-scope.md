# Phase 1 logical / physical ID scope

구현 근거: architecture.md 말미의 Astra 승인 보완 계약. 이 문서는 구현 설명이며 독립 QA 승인 문서가 아니다.

## 선택적 API

- createDOMScope(host): src/mini-react/scope.js. host에 결속된 경계 context.
- domToVNode(node, scope?), readTree(host, scope?): Node에 이 scope가 직접 쓴 physical 값과 현재 값이 정확히 같을 때만 logical 값으로 복원.
- createDOM(vnode, document?, scope?): detached Node에 physical attrs를 설치한다. caller는 전체 logical Tree를 scope.validateTree로 검증한다.
- createRenderer(host, {role, scope?}), validatePatch(host, plan, scope?), patch(host, plan, scope?): 동일 Diff/Patch에 context를 전달한다. scope가 없으면 이전 API 동작 그대로다.
- scope.validateTree(tree): Phase 1 logical ID의 빈 값/ASCII 공백/동일 host 내 중복을 오류로 거부한다. default renderer의 id 정책을 바꾸지 않는다.
- scope.projectTree(tree): 초기 actual 경계 설정(렌더러 생성 전)과 편집 host의 알려진 logical draft 정규화에만 사용. element 재생성이나 managed Tree 재채택은 하지 않는다.
- scope.querySelector(selector): detached logical DOM view에서 브라우저 CSS selector를 평가하고 실제 원본 Node로 대응한다. #box, [id="box"], label[for="box"], compound/escaped structural selector는 브라우저 parser가 처리한다. view는 연결/렌더링하지 않으며 실제 DOM을 쓰지 않는다. :focus 같은 live focus pseudo-state를 복제하는 에뮬레이터는 아니다.

## ID와 IDREF

VDOM/History/Inspector는 logical 값을 보존한다. 실제 DOM의 id는 document별 예약 registry와 scope별 Map으로 안정적인 physical ID에 연결한다. 매핑은 scope 수명 동안 유지하여 Undo/Redo/삭제 후 재생성에도 재사용한다. 초기 생성 시 document의 기존 ID 및 다른 scope 예약값과 충돌하지 않게 할당한다. prefix 제거로 역변환하지 않는다.

label for는 단일 logical ID로 매핑한다. 대상이 없어도 그 scope만의 ID를 예약하므로 외부/Inspector에 같은 logical ID가 있어도 fallback하지 않는다. 이후 해당 logical ID가 내부에 생성되면 같은 예약값으로 native 연결된다.

ARIA IDREF 지원 목록:
aria-labelledby, aria-describedby, aria-controls, aria-owns, aria-flowto, aria-details, aria-errormessage, aria-activedescendant.
이들의 ASCII whitespace로 구분된 각 ID token을 매핑하고 token 순서와 원래 공백 문자열을 보존한다. 단일 IDREF인 aria-activedescendant는 정상 입력의 한 token에 같은 규칙을 사용한다. 잘못된 다중 token 입력을 별도 유효한 ARIA로 고치는 기능은 아니다. 일반 aria-label/aria-hidden/aria-expanded 등의 문자열·boolean은 그대로 둔다. 존재하지 않는 IDREF는 scope의 dangling physical ID가 되어 외부 대상을 참조하지 않는다.

Node별 WeakMap에는 이 scope가 직접 설치한 logical/physical 속성 쌍만 기록한다. 사용자 raw logical 편집은 현재 값이 기록의 physical과 다르므로 새 값으로 읽힌다. 새 Node에 우연히 physical-looking 문자열을 넣어도 기록이 없으면 logical 문자열로 취급한다.

## 생성 / 편집 / Patch / History

1. actual source를 context 없이 먼저 읽고 정책·ID를 검증한다. 원래 Node는 유지한다.
2. 별도 form owner로 radio 그룹을 격리하고 초기 focus/caret을 보존한다. host 내부 id/IDREF 속성만 초기 physical projection을 적용한다.
3. actual renderer는 scoped logical Tree를 baseline으로 채택한다. editor는 같은 Tree에서 이미 격리된 detached Node를 생성·삽입한다.
4. Inspector는 scoped 읽기/논리 selector를 사용한다. 후보를 현재 logical 전체 Tree에 대입해 정책·중복 ID를 검증한 뒤 scoped createDOM으로 editor에만 넣는다.
5. Patch는 현재 editor DOM을 scoped readTree로 다시 읽는다. actual의 physical attrs/구조를 사전 검증한 후 editor ID 경계를 정규화하고 같은 엔진으로 actual을 갱신한다.
6. History 이동은 actual 사전 검증 후 현재 editor draft를 정규화·채택한다. 두 계획을 검증한 뒤 적용하고 마지막에 cursor를 옮긴다. actual managed DOM은 재채택하지 않는다.

preflight는 logical attrs의 정확한 예상 physical projection과 실제 physical attrs를 비교한다. 변경된 id/for/ARIA를 logical 값으로 무조건 읽어서 통과시키지 않는다. 기존 input.value projection과 나머지 attrs/구조 검증을 유지한다. no-op에서 mapping 재할당/DOM 쓰기는 없다.

이전 label capture/click guard는 제거했다. native label.control/input.labels/포커스/키보드와 Chrome native Accessibility 이름은 고유 physical ID로 복구한다. getter 조작/aria-label 대체/새 렌더링 엔진을 사용하지 않는다.

## 검증과 범위

unit/id-scope.test.js는 literal logical 값, 소유권 read-back, 전 IDREF 목록, 편집·삭제·History, empty/duplicate ID, external attr preflight, no-op, 논리 selector, default API를 검사한다.
e2e/id-scope.spec.js는 checkbox/radio/text의 native 관계·이름, Chrome CDP Accessibility 트리, 외부-only 격리, IDREF 편집/삭제·독립 논리 oracle·snapshot/History, 초기 source/focus/caret, physical 오염, Inspector logical selector를 검사한다. 기존 회귀도 유지한다.

지원 경계: Phase 1 전용 context이며 default renderer/Phase 2 계약은 바꾸지 않는다. 모든 스크린리더/Firefox/WebKit 인증이나 임의 외부 스크립트가 나중에 복제 physical ID를 고의 삽입하는 상황을 보장하지 않는다. Inspector의 selector view는 구조/속성 선택용이며 live focus 상태를 복제하지 않는다. 허용하지 않은 HTML URL/resource 참조나 임의 stylesheet ID selector를 재작성하는 기능은 없다.
