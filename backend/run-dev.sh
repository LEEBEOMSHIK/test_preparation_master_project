#!/usr/bin/env bash
# 로컬 개발용 백엔드 실행 스크립트.
# 루트 .env를 환경변수로 로드한 뒤 Spring Boot(bootRun)를 실행한다.
# (gradlew/Spring은 .env를 자동으로 읽지 않으므로 이 스크립트로 주입한다.)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  echo "[run-dev] .env 로드 완료"
else
  echo "[run-dev] .env 없음 — 기본값으로 실행"
fi

exec "$SCRIPT_DIR/gradlew" -p "$SCRIPT_DIR" bootRun
