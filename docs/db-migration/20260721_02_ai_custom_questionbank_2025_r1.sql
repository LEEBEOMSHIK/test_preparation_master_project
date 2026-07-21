-- 목적: AI 커스텀 시험(2025-1) 20문항을 문제은행(question_bank)에도 AI 커스텀으로 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회하므로, 시험(exams+questions)에만
--       넣으면 문항 관리에 노출되지 않는다. 앞선 20260720_03/05와 동일한 방식으로 2025-1 20문항도
--       exam_year·exam_round = NULL의 AI 커스텀으로 등록한다.
-- 방식: 이미 만든 exam questions(exam_id 매칭)에서 content·code·answer·options·sql_data 등을
--       그대로 복사하고, (seq→category_id·키워드·도메인·요약·난이도·title) 매핑만 새로 부여한다.
-- 문항번호: AI 커스텀은 카테고리별로 매김 — 기존 카테고리 최대 question_no + 카테고리 내 순번.
-- 재실행 안전: 동일 title이 이미 있으면 재삽입하지 않는다. id·audit는 표준값.

BEGIN;

INSERT INTO question_bank (
    create_dt, create_uno, modified_dt, modified_uno, del_yn, use_yn,
    content, question_type, disable_alternative_answer,
    code, language, instruction, answer, options, explanation, sql_data,
    category_id, question_no, ai_keywords, ai_domains, ai_summary, ai_difficulty,
    exam_year, exam_round, title
)
SELECT
    now(), 1, now(), 1, 'N', 'Y',
    q.content, q.question_type, q.disable_alternative_answer,
    q.code, q.language, q.instruction, q.answer, q.options, q.explanation, q.sql_data,
    m.category_id,
    (SELECT COALESCE(MAX(qb.question_no), 0) FROM question_bank qb
       WHERE qb.category_id = m.category_id AND qb.exam_year IS NULL AND qb.exam_round IS NULL AND qb.del_yn = 'N')
      + ROW_NUMBER() OVER (PARTITION BY m.category_id ORDER BY m.seq),
    m.ai_keywords::jsonb, m.ai_domains::jsonb, m.ai_summary, m.ai_difficulty,
    NULL, NULL, m.title
