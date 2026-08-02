# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-02

## 현재 목표와 사용자 결정 사항

- 사용자가 `main`을 pull 받은 뒤(0fc3f73 포함), 이 로컬 DB(`tpmp-db-local`, docker-compose.local.yml)에 아직 반영 안 된 마이그를 적용해달라고 요청.
- `docs/sql/README.md`의 "다른 컴퓨터에 일부 스키마·데이터가 이미 있음" 케이스(1→3: 베이스라인 → 콘텐츠 덤프)로 진행.

## 완료한 작업

1. `tpmp-db-local` 컨테이너 기동(기존 볼륨 `test_preparation_master_project_postgres_data_local` 사용, 이미지 최초 pull).
2. 베이스라인 스키마(`docs/db-migration/00000000_00_baseline_schema.sql`) 적용 — 31→33테이블.
3. 콘텐츠 덤프(`docs/sql/tpmp_content_data.sql`) 적용 중 `questions_question_type_check` CHECK 위반으로 실패(SCHEDULING 문항 INSERT) — 베이스라인 스크립트가 PK/FK/UNIQUE만 가드하고 CHECK는 갱신하지 않는 버그 발견.
4. 원인 수정: `docs/db-migration/00000000_00_baseline_schema.sql`의 `[5]`~`[6]` 사이에 `question_bank_question_type_check`/`questions_question_type_check`를 최신 정의(SCHEDULING/SQL 포함)로 승격하는 가드 블록 추가.
5. 제약 수동 보정 후 콘텐츠 덤프 재실행(멱등) → 끝까지 성공. 수정된 베이스라인 스크립트 재실행으로 멱등성 재확인.
6. `docs/history/back/adm/DbSchemaBaseline_Modified.md`에 `HIST-20260802-002` 추가.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| 베이스라인 적용(수정 전) | 33테이블/279컬럼/PK33·FK31·UNIQUE9·CHECK9, ERROR 0 |
| 콘텐츠 덤프 1차 | 라인 3885에서 `questions_question_type_check` 위반으로 중단 (그 앞 내용은 트랜잭션 커밋/개별 autocommit으로 이미 반영됨) |
| 제약 보정 후 콘텐츠 덤프 재실행 | 끝까지 성공(COMMIT) |
| 베이스라인 스크립트(수정본) 재실행 | ERROR 0, 33테이블/279컬럼/PK33·FK31·UNIQUE9·CHECK9 유지 (멱등성 확인) |
| 최종 데이터 건수 | table 33 / question_bank 636 / domain_slave 33 / exam_info 11 / questions 240 / support_settings 1 / user_exam_applications 0 |

## 미완료 작업

- 변경 사항(베이스라인 스크립트 수정, 히스토리 파일) 커밋/푸시 안 함 — 사용자 승인 대기.
- 로컬 백엔드 기동 후 실제 화면 동작 확인은 안 함(요청 범위가 DB 마이그였음).

## 다음 세션이 바로 실행할 명령

```powershell
git status --short
git diff docs/db-migration/00000000_00_baseline_schema.sql

# 사용자 승인 후
git add docs/db-migration/00000000_00_baseline_schema.sql docs/history/back/adm/DbSchemaBaseline_Modified.md
git commit -m "[INFRA] fix: 베이스라인 스크립트 CHECK 제약 미갱신 버그 수정"
```

## 주의사항 / 건드리면 안 되는 것

- `tpmp-db-local` 컨테이너는 이번 세션에서 새로 기동했고 계속 실행 중(볼륨은 기존 데이터 보존).
- `docs/db-migration/`의 델타 34개 파일 — 수정·삭제 금지(이번에도 건드리지 않음).
- 베이스라인 스크립트의 CHECK 가드는 이번에 실제로 문제가 된 2개(`question_bank`/`questions`의 `question_type`)만 추가함. 다른 7개 CHECK 제약(예: `users_role_check` 등)은 델타 이력상 값 목록이 바뀐 적이 없어 손대지 않았음 — 향후 CHECK 값 목록을 바꾸는 델타를 추가할 때는 같은 패턴(정의 문자열 비교 후 DROP/ADD)을 베이스라인에도 반영해야 함.
