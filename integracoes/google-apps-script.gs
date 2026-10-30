/**
 * Backend do site (planilha Google, privada — só você acessa):
 *  - Aplicações da Mentoria  → aba "Aplicações"
 *  - Jornada do quiz do MPR  → aba "Quiz" (uma linha por visitante, anônima)
 *  - Dados do painel /painel → protegidos pela senha PAINEL_SENHA
 *  - Painel /aplicacoes      → lista as aplicações e grava o status de contato (mesma senha)
 *
 * Como usar (passo a passo completo no README.md):
 *  1. Planilha no Google Sheets → Extensões → Apps Script → cole este arquivo.
 *  2. Implantar → Nova implantação → "App da Web" (Executar como: Eu | Acesso: Qualquer pessoa).
 *  3. Cole a URL /exec em assets/js/config.js → form.endpoint.
 *  4. Senha do painel: Configurações do projeto (engrenagem) → Propriedades do script →
 *     adicionar propriedade PAINEL_SENHA com a senha que você quiser.
 *  Ao alterar o código: Implantar → Gerenciar implantações → editar → Nova versão (mantém a URL).
 */

const SHEET_NAME = 'Aplicações';
const QUIZ_SHEET = 'Quiz';
const NOTIFY_EMAIL = ''; // opcional: seu e-mail para receber aviso a cada aplicação

const COLUMNS = [
  ['recebido_em', 'Recebido em'],
  ['nome', 'Nome'],
  ['instagram', 'Instagram'],
  ['whatsapp', 'WhatsApp'],
  ['objetivo', 'Objetivo'],
  ['dificuldade', 'Dificuldade'],
  ['investimento', 'Investimento'],
  ['projeto', 'Projeto'],
  ['consentimento', 'Consentimento'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
  ['fbclid', 'fbclid'],
  ['gclid', 'gclid'],
  ['referrer', 'Referrer'],
  ['landing_page', 'Página de entrada']
];

const REQUIRED = ['nome', 'instagram', 'whatsapp', 'objetivo', 'dificuldade', 'investimento', 'projeto'];

// Colunas da aba "Quiz" (a ordem importa: o painel lê por nome)
const QUIZ_COLUMNS = ['id', 'inicio', 'atualizado', 'dispositivo', 'etapa_max', 'etapa_nome', 'concluiu', 'checkout',
  'duracao_s', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'respostas', 'etapas'];

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'quiz') return saveQuiz_(p);
    if (p.action === 'stats') return stats_(p);
    if (p.action === 'aplicacoes') return aplicacoes_(p);
    if (p.action === 'status') return status_(p);
    return saveApplication_(p);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Abra a URL /exec no navegador para conferir se está no ar
function doGet() {
  return json_({ ok: true, status: 'online' });
}

/* ───────────── Aplicações da mentoria ───────────── */

function saveApplication_(p) {
  if (p.website) return json_({ ok: true }); // campo anti-robô preenchido: descarta

  const missing = REQUIRED.filter(function (k) { return !String(p[k] || '').trim(); });
  if (missing.length || p.consentimento !== 'sim') {
    return json_({ ok: false, error: 'Campos obrigatórios ausentes: ' + missing.join(', ') });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEET_NAME, COLUMNS.map(function (c) { return c[1]; }));
    sheet.appendRow(COLUMNS.map(function (c) {
      return c[0] === 'recebido_em' ? new Date() : clean_(p[c[0]]);
    }));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, 'Nova aplicação — Mentoria: ' + clean_(p.nome),
        COLUMNS.slice(1).map(function (c) { return c[1] + ': ' + clean_(p[c[0]]); }).join('\n'));
    } catch (mailErr) { /* a aplicação já foi salva; o e-mail é só um aviso */ }
  }

  return json_({ ok: true });
}

/* ───────────── Jornada do quiz (uma linha por visitante, atualizada a cada envio) ───────────── */

