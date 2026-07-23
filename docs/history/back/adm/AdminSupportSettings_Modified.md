## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 백엔드 / 후원 링크 관리(신규)
- **수정 개요**: "개발자 응원하기" 페이지(`/user/support`)의 토스·카카오페이·카카오 선물하기 위시리스트 3개 링크를 프론트 코드 상수 대신 관리자 화면에서 관리할 수 있도록 단일 행(싱글톤) 설정 엔티티 `SupportSettings`와 Controller-Service-Repository 3레이어, 관리자용 조회/수정 API를 신규 구현. `/admin/support-settings` 관리자 메뉴도 `DataInitializer`로 시딩.
- **관련 작업**: 사용자용 조회 API는 `docs/history/back/usr/UserSupport_Modified.md` HIST-20260722-001, 관리자/사용자 프론트엔드는 `docs/history/front/adm/AdminSupportSettings_Modified.md`·`docs/history/front/usr/UserSupport_Modified.md` HIST-20260722-002 참고. DB 마이그레이션은 `docs/db-migration/20260722_06_create_support_settings.sql`.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/SupportSettings.java` | 추가 | 단일 행 설정 엔티티 — `tossUrl`/`kakaopayUrl`/`kakaoGiftUrl`/`updatedAt`, `update(...)` 메서드 |
| `backend/src/main/java/com/tpmp/testprep/repository/SupportSettingsRepository.java` | 추가 | `JpaRepository` + `findFirstByOrderByIdAsc()` |
| `backend/src/main/java/com/tpmp/testprep/service/SupportSettingsService.java` | 추가 | `get()`/`update(request)` — 행이 없으면 `findOrCreate()`로 빈 값 자동 생성 후 반환(관대한 처리) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/SupportSettingsResponse.java` | 추가 | `tossUrl`/`kakaopayUrl`/`kakaoGiftUrl` record, `from()`/`empty()` |
| `backend/src/main/java/com/tpmp/testprep/dto/request/SupportSettingsRequest.java` | 추가 | 동일 3필드, 각 `@Size(max=500)`, URL 형식 강제 검증 없음(자유 입력) |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminSupportSettingsController.java` | 추가 | `GET/PUT /api/admin/support-settings`, `@PreAuthorize("hasRole('ADMIN')")` |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureSupportSettingsMenu()` 추가(멱등, `existsByUrl` 가드) — "후원 링크 관리"(`/admin/support-settings`, icon `support`, order 12) ADMIN 메뉴 시딩, `run()`에 `ensurePracticeAdminMenus()` 다음 호출 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/SupportSettingsServiceTest.java` | 추가 | 행 없을 때 자동 생성, 있을 때 재사용, 수정 시 기존 행 in-place 갱신(중복 저장 없음) 검증 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/SupportSettings.java` (신규)
- `@Table(name = "support_settings")`, `id` 외 3개 nullable URL 컬럼(`length = 500`) + `updatedAt`(`@PrePersist`/`@PreUpdate`).
- 이유: `ExamInfo`/`Quote`처럼 관리자가 편집하는 콘텐츠지만 값이 여러 행이 아니라 사이트 전역 1세트만 필요 — 단일 행(싱글톤) 패턴으로 설계.

#### `backend/src/main/java/com/tpmp/testprep/service/SupportSettingsService.java` (신규)
- `findOrCreate()`(`@Transactional`)가 `findFirstByOrderByIdAsc()`로 조회하고 없으면 빈 값으로 1건 저장 후 반환 — 관리자가 초기 마이그레이션 INSERT를 건너뛰었거나 다른 환경에 아직 행이 없어도 500 에러 없이 동작.
- `update(request)`는 조회한 엔티티를 `.update(...)`로 in-place 수정(더티 체킹, 별도 save 호출 없음).

#### `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- 변경 전: `run()`에서 `ensurePracticeAdminMenus();` 다음 바로 `ensureUserMenuGroups();` 호출.
- 변경 후: 그 사이에 `ensureSupportSettingsMenu();` 추가. 메서드 본문은 `ensureExamInfoMenus()`와 동일한 `existsByUrl` 가드 + `saveMenu(null, "후원 링크 관리", "/admin/support-settings", "support", 12, MenuConfig.MenuType.ADMIN, "ADMIN")`.
- 이유: 관리자 메뉴가 DB(`menu_config`) 기반으로 시딩되는 기존 관례(`ensureExamInfoMenus`, `ensureAdminUsersMenu` 등)를 그대로 따름. order 12는 기존 최대값(연습장 관리=11, 테스트 케이스=99)과 충돌하지 않는 값으로 선택. `ensurePermissionMenuAssociations()`가 매 기동 시 ADMIN 메뉴에 MASTER_ADMIN 권한을 자동 부여하므로 별도 권한 연결 코드는 불필요.

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시:
1. 위 표의 "추가" 파일 5개(entity/repository/service/dto 2개/controller) 및 테스트 파일 삭제.
2. `DataInitializer.java`에서 `ensureSupportSettingsMenu()` 메서드와 `run()`의 호출 라인 제거.
3. DB에서 `/admin/support-settings` 메뉴 행 및 `support_settings` 테이블 삭제(`docs/db-migration/20260722_06_create_support_settings.sql` 하단 ROLLBACK 참고).
