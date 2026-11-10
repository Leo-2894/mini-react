# [TURN 12 — FINAL INDEPENDENT REVIEW REPORT]
DATE: 2026-11-08 (Asia/Seoul)
REVIEWER: **Sol 6.1 / HIGH — 최종 독립 검수 세션**
STATUS: **REJECTED / 최종 제출 승인 보류**
PRODUCT SHA: 9c53b3a6f668e54e90c2702be301c12561c1a858
HANDOFF / REVIEW HEAD: eb368fdc7a32cd79a382a0726af9fd0c5b53ab43
NEXT: Sol 구현 세션 / 동일 TURN 12 REVIEW_REWORK / QA12-001
REVISION_COUNT: 0 (TURN 12 최초 검수; 수정→재검수 완료 횟수 아님)
ARCHITECTURE CHANGES: 없음
PROJECT COMPLETE / SUBMISSION READY: NO

## 1. 종합 판정
**REJECTED. HIGH 1건 QA12-001이 남아 최종 승인하지 않는다.**
정규 unit 152개와 Chromium E2E 59개는 세 필수 명령에서 직접 재실행하여 모두 통과했다. 별도 반례에서 URL 인코딩된 slash가 포함된 긴 base64 토큰이 History metadata에 남고, UI에 표시되며 재사용/전송까지 허용되는 개인정보 결함을 재현했다. 현재 결과를 제출 준비 완료나 포트폴리오 최종 적합으로 승인할 수 없다.

시작 cwd/Git root 일치, 인계 HEAD 일치, status clean. 9c53b3a→eb368fd는 공통 기록 4개뿐이며 제품/시험 변경 없음. 기존 TURN06 승인 원문을 보존하고 해당 당시 SHA의 승인을 현재 전체 제품 승인으로 확대하지 않았다. 최신 사용자 지시로 독립 검수 모델 변경을 적용했으며 구현 세션 자기평가를 승인 근거로 사용하지 않았다.

## 2. 실제 언어·TypeScript·Node.js 확인
| 확인 항목 | 실제 판정 | 근거 |
|---|---|---|
| 제품 구현 언어 | HTML/CSS + Vanilla JavaScript | src/의 제품 실행 파일 19개 모두 .js, type=module, 두 HTML script 진입점 |
| TypeScript 실제 사용 | NO — 제품·정규 테스트·설정의 TS/TSX/JSX 소스 및 tsconfig 없음 | tracked 파일 조사, package scripts에 tsc/TS 빌드 없음. 외부 .d.ts는 제품 소스가 아님 |
| Node.js 실제 사용 | YES — 정적 개발 서버와 시험 실행·HTTP/CORS fixture | npm dev→node scripts/server.js, Vitest/Playwright, node tests/fixtures/server.js |
| Node.js / npm 버전 | v24.22.1 / 11.19.1 | 실제 node --version / npm --version |
| 프런트엔드 실행 환경 | 브라우저 native ES modules | index.html→src/main.js→App→FunctionComponent→renderer; phase1/index.html→phase1/main→controller→동일 renderer |
| 제품 API 백엔드 | 별도 구현 없음 | 4174/4175 echo·CORS는 테스트 전용. 4173은 정적 파일 서버이며 제품의 REST API 백엔드가 아님 |

제품 실행에 TypeScript 컴파일 또는 번들 빌드 명령은 없다. lockfile의 Vite optional peer tsx(^4.8.1)와 @types/node 같은 도구 의존성은 제품 TypeScript 사용 근거가 아니다. Vitest 내부 도구의 변환 경로와 제품 빌드를 구분한다. runtime dependencies는 없고 devDependencies는 Playwright CLI/Test, jsdom, Vitest뿐이다.
증거 language-audit.json, package.json/lockfile, scripts/server.js, tests/fixtures/server.js 및 실제 import 검색. 언어 계약과 일치하며 임의 언어 전환 없음.

