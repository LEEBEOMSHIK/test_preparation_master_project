# GlobalExceptionHandler 수정 이력

## HIST-20260621-001

- **날짜**: 2026-06-21
- **수정 범위**: 사용자 백엔드 / 공통 예외 처리
- **수정 개요**: `GlobalExceptionHandler`에 누락된 4개 표준 스프링 예외 핸들러 추가 — 잘못된 요청이 `handleUnexpected`(500)로 빠지던 갭 해소. `ErrorCode.METHOD_NOT_ALLOWED`(405) 신규 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | `HttpMessageNotReadableException`(400), `MethodArgumentTypeMismatchException`(400), `MissingServletRequestParameterException`(400), `HttpRequestMethodNotSupportedException`(405) 핸들러 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않는 HTTP 메서드입니다.")` 신규 추가 |

### 수정 상세

#### `exception/GlobalExceptionHandler.java`
- 변경 전: `BusinessException`, `MethodArgumentNotValidException`, `DataIntegrityViolationException`, `Exception` 핸들러 4개만 존재. 잘못된 JSON / 파라미터 타입 불일치 / 허용되지 않는 메서드 등이 `handleUnexpected`(500) 처리.
- 변경 후: 4개 핸들러 추가
  - `handleMessageNotReadable` — `HttpMessageNotReadableException` → 400, "요청 본문을 읽을 수 없습니다. JSON 형식을 확인하세요.", `log.warn`
  - `handleTypeMismatch` — `MethodArgumentTypeMismatchException` → 400, "파라미터 '{name}'의 값이 올바르지 않습니다.", `log.warn`
  - `handleMissingParam` — `MissingServletRequestParameterException` → 400, "필수 파라미터 '{name}'가 누락되었습니다.", `log.warn`
  - `handleMethodNotSupported` — `HttpRequestMethodNotSupportedException` → 405 `ErrorCode.METHOD_NOT_ALLOWED`, `log.warn`
- 이유: 표준 스프링 예외들이 `@ControllerAdvice`에 등록되지 않아 500으로 응답되던 문제 해소. 기존 4xx 핸들러와 동일하게 `log.warn` 수준 사용(500 핸들러의 `log.error`와 구분).

#### `exception/ErrorCode.java`
- 변경 전: `METHOD_NOT_ALLOWED` 코드 없음
- 변경 후: `METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않는 HTTP 메서드입니다.")` Common 섹션에 추가
- 이유: 405 응답에 사용할 `ErrorCode` 부재

### 복원 방법
이 ID(HIST-20260621-001)만으로 복원 시:
1. `GlobalExceptionHandler.java`에서 `handleMessageNotReadable`, `handleTypeMismatch`, `handleMissingParam`, `handleMethodNotSupported` 메서드 및 관련 import 4개 제거
2. `ErrorCode.java`에서 `METHOD_NOT_ALLOWED` 항목 제거
