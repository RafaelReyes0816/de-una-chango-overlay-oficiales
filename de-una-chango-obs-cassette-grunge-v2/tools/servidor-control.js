/* =====================================================================
   DE UNA, CHANGO! · Servidor Local de Control en Vivo (Cero dependencias)
   - Sirve el Panel de Control en http://localhost:4545
   - Sincroniza en tiempo real vía WebSocket (ws://localhost:4545/ws)
   - Escribe automáticamente en overlays/js/config.js y overlays/js/live-state.js
     para garantizar que todas las fuentes file:// de OBS se actualicen al instante.
   ===================================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const PORT = Number(process.env.CHANGO_PORT || 4545);
const ROOT_DIR = path.resolve(__dirname, "..");
const OVERLAYS_DIR = path.join(ROOT_DIR, "overlays");
const CONFIG_JS_PATH = path.join(OVERLAYS_DIR, "js", "config.js");
const LIVE_STATE_JS_PATH = path.join(OVERLAYS_DIR, "js", "live-state.js");

const DEFAULT_STATE = {
  programa: "DE UNA, CHANGO!",
  ciudad: "Tarija, Bolivia",
  lema: "Desde Tarija para el mundo",
  reto: "RETO #001: IA PARA EMPRENDER",
  countdownMinutes: 5,
  redes: "@deunachango",
  hashtag: "#DeUnaChango",
  generalLower: {
    visible: true,
    kicker: "De una, Chango! · La banda",
    title: "Desde Tarija para el mundo",
    sub: "Tecnología, demos en vivo y buena vibra"
  },
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
  showDemoAlerts: false,
  chatMessages: [
    { user: "chango_fan", text: "Saludos desde Tarija", color: "#FFB000" },
    { user: "tarija_rock", text: "Que empiece el programa", color: "#E9E1D4" },
    { user: "clareth_dev", text: "Hoy hay demo en vivo", color: "#9B3329" },
    { user: "emilse_tech", text: "Excelente el reto de hoy", color: "#FFB000" },
    { user: "jp_en_vivo", text: "Mandamos saludos a toda la banda", color: "#E9E1D4" }
  ]
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadInitialConfigFromDisk() {
  try {
    if (!fs.existsSync(CONFIG_JS_PATH)) {
      return clone(DEFAULT_STATE);
    }
    const code = fs.readFileSync(CONFIG_JS_PATH, "utf8");
    const sandbox = { window: {} };
    const fn = new Function("window", code);
    fn(sandbox.window);
    if (sandbox.window && sandbox.window.CHANGO_CONFIG) {
      return mergeState(DEFAULT_STATE, sandbox.window.CHANGO_CONFIG);
    }
  } catch (err) {
    console.warn("[AVISO] No se pudo leer config.js previo, usando valores base:", err.message);
  }
  return clone(DEFAULT_STATE);
}

function mergeState(base, patch) {
  const result = clone(base || DEFAULT_STATE);
  if (!patch || typeof patch !== "object") {
    return result;
  }

  const scalars = [
    "programa",
    "ciudad",
    "lema",
    "reto",
    "countdownMinutes",
    "redes",
    "hashtag",
    "chatUrl",
    "showDemoChat",
    "showDemoAlerts"
  ];

  scalars.forEach((k) => {
    if (typeof patch[k] !== "undefined") {
      result[k] = patch[k];
    }
  });

  if (patch.generalLower && typeof patch.generalLower === "object") {
    result.generalLower = Object.assign({}, result.generalLower || {}, patch.generalLower);
  }

  if (patch.camaras && typeof patch.camaras === "object") {
    result.camaras = result.camaras || {};
    ["cam1", "cam2", "cam3"].forEach((camKey) => {
      if (patch.camaras[camKey]) {
        const entry = patch.camaras[camKey];
        result.camaras[camKey] = Object.assign(
          {},
          result.camaras[camKey] || {},
          typeof entry === "string" ? { nombre: entry } : entry
        );
      }
    });
  }

  if (Array.isArray(patch.equipo)) {
    result.equipo = clone(patch.equipo);
  }

  if (Array.isArray(patch.chatMessages)) {
    result.chatMessages = clone(patch.chatMessages);
  }

  return result;
}

let currentState = loadInitialConfigFromDisk();
let currentStamp = "init-" + Date.now();
let lastCommand = null;
let lastTimer = {
  remaining: Number(currentState.countdownMinutes || 5) * 60,
  totalSeconds: Number(currentState.countdownMinutes || 5) * 60,
  paused: false,
  finished: false,
  display: String(currentState.countdownMinutes || 5).padStart(2, "0") + ":00",
  ts: Date.now()
};

function writeConfigJsToDisk() {
  const content =
    "window.CHANGO_CONFIG = " +
    JSON.stringify(currentState, null, 2) +
    ";\n\n" +
    "window.CHANGO_DEFAULT_CONFIG = " +
    JSON.stringify(DEFAULT_STATE, null, 2) +
    ";\n";
  try {
    fs.writeFileSync(CONFIG_JS_PATH, content, "utf8");
  } catch (err) {
    console.error("[ERROR] No se pudo escribir config.js:", err.message);
  }
}

function buildLiveBridgePayload() {
  return {
    stamp: currentStamp,
    ts: Date.now(),
    state: currentState,
    cmd: lastCommand,
    timer: lastTimer
  };
}

function writeLiveStateJsToDisk() {
  const payload = buildLiveBridgePayload();
  const content =
    "/* Archivo autogenerado en tiempo real por servidor-control.js */\n" +
    "if (typeof window !== 'undefined' && typeof window.__onChangoLiveBridge === 'function') {\n" +
    "  window.__onChangoLiveBridge(" +
    JSON.stringify(payload) +
    ");\n" +
    "}\n";
  try {
    fs.writeFileSync(LIVE_STATE_JS_PATH, content, "utf8");
  } catch (err) {
    console.error("[ERROR] No se pudo escribir live-state.js:", err.message);
  }
}

