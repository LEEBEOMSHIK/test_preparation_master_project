# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 시험 완료 결과 아코디언 헤더를 문항 본문이 아니라 문항 제목 우선으로 표시한다.
- 이미지의 2025년 2회 Q11·Q19·Q20 채점 오류를 수정하고 기존 이력도 제한적으로 보정한다.
- 제목 fallback은 `title → instruction → content → 문항 제목 없음` 순서로 적용한다.
- 이력 재채점은 2025년 2회 11·19·20번 출처 좌표와 검증한 정확한 동치 조건을 모두 만족하는 행으로 제한한다.

## 확인한 실제 상태

- `exam_history.id=5`, 20문항, 17개 정답, 85점, 2026-07-17 17:28 응시.
- Q19: `SYN-Flooding` / 정답 `SYN Flooding`, `correct=false`, 원본 제목 `2025년 2회 19번 — TCP 취약점 공격`.
- Q20: `1. TTL, 2. 부장, 3. 대리, 4. 과장, 5. 차장` / 정답은 쉼표 뒤 공백만 다르며 `correct=false`, 원본 제목 `2025년 2회 20번 — 관계형 데이터베이스 투영 연산`.
- Q11: 사용자 경로가 분기 노드 2와 6의 YES/NO를 모두 통과하므로 분기 커버리지를 충족한다. 기존 정답의 두 번째 경로는 노드 6을 건너뛰는 오류가 있었다.
- Q11·Q19·Q20을 모두 보정하면 history 5는 20개 정답·100점이다.

## 구현 완료

- `ExamHistoryDetail.title` 스냅샷과 `QuestionResultResponse.title` 추가.
- 제출 조회에서 `sourceQuestionBank` fetch 및 제목 저장.
- 기존 이력 제목 백필 마이그레이션.
- `AnswerGrader`의 쉼표/슬래시 직후 열거 마커와 영문자 사이 하이픈/공백 정규화.
- Q11 원본 정답 교정, Q11·Q19·Q20 제한 재채점 및 영향 이력 집계 재계산 마이그레이션.
- FE 결과 헤더와 타입·회귀 테스트 갱신.
- 사용자 FE/BE 및 공통 채점 영향 히스토리 작성.

## 검증 완료

- 정적 재검증 PASS, 잔여 finding 0건.
- 백엔드 지정 101개 및 전체 194개 테스트 PASS.
- 프론트 프로덕션 빌드 PASS(정적 페이지 48/48); 기존 metadata.viewport 경고만 확인.
- 최초 프론트 검증에서 새 결과 테스트의 ESM import와 seq 중복 문제가 발견되어 테스트 파일을 수정했다.
- 프론트 단일 Jest 1개, 전체 Jest 7 suites/23 tests, TypeScript 모두 PASS.
- `20260717_04`, `20260717_05`를 로컬 `tpmp-db`에 적용했고 두 트랜잭션 모두 COMMIT.

## 수정한 파일

- 백엔드: `QuestionResultResponse.java`, `ExamHistoryDetail.java`, `Question.java`, `QuestionRepository.java`, `UserExaminationService.java`, `AnswerGrader.java` 및 관련 테스트 2개.
- 프론트: `ExamResultDisplay.tsx`, `ExamResultDisplay.test.tsx`, `types/index.ts`, `data/tableComments.ts`.
- DB·문서: `20260717_04_add_exam_history_detail_title.sql`, `20260717_05_regrade_2025_round2_q11_q19_q20.sql`, `db-guidelines.md`, 사용자 FE/BE 히스토리 4개.

## 데이터 적용 전 확인

- DB의 `EXAM_TYPE / 정보처리기사 실기 / 2025년 2회 / Q11·Q19·Q20` 활성 원본은 각 1개.
- 재채점 후보는 `exam_history.id=5`의 Q11·Q19·Q20 3건뿐이며 현재 17/20, 85점.
- 마이그레이션 적용 후 예상값은 20/20, 100점.

## 데이터 적용 결과

- `exam_history_details.title` 추가 및 기존 상세 80건 제목 백필 완료, 빈 제목 0건.
- 이력 5의 Q11·Q19·Q20만 `correct=true`로 보정됨.
- 이력 5는 상세 집계와 동일한 20/20, 100점으로 갱신됨.
- Q11 원본/시험지 정답은 올바른 두 분기 경로와 파이프 표기 대체답을 함께 보존한다.

## 실패·경고·주의사항

- 최종 실패 없음.
- 프론트 빌드에서 기존 `metadata.viewport` 경고가 반복됐으나 빌드와 정적 페이지 48/48 생성은 성공했다.
- 기존 미커밋 `ScratchPadPanel*`, `traceNotation*` 변경은 이번 작업에서 수정하지 않았다.

## 기존 작업 보존

- 이번 작업 직전 다중 트리 변경 3개 파일은 아직 미커밋 상태이므로 유지한다.
- `frontend/src/lib/traceNotation.ts`, `frontend/src/lib/traceNotation.test.ts`는 별도 기존 작업으로 수정하지 않는다.

## 다음 세션이 바로 실행할 명령

```powershell
git status --short
docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT id, total_questions, correct_count, score FROM exam_history WHERE id = 5;"
```
