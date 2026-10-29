/* ==========================================================================
   Acelerador MPR — gera carrosséis prontos em imagem (1080×1350)
   A IA escreve o texto em /api/carrossel; os slides são desenhados no canvas.
   /acelerador?demo=1 usa um texto de exemplo (sem IA) só para conferir o visual.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var W = 1080, H = 1350, PAD = 96;
  var FONT = '"Manrope", system-ui, sans-serif';
  var STORE = "vg_acelerador";

  var ESTILOS = {
    escuro: { nome: "Escuro", bg: ["#0d0d0d", "#050505"], titulo: "#ffffff", texto: "#bdbdbd", destaque: "#39e58c", tinta: "#03150b", linha: "rgba(255,255,255,.12)" },
    claro: { nome: "Claro", bg: ["#f7f4ee", "#ece6db"], titulo: "#141414", texto: "#4a4a4a", destaque: "#e4572e", tinta: "#ffffff", linha: "rgba(0,0,0,.1)" },
    amarelo: { nome: "Impacto", bg: ["#ffd84d", "#ffc81f"], titulo: "#111111", texto: "#2b2b2b", destaque: "#111111", tinta: "#ffd84d", linha: "rgba(0,0,0,.14)" }
  };

  var state = { estilo: "escuro", slides: [], perfil: "", palavra: "", editando: -1 };
  var demo = /[?&]demo=1/.test(location.search);

  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } },
    set: function (v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {} }
  };

  /* ───────────── Texto no canvas ───────────── */

  function wrap(ctx, text, maxW) {
    var out = [];
    String(text).split("\n").forEach(function (par) {
      var words = par.split(/\s+/).filter(Boolean), line = "";
      words.forEach(function (w) {
        var test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
        else line = test;
      });
      out.push(line);
    });
    return out;
  }

  // Diminui a fonte até o texto caber na caixa
  function fit(ctx, text, weight, size, min, maxW, maxH, lh) {
    for (; size >= min; size -= 2) {
      ctx.font = weight + " " + size + "px " + FONT;
      var lines = wrap(ctx, text, maxW);
      if (lines.length * size * lh <= maxH) return { size: size, lines: lines, lh: lh };
    }
    ctx.font = weight + " " + min + "px " + FONT;
    return { size: min, lines: wrap(ctx, text, maxW), lh: lh };
  }

  function altura(block) { return block.lines.length * block.size * block.lh; }

  function draw(ctx, block, x, y, weight, color) {
    ctx.font = weight + " " + block.size + "px " + FONT;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    block.lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * block.size * block.lh); });
    return y + block.lines.length * block.size * block.lh;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ───────────── Slide ───────────── */

  function render(canvas, slide, i, total, est) {
    var ctx = canvas.getContext("2d"), maxW = W - PAD * 2;
    canvas.width = W; canvas.height = H;

    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, est.bg[0]); g.addColorStop(1, est.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Topo: @ e numeração
    ctx.font = "700 34px " + FONT; ctx.textBaseline = "top";
    ctx.fillStyle = est.texto;
    if (state.perfil) ctx.fillText(state.perfil, PAD, 72);
    var num = (i + 1) + "/" + total;
    ctx.fillText(num, W - PAD - ctx.measureText(num).width, 72);

    var capa = i === 0, final = i === total - 1 && total > 1;

    if (capa) {
      ctx.fillStyle = est.destaque; ctx.fillRect(PAD, 360, 120, 12);
      var t = fit(ctx, slide.titulo, 800, 112, 64, maxW, 520, 1.08);
      var y = draw(ctx, t, PAD, 420, 800, est.titulo);
      var s = fit(ctx, slide.texto, 600, 46, 32, maxW, 220, 1.3);
      draw(ctx, s, PAD, y + 40, 600, est.texto);
      ctx.font = "800 38px " + FONT; ctx.fillStyle = est.destaque;
      ctx.fillText("Arrasta pro lado  →", PAD, H - 150);
    } else if (final) {
      var tf = fit(ctx, slide.titulo, 800, 104, 56, maxW, 380, 1.1);
      var sf = fit(ctx, slide.texto, 600, 52, 32, maxW, 380, 1.35);
      var alt = altura(tf) + 40 + altura(sf) + (state.palavra ? 172 : 0);
      var yf = draw(ctx, tf, PAD, Math.max(180, (H - alt) / 2 - 30), 800, est.titulo);
      yf = draw(ctx, sf, PAD, yf + 40, 600, est.texto);
      if (state.palavra) {
        var label = "Comente: " + state.palavra.toUpperCase();
        ctx.font = "800 48px " + FONT;
        var bw = Math.min(maxW, ctx.measureText(label).width + 96);
        roundRect(ctx, PAD, yf + 60, bw, 112, 56); ctx.fillStyle = est.destaque; ctx.fill();
        ctx.fillStyle = est.tinta; ctx.textBaseline = "middle"; ctx.fillText(label, PAD + 48, yf + 117);
      }
    } else {
      // Número, título e texto centralizados na altura do slide
      var tm = fit(ctx, slide.titulo, 800, 88, 52, maxW, 330, 1.12);
      var sm = fit(ctx, slide.texto, 600, 54, 34, maxW, 520, 1.4);
      var ym = Math.max(170, (H - (190 + altura(tm) + 40 + altura(sm))) / 2 - 20);
      ctx.font = "800 150px " + FONT; ctx.fillStyle = est.destaque; ctx.textBaseline = "top";
      ctx.fillText(String(i).padStart(2, "0"), PAD - 6, ym);
      ym = draw(ctx, tm, PAD, ym + 190, 800, est.titulo);
      draw(ctx, sm, PAD, ym + 40, 600, est.texto);
    }

    // Barra de progresso no rodapé
    ctx.fillStyle = est.linha; ctx.fillRect(PAD, H - 72, maxW, 8);
    ctx.fillStyle = est.destaque; ctx.fillRect(PAD, H - 72, maxW * (i + 1) / total, 8);
  }

  /* ───────────── Estilos (mini prévia) ───────────── */

  function renderEstilos() {
    var box = $("#estilos");
    box.innerHTML = "";
    Object.keys(ESTILOS).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ac-style";
      b.setAttribute("aria-pressed", String(k === state.estilo));
      var c = document.createElement("canvas");
      render(c, { titulo: "Seu gancho aqui", texto: "Subtítulo do carrossel" }, 0, 7, ESTILOS[k]);
      b.appendChild(c);
      b.appendChild(document.createTextNode(ESTILOS[k].nome));
      b.addEventListener("click", function () {
        state.estilo = k; renderEstilos();
        if (state.slides.length) renderSlides();
      });
      box.appendChild(b);
    });
  }

  function renderSlides() {
    var box = $("#slides-lista"), est = ESTILOS[state.estilo];
    box.innerHTML = "";
    state.slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ac-slide";
      b.setAttribute("aria-label", "Editar slide " + (i + 1));
      var c = document.createElement("canvas");
      render(c, s, i, state.slides.length, est);
      b.appendChild(c);
      b.addEventListener("click", function () { abrirEditor(i); });
      box.appendChild(b);
    });
  }

  /* ───────────── Geração ───────────── */

  function exemplo(d) {
    var nicho = d.nicho || "renda extra";
    var base = [
      { titulo: "5 erros que travam quem está começando em " + nicho, texto: "O terceiro quase todo mundo comete sem perceber." },
      { titulo: "Querer fazer tudo ao mesmo tempo", texto: "Escolha um único caminho e vá até o fim. Foco vende mais que volume." },
      { titulo: "Postar sem um objetivo", texto: "Todo post precisa levar a pessoa a um próximo passo: seguir, comentar ou clicar no link." },
      { titulo: "Esperar estar pronto", texto: "Ninguém começa pronto. Quem posta todos os dias aprende mais rápido do que quem planeja." },
      { titulo: "Ignorar o que já funciona", texto: "Olhe os vídeos que mais performaram no seu nicho e modele o formato, não o conteúdo." },
      { titulo: "Desistir antes dos 30 dias", texto: "Os primeiros resultados quase sempre aparecem depois de um mês de constância." },
      { titulo: "Quer o passo a passo completo?", texto: d.palavra ? "Comenta a palavra abaixo que eu te mando." : "Salva esse post e me segue para ver o próximo." }
    ];
    var total = +d.slides || 7, meio = base.slice(1, -1).slice(0, total - 2);
    return { slides: [base[0]].concat(meio, [base[base.length - 1]]), legenda: "Qual desses erros você já cometeu? 👇\n\n" + (d.palavra ? "Comenta " + d.palavra.toUpperCase() + " que eu te mando o passo a passo." : "Salva pra não esquecer.") + "\n\n#rendaextra #produtodigital #marketingdigital #empreendedorismo #negociosonline", demo: true };
  }

  function gerar(d) {
    if (demo) return Promise.resolve(exemplo(d));
    return fetch("/api/carrossel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (r) {
        if (r.status === 404 || r.status === 405) return exemplo(d); // servidor local sem a função
        return r.json().then(function (j) { if (!r.ok) throw j; return j; });
      });
  }

  var ERROS = {
    nicho: "Digite o nicho do seu perfil.",
    codigo: "Seu acesso não foi liberado. Fale com o suporte.",
    limite: "Muita gente gerando agora. Tente de novo em 1 minuto.",
    recusado: "Não consegui gerar esse tema. Tente outro tema."
  };

  function status(msg, erro) {
    var el = $("#status");
    el.textContent = msg || "";
    el.classList.toggle("is-error", !!erro);
  }

  function onSubmit(e) {
    e.preventDefault();
    var f = e.target, nicho = f.nicho.value.trim();
    $("#nicho-erro").textContent = nicho ? "" : ERROS.nicho;
    f.nicho.setAttribute("aria-invalid", String(!nicho));
    if (!nicho) { f.nicho.focus(); return; }

    var perfil = f.perfil.value.trim().replace(/^@?/, "@");
    state.perfil = perfil === "@" ? "" : perfil;
    state.palavra = f.palavra.value.trim();
    store.set({ perfil: state.perfil, estilo: state.estilo });

    var btn = $("#gerar");
    btn.setAttribute("aria-busy", "true");
    status("Criando seu carrossel… leva uns 15 segundos.");

    var dados = { nicho: nicho, tema: f.tema.value.trim(), objetivo: f.objetivo.value, slides: f.slides.value, palavra: state.palavra, codigo: store.get().codigo };
    document.fonts.load("800 80px Manrope").then(function () { return gerar(dados); })
      .then(function (r) {
        state.slides = r.slides;
        $("#legenda").value = r.legenda || "";
        renderSlides();
        $("#resultado").hidden = false;
        status(r.demo ? "Modo demonstração: texto de exemplo, sem IA." : "");
        $("#resultado").scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (err) { status((err && ERROS[err.erro]) || "Não deu certo agora. Tente de novo.", true); })
      .then(function () { btn.removeAttribute("aria-busy"); });
  }

  /* ───────────── Editor ───────────── */

  function abrirEditor(i) {
    var s = state.slides[i];
    state.editando = i;
    $("#editor-titulo").textContent = "Editar slide " + (i + 1);
    $("#ed-titulo").value = s.titulo;
    $("#ed-texto").value = s.texto;
    $("#editor").showModal();
  }

  function fecharEditor() {
    var dlg = $("#editor");
    if (dlg.returnValue === "salvar" && state.editando > -1) {
      state.slides[state.editando] = { titulo: $("#ed-titulo").value.trim(), texto: $("#ed-texto").value.trim() };
      renderSlides();
    }
    state.editando = -1;
  }

  /* ───────────── Baixar / compartilhar ───────────── */

  function arquivos() {
    var canvases = Array.prototype.slice.call(document.querySelectorAll("#slides-lista canvas"));
    return Promise.all(canvases.map(function (c, i) {
      return new Promise(function (ok) {
        c.toBlob(function (b) { ok(new File([b], "carrossel-" + (i + 1) + ".png", { type: "image/png" })); }, "image/png");
      });
    }));
  }

  function baixar() {
    arquivos().then(function (fs) {
      fs.forEach(function (f, i) {
        setTimeout(function () {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(f); a.download = f.name;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        }, i * 350);
      });
    });
  }

  function compartilhar() {
    arquivos().then(function (fs) {
      return navigator.share({ files: fs, title: "Carrossel" });
    }).catch(function () {});
  }

  function copiar() {
    var t = $("#legenda"), b = $("#copiar");
    var done = function () { b.textContent = "Copiada ✓"; setTimeout(function () { b.textContent = "Copiar legenda"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(done, function () { t.select(); });
    else { t.select(); document.execCommand("copy"); done(); }
  }

  /* ───────────── Início ───────────── */

  function init() {
    var salvo = store.get();
    if (ESTILOS[salvo.estilo]) state.estilo = salvo.estilo;
    if (salvo.perfil) $("#perfil").value = salvo.perfil;

    // ?codigo=XXXX no link de acesso libera a ferramenta neste aparelho
    var m = location.search.match(/[?&]codigo=([^&]+)/);
    if (m) { salvo.codigo = decodeURIComponent(m[1]); store.set(salvo); }

    document.fonts.load("800 80px Manrope").then(renderEstilos, renderEstilos);
    $("#form").addEventListener("submit", onSubmit);
    $("#refazer").addEventListener("click", function () { $("#form").scrollIntoView({ behavior: "smooth" }); $("#tema").focus({ preventScroll: true }); });
    $("#editor").addEventListener("close", fecharEditor);
    $("#baixar").addEventListener("click", baixar);
    $("#copiar").addEventListener("click", copiar);

    var probe = new File([""], "x.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [probe] })) {
      $("#compartilhar").hidden = false;
      $("#compartilhar").addEventListener("click", compartilhar);
    }
  }

  init();
})();
