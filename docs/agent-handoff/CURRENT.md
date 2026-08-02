# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-02

## 현재 목표와 사용자 결정 사항

- 마이그레이션 파일이 최신인지 점검 → 신규 DB 구축이 불가능한 구조적 결함 발견.
- 사용자 요청: 베이스라인 스키마 파일을 만들고, **다른 컴퓨터(일부 스키마·데이터가 이미 있는 환경)** 에서 작업을 이어받는 절차도 함께 정리할 것.

## 점검 결과 (착수 전 진단)

- **델타 마이그레이션 34개는 최신** — 마지막 `20260722_06`(support_settings). 이후 변경된 엔티티는 `SupportSettings.java` 하나이고 해당 마이그레이션이 이미 존재. 디렉터리 34개 = `docs/sql/README.md` 표 = `deployment-guide.md` 기재 수 일치.
- **콘텐츠 덤프도 최신** — `tpmp_content_data.sql`(2026-07-29)과 라이브 DB 행 수 완전 일치.
- **결함** — 베이스 스키마(CREATE TABLE)를 담은 파일이 없었음. `docs/sql/tpmp_dump.sql`은 2026-05-12자 17테이블뿐인데 실제는 33테이블(`exam_info.application_url` 등은 어느 파일에도 없었음). prod은 `ddl-auto: validate`라 신규 DB 배포 시 첫 마이그레이션부터 실패하는 상태였음.

## 완료한 작업 (미커밋 — 사용자 확인 후 커밋 필요)

1. `docs/db-migration/00000000_00_baseline_schema.sql` **신규** — 33테이블 전체 정의, 재실행 안전.
2. `docs/sql/README.md` — 로드 순서 2단계 → 3단계 정정, 델타 34개 실행 금지 경고, 상황별 절차표 추가, 마이그레이션 목록을 베이스라인/델타 이력으로 분리.
3. `docs/deployment-guide.md` — 배포 체크리스트 정정.
4. `docs/db-guidelines.md` §10 — "베이스라인 스키마" 하위 절 추가.
5. `docs/history/back/adm/DbSchemaBaseline_Modified.md` **신규** — HIST-20260802-001.

## 실행한 검증과 결과

임시 DB(`tpmp_base_test`/`tpmp_partial_test`/`tpmp_e2e`/`tpmp_e2e2`/`tpmp_final`)를 만들어 검증 후 전부 삭제함.
원본 `tpmp` DB에는 **아무 SQL도 실행하지 않았음** — 확인 완료(33테이블 / question_bank 636행 유지).

| 시나리오 | 결과 |
|----------|------|
| 빈 DB 1회 적용 | 33테이블 / 279컬럼 / PK 33 · FK 31 · UNIQUE 9 · CHECK 9, ERROR 0 |
| 빈 DB 4회 연속 적용 | ERROR 0 (멱등성 OK) |
| 원본 `pg_dump --schema-only` 와 비교 | 구조 완전 일치. CHECK 제약 표현식 렌더링 표기만 상이(의미 동일) |
| 구 스키마(`tpmp_dump.sql` 17테이블) + 기존 데이터에 적용 | 17테이블 131컬럼 → 33테이블 280컬럼 수렴, 데이터 보존, nullable 드리프트 0 |
| 전체 절차 e2e (베이스라인 → 시드계정 → 콘텐츠 덤프) | 원본 라이브 DB와 콘텐츠 행 수 완전 일치 |

## 주의사항 / 알게 된 것

- **델타 34개 중 10개는 빈 DB에서 실패한다** (`20260717_03`, `20260717_05`, `20260720_01·02·04`, `20260721_01·03·05·07`, `20260722_02`). 스키마 변경이 아니라 기존 콘텐츠 대상 데이터 보정(백필·재채점·AI 커스텀 시험 생성)이기 때문. **신규 DB에는 적용하지 말 것.**
- PK 중복은 `duplicate_object` 가 아니라 `invalid_table_definition` 으로 실패한다. `EXCEPTION WHEN duplicate_object` 로 안 잡히므로 `pg_constraint` 사전 조회 가드를 써야 한다.
- 구 스키마 수렴 시 `users.interested_exam_types` 가 잔여 컬럼으로 남지만 정상(레거시 컬럼, Hibernate `validate` 는 여분 컬럼을 문제 삼지 않음).
- Git Bash에서 `docker exec ... -f /tmp/x.sql` 은 경로가 Windows 경로로 변환되므로 `export MSYS_NO_PATHCONV=1` 필요.

## 미완료 작업

- 커밋/푸시 안 함 (사용자 승인 대기).

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add docs/db-migration/00000000_00_baseline_schema.sql docs/history/back/adm/DbSchemaBaseline_Modified.md docs/sql/README.md docs/deployment-guide.md docs/db-guidelines.md
```

## 건드리면 안 되는 것

- `docs/db-migration/` 의 기존 델타 34개 — 변경 이력이므로 수정·삭제 금지.
- `docs/sql/tpmp_content_data.sql` — 이번 작업에서 변경하지 않았고 최신 상태.
- `docs/sql/tpmp_dump.sql` — 2026-05-12자 구 스키마. 베이스라인으로 대체되었으나 이력 목적으로 남겨둠.
