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
})();
