(function () {
  var page = 0, SIZE = 16, filter = "all";
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || "").replace(/\s+/g, " ").trim();
  }
  function kind(card) {
    var t = (card.textContent || "").toLowerCase();
    if (t.indexOf("machine") >= 0 && t.indexOf("dumbbell") < 0) return "machine";
    if (t.indexOf("dumbbell") >= 0) return "dumbbell";
    return "other";
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = [
    "#view-library input[type='search'],#view-library #libSearch,#view-library [placeholder*='earch']{display:none!important}",
    "#view-library .ex-hide{display:none!important}",
    "#gearBar{display:flex;gap:6px;align-items:center;margin:8px 0 10px;overflow-x:auto}",
    "#gearBar button{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;white-space:nowrap}",
    "#gearBar button.on{background:#f4f4f5;color:#111}",
    "#gearBar #addEx{margin-left:auto}",
    "#gearGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    "#gearGrid .card{margin:0!important;padding:12px 36px 12px 10px!important;min-height:52px;text-align:left;position:relative}",
    "#gearGrid .ex-name{font-size:14px;line-height:1.25;display:block}",
    "#gearGrid .tiny{display:none!important}",
    "#gearPager{display:flex;gap:8px;align-items:center;margin:8px 0 16px}",
    "#gearPager button,.fav-ex{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}",
    ".fav-ex{position:absolute;top:8px;right:8px;width:32px;padding:0}"
  ].join("");
  function real(card) {
    var n = nameOf(card);
    if (!n || n === "Locker" || /^dumbbell$/i.test(n) || /^machine$/i.test(n)) return false;
    if (/custom exercise|recently used|suggested from/i.test(n)) return false;
    return true;
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    view.querySelectorAll("button, .tiny, div, h2, h3").forEach(function (el) {
      if (el.closest("#gearLocker,#gearGrid,#gearBar,#gearPager")) return;
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t && t.length < 80 && /recently used|custom exercise|suggested from this locker/i.test(t)) el.classList.add("ex-hide");
    });
    var bar = document.getElementById("gearBar");
    if (!bar) { bar = document.createElement("div"); bar.id = "gearBar"; view.insertBefore(bar, view.firstChild); }
    bar.innerHTML = "<button type='button' data-gf='all' class='" + (filter === "all" ? "on" : "") + "'>All</button><button type='button' data-gf='dumbbell' class='" + (filter === "dumbbell" ? "on" : "") + "'>Dumbbell</button><button type='button' data-gf='machine' class='" + (filter === "machine" ? "on" : "") + "'>Machine</button><button type='button' id='addEx'>Add exercise</button>";
    var grid = document.getElementById("gearGrid");
    if (!grid) { grid = document.createElement("div"); grid.id = "gearGrid"; bar.insertAdjacentElement("afterend", grid); }
    var cards = Array.prototype.slice.call(view.querySelectorAll(".card")).filter(real);
    var fav = favs();
    cards.sort(function (a, b) { return (fav.indexOf(nameOf(a)) >= 0 ? 0 : 1) - (fav.indexOf(nameOf(b)) >= 0 ? 0 : 1); });
    var shown = cards.filter(function (c) { return filter === "all" || kind(c) === filter; });
    cards.forEach(function (c) { grid.appendChild(c); });
    var pages = Math.max(1, Math.ceil(shown.length / SIZE));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c) { c.classList.add("ex-hide"); });
    shown.forEach(function (c, i) {
      c.classList.toggle("ex-hide", i < page * SIZE || i >= (page + 1) * SIZE);
      if (c.querySelector(".fav-ex")) return;
      var star = document.createElement("button");
      star.type = "button"; star.className = "fav-ex";
      star.textContent = fav.indexOf(nameOf(c)) >= 0 ? "\u2605" : "\u2606";
      star.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var n = nameOf(c), list = favs(), at = list.indexOf(n);
        if (at >= 0) list.splice(at, 1); else list.unshift(n);
        save("il_fav_ex", list); paint();
      });
      c.appendChild(star);
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
    var card = document.createElement("button");
    card.className = "card"; card.type = "button";
    card.innerHTML = "<div class='ex-name'></div><div class='tiny'></div>";
    card.querySelector(".ex-name").textContent = n;
    card.querySelector(".tiny").textContent = t;
    view.appendChild(card);
    page = 0; paint();
  }
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-gf]");
    if (f) { filter = f.getAttribute("data-gf"); page = 0; paint(); return; }
    if (e.target.id === "addEx") { e.preventDefault(); e.stopPropagation(); addExercise(); return; }
    if (e.target.id === "gearPrev") { page = Math.max(0, page - 1); paint(); }
    if (e.target.id === "gearNext") { page += 1; paint(); }
  }, true);
  var view = document.getElementById("view-library");
  if (view) new MutationObserver(function () { setTimeout(paint, 40); }).observe(view, { childList: true, subtree: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 80); }); });
  paint();
})();
