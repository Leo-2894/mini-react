# [HANDOFF — 2026-11-08 20:47:13 Asia/Seoul — TURN12 최종 독립 승인]
FROM: Sol 6.1 / HIGH — 독립 검수 세션
TO: User — 로컬 제출 자료 확인
STATUS: PASS / APPROVED / COMPLETE
PROJECT COMPLETE / SUBMISSION READY: true / true
NEXT: 추가 개발 TURN 없음. 로컬 검수 완료 후 STOP.

검수 담당: Sol 6.1 / HIGH — 독립 검수 세션.
검사 HEAD885d8ea1d7ff2d9560c1cf4e73eff77205339bfa, 제품e513ba404d00cfbf3602afe240276efa2920905e, 최소 privacy 수정129b884.
QA12-001 독립 RESOLVED: %2F/%2f 원본 UI 저장/이름/Reuse [redacted], Send 차단, 민감 draft 미복원.
Phase1·Phase2·API Studio **구현됨/독립 검증 완료**, QA06-001~005 현재 회귀 통과.
제품21TS/JS사본0, 브라우저 compiled JS, Node dev/build/test/fixture, 별도 제품backend 없음.
typecheck/build/unit161/E2E62/test:all 각각 exit0; FAIL0/SKIP0, 정규 고유223개. dev 초기 자동build 및 두 페이지 확인 후 종료.
독립 HTTP22/0·runtime10/0·projection10/0·TS/native/privacy9/0, privacy UI2/0 및 deterministic 모바일/왕복/늦은응답 흐름 정상.
strict·버전·serving21개 bytes 및 실패/symlink 경계 검증. 증거 output/playwright/turn12-rereview1/ 및 reviews/turn12.md 추가 보고.
기존 보고·증거 보존; 제품/정규시험 수정 없음. revision_count=1/2, active_rework_round=1 (TURN12 첫 완료 재검수, 구현시도3회/TURN06과 별도).
최종 PASS / APPROVED, project_complete=true, submission_ready=true (로컬 검수 범위). CRITICAL/HIGH0, 필수 미검증 없음.
미검증: clean dependency reinstall/Firefox·WebKit/실제 스크린리더/외부 운영API/예외 자연빈도. watch·모든 비밀탐지·전체 수신메모리 한계 등 문서 지원 경계 유지.
승인은 검사HEAD 제품에 한정하며 이후 코드변경으로 자동 승계하지 않는다. 브라우저·수동서버 종료. 원격 push/PR/배포 없음.
종료 검수문서5개만 미커밋, HEAD 유지. 다음 담당 사용자/로컬 제출 확인, 구현 추가작업 없음. STOP.

---
## 이전 인계 원문 (역사 기록)
# [HANDOFF — 2026-11-08 20:09 Asia/Seoul — 동일 TURN12 독립 재검수 요청]
FROM: Sol — 구현 세션
TO: Sol 6.1 / HIGH — 별도 독립 검수 세션
STATUS: Sol 구현 자체 PASS / AWAITING_INDEPENDENT_REVIEW
INDEPENDENT STATUS: 기존 REJECTED 유지, QA12-001 독립 해결 미승인
CODE SHA: e513ba404d00cfbf3602afe240276efa2920905e
FINAL HEAD: 아래 docs-only 인계 commit. handoff-receipt.json 및 git rev-parse HEAD로 전체 SHA 대조.
WORKTREE: 공통 기록4개를 docs-only commit하고 최종 clean 여부를 receipt에 기록한다.
NEXT: 동일TURN12의 추가 독립 재검수(결함+전체TS/build/serving 변경 포함). 구현 세션은 여기서 STOP.

