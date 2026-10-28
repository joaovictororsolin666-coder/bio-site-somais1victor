/* ==========================================================================
   CONTEÚDO DO QUIZ — edite textos, perguntas e imagens aqui.
   Preço e link do checkout ficam em assets/js/config.js (links.checkoutMPR, oferta).
   ========================================================================== */
window.QUIZ_DATA = {

  intro: {
    title: 'Como faturar até <span class="hl">R$300 por dia</span> vendendo produtos digitais com vídeos simples, sem precisar aparecer!',
    tag: 'Mesmo que você seja totalmente iniciante',
    image: { src: 'assets/img/quiz/capa-v2.webp', w: 800, h: 450, alt: 'Victor Gomes com notificações de vendas aprovadas' },
    text: 'Não perca mais tempo apenas <mark>"rolando a tela"</mark> e vendo a vida dos outros. Chegou a hora de transformar <strong>visualizações em dinheiro no seu bolso</strong> com a fórmula que realmente funciona.',
    cta: 'DESCOBRIR COMO FUNCIONA',
    note: 'Leva cerca de 1 minuto · 9 perguntas rápidas'
  },

  // "key" é o nome usado no resumo personalizado do resultado
  questions: [
    {
      // Apresenta o mecanismo logo na primeira pergunta (eleva o nível de consciência)
      key: 'metodo',
      title: 'Você sabia que dá para vender produtos digitais usando vídeos simples, sem precisar aparecer?',
      options: [
        { emoji: '🤯', label: 'Não sabia, quero entender', id: 'nao-sabia' },
        { emoji: '👀', label: 'Já ouvi falar, mas não sei como funciona', id: 'ouviu' },
        { emoji: '😓', label: 'Sei, mas nunca consegui fazer funcionar', id: 'tentou' }
      ]
    },
    {
      key: 'idade',
      title: 'Qual a sua idade?',
      options: [
        { label: 'Entre 18 e 30 anos', id: '18-30' },
        { label: 'Mais de 30 anos', id: '30+' },
        { label: 'Tenho menos de 18', id: 'menor' }
      ]
    },
    {
      key: 'experiencia',
      title: 'Você já tentou ganhar dinheiro vendendo produtos digitais na internet?',
      options: [
        { emoji: '🙌', label: 'Nunca tentei, mas quero começar agora', short: 'Começando do zero', id: 'zero' },
        { emoji: '😓', label: 'Já tentei, mas ainda não consegui vender', short: 'Já tentou, sem vendas', id: 'tentou' },
        { emoji: '🚀', label: 'Sim, já vendo e quero aumentar meus resultados', short: 'Já vende', id: 'vende' }
      ]
    },
    {
      // Pergunta de crença + tela de "virada" logo depois (insight)
      key: 'crenca',
      title: 'Na sua opinião, o que é preciso para fazer a primeira venda na internet?',
      options: [
        { emoji: '👥', label: 'Ter muitos seguidores' },
        { emoji: '🎥', label: 'Aparecer nos vídeos' },
        { emoji: '💰', label: 'Investir em anúncios' },
        { emoji: '📦', label: 'Ter um produto próprio' }
      ],
      insight: {
        badge: '💡 A verdade é que…',
        title: 'Para começar, você <span class="hl">não precisa</span> do que a maioria pensa.',
        text: 'No Método Primeira Renda você aprende a vender produtos digitais usando <strong>perfis dark e cortes de vídeos</strong>, mesmo começando do zero.',
        points: [
          '❌ Não precisa ter muitos seguidores',
          '❌ Não precisa aparecer nos vídeos',
          '❌ Não precisa investir em anúncios',
          '✅ Precisa de um passo a passo e do seu celular'
        ],
        cta: 'FAZ SENTIDO, CONTINUAR'
      }
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
      title: 'Quanto você gostaria de faturar por dia com seu negócio digital?',
      subtitle: 'Escolha a meta que mudaria a sua rotina 👇',
      options: [
        { emoji: '💸', label: 'Até R$100 por dia', short: 'Até R$100/dia', goal: 'até R$100 por dia' },
        { emoji: '🔥', label: 'De R$100 a R$200 por dia', short: 'R$100 a R$200/dia', goal: 'R$100 a R$200 por dia' },
        { emoji: '🚀', label: 'De R$200 a R$300 por dia', short: 'R$200 a R$300/dia', goal: 'R$200 a R$300 por dia' }
      ]
    },
    {
      // Objeção principal: personaliza o resultado e a oferta (ver result.objection e offer.objectionNotes)
      key: 'objecao',
      title: 'O que mais te impede de começar hoje?',
      subtitle: 'Seja sincero, isso muda o que vou te mostrar 👇',
      options: [
        { emoji: '🧭', label: 'Não sei por onde começar', id: 'comeco', short: 'Por onde começar' },
        { emoji: '😟', label: 'Medo de investir e não dar certo', id: 'medo', short: 'Medo de investir' },
        { emoji: '⏳', label: 'Tenho pouco tempo no dia', id: 'tempo', short: 'Pouco tempo' },
        { emoji: '🔁', label: 'Já tentei outras coisas que não funcionaram', id: 'tentou', short: 'Já tentou antes' }
      ],
      // Prova social logo depois da dificuldade: tela própria ("prf" + índice)
      proof: {
        badge: '👀 Veja esse caso real',
        title: 'Muita gente começa <span class="hl">exatamente assim</span>',
        caseText: 'A Poliana entrou perdida, achando que nunca ia vender nada e em <mark>12 dias faturou mais de R$2.000,00</mark> usando o nosso <strong>Sistema de Vendas.</strong>',
        casePhoto: { src: 'assets/img/quiz/poliana.webp', w: 400, h: 534, alt: 'Poliana, aluna do MPR' },
        caseName: 'Poliana · Aluna MPR',
        audio: { src: 'assets/img/quiz/depoimento.mp3', duration: '0:18' },
        audioHint: '🔊 Toque para ouvir o depoimento dela',
        casePrint: { src: 'assets/img/quiz/resultado-a.webp', w: 540, h: 957, alt: 'Print da conversa com a Poliana mostrando o resultado dela' },
        proof: 'Esse é apenas um dos milhares de resultados de quem coloca o método em prática! 🔥',
        cta: 'IR PARA A ÚLTIMA PERGUNTA'
      }
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
    // Cabeçalho de autor (foto + nome + @)
    author: { name: 'Victor Gomes', handle: '@somais1victor', avatar: 'assets/img/victor.webp', verified: true },
    title: '<span class="hl">Quem é</span> Victor Gomes?',
    paragraphs: [
      'Eu comecei no digital do <strong>absoluto zero</strong>, sem audiência, sem experiência e sem saber por onde começar.',
      'Até que descobri uma forma de <strong>vender produtos digitais usando vídeos simples, sem precisar aparecer e sem investir em anúncios.</strong>',
      'Foi assim que construí um negócio digital de <span class="hl">6 dígitos em faturamento</span> e já ajudei <strong>mais de 3.000 pessoas</strong> a conhecer esse mercado.',
      'Hoje, meu objetivo é mostrar que <strong>você também pode dar os primeiros passos no digital</strong>, mesmo começando do zero.'
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
    // Tela de resultado em formato de diagnóstico: respostas → bloqueio → por que combina → prova → botão
    badge: 'Diagnóstico pronto!',
    // Título pela meta escolhida ({meta}) + final pela experiência (id da opção)
    title: 'Sua meta de <span class="hl">{meta}</span> é possível, {fim}',
    titleEnd: {
      zero: 'mas só com o caminho certo',
      tentou: 'mas não do jeito que você vem tentando',
      vende: 'mas não do jeito que você vem fazendo'
    },
    titleFallback: 'O que te separa da sua primeira venda <span class="hl">não é o que você imagina</span>',
    subtitle: 'Analisei suas respostas. Veja o que elas mostram 👇',
    diagTitle: '📋 Seu diagnóstico',
    diagRows: [
      { key: 'experiencia', label: 'Ponto de partida' },
      { key: 'tempo', label: 'Tempo por dia' },
      { key: 'meta', label: 'Meta' },
      { key: 'objecao', label: 'Maior obstáculo' }
    ],
    alertTitle: 'O que está te impedindo de começar não é falta de esforço...',
    alertText: '❌ É não ter um passo a passo e não saber quais estratégias realmente aplicar!',
    fitTitle: '✅ Por que o método combina com você',
    // Pela resposta de "experiencia" (id da opção)
    fit: {
      zero: '🚀 O método foi feito para quem está <strong>começando do zero</strong>.',
      tentou: '🎯 Você vai seguir <strong>estratégias prontas</strong>, sem tentativa e erro.',
      vende: '📈 Você vai <strong>estruturar suas vendas</strong> para vender todos os dias.'
    },
    fitBase: '📱 Tudo pelo <strong>celular</strong>, com vídeos simples e <strong>sem precisar aparecer</strong>.',
    cta: 'QUERO APRENDER ESSE MÉTODO',
    // Recado personalizado pela resposta da pergunta "objecao" (id da opção)
    objection: {
      comeco: '🧭 Não sabe por onde começar? O método é um <strong>passo a passo do zero</strong>, aula por aula.',
      medo: '🛡️ Medo de investir? Você tem <strong>7 dias de garantia</strong>: se não gostar, recebe 100% de volta.',
      tempo: '⏳ Pouco tempo? Dá para começar <strong>no seu ritmo</strong>, nos intervalos do dia.',
      tentou: '🔁 Já tentou outras coisas? Aqui você aplica <strong>estratégias prontas</strong>, como a Poliana.'
    },
    // Recado para quem tem mais de 30 anos
    over30: '🤝 <strong>Não precisa entender de tecnologia:</strong> você segue o passo a passo, aula por aula.'
  },

  gift: {
    title: '🎁 Preparei um presente especial para te ajudar a começar!',
    text: 'Escolha uma das caixas abaixo para descobrir os bônus que acompanham o treinamento.',
    image: 'assets/img/quiz/presente.webp',
    hint: 'Toque em uma caixa para revelar seus bônus',
    loading: 'Preparando seus bônus especiais...'
  },

  bonus: {
    title: '🎁 Você desbloqueou 2 bônus junto com o método',
    text: 'Além do treinamento, você terá acesso a ferramentas práticas para facilitar seus primeiros passos.',
    items: [
      {
        tag: 'BÔNUS 01',
        title: 'Estrutura de Vendas',
        text: 'Tenha toda a estrutura que me fez ganhar mais de 100 mil reais em poucos meses sem vender curso e sem aparecer.',
        image: { src: 'assets/img/quiz/bonus-1-v2.webp', w: 600, h: 600, alt: 'Bônus Estrutura de Vendas' }
      },
      {
        tag: 'BÔNUS 02',
        title: '+2.500 Vídeos Prontos',
        text: 'Acesse mais de 2.500 vídeos virais prontos pra postar, viralizar e vender todos os dias. Mais fácil que isso não existe!',
        image: { src: 'assets/img/quiz/bonus-2-v2.webp', w: 600, h: 600, alt: 'Bônus +2.500 vídeos prontos' }
      }
    ],
    warning: '(Não desperdice essa oportunidade, hein 🤨)',
    cta: 'QUERO GARANTIR MEUS BÔNUS'
  },

  offer: {
    banner: { src: 'assets/img/quiz/banner-oferta.webp', w: 800, h: 336, alt: 'Método Primeira Renda' },
    eyebrow: 'MPR · Método Primeira Renda',
    title: 'Aprenda a faturar até <span class="hl">R$300 por dia</span> vendendo produtos digitais com vídeos simples, sem precisar aparecer!',
    subtitle: 'Mesmo que você esteja começando do absoluto zero.',
    // Resumo das respostas logo abaixo do título (continua a conversa do quiz)
    plan: {
      title: '📋 Seu plano personalizado',
      rows: [
        { key: 'experiencia', label: 'Ponto de partida' },
        { key: 'tempo', label: 'Tempo por dia' },
        { key: 'meta', label: 'Sua meta' }
      ]
    },
    pillars: [
      { emoji: '📱', title: 'Comece do zero usando apenas o celular', text: 'Aprenda a vender produtos digitais, mesmo sem experiência, seguidores ou precisar aparecer.' },
      { emoji: '🧩', title: 'Use estratégias prontas', text: 'Acesse conteúdos e estratégias prontas para adaptar e colocar em prática.' },
      { emoji: '🤖', title: 'Estruture suas vendas', text: 'Ative nosso Sistema de Vendas para atrair compradores e fazer vendas todos os dias.' }
    ],
    proofTitle: 'Veja os resultados de quem decidiu colocar o método em prática! 🚀',
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
      { title: 'Bônus 01 · Estrutura de Vendas', text: 'A estrutura para vender sem curso e sem aparecer', image: 'assets/img/quiz/bonus-1-v2.webp' },
      { title: 'Bônus 02 · +2.500 Vídeos Prontos', text: 'Vídeos virais prontos para postar todos os dias', image: 'assets/img/quiz/bonus-2-v2.webp' },
      { title: 'Bônus extra · Grupo VIP no WhatsApp', image: 'assets/img/quiz/extra-1.webp' },
      { title: 'Bônus extra · Robô de Vendas no Automático', image: 'assets/img/quiz/robo-vendas.webp' }
    ],
    // Carrossel automático com as capas dos módulos (bloco próprio, antes da garantia)
    modules: {
      title: '📚 O que você recebe ao entrar no método',
      items: [
        { src: 'assets/img/quiz/modulo-01.webp', title: 'Comece aqui' },
        { src: 'assets/img/quiz/modulo-02.webp', title: 'Produtos digitais' },
        { src: 'assets/img/quiz/modulo-03.webp', title: 'Crie o seu produto' },
        { src: 'assets/img/quiz/modulo-04.webp', title: 'Edição viral' },
        { src: 'assets/img/quiz/modulo-05.webp', title: 'Primeira venda' },
        { src: 'assets/img/quiz/modulo-06.webp', title: 'Decifrando o algoritmo' },
        { src: 'assets/img/quiz/modulo-07.webp', title: 'Automatizando suas vendas' },
        { src: 'assets/img/quiz/modulo-08.webp', title: 'Escalando com tráfego pago' },
        { src: 'assets/img/quiz/modulo-09.webp', title: 'Produtos validados' },
        { src: 'assets/img/quiz/modulo-10.webp', title: 'Entre para a comunidade' }
      ]
    },
    // {preco} vira o preço à vista do config.js (oferta.precoVista)
    cta: 'SIM! QUERO COMPRAR POR {preco}',
    // Deixa claro que é uma compra (muita gente achava que era grátis)
    payNote: 'Você vai para o pagamento seguro (Pix ou cartão). O acesso é liberado após a confirmação do pagamento.',
    trust: '🔒 Pagamento 100% seguro · 🔓 Acesso imediato',
    // Linha logo abaixo do preço, pela objeção escolhida no quiz
    objectionNotes: {
      comeco: '🧭 Passo a passo do zero, aula por aula',
      medo: '🛡️ Garantia de 7 dias: se não gostar, recebe 100% de volta',
      tempo: '⏳ Comece pelo celular, no seu ritmo',
      tentou: '🔁 Estratégias prontas para aplicar, sem tentativa e erro'
    },
    // Quem marca "menos de 18" não vê o botão de compra: vê este bloco e envia o link a um responsável
    minor: {
      title: '🔞 A compra precisa ser feita por um maior de 18 anos',
      text: 'Você marcou que tem menos de 18. Se quiser começar, mostre o método para seu pai, mãe ou responsável.',
      cta: 'ENVIAR PARA MEU RESPONSÁVEL',
      message: 'Olha esse método para vender produtos digitais com vídeos simples, sem aparecer. Quero começar, pode dar uma olhada? '
    },
    guarantee: {
      image: { src: 'assets/img/quiz/garantia.webp', w: 480, h: 320, alt: 'Selo de garantia de 7 dias' },
      title: 'Garantia incondicional de 7 dias',
      text: 'Você terá <strong>7 dias inteiros</strong> para acessar o Método Primeira Renda, assistir às aulas, conhecer as estratégias e colocar o passo a passo em prática.',
      list: ['Acesse o conteúdo imediatamente', 'Teste o método durante 7 dias', 'Se não gostar, peça seu dinheiro de volta'],
      footer: 'Sem complicação e sem burocracia!',
      cta: 'COMPRAR COM GARANTIA DE 7 DIAS'
    },
    faq: [
      { q: 'Funciona mesmo para quem está começando do zero?', a: '<strong>Sim! 🚀</strong> O Método Primeira Renda foi desenvolvido para iniciantes. Você vai aprender o passo a passo para criar sua estrutura, produzir conteúdos e começar a vender produtos digitais, mesmo sem experiência.' },
      { q: 'Preciso aparecer ou ter muitos seguidores?', a: '<strong>Não! ✅</strong> Você vai aprender estratégias utilizando perfis dark, cortes de vídeos e produtos digitais, sem precisar mostrar o rosto ou já ter uma audiência grande.' },
      { q: 'Quando vou receber meu acesso?', a: '<strong>Imediatamente! 🔓</strong> Após a confirmação do pagamento, você receberá as instruções para acessar a plataforma com as aulas, materiais e bônus.' },
      { q: 'E se eu comprar e não gostar?', a: '<strong>Você tem 7 dias de garantia! 🛡️</strong> Acesse as aulas, conheça o método e teste as estratégias. Se perceber que não é para você, basta solicitar o reembolso dentro do prazo e receber 100% do valor pago de volta.' }
    ]
  }
};
