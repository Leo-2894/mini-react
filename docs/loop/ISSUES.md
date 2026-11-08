# TURN 12 — 최종 독립 검수 REJECTED (2026-11-08)
검수 담당 Sol 6.1 / HIGH — 최종 독립 검수 세션.
HEAD eb368fdc7a32cd79a382a0726af9fd0c5b53ab43 / 제품 9c53b3a6f668e54e90c2702be301c12561c1a858.
QA12-001 / HIGH / OPEN: src/api/history.js:8~11의 decode 후 long-token 정규식이 encoded slash base64를 놓침.
재현: GET /session/abcdefghijklmnopqrstuvwx%2Fabc?secret=fake-query → Recent requests 원문 토큰 저장/표시 → Reuse 원문복원/Send 활성.
기대 /session/[redacted], 수정 전 전송 차단. 28자 canonical base64/한 segment 증거 base64-classification.log.
증거 output/playwright/turn12/independent-http.log (21PASS/1FAIL), privacy-ui.log. 가짜 토큰/loopback만 사용.
수정: raw 경로 segment 경계를 보존하며 URL decode 후 표준 base64 slash 변형을 정제. unit·UI 실패 회귀 먼저 확보하고 기존 JWT/plus/정상 path/211개 회귀 유지. 상세 turn12.md §4.
SOL-011-02는 이전 JWT/plus 사례 자체 수정 성공을 인정하되 이번 추가 변형까지 독립 해결로 승인하지 않는다. 모든 임의 비밀 탐지 요구로 확대하지 않음.
정규 unit152/E2E59/all152+59 각각 exit0/FAIL0/SKIP0. runtime 독립10/0, Phase1 projection10/0. QA06-001~005 현 회귀 유지. 현재HIGH1로 최종 제출 승인 보류.
TURN12 최초검수 revision_count=0/2, 다음 구현 Sol 동일TURN12 REVIEW_REWORK. TURN06 역사횟수 별도.
언어 JS/TS실사용NO/Node dev·test YES, 제품APIbackend 없음. 제품/시험은 검수에서 수정하지 않았다.

---
## 이전 이슈 원문 (역사 기록)

# TURN 11 — 구현 자체 PASS / 최종 독립 검수 대기
CODE: 9c53b3a6f668e54e90c2702be301c12561c1a858. 최종 unit152/E2E59, 필수3명령 exit0/FAIL0/SKIP0. 고유211개.
자체 확인 범위 신규 확정 미해결 없음. 전체 제품 독립 승인은 TURN12 NOT_STARTED/PENDING이며 구현 세션이 승인하지 않는다.

| ID | 상태 | 근거 |
|---|---|---|
| SOL-011-01 / LOW | Sol RESOLVED | DOM Lab 복귀 링크 오류: red-navigation 1FAIL→동일 기대와 왕복시험 PASS, phase1/index.html ../ |
| SOL-011-02 / HIGH | Sol RESOLVED / TURN12 독립 확인 필요 | 긴 JWT/base64 경로의 정제 누락: integration unit3/1 red→4/0 green. history.js 문자집합 확장, 최종 전체 PASS |
| QA06-001~005 | TURN06 독립 RESOLVED 원문 유지 | 당시 SHA 승인. 현재 회귀 전체 통과를 새 독립 승인으로 확대하지 않음 |
| TURN12 | UNVERIFIED / 별도 세션 대기 | R/A 전체 경계의 최종 독립 검수 미실시 |

증거 output/playwright/turn11/red-navigation.log, red-token-path.log, green-token-path.log, test-*.log, source-audit.json.
미검증/한계는 README/implementation 및 HANDOFF 참조. 과거 OPEN/REJECTED 판정은 아래 역사 기록으로 보존한다.

---
## 이전 기록 보존

