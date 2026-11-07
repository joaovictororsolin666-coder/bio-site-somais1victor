/* ==========================================================================
   Clube Dark Viral — página do grupo VIP.
   Link do grupo e data de abertura ficam em assets/js/config.js (clubeVip).
   ========================================================================== */
(function () {
  "use strict";

  var cfg = (window.SITE_CONFIG || {}).clubeVip || {};

  // Botões: levam ao grupo do WhatsApp
  Array.prototype.forEach.call(document.querySelectorAll("[data-grupo]"), function (a) {
    if (cfg.grupo) {
      a.href = cfg.grupo;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.VG && VG.toast) VG.toast("Link do grupo disponível em breve.");
      });
    }
  });

  // Contagem até a abertura: some quando não há data ou quando ela já passou
  var alvo = cfg.abertura ? new Date(cfg.abertura).getTime() : NaN;
  var timer = document.getElementById("vip-timer");
  if (timer && !isNaN(alvo) && alvo > Date.now()) {
    var tick = function () {
      var r = Math.floor((alvo - Date.now()) / 1000);
      if (r <= 0) { timer.hidden = true; clearInterval(id); return; }
      var v = { d: Math.floor(r / 86400), h: Math.floor(r / 3600) % 24, m: Math.floor(r / 60) % 60, s: r % 60 };
      Object.keys(v).forEach(function (k) {
        timer.querySelector('[data-t="' + k + '"]').textContent = (v[k] < 10 ? "0" : "") + v[k];
      });
    };
    timer.hidden = false;
    var id = setInterval(tick, 1000);
    tick();
  }

  // Nichos passam sozinhos; param quando a pessoa toca ou arrasta
  var box = document.querySelector(".vip-niches");
  var track = document.getElementById("vip-niches");
  if (box && track && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    track.innerHTML += track.innerHTML; // repete para o giro não ter fim visível
    Array.prototype.slice.call(track.children, track.children.length / 2).forEach(function (el) { el.setAttribute("aria-hidden", "true"); });
    var parado = false, pos = 0, ultimo = 0;
    var parar = function () { parado = true; };
    box.addEventListener("pointerdown", parar);
    box.addEventListener("touchstart", parar, { passive: true });
    box.addEventListener("wheel", parar, { passive: true });
    var passo = function (t) {
      if (parado) return;
      if (ultimo) {
        pos += (t - ultimo) * 0.03; // pixels por milissegundo
        if (pos >= track.scrollWidth / 2) pos -= track.scrollWidth / 2;
        box.scrollLeft = pos;
      }
      ultimo = t;
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  /* ── Simulação: tema → link do vídeo → IA corta → monetização (nada é enviado, é só demonstração) ── */
  var sim = document.querySelector("[data-sim]");
  if (!sim) return;

  var TEMAS = {
    gta: {
      exemplo: "https://youtube.com/watch?v=trailer-gta-6",
      fundo: "url(/assets/img/clube-gta-800.webp) 90% 96% / auto 210% no-repeat #2a0f3a",
      cortes: [
        { e: "🚗", t: "Os 5 detalhes que ninguém viu no trailer", d: "0:58" },
        { e: "🌴", t: "Vice City está de volta? A teoria", d: "1:04" },
        { e: "🔥", t: "A cena que quebrou a internet", d: "0:47" }
      ]
    },
    podcast: {
      exemplo: "https://youtube.com/watch?v=podcast-episodio",
      fundo: "linear-gradient(170deg, #4c1d95, #db2777)",
      cortes: [
        { e: "🎙️", t: "Ele contou como saiu do zero", d: "0:59" },
        { e: "😳", t: "A resposta que ninguém esperava", d: "0:42" },
        { e: "💡", t: "O conselho que mudou tudo", d: "1:02" }
      ]
    },
    futebol: {
      exemplo: "https://youtube.com/watch?v=melhores-momentos",
      fundo: "linear-gradient(170deg, #166534, #7e22ce)",
      cortes: [
        { e: "⚽", t: "O gol mais bonito da rodada", d: "0:38" },
        { e: "😱", t: "A defesa impossível", d: "0:31" },
        { e: "🔥", t: "A virada nos acréscimos", d: "0:55" }
      ]
    },
    curiosidades: {
      exemplo: "https://youtube.com/watch?v=documentario-viral",
      fundo: "linear-gradient(170deg, #1e3a8a, #c026d3)",
      cortes: [
        { e: "🧠", t: "O fato que vai mudar seu dia", d: "0:45" },
        { e: "🌍", t: "O lugar mais estranho do mundo", d: "0:52" },
        { e: "👁️", t: "Isso não te ensinaram na escola", d: "0:49" }
      ]
    }
  };
  var LOG = ["🔎 Analisando o vídeo…", "🔥 Encontrando os momentos mais fortes…", "✂️ Cortando no formato vertical 9:16…", "💬 Colocando legendas automáticas…", "✅ Cortes prontos para postar!"];

  var tema = "gta";
  var paineis = sim.querySelectorAll("[data-passo]");
  var passos = sim.querySelectorAll(".sim-steps li");
  var input = sim.querySelector("#sim-link");
  var caixa = sim.querySelector(".sim-link");
  var barra = sim.querySelector("[data-barra]");
  var log = sim.querySelector("[data-log]");
  var cortes = sim.querySelector("[data-cortes]");
  var timers = [];

  function mostrar(n) {
    Array.prototype.forEach.call(paineis, function (p) { p.hidden = p.getAttribute("data-passo") !== String(n); });
    Array.prototype.forEach.call(passos, function (li, i) { li.classList.toggle("is-on", i < n); });
  }

  function linkValido(v) { return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\/?\S*$/i.test(v.trim()); }

  function cortar() {
    timers.forEach(clearTimeout);
    timers = [];
    log.innerHTML = "";
    barra.style.width = "0";
    mostrar(3);
    LOG.forEach(function (txt, i) {
      timers.push(setTimeout(function () {
        var li = document.createElement("li");
        li.textContent = txt;
        log.appendChild(li);
        barra.style.width = ((i + 1) / LOG.length * 100) + "%";
      }, 450 + i * 650));
    });
    timers.push(setTimeout(resultado, 450 + LOG.length * 650 + 300));
  }

  function resultado() {
    var t = TEMAS[tema];
    cortes.innerHTML = "";
    t.cortes.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "sim-corte";
      el.style.setProperty("--bg-corte", t.fundo);
      var emoji = document.createElement("span");
      emoji.className = "sim-corte__emoji";
      emoji.textContent = c.e;
      var dur = document.createElement("span");
      dur.className = "sim-corte__tempo";
      dur.textContent = c.d;
      var titulo = document.createElement("strong");
      titulo.textContent = c.t;
      var ok = document.createElement("span");
      ok.className = "ok";
      ok.textContent = "✓ Pronto para postar";
      el.appendChild(emoji);
      el.appendChild(dur);
      el.appendChild(titulo);
      el.appendChild(ok);
      cortes.appendChild(el);
    });
    mostrar(4);
  }

  sim.addEventListener("click", function (e) {
    var btTema = e.target.closest("[data-tema]");
    if (btTema) {
      tema = btTema.getAttribute("data-tema");
      Array.prototype.forEach.call(sim.querySelectorAll("[data-tema]"), function (b) { b.classList.toggle("is-on", b === btTema); });
      return;
    }
    if (e.target.closest("[data-colar]")) {
      input.value = TEMAS[tema].exemplo;
      caixa.classList.remove("is-erro");
      return;
    }
    var ir = e.target.closest("[data-ir]");
    if (!ir) return;
    var n = Number(ir.getAttribute("data-ir"));
    if (n === 2) {
      input.value = "";
      input.placeholder = TEMAS[tema].exemplo;
      mostrar(2);
    } else if (n === 3) {
      if (!input.value.trim()) input.value = TEMAS[tema].exemplo;
      if (!linkValido(input.value)) { caixa.classList.add("is-erro"); input.focus(); return; }
      caixa.classList.remove("is-erro");
      cortar();
    } else {
      timers.forEach(clearTimeout);
      mostrar(1);
    }
    sim.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
