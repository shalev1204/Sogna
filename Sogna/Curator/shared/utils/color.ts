/**
 * Sogna Native Color Utility
 * Pure ANSI-based terminal styling without external dependencies.
 */

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

type StyleKey = keyof typeof ANSI;

class ColorInstance {
  private activeStyles: string[] = [];

  constructor(style?: string) {
    if (style) this.activeStyles.push(style);
  }

  private addStyle(style: string): ColorInstance {
    const newInstance = new ColorInstance();
    newInstance.activeStyles = [...this.activeStyles, style];
    return newInstance;
  }

  get bold() { return this.addStyle(ANSI.bold); }
  get dim() { return this.addStyle(ANSI.dim); }
  get italic() { return this.addStyle(ANSI.italic); }
  get underline() { return this.addStyle(ANSI.underline); }
  
  get black() { return this.addStyle(ANSI.black); }
  get red() { return this.addStyle(ANSI.red); }
  get green() { return this.addStyle(ANSI.green); }
  get yellow() { return this.addStyle(ANSI.yellow); }
  get blue() { return this.addStyle(ANSI.blue); }
  get magenta() { return this.addStyle(ANSI.magenta); }
  get cyan() { return this.addStyle(ANSI.cyan); }
  get white() { return this.addStyle(ANSI.white); }
  get gray() { return this.addStyle(ANSI.gray); }
  
  get bgRed() { return this.addStyle(ANSI.bgRed); }
  get bgGreen() { return this.addStyle(ANSI.bgGreen); }
  get bgYellow() { return this.addStyle(ANSI.bgYellow); }
  get bgBlue() { return this.addStyle(ANSI.bgBlue); }

  // Support for template literals and direct calls
  style(text: string): string {
    return `${this.activeStyles.join('')}${text}${ANSI.reset}`;
  }
}

// Create the proxy to allow chainable calls like chalk.blue.bold('text')
const createProxy = (instance: ColorInstance): any => {
  return new Proxy((text: string) => instance.style(text), {
    get: (target, prop: string) => {
      if (prop in instance) {
        return createProxy((instance as any)[prop]);
      }
      return (target as any)[prop];
    }
  });
};

export const Color = createProxy(new ColorInstance());
export default Color;
