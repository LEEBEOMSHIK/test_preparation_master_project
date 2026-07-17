-- 목적: 2025년 2회 11·19·20번의 정답 데이터와 새 채점 규칙에 부합하는 기존 오답 이력을 보정한다.
-- 적용 대상: PostgreSQL 15 (20260717_04 적용 후 실행)
-- 현재 예상: 동일 이력의 Q11/Q19/Q20 총 3개 detail이 correct=true로 바뀌고 해당 20문항 이력은 100점이 된다.
-- 안전 정책: ID를 하드코딩하지 않고 EXAM_TYPE='정보처리기사 실기' 연결과
--           question_bank.exam_year/exam_round/question_no로 대상을 찾으며,
--           correct=false이면서 아래의 제한된 동치 규칙을 만족하는 detail만 변경한다.
-- 재실행: 이미 correct=true인 detail은 후보에서 제외되고, 정답 문자열 UPDATE는 같은 값으로 수렴한다.
-- 롤백: 트랜잭션 실행 중 검증 실패 시 자동 롤백. 커밋 후에는 실행 전 백업으로 복원한다.

BEGIN;

CREATE TEMP TABLE regrade_correct_guard ON COMMIT DROP AS
SELECT id, correct
  FROM exam_history_details;

CREATE TEMP TABLE regrade_targets (
    detail_id BIGINT PRIMARY KEY,
    exam_history_id BIGINT NOT NULL,
    question_no INTEGER NOT NULL,
    reason TEXT NOT NULL
) ON COMMIT DROP;

-- 실제 콘텐츠 연결: domain_master.EXAM_TYPE → domain_slave.'정보처리기사 실기'
-- (현재 데이터 ID는 7이지만 환경별 ID 차이를 허용하기 위해 숫자 ID를 하드코딩하지 않는다.)
CREATE TEMP TABLE regrade_sources ON COMMIT DROP AS
SELECT qb.id AS question_bank_id, qb.question_no
  FROM question_bank qb
  JOIN domain_slave exam_type ON exam_type.id = qb.exam_type_id
  JOIN domain_master exam_type_master ON exam_type_master.id = exam_type.master_id
 WHERE exam_type_master.code = 'EXAM_TYPE'
   AND exam_type.name = '정보처리기사 실기'
   AND qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no IN (11, 19, 20)
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y';

DO $$
DECLARE
    q11_count INTEGER;
    q19_count INTEGER;
    q20_count INTEGER;
BEGIN
    SELECT count(*) FILTER (WHERE question_no = 11),
           count(*) FILTER (WHERE question_no = 19),
           count(*) FILTER (WHERE question_no = 20)
      INTO q11_count, q19_count, q20_count
      FROM regrade_sources;

    IF q11_count <> 1 OR q19_count <> 1 OR q20_count <> 1 THEN
        RAISE EXCEPTION
            '정보처리기사 실기 2025년 2회 원본은 Q11/Q19/Q20 각각 1개여야 합니다. 현재: Q11 %, Q19 %, Q20 %',
            q11_count, q19_count, q20_count;
    END IF;
END $$;

-- Q11: 그래프의 판단 2·6 양쪽 분기를 모두 통과하는 두 경로를 canonical로 바로잡는다.
-- 현재 사용자 저장 표기(노드 콤마 + 경로 파이프)도 AnswerGrader의 명시적 대체 정답으로 인정한다.
UPDATE question_bank qb
   SET answer = '1-2-3-4-5-6-7, 1-2-4-5-6-1 || 1,2,3,4,5,6,7 | 1,2,4,5,6,1'
 WHERE qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no = 11
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y'
   AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
   AND qb.answer IS DISTINCT FROM
       '1-2-3-4-5-6-7, 1-2-4-5-6-1 || 1,2,3,4,5,6,7 | 1,2,4,5,6,1';

-- 연결된 시험지 문항에서는 answer만 동기화한다. 다른 스냅샷 필드는 변경하지 않는다.
UPDATE questions q
   SET answer = qb.answer
  FROM question_bank qb
 WHERE q.source_question_bank_id = qb.id
   AND qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no = 11
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y'
   AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
   AND q.answer IS DISTINCT FROM qb.answer;

-- Q11 과거 이력의 표시 정답도 잘못된 경로 대신 canonical+대체답 스냅샷으로 보정한다.
UPDATE exam_history_details ehd
   SET correct_answer = qb.answer
  FROM questions q
  JOIN question_bank qb ON qb.id = q.source_question_bank_id
 WHERE ehd.question_id = q.id
   AND qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no = 11
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y'
   AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
   AND ehd.correct_answer IS DISTINCT FROM qb.answer;

