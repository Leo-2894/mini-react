# API Studio / Mini React

현재 진행: TURN 02~05 Phase 1 구현. **Astra TURN 06 독립 검수 대기**. Phase 2 Hooks/API Studio 제품 페이지(`index.html`)는 아직 구현하지 않았다.

## 실행 (Windows PowerShell)

```powershell
Set-Location -LiteralPath 'C:\Users\Leo\Desktop\API 1'
npm ci
npx playwright install chromium
npm run dev
```

브라우저에서 `http://127.0.0.1:4173/phase1/` 접속. 서버는 127.0.0.1에서만 실행한다. 루트 `/` 페이지는 TURN 10 대상이며 현재 제공하지 않는다. Node 24.22.1 / npm 11.19.1에서 검증.

```powershell
npm run test:unit
npm run test:e2e
npm run test:all
```

E2E는 자체 로컬 서버를 시작·종료하므로 실행 전 별도의 `npm run dev`를 종료해 4173 포트를 비운다. 실패 시 `test-results/`에 screenshot/trace, `playwright-report/`에 HTML 보고서가 남는다. 초기 실패 증거는 `output/playwright/turn05-attempt1/`에 별도 보존했다.

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

제품 런타임 의존성은 없다. 외부 React/VDOM/Hooks/UI/CSS 프레임워크를 사용하지 않는다. 테스트 도구는 devDependencies뿐이다. Phase 2는 같은 엔진을 재사용할 예정이며 루트만 state/hooks를 갖는다.

## 지원 한계와 검수 경계

HTML namespace의 제한된 DOM을 지원한다. SVG/MathML/template/custom element/Shadow DOM/file input/multiple select는 범위 밖이며 오류를 낸다. 전역 최단 편집/LIS/Fiber/Concurrent React 호환성을 보장하지 않는다. 구조/속성 외부 변경은 거부하고 제어 중인 live prop drift만 복구한다. 현재 브라우저 검증은 Chromium이다.

HTTP 통신·CORS 설명·민감 요청 이력 정제와 Phase 2 사용법은 TURN 09~11에서 구현 및 검증 후 문서화한다. 현재 Phase 1의 PASS는 구현자의 자체 검증이며 Astra의 TURN 06/12 승인과 구별한다. 기술 계약은 `docs/architecture.md`, 실제 진행/인계/실패 기록은 `docs/loop/` 참고.
