(function () {
  function css() {
    var s = document.getElementById("mobStyle");
    if (!s) { s = document.createElement("style"); s.id = "mobStyle"; document.head.appendChild(s); }
    s.textContent =
      ".nav button span{display:block!important;margin-top:2px}" +
      "#view-workout{padding-bottom:calc(var(--nav-h) + var(--safe-b) + 88px)!important}" +
      "#trainDock{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--nav-h) + var(--safe-b));width:100%;max-width:520px;display:none;gap:8px;padding:8px 16px;background:linear-gradient(180deg,#0a0a0a00,#0a0a0a 28%);z-index:25}" +
      "body.train-on #trainDock{display:flex}" +
      "#trainDock .btn{flex:1;min-height:48px}" +
      ".step{width:44px!important;height:44px!important;min-width:44px}" +
      ".set-grid [data-act='toggle-set']{width:44px;height:44px}" +
      ".chips{scrollbar-width:none;-webkit-overflow-scrolling:touch}" +
      "@media (min-width:640px){.app{box-shadow:0 0 0 1px #161616}}" +
      ".stat .tiny{white-space:nowrap;overflow:hidden;text-overflow:clip}";
  }
  function dock() {
    var bar = document.getElementById("trainDock");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "trainDock";
      bar.innerHTML =
        '<button type="button" class="btn ghost" id="dockStart">Start session</button>' +
        '<button type="button" class="btn" id="dockSave">Save</button>';
      document.body.appendChild(bar);
      bar.addEventListener("click", function (e) {
        var id = e.target && e.target.id;
        if (id === "dockSave") {
          var fin = document.querySelector("[data-act='finish']");
          if (fin) fin.click();
        }
        if (id === "dockStart") {
          var hold = document.getElementById("holdStart") || document.querySelector("[data-act='start-session'],[data-act='pause-session']");
          if (hold) hold.click();
          else {
            try {
              var c = JSON.parse(localStorage.getItem("il_clock") || "{}");
              if (c.startedAt && !c.pausedAt) {
                c.pausedAt = Date.now();
              } else if (c.pausedAt) {
                c.pauseMs = (c.pauseMs || 0) + (Date.now() - c.pausedAt);
                c.pausedAt = null;
              } else {
                c.startedAt = Date.now(); c.pauseMs = 0; c.pausedAt = null;
              }
              localStorage.setItem("il_clock", JSON.stringify(c));
            } catch (err) {}
          }
          syncDock();
        }
      });
    }
    syncDock();
  }
  function syncDock() {
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    document.body.classList.toggle("train-on", !!on);
    var btn = document.getElementById("dockStart");
    if (!btn) return;
    var c = {};
    try { c = JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) {}
    if (c.startedAt && !c.pausedAt) btn.textContent = "Pause";
    else if (c.pausedAt) btn.textContent = "Resume";
    else btn.textContent = "Start session";
  }
  function keyboard() {
    if (!window.visualViewport) return;
    visualViewport.addEventListener("resize", function () {
      var el = document.activeElement;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      setTimeout(function () {
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); }
      }, 50);
    });
    document.addEventListener("focusin", function (e) {
      var el = e.target;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      setTimeout(function () {
        try { el.scrollIntoView({ block: "center" }); } catch (err) {}
      }, 120);
    });
  }
  function boot() {
    css();
    dock();
    keyboard();
    document.querySelectorAll(".nav button").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(syncDock, 30); });
    });
    setInterval(syncDock, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
