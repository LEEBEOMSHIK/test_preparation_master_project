# Code Guidelines

## Frontend (Next.js + TypeScript)

### 파일 / 디렉토리 네이밍
- 컴포넌트 파일: PascalCase (`ExamCard.tsx`)
- 페이지 파일: `page.tsx` (App Router 규칙)
- 훅: `use` 접두사 camelCase (`useExamList.ts`)
- 서비스: camelCase (`examService.ts`)
- 타입: PascalCase interface (`ExamDto.ts`)

### 컴포넌트 작성 규칙
```tsx
// 1. React Native Web 호환 컴포넌트 — View/Text 사용
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Props 타입 명시
interface ExamCardProps {
  exam: ExamSummary;
  onPress: (id: number) => void;
}

// 3. 함수형 컴포넌트 + 명명된 export
export function ExamCard({ exam, onPress }: ExamCardProps) { ... }
```

### API 서비스 레이어
```ts
// src/services/examService.ts
import { apiClient } from './apiClient';

export const examService = {
  getExams: (page: number) => apiClient.get<PageResponse<ExamSummary>>('/user/exams', { params: { page } }),
  submitExam: (id: number, answers: AnswerRequest) => apiClient.post(`/user/exams/${id}/submit`, answers),
};
```

### 전역 상태 (Zustand)
```ts
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clear: () => void;
}
```

### 금지 사항
- `any` 타입 사용 금지 (unknown 또는 명확한 타입 사용)
- `console.log` 프로덕션 코드에 남기지 않기
- 직접 fetch 호출 금지 (반드시 services/ 레이어 사용)

---

## Backend (Spring Boot / Java)

### 패키지 구조 원칙
- Controller: HTTP 요청/응답만 처리, 비즈니스 로직 없음
- Service: 트랜잭션 경계, 비즈니스 로직
- Repository: 데이터 접근만 담당
- Entity: DB 매핑, 비즈니스 메서드 포함 가능 (도메인 모델)

### 컨트롤러 패턴
```java
@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
public class AdminExamController {

    private final ExamService examService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody ExamCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse response = examService.createExam(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }
}
```

### 서비스 패턴
```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;

    @Transactional
    public ExamResponse createExam(ExamCreateRequest request, String adminEmail) { ... }
}
```

### 예외 처리
```java
// ErrorCode enum 사용
throw new BusinessException(ErrorCode.EXAM_NOT_FOUND);

// @ControllerAdvice에서 일괄 처리
@ExceptionHandler(BusinessException.class)
public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) { ... }
```

### 네이밍 컨벤션
- 클래스: PascalCase
- 메서드/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- DB 컬럼 매핑: `@Column(name = "snake_case_name")`

### 금지 사항
- `@Transactional` 없는 데이터 변경 금지
- Entity를 직접 응답으로 반환 금지 (반드시 DTO 변환)
- `System.out.println` 사용 금지 (SLF4J Logger 사용)
- N+1 쿼리 방치 금지 (fetch join 또는 @BatchSize 사용)

---

## 공통 규칙

### 브랜치 전략
```
main          ← 배포 브랜치
develop       ← 통합 브랜치 (선택)
feature/fe-*  ← 프론트엔드 기능
feature/be-*  ← 백엔드 기능
fix/be-*      ← 버그 수정
```

### 커밋 메시지
```
[FE] feat: 시험 목록 페이지 구현
[BE] feat: 파일 업로드 문항 등록 API
[BE] fix: JWT 만료 예외 처리 누락
[INFRA] chore: Docker nginx 설정 추가
```

### 테스트 커버리지 목표
- Backend Service 레이어: 80% 이상
- Frontend 주요 컴포넌트: Jest + React Testing Library
