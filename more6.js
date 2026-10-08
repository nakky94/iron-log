(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  var css = document.getElementById("more6Css");
  if (!css) { css = document.createElement("style"); css.id = "more6Css"; document.head.appendChild(css); }
  css.textContent = ".tpl-note,.sort-tpl,.dup-lift,.hist-copy,#showHiddenLogs{min-height:28px;padding:0 8px;border:0;background:transparent;color:#8d8d92;font-size:12px}.tpl-note-line{color:#8d8d92;font-size:12px;margin-top:2px}";
  function paint() {
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      var id = card.getAttribute("data-hs-tpl");
      var r = routines().filter(function (x) { return x.id === id; })[0];
      var line = card.querySelector(".tpl-note-line");
      if (!line) { line = document.createElement("div"); line.className = "tpl-note-line"; (card.querySelector(".tpl-body") || card).appendChild(line); }
      line.textContent = r && r.note || "";
      if (card.querySelector(".tpl-note")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "tpl-note"; b.textContent = "Note";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        if (!cur) return;
        var text = prompt("Template note", cur.note || "");
        if (text == null) return;
        cur.note = text; save("il_routines", all); line.textContent = text;
      });
      card.appendChild(b);
    });
    var train = document.getElementById("view-workout");
    if (train && !train.querySelector(".sort-tpl")) {
      var s = document.createElement("button");
      s.type = "button"; s.className = "sort-tpl"; s.textContent = "Template order";
      s.addEventListener("click", function () {
        var session = load("il_session", null);
        if (!session) return;
        var tpl = routines().filter(function (r) { return r.name === session.name; })[0];
        if (!tpl) return;
        var order = (tpl.exercises || []).map(function (e) { return e.n; });
        session.exercises.sort(function (a, b) { return order.indexOf(a.n) - order.indexOf(b.n); });
        save("il_session", session);
        var cards = Array.prototype.slice.call(train.querySelectorAll(".card"));
        cards.sort(function (a, b) {
          var an = ((a.querySelector(".ex-name") || {}).textContent || "").trim();
          var bn = ((b.querySelector(".ex-name") || {}).textContent || "").trim();
          return order.indexOf(an) - order.indexOf(bn);
        });
        cards.forEach(function (c) { train.appendChild(c); });
      });
      train.insertBefore(s, train.firstChild);
    }
    document.querySelectorAll("#view-workout .card").forEach(function (card) {
      if (card.querySelector(".dup-lift")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "dup-lift"; b.textContent = "Duplicate";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var copy = card.cloneNode(true);
        card.insertAdjacentElement("afterend", copy);
      });
      card.appendChild(b);
    });
    var fails = load("il_fails", {});
    document.querySelectorAll("#view-workout .set-fail.on").forEach(function (b, i) {
      var name = ((b.closest(".card").querySelector(".ex-name") || {}).textContent || "").trim();
      fails[name + ":" + i] = 1;
    });
    save("il_fails", fails);
    document.querySelectorAll("#view-workout .set-fail").forEach(function (b, i) {
      var name = ((b.closest(".card").querySelector(".ex-name") || {}).textContent || "").trim();
      if (fails[name + ":" + i]) b.classList.add("on");
    });
    document.querySelectorAll("#histList .h-card").forEach(function (card) {
      if (card.querySelector(".hist-copy")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "hist-copy"; b.textContent = "Text";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var text = (card.innerText || "").replace(/Hide|Repeat|Text/g, "").trim();
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        else prompt("Copy", text);
      });
      card.appendChild(b);
    });
    var log = document.getElementById("view-history");
    if (log && !document.getElementById("showHiddenLogs")) {
      var b = document.createElement("button");
      b.id = "showHiddenLogs"; b.type = "button"; b.textContent = "Show hidden";
      log.insertBefore(b, log.firstChild);
    }
    var timer = document.getElementById("sessionTimer");
    if (timer && /Rest/.test(timer.textContent || "") && sessionStorage.getItem("il_rest_lift")) {
      var label = timer.querySelector(".tiny");
      if (label) label.textContent = "Rest \u00b7 " + sessionStorage.getItem("il_rest_lift");
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "showHiddenLogs") {
      save("il_hidden_logs", []);
      document.querySelectorAll(".hidden-log").forEach(function (c) { c.classList.remove("hidden-log"); });
    }
    var tick = e.target.closest && e.target.closest("[data-act='toggle-set']");
    if (tick) {
      var name = ((tick.closest(".card").querySelector(".ex-name") || {}).textContent || "").trim();
      sessionStorage.setItem("il_rest_lift", name);
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 160); }); });
  paint();
})();
