# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-03

## 현재 목표와 사용자 결정 사항

- 버그 수정 요청을 위한 별도 메뉴가 필요한지 문의받아, 기존 1:1 문의 재사용을 추천(카테고리만 추가) → 사용자 승인, "버그 신고" 카테고리 추가 진행.

## 완료한 작업

1. `Inquiry.InquiryType` enum에 `BUG` 추가.
2. `DataInitializer.java`:
   - `fixInquiryTypeConstraint()` CHECK 허용값에 `'BUG'` 추가(매 기동 시 자동 반영).
   - `ensureDomainMasterWithCode("INQUIRY_CATEGORY", ...)` 시드 배열에 `"BUG"` 추가(신규 DB용).
   - 기존 마스터에 슬레이브만 보강하는 `ensureInquiryCategoryBugType()` 신규 추가(이미 INQUIRY_CATEGORY가 존재하는 이 환경 같은 경우를 위함) 및 `run()`에 호출 추가.
3. 프론트: `types/index.ts`(`InquiryType`/`INQUIRY_TYPE_LABEL`), `user/inquiries/new/page.tsx`(폴백 배열)에 `BUG`/"버그 신고" 반영.
4. 문서화: `docs/history/back/adm/AdminInquiry_Modified.md`, `docs/history/front/usr/UserInquiry_Modified.md`에 각각 `HIST-20260803-001` 추가.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava`/`./gradlew test` | 통과 |
| `npx tsc --noEmit` | 통과 |
| 백엔드 재기동 후 DB 확인 | `inquiries_inquiry_type_check`에 BUG 포함, `domain_slave`(INQUIRY_CATEGORY)에 BUG 신규 추가 로그 확인 |
| 브라우저 e2e | 사용자 화면에서 "버그 신고" 유형으로 문의 등록 → 관리자 화면(`/admin/inquiries`)에서도 "버그 신고"로 정상 표시 확인 |

## 미완료 작업

- 변경 파일 전부 **미커밋** — 사용자 승인 필요:
  - `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java`
  - `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
  - `frontend/src/types/index.ts`
  - `frontend/src/app/user/inquiries/new/page.tsx`
  - `docs/history/back/adm/AdminInquiry_Modified.md`
  - `docs/history/front/usr/UserInquiry_Modified.md`
  - `docs/agent-handoff/CURRENT.md` (본 파일)
- **알려진 이슈**: 브라우저 검증 중 관리자 문의 목록에서 테스트로 등록한 "테스트: 버그 신고 카테고리 확인" 문의(id=1, 실제 DB 기준 최신 id)를 삭제하려다 `window.confirm()` 네이티브 다이얼로그가 떠서 브라우저 탭이 응답 없음 상태가 됨 — 사용자가 브라우저에서 직접 다이얼로그를 닫아야 함. 문의 데이터 자체는 테스트용이라 남아있어도 무해하며, 원하면 관리자 화면에서 수동으로 삭제 가능.

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java `
        backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java `
        frontend/src/types/index.ts `
        frontend/src/app/user/inquiries/new/page.tsx `
        docs/history/back/adm/AdminInquiry_Modified.md `
        docs/history/front/usr/UserInquiry_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE][BE] feat: 1:1 문의에 버그 신고 카테고리 추가"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 이번 변경 반영 재기동 완료, 로그 `/tmp/backend7.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log`
- 관리자 브라우저 탭(Chrome MCP)이 `window.confirm()` 다이얼로그로 응답 없음 상태일 수 있음 — 사용자 확인 필요

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- CHECK 제약이 걸린 enum류(question_type, inquiry_type 등) 값 목록을 이 프로젝트에서 관리하는 방식은 두 갈래다: (1) `DataInitializer`의 `fix*Constraint()` 메서드(매 기동 시 DROP/재생성, inquiry_type이 이 방식) — 이 경우 baseline_schema.sql은 건드릴 필요 없음(부팅 시 자동 교정). (2) 이번 세션 초반에 발견한 `question_type`처럼 이런 자동 교정 메서드가 없던 경우는 baseline_schema.sql에 가드 블록을 직접 추가해야 함. 새 CHECK enum 값을 추가할 때 이 둘 중 어느 쪽 관리 방식인지 먼저 확인할 것.
- 브라우저 자동화 시 `confirm()`/`alert()`를 띄우는 버튼(삭제 등)은 클릭 금지 — 클릭하면 탭이 응답 없음 상태가 되고 사용자가 직접 닫아야 함.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용).
