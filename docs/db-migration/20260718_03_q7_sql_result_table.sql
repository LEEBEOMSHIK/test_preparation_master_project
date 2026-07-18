-- 목적: 2025년 1회 7번(SQL 조인 실행 결과) 문항을 SQL 결과표 유형으로 전환한다.
-- 배경: 이 문항이 SHORT_ANSWER로 등록돼 있어 시험 응시 시 SQL 실행 결과를 한 줄 텍스트로만
--       입력할 수 있었다. question_type=SQL + sql_data(tables + expectedResult)로 전환하면
--       퀴즈/시험 풀이 화면에서 컬럼×행 격자(SqlResultAnswerInput)로 입력하고,
--       채점은 AnswerGrader.isSqlResultTableCorrect(행 순서 무시 다중집합 비교)로 라우팅된다.
--       tables는 기존 문제 이미지를 구조화한 것으로, 이미지 대신 SqlProblemView가 렌더한다.
-- 대상: question_bank(원본) + questions(시험 스냅샷). 두 행 모두 고유 이미지 UUID로 매칭한다.
-- 재실행 안전: WHERE question_type='SHORT_ANSWER' 가드 — 전환 후 재실행 시 매칭 0건.
--            (참고: 다른 환경에서 콘텐츠 덤프 재적재로 id가 달라져도 이미지 UUID로 재현됨)

BEGIN;

-- 적용 전 확인
SELECT id, question_type FROM question_bank WHERE content LIKE '%b8fb4d3f-0c87-4dd0-b15e-ca54e7efeeec%';
SELECT id, question_type FROM questions      WHERE content LIKE '%b8fb4d3f-0c87-4dd0-b15e-ca54e7efeeec%';

UPDATE question_bank
SET question_type = 'SQL',
    content = '<p>SELECT name, incentive FROM emp, sal WHERE emp.id = sal.id and incentives &gt;= 500</p>',
    answer = E'name | incentives\n이순신 | 1000',
    sql_data = '{"tables":[{"name":"emp","columns":[{"name":"id","dataType":"INT","primaryKey":true},{"name":"name","dataType":"VARCHAR","primaryKey":false}],"rows":[["1001","김철수"],["1002","홍길동"],["1004","강감찬"],["1008","이순신"]]},{"name":"sal","columns":[{"name":"id","dataType":"INT","primaryKey":false},{"name":"incentives","dataType":"INT","primaryKey":false}],"rows":[["1002","300"],["1004","300"],["1008","1000"],["1009","500"]]}],"expectedResult":{"columns":["name","incentives"],"rows":[["이순신","1000"]],"orderedRows":false}}'::jsonb
WHERE question_type = 'SHORT_ANSWER'
  AND content LIKE '%b8fb4d3f-0c87-4dd0-b15e-ca54e7efeeec%';

UPDATE questions
SET question_type = 'SQL',
    content = '<p>SELECT name, incentive FROM emp, sal WHERE emp.id = sal.id and incentives &gt;= 500</p>',
    answer = E'name | incentives\n이순신 | 1000',
    sql_data = '{"tables":[{"name":"emp","columns":[{"name":"id","dataType":"INT","primaryKey":true},{"name":"name","dataType":"VARCHAR","primaryKey":false}],"rows":[["1001","김철수"],["1002","홍길동"],["1004","강감찬"],["1008","이순신"]]},{"name":"sal","columns":[{"name":"id","dataType":"INT","primaryKey":false},{"name":"incentives","dataType":"INT","primaryKey":false}],"rows":[["1002","300"],["1004","300"],["1008","1000"],["1009","500"]]}],"expectedResult":{"columns":["name","incentives"],"rows":[["이순신","1000"]],"orderedRows":false}}'::jsonb
WHERE question_type = 'SHORT_ANSWER'
  AND content LIKE '%b8fb4d3f-0c87-4dd0-b15e-ca54e7efeeec%';

-- 적용 후 검증
SELECT id, question_type, sql_data->'expectedResult' AS expected, answer FROM question_bank WHERE content LIKE '%incentives &gt;= 500%';
SELECT id, question_type, sql_data->'expectedResult' AS expected, answer FROM questions      WHERE content LIKE '%incentives &gt;= 500%';

COMMIT;

-- ROLLBACK (필요 시 별도 트랜잭션으로 실행 — 원 상태 복원은 콘텐츠 덤프 재적재 권장)
