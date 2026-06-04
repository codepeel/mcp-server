import { checkCreditsBeforeCall, handleApiError } from './shared.js';
export async function generateFix(apiBase, token, args) {
    const { file, issue, problemCode, line, severity = 'medium' } = args;
    // Check credits before making the call
    const creditCheck = await checkCreditsBeforeCall(apiBase, token);
    if (creditCheck) {
        return creditCheck;
    }
    const finding = {
        file,
        explanation: issue,
        line: line || 1,
        severity,
        type: 'bug',
        problemCode: problemCode || '',
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let response;
    try {
        response = await fetch(`${apiBase}/fixes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                finding,
                action: 'generate',
            }),
            signal: controller.signal,
        });
    }
    catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            return {
                content: [{ type: 'text', text: '⏳ **Fix generation timed out.** Try again or simplify the issue description.' }],
                isError: true,
            };
        }
        throw err;
    }
    finally {
        clearTimeout(timeout);
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        return handleApiError(response.status, error);
    }
    const result = await response.json();
    const fix = result.fix;
    let output = `## Fix for: ${issue}\n\n`;
    output += `**File:** ${file}${line ? `:${line}` : ''}\n\n`;
    if (fix?.patch) {
        output += `**Fix:**\n\`\`\`\n${fix.patch}\n\`\`\`\n\n`;
    }
    if (fix?.description) {
        output += `**Description:** ${fix.description}\n`;
    }
    return {
        content: [{ type: 'text', text: output }],
    };
}
