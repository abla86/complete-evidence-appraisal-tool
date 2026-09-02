import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { importReferences } from './referenceImportService.ts';

describe('reference import boundary', () => {
  it('imports RIS records without auto-verification', () => {
    const result = importReferences(
      'TY  - JOUR\nTI  - Test article\nAU  - Doe, Jane\nJO  - Test Journal\nPY  - 2025\nDO  - 10.1000/test\nER  -',
      'RIS',
    );
    assert.equal(result.errors.length, 0);
    assert.equal(result.references.length, 1);
    assert.notEqual(result.references[0].verification, 'VALIDATED');
  });

  it('rejects an actually unsupported import format', () => {
    const result = importReferences('anything', 'UNSUPPORTED' as never);
    assert.equal(result.references.length, 0);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /krever metadataoppslag|manuell registrering/i);
  });
});
