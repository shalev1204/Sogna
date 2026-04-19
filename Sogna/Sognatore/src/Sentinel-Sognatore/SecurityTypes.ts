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
