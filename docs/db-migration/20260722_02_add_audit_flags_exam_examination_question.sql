-- ============================================================
-- 파일명  : 20260722_02_add_audit_flags_exam_examination_question.sql
-- 목적    : exams/examinations/questions에 del_yn·use_yn 소프트 삭제·비활성화 플래그 추가
-- 적용 대상: 로컬 tpmp-db 우선 적용, 스테이징/운영은 수동 적용 필요
-- 타입 주의: del_yn/use_yn은 VARCHAR(1)로 생성한다(CHAR(1) 아님).
--           Exam.delYn 필드는 @Column(columnDefinition 없음, length=1)이며
--           Hibernate는 columnDefinition이 없는 String 필드를 VARCHAR로 매핑한다.
--           과거 exams.del_yn을 CHAR(1)로 만들었다가 prod ddl-auto=validate 기동 실패로
--           VARCHAR(1)로 되돌린 전례가 있다(20260701_01 마이그레이션 참고).
--           신규 컬럼도 동일하게 VARCHAR(1)로 맞춰 같은 문제를 반복하지 않는다.
-- 롤백    : examinations는 del_yn·use_yn 둘 다, exams/questions는 신규 컬럼만 DROP COLUMN
-- 작성일  : 2026-07-22
-- ============================================================

ALTER TABLE exams
    ADD COLUMN use_yn VARCHAR(1) NOT NULL DEFAULT 'Y';

COMMENT ON COLUMN exams.use_yn IS '사용 여부 (Y: 사용중, N: 비사용)';

ALTER TABLE examinations
    ADD COLUMN del_yn VARCHAR(1) NOT NULL DEFAULT 'N',
    ADD COLUMN use_yn VARCHAR(1) NOT NULL DEFAULT 'Y';

COMMENT ON COLUMN examinations.del_yn IS '삭제 여부 (Y: 삭제됨, N: 정상)';
COMMENT ON COLUMN examinations.use_yn IS '사용 여부 (Y: 사용중, N: 비사용)';

ALTER TABLE questions
    ADD COLUMN del_yn VARCHAR(1) NOT NULL DEFAULT 'N',
    ADD COLUMN use_yn VARCHAR(1) NOT NULL DEFAULT 'Y';

COMMENT ON COLUMN questions.del_yn IS '삭제 여부 (Y: 삭제됨, N: 정상) — 원본 question_bank와 독립 관리(자동 전파 없음)';
COMMENT ON COLUMN questions.use_yn IS '사용 여부 (Y: 사용중, N: 비사용) — 원본 question_bank와 독립 관리(자동 전파 없음)';

-- 적용 확인 쿼리
-- SELECT table_name, column_name, data_type, character_maximum_length, column_default
--   FROM information_schema.columns
--  WHERE table_name IN ('exams','examinations','questions') AND column_name IN ('del_yn','use_yn')
--  ORDER BY table_name, column_name;
-- 기대 결과: data_type = character varying, character_maximum_length = 1

-- ============================================================
-- 롤백 (필요 시 역방향 실행)
-- ALTER TABLE exams ALTER COLUMN use_yn DROP DEFAULT;  -- 참고용, 실제로는 아래 DROP COLUMN 사용
-- ALTER TABLE exams DROP COLUMN use_yn;
-- ALTER TABLE examinations DROP COLUMN del_yn;
-- ALTER TABLE examinations DROP COLUMN use_yn;
-- ALTER TABLE questions DROP COLUMN del_yn;
-- ALTER TABLE questions DROP COLUMN use_yn;
-- ============================================================
