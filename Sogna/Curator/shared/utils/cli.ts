import { Color } from './color.js';

export interface CLIOption {
  flags: string;
  description: string;
  defaultValue?: any;
}

export interface CLIArgument {
  name: string;
  description: string;
  required?: boolean;
}

export type CLIAction = (args: any, options: any) => Promise<void> | void;

export interface CLICommand {
  name: string;
  description: string;
  args: CLIArgument[];
  options: CLIOption[];
  action: CLIAction;
}

/**
 * SognaCLI - Native Lightweight CLI Parser.
 * Replaces 'commander' to ensure ecosystem autonomy.
 */
export class SognaCLI {
  private _name: string = '';
  private _description: string = '';
  private _version: string = '';
  private _commands: Map<string, CLICommand> = new Map();
  private _globalOptions: CLIOption[] = [];

  constructor(name: string) {
    this._name = name;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  version(ver: string): this {
    this._version = ver;
    return this;
  }

  command(name: string, description: string, config: {
    args?: CLIArgument[];
    options?: CLIOption[];
    action: CLIAction;
  }): this {
    this._commands.set(name, {
      name,
      description,
      args: config.args || [],
      options: config.options || [],
      action: config.action
    });
    return this;
  }

  parse(argv: string[] = process.argv): void {
    const args = argv.slice(2);
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      this.showHelp();
      return;
    }

    if (args[0] === '--version' || args[0] === '-v') {
      console.log(`${this._name} v${this._version}`);
      return;
    }

    const commandName = args[0];
    const command = this._commands.get(commandName);

    if (!command) {
      console.error(Color.red(`Error: Unknown command '${commandName}'`));
      this.showHelp();
      process.exit(1);
    }

    const parsedArgs: any = {};
    const parsedOptions: any = {};

    // Initialize default values
    command.options.forEach(opt => {
      const flag = opt.flags.split(',').pop()?.trim().replace(/^-+/, '');
      if (flag) parsedOptions[flag] = opt.defaultValue;
    });

    let argIndex = 0;
    for (let i = 1; i < args.length; i++) {
      const val = args[i];
      if (val.startsWith('-')) {
        const flag = val.replace(/^-+/, '');
        // Check if next value is an argument for this option or if it's a boolean flag
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsedOptions[flag] = args[++i];
        } else {
          parsedOptions[flag] = true;
        }
      } else {
        if (argIndex < command.args.length) {
          parsedArgs[command.args[argIndex].name] = val;
          argIndex++;
        }
      }
    }

    // Verify required args
    command.args.forEach(arg => {
      if (arg.required && parsedArgs[arg.name] === undefined) {
        console.error(Color.red(`Error: Missing required argument '${arg.name}'`));
        process.exit(1);
      }
    });

    // Execute
    Promise.resolve(command.action(parsedArgs, parsedOptions)).catch(err => {
      console.error(Color.red(`Error executing command '${commandName}':`), err);
      process.exit(1);
    });
  }

  private showHelp(): void {
    console.log(`\n${Color.bold(this._name)} v${this._version}`);
    console.log(this._description);
    console.log(`\n${Color.yellow('Usage:')}`);
    console.log(`  $ ${this._name} <command> [arguments] [options]`);

    console.log(`\n${Color.yellow('Commands:')}`);
    this._commands.forEach(cmd => {
      const argsStr = cmd.args.map(a => a.required ? `<${a.name}>` : `[${a.name}]`).join(' ');
      console.log(`  ${Color.green(cmd.name.padEnd(15))} ${argsStr.padEnd(20)} ${cmd.description}`);
    });

    console.log(`\n${Color.yellow('Global Options:')}`);
    console.log(`  -h, --help      Show this help message`);
    console.log(`  -v, --version   Show version information\n`);
  }
}
