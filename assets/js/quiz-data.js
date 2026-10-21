/* ==========================================================================
   CONTEÚDO DO QUIZ — edite textos, perguntas e imagens aqui.
   Preço e link do checkout ficam em assets/js/config.js (links.checkoutMPR, oferta).
   ========================================================================== */
window.QUIZ_DATA = {

  intro: {
    title: 'Como fazer seus primeiros <span class="hl">R$5.000/mês</span> vendendo produtos digitais com vídeos simples, sem precisar aparecer!',
    tag: 'Mesmo que você seja totalmente iniciante',
    image: { src: 'assets/img/quiz/capa-v2.webp', w: 800, h: 450, alt: 'Victor Gomes com notificações de vendas aprovadas' },
    text: 'Não perca mais tempo apenas <mark>"rolando a tela"</mark> e vendo a vida dos outros. Chegou a hora de transformar <strong>visualizações em dinheiro no seu bolso</strong> com a fórmula que realmente funciona.',
    cta: 'DESCOBRIR COMO FUNCIONA',
    note: 'Leva menos de 1 minuto · 7 perguntas rápidas'
  },

  // "key" é o nome usado no resumo personalizado do resultado
  questions: [
    {
      key: 'idade',
      title: 'Qual a sua idade?',
      options: [
        { label: 'Entre 18 e 30 anos' },
        { label: 'Mais de 30 anos' },
        { label: 'Tenho menos de 18' }
      ]
    },
    {
      key: 'experiencia',
      title: 'Você já tentou ganhar dinheiro vendendo produtos digitais na internet?',
      options: [
        { emoji: '🙌', label: 'Nunca tentei, mas quero começar agora', short: 'Iniciante' },
        { emoji: '😓', label: 'Já tentei, mas ainda não consegui vender', short: 'Já tentou, sem vendas' },
        { emoji: '🚀', label: 'Sim, já vendo e quero aumentar meus resultados', short: 'Já vende' }
      ]
    },
    {
      key: 'rosto',
      title: 'Você gostaria de aprender a vender sem precisar mostrar o rosto?',
      options: [
        { emoji: '🔥', label: 'Sim! É exatamente o que eu procuro!' },
        { emoji: '🙁', label: 'Sim, mas não sei como fazer isso' },
        { emoji: '📱', label: 'Não me importo de aparecer' }
      ]
    },
    {
      key: 'tempo',
      title: 'Quanto tempo por dia você conseguiria dedicar para construir sua renda online?',
      options: [
        { emoji: '🕛', label: 'Até 30 minutos por dia', short: 'Até 30 min/dia' },
        { emoji: '📈', label: 'De 1 a 2 horas por dia', short: '1 a 2 h/dia' },
        { emoji: '🔥', label: 'Mais de 2 horas por dia', short: '+2 h/dia' }
      ]
    },
    {
      key: 'situacao',
      title: 'Qual dessas situações mais combina com o seu momento atual?',
      subtitle: 'Responda com toda sinceridade 👇',
      image: { src: 'assets/img/quiz/situacao.webp', w: 600, h: 400, alt: '' },
      options: [
        { emoji: '😪', label: 'Meu dinheiro não está sobrando no final do mês' },
        { emoji: '💸', label: 'Tenho uma renda, mas quero ganhar mais' },
        { emoji: '🚀', label: 'Quero construir minha própria fonte de renda online' }
      ]
    },
    {
      key: 'meta',
      title: 'Quanto você gostaria de faturar por mês com seu negócio digital?',
      subtitle: 'Escolha a meta que mudaria a sua rotina 👇',
      options: [
        { emoji: '💸', label: 'De R$1.000 a R$3.000 por mês', short: 'R$1 mil a R$3 mil/mês' },
        { emoji: '🔥', label: 'De R$3.000 a R$5.000 por mês', short: 'R$3 mil a R$5 mil/mês' },
        { emoji: '🚀', label: 'Mais de R$5.000 por mês', short: '+R$5 mil/mês' }
      ]
    },
    {
      key: 'disposicao',
      title: 'Se você tivesse acesso a um passo a passo para começar ainda hoje, estaria disposto a colocar em prática?',
      options: [
        { emoji: '🔥', label: 'Sim! Quero começar o quanto antes!' },
        { emoji: '💪', label: 'Sim, mas preciso de orientação para começar' },
        { emoji: '😕', label: 'Ainda tenho algumas dúvidas' }
      ]
    }
  ],

  about: {
    title: 'Prazer, sou Victor Gomes 👋',
    image: { src: 'assets/img/quiz/victor.webp', w: 640, h: 800, alt: 'Victor Gomes' },
    paragraphs: [
      'Eu comecei no digital do zero e descobri como <strong>vender produtos digitais pela internet usando vídeos simples, sem precisar mostrar meu rosto.</strong>',
      'Com essa estratégia, construí um negócio digital de <span class="hl">6 dígitos em faturamento</span> e já ajudei <strong>mais de 3.000 pessoas</strong> a conhecer esse mercado.',
      'Agora quero te mostrar como esse método funciona e quais são os primeiros passos para você começar também.'
    ],
    cta: 'QUERO CONHECER O MÉTODO'
  },

  loading: {
    title: 'Analisando suas respostas...',
    text: 'Organizando tudo para te mostrar os próximos passos.',
    items: ['Seu objetivo financeiro', 'Seu nível de experiência', 'Seu tempo disponível'],
    done: 'Seu perfil combina com o Método Primeira Renda ✅'
  },

  result: {
    badge: 'Seu resultado está pronto!',
    title: 'Você está a um passo de descobrir como começar a vender na internet <span class="hl">sem precisar aparecer!</span>',
    image: { src: 'assets/img/quiz/notificacoes.webp', w: 720, h: 411, alt: 'Notificações de vendas aprovadas' },
    text: 'Com base nas suas respostas, vou te mostrar o método que utilizo para vender produtos digitais através de vídeos simples, mesmo começando do zero.',
    alertTitle: 'O que pode estar te impedindo de vender não é falta de esforço...',
    alertText: '❌ É não saber por onde começar e quais estratégias realmente aplicar!',
    caseTitle: 'Como o caso da Poliana 👇',
    caseText: 'Entrou perdida, achando que nunca ia vender nada e em <mark>12 dias faturou mais de R$2.000,00</mark> usando o nosso <strong>Sistema de Vendas.</strong>',
    casePhoto: { src: 'assets/img/quiz/poliana.webp', w: 400, h: 534, alt: 'Poliana, aluna do MPR' },
    caseName: 'Poliana · Aluna MPR',
    audio: { src: 'assets/img/quiz/depoimento.mp3', duration: '0:18' },
    audioHint: '🔊 Toque para ouvir o depoimento dela',
    casePrint: { src: 'assets/img/quiz/resultado-a.webp', w: 540, h: 957, alt: 'Print da conversa com a Poliana mostrando o resultado dela' },
    proof: 'Esse é apenas um dos milhares de resultados de quem coloca o método em prática! 🔥',
    cta: 'QUERO APRENDER ESSE MÉTODO'
  },

  gift: {
    title: '🎁 Preparei um presente especial para te ajudar a começar!',
    text: 'Escolha uma das caixas abaixo para descobrir os bônus que acompanham o treinamento.',
    image: 'assets/img/quiz/presente.webp',
    hint: 'Toque em uma caixa para revelar seus bônus',
    loading: 'Preparando seus bônus especiais...'
  },

  bonus: {
    title: '🎁 Seus 2 bônus estão liberados!',
    text: 'Além do treinamento, você terá acesso a ferramentas práticas para facilitar seus primeiros passos.',
    items: [
      {
        tag: 'BÔNUS 01',
        title: 'Estrutura de Vendas',
        text: 'Tenha toda a estrutura que me fez ganhar mais de 100 mil reais em poucos meses sem vender curso e sem aparecer.',
        image: { src: 'assets/img/quiz/bonus-1.webp', w: 600, h: 589, alt: 'Bônus Estrutura de Vendas' }
      },
      {
        tag: 'BÔNUS 02',
        title: '+2.500 Vídeos Prontos',
        text: 'Acesse mais de 2.500 vídeos virais prontos pra postar, viralizar e vender todos os dias. Mais fácil que isso não existe!',
        image: { src: 'assets/img/quiz/bonus-2.webp', w: 600, h: 750, alt: 'Bônus +2.500 vídeos prontos' }
      }
    ],
    warning: '(Não desperdice essa oportunidade, hein 🤨)',
    cta: 'QUERO VER MEU PACOTE COMPLETO'
  },

  offer: {
    banner: { src: 'assets/img/quiz/banner-oferta.webp', w: 800, h: 336, alt: 'Método Primeira Renda' },
    eyebrow: 'MPR · Método Primeira Renda',
    title: 'Aprenda a fazer seus primeiros <span class="hl">R$5.000/mês</span> vendendo produtos digitais com vídeos simples, sem precisar aparecer!',
    subtitle: 'Mesmo que você esteja começando do absoluto zero.',
    pillars: [
      { emoji: '📱', title: 'Comece do zero usando apenas o celular', text: 'Aprenda a vender produtos digitais, mesmo sem experiência, seguidores ou precisar aparecer.' },
      { emoji: '🧩', title: 'Use estratégias prontas', text: 'Acesse conteúdos e estratégias prontas para adaptar e colocar em prática.' },
      { emoji: '🤖', title: 'Estruture suas vendas', text: 'Ative nosso Sistema de Vendas para atrair compradores e fazer vendas todos os dias.' }
    ],
    proofTitle: 'Veja os resultados de quem decidiu colocar o método em prática! 🚀',
    proofHint: 'Arraste para o lado 👉',
    proofs: [
      { src: 'assets/img/quiz/resultado-a.webp', w: 540, h: 957 },
      { src: 'assets/img/quiz/resultado-b.webp', w: 540, h: 776 },
      { src: 'assets/img/quiz/resultado-c.webp', w: 540, h: 1005 },
      { src: 'assets/img/quiz/resultado-d.webp', w: 540, h: 749 },
      { src: 'assets/img/quiz/resultado-e.webp', w: 540, h: 865 },
      { src: 'assets/img/quiz/resultado-f.webp', w: 540, h: 803 }
    ],
    stackTitle: '🎁 Tudo o que você recebe hoje',
    stack: [
      { title: 'Método Primeira Renda', text: 'Treinamento passo a passo + estratégias prontas', image: 'assets/img/quiz/logo-mpr.webp' },
      { title: 'Bônus 01 · Estrutura de Vendas', text: 'A estrutura para vender sem curso e sem aparecer', image: 'assets/img/quiz/bonus-1.webp' },
      { title: 'Bônus 02 · +2.500 Vídeos Prontos', text: 'Vídeos virais prontos para postar todos os dias', image: 'assets/img/quiz/bonus-2.webp' },
      { title: 'Bônus extra · Grupo VIP no WhatsApp', image: 'assets/img/quiz/extra-1.webp' },
      { title: 'Bônus extra · Robô de Vendas no Automático', image: 'assets/img/quiz/robo-vendas.webp' }
    ],
    cta: 'SIM! QUERO SER O MEU PRÓPRIO CHEFE',
    trust: '🔒 Pagamento 100% seguro · 🔓 Acesso imediato',
    guarantee: {
      image: { src: 'assets/img/quiz/garantia.webp', w: 480, h: 320, alt: 'Selo de garantia de 7 dias' },
      title: 'Garantia incondicional de 7 dias',
      text: 'Você terá <strong>7 dias inteiros</strong> para acessar o Método Primeira Renda, assistir às aulas, conhecer as estratégias e colocar o passo a passo em prática.',
      list: ['Acesse o conteúdo imediatamente', 'Teste o método durante 7 dias', 'Se não gostar, peça seu dinheiro de volta'],
      footer: 'Sem complicação e sem burocracia!',
      cta: 'QUERO GARANTIR MEU ACESSO SEM RISCO'
    },
    faq: [
      { q: 'Funciona mesmo para quem está começando do zero?', a: '<strong>Sim! 🚀</strong> O Método Primeira Renda foi desenvolvido para iniciantes. Você vai aprender o passo a passo para criar sua estrutura, produzir conteúdos e começar a vender produtos digitais, mesmo sem experiência.' },
      { q: 'Preciso aparecer ou ter muitos seguidores?', a: '<strong>Não! ✅</strong> Você vai aprender estratégias utilizando perfis dark, cortes de vídeos e produtos digitais, sem precisar mostrar o rosto ou já ter uma audiência grande.' },
      { q: 'Quando vou receber meu acesso?', a: '<strong>Imediatamente! 🔓</strong> Após a confirmação do pagamento, você receberá as instruções para acessar a plataforma com as aulas, materiais e bônus.' },
      { q: 'E se eu comprar e não gostar?', a: '<strong>Você tem 7 dias de garantia! 🛡️</strong> Acesse as aulas, conheça o método e teste as estratégias. Se perceber que não é para você, basta solicitar o reembolso dentro do prazo e receber 100% do valor pago de volta.' }
    ],
    stickyLabel: 'GARANTIR MEU ACESSO'
  }
};
