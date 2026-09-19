import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, generateVariants } from '../../server/engine/normalization.js';

describe('Normalization Engine Tests', () => {
  it('correctly folds case and strips non-alphanumeric punctuation', () => {
    const res = normalizeName('  Stripe, Inc.!  ');
    assert.equal(res.canonical, 'stripe inc');
    assert.equal(res.compact, 'stripeinc');
    assert.deepEqual(res.tokens, ['stripe', 'inc']);
  });

  it('correctly transliterates Nordic and European diacritics', () => {
    const res = normalizeName('Brønnøysund Ålesund Bærum');
    assert.equal(res.transliterated, 'broennoeysund aalesund baerum');
    assert.ok(res.variants.some(v => v.includes('broennoeysund')));
  });

  it('generates phonetic and spelling variants', () => {
    const variants = generateVariants('Klaro');
    assert.ok(variants.length >= 1);
    assert.ok(variants.some(v => v.includes('klaro')));
  });

  it('handles empty or edge case inputs gracefully', () => {
    const res = normalizeName('---');
    assert.equal(res.canonical, '');
    assert.equal(res.tokens.length, 0);
  });
});
