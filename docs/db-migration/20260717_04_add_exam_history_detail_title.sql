-- 목적: 시험 결과가 제출 시점의 원본 문항 제목을 보존하도록 exam_history_details.title을 추가한다.
-- 적용 대상: PostgreSQL 15 (20260717_03 적용 후 실행)
-- 재실행: ADD COLUMN IF NOT EXISTS와 NULL/공백 행 한정 UPDATE로 안전하게 재실행할 수 있다.
-- 롤백: ALTER TABLE exam_history_details DROP COLUMN IF EXISTS title;

BEGIN;

-- 적용 전 확인: 전체 이력 수와 title 컬럼의 기존 존재 여부.
SELECT count(*) AS detail_count_before FROM exam_history_details;
SELECT EXISTS (
    SELECT 1
      FROM information_schema.columns c
     WHERE c.table_schema = current_schema()
       AND c.table_name = 'exam_history_details'
       AND c.column_name = 'title'
) AS title_column_already_exists;

ALTER TABLE exam_history_details
    ADD COLUMN IF NOT EXISTS title VARCHAR(200);

COMMENT ON COLUMN exam_history_details.title IS '제출 시점 원본 문항 제목 스냅샷(원본 연결이 없으면 NULL)';

SELECT count(*) FILTER (WHERE NULLIF(btrim(title), '') IS NULL) AS blank_title_count_before_backfill
  FROM exam_history_details;

-- 기존 detail의 question_id가 가리키는 시험지 문항과 원본 문제은행을 따라 제목을 백필한다.
-- 이미 의미 있는 제목이 있는 행은 덮어쓰지 않는다.
CREATE TEMP TABLE title_backfill_targets ON COMMIT DROP AS
SELECT ehd.id AS detail_id, btrim(qb.title) AS expected_title
  FROM exam_history_details ehd
  JOIN questions q ON q.id = ehd.question_id
  JOIN question_bank qb ON qb.id = q.source_question_bank_id
 WHERE NULLIF(btrim(ehd.title), '') IS NULL
   AND NULLIF(btrim(qb.title), '') IS NOT NULL;

UPDATE exam_history_details ehd
   SET title = target.expected_title
  FROM title_backfill_targets target
 WHERE ehd.id = target.detail_id
   AND NULLIF(btrim(ehd.title), '') IS NULL;

DO $$
DECLARE
    mismatch_count BIGINT;
BEGIN
    SELECT count(*)
      INTO mismatch_count
      FROM title_backfill_targets target
      JOIN exam_history_details ehd ON ehd.id = target.detail_id
     WHERE ehd.title IS DISTINCT FROM target.expected_title;

    IF mismatch_count <> 0 THEN
        RAISE EXCEPTION '원본 제목이 있는 이력 중 백필되지 않은 행이 %개입니다.', mismatch_count;
    END IF;
END $$;

-- 적용 후 확인: 제목 보유/NULL 건수와 원본 연결이 없어 NULL 유지된 건수를 구분해 확인한다.
SELECT count(*) AS detail_count_after,
       count(*) FILTER (WHERE NULLIF(btrim(title), '') IS NOT NULL) AS titled_count_after,
       count(*) FILTER (WHERE NULLIF(btrim(title), '') IS NULL) AS null_title_count_after
  FROM exam_history_details;

SELECT ehd.id, ehd.question_id, ehd.seq, ehd.title
  FROM exam_history_details ehd
 WHERE NULLIF(btrim(ehd.title), '') IS NULL
 ORDER BY ehd.id;

COMMIT;
