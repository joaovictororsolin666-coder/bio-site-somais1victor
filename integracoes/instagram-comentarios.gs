/**
 * Resposta automática nos comentários do Instagram e, quando o Direct estiver ligado,
 * uma mensagem privada (resposta privada da API oficial) com um botão para o quiz.
 * Arquivo extra no MESMO projeto do Apps Script da planilha (Arquivo → + → Script).
 *
 * A cada minuto olha os comentários novos dos posts recentes e, quando o comentário
 * tem uma das palavras-chave ("quero"...), responde publicamente apontando para o link da bio.
 * Usa a API oficial do Instagram — grátis, sem ManyChat. Aceita os dois tipos de token:
 *  - login unificado / Facebook (token de usuário do sistema, não expira) → graph.facebook.com
 *  - login do Instagram (começa com "IG", vale 60 dias e é renovado sozinho) → graph.instagram.com
 *
 * Instalação (passo a passo completo no README.md → "Respostas automáticas no Instagram"):
 *  1. Propriedades do script → IG_TOKEN = token gerado no app da Meta.
 *  2. Rode testarInstagram() e confira o registro (mostra a conta e os posts, não responde nada).
 *  3. Rode ligarComentarios() — cria os gatilhos. Para parar: desligarComentarios().
 * Tudo que for respondido fica na aba "Respostas IG".
 */

const IG = {
  // Responde em comentários com qualquer um destes trechos (sem acento, minúsculas)
  palavras: ['quero', 'passo a passo', 'link', 'como faz', 'me manda', 'manda pra mim'],
  ignorar: ['nao quero', 'n quero'],
  minutos: 1,              // intervalo do gatilho (o Apps Script aceita 1, 5, 10, 15 ou 30)
  postsRecentes: 12,       // olha os últimos N posts/reels
  // Posts antigos que ainda recebem comentários (código do link: instagram.com/p/CODIGO/)
  postsFixos: ['DdJo0VaRsIc'],
  maxPorRodada: 6,         // respostas por rodada
  maxPorDia: 150,          // trava diária
  maxPorHora: 20,          // trava por hora (fixa: depois do bloqueio da Meta em 31/10, não sobe pelo painel)
  paginasPorPost: 4,       // até 4 × 50 comentários mais novos por post
  aba: 'Respostas IG',
  respostas: [
    'Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗',
    'Te chamei no direct mas não foi 😕 Tá tudo no link da minha bio, corre lá! 👆',
    'O direct não deixou eu te enviar 😅 mas o passo a passo completo está no link da bio do perfil!',
    'Opa! Não consegui mandar por mensagem, mas é só tocar no link da minha bio que está tudo lá 🔗',
    'Tentei te mandar no direct e não foi 😕 O passo a passo está no link da minha biografia, é só acessar!'
  ]
};

// Direct: ligado/desligado e textos ficam na propriedade IG_DM (painel /vicchat). Limites fixos e baixos.
const IG_DM_PADRAO = {
  ativo: false,
  desde: 0,                // só manda DM em posts publicados depois que o Direct foi ligado
  porRodada: 2,            // no máximo 2 DMs por minuto
  porDia: 40,              // trava diária de DMs
  texto: 'Aqui está o passo a passo que você pediu 👇 Toca no botão pra começar.',
  botao: 'Ver o passo a passo',
  link: 'https://www.ovictorgomes.com.br/quiz?utm_source=instagram&utm_medium=direct&utm_campaign=vicchat',
  // 1ª mensagem quando não dá pra saber se a pessoa segue: ela toca no botão e aí a gente confere
  abrir: 'Oi! Vi seu comentário 😊 Toca no botão aqui embaixo que eu te mando o passo a passo 👇',
  abrirBotao: 'Quero o passo a passo',
  // Quem não segue: pede para seguir e confirmar
  seguir: 'Pra eu te mandar o passo a passo, me segue aqui no perfil 🙏 Depois é só tocar em "Já segui" 👇',
  aindaNao: 'Ainda não apareceu que você me segue 😅 Segue o perfil e toca em "Já segui" de novo 👇',
  seguiBotao: 'Já segui ✅',
  tentativas: 3,           // pedidos para seguir por pessoa
  atraso: 0,               // segundos de espera antes de cada DM (0 a 60)
  respostas: [             // comentário quando a DM saiu
    'Te mandei no direct 👀 Se não aparecer, olha em Pedidos de mensagem.',
    'Chegou no seu direct! 📩 Se não achar, confere em Pedidos de mensagem.',
    'Acabei de te enviar no direct 👀 Pode estar em Pedidos de mensagem.',
    'Te chamei no direct! 📩 Se não aparecer, olha em Pedidos de mensagem.'
  ],
  falhou: [                // comentário quando a DM não pôde ser enviada para essa pessoa
    'Não consegui te mandar no direct 😕 mas o passo a passo está no link da minha bio, é só acessar por lá! 🔗',
    'Tentei te mandar no direct e não foi 😕 O passo a passo está no link da minha bio 👆',
    'O direct não deixou eu te enviar 😅 mas o passo a passo completo está no link da bio do perfil!'
  ]
};
function igDm_() {
  return Object.assign({}, IG_DM_PADRAO, JSON.parse(PropertiesService.getScriptProperties().getProperty('IG_DM') || '{}'));
}

/* ───────────── Rodada (gatilho a cada IG.minutos) ───────────── */

function responderComentarios() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('IG_ATIVO') === '0') return; // pausada pelo painel /vicchat
  const agora = new Date(); // fuso do projeto (São Paulo)
  if (agora.getHours() >= 1 && agora.getHours() < 7 && agora.getMinutes() % 5) return; // madrugada: a cada 5 min, para caber na cota diária do Google
  let token = props.getProperty('IG_TOKEN');
  if (!token) throw new Error('Falta a propriedade IG_TOKEN');
  igAplicarConfig_();
  try {
    igRodada_(props, token);
    props.setProperty('IG_ULTIMA', String(Date.now()));
    props.deleteProperty('IG_ERRO');
  } catch (e) {
    props.setProperty('IG_ERRO', new Date().toISOString() + ' ' + String(e.message || e).slice(0, 300));
    throw e;
  }
}

