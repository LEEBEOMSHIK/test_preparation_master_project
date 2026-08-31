## HIST-20260831-007

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 삭제 오류 계약·테스트 발송 트랜잭션 경계 보강
- **수정 개요**: 사용 중 삭제의 `error.details`를 고정 객체 계약으로 감싸고, 동기 SMTP 테스트 발송이 service read-only transaction 밖에서 실행되도록 경계를 분리했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateInUseDetails.java` | 추가 | 참조 이벤트 목록을 `referencedEvents`로 감싸는 삭제 충돌 details 계약 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java` | 수정 | 삭제 충돌 details 래핑 및 테스트 발송 `NOT_SUPPORTED` 트랜잭션 경계 적용 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java` | 수정 | `error.details.referencedEvents` 고정 JSON 경로 회귀 테스트 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java` | 수정 | 전용 삭제 충돌 details 타입과 참조 이벤트 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestSendTransactionIntegrationTest.java` | 추가 | 실제 Spring proxy에서 SMTP 호출 시 transaction 비활성 검증 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 3 Fix round 1 finding·TDD·검증 상태 인계 |

### 수정 상세

#### 삭제 충돌 오류 details 계약

- 변경 전: `EMAIL_TEMPLATE_IN_USE`의 details로 `List<EmailTemplateReferenceResponse>`를 직접 전달해 JSON이 `error.details[]` 배열로 직렬화됐다.
- 변경 후: `EmailTemplateInUseDetails` record가 목록을 `referencedEvents` 필드로 감싸 `error.details.referencedEvents[]`로 직렬화한다.
- 이유: 후속 frontend가 소비하는 고정 오류 JSON 계약을 지키고 향후 details 메타데이터 확장 시 배열 루트를 깨지 않기 위함이다.

#### 테스트 발송 트랜잭션 경계

- 변경 전: 클래스 레벨 `@Transactional(readOnly = true)`가 `testSend` 전체에 적용되어 repository 조회 후 동기 SMTP 네트워크 호출이 끝날 때까지 transaction과 connection을 유지했다.
- 변경 후: public `testSend`에 `Propagation.NOT_SUPPORTED`를 명시해 외부 transaction을 일시 중단하고 repository의 짧은 조회 경계가 종료된 상태에서 SMTP를 호출한다. 통합 테스트가 실제 `JavaMailSender.send` 순간 transaction 비활성을 검증한다.
- 이유: 느리거나 실패할 수 있는 외부 SMTP I/O 동안 DB connection을 장기 점유하지 않도록 하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-007)로 복원 시 `EmailTemplateInUseDetails`와 SMTP transaction 통합 테스트를 제거한다. `EmailTemplateService.delete`가 참조 목록을 직접 details로 넘기고 `testSend`가 클래스 read-only transaction을 상속하도록 되돌린 뒤 두 기존 테스트 assertion을 이전 배열 계약으로 복원한다.

## HIST-20260831-006

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 기본 시드·CRUD·이벤트 연결·테스트 발송 API
- **수정 개요**: 기본 문의 상태 이메일 템플릿 3종을 멱등 시드하고, 관리자 전용 템플릿 관리·이벤트 연결·preview·현재 관리자 테스트 발송 API와 구조화 오류 상세 계약을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DefaultEmailTemplateCatalog.java` | 추가 | 문의 종료 이벤트 기본 템플릿 3종의 고정 system key·제목·HTML 정의 |
| `backend/src/main/java/com/tpmp/testprep/config/EmailTemplateSeedRunner.java` | 추가 | 최초 설치 binding 생성과 재기동 unbind 보존을 구분하는 단일 트랜잭션 시드 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java` | 추가 | 템플릿 CRUD·복제·복원·논리 삭제·preview·테스트 발송 위임 및 renderer 오류 매핑 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateBindingService.java` | 추가 | 고정 3개 이벤트 연결 조회·변경·해제와 활성·scope 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateTestMailSender.java` | 추가 | 현재 ADMIN 이메일 전용 multipart 테스트 발송·마스킹 로그·SMTP 오류 변환 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateController.java` | 추가 | ADMIN 템플릿 관리 9개 endpoint와 요청 검증·principal 전달 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingController.java` | 추가 | ADMIN binding 3개 endpoint와 unknown event 명시적 404 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateCreateRequest.java` 외 3개 | 추가 | 템플릿 생성·수정·preview·binding 검증 요청 계약 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateSummaryResponse.java` 외 6개 | 추가 | 목록·상세·참조·변수·preview·binding·테스트 발송 응답 계약 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | 템플릿 not found/in use/변수/scope/content/SMTP/event 오류 코드 7종 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/BusinessException.java` | 수정 | nullable 구조화 `details`와 하위 호환 생성자 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/ApiResponse.java` | 수정 | `error.details`와 기존 fail overload 위임 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | BusinessException의 구조화 details를 오류 응답에 전달 |
| `backend/src/test/java/com/tpmp/testprep/config/EmailTemplateSeedRunnerTest.java` | 추가 | 최초 3종 시드·재기동 unbind 보존·부분 누락 보완 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java` | 추가 | 목록·상세·CRUD·복제·복원·삭제·preview·테스트 발송 위임 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateBindingServiceTest.java` | 추가 | 비활성/scope 거부·연결·해제·고정 3행 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestMailSenderTest.java` | 추가 | 현재 ADMIN 수신자·multipart 본문·비활성 허용·SMTP 502·role 검증 |
| `backend/src/test/java/com/tpmp/testprep/dto/response/ApiResponseContractTest.java` | 추가 | 구조화 details와 기존 overload null 하위 호환 검증 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java` | 추가 | CRUD endpoint·ADMIN 보안·검증·principal·details 계약 검증 |
| `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingControllerWebMvcTest.java` | 추가 | binding GET/PUT/DELETE·고정 3행·unknown event 404 검증 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 3 TDD 진행·API·시드 unbind 비복구·검증 결과 인계 |

### 수정 상세

#### 기본 템플릿 시드

- 변경 전: DB 마이그레이션 외에 애플리케이션 시작 시 기본 템플릿을 보완할 카탈로그와 시드 경계가 없었다.
- 변경 후: 고정 system key 3종을 먼저 모두 조회한다. 모두 없을 때만 정화된 템플릿과 binding 3개를 한 트랜잭션에서 만들며, 하나라도 있으면 누락 템플릿만 보완하고 binding은 만들지 않는다.
- 이유: 최초 설치 기본 연결을 제공하면서 관리자가 해제한 binding을 재기동 시드가 되살리지 않도록 하기 위함이다.

#### 관리자 템플릿·binding 서비스와 API

- 변경 전: 템플릿 엔티티와 renderer는 있었지만 관리자 CRUD, 참조 삭제 차단, 기본값 복원, 이벤트 연결 변경 API가 없었다.
- 변경 후: 저장 전 renderer 정화, 비관적 잠금 기반 수정·삭제·binding, 참조 이벤트 details를 포함한 409, 복제 시 system key 제거, 기본 카탈로그 복원, 고정 3개 binding 행과 ADMIN Controller를 추가했다.
- 이유: 후속 관리자 화면이 안정된 JSON 계약으로 템플릿 수명주기와 문의 종료 이벤트 연결을 관리하도록 하기 위함이다.

#### preview·현재 관리자 테스트 발송

- 변경 전: 저장하지 않은 서버 preview와 관리자 본인에게 안전하게 HTML 테스트 메일을 보내는 기능이 없었다.
- 변경 후: `app.public-url` 기반 안전 샘플 변수로 정화·렌더 preview를 제공한다. 테스트 발송은 request 수신자 없이 현재 ADMIN의 DB 이메일로만 multipart 평문/HTML을 보내며 비활성 템플릿도 허용한다. 로그는 관리자 ID·템플릿 ID·마스킹 수신자·성공 여부만 기록하고 SMTP 실패를 502로 변환한다.
- 이유: 임의 수신자 발송과 민감정보 로그 노출을 막으면서 운영 전 렌더 결과를 검증하기 위함이다.

#### 오류 상세와 테스트

- 변경 전: `BusinessException`과 `ApiResponse.ErrorDetail`에 구조화 details가 없어 사용 중 삭제의 참조 이벤트를 전달할 수 없었다.
- 변경 후: nullable `Object details`와 기존 생성자/overload 위임을 추가하고 전역 handler가 details를 전달한다. 시드부터 Controller까지 production 코드 전에 실패 테스트를 작성해 RED→GREEN을 확인했다.
- 이유: 기존 오류 소비자와 호환하면서 후속 frontend가 참조 이벤트를 구조적으로 표시하고 각 보안·상태 계약의 회귀를 막기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-006)로 복원 시 Task 3에서 추가한 config·service·controller·request/response DTO·테스트 파일을 제거한다. `ErrorCode`의 이메일 템플릿 7종, `BusinessException.details`, `ApiResponse.error.details` overload와 `GlobalExceptionHandler` details 전달을 제거하고 `docs/agent-handoff/CURRENT.md`를 이전 Task 2 완료 상태로 되돌린다. Task 4 이후 코드가 이 API를 참조한다면 해당 호출부를 먼저 제거해야 한다.

## HIST-20260831-005

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 placeholder 종단 경계 보강
- **수정 개요**: sanitizer 일반 placeholder에 `_END` 종단 경계를 추가해 토큰 직후 숫자 텍스트를 인덱스로 오인하지 않고 정확한 sentinel만 계수·복원하도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java` | 수정 | 일반 placeholder 생성과 matcher에 명시적 `_END` 종단 경계 적용 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java` | 수정 | 토큰 직후 `0`, `00`, `1234567890` 숫자 접미 보존 회귀 테스트 추가 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 2 Fix round 3 구현·검증 결과와 주의사항으로 최신 인계 갱신 |

### 수정 상세

#### `EmailTemplateRenderer.java`
- 변경 전: `{{recipientName}}0`을 보호하면 `TPMP_TOKEN_00`이 되어 `[0-9]+` matcher가 등록되지 않은 인덱스 00 placeholder로 해석했다.
- 변경 후: 일반 placeholder를 `TPMP_TOKEN_{index}_END` 형식으로 생성하고 matcher가 `_END`까지 포함한 전체 sentinel을 인식하게 했다. 기존 `_END` 없는 예약 문자열도 탐지해 태그 병합 공격 회귀는 계속 거부한다.
- 이유: placeholder 인덱스와 템플릿의 실제 숫자 텍스트 사이에 명시적 경계를 두어 접미 길이와 무관하게 원문을 보존하기 위함이다.

#### `EmailTemplateRendererTest.java`
- 변경 전: 11개 토큰은 공백으로 구분되어 토큰 직후 숫자가 placeholder 인덱스에 흡수되는 결함을 잡지 못했다.
- 변경 후: `0`, `00`, `1234567890` 접미를 parameterized test로 준비해 정화 HTML과 평문이 각각 원문과 일치하는지 검증하며 focused 테스트를 24개로 확장했다.
- 이유: 단일·다중 숫자 접미와 향후 긴 숫자 값에서도 경계 회귀를 방지하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-005)로 복원 시 일반 placeholder 형식과 matcher를 `_END` 없는 이전 값으로 복원하고 Fix round 3 parameterized test를 제거한다. 그러면 `HIST-20260831-004` 시점 동작으로 돌아간다.

## HIST-20260831-004

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 토큰 경계 검증 보강
- **수정 개요**: 파싱 전 토큰을 호출별 sentinel로 보호해 위치·구조 소실과 생성을 분리 검증하고, 두 자리 순번 placeholder의 prefix 충돌 없이 정확히 계수·복원하도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java` | 수정 | raw 토큰 UUID sentinel 사전 보호·구조 검증 및 일반 placeholder exact-key 계수·복원 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java` | 수정 | DOCTYPE 토큰 소실/엔티티 토큰 생성 상쇄와 11개 정상 토큰 prefix 충돌 회귀 테스트 추가 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 2 Fix round 2 구현·검증 결과와 주의사항으로 최신 인계 갱신 |

### 수정 상세

#### `EmailTemplateRenderer.java`
- 변경 전: raw HTML과 jsoup 파싱 HTML의 토큰별 개수만 비교해 같은 토큰이 한 위치에서 제거되고 다른 위치에서 생성되면 상쇄됐다. `TPMP_TOKEN_1`의 단순 substring 계수·복원이 `TPMP_TOKEN_10` 내부까지 처리해 11개 이상 정상 토큰을 거부하거나 잘못 복원했다.
- 변경 후: 유효 토큰을 jsoup 파싱 전에 호출별 UUID와 끝 경계가 포함된 raw sentinel로 각각 치환한다. 모든 sentinel이 body 구조에 정확히 한 번 남고 파싱 결과에 직접 토큰 문법이 새로 나타나지 않는지 확인한 뒤 원래 토큰을 복원한다. sanitizer 이후 일반 placeholder는 `TPMP_TOKEN_[0-9]+` matcher의 완전한 키별 개수를 비교하고 같은 matcher로 한 번에 복원한다.
- 이유: 토큰 제거와 생성을 위치별로 독립 탐지하고 순번 prefix와 무관하게 임의 개수의 정상 토큰을 안정적으로 준비하기 위함이다.

#### `EmailTemplateRendererTest.java`
- 변경 전: `DOCTYPE`에서 제거된 토큰과 엔티티에서 생성된 동일 토큰이 개수상 상쇄되는 입력, `TPMP_TOKEN_1`과 `TPMP_TOKEN_10`이 동시에 생기는 정상 11개 토큰 입력을 검증하지 않았다.
- 변경 후: 정확한 공격 재현은 `INVALID_VARIABLE`로 거부하고 정상 11개 토큰은 HTML과 평문에 모두 보존되는 테스트를 추가해 focused 테스트를 21개로 확장했다.
- 이유: 구조 무결성 검사와 exact sentinel 경계가 후속 변경에서도 유지되도록 하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-004)로 복원 시 `EmailTemplateRenderer`의 raw UUID sentinel 사전 보호·복원과 exact placeholder 계수·복원을 제거하고, `EmailTemplateRendererTest`의 Fix round 2 테스트를 제거한다. 그러면 `HIST-20260831-003` 시점 동작으로 돌아간다.

## HIST-20260831-003

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 토큰 무결성 보강
- **수정 개요**: 여분 중괄호 토큰, sanitizer 경계 병합에 의한 토큰·placeholder 생성/소실, 정화·치환 후 비가시 본문을 거부하도록 렌더러 보안 경계를 강화했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java` | 수정 | brace 경계 토큰 문법, 단계별 토큰·placeholder 개수 무결성, 가시 본문 검증 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java` | 수정 | extra brace, 태그·엔티티 분할, placeholder 합성·토큰 소실, 정화/치환 후 빈 본문 회귀 테스트 추가 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 2 Fix round 1 구현·검증 결과와 주의사항으로 최신 인계 갱신 |

### 수정 상세

#### `EmailTemplateRenderer.java`
- 변경 전: 토큰 정규식이 triple brace 내부의 유효 부분 문자열을 매칭했고, sanitizer가 제거 태그 경계를 합쳐 토큰·고정 placeholder를 생성하거나 주석 토큰을 제거해도 복원 로직이 이를 구분하지 못했다. 정화된 HTML과 최종 렌더 HTML의 표시 텍스트가 없어도 성공했다.
- 변경 후: negative lookaround로 정확한 double-brace 경계만 허용한다. raw HTML과 jsoup 파싱 결과의 토큰 개수, 원본과 보호된 토큰 개수, 정화 결과의 placeholder별 예상 출현 횟수를 비교하며 실제 링크 토큰이 있을 때만 링크 placeholder를 등록한다. 정화 전후 새 토큰·placeholder 생성과 토큰 소실을 거부한다. 준비 및 렌더 정화 직후 jsoup 텍스트에서 Unicode whitespace·space separator·format 문자를 비가시 문자로 정규화해 표시 본문이 없으면 `INVALID_CONTENT`를 반환한다.
- 이유: HTML 파싱·정화가 문자열 경계를 바꾸더라도 토큰 의미가 생성·복제·소실되지 않게 하고 내용 없는 이메일 저장·발송을 차단하기 위함이다.

#### `EmailTemplateRendererTest.java`
- 변경 전: 여분 brace, 태그/엔티티 분할, sanitizer가 합성한 예약값, 주석 토큰 소실, script/이미지/줄바꿈/NBSP 전용 본문과 빈 변수 치환을 검증하지 않았다.
- 변경 후: 해당 경계를 포함해 focused 테스트를 10개에서 19개로 확장했다.
- 이유: sanitizer 정책 또는 토큰 보호 순서가 변경돼 같은 우회가 재발하는 것을 방지하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-003)로 복원 시 `EmailTemplateRenderer`의 brace 경계 정규식, 토큰/placeholder 개수 검증, 가시 본문 검증을 제거하고 `EmailTemplateRendererTest`에서 Fix round 1 회귀 테스트를 제거한다. 그러면 `HIST-20260831-002` 시점의 렌더러 동작으로 돌아간다.

## HIST-20260831-002

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 보안 렌더링
- **수정 개요**: 이메일 템플릿 저장·발송 경계에 허용 변수 검증, HTML 이중 정화, 제목 헤더 인젝션 방지, 안전한 링크 검증과 평문 fallback 생성을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/build.gradle` | 수정 | OWASP Java HTML Sanitizer 20240325.1과 jsoup 1.18.3 고정 버전 의존성 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java` | 추가 | 7개 변수 allowlist, 저장·발송 이중 정화, 토큰 보호·HTML escaping·링크 호스트 검증·평문 변환 구현 |
| `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderingException.java` | 추가 | 안전한 렌더링 실패 사유를 `INVALID_VARIABLE`과 `INVALID_CONTENT`로 구분하는 예외 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java` | 추가 | 허용 변수·길이·제목 개행·실행 요소·속성 토큰·링크·escaping·placeholder 우회 회귀 테스트 추가 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 2 구현 결정, 검증 결과, 주의사항과 후속 작업 인계 갱신 |

