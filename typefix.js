(function () {
  function title(s) {
    return String(s || "").replace(/[A-Za-z][A-Za-z']*/g, function (w) {
      if (/^(kg|db|pr|rir|e1rm)$/i.test(w)) return w.toLowerCase() === "kg" ? "kg" : w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
  }
  function fix(view) {
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll(".ex-name, .tag, .chip, [data-tpl-id] .tiny")).forEach(function (el) {
      if (el.children.length) return;
      var t = el.textContent;
      if (!t || /\d/.test(t) && /kg|ago|last|week|set/i.test(t)) return;
      var n = title(t);
      if (n !== t) el.textContent = n;
    });
    Array.prototype.slice.call(view.querySelectorAll("[data-tpl-id]")).forEach(function (card) {
      var row = card.querySelector(".row.space") || card;
      var star = card.querySelector("[data-act='fav-tpl']");
      var name = card.querySelector(".ex-name");
      if (name) {
        name.textContent = title(name.textContent);
        name.style.textAlign = "left";
        name.style.flex = "1";
      }
      if (star) {
        star.style.cssText = "font-size:18px;line-height:1;min-height:0;padding:0;width:28px;flex:0 0 28px;text-align:right;color:" + (star.textContent === "\u2605" ? "var(--accent)" : "#5a5a5a");
        row.appendChild(star);
      }
      card.style.textAlign = "left";
    });
  }
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      ["view-home", "view-workout", "view-library", "view-progress", "view-history"].forEach(function (id) {
        fix(document.getElementById(id));
      });
    }, 80);
  }
  function boot() {
    ["view-home", "view-workout", "view-library"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
