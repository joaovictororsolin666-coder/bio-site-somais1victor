/* EditFlow AI (/editflow): aparecer ao rolar, som da VSL, carrossel dos 12 estilos, chat animado e botão fixo */
(function () {
  "use strict";
  var semMov = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Aparecer ao rolar
  var itens = document.querySelectorAll(".ef-r");
  if (!("IntersectionObserver" in window) || semMov) {
    itens.forEach(function (el) { el.classList.add("ef-on"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("ef-on"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    itens.forEach(function (el) { io.observe(el); });
  }

  // 2. VSL: começa muda em loop; o toque liga o som e volta para o início
  var vsl = document.getElementById("ef-vsl"), som = document.getElementById("ef-som");
  if (vsl && som) {
    var ligar = function () {
      vsl.muted = false; vsl.loop = false; vsl.currentTime = 0;
      var p = vsl.play(); if (p && p.catch) p.catch(function () {});
      som.hidden = true;
    };
    som.addEventListener("click", ligar);
    vsl.addEventListener("click", function () { if (vsl.muted) ligar(); else if (vsl.paused) vsl.play(); else vsl.pause(); });
  }

  // 3. Carrossel infinito com os 12 estilos (vídeos curtos em loop; imagem para quem prefere menos movimento)
  var nomes = ["Neon Noturno", "Texto Impacto", "Tela de App", "Números", "Gráfico Subindo", "Cena 3D",
               "Mapa Animado", "Quadro Branco", "Recorte de Papel", "Retrô 8-bit", "Antes e Depois", "Logo em Movimento"];
  var trilho = document.getElementById("ef-trilho");
  if (trilho) {
    var html = "";
    for (var volta = 0; volta < 2; volta++) {
      nomes.forEach(function (n, i) {
        var arq = "assets/img/editflow/estilo-" + (i < 9 ? "0" : "") + (i + 1);
        var midia = semMov
          ? '<img src="' + arq + '.webp" alt="" width="300" height="534" loading="lazy">'
          : '<video src="' + arq + '.mp4" poster="' + arq + '.webp" muted loop playsinline autoplay preload="none" aria-hidden="true"></video>';
        html += '<figure class="ef-estilo"' + (volta ? ' aria-hidden="true"' : "") + ">" + midia + "<figcaption>" + n + "</figcaption></figure>";
      });
    }
    trilho.innerHTML = html;
    // só toca os vídeos quando o carrossel está na tela (economiza bateria e dados)
    if ("IntersectionObserver" in window) {
      var vids = trilho.querySelectorAll("video");
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          vids.forEach(function (v) {
            if (e.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
          });
        });
      }).observe(trilho);
    }
  }

  // 4. Chat: as mensagens aparecem uma a uma quando a seção entra na tela
  var chat = document.getElementById("ef-chat");
  if (chat && !semMov && "IntersectionObserver" in window) {
    chat.classList.add("ef-anima");
    var msgs = chat.querySelectorAll(".ef-msg");
    new IntersectionObserver(function (es, obs) {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      msgs.forEach(function (m, i) { setTimeout(function () { m.classList.add("ef-vis"); }, 300 + i * 850); });
    }, { threshold: .4 }).observe(chat);
  }

  // 5. Botão fixo: aparece depois do topo e some na seção da oferta
  var fixo = document.getElementById("ef-fixo"), oferta = document.getElementById("oferta"), hero = document.querySelector(".ef-hero");
  if (fixo && oferta && hero) {
    var atualizar = function () {
      var y = window.scrollY, h = hero.offsetTop + hero.offsetHeight - 200;
      var r = oferta.getBoundingClientRect();
      var naOferta = r.top < window.innerHeight && r.bottom > 0;
      fixo.classList.toggle("ef-mostra", y > h && !naOferta);
    };
    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
  }
})();

/* Demo "Veja funcionando": (1) chat instalando o zip e mandando a gravação; (2) editor com trilhas Bruto/Pronto */
(function () {
  "use strict";
  var semMov = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var naTela = function (el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: .35 }).observe(el);
  };
  var svgArq = '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M11 9h1M11 12h1M11 15h1"/></svg>';

  // ── 1. Chat ──
  var ia = document.getElementById("ef-ia");
  if (ia) {
    var caixa = ia.querySelector(".ef-ia__msgs"), passo = ia.querySelector(".ef-ia__passo"), campo = ia.querySelector(".ef-ia__campo"),
        digita = ia.querySelector(".ef-ia__digita"), enviar = ia.querySelector(".ef-ia__enviar"), btPausa = ia.querySelector('[data-acao="pausa"]');
    var rodada = 0, pausado = false, visivel = false, rodando = false;
    var esperar = function (ms, r) {
      return new Promise(function (ok, nao) {
        var resta = ms, ult = Date.now();
        (function tique() {
          if (r !== rodada) { nao("parou"); return; }
          var agora = Date.now();
          if (!pausado && visivel) resta -= agora - ult;
          ult = agora;
          if (resta <= 0) ok(); else setTimeout(tique, 50);
        })();
      });
    };
    var msg = function (html, cls) {
      var d = document.createElement("div");
      d.className = "ef-ia__m" + (cls ? " " + cls : "");
      d.innerHTML = html;
      caixa.appendChild(d);
      while (caixa.children.length > 6) caixa.removeChild(caixa.firstChild);
      return d;
    };
    var ia_diz = function (texto, r, cls) {
      var p = msg("<i></i><i></i><i></i>", "ef-ia__pontos");
      return esperar(950, r).then(function () { p.remove(); msg(texto, cls); return esperar(650, r); });
    };
    var passosLista = document.querySelectorAll("#ef-conv-passos li");
    var setPasso = function (n, t) {
      passo.innerHTML = "<b>Passo " + n + " de 3</b> · " + t;
      passosLista.forEach(function (li) { li.classList.toggle("ef-ativo", +li.dataset.passo === n); li.classList.toggle("ef-feito", +li.dataset.passo < n); });
    };
    var icPausa = '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>', icPlay = '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>';
    var balaoVideo = function () {
      var d = msg('<video src="assets/img/editflow/chat-video.mp4" poster="assets/img/editflow/chat-video.webp" muted loop playsinline autoplay></video>' +
        '<span class="ef-ia__vt">0:00</span><button type="button" class="ef-ia__vp" aria-label="Pausar">' + icPausa + "</button>", "ef-ia__m--video");
      var v = d.querySelector("video"), bt = d.querySelector("button"), vt = d.querySelector(".ef-ia__vt");
      var q = v.play(); if (q && q.catch) q.catch(function () {});
      v.addEventListener("timeupdate", function () { var x = Math.floor(v.currentTime); vt.textContent = "0:" + (x < 10 ? "0" : "") + x; });
      bt.addEventListener("click", function () {
        if (v.paused) { v.play(); bt.innerHTML = icPausa; } else { v.pause(); bt.innerHTML = icPlay; }
      });
    };
    var roteiro = function (r) {
      caixa.innerHTML = ""; digita.textContent = ""; campo.className = "ef-ia__campo"; digita.classList.remove("ef-cursor");
      setPasso(1, "Solte o arquivo");
      return esperar(700, r)
        .then(function () { msg(svgArq + "<span><b>editflow-ai.zip</b><small>Arquivo zip</small></span>", "ef-ia__m--eu ef-ia__m--arq"); return esperar(500, r); })
        .then(function () { return ia_diz("Recebi. Vou instalar o EditFlow AI aqui.", r); })
        .then(function () { return ia_diz("Instalado ✅ Me diz qual vídeo você quer.", r); })
        .then(function () {
          setPasso(2, "Peça o vídeo");
          digita.classList.add("ef-cursor");
          var frase = "Faz um reel sobre IA que vende. Não quero aparecer.", i = 0;
          var letra = function () {
            if (i >= frase.length) return esperar(400, r);
            digita.textContent = frase.slice(0, ++i);
            if (i === 1) campo.classList.add("ef-pronto-enviar");
            return esperar(36, r).then(letra);
          };
          return letra();
        })
        .then(function () { enviar.classList.add("ef-clica"); return esperar(160, r); })
        .then(function () {
          enviar.classList.remove("ef-clica");
          msg(digita.textContent, "ef-ia__m--eu");
          digita.textContent = ""; digita.classList.remove("ef-cursor"); campo.className = "ef-ia__campo";
          return ia_diz("Fiz roteiro, animação, legenda e som. Ninguém aparece. Ficou assim 👇", r);
        })
        .then(function () { setPasso(3, "O vídeo volta pronto"); balaoVideo(); return esperar(11500, r); });
    };
    var iniciar = function () {
      var r = ++rodada; rodando = true;
      roteiro(r).then(function () { if (r === rodada) iniciar(); }, function () {});
    };
    var setPausado = function (v) {
      pausado = v;
      btPausa.setAttribute("aria-label", v ? "Continuar" : "Pausar");
      btPausa.innerHTML = v ? '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
    };
    btPausa.addEventListener("click", function () { setPausado(!pausado); });
    ia.querySelector('[data-acao="repete"]').addEventListener("click", function () { setPausado(false); visivel = true; iniciar(); });
    if (semMov) {
      msg(svgArq + "<span><b>editflow-ai.zip</b><small>Arquivo zip</small></span>", "ef-ia__m--eu ef-ia__m--arq");
      msg("Instalado ✅ Me diz qual vídeo você quer.");
      msg("Faz um reel sobre IA que vende. Não quero aparecer.", "ef-ia__m--eu");
      setPasso(3, "O vídeo volta pronto"); balaoVideo();
    } else {
      naTela(ia, function (v) { visivel = v; if (v && !rodando) iniciar(); });
    }
  }

  // ── 2. Editor Bruto / Pronto ──
  var ed = document.getElementById("ef-ed");
  if (!ed) return;
  var SEGS = [
    { d: 2.2, ok: true, leg: "Três sites de IA", chip: "3 sites" },
    { d: 1.2, tipo: "pausa", motivo: "pausa" },
    { d: 3.0, motivo: "tomada repetida" },
    { d: 0.8, tipo: "pausa", motivo: "pausa" },
    { d: 3.8, ok: true, leg: "que parecem ilegais", chip: "parecem ilegais" },
    { d: 1.4, motivo: "“éé”" },
    { d: 4.4, ok: true, leg: "o primeiro cria vídeos", chip: "cria vídeos" },
    { d: 1.2, tipo: "pausa", motivo: "pausa" },
    { d: 3.0, ok: true, leg: "e o link tá na bio", chip: "link na bio" }
  ];
  var TOT = { bruto: 0, pronto: 0 };
  SEGS.forEach(function (s) { TOT.bruto += s.d; if (s.ok) TOT.pronto += s.d; });
  var fv = ed.querySelector(".ef-ed__faixa--video"), ff = ed.querySelector(".ef-ed__faixa--fala"), fl = ed.querySelector(".ef-ed__faixa--leg");
  var semente = 7, aleat = function () { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; };
  SEGS.forEach(function (s) {
    var cls = "ef-ed__seg" + (s.ok ? "" : " ef-ed__seg--fora"), g = "flex-grow:" + s.d + ";flex-basis:0";
    fv.insertAdjacentHTML("beforeend", '<div class="' + cls + '" style="' + g + '"></div>');
    var fala = "";
    if (s.tipo === "pausa") fala = '<span class="ef-ed__pausa"></span>';
    else for (var b = 0, n = Math.round(s.d * 6); b < n; b++) fala += '<span class="ef-ed__barra" style="height:' + Math.round(18 + aleat() * 72) + '%"></span>';
    ff.insertAdjacentHTML("beforeend", '<div class="' + cls + '" style="' + g + '">' + fala + "</div>");
    fl.insertAdjacentHTML("beforeend", '<div class="' + cls + '" style="' + g + '">' + (s.ok ? '<span class="ef-ed__chip">' + s.chip + "</span>" : "") + "</div>");
  });
  var segsV = fv.children, cabeca = ed.querySelector(".ef-ed__cabeca"), motivo = ed.querySelector(".ef-ed__motivo"), total = ed.querySelector(".ef-ed__total"),
      tempo = ed.querySelector(".ef-ed__tempo"), tit = ed.querySelector(".ef-ed__tit"), rot = ed.querySelector(".ef-ed__rot"), leg = ed.querySelector(".ef-ed__leg"),
      btPlay = ed.querySelector(".ef-ed__play"), botoes = ed.querySelectorAll(".ef-ed__modo button");
  var modo = "bruto", t = 0, tocando = !semMov, visEd = false, ult = 0;
  var mmss = function (x) { x = Math.floor(x); return "0:" + (x < 10 ? "0" : "") + x; };
  var setModo = function (m) {
    modo = m; t = 0;
    ed.classList.toggle("ef-modo-pronto", m === "pronto");
    botoes.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.modo === m)); });
    tit.textContent = m === "pronto" ? "Assim o EditFlow entrega." : "Assim a gravação chegou.";
    rot.textContent = m === "pronto" ? "Pronta para postar" : "Gravação bruta";
    total.textContent = mmss(Math.round(TOT[m]));
  };
  var setTocando = function (v) {
    tocando = v;
    btPlay.setAttribute("aria-label", v ? "Pausar" : "Tocar");
    btPlay.innerHTML = v ? '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>';
  };
  var desenhar = function () {
    // acha o trecho atual (no modo pronto, só os trechos que ficaram)
    var acc = 0, idx = 0, frac = 0;
    for (var i = 0; i < SEGS.length; i++) {
      if (modo === "pronto" && !SEGS[i].ok) continue;
      if (t < acc + SEGS[i].d || i === SEGS.length - 1) { idx = i; frac = Math.min(1, (t - acc) / SEGS[i].d); break; }
      acc += SEGS[i].d;
    }
    var seg = segsV[idx];
    cabeca.style.transform = "translateX(" + (fv.offsetLeft + seg.offsetLeft + frac * seg.offsetWidth) + "px)";
    tempo.textContent = mmss(t);
    var s = SEGS[idx];
    if (modo === "bruto") { motivo.textContent = s.ok ? "" : s.motivo; motivo.style.color = ""; }
    else { motivo.textContent = "✂ 4 cortes automáticos"; motivo.style.color = "#c4b5fd"; }
    if (s.ok) {
      var pal = s.leg.split(" "), k = Math.min(pal.length - 1, Math.floor(frac * pal.length));
      leg.innerHTML = pal.map(function (p, j) { return j === k ? "<b>" + p + "</b>" : p; }).join(" ");
      leg.classList.add("ef-tem");
    } else leg.classList.remove("ef-tem");
  };
  var quadro = function (agora) {
    var dt = ult ? Math.min(.1, (agora - ult) / 1000) : 0; ult = agora;
    if (tocando && visEd) {
      t += dt;
      if (t >= TOT[modo]) setModo(modo === "bruto" ? "pronto" : "bruto");
    }
    desenhar();
    requestAnimationFrame(quadro);
  };
  btPlay.addEventListener("click", function () { setTocando(!tocando); });
  ed.querySelector(".ef-ed__repete").addEventListener("click", function () { setModo(modo); setTocando(true); });
  botoes.forEach(function (b) { b.addEventListener("click", function () { setModo(b.dataset.modo); setTocando(true); }); });
  setModo("bruto"); setTocando(!semMov);
  naTela(ed, function (v) { visEd = v; });
  requestAnimationFrame(quadro);
})();

