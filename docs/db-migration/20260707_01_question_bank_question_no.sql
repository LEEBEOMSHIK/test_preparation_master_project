-- question_bank 원본 시험 문항번호 컬럼 추가 (local/dev/prod 적용, prod는 기동 전 필수)
-- 목적: 시험지 내부 순서(questions.seq)와 별개로, 원본 시험의 문항번호를 question_bank에 저장한다.
--       exam_type_id + exam_year + exam_round + question_no 조합으로 활성 문항 중복을 방지한다.
-- 적용: dev/local은 Hibernate ddl-auto=update로 컬럼만 자동 반영될 수 있으나,
--       check 제약과 부분 유니크 인덱스까지 보장하려면 이 스크립트를 적용해야 한다.
-- 롤백: DROP INDEX IF EXISTS ux_question_bank_active_group_question_no;
--       ALTER TABLE question_bank DROP CONSTRAINT IF EXISTS chk_question_bank_question_no_positive;
--       ALTER TABLE question_bank DROP COLUMN IF EXISTS question_no;
ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS question_no INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_question_bank_question_no_positive'
    ) THEN
        ALTER TABLE question_bank
            ADD CONSTRAINT chk_question_bank_question_no_positive
            CHECK (question_no IS NULL OR question_no > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_question_bank_active_group_question_no
    ON question_bank (exam_type_id, exam_year, exam_round, question_no)
    WHERE del_yn = 'N'
      AND exam_type_id IS NOT NULL
      AND exam_year IS NOT NULL
      AND exam_round IS NOT NULL
      AND question_no IS NOT NULL;
