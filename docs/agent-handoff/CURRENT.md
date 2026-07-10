# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- 보기(options) 있는 문항 채점 개선(빈칸 위치별 순서 비교·중복 정답·번호↔텍스트 상호 인정) + 관리자 정답 슬롯 UI — **완료, 커밋 직전**.

## 완료 내역

- BE `AnswerGrader` 4-인자 오버로드: options 있으면 [,/] 분리 → 순서 보존 위치별 비교, 토큰 수 불일치 오답, `normalizeOptionToken`(열거 접두 "N."/"N)" 제거)·`resolveOptionToken`(1..N 숫자 → 보기 텍스트 치환) — 중복 번호 허용, 부분 점수 없음. `AnswerGraderTest` 13종 신규.
- FE `lib/answer.ts`: `slotsToAnswer`/`parseAnswerToSlots` 추가(백엔드와 동일 정규화 규칙 — **두 구현이 어긋나면 안 됨**).
- 관리자 questions new/edit: 보기 있을 때 "정답 (빈칸 순서대로)" 슬롯 UI(중복 지정 가능, 0=미선택 sentinel), edit는 answer 파싱 실패 시 원문 텍스트 폴백. 보기 원형 번호는 표시 전용으로 변경.
- 사용자 placeholder 2곳(quiz/[categoryId], exam/[id]) 콤마 구분 안내로 갱신.
- CLAUDE.md Shared Utilities 표 갱신, 히스토리 4파일 HIST-20260710-001 prepend.

## 검증

- `./gradlew test --rerun` 전체 BUILD SUCCESSFUL, `npx tsc --noEmit` 0 errors.
- 메인 에이전트가 AnswerGrader·answer.ts 정규화 규칙 일치 직접 리뷰 — 이상 없음.
- 백엔드 재기동(PID 52160) 후 실제 문항 23(`/api/user/quiz/check`) E2E 6케이스 전부 기대값 일치:
  "4,1,2,3"·"4, 1, 2, 3"·"pwd, ls, cd, cp"·"4, ls, 2, cp" → true / "1,2,3,4"·"4,1,2" → false.

## Remaining

- 커밋·푸시 진행 중(사용자 승인됨).
- 알려진 한계: 보기 텍스트 자체에 콤마/슬래시 포함 시 분리 왜곡 — 번호 입력으로 우회(Javadoc 문서화됨).

## Warnings / Notes

- 백엔드 dev 서버 PID 52160으로 실행 중(logs/restart-bootrun3.out.log). **다음 백엔드 코드 변경 후 반드시 재시작.**
- `references/` 미추적 디렉터리는 커밋 제외 유지.

## Last Commit

- `e5775df [BE] fix: question_bank question_type CHECK 제약 재생성 결함 수정` (이번 작업은 직후 커밋 예정)
