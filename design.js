(function () {
  var css = document.getElementById("designCss");
  if (!css) { css = document.createElement("style"); css.id = "designCss"; document.head.appendChild(css); }
  css.textContent = [
    ".ex-name{font-size:15px!important}.tiny,.tpl-lifts,.tpl-note-line{font-size:12px!important}",
    ".card{margin-bottom:8px!important;border-color:transparent!important;background:#141414!important}",
    "[data-hs-tpl].active,.nav button.active{border:1px solid #2a2a2e!important}",
    ".nav button.active{background:transparent!important}",
    ".nav button.active svg{stroke:#f4f4f5!important}",
    ".nav{padding-top:10px!important}",
    "button:not(#trainStart):not(#hsStart):not([data-act='start']){background:transparent!important;color:#f4f4f5!important;border-color:transparent!important}",
    "#trainStart,#hsStart,[data-act='start']{background:#f4f4f5!important;color:#111!important}",
    ".kg-pill,.pro-row .pill,button.step{height:36px!important;min-height:36px!important}",
    "#restPick{border-top:1px solid #2a2a2e;padding-top:6px;background:transparent!important}",
    "#restPick button{min-height:28px!important;padding:0 8px!important}",
    "#view-workout.empty-train{display:flex;align-items:center;justify-content:center;min-height:50dvh;text-align:center}",
    "#histList .h-card{background:transparent!important;border:0!important;border-bottom:1px solid #1e1e1e!important;border-radius:0!important;padding:12px 0!important}",
    "#histList .h-card .row.space{display:flex;justify-content:space-between}",
    "header.top .session-name{margin-left:8px;font-weight:650}"
  ].join("");
  function header() {
    var brand = document.querySelector(".brand");
    if (!brand) return;
    var c = {};
    try { c = JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) {}
    var s = {};
    try { s = JSON.parse(localStorage.getItem("il_session") || "{}"); } catch (e) {}
    var name = brand.querySelector(".session-name");
    if (c.userStarted && s.name) {
      if (!name) { name = document.createElement("span"); name.className = "session-name"; brand.appendChild(name); }
      name.textContent = s.name;
    } else if (name) name.remove();
  }
  function empty() {
    var view = document.getElementById("view-workout");
    if (!view) return;
    var cards = view.querySelectorAll(".card");
    view.classList.toggle("empty-train", !cards.length);
    var note = document.getElementById("emptyTrain");
    if (!cards.length && !note) {
      note = document.createElement("div");
      note.id = "emptyTrain";
      note.innerHTML = "<div>Nothing loaded.</div>";
      view.appendChild(note);
    }
    if (cards.length && note) note.remove();
  }
  setInterval(function () { header(); empty(); }, 1000);
  header(); empty();
})();
