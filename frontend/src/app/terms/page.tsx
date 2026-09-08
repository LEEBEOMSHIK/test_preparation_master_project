import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/ui/LegalPageLayout';
import { LEGAL_INFO } from '@/lib/legal';

export const metadata: Metadata = {
  title: '이용약관 초안 | TPMP',
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="이용약관 초안" description="서비스 이용에 관한 기본 안내입니다. 확정된 약관에 대한 동의를 받는 화면이 아닙니다.">
      <section><h2>1. 서비스 소개</h2><p>TPMP는 시험 준비, 문항 풀이와 개념 정리를 돕는 학습 보조 서비스입니다. 학습 자료와 AI 결과에는 오류가 있을 수 있으므로 중요한 내용은 시험 주관기관의 공식 자료 등과 확인해 주세요.</p></section>
      <section><h2>2. 계정과 보안</h2><p>Google 로그인으로 서비스 계정을 생성하고 이용할 수 있습니다. 타인의 계정을 사용하거나 계정 접근 수단을 공유하지 말고, 공용 기기에서는 이용 후 로그아웃해 주세요. 계정 도용이 의심되면 문의를 통해 알려 주세요.</p><p>{LEGAL_INFO.minimumAge !== null && `만 ${LEGAL_INFO.minimumAge}세 이상만 이용할 수 있으며, 만 ${LEGAL_INFO.minimumAge}세 미만은 이용할 수 없습니다.`}</p></section>
      <section><h2>3. 금지 행위</h2><p>타인의 개인정보나 계정을 무단 이용하거나, 서비스 운영을 방해하거나, 악성 파일을 올리거나, 권한 없이 데이터에 접근하는 행위는 허용되지 않습니다. 문의와 게시 자료에 타인의 권리를 침해하는 내용을 올리지 마세요.</p></section>
      <section><h2>4. 자료와 저작권</h2><p>사용자가 작성하거나 첨부하는 자료는 적법하게 이용할 수 있는 자료여야 합니다. 시험 문제 등 외부 자료의 권리는 해당 권리자에게 있을 수 있으며, 서비스 이용이 재배포 권한을 부여하지는 않습니다. 사용자 작성물의 서비스 내 이용 범위와 보관·삭제 조건은 공개 전 확정합니다.</p></section>
      <section><h2>5. 문의와 이용 종료</h2><p>로그인 후 문의·요청 메뉴에서 문의할 수 있습니다. 개인정보 관련 요청과 탈퇴 요청은 <Link href="/privacy/requests">개인정보 요청 안내</Link>를 확인해 주세요. 요청 접수만으로 계정이나 모든 자료가 자동 삭제되는 것은 아닙니다.</p></section>
      <section><h2>6. 서비스 및 약관 변경</h2><p>서비스 변경 사항은 패치노트 등 안내 창구를 통해 확인할 수 있습니다. 약관의 시행일, 변경 공지 기간과 방식, 이용 제한 및 이의 제기 절차는 공개 전 확정하고 안내해야 합니다. 이 초안으로 법령상 이용자의 권리를 제한하거나 운영자의 책임을 일괄 면제하지 않습니다.</p></section>
    </LegalPageLayout>
  );
}
