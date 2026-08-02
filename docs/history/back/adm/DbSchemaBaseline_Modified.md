# DB 스키마 베이스라인 수정 이력

`docs/db-migration/` 의 베이스라인 스키마 및 마이그레이션 적용 절차 관련 변경 이력.

---

## HIST-20260802-002

- **날짜**: 2026-08-02
- **수정 범위**: 관리자 백엔드 / DB 스키마·마이그레이션
- **수정 개요**: 다른 로컬(31테이블·question_bank 266행 상태)에 베이스라인+콘텐츠 덤프 실제 적용 중 발견된 베이스라인 스크립트의 CHECK 제약 미갱신 버그 수정

### 문제 배경

- `HIST-20260802-001`의 베이스라인 스크립트 `[5] 제약조건` 섹션은 헤더에 "PK / FK / UNIQUE / CHECK"라고 명시했지만 실제로는 PK/FK/UNIQUE만 가드 처리했고 CHECK 제약은 전혀 다루지 않았다.
- `questions_question_type_check`/`question_bank_question_type_check`처럼 값 목록이 델타 이력 중 확장된(`SCHEDULING`/`SQL` 추가) CHECK 제약은 `CREATE TABLE IF NOT EXISTS` 내부에만 최신 정의로 존재해, **이미 테이블이 있던 로컬**에서는 옛 정의(`MULTIPLE_CHOICE`/`SHORT_ANSWER`/`OX`/`CODE`만 허용)가 그대로 남아 있었다.
- 검증 당시(HIST-20260802-001) 사용한 테스트 DB들은 이 드리프트를 재현하지 못해 발견되지 않았고, 실제로 델타를 일부만 적용받은 로컬에 적용하면서 `docs/sql/tpmp_content_data.sql` 로드 중 SCHEDULING 문항 INSERT가 `questions_question_type_check` 위반으로 실패했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/00000000_00_baseline_schema.sql` | 수정 | `[5]`~`[6]` 사이에 `question_bank_question_type_check`/`questions_question_type_check`를 정의에 `SCHEDULING`이 없으면 DROP 후 재생성하는 가드 블록 추가 |

### 검증

- 로컬 DB(`tpmp-db-local`, 볼륨 `test_preparation_master_project_postgres_data_local`)에 실제 적용:
  - 베이스라인 적용 전: 31테이블, `questions_question_type_check`가 SCHEDULING/SQL 미포함 구버전
  - 베이스라인 1차 적용 → 33테이블/279컬럼/PK33·FK31·UNIQUE9·CHECK9, ERROR 0 (이때는 아직 CHECK 갱신 로직 없이 실행했었음)
  - 콘텐츠 덤프 로드 중 `questions_question_type_check` 위반으로 실패(라인 3885, SCHEDULING 문항) → 원인 확인 후 스크립트에 위 가드 블록 추가
  - 제약 수동 보정 후 콘텐츠 덤프 재실행(멱등, `ON CONFLICT DO NOTHING`) → 끝까지 성공
  - 수정된 베이스라인 스크립트를 이 로컬에 재실행 → ERROR 0, 33테이블/279컬럼/PK33·FK31·UNIQUE9·CHECK9 유지(멱등성 확인)
  - 최종 데이터: `question_bank` 636행, `domain_slave` 33행, `exam_info` 11행, `questions` 240행, `support_settings` 1행 — 라이브 DB 기준과 일치

## HIST-20260802-001

- **날짜**: 2026-08-02
- **수정 범위**: 관리자 백엔드 / DB 스키마·마이그레이션
- **수정 개요**: 신규 DB 구축이 불가능하던 문제 해결 — 전체 테이블 정의를 담은 베이스라인 스키마 파일 신규 추가 및 로드 절차 정정

### 문제 배경

- `docs/db-migration/` 의 34개 파일은 **전부 기존 테이블을 전제로 한 ALTER/데이터 보정**이었고, `CREATE TABLE` 로 신규 테이블을 만드는 것은 `user_exam_applications`·`support_settings` 2개뿐이었다.
- 베이스 스키마 역할을 하던 `docs/sql/tpmp_dump.sql` 은 2026-05-12자 **17개 테이블**만 담고 있어, 당시 33개였던 실제 스키마와 16개 테이블·148개 컬럼 차이가 있었다. 검증 결과 `exam_info.application_url` 처럼 베이스 덤프에도 마이그레이션에도 없는 컬럼이 실재했다.
- prod 프로필은 `ddl-auto: validate` 라 Hibernate가 스키마를 만들어주지 않는다. 결과적으로 배포 가이드대로 신규 DB에 마이그레이션을 적용하면 첫 파일(`20260701_01`)부터 `relation "exams" does not exist` 로 실패하는 상태였다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/00000000_00_baseline_schema.sql` | 신규 | 33개 테이블 전체 정의(재실행 안전) |
| `docs/sql/README.md` | 수정 | 로드 순서를 2단계 → 3단계로 정정, 델타 34개 실행 금지 경고 및 상황별 절차표 추가 |
| `docs/deployment-guide.md` | 수정 | 배포 체크리스트의 "34개 순서대로 적용" → "베이스라인 1개 적용 + 백엔드 기동 + 콘텐츠 덤프" |
| `docs/db-guidelines.md` | 수정 | §10에 "베이스라인 스키마" 하위 절 추가 |

### 수정 상세

#### `docs/db-migration/00000000_00_baseline_schema.sql` (신규)

2026-08-02 기준 원본 로컬 DB(`tpmp-db`)의 `pg_dump --schema-only --no-owner --no-privileges` 결과를 재실행 안전하게 가공했다. 파일명이 `00000000_00` 이라 정렬상 항상 맨 앞이다.

