## HIST-20260702-002

- **날짜**: 2026-07-02
- **수정 범위**: 관리자 백엔드 / AI 문항 분석 — keyword_tag 전역 태그 사전 완전 제거
- **수정 개요**: keyword_tag(전역 태그 사전) 기능 전체 제거. 백엔드 6개 파일(Controller·Service·DTO·Repository·Entity) 삭제. DB 정리용 DROP SQL 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/AdminKeywordTagController.java` | 삭제 | keyword_tag CRUD REST 컨트롤러 |
| `backend/src/main/java/com/tpmp/testprep/service/KeywordTagService.java` | 삭제 | keyword_tag 저장·조회 서비스 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/KeywordTagBulkRequest.java` | 삭제 | 태그 일괄저장 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/KeywordTagResponse.java` | 삭제 | 태그 조회 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/repository/KeywordTagRepository.java` | 삭제 | keyword_tag JPA 리포지토리 |
| `backend/src/main/java/com/tpmp/testprep/entity/KeywordTag.java` | 삭제 | keyword_tag 엔티티 |
| `docs/db-migration/20260702_01_drop_keyword_tag.sql` | 추가 | keyword_tag 테이블 DROP 마이그레이션 SQL |

### 수정 상세

#### 삭제된 백엔드 파일 요약
- `AdminKeywordTagController`: `POST /admin/keyword-tags/bulk` (일괄저장), `GET /admin/keyword-tags` (type·q 검색) 엔드포인트
- `KeywordTagService`: saveBulk(keywords, domains) — keyword·domain 태그 upsert; search(type, q) — 이름 contains 검색
- `KeywordTagBulkRequest`: `record(List<String> keywords, List<String> domains)`
- `KeywordTagResponse`: `record(Long id, String name, String type, long useCount)`
- `KeywordTagRepository`: `JpaRepository<KeywordTag, Long>`, `findByTypeAndNameContainingIgnoreCase` 메서드
- `KeywordTag`: id·name(unique per type)·type('KEYWORD'|'DOMAIN')·useCount 컬럼 엔티티

#### grep 참조 확인 결과
- 삭제 대상 6개 파일 외 백엔드 전체에서 KeywordTag 관련 클래스 참조 없음 (안전 삭제 확인)

#### DB 마이그레이션
- `docs/db-migration/20260702_01_drop_keyword_tag.sql`: `DROP TABLE IF EXISTS keyword_tag;`
- 로컬 DB 실제 적용은 별도 수행. `ddl-auto: validate` 환경에서는 DB에 여분 테이블이 남아도 기동에 지장 없으므로 DROP은 정리 목적.

### 복원 방법
이 ID(HIST-20260702-002)만으로 복원 시:
- 삭제된 6개 Java 파일을 원래 경로에 재생성 (각 파일의 변경 전 코드는 이 항목 작성 이전 git 커밋에서 확인)
- `docs/db-migration/20260702_01_drop_keyword_tag.sql` 삭제
- DROP이 이미 실행된 DB라면 `CREATE TABLE keyword_tag (...)` 재생성 필요

---

## HIST-20260702-001

- **날짜**: 2026-07-02
- **수정 범위**: 관리자 백엔드 / AI 문항 분석 — 프롬프트 한국어 강제
- **수정 개요**: 로컬 Ollama qwen2.5:7b(중국 Alibaba 모델)가 keywords/domains/summary/content/answer에 중국어를 혼입하는 버그 수정. buildAnalyzePrompt·buildRegeneratePrompt·buildRegenerateCodePrompt에 한국어 강제 지시 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java` | 수정 | 3개 프롬프트 빌더에 한국어 강제 문구 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java`

**[1] buildAnalyzePrompt — keywords/domains/summary 한국어 강제**
- 변경 전: `JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.` 1줄만 존재
- 변경 후: 그 위에 `keywords, domains, summary는 모두 반드시 한국어로 작성하세요. 중국어·일본어 등 외국어를 절대 섞지 마세요. 단 널리 쓰이는 기술 용어·약어(예: SQL, HTTP, API, JVM)는 원문 그대로 사용해도 됩니다.` 추가
- 이유: qwen2.5:7b가 분석 결과의 keywords/domains/summary를 중국어로 생성하는 경우 발생

