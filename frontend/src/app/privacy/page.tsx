import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/ui/LegalPageLayout';
import { LEGAL_INFO } from '@/lib/legal';

export const metadata: Metadata = {
  title: '개인정보 처리방침 초안 | TPMP',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="개인정보 처리방침 초안" description="현재 기능에서 다루는 개인정보와 공개 전 확정이 필요한 사항을 안내합니다.">
      <section>
        <h2>1. 운영 및 연락처</h2>
        <p>운영자: {LEGAL_INFO.operatorName ?? '확정 전'} · 공식 서비스 주소: {LEGAL_INFO.serviceUrl ?? '확정 전'}</p>
        <p>개인정보 담당 연락처: {LEGAL_INFO.contactEmail ?? '비로그인 연락처 준비 중'}</p>
        <p>{LEGAL_INFO.minimumAge === null
          ? '이용 가능 최소 연령과 아동 개인정보 처리 기준은 아직 확정하지 않았습니다.'
          : `만 ${LEGAL_INFO.minimumAge}세 이상만 이용할 수 있으며, 만 ${LEGAL_INFO.minimumAge}세 미만은 이용할 수 없습니다.`}</p>
      </section>
      <section>
        <h2>2. 처리하는 정보와 목적</h2>
        <ul>
          <li>현재 로컬 회원가입과 기존 로컬 계정 로그인도 지원합니다. 이름과 이메일을 계정 생성·식별에 사용하며, 로컬 계정의 비밀번호는 원문이 아닌 해시 형태로 저장하여 인증에 사용합니다.</li>
          <li>Google 로그인에서 이메일, 이름, Google 계정 식별자(sub)를 받아 계정 생성·식별과 로그인에 사용합니다. 최초 로그인 시 서비스 계정이 자동 생성됩니다. 이름 수집의 필요성과 최소화 방안은 공개 전 검토합니다.</li>
          <li>학습 기능을 사용하면 관심 시험, 풀이·학습 기록, 작성한 개념 노트 등 해당 기능의 기록을 서비스 제공에 사용합니다.</li>
          <li>문의·요청을 등록하면 문의 내용, 답변, 첨부 이미지 등을 접수·답변·처리에 사용합니다. 안내 이메일 발송 이력에는 수신 주소, 제목, 본문과 발송 결과 등이 포함될 수 있습니다.</li>
          <li>로그인 IP 등 접속 기록은 로그인 이력 및 서비스 보안 확인에 사용됩니다. 구체적인 기록 항목·보유기간은 공개 전 확인합니다.</li>
        </ul>
        <p>각 처리의 법적 근거, 필수·선택 항목 구분과 필요한 동의 절차는 확정 전입니다.</p>
      </section>
      <section>
        <h2>3. 브라우저 저장 정보</h2>
        <p>로그인 세션 유지에는 쿠키와 sessionStorage를 사용하며, 테마 등 환경설정과 일부 로컬 학습 도구의 기록은 localStorage에 저장될 수 있습니다. 브라우저 저장 정보를 지우면 로그인이나 해당 로컬 기록이 초기화될 수 있으며, 서버에 저장된 기록이 함께 삭제되는 것은 아닙니다.</p>
      </section>
      <section>
        <h2>4. 외부 서비스 처리</h2>
        <p>Google은 로그인 인증을 제공합니다. Gmail SMTP를 통한 이메일 발송 시 수신 주소와 메일 내용 등이 Google에 전달됩니다. 개인정보 처리위탁 해당 여부와 수탁자 정보, 국외이전 국가·항목·시점·방법·보유기간·근거 및 거부 방법은 아직 확정하지 않았습니다.</p>
        <p>선택적으로 사용하는 Notion 연동이나 AI 기능도 기능별 외부 처리 대상·제공자·전송 정보와 조건을 확인해야 합니다. 모든 사용자의 모든 학습 정보가 항상 전송된다는 의미는 아니며, 공개 전 실제 사용 조건에 맞는 안내를 마련해야 합니다.</p>
      </section>
      <section>
        <h2>5. 보유기간과 삭제</h2>
        <p>계정·학습 기록·문의 및 첨부·발송 이력·접속 기록의 보유기간, 파기 방식과 백업 처리 기준은 미확정입니다. 탈퇴 또는 삭제 요청만으로 모든 자료가 즉시 자동 삭제되는 것으로 안내하지 않습니다. 요청 범위와 처리 가능 여부를 확인한 뒤 처리 결과를 안내해야 합니다.</p>
      </section>
      <section>
        <h2>6. 개인정보 관련 요청</h2>
        <p>열람·정정·삭제·처리정지·탈퇴 요청 방법은 <Link href="/privacy/requests">개인정보 요청 안내</Link>에서 확인할 수 있습니다. 접수와 실제 처리 완료는 구분됩니다.</p>
      </section>
    </LegalPageLayout>
  );
}
