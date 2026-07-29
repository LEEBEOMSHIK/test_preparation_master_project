# DB 콘텐츠 데이터 덤프

다른 로컬 환경에서도 동일한 **콘텐츠 데이터(문항·시험·연습 데이터)** 를 공유하기 위한 덤프입니다.

> 마지막 갱신: 2026-07-29 (리눅스마스터 1급 100문항·2급 80문항 + SQLD 제60회 50문항 기출문제, 신규 domain_slave "리눅스마스터 2급", exam_info 8건(리눅스마스터 1급·SQLD 각 4회차) 반영)

## ⚠️ 로드 순서 (반드시 2단계로 진행)

이 프로젝트는 아직 Flyway/Liquibase를 쓰지 않고 `docs/db-migration/`에 수동 SQL 파일을 순서대로 쌓아가는 방식입니다(`docs/db-guidelines.md` §10 참고). 따라서 콘텐츠 데이터 덤프를 로드하기 **전에** 스키마가 먼저 최신 상태여야 합니다.

1. **스키마 마이그레이션 전부 적용** — `docs/db-migration/` 아래 파일을 **파일명(날짜_순번) 오름차순**으로 전부 실행. 아래 [스키마 마이그레이션 목록](#스키마-마이그레이션-docsdb-migration) 참고.
2. **콘텐츠 데이터 덤프 로드** — 1단계가 끝난 뒤에만 `tpmp_content_data.sql`을 로드합니다(신규 컬럼 `examinations.exam_year/exam_round/is_ai_custom/del_yn/use_yn`, `exams.use_yn`, `questions.del_yn/use_yn`, 신규 테이블 `support_settings` 등을 이 덤프가 사용하므로, 스키마가 없으면 로드가 실패합니다).

새로 저장소를 클론한 로컬 환경은 반드시 이 순서를 지켜야 합니다. 이미 최신 스키마인 로컬(예: 계속 개발해온 환경)은 1단계를 건너뛰고 2단계만 실행하면 됩니다.

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

Flyway/Liquibase 미사용 프로젝트이므로, 스키마 변경은 `docs/db-migration/{YYYYMMDD}_{순번}_{설명}.sql` 파일로 남기고 로컬·스테이징·운영에 **파일명 순서대로 수동 적용**합니다(`docs/db-guidelines.md` §10). 콘텐츠 데이터 덤프를 로드하기 전 아래 표의 파일을 전부(위에서 아래 순서로) 적용하세요.

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

> 번호 30 다음이 32인 이유: `20260722_03`는 결번(작업 중 취소되어 파일명이 존재하지 않음)입니다. 실제 `docs/db-migration/` 디렉터리 파일 목록과 위 표는 항상 일치해야 하므로, 새 마이그레이션을 추가하면 이 표도 함께 갱신하세요.

## 로드 방법

### 0) 스키마 마이그레이션 적용

위 [스키마 마이그레이션 목록](#스키마-마이그레이션-docsdb-migration)을 파일명 순서대로 적용합니다.

```bash
for f in docs/db-migration/*.sql; do
  docker cp "$f" tpmp-db:/tmp/mig.sql
  docker exec tpmp-db psql -U tpmp -d tpmp -v ON_ERROR_STOP=1 -f /tmp/mig.sql
done
```

> 이미 적용된 로컬(계속 개발해온 환경)이라면 이 단계는 건너뛰어도 됩니다. 각 마이그레이션 파일은 `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` 위주로 작성되어 재실행에 비교적 안전하지만, 확실치 않으면 파일 상단 주석의 "적용 전 확인" 쿼리로 먼저 확인하세요.

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
- 스키마 마이그레이션을 적용하지 않은 채 콘텐츠 데이터를 로드하면 `examinations.exam_year` 등 없는 컬럼/테이블(`support_settings`) 관련 오류로 즉시 실패합니다. 반드시 이 문서 최상단의 "로드 순서" 2단계를 지키세요.

## 재생성 방법

원본 로컬에서 아래처럼 테이블별 `pg_dump`(data-only, column-inserts, on-conflict-do-nothing)를 **FK 의존 순서**로 이어 붙이고, 말미에 `setval`을 추가하면 됩니다.

```bash
docker exec tpmp-db pg_dump -U tpmp -d tpmp --data-only --column-inserts \
    --on-conflict-do-nothing --no-owner --no-privileges --table=public.question_bank
```

현재 파일의 테이블 순서(FK 의존순): `domain_master` → `domain_slave` → `exams`(FK: users) → `examinations`(FK: exams, domain_slave, users) → `question_bank`(FK: domain_slave) → `questions`(FK: exams, question_bank, domain_slave — **`question_bank`보다 반드시 뒤**) → `exam_info`/`dialect_conversion_rules`/`prac_*`(독립) → `concept_notes`(FK: questions, question_bank, users) → `support_settings`(독립).

> 개인정보·인증·이력 테이블은 반드시 제외하세요. `users`를 포함하면 비밀번호 해시가 저장소에 커밋됩니다. 새 테이블을 추가할지 판단할 때는 "특정 사용자에 종속된 개인 데이터인가(제외) vs 여러 로컬 환경이 공유할 콘텐츠/전역 설정인가(포함)"를 기준으로 삼으세요.