/* Inicializar archivos de puente al arrancar */
writeConfigJsToDisk();
writeLiveStateJsToDisk();

/* =====================================================================
   Servidor WebSocket RFC 6455 nativo (sin librerías externas)
   ===================================================================== */
const wsClients = new Set();

function encodeWsFrame(dataStr) {
  const payload = Buffer.from(dataStr, "utf8");
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Text frame
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function broadcastWs(obj) {
  const frame = encodeWsFrame(JSON.stringify(obj));
  for (const socket of wsClients) {
    try {
      socket.write(frame);
    } catch (e) {
      wsClients.delete(socket);
    }
  }
}

function decodeWsFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const isMasked = (byte1 & 0x80) !== 0;
    let payloadLen = byte1 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    const totalFrameLen = headerLen + maskLen + payloadLen;
    if (offset + totalFrameLen > buffer.length) {
      break;
    }

    if (opcode === 0x8) {
      // Close frame
      messages.push({ type: "__close__" });
      offset += totalFrameLen;
      break;
    }

    if (opcode === 0x1) {
      const dataStart = offset + headerLen + maskLen;
      const payload = Buffer.alloc(payloadLen);
      if (isMasked) {
        const maskKey = buffer.slice(offset + headerLen, offset + headerLen + 4);
        for (let i = 0; i < payloadLen; i += 1) {
          payload[i] = buffer[dataStart + i] ^ maskKey[i % 4];
        }
      } else {
        buffer.copy(payload, 0, dataStart, dataStart + payloadLen);
      }
      messages.push({ type: "text", text: payload.toString("utf8") });
    }

    offset += totalFrameLen;
  }

  return { messages, remaining: buffer.slice(offset) };
}

