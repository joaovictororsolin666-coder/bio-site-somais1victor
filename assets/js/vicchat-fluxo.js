/* ==========================================================================
   VicChat — fluxo do Direct: prévia com métricas (#fluxo) e editor em tela cheia
   (barra de blocos para arrastar, blocos livres, setas que se ligam e se movem).
   Usa window.VC (exposto por vicchat.js). Salva com a ação vicchat_fluxo.
   ========================================================================== */
(function () {
  "use strict";
  var VC = window.VC;
  if (!VC) return;
  var $ = VC.$, $$ = VC.$$, esc = VC.esc, nf = VC.nf;

  var TIPOS = {
    gatilho: { nome: "Gatilho", cor: "azul", titulo: "Quando…" },
    atraso: { nome: "Atraso", cor: "amarelo", titulo: "Atraso" },
    segue: { nome: "Condição", cor: "roxo", titulo: "Segue o perfil?" },
    mensagem: { nome: "Instagram", cor: "verde", titulo: "Enviar mensagem" },
    espera: { nome: "Espera", cor: "amarelo", titulo: "Espera a resposta" }
  };
  var PALETA = [
    { tipo: "mensagem", desc: "Texto com botão de link ou de resposta" },
    { tipo: "segue", desc: "Divide entre quem segue e quem não segue" },
    { tipo: "atraso", desc: "Espera alguns segundos" },
    { tipo: "espera", desc: "Continua quando a pessoa responder" }
  ];

  function saidas(no) {
    if (no.tipo === "segue") return [["sim", "Sim"], ["nao", "Não"], ["talvez", "Não dá pra saber"]];
    if (no.tipo === "espera") return [["prox", "Quando responder"]];
    if (no.tipo === "mensagem" && no.botao === "respostas" && (no.respostas || []).length)
      return no.respostas.map(function (t, i) { return ["b" + i, "Tocou em “" + t + "”"]; });
    return [["prox", no.tipo === "gatilho" ? "Então" : "Depois"]];
  }

  /* ───────────── Desenho (prévia e editor usam o mesmo) ───────────── */

  function metricas(no, dm) {
    var m = (dm.fxMet || {})[no.id] || {}, cl = { visitas: 0, checkout: 0 }, it = [];
    Object.keys(dm.cliques || {}).forEach(function (k) { if (k === "fx_" + no.id || k.indexOf("fx_" + no.id + "_") === 0) { cl.visitas += dm.cliques[k].visitas; cl.checkout += dm.cliques[k].checkout; } });
    if (no.tipo === "gatilho") it.push([m.p, "execuções"]);
    else if (no.tipo === "mensagem") {
      it.push([m.e, "enviadas"]);
      if (no.botao === "respostas") it.push([m.r, "responderam", pct(m.r, m.e)]);
      if (no.botao === "link") { it.push([cl.visitas, "cliques", pct(cl.visitas, m.e)]); if (cl.checkout) it.push([cl.checkout, "checkout"]); }
      if (m.f) it.push([m.f, "falharam"]);
    } else if (no.tipo === "espera") it.push([m.r, "responderam"]);
    else it.push([m.p, "passaram"]);
    return '<div class="fe-met">' + it.map(function (x) { return "<span><b>" + nf.format(x[0] || 0) + "</b> " + x[1] + (x[2] ? " · " + x[2] : "") + "</span>"; }).join("") + "</div>";
  }

  function icone(tipo) {
    var d = { gatilho: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', atraso: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      segue: '<path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9"/>',
      espera: '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>',
      mensagem: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>' };
    return '<i class="fe-ico fe-ico--' + tipo + '"><svg viewBox="0 0 24 24">' + (d[tipo] || d.espera) + "</svg></i>";
  }

  // Faixa de métricas no topo da mensagem: Enviado · Respondeu · Clicou · Falhou
  function faixa(no, dm) {
    var m = (dm.fxMet || {})[no.id] || {}, cl = 0;
    Object.keys(dm.cliques || {}).forEach(function (k) { if (k === "fx_" + no.id || k.indexOf("fx_" + no.id + "_") === 0) cl += dm.cliques[k].visitas || 0; });
    var cel = [[nf.format(m.e || 0), "Enviado"]];
    if (no.botao === "respostas") cel.push([pct(m.r, m.e) || "0%", "Respondeu"]);
    if (no.botao === "link") cel.push([pct(cl, m.e) || "0%", "Clicou"]);
    cel.push([nf.format(m.f || 0), "Falhou"]);
    return '<div class="fe-faixa">' + cel.map(function (c) { return "<span><b>" + c[0] + "</b><small>" + c[1] + "</small></span>"; }).join("") + "</div>";
  }

  function pct(a, b) { return b ? Math.round((a || 0) / b * 1000) / 10 + "%" : ""; }

  // Botão dentro da mensagem, com a bolinha de saída e os toques/cliques dele
  function htmlBotao(no, dm, rotulo, saida, extra, classe) {
    return '<span class="fe-bt' + (classe || "") + '">' + esc(rotulo) + (extra ? "<small>" + extra + "</small>" : "") +
      (saida ? '<i class="fe-porta fe-porta--out" data-de="' + esc(no.id) + '" data-saida="' + saida + '"></i>' : "") + "</span>";
  }

  function corpo(no, dm, palavras) {
    if (no.tipo === "gatilho") return '<div class="fe-gatcard">' + icone("mensagem") + '<p>O usuário comenta em ' + (no.posts && no.posts.length ? "um post ou reel <b>específico</b>" : "<b>qualquer</b> post ou reel") + " e o comentário inclui</p></div>" +
      '<div class="fe-kws">' + (palavras || []).slice(0, 6).map(function (p) { return '<span class="vc-kw">' + esc(p) + "</span>"; }).join(" ") + "</div>" +
      (no.posts && no.posts.length ? '<p class="fe-mini">' + no.posts.length + (no.posts.length > 1 ? " posts escolhidos" : " post escolhido") + "</p>" : "") +
      (no.posts && no.posts.length ? '<div class="fe-posts">' + no.posts.slice(0, 5).map(function (x) { return x.thumb ? '<img src="' + esc(x.thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : "<span>▶</span>"; }).join("") + (no.posts.length > 5 ? "<span>+" + (no.posts.length - 5) + "</span>" : "") + "</div>" : "") +
      '<p class="fe-mini">Também responde o comentário: “' + esc(((no.respostas || [])[0] || "").slice(0, 70)) + "…”</p>";
    if (no.tipo === "atraso") return '<p class="fe-grande">' + (no.seg ? no.seg + " s" : "Sem espera") + "</p>";
    if (no.tipo === "segue") return '<p class="fe-mini">Confere no Instagram se a pessoa segue o perfil.</p>';
    if (no.tipo === "espera") return '<p class="fe-mini">Continua quando a pessoa responder no Direct (até 24 h).</p>';
    var h = '<p class="fe-bolha">' + esc(no.texto || "") + "</p>", m = (dm.fxMet || {})[no.id] || {};
    if (no.botao === "link") linksDe(no).forEach(function (l, i) {
      var c = ((dm.cliques || {})["fx_" + no.id + "_" + i] || {}).visitas || 0;
      h += htmlBotao(no, dm, l.titulo + " ↗", "", nf.format(c) + " cliques" + (m.e ? " · " + pct(c, m.e) : ""), " fe-bt--url");
    });
    if (no.botao === "respostas") (no.respostas || []).forEach(function (t, i) {
      var c = m["b" + i] || 0;
      h += htmlBotao(no, dm, t, "b" + i, nf.format(c) + " toques" + (m.e ? " · " + pct(c, m.e) : ""));
    });
    return h;
  }

  function linksDe(no) { return (no.links && no.links.length) ? no.links : (no.link && no.link.url ? [no.link] : []); }

  function htmlNo(no, dm, palavras, editor) {
    var t = TIPOS[no.tipo];
    return '<article class="fe-no fe-no--' + t.cor + '" data-id="' + esc(no.id) + '" style="left:' + no.x + "px;top:" + no.y + 'px">' +
      (no.tipo !== "gatilho" ? '<i class="fe-porta fe-porta--in" data-in="' + esc(no.id) + '"></i>' : "") +
      '<header class="fe-cab">' + icone(no.tipo) + '<span><span class="fe-tipo">' + t.nome + "</span><strong>" + esc(t.titulo) + "</strong></span></header>" +
      (no.tipo === "mensagem" ? faixa(no, dm) : "") +
      '<div class="fe-corpo">' + corpo(no, dm, palavras) + "</div>" +
      '<ul class="fe-saidas">' + saidas(no).filter(function (s) { return !/^b\d$/.test(s[0]); }).map(function (s) {
        return '<li data-saida="' + s[0] + '"><span>' + esc(s[1]) + '</span><i class="fe-porta fe-porta--out" data-de="' + esc(no.id) + '" data-saida="' + s[0] + '"></i></li>';
      }).join("") + "</ul>" + (no.tipo === "mensagem" ? "" : metricas(no, dm)) + "</article>";
  }

  function desenhar(camada, f, dm, palavras, editor) {
    camada.innerHTML = '<svg class="fe-setas"><defs><marker id="fe-ponta' + (editor ? "E" : "P") + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="fe-ligas"></g><path class="fe-temp" d=""/></svg>' +
      f.nos.map(function (no) { return htmlNo(no, dm, palavras, editor); }).join("");
    setas(camada, f, editor);
  }

  function porta(camada, sel) {
    var el = camada.querySelector(sel);
    if (!el) return null;
    var z = camada.id === "fe-camada" ? ed.z : 1, rc = camada.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - rc.left) / z, y: (r.top + r.height / 2 - rc.top) / z };
  }
  function curva(a, b) {
    var dx = Math.max(60, Math.abs(b.x - a.x) / 2);
    return "M" + a.x + " " + a.y + " C" + (a.x + dx) + " " + a.y + " " + (b.x - dx) + " " + b.y + " " + b.x + " " + b.y;
  }

  function setas(camada, f, editor) {
    var g = camada.querySelector(".fe-ligas"), marca = "url(#fe-ponta" + (editor ? "E" : "P") + ")";
    g.innerHTML = f.ligas.map(function (l, i) {
      var a = porta(camada, '.fe-porta--out[data-de="' + l.de + '"][data-saida="' + l.saida + '"]'), b = porta(camada, '.fe-porta--in[data-in="' + l.para + '"]');
      if (!a || !b) return "";
      var d = curva(a, b), sel = editor && ed.liga === i ? " is-sel" : "";
      return '<path class="fe-liga' + sel + '" d="' + d + '" marker-end="' + marca + '"/>' + (editor ? '<path class="fe-liga-hit" data-liga="' + i + '" d="' + d + '"/>' : "");
    }).join("");
    var svg = camada.querySelector(".fe-setas"), w = 0, h = 0;
    $$(".fe-no", camada).forEach(function (n) { w = Math.max(w, n.offsetLeft + n.offsetWidth + 200); h = Math.max(h, n.offsetTop + n.offsetHeight + 200); });
    svg.setAttribute("width", w); svg.setAttribute("height", h);
    if (!editor) { camada.style.width = w + "px"; camada.style.height = h + "px"; }
  }

  /* ───────────── Prévia na tela #fluxo ───────────── */

  function render() {
    var d = VC.state.dados;
    var temFluxo = d && d.dm && d.dm.fluxo;
    $("#fx-sem").hidden = !(d && d.dm && !temFluxo);
    if (!temFluxo) return;
    var dm = d.dm, fm = dm.fxMet || {}, f = dm.fluxo, soma = function (k, filtro) {
      return f.nos.filter(filtro || function () { return true; }).reduce(function (t, n) { return t + (((fm[n.id] || {})[k]) || 0); }, 0);
    };
    var cl = { visitas: 0, quiz: 0, checkout: 0 };
    Object.keys(dm.cliques || {}).forEach(function (k) { if (/^fx_|^link_/.test(k)) { var o = dm.cliques[k]; cl.visitas += o.visitas; cl.quiz += o.quiz; cl.checkout += o.checkout; } });
    var gat = f.nos.filter(function (n) { return n.tipo === "gatilho"; })[0] || {};
    var comLink = soma("e", function (n) { return n.tipo === "mensagem" && n.botao === "link"; });
    var tiles = [
      ["Execuções", (fm[gat.id] || {}).p, ""], ["DMs enviadas", soma("e"), ""], ["Responderam", soma("r"), ""],
      ["Receberam o link", comLink, ""], ["Cliques no link", cl.visitas, comLink ? Math.round(cl.visitas / comLink * 100) + "% de quem recebeu" : ""],
      ["Começaram o quiz", cl.quiz, ""], ["Clicaram no checkout", cl.checkout, ""]
    ];
    $("#fx-tiles").innerHTML = tiles.map(function (t) { return '<div class="mc-met__card"><span>' + t[0] + "</span><b>" + nf.format(t[1] || 0) + "</b>" + (t[2] ? "<small>" + t[2] + "</small>" : "") + "</div>"; }).join("");
    $("#fx-pill").textContent = dm.ativo && d.ativo ? "ATIVA" : dm.ativo ? "AGUARDANDO" : "DESLIGADA";
    $("#fx-pill").classList.toggle("is-on", !!(dm.ativo && d.ativo));
    $("#fx-toggle").checked = !!dm.ativo;
    $("#fx-toggle").disabled = false;
    $$("#fx-periodo button").forEach(function (b) { b.classList.toggle("is-on", +b.dataset.dias === (dm.dias || 7)); });
    $("#fx-erro").textContent = dm.erro && !dm.ativo ? "Desligado por erro: " + dm.erro : "";
    $("#fx-erro").hidden = !(dm.erro && !dm.ativo);
    if (!$("#view-fluxo").hidden) desenhar($("#fx-canvas"), f, dm, (d.config || {}).palavras, false);
    if (ed.aberto && !ed.sujo) { ed.f = copia(f); redesenhar(); }
  }

  /* ───────────── Editor em tela cheia ───────────── */

  var ed = { aberto: false, f: null, sel: "", liga: -1, sujo: false, z: 1, px: 40, py: 40 };
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function dm() { return (VC.state.dados || {}).dm || {}; }
  function palavras() { return ((VC.state.dados || {}).config || {}).palavras || []; }
  function acharNo(id) { return ed.f.nos.filter(function (n) { return n.id === id; })[0]; }

  function abrir(selId) {
    var d = dm();
    if (!d.fluxo) return;
    ed.f = copia(d.fluxo); ed.sel = ""; ed.liga = -1; ed.sujo = false; ed.aberto = true;
    $("#fe").hidden = false;
    document.body.classList.add("fe-aberto");
    redesenhar();
    if (selId) selecionar(selId); else painel();
    status();
  }
  function fechar() {
    if (ed.sujo && !confirm("Sair sem salvar as alterações do fluxo?")) return;
    ed.aberto = false; $("#fe").hidden = true; document.body.classList.remove("fe-aberto");
  }

  function aplicarZoom() {
    $("#fe-camada").style.transform = "translate(" + ed.px + "px," + ed.py + "px) scale(" + ed.z + ")";
    $("#fe-zoom-val").textContent = Math.round(ed.z * 100) + "%";
  }
  function redesenhar() {
    desenhar($("#fe-camada"), ed.f, dm(), palavras(), true);
    $$(".fe-no", $("#fe-camada")).forEach(function (n) { n.classList.toggle("is-sel", n.dataset.id === ed.sel); });
    aplicarZoom();
  }
  function mudou() { ed.sujo = true; status(); }
  function status() {
    $("#fe-status").textContent = ed.sujo ? "Alterações não salvas" : "Tudo salvo";
    $("#fe-status").classList.toggle("is-sujo", ed.sujo);
  }

  function aCanvas(e) {
    var r = $("#fe-palco").getBoundingClientRect();
    return { x: (e.clientX - r.left - ed.px) / ed.z, y: (e.clientY - r.top - ed.py) / ed.z };
  }

  function selecionar(id) {
    ed.sel = id; ed.liga = -1;
    $$(".fe-no", $("#fe-camada")).forEach(function (n) { n.classList.toggle("is-sel", n.dataset.id === id); });
    setas($("#fe-camada"), ed.f, true);
    painel();
  }

  /* Painel de propriedades */
  function campo(rotulo, html, dica) { return '<label class="fe-campo"><span>' + rotulo + "</span>" + html + (dica ? '<small>' + dica + "</small>" : "") + "</label>"; }
  function painel() {
    var no = ed.sel && acharNo(ed.sel), box = $("#fe-props");
    if (ed.liga > -1) {
      var l = ed.f.ligas[ed.liga];
      box.innerHTML = '<span class="fe-tipo">Seta</span><h3>Ligação</h3><p class="vc-muted">De “' + esc(TIPOS[acharNo(l.de).tipo].titulo) + "” para “" + esc(TIPOS[acharNo(l.para).tipo].titulo) + '”. Para mudar o destino, arraste a bolinha de saída até outro bloco.</p><button type="button" class="vc-btn fe-perigo" data-acao="apagar-liga">Apagar seta</button>';
      return;
    }
    if (!no) {
      box.innerHTML = '<span class="fe-tipo">Dica</span><h3>Monte o fluxo</h3><ul class="fe-dicas"><li>Arraste um bloco da barra da esquerda para o quadro.</li><li>Arraste um bloco pelo topo para mudar de lugar.</li><li>Puxe a bolinha da direita de um bloco até outro para ligar uma seta. Puxe de novo para mudar o destino.</li><li>Clique em uma seta para apagar.</li><li>Arraste o fundo para navegar. Use + e − para o zoom.</li></ul>';
      return;
    }
    var t = TIPOS[no.tipo], h = '<span class="fe-tipo fe-tipo--' + t.cor + '">' + t.nome + "</span><h3>" + esc(t.titulo) + "</h3>";
    if (no.tipo === "gatilho") {
      h += '<div class="fe-passo"><span class="fe-passo__n">1</span><b>Quando alguém comenta em</b></div>' +
        '<div class="fe-campo"><span class="vc-sr">Posts e reels</span>' +
          '<select class="vc-input" data-acao-sel="posts"><option value="todos"' + (no.posts && no.posts.length ? "" : " selected") + '>Todos os posts e reels</option><option value="escolher"' + (no.posts && no.posts.length ? " selected" : "") + ">Só os posts que eu escolher</option></select>" +
          (no.posts && no.posts.length ? '<div class="fe-posts">' + no.posts.map(function (x) { return x.thumb ? '<img src="' + esc(x.thumb) + '" alt="" title="' + esc(x.legenda || "") + '" referrerpolicy="no-referrer">' : "<span>▶</span>"; }).join("") + "</div>" : "") +
          (no.posts && no.posts.length ? '<button type="button" class="vc-btn vc-btn--ghost" data-acao="escolher-posts">Trocar posts escolhidos</button>' : "") +
          "</div>" +
        '<div class="fe-passo"><span class="fe-passo__n">2</span><b>E o comentário</b></div>' +
        '<div class="fe-caixa"><p class="vc-muted">contém estas palavras-chave:</p><div class="fe-kws">' + palavras().map(function (p) { return '<span class="mc-chip">' + esc(p) + "</span>"; }).join("") + '</div><a href="#comentarios" data-acao="palavras">Editar palavras-chave</a></div>' +
        '<div class="fe-passo"><span class="fe-passo__n">3</span><b>Responder também ao comentário</b></div>' +
        campo("Quando a DM sai", '<textarea class="vc-input" rows="4" data-k="respostas" data-lista="1">' + esc((no.respostas || []).join("\n")) + "</textarea>", "Uma por linha. Uma é sorteada.") +
        campo("Quando a DM não sai (ou passou da trava do dia)", '<textarea class="vc-input" rows="4" data-k="falhou" data-lista="1">' + esc((no.falhou || []).join("\n")) + "</textarea>", "Uma por linha.");
    } else if (no.tipo === "atraso") {
      h += campo("Segundos de espera (0 a 60)", '<input class="vc-input" type="number" min="0" max="60" data-k="seg" value="' + (no.seg || 0) + '">');
    } else if (no.tipo === "segue") {
      h += '<p class="vc-muted">Saídas: <b>Sim</b> (segue), <b>Não</b> (não segue) e <b>Não dá pra saber</b> (o Instagram só informa depois que a pessoa fala com o perfil, por isso vale mandar um botão de resposta antes).</p>';
    } else if (no.tipo === "espera") {
      h += '<p class="vc-muted">O fluxo para aqui e continua quando a pessoa mandar qualquer mensagem no Direct, em até 24 h.</p>';
    } else {
      var resp = no.respostas || [];
      h += campo("Texto da mensagem", '<textarea class="vc-input" rows="5" maxlength="900" data-k="texto">' + esc(no.texto || "") + "</textarea>") +
        campo("Botão", '<select class="vc-input" data-k="botao"><option value="nenhum"' + (no.botao === "nenhum" ? " selected" : "") + '>Sem botão</option><option value="link"' + (no.botao === "link" ? " selected" : "") + '>Botão com link</option><option value="respostas"' + (no.botao === "respostas" ? " selected" : "") + ">Botões de resposta</option></select>");
      if (no.botao === "link") {
        no.links = linksDe(no).slice();
        h += '<div class="fe-campo"><span>Botões de link (até 3)</span>' + no.links.map(function (l, i) {
          return '<div class="fe-link"><div class="fe-linha"><input class="vc-input" maxlength="20" placeholder="Texto do botão" data-link="' + i + '" data-c="titulo" value="' + esc(l.titulo) + '">' +
            '<button type="button" class="vc-icone" data-acao="tirar-link" data-i="' + i + '" aria-label="Remover botão">×</button></div>' +
            '<input class="vc-input" type="url" placeholder="https://..." data-link="' + i + '" data-c="url" value="' + esc(l.url) + '"></div>';
        }).join("") + (no.links.length < 3 ? '<button type="button" class="vc-btn vc-btn--ghost" data-acao="add-link">+ Adicionar botão de link</button>' : "") +
          '<small>Texto do botão: até 20 letras. Os cliques nos links do quiz aparecem no bloco.</small></div>';
      } else if (no.botao === "respostas") {
        h += '<div class="fe-campo"><span>Botões (até 3). Cada um ganha uma saída própria.</span>' +
          resp.map(function (r, i) { return '<div class="fe-linha"><input class="vc-input" maxlength="20" data-resp="' + i + '" value="' + esc(r) + '"><button type="button" class="vc-icone" data-acao="tirar-resp" data-i="' + i + '" aria-label="Remover botão">×</button></div>'; }).join("") +
          (resp.length < 3 ? '<button type="button" class="vc-btn vc-btn--ghost" data-acao="add-resp">+ Adicionar botão</button>' : "") + "</div>" +
          campo("Como os botões aparecem no Direct", '<select class="vc-input" data-k="estilo"><option value="botao"' + (no.estilo !== "rapida" ? " selected" : "") + '>Dentro da mensagem</option><option value="rapida"' + (no.estilo === "rapida" ? " selected" : "") + ">Flutuantes (acima do teclado)</option></select>");
      }
      h += '<p class="fe-aviso">Regra do Instagram: depois da 1ª mensagem, as próximas só saem quando a pessoa responder. Se a mensagem não tem botão de resposta e liga em outra mensagem, o fluxo espera a pessoa responder.</p>';
    }
    if (no.tipo !== "gatilho") h += '<div class="fe-acoes"><button type="button" class="vc-btn vc-btn--ghost" data-acao="duplicar">Duplicar</button><button type="button" class="vc-btn fe-perigo" data-acao="apagar">Apagar bloco</button></div>';
    box.innerHTML = h;
  }

  // Janela com os últimos posts e reels para marcar quais disparam o Direct
  function escolherPosts(g) {
    var marcados = {}; (g.posts || []).forEach(function (x) { marcados[x.id] = x; });
    var caixa = document.createElement("div");
    caixa.className = "vc-modal";
    caixa.innerHTML = '<div class="vc-modal__caixa" role="dialog" aria-modal="true" aria-label="Escolher posts"><h3>Escolha os posts e reels</h3><div class="vc-grade"><div class="vc-esqueleto"></div><div class="vc-esqueleto"></div><div class="vc-esqueleto"></div></div>' +
      '<div class="vc-modal__rodape"><span class="vc-muted" data-n></span><span><button type="button" class="vc-btn vc-btn--ghost" data-x>Cancelar</button> <button type="button" class="vc-btn vc-btn--primary" data-ok>Usar estes posts</button></span></div></div>';
    document.body.appendChild(caixa);
    var lista = [], grade = $(".vc-grade", caixa), conta = function () { $("[data-n]", caixa).textContent = Object.keys(marcados).length + " escolhidos"; };
    var fechar2 = function () { caixa.remove(); painel(); };
    conta();
    VC.request({ action: "vicchat_posts", senha: VC.state.senha }).then(function (r) {
      if (!r || !r.ok) { grade.innerHTML = '<p class="vc-erro">Não deu para carregar os posts' + (r && /obrigat|desconhec/i.test(r.error || "") ? ": falta publicar a versão nova do Apps Script." : ".") + "</p>"; return; }
      lista = r.posts || [];
      grade.innerHTML = lista.map(function (x) {
        var d = new Date(x.data);
        return '<button type="button" class="vc-post' + (marcados[x.id] ? " is-on" : "") + '" data-id="' + esc(x.id) + '">' +
          (x.thumb ? '<img src="' + esc(x.thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="vc-post__sem"></span>') +
          "<b>" + (x.tipo === "VIDEO" ? "Reel" : x.tipo === "CAROUSEL_ALBUM" ? "Carrossel" : "Post") + " · " + d.getDate() + "/" + (d.getMonth() + 1) + "</b>" +
          "<small>" + esc(x.legenda || "Sem legenda") + " · " + nf.format(x.comentarios) + " coment.</small></button>";
      }).join("") || '<p class="vc-muted">Nenhum post encontrado.</p>';
    }, function () { grade.innerHTML = '<p class="vc-erro">Sem conexão.</p>'; });
    caixa.addEventListener("click", function (e) {
      var b = e.target.closest(".vc-post");
      if (b) {
        var x = lista.filter(function (p) { return p.id === b.dataset.id; })[0];
        if (marcados[x.id]) delete marcados[x.id]; else marcados[x.id] = { id: x.id, permalink: x.permalink, thumb: x.thumb, legenda: x.legenda };
        b.classList.toggle("is-on", !!marcados[x.id]); conta(); return;
      }
      if (e.target.closest("[data-x]") || e.target === caixa) { fechar2(); return; }
      if (e.target.closest("[data-ok]")) { g.posts = Object.keys(marcados).map(function (k) { return marcados[k]; }); mudou(); redesenhar(); fechar2(); }
    });
  }

  function editarCampo(el) {
    var no = acharNo(ed.sel);
    if (!no) return;
    if (el.dataset.resp != null) { no.respostas[+el.dataset.resp] = el.value; }
    else if (el.dataset.link != null) { no.links[+el.dataset.link][el.dataset.c] = el.value; }
    else {
      var k = el.dataset.k, v = el.dataset.lista ? el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean) : el.value;
      if (k === "seg") v = Math.max(0, Math.min(60, parseInt(v, 10) || 0));
      if (k.indexOf("link.") === 0) { no.link = no.link || {}; no.link[k.slice(5)] = v; } else no[k] = v;
      if (k === "botao") {
        if (v === "respostas" && !(no.respostas || []).length) no.respostas = ["Quero"];
        if (v === "link" && !linksDe(no).length) no.links = [{ titulo: "Abrir", url: (dm().link || "") }];
        limparLigas(no); painel();
      }
    }
    mudou();
    var el2 = $('.fe-no[data-id="' + no.id + '"]', $("#fe-camada"));
    if (el2) { var novo = document.createElement("div"); novo.innerHTML = htmlNo(no, dm(), palavras(), true); el2.replaceWith(novo.firstChild); }
    $$(".fe-no", $("#fe-camada")).forEach(function (n) { n.classList.toggle("is-sel", n.dataset.id === ed.sel); });
    setas($("#fe-camada"), ed.f, true);
  }
  // Tira setas de saídas que não existem mais (ex.: removeu um botão)
  function limparLigas(no) {
    var ok = saidas(no).map(function (s) { return s[0]; });
    ed.f.ligas = ed.f.ligas.filter(function (l) { return l.de !== no.id || ok.indexOf(l.saida) > -1; });
  }

  function novoId() { return "n" + Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 36).toString(36); }
  function novoNo(tipo, x, y) {
    var no = { id: novoId(), tipo: tipo, x: Math.round(x), y: Math.round(y) };
    if (tipo === "atraso") no.seg = 5;
    if (tipo === "mensagem") { no.texto = "Escreva sua mensagem aqui"; no.botao = "nenhum"; no.respostas = []; no.links = []; }
    ed.f.nos.push(no); mudou(); redesenhar(); selecionar(no.id);
  }

  function ligar(de, saida, para) {
    if (de === para) return;
    ed.f.ligas = ed.f.ligas.filter(function (l) { return !(l.de === de && l.saida === saida); });
    ed.f.ligas.push({ de: de, saida: saida, para: para });
    mudou(); setas($("#fe-camada"), ed.f, true);
  }

  function salvar() {
    var btn = $("#fe-salvar");
    btn.disabled = true; $("#fe-status").textContent = "Salvando…";
    VC.request({ action: "vicchat_fluxo", senha: VC.state.senha, fluxo: JSON.stringify(ed.f) }).then(function (res) {
      btn.disabled = false;
      if (res && res.ok) { ed.sujo = false; VC.tratar(res); status(); $("#fe-status").textContent = "Salvo ✓"; }
      else { $("#fe-status").textContent = res && res.error === "fluxo_sem_gatilho" ? "O fluxo precisa do bloco Gatilho." : "Não foi salvo."; VC.tratar(res); }
    }, function () { btn.disabled = false; $("#fe-status").textContent = "Sem conexão: não foi salvo."; });
  }

  /* ───────────── Interações (mouse e toque) ───────────── */

  function ligarEditor() {
    var palco = $("#fe-palco"), camada = $("#fe-camada"), arr = null;

    $("#fe-paleta").innerHTML = PALETA.map(function (p) {
      var t = TIPOS[p.tipo];
      return '<div class="fe-peca fe-peca--' + t.cor + '" data-tipo="' + p.tipo + '" tabindex="0" role="button" aria-label="Adicionar ' + t.titulo + '"><b>' + t.titulo + "</b><small>" + p.desc + "</small></div>";
    }).join("");

    // Arrastar da barra lateral para o quadro (ou clicar para adicionar no meio)
    $("#fe-paleta").addEventListener("pointerdown", function (e) {
      var peca = e.target.closest(".fe-peca");
      if (!peca) return;
      e.preventDefault();
      var fant = peca.cloneNode(true);
      fant.classList.add("fe-fantasma");
      document.body.appendChild(fant);
      var mover = function (ev) { fant.style.left = ev.clientX - 90 + "px"; fant.style.top = ev.clientY - 24 + "px"; };
      mover(e);
      arr = { tipo: "peca", peca: peca, fant: fant, x0: e.clientX, y0: e.clientY, mover: mover };
    });

    palco.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      var outP = e.target.closest(".fe-porta--out");
      if (outP) {
        e.preventDefault(); e.stopPropagation();
        var r = outP.getBoundingClientRect(), p0 = aCanvas({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
        arr = { tipo: "seta", de: outP.dataset.de, saida: outP.dataset.saida, p0: p0 };
        return;
      }
      var hit = e.target.closest(".fe-liga-hit");
      if (hit) { ed.liga = +hit.dataset.liga; ed.sel = ""; $$(".fe-no", camada).forEach(function (n) { n.classList.remove("is-sel"); }); setas(camada, ed.f, true); painel(); return; }
      var no = e.target.closest(".fe-no");
      if (no) {
        if (e.target.closest("input,textarea,select,button,a")) return;
        selecionar(no.dataset.id);
        var obj = acharNo(no.dataset.id), c = aCanvas(e);
        arr = { tipo: "no", el: no, obj: obj, dx: c.x - obj.x, dy: c.y - obj.y, moveu: false };
        try { no.setPointerCapture(e.pointerId); } catch (x) { /* sem captura */ }
        return;
      }
      ed.sel = ""; ed.liga = -1; $$(".fe-no", camada).forEach(function (n) { n.classList.remove("is-sel"); }); setas(camada, ed.f, true); painel();
      arr = { tipo: "fundo", x: e.clientX, y: e.clientY, px: ed.px, py: ed.py };
      palco.classList.add("is-arrastando");
    });

    window.addEventListener("pointermove", function (e) {
      if (!arr || !ed.aberto) return;
      if (arr.tipo === "peca") { arr.mover(e); return; }
      if (arr.tipo === "fundo") { ed.px = arr.px + e.clientX - arr.x; ed.py = arr.py + e.clientY - arr.y; aplicarZoom(); return; }
      if (arr.tipo === "no") {
        var c = aCanvas(e);
        arr.obj.x = Math.round(c.x - arr.dx); arr.obj.y = Math.round(c.y - arr.dy);
        arr.el.style.left = arr.obj.x + "px"; arr.el.style.top = arr.obj.y + "px";
        arr.moveu = true; setas(camada, ed.f, true);
        return;
      }
      if (arr.tipo === "seta") {
        var p = aCanvas(e);
        $(".fe-temp", camada).setAttribute("d", curva(arr.p0, p));
        $$(".fe-no", camada).forEach(function (n) { n.classList.remove("is-alvo"); });
        var alvo = document.elementFromPoint(e.clientX, e.clientY);
        alvo = alvo && alvo.closest(".fe-no");
        if (alvo && alvo.dataset.id !== arr.de && acharNo(alvo.dataset.id).tipo !== "gatilho") alvo.classList.add("is-alvo");
      }
    });

    window.addEventListener("pointerup", function (e) {
      if (!arr) return;
      var a = arr; arr = null;
      palco.classList.remove("is-arrastando");
      if (a.tipo === "peca") {
        a.fant.remove();
        var r = palco.getBoundingClientRect(), dentro = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
        var clique = Math.abs(e.clientX - a.x0) < 6 && Math.abs(e.clientY - a.y0) < 6;
        if (dentro) { var c = aCanvas(e); novoNo(a.peca.dataset.tipo, c.x - 130, c.y - 30); }
        else if (clique) { var m = aCanvas({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); novoNo(a.peca.dataset.tipo, m.x - 130, m.y - 60); }
        return;
      }
      if (a.tipo === "no" && a.moveu) { mudou(); return; }
      if (a.tipo === "seta") {
        $(".fe-temp", camada).setAttribute("d", "");
        $$(".fe-no", camada).forEach(function (n) { n.classList.remove("is-alvo"); });
        var alvo = document.elementFromPoint(e.clientX, e.clientY);
        alvo = alvo && alvo.closest(".fe-no");
        if (alvo && acharNo(alvo.dataset.id).tipo !== "gatilho") ligar(a.de, a.saida, alvo.dataset.id);
      }
    });

    // Zoom
    function zoom(fator, cx, cy) {
      var r = palco.getBoundingClientRect();
      cx = cx == null ? r.width / 2 : cx - r.left; cy = cy == null ? r.height / 2 : cy - r.top;
      var z = Math.max(0.35, Math.min(1.6, ed.z * fator));
      ed.px = cx - (cx - ed.px) * (z / ed.z); ed.py = cy - (cy - ed.py) * (z / ed.z); ed.z = z;
      aplicarZoom();
    }
    palco.addEventListener("wheel", function (e) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) zoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
      else { ed.px -= e.deltaX; ed.py -= e.deltaY; aplicarZoom(); }
    }, { passive: false });
    $("#fe-mais").addEventListener("click", function () { zoom(1.15); });
    $("#fe-menos").addEventListener("click", function () { zoom(1 / 1.15); });
    $("#fe-centro").addEventListener("click", function () {
      var r = palco.getBoundingClientRect(), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      $$(".fe-no", camada).forEach(function (n) { x0 = Math.min(x0, n.offsetLeft); y0 = Math.min(y0, n.offsetTop); x1 = Math.max(x1, n.offsetLeft + n.offsetWidth); y1 = Math.max(y1, n.offsetTop + n.offsetHeight); });
      ed.z = Math.max(0.35, Math.min(1, Math.min(r.width / (x1 - x0 + 80), r.height / (y1 - y0 + 80))));
      ed.px = (r.width - (x1 - x0) * ed.z) / 2 - x0 * ed.z; ed.py = (r.height - (y1 - y0) * ed.z) / 2 - y0 * ed.z;
      aplicarZoom();
    });

    // Painel de propriedades
    $("#fe-props").addEventListener("input", function (e) { if (e.target.matches("[data-k],[data-resp],[data-link]") && e.target.tagName !== "SELECT") editarCampo(e.target); });
    $("#fe-props").addEventListener("change", function (e) {
      if (e.target.matches("select[data-k]")) editarCampo(e.target);
      if (e.target.matches('[data-acao-sel="posts"]')) {
        var g = acharNo(ed.sel);
        if (e.target.value === "todos") { g.posts = []; mudou(); painel(); redesenhar(); }
        else escolherPosts(g);
      }
    });
    $("#fe-props").addEventListener("click", function (e) {
      var b = e.target.closest("[data-acao]");
      if (!b) return;
      var no = acharNo(ed.sel), acao = b.dataset.acao;
      if (acao === "palavras") { e.preventDefault(); if (!ed.sujo || confirm("Sair do editor sem salvar?")) { ed.sujo = false; fechar(); location.hash = "comentarios"; setTimeout(function () { VC.abrirTab("config"); }, 0); } return; }
      if (acao === "escolher-posts") { escolherPosts(acharNo(ed.sel)); return; }
      if (acao === "apagar-liga") { ed.f.ligas.splice(ed.liga, 1); ed.liga = -1; mudou(); setas(camada, ed.f, true); painel(); return; }
      if (!no) return;
      if (acao === "apagar") {
        ed.f.nos = ed.f.nos.filter(function (n) { return n.id !== no.id; });
        ed.f.ligas = ed.f.ligas.filter(function (l) { return l.de !== no.id && l.para !== no.id; });
        ed.sel = ""; mudou(); redesenhar(); painel();
      } else if (acao === "duplicar") {
        var c = copia(no); c.id = novoId(); c.x += 40; c.y += 40; ed.f.nos.push(c); mudou(); redesenhar(); selecionar(c.id);
      } else if (acao === "add-resp") { no.respostas = (no.respostas || []).concat(["Nova opção"]); mudou(); painel(); redesenhar(); }
      else if (acao === "add-link") { no.links = linksDe(no).concat([{ titulo: "Novo link", url: "https://" }]); mudou(); painel(); redesenhar(); }
      else if (acao === "tirar-link") { no.links = linksDe(no); no.links.splice(+b.dataset.i, 1); if (!no.links.length) no.botao = "nenhum"; mudou(); painel(); redesenhar(); }
      else if (acao === "tirar-resp") { no.respostas.splice(+b.dataset.i, 1); if (!no.respostas.length) no.botao = "nenhum"; limparLigas(no); mudou(); painel(); redesenhar(); }
    });

    $("#fe-salvar").addEventListener("click", salvar);
    $("#fe-voltar").addEventListener("click", fechar);
    document.addEventListener("keydown", function (e) {
      if (!ed.aberto) return;
      var digitando = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); salvar(); return; }
      if (digitando) return;
      if (e.key === "Escape") { ed.sel = ""; ed.liga = -1; redesenhar(); painel(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (ed.liga > -1) { ed.f.ligas.splice(ed.liga, 1); ed.liga = -1; mudou(); setas(camada, ed.f, true); painel(); }
        else if (ed.sel && acharNo(ed.sel).tipo !== "gatilho") { var b2 = $('[data-acao="apagar"]', $("#fe-props")); if (b2) b2.click(); }
      }
    });
    window.addEventListener("beforeunload", function (e) { if (ed.aberto && ed.sujo) { e.preventDefault(); e.returnValue = ""; } });
    window.addEventListener("resize", function () { if (!$("#view-fluxo").hidden && dm().fluxo) desenhar($("#fx-canvas"), dm().fluxo, dm(), palavras(), false); });
  }

  // Prévia: clique em um bloco abre o editor nele
  $("#fx-canvas").addEventListener("click", function (e) { var no = e.target.closest(".fe-no"); abrir(no ? no.dataset.id : ""); });
  $("#fx-abrir").addEventListener("click", function () { abrir(""); });
  $("#fx-toggle").addEventListener("change", VC.alternarDm);
  $$("#fx-periodo button").forEach(function (b) { b.addEventListener("click", function () { VC.state.dias = +b.dataset.dias; VC.carregar(); }); });
  ligarEditor();

  window.VCFluxo = { render: render, abrir: abrir };
  render();
})();
