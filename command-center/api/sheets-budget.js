// GET /api/sheets-budget
// 從 Google Sheets 讀取預算資料
// 試算表格式（從 A2 開始）：
//   A欄: 專案名稱  B欄: 總預算(數字)  C欄: 已花費(數字)  D欄: 備註(選填)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A2:D50';

  // 未設定時回傳空陣列（前端顯示空狀態）
  if (!API_KEY || !SPREADSHEET_ID) {
    return res.status(200).json({ budgets: [], configured: false });
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err, budgets: [] });
    }

    const data = await response.json();
    const rows = data.values || [];

    const budgets = rows
      .filter((row) => row[0] && row[1]) // 需要至少有名稱和預算
      .map((row) => {
        const budget = parseFloat(String(row[1]).replace(/[^0-9.]/g, '')) || 0;
        const spent = parseFloat(String(row[2] || '0').replace(/[^0-9.]/g, '')) || 0;
        return {
          name: String(row[0]).trim(),
          budget,
          spent,
          note: row[3] ? String(row[3]).trim() : '',
          pct: budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0,
        };
      });

    return res.status(200).json({ budgets, configured: true });
  } catch (error) {
    return res.status(500).json({ error: error.message, budgets: [] });
  }
}
