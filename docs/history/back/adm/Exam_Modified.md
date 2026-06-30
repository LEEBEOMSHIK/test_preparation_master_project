## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / 시험지 엔티티 (Exam)
- **수정 개요**: exams.del_yn CHAR(1) → VARCHAR(1) 통일 — prod ddl-auto=validate 기동 실패 대응

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Exam.java` | 수정 | del_yn @Column에서 columnDefinition 제거 |
| `docs/db-migration/20260701_01_exams_del_yn_char_to_varchar.sql` | 추가 | exams.del_yn CHAR→VARCHAR ALTER SQL (신규 파일) |
| `docs/db-guidelines.md` | 수정 | §10 수동 마이그레이션 절 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/Exam.java`
- 변경 전:
  ```java
  @Column(name = "del_yn", nullable = false, length = 1, columnDefinition = "char(1) not null default 'N'")
  private String delYn = "N";
  ```
- 변경 후:
  ```java
  @Column(name = "del_yn", nullable = false, length = 1)
  private String delYn = "N";
  ```
- 이유: `columnDefinition = "char(1)..."` 때문에 DB에 CHAR 타입으로 생성됨. Hibernate는 `String` 필드를 VARCHAR로 기대하므로 prod 프로파일의 `ddl-auto=validate` 시 스키마 불일치 오류 발생. columnDefinition 제거로 BaseEntity 표준(`length=1` → VARCHAR(1))과 동일하게 통일.

#### `docs/db-migration/20260701_01_exams_del_yn_char_to_varchar.sql`
- 변경 전: 파일 없음 (`docs/db-migration/` 디렉토리도 신규)
- 변경 후: ALTER TABLE exams ALTER COLUMN del_yn TYPE varchar(1) + DEFAULT 'N' + NOT NULL 재확인 포함. 적용 확인 쿼리 및 롤백 SQL 주석 포함.
- 이유: 운영·스테이징 DB에는 Hibernate DDL이 자동 적용되지 않으므로 수동 SQL 파일로 관리.

#### `docs/db-guidelines.md`
- 변경 전: §9로 끝남
- 변경 후: §10 수동 마이그레이션 절 추가 — `docs/db-migration/{YYYYMMDD}_{순번}_{설명}.sql` 네이밍 규칙 및 환경별 수동 적용 원칙 명시.
- 이유: Flyway 미사용 프로젝트이므로 마이그레이션 관리 규칙을 가이드라인에 명시.

### 복원 방법
이 ID(HIST-20260701-001)만으로 복원 시:
1. `Exam.java` 41번 줄 `@Column`에 `columnDefinition = "char(1) not null default 'N'"` 속성을 재추가한다.
2. `docs/db-migration/20260701_01_exams_del_yn_char_to_varchar.sql` 파일을 삭제한다.
3. `docs/db-guidelines.md` 끝의 `---\n\n## 10. 수동 마이그레이션` 절을 제거한다.
4. DB 롤백이 필요하다면 SQL 파일 내 롤백 절을 실행한다.
