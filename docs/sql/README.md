# DB 콘텐츠 데이터 덤프

다른 로컬 환경에서도 동일한 **콘텐츠 데이터(문항·시험·연습 데이터)** 를 공유하기 위한 덤프입니다.

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

**제외** — 개인정보 / 인증 / 앱이 자동 시드하는 데이터
- `users` (백엔드 `DataInitializer`가 `admin@tpmp.com`=id 1, `user@tpmp.com`=id 2로 시드)
- `*_history`(quiz/exam/practice/login), `exam_session`
- `notion_integrations`(토큰), `user_interested_exam`, `user_question_bookmarks`, `user_granted_permissions`
- `menu_config`, `permission_master`, `permission_detail` (앱이 시드)

> `exams`/`examinations`의 `created_by`, `concept_notes`의 `user_id`는 각각 시드 계정(admin=1, user=2)을 참조하므로, 백엔드가 한 번 기동해 시드 계정이 만들어진 뒤 로드하면 FK가 맞습니다.

## 로드 방법

### 사전 준비 (중요)

덤프에는 `exams.created_by=1`, `concept_notes.user_id=2`처럼 **시드 계정을 참조하는 FK**가 있으므로,
**백엔드를 최초 1회 기동해 시드 계정(admin=id 1, user=id 2)과 기본 도메인이 만들어진 뒤** 로드해야 합니다.

```bash
# 1) 저장소 클론 후 .env 준비 (루트 .env.example 참고, 없으면 기본값 사용)
# 2) 스택 기동 → DataInitializer가 admin/user/도메인/메뉴/권한을 시드
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d   # DB만
# 또는 전체 스택: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
#   (로컬 gradle 구동이면 backend/run-dev.sh 로 백엔드를 최초 1회 기동)
```

### 로드 (권장 — 플랫폼 무관, 인코딩 안전)

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

## 재생성 방법

원본 로컬에서 아래처럼 테이블별 `pg_dump`(data-only, column-inserts, on-conflict-do-nothing)를 FK 의존 순서로 이어 붙이고, 말미에 `setval`을 추가하면 됩니다.

```bash
docker exec tpmp-db pg_dump -U tpmp -d tpmp --data-only --column-inserts \
    --on-conflict-do-nothing --no-owner --no-privileges --table=public.question_bank
```

> 개인정보·인증·이력 테이블은 반드시 제외하세요. `users`를 포함하면 비밀번호 해시가 저장소에 커밋됩니다.
