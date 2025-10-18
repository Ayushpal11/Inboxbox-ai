declare module 'mailparser';

// Minimal types used by this project
declare module 'mailparser' {
  export function simpleParser(source: Buffer | string): Promise<any>;
}
