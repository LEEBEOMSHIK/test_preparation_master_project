-- question_bank 발문(지시문) 컬럼 추가 (local/dev/prod 적용)
-- 목적: "다음 설명을 보고 알맞은 용어를 작성하시오." 같은 지시문(발문)을
--       문항 내용(content, 문제 본문)과 분리 저장한다. 모든 문항 유형 공용(선택) 필드이며
--       enum/CHECK 제약과 무관한 plain TEXT 컬럼이다(스케줄링 데이터와 달리 구조화·제약 없음).
-- 적용: dev/local은 Hibernate ddl-auto=update로 자동 반영되나, prod는 ddl-auto=validate이므로
--       기동 전 이 스크립트를 수동 적용해야 한다.
-- 롤백: ALTER TABLE question_bank DROP COLUMN instruction;
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS instruction TEXT;
