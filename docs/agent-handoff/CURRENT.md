# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 시험 제출 직후·과거 시험 이력·데일리 퀴즈 완료 결과의 각 문항에서 복습 표시를 추가·해제한다.
- 시험지 `questionId`를 문제은행 ID로 추정하지 않고 명시적인 nullable `questionBankId`만 사용한다.
- `exam_history_details.question_bank_id`에 제출 시점 원본 ID를 FK 없이 스냅샷으로 저장한다.
- 원본 문제은행이 없는 수동 문항에는 복습 버튼과 북마크 API 호출을 생략한다.

## 완료한 작업

- DB 컬럼 추가, 기존 NULL 이력 보강, 검증 실패 시 강제 롤백, 수동 롤백을 포함한 재실행 안전 마이그레이션을 작성했다.
- 백엔드 엔티티·DTO·제출 저장 로직에 nullable `questionBankId`를 연결하고 회귀 테스트를 보강했다.
- 공용 결과 화면에 초기 북마크 조회, 결과 변경·언마운트 경쟁 방지, ID별 중복 토글 차단, 오류 안내·재시도, 앰버 별 버튼을 구현했다.
- 목록 로딩·조회 실패 상태를 명시적으로 구분하고 상태가 확인되기 전에는 모든 복습 토글을 잠근다.
- pending ID는 결과 전환 중에도 완료까지 유지하며, ID별 변경 버전으로 늦은 목록 응답이 성공한 토글 상태를 덮어쓰지 않게 했다. 이전 결과의 오류는 버리고 새 결과에도 같은 ID가 있으면 성공 상태를 반영한다.
- 현재 결과 ID와 mounted 상태는 브라우저·JSDOM의 layout effect(SSR은 일반 effect)에서 커밋 시점에만 갱신하고, 언마운트 cleanup에서 즉시 비활성화한다.
- 언마운트 뒤 deferred 목록·토글 resolve/reject, 동일 ID 토글 성공 뒤 stale 목록, 현재 결과 밖 ID의 다음 결과 비누출 회귀 테스트를 추가했다. 결과 밖 ID 테스트는 두 번째 조회 완료 전 비활성·미확인 aria와 비활성 별 테마까지 확인한다.
- 모바일에서도 `복습 표시`·`복습 표시됨` 및 로딩·확인 필요 상태 텍스트를 항상 표시한다.
- 아코디언과 복습 버튼을 형제 버튼으로 구성하고, 중복 문제은행 ID가 같은 상태를 공유하게 했다.
- 데일리 퀴즈 결과에 `QuizQuestion.id`를 명시적인 `questionBankId`로 매핑했다.
- 사용자 BE/FE 및 데일리 퀴즈 수정 히스토리 `HIST-20260718-001`을 작성했다.
- `git diff --check`와 DTO 직접 생성자 사용처 검색을 통과했다.

## 미완료 작업

- 운영·스테이징 DB에는 배포 시 동일 마이그레이션을 애플리케이션 기동 전에 적용해야 한다.

## 완료 커밋

- `cb667dc [FE|BE] feat: 시험 완료 문항 복습 표시 추가`

## 수정한 파일

- `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java`
- `backend/src/main/java/com/tpmp/testprep/entity/Question.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionResultResponse.java`
- `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java`
- `backend/src/test/java/com/tpmp/testprep/service/UserExaminationSessionLifecycleTest.java`
- `frontend/src/types/index.ts`
- `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- `frontend/src/components/ui/ExamResultDisplay.tsx`
- `frontend/src/components/ui/ExamResultDisplay.test.tsx`
- `frontend/src/data/tableComments.ts`
- `docs/db-migration/20260718_01_add_exam_history_question_bank_id.sql`
- `docs/db-guidelines.md`
- `docs/history/back/usr/UserExamination_Modified.md`
- `docs/history/front/usr/UserExamination_Modified.md`
- `docs/history/front/usr/DailyQuiz_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 확인 명령과 결과

- `git diff --check`: 통과.
- `rg -n "new QuestionResultResponse\\(" backend/src/main backend/src/test`: 팩토리 내부 2곳만 존재해 필드 순서 누락 없음.
- `rg -n "questionBankId|question_bank_id" ...`: DTO·엔티티·서비스·FE 타입·결과 UI·테스트·문서 연결 확인.
- `rg -n "pendingBookmarkIdsRef.current.clear|hidden sm:inline|RAISE EXCEPTION|isBookmarkStateUnknown|aria-busy" ...`: pending 강제 초기화·모바일 텍스트 숨김이 제거됐고 unknown/로딩 접근성 및 강제 롤백이 존재함을 확인.
- `rg -n "visibleQuestionBankIdsRef.current\\s*=|useCommittedLayoutEffect|mountedRef.current" ...`: visible ref 할당이 커밋 effect 내부와 언마운트 cleanup에만 존재함을 확인.
- webapp-verifier 최종 독립 정적 검증: PASS, 잔여 finding 0건.
- 백엔드 지정 테스트 5개 및 전체 194개: PASS.
- 프론트 `ExamResultDisplay` 16개 및 전체 Jest 7 suites/38 tests: PASS.
- `npx.cmd tsc --noEmit`: PASS.
- `npm.cmd run build`: PASS, 정적 페이지 48/48 생성.
- 로컬 `tpmp-db`에 `20260718_01_add_exam_history_question_bank_id.sql` 적용: COMMIT.
- 기존 이력 80건 `question_bank_id` 백필, 미해결 0건, 현재 `questions.source_question_bank_id`와 불일치 0건.
- 이력 5의 Q11/Q19/Q20은 문제은행 51/59/60과 각각 연결되고 모두 정답 상태임을 확인.

## 실패·경고·주의사항

- `ddl-auto=validate` 환경이므로 `20260718_01_add_exam_history_question_bank_id.sql`을 애플리케이션 기동보다 먼저 적용해야 한다.
- 기존 이력 중 `questions` 행 또는 `source_question_bank_id` 연결이 없는 행은 의도대로 `questionBankId = null`이며 복습 버튼이 표시되지 않는다.
- 초기 북마크 조회는 결과 변경당 1회이며, 사용자가 실패 안내의 `다시 시도`를 누른 경우에만 추가 호출한다.
- 목록 조회 실패는 북마크 미등록으로 간주하지 않는다. 버튼은 `상태 확인 필요`로 잠기며 상단 `다시 시도` 성공 후에만 활성화된다.
- 마이그레이션 보강 검증에서 해결되지 않은 연결 가능 행이 있으면 `RAISE EXCEPTION`으로 컬럼 추가와 보강 전체가 롤백된다.
- 기존 Gradle deprecated/unchecked/JVM class sharing 경고와 Next.js `metadata.viewport` 경고가 있으나 신규 실패는 없다.

## 다음 세션이 바로 실행할 명령

```powershell
git status --short --branch
docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT count(question_bank_id), count(*) FROM exam_history_details;"
```

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- 이번 작업 범위 밖 파일은 수정하지 않는다.
- 신규 마이그레이션 파일은 의도된 미추적 파일이므로 삭제하지 않는다.
