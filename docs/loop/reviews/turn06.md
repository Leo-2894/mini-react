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


---

# [TURN 06 — INDEPENDENT QA REPORT — 첫 재검수]
DATE: 2026-11-07 20:20 Asia/Seoul
STATUS: FAIL / REJECTED
BASELINE HEAD: 612bea5448fb77f6fda6c807c6b4cdc0a45c1900
PRODUCT COMMIT: ee14fc8235a7874643af26ef9374602fd6975659
ORIGINAL REVIEW CHECKPOINT: b431784 (위 최초 REJECTED 보고 원문 보존)
REVISION: 완료된 Sol 수정→Astra 재검수 1/2
NEXT OWNER / ACTION: Sol / 동일 TURN 06 REVIEW_REWORK 2
ARCHITECTURE: 아래 판정에 따른 Phase 1 ID 경계 보완 계약을 architecture.md 말미에 기록. 제품 구현 승인과 QA 승인을 구별한다.

## 1. 종합 판정
**FAIL / REJECTED. TURN 07 진입 불가.**

QA06-001, QA06-002, QA06-004는 독립 재현과 회귀 검토로 해결을 확인했다. QA06-003은 기존 교차 클릭 활성화가 수정됐지만 native label 연결과 접근성 이름이 여전히 다른 영역에 결속된다. HIGH 1건이 남으므로 승인하지 않는다. 현재 수정은 “클릭 동작 복구”이며 “영역 내부 label 연결 보장” 완료로 인정할 수 없다.

필수 문서(전용 지침 검색, AGENTS, 전체 하네스, STATE, HANDOFF, architecture, 최초 turn06, ISSUES, LOG, README)를 지정 순서로 읽었다. Astra 전용 별도 파일 없음. 실제 cwd/Git root는 지정 프로젝트, 시작 HEAD는 위 인계 SHA이며 작업 트리는 clean이었다. b431784→ee14fc8은 수정 코드/신규 회귀/README, ee14fc8→612bea5는 공통 기록 4개뿐이다. 검수 중 HEAD와 제품/테스트는 불변. 최종 기록 직전 다른 문서 4개의 SHA256도 시작과 일치했고 작업 변경은 Astra의 STATE 진행 표기뿐이었다.

## 2. 요구사항 충족 상태
| 범위 | 판정 | 실제 근거 |
|---|---|---|
| D01~D02 | 충족(확인 범위) | DOM 변환 기존 회귀, 초기 source Node ===, radio 초기 checked/논리 Tree 유지, input value/type 독립 31조건 통과 |
| F01~F02 | 충족(확인 범위) | 순수 Diff 기존 unit, mixed keyed/unkeyed/text/comment 이동 및 이동 부모 내부 변경 독립 확인 |
| P01~P03 | 충족(확인 범위) | 참조/연속 삽입·삭제/이벤트 교체·제거/제거 subtree 정리 기존 unit, 독립 교체 후 listener 호출 0회 추가 |
| P04~P05 | 충족(확인 범위) | value projection 반복/no-op 0 writes/type 전환, 실제 외부 value/title/style/구조 변경 mutation 전 거부; focus/caret 및 stale/foreign/replayed 기존 회귀 |
| H01 | 부분 충족 | 실제 edit DOM 재독해→공유 Patch와 radio 경계는 정상. 허용된 explicit label의 native 연결은 미충족(QA06-003) |
| H02~H03 | 충족(확인 범위) | 분기/no-op Redo/draft/버튼 경계 기존 회귀; 별도 55회 적용→50개/최저 S6/최신 S55, 양 영역 실패 보존 및 부분 실패 잠금 |
| H04 | 충족(입력 안전 범위) | 위험 속성/CSS 삽입 전 거부, plain paste/drop 기존 E2E; Inspector 5개 ID 충돌 회귀 및 UI 재현 통과 |
| 허용 label/id/for의 영역 내 의미 | 미충족 | editor label.control=actual input, actual labels=2/editor labels=0, editor 접근성 이름 없음 |
| 금지 런타임/엔진 우회 | 충족(현 Phase 1) | runtime dependency 없음. 수정은 shared dom/patch, Phase 1 경계와 고정 Inspector 참조. 별도 렌더러/actual 전체 재생성/managed 재채택 없음 |
| Phase 2 | 범위 밖 | TURN 07~12 미착수. 이번 미구현 결함으로 계산하지 않음 |

