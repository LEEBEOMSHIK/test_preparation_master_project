# Agent Role Division — 상세 가이드

TPMP 작업은 **5단계 파이프라인**으로 체계화한다.

```
분석              설계             구현              검증(정적)         테스트(동적)
codebase-explorer → webapp-planner → webapp-developer → webapp-verifier → webapp-tester
```

| 단계 | 에이전트 | 모델 | 정의 위치 | 코드 수정 |
|------|---------|------|----------|:--------:|
| 분석 | codebase-explorer | haiku | 사용자 레벨 | ✕ |
| 설계 | webapp-planner | sonnet | `.claude/agents/webapp-planner.md` | ✕ |
| 구현 | webapp-developer | sonnet | 사용자 레벨 | ○ |
| 검증 | webapp-verifier | (상속) | `.claude/agents/webapp-verifier.md` | ✕ |
| 테스트 | webapp-tester | sonnet | `.claude/agents/webapp-tester.md` | ✕ |

> 게임 프로젝트 전용 에이전트(`plan-architect`, `game-developer`, `game-tester`)는 TPMP 워크플로우에 사용하지 않는다.

---

## 비용 절감형 운영 보정

5단계 파이프라인은 기본값이 아니라 **필요할 때 적용하는 고신뢰 모드**다. 요청 화면·메뉴·파일·API가 명시된 경우에는 해당 경로부터 좁게 탐색하고, 영향 범위가 실제로 넓다고 확인된 뒤에만 에이전트 파이프라인을 확장한다.

- `rg`는 ripgrep 검색 도구다. 빠르지만 출력이 많으면 모델 컨텍스트 비용이 커지므로, 항상 경로와 제외 대상을 제한한다.
- 기본 제외 대상: `docs/history/**`, `backend/build/**`, `frontend/.next/**`, `frontend/tsconfig.tsbuildinfo`, `*.tsbuildinfo`, `references/**`, `node_modules/**`.
- 전체 저장소 검색은 좁은 탐색이 실패했거나 공통 유틸·전역 정책 영향이 의심될 때만 수행한다.
- subagent는 사용자가 명시했거나, 영향 범위가 불명확한 다중 레이어·고위험 변경에서만 사용한다.
- 검증 루프는 실패한 범위부터 다시 돌린다. 전체 빌드·전체 테스트는 마지막 1회 확인을 기본으로 한다.
- 문서만 변경한 작업은 빌드·테스트를 실행하지 않고 문서 내용·링크·규칙 충돌 여부만 확인한다.

---

## 세션 인계 기준

긴 작업은 `docs/agent-handoff/CURRENT.md`를 단계 경계마다 갱신해 다른 AI나 새 세션이 이어받을 수 있게 한다.

`CURRENT.md`는 누적 로그가 아니라 최신 작업 1개의 상태 스냅샷이다. 새 작업을 시작할 때 이전 내용을 이어 붙이지 말고 덮어쓴다. 완료된 작업의 상세 기록은 git commit과 `docs/history/`가 담당하며, 장기 보관이 꼭 필요한 인계 기록만 `docs/agent-handoff/archive/` 하위로 이동한다.

### 갱신 시점

- 탐색 완료 후 구현 시작 전
- 설계 승인 후 구현 시작 전
- 구현 완료 후 검증 시작 전
- 검증·테스트 실패 후 재수정 시작 전
- 파일 5개 이상 수정 또는 DB/API/공통 유틸 변경이 발생한 시점
- subagent 또는 검증 루프가 1회 이상 발생한 시점
- 커밋 전, 커밋·푸시 완료 후

### 피해야 할 중단 지점

- DB 마이그레이션 작성 중
- 다중 파일 rename 중
- 테스트 실패 수정 중
- `git add`/`commit`/`push` 진행 중

`CURRENT.md`에는 현재 목표, 사용자 결정, 완료/미완료 작업, 수정 파일, 검증 결과, 다음 명령, 주의할 미추적 파일을 반드시 남긴다.

---

## codebase-explorer — 분석 전담

