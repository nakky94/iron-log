(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function shortName(n) { return String(n || "").replace(/^Dumbbell\s/i, "").replace(/\sMachine$/i, ""); }
  function session() { return load("il_session", null); }
  function workouts() { return load("il_workouts", []); }
  function css() {
    var s = document.getElementById("impStyle");
    if (!s) { s = document.createElement("style"); s.id = "impStyle"; document.head.appendChild(s); }
    s.textContent = [
      ".nav button.active{position:relative}",
      ".nav button.active::before{content:'';display:block!important;position:absolute;top:6px;left:50%;transform:translateX(-50%);width:18px;height:2px;border-radius:99px;background:#f4f4f5}",
      "#restBar .rest-num,.rest-dock .rest-num{color:#f4f4f5!important;font-variant-numeric:tabular-nums;font-size:22px;font-weight:800}",
      "#restDock{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--nav-h) + var(--safe-b) + 8px);width:calc(100% - 32px);max-width:488px;background:#141414;border:1px solid #2a2a2e;border-radius:16px;padding:10px 12px;z-index:32;display:none}",
      "#restDock.on{display:block}",
      "#restDock .rest-acts{display:flex;gap:8px;margin-top:8px}",
      "#restDock .rest-acts button{flex:1;min-height:44px;border-radius:12px;background:#1c1c1c;border:1px solid #2a2a2e;font-weight:700}",
      ".kg-step{display:flex;gap:4px;align-items:center}",
      ".kg-step button{width:44px;height:44px;border-radius:10px;background:#1c1c1c;border:1px solid #2a2a2e;font-weight:800}",
      ".set-row-done{opacity:.45;max-height:0;overflow:hidden;margin:0!important;padding:0!important}",
      "#finishSheet{position:fixed;inset:0;background:#000a;z-index:60;display:none;align-items:flex-end;justify-content:center}",
      "#finishSheet.on{display:flex}",
      "#finishSheet .sheet{width:100%;max-width:520px}",
      "#gearSearch{width:100%;margin:8px 0 10px}",
      "#backupNudge{font-size:12px;color:#8d8d8d;margin:0 0 10px}",
      "body:not(.train-on) #trainDock{display:none!important}",
      "[data-act='repeat-last']{display:inline-flex!important}",
      ".pr-run{margin-top:8px;color:#8d8d8d;font-size:12px;font-variant-numeric:tabular-nums}"
    ].join("");
  }
  function lastDone(ex) {
    var sets = (ex && ex.sets) || [];
    for (var i = sets.length - 1; i >= 0; i--) if (sets[i].w || sets[i].r) return sets[i];
    return null;
  }
  function prefill() {
    var s = session();
    if (!s) return;
    (s.exercises || []).forEach(function (ex, i) {
      var prev = lastDone(ex);
      if (!prev) return;
      (ex.sets || []).forEach(function (set) {
        if (!set.w && prev.w) set.w = prev.w;
        if (!set.r && prev.r) set.r = prev.r;
      });
    });
    save("il_session", s);
  }
  function steps() {
    document.querySelectorAll("#view-workout [data-act='set-w']").forEach(function (inp) {
      if (inp.closest(".kg-step")) return;
      var wrap = document.createElement("div");
      wrap.className = "kg-step";
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "\u2212"; minus.className = "kg-minus";
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.className = "kg-plus";
      wrap.insertBefore(minus, inp);
      wrap.appendChild(plus);
      function bump(el, dir, step) {
        var n = (Number(el.value) || 0) + dir * step;
        if (n < 0) n = 0;
        el.value = String(Math.round(n * 10) / 10);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      function hold(el, dir) {
        var t = setTimeout(function () { bump(inp, dir, 5); }, 450);
        function up() { clearTimeout(t); el.removeEventListener("pointerup", up); }
        el.addEventListener("pointerup", up);
      }
      minus.addEventListener("click", function () { bump(inp, -1, 2.5); });
      plus.addEventListener("click", function () { bump(inp, 1, 2.5); });
      minus.addEventListener("pointerdown", function () { hold(minus, -1); });
      plus.addEventListener("pointerdown", function () { hold(plus, 1); });
    });
  }
  function collapseDone() {
    document.querySelectorAll("#view-workout [data-act='toggle-set']").forEach(function (btn) {
      var row = btn.closest(".set-grid") || btn.parentNode;
      if (!row) return;
      row.classList.toggle("set-row-done", !btn.classList.contains("ghost") && btn.classList.contains("on"));
      if (!btn.classList.contains("ghost") && btn.getAttribute("aria-pressed") === "true") row.classList.add("set-row-done");
    });
  }
  function restDock() {
    var dock = document.getElementById("restDock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "restDock";
      document.body.appendChild(dock);
    }
    var num = document.querySelector("#restBar .rest-num");
    if (num && /Rest/.test(num.textContent || "")) {
      dock.classList.add("on");
      dock.innerHTML = '<div class="rest-num">' + esc(num.textContent) + '</div><div class="rest-acts">' +
        '<button type="button" data-rest-skip>Skip</button><button type="button" id="restPlus">+15s</button></div>';
    } else dock.classList.remove("on");
  }
  function homeBits() {
    var live = document.getElementById("hsLive");
    var s = session();
    if (live && s) {
      var next = (s.exercises || []).filter(function (e) {
        return !(e.sets || []).length || (e.sets || []).some(function (x) { return !x.done; });
      })[0];
      var name = live.querySelector(".ex-name");
      if (name) name.textContent = (s.name || "Workout") + (next ? " \u00b7 " + shortName(next.n) : "");
    }
    var view = document.getElementById("view-home");
    if (view && view.classList.contains("active") && !view.querySelector("#repeatLast")) {
      var start = document.getElementById("hsStart");
      if (start) {
        var b = document.createElement("button");
        b.id = "repeatLast"; b.type = "button"; b.className = "btn ghost";
        b.style.margin = "0 0 12px"; b.textContent = "Repeat last workout";
        start.insertAdjacentElement("afterend", b);
      }
    }
    var exp = Number(load("il_export_ts", 0)) || 0;
    var stale = !exp || Date.now() - exp > 14 * 864e5;
    var nudge = document.getElementById("backupNudge");
    if (view && view.classList.contains("active") && stale && !nudge) {
      nudge = document.createElement("div");
      nudge.id = "backupNudge";
      nudge.textContent = "Last export is over 14 days ago. Export from Log.";
      var stats = view.querySelector(".stats");
      if (stats) stats.insertAdjacentElement("afterend", nudge);
    }
    if (!stale && nudge) nudge.remove();
  }
  function repeatLast() {
    var ws = workouts();
    if (!ws[0]) return;
    var w = ws[0];
    var s = { id: "s" + Date.now(), name: w.name || "Workout", ts: Date.now(), exercises: (w.exercises || []).map(function (e) {
      var prev = lastDone(e);
      return { n: e.n, t: e.t || "", m: e.m || "", sets: [0, 1, 2].map(function () { return { w: prev ? prev.w : "", r: prev ? prev.r : "", done: false }; }) };
    }) };
    save("il_session", s);
    var btn = document.querySelector('.nav button[data-view="workout"]');
    if (btn) btn.click();
  }
  function gearSearch() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    if (!view.querySelector("#gearSearch")) {
      var inp = document.createElement("input");
      inp.id = "gearSearch"; inp.placeholder = "Search gear";
      view.insertBefore(inp, view.firstChild);
      inp.addEventListener("input", filterGear);
    }
    view.querySelectorAll(".card").forEach(function (card) {
      if (card.querySelector(".last-pr")) return;
      var nameEl = card.querySelector(".ex-name");
      if (!nameEl) return;
      var name = nameEl.textContent.trim();
      var last = "";
      workouts().some(function (w) {
        var e = (w.exercises || []).filter(function (x) { return x.n === name || shortName(x.n) === name; })[0];
        if (!e) return false;
        var b = lastDone(e);
        if (b) last = b.w + " kg \u00d7 " + (b.r || "");
        return !!last;
      });
      var pr = load("il_prs", {})[name];
      var line = document.createElement("div");
      line.className = "tiny last-pr";
      line.textContent = (last ? "Last " + last : "No sets yet") + (pr && pr.w ? " \u00b7 PR " + pr.w + " kg" : "");
      nameEl.insertAdjacentElement("afterend", line);
    });
  }
  function filterGear() {
    var q = (document.getElementById("gearSearch").value || "").toLowerCase();
    document.querySelectorAll("#view-library .card").forEach(function (card) {
      var t = (card.textContent || "").toLowerCase();
      card.style.display = !q || t.indexOf(q) >= 0 ? "" : "none";
    });
  }
  function capContinue() {
    var box = document.getElementById("continueBox");
    if (!box) return;
    var cards = box.querySelectorAll("[data-cont-n]");
    for (var i = 3; i < cards.length; i++) cards[i].style.display = "none";
  }
  function sessionStrip() {
    var el = document.getElementById("sessClock");
    if (!el || !el.querySelector("b")) return;
    var s = session();
    var sets = 0, vol = 0;
    if (s) (s.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (x) {
        if (!x.done && !x.w) return;
        sets += 1; vol += (Number(x.w) || 0) * (Number(x.r) || 0);
      });
    });
    if (!el.querySelector(".sess-vol")) {
      var span = document.createElement("span");
      span.className = "sess-vol";
      span.style.cssText = "font-size:12px;color:#8d8d8d;font-variant-numeric:tabular-nums";
      el.appendChild(span);
    }
    el.querySelector(".sess-vol").textContent = sets + " sets \u00b7 " + Math.round(vol) + " kg";
  }
  function prRun() {
    document.querySelectorAll("#prBoard .card").forEach(function (card) {
      if (card.querySelector(".pr-run")) return;
      var name = (card.querySelector(".ex-name") || {}).textContent || "";
      var rows = [];
      workouts().forEach(function (w) {
        (w.exercises || []).forEach(function (e) {
          if (shortName(e.n) !== name && e.n !== name) return;
          var b = lastDone(e);
          if (b) rows.push(b.w + "\u00d7" + (b.r || ""));
        });
      });
      if (!rows.length) return;
      var line = document.createElement("div");
      line.className = "pr-run";
      line.textContent = rows.slice(0, 4).join("  ");
      card.appendChild(line);
    });
  }
  function finishSummary() {
    var s = session();
    if (!s) return;
    var sets = 0, vol = 0;
    (s.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (x) {
        if (!x.done && !x.w) return;
        sets += 1; vol += (Number(x.w) || 0) * (Number(x.r) || 0);
      });
    });
    var sheet = document.getElementById("finishSheet");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = "finishSheet";
      document.body.appendChild(sheet);
    }
    var dur = "";
    try {
      var c = JSON.parse(localStorage.getItem("il_clock") || "{}");
      if (c.startedAt) dur = Math.round((Date.now() - c.startedAt - (c.pauseMs || 0)) / 60000) + " min";
    } catch (e) {}
    sheet.innerHTML = '<div class="sheet"><div class="ex-name">Finish ' + esc(s.name || "workout") + '</div>' +
      '<div class="tiny" style="margin:8px 0 14px">' + esc(dur) + " \u00b7 " + sets + " sets \u00b7 " + Math.round(vol) + ' kg</div>' +
      '<button class="btn" type="button" id="finishOk">Save</button>' +
      '<button class="btn ghost" type="button" id="finishBack" style="margin-top:8px">Back</button></div>';
    sheet.classList.add("on");
    save("il_undo_finish", { session: s, workouts: workouts() });
  }
  function undoFinish() {
    var snap = load("il_undo_finish", null);
    if (!snap) return;
    if (snap.session) save("il_session", snap.session);
    if (snap.workouts) save("il_workouts", snap.workouts);
    var bar = document.getElementById("undoBar2");
    if (bar) bar.classList.remove("on");
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "repeatLast") { repeatLast(); return; }
    if (e.target.id === "restPlus") {
      var chip = document.querySelector("[data-rest-sec]");
      if (chip) chip.click();
      return;
    }
    if (e.target.id === "finishBack") { document.getElementById("finishSheet").classList.remove("on"); return; }
    if (e.target.id === "finishOk") {
      document.getElementById("finishSheet").classList.remove("on");
      var fin = document.querySelector("[data-act='finish']");
      if (fin) { fin.dataset.ok = "1"; fin.click(); setTimeout(function () { delete fin.dataset.ok; }, 200); }
      var bar = document.getElementById("undoBar2") || document.createElement("button");
      bar.id = "undoBar2"; bar.type = "button"; bar.textContent = "Finished \u00b7 Undo";
      if (!bar.parentNode) document.body.appendChild(bar);
      bar.classList.add("on");
      bar.onclick = undoFinish;
      setTimeout(function () { bar.classList.remove("on"); }, 6000);
      return;
    }
    var fin = e.target.closest("[data-act='finish']");
    if (fin && !fin.dataset.ok) {
      e.preventDefault(); e.stopPropagation();
      finishSummary();
      return;
    }
    if (e.target.closest("[data-act='add-set']")) setTimeout(function () { prefill(); steps(); }, 80);
    if (e.target.closest("[data-act='toggle-set']")) setTimeout(collapseDone, 50);
    if (e.target.closest("[data-act='add-ex']")) setTimeout(function () {
      var lib = document.querySelector('.nav button[data-view="library"]');
      if (lib && !document.getElementById("view-library").classList.contains("active")) lib.click();
    }, 60);
    var focus = e.target.closest("#view-workout input");
    if (focus) setTimeout(function () { try { focus.scrollIntoView({ block: "center" }); } catch (err) {} }, 40);
  }, true);
  function tick() {
    css();
    restDock();
    homeBits();
    gearSearch();
    capContinue();
    sessionStrip();
    prRun();
    if (document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active")) steps();
  }
  css();
  setInterval(tick, 700);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
})();