## 3. 결함별 재검수

### QA06-001 — HIGH → RESOLVED (이 기준 코드에서)
- 위치: src/mini-react/dom.js:6~12,25~27; src/mini-react/patch.js:19,60.
- 원본 재현: checkbox/radio attrs.type + props.value를 동일 Tree로 두 번 render. 이제 성공하고 Node === 유지, no-op MutationObserver 0.
- 독립 검증: 두 type 각각 value 없음/on/attrs+props 동시 지정/값 변경/props 제거/명시 attr 삭제, text→checkbox→radio→number→text 반복. 예상 live value/content attribute와 일치.
- 외부 n.value='external'(reflected checkbox), value attr 삭제, title, 빈 style, child 추가는 모두 commit 전 거부. DOM 쓰기 0, revision 및 mutation 직전 DOM 보존.
- 수정 적합성: Node WeakMap은 엔진 syncProps 직후의 logical/physical value만 추적한다. preflight가 그 projection을 사용하되 나머지 attrs 및 구조 검증을 유지한다. 매번 managed DOM을 채택하거나 현재 외부 속성을 무조건 정상화하는 경로 없음.
- 증거: independent-values.log 31 PASS / 0 FAIL. 신규 unit/E2E 기대값도 실제 value/ref/쓰기/외부 거부를 검사한다.

### QA06-002 — HIGH → RESOLVED (이 기준 코드에서)
- 위치: src/phase1/boundaries.js:4~11; controller.js:10.
- 원본 checked radio 복제 및 UI type/name→radio→Patch 재현은 기존/new E2E와 독립 fixture에서 정상.
- 두 그룹/각 두 radio의 source 참조·초기 checked 유지, editor 선택만으로 actual 불변, apply 후 actual/editor/snapshot 일치, no-op, Undo/Redo+draft 폐기, 새 분기 Patch 확인.
- wrapper는 host 밖이므로 readTree/History에 들어가지 않으며 source Node를 새로 만들지 않는다. 서로 다른 native form owner가 그룹을 분리한다.
- 증거: independent-boundaries.log의 radio 7조건 PASS 및 14 E2E 중 radio 3경로 PASS. label 전역 ID 해석은 별도 QA06-003으로 남는다.

### QA06-003 — HIGH — PARTIALLY FIXED / OPEN
- 위치: src/phase1/boundaries.js:12~29 (특히 18~26); controller.js:10~13; tests/e2e/review06.spec.js:47; tests/unit/review06.test.js의 explicit/implicit label 시험.
- 기대: 지원되는 label/for를 복제해도 각 host label의 native control이 같은 host input이어야 한다. 각 input.labels는 자기 영역 label만 포함하고, label로 주어지는 접근성 이름이 원본과 복제본에 각각 유지되어야 한다.
- 실제: capture guard가 클릭을 로컬 input으로 전달하여 원본 교차 활성화는 해소했다. 그러나 duplicate id/for 그대로이므로 editorLabel.control===actualInput, actualInput.labels.length===2, editorInput.labels.length===0이다.
- 접근성 트리 실제 결과:
~~~text
actual: checkbox "Local consent Local consent"
        textbox "Local text Local text"
editor: checkbox [checked]
        textbox
