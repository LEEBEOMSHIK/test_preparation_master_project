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
