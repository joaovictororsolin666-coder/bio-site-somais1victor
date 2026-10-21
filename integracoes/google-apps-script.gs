/**
 * Recebe as aplicações da Mentoria e grava numa planilha Google (privada, só você acessa).
 *
 * Como usar (passo a passo completo no README.md):
 *  1. Crie uma planilha no Google Sheets → Extensões → Apps Script.
 *  2. Cole este arquivo, salve e clique em Implantar → Nova implantação → "App da Web".
 *     Executar como: Eu  |  Quem pode acessar: Qualquer pessoa.
 *  3. Copie a URL que termina em /exec e cole em assets/js/config.js → form.endpoint.
 */

const SHEET_NAME = 'Aplicações';
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

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    if (p.website) return json_({ ok: true }); // campo anti-robô preenchido: descarta

    const missing = REQUIRED.filter(function (k) { return !String(p[k] || '').trim(); });
    if (missing.length || p.consentimento !== 'sim') {
      return json_({ ok: false, error: 'Campos obrigatórios ausentes: ' + missing.join(', ') });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
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
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Abra a URL /exec no navegador para conferir se está no ar
function doGet() {
  return json_({ ok: true, status: 'online' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
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
