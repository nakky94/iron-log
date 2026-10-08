(function () {
  var page = 0, SIZE = 8;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function custom() { return load("il_custom_ex", []); }
  function capType(t) {
    var s = String(t || "").toLowerCase();
    if (s.indexOf("dumbbell") >= 0) return "Dumbbell";
    if (s.indexOf("machine") >= 0) return "Machine";
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || "").replace(/\s+/g, " ").trim();
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = "#view-library input[type='search'],#view-library #libSearch,#view-library [placeholder*='Search'],#view-library [placeholder*='search']{display:none!important}#view-library .ex-hide{display:none!important}#gearAdd,#gearPager{display:flex;gap:8px;align-items:center;margin:8px 0}#gearAdd button,#gearPager button,.fav-ex{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}.fav-ex{width:36px;padding:0}";
  function junk(el) {
    var t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 80) return false;
    return /recently used|custom exercise|^search$/i.test(t);
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    view.querySelectorAll("input").forEach(function (el) {
      var p = (el.getAttribute("placeholder") || "").toLowerCase();
      if (el.type === "search" || p.indexOf("search") >= 0) el.classList.add("ex-hide");
    });
    view.querySelectorAll("button, .tiny, .card, div").forEach(function (el) {
      if (el.closest("#gearLocker") || el.id === "gearPager" || el.id === "gearAdd") return;
      if (junk(el)) el.classList.add("ex-hide");
    });
    view.querySelectorAll(".tiny").forEach(function (el) {
      if (/dumbbell|machine/i.test(el.textContent) && el.textContent.length < 40) el.textContent = capType(el.textContent);
    });
    var add = document.getElementById("gearAdd");
    if (!add) { add = document.createElement("div"); add.id = "gearAdd"; view.insertBefore(add, view.firstChild); }
    add.innerHTML = "<button type='button' id='addEx'>Add exercise</button>";
    var cards = Array.prototype.slice.call(view.querySelectorAll(".card")).filter(function (c) {
      return !c.closest("#gearLocker") && c.querySelector(".ex-name") && !/custom exercise/i.test(c.textContent || "");
    });
    var fav = favs();
    cards.sort(function (a, b) {
      return (fav.indexOf(nameOf(a)) >= 0 ? 0 : 1) - (fav.indexOf(nameOf(b)) >= 0 ? 0 : 1);
    });
    cards.forEach(function (c) { if (c.parentNode) c.parentNode.appendChild(c); });
    var pages = Math.max(1, Math.ceil(cards.length / SIZE));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c, i) {
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
      (c.querySelector(".row") || c).appendChild(star);
    });
    var pager = document.getElementById("gearPager");
    if (!pager) { pager = document.createElement("div"); pager.id = "gearPager"; view.appendChild(pager); }
    pager.innerHTML = "<button type='button' id='gearPrev'>Prev</button><span class='tiny'>" + (page + 1) + " / " + pages + "</span><button type='button' id='gearNext'>Next</button>";
    view.appendChild(pager);
  }
  function addExercise() {
    var n = prompt("Exercise name");
    if (!n) return;
    var t = prompt("Dumbbell or Machine", "Dumbbell");
    t = capType(t || "Dumbbell");
    var list = custom();
    list.unshift({ n: n, t: t });
    save("il_custom_ex", list);
    var view = document.getElementById("view-library");
    if (!view) return;
    var card = document.createElement("button");
    card.className = "card"; card.type = "button";
    card.innerHTML = "<div class='ex-name'>" + n.replace(/</g, "") + "</div><div class='tiny'>" + t + "</div>";
    card.addEventListener("click", function () {
      var train = document.querySelector(".nav button[data-view='workout']");
      if (train) train.click();
    });
    view.appendChild(card);
    page = 0;
    paint();
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
