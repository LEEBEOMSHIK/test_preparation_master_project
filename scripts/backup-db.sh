#!/usr/bin/env bash
#
# backup-db.sh — tpmp-db(PostgreSQL) 컨테이너를 pg_dump로 백업해 gzip 압축 후 로컬에 보관한다.
#
# 사용법:
#   ./scripts/backup-db.sh
#
# 환경변수 (모두 선택, 기본값은 docker-compose.yml 기준 실제 프로젝트 값):
#   DB_CONTAINER_NAME       백업 대상 컨테이너명 (기본값: tpmp-db)
#   DB_NAME                 데이터베이스명 (기본값: tpmp)
#   DB_USERNAME              접속 유저명 (기본값: tpmp)
#   BACKUP_DIR              백업 파일 저장 디렉터리 (기본값: <저장소 루트>/backups)
#   BACKUP_RETENTION_DAYS   로컬 백업 보관 기간(일), 초과분은 실행 시 자동 삭제 (기본값: 14)
#   BACKUP_REMOTE_UPLOAD_CMD  설정 시 백업 직후 실행할 원격 업로드 명령. 백업 파일의 절대경로가
#                              환경변수 BACKUP_FILE로 전달되므로, 그 안에서 "$BACKUP_FILE"을 참조해
#                              구성한다. 예) aws s3 cp "$BACKUP_FILE" s3://my-bucket/tpmp-backups/
#                                          rclone copy "$BACKUP_FILE" remote:tpmp-backups/
#                              특정 벤더 SDK를 이 스크립트에 하드코딩하지 않는다 — 어떤 도구든
#                              위 변수에 명령 전체를 그대로 넣으면 실행된다.
#                              미설정 시 원격 업로드는 건너뛰고 로컬 백업만 수행한다(실패로 취급하지 않음).
#
# crontab 예시 (매일 새벽 3시 자동 실행):
#   0 3 * * * /path/to/scripts/backup-db.sh >> /var/log/tpmp-backup.log 2>&1
#
# 사전 준비: chmod +x scripts/backup-db.sh
#
# 복구는 scripts/restore-db.sh 참고.

set -euo pipefail

# ── 설정값 (환경변수로 오버라이드 가능) ────────────────────────────────────
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-tpmp-db}"
DB_NAME="${DB_NAME:-tpmp}"
DB_USERNAME="${DB_USERNAME:-tpmp}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${REPO_ROOT}/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILENAME="tpmp_${TIMESTAMP}.sql.gz"

log() {
  echo "[backup-db] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# ── 사전 확인 ──────────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  echo "[backup-db] 에러: docker 명령을 찾을 수 없습니다." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${DB_CONTAINER_NAME}"; then
  echo "[backup-db] 에러: 컨테이너 '${DB_CONTAINER_NAME}'가 실행 중이 아닙니다." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"

# ── pg_dump 실행 + gzip 압축 ───────────────────────────────────────────
log "백업 시작: 컨테이너=${DB_CONTAINER_NAME}, DB=${DB_NAME}, 유저=${DB_USERNAME}"

if ! docker exec "${DB_CONTAINER_NAME}" pg_dump -U "${DB_USERNAME}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
  echo "[backup-db] 에러: pg_dump 실행 또는 압축에 실패했습니다." >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[backup-db] 에러: 백업 파일이 비어 있습니다 (${BACKUP_FILE})." >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
log "백업 완료: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── 로컬 보관 기간 정책 (기본 14일 초과 삭제) ─────────────────────────────
log "로컬 보관 기간(${BACKUP_RETENTION_DAYS}일) 초과 백업 정리 중..."
find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'tpmp_*.sql.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete | while read -r deleted; do
  log "삭제됨(보관 기간 초과): ${deleted}"
done

# ── 원격 업로드 (선택 사항) ────────────────────────────────────────────
if [ -n "${BACKUP_REMOTE_UPLOAD_CMD:-}" ]; then
  log "원격 업로드 실행 중..."
  export BACKUP_FILE
  if eval "${BACKUP_REMOTE_UPLOAD_CMD}"; then
    log "원격 업로드 완료."
  else
    echo "[backup-db] 에러: 원격 업로드 명령이 실패했습니다 (로컬 백업 자체는 성공했습니다)." >&2
    exit 1
  fi
else
  log "원격 업로드 미설정(BACKUP_REMOTE_UPLOAD_CMD 없음) — 로컬 백업만 수행."
fi

log "백업 스크립트 정상 종료."
