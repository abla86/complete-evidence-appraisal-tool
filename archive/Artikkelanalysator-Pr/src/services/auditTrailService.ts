export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userEmail?: string;
  documentHash?: string;
  isVerified: boolean;
}

export class AuditTrailService {
  private static logs: AuditLogEntry[] = [];

  public static log(action: string, details: string, isVerified: boolean, documentHash?: string): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      isVerified,
      documentHash
    };
    this.logs.unshift(entry);
    return entry;
  }

  public static getLogs(): AuditLogEntry[] {
    return this.logs;
  }
}
