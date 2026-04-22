## HIST-20260420-002

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: 문항 이미지 업로드 API 추가, 업로드 파일 정적 제공 설정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| service/QuestionBankService.java | 수정 | `uploadImage()` 메서드 추가 — ./uploads/images/ 저장 후 URL 반환 |
| controller/AdminQuestionController.java | 수정 | `POST /api/admin/questions/images` 엔드포인트 추가 |
| config/WebMvcConfig.java | 추가 | `/uploads/**` → `./uploads/` 정적 파일 제공 ResourceHandler |
| config/SecurityConfig.java | 수정 | `/uploads/**` permitAll 추가 |

### 수정 상세

#### `service/QuestionBankService.java`
- 변경 전: 이미지 업로드 없음
- 변경 후: `uploadImage(MultipartFile)` — JPEG/PNG/GIF/WEBP 허용, UUID 파일명으로 `./uploads/images/` 저장, `/uploads/images/{filename}` URL 반환

#### `config/WebMvcConfig.java`
- 변경 전: 없음
- 변경 후: `WebMvcConfigurer` 구현 — 업로드 디렉토리를 `/uploads/**` URL로 정적 노출

#### `config/SecurityConfig.java`
- 변경 전: `/uploads/**` 경로 없음
- 변경 후: `.requestMatchers("/uploads/**").permitAll()` — 인증 없이 이미지 접근 허용

### 복원 방법

HIST-20260420-002 복원 시:
- `QuestionBankService.java`에서 `uploadImage()` 및 관련 import 제거
- `AdminQuestionController.java`에서 `/images` 엔드포인트 제거
- `WebMvcConfig.java` 삭제
- `SecurityConfig.java`에서 `/uploads/**` permitAll 제거

---

## HIST-20260419-018

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정에 카테고리(문제 유형) 필수 필드 추가, DTO @Size 유효성 검사 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/QuestionBank.java | 수정 | category 필드(DomainSlave FK) 추가, language/question_type 컬럼 길이 조정 |
| dto/request/QuestionBankRequest.java | 수정 | categoryId @NotNull 추가, @Size 제약 추가 |
| dto/request/QuestionRequest.java | 수정 | @Size 제약 추가 |
| dto/request/ExamCreateRequest.java | 수정 | title @Size(max=200) 추가 |
| dto/response/QuestionBankResponse.java | 수정 | categoryId, categoryName 필드 추가 |
| service/QuestionBankService.java | 수정 | DomainSlaveRepository 주입, resolveCategory() 헬퍼 추가, create/update에 category 적용 |

### 수정 상세

#### `entity/QuestionBank.java`
- 변경 전: category 필드 없음
- 변경 후: `@ManyToOne(fetch=LAZY) @JoinColumn(name="category_id") DomainSlave category` 추가
- 이유: 문항의 문제 유형(카테고리) 분류 지원

#### `dto/request/QuestionBankRequest.java`
- 변경 전: categoryId 필드 없음
- 변경 후: `@NotNull Long categoryId` 추가, content(@Size 5000), answer(@Size 2000), code(@Size 10000)
- 이유: 카테고리 필수 등록 및 입력값 길이 제한

### 복원 방법

이 ID(HIST-20260419-018)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260419-012

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험지 등록
- **수정 개요**: POST `/api/admin/exams` 401 오류 수정 — DataInitializer 트랜잭션 분리, ExamService UNAUTHORIZED → INTERNAL_ERROR 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `run()`의 `@Transactional` 제거, DDL/user 작업 메서드 분리 |
| `backend/.../service/ExamService.java` | 수정 | `createExam`의 `UNAUTHORIZED` → `INTERNAL_ERROR` (HTTP 401 → 500) |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `run()` 전체에 `@Transactional` — DDL + JPA를 같은 트랜잭션에 묶어 커밋 누락 가능성
- 변경 후: `run()`에서 `@Transactional` 제거, DDL은 `fixAnswerNullable()`에서 try-catch로 독립 실행, 유저 관리는 `ensureAdminUser()` `@Transactional` 별도 트랜잭션

#### `service/ExamService.java`
- 변경 전: `userRepository.findByEmail` 실패 시 `UNAUTHORIZED(401)` 반환 → Spring Security 401과 혼동
- 변경 후: `INTERNAL_ERROR(500)` 반환 — 인증 실패(401)와 명확히 구분

### 복원 방법

이 ID(HIST-20260419-012)만으로 복원 시:
- `DataInitializer.java`: `run()`에 `@Transactional` 추가, `fixAnswerNullable`/`ensureAdminUser` 메서드 제거 후 인라인
- `ExamService.java`: `INTERNAL_ERROR` → `UNAUTHORIZED` 변경