/* Linha do tempo real da VSL: quadros, onda da fala e legenda do próprio vídeo, sincronizadas com o player.
   Arrastar a linha do tempo navega no vídeo. */
(function () {
  "use strict";
  var tl = document.getElementById("ef-tl"), vid = document.getElementById("ef-vsl");
  if (!tl || !vid || !window.fetch) return;
  var janela = tl.querySelector(".ef-tl__janela"), rolo = tl.querySelector(".ef-tl__rolo"), fv = tl.querySelector(".ef-tl__faixa--video"),
      cv = tl.querySelector(".ef-tl__faixa--fala"), fl = tl.querySelector(".ef-tl__faixa--leg"), cena = tl.querySelector(".ef-tl__cena"),
      tempo = tl.querySelector(".ef-tl__tempo"), play = tl.querySelector(".ef-tl__play");
  var mmss = function (x) { x = Math.max(0, Math.floor(x)); return Math.floor(x / 60) + ":" + (x % 60 < 10 ? "0" : "") + (x % 60); };
  fetch("assets/img/editflow/vsl-trilhas.json?v=1").then(function (r) { return r.json(); }).then(function (D) {
    var PX = parseFloat(getComputedStyle(tl).getPropertyValue("--px")) || 62, L = D.dur * PX;
    rolo.style.width = L + "px";
    // vídeo: um quadro por segundo + marca de corte em cada cena
    fv.style.width = L + "px";
    fv.style.backgroundImage = "url(assets/img/editflow/vsl-quadros.webp?v=1)";
    fv.style.backgroundSize = (D.n * PX) + "px auto";
    D.cenas.forEach(function (c) { if (c > 0) fv.insertAdjacentHTML("beforeend", '<span class="ef-tl__corte" style="left:' + (c * PX) + 'px"></span>'); });
    // fala: onda real da narração
    var dpr = Math.min(2, window.devicePixelRatio || 1), H = 40;
    cv.width = Math.round(L * dpr); cv.height = H * dpr; cv.style.width = L + "px";
    var g = cv.getContext("2d"); g.scale(dpr, dpr); g.fillStyle = "#d4d4d8";
    var passo = PX / 20;
    for (var i = 0; i < D.onda.length; i++) {
      var h = Math.max(2, (+D.onda[i] / 9) * (H - 6));
      g.fillRect(i * passo, (H - h) / 2, Math.max(1, passo - 1.2), h);
    }
    // legenda: blocos de até 3 palavras, como aparecem no vídeo
    var chips = [], grupo = [];
    var fecha = function () { if (grupo.length) { chips.push({ t: grupo.map(function (p) { return p[0]; }).join(" "), s: grupo[0][1], e: grupo[grupo.length - 1][2] }); grupo = []; } };
    D.palavras.forEach(function (p, k) {
      if (grupo.length && (p[1] - grupo[grupo.length - 1][2] > 0.35 || grupo.length === 3)) fecha();
      grupo.push(p);
      if (/[.!?,]$/.test(p[0])) fecha();
    });
    fecha();
    fl.style.width = L + "px";
    chips.forEach(function (c) {
      var el = document.createElement("span");
      el.className = "ef-tl__chip"; el.textContent = c.t.replace(/[.,]$/, "");
      el.style.left = (c.s * PX + 1) + "px"; el.style.width = Math.max(14, (c.e - c.s) * PX - 3) + "px";
      fl.appendChild(el); c.el = el;
    });
    var atual = null, arrasto = null;
    var desenhar = function (t) {
      rolo.style.transform = "translateX(" + (janela.clientWidth / 2 - t * PX) + "px)";
      tempo.textContent = mmss(t) + " / " + mmss(D.dur);
      var n = 1; for (var k = 0; k < D.cenas.length; k++) if (t >= D.cenas[k]) n = k + 1;
      cena.textContent = "Cena " + n + " de " + D.cenas.length;
      var c = null; for (var j = 0; j < chips.length; j++) if (t >= chips[j].s && t <= chips[j].e + 0.15) { c = chips[j]; break; }
      if (c !== atual) { if (atual) atual.el.classList.remove("ef-agora"); if (c) c.el.classList.add("ef-agora"); atual = c; }
    };
    var setIcone = function () {
      var p = vid.paused;
      play.setAttribute("aria-label", p ? "Tocar" : "Pausar");
      play.innerHTML = p ? '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
    };
    vid.addEventListener("play", setIcone); vid.addEventListener("pause", setIcone); setIcone();
    play.addEventListener("click", function () { if (vid.paused) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); } else vid.pause(); });
    (function quadro() { if (!arrasto) desenhar(vid.currentTime || 0); requestAnimationFrame(quadro); })();
    // arrastar para navegar
    janela.addEventListener("pointerdown", function (e) {
      arrasto = { x: e.clientX, t: vid.currentTime || 0, tocava: !vid.paused, moveu: false };
      janela.setPointerCapture(e.pointerId); janela.classList.add("ef-arrastando");
    });
    janela.addEventListener("pointermove", function (e) {
      if (!arrasto) return;
      var dx = e.clientX - arrasto.x;
      if (Math.abs(dx) > 3 && !arrasto.moveu) { arrasto.moveu = true; vid.pause(); }
      if (!arrasto.moveu) return;
      var t = Math.max(0, Math.min(D.dur - 0.05, arrasto.t - dx / PX));
      arrasto.alvo = t; desenhar(t);
      if (vid.fastSeek) vid.fastSeek(t); else vid.currentTime = t;
    });
    var solta = function (e) {
      if (!arrasto) return;
      var a = arrasto; arrasto = null; janela.classList.remove("ef-arrastando");
      if (!a.moveu) {  // toque simples: pula para o ponto tocado
        var r = janela.getBoundingClientRect(), t = Math.max(0, Math.min(D.dur - 0.05, a.t + (e.clientX - (r.left + r.width / 2)) / PX));
        vid.currentTime = t;
      } else if (a.alvo != null) vid.currentTime = a.alvo;
      if (a.tocava) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
    };
    janela.addEventListener("pointerup", solta); janela.addEventListener("pointercancel", solta);
  }).catch(function () { tl.hidden = true; });
})();

