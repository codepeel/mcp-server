import { handleApiError } from './shared.js';

export async function checkCredits(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/ide/credits/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    return handleApiError(response.status, error);
  }

  const data = await response.json();
  const remaining = data.reviewsRemainingThisPeriod ?? 'unknown';
  const used = data.reviewsUsedThisPeriod || 0;
  const quota = data.monthlyQuota || 30;
  const tier = data.tier || 'free';

  let output = `## CodePeel Account\n\n`;
  output += `| | |\n|---|---|\n`;
  output += `| **Plan** | ${tier.charAt(0).toUpperCase() + tier.slice(1)} |\n`;

  if (tier === 'max') {
    output += `| **Used** | ${used} reviews this period |\n`;
    output += `| **Limit** | Unlimited |\n`;
  } else {
    output += `| **Used** | ${used} / ${quota} reviews |\n`;
    output += `| **Remaining** | ${remaining} reviews |\n`;
  }

  if (data.usageResetAt) {
    output += `| **Resets** | ${new Date(data.usageResetAt).toLocaleDateString()} |\n`;
  }

  if (data.displayName) {
    output += `| **Account** | @${data.displayName} |\n`;
  }

  // Add warning if low on credits (not for max)
  if (tier !== 'max' && typeof remaining === 'number') {
    if (remaining <= 0) {
      output += `\n⚠️ **No reviews remaining.** Upgrade at https://codepeel.com/app/billing or wait for reset.`;
    } else if (remaining <= 10) {
      output += `\n⚠️ **Low reviews.** Only ${remaining} reviews left this period.`;
    }
  }

  return {
    content: [{ type: 'text' as const, text: output }],
  };
}