-- Q11 후보: canonical 하이픈 표기 또는 확인된 노드 콤마+경로 파이프 표기와 정확히 동치인 오답만.
INSERT INTO regrade_targets (detail_id, exam_history_id, question_no, reason)
SELECT ehd.id, ehd.exam_history_id, qb.question_no, 'Q11 explicit branch-path alternative'
  FROM exam_history_details ehd
  JOIN questions q ON q.id = ehd.question_id
  JOIN question_bank qb ON qb.id = q.source_question_bank_id
 WHERE qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no = 11
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y'
   AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
   AND ehd.correct = false
   AND regexp_replace(
           translate(COALESCE(ehd.user_answer, ''), '‐‑‒–—−', '------'),
           '[[:space:]]+', '', 'g') IN (
       '1-2-3-4-5-6-7,1-2-4-5-6-1',
       '1,2,3,4,5,6,7|1,2,4,5,6,1'
   );

-- Q19 후보: 영문자 사이의 ASCII/일반 dash만 공백으로 바꾸고 연속 공백을 축약해 비교한다.
INSERT INTO regrade_targets (detail_id, exam_history_id, question_no, reason)
SELECT ehd.id, ehd.exam_history_id, qb.question_no, 'Q19 English word dash-space equivalence'
  FROM exam_history_details ehd
  JOIN questions q ON q.id = ehd.question_id
  JOIN question_bank qb ON qb.id = q.source_question_bank_id
 WHERE qb.exam_year = 2025
   AND qb.exam_round = 2
   AND qb.question_no = 19
   AND qb.del_yn = 'N'
   AND qb.use_yn = 'Y'
   AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
   AND ehd.correct = false
   AND btrim(regexp_replace(
           regexp_replace(lower(COALESCE(ehd.user_answer, '')),
                          '([a-z])[-‐‑‒–—−]([a-z])', '\1 \2', 'g'),
           '[[:space:]]+', ' ', 'g'))
       = btrim(regexp_replace(
           regexp_replace(lower(COALESCE(qb.answer, '')),
                          '([a-z])[-‐‑‒–—−]([a-z])', '\1 \2', 'g'),
           '[[:space:]]+', ' ', 'g'));

-- Q20 후보: 시작/공백/콤마/슬래시 직후 숫자 열거 마커를 제거한다. `1.TTL`처럼
-- 번호 뒤 비숫자 본문이 바로 시작되는 형식도 허용하되 `11.75`처럼 다음 문자가 숫자면 보존한다.
-- 공백만 축약한 고유 토큰 집합이 원본 정답의 5개 토큰과 정확히 같을 때만 인정한다.
WITH q20_candidates AS (
    SELECT ehd.id AS detail_id,
           ehd.exam_history_id,
           qb.question_no,
           ehd.user_answer,
           qb.answer
      FROM exam_history_details ehd
      JOIN questions q ON q.id = ehd.question_id
      JOIN question_bank qb ON qb.id = q.source_question_bank_id
     WHERE qb.exam_year = 2025
       AND qb.exam_round = 2
       AND qb.question_no = 20
       AND qb.del_yn = 'N'
       AND qb.use_yn = 'Y'
       AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
       AND ehd.correct = false
), q20_normalized AS (
    SELECT c.detail_id,
           c.exam_history_id,
           c.question_no,
           ARRAY(
               SELECT normalized_token
                 FROM (
                     SELECT DISTINCT regexp_replace(btrim(part), '[[:space:]]+', ' ', 'g') AS normalized_token
                       FROM regexp_split_to_table(
                           regexp_replace(
                               regexp_replace(lower(COALESCE(c.user_answer, '')),
                                   '(^|[,/]|[[:space:]])[0-9]{1,2}[.)]([^0-9[:space:]])',
                                   '\1,\2', 'g'),
                               '(^|[,/]|[[:space:]])[0-9]{1,2}[.)][[:space:]]+',
                               '\1,', 'g'),
                           '[,/]') AS user_parts(part)
                 ) normalized_user
                WHERE normalized_token <> ''
                ORDER BY normalized_token
           ) AS user_tokens,
           ARRAY(
               SELECT normalized_token
                 FROM (
                     SELECT DISTINCT regexp_replace(btrim(part), '[[:space:]]+', ' ', 'g') AS normalized_token
                       FROM regexp_split_to_table(
                           regexp_replace(
                               regexp_replace(lower(COALESCE(c.answer, '')),
                                   '(^|[,/]|[[:space:]])[0-9]{1,2}[.)]([^0-9[:space:]])',
                                   '\1,\2', 'g'),
                               '(^|[,/]|[[:space:]])[0-9]{1,2}[.)][[:space:]]+',
                               '\1,', 'g'),
                           '[,/]') AS answer_parts(part)
                 ) normalized_answer
                WHERE normalized_token <> ''
                ORDER BY normalized_token
           ) AS answer_tokens
      FROM q20_candidates c
)
INSERT INTO regrade_targets (detail_id, exam_history_id, question_no, reason)
SELECT detail_id, exam_history_id, question_no, 'Q20 enumeration-marker and whitespace equivalence'
  FROM q20_normalized
 WHERE cardinality(user_tokens) = 5
   AND user_tokens = answer_tokens;

