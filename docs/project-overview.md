# Project Overview

## 서비스 소개

**TPMP(Test Preparation Master Project)**는 시험 준비와 개념 정리를 지원하는 웹 서비스입니다.  
사용자는 시험을 응시하고, 개념을 요약·정리하며, 관리자에게 질문할 수 있습니다.  
관리자는 시험을 등록·관리하고, 사용자 콘텐츠를 관리하며, 문의에 답변합니다.

향후 React Native(Expo) 기반 모바일 앱으로 확장 예정입니다.

---

## 도메인 모델

### 사용자(User)
| 필드 | 설명 |
|---|---|
| id | PK |
| email | 로그인 ID (unique) |
| password | bcrypt 해시 |
| name | 표시 이름 |
| role | USER / ADMIN |
| created_at | 가입일 |

### 시험(Exam)
| 필드 | 설명 |
|---|---|
| id | PK |
| title | 시험 제목 |
| order_no | 자동 생성 순번 |
| question_mode | RANDOM / SEQUENTIAL |
| created_by | 등록 관리자 FK |
| created_at | 등록일 |

### 문항(Question)
| 필드 | 설명 |
|---|---|
| id | PK |
| exam_id | 시험 FK |
| seq | 문항 순번 |
| content | 문항 내용 |
| question_type | MULTIPLE_CHOICE / SHORT_ANSWER / OX |
| options | JSON (객관식 선택지) |
| answer | 정답 |
| explanation | 해설 |
| source_file | 업로드 원본 파일명 (nullable) |

### 개념 요약(ConceptNote)
| 필드 | 설명 |
|---|---|
| id | PK |
| user_id | 작성자 FK |
| title | 제목 |
| content | 내용 (마크다운) |
| is_public | 공개 여부 |
| created_at / updated_at | 일시 |

### 1:1 문의(Inquiry)
| 필드 | 설명 |
|---|---|
| id | PK |
| user_id | 문의자 FK |
| title | 제목 |
| content | 내용 |
| status | PENDING / ANSWERED |
| reply | 답변 내용 (nullable) |
| replied_at | 답변 일시 (nullable) |
| created_at | 문의 일시 |

### 시험 응시 결과(ExamResult)
| 필드 | 설명 |
|---|---|
| id | PK |
| user_id | 응시자 FK |
| exam_id | 시험 FK |
| score | 점수 |
| answers | JSON (사용자 답안) |
| taken_at | 응시 일시 |

---

## 기능 요구사항

### 사용자 기능
1. **인증**: 회원가입, 로그인, 로그아웃, 토큰 갱신
2. **시험**
   - 시험 목록 조회 (페이지네이션)
   - 시험 상세 및 응시 (문항 순서: 랜덤/순차)
   - 응시 결과 및 오답 확인
3. **개념 요약**
   - 개념 등록 (마크다운 에디터)
   - 내 개념 목록 / 상세 조회
   - 수정 / 삭제
4. **1:1 문의**
   - 문의 등록
   - 내 문의 목록 / 답변 확인

### 관리자 기능
1. **시험 관리**
   - 시험 등록 (제목, 문항 순서 방식)
   - 문항 수동 등록 (1건, 다건)
   - 문항 파일 업로드 (PDF, HWP) → 서버 파싱 후 저장
   - 시험 수정 / 삭제
2. **개념 요약 관리**
   - 전체 사용자 개념 요약 목록 조회
   - 비공개 전환 / 삭제
3. **1:1 문의 관리**
   - 문의 목록 조회 (상태별 필터링)
   - 답변 등록

---

## 응답 포맷 표준

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "timestamp": "2026-04-18T00:00:00Z"
}
```

오류 시:
```json
{
  "success": false,
  "error": {
    "code": "EXAM_NOT_FOUND",
    "message": "시험을 찾을 수 없습니다."
  },
  "timestamp": "2026-04-18T00:00:00Z"
}
```
