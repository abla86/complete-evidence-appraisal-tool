import { clean, normalizeYear } from "./apa7.js";

export function classifyNorwegianLegalSource(kind) {
  if (kind === "LAW") return "LAW";
  if (kind === "REGULATION") return "REGULATION";
  return "UNKNOWN";
}

export function parseNorwegianLaw({ shortTitle = "", officialTitle = "", year, dateCode = "", url = "" }) {
  const normalizedYear = normalizeYear(year);
  const missing = [];
  if (!clean(shortTitle)) missing.push("shortTitle");
  if (!normalizedYear) missing.push("year");
  if (!clean(officialTitle)) missing.push("officialTitle");
  if (!clean(dateCode)) missing.push("dateCode");
  if (!/^https?:\/\/lovdata\.no\//i.test(clean(url))) missing.push("lovdataUrl");

  const status = missing.length ? "INCOMPLETE" : "COMPLETE";
  const reference = status === "COMPLETE"
    ? `${clean(shortTitle)}. (${normalizedYear}). ${clean(officialTitle)} (${clean(dateCode)}). Lovdata. ${clean(url)}`
    : "";

  return {
    kind: "LAW",
    status,
    missing,
    reference,
    warning: "Kontroller alltid at lov/forskrift er hentet fra riktig gjeldende autoritative kilde og at henvisningen gjelder riktig bestemmelse."
  };
}

export function parseNorwegianRegulation({ shortTitle = "", officialTitle = "", year, dateCode = "", url = "" }) {
  const normalizedYear = normalizeYear(year);
  const missing = [];
  if (!clean(shortTitle)) missing.push("shortTitle");
  if (!normalizedYear) missing.push("year");
  if (!clean(officialTitle)) missing.push("officialTitle");
  if (!clean(dateCode)) missing.push("dateCode");
  if (!/^https?:\/\/lovdata\.no\//i.test(clean(url))) missing.push("lovdataUrl");

  const status = missing.length ? "INCOMPLETE" : "COMPLETE";
  const reference = status === "COMPLETE"
    ? `${clean(shortTitle)}. (${normalizedYear}). ${clean(officialTitle)} (${clean(dateCode)}). Lovdata. ${clean(url)}`
    : "";

  return {
    kind: "REGULATION",
    status,
    missing,
    reference,
    warning: "Forskrifter skal ikke blandes med lovreferanser; kontroller korrekt forskriftsidentifikator og aktuell versjon."
  };
}