## 3. 요구사항 검증 지도
| 범위 | 실제 확인 | 결과 |
|---|---|---|
| D01/D02/F01/F02/P01~P05 | 기존 전체 unit/Phase1 E2E, 공유 엔진 source diff, Node/listener/caret/no-op/stale/foreign/replay | 검증 범위 통과 |
| H01~H04 / QA06-001~005 | Phase1 정규 회귀, 독립 실제 edit DOM Patch/Undo, QA06 projection/preparation/read-only 10조건 현재 코드 재실행 | 통과 |
| R01/R02 | unit/component + browser/component, 독립 queue 순서·2슬롯 대신 상태/props 배치·안정 setter·lazy·자식/Node/focus·remount·실패 UI 보존 | 통과 |
| R03~R05 | hooks unit/E2E, deps 생략/[]/길이/NaN/-0·복사·Promise 오류·cleanup 예외·memo·loop; 독립 cleanup 전체→setup 전체/실패 cache/50회 | 통과 |
| A01/A02/A03 HTTP | API unit 및 실제 HTTP5 methods, duplicate query/인코딩/header/body/4xx/5xx/204/JSON/text/timeout/Cancel/CORS | 통과 |
| A04 최신 job | 정규 slowA→B/Cancel/unmount 및 abort 무시 대조; 독립 수동 resolve transport Cancel→새 요청→늦은 응답 | 통과 |
| A05 개인정보 | header masking/query·hash·userinfo/raw body/header/snapshot 제외,20개/재사용/Clear/reload; 긴 JWT/+ base64 대조 정상 | 부분 충족: encoded slash base64 누락(QA12-001) |
| A05 UI | tabs/행/JSON tree/Raw/headers/100k 안내/키보드/모바일 정규 E2E, 독립 행 ===/왕복/모바일 전송·History | 통과 |
| A06 구현 제약 | App 루트만 Hook, props 전용 panels, 기존 renderer/Diff/Patch, runtime dependency 없음 | 통과 |
| 문서·제출 | README/implementation 실행·한계·fixture·시연 설명 실제 경로 대조 | 실행 가능. privacy 결함 해결 전 최종 제출 보류 |

위 지도는 실제 정규 시험과 선별 독립 반례의 결합이며 가능한 모든 브라우저/HTML/비밀 형식의 완전 검증을 주장하지 않는다.

## 4. 발견 결함
### QA12-001 — HIGH / OPEN — encoded slash를 포함한 긴 base64 경로 토큰이 History에 잔존
- 검사 SHA: 9c53b3a6f668e54e90c2702be301c12561c1a858.
- 위치: src/api/history.js:7~11 (특히 decodeURIComponent 뒤 line9의 긴 토큰 패턴), historyEntry:16~17. App.js의 완료 이력 저장과 Sidebar 재사용에 전파.
- 입력: 가짜 토큰 abcdefghijklmnopqrstuvwx/abc (28자). btoa(atob(token))===token인 canonical base64임을 직접 확인했다. URL에서는 /를 %2F로 인코딩하여 하나의 path segment로 전달한다.
- 실제 URL: http://127.0.0.1:4174/session/abcdefghijklmnopqrstuvwx%2Fabc?secret=fake-query
- 재현:
  1. API Studio /에서 위 URL을 입력하고 GET Send.
  2. Recent requests 및 root.hooks[0].value.history[0].url 확인.
  3. Reuse 버튼 클릭 후 URL과 Send 상태 확인.
