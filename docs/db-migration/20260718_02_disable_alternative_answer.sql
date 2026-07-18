-- 목적: 문항별로 "대체 정답(||) 구분자 사용 안 함" 플래그를 저장한다.
-- 배경: AnswerGrader가 정답 문자열의 " || "를 대체 정답 구분자로 해석해 여러 후보 중
--       하나만 맞아도 정답 처리하는데, 코드 조건 정답(예: "a < m || b[a] < x")의 ||는
--       코드의 논리 OR이라 대체 정답 구분자로 오인되면 채점·표시가 모두 잘못된다.
--       이 플래그가 true인 문항은 채점 시 ||를 대체 정답 구분자로 쓰지 않고 정답 전체를
--       단일 정답으로 취급하며, 프론트 표시(formatAnswerAlternatives)도 원문 그대로 노출한다.
-- 적용 대상: PostgreSQL 15 / question_bank(문제은행 원본) · questions(시험지 스냅샷) ·
--            exam_history_details(응시 이력 스냅샷 — 과거 이력 재조회 화면 표시용, 원본
--            요청 범위(question_bank·questions)에 없었으나 정확한 표시 전파를 위해 함께 추가)
-- ddl-auto=validate 운영 환경이므로 엔티티(QuestionBank.disableAlternativeAnswer /
-- Question.disableAlternativeAnswer / ExamHistoryDetail.disableAlternativeAnswer)와
-- 컬럼명(disable_alternative_answer)을 정확히 일치시켜야 한다.
-- 롤백: 파일 하단의 ROLLBACK 절차를 별도 실행한다.

BEGIN;

-- 적용 전 확인: 현재 컬럼 존재 여부
SELECT
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'question_bank' AND column_name = 'disable_alternative_answer') AS question_bank_column_exists,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'questions' AND column_name = 'disable_alternative_answer') AS questions_column_exists,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'exam_history_details' AND column_name = 'disable_alternative_answer') AS exam_history_details_column_exists;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS disable_alternative_answer BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN question_bank.disable_alternative_answer IS
    'true면 채점·표시 시 정답 문자열의 || 를 대체 정답 구분자로 해석하지 않고 전체를 단일 정답으로 취급(코드 조건의 논리 OR 보호용)';

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS disable_alternative_answer BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN questions.disable_alternative_answer IS
    '시험지 출제 시점 question_bank.disable_alternative_answer 스냅샷';

ALTER TABLE exam_history_details
    ADD COLUMN IF NOT EXISTS disable_alternative_answer BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN exam_history_details.disable_alternative_answer IS
    '제출 시점 questions.disable_alternative_answer 스냅샷 — 과거 이력 재조회 화면 표시용';

-- ── 데이터 보정: 2025년 1회 15번 문항 (코드 조건 커버리지 정답에 || 논리 OR 포함) ──
-- 재실행 안전: 이미 true인 행은 WHERE 조건에서 자연히 제외됨(변경 없음).
-- id를 직접 지정하지 않고 이 문항의 고유한 정답 텍스트로 매칭해, 다른 환경(콘텐츠 덤프
-- 재적재 등)에서 id가 달라져도 동일하게 재현되도록 한다.
UPDATE question_bank
SET disable_alternative_answer = true
WHERE disable_alternative_answer = false
  AND answer LIKE '%a < m || b[a] < x%';

UPDATE questions
SET disable_alternative_answer = true
WHERE disable_alternative_answer = false
  AND answer LIKE '%a < m || b[a] < x%';

UPDATE exam_history_details
SET disable_alternative_answer = true
WHERE disable_alternative_answer = false
  AND correct_answer LIKE '%a < m || b[a] < x%';

-- 적용 후 검증
SELECT id, exam_year, exam_round, question_no, disable_alternative_answer
FROM question_bank
WHERE answer LIKE '%a < m || b[a] < x%';

SELECT id, exam_id, seq, source_question_bank_id, disable_alternative_answer
FROM questions
WHERE answer LIKE '%a < m || b[a] < x%';

SELECT id, question_id, question_bank_id, disable_alternative_answer
FROM exam_history_details
WHERE correct_answer LIKE '%a < m || b[a] < x%';

COMMIT;

-- ROLLBACK (필요 시 아래 문장을 별도 트랜잭션으로 실행)
-- BEGIN;
-- ALTER TABLE question_bank DROP COLUMN IF EXISTS disable_alternative_answer;
-- ALTER TABLE questions DROP COLUMN IF EXISTS disable_alternative_answer;
-- ALTER TABLE exam_history_details DROP COLUMN IF EXISTS disable_alternative_answer;
-- COMMIT;
