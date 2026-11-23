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
