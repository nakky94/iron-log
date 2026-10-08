(function () {
  function apply() {
    var s = document.getElementById("darkTheme");
    if (!s) {
      s = document.createElement("style");
      s.id = "darkTheme";
      document.head.appendChild(s);
    }
    s.textContent = [
      ":root{--accent:#1c1c1c;--warn:#8d8d8d}",
      ".nav button span{display:none!important}",
      ".nav button{color:#6e6e6e!important;background:transparent!important}",
      ".nav button.active{background:#1c1c1c!important;color:#f4f4f5!important;border:1px solid #2a2a2e!important;box-shadow:none!important}",
      ".nav button.active::before{display:none!important}",
      ".nav button svg{fill:none!important;stroke:currentColor!important;color:#6e6e6e!important}",
      ".nav button.active svg{color:#f4f4f5!important;stroke:#f4f4f5!important;fill:none!important}",
      ".btn{background:#1c1c1c!important;color:#f4f4f5!important;border:1px solid #2a2a2e}",
      ".btn.ghost{background:#141414!important;color:#f4f4f5!important}",
      ".chip.on{background:#1c1c1c!important;color:#f4f4f5!important;border-color:#2a2a2e!important}",
      ".stat-accent,.stat-accent b{background:#141414!important;color:#f4f4f5!important;border-color:#1e1e1e!important}",
      "#liveHead,.sess-bar,.rest-bar{background:#141414!important;border-color:#1e1e1e!important}",
      "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5!important;color:#111!important;border-color:#f4f4f5!important}",
      "#undoBar2,#prToast{background:#1c1c1c!important;color:#f4f4f5!important;border:1px solid #2a2a2e}",
      ".hist-btn{color:#f4f4f5!important}",
      "[style*='FFD400'],[style*='ffd400'],[style*='19160a']{background:#141414!important;border-color:#1e1e1e!important;color:#f4f4f5!important}"
    ].join("");
    document.querySelectorAll(".nav button").forEach(function (b) {
      if (!b.getAttribute("aria-label")) {
        var label = (b.textContent || "").replace(/\s+/g, " ").trim();
        if (label) b.setAttribute("aria-label", label);
      }
    });
  }
  apply();
  setInterval(apply, 500);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
})();
