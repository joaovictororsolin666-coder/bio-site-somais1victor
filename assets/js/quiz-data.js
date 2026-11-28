/* ==========================================================================
   CONTEÚDO DO QUIZ — edite textos, perguntas e imagens aqui.
   Preço e link do checkout ficam em assets/js/config.js (links.checkoutMPR, oferta).
   ========================================================================== */
window.QUIZ_DATA = {

  intro: {
    title: 'Como faturar <span class="hl">R$300 ou mais por dia</span> vendendo produtos digitais na internet, sem precisar aparecer!',
    tag: 'Mesmo que você seja totalmente iniciante',
    image: { src: 'assets/img/quiz/capa-v2.webp', w: 800, h: 450, alt: 'Victor Gomes com notificações de vendas aprovadas' },
    text: 'Os mesmos vídeos que você assiste o dia inteiro estão <strong>vendendo produtos digitais</strong> em perfis que não mostram o rosto de ninguém.</p><p class="qz-text"><strong>Em 1 minuto</strong>, você descobre se esse caminho serve pra você e por onde começar.',
    cta: 'DESCOBRIR COMO FUNCIONA',
    note: '1 minuto · 10 perguntas · Resultado na hora'
  },

  // "key" é o nome usado no resumo personalizado do resultado
  questions: [
    // Fase 1: genéricas
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
      key: 'tempo',
      title: 'Quanto tempo por dia você conseguiria dedicar para construir sua renda online?',
      options: [
        { emoji: '🕛', label: 'Até 30 minutos por dia', short: 'Até 30 min/dia' },
        { emoji: '📈', label: 'De 1 a 2 horas por dia', short: '1 a 2 h/dia' },
        { emoji: '🔥', label: 'Mais de 2 horas por dia', short: '+2 h/dia' }
      ]
    },
    // Fase 2: dor
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
      // Objeção principal: personaliza o resultado e a oferta (ver result.objection e offer.objectionNotes)
      key: 'objecao',
      title: 'O que mais te impede de começar hoje?',
      subtitle: 'Seja sincero, isso muda o que vou te mostrar 👇',
      options: [
        { emoji: '🧭', label: 'Não sei por onde começar', id: 'comeco', short: 'Por onde começar' },
        { emoji: '😟', label: 'Medo de investir e não dar certo', id: 'medo', short: 'Medo de investir' },
        { emoji: '⏳', label: 'Tenho pouco tempo no dia', id: 'tempo', short: 'Pouco tempo' },
        { emoji: '🔁', label: 'Já tentei outras coisas que não funcionaram', id: 'tentou', short: 'Já tentou antes' }
      ]
    },
    // Fase 3: desejo
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
      key: 'mudanca',
      title: 'O que mudaria na sua vida com essa renda?',
      subtitle: 'Escolha o que mais pesa para você 👇',
      options: [
        { emoji: '💳', label: 'Pagar minhas contas sem aperto', short: 'Pagar as contas' },
        { emoji: '👨‍👩‍👧', label: 'Ajudar a minha família', short: 'Ajudar a família' },
        { emoji: '🕊️', label: 'Ter mais liberdade no meu tempo', short: 'Mais liberdade' },
        { emoji: '🎯', label: 'Realizar um sonho que está parado', short: 'Realizar um sonho' }
      ]
    },
    // Fase 4: solução
    {
      // Apresenta o mecanismo depois da dor e do desejo
      key: 'metodo',
      title: 'Você sabia que dá para vender produtos digitais usando vídeos simples, sem precisar aparecer?',
      options: [
        { emoji: '🤯', label: 'Não sabia, quero entender', id: 'nao-sabia' },
        { emoji: '👀', label: 'Já ouvi falar, mas não sei como funciona', id: 'ouviu' },
        { emoji: '😓', label: 'Sei, mas nunca consegui fazer funcionar', id: 'tentou' }
      ]
    },
    {
      // Pergunta de crença + tela de "virada" logo depois (insight)
      key: 'crenca',
      title: 'Na sua opinião, o que é preciso para fazer a primeira venda na internet?',
      // "virada": completa o título da tela seguinte ("Para começar, você não precisa ...")
      options: [
        { emoji: '👥', label: 'Ter muitos seguidores', virada: 'ter muitos seguidores' },
        { emoji: '🎥', label: 'Aparecer nos vídeos', virada: 'aparecer nos vídeos' },
        { emoji: '💰', label: 'Investir em anúncios', virada: 'investir em anúncios' },
        // Não dizer "não precisa ter um produto próprio": o conteúdo ensina a criar o produto com IA
        { emoji: '📦', label: 'Ter um produto próprio', virada: 'saber criar um produto sozinho: a IA cria com você' }
      ],
      insight: {
        badge: '💡 A verdade é que…',
        // Título usado só se a resposta não tiver "virada"
        title: 'Para começar, você <span class="hl">não precisa</span> do que a maioria pensa.',
        text: 'No Método Primeira Venda você aprende a vender produtos digitais usando <strong>perfis dark e cortes de vídeos</strong>, mesmo começando do zero.',
        points: [
          '❌ Não precisa ter muitos seguidores',
          '❌ Não precisa aparecer nos vídeos',
          '❌ Não precisa investir em anúncios',
          '✅ Só precisa do celular e de um passo a passo que mostra o que postar e onde vender'
        ],
        cta: 'FAZ SENTIDO, CONTINUAR'
      },
      // Prova social logo depois da virada: tela própria ("prf" + índice)
      proof: {
        hideAnswer: true,
        badge: '👀 Veja esse caso real',
        title: 'Muita gente começa <span class="hl">exatamente assim</span>',
        caseText: 'A Poliana entrou perdida, achando que nunca ia vender nada e em <mark>12 dias faturou mais de R$2.000,00</mark> usando o nosso <strong>Sistema de Vendas.</strong>',
        casePhoto: { src: 'assets/img/quiz/poliana.webp', w: 400, h: 534, alt: 'Poliana, aluna do MPV' },
        caseName: 'Poliana · Aluna MPV',
        audio: { src: 'assets/img/quiz/depoimento.mp3', duration: '0:18' },
        audioHint: '🔊 Toque para ouvir o depoimento dela',
        casePrint: { src: 'assets/img/quiz/resultado-a.webp', w: 540, h: 957, alt: 'Print da conversa com a Poliana mostrando o resultado dela' },
        proof: 'Esse é um dos resultados de mais de 3.000 pessoas que já conheceram o método!',
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
    done: 'Seu perfil combina com o Método Primeira Venda ✅'
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
    banner: { src: 'assets/img/mpv-painel-800.webp', w: 800, h: 336, alt: 'Victor Gomes ao lado de um painel de criador com visualizações e monetização em dólar crescendo' },
    eyebrow: 'MPV · Método Primeira Venda',
    title: 'Aprenda a faturar <span class="hl">R$300 ou mais por dia</span> vendendo produtos digitais sem precisar aparecer!',
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
      // anim: animação leve no lugar do emoji ("celular", "estrategia" ou "vendas"); sem anim, mostra o emoji
      { emoji: '📱', anim: 'celular', title: 'Comece hoje, só com o celular', text: 'Nada de computador, câmera ou seguidores. Você posta e vende pelo mesmo aparelho que usa pra rolar a tela.' },
      { emoji: '🧩', anim: 'estrategia', title: 'Pare de adivinhar o que postar', text: 'Você recebe vídeos e estratégias prontas. É só adaptar e postar.' },
      { emoji: '🤖', anim: 'vendas', title: 'Venda enquanto faz outra coisa', text: 'O Sistema de Vendas atende quem chega e leva a pessoa até a compra.' }
    ],
    proofTitle: 'Veja os resultados de quem decidiu colocar o método em prática! 🚀',
    proofs: [
      { src: 'assets/img/quiz/resultado-a.webp', w: 540, h: 957, name: 'Poliana' },
      { src: 'assets/img/quiz/resultado-g.webp', w: 540, h: 920, name: 'Marcos' },
      { src: 'assets/img/quiz/resultado-b.webp', w: 540, h: 776, name: 'Xande' },
      { src: 'assets/img/quiz/resultado-c.webp', w: 540, h: 1005, name: 'Maurício' },
      { src: 'assets/img/quiz/resultado-d.webp', w: 540, h: 749, name: 'Gabriel' },
      { src: 'assets/img/quiz/resultado-e.webp', w: 540, h: 865, name: 'Paulo' },
      { src: 'assets/img/quiz/resultado-f.webp', w: 540, h: 803, name: 'Alan' }
    ],
    // Depois das provas: mini vídeo animado da área de membros (capas dos módulos) + cards de destaque (não clicáveis).
    // Substitui o carrossel "O que vou aprender?" que ficava depois do preço.
    tour: {
      eyebrow: 'Método Primeira Venda',
      title: 'Aqui está tudo o que você vai receber no <span class="hl">MPV</span>',
      subtitle: 'Sem precisar aparecer, pelo celular e de forma simples',
      bar: 'Área de membros · MPV',
      introText: 'Tour pela área de membros', // abertura só com o texto (sem logo, a pedido)
      alt: 'Prévia animada da área de membros do Método Primeira Venda, com as capas dos 10 módulos',
      covers: [
        'assets/img/quiz/modulo-01.webp', 'assets/img/quiz/modulo-02.webp', 'assets/img/quiz/modulo-03.webp',
        'assets/img/quiz/modulo-04.webp', 'assets/img/quiz/modulo-05.webp', 'assets/img/quiz/modulo-06.webp',
        'assets/img/quiz/modulo-07.webp', 'assets/img/quiz/modulo-08.webp', 'assets/img/quiz/modulo-09.webp',
        'assets/img/quiz/modulo-10.webp'
      ],
      chips: [
        'Passo a passo atualizado',
        'Estratégia pronta pra copiar, colar e vender',
        'Produtos prontos e já validados',
        'Área de membros completa',
        'Robô que vende por você'
      ]
    },
    // Bônus em destaque antes do resumo (como na página de referência): exclusivos em cards + extras com "De R$ X por R$ 0"
    bonusSection: {
      eyebrow: 'Bônus exclusivos',
      title: 'E para <span class="hl">acelerar seus resultados</span>, você ainda recebe esses bônus:',
      // Só os títulos (a pessoa já viu a descrição na tela dos presentes)
      items: [
        { tag: 'Bônus 01', title: 'Estrutura de Vendas', image: 'assets/img/quiz/bonus-1-v2.webp' },
        { tag: 'Bônus 02', title: '+2.500 Vídeos Prontos', image: 'assets/img/quiz/bonus-2-v2.webp' }
      ],
      extrasTitle: 'Bônus extras',
      extras: [
        {
          tag: 'Bônus especial 01', title: 'Grupo VIP no WhatsApp', image: 'assets/img/quiz/extra-1.webp',
          text: 'Dentro do MPV você terá acesso a uma comunidade de networking, com conteúdos exclusivos para você vender na internet e pessoas com o mesmo objetivo que você.'
        },
        {
          tag: 'Bônus especial 02', title: 'Robô de Vendas no Automático', image: 'assets/img/quiz/robo-vendas.webp',
          text: 'Como aluno do MPV, você ativa o meu robô de vendas criado por inteligência artificial, que vai vender pra você todos os dias no automático.'
        }
      ]
    },
    // Black November até 30/11 23h59 (Brasília): faixa no topo da oferta, título do resumo e contagem regressiva.
    // Depois do prazo tudo some sozinho e volta o stackTitle normal. Lembrete: reajustar o preço no config.js e nos checkouts.
    // 18/11: faixa do topo (bar: 'BLACK NOVEMBER') e contagem (countdownLabel) tiradas a pedido; fica só o título do resumo
    black: {
      ate: '2026-11-30T23:59:59-03:00',
      stackTitle: 'Oferta de <span class="hl">Black November</span>'
    },
    // Preço fixo (R$ 67 sempre visível) com um brilho pulsando; a animação de queda saiu em 20/11
    priceGlow: true,
    // Resumo da oferta logo acima do preço: títulos + valor de referência riscado ("de")
    stackTitle: '🎁 Tudo o que você recebe hoje',
    stack: [
      { title: 'Método Primeira Venda', de: 'R$ 97' },
      { title: 'Estrutura de Vendas', de: 'R$ 103' },
      { title: '+2.500 Vídeos Prontos', de: 'R$ 97' },
      { title: 'Grupo VIP no WhatsApp', inc: 'incluso' },
      { title: 'Robô de Vendas', inc: 'incluso' },
      { title: 'Garantia de 7 dias' }
    ],
    // Carrossel de arrastar: módulos em destaque com tópicos + card final com os demais (antes da garantia)
    modules: {
      title: 'O que vou <span class="hl">aprender?</span>',
      subtitle: 'Módulos do treinamento',
      items: [
        { n: 1, src: 'assets/img/quiz/modulo-01.webp', title: 'Comece aqui', topics: ['Como o método funciona do início ao fim', 'O que configurar antes de começar', 'Seu plano para os primeiros 7 dias'] },
        { n: 5, src: 'assets/img/quiz/modulo-05.webp', title: 'Primeira venda', topics: ['Como vender diariamente', 'Como vender no automático', 'O que fazer quando a primeira venda cair'] },
        { n: 9, src: 'assets/img/quiz/modulo-09.webp', title: 'Produtos validados', topics: ['Lista de produtos que já estão vendendo', 'Como achar um produto campeão', 'Os nichos que mais vendem agora'] },
        { n: 6, src: 'assets/img/quiz/modulo-06.webp', title: 'Decifrando o algoritmo', topics: ['Como viralizar com conteúdo simples, sem aparecer', 'Melhores horários e frequência de postagem', 'Por que alguns vídeos não saem do lugar'] }
      ],
      more: {
        title: '+ 5 módulos completos',
        items: ['Produtos digitais', 'Edição viral', 'Crie o seu produto', 'Automatizando suas vendas', 'Entre para a comunidade']
      }
    },
    // {preco} vira o preço à vista do config.js (oferta.precoVista)
    // Antes: 'SIM! QUERO COMPRAR POR {preco}' (quebrava em 2 linhas no celular)
    cta: 'QUERO COMEÇAR AGORA',
    // Deixa claro que é uma compra (muita gente achava que era grátis)
    payNote: 'Leva 1 minuto: preencha seus dados, pague no Pix e o acesso chega no seu e-mail na hora.',
    trust: '🔒 Pagamento seguro · 🛡️ 7 dias de garantia',
    // Linha abaixo do preço pela resposta da pergunta "objecao" (voltou em 20/11)
    objectionNotes: {
      comeco: '🧭 A aula 1 já te mostra o que fazer nos primeiros 7 dias.',
      medo: '🛡️ Se não gostar em 7 dias, devolvo 100%.',
      tempo: '⏳ Dá pra aplicar em 30 minutos por dia.',
      tentou: '🔁 Aqui você segue o que já está vendendo, sem teste.'
    },
    guarantee: {
      image: { src: 'assets/img/quiz/garantia.webp', w: 480, h: 320, alt: 'Selo de garantia de 7 dias' },
      title: 'Garantia incondicional de 7 dias',
      text: 'Você terá <strong>7 dias inteiros</strong> para acessar o Método Primeira Venda, assistir às aulas, conhecer as estratégias e colocar o passo a passo em prática.',
      list: ['Acesse o conteúdo imediatamente', 'Teste o método durante 7 dias', 'Se não gostar, peça seu dinheiro de volta'],
      footer: 'Um e-mail e o dinheiro volta. Sem perguntas.',
      cta: 'COMPRAR COM GARANTIA DE 7 DIAS'
    },
    faq: [
      { q: 'Funciona mesmo para quem está começando do zero?', a: '<strong>Sim! 🚀</strong> O Método Primeira Venda foi desenvolvido para iniciantes. Você vai aprender o passo a passo para criar sua estrutura, produzir conteúdos e começar a vender produtos digitais, mesmo sem experiência.' },
      { q: 'Preciso aparecer ou ter muitos seguidores?', a: '<strong>Não! ✅</strong> Você vai aprender estratégias utilizando perfis dark, cortes de vídeos e produtos digitais, sem precisar mostrar o rosto ou já ter uma audiência grande.' },
      { q: 'Quando vou receber meu acesso?', a: '<strong>Imediatamente! 🔓</strong> Após a confirmação do pagamento, você receberá as instruções para acessar a plataforma com as aulas, materiais e bônus.' },
      { q: 'Preciso gastar mais alguma coisa além dos R$ 67?', a: '<strong>Não é obrigatório. ✅</strong> Tudo o que você precisa para começar já está dentro do MPV: os vídeos, a estrutura e o robô. No curso eu mostro ferramentas gratuitas e, para quem quiser acelerar, também algumas pagas. Você escolhe.' },
      { q: 'Pago no Pix, quando recebo o acesso?', a: '<strong>Na hora! ⚡</strong> Assim que o Pix cai, o acesso chega no seu e-mail. Leva segundos.' },
      { q: 'Por que o checkout pede CPF e telefone?', a: 'São exigidos para emitir o Pix e enviar o seu acesso. <strong>Seus dados ficam protegidos.</strong>' },
      { q: 'E se eu comprar e não gostar?', a: '<strong>Você tem 7 dias de garantia! 🛡️</strong> Acesse as aulas, conheça o método e teste as estratégias. Se perceber que não é para você, basta solicitar o reembolso dentro do prazo e receber 100% do valor pago de volta.' }
    ]
  }
};