function handleClientAction(msg) {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "update-state" && msg.patch) {
    currentState = mergeState(currentState, msg.patch);
    currentStamp = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7);
    writeConfigJsToDisk();
    writeLiveStateJsToDisk();
    broadcastWs({
      type: "bridge",
      data: buildLiveBridgePayload()
    });
    console.log(`[AL AIRE] Estado actualizado (${new Date().toLocaleTimeString()})`);
  } else if (msg.type === "reset-state") {
    currentState = clone(DEFAULT_STATE);
    currentStamp = "reset-" + Date.now();
    writeConfigJsToDisk();
    writeLiveStateJsToDisk();
    broadcastWs({
      type: "bridge",
      data: buildLiveBridgePayload()
    });
    console.log(`[RESET] Valores de fábrica restaurados (${new Date().toLocaleTimeString()})`);
  } else if (msg.type === "cmd" && msg.cmd) {
    lastCommand = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      cmd: msg.cmd,
      payload: msg.payload || {}
    };
    writeLiveStateJsToDisk();
    broadcastWs({
      type: "cmd",
      packet: lastCommand
    });
    console.log(`[COMANDO] ${msg.cmd} enviado a OBS (${new Date().toLocaleTimeString()})`);
  } else if (msg.type === "timer" && msg.telemetry) {
    lastTimer = Object.assign({ ts: Date.now() }, msg.telemetry);
    writeLiveStateJsToDisk();
    broadcastWs({
      type: "timer",
      telemetry: lastTimer
    });
  }
}

/* =====================================================================
   Servidor HTTP (Archivos estáticos + API JSON + Endpoint JSONP)
   ===================================================================== */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".webm": "video/webm",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === "/" || pathname === "/panel" || pathname === "/control") {
    res.writeHead(302, { Location: "/overlays/panel-control.html" });
    res.end();
    return;
  }

  if (pathname === "/api/bridge" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(buildLiveBridgePayload()));
    return;
  }

  if (pathname === "/live-bridge.js" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(
      "if (typeof window !== 'undefined' && typeof window.__onChangoLiveBridge === 'function') {\n" +
        "  window.__onChangoLiveBridge(" +
        JSON.stringify(buildLiveBridgePayload()) +
        ");\n}\n"
    );
    return;
  }

  if (pathname === "/api/action" && req.method === "POST") {
    const body = await readJsonBody(req);
    handleClientAction(body);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, bridge: buildLiveBridgePayload() }));
    return;
  }

  /* Servir archivos estáticos del proyecto */
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(ROOT_DIR, safeSuffix);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("No encontrado: " + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "binary")
    .digest("base64");

  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "\r\n"
  ];

  socket.write(headers.join("\r\n"));
  wsClients.add(socket);

  // Enviar estado actual inmediatamente al conectarse
  try {
    socket.write(
      encodeWsFrame(
        JSON.stringify({
          type: "bridge",
          data: buildLiveBridgePayload()
        })
      )
    );
  } catch (e) {
    /* ignore */
  }

  let recvBuffer = Buffer.alloc(0);

  socket.on("data", (chunk) => {
    recvBuffer = Buffer.concat([recvBuffer, chunk]);
    const decoded = decodeWsFrames(recvBuffer);
    recvBuffer = decoded.remaining;

    for (const item of decoded.messages) {
      if (item.type === "__close__") {
        wsClients.delete(socket);
        socket.end();
        return;
      }
      if (item.type === "text") {
        try {
          const parsed = JSON.parse(item.text);
          handleClientAction(parsed);
        } catch (e) {
          /* ignore invalid JSON */
        }
      }
    }
  });

  socket.on("close", () => wsClients.delete(socket));
  socket.on("error", () => wsClients.delete(socket));
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.log("============================================================");
    console.log(`  [OK] El servidor ya está activo en http://localhost:${PORT}`);
    console.log("============================================================");
    process.exit(0);
  }
  console.error("[ERROR DEL SERVIDOR]:", err);
});

server.listen(PORT, "0.0.0.0", () => {
  const lanIp = getLocalIp();
  console.log("============================================================");
  console.log("  DE UNA, CHANGO! - SERVIDOR DE CONTROL EN VIVO ACTIVO");
  console.log("============================================================");
  console.log(`  Panel en esta PC:       http://localhost:${PORT}`);
  console.log(`  Panel en Celular/Wi-Fi: http://${lanIp}:${PORT}`);
  console.log("------------------------------------------------------------");
  console.log("  - Sincronizado con OBS en tiempo real (WebSocket + Disco)");
  console.log("  - No cierres esta ventana mientras estes en vivo.");
  console.log("============================================================");
});