**[2] buildRegeneratePrompt (비-CODE) — 문제 본문 한국어 강제**
- 변경 전: 요구사항 3줄(동일 개념 다른 각도 + 간결 3~4문장 + 번호·보기·정답 제외)
- 변경 후: `- 문제는 반드시 한국어로 작성하세요(기술 약어 제외).` 1줄 추가(총 4줄)
- 이유: qwen2.5:7b가 재구성 문제 본문을 중국어로 출력하는 경우 발생

**[3] buildRegenerateCodePrompt (CODE) — content·answer·코드 주석 한국어 강제**
- 변경 전: 간결화 지시 이후 바로 JSON 반환 지시
- 변경 후: `- content(문제 설명)와 answer는 반드시 한국어로 작성하세요. 코드 주석도 한국어로. 중국어·일본어를 섞지 마세요(기술 약어 제외).` 1줄 추가
- 이유: CODE 재구성에서도 content와 answer, 코드 주석이 중국어로 생성되는 경우 발생

### 복원 방법
이 ID(HIST-20260702-001)만으로 복원 시 `QuestionAnalysisService.java`에서 아래 3줄을 제거한다.
- `buildAnalyzePrompt`: `keywords, domains, summary는 모두 반드시 한국어로 ...` 줄 제거
- `buildRegeneratePrompt`: `- 문제는 반드시 한국어로 작성하세요(기술 약어 제외).` 줄 제거
- `buildRegenerateCodePrompt`: `- content(문제 설명)와 answer는 반드시 한국어로 ...` 줄 제거

---

## HIST-20260701-003

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / 문제 재구성(QuestionAnalysisService)
- **수정 개요**: 로컬 Ollama 7B 모델 120초 타임아웃 초과 버그 수정 — 재구성 num_predict 축소 및 프롬프트 간결화 지시 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java` | 수정 | regenerateText maxTokens 2048→1024, regenerateCode maxTokens 3072→1536, 각 프롬프트에 간결화 지시 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java`

**[1] regenerateText — maxTokens 축소**
- 변경 전: `llmTextProvider.call(prompt, 2048)`
- 변경 후: `llmTextProvider.call(prompt, 1024)`
- 이유: 로컬 Ollama qwen2.5:7b가 2048 토큰 생성을 120초 안에 완료하지 못해 타임아웃 발생. analyze(1024)는 성공하므로 동일 수준으로 축소.

**[2] regenerateCode — maxTokens 축소**
- 변경 전: `llmTextProvider.call(prompt, 3072)`
- 변경 후: `llmTextProvider.call(prompt, 1536)`
- 이유: CODE 재구성도 동일 타임아웃 문제. 1536으로 절반 수준 축소.

**[3] buildRegeneratePrompt (비-CODE) — 간결화 지시 추가**
- 변경 전: 요구사항이 2줄 (동일 개념 다른 각도 + 번호·보기·정답 제외)
- 변경 후: `- 문제는 간결하게 3~4문장 이내로 작성하세요` 한 줄 추가(총 3줄)
- 이유: 모델이 불필요하게 긴 문제를 생성하지 않도록 유도해 출력 토큰 절감.

**[4] buildRegenerateCodePrompt (CODE) — 간결화 지시 추가**
- 변경 전: answer 항목 다음 바로 JSON 반환 지시
- 변경 후: `- code는 20줄 이내로 간결하게, content는 1~2문장, answer는 짧게 작성하세요` 줄 추가 후 JSON 반환 지시
- 이유: 코드·설명·정답 각각의 길이를 명시적으로 제한해 1536 토큰 예산 안에서 완성될 수 있도록 유도.

