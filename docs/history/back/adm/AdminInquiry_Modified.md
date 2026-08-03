## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 백엔드 / 대시보드 — 버그 신고 대기 건수 통계 추가
- **수정 개요**: 대시보드 문의 섹션이 유형 구분 없이 전체 문의 건수만 보여줘 버그 신고를 별도로 확인할 방법이 없다는 피드백에 따라, `DashboardStatsResponse`에 `pendingBugCount`(대기 상태 버그 신고 건수)를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | `countByStatusAndInquiryType(status, inquiryType)` 파생 쿼리 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java` | 수정 | `pendingBugCount` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java` | 수정 | `getStats()`에서 `countByStatusAndInquiryType(PENDING, BUG)` 조회 후 응답에 반영 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 백엔드 재기동 후 `GET /api/admin/dashboard/stats` 응답에 `pendingBugCount:1`(기존 테스트용 버그 신고 1건과 일치) 확인.

---

## HIST-20260803-001

- **날짜**: 2026-08-03
- **수정 범위**: 관리자·사용자 백엔드 공용 / 1:1 문의 — "버그 신고" 카테고리 추가
- **수정 개요**: 버그 리포트 전용 메뉴/기능을 새로 만들지 않고 기존 1:1 문의를 재사용하기로 하면서, 지금까지 버그 신고가 전부 "기타"로 뒤섞여 다른 잡다한 문의와 구분이 안 되던 문제를 해결하기 위해 `InquiryType`에 `BUG`를 추가했다. `INQUIRY_CATEGORY` 도메인 마스터는 이미 대부분 환경에 존재해 기존 `ensureDomainMasterWithCode`(마스터가 없을 때만 슬레이브 생성)로는 새 카테고리가 반영되지 않아, 기존 마스터에 슬레이브 하나만 채워 넣는 `ensureInquiryCategoryBugType()`을 신규 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | `InquiryType` enum에 `BUG` 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `fixInquiryTypeConstraint()`의 CHECK 허용값에 `'BUG'` 추가(매 기동 시 DROP/재생성이라 기존 DB도 자동 반영). `ensureDomainMasterWithCode("INQUIRY_CATEGORY", ...)` 시드 배열에 `"BUG"` 추가(신규 DB용). 기존 마스터에 슬레이브만 보강하는 `ensureInquiryCategoryBugType()` 신규 추가 및 `run()`에 호출 추가 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 백엔드 재기동 후 확인: `inquiries_inquiry_type_check`에 `BUG` 포함, `domain_slave`(INQUIRY_CATEGORY)에 `BUG` 신규 추가(로그 "문의 카테고리 'BUG' 신규 추가 완료").
- 브라우저 e2e: 사용자 화면에서 "버그 신고" 유형으로 문의 등록 → 관리자 화면(`/admin/inquiries`) 목록에 "버그 신고"로 정상 표시 확인.

---

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
