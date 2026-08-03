# DB 콘텐츠 데이터 덤프

다른 로컬 환경에서도 동일한 **콘텐츠 데이터(문항·시험·연습 데이터)** 를 공유하기 위한 덤프입니다.

> 마지막 갱신: 2026-08-03 (리눅스마스터 1급/2급·SQLD 기출문제에 대응하는 시험지·시험·시험문항 신규 생성 — exams 3건/examinations 3건/questions 230건 + 해당 문항 237건 AI 키워드·도메인 분석 결과 반영. 리눅스마스터 2급 exam_info 8건 추가 — `DataInitializer.ensureLinuxMaster2ExamInfo()`가 매 백엔드 기동 시 생성하는 데이터를 콘텐츠 덤프에도 동기화)

## ⚠️ 로드 순서 (반드시 3단계로 진행)

이 프로젝트는 아직 Flyway/Liquibase를 쓰지 않고 `docs/db-migration/`에 수동 SQL 파일을 쌓아가는 방식입니다(`docs/db-guidelines.md` §10 참고).

1. **베이스라인 스키마 적용** — `docs/db-migration/00000000_00_baseline_schema.sql` **1개만** 실행. 33개 테이블 전체를 만듭니다.
2. **백엔드 최초 1회 기동** — `DataInitializer`가 시드 계정(admin=id 1, user=id 2)·메뉴·권한을 생성합니다. 3단계 덤프의 FK가 이 계정을 참조하므로 반드시 먼저 띄웁니다.
3. **콘텐츠 데이터 덤프 로드** — `tpmp_content_data.sql`을 로드합니다.

> ### ❗ 델타 마이그레이션 34개는 신규 DB에 적용하지 마세요
>
> `20260701_01` ~ `20260722_06` 34개 파일은 **이미 콘텐츠가 들어있는 DB를 전제로 한 변경 이력**입니다. 이 중 10개는 스키마 변경이 아니라 데이터 보정(기출문제 백필·재채점·AI 커스텀 시험 생성)이라, 콘텐츠가 없는 빈 DB에서 실행하면 전제 조건 검사나 FK 제약으로 **실패합니다**.
>
> 신규 DB에 필요한 것은 두 가지뿐입니다.
> - **스키마** → 베이스라인 파일 1개 (34개를 모두 적용한 뒤의 최종 스키마)
> - **데이터** → `tpmp_content_data.sql` (34개를 모두 적용한 뒤의 최종 데이터)
>
> 34개 델타 파일은 **변경 이력 추적용으로 보존**하며, 실행 대상이 아닙니다.

### 상황별 필요한 단계

| 내 환경 | 해야 할 것 |
|---------|-----------|
| 저장소를 새로 클론 / 빈 DB | 1 → 2 → 3 전부 |
| 다른 컴퓨터에 **일부 스키마·데이터가 이미 있음** | 1 → 3 (베이스라인이 없는 테이블·컬럼만 채워 넣고, 덤프가 없는 콘텐츠만 채웁니다. 둘 다 재실행 안전) |
| 계속 개발해온 최신 로컬 | 3만 (또는 아무것도 안 해도 됨) |

베이스라인·콘텐츠 덤프 모두 **재실행해도 안전**하므로, 내 환경 상태가 확실하지 않으면 1 → 3을 그냥 다시 돌리면 됩니다.

## 파일

| 파일 | 설명 |
|------|------|
| `tpmp_content_data.sql` | 콘텐츠 데이터 (data-only, `INSERT ... ON CONFLICT DO NOTHING`) |

## 포함 / 제외 범위

