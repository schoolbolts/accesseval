interface IssueSummaryInput {
  axeRuleId: string;
  severity: string;
  description: string;
  count: number;
  pagesAffected: number;
}

interface ScanSummaryInput {
  siteUrl: string;
  score: number;
  grade: string;
  pagesScanned: number;
  uniqueIssues: IssueSummaryInput[];
}

interface FreeScanSummaryInput {
  url: string;
  score: number;
  grade: string;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  issues: Array<{ severity: string; description: string }>;
}

export async function generateFreeScanSummary(input: FreeScanSummaryInput): Promise<string> {
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) return '';

  const issueList = input.issues
    .map((i) => `- [${i.severity.toUpperCase()}] ${i.description}`)
    .join('\n');

  const totalIssues = input.criticalCount + input.majorCount + input.minorCount;

  const prompt = `You are an accessibility consultant writing a brief assessment for a non-technical school administrator or city clerk. Be warm, direct, and avoid jargon. No markdown headers.

Website: ${input.url}
Score: ${input.score}/100 (Grade: ${input.grade})
Issues: ${totalIssues} total (${input.criticalCount} critical, ${input.majorCount} major, ${input.minorCount} minor)

Top issues:
${issueList}

Write exactly one paragraph (4-5 sentences) that:
1. Opens with a plain-language assessment of how the site is doing
2. Mentions the most important problems and why they matter for real people (blind users, keyboard-only users, etc.)
3. Notes the ADA Title II deadline if relevant
4. Ends with what to fix first

Do NOT use bullet points, headers, or lists. Just one flowing paragraph. Keep it human — like a helpful colleague explaining the results.`;

  try {
    const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error(`[ai-summary] free scan DeepInfra error: ${res.status}`);
      return '';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[ai-summary] free scan summary failed:', err);
    return '';
  }
}

export async function generateScanSummary(input: ScanSummaryInput): Promise<string> {
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) return '';

  const issueList = input.uniqueIssues
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
      return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3) || b.count - a.count;
    })
    .map((i) => `- [${i.severity.toUpperCase()}] "${i.description}" — found ${i.count} times across ${i.pagesAffected} page(s)`)
    .join('\n');

  const prompt = `You are an accessibility consultant writing a scan report summary for a non-technical school administrator or office worker. They need to understand what's wrong with their website and what to prioritize — no jargon, no code.

Their website: ${input.siteUrl}
Score: ${input.score}/100 (Grade: ${input.grade})
Pages scanned: ${input.pagesScanned}

Issues found (grouped by type):
${issueList}

Write a brief, friendly summary (3-5 short paragraphs) that:
1. Opens with an overall assessment in plain language (avoid repeating the exact score — describe what it means)
2. Lists each issue type as a bullet point with a simple, human-readable explanation of what's wrong and why it matters for people with disabilities. Use everyday language — "screen reader" is fine, but avoid terms like "ARIA", "WCAG", "DOM", "selector", etc.
3. Ends with 1-2 sentences of encouragement about what to fix first

Do NOT use markdown headers. Use plain bullet points (•) for the issue list. Keep it warm and professional — like a helpful colleague, not a compliance auditor.`;

  try {
    const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error(`[ai-summary] DeepInfra API error: ${res.status} ${res.statusText}`);
      return '';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[ai-summary] Failed to generate summary:', err);
    return '';
  }
}