| 작업 유형 | 예시 |
|----------|------|
| 파일/디렉토리 구조 파악 | "이 기능이 어느 파일에 있는지 찾아줘" |
| 패턴·컨벤션 탐색 | "기존 API 엔드포인트 구현 방식을 확인해줘" |
| 컴포넌트 사용처 추적 | "RichContent가 어디서 쓰이는지 전부 알려줘" |
| 레이어 간 의존 관계 파악 | "Controller → Service → Repository 흐름 추적" |
| 아키텍처 결정 근거 조사 | "인증 미들웨어가 왜 이렇게 구성됐는지 파악" |
| 코딩 컨벤션 준수 여부 감사 | "현재 파일들이 snake_case 컨벤션을 따르는지 확인" |

- 파일을 읽고 탐색하되 코드를 직접 수정하지 않는다.
- 탐색 결과를 요약해 webapp-planner 또는 webapp-developer에 전달한다.
- 탐색 범위가 3개 쿼리 이상인 개방형 탐색은 이 에이전트를 사용한다. 단, 사용자가 화면·메뉴·파일·API를 명시했다면 먼저 해당 경로에서 좁게 탐색한다.

---

## webapp-planner — 설계 전담

codebase-explorer 결과를 바탕으로 구현 전략을 수립한다. 코드는 작성하지 않는다.

**webapp-planner 사용 판단 기준**

| 조건 | 사용 여부 |
|------|----------|
| 수정 파일 3개 이상 + 파일 간 의존 관계 있음 | 사용 |
| 기존 코드 연결 방식이 분석 결과만으로 불명확 | 사용 |
| 구현 방식의 선택지 2개 이상 (트레이드오프 필요) | 사용 |
| 신규 파일 1개 추가 또는 단순 필드 추가 | 생략 |
| codebase-explorer 결과로 구현 경로가 명확 | 생략 |

- 산출물: 영향 범위(FE/BE/DB) 표, 아키텍처 결정·이유·대안, 단계별 구현 계획, 컨벤션 체크리스트, 검증·테스트 계획, 리스크.
- webapp-developer에 전달 시 파일 경로·클래스/메서드명·DTO·인터페이스 변경 사항을 구체적으로 포함한다.

---

## webapp-developer — 구현 전담

| 작업 유형 | 예시 |
|----------|------|
| 신규 페이지/기능 구현 | "시험 목록 페이지를 카드형으로 만들어줘" |
| 기존 코드 수정 | "ExamList에 필터 기능 추가해줘" |
| API 엔드포인트 추가 | "파일 업로드 REST API를 백엔드에 추가해줘" |
| 풀스택 기능 개발 | "퀴즈 기능 프론트·백엔드 모두 구현해줘" |
| 버그 수정 | "로그인 후 리다이렉트가 안 되는 버그 고쳐줘" |
| 리팩토링 | "이 컴포넌트를 공통 유틸로 추출해줘" |

- TPMP 컨벤션(TypeScript strict, Tailwind, Controller-Service-Repository 3레이어) 준수.
- 구현 완료 후 히스토리 파일 자동 작성, CLAUDE.md 관련 섹션 업데이트.
- **유일하게 코드를 수정하는 에이전트.** 검증·테스트 단계에서 받은 문제 항목은 이 에이전트가 재구현한다.

---

## webapp-verifier — 검증 전담 (정적)

구현 완료 후 코드 품질·컨벤션 준수·누락 항목을 **읽어서** 독립적으로 점검한다. 코드를 실행하지 않는다.
에이전트 정의: `.claude/agents/webapp-verifier.md`

**검증 대상 및 체크리스트**

| 검증 항목 | 확인 방법 |
|----------|----------|
| TypeScript strict 오류 | import 경로·타입 선언·`any` 사용 여부 확인 |
| Java 타입 안전성 | 제네릭 누락·raw type 사용 여부 확인 |
| 스켈레톤 UI 누락 | 데이터 페칭 화면에 `TableSkeleton`/`CardListSkeleton` 적용 여부 |
| 공통 유틸 미사용 | `dangerouslySetInnerHTML` 직접 사용, 인라인 `replace` 여부 |
| 히스토리 파일 | `docs/history/` 내 해당 HIST ID 파일 존재 여부 |
| API 3레이어 완결 | Controller·Service·Repository 모두 작성됐는지 |
| 보안 정책 준수 | 파일 업로드 시 확장자 검증·UUID 변환 여부 |
| CLAUDE.md 동기화 | 새 유틸·스켈레톤 추가 시 표 갱신 여부 |