implicit checkbox는 양쪽 모두 "Implicit consent"
~~~
- 재현(연결된 Chromium 페이지에서 임시 fixture; 제품 파일 수정 없음):
~~~js
const {createPhase1}=await import('/src/phase1/controller.js');
const a=document.createElement('div'), e=document.createElement('div');
a.innerHTML='<label for="qa-native"><span>Local consent</span></label><input id="qa-native" type="checkbox">';
document.body.append(a,e);
const app=createPhase1(a,e);
const ai=a.querySelector('input'), ei=e.querySelector('input'), el=e.querySelector('label');
el.firstChild.click(); // actual=false/editor=true: 클릭 수정은 통과
[el.control===ei, el.control===ai, ai.labels.length, ei.labels.length];
// 기대 [true,false,1,1], 실제 [false,true,2,0]
app.destroy();a.remove();e.remove();
~~~
- 증거: independent-boundaries.log 14 PASS/2 FAIL(두 실패는 이 결함의 서로 다른 조건), native-label-accessibility-result.log. CLI exit 0은 조사 실행 성공이지 기대값 PASS가 아니다.
- 통과한 관련 범위: explicit/implicit 중첩 텍스트 클릭, 일반 input focus, control 직접 클릭, History 후 재클릭, 외부 Inspector에만 대상이 있을 때 클릭 억제. 기존 E2E의 Space 키 동작도 통과.
- 정책 충분성 판단: 불충분. architecture §6의 허용 label/id/for와 최초 검수의 “영역 내부 label 연결” 요구를 클릭 처리에 한정하여 축소할 수 없다. 접근성 이름 손실은 실제 브라우저 트리에서 관찰한 기능 차이이며, 모든 보조기기 인증을 새로 요구하는 것이 아니다. native getter와 이름이 깨진 상태를 README 한계로 적는 것만으로 해결 승인하지 않는다.
- 원인: form owner는 radio 그룹만 분리한다. 이벤트 preventDefault+control.click은 DOM의 for/ID 관계나 접근성 이름 계산을 바꾸지 않는다.
- 권장 수정: logical id/for를 VDOM/History/Inspector에 보존하면서 Phase 1 host별 physical ID/IDREF를 격리한다. architecture 말미의 승인된 제한적 보완 계약을 따라 shared engine에 선택적 경계 context를 통합한다. 원본 Node ===, no-op, external mutation 검증, 일반 Phase 2/default renderer 계약을 유지한다.
- 새 회귀는 native label.control / input.labels와 접근성 이름을 별도로 검증해야 한다. 현재 신규 테스트는 클릭/focus/checked만 검사하여 이 잔여 결함을 탐지하지 못한다. 기존 테스트를 약화시킨 것은 아니지만 게이트 완결성은 부족하다.

### QA06-004 — MEDIUM → RESOLVED (이 기준 코드에서)
- 위치: src/phase1/main.js:7~10.
- 원본 UI: h3 id=edit-text 설정→Inspector 텍스트 변경→Patch 성공. Undo→Redo→텍스트 변경→다시 Patch도 성공, 실제/테스트 제목 일치.
- 추가: 정규 E2E에서 edit-text/target/attr-name/attr-value/tag 각각 충돌 후 편집/Patch/Undo/Redo 통과.
- 수정 적합성: 초기 Inspector Map 및 세 host 참조를 사용자 편집 전에 확보한다. 후속 edit callback은 고정 참조를 사용하며 사용자 id를 금지하지 않는다. 남은 getElementById는 bootstrap의 host 확보뿐이다.
- 증거: inspector-id-ui.log, inspector-id-history.log, inspector-final.png(직접 시각 확인), test-e2e.log.

## 4. 테스트 증거
cwd: C:\Users\Leo\Desktop\API 1. 모든 필수 명령을 각각 직접 실행했다.

| 명령 | 종료 코드 | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 60 (5 files) | 0 | 0 |
| npm run test:e2e | 0 | 14 Chromium | 0 | 0 |
| npm run test:all | 0 | 60 unit + 14 Chromium | 0 | 0 |

고유 정규 시험은 74개다. 반복 실행을 합산하지 않는다. output/playwright/turn06-rereview1/{test-unit,test-e2e,test-all}.log에 실제 출력 보존.
독립 CLI probe는 value 31/0, boundary 14/2, 일반 회귀 8/0(모두 PASS/FAIL). 정규 시험 수와 혼합하지 않는다. source가 각 로그에 있어 비영속 재실행 가능하다. Chrome/157.0.0.0 실제 브라우저를 Playwright Skill/CLI로 사용했다.

