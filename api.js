// Supabase RPC 调用（纯 fetch，无第三方依赖，微信内置浏览器友好）
(function () {
  var C = window.APP_CONFIG;

  function rpc(fn, args, tries) {
    tries = tries === undefined ? 2 : tries;
    return fetch(C.SUPABASE_URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": C.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + C.SUPABASE_ANON_KEY
      },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
        if (!r.ok) {
          var msg = (d && (d.message || d.hint || d.details)) || ("网络错误 " + r.status);
          throw new Error(String(msg).replace(/^.*?:\s*/, ""));
        }
        return d;
      });
    }).catch(function (err) {
      if (tries > 0 && /Failed to fetch|NetworkError|Load failed/i.test(err.message)) {
        return new Promise(function (res) { setTimeout(res, 900); }).then(function () {
          return rpc(fn, args, tries - 1);
        });
      }
      throw err;
    });
  }

  window.API = {
    rpc: rpc,
    // 评委端
    judgeBootstrap: function (g) { return rpc("judge_bootstrap", { p_group_code: g }); },
    judgePulse: function (g) { return rpc("judge_pulse", { p_group_code: g }); },
    myScores: function (id) { return rpc("judge_my_scores", { p_judge_id: id }); },
    saveScore: function (jid, cid, details, submit) {
      return rpc("judge_save_score", { p_judge_id: jid, p_case_id: cid, p_details: details, p_submit: !!submit });
    },
    // 管理端（每次带管理密码）
    adminLogin: function (code) { return rpc("admin_login", { p_code: code }); },
    overview: function (c) { return rpc("admin_overview", { p_code: c }); },
    groupDetail: function (c, g) { return rpc("admin_group_detail", { p_code: c, p_group_code: g }); },
    scoreDetail: function (c, j, cs) { return rpc("admin_score_detail", { p_code: c, p_judge_id: j, p_case_id: cs }); },
    updateScore: function (c, j, cs, d) { return rpc("admin_update_score", { p_code: c, p_judge_id: j, p_case_id: cs, p_details: d }); },
    deleteScore: function (c, j, cs) { return rpc("admin_delete_score", { p_code: c, p_judge_id: j, p_case_id: cs }); },
    setCurrentCase: function (c, g, id) { return rpc("admin_set_current_case", { p_code: c, p_group_code: g, p_case_id: id }); },
    setGroupStatus: function (c, g, s) { return rpc("admin_set_group_status", { p_code: c, p_group_code: g, p_status: s }); },
    saveCase: function (c, obj) { return rpc("admin_save_case", { p_code: c, p_case: obj }); },
    setCaseActive: function (c, id, a) { return rpc("admin_set_case_active", { p_code: c, p_case_id: id, p_active: a }); },
    saveJudge: function (c, obj) { return rpc("admin_save_judge", { p_code: c, p_judge: obj }); },
    deleteJudge: function (c, id) { return rpc("admin_delete_judge", { p_code: c, p_judge_id: id }); },
    setPublicRanks: function (c, g, r) { return rpc("admin_set_public_ranks", { p_code: c, p_group_code: g, p_ranks: r }); },
    precheck: function (c, g) { return rpc("admin_precheck", { p_code: c, p_group_code: g }); },
    finalize: function (c, g, force) { return rpc("admin_finalize", { p_code: c, p_group_code: g, p_force: !!force }); },
    unlock: function (c, g) { return rpc("admin_unlock", { p_code: c, p_group_code: g }); },
    results: function (c, g) { return rpc("admin_results", { p_code: c, p_group_code: g }); },
    audit: function (c) { return rpc("admin_audit", { p_code: c, p_limit: 300 }); },
    exportAll: function (c) { return rpc("admin_export", { p_code: c }); }
  };
})();
