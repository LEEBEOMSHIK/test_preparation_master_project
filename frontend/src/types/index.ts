// ──────────────────────────────────────────
// Common
// ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  role: Role;
  isFirstLogin?: boolean;
  interestedExamTypes?: string[];
  interestedExamSlaveIds?: number[];
}

// ──────────────────────────────────────────
// ExamInfo
// ──────────────────────────────────────────

export interface ExamInfo {
  id: number;
  examType: string;
  title: string;
  description?: string;
  applicationPeriod?: string;
  examSchedule?: string;
  resultDate?: string;
  officialUrl?: string;
  applicationUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

// ──────────────────────────────────────────
// Exam
// ──────────────────────────────────────────
export type QuestionMode = 'RANDOM' | 'SEQUENTIAL';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'OX' | 'CODE';

export interface ExamSummary {
  id: number;
  title: string;
  orderNo: number;
  questionMode: QuestionMode;
  questionCount: number;
  createdAt: string;
}

export interface Question {
  id: number;
  seq: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  code?: string;
  language?: string;
}

export interface ExamDetail extends ExamSummary {
  questions: Question[];
}

/** 시험지에 속한 문항 (시험지 수정 화면에서 사용) */
export interface ExamQuestion {
  id: number;
  seq: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  answer?: string;
  explanation?: string;
  code?: string;
  language?: string;
  categoryId?: number;
  categoryName?: string;
}

export interface QuestionSummary {
  id: number;
  title?: string;
  examYear?: number;
  examRound?: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  answer?: string;
  code?: string;
  language?: string;
  explanation?: string;
  categoryId?: number;
  categoryName?: string;
  examTypeId?: number;
  examTypeName?: string;
  createdAt: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────
// Domain
// ──────────────────────────────────────────
export interface DomainSlave {
  id: number;
  masterId: number;
  name: string;
  displayOrder?: number;
}

export interface DomainMaster {
  id: number;
  code?: string;
  name: string;
  slaves: DomainSlave[];
}

// ──────────────────────────────────────────
// Examination (시험)
// ──────────────────────────────────────────
export interface Examination {
  id: number;
  title: string;
  examPaperId: number;
  examPaperTitle: string;
  categoryId: number;
  categoryName: string;
  timeLimit: number;
  createdAt: string;
}

export interface ExaminationDetail {
  id: number;
  title: string;
  examPaperId: number;
  examPaperTitle: string;
  categoryName: string | null;
  timeLimit: number;
  questions: Question[];
}

/** 시험 응시 세션 — 서버 시작시각 기반 남은 시간 */
export interface ExamSession {
  examinationId: number;
  startedAt: string;
  remainingSeconds: number;
}

// ──────────────────────────────────────────
// Quote
// ──────────────────────────────────────────
export interface Quote {
  id: number;
  content: string;
  author?: string;
  useYn: string;
  createdAt: string;
}

// ──────────────────────────────────────────
// ConceptNote
// ──────────────────────────────────────────
export interface ConceptNote {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  userId?: number;
  userName?: string;
  // 연결된 시험 문항 (시험 화면에서 등록된 경우)
  questionId?: number;
  questionContent?: string;
  questionType?: string;
  questionCode?: string;
  questionLanguage?: string;
  // 연결된 퀴즈 문항 (데일리 퀴즈에서 등록된 경우)
  questionBankId?: number;
  questionBankContent?: string;
  questionBankType?: string;
  questionBankCode?: string;
  questionBankLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────
// Inquiry
// ──────────────────────────────────────────
export type InquiryStatus = 'PENDING' | 'ON_HOLD' | 'ANSWERED';
export type InquiryType = 'EXAM' | 'CONCEPT_NOTE' | 'DAILY_QUIZ' | 'PRACTICE' | 'OTHER';

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  PENDING: '답변 대기',
  ON_HOLD: '답변 보류',
  ANSWERED: '답변 완료',
};

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  EXAM: '시험',
  CONCEPT_NOTE: '개념노트',
  DAILY_QUIZ: '데일리 퀴즈',
  PRACTICE: '연습장',
  OTHER: '기타',
};

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: InquiryStatus;
  inquiryType: InquiryType;
  imageUrls: string[];
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  userId?: number;
  userName?: string;
}

