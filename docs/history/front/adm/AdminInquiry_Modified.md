## HIST-20260831-002

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 답변·처리 상태
- **수정 개요**: 사용자 답변 등록과 처리 상태 변경 책임을 분리하고, 답변 없는 종료 확인 및 상태·이메일 결과 병행 안내를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/inquiryService.ts` | 수정 | 상태 변경 요청에서 메시지를 제거하고 상태·이메일 결과 응답 타입 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 답변/상태 UI 분리, 종료 확인 dialog, 상태 성공·이메일 경고 표시 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | 역할 분리·확인·상태 API·SKIPPED·QUEUED 회귀 테스트 추가 |
| `frontend/src/components/ui/InquiryMessageComposer.tsx` | 수정 | 관리자 답변의 타임라인 등록 안내와 이메일 옵션 문구 명확화 |
| `frontend/src/components/ui/InquiryMessageComposer.test.tsx` | 수정 | 관리자 답변 문구와 기존 첨부·등록 동작 회귀 검증 |

### 수정 상세

#### 답변과 상태 변경 책임
- 변경 전: 상태 변경 카드가 종료 안내 본문을 필수 입력받아 상태 변경 요청과 사용자 안내 메시지 역할을 함께 수행했다.
- 변경 후: 관리자 답변은 `InquiryMessageComposer`를 통해 타임라인에만 추가되고 상태는 유지되며, 상태 변경 요청은 `status`와 `sendEmail`만 전송한다.
- 이유: 답변 기록과 워크플로 상태 전이를 독립 작업으로 명확히 구분하기 위해서다.

#### 종료 확인과 결과 안내
- 변경 전: 관리자 답변 존재 여부와 관계없이 종료 상태를 바로 요청했고 상태 이메일 미발송 결과를 별도로 알리지 않았다.
- 변경 후: 관리자 답변이 없는 종료는 접근 가능한 확인 dialog를 거치며, 상태 성공을 먼저 표시하고 SKIPPED 이메일 결과는 별도 경고와 템플릿 관리 링크로 함께 표시한다.
- 이유: 무답변 종료 실수를 방지하면서 이메일 실패가 성공한 상태 전이를 가리지 않도록 하기 위해서다.

### 복원 방법

이 ID(`AdminInquiry_Modified.md` 기준 HIST-20260831-002)로 복원 시 상태 API의 이전 `message` 인자와 종료 안내 입력을 복원하고, 답변 문구·종료 확인 dialog·상태/이메일 병행 알림 및 대응 테스트를 이전 상태로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 답변 작성 문맥
- **수정 개요**: 관리자 상세의 중복 제목을 제거하고, 공용 작성기에서 관리자 답변의 제목·안내·첨부 제목·전송 버튼·오류 문구를 분리했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/InquiryMessageComposer.tsx` | 수정 | 관리자 답변 전용 문구 적용 |
| `frontend/src/components/ui/InquiryImageUploader.tsx` | 수정 | 답변 첨부 이미지 제목 지원 |
| `frontend/src/components/ui/InquiryMessageComposer.test.tsx` | 수정 | 관리자 문맥 접근성 회귀 검증 |
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 작성기와 중복되던 관리자 답변 제목 제거 |

### 수정 상세

- 변경 전: 관리자가 사용자와 동일한 일반 메시지 등록 용어를 보았고 상세 화면에 답변 제목이 중복 노출됐다.
- 변경 후: 관리자는 사용자 답변 작성, 답변 첨부 이미지, 답변 보내기 용어와 답변 전송 오류 안내를 보고 상세에서는 제목을 한 번만 본다.
- 이유: 답변 행위와 사용자 후속 문의를 명확히 구분하고 중복된 화면 정보를 제거하기 위해서다.

### 검증

- 관리자 문의 상세과 설정 화면 focused Jest 실행: 2 suites, 10 tests 통과.
- 전체 프론트엔드 `npx tsc --noEmit` 오류 0, Jest 26 suites/124 tests 실패 0, `npm run build` 성공 및 정적 페이지 55개 생성을 확인했다. 기존 Next build viewport metadata 경고는 성공 결과와 별개다.
- root `git diff --check` 성공: 오류 0(CRLF 변환 경고는 공백 오류가 아님).

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260831-001 복원 시 공용 작성기의 관리자 문맥 문구와 상세 화면의 중복 제목 렌더링을 이전 상태로 되돌린다.
