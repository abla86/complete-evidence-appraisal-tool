import { useMemo, useState } from 'react';
import {
  ROB2_DOMAINS,
  ROB2_OPTIONS,
  ROB2_SOURCE,
  calculateRob2Overall,
  createEmptyRob2Domains,
  validateRob2Drafts,
} from '../domain/rob2Assessment';

const labels = {
  Low: 'Lav risiko for bias',
  SomeConcerns: 'Noen betenkeligheter',
  High: 'Høy risiko for bias',
};

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

export default function Rob2Assessment({ setup }) {
  const [domains, setDomains] = useState(createEmptyRob2Domains);
  const [errors, setErrors] = useState({});
  const [validated, setValidated] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [serverError, setServerError] = useState('');

  const overall = useMemo(() => calculateRob2Overall(domains), [domains]);
  const multipleConcerns = domains.filter((domain) => domain.rating === 'SomeConcerns').length > 1;

  function updateDomain(domainId, field, value) {
    setValidated(false);
    setServerResult(null);
    setServerError('');
    setErrors({});
    setDomains((current) => current.map((domain) => (
      domain.domainId === domainId ? { ...domain, [field]: value } : domain
    )));
  }

  async function validate(event) {
    event.preventDefault();
    const nextErrors = validateRob2Drafts(domains);
    setErrors(nextErrors);
    setServerResult(null);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) {
      setValidated(false);
      return;
    }

    const assessment = {
      instrumentName: 'Cochrane Risk of Bias 2 (RoB 2)',
      instrumentVersion: '2019',
      reviewTitle: setup?.reviewTitle?.trim() || 'RoB 2-vurdering',
      reviewer: setup?.reviewer?.trim() || 'Researcher',
      assessmentDateUtc: new Date().toISOString(),
      domains: domains.map((domain) => ({
        domainId: domain.domainId,
        rating: domain.rating,
        rationale: domain.rationale.trim(),
        evidenceLocation: domain.evidenceLocation.trim(),
      })),
      overallRiskOfBias: overall,
      overallRationale: multipleConcerns
        ? 'Flere domener er vurdert med noen betenkeligheter; samlet vurdering krever forskerens metodiske gjennomgang.'
        : null,
      overallJudgementOverridden: false,
    };

    try {
      const response = await fetch(`${API}/api/rob2/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.title || `Validering feilet (${response.status})`);
      setServerResult(data);
      setValidated(data.isValid);
    } catch (error) {
      setServerError(error.message);
      setValidated(false);
    }
  }

  return (
    <section className="assessment-card">
      <div className="assessment-heading">
        <div>
          <p className="eyebrow">Cochrane Risk of Bias 2</p>
          <h2>RoB 2 – randomiserte kontrollerte studier</h2>
          <p>Resultatspesifikk vurdering med fem obligatoriske biasdomener.</p>
        </div>
        <span className="local-only">Prototype – forskervurdering</span>
      </div>

      <div className="notice-inline">
        RoB 2 bruker signalspørsmål og algoritmer til å støtte domenevurderinger. Denne prototypen registrerer domenevurderingen og begrunnelsen; den gjengir ikke de autoriserte signalspørsmålene.
      </div>

      {setup && (
        <div className="summary-box">
          <span>Vurdering</span>
          <strong>{setup.reviewTitle}</strong>
          <small>Vurderer: {setup.reviewer}</small>
        </div>
      )}

      <form onSubmit={validate} noValidate>
        <div className="assessment-items">
          {ROB2_DOMAINS.map((domain) => {
            const item = domains.find((candidate) => candidate.domainId === domain.id);
            const itemErrors = errors[domain.id] ?? [];

            return (
              <fieldset className={itemErrors.length ? 'item-card item-card-error' : 'item-card'} key={domain.id}>
                <legend>{domain.id}: {domain.label}</legend>
                <p className="item-guidance">{domain.fullText}</p>

                <div className="form-field">
                  <label htmlFor={`rob2-rating-${domain.id}`}>Risiko for bias</label>
                  <select
                    id={`rob2-rating-${domain.id}`}
                    value={item.rating ?? ''}
                    onChange={(event) => updateDomain(domain.id, 'rating', event.target.value || null)}
                  >
                    <option value="">Velg vurdering</option>
                    {ROB2_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor={`rob2-evidence-${domain.id}`}>Dokumentasjonssted</label>
                  <input
                    id={`rob2-evidence-${domain.id}`}
                    type="text"
                    value={item.evidenceLocation}
                    placeholder="Side, tabell, figur, protokoll eller annen kilde"
                    onChange={(event) => updateDomain(domain.id, 'evidenceLocation', event.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor={`rob2-rationale-${domain.id}`}>Støtte for vurderingen</label>
                  <textarea
                    id={`rob2-rationale-${domain.id}`}
                    rows="4"
                    value={item.rationale}
                    onChange={(event) => updateDomain(domain.id, 'rationale', event.target.value)}
                  />
                </div>

                {itemErrors.length > 0 && (
                  <div className="item-errors" role="alert">
                    <strong>Punktet må korrigeres:</strong>
                    <ul>{itemErrors.map((error) => <li key={error}>{error}</li>)}</ul>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>

        <button className="primary-button assessment-submit" type="submit">
          Valider komplett RoB 2-vurdering
        </button>
      </form>

      {serverError && (
        <section className="message message-error" role="alert">
          <strong>Servervalidering feilet:</strong> {serverError}
        </section>
      )}

      {serverResult && (
        <section className={serverResult.isValid ? 'confirmation' : 'message message-error'} aria-live="polite">
          <strong>{serverResult.isValid ? 'Servervalidering godkjent.' : 'Servervalidering fant feil.'}</strong>
          {serverResult.errors?.length > 0 && <ul>{serverResult.errors.map((error) => <li key={error}>{error}</li>)}</ul>}
          {serverResult.proposedOverallRisk && (
            <span>Foreløpig samlet risikoforslag fra prototypens valideringslogikk: {labels[serverResult.proposedOverallRisk]}.</span>
          )}
          {serverResult.requiresResearcherReview && (
            <span>Forskerens samlede metodiske vurdering kreves før resultatet kan brukes som endelig RoB 2-vurdering.</span>
          )}
        </section>
      )}

      {overall && !serverResult && (
        <section className="confirmation" aria-live="polite">
          <strong>Foreløpig samlet vurdering: {labels[overall]}</strong>
          <span>
            {overall === 'High'
              ? 'Minst ett domene er vurdert som høy risiko for bias.'
              : overall === 'SomeConcerns'
                ? 'Minst ett domene har noen betenkeligheter og ingen domener er vurdert som høy risiko.'
                : 'Alle fem domener er vurdert som lav risiko for bias.'}
          </span>
          {multipleConcerns && (
            <span>
              Flere domener har noen betenkeligheter. Dette er en foreløpig programoppsummering; samlet RoB 2-vurdering må gjøres av forskeren etter gjeldende veiledning.
            </span>
          )}
        </section>
      )}

      {validated && (
        <section className="confirmation export-section">
          <strong>RoB 2-datasettet er komplett og servervalidert</strong>
          <span>Alle fem domener har vurdering, begrunnelse og dokumentasjonssted.</span>
        </section>
      )}

      <p className="method-source">
        Kilde: {ROB2_SOURCE.citation} DOI: {ROB2_SOURCE.doi}
      </p>
    </section>
  );
}
