-- 목적: 5개 기출 시험지의 기존 questions 100행을 보존한 채 QuestionBank 100행과 연결·동기화한다.
-- 적용 대상: PostgreSQL 15 (20260717_01, 20260717_02 적용 후 실행)
-- 정책:
--   1) questions 행을 삭제/재생성하지 않는다.
--   2) exam_session을 삭제하지 않는다. 유효한 응시 세션이 하나라도 있으면 전체 작업을 중단한다.
--   3) exam_history_details는 제출 시점 스냅샷이므로 변경하지 않는다.
--   4) 사전/사후 검증 실패 시 트랜잭션 전체를 롤백한다.

BEGIN;

CREATE TEMP TABLE sync_question_map (
    exam_id BIGINT NOT NULL,
    exam_type_id BIGINT NOT NULL,
    exam_year INTEGER NOT NULL,
    exam_round INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    question_bank_id BIGINT NOT NULL,
    PRIMARY KEY (exam_id, seq),
    UNIQUE (question_bank_id)
) ON COMMIT DROP;

-- 이 마이그레이션이 과거 제출 스냅샷을 건드리지 않았음을 commit 직전에 재검증한다.
CREATE TEMP TABLE sync_history_guard (
    detail_count BIGINT NOT NULL,
    snapshot_checksum TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO sync_history_guard (detail_count, snapshot_checksum)
SELECT count(*),
       md5(COALESCE(string_agg(to_jsonb(ehd)::TEXT, '' ORDER BY ehd.id), ''))
  FROM exam_history_details ehd;

INSERT INTO sync_question_map
    (exam_id, exam_type_id, exam_year, exam_round, seq, question_bank_id)
VALUES
    (1, 7, 2024, 3,  1,  81), (1, 7, 2024, 3,  2,  82),
    (1, 7, 2024, 3,  3,  83), (1, 7, 2024, 3,  4,  84),
    (1, 7, 2024, 3,  5,  85), (1, 7, 2024, 3,  6,  86),
    (1, 7, 2024, 3,  7,  87), (1, 7, 2024, 3,  8,  88),
    (1, 7, 2024, 3,  9,  89), (1, 7, 2024, 3, 10,  90),
    (1, 7, 2024, 3, 11,  91), (1, 7, 2024, 3, 12,  92),
    (1, 7, 2024, 3, 13,  93), (1, 7, 2024, 3, 14,  94),
    (1, 7, 2024, 3, 15,  95), (1, 7, 2024, 3, 16,  96),
    (1, 7, 2024, 3, 17,  97), (1, 7, 2024, 3, 18,  98),
    (1, 7, 2024, 3, 19,  99), (1, 7, 2024, 3, 20, 100),
    (2, 7, 2025, 1,  1,  61), (2, 7, 2025, 1,  2,  62),
    (2, 7, 2025, 1,  3,  63), (2, 7, 2025, 1,  4,  64),
    (2, 7, 2025, 1,  5,  65), (2, 7, 2025, 1,  6,  66),
    (2, 7, 2025, 1,  7,  67), (2, 7, 2025, 1,  8,  68),
    (2, 7, 2025, 1,  9,  69), (2, 7, 2025, 1, 10,  70),
    (2, 7, 2025, 1, 11,  71), (2, 7, 2025, 1, 12,  72),
    (2, 7, 2025, 1, 13,  73), (2, 7, 2025, 1, 14,  74),
    (2, 7, 2025, 1, 15,  75), (2, 7, 2025, 1, 16,  76),
    (2, 7, 2025, 1, 17,  77), (2, 7, 2025, 1, 18,  78),
    (2, 7, 2025, 1, 19,  79), (2, 7, 2025, 1, 20,  80),
    (3, 7, 2025, 2,  1,  41), (3, 7, 2025, 2,  2,  42),
    (3, 7, 2025, 2,  3,  43), (3, 7, 2025, 2,  4,  44),
    (3, 7, 2025, 2,  5,  45), (3, 7, 2025, 2,  6,  46),
    (3, 7, 2025, 2,  7,  47), (3, 7, 2025, 2,  8,  48),
    (3, 7, 2025, 2,  9,  49), (3, 7, 2025, 2, 10,  50),
    (3, 7, 2025, 2, 11,  51), (3, 7, 2025, 2, 12,  52),
    (3, 7, 2025, 2, 13,  53), (3, 7, 2025, 2, 14,  54),
    (3, 7, 2025, 2, 15,  55), (3, 7, 2025, 2, 16,  56),
    (3, 7, 2025, 2, 17,  57), (3, 7, 2025, 2, 18,  58),
    (3, 7, 2025, 2, 19,  59), (3, 7, 2025, 2, 20,  60),
    (4, 7, 2025, 3,  1,  21), (4, 7, 2025, 3,  2,  22),
    (4, 7, 2025, 3,  3,  23), (4, 7, 2025, 3,  4,  24),
    (4, 7, 2025, 3,  5,  25), (4, 7, 2025, 3,  6,  26),
    (4, 7, 2025, 3,  7,  27), (4, 7, 2025, 3,  8,  28),
    (4, 7, 2025, 3,  9,  29), (4, 7, 2025, 3, 10,  30),
    (4, 7, 2025, 3, 11,  31), (4, 7, 2025, 3, 12,  32),
    (4, 7, 2025, 3, 13,  33), (4, 7, 2025, 3, 14,  34),
    (4, 7, 2025, 3, 15,  35), (4, 7, 2025, 3, 16,  36),
    (4, 7, 2025, 3, 17,  37), (4, 7, 2025, 3, 18,  38),
    (4, 7, 2025, 3, 19,  39), (4, 7, 2025, 3, 20,  40),
    (5, 7, 2026, 1,  1,   1), (5, 7, 2026, 1,  2,   2),
    (5, 7, 2026, 1,  3,   3), (5, 7, 2026, 1,  4,   4),
    (5, 7, 2026, 1,  5,   5), (5, 7, 2026, 1,  6,   6),
    (5, 7, 2026, 1,  7,   7), (5, 7, 2026, 1,  8,   8),
    (5, 7, 2026, 1,  9,   9), (5, 7, 2026, 1, 10,  10),
    (5, 7, 2026, 1, 11,  11), (5, 7, 2026, 1, 12,  12),
    (5, 7, 2026, 1, 13,  13), (5, 7, 2026, 1, 14,  14),
    (5, 7, 2026, 1, 15,  15), (5, 7, 2026, 1, 16,  16),
    (5, 7, 2026, 1, 17,  17), (5, 7, 2026, 1, 18,  18),
    (5, 7, 2026, 1, 19,  19), (5, 7, 2026, 1, 20,  20);

-- 확인된 문제은행 문항번호 오류와 정답 오류를 먼저 정정한다.
UPDATE question_bank
   SET question_no = id - 80
 WHERE id BETWEEN 81 AND 100;

UPDATE question_bank SET question_no = 6 WHERE id = 6;
UPDATE question_bank SET question_no = 15 WHERE id = 15;
UPDATE question_bank SET answer = '3,5,6' WHERE id = 4;

DO $$
DECLARE
    mapped_count INTEGER;
    target_count INTEGER;
    target_exam_total INTEGER;
    source_count INTEGER;
BEGIN
    SELECT count(*) INTO mapped_count FROM sync_question_map;
    IF mapped_count <> 100 THEN
        RAISE EXCEPTION '명시적 문항 매핑은 100행이어야 합니다. 현재: %', mapped_count;
    END IF;

    SELECT count(*) INTO target_count
      FROM questions q
      JOIN sync_question_map m ON m.exam_id = q.exam_id AND m.seq = q.seq;
    IF target_count <> 100 THEN
        RAISE EXCEPTION '대상 questions 매핑 결과가 100행이 아닙니다. 현재: %', target_count;
    END IF;

    SELECT count(*) INTO target_exam_total
      FROM questions q
     WHERE q.exam_id IN (SELECT DISTINCT exam_id FROM sync_question_map);
    IF target_exam_total <> 100 THEN
        RAISE EXCEPTION '대상 5개 시험의 questions 전체 건수는 정확히 100행이어야 합니다. 현재: %',
            target_exam_total;
    END IF;

    SELECT count(*) INTO source_count
      FROM question_bank qb
      JOIN sync_question_map m ON m.question_bank_id = qb.id
     WHERE qb.del_yn = 'N'
       AND qb.use_yn = 'Y'
       AND qb.exam_type_id = m.exam_type_id
       AND qb.exam_year = m.exam_year
       AND qb.exam_round = m.exam_round
       AND qb.question_no = m.seq;
    IF source_count <> 100 THEN
        RAISE EXCEPTION '문제은행 원본 검증 결과가 100행이 아닙니다. 현재: %', source_count;
    END IF;

    IF (SELECT answer FROM question_bank WHERE id = 60)
            IS DISTINCT FROM '1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장' THEN
        RAISE EXCEPTION '2025년 2회 20번(ID=60) 정답 원문이 기대값과 다릅니다.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM exam_session es
          JOIN examinations e ON e.id = es.examination_id
          JOIN (SELECT DISTINCT exam_id FROM sync_question_map) m
            ON m.exam_id = e.exam_paper_id
         WHERE es.started_at + make_interval(mins => e.time_limit) > CURRENT_TIMESTAMP
    ) THEN
        RAISE EXCEPTION '유효한 응시 세션이 있어 100문항 동기화를 중단합니다. 세션은 삭제하지 않았습니다.';
    END IF;
