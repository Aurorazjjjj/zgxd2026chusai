// ============ 系统二：后台管理端 ============
(function () {
  var el = UI.el, mount = UI.mount, pad = UI.pad, fmt = UI.fmt, store = UI.store;
  var CODE = null, GROUPS = ["A", "B", "C", "D"];
  var STATUS_CN = { NOT_STARTED: "未开始", SCORING: "评分中", SCORING_COMPLETED: "评分结束", FINALIZED: "已封存", PUBLISHED: "已公布" };

  function need() { CODE = CODE || store.get("admin_code", null); return CODE; }
  function go(hash) { location.hash = hash; }
  function loading(t) { mount(el("div", { style: "padding:120px;text-align:center;color:#8FA0C8" }, t || "载入中…")); }
  function err(e) { UI.toast("操作失败：" + e.message, 4200); }

  function shell(title, sub, actions, body) {
    return el("div", {}, [
      el("div.hd.noprint", {}, [
        el("div", { style: "display:flex;align-items:baseline;gap:14px;flex-wrap:wrap" }, [
          el("button", { style: "font-size:19px;font-weight:800;color:#F7DFA5", onclick: function () { go("#/admin"); } }, title),
          sub ? el("div", { style: "font-size:12.5px;color:#B9C6E6" }, sub) : null
        ]),
        el("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, (actions || []).concat([
          el("button.btn-sm", { onclick: function () { store.del("admin_code"); CODE = null; go("#/admin"); } }, "退出")
        ]))
      ]),
      el("div.adm", {}, body)
    ]);
  }

  function navTabs(active) {
    var items = [["总览", "#/admin"], ["案例管理", "#/admin/cases"], ["评委管理", "#/admin/judges"],
                 ["大众评审排名", "#/admin/public-ranking"], ["评委入口二维码", "#/admin/qr"],
                 ["操作日志", "#/admin/audit"], ["导出", "#/admin/export"]];
    return el("div.tabs", {}, items.map(function (it) {
      var on = it[0] === active;
      return el("button." + (on ? "btn-sm gold" : "btn-sm"), { onclick: function () { go(it[1]); } }, it[0]);
    }));
  }

  // ---------------- 登录 ----------------
  function login() {
    var box = el("div.card", { style: "max-width:380px;margin:0 auto;padding:24px" }, [
      el("div", { style: "font-size:12px;color:#8FA0C8;margin-bottom:8px" }, "管理密码"),
      el("input", { id: "code", type: "password", placeholder: "请输入管理密码" }),
      el("button.btn", { style: "margin-top:18px", onclick: function () {
        var v = document.getElementById("code").value;
        API.adminLogin(v).then(function () { CODE = v; store.set("admin_code", v); route(); })
          .catch(function (e) { UI.toast("登录失败：" + e.message, 6000); });
      } }, "进入后台")
    ]);
    mount(el("div", { style: "padding:110px 24px;text-align:center" }, [
      el("div", { class: "shimmer", style: "font-size:30px;font-weight:800" }, "寻找你的那颗星"),
      el("div", { style: "font-size:13px;color:#B9C6E6;margin:12px 0 30px" }, "【逐光行动 · 点亮星河】案例孵化大赛 · 后台管理端"),
      box
    ]));
  }

  // ---------------- 总览 ----------------
  function overview() {
    loading();
    API.overview(need()).then(function (gs) {
      var cards = gs.map(function (g) {
        var pct = g.expected_submissions ? (g.submitted / g.expected_submissions * 100) : 0;
        var cur = g.current_case;
        var live = g.status === "SCORING";
        return el("div.card", {
          style: "padding:18px;cursor:pointer;" + (live ? "border-color:rgba(232,180,85,.55);box-shadow:0 0 24px rgba(232,180,85,.12);background:linear-gradient(160deg,rgba(26,58,126,.85),rgba(10,20,53,.9))" : ""),
          onclick: function () { go("#/admin/group/" + g.code); }
        }, [
          el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
            el("div", { style: "font-size:24px;font-weight:800;color:" + (live ? "#F7DFA5" : "#B9C6E6") }, g.code + " 组"),
            el("span." + (live ? "pill gold" : "pill"), {}, STATUS_CN[g.status] || g.status)
          ]),
          el("div", { style: "font-size:12.5px;color:#B9C6E6;margin-top:6px" },
            g.track + (g.date ? " · " + g.date + " " + String(g.start_time || "").slice(0, 5) + "–" + String(g.end_time || "").slice(0, 5) : "")),
          el("div", { style: "display:flex;gap:18px;margin-top:14px;font-size:12px;color:#8FA0C8" }, [
            el("span", {}, g.case_count + " 个案例"), el("span", {}, g.judge_count + " 位评委")
          ]),
          el("div", { style: "margin-top:14px;padding-top:14px;border-top:1px solid rgba(232,180,85,.2)" },
            cur ? [
              el("div", { style: "font-size:11.5px;color:#8FA0C8" }, "当前案例"),
              el("div", { style: "display:flex;align-items:baseline;gap:8px;margin-top:3px" }, [
                el("span.mono", { style: "font-size:22px;color:#F7DFA5" }, pad(cur.case_number)),
                el("span", { style: "font-size:14px" }, cur.participant_name),
                el("span.mono", { style: "font-size:12px;color:#8FA0C8" }, cur.submitted + "/" + g.judge_count)
              ]),
              cur.missing && cur.missing.length
                ? el("div", { style: "font-size:11.5px;color:#E8B455;margin-top:6px" }, "未提交：" + cur.missing.join("、"))
                : el("div", { style: "font-size:11.5px;color:#8FA0C8;margin-top:6px" }, "全部已提交")
            ] : el("div", { style: "font-size:11.5px;color:#5E71A0" }, "尚未设置当前案例")),
          el("div", { style: "margin-top:14px" }, [
            el("div", { style: "display:flex;justify-content:space-between;font-size:12px;color:#B9C6E6" }, [
              el("span.mono", {}, "已提交 " + g.submitted + " / " + g.expected_submissions),
              el("span.mono", { style: "color:#F7DFA5" }, pct.toFixed(1) + "%")
            ]),
            el("div", { style: "height:4px;background:rgba(5,9,26,.6);border-radius:2px;margin-top:6px;overflow:hidden" },
              el("div", { style: "height:100%;width:" + Math.min(100, pct) + "%;background:linear-gradient(90deg,#C08A2E,#F7DFA5)" }))
          ])
        ]);
      });
      mount(shell("赛事控制中心", "初赛 · 42 个案例 · 4 个组", [], [
        navTabs("总览"),
        el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px" }, cards),
        el("div", { style: "margin-top:28px;display:flex;gap:8px;flex-wrap:wrap" }, GROUPS.map(function (g) {
          return el("button.btn-sm", { onclick: function () { go("#/admin/results/" + g); } }, g + " 组最终排名大屏");
        }))
      ]));
    }).catch(function (e) { if (/密码/.test(e.message)) { store.del("admin_code"); CODE = null; login(); } else err(e); });
  }

  // ---------------- 组页面 ----------------
  function groupPage(code) {
    loading();
    Promise.all([API.groupDetail(need(), code)]).then(function (r) {
      var d = r[0], g = d.group, judges = d.judges, cases = d.cases, matrix = d.matrix;
      var actJudges = judges.filter(function (j) { return j.active; });
      var mIdx = {};
      matrix.forEach(function (m) { mIdx[m.judge_id + "|" + m.case_id] = m; });
      var cur = cases.filter(function (c) { return c.id === g.current_case_id; })[0];
      var curIdx = cur ? cases.indexOf(cur) : -1;
      var subCur = cur ? actJudges.filter(function (j) { var m = mIdx[j.id + "|" + cur.id]; return m && m.status === "SUBMITTED"; }).length : 0;
      var missCur = cur ? actJudges.filter(function (j) { var m = mIdx[j.id + "|" + cur.id]; return !m || m.status !== "SUBMITTED"; }).map(function (j) { return j.name; }) : [];

      function setCase(c) {
        API.setCurrentCase(need(), code, c ? c.id : null).then(function () { groupPage(code); }).catch(err);
      }

      var live = el("div.card", { style: "padding:16px 20px;border-color:rgba(232,180,85,.5);background:linear-gradient(120deg,rgba(26,58,126,.8),rgba(10,20,53,.9));display:flex;gap:24px;align-items:center;flex-wrap:wrap" }, [
        el("div", { style: "flex:1;min-width:280px" }, [
          el("div", { style: "font-size:11.5px;letter-spacing:.2em;color:#E8B455;margin-bottom:8px" }, "当前案例控制"),
          cur ? el("div", { style: "display:flex;align-items:baseline;gap:12px;flex-wrap:wrap" }, [
            el("span.mono", { style: "font-size:30px;color:#F7DFA5;line-height:1" }, pad(cur.case_number)),
            el("span", { style: "font-size:18px;font-weight:700" }, cur.participant_name),
            el("span", { style: "font-size:14px;color:#B9C6E6" }, cur.case_name),
            el("span", { style: "font-size:12px;color:#8FA0C8" }, cur.district || "")
          ]) : el("div", { style: "color:#8FA0C8;font-size:14px" }, "未设置")
        ]),
        cur ? el("div", { style: "text-align:right" }, [
          el("div.mono", { style: "font-size:24px;color:#F7DFA5;line-height:1" },
            [subCur + " ", el("span", { style: "font-size:15px;color:#8FA0C8" }, "/ " + actJudges.length)]),
          el("div", { style: "font-size:11.5px;color:#8FA0C8;margin-top:4px" }, "已提交")
        ]) : null,
        cur && missCur.length ? el("div", { style: "border-left:1px solid rgba(232,180,85,.25);padding-left:20px;max-width:260px" }, [
          el("div", { style: "font-size:11.5px;color:#8FA0C8;margin-bottom:4px" }, "未提交"),
          el("div", { style: "font-size:14px;color:#E8B455" }, missCur.join("、"))
        ]) : null,
        el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, [
          el("button.btn-sm", { onclick: function () { if (curIdx > 0) setCase(cases[curIdx - 1]); } }, "‹ 上一个"),
          el("button.btn-sm", { onclick: function () {
            var sel = el("select", { id: "cs" }, [el("option", { value: "" }, "— 清空 —")].concat(cases.map(function (c) {
              return el("option", { value: c.id }, pad(c.case_number) + " " + c.participant_name + " · " + c.case_name);
            })));
            UI.modal("指定当前案例", sel, [{ label: "取消" }, { label: "确定", primary: true, onClick: function (close) {
              var v = document.getElementById("cs").value; close(); setCase(v ? { id: v } : null);
            } }]);
          } }, "指定案例"),
          el("button.btn-sm.gold", { onclick: function () {
            if (curIdx < 0) setCase(cases[0]); else if (curIdx < cases.length - 1) setCase(cases[curIdx + 1]);
          } }, "下一个 ›")
        ])
      ]);

      // 实时案例排名
      var rankTable = el("table", {}, [
        el("thead", {}, el("tr", {}, [["案例", "r"], ["参赛者", ""], ["案例名", ""], ["大众排名", "r"], ["已提交", "r"],
          ["评委均分", "r"], ["评委排名", "r"], ["加权分", "r"], ["最终排名", "r"]].map(function (h) {
            return el("th", { class: h[1] }, h[0]); }))),
        el("tbody", {}, cases.slice().sort(function (a, b) {
          return (a.final_rank || 99) - (b.final_rank || 99) || a.display_order - b.display_order;
        }).map(function (c) {
          return el("tr", { style: c.id === g.current_case_id ? "background:rgba(232,180,85,.06)" : "" }, [
            el("td.r.mono", { style: "color:#F7DFA5" }, pad(c.case_number)),
            el("td", {}, c.participant_name),
            el("td", { style: "color:#B9C6E6" }, c.case_name),
            el("td.r.mono", {}, c.public_rank || "—"),
            el("td.r.mono", { style: c.submitted_count < actJudges.length ? "color:#E8B455" : "" }, c.submitted_count + "/" + actJudges.length),
            el("td.r.mono", { style: "color:#F7DFA5" }, fmt(c.judge_avg)),
            el("td.r.mono", {}, c.judge_rank || "—"),
            el("td.r.mono", {}, fmt(c.weighted_score)),
            el("td.r.mono", { style: "font-size:15px;color:#F7DFA5" }, c.final_rank || "—")
          ]);
        }))
      ]);

      // 评委 × 案例矩阵
      var matrixTable = el("table", { style: "font-family:var(--mono)" }, [
        el("thead", {}, el("tr", {}, [el("th", {}, "案例")].concat(judges.map(function (j) {
          return el("th", { class: "c", style: j.active ? "" : "color:#5E71A0" }, j.name);
        })).concat([el("th", { class: "r", style: "color:#F7DFA5" }, "均分")]))),
        el("tbody", {}, cases.map(function (c) {
          return el("tr", { style: c.id === g.current_case_id ? "background:rgba(232,180,85,.06)" : "" },
            [el("td", { style: "color:#F7DFA5" }, pad(c.case_number))].concat(judges.map(function (j) {
              var m = mIdx[j.id + "|" + c.id];
              var txt = !m ? "—" : (m.status === "SUBMITTED" ? fmt(m.total_score, 0) : "草稿");
              var col = !m ? "#5E71A0" : (m.status === "SUBMITTED" ? "#EAF0FF" : "#E8B455");
              return el("td.c", { style: "color:" + col + ";cursor:pointer", onclick: function () { scoreModal(code, j, c); } }, txt);
            })).concat([el("td.r", { style: "color:#F7DFA5" }, fmt(c.judge_avg))]));
        }))
      ]);

      var acts = [
        el("span." + (g.status === "SCORING" ? "pill gold" : "pill"), {}, STATUS_CN[g.status] || g.status),
        el("button.btn-sm", { onclick: function () { precheckModal(code); } }, "封存前检查"),
        g.status === "FINALIZED" || g.status === "PUBLISHED"
          ? el("button.btn-sm", { onclick: function () {
              UI.modal("解除封存", el("div", { style: "font-size:14px;color:#B9C6E6" }, "解除后评委可继续修改评分，操作会记入日志。"),
                [{ label: "取消" }, { label: "确认解除", primary: true, onClick: function (close) {
                  close(); API.unlock(need(), code).then(function () { groupPage(code); }).catch(err); } }]);
            } }, "解除封存")
          : el("button.btn-sm.gold", { onclick: function () { finalizeModal(code); } }, "封存本组"),
        el("button.btn-sm", { onclick: function () { go("#/admin/results/" + code); } }, "最终排名大屏")
      ];

      mount(shell(code + " 组", g.track + " · " + (g.competition_date || "") + " · " + cases.length + " 个案例 · " + actJudges.length + " 位评委", acts, [
        navTabs(""),
        live,
        el("div", { style: "display:flex;justify-content:space-between;align-items:baseline;margin:26px 0 10px" }, [
          el("div", { style: "font-size:15px;font-weight:700" }, "实时案例排名"),
          el("span.pill", { style: "border-color:rgba(232,180,85,.4);color:#E8B455" }, "实时暂定 · 非最终结果")
        ]),
        el("div", { style: "overflow:auto" }, rankTable),
        el("div", { style: "font-size:15px;font-weight:700;margin:28px 0 10px" }, "评委 × 案例 评分矩阵"),
        el("div", { style: "overflow:auto" }, matrixTable),
        el("div", { style: "font-size:12px;color:#7286B4;margin-top:10px" },
          "点击单元格可查看并修正六维明细；草稿与「—」均不计入评委均分，分母为实际提交人数。")
      ]));
    }).catch(function (e) { if (/密码/.test(e.message)) { CODE = null; store.del("admin_code"); login(); } else err(e); });
  }

  function scoreModal(code, judge, c) {
    API.scoreDetail(need(), judge.id, c.id).then(function (d) {
      var inputs = {};
      var rows = (d && d.details || []).map(function (x) {
        var inp = el("input", { type: "number", min: 0, max: x.max_score, value: x.score === null ? "" : x.score, style: "height:40px;width:110px" });
        inputs[x.dimension_id] = inp;
        return el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid rgba(147,168,214,.12)" },
          [el("div", { style: "font-size:14px" }, x.name + "（满分 " + x.max_score + "）"), inp]);
      });
      if (!d) rows = [el("div", { style: "color:#8FA0C8;font-size:14px" }, "该评委尚未提交此案例，可在下方直接补录。")];
      if (!d) {
        rows = [];
        API.rpc("judge_bootstrap", { p_group_code: code }).then(function (b) {
          UI.toast("请从矩阵中已有记录进入，或让评委自行提交");
        });
      }
      UI.modal(judge.name + " × CASE " + pad(c.case_number),
        el("div", {}, [
          el("div", { style: "font-size:12.5px;color:#8FA0C8;margin-bottom:10px" },
            c.participant_name + " · " + c.case_name + (d ? "｜总分 " + fmt(d.total_score, 0) + " / 60｜" + (d.status === "SUBMITTED" ? "已提交" : "草稿") : "")),
          el("div", {}, rows),
          d ? el("div.mono", { style: "font-size:11.5px;color:#5E71A0;margin-top:10px" },
            "提交 " + (d.submitted_at ? new Date(d.submitted_at).toLocaleString("zh-CN") : "—") +
            "｜更新 " + (d.updated_at ? new Date(d.updated_at).toLocaleString("zh-CN") : "—")) : null
        ]),
        d ? [
          { label: "删除此评分", onClick: function (close) {
              close(); API.deleteScore(need(), judge.id, c.id).then(function () { groupPage(code); }).catch(err); } },
          { label: "取消" },
          { label: "保存修改", primary: true, onClick: function (close) {
              var payload = {};
              Object.keys(inputs).forEach(function (k) {
                var v = inputs[k].value; payload[k] = v === "" ? null : parseInt(v, 10);
              });
              close();
              API.updateScore(need(), judge.id, c.id, payload).then(function () {
                UI.toast("已保存，已记入操作日志"); groupPage(code);
              }).catch(err); } }
        ] : [{ label: "关闭" }]);
    }).catch(err);
  }

  function precheckModal(code) {
    API.precheck(need(), code).then(function (r) {
      var body = el("div", {}, [
        el("div", { style: "font-size:14px;color:" + (r.can_finalize ? "#F7DFA5" : "#E8B455") + ";margin-bottom:12px" },
          r.can_finalize ? "检查通过，可以封存。" : "存在必须先修正的问题，暂不能封存。"),
        r.issues.length ? el("div", { style: "margin-bottom:12px" }, [
          el("div", { style: "font-size:12px;color:#E8B455;margin-bottom:6px" }, "必须修正"),
          el("ul", { style: "margin:0;padding-left:18px;font-size:13px;color:#EAF0FF" },
            r.issues.map(function (i) { return el("li", {}, i.message); }))]) : null,
        r.warnings.length ? el("div", {}, [
          el("div", { style: "font-size:12px;color:#8FA0C8;margin-bottom:6px" }, "提醒（不阻止封存）"),
          el("ul", { style: "margin:0;padding-left:18px;font-size:13px;color:#B9C6E6" },
            r.warnings.map(function (i) { return el("li", {}, i.message); }))]) : null,
        !r.issues.length && !r.warnings.length ? el("div", { style: "font-size:13px;color:#B9C6E6" }, "没有发现任何异常。") : null
      ]);
      UI.modal("封存前检查 · " + code + " 组", body, [{ label: "关闭" }]);
    }).catch(err);
  }

  function finalizeModal(code) {
    API.precheck(need(), code).then(function (r) {
      var body = el("div", {}, [
        el("div", { style: "font-size:14px;color:#B9C6E6;margin-bottom:10px" },
          "封存后评委不能再新增或修改评分，当前结果锁定。管理员可随时解除封存。"),
        r.issues.length ? el("div", { style: "font-size:13px;color:#E8B455" },
          ["必须先修正：", el("ul", { style: "margin:6px 0 0;padding-left:18px" }, r.issues.map(function (i) { return el("li", {}, i.message); }))]) : null,
        r.warnings.length ? el("div", { style: "font-size:13px;color:#8FA0C8;margin-top:10px" },
          ["提醒（评委离场属正常情况，可继续封存）：",
           el("ul", { style: "margin:6px 0 0;padding-left:18px" }, r.warnings.map(function (i) { return el("li", {}, i.message); }))]) : null
      ]);
      var acts = [{ label: "取消" }];
      if (!r.issues.length) acts.push({ label: "确认封存", primary: true, onClick: function (close) {
        close(); API.finalize(need(), code, true).then(function () { UI.toast("已封存"); groupPage(code); }).catch(err); } });
      UI.modal("封存 " + code + " 组", body, acts);
    }).catch(err);
  }

  // ---------------- 案例管理 ----------------
  function casesPage(active) {
    active = active || store.get("case_tab", "A");
    store.set("case_tab", active);
    loading();
    API.groupDetail(need(), active).then(function (d) {
      var cases = d.cases.slice().sort(function (a, b) { return a.display_order - b.display_order; });
      var editing = null;

      function form(c) {
        var f = {
          case_number: el("input", { value: c ? c.case_number : "", type: "number", style: "height:40px" }),
          district: el("input", { value: c ? (c.district || "") : "", style: "height:40px" }),
          participant_name: el("input", { value: c ? c.participant_name : "", style: "height:40px" }),
          case_name: el("input", { value: c ? c.case_name : "", style: "height:40px" }),
          group_code: el("select", { style: "height:40px" }, GROUPS.map(function (g) {
            return el("option", { value: g, selected: (c ? (c.group_code || active) : active) === g ? "selected" : null }, g + " 组"); }))
        };
        var body = el("div", {}, [
          ["案例号（01–42，全场唯一）", "case_number"], ["大区", "district"],
          ["参赛者", "participant_name"], ["案例名", "case_name"], ["组别", "group_code"]
        ].map(function (r) {
          return el("div", { style: "margin-bottom:12px" }, [
            el("div", { style: "font-size:12px;color:#8FA0C8;margin-bottom:5px" }, r[0]), f[r[1]]
          ]);
        }));
        UI.modal(c ? "编辑 CASE " + pad(c.case_number) : "新增案例", body, [
          { label: "取消" },
          { label: "保存", primary: true, onClick: function (close) {
            var obj = { id: c ? c.id : "", case_number: f.case_number.value, district: f.district.value,
                        participant_name: f.participant_name.value, case_name: f.case_name.value,
                        group_code: f.group_code.value };
            if (!obj.case_number || !obj.participant_name || !obj.case_name) return UI.toast("案例号、参赛者、案例名必填");
            close();
            API.saveCase(need(), obj).then(function () { UI.toast("已保存"); casesPage(active); }).catch(err);
          } }
        ]);
      }

      var table = el("table", {}, [
        el("thead", {}, el("tr", {}, [["顺序", "r"], ["案例号", "r"], ["大区", ""], ["参赛者", ""], ["案例名", ""],
          ["大众排名", "r"], ["状态", "c"], ["操作", "r"]].map(function (h) { return el("th", { class: h[1] }, h[0]); }))),
        el("tbody", {}, cases.map(function (c) {
          return el("tr", {}, [
            el("td.r.mono", { style: "color:#8FA0C8" }, c.display_order),
            el("td.r.mono", { style: "color:#F7DFA5" }, pad(c.case_number)),
            el("td", {}, c.district || "—"),
            el("td", {}, c.participant_name),
            el("td", { style: "color:#EAF0FF" }, c.case_name),
            el("td.r.mono", {}, c.public_rank || "—"),
            el("td.c", {}, el("span.pill", {}, "启用")),
            el("td.r", {}, el("div", { style: "display:inline-flex;gap:8px" }, [
              el("button", { style: "color:#E8B455;font-size:13px", onclick: function () { form(c); } }, "编辑"),
              el("button", { style: "color:#7286B4;font-size:13px", onclick: function () {
                UI.modal("停用案例", el("div", { style: "font-size:14px;color:#B9C6E6" },
                  "停用后该案例不再出现在评委端与排名中（已有评分保留）。"),
                  [{ label: "取消" }, { label: "确认停用", primary: true, onClick: function (close) {
                    close(); API.setCaseActive(need(), c.id, false).then(function () { casesPage(active); }).catch(err); } }]);
              } }, "停用")
            ]))
          ]);
        }))
      ]);

      mount(shell("案例管理", "全场 42 个案例 · 案例号全场唯一，不按组重新编号；修改自动记入操作日志",
        [el("button.btn-sm.gold", { onclick: function () { form(null); } }, "+ 新增案例")], [
        navTabs("案例管理"),
        el("div", { style: "display:flex;gap:8px;margin-bottom:14px" }, GROUPS.map(function (g) {
          return el("button." + (g === active ? "btn-sm gold" : "btn-sm"), { onclick: function () { casesPage(g); } }, g + " 组");
        })),
        el("div", { style: "overflow:auto" }, table)
      ]));
    }).catch(err);
  }

  // ---------------- 评委管理 ----------------
  function judgesPage(active) {
    active = active || store.get("judge_tab", "A");
    store.set("judge_tab", active);
    loading();
    API.groupDetail(need(), active).then(function (d) {
      function form(j) {
        var f = {
          name: el("input", { value: j ? j.name : "", style: "height:40px" }),
          role: el("input", { value: j ? (j.role || "") : "", style: "height:40px", placeholder: "RM / SG / MKT / BU / HA / Medical / Training" }),
          group_code: el("select", { style: "height:40px" }, GROUPS.map(function (g) {
            return el("option", { value: g, selected: (j ? j.group_code || active : active) === g ? "selected" : null }, g + " 组"); })),
          attendance_status: el("select", { style: "height:40px" }, [["PRESENT", "出席"], ["LEFT_EARLY", "中途离场"], ["ABSENT", "缺席"]].map(function (o) {
            return el("option", { value: o[0], selected: j && j.attendance_status === o[0] ? "selected" : null }, o[1]); })),
          active: el("select", { style: "height:40px" }, [["true", "启用"], ["false", "停用"]].map(function (o) {
            return el("option", { value: o[0], selected: j && String(j.active) === o[0] ? "selected" : null }, o[1]); }))
        };
        var body = el("div", {}, [["姓名", "name"], ["角色", "role"], ["组别", "group_code"], ["出席状态", "attendance_status"], ["启用", "active"]]
          .map(function (r) {
            return el("div", { style: "margin-bottom:12px" }, [
              el("div", { style: "font-size:12px;color:#8FA0C8;margin-bottom:5px" }, r[0]), f[r[1]]]);
          }));
        UI.modal(j ? "编辑评委 " + j.name : "新增评委", body, [
          { label: "取消" },
          { label: "保存", primary: true, onClick: function (close) {
            if (!f.name.value) return UI.toast("请填写姓名");
            close();
            API.saveJudge(need(), { id: j ? j.id : "", name: f.name.value, role: f.role.value,
              group_code: f.group_code.value, attendance_status: f.attendance_status.value,
              active: f.active.value }).then(function () { UI.toast("已保存"); judgesPage(active); }).catch(err);
          } }
        ]);
      }
      var table = el("table", {}, [
        el("thead", {}, el("tr", {}, ["姓名", "角色", "出席状态", "状态", "操作"].map(function (h, i) {
          return el("th", { class: i > 2 ? "r" : "" }, h); }))),
        el("tbody", {}, d.judges.map(function (j) {
          return el("tr", {}, [
            el("td", { style: "font-size:15px" }, j.name),
            el("td", { style: "color:#B9C6E6" }, j.role || "—"),
            el("td", {}, ({ PRESENT: "出席", LEFT_EARLY: "中途离场", ABSENT: "缺席" })[j.attendance_status]),
            el("td.r", {}, el("span." + (j.active ? "pill gold" : "pill"), {}, j.active ? "启用" : "停用")),
            el("td.r", {}, el("div", { style: "display:inline-flex;gap:8px" }, [
              el("button", { style: "color:#E8B455;font-size:13px", onclick: function () { form(j); } }, "编辑"),
              el("button", { style: "color:#7286B4;font-size:13px", onclick: function () {
                UI.modal("删除评委", el("div", { style: "font-size:14px;color:#B9C6E6" },
                  "若该评委已有评分记录，系统会自动改为「停用」而不是删除。"),
                  [{ label: "取消" }, { label: "确认", primary: true, onClick: function (close) {
                    close(); API.deleteJudge(need(), j.id).then(function () { judgesPage(active); }).catch(err); } }]);
              } }, "删除")
            ]))
          ]);
        }))
      ]);
      mount(shell("评委管理", "评委名单可随时增减；评委扫码后从本名单中选择自己的姓名",
        [el("button.btn-sm.gold", { onclick: function () { form(null); } }, "+ 新增评委")], [
        navTabs("评委管理"),
        el("div", { style: "display:flex;gap:8px;margin-bottom:14px" }, GROUPS.map(function (g) {
          return el("button." + (g === active ? "btn-sm gold" : "btn-sm"), { onclick: function () { judgesPage(g); } }, g + " 组");
        })),
        el("div", { style: "overflow:auto;max-width:760px" }, table)
      ]));
    }).catch(err);
  }

  // ---------------- 大众评审排名 ----------------
  function publicRankPage(active) {
    active = active || store.get("pr_tab", "A");
    store.set("pr_tab", active);
    loading();
    API.groupDetail(need(), active).then(function (d) {
      var cases = d.cases.slice().sort(function (a, b) { return a.case_number - b.case_number; });
      var inputs = {};
      var table = el("table", {}, [
        el("thead", {}, el("tr", {}, [["案例号", "r"], ["参赛者", ""], ["案例名", ""], ["大众排名", "r"]].map(function (h) {
          return el("th", { class: h[1] }, h[0]); }))),
        el("tbody", {}, cases.map(function (c) {
          var inp = el("input", { type: "number", min: 1, max: cases.length, value: c.public_rank || "",
            style: "height:38px;width:96px;text-align:right" });
          inputs[c.case_number] = inp;
          return el("tr", {}, [
            el("td.r.mono", { style: "color:#F7DFA5" }, pad(c.case_number)),
            el("td", {}, c.participant_name),
            el("td", { style: "color:#B9C6E6" }, c.case_name),
            el("td.r", {}, inp)
          ]);
        }))
      ]);
      function save() {
        var payload = {}, seen = {}, bad = null;
        Object.keys(inputs).forEach(function (k) {
          var v = inputs[k].value === "" ? null : parseInt(inputs[k].value, 10);
          payload[k] = v;
          if (v !== null) { if (seen[v]) bad = "大众排名 " + v + " 重复"; seen[v] = 1; }
        });
        if (bad) return UI.toast(bad);
        API.setPublicRanks(need(), active, payload).then(function () {
          UI.toast("已保存，排名已自动重算"); publicRankPage(active);
        }).catch(err);
      }
      mount(shell("大众评审排名管理", "组内排名，A/B 为 1–10，C/D 为 1–11；同组不得重复。正式结果出来后直接替换即可，无需重新部署",
        [el("button.btn-sm.gold", { onclick: save }, "保存")], [
        navTabs("大众评审排名"),
        el("div", { style: "display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap" }, GROUPS.map(function (g) {
          return el("button." + (g === active ? "btn-sm gold" : "btn-sm"), { onclick: function () { publicRankPage(g); } }, g + " 组");
        }).concat([
          el("button.btn-sm", { onclick: function () {
            var ta = el("textarea", { style: "height:160px;padding:10px", placeholder: "每行一条：案例号 空格或逗号 排名\n例如\n04 3\n08 7" });
            UI.modal("批量粘贴", ta, [{ label: "取消" }, { label: "填入", primary: true, onClick: function (close) {
              ta.value.split(/\n+/).forEach(function (line) {
                var m = line.trim().split(/[\s,，\t]+/);
                if (m.length >= 2 && inputs[parseInt(m[0], 10)]) inputs[parseInt(m[0], 10)].value = parseInt(m[1], 10);
              });
              close(); UI.toast("已填入，请点击右上角保存");
            } }]);
          } }, "批量粘贴")
        ])),
        el("div", { style: "overflow:auto;max-width:900px" }, table)
      ]));
    }).catch(err);
  }

  // ---------------- 评委入口二维码 ----------------
  function qrPage() {
    var base = (APP_CONFIG.SITE_URL || location.origin);
    var cards = GROUPS.map(function (g) {
      var url = base + "/#/judge?g=" + g;
      var box = el("div", { id: "qr-" + g, style: "width:170px;height:170px;margin:14px auto 0;background:#fff;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#05091a;font-size:12px;padding:8px" }, "二维码生成中…");
      return el("div.card", { style: "padding:20px;text-align:center;border-color:rgba(232,180,85,.4)" }, [
        el("div", { style: "font-size:26px;font-weight:800;color:#F7DFA5" }, g + " 组"),
        box,
        el("div.mono", { style: "font-size:11px;color:#7286B4;margin-top:12px;word-break:break-all" }, url)
      ]);
    });
    mount(shell("评委入口二维码", "每组一个二维码，扫码即锁定组别；评委只需从名单中选姓名，无需验证码。名单调整无需换码",
      [el("button.btn-sm", { onclick: function () { window.print(); } }, "打印")], [
      navTabs("评委入口二维码"),
      el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px" }, cards),
      el("div", { style: "font-size:12px;color:#7286B4;margin-top:18px" },
        "如二维码未显示（无外网 CDN），可用任意二维码工具对上面的网址生成，或直接把网址发到评委群。")
    ]));
    var lib = document.createElement("script");
    lib.src = "https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js";
    lib.onload = function () {
      GROUPS.forEach(function (g) {
        var host = document.getElementById("qr-" + g);
        if (!host) return;
        host.innerHTML = "";
        new window.QRCode(host, { text: base + "/#/judge?g=" + g, width: 154, height: 154,
          colorDark: "#05091a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
      });
    };
    lib.onerror = function () {
      GROUPS.forEach(function (g) {
        var host = document.getElementById("qr-" + g);
        if (host) host.textContent = "请用二维码工具生成下方网址";
      });
    };
    document.head.appendChild(lib);
  }

  // ---------------- 操作日志 / 导出 ----------------
  function auditPage() {
    loading();
    API.audit(need()).then(function (rows) {
      mount(shell("操作日志", "管理员的每一次关键修改都有留痕", [], [
        navTabs("操作日志"),
        el("div", { style: "overflow:auto" }, el("table", {}, [
          el("thead", {}, el("tr", {}, ["时间", "操作", "对象", "修改前", "修改后"].map(function (h) { return el("th", {}, h); }))),
          el("tbody", {}, rows.map(function (r) {
            return el("tr", {}, [
              el("td.mono", { style: "white-space:nowrap;color:#B9C6E6" }, new Date(r.created_at).toLocaleString("zh-CN")),
              el("td", { style: "color:#F7DFA5" }, r.action),
              el("td", { style: "color:#8FA0C8" }, r.entity_type || "—"),
              el("td", { style: "font-size:11.5px;color:#7286B4;max-width:300px;word-break:break-all" }, r.before_value ? JSON.stringify(r.before_value).slice(0, 160) : "—"),
              el("td", { style: "font-size:11.5px;color:#B9C6E6;max-width:300px;word-break:break-all" }, r.after_value ? JSON.stringify(r.after_value).slice(0, 160) : "—")
            ]);
          }))
        ]))
      ]));
    }).catch(err);
  }

  function exportPage() {
    loading();
    API.exportAll(need()).then(function (d) {
      mount(shell("导出", "最终结果与全部评分明细", [], [
        navTabs("导出"),
        el("div", { style: "display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px" }, [
          el("button.btn-sm.gold", { onclick: function () {
            UI.csv(d.results, [{ k: "group", t: "组别" }, { k: "case_number", t: "案例号" }, { k: "district", t: "大区" },
              { k: "participant", t: "参赛者" }, { k: "case_name", t: "案例名" }, { k: "public_rank", t: "大众排名" },
              { k: "judge_avg", t: "评委均分" }, { k: "judge_rank", t: "评委排名" }, { k: "weighted_score", t: "加权分" },
              { k: "final_rank", t: "最终排名" }, { k: "submission_count", t: "提交人数" }], "最终结果.csv");
          } }, "下载最终结果 CSV"),
          el("button.btn-sm", { onclick: function () {
            UI.csv(d.details, [{ k: "group", t: "组别" }, { k: "case_number", t: "案例号" }, { k: "participant", t: "参赛者" },
              { k: "judge", t: "评委" }, { k: "role", t: "角色" }, { k: "dimension", t: "评分项" }, { k: "score", t: "分数" },
              { k: "total", t: "总分" }, { k: "status", t: "状态" }, { k: "submitted_at", t: "提交时间" }], "评分明细.csv");
          } }, "下载评分明细 CSV")
        ]),
        el("div", { style: "font-size:12px;color:#7286B4" }, "共 " + d.results.length + " 条结果记录、" + d.details.length + " 条明细记录（CSV 带 BOM，Excel 直接打开不乱码）。")
      ]));
    }).catch(err);
  }

  // ---------------- 最终排名大屏 ----------------
  function resultsPage(code) {
    loading();
    API.results(need(), code).then(function (d) {
      var rows = d.rows.filter(function (r) { return r.final_rank; });
      var top = rows.slice(0, 3), rest = rows.slice(3);
      function stat(l, v, hot) {
        return el("div", { style: "flex:1" }, [
          el("div", { style: "font-size:10.5px;color:#8FA0C8" }, l),
          el("div.mono", { style: "font-size:" + (hot ? 18 : 16) + "px;color:" + (hot ? "#FFF3D2" : "#F7DFA5") + ";margin-top:2px" }, v === null || v === undefined ? "—" : v)
        ]);
      }
      function card(r, place) {
        var first = place === 1;
        return el("div", {
          style: "width:" + (first ? 400 : 320) + "px;border:1px solid " + (first ? "rgba(247,223,165,.75)" : "rgba(232,180,85,.4)") +
            ";border-radius:6px;background:linear-gradient(180deg," + (first ? "rgba(247,223,165,.22)" : "rgba(232,180,85,.1)") +
            ",rgba(18,42,94,.7));padding:" + (first ? "22px" : "18px") + ";text-align:center" + (first ? ";animation:pulse 3.2s ease-in-out infinite" : "")
        }, [
          el("div", { class: "twk", style: "font-size:" + (first ? 22 : 14) + "px;color:" + (first ? "#FFF3D2" : "#E8B455") }, "✦"),
          el("div", { style: "font-size:" + (first ? 13 : 12) + "px;letter-spacing:.32em;color:" + (first ? "#FFF3D2" : "#E8B455") + ";margin-top:4px" },
            ["第 一 名", "第 二 名", "第 三 名"][place - 1]),
          el("div", { class: first ? "mono glow" : "mono", style: "font-size:" + (first ? 66 : 44) + "px;color:" + (first ? "#FFF3D2" : "#F7DFA5") + ";line-height:1;margin-top:4px" }, String(place)),
          el("div", { style: "font-size:12px;color:#B9C6E6;margin-top:8px" }, "CASE " + pad(r.case_number) + (r.district ? " · " + r.district : "")),
          el("div", { style: "font-size:" + (first ? 31 : 23) + "px;font-weight:800;color:" + (first ? "#FFF3D2" : "#F7DFA5") + ";margin-top:6px" }, r.participant_name),
          el("div", { style: "font-size:" + (first ? 17 : 14) + "px;margin-top:7px;line-height:1.4" }, r.case_name),
          el("div", { style: "display:flex;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(232,180,85,.25)" },
            [stat("大众排名", r.public_rank, first), stat("评委排名", r.judge_rank, first), stat("评委均分", fmt(r.judge_avg), first)])
        ]);
      }
      var listHead = el("div", { style: "display:flex;align-items:baseline;gap:16px;padding:0 14px 5px;font-size:11.5px;color:#7286B4;border-bottom:1px solid rgba(232,180,85,.25)" }, [
        el("span", { style: "width:32px;text-align:right" }, "名次"), el("span", { style: "width:30px;text-align:right" }, "案例"),
        el("span", { style: "width:110px" }, "参赛者"), el("span", { style: "flex:1" }, "案例名"),
        el("span", { style: "width:56px;text-align:right" }, "大众排名"), el("span", { style: "width:56px;text-align:right" }, "评委排名"),
        el("span", { style: "width:64px;text-align:right" }, "评委均分")
      ]);
      var list = rest.map(function (r) {
        return el("div", { style: "display:flex;align-items:baseline;gap:16px;padding:7px 14px;border-bottom:1px solid rgba(147,168,214,.14)" }, [
          el("span.mono", { style: "width:32px;text-align:right;font-size:20px;color:#F7DFA5" }, r.final_rank),
          el("span.mono", { style: "width:30px;text-align:right;font-size:14px;color:#8FA0C8" }, pad(r.case_number)),
          el("span", { style: "width:110px;font-size:16px;font-weight:500" }, r.participant_name),
          el("span", { style: "flex:1;min-width:0;font-size:15px;color:#B9C6E6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, r.case_name),
          el("span.mono", { style: "width:56px;text-align:right;font-size:14.5px;color:#B9C6E6" }, r.public_rank || "—"),
          el("span.mono", { style: "width:56px;text-align:right;font-size:14.5px;color:#B9C6E6" }, r.judge_rank || "—"),
          el("span.mono", { style: "width:64px;text-align:right;font-size:15px;color:#F7DFA5" }, fmt(r.judge_avg))
        ]);
      });

      var stage = el("div", { style: "position:relative;min-height:100vh;padding:26px 32px 40px;background:radial-gradient(120% 70% at 50% 0%,#1c3f86,#0c1a40 45%,#05091a)" }, [
        el("div.noprint", { style: "position:absolute;top:16px;right:20px;display:flex;gap:8px;z-index:3" }, [
          el("button.btn-sm", { onclick: function () { go("#/admin/group/" + code); } }, "返回"),
          el("button.btn-sm", { onclick: function () {
            var d = document.documentElement;
            if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen();
            else if (document.exitFullscreen) document.exitFullscreen();
          } }, "全屏"),
          el("button.btn-sm.gold", { onclick: function () { UI.confetti(stage, 60); } }, "再撒一次花")
        ]),
        el("div", { style: "text-align:center;position:relative;z-index:2" }, [
          el("div", { class: "shimmer glow", style: "display:inline-block;font-size:22px;font-weight:700;letter-spacing:.22em" }, "寻找你的那颗星"),
          el("div", { style: "font-size:44px;font-weight:800;margin-top:12px;color:#F7DFA5" }, code + "组 · 最终排名"),
          el("div", { style: "font-size:14px;color:#B9C6E6;margin-top:8px" },
            "【逐光行动 · 点亮星河】案例孵化大赛 · 初赛 · " + d.group.track + " · 大众投票排名 30% + 评委评分排名 70%")
        ]),
        el("div", { style: "position:relative;z-index:2;display:flex;align-items:flex-end;justify-content:center;gap:16px;margin-top:22px;flex-wrap:wrap" },
          [top[1] ? card(top[1], 2) : null, top[0] ? card(top[0], 1) : null, top[2] ? card(top[2], 3) : null]),
        el("div", { style: "position:relative;z-index:2;max-width:1000px;margin:22px auto 0" }, [listHead].concat(list)),
        el("div", { style: "position:relative;z-index:2;display:flex;justify-content:space-between;margin:18px auto 0;max-width:1000px;font-size:12px;color:#7286B4" }, [
          el("div", {}, "共 " + rows.length + " 个案例 · " + (STATUS_CN[d.group.status] || d.group.status) +
            (d.group.finalized_at ? " · " + new Date(d.group.finalized_at).toLocaleString("zh-CN") : "")),
          el("div", { style: "letter-spacing:.14em" }, "让优秀被看见 · 让经验被连接")
        ]),
        rows.length ? null : el("div", { style: "text-align:center;color:#E8B455;margin-top:60px" }, "尚无可公布的排名：请先完成评分并填写大众排名")
      ]);
      mount(stage);
      if (rows.length) UI.confetti(stage, 50);
    }).catch(function (e) { if (/密码/.test(e.message)) { CODE = null; store.del("admin_code"); login(); } else err(e); });
  }

  // ---------------- 路由 ----------------
  function route() {
    var h = location.hash.replace(/^#\/?/, "");
    if (!need()) return login();
    var m;
    if ((m = h.match(/^admin\/group\/([ABCD])/i))) return groupPage(m[1].toUpperCase());
    if ((m = h.match(/^admin\/results\/([ABCD])/i))) return resultsPage(m[1].toUpperCase());
    if (/^admin\/cases/.test(h)) return casesPage();
    if (/^admin\/judges/.test(h)) return judgesPage();
    if (/^admin\/public-ranking/.test(h)) return publicRankPage();
    if (/^admin\/qr/.test(h)) return qrPage();
    if (/^admin\/audit/.test(h)) return auditPage();
    if (/^admin\/export/.test(h)) return exportPage();
    return overview();
  }

  window.AdminApp = { route: route };
})();