**포함** — 공유 가치가 있는 콘텐츠
- `domain_master`, `domain_slave` — 카테고리(문제 유형)·시험 유형·연도·회차
- `question_bank` — 퀴즈 문항은행 전체(AI 커스텀 포함)
- `exams`, `examinations`, `questions` — 시험지·시험·시험 문항
- `exam_info` — 시험 정보
- `dialect_conversion_rules` — SQL 방언 변환 규칙
- `prac_departments`, `prac_products`, `prac_employees`, `prac_orders` — 연습용 샘플 DB
- `concept_notes` — 개념노트
- `support_settings` — 후원 링크(토스/카카오페이/카카오 선물하기) 설정. 특정 사용자에 속하지 않는 **사이트 전역 싱글톤 설정**이라 콘텐츠로 판단해 포함.

**제외** — 개인정보 / 인증 / 앱이 자동 시드하는 데이터
- `users` (백엔드 `DataInitializer`가 `admin@tpmp.com`=id 1, `user@tpmp.com`=id 2로 시드)
- `*_history`(quiz/exam/practice/login), `exam_session`
- `notion_integrations`(토큰), `user_interested_exam`, `user_question_bookmarks`, `user_granted_permissions`
- `user_exam_applications` — 사용자가 직접 입력한 개인 시험 접수 정보(접수일·시험일·메모). `user_id` FK로 특정 사용자에 종속되고, 다른 로컬 환경과 공유할 "콘텐츠"가 아니라 개인 기록이므로 기존 `user_interested_exam`류와 동일하게 제외.
- `menu_config`, `permission_master`, `permission_detail` (앱이 시드)

> `exams`/`examinations`의 `created_by`, `concept_notes`의 `user_id`는 각각 시드 계정(admin=1, user=2)을 참조하므로, 백엔드가 한 번 기동해 시드 계정이 만들어진 뒤 로드하면 FK가 맞습니다.

## 스키마 마이그레이션 (`docs/db-migration/`)

Flyway/Liquibase 미사용 프로젝트이므로, 스키마 변경은 `docs/db-migration/{YYYYMMDD}_{순번}_{설명}.sql` 파일로 남기고 기존 환경에 **파일명 순서대로 수동 적용**합니다(`docs/db-guidelines.md` §10).

### 베이스라인 (신규 DB가 실행할 유일한 파일)

| 파일 | 요약 |
|------|------|
| `00000000_00_baseline_schema.sql` | **33개 테이블 전체 정의** — 2026-08-02 기준 원본 로컬 DB의 `pg_dump --schema-only` 결과(= 아래 델타 34개가 모두 적용된 최종 스키마). 재실행 안전하며, 이미 일부 스키마가 있는 DB에는 없는 테이블·컬럼·제약·인덱스만 채워 넣습니다. |

### 델타 이력 (보존용 — 신규 DB에서 실행하지 말 것)

아래 34개는 위 베이스라인에 **이미 전부 반영되어 있습니다**. 변경 경위를 추적하기 위해 남겨둘 뿐이며, 이 중 10개(`20260717_03`, `20260717_05`, `20260720_01·02·04`, `20260721_01·03·05·07`, `20260722_02`)는 빈 DB에서 실행하면 실패합니다.

