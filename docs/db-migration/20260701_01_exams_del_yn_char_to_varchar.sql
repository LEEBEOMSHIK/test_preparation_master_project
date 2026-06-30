-- ============================================================
-- 파일명  : 20260701_01_exams_del_yn_char_to_varchar.sql
-- 목적    : exams.del_yn 컬럼 타입을 CHAR(1) → VARCHAR(1) 로 통일
-- 사유    : Exam 엔티티의 @Column(columnDefinition = "char(1) not null default 'N'") 제거에 맞춰
--           DB 실제 타입을 Hibernate 기대값(VARCHAR)과 일치시킴.
--           prod 프로파일 ddl-auto=validate 기동 실패 해결.
-- 적용 대상: 운영(prod) · 스테이징 DB — 1회 수동 실행.
--           로컬 개발 DB는 ddl-auto=update 이므로 별도 적용 필요.
-- 작성일  : 2026-07-01
-- ============================================================

-- 1) 컬럼 타입 변경 (PostgreSQL: ALTER COLUMN … TYPE)
ALTER TABLE exams ALTER COLUMN del_yn TYPE varchar(1);

-- 2) 기본값 재설정 (타입 변경 후에도 DEFAULT 유지 확인)
ALTER TABLE exams ALTER COLUMN del_yn SET DEFAULT 'N';

-- 3) NOT NULL 재설정 (안전 확인용 — 기존 제약이 살아있으면 오류 없이 통과)
ALTER TABLE exams ALTER COLUMN del_yn SET NOT NULL;

-- 적용 확인 쿼리
-- SELECT data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'exams' AND column_name = 'del_yn';
-- 기대 결과: data_type = character varying, column_default = 'N'::character varying, is_nullable = NO

-- ============================================================
-- 롤백 (필요 시 역방향 실행)
-- ALTER TABLE exams ALTER COLUMN del_yn TYPE char(1) USING del_yn::char(1);
-- ALTER TABLE exams ALTER COLUMN del_yn SET DEFAULT 'N';
-- ALTER TABLE exams ALTER COLUMN del_yn SET NOT NULL;
-- ============================================================