- 기대: 긴 base64형 경로 값은 http://127.0.0.1:4174/session/[redacted]로 저장. 토큰이 이력 label/재사용 draft에 남지 않고 수정 전 Send 차단.
- 실제: query는 제거되지만 entry.url과 Reuse accessible label에 .../abcdefghijklmnopqrstuvwx%2Fabc가 그대로 남는다. 재사용 URL도 동일하고 Send enabled=true.
- 원인: path를 /로 split한 뒤 segment를 decode한다. decoded token에는 /가 있지만 /^[a-z0-9_+=.-]{24,}$/ 패턴에 slash가 없어 false. 민감 단어 뒤 값이 아닌 /session/이므로 redactNext도 false여서 원문 segment를 반환한다.
- 근거: architecture의 긴 토큰형 segment 정제 및 이번 요청 C의 긴 JWT/base64형 경로 정제 요구. 임의의 짧은 비밀/모든 비밀 자동 탐지를 새로 요구하는 것이 아니다. 이미 다루는 24자 이상 base64형 값의 유효한 문자·URL 인코딩 변형이다. README에 구현 문자집합을 적은 것만으로 필수 개인정보 게이트를 충족했다고 볼 수 없다.
- 증거: independent-http.log (21 PASS/1 FAIL), privacy-ui.js/log (entry/label/reusedURL/resendEnabled 실제 값), base64-classification.log (28자/canonical=true/한 segment).
- 위험: 메모리 Recent requests에 경로 인증값 등이 잔존하고 UI 표시/재사용된다. 가짜 데이터와 loopback만 사용했으며 실제 비밀 유출/외부 전송은 수행하지 않았다.
- 최소 수정 방향: raw segment 경계를 보존하면서 URL decode 후 표준 base64의 encoded slash를 포함한 긴 토큰 판단을 보완한다. 무조건 모든 URL을 가리거나 정상 경로를 과잉 정제하는 대규모 변경은 불필요하다. decode된 slash를 다시 경로 구분자로 분할해 누락시키지 말 것.
- 회귀 조건: %2F/%2f를 포함한 canonical base64, 기존 JWT/+/_/-/padding 변형, 일반 경로·민감 이름 다음 값·query/hash 제거. unit literal expected와 UI History→Reuse→Send disabled 검증. 기존 211개 유지.
- 현재 제출 승인 차단. 구현 세션에서 실패 회귀를 먼저 확보하고 수정 후 같은 TURN12 독립 재검수 요청.

다른 CRITICAL/HIGH 확정 결함 없음. 기존 QA06-001~005는 현 회귀에서 유지된다.

## 5. 직접 실행한 시험과 증거
| 명령 | exit | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| npm run test:unit | 0 | 152 / 12 files | 0 | 0 |
| npm run test:e2e | 0 | 59 Chromium | 0 | 0 |
| npm run test:all | 0 | 152 unit +59 Chromium | 0 | 0 |

고유 정규 시험 211개. 반복 수치나 독립 진단을 합산하지 않는다. output/playwright/turn12/test-unit.log, test-e2e.log, test-all.log.
기존 report/test-results는 실행 전 prior-*에 복사했다. 새 실패는 정규 시험 실패가 아니라 독립 반례이며 해당 로그에 코드/결과를 함께 보존했다. 따라서 retained-failure trace가 없는 진단을 정규 trace가 있는 것처럼 주장하지 않는다. screenshot mobile-final.png 직접 시각 확인. 기존 TURN06~11 증거 쓰기 없음.

별도 검증:
- independent-runtime.js/log: 10 PASS/0 FAIL. queue literal 2→5→10→13, lazy1/renders2, stable setter/child/input, focus/caret, cleanup 순서, final no-op mutation0, NaN 재계산 횟수, 실패 UI/hooks/memo 보존·명시 retry, remount stale setter/예약 폐기, deps 길이/-0/NaN, child Hook 거부, auto loop50.
- independent-http.js/log: 실제 loopback 5 methods/query/header/body, response X-API-Key masking,409/503/204/invalidJSON/text/large,timeout/Cancel/CORS 및 metadata. 21 PASS/1 FAIL(QA12-001). 실제 HTTP 결과와 Mock Fetch unit을 구별한다.
- independent-phase1-projection.log: 과거 독립 세션이 작성한 probe를 현 제품에서 재실행, projection3/preparation2/read-only5=10 PASS/0 FAIL. 구현 세션 probe 재사용 아님.
- independent-flows-deterministic.js/log: 취소를 무시하는 미완료 transport를 수동 resolve. 새로운 실제 요청 결과와 History1개 유지. 동적 행 Node===, DOM Lab Patch/Undo 및 제품 왕복, 390px fits/History visible/Control+Enter 성공, pageerrors=[].
- privacy-ui.log: fake base64 토큰의 실제 UI 잔존 및 재사용 활성화 FAIL.
첫 보조 흐름의 250ms 응답은 Cancel click 전에 종료되어 locator timeout이 났다(independent-flows.log). 이를 제품 Cancel 실패로 세지 않았고, 명시적 resolve로 재현 순서를 고정한 별도 실행은 통과했다. 처음 긴 UI launcher 호출은 파일/로그를 만들지 않아 실행 증거로 세지 않았고 짧은 privacy probe로 다시 확인했다.
CORS negative 대조와 409/503 요청은 브라우저 network console 오류를 의도적으로 유발했다. stale setter 경고와 loop 오류는 runtime fault probe에서 구분했다. 정상 흐름의 pageerror=[] 및 정규 console 검사 통과와 혼합하지 않았다. screenshot은 기능 시험 마지막에 실행했고 이후 Patch 검증에 도구 mutation을 허용하지 않았다.

