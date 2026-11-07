# [TURN 06/12 — OWNER: Astra — INDEPENDENT QA REPORT]
STATUS: REJECTED
SCOPE: Phase 1 / D01~D02, F01~F02, P01~P05, H01~H04
BASELINE HEAD: 90fc52b63099f537a7be319eef6b0db449afdad4
PRODUCT COMMIT: 83b1711ae13a63fba6cb38eaf6cb5162c12bc7ec
NEXT OWNER / ACTION: Sol / REVIEW_REWORK → Astra 동일 TURN 06 재검수
ARCHITECTURE CHANGES: 직접 변경 없음. 아래 폼 반영/영역 격리 수정안의 계약 영향을 Sol이 기록해야 함.
COMMIT: 리뷰 문서 커밋을 만들지 않음. 위 HEAD는 검사 대상 코드이며 승인된 코드라는 의미가 아님.
HANDOFF: docs/loop/HANDOFF.md 작성 완료

## 1. 종합 판정
**REJECTED / FAIL. TURN 07 진입 불가.**

기존 테스트 53 unit + 8 Chromium E2E는 직접 실행해 모두 통과했다. 그러나 독립적인 실제 브라우저 반례에서 HIGH 3건, MEDIUM 1건을 재현했다. 성공 안내/History와 실제 양쪽 DOM이 달라지는 문제가 있으므로 Phase 1 완료 게이트를 충족하지 못한다.

필수 문서를 지정 순서로 읽었다. Astra 전용 별도 파일은 검색 결과 없었고, AGENTS/전체 하네스/STATE/HANDOFF/architecture/turn01/LOG/ISSUES를 확인했다. 처음 작업 트리는 clean, 실제 cwd·Git root는 지정 경로였다. 인계 HEAD가 일치하며 83b1711→90fc52b는 공통 기록 4개만 변경했고 제품/테스트 diff는 없다. 검수 중 제품 코드/기존 테스트/설계를 수정하지 않았다.

## 2. 요구사항 충족 상태
| 범위 | 판정 | 직접 근거와 한계 |
|---|---|---|
| D01 초기 실제 DOM 읽기/복제/참조 | 부분 충족 | 기존 샘플과 단위 reference 검증 통과. radio 샘플은 복제만 해도 실제 checked 변경(QA06-002) |
| D02 변환/props | 부분 충족 | text/comment/공백/attrs/form 일반 사례 통과. 명시적인 checkbox props.value의 reflected attribute 처리 실패(QA06-001) |
| F01~F02 순수 Diff/5종/불변/혼합 | 충족(검증한 범위) | literal operation 기대값, freeze, 복수 변경. 독립 mixed text/comment/key 이동 및 이동 부모 내부 변경에서 참조 6개 유지 |
| P01~P03 참조/인덱스/listener | 충족(검증한 범위) | no-op mutation 0, 연속 삭제/삽입, 기존 25쌍 목록 사례. 독립 부모 교체 뒤 detached button click 호출 0 |
| P04 live props/focus | 미충족 | 기존 text/textarea/select/caret 시험 통과하나 QA06-001/002/003 발생 |
| P05 계획 유효성/외부 변경 | 부분 충족 | stale/foreign/replay/외부 구조 변경 기존 시험 통과. 자체 reflected attribute를 외부 변경으로 오인하는 QA06-001 남음 |
| H01 실제 edit DOM 재독해/Patch | 미충족 | 정상 텍스트·Inspector 경로는 shared renderer 사용. radio/label 교차 간섭으로 편집 경계 깨짐 |
| H02~H03 History/두 영역 동기화 | 부분 충족 | 일반 분기/no-op/Undo/Redo/잠금 통과. 독립 55회 적용 후 50개 보존·최저 S6/최신 S55 양쪽 복원 확인. radio는 성공 후 양 영역 불일치 |
| H04 입력 안전 정책 | 부분 충족 | on*/위험 URL/style/script 및 plain paste/drop 시험 통과. 허용 id가 Inspector 조회를 가로채는 QA06-004 |
| 금지 라이브러리/엔진 우회 | 충족(현 Phase 1) | package는 devDependencies만, 소스 직접 검사. Inspector editHost 교체는 허용된 직접 편집 예외. actual과 동적 제어 UI는 같은 renderer/diff/patch |
| Phase 2 기능/재사용 완료 | 범위 밖 | 07~12 미착수이며 미구현 자체는 이번 결함 아님. 공유 엔진의 현재 결함은 지금 수정 필요 |

