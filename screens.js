(function () {
  var homeLock = false;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function routines() { return load("il_routines", []); }
  function session() { return load("il_session", null); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function liveInfo() {
    var s = session();
    if (!s || !(s.exercises || []).length) return null;
    var clock = load("il_clock", {});
    var logged = (s.exercises || []).some(function (e) {
      return (e.sets || []).some(function (x) { return x.done; });
    });
    if (!logged && !clock.userStarted) return null;
    var done = (s.exercises || []).filter(function (e) {
      var sets = e.sets || [];
      return sets.length && sets.every(function (x) { return x.done; });
    }).length;
    return { name: s.name || "Workout", done: done, total: s.exercises.length };
  }
  function go(view) {
    var b = document.querySelector('.nav button[data-view="' + view + '"]');
    if (b) b.click();
  }
  function paintHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active") || homeLock) return;
    homeLock = true;
    Array.prototype.slice.call(view.children).forEach(function (el) {
      if (el.id !== "homeScreen") el.style.display = "none";
    });
    var box = view.querySelector("#homeScreen");
    if (!box) {
      box = document.createElement("div");
      box.id = "homeScreen";
      view.insertBefore(box, view.firstChild);
    }
    var live = liveInfo();
    var html = "";
    if (live) {
      html += '<button class="card" type="button" id="hsLive" style="width:100%;text-align:left">' +
        '<div class="tiny">Workout in progress</div><div class="ex-name" style="margin-top:4px">' +
        esc(live.name) + " \u00b7 " + live.done + " / " + live.total + "</div></button>";
    }
    html += '<button class="btn" type="button" id="hsStart" style="margin:4px 0 12px;min-height:52px;font-size:17px">' +
      (live ? "Resume workout" : "Start workout") + "</button>";
    var rts = routines();
    html += '<div class="tiny" style="margin:12px 0 8px">Templates</div>';
    if (!rts.length) html += '<div class="tiny">No templates yet.</div>';
    rts.forEach(function (r) {
      html += '<button class="card" type="button" data-hs-tpl="' + esc(r.id) + '" style="width:100%;text-align:left">' +
        '<div class="ex-name">' + esc(r.name) + '</div><div class="tiny" style="margin-top:4px">' +
        (r.exercises || []).length + " exercises</div></button>";
    });
    html += '<button class="btn" type="button" id="hsNewTpl" style="margin-top:4px">New template</button>';
    box.innerHTML = html;
    setTimeout(function () { homeLock = false; }, 80);
  }
  function openTpl(id) {
    var r = routines().filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var html = '<div class="ex-name">' + esc(r.name) + '</div>';
    (r.exercises || []).forEach(function (e, i) {
      html += '<div class="row" style="margin-top:8px"><div>' + (i + 1) + ". " + esc(e.n) + "</div></div>";
    });
    html += '<button class="btn" type="button" data-act="load-routine" data-id="' + esc(r.id) + '" style="margin-top:16px">Start this session</button>';
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest(".tpl-edit,.tpl-up,.tpl-down,#hsNewTpl")) return;
    if (e.target.closest("#hsStart, #hsLive")) {
      if (liveInfo()) go("workout");
      else go("library");
      return;
    }
    var tpl = e.target.closest("[data-hs-tpl]");
    if (tpl) openTpl(tpl.getAttribute("data-hs-tpl"));
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paintHome, 50); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintHome);
  else paintHome();
  window.gymPaintHome = paintHome;
})();
