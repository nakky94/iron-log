self.onmessage = function (e) {
  var data = e.data || {};
  try {
    if (data.type !== "json") throw new Error("Unknown job");
    var obj = JSON.parse(data.text);
    if (!obj || typeof obj !== "object") throw new Error("Not a Gym Log file");
    var incoming = obj.workouts || obj.sessions || (Array.isArray(obj) ? obj : null);
    if (!incoming) throw new Error("No workouts in file");
    self.postMessage({ ok: true, obj: obj });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err.message || err) });
  }
};
