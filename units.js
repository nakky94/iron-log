(function () {
  var KG_LB = 2.2046226218;
  function unit() {
    try {
      var u = JSON.parse(localStorage.getItem("il_unit") || "\"kg\"");
      return u === "lb" ? "lb" : "kg";
    } catch (e) { return "kg"; }
  }
  function setUnit(u) {
    localStorage.setItem("il_unit", JSON.stringify(u === "lb" ? "lb" : "kg"));
    paintCtrl();
    applyAll();
  }
  function toDisp(kg) {
    var n = Number(kg);
    if (!n && n !== 0) return kg;
    if (unit() === "kg") return String(n);
    var lb = n * KG_LB;
    return String(Math.round(lb * 10) / 10);
  }
  function toKg(val) {
    var n = Number(val);
    if (!n && n !== 0) return val;
    if (unit() === "kg") return n;
    return Math.round((n / KG_LB) * 100) / 100;
  }
  window.gymUnit = { get: unit, toDisp: toDisp, toKg: toKg, label: function () { return unit(); } };
  function styles() {
    if (document.getElementById("unitStyle")) return;
    var s = document.createElement("style");
    s.id = "unitStyle";
    s.textContent =
      "#unitPick{margin-left:auto;position:relative;z-index:25}" +
      "#unitPick > button{min-height:32px;padding:6px 10px;border-radius:10px;background:#1c1c1c;font-weight:800;font-size:13px}" +
      "#unitMenu{display:none;position:absolute;right:0;top:36px;background:#161616;border:1px solid #2a2a2a;border-radius:12px;min-width:88px;overflow:hidden}" +
      "#unitMenu.on{display:block}" +
      "#unitMenu button{display:block;width:100%;text-align:left;padding:10px 12px;font-weight:700}" +
      "#unitMenu button.on{background:#FFD400;color:#111}" +
      "#unitBtn{display:none!important}";
    document.head.appendChild(s);
  }
  function paintCtrl() {
    styles();
    var head = document.querySelector("header.top");
    if (!head) return;
    var wrap = document.getElementById("unitPick");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "unitPick";
      head.appendChild(wrap);
    }
    wrap.innerHTML =
      '<button type="button" id="unitToggle">' + unit() + " \u25be</button>" +
      '<div id="unitMenu">' +
      '<button type="button" data-unit="kg" class="' + (unit() === "kg" ? "on" : "") + '">kg</button>' +
      '<button type="button" data-unit="lb" class="' + (unit() === "lb" ? "on" : "") + '">lb</button>' +
      "</div>";
  }
  function swapText(root) {
    if (!root) return;
    var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    var lab = unit();
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (!t || t.indexOf("kg") === -1 && t.indexOf("lb") === -1) return;
      if (n.parentNode && (n.parentNode.tagName === "SCRIPT" || n.parentNode.tagName === "STYLE")) return;
      if (lab === "lb") {
        t = t.replace(/(\d+(?:\.\d+)?)\s*kg/gi, function (_, num) { return toDisp(num) + " lb"; });
        t = t.replace(/\bkg\b/g, "lb");
      } else {
        t = t.replace(/(\d+(?:\.\d+)?)\s*lb\b/gi, function (_, num) {
          return (Math.round(Number(num) / KG_LB * 100) / 100) + " kg";
        });
        t = t.replace(/\blb\b/g, "kg");
      }
      n.nodeValue = t;
    });
  }
  function paintInputs() {
    Array.prototype.slice.call(document.querySelectorAll("[data-act='set-w'], #dockKg, [data-edit-w]")).forEach(function (inp) {
      if (document.activeElement === inp) return;
      var raw = inp.getAttribute("data-kg");
      if (raw == null) {
        raw = inp.value;
        inp.setAttribute("data-kg", raw);
      }
      var shown = unit() === "lb" ? toDisp(raw) : raw;
      if (inp.value !== String(shown) && raw !== "") inp.value = shown === "0" ? "" : shown;
    });
  }
  function applyAll() {
    ["view-home", "view-workout", "view-history", "view-progress", "view-library", "sheet"].forEach(function (id) {
      swapText(document.getElementById(id));
    });
    paintInputs();
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "unitToggle") {
      var m = document.getElementById("unitMenu");
      if (m) m.classList.toggle("on");
      return;
    }
    var pick = e.target.closest("#unitMenu [data-unit]");
    if (pick) {
      setUnit(pick.getAttribute("data-unit"));
      var m = document.getElementById("unitMenu");
      if (m) m.classList.remove("on");
      var on = document.querySelector(".nav button.active");
      if (on) on.click();
      return;
    }
    if (!e.target.closest("#unitPick")) {
      var m2 = document.getElementById("unitMenu");
      if (m2) m2.classList.remove("on");
    }
  }, true);
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el || !el.matches) return;
    if (!el.matches("[data-act='set-w'], #dockKg, [data-edit-w]")) return;
    var kg = toKg(el.value);
    el.setAttribute("data-kg", kg);
    if (unit() === "lb") {
      var i = el.getAttribute("data-i"), si = el.getAttribute("data-si");
      try {
        var s = JSON.parse(localStorage.getItem("il_session") || "null");
        if (s && s.exercises && s.exercises[i] && s.exercises[i].sets[si]) {
          s.exercises[i].sets[si].w = kg;
          localStorage.setItem("il_session", JSON.stringify(s));
        }
      } catch (err) {}
    }
  }, true);
  paintCtrl();
  setInterval(function () {
    paintCtrl();
    applyAll();
  }, 800);
})();
