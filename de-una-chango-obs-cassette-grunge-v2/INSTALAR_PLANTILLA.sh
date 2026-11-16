#!/usr/bin/env bash
# DE UNA, CHANGO! - Instalador de rutas (Linux/macOS)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "============================================================"
echo "  DE UNA, CHANGO! - Coleccion OBS"
echo "============================================================"
echo
echo "Actualizando rutas locales en DE_UNA_CHANGO_OBS.json..."
echo "Carpeta detectada: \"$DIR\""
echo

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] Se requiere python3. Instalalo y vuelve a intentar."
  exit 1
fi

if ! python3 "$DIR/tools/actualizar-rutas.py"; then
  echo
  echo "[ERROR] No se pudieron actualizar las rutas."
  exit 1
fi

echo
echo "============================================================"
echo "  LISTO PARA USAR EN OBS STUDIO:"
echo "  1. Abre OBS Studio"
echo "  2. Ve a: Coleccion de escenas > Importar"
echo "  3. Selecciona DE_UNA_CHANGO_OBS.json"
echo "============================================================"
echo
