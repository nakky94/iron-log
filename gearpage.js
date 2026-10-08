(function () {
  var page = 0, SIZE = 16;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function capWord(s) {
    return String(s || "").replace(/dumbbell/ig, "Dumbbell").replace(/machine/ig, "Machine");
  }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || "").replace(/\s+/g, " ").trim();
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = [
    "#view-library input[type='search'],#view-library #libSearch,#view-library [placeholder*='earch']{display:none!important}",
    "#view-library .ex-hide{display:none!important}",
    "#gearGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    "#gearGrid .card{margin:0!important;padding:10px 10px!important;min-height:64px}",
    "#gearGrid .ex-name{font-size:14px;line-height:1.2}",
    "#gearGrid .tiny{font-size:11px}",
    "#gearAdd,#gearPager{display:flex;gap:8px;align-items:center;margin:8px 0}",
    "#gearAdd button,#gearPager button,.fav-ex{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}",
    ".fav-ex{width:32px;padding:0}"
  ].join("");
  function junk(el) {
    var t = (el.textContent || "").replace(/\s+/g, " ").trim();
    return t && t.length < 80 && /recently used|custom exercise|^search$/i.test(t);
  }
  function fixType(card) {
    card.querySelectorAll(".tiny, span, div").forEach(function (el) {
      if (el.children.length) return;
      if (/dumbbell|machine/i.test(el.textContent) && el.textContent.length < 40) el.textContent = capWord(el.textContent);
    });
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    view.querySelectorAll("input").forEach(function (el) {
      if (el.type === "search" || /search/i.test(el.getAttribute("placeholder") || "")) el.classList.add("ex-hide");
    });
    view.querySelectorAll("button, .tiny, div").forEach(function (el) {
      if (el.closest("#gearLocker,#gearGrid") || el.id === "gearPager" || el.id === "gearAdd") return;
      if (junk(el)) el.classList.add("ex-hide");
    });
    var add = document.getElementById("gearAdd");
    if (!add) { add = document.createElement("div"); add.id = "gearAdd"; view.insertBefore(add, view.firstChild); }
    if (!add.querySelector("#addEx")) add.innerHTML = "<button type='button' id='addEx'>Add exercise</button>";
    var grid = document.getElementById("gearGrid");
    if (!grid) { grid = document.createElement("div"); grid.id = "gearGrid"; add.insertAdjacentElement("afterend", grid); }
    var cards = Array.prototype.slice.call(view.querySelectorAll(".card")).filter(function (c) {
      return !c.closest("#gearLocker") && c.querySelector(".ex-name") && !/custom exercise/i.test(nameOf(c));
    });
    var fav = favs();
    cards.sort(function (a, b) {
      return (fav.indexOf(nameOf(a)) >= 0 ? 0 : 1) - (fav.indexOf(nameOf(b)) >= 0 ? 0 : 1);
    });
    cards.forEach(function (c) { grid.appendChild(c); fixType(c); });
    var pages = Math.max(1, Math.ceil(cards.length / SIZE));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c, i) {
      c.classList.toggle("ex-hide", i < page * SIZE || i >= (page + 1) * SIZE);
      if (c.querySelector(".fav-ex")) {
        c.querySelector(".fav-ex").textContent = fav.indexOf(nameOf(c)) >= 0 ? "\u2605" : "\u2606";
        return;
      }
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
    var t = capWord(prompt("Dumbbell or Machine", "Dumbbell") || "Dumbbell");
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
    if (e.target.id === "addEx") { e.preventDefault(); e.stopPropagation(); addExercise(); return; }
    if (e.target.id === "gearPrev") { page = Math.max(0, page - 1); paint(); }
    if (e.target.id === "gearNext") { page += 1; paint(); }
  }, true);
  var view = document.getElementById("view-library");
  if (view) new MutationObserver(function () { setTimeout(paint, 40); }).observe(view, { childList: true, subtree: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 80); }); });
  paint();
})();
