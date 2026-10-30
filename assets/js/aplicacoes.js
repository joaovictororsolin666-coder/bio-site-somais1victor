/* ==========================================================================
   Painel de aplicações da mentoria
   Lê a aba "Aplicações" da planilha pelo Apps Script (mesma senha do /painel)
   e grava o status de contato de cada pessoa.
   /aplicacoes?demo=1 mostra dados de exemplo (fictícios) só para conferir o visual.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var endpoint = (CFG.form || {}).endpoint;
  var DEMO = /[?&]demo=1\b/.test(location.search);
  var STORE = "vg_painel";            // senha lembrada (compartilhada com o /painel)
  var STORE_MSG = "vg_aplicacoes_msg";
  var ATUALIZA_MS = 120000;           // busca aplicações novas a cada 2 minutos

  var MSG_PADRAO = "Oi, {nome}! Tudo bem? Aqui é o Victor Gomes 👋\n\n" +
    "Vi sua aplicação para a Mentoria de Criação de Conteúdo e gostei do que você contou sobre o seu projeto.\n\n" +
    "Posso te fazer umas perguntas rápidas pra entender se a mentoria faz sentido pra você agora?";

  var STATUS = [
    { id: "novo", label: "Novo" },
    { id: "chamei", label: "Chamei" },
    { id: "respondeu", label: "Respondeu" },
    { id: "fechou", label: "Fechou" },
    { id: "descartado", label: "Descartado" }
  ];

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var state = { senha: "", rows: [], filtro: "todas", busca: "", timer: null };

  /* ───────────── Formatação ───────────── */

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return ("0" + n).slice(-2); }
  function quando(d) {
    if (isNaN(d)) return "—";
    var hoje = new Date(), ontem = new Date(hoje - 86400000);
    var hora = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (d.toDateString() === hoje.toDateString()) return "Hoje " + hora;
    if (d.toDateString() === ontem.toDateString()) return "Ontem " + hora;
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + hora;
  }
  function primeiroNome(n) { var p = String(n || "").trim().split(/\s+/)[0] || ""; return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }

  // "(11) 91234-5678" → "5511912345678" (formato do wa.me); null se não parecer um celular do Brasil
  function telefone(w) {
    var d = String(w || "").replace(/\D/g, "").replace(/^0+/, "");
    if (d.length === 10 || d.length === 11) d = "55" + d;
    return /^55\d{10,11}$/.test(d) ? d : null;
  }

  // Aceita "@perfil", "perfil" ou o link do perfil
  function perfil(ig) {
    var s = String(ig || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").split(/[/?#\s]/)[0].replace(/^@+/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
  }

  function mensagem() { try { return localStorage.getItem(STORE_MSG) || MSG_PADRAO; } catch (e) { return MSG_PADRAO; } }

  function linkWhats(r) {
    var tel = telefone(r.whatsapp);
    return tel ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(mensagem().replace(/\{nome\}/g, primeiroNome(r.nome))) : null;
  }

  /* ───────────── Comunicação com o Apps Script ───────────── */

  function request(params) {
    var body = new URLSearchParams(params);
    return fetch(endpoint, { method: "POST", body: body, headers: { Accept: "application/json" }, redirect: "follow" })
      .then(function (r) { return r.json(); });
  }

  function erroDoScript(res) {
    var err = res && res.error;
    if (err === "senha_invalida") return { login: "Senha incorreta." };
    if (err === "senha_nao_configurada") return { login: "A senha do painel ainda não foi configurada no Apps Script (propriedade PAINEL_SENHA)." };
    // Script antigo não conhece a ação "aplicacoes" e tenta salvar uma aplicação vazia
    if (/obrigat/i.test(err || "")) return { aviso: "Falta atualizar o Apps Script da planilha com a versão nova (veja README → Painel de aplicações)." };
    return { aviso: "Não foi possível carregar as aplicações. Clique em atualizar." };
  }

  function carregar(silencioso) {
    if (!silencioso) status("Carregando aplicações…");
    if (DEMO) { state.rows = demo(); status("Dados de exemplo (fictícios) — só para visualizar o layout.", false); render(); return Promise.resolve(true); }
    return request({ action: "aplicacoes", senha: state.senha })
      .then(function (res) {
        if (!res || res.ok !== true) {
          var e = erroDoScript(res);
          if (e.login) { showLogin(e.login); return false; }
          status(e.aviso, true); return false;
        }
        state.rows = (res.rows || []).map(function (r) {
          r.data = new Date(r.recebido_em);
          if (!STATUS.some(function (s) { return s.id === r.status; })) r.status = "novo";
          return r;
        }).sort(function (a, b) { return b.data - a.data; });
        status("");
        render();
        return true;
      })
      .catch(function () { status("Sem conexão com a planilha. Verifique a internet e clique em atualizar.", true); return false; });
  }

  function salvarStatus(r, novo) {
    var antigo = r.status;
    r.status = novo;
    render();
    if (DEMO) return;
    request({ action: "status", senha: state.senha, linha: r.linha, whatsapp: r.whatsapp, status: novo })
      .then(function (res) {
        if (res && res.ok) return;
        r.status = antigo; render();
        status(res && res.error === "planilha_mudou"
          ? "A planilha foi alterada. Atualizei a lista, tente de novo."
          : "Não consegui salvar o status. Tente de novo.", true);
        if (res && res.error === "planilha_mudou") carregar(true);
      })
      .catch(function () { r.status = antigo; render(); status("Sem conexão: o status não foi salvo.", true); });
  }

  /* ───────────── Lista ───────────── */

  function visiveis() {
    var q = state.busca.toLowerCase(), qd = q.replace(/\D/g, "");
    return state.rows.filter(function (r) {
      if (state.filtro !== "todas" && r.status !== state.filtro) return false;
      if (!q) return true;
      return (r.nome + " " + r.instagram).toLowerCase().indexOf(q) > -1 || (qd && String(r.whatsapp).replace(/\D/g, "").indexOf(qd) > -1);
    });
  }

  function renderFiltros() {
    var cont = { todas: state.rows.length };
    state.rows.forEach(function (r) { cont[r.status] = (cont[r.status] || 0) + 1; });
    var opcoes = [{ id: "todas", label: "Todas" }].concat(STATUS);
    $("#filtros").innerHTML = opcoes.map(function (o) {
      return '<button type="button" class="ap-filtro' + (o.id === state.filtro ? " is-active" : "") + '" data-filtro="' + o.id + '" aria-pressed="' + (o.id === state.filtro) + '">' +
        esc(o.label) + ' <span>' + (cont[o.id] || 0) + "</span></button>";
    }).join("");
    var novos = cont.novo || 0;
    document.title = (novos ? "(" + novos + ") " : "") + "Aplicações da Mentoria | Victor Gomes";
  }

  function render() {
    renderFiltros();
    var lista = visiveis();
    $("#vazio").hidden = lista.length > 0;
    $("#vazio").textContent = state.rows.length ? "Nenhuma aplicação com esse filtro." : "Nenhuma aplicação por aqui ainda.";
    if (!lista.length) { $("#lista").innerHTML = ""; return; }

    var head = "<thead><tr><th>Recebida</th><th>Nome</th><th>Contato</th><th>Investimento</th><th>Objetivo</th><th>Dificuldade</th><th>Projeto</th><th>Status</th></tr></thead>";
    $("#lista").innerHTML = head + "<tbody>" + lista.map(function (r) {
      var i = state.rows.indexOf(r), wa = linkWhats(r), ig = perfil(r.instagram);
      var whats = wa
        ? '<a class="ap-btn ap-btn--wa" href="' + esc(wa) + '" target="_blank" rel="noopener" data-wa="' + i + '">WhatsApp</a>'
        : '<span class="pn-muted" title="Número fora do padrão">' + esc(r.whatsapp) + "</span>";
      var insta = ig
        ? '<a class="ap-btn ap-btn--ig" href="https://www.instagram.com/' + esc(ig) + '/" target="_blank" rel="noopener">@' + esc(ig) + "</a>"
        : '<span class="pn-muted">' + esc(r.instagram) + "</span>";
      var sel = '<select class="ap-status ap-status--' + r.status + '" data-i="' + i + '" aria-label="Status de ' + esc(r.nome) + '">' +
        STATUS.map(function (s) { return '<option value="' + s.id + '"' + (s.id === r.status ? " selected" : "") + ">" + s.label + "</option>"; }).join("") + "</select>";
      return '<tr class="' + (r.status === "novo" ? "is-novo" : "") + '">' +
        '<td data-l="Recebida">' + quando(r.data) + "</td>" +
        '<td data-l="Nome" class="ap-nome">' + esc(r.nome) + "</td>" +
        '<td data-l="Contato"><div class="ap-contato">' + whats + insta + "</div></td>" +
        '<td data-l="Investimento"><span class="ap-inv">' + esc(r.investimento) + "</span></td>" +
        '<td data-l="Objetivo">' + esc(r.objetivo) + "</td>" +
        '<td data-l="Dificuldade">' + esc(r.dificuldade) + "</td>" +
        '<td data-l="Projeto"><button type="button" class="ap-projeto" title="Ver tudo">' + esc(r.projeto) + "</button></td>" +
        '<td data-l="Status">' + sel + "</td></tr>";
    }).join("") + "</tbody>";
  }

  /* ───────────── Login ───────────── */

  function status(msg, erro) {
    var el = $("#status");
    el.textContent = msg || "";
    el.className = "pn-status" + (erro ? " is-error" : "") + (DEMO ? " is-demo" : "");
    el.hidden = !msg;
  }

  function showLogin(msg) {
    clearInterval(state.timer);
    $("#app").hidden = true;
    $("#login").hidden = false;
    $("#login-error").textContent = msg || "";
    $("#login-error").hidden = !msg;
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    $("#senha").focus();
  }

  function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    clearInterval(state.timer);
    state.timer = setInterval(function () { if (!document.hidden) carregar(true); }, ATUALIZA_MS);
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    state.senha = $("#senha").value;
    var btn = $("#login-form .btn");
    btn.disabled = true;
    showApp();
    carregar().then(function (ok) {
      btn.disabled = false;
      if (ok && $("#lembrar").checked) { try { localStorage.setItem(STORE, state.senha); } catch (e2) { /* ignore */ } }
    });
  });

  $("#logout").addEventListener("click", function () { state.senha = ""; $("#senha").value = ""; showLogin(""); });
  $("#refresh").addEventListener("click", function () { carregar(); });

  /* ───────────── Controles ───────────── */

  $("#busca").addEventListener("input", function (e) { state.busca = e.target.value.trim(); render(); });

  $("#filtros").addEventListener("click", function (e) {
    var b = e.target.closest("[data-filtro]");
    if (b) { state.filtro = b.dataset.filtro; render(); }
  });

  $("#lista").addEventListener("change", function (e) {
    var sel = e.target.closest(".ap-status");
    if (sel) salvarStatus(state.rows[+sel.dataset.i], sel.value);
  });

  $("#lista").addEventListener("click", function (e) {
    var wa = e.target.closest("[data-wa]");
    // Abriu o WhatsApp de alguém novo: já marca como "Chamei"
    if (wa) { var r = state.rows[+wa.dataset.wa]; if (r.status === "novo") setTimeout(function () { salvarStatus(r, "chamei"); }, 300); }
    var pj = e.target.closest(".ap-projeto");
    if (pj) pj.classList.toggle("is-aberto");
  });

  // Mensagem pronta (editável, salva no aparelho)
  $("#abrir-msg").addEventListener("click", function () { $("#msg-texto").value = mensagem(); $("#msg-dialog").showModal(); });
  $("#msg-padrao").addEventListener("click", function () { $("#msg-texto").value = MSG_PADRAO; });
  $("#msg-dialog").addEventListener("close", function () {
    if ($("#msg-dialog").returnValue !== "salvar") return;
    var t = $("#msg-texto").value.trim();
    try { if (t && t !== MSG_PADRAO) localStorage.setItem(STORE_MSG, t); else localStorage.removeItem(STORE_MSG); } catch (e) { /* ignore */ }
    render();
  });

  /* ───────────── Dados de exemplo (?demo=1) ───────────── */

  function demo() {
    var agora = Date.now();
    return [
      ["Ana Paula Ribeiro", "@anapaula.receitas", "(11) 98765-4321", "Vender mais através do conteúdo", "Transformar seguidores em clientes", "R$ 1.000 a R$ 2.000", "Tenho um perfil de receitas fit com 8 mil seguidores e vendo marmitas, mas quase ninguém compra pelo Instagram.", "novo", 0.4],
      ["Carlos Henrique", "carloshfinancas", "21 99876 5432", "Construir autoridade no meu nicho", "Falta de constância", "R$ 500 a R$ 1.000", "Sou contador e quero usar o Instagram pra atrair clientes.", "novo", 3],
      ["Juliana Martins", "https://instagram.com/ju.martins.makeup", "(31) 97654-3210", "Crescer meu perfil e aumentar o alcance", "Baixo alcance e engajamento", "Acima de R$ 5.000", "Maquiadora há 6 anos, quero crescer e lançar um curso.", "chamei", 26],
      ["Pedro Alves", "@pedroalves", "11 4002-89", "Começar a criar conteúdo do zero", "Não sei o que postar", "Até R$ 500", "Quero começar mas não sei por onde.", "descartado", 50]
    ].map(function (d, i) {
      return { linha: i + 2, nome: d[0], instagram: d[1], whatsapp: d[2], objetivo: d[3], dificuldade: d[4], investimento: d[5], projeto: d[6], status: d[7], data: new Date(agora - d[8] * 3600000) };
    });
  }

  /* ───────────── Início ───────────── */

  try { state.senha = localStorage.getItem(STORE) || ""; } catch (e) { state.senha = ""; }
  if (DEMO || state.senha) { showApp(); carregar(); } else showLogin("");
})();