## 6. 구조적 평가와 문서·지원 한계
shared engine은 보존됐다. ff2a689 이후 mini-react의 추가는 component/hooks 및 h(Child)의 권한 차단 vnode 확장이며 기존 dom/diff/patch/renderer/scope와 Phase1 controller는 재구현하지 않았다. App만 지속 상태/Hook을 소유하고 panels는 props 전용이다. 키/Ref/불변 계획과 오류 경계, root queue/generation/effect draft 분리는 현재 시험에서 동작한다. 불필요한 전면 리팩터링을 요구하지 않는다.
기존 Phase1 시험 삭제/완화 없음. timeout E2E의 60ms/200ms 실패 대조 후 30초 기본값으로 복구하는 수정은 retry 검증의 결정성 보강이며 실패 assertion을 없애지 않았다.
README와 implementation은 두 페이지/로컬 fixture/세 명령/React 차이/CORS·forbidden headers/metadata 정책/응답 표시 한계를 설명한다. 제품 언어와 Node 사용의 명시 판정은 이번 보고/언어 audit에 기록했다.
원자 rollback, 모든 조건부/custom Hook 위반 탐지, 모든 임의 비밀 탐지, 전체 응답 수신 메모리 한도를 보장하지 않는다는 문서 한계는 유지한다. 이 한계가 QA12-001 같은 요구된 긴 base64 변형을 완료로 만드는 것은 아니다.

미검증: clean dependency reinstall, Firefox/WebKit, 실제 스크린리더, 실제 외부 운영 API 가용성/CORS, 예외의 자연 발생 빈도. 현재 설치 환경의 시험을 clean install 검증으로 기록하지 않았다. 이들은 현 필수 Chromium 계약의 필수 미실행 사유는 아니며 반려 원인은 재현된 QA12-001이다. 필수 명령 실행 불가는 없으므로 TEST_BLOCKED 아님.

## 7. 최종 인계와 제출 상태
TURN12 최초 독립 검수 REJECTED. revision_count=0 유지; TURN06 주기/재검수 횟수와 별도다. 다음 담당은 Sol 구현 세션의 동일 TURN12 REVIEW_REWORK. 수정→재검수 한도2회를 적용하되 최초 검수를 완료 횟수로 세지 않는다.
프로젝트 전체 구현은 있으나 최종 검수·로컬 제출 승인 미완료. 원격 제출/배포 미수행. 반려 상태이므로 승인용 로컬 검수 commit은 만들지 않았다.
시작 clean→종료 신규 turn12.md 및 공통 기록4개만 변경. 제품/기존 시험/설계/README/TURN06 보고 불변, HEAD eb368fd 유지. 자신이 시작한 브라우저·4173 dev 및 4174/4175 fixture 종료. 검수 기록 후 STOP, 다른 세션 자동 실행 없음.

---