-- dry-run: 실제 correct 변경 전에 대상과 사유를 반드시 확인한다(현재 예상 총 3건).
SELECT rt.detail_id, rt.exam_history_id, rt.question_no, rt.reason,
       ehd.user_answer, ehd.correct_answer, ehd.correct
  FROM regrade_targets rt
  JOIN exam_history_details ehd ON ehd.id = rt.detail_id
 ORDER BY rt.exam_history_id, rt.question_no;

DO $$
DECLARE
    target_count INTEGER;
BEGIN
    SELECT count(*) INTO target_count FROM regrade_targets;
    IF target_count > 10 THEN
        RAISE EXCEPTION '재채점 안전 상한 10건을 초과했습니다. 현재: %', target_count;
    END IF;
    IF EXISTS (SELECT 1 FROM regrade_targets WHERE question_no NOT IN (11, 19, 20)) THEN
        RAISE EXCEPTION '허용되지 않은 문항번호가 재채점 대상에 포함되었습니다.';
    END IF;
END $$;

UPDATE exam_history_details ehd
   SET correct = true
  FROM regrade_targets rt
 WHERE ehd.id = rt.detail_id
   AND ehd.correct = false;

-- 영향받은 이력만 상세 정답 합계로 집계하고, 서비스와 동일하게 백분율을 Math.round 방식으로 반올림한다.
UPDATE exam_history eh
   SET correct_count = totals.correct_count,
       score = totals.score
  FROM (
      SELECT target_histories.exam_history_id,
             (count(*) FILTER (WHERE ehd.correct))::INTEGER AS correct_count,
             COALESCE(round(
                 count(*) FILTER (WHERE ehd.correct) * 100.0
                 / NULLIF(max(eh_inner.total_questions), 0)
             ), 0) AS score
        FROM (SELECT DISTINCT exam_history_id FROM regrade_targets) target_histories
        JOIN exam_history eh_inner ON eh_inner.id = target_histories.exam_history_id
        JOIN exam_history_details ehd ON ehd.exam_history_id = target_histories.exam_history_id
       GROUP BY target_histories.exam_history_id
  ) totals
 WHERE eh.id = totals.exam_history_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM regrade_targets rt
          JOIN exam_history_details ehd ON ehd.id = rt.detail_id
         WHERE ehd.correct = false
    ) THEN
        RAISE EXCEPTION '재채점 대상 중 correct=false로 남은 detail이 있습니다.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM regrade_correct_guard before_state
          JOIN exam_history_details after_state ON after_state.id = before_state.id
         WHERE before_state.correct IS DISTINCT FROM after_state.correct
           AND NOT EXISTS (SELECT 1 FROM regrade_targets rt WHERE rt.detail_id = after_state.id)
    ) THEN
        RAISE EXCEPTION '허용 대상 밖의 detail.correct가 변경되었습니다.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM question_bank qb
          JOIN questions q ON q.source_question_bank_id = qb.id
         WHERE qb.exam_year = 2025
           AND qb.exam_round = 2
           AND qb.question_no = 11
           AND qb.del_yn = 'N'
           AND qb.use_yn = 'Y'
           AND qb.id IN (SELECT question_bank_id FROM regrade_sources)
           AND q.answer IS DISTINCT FROM qb.answer
    ) THEN
        RAISE EXCEPTION 'Q11 연결 시험지의 answer가 원본 canonical 정답과 다릅니다.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM regrade_targets rt
          JOIN exam_history eh ON eh.id = rt.exam_history_id
         GROUP BY rt.exam_history_id, eh.total_questions, eh.correct_count, eh.score
        HAVING count(DISTINCT rt.question_no) = 3
           AND eh.total_questions = 20
           AND (eh.correct_count <> 20 OR eh.score <> 100)
    ) THEN
        RAISE EXCEPTION 'Q11/Q19/Q20을 모두 보정한 20문항 이력이 20개 정답·100점이 아닙니다.';
    END IF;
END $$;

-- 사후 확인: 변경 detail과 재계산된 이력 집계. 재실행 시 target은 0건이어도 안전하다.
SELECT rt.detail_id, rt.exam_history_id, rt.question_no, ehd.correct, ehd.correct_answer
  FROM regrade_targets rt
  JOIN exam_history_details ehd ON ehd.id = rt.detail_id
 ORDER BY rt.exam_history_id, rt.question_no;

SELECT eh.id, eh.total_questions, eh.correct_count, eh.score
  FROM exam_history eh
 WHERE eh.id IN (SELECT DISTINCT exam_history_id FROM regrade_targets)
 ORDER BY eh.id;

COMMIT;
