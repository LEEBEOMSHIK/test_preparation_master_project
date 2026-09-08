# 공개 개인정보 안내 구현 계획

**목표:** Google 로그인 설정을 상세히 설명하고 개인정보 안내·권리 요청 페이지 및 로그인 전후 진입점을 추가한다.

**사용자 승인 범위:** 로그인 설정 상세 안내 및 공개 준비 부족에 관한 화면/내용 추가. 운영자명·연락처·도메인·연령은 질문 중이며, 확정되지 않은 정책을 약정으로 표시하지 않는다.

**구조:** 공개 정적 서버 페이지 3개와 공용 링크/레이아웃. 기존 문의 작성으로 개인정보 관련 요청을 전달한다. 이번 작업에서는 계정 삭제·동의 저장·OAuth 보안 로직을 변경하지 않는다.

**기술:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, Jest.

## 작업 및 경계

- [x] 공개 페이지: `frontend/src/lib/legal.ts`, `components/ui/LegalLinks.tsx`, `LegalPageLayout.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/privacy/requests/page.tsx`.
  - 인터페이스: `LegalLinks({ className? })`, `LegalPageLayout({ title, description?, children })` named export.
  - 정책 설정은 nullable 공개 정보만 보유, 미정 정보는 초안 배너로 구분한다.
  - 실제 수집 항목과 처리 목적·Gmail SMTP 전달·보유기간 확정 필요·권리 요청을 설명한다.
  - 세 페이지는 `robots: { index: false, follow: false }`, 인증 없이 접근 가능해야 한다.
  - 연락처 미확정일 때 임의 메일 주소를 노출하지 않는다. 문의 요청이 실제 탈퇴/삭제 완료인 것처럼 표현하지 않는다.
- [x] 진입점: `app/user/login/page.tsx`, `app/page.tsx`, `components/layout/UserLayoutShell.tsx`, `app/auth/signup/page.tsx`.
  - 최초 Google 로그인 자동계정 생성, 이메일·이름·Google 식별자 사용을 안내한다.
  - 공통 `LegalLinks`를 사용하고 모바일 하단 메뉴에 가려지지 않게 배치한다.
  - 기존 비밀번호 로그인은 Google 자격증명 부재 상황에서 유지한다. Google-only 전환 완료를 주장하지 않는다.
- [x] 기존 `docs/oauth2-guide.md`를 최신 콘솔과 실제 프로젝트 설정에 맞춰 갱신했다.
  - 클라이언트 생성/브랜딩/테스트 계정/개발 콜백과 프론트 URL 구분/운영 URL/재시작/오류별 진단을 포함한다.
  - SMTP 앱 비밀번호와 Google OAuth Secret을 명확히 구분하고 실제 비밀값은 기록하지 않는다.
- [x] 공용 자산 AGENTS 표, 히스토리 및 CURRENT 갱신.

## 검증

- 정적: 인증 없는 경로, 초안 상태, 실제 동작과 문구 일치, 비밀정보 부재, 공통 링크 목적지 확인.
- 동적: 관련 Jest(공개 링크·연락처 미설정·자동삭제 오인 방지·로그인 안내), `npx tsc --noEmit`.
- 최종: Next.js 빌드 1회(실행 중 dev .next와 충돌하지 않는 별도 산출물 경로), 브라우저 비로그인 정책/요청/로그인 화면 확인.
- Google 로그인 성공은 Client ID/Secret 설정과 실제 인증 전까지 미검증으로 유지한다.

## 보존 및 남은 조건

기존 문의 상세/테스트/히스토리 미커밋 수정과 `.env` 비밀값을 보존한다. 운영자·보유기간·삭제 처리·국외이전·연령 확정 및 OAuth 보안 개선은 공개 준비 완료의 별도 조건이다. 커밋·푸시는 요청되지 않았다.