## 3. 발견한 결함

### QA06-001 — HIGH — checkbox value 반영 후 자신의 DOM을 외부 변경으로 오인
- 위치: src/mini-react/dom.js:13~14, 35~39; src/mini-react/patch.js:18~19; src/mini-react/renderer.js:27~28.
- 재현: /phase1/에서 아래 코드를 브라우저 console 또는 Playwright CLI eval로 실행한다. 임시 host만 사용하며 파일 수정 없음.
~~~js
const { h, tree } = await import('/src/mini-react/vnode.js');
const { createRenderer } = await import('/src/mini-react/renderer.js');
const host = document.createElement('div'); document.body.append(host);
const renderer = createRenderer(host);
const v = tree(h('input', {
  attrs: { type: 'checkbox' }, props: { value: 'first', checked: true }
}));
renderer.render(v);
renderer.render(v); // 실제: External DOM change: attrs/children
// 관찰 후 renderer.destroy(); host.remove();
~~~
- 기대: 지원되는 input VNode를 동일 값으로 다시 render하면 성공하며 불필요 쓰기 없이 같은 Node 유지.
- 실제: 첫 render가 value="first" content attribute를 생성하지만 committedTree.attrs에는 type만 남는다. 두 번째 render는 외부 변경 예외. text→checkbox type 변경 뒤에도 동일 증상.
- 원인: checkbox/radio의 value 프로퍼티가 content attribute에 반영되는 브라우저 동작을 attrs/props 분리와 baseline에 반영하지 않았다.
- 수정 방향: input type별 reflected property를 canonical VNode/검증/commit에 일관되게 다룬다. 외부 속성 검사를 전부 무시하거나 매번 DOM을 baseline으로 재채택하는 우회는 금지. 실제로 외부 수정한 value 속성 검출도 유지한다.
- 재검수: checkbox/radio value 없음·기본 on·명시 값·attrs/props 동시 입력·type 전환·반복 no-op·값 변경/삭제를 real Chromium과 unit에서 검증.
- 범위 구별: 기본 value="on"을 이미 가진 DOM의 round trip은 독립 검사에서 통과했다. 모든 checkbox 변환이 실패한다고 일반화하지 않는다.
- 증거: output/playwright/turn06/independent-forms.log; independent-assertions.log.

### QA06-002 — HIGH — 실제/테스트 radio가 한 그룹으로 동작해 원본 및 이력과 불일치
- 위치: phase1/index.html:16,18의 동일 document·form owner 없는 두 host; src/phase1/controller.js:8~12, 19~24, 27~38.
- UI 재현: 새로고침 → Inspector 대상 input → type=radio 설정 → name=qa-ui-radio 설정 → 테스트 radio 체크 → Patch.
- 기대: Patch 전에는 actual 불변, 성공 후 양 영역 checked=true이고 저장 snapshot과 일치.
- 실제: Patch가 actual을 checked=true로 만들면서 테스트 radio를 false로 바꾼다. 화면은 “Patch 완료…양 영역 상태를 저장했습니다”라고 표시한다. 독립 초기 fixture의 checked radio는 createPhase1 호출만으로 actual true→false, edit true가 된다. 이후 no-op apply는 actual true/edit false인데 changed=false.
- 원인: 같은 name, 같은 document tree, 같은 form owner의 radio 그룹을 영역별로 분리하지 않았다. 실제 DOM과 테스트 DOM을 두 div에 복제하는 것만으로는 브라우저의 그룹 동작을 격리할 수 없다.
- 수정 방향: host 바깥의 서로 다른 form owner 등 최소 격리안을 검토하되 논리 DOM/VDOM/History 동등성과 source 참조를 유지한다. radio를 조용히 제외하거나 최종 checked를 번갈아 덮어쓰는 방식은 해결이 아니다.
- 재검수: checked radio 초기 복제, 테스트 선택만으로 actual이 안 바뀜, Patch 후 양쪽+snapshot 일치, Undo/Redo/미적용 draft/재Patch, 여러 그룹.
- 증거: independent-forms.log, independent-assertions.log, radio-ui-snapshot.log, radio-mismatch.png. screenshot에서도 actual만 체크된 상태와 성공 안내를 확인했다.

