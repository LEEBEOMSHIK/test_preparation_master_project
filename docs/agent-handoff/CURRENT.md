# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 2 Fix round 1의 이메일 템플릿 토큰 무결성·가시 본문 보안 finding 3건을 모두 해결한다.
- 고정 결정: 토큰은 여분 brace가 없는 정확한 `{{name}}`만 허용하고 raw→jsoup→sanitizer 전 구간에서 생성·복제·소실되지 않아야 한다.
- 고정 결정: 기존 `TPMP_TOKEN_{index}`와 `https://tpmp.invalid/TPMP_LINK_TOKEN` 보호 방식을 유지하되 placeholder별 예상 출현 횟수를 검증하고 실제 링크 토큰이 있을 때만 링크 placeholder를 등록한다.
- 고정 결정: 준비 및 렌더 정화 직후 가시 텍스트가 없으면 `INVALID_CONTENT`로 거부한다.

## 완료한 작업

- production 수정 전에 extra brace, 태그/엔티티 분할, placeholder 합성, 정화 후 빈 본문 회귀 테스트를 작성하고 18 tests 중 8 failures로 RED를 확인했다.
- 토큰 제거 무결성 self-review 회귀를 추가하고 19 tests 중 1 failure로 두 번째 RED를 확인했다.
- 토큰과 후보 정규식에 brace negative lookaround를 적용하고 남은 `{{`/`}}` 구간을 모두 거부했다.
- raw HTML과 jsoup 파싱 결과의 토큰 개수, 원본과 보호된 토큰 개수를 비교해 파싱 중 생성과 보호 전 소실을 거부했다.
- sanitizer 결과에서 직접 생성된 토큰 문법을 거부하고 일반/link placeholder의 예상 출현 횟수를 검증했다.
- 실제 링크 토큰이 있을 때만 링크 placeholder 복원 정보를 등록했다.
- 준비·렌더 정화 직후 `Jsoup.parse(...).text()`를 계산하고 whitespace·space separator·format 코드 포인트만 남으면 거부했다.
- script 전용, 외부 이미지 전용, `<p><br></p>`, NBSP/zero-width 전용 및 빈 변수 치환을 회귀 테스트로 고정했다.
- 관리자 백엔드 히스토리 `HIST-20260831-003`을 작성했다.
- Fix round 1 변경을 `[BE] fix: 이메일 템플릿 토큰 무결성 강화` 커밋 단위로 정리했다.

## 미완료 작업

- 없음. Fix round 1 구현·검증·히스토리·커밋·보고서 작성을 완료했다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java`
- `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- 최초 RED: `cd backend; .\gradlew.bat test --tests com.tpmp.testprep.service.EmailTemplateRendererTest --rerun-tasks`
  - 결과: 18 tests, 8 failures, 0 errors; extra brace, placeholder 병합, 엔티티 생성 토큰, 정화 후 빈 본문 4종, 렌더 후 빈 본문이 예상대로 실패했다.
- 토큰 소실 RED: 동일 focused 명령
  - 결과: 19 tests, 1 failure, 0 errors; sanitizer가 주석 토큰을 조용히 제거해 실패했다.
- 최종 focused GREEN: 동일 focused 명령
  - 결과: 19 tests, failures 0, errors 0, skipped 0, `BUILD SUCCESSFUL in 14s`.
- backend 전체 회귀: `cd backend; .\gradlew.bat test --rerun-tasks`
  - 결과: 모든 backend 테스트 태스크 재실행, `BUILD SUCCESSFUL in 1m 4s`.
- 정적 점검: `git diff --check`, 대상 Java 120자 초과 및 금지 패턴 검색
  - 결과: 오류 없음.

## 실패·경고·주의사항

- Gradle 9 호환 deprecated 경고, 기존 `ExamQuestionSyncServiceTest` unchecked 경고, JVM class sharing 경고가 있으나 테스트 실패는 없다.
- 일반 텍스트에 `TPMP_TOKEN_<숫자>` 또는 링크 placeholder 고정 문자열을 직접 넣으면 예약값 충돌로 거부한다. sanitizer 경계 병합 공격과 안전하게 구분하기 위한 의도된 제약이다.
- 다른 Task 파일, `frontend/node_modules`, `backend/uploads`, DB 볼륨은 건드리지 않았다.

## 다음 세션이 바로 실행할 명령

Task 3 brief 확인: `Get-Content -Raw .superpowers/sdd/2026-08-31-admin-email-template-management/task-3-brief.md`
