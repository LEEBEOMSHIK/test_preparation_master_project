# TPMP 테스트 케이스 명세 가이드

이 파일은 Claude Code(AI)가 TPMP 프로젝트에 새로운 화면·기능을 추가할 때 테스트 케이스를 자동 생성하기 위한 규격서입니다.

---

## 테스트 케이스 관리 화면 위치

- **파일**: `frontend/src/app/admin/test-cases/page.tsx`
- **URL**: `/admin/test-cases`
- **데이터 저장**: `localStorage` 키 `tpmp_test_results_v1` (테스트 실행 결과)
- **정적 정의**: `TEST_CASES` 배열 (page.tsx 내 상수)

---

## 테스트 케이스 ID 규칙

```
{PREFIX}-{SCREEN}-{NNN}
```

| 카테고리 | 화면 | PREFIX 예시 |
|---------|------|------------|
| 관리자 | 인증 | ADM-AUTH |
| 관리자 | 시험 관리 | ADM-EXAM |
| 관리자 | 시험지 관리 | ADM-PAPER |
| 관리자 | 문항 관리 | ADM-QUEST |
| 관리자 | 개념노트 관리 | ADM-CONCEPT |
| 관리자 | 시험 정보 관리 | ADM-EXAMINFO |
| 관리자 | FAQ 관리 | ADM-FAQ |
| 관리자 | 1:1 문의 관리 | ADM-INQ |
| 관리자 | 명언 관리 | ADM-QUOTE |
| 관리자 | 도메인 관리 | ADM-DOMAIN |
| 관리자 | 권한 관리 | ADM-PERM |
| 관리자 | 메뉴 관리 | ADM-MENU |
| 관리자 | 사용자 관리 | ADM-USER |
| 관리자 | 테스트 케이스 | ADM-TESTCASE |
| 사용자 | 인증 | USR-AUTH |
| 사용자 | 시험 응시 | USR-EXAM |
| 사용자 | 퀴즈 | USR-QUIZ |
| 사용자 | 개념노트 | USR-CONCEPT |
| 사용자 | FAQ/문의 | USR-FAQ |
| 공통 UI | 공통 | UI-COMMON |

새 화면/기능 추가 시 위 표에 행을 추가하고, NNN은 해당 PREFIX 내에서 최대값 + 1.

---

## TestCase 타입 정의

```typescript
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type TestStatus = 'PENDING' | 'PASS' | 'FAIL' | 'SKIP';
type TestType = 'FUNCTIONAL' | 'UI' | 'INTEGRATION';
type Category = '관리자' | '사용자';

interface TestCase {
  id: string;           // PREFIX-NNN 형식
  category: Category;   // '관리자' | '사용자'
  screen: string;       // 화면명 (한글, 예: '시험지 관리')
  testName: string;     // 테스트 케이스명 (동사형, 예: '시험지 생성')
  preconditions: string; // 전제 조건
  steps: string[];      // 테스트 단계 (순서 있는 배열)
  expectedResult: string; // 기대 결과
  priority: Priority;
  testType: TestType;
}
```

---

## 우선순위 기준

| 우선순위 | 기준 |
|---------|------|
| `HIGH` | 핵심 CRUD, 인증/인가, 데이터 정합성, 보안 |
| `MEDIUM` | 검색/필터, 수정, 상태 변경, 중요 UX 흐름 |
| `LOW` | 시각적 UI, 다크모드, 빈 상태 표시, 보조 기능 |

---

## 테스트 유형 기준

| 유형 | 기준 |
|-----|------|
| `FUNCTIONAL` | API 호출이 포함된 기능 동작 검증 |
| `UI` | 화면 렌더링, 레이아웃, 인터랙션 검증 (API 불필요) |
| `INTEGRATION` | 외부 시스템 연동 (Google OAuth, 파일 업로드 등) |

---

## 새 화면 추가 시 AI 행동 규칙

1. 새 관리자/사용자 화면을 구현할 때 **항상 아래 CRUD 테스트 케이스를 자동 생성**한다.
2. `page.tsx`의 `TEST_CASES` 배열에 새 케이스를 추가한다 (기존 항목 뒤에 이어 붙임).
3. 이 파일(TestCaseSpec.md)의 ID PREFIX 표에 새 항목을 추가한다.
4. 새 화면 구현 히스토리 파일에 "테스트 케이스 N건 추가" 항목을 포함한다.

---

## 기본 테스트 케이스 템플릿 (새 목록 화면)

아래 5가지는 목록형 CRUD 화면에 항상 포함해야 하는 기본 케이스다.

```typescript
// 1. 목록 조회
{ id: '{PREFIX}-001', category: '관리자', screen: '{화면명}', testName: '{화면명} 목록 조회',
  preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "{메뉴명}" 클릭'],
  expectedResult: '{항목} 목록이 테이블 형태로 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },

// 2. 생성
{ id: '{PREFIX}-002', category: '관리자', screen: '{화면명}', testName: '{항목} 생성',
  preconditions: '{화면명} 페이지 접속 상태', steps: ['"추가/생성" 버튼 클릭', '필수 항목 입력', '"저장" 클릭'],
  expectedResult: '새 {항목}이 목록에 추가된다', priority: 'HIGH', testType: 'FUNCTIONAL' },

// 3. 수정
{ id: '{PREFIX}-003', category: '관리자', screen: '{화면명}', testName: '{항목} 수정',
  preconditions: '{화면명} 목록에 항목 존재', steps: ['수정 버튼 클릭', '내용 변경', '"저장" 클릭'],
  expectedResult: '변경 사항이 저장되어 목록에 반영된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },

// 4. 삭제
{ id: '{PREFIX}-004', category: '관리자', screen: '{화면명}', testName: '{항목} 삭제',
  preconditions: '{화면명} 목록에 항목 존재', steps: ['삭제 버튼 클릭', '확인 다이얼로그에서 확인'],
  expectedResult: '{항목}이 목록에서 제거된다', priority: 'HIGH', testType: 'FUNCTIONAL' },

// 5. 검색
{ id: '{PREFIX}-005', category: '관리자', screen: '{화면명}', testName: '{항목} 검색',
  preconditions: '목록에 데이터 1건 이상 존재', steps: ['검색창에 키워드 입력', '검색 실행'],
  expectedResult: '키워드를 포함하는 {항목}만 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
```

---

## 현재 등록된 테스트 케이스 수 (2026-05-02 기준)

| 카테고리 | 화면 | 케이스 수 |
|---------|------|---------|
| 관리자 | 인증 | 3 |
| 관리자 | 시험 관리 | 4 |
| 관리자 | 시험지 관리 | 5 |
| 관리자 | 문항 관리 | 5 |
| 관리자 | 개념노트 관리 | 3 |
| 관리자 | 시험 정보 관리 | 3 |
| 관리자 | FAQ 관리 | 3 |
| 관리자 | 1:1 문의 관리 | 2 |
| 관리자 | 명언 관리 | 3 |
| 관리자 | 도메인 관리 | 4 |
| 관리자 | 권한 관리 | 2 |
| 관리자 | 메뉴 관리 | 5 |
| 관리자 | 사용자 관리 | 3 |
| 사용자 | 인증 | 4 |
| 사용자 | 시험 응시 | 4 |
| 사용자 | 퀴즈 | 2 |
| 사용자 | 개념노트 | 2 |
| 사용자 | FAQ/문의 | 2 |
| 공통 UI | 공통 UI | 3 |
| **합계** | | **62** |
