(function () {
  if (!document.querySelector('script[src="sessiontimer.js"]')) {
    var s = document.createElement("script");
    s.src = "sessiontimer.js";
    document.body.appendChild(s);
  }
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  var css = document.getElementById("tplStyle");
  if (!css) { css = document.createElement("style"); css.id = "tplStyle"; document.head.appendChild(css); }
  css.textContent = [
    "[data-hs-tpl]{display:flex!important;align-items:center;gap:8px}",
    "[data-hs-tpl] .tpl-body{flex:1;min-width:0;text-align:left}",
    ".tpl-edit{flex:0 0 auto;width:auto!important;min-height:28px!important;padding:0 8px!important;border:0!important;background:transparent!important;color:#8d8d92!important;font-size:13px!important;font-weight:650!important}",
    ".tpl-move{display:flex;flex-direction:column;gap:2px;flex:0 0 auto}",
    ".tpl-up,.tpl-down{width:22px!important;height:16px!important;min-height:16px!important;padding:0!important;border:0!important;background:transparent!important;color:#6e6e73!important;font-size:11px!important;line-height:1!important}",
    "#tplEdit{position:fixed;inset:0;background:#090909;z-index:70;display:none;overflow:auto;padding:16px 16px 40px}",
    "#tplEdit.on{display:block}",
    "#tplEdit .ex{display:flex;align-items:center;gap:8px;background:#141414;border:1px solid #222;border-radius:14px;padding:10px 12px;margin-top:8px}",
    "#tplEdit .ex b{flex:1;font-size:15px}",
    "#tplEdit .ex button,#tplEdit #tplBack{width:auto;min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-size:13px}",
    "#tplEdit .acts{display:flex;gap:8px;margin-top:14px}",
    "#tplEdit .acts button,#tplEdit .acts select{flex:1;min-height:44px;border-radius:12px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}"
  ].join("");
  var root = document.getElementById("tplEdit");
  if (!root) { root = document.createElement("div"); root.id = "tplEdit"; document.body.appendChild(root); }
  function names() {
    var seen = {}, out = [];
    routines().forEach(function (r) { (r.exercises || []).forEach(function (e) { if (e.n && !seen[e.n]) { seen[e.n] = 1; out.push(e); } }); });
    load("il_workouts", []).forEach(function (w) { (w.exercises || []).forEach(function (e) { if (e.n && !seen[e.n]) { seen[e.n] = 1; out.push({ eid: e.eid, n: e.n, t: e.t, m: e.m }); } }); });
    return out;
  }
  function refresh() { if (window.gymPaintHome) window.gymPaintHome(); setTimeout(buttons, 40); }
  function open(id) {
    var r = routines().filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    if (!r.exercises) r.exercises = [];
    var opts = names().map(function (e) { return "<option value='" + esc(e.n) + "'>" + esc(e.n) + "</option>"; }).join("");
    var html = "<button type='button' id='tplBack'>Back</button><input id='tplName' value='" + esc(r.name) + "' style='margin:16px 0 8px' />";
    r.exercises.forEach(function (e, i) {
      html += "<div class='ex'><b>" + esc(e.n) + "</b><button type='button' data-up='" + i + "'>\u2191</button><button type='button' data-down='" + i + "'>\u2193</button><button type='button' data-del='" + i + "'>Remove</button></div>";
    });
    html += "<div class='acts'><select id='tplAdd'>" + opts + "</select><button type='button' id='tplAddBtn'>Add</button></div>";
    html += "<div class='acts'><button type='button' id='tplSave'>Save</button><button type='button' id='tplDelete'>Delete</button></div>";
    root.innerHTML = html;
    root.classList.add("on");
    root.onclick = function (e) {
      var t = e.target;
      if (t.id === "tplBack") { root.classList.remove("on"); refresh(); return; }
      if (t.id === "tplDelete") {
        if (!confirm("Delete this template?")) return;
        save("il_routines", routines().filter(function (x) { return x.id !== id; }));
        root.classList.remove("on");
        refresh();
        return;
      }
      if (t.id === "tplSave") {
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        if (cur) cur.name = document.getElementById("tplName").value || cur.name;
        save("il_routines", all);
        root.classList.remove("on");
        refresh();
        return;
      }
      if (t.id === "tplAddBtn") {
        var pick = document.getElementById("tplAdd").value;
        if (!pick) return;
        var src = names().filter(function (x) { return x.n === pick; })[0] || { n: pick };
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        cur.exercises.push({ eid: src.eid || "", n: src.n, t: src.t || "", m: src.m || "" });
        save("il_routines", all);
        open(id);
        return;
      }
      var i = t.getAttribute("data-del") || t.getAttribute("data-up") || t.getAttribute("data-down");
      if (i == null) return;
      var all = routines();
      var cur = all.filter(function (x) { return x.id === id; })[0];
      i = Number(i);
      if (t.getAttribute("data-del") != null) cur.exercises.splice(i, 1);
      if (t.getAttribute("data-up") != null && i > 0) cur.exercises.splice(i - 1, 0, cur.exercises.splice(i, 1)[0]);
      if (t.getAttribute("data-down") != null && i < cur.exercises.length - 1) cur.exercises.splice(i + 1, 0, cur.exercises.splice(i, 1)[0]);
      save("il_routines", all);
      open(id);
    };
  }
  function move(id, dir) {
    var all = routines();
    var i = all.findIndex(function (x) { return x.id === id; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= all.length) return;
    var tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    save("il_routines", all);
    refresh();
  }
  function create() {
    var name = prompt("Template name");
    if (!name) return;
    var id = "tpl" + Date.now().toString(36);
    var all = routines();
    all.push({ id: id, name: name, exercises: [] });
    save("il_routines", all);
    refresh();
    open(id);
  }
  function buttons() {
    var neu = document.getElementById("hsNewTpl");
    if (neu && !neu.dataset.bound) {
      neu.dataset.bound = "1";
      neu.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); create(); });
    }
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      if (card.querySelector(".tpl-edit")) return;
      var body = document.createElement("div");
      body.className = "tpl-body";
      while (card.firstChild) body.appendChild(card.firstChild);
      card.appendChild(body);
      var id = card.getAttribute("data-hs-tpl");
      var stack = document.createElement("div");
      stack.className = "tpl-move";
      ["\u2191", "\u2193"].forEach(function (label, idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = idx === 0 ? "tpl-up" : "tpl-down";
        b.textContent = label;
        b.setAttribute("aria-label", idx === 0 ? "Move up" : "Move down");
        b.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          move(id, idx === 0 ? -1 : 1);
        });
        stack.appendChild(b);
      });
      card.appendChild(stack);
      var edit = document.createElement("button");
      edit.type = "button"; edit.className = "tpl-edit"; edit.textContent = "Edit";
      edit.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); open(id); });
      card.appendChild(edit);
    });
  }
  buttons();
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(buttons).observe(home, { childList: true, subtree: true });
})();
