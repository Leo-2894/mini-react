# Mini React Lab

같은 Mini React 엔진을 사용하는 두 실습에서 화면 갱신 원리를 직접 확인합니다. DOM Lab은 편집한 DOM을 읽고, Hook Lab은 App의 상태로 다음 화면을 계산합니다. 두 실습 모두 Virtual DOM을 만든 뒤 같은 Diff/Patch로 실제 화면을 바꿉니다.

## 실행

PowerShell에서 프로젝트 폴더를 연 뒤 다음을 실행합니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

- [Phase 1 DOM Lab](http://127.0.0.1:4173/phase1/)
- [Phase 2 Hook Lab](http://127.0.0.1:4173/)
- [개념 흐름도](http://127.0.0.1:4173/learning/mini-react-flow.html) · [독립 HTML 파일](learning/mini-react-flow.html)

TypeScript로 구현했습니다. Node.js는 빌드·정적 개발 서버·테스트에 사용하며, 브라우저는 컴파일된 JavaScript와 자체 Mini React 엔진을 실행합니다.

## Phase 1 · DOM Lab

1. 실제 영역의 샘플을 Virtual DOM으로 읽어 테스트 영역에 복제합니다.
2. 테스트 영역 제목을 바꾸고 **Patch 적용**을 누릅니다. 실제 영역에 바뀐 글자가 반영되며 최근 Patch 명령에서 `TEXT`를 확인할 수 있습니다.
3. Inspector로 요소를 추가·삭제·교체하고 속성을 바꿔 보세요. Diff가 변경 계획을 만들고 Patch가 필요한 DOM을 수정합니다.
4. **Undo / Redo**로 양쪽을 함께 되돌립니다. 저장한 화면에서 변경 없이 Patch하면 Redo를 유지합니다.

## Phase 2 · Hook Lab

| 실습 | 해 볼 일 | 확인할 개념 |
|---|---|---|
| useState | 메모를 입력하고 **+3 묶기** 누르기 | 함수형 updater 세 개를 모아 한 번 갱신합니다. 숫자가 3 늘고 메모를 보관합니다. |
| useEffect | 채널 A를 구독하고 A·B 신호 보내기. 채널을 바꾼 뒤 멈추기 | 화면 반영 후 선택한 이벤트를 구독합니다. 채널 변경이나 구독 종료 시 cleanup이 이전 연결을 해제합니다. |
| useMemo | **기준 저장 → 보기 전환 → 수량 +1** | 보기만 바꾸면 동일 결과 객체를 재사용합니다. 수량 변경 후 새 계산 결과와 비교합니다. |

App 루트가 상태와 Hook을 관리합니다. 자식은 props로 받은 값을 표시하고 부모가 넘긴 변경 함수를 호출합니다. FunctionComponent는 App 실행 사이에 Hook 값을 배열에 보관합니다.

## 코드와 검증

- [DOM Lab 연결과 History](src/phase1/controller.ts)
- [Hook Lab의 상태와 실습](src/App.ts)
- [Hook 값 보관과 실행 순서](src/mini-react/hooks.ts) · [FunctionComponent](src/mini-react/component.ts)
- [공용 렌더링](src/mini-react/renderer.ts) · [Diff](src/mini-react/diff.ts) · [Patch](src/mini-react/patch.ts)

```powershell
npx.cmd playwright install chromium
npm.cmd run test:all
```

전체 검증은 타입 검사·빌드·단위 테스트·Chromium을 실행합니다. 학습 사이트 변경 후 단위 테스트 122개와 Chromium 테스트 44개가 통과했습니다. 브라우저 테스트가 앱 서버를 직접 시작하므로, 실행 중인 개발 서버를 먼저 종료하세요. 이전 구현의 작업 기록과 검수 보고는 [docs/loop](docs/loop)에 있습니다.
