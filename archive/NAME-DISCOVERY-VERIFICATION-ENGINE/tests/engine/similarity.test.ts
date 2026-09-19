import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  ngramSimilarity,
  soundex,
  compareNames,
} from '../../server/engine/similarity.js';

describe('Similarity Engine Tests', () => {
  it('computes exact identity correctly', () => {
    const sim = compareNames('Spotify', 'Spotify');
    assert.equal(sim.levenshtein, 1.0);
    assert.equal(sim.jaroWinkler, 1.0);
    assert.equal(sim.phonetic, 1.0);
    assert.ok(sim.compositeScore >= 0.98);
  });

  it('detects high similarity between minor typo variants', () => {
    const sim = compareNames('Spotify', 'Spotifi');
    assert.ok(sim.jaroWinkler >= 0.85);
    assert.ok(sim.compositeScore >= 0.75);
  });

  it('computes low similarity for completely unrelated names', () => {
    const sim = compareNames('Apple', 'Zircon');
    assert.ok(sim.compositeScore < 0.40);
    assert.ok(sim.phonetic < 0.80);
  });

  it('generates consistent Soundex phonetic codes', () => {
    const code1 = soundex('Robert');
    const code2 = soundex('Rupert');
    assert.equal(code1, code2); // Classic Soundex property
  });

  it('handles N-gram character dice similarity accurately', () => {
    const score = ngramSimilarity('night', 'nacht', 2);
    assert.ok(score >= 0 && score <= 1);
  });
});