기존 output/playwright/turn06/, turn06-rework1/는 보존했다. 실행 전 playwright-report/test-results를 새 증거 경로의 prior-*에 복사했다.
기존 53 unit/8 E2E 및 속성 순서 무시 DOM oracle는 수정 커밋에서 변경되지 않았다. 현재 oracle는 독립 nodeType/text/tag/정렬 attrs/live props/재귀 children을 비교하고 Node ===를 별도로 확인한다. 속성 순서 문자열 오탐 수정은 타당하며 이름/연결 누락은 별도 추가 시험 대상이다.

screenshot 독립 확인: 촬영 직전 두 input에 style 없음 → CLI 기본 screenshot 뒤 두 input에 style="" → Patch External DOM change: attrs/children, History 3/3 유지. reload 후 style 없음/정상 no-op/alert 없음. screenshot-before.log, screenshot-after.log, screenshot-reload-recovery.log. 도구가 만든 mutation이며 검증 완화나 제품 결함으로 처리하지 않는다.

미검증: Firefox/WebKit, 실제 스크린리더 운용, clean dependency reinstall, Phase 2. 브라우저 접근성 snapshot을 실제 스크린리더 검증으로 주장하지 않는다. 필수 검증은 실행 가능했으므로 TEST_BLOCKED가 아니다. inline handler 위험 후보를 의도적으로 주입한 probe에서 CSP 차단 console 1건은 입력 거부 조사에 따른 것으로 정상 UI 오류와 구별한다.
검수 중 서버 시작 1회는 자동 승인 심사 사용량 한도로 실행되지 않았으나 사용자 재개 후 동일 승인 절차로 정상 실행했다. 회피 실행 없음. CLI 낡은 ref와 console 반환 방식 시행착오는 재실행으로 정정했으며 기능 PASS 수에 포함하지 않는다.

## 5. 구조적 평가
value projection, 외부 form owner, Inspector 초기 참조는 수정 범위가 작고 기존 공유 엔진을 유지한다. 실제 외부 속성 오염을 무시하는 우회는 확인되지 않았다.
label guard는 DOM 관계와 클릭 동작을 두 정책으로 나누고 browser semantics를 수동 복제하므로 불완전하다. 물리 ID 경계로 native 관계를 복원하는 편이 적합하다. 이는 Phase 1 DOM 입출력/검증/Inspector selector에 국한한 계약 보완이며 새 Diff/Patch 또는 UI 런타임을 도입할 이유가 없다.
대안 비교: 클릭 guard 유지 비용은 작으나 이미 재현된 이름/관계 결함을 해결하지 못한다. 별도 document/iframe은 ID tree를 분리하나 focus/selection/문서 소유권/UI 시험 범위가 커진다. Shadow DOM은 기존 범위 밖이다. Phase 1 physical ID mapping의 제한적 보완을 우선 채택한다. 대규모 엔진 재작성은 승인하지 않는다.

## 6. Sol에 전달할 수정 지시
1. 같은 TURN 06 REVIEW_REWORK 2로 진입한다. QA06-003의 native 관계/접근성 이름 실패 시험을 먼저 확보한다. 클릭 성공만으로 이슈를 닫지 않는다.
2. architecture 말미의 제한적 ID 경계 계약을 구현한다. 논리 Tree/id/for 유지, host 간/Inspector 간 native 연결 격리, shared Patch/사전 검증/Node 참조 유지. 정책 범위 축소, ARIA 이름만 덧씌우기, prototype getter 조작, managed DOM 재채택으로 숨기기 금지.
3. id/for 및 ARIA IDREF 편집·삭제·재지정, 명시/암시 label, checkbox/radio/text, 바깥에만 있는 참조, Patch/no-op/Undo/Redo/draft, Inspector ID 충돌, 실제 외부 physical attr 변경 거부를 검사한다. Phase 2/default renderer는 기존 계약을 유지한다.
4. 기존 60 unit/14 E2E 및 새 실패 회귀를 모두 실행한다. no-op/History/preflight/부분 실패 잠금/초기 참조를 유지하며 결과를 명령·exit·pass/fail/skip과 수정 SHA로 인계한다.
5. 기존 증거/보고는 보존하고 새 rework2 경로를 사용한다. screenshot 마지막 또는 reload 후 후속 시험. 자체 PASS를 독립 승인으로 바꾸지 말고 Astra 동일 TURN 06 두 번째 재검수를 요청한 뒤 STOP.

