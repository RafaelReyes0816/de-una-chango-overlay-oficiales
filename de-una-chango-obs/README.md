# DE UNA, CHANGO! · Plantilla OBS (Bento UI Broadcast)

Plantilla de escenas y overlays para el programa **DE UNA, CHANGO!**, tecnología en vivo desde Tarija, Bolivia.

- Lienzo y salida: **1920 x 1080 a 60 FPS** (overlays optimizados a **30 FPS** sin `backdrop-filter`)
- Estética: **Bento UI / Tech Broadcast**, fondo `#07111F` / `#0B192C`, turquesa `#2CEAA3`, mostaza `#E5B84B` y coral `#F26444`
- Tipografías: **100 % locales** (`Inter` y `Montserrat` variables en `/fonts/`, cero dependencia de internet)
- OBS objetivo: **OBS Studio 30.2 o superior**
- Sistemas operativos: **Windows y Linux/macOS** (instaladores y lanzadores en `.bat`/`.ps1` para Windows y `.sh`/`.py` para Linux/macOS)
- Requisitos del Centro de Control: **Node.js** (panel en vivo) y **Python 3** (solo para el instalador de rutas en Linux/macOS)

---

## Instalación rápida en 3 pasos (Plug & Play)

1. **Descomprimir el ZIP** en una carpeta fija de tu equipo (por ejemplo `D:\de-una-chango-obs` en Windows o `~/de-una-chango-obs` en Linux/macOS).
2. **Ejecutar el instalador de rutas** de tu sistema operativo: **Windows** → doble clic en `INSTALAR_PLANTILLA.bat`; **Linux/macOS** → `bash INSTALAR_PLANTILLA.sh`. Detecta automáticamente la carpeta donde descomprimiste el paquete y actualiza todas las rutas locales dentro de `DE_UNA_CHANGO_OBS.json` **antes** de importarlo.
3. **Importar `DE_UNA_CHANGO_OBS.json` en OBS Studio**: abre OBS Studio, ve a **Colección de escenas > Importar**, selecciona `DE_UNA_CHANGO_OBS.json` y actívala en el menú **Colección de escenas > DE UNA, CHANGO!**.

---

## 1. Contenido del paquete

```
INSTALAR_PLANTILLA.bat       Instalador de rutas de 1 clic (Windows)
INSTALAR_PLANTILLA.sh        Instalador de rutas de 1 clic (Linux/macOS)
INICIAR_CONTROL_EN_VIVO.bat  Inicia el servidor puente y abre el Panel de Control en Vivo (Windows)
INICIAR_CONTROL_EN_VIVO.sh   Inicia el servidor puente y abre el Panel de Control en Vivo (Linux/macOS)
DE_UNA_CHANGO_OBS.json       Colección de escenas lista para OBS Studio (incluye Stinger)
fonts/                       Tipografías locales Inter y Montserrat (.woff2 + licencias OFL)
overlays/                    Overlays HTML, CSS, JS, SVG y Panel de Control (panel-control.html)
assets/music/                Música de entrada y cierre (placeholders silenciosos)
assets/transitions/          Transición Stinger animada 1080p60 con canal alfa (stinger-chango.webm)
perfil-opcional/             Perfil de OBS opcional configurado en 1080p60
tools/actualizar-rutas.ps1   Script PowerShell invocado por INSTALAR_PLANTILLA.bat
tools/actualizar-rutas.py    Script Python invocado por INSTALAR_PLANTILLA.sh
tools/servidor-control.js    Servidor puente en tiempo real (WebSocket + actualización en disco)
```

### Escenas y atajos seguros

Los atajos usan modificadores (`Ctrl + Alt`) para evitar cambios accidentales de escena mientras usas el navegador (como pulsar `F5` para recargar):

