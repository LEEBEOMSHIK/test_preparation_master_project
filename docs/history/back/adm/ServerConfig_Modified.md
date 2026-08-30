## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 공통 서버 설정 (Actuator, SecurityConfig, Docker healthcheck)
- **수정 개요**: Spring Boot의 실제 헬스 경로와 보안·Docker 설정을 `/actuator/health`로 통일하고, 선택 기능인 SMTP 장애가 기본 백엔드 헬스를 `DOWN`으로 만들지 않도록 opt-in 정책을 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java` | 수정 | 익명 허용 헬스 경로를 실제 Actuator 경로로 정정 |
| `backend/src/main/resources/application.yml` | 수정 | SMTP 헬스 검사를 환경변수 기반 opt-in으로 설정 |
| `backend/src/test/java/com/tpmp/testprep/config/ActuatorHealthSecurityTest.java` | 추가 | 애플리케이션 기본 설정 기반 실제 헬스 경로·응답 및 Actuator 루트·레거시 경로 비공개 회귀 검증 |
| `docker-compose.yml` | 수정 | 백엔드 healthcheck URL 정정 및 SMTP 헬스 환경변수 전달 |
| `.env.example` | 수정 | `MAIL_HEALTH_ENABLED` 용도와 기본값 문서화 |

### 수정 상세

#### Actuator 경로 불일치

- **변경 전**: `application.yml`에는 `management.endpoints.web.base-path` 재정의가 없어 Spring Boot 기본 경로가 `/actuator/health`였지만, `SecurityConfig`와 Docker healthcheck는 `/api/actuator/health`를 사용했다.
- **변경 후**: 보안 익명 허용 경로와 Docker healthcheck를 모두 `/actuator/health`로 통일했다.
- **이유**: 일반 업무 API의 `/api` 접두사를 Actuator에도 적용한 것으로 오인했던 기존 설정 때문에, 실제 엔드포인트는 인증 없이 호출할 수 없고 Docker는 존재하지 않는 경로를 검사하고 있었다.
- **보안 범위**: `/actuator/health`만 `permitAll`이며 다른 Actuator 경로는 기존 `anyRequest().authenticated()` 규칙을 유지한다. 잘못된 레거시 `/api/actuator/health`도 더 이상 공개 경로가 아니다.

#### 선택적 SMTP와 헬스 상태

- **변경 전**: `MAIL_HOST`를 비워 이메일 기능을 선택적으로 사용하지 않는 환경에서도 MailHealthIndicator가 `localhost:587` 연결을 시도해 전체 헬스가 `503 DOWN`이 될 수 있었다.
- **변경 후**: `management.health.mail.enabled: ${MAIL_HEALTH_ENABLED:false}`를 추가하고 Docker와 `.env.example`에 `MAIL_HEALTH_ENABLED=false`를 반영했다.
- **이유**: 이메일 전송 실패는 별도 배송 기록으로 관리되는 선택 기능이므로 기본 웹·DB 가용성을 Docker 장애로 판단하지 않는다. SMTP까지 운영 헬스에 포함해야 하는 환경은 `MAIL_HEALTH_ENABLED=true`로 명시적으로 활성화할 수 있다.

#### 회귀 테스트

- 변경 전 RED: 익명 `/actuator/health`는 기대 `200` 대신 `401`, 레거시 `/api/actuator/health`는 기대 `401` 대신 `404`였다.
- 경로 수정 후 추가 진단 RED: 실제 헬스 요청은 SMTP 연결 실패 때문에 `503`과 `{"status":"DOWN"}`을 반환했다.
- 최종 GREEN: 테스트가 Actuator 노출 경로와 상세 표시 정책을 별도 override하지 않고 `application.yml` 기본 설정을 직접 사용한다. 익명 `/actuator/health`는 `200`과 `{"status":"UP"}`을 반환하고, Actuator 루트 `/actuator`와 레거시 `/api/actuator/health`는 모두 `401`을 반환한다.
- 전체 백엔드 검증: `./gradlew test`에서 344개 테스트가 모두 통과했다(실패·오류·건너뜀 0). 이 중 Actuator 보안 회귀 테스트는 3개다.
- Docker 설정 검증: `docker compose config --quiet`가 성공했다. 기존 최상위 `version` 속성 obsolete 경고만 발생했다.
- 실서버 검증: 백엔드 재기동 후 `/actuator/health`는 `200 {"status":"UP"}`, `/actuator`와 `/api/actuator/health`는 각각 `401`을 반환했다.

### 복원 방법

이 ID(HIST-20260831-001)만으로 복원 시:

- `SecurityConfig.java`의 `/actuator/health`를 `/api/actuator/health`로 되돌린다.
- `docker-compose.yml`의 healthcheck URL을 `/api/actuator/health`로 되돌리고 `MAIL_HEALTH_ENABLED` 환경변수 전달을 제거한다.
- `application.yml`의 `management.health.mail.enabled` 설정을 제거한다.
- `.env.example`의 `MAIL_HEALTH_ENABLED` 설명과 기본값을 제거한다.
- `ActuatorHealthSecurityTest.java`를 삭제한다.

## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 백엔드 / 공통 서버 설정 (SecurityConfig, application-prod)
- **수정 개요**: `docs/deployment-guide.md` §4-2 배포 전 보안 점검 "중요" 이슈 대응 — 프로덕션 Swagger/OpenAPI 문서 비활성화(④), actuator permitAll 범위를 health 엔드포인트로 축소(⑥)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/resources/application-prod.yml` | 수정 | `springdoc.api-docs.enabled: false`, `springdoc.swagger-ui.enabled: false` 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java` | 수정 | `/api/actuator/**` permitAll → `/api/actuator/health` permitAll로 축소 |

### 수정 상세

#### `backend/src/main/resources/application-prod.yml`
- **배경**: base `application.yml`이 `springdoc.api-docs.path: /api/v3/api-docs`, `springdoc.swagger-ui.path: /api/swagger-ui.html`을 정의하고 `SecurityConfig`가 해당 경로를 permitAll하고 있어, prod 프로필에 비활성화 오버라이드가 없으면 전체 API 스펙(엔드포인트·DTO 구조)이 인증 없이 공개됨.
- **변경 전**: springdoc 관련 설정 없음(base 설정이 그대로 적용됨)
- **변경 후**:
  ```yaml
  springdoc:
    api-docs:
      enabled: false
    swagger-ui:
      enabled: false
  ```
- **이유**: prod 프로필에서 springdoc 자체를 비활성화하면 `/api/v3/api-docs/**`, `/api/swagger-ui/**` 경로가 404가 되어, SecurityConfig의 permitAll 규칙과 무관하게 문서가 노출되지 않는다. base `application.yml`은 건드리지 않아 local/개발 프로필에서는 Swagger를 계속 사용할 수 있다.

#### `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java`
- **배경**: `management.endpoints.web.exposure.include: health`로 현재는 health만 노출되어 당장은 안전하지만, `.requestMatchers("/api/actuator/**").permitAll()`은 향후 exposure 범위를 넓히면 즉시 인증 없이 전체 actuator가 공개되는 구조적 위험이 있었다. docker-compose의 healthcheck(`curl -f http://localhost:8080/api/actuator/health`)와 `application.yml`의 `management.endpoint.health` 설정을 확인해 실제 헬스체크 경로가 `/api/actuator/health`임을 검증함.
- **변경 전**:
  ```java
  .requestMatchers("/api/actuator/**").permitAll()
  ```
- **변경 후**:
  ```java
  .requestMatchers("/api/actuator/health").permitAll()
  ```
- **이유**: health 엔드포인트만 명시적으로 허용하고, 나머지 actuator 하위 경로는 기존 `.anyRequest().authenticated()`에 걸려 인증이 필요해진다. docker-compose healthcheck는 계속 정상 동작한다(health는 permitAll 유지).

### 복원 방법

이 ID(HIST-20260724-001)만으로 복원 시:
- `application-prod.yml`: 추가한 `springdoc` 블록 제거
- `SecurityConfig.java`: `.requestMatchers("/api/actuator/health").permitAll()`을 `.requestMatchers("/api/actuator/**").permitAll()`로 되돌린다

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 백엔드 / 공통 서버 설정 (WebMvcConfig)
- **수정 개요**: 정적 파일 서빙(/uploads/**)의 리소스 위치 문자열 생성 방식을 견고화(리팩터) — 문자열 결합 대신 `Path.toUri()`로 크로스플랫폼 정규 file URI 생성

> ⚠️ **정정 노트**: 본 변경은 처음에 "Windows 역슬래시 file URL로 인한 /uploads 404 결함 수정"으로 기록되었으나, 런타임 검증 결과 변경 전·후 모두 `/uploads/**`가 정상(HTTP 200)으로 서빙됨이 확인되었다. 즉 **실제 서빙 결함은 없었고**, 본 변경은 OS 비의존적 정규 URI 사용으로의 **견고화/리팩터**다. (사용자가 보고한 "이미지 문항 등록 관련 증상"의 실제 원인은 별개이며 미규명 상태로, 추후 구체 증상 확보 후 재진단 예정.)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/WebMvcConfig.java` | 수정 | `addResourceHandlers`의 리소스 위치 생성 방식을 `toString()`→`toUri().toString()`으로 교체, 끝 슬래시 보장 처리 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/config/WebMvcConfig.java`

- **배경**: 기존 `"file:" + Paths.get(uploadPath).toAbsolutePath().normalize().toString() + "/"`는 Windows에서 `file:C:\...\uploads\/`처럼 역슬래시가 섞인 비정규 형태의 location 문자열을 만든다. Spring이 이를 관용적으로 처리해 실제 서빙은 정상 동작했으나(검증: 변경 전 HTTP 200), URL/URI 규약상 올바른 형태가 아니며 OS·환경에 따라 취약할 수 있다.
- **변경 전**:
  ```java
  String absPath = Paths.get(uploadPath).toAbsolutePath().normalize().toString();
  registry.addResourceHandler("/uploads/**")
          .addResourceLocations("file:" + absPath + "/");
  ```
- **변경 후**:
  ```java
  String location = Paths.get(uploadPath).toAbsolutePath().normalize().toUri().toString();
  if (!location.endsWith("/")) {
      location = location + "/";
  }
  registry.addResourceHandler("/uploads/**")
          .addResourceLocations(location);
  ```
- **이유**: `Path.toUri()`는 JVM이 OS에 맞는 정규 file URI(`file:///C:/project/.../uploads/`)를 생성한다. Windows·Linux 모두에서 올바른 URI 형식을 보장하며, 끝 슬래시를 명시적으로 보장해 이중 슬래시를 피한다. 서빙 동작 의미(/uploads/** → 디스크 uploads 디렉터리)는 변경 전과 동일하다.
- **비접촉 영역**: `SecurityConfig`의 `/uploads/**` permitAll 설정, `AttachmentService`의 파일 저장 로직은 변경하지 않음.

### 복원 방법

이 ID(HIST-20260625-001)만으로 복원 시 `WebMvcConfig.java`의 `addResourceHandlers` 메서드를 "변경 전" 코드로 되돌린다. (서빙은 변경 전에도 정상이었으므로 복원해도 기능 회귀는 없음 — 단지 비정규 URI 형태로 되돌아갈 뿐.)

### 후속 조치

- **백엔드 서버 재기동 필요** — Spring이 `WebMvcConfig`를 애플리케이션 시작 시 한 번만 로드하므로, 변경 사항 반영을 위해 재기동해야 한다. (적용 후 재기동·검증 완료: /uploads 서빙 :8080·:3000 모두 200.)
- **미해결**: 사용자가 보고한 "이미지 문항이 제대로 등록되지 않는다" 증상의 실제 원인은 본 변경과 무관하며 아직 규명되지 않았다. 구체 재현(업로드 실패 / 특정 화면 / 재편집 후 소실 등) 확보 후 재진단 필요.
