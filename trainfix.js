(function () {
  function load(k, fb) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; }
  }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  var hide = document.getElementById("trainHide");
  if (!hide) {
    hide = document.createElement("style");
    hide.id = "trainHide";
    hide.textContent = "#view-workout > *{display:none!important}#trainDock,#continueBox,#restBar{display:none!important}";
    document.head.appendChild(hide);
  }
  function session() {
    var s = load("il_session", null);
    if (!s) s = { id: uid(), name: "Workout", ts: Date.now(), exercises: [], notes: "" };
    if (!s.exercises) s.exercises = [];
    return s;
  }
  function saveSession(s) { save("il_session", s); }
  var host = document.getElementById("view-workout");
  if (!host || host.shadowRoot) {
    if (host && host.shadowRoot) host._paint && host._paint();
  }
  if (!host) return;
  var root = host.shadowRoot || host.attachShadow({ mode: "open" });
  if (root.childNodes.length) return;
  var style = document.createElement("style");
  style.textContent = ":host{display:block;padding:12px 16px 96px;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif}h1,input#nm{font-size:20px;font-weight:700;margin:0 0 12px;background:transparent;border:0;color:#f4f4f5;width:100%;padding:0}.card{background:#141414;border:1px solid #1e1e1e;border-radius:16px;padding:12px;margin:0 0 10px}.name{font-size:16px;font-weight:700}.sub{color:#8d8d8d;font-size:12px;margin-top:2px}.row{display:grid;grid-template-columns:22px 1fr 64px 44px;gap:8px;align-items:center;margin-top:8px}input{width:100%;height:44px;text-align:center;font-size:17px;font-weight:700;background:#0a0a0a;color:#f4f4f5;border:1px solid #222;border-radius:12px}button{font:inherit;color:inherit;cursor:pointer}.tick{width:44px;height:44px;border-radius:12px;border:1px solid #333;background:#1c1c1c;font-weight:800}.tick.on{background:#f4f4f5;color:#111;border-color:#f4f4f5}.add{background:none;border:0;color:#8d8d8d;padding:8px 0;font-weight:600}.x{float:right;background:none;border:0;color:#8d8d8d;font-size:16px}.save{width:100%;min-height:48px;border-radius:14px;border:1px solid #2a2a2e;background:#1c1c1c;font-weight:700;margin-top:8px}.empty{color:#8d8d8d;padding:8px 0 16px}";
  var wrap = document.createElement("div");
  root.appendChild(style);
  root.appendChild(wrap);
  function paint() {
    var s = session();
    var html = '<input id="nm" value="' + esc(s.name || "Workout") + '" />';
    if (!s.exercises.length) html += '<div class="empty">No lifts yet. Add them from Gear.</div><button class="save" type="button" id="goGear">Add from Gear</button>';
    s.exercises.forEach(function (ex, i) {
      html += '<div class="card"><button class="x" type="button" data-rm="' + i + '">\u00d7</button><div class="name">' + esc(ex.n) + '</div><div class="sub">' + esc(ex.t || "") + '</div>';
      (ex.sets || []).forEach(function (set, si) {
        html += '<div class="row"><div>' + (si + 1) + '</div><input inputmode="decimal" data-w="' + i + ':' + si + '" value="' + esc(set.w || "") + '" /><input inputmode="numeric" data-r="' + i + ':' + si + '" value="' + esc(set.r || "") + '" /><button class="tick' + (set.done ? " on" : "") + '" type="button" data-tick="' + i + ':' + si + '">' + (set.done ? "\u2713" : "") + '</button></div>';
      });
      html += '<button class="add" type="button" data-add="' + i + '">+ Set</button></div>';
    });
    if (s.exercises.length) html += '<button class="save" type="button" id="save">Save workout</button>';
    wrap.innerHTML = html;
  }
  host._paint = paint;
  function read() {
    var s = session();
    var nm = root.getElementById("nm");
    if (nm) s.name = nm.value;
    root.querySelectorAll("[data-w]").forEach(function (inp) {
      var p = inp.getAttribute("data-w").split(":");
      if (s.exercises[p[0]] && s.exercises[p[0]].sets[p[1]]) s.exercises[p[0]].sets[p[1]].w = inp.value;
    });
    root.querySelectorAll("[data-r]").forEach(function (inp) {
      var p = inp.getAttribute("data-r").split(":");
      if (s.exercises[p[0]] && s.exercises[p[0]].sets[p[1]]) s.exercises[p[0]].sets[p[1]].r = inp.value;
    });
    saveSession(s);
    return s;
  }
  root.addEventListener("input", function () { read(); });
  root.addEventListener("click", function (e) {
    var t = e.target;
    if (t.id === "goGear") {
      var b = document.querySelector('.nav button[data-view="library"]');
      if (b) b.click();
      return;
    }
    if (t.id === "save") {
      var s = read();
      if (!s.exercises.length) return;
      s.ts = Date.now();
      s.finished = true;
      var list = load("il_workouts", []);
      list.unshift(JSON.parse(JSON.stringify(s)));
      save("il_workouts", list);
      localStorage.removeItem("il_session");
      localStorage.removeItem("il_clock");
      paint();
      var hist = document.querySelector('.nav button[data-view="history"]');
      if (hist) hist.click();
      return;
    }
    if (t.getAttribute("data-add") != null) {
      var s2 = read();
      var i = Number(t.getAttribute("data-add"));
      var prev = (s2.exercises[i].sets || []).slice().reverse().filter(function (x) { return x.w || x.r; })[0] || {};
      s2.exercises[i].sets.push({ id: uid(), w: prev.w || "", r: prev.r || "", done: false });
      saveSession(s2);
      paint();
      return;
    }
    if (t.getAttribute("data-rm") != null) {
      var s3 = read();
      s3.exercises.splice(Number(t.getAttribute("data-rm")), 1);
      saveSession(s3);
      paint();
      return;
    }
    if (t.getAttribute("data-tick")) {
      var s4 = read();
      var p = t.getAttribute("data-tick").split(":");
      var set = s4.exercises[p[0]] && s4.exercises[p[0]].sets[p[1]];
      if (set) set.done = !set.done;
      saveSession(s4);
      paint();
    }
  });
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paint, 40); });
  });
  paint();
  setInterval(function () {
    if (!host.classList.contains("active")) return;
    if (root.activeElement && root.activeElement.tagName === "INPUT") return;
    var s = load("il_session", null);
    var n = s && s.exercises ? s.exercises.length : 0;
    if (n !== wrap.querySelectorAll(".card").length) paint();
  }, 700);
})();
