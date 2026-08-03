# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-04

## 현재 목표와 사용자 결정 사항

- "대시보드에 버그 신고가 안 보인다, 문의 섹션 UI를 바꿔야 하지 않을까" 피드백 → "버그 신고 대기" 카드 추가 + 문의 목록 유형 필터 추가로 진행 승인받아 완료.

## 완료한 작업

1. 백엔드: `InquiryRepository.countByStatusAndInquiryType`, `DashboardStatsResponse.pendingBugCount`, `DashboardService.getStats()`에서 대기 상태 버그 신고 건수 조회·반영.
2. 프론트: `adminDashboardService.DashboardStats`에 `pendingBugCount` 추가, `admin/dashboard/page.tsx` 문의 섹션에 "버그 신고 대기" 카드 추가(`href="/admin/inquiries?type=BUG"`).
3. 프론트: `admin/inquiries/page.tsx`에 유형(`InquiryType`) 필터 추가 — `useSearchParams`로 URL `?type=` 쿼리를 초기값으로 반영(`Suspense` 경계로 감싸는 기존 패턴 적용).
4. 문서화: `docs/history/back/adm/AdminInquiry_Modified.md`(HIST-20260804-001), `docs/history/front/adm/Dashboard_Modified.md`(HIST-20260804-001), `docs/history/front/adm/AdminInquiryFaq_Modified.md`(HIST-20260804-001).

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava`/`./gradlew test` | 통과 |
| `npx tsc --noEmit` | 통과 |
| 백엔드 재기동 후 API | `GET /api/admin/dashboard/stats` → `pendingBugCount:1`(테스트 버그 신고 1건과 일치) |
| 브라우저 e2e | 대시보드 "버그 신고 대기" 카드 "1" 표시 → 클릭 시 `/admin/inquiries?type=BUG`로 이동, 유형 드롭다운 "버그 신고" 자동 선택, 목록 1건 정확히 필터링됨 확인 |

## 미완료 작업

- 변경 파일 전부 **미커밋** — 사용자 승인 필요:
  - `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java`
  - `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java`
  - `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java`
  - `frontend/src/services/adminDashboardService.ts`
  - `frontend/src/app/admin/dashboard/page.tsx`
  - `frontend/src/app/admin/inquiries/page.tsx`
  - `docs/history/back/adm/AdminInquiry_Modified.md`
  - `docs/history/front/adm/Dashboard_Modified.md`
  - `docs/history/front/adm/AdminInquiryFaq_Modified.md`
  - `docs/agent-handoff/CURRENT.md` (본 파일)
- DB에는 여전히 테스트용 문의 1건("테스트: 버그 신고 카테고리 확인", id=1)이 남아있음 — 이전에 삭제하려다 confirm 다이얼로그로 중단됨. 무해하니 필요시 관리자 화면에서 수동 삭제.

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java `
        backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java `
        backend/src/main/java/com/tpmp/testprep/service/DashboardService.java `
        frontend/src/services/adminDashboardService.ts `
        frontend/src/app/admin/dashboard/page.tsx `
        frontend/src/app/admin/inquiries/page.tsx `
        docs/history/back/adm/AdminInquiry_Modified.md `
        docs/history/front/adm/Dashboard_Modified.md `
        docs/history/front/adm/AdminInquiryFaq_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE][BE] feat: 대시보드 버그 신고 대기 카드 + 문의 유형 필터 추가"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 이번 변경 반영 재기동 완료, 로그 `/tmp/backend9.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log`

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- 브라우저 자동화 시 `confirm()`/`alert()`를 띄우는 버튼(삭제 등)은 클릭 금지.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용).
