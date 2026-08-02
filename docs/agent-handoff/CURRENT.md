# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-03

## 현재 목표와 사용자 결정 사항

- "리눅스마스터/SQLD 문항에 시험이 없고 키워드 분석도 안 되어 있다 — 진행해" 요청 처리.
- AI 분석 방식 확인 질문에 사용자가 "비용 때문에 로컬인 너한테 요청하는거야"라고 답함 → 백엔드 LLM API(Ollama/Anthropic) 호출 대신 이 세션에서 직접 237개 문항을 읽고 분석해 DB에 반영.

## 완료한 작업

1. **시험 생성**: `docs/db-migration/20260802_01_create_linux_sqld_exams.sql` 신규 — `question_bank`(리눅스마스터 1급 100문항/2급 80문항/SQLD 50문항, 회차 있는 것만)로 `exams`(id 16~18)+`examinations`(id 24~26)+`questions`(id 301~530, 230건) 생성. 재실행 안전(가드), 로컬 DB에 적용 완료.
2. **콘텐츠 덤프 갱신**: `docs/sql/tpmp_content_data.sql`에 위 exams/examinations/questions 230건을 각 섹션 끝에 추가(기존 행 변경 없음). 갱신 과정에서 멀티라인 INSERT문이 grep 라인 추출로 잘리는 버그를 발견해 Python 정규식(`^INSERT INTO public\.\w+ \(`) 기반 재추출로 해결.
3. **AI 키워드/도메인 분석**: 대상 237개 문항(SQLD 52, 리눅스마스터 1급 105, 리눅스마스터 2급 80) 전부에 대해 직접 내용을 읽고 `ai_keywords`(5~8개)/`ai_domains`(1~3개)/`ai_difficulty`(하/중/상)/`ai_summary`(1~2문장)를 생성해 로컬 DB에 반영. `docs/sql/tpmp_content_data.sql`에 "question_bank AI 분석 결과 갱신" 섹션(237개 UPDATE문, ON CONFLICT DO NOTHING과 무관하게 항상 최신값 반영)으로 추가.
4. **문서화**:
   - `docs/sql/README.md` — 델타 목록 #35 추가, 상단 "마지막 갱신" 갱신.
   - `docs/history/back/adm/AdminExamination_Modified.md` — `HIST-20260803-001` 추가(시험 생성).
   - `docs/history/back/adm/QuestionAnalysis_Modified.md` — `HIST-20260803-001` 추가(AI 분석).

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| 시험 생성 마이그레이션 재실행 | "이미 존재 — 건너뜀" (멱등성 확인) |
| API 검증 | `GET /api/admin/exams/{16,17,18}/questions` → 100/80/50건, content 정상 |
| 콘텐츠 덤프 최종 e2e (임시 DB 4회 생성/삭제, 원본 `tpmp` 미영향) | ERROR 0건, exams 15/examinations 15/questions 470/question_bank 636, AI 분석 237/237 반영 확인 |

## 미완료 작업

- 변경 파일 전부 **미커밋** — 사용자 승인 필요:
  - `docs/db-migration/20260802_01_create_linux_sqld_exams.sql` (신규)
  - `docs/sql/tpmp_content_data.sql` (수정)
  - `docs/sql/README.md` (수정)
  - `docs/history/back/adm/AdminExamination_Modified.md` (수정)
  - `docs/history/back/adm/QuestionAnalysis_Modified.md` (수정)
  - `docs/agent-handoff/CURRENT.md` (본 파일)

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add docs/db-migration/20260802_01_create_linux_sqld_exams.sql `
        docs/sql/tpmp_content_data.sql docs/sql/README.md `
        docs/history/back/adm/AdminExamination_Modified.md `
        docs/history/back/adm/QuestionAnalysis_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[BE][INFRA] feat: 리눅스마스터/SQLD 시험 신규 생성 및 AI 키워드 분석 반영"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 로그 `/tmp/backend3.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log`

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- AI 분석값(키워드/도메인/난이도/요약)은 실제 LLM이 아니라 이 세션에서 문항 내용을 직접 읽고 수동 작성한 것 — 품질은 합리적 수준이나 완벽한 일관성을 보장하진 않음. 추후 실제 AI 재분석(`POST /api/admin/questions/analyze`)으로 덮어써도 무방.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용, 이전 세션에서 처리).
