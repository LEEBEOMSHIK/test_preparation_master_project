## HIST-20260427-001

- **날짜**: 2026-04-27
- **수정 범위**: 사용자 프론트엔드 / 시험 정보 + 온보딩
- **수정 개요**: 첫 로그인 온보딩 페이지 신규 구현, 시험 정보 사용자 페이지 신규 구현, 로그인 후 리다이렉트 로직 변경, 사용자 메뉴에 시험 정보 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `User`에 `isFirstLogin?`, `interestedExamTypes?` 추가; `EXAM_TYPES` 상수, `ExamType` 타입, `ExamInfo` 인터페이스 추가 |
| `frontend/src/services/examInfoService.ts` | 추가 | 시험 정보 API 서비스 (admin CRUD + user 조회/온보딩) |
| `frontend/src/app/auth/login/page.tsx` | 수정 | 로그인 후 `isFirstLogin`이면 `/onboarding`으로 리다이렉트 |
| `frontend/src/app/onboarding/page.tsx` | 추가 | 첫 로그인 온보딩 페이지 (시험 유형 멀티셀렉트) |
| `frontend/src/app/user/exam-info/page.tsx` | 추가 | 사용자 시험 정보 페이지 (관심 필터 + 유형 탭 + 관심 설정 모달) |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | NAV_ITEMS 맨 앞에 "시험 정보" 항목 추가 |

### 수정 상세

#### `types/index.ts`
- `User` 인터페이스: `isFirstLogin?: boolean`, `interestedExamTypes?: string[]` 추가
- 신규: `EXAM_TYPES` (8개 고정 카테고리), `ExamType`, `ExamInfo` 인터페이스

#### 온보딩 플로우
```
로그인 성공
  ├── ADMIN → /admin/exams
  ├── USER + isFirstLogin=true → /onboarding
  └── USER + isFirstLogin=false → /user/exam-info
```

#### `/onboarding` 페이지
- 유저 레이아웃 없이 독립 페이지 (root layout만 적용)
- 8개 시험 유형 카드 멀티셀렉트 (emoji + 이름)
- "시작하기" → POST /user/onboarding → authStore 갱신 → /user/exam-info 리다이렉트
- "나중에 설정하기" → /user/exam-info 바로 이동

#### `/user/exam-info` 페이지
- 관심 유형 배지 표시 + 상단 "관심 설정" 버튼
- 유형별 탭 필터
- 시험 정보 카드: 유형 배지 + 제목 + 설명 + 접수기간/시험일정/합격발표 3칸 그리드 + 공식 홈페이지 링크
- 관심 설정 모달: 유형 체크박스 → PUT /user/exam-info/interests → authStore 갱신

#### `UserLayoutShell.tsx`
- **변경 전**: 시험, 개념노트, 데일리 퀴즈, FAQ, 1:1 문의 (5개)
- **변경 후**: **시험 정보** (신규 첫 항목), 시험, 개념노트, 데일리 퀴즈, FAQ, 1:1 문의 (6개)

### 복원 방법

HIST-20260427-001 복원 시:
- `types/index.ts`: `User`에서 `isFirstLogin`, `interestedExamTypes` 제거; `EXAM_TYPES`, `ExamType`, `ExamInfo` 제거
- `examInfoService.ts` 삭제
- `auth/login/page.tsx`: 리다이렉트 로직을 `user.role === 'ADMIN' ? '/admin/exams' : '/user/exams'`로 복원
- `onboarding/page.tsx` 삭제 (디렉토리 포함)
- `user/exam-info/page.tsx` 삭제 (디렉토리 포함)
- `UserLayoutShell.tsx`: "시험 정보" 항목 제거
