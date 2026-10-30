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
  var TITULOS = { inicio: "Início", automacoes: "Automação", comentarios: "Automação" };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var state = { senha: "", dados: null, tab: "geral", timer: null, config: null };

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
    $$(".vc-nav a").forEach(function (a) { a.classList.toggle("is-on", a.dataset.view === v || (v === "comentarios" && a.dataset.view === "automacoes")); });
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

    renderGrafico(s.porDia || {});
    renderFluxo(d.config);
    renderTabela(d.ultimas || []);
    if (!state.config || !state.editando) renderConfig(d.config);
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

  /* ───────────── Dados de exemplo (?demo=1) ───────────── */

  var demoDados = null;
  function demo(params) {
    if (!demoDados) {
      var porDia = {}, ultimas = [], nomes = ["ana.receitas", "carlos_fin", "ju.makeup", "pedro.alves", "bia_fit", "lucas.dev"];
      for (var i = 0; i < 14; i++) { var dt = new Date(); dt.setDate(dt.getDate() - i); porDia[diaKey(dt)] = Math.round(Math.random() * 30) + (i < 3 ? 12 : 0); }
      for (var k = 0; k < 12; k++) ultimas.push({ data: new Date(Date.now() - k * 23 * 60000).toISOString(), post: "https://www.instagram.com/reel/DdJo0VaRsIc/", usuario: nomes[k % nomes.length], comentario: k % 3 ? "Eu quero!!" : "quero o passo a passo 🙏", resposta: "Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗", status: k === 4 ? "erro: limite de respostas atingido" : "ok" });
      demoDados = { ok: true, ativo: true, gatilho: true, conta: "somais1victor", ultimaRodada: Date.now() - 2 * 60000, erro: "",
        config: { palavras: ["quero", "passo a passo", "link", "como faz", "me manda"], ignorar: ["nao quero"], respostas: ["Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗", "Te chamei no direct mas não foi 😕 Tá tudo no link da minha bio, corre lá! 👆"], postsFixos: ["DdJo0VaRsIc"], maxPorRodada: 6, maxPorDia: 150, postsRecentes: 12, minutos: 1 },
        stats: { total: 1284, hoje: porDia[diaKey(new Date())], semana: 196, erros: 1, porDia: porDia }, ultimas: ultimas };
    }
    if (params.action === "vicchat_ativar") demoDados.ativo = params.ativo === "1";
    if (params.action === "vicchat_config") { var c = JSON.parse(params.config); c.postsRecentes = 12; c.minutos = 1; demoDados.config = c; }
    return JSON.parse(JSON.stringify(demoDados));
  }

  /* ───────────── Início ───────────── */

  try { state.senha = localStorage.getItem(STORE) || ""; } catch (e) { state.senha = ""; }
  if (DEMO || state.senha) { showApp(); carregar(); } else showLogin("");
})();
