import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/ui/LegalPageLayout';
import { LEGAL_INFO } from '@/lib/legal';

export const metadata: Metadata = {
  title: '개인정보 요청 안내 | TPMP',
  robots: { index: false, follow: false },
};

export default function PrivacyRequestsPage() {
  return (
    <LegalPageLayout title="개인정보 요청 안내" description="열람·정정·삭제·처리정지·탈퇴 요청을 접수하는 방법입니다.">
      <section>
        <h2>로그인할 수 있는 경우</h2>
        <p><Link href="/user/inquiries/new">문의·요청 작성</Link>에서 일반 문의를 선택하고 아래 제목을 참고해 필요한 요청을 작성해 주세요.</p>
        <p className="mt-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">[개인정보 요청] 열람·정정·삭제·처리정지·탈퇴</p>
        <p>요청 종류와 대상 범위(계정, 학습 기록, 특정 문의·첨부 등), 정정이 필요한 경우 수정할 내용을 적어 주세요. 필요한 요청 종류만 선택해서 작성하면 됩니다.</p>
      </section>
      <section>
        <h2>로그인할 수 없는 경우</h2>
        {LEGAL_INFO.contactEmail ? (
          <p>담당 연락처 <a href={`mailto:${LEGAL_INFO.contactEmail}`}>{LEGAL_INFO.contactEmail}</a>로 요청 종류와 대상 범위를 알려 주세요.</p>
        ) : (
          <p>비로그인 연락처 준비 중입니다. 로그인할 수 없는 사용자의 접수 경로는 운영자 연락처 확정 후 안내합니다.</p>
        )}
      </section>
      <section>
        <h2>접수 후 처리</h2>
        <p>이 페이지에서 요청이 자동 제출되거나 자료가 자동 삭제되지는 않습니다. 접수 후 본인 확인과 요청 범위·처리 가능 여부를 확인하고, 실제 처리 결과를 별도로 안내해야 합니다. 문의 답변 또는 접수 알림이 개인정보 처리 완료를 의미하지는 않습니다.</p>
        <p>요청 처리 기간과 보관·삭제 기준은 아직 확정되지 않았습니다. 비밀번호나 신분증 사본을 문의에 첨부하지 마세요.</p>
      </section>
    </LegalPageLayout>
  );
}
