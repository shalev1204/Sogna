import chalk from 'chalk';

export interface SwarmStyle {
  color: any;
  icon: string;
  label: string;
}

export const SWARM_VISUALS: Record<string, SwarmStyle> = {
  'Engineering': {
    color: chalk.blueBright,
    icon: '🏗️',
    label: 'ENGINEERING'
  },
  'Operations': {
    color: chalk.yellowBright,
    icon: '⚙️',
    label: 'OPERATIONS'
  },
  'Business': {
    color: chalk.greenBright,
    icon: '💰',
    label: 'BUSINESS'
  },
  'Data': {
    color: chalk.cyanBright,
    icon: '📊',
    label: 'DATA'
  },
  'Product': {
    color: chalk.magentaBright,
    icon: '📋',
    label: 'PRODUCT'
  },
  'Review': {
    color: chalk.redBright,
    icon: '🔍',
    label: 'REVIEW'
  },
  'Growth': {
    color: chalk.hex('#FFA500'), // Orange
    icon: '🚀',
    label: 'GROWTH'
  },
  'Orchestration': {
    color: chalk.hex('#8A2BE2'), // BlueViolet
    icon: '🎭',
    label: 'ORCHESTRATION'
  }
};

export function getSwarmStyle(swarmName: string): SwarmStyle {
  return SWARM_VISUALS[swarmName] || {
    color: chalk.white,
    icon: '🤖',
    label: swarmName.toUpperCase()
  };
}
