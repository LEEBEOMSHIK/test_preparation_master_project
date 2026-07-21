-- 목적: AI 커스텀 시험(2024-3) 20문항을 문제은행(question_bank)에도 AI 커스텀으로 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회하므로, 시험(exams+questions)에만
--       넣으면 문항 관리에 노출되지 않는다. 앞선 20260720_03/05, 20260721_02와 동일한 방식으로
--       2024-3 20문항도 exam_year·exam_round = NULL의 AI 커스텀으로 등록한다.
-- 방식: 이미 만든 exam questions(exam_id 매칭)에서 content·code·answer·options 등을 그대로
--       복사하고, (seq→category_id·키워드·도메인·요약·난이도·title) 매핑만 새로 부여한다.
-- 문항번호: AI 커스텀은 카테고리별로 매김 — 기존 카테고리 최대 question_no + 카테고리 내 순번.
-- 재실행 안전: 동일 title이 이미 있으면 재삽입하지 않는다. id·audit는 표준값.

BEGIN;

INSERT INTO question_bank (
    create_dt, create_uno, modified_dt, modified_uno, del_yn, use_yn,
    content, question_type, disable_alternative_answer,
    code, language, instruction, answer, options, explanation,
    category_id, question_no, ai_keywords, ai_domains, ai_summary, ai_difficulty,
    exam_year, exam_round, title
)
SELECT
    now(), 1, now(), 1, 'N', 'Y',
    q.content, q.question_type, q.disable_alternative_answer,
    q.code, q.language, q.instruction, q.answer, q.options, q.explanation,
    m.category_id,
    (SELECT COALESCE(MAX(qb.question_no), 0) FROM question_bank qb
       WHERE qb.category_id = m.category_id AND qb.exam_year IS NULL AND qb.exam_round IS NULL AND qb.del_yn = 'N')
      + ROW_NUMBER() OVER (PARTITION BY m.category_id ORDER BY m.seq),
    m.ai_keywords::jsonb, m.ai_domains::jsonb, m.ai_summary, m.ai_difficulty,
    NULL, NULL, m.title
