# API Studio × Mini React — Dual-Session Codex Loop Harness

> 버전: **2.0 / 2026-11-07**  
> 저장 위치(Windows): **`C:\Users\Leo\Desktop\API 1\CODEX_LOOP_HARNESS.md`**  
> 저장소 루트: **`C:\Users\Leo\Desktop\API 1`**  
> 전체 계획: **12개 마일스톤** (메시지 횟수 12회 제한 아님)  
> 실행 모델: **Sol 6.1 / High = 구현**, **Astra 6 / High = 설계·독립 검수**  
> 목적: 과제 요구사항을 만족하는 **직접 만든 Mini React 엔진 + 자체 엔진으로 동작하는 API Studio**를 포트폴리오 수준으로 완성한다.

---

## 0. 시작 전 필독 — 이 문서의 역할

이 파일은 **프로젝트 작업 규약 및 단계별 게이트**이다. **MD 파일만으로 반복 실행이나 세션 전환이 자동화되는 것은 아니다.** 각 Codex 세션은 자신에게 할당된 단계를 현재 작업 환경에서 수행하고, **다른 모델의 담당 차례가 되면 즉시 중단하여 인계한다.** 사람(사용자)이 상대 세션을 열어 같은 저장소에서 이어 실행한다. 두 세션이 동시에 파일을 수정하지 않는다.

**우선순위**: 사용자 최신 지시 > 과제 원문 필수 요구사항 > 본 하네스의 완료 게이트 > 설계 문서 > 각 모델의 임의 구현 선호. 충돌하거나 모호하면 **임의로 기준을 완화하지 말고 `BLOCKED`로 이유를 기록**한다. 확인되지 않은 사실을 통과로 간주하지 않는다.

### 역할 경계 (절대 규칙)

| 세션 | 모델 / Effort | 담당 TURN | 권한 및 의무 |
|---|---|---|---|
| **Architect & Independent QA** | **Astra 6 / High** | **01, 06, 12** | TURN 01: 아키텍처·계약·시험 기준 확정. TURN 06/12: **독립 검수 및 승인/반려**. QA 턴에서 구현 코드 직접 수정하지 않는다. |
| **Lead Implementation Engineer** | **Sol 6.1 / High** | **02, 03, 04, 05, 07, 08, 09, 10, 11** | 코드 구현·테스트·디버깅·결함 수정. Astra의 검수 결과를 재현 가능한 근거로 해결. **자기 검수로 TURN 06/12를 PASS 처리할 수 없다.** |

- 모델 이름과 effort는 **Codex 사용자가 세션에서 직접 선택하는 설정**이다. 이 Markdown 파일은 모델/effort를 강제로 변경하지 못한다.
- 허용된 **자동 반복은 같은 담당자의 연속 TURN** 안에서만 진행한다. Sol은 02→05, 07→11을 이어갈 수 있다. **05 완료 후 06 Astra에게, 11 완료 후 12 Astra에게 반드시 제어를 넘긴다.**
- **Astra TURN 01**이 PASS된 후 사용자에 의해 Sol TURN 02가 시작된다. **Astra TURN 06**이 PASS되기 전 Sol TURN 07에 착수하지 않는다.
- Astra 검수에서 `REJECTED`이면 **Sol의 `REVIEW_REWORK` 작업**으로 되돌린다. 이것은 13번째 TURN이 아니라 해당 검수 마일스톤의 재검토다. Sol 수정→테스트→인계 후 **Astra 동일 TURN 재검수**를 실시한다.
- 긴 자동 실행의 결과를 모델의 표현만으로 신뢰하지 말고, **실제 작업 트리·커밋·테스트 로그를 근거로 완료 판정**한다.

---

## 1. 프로젝트 범위 및 기술 제한

### 1.1 필수 산출물

**Phase 1 — Virtual DOM / Diff / Patch**

1. 페이지 최초 로드 때 **실제 영역의 샘플 HTML DOM을 읽어 VDOM으로 변환**하고, **그 VDOM으로 테스트 영역을 렌더링**한다.
2. 테스트 영역은 사용자가 **실제 HTML DOM을 편집**할 수 있어야 한다. Patch 시 현재 테스트 DOM을 다시 VDOM으로 변환한다. **단순 HTML 문자열 비교는 금지.**
3. 이전 VDOM과 새 VDOM을 비교해 최소 변경을 찾고, **실제 영역에서 변경된 노드만 Patch**한다.
4. **변경 최소 5종**: 텍스트 변경, 속성 추가·변경·삭제, 노드 추가, 노드 제거, 노드 교체. 무변경, 깊은 중첩, 연속 변경도 검증한다.
5. 성공적으로 Patch한 VDOM을 **독립 스냅샷으로 State History에 저장**하고, Undo/Redo로 **실제 영역과 테스트 영역을 동시에 해당 상태로 이동**시킨다. Undo 후 새 Patch는 미래 Redo 경로를 폐기한다.

