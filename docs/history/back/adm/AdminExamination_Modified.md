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
