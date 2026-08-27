// 路由入口：#/judge?g=A  → 评委端    #/admin/*  → 后台
(function () {
  function param(name) {
    var m = location.hash.match(new RegExp("[?&]" + name + "=([^&]+)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  var lastRoute = "";

  function boot() {
    var h = location.hash.replace(/^#\/?/, "");
    if (/^admin/.test(h)) { lastRoute = "admin"; return AdminApp.route(); }
    if (/^judge/.test(h)) {
      var g = (param("g") || "A").toUpperCase();
      if (lastRoute === "judge:" + g) return;      // 评委端自己管理内部视图
      lastRoute = "judge:" + g;
      return JudgeApp.start(g);
    }
    lastRoute = "";
    // 落地页
    var el = UI.el;
    UI.mount(el("div", { style: "padding:110px 24px;text-align:center" }, [
      el("div", { class: "shimmer glow", style: "display:inline-block;font-size:34px;font-weight:800" }, "寻找你的那颗星"),
      el("div", { style: "font-size:14px;color:#B9C6E6;margin:16px 0 34px" }, "【逐光行动 · 点亮星河】案例孵化大赛 · 初赛评分系统"),
      el("div", { style: "display:flex;flex-direction:column;gap:12px;max-width:320px;margin:0 auto" }, [
        el("a.btn", { href: "#/judge?g=A" }, "评委评分入口（请扫本组二维码）"),
        el("a.btn-ghost", { href: "#/admin" }, "后台管理端")
      ]),
      el("div", { style: "font-size:11.5px;color:#5E71A0;margin-top:30px" }, "评委请使用现场发放的本组二维码进入，以确保组别正确")
    ]));
  }

  window.addEventListener("hashchange", boot);
  boot();
})();
