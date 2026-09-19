import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDoi,
  isValidDoi,
  normalizeYear,
  formatApaAuthors,
  buildJournalArticleReference,
  classifyMetadata
} from "../lib/apa7.js";
import { parseNorwegianLaw, parseNorwegianRegulation } from "../lib/norskLov.js";

test("normalizes DOI without network access", () => {
  assert.equal(normalizeDoi("https://doi.org/10.1000/xyz123."), "10.1000/xyz123");
  assert.equal(isValidDoi("10.1000/xyz123"), true);
  assert.equal(isValidDoi("not-a-doi"), false);
});

test("validates publication year", () => {
  assert.equal(normalizeYear(2026), "2026");
  assert.equal(normalizeYear("20x6"), "");
});

test("formats APA author list deterministically", () => {
  assert.equal(formatApaAuthors(["Hansen, K."]), "Hansen, K.");
  assert.equal(formatApaAuthors(["Hansen, K.", "Olsen, T."]), "Hansen, K., & Olsen, T.");
});

test("builds a journal article draft without claiming verification", () => {
  const ref = buildJournalArticleReference({
    authors: ["Hansen, K.", "Olsen, T."],
    year: 2025,
    title: "A study of evidence",
    journal: "Example Journal",
    volume: 10,
    issue: 2,
    pages: "10-20",
    doi: "https://doi.org/10.1000/example"
  });
  assert.equal(ref, "Hansen, K., & Olsen, T. (2025). A study of evidence. Example Journal, 10(2), 10-20. https://doi.org/10.1000/example");
});

test("metadata completeness never implies source verification", () => {
  assert.equal(classifyMetadata({
    authors: ["Hansen, K."], year: 2025, title: "Title", journal: "Journal", doi: "10.1000/x"
  }), "COMPLETE");
});

test("parses Norwegian law separately from ordinary APA article logic", () => {
  const r = parseNorwegianLaw({
    shortTitle: "Helsepersonelloven",
    year: 1999,
    officialTitle: "Lov om helsepersonell m.v.",
    dateCode: "LOV-1999-07-02-64",
    url: "https://lovdata.no/lov/1999-07-02-64"
  });
  assert.equal(r.status, "COMPLETE");
  assert.match(r.reference, /Helsepersonelloven/);
});

test("parses Norwegian regulation separately", () => {
  const r = parseNorwegianRegulation({
    shortTitle: "Forskrift X",
    year: 2020,
    officialTitle: "Forskrift om X",
    dateCode: "FOR-2020-01-01-1",
    url: "https://lovdata.no/forskrift/2020-01-01-1"
  });
  assert.equal(r.status, "COMPLETE");
  assert.match(r.reference, /Forskrift X/);
});
