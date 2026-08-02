## HIST-20260803-001

- **날짜**: 2026-08-03
- **수정 범위**: 관리자 백엔드 / 시험 관리 (Exam/Examination/Question) — 데이터 신규 생성
- **수정 개요**: `question_bank`에 리눅스마스터 1급(2023년 1회, 100문항)·2급(2023년 1회, 80문항)·SQLD(2026년 제60회, 50문항) 기출문제가 이미 적재돼 있었으나, 이를 패키징한 `examinations`가 한 건도 없어 "정보처리기사 실기" 카테고리 외에는 응시할 수 있는 시험이 없었다(사용자 리포트: "리눅스/SQLD 문항들이 있을텐데 해당 문항들에 대한 시험이 없다"). `question_bank` → `exams`/`examinations`/`questions`로 복제하는 SQL 마이그레이션을 작성·적용해 3개 시험을 신규 생성했다. 회차 정보(`exam_year`/`exam_round`)가 없는 문항 7건(리눅스마스터 1급 5건, SQLD 2건 — 정식 회차 문항이 아닌 개별 등록 문항으로 판단)은 이번 시험 구성에서 제외했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260802_01_create_linux_sqld_exams.sql` | 신규 | `question_bank`(exam_type_id=9/34/6, 지정 exam_year·exam_round)를 조회해 `exams`+`examinations`+`questions`를 생성하는 재실행 안전 스크립트(examinations.title 존재 여부로 가드) |
| `docs/sql/tpmp_content_data.sql` | 수정 | 신규 생성된 exams(id 16~18)·examinations(id 24~26)·questions(id 301~530, 230건)를 각 섹션 끝에 추가(기존 12/12/240건 행은 변경 없음) |
| `docs/sql/README.md` | 수정 | 델타 목록에 #35 추가, 상단 "마지막 갱신" 갱신 |

### 수정 상세

- **리눅스마스터 1급** — `exams`(id=16, title="2023년 1회 리눅스마스터 1급") → `examinations`(id=24, category_id=9, time_limit=100분 — 실제 KAIT 공식 필기시험 시간, `exam_info` id=4~7 설명 참고) → `questions` 100건(전부 MULTIPLE_CHOICE).
- **리눅스마스터 2급** — `exams`(id=17) → `examinations`(id=25, category_id=34, time_limit=90분) → `questions` 80건.
- **SQLD** — `exams`(id=18, title="2026년 제60회 SQLD") → `examinations`(id=26, category_id=6, exam_year=2026, exam_round=60, time_limit=90분) → `questions` 50건.
- `questions`는 `question_bank`의 `content`/`options`/`answer`/`explanation`/`code`/`instruction`/`scheduling_data`/`sql_data`/`category_id`를 그대로 복제하고 `source_question_bank_id`로 원본을 연결, `seq`는 `question_no` 순서로 부여.
- **부수 발견**: `tpmp_content_data.sql` 갱신 과정에서 `grep`으로 멀티라인 INSERT 문(문항 content/code에 실제 개행이 포함된 경우)을 라인 단위로 추출하면 문장이 중간에 잘리는 문제를 발견 — Python 정규식(`^INSERT INTO public\.\w+ \(` lookahead)으로 문장 단위 재추출 후 완전성(재분할 시 문장 수 일치, 모든 문장이 `NOTHING;`으로 종료) 검증하는 방식으로 대체했다. 또한 문항 콘텐츠 자체에 예시로 포함된 `INSERT INTO T(VAL) ...` 같은 리터럴 텍스트가 느슨한 정규식(`^INSERT INTO `)과 오매칭되는 것도 확인해 `public\.\w+ \(`까지 포함한 엄격한 패턴으로 교정했다.

### 검증

- 마이그레이션 재실행(멱등성): 2차 실행 시 "이미 존재 — 건너뜀" 확인.
- API 검증: `POST /api/auth/login` → `GET /api/admin/exams/{16,17,18}/questions`로 문항 100/80/50건, content/questionType 정상 확인.
- **임시 검증 DB 3회 생성/삭제**(`tpmp_verify_test`~`test3`, 원본 `tpmp` DB에는 영향 없음) — 베이스라인 → 시드 계정 최소 삽입 → 전체 콘텐츠 덤프 로드 e2e를 처음부터 재현해 ERROR 0건, 최종 건수(exams 15/examinations 15/questions 470/question_bank 636/domain_slave 33) 실제 로컬 DB와 완전 일치 확인.

### 복원 방법

`examinations.title IN ('2023년 1회 리눅스마스터 1급','2023년 1회 리눅스마스터 2급','2026년 제60회 SQLD')`로 조회한 `examinations`·연결된 `exam_paper_id`(`exams`)·해당 `exam_id`의 `questions`를 삭제하고, `tpmp_content_data.sql`의 추가된 3섹션 끝부분(exams id 16~18/examinations id 24~26/questions id 301~530)을 제거.

---

## HIST-20260722-002

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 백엔드 / 시험 관리 (Examination) — del_yn/use_yn 기능 부팅 실패 긴급 수정
- **수정 개요**: HIST-20260722-001에서 `ExaminationRepository.findByIdAndDelYn(Long id, String delYn)`을 추가하며 메서드 시그니처에는 `delYn` 파라미터를 선언했지만 `@Query`의 JPQL 문자열 안에서는 `:delYn` 바인딩을 쓰지 않고 `AND e.delYn = 'N'` 리터럴을 그대로 남겨두는 실수가 있었다. Spring Data JPA는 "선언된 파라미터가 쿼리에서 사용되지 않음"을 부팅 시점에 `IllegalStateException`으로 검증하므로 `bootRun`/`test` 전체가 기동조차 되지 않는 상태였다. `AND e.delYn = :delYn`으로 수정해 파라미터 바인딩을 사용하도록 고쳤다(CLAUDE.md "SQL 직접 작성 시 파라미터 바인딩 사용" 규칙 준수). 같은 세션에서 신규 추가된 `ExamRepository`/`ExaminationRepository`/`QuestionRepository`의 나머지 `@Query` 메서드를 전수 대조한 결과, 이 메서드 외 다른 파라미터-쿼리 불일치는 없었다(다른 메서드들은 메서드 시그니처가 애초에 `delYn`/`useYn`을 파라미터로 선언하지 않고 고정 리터럴만 쓰거나, `@Query` 없는 파생 쿼리 메서드라 문제가 없음).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/repository/ExaminationRepository.java | 수정 | `findByIdAndDelYn`의 `@Query` JPQL에서 리터럴 `'N'`을 파라미터 바인딩 `:delYn`으로 교체 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/repository/ExaminationRepository.java`
- 변경 전:
  ```java
  @Query("SELECT e FROM Examination e " +
         "JOIN FETCH e.examPaper " +
         "LEFT JOIN FETCH e.category " +
         "WHERE e.id = :id AND e.delYn = 'N'")
  Optional<Examination> findByIdAndDelYn(@Param("id") Long id, @Param("delYn") String delYn);
  ```
- 변경 후:
  ```java
  @Query("SELECT e FROM Examination e " +
         "JOIN FETCH e.examPaper " +
         "LEFT JOIN FETCH e.category " +
         "WHERE e.id = :id AND e.delYn = :delYn")
  Optional<Examination> findByIdAndDelYn(@Param("id") Long id, @Param("delYn") String delYn);
  ```
- 이유: 선언된 `@Param("delYn")`을 JPQL이 실제로 사용하지 않아 Spring Data JPA가 애플리케이션 부팅 시점에 `IllegalStateException`을 던져 `bootRun`이 죽는 결함을 수정. 파라미터 바인딩을 사용해야 한다는 CLAUDE.md 보안/코드 규칙에도 부합.

### 복원 방법
이 ID(HIST-20260722-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 `ExaminationRepository.java`에 적용한다(단, 복원하면 HIST-20260722-001에서 발생했던 부팅 실패가 재현되므로 실제로는 복원하지 않는 것을 권장).

---

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 백엔드 / 시험 관리 (Examination) — del_yn/use_yn 소프트 삭제·비활성화 플래그 추가
- **수정 개요**: `examinations`에 `del_yn`·`use_yn`을 신규 추가하고, 관리자 시험 삭제를 하드 delete에서 소프트 삭제로 전환했다. 사용여부 토글 API(`PATCH /admin/examinations/{id}/toggle`)를 추가하고, 관리자 목록/단건 조회에 `del_yn='N'` 필터를 반영했다(기존에는 필터가 전혀 없었음). 카테고리(domain_slave) 삭제 가능 여부를 판단하는 `DomainService.isSlaveInUse`도 소프트 삭제된 examinations를 참조로 치지 않도록 `del_yn='N'` 필터를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| docs/db-migration/20260722_02_add_audit_flags_exam_examination_question.sql | 추가 | examinations.del_yn/use_yn 컬럼 추가 (VARCHAR(1)) — exams/questions 컬럼도 같은 파일에 포함(AdminExamPaper_Modified.md HIST-20260722-001 참고) |
| backend/src/main/java/com/tpmp/testprep/entity/Examination.java | 수정 | delYn/useYn 필드 + softDelete()/toggleUseYn() 추가 |
| backend/src/main/java/com/tpmp/testprep/repository/ExaminationRepository.java | 수정 | findAllWithDetails를 findAllWithDetailsByDelYn(관리자)/findAllWithDetailsActive(사용자)로 분리, existsByCategoryId → existsByCategoryIdAndDelYn, findByIdWithPaper를 findByIdAndDelYn(관리자 단건)/findActiveByIdWithPaper(사용자 진입점)/findByIdWithPaperAndDelYn(사용자 제출·채점)로 분리 |
| backend/src/main/java/com/tpmp/testprep/service/ExaminationService.java | 수정 | getExaminations가 findAllWithDetailsByDelYn("N", ...) 사용, deleteExamination을 하드 delete에서 softDelete()로 교체, toggleUseYn(id) 신규, private findById가 findByIdAndDelYn(id,"N") 사용(관리자 단건 조회에 del_yn 필터 신규 반영) |
| backend/src/main/java/com/tpmp/testprep/service/DomainService.java | 수정 | isSlaveInUse의 examinationRepository.existsByCategoryId → existsByCategoryIdAndDelYn(slaveId, "N") |
| backend/src/main/java/com/tpmp/testprep/controller/AdminExaminationController.java | 수정 | PATCH /{id}/toggle 엔드포인트 추가 |
| backend/src/main/java/com/tpmp/testprep/dto/response/ExaminationResponse.java | 수정 | useYn 필드 추가(사용자·관리자 공용 응답 DTO — UserExamination_Modified.md HIST-20260722-001에서도 동일 파일 참조) |
| backend/src/test/java/com/tpmp/testprep/service/ExaminationServiceAuditFlagsTest.java | 추가 | deleteExamination 소프트 삭제·이미 삭제된 항목 재삭제 시 EXAMINATION_NOT_FOUND·toggleUseYn 회귀 테스트 |
| backend/src/test/java/com/tpmp/testprep/service/DomainServiceTest.java | 추가 | 소프트 삭제된 examinations만 참조하는 슬레이브는 삭제 허용, 활성 examinations가 참조하면 DOMAIN_IN_USE 회귀 테스트 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/Examination.java`
- 변경 전: delYn/useYn 없음(created_at/created_by만 감사 컬럼)
- 변경 후: `delYn`(기본 "N")/`useYn`(기본 "Y") 필드, `softDelete()`, `toggleUseYn()` 추가
- 이유: 시험 이벤트 소프트 삭제·비활성화 지원

#### `backend/src/main/java/com/tpmp/testprep/repository/ExaminationRepository.java`
- 변경 전: `findAllWithDetails`(필터 없음, 관리자·사용자 공유), `findByIdWithPaper`(필터 없음, startExam/getExaminationDetail/submitExam 3곳에서 공유), `existsByCategoryId`(필터 없음)
- 변경 후: 관리자용 `findAllWithDetailsByDelYn`/`findByIdAndDelYn`(del_yn='N'만), 사용자 진입점용 `findAllWithDetailsActive`/`findActiveByIdWithPaper`(del_yn='N' AND use_yn='Y'), 사용자 제출·채점용 `findByIdWithPaperAndDelYn`(del_yn만, use_yn 미필터), `existsByCategoryIdAndDelYn` 신규
- 이유: 관리자 조회는 del_yn만, 사용자 진입점은 del_yn+use_yn 둘 다, 제출·채점은 del_yn만(진행 중 세션 보호) — 3가지 필터 요구사항이 서로 달라 메서드를 분리해야 함

#### `backend/src/main/java/com/tpmp/testprep/service/ExaminationService.java`
- 변경 전: `deleteExamination`이 `examinationRepository.delete(...)` 하드 delete, `findById`가 `examinationRepository.findById(id)`(del_yn 미필터)
- 변경 후: `deleteExamination`은 `examination.softDelete()`로 교체, `toggleUseYn(id)` 신규, `findById` 사설 헬퍼가 `findByIdAndDelYn(id, "N")` 사용(fetch join도 함께 적용되어 N+1도 부수적으로 개선됨)
- 이유: 시험 삭제를 가역적으로 만들고, 관리자 상세·수정·삭제가 이미 소프트 삭제된 항목에 대해 EXAMINATION_NOT_FOUND를 반환하도록 일관화

#### `backend/src/main/java/com/tpmp/testprep/service/DomainService.java`
- 변경 전: `existsByCategoryId(slaveId)` — 소프트 삭제된 examinations도 참조로 집계되어 카테고리 삭제를 막음
- 변경 후: `existsByCategoryIdAndDelYn(slaveId, "N")`
- 이유: 소프트 삭제된 examinations는 더 이상 "사용 중"이 아니므로 domain_slave 삭제를 막지 않아야 함

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 관리자 백엔드 / 시험 관리 (Examination) — 년도·회차·AI 커스텀 구조화 컬럼 추가
- **수정 개요**: `examinations` 테이블에 `exam_year`/`exam_round`/`is_ai_custom` 컬럼을 추가하고, 관리자 시험 등록/수정 API가 이 3개 필드를 받아 저장하도록 확장했다. 기존에는 이 정보가 title 문자열에만 암묵적으로 존재했으나, 사용자 화면 필터링을 위해 구조화된 컬럼으로 분리했다. 기존 데이터는 title 정규식 파싱으로 백필했다(로컬 tpmp-db 12건 전부 성공).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| docs/db-migration/20260722_01_examinations_add_year_round_ai_custom.sql | 추가 | exam_year/exam_round/is_ai_custom 컬럼 추가 + title 파싱 백필 마이그레이션 |
| backend/src/main/java/com/tpmp/testprep/entity/Examination.java | 수정 | examYear/examRound/isAiCustom 필드·builder·update() 파라미터 추가 |
| backend/src/main/java/com/tpmp/testprep/dto/request/ExaminationCreateRequest.java | 수정 | examYear/examRound/isAiCustom 필드 추가(등록·수정 공용 요청 DTO) |
| backend/src/main/java/com/tpmp/testprep/dto/response/ExaminationResponse.java | 수정 | examYear/examRound/isAiCustom 필드 추가, from() 매핑 |
| backend/src/main/java/com/tpmp/testprep/service/ExaminationService.java | 수정 | createExamination/updateExamination이 3개 필드를 builder/update()에 전달 |
| docs/db-guidelines.md | 수정 | §8 examinations ERD 블록, §9.2 컬럼 코멘트 표에 3개 컬럼 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/Examination.java`
- 변경 전: `timeLimit`까지만 있는 4개 파라미터 builder/update()
- 변경 후: `examYear`(Integer, nullable), `examRound`(Integer, nullable), `isAiCustom`(boolean, 컬럼 `is_ai_custom` NOT NULL DEFAULT false) 필드 추가, builder 7개 파라미터, `update(title, examPaper, category, timeLimit, examYear, examRound, isAiCustom)`로 확장
- 이유: 사용자 화면 년도·회차·AI 커스텀 필터를 위해 구조화된 컬럼 필요. `.update(` 호출부는 `ExaminationService` 한 곳뿐임을 grep으로 확인 후 그 한 곳만 시그니처 맞춰 수정

#### `backend/src/main/java/com/tpmp/testprep/dto/request/ExaminationCreateRequest.java`
- 변경 전: title/examPaperId/categoryId/timeLimit 4개 필드
- 변경 후: examYear(Integer, nullable), examRound(Integer, nullable), isAiCustom(Boolean, null이면 false 취급) 3개 필드 추가
- 이유: 관리자 등록/수정 화면에서 새 필드를 전달하기 위함

#### `backend/src/main/java/com/tpmp/testprep/dto/response/ExaminationResponse.java`
- 변경 전: id/title/examPaperId/examPaperTitle/categoryId/categoryName/timeLimit/createdAt
- 변경 후: examYear/examRound/isAiCustom 3개 필드 추가, from()에서 e.getExamYear()/e.getExamRound()/e.isAiCustom() 매핑
- 이유: 사용자·관리자 화면 모두 이 응답을 그대로 쓰므로(`UserExaminationService.getExaminations`도 `ExaminationResponse::from` 그대로 사용, 코드 변경 없음 확인) 필드 확장만으로 양쪽에 전파됨

#### `backend/src/main/java/com/tpmp/testprep/service/ExaminationService.java`
- 변경 전: createExamination/updateExamination이 title/examPaperId/categoryId/timeLimit만 처리
- 변경 후: builder에 examYear(request.examYear())/examRound(request.examRound())/isAiCustom(Boolean.TRUE.equals(request.isAiCustom())) 추가, update() 호출에 동일 3개 인자 추가
- 이유: 등록·수정 시 신규 필드 저장

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다. DB 마이그레이션은 파일 하단 ROLLBACK 절(`ALTER TABLE examinations DROP COLUMN exam_year, DROP COLUMN exam_round, DROP COLUMN is_ai_custom;`)로 되돌린다.

## HIST-20260419-016

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험 관리 (Examination)
- **수정 개요**: 시험(Examination) 도메인 신규 구현 — 시험지(Exam)와 분리, 카테고리·제한시간 포함

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/DomainMaster.java | 추가 | 도메인 마스터 엔티티 (domain_master 테이블) |
| entity/DomainSlave.java | 추가 | 도메인 슬레이브 엔티티 (domain_slave 테이블) |
| entity/Examination.java | 추가 | 시험 엔티티 (examinations 테이블) — 시험지 참조, 카테고리, 제한시간 |
| repository/DomainMasterRepository.java | 추가 | findAllWithSlaves (FETCH JOIN), findByName |
| repository/DomainSlaveRepository.java | 추가 | JpaRepository 기본 |
| repository/ExaminationRepository.java | 추가 | findAllWithDetails (FETCH JOIN + Pageable) |
| dto/response/DomainSlaveResponse.java | 추가 | record(id, masterId, name) |
| dto/response/DomainMasterResponse.java | 추가 | record(id, name, List<DomainSlaveResponse>) |
| dto/response/ExaminationResponse.java | 추가 | record(id, title, examPaperId, examPaperTitle, categoryId, categoryName, timeLimit, createdAt) |
| dto/request/ExaminationCreateRequest.java | 추가 | title, examPaperId, categoryId, timeLimit (Bean Validation 포함) |
| service/DomainService.java | 추가 | getAllMasters() — findAllWithSlaves 위임 |
| service/ExaminationService.java | 추가 | CRUD: create, getAll(page), getOne, update, delete |
| controller/AdminDomainController.java | 추가 | GET /api/admin/domains |
| controller/AdminExaminationController.java | 추가 | CRUD /api/admin/examinations |
| config/DataInitializer.java | 수정 | 시험 유형 도메인 마스터/슬레이브 시딩 추가 (SQLD, 정보처리기사 실기/필기, 리눅스마스터 1급) |
| exception/ErrorCode.java | 수정 | EXAMINATION_NOT_FOUND 추가, EXAM_NOT_FOUND 메시지 변경 |

### 수정 상세

#### `entity/Examination.java` (신규)
- 변경 전: 없음
- 변경 후: `@Entity @Table(name = "examinations")`, title/examPaper(FK)/category(FK)/timeLimit/createdBy(FK)/createdAt, `update()` 메서드 포함
- 이유: 시험지(Exam)와 시험(시험 이벤트)을 명확히 분리

#### `config/DataInitializer.java`
- 변경 전: `ensureDomainMaster("문제 유형", ...)` 1개만 시딩
- 변경 후: `ensureDomainMaster("시험 유형", new String[]{"SQLD","정보처리기사 실기","정보처리기사 필기","리눅스마스터 1급"})` 추가
- 이유: 시험 등록 시 카테고리 선택 콤보박스에 사용할 도메인 데이터 필요

#### `service/ExaminationService.java` (신규)
- 변경 전: 없음
- 변경 후: ExaminationRepository, ExamRepository, DomainSlaveRepository, UserRepository 주입; create/getAll/getOne/update/delete 구현
- 이유: 시험 CRUD 비즈니스 로직 처리

### 복원 방법

이 ID(HIST-20260419-016)만으로 복원 시:
- entity/DomainMaster.java, DomainSlave.java, Examination.java 삭제
- repository/DomainMasterRepository.java, DomainSlaveRepository.java, ExaminationRepository.java 삭제
- dto/response/DomainSlaveResponse.java, DomainMasterResponse.java, ExaminationResponse.java 삭제
- dto/request/ExaminationCreateRequest.java 삭제
- service/DomainService.java, ExaminationService.java 삭제
- controller/AdminDomainController.java, AdminExaminationController.java 삭제
- DataInitializer.java에서 "시험 유형" ensureDomainMaster 호출 제거
- ErrorCode.java에서 EXAMINATION_NOT_FOUND 제거