| # | 파일 | 요약 |
|---|------|------|
| 1 | `20260701_01_exams_del_yn_char_to_varchar.sql` | `exams.del_yn` 컬럼 타입을 CHAR(1) → VARCHAR(1)로 통일 |
| 2 | `20260701_02_question_bank_ai_analysis.sql` | `question_bank`에 AI 분석 결과 컬럼(ai_keywords/ai_domains/ai_difficulty/ai_summary) 추가 |
| 3 | `20260702_01_drop_keyword_tag.sql` | `keyword_tag`(전역 태그 사전) 기능 제거에 따른 테이블 삭제 |
| 4 | `20260706_01_question_bank_scheduling_data.sql` | `question_bank`에 CPU 스케줄링 구조화 문항 데이터 컬럼 추가 |
| 5 | `20260706_02_question_bank_instruction.sql` | `question_bank`에 발문(지시문) 컬럼 추가 |
| 6 | `20260707_01_question_bank_question_no.sql` | `question_bank`에 원본 시험 문항번호 컬럼 추가 |
| 7 | `20260709_01_question_bank_sql_data.sql` | `question_bank`에 SQL 구조화 문항 데이터(테이블/컬럼/샘플) 컬럼 추가 |
| 8 | `20260717_01_add_question_source_sync.sql` | 시험지 문항을 `question_bank` 원본과 연결(스냅샷 필드 유지) |
| 9 | `20260717_02_expand_question_structured_types.sql` | 시험 문항/응시 이력에 SCHEDULING·SQL 구조화 문항 스냅샷 저장 |
| 10 | `20260717_03_backfill_all_exam_question_sources.sql` | 기출 시험지 `questions` ↔ `question_bank` 연결·동기화 백필 |
| 11 | `20260717_04_add_exam_history_detail_title.sql` | `exam_history_details`에 제출 시점 문항 제목(title) 컬럼 추가 |
| 12 | `20260717_05_regrade_2025_round2_q11_q19_q20.sql` | 2025년 2회 11·19·20번 정답 데이터·기존 오답 이력 재채점 보정 |
| 13 | `20260718_01_add_exam_history_question_bank_id.sql` | `exam_history_details`에 제출 시점 원본 문제은행 ID 스냅샷 컬럼 추가 |
| 14 | `20260718_02_disable_alternative_answer.sql` | 문항별 "대체 정답(`\|\|`) 구분자 사용 안 함" 플래그 컬럼 추가 |
| 15 | `20260718_03_q7_sql_result_table.sql` | 2025년 1회 7번(SQL 조인 실행 결과) 문항을 SQL 결과표 유형으로 전환 |
| 16 | `20260720_01_ai_custom_exam_2026_r1.sql` | "2026년 1회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 17 | `20260720_02_ai_custom_exam_2025_r3.sql` | "2025년 3회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 18 | `20260720_03_ai_custom_questionbank.sql` | AI 커스텀 시험(2026-1·2025-3) 40문항을 `question_bank`에도 등록 |
| 19 | `20260720_04_ai_custom_exam_2025_r2.sql` | "2025년 2회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 20 | `20260720_05_ai_custom_questionbank_2025_r2.sql` | AI 커스텀 시험(2025-2) 20문항을 `question_bank`에도 등록 |
| 21 | `20260721_01_ai_custom_exam_2025_r1.sql` | "2025년 1회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 22 | `20260721_02_ai_custom_questionbank_2025_r1.sql` | AI 커스텀 시험(2025-1) 20문항을 `question_bank`에도 등록 |
| 23 | `20260721_03_ai_custom_exam_2024_r3.sql` | "2024년 3회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 24 | `20260721_04_ai_custom_questionbank_2024_r3.sql` | AI 커스텀 시험(2024-3) 20문항을 `question_bank`에도 등록 |
| 25 | `20260721_05_ai_custom_exam_2026_r2.sql` | "2026년 2회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성 |
| 26 | `20260721_06_ai_custom_questionbank_2026_r2.sql` | AI 커스텀 시험(2026-2) 20문항을 `question_bank`에도 등록 |
| 27 | `20260721_07_original_exam_2026_r2.sql` | "2026년 2회 정보처리기사 실기" 원본(기존 그대로) 시험 신규 생성 |
| 28 | `20260721_08_original_questionbank_2026_r2.sql` | "2026년 2회 정보처리기사 실기"(원본) 20문항을 `question_bank`에 등록 |
| 29 | `20260721_09_create_user_exam_applications.sql` | `user_exam_applications` 테이블 신규 생성 (사용자 개인 시험 접수 정보) |
| 30 | `20260722_01_examinations_add_year_round_ai_custom.sql` | `examinations`에 `exam_year`/`exam_round`/`is_ai_custom` 컬럼 추가 |
| 31 | `20260722_02_add_audit_flags_exam_examination_question.sql` | `exams`/`examinations`/`questions`에 `del_yn`·`use_yn` 소프트 삭제·비활성화 플래그 추가 |
| 32 | `20260722_04_rename_ai_custom_exam_titles.sql` | AI 커스텀 시험 6개 제목을 "TPMP 모의고사 N회" 사이트 자체 표기로 변경 |
| 33 | `20260722_05_fix_ai_custom_exam_title_order.sql` | "TPMP 모의고사 N회" 회차 순서가 반대로 매겨진 것을 정정(20260722_04 보정) |
| 34 | `20260722_06_create_support_settings.sql` | `support_settings` 테이블 신규 생성 (후원 링크 관리) |
| 35 | `20260802_01_create_linux_sqld_exams.sql` | 리눅스마스터 1급/2급·SQLD 기출문제(`question_bank`)에 대응하는 시험지(`exams`)·시험(`examinations`)·시험문항(`questions`) 신규 생성 — 스키마 변경 없음(데이터만), 베이스라인에는 미반영이라 `tpmp_content_data.sql`에도 함께 반영됨(신규 DB는 델타 실행 불필요, 콘텐츠 덤프로 충분) |

