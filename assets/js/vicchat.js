/* ==========================================================================
   VicChat — painel das automações do Instagram
   Fala com o Apps Script (ações vicchat, vicchat_ativar e vicchat_config, mesma senha do /painel).
   /vicchat?demo=1 mostra dados de exemplo (fictícios) só para conferir o visual.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var endpoint = (CFG.form || {}).endpoint;
  var DEMO = /[?&]demo=1\b/.test(location.search);
  var STORE = "vg_painel"; // senha lembrada (compartilhada com /painel e /aplicacoes)
  var ATUALIZA_MS = 60000;
  var TITULOS = { inicio: "Início", automacoes: "Automação", comentarios: "Automação", fluxo: "Automação" };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var state = { senha: "", dados: null, tab: "geral", timer: null, config: null, dias: 7 };

  /* ───────────── Formatação ───────────── */

  var nf = new Intl.NumberFormat("pt-BR");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return ("0" + n).slice(-2); }
  function diaKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function quando(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    var hoje = new Date(), hora = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (d.toDateString() === hoje.toDateString()) return "Hoje " + hora;
    if (d.toDateString() === new Date(hoje - 86400000).toDateString()) return "Ontem " + hora;
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + hora;
  }
  function cada(min) { min = min || 5; return min === 1 ? "minuto" : min + " minutos"; }
  function haQuanto(ms) {
    var min = Math.round((Date.now() - ms) / 60000);
    if (min < 1) return "agora há pouco";
    if (min < 60) return "há " + min + " min";
    var h = Math.round(min / 60);
    return h < 24 ? "há " + h + " h" : "há " + Math.round(h / 24) + " dias";
  }

  /* ───────────── Comunicação com o Apps Script ───────────── */

  function request(params) {
    if (/^vicchat/.test(params.action || "")) params.dias = state.dias;
    if (DEMO) return Promise.resolve(demo(params));
    return fetch(endpoint, { method: "POST", body: new URLSearchParams(params), headers: { Accept: "application/json" }, redirect: "follow" })
      .then(function (r) { return r.json(); });
  }

  function tratar(res) {
    if (res && res.ok) { state.dados = res; render(); aviso(DEMO ? "Dados de exemplo (fictícios), só para ver o visual." : ""); return true; }
    var err = res && res.error;
    if (err === "senha_invalida") { showLogin("Senha incorreta."); return false; }
    if (err === "senha_nao_configurada") { showLogin("A senha do painel ainda não foi configurada no Apps Script."); return false; }
    if (/obrigat/i.test(err || "")) aviso("Falta publicar a versão nova do Apps Script (Implantar → Gerenciar implantações → Nova versão).", true);
    else if (err === "config_invalida") aviso("Configuração inválida: precisa de pelo menos uma palavra-chave e uma mensagem.", true);
    else aviso("Não foi possível carregar. Clique em atualizar.", true);
    return false;
  }

  function carregar() {
    return request({ action: "vicchat", senha: state.senha }).then(tratar, function () {
      aviso("Sem conexão com a planilha. Verifique a internet e clique em atualizar.", true);
      return false;
    });
  }

  function aviso(msg, erro) {
    var el = $("#aviso");
    el.textContent = msg || "";
    el.className = "vc-aviso" + (erro ? " is-erro" : "");
    el.hidden = !msg;
  }

  /* ───────────── Navegação (#inicio, #automacoes, #comentarios) ───────────── */

  function rota() {
    var v = (location.hash || "#inicio").slice(1);
    if (!TITULOS[v]) v = "inicio";
    $$(".vc-view").forEach(function (s) { s.hidden = s.id !== "view-" + v; });
    $$(".vc-nav a").forEach(function (a) { a.classList.toggle("is-on", a.dataset.view === v || ((v === "comentarios" || v === "fluxo") && a.dataset.view === "automacoes")); });
    if (v === "fluxo") { fxRender(); } else if (typeof fxFechar === "function" && fx.aberto) fxFechar();
    $("#titulo").textContent = TITULOS[v];
    window.scrollTo(0, 0);
  }

  function abrirTab(t) {
    state.tab = t;
    $$(".vc-tabs button").forEach(function (b) { var on = b.dataset.tab === t; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
    $$(".vc-tab").forEach(function (el) { el.hidden = el.id !== "tab-" + t; });
  }

  /* ───────────── Render ───────────── */

  function tile(rotulo, valor, erro) {
    return '<div class="vc-tile' + (erro ? " is-erro" : "") + '"><span>' + rotulo + "</span><b>" + nf.format(valor) + "</b></div>";
  }

  function render() {
    var d = state.dados, s = d.stats, ativo = d.ativo;
    if (d.conta) $("#conta-user").textContent = "@" + d.conta;

    // Status (pílula e interruptores)
    $$("#lista-pill, #det-pill").forEach(function (p) { p.textContent = ativo ? "ATIVA" : "PAUSADA"; p.classList.toggle("is-on", ativo); });
    $$("#lista-toggle, #det-toggle").forEach(function (t) { t.checked = ativo; t.disabled = !d.gatilho; });
    $("#inicio-ponto").classList.toggle("is-on", ativo);
    $("#inicio-status").textContent = !d.gatilho
      ? "Automação não instalada: rode ligarComentarios no Apps Script"
      : ativo ? "Respondendo comentários de @" + (d.conta || "seu perfil") : "Automação pausada";

    var tiles = tile("Respondidos hoje", s.hoje) + tile("Últimos 7 dias", s.semana) + tile("Total", s.total) + tile("Erros (7 dias)", s.erros, s.erros > 0);
    $("#inicio-tiles").innerHTML = tiles;
    $("#det-tiles").innerHTML = tiles;
    $("#inicio-auto").textContent = (ativo ? "Ativa · " : "Pausada · ") + nf.format(s.total) + " respondidos";
    $("#lista-total").textContent = nf.format(s.total);

    $("#det-rodada").textContent = !d.gatilho ? "Os gatilhos não estão instalados."
      : !ativo ? "Pausada: nenhum comentário está sendo respondido."
      : d.ultimaRodada ? "Última verificação " + haQuanto(d.ultimaRodada) + " · verifica a cada " + cada(d.config.minutos) : "Aguardando a primeira verificação (a cada " + cada(d.config.minutos) + ")";
    $("#det-erro").textContent = d.erro ? "Último erro: " + d.erro : "";
    $("#det-erro").hidden = !d.erro;

    renderDm(d.dm, ativo);
    fxRender();
    renderGrafico(s.porDia || {});
    renderFluxo(d.config);
    renderTabela(d.ultimas || []);
    if (!state.config || !state.editando) renderConfig(d.config);
  }

  function renderDm(dm, ativo) {
    if (!dm) { $("#card-dm").hidden = true; $("#inicio-dm").textContent = "Atualize o Apps Script"; return; }
    var on = dm.ativo && ativo;
    $("#dm-pill").textContent = on ? "ATIVA" : dm.ativo ? "AGUARDANDO" : "DESLIGADA";
    $("#dm-pill").classList.toggle("is-on", on);
    $("#dm-toggle").checked = !!dm.ativo;
    $("#dm-toggle").disabled = false;
    $("#dm-hoje").textContent = nf.format(dm.hoje || 0);
    $("#dm-limite").textContent = "de " + dm.porDia + " DMs hoje";
    $("#dm-texto").textContent = "Mensagem: \u201c" + dm.texto + "\u201d · Botão: " + dm.botao;
    $("#dm-desc").textContent = !dm.ativo ? "Desligado: os comentários recebem só a resposta pública"
      : !ativo ? "Ligado, mas a automação de comentários está pausada"
      : "Quem segue recebe o link na hora; quem não segue recebe um pedido para seguir e o link depois do “Já segui”" +
        (dm.esperando ? " · " + dm.esperando + " esperando confirmar" : "");
    var ult = (dm.ultimos || []).slice(0, 5).map(function (x) { return "@" + x.u + ": " + x.o + " (" + quando(x.d) + ")"; });
    if (ult.length) $("#dm-texto").textContent += " · Últimos: " + ult.join(" · ");
    $("#dm-erro").textContent = dm.erro ? "Desligado por erro: " + dm.erro : "";
    $("#dm-erro").hidden = !dm.erro || dm.ativo;
    $("#inicio-dm").textContent = (dm.ativo ? "Ligado · " : "Desligado · ") + nf.format(dm.total || 0) + " DMs enviadas";
  }

  function alternarDm(e) {
    var ligar = e.target.checked;
    e.target.disabled = true;
    request({ action: "vicchat_dm", senha: state.senha, ativo: ligar ? "1" : "0" }).then(tratar, function () {
      aviso("Sem conexão: o Direct não mudou.", true);
      render();
    });
  }

  function renderGrafico(porDia) {
    var dias = [], hoje = new Date();
    for (var i = 13; i >= 0; i--) { var dt = new Date(hoje); dt.setDate(hoje.getDate() - i); dias.push(dt); }
    var max = Math.max.apply(null, dias.map(function (dt) { return porDia[diaKey(dt)] || 0; }).concat(1));
    $("#grafico").innerHTML = dias.map(function (dt) {
      var n = porDia[diaKey(dt)] || 0;
      return '<div class="vc-barra' + (n ? "" : " is-zero") + '" title="' + pad(dt.getDate()) + "/" + pad(dt.getMonth() + 1) + ": " + n + ' respostas">' +
        (n ? "<b>" + n + "</b>" : "") + '<i style="height:' + Math.max(2, n / max * 100) + '%"></i><small>' + pad(dt.getDate()) + "/" + pad(dt.getMonth() + 1) + "</small></div>";
    }).join("");
  }

  function renderFluxo(c) {
    $("#fluxo-palavras").innerHTML = c.palavras.map(function (p) { return '<span class="vc-kw">' + esc(p) + "</span>"; }).join(" ");
    $("#fluxo-posts").textContent = c.postsRecentes;
    $("#fluxo-respostas").textContent = c.respostas.length;
    $("#fluxo-rodada").textContent = c.maxPorRodada;
    $("#fluxo-cada").textContent = cada(c.minutos);
    $("#fluxo-dia").textContent = c.maxPorDia;
  }

  function renderTabela(lista) {
    $("#tabela-vazia").hidden = lista.length > 0;
    if (!lista.length) { $("#tabela").innerHTML = ""; return; }
    $("#tabela").innerHTML = "<thead><tr><th>Quando</th><th>Quem</th><th>Comentário</th><th>Resposta</th><th>Post</th><th>Status</th></tr></thead><tbody>" +
      lista.map(function (r) {
        var ok = r.status === "ok";
        return "<tr>" +
          '<td class="vc-quando">' + quando(r.data) + "</td>" +
          '<td class="vc-quem"><a href="https://www.instagram.com/' + encodeURIComponent(r.usuario) + '/" target="_blank" rel="noopener">@' + esc(r.usuario) + "</a></td>" +
          '<td class="vc-txt">' + esc(r.comentario) + "</td>" +
          '<td class="vc-txt vc-muted">' + esc(r.resposta) + "</td>" +
          "<td>" + (/^https:\/\/(www\.)?instagram\.com\//.test(r.post) ? '<a href="' + esc(r.post) + '" target="_blank" rel="noopener">Ver post</a>' : "—") + "</td>" +
          "<td>" + (ok ? '<span class="vc-ok">✓ Respondido</span>' : '<span class="vc-falha">' + esc(r.status) + "</span>") + "</td></tr>";
      }).join("") + "</tbody>";
  }

  /* ───────────── Configurar ───────────── */

  function chips(box, lista, placeholder) {
    box.innerHTML = lista.map(function (t, i) { return '<span class="vc-chip">' + esc(t) + ' <button type="button" data-i="' + i + '" aria-label="Remover ' + esc(t) + '">×</button></span>'; }).join("") +
      '<input type="text" placeholder="' + placeholder + '" aria-label="' + placeholder + '">';
  }

  function renderConfig(c) {
    state.config = { palavras: c.palavras.slice(), ignorar: c.ignorar.slice(), respostas: c.respostas.slice(), postsFixos: c.postsFixos.slice() };
    state.editando = false;
    desenharConfig();
    $("#max-rodada").value = c.maxPorRodada;
    $("#max-dia").value = c.maxPorDia;
    $("#salvo").textContent = "";
  }

  var CHIPS = { "#chips-palavras": ["palavras", "Digite e aperte Enter"], "#chips-ignorar": ["ignorar", "Digite e aperte Enter"], "#chips-posts": ["postsFixos", "Cole o link do post e aperte Enter"] };

  function desenharConfig() {
    Object.keys(CHIPS).forEach(desenharChips);
    desenharRespostas();
  }

  function desenharChips(id) {
    chips($(id), state.config[CHIPS[id][0]], CHIPS[id][1]);
  }

  function desenharRespostas() {
    $("#lista-respostas").innerHTML = state.config.respostas.map(function (t, i) {
      return '<div class="vc-resposta"><textarea class="vc-input" rows="2" data-i="' + i + '" maxlength="300" aria-label="Mensagem ' + (i + 1) + '">' + esc(t) + '</textarea>' +
        '<button type="button" data-i="' + i + '" aria-label="Remover mensagem ' + (i + 1) + '">×</button></div>';
    }).join("");
  }

  function ligarChips(id, chave) {
    var box = $(id);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]");
      if (b) { state.config[chave].splice(+b.dataset.i, 1); mexeu(); desenharChips(id); $(id + " input").focus(); }
      else if (e.target === box) $(id + " input").focus();
    });
    box.addEventListener("keydown", function (e) {
      if (e.target.tagName !== "INPUT") return;
      var v = e.target.value.trim();
      if ((e.key === "Enter" || e.key === ",") && v) {
        e.preventDefault();
        if (state.config[chave].indexOf(v) < 0) state.config[chave].push(v);
        mexeu(); desenharChips(id); $(id + " input").focus();
      } else if (e.key === "Backspace" && !e.target.value && state.config[chave].length) {
        state.config[chave].pop(); mexeu(); desenharChips(id); $(id + " input").focus();
      }
    });
  }

  function mexeu() { state.editando = true; $("#salvo").textContent = "Alterações não salvas"; }

  function salvar(e) {
    e.preventDefault();
    // Pega o que ficou digitado nos campos de chip sem Enter
    [["#chips-palavras", "palavras"], ["#chips-ignorar", "ignorar"], ["#chips-posts", "postsFixos"]].forEach(function (p) {
      var v = $(p[0] + " input").value.trim();
      if (v && state.config[p[1]].indexOf(v) < 0) state.config[p[1]].push(v);
    });
    var c = state.config;
    c.respostas = $$("#lista-respostas textarea").map(function (t) { return t.value.trim(); }).filter(Boolean);
    if (!c.palavras.length || !c.respostas.length) { $("#salvo").textContent = "Precisa de pelo menos uma palavra-chave e uma mensagem."; return; }
    var btn = $("#tab-config .vc-btn--primary");
    btn.disabled = true; $("#salvo").textContent = "Salvando…";
    var config = { palavras: c.palavras, ignorar: c.ignorar, respostas: c.respostas, postsFixos: c.postsFixos, maxPorRodada: $("#max-rodada").value, maxPorDia: $("#max-dia").value };
    request({ action: "vicchat_config", senha: state.senha, config: JSON.stringify(config) }).then(function (res) {
      btn.disabled = false;
      state.editando = false;
      if (tratar(res)) $("#salvo").textContent = "Salvo ✓";
      else $("#salvo").textContent = "Não foi salvo.";
    }, function () { btn.disabled = false; $("#salvo").textContent = "Sem conexão: não foi salvo."; });
  }

  /* ───────────── Ativar / pausar ───────────── */

  function alternar(e) {
    var ligar = e.target.checked;
    $$("#lista-toggle, #det-toggle").forEach(function (t) { t.checked = ligar; t.disabled = true; });
    request({ action: "vicchat_ativar", senha: state.senha, ativo: ligar ? "1" : "0" }).then(tratar, function () {
      aviso("Sem conexão: o status não mudou.", true);
      render();
    });
  }

  /* ───────────── Login ───────────── */

  function showLogin(msg) {
    clearInterval(state.timer);
    $("#app").hidden = true;
    $("#login").hidden = false;
    $("#login-erro").textContent = msg || "";
    $("#login-erro").hidden = !msg;
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    $("#senha").focus();
  }

  function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    rota();
    clearInterval(state.timer);
    state.timer = setInterval(function () { if (!document.hidden && !state.editando) carregar(); }, ATUALIZA_MS);
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    state.senha = $("#senha").value;
    var btn = $("#login-form button");
    btn.disabled = true;
    request({ action: "vicchat", senha: state.senha }).then(function (res) {
      btn.disabled = false;
      if (res && res.ok && $("#lembrar").checked) { try { localStorage.setItem(STORE, state.senha); } catch (e2) { /* ignore */ } }
      if (res && res.ok) showApp();
      tratar(res);
    }, function () { btn.disabled = false; showLogin("Não foi possível conectar. Verifique sua internet."); });
  });

  $("#sair").addEventListener("click", function () { state.senha = ""; $("#senha").value = ""; showLogin(""); });
  $("#atualizar").addEventListener("click", carregar);
  window.addEventListener("hashchange", rota);
  $$(".vc-tabs button").forEach(function (b) { b.addEventListener("click", function () { abrirTab(b.dataset.tab); }); });
  $$("#lista-toggle, #det-toggle").forEach(function (t) { t.addEventListener("change", alternar); });
  $("#dm-toggle").addEventListener("change", alternarDm);
  $("#lista-toggle").addEventListener("click", function (e) { e.stopPropagation(); });
  $("#card-comentarios").addEventListener("click", function (e) { if (!e.target.closest(".vc-switch")) location.hash = "comentarios"; });
  $("#card-comentarios").addEventListener("keydown", function (e) { if (e.key === "Enter") location.hash = "comentarios"; });

  ligarChips("#chips-palavras", "palavras");
  ligarChips("#chips-ignorar", "ignorar");
  ligarChips("#chips-posts", "postsFixos");
  $("#lista-respostas").addEventListener("input", mexeu);
  $("#lista-respostas").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-i]");
    if (!b) return;
    state.config.respostas = $$("#lista-respostas textarea").map(function (t) { return t.value; });
    state.config.respostas.splice(+b.dataset.i, 1);
    mexeu(); desenharRespostas();
  });
  $("#add-resposta").addEventListener("click", function () {
    state.config.respostas = $$("#lista-respostas textarea").map(function (t) { return t.value; });
    state.config.respostas.push("");
    mexeu(); desenharRespostas();
    var ts = $$("#lista-respostas textarea"); ts[ts.length - 1].focus();
  });
  $$("#max-rodada, #max-dia").forEach(function (i) { i.addEventListener("input", mexeu); });
  $("#tab-config").addEventListener("submit", salvar);

  /* ───────────── Fluxo do Direct (#fluxo): teia clicável + métricas ───────────── */

  var FX_NOS = [
    { id: "gatilho", x: 20, y: 190, tipo: "Gatilho", cor: "azul", titulo: "Comentário com palavra-chave" },
    { id: "resposta", x: 20, y: 470, tipo: "Comentário", cor: "cinza", titulo: "Resposta pública no comentário" },
    { id: "atraso", x: 310, y: 215, tipo: "Atraso", cor: "amarelo", titulo: "Espera antes de enviar" },
    { id: "segue", x: 570, y: 190, tipo: "Condição", cor: "roxo", titulo: "Segue o perfil?" },
    { id: "link", x: 960, y: 10, tipo: "Mensagem", cor: "verde", titulo: "Envia o link" },
    { id: "seguir", x: 960, y: 270, tipo: "Mensagem", cor: "verde", titulo: "Pede para seguir" },
    { id: "abrir", x: 960, y: 530, tipo: "Mensagem", cor: "verde", titulo: "Botão para abrir a conversa" },
    { id: "espera", x: 1290, y: 330, tipo: "Espera", cor: "amarelo", titulo: "Espera a resposta" },
    { id: "segue2", x: 1590, y: 310, tipo: "Condição", cor: "roxo", titulo: "Segue agora?" },
    { id: "link2", x: 1900, y: 150, tipo: "Mensagem", cor: "verde", titulo: "Envia o link" },
    { id: "ainda", x: 1900, y: 450, tipo: "Mensagem", cor: "verde", titulo: "Ainda não segue" }
  ];
  var FX_LIGA = [
    ["gatilho", "atraso"], ["gatilho", "resposta", "", "baixo"], ["atraso", "segue"],
    ["segue", "link", "Sim"], ["segue", "seguir", "Não"], ["segue", "abrir", "Não dá pra saber"],
    ["seguir", "espera"], ["abrir", "espera"], ["espera", "segue2"],
    ["segue2", "link2", "Sim"], ["segue2", "ainda", "Não"], ["ainda", "espera", "de novo", "volta"]
  ];
  // Campos editáveis de cada bloco
  var FX_CAMPOS = {
    resposta: [["respostas", "Quando a DM sai (uma é sorteada)", "lista"], ["falhou", "Quando a DM não sai (uma é sorteada)", "lista"]],
    atraso: [["atraso", "Segundos de espera antes de cada DM (0 a 60)", "num"]],
    link: [["texto", "Texto da mensagem", "texto"], ["botao", "Texto do botão (até 20 letras)", "curto"], ["link", "Link do botão", "url"]],
    link2: [["texto", "Texto da mensagem", "texto"], ["botao", "Texto do botão (até 20 letras)", "curto"], ["link", "Link do botão", "url"]],
    seguir: [["seguir", "Texto da mensagem", "texto"], ["seguiBotao", "Texto do botão (até 20 letras)", "curto"]],
    abrir: [["abrir", "Texto da mensagem", "texto"], ["abrirBotao", "Texto do botão (até 20 letras)", "curto"]],
    ainda: [["aindaNao", "Texto da mensagem", "texto"], ["tentativas", "Quantas vezes pede para seguir (1 a 5)", "num"]]
  };
  var fx = { aberto: "", montado: false };

  function fxNum(n) { return nf.format(n || 0); }
  function fxPct(a, b) { return b ? Math.round(a / b * 100) + "%" : "—"; }
  function fxCliques(dm, chaves) {
    var c = dm.cliques || {}, t = { visitas: 0, quiz: 0, checkout: 0 };
    chaves.forEach(function (k) { var o = c[k]; if (o) { t.visitas += o.visitas; t.quiz += o.quiz; t.checkout += o.checkout; } });
    return t;
  }
  function fxChip(t, url) { return '<span class="fx-btn' + (url ? " fx-btn--url" : "") + '">' + esc(t) + (url ? ' <small>↗</small>' : "") + "</span>"; }
  function fxMet(pares) {
    return '<div class="fx-met">' + pares.map(function (p) { return "<span><b>" + fxNum(p[0]) + "</b> " + p[1] + "</span>"; }).join("") + "</div>";
  }

  function fxCorpo(no, d) {
    var dm = d.dm, m = dm.met || {}, cfg = d.config || {};
    switch (no.id) {
      case "gatilho":
        return '<p>Alguém comenta em um post publicado depois que o Direct foi ligado:</p><div class="fx-kws">' +
          (cfg.palavras || []).slice(0, 8).map(function (p) { return '<span class="vc-kw">' + esc(p) + "</span>"; }).join(" ") + "</div>" +
          fxMet([[m.g, "comentários"]]);
      case "resposta":
        return '<p class="fx-bolha fx-bolha--cinza">' + esc((dm.respostas || [])[0] || "") + "</p>" +
          '<p class="vc-muted">Se a DM não sair: “' + esc((dm.falhou || [])[0] || "") + "”</p>" + fxMet([[m.f, "DMs que falharam"]]);
      case "atraso":
        return '<p class="fx-grande">' + (dm.atraso ? dm.atraso + " s" : "Sem espera") + "</p><p class=\"vc-muted\">Até " + dm.porRodada + " DMs por minuto e " + dm.porDia + " por dia.</p>";
      case "segue":
        return '<p>Confere no Instagram se quem comentou já segue o perfil.</p>';
      case "link":
        var c1 = fxCliques(dm, ["link_direto"]);
        return '<p class="fx-bolha">' + esc(dm.texto) + "</p>" + fxChip(dm.botao, true) +
          fxMet([[m.l, "enviadas"], [c1.visitas, "cliques"], [c1.checkout, "checkout"]]);
      case "seguir":
        return '<p class="fx-bolha">' + esc(dm.seguir) + "</p>" + fxChip(dm.seguiBotao) + fxMet([[m.s, "enviadas"]]);
      case "abrir":
        return '<p class="fx-bolha">' + esc(dm.abrir) + "</p>" + fxChip(dm.abrirBotao) + fxMet([[m.a, "enviadas"]]);
      case "espera":
        return '<p>A pessoa toca no botão ou responde no Direct. Conferido a cada minuto, por até 24 h.</p>' +
          fxMet([[m.t, "responderam"], [dm.esperando, "esperando agora"]]);
      case "segue2":
        return '<p>Confere de novo se a pessoa já segue o perfil.</p>';
      case "link2":
        var c2 = fxCliques(dm, ["link_seguir", "link_botao"]);
        return '<p class="fx-bolha">' + esc(dm.texto) + "</p>" + fxChip(dm.botao, true) +
          fxMet([[m.ls, "enviadas"], [c2.visitas, "cliques"], [c2.checkout, "checkout"]]);
      case "ainda":
        return '<p class="fx-bolha">' + esc(dm.aindaNao) + "</p>" + fxChip(dm.seguiBotao) +
          '<p class="vc-muted">Pede até ' + dm.tentativas + " vezes. Depois, desiste.</p>" + fxMet([[m.n, "enviadas"]]);
    }
    return "";
  }

  function fxMontar() {
    var cv = $("#fx-canvas");
    cv.innerHTML = '<svg class="fx-linhas" id="fx-linhas"></svg>' + FX_NOS.map(function (no) {
      return '<article class="fx-no fx-no--' + no.cor + '" id="fx-' + no.id + '" style="left:' + no.x + "px;top:" + no.y + 'px" tabindex="0" role="button" aria-label="' + esc(no.titulo) + '">' +
        '<header><span class="fx-tipo">' + no.tipo + "</span><strong>" + esc(no.titulo) + "</strong>" +
        (FX_CAMPOS[no.id] || no.id === "gatilho" ? '<span class="fx-editar" aria-hidden="true">✎</span>' : "") + "</header>" +
        '<div class="fx-corpo"></div></article>';
    }).join("");
    fx.montado = true;
  }

  function fxLinhas() {
    var svg = $("#fx-linhas"), cv = $("#fx-canvas");
    svg.setAttribute("width", cv.scrollWidth); svg.setAttribute("height", cv.scrollHeight);
    var caixa = function (id) { var el = $("#fx-" + id); return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; };
    svg.innerHTML = '<defs><marker id="fx-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#a1a1aa"/></marker></defs>' +
      FX_LIGA.map(function (l) {
        var a = caixa(l[0]), b = caixa(l[1]), d, lx, ly;
        if (l[3] === "baixo") {
          var x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y;
          d = "M" + x1 + " " + y1 + " C" + x1 + " " + (y1 + 40) + " " + x2 + " " + (y2 - 40) + " " + x2 + " " + y2;
          lx = x1; ly = (y1 + y2) / 2;
        } else if (l[3] === "volta") {
          var sx = a.x + a.w / 2, sy = a.y + a.h, ex = b.x + b.w / 2, ey = b.y + b.h, fundo = Math.max(sy, ey) + 70;
          d = "M" + sx + " " + sy + " C" + sx + " " + fundo + " " + ex + " " + fundo + " " + ex + " " + ey;
          lx = (sx + ex) / 2; ly = fundo - 18;
        } else {
          var ax = a.x + a.w, ay = a.y + Math.min(60, a.h / 2), bx = b.x, by = b.y + Math.min(60, b.h / 2), mx = (ax + bx) / 2;
          d = "M" + ax + " " + ay + " C" + mx + " " + ay + " " + mx + " " + by + " " + bx + " " + by;
          lx = mx; ly = (ay + by) / 2;
        }
        return '<path d="' + d + '" marker-end="url(#fx-seta)"/>' + (l[2] ? '<g class="fx-rotulo"><rect x="' + (lx - l[2].length * 3.6 - 8) + '" y="' + (ly - 11) + '" width="' + (l[2].length * 7.2 + 16) + '" height="22" rx="11"/><text x="' + lx + '" y="' + (ly + 4) + '">' + esc(l[2]) + "</text></g>" : "");
      }).join("");
  }

  function fxRender() {
    var d = state.dados;
    if (!d || !d.dm || !d.dm.met) { $("#fx-sem").hidden = !(d && d.dm); return; }
    $("#fx-sem").hidden = true;
    if (!fx.montado) fxMontar();
    var dm = d.dm, m = dm.met || {}, cl = fxCliques(dm, Object.keys(dm.cliques || {}));
    var enviadas = (m.l || 0) + (m.s || 0) + (m.a || 0) + (m.ls || 0) + (m.n || 0), comLink = (m.l || 0) + (m.ls || 0);
    $("#fx-tiles").innerHTML = [
      ["Comentários", m.g, ""], ["DMs enviadas", enviadas, ""], ["Responderam", m.t, fxPct(m.t, (m.s || 0) + (m.a || 0)) + " de quem recebeu botão"],
      ["Receberam o link", comLink, ""], ["Cliques no link", cl.visitas, fxPct(cl.visitas, comLink) + " de quem recebeu"],
      ["Começaram o quiz", cl.quiz, ""], ["Clicaram no checkout", cl.checkout, ""]
    ].map(function (t) { return '<div class="vc-tile"><span>' + t[0] + "</span><b>" + fxNum(t[1]) + "</b>" + (t[2] ? "<small>" + t[2] + "</small>" : "") + "</div>"; }).join("");
    FX_NOS.forEach(function (no) { $("#fx-" + no.id + " .fx-corpo").innerHTML = fxCorpo(no, d); });
    $("#fx-pill").textContent = dm.ativo && d.ativo ? "ATIVA" : dm.ativo ? "AGUARDANDO" : "DESLIGADA";
    $("#fx-pill").classList.toggle("is-on", dm.ativo && d.ativo);
    $("#fx-toggle").checked = !!dm.ativo;
    $("#fx-toggle").disabled = false;
    $$("#fx-periodo button").forEach(function (b) { b.classList.toggle("is-on", +b.dataset.dias === (dm.dias || 7)); });
    $("#fx-erro").textContent = dm.erro && !dm.ativo ? "Desligado por erro: " + dm.erro : "";
    $("#fx-erro").hidden = !(dm.erro && !dm.ativo);
    if (!$("#view-fluxo").hidden) requestAnimationFrame(fxLinhas);
  }

  function fxAbrir(id) {
    var no = FX_NOS.filter(function (n) { return n.id === id; })[0];
    if (!no) return;
    var dm = state.dados.dm, campos = FX_CAMPOS[id];
    fx.aberto = id;
    $$(".fx-no").forEach(function (el) { el.classList.toggle("is-sel", el.id === "fx-" + id); });
    $("#fx-g-tipo").textContent = no.tipo;
    $("#fx-g-titulo").textContent = no.titulo;
    if (id === "gatilho") {
      $("#fx-g-campos").innerHTML = '<p class="vc-muted">As palavras-chave e os posts vigiados são os mesmos da resposta nos comentários.</p><a class="vc-btn vc-btn--primary" href="#comentarios" id="fx-ir-config">Editar palavras-chave</a>';
    } else if (!campos) {
      $("#fx-g-campos").innerHTML = '<p class="vc-muted">' + (no.tipo === "Condição" ? "A checagem é automática: o Instagram informa se a pessoa segue o perfil." : "Este passo é automático.") + "</p>";
    } else {
      $("#fx-g-campos").innerHTML = campos.map(function (c) {
        var v = dm[c[0]], id2 = "fx-c-" + c[0];
        if (c[2] === "lista") return '<label class="fx-campo"><span>' + c[1] + '</span><textarea class="vc-input" id="' + id2 + '" rows="5" data-k="' + c[0] + '" data-tipo="lista">' + esc((v || []).join("\n")) + '</textarea><small class="vc-muted">Uma mensagem por linha.</small></label>';
        if (c[2] === "texto") return '<label class="fx-campo"><span>' + c[1] + '</span><textarea class="vc-input" id="' + id2 + '" rows="4" maxlength="600" data-k="' + c[0] + '">' + esc(v) + "</textarea></label>";
        var tipo = c[2] === "num" ? 'type="number" min="0" max="60"' : c[2] === "url" ? 'type="url"' : 'type="text" maxlength="20"';
        return '<label class="fx-campo"><span>' + c[1] + '</span><input class="vc-input" id="' + id2 + '" ' + tipo + ' data-k="' + c[0] + '" value="' + esc(v) + '"></label>';
      }).join("") + '<p class="vc-muted">' + (id === "link" || id === "link2" ? "As duas mensagens de link usam o mesmo texto e botão. O link recebe sozinho a marcação de qual etapa veio o clique." : "") + "</p>" +
        '<div class="fx-g-acoes"><span class="vc-muted" id="fx-salvo"></span><button class="vc-btn vc-btn--primary" type="submit">Salvar</button></div>';
    }
    $("#fx-gaveta").hidden = false;
  }

  function fxFechar() {
    fx.aberto = "";
    $("#fx-gaveta").hidden = true;
    $$(".fx-no").forEach(function (el) { el.classList.remove("is-sel"); });
  }

  function fxSalvar(e) {
    e.preventDefault();
    var config = {};
    $$("#fx-g-campos [data-k]").forEach(function (el) {
      config[el.dataset.k] = el.dataset.tipo === "lista" ? el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean) : el.value;
    });
    var btn = $("#fx-gaveta button[type=submit]");
    btn.disabled = true; $("#fx-salvo").textContent = "Salvando…";
    request({ action: "vicchat_dm", senha: state.senha, config: JSON.stringify(config) }).then(function (res) {
      btn.disabled = false;
      if (tratar(res)) { $("#fx-salvo").textContent = "Salvo ✓"; fxAbrir(fx.aberto); var s = $("#fx-salvo"); if (s) s.textContent = "Salvo ✓"; }
      else $("#fx-salvo").textContent = "Não foi salvo.";
    }, function () { btn.disabled = false; $("#fx-salvo").textContent = "Sem conexão: não foi salvo."; });
  }

  function fxLigar() {
    $("#fx-canvas").addEventListener("click", function (e) { var no = e.target.closest(".fx-no"); if (no) fxAbrir(no.id.slice(3)); });
    $("#fx-canvas").addEventListener("keydown", function (e) { var no = e.target.closest(".fx-no"); if (no && e.key === "Enter") fxAbrir(no.id.slice(3)); });
    $("#fx-fechar").addEventListener("click", fxFechar);
    $("#fx-gaveta").addEventListener("submit", fxSalvar);
    $("#fx-gaveta").addEventListener("click", function (e) { if (e.target.id === "fx-ir-config") { fxFechar(); setTimeout(function () { abrirTab("config"); }, 0); } });
    $("#fx-toggle").addEventListener("change", alternarDm);
    $$("#fx-periodo button").forEach(function (b) {
      b.addEventListener("click", function () { state.dias = +b.dataset.dias; carregar(); });
    });
    // Arrastar para mover a teia (mouse)
    var wrap = $("#fx-wrap"), arr = null;
    wrap.addEventListener("mousedown", function (e) { if (e.target.closest(".fx-no")) return; arr = { x: e.clientX, y: e.clientY, l: wrap.scrollLeft, t: wrap.scrollTop }; wrap.classList.add("is-arrastando"); });
    window.addEventListener("mousemove", function (e) { if (!arr) return; wrap.scrollLeft = arr.l - (e.clientX - arr.x); wrap.scrollTop = arr.t - (e.clientY - arr.y); });
    window.addEventListener("mouseup", function () { arr = null; wrap.classList.remove("is-arrastando"); });
    window.addEventListener("resize", function () { if (!$("#view-fluxo").hidden && fx.montado) fxLinhas(); });
  }

  fxLigar();
  $("#card-dm").addEventListener("click", function (e) { if (!e.target.closest(".vc-switch")) location.hash = "fluxo"; });

  /* ───────────── Dados de exemplo (?demo=1) ───────────── */

  var demoDados = null;
  function demo(params) {
    if (!demoDados) {
      var porDia = {}, ultimas = [], nomes = ["ana.receitas", "carlos_fin", "ju.makeup", "pedro.alves", "bia_fit", "lucas.dev"];
      for (var i = 0; i < 14; i++) { var dt = new Date(); dt.setDate(dt.getDate() - i); porDia[diaKey(dt)] = Math.round(Math.random() * 30) + (i < 3 ? 12 : 0); }
      for (var k = 0; k < 12; k++) ultimas.push({ data: new Date(Date.now() - k * 23 * 60000).toISOString(), post: "https://www.instagram.com/reel/DdJo0VaRsIc/", usuario: nomes[k % nomes.length], comentario: k % 3 ? "Eu quero!!" : "quero o passo a passo 🙏", resposta: "Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗", status: k === 4 ? "erro: limite de respostas atingido" : "ok" });
      demoDados = { ok: true, ativo: true, gatilho: true, conta: "somais1victor", ultimaRodada: Date.now() - 2 * 60000, erro: "",
        config: { palavras: ["quero", "passo a passo", "link", "como faz", "me manda"], ignorar: ["nao quero"], respostas: ["Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗", "Te chamei no direct mas não foi 😕 Tá tudo no link da minha bio, corre lá! 👆"], postsFixos: ["DdJo0VaRsIc"], maxPorRodada: 6, maxPorDia: 150, postsRecentes: 12, minutos: 1 },
        stats: { total: 1284, hoje: porDia[diaKey(new Date())], semana: 196, erros: 1, porDia: porDia }, ultimas: ultimas,
        dm: { ativo: true, texto: "Aqui está o passo a passo que você pediu 👇 Toca no botão pra começar.", botao: "Ver o passo a passo",
          link: "https://www.ovictorgomes.com.br/quiz?utm_source=instagram&utm_medium=direct&utm_campaign=vicchat",
          abrir: "Oi! Vi seu comentário 😊 Toca no botão aqui embaixo que eu te mando o passo a passo 👇", abrirBotao: "Quero o passo a passo",
          seguir: "Pra eu te mandar o passo a passo, me segue aqui no perfil 🙏 Depois é só tocar em \"Já segui\" 👇",
          aindaNao: "Ainda não apareceu que você me segue 😅 Segue o perfil e toca em \"Já segui\" de novo 👇", seguiBotao: "Já segui ✅",
          tentativas: 3, atraso: 5, porDia: 40, porRodada: 2, hoje: 12, total: 87, dias: 7, esperando: 6, erro: "",
          respostas: ["Te mandei no direct 👀 Se não aparecer, olha em Pedidos de mensagem."],
          falhou: ["Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗"],
          met: { g: 142, l: 51, s: 38, a: 29, t: 44, ls: 31, n: 9, f: 4 },
          cliques: { link_direto: { visitas: 33, quiz: 29, checkout: 9 }, link_seguir: { visitas: 14, quiz: 12, checkout: 3 }, link_botao: { visitas: 6, quiz: 5, checkout: 1 } },
          ultimos: [] } };
    }
    if (params.action === "vicchat_ativar") demoDados.ativo = params.ativo === "1";
    if (params.action === "vicchat_dm" && params.ativo) demoDados.dm.ativo = params.ativo === "1";
    if (params.action === "vicchat_dm" && params.config) Object.assign(demoDados.dm, JSON.parse(params.config));
    if (params.dias) demoDados.dm.dias = +params.dias;
    if (params.action === "vicchat_config") { var c = JSON.parse(params.config); c.postsRecentes = 12; c.minutos = 1; demoDados.config = c; }
    return JSON.parse(JSON.stringify(demoDados));
  }

  /* ───────────── Início ───────────── */

  try { state.senha = localStorage.getItem(STORE) || ""; } catch (e) { state.senha = ""; }
  if (DEMO || state.senha) { showApp(); carregar(); } else showLogin("");
})();
