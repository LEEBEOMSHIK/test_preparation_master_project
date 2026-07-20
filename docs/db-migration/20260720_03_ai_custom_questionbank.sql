-- 목적: AI 커스텀 시험(2026-1·2025-3) 40문항을 문제은행(question_bank)에도 AI 커스텀으로 등록한다.
-- 배경: 문항 관리 화면(/admin/questions)은 question_bank를 조회하는데, 앞서 AI 커스텀 문항을
--       시험(exams+questions)에만 넣어 문항 관리에 뜨지 않았다. 동일 내용을 question_bank에도
--       AI 커스텀(exam_year·exam_round = NULL)으로 등록하고 ai_keywords/domains/summary/difficulty를
--       채워 문항 관리 노출 + 데일리 퀴즈 도메인 분석에 반영한다.
-- 방식: 이미 만든 exam questions(exam_id 매칭)에서 content·code·answer·options 등을 그대로 복사하고,
--       (seq→category_id·키워드·도메인·요약·난이도·title) 매핑만 새로 부여한다.
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
      + ROW_NUMBER() OVER (PARTITION BY m.category_id ORDER BY m.exam_title, m.seq),
    m.ai_keywords::jsonb, m.ai_domains::jsonb, m.ai_summary, m.ai_difficulty,
    NULL, NULL, m.title