function saveQuiz_(p) {
  if (!/^[A-Za-z0-9]{6,16}$/.test(p.id || '')) return json_({ ok: false, error: 'id inválido' });

  const inicio = new Date(p.inicio);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(QUIZ_SHEET, QUIZ_COLUMNS);
    const last = sheet.getLastRow();
    const found = last > 1
      ? sheet.getRange(2, 1, last - 1, 1).createTextFinder(p.id).matchEntireCell(true).findNext()
      : null;

    let etapaMax = Math.max(0, Math.min(99, parseInt(p.etapa_max, 10) || 0));
    if (found) {
      // nunca diminui a etapa máxima (envios podem chegar fora de ordem)
      const prev = sheet.getRange(found.getRow(), QUIZ_COLUMNS.indexOf('etapa_max') + 1).getValue();
      if (Number(prev) > etapaMax) return json_({ ok: true });
    }

    const row = QUIZ_COLUMNS.map(function (k) {
      if (k === 'inicio') return isNaN(inicio) ? new Date() : inicio;
      if (k === 'atualizado') return new Date();
      if (k === 'etapa_max') return etapaMax;
      if (k === 'duracao_s') return Math.max(0, Math.min(86400, parseInt(p.duracao_s, 10) || 0));
      return clean_(p[k]);
    });

    if (found) sheet.getRange(found.getRow(), 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/* ───────────── Dados do painel (protegido por senha) ───────────── */

// Retorna null se a senha confere; senão, a resposta de erro
function checkSenha_(p) {
  const senha = PropertiesService.getScriptProperties().getProperty('PAINEL_SENHA');
  if (!senha) return json_({ ok: false, error: 'senha_nao_configurada' });
  if (String(p.senha || '') !== senha) {
    Utilities.sleep(1200); // atrasa tentativas de adivinhar a senha
    return json_({ ok: false, error: 'senha_invalida' });
  }
  return null;
}

function stats_(p) {
  const negado = checkSenha_(p);
  if (negado) return negado;

  const dias = Math.max(1, Math.min(90, parseInt(p.dias, 10) || 1));
  const agora = new Date();
  const desde = new Date(agora.getTime() - 2 * dias * 86400000); // período atual + anterior (comparação)

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUIZ_SHEET);
  const rows = [];
  if (sheet && sheet.getLastRow() > 1) {
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, QUIZ_COLUMNS.length).getValues();
    values.forEach(function (v) {
      const inicio = v[1] instanceof Date ? v[1] : new Date(v[1]);
      if (isNaN(inicio) || inicio < desde) return;
      const o = {};
      QUIZ_COLUMNS.forEach(function (k, i) { o[k] = v[i] instanceof Date ? v[i].toISOString() : v[i]; });
      rows.push(o);
    });
  }
  return json_({ ok: true, agora: agora.toISOString(), dias: dias, rows: rows });
}

/* ───────────── Aplicações da mentoria (painel /aplicacoes) ───────────── */

// O status de contato fica numa coluna extra "Status", depois das colunas do formulário
const STATUS_COL = COLUMNS.length + 1;
const STATUS_OK = ['novo', 'chamei', 'respondeu', 'fechou', 'descartado'];

function aplicacoes_(p) {
  const negado = checkSenha_(p);
  if (negado) return negado;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = [];
  if (sheet && sheet.getLastRow() > 1) {
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, STATUS_COL).getValues();
    values.forEach(function (v, i) {
      const o = { linha: i + 2, status: String(v[STATUS_COL - 1] || 'novo') };
      COLUMNS.forEach(function (c, j) { o[c[0]] = v[j] instanceof Date ? v[j].toISOString() : String(v[j]); });
      rows.push(o);
    });
  }
  return json_({ ok: true, rows: rows });
}

function status_(p) {
  const negado = checkSenha_(p);
  if (negado) return negado;
  if (STATUS_OK.indexOf(p.status) < 0) return json_({ ok: false, error: 'status inválido' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const linha = parseInt(p.linha, 10);
  if (!sheet || !(linha >= 2) || linha > sheet.getLastRow()) return json_({ ok: false, error: 'linha inválida' });

  // Confere se a linha ainda é da mesma pessoa (a planilha pode ter sido reordenada)
  const whats = String(sheet.getRange(linha, COLUMNS.map(function (c) { return c[0]; }).indexOf('whatsapp') + 1).getValue());
  if (whats !== String(p.whatsapp || '')) return json_({ ok: false, error: 'planilha_mudou' });

  if (!sheet.getRange(1, STATUS_COL).getValue()) sheet.getRange(1, STATUS_COL).setValue('Status').setFontWeight('bold');
  sheet.getRange(linha, STATUS_COL).setValue(p.status);
  return json_({ ok: true });
}

/* ───────────── Utilitários ───────────── */

function getSheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  }
  return sheet;
}

// Limita o tamanho e impede "injeção de fórmulas" na planilha
function clean_(value) {
  let s = String(value == null ? '' : value).trim().slice(0, 2000);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
