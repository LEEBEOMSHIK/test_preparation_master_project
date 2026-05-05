/** HTML 태그를 제거하고 순수 텍스트만 반환한다. 목록/미리보기 영역에서 사용. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}
