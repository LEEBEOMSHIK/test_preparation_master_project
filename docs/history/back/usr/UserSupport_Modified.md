## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 백엔드 / 개발자 응원하기(후원) 링크 조회
- **수정 개요**: `/user/support` 페이지가 프론트 코드 상수 대신 서버에서 후원 링크(토스/카카오페이/카카오 선물하기)를 조회하도록 사용자용 조회 API 신규 추가.
- **관련 작업**: 엔티티/서비스/관리자 API는 `docs/history/back/adm/AdminSupportSettings_Modified.md` HIST-20260722-001 참고.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserSupportSettingsController.java` | 추가 | `GET /api/user/support-settings` — 로그인 사용자면 누구나 조회 가능(관리자 권한 불필요), `SupportSettingsService.get()` 재사용 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/controller/UserSupportSettingsController.java` (신규)
- `@RequestMapping("/api/user/support-settings")`, `@PreAuthorize` 없음 — `SecurityConfig`의 `/api/user/**` → `authenticated()` 전역 규칙에 위임(기존 `UserExamInfoController`와 동일 패턴).
- `AdminSupportSettingsController`와 동일하게 `SupportSettingsService`를 그대로 재사용하므로 서비스/엔티티 레이어 중복 없음.

### 복원 방법
이 ID(HIST-20260722-001)로 복원 시 `UserSupportSettingsController.java` 파일 삭제(서비스 레이어는 관리자 API도 사용하므로 유지).