구성:

| 섹션 | 내용 | 멱등성 확보 방식 |
|------|------|-----------------|
| [0] | 적용 전 현재 테이블 수 확인 | 조회 전용 |
| [1] | 테이블 33개 생성 | `CREATE TABLE IF NOT EXISTS` |
| [2] | 시퀀스 4개(`prac_*` 레거시) + 컬럼 DEFAULT | `CREATE SEQUENCE IF NOT EXISTS` |
| [3] | IDENTITY 컬럼 28개 | `pg_attribute.attidentity` 확인 후 조건부 실행 |
| [4] | 컬럼 279개 보정 | `ADD COLUMN IF NOT EXISTS` (기존 행 충돌 방지로 `NOT NULL` 제거, `DEFAULT`는 유지해 자동 백필) |
| [4b] | NOT NULL 승격 | NOT NULL 대상 164개 컬럼 루프 — 실제 NULL이 0건일 때만 `SET NOT NULL`, 남아있으면 `RAISE NOTICE` 후 보류 |
| [5] | 제약조건 73개(PK/FK/UNIQUE) | `pg_constraint` 이름 조회 가드 + PK는 `contype='p'` 존재 여부도 검사 |
| [6] | 인덱스 14개 | `CREATE INDEX IF NOT EXISTS` |
| [7] | 적용 후 검증 4종 | 테이블 누락·컬럼 수·제약 수·nullable 드리프트 보고 |

- PK 중복은 `duplicate_object` 가 아니라 `invalid_table_definition` 으로 실패해 `EXCEPTION WHEN duplicate_object` 로는 잡히지 않았다. 예외 처리 대신 `pg_constraint` 사전 조회 가드로 해결했다.
- `[4]` 가 `NOT NULL` 을 떼고 컬럼을 추가하므로, 컬럼이 이미 채워진 경우를 `[4b]` 가 다시 `NOT NULL` 로 승격시킨다. `DEFAULT` 가 붙은 컬럼(`del_yn`/`use_yn`/`is_ai_custom`/`disable_alternative_answer` 등)은 `ADD COLUMN` 시점에 PostgreSQL이 기존 행을 백필하므로 이 경로로 자동 복구된다.

#### `docs/sql/README.md`

- 변경 전: "1. 마이그레이션 34개 전부 적용 → 2. 콘텐츠 덤프 로드" 2단계
- 변경 후: "1. 베이스라인 1개 적용 → 2. 백엔드 최초 기동(시드) → 3. 콘텐츠 덤프 로드" 3단계
- 델타 34개를 신규 DB에 적용하지 말라는 경고 블록 추가. 실제 검증에서 34개 중 **10개**(`20260717_03`, `20260717_05`, `20260720_01·02·04`, `20260721_01·03·05·07`, `20260722_02`)가 빈 DB에서 실패했다. 스키마 변경이 아니라 기존 콘텐츠를 고치는 데이터 보정(백필·재채점·AI 커스텀 시험 생성)이라 전제 조건 검사나 FK 제약에 걸린다.
- 상황별(신규 클론 / 부분 스키마 보유 / 최신 로컬) 필요 단계 표 추가.
- 마이그레이션 목록을 "베이스라인(실행 대상)"과 "델타 이력(보존용)"으로 분리.

### 검증

로컬 `tpmp-db` 컨테이너에 임시 DB를 만들어 실행 검증했다.

| 시나리오 | 결과 |
|----------|------|
| 빈 DB에 1회 적용 | 33테이블 / 279컬럼 / PK 33 · FK 31 · UNIQUE 9 · CHECK 9, ERROR 0건 |
| 빈 DB에 4회 연속 적용 | ERROR 0건 (멱등성 확인) |
| 적용 결과 vs 원본 DB `pg_dump` 비교 | 테이블·컬럼·FK·인덱스 완전 일치. CHECK 제약 **표현식 렌더링 표기만** 상이(`ANY ((ARRAY[...])::text[])` vs `ANY (ARRAY[(...)::text, ...])`) — 의미 동일 |
| 구 스키마(`tpmp_dump.sql` 17테이블) + 기존 데이터에 적용 | 17테이블 131컬럼 → 33테이블 280컬럼으로 수렴, 기존 데이터 보존, nullable 드리프트 0건, ERROR 0건 |
| 전체 절차(베이스라인 → 시드계정 → 콘텐츠 덤프) | 원본 라이브 DB와 콘텐츠 행 수 완전 일치 (question_bank 636 / questions 240 / exams 12 / examinations 12 / exam_info 11 / domain_slave 33 / concept_notes 1 / support_settings 1) |

- 구 스키마 수렴 시 `users.interested_exam_types` 1개가 잔여 컬럼으로 남는다. `user_interested_exam` 테이블 도입 시 제거된 레거시 컬럼으로, 베이스라인은 컬럼을 삭제하지 않는 설계이므로 정상이다. Hibernate `validate` 는 여분 컬럼을 문제 삼지 않는다.

### 복원 방법

HIST-20260802-001 복원 시:
- `docs/db-migration/00000000_00_baseline_schema.sql` 파일 삭제
- `docs/sql/README.md` — "로드 순서" 절을 2단계 버전으로, "스키마 마이그레이션" 절을 단일 34행 표로 되돌림
- `docs/deployment-guide.md` — 체크리스트 항목을 `docs/db-migration/*.sql` 34개 일괄 적용으로 되돌림
- `docs/db-guidelines.md` — §10의 "베이스라인 스키마" 하위 절 제거
- DB 변경 없음(문서·SQL 파일 추가만 있었고 원본 로컬 DB에는 아무것도 실행하지 않았음)

---
