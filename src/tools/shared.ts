/**
 * Shared utilities for MCP tools — handles credit checks, rate limits, and auth errors.
 */

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Check if the user has reviews remaining. Returns null if OK, or an error ToolResult if not.
 */
export async function checkCreditsBeforeCall(apiBase: string, token: string): Promise<ToolResult | null> {
  try {
    const response = await fetch(`${apiBase}/ide/credits/balance`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
      return {
        content: [{ type: 'text', text: '❌ **Authentication failed.** Your token has expired or is invalid.\n\nGet a fresh token at https://codepeel.com/app/settings' }],
        isError: true,
      };
    }

    if (!response.ok) {
      // Non-critical — let the actual call proceed and handle errors there
      return null;
    }

    const data = await response.json();
    const remaining = data.reviewsRemainingThisPeriod;
    const tier = data.tier || 'free';

    // Max has no fixed quota — skip credit check (unlimited reviews)
    if (tier === 'max') {
      return null;
    }

    if (remaining !== null && remaining !== undefined && remaining <= 0) {
      const quota = data.monthlyQuota || 30;
      const resetAt = data.usageResetAt ? new Date(data.usageResetAt).toLocaleDateString() : 'next billing cycle';

      let msg = `❌ **No reviews remaining.**\n\n`;
      msg += `You've used all ${quota} reviews for this period.\n`;
      msg += `Reviews reset: ${resetAt}\n\n`;

      if (tier === 'free') {
        msg += `**Upgrade to Pro** for 500 reviews/month → https://codepeel.com/pricing`;
      } else {
        msg += `Contact support or wait for your reviews to reset.`;
      }

      return { content: [{ type: 'text', text: msg }], isError: true };
    }

    return null; // Reviews OK
  } catch {
    // Network error checking credits — let the actual call proceed
    return null;
  }
}

/**
 * Handle common API error responses and return a user-friendly ToolResult.
 */
export function handleApiError(status: number, error: any): ToolResult {
  if (status === 401) {
    const code = error?.code;
    if (code === 'TOKEN_EXPIRED') {
      return {
        content: [{ type: 'text', text: '❌ **Token expired.** Firebase ID tokens expire after 1 hour. Use a persistent API key instead:\n\n1. Go to https://codepeel.com/app/settings\n2. Create a new API token\n3. Update CODEPEEL_TOKEN in your MCP config with the new `cpk_` token' }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: '❌ **Invalid token.** Your CODEPEEL_TOKEN is not valid.\n\nTo fix:\n1. Go to https://codepeel.com/app/settings\n2. Create a new API token (starts with `cpk_`)\n3. Set it as CODEPEEL_TOKEN in your MCP config\n\nAPI tokens don\'t expire — unlike Firebase tokens which last only 1 hour.' }],
      isError: true,
    };
  }

  if (status === 429) {
    const retryAfter = error?.retryAfter || 60;
    return {
      content: [{ type: 'text', text: `⏳ **Rate limit exceeded.** Too many requests. Wait ${retryAfter} seconds and try again.` }],
      isError: true,
    };
  }

  if (status === 402) {
    const code = error?.code;
    if (code === 'REVIEWS_EXHAUSTED') {
      const tier = error?.tier || 'free';
      return {
        content: [{ type: 'text', text: `❌ **No reviews remaining.**\n\nYou've used all ${error?.quota || (tier === 'pro' ? 500 : 30)} reviews for this period (${error?.used || '?'} used).\n\n${tier === 'free' ? '**Upgrade to Pro** for 500 reviews/month → https://codepeel.com/app/billing' : 'Reviews reset at the start of your next billing cycle.'}` }],
        isError: true,
      };
    }
    if (code === 'PAYMENT_FAILED') {
      return {
        content: [{ type: 'text', text: '❌ **Payment failed.** Your last payment was declined.\n\nUpdate your payment method at https://codepeel.com/app/billing to continue using CodePeel.' }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: '❌ **No reviews remaining.** Upgrade at https://codepeel.com/app/billing or wait for your reviews to reset.' }],
      isError: true,
    };
  }

  if (status >= 500) {
    return {
      content: [{ type: 'text', text: `❌ **Server error (${status}).** CodePeel is temporarily unavailable. Try again in a moment.` }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: `❌ **Error (${status}):** ${error?.error || error?.message || 'Unknown error'}` }],
    isError: true,
  };
}
