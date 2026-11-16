#!/usr/bin/env python3
"""Actualiza las rutas locales dentro de DE_UNA_CHANGO_OBS.json.

Version Linux/macOS de tools/actualizar-rutas.ps1. Reemplaza cualquier ruta
absoluta de Windows (p. ej. C:/Users/.../proyecto/) que aparezca justo antes de
overlays/, assets/music/ o assets/transitions/ por la carpeta real del proyecto.
"""
import argparse
import json
import os
import re
import shutil
import sys
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_JSON = os.path.join(PROJECT_ROOT, "DE_UNA_CHANGO_OBS.json")

PATTERN = re.compile(
    r'(?i)(?:[a-z]:/|/)(?:[^"\r\n]*?/)?(?=overlays/|assets/music/|assets/transitions/)'
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Actualiza rutas locales en la coleccion de OBS."
    )
    parser.add_argument("json_path", nargs="?", default=DEFAULT_JSON)
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Crea una copia .bak con marca de tiempo antes de escribir.",
    )
    args = parser.parse_args()

    json_path = os.path.abspath(args.json_path)
    if not os.path.isfile(json_path):
        print(f"[ERROR] No existe el archivo JSON: {json_path}")
        return 1

    root_forward = PROJECT_ROOT.replace("\\", "/").rstrip("/")

    with open(json_path, "r", encoding="utf-8") as fh:
        text = fh.read()

    updated = PATTERN.sub(root_forward + "/", text)

    try:
        json.loads(updated)
    except json.JSONDecodeError as exc:
        print(f"[ERROR] El JSON resultante no es valido: {exc}")
        return 1

    if updated == text:
        print("[OK] Las rutas ya apuntan a esta carpeta:")
        print(f"     {root_forward}")
        print(f"     JSON validado: {json_path}")
        return 0

    if args.backup:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        shutil.copy2(json_path, f"{json_path}.bak-{stamp}")

    with open(json_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(updated)

    print("[OK] Rutas actualizadas correctamente.")
    print(f"     Carpeta del proyecto: {root_forward}")
    print(f"     JSON listo para importar: {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