# [TURN 12 — FIRST POST-REWORK INDEPENDENT QA REPORT]
REVIEWER: **Sol 6.1 / HIGH — 독립 검수 세션**
STATUS: **PASS / APPROVED**
SCOPE / REVIEW HEAD: 885d8ea1d7ff2d9560c1cf4e73eff77205339bfa
APPROVED PRODUCT SHA: e513ba404d00cfbf3602afe240276efa2920905e
QA12-001 MINIMUM FIX: 129b8845fde62fa03c679a061154d758f389e2bc
REVISION_COUNT: **1/2** (동일 TURN12 첫 수정→독립 재검수 완료)
FILES CHANGED: 이 보고와 STATE/HANDOFF/LOG/ISSUES만. 제품·정규 시험 수정 없음.
ARCHITECTURE CHANGES BY REVIEWER: 없음. 사용자 승인 strict TypeScript 보완 계약을 검증.
COMMIT BY REVIEWER: none. 검사 HEAD 유지, 5개 검수 문서만 미커밋.
NEXT OWNER / NEXT ACTION: 사용자 / 로컬 제출 자료 확인. 개발 TURN 추가 실행 없음.
HANDOFF: 작성 완료. PROJECT COMPLETE / SUBMISSION READY: **true / true** (로컬 검수 범위).

## 1. 종합 판정
**PASS / APPROVED. QA12-001을 독립 RESOLVED로 판정한다. 미해결 CRITICAL/HIGH 0건, 필수 검증 미실행 없음.**
Phase1, Phase2, 실제 API Studio 서비스와 승인된 TypeScript 전환의 필수 게이트를 충족했다. 최초 REJECTED 보고는 위 원문 그대로 보존한다. 당시 JavaScript 언어 판정은 당시 SHA의 역사 기록이며 현재 언어 판정으로 사용하지 않는다.
이번 검수는 구현과 분리된 세션이다. 사용자 지시의 검수 모델 변경 및 TypeScript 전환 승인만 적용했으며 기존 에이전트/하네스를 일괄 변경하지 않았다. 자체 PASS 로그를 복사해 독립 결과로 사용하지 않았다.
시작 실제 cwd/Git root는 C:\Users\Leo\Desktop\API 1이며 HEAD와 clean worktree가 인계 기준과 일치했다. receipt 및 Git 계보를 대조했다. e513ba4→885d8ea는 공통 기록4개뿐이며 이후 제품 변경 없다. 최초 보고는 c4ff3bd의 bytes와 동일함을 확인한 뒤 이번 보고를 append했다. 예상하지 못한 변경/동시 수정 없음.

## 2. 요구사항 충족 상태

| 요구사항 | 판정 | 코드·실행 근거 |
|---|---|---|
| D01~D02 DOM↔VDOM | 충족 | 실제 childNodes/live props 읽기, 최초 source Node 유지; vdom unit/Phase1 E2E 및 독립 native probe |
| F01~F02 순수 Diff | 충족 | 변경별 계획·깊은/복수/keyed/unkeyed·불변 입력의 기존 assertion 보존 및 통과 |
| P01~P05 Patch | 충족 | Node===/no-op 쓰기0/listener 정리/controlled input/caret/사전 거부 회귀; 양 페이지 동일 renderer |
| H01~H04 History/안전 편집 | 충족 | 현재 editor 재독해, Undo/Redo·분기·no-op Redo·50개 한계·독립 snapshot·안전 입력 정규 회귀 |
| R01~R05 Phase2 | **구현됨 / 독립 검증 완료** | component/hooks 직접 검토, unit/Chromium 및 runtime 독립10/0 |
| A01~A02 요청/응답 모델 | 충족 | URL·query/header/JSON 검증과 오류 분류 unit, 실제 HTTP 대조 |
| A03~A05 서비스 상호작용 | **구현됨 / 독립 검증 완료** | 실제5메서드/취소/timeout/CORS/늦은 응답/JSON/이력·재사용/모바일·행·왕복 |
| A06 공유 엔진/금지 런타임/문서 | 충족 | Phase1 controller와 FunctionComponent가 동일 renderer→diff/patch 사용, runtime dependencies 없음; README/implementation 재현 경로 |
| TS 보완 계약 | 충족 | 제품TS21/JS사본0, strict/noEmitOnError, 실제 dist HTTP/bytes, 실패·symlink 격리 probe |

