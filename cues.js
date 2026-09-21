(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  function cues() { return load("il_cues", {}); }
  function session() { return load("il_session", null); }
  var activeName = "";
  function paintCues() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = session(); if (!s) return;
    var cards = view.querySelectorAll(".card");
    var all = cues();
    (s.exercises || []).forEach(function (ex, i) {
      var card = cards[i]; if (!card) return;
      var cue = all[ex.n] || {};
      if (!card.querySelector("[data-act='edit-cue']")) {
        var lastRow = card.querySelectorAll(".row"); lastRow = lastRow[lastRow.length - 1];
        if (lastRow) {
          var btn = document.createElement("button");
          btn.className = "btn sm ghost"; btn.type = "button";
          btn.setAttribute("data-act", "edit-cue"); btn.setAttribute("data-i", String(i));
          btn.textContent = "Cue"; lastRow.appendChild(btn);
        }
      }
      var box = card.querySelector(".cue-box");
      if (!box) {
        box = document.createElement("div"); box.className = "cue-box"; box.style.cssText = "margin-top:8px";
        var grid = card.querySelector(".set-grid");
        if (grid) card.insertBefore(box, grid); else card.appendChild(box);
      }
      box.innerHTML = cue.note ? '<div class="tiny">' + esc(cue.note) + "</div>" : "";
    });
  }
  function openEditor(i) {
    var s = session(); if (!s || !s.exercises[i]) return;
    activeName = s.exercises[i].n;
    var cue = cues()[activeName] || { note: "" };
    var html = '<div class="grab"></div><div class="ex-name" style="margin-bottom:8px">' + esc(activeName) + '</div>';
    html += '<div class="tiny" style="margin-bottom:8px">Form cue</div>';
    html += '<input id="cueNote" placeholder="Elbows in. Pause at the bottom." value="' + esc(cue.note || "") + '" />';
    html += '<div style="height:12px"></div><button class="btn" type="button" data-act="save-cue">Save cue</button>';
    if (cue.note) html += '<div style="height:8px"></div><button class="btn ghost warn" type="button" data-act="clear-cue">Remove cue</button>';
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  function exportDue() {
    var last = Number(load("il_export_ts", 0)) || 0;
    return !last || (Date.now() - last > 7 * 864e5);
  }
  function polishHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    var inst = document.getElementById("homeInstall");
    if (inst) inst.remove();
    var hint = view.querySelector("#iosHint");
    if (hint) hint.style.display = "none";
  }
  function paintBackup() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    var old = view.querySelector("#backupNag");
    if (!exportDue()) { if (old) old.remove(); return; }
    if (old) return;
    var card = document.createElement("div");
    card.id = "backupNag";
    card.className = "strip";
    card.innerHTML = '<span>Backup due</span><span class="row" style="gap:10px"><button class="text-link" type="button" data-act="export-json">Export</button><button class="text-link muted" type="button" data-act="snooze-export">Later</button></span>';
    var stats = view.querySelector(".stats");
    if (stats) stats.insertAdjacentElement("afterend", card);
    else view.insertBefore(card, view.firstChild);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act");
    if (act === "edit-cue") openEditor(Number(t.getAttribute("data-i")));
    if (act === "save-cue") {
      var noteEl = document.getElementById("cueNote");
      var note = noteEl ? noteEl.value.trim() : "";
      var all = cues();
      if (note) all[activeName] = { note: note }; else delete all[activeName];
      save("il_cues", all);
      document.getElementById("modal").classList.remove("show");
      document.querySelector('.nav button[data-view="workout"]').click();
    }
    if (act === "clear-cue") {
      var all2 = cues(); delete all2[activeName]; save("il_cues", all2);
      document.getElementById("modal").classList.remove("show");
      document.querySelector('.nav button[data-view="workout"]').click();
    }
    if (act === "export-json") {
      save("il_export_ts", Date.now());
      var nag = document.getElementById("backupNag"); if (nag) nag.remove();
    }
    if (act === "snooze-export") {
      save("il_export_ts", Date.now());
      var n2 = document.getElementById("backupNag"); if (n2) n2.remove();
    }
  });
  var obs = new MutationObserver(function () { paintCues(); paintBackup(); polishHome(); });
  setTimeout(function () {
    ["view-workout", "view-home"].forEach(function (id) {
      var n = document.getElementById(id); if (n) obs.observe(n, { childList: true });
    });
    paintCues(); paintBackup(); polishHome();
  }, 700);
})();
