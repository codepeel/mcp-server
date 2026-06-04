import { checkCreditsBeforeCall, handleApiError } from './shared.js';

interface ReviewArgs {
  diff: string;
  repo?: string;
}

interface Finding {
  title: string;
  severity: string;
  file: string;
  line: number;
  explanation: string;
  type: string;
  problemCode?: string;
  fixCode?: string;
  suggestedFix?: string;
}

export async function reviewCode(apiBase: string, token: string, args: ReviewArgs) {
  const { diff, repo = 'local' } = args;

  if (!diff || diff.trim().length < 10) {
    return {
      content: [{ type: 'text' as const, text: 'Error: diff is too short or empty. Provide a valid unified diff.' }],
      isError: true,
    };
  }

  // Cap diff size at 500KB to prevent timeouts and API errors
  const MAX_DIFF_BYTES = 500 * 1024;
  if (diff.length > MAX_DIFF_BYTES) {
    return {
      content: [{ type: 'text' as const, text: `Error: diff is too large (${(diff.length / 1024).toFixed(0)}KB). Maximum is 500KB. Try reviewing a smaller set of changes — e.g. a single file or commit.` }],
      isError: true,
    };
  }

  // Check credits before making the expensive review call
  const creditCheck = await checkCreditsBeforeCall(apiBase, token);
  if (creditCheck) { return creditCheck; }

  // Reviews can take up to 90s for large diffs — set a generous timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  let response: Response;
  try {
    response = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diff,
        repo: repo.includes('/') ? repo.split('/')[1] : repo,
        owner: repo.includes('/') ? repo.split('/')[0] : repo,
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return {
        content: [{ type: 'text' as const, text: '⏳ **Review timed out.** The diff may be too large or the server is busy. Try a smaller diff or retry in a moment.' }],
        isError: true,
      };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    return handleApiError(response.status, error);
  }

  const result = await response.json();
  const findings: Finding[] = result.findings || [];

  // Format findings as readable text
  let output = `## Code Review Results\n\n`;
  output += `**Summary:** ${result.summary || 'Review complete'}\n\n`;

  if (findings.length === 0) {
    output += `✅ No issues found. Code looks good!\n`;
  } else {
    output += `Found **${findings.length}** issue${findings.length > 1 ? 's' : ''}:\n\n`;

    for (const f of findings) {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : f.severity === 'medium' ? '🟡' : '🔵';
      const title = f.title || f.explanation?.split('\n')[0]?.slice(0, 80) || `${f.type} issue`;
      output += `### ${icon} ${title}\n`;
      output += `**File:** ${f.file}:${f.line} | **Severity:** ${f.severity} | **Type:** ${f.type}\n\n`;
      output += `${f.explanation}\n\n`;

      if (f.fixCode) {
        output += `**Suggested fix:**\n\`\`\`\n${f.fixCode}\n\`\`\`\n\n`;
      } else if (f.suggestedFix) {
        output += `**Suggestion:** ${f.suggestedFix}\n\n`;
      }

      output += `---\n\n`;
    }
  }

  if (result.metrics) {
    output += `\n**Metrics:** ${result.metrics.bugs || 0} bugs, ${result.metrics.security || 0} security, ${result.metrics.architecture || 0} architecture\n`;
  }

  return {
    content: [{ type: 'text' as const, text: output }],
  };
}