FROM (VALUES
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 1, 3, $x$["배열","포인터 매개변수","형변환","최댓값 최솟값"]$x$, $x$["프로그래밍"]$x$, $x$배열 인덱스·포인터 접근과 double 형변환으로 최대·최소의 평균 계산$x$, $x$중$x$, $x$[AI커스텀] 2026-1 배열 최대·최소 평균(포인터)$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 2, 30, $x$["디자인 패턴","Adapter","Strategy","GoF"]$x$, $x$["소프트웨어공학"]$x$, $x$설명으로 디자인 패턴(Adapter·Strategy)을 식별$x$, $x$하$x$, $x$[AI커스텀] 2026-1 디자인 패턴 식별$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 3, 31, $x$["DB 설계 절차","개념적 설계","논리적 설계","물리적 설계"]$x$, $x$["데이터베이스"]$x$, $x$데이터베이스 설계 단계 순서$x$, $x$하$x$, $x$[AI커스텀] 2026-1 DB 설계 절차$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 4, 30, $x$["비기능 요구사항","가용성","이식성","보안"]$x$, $x$["소프트웨어공학"]$x$, $x$비기능 요구사항 유형 분류$x$, $x$하$x$, $x$[AI커스텀] 2026-1 비기능 요구사항 유형$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 5, 5, $x$["보안 약어","SIEM","보안 관제"]$x$, $x$["정보보안"]$x$, $x$통합 보안 관제 시스템의 약자 SIEM$x$, $x$하$x$, $x$[AI커스텀] 2026-1 보안 약어 SIEM$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 6, 4, $x$["HDLC","프레임 유형","통신 모드","데이터링크"]$x$, $x$["네트워크"]$x$, $x$HDLC 프레임 유형과 통신 모드 용어$x$, $x$중$x$, $x$[AI커스텀] 2026-1 HDLC 프레임·모드$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 7, 3, $x$["다형성","오버라이딩","동적 바인딩","업캐스팅"]$x$, $x$["프로그래밍"]$x$, $x$동적 디스패치로 오버라이딩된 메서드 실행$x$, $x$중$x$, $x$[AI커스텀] 2026-1 자바 다형성$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 8, 3, $x$["문자열 슬라이싱","대소문자","역순","enumerate"]$x$, $x$["프로그래밍"]$x$, $x$인덱스별 대소문자 변환 후 역순 출력$x$, $x$중$x$, $x$[AI커스텀] 2026-1 파이썬 문자열 처리$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 9, 2, $x$["집계","DISTINCT","COUNT","행 수"]$x$, $x$["데이터베이스","SQL"]$x$, $x$SQL 집계 함수와 조회 행 수 계산$x$, $x$중$x$, $x$[AI커스텀] 2026-1 SQL 행 수$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 10, 2, $x$["DDL","외래키","CONSTRAINT","REFERENCES"]$x$, $x$["데이터베이스","SQL"]$x$, $x$외래키 제약 DDL 예약어$x$, $x$중$x$, $x$[AI커스텀] 2026-1 외래키 DDL$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 11, 4, $x$["서브네팅","CIDR","서브넷 마스크","네트워크 주소"]$x$, $x$["네트워크"]$x$, $x$CIDR 네트워크 주소 계산$x$, $x$상$x$, $x$[AI커스텀] 2026-1 CIDR 서브네팅$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 12, 3, $x$["함수 포인터","구조체","포인터"]$x$, $x$["프로그래밍"]$x$, $x$구조체 배열의 함수 포인터 호출$x$, $x$중$x$, $x$[AI커스텀] 2026-1 C 함수 포인터$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 13, 3, $x$["슬라이싱","range","반복 출력"]$x$, $x$["프로그래밍"]$x$, $x$리스트 슬라이싱 역순 출력$x$, $x$중$x$, $x$[AI커스텀] 2026-1 파이썬 슬라이싱$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 14, 3, $x$["얕은 복사","참조 공유","리스트"]$x$, $x$["프로그래밍"]$x$, $x$리스트 참조 공유(얕은 복사) 함정$x$, $x$상$x$, $x$[AI커스텀] 2026-1 파이썬 참조 공유$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 15, 5, $x$["심볼릭 링크 공격","경쟁 조건","임시 파일"]$x$, $x$["정보보안"]$x$, $x$링크 바꿔치기·경쟁 조건 심볼릭 링크 공격$x$, $x$중$x$, $x$[AI커스텀] 2026-1 심볼릭 링크 공격$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 16, 5, $x$["워터링 홀","표적 공격","악성코드"]$x$, $x$["정보보안"]$x$, $x$표적 사이트를 미끼로 삼는 워터링 홀 공격$x$, $x$중$x$, $x$[AI커스텀] 2026-1 워터링 홀 공격$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 17, 3, $x$["문자열 연결","연산 순서","int String"]$x$, $x$["프로그래밍"]$x$, $x$정수 연산과 문자열 연결 순서$x$, $x$중$x$, $x$[AI커스텀] 2026-1 자바 문자열 연결$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 18, 2, $x$["JOIN","서브쿼리","AVG","집계"]$x$, $x$["데이터베이스","SQL"]$x$, $x$조인과 서브쿼리로 조회 행 수$x$, $x$상$x$, $x$[AI커스텀] 2026-1 SQL 조인·서브쿼리$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 19, 30, $x$["통합 테스트","스텁","드라이버","하향식 상향식"]$x$, $x$["소프트웨어공학"]$x$, $x$통합 테스트의 스텁·드라이버$x$, $x$하$x$, $x$[AI커스텀] 2026-1 스텁·드라이버$x$),
($x$2026년 1회 정보처리기사 실기 (AI 커스텀)$x$, 20, 30, $x$["응집도","기능 응집도","시간 응집도","논리 응집도"]$x$, $x$["소프트웨어공학"]$x$, $x$응집도 유형 구분$x$, $x$중$x$, $x$[AI커스텀] 2026-1 응집도 유형$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 1, 30, $x$["UML","컴포넌트 다이어그램","구조 다이어그램"]$x$, $x$["소프트웨어공학"]$x$, $x$UML 컴포넌트 다이어그램 식별$x$, $x$중$x$, $x$[AI커스텀] 2025-3 UML 컴포넌트 다이어그램$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 2, 30, $x$["테스트 커버리지","분기 커버리지","화이트박스"]$x$, $x$["소프트웨어공학"]$x$, $x$화이트박스 분기(결정) 커버리지$x$, $x$중$x$, $x$[AI커스텀] 2025-3 분기 커버리지$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 3, 1, $x$["유닉스 명령어","chmod","ps","cat","rm"]$x$, $x$["운영체제"]$x$, $x$유닉스/리눅스 기본 명령어$x$, $x$하$x$, $x$[AI커스텀] 2025-3 유닉스 명령어$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 4, 4, $x$["오류 검출","해밍코드","CRC","패리티","FEC","BEC"]$x$, $x$["네트워크"]$x$, $x$오류 검출·정정 방식$x$, $x$중$x$, $x$[AI커스텀] 2025-3 오류 검출·정정$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 5, 3, $x$["구조체","포인터","문자열"]$x$, $x$["프로그래밍"]$x$, $x$구조체 멤버와 포인터 문자열 접근$x$, $x$중$x$, $x$[AI커스텀] 2025-3 C 구조체 포인터$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 6, 3, $x$["문자열 길이","인덱싱","역순"]$x$, $x$["프로그래밍"]$x$, $x$문자열 길이와 역순 인덱싱$x$, $x$중$x$, $x$[AI커스텀] 2025-3 C 문자열 인덱싱$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 7, 3, $x$["연결 리스트","포인터 순회","비트 연산"]$x$, $x$["프로그래밍"]$x$, $x$연결 리스트 순회와 비트 연산$x$, $x$상$x$, $x$[AI커스텀] 2025-3 C 연결 리스트·비트$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 8, 3, $x$["인터페이스","implements","자바"]$x$, $x$["프로그래밍"]$x$, $x$인터페이스 구현 키워드 implements$x$, $x$하$x$, $x$[AI커스텀] 2025-3 자바 인터페이스$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 9, 3, $x$["딕셔너리","enumerate","리스트 컴프리헨션"]$x$, $x$["프로그래밍"]$x$, $x$enumerate로 딕셔너리 구성$x$, $x$중$x$, $x$[AI커스텀] 2025-3 파이썬 딕셔너리$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 10, 2, $x$["NULL","COUNT","행 수","IS NOT NULL"]$x$, $x$["데이터베이스","SQL"]$x$, $x$IS NOT NULL 조건의 행 수$x$, $x$하$x$, $x$[AI커스텀] 2025-3 SQL NULL 행 수$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 11, 5, $x$["OTP","일회용 비밀번호","인증"]$x$, $x$["정보보안"]$x$, $x$일회용 비밀번호 OTP$x$, $x$하$x$, $x$[AI커스텀] 2025-3 OTP$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 12, 3, $x$["상속","super","메서드"]$x$, $x$["프로그래밍"]$x$, $x$상속과 super 생성자 호출$x$, $x$중$x$, $x$[AI커스텀] 2025-3 자바 상속$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 13, 5, $x$["OAuth","인가","접근 위임","Access Token"]$x$, $x$["정보보안"]$x$, $x$OAuth 개방형 인가 표준$x$, $x$중$x$, $x$[AI커스텀] 2025-3 OAuth$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 14, 31, $x$["관계 대수","나눗셈","division"]$x$, $x$["데이터베이스"]$x$, $x$관계 대수의 나눗셈(÷)$x$, $x$상$x$, $x$[AI커스텀] 2025-3 관계 대수 나눗셈$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 15, 3, $x$["삼항 연산","비트 연산","단락 평가"]$x$, $x$["프로그래밍"]$x$, $x$삼항·비트 연산과 단락 평가$x$, $x$상$x$, $x$[AI커스텀] 2025-3 C 삼항·비트$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 16, 31, $x$["관계형 DB 용어","속성","차수","스키마"]$x$, $x$["데이터베이스"]$x$, $x$관계형 DB 용어(속성·차수·스키마)$x$, $x$중$x$, $x$[AI커스텀] 2025-3 관계형 DB 용어$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 17, 3, $x$["enum","ordinal","values"]$x$, $x$["프로그래밍"]$x$, $x$enum의 ordinal과 values$x$, $x$중$x$, $x$[AI커스텀] 2025-3 자바 enum$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 18, 5, $x$["접근통제","MAC","RBAC","DAC"]$x$, $x$["정보보안"]$x$, $x$접근통제 모델(MAC·RBAC·DAC)$x$, $x$중$x$, $x$[AI커스텀] 2025-3 접근통제 모델$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 19, 30, $x$["테스트 케이스","구성 요소","예상 결과"]$x$, $x$["소프트웨어공학"]$x$, $x$테스트 케이스 구성 요소$x$, $x$하$x$, $x$[AI커스텀] 2025-3 테스트 케이스 구성$x$),
($x$2025년 3회 정보처리기사 실기 (AI 커스텀)$x$, 20, 2, $x$["COUNT","NULL","WHERE","집계"]$x$, $x$["데이터베이스","SQL"]$x$, $x$COUNT와 NULL, 조건 결합$x$, $x$중$x$, $x$[AI커스텀] 2025-3 SQL COUNT$x$)
) AS m(exam_title, seq, category_id, ai_keywords, ai_domains, ai_summary, ai_difficulty, title)
JOIN exams e ON e.title = m.exam_title AND e.del_yn = 'N'
JOIN questions q ON q.exam_id = e.id AND q.seq = m.seq
WHERE NOT EXISTS (SELECT 1 FROM question_bank qb2 WHERE qb2.title = m.title);

COMMIT;

-- 검증
SELECT category_id, count(*) FROM question_bank
WHERE title LIKE '[AI커스텀]%' AND exam_year IS NULL AND exam_round IS NULL AND del_yn='N'
GROUP BY category_id ORDER BY category_id;
