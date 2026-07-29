# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 리눅스마스터 1급(100문항)·2급(80문항) + SQLD 제60회(50문항) 기출문제 등록 및 리눅스마스터/SQLD 시험 일정(exam_info) 추가 작업을, **다른 로컬 환경에서도 동일하게 재현**되도록 정리(사용자 요청: "현재 데이터 기준으로 타 로컬에서도 동일한 데이터 마이그 될 수 있도록 정리해").
- 기존 프로젝트 관례(`docs/sql/README.md`)를 그대로 따름: exam_info는 `DataInitializer`(코드, idempotent) + 콘텐츠 덤프 이중 반영, question_bank/domain_slave는 콘텐츠 덤프(`docs/sql/tpmp_content_data.sql`)로만 반영.

## 완료한 작업 (미커밋 — 사용자 확인 후 커밋 필요)

- `backend/.../config/DataInitializer.java`: `ensureLinuxMasterExamInfo()`(리눅스마스터 1급 4회차) + `ensureSqldExamInfo()`(SQLD 4회차) 추가 — 순수 추가만, 기존 로직 변경 없음.
- `docs/history/back/adm/AdminExamInfo_Modified.md`: HIST-20260728-001 이력 추가.
- 로컬 백엔드(`./gradlew bootRun`)를 기동해 위 DataInitializer 변경을 실제 DB에 반영 확인(exam_info 3건→11건).
- `docs/sql/tpmp_content_data.sql` 전체 재생성 — `docs/sql/README.md`의 "재생성 방법"(테이블별 `pg_dump --data-only --column-inserts --on-conflict-do-nothing`을 FK 순서로 이어붙임) 그대로 수행. 신규 domain_slave "리눅스마스터 2급"(id 34), question_bank 230건(리눅스마스터 180 + SQLD60 50), exam_info 8건 포함.
  - **주의**: 단순 `grep "^INSERT INTO"`로 라인만 추출하면 `<pre>` 코드블록처럼 값 내부에 실제 줄바꿈이 있는 다중행 INSERT 문이 잘려서 깨진다(1차 시도에서 실제로 이 버그 발생 → 스크립트를 라인번호 기반 블록 추출로 재작성해 수정). 향후 재생성 시 동일 실수 주의.
  - `docker exec tpmp-db psql -f`로 실제 로드 테스트 완료(에러 없이 COMMIT 확인).
- `docs/sql/README.md`의 "마지막 갱신" 라인을 2026-07-29 내용으로 갱신.

## 미완료 작업

- **커밋/푸시 안 됨** — 사용자가 명시적으로 요청하면 진행(메모리: 이 프로젝트는 커밋 요청 시에만 수행, main 직접 커밋 가능).
- 브라우저 육안 확인은 하지 않음(데이터 등록/마이그레이션 작업이라 API·DB 레벨 검증만 수행, CLAUDE.md 비용 규칙상 문서/데이터 작업은 빌드·UI 테스트 불필요).

## 수정된 파일 (git status 기준)

```
M backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java
M docs/history/back/adm/AdminExamInfo_Modified.md
M docs/sql/README.md
M docs/sql/tpmp_content_data.sql
```

## 실행한 검증 명령과 결과

- `docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT count(*) FROM question_bank;"` → 636 (기존 406 + 신규 230)
- `docker exec tpmp-db psql ... exam_info` → 11건, display_order 20~30 정상
- 테이블별 행수 대조(파일 vs DB): domain_master/domain_slave/exams/examinations/questions/exam_info/dialect_conversion_rules/prac_*/concept_notes/support_settings 전부 일치. question_bank는 문항 지문 내 예시 SQL(`INSERT INTO T(VAL) ...`)이 카운트 스크립트에 오검출되어 636 vs 639로 보였으나 실제 데이터는 정상(원인 확인 완료, 데이터 이상 아님).
- `docker exec tpmp-db psql -f /tmp/dump_check.sql -v ON_ERROR_STOP=1` → 에러 없이 COMMIT (신규 덤프 파일 자체 로드 테스트 통과, ON CONFLICT DO NOTHING이라 기존 로컬엔 실제 삽입 0건).

## 다음 세션이 바로 실행할 명령

- 사용자가 커밋을 요청하면: 위 4개 파일만 `git add` 후 `[INFRA] feat: ...` 형식으로 커밋 (히스토리 정책상 FE/BE 4분류에 속하지 않는 INFRA 성격 — 별도 history 파일 불필요, `AdminExamInfo_Modified.md`는 이미 이전 세션에서 작성됨).
- 신규 로컬 환경에서 데이터 재현 시: `docs/sql/README.md` 순서(스키마 마이그레이션 34개 → 백엔드 최초 기동 → `tpmp_content_data.sql` 로드) 그대로 따르면 됨. 별도 신규 스키마 마이그레이션 파일은 이번 작업에서 추가되지 않았음(question_bank/domain_slave/exam_info 모두 기존 컬럼만 사용).

## 건드리면 안 되는 파일 / 기존 미추적 파일

- 없음(스크래치패드 스크립트는 전부 세션 임시 디렉터리에만 존재, repo 밖).
- 로컬 백엔드 프로세스(`./gradlew bootRun`, PID는 세션 시작 시 배경 실행)가 현재 8080에서 계속 실행 중 — 강제 종료 시 사용자에게 먼저 확인.
