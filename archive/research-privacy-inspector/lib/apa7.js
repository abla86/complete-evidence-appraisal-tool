export function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeDoi(raw = "") {
  return clean(raw)
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/[.,;:)]+$/, "");
}

export function isValidDoi(raw = "") {
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(normalizeDoi(raw));
}

export function normalizeYear(raw) {
  const year = raw === undefined || raw === null ? "" : String(raw).trim();
  return /^(?:1[5-9]\d{2}|20\d{2}|21\d{2})$/.test(year) ? year : "";
}

export function formatApaAuthors(authors = []) {
  const list = authors.map(clean).filter(Boolean);
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]}, & ${list[1]}`;
  if (list.length <= 20) return `${list.slice(0, -1).join(", ")}, & ${list[list.length - 1]}`;
  return `${list.slice(0, 19).join(", ")}, ... ${list[list.length - 1]}`;
}

export function sentenceCaseTitle(title = "") {
  const value = clean(title);
  if (!value) return "";
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

export function buildJournalArticleReference({
  authors = [], year, title, journal, volume, issue, pages, articleNumber, doi, url
}) {
  const normalizedYear = normalizeYear(year);
  const authorText = formatApaAuthors(authors);
  const titleText = sentenceCaseTitle(title);
  const journalText = clean(journal);
  if (!authorText || !normalizedYear || !titleText || !journalText) return "";

  const container = [
    journalText,
    clean(volume) ? `, ${clean(volume)}` : "",
    clean(issue) ? `(${clean(issue)})` : "",
    clean(pages || articleNumber) ? `, ${clean(pages || articleNumber)}` : ""
  ].join("");

  const normalizedDoi = normalizeDoi(doi);
  const locator = normalizedDoi
    ? `https://doi.org/${normalizedDoi}`
    : clean(url);

  return `${authorText} (${normalizedYear}). ${titleText} ${container}.${locator ? ` ${locator}` : ""}`;
}

export function classifyMetadata({ authors = [], year, title, journal, doi, url }) {
  const missing = [];
  if (!authors.length) missing.push("authors");
  if (!normalizeYear(year)) missing.push("year");
  if (!clean(title)) missing.push("title");
  if (!clean(journal)) missing.push("journal");
  if (!normalizeDoi(doi) && !clean(url)) missing.push("doiOrUrl");

  if (missing.length >= 3) return "UNVERIFIABLE";
  if (missing.length > 0) return "INCOMPLETE";
  return "COMPLETE";
}