하네스 최종 체크리스트의 필수 항목을 위 코드·단위·실제 Chromium 증거로 대조했다. 테스트 전용 Vitest/jsdom/Playwright/TypeScript와 제품 런타임을 구별한다.

## 3. 결함별 판정과 독립 재현
**QA12-001 / HIGH → 독립 RESOLVED.**
대상 src/api/history.ts의 raw segment 분리 후 decode 및 24자 이상 token 판별. 최소 수정은 decoded slash를 기존 문자집합에 포함한다. decoded slash를 다시 경로 구분자로 나누거나 전체 URL decode로 경계를 잃지 않는다.
UI 재현: %2F/%2f 각각 새 reload 후 가짜 Params/Header/Body를 입력하고 원본 URL을 실제 Send. root History metadata, Recent requests 접근성 이름, Reuse draft와 Send disabled를 검사했다. 기대값은 literal http://127.0.0.1:4174/session/[redacted]이며 production sanitizer로 정답을 만들지 않았다.
실제: 두 사례 모두 저장 URL/접근성 이름/Reuse URL이 [redacted], Send disabled=true, 재사용 Params/Headers=[], Body='', 원문 토큰·민감 query/body/auth 부재. entry는 id/time/method/url/status/elapsed만 보유. UI2PASS/0FAIL, pageerror=[].
JWT/plus/slash/underscore/hyphen/padding, 일반 a%2Fb segment 보존, 민감 이름 뒤 값 정제, query/hash/userinfo 제거도 literal 기대값으로 독립 확인했다. 임의 비밀을 모두 탐지한다고 확대하지 않는다.
증거: independent-privacy-ui.js/.log, independent-http.js/.log, independent-ts-boundaries.js/.log. 신규 privacy unit8/E2E2도 현재 TS/compiled JS에서 통과했다.

**QA06-001~004 / 기존 독립 RESOLVED 유지, 현재 회귀 PASS.**
value/type projection, radio form ownership, native label/AX 이름, Inspector 충돌·IDREF 및 외부 physical mutation 거부의 정규 회귀 통과. 별도 checkbox/radio/text probe에서도 source Node===, label.control===같은 host input, input.labels 자기 label만1, physical ID 분리, logical id/ARIA 보존, Patch/Undo/Redo 후 관계 유지, no-op 쓰기0을 확인했다.

**QA06-005 / 기존 독립 RESOLVED 유지, 원본 오류 경계 재확인.**
compiled JS에서 projection/apply·travel·restoreDraft 첫 for 쓰기 성공 후 id 쓰기 fault를 독립 재주입했다. 실제 부분 mutation, 원본 Error===, locked=true, actual/History/cursor 보존, 주입 제거 후 세 조작 거부를 확인했다. projection 뒤 preview 준비 fault도 보호된다. candidate/초기 preflight 읽기 전용 실패는 쓰기0·비잠금·원인 제거 후 retry 성공. 독립10PASS/0FAIL. 예외 주입을 자연 발생 오류나 실제 데이터 손실로 과장하지 않는다.

**SOL-012-TS-01 / 구현 자체 발견 회귀 — 독립 해결 확인.**
TS element projection 대상이 Text일 때 Expected projected element를 쓰기 전에 던지고 DOM 불변인 것을 별도 브라우저 probe에서도 확인했다.
신규 미해결 결함 없음. 결함 수정을 위한 구현 인계 없음.