| Escena | Atajo | Uso |
| --- | --- | --- |
| `01 - Inicio (Espera)` | `Ctrl + Alt + 1` | Placa Bento de espera con logo, reto, barra de progreso y temporizador |
| `02 - General (La Banda)` | `Ctrl + Alt + 2` | Cámara general a pantalla completa con marco Bento, chat y lower third |
| `03 - Explicación (Pizarra)` | `Ctrl + Alt + 3` | Pizarra a pantalla completa y `Cam 1` en PIP transparente con respaldo automático |
| `04 - Modo Hacemos (Demos)` | `Ctrl + Alt + 4` | Captura de demos, chat, 3 cámaras con lower thirds propios, datos/redes y alertas |
| `05 - Cierre (Chau Chango)` | `Ctrl + Alt + 5` | Placa de despedida, créditos dinámicos con roles y música de cierre |

Puedes personalizar los atajos en `Configuración > Atajos`.

---

## 2. Configurar las cámaras

Las cámaras se importan sin dispositivo asignado. Configúralas una sola vez:

1. En la escena `02 - General (La Banda)`, haz doble clic en `Cam 1 - Mesa General` y selecciona tu cámara o capturadora.
2. En la escena `03 - Explicación (Pizarra)`, asigna `Cam 2 - Pizarra`.
3. En la escena `04 - Modo Hacemos (Demos)`, asigna `Cam 3 - Chicas`.

Detalles preparados:

- Las tres cámaras son **fuentes compartidas**: al asignarlas en una escena, quedan listas en todas.
- Las cámaras a pantalla completa usan **Escalado proporcional al interior** (`bounds_type: 2`), por lo que no se deforman aunque conectes una cámara 4:3.
- En la **Escena 03**, el centro del marco PIP es **100 % transparente** y el placeholder `Cam 1 - Placeholder (PIP)` está situado **debajo** de `Cam 1 - Mesa General`: cuando la cámara tiene imagen lo cubre automáticamente, y si la cámara aún no está asignada se muestra la tarjeta de espera sin necesidad de ocultar capas a mano.

---

## 3. Configurar el audio

En el **Mezclador de audio** aparecerán:

| Fuente | Canal | Estado inicial | Qué conectar |
| --- | --- | --- | --- |
| `Mesa General (Mics)` | Audio auxiliar 1 (global) | Activo | Consola, mixer o interfaz principal del programa |
| `Mic Juan Pablo (OBS)` | Audio auxiliar 2 (global) | **Silenciado (`muted`)** | Micrófono individual del operador OBS |
| `Audio PC / Demo` | Audio de escritorio (global) | Activo | Sonido del sistema o de las demos |
| `Música Rock (Inicio)` | Escena 01 | Activo (en bucle) | Pista instrumental de espera |
| `Música Cierre` | Escena 05 | Activo (en bucle) | Pista de despedida |

- `Mic Juan Pablo (OBS)` viene **silenciado por defecto** para evitar eco o audio duplicado al abrir la plantilla por primera vez. Asígnale su propio dispositivo antes de quitarle el silencio.
- `Mesa General (Mics)` incluye los filtros **Puerta Anti-ruido** y **Compresor**.

---

## 4. Personalizar textos, cámaras y créditos (`overlays/js/config.js`)

Edita `overlays/js/config.js`:

```js
window.CHANGO_CONFIG = {
  programa: "DE UNA, CHANGO!",
  ciudad: "Tarija, Bolivia",
  lema: "Desde Tarija para el mundo",
  reto: "RETO #001: IA PARA EMPRENDER",
  countdownMinutes: 5,
  redes: "@deunachango",
  hashtag: "#DeUnaChango",

  camaras: {
    cam1: { nombre: "La Banda", subtitulo: "Mesa general · Cam 01" },
    cam2: { nombre: "Pizarra en vivo", subtitulo: "Explicación · Cam 02" },
    cam3: { nombre: "Clareth & Emilse", subtitulo: "Demos en vivo · Cam 03" }
  },

  equipo: [
    { nombre: "Cindy", rol: "Producción" },
    { nombre: "Tito", rol: "Conducción" },
    { nombre: "Carlos", rol: "Cámara" },
    { nombre: "Juan Pablo", rol: "Operador OBS" },
    { nombre: "Clareth", rol: "Demos" },
    { nombre: "Emilse", rol: "Demos" }
  ],

  chatUrl: "",
  showDemoChat: false,
  showDemoAlerts: false
};
```

