# SDD ledger — plan: docs/superpowers/plans/2026-08-26-patch-notes.md

## Pre-flight review

| Producer / consumer | Interface or overlap | Finding |
|---|---|---|
| Task 1 / Task 2 | `PatchNote` entity and repository are consumed by DTO/service/tests | Consistent: entity publication/audit behavior supports service cases. |
| Task 2 / Task 3 | `PatchNoteService` methods and response types are exposed by controllers | Consistent: user list plus admin CRUD/publication/delete cover the specified APIs. |
| Task 3 / Task 4 | Backend endpoint shapes are consumed by `patchNoteService.ts` | Consistent: paths and verbs are fixed in Task 3 and checked verbatim in Task 4. |
| Task 4 / Task 5 | `PatchNote`, `PageResponse`, `RichContent` are consumed by user list | Consistent: full content list rendering uses the shared safe renderer. |
| Task 4 / Task 6 | Request types, service calls, `RichContent` security behavior are consumed by admin UI | Consistent: admin pages reuse the same API contracts and editor content type. |
| Task 5 / Task 7 | User route is independent of menu seeding; admin route needs fallback/seed | Consistent: user header icon stays standalone, only admin menu is seeded. |
| Task 6 / Task 7 | Admin route and label are registered in layout and initializer | Consistent: `/admin/patch-notes` is the shared route. |
| Tasks 1–7 / Task 8 | All implementation and docs feed final validation | Consistent: validation commands cover backend, frontend types, tests, build, and UI behavior. |
| Task 1 internal | SQL/JPA schema names and repository filters | Consistent; use BaseEntity column conventions and first-publish timestamp invariant. |
| Task 2 internal | Tests against service implementation | Consistent; test-first sequence explicitly names fail/pass commands. |
| Task 3 internal | Public list vs admin endpoints/security | Consistent; no user detail/read-state API is created. |
| Task 4 internal | DOMPurify dynamic import and Jest jsdom behavior | Consistent; only sanitized state is injected, and async test must await sanitization. |
| Task 5 internal | Always-visible header icon and permission routing | Consistent; route is included in always-allowed paths and has no badge. |
| Task 6 internal | Shared form, rich-text validation, server pagination | Consistent; new/edit share one form and list refreshes after mutations. |
| Task 7 internal | Menu initialization, docs, histories, handoff | Consistent; histories are split by front/back and user/admin scopes. |
| Task 8 internal | Final commands and stopped-server constraint | Consistent; automated tests do not require leaving application servers running. |

Ruling: Task 1–7 commit messages in the plan are logical checkpoints, but implementation agents may combine tightly coupled changes into fewer commits when tests require cross-task compilation — traceability is retained in the ledger and history files — cost if wrong: commit granularity may be coarser than the plan examples.

Baseline: frontend `npm test -- --watch=false` passed (8 suites, 55 tests); backend `.\gradlew.bat test` passed (`BUILD SUCCESSFUL`, 4 tasks) after the Gradle 8.5 distribution was downloaded with approval.

Task 1: fix round 1/5 (1 addressed, 0 open — 신규 DB에서 과거 델타를 재실행하도록 읽히는 문서 안내 수정; commits ceec994..290aec7)
Task 1: complete (commits 0b882d9..290aec7, review clean)
Task 2: complete (commits 290aec7..cd5d1a2, review clean)
Task 3: minor (resolved 2026-08-26 final review): `AdminPatchNoteControllerTest.java`의 미사용 `java.lang.reflect.Method` import가 제거된 상태임을 재확인했다.
Task 3: complete (commits cd5d1a2..95e366c, review clean with 1 deferred minor)
Task 4: complete (commits 95e366c..76de671, review clean)
Task 5: complete (commits 76de671..7b1e8d6, review clean)
Task 6: fix round 1/5 (1 addressed, 1 new open — Axios HTTP 오류는 공용 유틸로 처리했으나 일반 Error 메시지 회귀; commits 01cd419..b0d72c0)
Task 6: fix round 2/5 (1 addressed, 0 open — 공용 API 오류 추출기가 Axios와 일반 Error 메시지를 모두 보존; commits b0d72c0..4697988)
Task 6: complete (commits 7b1e8d6..4697988, review clean)
Task 7: complete (commits 4697988..0bb717c, review clean)

Task 8: Ruling: 계획은 `domain/PatchNote.java`를 명시했지만 프로젝트의 기존 엔티티 패키지 관례가 `entity`로 일관되므로 `entity/PatchNote.java`로 이동한다 — AGENTS.md의 기존 구조 준수가 계획의 예시 경로보다 우선한다 — cost if wrong: 계획 문서의 파일 경로와 구현 경로가 달라진다.
Task 8: fix round 1/5 (8 addressed, 0 open — 공용 오류 계약, 서버 빈 HTML, 삭제 페이지 경계, 이력/CURRENT, 엔티티 패키지 및 문서/import 수정; commits 0bb717c..9966656)
Task 8: static verification passed (shared `extractApiErrorMessage` call sites outside the fix diff remain a final-review attention item)
Task 8: fix round 2/5 (1 addressed, 0 open — 병렬 Jest에서 비결정적으로 초과된 Testing Library 기본 대기를 해당 assertion 한 곳만 5초로 보강; commits 9966656..86d7554)
Task 8: dynamic verification passed (`tsc`, parallel Jest 13 suites/68 tests, Next build with 4 patch-note routes, backend 267 tests)
Task 8: complete (commits 0bb717c..751158f, review clean)
