import { useMemo, useState } from 'react';

const instrumentCatalog = [
  ['amstar2', 'AMSTAR 2', 'Kritisk vurdering av systematiske oversikter.'],
  ['casp-qualitative-2024', 'CASP', 'Studiespesifikk kritisk vurdering.'],
  ['jbi-qualitative-2017', 'JBI kvalitativ', 'Kvalitativ forskningsvurdering, versjon 2017.'],
  ['agree2', 'AGREE II', 'Vurdering av kliniske retningslinjer.'],
  ['grade', 'GRADE', 'Vurdering av sikkerhet per utfall.'],
  ['rob2', 'RoB 2', 'Risiko for bias i randomiserte studier.'],
];

const ruleCatalog = [
  ['humanVerificationRequired', 'Forskerverifisering', 'Krev eksplisitt forskerverifisering før evidens kan regnes som verifisert.'],
  ['dualReview', 'Dual review', 'Bruk to uavhengige reviewere og konflikt-/konsensusflyt.'],
  ['prismaTracking', 'PRISMA-sporing', 'Registrer screening, eksklusjoner og inklusjon for PRISMA-flyt.'],
  ['auditTrail', 'Audit trail', 'Behold endringshistorikk og integritetsspor.'],
  ['doiLookup', 'DOI-oppslag', 'Hent og forhåndsutfyll bibliografiske metadata.'],
  ['picoAssistance', 'PICO-assistanse', 'Tillat maskinstøttet PICO/PECO-ekstraksjon som kandidatforslag.'],
  ['pdfEvidenceMapping', 'PDF-evidenskart', 'Koble kandidatfunn til dokument- og sideinformasjon.'],
  ['offlineMode', 'Offline-modus', 'Tillat lokal arbeidskø og senere synkronisering.'],
  ['includePageText', 'Ekstraher sidetekst', 'Ta med ekstraherte tekstpassasjer i resultatdata.'],
];

