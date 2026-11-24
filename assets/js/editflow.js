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
    var setPasso = function (n, t) { passo.innerHTML = "<b>Passo " + n + " de 3</b> · " + t; };
    var roteiro = function (r) {
      caixa.innerHTML = ""; digita.textContent = ""; campo.className = "ef-ia__campo"; digita.classList.remove("ef-cursor");
      setPasso(1, "Mande o arquivo");
      return esperar(700, r)
        .then(function () { msg(svgArq + "<span><b>editflow-ai.zip</b><small>Arquivo zip</small></span>", "ef-ia__m--eu ef-ia__m--arq"); return esperar(500, r); })
        .then(function () { return ia_diz("Recebi. Vou instalar o EditFlow AI aqui.", r); })
        .then(function () { return ia_diz("Conferindo se ficou tudo no lugar.", r); })
        .then(function () { return ia_diz("Instalado ✅ Pode mandar a sua gravação.", r); })
        .then(function () {
          setPasso(2, "Mande a gravação");
          campo.classList.add("ef-com-thumb"); digita.classList.add("ef-cursor");
          var frase = "Corta as pausas e fica com a última tomada", i = 0;
          var letra = function () {
            if (i >= frase.length) return esperar(400, r);
            digita.textContent = frase.slice(0, ++i);
            if (i === 1) campo.classList.add("ef-pronto-enviar");
            return esperar(38, r).then(letra);
          };
          return letra();
        })
        .then(function () { enviar.classList.add("ef-clica"); return esperar(160, r); })
        .then(function () {
          enviar.classList.remove("ef-clica");
          msg("<i></i><span>" + digita.textContent + "</span>", "ef-ia__m--eu ef-ia__m--vid");
          digita.textContent = ""; digita.classList.remove("ef-cursor"); campo.className = "ef-ia__campo";
          return ia_diz("Cortando as pausas, os “éé” e a tomada repetida…", r);
        })
        .then(function () { return ia_diz("✅ gravacao-pronta.mp4 · 21s → 13s, com legenda", r, "ef-ia__m--ok"); })
        .then(function () { setPasso(3, "Aprove e poste"); return esperar(4200, r); });
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
      msg("Recebi. Vou instalar o EditFlow AI aqui.");
      msg("Instalado ✅ Pode mandar a sua gravação.");
      setPasso(2, "Mande a gravação");
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