## TURN12 REVIEW_REWORK 1 — Sol 구현 수정 완료 / 독립 재검수 대기
시각: 2026-11-08 20:09 Asia/Seoul. 자체 검증 PASS이며 독립 판정 REJECTED는 유지한다.
- 사용자 승인: 첨부된 “최종 수정 및 TypeScript 전환”은 QA12-001 수정과 제품 src 전체 TS 전환을 명시 승인한다. 기존 JavaScript 통일 계약의 언어/도구 항목만 변경한다. 별도 엔진/프레임워크/제품 backend를 추가하지 않았다.
- 검수 원문 보존 commit: c4ff3bdab0cdf655ddb5be1db981f6b6e8b7122d. QA12-001 최소 수정 commit: 129b8845fde62fa03c679a061154d758f389e2bc. 최종 제품/언어·빌드 수정 CODE SHA: e513ba404d00cfbf3602afe240276efa2920905e.
- 최종 인계 HEAD는 이 기록을 포함한 docs-only commit이며 전체 SHA와 실제 clean 여부는 output/playwright/turn12-rework1/handoff-receipt.json 및 최종 응답에서 확인한다. 제품 SHA 뒤 추가 코드 변경 없음.
- current_turn=12, active_rework_round=1, revision_count=0/2 유지. Sol 완료는 완료된 독립 재검수 횟수에 포함하지 않는다. 다음 담당 Sol 6.1 / HIGH 별도 독립 검수 세션. 자기 독립 승인/다른 세션 자동 실행/원격 작업 없음.

### QA12-001 실패 → 성공
- src/api/history.ts: raw slash 경계를 먼저 나눈 뒤 각 segment decode, 긴 토큰 문자집합에 decoded slash 추가. 일반 경로 유지/민감 이름 뒤 값 정제/query/hash/userinfo 제거 유지.
- tests/unit/privacy12.test.js: 신규8개. 수정 전 red-unit.log 6PASS/2FAIL/0SKIP exit1 (%2F/%2f). 최소 수정 후 green-unit-js.log 8PASS/0FAIL/0SKIP exit0.
- tests/e2e/privacy12.spec.js: 신규2개. red-e2e.log 0PASS/2FAIL/0SKIP exit1 → green-e2e-js.log 2PASS/0FAIL/0SKIP exit0. History 저장 URL·Recent requests 접근성 이름·Reuse draft·Send disabled·원문 부재를 literal로 확인.
- 최소 JS 수정 뒤 동일 동작을 TS로 보존했고 최종 전체 시험에서 재확인. 기존 red trace/screenshot과 이전 보고서 보존.
- 상태: QA12-001 HIGH — Sol 수정 완료 / 독립 재검수 대기. 구현 세션에서 독립 RESOLVED로 바꾸지 않는다.

