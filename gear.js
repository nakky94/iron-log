(function () {
  var STOCK = [
    { id: "db", n: "Bowflex dumbbells", t: "dumbbell" },
    { id: "bench", n: "Bench", t: "dumbbell" },
    { id: "press", n: "Chest press machine", t: "machine" },
    { id: "lat", n: "Lat pulldown", t: "machine" },
    { id: "leg", n: "Leg machines", t: "machine" },
    { id: "cable", n: "Cable stack", t: "machine" },
    { id: "calf", n: "Calf raise", t: "machine" }
  ];
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function state() {
    var s = load("il_gear", null);
    if (!s) s = { place: "gym", have: { db: true, press: true, lat: true, leg: true, cable: true, calf: true, bench: true }, fav: ["db"] };
    return s;
  }
  function paint() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    var box = view.querySelector("#gearLocker");
    if (!box) {
      box = document.createElement("div");
      box.id = "gearLocker";
      view.insertBefore(box, view.firstChild);
    }
    var s = state();
    var html = '<div class="card"><div class="ex-name">Locker</div><div class="tiny" style="margin:4px 0 8px">Where you train and what is on the floor.</div>';
    html += '<div class="chips">';
    [["gym","Gym"],["home","Home"]].forEach(function (p) {
      html += '<button class="chip' + (s.place === p[0] ? " on" : "") + '" type="button" data-place="' + p[0] + '">' + p[1] + "</button>";
    });
    html += "</div>";
    STOCK.forEach(function (g) {
      var on = !!s.have[g.id];
      var fav = (s.fav || []).indexOf(g.id) !== -1;
      html += '<div class="row space" style="margin-top:8px"><div class="grow">' + g.n +
        '<div class="tiny">' + g.t + (fav ? " \u00b7 favourite" : "") + '</div></div>' +
        '<button class="text-link" type="button" data-fav-gear="' + g.id + '">' + (fav ? "\u2605" : "\u2606") + '</button>' +
        '<button class="chip' + (on ? " on" : "") + '" type="button" data-have="' + g.id + '">' + (on ? "Here" : "Off") + "</button></div>";
    });
    html += '</div><div class="tiny" style="margin:0 0 8px">Suggested from this locker</div>';
    box.innerHTML = html;
    filterLib(s);
  }
  function filterLib(s) {
    var view = document.getElementById("view-library");
    if (!view) return;
    var allowDb = !!s.have.db || !!s.have.bench;
    var allowMc = Object.keys(s.have).some(function (k) { return k !== "db" && k !== "bench" && s.have[k]; });
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.closest("#gearLocker")) return;
      var tag = ((card.textContent || "") + "").toLowerCase();
      var isDb = tag.indexOf("dumbbell") >= 0;
      var isMc = tag.indexOf("machine") >= 0;
      if (isDb && !allowDb) card.style.display = "none";
      else if (isMc && !allowMc) card.style.display = "none";
      else card.style.display = "";
    });
  }
  document.addEventListener("click", function (e) {
    var s = state();
    var place = e.target.closest("[data-place]");
    if (place) { s.place = place.getAttribute("data-place"); save("il_gear", s); paint(); return; }
    var have = e.target.closest("[data-have]");
    if (have) {
      var id = have.getAttribute("data-have");
      s.have[id] = !s.have[id];
      save("il_gear", s); paint(); return;
    }
    var fav = e.target.closest("[data-fav-gear]");
    if (fav) {
      var gid = fav.getAttribute("data-fav-gear");
      var i = (s.fav || []).indexOf(gid);
      if (i >= 0) s.fav.splice(i, 1); else s.fav.push(gid);
      save("il_gear", s); paint();
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paint, 60); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(paint, 80); });
  else setTimeout(paint, 80);
})();
