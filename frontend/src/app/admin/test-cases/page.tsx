'use client';

import { useState, useMemo, useEffect } from 'react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type TestStatus = 'PENDING' | 'PASS' | 'FAIL' | 'SKIP';
type TestType = 'FUNCTIONAL' | 'UI' | 'INTEGRATION';
type Category = '관리자' | '사용자';

interface TestCase {
  id: string;
  category: Category;
  screen: string;
  testName: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: Priority;
  testType: TestType;
}

interface TestResult {
  status: TestStatus;
  actualResult: string;
  executedAt: string;
}

const STORAGE_KEY = 'tpmp_test_results_v1';
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ────────────────────────────────────────────────
// 테스트 케이스 정의
// ────────────────────────────────────────────────
const TEST_CASES: TestCase[] = [
  // 관리자 > 인증
  { id: 'ADM-AUTH-001', category: '관리자', screen: '인증', testName: '관리자 로그인 성공', preconditions: 'ADMIN 권한 계정 존재', steps: ['로그인 페이지 접속', 'ADMIN 이메일/비밀번호 입력', '로그인 버튼 클릭'], expectedResult: '관리자 대시보드로 이동하며 관리자 사이드바가 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-AUTH-002', category: '관리자', screen: '인증', testName: '잘못된 비밀번호로 로그인 시도', preconditions: '로그인 페이지 접속 상태', steps: ['유효한 이메일 입력', '잘못된 비밀번호 입력', '로그인 버튼 클릭'], expectedResult: '오류 메시지가 표시되며 로그인 페이지에 머문다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-AUTH-003', category: '관리자', screen: '인증', testName: '관리자 로그아웃', preconditions: '관리자로 로그인된 상태', steps: ['상단 메뉴에서 로그아웃 클릭'], expectedResult: '로그인 페이지로 이동하며 세션이 종료된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 시험 관리
  { id: 'ADM-EXAM-001', category: '관리자', screen: '시험 관리', testName: '시험 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "시험 관리" 클릭'], expectedResult: '시험 목록이 테이블 형태로 표시되며 로딩 중 Skeleton UI가 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-EXAM-002', category: '관리자', screen: '시험 관리', testName: '시험 키워드 검색', preconditions: '시험 목록 페이지, 시험 데이터 1건 이상 존재', steps: ['검색창에 기존 시험명 일부 입력', '"검색" 버튼 클릭'], expectedResult: '키워드를 포함하는 시험만 목록에 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-EXAM-003', category: '관리자', screen: '시험 관리', testName: '시험 삭제', preconditions: '시험 목록에 삭제 가능한 시험 존재', steps: ['삭제할 시험의 "삭제" 버튼 클릭', '확인 다이얼로그에서 확인'], expectedResult: '시험이 목록에서 제거된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-EXAM-004', category: '관리자', screen: '시험 관리', testName: '검색 결과 없음 상태', preconditions: '시험 목록 페이지', steps: ['존재하지 않는 키워드로 검색'], expectedResult: '빈 상태 메시지가 표시된다', priority: 'LOW', testType: 'UI' },
  // 관리자 > 시험지 관리
  { id: 'ADM-PAPER-001', category: '관리자', screen: '시험지 관리', testName: '시험지 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "시험 관리" > "시험지 관리" 클릭'], expectedResult: '시험지 목록이 테이블 형태로 표시된다 (제목, 문항 수, 문제 모드, 생성일)', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-PAPER-002', category: '관리자', screen: '시험지 관리', testName: '시험지 생성', preconditions: '시험지 목록 페이지 접속 상태', steps: ['"새 시험지 만들기" 버튼 클릭', '제목 입력', '문제 출제 방식 선택', '"생성" 버튼 클릭'], expectedResult: '새 시험지가 생성되어 목록에 추가된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-PAPER-003', category: '관리자', screen: '시험지 관리', testName: '시험지 수정', preconditions: '시험지 목록에 수정 가능한 항목 존재', steps: ['수정할 시험지의 "수정" 버튼 클릭', '제목 또는 문제 모드 변경', '"저장" 버튼 클릭'], expectedResult: '변경 사항이 저장되어 목록에 반영된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-PAPER-004', category: '관리자', screen: '시험지 관리', testName: '시험지 삭제', preconditions: '시험지 목록에 삭제 가능한 항목 존재', steps: ['삭제할 시험지의 "삭제" 버튼 클릭', '확인 다이얼로그에서 확인'], expectedResult: '시험지가 목록에서 제거된다 (소프트 삭제)', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-PAPER-005', category: '관리자', screen: '시험지 관리', testName: '문항 일괄 추가 (with-questions)', preconditions: '시험지 생성 페이지', steps: ['시험지 제목 입력', '문항 추가 섹션에서 문항 여러 건 입력', '"시험지+문항 한 번에 생성" 클릭'], expectedResult: '시험지와 문항이 원자적으로 생성된다 (일부 실패 시 롤백)', priority: 'HIGH', testType: 'FUNCTIONAL' },
  // 관리자 > 문항 관리
  { id: 'ADM-QUEST-001', category: '관리자', screen: '문항 관리', testName: '문항 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "시험 관리" > "문항 관리" 클릭'], expectedResult: '문항 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUEST-002', category: '관리자', screen: '문항 관리', testName: '문항 유형별 필터링', preconditions: '문항 목록에 다양한 유형의 문항 존재', steps: ['유형 필터 드롭다운에서 특정 유형 선택 (예: 객관식)'], expectedResult: '선택한 유형의 문항만 목록에 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUEST-003', category: '관리자', screen: '문항 관리', testName: '객관식 문항 생성', preconditions: '문항 관리 페이지 접속 상태', steps: ['"새 문항 추가" 버튼 클릭', '시험지 선택', '유형: 객관식 선택', '문제, 선택지(4개), 정답, 해설 입력', '"저장" 버튼 클릭'], expectedResult: '문항이 생성되어 목록에 추가된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUEST-004', category: '관리자', screen: '문항 관리', testName: '코드형 문항 생성', preconditions: '문항 관리 페이지 접속 상태', steps: ['"새 문항 추가" 버튼 클릭', '유형: 코드형 선택', '문제, 코드, 언어, 정답 입력', '"저장" 버튼 클릭'], expectedResult: '코드형 문항이 생성되어 목록에 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUEST-005', category: '관리자', screen: '문항 관리', testName: '문항 삭제', preconditions: '문항 목록에 항목 존재', steps: ['삭제할 문항의 "삭제" 버튼 클릭', '확인'], expectedResult: '문항이 목록에서 제거된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  // 관리자 > 개념노트 관리
  { id: 'ADM-CONCEPT-001', category: '관리자', screen: '개념노트 관리', testName: '개념노트 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "개념노트 관리" 클릭'], expectedResult: '개념노트 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-CONCEPT-002', category: '관리자', screen: '개념노트 관리', testName: '개념노트 검색', preconditions: '개념노트 목록 페이지, 데이터 1건 이상 존재', steps: ['검색창에 제목 키워드 입력', '검색 실행'], expectedResult: '키워드를 포함하는 개념노트만 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-CONCEPT-003', category: '관리자', screen: '개념노트 관리', testName: '개념노트 삭제', preconditions: '개념노트 목록에 항목 존재', steps: ['삭제할 개념노트의 "삭제" 버튼 클릭', '확인'], expectedResult: '개념노트가 목록에서 제거된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 시험 정보 관리
  { id: 'ADM-EXAMINFO-001', category: '관리자', screen: '시험 정보 관리', testName: '시험 정보 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "시험 정보 관리" 클릭'], expectedResult: '시험 정보 목록이 카드 또는 테이블 형태로 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-EXAMINFO-002', category: '관리자', screen: '시험 정보 관리', testName: '시험 정보 생성', preconditions: '시험 정보 관리 페이지 접속 상태', steps: ['"추가" 버튼 클릭', '시험 유형, 제목, 내용 입력', '"저장" 클릭'], expectedResult: '새 시험 정보가 목록에 추가된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-EXAMINFO-003', category: '관리자', screen: '시험 정보 관리', testName: '시험 정보 수정', preconditions: '시험 정보 목록에 항목 존재', steps: ['수정 버튼 클릭', '내용 변경', '"저장" 클릭'], expectedResult: '변경 사항이 저장된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > FAQ 관리
  { id: 'ADM-FAQ-001', category: '관리자', screen: 'FAQ 관리', testName: 'FAQ 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "FAQ 관리" 클릭'], expectedResult: 'FAQ 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-FAQ-002', category: '관리자', screen: 'FAQ 관리', testName: 'FAQ 생성', preconditions: 'FAQ 관리 페이지 접속 상태', steps: ['"새 FAQ 등록" 클릭', '카테고리, 질문, 답변 입력', '"저장" 클릭'], expectedResult: '새 FAQ가 목록에 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-FAQ-003', category: '관리자', screen: 'FAQ 관리', testName: 'FAQ 삭제', preconditions: 'FAQ 목록에 항목 존재', steps: ['삭제할 FAQ의 삭제 버튼 클릭', '확인'], expectedResult: 'FAQ가 목록에서 제거된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 문의 관리
  { id: 'ADM-INQ-001', category: '관리자', screen: '1:1 문의 관리', testName: '문의 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "1:1 문의 관리" 클릭'], expectedResult: '문의 목록이 표시된다 (상태: 대기/답변완료 포함)', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-INQ-002', category: '관리자', screen: '1:1 문의 관리', testName: '미답변 문의 필터링', preconditions: '문의 목록에 다양한 상태의 항목 존재', steps: ['상태 필터에서 "미답변" 선택'], expectedResult: '미답변 문의만 목록에 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 명언 관리
  { id: 'ADM-QUOTE-001', category: '관리자', screen: '명언 관리', testName: '명언 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "명언 관리" 클릭'], expectedResult: '명언 목록이 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUOTE-002', category: '관리자', screen: '명언 관리', testName: '명언 생성', preconditions: '명언 관리 페이지 접속 상태', steps: ['"추가" 버튼 클릭', '명언 내용, 작가 입력', '"저장" 클릭'], expectedResult: '새 명언이 목록에 추가된다', priority: 'LOW', testType: 'FUNCTIONAL' },
  { id: 'ADM-QUOTE-003', category: '관리자', screen: '명언 관리', testName: '명언 삭제', preconditions: '명언 목록에 항목 존재', steps: ['삭제 버튼 클릭', '확인'], expectedResult: '명언이 목록에서 제거된다', priority: 'LOW', testType: 'FUNCTIONAL' },
  // 관리자 > 도메인 관리
  { id: 'ADM-DOMAIN-001', category: '관리자', screen: '도메인 관리', testName: '도메인 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "테이블 관리" > "도메인 관리" 클릭'], expectedResult: '도메인 마스터/슬레이브 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-DOMAIN-002', category: '관리자', screen: '도메인 관리', testName: '도메인 마스터 추가', preconditions: '도메인 관리 페이지 접속 상태', steps: ['"마스터 추가" 버튼 클릭', '마스터 코드, 이름 입력', '"저장" 클릭'], expectedResult: '새 마스터 도메인이 목록에 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-DOMAIN-003', category: '관리자', screen: '도메인 관리', testName: '슬레이브 도메인 추가', preconditions: '마스터 도메인이 1건 이상 존재', steps: ['마스터 선택', '"슬레이브 추가" 버튼 클릭', '코드, 이름 입력', '"저장" 클릭'], expectedResult: '슬레이브 도메인이 해당 마스터 하위에 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-DOMAIN-004', category: '관리자', screen: '도메인 관리', testName: '참조 중인 도메인 삭제 시도', preconditions: '다른 데이터에서 참조 중인 도메인 존재', steps: ['참조 중인 도메인의 "삭제" 버튼 클릭', '확인'], expectedResult: '삭제가 거부되며 참조 관계 에러 메시지가 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  // 관리자 > 권한 관리
  { id: 'ADM-PERM-001', category: '관리자', screen: '권한 관리', testName: '권한 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "권한 관리" 클릭'], expectedResult: '권한 마스터/디테일 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-PERM-002', category: '관리자', screen: '권한 관리', testName: '권한 마스터 추가', preconditions: '권한 관리 페이지 접속 상태', steps: ['"권한 그룹 추가" 클릭', '코드, 이름 입력', '"저장" 클릭'], expectedResult: '새 권한 그룹이 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 메뉴 관리
  { id: 'ADM-MENU-001', category: '관리자', screen: '메뉴 관리', testName: '관리자 메뉴 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "메뉴 관리" 클릭', '"관리자 메뉴" 탭 확인'], expectedResult: '관리자 메뉴 트리가 상위/하위 구조로 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-MENU-002', category: '관리자', screen: '메뉴 관리', testName: '사용자 메뉴 탭 전환', preconditions: '메뉴 관리 페이지 접속 상태', steps: ['"사용자 메뉴" 탭 클릭'], expectedResult: '사용자 메뉴 목록으로 전환되어 표시된다', priority: 'MEDIUM', testType: 'UI' },
  { id: 'ADM-MENU-003', category: '관리자', screen: '메뉴 관리', testName: '메뉴 추가', preconditions: '메뉴 관리 페이지 접속 상태', steps: ['"메뉴 추가" 버튼 클릭', '이름, URL, 아이콘 키, 순서 입력', '"추가" 클릭'], expectedResult: '새 메뉴가 트리에 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-MENU-004', category: '관리자', screen: '메뉴 관리', testName: '메뉴 수정 (인라인)', preconditions: '메뉴 목록에 항목 존재', steps: ['수정 버튼 클릭', '이름 또는 URL 변경', '"저장" 클릭'], expectedResult: '변경 사항이 즉시 목록에 반영된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-MENU-005', category: '관리자', screen: '메뉴 관리', testName: '메뉴 삭제', preconditions: '메뉴 목록에 항목 존재', steps: ['삭제 버튼 클릭', '확인'], expectedResult: '메뉴가 목록에서 제거된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 관리자 > 사용자 관리
  { id: 'ADM-USER-001', category: '관리자', screen: '사용자 관리', testName: '사용자 목록 조회', preconditions: '관리자로 로그인된 상태', steps: ['사이드바에서 "계정 관리" 클릭'], expectedResult: '가입된 사용자 목록이 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'ADM-USER-002', category: '관리자', screen: '사용자 관리', testName: '사용자 이름 검색', preconditions: '사용자 목록에 데이터 존재', steps: ['이름 검색창에 키워드 입력', '검색 실행'], expectedResult: '이름에 키워드가 포함된 사용자만 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'ADM-USER-003', category: '관리자', screen: '사용자 관리', testName: '사용자 역할 변경', preconditions: '사용자 목록에 USER 역할 계정 존재', steps: ['역할 변경 버튼 클릭', 'ADMIN으로 변경', '확인'], expectedResult: '역할이 ADMIN으로 변경되어 목록에 반영된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  // 사용자 > 인증
  { id: 'USR-AUTH-001', category: '사용자', screen: '인증', testName: '사용자 로그인 성공', preconditions: 'USER 권한 계정 존재', steps: ['로그인 페이지 접속', '이메일/비밀번호 입력', '로그인 버튼 클릭'], expectedResult: '사용자 메인 페이지로 이동한다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'USR-AUTH-002', category: '사용자', screen: '인증', testName: '구글 소셜 로그인', preconditions: '구글 OAuth 설정 완료 상태', steps: ['로그인 페이지에서 "Google로 계속하기" 클릭', '구글 계정 선택', '권한 승인'], expectedResult: '구글 계정으로 로그인되어 메인 페이지로 이동한다', priority: 'HIGH', testType: 'INTEGRATION' },
  { id: 'USR-AUTH-003', category: '사용자', screen: '인증', testName: '회원가입 후 로그인', preconditions: '신규 이메일 주소 준비', steps: ['"회원가입" 링크 클릭', '이메일, 이름, 비밀번호 입력', '"가입하기" 클릭', '가입된 계정으로 로그인'], expectedResult: '계정이 생성되며 로그인에 성공한다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'USR-AUTH-004', category: '사용자', screen: '인증', testName: 'ADMIN 권한 계정으로 사용자 페이지 접근', preconditions: 'ADMIN 계정으로 로그인', steps: ['사용자 전용 URL 직접 접속'], expectedResult: '관리자 전용 접근 경로로 리다이렉트되거나 접근이 허용된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 사용자 > 시험 응시
  { id: 'USR-EXAM-001', category: '사용자', screen: '시험 응시', testName: '시험 목록 조회', preconditions: '사용자로 로그인된 상태', steps: ['메인 메뉴에서 시험 목록 접속'], expectedResult: '응시 가능한 시험 목록이 카드 형태로 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'USR-EXAM-002', category: '사용자', screen: '시험 응시', testName: '시험 시작 및 문제 풀기', preconditions: '시험 목록에 문항이 있는 시험 존재', steps: ['시험 선택', '"응시 시작" 버튼 클릭', '첫 번째 문항 확인', '답안 선택', '"다음" 버튼 클릭'], expectedResult: '문항이 순서대로 표시되며 답안을 선택할 수 있다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'USR-EXAM-003', category: '사용자', screen: '시험 응시', testName: '시험 제출 및 결과 확인', preconditions: '시험 응시 중, 마지막 문항까지 답안 입력', steps: ['"제출" 버튼 클릭', '제출 확인 다이얼로그에서 확인'], expectedResult: '결과 화면이 표시되며 정답 수, 오답 수, 점수가 표시된다', priority: 'HIGH', testType: 'FUNCTIONAL' },
  { id: 'USR-EXAM-004', category: '사용자', screen: '시험 응시', testName: '랜덤 모드 시험 문항 순서 확인', preconditions: '문제 모드가 RANDOM인 시험 존재', steps: ['동일 시험을 두 번 이상 응시하여 문항 순서 비교'], expectedResult: '응시마다 문항 순서가 다르게 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 사용자 > 퀴즈
  { id: 'USR-QUIZ-001', category: '사용자', screen: '퀴즈', testName: '퀴즈 카테고리 선택 및 시작', preconditions: '사용자로 로그인된 상태', steps: ['메인 메뉴에서 퀴즈 접속', '카테고리 선택', '시작'], expectedResult: '선택한 카테고리의 퀴즈가 시작된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'USR-QUIZ-002', category: '사용자', screen: '퀴즈', testName: '퀴즈 문제 풀기 즉시 피드백', preconditions: '퀴즈 진행 중', steps: ['문항에서 답 선택'], expectedResult: '즉시 정답/오답 피드백이 표시되며 해설이 보여진다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 사용자 > 개념노트
  { id: 'USR-CONCEPT-001', category: '사용자', screen: '개념노트', testName: '개념노트 목록 조회', preconditions: '사용자로 로그인된 상태', steps: ['메뉴에서 개념노트 접속'], expectedResult: '개념노트 목록이 카드 형태로 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  { id: 'USR-CONCEPT-002', category: '사용자', screen: '개념노트', testName: '개념노트 상세 조회', preconditions: '개념노트 목록에 항목 존재', steps: ['개념노트 카드 클릭'], expectedResult: '개념노트 상세 내용이 표시된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 사용자 > FAQ/문의
  { id: 'USR-FAQ-001', category: '사용자', screen: 'FAQ/문의', testName: 'FAQ 목록 아코디언 조회', preconditions: '사용자로 로그인된 상태', steps: ['메뉴에서 FAQ 접속', 'FAQ 항목 클릭'], expectedResult: 'FAQ 항목이 아코디언 형태로 펼쳐지며 답변이 표시된다', priority: 'LOW', testType: 'UI' },
  { id: 'USR-FAQ-002', category: '사용자', screen: 'FAQ/문의', testName: '1:1 문의 작성', preconditions: '사용자로 로그인된 상태', steps: ['문의 작성 버튼 클릭', '유형, 제목, 내용 입력', '"제출" 클릭'], expectedResult: '문의가 등록되며 목록에 "대기" 상태로 추가된다', priority: 'MEDIUM', testType: 'FUNCTIONAL' },
  // 공통 UI
  { id: 'UI-COMMON-001', category: '관리자', screen: '공통 UI', testName: '다크 모드 전환', preconditions: '관리자 화면 접속 상태', steps: ['상단 툴바의 테마 전환 버튼 클릭'], expectedResult: '화면이 다크 모드로 전환되며 테마 설정이 유지된다', priority: 'LOW', testType: 'UI' },
  { id: 'UI-COMMON-002', category: '관리자', screen: '공통 UI', testName: '로딩 Skeleton UI 표시', preconditions: '관리자 페이지 접속 시 네트워크 속도 저하 시뮬레이션', steps: ['임의의 관리자 목록 페이지 접속', '로딩 상태 확인'], expectedResult: '데이터 페칭 중에 스피너 대신 TableSkeleton이 표시된다', priority: 'LOW', testType: 'UI' },
  { id: 'UI-COMMON-003', category: '관리자', screen: '공통 UI', testName: '빈 상태(Empty State) 표시', preconditions: '데이터가 없는 상태에서 목록 페이지 접속', steps: ['데이터 없는 상태 확인'], expectedResult: '"등록된 항목이 없습니다" 등의 빈 상태 메시지가 표시된다', priority: 'LOW', testType: 'UI' },
];

// ────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  HIGH:   { label: '높음', className: 'bg-red-50 text-red-600' },
  MEDIUM: { label: '중간', className: 'bg-yellow-50 text-yellow-600' },
  LOW:    { label: '낮음', className: 'bg-gray-100 text-gray-500' },
};

const STATUS_CONFIG: Record<TestStatus, { label: string; className: string }> = {
  PENDING: { label: '미실행', className: 'bg-gray-100 text-gray-500' },
  PASS:    { label: '통과',   className: 'bg-green-50 text-green-600' },
  FAIL:    { label: '실패',   className: 'bg-red-50 text-red-600' },
  SKIP:    { label: '건너뜀', className: 'bg-blue-50 text-blue-500' },
};

const TYPE_CONFIG: Record<TestType, { label: string }> = {
  FUNCTIONAL:  { label: '기능' },
  UI:          { label: 'UI' },
  INTEGRATION: { label: '통합' },
};

const SCREEN_URL_MAP: Record<string, string> = {
  '인증':         '/auth/login',
  '시험 관리':     '/admin/exams',
  '시험지 관리':   '/admin/exams/papers',
  '문항 관리':     '/admin/exams/questions',
  '개념노트 관리': '/admin/concepts',
  '시험 정보 관리':'/admin/exam-info',
  'FAQ 관리':      '/admin/faq',
  '1:1 문의 관리': '/admin/inquiries',
  '명언 관리':     '/admin/quotes',
  '도메인 관리':   '/admin/tables/domains',
  '권한 관리':     '/admin/permissions',
  '메뉴 관리':     '/admin/menus',
  '사용자 관리':   '/admin/users',
  '공통 UI':       '/admin/exams',
  '시험 응시':     '/user/exams',
  '퀴즈':          '/user/quiz',
  '개념노트':      '/user/concepts',
  'FAQ/문의':      '/user/faq',
};

// ────────────────────────────────────────────────
// 테스트 계정 / 입력 데이터 설정
// ────────────────────────────────────────────────
const TEST_CONFIG = {
  adminEmail:    'admin@tpmp.com',
  adminPassword: 'Admin1234!',
  userEmail:     'user@tpmp.com',
  userPassword:  'User1234!',
  newUserEmail:  'newtest@tpmp.com',
  newUserName:   '신규테스터',
  newUserPassword: 'Test1234!',
};

// 테스트 케이스 ID → 실제 입력할 데이터 매핑
const TEST_DATA: Record<string, Record<string, string>> = {
  'ADM-AUTH-001': { '이메일': TEST_CONFIG.adminEmail, '비밀번호': TEST_CONFIG.adminPassword },
  'ADM-AUTH-002': { '이메일': TEST_CONFIG.adminEmail, '비밀번호': 'wrongpassword999', '기대 동작': '로그인 실패 (의도된 오류)' },
  'ADM-AUTH-003': { '사용 계정': TEST_CONFIG.adminEmail },
  'USR-AUTH-001': { '이메일': TEST_CONFIG.userEmail, '비밀번호': TEST_CONFIG.userPassword },
  'USR-AUTH-002': { '구글 계정': 'tpmp.test@gmail.com' },
  'USR-AUTH-003': { '이메일': TEST_CONFIG.newUserEmail, '이름': TEST_CONFIG.newUserName, '비밀번호': TEST_CONFIG.newUserPassword },
  'USR-AUTH-004': { '이메일': TEST_CONFIG.adminEmail, '비밀번호': TEST_CONFIG.adminPassword, '역할': 'ADMIN' },
  'ADM-EXAM-002': { '검색 키워드': '정보처리기사' },
  'ADM-PAPER-002': { '시험지 제목': '[AUTO] 테스트시험지', '문제 모드': 'SEQUENTIAL' },
  'ADM-PAPER-003': { '수정 전 제목': '[AUTO] 테스트시험지', '수정 후 제목': '[AUTO] 테스트시험지_수정' },
  'ADM-PAPER-005': { '시험지 제목': '[AUTO] 일괄생성시험지', '문항1': '자동화 테스트 문항 1번', '문항2': '자동화 테스트 문항 2번' },
  'ADM-QUEST-003': { '시험지': '[AUTO] 테스트시험지', '문제': '[AUTO] 객관식 테스트 문항', '선택지1': '①선택A', '선택지2': '②선택B', '선택지3': '③선택C', '선택지4': '④선택D', '정답': '①선택A' },
  'ADM-QUEST-004': { '시험지': '[AUTO] 테스트시험지', '문제': '[AUTO] 코드형 테스트 문항', '언어': 'Java', '코드': 'System.out.println("Hello");' },
  'ADM-CONCEPT-002': { '검색 키워드': '운영체제' },
  'ADM-EXAMINFO-002': { '시험 유형': '정보처리기사', '제목': '[AUTO] 자동화 시험정보', '내용': '자동화 테스트용 시험 정보입니다.' },
  'ADM-FAQ-002': { '카테고리': '이용 안내', '질문': '[AUTO] 테스트 FAQ 질문입니다', '답변': '[AUTO] 테스트 FAQ 답변입니다' },
  'ADM-INQ-002': { '필터': '미답변 (PENDING)' },
  'ADM-QUOTE-002': { '명언 내용': '[AUTO] 테스트 명언 내용입니다', '작가': 'TPMP 테스터' },
  'ADM-DOMAIN-002': { '마스터 코드': 'AUTO_MASTER_01', '마스터 이름': '[AUTO] 테스트 도메인' },
  'ADM-DOMAIN-003': { '슬레이브 코드': 'AUTO_SUB_01', '슬레이브 이름': '[AUTO] 테스트 서브도메인' },
  'ADM-PERM-002': { '권한 코드': 'AUTO_PERM_01', '권한 이름': '[AUTO] 테스트 권한그룹' },
  'ADM-MENU-003': { '메뉴 이름': '[AUTO] 테스트메뉴', '메뉴 URL': '/admin/auto-test', '아이콘 키': 'test', '순서': '99' },
  'ADM-USER-002': { '검색 이름': '테스터' },
  'USR-FAQ-002': { '문의 유형': '기능 오류', '제목': '[AUTO] 테스트 문의 제목', '내용': '[AUTO] 자동화 테스트 문의 내용입니다.' },
};

function loadResults(): Record<string, TestResult> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveResults(results: Record<string, TestResult>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function downloadCsv(cases: TestCase[], results: Record<string, TestResult>) {
  const headers = ['ID', '카테고리', '화면', '테스트 케이스명', '전제조건', '테스트 단계', '기대 결과', '우선순위', '유형', '상태', '실제 결과', '실행 일시'];
  const rows = cases.map((tc) => {
    const r = results[tc.id];
    return [
      tc.id,
      tc.category,
      tc.screen,
      tc.testName,
      tc.preconditions,
      tc.steps.join(' → '),
      tc.expectedResult,
      PRIORITY_CONFIG[tc.priority].label,
      TYPE_CONFIG[tc.testType].label,
      r ? STATUS_CONFIG[r.status].label : STATUS_CONFIG.PENDING.label,
      r?.actualResult ?? '',
      r?.executedAt ?? '',
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────
// 서브 컴포넌트
// ────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = PRIORITY_CONFIG[priority];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

function StatusBadge({ status }: { status: TestStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

interface StatCardProps {
  label: string;
  count: number;
  colorClass: string;
  active?: boolean;
  onClick?: () => void;
}

function StatCard({ label, count, colorClass, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'bg-white dark:bg-gray-800 rounded-xl border px-5 py-4 flex items-center gap-4 w-full text-left transition-all',
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default',
        active
          ? 'border-indigo-400 dark:border-indigo-500 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800'
          : 'border-gray-200 dark:border-gray-700',
      ].join(' ')}
    >
      <span className={`text-3xl font-bold ${colorClass}`}>{count}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    </button>
  );
}

interface RunModalProps {
  tc: TestCase;
  existing: TestResult | undefined;
  pageUrl: string | undefined;
  onClose: () => void;
  onSave: (result: TestResult) => void;
  runAll?: { current: number; total: number; onNext: () => void; onStop: () => void };
}

function RunModal({ tc, existing, pageUrl, onClose, onSave, runAll }: RunModalProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'record'>('ready');
  const [actualResult, setActualResult] = useState(existing?.actualResult ?? '');
  const testData = TEST_DATA[tc.id];

  // 전체 실행 모드: 마운트 즉시 해당 화면을 자동으로 열고 running 단계로 진입
  useEffect(() => {
    if (runAll) {
      if (pageUrl) window.open(pageUrl, '_blank');
      setPhase('running');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = () => {
    if (pageUrl) window.open(pageUrl, '_blank');
    setPhase('running');
  };

  const submit = (status: TestStatus) => {
    onSave({ status, actualResult, executedAt: new Date().toLocaleString('ko-KR') });
    if (runAll) {
      runAll.onNext();
    } else {
      onClose();
    }
  };

  const dismiss = runAll ? runAll.onStop : onClose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{tc.id}</span>
              <PriorityBadge priority={tc.priority} />
              <span className="text-xs text-gray-400 dark:text-gray-500">{TYPE_CONFIG[tc.testType].label}</span>
              {runAll && (
                <span className="ml-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                  {runAll.current} / {runAll.total}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{tc.testName}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{tc.category} &gt; {tc.screen}</p>
          </div>
          <button type="button" onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0 mt-0.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 text-sm">

          {/* ── PHASE: ready — Run 버튼 강조 ── */}
          {phase === 'ready' && (
            <section className="rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 px-5 py-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                아래 버튼을 눌러 테스트 화면을 열고 단계를 수행하세요.
              </p>
              <button type="button" onClick={handleRun}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow transition">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Run — {tc.screen} 화면 열기
              </button>
              {pageUrl && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">{pageUrl}</p>
              )}
            </section>
          )}

          {/* ── PHASE: running — 단계 수행 중 ── */}
          {phase === 'running' && (
            <section className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 flex items-center gap-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                테스트 화면이 새 탭에서 열렸습니다. 아래 단계를 수행한 뒤 결과를 기록하세요.
              </div>
              <button type="button" onClick={() => { if (pageUrl) window.open(pageUrl, '_blank'); }}
                className="text-xs text-amber-600 dark:text-amber-400 underline shrink-0">다시 열기</button>
            </section>
          )}

          {/* 테스트 입력 데이터 */}
          {testData && Object.keys(testData).length > 0 && (
            <section>
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                테스트 입력 데이터
              </p>
              <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 overflow-hidden divide-y divide-indigo-100 dark:divide-indigo-800">
                {Object.entries(testData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 shrink-0 w-28">{key}</span>
                    <code
                      className="text-xs font-mono text-gray-900 dark:text-gray-100 select-all cursor-pointer flex-1 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800 rounded px-2 py-0.5"
                      title="클릭하면 전체 선택"
                    >
                      {value}
                    </code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                값을 클릭하면 전체 선택됩니다 — 복사(Ctrl+C) 후 테스트 화면에 붙여넣으세요.
              </p>
            </section>
          )}

          {/* 전제 조건 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">전제 조건</p>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{tc.preconditions}</p>
          </section>

          {/* 테스트 단계 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">테스트 단계</p>
            <ol className="space-y-1.5">
              {tc.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-gray-700 dark:text-gray-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 기대 결과 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">기대 결과</p>
            <p className="text-gray-800 dark:text-gray-100 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg px-3 py-2">{tc.expectedResult}</p>
          </section>

          {/* 실제 결과 입력 — running 이후에만 표시 */}
          {phase !== 'ready' && (
            <section>
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 block">
                실제 결과 <span className="text-gray-300 dark:text-gray-600 font-normal">(선택 입력)</span>
              </label>
              <textarea
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                rows={3}
                placeholder="실제로 발생한 결과를 기록하세요..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </section>
          )}
        </div>

        {/* 액션 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          <button type="button" onClick={dismiss}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            {runAll ? '실행 종료' : '취소'}
          </button>

          {phase === 'ready' ? (
            /* Run 전: Run 버튼만 */
            <button type="button" onClick={handleRun}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Run
            </button>
          ) : (
            /* Run 후: 결과 기록 버튼 */
            <div className="flex gap-2">
              <button type="button" onClick={() => submit('SKIP')}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition">건너뜀</button>
              <button type="button" onClick={() => submit('FAIL')}
                className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition">실패</button>
              <button type="button" onClick={() => submit('PASS')}
                className="px-4 py-2 rounded-lg bg-green-500 dark:bg-green-600 text-white text-sm font-semibold hover:bg-green-600 dark:hover:bg-green-700 transition">통과</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────
export default function AdminTestCasesPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningTc, setRunningTc] = useState<TestCase | null>(null);

  // 전체 테스트 실행 상태 — 함수형 업데이트로 스테일 클로저 원천 차단
  const [runAllList, setRunAllList] = useState<TestCase[] | null>(null);
  const [runAllTotal, setRunAllTotal] = useState(0);
  const currentRunAllTc = runAllList?.[0] ?? null;
  const runAllCurrentNum = runAllList ? runAllTotal - runAllList.length + 1 : 0;

  // 필터
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterScreen, setFilterScreen] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // 페이징
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  // 액션 컬럼(Run/초기화 버튼) 클리핑 방지 위해 100→170 확대 + localStorage 키 v2 갱신
  // (페이지네이션은 1-based page state라 공통 Pagination 컴포넌트로 교체하지 않음)
  const { widths, startResize } = useColumnResize(
    'tpmp:admin-test-cases:col-widths:v2',
    [112, 80, 100, 240, 72, 60, 72, 120, 170],
  );

  useEffect(() => {
    setResults(loadResults());
    setLoading(false);
  }, []);

  const screens = useMemo(() => Array.from(new Set(TEST_CASES.map((tc) => tc.screen))).sort(), []);

  const filtered = useMemo(() => {
    return TEST_CASES.filter((tc) => {
      const status = results[tc.id]?.status ?? 'PENDING';
      if (filterCategory && tc.category !== filterCategory) return false;
      if (filterScreen && tc.screen !== filterScreen) return false;
      if (filterPriority && tc.priority !== filterPriority) return false;
      if (filterStatus && status !== filterStatus) return false;
      if (appliedKeyword) {
        const kw = appliedKeyword.toLowerCase();
        return tc.testName.toLowerCase().includes(kw) || tc.screen.toLowerCase().includes(kw) || tc.id.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [results, filterCategory, filterScreen, filterPriority, filterStatus, appliedKeyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const all = TEST_CASES;
    return {
      total:   all.length,
      pass:    all.filter((tc) => results[tc.id]?.status === 'PASS').length,
      fail:    all.filter((tc) => results[tc.id]?.status === 'FAIL').length,
      skip:    all.filter((tc) => results[tc.id]?.status === 'SKIP').length,
      pending: all.filter((tc) => !results[tc.id] || results[tc.id].status === 'PENDING').length,
    };
  }, [results]);

  const handleSaveResult = (id: string, result: TestResult) => {
    const next = { ...results, [id]: result };
    setResults(next);
    saveResults(next);
  };

  const handleResetResult = (id: string) => {
    const next = { ...results };
    delete next[id];
    setResults(next);
    saveResults(next);
  };

  const handleResetAll = () => {
    if (!confirm('모든 테스트 결과를 초기화하시겠습니까?')) return;
    setResults({});
    saveResults({});
  };

  const handleRunAll = () => {
    if (filtered.length === 0) return;
    if (!confirm(`현재 필터 조건의 테스트 케이스 ${filtered.length}건을 순서대로 실행합니다.`)) return;
    setRunAllTotal(filtered.length);
    setRunAllList([...filtered]);
  };

  const handleRunAllNext = () => {
    setRunAllList(prev => (prev && prev.length > 1) ? prev.slice(1) : null);
  };

  const handleRunAllStop = () => {
    setRunAllList(null);
  };

  const handleSearch = () => { setAppliedKeyword(keyword); setPage(1); };
  const handleResetFilter = () => {
    setFilterCategory(''); setFilterScreen(''); setFilterPriority('');
    setFilterStatus(''); setKeyword(''); setAppliedKeyword(''); setPage(1);
  };

  const handleStatCardClick = (status: string) => {
    setFilterStatus((prev) => (prev === status ? '' : status));
    setPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">테스트 케이스 관리</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">화면·기능별 테스트 케이스를 실행하고 결과를 기록합니다.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handleResetAll}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            전체 초기화
          </button>
          <button type="button" onClick={handleRunAll}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            전체 테스트 실행
          </button>
          <button type="button" onClick={() => downloadCsv(filtered, results)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Excel 다운로드
          </button>
        </div>
      </div>

      {/* 통계 — 클릭 시 해당 상태로 필터링 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          label="전체"
          count={stats.total}
          colorClass="text-gray-700 dark:text-gray-200"
          active={filterStatus === ''}
          onClick={() => handleStatCardClick('')}
        />
        <StatCard
          label="통과"
          count={stats.pass}
          colorClass="text-green-600"
          active={filterStatus === 'PASS'}
          onClick={() => handleStatCardClick('PASS')}
        />
        <StatCard
          label="실패"
          count={stats.fail}
          colorClass="text-red-600"
          active={filterStatus === 'FAIL'}
          onClick={() => handleStatCardClick('FAIL')}
        />
        <StatCard
          label="건너뜀"
          count={stats.skip}
          colorClass="text-blue-500"
          active={filterStatus === 'SKIP'}
          onClick={() => handleStatCardClick('SKIP')}
        />
        <StatCard
          label="미실행"
          count={stats.pending}
          colorClass="text-gray-400"
          active={filterStatus === 'PENDING'}
          onClick={() => handleStatCardClick('PENDING')}
        />
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap gap-2 items-center">
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">전체 카테고리</option>
          <option value="관리자">관리자</option>
          <option value="사용자">사용자</option>
        </select>
        <select value={filterScreen} onChange={(e) => { setFilterScreen(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">전체 화면</option>
          {screens.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">전체 우선순위</option>
          <option value="HIGH">높음</option>
          <option value="MEDIUM">중간</option>
          <option value="LOW">낮음</option>
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">전체 상태</option>
          <option value="PENDING">미실행</option>
          <option value="PASS">통과</option>
          <option value="FAIL">실패</option>
          <option value="SKIP">건너뜀</option>
        </select>
        <div className="flex gap-1.5 flex-1 min-w-[200px]">
          <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ID, 화면, 테스트명 검색"
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" onClick={handleSearch}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">검색</button>
          <button type="button" onClick={handleResetFilter}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">초기화</button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">조건에 맞는 테스트 케이스가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">ID<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">카테고리<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">화면<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                  <th className="px-4 py-3 font-semibold relative">테스트 케이스명<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">우선순위<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">유형<ColResizeHandle onMouseDown={(e) => startResize(5, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">상태<ColResizeHandle onMouseDown={(e) => startResize(6, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap relative">실행일시<ColResizeHandle onMouseDown={(e) => startResize(7, e)} /></th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {paginated.map((tc) => {
                  const result = results[tc.id];
                  const status: TestStatus = result?.status ?? 'PENDING';
                  return (
                    <tr key={tc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{tc.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tc.category === '관리자' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'}`}>
                          {tc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">{tc.screen}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium overflow-hidden truncate">{tc.testName}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={tc.priority} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{TYPE_CONFIG[tc.testType].label}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{result?.executedAt ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setRunningTc(tc)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition whitespace-nowrap">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Run
                          </button>
                          {result && (
                            <button type="button" onClick={() => handleResetResult(tc.id)}
                              className="text-xs text-gray-400 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition whitespace-nowrap">
                              초기화
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이징 */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>페이지당</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value) as 10 | 20 | 50); setPage(1); }}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}건</option>)}
            </select>
            <span>| 총 {filtered.length}건</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">{'<<'}</button>
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">{'<'}</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded border text-xs font-medium transition ${page === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {p}
                </button>
              ) : null;
            })}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">{'>'}</button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">{'>>'}</button>
          </div>
        </div>
      )}

      {/* 테스트 실행 모달 */}
      {currentRunAllTc ? (
        <RunModal
          key={`runall-${currentRunAllTc.id}`}
          tc={currentRunAllTc}
          existing={results[currentRunAllTc.id]}
          pageUrl={SCREEN_URL_MAP[currentRunAllTc.screen]}
          onClose={handleRunAllStop}
          onSave={(result) => handleSaveResult(currentRunAllTc.id, result)}
          runAll={{ current: runAllCurrentNum, total: runAllTotal, onNext: handleRunAllNext, onStop: handleRunAllStop }}
        />
      ) : runningTc ? (
        <RunModal
          key={`single-${runningTc.id}`}
          tc={runningTc}
          existing={results[runningTc.id]}
          pageUrl={SCREEN_URL_MAP[runningTc.screen]}
          onClose={() => setRunningTc(null)}
          onSave={(result) => handleSaveResult(runningTc.id, result)}
        />
      ) : null}
    </div>
  );
}
