import { useMemo, useState } from 'react';

const CRITERIA = [
  'Er det samsvar mellom det oppgitte filosofiske perspektivet og forskningsmetodologien?',
  'Er det samsvar mellom forskningsmetodologien og forskningsspørsmålet eller formålet?',
  'Er det samsvar mellom forskningsmetodologien og metodene for datainnsamling?',
  'Er det samsvar mellom forskningsmetodologien og representasjonen og analysen av data?',
  'Er det samsvar mellom forskningsmetodologien og tolkningen av resultatene?',
  'Er det en redegjørelse som plasserer forskeren kulturelt eller teoretisk?',
  'Er forskerens innflytelse på forskningen, og omvendt, adressert?',
  'Er deltakerne og deres stemmer tilstrekkelig representert?',
  'Er forskningen etisk i henhold til gjeldende kriterier, og foreligger det dokumentasjon på etisk godkjenning?',
  'Fremstår konklusjonene som en direkte følge av analysen eller tolkningen av dataene?'
];

const RESPONSE_OPTIONS = [
  ['Yes', 'Ja'],
  ['No', 'Nei'],
  ['Unclear', 'Uklart'],
  ['NotApplicable', 'Ikke relevant']
];

const EMPTY_ITEM = (itemNumber) => ({ itemNumber, response: '', rationale: '', evidenceLocation: '' });

export default function JbiQualitativeAssessment() {
  const [studyTitle, setStudyTitle] = useState('');
  const [reviewerCode, setReviewerCode] = useState('');
  const [items, setItems] = useState(() => CRITERIA.map((_, index) => EMPTY_ITEM(index + 1)));
  const [overallAppraisal, setOverallAppraisal] = useState('');
  const [overallRationale, setOverallRationale] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const completed = useMemo(() => items.filter(item => item.response && item.rationale.trim() && item.evidenceLocation.trim()).length, [items]);

  function updateItem(itemNumber, field, value) {
    setItems(current => current.map(item => item.itemNumber === itemNumber ? { ...item, [field]: value } : item));
    setResult(null);
  }

  async function validateAssessment(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    const payload = {
      instrumentId: 'jbi-qualitative-2017',
      instrumentVersion: '2017',
      studyTitle,
      reviewerCode,
      items: items.map(item => ({
        itemNumber: item.itemNumber,
        response: item.response || null,
        rationale: item.rationale,
        evidenceLocation: item.evidenceLocation
      })),
      overallAppraisal: overallAppraisal || null,
      overallAppraisalRationale: overallRationale
    };

    try {
      const response = await fetch('/api/jbi/qualitative-2017/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Validering av JBI-vurderingen mislyktes.');
      setResult(body);
    } catch (requestError) {
      setError(requestError.message || 'Kunne ikke validere vurderingen.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="method-card" aria-labelledby="jbi-heading">
      <div className="method-card-heading">
        <div>
          <p className="eyebrow">JBI · Critical Appraisal Checklist for Qualitative Research</p>
          <h2 id="jbi-heading">Kvalitativ vurdering (2017)</h2>
        </div>
        <span className="pill">10 kriterier · forskerstyrt</span>
      </div>

      <div className="notice notice-warning">
        <strong>Metodisk avgrensning:</strong> Denne modulen implementerer validering av struktur, svar, begrunnelse og evidenslokasjon for den eksplisitte 2017-versjonen. Den lager ikke en automatisk kvalitets- eller inklusjonsscore.
      </div>

      <form onSubmit={validateAssessment}>
        <div className="form-grid">
          <label>Studietittel<input value={studyTitle} onChange={event => setStudyTitle(event.target.value)} required /></label>
          <label>Reviewer-kode<input value={reviewerCode} onChange={event => setReviewerCode(event.target.value)} required /></label>
        </div>

        <div className="jbi-items">
          {items.map(item => (
            <article className="jbi-item" key={item.itemNumber}>
              <div className="jbi-item-heading">
                <strong>Kriterium {item.itemNumber}</strong>
                <span>{CRITERIA[item.itemNumber - 1]}</span>
              </div>
              <div className="form-grid">
                <label>Svar<select value={item.response} onChange={event => updateItem(item.itemNumber, 'response', event.target.value)} required><option value="">Velg</option>{RESPONSE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Evidenslokasjon<input value={item.evidenceLocation} onChange={event => updateItem(item.itemNumber, 'evidenceLocation', event.target.value)} placeholder="f.eks. s. 5, avsnitt Methods" required /></label>
              </div>
              <label>Begrunnelse<textarea value={item.rationale} onChange={event => updateItem(item.itemNumber, 'rationale', event.target.value)} rows="3" required /></label>
            </article>
          ))}
        </div>

        <div className="form-grid">
          <label>Samlet forskervurdering<select value={overallAppraisal} onChange={event => setOverallAppraisal(event.target.value)} required><option value="">Velg</option><option value="Include">Inkluder</option><option value="Exclude">Ekskluder</option><option value="SeekFurtherInformation">Innhent mer informasjon</option></select></label>
          <label>Begrunnelse for samlet vurdering<textarea value={overallRationale} onChange={event => setOverallRationale(event.target.value)} rows="3" required /></label>
        </div>

        <div className="button-row">
          <button type="submit" disabled={submitting}>{submitting ? 'Validerer …' : 'Valider vurdering'}</button>
          <span aria-live="polite">{completed}/10 kriterier komplett</span>
        </div>
      </form>

      {error && <div className="message message-error" role="alert">{error}</div>}
      {result && <div className={result.isValid ? 'notice notice-success' : 'notice notice-warning'} role="status">
        <strong>{result.isValid ? 'Strukturelt gyldig vurdering' : 'Vurderingen må korrigeres'}</strong>
        <p>{result.completedItems}/{result.expectedItems} kriterier er komplette.</p>
        {result.errors?.length > 0 && <ul>{result.errors.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      </div>}
    </section>
  );
}