function igRodada_(props, token) {

  // Só responde comentários feitos depois que a automação foi ligada (nunca a fila antiga)
  const desde = new Date(Number(props.getProperty('IG_DESDE')) || Date.now());
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // rodada anterior ainda em andamento

  // Contagem de comentários de cada post na última rodada: só abre os posts em que ela mudou
  const contagens = JSON.parse(props.getProperty('IG_CONTAGENS') || '{}');
  try {
    const eu = igConta_(token);
    token = eu.token || token; // token da Página, quando houver
    try { igDmPendentes_(eu, token, props); } catch (e) { props.setProperty('IG_DM_ERRO_SEGUIR', new Date().toISOString() + ' ' + String(e.message || e).slice(0, 200)); }
    const posts = igPosts_(token).filter(function (m) { return contagens[m.id] !== m.comments_count; });
    if (!posts.length) return; // nada novo: a rodada fica em 1 ou 2 chamadas

    const log = igLog_();
    igGravarPendentes_(log, props);
    const feitos = igFeitos_(log, props);
    let hoje = feitos.hoje, hora = feitos.hora, enviadas = 0;
    const dm = igDm_();
    let dmRodada = 0;
    const porRodada = Math.min(IG.maxPorRodada, 3); // no máximo 3 por minuto, mesmo que o painel peça mais
    const cheio = function () { return enviadas >= porRodada || hoje >= IG.maxPorDia || hora >= IG.maxPorHora; };

    for (const m of posts) {
      if (cheio()) break;
      let completo = true;
      for (const c of igComentarios_(m.id, desde, token)) {
        if (cheio()) { completo = false; break; }
        const quem = (c.from && c.from.username) || c.username || '';
        if (!quem || quem === eu.username) continue;                 // comentário meu
        if (feitos.ids[c.id] || feitos.pessoas[m.id + '|' + quem]) continue; // já respondido
        if (!igTemPalavra_(c.text)) continue;
        if ((c.replies && c.replies.data || []).some(function (r) { return r.username === eu.username; })) continue; // já respondi na mão

        // Direct: só em posts publicados depois de ligar, dentro dos limites
        let direct = '';
        const postNovo = m.timestamp && new Date(m.timestamp).getTime() >= Number(dm.desde || 0);
        if (dm.ativo && postNovo) igMet_(props, 'g');
        if (dm.ativo && postNovo && dmRodada < dm.porRodada && igDmConta_(props) < dm.porDia) {
          try {
            direct = igDmPrimeira_(eu, c, quem, dm, token, props);
            dmRodada++; igDmSomar_(props);
          } catch (e) {
            direct = 'erro: ' + String(e.message || e).slice(0, 250);
            igMet_(props, 'f');
            if (igErroGeral_(e)) { igDmFalhou_(props, direct); dm.ativo = false; } // token, permissão ou bloqueio: desliga
          }
        }
        const fxT = igFxTextos_(dm);
        const lista = /^erro/.test(direct) ? fxT.falhou : direct ? fxT.respostas : IG.respostas;
        const texto = lista[Math.floor(Math.random() * lista.length)];
        let status = 'ok';
        try {
          igPost_('/' + c.id + '/replies', { message: texto }, token);
          enviadas++; hoje++; hora++;
        } catch (e) {
          status = 'erro: ' + String(e.message || e).slice(0, 300);
        }
        igGravar_(log, props, [new Date(), m.permalink, quem, clean_(c.text), texto, status, c.id, m.id, direct]);
        feitos.ids[c.id] = true; feitos.pessoas[m.id + '|' + quem] = true;
        if (status !== 'ok') return; // erro (limite, permissão…): para e tenta na próxima rodada
        Utilities.sleep(10000 + Math.random() * 15000); // pausa humana entre respostas (10 a 25 s)
      }
      if (completo) contagens[m.id] = m.comments_count; // post com sobra fica para a próxima rodada
    }
  } finally {
    props.setProperty('IG_CONTAGENS', JSON.stringify(contagens));
    lock.releaseLock();
  }
}

/* ───────────── Instalação ───────────── */

// Mostra no registro a conta, os últimos posts e alguns comentários. Não responde nada.
function testarInstagram() {
  let token = PropertiesService.getScriptProperties().getProperty('IG_TOKEN');
  if (!token) throw new Error('Falta a propriedade IG_TOKEN');
  PropertiesService.getScriptProperties().deleteProperty('IG_CONTA'); // procura a conta de novo
  igAplicarConfig_();
  const eu = igConta_(token);
  token = eu.token || token;
  Logger.log('Conta: @' + eu.username + ' (id ' + eu.id + ', ' + eu.base + (eu.token ? ', via token da Página' : '') + ')');
  const media = igGet_('/' + eu.id + '/media', { fields: 'id,permalink,timestamp,comments_count', limit: 5 }, token).data || [];
  media.forEach(function (m) {
    Logger.log(m.timestamp + '  ' + m.permalink + '  (' + m.comments_count + ' comentários)');
  });
  igPosts_(token).slice(IG.postsRecentes).forEach(function (m) { Logger.log('Fixo: ' + m.permalink); });
  if (media[0]) {
    const cs = igGet_('/' + media[0].id + '/comments', { fields: 'id,text,timestamp,username', limit: 5 }, token).data || [];
    cs.forEach(function (c) { Logger.log('   ' + c.timestamp + ' @' + c.username + ': ' + c.text); });
    if (cs.length > 1) Logger.log(new Date(cs[0].timestamp) >= new Date(cs[cs.length - 1].timestamp) ? 'Ordem: mais novos primeiro ✓' : 'ATENÇÃO: comentários vêm do mais antigo para o mais novo');
  }
}

function ligarComentarios() {
  desligarComentarios();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('IG_DESDE', String(Date.now()));
  props.setProperty('IG_TOKEN_EM', String(Date.now()));
  props.setProperty('IG_ATIVO', '1');
  ScriptApp.newTrigger('responderComentarios').timeBased().everyMinutes(IG.minutos).create();
  ScriptApp.newTrigger('renovarTokenInstagram').timeBased().everyDays(1).create();
  igLog_();
  Logger.log('Ligado. Respondendo comentários feitos a partir de agora.');
}

function desligarComentarios() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['responderComentarios', 'renovarTokenInstagram'].indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
}

// Token do login do Instagram vale 60 dias: renova sozinho a cada 7 dias
function renovarTokenInstagram() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('IG_TOKEN');
  if (!token || !/^IG/.test(token)) return; // token de usuário do sistema não expira
  if (Date.now() - Number(props.getProperty('IG_TOKEN_EM') || 0) < 7 * 86400000) return;
  const r = igGet_('https://graph.instagram.com/refresh_access_token', { grant_type: 'ig_refresh_token' }, token);
  if (r.access_token) {
    props.setProperty('IG_TOKEN', r.access_token);
    props.setProperty('IG_TOKEN_EM', String(Date.now()));
  }
}

/* ───────────── Painel /vicchat (ações vicchat, vicchat_ativar, vicchat_config) ───────────── */

// Palavras, textos e limites editados no painel ficam em IG_CONFIG e sobrepõem os valores do topo
function igAplicarConfig_() {
  Object.assign(IG, JSON.parse(PropertiesService.getScriptProperties().getProperty('IG_CONFIG') || '{}'));
}