### QA06-003 — HIGH — 테스트 label의 for가 실제 영역 input을 변경
- 위치: src/phase1/controller.js:8~11; src/phase1/html-policy.js:3,12; phase1/index.html:16,18.
- 재현: 동일 document에 두 host를 append하고 actual에 다음 DOM을 넣은 후 createPhase1(actual,edit)를 호출한다.
~~~html
<label for="qa-final-box">Toggle</label><input id="qa-final-box" type="checkbox">
~~~
  이어서 edit.querySelector('label').click()한다. 독립 실행은 연결된 실제 브라우저 DOM에서 수행했다.
- 기대: actual.checked=false 유지, edit.checked=true. 사용자가 테스트 영역을 편집하는 동작이어야 한다.
- 실제: actual.checked=true, edit.checked=false. Patch 호출 전 실제 영역이 바뀐다.
- 원인: 원본 id/for를 같은 document에 복제하여 label.control이 문서의 첫 input을 가리킨다. radio form owner 분리만으로 id/for의 전역 해석까지 해결되지는 않는다.
- 수정 방향: 영역 내부 label 연결을 보장하는 정책을 마련한다. 논리 id/for를 보존하면서 이벤트 타깃/물리 ID 격리를 적용할지 설계 영향을 기록한다. 단순히 id/for 지원을 제거하는 범위 축소는 승인하지 않는다.
- 재검수: explicit label, implicit label, 체크박스/일반 input, 키보드/focus, 반복 Patch 및 Undo/Redo. actual 내용이 편집기 사용자 입력으로 바뀌지 않아야 한다.
- 증거: independent-boundaries.log의 explicit-label-host-isolation, independent-assertions.log.

### QA06-004 — MEDIUM — 허용 id가 Inspector 입력 조회와 충돌
- 위치: src/phase1/main.js:6,42,57,62~67; src/phase1/html-policy.js:3,12.
- UI 재현: 새로고침 → 기본 h3 대상에 id=edit-text 설정 → “텍스트 / 새 요소 내용” 입력을 Independent edit로 변경 → “텍스트 변경”.
- 기대: h3가 Independent edit로 변경되고 오류 없음.
- 실제: 기존 제목 유지, alert “Invalid text”. document.getElementById('edit-text')가 Inspector input보다 앞선 편집 h3를 반환하여 undefined를 text로 사용한다.
- 원인: 사용자 DOM과 제어 패널의 ID namespace를 공유하며 이벤트 시점마다 문서 전역 조회를 수행한다.
- 수정 방향: Inspector 바깥 사용자 DOM을 검색하지 않는 고정 제어 루트/초기 DOM 참조를 사용한다. 사용자 id 자체를 전부 금지할 필요는 없다.
- 재검수: edit-text/target/attr-name/attr-value/tag와 충돌하는 id를 가진 sample 또는 편집 요소에서도 제어 패널 정상 동작.
- 증거: id-collision-ui.log, id-collision.png, independent-assertions.log.
- 평가: 특정 허용 id에서 편집 기능이 실패하는 재현 가능한 중간 심각도 결함. 작은 범위 수정으로 QA 재작업에 포함할 것을 요구한다.

