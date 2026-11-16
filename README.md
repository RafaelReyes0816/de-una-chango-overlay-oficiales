# DE UNA, CHANGO! · Overlays oficiales para OBS Studio

Colección oficial de plantillas de escenas y overlays para el programa **DE UNA, CHANGO!**, tecnología en vivo desde Tarija, Bolivia. Este repositorio reúne **dos plantillas completas** listas para **OBS Studio 30.2 o superior**, multiplataforma (**Windows y Linux/macOS**).

| Plantilla | Carpeta | Estética |
| --- | --- | --- |
| **Bento UI Broadcast** | [`de-una-chango-obs/`](de-una-chango-obs/) | Fondo `#07111F`/`#0B192C`, turquesa `#2CEAA3`, mostaza `#E5B84B`, coral `#F26444` |
| **Cassette Grunge** | [`de-una-chango-obs-cassette-grunge-v2/`](de-una-chango-obs-cassette-grunge-v2/) | Carbón `#292724`, papel `#E9E1D4`, ámbar `#FFB000`, rojo tinta `#9B3329`, oliva `#79864B` |

Cada carpeta es **autocontenida**: escenas (`DE_UNA_CHANGO_OBS.json`), overlays HTML/CSS/JS, tipografías locales, audio de entrada/cierre, transición **Stinger** 1080p60 con canal alfa, perfil de OBS opcional y el **Centro de Control en Vivo**.

---

## Instalación (Plug & Play)

1. **Descarga/clona** el repositorio y coloca la carpeta de la plantilla que quieras usar en una ubicación fija (por ejemplo `D:\de-una-chango-obs` en Windows o `~/de-una-chango-obs` en Linux/macOS).
2. **Ejecuta el instalador de rutas** de tu sistema operativo dentro de esa carpeta:
   - **Windows** → doble clic en `INSTALAR_PLANTILLA.bat`
   - **Linux/macOS** → `bash INSTALAR_PLANTILLA.sh`
3. **Importa** `DE_UNA_CHANGO_OBS.json` en OBS Studio (**Colección de escenas > Importar**).

El instalador reescribe las rutas internas del `.json` para apuntar a la carpeta real donde tengas el paquete, por lo que la misma plantilla funciona en cualquier equipo y sistema operativo.

---

## Centro de Control en Vivo

Dentro de cada carpeta:

- **Windows** → doble clic en `INICIAR_CONTROL_EN_VIVO.bat`
- **Linux/macOS** → `bash INICIAR_CONTROL_EN_VIVO.sh`

Abre el panel en **`http://localhost:4545`** (o `CHANGO_PORT` en Linux/macOS). Desde ahí puedes cambiar escenas de OBS, mutear micrófonos, editar textos en vivo, controlar el temporizador, lanzar alertas y más.

---

## Requisitos

- **OBS Studio 30.2 o superior.**
- **Node.js** — para el Centro de Control en Vivo (el servidor `tools/servidor-control.js` es Node puro, sin dependencias).
- **Python 3** — solo para el instalador de rutas en Linux/macOS (`INSTALAR_PLANTILLA.sh`).
- **PowerShell** — ya incluido en Windows, usado por `INSTALAR_PLANTILLA.bat`.

---

## Estructura de cada plantilla

```
INSTALAR_PLANTILLA.bat / .sh      Instalador de rutas de 1 clic (Windows / Linux-macOS)
INICIAR_CONTROL_EN_VIVO.bat / .sh Lanzador del Centro de Control en Vivo (Windows / Linux-macOS)
DE_UNA_CHANGO_OBS.json            Colección de escenas lista para OBS Studio (incluye Stinger)
fonts/                            Tipografías locales Inter y Montserrat (.woff2 + licencias OFL)
overlays/                         Overlays HTML, CSS, JS, SVG y panel de control
assets/music/                     Música de entrada y cierre
assets/transitions/               Transición Stinger 1080p60 con canal alfa
perfil-opcional/                  Perfil de OBS opcional configurado en 1080p60
tools/actualizar-rutas.ps1 / .py  Script de rutas invocado por el instalador (Windows / Linux-macOS)
tools/servidor-control.js         Servidor puente en tiempo real (WebSocket + actualización en disco)
```

---

## Notas

- El `.json` incluido trae rutas portables (`C:/<carpeta>/…`) como marcador; **ejecuta siempre el instalador** antes de importar para ajustarlas a tu equipo.
- Las fuentes de cámara y audio se importan **sin dispositivo asignado**: asígnalas una vez en OBS (ver el README de cada plantilla).
- Consulta el README de cada carpeta para la guía detallada (escenas, cámaras, audio, personalización, chat/alertas y Stinger).