# TURN 10 — 자체 검증 완료
SOL-010-01 / HIGH / RESOLVED: 정적 server가 / 루트를404 처리. root 자체 허용으로 수정하되 경로 이탈 검사는 유지. 최초 GET1FAIL→신규17E2E/전체53E2E PASS.
SOL-010-02 / MEDIUM / RESOLVED: 모바일에서 History CSS 숨김. 세로배치 및 실제 모바일 재사용 assertion 추가. CLI display none→flex/width390 유지, E2E PASS.
SOL-010-03 / LOW / RESOLVED: 긴 JSON scalar 잘림 안내 누락. Viewer unit3/1 red→4/0 green, 표시문구/Raw 안내 보완.
코드 4143dec271011fb10f4b2a30c24b6235f4a3248b, 증거 output/playwright/turn10/. 구현시도3 내 해결. 신규 확정 미해결 없음, 전체 최종 독립 검수는 TURN12.

---
## 이전 기록 보존

# TURN 09 — 자체 검증 완료
SOL-009-01 / LOW / RESOLVED: 민감 경로 값 이후의 정상 segment 과잉 정제. history.js의 다음 segment flag 수정, 원본 실패→통과 증거 output/playwright/turn09/attempt1-unit.log/attempt2-unit-depth.log. 코드 16f3f9d79282beb2f355c76c9ed6f9b97d64b5b6.
깊은 JSON pretty stringify 한계는 raw fallback으로 처리. 신규 확정 미해결 없음. 실제 네트워크·CORS E2E는 TURN10 범위.

---
## 이전 기록 보존

# TURN 08 — 자체 검증 완료
신규 확정 미해결 없음. R03~R05 및 이전 회귀118unit/36E2E PASS. effect 오류 후 이미 commit된 UI의 rollback은 계약 범위 밖이며 실패 render 보존과 구분한다.

---
## 이전 기록 보존

# TURN 07 — 구현 자체 PASS
SOL-007-01 / MEDIUM / RESOLVED: 잘못된 Hook 종류의 queue가 state no-op 필터에 가려지는 guard 누락. component.update의 queue 종류 검사로 수정, component.test.js 원본 실패 유지 후 통과. 코드 aade8bd0a37b8ad6bf8ff691394d74de526e105e; 증거 output/playwright/turn07/attempt1-unit.log 및 attempt2-unit.log.
기존 QA06-001~005 독립 RESOLVED 유지, 새 구현은 TURN12 검수 대상. 신규 확정 미해결 없음.

---
## 이전 기록 보존

# TURN 06 추가 독립 재검수 — PASS / APPROVED (2026-11-08)
검수 담당: Sol 6.1 / HIGH — 독립 검수 세션 (최신 사용자 지시).
HEAD d7ec63024c24571caa22080dd345fc2afd97470a / 제품 ff2a689162c2d6129749f400810846fbee50e736.
QA06-001/002/003/004 RESOLVED 유지, **QA06-005 HIGH → RESOLVED**. 신규 확정 결함 없음.
controller.js의 travel/restoreDraft 첫 projection부터 준비·commit까지 오류 보호, 읽기 전용 candidate/초기 actual preflight 비잠금 유지 확인.
독립 브라우저 10/0 PASS/FAIL: 부분 projection 3 + 후속 preview 2 + candidate/preflight 5. 원본 오류 identity/MutationObserver/History identity·cursor/세 조작 차단/정상 재시도 검사.
증거 output/playwright/turn06-rereview3/independent-projection.js/log 및 세 필수 테스트 로그. unit85/E2E32/all85+32 모두 exit0, FAIL0/SKIP0. 기존 103개 시험 수정 없음.
limit_cycle=2 / revision_count=1/2, 이전 주기 완료 2회 보존. 다음 Sol 구현 세션 TURN 07 허용. 과거 OPEN/REJECTED는 아래 역사 기록이며 현재 승인 상태를 덮어쓰지 않는다.
미검증 Firefox/WebKit/실제 스크린리더/clean install/Phase 2/예외 자연 발생 빈도. 정규 Chrome AX 통과를 실제 스크린리더 인증으로 주장하지 않음.

