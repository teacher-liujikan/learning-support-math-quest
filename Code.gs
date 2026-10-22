/**
 * 學習扶助闖關｜Google Apps Script 後台
 * 學生網址：部署後的網址（學生掃 QR code 進入）
 * 老師後台：部署後的網址加上 ?mode=teacher
 */

// ★ 請把這裡改成你自己的老師密碼（只有你知道）
const TEACHER_PIN = '請改成你的密碼';

const SESSION_SHEET = '作答紀錄';
const ITEM_SHEET = '每題明細';
const SESSION_HEAD = ['紀錄ID', '學生', '關卡', '日期', '開始時間', '完成', '過關', '答對', '題數', '版本', '已記題數', '資料'];
const ITEM_HEAD = ['紀錄ID', '學生', '關卡', '日期', '站', '題目', '正確答案', '學生答案', '對錯', '秒數', '錯誤類型', '寫入時間'];

function doGet(e) {
  const mode = (e && e.parameter && e.parameter.mode === 'teacher') ? 'teacher' : 'student';
  const t = HtmlService.createTemplateFromFile('index');
  t.mode = mode;
  t.url = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle(mode === 'teacher' ? '學習扶助・老師後台' : '學習扶助闖關')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function sheet_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
  }
  return sh;
}

/** 學生每答一題就呼叫一次：更新這次闖關的總表，並補寫新的每題明細 */
function saveSession(json) {
  const s = JSON.parse(json);
  if (!s || !s.id || !s.student) throw new Error('資料不完整');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(SESSION_SHEET, SESSION_HEAD);
    const items = [];
    (s.stages || []).forEach(g => (g.items || []).forEach(it => items.push({ stage: g.title, it: it })));
    const correct = items.filter(x => x.it.ok).length;

    const found = sh.getRange('A:A').createTextFinder(s.id).matchEntireCell(true).findNext();
    let prevRev = 0, prevCount = 0, row;
    if (found) {
      row = found.getRow();
      const vals = sh.getRange(row, 10, 1, 2).getValues()[0];
      prevRev = Number(vals[0]) || 0;
      prevCount = Number(vals[1]) || 0;
      if ((s.rev || 0) <= prevRev) return 'skip'; // 比較舊的資料晚到，不覆蓋
    } else {
      row = sh.getLastRow() + 1;
    }
    const start = new Date(s.startedAt);
    sh.getRange(row, 1, 1, SESSION_HEAD.length).setValues([[
      s.id, s.student, s.level, s.day, start, s.finished ? '是' : '否', s.passed ? '過關' : (s.finished ? '未過關' : ''),
      correct, items.length, s.rev || 0, items.length, JSON.stringify(s)
    ]]);

    if (items.length > prevCount) {
      const ish = sheet_(ITEM_SHEET, ITEM_HEAD);
      const now = new Date();
      const rows = items.slice(prevCount).map(x => [
        s.id, s.student, s.level, s.day, x.stage, String(x.it.q), String(x.it.answer), String(x.it.given),
        x.it.ok ? '對' : '錯', Math.round((x.it.ms || 0) / 100) / 10, (x.it.tags || []).join('、'), now
      ]);
      ish.getRange(ish.getLastRow() + 1, 1, rows.length, ITEM_HEAD.length).setValues(rows);
    }
    return 'ok';
  } finally {
    lock.releaseLock();
  }
}

function readSessions_(filterName) {
  const sh = sheet_(SESSION_SHEET, SESSION_HEAD);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const rows = sh.getRange(2, 1, n, SESSION_HEAD.length).getValues();
  const out = [];
  rows.forEach(r => {
    if (filterName && r[1] !== filterName) return;
    try { out.push(JSON.parse(r[11])); } catch (e) {}
  });
  return out;
}

/** 學生畫面：只讀這位學生自己的紀錄（用來顯示關卡狀態） */
function getStudentSessions(name) {
  return JSON.stringify(readSessions_(String(name)));
}

/** 老師後台：要密碼才讀得到全班紀錄 */
function getAllSessions(pin) {
  if (String(pin) !== String(TEACHER_PIN)) throw new Error('密碼不對');
  return JSON.stringify(readSessions_(null));
}