**Phase 2 — Component / State / Hooks**

1. **함수형 컴포넌트를 감싸는 `FunctionComponent` 클래스**를 만든다: `hooks` 배열, `mount()`, `update()` 필수.
2. **`useState`, `useEffect`, `useMemo`**를 직접 구현한다. Hook 호출 인덱스·상태 유지, 의존성 비교, effect 실행 시점·cleanup을 검증한다.
3. **Hook과 State는 루트 컴포넌트만 보유/사용**한다. 모든 자식 컴포넌트는 props만 받는 **Stateless 순수 함수**다.
4. State setter → 루트 컴포넌트 재실행 → 신규 VDOM → **Phase 1과 동일한 Diff/Patch 코드** → 필요한 실제 DOM만 수정한다.

**테스트 웹페이지 — API Studio**

- 개인 포트폴리오용 브라우저 REST API 클라이언트. GET/POST/PUT/PATCH/DELETE, URL, Query Params, Headers, JSON Body, Send, 요청 진행/오류 상태, Status, 응답 시간, 응답 Header, JSON/텍스트 Viewer, 최근 요청 이력 재사용.
- **Phase 1 검증 페이지** (`phase1/index.html`)와 **Phase 2 제품 페이지** (`index.html`)는 각각 실행 가능해야 한다.
- UI는 위 자체 Mini React를 통해 렌더링해야 한다. 일반 Vanilla JS로 DOM을 매번 직접 갈아끼워 자체 엔진을 우회하는 구현은 금지다.
- **단위 테스트**(VDOM·Diff·Patch·Hooks·API 처리) 및 **브라우저 기능 테스트**(두 페이지)가 실제 통과해야 한다.

### 1.2 기술 스택 계약

- **제품 런타임**: **HTML, CSS, Vanilla JavaScript (ES modules)**. TypeScript도 원 과제상 허용되지만 범위 단순화를 위해 **JavaScript로 통일**한다.
- **금지**: React, Vue, Next.js, Preact, Svelte, Angular, jQuery 및 기타 UI/상태관리/VDOM/Hooks 런타임 프레임워크; React DOM, 사전 제작 Diff/Patch 엔진, 외부 UI 컴포넌트 라이브러리, CSS 프레임워크를 제품 구현에 사용하는 행위.
- **허용 범위**: Node/npm(개발 환경), Vitest 및 jsdom(단위 테스트), Playwright(브라우저 검증). 이는 **개발·테스트 전용 의존성**이어야 한다. 과제 운영자가 개발 의존성도 금지했다면 그 지침을 따른다.
- 기본 개발 서버는 **정적 파일 서빙 + 브라우저 네이티브 ES Module**로 구성해 번들러 의존을 피한다. 별도 빌드 도구가 정말 필요하다면 변경 이유를 기록한다.
- Phase 1과 2의 렌더링 엔진을 **복제하거나 재구현하지 않는다**. 이벤트 핸들러도 내부 Patch에서 설치·해제·갱신하고, `eval`, 인라인 이벤트 문자열 실행, `innerHTML` 전체 교체로 Phase 2 갱신을 구현하지 않는다.
- 제품은 **브라우저 Fetch API**만 활용한다. 임의 API가 모두 동작한다고 주장하지 않는다(CORS 제약). CORS 무력화, 무제한 프록시 도입은 금지한다. 실운영 서버의 데이터 변경 요청은 자동화하지 않는다.
- 승인 없는 외부 인증 토큰 전송/저장, 실제 개인정보 기록, 무분별한 콘솔 출력, 로컬 저장소에 비밀 값 영구 저장을 금지한다. History는 민감값을 제거한 요청 메타데이터만 저장한다.
- **다른 팀원 저장소의 병합은 없다.** 외부 저장소 push/PR/merge/배포, 파괴적 파일 삭제는 명시적 승인이 없는 한 금지한다.

### 1.3 핵심 기술 계약 (TURN 01에서 확정)

- `domToVNode(domNode)`, `createDOM(vnode)`, `diff(oldVNode, newVNode)`, `patch(rootDom, changes)`에 **일관된 타입과 반환 계약**을 정의한다. 동일 동작의 다른 명칭을 사용해도 전체 설계 문서에 명시한다.
- 예시 VDOM: `{type:'element', tag:'div', props:{class:'x'}, children:[{type:'text', value:'Hi'}]}`. `null`, text, attributes, events, lists 표현을 확정한다.
- Patch는 다중 형제 노드 추가·삭제의 인덱스 안정성을 보장해야 한다. **변경되지 않은 실제 DOM 노드의 참조 동일성**을 테스트한다.
- React와 동일한 Fiber, Concurrent Rendering, keyed 최적화, 자동 Batching은 필수가 아니다. **단순하지만 정확한 구현**을 우선한다.
- `useEffect`는 Patch 후 실행, 의존성 변경/언마운트 시 cleanup; `useMemo`는 의존성 비교를 통한 재사용. `Object.is` 등 비교 정책을 문서화한다.
- 입력 포커스 및 입력값 보존, event listener 중복, Hook 호출 순서 불일치, 히스토리 객체 변경 등의 **회귀 위험을 명시적으로 검사**한다.

