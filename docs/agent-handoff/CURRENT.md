# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 시험 결과/데일리 퀴즈 채점·표시 정확도 개선 3건(이미지 img.png/img_1/img_2 기반).
  - Issue A: 정답이 `(1) X / (2) Y` 괄호 숫자 마커 형태면 사용자의 `X,Y` 입력이 오답 처리되던 버그.
  - Issue B: 코드 조건 정답의 `||`(논리 OR)가 대체정답 구분자로 오인 → **문항별 OFF 플래그**로 해결(사용자 결정).
  - Issue C: Q7이 SHORT_ANSWER라 SQL 결과표 격자 입력이 안 됨 → **SQL 유형 전환 + 결과표 정답 세팅**(사용자가 "둘 다 네가 세팅" 결정).

## 완료한 작업 (커밋됨)

- Issue A + B는 한 커밋으로 완료(파일 공유로 분리 불가).
  - A: `AnswerGrader.extendedEnumerationToSeparators`/`ENUMERATION_MARKER`/`normalizeOptionToken` + 프론트 `answer.ts.normalizeOptionToken`에 괄호 숫자 마커 `(N)` 인식.
  - B: `disableAlternativeAnswer` 플래그 — 마이그레이션(question_bank·questions·exam_history_details), 엔티티·DTO·서비스·관리자 토글 UI·프론트 표시(`formatAnswerAlternatives` 2번째 인자)·채점 오버로드. Q15(question_bank 75 / questions 35 / exam_history_details) 플래그 true 적용.

- Issue C 완료: Q7(question_bank 67 + 시험 스냅샷 questions 27)을 SQL 유형으로 전환 + `sql_data`(tables emp·sal + expectedResult 컬럼 [name, incentives]·행 [이순신, 1000]) 세팅. 마이그레이션 `20260718_03_q7_sql_result_table.sql` 신규 + 로컬 적용. 채점은 `isSqlResultTableCorrect`로 라우팅, 격자 입력은 `sqlResultColumns`(ExaminationQuestionView·QuizQuestionView 노출)로 표시됨.

## 미완료 작업

- 없음(A·B·C 모두 완료). 브라우저 육안 확인만 남음 — Q7 격자 입력·Q15 정답 전체 표시·괄호 마커 채점.

## 검증 (A+B)

- 백엔드 `./gradlew test --tests "*AnswerGrader*" *UserQuizServiceTest* *QuestionBankServiceTest* *ExamServiceStructuredQuestionTest* *UserExamination*`: BUILD SUCCESSFUL.
- 프론트 `npx tsc --noEmit`: 오류 0 · `npx jest answer`: 통과.
- 마이그레이션 `20260718_02_disable_alternative_answer.sql` 로컬 tpmp-db 적용 완료(3개 테이블 컬럼 존재 확인).
- 히스토리 4개 파일 순수 prepend(삭제 0) 확인.

## 실패·경고·주의사항

- 하위 에이전트가 세션 한도(4:40pm KST 리셋)로 B 마지막 검증 단계에서 중단 → 메인이 이어서 검증 완료.
- ddl-auto=validate 환경이므로 배포 시 `20260718_02` 마이그레이션을 기동 전 적용해야 함.
- Issue C 착수 시 SqlData 구조·expectedResult JSON 포맷을 기존 SQL 문항에서 확인 후 동일하게 작성할 것.

## 다음 세션이 바로 실행할 명령

```powershell
git status --short --branch
docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT id, question_type, (sql_data IS NOT NULL) FROM question_bank WHERE id=67;"
```

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- `codex-config-tui-notify.tmp` — 기존 미추적 파일(내 작업 아님), 커밋·삭제 금지.
- 신규 마이그레이션 파일은 의도된 산출물이므로 삭제하지 않는다.
