# API Studio issues

## 현재 상태 — Sol TURN 05
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
