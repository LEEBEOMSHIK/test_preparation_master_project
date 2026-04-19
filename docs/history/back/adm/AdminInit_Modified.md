## HIST-20260420-009

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 데이터 초기화
- **수정 개요**: 테스트 사용자 계정(user@tpmp.com) 자동 생성 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| config/DataInitializer.java | 수정 | ensureTestUser() 메서드 추가, run()에서 호출 |

### 수정 상세

#### `DataInitializer.java`
- 변경 전: 관리자 계정(admin@tpmp.com)만 초기 생성
- 변경 후: 테스트 사용자 계정 추가 생성
  - 이메일: user@tpmp.com
  - 비밀번호: User1234!
  - 이름: 테스트 사용자
  - 역할: USER

### 복원 방법

HIST-20260420-009 복원 시:
- DataInitializer.java에서 TEST_USER_* 상수, ensureTestUser() 메서드, run()의 ensureTestUser() 호출 제거