END $$;

-- 기존 questions PK와 행을 그대로 유지하며 원본 스냅샷 필드만 덮어쓴다.
UPDATE questions q
   SET source_question_bank_id = qb.id,
       instruction = qb.instruction,
       content = qb.content,
       question_type = qb.question_type,
       options = qb.options,
       answer = qb.answer,
       explanation = qb.explanation,
       code = qb.code,
       language = qb.language,
       category_id = qb.category_id,
       scheduling_data = qb.scheduling_data,
       sql_data = qb.sql_data
  FROM sync_question_map m
  JOIN question_bank qb ON qb.id = m.question_bank_id
 WHERE q.exam_id = m.exam_id
   AND q.seq = m.seq;

DO $$
DECLARE
    mismatch_count INTEGER;
    target_exam_total INTEGER;
    exact_link_count INTEGER;
    unlinked_count INTEGER;
    duplicate_source_count INTEGER;
    history_count_before BIGINT;
    history_count_after BIGINT;
    history_checksum_before TEXT;
    history_checksum_after TEXT;
BEGIN
    SELECT count(*) INTO mismatch_count
      FROM questions q
      JOIN sync_question_map m ON m.exam_id = q.exam_id AND m.seq = q.seq
      JOIN question_bank qb ON qb.id = m.question_bank_id
     WHERE q.source_question_bank_id IS DISTINCT FROM qb.id
        OR q.instruction IS DISTINCT FROM qb.instruction
        OR q.content IS DISTINCT FROM qb.content
        OR q.question_type IS DISTINCT FROM qb.question_type
        OR q.options IS DISTINCT FROM qb.options
        OR q.answer IS DISTINCT FROM qb.answer
        OR q.explanation IS DISTINCT FROM qb.explanation
        OR q.code IS DISTINCT FROM qb.code
        OR q.language IS DISTINCT FROM qb.language
        OR q.category_id IS DISTINCT FROM qb.category_id
        OR q.scheduling_data IS DISTINCT FROM qb.scheduling_data
        OR q.sql_data IS DISTINCT FROM qb.sql_data;

    IF mismatch_count <> 0 THEN
        RAISE EXCEPTION '동기화 후 원본과 다른 questions 행이 %개입니다.', mismatch_count;
    END IF;

    SELECT count(*) INTO target_exam_total
      FROM questions q
     WHERE q.exam_id IN (SELECT DISTINCT exam_id FROM sync_question_map);
    IF target_exam_total <> 100 THEN
        RAISE EXCEPTION '동기화 후 대상 5개 시험의 questions 전체 건수가 100이 아닙니다. 현재: %',
            target_exam_total;
    END IF;

    SELECT count(*) INTO exact_link_count
      FROM questions q
      JOIN sync_question_map m ON m.exam_id = q.exam_id AND m.seq = q.seq
     WHERE q.source_question_bank_id = m.question_bank_id;
    IF exact_link_count <> 100 THEN
        RAISE EXCEPTION '동기화 후 정확한 source 연결은 100행이어야 합니다. 현재: %', exact_link_count;
    END IF;

    SELECT count(*) INTO unlinked_count
      FROM questions q
     WHERE q.exam_id IN (SELECT DISTINCT exam_id FROM sync_question_map)
       AND q.source_question_bank_id IS NULL;
    IF unlinked_count <> 0 THEN
        RAISE EXCEPTION '동기화 후 source 미연결 문항이 %개입니다.', unlinked_count;
    END IF;

    SELECT count(*) INTO duplicate_source_count
      FROM (
          SELECT q.source_question_bank_id
            FROM questions q
           WHERE q.exam_id IN (SELECT DISTINCT exam_id FROM sync_question_map)
           GROUP BY q.source_question_bank_id
          HAVING count(*) > 1
      ) duplicated;
    IF duplicate_source_count <> 0 THEN
        RAISE EXCEPTION '동기화 후 중복 source 연결 그룹이 %개입니다.', duplicate_source_count;
    END IF;

    IF (SELECT answer FROM questions WHERE exam_id = 5 AND seq = 4)
            IS DISTINCT FROM '3,5,6' THEN
        RAISE EXCEPTION '2026년 1회 4번 시험지 정답 보정이 반영되지 않았습니다.';
    END IF;

    IF (SELECT answer FROM questions WHERE exam_id = 3 AND seq = 20)
            IS DISTINCT FROM '1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장' THEN
        RAISE EXCEPTION '2025년 2회 20번 시험지 정답이 원문과 다릅니다.';
    END IF;

    SELECT detail_count, snapshot_checksum
      INTO history_count_before, history_checksum_before
      FROM sync_history_guard;
    SELECT count(*), md5(COALESCE(string_agg(to_jsonb(ehd)::TEXT, '' ORDER BY ehd.id), ''))
      INTO history_count_after, history_checksum_after
      FROM exam_history_details ehd;
    IF history_count_after IS DISTINCT FROM history_count_before
            OR history_checksum_after IS DISTINCT FROM history_checksum_before THEN
        RAISE EXCEPTION 'exam_history_details가 백필 중 변경되었습니다. 전체 작업을 롤백합니다.';
    END IF;
END $$;

COMMIT;
