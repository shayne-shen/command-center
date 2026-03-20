// GET /api/notion-projects
// 回傳所有「進行中」的專案
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_PROJECTS_DB_ID || '2079655580a38186a9aeffd58d5cfbd8';

  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN 未設定' });

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
            property: 'Status',
            select: { equals: '進行中' },
          },
          sorts: [{ property: 'End Date', direction: 'ascending' }],
          page_size: 50,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    const projects = (data.results || []).map((page) => ({
      id: page.id,
      url: page.url,
      name: page.properties.Project?.title?.[0]?.plain_text || '（無標題）',
      status: page.properties.Status?.select?.name || '',
      endDate: page.properties['End Date']?.date?.start || null,
    }));

    return res.status(200).json({ projects });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