---

## HIST-20260419-011

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: `/api/admin/exams/{id}/questions/bulk` 500 오류 수정 — questions.answer NOT NULL 제약 위반

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/Question.java` | 수정 | `answer` 필드 `@Column(nullable = false)` → `@Column` |
| `backend/.../config/DataInitializer.java` | 수정 | 시작 시 `ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL` 실행 |

### 수정 상세

#### `entity/Question.java`
- 변경 전: `@Column(nullable = false) private String answer` — DB NOT NULL 제약
- 변경 후: `@Column private String answer` — nullable 허용
- 이유: CODE 유형 문항은 answer가 선택 사항이나 DB 제약으로 INSERT 실패(500)

#### `config/DataInitializer.java`
- 변경 전: JdbcTemplate 없음
- 변경 후: `JdbcTemplate` 주입 후 `ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL` 실행
- 이유: `ddl-auto: update`는 nullable 제약 변경을 자동 적용하지 않으므로 직접 DDL 실행

### 복원 방법

이 ID(HIST-20260419-011)만으로 복원 시:
- `Question.java`: `answer`에 `@Column(nullable = false)` 복구
- `DataInitializer.java`: JdbcTemplate 주입 및 ALTER TABLE 실행 코드 제거
- DB: `ALTER TABLE questions ALTER COLUMN answer SET NOT NULL`

---

## HIST-20260419-008

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 인증
- **수정 개요**: DataInitializer — existsByEmail 조건 제거, 매 시작 시 삭제+재생성으로 비밀번호/역할 항상 일치 보장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | 기존 계정 삭제 후 재생성 패턴으로 변경 (`@Transactional`, `flush()` 추가) |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `existsByEmail` 체크 후 없을 때만 생성 → 이전에 다른 비밀번호로 생성된 계정이 있으면 수정 불가
- 변경 후: `findByEmail` → `delete` → `flush` → `save` 패턴으로 항상 올바른 비밀번호/역할 보장
- 이유: DB에 기존 admin@tpmp.com 계정이 다른 비밀번호로 존재해 INVALID_CREDENTIALS(401) 발생

### 복원 방법

이 ID(HIST-20260419-008)만으로 복원 시:
- `DataInitializer.java`: 삭제+재생성 로직을 `existsByEmail` 체크 방식으로 되돌림

---

## HIST-20260419-005

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 인증 및 보안
- **수정 개요**: 테스트 관리자 계정 자동 생성(DataInitializer), 미인증 요청에 대한 401 응답 처리(SecurityConfig) 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 추가 | 앱 시작 시 admin@tpmp.com / Admin1234! 계정이 없으면 자동 생성 |
| `backend/.../config/SecurityConfig.java` | 수정 | authenticationEntryPoint 추가 — 미인증 요청에 403 대신 401 반환 |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: 파일 없음 (관리자 계정 수동 DB INSERT 필요)
- 변경 후: `ApplicationRunner` 구현 — 앱 시작 시 `admin@tpmp.com`(Role: ADMIN) 계정이 없으면 자동 생성
- 이유: 테스트 환경에서 관리자 API 접근을 위한 계정 부재 문제 해결

#### `config/SecurityConfig.java`
- 변경 전: `exceptionHandling` 미설정 → 미인증 요청도 403 반환
- 변경 후: `authenticationEntryPoint`로 미인증 요청 시 401 반환 (`response.sendError(401)`)
- 이유: 프론트엔드 apiClient의 401 핸들러(refresh → 로그인 리다이렉트)가 정상 동작하도록 보정

### 복원 방법

이 ID(HIST-20260419-005)만으로 복원 시:
- `DataInitializer.java` 삭제
- `SecurityConfig.java`: `exceptionHandling(...)` 블록 제거, `HttpServletResponse` import 제거

---

## HIST-20260419-001

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리 (DB 설계 + 문항 풀 API)
- **수정 개요**: DB 가이드라인 정의, 표준 공통 컬럼(BaseEntity) 도입, 글로벌 문항 풀(question_bank) 전체 스택 구현, Question 엔티티에 CODE 유형 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-guidelines.md` | 추가 | DB 테이블 설계 규칙 문서 (표준 컬럼, 네이밍, ERD) |
| `backend/.../entity/BaseEntity.java` | 추가 | MappedSuperclass — 공통 컬럼(create_dt/uno, modified_dt/uno, del_yn, use_yn) |
| `backend/.../entity/QuestionBank.java` | 추가 | 글로벌 문항 풀 엔티티 (BaseEntity 상속, question_bank 테이블) |
| `backend/.../repository/QuestionBankRepository.java` | 추가 | 문항 풀 JPA 레포지토리 (del_yn 필터 메서드 포함) |
| `backend/.../dto/request/QuestionBankRequest.java` | 추가 | 문항 단건 등록/수정 요청 DTO |
| `backend/.../dto/request/QuestionBankBulkRequest.java` | 추가 | 문항 일괄 등록 요청 DTO |
| `backend/.../dto/response/QuestionBankResponse.java` | 추가 | 문항 응답 DTO (프론트엔드 QuestionSummary 구조 일치) |
| `backend/.../service/QuestionBankService.java` | 추가 | 문항 CRUD 서비스 (소프트 삭제 지원) |
| `backend/.../controller/AdminQuestionController.java` | 추가 | `/api/admin/questions` 엔드포인트 — GET/POST/POST bulk/PUT/DELETE |
| `backend/.../entity/Question.java` | 수정 | QuestionType에 CODE 추가, code/language 필드 추가 |
| `backend/.../dto/request/QuestionRequest.java` | 수정 | code, language 필드 추가, answer NotBlank 제거(CODE 유형 유연성) |
| `backend/.../service/ExamService.java` | 수정 | addQuestion에 code/language 빌더 파라미터 추가 |

