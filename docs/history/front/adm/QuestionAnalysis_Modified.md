## HIST-20260630-001

- **날짜**: 2026-06-30
- **수정 범위**: 관리자 프론트엔드 / AI 문항 분석 — axios 요청별 타임아웃 연장
- **수정 개요**: 로컬 Ollama LLM 분석 시 "AI 분석 중 오류가 발생했습니다" 버그 수정. 근본 원인은 apiClient.ts 전역 타임아웃 10초인데 7B 모델 콜드스타트+토큰생성이 이를 초과해 프론트가 먼저 연결을 끊는 것. analyze/regenerate 호출에 요청별 timeout 120000ms를 추가하여 해결. 전역 설정은 무변경.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/questionAnalysisService.ts` | 수정 | `AI_TIMEOUT` 상수(`{ timeout: 120_000 }`) 추가. `analyze`·`regenerate` 호출 세 번째 인자로 전달 |

### 수정 상세

#### `frontend/src/services/questionAnalysisService.ts`
- 변경 전:
  ```ts
  analyze: (content) =>
    apiClient.post('/admin/questions/analyze', { content }),
  regenerate: (data) =>
    apiClient.post('/admin/questions/regenerate', data),
  ```
- 변경 후:
  ```ts
  const AI_TIMEOUT = { timeout: 120_000 } as const;
  analyze: (content) =>
    apiClient.post('/admin/questions/analyze', { content }, AI_TIMEOUT),
  regenerate: (data) =>
    apiClient.post('/admin/questions/regenerate', data, AI_TIMEOUT),
  ```
- 이유: axios 요청별 config의 timeout은 전역 설정을 덮어쓰므로, AI 호출만 선택적으로 120초로 연장 가능. 다른 API(전역 10초)는 영향 없음.

### 복원 방법
이 ID(HIST-20260630-001)만으로 복원 시 `questionAnalysisService.ts`에서 `AI_TIMEOUT` 상수 선언 1줄을 삭제하고, `analyze`·`regenerate` 호출에서 세 번째 인자(`AI_TIMEOUT`)를 제거한다.
