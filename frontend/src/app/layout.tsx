import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'TPMP - 시험 준비 마스터',
  description: '시험 준비와 개념 정리를 위한 서비스',
  viewport: 'width=device-width, initial-scale=1',
};

// Inline script prevents flash of wrong theme before React hydrates
const themeScript = `(function(){try{var s=localStorage.getItem('tpmp-theme');var t=s?JSON.parse(s)?.state?.theme:'system';if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
