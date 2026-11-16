/* =====================================================================
   DE UNA, CHANGO! · Bus de Sincronización en Tiempo Real (OBS + Navegador)
   Conecta el Panel de Control con todas las escenas en OBS mediante:
   1. WebSocket en tiempo real (ws://127.0.0.1:4545/ws)
   2. Puente en disco para file:// en OBS (overlays/js/live-state.js)
   3. BroadcastChannel + localStorage como respaldo adicional
   ===================================================================== */
(function () {
  var SERVER_HTTP = (window.location.protocol === "http:" || window.location.protocol === "https:")
    ? window.location.origin
    : "http://127.0.0.1:4545";
  var SERVER_WS = SERVER_HTTP.replace(/^http/, "ws") + "/ws";

  var STATE_KEY = "chango_live_state_v1";
  var CMD_KEY = "chango_live_cmd_v1";
  var TIMER_KEY = "chango_live_timer_v1";

  var baseConfig = window.CHANGO_DEFAULT_CONFIG
    ? JSON.parse(JSON.stringify(window.CHANGO_DEFAULT_CONFIG))
    : JSON.parse(JSON.stringify(window.CHANGO_CONFIG || {}));

  var stateListeners = [];
  var cmdListeners = [];
  var timerListeners = [];
  var connListeners = [];

  var lastStateStamp = "";
  var processedCmdIds = {};
  var ws = null;
  var wsConnected = false;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeConfig(base, override) {
    var result = clone(base || {});
    if (!override || typeof override !== "object") {
      return result;
    }

    var scalarKeys = [
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

    scalarKeys.forEach(function (k) {
      if (typeof override[k] !== "undefined") {
        result[k] = override[k];
      }
    });

    if (override.generalLower && typeof override.generalLower === "object") {
      result.generalLower = Object.assign({}, result.generalLower || {}, override.generalLower);
    }

    if (override.camaras && typeof override.camaras === "object") {
      result.camaras = result.camaras || {};
      ["cam1", "cam2", "cam3"].forEach(function (camKey) {
        if (override.camaras[camKey]) {
          result.camaras[camKey] = Object.assign(
            {},
            result.camaras[camKey] || {},
            typeof override.camaras[camKey] === "string"
              ? { nombre: override.camaras[camKey] }
              : override.camaras[camKey]
          );
        }
      });
    }

    if (Array.isArray(override.equipo)) {
      result.equipo = clone(override.equipo);
    }

    return result;
  }

  function notifyConnListeners(connected) {
    for (var i = 0; i < connListeners.length; i += 1) {
      try {
        connListeners[i](connected);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function notifyStateListeners(state) {
    for (var i = 0; i < stateListeners.length; i += 1) {
      try {
        stateListeners[i](state);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function handleIncomingCommand(packet) {
    if (!packet || !packet.id || !packet.cmd) {
      return;
    }
    if (processedCmdIds[packet.id]) {
      return;
    }
    processedCmdIds[packet.id] = true;

    /* Ignorar comandos antiguos (> 8 segundos) al abrir una escena por primera vez */
    if (packet.ts && Math.abs(Date.now() - Number(packet.ts)) > 8000) {
      return;
    }

    for (var i = 0; i < cmdListeners.length; i += 1) {
      try {
        cmdListeners[i](packet.cmd, packet.payload || {}, packet);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function handleIncomingTimer(telemetry) {
    if (!telemetry) {
      return;
    }
    for (var i = 0; i < timerListeners.length; i += 1) {
      try {
        timerListeners[i](telemetry);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function applyBridgePayload(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }

    if (payload.state && payload.stamp && payload.stamp !== lastStateStamp) {
      lastStateStamp = payload.stamp;
      window.CHANGO_CONFIG = mergeConfig(baseConfig, payload.state);
      notifyStateListeners(window.CHANGO_CONFIG);
    }

    if (payload.cmd && payload.cmd.id) {
      handleIncomingCommand(payload.cmd);
    }

    if (payload.timer && timerListeners.length > 0) {
      handleIncomingTimer(payload.timer);
    }
  }

  /* Callback global para el archivo en disco overlays/js/live-state.js */
  window.__onChangoLiveBridge = function (payload) {
    applyBridgePayload(payload);
  };

  /* 1. Conexión WebSocket en tiempo real con servidor-control.js */
  function connectWebSocket() {
    try {
      ws = new window.WebSocket(SERVER_WS);
    } catch (e) {
      ws = null;
      return;
    }

    ws.onopen = function () {
      wsConnected = true;
      notifyConnListeners(true);
    };

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        if (!msg) return;
        if (msg.type === "bridge" && msg.data) {
          applyBridgePayload(msg.data);
        } else if (msg.type === "cmd" && msg.packet) {
          handleIncomingCommand(msg.packet);
        } else if (msg.type === "timer" && msg.telemetry) {
          handleIncomingTimer(msg.telemetry);
        }
      } catch (e) {
        /* ignore */
      }
    };

    ws.onclose = function () {
      if (wsConnected) {
        wsConnected = false;
        notifyConnListeners(false);
      }
      ws = null;
      window.setTimeout(connectWebSocket, 1800);
    };

    ws.onerror = function () {
      try {
        ws.close();
      } catch (e) {
        /* ignore */
      }
    };
  }

  connectWebSocket();

  /* 2. Puente de archivo local (js/live-state.js) para OBS file://
     Funciona incluso si OBS bloquea sockets locales, leyendo el archivo actualizado en disco */
  function pollDiskBridge() {
    var head = document.head || document.body;
    if (!head) return;
    var s = document.createElement("script");
    s.src = "js/live-state.js?t=" + Date.now();
    s.async = true;
    s.onload = function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.onerror = function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    head.appendChild(s);
  }

  window.setInterval(pollDiskBridge, 650);
  pollDiskBridge();

  /* Enviar acciones al servidor (WebSocket + HTTP POST de respaldo) */
  function sendToServer(actionObj) {
    if (ws && wsConnected && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(actionObj));
        return;
      } catch (e) {
        /* fallback a fetch */
      }
    }

    if (typeof window.fetch === "function") {
      window.fetch(SERVER_HTTP + "/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionObj)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.bridge) {
            applyBridgePayload(res.bridge);
          }
        })
        .catch(function () {
          /* ignore */
        });
    }
  }

  function updateState(patch) {
    window.CHANGO_CONFIG = mergeConfig(window.CHANGO_CONFIG, patch);
    notifyStateListeners(window.CHANGO_CONFIG);
    sendToServer({ type: "update-state", patch: patch });
    return window.CHANGO_CONFIG;
  }

  function resetState() {
    window.CHANGO_CONFIG = clone(baseConfig);
    notifyStateListeners(window.CHANGO_CONFIG);
    sendToServer({ type: "reset-state" });
    return window.CHANGO_CONFIG;
  }

  function sendCommand(cmd, payload) {
    var localPacket = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      cmd: cmd,
      payload: payload || {}
    };
    handleIncomingCommand(localPacket);
    sendToServer({ type: "cmd", cmd: cmd, payload: payload || {} });
    return localPacket;
  }

  function publishTimer(telemetry) {
    var data = Object.assign({ ts: Date.now() }, telemetry || {});
    sendToServer({ type: "timer", telemetry: data });
  }

  function setTextWithPulse(el, newText) {
    if (!el || typeof newText === "undefined" || newText === null) {
      return;
    }
    var str = String(newText);
    if (el.textContent === str) {
      return;
    }
    el.textContent = str;
    if (el.animate) {
      try {
        el.animate(
          [
            { opacity: 0.3, transform: "translateY(4px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
      } catch (e) {
        /* ignore */
      }
    }
  }

  window.ChangoLive = {
    getState: function () {
      return window.CHANGO_CONFIG;
    },
    getDefaults: function () {
      return clone(baseConfig);
    },
    isConnected: function () {
      return wsConnected;
    },
    updateState: updateState,
    resetState: resetState,
    sendCommand: sendCommand,
    publishTimer: publishTimer,
    readTimer: function () {
      return null;
    },
    setText: setTextWithPulse,
    subscribe: function (onState, onCommand, onTimer, onConn) {
      if (typeof onState === "function") {
        stateListeners.push(onState);
      }
      if (typeof onCommand === "function") {
        cmdListeners.push(onCommand);
      }
      if (typeof onTimer === "function") {
        timerListeners.push(onTimer);
      }
      if (typeof onConn === "function") {
        connListeners.push(onConn);
        onConn(wsConnected);
      }
    }
  };
})();