## 7. 다음 단계 승인
**REJECTED. 다음 담당 Sol / TURN 06 REVIEW_REWORK 2. TURN 07은 NOT_STARTED 유지.**
revision_count=1은 첫 수정→첫 재검수가 완료됐다는 뜻이다. 최대 2회 중 한 회가 남는다. 두 번째 수정→재검수에도 주요 결함이 남으면 하네스에 따라 BLOCKED로 멈추고 사람이 방향을 결정한다.
이번 작성 범위는 리뷰/STATE/HANDOFF/LOG/ISSUES 및 필요한 architecture 보완 계약이다. 제품·기존 테스트·README 수정 없음. 다른 세션/다음 TURN 실행 없음. 검수용 브라우저와 직접 시작한 서버 종료 후 인계 STOP.


---

# [TURN 06 — INDEPENDENT QA REPORT — 두 번째 재검수]
DATE: 2026-11-08 (Asia/Seoul)
VERDICT: FAIL / REJECTED
OPERATIONAL STATUS: BLOCKED — 수정→재검수 2회 한도 도달, 사람의 방향 결정 필요
BASELINE HEAD: 7efb498ec1877ff8a0f791264f1d51f0ee6fdf2f
PRODUCT COMMIT: 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52
PREVIOUS REVIEW / CONTRACT CHECKPOINT: f1ca731
REVISION_COUNT: 2
NEXT ACTION: 사람의 방향 결정. REVIEW_REWORK 3 / TURN 07 자동 진입 금지.

## 1. 종합 판정
**REJECTED / 운영 BLOCKED.**
QA06-003의 native label 관계·접근성 이름 결함은 해결됐다. QA06-001/002/004 회귀도 통과했다. 다만 새 scope projection이 travel/restoreDraft의 오류 잠금 범위 밖에서 DOM을 변경하여, 부분 쓰기 실패 후 추가 조작을 허용하는 QA06-005를 재현했다. 필수 H03 오류 처리 게이트를 충족하지 못한다.

필수 문서를 지정 순서로 모두 읽었다. 별도 Astra 전용 파일 없음. 실제 cwd/Git root 지정 경로, HEAD 인계 SHA 일치, 시작 status clean. 첫 기본 권한 실행의 git status가 work tree 오류를 냈으나 동일 경로를 승인 절차로 읽기 전용 재확인하여 inside-work-tree=true/status empty를 확인했다. Git 설정 변경 없음.
f1ca731→1ec56bc 변경 12개 파일, 1ec56bc→HEAD 공통 기록 4개뿐. architecture 및 최초/첫 재검수 보고는 f1ca731 이후 변경 없음. 검수 중 제품·기존 테스트 수정 없음.