### 수정 상세

#### `backend/build.gradle`
- 변경 전: 사용자 편집 HTML을 allowlist로 정화하고 평문으로 변환할 고정 버전 라이브러리가 없었다.
- 변경 후: OWASP Java HTML Sanitizer `20240325.1`과 jsoup `1.18.3`을 production 의존성으로 추가했다.
- 이유: 이메일 HTML의 허용 요소·URL 정책을 서버에서 강제하고 동일 입력으로 재현 가능한 렌더링을 제공하기 위함이다.

#### `EmailTemplateRenderer.java`, `EmailTemplateRenderingException.java`
- 변경 전: 템플릿 변수와 HTML을 저장 전에 검증·정화하거나 발송 직전에 안전하게 치환·재정화하는 공통 경계가 없었다.
- 변경 후: `INQUIRY_STATUS`의 7개 토큰만 허용하고, 제목 CR/LF와 길이·blank를 거부하며, 허용된 의미 HTML과 HTTP(S) 링크만 보존한다. 일반 텍스트 토큰과 상세 URL 토큰은 별도 placeholder로 보호하고, 엔티티 인코딩을 이용한 토큰·예약값 우회도 복원 후 재검증한다. 발송 시 모든 값을 확인하고 HTML 이스케이프하며 상세 URL의 프로토콜과 `app.public-url` 호스트를 검사한 뒤 최종 정화·평문 변환한다.
- 이유: 관리자 입력, 기존 저장 데이터, 사용자 유래 치환값을 각각 신뢰하지 않는 이중 방어 경계를 한 서비스에 모으기 위함이다.