- **`camaras`**: define los nombres y subtítulos de los *lower thirds* de las 3 cámaras en la Escena 04.
- **`equipo`**: cada integrante lleva su `nombre` y `rol` vinculados directamente.
- **`chatUrl`**: si está vacío (`""`), el chat queda en **espera silenciosa** sin emitir mensajes falsos al aire.
- **Temporizador (Escena 01)**: es la única fuente con recarga automática al entrar a la escena. También puedes reiniciarlo en cualquier momento con `Clic derecho > Interactuar` sobre la fuente y haciendo clic en el número o pulsando **R**.

---

## 5. Chat, Alertas y Demos (VDO.Ninja)

- **Persistencia entre escenas**: `Captura PC Demos (Clareth y Emilse)`, `Chat del Stream` y `Alertas` tienen `restart_when_active: false`, por lo que **no se desconectan ni pierden el historial** al cambiar entre escenas.
- **Chat en vivo**: pega la URL de tu widget de chat (StreamElements, Streamlabs, etc.) en `chatUrl` dentro de `overlays/js/config.js`, o directamente en las propiedades de la fuente `Chat del Stream` (`300 x 712`).
- **Demos con VDO.Ninja**: abre las propiedades de `Captura PC Demos (Clareth y Emilse)` en la Escena 04 y reemplaza la URL `https://vdo.ninja/?view=DEUNA_CHANGO_DEMOS&clean` por el enlace real de tu sala.
- **Música**: reemplaza `assets/music/rock-instrumental.mp3` y `assets/music/cierre.mp3` manteniendo los mismos nombres de archivo.

---

## 6. Centro de Control en Vivo y Transición Stinger

### Cómo usar el Centro de Control en Vivo
1. Inicia el Centro de Control: **Windows** → doble clic en `INICIAR_CONTROL_EN_VIVO.bat`; **Linux/macOS** → `bash INICIAR_CONTROL_EN_VIVO.sh`.
2. Se abrirá automáticamente el panel en **`http://localhost:4545`** (también puedes acoplar `http://localhost:4545` dentro de OBS en **Paneles > Paneles de navegador personalizados** o abrirlo desde un celular/tablet en el mismo Wi-Fi).
3. **Importante si ya tenías OBS abierto antes**: cierra y vuelve a abrir OBS Studio una vez (o pulsa el botón **🔄 Recargar todos los Overlays en OBS** en la pestaña 4 del panel) para que OBS cargue el nuevo puente en vivo (`js/live.js`).

Desde este panel puedes:
- **Cambiar las 5 escenas de OBS y mutear micrófonos** (habilitando *Herramientas > Ajustes del servidor WebSocket* en OBS, puerto `4455`).
- **Cambiar al instante** el `Reto del día`, `Lema`, `Redes`, `Hashtag` y los textos/visibilidad del **Lower Third de la Escena 02** sin parpadeos (además queda guardado automáticamente en `overlays/js/config.js`).
- **Controlar el Temporizador de la Escena 01** (ver el reloj en vivo, pausar/reanudar, sumar o restar 1 minuto, reiniciar o poner `ARRANCAMOS` al instante).
- **Disparar Alertas en 1 clic** (visibles en las escenas `02`, `03` y `04`) o enviar mensajes destacados al widget de chat.
- **Actualizar los nombres de las 3 cámaras** en la Escena 04 y los créditos de la Escena 05, o restaurar los valores de fábrica.

### Transición `Stinger Chango`
La colección de escenas ya viene configurada con la transición **`Stinger Chango`** (`assets/transitions/stinger-chango.webm`, 1080p60 con transparencia y punto de corte en `500 ms`), que cruza la pantalla con las barras diagonales turquesa, mostaza y coral del programa al cambiar de escena.
