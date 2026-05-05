interface Props {
  html: string;
  className?: string;
}

/**
 * RichTextEditor(react-quill)로 작성된 HTML 콘텐츠를 렌더링한다.
 * 에디터 출력이 필요한 모든 표시 영역에서 이 컴포넌트를 사용한다.
 */
export function RichContent({ html, className = '' }: Props) {
  return (
    <div
      className={[
        'leading-relaxed',
        '[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:block',
        '[&_p]:mb-1',
        '[&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:pl-5',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2',
        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-1.5',
        '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1',
        '[&_a]:text-indigo-600 [&_a]:underline',
        className,
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
