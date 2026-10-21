/* ==========================================================================
   Victor Gomes — Link na bio
   JS mínimo: links, origem (UTMs), rastreamento com consentimento e formulário.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var LINKS = CFG.links || {};
  var FORM = CFG.form || {};
  var TRK = CFG.tracking || {};

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function log() {
    if (CFG.debug && window.console) console.info.apply(console, ["[site]"].concat([].slice.call(arguments)));
  }

  function storage(type) {
    try { var s = window[type]; s.setItem("__t", "1"); s.removeItem("__t"); return s; } catch (e) { return null; }
  }
  var session = storage("sessionStorage");
  var local = storage("localStorage");

  /* ───────────── Origem do visitante (UTMs) ───────────── */

  var Attribution = (function () {
    var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
    var STORE = "vg_attr";
    var data = {};

    try { data = JSON.parse(session && session.getItem(STORE)) || {}; } catch (e) { data = {}; }

    var params = new URLSearchParams(location.search);
    var fresh = {};
    KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) fresh[k] = v.slice(0, 200);
    });
    // Uma nova campanha na mesma sessão substitui a anterior
    if (Object.keys(fresh).length) {
      KEYS.forEach(function (k) { delete data[k]; });
      Object.assign(data, fresh);
    }
    if (!data.referrer) data.referrer = document.referrer || "direto";
    if (!data.landing_page) data.landing_page = location.href.split("#")[0];

    if (session) session.setItem(STORE, JSON.stringify(data));

    return {
      all: function () { return Object.assign({}, data); },
      utms: function () {
        var out = {};
        KEYS.forEach(function (k) { if (data[k]) out[k] = data[k]; });
        return out;
      }
    };
  })();

  /* ───────────── Rastreamento (GA4 + Meta Pixel), só com consentimento ───────────── */

  var Tracking = (function () {
    var CONSENT_KEY = "vg_consent";
    var META_STANDARD = ["Lead", "Contact", "SubmitApplication", "InitiateCheckout", "ViewContent", "CompleteRegistration", "Schedule"];
    var enabled = !!(TRK.gaId || TRK.metaPixelId);
    var loaded = false;
    var banner = $("#cookie-banner");

    function loadScript(src) {
      var s = document.createElement("script");
      s.async = true;
      s.src = src;
      document.head.appendChild(s);
    }

    function load() {
      if (loaded) return;
      loaded = true;

      if (TRK.gaId) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", TRK.gaId, Attribution.utms());
        loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(TRK.gaId));
      }

      if (TRK.metaPixelId) {
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        /* eslint-enable */
        window.fbq("init", TRK.metaPixelId);
        window.fbq("track", "PageView");
      }
      log("rastreadores carregados");
    }

    function getConsent() { return local ? local.getItem(CONSENT_KEY) : null; }

    function setConsent(value) {
      if (local) local.setItem(CONSENT_KEY, value);
      banner.hidden = true;
      if (value === "granted") load();
      else if (loaded) location.reload(); // revogou: recarrega sem os rastreadores
    }

    function init() {
      if (!enabled) return;
      $$("[data-consent-open]").forEach(function (b) {
        b.hidden = !TRK.requireConsent;
        b.addEventListener("click", function () { banner.hidden = false; });
      });
      $$("[data-consent]", banner).forEach(function (b) {
        b.addEventListener("click", function () { setConsent(b.getAttribute("data-consent")); });
      });

      if (!TRK.requireConsent) return load();
      var c = getConsent();
      if (c === "granted") load();
      else if (c !== "denied") banner.hidden = false;
    }

    function track(key, extra) {
      var ev = (TRK.events || {})[key];
      if (!ev) return;
      var params = Object.assign({}, Attribution.utms(), extra || {});
      log("evento", key, params, loaded ? "" : "(não enviado: rastreadores desligados ou sem consentimento)");
      if (!loaded) return;
      if (ev.ga && window.gtag) window.gtag("event", ev.ga, params);
      if (ev.meta && window.fbq) {
        window.fbq(META_STANDARD.indexOf(ev.meta) > -1 ? "track" : "trackCustom", ev.meta, params);
      }
    }

    return { init: init, track: track };
  })();

  /* ───────────── Toast ───────────── */

  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ───────────── Links dos botões ───────────── */

  function withUtms(url) {
    try {
      var u = new URL(url, location.href);
      if (LINKS.repassarUtms) {
        var utms = Attribution.utms();
        if (!Object.keys(utms).length) utms = LINKS.utmPadrao || {};
        Object.keys(utms).forEach(function (k) {
          if (!u.searchParams.has(k)) u.searchParams.set(k, utms[k]);
        });
      }
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function initLinks() {
    $$("[data-link]").forEach(function (a) {
      var url = LINKS[a.getAttribute("data-link")];
      if (url) {
        a.href = withUtms(url);
      } else {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          toast("Link disponível em breve.");
          if (window.console) console.warn("[site] Defina links." + a.getAttribute("data-link") + " em assets/js/config.js");
        });
      }
    });

    $$("[data-track]").forEach(function (el) {
      el.addEventListener("click", function () { Tracking.track(el.getAttribute("data-track")); });
    });

    // O card inteiro é tocável e aciona o botão dele
    $$("[data-card]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a, button")) return;
        var action = $("[data-card-action]", card);
        if (action) action.click();
      });
    });
  }

  /* ───────────── Formulário de aplicação ───────────── */

  function initForm() {
    var dialog = $("#apply-dialog");
    if (!dialog) return; // página sem o formulário (ex.: quiz)
    var form = $("#apply-form");
    var status = $(".form__status", form);
    var submitBtn = $(".btn--submit", form);
    var viewForm = $('[data-view="form"]', dialog);
    var viewSuccess = $('[data-view="success"]', dialog);
    var sending = false;
    var touched = {};

    /* Abrir / fechar */
    function open() {
      if (!viewSuccess.hidden) { viewSuccess.hidden = true; viewForm.hidden = false; }
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      dialog.querySelector(".sheet__panel").scrollTop = 0;
    }
    function close() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    $$("[data-open-form]").forEach(function (b) {
      b.addEventListener("click", function () {
        Tracking.track("mentoriaClick");
        open();
      });
    });
    $$("[data-close]", dialog).forEach(function (b) { b.addEventListener("click", close); });
    // Toque fora do painel fecha
    dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });

    /* Máscaras leves */
    var wa = form.elements.whatsapp;
    wa.addEventListener("input", function () {
      if (wa.value.trim().charAt(0) === "+") return; // número internacional: sem máscara
      var d = wa.value.replace(/\D/g, "").slice(0, 11);
      var out = d;
      if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length > 6) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
      wa.value = out;
    });

    var ig = form.elements.instagram;
    ig.addEventListener("blur", function () {
      var v = ig.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?].*$/, "").replace(/^@+/, "");
      ig.value = v ? "@" + v : "";
    });

    /* Validação */
    var rules = {
      nome: function (v) {
        v = v.trim();
        return v.length >= 5 && v.split(/\s+/).length >= 2 ? "" : "Informe seu nome completo (nome e sobrenome).";
      },
      instagram: function (v) {
        return /^@?[A-Za-z0-9._]{1,30}$/.test(v.trim()) ? "" : "Informe um @ válido do Instagram.";
      },
      whatsapp: function (v) {
        var d = v.replace(/\D/g, "");
        return d.length >= 10 && d.length <= 15 ? "" : "Informe um WhatsApp válido com DDD.";
      },
      objetivo: function (v) { return v ? "" : "Selecione seu principal objetivo."; },
      dificuldade: function (v) { return v ? "" : "Selecione sua maior dificuldade."; },
      investimento: function (v) { return v ? "" : "Selecione uma faixa de investimento."; },
      projeto: function (v) {
        return v.trim().length >= 20 ? "" : "Conte um pouco mais sobre seu projeto (mínimo de 20 caracteres).";
      },
      consentimento: function (v, el) { return el.checked ? "" : "É preciso autorizar o contato para enviar."; }
    };

    function fieldValue(name) {
      var el = form.elements[name];
      if (el instanceof RadioNodeList) return el.value;
      return el.value;
    }

    function validate(name) {
      var el = form.elements[name];
      var msg = rules[name](fieldValue(name), el);
      var target = el instanceof RadioNodeList ? $(".chips", form) : el;
      target.setAttribute("aria-invalid", msg ? "true" : "false");
      $("#e-" + name).textContent = msg;
      return !msg;
    }

    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      var nodes = el instanceof RadioNodeList ? [].slice.call(el) : [el];
      nodes.forEach(function (n) {
        n.addEventListener("blur", function () { touched[name] = true; validate(name); });
        n.addEventListener(n.type === "radio" || n.type === "checkbox" || n.tagName === "SELECT" ? "change" : "input", function () {
          if (touched[name] || n.type === "radio" || n.type === "checkbox" || n.tagName === "SELECT") validate(name);
        });
      });
    });

    function setStatus(msg) {
      status.textContent = msg || "";
      status.className = "form__status" + (msg ? " is-error" : "");
      status.hidden = !msg;
    }

    function setSending(on) {
      sending = on;
      submitBtn.classList.toggle("is-loading", on);
      submitBtn.setAttribute("aria-busy", on ? "true" : "false");
      $(".btn__label", submitBtn).textContent = on ? "ENVIANDO..." : "ENVIAR MINHA APLICAÇÃO";
    }

    /* Envio — a confirmação só aparece com resposta { ok: true } do servidor */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      setStatus("");

      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        touched[name] = true;
        if (!validate(name) && !firstInvalid) firstInvalid = name;
      });
      if (firstInvalid) {
        var el = form.elements[firstInvalid];
        (el instanceof RadioNodeList ? el[0] : el).focus();
        return;
      }

      if (form.elements.website.value) return; // robô preencheu o campo invisível

      if (!FORM.endpoint) {
        setStatus("O envio de aplicações ainda não está disponível. Tente novamente mais tarde.");
        if (window.console) console.error("[site] Defina form.endpoint em assets/js/config.js para receber as aplicações.");
        return;
      }

      var body = new URLSearchParams();
      ["nome", "instagram", "whatsapp", "objetivo", "dificuldade", "investimento", "projeto"].forEach(function (k) {
        body.append(k, fieldValue(k).trim());
      });
      body.append("consentimento", "sim");
      var attr = Attribution.all();
      Object.keys(attr).forEach(function (k) { body.append(k, attr[k]); });
      body.append("enviado_em", new Date().toISOString());
      body.append("_subject", "Nova aplicação — Mentoria de Criação de Conteúdo");

      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, FORM.timeoutMs || 20000);

      setSending(true);
      log("enviando aplicação", Object.fromEntries ? Object.fromEntries(body) : body.toString());

      // URLSearchParams = requisição "simples" (sem preflight CORS): compatível com Google Apps Script e Formspree
      fetch(FORM.endpoint, {
        method: "POST",
        body: body,
        headers: { Accept: "application/json" },
        redirect: "follow",
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (json) {
            if (!res.ok || !json || json.ok !== true) {
              throw new Error((json && (json.error || json.errors && JSON.stringify(json.errors))) || "HTTP " + res.status);
            }
          });
        })
        .then(function () {
          Tracking.track("formSubmit", { form: "mentoria" });
          form.reset();
          touched = {};
          viewForm.hidden = true;
          viewSuccess.hidden = false;
          dialog.querySelector(".sheet__panel").scrollTop = 0;
          viewSuccess.focus();
        })
        .catch(function (err) {
          if (window.console) console.error("[site] Falha no envio:", err);
          setStatus(err && err.name === "AbortError"
            ? "O envio demorou mais que o esperado. Verifique sua conexão e tente novamente."
            : "Não foi possível enviar sua aplicação agora. Verifique sua conexão e tente novamente.");
        })
        .then(function () {
          clearTimeout(timer);
          setSending(false);
        });
    });
  }

  /* ───────────── Início ───────────── */

  // Usado pelo quiz (assets/js/quiz.js)
  window.VG = { track: Tracking.track, withUtms: withUtms, toast: toast };

  initLinks();
  initForm();
  Tracking.init();
})();
