# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- 풀이 스크래치패드(ScratchPadPanel)에 **손입력 간트 차트 스케줄링 풀이 도구** 탭 추가. FE 전용, BE/DB 연동 없음. — **구현·검증 완료, 커밋 대기**.

## 완료 내역

- 신규 `frontend/src/components/ui/SchedulingSolveTool.tsx`: `SchedulingSolveData`(processes/totalTime/ganttCells/results), `EMPTY_SCHEDULING_SOLVE_DATA`, `isSchedulingSolveData` 타입가드, `SchedulingSolveTool({value, onChange})`. 프로세스 표(최대 10행) + 총 시간(0~60, 실행시간 합 제안 버튼) → 간트 차트 타임 슬롯 골격 생성, 슬롯·완료/반환/대기시간 전부 손입력. 유일한 자동 계산은 반환/대기시간 평균(소수 둘째 자리). 간트 셀은 입력 텍스트 해시 기반 색상 표시(보조 표시일 뿐 계산 아님). `PageReplacementTool.tsx`의 리사이즈 보존 철학(resizeGrid → resizeGantt/resizeResults) 그대로 적용.
- `ScratchPadPanel.tsx`: `TabKey`에 `'scheduling'` 추가(페이지 부재 뒤), `ScratchPadData.scheduling` 필드 + `EMPTY_DATA` + `loadData` 타입가드 폴백, 탭 렌더 분기 추가, 헤더 Javadoc 5탭→6탭 갱신.
- `CLAUDE.md` Shared Utilities 표에 `SchedulingSolveTool` 행 추가, `ScratchPadPanel` 설명 갱신.
- 히스토리: `docs/history/front/usr/UserExamination_Modified.md`에 `HIST-20260710-002` prepend(기존 `HIST-20260710-001` 보존 확인 완료).

## 검증

- `npx tsc --noEmit` (frontend) — 에러 0건.
- `npm run build` 미실행(dev 서버 가동 중 정책 준수, FE 전용이라 백엔드 빌드·테스트 불필요).

## 후속 버그 수정 (HIST-20260710-003, 미커밋)

- 사용자 신고: 다크모드에서 간트 셀 색상이 전부 회색 — `globals.css:121` `.dark input:not(...)` 전역 폼 규칙(고특이도)이 다크 유틸리티를 덮어쓰는 CSS 특이도 문제. `GANTT_COLOR_PALETTE` 다크 변형에 `!`(important) 적용 + 해시 소문자 정규화(P1/p1 동일 색). tsc 통과, dev 서버 CSS에 `!important` 팔레트 생성 확인.

## Remaining

- 후속 수정분 커밋 대기(사용자 요청 시).

## Warnings / Notes

- 백엔드 dev 서버 PID 52160 실행 중 — 이번 작업은 FE 전용이라 재시작 불필요.
- 히스토리 파일은 항상 상단 prepend만, 기존 항목 보존 확인됨(`git diff --stat`로 검증).
- `references/` 미추적 디렉터리는 커밋 제외 유지.

## Last Commit

- `5d829dc [FE] feat: 스크래치패드 손입력 간트 차트 스케줄링 풀이 도구 추가` — main 푸시 완료
