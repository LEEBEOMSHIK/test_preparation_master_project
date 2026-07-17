-- 목적: 시험 문항/응시 이력에 SCHEDULING·SQL 구조화 문항 스냅샷을 저장한다.
-- 적용 대상: PostgreSQL 15 (20260717_01_add_question_source_sync.sql 적용 후 실행)
-- 주의: answer/user_answer/correct_answer를 TEXT로 확장하므로 하위 호환된다.
-- 롤백 시 scheduling_data/sql_data 삭제 전에 해당 데이터의 별도 백업이 필요하다.

BEGIN;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS scheduling_data JSONB,
    ADD COLUMN IF NOT EXISTS sql_data JSONB;

ALTER TABLE exam_history_details
    ADD COLUMN IF NOT EXISTS scheduling_data JSONB,
    ADD COLUMN IF NOT EXISTS sql_data JSONB;

ALTER TABLE questions
    ALTER COLUMN answer TYPE TEXT USING answer::TEXT;

ALTER TABLE exam_history_details
    ALTER COLUMN user_answer TYPE TEXT USING user_answer::TEXT,
    ALTER COLUMN correct_answer TYPE TEXT USING correct_answer::TEXT;

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
         WHERE rel.relname = 'questions'
           AND con.contype = 'c'
           AND pg_get_constraintdef(con.oid) ILIKE '%question_type%'
    LOOP
        EXECUTE format('ALTER TABLE questions DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE questions
    ADD CONSTRAINT questions_question_type_check
    CHECK (question_type IN (
        'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE', 'SCHEDULING', 'SQL'
    ));

COMMENT ON COLUMN questions.scheduling_data IS 'CPU 스케줄링 구조화 데이터 스냅샷';
COMMENT ON COLUMN questions.sql_data IS 'SQL 테이블·기대 결과 구조화 데이터 스냅샷';
COMMENT ON COLUMN exam_history_details.scheduling_data IS '제출 시점 CPU 스케줄링 구조화 데이터 스냅샷';
COMMENT ON COLUMN exam_history_details.sql_data IS '제출 시점 SQL 구조화 데이터 스냅샷';

COMMIT;
