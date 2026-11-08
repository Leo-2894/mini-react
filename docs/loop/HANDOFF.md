# [HANDOFF — 2026-11-08 — TURN 06 독립 검수 완료]
FROM: Sol 6.1 / HIGH — 독립 검수 세션
TO: Sol — 구현 세션
CURRENT TURN: 06 완료
STATUS: PASS / APPROVED
REVIEW HEAD: d7ec63024c24571caa22080dd345fc2afd97470a
PRODUCT CODE: ff2a689162c2d6129749f400810846fbee50e736
WORKTREE: 시작 clean, 종료 검수 문서 5개만 변경. 제품/정규 시험 불변. 미커밋 검수 산출물을 다음 세션이 보존할 것.
EVIDENCE: 독립 unit 85/0/0 exit0, E2E 32/0/0 exit0, all 85+32/0/0 exit0. 고유 117개. output/playwright/turn06-rereview3/.
OPEN ISSUES: 확인 범위 없음. QA06-001~005 모두 독립 RESOLVED.
NEXT ALLOWED ACTION: 구현 세션 Sol의 TURN 07 — FunctionComponent/루트 useState, R01/R02. 현재 파일/Git/승인 기준을 다시 확인하고 Phase 1 회귀를 유지.
DO NOT: 검수 세션에서 구현, Phase 2 최종 승인 간주, 이전 보고/증거 덮어쓰기, 다른 세션 자동 실행.

사용자 명시 지시로 검수 모델을 Astra에서 Sol 6.1/HIGH 독립 세션으로 변경했다. 구현 세션 자기 승인과 구별한다. 기존 Astra 보고 작성자/판정/원문 및 하네스/AGENTS는 유지했다.
새 limit_cycle=2 / revision_limit=2 / revision_count=1 / active_rework_round=1 / lifetime_rework_round=3. 이전 주기 완료 2회 보존. 한도 재설정 자체가 아니라 이번 직접 검증으로 제품 게이트를 승인했다.

QA06-005: projection 부분 쓰기 3조건 + 후속 preview 준비 오류 2조건은 원본 오류/부분 mutation/History 보존/lock/주입 제거 뒤 세 조작 거부 모두 정상. candidate/preflight 5조건은 mutation0/양 DOM·cursor 보존/비잠금/재시도 성공. independent-projection.js/log.
실제 UI Patch/S1→draft→Undo/S0→Redo/S1 및 stable ul 참조/alert0 정상. independent-ui.log.
미검증 Firefox/WebKit/실제 스크린리더/clean reinstall/Phase 2/예외 자연 발생 빈도. 제품·시험 수정 없음. 브라우저/서버 종료. TURN 07은 이번 검수 세션에서 수행하지 않고 인계 STOP.

---
## 이전 인계 원문 (역사 기록; 현재 인계는 위 APPROVED)

# [HANDOFF — 2026-11-08 — Sol QA06-005 추가 재작업]
FROM: Sol (Agent 1)
TO: Astra (Independent QA)
CURRENT TURN: 06 — 동일 TURN 추가 독립 재검수 요청
STATUS: AWAITING_ASTRA_REVIEW (Sol 자체 검증 완료 / 기존 독립 REJECTED 유지)
CODE SHA / LAST VERIFIED COMMIT: ff2a689162c2d6129749f400810846fbee50e736
REVIEW BASELINE: 7efb498ec1877ff8a0f791264f1d51f0ee6fdf2f (제품 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52)
PRESERVATION CHECKPOINT: 8076542bf2c46bf9e42cdedeb928dd7425889fe0 — Astra의 의도된 검수 문서 5개를 원문 그대로 보존.
FINAL HANDOFF HEAD: 이 문서를 포함한 최종 docs-only 커밋. 실제 전체 SHA와 최종 clean 상태는 output/playwright/turn06-rework3/handoff-receipt.json 및 Sol 최종 응답에 기록. git rev-parse HEAD로 대조.
WORKTREE: 제품/시험 커밋 + 공통 기록 4개 docs-only 커밋 후 clean 확인. 원격 작업 없음.

