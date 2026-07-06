-- question_bank CPU 스케줄링 구조화 문항 데이터 컬럼 추가 (local/dev/prod 적용, prod는 기동 전 필수)
-- 목적: SCHEDULING 유형 문항(관리자 등록 + 퀴즈 표시)의 알고리즘/타임퀀텀/프로세스 목록을
--       구조화 JSON으로 저장. 자동 채점은 하지 않으며(정답은 answer 컬럼에 수동 입력),
--       퀴즈 화면에는 이 컬럼을 표로 렌더링만 한다.
-- 롤백: ALTER TABLE question_bank DROP COLUMN scheduling_data;
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS scheduling_data JSONB;
