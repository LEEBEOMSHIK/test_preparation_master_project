const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** HTML 태그와 엔티티를 제거하고 순수 텍스트만 반환한다. 목록/미리보기 영역에서 사용. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, (m) => HTML_ENTITIES[m] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}