---
## 이전 이슈 원문 (역사 기록 보존)

# TURN 06 QA06-005 — Sol 추가 수정 완료 / Astra 독립 재검수 대기
CODE: ff2a689162c2d6129749f400810846fbee50e736. 독립 review_status=REJECTED 유지. 한도 재설정은 제품 승인이 아니다.
사용자 "다시 한도 재설정 됐어"에 따라 새 limit_cycle=2, revision_count=0/2, active_rework_round=1(전체 3회차). 이전 완료 2회/REJECTED 원문은 아래 보존. 다음 담당은 Astra 동일 TURN 06 추가 독립 재검수.

| ID | 현재 상태 | 수정·회귀 근거 |
|---|---|---|
| QA06-001 | Astra RESOLVED 유지 | 기존 value/type/반복 render/외부 변경 거부 회귀 PASS |
| QA06-002 | Astra RESOLVED 유지 | 기존 radio form ownership/초기 checked/편집/Patch/History 회귀 PASS |
| QA06-003 | Astra RESOLVED 유지 | 기존 native label.control/input.labels/Chrome AX 이름, logical/physical ID·외부 mutation 거부 회귀 PASS |
| QA06-004 | Astra RESOLVED 유지 | 기존 Inspector ID 충돌·논리 selector·History 회귀 PASS |
| QA06-005 HIGH | Sol 수정 완료 / Astra 재검수 대기 (독립 RESOLVED 미승인) | controller의 travel/restoreDraft 첫 projection부터 준비·commit까지 catch 확장. 오류 전달/잠금/후속 거부/History 보존 신규 회귀 PASS |

QA06-005 원인: DOM을 쓰는 editScope.projectTree와 후속 준비가 catch 바깥이어서 부분 mutation 뒤 locked=false로 남았다. 수정 파일 src/phase1/controller.js(기존 40,48 인근). 읽기 전용 candidate/초기 actual preflight는 보호 경계 앞에 유지해 무조건 잠그지 않는다. 오류를 삼키거나 자동 복구/전체 재렌더하지 않는다. API·ID scope 설계 변경 없음.
신규 회귀 tests/unit/projection-failure.test.js 10건 및 tests/e2e/projection-failure.spec.js 4건. 첫 for 쓰기 성공/다음 id 쓰기 실패를 MutationObserver와 오류 identity로 검증. history.entries identity·cursor/actual 불변, 주입 제거 후 apply/travel/restoreDraft 모두 거부. 후속 preparation 예외 2 unit도 보호. 읽기 전용 거부 5조건은 쓰기 0/비잠금 및 unit 재시도 성공. 일반 apply 대조군/기존 commit 실패 잠금 유지.
증거 output/playwright/turn06-rework3/: red-unit.log(exit 1, 6/4/0), red-e2e.log(exit 1, 2/2/0), green-unit.log(0,10/0/0), green-e2e.log(0,4/0/0). PASS/FAIL/SKIP 순서.
필수 test:unit 0,85/0/0; test:e2e 0,32/0/0 Chromium; test:all 0,85+32/0/0. 고유 117개. test-unit/test-e2e/test-all.log, results.json, CLI 별도 5조건 cli-projection.log. 기존 시험을 삭제·skip·완화하지 않음.
예외 주입에서 확인한 오류 복구 결함으로 자연 발생 빈도나 실제 데이터 손실로 과장하지 않는다. 미검증 Firefox/WebKit·실제 스크린리더·clean reinstall·Phase 2. 기존 판정은 Astra만 갱신한다.

---
## 이전 Astra 두 번째 재검수 및 이슈 원문 (역사 기록)

# TURN 06 두 번째 독립 재검수 — 현재 상태 (2026-11-08)
HEAD 7efb498ec1877ff8a0f791264f1d51f0ee6fdf2f / 제품 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52.
**REJECTED / 운영 BLOCKED / revision_count=2. 사람의 방향 결정 전 자동 재작업·TURN 07 금지.**

