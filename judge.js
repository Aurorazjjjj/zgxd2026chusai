// ============ 系统一：评委手机评分端 ============
(function () {
  var el = UI.el, mount = UI.mount, pad = UI.pad, store = UI.store;
  var S = { group: null, judges: [], cases: [], dims: [], judgeId: null, judgeName: "",
            scores: {}, view: "home", caseId: null, draft: {}, saving: false, timer: null };

  function pulseStart() {
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(function () {
      if (document.hidden) return;
      API.judgePulse(S.group.code).then(function (p) {
        if (!p) return;
        var changed = p.current_case_id !== S.group.current_case_id || p.status !== S.group.status;
        S.group.current_case_id = p.current_case_id;
        S.group.status = p.status;
        S.group.locked = p.locked;
        if (changed && S.view === "home") render();
      }).catch(function () {});
    }, APP_CONFIG.PULSE_MS || 4000);
  }

  function loadScores() {
    return API.myScores(S.judgeId).then(function (m) { S.scores = m || {}; });
  }

  function start(groupCode) {
    mount(el("div", { style: "padding:120px 24px;text-align:center;color:#8FA0C8" }, "正在载入…"));
    API.judgeBootstrap(groupCode).then(function (b) {
      S.group = b.group; S.judges = b.judges; S.cases = b.cases; S.dims = b.dimensions;
      var saved = store.get("judge_" + S.group.code, null);
      if (saved && S.judges.some(function (j) { return j.id === saved.id; })) {
        S.judgeId = saved.id; S.judgeName = saved.name;
        loadScores().then(function () { S.view = "home"; render(); pulseStart(); });
      } else { S.view = "login"; render(); pulseStart(); }
    }).catch(function (e) {
      mount(el("div", { style: "padding:100px 24px;text-align:center" }, [
        el("div", { style: "color:#E8B455;font-size:17px" }, "无法进入：" + e.message),
        el("div", { style: "color:#7286B4;font-size:13px;margin-top:12px" }, "请确认二维码是否正确，或联系现场工作人员")
      ]));
    });
  }

  // ---------- 登录（扫码后选姓名） ----------
  function viewLogin() {
    var sel = el("select", { id: "jsel" }, [el("option", { value: "" }, "请选择你的姓名")].concat(
      S.judges.map(function (j) { return el("option", { value: j.id }, j.name + (j.role ? "（" + j.role + "）" : "")); })));
    return el("div", { style: "padding:76px 24px 40px;text-align:center" }, [
      el("div", { class: "glow", style: "display:inline-block;position:relative" }, [
        el("span", { class: "twk", style: "position:absolute;top:-6px;right:-16px;font-size:14px;color:#FFF3D2" }, "✦"),
        el("div", { class: "shimmer", style: "font-size:36px;font-weight:800;line-height:1.25" }, "寻找你的那颗星")
      ]),
      el("div", { style: "display:inline-block;margin-top:18px;border:1px solid rgba(232,180,85,.45);border-radius:3px;padding:8px 14px;font-size:13.5px;font-weight:700;color:#F7DFA5" },
        "【逐光行动 · 点亮星河】案例孵化大赛"),
      el("div", { style: "font-size:13px;color:#B9C6E6;margin-top:10px;letter-spacing:.12em" }, "初赛 · 评委评分"),
      el("div.card", { style: "margin-top:34px;padding:22px 18px;text-align:left;background:rgba(18,42,94,.55);border-color:rgba(232,180,85,.24)" }, [
        el("div", { style: "display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(232,180,85,.4);border-radius:3px;padding:9px 0;margin-bottom:20px;background:rgba(232,180,85,.08)" }, [
          el("span", { style: "font-size:12px;color:#8FA0C8" }, "扫码进入"),
          el("span", { style: "font-size:16px;font-weight:700;color:#F7DFA5" }, S.group.code + "组 · " + S.group.track)
        ]),
        el("div", { style: "font-size:12px;color:#8FA0C8;margin-bottom:8px" }, "请从名单中选择你的姓名"),
        sel,
        el("div", { style: "font-size:11.5px;color:#7286B4;margin-top:10px;line-height:1.6" },
          "名单由后台维护；如名单中没有你的姓名，请联系现场工作人员"),
        el("button.btn", { style: "margin-top:22px", onclick: function () {
            var v = document.getElementById("jsel").value;
            if (!v) return UI.toast("请先选择姓名");
            var j = S.judges.filter(function (x) { return x.id === v; })[0];
            S.judgeId = j.id; S.judgeName = j.name;
            store.set("judge_" + S.group.code, { id: j.id, name: j.name });
            loadScores().then(function () { S.view = "home"; render(); });
          } }, "开始评分")
      ]),
      el("div", { style: "font-size:11.5px;color:#5E71A0;margin-top:26px;letter-spacing:.12em" }, "让优秀被看见 · 让经验被连接")
    ]);
  }

  // ---------- 首页 ----------
  function caseRow(c) {
    var sc = S.scores[c.id];
    var right, border = "rgba(147,168,214,.18)";
    if (sc && sc.status === "SUBMITTED") right = el("div", { style: "font-size:13px;color:#F7DFA5;white-space:nowrap" }, "✓ 已完成");
    else if (sc) { right = el("div", { style: "font-size:13px;color:#E8B455;white-space:nowrap" }, "继续评分 ›"); border = "rgba(232,180,85,.4)"; }
    else right = el("div", { style: "font-size:13px;color:#B9C6E6;white-space:nowrap" }, "开始评分 ›");
    return el("button.card", {
      style: "display:flex;align-items:center;gap:12px;padding:13px 14px;width:100%;text-align:left;border-color:" + border,
      onclick: function () { openCase(c.id); }
    }, [
      el("div.mono", { style: "font-size:19px;color:" + (sc ? "#F7DFA5" : "#8FA0C8") + ";width:30px" }, pad(c.case_number)),
      el("div", { style: "flex:1;min-width:0" }, [
        el("div", { style: "font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" },
          c.participant_name + " · " + c.case_name),
        el("div", { style: "font-size:11.5px;color:#7286B4;margin-top:2px" },
          (c.district || "") + (sc && sc.status === "DRAFT" ? " · 草稿 " + UI.fmt(sc.total_score, 0) + "/60" : ""))
      ]),
      right
    ]);
  }

  function viewHome() {
    var done = Object.keys(S.scores).filter(function (k) { return S.scores[k].status === "SUBMITTED"; }).length;
    var cur = S.cases.filter(function (c) { return c.id === S.group.current_case_id; })[0];
    return el("div", { style: "padding-bottom:40px" }, [
      el("div", { style: "background:linear-gradient(180deg,#16306a,#0c1a40);padding:18px 20px 16px;border-bottom:1px solid rgba(232,180,85,.18)" }, [
        el("div", { style: "display:flex;justify-content:space-between;align-items:flex-start" }, [
          el("div", {}, [
            el("div", { style: "font-size:19px;font-weight:800;color:#F7DFA5" }, S.group.code + "组 · " + S.group.track),
            el("div", { style: "font-size:12.5px;color:#B9C6E6;margin-top:5px" }, "评委 " + S.judgeName)
          ]),
          el("div", { style: "text-align:right" }, [
            el("div.mono", { style: "font-size:22px;color:#F7DFA5;line-height:1" }, [
              String(done), el("span", { style: "font-size:14px;color:#8FA0C8" }, "/" + S.cases.length)]),
            el("div", { style: "font-size:11px;color:#8FA0C8;margin-top:3px" }, "已评分")
          ])
        ]),
        el("div", { style: "height:4px;background:rgba(5,9,26,.6);border-radius:2px;margin-top:14px;overflow:hidden" },
          el("div", { style: "height:100%;width:" + (S.cases.length ? done / S.cases.length * 100 : 0) + "%;background:linear-gradient(90deg,#C08A2E,#F7DFA5)" })),
        S.group.locked ? el("div", { style: "margin-top:12px;font-size:12px;color:#E8B455" }, "本组评分已封存，如需修改请联系管理员") : null
      ]),
      cur ? el("div", { style: "margin:16px 16px 0;border:1px solid rgba(232,180,85,.6);border-radius:6px;background:linear-gradient(135deg,rgba(24,52,112,.9),rgba(12,26,64,.9));padding:16px 18px 18px;box-shadow:0 0 28px rgba(232,180,85,.16)" }, [
        el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:12px" }, [
          el("span", { style: "width:6px;height:6px;border-radius:50%;background:#F7DFA5;box-shadow:0 0 8px #E8B455" }),
          el("span", { style: "font-size:12px;letter-spacing:.2em;color:#E8B455" }, "当前案例 · 正在演讲")
        ]),
        el("div", { style: "display:flex;align-items:baseline;gap:10px;flex-wrap:wrap" }, [
          el("div.mono", { style: "font-size:34px;color:#F7DFA5;line-height:1" }, pad(cur.case_number)),
          el("div", { style: "font-size:17px;font-weight:700" }, cur.participant_name),
          el("div", { style: "font-size:12px;color:#8FA0C8" }, cur.district || "")
        ]),
        el("div", { style: "font-size:15px;margin-top:8px" }, cur.case_name),
        el("button.btn", { style: "margin-top:16px", onclick: function () { openCase(cur.id); } },
          S.scores[cur.id] ? (S.scores[cur.id].status === "SUBMITTED" ? "查看 / 修改评分" : "继续评分") : "立即评分")
      ]) : null,
      el("div", { style: "display:flex;justify-content:space-between;align-items:center;padding:20px 20px 10px" }, [
        el("div", { style: "font-size:13px;color:#8FA0C8" }, "本组全部案例"),
        el("div.mono", { style: "font-size:12px;color:#5E71A0" }, S.cases.length + " CASES")
      ]),
      el("div", { style: "display:flex;flex-direction:column;gap:8px;padding:0 16px" }, S.cases.map(caseRow)),
      el("button", { style: "display:block;margin:28px auto 0;font-size:12px;color:#5E71A0", onclick: function () {
          store.del("judge_" + S.group.code); S.judgeId = null; S.view = "login"; render();
        } }, "切换评委身份")
    ]);
  }

  // ---------- 评分表 ----------
  function openCase(caseId) {
    S.caseId = caseId;
    var sc = S.scores[caseId];
    var local = store.get("draft_" + caseId + "_" + S.judgeId, null);
    S.draft = {};
    if (sc && sc.details) Object.keys(sc.details).forEach(function (k) { S.draft[k] = sc.details[k]; });
    if (local && (!sc || sc.status !== "SUBMITTED")) Object.keys(local).forEach(function (k) { S.draft[k] = local[k]; });
    S.view = "score"; render();
  }

  function partSum(cat) {
    return S.dims.filter(function (d) { return d.category_name === cat; })
      .reduce(function (a, d) { return a + (S.draft[d.id] || 0); }, 0);
  }
  function total() { return S.dims.reduce(function (a, d) { return a + (S.draft[d.id] || 0); }, 0); }

  var saveTimer = null;
  function autosave() {
    store.set("draft_" + S.caseId + "_" + S.judgeId, S.draft);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (S.group.locked) return;
      var sc = S.scores[S.caseId];
      API.saveScore(S.judgeId, S.caseId, S.draft, sc && sc.status === "SUBMITTED")
        .then(function (r) { S.scores[S.caseId] = { status: r.status, total_score: r.total_score, submitted_at: r.submitted_at, details: JSON.parse(JSON.stringify(S.draft)) }; })
        .catch(function () {});
    }, 900);
  }

  function dimCard(d) {
    var val = S.draft[d.id];
    var btns = [];
    for (var i = d.min_score; i <= d.max_score; i++) {
      (function (n) {
        btns.push(el("button" + (val === n ? ".gbtn.on" : ".gbtn"), {
          onclick: function () {
            S.draft[d.id] = (S.draft[d.id] === n && !d.required) ? null : n;
            autosave(); render();
          }
        }, String(n)));
      })(i);
    }
    return el("div.card", { style: "padding:14px;margin-bottom:10px;" + (d.required ? "" : "border-style:dashed;border-color:rgba(232,180,85,.4)") }, [
      el("div", { style: "display:flex;justify-content:space-between;align-items:baseline;gap:10px" }, [
        el("div", { style: "font-size:15px;font-weight:500" }, [
          d.display_order + ". " + d.name,
          d.required ? null : el("span", { style: "font-size:11.5px;color:#E8B455;font-weight:400" }, " 非必填")
        ]),
        el("div.mono", { style: "font-size:15px;color:" + (val === null || val === undefined ? "#5E71A0" : "#F7DFA5") },
          [(val === null || val === undefined ? "—" : String(val)), el("span", { style: "color:#5E71A0" }, "/" + d.max_score)])
      ]),
      d.description ? el("div", { style: "font-size:11.5px;color:#7286B4;margin-top:5px;line-height:1.55" }, d.description) : null,
      el("div.grid", {}, btns)
    ]);
  }

  function viewScore() {
    var c = S.cases.filter(function (x) { return x.id === S.caseId; })[0];
    var sc = S.scores[S.caseId] || {};
    var cats = [];
    S.dims.forEach(function (d) { if (cats.indexOf(d.category_name) < 0) cats.push(d.category_name); });
    var body = [];
    cats.forEach(function (cat) {
      body.push(el("div", { style: "display:flex;align-items:center;gap:8px;margin:14px 0 12px" }, [
        el("div", { style: "font-size:13px;font-weight:700;color:#F7DFA5;letter-spacing:.06em" }, cat),
        el("div", { style: "flex:1;height:1px;background:rgba(232,180,85,.25)" })
      ]));
      S.dims.filter(function (d) { return d.category_name === cat; }).forEach(function (d) { body.push(dimCard(d)); });
    });

    var submitted = sc.status === "SUBMITTED";
    return el("div", { style: "padding-bottom:150px" }, [
      el("div", { style: "position:sticky;top:0;z-index:5;background:linear-gradient(180deg,#16306a,#0c1a40);padding:12px 16px;border-bottom:1px solid rgba(232,180,85,.18);display:flex;align-items:center;gap:12px" }, [
        el("button", { style: "font-size:22px;color:#B9C6E6;padding:0 4px", onclick: function () { S.view = "home"; render(); } }, "‹"),
        el("div", { style: "flex:1;min-width:0" }, [
          el("div", { style: "display:flex;align-items:baseline;gap:8px" }, [
            el("span.mono", { style: "font-size:17px;color:#F7DFA5" }, "CASE " + pad(c.case_number)),
            el("span", { style: "font-size:14px;font-weight:700" }, c.participant_name)
          ]),
          el("div", { style: "font-size:12px;color:#8FA0C8;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, c.case_name)
        ]),
        el("div", { style: "font-size:11px;color:" + (submitted ? "#F7DFA5" : "#7286B4") + ";text-align:right;line-height:1.4" },
          submitted ? "已提交" : "草稿\n自动保存")
      ]),
      el("div", { style: "display:flex;align-items:center;gap:12px;padding:8px 16px;border-bottom:1px solid rgba(232,180,85,.18);background:rgba(18,42,94,.45);font-size:11.5px;color:#8FA0C8;flex-wrap:wrap" },
        cats.map(function (cat) {
          var max = S.dims.filter(function (d) { return d.category_name === cat; })
                          .reduce(function (a, d) { return a + d.max_score; }, 0);
          return el("span", {}, [cat.replace(/（.*/, "") + " ",
            el("span.mono", { style: "font-size:13px;color:#F7DFA5" }, partSum(cat) + "/" + max)]);
        })),
      el("div", { style: "padding:2px 16px 0" }, body),
      el("div", { style: "position:fixed;left:0;right:0;bottom:0;background:#0a1436;border-top:1px solid rgba(232,180,85,.3);padding:12px 16px calc(18px + env(safe-area-inset-bottom))" }, [
        el("div", { style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px" }, [
          el("div", { style: "font-size:13px;color:#B9C6E6" }, "当前总分"),
          el("div.mono", { style: "font-size:26px;color:#F7DFA5;line-height:1" },
            [String(total()), el("span", { style: "font-size:15px;color:#5E71A0" }, " / 60")])
        ]),
        S.group.locked
          ? el("div.btn", { disabled: "disabled" }, "本组已封存")
          : el("button.btn", { onclick: doSubmit }, submitted ? "保存修改" : "提交评分")
      ])
    ]);
  }

  function doSubmit() {
    var miss = S.dims.filter(function (d) { return d.required && (S.draft[d.id] === null || S.draft[d.id] === undefined); });
    if (miss.length) return UI.toast("请完成所有必填评分项：" + miss.map(function (d) { return d.name; }).join("、"));
    if (S.saving) return;
    S.saving = true;
    API.saveScore(S.judgeId, S.caseId, S.draft, true).then(function (r) {
      S.saving = false;
      S.scores[S.caseId] = { status: r.status, total_score: r.total_score, submitted_at: r.submitted_at, details: JSON.parse(JSON.stringify(S.draft)) };
      store.del("draft_" + S.caseId + "_" + S.judgeId);
      S.view = "done"; render();
    }).catch(function (e) { S.saving = false; UI.toast("提交失败：" + e.message, 4000); });
  }

  function viewDone() {
    var c = S.cases.filter(function (x) { return x.id === S.caseId; })[0];
    var sc = S.scores[S.caseId] || {};
    var t = sc.submitted_at ? new Date(sc.submitted_at) : new Date();
    return el("div", { style: "padding:110px 28px 60px;text-align:center" }, [
      el("div", { style: "width:96px;height:96px;margin:0 auto;border-radius:50%;border:1.5px solid rgba(232,180,85,.7);display:flex;align-items:center;justify-content:center;font-size:44px;color:#F7DFA5;box-shadow:0 0 40px rgba(232,180,85,.3)" }, "✓"),
      el("div", { style: "font-size:26px;font-weight:800;color:#F7DFA5;margin-top:28px" }, "评分已提交成功"),
      el("div", { style: "font-size:14px;color:#B9C6E6;margin-top:14px;line-height:1.7" },
        "CASE " + pad(c.case_number) + " · " + c.participant_name + "｜" + c.case_name),
      el("div", { style: "display:inline-flex;align-items:baseline;gap:8px;margin-top:22px;border:1px solid rgba(232,180,85,.35);border-radius:4px;padding:12px 24px;background:rgba(18,42,94,.5)" }, [
        el("span", { style: "font-size:13px;color:#8FA0C8" }, "总分"),
        el("span.mono", { style: "font-size:30px;color:#F7DFA5;line-height:1" }, UI.fmt(sc.total_score, 0)),
        el("span.mono", { style: "font-size:14px;color:#5E71A0" }, "/ 60")
      ]),
      el("div.mono", { style: "font-size:11.5px;color:#5E71A0;margin-top:14px" },
        "提交时间 " + pad(t.getHours()) + ":" + pad(t.getMinutes()) + ":" + pad(t.getSeconds())),
      el("div", { style: "display:flex;flex-direction:column;gap:10px;margin-top:40px" }, [
        el("button.btn", { onclick: function () { S.view = "home"; render(); } }, "返回案例列表"),
        el("button.btn-ghost", { onclick: function () { S.view = "score"; render(); } }, "修改评分")
      ]),
      el("div", { style: "font-size:11.5px;color:#5E71A0;margin-top:22px;line-height:1.6" },
        "本组封存前可随时修改，修改会覆盖原评分")
    ]);
  }

  function render() {
    if (S.view === "login") mount(viewLogin());
    else if (S.view === "score") mount(viewScore());
    else if (S.view === "done") mount(viewDone());
    else mount(viewHome());
  }

  window.JudgeApp = { start: start };
})();
