// 轻量 DOM / 状态 / 存储工具
(function () {
  function el(tag, attrs, kids) {
    var parts = tag.split(".");
    var e = document.createElement(parts[0] || "div");
    if (parts.length > 1) e.className = parts.slice(1).join(" ");
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "style") { e.setAttribute("style", v); }
      else if (k === "class") { e.className = (e.className ? e.className + " " : "") + v; }
      else if (k === "html") { e.innerHTML = v; }
      else if (k.slice(0, 2) === "on") { e.addEventListener(k.slice(2).toLowerCase(), v); }
      else if (k === "value") { e.value = v; }
      else { e.setAttribute(k, v); }
    });
    (Array.isArray(kids) ? kids : [kids]).forEach(function (k) {
      if (k === null || k === undefined || k === false) return;
      e.appendChild(typeof k === "object" ? k : document.createTextNode(String(k)));
    });
    return e;
  }
  function mount(node, keepScroll) {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var r = document.getElementById("root");
    r.innerHTML = "";
    r.appendChild(node);
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }
  function toast(msg, ms) {
    var t = el("div.toast", {}, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 2600);
  }
  function modal(title, bodyNode, actions) {
    var box = el("div.modal-box", {}, [
      el("div", { style: "font-size:17px;font-weight:700;color:#F7DFA5;margin-bottom:14px" }, title),
      bodyNode,
      el("div", { style: "display:flex;gap:10px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap" },
        (actions || []).map(function (a) {
          return el("button." + (a.primary ? "btn-sm gold" : "btn-sm"), {
            onclick: function () { if (a.onClick) a.onClick(close); else close(); }
          }, a.label);
        }))
    ]);
    var wrap = el("div.modal", { onclick: function (e) { if (e.target === wrap) close(); } }, box);
    document.body.appendChild(wrap);
    function close() { wrap.remove(); }
    return close;
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmt(n, d) { return n === null || n === undefined ? "—" : Number(n).toFixed(d === undefined ? 2 : d); }
  var store = {
    get: function (k, def) { try { var v = localStorage.getItem("zgxd_" + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem("zgxd_" + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem("zgxd_" + k); } catch (e) {} }
  };
  function confetti(host, n) {
    var colors = ["#F7DFA5", "#E8B455", "#FFF3D2", "#C08A2E", "#EAF0FF"];
    var wrap = el("div", { style: "position:absolute;inset:0;overflow:hidden;pointer-events:none" });
    for (var i = 0; i < (n || 46); i++) {
      var w = 4 + Math.round(Math.random() * 6), strip = Math.random() > .5;
      wrap.appendChild(el("span", {
        style: "position:absolute;top:-40px;left:" + (Math.random() * 100).toFixed(1) + "%;width:" + w +
          "px;height:" + (strip ? w * 2.6 : w) + "px;border-radius:" + (strip ? "1px" : "50%") +
          ";background:" + colors[Math.floor(Math.random() * colors.length)] +
          ";--dx:" + (Math.random() * 160 - 80).toFixed(0) + "px;--rot:" + (360 + Math.round(Math.random() * 720)) +
          "deg;animation:fall " + (4.2 + Math.random() * 2.4).toFixed(2) + "s linear " +
          (Math.random() * 2.4).toFixed(2) + "s 1 both"
      }));
    }
    host.appendChild(wrap);
  }
  function csv(rows, headers, filename) {
    var keys = headers.map(function (h) { return h.k; });
    var out = [headers.map(function (h) { return h.t; }).join(",")];
    rows.forEach(function (r) {
      out.push(keys.map(function (k) {
        var v = r[k];
        v = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(","));
    });
    var blob = new Blob(["\ufeff" + out.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
  window.UI = { el: el, mount: mount, toast: toast, modal: modal, pad: pad, fmt: fmt, store: store, confetti: confetti, csv: csv };
})();
