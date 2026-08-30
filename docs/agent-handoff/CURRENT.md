# 현재 작업 인계

- 갱신일: 2026-08-31
- 현재 목표: 문의 등록의 HTTP 409 처리 및 이미지 업로드 UX 개선 사항을 main 로컬에 병합한 완료 상태를 기록한다.
- 사용자 결정 사항: 기능 커밋과 로컬 main 병합은 완료했다. 원격 `push`는 아직 요청되지 않아 미수행이며, 잔여 worktree 디렉터리는 별도 정책 검토·승인 전까지 건드리지 않는다.

## 완료한 작업

- main에 병합 커밋 `e30a334`가 반영되었으며, 기능 커밋은 `ea5c764`, `305f4e8`이다.
- 문서 커밋 전 기준으로 `main...origin/main`은 로컬이 3커밋 앞선 상태다. 이 인계 문서를 별도 커밋하면 4커밋 앞선 상태가 된다.
- Git worktree 등록을 제거했고 `fix/inquiry-report-upload-ux` 브랜치도 삭제했다.
- 로컬 DB에서 legacy `inquiry_type`를 제거했으며 `request_type`은 `NOT NULL`로 유지했다.
- 정적 verifier는 GO 판정이며, 다크모드 시각 점검도 완료했다.

## 수정 파일 목록

- `AGENTS.md` — 공용 UI 컴포넌트 안내를 갱신.
- `backend/src/main/java/com/tpmp/testprep/config/InquirySchemaMigrationRunner.java` — 현재 스키마의 legacy `inquiry_type`을 멱등 제거하고 `request_type` 데이터는 변경하지 않음.
- `backend/src/test/java/com/tpmp/testprep/config/InquirySchemaMigrationRunnerTest.java` — 스키마 마이그레이션 동작을 검증.
- `docs/history/back/usr/UserInquiry_Modified.md` — 사용자 문의 백엔드 수정 이력을 기록.
- `docs/history/front/usr/UserInquiry_Modified.md` — 사용자 문의 프론트엔드 수정 이력을 기록.
- `frontend/src/app/user/inquiries/new/page.tsx` — 문의 등록 화면의 409 처리와 이미지 업로드 UX를 반영.
- `frontend/src/app/user/inquiries/new/page.test.tsx` — 문의 등록 화면 동작을 검증.
- `frontend/src/components/ui/InquiryImageUploader.tsx` — 신규 공용 이미지 업로더를 추가.
- `frontend/src/components/ui/InquiryImageUploader.test.tsx` — 이미지 업로더 동작을 검증.
- `frontend/src/components/ui/InquiryMessageComposer.tsx` — 문의 메시지 작성기에 이미지 업로드 UX를 반영.
- `frontend/src/components/ui/InquiryMessageComposer.test.tsx` — 메시지 작성기 동작을 검증.
- `docs/agent-handoff/CURRENT.md` — 최신 병합·검증·운영 상태 스냅샷으로 갱신.

## 검증 결과

- 백엔드 전체 테스트: `BUILD SUCCESSFUL` (341 tests).
- 프론트엔드 타입 검사: `npx tsc --noEmit` PASS.
- 프론트엔드 Jest: 26 suites / 119 tests PASS.
- 프론트엔드 빌드: 55 pages PASS.
- 현재 main 서버 상태: FE session `85008`, port 3000, HTTP 200. BE session `13596`, port 8080 LISTEN. BE health의 401 응답은 인증 정책에 따른 정상 동작이다.
- 이번 인계 문서는 문서만 수정했으므로 빌드·테스트를 재실행하지 않는다. 내용·링크 및 `git diff --check`를 확인 대상으로 둔다.

## 실패·경고·주의사항

- `C:\projects\test_preparation_master_project\.worktrees\inquiry-report-upload-ux` 실제 잔여 디렉터리는 `git worktree remove`가 Windows `Invalid argument`로 삭제하지 못한 상태다.
- [`CACHE_POLICY.md`](../../CACHE_POLICY.md)의 uploads/node_modules/source/docs 보존 규칙 때문에 해당 디렉터리를 재귀 삭제해서는 안 된다.
- 기존 경고: Next metadata viewport, Gradle unchecked/CDS, LF-CRLF.

## 미완료 작업

- 원격 `push`는 사용자 요청이 없어 미수행이다.
- 실제 잔여 worktree 디렉터리는 정책상 보존한다.
- 서버 업로드 파일 정리 API 부재는 이번 작업 범위 밖이다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- `C:\projects\test_preparation_master_project\.worktrees\inquiry-report-upload-ux` 및 그 하위 보존 대상은 별도 정책 준수 조사와 사용자 승인 전까지 수정·삭제하지 않는다.
- 기존 사용자 변경 및 미추적 파일은 건드리지 않는다.

## 다음 작업

- 사용자가 요청하면 `git push`를 실행한다.
- 잔여 worktree 폴더 처리는 별도 정책 준수 조사 및 사용자 승인 후 진행한다.
- 다음 확인 명령: `git diff --check`.
