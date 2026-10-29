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
  // Perguntas com "insight" ganham uma tela de virada logo depois ("ins" + índice);
  // com "proof", uma tela de prova social ("prf" + índice)
  var FLOW = ["intro"];
  Q.forEach(function (q, i) {
    FLOW.push("q" + i);
    if (q.insight) FLOW.push("ins" + i);
    if (q.proof) FLOW.push("prf" + i);
  });
  FLOW = FLOW.concat(["about", "loading", "result", "gift", "bonus", "offer"]);
  var FLOW_VERSION = 3; // painel usa para ler etapas antigas e novas
  var TRANSIENT = { loading: true };
  var NO_BACK = { intro: true, loading: true };

  /* ───────────── Estado (sobrevive a recarregar a página) ───────────── */

  var STORE = "vg_quiz" + FLOW_VERSION;
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
        p.append("etapas", JSON.stringify(Object.assign({ v: FLOW_VERSION }, j.steps)));
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

  // Carrossel de arrastar dos módulos: capa + tópicos em cada card, e um card final com os demais
  function modulesHtml(m) {
    if (!m || !m.items || !m.items.length) return "";
    var cards = m.items.map(function (it) {
      return '<article class="qz-module">' +
        '<img src="' + it.src + '" width="320" height="400" alt="Módulo ' + it.n + ": " + it.title + '" loading="lazy" decoding="async">' +
        '<span class="qz-module__n">MÓDULO ' + it.n + "</span>" +
        '<h3 class="qz-module__title">' + it.title + "</h3>" +
        '<ul class="qz-module__list">' + it.topics.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
        "</article>";
    });
    if (m.more) {
      cards.push('<article class="qz-module qz-module--more">' +
        '<h3 class="qz-module__title">' + m.more.title + "</h3>" +
        '<ul class="qz-module__list">' + m.more.items.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
        "</article>");
    }
    var dots = cards.map(function (_, i) { return '<i' + (i ? "" : ' class="is-on"') + "></i>"; }).join("");
    return '<div class="qz-modules" data-modules>' +
      '<p class="qz-modules__title">' + m.title + "</p>" +
      (m.subtitle ? '<p class="qz-modules__sub">' + m.subtitle + "</p>" : "") +
      '<div class="qz-mods">' +
      '<button type="button" class="qz-mods__nav qz-mods__nav--prev" data-dir="-1" aria-label="Módulo anterior">‹</button>' +
      '<div class="qz-mods__track">' + cards.join("") + "</div>" +
      '<button type="button" class="qz-mods__nav qz-mods__nav--next" data-dir="1" aria-label="Próximo módulo">›</button>' +
      "</div>" +
      '<div class="qz-mods__dots" aria-hidden="true">' + dots + "</div></div>";
  }

  function bindModules(root) {
    var box = $("[data-modules]", root);
    if (!box) return;
    var track = $(".qz-mods__track", box), cards = $$(".qz-module", track), dots = $$(".qz-mods__dots i", box);
    var current = function () {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0;
      cards.forEach(function (c, i) {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)) best = i;
      });
      return best;
    };
    var go = function (i) {
      var c = cards[Math.max(0, Math.min(cards.length - 1, i))];
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
    };
    $$(".qz-mods__nav", box).forEach(function (b) {
      b.addEventListener("click", function () { go(current() + Number(b.getAttribute("data-dir"))); });
    });
    // Card do meio em destaque; os vizinhos ficam girados para trás (is-left / is-right)
    var mark = function (i) {
      dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); });
      cards.forEach(function (c, k) {
        c.classList.toggle("is-on", k === i);
        c.classList.toggle("is-left", k < i);
        c.classList.toggle("is-right", k > i);
      });
      box.classList.toggle("is-start", i === 0);
      box.classList.toggle("is-end", i === cards.length - 1);
    };
    var raf;
    track.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { mark(current()); });
    }, { passive: true });
    mark(0);
  }

  // Linhas abaixo do preço conforme as respostas (objeção; aviso para menor de idade)
  function priceNotes(s) {
    var notes = [];
    var ob = optId("objecao");
    if (ob && s.objectionNotes && s.objectionNotes[ob]) notes.push('<p class="qz-price__note">' + s.objectionNotes[ob] + "</p>");
    return notes.join("");
  }

  // Menor de 18: no lugar do botão de compra, um convite para enviar o link a um responsável
  function minorBlock(m) {
    var link = location.origin + location.pathname + "?utm_source=whatsapp&utm_medium=responsavel";
    return '<div class="qz-minor"><p class="qz-minor__title">' + m.title + "</p>" +
      '<p class="qz-minor__text">' + m.text + "</p>" +
      '<a class="btn btn--ghost qz-minor__btn" href="https://wa.me/?text=' + encodeURIComponent(m.message + link) + '" target="_blank" rel="noopener">' +
      '<span class="btn__label">' + m.cta + "</span>" + ARROW + "</a></div>";
  }

  // id da opção escolhida (ex.: objecao → "medo"; idade → "30+")
  function optId(key) {
    var q = Q.filter(function (x) { return x.key === key; })[0];
    var i = state.answers[key];
    return q && i != null && q.options[i] ? q.options[i].id || null : null;
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
      var s = D.about, a = s.author || {};
      var badge = a.verified
        ? '<svg class="qz-author__badge" viewBox="0 0 24 24" role="img" aria-label="Verificado"><path d="M12 1.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-.9 2.9-3-.2L12 20.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7.9-2.9-.9-2.9 2.5-1.7.9-2.9 3 .2z"/><path class="qz-author__tick" d="M8 12.2l2.6 2.6L16 9.4"/></svg>'
        : "";
      return '<section class="qz-screen qz-about">' +
        (a.name ? '<div class="qz-author"><span class="qz-author__ring"><img src="' + a.avatar + '" width="80" height="80" alt="' + a.name + '"></span>' +
          '<div><p class="qz-author__name">' + a.name + badge + '</p><p class="qz-author__handle">' + (a.handle || "") + "</p></div></div>" : "") +
        '<h1 class="qz-title qz-about__title">' + s.title + "</h1>" +
        s.paragraphs.map(function (p) { return '<p class="qz-text">' + p + "</p>"; }).join("") +
        cta(s.cta) +
        "</section>";
    },

    // Tela de virada depois de uma pergunta de crença
    insight: function (i) {
      var q = Q[i], s = q.insight, chosen = state.answers[q.key];
      var picked = chosen != null && q.options[chosen] ? q.options[chosen].label : "";
      return '<section class="qz-screen qz-center qz-insight">' +
        (picked ? '<p class="qz-insight__you">Você respondeu: <strong>' + picked + "</strong></p>" : "") +
        '<p class="qz-insight__badge">' + s.badge + "</p>" +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-text">' + s.text + "</p>" +
        '<ul class="qz-insight__list">' + s.points.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ul>" +
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
      // 1) Diagnóstico: as respostas da pessoa, em linhas
      var rows = (s.diagRows || []).map(function (r) { return [r.label, answerOf(r.key)]; })
        .filter(function (r) { return r[1]; });
      // 2) Por que combina: experiência + objeção + idade + base
      var fit = [];
      var ex = optId("experiencia");
      if (ex && s.fit && s.fit[ex]) fit.push(s.fit[ex]);
      var ob = optId("objecao");
      if (ob && s.objection && s.objection[ob]) fit.push(s.objection[ob]);
      if (optId("idade") === "30+" && s.over30) fit.push(s.over30);
      if (s.fitBase) fit.push(s.fitBase);
      // Título: meta escolhida + final pela experiência
      var mq = Q.filter(function (x) { return x.key === "meta"; })[0], mi = state.answers.meta;
      var goal = mq && mi != null && mq.options[mi] ? mq.options[mi].goal : null;
      var title = goal
        ? s.title.replace("{meta}", goal).replace("{fim}", (s.titleEnd || {})[ex] || s.titleEnd.zero)
        : s.titleFallback;
      return '<section class="qz-screen qz-center qz-result">' +
        '<p class="qz-badge"><span aria-hidden="true">✔</span> ' + s.badge + "</p>" +
        '<h1 class="qz-title">' + title + "</h1>" +
        (s.subtitle ? '<p class="qz-sub">' + s.subtitle + "</p>" : "") +
        (rows.length ? '<div class="qz-diag"><h2 class="qz-diag__title">' + s.diagTitle + "</h2>" + rows.map(function (r) {
          return '<div class="qz-diag__row"><span>' + r[0] + "</span><strong>" + r[1] + "</strong></div>";
        }).join("") + "</div>" : "") +
        '<div class="qz-alert"><p class="qz-alert__title">⚠️ ' + s.alertTitle + "</p><p>" + s.alertText + "</p></div>" +
        (fit.length ? '<div class="qz-fit"><h2 class="qz-fit__title">' + s.fitTitle + "</h2><ul>" +
          fit.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul></div>" : "") +
        cta(s.cta) +
        "</section>";
    },

    // Prova social logo depois de uma pergunta de dificuldade
    proof: function (i) {
      var q = Q[i], s = q.proof, chosen = state.answers[q.key];
      var picked = chosen != null && q.options[chosen] ? q.options[chosen].label : "";
      return '<section class="qz-screen qz-center qz-insight qz-proofscreen">' +
        (picked ? '<p class="qz-insight__you">Você respondeu: <strong>' + picked + "</strong></p>" : "") +
        '<p class="qz-insight__badge">' + s.badge + "</p>" +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<div class="qz-case">' +
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
        '<div class="qz-bonus-grid">' +
        s.items.map(function (b) {
          return '<article class="qz-bonus">' + img(b.image, "qz-bonus__img") +
            '<div class="qz-bonus__body"><span class="qz-pill">' + b.tag + "</span>" +
            '<h2 class="qz-h2">' + b.title + "</h2><p>" + b.text + "</p>" +
            '<span class="qz-included">✓ INCLUSO</span></div></article>';
        }).join("") +
        "</div>" +
        '<p class="qz-warning">' + s.warning + "</p>" +
        cta(s.cta) +
        "</section>";
    },

    offer: function () {
      var s = D.offer;
      var price = CFG.oferta || {};
      var isMinor = optId("idade") === "menor" && !!s.minor;
      var ctaLabel = s.cta.replace("{preco}", price.precoVista || "").replace(/\s+POR\s*$/, "");
      // Preço à vista em destaque (verde, grande) e o parcelado embaixo
      var vista = (price.precoVista || "").replace(/^R\$\s*/, "");
      // Preço cheio riscado + % de desconto, quando configurado
      var toNum = function (v) { return parseFloat(String(v || "").replace(/[^\d,]/g, "").replace(",", ".")); };
      var off = price.precoDe ? Math.round((1 - toNum(price.precoVista) / toNum(price.precoDe)) * 100) : 0;
      var priceHtml = price.precoVista ?
        '<div class="qz-price">' +
        '<p class="qz-price__label">Acesso completo + todos os bônus</p>' +
        (price.precoDe ? '<p class="qz-price__from">De <s>' + price.precoDe + "</s> por apenas" +
          (off > 0 ? ' <span class="qz-price__off">' + off + "% OFF</span>" : "") + "</p>" : "") +
        '<p class="qz-price__main"><small>R$</small>' + vista + "</p>" +
        (price.parcelas ? '<p class="qz-price__alt">ou <strong>' + price.parcelas + "</strong></p>" : "") +
        priceNotes(s) +
        "</div>" : "";

      // "Seu plano": as respostas do quiz em linhas (mesmo visual do diagnóstico)
      var planRows = s.plan ? s.plan.rows.map(function (r) { return [r.label, answerOf(r.key)]; })
        .filter(function (r) { return r[1]; }) : [];
      var planHtml = planRows.length ? '<div class="qz-diag qz-plan"><h2 class="qz-diag__title">' + s.plan.title + "</h2>" +
        planRows.map(function (r) { return '<div class="qz-diag__row"><span>' + r[0] + "</span><strong>" + r[1] + "</strong></div>"; }).join("") +
        "</div>" : "";
      return '<section class="qz-screen">' +
        '<div class="qz-media qz-media--flush">' + img(s.banner, "", true) + "</div>" +
        '<p class="qz-eyebrow">' + s.eyebrow + "</p>" +
        '<h1 class="qz-title">' + s.title + "</h1>" +
        '<p class="qz-sub">' + s.subtitle + "</p>" +
        planHtml +

        '<div class="qz-pillars">' + s.pillars.map(function (p) {
          return '<div class="qz-pillar"><span class="qz-pillar__icon" aria-hidden="true">' + p.emoji + "</span>" +
            "<div><h2>" + p.title + "</h2><p>" + p.text + "</p></div></div>";
        }).join('<div class="qz-pillar-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v15M5 12l7 7 7-7"/></svg></div>') + "</div>" +

        '<h2 class="qz-h2 qz-center qz-gap">' + s.proofTitle + "</h2>" +
        // Provas em loop automático (a lista vai duas vezes; a segunda é só visual)
        '<div class="qz-marquee qz-marquee--proof" aria-label="Resultados de alunos"><div class="qz-marquee__track">' +
        s.proofs.map(function (p, i) {
          return '<img class="qz-proof-card" src="' + p.src + '" width="' + p.w + '" height="' + p.h + '" alt="Resultado de aluno ' + (i + 1) + '" decoding="async">';
        }).join("") +
        s.proofs.map(function (p) {
          return '<img class="qz-proof-card" src="' + p.src + '" width="' + p.w + '" height="' + p.h + '" alt="" aria-hidden="true" decoding="async">';
        }).join("") +
        "</div></div>" +

        '<div class="qz-stack" id="qz-price">' +
        '<h2 class="qz-h2 qz-center">' + s.stackTitle + "</h2>" +
        '<ul class="qz-stack__list">' + s.stack.map(function (it) {
          return "<li>" + (it.image ? '<img src="' + it.image + '" alt="" width="48" height="60" loading="lazy" decoding="async">' : '<span class="qz-stack__check" aria-hidden="true">✓</span>') +
            "<div><strong>" + it.title + "</strong>" + (it.text ? "<span>" + it.text + "</span>" : "") + "</div></li>";
        }).join("") + "</ul>" +
        priceHtml +
        (isMinor ? minorBlock(s.minor) :
          checkoutCta(ctaLabel, "oferta", "qz-cta--main") +
          (s.payNote ? '<p class="qz-paynote">' + s.payNote + "</p>" : "") +
          '<p class="qz-trust">' + s.trust + "</p>") +
        "</div>" +

        modulesHtml(s.modules) +

        '<div class="qz-guarantee">' + img(s.guarantee.image, "qz-guarantee__seal") +
        '<h2 class="qz-h2">' + s.guarantee.title + "</h2>" +
        '<p class="qz-text">' + s.guarantee.text + "</p>" +
        '<ul class="qz-guarantee__list">' + s.guarantee.list.map(function (t) { return "<li>✅ " + t + "</li>"; }).join("") + "</ul>" +
        '<p class="qz-guarantee__footer">' + s.guarantee.footer + "</p>" +
        (isMinor ? "" : checkoutCta(s.guarantee.cta, "garantia")) +
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
    if (name.indexOf("ins") === 0) return screens.insight(+name.slice(3));
    if (name.indexOf("prf") === 0) return screens.proof(+name.slice(3));
    return screens[name]();
  }

  /* ───────────── Pré-carregamento das imagens da próxima tela ───────────── */

  function preload(name) {
    if (!name) return;
    var srcs = [];
    if (name === "about") srcs = D.about.author ? [D.about.author.avatar] : [];
    else if (name.indexOf("prf") === 0) { var p = Q[+name.slice(3)].proof; srcs = [p.casePhoto.src].concat(p.casePrint ? [p.casePrint.src] : []); }
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
    if (name.indexOf("prf") === 0) bindAudio(root);
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
    bindModules(root);

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
