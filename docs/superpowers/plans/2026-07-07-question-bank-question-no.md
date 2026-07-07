# Question Bank Question Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hybrid source question numbering to administrator question bank management.

**Architecture:** Store source question number separately from exam-paper question sequence. Resolve `questionNo` in the `QuestionBankService` using administrator input first, otherwise `MAX(questionNo) + 1` within `examTypeId + examYear + examRound`; enforce duplicate prevention for active rows.

**Tech Stack:** Spring Boot 3, Java 17, JPA, PostgreSQL, Next.js 14, TypeScript, Tailwind CSS.

---

### Task 1: Backend Question Numbering

**Files:**
- Modify: `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- Test: `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java`

- [x] Add failing tests for explicit `questionNo`, automatic numbering, duplicate rejection, update self-exclusion, and bulk numbering.
- [x] Implement nullable `questionNo` field and DTO mapping.
- [x] Add repository queries for max number and duplicate existence.
- [x] Implement service helpers for create/update/bulk numbering.
- [x] Run `cd backend; ./gradlew test`.

### Task 2: Database Migration And Docs

**Files:**
- Create: `docs/db-migration/20260707_01_question_bank_question_no.sql`
- Modify: `docs/db-guidelines.md`

- [x] Add `question_no` nullable integer column migration.
- [x] Add positive-value check constraint.
- [x] Add partial unique index for active non-null `(exam_type_id, exam_year, exam_round, question_no)`.
- [x] Document the column in database guidelines.

### Task 3: Frontend Question Management

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/examService.ts`
- Modify: `frontend/src/app/admin/exams/questions/new/page.tsx`
- Modify: `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx`
- Modify: `frontend/src/app/admin/exams/questions/page.tsx`

- [x] Add `questionNo?: number` to admin question types and payloads.
- [x] Add optional numeric question number input to question create/edit forms.
- [x] Send blank value as `undefined` so backend can auto-number.
- [x] Show `YYYY년 제N회 M번` in list metadata.
- [x] Add source-order sort: year desc, round asc, questionNo asc, updatedAt desc fallback.
- [x] Run `cd frontend; npx tsc --noEmit`.

### Task 4: Exam Paper Latest Sort

**Files:**
- Modify: `backend/src/main/java/com/tpmp/testprep/service/ExamService.java`
- Modify: `frontend/src/app/admin/exams/papers/page.tsx`

- [x] Apply default backend sort by `createdAt DESC` when request sort is empty.
- [x] Sort filtered frontend paper list by `createdAt DESC` as a display safeguard.

### Task 5: History And Verification

**Files:**
- Modify: `docs/history/back/adm/QuestionBank_Modified.md`
- Modify: `docs/history/back/adm/AdminExamPaper_Modified.md`
- Modify: `docs/history/front/adm/AdminQuestion_Modified.md`
- Modify: `docs/history/front/adm/AdminExamPaper_Modified.md`

- [x] Prepend file-scoped `HIST-20260707-NNN` entries after re-reading each file top.
- [x] Run static verification commands in this session.
- [x] Run dynamic verification commands in this session.
