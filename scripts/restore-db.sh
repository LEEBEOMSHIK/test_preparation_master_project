#!/usr/bin/env bash
#
# restore-db.sh — scripts/backup-db.sh로 생성한 .sql.gz 백업 파일을 tpmp-db(PostgreSQL)
# 컨테이너에 복원한다.
#
# ⚠ 되돌릴 수 없는 파괴적 작업이다. 실행 시 대상 데이터베이스의 기존 데이터를 덮어쓴다.
#
# 사용법:
#   ./scripts/restore-db.sh <백업파일경로.sql.gz>
#   ./scripts/restore-db.sh -y <백업파일경로.sql.gz>   # 확인 프롬프트 생략(자동화 파이프라인용)
#   ./scripts/restore-db.sh --yes <백업파일경로.sql.gz>
#
# 환경변수 (모두 선택, 기본값은 docker-compose.yml 기준 실제 프로젝트 값):
#   DB_CONTAINER_NAME   복원 대상 컨테이너명 (기본값: tpmp-db)
#   DB_NAME             데이터베이스명 (기본값: tpmp)
#   DB_USERNAME          접속 유저명 (기본값: tpmp)
#
# crontab으로 자동 실행할 성격의 스크립트는 아니다(복원은 수동/장애 대응 절차).
# 백업 자동화 예시는 scripts/backup-db.sh 상단 주석 참고.
#
# 사전 준비: chmod +x scripts/restore-db.sh

set -euo pipefail

DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-tpmp-db}"
DB_NAME="${DB_NAME:-tpmp}"
DB_USERNAME="${DB_USERNAME:-tpmp}"

log() {
  echo "[restore-db] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

usage() {
  echo "사용법: $0 [-y|--yes] <백업파일경로.sql.gz>" >&2
  exit 1
}

# ── 인자 파싱 ──────────────────────────────────────────────────────────
SKIP_CONFIRM="false"
BACKUP_FILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes)
      SKIP_CONFIRM="true"
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      if [ -n "${BACKUP_FILE}" ]; then
        usage
      fi
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

if [ -z "${BACKUP_FILE}" ]; then
  usage
fi

# ── 사전 확인 ──────────────────────────────────────────────────────────
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[restore-db] 에러: 백업 파일을 찾을 수 없습니다: ${BACKUP_FILE}" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[restore-db] 에러: docker 명령을 찾을 수 없습니다." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${DB_CONTAINER_NAME}"; then
  echo "[restore-db] 에러: 컨테이너 '${DB_CONTAINER_NAME}'가 실행 중이 아닙니다." >&2
  exit 1
fi

# ── 파괴적 작업 확인 프롬프트 ───────────────────────────────────────────
if [ "${SKIP_CONFIRM}" != "true" ]; then
  echo "다음 작업을 수행합니다:"
  echo "  백업 파일: ${BACKUP_FILE}"
  echo "  대상 컨테이너: ${DB_CONTAINER_NAME}"
  echo "  대상 DB: ${DB_NAME} (유저: ${DB_USERNAME})"
  echo ""
  echo "⚠ 이 작업은 되돌릴 수 없으며 기존 데이터를 덮어씁니다."
  read -r -p "계속하시겠습니까? (yes 입력 시에만 진행) " CONFIRM
  if [ "${CONFIRM}" != "yes" ]; then
    log "사용자가 취소했습니다. 복원을 중단합니다."
    exit 1
  fi
fi

# ── gzip 압축 해제 후 psql로 복원 ──────────────────────────────────────
log "복원 시작: ${BACKUP_FILE} → 컨테이너=${DB_CONTAINER_NAME}, DB=${DB_NAME}"

if ! gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER_NAME}" psql -U "${DB_USERNAME}" "${DB_NAME}"; then
  echo "[restore-db] 에러: 복원 중 오류가 발생했습니다. 데이터베이스 상태를 확인하세요." >&2
  exit 1
fi

log "복원 완료."
