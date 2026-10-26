/* ==========================================================================
   Painel do funil (quiz do MPR)
   Lê a aba "Quiz" da planilha pelo Apps Script (protegido por senha) e calcula tudo no navegador.
   /painel?demo=1 mostra dados de exemplo (fictícios) só para conferir o visual.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var D = window.QUIZ_DATA || { questions: [] };
  var endpoint = (CFG.form || {}).endpoint;
  var DEMO = /[?&]demo=1\b/.test(location.search);
  var STORE = "vg_painel";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Cores das séries (validadas para fundo escuro: separação para daltonismo e contraste)
  var SERIES = [
    { key: "visitantes", label: "Visitantes", color: "#3987e5" },
    { key: "iniciaram", label: "Iniciaram", color: "#d95926" },
    { key: "oferta", label: "Viram a oferta", color: "#199e70" },
    { key: "checkout", label: "Checkout", color: "#c98500" }
  ];
  var DEVICE_COLORS = ["#3987e5", "#d95926", "#199e70"];

  /* ───────────── Etapas do quiz (mesma ordem do quiz.js) ───────────── */

  var Q = D.questions || [];
  var QSHORT = { idade: "Idade", experiencia: "Experiência", rosto: "Sem aparecer", tempo: "Tempo/dia", situacao: "Situação", meta: "Meta", disposicao: "Disposição" };
  var base = Q.length;
  var IDX = { about: base + 1, loading: base + 2, result: base + 3, gift: base + 4, bonus: base + 5, offer: base + 6 };
  var LAST = IDX.offer;
  var STEPS = [{ i: 0, label: "Início", kind: "click" }]
    .concat(Q.map(function (q, n) { return { i: n + 1, label: "P" + (n + 1) + " · " + (QSHORT[q.key] || q.key), kind: "answer", key: q.key }; }))
    .concat([
      { i: IDX.about, label: "Apresentação", kind: "click" },
      { i: IDX.loading, label: "Análise", kind: "auto" },
      { i: IDX.result, label: "Resultado", kind: "click" },
      { i: IDX.gift, label: "Presente", kind: "click" },
      { i: IDX.bonus, label: "Bônus", kind: "click" },
      { i: IDX.offer, label: "Oferta", kind: "offer" }
    ]);

  var state = { senha: "", dias: 1, tab: "performance", all: [], cur: [], prev: [], now: new Date(), shown: 150, search: "" };

  /* ───────────── Formatação ───────────── */

  var nf = new Intl.NumberFormat("pt-BR");
  function num(n) { return nf.format(Math.round(n)); }
  function pct(n, d, digits) { return d ? (n / d * 100).toFixed(digits == null ? 1 : digits).replace(".", ",") + "%" : "—"; }
  function dur(s) {
    if (!s) return "0s";
    s = Math.round(s);
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + "m " + ("0" + r).slice(-2) + "s" : r + "s";
  }
  function pad(n) { return ("0" + n).slice(-2); }
  function dateTime(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mean(arr) { return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : 0; }

  /* ───────────── Dados ───────────── */

  function parse(r) {
    var o = {
      id: String(r.id || ""),
      inicio: new Date(r.inicio),
      disp: r.dispositivo || "—",
      max: Number(r.etapa_max) || 0,
      checkout: String(r.checkout || ""),
      dur: Number(r.duracao_s) || 0,
      src: String(r.utm_source || ""),
      med: String(r.utm_medium || ""),
      camp: String(r.utm_campaign || ""),
      ref: String(r.referrer || "")
    };
    try { o.resp = typeof r.respostas === "string" ? JSON.parse(r.respostas || "{}") : (r.respostas || {}); } catch (e) { o.resp = {}; }
    o.origem = origin(o);
    return o;
  }

  function origin(o) {
    if (o.src) return o.src + (o.med ? " / " + o.med : "");
    if (o.ref && o.ref !== "direto") {
      try { return new URL(o.ref).hostname.replace(/^www\./, ""); } catch (e) { /* ignore */ }
    }
    return "Direto";
  }

  function split() {
    var cut = state.now.getTime() - state.dias * 86400000;
    var prevCut = cut - state.dias * 86400000;
    state.cur = state.all.filter(function (o) { return o.inicio.getTime() >= cut; });
    state.prev = state.all.filter(function (o) { var t = o.inicio.getTime(); return t >= prevCut && t < cut; });
  }

  function metrics(list) {
    var started = list.filter(function (o) { return o.max >= 1; });
    return {
      visits: list.length,
      started: started.length,
      answered: list.filter(function (o) { return o.max >= IDX.about; }).length,
      offer: list.filter(function (o) { return o.max >= LAST; }).length,
      checkout: list.filter(function (o) { return o.checkout; }).length,
      avgSteps: mean(started.map(function (o) { return Math.min(o.max, LAST) + 1; })),
      avgTime: mean(started.map(function (o) { return o.dur; }))
    };
  }

  function reach(list, i) { return list.filter(function (o) { return o.max >= i; }).length; }

  /* ───────────── Comunicação com o Apps Script ───────────── */

  function request(params) {
    var body = new URLSearchParams(params);
    return fetch(endpoint, { method: "POST", body: body, headers: { Accept: "application/json" }, redirect: "follow" })
      .then(function (r) { return r.json(); });
  }

  function load() {
    status("Carregando dados…");
    if (DEMO) {
      state.now = new Date();
      state.all = demoRows();
      return Promise.resolve(done("Dados de exemplo (fictícios) — só para visualizar o layout."));
    }
    return request({ action: "stats", senha: state.senha, dias: state.dias })
      .then(function (res) {
        if (!res || res.ok !== true) {
          var err = res && res.error;
          if (err === "senha_invalida") return showLogin("Senha incorreta.");
          if (err === "senha_nao_configurada") return showLogin("A senha do painel ainda não foi configurada no Apps Script (propriedade PAINEL_SENHA).");
          throw new Error(err || "Resposta inválida");
        }
        state.now = new Date(res.agora);
        state.all = (res.rows || []).map(parse).filter(function (o) { return o.id && !isNaN(o.inicio); });
        done("");
      })
      .catch(function (e) {
        if (window.console) console.error("[painel]", e);
        status("Não foi possível carregar os dados. Verifique sua conexão e clique em atualizar.", true);
      });
  }

  function done(msg) {
    split();
    status(msg, false, !!msg);
    renderAll();
  }

  function status(msg, isError, keep) {
    var el = $("#status");
    el.textContent = msg || "";
    el.className = "pn-status" + (isError ? " is-error" : "") + (DEMO ? " is-demo" : "");
    el.hidden = !msg;
    if (!isError && !keep && msg) { /* mensagem de carregamento some ao terminar */ }
  }

  /* ───────────── Login ───────────── */

  function showLogin(msg) {
    $("#app").hidden = true;
    $("#login").hidden = false;
    var err = $("#login-error");
    err.textContent = msg || "";
    err.hidden = !msg;
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    $("#senha").focus();
  }

  function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    state.senha = $("#senha").value;
    var btn = $("#login-form .btn");
    btn.disabled = true;
    request({ action: "stats", senha: state.senha, dias: state.dias })
      .then(function (res) {
        btn.disabled = false;
        if (!res || res.ok !== true) {
          var err = res && res.error;
          showLogin(err === "senha_nao_configurada"
            ? "A senha do painel ainda não foi configurada no Apps Script (propriedade PAINEL_SENHA)."
            : "Senha incorreta.");
          return;
        }
        if ($("#lembrar").checked) { try { localStorage.setItem(STORE, state.senha); } catch (e2) { /* ignore */ } }
        showApp();
        state.now = new Date(res.agora);
        state.all = (res.rows || []).map(parse).filter(function (o) { return o.id && !isNaN(o.inicio); });
        done("");
      })
      .catch(function () {
        btn.disabled = false;
        showLogin("Não foi possível conectar. Verifique sua internet.");
      });
  });

  $("#logout").addEventListener("click", function () {
    state.senha = "";
    $("#senha").value = "";
    showLogin("");
  });

  /* ───────────── Controles ───────────── */

  $$(".pn-tab").forEach(function (t) {
    t.addEventListener("click", function () {
      state.tab = t.getAttribute("data-tab");
      $$(".pn-tab").forEach(function (x) { var on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on); });
      $("#view-performance").hidden = state.tab !== "performance";
      $("#view-respostas").hidden = state.tab !== "respostas";
      renderAll();
    });
  });

  $$(".pn-seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      state.dias = +b.getAttribute("data-dias");
      $$(".pn-seg button").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      state.shown = 150;
      load();
    });
  });

  $("#refresh").addEventListener("click", function () { load(); });
  $("#search").addEventListener("input", function (e) { state.search = e.target.value.trim().toLowerCase(); state.shown = 150; renderResponses(); });
  $("#more").addEventListener("click", function () { state.shown += 150; renderResponses(); });
  $("#export").addEventListener("click", exportCsv);

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (state.tab === "performance") renderTraffic(); }, 150);
  });

  /* ───────────── Render ───────────── */

  function renderAll() {
    if (state.tab === "performance") {
      renderKpis();
      renderFunnel();
      renderTraffic();
      renderCampaigns();
      renderDevices();
    } else {
      renderResponses();
      renderSummary();
    }
  }

  function delta(cur, prev, invert) {
    if (!prev) return '<span class="pn-delta is-flat">sem comparação</span>';
    var d = (cur - prev) / prev * 100;
    var up = d >= 0;
    var good = invert ? !up : up;
    return '<span class="pn-delta ' + (Math.abs(d) < 0.05 ? "is-flat" : good ? "is-up" : "is-down") + '">' +
      (up ? "▲ +" : "▼ ") + d.toFixed(1).replace(".", ",") + "%</span> vs período anterior";
  }

  function renderKpis() {
    var m = metrics(state.cur), p = metrics(state.prev);
    var cards = [
      { label: "Visitas", value: num(m.visits), d: delta(m.visits, p.visits) },
      { label: "Iniciaram o quiz", value: num(m.started), sub: pct(m.started, m.visits) + " das visitas", d: delta(m.started, p.started) },
      { label: "Média de etapas", value: m.started ? m.avgSteps.toFixed(1).replace(".", ",") + "<small>/" + (LAST + 1) + "</small>" : "—", d: delta(m.avgSteps, p.avgSteps) },
      { label: "Tempo médio", value: m.started ? dur(m.avgTime) : "—", d: delta(m.avgTime, p.avgTime) },
      { label: "Cliques no checkout", value: num(m.checkout), sub: pct(m.checkout, m.visits) + " das visitas", d: delta(m.checkout, p.checkout), hero: true }
    ];
    $("#kpis").innerHTML = cards.map(function (c) {
      return '<div class="pn-kpi' + (c.hero ? " pn-kpi--hero" : "") + '"><span class="pn-kpi__label">' + c.label + "</span>" +
        '<strong class="pn-kpi__value">' + c.value + "</strong>" +
        (c.sub ? '<span class="pn-kpi__sub">' + c.sub + "</span>" : "") +
        '<span class="pn-kpi__delta">' + c.d + "</span></div>";
    }).join("");
  }

  function renderFunnel() {
    var m = metrics(state.cur), p = metrics(state.prev);
    $("#funnel-top").innerHTML =
      '<div><span class="pn-kpi__label">Concluíram o quiz</span><strong>' + pct(m.offer, m.visits) + "</strong>" +
      '<span class="pn-kpi__delta">' + delta(m.visits ? m.offer / m.visits : 0, p.visits ? p.offer / p.visits : 0) + "</span></div>" +
      '<div><span class="pn-kpi__label">Taxa de checkout</span><strong>' + pct(m.checkout, m.visits) + "</strong>" +
      '<span class="pn-kpi__delta">' + delta(m.visits ? m.checkout / m.visits : 0, p.visits ? p.checkout / p.visits : 0) + "</span></div>";

    var stages = [
      ["Visitantes", m.visits],
      ["Iniciaram o quiz", m.started],
      ["Responderam as " + Q.length + " perguntas", m.answered],
      ["Viram a oferta", m.offer],
      ["Clicaram no checkout", m.checkout]
    ];
    if (!m.visits) {
      $("#funnel").innerHTML = empty();
      $("#funnel-insight").textContent = "";
      return;
    }
    $("#funnel").innerHTML = stages.map(function (s, i) {
      var w = Math.max(s[1] / m.visits * 100, s[1] ? 2 : 0);
      var prevV = i ? stages[i - 1][1] : 0;
      var drop = i && prevV ? Math.round((1 - s[1] / prevV) * 100) : null;
      return '<div class="pn-fstage" data-tip="' + esc(s[0] + ": " + num(s[1]) + " (" + pct(s[1], m.visits) + " dos visitantes)") + '">' +
        '<div class="pn-fstage__row"><span>' + s[0] + "</span><strong>" + num(s[1]) + ' <em>' + pct(s[1], m.visits, 0) + "</em></strong></div>" +
        '<div class="pn-fbar"><i style="width:' + w + '%"></i></div>' +
        (drop != null && drop > 0 ? '<span class="pn-fstage__drop">−' + drop + "% em relação à etapa anterior</span>" : "") +
        "</div>";
    }).join("");
    bindTips($("#funnel"));

    // Etapa com maior abandono (entre quem chegou nela)
    var worst = null;
    STEPS.forEach(function (st, k) {
      if (k === STEPS.length - 1 || st.kind === "auto") return;
      var here = reach(state.cur, st.i);
      var next = reach(state.cur, STEPS[k + 1].i);
      if (here < 3) return;
      var rate = 1 - next / here;
      if (!worst || rate > worst.rate) worst = { st: st, rate: rate, left: here - next };
    });
    $("#funnel-insight").innerHTML = worst && worst.left > 0
      ? "⚠️ Maior abandono em <strong>" + esc(worst.st.label) + "</strong>: " + pct(worst.rate, 1, 0) + " de quem chegou ali saiu (" + num(worst.left) + " pessoas)."
      : "";
  }

  /* Gráfico de linhas do tráfego (SVG, sem bibliotecas) */
  function buckets() {
    var out = [];
    var now = new Date(state.now);
    if (state.dias === 1) {
      var h = new Date(now); h.setMinutes(0, 0, 0);
      for (var i = 23; i >= 0; i--) {
        var s = new Date(h.getTime() - i * 3600000);
        out.push({ start: s.getTime(), end: s.getTime() + 3600000, label: pad(s.getHours()) + "h" });
      }
    } else {
      var d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      for (var j = state.dias - 1; j >= 0; j--) {
        var ds = new Date(d0); ds.setDate(d0.getDate() - j);
        var de = new Date(ds); de.setDate(ds.getDate() + 1);
        out.push({ start: ds.getTime(), end: de.getTime(), label: pad(ds.getDate()) + "/" + pad(ds.getMonth() + 1) });
      }
    }
    out.forEach(function (b) {
      var inB = state.cur.filter(function (o) { var t = o.inicio.getTime(); return t >= b.start && t < b.end; });
      b.visitantes = inB.length;
      b.iniciaram = inB.filter(function (o) { return o.max >= 1; }).length;
      b.oferta = inB.filter(function (o) { return o.max >= LAST; }).length;
      b.checkout = inB.filter(function (o) { return o.checkout; }).length;
    });
    return out;
  }

  function niceMax(v) {
    if (v <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  function renderTraffic() {
    var box = $("#traffic");
    var B = buckets();
    var totals = {};
    SERIES.forEach(function (s) { totals[s.key] = B.reduce(function (a, b) { return a + b[s.key]; }, 0); });
    $("#traffic-legend").innerHTML = SERIES.map(function (s) {
      return '<span class="pn-legend__item"><i style="background:' + s.color + '"></i>' + s.label + " <strong>" + num(totals[s.key]) + "</strong></span>";
    }).join("");
    $("#traffic-scale").textContent = state.dias === 1 ? "por hora" : "por dia";

    if (!state.cur.length) { box.innerHTML = empty(); return; }

    var W = Math.max(box.clientWidth, 280), H = 260;
    var m = { l: 34, r: 14, t: 12, b: 26 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var maxV = niceMax(Math.max.apply(null, B.map(function (b) { return b.visitantes; })));
    var x = function (i) { return m.l + (B.length === 1 ? iw / 2 : i * iw / (B.length - 1)); };
    var y = function (v) { return m.t + ih - v / maxV * ih; };

    var grid = "";
    for (var g = 0; g <= 4; g++) {
      var gv = maxV * g / 4;
      grid += '<line class="pn-grid-line" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(gv) + '" y2="' + y(gv) + '"/>' +
        '<text class="pn-axis" x="' + (m.l - 8) + '" y="' + (y(gv) + 4) + '" text-anchor="end">' + num(gv) + "</text>";
    }
    var every = Math.ceil(B.length / Math.max(2, Math.floor(iw / 56)));
    var xl = B.map(function (b, i) {
      return i % every === 0 || i === B.length - 1
        ? '<text class="pn-axis" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + b.label + "</text>" : "";
    }).join("");

    var lines = SERIES.map(function (s) {
      var d = B.map(function (b, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(b[s.key]).toFixed(1); }).join(" ");
      return '<path class="pn-line" d="' + d + '" stroke="' + s.color + '"/>';
    }).join("");

    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Gráfico de tráfego">' +
      grid + xl + lines +
      '<line class="pn-cross" id="cross" y1="' + m.t + '" y2="' + (m.t + ih) + '" visibility="hidden"/>' +
      '<g id="cross-dots"></g>' +
      '<rect class="pn-hit" x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '"/></svg>';

    var svg = $("svg", box), cross = $("#cross", box), dots = $("#cross-dots", box), hit = $(".pn-hit", box);
    function move(ev) {
      var r = svg.getBoundingClientRect();
      var px = (ev.clientX - r.left) * (W / r.width);
      var i = Math.max(0, Math.min(B.length - 1, Math.round((px - m.l) / (iw / Math.max(1, B.length - 1)))));
      var b = B[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      dots.innerHTML = SERIES.map(function (s) {
        return '<circle cx="' + x(i) + '" cy="' + y(b[s.key]) + '" r="4.5" fill="' + s.color + '" class="pn-dot"/>';
      }).join("");
      showTip(ev.clientX, ev.clientY, "<strong>" + b.label + "</strong>" + SERIES.map(function (s) {
        return '<span><i style="background:' + s.color + '"></i>' + s.label + ": " + num(b[s.key]) + "</span>";
      }).join(""));
    }
    function leave() { cross.setAttribute("visibility", "hidden"); dots.innerHTML = ""; hideTip(); }
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerdown", move);
    hit.addEventListener("pointerleave", leave);
  }

  function renderCampaigns() {
    var groups = {};
    state.cur.forEach(function (o) {
      var k = o.origem + (o.camp ? " · " + o.camp : "");
      var g = groups[k] || (groups[k] = { name: k, visits: 0, started: 0, offer: 0, checkout: 0 });
      g.visits++;
      if (o.max >= 1) g.started++;
      if (o.max >= LAST) g.offer++;
      if (o.checkout) g.checkout++;
    });
    var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.visits - a.visits; });
    var tracked = state.cur.filter(function (o) { return o.src; }).length;
    var best = list.filter(function (g) { return g.visits >= 3 && g.checkout; })
      .sort(function (a, b) { return b.checkout / b.visits - a.checkout / a.visits; })[0];

    $("#campaign-top").innerHTML =
      '<div><span class="pn-kpi__label">Visitas com UTM</span><strong>' + num(tracked) + " <em>" + pct(tracked, state.cur.length, 0) + "</em></strong></div>" +
      '<div><span class="pn-kpi__label">Melhor origem (conversão)</span><strong>' + (best ? esc(best.name) + " <em>" + pct(best.checkout, best.visits) + "</em>" : "—") + "</strong></div>";

    if (!list.length) { $("#campaigns").innerHTML = "<tbody><tr><td>" + empty() + "</td></tr></tbody>"; return; }
    $("#campaigns").innerHTML = "<thead><tr><th>Origem</th><th>Visitas</th><th>Iniciaram</th><th>Viram oferta</th><th>Checkout</th><th>Conversão</th></tr></thead><tbody>" +
      list.map(function (g) {
        return "<tr><td>" + esc(g.name) + "</td><td>" + num(g.visits) + "</td><td>" + num(g.started) + "</td><td>" + num(g.offer) +
          "</td><td>" + num(g.checkout) + "</td><td><strong>" + pct(g.checkout, g.visits) + "</strong></td></tr>";
      }).join("") + "</tbody>";
  }

  function renderDevices() {
    var box = $("#devices");
    var counts = {};
    state.cur.forEach(function (o) { counts[o.disp] = (counts[o.disp] || 0) + 1; });
    var list = Object.keys(counts).map(function (k) { return { name: k, n: counts[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var total = state.cur.length;
    if (!total) { box.innerHTML = empty(); return; }

    var R = 64, C = 2 * Math.PI * R, offset = 0;
    var segs = list.map(function (d, i) {
      var len = d.n / total * C;
      var gap = list.length > 1 ? 2 : 0;
      var s = '<circle class="pn-donut__seg" r="' + R + '" cx="90" cy="90" stroke="' + DEVICE_COLORS[i % 3] + '" stroke-dasharray="' +
        Math.max(0, len - gap) + " " + (C - Math.max(0, len - gap)) + '" stroke-dashoffset="' + (-offset) + '" data-tip="' +
        esc(d.name + ": " + num(d.n) + " (" + pct(d.n, total) + ")") + '"/>';
      offset += len;
      return s;
    }).join("");

    box.innerHTML = '<div class="pn-devices__top"><span class="pn-kpi__label">Mais usado</span><strong>' + esc(list[0].name) + "</strong></div>" +
      '<div class="pn-devices__body"><svg class="pn-donut" viewBox="0 0 180 180" role="img" aria-label="Visitas por dispositivo">' +
      '<g transform="rotate(-90 90 90)">' + segs + "</g>" +
      '<text x="90" y="86" text-anchor="middle" class="pn-donut__total">' + num(total) + '</text><text x="90" y="106" text-anchor="middle" class="pn-axis">visitas</text></svg>' +
      '<ul class="pn-devices__list">' + list.map(function (d, i) {
        return '<li><i style="background:' + DEVICE_COLORS[i % 3] + '"></i><span>' + esc(d.name) + "</span><strong>" + pct(d.n, total, 0) + "</strong><em>" + num(d.n) + "</em></li>";
      }).join("") + "</ul></div>";
    bindTips(box);
  }

  /* ───────────── Respostas ───────────── */

  var TABLE_STEPS = STEPS.filter(function (s) { return s.kind !== "auto"; });

  function filtered() {
    var q = state.search;
    return state.cur.slice().sort(function (a, b) { return b.inicio - a.inicio; }).filter(function (o) {
      return !q || o.id.toLowerCase().indexOf(q) > -1 || o.origem.toLowerCase().indexOf(q) > -1;
    });
  }

  function ring(p) {
    var r = 8, c = 2 * Math.PI * r;
    return '<svg class="pn-ring" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="' + r + '" class="pn-ring__bg"/>' +
      '<circle cx="10" cy="10" r="' + r + '" class="pn-ring__fg" stroke-dasharray="' + (c * p).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 10 10)"/></svg>';
  }

  function cell(o, st) {
    var left = '<span class="pn-left">✕ saiu aqui</span>';
    if (st.kind === "answer") {
      if (o.resp[st.key]) return '<span class="pn-answer" title="' + esc(o.resp[st.key]) + '">' + esc(o.resp[st.key]) + "</span>";
      return o.max === st.i ? left : "";
    }
    if (st.kind === "offer") {
      if (o.checkout) return '<span class="pn-pill pn-pill--ok">checkout · ' + esc(o.checkout) + "</span>";
      return o.max >= st.i ? '<span class="pn-pill">viu a oferta</span>' : "";
    }
    if (o.max > st.i) return '<span class="pn-pill">clicou</span>';
    return o.max === st.i || (st.i === IDX.about && o.max === IDX.loading) ? left : "";
  }

  function renderResponses() {
    var list = filtered();
    var total = state.cur.length;
    $("#resp-count").textContent = num(list.length) + (list.length === 1 ? " visitante" : " visitantes");

    var head = "<thead><tr><th class=\"pn-sticky pn-sticky--1\">ID</th><th class=\"pn-sticky pn-sticky--2\">Data</th><th>Origem</th>" +
      TABLE_STEPS.map(function (st) {
        var r = reach(state.cur, st.i);
        var p = total ? r / total : 0;
        return '<th><div class="pn-th"><span class="pn-th__n">' + st.i + '</span><span class="pn-th__label">' + esc(st.label) + "</span>" +
          '<span class="pn-th__pct">' + pct(r, total, 0) + "</span>" + ring(p) + "</div></th>";
      }).join("") + "</tr></thead>";

    if (!list.length) {
      $("#responses").innerHTML = head + '<tbody><tr><td colspan="' + (TABLE_STEPS.length + 3) + '">' + empty() + "</td></tr></tbody>";
      $("#more-wrap").hidden = true;
      return;
    }
    var rows = list.slice(0, state.shown).map(function (o) {
      return '<tr><td class="pn-sticky pn-sticky--1"><code>' + esc(o.id.slice(0, 6)) + '</code></td><td class="pn-sticky pn-sticky--2">' + dateTime(o.inicio) +
        "</td><td>" + esc(o.origem) + "</td>" + TABLE_STEPS.map(function (st) { return "<td>" + cell(o, st) + "</td>"; }).join("") + "</tr>";
    }).join("");
    $("#responses").innerHTML = head + "<tbody>" + rows + "</tbody>";
    $("#more-wrap").hidden = list.length <= state.shown;
  }

  function renderSummary() {
    var box = $("#summary");
    if (!state.cur.length) { box.innerHTML = empty(); return; }
    box.innerHTML = Q.map(function (q, n) {
      var answered = state.cur.filter(function (o) { return o.resp[q.key]; });
      var tot = answered.length;
      var counts = q.options.map(function (op) {
        return { label: op.label, n: answered.filter(function (o) { return o.resp[q.key] === op.label; }).length };
      });
      var top = Math.max.apply(null, counts.map(function (c) { return c.n; }));
      return '<article class="pn-card pn-q"><header><span class="pn-th__n">P' + (n + 1) + "</span><h3>" + esc(q.title) + "</h3></header>" +
        '<p class="pn-muted">' + num(tot) + " respostas</p>" +
        counts.map(function (c) {
          return '<div class="pn-opt' + (c.n && c.n === top ? " is-top" : "") + '"><div class="pn-opt__row"><span>' + esc(c.label) + "</span><strong>" +
            pct(c.n, tot, 0) + " <em>" + num(c.n) + "</em></strong></div>" +
            '<div class="pn-fbar pn-fbar--sm"><i style="width:' + (tot ? c.n / tot * 100 : 0) + '%"></i></div></div>';
        }).join("") + "</article>";
    }).join("");
  }

  function exportCsv() {
    var list = filtered();
    var head = ["id", "data", "origem", "campanha", "dispositivo", "etapa_max", "etapa", "checkout", "duracao_s"].concat(Q.map(function (q) { return q.key; }));
    var lines = [head.join(";")].concat(list.map(function (o) {
      var st = STEPS.filter(function (s) { return s.i === Math.min(o.max, LAST); })[0];
      return [o.id, dateTime(o.inicio), o.origem, o.camp, o.disp, o.max, st ? st.label : "", o.checkout, o.dur]
        .concat(Q.map(function (q) { return o.resp[q.key] || ""; }))
        .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";");
    }));
    var blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "funil-mpr-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ───────────── Tooltip ───────────── */

  var tip = $("#tooltip");
  function showTip(x, y, html) {
    tip.innerHTML = html;
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 14));
    var top = y - h - 12 < 8 ? y + 16 : y - h - 12;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.hidden = true; }
  function bindTips(root) {
    $$("[data-tip]", root).forEach(function (el) {
      el.addEventListener("pointermove", function (e) { showTip(e.clientX, e.clientY, esc(el.getAttribute("data-tip"))); });
      el.addEventListener("pointerleave", hideTip);
    });
  }

  function empty() {
    return '<div class="pn-empty"><strong>Sem dados nesse período</strong><span>Assim que houver visitas no quiz, elas aparecem aqui.</span></div>';
  }

  /* ───────────── Dados de exemplo (?demo=1) ───────────── */

  function demoRows() {
    var rows = [], now = Date.now(), span = 2 * state.dias * 86400000;
    var n = state.dias === 1 ? 90 : state.dias === 7 ? 420 : 1500;
    var sources = [["instagram", "bio", ""], ["instagram", "bio", ""], ["instagram", "stories", "mpr"], ["facebook", "cpc", "lancamento"], ["", "", ""]];
    var devices = ["Celular", "Celular", "Celular", "Celular", "Computador", "Tablet"];
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    for (var i = 0; i < n; i++) {
      var max = 0;
      while (max < LAST && Math.random() < (max === 0 ? 0.78 : max === IDX.result ? 0.8 : 0.93)) max++;
      var resp = {};
      Q.forEach(function (q, k) { if (max > k + 1) resp[q.key] = q.options[Math.random() < 0.55 ? 0 : Math.floor(Math.random() * q.options.length)].label; });
      var s = pick(sources);
      rows.push({
        id: Math.random().toString(36).slice(2, 12), inicio: new Date(now - Math.random() * span),
        disp: pick(devices), max: max, checkout: max >= LAST && Math.random() < 0.32 ? pick(["oferta", "oferta", "oferta", "garantia"]) : "",
        dur: 20 + max * 9 + Math.random() * 40, src: s[0], med: s[1], camp: s[2], ref: s[0] ? "" : "direto", resp: resp
      });
    }
    rows.forEach(function (o) { o.origem = origin(o); });
    return rows;
  }

  /* ───────────── Início ───────────── */

  if (DEMO) {
    showApp();
    load();
    return;
  }
  if (!endpoint) {
    showLogin("O endpoint do Apps Script não está configurado em assets/js/config.js (form.endpoint).");
    return;
  }
  try { state.senha = localStorage.getItem(STORE) || ""; } catch (e) { state.senha = ""; }
  if (state.senha) { showApp(); load(); } else showLogin("");
})();
