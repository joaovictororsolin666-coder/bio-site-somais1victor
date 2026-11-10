/* ==========================================================================
   CONFIGURAÇÃO DO SITE — edite apenas este arquivo para trocar links e IDs.
   ========================================================================== */
window.SITE_CONFIG = {

  /* ── Links dos botões ── */
  links: {
    // Botão do Clube Dark Viral → página do grupo VIP até a abertura. Para abrir as vendas pelo quiz, troque por "clube".
    clubeDarkViral: "clube-vip",

    // Checkout do Clube Dark Viral. Enquanto estiver vazio, o botão de compra avisa que ainda não está configurado.
    checkoutClube: "",
    checkoutUtmsClube: { utm_campaign: "cdv", utm_content: "funil_quiz_clube", src: "quiz_cdv" },

    // Botão do Método Primeira Renda → quiz (funil). Para pular o quiz, coloque aqui o link do checkout.
    metodoPrimeiraRenda: "quiz",

    // Checkout do MPR (botões da oferta no fim do quiz) — Kiwify
    checkoutMPR: "https://pay.kiwify.com.br/X9MavXp",

    // UTMs fixas no link do checkout para identificar vendas vindas do quiz.
    // As UTMs do visitante (anúncio, stories etc.) têm prioridade; estas só preenchem o que faltar.
    // utm_term recebe o botão clicado: oferta ou garantia. "src" identifica o quiz nos relatórios de vendas.
    checkoutUtms: { utm_campaign: "mpr", utm_content: "funil_quiz_kiwify", src: "quiz_mpr" },

    // Checkout do quiz por país (desde 10/11): quem está no Brasil vai para a NeonPay (Pix, paga na hora)
    // e quem está fora vai para a Kiwify (cobra em outras moedas). O país vem do fuso horário do celular.
    // Para voltar ao sorteio, troque modo: "pais" por modo: "sorteio" ("neon" = parte sorteada para a NeonPay).
    // Para desligar, coloque ativo: false e todos voltam para checkoutMPR (Kiwify).
    testeCheckout: {
      ativo: true,
      modo: "pais",
      neon: 0.5,
      link: "https://checkout.neonpay.com.br/checkout/cmv6sesvu022k01of5d632afj?offer=VNOV5FS",
      utms: { utm_campaign: "mpr", utm_content: "funil_quiz_neonpay", src: "quiz_mpr" }
    },

    // Repassa as UTMs do visitante para o link do funil (mantém a origem rastreável)
    repassarUtms: true,

    // UTMs usadas quando o visitante chega sem nenhuma (ex.: clique direto na bio)
    utmPadrao: { utm_source: "instagram", utm_medium: "bio" }
  },

  /* ── Preço exibido na oferta do quiz (confira com o checkout ao mudar o preço) ── */
  oferta: {
    precoDe: "R$ 297", // preço cheio, aparece riscado acima do preço à vista
    precoVista: "R$ 67",
    parcelas: "12x de R$ 6,93" // Kiwify (na NeonPay era 12x de R$ 6,85)
  },

  /* ── Página do grupo VIP do Clube (/clube-vip): link do grupo do WhatsApp e data de abertura ("2026-11-14T19:00:00-03:00") ── */
  clubeVip: { grupo: "https://chat.whatsapp.com/JXfjoL9JCZBL35Au8XWuel", abertura: "2026-11-14T19:00:00-03:00" },

  /* ── Preço exibido na oferta do Clube Dark Viral (confira com o checkout ao mudar o preço) ── */
  ofertaClube: {
    precoVista: "R$ 67",
    parcelas: "12x de R$ 6,93"
  },

  /* ── Preço exibido na oferta para quem cai na NeonPay no teste de checkout ── */
  ofertaNeon: {
    precoDe: "R$ 297",
    precoVista: "R$ 67",
    parcelas: "12x de R$ 6,85"
  },

  /* ── Formulário de aplicação da mentoria ── */
  form: {
    // URL que recebe as respostas via POST. Veja README.md → "Formulário".
    // Opção A: Google Apps Script (planilha Google) → "https://script.google.com/macros/s/XXXX/exec"
    // Opção B: Formspree → "https://formspree.io/f/XXXX"
    // Enquanto estiver vazio, o formulário mostra erro e NÃO finge que enviou.
    endpoint: "https://script.google.com/macros/s/AKfycbxHUSv0yxrKLLKxdQDUslAVdOzAlKkOKllPaICQuDnnhipj7cX9W2g8qKzBNhkMjOEJAA/exec",
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
      clubeClick:    { ga: "click_clube_dark_viral",      meta: "ClickClubeDarkViral" },
      mprClick:      { ga: "click_metodo_primeira_renda", meta: "ClickMetodoPrimeiraRenda" },
      mentoriaClick: { ga: "click_mentoria",              meta: "ClickMentoria" },
      formSubmit:    { ga: "generate_lead",               meta: "Lead" },
      quizStart:     { ga: "quiz_start",                  meta: "QuizStart" },
      quizComplete:  { ga: "quiz_complete",               meta: "ViewContent" },
      checkoutClick: { ga: "begin_checkout",              meta: "InitiateCheckout" }
    }
  },

  // true = mostra no console os eventos e o que está sendo enviado (útil para testar)
  debug: false
};
