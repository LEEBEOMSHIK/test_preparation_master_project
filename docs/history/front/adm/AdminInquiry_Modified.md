## HIST-20260909-001

- **날짜**: 2026-09-09
- **수정 범위**: 관리자 프론트엔드 / 문의·요청 상세
- **수정 개요**: 기본정보에 문의 유형별 상태 안내 이메일 템플릿 연결 현황과 관리·편집 경로 제공.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 유형별 연결 요약, 관리·편집 링크, 조회 재시도 및 발송 선택 방어 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | 설정 링크 변경 및 종료 문의 연결 현황·조회 오류/재시도 검증 |

### 수정 상세

- 변경 전: 종료 상태를 선택한 뒤 발송 불가한 경우에만 템플릿 설정 링크가 나타났다.
- 변경 후: 상태 선택 전과 종료된 문의에서도 일반 문의의 답변 완료, 처리형 요청의 처리 완료·처리 불가 템플릿에 대해 연결됨·미연결·비활성·발송 불가를 표시한다. 이벤트 연결 관리와 연결된 템플릿 편집 링크를 제공한다.
- 연결 조회를 새로고침할 수 있으며 조회 중에는 Skeleton, 오류 시에는 확인 실패와 재시도를 표시한다. 조회 실패를 미연결로 오인하지 않도록 기존 연결 목록을 숨긴다.
- 새 조회 시작 시 이메일 선택을 초기화하고 조회 중·실패 상태의 이메일 선택과 제출을 막는다. 상태 변경 자체는 계속 가능하며 실제 발송 결과는 기존 발송 이력에서 확인한다.
- 이유: 메일을 사용하는 화면에서 필요한 템플릿의 준비 상태를 바로 확인하고 관리 화면으로 이동할 수 있도록 한다.

### 복원 방법

`AdminInquiry_Modified.md`의 `HIST-20260909-001` 변경을 역적용하여 상시 연결 현황·새로고침을 제거하고 종료 상태 선택 시의 기존 안내 영역을 복원한다. 기본정보 통합과 이력 탭 변경은 유지한다.

---

## HIST-20260908-002

- **날짜**: 2026-09-08
- **수정 범위**: 관리자 프론트엔드 / 문의·요청 상세
- **수정 개요**: 문의·답변과 이메일 발송 이력을 별도 탭으로 분리.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 공통 기본정보 아래 문의·답변/이메일 발송 이력 탭 및 키보드 탐색 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | 발송 이력 테스트에서 탭 선택 및 탭 전환·기본정보 유지·키보드 이동 검증 |

### 수정 상세

- 변경 전: 대화·답변 작성·이메일 발송 이력이 하나의 긴 화면에 표시됐다.
- 변경 후: 기본정보와 상태 관리는 상단 공통 영역에 유지하고, 기본 선택인 문의·답변 탭에는 대화와 작성기를, 이메일 발송 이력 탭에는 기존 이력과 필터·새로고침·재발송을 표시한다.
- 탭 전환 시 작성 중인 답변과 첨부 상태가 사라지지 않도록 패널을 숨김 처리한다. `tablist`/`tab`/`tabpanel` 연결과 화살표·Home·End 키 탐색을 지원한다.
- 이유: 문의 처리에 집중하면서 필요할 때 발송 이력을 별도로 확인할 수 있도록 화면 길이를 줄인다.

### 복원 방법

`AdminInquiry_Modified.md`의 `HIST-20260908-002` 변경을 역적용하여 탭 UI·상태를 제거하고 대화 및 이력 영역을 함께 표시한다. 이전 기본정보 통합 변경은 유지한다.

---

## HIST-20260908-001

- **날짜**: 2026-09-08
- **수정 범위**: 관리자 프론트엔드 / 문의·요청 상세
- **수정 개요**: 별도 상태 변경 카드를 기본정보에 통합하고 현재 상태 선택 및 변경 저장 동작을 정리.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 기본정보에 처리 상태 선택·변경 저장·안내 이메일·다시 열기와 결과 메시지 통합 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | 기존 회귀 테스트의 저장 버튼 이름 갱신 및 기본정보 포함·현재 상태 선택 확인 |

### 수정 상세

- 변경 전: 대화와 답변 작성 아래 별도 상태 변경 카드가 있고, 상태 선택은 빈 값으로 시작했다.
- 변경 후: 기본정보 안에 처리 상태 선택과 변경 저장 버튼을 배치한다. 데스크톱에서는 가로, 모바일에서는 세로로 표시하며 종료 상태의 안내 이메일 옵션과 다시 열기, 성공·경고 메시지도 같은 카드에 표시한다.
- 데이터 조회·답변 후 재조회·상태 저장·다시 열기 결과에 맞춰 선택 상태를 현재 상태로 동기화한다. 동일 상태 저장 방지, 답변 없는 종료 확인, 이메일 템플릿 발송 제한 및 포커스 처리는 유지한다.
- 이유: 문의의 속성인 상태를 기본정보에서 바로 관리해 불필요한 영역과 화면 이동을 줄인다.

