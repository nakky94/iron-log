(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  function cues() { return load("il_cues", {}); }
  function setCue(name, patch) {
    var all = cues();
    all[name] = Object.assign({ note: "", hasVideo: false }, all[name] || {}, patch || {});
    save("il_cues", all);
  }
  function openDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("gym-log-cues", 1);
      req.onupgradeneeded = function () { req.result.createObjectStore("clips"); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function saveClip(name, blob) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("clips", "readwrite");
        tx.objectStore("clips").put(blob, name);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function getClip(name) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction("clips", "readonly");
        var req = tx.objectStore("clips").get(name);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      });
    });
  }
  function deleteClip(name) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction("clips", "readwrite");
        tx.objectStore("clips").delete(name);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    });
  }
  var activeName = "";
  function session() { return load("il_session", null); }
  function paintCues() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = session(); if (!s) return;
    var cards = view.querySelectorAll(".card");
    var all = cues();
    (s.exercises || []).forEach(function (ex, i) {
      var card = cards[i]; if (!card) return;
      var cue = all[ex.n] || {};
      if (!card.querySelector("[data-act='edit-cue']")) {
        var lastRow = card.querySelectorAll(".row"); lastRow = lastRow[lastRow.length - 1];
        if (lastRow) {
          var btn = document.createElement("button");
          btn.className = "btn sm ghost"; btn.type = "button";
          btn.setAttribute("data-act", "edit-cue"); btn.setAttribute("data-i", String(i));
          btn.textContent = "Cue"; lastRow.appendChild(btn);
        }
      }
      var box = card.querySelector(".cue-box");
      if (!box) {
        box = document.createElement("div"); box.className = "cue-box"; box.style.cssText = "margin-top:8px";
        var grid = card.querySelector(".set-grid");
        if (grid) card.insertBefore(box, grid); else card.appendChild(box);
      }
      var html = "";
      if (cue.note) html += '<div class="tiny" style="text-transform:none;letter-spacing:0">' + esc(cue.note) + "</div>";
      if (cue.hasVideo) html += '<button class="btn sm ghost" type="button" data-act="play-cue" data-i="' + i + '" style="margin-top:6px">Play form clip</button>';
      box.innerHTML = html;
    });
  }
  function openEditor(i) {
    var s = session(); if (!s || !s.exercises[i]) return;
    activeName = s.exercises[i].n;
    var cue = cues()[activeName] || { note: "", hasVideo: false };
    var html = '<div class="grab"></div><div class="ex-name" style="margin-bottom:8px">' + esc(activeName) + '</div>';
    html += '<div class="tiny" style="margin-bottom:8px">Form cue</div>';
    html += '<input id="cueNote" placeholder="Elbows in. Pause at the bottom." value="' + esc(cue.note) + '" />';
    html += '<div class="tiny" style="margin:12px 0 8px">Optional clip (keep under ~15s)</div>';
    html += '<input id="cueFile" type="file" accept="video/*,image/*" />';
    if (cue.hasVideo) html += '<div class="tiny" style="margin-top:8px">A clip is saved for this lift.</div>';
    html += '<div style="height:12px"></div><button class="btn" type="button" data-act="save-cue">Save cue</button>';
    if (cue.note || cue.hasVideo) html += '<div style="height:8px"></div><button class="btn ghost warn" type="button" data-act="clear-cue">Remove cue</button>';
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  function playClip(i) {
    var s = session(); if (!s || !s.exercises[i]) return;
    var name = s.exercises[i].n;
    getClip(name).then(function (blob) {
      var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
      if (!sheet || !modal) return;
      if (!blob) { sheet.innerHTML = '<div class="grab"></div><div class="tiny">No clip stored.</div>'; modal.classList.add("show"); return; }
      var url = URL.createObjectURL(blob);
      var tag = blob.type.indexOf("image") === 0 ? '<img src="' + url + '" style="width:100%;border-radius:12px" />' : '<video src="' + url + '" controls playsinline style="width:100%;border-radius:12px"></video>';
      sheet.innerHTML = '<div class="grab"></div><div class="ex-name" style="margin-bottom:8px">' + esc(name) + "</div>" + tag;
      modal.classList.add("show");
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act");
    if (act === "edit-cue") openEditor(Number(t.getAttribute("data-i")));
    if (act === "play-cue") playClip(Number(t.getAttribute("data-i")));
    if (act === "save-cue") {
      var noteEl = document.getElementById("cueNote");
      var fileEl = document.getElementById("cueFile");
      var note = noteEl ? noteEl.value.trim() : "";
      var file = fileEl && fileEl.files && fileEl.files[0];
      if (file && file.size > 12 * 1024 * 1024) { alert("Clip is too large. Keep it under 12 MB."); return; }
      function done() {
        document.getElementById("modal").classList.remove("show");
        document.querySelector('.nav button[data-view="workout"]').click();
      }
      if (file) {
        saveClip(activeName, file).then(function () { setCue(activeName, { note: note, hasVideo: true }); done(); }).catch(function () { alert("Could not save clip on this device."); });
      } else {
        var prev = cues()[activeName] || {};
        setCue(activeName, { note: note, hasVideo: !!prev.hasVideo });
        done();
      }
    }
    if (act === "clear-cue") {
      var all = cues(); delete all[activeName]; save("il_cues", all); deleteClip(activeName);
      document.getElementById("modal").classList.remove("show");
      document.querySelector('.nav button[data-view="workout"]').click();
    }
  });
  var obs = new MutationObserver(function () { paintCues(); });
  setTimeout(function () {
    var n = document.getElementById("view-workout");
    if (n) obs.observe(n, { childList: true });
    paintCues();
  }, 700);
})();