## 한도·승인 상태
- 최신 사용자 지시 "다시 한도 재설정 됐어"를 명시 근거로 기존 한도 BLOCKED만 해제했다. 제품/독립 QA 승인이나 TURN 07 허용이 아니다.
- 이전 주기: 완료된 수정→재검수 2회와 두 REJECTED 보고를 보존.
- 새 주기 limit_cycle=2, revision_limit=2, revision_count=0 유지. active_rework_round=1은 새 주기 첫 재작업이며 전체 이력상 세 번째(lifetime_rework_round=3). 구현 수정 시도 1회. Sol 완료만으로 재검수 횟수를 올리지 않는다.
- QA06-001/002/003/004 독립 RESOLVED 유지. QA06-005 HIGH는 **Sol 수정 완료 / Astra 재검수 대기**이며 독립 RESOLVED가 아니다.

## 수정 범위·오류 경계
- src/phase1/controller.js: travel/restoreDraft의 try/catch를 editScope.projectTree 첫 호출부터 준비·commit까지 확장했다. 원본 오류를 재전달하고 locked=true. 부분 실패 뒤 주입을 제거해도 세 조작을 거부한다. history.select는 두 commit 성공 뒤에만 실행된다.
- 읽기 전용 candidate 검증과 travel의 첫 actual preflight는 mutation 보호 구간 앞에 유지. 거부 시 DOM/cursor 보존 및 비잠금. projection 이후의 preparation/adoption/preview/재검증 실패는 이미 쓰기가 발생할 수 있으므로 같은 잠금 경계에 포함한다.
- 신규 tests/unit/projection-failure.test.js 10건, tests/e2e/projection-failure.spec.js 4건. 기존 75 unit/28 E2E의 내용·assertion·skip 불변.
- ID scope, logical/physical ID 계약, managed actual 재채택 금지, 같은 Diff/Patch와 default renderer/Phase 2 API 불변. 전체 재생성/rollback/재시도 없음. 설계 변경 없음, architecture/id-scope/README 수정 불필요하여 보존.

## 실제 실패 → 성공과 필수 명령
모든 경로는 output/playwright/turn06-rework3/ 기준. PASS/FAIL/SKIP 순서이며 반복 실행은 고유 수에 합산하지 않는다.

| 실행 | 종료 코드 | 실제 결과 | 증거 |
|---|---:|---|---|
| 수정 전 신규 unit | 1 | 6/4/0 | red-unit.log |
| 수정 전 신규 Chromium | 1 | 2/2/0 | red-e2e.log, red-test-results/, red-playwright-report/ |
| 수정 후 신규 unit | 0 | 10/0/0 | green-unit.log |
| 수정 후 신규 Chromium | 0 | 4/0/0 | green-e2e.log |
| npm run test:unit | 0 | 85/0/0 | test-unit.log |
| npm run test:e2e | 0 | 32/0/0 Chromium | test-e2e.log, full-e2e-test-results/, full-e2e-playwright-report/ |
| npm run test:all | 0 | unit 85/0/0 + Chromium 32/0/0 | test-all.log, final-test-results/, final-playwright-report/ |

고유 정규 시험 117개(기존 103 + 신규 14). 실행 요약 results.json.
- travel/restoreDraft의 label.for 쓰기 성공→input.id 예외는 수정 전 locked=false/주입 제거 후 세 조작 허용에서 수정 후 locked=true/세 조작 거부로 바뀜. MutationObserver로 for 한 번만 기록, input은 raw ID 유지, 원본 오류 identity·actual DOM·snapshot 항목 identity·cursor 보존 assertion.
- apply 동일 예외 대조군은 수정 전후 모두 잠금. projection 성공 뒤 editable adoption read 오류 2건도 원본 오류 전달/잠금/후속 거부.
- 읽기 전용 후보 오류 3조건 및 initial actual preflight 2조건: 두 DOM/cursor 불변, mutation 0, unlocked. unit은 원인 제거 후 재시도 성공도 확인. 기존 commit 단계 부분 실패 잠금 유지.
- 기존 QA06-001 value/type·반복 render, QA06-002 radio 소유권, QA06-003 native label.control/input.labels/Chrome AX 이름, QA06-004 Inspector ID 충돌 모두 기존 unit/E2E PASS. physical 외부 속성 거부·History 분기/no-op Redo/50개·Node/listener/focus/caret 회귀도 PASS.

