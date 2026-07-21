-- 목적: AI 커스텀 시험(2025-2) 20문항을 문제은행(question_bank)에도 AI 커스텀으로 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회하므로, 시험(exams+questions)에만
--       넣으면 문항 관리에 노출되지 않는다. 앞선 20260720_03(2026-1·2025-3)과 동일한 방식으로
--       2025-2 20문항도 exam_year·exam_round = NULL의 AI 커스텀으로 등록한다.
-- 방식: 이미 만든 exam questions(exam_id 매칭)에서 content·code·answer·options·scheduling_data 등을
--       그대로 복사하고, (seq→category_id·키워드·도메인·요약·난이도·title) 매핑만 새로 부여한다.
-- 문항번호: AI 커스텀은 카테고리별로 매김 — 기존 카테고리 최대 question_no + 카테고리 내 순번.
-- 재실행 안전: 동일 title이 이미 있으면 재삽입하지 않는다. id·audit는 표준값.

BEGIN;

INSERT INTO question_bank (
    create_dt, create_uno, modified_dt, modified_uno, del_yn, use_yn,
    content, question_type, disable_alternative_answer,
    code, language, instruction, answer, options, explanation, scheduling_data,
    category_id, question_no, ai_keywords, ai_domains, ai_summary, ai_difficulty,
    exam_year, exam_round, title
)
SELECT
    now(), 1, now(), 1, 'N', 'Y',
    q.content, q.question_type, q.disable_alternative_answer,
    q.code, q.language, q.instruction, q.answer, q.options, q.explanation, q.scheduling_data,
    m.category_id,
    (SELECT COALESCE(MAX(qb.question_no), 0) FROM question_bank qb
       WHERE qb.category_id = m.category_id AND qb.exam_year IS NULL AND qb.exam_round IS NULL AND qb.del_yn = 'N')
      + ROW_NUMBER() OVER (PARTITION BY m.category_id ORDER BY m.seq),
    m.ai_keywords::jsonb, m.ai_domains::jsonb, m.ai_summary, m.ai_difficulty,
    NULL, NULL, m.title
