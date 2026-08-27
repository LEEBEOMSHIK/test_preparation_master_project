# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-28

## 현재 목표와 사용자 결정 사항

- 문의·요청 워크플로 Task 1~5와 리뷰 수정 Round 2를 하나의 최종 상태로 마무리한다.
- 사용자·관리자 모두 `문의·요청` 용어와 대화형 메시지, 유형별 상태 계약을 사용한다.
- SMTP 실패는 업무 저장을 롤백하지 않고 발송 이력을 FAILED로 남겨 관리자가 재발송한다.

## 완료한 작업

- DB 이관, 문의 유형·상태·메시지·첨부·알림 설정·메일 발송 이력 도메인을 구현했다.
- 사용자 목록·등록·상세·추가 메시지·빠른 버그 신고를 새 계약으로 전환했다.
- 관리자 서버 필터 목록, 타임라인 상세, 중간 답변, 유형별 종료·재열기, 발송 이력·재발송, 수신 설정 화면을 구현했다.
- 관리자 keyword를 제목·본문·작성자명에 바인딩 검색하고 대시보드 미처리 버그를 PENDING/IN_PROGRESS/ON_HOLD 전체로 집계했다.
- 사용자 핵심 payload와 종료 작성기·메시지 첨부 회귀 테스트, 관리자 상세·설정 테스트, 백엔드 서비스 테스트를 보강했다.
- 메뉴 표시명과 DB 테이블 설명, 사용자/관리자 4개 히스토리 및 Task 4/5 보고서를 최종 상태로 갱신했다.
- API 메뉴 트리도 exact URL 기준으로 정규화해 구형 `1:1 문의` 표기가 내비게이션에 노출되지 않게 했고, 관리자 프론트 히스토리의 orphan 헤더를 실제 본문 위치로 옮겼다.

## 미완료 작업

- 없음.

## 수정한 파일

- `frontend/src/app/user/inquiries/**`, `frontend/src/components/ui/{BugReportModal,InquiryMessageComposer}*`
- `frontend/src/app/admin/inquiries/**`, `frontend/src/services/inquiryService.ts`
- `frontend/src/components/layout/{UserLayoutShell,AdminLayoutShell}.tsx`, `frontend/src/data/tableComments.ts`
- `backend/src/main/java/com/tpmp/testprep/{controller,service,repository,entity,dto,event,config}/` 문의·요청 관련 파일
- `backend/src/test/java/com/tpmp/testprep/service/{InquiryServiceTest,DashboardServiceTest}.java`
- `docs/history/{front,back}/{usr,adm}/` 문의·요청 히스토리 4개

## 실행한 검증 명령과 결과

- 메뉴 정규화를 포함한 문의 관련 Jest 10 suites, 25 tests 통과.
- `frontend\node_modules\.bin\tsc.cmd --noEmit` 통과.
- `backend\gradlew.bat test --tests com.tpmp.testprep.service.InquiryServiceTest --tests com.tpmp.testprep.service.DashboardServiceTest` 통과.
- 이전 통합 커밋에서 전체 백엔드 테스트, 전체 프론트 Jest 14 suites/70 tests, Next.js 52페이지 빌드 통과.

## 실패·경고·주의사항

- SMTP 실제 발송에는 `MAIL_HOST` 등 운영 환경변수가 필요하며 미설정 시 delivery는 의도대로 FAILED가 된다.
- Gradle 최초 sandbox 실행은 배포본·플러그인 네트워크 차단으로 중단되어 승인된 실행 환경으로 재검증했다.
- Next.js 빌드에는 기존 전역 metadata viewport 경고가 남아 있으나 문의 기능 오류는 아니다.

## 다음 세션이 바로 실행할 명령

```powershell
cd C:\projects\test_preparation_master_project\.worktrees\feature-inquiry-workflow
git status --short --branch
git log -1 --oneline
```

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- 기본 체크아웃의 사용자 변경 파일 일체
- 이 worktree 밖의 다른 작업자 변경
