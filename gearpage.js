(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || "").replace(/\s+/g, " ").trim();
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = [
    "#view-library{display:flex;flex-direction:column}",
    "#view-library input[type='search'],#view-library #libSearch,#view-library [placeholder*='earch']{display:none!important}",
    "#view-library .tag{display:none!important}",
    "#gearTop{order:-1;margin:8px 0 10px}",
    "#gearTop .chips{display:flex;gap:6px;align-items:center;overflow-x:auto;margin:0 0 8px}",
    "#gearTop #addEx{margin-left:auto;flex:0 0 auto;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#f4f4f5;color:#111;font-weight:700}",
    "#gearGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    "#gearGrid .card{margin:0!important;padding:10px!important;min-height:64px}",
    "#gearGrid .row.space{display:flex;align-items:center;gap:6px}",
    "#gearGrid [data-act='add-ex']{width:auto!important;min-height:36px;padding:6px 8px;flex:0 0 auto}",
    "#gearGrid .fav-ex{width:44px;height:44px;flex:0 0 44px;border-radius:22px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-size:18px}",
    "#gearGrid .fav-ex.on{background:#f4f4f5;color:#111}"
  ].join("");
  function layout() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    var top = document.getElementById("gearTop");
    if (!top) { top = document.createElement("div"); top.id = "gearTop"; view.insertBefore(top, view.firstChild); }
    Array.prototype.slice.call(view.querySelectorAll(".chips")).forEach(function (row) {
      if (row.closest("#gearLocker")) return;
      if (/All|Dumbbell|Machine|muscle|Chest/i.test(row.textContent || "")) top.appendChild(row);
    });
    var typeRow = top.querySelector(".chips");
    if (typeRow && !typeRow.querySelector("#addEx")) {
      var b = document.createElement("button");
      b.id = "addEx"; b.type = "button"; b.textContent = "Add exercise";
      typeRow.appendChild(b);
    }
    view.querySelectorAll(".card").forEach(function (card) {
      if (card.closest("#gearLocker") || !card.querySelector(".ex-name")) return;
      if (/recently used|custom exercise/i.test(nameOf(card))) card.style.display = "none";
      var star = card.querySelector(".fav-ex");
      if (!star) {
        star = document.createElement("button");
        star.type = "button"; star.className = "fav-ex";
        var line = card.querySelector(".row.space") || card;
        line.insertBefore(star, line.firstChild);
      }
      var on = favs().indexOf(nameOf(card)) >= 0;
      star.textContent = on ? "\u2605" : "\u2606";
      star.classList.toggle("on", on);
    });
  }
  document.addEventListener("click", function (e) {
    var star = e.target.closest && e.target.closest("#view-library .fav-ex");
    if (star && !star.closest("#gearLocker")) {
      e.preventDefault(); e.stopPropagation();
      var n = nameOf(star.closest(".card"));
      var list = favs();
      var at = list.indexOf(n);
      if (at >= 0) list.splice(at, 1); else list.unshift(n);
      save("il_fav_ex", list);
      star.textContent = at >= 0 ? "\u2606" : "\u2605";
      star.classList.toggle("on", at < 0);
      return;
    }
    if (e.target.id === "addEx") {
      e.preventDefault(); e.stopPropagation();
      var name = prompt("Exercise name");
      if (!name) return;
      var raw = prompt("Dumbbell or Machine", "Dumbbell") || "Dumbbell";
      var t = /^machine/i.test(raw) ? "Machine" : "Dumbbell";
      var view = document.getElementById("view-library");
      var card = document.createElement("div");
      card.className = "card";
      card.innerHTML = "<div class='row space'><button type='button' class='fav-ex'>\u2606</button><div class='grow'><div class='ex-name'></div><div class='tiny'></div></div><button class='btn sm' type='button' data-act='add-ex'>Add</button></div>";
      card.querySelector(".ex-name").textContent = name;
      card.querySelector(".tiny").textContent = t;
      view.appendChild(card);
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(layout, 80); });
  });
  layout();
})();