> 번호 30 다음이 32인 이유: `20260722_03`는 결번(작업 중 취소되어 파일명이 존재하지 않음)입니다. 실제 `docs/db-migration/` 디렉터리 파일 목록과 위 표는 항상 일치해야 하므로, 새 마이그레이션을 추가하면 이 표도 함께 갱신하세요.

### 앞으로 새 스키마 변경이 생기면

지금까지처럼 `{YYYYMMDD}_{순번}_{설명}.sql` 델타 파일을 새로 만들고 위 표에 한 줄 추가하면 됩니다. 베이스라인 파일은 손대지 않습니다. 델타가 다시 많이 쌓여 신규 DB 구축이 번거로워지면, 그때 새 날짜의 베이스라인으로 교체하고 이전 델타를 `docs/db-migration/archive/`로 옮깁니다.

## 로드 방법

### 0) 베이스라인 스키마 적용

```bash
docker cp docs/db-migration/00000000_00_baseline_schema.sql tpmp-db:/tmp/base.sql
docker exec tpmp-db psql -U tpmp -d tpmp -v ON_ERROR_STOP=1 -f /tmp/base.sql
```

실행하면 맨 앞의 `existing_table_count`로 현재 상태(0=신규 DB, 33=이미 최신, 그 사이=부분 적용)를 알 수 있고, 맨 뒤에 검증 결과가 출력됩니다. 기대값은 **33개 테이블 / 279개 컬럼 / PK 33 · FK 31 · UNIQUE 9 · CHECK 9**입니다.

> 마지막 검증 쿼리(7-4)에 컬럼이 나열되면, 원래 `NOT NULL`이어야 하는데 기존 데이터에 NULL이 남아 승격되지 못한 컬럼입니다. 해당 컬럼을 백필한 뒤 `ALTER TABLE <t> ALTER COLUMN <c> SET NOT NULL;`을 수동 실행하세요. 신규 DB나 정상적인 부분 적용 환경에서는 보통 비어 있습니다.

### 1) 사전 준비 (중요)

덤프에는 `exams.created_by=1`, `concept_notes.user_id=2`처럼 **시드 계정을 참조하는 FK**가 있으므로,
**백엔드를 최초 1회 기동해 시드 계정(admin=id 1, user=id 2)과 기본 도메인이 만들어진 뒤** 로드해야 합니다.

```bash
# 1) 저장소 클론 후 .env 준비 (루트 .env.example 참고, 없으면 기본값 사용)
# 2) 스택 기동 → DataInitializer가 admin/user/도메인/메뉴/권한을 시드
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d   # DB만
# 또는 전체 스택: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
#   (로컬 gradle 구동이면 backend/run-dev.sh 로 백엔드를 최초 1회 기동)
```

