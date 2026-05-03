import { TeamsFact, TeamsAdaptiveCard } from './teamstypes.js';

export const SCHEMA = 'http://adaptivecards.io/schemas/adaptive-card.json';
export const VERSION = '1.4';

export function buildStatusCard(projectId: string, status: string, details?: any): TeamsAdaptiveCard {
  const facts: TeamsFact[] = [
    { title: 'Project', value: projectId || 'Unknown' },
    { title: 'Status', value: (status || 'Unknown').toUpperCase() },
  ];

  if (details) {
    if (details.iteration != null) facts.push({ title: 'Iteration', value: String(details.iteration) });
    if (details.provider) facts.push({ title: 'Provider', value: details.provider });
    if (details.phase) facts.push({ title: 'Phase', value: details.phase });
  }

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': SCHEMA,
        type: 'AdaptiveCard',
        version: VERSION,
        body: [
          {
            type: 'TextBlock',
            text: 'Sognatore Status Update',
            size: 'large',
            weight: 'bolder',
          },
          {
            type: 'FactSet',
            facts: facts,
          }
        ]
      }
    }]
  };
}

export function buildApprovalCard(projectId: string, description: string): TeamsAdaptiveCard {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': SCHEMA,
        type: 'AdaptiveCard',
        version: VERSION,
        body: [
          {
            type: 'TextBlock',
            text: 'Approval Required',
            size: 'large',
            weight: 'bolder',
          },
          {
            type: 'TextBlock',
            text: description || 'Action requires approval',
            wrap: true,
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Approve',
            style: 'positive',
            data: { action: 'approve', projectId: projectId },
          },
          {
            type: 'Action.Submit',
            title: 'Reject',
            style: 'destructive',
            data: { action: 'reject', projectId: projectId },
          }
        ]
      }
    }]
  };
}

export function buildMessageCard(content: string): TeamsAdaptiveCard {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': SCHEMA,
        type: 'AdaptiveCard',
        version: VERSION,
        body: [
          {
            type: 'TextBlock',
            text: content || '',
            wrap: true,
          }
        ]
      }
    }]
  };
}

export function buildTaskListCard(tasks: Array<{ title: string; description?: string }>): TeamsAdaptiveCard {
  const items = (tasks || []).map((t, i) => {
    return {
      type: 'TextBlock',
      text: `${i + 1}. ${t.title || 'Untitled'}`,
      wrap: true,
    };
  });

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': SCHEMA,
        type: 'AdaptiveCard',
        version: VERSION,
        body: [
          {
            type: 'TextBlock',
            text: 'Task Breakdown',
            size: 'large',
            weight: 'bolder',
          },
          ...items
        ]
      }
    }]
  };
}

export function buildErrorCard(projectId: string, error: string): TeamsAdaptiveCard {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': SCHEMA,
        type: 'AdaptiveCard',
        version: VERSION,
        body: [
          {
            type: 'TextBlock',
            text: 'Sognatore Error',
            size: 'large',
            weight: 'bolder',
            color: 'attention',
          },
          {
            type: 'FactSet',
            facts: [
              { title: 'Project', value: projectId || 'Unknown' },
              { title: 'Error', value: error || 'Unknown error' },
            ]
          }
        ]
      }
    }]
  };
}
