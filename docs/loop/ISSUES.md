# API Studio issues
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
