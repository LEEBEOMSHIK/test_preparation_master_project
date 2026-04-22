## HIST-20260419-017

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험 관리
- **수정 개요**: 시험 관리 화면을 Examination 기반으로 전면 재작성 — 시험지 선택 콤보, 시험 유형·시간 필드, 수정 페이지 신규 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/services/examinationService.ts | 추가 | Examination CRUD API 클라이언트 |
| src/services/domainService.ts | 추가 | getDomains() — GET /admin/domains |
| src/types/index.ts | 수정 | DomainSlave, DomainMaster, Examination 인터페이스 추가; QuestionSummary에 categoryId/categoryName 추가 |
| src/app/admin/exams/page.tsx | 수정 | examinationService 기반 목록 테이블 재작성 (시험 유형 배지, 사용 시험지, 제한 시간 컬럼) |
| src/app/admin/exams/new/page.tsx | 수정 | 시험 등록 폼 재작성 — 시험지 선택 콤보, 시험 유형 콤보(도메인), 시험 시간 콤보, questionMode 필드 제거 |
| src/app/admin/exams/[id]/edit/page.tsx | 추가 | 시험 수정 페이지 — 기존 데이터 프리필, 동일 폼 구조 |

### 수정 상세

#### `src/app/admin/exams/page.tsx`
- 변경 전: 시험지(Exam) 목록 표시, 문항 수/출제 방식 컬럼
- 변경 후: 시험(Examination) 목록 표시 — 시험 유형(indigo 배지), 사용 시험지 제목, 제한 시간(분), 등록일
- 이유: 시험지와 시험을 분리하여 시험 관리 화면이 시험 이벤트를 관리하도록 변경

#### `src/app/admin/exams/new/page.tsx`
- 변경 전: 없음 (기존 내용은 시험지 등록 화면이었음)
- 변경 후: title input + 시험 유형 select(도메인 슬레이브) + 사용 시험지 select(ExamSummary) + 시험 시간 select(30~180분) → examinationService.adminCreateExamination 호출
- 이유: 시험 등록 시 카테고리와 제한시간을 필수값으로 지정

#### `src/app/admin/exams/[id]/edit/page.tsx` (신규)
- 변경 전: 없음
- 변경 후: useParams로 id 추출, Promise.all로 시험지 목록+도메인+기존 시험 데이터 병렬 로드, 프리필 후 adminUpdateExamination 호출
- 이유: 시험 수정 기능 제공

### 복원 방법

이 ID(HIST-20260419-017)만으로 복원 시:
- services/examinationService.ts, services/domainService.ts 삭제
- types/index.ts에서 DomainSlave, DomainMaster, Examination 인터페이스 제거; QuestionSummary에서 categoryId/categoryName 제거
- app/admin/exams/page.tsx를 이전 시험지 목록 버전으로 복원
- app/admin/exams/new/page.tsx를 이전 버전으로 복원
- app/admin/exams/[id]/edit/page.tsx 삭제
