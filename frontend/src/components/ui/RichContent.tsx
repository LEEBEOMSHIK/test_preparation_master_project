'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';

interface Props {
  html: string;
  className?: string;
}

/**
 * RichTextEditor(react-quill)로 작성된 HTML 콘텐츠를 렌더링한다.
 * 에디터 출력이 필요한 모든 표시 영역에서 이 컴포넌트를 사용한다.
 */
export function RichContent({ html, className = '' }: Props) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    setSanitizedHtml(DOMPurify.sanitize(html));
  }, [html]);

  return (
    <div
      className={[
        'leading-relaxed break-words',
        '[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:block',
        '[&_p]:mb-1',
        '[&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:pl-5',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2',
        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-1.5',
        '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1',
        '[&_a]:text-indigo-600 [&_a]:underline [&_a]:break-all',
        // 코드 블록(<pre>)을 어두운 박스로 분리 — 지문(<p>)과 상하 여백으로 명확히 구분
        '[&_pre]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words',
        '[&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words',
        '[&_pre]:bg-gray-900 [&_pre]:text-gray-100',
        '[&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-3',
        '[&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:font-mono',
        '[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto',
        className,
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
