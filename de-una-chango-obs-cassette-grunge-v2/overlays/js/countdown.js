function initCountdown(element, minutes) {
  if (!element) {
    return;
  }

  var totalSeconds = Math.max(1, Math.round(Number(minutes || 5) * 60));
  var remainingSeconds = totalSeconds;
  var endTime = Date.now() + totalSeconds * 1000;
  var paused = false;
  var finished = false;
  var lastReportedSec = -1;
  var progressBar = document.getElementById("countdown-progress");

  function formatTime(sec) {
    var mins = Math.floor(sec / 60);
    var secs = sec % 60;
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function reportTelemetry() {
    if (!window.ChangoLive || typeof window.ChangoLive.publishTimer !== "function") {
      return;
    }
    window.ChangoLive.publishTimer({
      remaining: remainingSeconds,
      totalSeconds: totalSeconds,
      paused: paused,
      finished: finished,
      display: finished ? "ARRANCAMOS" : formatTime(remainingSeconds)
    });
  }

  function updateProgress(remaining) {
    if (!progressBar || totalSeconds <= 0) {
      return;
    }
    var ratio = Math.max(0, Math.min(1, remaining / totalSeconds));
    progressBar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
  }

  function render(remaining) {
    remainingSeconds = Math.max(0, remaining);
    element.textContent = formatTime(remainingSeconds);
    element.classList.toggle("is-low", remainingSeconds <= 60 && remainingSeconds > 0);
    updateProgress(remainingSeconds);
    if (remainingSeconds !== lastReportedSec) {
      lastReportedSec = remainingSeconds;
      reportTelemetry();
    }
  }

  function reset(customMinutes) {
    if (typeof customMinutes === "number" && customMinutes > 0) {
      totalSeconds = Math.max(1, Math.round(customMinutes * 60));
    }
    remainingSeconds = totalSeconds;
    endTime = Date.now() + totalSeconds * 1000;
    paused = false;
    finished = false;
    lastReportedSec = -1;
    element.classList.remove("is-done", "is-low");
    render(totalSeconds);
    reportTelemetry();
  }

  function finishNow() {
    remainingSeconds = 0;
    paused = false;
    finished = true;
    element.textContent = "ARRANCAMOS";
    element.classList.remove("is-low");
    element.classList.add("is-done");
    updateProgress(0);
    reportTelemetry();
  }

  function setPaused(nextPaused) {
    if (finished) {
      return;
    }
    if (nextPaused && !paused) {
      remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      paused = true;
    } else if (!nextPaused && paused) {
      endTime = Date.now() + remainingSeconds * 1000;
      paused = false;
    }
    reportTelemetry();
  }

  function addSeconds(deltaSeconds) {
    var delta = Math.round(Number(deltaSeconds || 0));
    if (!delta) {
      return;
    }
    var base = paused ? remainingSeconds : Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    var next = Math.max(0, base + delta);
    if (next > totalSeconds) {
      totalSeconds = next;
    }
    remainingSeconds = next;
    endTime = Date.now() + next * 1000;
    if (next === 0) {
      finishNow();
      return;
    }
    finished = false;
    element.classList.remove("is-done");
    lastReportedSec = -1;
    render(next);
    reportTelemetry();
  }

  function tick() {
    if (finished || paused) {
      return;
    }

    var remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remaining > 0) {
      render(remaining);
      return;
    }

    finishNow();
  }

  element.addEventListener("click", function () {
    reset();
  });

  window.addEventListener("keydown", function (event) {
    if (String(event.key).toLowerCase() === "r") {
      reset();
    }
  });

  window.addEventListener("obsSourceActiveChanged", function (event) {
    if (event && event.detail && event.detail.active) {
      var cfg = window.CHANGO_CONFIG || {};
      reset(Number(cfg.countdownMinutes || minutes || 5));
    }
  });

  if (window.ChangoLive && typeof window.ChangoLive.subscribe === "function") {
    window.ChangoLive.subscribe(
      function (state) {
        if (state && state.countdownMinutes) {
          var newTotal = Math.max(1, Math.round(Number(state.countdownMinutes) * 60));
          if (newTotal !== totalSeconds && remainingSeconds === totalSeconds) {
            reset(Number(state.countdownMinutes));
          }
        }
      },
      function (cmd, payload) {
        if (cmd !== "timer-cmd" || !payload) {
          return;
        }
        var action = payload.action;
        if (action === "reset") {
          reset(Number(payload.minutes || (window.CHANGO_CONFIG && window.CHANGO_CONFIG.countdownMinutes) || 5));
        } else if (action === "toggle-pause") {
          setPaused(!paused);
        } else if (action === "pause") {
          setPaused(true);
        } else if (action === "resume") {
          setPaused(false);
        } else if (action === "add-seconds") {
          addSeconds(Number(payload.seconds || 0));
        } else if (action === "finish-now") {
          finishNow();
        }
      }
    );
  }

  render(totalSeconds);
  window.setInterval(tick, 250);
}
