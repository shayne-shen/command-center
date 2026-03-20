// GET /api/notion-tasks
// 回傳所有未完成任務，前端依 Today / 狀態 / 名稱前綴分組
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_TASKS_DB_ID || '2079655580a3814ba734ca88bd63916f';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN 未設定' });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: '狀態',
            select: { does_not_equal: '完成' },
          },
          sorts: [
            { property: 'Today', direction: 'descending' },
            { property: '優先級', direction: 'ascending' },
          ],
          page_size: 100,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    const tasks = (data.results || []).map((page) => ({
      id: page.id,
      url: page.url,
      name: page.properties.Task?.title?.[0]?.plain_text || '（無標題）',
      status: page.properties['狀態']?.select?.name || '',
      today: page.properties.Today?.checkbox || false,
      priority: page.properties['優先級']?.select?.name || '',
      dueDate: page.properties['Due Date']?.date?.start || null,
      notes: page.properties['備註']?.rich_text?.[0]?.plain_text || '',
    }));

    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
