(function () {
  var mem = Object.create(null);
  var get = Storage.prototype.getItem;
  var set = Storage.prototype.setItem;
  var del = Storage.prototype.removeItem;
  Storage.prototype.getItem = function (k) {
    if (this !== localStorage || !k || k.indexOf("il_") !== 0) return get.call(this, k);
    var hit = mem[k];
    if (hit && Date.now() - hit.t < 250) return hit.v;
    var v = get.call(this, k);
    mem[k] = { t: Date.now(), v: v };
    return v;
  };
  Storage.prototype.setItem = function (k, v) {
    if (this === localStorage && k && k.indexOf("il_") === 0) delete mem[k];
    return set.call(this, k, v);
  };
  Storage.prototype.removeItem = function (k) {
    if (this === localStorage && k) delete mem[k];
    return del.call(this, k);
  };
})();
