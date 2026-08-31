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
