## HIST-20260630-001

- **날짜**: 2026-06-30
- **수정 범위**: 관리자 백엔드 / AI 문항 분석
- **수정 개요**: QuestionAnalysisService의 Anthropic 직접 호출을 LlmTextProvider 인터페이스로 추상화하고, Anthropic·Ollama 구현체를 @ConditionalOnProperty로 분리하여 환경변수(AI_PROVIDER)로 provider 전환 가능하게 리팩토링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/ai/LlmTextProvider.java` | 추가 | LLM provider 추상화 인터페이스 — call(prompt, maxTokens) → String |
| `backend/src/main/java/com/tpmp/testprep/ai/AnthropicTextProvider.java` | 추가 | Anthropic Claude API 구현체. `@ConditionalOnProperty(app.ai.provider=anthropic)` |
| `backend/src/main/java/com/tpmp/testprep/ai/OllamaTextProvider.java` | 추가 | Ollama REST API 구현체. `@ConditionalOnProperty(app.ai.provider=ollama, matchIfMissing=true)` |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java` | 수정 | apiKey/model 필드·checkApiKey()·callAnthropicText() 제거 → LlmTextProvider 주입으로 교체. import 정리(RestClient/MediaType/JsonNode/Map/List/Value 제거) |
| `backend/src/main/resources/application.yml` | 수정 | local 프로파일 `app.ai` 블록 추가(provider: ollama 기본, ollama.base-url/model 환경변수화) |
| `backend/src/main/resources/application-docker.yml` | 수정 | `app.ai.provider: anthropic` 기본 + `app.anthropic.api-key/model` 환경변수 추가(fast-fail 적용) |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionAnalysisServiceTest.java` | 추가 | LlmTextProvider Mock 기반 단위 테스트 6개(analyze_success/jsonFence/invalidJson/blankInput×2, regenerate_success/singleLine) |

### 수정 상세

#### `QuestionAnalysisService.java`
- 변경 전: `@Value apiKey/model`, `checkApiKey()`, `callAnthropicText()` 직접 구현 포함
- 변경 후: `private final LlmTextProvider llmTextProvider` 주입, `llmTextProvider.call(...)` 위임. checkApiKey() 호출 제거
- 이유: provider 교체 시 서비스 코드 무수정으로 가능하게 추상화

#### `application.yml` (local 블록)
- 변경 전: `app.anthropic.*`만 존재
- 변경 후: `app.ai.provider: ${AI_PROVIDER:ollama}`, `app.ai.ollama.base-url/model` 추가
- 이유: 로컬 기본값 Ollama, `AI_PROVIDER=anthropic` 환경변수로 Anthropic 전환 가능

#### `application-docker.yml`
- 변경 전: `app.anthropic.*` 미존재
- 변경 후: `app.ai.provider: ${AI_PROVIDER:anthropic}`, `app.anthropic.api-key: ${ANTHROPIC_API_KEY}` (기본값 없음 fast-fail), `app.anthropic.model` 추가
- 이유: 프로덕션 기본값 Anthropic, API 키 누락 시 기동 시점 즉시 실패

### 설정 키 요약

| 키 | 기본값(local) | 기본값(docker) | 설명 |
|----|--------------|---------------|------|
| `app.ai.provider` | `ollama` | `anthropic` | 활성화할 LLM provider |
| `app.ai.ollama.base-url` | `http://localhost:11434` | — | Ollama 서버 URL |
| `app.ai.ollama.model` | `qwen2.5:7b` | — | Ollama 모델명 |
| `app.anthropic.api-key` | `""` | (필수, fast-fail) | Anthropic API 키 |
| `app.anthropic.model` | `claude-haiku-4-5-20251001` | `claude-haiku-4-5-20251001` | Anthropic 모델명 |

### 복원 방법
이 ID(HIST-20260630-001)만으로 복원 시 아래 내용을 각 파일에 적용한다.

1. `QuestionAnalysisService.java` — `LlmTextProvider` 필드 제거, `@Value apiKey/model`, `checkApiKey()`, `callAnthropicText()` 원복, `analyze()`·`regenerate()` 앞에 `checkApiKey()` 재추가, `callAnthropicText()` 호출로 교체.
2. `application.yml` local 블록 — `app.ai` 하위 4줄 제거.
3. `application-docker.yml` — `app.ai`·`app.anthropic` 하위 3줄 제거.
4. `ai/LlmTextProvider.java`, `ai/AnthropicTextProvider.java`, `ai/OllamaTextProvider.java` — 파일 삭제.
5. `QuestionAnalysisServiceTest.java` — 파일 삭제.
