import { FullAppraisalRecord } from '@/schemas/appraisal.schema';
import { Study } from '@/schemas/study.schema';
import { ChecklistCriterion } from '@/types/frameworks';
import { FRAMEWORK_REGISTRY } from '@/lib/frameworks';

export function printAppraisalReport(appraisal: FullAppraisalRecord, study?: Study, criteria?: ChecklistCriterion[]): void {
  const frameworkMeta = FRAMEWORK_REGISTRY[appraisal.framework]?.meta;
  const criteriaMap = new Map((criteria || []).map(c => [c.id, c]));

  // Build report HTML
  const reportHtml = `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="utf-8">
      <title>Kritisk Vurderingsrapport - ${study?.title || 'Studie'}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
        h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
        .badge-HIGH { background: #dcfce7; color: #166534; }
        .badge-MODERATE { background: #fef9c3; color: #854d0e; }
        .badge-LOW { background: #fee2e2; color: #991b1b; }
        .badge-CRITICALLY_LOW { background: #fecaca; color: #7f1d1d; }
        .item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; }
        .q-code { font-weight: 700; color: #2563eb; }
        .q-text { font-weight: 600; margin-left: 6px; }
        .ans-pill { display: inline-block; padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; margin: 4px 0; }
        .ans-YES { background: #dbeafe; color: #1e40af; }
        .ans-NO { background: #fee2e2; color: #991b1b; }
        .ans-UNCLEAR { background: #fef3c7; color: #92400e; }
        .ans-NOT_APPLICABLE { background: #f1f5f9; color: #475569; }
        .rationale { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 8px 12px; margin: 6px 0; font-style: normal; }
        .quote-box { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 6px 10px; margin-top: 4px; font-size: 12px; }
        @media print {
          body { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <h1>Kritisk Vurderingsrapport • CritiqEvidence</h1>
      <div class="meta">
        <strong>Rammeverk:</strong> ${frameworkMeta?.title || appraisal.framework} (${frameworkMeta?.subtitle || ''})<br>
        <strong>Studie:</strong> ${study?.title || 'Ikke navngitt'} (${study?.authors || 'Ukjente forfattere'}, ${study?.year || 'N/A'})<br>
        <strong>Vurdert av:</strong> ${appraisal.evaluatorName} | <strong>Dato:</strong> ${new Date(appraisal.updatedAt).toLocaleDateString('no-NO')}<br>
        <strong>Samlet metodisk kvalitet/risiko:</strong> <span class="badge badge-${appraisal.overallRiskOrQuality}">${appraisal.overallRiskOrQuality}</span>
      </div>

      <h2>Gjennomgang av kriterier</h2>
      ${appraisal.evaluations.map(ev => {
        const crit = criteriaMap.get(ev.criterionId);
        return `
          <div class="item">
            <div>
              <span class="q-code">[${crit?.code || ev.criterionId}]</span>
              <span class="q-text">${crit?.questionText || 'Kriterium'}</span>
              ${crit?.mandatory ? '<span style="color: #b45309; font-size: 11px; margin-left: 6px;">(Obligatorisk)</span>' : ''}
            </div>
            <div>
              Vurdering: <span class="ans-pill ans-${ev.response}">${ev.response}</span>
            </div>
            <div class="rationale">
              <strong>Begrunnelse:</strong> ${ev.rationale || 'Ingen begrunnelse oppgitt'}
            </div>
            ${ev.evidenceAnchors.length > 0 ? `
              <div style="margin-top: 4px;">
                <strong>Forankret bevis (${ev.evidenceAnchors.length}):</strong>
                ${ev.evidenceAnchors.map(a => `
                  <div class="quote-box">
                    <strong>[${a.section}]:</strong> «${a.quote}»
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}

      ${appraisal.summaryNotes ? `
        <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <h3>Oppsummerende kommentar</h3>
          <p>${appraisal.summaryNotes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // In case popup is blocked in iframe, print directly
    window.print();
  }
}
