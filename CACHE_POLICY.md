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
- `uploads`, `test_preparation_master_project_uploads`, 모든 upload bind mount와 업로드 파일.
- 보존 DB 컨테이너가 참조하는 PostgreSQL 15 Alpine 이미지.

## 조사 가능한 캐시 대상

- Compose project 라벨이 `test_preparation_master_project`이고 service 라벨이 backend, frontend, nginx인 컨테이너.
- 해당 앱 서비스만 참조하는 이미지.
- `frontend/.next`, `frontend/node_modules/.cache`, `backend/build`, 저장소 내부 backend `.gradle`, `.pytest_cache`, Python `__pycache__`.
- 앱 서비스 소유권이 라벨·history로 정확히 입증되는 dangling 이미지.

## 제거 가능 대상과 조건

- 비활성 상태이고 현재 로컬 세션에 필요하지 않으며 보존 마운트가 없고 정확한 ID가 승인된 `tpmp-backend`, `tpmp-frontend`, `tpmp-nginx`.
- 남은 컨테이너 참조가 0개이고 Compose 라벨·history로 소유권이 입증되며 정확한 ID가 승인된 앱 이미지.
- 정규화 경로가 저장소 내부이고 reparse-point 탈출과 관련 실행 프로세스가 없으며 정확한 경로가 승인된 생성 디렉터리.
- `node_modules` 전체, Gradle wrapper 배포본, DB, 업로드, 볼륨, 보존 컨테이너는 제거하지 않는다.

## Docker 소유권 선택자

- Compose project: `test_preparation_master_project`.
- 제거 가능 services: backend, frontend, nginx.
- 보존 services: 기본 및 local 구성의 모든 PostgreSQL DB service.
- 다른 project 라벨은 정책 검토·수정 전까지 거부한다.
- 공유 BuildKit 캐시는 소유권 불명이며 보고만 한다.

## 정리 후 검증

- `tpmp-db`, `tpmp-db-local`의 존재, 마운트, 사전 실행 상태가 유지된다. 중지된 DB를 검증 목적으로 시작하지 않는다.
- 사전 DB·업로드 볼륨이 모두 남아 있다.
- 현재 사용자 수정 파일이 바뀌지 않는다.
- 유지하기로 한 앱 서비스의 기존 health check가 통과한다.
- 논리적 회수량과 실제 호스트 여유 공간을 따로 보고한다.