> 백엔드 기동 순서 주의: prod 프로필은 `ddl-auto: validate`라 스키마가 없으면 기동 자체가 실패합니다. 반드시 0단계를 먼저 하세요. local/dev 프로필은 `ddl-auto: update`라 기동만으로도 스키마가 만들어지지만, 그러면 운영과 스키마가 미세하게 어긋날 수 있으므로 0단계를 거치는 쪽을 권장합니다.

### 2) 콘텐츠 데이터 로드 (권장 — 플랫폼 무관, 인코딩 안전)

파일을 컨테이너로 복사한 뒤 `psql -f`로 실행합니다. 윈도우 PowerShell의 리다이렉션/인코딩 문제를 피할 수 있습니다.

```bash
docker cp docs/sql/tpmp_content_data.sql tpmp-db:/tmp/dump.sql
docker exec tpmp-db psql -U tpmp -d tpmp -v ON_ERROR_STOP=1 -f /tmp/dump.sql
```

### 로드 (대안 — stdin 리다이렉션)

- **Git Bash / macOS / Linux**
  ```bash
  docker exec -i tpmp-db psql -U tpmp -d tpmp < docs/sql/tpmp_content_data.sql
  ```
- **Windows PowerShell** — `<` 리다이렉션 미지원. `cmd`로 실행하거나 위 "권장" 방식을 쓰세요.
  ```powershell
  cmd /c "docker exec -i tpmp-db psql -U tpmp -d tpmp < docs\sql\tpmp_content_data.sql"
  ```

### 검증

```bash
docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT count(*) FROM question_bank;"
```

### 참고

- `ON CONFLICT DO NOTHING` 이라 **이미 존재하는 행은 건너뛰고** 없는 콘텐츠만 채워집니다(여러 번 실행해도 안전).
- `ON_ERROR_STOP=1` 로 실행하면 오류 발생 시 즉시 중단되어 원인을 바로 확인할 수 있습니다.
- 로드 후 IDENTITY 시퀀스는 덤프 말미의 `setval`로 자동 보정되어, 이후 신규 등록 시 ID 충돌이 없습니다.
- DB 컨테이너명(`tpmp-db`)·사용자(`tpmp`)·DB명(`tpmp`)은 `docker-compose.yml` 기준이며, 다르면 그에 맞게 바꾸세요.
- 베이스라인 스키마를 적용하지 않은 채 콘텐츠 데이터를 로드하면 `examinations.exam_year` 등 없는 컬럼/테이블(`support_settings`) 관련 오류로 즉시 실패합니다. 반드시 이 문서 최상단의 "로드 순서" 3단계를 지키세요.

## 재생성 방법

원본 로컬에서 아래처럼 테이블별 `pg_dump`(data-only, column-inserts, on-conflict-do-nothing)를 **FK 의존 순서**로 이어 붙이고, 말미에 `setval`을 추가하면 됩니다.

```bash
docker exec tpmp-db pg_dump -U tpmp -d tpmp --data-only --column-inserts \
    --on-conflict-do-nothing --no-owner --no-privileges --table=public.question_bank
```

현재 파일의 테이블 순서(FK 의존순): `domain_master` → `domain_slave` → `exams`(FK: users) → `examinations`(FK: exams, domain_slave, users) → `question_bank`(FK: domain_slave) → `questions`(FK: exams, question_bank, domain_slave — **`question_bank`보다 반드시 뒤**) → `exam_info`/`dialect_conversion_rules`/`prac_*`(독립) → `concept_notes`(FK: questions, question_bank, users) → `support_settings`(독립).

> 개인정보·인증·이력 테이블은 반드시 제외하세요. `users`를 포함하면 비밀번호 해시가 저장소에 커밋됩니다. 새 테이블을 추가할지 판단할 때는 "특정 사용자에 종속된 개인 데이터인가(제외) vs 여러 로컬 환경이 공유할 콘텐츠/전역 설정인가(포함)"를 기준으로 삼으세요.