## 브라우저·보존·한계
- 설치된 Playwright Skill을 읽고 npx 로컬 CLI 사용. 화면 Inspector 편집→Patch/History 진행 및 별도 예외 주입 5조건(apply/travel/restoreDraft projection 3 + travel/restoreDraft 후속 preparation 2) 모두 PASS. cli-projection.js/log, cli-console.log, cli-snapshot-*.log. 추가 진단은 고유 정규 시험에 미포함.
- E2E 자체 서버와 별도 서버를 순차 사용했고 CLI/수동 서버 종료. screenshot 미실행으로 도구 style mutation 회피. 외부 변경 검사 완화 없음.
- 기존 모든 TURN 06 증거 폴더와 review/architecture/id-scope/README/비수정 source/기존 tests 201개 파일 SHA-256 불변: baseline-hashes.json, preservation-check.json. 실행 전 기존 report/test-results는 prior-*로 보존. Astra turn06.md 원문·판정 불변.
- 예외 주입으로 확인한 오류 복구 결함이다. 정상 조작에서의 자연 발생 빈도/데이터 손실은 입증하지 않았으며 그런 주장도 하지 않는다. Firefox/WebKit·실제 스크린리더·clean reinstall·Phase 2 미검증. Sol 검사 범위에서 잔여 결함 미재현, 독립 승인 대기.

NEXT ALLOWED ACTION: Astra가 같은 TURN 06의 QA06-005 원본 재현 및 신규 예외 경계/기존 회귀를 독립 검수 → 판정·공통 기록·새 주기 revision_count 갱신 → STOP.
DO NOT: Sol 자체 승인, TURN 07, 다른 세션 자동 실행, 기존 증거/검수 판정 덮어쓰기.

---
## 이전 Astra 두 번째 재검수 인계 원문 (역사 기록; 현재 상태는 위 인계)

# [HANDOFF — 2026-11-08 — Astra TURN 06 두 번째 재검수]
FROM: Astra
TO: 사용자 / 사람의 방향 결정
STATUS: BLOCKED (독립 검수 FAIL / REJECTED)
CURRENT TURN: 06
BASELINE HEAD: 7efb498ec1877ff8a0f791264f1d51f0ee6fdf2f
PRODUCT COMMIT: 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52
REVISION: revision_count=2, active_rework_round=2 완료. 수정→재검수 한도 도달.
WORKTREE: 시작 clean; 종료 시 Astra 검수 기록 5개만 수정. 제품/테스트/architecture/README 불변. 커밋 없음.
EVIDENCE: unit 75/0/0 exit 0; E2E 28/0/0 exit 0; all 75+28/0/0 exit 0. output/playwright/turn06-rereview2/.
ISSUES: QA06-001/002/003/004 RESOLVED. QA06-005 HIGH OPEN.
NEXT ALLOWED ACTION: 사용자가 QA06-005를 검토하고 추가 수정·재검수 허용 여부 등 방향 결정. 그 전 Sol 수정/REVIEW_REWORK 3/TURN 07 금지.
DO NOT: 테스트 103개 통과를 독립 PASS로 해석하거나 자동 세션 실행/다음 TURN 진행 금지.

QA06-003 원본 실패는 checkbox/radio/text의 native label.control/labels 및 Chrome CDP AX 이름 모두 해결됐다. ID 경계/외부 logical 원문 mutation 거부/Inspector/기존 회귀 정상.
새 QA06-005: controller.js:40,48의 editScope.projectTree가 try/catch 밖에서 DOM을 쓴다. label.for가 먼저 projection된 후 input.id 쓰기에 예외를 주입하면 travel/restoreDraft는 locked=false이고 주입 제거 후 apply를 허용한다. 같은 apply 경로는 올바르게 잠긴다. 기존 H03 부분 실패 잠금 계약의 누락이다.
증거 independent-projection-failure.log (대조 apply 1 PASS, travel/restoreDraft 2 FAIL), 자세한 재현 및 수정 조건은 reviews/turn06.md 말미. 예외 주입 검증이며 정상 사용자 동작에서 자연 발생한 오류라고 주장하지 않는다.

사람이 추가 작업을 명시적으로 허용한 경우의 최소 수정 방향: projection의 첫 쓰기부터 오류 보호 범위에 포함하고, 예외 시 잠금/후속 조작 거부 회귀를 추가한다. 읽기 전용 preflight 실패의 DOM/cursor 보존 및 비잠금은 유지한다. 대규모 리팩터링/엔진 변경은 불필요하다.
기존 4개 증거 폴더 및 최초/첫 재검수 보고 보존. 새 증거 prior-*에 이전 report/test-results 복사. 이번 screenshot 미실행(알려진 도구 mutation 회피). 검수 브라우저/서버 종료.
미검증: Firefox/WebKit, 실제 스크린리더, clean install, Phase 2, projection 예외의 자연 발생 빈도. 필수 명령은 실행 가능했으므로 TEST_BLOCKED 아님.

