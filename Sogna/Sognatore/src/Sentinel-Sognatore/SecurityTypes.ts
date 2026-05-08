export enum PermissionMode {
  ReadOnly = 'readonly',
  Balanced = 'balanced',
  Full = 'full'
}

export interface ValidationResult {
  allow: boolean;
  warn?: boolean;
  reason?: string;
}

export interface SignatureEntry {
  hash: string;
  timestamp: string;
  [key: string]: unknown;
}