FROM (VALUES
(1, 5, $x$["세션 하이재킹","TCP","시퀀스 번호","세션 탈취"]$x$, $x$["정보보안"]$x$, $x$3-way 핸드셰이크 이후 세션을 가로채는 세션 하이재킹$x$, $x$중$x$, $x$[AI커스텀] 2025-1 세션 하이재킹$x$),
(2, 31, $x$["무결성","도메인 무결성","개체 무결성","참조 무결성"]$x$, $x$["데이터베이스"]$x$, $x$도메인·개체·참조 무결성 제약조건 구분$x$, $x$중$x$, $x$[AI커스텀] 2025-1 무결성 제약조건$x$),
(3, 4, $x$["CRC","오류 검출","다항식 나눗셈"]$x$, $x$["네트워크"]$x$, $x$다항식 나눗셈 나머지로 오류를 검출하는 CRC$x$, $x$하$x$, $x$[AI커스텀] 2025-1 오류 검출 CRC$x$),
(4, 5, $x$["스캐어웨어","악성코드","사회공학"]$x$, $x$["정보보안"]$x$, $x$공포심을 유발해 결제·설치를 유도하는 스캐어웨어$x$, $x$하$x$, $x$[AI커스텀] 2025-1 악성코드 스캐어웨어$x$),
(5, 3, $x$["예외 처리","다중 catch","배열 범위 초과"]$x$, $x$["프로그래밍"]$x$, $x$배열 범위 초과 예외와 다중 catch 순서$x$, $x$중$x$, $x$[AI커스텀] 2025-1 자바 예외 처리$x$),
(6, 4, $x$["ARP","RARP","주소 변환"]$x$, $x$["네트워크"]$x$, $x$IP↔MAC 주소 변환 프로토콜 ARP·RARP$x$, $x$하$x$, $x$[AI커스텀] 2025-1 ARP·RARP$x$),
(7, 2, $x$["SQL 조인","WHERE","결과 테이블"]$x$, $x$["데이터베이스","SQL"]$x$, $x$두 테이블 조인과 조건 필터링 결과 테이블$x$, $x$중$x$, $x$[AI커스텀] 2025-1 SQL 조인 결과$x$),
(8, 31, $x$["카디널리티","대체키","외래키","도메인"]$x$, $x$["데이터베이스"]$x$, $x$관계형 DB 핵심 용어 4종 매칭$x$, $x$중$x$, $x$[AI커스텀] 2025-1 관계형 DB 용어$x$),
(9, 4, $x$["서브네팅","브로드캐스트","네트워크 주소"]$x$, $x$["네트워크"]$x$, $x$/22 서브넷의 브로드캐스트 도메인 판별$x$, $x$상$x$, $x$[AI커스텀] 2025-1 서브넷 브로드캐스트 도메인$x$),
(10, 3, $x$["배열 삽입","시프트","전역 변수"]$x$, $x$["프로그래밍"]$x$, $x$삽입 위치 탐색 후 배열 원소 시프트$x$, $x$중$x$, $x$[AI커스텀] 2025-1 C 배열 삽입 시프트$x$),
(11, 3, $x$["이중 포인터","동적 할당","2차원 배열","모듈러 연산"]$x$, $x$["프로그래밍"]$x$, $x$malloc 2차원 배열의 모듈러 인덱스 채우기$x$, $x$상$x$, $x$[AI커스텀] 2025-1 C 동적 2차원 배열$x$),
(12, 30, $x$["결합도","내용 결합도","스탬프 결합도","공통 결합도"]$x$, $x$["소프트웨어공학"]$x$, $x$결합도 3종(내용·스탬프·공통) 구분$x$, $x$중$x$, $x$[AI커스텀] 2025-1 결합도 종류$x$),
(13, 3, $x$["상속","static 변수","메서드 오버라이딩","동적 바인딩"]$x$, $x$["프로그래밍"]$x$, $x$상속·오버라이딩·정적 변수 상호작용$x$, $x$상$x$, $x$[AI커스텀] 2025-1 자바 상속·static$x$),
(14, 30, $x$["디자인 패턴","Adapter","구조 패턴"]$x$, $x$["소프트웨어공학"]$x$, $x$인터페이스 변환 구조 패턴 Adapter$x$, $x$하$x$, $x$[AI커스텀] 2025-1 디자인 패턴 Adapter$x$),
(15, 30, $x$["문장 커버리지","화이트박스 테스트","제어 흐름"]$x$, $x$["소프트웨어공학"]$x$, $x$문장 커버리지를 만족하는 실행 순서 도출$x$, $x$상$x$, $x$[AI커스텀] 2025-1 문장 커버리지$x$),
(16, 3, $x$["재귀","분할 정복","Math.max"]$x$, $x$["프로그래밍"]$x$, $x$분할 정복 재귀에서 큰 쪽 분기 선택 누적$x$, $x$중$x$, $x$[AI커스텀] 2025-1 자바 재귀 분할정복$x$),
(17, 3, $x$["트리 구조","재귀","깊이","리스트 컴프리헨션"]$x$, $x$["프로그래밍"]$x$, $x$힙 구조 트리에서 짝수 깊이 값 합산$x$, $x$중$x$, $x$[AI커스텀] 2025-1 파이썬 트리 순회$x$),
(18, 3, $x$["연결 리스트","포인터 재배치","머리 삽입"]$x$, $x$["프로그래밍"]$x$, $x$특정 노드를 리스트 맨 앞으로 재배치$x$, $x$상$x$, $x$[AI커스텀] 2025-1 C 연결 리스트 재배치$x$),
(19, 3, $x$["비트 AND","구조체 배열","마스킹"]$x$, $x$["프로그래밍"]$x$, $x$구조체 배열 점수의 비트 AND 마스킹 합산$x$, $x$중$x$, $x$[AI커스텀] 2025-1 C 비트 AND 연산$x$),
(20, 3, $x$["메서드 오버로딩","재귀","피보나치"]$x$, $x$["프로그래밍"]$x$, $x$오버로딩된 메서드로 진입 후 재귀 위임$x$, $x$상$x$, $x$[AI커스텀] 2025-1 자바 메서드 오버로딩$x$)
) AS m(seq, category_id, ai_keywords, ai_domains, ai_summary, ai_difficulty, title)
JOIN exams e ON e.title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT question_no, category_id, question_type, (options IS NOT NULL) has_opt,
       ai_difficulty, left(title, 40) title
FROM question_bank
WHERE title LIKE '[AI커스텀] 2025-1%' AND del_yn = 'N'
ORDER BY category_id, question_no;
