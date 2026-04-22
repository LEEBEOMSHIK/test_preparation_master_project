## HIST-20260422-008

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 백엔드 / 1:1 문의 관리
- **수정 개요**: 관리자 문의 삭제 API 추가 및 답변 재등록 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/InquiryService.java` | 수정 | `adminDelete(id)` 메서드 추가 |
| `backend/.../controller/AdminInquiryController.java` | 수정 | `DELETE /api/admin/inquiries/{id}` 엔드포인트 추가 |

### 수정 상세

#### `InquiryService.java`
- 변경 전: `adminToggleHold` 이후 admin 관련 메서드 없음
- 변경 후: `adminDelete(id)` 추가 — 문의 단건 삭제
- 이유: 관리자가 문의를 삭제할 수 있어야 함

#### `AdminInquiryController.java`
- 변경 전: DELETE 엔드포인트 없음
- 변경 후: `DELETE /{id}` → `inquiryService.adminDelete(id)` 호출
- 이유: 관리자 문의 삭제 기능 제공

#### 답변 재등록
- `Inquiry.reply()` 메서드는 기존부터 ANSWERED 상태에서도 reply/repliedAt 덮어쓰기 가능
- 백엔드 변경 없음, 프론트엔드에서만 ANSWERED 일 때도 textarea 노출하도록 수정

### 복원 방법

`InquiryService.adminDelete()` 제거, `AdminInquiryController`의 DELETE 엔드포인트 제거.
