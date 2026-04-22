## HIST-20260420-013

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 테이블 관리 > DB 조회
- **수정 개요**: JdbcTemplate 기반 제네릭 DB 테이블 조회·추가·수정·삭제 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| controller/AdminDbTableController.java | 추가 | GET/POST/PUT/DELETE `/api/admin/db-tables/**` 엔드포인트 |

### 수정 상세

#### `controller/AdminDbTableController.java` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - `GET /api/admin/db-tables` → information_schema에서 public 스키마 테이블 목록 반환
  - `GET /api/admin/db-tables/{tableName}/columns` → 컬럼 메타정보 반환
  - `GET /api/admin/db-tables/{tableName}/rows?page&size` → 페이징 처리된 행 목록 반환
  - `POST /api/admin/db-tables/{tableName}/rows` → 행 삽입
  - `PUT /api/admin/db-tables/{tableName}/rows/{pk}` → id 기준 행 수정
  - `DELETE /api/admin/db-tables/{tableName}/rows/{pk}` → id 기준 행 삭제
  - 테이블명·컬럼명은 information_schema 기반 화이트리스트 검증 (SQL Injection 방지)
- 이유: 관리자가 직접 DB 데이터를 조회·수정할 수 있도록 제네릭 API 필요

### 복원 방법

HIST-20260420-013 복원 시:
- controller/AdminDbTableController.java 삭제
