import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPMP - 시험 준비 마스터',
  description: '시험 준비와 개념 정리를 위한 서비스',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
