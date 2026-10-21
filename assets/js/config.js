/* ==========================================================================
   CONFIGURAÇÃO DO SITE — edite apenas este arquivo para trocar links e IDs.
   ========================================================================== */
window.SITE_CONFIG = {

  /* ── Links dos botões ── */
  links: {
    // Funil de vendas do Método Primeira Renda (ex.: "https://pay.hotmart.com/XXXX")
    metodoPrimeiraRenda: "",

    // Repassa as UTMs do visitante para o link do funil (mantém a origem rastreável)
    repassarUtms: true,

    // UTMs usadas quando o visitante chega sem nenhuma (ex.: clique direto na bio)
    utmPadrao: { utm_source: "instagram", utm_medium: "bio" }
  },

  /* ── Formulário de aplicação da mentoria ── */
  form: {
    // URL que recebe as respostas via POST. Veja README.md → "Formulário".
    // Opção A: Google Apps Script (planilha Google) → "https://script.google.com/macros/s/XXXX/exec"
    // Opção B: Formspree → "https://formspree.io/f/XXXX"
    // Enquanto estiver vazio, o formulário mostra erro e NÃO finge que enviou.
    endpoint: "https://script.google.com/macros/s/AKfycbzNlGV-QMw4ZVvxMf-wSZdk9xAms7PU2l7zBlznsnAiw8Yb-2Le76N1QvSUlpXelZde1w/exec",
    timeoutMs: 20000
  },

  /* ── Rastreamento (fica desligado enquanto os IDs estiverem vazios) ── */
  tracking: {
    gaId: "",          // Google Analytics 4, ex.: "G-XXXXXXXXXX"
    metaPixelId: "",   // Meta Pixel, ex.: "123456789012345"

    // true = só carrega GA/Pixel depois que o visitante aceitar os cookies (recomendado / LGPD)
    requireConsent: true,

    // Nomes dos eventos enviados. "meta" usa evento padrão quando o nome for um evento padrão da Meta (ex.: Lead).
    events: {
      mprClick:      { ga: "click_metodo_primeira_renda", meta: "ClickMetodoPrimeiraRenda" },
      mentoriaClick: { ga: "click_mentoria",              meta: "ClickMentoria" },
      formSubmit:    { ga: "generate_lead",               meta: "Lead" }
    }
  },

  // true = mostra no console os eventos e o que está sendo enviado (útil para testar)
  debug: false
};
