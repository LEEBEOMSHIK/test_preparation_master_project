## HIST-20260422-001

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 노트 내용 펼치기 시 HTML 태그가 그대로 표시되던 현상 수정 — `dangerouslySetInnerHTML`로 렌더링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | 행 펼침 영역의 `{note.content}` 텍스트 렌더링 → `dangerouslySetInnerHTML` HTML 렌더링으로 변경 |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: `<div className="...whitespace-pre-wrap...">{note.content}</div>` — HTML 태그 원문 표시
- 변경 후: `<div className="...prose prose-sm..." dangerouslySetInnerHTML={{ __html: note.content }} />` — HTML 렌더링
- 이유: 사용자가 입력한 HTML 서식(이미지, 볼드 등)이 태그 문자 그대로 노출되는 버그 수정

### 복원 방법

HIST-20260422-001 복원 시:
- `dangerouslySetInnerHTML` 속성 제거, `{note.content}` 텍스트 렌더링으로 되돌림

---

## HIST-20260421-026

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 관리자 개념노트 목록 페이지 구현 — 전체 조회, 공개 전환, 삭제, 행 클릭 내용 펼치기

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/concepts/page.tsx | 수정 | 플레이스홀더 → 전체 목록 테이블 (공개전환, 삭제, 페이징) |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후:
  - 테이블: 제목, 작성자, 공개 뱃지, 수정일, 관리(공개전환/삭제)
  - 행 클릭 시 노트 내용 인라인 펼치기(토글)
  - 페이지 크기 선택(10/20/50) + 하단 페이지네이션
  - 공개 전환 시 즉시 뱃지 업데이트

### 복원 방법

HIST-20260421-026 복원 시:
- `admin/concepts/page.tsx`를 플레이스홀더 내용으로 복원