---
## 이전 인계 원문 (역사 기록; 현재 상태는 위 BLOCKED)

# [HANDOFF — 2026-11-08 13:24 Asia/Seoul]
FROM: Sol (Agent 1)
TO: Astra (Independent QA)
CURRENT TURN: 06 — REVIEW_REWORK 2 수정 완료 / 두 번째 재검수 요청
STATUS: AWAITING_ASTRA_REVIEW (Sol 자체 회귀 PASS, 기존 독립 REJECTED 유지)
CODE SHA / LAST VERIFIED COMMIT: 1ec56bc5e7ed5093f3ba5ff516352cc92b0e9d52
HANDOFF HEAD: 이 문서를 포함한 최종 docs-only 커밋. 실제 전체 SHA는 git rev-parse HEAD 및 Sol 최종 응답에 명시.
WORKTREE: 코드 1ec56bc + 공통 기록 4개 인계 commit. 최종 git status --short clean 확인. remote 없음.
FILES CHANGED: src/mini-react/scope.js(신규), dom.js, patch.js, renderer.js; src/phase1/boundaries.js, controller.js, main.js; tests/unit/id-scope.test.js(신규), review06.test.js; tests/e2e/id-scope.spec.js(신규); README, docs/id-scope.md(신규); 공통 loop 기록 4개.
EVIDENCE: test:unit exit 0 75/0/0; test:e2e exit 0 28 Chromium/0/0; test:all exit 0 75 unit+28 Chromium/0/0 (PASS/FAIL/SKIP). 각각 별도 실행, 고유 103개. output/playwright/turn06-rework2/{test-unit,test-e2e,test-all}.log.
ISSUES: QA06-001/002/004의 Astra RESOLVED 유지 및 회귀 PASS. QA06-003은 Sol 수정 완료 / Astra 두 번째 재검수 대기, 독립 RESOLVED 아님.
REVISION: revision_count=1 유지(완료된 첫 수정→재검수). active_rework_round=2, 제품 구현 시도 1회. 두 번째 Astra 재검수에 주요 결함 잔존 시 BLOCKED/사람 결정. Sol 자체 완료로 revision_count를 올리지 않음.
NEXT ALLOWED ACTION: Astra 동일 TURN 06 두 번째 재검수. 원본 native 관계/이름 반례와 승인 ID 경계 계약 및 새/기존 회귀를 직접 확인 → 판정·공통 기록 갱신 → STOP.
DO NOT: Sol 자기 승인/다른 TURN 대리 수행/TURN 07/다른 세션 자동 실행/증거 덮어쓰기/외부 변경 검사 완화.

## 변경 계약과 구현
Astra가 architecture 말미에 승인한 Phase 1 ID 경계만 구현했다. 순수 diff/Tree 형식은 불변이며 default renderer/Phase 2 API 동작은 유지한다.
선택적 인자: domToVNode(node,scope), readTree(host,scope), createDOM(vnode,document,scope), patch/validatePatch(host,plan,scope), createRenderer(host,{role,scope}). 상세는 docs/id-scope.md.
- source 논리 Tree를 먼저 검증한 뒤 원래 Node를 보존하고 초기 id/IDREF 속성만 보정. source focus/caret/radio 초기 상태 회귀 유지.
- scope는 Node별로 직접 쓴 physical 값만 logical로 해석. prefix 제거/현재 DOM 무조건 신뢰 없음. 새 raw logical 편집 보존.
- IDREF: for + aria-labelledby/describedby/controls/owns/flowto/details/errormessage/activedescendant. token 순서/ASCII 공백 보존, missing target은 scope 내부 dangling ID로 외부-only fallback 금지. 일반 ARIA 원문 유지.
- same-host empty/ASCII whitespace/duplicate logical ID는 명시적 오류. Inspector 후보는 전체 logical Tree에 대입해 사전 검증.
- Inspector logical selector는 detached logical view의 native CSS parser를 사용하고 실제 Node로 대응. 다른 렌더링 경로/실제 DOM 쓰기 없음.
- attrs Patch와 preflight는 logical→physical 정확 비교. 실제 physical id/for/ARIA mutation은 쓰기 전에 거부. actual managed DOM 재채택 없음.
- 이전 label capture/click guard를 제거했다. label.control/input.labels 및 Chrome native AX 이름이 각 host에 연결된다.

