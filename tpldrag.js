(function () {
  var drag = null;
  document.addEventListener("click", function (e) {
    var edit = e.target.closest && e.target.closest(".tpl-edit");
    if (!edit) return;
    var card = edit.closest("[data-hs-tpl]");
    var root = document.getElementById("tplEdit");
    if (card && root) root.dataset.id = card.getAttribute("data-hs-tpl");
  }, true);
  document.addEventListener("pointerdown", function (e) {
    var row = e.target.closest && e.target.closest("#tplEdit .ex");
    if (!row || e.target.closest("button")) return;
    drag = row; row.style.opacity = ".45";
  }, true);
  document.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll("#tplEdit .ex"));
    var over = rows.filter(function (r) { return r !== drag; }).find(function (r) {
      var b = r.getBoundingClientRect();
      return e.clientY < b.top + b.height / 2;
    });
    if (over) over.parentNode.insertBefore(drag, over);
  });
  document.addEventListener("pointerup", function () {
    if (!drag) return;
    drag.style.opacity = "";
    var root = document.getElementById("tplEdit");
    var id = root && root.dataset.id;
    drag = null;
    if (!id) return;
    try {
      var all = JSON.parse(localStorage.getItem("il_routines") || "[]");
      var cur = all.filter(function (r) { return r.id === id; })[0];
      if (!cur) return;
      var names = Array.prototype.map.call(document.querySelectorAll("#tplEdit .ex b"), function (b) { return b.textContent; });
      cur.exercises.sort(function (a, b) { return names.indexOf(a.n) - names.indexOf(b.n); });
      localStorage.setItem("il_routines", JSON.stringify(all));
    } catch (err) {}
  });
})();
