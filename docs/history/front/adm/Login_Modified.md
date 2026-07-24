## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 프론트엔드 / 로그인 화면 (에러 메시지 처리)
- **수정 개요**: 로그인 실패 시 에러 종류와 무관하게 항상 "이메일 또는 비밀번호가 올바르지 않습니다."만 표시하던 문제를 수정. 백엔드 로그인 rate limiting(5분 내 5회 실패 시 `TOO_MANY_LOGIN_ATTEMPTS` 429)의 구체적 메시지를 그대로 노출하도록 공용 유틸 `extractApiErrorMessage`(신규)를 적용(사용자 로그인 화면에도 동일 적용, 유틸 신규 작성 상세는 `docs/history/front/usr/Login_Modified.md` HIST-20260724-001 참고)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/apiError.ts` | 추가(공용) | `extractApiErrorMessage(err, fallback)` — `user/login`과 공용, 신규 작성 상세는 `docs/history/front/usr/Login_Modified.md` HIST-20260724-001 참고 |
| `frontend/src/app/admin/login/page.tsx` | 수정 | `catch { setError('고정 문구') }` → `catch (err: unknown) { setError(extractApiErrorMessage(err, '고정 문구')) }` |

### 수정 상세

#### `frontend/src/app/admin/login/page.tsx`
- 변경 전:
  ```tsx
  } catch {
    setError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  ```
- 변경 후:
  ```tsx
  } catch (err: unknown) {
    setError(extractApiErrorMessage(err, '이메일 또는 비밀번호가 올바르지 않습니다.'));
  }
  ```
- 이유: 백엔드 `ApiResponse.fail()`은 메시지를 최상위 `message`가 아닌 `error.message`에 담아 응답한다(`backend/src/main/java/com/tpmp/testprep/dto/response/ApiResponse.java` 확인). rate limit 등 구체적 원인을 관리자에게도 그대로 보여주기 위해 적용, 추출 실패 시 기존 기본 문구로 폴백

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시: `frontend/src/app/admin/login/page.tsx`의 catch 블록을 "변경 전" 코드로 되돌리고 `import { extractApiErrorMessage } from '@/lib/apiError';` 라인을 제거한다. `frontend/src/lib/apiError.ts`는 `user/login/page.tsx`에서도 사용 중이므로(HIST-20260724-001, usr) 그쪽 복원도 함께 진행하지 않는 한 파일 자체는 삭제하지 않는다.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 프론트엔드 / 로그인 화면 (다크모드 토글)
- **수정 개요**: 관리자 로그인 화면에 다크모드 토글 버튼 추가. 기존 항상-다크 고정 스타일을 테마 반응형(라이트 기본 + `dark:` 변형)으로 전환.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/login/page.tsx` | 수정 | 우상단(fixed) `<ThemeToggle />` 추가, 라이트 스타일 기본 + 기존 다크 스타일을 `dark:` 변형으로 이동 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 로컬 `ThemeToggle` 정의 제거 → 공용 `src/components/ui/ThemeToggle.tsx` import |

### 수정 상세
- **변경 전**: `bg-gradient-to-br from-gray-900 to-gray-800` 등 다크 색상 고정 — 테마 설정과 무관하게 항상 어둡게 표시.
- **변경 후**: 라이트 모드는 `from-gray-100 to-white` 그라디언트 + 흰 카드, 다크 모드는 기존 디자인 그대로(`dark:` 접두사). 제목·라벨·입력·에러·버튼·링크 전부 양쪽 테마 대응.
- 토글은 사용자 로그인과 동일하게 `fixed top-4 right-4` 위치, 공용 `<ThemeToggle />` 사용 (신규 추출 — 상세는 `docs/history/front/usr/Login_Modified.md` HIST-20260717-001 참조).
- **주의**: 라이트 테마 사용자는 관리자 로그인이 기존과 달리 밝은 화면으로 보임.

### 검증 결과
- `npx tsc --noEmit`: 오류 0건

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 `admin/login/page.tsx`의 토글 블록 제거 후 다크 고정 클래스(`dark:` 없는 gray-900/800 계열)로 되돌리고, `AdminLayoutShell.tsx`에 로컬 `ThemeToggle` 함수를 복원한다.