### TypeScript 전환 및 오류 경계
- src의 기존19개 JS 모듈→TS, mini-react/types.ts와 api/types.ts 공통 타입2개 추가(총21). 수동관리 제품 JS 사본0. strict=true, noEmitOnError=true, any 타입/ts-ignore/ts-nocheck 없음.
- VNode/Tree·Ref/Operation/PatchPlan·renderer/scope·Hook slot/queue/cleanup·요청 draft/snapshot·응답 결과·History·컴포넌트 props/DOM 이벤트를 구분했다. 외부 VNode/DOM/JSON 경계는 unknown과 실제 검증을 사용한다.
- 국소 단언은 clone의 입력/출력 generic, 내부 Hook의 kind/슬롯 상관관계와 generic cache, 기본 props뿐이다. literal narrowing용 as const도 사용한다. React 전체 타입 호환성을 주장하지 않는다.
- TypeScript 7.0.2 정확 버전 devDependency/lock 고정. Node v24.22.1/npm11.19.1. Node는 정적 개발 서버/빌드/시험/fixture에 사용, 제품 API backend 별도 없음. 브라우저 Fetch/CORS 계약 불변.
- tsconfig와 scripts/build.js: ES module tsc 출력 dist/src/*.js, HTML/CSS/SVG도 dist에 복사. root/dist 절대경로·직속경로·symlink 확인 후 명시된 생성물만 삭제. noEmitOnError로 실패 시 stale 출력 유지하지 않는다.
- dev는 초기 자동 build 후 기존 /,/phase1/,/src/...js 경로를 dist에서 서빙. E2E webServer가 dev를 자체 시작해 최신 build. /src/main.ts는404. source watch 없음(수정 후 build+reload).
- unit 기존13파일의 변경은 .js→.ts import뿐. 기존 E2E파일/기대값/HTML/CSS 불변. build E2E는 모든 TS source SHA256 및 compiler version, JS MIME, TS404, 두 페이지를 검사.
- 자체 리뷰: annotation 첫 strict 검사3diagnostic(App event, lazy initializer, Inspector child 타입)은 typecheck-annotation.log exit1→typecheck-green.log exit0으로 해결.
- 추가 동작 보존 회귀 tests/unit/typescript.test.js: projection 대상이 Text일 때 element 쓰기를 조용히 건너뛰던 TS guard를 red-projection-type.log 0PASS/1FAIL exit1로 확보, scope.ts의 명시적 오류 거부 복원 후 green-projection-type.log 1PASS/0FAIL exit0. DOM 불변도 확인. 마지막 코드 변경 후 모든 필수 명령 재실행.
- 구현 처리 단계3개 기록: privacy 최소 수정 / TS 초기 검사 진단 수정 / 자체 리뷰 projection guard 복원. 반복 추측 수정/테스트 삭제·skip·기대값 완화 없음.

### 최종 실행 (PASS/FAIL/SKIP)
증거 base: output/playwright/turn12-rework1/
| 명령 | exit | PASS | FAIL | SKIP | 증거 |
|---|---:|---|---:|---:|---|
| npm run typecheck | 0 | strict 검사 | 0 | 0 | typecheck-green.log |
| npm run build | 0 | TS21 + 자산 | 0 | 0 | build-green.log |
| npm run test:unit | 0 | 161 unit (14 files) | 0 | 0 | test-unit.log |
| npm run test:e2e | 0 | 62 Chromium | 0 | 0 | test-e2e.log |
| npm run test:all | 0 | typecheck/build + 161 unit + 62 Chromium | 0 | 0 | test-all.log |

- 고유223개 = 기존211 + privacy unit8/E2E2 + projection unit1/build E2E1. 반복 실행·CLI 확인은 합산하지 않는다. final-command-results.json은 개별 종료 코드를 기록한다.
- npm run dev도 초기 build와 두 페이지 실행을 직접 확인. 장기 서버를 Ctrl+C로 정상 정리하여 종료코드1; dev를 종료코드0 시험으로 보고하지 않는다.
- Playwright Skill 실제 읽고 CLI sol-ts12 사용: fake encoded URL Send200→History [redacted]→Reuse [redacted]/disabled true, DOM Lab text edit→Patch 양 영역 일치→Undo 양 영역 복구. cli-*.log. CLI close 및 수동 dev/fixture 종료 후 E2E 자체 서버와 충돌 없이 최종 실행.
- QA06-001~005, native label/AX, logical/physical round trip, projection 실패 잠금과 read-only preflight 비잠금, History/참조/listener/focus/caret, Hooks batch/effect/memo/실패 보존, 실제HTTP5/CORS/timeout/cancel/late, 모바일/행/왕복/정상오류없음의 기존 회귀 통과.
- final-source-audit.json: 기존 증거/검수 보고/지침428개 SHA256 일치, 기존 unit import만 변경, 기존 E2E/HTML/CSS 불변, dist 자산 hash 일치. 처음 lexical any 검색은 영문 주석의 단어(any)만 오탐; 원본 감사 결과도 source-audit-comment-false-positive.json에 보존하고 실제 any 타입0 확인.
- prior/red/green/pre-projection/e2e/final 보고서·test-results를 구분 보존. 기존 TURN06~12 증거/독립 보고 원문은 수정하지 않았다.

### 독립 재검수 요청 및 한계
- 동일 TURN12에서 QA12-001 red→green을 독립 재현하고 TS 소스 전환·strict·빌드 삭제 경계·dev/E2E 자동 build·unit TS/브라우저 최신 JS 연결·두 페이지·기존 전체 계약을 검수한다. 기존 JS/과거 SHA 승인으로 새 코드 전체를 승인하지 않는다.
- 미검증: clean dependency reinstall, Firefox/WebKit, 실제 스크린리더 운용, 실제 외부 API 가용성/CORS, 예외 주입의 자연 발생 빈도. 임의 비밀 전체 탐지/응답 전체 수신 메모리 제한/자동 watch를 보장하지 않는다.
- 새로운 자체 확인 미해결 결함 없음. 독립 재검수 미실시이므로 최종 제품 승인·제출 준비는 false. 다음 허용 작업은 사용자가 시작하는 별도 Sol 6.1/HIGH 동일TURN12 재검수. 인계 후 STOP.

---
## 직전 독립 검수 인계 원문 (역사 기록)
# [HANDOFF — 2026-11-08 — TURN 12 최종 독립 검수]
FROM: Sol 6.1 / HIGH — 최종 독립 검수 세션
TO: Sol — 구현 세션
CURRENT TURN: 12
STATUS: REJECTED / REVIEW_REWORK 대기
REVIEW HEAD: eb368fdc7a32cd79a382a0726af9fd0c5b53ab43
PRODUCT CODE: 9c53b3a6f668e54e90c2702be301c12561c1a858
WORKTREE: 시작 clean; 종료 turn12 신규 보고 + STATE/HANDOFF/LOG/ISSUES 4개만 변경. 제품/정규시험/TURN06 보고 불변. 검수 문서 미커밋 상태를 보존할 것.
EVIDENCE: 독립 unit152/0/0 exit0, Chromium59/0/0 exit0, all152+59/0/0 exit0. output/playwright/turn12/.
OPEN ISSUE: QA12-001 HIGH — encoded slash를 포함한 긴 base64 경로 토큰 History 누락.
NEXT ALLOWED ACTION: 동일 TURN12의 구현 REVIEW_REWORK → 독립 재검수 인계. 프로젝트 최종 제출/배포 승인 없음.
REVISION: TURN12 최초 검수, revision_count=0/2. 기존 TURN06 횟수와 별도. Sol 수정 완료만으로 완료 재검수 횟수를 올리지 않는다.
DO NOT: 자기 독립 승인/전체 엔진 재작성/기존 실패 증거 삭제/원격 push·PR·배포/다른 세션 자동 실행.

QA12-001 재현:
1. 제품 /에서 GET http://127.0.0.1:4174/session/abcdefghijklmnopqrstuvwx%2Fabc?secret=fake-query 전송.
2. Recent requests가 .../session/[redacted]가 아니라 원문 %2F 포함 토큰을 저장/표시함.
3. Reuse 후 URL 그대로, Send enabled=true. 기대는 정제 URL/수정 전 Send 차단.
28자 canonical base64임을 btoa(atob(token))===token으로 확인했고 %2F는 한 raw segment 안에 있음.
원인 src/api/history.js:8~11: decode 후 long-token regex가 slash를 포함하지 않아 false. 이미 지원하는 긴 base64형 변형의 누락이며 모든 임의 비밀 탐지 확대 요구가 아님.
최소 수정: segment 경계를 유지하면서 decode된 표준 base64 slash 변형도 정제. unit literal + UI 저장/Reuse/차단 red→green, 기존 JWT/plus/normal path 회귀 유지. 기존 211개와 세 명령 각각 검증.
증거 independent-http.log(21/1), privacy-ui.log, base64-classification.log. 상세 재현/판정 docs/loop/reviews/turn12.md.

통과: runtime 독립10/0, Phase1 projection 재실행10/0, 실제HTTP5/CORS/timeout/cancel, 취소 무시 transport→최신 응답, 모바일/두 페이지/행=== 정상. 언어 audit: 제품19개JS, TypeScript NO, Node YES(dev/static/tests/fixture), Node24.22.1/npm11.19.1, 제품 API backend 없음.
기존 정상 회귀로 해결된 부분은 보존하고 QA12-001에 집중. 제품은 이번 검수에서 수정하지 않았음.
미검증 clean install/Firefox/WebKit/실제스크린리더/운영외부API/예외빈도. 브라우저/수동 서버 전부 종료. screenshot 마지막, 제품 외부변경 검사 완화 없음.
프로젝트 최종 완료·제출 준비 미승인. 별도 구현 세션 인계 후 STOP.

---
## 이전 구현 인계 원문 (역사 기록)

# [HANDOFF — 2026-11-08 16:25 Asia/Seoul — TURN 11 완료]
FROM: Sol — 구현 세션
TO: Sol 6.1 / HIGH — 별도 독립 검수 세션
CURRENT TURN: 11 완료 / NEXT TURN: 12 미착수
STATUS: 구현 자체 PASS / AWAITING_INDEPENDENT_REVIEW
PRODUCT CODE / LAST VERIFIED COMMIT: 9c53b3a6f668e54e90c2702be301c12561c1a858
FINAL HANDOFF HEAD: 이 문서를 포함한 docs-only 인계 commit. 실제 전체 SHA/clean 상태는 output/playwright/turn11/handoff-receipt.json 및 구현 세션 최종 응답, git rev-parse HEAD로 대조.
WORKTREE: 코드 commit 뒤 공통기록4개만 docs-only commit 후 clean 확인. 원격/세션 자동실행 없음.
INDEPENDENT APPROVAL: TURN06 d7ec63024c24571caa22080dd345fc2afd97470a / 당시 제품 ff2a689162c2d6129749f400810846fbee50e736만 APPROVED. 이후 코드 전체/Phase2 최종 승인 아님.
NEXT ALLOWED ACTION: 사용자가 별도 독립 세션에서 TURN12를 시작. 실제 Git/문서/코드/시험을 대조하고 최종 APPROVED 또는 REJECTED 판정 → 기록 → STOP.
DO NOT: 구현 세션 자체 독립승인, TURN12 대리수행, 다른 세션 자동실행, 기존 보고/증거 덮어쓰기, push/PR/배포.

## 이번 구현 범위와 코드 checkpoint

| TURN | 코드 | 실제 자체 게이트 |
|---|---|---|
| 07 | aade8bd | FunctionComponent/루트useState, 102unit+35Chromium |
| 08 | 6dab819 | effect/memo/cleanup/실패cache, 118+36 |
| 09 | 16f3f9d | Fetch/URL/header/body/response/정제History, 144+36 |
| 10 | 4143dec | App/순수자식/JSON/반응형/실제HTTP·CORS, 148+53 |
| 11 | 9c53b3a | 최종privacy/통합/두페이지/README·구현설명, 152+59 |

각 단계는 unit/e2e/all 각각 exit0/FAIL0/SKIP0 후 다음 단계 진행. 단계별 수치나 재실행을 합산하지 않으며 현재 고유211개다.
주요 파일: src/mini-react/component.js/hooks.js/vnode.js, src/api/request.js/response.js/history.js, src/App.js/main.js/components/panels.js/styles.css, index.html, tests/unit/component/hooks/api/viewer/integration 및 tests/e2e/component/hooks/studio/integration, tests/fixtures/server.js, playwright.config.js, scripts/server.js, README/docs/implementation.md.
TURN11 제품 수정은 phase1/index.html의 복귀/표시와 api/history.js 긴토큰 정제에 제한. 기존 timeout 시험은60ms/200ms 대조 후 기본30초로 복구하는 결정성 보강. 기존 Phase1 시험/expectation 삭제·skip·완화 없음.

## 최종 실제 명령과 증거

기준 output/playwright/turn11/:

| 명령 | exit | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 152 / 12 files | 0 | 0 |
| npm run test:e2e | 0 | 59 Chromium | 0 | 0 |
| npm run test:all | 0 | 152 unit +59 Chromium | 0 | 0 |

test-unit.log/test-e2e.log/test-all.log, results.json, final-test-results/, final-playwright-report/.
동일 조건의 반복 시험은 고유 수에 합산하지 않는다. TURN07~10 증거도 각 turn 디렉터리에 보존.
최초 TURN11 전체151+59 통과 뒤 privacy 반례를 추가했다. 이전 로그·reports는 pre-privacy-* 보존, 최종 결과는152+59다.

## 실패 → 수정 및 자체 리뷰
- TURN07 슬롯 종류 손상이 no-op 필터에 가려지는 guard: 신규16/1→17/0, queue 종류 검사. TURN08 신규16unit 첫 통과.
- TURN09 정제한 값 다음 정상경로 과잉 정제:24/1→26/0(깊은JSON fallback 포함). 보조UTF8 스크립트 오류는 제품과 구분해 기록.
- TURN10 최초 / 페이지404: GET1FAIL 후 진단중단→server root 자체 허용, 경계유지. 모바일 History숨김/긴scalar 안내: CLI none→flex 및unit3/1→4/0. 구현시도3 내 최종 gate통과.
- TURN11 SOL-011-01 DOM Lab 복귀: red-navigation 0/1 exit1→수정 후6E2E PASS. 원본 screenshot/trace 보존.
- TURN11 SOL-011-02 긴 JWT/base64 경로 정제: red-token-path 3/1 exit1→green-token-path4/0 exit0. 가짜 토큰으로 재현, metadata 문자집합만 최소 보완. 기존 privacy 계약 구현 누락 수정이며 독립 해결 승인 아님.
- 최종 source-audit.py/json: App→component→동일renderer→diff/patch/dom, 자식Hook/직접DOM우회/런타임의존성/시험skip·only 없음. 기존 승인·설계·원본시험·과거증거287개 hash 유지, 기존 vnode 함수자식 Hook경계 확장만 예상 변경. architecture/reviews/turn06.md 원문 불변.
- R01~R05의 상태/queue/노드/초기화/Hook규칙/cleanup/실패memo 보존, QA06-001~005 포함 Phase1 회귀 PASS.
- 실제 HTTP5 methods/query/header/body,400/500/204/invalidJSON/text/HTML문자열,4174허용CORS/4175미허용,timeout/retry/Cancel/unmount/slowA→fastB PASS.
- 취소신호를 무시하는 fetch에서도 늦은결과/History오염 없음, 실제UI22회→20개/reload제거,redacted URL 차단,동적행Node/caret/모바일History/keyboard PASS.
- 수동 CLI open→snapshot→Send→JSON확장→snapshot, desktop/mobile 이미지 시각확인(TURN10). screenshot 마지막 또는reload뒤 후속검증. 서버/브라우저 종료. 최종 E2E는 자체 서버만 사용.

## 계약·한계·독립 검수 초점
공개 승인 계약 변경 없음. 인스턴스 state/루트Hook/순수자식 및 같은 Diff/Patch 경로 유지. metadata heuristic은24자 영숫자/_+=.-의 JWT/base64형을 포함하지만 모든 임의 비밀 탐지는 보장하지 않는다.
HTTP body표시100000자/JSON트리200개8단계, 전체 수신 메모리 제한 없음. 원자rollback/전체React/Fiber/모든조건부Hook탐지 보장 없음. failed render와 post-commit effect/부분DOM 오류를 구분해 docs/implementation.md 및 README에 설명했다.
미검증 Firefox/WebKit·실제스크린리더·clean reinstall·실제외부API가용성/CORS·예외자연발생빈도.
독립 TURN12는 구현 보고를 정답으로 삼지 말고 R/A 경계와 개인정보/race/오류/엔진재사용을 직접 확인할 것. 검수 담당은 사용자 변경에 따라 Sol6.1HIGH 별도 세션이며 기존 Astra 보고의 모델명 때문에 승인무효로 처리하지 않는다.
TURN06 한도 이력(이전주기완료2,새주기완료1/2,전체재작업3)은 보존. TURN12 revision_count=0은 새 마일스톤 미착수이며 과거 한도를 삭제하거나 추가재작업을 자체 허용한 것이 아니다.
필수검증 실행 가능했으며 TEST_BLOCKED 없음. 구현은 인계 후 STOP.

---
## 이전 인계 원문 보존

# TURN 10 — 자체 PASS / 다음 TURN 11
CODE: 4143dec271011fb10f4b2a30c24b6235f4a3248b
SCOPE: App 루트 Hooks+순수 Request/Response/Sidebar/JSON, 실제 Fetch/취소/이력/반응형 UI.
EVIDENCE: unit148/0/0, Chromium53/0/0, all148+53/0/0 각각 exit0. 고유201. output/playwright/turn10/final-test-*.log.
ISSUES: root404/모바일 History/긴scalar 안내 수정 완료, 실패 증거 보존. 구현 시도3, gate 통과.
NEXT: 구현 Sol TURN11 최종 회귀·설명 문서·자체 검토 후 별도 독립 TURN12로 인계 STOP.

---
## 이전 기록 보존

# TURN 09 — 자체 PASS / 다음 TURN 10
CODE: 16f3f9d79282beb2f355c76c9ed6f9b97d64b5b6
FILES: src/api/request.js/response.js/history.js, tests/unit/api.test.js, README, 공통기록.
EVIDENCE: test:unit144/0/0, test:e2e36/0/0 Chromium, test:all144+36/0/0 모두 exit0. 고유180. output/playwright/turn09/.
BOUNDARY: Mock Fetch 단위 완료; 실제 HTTP/CORS와 UI/race는 TURN10 검증 대상. privacy는 metadata heuristic이며 모든 비밀 탐지를 주장하지 않는다.
NEXT: 구현 Sol TURN10 API Studio App/순수 자식/JSON Viewer/실제 loopback E2E.

---
## 이전 기록 보존

# TURN 08 — 자체 PASS / 다음 TURN 09
CODE: 6dab819e4b03ed9eb953e84cafded084b81b0d3f
FILES: hooks.js/component.js, 신규 tests/unit/hooks.test.js 및 tests/e2e/hooks.spec.js, README, 공통 기록.
EVIDENCE: 필수3명령 exit0; unit118/0/0, Chromium36/0/0, all118+36/0/0. 고유154. output/playwright/turn08/.
OPEN: 신규 확정 결함 없음. effect 오류는 post-commit 오류이며 rollback 없음; README 한계 명시.
NEXT: 구현 Sol TURN09 Fetch/request/response/정제 History A01/A02. TURN12 독립 검수는 별도 세션.

---
## 이전 기록 보존

# TURN 07 — Sol 자체 완료 / 다음 TURN 08
CODE: aade8bd0a37b8ad6bf8ff691394d74de526e105e
STATUS: PASS (구현 자체 검증), TURN06 별도 독립 APPROVED 원문 보존.
FILES: src/mini-react/component.js/hooks.js/vnode.js, tests/unit/component.test.js, tests/e2e/component.spec.js, README 및 공통 기록4개.
EVIDENCE: unit102/0/0, Chromium35/0/0, all102+35/0/0 모두 exit0. 고유137, output/playwright/turn07/.
BOUNDARY: 같은 renderer/Diff/Patch, 루트 전용 상태/순수 자식, committed hooks 오류 보존. 계약 변경 없음.
NEXT: 구현 Sol TURN08 useEffect/useMemo R03~R05. TURN11 뒤 별도 독립 TURN12 인계 후 STOP.

---
## 이전 인계 원문 보존

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
