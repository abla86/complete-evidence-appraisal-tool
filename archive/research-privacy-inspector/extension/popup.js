/* global navigator */
const status = document.querySelector("#status");
const result = document.querySelector("#result");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}

function badge(label, value, tone = "ok") {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong class="${tone}">${escapeHtml(value)}</strong></div>`;
}

function render(data) {
  const p = data.page;
  const privacy = data.privacy;
  const a11y = data.accessibility;
  const r = data.reference;
  const trackingTone = privacy.trackingIndicatorCount > 0 ? "warn" : "ok";
  const a11yIssues = a11y.missingAlt + a11y.buttonsWithoutName;
  const metadataTone = r.metadataState === "COMPLETE" ? "ok" : "warn";
  const doiValue = p.doi || "Not detected";
  const doiStatus = p.doi ? (p.doiValid ? "Valid format" : "Invalid format") : "Not detected";

  result.innerHTML = `
    <section class="card">
      <h2>Research metadata</h2>
      <dl>
        <dt>Title</dt><dd>${escapeHtml(p.title || "Not detected")}</dd>
        <dt>Authors</dt><dd>${escapeHtml(p.authors || "Not detected")}</dd>
        <dt>Date</dt><dd>${escapeHtml(p.publicationDate || "Not detected")}</dd>
        <dt>Journal</dt><dd>${escapeHtml(p.journal || "Not detected")}</dd>
        <dt>Volume / issue</dt><dd>${escapeHtml([p.volume, p.issue].filter(Boolean).join(" / ") || "Not detected")}</dd>
        <dt>Pages</dt><dd>${escapeHtml(p.pages || "Not detected")}</dd>
        <dt>DOI</dt><dd>${escapeHtml(doiValue)}</dd>
        <dt>DOI format</dt><dd>${escapeHtml(doiStatus)}</dd>
      </dl>
    </section>

    <section class="card">
      <h2>Reference integrity</h2>
      ${badge("Metadata", r.metadataState, metadataTone)}
      ${badge("Verification", "NOT VERIFIED", "warn")}
      ${badge("Draft generation", r.canGenerateDraft ? "AVAILABLE" : "BLOCKED", r.canGenerateDraft ? "ok" : "warn")}
      <p>${escapeHtml(r.note)}</p>
      ${r.missingRequiredMetadata.length ? `<p class="warn">Missing: ${escapeHtml(r.missingRequiredMetadata.join(", "))}</p>` : ""}
      <button id="copy-draft" type="button" ${r.canGenerateDraft ? "" : "disabled"}>Copy APA 7 draft</button>
    </section>

    <section class="card">
      <h2>Privacy signals</h2>
      ${badge("External resources", privacy.externalResourceCount)}
      ${badge("Tracking indicators", privacy.trackingIndicatorCount, trackingTone)}
      ${privacy.trackingHosts.length ? `<p><strong>Detected hosts:</strong> ${escapeHtml(privacy.trackingHosts.join(", "))}</p>` : ""}
      <p>No data is transmitted by the extension itself.</p>
    </section>

    <section class="card">
      <h2>Accessibility signals</h2>
      ${badge("Images without alt", a11y.missingAlt, a11y.missingAlt ? "warn" : "ok")}
      ${badge("Empty alt", a11y.emptyAlt, a11y.emptyAlt ? "warn" : "ok")}
      ${badge("Unnamed buttons", a11y.buttonsWithoutName, a11y.buttonsWithoutName ? "warn" : "ok")}
      ${badge("H1 elements", a11y.h1Count)}
      ${badge("Main landmarks", a11y.mainCount)}
      <p>${a11yIssues ? "Potential accessibility issues detected." : "No basic issues detected by this check."}</p>
    </section>
  `;

  const copyButton = document.querySelector("#copy-draft");
  copyButton?.addEventListener("click", async () => {
    const draft = buildApa7Draft(p);
    await navigator.clipboard.writeText(draft);
    copyButton.textContent = "APA 7 draft copied";
  });
}

function buildApa7Draft(p) {
  const authors = p.authors || "[Authors not verified]";
  const year = p.publicationDate ? String(p.publicationDate).slice(0, 4) : "[year]";
  const title = p.title || "[Title missing]";
  const journal = p.journal || "[Journal missing]";
  const volume = p.volume ? `, ${p.volume}` : "";
  const issue = p.issue ? `(${p.issue})` : "";
  const pages = p.pages ? `, ${p.pages}` : "";
  const doi = p.doi ? ` https://doi.org/${p.doi}` : "";
  return `${authors} (${year}). ${title}. ${journal}${volume}${issue}${pages}.${doi}`;
}

(async () => {
  try {
    status.textContent = "Inspecting current page…";
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");

    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["analyzer.js"]
    });

    const data = results?.[0]?.result;
    if (!data) throw new Error("No inspection result returned.");
    render(data);
    status.textContent = "Inspection complete";
  } catch (error) {
    status.textContent = "This page cannot be inspected.";
    result.innerHTML = `<section class="card"><strong>${escapeHtml(error.message)}</strong></section>`;
  }
})();
