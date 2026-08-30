import type { Inquiry, InquiryMessage } from '@/types';

type TimelineEntry = {
  id: number;
  authorRole: 'USER' | 'ADMIN' | 'SYSTEM';
  content: string;
  createdAt: string;
  imageUrls: string[];
  initial?: boolean;
};

export function getInquiryTimelineLabel(entry: Pick<TimelineEntry, 'authorRole' | 'initial'>): string {
  if (entry.initial) return '최초 문의';
  return {
    USER: '내 추가 문의',
    ADMIN: '관리자 답변',
    SYSTEM: '시스템',
  }[entry.authorRole];
}

export function buildInquiryTimeline(inquiry: Inquiry): TimelineEntry[] {
  const initial: TimelineEntry = {
    id: 0,
    authorRole: 'USER',
    content: inquiry.content,
    createdAt: inquiry.createdAt,
    imageUrls: inquiry.imageUrls ?? [],
    initial: true,
  };
  const messages: TimelineEntry[] = (inquiry.messages ?? [])
    .map((message: InquiryMessage) => ({ ...message }));
  return [initial, ...messages]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
}

export function InquiryTimeline({ inquiry }: { inquiry: Inquiry }) {
  return (
    <ol className="space-y-3">
      {buildInquiryTimeline(inquiry).map((entry) => (
        <li
          key={`${entry.initial ? 'initial' : 'message'}-${entry.id}`}
          className={`rounded-xl border p-4 ${
            entry.authorRole === 'ADMIN'
              ? 'border-indigo-100 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30'
              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
          }`}
        >
          <div className="mb-2 flex justify-between gap-3">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {getInquiryTimelineLabel(entry)}
            </span>
            <time className="text-xs text-gray-400">
              {entry.createdAt.slice(0, 16).replace('T', ' ')}
            </time>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {entry.content}
          </p>
          {entry.imageUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.imageUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 underline dark:text-indigo-400"
                >
                  첨부 이미지 {index + 1}
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
