import { spawn, type SpawnOptions, ChildProcess } from 'node:child_process';
import { Readable, PassThrough } from 'node:stream';

/**
 * Sogna Native Execution Engine
 * Lightweight promise-based wrapper for child_process, compatible with execa patterns.
 */
export interface ExecResult {
  stdout: string;
  stderr: string;
  all: string;
  exitCode: number | null;
}

export type ExecProcess = ChildProcess & { all?: Readable } & Promise<ExecResult>;
export type SognaChildProcess = ExecProcess;
export type SognaExecError = Error & ExecResult;


export class Exec {
  /**
   * Executes a command and returns a ChildProcess that is also a Promise.
   */
  static run(command: string, args: string[] = [], options: SpawnOptions & { input?: string, all?: boolean } = {}): ExecProcess {
    const { input, all: collectAll, ...spawnOptions } = options;
    
    const child = spawn(command, args, {
      shell: process.platform === 'win32',
      ...spawnOptions
    }) as any;

    let stdout = '';
    let stderr = '';
    let combined = '';

    const allStream = new PassThrough();
    child.all = allStream;

    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const str = data.toString();
        stdout += str;
        combined += str;
        allStream.write(data);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        const str = data.toString();
        stderr += str;
        combined += str;
        allStream.write(data);
      });
    }

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    const promise = new Promise<ExecResult>((resolve, reject) => {
      child.on('close', (code: number | null) => {
        allStream.end();
        const result: ExecResult = { stdout, stderr, all: combined, exitCode: code };
        if (code === 0) {
          resolve(result);
        } else {
          const err = new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`);
          Object.assign(err, result);
          reject(err);
        }
      });

      child.on('error', (err: Error) => {
        allStream.end();
        reject(err);
      });
    });

    child.then = promise.then.bind(promise);
    child.catch = promise.catch.bind(promise);

    return child as ExecProcess;
  }

  /**
   * Shorthand for simple command strings.
   */
  static command(cmdLine: string, options: SpawnOptions & { input?: string, all?: boolean } = {}): ExecProcess {
    const [cmd, ...args] = cmdLine.split(/\s+/);
    return this.run(cmd, args, options);
  }
}
