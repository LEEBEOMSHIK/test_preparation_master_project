# Agent Handoff - CURRENT

## Current Goal

- 2026년 1회 3번(DB 설계 절차)·18번(SQL JOIN·서브쿼리) 문항을 이미지 → 구조·데이터로 치환 — **완료, 커밋 대기**.
- (이전 작업들, 모두 커밋 대기) ① 채점 오류 수정(`AnswerGrader` + 데이터) ② 로그인 화면 다크모드 토글.

## Completed

- 문항 구조화(데이터만, 코드 변경 없음): `question_bank` id=3·18과 `questions` id=83·98(exam_id=5)의 content를 이미지에서 HTML 구조(세로 흐름/테이블)로, 3번은 options+슬롯 정답(`4,2,3,5,1`), 18번은 SQL을 `code`(`language='sql'`)로 이동, 해설 추가. 덤프 동기화. 상세: `docs/history/back/adm/QuestionBank_Modified.md` HIST-20260717-001.
- `AnswerGrader` 채점 개선: 열거 마커 확장(`ㄱ.`·`①`·`a.`) + 괄호 대체 표기 1:1 매칭 + 느슨 폴백 마커 제거. 상세: `docs/history/back/usr/UserExamination_Modified.md` HIST-20260717-001.
- `AnswerGraderTest`: 사례 재현·회귀 테스트 11건 추가, 기존 실패 1건(`code_commaSeparatedNotSplit_incorrect`) 현행 정책으로 갱신.
- 데이터 수정(로컬 DB): `questions` id=86·90, `question_bank` id=6·10 정답에 괄호 대체 표기 추가. `docs/sql/tpmp_content_data.sql` 덤프에도 동기화(4개 INSERT).
- 다크모드 토글: `ThemeToggle` 공용 추출 + 사용자/관리자 로그인 페이지 적용 (히스토리: `docs/history/front/usr|adm/Login_Modified.md`).

## Modified Files

- `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java`
- `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java`
- `docs/sql/tpmp_content_data.sql`
- (직전 작업) `frontend/src/components/ui/ThemeToggle.tsx`(신규), `UserLayoutShell.tsx`, `AdminLayoutShell.tsx`, `user/login/page.tsx`, `admin/login/page.tsx`, `CLAUDE.md`
- 히스토리 4건 + 본 파일

## Verification

- `.\gradlew.bat test --tests "*.AnswerGraderTest"`: 통과
- `.\gradlew.bat test` (전체): BUILD SUCCESSFUL — 이전에 실패하던 1건 포함 전부 통과
- `cd frontend; npx tsc --noEmit`: 오류 0건 (다크모드 작업)
- DB 확인: questions 86·90, question_bank 6·10 answer 갱신 확인 쿼리 실행 완료

## Warnings / Notes

- 백엔드가 기동 중이면 재시작 없이 다음 채점부터 새 로직 적용(코드는 재시작 필요 — **백엔드 재시작 후 화면에서 재채점 확인 필요**).
- options 채점(빈칸 순서 비교) 경로는 프론트 `lib/answer.ts`와 규칙 동기화 때문에 의도적으로 변경하지 않음(숫자 마커만 유지).
- 이미지 사례 중 Q2(Bridge/Observer)·Q11(CIDR)은 코드 수정만으로, Q6(HDLC)·Q10(FOREIGN KEY)은 코드+데이터 수정으로 해결.
- 브라우저 육안 확인(시험 재응시 채점, 로그인 다크모드 토글)은 미실시.

## Next Commands

```powershell
# 백엔드 재시작 후 시험(exam_id=5) 재제출로 4개 문항 정답 처리 확인

# 커밋 (사용자 승인 후 — FE/BE 분리 커밋 권장)
git add frontend/src CLAUDE.md docs/history/front docs/agent-handoff
git commit -m "[FE] feat: 사용자·관리자 로그인 화면 다크모드 토글 추가"
git add backend/src docs/sql docs/history/back docs/agent-handoff
git commit -m "[BE] fix: 채점 열거 마커 확장(ㄱ.·①·a.) 및 괄호 대체 표기 인정"
```

## Do Not Touch

- `.env` (로컬 전용, 커밋 금지).
- `references/images/*` — 사용자가 넣어둔 참고 이미지, 삭제·이동 금지.
