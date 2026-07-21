-- 목적: /user/exams 화면에서 시험을 년도·회차·AI 커스텀 여부로 필터링할 수 있도록
--       examinations 테이블에 구조화된 컬럼(exam_year, exam_round, is_ai_custom)을 추가한다.
-- 배경: 지금까지 이 정보는 examinations.title 문자열에만 암묵적으로 존재했다
--       (예: "2026년 1회 정보처리기사 실기", "2026년 1회 정보처리기사 실기 (AI 커스텀)").
--       기존 데이터는 title을 정규식으로 파싱해 백필한다.
--       사전 확인: 로컬 tpmp-db의 examinations.title 전수 조회 결과 12건 모두
--       "YYYY년 N회 ... (AI 커스텀)?" 패턴을 그대로 따르며 예외 케이스는 없었다.
-- 적용 대상: PostgreSQL 15 / examinations
-- ddl-auto=validate 운영 환경이므로 엔티티(Examination.examYear / examRound / isAiCustom)와
-- 컬럼명(exam_year / exam_round / is_ai_custom)을 정확히 일치시켜야 한다.
-- 롤백: ALTER TABLE examinations DROP COLUMN exam_year, DROP COLUMN exam_round, DROP COLUMN is_ai_custom;

BEGIN;

-- 적용 전 확인: 현재 컬럼 존재 여부
SELECT
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'examinations' AND column_name = 'exam_year') AS exam_year_column_exists,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'examinations' AND column_name = 'exam_round') AS exam_round_column_exists,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'examinations' AND column_name = 'is_ai_custom') AS is_ai_custom_column_exists;

ALTER TABLE examinations ADD COLUMN IF NOT EXISTS exam_year INT NULL;
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS exam_round INT NULL;
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS is_ai_custom BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN examinations.exam_year IS
    '시험 연도 — 레거시 데이터는 title 파싱 백필("YYYY년 N회" 패턴), 패턴 불일치 시 NULL 가능';
COMMENT ON COLUMN examinations.exam_round IS
    '시험 회차 — 레거시 데이터는 title 파싱 백필("YYYY년 N회" 패턴), 패턴 불일치 시 NULL 가능';
COMMENT ON COLUMN examinations.is_ai_custom IS
    'true면 AI 커스텀 문항으로 구성된 시험(title에 "(AI 커스텀)" 포함) — 레거시 데이터는 title 파싱 백필';

-- ── 백필: title이 "YYYY년 N회 ..." 패턴인 행만 대상으로 exam_year/exam_round 채움 ──
-- 재실행 안전: 이미 값이 채워진 행은 조건에서 자연히 재계산되어도 동일한 값이 나온다.
UPDATE examinations
SET exam_year = substring(title from '^(\d{4})년')::int,
    exam_round = substring(title from '년\s*(\d+)회')::int
WHERE title ~ '^\d{4}년\s*\d+회';

UPDATE examinations
SET is_ai_custom = true
WHERE title ~ '\(AI\s*커스텀\)';

-- 적용 후 검증 1: 백필 성공/실패(exam_year IS NULL) 건수
SELECT
    COUNT(*) FILTER (WHERE exam_year IS NOT NULL) AS backfilled_count,
    COUNT(*) FILTER (WHERE exam_year IS NULL) AS not_backfilled_count
FROM examinations;

-- 적용 후 검증 2: 백필 실패 title 목록 (패턴 불일치로 NULL로 남은 행)
SELECT id, title
FROM examinations
WHERE exam_year IS NULL
ORDER BY id;

-- 적용 후 검증 3: is_ai_custom 역검증 — true인데 title에 "(AI 커스텀)"이 없는 경우와
--                  title에 "(AI 커스텀)"이 있는데 is_ai_custom이 false인 경우 (둘 다 0건이어야 정상)
SELECT id, title, is_ai_custom
FROM examinations
WHERE (is_ai_custom = true AND title !~ '\(AI\s*커스텀\)')
   OR (is_ai_custom = false AND title ~ '\(AI\s*커스텀\)');

COMMIT;

-- ROLLBACK (필요 시 아래 문장을 별도 트랜잭션으로 실행)
-- BEGIN;
-- ALTER TABLE examinations DROP COLUMN exam_year, DROP COLUMN exam_round, DROP COLUMN is_ai_custom;
-- COMMIT;
