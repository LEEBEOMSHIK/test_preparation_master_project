## HIST-20260915-001

- **날짜**: 2026-09-15
- **수정 범위**: 사용자 백엔드 / 공용 로컬 DB 연결
- **수정 개요**: Windows PostgreSQL과 충돌하지 않도록 TPMP 로컬 DB의 호스트 포트를 55432로 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| docker-compose.local.yml | 수정 | DB 호스트 공개 주소를 127.0.0.1:55432로 제한 |
| backend/src/main/resources/application-local.yml | 수정 | 로컬 JDBC 연결 포트를 55432로 일치 |

### 수정 상세

- Compose 변경 전: `5432:5432`, 변경 후: `127.0.0.1:55432:5432`.
- 로컬 JDBC 변경 전: `jdbc:postgresql://localhost:5432/tpmp`, 변경 후: `jdbc:postgresql://localhost:55432/tpmp`.
- 이유: Windows PostgreSQL의 5432 접속과 분리하고 개발 DB의 외부 네트워크 공개를 방지한다.
- 컨테이너 내부 포트 5432, 기존 데이터 볼륨, 계정 및 암호 설정은 유지한다. 동일 볼륨을 사용하는 다른 컨테이너는 동시에 실행하지 않는다.
- 검증: Compose 정규화 설정의 공개 주소·포트 검사에서 수정 전 실패(RED), 수정 후 동일 검사와 로컬 JDBC 포트 일치 검사 통과(GREEN). `git diff --check` 통과. 런타임 DB·백엔드 기동 검증은 메인 작업에서 별도 수행한다.

### 복원 방법

`LocalDatabase_Modified.md`의 `HIST-20260915-001` 기준 두 설정을 변경 전 값으로 되돌린다. 5432를 사용하는 Windows PostgreSQL과의 충돌을 먼저 해소해야 한다. 볼륨은 삭제하지 않는다.