function vicchat_(p) {
  const negado = checkSenha_(p);
  if (negado) return negado;
  const props = PropertiesService.getScriptProperties();
  igAplicarConfig_();

  if (p.action === 'vicchat_ativar') {
    const ligar = p.ativo === '1';
    props.setProperty('IG_ATIVO', ligar ? '1' : '0');
    if (ligar) props.setProperty('IG_DESDE', String(Date.now())); // ao religar, não responde o que chegou pausado
  } else if (p.action === 'vicchat_fluxo') {
    try { igFxSalvar_(JSON.parse(p.fluxo || '{}')); }
    catch (e) { return json_({ ok: false, error: String(e.message || e) === 'fluxo_sem_gatilho' ? 'fluxo_sem_gatilho' : 'fluxo_invalido' }); }
  } else if (p.action === 'vicchat_dm') {
    const dm = igDm_();
    if (p.ativo === '1' && !dm.ativo) { dm.desde = Date.now(); props.deleteProperty('IG_DM_ERRO'); }
    if (p.ativo === '1' || p.ativo === '0') dm.ativo = p.ativo === '1';
    if (p.config) {
      let c;
      try { c = JSON.parse(p.config); } catch (e) { return json_({ ok: false, error: 'config_invalida' }); }
      const txt = function (k, max) { if (typeof c[k] === 'string' && c[k].trim()) dm[k] = c[k].trim().slice(0, max); };
      ['texto', 'abrir', 'seguir', 'aindaNao'].forEach(function (k) { txt(k, 600); });
      ['botao', 'abrirBotao', 'seguiBotao'].forEach(function (k) { txt(k, 20); });
      if (/^https:\/\//.test(c.link || '')) dm.link = String(c.link).trim().slice(0, 400);
      if (c.tentativas != null) dm.tentativas = Math.max(1, Math.min(5, parseInt(c.tentativas, 10) || 3));
      if (c.atraso != null) dm.atraso = Math.max(0, Math.min(60, parseInt(c.atraso, 10) || 0));
      ['respostas', 'falhou'].forEach(function (k) {
        if (!Array.isArray(c[k])) return;
        const l = c[k].map(function (x) { return String(x).trim().slice(0, 300); }).filter(Boolean).slice(0, 10);
        if (l.length) dm[k] = l;
      });
    }
    const salvar = {};
    ['ativo', 'desde', 'texto', 'botao', 'link', 'abrir', 'abrirBotao', 'seguir', 'aindaNao', 'seguiBotao', 'tentativas', 'atraso', 'respostas', 'falhou']
      .forEach(function (k) { salvar[k] = dm[k]; });
    props.setProperty('IG_DM', JSON.stringify(salvar));
  } else if (p.action === 'vicchat_config') {
    let c;
    try { c = JSON.parse(p.config || '{}'); } catch (e) { return json_({ ok: false, error: 'config_invalida' }); }
    const lista = function (v, max, len) {
      return (Array.isArray(v) ? v : []).map(function (s) { return String(s).trim().slice(0, len); }).filter(Boolean).slice(0, max);
    };
    const norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    const num = function (v, min, max, def) { v = parseInt(v, 10); return isNaN(v) ? def : Math.max(min, Math.min(max, v)); };
    const novo = {
      palavras: lista(c.palavras, 40, 60).map(norm),
      ignorar: lista(c.ignorar, 40, 60).map(norm),
      respostas: lista(c.respostas, 20, 300),
      postsFixos: lista(c.postsFixos, 20, 200).map(function (s) {
        const m = s.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
        return m ? m[1] : s.replace(/[^A-Za-z0-9_-]/g, '');
      }).filter(Boolean),
      maxPorRodada: num(c.maxPorRodada, 1, 20, 6),
      maxPorDia: num(c.maxPorDia, 1, 500, 150)
    };
    if (!novo.palavras.length || !novo.respostas.length) return json_({ ok: false, error: 'config_invalida' });
    props.setProperty('IG_CONFIG', JSON.stringify(novo));
    igAplicarConfig_();
  }
  return json_(igResumo_(props, Math.max(1, Math.min(30, parseInt(p.dias, 10) || 7))));
}

function igResumo_(props, dias) {
  dias = dias || 7;
  const gatilho = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'responderComentarios'; });
  const conta = JSON.parse(props.getProperty('IG_CONTA') || '{}');
  const agora = new Date(), hoje = agora.toDateString(), semana = agora.getTime() - 7 * 86400000;
  const porDia = {}, ultimas = [];
  let total = 0, hojeOk = 0, semanaOk = 0, erros = 0, dmTotal = 0;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IG.aba);
  if (sheet && sheet.getLastRow() > 1) {
    const n = Math.min(sheet.getLastRow() - 1, 5000);
    const rows = sheet.getRange(sheet.getLastRow() - n + 1, 1, n, 9).getValues();
    rows.forEach(function (v) {
      const d = v[0] instanceof Date ? v[0] : new Date(v[0]);
      if (isNaN(d)) return;
      if (v[8] && !/^erro/.test(v[8])) dmTotal++;
      if (v[5] !== 'ok') { if (d.getTime() >= semana) erros++; return; }
      total++;
      if (d.toDateString() === hoje) hojeOk++;
      if (d.getTime() >= semana) semanaOk++;
      const dia = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      porDia[dia] = (porDia[dia] || 0) + 1;
    });
    rows.slice(-60).reverse().forEach(function (v) {
      ultimas.push({ data: v[0] instanceof Date ? v[0].toISOString() : String(v[0]), post: String(v[1]), usuario: String(v[2]), comentario: String(v[3]), resposta: String(v[4]), status: String(v[5]), direct: String(v[8] || '') });
    });
  }

  return {
    ok: true,
    ativo: gatilho && props.getProperty('IG_ATIVO') !== '0',
    gatilho: gatilho,
    conta: conta.username || '',
    ultimaRodada: Number(props.getProperty('IG_ULTIMA')) || null,
    erro: props.getProperty('IG_ERRO') || '',
    config: { palavras: IG.palavras, ignorar: IG.ignorar, respostas: IG.respostas, postsFixos: IG.postsFixos, maxPorRodada: IG.maxPorRodada, maxPorDia: IG.maxPorDia, postsRecentes: IG.postsRecentes, minutos: IG.minutos },
    stats: { total: total, hoje: hojeOk, semana: semanaOk, erros: erros, porDia: porDia },
    dm: (function () {
      const dm = igDm_();
      let cliques = {};
      try { cliques = igCliques_(dias); } catch (e) { /* aba Quiz indisponível */ }
      return { ativo: !!dm.ativo, texto: dm.texto, botao: dm.botao, link: dm.link, abrir: dm.abrir, abrirBotao: dm.abrirBotao,
        seguir: dm.seguir, aindaNao: dm.aindaNao, seguiBotao: dm.seguiBotao, tentativas: dm.tentativas, atraso: dm.atraso,
        respostas: dm.respostas, falhou: dm.falhou, porDia: dm.porDia, porRodada: dm.porRodada,
        hoje: igDmConta_(props), total: dmTotal, dias: dias, met: igMetSoma_(props, dias), cliques: cliques,
        fluxo: igFluxo_(), fxMet: igFxMetSoma_(props, dias),
        esperando: Object.keys(igPendentes_(props)).length, ultimos: JSON.parse(props.getProperty('IG_DM_ULT') || '[]').slice(0, 10),
        erro: props.getProperty('IG_DM_ERRO') || '' };
    })(),
    ultimas: ultimas
  };
}

