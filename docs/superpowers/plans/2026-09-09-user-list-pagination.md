# 사용자 목록 페이지네이션 및 퀴즈 아이콘 구현 계획

> 구현은 superpowers:subagent-driven-development와 프로젝트의 비용 절감형 검증 규칙을 적용한다.

**목표:** 승인된 사용자 목록의 페이지 표시·전체 검색을 바로잡고 퀴즈 카테고리 아이콘을 구분한다.
**설계:** 기존 배열 API인 북마크·FAQ는 표시 페이지를 나누고, 서버 Page API인 시험·노트는 서버 검색 후 페이지를 받는다. 공용 ListPagination은 기존 Pagination을 감싸 건수·페이지 크기·상단 이동을 통일한다. 기존 문의·패치노트·시험정보와 퀴즈 진행 동작은 보존한다.
**기술:** Next.js/TypeScript/Jest, Spring Boot/JPA/JUnit.
**승인 근거:** 대화의 사용자 목록 적용표 승인 및 퀴즈 카테고리별 아이콘 변경 요청.

## 공통 제약

- 카드 기본5개, FAQ 및 응시이력10개. 크기 선택은5/10/20/50, 기존 응시이력은10 고정 가능.
- 필터·검색·크기변경 첫페이지, 전체건수와 현재범위, 삭제 후 페이지 보정, 이동 후 상단.
- 사용자 노트는 로그인 사용자 소유 조건 필수, 안정적인 정렬과 파라미터 바인딩. DB마이그레이션 없음.
- 기존 미커밋 변경 보존, 커밋·푸시 없음. 메인 코드는 개발 에이전트만 수정.
- 외부 라이브러리/이미지 생성 없이 SVG 아이콘, 알 수 없는 카테고리 기본아이콘 제공.

## 작업1: 공용 표시 및 배열 목록·퀴즈 아이콘

- 소유: `frontend/src/components/ui/ListPagination.tsx`, 인접테스트, bookmarks/faq/exam-history/quiz page 및 테스트, 필요한 QuizCategoryIcon, AGENTS 공용표, 해당 프론트 히스토리.
- 인터페이스: `ListPagination({page,totalPages,totalElements,pageSize,onChange,onPageSizeChange?,scrollTargetId?})`. page 0기준, 기본 크기옵션5/10/20/50. 한페이지에서도 건수 표시. scrollTargetId는 페이지에서 유지되는 목록 래퍼id.
- [x] 회귀 테스트: 북마크6개일 때 첫페이지5개, 마지막 북마크제거 첫페이지복귀; FAQ11개일 때10개; 공용페이지 숫자·건수·크기·스크롤; 카테고리 아이콘 분기·기존 선택모달 유지.
- [x] RED 확인 후 기존 Pagination 활용 최소 구현. 번호는 전체 나열하지 않음.
- [x] 퀴즈 실제 카테고리 코드/이름으로 코드·DB·스케줄링·시험분야를 매핑하고 순서/ID의존 금지.
- [x] 관련 Jest 통과 및 히스토리 작성.

## 작업2: 시험목록 서버검색

- 소유: user/exams/page.tsx와 인접테스트, examinationService.ts, BE UserExaminationController/UserExaminationService/ExaminationRepository 및 새 조회 DTO/테스트, 시험목록 FE/BE 히스토리.
- 기존 API page/size에 선택 검색조건 추가(제목·유형·관심유형·연도·회차·AI). 첫500건만 로컬필터하는 구조 제거. 조회조건 없는 기존호출 보존. 연도/회차 선택지는 현재페이지가 아닌 전체 활성목록의 구분값 조회로 유지.
- [x] 서버 필터/총건수/500건 이후 조회·동률정렬 테스트와 FE 페이지이동·필터첫페이지·오류/늦은응답 테스트 RED.
- [x] Controller→Service→Repository 및 FE 연동. ListPagination 인터페이스 소비, 목록 래퍼id 사용.
- [x] 관련 Jest/JUnit 검증 및 히스토리.

## 작업3: 개념노트 검색·페이지 경계

- 소유: concepts/page.tsx, concepts/explore/page.tsx 및 테스트, conceptNoteService.ts, BE UserConceptNoteController/ConceptNoteService/ConceptNoteRepository 및 테스트, 개념노트 FE/BE 히스토리.
- 내노트 API 선택keyword 추가. 기존 page,size 호출 호환. 공개노트 검색계약 유지.
- [x] 제목검색 전체소유노트 대상·다른사용자 제외·페이지총건수 및 마지막항목삭제 테스트 RED.
- [x] 기본5개/공용ListPagination, 검색시 페이지버튼 유지, 삭제후재조회·페이지보정, 요청경합/실패 표시 보완.
- [x] 관련 Jest/JUnit 및 히스토리.

## 통합 검증

- [x] 독립 정적 검증(요구사항 및 품질), 문제는 담당개발자 수정.
- [x] 변경 관련 전체 Jest, FE tsc, BE test를 마지막에 실행. FE빌드는 dev산출물 공유하지 않는 별도출력 경로로1회.
- [x] diff check, 검증목록/인계 갱신. 미실행 검증은 완료로 기록하지 않는다.

## 인터페이스 사전 점검

|관계|합의|확인|
|작업1→2/3|ListPagination props 위 정의|공용파일 소유자는 작업1만|
|작업2↔3|서로 다른 Controller/Service/Repository|공통 타입파일 변경 필요시 메인에 사전 통보|
|작업1|배열API 유지, 퀴즈진행 유지|UI만 변경|
|작업2|서버 전체필터 후 Page|선택지 전체조회 포함|
|작업3|소유자+검색조건 함께 적용|다른 사용자 노트 누출 금지|