## 4. 테스트 증거
| 실행 명령 | 종료 코드 | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 53 unit / 4 files | 0 | 0 |
| npm run test:e2e | 0 | 8 Chromium E2E | 0 | 0 |
| npm run test:all | 0 | 53 unit + 8 Chromium E2E | 0 | 0 |

세 명령을 각각 실행했다. test:all 수치는 앞 실행과 같은 시험의 재실행이며 122개 고유 테스트로 합산하지 않는다. 각 stdout/stderr는 output/playwright/turn06/test-unit.log, test-e2e.log, test-all.log에 보존했다. E2E는 자체 서버를 실행했으며 CLI 검증용 dev 서버는 이 세 명령이 끝난 뒤 시작·종료했다.

설치된 Playwright Skill과 references/cli.md를 읽고 Windows 로컬 CLI를 사용했다. npx 존재 및 node_modules/.bin/playwright-cli.cmd의 설치 진입점을 확인했다. CLI open→snapshot→Inspector fill/click→재snapshot→screenshot으로 검증했다. 복잡한 독립 probe는 CLI eval로 실제 Chromium 메모리에서 실행했다. 기존 테스트나 별도 테스트 파일은 작성·수정하지 않았다. 브라우저 UA는 Chrome/157.0.0.0이다.

독립 probe 결과:
- 실패 재확인: independent-assertions.log의 5개 조건, 0 PASS/5 FAIL (4개 결함; radio 초기/patch 2조건). 이 로그의 CLI 실행 exit=0은 평가 스크립트 실행 성공이지 기능 PASS가 아니다.
- 통과한 추가 경계: text/comment+key 혼합 이동, 이동 부모 내부 변경/6개 참조 동일성, 교체 subtree listener 제거, 55회 History→50개 제한/양쪽 이동, unsafe editor 사전 검증의 양 DOM·cursor 보존, 기본 checkbox on의 round trip.
- 기존 시험으로 확인: stale/foreign/replay, 외부 구조 변경, no-op 쓰기 0, caret/selection, preflight 실패와 두 번째 적용 실패 후 lock.
- 출력 artifacts: independent-forms.log, independent-boundaries.log, independent-assertions.log, radio-ui-snapshot.log, id-collision-ui.log, 이미지 2개.
- 보조 trace: .playwright-cli/traces/trace-1794031875416.trace 및 .network/resources. 최종 probe 구간을 기록했다. UI 전체 과정의 trace라고 주장하지 않는다.
- 최초 복잡한 CLI probe는 .cmd 인자 quoting 때문에 SyntaxError(exit 1)로 실행되지 않았다. 설치된 같은 CLI JS entry에 Node spawnSync 인자 배열로 전달해 재실행했다. 제품 결함/실패 수정 시도로 집계하지 않는다.
- unsafe candidate 조사에서 의도적으로 삽입한 onclick에 대해 CSP 차단 console error 1건 발생. 정상 앱의 원인 불명 console 오류로 분류하지 않는다. 정상 경로 기존 E2E는 console 검증 포함 통과.

기존 oracle 수정 검토:
- 보존된 turn05-attempt1의 5개 error-context에서 expected/received는 class/data-key 및 input 속성 순서 차이였다.
- 현재 tests/e2e/phase1.spec.js:8~22는 production 변환 함수를 호출하지 않고 tag/정렬한 attribute 이름·값/live value·checked·selected/자식 순서/text/comment를 비교한다.
- Node === 및 실제 사용자 행동 assertion이 별도로 존재한다. 순서 무시 수정은 타당하며 확인한 범위에서 핵심 검증을 약화하지 않았다.
- 그러나 새 결함에 필요한 reflected value/같은 name의 radio/명시적 label/제어 ID 충돌 사례는 없다. 기존 61개 통과만으로 전체 계약 충족을 판정할 수 없다.
- 기존 playwright-report와 test-results는 재실행 전 output/playwright/turn06/prior-playwright-report 및 prior-test-results에 복사 보존했다.