## 2. 요구사항 충족 상태
| 범위 | 판정 | 근거 |
|---|---|---|
| D01/D02, F01/F02, P01~P05 | 충족(실행 범위) | 75 unit/28 E2E, 초기 source ===/focus/caret, default API, strict physical preflight 및 기존 엔진 회귀 |
| H01 및 QA06-003 native 관계 | 충족 | checkbox/radio/text 각 host label.control 로컬, labels=1; Chrome native AX 이름 각 1회, 독립 클릭·키보드·History |
| logical/physical scope | 충족(문서 지원 범위) | logical id/for/IDREF, 토큰 공백/순서, missing target, raw logical 편집, selector, 빈/중복 ID 거부 |
| H02 및 H03 정상 History | 충족 | no-op Redo/분기 폐기/50개/양 영역 복원, 일반 preflight 보존 |
| H03 예기치 않은 부분 실패 잠금 | 미충족 | 새 projection 단계의 travel/restoreDraft 실패에서 locked=false, 후속 apply 허용(QA06-005) |
| H04 / Inspector | 충족(실행 범위) | 위험 입력·paste/drop 기존 E2E, 5개 ID 충돌 회귀; 독립 UI 중복 ID 사전 거부 |
| 공유 엔진/금지 런타임 | 충족(현 Phase 1) | 순수 diff/Tree 불변, scope는 기존 DOM/Patch 경로의 선택적 context; native getter/aria-label 우회/label guard 없음 |
| Phase 2 | 범위 밖 | 미착수 자체를 결함으로 판정하지 않음 |

## 3. 결함별 결과

### QA06-003 — 기존 HIGH → RESOLVED (이 기준 코드에서)
- 대상: src/mini-react/scope.js, dom.js, patch.js, renderer.js 및 Phase 1 경계/Inspector.
- 원본 explicit label fixture를 checkbox/radio/text에서 각각 다시 실행: label.control===자기 host input, input.labels.length=1. 초기 source 참조 및 text focus/selection 유지.
- explicit 중첩 클릭, implicit 클릭, 직접 input 클릭, Space, Patch→Undo/Redo→draft 폐기 후 native 연결 유지. no-op 0 mutation, physical ID 안정.
- Chrome CDP Accessibility.getPartialAXTree에서 실제/테스트 각 checkbox 이름 "Local checkbox", radio "Local radio", textbox "Local text", ignored=false. 총 6개 이름 정상. 실제 스크린리더 운용 검증은 아님.
- scope.readAttrs는 Node별 직접 기록한 physical 값과 현재 값이 같을 때만 decode. 임의 prefix stripping 없음. raw logical rename 및 삭제/History 확인.
- scope.physicalAttrs 기반 preflight는 decoder로 현재 값을 정상화하여 비교하지 않는다. 외부 physical id/for/aria-labelledby/aria-describedby를 원래 logical 문자열로 변경한 반례도 모두 mutation 0으로 거부, 양 DOM/cursor 유지.
- 문서화된 IDREF 토큰 변환/ASCII 공백 보존, 일반 ARIA 원문, missing target의 내부 dangling ID 및 outside-only 연결 차단, 빈/공백/중복 ID 거부 확인.
- 논리 selector는 detached clone의 native CSS parser를 사용하고 실제 Node를 반환한다. 실제 DOM 재렌더링이 아니며 live :focus 등 문서상 제외 범위를 새 필수 요구로 확대하지 않았다.
- 증거: independent-native.log(21/0), independent-native-ax.log(6 native AX + keyboard/direct click 정상), independent-id-boundary.log(14/0).

### QA06-001 / QA06-002 / QA06-004 — RESOLVED 유지
- QA06-001: 기본 context 없는 renderer에서 checkbox/radio/text/number 값 반복 render, ===와 no-op 0 쓰기 독립 확인. attrs/props 충돌·삭제·외부 value/type 회귀는 기존 정규 시험 통과.
- QA06-002: 초기 source checked와 ===, 서로 다른 form owner, editor 선택만으로 actual 불변, apply 후 양쪽 checked 일치 독립 확인.
- QA06-004: 정규 5개 충돌 시험 유지. 실제 UI h3 id=edit-text→텍스트 변경→Patch→Undo/Redo 성공. 같은 ID를 input에 추가하려는 후보는 삽입 전 오류로 거부하고 edit DOM 보존.
- 증거: independent-regression.log(12/0), independent-inspector.log, 세 필수 테스트 로그.

