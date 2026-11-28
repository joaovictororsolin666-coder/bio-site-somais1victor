/* ==========================================================================
   CONTEÚDO DO QUIZ DO CLUBE DARK VIRAL — edite textos, nichos e imagens aqui.
   Preço e link do checkout ficam em assets/js/config.js (links.checkoutClube, ofertaClube).
   ========================================================================== */
window.QUIZ_DATA = {
  id: 'vg_clube',
  stepLabel: 'Fase',
  checkoutKey: 'checkoutClube',
  checkoutUtmsKey: 'checkoutUtmsClube',
  ofertaKey: 'ofertaClube',
  // Vai para o painel /painel marcado como funil "clube" (fica separado do MPV)
  funil: 'clube',
  // Voltar: igual ao MPV — depois que a pessoa abre o presente (bônus e oferta) não dá mais para voltar

  intro: {
    title: 'Descubra como <span class="hl">ganhar dinheiro com vídeos curtos</span>, sem precisar aparecer!',
    tag: 'Mesmo que você esteja começando do zero',
    // Animação montando um perfil (nicho → nome e foto → vídeos) no lugar da foto; image fica de reserva
    builder: true,
    image: { src: 'assets/img/clube/intro.webp', w: 1200, h: 675, alt: 'Celular com vídeos curtos, visualizações e ganhos subindo' },
    text: 'Responda rapidinho, escolha um nicho e veja <strong>a sua página de vídeos curtos ganhando forma</strong> na hora.',
    cta: 'MONTAR MINHA PÁGINA',
    note: 'Leva cerca de 1 minuto · 9 fases rápidas'
  },

  // "key" é o nome usado no resumo personalizado do resultado
  questions: [
    {
      key: 'metodo',
      title: 'Você sabia que dá para ganhar dinheiro postando vídeos curtos, sem nunca mostrar o rosto?',
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
      key: 'objetivo',
      title: 'O que você mais quer conseguir com a sua página?',
      options: [
        { emoji: '📈', label: 'Crescer e ganhar seguidores', short: 'Crescer a página' },
        { emoji: '💸', label: 'Monetizar sem precisar aparecer', short: 'Monetizar sem aparecer' },
        { emoji: '🛒', label: 'Vender produtos no futuro', short: 'Vender produtos' }
      ]
    },
    {
      key: 'experiencia',
      title: 'Você já tentou criar uma página na internet?',
      options: [
        { emoji: '🙌', label: 'Nunca tentei, quero começar agora', short: 'Começando do zero', id: 'zero' },
        { emoji: '😓', label: 'Já tentei, mas não saiu do lugar', short: 'Já tentou, sem crescer', id: 'tentou' },
        { emoji: '🚀', label: 'Já tenho uma página e quero crescer mais', short: 'Já tem página', id: 'vende' }
      ]
    },
    {
      key: 'crenca',
      title: 'Na sua opinião, o que é mais importante para uma página de vídeos curtos crescer?',
      options: [
        { emoji: '🎥', label: 'Saber editar muito bem' },
        { emoji: '📱', label: 'Ter equipamento caro' },
        { emoji: '💰', label: 'Investir em anúncios' },
        { emoji: '🍀', label: 'Dar sorte com o algoritmo' }
      ],
      insight: {
        badge: '💡 A verdade é que…',
        title: 'Começar é <span class="hl">mais simples</span> do que a maioria pensa.',
        text: 'O que faz diferença é escolher bem o nicho, entender o formato e postar com constância.',
        points: [
          '❌ Não precisa aparecer nos vídeos',
          '❌ Não precisa de equipamento caro',
          '❌ Não precisa investir em anúncios',
          '✅ Precisa de um passo a passo, do celular e de constância'
        ],
        cta: 'FAZ SENTIDO, CONTINUAR'
      }
    },
    {
      // Escolha principal: as fotos passam sozinhas e cada nicho traz nomes, conteúdo e formato.
      // Para usar foto, coloque image: 'assets/img/quiz/nicho-xxx.webp' (proporção 4:5) na opção.
      key: 'nicho',
      layout: 'carousel',
      title: 'Qual nicho você escolheria para a sua página?',
      subtitle: 'Toque no que mais combina com você 👇',
      hint: '👉 Arraste para ver mais nichos',
      options: [
        {
          emoji: '🎮', label: 'Cortes de games', short: 'Cortes de games', id: 'cortes-games', image: 'assets/img/clube/nicho-cortes-games.webp', hooks: ['GTA 6: tudo que já sabemos', 'O easter egg que ninguém viu', 'Top 5 momentos da semana'], colors: ['#db2777', '#1e1b4b'],
          desc: 'Em alta com o lançamento do GTA 6 chegando',
          names: ['cortes.gta6.dark', 'gameplay.cortes'],
          conteudo: 'Notícias, teorias e melhores momentos de jogos em alta, como o GTA 6',
          formato: 'Cortes curtos com narração e legenda'
        },
        {
          emoji: '✂️', label: 'Cortes de podcasts e lives', short: 'Cortes de podcasts', id: 'cortes-podcast', image: 'assets/img/clube/nicho-cortes-podcast.webp', hooks: ['Ele não esperava essa resposta', 'O conselho que mudou tudo', 'Ninguém ficou calado'], colors: ['#9333ea', '#18181b'],
          desc: 'Os melhores trechos que viralizam todos os dias',
          names: ['cortes.do.dia', 'trechos.virais'],
          conteudo: 'Os momentos mais fortes de podcasts, lives e entrevistas',
          formato: 'Cortes de até 1 minuto com legenda chamativa'
        },
        {
          emoji: '🧠', label: 'Curiosidades', short: 'Curiosidades', id: 'curiosidades', image: 'assets/img/clube/nicho-curiosidades.webp', hooks: ['Você sabia disso?', 'O país que não tem rios', '99% erra essa'], colors: ['#6d28d9', '#1e1b4b'],
          desc: 'Fatos rápidos que fazem a pessoa assistir até o fim',
          names: ['voce.sabia.dark', 'fatos.ocultos'],
          conteudo: 'Fatos surpreendentes do dia a dia e do mundo',
          formato: 'Vídeos curtos, com um fato por vídeo'
        },
        {
          emoji: '🕵️', label: 'Histórias e mistérios', short: 'Histórias e mistérios', id: 'misterios', image: 'assets/img/clube/nicho-misterios.webp', hooks: ['O caso sem explicação', 'Parte 1: a casa abandonada', 'Até hoje ninguém sabe'], colors: ['#581c87', '#0f172a'],
          desc: 'Casos intrigantes contados em partes',
          names: ['misterios.dark', 'casos.sem.resposta'],
          conteudo: 'Casos reais intrigantes e histórias sem explicação',
          formato: 'Séries contadas em partes'
        },
        {
          emoji: '🔥', label: 'Motivação', short: 'Motivação', id: 'motivacao', image: 'assets/img/clube/nicho-motivacao.webp', hooks: ['Ninguém vai fazer por você', 'Leia isso antes de desistir', 'Comece hoje'], colors: ['#a21caf', '#3b0764'],
          desc: 'Frases e narrações que as pessoas salvam e enviam',
          names: ['mente.dark', 'foco.silencioso'],
          conteudo: 'Frases, reflexões e histórias de superação',
          formato: 'Vídeos curtos, feitos para salvar e enviar'
        },
        {
          emoji: '💰', label: 'Finanças', short: 'Finanças', id: 'financas', image: 'assets/img/clube/nicho-financas.webp', hooks: ['Pare de gastar com isso', '3 dicas para guardar dinheiro', 'O erro do salário'], colors: ['#7e22ce', '#052e16'],
          desc: 'Dicas simples sobre como lidar com dinheiro',
          names: ['dinheiro.dark', 'bolso.inteligente'],
          conteudo: 'Dicas simples de organização e economia',
          formato: 'Listas rápidas, com uma dica por vídeo'
        },
        {
          emoji: '🐾', label: 'Animais', short: 'Animais', id: 'animais', image: 'assets/img/clube/nicho-animais.webp', hooks: ['Ele fez isso sozinho', 'O animal mais inteligente', 'Olha o que aconteceu'], colors: ['#9333ea', '#422006'],
          desc: 'Fatos e curiosidades que todo mundo compartilha',
          names: ['mundo.animal.dark', 'bichos.curiosos'],
          conteudo: 'Fatos e comportamentos curiosos dos animais',
          formato: 'Vídeos curtos, feitos para compartilhar'
        },
        {
          emoji: '🍳', label: 'Receitas', short: 'Receitas', id: 'receitas', image: 'assets/img/clube/nicho-receitas.webp', hooks: ['Pronto em 10 minutos', 'Só 3 ingredientes', 'A receita que viralizou'], colors: ['#c026d3', '#431407'],
          desc: 'Mostre só as mãos e o prato, sem aparecer',
          names: ['receita.em.1.minuto', 'cozinha.sem.rosto'],
          conteudo: 'Receitas rápidas com poucos ingredientes',
          formato: 'Passo a passo mostrando só as mãos e o prato'
        },
        {
          emoji: '🙏', label: 'Fé e reflexão', short: 'Fé e reflexão', id: 'fe', image: 'assets/img/clube/nicho-fe.webp', hooks: ['Uma palavra para hoje', 'Envie para quem precisa', 'Não desista agora'], colors: ['#7c3aed', '#1c1917'],
          desc: 'Mensagens curtas que as pessoas gostam de enviar',
          names: ['palavra.do.dia.dark', 'reflexao.diaria'],
          conteudo: 'Mensagens de fé e reflexões para o dia',
          formato: 'Mensagens curtas, feitas para enviar'
        },
        {
          emoji: '🤖', label: 'Tecnologia e IA', short: 'Tecnologia e IA', id: 'ia', image: 'assets/img/clube/nicho-ia.webp', hooks: ['A IA que faz tudo por você', '3 sites que parecem ilegais', 'Faça isso em 1 minuto'], colors: ['#4f46e5', '#2e1065'],
          desc: 'Ferramentas novas explicadas de um jeito fácil',
          names: ['ia.sem.segredo', 'tech.dark'],
          conteudo: 'Ferramentas e recursos novos explicados de forma fácil',
          formato: 'Tutoriais rápidos, um recurso por vídeo'
        }
      ],
      reveal: {
        badge: '🎉 Nicho desbloqueado!',
        title: 'Sua página de <span class="hl">{opcao}</span> começa assim',
        text: 'Olha como a sua ideia de página já começa a tomar forma 👇',
        cta: 'CONTINUAR MONTANDO'
      }
    },
    {
      key: 'estilo',
      title: 'Como você prefere fazer os seus vídeos?',
      options: [
        { emoji: '✍️', label: 'Só texto na tela com música', short: 'Texto na tela' },
        { emoji: '🎙️', label: 'Narração com voz de IA', short: 'Voz de IA' },
        { emoji: '🎬', label: 'Imagens com legenda', short: 'Imagens com legenda' },
        { emoji: '✂️', label: 'Cortes de vídeos com legenda', short: 'Cortes com legenda' }
      ]
    },
    {
      key: 'tempo',
      title: 'Quanto tempo por dia você conseguiria dedicar para a sua página?',
      options: [
        { emoji: '🕛', label: 'Até 30 minutos por dia', short: 'Até 30 min/dia' },
        { emoji: '📈', label: 'De 1 a 2 horas por dia', short: '1 a 2 h/dia' },
        { emoji: '🔥', label: 'Mais de 2 horas por dia', short: '+2 h/dia' }
      ]
    },
    {
      key: 'objecao',
      title: 'O que mais te impede de começar hoje?',
      subtitle: 'Seja sincero, isso muda o que vou te mostrar 👇',
      options: [
        { emoji: '🧭', label: 'Não sei por onde começar', id: 'comeco', short: 'Por onde começar' },
        { emoji: '😟', label: 'Medo de investir e não dar certo', id: 'medo', short: 'Medo de investir' },
        { emoji: '⏳', label: 'Tenho pouco tempo no dia', id: 'tempo', short: 'Pouco tempo' },
        { emoji: '🔁', label: 'Já tentei outras coisas que não funcionaram', id: 'tentou', short: 'Já tentou antes' }
      ],
      // Tela logo depois: responde à objeção que a pessoa marcou
      insight: {
        badge: 'Fica tranquilo',
        cta: 'ENTENDI, CONTINUAR',
        byOption: {
          medo: {
            title: 'Você tem <span class="hl">7 dias de garantia</span>',
            text: 'Se você entrar, testar e sentir que não é para você, é só pedir o reembolso em até 7 dias e você recebe 100% do valor de volta.',
            points: ['🛡️ Garantia incondicional de 7 dias', '💸 Reembolso de 100%, sem burocracia', '✅ Você conhece tudo por dentro antes de decidir']
          },
          comeco: {
            title: 'Você vai ter um <span class="hl">passo a passo detalhado</span>',
            text: 'Do nicho ao primeiro vídeo postado, tudo explicado aula por aula, usando só o seu celular e alguns minutos do seu dia.',
            points: ['📱 Tudo pelo celular', '🧭 Aula por aula, na ordem certa', '🤝 Comunidade para tirar dúvidas']
          },
          tempo: {
            title: 'O método foi feito para o seu <span class="hl">tempo livre</span>',
            text: 'Aulas diretas ao ponto, sem enrolação, para você aplicar nos intervalos do dia, no seu ritmo.',
            points: ['⏱️ Aulas curtas e objetivas', '📅 Você monta a sua rotina de postagem', '📱 Dá para fazer tudo pelo celular']
          },
          tentou: {
            title: 'Dessa vez você <span class="hl">não vai estar sozinho</span>',
            text: 'Muita gente tenta sem um método e para no meio do caminho. No Clube você segue um passo a passo organizado e tem uma comunidade para tirar dúvidas.',
            points: ['🎯 Passo a passo do zero, na ordem certa', '🤝 Comunidade para trocar experiências', '🛡️ 7 dias de garantia para testar']
          }
        }
      }
    }
  ],

  about: {
    author: { name: 'Victor Gomes', handle: '@somais1victor', avatar: 'assets/img/victor.webp', verified: true },
    title: '<span class="hl">Quem é</span> Victor Gomes?',
    paragraphs: [
      'Eu comecei no digital do <strong>absoluto zero</strong>, sem audiência, sem experiência e sem saber por onde começar.',
      'Até que descobri que dava para <strong>crescer na internet usando vídeos simples, sem precisar aparecer e sem investir em anúncios.</strong>',
      'Criei o <span class="hl">Clube Dark Viral</span> para reunir quem quer ganhar com vídeos curtos: um curso gravado, passo a passo, e uma comunidade para não caminhar sozinho.'
    ],
    cta: 'QUERO VER MINHA PÁGINA'
  },

  loading: {
    title: 'Montando a sua página...',
    text: 'Juntando suas escolhas para te mostrar os próximos passos.',
    items: ['Seu nicho', 'O estilo dos seus vídeos', 'Seu tempo disponível'],
    done: 'Sua página está pronta para começar ✅'
  },

  result: {
    badge: 'Página montada!',
    titleFallback: 'Sua página de <span class="hl">{nicho}</span> está pronta para sair do papel',
    titleEnd: {},
    subtitle: 'Veja como ela ficou com as suas escolhas 👇',
    diagTitle: '📋 Suas escolhas',
    diagRows: [
      { key: 'experiencia', label: 'Ponto de partida' },
      { key: 'tempo', label: 'Tempo por dia' },
      { key: 'objetivo', label: 'Objetivo' },
      { key: 'objecao', label: 'Maior obstáculo' }
    ],
    alertTitle: '⚠️ Ter a ideia é só o começo...',
    alertText: '❌ O que trava a maioria é não saber como produzir, postar e crescer com constância!',
    fitTitle: '✅ Por que o Clube combina com você',
    fit: {
      zero: '🚀 O passo a passo foi pensado para quem está <strong>começando do zero</strong>.',
      tentou: '🎯 Você vai entender <strong>o que ajustar</strong> para sair da tentativa e erro.',
      vende: '📈 Você vai <strong>organizar sua produção</strong> para postar com mais constância.'
    },
    fitBase: '📱 Tudo pelo <strong>celular</strong>, com vídeos simples e <strong>sem precisar aparecer</strong>.',
    cta: 'QUERO ENTRAR NO CLUBE',
    objection: {
      comeco: '🧭 Não sabe por onde começar? O curso é um <strong>passo a passo do zero</strong>, aula por aula.',
      medo: '🛡️ Medo de investir? Você tem <strong>7 dias de garantia</strong>: se não gostar, recebe 100% de volta.',
      tempo: '⏳ Pouco tempo? Dá para começar <strong>no seu ritmo</strong>, nos intervalos do dia.',
      tentou: '🔁 Já tentou outras coisas? Aqui você tem <strong>aulas e uma comunidade</strong> para tirar dúvidas.'
    },
    over30: '🤝 <strong>Não precisa entender de tecnologia:</strong> você segue o passo a passo, aula por aula.'
  },

  gift: {
    title: '🎁 Falta só uma fase: abra o seu presente!',
    text: 'Escolha uma das caixas abaixo para descobrir o bônus que acompanha o Clube.',
    image: 'assets/img/quiz/presente.webp',
    hint: 'Toque em uma caixa para revelar o bônus',
    loading: 'Preparando o seu bônus...'
  },

  bonus: {
    title: '🎁 Você desbloqueou o Pack de Vídeos',
    text: 'Um extra para você ter material desde o começo.',
    items: [
      {
        tag: 'BÔNUS',
        title: 'Pack de Vídeos',
        text: 'Vídeos prontos para você se inspirar e começar a postar mais rápido na sua página.',
        image: { src: 'assets/img/quiz/bonus-2-v2.webp', w: 600, h: 600, alt: 'Bônus Pack de Vídeos' }
      }
    ],
    warning: '(Não desperdice essa oportunidade, hein 🤨)',
    cta: 'QUERO GARANTIR MEU BÔNUS'
  },

  offer: {
    banner: { src: 'assets/img/clube-banner-1300.webp', w: 1300, h: 588, alt: 'Clube Dark Viral: a comunidade do sucesso em vídeos curtos' },
    eyebrow: 'CDV · Clube Dark Viral',
    title: 'Aprenda a <span class="hl">ganhar dinheiro com vídeos curtos</span> sem precisar aparecer!',
    subtitle: 'Mesmo que você esteja começando do absoluto zero.',
    plan: {
      title: '📋 Sua página',
      rows: [
        { key: 'nicho', label: 'Nicho' },
        { key: 'estilo', label: 'Estilo dos vídeos' },
        { key: 'tempo', label: 'Tempo por dia' },
        { key: 'objetivo', label: 'Objetivo' }
      ]
    },
    pillars: [
      { anim: 'nichos', emoji: '🎯', title: 'Escolha o nicho certo para você', text: 'Entenda como escolher um nicho e montar a sua página do zero.' },
      { anim: 'cortes', emoji: '🎬', title: 'Produza vídeos simples pelo celular', text: 'De um único vídeo você tira vários cortes, cada um com um modelo pronto, sem precisar aparecer.' },
      { anim: 'monetizar', emoji: '💸', title: 'Conheça as formas de monetizar', text: 'As principais formas de transformar as views da sua página em renda.' }
    ],
    // Mesmo formato do MPR: bônus exclusivos (linhas com imagem) + bônus extras com resumo, sem preço
    bonusSection: {
      eyebrow: 'Bônus exclusivos',
      title: 'E para <span class="hl">acelerar seus resultados</span>, você ainda recebe:',
      items: [
        { tag: 'Bônus 01', title: 'Pack de Vídeos', image: 'assets/img/quiz/bonus-2-v2.webp' }
      ],
      extrasTitle: 'Bônus extras',
      extras: [
        { tag: 'Bônus 02', title: 'Comunidade do Clube', image: 'assets/img/clube/bonus-comunidade.webp', text: 'Um grupo com quem também está criando a sua página de vídeos curtos, para trocar experiências, tirar dúvidas e não caminhar sozinho.' }
      ]
    },
    stackTitle: '🎁 Tudo o que você recebe',
    priceLabel: 'Acesso completo + bônus',
    priceAnim: true,
    // "de" = valor de referência riscado ao lado de cada item
    stack: [
      { title: 'Clube Dark Viral', text: 'Curso gravado passo a passo', image: 'assets/img/clube/produto-cdv.webp', de: 'R$ 197' },
      { title: 'Bônus 01 · Pack de Vídeos', text: 'Material para começar a postar mais rápido', image: 'assets/img/quiz/bonus-2-v2.webp', de: 'R$ 47' },
      { title: 'Bônus 02 · Comunidade do Clube', text: 'Para trocar experiências e tirar dúvidas', image: 'assets/img/clube/bonus-comunidade.webp', de: 'R$ 97' },
      { title: 'Garantia de 7 dias', text: 'Se não gostar, recebe 100% de volta' }
    ],
    cta: 'SIM! QUERO ENTRAR POR {preco}',
    payNote: 'Você vai para o pagamento seguro (Pix ou cartão). As instruções de acesso chegam por e-mail após a confirmação do pagamento.',
    trust: '🔒 Pagamento 100% seguro · 🛡️ 7 dias de garantia',
    objectionNotes: {
      comeco: '🧭 Passo a passo do zero, aula por aula',
      medo: '🛡️ Garantia de 7 dias: se não gostar, recebe 100% de volta',
      tempo: '⏳ Comece pelo celular, no seu ritmo',
      tentou: '🔁 Aulas e comunidade para tirar suas dúvidas'
    },
    guarantee: {
      image: { src: 'assets/img/quiz/garantia.webp', w: 480, h: 320, alt: 'Selo de garantia de 7 dias' },
      title: 'Garantia incondicional de 7 dias',
      text: 'Você tem <strong>7 dias</strong> para conhecer o Clube Dark Viral e decidir se ele é para você.',
      list: ['Conheça as aulas e a comunidade', 'Teste o passo a passo', 'Se não gostar, peça seu dinheiro de volta'],
      footer: 'Sem complicação e sem burocracia!',
      cta: 'COMPRAR COM GARANTIA DE 7 DIAS'
    },
    faq: [
      { q: 'Funciona para quem está começando do zero?', a: '<strong>Sim! 🚀</strong> O Clube foi pensado para iniciantes. Você aprende passo a passo a escolher um nicho, montar a página e postar seus vídeos.' },
      { q: 'Preciso aparecer ou ter muitos seguidores?', a: '<strong>Não! ✅</strong> A ideia é justamente crescer com vídeos curtos sem mostrar o rosto, começando do zero.' },
      { q: 'Posso criar uma página de cortes, como de GTA 6 ou de podcasts?', a: '<strong>Pode! ✂️</strong> Cortes são um dos formatos que mais viralizam. Você aprende a escolher o que cortar, editar pelo celular e colocar sua narração e legenda, sempre respeitando as regras de direitos autorais das plataformas.' },
      { q: 'Tenho garantia de que vou ganhar dinheiro?', a: '<strong>Não.</strong> Nenhum resultado é garantido: ele depende do nicho, da constância e de como você aplica o conteúdo. O que você tem é o passo a passo, a comunidade e 7 dias de garantia.' },
      { q: 'Quando vou receber meu acesso?', a: 'Após a confirmação do pagamento, você recebe por e-mail as instruções de acesso às aulas, à comunidade e ao bônus.' },
      { q: 'E se eu comprar e não gostar?', a: '<strong>Você tem 7 dias de garantia! 🛡️</strong> Basta solicitar o reembolso dentro do prazo para receber 100% do valor pago de volta.' }
    ]
  }
};
