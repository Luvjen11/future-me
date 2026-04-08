export async function POST(req) {
  try {
    const { query } = await req.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system:
          'You are a Notion data retriever. Search Notion for tasks, goals, and pages relevant to the query. Return a concise plain-text summary: overdue tasks, high priority items, current goals, recent pages. Include task names, due dates, statuses. Max 350 words. If nothing relevant found, say so.',
        messages: [
          {
            role: 'user',
            content: `Retrieve Notion data relevant to: "${query}". Search for tasks, goals, weekly plans, projects, overdue or high priority items.`,
          },
        ],
        mcp_servers: [
          {
            type: 'url',
            url: 'https://mcp.notion.com/mcp',
            name: 'notion',
          },
        ],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'Notion fetch error' }, { status: res.status })
    }

    const text =
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n') || 'No Notion data found.'

    return Response.json({ text })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