### QA06-005 — HIGH / OPEN — 새 projection 부분 실패 후 잠금 누락
- 위치: src/phase1/controller.js:40,48 (projectTree가 mutation을 수행하지만 try/catch 밖); catch는 43~44,51에 위치. src/mini-react/scope.js:46~67의 write/projectTree.
- 관련 계약: architecture §5 예기치 않은 DOM 예외 중단, §6 부분 적용 오류 후 추가 조작 차단; H03. 이번 사용자 필수 검증 C/D의 부분 실패 잠금 유지.
- 재현: 연결된 임시 actual/editor fixture에서 S1을 저장한다. editor label.for와 input.id를 raw logical 'renamed'로 바꾼 뒤, 해당 input.setAttribute만 id 쓰기 때 예외를 던지도록 메모리에서 주입한다. travel(0) 또는 restoreDraft를 호출한다.
- 실행 순서: projectTree가 label.for를 먼저 physical로 바꾼다 → input.id 쓰기가 예외 → controller의 catch에 도달하지 않아 locked=false → 주입을 제거한 뒤 app.apply()가 정상 허용된다.
- 기대: 부분 mutation 후 예외를 드러내고 locked=true, 이후 apply/travel/restoreDraft 거부. 읽기 전용 validation 실패는 DOM/cursor 보존 및 잠금 없이 재시도 가능해야 한다.
- 실제: travel/restoreDraft 모두 예외 메시지는 전달되지만 edit DOM은 부분 변경되고 locked=false, 후속 apply 허용. actual DOM은 이 지점에서 바뀌지 않았다. apply 경로는 동일 주입에서 locked=true/후속 apply 거부로 대조군 통과.
- 원인: 기존 catch는 renderer.commit만 감싼다. 새 projectTree 쓰기를 그 앞에 추가하면서 오류 보호 범위를 확장하지 않았다.
- 심각도 근거: 필수 상태/오류 처리 계약의 누락이며 두 사용자 복구 경로에서 일관되게 재현. 일반 정상 클릭에서 자연 발생한 브라우저 예외나 데이터 손실을 입증했다는 주장은 하지 않는다. 기존 tests/unit/history.test.js의 insertBefore 예외 주입과 동일한 오류 복구 검증 방식이다.
- 증거: independent-projection-failure.log: apply 대조 1 PASS, travel/restoreDraft 2 FAIL. CLI exit 0은 probe 실행 성공이며 기능 통과가 아니다.
- 수정 권장(사람이 추가 작업을 허용한 경우에만): 실제 첫 projection mutation부터 이후 준비/commit까지 오류 경계를 포함하여 부분 적용 오류를 잠근다. validation을 무조건 lock시키거나 rollback/전체 재렌더로 숨기지 않는다. 두 projection 실패 회귀를 추가하고 기존 preflight 보존/commit 실패 잠금과 함께 검증한다.
- 재현 코드(저장소 파일 수정 없이 browser eval):
~~~js
const {createPhase1}=await import('/src/phase1/controller.js');
const a=document.createElement('div'), e=document.createElement('div');
a.innerHTML='<label for="box">Local</label><input id="box"><p>S0</p>';
document.body.append(a,e);
const app=createPhase1(a,e);
e.querySelector('p').textContent='S1'; app.apply();
e.querySelector('label').htmlFor='renamed';
const input=e.querySelector('input'); input.id='renamed';
const originalSet=input.setAttribute;
input.setAttribute=function(name,value) {
  if(name==='id') throw Error('Injected projection write failure');
  return originalSet.call(this,name,value);
};
const before=e.innerHTML;
try { app.travel(0); } catch(error) { console.log(error.message); }
// 별도 새 fixture에서 app.restoreDraft()도 같은 결과
console.log(e.innerHTML!==before, app.locked); // 실제 true,false / 기대 true,true
input.setAttribute=originalSet;
app.apply(); // 실제 허용 / 기대 잠금 오류
app.destroy();a.remove();e.remove();
~~~

## 4. 테스트 증거
cwd: C:\Users\Leo\Desktop\API 1

