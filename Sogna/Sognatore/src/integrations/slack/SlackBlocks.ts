import { SlackBlock } from './SlackTypes.js';

export function buildStatusBlocks(projectId: string, status: string, details?: any): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Sognatore Status Update' }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Project:*\n${projectId || 'Unknown'}` },
        { type: 'mrkdwn', text: `*Status:*\n${(status || 'Unknown').toUpperCase()}` },
      ]
    }
  ];

  if (details) {
    const detailFields: any[] = [];
    if (details.iteration != null) {
      detailFields.push({ type: 'mrkdwn', text: `*Iteration:*\n${details.iteration}` });
    }
    if (details.provider) {
      detailFields.push({ type: 'mrkdwn', text: `*Provider:*\n${details.provider}` });
    }
    if (details.phase) {
      detailFields.push({ type: 'mrkdwn', text: `*Phase:*\n${details.phase}` });
    }
    if (detailFields.length > 0) {
      blocks.push({ type: 'section', fields: detailFields });
    }
  }

  blocks.push({ type: 'divider' });

  return blocks;
}

export function buildApprovalBlocks(projectId: string, description: string, actionId: string): SlackBlock[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Approval Required' }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: description || 'Action requires approval' }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Approve' },
          style: 'primary',
          action_id: `approve_${actionId || 'action'}`,
          value: JSON.stringify({ projectId, action: 'approve' })
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Reject' },
          style: 'danger',
          action_id: `reject_${actionId || 'action'}`,
          value: JSON.stringify({ projectId, action: 'reject' })
        }
      ]
    }
  ];
}

export function buildErrorBlocks(projectId: string, error: string): SlackBlock[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Sognatore Error' }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Project:* ${projectId || 'Unknown'}\n*Error:* ${error || 'Unknown error'}`
      }
    }
  ];
}
