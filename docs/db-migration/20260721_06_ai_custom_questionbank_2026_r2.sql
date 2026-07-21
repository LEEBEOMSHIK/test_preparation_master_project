-- 목적: AI 커스텀 시험(2026-2) 20문항을 문제은행(question_bank)에도 AI 커스텀으로 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회하므로, 시험(exams+questions)에만
--       넣으면 문항 관리에 노출되지 않는다. 앞선 회차들과 동일한 방식으로 2026-2 20문항도
--       exam_year·exam_round = NULL의 AI 커스텀으로 등록한다.
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
(1, 30, $x$["블랙박스 테스트","동치분할","테스트 케이스"]$x$, $x$["소프트웨어공학"]$x$, $x$입력 값을 유효/무효 클래스로 나누는 동치분할 기법$x$, $x$하$x$, $x$[AI커스텀] 2026-2 블랙박스 테스트 동치분할$x$),
(2, 3, $x$["상속","오버라이딩","super 호출","동적 바인딩"]$x$, $x$["프로그래밍"]$x$, $x$super 호출을 포함한 메서드 오버라이딩 실행 순서$x$, $x$중$x$, $x$[AI커스텀] 2026-2 자바 상속과 super 호출$x$),
(3, 30, $x$["결합도","내용결합도","모듈 독립성"]$x$, $x$["소프트웨어공학"]$x$, $x$결합도 중 강도가 가장 높은 내용결합도 식별$x$, $x$하$x$, $x$[AI커스텀] 2026-2 결합도 내용결합도$x$),
(4, 4, $x$["OSPF","링크 상태","다익스트라","라우팅 프로토콜"]$x$, $x$["네트워크"]$x$, $x$링크 상태·다익스트라 기반 라우팅 프로토콜 OSPF$x$, $x$중$x$, $x$[AI커스텀] 2026-2 라우팅 프로토콜 OSPF$x$),
(5, 3, $x$["딕셔너리","items","문자열 슬라이싱"]$x$, $x$["프로그래밍"]$x$, $x$딕셔너리 순회와 키·값 문자 조합$x$, $x$중$x$, $x$[AI커스텀] 2026-2 파이썬 딕셔너리 순회$x$),
(6, 3, $x$["문자열 슬라이싱","인덱싱","문자열 결합"]$x$, $x$["프로그래밍"]$x$, $x$문자열 슬라이싱 조합으로 새 문자열 생성$x$, $x$중$x$, $x$[AI커스텀] 2026-2 파이썬 문자열 슬라이싱$x$),
(7, 3, $x$["트리","구조체 포인터","후위순회","재귀"]$x$, $x$["프로그래밍"]$x$, $x$구조체 포인터 트리의 후위순회 합산$x$, $x$상$x$, $x$[AI커스텀] 2026-2 C 트리 순회 재귀$x$),
(8, 1, $x$["SRT","선점 스케줄링","평균 대기시간"]$x$, $x$["운영체제"]$x$, $x$SRT 스케줄링 평균 대기시간 계산$x$, $x$상$x$, $x$[AI커스텀] 2026-2 SRT 스케줄링$x$),
(9, 3, $x$["값 전달","참조 전달","포인터","배열"]$x$, $x$["프로그래밍"]$x$, $x$값 전달과 포인터 참조 전달의 차이$x$, $x$상$x$, $x$[AI커스텀] 2026-2 C 값·참조 전달$x$),
(10, 4, $x$["서브네팅","사용 가능 호스트","네트워크 주소","브로드캐스트"]$x$, $x$["네트워크"]$x$, $x$/27 네트워크의 사용 가능 호스트 주소 판별$x$, $x$상$x$, $x$[AI커스텀] 2026-2 서브네팅 사용 가능 호스트$x$),
(11, 30, $x$["디자인 패턴","추상 팩토리","생성 패턴"]$x$, $x$["소프트웨어공학"]$x$, $x$관련 객체군 생성 인터페이스 추상 팩토리$x$, $x$중$x$, $x$[AI커스텀] 2026-2 디자인 패턴 추상 팩토리$x$),
(12, 2, $x$["LIKE","ORDER BY","DESC","SQL 작성"]$x$, $x$["데이터베이스","SQL"]$x$, $x$패턴 검색과 내림차순 정렬 SQL 작성$x$, $x$하$x$, $x$[AI커스텀] 2026-2 SQL LIKE·ORDER BY$x$),
(13, 2, $x$["조인","집계함수","WHERE"]$x$, $x$["데이터베이스","SQL"]$x$, $x$조인 후 조건부 집계 연산 결과$x$, $x$중$x$, $x$[AI커스텀] 2026-2 SQL 조인 집계 결과$x$),
(14, 2, $x$["NOT IN","서브쿼리","COUNT"]$x$, $x$["데이터베이스","SQL"]$x$, $x$NOT IN 서브쿼리 결과 카운트$x$, $x$중$x$, $x$[AI커스텀] 2026-2 SQL NOT IN 서브쿼리$x$),
(15, 3, $x$["필드 은닉","동적 바인딩","정적 바인딩","상속"]$x$, $x$["프로그래밍"]$x$, $x$필드는 정적·메서드는 동적 바인딩되는 상속$x$, $x$상$x$, $x$[AI커스텀] 2026-2 자바 상속 필드·메서드 바인딩$x$),
(16, 4, $x$["서브넷 분할","프리픽스 길이"]$x$, $x$["네트워크"]$x$, $x$네트워크를 균등 분할했을 때의 프리픽스 길이$x$, $x$중$x$, $x$[AI커스텀] 2026-2 서브넷 분할 프리픽스$x$),
(17, 5, $x$["해시","단방향성","충돌 최소화"]$x$, $x$["정보보안"]$x$, $x$고정 길이·단방향·충돌 최소화 해시 함수$x$, $x$하$x$, $x$[AI커스텀] 2026-2 보안 기술 해시$x$),
(18, 3, $x$["재귀","점화식","베이스 케이스"]$x$, $x$["프로그래밍"]$x$, $x$두 항을 참조하는 재귀 점화식 계산$x$, $x$중$x$, $x$[AI커스텀] 2026-2 C 재귀 점화식$x$),
(19, 2, $x$["CHECK","제약조건","도메인 제약"]$x$, $x$["데이터베이스","SQL"]$x$, $x$입력값 범위를 제한하는 CHECK 제약조건$x$, $x$하$x$, $x$[AI커스텀] 2026-2 SQL CHECK 제약조건$x$),
(20, 31, $x$["정규형","부분함수종속","1NF","2NF"]$x$, $x$["데이터베이스"]$x$, $x$부분함수종속으로 인한 정규형 판별$x$, $x$상$x$, $x$[AI커스텀] 2026-2 정규형 판별$x$)
) AS m(seq, category_id, ai_keywords, ai_domains, ai_summary, ai_difficulty, title)
JOIN exams e ON e.title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT question_no, category_id, question_type, (options IS NOT NULL) has_opt,
       ai_difficulty, left(title, 40) title
FROM question_bank
WHERE title LIKE '[AI커스텀] 2026-2%' AND del_yn = 'N'
ORDER BY category_id, question_no;
