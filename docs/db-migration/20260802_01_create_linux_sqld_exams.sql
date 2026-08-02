-- 목적: 리눅스마스터 1급/2급·SQLD 기출문제(question_bank)에 대응하는 시험지(exams)·
--       시험(examinations)·시험 문항(questions)이 없어 사용자가 응시할 수 없던 문제를 해결한다.
-- 배경: question_bank에는 리눅스마스터 1급(2023년 1회, 100문항)·2급(2023년 1회, 80문항)·
--       SQLD(2026년 제60회, 50문항) 기출문제가 이미 적재돼 있으나(f55fea5 마이그),
--       이를 패키징한 examinations가 한 건도 없어 "정보처리기사 실기"만 응시 가능했다.
-- 대상 외: 회차 정보(exam_year/exam_round)가 없는 문항 7건(리눅스마스터 1급 5건, SQLD 2건)은
--       정식 회차 문항이 아니라 별도 등록된 개별 문항으로 판단해 이번 시험 구성에서 제외한다.
-- 재실행 안전성: 각 examinations.title 기준으로 이미 존재하면 건너뛴다(ON CONFLICT 대상 PK가
--       IDENTITY라 자연 방지가 안 되므로 존재 여부를 조건으로 명시적으로 가드한다).

DO $$
DECLARE
    v_admin_id bigint;
    v_next_order integer;
    v_exam_id bigint;
    v_examination_id bigint;
    v_inserted integer;
BEGIN
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@tpmp.com';

    -- ── 1) 리눅스마스터 1급 2023년 1회 (100문항, 필기 100분) ──────────────────────
    IF NOT EXISTS (SELECT 1 FROM examinations WHERE title = '2023년 1회 리눅스마스터 1급') THEN
        SELECT COALESCE(MAX(order_no), 0) + 1 INTO v_next_order FROM exams;

        INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by, use_yn)
        VALUES (now(), 'N', v_next_order, 'SEQUENTIAL', '2023년 1회 리눅스마스터 1급', v_admin_id, 'Y')
        RETURNING id INTO v_exam_id;

        INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id,
                                   exam_year, exam_round, is_ai_custom, del_yn, use_yn)
        VALUES (now(), 100, '2023년 1회 리눅스마스터 1급', 9, v_admin_id, v_exam_id,
                2023, 1, false, 'N', 'Y')
        RETURNING id INTO v_examination_id;

        INSERT INTO questions (answer, code, content, explanation, language, options, question_type, seq,
                                exam_id, category_id, source_question_bank_id, instruction,
                                scheduling_data, sql_data, disable_alternative_answer, del_yn, use_yn)
        SELECT qb.answer, qb.code, qb.content, qb.explanation, qb.language, qb.options, qb.question_type,
               ROW_NUMBER() OVER (ORDER BY qb.question_no),
               v_exam_id, qb.category_id, qb.id, qb.instruction,
               qb.scheduling_data, qb.sql_data, qb.disable_alternative_answer, 'N', 'Y'
        FROM question_bank qb
        JOIN domain_slave et ON et.id = qb.exam_type_id
        WHERE et.name = '리눅스마스터 1급' AND qb.exam_year = 2023 AND qb.exam_round = 1
        ORDER BY qb.question_no;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        RAISE NOTICE '[리눅스마스터 1급] examination_id=%, 문항 %건 생성', v_examination_id, v_inserted;
    ELSE
        RAISE NOTICE '[리눅스마스터 1급] 이미 존재 — 건너뜀';
    END IF;

    -- ── 2) 리눅스마스터 2급 2023년 1회 (80문항, 필기 90분) ────────────────────────
    IF NOT EXISTS (SELECT 1 FROM examinations WHERE title = '2023년 1회 리눅스마스터 2급') THEN
        SELECT COALESCE(MAX(order_no), 0) + 1 INTO v_next_order FROM exams;

        INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by, use_yn)
        VALUES (now(), 'N', v_next_order, 'SEQUENTIAL', '2023년 1회 리눅스마스터 2급', v_admin_id, 'Y')
        RETURNING id INTO v_exam_id;

        INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id,
                                   exam_year, exam_round, is_ai_custom, del_yn, use_yn)
        VALUES (now(), 90, '2023년 1회 리눅스마스터 2급', 34, v_admin_id, v_exam_id,
                2023, 1, false, 'N', 'Y')
        RETURNING id INTO v_examination_id;

        INSERT INTO questions (answer, code, content, explanation, language, options, question_type, seq,
                                exam_id, category_id, source_question_bank_id, instruction,
                                scheduling_data, sql_data, disable_alternative_answer, del_yn, use_yn)
        SELECT qb.answer, qb.code, qb.content, qb.explanation, qb.language, qb.options, qb.question_type,
               ROW_NUMBER() OVER (ORDER BY qb.question_no),
               v_exam_id, qb.category_id, qb.id, qb.instruction,
               qb.scheduling_data, qb.sql_data, qb.disable_alternative_answer, 'N', 'Y'
        FROM question_bank qb
        JOIN domain_slave et ON et.id = qb.exam_type_id
        WHERE et.name = '리눅스마스터 2급' AND qb.exam_year = 2023 AND qb.exam_round = 1
        ORDER BY qb.question_no;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        RAISE NOTICE '[리눅스마스터 2급] examination_id=%, 문항 %건 생성', v_examination_id, v_inserted;
    ELSE
        RAISE NOTICE '[리눅스마스터 2급] 이미 존재 — 건너뜀';
    END IF;

    -- ── 3) SQLD 2026년 제60회 (50문항, 90분) ──────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM examinations WHERE title = '2026년 제60회 SQLD') THEN
        SELECT COALESCE(MAX(order_no), 0) + 1 INTO v_next_order FROM exams;

        INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by, use_yn)
        VALUES (now(), 'N', v_next_order, 'SEQUENTIAL', '2026년 제60회 SQLD', v_admin_id, 'Y')
        RETURNING id INTO v_exam_id;

        INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id,
                                   exam_year, exam_round, is_ai_custom, del_yn, use_yn)
        VALUES (now(), 90, '2026년 제60회 SQLD', 6, v_admin_id, v_exam_id,
                2026, 60, false, 'N', 'Y')
        RETURNING id INTO v_examination_id;

        INSERT INTO questions (answer, code, content, explanation, language, options, question_type, seq,
                                exam_id, category_id, source_question_bank_id, instruction,
                                scheduling_data, sql_data, disable_alternative_answer, del_yn, use_yn)
        SELECT qb.answer, qb.code, qb.content, qb.explanation, qb.language, qb.options, qb.question_type,
               ROW_NUMBER() OVER (ORDER BY qb.question_no),
               v_exam_id, qb.category_id, qb.id, qb.instruction,
               qb.scheduling_data, qb.sql_data, qb.disable_alternative_answer, 'N', 'Y'
        FROM question_bank qb
        JOIN domain_slave et ON et.id = qb.exam_type_id
        WHERE et.name = 'SQLD' AND qb.exam_year = 2026 AND qb.exam_round = 60
        ORDER BY qb.question_no;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        RAISE NOTICE '[SQLD] examination_id=%, 문항 %건 생성', v_examination_id, v_inserted;
    ELSE
        RAISE NOTICE '[SQLD] 이미 존재 — 건너뜀';
    END IF;
END $$;