| ID | 상태 | 근거 |
|---|---|---|
| QA06-001 | RESOLVED 유지 | value/type/no-op 독립 및 기존 회귀 정상 |
| QA06-002 | RESOLVED 유지 | radio source 참조/checked/form ownership/Patch 정상 |
| QA06-003 | RESOLVED | native control/labels, Chrome AX 이름 checkbox/radio/text 양쪽 정상. logical/physical 경계·외부 mutation 검증 정상 |
| QA06-004 | RESOLVED 유지 | 기존 5개 ID 충돌 및 독립 Inspector UI/History 정상 |
| QA06-005 | HIGH / OPEN | controller.js:40,48 projection의 부분 쓰기 예외가 잠금 catch 밖. travel/restoreDraft 실패 후 locked=false 및 후속 apply 허용 |

QA06-005 재현: S1 저장→editor label.for/input.id raw rename→input.setAttribute('id') 예외 주입→travel(0) 또는 restoreDraft. 기대 부분 mutation 후 lock/후속 거부. 실제 label 속성만 projection된 상태에서 lock 없음. apply 대조군은 정상 lock.
원인/최소 수정: 첫 projection mutation부터 오류 보호 범위 포함. 기존 읽기 전용 validation 거부는 비잠금 유지. 추가 수정은 한도 도달 때문에 사람의 명시적 방향 결정 필요.
증거 output/playwright/turn06-rereview2/independent-projection-failure.log. 정상 조작에서 자연 발생한 예외로 과장하지 않음. 상세 코드/판정은 reviews/turn06.md 두 번째 재검수 §3.
정규 75 unit/28 E2E 모두 PASS exit 0이나 새 부분 실패 경로 미포함. native 관계·이름 원본 결함과 새 오류 보호 결함을 구분한다.

---
## 이전 이슈 원문 (역사 기록)

# TURN 06 REVIEW_REWORK 2 — 현재 Sol 수정 상태
CODE: 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52. 독립 판정은 첫 재검수 REJECTED 유지. 다음은 Astra 두 번째 재검수다.

| ID | 현재 상태 | 수정/검증 |
|---|---|---|
| QA06-001 | Astra RESOLVED 유지 | value/type projection 전체 기존 회귀 PASS |
| QA06-002 | Astra RESOLVED 유지 | radio form ownership/초기 checked/History 회귀 PASS |
| QA06-003 HIGH | Sol 수정 완료 / Astra 두 번째 재검수 대기 | optional DOM scope, native label/control/labels, 접근성 이름 및 logical ID/IDREF 경계. 독립 해결 승인 아님 |
| QA06-004 | Astra RESOLVED 유지 | 고정 Inspector 참조/ID 충돌 및 logical selector 회귀 PASS |

QA06-003 수정 파일: src/mini-react/scope.js/dom.js/patch.js/renderer.js; src/phase1/boundaries.js/controller.js/main.js. 승인된 architecture 보완 계약 이내, docs/id-scope.md에 선택적 인자/정책/한계 명시.
- 신규 실패: unit/id-scope.test.js 3 FAIL; e2e/id-scope.spec.js 4 FAIL. red-unit/red-e2e.log 및 red-test-results/.
- 최종 새 unit 15 + E2E 14: native checkbox/radio/text, CDP AX 이름, 논리 round trip/IDREF 목록·공백, missing target/외부-only, 빈·중복 ID, rename/delete/History/draft, no-op, logical selector/Inspector, 초기 source/focus/caret, 외부 physical mutation.
- 기존 물리 ID 동일성 1건은 literal logical 값 + native 관계/physical 구분 검사로 보완. 독립 browser logical oracle와 native 관계 assertions 병행.
- 최종 test:unit 75/0/0 exit 0; test:e2e 28/0/0 exit 0; test:all 75+28/0/0 exit 0. 증거 output/playwright/turn06-rework2/.
- native/control/labels는 두 host 각각 자체 control/labels 1개. Chrome AX checkbox/radio/text 이름이 각각 한 번씩 유지. CLI native/history 로그로 추가 확인.
- 남은 제품 확정 결함은 Sol 검증 범위에서 미재현. 독립 QA는 아직 미완료. Firefox/WebKit/실제 스크린리더/Phase 2 미검증, Inspector live focus pseudo-state 에뮬레이션 범위 밖.
revision_count=1 유지, active_rework_round=2. 두 번째 재검수 결과에도 주요 결함이 남으면 BLOCKED/사람 결정. TURN 07 금지.