## red → green과 회귀
- 수정 전 신규 unit 3 FAIL, Chromium 4 FAIL: native labels actual 2/editor 0, editor control 외부, editor ARIA 이름 외부 결속. red-unit/red-e2e.log, red-test-results/.
- 기존 unit 1건의 물리 원문 ID assertion은 승인 계약에 맞춰 literal logical read + native 관계/physical 분리 assertion으로 바꿈. 기존 시험 삭제/skip/기대값 완화 없음.
- 보강 browser 1건은 about:blank에서 import한 테스트 초기화 누락. goto 추가해 재검증, scope-test-results에 증거 보존. 제품 수정 회수와 구별.
- 최종 기존 60+14 및 신규 15 unit/14 E2E 모두 PASS. 새 독립 DOM oracle는 fixture data-key→literal logical ID로 물리 값을 해석하고 native 관계·literal id/for도 별도 확인. production decoder를 기대값 생성에 사용하지 않음.
- Chrome CDP Accessibility.getPartialAXTree로 checkbox/radio/text의 actual/editor 이름이 각각 동일하게 한 번 나옴. native-ax.log, 정규 E2E 3건.
- CLI도 두 host label/control/labels=1, 각 native 이름 유지 및 draft [false,true]→Patch [true,true]→Undo [false,false]→Redo [true,true] 확인. cli-native-result.log, cli-history-result.log, snapshots, native-boundaries.png. screenshot 마지막, 브라우저/수동 서버 종료.
- ID/for/ARIA 생성·변경·삭제·대상 재지정/History/draft, external-only/논리 selector/Inspector 충돌/no-op 0 writes/초기 Node/focus/caret/외부 physical attrs 검출 PASS. value/type/radio/listener/History 50개/preflight/부분 실패 lock 기존 회귀 유지.

## 증거 보존과 한계
기존 turn06/turn06-rework1/turn06-rereview1 및 Astra architecture/review를 포함한 101개 파일 hash 불변. 최초 문서 보존 checkpoint f1ca731. 기존 보고서 prior-* 복사. 기존 REJECTED 보고 원문을 수정하지 않음.
미검증: Firefox/WebKit, 실제 스크린리더 운용, clean dependency reinstall, Phase 2. Chrome native AX 검증을 실제 스크린리더 인증으로 과장하지 않음. Inspector view는 구조·속성 selector용이며 :focus 같은 live pseudo-state 에뮬레이션을 보장하지 않음. 자세한 범위는 docs/id-scope.md.

재현: PowerShell cwd C:\Users\Leo\Desktop\API 1. npm run test:unit / test:e2e / test:all. dev 접속 http://127.0.0.1:4173/phase1/ (E2E 전 별도 dev 서버 종료).

---
## 이전 Astra 인계 원문 (역사 기록 보존)
# [HANDOFF — 2026-11-07 20:20 Asia/Seoul]
FROM: Astra (Independent QA)
TO: Sol
CURRENT TURN: 06 — 첫 재검수 완료 / REVIEW_REWORK 2 대기
STATUS: FAIL / REJECTED
BASELINE HEAD: 612bea5448fb77f6fda6c807c6b4cdc0a45c1900
PRODUCT COMMIT: ee14fc8235a7874643af26ef9374602fd6975659
WORKTREE: 검수 시작 clean. 제품/기존 테스트 불변. 종료 시 Astra 문서 6개(architecture, turn06 review, STATE, HANDOFF, LOG, ISSUES)만 수정. 원격 작업/커밋 없음.
EVIDENCE: 독립 test:unit 60/0/0 exit 0; test:e2e 14/0/0 exit 0; test:all 60 unit+14 E2E/0/0 exit 0. 별도 probe value 31 PASS/0 FAIL, boundary 14 PASS/2 FAIL, regression 8 PASS/0 FAIL. output/playwright/turn06-rereview1/.
OPEN ISSUES: QA06-003 HIGH 1건. QA06-001/002/004는 Astra 재현 및 회귀 확인 후 RESOLVED. 기존 최초 보고 원문 보존, 새 판정은 reviews/turn06.md 말미 참조.
NEXT ALLOWED ACTION: 같은 TURN 06의 Sol REVIEW_REWORK 2 → 코드/회귀/증거 인계 → Astra 두 번째 재검수. TURN 07 금지.
REVISION: revision_count=1 (첫 수정→첫 재검수 완료). active_rework_round=1 완료; Sol이 두 번째 수정 시작 시 2로 변경. 최대 2회 중 남은 수정→재검수 1회. 그 뒤 주요 결함 잔존 시 BLOCKED/사람의 방향 결정.
DO NOT: 자기 승인/다른 TURN 실행/제품 전체 렌더러 재작성/외부 변경 검사 완화/기존 실패 증거 덮어쓰기.

