import Link from 'next/link';

export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="정책 및 개인정보 안내" className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-300 ${className}`}>
      <Link href="/privacy" className="underline underline-offset-4">개인정보 처리방침</Link>
      <Link href="/terms" className="underline underline-offset-4">이용약관</Link>
      <Link href="/privacy/requests" className="underline underline-offset-4">개인정보 요청 안내</Link>
    </nav>
  );
}
