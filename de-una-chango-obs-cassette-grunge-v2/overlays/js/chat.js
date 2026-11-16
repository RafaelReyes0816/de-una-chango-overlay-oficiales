(function () {
  var config = window.CHANGO_CONFIG || {};
  var mount = document.getElementById("chat-mount");
  var status = document.getElementById("chat-status");

  if (!mount) {
    return;
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function appendMessage(payload) {
    var data = payload || {};
    var empty = mount.querySelector(".chat-empty");
    if (empty) {
      mount.removeChild(empty);
    }

    var row = document.createElement("div");
    row.className = "chat-message";

    var accent = data.color || "#FFB000";
    row.style.setProperty("--msg-accent", accent);

    var head = document.createElement("div");
    head.className = "chat-message__head";

    var dot = document.createElement("span");
    dot.className = "chat-message__dot";

    var user = document.createElement("span");
    user.className = "chat-message__user";
    user.textContent = data.user || "comunidad";

    head.appendChild(dot);
    head.appendChild(user);

    var text = document.createElement("div");
    text.className = "chat-message__text";
    text.textContent = data.text || "";

    row.appendChild(head);
    row.appendChild(text);
    mount.appendChild(row);

    while (mount.children.length > 16) {
      mount.removeChild(mount.firstChild);
    }

    mount.scrollTop = mount.scrollHeight;
  }

  function showQuietStandby() {
    clearNode(mount);
    var standby = document.createElement("div");
    standby.className = "chat-empty";

    var pulse = document.createElement("div");
    pulse.className = "chat-empty__dots";
    for (var i = 0; i < 3; i += 1) {
      var dot = document.createElement("span");
      dot.style.animationDelay = (i * 180) + "ms";
      pulse.appendChild(dot);
    }

    var title = document.createElement("div");
    title.className = "chat-empty__title";
    title.textContent = "Chat en vivo";

    var sub = document.createElement("div");
    sub.className = "chat-empty__sub";
    sub.textContent = "Participa con " + (config.hashtag || "#DeUnaChango");

    standby.appendChild(pulse);
    standby.appendChild(title);
    standby.appendChild(sub);
    mount.appendChild(standby);

    if (status) {
      status.textContent = (config.redes || "@deunachango") + " · EN VIVO";
    }
  }

  function showDemoChat() {
    clearNode(mount);
    var messages = Array.isArray(config.chatMessages) ? config.chatMessages : [];
    if (!messages.length) {
      showQuietStandby();
      return;
    }

    if (status) {
      status.textContent = (config.hashtag || "#DeUnaChango") + " · COMUNIDAD";
    }

    var index = 0;
    function step() {
      appendMessage(messages[index % messages.length]);
      index += 1;
    }

    step();
    window.setInterval(step, 3800);
  }

  function showLiveChat(url) {
    clearNode(mount);
    var frame = document.createElement("iframe");
    frame.className = "chat-live-frame";
    frame.src = url;
    frame.title = "Chat del stream";
    frame.loading = "eager";
    frame.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture";
    mount.appendChild(frame);

    if (status) {
      status.textContent = "CHAT EN VIVO · " + (config.redes || "@deunachango");
    }
  }

  window.pushChangoChatMessage = appendMessage;

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (data && data.type === "chango-chat" && data.text) {
      appendMessage(data);
    }
  });

  if (window.ChangoLive) {
    window.ChangoLive.subscribe(
      function (nextState) {
        if (!nextState) {
          return;
        }
        config = nextState;
        if (status && (!nextState.chatUrl || !String(nextState.chatUrl).trim())) {
          status.textContent = (config.redes || "@deunachango") + " · EN VIVO";
        }
      },
      function (cmd, payload) {
        if (cmd === "chat-msg" && payload && payload.text) {
          appendMessage(payload);
        } else if (cmd === "chat-clear") {
          showQuietStandby();
        }
      }
    );
  }

  var liveUrl = config.chatUrl ? String(config.chatUrl).trim() : "";
  if (liveUrl !== "") {
    showLiveChat(liveUrl);
  } else if (config.showDemoChat === true) {
    showDemoChat();
  } else {
    showQuietStandby();
  }
})();