## 남은 결함과 수정 계약
QA06-003의 label 클릭은 이제 로컬 input을 활성화하지만 native 연결은 깨져 있다. editor label.control이 actual input, actual labels=2/editor labels=0. 실제 브라우저 접근성 트리는 actual checkbox "Local consent Local consent", editor checkbox는 이름 없음. 일반 text input도 같은 문제다. 이는 보조기기 전체 인증 요구가 아니라 허용한 HTML label 관계의 재현된 결함이다.
증거: independent-boundaries.log, native-label-accessibility-result.log. 재현 코드는 turn06 보고서 및 probe 로그에 있다.

Astra는 docs/architecture.md 말미의 **Phase 1 ID 경계 보완 계약**만 설계 승인했다. 구현/QA 승인 아님.
- 두 host의 logical id/for/IDREF는 Tree/History/Inspector에 보존, physical ID는 host별로 격리하여 native 관계와 접근성 이름 복구.
- 선택적 scope/context를 공유 DOM 입출력/attrs patch/preflight/Inspector 경로에 일관되게 적용. default renderer/Phase 2/single shared Diff 계약 유지.
- 초기 source Node === 및 논리 sample 상태 유지. namespace 변환만 제한적인 초기 속성 보정 허용.
- actual/Inspector 외부-only 대상 연결 금지, ARIA IDREF와 논리 selector 지원, id 삭제/변경/History, no-op 0 writes, 외부 physical mutation 거부를 검증.
- getter 조작/aria-label 덧씌우기/클릭 guard만 유지/지원 id·for 삭제로 숨기지 말 것.
- 위 범위를 넘는 큰 변경이 필요하면 비용·변경안을 먼저 기록하고 중단. 전체 엔진 재작성 승인 없음.

## 실행 순서 및 인계 조건
1. 신규 native 관계/이름 실패 회귀 확보. 현재 클릭/Space/focus 통과와 별도로 assertion.
2. 계약에 맞춰 QA06-003 수정, 관련 value/radio/Inspector 회귀 유지.
3. test:unit / test:e2e / test:all 각각 실행하고 exit/PASS/FAIL/SKIP, 수정 SHA 및 신규 red→green 증거 기록.
4. 같은 TURN 06으로 Astra 재검수 요청 후 STOP. revision_count는 완료된 수정→재검수 횟수이므로 Sol 수정 완료만으로 2로 올리지 않는다.

기존 turn06/turn06-rework1 증거 보존. 새 증거는 별도 rework2 경로 사용. screenshot이 text input에 style=""를 남기는 현상도 Astra가 독립 확인했고, 그 뒤 External DOM change 거부는 정상이다. 촬영 마지막 또는 reload 후 다음 조작.
미검증: Firefox/WebKit/실제 스크린리더/clean reinstall/Phase 2. 필수 실행 장애는 해소되었고 TEST_BLOCKED 아님. 검수 브라우저·서버 종료, 다른 세션 자동 실행 없음.

---
## 이전 인계 원문 (역사 기록; 아래 대기 상태는 현재 상태가 아님)

