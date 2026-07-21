-- 목적: "2026년 2회 정보처리기사 실기"(기존 그대로) 20문항을 문제은행(question_bank)에 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회한다. 기존 실기 회차(2026-1 등)와
--       동일하게 exam_year=2026, exam_round=2로 등록해 "AI 커스텀"이 아닌 정식 기출로 노출한다.
-- 방식: exam questions(exam_id 매칭)에서 content·code·answer·options를 그대로 복사하고,
--       (seq→category_id·title) 매핑만 새로 부여한다.
-- 재실행 안전: 동일 title이 이미 있으면 재삽입하지 않는다. id·audit는 표준값.

BEGIN;

INSERT INTO question_bank (
    create_dt, create_uno, modified_dt, modified_uno, del_yn, use_yn,
    content, question_type, disable_alternative_answer,
    code, language, instruction, answer, options, explanation,
    category_id, question_no, exam_year, exam_round, title
)
SELECT
    now(), 1, now(), 1, 'N', 'Y',
    q.content, q.question_type, q.disable_alternative_answer,
    q.code, q.language, q.instruction, q.answer, q.options, q.explanation,
    m.category_id, m.seq, 2026, 2, m.title
FROM (VALUES
(1, 30, $x$2026년 2회 1번 — 블랙박스 테스트 동치분할$x$),
(2, 3, $x$2026년 2회 2번 — Java 상속과 super 호출$x$),
(3, 30, $x$2026년 2회 3번 — 결합도 내용결합도$x$),
(4, 4, $x$2026년 2회 4번 — 라우팅 프로토콜 OSPF$x$),
(5, 3, $x$2026년 2회 5번 — Python 딕셔너리 순회$x$),
(6, 3, $x$2026년 2회 6번 — Python 문자열 슬라이싱$x$),
(7, 3, $x$2026년 2회 7번 — C언어 트리 후위순회 재귀$x$),
(8, 1, $x$2026년 2회 8번 — SRT 스케줄링 평균 대기시간$x$),
(9, 3, $x$2026년 2회 9번 — C언어 값·참조 전달$x$),
(10, 4, $x$2026년 2회 10번 — 서브네팅 유효 호스트 판별$x$),
(11, 30, $x$2026년 2회 11번 — 디자인 패턴 추상 팩토리$x$),
(12, 2, $x$2026년 2회 12번 — SQL LIKE·ORDER BY$x$),
(13, 2, $x$2026년 2회 13번 — SQL 상관 서브쿼리 결과$x$),
(14, 2, $x$2026년 2회 14번 — SQL RIGHT OUTER JOIN 결과$x$),
(15, 3, $x$2026년 2회 15번 — Java 상속 필드·메서드 오버라이딩$x$),
(16, 4, $x$2026년 2회 16번 — 서브넷 분할 프리픽스$x$),
(17, 5, $x$2026년 2회 17번 — 보안 기술 해시$x$),
(18, 3, $x$2026년 2회 18번 — C언어 재귀 점화식$x$),
(19, 2, $x$2026년 2회 19번 — SQL CHECK 도메인 제약$x$),
(20, 31, $x$2026년 2회 20번 — 정규형 판별$x$)
) AS m(seq, category_id, title)
JOIN exams e ON e.title = '2026년 2회 정보처리기사 실기' AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT question_no, category_id, question_type, (options IS NOT NULL) has_opt, left(title, 40) title
FROM question_bank
WHERE exam_year = 2026 AND exam_round = 2 AND del_yn = 'N'
ORDER BY question_no;
