---
schema_version: 1
project: test_preparation_master_project
scope: project
destructive_approval: required
---

# 캐시 정책

## 목적과 소유권

이 저장소가 소유하는 frontend, backend, 앱 컨테이너 생성 산출물만 다룬다. DB 상태, 업로드, 사용자 작업, Docker 볼륨, Codex 세션, 공유 builder 캐시는 제거 범위 밖이다.

## 보존 대상

- 저장소 소스, `.git`, 문서, handoff/history, 설정, 비밀값, 모든 현재 사용자 변경.
- 실행 여부와 무관하게 `tpmp-db`, `tpmp-db-local` 컨테이너.
- `postgres_data`, `postgres_data_local`, `test_preparation_master_project_postgres_data`, `test_preparation_master_project_postgres_data_local`과 DB 컨테이너의 모든 마운트.
- 현재 프로젝트/등록 worktree가 실제 사용하는 `uploads`, `test_preparation_master_project_uploads`, 모든 upload bind mount와 업로드 파일은 보존하며, 아래 폐기 worktree 예외만 허용한다.
- 보존 DB 컨테이너가 참조하는 PostgreSQL 15 Alpine 이미지.

## 조사 가능한 캐시 대상

- Compose project 라벨이 `test_preparation_master_project`이고 service 라벨이 backend, frontend, nginx인 컨테이너.
- 해당 앱 서비스만 참조하는 이미지.
- `frontend/.next`, `frontend/node_modules/.cache`, `backend/build`, 저장소 내부 backend `.gradle`, `.pytest_cache`, Python `__pycache__`.
- 정규화된 `<project-root>/.worktrees/<name>` 하위의 폐기 후보 사본(활성 프로젝트·등록 worktree와 구분해 조사한다).
- 앱 서비스 소유권이 라벨·history로 정확히 입증되는 dangling 이미지.

## 제거 가능 대상과 조건

- 비활성 상태이고 현재 로컬 세션에 필요하지 않으며 보존 마운트가 없고 정확한 ID가 승인된 `tpmp-backend`, `tpmp-frontend`, `tpmp-nginx`.
- 남은 컨테이너 참조가 0개이고 Compose 라벨·history로 소유권이 입증되며 정확한 ID가 승인된 앱 이미지.
- 정규화 경로가 저장소 내부이고 reparse-point 탈출과 관련 실행 프로세스가 없으며 정확한 경로가 승인된 생성 디렉터리.
- 현재 프로젝트/등록 worktree의 `node_modules` 전체, Gradle wrapper 배포본, DB, 업로드, 볼륨, 보존 컨테이너는 제거하지 않는다. 단, 아래 조건을 모두 통과한 폐기 worktree의 중복 `node_modules`만 root 정리의 일부로 예외 허용한다.

## 폐기 worktree 정리

사용자의 핵심 기준은 **"프로젝트 전체적으로 사용되고 있지 않을 때만"** 이다. 현재 main의 `frontend/node_modules`, `backend/uploads`, Docker uploads 볼륨 등 프로젝트 전체가 사용하는 자산은 계속 보존한다. 아래 조건을 모두 충족하는 경우에만 `<project-root>/.worktrees/<name>`의 정확한 하위 worktree 사본 전체를 제거 후보로 삼을 수 있다.

- 대상은 `.worktrees` 루트가 아닌, 정규화된 정확한 절대 경로의 단일 `<project-root>/.worktrees/<name>`이어야 한다. 광범위 wildcard, `prune`, 다른 worktree 일괄 삭제는 금지한다.
- 대상 경로와 하위 경로에 reparse point 또는 junction이 있어 승인 경계 밖으로 이탈하지 않는지 확인한다. 경계 이탈 가능성이 있으면 제거하지 않는다.
- Git worktree 등록 상태를 확인한다. 등록되어 있으면 먼저 clean 상태와 기준 브랜치 병합을 확인한 뒤 표준 `git worktree remove`를 우선 사용한다. 등록 해제되지 않은 사본을 파일 시스템에서 직접 제거하지 않는다.
- 미등록(orphan) 사본은 관련 커밋이 기준 브랜치에 병합되었거나, handoff/작업 로그에 병합·clean·등록 해제 provenance가 남아 있어야 한다. 어느 쪽도 입증되지 않으면 제거하지 않는다.
- 관련 브랜치가 삭제되었는지 확인한다. 브랜치가 남아 있으면 삭제 필요성·병합 상태를 별도로 확인하고, 불명확하면 제거하지 않는다.
- 현재 실행 프로세스, 현재 세션 CWD, 개발 서버·테스트 프로세스가 대상 경로를 참조하지 않아야 한다.
- Docker 컨테이너, volume, bind mount, compose 설정 등에서 대상 경로를 참조하지 않아야 한다.
- 실제 사용자 업로드, DB 파일, 비밀 정보, 현재 사용자의 변경 사항이 대상에 없어야 한다. 활성 저장소와 실제 uploads 파일은 무조건 보존한다. 다만 폐기 worktree 내부의 0바이트 tracked placeholder `.gitkeep`만 존재하는 uploads 경로는 후보에 포함할 수 있다.
- 현재 프로젝트 및 등록 worktree의 `node_modules`는 전체 삭제 금지다. 위 조건을 통과한 폐기 worktree 안의 중복 `node_modules`만 root 정리의 일부로 제거할 수 있다.

제거 전에는 정확한 절대 경로, 파일 수, 논리적 예상 회수량을 보고하고 destructive approval을 받아야 한다. 승인 후 삭제 직전에 이 정책과 Git 등록·병합·브랜치·프로세스·Docker·경로 경계·사용자 데이터 상태를 다시 검증한다. 한 항목이라도 실패하거나 불확실하면 삭제하지 않는다.

## Docker 소유권 선택자

- Compose project: `test_preparation_master_project`.
- 제거 가능 services: backend, frontend, nginx.
- 보존 services: 기본 및 local 구성의 모든 PostgreSQL DB service.
- 다른 project 라벨은 정책 검토·수정 전까지 거부한다.
- 공유 BuildKit 캐시는 소유권 불명이며 보고만 한다.

## 정리 후 검증

- `tpmp-db`, `tpmp-db-local`의 존재, 마운트, 사전 실행 상태가 유지된다. 중지된 DB를 검증 목적으로 시작하지 않는다.
- main source, main의 `frontend/node_modules`, `backend/uploads`, Docker uploads 볼륨과 서비스 상태가 보존되어 정상인지 확인한다.
- 승인된 정확한 대상 경로만 부재하는지 확인하고, 다른 worktree와 `.worktrees` 루트는 보존되었는지 확인한다.
- 삭제 전 보고한 논리적 회수량과 정리 후 실제 디스크 free space 변화를 모두 기록해 비교한다.
- 사전 DB·업로드 볼륨이 모두 남아 있다.
- 현재 사용자 수정 파일이 바뀌지 않는다.
- 유지하기로 한 앱 서비스의 기존 health check가 통과한다.
- 논리적 회수량과 실제 호스트 여유 공간을 따로 보고한다.