# [HANDOFF — 2026-11-07 15:45 Asia/Seoul]
FROM: Sol (Agent 1)
TO: Astra (Independent QA)
CURRENT TURN: 06 — REVIEW_REWORK 1 수정 완료 → 동일 TURN 06 재검수
STATUS: AWAITING_ASTRA_REVIEW (수정 자체 검증 PASS, 기존 Astra REJECTED 유지)
WORKTREE: 수정 코드 ee14fc8 + 최종 인계 docs commit; git status --short 최종 clean 확인. remote 없음. Astra 최초 검수 산출물은 b431784에 내용 변경 없이 보존.
LAST VERIFIED COMMIT: ee14fc8235a7874643af26ef9374602fd6975659 (Sol 검증, 독립 승인 아님)
FILES CHANGED: src/mini-react/dom.js, patch.js; src/phase1/boundaries.js(신규), controller.js, main.js; tests/unit/review06.test.js(신규), tests/e2e/review06.spec.js(신규); README; 공통 loop 기록 4개.
EVIDENCE: npm run test:unit 60 PASS/0 FAIL/0 SKIP exit 0; test:e2e 14 Chromium PASS/0 FAIL/0 SKIP exit 0; test:all 60 unit+14 E2E/0 FAIL/0 SKIP exit 0. 각각 별도 실행, 고유 시험은 74개이며 재실행 수치를 합산하지 않음. output/playwright/turn06-rework1/{test-unit,test-e2e,test-all}.log.
OPEN ISSUES: QA06-001~004 모두 Sol 수정 완료 / Astra 재검수 대기. 아래 label 정책 한계는 명시적으로 검토 필요. 독립 해결 승인 없음.
NEXT ALLOWED ACTION: Astra가 같은 TURN 06 첫 재검수. 원본 turn06.md의 네 재현과 새/기존 테스트를 직접 실행하고 정책 적합성 확인 → PASS/REJECTED 판정 및 공통 기록 갱신 → STOP.
DO NOT: Sol의 회귀 통과를 독립 승인으로 간주하거나 07 진행 금지. reviews/turn06.md의 원본 REJECTED를 Sol이 수정하지 않았음. 다른 세션 자동 실행/동시 수정/remote 작업 없음.

## 수정 요지 및 영향
1. QA06-001: input.value/type의 엔진 반영 직후 value content attribute를 WeakMap으로 추적한다. logical VNode attrs/props 불변, 실제 외부 attrs는 정확 비교. managed DOM 재채택/전체 검사 무시 없음.
2. QA06-002: 두 host 밖의 별개 native form wrapper로 radio 그룹 분리. name/id/for와 host 내부 논리 Tree/source Node === 보존. submit 방지. destroy에서 guard/wrapper 해제.
3. QA06-003: 별개의 host capture guard가 label 기본 전역 activation을 취소하고 같은 host 안 control만 focus/click한다. explicit/implicit, 직접 input 클릭, Space, text focus, History 재적용을 검증했다. **물리 id/for는 그대로이므로 native label.control/labels getter 및 보조기기의 전역 ID 해석은 격리하지 않는다.** 물리 ID namespace 변환은 VDOM/selector/serialization 계약에 영향을 줘 이번 작은 수정에 넣지 않았다. activation 경계 정책으로 재현 결함을 해결하는 방안의 적합성을 Astra가 판단해야 한다. 보조기기까지 완전 격리가 필수라면 이를 계약 보완/후속 수정 지시로 명시할 것.
4. QA06-004: Inspector 초기 DOM 참조 고정으로 전역 ID 검색 충돌 제거. 사용자 id 지원 유지.
공개 h/Tree/diff/patch/renderer API 및 architecture 문서는 변경하지 않았다. 내부 syncProps에 attrs 인자를 추가하고 expectedAttrs helper로 physical projection을 적용한다. Phase 1/2는 계속 같은 엔진을 쓴다.

## 회귀와 재작업 한도
- 최초 실패 확보: 기존 unit 53 PASS + 신규 6 FAIL; 신규 Chromium 0 PASS/5 FAIL. red-unit/red-e2e.log 및 red-test-results/. 기존 Astra output/playwright/turn06/ 불변.
- 제품 수정 시도 1회로 반례 및 기존 회귀 통과. 이후 empty style 외부 변경 unit, radio snapshot, 연속 조작 E2E를 보강했다.
- revision_count=0: 완료된 수정→Astra 재검수는 아직 0회. active_rework_round=1. 하네스 최대 2회 한도 유지.
- 기존 History 분기/no-op Redo/50개 제한, preflight 양 DOM/cursor 유지, 두 번째 적용 실패 잠금, listener/Node ===/focus/caret 전체 재실행 통과.

## CLI 증거와 주의점
CLI Inspector id=edit-text 편집→Patch 성공. radio 전환/체크→Patch 후 양 영역 checked 및 History S2를 cli-final-snapshot.log/radio-fixed.png로 확인했다.
CLI 기본 screenshot이 text input에 style=""를 남기는 도구 부작용을 before/after 속성 배열로 확정했다(cli-screenshot-attrs.log). 그 뒤의 External DOM change는 정상 검출이며 검사 완화 없음. screenshot은 검증 마지막에 찍거나 reload 후 다음 상호작용을 진행할 것. 실패 화면도 cli-combined-failure.*에 보존했다.
별도 Chromium/Chrome channel 연속 조작 probe 각각 1 PASS. 정규 필수 E2E 14개는 Chromium 기준이다. 수동 dev 서버/CLI 브라우저 종료.

