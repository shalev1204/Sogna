/**
 * Slash command handlers for Slack integration.
 */

export interface CommandParams {
  userId?: string;
  status?: string;
  iteration?: number | string;
  provider?: string;
  phase?: string;
}

export function handleStatus(params: CommandParams) {
  return {
    response_type: 'in_channel',
    text: 'Sognatore Status',
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Status:* ${params.status || 'idle'}` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Iteration:*\n${params.iteration || 'N/A'}` },
          { type: 'mrkdwn', text: `*Provider:*\n${params.provider || 'N/A'}` },
          { type: 'mrkdwn', text: `*Phase:*\n${params.phase || 'N/A'}` }
        ]
      }
    ]
  };
}

export function handleApprove(params: CommandParams) {
  return {
    response_type: 'in_channel',
    text: `Action approved by <@${params.userId || 'unknown'}>`,
  };
}

export function handleStop(params: CommandParams) {
  return {
    response_type: 'in_channel',
    text: `Stop requested by <@${params.userId || 'unknown'}>. Session will stop after current iteration.`,
  };
}

export const COMMAND_HANDLERS: Record<string, (params: CommandParams) => any> = {
  '/Sognatore-status': handleStatus,
  '/Sognatore-approve': handleApprove,
  '/Sognatore-stop': handleStop,
};

export function routeCommand(command: string, params: CommandParams = {}) {
  const handler = COMMAND_HANDLERS[command];
  if (!handler) {
    return { response_type: 'ephemeral', text: `Unknown command: ${command}` };
  }
  return handler(params);
}
