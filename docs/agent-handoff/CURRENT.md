# Agent Handoff - CURRENT

## Current Goal

- 진행 중 작업 없음. 직전 작업 3건 모두 커밋·푸시 완료.

## Completed (커밋)

- `fee78c6` [FE] 사용자·관리자 로그인 화면 다크모드 토글 (공용 `ThemeToggle` 추출 포함)
- `90e17c2` [BE] 채점 열거 마커 확장(ㄱ.·①·a.) + 괄호 대체 표기 인정 (`AnswerGrader`, 테스트 11건 추가)
- `6884b4a` [INFRA] 콘텐츠 덤프 갱신 — 채점 대체 표기 + 2026년 1회 3·18번 이미지 → 구조·데이터 치환

## Verification

- 백엔드 전체 테스트: BUILD SUCCESSFUL (이전 실패 1건 포함 전부 통과)
- 프론트 `npx tsc --noEmit`: 오류 0건
- 로컬 DB: `questions` 83·86·90·98, `question_bank` 3·6·10·18 갱신 확인

## 남은 이슈 / 참고

- 브라우저 육안 확인 미실시: ① 로그인 화면 다크모드 토글 ② 2026년 1회 3번(보기+번호 입력 UI)·18번(테이블+SQL 구문강조) 렌더링 ③ 채점 수정 후 시험 재응시.
- 백엔드가 기동 중이었다면 채점 코드 반영에는 재시작 필요(데이터 변경은 즉시 반영).
- 다른 로컬은 `docs/sql/tpmp_content_data.sql` 재적용 시 ON CONFLICT DO NOTHING이라 기존 행이 갱신되지 않음 — 새 문항 데이터가 필요하면 해당 행 삭제 후 재적용하거나 UPDATE 직접 실행.

## Do Not Touch

- `.env` (로컬 전용, 커밋 금지).
- `references/images/*` — 사용자 참고 이미지(gitignore 상태), 삭제·이동 금지.