| 직접 실행 | exit | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 75 / 6 files | 0 | 0 |
| npm run test:e2e | 0 | 28 Chromium | 0 | 0 |
| npm run test:all | 0 | 75 unit + 28 E2E | 0 | 0 |

고유 정규 시험 103개. 각 결과는 output/playwright/turn06-rereview2/test-unit.log, test-e2e.log, test-all.log. 실제 명령 종료 코드도 도구 결과로 확인했다. 반복 수치는 합산하지 않는다.
독립 probe 수치도 정규 시험과 합산하지 않는다: native 21/0, ID boundary 14/0, regression 12/0, projection failure 1/2 (PASS/FAIL). native AX 6개 정상, keyboard/direct click 및 UI ID 충돌/중복 거부 별도 정상. probe 코드와 결과는 각 로그에 있다.

기존 물리 ID 원문 assertion 한 건의 변경을 직접 검토했다. scoped read의 literal logical id/for 기대값, native control, 두 host physical ID 차이를 함께 검사하므로 새 계약에 맞는 보완이다.
새 browser oracle는 fixture data-key→literal logical ID 대응으로 attrs를 복원하며 production decoder를 기대값 생성에 호출하지 않는다. native 관계/accessible name/description 및 History literal assertion을 병행한다. 다만 신규 projection 예외 경로가 기존 commit 예외 시험에 포함되지 않아 QA06-005를 놓쳤다.

기존 네 증거 디렉터리 보존, report/test-results는 실행 전에 새 경로 prior-*로 복사했다. screenshot은 이번 기능 검증 중 실행하지 않아 알려진 style="" 도구 mutation을 유발하지 않았다. 기존 외부 style 검사 완화 없음.
미검증: Firefox/WebKit, 실제 스크린리더, clean install, Phase 2, 정상 브라우저 사용에서 projection 쓰기 예외의 자연 발생 빈도. fault injection을 그 빈도의 증거로 주장하지 않는다. 필수 시험 실행 불가가 아니므로 TEST_BLOCKED 아님.

## 5. 구조적 평가
ID scope는 승인된 선택적 context 범위에서 기존 공유 엔진에 통합됐다. 순수 Diff/Tree 형식 및 default renderer 경로를 유지하며 클릭 우회 guard를 제거했다. native 관계 복구 방식은 적합하다.
추가 쓰기 경로가 controller의 기존 오류 보호 경계 밖에 놓인 점이 결함이다. 큰 리팩터링이나 추가 격리 방식은 필요하지 않으며 오류 경계 보완과 해당 회귀만 요구한다. 현재 scope registry/selector clone의 성능을 측정된 장애 없이 결함으로 확대하지 않는다.

## 6. 후속 수정 조건 및 사람의 결정
하네스 수정→재검수 두 회를 완료했다. Sol REVIEW_REWORK 3을 자동 허용하지 않는다.
사람이 제한적인 추가 수정과 동일 TURN 재검수를 명시적으로 허용하면 QA06-005의 두 예외 경로를 수정하고, projection 실패→lock 및 validation 실패→무쓰기/비잠금 조건을 대조 시험할 수 있다. 기존 103개 및 native 관계/physical mutation 회귀를 유지한다.
현재는 제품 수정·새 테스트 작성·다음 세션 실행을 하지 않고 중단한다.

## 7. 다음 단계 승인
**REJECTED / BLOCKED. revision_count=2, active_rework_round=2 완료.**
QA06-003은 RESOLVED로 기록하되 QA06-005 HIGH가 남아 TURN 07을 승인하지 않는다. 다음 담당은 사람의 방향 결정이며 자동 REVIEW_REWORK 3 없음.
기록 변경은 turn06 review/STATE/HANDOFF/LOG/ISSUES 5개만. 제품·기존 테스트·architecture·README 불변. 검수 브라우저와 직접 시작한 dev 서버 종료. 커밋/원격 작업/다른 세션 실행 없음. 원본 두 보고를 보존하고 이 결과를 추가했다.
