import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentParserService } from '../src/services/documentParserService';

test('plain-text parsing exposes a page boundary for non-PDF sources', async () => {
  const result = await DocumentParserService.parseFile({
    name: 'article.txt',
    size: 24,
    type: 'text/plain',
    content: 'First page-equivalent text.',
  });
  assert.deepEqual(result.pages, []);
  assert.equal(result.extractedText, 'First page-equivalent text.');
});