---

## 2. 실제 저장소·터미널 환경

**절대 작업 루트**: `C:\Users\Leo\Desktop\API 1`

Windows PowerShell에서 폴더로 이동:

```powershell
Set-Location -LiteralPath 'C:\Users\Leo\Desktop\API 1'
Get-Location
Get-ChildItem -Force
```

위 위치에서만 프로젝트 작업을 수행한다. **경로에 공백(`API 1`)이 있으므로 항상 따옴표 또는 `-LiteralPath`를 사용한다.** 다른 `API 1` 폴더를 추측하거나 임의 생성하지 않는다. `git status --short`, `git rev-parse --show-toplevel` 등으로 실제 루트를 확인한다. Git 저장소가 없다면 Sol에게 TURN 02에서 로컬 초기화를 허용할지 먼저 판단하고 기록한다(원격 연결은 하지 않는다).

권장 폴더 구조(기존 파일은 먼저 보존):

```text
C:\Users\Leo\Desktop\API 1\
├─ CODEX_LOOP_HARNESS.md            # 이 파일 (사용자가 배치)
├─ AGENTS.md                        # TURN 01에서 기존 내용 확인 후 짧은 규약 작성
├─ index.html                       # Phase 2 API Studio
├─ phase1\index.html                # Phase 1 렌더링 검증기
├─ src\mini-react\                 # vdom / diff / patch / component / hooks
├─ src\api\                        # request / response / history
├─ src\components\                 # props 전용 stateless 컴포넌트
├─ tests\unit\
├─ tests\e2e\
├─ docs\architecture.md             # Astra TURN 01이 확정하는 기술 계약
├─ docs\loop\STATE.md               # 권위 있는 현재 TURN 및 승인 상태
├─ docs\loop\HANDOFF.md             # 다음 세션용 1페이지 인수인계
├─ docs\loop\LOG.md                 # 실행한 명령·실제 테스트 증거·변경 내역
├─ docs\loop\ISSUES.md              # 오류 목록 및 회귀 상태
├─ docs\loop\reviews\turn06.md      # Astra 검수 결과
├─ docs\loop\reviews\turn12.md      # Astra 최종 검수 결과
└─ README.md
```

> `docs/loop/` 기록은 긴 원문 코드·콘솔 로그를 복사하는 장소가 아니다. **명령, 결과 수치, 관련 경로, 실제 재현 방법, 커밋 ID**만 간결하게 남긴다. 문서가 낡았을 경우 저장소 코드와 실제 테스트가 우선한다.

### 2.1 첫 실행 체크

1. 현재 디렉터리와 Git 상태, 기존 파일, 프로젝트 루트, Node/npm 존재를 확인한다.
2. `AGENTS.md`, 기존 하네스·설계 문서·테스트 설정이 있으면 무작정 덮어쓰지 않는다.
3. 상태 파일과 Git·테스트 증거가 일치하는지 확인한다. **`STATE.md`에 PASS라고 써 있기만 해서는 다음 단계로 진행하지 않는다.**
4. 누군가 같은 저장소를 수정 중이라면 중단한다. 사용자가 두 세션을 **교대로** 실행하도록 한다.
5. 의존성은 개발 목적에 필요한 최소 범위로만 설치하며, 전역 설치·권한 확대를 임의로 수행하지 않는다.

---

## 3. 공용 상태 머신 및 인수인계

### 3.1 상태값

- `NOT_STARTED`: 아직 시작하지 않은 TURN
- `IN_PROGRESS`: 지정된 담당 세션이 작업 중
- `PASS`: 해당 TURN의 완료 게이트를 **실제 증거로 충족**
- `REJECTED`: **Astra**가 TURN 06 또는 12의 결함을 재현해 반려
- `REVIEW_REWORK`: Sol이 반려된 검수 TURN의 결함을 수정 중
- `BLOCKED`: 기술·환경·권한·설계 문제로 안전하게 진행할 수 없음
- `TEST_BLOCKED`: 필수 검증을 실행할 수 없어 PASS 판정 불가

마일스톤 목록(01~12)은 `STATE.md`에 각 행 `TURN | Owner | Status | Evidence | Commit` 형태로 관리한다. `current_turn`, `next_owner`, `revision_count`, `last_verified_commit`, `last_updated` 항목을 별도로 기록한다. 누락되면 임의로 성공 처리하지 않는다.