### 복원 방법
HIST-20260701-003 복원 시 아래 내용을 `QuestionAnalysisService.java`에 적용한다.
- `regenerateText`: `llmTextProvider.call(prompt, 1024)` → `llmTextProvider.call(prompt, 2048)`
- `regenerateCode`: `llmTextProvider.call(prompt, 1536)` → `llmTextProvider.call(prompt, 3072)`
- `buildRegeneratePrompt`: `- 문제는 간결하게 3~4문장 이내로 작성하세요` 줄 제거
- `buildRegenerateCodePrompt`: `- code는 20줄 이내로 간결하게, content는 1~2문장, answer는 짧게 작성하세요` 빈 줄 포함 2줄 제거

---

## HIST-20260701-002

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / 문항 AI 재구성 — CODE 문항 code+content+answer 통합 재생성
- **수정 개요**: CODE 문항 재구성 시 content(설명)만 생성하던 것을 code(코드)·answer(정답)까지 함께 생성하도록 분기 확장. DTO에 questionType·originalCode·language 추가, 응답에 code·answer 필드 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionRegenerateRequest.java` | 수정 | 4→7 필드: questionType, originalCode, language 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionRegenerateResponse.java` | 수정 | 1→3 필드: code, answer 추가 (CODE만 채움, 비-CODE는 null) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java` | 수정 | regenerate() 분기(TEXT/CODE), regenerateText/regenerateCode 분리, buildRegenerateCodePrompt, CodeRegenResult private record 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionAnalysisServiceTest.java` | 수정 | 기존 2케이스 7인자로 수정, CODE 재구성 신규 3케이스 추가 |

### 수정 상세

#### `QuestionRegenerateRequest.java`
- 변경 전: `record(keywords, domains, difficulty, originalContent)` 4필드
- 변경 후: `record(keywords, domains, difficulty, originalContent, questionType, originalCode, language)` 7필드
- 이유: CODE 문항 재구성 시 원본 코드·언어 전달 필요

#### `QuestionRegenerateResponse.java`
- 변경 전: `record(String content)` 단일 필드
- 변경 후: `record(String content, String code, String answer)` 3필드
- 이유: CODE 재구성 결과의 코드·정답을 별도 필드로 반환, 비-CODE는 null 반환

#### `QuestionAnalysisService.java`
- 변경 전: `regenerate()`가 단일 텍스트 생성 로직만 존재, `new QuestionRegenerateResponse(html)` 반환
- 변경 후:
  - `regenerate()` → questionType="CODE"이면 `regenerateCode()`, 아니면 `regenerateText()` 분기
  - `regenerateText()`: 기존 로직 이동, `new QuestionRegenerateResponse(html, null, null)` 반환
  - `regenerateCode()`: LLM 호출(3072 토큰), ```json 펜스 제거, JSON 파싱 → `CodeRegenResult`, content는 `<p>` 감쌈
  - `buildRegenerateCodePrompt()`: 언어·원본코드·설명·키워드·도메인·난이도 기반 프롬프트, JSON 반환 강제 지시
  - `private record CodeRegenResult(String content, String code, String answer)` 파일 내 추가
- 이유: CODE 유형 특화 재구성으로 실행 가능한 코드와 정답을 content와 함께 생성

#### `QuestionAnalysisServiceTest.java`
- 변경 전: `regenerate_success`, `regenerate_singleLine`에서 4인자 생성자 사용
- 변경 후: 7인자로 수정 (끝에 null, null, null 추가), result.code()/result.answer() null 검증 추가
- 신규: `regenerateCode_success`(content/code/answer 정상 매핑), `regenerateCode_jsonFence`(```json 펜스 파싱), `regenerateCode_invalidJson`(AI_ANALYSIS_FAILED)

### 복원 방법
이 ID(HIST-20260701-002)만으로 복원 시:
- `QuestionRegenerateRequest`: 4필드 record로 되돌림
- `QuestionRegenerateResponse`: `record(String content)` 단일 필드로 되돌림
- `QuestionAnalysisService`: `regenerate()` 단일 메서드(기존 regenerateText 본문), 분기·신규 메서드·CodeRegenResult·buildRegenerateCodePrompt 삭제, 반환 `new QuestionRegenerateResponse(html)`으로 원복
- `QuestionAnalysisServiceTest`: 기존 2케이스 4인자로 되돌림, 신규 3케이스 삭제

