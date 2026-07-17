-- 목적: 시험지 문항을 QuestionBank 원본과 연결하되 출제/응시 안정성을 위해 스냅샷 필드를 유지한다.
-- 적용 대상: PostgreSQL 15 (로컬/스테이징/운영 수동 적용)
-- 적용 전 확인: questions, question_bank, exam_history_details 테이블 존재 여부
-- 롤백:
--   DROP INDEX IF EXISTS idx_questions_source_question_bank_id;
--   ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_questions_source_question_bank;
--   ALTER TABLE questions DROP COLUMN IF EXISTS source_question_bank_id;
--   ALTER TABLE questions DROP COLUMN IF EXISTS instruction;
--   ALTER TABLE exam_history_details DROP COLUMN IF EXISTS instruction;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS source_question_bank_id BIGINT,
    ADD COLUMN IF NOT EXISTS instruction TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_source_question_bank'
    ) THEN
        ALTER TABLE questions
            ADD CONSTRAINT fk_questions_source_question_bank
            FOREIGN KEY (source_question_bank_id)
            REFERENCES question_bank(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_source_question_bank_id
    ON questions(source_question_bank_id);

ALTER TABLE exam_history_details
    ADD COLUMN IF NOT EXISTS instruction TEXT;

COMMENT ON COLUMN questions.source_question_bank_id IS 'QuestionBank 원본 문항 ID. questions 행은 출제용 스냅샷이며 자동 전파하지 않음';
COMMENT ON COLUMN questions.instruction IS '시험지 문항 발문(지시문) 스냅샷';
COMMENT ON COLUMN exam_history_details.instruction IS '제출 시점 발문(지시문) 스냅샷';
