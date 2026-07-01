-- question_bank AI 분석 결과 컬럼 추가 (local/dev/prod 적용, prod는 기동 전 필수)
-- 롤백: ALTER TABLE question_bank DROP COLUMN ai_keywords, ai_domains, ai_difficulty, ai_summary;
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS ai_keywords  JSONB,
  ADD COLUMN IF NOT EXISTS ai_domains   JSONB,
  ADD COLUMN IF NOT EXISTS ai_difficulty VARCHAR(10),
  ADD COLUMN IF NOT EXISTS ai_summary   TEXT;
