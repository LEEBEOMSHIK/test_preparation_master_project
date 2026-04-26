## HIST-20260426-013

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 계정 관리
- **수정 개요**: 계정 관리 기능 신규 구현 — 사용자/관리자 계정 목록 조회, 상세 조회, 정보 수정, 비밀번호 재설정, 삭제 API + DataInitializer에 계정 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/User.java` | 수정 | `updateName()`, `updateRole()`, `updatePassword()` 메서드 추가 |
| `repository/UserRepository.java` | 수정 | `findAllByOrderByCreatedAtDesc()`, `findAllByRoleOrderByCreatedAtDesc()` 추가 |
| `dto/response/AdminUserResponse.java` | 추가 | 관리자용 사용자 응답 DTO (id, email, name, role, createdAt) |
| `dto/request/UserUpdateRequest.java` | 추가 | 이름/역할 수정 요청 DTO |
| `dto/request/PasswordResetRequest.java` | 추가 | 비밀번호 재설정 요청 DTO |
| `service/AdminUserService.java` | 추가 | 계정 관리 서비스 (getAll, getByRole, getOne, update, resetPassword, delete) |
| `controller/AdminUserController.java` | 추가 | `/api/admin/users` CRUD + 비밀번호 재설정 엔드포인트 |
| `config/DataInitializer.java` | 수정 | `ensureAdminUsersMenu()` 추가 — `/admin/users` 메뉴 존재 여부 확인 후 삽입 |

### 수정 상세

#### `entity/User.java`
- **변경 전**: setter 없음 (Lombok `@Getter` 전용)
- **변경 후**: 다음 3개 메서드 추가
  ```java
  public void updateName(String name) { this.name = name; }
  public void updateRole(Role role) { this.role = role; }
  public void updatePassword(String encodedPassword) { this.password = encodedPassword; }
  ```

#### `repository/UserRepository.java`
- **변경 전**: `findByEmail`, `existsByEmail`, `countByRole` 3개
- **변경 후**: 2개 메서드 추가
  ```java
  List<User> findAllByOrderByCreatedAtDesc();
  List<User> findAllByRoleOrderByCreatedAtDesc(User.Role role);
  ```

#### `dto/response/AdminUserResponse.java` (신규)
```java
public record AdminUserResponse(Long id, String email, String name, String role, LocalDateTime createdAt) {
    public static AdminUserResponse from(User u) { ... }
}
```

#### `dto/request/UserUpdateRequest.java` (신규)
```java
public record UserUpdateRequest(
    @NotBlank @Size(max = 100) String name,
    @NotNull User.Role role
) {}
```

#### `dto/request/PasswordResetRequest.java` (신규)
```java
public record PasswordResetRequest(
    @NotBlank @Size(min = 8, max = 100) String newPassword
) {}
```

#### `service/AdminUserService.java` (신규)
- `getAll()`: 전체 계정 최신순 조회
- `getByRole(role)`: 역할별 필터링 조회
- `getOne(id)`: 단건 조회
- `update(id, request)`: 이름/역할 수정
- `resetPassword(id, request)`: 비밀번호 BCrypt 인코딩 후 업데이트
- `delete(id)`: 계정 삭제
- `findOrThrow(id)`: 공통 조회 헬퍼 (없으면 `IllegalArgumentException`)

#### `controller/AdminUserController.java` (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/users?role={role}` | 계정 목록 (role 파라미터 없으면 전체) |
| GET | `/api/admin/users/{id}` | 계정 단건 조회 |
| PUT | `/api/admin/users/{id}` | 이름/역할 수정 |
| POST | `/api/admin/users/{id}/reset-password` | 비밀번호 재설정 |
| DELETE | `/api/admin/users/{id}` | 계정 삭제 |

#### `config/DataInitializer.java`
- **변경 전**: `run()`에서 `ensureDefaultMenus()` 호출 후 종료
- **변경 후**: `ensureAdminUsersMenu()` 추가 호출
  ```java
  private void ensureAdminUsersMenu() {
      if (!menuConfigRepository.existsByUrl("/admin/users")) {
          saveMenu(null, "계정 관리", "/admin/users", "users", 9, MenuConfig.MenuType.ADMIN, "ADMIN");
      }
  }
  ```

### 복원 방법

HIST-20260426-013 복원 시:
- `User.java`: `updateName()`, `updateRole()`, `updatePassword()` 제거
- `UserRepository.java`: `findAllByOrderByCreatedAtDesc()`, `findAllByRoleOrderByCreatedAtDesc()` 제거, `List` import 제거
- `AdminUserResponse.java` 삭제
- `UserUpdateRequest.java` 삭제
- `PasswordResetRequest.java` 삭제
- `AdminUserService.java` 삭제
- `AdminUserController.java` 삭제
- `DataInitializer.java`: `ensureAdminUsersMenu()` 호출 및 메서드 정의 제거
