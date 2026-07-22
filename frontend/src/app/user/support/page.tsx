// 개발자 응원하기(자발적 후원 안내) 페이지 — 정적 콘텐츠, 데이터 페칭 없음.
//
// ⚠️ 실제 링크 연결 방법: 아래 3개 상수에 실제 URL을 채워 넣으면 즉시 정상 동작한다.
//    값이 비어있는 채널은 자동으로 비활성 처리되고 "준비 중" 배지가 표시된다.
const TOSS_SUPPORT_URL = '';
const KAKAOPAY_SUPPORT_URL = '';
const KAKAO_GIFT_WISHLIST_URL = '';

interface SupportChannel {
  key: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}

const SUPPORT_CHANNELS: SupportChannel[] = [
  {
    key: 'toss',
    name: '토스로 송금하기',
    description: '토스 앱에서 바로 송금할 수 있어요.',
    url: TOSS_SUPPORT_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
      </svg>
    ),
  },
  {
    key: 'kakaopay',
    name: '카카오페이로 송금하기',
    description: 'QR 스캔 또는 링크로 간편하게 송금할 수 있어요.',
    url: KAKAOPAY_SUPPORT_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6m-6-6h2" />
      </svg>
    ),
  },
  {
    key: 'kakaogift',
    name: '카카오톡 선물하기',
    description: '위시리스트에서 원하는 선물을 보내주세요.',
    url: KAKAO_GIFT_WISHLIST_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8m18-4H2v4h18v-4zm-9 0V21m0-13c0-2.5-2.5-4-4.5-3-1.5.8-1.5 3 0 3.8.7.4 4.5.2 4.5-.8zm0 0c0-2.5 2.5-4 4.5-3 1.5.8 1.5 3 0 3.8-.7.4-4.5.2-4.5-.8z" />
      </svg>
    ),
  },
];

export default function UserSupportPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">개발자 응원하기</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          TPMP를 이용해 주시고 응원해 주셔서 감사합니다. 여러분의 작은 후원이 서비스를 계속
          운영하고 개선해 나가는 데 큰 힘이 됩니다.
        </p>
      </div>

      <div className="space-y-3">
        {SUPPORT_CHANNELS.map((channel) => {
          const isReady = channel.url.trim().length > 0;

          const cardBody = (
            <>
              <span
                className={[
                  'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  isReady ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {channel.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  {channel.name}
                  {!isReady && (
                    <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      준비 중
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{channel.description}</p>
              </div>
              {isReady && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 shrink-0">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </>
          );

          const cardClass = 'flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 transition-colors';

          return isReady ? (
            <a
              key={channel.key}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cardClass} hover:border-indigo-300 hover:bg-indigo-50/40`}
            >
              {cardBody}
            </a>
          ) : (
            <div key={channel.key} className={`${cardClass} opacity-60 cursor-not-allowed`}>
              {cardBody}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        후원은 순전히 자발적인 참여이며, 서비스 이용에 어떠한 영향도 주지 않습니다.
      </p>
    </div>
  );
}