---
## 이전 Astra 첫 재검수 및 이전 이슈 원문 (보존)
# TURN 06 첫 재검수 — 현재 독립 판정 (2026-11-07 20:20)
기준 HEAD 612bea5448fb77f6fda6c807c6b4cdc0a45c1900 / 제품 ee14fc8235a7874643af26ef9374602fd6975659.
**FAIL / REJECTED. HIGH 1건 OPEN. revision_count=1/2. Sol REVIEW_REWORK 2, TURN 07 금지.**

| ID | 기존 심각도 | Astra 재검수 상태 | 근거 및 잔여 작업 |
|---|---|---|---|
| QA06-001 | HIGH | RESOLVED | dom.js:6~12,25~27/patch.js:19,60. 독립 value/type/attrs+props/no-op/제어권 제거/외부 mutation 31조건 PASS. independent-values.log |
| QA06-002 | HIGH | RESOLVED | boundaries.js:4~11. 두 그룹 초기 source ===·checked, draft/apply/snapshot/History/branch 7조건 PASS. independent-boundaries.log |
| QA06-003 | HIGH | PARTIALLY FIXED / OPEN | boundaries.js:12~29. 클릭/키보드/focus 회귀는 PASS이나 native label.control은 actual을 가리킴. actual labels=2/editor labels=0, 접근성 이름 actual 중복/editor 없음. native-label-accessibility-result.log 및 boundaries 2 FAIL. host별 logical/physical ID 경계 보완 필요 |
| QA06-004 | MEDIUM | RESOLVED | main.js:7~10. 초기 참조 Map. Inspector ID 5개 기존 E2E 및 원본 UI 편집→Patch→Undo/Redo→재편집 성공. inspector-id-ui/history.log |

증거 루트 output/playwright/turn06-rereview1/. 실제 명령 모두 exit 0: unit 60/0/0, E2E 14/0/0, all 60+14/0/0 (PASS/FAIL/SKIP).
QA06-003 재현·기대/실제·원인·수정 지시는 reviews/turn06.md의 첫 재검수 §3, 추가 승인 설계 계약은 architecture.md 말미. 해결 승인은 클릭 성공과 native 관계/이름 성공을 분리한다. 실제 스크린리더 전체 검증은 미실시.
최초 REJECTED 보고와 이하 Sol 이력은 보존하며, 과거 “수정 완료/재검수 대기”를 현재 독립 승인으로 해석하지 않는다.

---
## 이전 이슈 기록 (원문 보존)

# TURN 06 — Sol 수정 완료 / Astra 재검수 대기
기준 HEAD: 90fc52b63099f537a7be319eef6b0db449afdad4 / 제품 83b1711ae13a63fba6cb38eaf6cb5162c12bc7ec.
판정 REJECTED. 상세 재현·기대/실제·원인·수정 지시는 reviews/turn06.md 3절에 기록했다.

