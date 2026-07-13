# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- 2026-07-13 세션 작업 3건 — **모두 완료, 커밋·푸시됨.**
  1. 관리자 시험 정보 화면 "+ 유형 추가" 인라인 버튼 (`e155922`)
  2. SQL "+ 결과 테이블 정답 추가" 버튼 클릭 무반응 버그 수정 (`9130c22`)
  3. 텍스트 정답 채점 따옴표 종류 무시 — 홑/쌍/타이포그래피 (`960d259`)

## 완료 요약

- **유형 추가 버튼**: `admin/exam-info/page.tsx` — EXAM_TYPE 마스터 id·슬레이브 상태 보관, 셀렉트 옆 인라인 입력으로 `domainService.createSlave` 호출. 중복/빈값 검증, 성공 시 자동 선택.
- **SQL 에디터 버그**: `SqlProblemEditor` 섹션 표시 판정을 `isExpectedResultEnabled`(이름 있는 컬럼 필요) → `columns.length > 0`으로 변경. `isExpectedResultEnabled`(채점 활성 판정)는 유지 — 두 판정의 용도 차이를 `lib/sql.ts` 주석에 명시.
- **따옴표 정규화**: `AnswerGrader.normalizeQuotes` 신설(`" “ ” ‘ ’` → `'`), `normalizeToken`·`normalizeLoose`에만 적용. CODE·객관식/OX·options 채점·SQL 결과 테이블 채점은 무변경. 테스트 4건 추가.
- **데이터 작업**(커밋 대상 아님, 운영 DB): AI 커스텀 문항 113(관계대수 결과 튜플, expectedResult 채점)·114(셀렉션 조건 빈칸, 텍스트 채점) 등록 — 카테고리 "관계형 DB 이론"(31)·시험 유형 "정보처리기사 실기"(7)·연도/회차 null. 정답 없는 중복 문항 111 소프트 삭제.

## 검증 결과

- `AnswerGraderTest` 대상 실행 BUILD SUCCESSFUL, `npx tsc --noEmit` 0 에러 (작업별 수행).
- E2E: 퀴즈 화면에서 113 그리드 입력→정답 채점, 114 쌍따옴표 입력 정답 인정, 113 결과 테이블 채점 회귀 5케이스 통과 (백엔드 재시작 후 채점 API + 브라우저 확인).
- 관리자 등록 화면에서 "+ 결과 테이블 정답 추가" 클릭 시 편집 그리드 열림 브라우저 확인.

## Warnings / Notes

- 히스토리 파일 prepend만, dev 서버 가동 중 `npm run build` 금지(`npx tsc --noEmit` 사용), `references/` 미추적 유지.
- 로컬 dev 서버 2개 백그라운드 가동 중이었음(3000/8080) — 새 세션은 포트 확인 후 기동.

## Last Commit

- `960d259 [BE] feat: 텍스트 정답 채점 시 따옴표 종류 차이 무시 (홑/쌍/타이포그래피)` — main 푸시 완료
