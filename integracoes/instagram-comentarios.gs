/**
 * Resposta automática nos comentários do Instagram (sem DM).
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
    const posts = igPosts_(token).filter(function (m) { return contagens[m.id] !== m.comments_count; });
    if (!posts.length) return; // nada novo: a rodada fica em 1 ou 2 chamadas

    const log = igLog_();
    igGravarPendentes_(log, props);
    const feitos = igFeitos_(log, props);
    let hoje = feitos.hoje, hora = feitos.hora, enviadas = 0;
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

        const texto = IG.respostas[Math.floor(Math.random() * IG.respostas.length)];
        let status = 'ok';
        try {
          igPost_('/' + c.id + '/replies', { message: texto }, token);
          enviadas++; hoje++; hora++;
        } catch (e) {
          status = 'erro: ' + String(e.message || e).slice(0, 300);
        }
        igGravar_(log, props, [new Date(), m.permalink, quem, clean_(c.text), texto, status, c.id, m.id]);
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
  return json_(igResumo_(props));
}

function igResumo_(props) {
  const gatilho = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'responderComentarios'; });
  const conta = JSON.parse(props.getProperty('IG_CONTA') || '{}');
  const agora = new Date(), hoje = agora.toDateString(), semana = agora.getTime() - 7 * 86400000;
  const porDia = {}, ultimas = [];
  let total = 0, hojeOk = 0, semanaOk = 0, erros = 0;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IG.aba);
  if (sheet && sheet.getLastRow() > 1) {
    const n = Math.min(sheet.getLastRow() - 1, 5000);
    const rows = sheet.getRange(sheet.getLastRow() - n + 1, 1, n, 6).getValues();
    rows.forEach(function (v) {
      const d = v[0] instanceof Date ? v[0] : new Date(v[0]);
      if (isNaN(d)) return;
      if (v[5] !== 'ok') { if (d.getTime() >= semana) erros++; return; }
      total++;
      if (d.toDateString() === hoje) hojeOk++;
      if (d.getTime() >= semana) semanaOk++;
      const dia = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      porDia[dia] = (porDia[dia] || 0) + 1;
    });
    rows.slice(-60).reverse().forEach(function (v) {
      ultimas.push({ data: v[0] instanceof Date ? v[0].toISOString() : String(v[0]), post: String(v[1]), usuario: String(v[2]), comentario: String(v[3]), resposta: String(v[4]), status: String(v[5]) });
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
    ultimas: ultimas
  };
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
  return getSheet_(IG.aba, ['Data', 'Post', 'Usuário', 'Comentário', 'Resposta', 'Status', 'comment_id', 'media_id']);
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
  let hoje = 0, hora = 0;
  const dia = new Date().toDateString(), umaHora = Date.now() - 3600000;
  const marcar = function (v) {
    ids[v[6]] = true;
    pessoas[v[7] + '|' + v[2]] = true;
    if (v[5] === 'ok' && new Date(v[0]).toDateString() === dia) hoje++;
    if (v[5] === 'ok' && new Date(v[0]).getTime() >= umaHora) hora++;
  };
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues().forEach(marcar);
  JSON.parse(props.getProperty('IG_PENDENTES') || '[]').forEach(marcar); // ainda não foram para a planilha
  return { ids: ids, pessoas: pessoas, hoje: hoje, hora: hora };
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
  let r = igGet_('/' + eu.id + '/media', { fields: 'id,permalink,comments_count', limit: IG.postsRecentes }, token);
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
  if (res.getResponseCode() >= 400 || body.error) throw new Error((body.error && body.error.message) || ('HTTP ' + res.getResponseCode()));
  return body;
}
