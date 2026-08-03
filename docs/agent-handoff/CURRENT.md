# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-03

## 현재 목표와 사용자 결정 사항

- "문항관리 화면에서 어떤 시험에서 사용되는 문항인지 조회 필터·컬럼이 안 되고, 시험 유형도 추가해야 할 것 같다" 요청 처리.
- 사용자가 표시 방식/필터 방식 선택: "사용 시험" 컬럼에 시험명 배지 표시(추천안) + 필터는 "특정 시험명 선택 드롭다운"과 "사용여부(사용중/미사용) 드롭다운" 둘 다.

## 완료한 작업

1. **백엔드**: `QuestionBankResponse`에 `usedInExams`(연결된 examinations 제목 목록) 필드 추가. `QuestionRepository.findUsedExaminationTitlesByQuestionBankIds`로 `Question`↔`Examination`을 `exam = examPaper`로 조인해 일괄 조회(N+1 방지). `QuestionBankService.getQuestions`/`getQuestion`에 반영.
2. **프론트**: `admin/exams/questions` 목록에 "시험 유형" 필터·컬럼(기존에 응답에는 있었지만 화면에 미노출이었음), "사용 시험"(특정 시험 선택)·"사용 여부"(사용중/미사용) 필터·컬럼(시험명 배지) 추가.
3. **부수 발견·수정**: 검증 중 문항 목록이 `adminGetQuestions(0, 500)` 고정 size라 총 문항(629) > 500이 되며 뒤 129건이 누락되던 버그 발견 → `totalPages`만큼 순회해 전체 로드하도록 수정.
4. **테스트**: `QuestionBankServiceTest`가 생성자 시그니처 변경(QuestionRepository 인자 추가)으로 컴파일 실패 → `@Mock QuestionRepository` 추가해 수정.
5. **문서화**: `docs/history/back/adm/AdminQuestion_Modified.md`(HIST-20260803-002), `docs/history/front/adm/AdminQuestion_Modified.md`(HIST-20260803-002) 추가.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava` / `./gradlew test` | 통과 |
| `npx tsc --noEmit` | 통과 |
| 백엔드 재기동 후 API | `GET /api/admin/questions`에서 리눅스마스터 1급 문항 `usedInExams:["2023년 1회 리눅스마스터 1급"]` 정상 반영 |
| 브라우저 e2e (Chrome MCP, admin 로그인 후 실제 화면) | 시험 유형=리눅스마스터 1급 → 105건(정확), +사용여부=미사용 → 5건(회차정보 없는 개별 문항 수와 정확히 일치). 전체 문항 수 500→629로 정상화 확인 |

## 미완료 작업

- 변경 파일 전부 **미커밋** — 사용자 승인 필요:
  - `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java`
  - `backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java`
  - `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
  - `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java`
  - `frontend/src/app/admin/exams/questions/page.tsx`
  - `frontend/src/types/index.ts`
  - `docs/history/back/adm/AdminQuestion_Modified.md`
  - `docs/history/front/adm/AdminQuestion_Modified.md`
  - `docs/agent-handoff/CURRENT.md` (본 파일)

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java `
        backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java `
        backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java `
        backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java `
        frontend/src/app/admin/exams/questions/page.tsx `
        frontend/src/types/index.ts `
        docs/history/back/adm/AdminQuestion_Modified.md `
        docs/history/front/adm/AdminQuestion_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE][BE] feat: 문항관리 시험 유형·사용 시험 필터·컬럼 추가"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 이번 변경 반영 재기동 완료, 로그 `/tmp/backend4.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log`

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- `useColumnResize` localStorage 키가 `v2`→`v3`로 바뀌었다 — 사용자 브라우저의 기존 v2 저장값은 자연히 무시되고 새 기본 너비로 시작한다(의도된 동작, 데이터 손실 아님).
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용, 이전 세션에서 처리).
