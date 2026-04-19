## HIST-20260420-007

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 명언 관리
- **수정 개요**: 명언(Quote) CRUD API 추가 — 관리자용 CRUD + 사용자용 랜덤 조회

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/Quote.java | 추가 | 명언 엔티티 (content, author, use_yn, created_at) |
| repository/QuoteRepository.java | 추가 | findRandomActive() — PostgreSQL RANDOM() 사용 |
| dto/request/QuoteRequest.java | 추가 | content, author 입력 DTO |
| dto/response/QuoteResponse.java | 추가 | 명언 응답 DTO |
| service/QuoteService.java | 추가 | CRUD + getRandom + toggleUseYn |
| controller/AdminQuoteController.java | 추가 | GET/POST/PUT/PATCH(toggle)/DELETE 엔드포인트 |
| controller/UserQuoteController.java | 추가 | GET /api/user/quotes/random |
| exception/ErrorCode.java | 수정 | QUOTE_NOT_FOUND 추가 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/quotes` | 명언 목록 (페이징) |
| POST | `/api/admin/quotes` | 명언 등록 |
| PUT | `/api/admin/quotes/{id}` | 명언 수정 |
| PATCH | `/api/admin/quotes/{id}/toggle` | 사용여부 토글 |
| DELETE | `/api/admin/quotes/{id}` | 명언 삭제 |
| GET | `/api/user/quotes/random` | 랜덤 명언 1개 조회 |

### 복원 방법

HIST-20260420-007 복원 시:
- Quote.java, QuoteRepository.java, QuoteRequest.java, QuoteResponse.java, QuoteService.java, AdminQuoteController.java, UserQuoteController.java 삭제
- ErrorCode.java에서 QUOTE_NOT_FOUND 제거
