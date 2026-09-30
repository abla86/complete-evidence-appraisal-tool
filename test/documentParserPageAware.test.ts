import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentParserService } from '../src/services/documentParserService';

test('plain-text parsing exposes a page boundary for non-PDF sources', async () => {
  const result = await DocumentParserService.parseFile({
    name: 'article.pdf',
    size: 24,
    type: 'application/pdf',
    content: 'First page-equivalent text.'
  });
  assert.deepEqual(result.pages, [{ pageNumber: 1, text: 'First page-equivalent text.' }]);
  assert.equal(result.extractedText, 'First page-equivalent text.');
});