#### `EmailTemplateRendererTest.java`
- 변경 전: 템플릿 정화와 변수 렌더링 보안 계약을 자동 검증하는 테스트가 없었다.
- 변경 후: 실행 요소·이미지 제거, 7개 변수 순서, 속성 토큰 제한, 누락 값, 외부/실행 URL, HTML escaping, 렌더 후 제목 개행, 인코딩된 토큰 및 placeholder 충돌을 포함한 10개 focused 테스트를 추가했다.
- 이유: sanitizer 설정이나 토큰 처리 순서가 변경되어 실행 콘텐츠 또는 미허용 변수가 살아나는 회귀를 차단하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-002)로 복원 시 `EmailTemplateRenderer`, `EmailTemplateRenderingException`, `EmailTemplateRendererTest`를 제거하고 `backend/build.gradle`에서 OWASP sanitizer와 jsoup 의존성을 제거한다. 후속 Task에서 renderer를 참조했다면 해당 호출부를 먼저 이전 렌더링 방식으로 복원한 뒤 삭제한다.

## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 백엔드 / 이메일 템플릿 관리
- **수정 개요**: 이메일 템플릿·이벤트 연결 데이터 모델과 HTML 발송 스냅샷, 문의 상태 제약조건 멱등 보정 기반을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplate.java` | 추가 | 템플릿 본문·범위·활성 상태·시스템 키와 생성/수정/삭제 감사 정보를 관리하는 엔티티 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateBinding.java` | 추가 | 문의 상태 이벤트와 템플릿의 관리자 변경 가능한 연결 엔티티 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateEvent.java` | 추가 | 세 문의 종료 상태와 이메일 발송 이벤트의 고정 매핑 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java` | 수정 | nullable HTML 본문 스냅샷과 기존 plain text 호출 호환 오버로드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateRepository.java` | 추가 | 논리 삭제 제외 검색·시스템 키 조회·비관적 잠금 조회 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateBindingRepository.java` | 추가 | 이벤트·템플릿 기준 연결 조회와 참조 개수 조회 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunner.java` | 추가 | 기존 스키마 러너와 독립된 PostgreSQL 문의 6상태 제약조건 보정 러너 추가 |
| `backend/src/test/java/com/tpmp/testprep/entity/EmailTemplateTest.java` | 추가 | 복제·논리 삭제 감사와 종료 상태 이벤트 매핑 회귀 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/entity/InquiryEmailDeliveryTest.java` | 추가 | text/HTML 본문 동시 스냅샷 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateRepositoryTest.java` | 추가 | 논리 삭제 템플릿 검색 제외 통합 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateBindingRepositoryTest.java` | 추가 | 이벤트·템플릿 ID 연결 조회 통합 테스트 추가 |
| `backend/src/test/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunnerTest.java` | 추가 | 오래된 제약 교체와 최신 제약 재실행 무변경 테스트 추가 |
| `docs/db-migration/20260831_01_admin_email_template_management.sql` | 추가 | 테이블·HTML 컬럼·6상태 제약·최초 기본 템플릿/연결 시드 SQL 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplate.java`
- 변경 전: 관리자 이메일 템플릿을 영속화하거나 생성·수정·복제·초기화·논리 삭제 감사를 기록할 모델이 없었다.
- 변경 후: `INQUIRY_STATUS` 범위의 HTML/평문 템플릿과 nullable 시스템 키, 관리자 FK 3개, 수명주기 메서드를 포함하는 엔티티를 추가했다.
- 이유: 후속 관리자 CRUD와 상태 알림 발송이 동일한 템플릿 계약을 사용하도록 하기 위함이다.

#### `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateBinding.java`, `EmailTemplateEvent.java`
- 변경 전: 문의 종료 상태와 발송 이벤트 및 선택된 템플릿의 연결 계약이 없었다.
- 변경 후: 세 종료 상태만 고정 이벤트로 매핑하고, 이벤트 코드를 기본 키로 한 변경 가능한 연결을 추가했다.
- 이유: 관리자가 상태별 템플릿을 교체하거나 연결을 해제할 수 있고, 해제 상태를 시드 재실행이 덮어쓰지 않게 하기 위함이다.

#### `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java`
- 변경 전: 발송 대기열은 평문 `body`만 스냅샷으로 보관했다.
- 변경 후: nullable `htmlBody`를 함께 보관하며 기존 6인자 팩터리는 HTML이 null인 7인자 팩터리로 위임한다.
- 이유: 기존 plain text 호출 호환성을 유지하면서 멀티파트 발송 기반을 제공하기 위함이다.

#### `backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateRepository.java`, `EmailTemplateBindingRepository.java`
- 변경 전: 템플릿 목록·단건 잠금·이벤트 연결을 조회할 저장소가 없었다.
- 변경 후: 논리 삭제 제외 검색, 시스템 키/범위 조회, 비관적 쓰기 잠금 및 이벤트/템플릿 연결 조회를 추가했다.
- 이유: 후속 서비스의 동시성 안전 CRUD와 참조 검사를 지원하기 위함이다.

#### `backend/src/main/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunner.java`
- 변경 전: 기존 `InquirySchemaMigrationRunner`가 legacy 컬럼이 없으면 조기 종료하여 오래된 3상태 DB 제약조건을 독립적으로 보정할 수 없었다.
- 변경 후: 현재 제약 정의에서 상태 리터럴 집합을 읽어 정확한 6상태가 아닐 때만 drop/add하는 별도 러너를 추가했다.
- 이유: PostgreSQL 표현 형식 차이에도 재실행이 안전하고 기존 러너의 조기 종료와 무관하게 상태 저장을 보장하기 위함이다.

#### `docs/db-migration/20260831_01_admin_email_template_management.sql`
- 변경 전: 운영 DB에 템플릿 테이블·HTML 스냅샷 컬럼과 최신 문의 상태 제약을 적용할 재실행 가능한 SQL이 없었다.
- 변경 후: 한 트랜잭션에서 스키마와 6상태 제약을 보정하고, system key가 모두 없던 최초 실행에만 세 기본 연결을 생성하는 시드를 추가했다.
- 이유: 누락 시스템 템플릿은 보완하되 기존 내용과 관리자가 해제한 binding을 재실행으로 복구하지 않기 위함이다.

#### `backend/src/test/java/com/tpmp/testprep/**`
- 변경 전: 새 데이터 모델·저장소·HTML 스냅샷·제약 보정 동작을 검증하는 테스트가 없었다.
- 변경 후: 엔티티, JPA 저장소, 발송 스냅샷, 멱등 러너 focused tests를 추가했다.
- 이유: 수명주기·조회·호환성·재실행 안전 계약의 회귀를 방지하기 위함이다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-001)로 복원 시 추가된 이메일 템플릿 엔티티·이벤트·저장소·러너·테스트·마이그레이션 파일을 제거하고, `InquiryEmailDelivery`에서 `htmlBody` 필드와 7인자 `pending` 오버로드를 제거한 뒤 기존 6인자 생성 로직을 복원한다. 운영 DB에 SQL을 이미 적용했다면 애플리케이션 롤백 전에 binding/템플릿 테이블 및 `html_body` 컬럼 의존 데이터를 별도로 백업하고 역마이그레이션한다.