FROM (VALUES
(1, 3, $x$["equals","문자열 비교","리터럴 풀","new String"]$x$, $x$["프로그래밍"]$x$, $x$equals 내용 비교와 배열 순회 출력$x$, $x$중$x$, $x$[AI커스텀] 2024-3 자바 문자열 equals 비교$x$),
(2, 3, $x$["리스트 반전","슬라이싱","인덱싱"]$x$, $x$["프로그래밍"]$x$, $x$in-place 리스트 반전과 슬라이스 합 차이$x$, $x$중$x$, $x$[AI커스텀] 2024-3 파이썬 리스트 반전·슬라이싱$x$),
(3, 2, $x$["서브쿼리","GROUP BY","HAVING","다중 조인"]$x$, $x$["데이터베이스","SQL"]$x$, $x$중첩 서브쿼리와 조인 결과 카운트$x$, $x$상$x$, $x$[AI커스텀] 2024-3 SQL 서브쿼리 count$x$),
(4, 1, $x$["LRU","페이지 부재","페이지 교체"]$x$, $x$["운영체제"]$x$, $x$LRU 알고리즘 페이지 부재 횟수 계산$x$, $x$상$x$, $x$[AI커스텀] 2024-3 LRU 페이지 부재$x$),
(5, 5, $x$["스머프","ICMP","DoS","증폭 공격"]$x$, $x$["정보보안"]$x$, $x$ICMP 브로드캐스트 증폭 공격 스머프$x$, $x$중$x$, $x$[AI커스텀] 2024-3 네트워크 취약점 스머프$x$),
(6, 30, $x$["GoF","행위 패턴","디자인 패턴"]$x$, $x$["소프트웨어공학"]$x$, $x$객체 상호작용·책임 분배 GoF 행위 패턴$x$, $x$하$x$, $x$[AI커스텀] 2024-3 GoF 디자인 패턴 분류$x$),
(7, 3, $x$["static 변수","함수 호출","값 유지"]$x$, $x$["프로그래밍"]$x$, $x$static 지역 변수의 호출 간 값 유지$x$, $x$중$x$, $x$[AI커스텀] 2024-3 C static 변수$x$),
(8, 31, $x$["개체 무결성","기본키","NULL","중복"]$x$, $x$["데이터베이스"]$x$, $x$기본키 중복·NULL로 인한 개체 무결성 위반$x$, $x$하$x$, $x$[AI커스텀] 2024-3 무결성 위반 판별$x$),
(9, 33, $x$["URL","scheme","authority","query","fragment"]$x$, $x$["웹 기술"]$x$, $x$URL 구성 요소 명칭과 구조 순서$x$, $x$중$x$, $x$[AI커스텀] 2024-3 URL 구조$x$),
(10, 3, $x$["type","자료형 판별","분기"]$x$, $x$["프로그래밍"]$x$, $x$type() 비교로 자료형별 분기 처리$x$, $x$중$x$, $x$[AI커스텀] 2024-3 파이썬 type 판별$x$),
(11, 3, $x$["필드 은닉","동적 바인딩","정적 바인딩","상속"]$x$, $x$["프로그래밍"]$x$, $x$필드는 정적·메서드는 동적 바인딩$x$, $x$상$x$, $x$[AI커스텀] 2024-3 자바 상속 필드·메서드 바인딩$x$),
(12, 3, $x$["연결 리스트","값 교환","포인터 이동"]$x$, $x$["프로그래밍"]$x$, $x$연결 리스트 인접 쌍 값 교환 반복$x$, $x$상$x$, $x$[AI커스텀] 2024-3 C 연결 리스트 값 교환$x$),
(13, 30, $x$["문장 커버리지","분기 커버리지","조건 커버리지"]$x$, $x$["소프트웨어공학"]$x$, $x$화이트박스 테스트 커버리지 3종 구분$x$, $x$중$x$, $x$[AI커스텀] 2024-3 테스트 커버리지 종류$x$),
(14, 30, $x$["UML","연관","일반화","의존"]$x$, $x$["소프트웨어공학"]$x$, $x$UML 클래스 관계 3종(연관·일반화·의존)$x$, $x$중$x$, $x$[AI커스텀] 2024-3 UML 클래스 관계$x$),
(15, 31, $x$["슈퍼키","후보키","대체키","외래키"]$x$, $x$["데이터베이스"]$x$, $x$데이터베이스 키 4종 구분$x$, $x$중$x$, $x$[AI커스텀] 2024-3 데이터베이스 키 종류$x$),
(16, 3, $x$["이중 포인터","배열","모듈러 연산"]$x$, $x$["프로그래밍"]$x$, $x$이중 포인터로 배열 원소를 모듈러 갱신$x$, $x$상$x$, $x$[AI커스텀] 2024-3 C 이중 포인터 배열 연산$x$),
(17, 5, $x$["VPN","터널링","IPsec"]$x$, $x$["정보보안"]$x$, $x$공중망을 사설망처럼 쓰는 VPN 기술$x$, $x$하$x$, $x$[AI커스텀] 2024-3 보안 기술 VPN$x$),
(18, 3, $x$["예외 처리","finally","다중 catch"]$x$, $x$["프로그래밍"]$x$, $x$예외 타입 매칭과 finally 항상 실행$x$, $x$중$x$, $x$[AI커스텀] 2024-3 자바 예외 처리와 finally$x$),
(19, 3, $x$["제네릭","타입 소거","오버로딩 결정"]$x$, $x$["프로그래밍"]$x$, $x$제네릭 타입 소거로 인한 오버로딩 선택$x$, $x$상$x$, $x$[AI커스텀] 2024-3 자바 제네릭과 메서드 오버로딩$x$),
(20, 4, $x$["Ad-hoc","무선 네트워크","자율 분산"]$x$, $x$["네트워크"]$x$, $x$고정 인프라 없는 임시 무선 네트워크$x$, $x$하$x$, $x$[AI커스텀] 2024-3 네트워크 Ad-hoc$x$)
) AS m(seq, category_id, ai_keywords, ai_domains, ai_summary, ai_difficulty, title)
JOIN exams e ON e.title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT question_no, category_id, question_type, (options IS NOT NULL) has_opt,
       ai_difficulty, left(title, 40) title
FROM question_bank
WHERE title LIKE '[AI커스텀] 2024-3%' AND del_yn = 'N'
ORDER BY category_id, question_no;
