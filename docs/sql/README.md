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

도커 DB(`tpmp-db`)가 떠 있는 상태에서:

```bash
docker exec -i tpmp-db psql -U tpmp -d tpmp < docs/sql/tpmp_content_data.sql
```

- `ON CONFLICT DO NOTHING` 이라 **이미 존재하는 행은 건너뛰고** 없는 콘텐츠만 채워집니다(여러 번 실행해도 안전).
- 가장 깔끔한 결과(도메인 ID까지 완전 일치)를 원하면 **빈 DB에 백엔드를 최초 1회 기동한 뒤** 로드하세요.
- 로드 후 IDENTITY 시퀀스는 덤프 말미의 `setval`로 자동 보정되어, 이후 신규 등록 시 ID 충돌이 없습니다.

## 재생성 방법

원본 로컬에서 아래처럼 테이블별 `pg_dump`(data-only, column-inserts, on-conflict-do-nothing)를 FK 의존 순서로 이어 붙이고, 말미에 `setval`을 추가하면 됩니다.

```bash
docker exec tpmp-db pg_dump -U tpmp -d tpmp --data-only --column-inserts \
    --on-conflict-do-nothing --no-owner --no-privileges --table=public.question_bank
```

> 개인정보·인증·이력 테이블은 반드시 제외하세요. `users`를 포함하면 비밀번호 해시가 저장소에 커밋됩니다.
