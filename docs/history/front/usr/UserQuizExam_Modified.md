## HIST-20260420-011

- **날짜**: 2026-04-20
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 + 시험 응시 + 홈 명언 알림
- **수정 개요**: 데일리 퀴즈 카테고리 선택·풀이 화면, 시험 목록·응시 2패널 화면, 홈 진입 시 랜덤 명언 모달 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/services/quizService.ts | 추가 | getCategories / getQuestions / checkAnswer API |
| src/app/user/quiz/page.tsx | 추가 | 카테고리 선택 화면 |
| src/app/user/quiz/[categoryId]/page.tsx | 추가 | 퀴즈 풀이 화면 (즉시 채점·해설·결과 요약) |
| src/app/user/exams/page.tsx | 수정 | 시험 목록 실제 표시 + 홈 진입 시 랜덤 명언 모달 |
| src/app/user/exams/[id]/page.tsx | 추가 | 시험 응시 2패널 화면 |
| src/components/layout/UserLayoutShell.tsx | 수정 | 데일리 퀴즈 nav 항목 추가 |

### 수정 상세

#### `app/user/exams/page.tsx`
- 변경 전: "준비 중입니다." 표시
- 변경 후: 시험 목록 카드 + 첫 진입 시 랜덤 명언 모달

#### `app/user/exams/[id]/page.tsx` (신규)
- 좌측 패널: 시험 제목, 문제 본문, 선택지/입력, 이전/다음, 체크(나중에 확인) 버튼
- 우측 패널: 남은 시간 카운트다운(기본 60분), 답안 현황 그리드(미답·답변·체크 색상 구분), 제출 버튼
- 체크된 문항이 있으면 제출 차단 → 체크 번호 클릭 시 해당 문제로 이동
- 제출 후 점수(score), 총 문항(total), 맞은 수(correct) 결과 화면 표시
- 시간 종료 시 자동 강제 채점

#### `app/user/quiz/[categoryId]/page.tsx` (신규)
- 즉시 채점(POST /api/user/quiz/check) 후 정오 피드백·해설 표시
- 마지막 문제 후 결과 화면(정답률 표시, 오답 복습 목록)

### 복원 방법

HIST-20260420-011 복원 시:
- quizService.ts 삭제
- src/app/user/quiz/ 디렉토리 삭제
- src/app/user/exams/page.tsx를 "준비 중입니다" 단순 표시로 되돌림
- src/app/user/exams/[id]/ 디렉토리 삭제
- UserLayoutShell.tsx에서 데일리 퀴즈 항목 제거
