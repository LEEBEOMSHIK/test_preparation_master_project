# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-26

## 현재 목표와 확정된 사용자 결정 사항

- 패치노트 기능의 관리자 메뉴 등록, 기능 문서·범위별 히스토리·인계 정보를 갱신한다.
- 사용자는 상단 헤더의 독립 아이콘으로 게시 패치노트 목록만 조회한다. 사용자 메뉴 seed, 읽음 여부·배지·상세 페이지는 추가하지 않는다.
- 관리자만 `/admin/patch-notes`의 독립 `패치노트 관리` 메뉴를 사용한다.

## 완료한 작업

1. 관리자 fallback 내비게이션에 `/admin/patch-notes` 독립 메뉴를 표시 순서 14로 추가했다.
2. `DataInitializer`가 메뉴가 없을 때만 같은 관리자 메뉴를 생성하도록 등록했고, 생성 1회·재실행 안전성 테스트를 추가했다.
3. 프로젝트 개요에 사용자 패치노트 목록 조회와 관리자 CRUD·게시 전환을 반영했다.
4. 사용자/관리자 프론트엔드·백엔드 패치노트 히스토리 4개를 `HIST-20260826-001`로 생성했다.

## 미완료 작업

- 없음.

## 수정 파일 목록

- `frontend/src/components/layout/AdminLayoutShell.tsx`
- `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- `docs/project-overview.md`
- `docs/history/front/usr/PatchNotes_Modified.md`
- `docs/history/front/adm/PatchNotes_Modified.md`
- `docs/history/back/usr/PatchNotes_Modified.md`
- `docs/history/back/adm/PatchNotes_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증과 결과

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | 통과 |
| `gradle.bat test --tests com.tpmp.testprep.config.DataInitializerTest --rerun-tasks --console=plain` | 통과 (3개 테스트) |
| `git diff --check` | 통과 |

## 실패·경고·주의사항

- 제한된 네트워크에서 Gradle Plugin Portal의 Spring Boot 플러그인을 찾지 못해 첫 집중 테스트가 실패했다. 네트워크 권한으로 재실행한 결과 통과했다.
- Gradle 9 호환성 관련 deprecated feature 경고와 기존 `ExamQuestionSyncServiceTest`의 unchecked 연산 경고가 출력됐다.
- **원본 작업공간의 기존 미커밋 파일 `docs/history/front/usr/UserExamInfo_Modified.md`, `frontend/src/app/user/exam-info/page.tsx`, `CACHE_POLICY.md`는 건드리거나 병합에 포함하면 안 된다.**

## 다음 세션이 바로 실행할 명령

```powershell
git status --short
git diff --check
git diff --stat
```

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- 원본 작업공간의 `docs/history/front/usr/UserExamInfo_Modified.md`
- 원본 작업공간의 `frontend/src/app/user/exam-info/page.tsx`
- 원본 작업공간의 `CACHE_POLICY.md`