## 4. Phase2와 서비스의 실제 동작
FunctionComponent mount/update/updateProps/unmount, 인스턴스별 hooks/queue/index/generation 및 실패 draft commit 경계를 검토했다. App만 state/effect/memo를 소유하고 panels 자식은 props 전용 순수 함수다. h(Child)는 Hook 권한을 차단하며 외부/자식/initializer/updater/memo Hook과 종류/개수 변화는 정규 회귀에서 거부된다.
실제 경로는 setter→ordered queue/microtask→루트 재실행→새 VDOM→기존 renderer.preview/commit→공유 diff/patch다. Phase1 controller도 동일 renderer를 사용한다. 별도 엔진·전체 DOM 재생성·React/Vue/Preact/Hooks 라이브러리 우회 없음.
runtime 독립10/0: lazy1회·setter 안정성, 값/함수 updater 순서와 batching, props update, 자식 Node===/focus/caret, 최종 Object.is no-op 쓰기0, effect cleanup 전체→setup 전체, NaN/-0/길이 deps, memo 및 실패 render의 hooks/cache/UI 보존, 명시 retry, unmount 후 stale setter/예약 무효, child Hook 거부, 자동 effect loop50회 제한.
HTTP 독립22/0: 실제 loopback5메서드/query/header/body, 민감 응답 header 마스킹, 409/503/204/invalid JSON/text/large, 실제 timeout/취소/CORS 및 token metadata.
deterministic UI: 취소 신호를 무시한 늦은 응답이 최신 응답/History를 덮지 않음, 동적 행 Node===, 두 페이지 왕복·실제 편집→Patch→Undo, 390px 모바일 overflow 없음·이력 표시, 키보드 Send, pageerror=[].
JSON 트리 제한/응답 HTML 비실행/이력20개·reload/오류 후 재전송도 정규 E2E 통과. 실패 effect는 post-commit 오류이며 원자 rollback이나 React 전체 호환성을 주장하지 않는다.

## 5. TypeScript·Node·빌드·서빙
제품 src는 기존19모듈+공통 타입2=21 TS이며 수동 관리 제품JS사본0이다. 브라우저는 tsc 생성 JavaScript native ES modules, Node는 정적 개발 서버/빌드/시험/HTTP fixture에 사용한다. 별도 제품 REST API backend는 없으며 브라우저 Fetch가 대상 API에 요청한다.
실제 Node v24.22.1/npm11.19.1/TypeScript 설치·package·lock 모두7.0.2. strict/noEmitOnError=true, NodeNext/ES2022/DOM 환경. broad any/ts-ignore/ts-nocheck 없음. Hook slot/generic clone/cache 등의 제한된 내부 단언은 내부 상관관계 경계이며 외부 JSON/VDOM/DOM 입력은 unknown/노드 종류 및 값 검증을 유지한다.
기존13 unit 파일은 .js→.ts import 외 bytes가 동일함을 독립 대조했다. 기존 E2E와 기대값 삭제/skip/완화 없음. 신규 E2E hash 검사는 실제 TS 파일을 읽고 버전을 대조하며 기존 privacy assertion을 대체하지 않는다.
build.js의 절대 root/dist·직속 부모 검증과 symlink 거부를 검토했다. 격리 fixture에 동일 build.js/tsconfig를 복사해 의도적 TS2322→exit1/오래된 index 제거, dist junction→exit1/대상 sentinel 보존을 확인했다. 제품 dist/원본은 실패 probe로 변경하지 않았다.
독립 HTTP로21개 JS URL의200/JavaScript MIME와 응답 bytes===dist 파일, source hashes/버전, /와 /phase1/ HTML script import, /src/main.ts404를 확인했다. npm run dev 초기 자동 build도 확인했다. E2E 설정은 npm run dev를 자체 실행해 최신 빌드를 준비하며 unit은 TS 원본을 읽는다.
증거 independent-build-type-audit.json, independent-serving.json, build.log, dev.log. 격리 fixture node_modules junction은 읽기 용도로 사용했으며 재귀 삭제하지 않았다.

## 6. 직접 실행한 시험 증거
증거 base: output/playwright/turn12-rereview1/. 기존 report/test-results는 prior-*에 먼저 보존했다.

