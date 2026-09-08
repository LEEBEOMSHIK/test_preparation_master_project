interface QuizCategoryIconProps {
  masterCode?: string;
  categoryName: string;
  className?: string;
}

type IconKind =
  | 'code'
  | 'database'
  | 'processor'
  | 'network'
  | 'security'
  | 'engineering'
  | 'web'
  | 'practical'
  | 'written'
  | 'linux'
  | 'exam'
  | 'default';

const ICON_LABEL: Record<IconKind, string> = {
  code: '코드',
  database: '데이터베이스',
  processor: '프로세서',
  network: '네트워크',
  security: '보안',
  engineering: '설계',
  web: '웹',
  practical: '실기',
  written: '필기',
  linux: '리눅스',
  exam: '시험 분야',
  default: '기본',
};

function getIconKind(masterCode: string | undefined, categoryName: string): IconKind {
  const normalizedName = categoryName.replace(/\s/g, '').toLowerCase();

  if (masterCode === 'EXAM_TYPE') {
    if (normalizedName.includes('sqld')) return 'database';
    if (normalizedName.includes('실기')) return 'practical';
    if (normalizedName.includes('필기')) return 'written';
    if (normalizedName.includes('리눅스')) return 'linux';
    return 'exam';
  }
  if (normalizedName.includes('프로그래밍') || normalizedName.includes('code')) return 'code';
  if (normalizedName.includes('sql') || normalizedName.includes('데이터베이스') || normalizedName.includes('db')) return 'database';
  if (normalizedName.includes('운영체제') || normalizedName.includes('스케줄링')) return 'processor';
  if (normalizedName.includes('네트워크')) return 'network';
  if (normalizedName.includes('보안')) return 'security';
  if (normalizedName.includes('소프트웨어공학')) return 'engineering';
  if (normalizedName.includes('웹')) return 'web';
  return 'default';
}

export function QuizCategoryIcon({ masterCode, categoryName, className = 'w-5 h-5' }: QuizCategoryIconProps) {
  const kind = getIconKind(masterCode, categoryName);
  const commonProps = {
    role: 'img',
    'aria-label': `${categoryName} ${ICON_LABEL[kind]} 아이콘`,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className,
  } as const;

  if (kind === 'code') {
    return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3m-2.5-9l-3 12" /></svg>;
  }
  if (kind === 'database') {
    return <svg {...commonProps}><ellipse cx="12" cy="5.5" rx="7" ry="3" /><path strokeLinecap="round" d="M5 5.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6M5 11.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" /></svg>;
  }
  if (kind === 'processor') {
    return <svg {...commonProps}><rect x="7" y="7" width="10" height="10" rx="2" /><path strokeLinecap="round" d="M9.5 1.5v3m5-3v3m-5 15v3m5-3v3m5-10h3m-3 5h3m-21-5h3m-3 5h3M10 10h4v4h-4z" /></svg>;
  }
  if (kind === 'network') {
    return <svg {...commonProps}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path strokeLinecap="round" d="M10.8 7.2L6.2 15.8m7-8.6l4.6 8.6M7.5 18h9" /></svg>;
  }
  if (kind === 'security') {
    return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.7-2.9 8-7 10-4.1-2-7-5.3-7-10V6l7-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>;
  }
  if (kind === 'engineering') {
    return <svg {...commonProps}><rect x="3" y="4" width="7" height="6" rx="1" /><rect x="14" y="14" width="7" height="6" rx="1" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 7h4a3 3 0 013 3v4M7 10v4a3 3 0 003 3h4" /></svg>;
  }
  if (kind === 'web') {
    return <svg {...commonProps}><rect x="3" y="4" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 8h18M7 6h.01M10 6h.01" /><circle cx="12" cy="14" r="3.5" /><path strokeLinecap="round" d="M8.5 14h7M12 10.5c1.3 1.8 1.3 5.2 0 7m0-7c-1.3 1.8-1.3 5.2 0 7" /></svg>;
  }
  if (kind === 'practical') {
    return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 01-5 5L4 17l3 3 5.7-5.7a4 4 0 005-5l-2.4 2.4-3-3 2.4-2.4z" /></svg>;
  }
  if (kind === 'written') {
    return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l3 3v15H6V3zm3 7h6m-6 4h6m-6 4h4M15 3v4h3" /></svg>;
  }
  if (kind === 'linux') {
    return <svg {...commonProps}><rect x="3" y="4" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 9l3 3-3 3m5 0h5" /></svg>;
  }
  if (kind === 'exam') {
    return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v17H5V4zm4-2h6v4H9V2zm0 9h6m-6 4h6" /></svg>;
  }
  return <svg {...commonProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
