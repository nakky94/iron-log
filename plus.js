(function () {
  var BF = [2.3,3.4,4.5,5.7,6.8,7.9,9.1,10.2,11.3,12.5,13.6,14.7,15.9,18.1,20.4,22.7,23.8,24.9,27.2,29.5,31.8,34,36.3,38.6,40.8];
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function sess() { return load("il_session", null); }
  function saveSess(s) { save("il_session", s); }
  function workouts() { return load("il_workouts", []); }
  function snap(n, dir) {
    var x = Number(n) || 0;
    if (dir === 0) {
      var best = BF[0], d = Math.abs(x - best);
      BF.forEach(function (s) { var z = Math.abs(x - s); if (z < d) { d = z; best = s; } });
      return best;
    }
    var i = 0, bestI = 0, d = 99;
    BF.forEach(function (s, idx) { var z = Math.abs(x - s); if (z < d) { d = z; bestI = idx; } });
    i = Math.max(0, Math.min(BF.length - 1, bestI + dir));
    return BF[i];
  }
  function lastEx(name) {
    var ws = workouts();
    for (var i = 0; i < ws.length; i++) {
      var e = (ws[i].exercises || []).filter(function (x) { return x.n === name; })[0];
      if (e) return { w: ws[i], e: e };
    }
    return null;
  }
  function epley(w, r) {
    w = Number(w) || 0; r = Number(r) || 0;
    if (!w || !r) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  }
  function weekStart() {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    s.setHours(0, 0, 0, 0);
    return s.getTime();
  }
  function muscleSets() {
    var from = weekStart(), map = {};
    workouts().forEach(function (w) {
      if (w.ts < from) return;
      (w.exercises || []).forEach(function (e) {
        var m = e.m || "Other", n = 0;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) && Number(s.r)) n += 1; });
        map[m] = (map[m] || 0) + n;
      });
    });
    return map;
  }
  function plateau(name) {
    var tops = [];
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (e.n !== name) return;
        var best = 0;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
        if (best) tops.push(best);
      });
    });
    if (tops.length < 3) return false;
    return tops[0] === tops[1] && tops[1] === tops[2];
  }
  function waveLabel() {
    var ws = workouts();
    if (!ws.length) return "Wave 1 · week 1";
    var first = ws[ws.length - 1].ts;
    var weeks = Math.floor((Date.now() - first) / (7 * 864e5)) + 1;
    var wave = Math.floor((weeks - 1) / 4) + 1;
    var wk = ((weeks - 1) % 4) + 1;
    return "Wave " + wave + " · week " + wk + (wk === 4 ? " · deload" : "");
  }
  function applyRirPrefill() {
    var s = sess(); if (!s) return;
    var rirs = load("il_rir", {});
    (s.exercises || []).forEach(function (ex) {
      var last = lastEx(ex.n);
      var rir = rirs[ex.n];
      if (rir == null || !last) return;
      var top = 0, reps = 8;
      (last.e.sets || []).forEach(function (x) {
        if (x.done && Number(x.w) >= top) { top = Number(x.w); reps = Number(x.r) || reps; }
      });
      if (!top) return;
      var next = (Number(rir) >= 2) ? snap(top, 1) : snap(top, 0);
      (ex.sets || []).forEach(function (st, i) {
        if (i === 0) return;
        if (!st.w) st.w = String(next);
        if (!st.r) st.r = String(reps);
      });
    });
    saveSess(s);
  }
  function paintTrain() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var strip = view.querySelector("#sessStrip");
    if (strip && !strip.querySelector(".wave")) {
      var w = document.createElement("div");
      w.className = "wave tiny";
      w.style.cssText = "width:100%;margin-top:4px;grid-column:1/-1";
      w.textContent = waveLabel();
      strip.appendChild(w);
    } else if (strip) {
      var el = strip.querySelector(".wave");
      if (el) el.textContent = waveLabel();
    }
    var s = sess();
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card, i) {
      var nameEl = card.querySelector(".ex-name");
      if (nameEl) {
        nameEl.style.cursor = "pointer";
        nameEl.setAttribute("data-act", "lift-sheet");
        nameEl.setAttribute("data-i", String(i));
      }
      var ex = s && s.exercises && s.exercises[i];
      if (ex && plateau(ex.n) && !card.querySelector(".deload-flag")) {
        var f = document.createElement("div");
        f.className = "tiny deload-flag";
        f.style.cssText = "margin-top:6px;color:#ff6b3d";
        f.textContent = "3 sessions flat — deload this lift (−2 clicks)";
        card.insertBefore(f, card.querySelector(".set-grid"));
      }
      if (!card.querySelector(".rir-row")) {
        var rirs = load("il_rir", {});
        var cur = rirs[ex ? ex.n : ""];
        var row = document.createElement("div");
        row.className = "rir-row";
        row.innerHTML = '<span class="tiny">RIR</span>' +
          [0,1,2,3].map(function (n) {
            return '<button type="button" class="rir' + (cur === n ? " on" : "") + '" data-act="set-rir" data-i="' + i + '" data-v="' + n + '">' + n + "</button>";
          }).join("");
        card.appendChild(row);
      }
      Array.prototype.slice.call(card.querySelectorAll(".set-grid")).forEach(function (grid) {
        if (grid.classList.contains("tiny")) return;
        var inp = grid.querySelector("[data-act='set-w']");
        if (!inp || grid.querySelector("[data-act='step-w']")) return;
        var wrap = document.createElement("div");
        wrap.className = "step-wrap";
        wrap.innerHTML = '<button type="button" class="step" data-act="step-w" data-dir="-1" data-i="' + inp.getAttribute("data-i") + '" data-si="' + inp.getAttribute("data-si") + '">−</button>';
        inp.parentNode.insertBefore(wrap, inp);
        wrap.appendChild(inp);
        var plus = document.createElement("button");
        plus.type = "button"; plus.className = "step"; plus.setAttribute("data-act", "step-w"); plus.setAttribute("data-dir", "1");
        plus.setAttribute("data-i", inp.getAttribute("data-i")); plus.setAttribute("data-si", inp.getAttribute("data-si"));
        plus.textContent = "+";
        wrap.appendChild(plus);
      });
    });
    var chip = view.querySelector(".rest-chip");
    if (chip && !chip.querySelector("[data-act='rest-adj']")) {
      var adj = document.createElement("span");
      adj.className = "rest-adj";
      adj.innerHTML = '<button type="button" data-act="rest-adj" data-d="-15">−15</button><button type="button" data-act="rest-adj" data-d="15">+15</button>';
      chip.appendChild(adj);
    }
  }
  function paintHomeSets() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("#setCap")) return;
    var map = muscleSets();
    var keys = Object.keys(map);
    if (!keys.length) return;
    var box = document.createElement("div");
    box.id = "setCap";
    box.className = "card";
    box.innerHTML = '<div class="tiny">Weekly sets</div>' + keys.map(function (m) {
      var n = map[m], cap = 20, pct = Math.min(100, Math.round(n / cap * 100));
      var warn = n > cap;
      return '<div class="vol-row"><div class="row space"><div>' + m + '</div><div class="tiny" style="color:' + (warn ? "#ff6b3d" : "") + '">' + n + " / " + cap + '</div></div><div class="bar"><i style="width:' + pct + "%;background:" + (warn ? "#ff6b3d" : "#FFD400") + '"></i></div></div>';
    }).join("");
    var feed = view.querySelector("#homeFeed");
    if (feed) feed.appendChild(box);
    else view.appendChild(box);
  }
  function paintPr() {
    var view = document.getElementById("view-progress");
    if (!view || !view.classList.contains("active")) return;
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.classList.contains("chart-card") || card.querySelector(".e1rm")) return;
      var nameEl = card.querySelector(".ex-name");
      if (!nameEl) return;
      var name = nameEl.textContent.trim();
      var best = 0, reps = 0;
      workouts().forEach(function (w) {
        (w.exercises || []).forEach(function (e) {
          if (e.n !== name) return;
          (e.sets || []).forEach(function (s) {
            if (!s.done) return;
            var est = epley(s.w, s.r);
            if (est > best) { best = est; reps = Number(s.r) || 0; }
          });
        });
      });
      if (!best) return;
      var line = document.createElement("div");
      line.className = "tiny e1rm";
      line.style.marginTop = "6px";
      line.textContent = "e1RM " + best.toFixed(1) + " kg (Epley)";
      card.appendChild(line);
    });
  }
  function openSheet(i) {
    var s = sess(); if (!s || !s.exercises[i]) return;
    var name = s.exercises[i].n;
    var hit = lastEx(name);
    var html = '<div class="grab"></div><div class="ex-name">' + name + "</div>";
    if (!hit) html += '<div class="tiny" style="margin-top:8px">No previous session.</div>';
    else {
      html += '<div class="tiny" style="margin:8px 0">Last ' + new Date(hit.w.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " · " + (hit.w.name || "") + "</div>";
      (hit.e.sets || []).forEach(function (st, n) {
        html += '<div class="row space" style="margin-top:6px"><div class="tiny">' + (n === 0 ? "W" : n) + '</div><div>' + (st.w || "—") + " kg × " + (st.r || "—") + (st.done ? "" : "") + "</div></div>";
      });
    }
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  document.addEventListener("click", function (e) {
    var step = e.target.closest("[data-act='step-w']");
    if (step) {
      e.preventDefault(); e.stopPropagation();
      var s = sess(); if (!s) return;
      var i = Number(step.getAttribute("data-i")), si = Number(step.getAttribute("data-si"));
      if (!s.exercises[i] || !s.exercises[i].sets[si]) return;
      var next = snap(s.exercises[i].sets[si].w || 0, Number(step.getAttribute("data-dir")));
      s.exercises[i].sets[si].w = String(next);
      saveSess(s);
      var inp = document.querySelector('[data-act="set-w"][data-i="' + i + '"][data-si="' + si + '"]');
      if (inp) inp.value = String(next);
      return;
    }
    var rir = e.target.closest("[data-act='set-rir']");
    if (rir) {
      e.preventDefault(); e.stopPropagation();
      var s = sess(); if (!s) return;
      var i = Number(rir.getAttribute("data-i"));
      var v = Number(rir.getAttribute("data-v"));
      var name = s.exercises[i] && s.exercises[i].n;
      if (!name) return;
      var map = load("il_rir", {});
      map[name] = v; save("il_rir", map);
      var row = rir.parentNode;
      Array.prototype.slice.call(row.querySelectorAll(".rir")).forEach(function (b) { b.classList.toggle("on", Number(b.getAttribute("data-v")) === v); });
      return;
    }
    if (e.target.closest("[data-act='lift-sheet']")) {
      e.preventDefault(); e.stopPropagation();
      openSheet(Number(e.target.closest("[data-act='lift-sheet']").getAttribute("data-i")));
      return;
    }
    var adj = e.target.closest("[data-act='rest-adj']");
    if (adj) {
      e.preventDefault(); e.stopPropagation();
      var d = Number(adj.getAttribute("data-d"));
      var chip = document.querySelector(".rest-chip .rest-num");
      var cur = 90;
      if (chip) {
        var p = (chip.textContent || "1:30").split(":");
        cur = Number(p[0]) * 60 + Number(p[1] || 0);
      }
      cur = Math.max(15, cur + d);
      if (chip) {
        var m = Math.floor(cur / 60), sec = String(cur % 60);
        if (sec.length < 2) sec = "0" + sec;
        chip.textContent = m + ":" + sec;
      }
      return;
    }
    if (e.target.id === "modal") e.target.classList.remove("show");
  }, true);
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      paintTrain();
      paintHomeSets();
      paintPr();
    }, 60);
  }
  function boot() {
    applyRirPrefill();
    ["view-workout", "view-home", "view-progress"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