| 직접 실행 명령 | exit | PASS | FAIL | SKIP | 증거 |
|---|---:|---|---:|---:|---|
| npm run typecheck | 0 | strict 검사 완료 | — | — | typecheck.log |
| npm run build | 0 | TS21+두 페이지 자산 | — | — | build.log |
| npm run test:unit | 0 | 161 / 14 files | 0 | 0 | test-unit.log |
| npm run test:e2e | 0 | 62 Chromium | 0 | 0 | test-e2e.log |
| npm run test:all | 0 | typecheck/build+161 unit+62 Chromium | 0 | 0 | test-all.log |

고유 정규 시험223개. 반복 실행과 독립 probe는 합산하지 않는다. Playwright Skill을 읽고 실제 CLI headed browser를 사용했다. 별도 probe는 HTTP22/0, runtime10/0, projection10/0, TS/native/privacy9/0, UI encoded slash2/0 및 deterministic 흐름 정상으로 구분한다.
npm run dev 초기 자동 build/4173·두 페이지 접속 확인 후 Ctrl+C 종료(exit1: 수동 종료이며 시험 실패로 계산하지 않음). 자체 브라우저 qa-ts-final 및 fixture4174/4175도 종료. 종료 후 세 포트 LISTEN 없음. 기능 검사 마지막 final-mobile.png를 촬영·열어 확인했으며 screenshot 이후 추가 Patch를 수행하지 않았다.
409/503/CORS negative의 예상 network console 오류와 stale setter/주입 loop 오류는 정상 흐름 오류와 구분했다. 정상 UI pageerror=[] 및 정규 console 검사 통과.
보조 조사에서 TS 구버전 classic API 경로와 잘못 짚은 App 경로 조회가 실패했다. 제품 변경 전 읽기/도구 경로 오류이며 실제 설치 TS7 CLI와 src/App.ts로 수정해 확인했다. 이를 제품/필수 시험 실패로 세거나 성공 증거로 사용하지 않았다.

## 7. 구조적 평가·지원 한계·다음 단계 승인
공유 엔진·root transaction·ID scope·입력 오류 경계가 유지된다. 참조 보존/no-op과 제한된 History/Viewer로 현재 범위 성능을 확인했다. 전면 리팩터링이나 추가 필수 기능을 요구하지 않는다.
미검증: clean dependency reinstall, Firefox/WebKit, 실제 스크린리더 운용, 실제 외부 운영 API 가용성/CORS, 예외 주입 자연 발생 빈도. Chrome native AX 정규 회귀 통과를 스크린리더 운용 인증으로 표현하지 않는다.
지원 한계: 원자 rollback, 모든 조건부/custom Hook 위반 자동 탐지, 모든 임의 비밀 탐지, 전체 응답 수신 메모리 제한, source watch를 보장하지 않는다. 승인된 HTML/Chromium/로컬 fixture 범위의 필수 검증 누락은 없다.
승인 효력은 검사 HEAD885d8ea의 제품e513ba4 및 검증한 도구/시험/문서 범위에 한정하며 이후 코드 변경으로 자동 승계하지 않는다.
revision_count0→1/2, active_rework_round1. 구현 시도3회와 독립 재검수1회, TURN06 역사 횟수를 분리한다.
시작 clean→종료 이 보고와 STATE/HANDOFF/LOG/ISSUES 5개만 미커밋, 제품/기존 시험/설계/README 불변, HEAD 유지. record-baseline.json/final-record-audit.json에 원문 prefix·소스 hash·Git 상태 기록. 로컬 검수 commit 없음.
**TURN12 PASS / APPROVED → 전체 종료.** 로컬 포트폴리오 제출 준비 완료이며 원격 제출·push·PR·배포는 수행하지 않았다. 다음 담당 사용자/로컬 제출 자료 확인. Sol 구현 세션에 남은 필수 수정 지시 없음. 다른 세션 실행/추가 구현 없이 STOP.

REVIEW COMPLETED: 2026-11-08 20:47:13 Asia/Seoul
