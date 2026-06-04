import { checkCreditsBeforeCall, handleApiError } from './shared.js';

interface ChatArgs {
  question: string;
  diff?: string;
}

export async function askCodePeel(apiBase: string, token: string, args: ChatArgs) {
  const { question, diff } = args;

  // Check credits before making the call
  const creditCheck = await checkCreditsBeforeCall(apiBase, token);
  if (creditCheck) { return creditCheck; }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(`${apiBase}/ide/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, diff: diff || '' }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return {
        content: [{ type: 'text' as const, text: '⏳ **Request timed out.** Try a simpler question or retry.' }],
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

  return {
    content: [{ type: 'text' as const, text: result.reply || 'No response.' }],
  };
}