// ──────────────────────────────────────────
// Attachment
// ──────────────────────────────────────────
export interface Attachment {
  id: number;
  originalFilename: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  refType?: string;
  refId?: number;
  createdAt: string;
}

// ──────────────────────────────────────────
// Permission
// ──────────────────────────────────────────
export interface PermissionDetail {
  id: number;
  masterId: number;
  masterCode: string;
  masterName: string;
  name: string;
  description?: string;
  code?: string;
  allowedMenuIds: number[];
  createdAt: string;
  updatedAt: string;
}

export type PermissionScope = 'USER' | 'ADMIN';

export interface PermissionMaster {
  id: number;
  code: string;
  name: string;
  description?: string;
  scope: PermissionScope;
  createdAt: string;
  details: PermissionDetail[];
  allowedMenuIds: number[];
  userCount: number;
}

// ──────────────────────────────────────────
// MenuConfig
// ──────────────────────────────────────────
export interface MenuConfig {
  id: number;
  parentId?: number;
  name: string;
  url: string;
  iconKey?: string;
  displayOrder: number;
  menuType: 'USER' | 'ADMIN';
  isActive: boolean;
  allowedRoles?: string;
  createdAt: string;
  updatedAt: string;
  children: MenuConfig[];
}

// ──────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────
export interface Faq {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────
// Bookmark (문항 즐겨찾기)
// ──────────────────────────────────────────
export interface BookmarkQuestion {
  bookmarkId: number;
  questionBankId: number;
  title?: string;
  examYear?: number;
  examRound?: number;
  content: string;
  questionType: QuestionType;
  categoryId?: number;
  categoryName?: string;
  examTypeId?: number;
  examTypeName?: string;
  options?: string[];
  answer?: string;
  code?: string;
  language?: string;
  explanation?: string;
  bookmarkedAt: string;
}

// ──────────────────────────────────────────
// ExaminationSubmit (시험 제출 결과)
// ──────────────────────────────────────────

/** 채점 후 문항별 정오·정답·해설 */
export interface QuestionResult {
  questionId: number | null;
  seq: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation?: string;
  code?: string;
  language?: string;
}

/** 시험 제출·채점 결과 */
export interface ExaminationSubmitResult {
  total: number;
  correct: number;
  score: number;
  results: QuestionResult[];
  historyId: number | null;
}

/** ExamResultDisplay 공용 결과 데이터 (제출 직후 & 이력 재조회 공용) */
export interface ExamResultData {
  total: number;
  correct: number;
  score: number;
  results: QuestionResult[];
  historyId?: number | null;
  takenAt?: string;
}

/** 사용자 시험 이력 목록 항목 */
export interface UserExamHistorySummary {
  id: number;
  examinationTitle: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  takenAt: string;
}

/** 저장된 시험 결과 재조회 응답 */
export interface ExamHistoryDetailResult {
  historyId: number;
  total: number;
  correct: number;
  score: number;
  takenAt: string;
  results: QuestionResult[];
}

// ──────────────────────────────────────────
// UserDashboard (사용자 통계 대시보드)
// ──────────────────────────────────────────
export interface DomainStat {
  domainName: string;
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
}

export interface DailyStat {
  date: string;
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
}

export interface QuizDomainStat {
  domainName: string;
  totalQuestions: number;
}

export interface QuizDailyStat {
  date: string;
  totalQuestions: number;
}

export interface PracticeDailyStat {
  date: string;
  totalExecutions: number;
}

export interface UserDashboardData {
  totalQuestions: number;
  totalCorrect: number;
  overallCorrectRate: number;
  domainStats: DomainStat[];
  weakDomains: DomainStat[];
  dailyTrend: DailyStat[];
  quizTotalQuestions: number;
  quizDomainStats: QuizDomainStat[];
  quizDailyStats: QuizDailyStat[];
  practiceTotalExecutions: number;
  practiceSuccessCount: number;
  practiceSuccessRate: number;
  practiceDailyStats: PracticeDailyStat[];
}
