import { Color } from '@Sogna/Curator';


export interface swarmStyle {
  color: any;
  icon: string;
  label: string;
}

export const swarm_VISUALS: Record<string, swarmStyle> = {
  'Engineering': {
    color: Color.blueBright,
    icon: '🏗️',
    label: 'ENGINEERING'
  },
  'Operations': {
    color: Color.yellowBright,
    icon: '⚙️',
    label: 'OPERATIONS'
  },
  'Business': {
    color: Color.greenBright,
    icon: '💰',
    label: 'BUSINESS'
  },
  'Data': {
    color: Color.cyanBright,
    icon: '📊',
    label: 'DATA'
  },
  'Product': {
    color: Color.magentaBright,
    icon: '📋',
    label: 'PRODUCT'
  },
  'Review': {
    color: Color.redBright,
    icon: '🔍',
    label: 'REVIEW'
  },
  'Growth': {
    color: Color.hex('#FFA500'), // Orange
    icon: '🚀',
    label: 'GROWTH'
  },
  'Orchestration': {
    color: Color.hex('#8A2BE2'), // BlueViolet
    icon: '🎭',
    label: 'ORCHESTRATION'
  }
};

export function getswarmStyle(swarmName: string): swarmStyle {
  return swarm_VISUALS[swarmName] || {
    color: Color.white,
    icon: '🤖',
    label: swarmName.toUpperCase()
  };
}
