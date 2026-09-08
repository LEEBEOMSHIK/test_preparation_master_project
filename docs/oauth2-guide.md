# Google 로그인 설정 및 공개 전 점검

확인일: 2026-09-09. 이 문서는 현재 TPMP의 Spring Security 서버 리디렉션 방식 기준이다. Gmail SMTP 설정과 Google 로그인 설정은 별개다.

## 1. 먼저 알아둘 사항

- Gmail SMTP의 앱 비밀번호는 메일 발송용이다. `GOOGLE_CLIENT_SECRET`에 앱 비밀번호를 넣지 않는다.
- 현재 로컬에서 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 미설정으로 Google 화면의 `401 invalid_client`를 확인했다.
- Google 인증 설정만으로 공개 준비가 끝나지 않는다. 아래 보안·정책 점검까지 완료해야 한다.

## 2. Google Cloud에서 로그인 앱 준비

1. [Google Cloud Console](https://console.cloud.google.com/)에서 TPMP 프로젝트를 생성하거나 선택한다. 개발과 운영 프로젝트를 분리하면 테스트 설정이 운영에 섞이는 것을 줄일 수 있다.
2. **Google Auth Platform → Branding(브랜딩)**에서 앱 이름 `TPMP`, 사용자 지원 이메일, 개발자 연락처를 등록한다. 이메일은 실제 관리할 주소를 선택한다.
3. **Audience(대상)**는 일반 Gmail 이용자에게 서비스할 경우 External(외부)을 선택한다. 개발 중에는 테스트 상태로 두고 사용할 계정을 테스트 사용자에 등록한다. 실제 표시되는 테스트 사용자 제한은 요청 범위와 계정 정책에 따라 확인한다.
4. **Data Access(데이터 액세스)**에서 로그인 식별에 필요한 이메일/기본 프로필 범위만 검토한다. 현재 백엔드는 `email`, `profile`을 요청한다. Gmail API 전체 접근이나 메일 읽기 권한은 필요하지 않다.
5. **Clients(클라이언트) → Create client**에서 **Web application(웹 애플리케이션)**을 선택하고 이름을 `TPMP Local`로 지정한다.
6. 승인된 리디렉션 URI에 아래 로컬 백엔드 콜백을 정확히 등록한다.

```text
http://localhost:8080/api/login/oauth2/code/google
```

현재 방식은 서버 리디렉션이므로 JavaScript origins 입력은 로그인 성립의 필수 항목이 아니다. 향후 Google Identity Services 브라우저 SDK를 사용하면 그 방식에 맞게 등록한다. `http://localhost:3000/auth/oauth/callback`은 Google에 등록할 백엔드 콜백과 다르다.

7. 생성된 Client ID와 Client Secret을 안전하게 보관한다. Client Secret은 프론트 소스, `NEXT_PUBLIC_*`, 채팅 또는 Git에 넣지 않는다.

공식 근거: [서버 웹 애플리케이션 OAuth 설정](https://developers.google.com/identity/protocols/oauth2/web-server), [운영 정책 준수](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).

## 3. 로컬 환경변수 입력

프로젝트 루트 `.env`의 기존 동일 항목을 수정한다. 중복 행을 추가하지 않는다. 아래 값은 예시이며 실제 발급값으로 교체한다.

```dotenv
GOOGLE_CLIENT_ID=발급받은클라이언트ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=발급받은클라이언트시크릿
GOOGLE_OAUTH2_REDIRECT_URI=http://localhost:8080/api/login/oauth2/code/google
OAUTH2_FRONTEND_REDIRECT_URI=http://localhost:3000/auth/oauth/callback
ALLOWED_ORIGINS=http://localhost:3000
APP_PUBLIC_URL=http://localhost:3000
```

| 항목 | 역할 |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google이 TPMP 서버를 식별하는 자격증명 |
| `GOOGLE_OAUTH2_REDIRECT_URI` | Google 인증 결과를 받는 백엔드 주소. 콘솔의 승인된 URI와 일치해야 함 |
| `OAUTH2_FRONTEND_REDIRECT_URI` | 백엔드 로그인 처리 뒤 이동할 프론트 주소 |
| `ALLOWED_ORIGINS` | 백엔드가 허용하는 프론트 Origin |
| `APP_PUBLIC_URL` | 안내 메일 등에 들어갈 서비스 링크 기준 주소 |

## 4. 환경변수를 로드하고 백엔드 재시작

Spring Boot/Gradle은 루트 `.env`를 자동으로 읽지 않는다. `.env`를 수정하고 단순히 `gradlew bootRun`만 실행하면 새 값이 반영되지 않을 수 있다.

- IDE: 백엔드 실행 구성의 환경변수에 위 값을 넣고 재시작한다.
- 기존 로컬 실행 흐름: 루트 `.env`를 환경변수로 로드한 뒤 `backend/gradlew.bat bootRun --args=--spring.profiles.active=local`을 실행한다.
- Bash 사용 환경: 기존 `backend/run-dev.sh`가 루트 `.env`를 로드한다. Bash 및 Java 실행 환경이 구성된 경우에 사용한다.
- 현재 로컬 DB는 55432 포트이므로 재시작 시 `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:55432/tpmp`도 기존대로 유지한다. 기본 local 설정은 5432라 이 override를 누락하면 DB 연결이 실패할 수 있다.
- 프론트는 3000을 유지한다. OAuth 서버 환경변수만 변경했다면 프론트 재시작은 필요하지 않다.

## 5. 실제 로그인 확인

1. `http://localhost:3000/user/login`에서 Google 로그인 버튼을 누른다.
2. Google 계정 선택/앱 접근 안내에서 프로젝트 이름과 요청 정보가 의도한 것인지 확인한다.
3. 사용자 본인이 인증·필요한 승인을 완료한다.
4. TPMP로 돌아와 첫 이용자는 온보딩, 기존 이용자는 사용자 화면으로 이동하는지 확인한다.
5. 새로고침·로그아웃·다시 로그인 및 관리자 세션과의 분리를 확인한다.

첫 Google 인증 성공 시 TPMP 계정이 자동 생성되며 이메일·이름·Google 계정 식별자가 저장된다. 별도 가입 폼을 없애도 이 개인정보 처리는 남는다. 정상 로그인까지 확인하기 전에는 302 리디렉션 성공만으로 테스트 완료로 판단하지 않는다.

| 증상 | 우선 확인 |
|---|---|
| `401 invalid_client` | Client ID 미설정(`not_configured`), 다른 프로젝트/삭제된 클라이언트, 환경변수 미반영 |
| `redirect_uri_mismatch` | 콘솔 URI와 `GOOGLE_OAUTH2_REDIRECT_URI`의 프로토콜·호스트·포트·경로 일치 |
| `access_denied` / 테스트 계정 제한 | Audience·테스트 사용자·사용자 승인/조직 정책 |
| Google 인증 후 TPMP 오류 | 백엔드 콜백 로그·권한 조회·쿠키·프론트 콜백/API 연결 |

## 6. 운영 도메인 등록

`yourdomain.example`은 설명용이다. 실제 소유/관리하는 도메인으로 대체한다.

```dotenv
GOOGLE_OAUTH2_REDIRECT_URI=https://yourdomain.example/api/login/oauth2/code/google
OAUTH2_FRONTEND_REDIRECT_URI=https://yourdomain.example/auth/oauth/callback
ALLOWED_ORIGINS=https://yourdomain.example
APP_PUBLIC_URL=https://yourdomain.example
```

Google 콘솔에도 같은 HTTPS 백엔드 콜백을 등록한다. 프론트와 백엔드 도메인이 다르면 각 변수는 실제 외부 접근 주소에 맞춘다.

브랜딩에는 접근 가능한 홈페이지와 개인정보처리방침(`/privacy`), 이용약관(`/terms`) URL을 등록하고 필요한 도메인 소유 확인을 진행한다. 로컬 주소나 초안 문서를 운영 검증용 최종 정책으로 제출하지 않는다. 기본 프로필 범위만 쓴다는 이유로 모든 앱 검증이 불필요하다고 단정하지 말고 콘솔의 게시/브랜딩/범위 검증 상태를 확인한다.

공식 근거: [Google OAuth 정책](https://developers.google.com/identity/protocols/oauth2/policies).

## 7. 공개 전에 남은 점검

현재 정책 페이지는 공개 전 검토용 초안이다. 아래 항목을 문서와 실제 운영 절차에서 함께 확정한다.

- 운영자명은 이범식, 개인정보 문의 이메일은 bumcity137@gmail.com으로 확정했다. 실제 운영 도메인과 적용일은 미정이다.
- 수집·이용 목적과 법적 근거, 불필요한 이름 수집 최소화, 데이터 종류별 보유기간.
- 열람·정정·삭제·처리정지·탈퇴 요청의 본인 확인과 관리자 처리 절차. 문의 접수는 실제 계정 삭제가 아니다.
- 회원정보 외 문의 내용/이미지, 메일 발송 이력/본문, 로그, 백업까지 파기·보존 범위.
- Gmail SMTP, 호스팅 및 선택적 외부 연동의 처리위탁·국외이전 여부/항목/국가/기간/법적 근거. 확인 전 정보를 임의로 작성하지 않는다.
- 이용 대상은 만 14세 이상으로 확정했으며 만 14세 미만은 허용하지 않는다. 정책 안내와 별개로 가입·로그인 과정의 연령 확인 및 서버 측 제한은 추가 구현·검증이 필요하다. 현재 안내만으로 연령 제한이 강제되지는 않는다.
- Google OAuth 성공 핸들러의 LAZY 권한 조회 가능성, 검증되지 않은 이메일 자동 계정 연결, 기존 LOCAL 비밀번호 유지 정책.
- URL 쿼리로 Access Token 전달하는 현재 방식 개선 및 운영 HTTPS·Secure/SameSite 쿠키 설정.
- Google-only 전환 시 UI뿐 아니라 공개 가입 API, 기존 LOCAL 계정 전환, 관리자 로그인 경로까지 검증.

화면 추가만으로 위 항목이 구현되거나 법적 적합성이 확정되는 것은 아니다. 개인정보처리방침 공개와 수집·이용의 법적 근거는 구분한다. 자동 동의 간주 문구로 대체하지 않는다.

참고: [개인정보 보호법 제15조](https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1022694549), [제30조](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1033215151), [아동의 개인정보 보호](https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1020398523).