FROM (VALUES
(1, 1, $x$["파일 접근","해싱","충돌","오버플로"]$x$, $x$["운영체제"]$x$, $x$키 값에 함수를 적용해 물리 주소를 계산하는 해싱 접근$x$, $x$하$x$, $x$[AI커스텀] 2025-2 파일 접근 방식(해싱)$x$),
(2, 31, $x$["차수","Degree","카디널리티","릴레이션"]$x$, $x$["데이터베이스"]$x$, $x$릴레이션 속성(열) 개수를 뜻하는 차수(Degree)$x$, $x$하$x$, $x$[AI커스텀] 2025-2 릴레이션 차수$x$),
(3, 5, $x$["TLS","SSL","HTTPS","인증서"]$x$, $x$["정보보안"]$x$, $x$인증서 기반 서버 인증과 대칭키 암호화를 제공하는 TLS$x$, $x$하$x$, $x$[AI커스텀] 2025-2 전송 보안 프로토콜 TLS$x$),
(4, 1, $x$["HRN","RR","스케줄링","기아 현상"]$x$, $x$["운영체제"]$x$, $x$우선순위 공식 HRN과 타임 퀀텀 순환 RR 식별$x$, $x$중$x$, $x$[AI커스텀] 2025-2 스케줄링 알고리즘(HRN·RR)$x$),
(5, 3, $x$["참조 전달","값 전달","배열","문자열 결합"]$x$, $x$["프로그래밍"]$x$, $x$배열은 참조·기본형은 값 전달, 문자열 결합 출력$x$, $x$중$x$, $x$[AI커스텀] 2025-2 자바 참조/값 전달$x$),
(6, 4, $x$["서브네팅","서브넷 마스크","네트워크 주소","호스트 수"]$x$, $x$["네트워크"]$x$, $x$/27 서브넷의 네트워크 주소와 사용 가능 호스트 수$x$, $x$중$x$, $x$[AI커스텀] 2025-2 서브넷 계산$x$),
(7, 30, $x$["디자인 패턴","Observer","발행-구독","행위 패턴"]$x$, $x$["소프트웨어공학"]$x$, $x$상태 변경을 의존 객체에 자동 통보하는 Observer 패턴$x$, $x$하$x$, $x$[AI커스텀] 2025-2 디자인 패턴(Observer)$x$),
(8, 30, $x$["REST","URI","HTTP 메서드","무상태성"]$x$, $x$["소프트웨어공학"]$x$, $x$자원을 URI로 식별하고 HTTP 메서드로 행위를 표현하는 REST$x$, $x$하$x$, $x$[AI커스텀] 2025-2 웹 아키텍처 REST$x$),
(9, 3, $x$["람다식","함수형 인터페이스","예외 처리","정수 나눗셈"]$x$, $x$["프로그래밍"]$x$, $x$람다 예외 처리와 정수 나눗셈 결과 합산$x$, $x$중$x$, $x$[AI커스텀] 2025-2 자바 람다·예외$x$),
(10, 3, $x$["동적 바인딩","정적 바인딩","오버라이딩","상속"]$x$, $x$["프로그래밍"]$x$, $x$인스턴스 메서드는 동적·static은 정적 바인딩$x$, $x$상$x$, $x$[AI커스텀] 2025-2 자바 정적/동적 바인딩$x$),
(11, 30, $x$["분기 커버리지","제어 흐름 그래프","테스트 경로","화이트박스"]$x$, $x$["소프트웨어공학"]$x$, $x$분기 커버리지를 만족하는 최소 테스트 경로 도출$x$, $x$상$x$, $x$[AI커스텀] 2025-2 분기 커버리지 경로$x$),
(12, 3, $x$["원형 큐","모듈러 연산","구조체","포인터"]$x$, $x$["프로그래밍"]$x$, $x$원형 큐의 head/tail 순환과 덮어쓰기 추적$x$, $x$상$x$, $x$[AI커스텀] 2025-2 C 원형 큐$x$),
(13, 1, $x$["라운드로빈","타임 퀀텀","평균 대기시간","선점형"]$x$, $x$["운영체제"]$x$, $x$RR(퀀텀 3) 스케줄링의 평균 대기시간 계산$x$, $x$상$x$, $x$[AI커스텀] 2025-2 라운드로빈 평균 대기시간$x$),
(14, 3, $x$["이중 포인터","구조체 배열","포인터 증가","구조체 대입"]$x$, $x$["프로그래밍"]$x$, $x$이중 포인터를 통한 구조체 복사와 포인터 이동$x$, $x$상$x$, $x$[AI커스텀] 2025-2 C 이중 포인터$x$),
(15, 3, $x$["객체 참조","배열 스왑","참조 변수","가변 객체"]$x$, $x$["프로그래밍"]$x$, $x$배열 원소 교환이 원본 참조 변수에 미치는 영향$x$, $x$상$x$, $x$[AI커스텀] 2025-2 자바 객체 참조 스왑$x$),
(16, 3, $x$["연결 리스트","포인터 재연결","순회"]$x$, $x$["프로그래밍"]$x$, $x$링크 덮어쓰기 후 최종 연결 순서 추적$x$, $x$중$x$, $x$[AI커스텀] 2025-2 C 링크드 리스트 재연결$x$),
(17, 3, $x$["딕셔너리","집합","교집합","컴프리헨션"]$x$, $x$["프로그래밍"]$x$, $x$딕셔너리 갱신 후 값 집합의 교집합 크기$x$, $x$중$x$, $x$[AI커스텀] 2025-2 파이썬 딕셔너리·집합$x$),
(18, 3, $x$["연결 리스트","tail 삽입","동적 할당","조건부 출력"]$x$, $x$["프로그래밍"]$x$, $x$tail 삽입 리스트에서 마지막 노드를 제외한 출력$x$, $x$중$x$, $x$[AI커스텀] 2025-2 C 링크드 리스트 출력$x$),
(19, 5, $x$["Smurf","ICMP","브로드캐스트","증폭 공격"]$x$, $x$["정보보안"]$x$, $x$출발지 위조 ICMP 브로드캐스트 증폭 DoS(Smurf)$x$, $x$중$x$, $x$[AI커스텀] 2025-2 Smurf 공격$x$),
(20, 31, $x$["투영","Projection","관계 대수","중복 제거"]$x$, $x$["데이터베이스"]$x$, $x$투영 연산의 속성 선택과 중복 제거 결과$x$, $x$중$x$, $x$[AI커스텀] 2025-2 관계 대수 투영$x$)
) AS m(seq, category_id, ai_keywords, ai_domains, ai_summary, ai_difficulty, title)
JOIN exams e ON e.title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT question_no, category_id, question_type, (options IS NOT NULL) has_opt,
       ai_difficulty, left(title, 40) title
FROM question_bank
WHERE title LIKE '[AI커스텀] 2025-2%' AND del_yn = 'N'
ORDER BY category_id, question_no;
