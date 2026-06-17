/** Minimal Node globals for browser-targeted packages that guard on NODE_ENV. */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function require(moduleName: string): any;
