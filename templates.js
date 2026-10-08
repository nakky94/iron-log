(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  var css = document.getElementById("tplStyle");
  if (!css) { css = document.createElement("style"); css.id = "tplStyle"; document.head.appendChild(css); }
  css.textContent = "#tplEdit{position:fixed;inset:0;background:#090909;z-index:70;display:none;overflow:auto;padding:16px 16px 40px}#tplEdit.on{display:block}#tplEdit input,#tplEdit .row{width:100%}#tplEdit .ex{display:flex;align-items:center;gap:8px;background:#141414;border:1px solid #222;border-radius:14px;padding:10px;margin-top:8px}#tplEdit .ex b{flex:1}#tplEdit button{min-height:40px;border-radius:12px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-weight:650}#tplEdit .acts{display:flex;gap:8px;margin-top:14px}#tplEdit .acts button{flex:1}";
  var root = document.getElementById("tplEdit");
  if (!root) { root = document.createElement("div"); root.id = "tplEdit"; document.body.appendChild(root); }
  function names() {
    var seen = {}, out = [];
    routines().forEach(function (r) { (r.exercises || []).forEach(function (e) { if (e.n && !seen[e.n]) { seen[e.n] = 1; out.push(e); } }); });
    load("il_workouts", []).forEach(function (w) { (w.exercises || []).forEach(function (e) { if (e.n && !seen[e.n]) { seen[e.n] = 1; out.push({ eid: e.eid, n: e.n, t: e.t, m: e.m }); } }); });
    return out;
  }
  function open(id) {
    var list = routines();
    var r = list.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    if (!r.exercises) r.exercises = [];
    var opts = names().map(function (e) { return "<option value='" + esc(e.n) + "'>" + esc(e.n) + "</option>"; }).join("");
    var html = "<button type='button' id='tplBack'>Back</button><input id='tplName' value='" + esc(r.name) + "' style='margin-top:12px' />";
    r.exercises.forEach(function (e, i) {
      html += "<div class='ex'><b>" + esc(e.n) + "</b><button type='button' data-up='" + i + "'>Up</button><button type='button' data-down='" + i + "'>Down</button><button type='button' data-del='" + i + "'>Remove</button></div>";
    });
    html += "<div class='acts'><select id='tplAdd'>" + opts + "</select><button type='button' id='tplAddBtn'>Add</button></div>";
    html += "<div class='acts'><button type='button' id='tplSave'>Save template</button><button type='button' id='tplDelete'>Delete</button></div>";
    root.innerHTML = html;
    root.classList.add("on");
    root.onclick = function (e) {
      var t = e.target;
      if (t.id === "tplBack") { root.classList.remove("on"); return; }
      if (t.id === "tplDelete") {
        if (!confirm("Delete this template?")) return;
        save("il_routines", routines().filter(function (x) { return x.id !== id; }));
        root.classList.remove("on");
        return;
      }
      if (t.id === "tplSave") {
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        if (cur) cur.name = document.getElementById("tplName").value || cur.name;
        save("il_routines", all);
        root.classList.remove("on");
        return;
      }
      if (t.id === "tplAddBtn") {
        var pick = document.getElementById("tplAdd").value;
        var src = names().filter(function (x) { return x.n === pick; })[0] || { n: pick, t: "", m: "" };
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
  function buttons() {
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      if (card.querySelector(".tpl-edit")) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tpl-edit";
      b.textContent = "Edit";
      b.style.cssText = "margin-top:8px;min-height:36px;border-radius:10px;border:1px solid #2a2a2e;background:#1c1c1c";
      b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); open(card.getAttribute("data-hs-tpl")); };
      card.appendChild(b);
    });
  }
  buttons();
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(buttons).observe(home, { childList: true, subtree: true });
})();