| ID | Severity | Status | 위치 | 재현·실제 결과 | 수정/재검수 |
|---|---|---|---|---|---|
| QA06-001 | HIGH | Sol 수정 완료 / Astra 재검수 대기 | src/mini-react/dom.js:13,39; patch.js:19; renderer.js:28 | checkbox attrs.type + props.value='first'를 동일 Tree로 두 번 render → External DOM change | reflected attrs/props 계약; no-op/type 전환/외부 변경 검출 회귀 |
| QA06-002 | HIGH | Sol 수정 완료 / Astra 재검수 대기 | phase1/index.html:16,18; src/phase1/controller.js:11,23 | 같은 name radio 복제→actual 체크 해제; UI Patch→actual true/edit false | 영역별 group/form ownership 격리, 초기 참조/양쪽 History 일치 |
| QA06-003 | HIGH | Sol 수정 완료 / Astra 재검수 대기 | src/phase1/controller.js:11; html-policy.js:3,12 | 동일 id/for 복제 후 edit label click→actual checkbox만 변경 | 영역 내 label 연결, logical id/for 보존, Patch/History/keyboard 회귀 |
| QA06-004 | MEDIUM | Sol 수정 완료 / Astra 재검수 대기 | src/phase1/main.js:6,57 | h3에 id=edit-text 설정 후 텍스트 변경→Invalid text | 제어 패널 참조/조회 범위 격리, 예약 UI ID 충돌 회귀 |

증거: output/playwright/turn06/independent-forms.log, independent-boundaries.log, independent-assertions.log, radio-ui-snapshot.log, id-collision-ui.log, 이미지 2개.
기존 unit 53/E2E 8은 독립 재실행 PASS지만 위 반례는 실패했다. Sol REVIEW_REWORK 후 Astra TURN 06 재검수 필요. TURN 07 승인 없음.
이하 Sol TURN 05 및 초기 TURN 01 기록은 과거 이력이며 현재 OPEN 상태를 덮어쓰지 않는다.

---
# API Studio issues

## 이전 상태 — Sol TURN 05
- SOL-005-01/02 재검증 완료. 확인된 미해결 제품 결함 없음.
- 필수 Phase 1 자체 검증: 53 unit + 8 Chromium E2E PASS, 0 fail/skip. 독립 승인 대기.
- Chromium 이외 브라우저/Phase 2 전체 미검증. 원자 rollback 미지원은 계약상 한계이며 부분 적용 오류 잠금은 unit 검증했다.
- 아래 TURN 01 내용은 초기 설계 시점의 기록이다.

기준: TURN 01 / 2026-11-07 / 구현 없음 / commit none

## 미해결 확정 결함
없음. 구현·테스트가 없어 제품 결함을 재현하지 않았다는 뜻이며 무결함 보증이 아니다. Phase 1/2 기능은 UNVERIFIED다.

## 설계 정정 기록
| ID | 구분 | 상태 | 근거 및 영향 |
|---|---|---|---|
| DEC-001 | 요구사항 정합성 | RESOLVED (설계) | 이전 외부 초안의 문자열 draft 중심 Phase 1을 폐기. 하네스 1.1에 맞춰 실제→테스트 복제/테스트 DOM 직접 편집/양쪽 History 동기화 확정. architecture 1/6절, H01~H03 |
| DEC-002 | 저장소 초기화 | DECIDED | 현재 Git 없음. Sol TURN 02에서 실제 경로 재확인 후 원격 없는 git init 허용. Astra는 초기화하지 않음 |
| DEC-003 | 일정/의존성 | DECIDED | 하네스의 TURN 03 Diff / 04 Patch / 09 API / 10 UI 순서 적용. 정적 서버가 기본이며 build 스크립트 필수 아님 |

## 구현 시 감시할 위험 (재현된 결함 아님)
연속 형제 삭제·삽입, editHost baseline drift, History 공유 참조, input caret, listener 중복, 실패 render의 hook cache, effect cleanup, 늦은 HTTP 응답, 민감 metadata.
계약의 P02/P03/P04/P05/H02/H03/R03/R04/A02/A04로 검증한다.

