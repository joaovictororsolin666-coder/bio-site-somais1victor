/* ==========================================================================
   Quiz do Método Primeira Renda
   Telas renderizadas a partir de assets/js/quiz-data.js. Sem dependências.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.QUIZ_DATA;
  var CFG = window.SITE_CONFIG || {};
  var VG = window.VG || { track: function () {}, withUtms: function (u) { return u; }, toast: function () {} };
  if (!D) return;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var app = $("#app");
  var bar = $(".qz-progress__bar");
  var progress = $(".qz-progress");
  var backBtn = $("[data-back]");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var Q = D.questions;
  var FLOW = ["intro"].concat(Q.map(function (_, i) { return "q" + i; }), ["about", "loading", "result", "gift", "bonus", "offer"]);
  var TRANSIENT = { loading: true };
  var NO_BACK = { intro: true, loading: true };

  /* ───────────── Estado (sobrevive a recarregar a página) ───────────── */

  var STORE = "vg_quiz";
  var state = { step: 0, answers: {} };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE));
    if (saved && typeof saved.step === "number" && saved.step < FLOW.length) state = saved;
  } catch (e) { /* sem storage: começa do zero */ }
  if (TRANSIENT[FLOW[state.step]]) state.step = FLOW.indexOf("result");

  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ───────────── Jornada do visitante (alimenta o painel /painel) ─────────────
     Anônima: um código aleatório, etapas alcançadas, respostas, botão de checkout e origem.
     Enviada em pacote (sendBeacon) ao sair da página, ao chegar na oferta e ao clicar no checkout. */

  var Journey = (function () {
    var endpoint = (CFG.form || {}).endpoint;
    var enabled = !!endpoint && !!navigator.sendBeacon && (CFG.painel || {}).ativo !== false;
    var dirty = true;

    function rid() {
      var c = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
      for (var i = 0; i < 10; i++) s += c.charAt(Math.floor(Math.random() * c.length));
      return s;
    }
    function device() {
      var ua = navigator.userAgent;
      if (/iPad|Tablet/i.test(ua)) return "Tablet";
      return /Mobi|Android|iPhone|iPod/i.test(ua) ? "Celular" : "Computador";
    }

    if (!state.j) state.j = { id: rid(), t0: Date.now(), steps: {}, max: 0, answers: {}, checkout: "" };
    var j = state.j;

    function mark() { dirty = true; save(); }

    return {
      step: function (i) {
        if (j.steps[i] == null) { j.steps[i] = Math.round((Date.now() - j.t0) / 1000); dirty = true; }
        if (i > j.max) { j.max = i; dirty = true; }
        save();
      },
      answer: function (key, label) { j.answers[key] = label; mark(); },
      checkout: function (term) { j.checkout = term || "sim"; mark(); this.flush(); },
      flush: function () {
        if (!enabled || !dirty) return;
        var a = VG.attribution ? VG.attribution() : {};
        var p = new URLSearchParams();
        p.append("action", "quiz");
        p.append("id", j.id);
        p.append("inicio", new Date(j.t0).toISOString());
        p.append("dispositivo", device());
        p.append("etapa_max", j.max);
        p.append("etapa_nome", FLOW[j.max]);
        p.append("concluiu", j.max >= FLOW.indexOf("offer") ? "sim" : "nao");
        p.append("checkout", j.checkout);
        p.append("duracao_s", Math.min(1800, Math.round((Date.now() - j.t0) / 1000)));
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"].forEach(function (k) {
          p.append(k, a[k] || "");
        });
        p.append("respostas", JSON.stringify(j.answers));
        p.append("etapas", JSON.stringify(j.steps));
        if (navigator.sendBeacon(endpoint, p)) dirty = false;
      }
    };
  })();

  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") Journey.flush(); });
  window.addEventListener("pagehide", function () { Journey.flush(); });

  /* ───────────── Helpers de HTML ───────────── */

  function img(o, cls, eager) {
    if (!o) return "";
    return '<img class="' + (cls || "") + '" src="' + o.src + '" width="' + o.w + '" height="' + o.h + '" alt="' + (o.alt || "") + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }

  var ARROW = '<svg class="btn__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function cta(label, attrs, extraCls) {
    return '<button class="btn btn--primary btn--pulse qz-cta ' + (extraCls || "") + '" type="button" ' + (attrs || "data-next") + '>' +
      '<span class="btn__label">' + label + "</span>" + ARROW + "</button>";
  }

  // Link do checkout: UTMs do visitante + UTMs fixas do funil (só onde faltar) + botão clicado em utm_term
  function checkoutUrl(term) {
    var links = CFG.links || {};
    if (!links.checkoutMPR) return "#";
    try {
      var u = new URL(VG.withUtms(links.checkoutMPR));
      var fixed = links.checkoutUtms || {};
      Object.keys(fixed).forEach(function (k) {
        if (!u.searchParams.has(k)) u.searchParams.set(k, fixed[k]);
      });
      if (term && !u.searchParams.has("utm_term")) u.searchParams.set("utm_term", term);
      return u.toString();
    } catch (e) {
      return links.checkoutMPR;
    }
  }

  function checkoutCta(label, term, extraCls) {
    return '<a class="btn btn--primary btn--pulse qz-cta ' + (extraCls || "") + '" href="' + checkoutUrl(term) + '" data-checkout="' + term + '">' +
      '<span class="btn__label">' + label + "</span>" + ARROW + "</a>";
  }

  function answerOf(key) {
    var q = Q.filter(function (x) { return x.key === key; })[0];
    var i = state.answers[key];
    if (!q || i == null) return null;
    var o = q.options[i];
    return o.short || o.label;
  }

  /* ───────────── Telas ───────────── */

  var screens = {
    intro: function () {
      var s = D.intro;
      return '<section class="qz-screen qz-center">' +
        '<h1 class="qz-title qz-title--lg">' + s.title + "</h1>" +
        '<p class="qz-tagline"><span>' + s.tag + "</span></p>" +
        '<div class="qz-media">' + img(s.image, "", true) + "</div>" +
        '<p class="qz-text">' + s.text + "</p>" +
        cta(s.cta, "data-next data-start") +
        '<p class="qz-note">⏱ ' + s.note + "</p>" +
        "</section>";
    },

    question: function (i) {
      var q = Q[i];
      var chosen = state.answers[q.key];
      return '<section class="qz-screen">' +
        '<p class="qz-step">Pergunta ' + (i + 1) + " de " + Q.length + "</p>" +
        '<h1 class="qz-title">' + q.title + "</h1>" +
        (q.subtitle ? '<p class="qz-sub">' + q.subtitle + "</p>" : "") +
        (q.image ? '<div class="qz-media qz-media--sm">' + img(q.image, "", true) + "</div>" : "") +
        '<div class="qz-options">' +
        q.options.map(function (o, j) {
          return '<button class="qz-option' + (chosen === j ? " is-selected" : "") + '" type="button" data-answer="' + j + '" aria-pressed="' + (chosen === j) + '">' +
            (o.emoji ? '<span class="qz-option__emoji" aria-hidden="true">' + o.emoji + "</span>" : "") +
            '<span class="qz-option__label">' + o.label + "</span>" +
            '<span class="qz-option__check" aria-hidden="true"></span></button>';
        }).join("") +
        "</div></section>";
    },

    about: function () {
      var s = D.about;
      return '<section class="qz-screen qz-center">' +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<div class="qz-media qz-media--portrait">' + img(s.image, "", true) + "</div>" +
        s.paragraphs.map(function (p) { return '<p class="qz-text">' + p + "</p>"; }).join("") +
        cta(s.cta) +
        "</section>";
    },

    loading: function () {
      var s = D.loading;
      return '<section class="qz-screen qz-center qz-loading">' +
        '<div class="qz-ring" aria-hidden="true"></div>' +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-sub">' + s.text + "</p>" +
        '<div class="qz-checks">' +
        s.items.map(function (t) {
          return '<div class="qz-check"><div class="qz-check__row"><span>' + t + '</span><span class="qz-check__pct">0%</span></div>' +
            '<div class="qz-check__bar"><i></i></div></div>';
        }).join("") +
        "</div>" +
        '<p class="qz-done">' + s.done + "</p>" +
        "</section>";
    },

    result: function () {
      var s = D.result;
      var chips = [["Perfil", answerOf("experiencia")], ["Tempo", answerOf("tempo")], ["Meta", answerOf("meta")]]
        .filter(function (c) { return c[1]; });
      return '<section class="qz-screen qz-center">' +
        '<p class="qz-badge"><span aria-hidden="true">✔</span> ' + s.badge + "</p>" +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        (chips.length ? '<div class="qz-chips">' + chips.map(function (c) {
          return '<div class="qz-chip"><span>' + c[0] + "</span><strong>" + c[1] + "</strong></div>";
        }).join("") + "</div>" : "") +
        '<div class="qz-alert"><p class="qz-alert__title">⚠️ ' + s.alertTitle + "</p><p>" + s.alertText + "</p></div>" +
        '<div class="qz-media">' + img(s.image, "", true) + "</div>" +
        '<p class="qz-text">' + s.text + "</p>" +
        '<div class="qz-case">' +
        '<h2 class="qz-h2">' + s.caseTitle + "</h2>" +
        '<p class="qz-text">' + s.caseText + "</p>" +
        '<div class="qz-audio">' +
        img(s.casePhoto, "qz-audio__avatar") +
        '<button class="qz-audio__btn" type="button" data-audio aria-label="Ouvir depoimento da Poliana">' +
        '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
        '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button>' +
        '<div class="qz-audio__meta"><span class="qz-audio__name">' + s.caseName + '</span><span class="qz-audio__track"><i></i></span></div>' +
        '<span class="qz-audio__time">' + s.audio.duration + "</span>" +
        '<audio preload="none" src="' + s.audio.src + '"></audio>' +
        "</div>" +
        '<p class="qz-audio__hint">' + s.audioHint + "</p>" +
        (s.casePrint ? '<div class="qz-media qz-media--print">' + img(s.casePrint) + "</div>" : "") +
        "</div>" +
        '<p class="qz-proof">' + s.proof + "</p>" +
        cta(s.cta) +
        "</section>";
    },

    gift: function () {
      var s = D.gift;
      return '<section class="qz-screen qz-center">' +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-sub">' + s.text + "</p>" +
        '<div class="qz-gifts">' +
        [1, 2, 3].map(function (n) {
          return '<button class="qz-gift" type="button" data-gift style="--d:' + (n * 0.25) + 's"><span>' + n + "</span>" +
            '<img src="' + s.image + '" width="200" height="200" alt="Caixa de presente ' + n + '"></button>';
        }).join("") +
        "</div>" +
        '<p class="qz-note">👆 ' + s.hint + "</p>" +
        '<div class="qz-gift-loading" hidden><p class="qz-gift-loading__title">' + s.loading + '</p>' +
        '<p class="qz-gift-loading__pct">0%</p><div class="qz-check__bar"><i></i></div></div>' +
        "</section>";
    },

    bonus: function () {
      var s = D.bonus;
      return '<section class="qz-screen qz-center">' +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-sub">' + s.text + "</p>" +
        s.items.map(function (b) {
          return '<article class="qz-bonus">' + img(b.image, "qz-bonus__img") +
            '<div class="qz-bonus__body"><span class="qz-pill">' + b.tag + "</span>" +
            '<h2 class="qz-h2">' + b.title + "</h2><p>" + b.text + "</p>" +
            '<span class="qz-included">✓ INCLUSO</span></div></article>';
        }).join("") +
        '<p class="qz-warning">' + s.warning + "</p>" +
        cta(s.cta) +
        "</section>";
    },

    offer: function () {
      var s = D.offer;
      var price = CFG.oferta || {};
      // Preço à vista em destaque (verde, grande) e o parcelado embaixo
      var vista = (price.precoVista || "").replace(/^R\$\s*/, "");
      var priceHtml = price.precoVista ?
        '<div class="qz-price">' +
        '<p class="qz-price__label">Acesso completo + todos os bônus</p>' +
        '<p class="qz-price__main"><small>R$</small>' + vista + "</p>" +
        (price.parcelas ? '<p class="qz-price__alt">ou <strong>' + price.parcelas + "</strong></p>" : "") +
        "</div>" : "";

      return '<section class="qz-screen">' +
        '<div class="qz-media qz-media--flush">' + img(s.banner, "", true) + "</div>" +
        '<p class="qz-eyebrow">' + s.eyebrow + "</p>" +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-sub">' + s.subtitle + "</p>" +

        '<div class="qz-pillars">' + s.pillars.map(function (p) {
          return '<div class="qz-pillar"><span class="qz-pillar__icon" aria-hidden="true">' + p.emoji + "</span>" +
            "<div><h2>" + p.title + "</h2><p>" + p.text + "</p></div></div>";
        }).join('<div class="qz-pillar-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v15M5 12l7 7 7-7"/></svg></div>') + "</div>" +

        '<h2 class="qz-h2 qz-center qz-gap">' + s.proofTitle + "</h2>" +
        '<div class="qz-carousel" tabindex="0" aria-label="Resultados de alunos">' + s.proofs.map(function (p, i) {
          return img({ src: p.src, w: p.w, h: p.h, alt: "Resultado de aluno " + (i + 1) });
        }).join("") + "</div>" +
        '<p class="qz-note qz-swipe">' + s.proofHint + "</p>" +

        '<div class="qz-stack" id="qz-price">' +
        '<h2 class="qz-h2 qz-center">' + s.stackTitle + "</h2>" +
        '<ul class="qz-stack__list">' + s.stack.map(function (it) {
          return "<li>" + (it.image ? '<img src="' + it.image + '" alt="" width="48" height="60" loading="lazy" decoding="async">' : '<span class="qz-stack__check" aria-hidden="true">✓</span>') +
            "<div><strong>" + it.title + "</strong>" + (it.text ? "<span>" + it.text + "</span>" : "") + "</div></li>";
        }).join("") + "</ul>" +
        priceHtml +
        checkoutCta(s.cta, "oferta", "qz-cta--main") +
        '<p class="qz-trust">' + s.trust + "</p>" +
        "</div>" +

        '<div class="qz-guarantee">' + img(s.guarantee.image, "qz-guarantee__seal") +
        '<h2 class="qz-h2">' + s.guarantee.title + "</h2>" +
        '<p class="qz-text">' + s.guarantee.text + "</p>" +
        '<ul class="qz-guarantee__list">' + s.guarantee.list.map(function (t) { return "<li>✅ " + t + "</li>"; }).join("") + "</ul>" +
        '<p class="qz-guarantee__footer">' + s.guarantee.footer + "</p>" +
        checkoutCta(s.guarantee.cta, "garantia") +
        "</div>" +

        '<h2 class="qz-h2 qz-center qz-gap">Dúvidas frequentes</h2>' +
        '<div class="qz-faq">' + s.faq.map(function (f) {
          return "<details><summary>" + f.q + "</summary><p>" + f.a + "</p></details>";
        }).join("") + "</div>" +
        "</section>";
    }
  };

  function htmlFor(name) {
    if (name.charAt(0) === "q" && name !== "q") return screens.question(+name.slice(1));
    return screens[name]();
  }

  /* ───────────── Pré-carregamento das imagens da próxima tela ───────────── */

  function preload(name) {
    if (!name) return;
    var srcs = [];
    if (name === "about") srcs = [D.about.image.src];
    else if (name === "result") srcs = [D.result.image.src, D.result.casePhoto.src].concat(D.result.casePrint ? [D.result.casePrint.src] : []);
    else if (name === "gift") srcs = [D.gift.image];
    else if (name === "bonus") srcs = D.bonus.items.map(function (b) { return b.image.src; });
    else if (name === "offer") srcs = [D.offer.banner.src];
    else if (name.charAt(0) === "q") { var q = Q[+name.slice(1)]; if (q && q.image) srcs = [q.image.src]; }
    srcs.forEach(function (s) { var i = new Image(); i.decoding = "async"; i.src = s; });
  }

  /* ───────────── Navegação ───────────── */

  var busy = false;
  var depth = 0; // etapas do quiz no histórico desta visita (para o botão voltar não sair da página)

  function render(step, animate) {
    var name = FLOW[step];
    Journey.step(step);
    var paint = function () {
      app.innerHTML = htmlFor(name);
      window.scrollTo(0, 0);
      var screen = app.firstElementChild;
      if (animate && !reduceMotion) screen.classList.add("is-in");
      bind(name, screen);
      busy = false;
    };

    var pct = Math.round(step / (FLOW.length - 1) * 100);
    bar.style.width = Math.max(pct, 4) + "%";
    progress.setAttribute("aria-valuenow", pct);
    backBtn.hidden = !!NO_BACK[name] || step === 0;

    if (animate && !reduceMotion && app.firstElementChild) {
      app.firstElementChild.classList.add("is-out");
      setTimeout(paint, 160);
    } else {
      paint();
    }
    preload(FLOW[step + 1]);
  }

  function go(step, push) {
    if (step < 0 || step >= FLOW.length) return;
    busy = true;
    state.step = step;
    save();
    if (push !== false) { history.pushState({ qz: step }, "", location.pathname + location.search); depth++; }
    render(step, true);
  }

  function next() { if (!busy) go(state.step + 1); }

  function prevStep(from) {
    var s = from - 1;
    while (s > 0 && TRANSIENT[FLOW[s]]) s--;
    return s;
  }

  backBtn.addEventListener("click", function () {
    if (busy) return;
    if (depth > 0) { history.back(); return; }
    // Página recarregada no meio do quiz: não há etapa anterior no histórico
    var prev = prevStep(state.step);
    history.replaceState({ qz: prev }, "", location.pathname + location.search);
    busy = true;
    state.step = prev;
    save();
    render(prev, true);
  });

  window.addEventListener("popstate", function (e) {
    var step = e.state && typeof e.state.qz === "number" ? e.state.qz : 0;
    if (step < state.step) depth = Math.max(0, depth - 1); else depth++;
    if (TRANSIENT[FLOW[step]]) step = prevStep(step);
    busy = true;
    state.step = step;
    save();
    render(step, true);
  });

  /* ───────────── Interações de cada tela ───────────── */

  function vibrate() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* ignore */ } }

  function bind(name, root) {
    $$("[data-next]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.hasAttribute("data-start")) VG.track("quizStart");
        next();
      });
    });

    if (name.charAt(0) === "q" && name !== "q") {
      var q = Q[+name.slice(1)];
      $$("[data-answer]", root).forEach(function (b) {
        b.addEventListener("click", function () {
          if (busy) return;
          busy = true;
          vibrate();
          $$("[data-answer]", root).forEach(function (o) { o.classList.remove("is-selected"); o.setAttribute("aria-pressed", "false"); });
          b.classList.add("is-selected");
          b.setAttribute("aria-pressed", "true");
          state.answers[q.key] = +b.getAttribute("data-answer");
          Journey.answer(q.key, q.options[state.answers[q.key]].label);
          setTimeout(function () { busy = false; next(); }, reduceMotion ? 0 : 260);
        });
      });
    }

    if (name === "loading") runLoading(root);
    if (name === "result") bindAudio(root);
    if (name === "gift") bindGift(root);
    if (name === "offer") bindOffer(root);
  }

  function countUp(el, barEl, ms, done) {
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / ms);
      var eased = 1 - Math.pow(1 - p, 2);
      var v = Math.round(eased * 100);
      el.textContent = v + "%";
      barEl.style.width = v + "%";
      if (p < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
  }

  function runLoading(root) {
    var checks = $$(".qz-check", root);
    var dur = reduceMotion ? 300 : 1100;
    var i = 0;
    (function step() {
      if (FLOW[state.step] !== "loading") return; // saiu da tela
      var c = checks[i];
      if (!c) {
        $(".qz-done", root).classList.add("is-visible");
        setTimeout(function () { if (FLOW[state.step] === "loading") go(state.step + 1, false); history.replaceState({ qz: state.step }, ""); }, reduceMotion ? 300 : 900);
        return;
      }
      c.classList.add("is-active");
      countUp($(".qz-check__pct", c), $(".qz-check__bar i", c), dur, function () { c.classList.add("is-done"); i++; step(); });
    })();
  }

  function bindAudio(root) {
    var audio = $("audio", root);
    var btn = $("[data-audio]", root);
    var fill = $(".qz-audio__track i", root);
    var time = $(".qz-audio__time", root);
    var fmt = function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); };
    btn.addEventListener("click", function () {
      if (audio.paused) { audio.play().catch(function () { VG.toast("Não foi possível tocar o áudio."); }); }
      else audio.pause();
    });
    audio.addEventListener("play", function () { btn.classList.add("is-playing"); });
    audio.addEventListener("pause", function () { btn.classList.remove("is-playing"); });
    var initial = time.textContent;
    audio.addEventListener("timeupdate", function () {
      var d = audio.duration;
      if (d && isFinite(d)) {
        fill.style.width = (audio.currentTime / d * 100) + "%";
        time.textContent = fmt(d - audio.currentTime);
      } else {
        time.textContent = fmt(audio.currentTime); // servidor sem duração: mostra o tempo decorrido
      }
    });
    audio.addEventListener("ended", function () { fill.style.width = "0%"; time.textContent = initial; });
  }

  function bindGift(root) {
    var grid = $(".qz-gifts", root);
    $$("[data-gift]", root).forEach(function (g) {
      g.addEventListener("click", function () {
        if (grid.classList.contains("has-pick")) return;
        vibrate();
        grid.classList.add("has-pick");
        g.classList.add("is-picked");
        setTimeout(function () {
          var box = $(".qz-gift-loading", root);
          box.hidden = false;
          countUp($(".qz-gift-loading__pct", box), $(".qz-check__bar i", box), reduceMotion ? 300 : 1400, function () {
            setTimeout(next, 250);
          });
        }, reduceMotion ? 0 : 550);
      });
    });
  }

  var completedTracked = false;

  function bindOffer(root) {
    if (!completedTracked) {
      completedTracked = true;
      VG.track("quizComplete", { meta_escolhida: answerOf("meta") || "" });
    }
    Journey.flush();

    $$("[data-checkout]", root).forEach(function (a) { bindCheckout(a); });
  }

  function bindCheckout(a) {
    if (!a) return;
    a.addEventListener("click", function (e) {
      if (a.getAttribute("href") === "#") {
        e.preventDefault();
        VG.toast("Link do checkout ainda não configurado.");
        return;
      }
      VG.track("checkoutClick", { meta_escolhida: answerOf("meta") || "", tempo: answerOf("tempo") || "" });
      Journey.checkout(a.getAttribute("data-checkout"));
    });
  }

  /* ───────────── Início ───────────── */

  history.replaceState({ qz: state.step }, "", location.pathname + location.search);
  render(state.step, false);
})();
