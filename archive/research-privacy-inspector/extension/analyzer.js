function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function firstMeta(names) {
  for (const name of names) {
    const selectorName = CSS.escape(name);
    const el = document.querySelector(`meta[name="${selectorName}"]`) ||
      document.querySelector(`meta[property="${selectorName}"]`);
    if (el?.content) return clean(el.content);
  }
  return "";
}

function metaAll(names) {
  const values = [];
  for (const name of names) {
    const selectorName = CSS.escape(name);
    values.push(
      ...[...document.querySelectorAll(`meta[name="${selectorName}"]`)].map(el => clean(el.content)),
      ...[...document.querySelectorAll(`meta[property="${selectorName}"]`)].map(el => clean(el.content))
    );
  }
  return [...new Set(values.filter(Boolean))];
}

function detectDoi(text) {
  const match = String(text || "").match(/\b10\.\d{4,9}\/(?:[-._;()/:A-Z0-9])+\b/i);
  return match ? match[0].replace(/[.,;:)]+$/, "") : "";
}

function normalizeDoi(raw) {
  return clean(raw)
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/[.,;:)]+$/, "");
}

function isValidDoi(raw) {
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(normalizeDoi(raw));
}

/* global URL */
function canonicalUrl(raw) {
  if (!raw) return "";
  try { return new URL(raw, location.href).href; } catch { return ""; }
}

function collectExternalResources() {
  const urls = [];
  for (const el of document.querySelectorAll("script[src], img[src], iframe[src], link[href], video[src], audio[src]")) {
    const raw = el.src || el.href;
    const url = canonicalUrl(raw);
    if (url && new URL(url).origin !== location.origin) urls.push(url);
  }
  return [...new Set(urls)];
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return ""; }
}

function accessibility() {
  const images = [...document.images];
  const missingAlt = images.filter(img => !img.hasAttribute("alt")).length;
  const emptyAlt = images.filter(img => img.hasAttribute("alt") && img.alt.trim() === "").length;
  const h1Count = document.querySelectorAll("h1").length;
  const mainCount = document.querySelectorAll("main,[role=\"main\"]").length;
  const buttonsWithoutName = [...document.querySelectorAll("button,[role=\"button\"]")]
    .filter(el => !clean(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title"))).length;
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];
  return { missingAlt, emptyAlt, h1Count, mainCount, buttonsWithoutName, headingCount: headings.length };
}

function analyze() {
  const text = clean(document.body?.innerText || "");
  const doiRaw = firstMeta(["citation_doi", "dc.identifier", "DC.Identifier"]) || detectDoi(text);
  const doi = normalizeDoi(doiRaw);
  const authors = metaAll(["citation_author", "author", "dc.creator", "DC.Creator"]).join("; ");
  const publicationDate = firstMeta(["citation_publication_date", "article:published_time", "date", "dc.date", "DC.Date"]);
  const journal = firstMeta(["citation_journal_title", "citation_journal_abbrev", "journal"]);
  const volume = firstMeta(["citation_volume"]);
  const issue = firstMeta(["citation_issue"]);
  const firstPage = firstMeta(["citation_firstpage"]);
  const lastPage = firstMeta(["citation_lastpage"]);
  const title = firstMeta(["citation_title", "og:title", "dc.title", "DC.Title"]) || clean(document.title);
  const description = firstMeta(["citation_abstract", "description", "og:description"]);
  const pageUrl = canonicalUrl(location.href);

  const externalResources = collectExternalResources();
  const trackingMarkers = [
    "google-analytics.com", "googletagmanager.com", "doubleclick.net", "connect.facebook.net",
    "hotjar.com", "matomo", "clarity.ms", "segment.io", "amplitude.com", "mixpanel.com"
  ];
  const tracking = externalResources
    .map(hostOf)
    .filter(host => trackingMarkers.some(marker => host === marker || host.endsWith(`.${marker}`)));

  const access = accessibility();
  const metadata = {
    title,
    authors,
    publicationDate,
    journal,
    volume,
    issue,
    pages: firstPage && lastPage ? `${firstPage}-${lastPage}` : firstPage,
    doi,
    doiValid: doi ? isValidDoi(doi) : false,
    description,
    url: pageUrl,
    authorCount: metaAll(["citation_author"]).length
  };

  const missingRequiredMetadata = [
    ["title", metadata.title],
    ["authors", metadata.authors],
    ["publicationDate", metadata.publicationDate]
  ].filter(([, value]) => !value).map(([key]) => key);

  if (metadata.doi && !metadata.doiValid) missingRequiredMetadata.push("validDoi");

  const metadataState = missingRequiredMetadata.length === 0 ? "COMPLETE" : "INCOMPLETE";

  return {
    page: metadata,
    privacy: {
      externalResourceCount: externalResources.length,
      trackingIndicatorCount: tracking.length,
      trackingHosts: [...new Set(tracking)],
      externalHosts: [...new Set(externalResources.map(hostOf).filter(Boolean))]
    },
    accessibility: access,
    reference: {
      metadataState,
      missingRequiredMetadata,
      verificationState: "NOT_VERIFIED",
      canGenerateDraft: missingRequiredMetadata.length === 0,
      note: "Metadata is detected locally. This extension does not independently verify bibliographic truth; treat output as a draft until verified against the authoritative source."
    }
  };
}

analyze();