/* Carrossel dos estilos interativo: anda sozinho devagar, para quando a pessoa mexe, aceita arrastar (mouse e dedo),
   setas para passar um a um, loop infinito e o estilo do centro fica em destaque. */
(function () {
  "use strict";
  var box = document.getElementById("ef-carrossel"), trilho = document.getElementById("ef-trilho");
  if (!box || !trilho) return;
  var semMov = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = trilho.querySelectorAll(".ef-estilo");
  if (!cards.length) return;
  var VEL = 28, parado = 0, arrasto = null, ult = 0, pos = 0, emTela = false;
  var metade = function () { return trilho.scrollWidth / 2; };
  var normaliza = function () {
    var m = metade();
    if (box.scrollLeft >= m) box.scrollLeft -= m;
    else if (box.scrollLeft <= 0) box.scrollLeft += m;
    pos = box.scrollLeft;
  };
  var foco = function () {
    var c = box.scrollLeft + box.clientWidth / 2, melhor = null, dist = 1e9;
    cards.forEach(function (el) {
      var d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c);
      if (d < dist) { dist = d; melhor = el; }
    });
    cards.forEach(function (el) { el.classList.toggle("ef-foco", el === melhor); });
  };
  var pausa = function (ms) { parado = Date.now() + (ms || 2500); };
  requestAnimationFrame(function () { box.scrollLeft = pos = metade() * 0.5; foco(); });
  (function quadro(agora) {
    var dt = ult ? Math.min(.05, (agora - ult) / 1000) : 0; ult = agora;
    if (!semMov && emTela && !arrasto && Date.now() > parado) { pos += VEL * dt; box.scrollLeft = pos; normaliza(); }
    else pos = box.scrollLeft;
    foco();
    requestAnimationFrame(quadro);
  })(0);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { emTela = es[0].isIntersecting; }).observe(box);
  else emTela = true;
  box.addEventListener("scroll", function () { if (!arrasto && Date.now() < parado) normaliza(); }, { passive: true });
  box.addEventListener("touchstart", function () { pausa(3000); }, { passive: true });
  box.addEventListener("touchmove", function () { pausa(3000); }, { passive: true });
  box.addEventListener("wheel", function () { pausa(3000); }, { passive: true });
  box.addEventListener("mouseenter", function () { pausa(1e9); });
  box.addEventListener("mouseleave", function () { pausa(800); });
  // arrastar com o mouse (no celular o dedo já rola nativamente)
  box.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse") return;
    arrasto = { x: e.clientX, s: box.scrollLeft, moveu: false };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener("pointermove", function (e) {
    if (!arrasto) return;
    var dx = e.clientX - arrasto.x;
    if (Math.abs(dx) > 4) { arrasto.moveu = true; box.classList.add("ef-arrastando"); }
    box.scrollLeft = arrasto.s - dx; normaliza(); arrasto.s = box.scrollLeft + dx;
  });
  var solta = function () { if (!arrasto) return; arrasto = null; box.classList.remove("ef-arrastando"); pausa(2500); };
  box.addEventListener("pointerup", solta); box.addEventListener("pointercancel", solta);
  // setas: passa um estilo por vez
  document.querySelectorAll(".ef-seta").forEach(function (b) {
    b.addEventListener("click", function () {
      pausa(4000);
      var passo = cards[0].offsetWidth + 14;
      normaliza();
      box.scrollBy({ left: +b.dataset.dir * passo, behavior: "smooth" });
    });
  });
})();

/* "O que você recebe": clicar num item troca o ícone do chip; anda sozinho até a pessoa clicar */
(function () {
  "use strict";
  var rec = document.getElementById("ef-rec");
  if (!rec) return;
  var itens = rec.querySelectorAll(".ef-rec__item"), sel = 1, mexeu = false, vis = false;
  var escolhe = function (n) {
    sel = n; rec.setAttribute("data-sel", n);
    itens.forEach(function (b) { b.setAttribute("aria-selected", String(+b.dataset.item === n)); });
  };
  itens.forEach(function (b) { b.addEventListener("click", function () { mexeu = true; escolhe(+b.dataset.item); }); });
  escolhe(1);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: .3 }).observe(rec);
  setInterval(function () { if (!mexeu && vis) escolhe(sel % itens.length + 1); }, 3200);
})();
