(function () {
  var activeI = 0;
  function css() {
    var s = document.getElementById("mobStyle");
    if (!s) { s = document.createElement("style"); s.id = "mobStyle"; document.head.appendChild(s); }
    s.textContent =
      ".nav button span{display:block!important;margin-top:2px}" +
      "#view-workout{padding-bottom:calc(var(--nav-h) + var(--safe-b) + 168px)!important}" +
      "#view-workout .set-grid input{min-height:52px!important;font-size:20px!important;font-weight:700}" +
      "#trainDock{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--nav-h) + var(--safe-b));width:100%;max-width:520px;display:none;flex-direction:column;gap:8px;padding:8px 16px 10px;background:#0a0a0a;border-top:1px solid #1a1a1a;z-index:28}" +
      "body.train-on #trainDock{display:flex}" +
      "body.kb-open .nav{opacity:0;pointer-events:none}" +
      "#dockEx{font-size:12px;color:#8d8d8d;font-weight:600}" +
      "#dockFields{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
      "#dockFields label{display:block;font-size:10px;color:#8d8d8d;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}" +
      "#dockKg,#dockReps{min-height:56px;font-size:22px;font-weight:800;text-align:center}" +
      "#dockActs{display:flex;gap:8px}" +
      "#dockActs .btn{flex:1;min-height:48px}" +
      ".step{width:44px!important;height:44px!important;min-width:44px}" +
      "@media (min-width:640px){.app{box-shadow:0 0 0 1px #161616}}";
  }
  function session() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function nameFor(i) {
    var s = session();
    return s && s.exercises && s.exercises[i] ? s.exercises[i].n : "Exercise";
  }
  function lastVals(i) {
    var s = session();
    var sets = s && s.exercises && s.exercises[i] ? s.exercises[i].sets || [] : [];
    var last = sets[sets.length - 1] || {};
    return { w: last.w || "", r: last.r || "" };
  }
  function dock() {
    var bar = document.getElementById("trainDock");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "trainDock";
      bar.innerHTML =
        '<div id="dockEx">Exercise</div>' +
        '<div id="dockFields"><div><label>Weight</label><input id="dockKg" inputmode="decimal" placeholder="kg" /></div>' +
        '<div><label>Reps</label><input id="dockReps" inputmode="numeric" placeholder="reps" /></div></div>' +
        '<div id="dockActs">' +
        '<button type="button" class="btn" id="dockAdd">Add set</button>' +
        '<button type="button" class="btn ghost" id="dockStart">Start</button>' +
        '<button type="button" class="btn ghost" id="dockSave">Save</button>' +
        "</div>";
      document.body.appendChild(bar);
      bar.addEventListener("click", function (e) {
        var id = e.target && e.target.id;
        if (id === "dockAdd") addSet();
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
              if (c.startedAt && !c.pausedAt) c.pausedAt = Date.now();
              else if (c.pausedAt) { c.pauseMs = (c.pauseMs || 0) + (Date.now() - c.pausedAt); c.pausedAt = null; }
              else { c.startedAt = Date.now(); c.pauseMs = 0; c.pausedAt = null; }
              localStorage.setItem("il_clock", JSON.stringify(c));
            } catch (err) {}
          }
          syncDock();
        }
      });
      document.getElementById("dockKg").addEventListener("change", pushVals);
      document.getElementById("dockReps").addEventListener("change", pushVals);
    }
    syncDock();
  }
  function pushVals() {
    var kg = document.getElementById("dockKg");
    var rp = document.getElementById("dockReps");
    var row = document.querySelector('#view-workout [data-act="set-w"][data-i="' + activeI + '"]');
    if (!row) return;
    var card = row.closest(".card");
    if (!card) return;
    var ws = card.querySelectorAll("[data-act='set-w']");
    var rs = card.querySelectorAll("[data-act='set-r']");
    var lastW = ws[ws.length - 1];
    var lastR = rs[rs.length - 1];
    if (lastW) {
      lastW.value = kg.value;
      lastW.dispatchEvent(new Event("input", { bubbles: true }));
      lastW.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (lastR) {
      lastR.value = rp.value;
      lastR.dispatchEvent(new Event("input", { bubbles: true }));
      lastR.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  function addSet() {
    pushVals();
    var btn = document.querySelector('#view-workout [data-act="add-set"][data-i="' + activeI + '"]');
    if (btn) btn.click();
    setTimeout(function () {
      pushVals();
      var tick = document.querySelectorAll('#view-workout [data-act="toggle-set"][data-i="' + activeI + '"]');
      var last = tick[tick.length - 2] || tick[tick.length - 1];
      if (last && last.classList.contains("ghost")) last.click();
    }, 80);
  }
  function syncDock() {
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    document.body.classList.toggle("train-on", !!on);
    var lab = document.getElementById("dockEx");
    if (lab) lab.textContent = nameFor(activeI);
    var v = lastVals(activeI);
    var kg = document.getElementById("dockKg");
    var rp = document.getElementById("dockReps");
    if (kg && document.activeElement !== kg) kg.value = v.w;
    if (rp && document.activeElement !== rp) rp.value = v.r;
    var btn = document.getElementById("dockStart");
    if (!btn) return;
    var c = {};
    try { c = JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) {}
    if (c.startedAt && !c.pausedAt) btn.textContent = "Pause";
    else if (c.pausedAt) btn.textContent = "Resume";
    else btn.textContent = "Start";
  }
  function placeDock() {
    var bar = document.getElementById("trainDock");
    if (!bar) return;
    var vv = window.visualViewport;
    var gap = 0;
    if (vv) gap = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
    var kb = gap > 80;
    document.body.classList.toggle("kb-open", kb);
    bar.style.bottom = kb ? gap + "px" : "calc(var(--nav-h) + var(--safe-b))";
  }
  function keyboard() {
    function bump() {
      placeDock();
      var el = document.activeElement;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      if (el.id === "dockKg" || el.id === "dockReps") return;
      setTimeout(function () {
        try { el.scrollIntoView({ block: "center" }); } catch (e) {}
      }, 40);
    }
    if (window.visualViewport) {
      visualViewport.addEventListener("resize", bump);
      visualViewport.addEventListener("scroll", bump);
    }
    window.addEventListener("resize", bump);
    document.addEventListener("focusin", function (e) {
      var el = e.target;
      if (el && el.getAttribute && el.getAttribute("data-i") != null) {
        activeI = Number(el.getAttribute("data-i")) || 0;
        syncDock();
      }
      var card = el && el.closest && el.closest("#view-workout .card");
      if (card) {
        var w = card.querySelector("[data-act='set-w']");
        if (w) activeI = Number(w.getAttribute("data-i")) || 0;
        syncDock();
      }
      bump();
    });
  }
  function boot() {
    css();
    dock();
    keyboard();
    document.querySelectorAll(".nav button").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(syncDock, 30); });
    });
    document.addEventListener("click", function (e) {
      var card = e.target.closest("#view-workout .card");
      if (!card) return;
      var w = card.querySelector("[data-act='set-w']");
      if (w) { activeI = Number(w.getAttribute("data-i")) || 0; syncDock(); }
    });
    setInterval(syncDock, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