---

## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / AI 문항 분석 — CODE 문항 코드 포함 분석
- **수정 개요**: CODE 문항 분석 시 문제 설명(content)뿐 아니라 코드(code)·언어(language)도 분석 입력에 포함. 코드는 `stripHtml` 없이 원본 그대로 프롬프트에 삽입하여 `<`, `>` 등 코드 특수문자가 훼손되지 않도록 함. 비-CODE 문항은 기존과 동일(코드 섹션 없는 프롬프트).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionAnalysisRequest.java` | 수정 | `code`, `language` optional 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionAnalysisService.java` | 수정 | `analyze(content, code, language)` 시그니처 확장 + `buildAnalyzePrompt(content, code, language)`에 코드 섹션(stripHtml 미적용) 추가 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminQuestionController.java` | 수정 | analyze 호출에 `request.code()`, `request.language()` 전달 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionAnalysisServiceTest.java` | 수정 | analyze 호출 5곳 `(content, null, null)` 갱신 + `analyze_withCode` 케이스(코드 원본 프롬프트 포함 검증) 추가 |

### 되돌림 방법

`analyze`를 단일 인자(`analyze(content)`)로 복원, `QuestionAnalysisRequest`에서 `code`/`language` 제거, `buildAnalyzePrompt` 코드 섹션 제거, Controller 호출 원복, 테스트 원복.

---

## HIST-20260630-002

- **날짜**: 2026-06-30
- **수정 범위**: 관리자 백엔드 / AI 문항 분석 — RestClient 타임아웃 설정
- **수정 개요**: OllamaTextProvider·AnthropicTextProvider의 `RestClient.create()` (무한 대기)를 `SimpleClientHttpRequestFactory` 기반 타임아웃 설정 RestClient로 교체하여 무한 행 방지. 로컬 Ollama 분석 오류의 근본 원인(프론트 axios 전역 10초 타임아웃)도 함께 수정(프론트 히스토리 HIST-20260630-001 참조).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/ai/OllamaTextProvider.java` | 수정 | `RestClient.create()` → `SimpleClientHttpRequestFactory(connect=5s, read=120s)` 기반 정적 필드 `REST_CLIENT`로 교체 |
| `backend/src/main/java/com/tpmp/testprep/ai/AnthropicTextProvider.java` | 수정 | `RestClient.create()` → `SimpleClientHttpRequestFactory(connect=5s, read=60s)` 기반 정적 필드 `REST_CLIENT`로 교체 |

### 수정 상세

#### `OllamaTextProvider.java`
- 변경 전: 매 호출마다 `RestClient.create()`로 타임아웃 없는 클라이언트 생성
- 변경 후: static 초기화 블록에서 `SimpleClientHttpRequestFactory(connect=5s, read=120s)`로 `REST_CLIENT` 1회 생성 후 재사용
- 이유: 로컬 7B 모델 콜드스타트+토큰생성이 10초를 초과하여 프론트가 먼저 끊기는 현상 발생 → 백엔드도 적절한 상한(120초)을 설정해 무한 대기 방지

#### `AnthropicTextProvider.java`
- 변경 전: 매 호출마다 `RestClient.create()`로 타임아웃 없는 클라이언트 생성
- 변경 후: static 초기화 블록에서 `SimpleClientHttpRequestFactory(connect=5s, read=60s)`로 `REST_CLIENT` 1회 생성 후 재사용
- 이유: 외부 API 무응답 시 스레드 무한 점유 방지. Anthropic은 60초면 충분(Ollama보다 짧게 설정)

### 복원 방법
이 ID(HIST-20260630-002)만으로 복원 시 아래 내용을 각 파일에 적용한다.

1. `OllamaTextProvider.java` — `import SimpleClientHttpRequestFactory`, `import Duration` 제거. `static { ... }` 블록과 `REST_CLIENT` 필드 제거. `REST_CLIENT.post()` → `RestClient.create().post()`로 원복.
2. `AnthropicTextProvider.java` — 동일 방식으로 원복.

---

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
