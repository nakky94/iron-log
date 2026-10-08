(function () {
  var page = 0, SIZE = 16, favOnly = false;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || "").replace(/\s+/g, " ").trim();
  }
  function toggle(card) {
    var n = nameOf(card);
    if (!n) return;
    var list = favs();
    var at = list.indexOf(n);
    if (at >= 0) list.splice(at, 1); else list.unshift(n);
    save("il_fav_ex", list);
    paint();
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = [
    "#view-library input[type='search'],#view-library #libSearch,#view-library [placeholder*='earch'],#gearAddRow{display:none!important}",
    "#view-library .ex-hide,#gearGrid .tag,#gearGrid .tiny{display:none!important}",
    "#gearTop{margin:8px 0 10px}",
    "#gearTop .chips{display:flex;gap:6px;align-items:center;overflow-x:auto;margin:0 0 8px}",
    "#gearTop .chips #addEx{margin-left:auto;flex:0 0 auto}",
    "#addEx,#favOnly{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}",
    "#addEx{background:#f4f4f5;color:#111;font-weight:700}",
    "#favOnly.on{background:#f4f4f5;color:#111}",
    "#gearGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}",
    "#gearGrid .card{margin:0!important;padding:10px!important;min-height:64px;text-align:left;width:auto!important}",
    "#gearGrid .row.space{display:flex;align-items:center;gap:6px}",
    "#gearGrid .ex-name{font-size:14px;line-height:1.25}",
    "#gearGrid [data-act='add-ex']{width:auto!important;min-height:32px;padding:6px 8px;flex:0 0 auto}",
    "#gearGrid .fav-ex{width:44px;height:44px;flex:0 0 44px;border-radius:22px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-size:18px;z-index:3}",
    "#gearGrid .fav-ex.on{background:#f4f4f5;color:#111}",
    "#gearPager{display:flex;gap:8px;align-items:center;margin:8px 0 16px}",
    "#gearPager button{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}"
  ].join("");
  function real(card) {
    var n = nameOf(card);
    if (!n || n === "Locker" || /^dumbbells?$/i.test(n) || /^machines?$/i.test(n)) return false;
    if (/custom exercise|recently used|suggested from/i.test(n)) return false;
    return true;
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    view.querySelectorAll("button, .tiny, div, h2, h3").forEach(function (el) {
      if (el.closest("#gearLocker,#gearGrid,#gearTop,#gearPager")) return;
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t && t.length < 80 && /recently used|custom exercise|suggested from this locker/i.test(t)) el.classList.add("ex-hide");
    });
    var top = document.getElementById("gearTop");
    if (!top) { top = document.createElement("div"); top.id = "gearTop"; view.insertBefore(top, view.firstChild); }
    var rows = Array.prototype.slice.call(view.querySelectorAll(".chips")).filter(function (row) {
      return /All|Dumbbell|Machine|muscle|Chest/i.test(row.textContent || "") && !row.closest("#gearLocker");
    });
    rows.forEach(function (row) { top.appendChild(row); });
    var typeRow = rows.filter(function (row) { return /Dumbbell/i.test(row.textContent || ""); })[0] || rows[0];
    if (typeRow && !typeRow.querySelector("#addEx")) {
      var b = document.createElement("button");
      b.id = "addEx"; b.type = "button"; b.textContent = "Add exercise";
      typeRow.appendChild(b);
    }
    if (typeRow && !typeRow.querySelector("#favOnly")) {
      var f = document.createElement("button");
      f.id = "favOnly"; f.type = "button"; f.textContent = "Favourites";
      typeRow.insertBefore(f, typeRow.querySelector("#addEx"));
    }
    var favBtn = document.getElementById("favOnly");
    if (favBtn) favBtn.classList.toggle("on", favOnly);
    var grid = document.getElementById("gearGrid");
    if (!grid) { grid = document.createElement("div"); grid.id = "gearGrid"; top.insertAdjacentElement("afterend", grid); }
    var cards = Array.prototype.slice.call(view.querySelectorAll(".card")).filter(real);
    var fav = favs();
    cards.sort(function (a, b) { return (fav.indexOf(nameOf(a)) >= 0 ? 0 : 1) - (fav.indexOf(nameOf(b)) >= 0 ? 0 : 1); });
    var shown = cards.filter(function (c) { return !favOnly || fav.indexOf(nameOf(c)) >= 0; });
    var pages = Math.max(1, Math.ceil(shown.length / SIZE));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c) { c.classList.add("ex-hide"); });
    shown.forEach(function (c, i) {
      grid.appendChild(c);
      c.classList.toggle("ex-hide", i < page * SIZE || i >= (page + 1) * SIZE);
      var star = c.querySelector(".fav-ex");
      if (!star) {
        star = document.createElement("button");
        star.type = "button"; star.className = "fav-ex";
        var line = c.querySelector(".row.space") || c;
        line.insertBefore(star, line.firstChild);
      }
      var on = fav.indexOf(nameOf(c)) >= 0;
      star.textContent = on ? "\u2605" : "\u2606";
      star.classList.toggle("on", on);
    });
    var pager = document.getElementById("gearPager");
    if (!pager) { pager = document.createElement("div"); pager.id = "gearPager"; view.appendChild(pager); }
    pager.innerHTML = "<button type='button' id='gearPrev'>Prev</button><span class='tiny'>" + (page + 1) + " / " + pages + "</span><button type='button' id='gearNext'>Next</button>";
    view.appendChild(pager);
  }
  function addExercise() {
    var n = prompt("Exercise name");
    if (!n) return;
    var raw = prompt("Dumbbell or Machine", "Dumbbell") || "Dumbbell";
    var t = /^machine/i.test(raw) ? "Machine" : "Dumbbell";
    var view = document.getElementById("view-library");
    var card = document.createElement("div");
    card.className = "card";
    card.innerHTML = "<div class='row space'><div class='grow'><div class='ex-name'></div><div class='tiny'></div></div><button class='btn sm' type='button' data-act='add-ex'>Add</button></div>";
    card.querySelector(".ex-name").textContent = n;
    card.querySelector(".tiny").textContent = t;
    view.appendChild(card);
    page = 0; paint();
  }
  document.addEventListener("pointerdown", function (e) {
    var star = e.target.closest && e.target.closest(".fav-ex");
    if (!star || star.closest("#gearLocker")) return;
    e.preventDefault(); e.stopPropagation();
    toggle(star.closest(".card"));
  }, true);
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#gearGrid .fav-ex")) { e.preventDefault(); e.stopPropagation(); return; }
    if (e.target.id === "favOnly") { favOnly = !favOnly; page = 0; paint(); return; }
    if (e.target.id === "addEx") { e.preventDefault(); e.stopPropagation(); addExercise(); return; }
    if (e.target.id === "gearPrev") { page = Math.max(0, page - 1); paint(); }
    if (e.target.id === "gearNext") { page += 1; paint(); }
  }, true);
  var view = document.getElementById("view-library");
  if (view) new MutationObserver(function () { setTimeout(paint, 50); }).observe(view, { childList: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 80); }); });
  paint();
})();
