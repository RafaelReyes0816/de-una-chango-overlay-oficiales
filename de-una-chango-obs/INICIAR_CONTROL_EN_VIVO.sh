#!/usr/bin/env bash
# DE UNA, CHANGO! - Inicia el Centro de Control en Vivo (Linux/macOS)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PORT="${CHANGO_PORT:-4545}"
URL="http://localhost:${PORT}"

echo "============================================================"
echo "  DE UNA, CHANGO! - Iniciando Centro de Control en Vivo"
echo "============================================================"
echo
echo "Abriendo el Panel de Control en ${URL} ..."
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] No se encontro Node.js. Instalalo (p. ej. 'sudo apt install nodejs') y vuelve a intentar."
  exit 1
fi

(
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  elif [ -n "${BROWSER:-}" ]; then
    "$BROWSER" "$URL" >/dev/null 2>&1 || true
  fi
) &

exec node "$DIR/tools/servidor-control.js"