### 3.2 TURN 소유권·승인 규칙

1. **Astra TURN 01 PASS → Sol TURN 02**
2. **Sol TURN 02~05 각 PASS → Astra TURN 06** (05 PASS는 구현 자기검증, 06에서 독립 승인)
3. **Astra TURN 06 PASS → Sol TURN 07**
4. **Sol TURN 07~11 각 PASS → Astra TURN 12**
5. **Astra TURN 12 PASS → 전체 종료**
6. **Astra TURN 06/12 REJECTED → Sol REVIEW_REWORK → Astra 같은 TURN 재검수**

**다른 모델 차례에는 구현/검수/자동 진행을 시도하지 말 것.** 세션 전환은 사용자에게 명확히 요청하고 해당 세션에서 중단한다. 두 모델 사이의 메시지가 자동으로 전달된다고 가정하지 않는다.

### 3.3 매번 인계할 때 `HANDOFF.md`에 기록

```text
[HANDOFF — YYYY-MM-DD HH:mm]
FROM: Astra | Sol
TO: Astra | Sol
CURRENT TURN: 01..12
STATUS: PASS | REJECTED | BLOCKED | TEST_BLOCKED
WORKTREE: git status --short 실제 요약
LAST VERIFIED COMMIT: 실제 commit hash 또는 none
FILES CHANGED: 관련 경로
EVIDENCE: 명령 / 테스트 pass·fail·skipped / 로그 위치
OPEN ISSUES: ISSUE-ID + severity + 재현 요약
NEXT ALLOWED ACTION: 다음 담당자가 수행할 정확한 단계
DO NOT: 피해야 할 작업·설계 변경
```

- 인계 전 `STATE.md`, `HANDOFF.md`, `LOG.md`, `ISSUES.md`를 저장한다. **근거 없이 PASS와 다음 TURN을 기록하지 않는다.**
- 인수 세션은 상태 파일만 믿지 말고 `git status`와 관련 실제 코드를 확인한다. 중요 게이트에서는 관련 테스트를 재실행한다.
- 리뷰 기준 커밋이 변경되었다면 Astra는 변경 범위를 검토한 뒤 재테스트한다. 검수 이후 코드가 바뀌면 이전 승인 효력을 자동으로 이어받지 않는다.
- 문서 기록 충돌/동시 변경 흔적이 보이면 두 세션이 임의 병합하지 말고 중단한다.

---

## 4. 담당별 반복 루프

### 4.1 Sol 6.1 / High — 구현 루프 (TURN 02~05, 07~11)

각 TURN마다:

1. `STATE.md`/`HANDOFF.md`와 해당 범위의 **관련 코드만** 확인. **자신의 담당 TURN인지 확인**한다.
2. 과제 요구사항, 현재 아키텍처 계약, 해당 TURN의 완료 기준을 짧게 대조한다.
3. 가장 작은 검증 가능한 단위로 구현한다. 기존 사용자 수정은 보호하고 변경 파일을 관리한다.
4. 관련 **단위 테스트를 작성·실행**하고, 해당 턴에서 브라우저 검증이 요구되면 E2E도 실행한다.
5. 실패 시 재현 → 원인 파악 → 수정 → 동일 테스트 재실행. **동일 TURN에서 원인 분석을 포함한 수정 시도 최대 3회**. 세 번째 이후에도 해결되지 않으면 `BLOCKED`로 중단한다(기계적으로 같은 수정을 반복하지 않는다).
6. 변경 없는 노드 참조, 이전 단계 회귀, 기술 제한 준수를 점검한다. **테스트 삭제·skip·완화로 PASS를 조작하지 않는다.**
7. 실행 명령·통과/실패·증거를 `LOG.md`에 기록하고 `STATE.md`를 갱신한다. 실제 PASS가 아니면 다음 TURN 금지.
8. `PASS`된 단계는 원하면 **로컬 커밋**한다. Git 초기화·커밋은 사용자 수정 보호와 저장소 확인을 선행한다. **원격 push/PR/merge는 금지.**
9. 다음 TURN이 자신 담당이면 계속 진행 가능. **TURN 05/11 완료 시 `HANDOFF.md` 작성 후 즉시 STOP.**

**Sol이 직접 고칠 수 있는 내용**: 소스, 테스트, 문서, UI, 모듈 구현, Astra가 기록한 결함. **Sol이 단독으로 판정할 수 없는 내용**: TURN 06·12의 독립 QA 승인.

### 4.2 Astra 6 / High — 아키텍처/독립 QA 루프 (TURN 01, 06, 12)

**TURN 01**:

- 현재 저장소를 읽기 중심으로 조사하고 `docs/architecture.md`에 **VDOM 자료형, Diff 명령, Patch 적용 순서, Hooks 상태 머신, 이벤트 정책, History, API/컴포넌트 경계, 테스트 매트릭스, UI 개요, 제약사항**을 구체적으로 확정한다.
- 과도한 설계 문서나 런타임 코드를 만들지 않는다. 필요하다면 `AGENTS.md`를 짧게 생성·수정하고, 프로젝트 초기화/개발 환경 설정은 **TURN 02의 Sol 작업**으로 명시한다.
- 아키텍처가 Phase 1과 2에 동일하게 적용될 수 있는지 **반례로 검증**한다. 핵심 인터페이스가 모호하면 PASS 금지.
- PASS이면 `HANDOFF.md` 작성 후 **Sol에게 인계하고 즉시 STOP**.

**TURN 06/12**:

- **검수 시 구현 코드 직접 수정 금지**. 코드 확인, 테스트 실행, 재현 가능한 읽기 전용 조사 및 리뷰 문서 작성은 허용.
- Sol의 성공 보고보다 **실제 diff·테스트·브라우저 동작**을 우선한다. 기존 테스트만 재실행하지 말고 핵심 경계 사례를 독립적으로 선정한다.
- 발견 결함에는 `ISSUE-ID`, severity(`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), 파일/재현 단계/기대·실제 결과/증거/수정 방향을 기록한다. 별도 검증 불가 항목은 `UNVERIFIED` 표시.
- `CRITICAL` 또는 `HIGH`가 1건이라도 남았거나 **필수 테스트 미실행/필수 요구사항 미충족**이면 **`REJECTED` 또는 `TEST_BLOCKED`**. Sol에게 수정 인계 후 즉시 STOP.
- 검수 승인 조건이 충족되면 **Astra만** TURN 06/12를 `PASS`로 기록한다. TURN 06 PASS면 Sol에게 TURN 07을 인계하고 STOP. TURN 12 PASS면 최종 리포트 작성 후 종료.
- 반려 수정→재검수는 **같은 TURN 번호**로 진행한다. 재검수에는 이전 실패를 다시 확인하고 연관 회귀도 검사한다.

### 4.3 반려·복구 루프 한도

- 구현 턴별 **실패 수정 최대 3회**(기본 한도; 원인·시도를 모두 기록).
- 독립 검수 반려의 **Sol 수정→Astra 재검수 최대 2회**. 그 이후 주요 결함이 남아 있다면 `BLOCKED`로 기록하고 사람이 방향을 결정하도록 멈춘다.
- 환경 장애나 사용자의 확인이 필요한 설계 결정 때문에 테스트가 불가능하면 `TEST_BLOCKED` 또는 `BLOCKED`. **임의 스킵 후 다음 단계 이동 금지**.
- 큰 문제를 해결하기 위해 아키텍처 계약 변경이 필요하면 `docs/architecture.md`의 **변경안/영향/추가 테스트**를 남기고 Astra가 검토한다. 승인 없는 자동 대규모 재작성 금지.

### 4.4 안전한 STOP 조건

- 담당 모델이 아닌 TURN에 도달함(정상 인계 STOP 포함).
- 3회 구현 수정 실패 또는 2회 QA 재작업 초과.
- 필수 테스트 실행 불가, 승인되지 않은 의존성/권한/외부 서비스가 필요함.
- 사용자 기존 파일·비밀정보 위험, Git 작업 충돌, 임의 원격 전송/배포가 필요함.
- Phase 1 핵심 엔진을 버리거나 금지된 UI 프레임워크를 사용해야만 진행 가능한 상황.
- TURN 12 독립 QA PASS 완료.

---

## 5. 12-TURN 구체 계획과 테스트 게이트

| TURN | 담당 | 산출물 / 작업 | PASS 최소 증거 |
|---|---|---|---|
| **01** | **Astra** | 설계 확정: VDOM/patch API, 루트 Hook 계약, History, API Studio 컴포넌트 구조, 12턴 테스트 매트릭스, 작은 `AGENTS.md` | `docs/architecture.md`에 모호함 없는 인터페이스와 예시·엣지 케이스; 솔 구현 가능한 설계; 인계 기록 |
| **02** | Sol | 개발 환경·Git/테스트 스크립트(필요 시) + DOM→VDOM, VDOM→DOM, VDOM `h()` | 중첩/텍스트/빈 노드/속성/특수문자 변환 테스트 통과; 실제 DOM 변경 없음 |
| **03** | Sol | Diff 알고리즘 및 Patch 명령 데이터 모델 | 텍스트·속성·추가·삭제·교체·무변경·복수 변경 검증, 기존 VDOM 불변 |
| **04** | Sol | Patch 적용, 이벤트 등록/갱신/해제, 실제 DOM 노드 재사용 | 변경 노드만 수정, 변경 없는 참조 `===` 보존, 연속 삭제·삽입, 이벤트 중복 없음 |
| **05** | Sol | Phase 1 실제/테스트 영역, DOM 직접 편집, Patch, Undo/Redo, History | 최초 VDOM 복제, 편집→Patch, 양 영역 동기화, Undo/Redo, 분기 폐기, 브라우저 검증 |
| **06** | **Astra** | **Phase 1 독립 QA (필수 게이트)** | 복수·깊은 노드/텍스트/속성/편집/이력/참조 테스트, 증거 첨부, Critical/High 0, `turn06.md` |
| **07** | Sol | `FunctionComponent` (`hooks`, `mount`, `update`) + 루트 전용 `useState` | setter→동일 Diff/Patch 경유, 상태·훅 슬롯 유지, 자식 props, 루트 외 Hook 제한 |
| **08** | Sol | `useEffect`·`useMemo`, deps 정책, cleanup, 리렌더 제어 | 변경/무변경/빈 deps/생략 deps, memo 캐싱, cleanup 순서, Phase 1 회귀 없음 |
| **09** | Sol | Fetch/URL/query/header/body/response/History 처리 API 모듈 | Mock Fetch로 5 HTTP 메서드, 2xx/4xx/5xx, 네트워크·CORS·잘못된 JSON·비JSON·민감정보 배제 |
| **10** | Sol | **API Studio** UI 전체: Sidebar/Request/Response/JSON Viewer 등 stateless 자식 + 루트 상태, 기본 CSS | 입력·Send·로딩·응답·오류·이력·재사용, 브라우저에서 자체 Mini React 렌더링 확인 |
| **11** | Sol | 전 구간 회귀 수정, API Studio polish, 수동·자동 통합 검증, README 초안 | 필수 unit/E2E 실제 통과, 안정성/포커스·History·Hooks·CORS, 제한 준수, Astra용 인계 기록 |
| **12** | **Astra** | **최종 독립 QA·포트폴리오 승인 게이트** | 요구사항 대조 100%, 직접 E2E/반례 검증, Critical/High 0, 재현 가능한 실행·설명, `turn12.md` |

### 세부 필수 케이스

**VDOM / Diff / Patch**

- 텍스트↔요소 교체, 빈 요소, 형제 추가·삭제 연속 실행, 마지막 자식 제거, 깊은 중첩 변경, 속성 추가/수정/삭제, `class`, `style`, 입력 `value`, 변경 없는 노드 재사용.
- 이벤트 변경 시 중복 핸들러가 발생하지 않고 제거된 노드의 listener 정리.
- HTML 에디터는 사용자 편집을 허용하지만 임의 script 실행/이벤트 속성/위험 URL이 전파되지 않도록 제한. 문자열 비교로 VDOM Diff를 흉내 내지 않는다.
- `MutationObserver` 등 실제 DOM 변화 감지 API는 학습·검증 도구로 활용 가능. 단 핵심 Patch 알고리즘을 대신할 수 없다.

**State / Hooks**

- 루트의 여러 `useState` 독립 슬롯과 함수형 setter 업데이트; 함수 재실행 후 상태 유지; 특정 자식 props 변경 시 필요한 DOM만 갱신.
- `useEffect` 의존성 변화·동일성·빈 배열·cleanup 호출 시점, `useMemo` 재계산 방지. Hook 순서 불일치 발생 시 조용히 잘못된 상태로 진행하지 않도록 규칙 확정.

**REST API Studio**

- 공개 **Mock API**로 구성한 결정적 E2E 테스트를 우선한다. 공개 데모 GET 요청은 선택적으로 실제 테스트 가능. 승인 없는 실제 POST/DELETE 전송을 하지 않는다.
- `fetch()`의 **4xx/5xx는 네트워크 오류와 구분**해 HTTP 응답으로 표시한다. CORS 실패는 브라우저 보안 제한으로 설명한다.
- 입력 중 커서/포커스 유지, 탭 전환, history 재선택, 실패 후 다시 Send, 긴 JSON 텍스트/비JSON 응답, 빈 body, 취소(구현했다면), 콘솔 오류 확인.
- 헤더 및 History에 `Authorization`, 쿠키, API Key, 암호·토큰 패턴 등 민감값을 기록·노출하지 않는다.

---

## 6. 테스트·Skills 규약

### 6.1 테스트 명령

첫 구현 턴에서 실제 실행 가능한 npm 스크립트를 정의한다. **명령이 실제 존재할 때만 실행하며, 없는데 성공한 것으로 보고하지 않는다.** 권장:

```powershell
npm run test:unit
npm run test:e2e
npm run test:all
npm run dev
```

- `test:all`은 단위·브라우저 테스트를 포함하고, CI와 동일한 조건으로 종료 코드가 실패를 반영하도록 한다.
- 최소 TURN 02~04/07~09는 관련 단위 테스트를, TURN 05/06/10/11/12는 브라우저 E2E를 포함해 검증한다.
- E2E는 브라우저가 실제 실행 가능한 환경에서 수행한다. 브라우저 미설치 등으로 검증을 못 했으면 `TEST_BLOCKED`.
- 테스트 서버는 로컬 루프백 주소에서만 구동한다. 외부 운영 서비스에 자동 부하·데이터 수정 요청을 보내지 않는다.

### 6.2 Playwright Skill 사용 (설치되어 있을 때)

- `playwright`는 **브라우저 조작을 돕는 Skill**이지, 설치만 하면 스스로 테스트를 시작하는 프로그램이 아니다.
- 해당 Skill이 Codex에서 확인되면 브라우저 검수가 필요한 TURN에서 **명시적으로 `$playwright`를 호출하거나 `playwright Skill을 사용해 ...`라고 지시**한다. Codex는 해당 설치본의 `SKILL.md` 절차를 따른다.
- 실제 CLI 중심 `playwright` Skill은 브라우저 열기 → snapshot → 상호작용 → 재-snapshot → 스크린샷/결과 검증 흐름이다. **스크린샷만 찍고 PASS 처리하지 않는다.**
- **Windows PowerShell**에서는 Skill의 `.sh` 래퍼가 Bash용일 수 있다. Bash/WSL을 억지로 설치하거나 권한을 완화하지 말고, Skill이 안내하는 지원되는 Windows CLI 대안을 확인한다. `@playwright/cli`를 사용한다면 예: `playwright-cli --help` (설치되어 있는 경우). 자동화된 `@playwright/test` 프로젝트 E2E 테스트는 별도의 테스트 전용 구성으로 관리할 수 있다.
- Skill이 없는 환경에서는 **설치된 것처럼 주장하지 말고** 프로젝트의 기존 E2E 실행 절차를 활용한다.
- 위험한 sandbox 해제, `--dangerously-bypass-approvals`, `danger-full-access` 같은 권한 완화로 테스트를 강행하지 않는다.

### 6.3 검수 보고 형식

```text
[TURN NN/12 — OWNER: Sol 또는 Astra]
STATUS: PASS | REJECTED | BLOCKED | TEST_BLOCKED
SCOPE: 완료한 기능 또는 검수 대상 커밋
FILES CHANGED: 실제 경로
TEST EVIDENCE: 실행한 명령, PASS/FAIL/SKIP 수, 브라우저 검증 결과
ISSUES: ID / Severity / 재현 방법 / 처리 상태
ARCHITECTURE CHANGES: 없거나 근거·영향
COMMIT: 확인된 hash 또는 none
NEXT OWNER / NEXT ACTION: 정확한 TURN 및 작업
HANDOFF: 작성 완료 여부
```

Astra의 TURN 06/12 보고에는 반드시 **`APPROVED` 또는 `REJECTED`** 사유를 포함한다. Sol이 독립 리뷰를 수행하지 않았다면 `independent review PASS`라는 표현을 쓰지 않는다.

---

## 7. 작업 품질·안전·Git 운영 규칙

- 작업 시작/종료 시 변경 파일과 Git 상태를 확인한다. 사용자의 기존 변경 파일·미추적 파일을 보호한다. `git reset --hard`, `git clean -fd`, 강제 checkout, 전역 설치, 원격 push, PR/merge, 배포는 허락 없이 하지 않는다.
- **Astra QA는 원칙적으로 구현 코드를 수정하지 않는다.** 검수 문서(`docs/loop/...`)만 갱신한다. 구현 결함은 Sol에게 전달한다.
- 각 기능은 **작동 증거와 이유 설명이 가능**해야 한다. AI의 자기 확신은 통과 증거가 아니다. 설명 가능해야 할 최소 핵심: DOM→VDOM, Diff 5종, Patch, History, hooks 인덱스, state setter, effect cleanup, memo deps, Fetch/CORS.
- 숨겨진 실패, 생략된 테스트, 허위 수치, 통과를 위한 assertion 완화, 테스트의 무단 비활성화는 금지한다.
- 변경 전에 사용자 기존 파일을 확인하고 의도적으로 선택한 범위만 수정한다. 필요 없는 외부 플러그인/Skill 자동 설치, 새로운 대형 하네스 제작, 무관한 리팩터링으로 시간을 소모하지 않는다.
- 앱 기능 추가보다 핵심 과제 충족이 우선이다. 초기에 인증·백엔드·GraphQL·WebSocket·사용자 계정·데이터베이스·복잡한 JSON 편집기·Fiber 구현을 추가하지 않는다. 선택 기능인 Mini React Patch Inspector는 **TURN 11 이후 검증에 영향이 없을 때**만 검토한다.
- 컨텍스트가 길어지면 전체 파일을 매번 재인쇄하지 않는다. `STATE.md`·`HANDOFF.md`의 최신 요약과 관련 변경 부분만 읽어 이어간다.

---

## 8. 두 세션을 시작·재개하는 짧은 프롬프트

**사용자는 각 세션에 별도로 역할 프롬프트를 부여해 둔 상태를 가정한다.** 아래 문장은 재개할 때도 사용할 수 있는 짧은 실행 명령이다.

### Astra 6 / High 세션에 입력

```text
작업 저장소는 C:\Users\Leo\Desktop\API 1 이다.
현재 저장소의 CODEX_LOOP_HARNESS.md와 docs/loop/STATE.md, HANDOFF.md(존재 시)를 확인해.
당신은 Astra 6 High, 설계자/독립 QA이고 오직 TURN 01, 06, 12만 담당한다.
상태와 실제 Git/테스트 증거를 확인한 뒤 현재 할당된 TURN만 수행해.
TURN 01은 계약·시험 기준 확정, TURN 06/12는 구현 코드 수정 없이 독립 검증 및 승인/반려다.
검수 PASS라면 인계 문서를 기록하고 즉시 멈춰. FAIL이면 Sol이 수정할 재현 가능한 결함 목록을 작성하고 멈춰.
다른 모델의 TURN을 대리 수행하거나 PASS 처리하지 마.
```

### Sol 6.1 / High 세션에 입력

```text
작업 저장소는 C:\Users\Leo\Desktop\API 1 이다.
현재 저장소의 CODEX_LOOP_HARNESS.md와 docs/loop/STATE.md, HANDOFF.md, Astra 설계/검수 문서(존재 시)를 확인해.
당신은 Sol 6.1 High, 구현 책임자이고 TURN 02~05와 TURN 07~11만 담당한다.
진행 가능한 현재 TURN에서 구현→단위/브라우저 검증→실패 수정→회귀 확인→기록을 반복해.
PASS 된 본인 담당 TURN만 연속 진행 가능하다. TURN 05 후에는 반드시 Astra TURN 06에 인계 후 STOP, TURN 11 후에는 Astra TURN 12에 인계 후 STOP한다.
Astra가 TURN 06/12를 REJECTED 했으면 신규 TURN을 만들지 말고 REVIEW_REWORK로 결함 수정·검증한 뒤 Astra에게 재인계해.
자기 리뷰로 Astra의 독립 QA를 통과 처리하지 마.
```

---

## 9. 최종 승인 체크리스트 (TURN 12 — Astra)

- [ ] 같은 저장소에서 Phase 1/Phase 2 각각 접속·시연됨.
- [ ] 실제 DOM → VDOM → 테스트 영역 최초 렌더링이 정상.
- [ ] 테스트 영역 사용자 DOM 편집 → VDOM 재생성 → Diff → Patch 경로 정상.
- [ ] Diff 5대 케이스와 복수/중첩/무변경 케이스를 테스트로 입증.
- [ ] 변경되지 않은 실제 DOM 노드 참조가 유지됨.
- [ ] History 저장, Undo/Redo 양쪽 영역 동기화, 분기 전환이 정확함.
- [ ] `FunctionComponent`의 `hooks`, `mount()`, `update()` 구현.
- [ ] `useState`, `useEffect`, `useMemo` 직접 구현·작동·검증.
- [ ] State/Hooks가 루트에만 있고 자식은 props만 사용하는 순수 함수.
- [ ] Phase 2의 부분 업데이트가 Phase 1과 동일한 Diff/Patch를 사용.
- [ ] API Studio HTTP 메서드 5종, URL, Params, Headers, Body, Send 구현.
- [ ] 응답 상태·Headers·본문·JSON·소요 시간·로딩·오류 처리.
- [ ] History의 조회/재사용 및 민감 정보 저장 방지.
- [ ] CORS 제한을 잘못 설명하거나 회피하지 않음.
- [ ] 실제 React/Vue·외부 VDOM/Hooks 런타임 패키지 사용 없음.
- [ ] 단위 테스트·실제 브라우저 E2E 실행 기록 및 증거 확인.
- [ ] 필수 요구사항 미검증 없음, Critical/High 미해결 0건.
- [ ] README에 설치·실행·테스트·아키텍처·React와의 차이·주요 한계·시연 절차가 있음.
- [ ] 사용자가 Git 상태 및 결과물을 재현할 수 있음. 임의 push/merge 없음.

> **최종 승인 조건**: 위 필수 체크리스트를 실제 테스트·코드 증거로 충족하고, **Astra TURN 12**가 `PASS / APPROVED`를 기록한 경우에만 종료한다. 미충족 사항은 허위로 완료 처리하지 않고 Sol에게 반려하거나 `BLOCKED`로 종료한다.