**검증 실행 조건**

| 상황 | 검증 필요 |
|------|---------|
| 신규 기능 구현 (파일 3개↑) | 필수 |
| 보안 관련 변경 (인증·인가·파일업로드) | 필수 |
| 공통 유틸·컴포넌트 추가 | 필수 |
| 코드(JSX·로직·타입) 변경 — 다중 파일·공유 영향 | 필수 |
| 단일 파일·소규모 스타일/문구 변경 | 메인 에이전트 자체 확인으로 갈음 가능 |
| 순수 문서·히스토리·주석만 변경 | 생략 가능 |

- webapp-verifier는 코드를 수정하지 않는다. 문제 발견 시 항목과 위치를 보고하고 webapp-developer에 재전달한다.
- 검증 결과 이상 없으면 다음 단계(webapp-tester)로 넘어간다.

---

## webapp-tester — 테스트 전담 (동적)

정적 검증 통과 후, 실제로 빌드·테스트·타입체크를 **실행하여** 런타임 수준 결함을 잡는다.
에이전트 정의: `.claude/agents/webapp-tester.md`

**검증과의 차이**

| 구분 | webapp-verifier | webapp-tester |
|------|-----------------|---------------|
| 방식 | 코드를 읽어서 점검 (정적) | 명령을 실행해 점검 (동적) |
| 도구 | Glob, Grep, Read | Bash, PowerShell, Read, Grep, Glob |
| 잡는 결함 | 컨벤션·타입 선언·누락 | 컴파일 오류·테스트 실패·런타임 예외 |

**실행 명령 (해당 항목만)**

| 대상 | 명령 |
|------|------|
| BE 컴파일·테스트 | `cd backend; ./gradlew test` |
| FE 타입체크 | `cd frontend; npx tsc --noEmit` |
| FE 린트 | `cd frontend; npm run lint` |
| FE 테스트 | `cd frontend; npm test -- --watch=false` |
| FE 빌드 | `cd frontend; npm run build` |

**실행 조건**

| 상황 | 테스트 실행 |
|------|------------|
| 신규 API/Service 메서드 추가 | 필수 (백엔드 테스트) |
| 신규 페이지/컴포넌트 추가 | 필수 (타입체크·빌드) |
| 공통 유틸·스켈레톤 변경 | 필수 (양쪽 영향 확인) |
| 코드 변경 (로직·타입·API 영향) | 최소 타입체크 필수. dev 서버 가동 시 `npm run build` 대신 `npx tsc --noEmit`·lint |
| 단순 문구/스타일 변경 | 필요 시 타입체크만 실행 |
| 문서·히스토리 파일만 작성 | 생략 |

- 빌드·테스트·타입체크 등 읽기/검증 성격의 명령만 실행한다. 배포·DB 파괴·푸시 명령은 실행하지 않는다.
- 코드를 수정하지 않는다. 실패 발견 시 로그와 함께 webapp-developer에 보고하고 재구현을 요청한다.

---

## 표준 워크플로우

```
사용자 요청
    │
    ▼
[1] codebase-explorer — 구조·패턴 분석 (탐색 3쿼리↑면 필수)
    │
    ▼
[2] webapp-planner 사용 여부 판단 (위 기준표 적용)
    │
    ├─ [설계 필요]
    │       ▼
    │   [2] webapp-planner — 설계 수립 (파일 목록·순서·인터페이스 확정)
    │       ▼
    │   [3] webapp-developer — 코드 구현 + 히스토리 작성
    │       ▼
    │   [4] webapp-verifier — 정적 검증 (컨벤션·타입·누락)
    │       ▼
    │   [5] webapp-tester — 동적 테스트 (빌드·테스트·타입체크)
    │
    └─ [설계 생략]
            ▼
        [3] webapp-developer — 구현 직행 + 히스토리 작성
            ▼
        [4] webapp-verifier — 정적 검증 (신규 기능·보안 변경 시)
            ▼
        [5] webapp-tester — 동적 테스트 (신규 API/페이지 추가 시)
```

**되돌림 루프:** webapp-verifier 또는 webapp-tester가 문제를 발견하면 → webapp-developer가 재구현 → 다시 해당 단계 검증. 모든 단계 통과 시 작업 완료.
