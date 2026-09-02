import assert from 'node:assert/strict';
import test from 'node:test';
import { AuditTrailService } from '../src/services/auditTrailService';

const actor = { id: 'reviewer-1', role: 'reviewer' as const };

test('creates a verifiable hash chain', async () => {
  const audit = new AuditTrailService();
  await audit.append({ actor, action: 'A', subject: { entityType: 'source_record', id: 'r1' } });
  await audit.append({ actor, action: 'B', subject: { entityType: 'source_record', id: 'r1' }, detail: { state: 'reviewed' } });
  await audit.append({ actor, action: 'C', subject: { entityType: 'source_record', id: 'r1' } });

  assert.equal(audit.list().length, 3);
  assert.equal((await audit.verify()).valid, true);
  assert.notEqual(audit.list()[0].entryHash, audit.list()[1].entryHash);
  assert.equal(audit.list()[1].previousEntryHash, audit.list()[0].entryHash);
});

test('detects tampering of an audit entry', async () => {
  const audit = new AuditTrailService();
  await audit.append({ actor, action: 'A', subject: { entityType: 'source_record', id: 'r1' } });
  await audit.append({ actor, action: 'B', subject: { entityType: 'source_record', id: 'r1' } });

  const internal = audit as unknown as { entries: Array<Record<string, unknown>> };
  internal.entries[0].action = 'TAMPERED';

  const verification = await audit.verify();
  assert.equal(verification.valid, false);
  assert.equal(verification.firstInvalidIndex, 0);
});