export default function PreAppraisalSetup({ defaultCriticalDomains = [], initialWorkflowRules, onConfirmed }) {
  const availableItems = useMemo(() => Array.from({ length: 16 }, (_, index) => index + 1), []);
  const [reviewTitle, setReviewTitle] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState(['amstar2']);
  const [reviewer, setReviewer] = useState('');
  const [criticalDomains, setCriticalDomains] = useState(() => [...defaultCriticalDomains]);
  const [rationales, setRationales] = useState({});
  const [rules, setRules] = useState(() => ({
    humanVerificationRequired: true,
    dualReview: false,
    prismaTracking: true,
    auditTrail: true,
    doiLookup: true,
    picoAssistance: false,
    pdfEvidenceMapping: true,
    offlineMode: false,
    includePageText: false,
    ...(initialWorkflowRules ?? {}),
  }));
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleInstrument(id) {
    setConfirmed(false);
    setSelectedInstruments((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function toggleCriticalDomain(itemNumber) {
    setConfirmed(false);
    setCriticalDomains((current) => current.includes(itemNumber)
      ? current.filter((item) => item !== itemNumber)
      : [...current, itemNumber].sort((a, b) => a - b));
  }

  function updateRationale(itemNumber, value) {
    setConfirmed(false);
    setRationales((current) => ({ ...current, [itemNumber]: value }));
  }

  function toggleRule(ruleId) {
    setConfirmed(false);
    setRules((current) => ({ ...current, [ruleId]: !current[ruleId] }));
  }

  function validate() {
    const nextErrors = {};
    if (!reviewTitle.trim()) nextErrors.reviewTitle = 'Prosjekttittel er obligatorisk.';
    if (!reviewer.trim()) nextErrors.reviewer = 'Navn eller identifikator for vurderer er obligatorisk.';
    if (selectedInstruments.length === 0) nextErrors.instruments = 'Velg minst ett vurderingsinstrument.';
    if (selectedInstruments.includes('amstar2') && criticalDomains.length === 0) nextErrors.criticalDomains = 'Minst ett kritisk domene må forhåndsdefineres.';
    if (selectedInstruments.includes('amstar2')) criticalDomains.forEach((itemNumber) => {
      if (!rationales[itemNumber]?.trim()) nextErrors[`rationale-${itemNumber}`] = `Begrunnelse for punkt ${itemNumber} er obligatorisk.`;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setConfirmed(false);
    if (!validate()) return;

    const setup = {
      reviewTitle: reviewTitle.trim(),
      reviewer: reviewer.trim(),
      enabledInstruments: selectedInstruments,
      criticalDomains: criticalDomains.map((itemNumber) => ({
        itemNumber,
        rationale: rationales[itemNumber].trim(),
      })),
      workflowRules: { ...rules },
    };

    setSaving(true);
    Promise.resolve(onConfirmed(setup)).then(() => setConfirmed(true)).finally(() => setSaving(false));
  }

  return (
    <section className="setup-card" aria-labelledby="workflow-setup-heading">
      <div className="setup-heading">
        <div>
          <p className="eyebrow">Før vurderingen starter</p>
          <h2 id="workflow-setup-heading">Forhåndsdefiner vurderingsoppsettet</h2>
        </div>
        <span className="local-only">Prosjektkonfigurasjon</span>
      </div>

      <p className="setup-introduction">
        Velg hvilke regler og støttetjenester prosjektet faktisk skal bruke. Funksjoner som slås av skal ikke dukke opp som skjulte krav senere i arbeidsflyten.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-grid">
          <div className="form-field">
            <label htmlFor="review-title">Prosjekttittel <span aria-hidden="true"> *</span></label>
            <input id="review-title" type="text" value={reviewTitle} onChange={(event) => { setReviewTitle(event.target.value); setConfirmed(false); }} aria-invalid={Boolean(errors.reviewTitle)} />
            {errors.reviewTitle && <p className="field-error" role="alert">{errors.reviewTitle}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="reviewer">Vurderer <span aria-hidden="true"> *</span></label>
            <input id="reviewer" type="text" value={reviewer} onChange={(event) => { setReviewer(event.target.value); setConfirmed(false); }} aria-invalid={Boolean(errors.reviewer)} />
            {errors.reviewer && <p className="field-error" role="alert">{errors.reviewer}</p>}
          </div>
        </div>

        <section className="critical-fieldset" aria-labelledby="instrument-heading">
          <div className="setup-subheading"><h3 id="instrument-heading">Vurderingsinstrumenter</h3><p className="fieldset-help">Velg hvilke metodiske motorer som skal inngå i prosjektet.</p></div>
          {errors.instruments && <p className="field-error" role="alert">{errors.instruments}</p>}
          <div className="rule-grid">{instrumentCatalog.map(([id, label, help]) => <label key={id} className={selectedInstruments.includes(id) ? 'checkbox-card rule-card rule-card-enabled' : 'checkbox-card rule-card'}><input type="checkbox" checked={selectedInstruments.includes(id)} onChange={() => toggleInstrument(id)} /><span><strong>{label}</strong><small>{help}</small></span></label>)}</div>
        </section>

        <section className="critical-fieldset" aria-labelledby="workflow-rules-heading">
          <div className="setup-subheading">
            <h3 id="workflow-rules-heading">Prosjektregler og arbeidsflyt</h3>
            <p className="fieldset-help">Valg kan endres før prosjektet låses. Avslåtte funksjoner er ikke skjulte metodiske krav.</p>
          </div>
          <div className="rule-grid">
            {ruleCatalog.map(([id, label, help]) => (
              <label key={id} className={rules[id] ? 'checkbox-card rule-card rule-card-enabled' : 'checkbox-card rule-card'}>
                <input type="checkbox" checked={Boolean(rules[id])} onChange={() => toggleRule(id)} />
                <span>
                  <strong>{label}</strong>
                  <small>{help}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <fieldset className="critical-fieldset">
          <legend>Forhåndsdefinerte kritiske domener</legend>
          <p className="fieldset-help">Standardforslaget er forhåndsvalgt. Endringer må gjøres før selve vurderingen og begrunnes eksplisitt.</p>
          {errors.criticalDomains && <p className="field-error" role="alert">{errors.criticalDomains}</p>}
          {selectedInstruments.includes('amstar2') && <div className="domain-list">
            {availableItems.map((itemNumber) => {
              const selected = criticalDomains.includes(itemNumber);
              return (
                <div className={selected ? 'domain-row domain-row-selected' : 'domain-row'} key={itemNumber}>
                  <label className="domain-choice">
                    <input type="checkbox" checked={selected} onChange={() => toggleCriticalDomain(itemNumber)} />
                    <span>
                      Punkt {itemNumber}
                      {defaultCriticalDomains.includes(itemNumber) && <small>Foreslått standarddomene</small>}
                    </span>
                  </label>
                  {selected && (
                    <div className="rationale-field">
                      <label htmlFor={`rationale-${itemNumber}`}>Forhåndsbegrunnelse for punkt {itemNumber} <span aria-hidden="true"> *</span></label>
                      <textarea id={`rationale-${itemNumber}`} rows="3" value={rationales[itemNumber] ?? ''} onChange={(event) => updateRationale(itemNumber, event.target.value)} aria-invalid={Boolean(errors[`rationale-${itemNumber}`])} />
                      {errors[`rationale-${itemNumber}`] && <p className="field-error" role="alert">{errors[`rationale-${itemNumber}`]}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>}
        </fieldset>

        <div className="notice-inline">
          <strong>Transparent konfigurasjon:</strong> Disse valgene følger prosjektet videre til analyse, verifisering, audit og eksport. Endringer etter finalisering skal ikke være mulig.
        </div>

        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Lagrer …' : 'Lagre prosjektoppsettet'}</button>
      </form>

      {confirmed && (
        <div className="confirmation" role="status" aria-live="polite">
          <strong>Prosjektoppsettet er kontrollert.</strong>
          <span>{Object.values(rules).filter(Boolean).length} arbeidsflytregler er aktive. Konfigurasjonen sendes videre som prosjektets styrende regler.</span>
        </div>
      )}
    </section>
  );
}
