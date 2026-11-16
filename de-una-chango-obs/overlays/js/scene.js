/* =====================================================================
   Control de entrada de escena para OBS Browser Source
   Reproduce la cascada .enter cada vez que la escena se activa en OBS,
   incluso cuando restart_when_active es false.
   ===================================================================== */
(function () {
  var body = document.body;
  if (!body) {
    return;
  }

  function playEnter() {
    body.classList.remove("is-standby");
    body.classList.remove("is-playing");
    void body.offsetWidth;
    body.classList.add("is-playing");
  }

  playEnter();

  window.addEventListener("obsSourceActiveChanged", function (event) {
    if (!event || !event.detail) {
      return;
    }
    if (event.detail.active) {
      playEnter();
    } else {
      body.classList.remove("is-playing");
      body.classList.add("is-standby");
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      playEnter();
    }
  });
})();
