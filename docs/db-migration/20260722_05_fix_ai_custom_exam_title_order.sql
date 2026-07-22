-- 목적: 20260722_04에서 적용한 "TPMP 모의고사 N회" 회차 순서가 반대로 되어 있던 것을 정정한다.
-- 배경: 20260722_04는 최신 시험(2026-2)을 1회, 가장 오래된 시험(2024-3)을 6회로 매핑했다.
--       올바른 규칙은 "가장 오래된 시험이 1회, 가장 최신 시험이 가장 큰 회차 번호"이므로
--       실제로는 2024-3 → 1회, 2025-1 → 2회, 2025-2 → 3회, 2025-3 → 4회, 2026-1 → 5회, 2026-2 → 6회가 되어야 한다.
--       exam_year/exam_round/is_ai_custom 구조화 컬럼은 그대로 유지하고 title 문자열만 재정정한다.
--       exams.title과 examinations.title은 항상 같은 값을 갖는 기존 관례를 유지하기 위해 두 테이블 모두 UPDATE한다.
-- 적용 대상: PostgreSQL 15 / exams, examinations
-- 매핑 (오래된순 1회부터, 확정됨):
--   exams.id=12 / examinations.id=20 : 2024년 3회 (가장 오래됨) → TPMP 모의고사 1회
--   exams.id=11 / examinations.id=19 : 2025년 1회               → TPMP 모의고사 2회
--   exams.id=10 / examinations.id=18 : 2025년 2회               → TPMP 모의고사 3회
--   exams.id=9  / examinations.id=17 : 2025년 3회               → TPMP 모의고사 4회
--   exams.id=8  / examinations.id=16 : 2026년 1회               → TPMP 모의고사 5회
--   exams.id=13 / examinations.id=21 : 2026년 2회 (최신)        → TPMP 모의고사 6회
-- 롤백: 본 파일 하단 ROLLBACK 블록 참고(20260722_04가 적용한 반대 순서 title로 원복)

BEGIN;

-- 적용 전 확인: 대상 12행의 현재 title (20260722_04 적용 직후 상태, 반대 순서)
SELECT 'exams' AS table_name, id, title FROM exams WHERE id IN (13, 8, 9, 10, 11, 12)
UNION ALL
SELECT 'examinations' AS table_name, id, title FROM examinations WHERE id IN (21, 16, 17, 18, 19, 20)
ORDER BY table_name, id;

-- exams.title 갱신
UPDATE exams SET title = 'TPMP 모의고사 1회' WHERE id = 12;
UPDATE exams SET title = 'TPMP 모의고사 2회' WHERE id = 11;
UPDATE exams SET title = 'TPMP 모의고사 3회' WHERE id = 10;
UPDATE exams SET title = 'TPMP 모의고사 4회' WHERE id = 9;
UPDATE exams SET title = 'TPMP 모의고사 5회' WHERE id = 8;
UPDATE exams SET title = 'TPMP 모의고사 6회' WHERE id = 13;

-- examinations.title 갱신
UPDATE examinations SET title = 'TPMP 모의고사 1회' WHERE id = 20;
UPDATE examinations SET title = 'TPMP 모의고사 2회' WHERE id = 19;
UPDATE examinations SET title = 'TPMP 모의고사 3회' WHERE id = 18;
UPDATE examinations SET title = 'TPMP 모의고사 4회' WHERE id = 17;
UPDATE examinations SET title = 'TPMP 모의고사 5회' WHERE id = 16;
UPDATE examinations SET title = 'TPMP 모의고사 6회' WHERE id = 21;

-- 적용 후 검증: exams와 examinations의 title이 정확히 매핑대로 바뀌었는지, 둘이 서로 일치하는지, 연도·회차 오름차순과 TPMP 회차 번호가 일치하는지 확인
SELECT e.id AS exam_id, e.title AS exam_title, x.id AS examination_id, x.title AS examination_title,
       x.exam_year, x.exam_round, x.is_ai_custom
FROM exams e
JOIN examinations x ON x.exam_paper_id = e.id
WHERE e.id IN (13, 8, 9, 10, 11, 12)
ORDER BY x.exam_year ASC NULLS LAST, x.exam_round ASC NULLS LAST;

-- 적용 후 검증: 전체 12개 시험(examinations 기준) title 전수 조회
SELECT id, title, exam_year, exam_round, is_ai_custom
FROM examinations
ORDER BY exam_year DESC NULLS LAST, exam_round DESC NULLS LAST, is_ai_custom;

COMMIT;

-- ROLLBACK (필요 시 아래 문장을 별도 트랜잭션으로 실행 — 20260722_04가 적용한 반대 순서 title로 원복)
-- BEGIN;
-- UPDATE exams SET title = 'TPMP 모의고사 1회' WHERE id = 13;
-- UPDATE exams SET title = 'TPMP 모의고사 2회' WHERE id = 8;
-- UPDATE exams SET title = 'TPMP 모의고사 3회' WHERE id = 9;
-- UPDATE exams SET title = 'TPMP 모의고사 4회' WHERE id = 10;
-- UPDATE exams SET title = 'TPMP 모의고사 5회' WHERE id = 11;
-- UPDATE exams SET title = 'TPMP 모의고사 6회' WHERE id = 12;
-- UPDATE examinations SET title = 'TPMP 모의고사 1회' WHERE id = 21;
-- UPDATE examinations SET title = 'TPMP 모의고사 2회' WHERE id = 16;
-- UPDATE examinations SET title = 'TPMP 모의고사 3회' WHERE id = 17;
-- UPDATE examinations SET title = 'TPMP 모의고사 4회' WHERE id = 18;
-- UPDATE examinations SET title = 'TPMP 모의고사 5회' WHERE id = 19;
-- UPDATE examinations SET title = 'TPMP 모의고사 6회' WHERE id = 20;
-- COMMIT;
