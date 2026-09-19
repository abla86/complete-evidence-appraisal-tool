export default function AnalysisVerification({ finding, onVerify }) {
  if (!finding) return null;

  return (
    <section className="verification-card" aria-label="Forskerverifisering">
      <div className="system-suggestion">
        <p className="eyebrow">Systemets kandidatfunn</p>
        <h4>{finding.topic}</h4>
        <p>Funnet i teksten: <em>«…{finding.excerpt}…»</em></p>
        <p className="muted">
          Trigger: <code>{finding.matchedTerm}</code> · side {finding.page}
        </p>
      </div>
      <div className="researcher-action">
        <label htmlFor={`verification-${finding.instrument}-${finding.topic}-${finding.page}`}>
          Forskerens begrunnelse
          <textarea
            id={`verification-${finding.instrument}-${finding.topic}-${finding.page}`}
            rows="3"
            placeholder="Forklar hvorfor funnet bekreftes, avvises eller forblir usikkert."
            defaultValue={finding.verificationNote ?? ''}
          />
        </label>
        <div className="button-row">
          <button type="button" className="primary-button" onClick={() => onVerify('Verified')}>
            Bekreft funn
          </button>
          <button type="button" className="secondary-button" onClick={() => onVerify('Rejected')}>
            Avvis funn
          </button>
          <button type="button" className="secondary-button" onClick={() => onVerify('Uncertain')}>
            Marker usikkert
          </button>
        </div>
      </div>
    </section>
  );
}
