(function () {
  var page = 0, SIZE = 8;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  function nameOf(card) {
    var n = card.querySelector(".ex-name");
    return ((n && n.textContent) || card.textContent || "").replace(/\s+/g, " ").trim();
  }
  var css = document.getElementById("gearPageCss");
  if (!css) { css = document.createElement("style"); css.id = "gearPageCss"; document.head.appendChild(css); }
  css.textContent = "#view-library .ex-hide{display:none!important}#gearPager{display:flex;gap:8px;align-items:center;margin:8px 0 16px}#gearPager button{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}.fav-ex{width:36px;height:36px;border-radius:18px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-size:16px}";
  function junk(el) {
    var t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 80) return false;
    if (/recently used/i.test(t)) return true;
    if (/custom exercise/i.test(t)) return true;
    return false;
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    view.querySelectorAll("button, .tiny, .card, div, h2, h3").forEach(function (el) {
      if (el.closest("#gearLocker") || el.id === "gearPager") return;
      if (el.querySelector && el.querySelector(".ex-name") && junk(el) === false) return;
      if (junk(el)) el.classList.add("ex-hide");
    });
    var cards = Array.prototype.slice.call(view.querySelectorAll(".card")).filter(function (c) {
      return !c.closest("#gearLocker") && !c.classList.contains("ex-hide") && c.querySelector(".ex-name");
    });
    var fav = favs();
    cards.sort(function (a, b) {
      var af = fav.indexOf(nameOf(a)) >= 0 ? 0 : 1;
      var bf = fav.indexOf(nameOf(b)) >= 0 ? 0 : 1;
      return af - bf;
    });
    cards.forEach(function (c, i) { if (c.parentNode) c.parentNode.appendChild(c); });
    var pages = Math.max(1, Math.ceil(cards.length / SIZE));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c, i) {
      c.classList.toggle("ex-hide", i < page * SIZE || i >= (page + 1) * SIZE);
      if (c.querySelector(".fav-ex")) return;
      var star = document.createElement("button");
      star.type = "button";
      star.className = "fav-ex";
      star.textContent = fav.indexOf(nameOf(c)) >= 0 ? "\u2605" : "\u2606";
      star.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var n = nameOf(c);
        var list = favs();
        var at = list.indexOf(n);
        if (at >= 0) list.splice(at, 1); else list.unshift(n);
        save("il_fav_ex", list);
        paint();
      });
      var row = c.querySelector(".row") || c;
      row.appendChild(star);
    });
    var pager = document.getElementById("gearPager");
    if (!pager) { pager = document.createElement("div"); pager.id = "gearPager"; view.appendChild(pager); }
    pager.innerHTML = "<button type='button' id='gearPrev'>Prev</button><span class='tiny'>" + (page + 1) + " / " + pages + "</span><button type='button' id='gearNext'>Next</button>";
    view.appendChild(pager);
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "gearPrev") { page = Math.max(0, page - 1); paint(); }
    if (e.target.id === "gearNext") { page += 1; paint(); }
  });
  var view = document.getElementById("view-library");
  if (view) new MutationObserver(function () { setTimeout(paint, 40); }).observe(view, { childList: true, subtree: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 80); }); });
  paint();
})();
