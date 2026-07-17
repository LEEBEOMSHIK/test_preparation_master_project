-- 목적: 시험 결과에서 복습 표시를 제공할 수 있도록 제출 시점 원본 문제은행 ID를 스냅샷으로 보존한다.
-- 적용 대상: PostgreSQL 15 / exam_history_details
-- 정책: question_bank_id는 과거 이력 재현용 값이므로 FK를 추가하지 않는다.
-- 롤백: 파일 하단의 ROLLBACK 절차를 별도 실행한다.

BEGIN;

-- 적용 전 확인: 현재 컬럼 존재 여부와 원본 연결로 보강 가능한 행 수
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'exam_history_details'
      AND column_name = 'question_bank_id'
) AS question_bank_id_column_exists;

SELECT COUNT(*) AS backfill_candidate_count
FROM exam_history_details ehd
JOIN questions q ON q.id = ehd.question_id
WHERE q.source_question_bank_id IS NOT NULL;

ALTER TABLE exam_history_details
    ADD COLUMN IF NOT EXISTS question_bank_id BIGINT NULL;

COMMENT ON COLUMN exam_history_details.question_bank_id IS
    '제출 시점 원본 문제은행 ID 스냅샷(FK 없음, 원본 연결이 없으면 NULL)';

-- 재실행 시 이미 저장된 스냅샷을 덮어쓰지 않고 NULL인 행만 보강한다.
UPDATE exam_history_details ehd
SET question_bank_id = q.source_question_bank_id
FROM questions q
WHERE ehd.question_id = q.id
  AND ehd.question_bank_id IS NULL
  AND q.source_question_bank_id IS NOT NULL;

-- 적용 후 검증: 연결 가능한데 여전히 NULL인 행은 0이어야 한다.
SELECT COUNT(*) AS unresolved_backfill_count
FROM exam_history_details ehd
JOIN questions q ON q.id = ehd.question_id
WHERE ehd.question_bank_id IS NULL
  AND q.source_question_bank_id IS NOT NULL;

-- 보강 대상이 남아 있으면 COMMIT하지 않고 전체 변경을 롤백한다.
DO $$
DECLARE
    unresolved_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO unresolved_count
    FROM exam_history_details ehd
    JOIN questions q ON q.id = ehd.question_id
    WHERE ehd.question_bank_id IS NULL
      AND q.source_question_bank_id IS NOT NULL;

    IF unresolved_count > 0 THEN
        RAISE EXCEPTION
            'exam_history_details.question_bank_id backfill verification failed: % unresolved rows',
            unresolved_count;
    END IF;
END;
$$;

SELECT
    COUNT(*) AS total_detail_count,
    COUNT(question_bank_id) AS snapshotted_question_bank_count,
    COUNT(*) FILTER (WHERE question_bank_id IS NULL) AS null_question_bank_count
FROM exam_history_details;

COMMIT;

-- ROLLBACK (필요 시 아래 문장을 별도 트랜잭션으로 실행)
-- BEGIN;
-- ALTER TABLE exam_history_details DROP COLUMN IF EXISTS question_bank_id;
-- COMMIT;