/* ───────────── Direct (resposta privada) ───────────── */

function igMe_(eu, coisa) {
  return (eu.token || /graph\.instagram\.com/.test(eu.base)) ? '/me/' + coisa : '/' + eu.id + '/' + coisa;
}

// recipient: { comment_id } (resposta privada, 1 por comentário em até 7 dias) ou { id } (conversa aberta)
function igMandar_(eu, recipient, msg, token) {
  return igPost_(igMe_(eu, 'messages'), { recipient: JSON.stringify(recipient), message: JSON.stringify(msg) }, token);
}
function igMsgLink_(dm, etapa) {
  const url = dm.link + (dm.link.indexOf('?') > -1 ? '&' : '?') + 'utm_content=' + (etapa || 'link_direto');
  return { attachment: { type: 'template', payload: { template_type: 'button', text: dm.texto,
    buttons: [{ type: 'web_url', url: url, title: dm.botao }] } } };
}
function igEsperar_(dm) {
  const seg = Math.max(0, Math.min(60, Number(dm.atraso) || 0));
  if (seg) Utilities.sleep(seg * 1000);
}

// Métricas do Direct por dia (propriedade IG_DM_MET, guarda 35 dias)
// g = comentários que dispararam, l = link direto, s = pediu seguir, a = botão de abrir,
// t = responderam no Direct, ls = link depois de seguir, n = "ainda não segue", f = DM falhou
function igMet_(props, chave) {
  const met = JSON.parse(props.getProperty('IG_DM_MET') || '{}');
  const dia = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  met[dia] = met[dia] || {};
  met[dia][chave] = (met[dia][chave] || 0) + 1;
  const dias = Object.keys(met).sort().slice(-35);
  const novo = {}; dias.forEach(function (d) { novo[d] = met[d]; });
  props.setProperty('IG_DM_MET', JSON.stringify(novo));
}
function igMetSoma_(props, dias) {
  const met = JSON.parse(props.getProperty('IG_DM_MET') || '{}');
  const desde = Utilities.formatDate(new Date(Date.now() - (dias - 1) * 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const soma = {};
  Object.keys(met).forEach(function (d) {
    if (d < desde) return;
    Object.keys(met[d]).forEach(function (k) { soma[k] = (soma[k] || 0) + met[d][k]; });
  });
  return soma;
}
// Cliques no link do Direct: visitas do quiz com utm_medium=direct, separadas por utm_content
function igCliques_(dias) {
  const out = {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUIZ_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return out;
  const n = Math.min(sheet.getLastRow() - 1, 4000);
  const col = function (k) { return QUIZ_COLUMNS.indexOf(k); };
  const desde = Date.now() - dias * 86400000;
  sheet.getRange(sheet.getLastRow() - n + 1, 1, n, QUIZ_COLUMNS.length).getValues().forEach(function (v) {
    if (String(v[col('utm_medium')]) !== 'direct' || String(v[col('utm_campaign')]) !== 'vicchat') return;
    const d = v[col('inicio')] instanceof Date ? v[col('inicio')] : new Date(v[col('inicio')]);
    if (isNaN(d) || d.getTime() < desde) return;
    const k = String(v[col('utm_content')] || 'link_direto');
    out[k] = out[k] || { visitas: 0, quiz: 0, checkout: 0 };
    out[k].visitas++;
    if (Number(v[col('etapa_max')]) >= 1) out[k].quiz++;
    if (String(v[col('checkout')] || '')) out[k].checkout++;
  });
  return out;
}
function igMsgBotao_(texto, botao, payload) {
  return { text: texto, quick_replies: [{ content_type: 'text', title: botao, payload: payload }] };
}

// Segue o perfil? true / false / null (a API só responde depois que a pessoa fala com o perfil)
function igSegue_(igsid, token) {
  try {
    const r = igGet_('/' + igsid, { fields: 'is_user_follow_business' }, token);
    return typeof r.is_user_follow_business === 'boolean' ? r.is_user_follow_business : null;
  } catch (e) { return null; }
}


// Pessoas esperando o link: { igsid: { u, t, n } } (some depois de 24 h ou de receber o link)
function igPendentes_(props) {
  const lista = JSON.parse(props.getProperty('IG_DM_PEND') || '{}');
  const limite = Date.now() - 24 * 3600000;
  Object.keys(lista).forEach(function (k) { if (lista[k].t < limite) delete lista[k]; });
  return lista;
}
function igPendente_(props, igsid, dados) {
  const lista = igPendentes_(props);
  if (dados) lista[igsid] = dados; else delete lista[igsid];
  const chaves = Object.keys(lista).sort(function (a, b) { return lista[b].t - lista[a].t; }).slice(0, 50);
  const novo = {}; chaves.forEach(function (k) { novo[k] = lista[k]; });
  props.setProperty('IG_DM_PEND', JSON.stringify(novo));
}


// Contador de DMs do dia (1ª mensagem + mensagens de seguir/link)
function igDmConta_(props) {
  const c = JSON.parse(props.getProperty('IG_DM_CONT') || '{}');
  return c.d === new Date().toDateString() ? c.n : 0;
}
function igDmSomar_(props) {
  props.setProperty('IG_DM_CONT', JSON.stringify({ d: new Date().toDateString(), n: igDmConta_(props) + 1 }));
}
// Últimos acontecimentos do Direct (aparecem no painel)
function igDmRegistrar_(props, quem, oque) {
  const ult = JSON.parse(props.getProperty('IG_DM_ULT') || '[]');
  ult.unshift({ d: new Date().toISOString(), u: quem, o: oque });
  props.setProperty('IG_DM_ULT', JSON.stringify(ult.slice(0, 30)));
}

// Erro que vale para todo mundo (token, permissão, limite, bloqueio) × erro só daquela pessoa
function igErroGeral_(e) {
  const c = Number(e.code || 0);
  return c === 190 || c === 10 || (c >= 200 && c < 300) || c === 4 || c === 17 || c === 32 || c === 613 || c === 368 || c === 3;
}

function igDmFalhou_(props, erro) {
  const dm = JSON.parse(props.getProperty('IG_DM') || '{}');
  dm.ativo = false;
  props.setProperty('IG_DM', JSON.stringify(dm));
  props.setProperty('IG_DM_ERRO', new Date().toISOString() + ' ' + erro);
}

// Teste manual: coloque o id de um comentário na propriedade IG_DM_TESTE e rode esta função
function testarDirect() {
  const props = PropertiesService.getScriptProperties();
  const commentId = props.getProperty('IG_DM_TESTE');
  if (!commentId) throw new Error('Coloque o id do comentário na propriedade IG_DM_TESTE');
  let token = props.getProperty('IG_TOKEN');
  const eu = igConta_(token);
  token = eu.token || token;
  Logger.log(JSON.stringify(igMandar_(eu, { comment_id: commentId }, igMsgLink_(igDm_(), 'teste'), token)));
}

/* ───────────── Motor do fluxo do Direct (editor /vicchat → aba "Fluxo IG") ─────────────
 * O fluxo é um grafo: { nos: [{ id, tipo, x, y, ... }], ligas: [{ de, saida, para }] }
 * Tipos: gatilho (saída prox) · atraso { seg } (prox) · segue (sim / nao / talvez)
 *        mensagem { texto, botao: 'nenhum'|'link'|'respostas', link: { titulo, url }, respostas: [títulos] }
 *          (com respostas: uma saída por botão b0, b1, b2; sem: prox) · espera (prox, quando a pessoa responder)
 * Regra do Instagram: a 1ª mensagem vai como resposta privada ao comentário (só uma). As próximas só
 * depois que a pessoa responder no Direct; aí a conversa fica aberta por 24 h.
 */

const IG_FX_ABA = 'Fluxo IG';
const IG_FX_TIPOS = ['gatilho', 'atraso', 'segue', 'mensagem', 'espera'];

function igFxPadrao_() {
  const dm = igDm_();
  return {
    nos: [
      { id: 'g', tipo: 'gatilho', x: 40, y: 220, respostas: dm.respostas, falhou: dm.falhou },
      { id: 'a', tipo: 'atraso', x: 340, y: 250, seg: 3 },
      { id: 'm1', tipo: 'mensagem', x: 660, y: 200, texto: 'Opa! Agora é só você clicar no botão abaixo pra receber o material completo ↓', botao: 'respostas', respostas: ['Quero receber ✅'], links: [] },
      { id: 's1', tipo: 'segue', x: 1000, y: 230 },
      { id: 'm2', tipo: 'mensagem', x: 1320, y: 360, texto: 'Mas antes, entra no meu perfil e me segue pra você não perder os próximos conteúdos...', botao: 'respostas', respostas: ['Seguindo'], links: [] },
      { id: 's2', tipo: 'segue', x: 1660, y: 380 },
      { id: 'm4', tipo: 'mensagem', x: 2000, y: 560, texto: 'Ainda não apareceu que você me segue 😅 Segue o perfil e toca em "Seguindo" de novo ↓', botao: 'respostas', respostas: ['Seguindo'], links: [] },
      { id: 'm3', tipo: 'mensagem', x: 2000, y: 60, texto: 'Pronto! Aqui estão os links ↓\n\n🎬 Editar com IA: seus vídeos cortados, legendados e animados sozinhos, sem você editar nada.\n\n💰 Renda sem aparecer: venda produto digital ou monte um perfil de cortes ou dark, sem mostrar o rosto.',
        botao: 'link', respostas: [], links: [{ titulo: '🎬 EDITAR COM IA', url: 'https://www.ovictorgomes.com.br/editflow?utm_source=instagram&utm_medium=direct&utm_campaign=vicchat' }, { titulo: '💰 SEM APARECER', url: 'https://www.ovictorgomes.com.br/quiz?utm_source=instagram&utm_medium=direct&utm_campaign=vicchat' }] }
    ],
    ligas: [
      { de: 'g', saida: 'prox', para: 'a' }, { de: 'a', saida: 'prox', para: 'm1' }, { de: 'm1', saida: 'b0', para: 's1' },
      { de: 's1', saida: 'sim', para: 'm3' }, { de: 's1', saida: 'nao', para: 'm2' }, { de: 's1', saida: 'talvez', para: 'm2' },
      { de: 'm2', saida: 'b0', para: 's2' },
      { de: 's2', saida: 'sim', para: 'm3' }, { de: 's2', saida: 'talvez', para: 'm3' }, { de: 's2', saida: 'nao', para: 'm4' },
      { de: 'm4', saida: 'b0', para: 's2' }
    ]
  };
}

// Fluxo salvo (lido uma vez por execução)
let IG_FX_CACHE = null;
function igFluxo_() {
  if (IG_FX_CACHE) return IG_FX_CACHE;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IG_FX_ABA);
  const txt = sh ? String(sh.getRange(2, 1).getValue() || '') : '';
  try { IG_FX_CACHE = txt ? JSON.parse(txt) : igFxPadrao_(); } catch (e) { IG_FX_CACHE = igFxPadrao_(); }
  return IG_FX_CACHE;
}

// Valida e limpa o fluxo vindo do editor
function igFxLimpar_(f) {
  if (!f || !Array.isArray(f.nos) || !Array.isArray(f.ligas)) throw new Error('fluxo_invalido');
  const txt = function (v, max) { return String(v == null ? '' : v).trim().slice(0, max); };
  const num = function (v, a, b) { v = parseInt(v, 10); return isNaN(v) ? a : Math.max(a, Math.min(b, v)); };
  const ids = {};
  const nos = f.nos.slice(0, 40).filter(function (n) { return n && IG_FX_TIPOS.indexOf(n.tipo) > -1 && /^[A-Za-z0-9_-]{1,20}$/.test(n.id) && !ids[n.id] && (ids[n.id] = true); })
    .map(function (n) {
      const o = { id: n.id, tipo: n.tipo, x: num(n.x, -2000, 6000), y: num(n.y, -2000, 6000) };
      if (n.tipo === 'atraso') o.seg = num(n.seg, 0, 60);
      if (n.tipo === 'gatilho') {
        o.respostas = (n.respostas || []).map(function (s) { return txt(s, 300); }).filter(Boolean).slice(0, 10);
        o.falhou = (n.falhou || []).map(function (s) { return txt(s, 300); }).filter(Boolean).slice(0, 10);
      }
      if (n.tipo === 'mensagem') {
        o.texto = txt(n.texto, 900) || '…';
        o.botao = ['nenhum', 'link', 'respostas'].indexOf(n.botao) > -1 ? n.botao : 'nenhum';
        const brutos = Array.isArray(n.links) && n.links.length ? n.links : (n.link ? [n.link] : []);
        o.links = brutos.map(function (l) { return { titulo: txt(l && l.titulo, 20) || 'Abrir', url: txt(l && l.url, 400) }; })
          .filter(function (l) { return /^https:\/\//.test(l.url); }).slice(0, 3);
        o.respostas = (n.respostas || []).map(function (s) { return txt(s, 20); }).filter(Boolean).slice(0, 3);
        if (o.botao === 'link' && !o.links.length) o.botao = 'nenhum';
        if (o.botao === 'respostas' && !o.respostas.length) o.botao = 'nenhum';
      }
      return o;
    });
  if (nos.filter(function (n) { return n.tipo === 'gatilho'; }).length !== 1) throw new Error('fluxo_sem_gatilho');
  const vistos = {};
  const ligas = f.ligas.slice(0, 120).filter(function (l) {
    if (!l || !ids[l.de] || !ids[l.para]) return false;
    const k = l.de + '|' + l.saida;
    if (vistos[k] || !/^(prox|sim|nao|talvez|b[0-2])$/.test(l.saida)) return false;
    return (vistos[k] = true);
  }).map(function (l) { return { de: l.de, saida: l.saida, para: l.para }; });
  return { nos: nos, ligas: ligas };
}

function igFxSalvar_(f) {
  const limpo = igFxLimpar_(f);
  const sh = getSheet_(IG_FX_ABA, ['fluxo (editado pelo /vicchat)']);
  sh.getRange(2, 1).setValue(JSON.stringify(limpo));
  IG_FX_CACHE = limpo;
  return limpo;
}

function igFxNo_(f, id) { return f.nos.filter(function (n) { return n.id === id; })[0]; }
function igFxProx_(f, id, saida) {
  const l = f.ligas.filter(function (x) { return x.de === id && x.saida === saida; })[0];
  return l ? l.para : '';
}
// Textos da resposta pública no comentário (ficam no bloco gatilho)
function igFxTextos_(dm) {
  const g = igFluxo_().nos.filter(function (n) { return n.tipo === 'gatilho'; })[0] || {};
  return { respostas: (g.respostas && g.respostas.length) ? g.respostas : dm.respostas, falhou: (g.falhou && g.falhou.length) ? g.falhou : dm.falhou };
}

// Métricas por bloco e dia: IG_FX_MET = { 'yyyy-MM-dd': { idDoBloco: { p: passou, e: enviou, r: respondeu, f: falhou } } }
function igFxMet_(props, no, chave) {
  const met = JSON.parse(props.getProperty('IG_FX_MET') || '{}');
  const dia = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  met[dia] = met[dia] || {};
  met[dia][no] = met[dia][no] || {};
  met[dia][no][chave] = (met[dia][no][chave] || 0) + 1;
  const dias = Object.keys(met).sort().slice(-31);
  const novo = {}; dias.forEach(function (d) { novo[d] = met[d]; });
  props.setProperty('IG_FX_MET', JSON.stringify(novo));
}
function igFxMetSoma_(props, dias) {
  const met = JSON.parse(props.getProperty('IG_FX_MET') || '{}');
  const desde = Utilities.formatDate(new Date(Date.now() - (dias - 1) * 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const soma = {};
  Object.keys(met).forEach(function (d) {
    if (d < desde) return;
    Object.keys(met[d]).forEach(function (no) {
      soma[no] = soma[no] || {};
      Object.keys(met[d][no]).forEach(function (k) { soma[no][k] = (soma[no][k] || 0) + met[d][no][k]; });
    });
  });
  return soma;
}

function igFxMsg_(no) {
  const links = (no.links && no.links.length) ? no.links : (no.link && no.link.url ? [no.link] : []);
  if (no.botao === 'link' && links.length) {
    return { attachment: { type: 'template', payload: { template_type: 'button', text: no.texto.slice(0, 640),
      buttons: links.map(function (l, i) {
        return { type: 'web_url', url: l.url + (l.url.indexOf('?') > -1 ? '&' : '?') + 'utm_content=fx_' + no.id + '_' + i, title: l.titulo };
      }) } } };
  }
  if (no.botao === 'respostas' && no.respostas.length) {
    return { text: no.texto, quick_replies: no.respostas.map(function (t, i) { return { content_type: 'text', title: t, payload: 'B' + i }; }) };
  }
  return { text: no.texto };
}

// Anda pelo fluxo a partir de `inicio` até precisar esperar a pessoa ou acabar.
// ctx: { eu, token, props, f, igsid, quem, comentario (id, só na 1ª), aberta (conversa aberta), v (visitas por bloco) }
// Devolve 'enviado' se mandou alguma DM, '' se não mandou nada. Erros sobem (quem chama decide).
function igFxRodar_(ctx, inicio) {
  let id = inicio, mandou = false;
  for (let passo = 0; passo < 15 && id; passo++) {
    const no = igFxNo_(ctx.f, id);
    if (!no) break;
    ctx.v[id] = (ctx.v[id] || 0) + 1;
    if (ctx.v[id] > 3) break; // evita voltas infinitas (ex.: "ainda não segue" no máximo 3 vezes)
    igFxMet_(ctx.props, id, 'p');
    if (no.tipo === 'gatilho') { id = igFxProx_(ctx.f, id, 'prox'); continue; }
    if (no.tipo === 'atraso') { if (no.seg) Utilities.sleep(Math.min(60, no.seg) * 1000); id = igFxProx_(ctx.f, id, 'prox'); continue; }
    if (no.tipo === 'segue') {
      const s = ctx.igsid ? igSegue_(ctx.igsid, ctx.token) : null;
      id = igFxProx_(ctx.f, id, s === true ? 'sim' : s === false ? 'nao' : 'talvez');
      continue;
    }
    if (no.tipo === 'espera') { igFxEsperar_(ctx, id, 'prox'); return mandou ? 'enviado' : ''; }
    // mensagem
    if (!ctx.comentario && !ctx.aberta) { igFxEsperar_(ctx, id, 'antes'); return mandou ? 'enviado' : ''; } // só depois que a pessoa responder
    if (igDmConta_(ctx.props) >= igDm_().porDia) { igFxEsperar_(ctx, id, 'antes'); return mandou ? 'enviado' : ''; }
    const rec = ctx.comentario ? { comment_id: ctx.comentario } : { id: ctx.igsid };
    let r;
    try { r = igMandar_(ctx.eu, rec, igFxMsg_(no), ctx.token); }
    catch (e) { igFxMet_(ctx.props, id, 'f'); throw e; }
    igFxMet_(ctx.props, id, 'e'); igDmSomar_(ctx.props); mandou = true;
    igDmRegistrar_(ctx.props, ctx.quem, 'recebeu "' + no.texto.slice(0, 40) + '"');
    if (ctx.comentario) { ctx.igsid = r.recipient_id || ctx.igsid; ctx.comentario = ''; }
    if (no.botao === 'respostas' && no.respostas.length) { igFxEsperar_(ctx, id, 'resp'); return 'enviado'; }
    id = igFxProx_(ctx.f, id, 'prox');
  }
  if (ctx.igsid) igPendente_(ctx.props, ctx.igsid, null); // acabou o fluxo
  return mandou ? 'enviado' : '';
}

function igFxEsperar_(ctx, no, modo) {
  if (!ctx.igsid) return;
  igPendente_(ctx.props, ctx.igsid, { u: ctx.quem, t: Date.now(), no: no, m: modo, v: ctx.v });
}

// 1ª DM a partir do comentário (chamada pela rodada)
function igDmPrimeira_(eu, c, quem, dm, token, props) {
  const ctx = { eu: eu, token: token, props: props, f: igFluxo_(), igsid: c.from && c.from.id, quem: quem, comentario: c.id, aberta: false, v: {} };
  const g = ctx.f.nos.filter(function (n) { return n.tipo === 'gatilho'; })[0];
  return igFxRodar_(ctx, g.id);
}

// A cada rodada: quem respondeu no Direct continua o fluxo de onde parou
function igDmPendentes_(eu, token, props) {
  const dm = igDm_();
  if (!dm.ativo) return;
  const f = igFluxo_();
  const lista = igPendentes_(props);
  const ids = Object.keys(lista).slice(0, 10);
  for (const igsid of ids) {
    if (igDmConta_(props) >= dm.porDia) return;
    const p = lista[igsid];
    if (!p.no) { igPendente_(props, igsid, null); continue; } // formato antigo
    const conv = igGet_(igMe_(eu, 'conversations'), { platform: 'instagram', user_id: igsid,
      fields: 'messages.limit(5){from,created_time,message}' }, token).data || [];
    const msgs = ((conv[0] && conv[0].messages && conv[0].messages.data) || []).filter(function (m) {
      return m.from && m.from.id === igsid && new Date(m.created_time).getTime() > p.t;
    });
    if (!msgs.length) continue;
    igMet_(props, 't');
    igFxMet_(props, p.no, 'r');
    const no = igFxNo_(f, p.no);
    let inicio = '';
    if (no && p.m === 'antes') inicio = no.id;
    else if (no && p.m === 'resp') {
      const resp = String(msgs[0].message || '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim();
      let i = no.respostas.findIndex(function (b) { return b.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim() === resp; });
      if (i < 0) i = 0;
      inicio = igFxProx_(f, no.id, 'b' + i);
    } else if (no) inicio = igFxProx_(f, no.id, 'prox');
    const ctx = { eu: eu, token: token, props: props, f: f, igsid: igsid, quem: p.u, comentario: '', aberta: true, v: p.v || {} };
    igPendente_(props, igsid, null);
    try {
      if (inicio) igFxRodar_(ctx, inicio);
    } catch (e) {
      if (igErroGeral_(e)) { igDmFalhou_(props, 'erro: ' + String(e.message || e).slice(0, 250)); return; }
    }
    Utilities.sleep(2000 + Math.random() * 3000);
  }
}

/* ───────────── Apoio ───────────── */

// Comentários mais novos do post, só os feitos depois de `desde`
function igComentarios_(mediaId, desde, token) {
  const out = [];
  let params = { fields: 'id,text,timestamp,username,from,replies{username}', limit: 50 };
  for (let p = 0; p < IG.paginasPorPost; p++) {
    const r = igGet_('/' + mediaId + '/comments', params, token);
    const lista = r.data || [];
    let antigos = 0;
    lista.forEach(function (c) { if (new Date(c.timestamp) > desde) out.push(c); else antigos++; });
    // A API devolve do mais novo para o mais antigo: página com comentário antigo = acabou o que é novo
    if (antigos || !r.paging || !r.paging.cursors || !r.paging.next) break;
    params = Object.assign({}, params, { after: r.paging.cursors.after });
  }
  return out.reverse(); // responde na ordem em que comentaram
}

// Palavras curtas (até 3 letras, como "ia" ou "clt") só valem inteiras: "bom dia" não dispara "ia"
function igTemPalavra_(texto) {
  const t = String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const tem = function (p) {
    if (p.length > 3) return t.indexOf(p) > -1;
    return new RegExp('(^|[^a-z0-9])' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(t);
  };
  if (IG.ignorar.some(tem)) return false;
  return IG.palavras.some(tem);
}

function igLog_() {
  const sheet = getSheet_(IG.aba, ['Data', 'Post', 'Usuário', 'Comentário', 'Resposta', 'Status', 'comment_id', 'media_id', 'Direct']);
  if (!sheet.getRange(1, 9).getValue()) sheet.getRange(1, 9).setValue('Direct').setFontWeight('bold');
  return sheet;
}

// A planilha às vezes recusa a escrita ("You do not have permission…") logo depois da resposta já
// ter sido postada: tenta de novo e, se não der, guarda a linha em IG_PENDENTES para a próxima rodada
function igGravar_(log, props, linha) {
  for (let i = 0; i < 3; i++) {
    try {
      log.getRange(log.getLastRow() + 1, 1, 1, linha.length).setValues([linha]);
      return;
    } catch (e) {
      Utilities.sleep(1500 * (i + 1));
    }
  }
  const fila = JSON.parse(props.getProperty('IG_PENDENTES') || '[]');
  fila.push([linha[0].toISOString()].concat(linha.slice(1)));
  props.setProperty('IG_PENDENTES', JSON.stringify(fila.slice(-100)));
}

function igGravarPendentes_(log, props) {
  const fila = JSON.parse(props.getProperty('IG_PENDENTES') || '[]');
  if (!fila.length) return;
  try {
    const linhas = fila.map(function (v) { return [new Date(v[0])].concat(v.slice(1)); });
    log.getRange(log.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);
    props.deleteProperty('IG_PENDENTES');
  } catch (e) { /* fica para a próxima rodada */ }
}

function igFeitos_(sheet, props) {
  const ids = {}, pessoas = {};
  let hoje = 0, hora = 0, dmHoje = 0;
  const dia = new Date().toDateString(), umaHora = Date.now() - 3600000;
  const marcar = function (v) {
    ids[v[6]] = true;
    pessoas[v[7] + '|' + v[2]] = true;
    if (v[5] === 'ok' && new Date(v[0]).toDateString() === dia) hoje++;
    if (v[5] === 'ok' && new Date(v[0]).getTime() >= umaHora) hora++;
    if (v[8] === 'enviado' && new Date(v[0]).toDateString() === dia) dmHoje++;
  };
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues().forEach(marcar);
  JSON.parse(props.getProperty('IG_PENDENTES') || '[]').forEach(marcar); // ainda não foram para a planilha
  return { ids: ids, pessoas: pessoas, hoje: hoje, hora: hora, dmHoje: dmHoje };
}

// Rode uma vez: procura nos posts as respostas da automação que não chegaram na planilha e grava
function recuperarRespostas() {
  const props = PropertiesService.getScriptProperties();
  igAplicarConfig_();
  let token = props.getProperty('IG_TOKEN');
  const eu = igConta_(token);
  token = eu.token || token;
  const log = igLog_();
  const feitos = igFeitos_(log, props);
  const desde = new Date(Date.now() - 7 * 86400000);
  const linhas = [];
  igPosts_(token).forEach(function (m) {
    let params = { fields: 'id,text,timestamp,username,replies{username,text,timestamp}', limit: 50 };
    for (let p = 0; p < 6; p++) {
      const r = igGet_('/' + m.id + '/comments', params, token);
      let antigos = 0;
      (r.data || []).forEach(function (c) {
        if (new Date(c.timestamp) < desde) { antigos++; return; }
        if (feitos.ids[c.id]) return;
        const minha = ((c.replies && c.replies.data) || []).filter(function (x) {
          return x.username === eu.username && IG.respostas.indexOf(x.text) > -1;
        })[0];
        if (minha) linhas.push([new Date(minha.timestamp), m.permalink, c.username, clean_(c.text), minha.text, 'ok', c.id, m.id]);
      });
      if (antigos || !r.paging || !r.paging.next) break;
      params = Object.assign({}, params, { after: r.paging.cursors.after });
    }
  });
  linhas.sort(function (a, b) { return a[0] - b[0]; });
  if (linhas.length) log.getRange(log.getLastRow() + 1, 1, linhas.length, 8).setValues(linhas);
  Logger.log('Recuperadas ' + linhas.length + ' respostas.');
}

// Últimos posts + posts fixos (o id dos fixos é procurado uma vez e guardado)
function igPosts_(token) {
  const props = PropertiesService.getScriptProperties();
  const cache = JSON.parse(props.getProperty('IG_FIXOS') || '{}');
  const eu = igConta_(token);
  let r = igGet_('/' + eu.id + '/media', { fields: 'id,permalink,comments_count,timestamp', limit: IG.postsRecentes }, token);
  const posts = (r.data || []).slice();
  const faltam = IG.postsFixos.filter(function (code) { return !cache[code]; });
  // procura os fixos que ainda não têm id (até ~300 posts para trás)
  for (let p = 0; faltam.length && p < 6; p++) {
    (r.data || []).forEach(function (m) {
      faltam.slice().forEach(function (code) {
        if (m.permalink.indexOf('/' + code + '/') > -1) { cache[code] = { id: m.id, permalink: m.permalink }; faltam.splice(faltam.indexOf(code), 1); }
      });
    });
    if (!faltam.length || !r.paging || !r.paging.next) break;
    r = igGet_('/' + eu.id + '/media', { fields: 'id,permalink', limit: 50, after: r.paging.cursors.after }, token);
  }
  props.setProperty('IG_FIXOS', JSON.stringify(cache));
  const fixos = IG.postsFixos.map(function (code) { return cache[code]; }).filter(function (f) {
    return f && !posts.some(function (m) { return m.id === f.id; });
  });
  if (fixos.length) {
    // Contagem dos fixos: uma chamada por post (o parâmetro "ids" foi descontinuado na Graph API v26)
    const n = {}; fixos.forEach(function (f) { n[f.id] = igGet_('/' + f.id, { fields: 'comments_count' }, token); });
    fixos.forEach(function (f) { posts.push({ id: f.id, permalink: f.permalink, comments_count: n[f.id] && n[f.id].comments_count }); });
  }
  return posts;
}

// Conta do Instagram ligada ao token: { id, username, base } (guardada nas propriedades)
function igConta_(token) {
  const props = PropertiesService.getScriptProperties();
  const salva = JSON.parse(props.getProperty('IG_CONTA') || 'null');
  if (salva) return salva;

  let conta;
  if (/^IG/.test(token)) {
    const base = 'https://graph.instagram.com';
    const me = igGet_(base + '/me', { fields: 'user_id,username' }, token);
    conta = { id: me.user_id, username: me.username, base: base };
  } else {
    const base = 'https://graph.facebook.com';
    let id = props.getProperty('IG_USER_ID');

    // Token da sua conta do Facebook: usa o token da Página ligada ao Instagram (não expira)
    let paginas = [];
    try {
      paginas = igGet_(base + '/me/accounts', { fields: 'access_token,instagram_business_account{id,username}' }, token).data || [];
    } catch (e) { /* token de usuário do sistema não lista Páginas */ }
    const pagina = paginas.filter(function (p) {
      return p.instagram_business_account && (!id || p.instagram_business_account.id === id);
    })[0];
    if (pagina) {
      conta = { id: pagina.instagram_business_account.id, username: pagina.instagram_business_account.username, base: base, token: pagina.access_token };
      props.setProperty('IG_CONTA', JSON.stringify(conta));
      return conta;
    }

    // Token do login unificado: o id da conta do Instagram vem da propriedade IG_USER_ID
    // ou das permissões do próprio token
    if (!id) {
      const info = igGet_(base + '/debug_token', { input_token: token }, token).data || {};
      const escopo = (info.granular_scopes || []).filter(function (g) { return /^instagram_/.test(g.scope) && g.target_ids; })[0];
      id = escopo && escopo.target_ids[0];
    }
    if (!id) throw new Error('Não achei a conta do Instagram no token. Coloque o id dela na propriedade IG_USER_ID.');
    conta = { id: id, username: igGet_(base + '/' + id, { fields: 'username' }, token).username, base: base };
  }
  props.setProperty('IG_CONTA', JSON.stringify(conta));
  return conta;
}

// path relativo usa a API da conta; URL completa é usada como está
function igUrl_(path) {
  if (/^https:/.test(path)) return path;
  return JSON.parse(PropertiesService.getScriptProperties().getProperty('IG_CONTA')).base + path;
}

function igGet_(path, params, token) {
  const q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); });
  q.push('access_token=' + encodeURIComponent(token));
  return igResp_(UrlFetchApp.fetch(igUrl_(path) + '?' + q.join('&'), { muteHttpExceptions: true }));
}

function igPost_(path, params, token) {
  params = Object.assign({ access_token: token }, params);
  return igResp_(UrlFetchApp.fetch(igUrl_(path), { method: 'post', payload: params, muteHttpExceptions: true }));
}

function igResp_(res) {
  const body = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 400 || body.error) {
    const err = new Error((body.error && body.error.message) || ('HTTP ' + res.getResponseCode()));
    err.code = body.error && body.error.code; err.subcode = body.error && body.error.error_subcode;
    throw err;
  }
  return body;
}