## 시작 명령
PowerShell cwd C:\Users\Leo\Desktop\API 1
npm run test:unit / npm run test:e2e / npm run test:all
npm run dev → http://127.0.0.1:4173/phase1/ (E2E 전 별도 서버 종료)

---
## 이전 Astra 인계 원문 (보존)
# [HANDOFF — 2026-11-07 15:16 Asia/Seoul]
FROM: Astra (Independent QA)
TO: Sol
CURRENT TURN: 06 — REJECTED, REVIEW_REWORK 대기
STATUS: REJECTED
WORKTREE: 시작 clean, HEAD 90fc52b63099f537a7be319eef6b0db449afdad4. 83b1711 이후 인계 기록 4개만 변경. 검수 종료에는 공통 기록 4개 수정 + reviews/turn06.md 신규만 tracked/untracked 변경; 제품·기존 테스트·설계 불변. ignored 검증 artifacts 갱신.
LAST VERIFIED COMMIT: 90fc52b63099f537a7be319eef6b0db449afdad4 (검사 기준, 승인 아님); 제품 83b1711ae13a63fba6cb38eaf6cb5162c12bc7ec.
FILES CHANGED: docs/loop/reviews/turn06.md, STATE.md, HANDOFF.md, LOG.md, ISSUES.md.
EVIDENCE: npm run test:unit 53 PASS/0 FAIL/0 SKIP exit 0; test:e2e 8/0/0 exit 0; test:all 53 unit+8 Chromium E2E/0 FAIL/0 SKIP exit 0. 별도 real Chromium probe 5조건 FAIL(4결함). output/playwright/turn06/ logs/screenshots 및 turn06.md.
OPEN ISSUES:
- QA06-001 HIGH: checkbox props.value가 content attribute를 바꾸지만 committed attrs와 불일치. 같은 VNode 두 번째 render에서 External DOM change.
- QA06-002 HIGH: 동일 name radio가 두 host 사이에서 서로 해제. 최초 복제 때 actual 변경, Patch 성공 후 actual=true/edit=false.
- QA06-003 HIGH: duplicate id/for 때문에 테스트 label click이 실제 영역 checkbox를 변경.
- QA06-004 MEDIUM: Inspector 기본 h3에 id=edit-text를 설정하면 후속 텍스트 변경이 Invalid text로 실패.
NEXT ALLOWED ACTION: Sol이 STATE를 REVIEW_REWORK로 갱신하고 위 4건을 수정·회귀 검증한 뒤 Astra 동일 TURN 06에 재인계. 먼저 reviews/turn06.md의 재현/수정 방향/추가 테스트를 읽을 것.
DO NOT: TURN 07 시작/06 자기 승인/필수 radio·id·for 범위 축소/외부 변경 검증 제거/managed DOM 재채택/전체 innerHTML 교체/테스트 약화/동시 수정/원격 작업 금지.

## 수정 순서 및 재검수
1. reflected value와 type 전환의 canonical attrs/props 계약을 유지하는 수정 + 반복 render/외부 mutation 회귀.
2. 두 host의 radio form ownership 및 id/for 연결 격리. form 격리만으로 label의 문서 전역 ID 문제가 해결된다고 가정하지 말 것.
3. Inspector control 조회를 사용자 DOM과 분리.
4. 새 실패 회귀를 먼저 확보하고 수정 후 기존 53+8 및 신규 unit/Chromium E2E, History/focus/두 영역 preflight·lock을 실행.
5. 계약 변화가 필요하면 영향·대안·추가 테스트를 기록해 Astra 검토 없이 대규모 변경하지 말 것.
6. 수정 SHA/명령/exit/pass/fail/skip/trace를 인계하고 STOP. revision_count=0은 아직 첫 재작업 전이며 하네스 QA 재작업 2회 한도를 유지한다.

기존 oracle의 속성 순서 무시 수정은 원본 5개 error-context 및 현재 독립 구조/live-prop assertion 대조상 타당하다. 하지만 위 폼/ID 경계는 미포함이다.
미검증: Firefox/WebKit, Phase 2, clean reinstall. 이번 반려는 실행 불가가 아니라 실제 결함 때문.
검수용 CLI browser 및 dev 서버는 종료했다. 기존 turn05 보고서는 turn06/prior-playwright-report 및 prior-test-results에 보존했다.