### 복원 방법

`AdminInquiry_Modified.md`의 `HIST-20260908-001` 변경을 역적용하여 별도 상태 변경 카드와 상태별 버튼 문구, 빈 초기 선택값을 복원한다.

---

## HIST-20260904-001

- **날짜**: 2026-09-04
- **수정 범위**: 관리자 프론트엔드 / 문의 상세 타임라인
- **수정 개요**: 관리자 조회 시 사용자 메시지 라벨을 “사용자 답변”으로 표시하도록 타임라인 문구 문맥을 분기.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/InquiryTimeline.tsx` | 수정 | 타임라인 라벨 렌더링에 `context`를 추가하고 USER 라벨을 `내 답변`/`사용자 답변`으로 분기 |
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 관리자 문의 상세에서 `<InquiryTimeline context="ADMIN" />`로 렌더링 |
| `frontend/src/components/ui/InquiryTimeline.test.tsx` | 수정 | 사용자/관리자 라벨 분기 테스트 보강 |

### 수정 상세

- 기존에는 공용 타임라인 컴포넌트의 USER 라벨이 항상 “내 답변”이라 관리자 화면에서도 동일하게 표시됨.
- `InquiryTimeline`에 표시 목적 context를 전달하도록 변경해 `USER` 항목이 admin 화면에서는 “사용자 답변”으로 보이게 했고, 사용자 화면 동작은 그대로 “내 답변” 유지.

## HIST-20260901-001

- **날짜**: 2026-09-01
- **수정 범위**: 관리자 프론트엔드 / 문의 상태 변경 문구
- **수정 개요**: 문의 상태별 변경 버튼과 성공 메시지를 유한 문구 표로 제공해 `검토 중으로 변경` 조사를 올바르게 표시한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 6개 문의 상태의 action·success 완성 문구 표 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | `검토 중으로 변경` 버튼과 성공 문구 회귀 테스트 추가 |

### 수정 상세

#### 상태별 완성 문구
- 변경 전: 상태 표시명 뒤에 `로`를 일괄 결합해 `검토 중로 변경`, `상태를 검토 중로 변경했습니다.`가 표시됐다.
- 변경 후: `Record<InquiryStatus, { action, success }>`로 여섯 상태의 완성 문구를 정의하고 일반 변경과 다시 열기 성공에 함께 사용한다.
- 이유: 한국어 조사가 상태명에 따라 달라지는 문제를 문자열 조합이 아닌 유한 도메인 문구로 해결하기 위해서다.

### 검증

- RED: 신규 테스트가 `검토 중으로 변경` 버튼을 찾지 못하고 기존 `검토 중로 변경` 출력을 확인했다.
- GREEN: 문의 상세를 포함한 focused 5 suites, 43 tests 통과.
- 전체 Jest 33 suites/168 tests, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. build의 기존 viewport metadata 경고만 재현됐다.

### 복원 방법

이 ID(`AdminInquiry_Modified.md` 기준 HIST-20260901-001)로 복원 시 `STATUS_CHANGE_TEXT`와 신규 문구 테스트를 제거하고 `INQUIRY_STATUS_LABEL` 뒤에 조사를 직접 결합하는 방식으로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-005

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 상태 성공 포커스 처리
- **수정 개요**: 답변 없는 종료 확인이 성공해 기존 상태 변경 버튼이 제거되면 접근 가능한 상태 성공 메시지로 포커스를 한 번 이동하도록 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 상태 성공 메시지 ref·tabIndex 및 성공 대체 포커스 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | deferred 성공 응답의 대체 포커스·role·호출 횟수 검증 추가 |

### 수정 상세

#### 답변 없는 종료 성공 포커스
- 변경 전: 종료 상태 성공 응답이 기존 상태 변경 trigger를 제거하면 요청 종료 effect가 보류 ref만 해제하고 포커스는 `body`에 남았다.
- 변경 후: 활성 원 trigger가 없으면 `role="status"`, `tabIndex={-1}`을 유지하는 상태 성공 메시지를 논리적 대체 대상으로 한 번 포커스한다. 실패는 활성 원 trigger, 취소·Escape는 dialog cleanup에서 원 trigger로 복귀한다.
- 이유: 비동기 종료 성공 뒤에도 키보드·보조기기 사용자가 상태 변경 결과를 즉시 인지하고 다음 탐색 위치를 잃지 않도록 하기 위해서다.

### 검증

- RED: 문의 상세 1 suite, 17 tests 중 신규 성공 포커스 테스트 1 failed/16 passed. 성공 메시지는 표시됐지만 `document.activeElement`가 `body`에 남음을 확인했다.
- GREEN: 문의 상세 focused 1 suite, 17 tests passed.
- 문의 소비 경로 회귀 6 suites, 44 tests passed 및 `npx tsc --noEmit` exit 0.

### 복원 방법

이 ID(`AdminInquiry_Modified.md` 기준 HIST-20260831-005)로 복원 시 상태 성공 메시지 ref·tabIndex와 대체 포커스 분기, deferred 성공 포커스 테스트를 제거한다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-004

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 상태 확인 포커스 복귀
- **수정 개요**: 답변 없는 종료 확인 후 상태 요청이 끝나 활성화된 상태 변경 버튼으로 포커스를 한 번만 복귀하도록 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 확인 요청 중 포커스 복귀 보류 및 요청 종료 후 1회 복귀 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | deferred 실패 요청과 취소 경로의 활성 trigger 포커스·호출 횟수 검증 추가 |

### 수정 상세

#### 답변 없는 종료 확인 포커스
- 변경 전: 확인 버튼을 누르면 dialog cleanup이 `updatingStatus=true`로 비활성화된 상태 변경 버튼에 즉시 포커스를 시도하고, 요청 종료 뒤에는 다시 시도하지 않아 포커스가 `body`에 남았다.
- 변경 후: 확인 경로만 포커스 복귀를 요청 종료까지 보류하고 `updatingStatus=false`가 된 뒤 연결되어 있고 활성화된 trigger에 한 번 포커스한다. Escape·취소 경로는 기존처럼 dialog cleanup에서 즉시 한 번 복귀한다.
- 이유: 비동기 요청 중 비활성 요소에 포커스를 잃지 않고 성공·실패·취소 경로에서 중복 포커스를 방지하기 위해서다.

### 검증

- RED: 문의 상세 1 suite, 16 tests 중 신규 포커스 테스트 1 failed/15 passed. 요청 실패 후 버튼은 활성화됐지만 `document.activeElement`가 `body`에 남음을 확인했다.
- GREEN: 문의 상세 focused 1 suite, 16 tests passed.
- 문의 소비 경로 회귀 6 suites, 43 tests passed 및 `npx tsc --noEmit` exit 0.

### 복원 방법

이 ID(`AdminInquiry_Modified.md` 기준 HIST-20260831-004)로 복원 시 요청 종료 포커스 보류 ref/effect와 deferred 실패 포커스 테스트를 제거하고, dialog cleanup의 즉시 trigger 포커스 동작으로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-003

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 상태 변경 상호작용
- **수정 개요**: 이메일 발송 이력 요청 경합을 차단하고 답변 없는 종료 dialog의 접근성·승인 요청 snapshot을 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 발송 이력 request generation, 종료 pending snapshot, focus trap·Escape·inert·focus 복귀 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | deferred 응답 순서와 dialog keyboard/focus·고정 요청 회귀 테스트 추가 |

### 수정 상세

#### 이메일 발송 이력 요청 경합
- 변경 전: 최초 이력 요청과 QUEUED 후 재조회가 겹치면 완료 순서와 무관하게 각 응답이 data·error·loading을 갱신해 오래된 이력이 최신 화면을 덮을 수 있었다.
- 변경 후: 요청마다 증가하는 generation을 부여하고 최신 generation만 이력 data·error·loading을 반영하며 effect cleanup에서도 이전 요청을 무효화한다.
- 이유: 비동기 응답 순서가 화면의 최신 상태를 역전하지 못하게 하기 위해서다.

#### 답변 없는 종료 확인
- 변경 전: dialog가 focus 이동·Tab 순환·Escape·배경 inert·focus 복귀를 제공하지 않았고 확인 시 공유 상태를 다시 읽어 승인 후 바뀐 status/sendEmail을 제출할 수 있었다.
- 변경 후: dialog 개방 시 `{status,sendEmail}`을 pending snapshot으로 고정하고 취소 버튼 focus, Tab/Shift+Tab 경계 순환, Escape 취소, 배경 inert, 종료 후 trigger focus 복귀를 적용했다.
- 이유: 키보드 사용자가 dialog 안에서 안전하게 확인하고 최초 승인한 상태 변경만 제출하도록 하기 위해서다.

### 복원 방법

이 ID(`AdminInquiry_Modified.md` 기준 HIST-20260831-003)로 복원 시 delivery request generation과 pending 상태 요청을 제거하고, dialog focus·keyboard·inert effect 및 추가된 deferred/accessibility 테스트를 이전 상태로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

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
