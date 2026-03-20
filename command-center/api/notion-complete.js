// POST /api/notion-complete
// Body: { taskId: string }
// 將 Notion 任務標記為「完成」，並取消 Today checkbox
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '只接受 POST' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const { taskId } = req.body;

  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN 未設定' });
  if (!taskId) return res.status(400).json({ error: '缺少 taskId' });

  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          狀態: { select: { name: '完成' } },
          Today: { checkbox: false },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