### 수정 상세

#### `docs/db-guidelines.md`
- 변경 전: 파일 없음
- 변경 후: DB 표준 컬럼 정의, 테이블/컬럼 네이밍 규칙, Java/JPA 구현 표준, question_bank ERD 포함 가이드 문서
- 이유: 프로젝트 전체 DB 설계 일관성 확보

#### `entity/BaseEntity.java`
- 변경 전: 파일 없음
- 변경 후: `@MappedSuperclass` — `createDt`, `createUno`, `modifiedDt`, `modifiedUno`, `delYn('N')`, `useYn('Y')` 필드. `initAudit(userNo)`, `updateAudit(userNo)`, `softDelete(userNo)`, `deactivate(userNo)` 메서드 제공
- 이유: 공통 컬럼을 상속으로 재사용, 신규 엔티티에 일관된 감사(audit) 컬럼 보장

#### `entity/QuestionBank.java`
- 변경 전: 파일 없음
- 변경 후: `question_bank` 테이블 매핑 엔티티. content, questionType(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE), options(JSONB), answer, code, language, explanation + BaseEntity 공통 컬럼
- 이유: 시험지에 종속되지 않는 독립 문항 풀 필요

#### `entity/Question.java`
- 변경 전: `QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX }`, code/language 필드 없음
- 변경 후: `QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE }`, `code TEXT`, `language VARCHAR(20)` 추가
- 이유: 코드 문항 유형 지원

#### `dto/request/QuestionRequest.java`
- 변경 전: `answer`에 `@NotBlank`, code/language 없음
- 변경 후: `answer`에서 `@NotBlank` 제거(CODE 유형은 expected output으로 nullable 가능), `code`, `language` 필드 추가
- 이유: CODE 유형의 유연한 입력 지원

#### `service/ExamService.java`
- 변경 전: `Question.builder()` 에 code/language 없음
- 변경 후: `.code(request.code()).language(request.language())` 추가
- 이유: QuestionRequest의 code/language를 실제 DB에 저장

### API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/questions?page=0&size=50` | 문항 목록 (페이징) |
| GET | `/api/admin/questions/{id}` | 문항 단건 조회 |
| POST | `/api/admin/questions` | 문항 단건 등록 |
| POST | `/api/admin/questions/bulk` | 문항 일괄 등록 `{ questions: [...] }` |
| PUT | `/api/admin/questions/{id}` | 문항 수정 |
| DELETE | `/api/admin/questions/{id}` | 문항 소프트 삭제 (del_yn = 'Y') |

### 복원 방법

이 ID(HIST-20260419-001)만으로 복원 시:
- `docs/db-guidelines.md` 삭제
- `BaseEntity.java`, `QuestionBank.java`, `QuestionBankRepository.java` 삭제
- `QuestionBankRequest.java`, `QuestionBankBulkRequest.java`, `QuestionBankResponse.java` 삭제
- `QuestionBankService.java`, `AdminQuestionController.java` 삭제
- `Question.java`: CODE 제거, code/language 필드 제거
- `QuestionRequest.java`: `answer`에 `@NotBlank` 복구, code/language 제거
- `ExamService.java`: `.code(...)`, `.language(...)` 줄 제거
