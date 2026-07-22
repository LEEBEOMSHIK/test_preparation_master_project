-- 목적: AI 커스텀 시험 6개의 제목을 실제 국가기술자격 시험 회차 표기("2026년 2회 정보처리기사 실기 (AI 커스텀)")에서
--       사이트 자체 회차 표기("TPMP 모의고사 N회")로 변경한다.
-- 배경: 지금까지 AI 커스텀 시험 제목이 실제 시험의 특정 연도·회차를 그대로 사용하고 있어,
--       실제 기출문제로 오인될 소지(저작권 문제)가 있었다. 이를 방지하기 위해 제목에서
--       연도·회차·"(AI 커스텀)" 표기를 모두 제거하고, 사이트 자체 회차("TPMP 모의고사 N회")로 대체한다.
--       exam_year/exam_round/is_ai_custom 구조화 컬럼(20260722_01)은 이미 올바른 값을 갖고 있으므로
--       이번 마이그레이션에서는 title 문자열만 변경한다(구조화 컬럼은 그대로 유지).
--       exams.title과 examinations.title은 항상 같은 값을 갖는 기존 관례를 유지하기 위해 두 테이블 모두 UPDATE한다.
--       question_bank의 문항 제목("[AI커스텀] 2026-2 ...")은 관리자 내부 라벨이라 이번 스코프에서 제외한다.
--       UserExamApplication.exam_name(사용자가 접수정보 입력 시 저장한 시험명 스냅샷)은 과거 시점 값이므로
--       소급 변경하지 않고 그대로 둔다.
-- 적용 대상: PostgreSQL 15 / exams, examinations
-- 매핑 (최신순 1회부터, 확정됨):
--   exams.id=13 / examinations.id=21 : 2026년 2회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 1회
--   exams.id=8  / examinations.id=16 : 2026년 1회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 2회
--   exams.id=9  / examinations.id=17 : 2025년 3회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 3회
--   exams.id=10 / examinations.id=18 : 2025년 2회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 4회
--   exams.id=11 / examinations.id=19 : 2025년 1회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 5회
--   exams.id=12 / examinations.id=20 : 2024년 3회 정보처리기사 실기 (AI 커스텀) → TPMP 모의고사 6회
-- 롤백: 본 파일 하단 ROLLBACK 블록 참고(변경 전 title로 원복)

BEGIN;

-- 적용 전 확인: 대상 12행의 현재 title
SELECT 'exams' AS table_name, id, title FROM exams WHERE id IN (13, 8, 9, 10, 11, 12)
UNION ALL
SELECT 'examinations' AS table_name, id, title FROM examinations WHERE id IN (21, 16, 17, 18, 19, 20)
ORDER BY table_name, id;

-- exams.title 갱신
UPDATE exams SET title = 'TPMP 모의고사 1회' WHERE id = 13;
UPDATE exams SET title = 'TPMP 모의고사 2회' WHERE id = 8;
UPDATE exams SET title = 'TPMP 모의고사 3회' WHERE id = 9;
UPDATE exams SET title = 'TPMP 모의고사 4회' WHERE id = 10;
UPDATE exams SET title = 'TPMP 모의고사 5회' WHERE id = 11;
UPDATE exams SET title = 'TPMP 모의고사 6회' WHERE id = 12;

-- examinations.title 갱신
UPDATE examinations SET title = 'TPMP 모의고사 1회' WHERE id = 21;
UPDATE examinations SET title = 'TPMP 모의고사 2회' WHERE id = 16;
UPDATE examinations SET title = 'TPMP 모의고사 3회' WHERE id = 17;
UPDATE examinations SET title = 'TPMP 모의고사 4회' WHERE id = 18;
UPDATE examinations SET title = 'TPMP 모의고사 5회' WHERE id = 19;
UPDATE examinations SET title = 'TPMP 모의고사 6회' WHERE id = 20;

-- 적용 후 검증: exams와 examinations의 title이 정확히 매핑대로 바뀌었는지, 둘이 서로 일치하는지 확인
SELECT e.id AS exam_id, e.title AS exam_title, x.id AS examination_id, x.title AS examination_title,
       x.exam_year, x.exam_round, x.is_ai_custom
FROM exams e
JOIN examinations x ON x.exam_paper_id = e.id
WHERE e.id IN (13, 8, 9, 10, 11, 12)
ORDER BY x.exam_year DESC NULLS LAST, x.exam_round DESC NULLS LAST;

-- 적용 후 검증: 전체 12개 시험(examinations 기준) title 전수 조회
SELECT id, title, exam_year, exam_round, is_ai_custom
FROM examinations
ORDER BY exam_year DESC NULLS LAST, exam_round DESC NULLS LAST, is_ai_custom;

COMMIT;

-- ROLLBACK (필요 시 아래 문장을 별도 트랜잭션으로 실행 — 변경 전 title로 원복)
-- BEGIN;
-- UPDATE exams SET title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' WHERE id = 13;
-- UPDATE exams SET title = '2026년 1회 정보처리기사 실기 (AI 커스텀)' WHERE id = 8;
-- UPDATE exams SET title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' WHERE id = 9;
-- UPDATE exams SET title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' WHERE id = 10;
-- UPDATE exams SET title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' WHERE id = 11;
-- UPDATE exams SET title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' WHERE id = 12;
-- UPDATE examinations SET title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' WHERE id = 21;
-- UPDATE examinations SET title = '2026년 1회 정보처리기사 실기 (AI 커스텀)' WHERE id = 16;
-- UPDATE examinations SET title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' WHERE id = 17;
-- UPDATE examinations SET title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' WHERE id = 18;
-- UPDATE examinations SET title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' WHERE id = 19;
-- UPDATE examinations SET title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' WHERE id = 20;
-- COMMIT;
