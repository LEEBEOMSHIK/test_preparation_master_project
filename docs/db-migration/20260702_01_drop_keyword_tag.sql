-- keyword_tag(전역 태그 사전) 기능 제거에 따른 테이블 삭제
-- 적용: local/dev/prod. 롤백: 엔티티 복원 후 ddl update 또는 CREATE TABLE 재생성.
DROP TABLE IF EXISTS keyword_tag;
