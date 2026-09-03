import type { Inquiry, InquiryMessage } from '@/types';

type TimelineEntry = {
  id: number;
  authorRole: 'USER' | 'ADMIN' | 'SYSTEM';
  content: string;
  createdAt: string;
  imageUrls: string[];
  initial?: boolean;
};

type InquiryTimelineContext = 'USER' | 'ADMIN';

export function getInquiryTimelineLabel(
  entry: Pick<TimelineEntry, 'authorRole' | 'initial'>,
  context: InquiryTimelineContext = 'USER',
): string {
  if (entry.initial) return '최초 문의';
  return {
    USER: context === 'USER' ? '내 답변' : '사용자 답변',
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

type InquiryThread = {
  rootId: string;
  root: TimelineEntry;
  replies: TimelineEntry[];
};

type InquiryTimelineLayout = {
  initial: TimelineEntry[];
  threads: InquiryThread[];
  standalone: TimelineEntry[];
};

function buildInquiryTimelineLayout(inquiry: Inquiry): InquiryTimelineLayout {
  const entries = buildInquiryTimeline(inquiry);
  const initial = entries.filter((entry) => entry.initial);
  const conversationEntries = entries.filter((entry) => !entry.initial);

  const threads: InquiryThread[] = [];
  const standalone: TimelineEntry[] = [];

  for (const entry of conversationEntries) {
    if (entry.authorRole === 'ADMIN') {
      threads.push({
        rootId: `thread-${entry.id}-${entry.createdAt}`,
        root: entry,
        replies: [],
      });
      continue;
    }

    if (threads.length === 0) {
      standalone.push(entry);
      continue;
    }

    threads[threads.length - 1].replies.push(entry);
  }

  return { initial, threads, standalone };
}

function getTimelineCardClass(authorRole: 'USER' | 'ADMIN' | 'SYSTEM', isNested = false): string {
  if (authorRole === 'ADMIN') {
    return 'border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30';
  }
  if (authorRole === 'SYSTEM') {
    return 'border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900';
  }
  return isNested
    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900';
}

function getTimelineBadgeClass(authorRole: 'USER' | 'ADMIN' | 'SYSTEM'): string {
  if (authorRole === 'ADMIN') return 'bg-indigo-600 text-white';
  if (authorRole === 'SYSTEM') return 'bg-gray-600 text-white';
  return 'bg-emerald-600 text-white';
}

export function InquiryTimeline({ inquiry, context = 'USER' }: { inquiry: Inquiry; context?: InquiryTimelineContext }) {
  const { initial, threads, standalone } = buildInquiryTimelineLayout(inquiry);

  if (initial.length === 0 && threads.length === 0 && standalone.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
        표시할 타임라인 항목이 없습니다.
      </div>
    );
  }

  const renderEntry = (entry: TimelineEntry, options: { nested?: boolean; noCardTitle?: boolean } = {}) => {
    const { nested = false, noCardTitle = false } = options;
    return (
      <li
        key={`${entry.initial ? 'initial' : 'message'}-${entry.id}-${entry.createdAt}`}
        className={`rounded-xl border p-4 ${getTimelineCardClass(entry.authorRole, nested)}`}
      >
        <div className="mb-2 flex justify-between gap-3">
          {!noCardTitle && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {getInquiryTimelineLabel(entry, context)}
            </span>
          )}
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
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-gray-500 px-2 py-1 text-xs font-semibold text-white">타임라인</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">문의 흐름</h3>
        </div>
        <ol className="space-y-4">
          {initial.map((entry) => renderEntry(entry))}
        </ol>
      </div>

      {threads.length > 0 && (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={thread.rootId} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getTimelineBadgeClass(thread.root.authorRole)}`}>
                  관리자 답변
                </span>
                <span className="text-xs text-gray-500">
                  {thread.root.createdAt.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
              {renderEntry(thread.root, { noCardTitle: false })}
              {thread.replies.length > 0 && (
                <ol className="ml-6 space-y-3 border-l border-gray-200 pb-1 dark:border-gray-700 pl-5">
                  {thread.replies.map((entry) => renderEntry(entry, { nested: true }))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}

      {standalone.length > 0 && (
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getTimelineBadgeClass('SYSTEM')}`}>
              보조 메시지
            </span>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">기타 대화</h3>
          </div>
          <ol className="space-y-3">
            {standalone.map((entry) => renderEntry(entry, { nested: true }))}
          </ol>
        </div>
      )}
    </div>
  );
}