미검증: Firefox/WebKit, Phase 2, 새 의존성 설치 후 완전 재설치 재현, 모든 가능한 HTML/브라우저 조합. 이 중 Phase 2 미구현은 이번 반려 사유가 아니다. 필수 실행 명령은 모두 실행 가능했으므로 TEST_BLOCKED가 아니다.

## 5. 구조적 평가
shared engine 경로, 순수 diff와 불변 계획, 변경 전 참조 결속, postorder children 적용은 검사한 일반 사례에서 요구에 부합한다. 문자열 비교로 Diff를 위장하거나 actual을 전체 재생성하는 코드 경로는 발견하지 않았다. Inspector의 직접 editHost 교체는 명세상 예외다.

주요 구조적 누락은 DOM 프로퍼티의 속성 반영과 동일 document에 복제된 폼의 브라우저 전역 관계다. 엔진은 자신의 변경 후 baseline과 DOM이 같은지 보장해야 하고, Phase 1은 양 영역의 form/name/id/for 상호작용까지 고려해야 한다. 단순 text/요소 permutation 테스트 수를 늘리는 것으로 이 결함은 해결되지 않는다.

validatePatch에서 diff를 재계산하고 renderer/controller가 검증을 반복하는 비용은 관찰했다. 현재 성능 장애로 입증하지 않았으므로 별도 결함이나 대규모 최적화 요구로 만들지 않는다. 지금은 확인된 정확성 결함 수정이 우선이다.

## 6. Sol에 전달할 수정 지시
1. QA06-001의 input 타입별 reflected value를 수정하고 반복 render와 외부 변경 검출 회귀를 추가한다.
2. QA06-002와 QA06-003의 영역 간 폼/ID 연결 격리안을 기록한다. logical DOM/VDOM 동등성, 초기 source 참조, 허용 radio/id/for, shared 엔진 재사용을 유지한다. 물리 ID 매핑 등 계약 변화가 필요하면 영향과 시험을 제시해 Astra 검토 없이 대규모 변경하지 않는다.
3. QA06-004의 제어 DOM 조회 범위를 분리한다.
4. Sol 권한으로 각 반례의 실패하는 회귀 테스트를 먼저 확보하고 수정 후 unit+실제 Chromium E2E에서 통과시킨다. 이 감사 세션은 테스트 파일을 추가하지 않았다.
5. 기존 53+8 및 새 회귀, 두 영역 사전 검증/부분 실패/History/포커스를 재실행한다. npm run test:unit, test:e2e, test:all의 코드·결과·skip을 기록한다.
6. 같은 TURN 06의 REVIEW_REWORK로 수정·증거를 인계한 뒤 STOP. 신규 TURN을 추가하거나 TURN 07로 진행하지 않는다.

## 7. 다음 단계 승인
**REJECTED. NEXT: Sol REVIEW_REWORK, 이후 Astra TURN 06 재검수.**

현재 revision_count=0은 아직 완료된 수정→재검수 회수가 없다는 뜻이다. 이번 최초 반려 후 첫 재작업을 대기한다. 하네스 최대 2회 QA 재작업 규칙을 유지한다. TURN 07~12는 NOT_STARTED이며 07 승인 없음.

기록 변경: docs/loop/reviews/turn06.md, STATE.md, HANDOFF.md, LOG.md, ISSUES.md. 실행 증거는 ignored output/playwright/turn06 및 Playwright artifacts에 보존. HEAD는 그대로이고 src/tests/phase1/scripts/package/설계의 변경 없음. 자동 Sol 실행·제품 수정·원격 작업 없이 인계 후 STOP.
