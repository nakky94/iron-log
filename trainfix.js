(function () {
  var STEPS = [2.3,3.4,4.5,5.7,6.8,7.9,9.1,10.2,11.3,12.5,13.6,14.7,15.9,18.1,20.4,22.7,23.8,24.9,27.2,29.5,31.8,34,36.3,38.6,40.8];
  function next(n, dir) {
    var x = Number(n) || 0, best = 0, d = 99;
    STEPS.forEach(function (s, i) { var z = Math.abs(x - s); if (z < d) { d = z; best = i; } });
    return STEPS[Math.max(0, Math.min(STEPS.length - 1, best + dir))];
  }
  var css = document.getElementById("trainHide");
  if (!css) { css = document.createElement("style"); css.id = "trainHide"; document.head.appendChild(css); }
  css.textContent = [
    "#restBar,#continueBox,#trainDock,#sessStrip,#liveHead,#repeatLast,#backupNudge,#setCap,.rir-row,.deload-flag,.next-line,.last-pr,.last-load{display:none!important}",
    "#view-workout [data-act='rest-pref'],#view-workout [data-act='start-timer'],#view-workout #sessNotes,#view-workout [data-act='save-template'],#view-workout [data-act='discard']{display:none!important}",
    "#view-workout [data-act='rm-move']{width:32px!important;height:32px!important;min-width:32px!important;padding:0!important;border-radius:10px!important}",
    "#view-workout .set-grid{display:none!important}",
    "#view-workout .pro-row{display:flex!important;align-items:center;gap:8px;margin-top:8px;width:100%}",
    "#view-workout .pro-n{width:18px;flex:0 0 18px;color:#8d8d92;font-size:13px;font-weight:650;text-align:center}",
    "#view-workout .pro-kg{flex:1;display:flex;align-items:center;height:48px;min-width:0;background:#141414;border:1px solid #2c2c30;border-radius:16px}",
    "#view-workout .pro-kg > button{width:40px;flex:0 0 40px;height:48px;border:0;background:transparent;color:#e4e4e7;font-size:22px}",
    "#view-workout .pro-kg > button:first-child{border-right:1px solid #2c2c30}",
    "#view-workout .pro-kg > button:last-child{border-left:1px solid #2c2c30}",
    "#view-workout .pro-kg input{display:block!important;flex:1!important;min-width:64px!important;height:48px!important;border:0!important;background:transparent!important;color:#fff!important;font-size:20px!important;font-weight:700!important;text-align:center!important;padding:0!important}",
    "#view-workout .pro-row [data-act='set-r']{width:52px;flex:0 0 52px;height:48px;border-radius:14px;border:1px solid #2c2c30;background:#141414;color:#fff;text-align:center;font-size:18px;font-weight:700}",
    "#view-workout .pro-row [data-act='toggle-set']{width:44px;flex:0 0 44px;height:44px;border-radius:22px;border:1px solid #2c2c30;background:#141414}",
    "#view-workout .pro-row [data-act='toggle-set']:not(.ghost){background:#fafafa;color:#111}"
  ].join("");
  function text(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }
  function strip() {
    ["restBar","continueBox","trainDock","sessStrip","liveHead","repeatLast","backupNudge","setCap"].forEach(function (id) {
      var n = document.getElementById(id); if (n) n.remove();
    });
    document.querySelectorAll(".rir-row,.deload-flag,.last-pr,.last-load").forEach(function (n) { n.remove(); });
    document.querySelectorAll("#view-workout [data-act='rest-pref'], #view-workout [data-act='start-timer'], #sessNotes, [data-act='save-template'], [data-act='discard']").forEach(function (n) { n.remove(); });
    document.querySelectorAll("button, .card, .tiny, div").forEach(function (el) {
      if (el.querySelector && el.querySelector(".set-grid,.pro-row,[data-act='set-w']")) return;
      var t = text(el);
      if (!t || t.length > 180) return;
      if (/^(continue|add all|all exercises|rest|warm-up|cue|\+ move)$/i.test(t)) el.remove();
      else if (/^rest after a set/i.test(t) || /workout in progress/i.test(t) || /^next time/i.test(t) || /stalled at/i.test(t) || /deload this lift/i.test(t) || /^previous:/i.test(t) || t === "History") el.remove();
      else if (/^custom exercise/i.test(t)) el.remove();
      else if (/^last workout$/i.test(t) || /^most recent pr$/i.test(t)) { var card = el.closest(".card"); if (card) card.remove(); }
    });
  }
  function bump(btn, dir) {
    var inp = btn.parentNode.querySelector("input");
    if (!inp) return;
    inp.value = String(next(inp.value, dir));
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function mount() {
    strip();
    document.querySelectorAll("#view-workout .kg-step").forEach(function (wrap) {
      var inp = wrap.querySelector("input");
      if (inp) wrap.parentNode.insertBefore(inp, wrap);
      wrap.remove();
    });
    document.querySelectorAll("#view-workout .set-grid:not(.tiny)").forEach(function (grid) {
      if (grid.dataset.pro) return;
      var w = grid.querySelector("[data-act='set-w']");
      var r = grid.querySelector("[data-act='set-r']");
      var tick = grid.querySelector("[data-act='toggle-set']");
      if (!w || !r || !tick) return;
      var row = document.createElement("div");
      row.className = "pro-row";
      var num = document.createElement("div");
      num.className = "pro-n";
      num.textContent = ((grid.querySelector("div") || {}).textContent || "").trim();
      var kg = document.createElement("div");
      kg.className = "pro-kg";
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "\u2212";
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+";
      kg.appendChild(minus); kg.appendChild(w); kg.appendChild(plus);
      row.appendChild(num); row.appendChild(kg); row.appendChild(r); row.appendChild(tick);
      minus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(minus, -1); });
      plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(plus, 1); });
      grid.dataset.pro = "1";
      grid.insertAdjacentElement("afterend", row);
    });
  }
  mount();
  ["view-workout","view-home","view-library"].forEach(function (id) {
    var n = document.getElementById(id);
    if (n) new MutationObserver(function () { mount(); }).observe(n, { childList: true, subtree: true });
  });
})();
