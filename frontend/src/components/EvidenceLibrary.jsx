export default function EvidenceLibrary() {
  return <section className="research-hub" aria-labelledby="evidence-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="evidence-heading">Evidence &amp; traceability</h2>
    <p>Et forskningsverktøy må skille mellom kilden, forskerens vurdering og programmets strukturelle validering.</p>
    <div className="research-grid">
      <article className="assessment-card"><h3>Kildereferanse</h3><p>Registrer DOI, full referanse eller offisiell URL i vurderingsarbeidet.</p></article>
      <article className="assessment-card"><h3>Evidenslokasjon</h3><p>Bruk side, tabell, figur, avsnitt, vedlegg eller annen presis lokasjon når det er mulig.</p></article>
      <article className="assessment-card"><h3>Forskerens begrunnelse</h3><p>Begrunn vurderingen eksplisitt. Programmet skal ikke utlede eller oppfinne begrunnelsen.</p></article>
      <article className="assessment-card"><h3>Reviewer-identitet</h3><p>Bruk pseudonyme koder i prototypen. Ikke legg inn direkte identifiserende eller konfidensielle forskningsdata.</p></article>
    </div>
    <section className="notice notice-warning"><h3>Metodisk grense</h3><p>Verktøyet dokumenterer og validerer registrerte data. Det erstatter ikke originalartikkelen, autoriserte instrumenter, protokoll, metodeveiledning eller forskerens faglige skjønn.</p></section>
  </section>;
}
