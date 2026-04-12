import crypto from 'crypto';

/**
 * Verify Slack request signature.
 * 
 * @param signingSecret - Slack signing secret
 * @param timestamp - x-slack-request-timestamp header
 * @param body - Raw request body
 * @param signature - x-slack-signature header
 */
export function verifySlackSignature(signingSecret: string, timestamp: string, body: string, signature: string): boolean {
  if (!signingSecret || !timestamp || !signature) return false;

  // Reject requests older than 5 minutes (standard security practice)
  const now = Math.floor(Date.now() / 1000);
  const tsInt = parseInt(timestamp, 10);
  if (isNaN(tsInt) || Math.abs(now - tsInt) > 300) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  const a = Buffer.from(mySignature);
  const b = Buffer.from(signature);

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Parse Slack webhook payload.
 * Handles both JSON and URL-encoded interactive payloads.
 */
export function parseSlackPayload(body: string): any {
  try {
    // Interactive payloads are URL-encoded with a 'payload' field
    if (body.startsWith('payload=')) {
      return JSON.parse(decodeURIComponent(body.slice(8)));
    }
    return JSON.parse(body);
  } catch (e) {
    return null;
  }
}