## 이후 결함 기록 형식
ISSUE-ID / Severity(CRITICAL,HIGH,MEDIUM,LOW) / Status / Commit / 파일:줄 / 재현 명령·입력 / 기대 / 실제 / 증거 / 원인 가설 / 수정 지시 / 재검수 결과.
검증 불가는 UNVERIFIED로 분리하고 CRITICAL/HIGH 또는 필수 미검증은 QA PASS 금지.

## TURN 05 구현 중 발견/수정
- SOL-005-01 / MEDIUM / RESOLVED (8 E2E 재검증 PASS): E2E sync helper가 innerHTML 문자열 동등을 사용하여 같은 DOM의 속성 순서 차이를 오탐. 첫 실행 3 passed/5 failed. production 함수를 쓰지 않는 DOM 구조·정렬 속성·live props oracle로 교체, Node === 별도 검증 유지. output/playwright/turn05-attempt1에 원본 실패 trace 보존. 제품 계약 변경 없음.

- SOL-005-02 / LOW / RESOLVED: 자체 리뷰에서 boolean attribute 목록 누락 및 style 객체의 암묵 문자열화를 확인. HTML boolean 목록 보강, style string 계약 강제 및 단위 반례 추가. 계약 변경 없음.

## REVIEW_REWORK 1 — 수정 연결 (독립 해결 승인 아님)
수정 코드: ee14fc8235a7874643af26ef9374602fd6975659. Astra의 원본 REJECTED 판정은 reviews/turn06.md에 보존했다.

| 결함 | 수정 파일/원인 처리 | 회귀 테스트 | 실행 증거/남은 검토 |
|---|---|---|---|
| QA06-001 | src/mini-react/dom.js expectedAttrs/syncProps, patch.js preflight/control: 엔진이 input.value/type 갱신 후 만든 value content attribute만 logical/physical projection으로 정확 비교 | tests/unit/review06.test.js QA06-001 5건; tests/e2e/review06.spec.js QA06-001 | 동일 Tree 반복/no-op 0 writes, attrs+props 충돌, 기본 on/명시 값/제어권 제거/명시 attr 삭제/type 전환, 외부 value/title/empty-style 거부 PASS |
| QA06-002 | src/phase1/boundaries.js isolateHost + controller.js: host 외부 독립 native form ownership | unit initial checked radios; E2E checked radio cloning / Inspector type-name radio / combined | 초기 source ===, 초기 true 상태, 여러 그룹 draft/patch/no-op/Undo/Redo 및 saved snapshot PASS |
| QA06-003 | boundaries.js capture label activation: 전역 기본 activation 취소, host 내부 control focus/click. id/for 원문 유지 | unit explicit/implicit label; E2E explicit/implicit labels + text focus + Space + History | 재현된 교차 활성화 해소 PASS. 물리 ID namespace/native label.control/labels 및 보조기기 전역 ID 해석을 격리하지 않는 한계는 Astra 검토 필요 |
| QA06-004 | src/phase1/main.js: 초기 Inspector control Map/고정 노드 참조 | E2E every Inspector control id collision; combined | edit-text/target/attr-name/attr-value/tag 각각 편집→Patch→Undo/Redo 및 alert 없음 PASS |

모든 최종 명령: test-unit.log 60/0/0 exit 0, test-e2e.log 14/0/0 exit 0, test-all.log 60+14/0/0 exit 0. 경로는 output/playwright/turn06-rework1/.
수정 전 신규 실패: unit 6 FAIL(기존 53 PASS), 신규 E2E 5 FAIL. 기존 테스트 삭제/skip/기대값 완화 없음.

### 도구 부작용 — 제품 검증 완화 없음
CLI screenshot 전후 text input에 style 없음→style="" 생성 확인(cli-screenshot-attrs.log). 그 뒤 연속 Patch는 외부 변경으로 거부되었으며 이는 정상 검출이다. cli-combined-failure.*에 보존. Chromium/Chrome 연속 조작 probe 및 screenshot을 마지막에 배치한 CLI snapshot에서는 성공했다. 엔진은 이를 예외 처리하지 않았다.
