import React, { useState } from 'react';
import { BookOpen, Copy, Check, Bookmark, ExternalLink } from 'lucide-react';

export const ReferencesView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<'apa7' | 'harvard'>('apa7');

  const references = [
    {
      id: 'ref-1',
      author: 'Øverhaug, O. M. S., Laue, J., Vis, S. A., & Risør, M. B.',
      year: 2024,
      title: '‘There’s a will, but not a way’: Norwegian GPs’ experiences of collaboration with child welfare services – a grounded theory study',
      journal: 'BMC Primary Care',
      volume: '25',
      pages: '36',
      doi: '10.1186/s12875-024-02269-9',
      category: 'Nyere forskningsartikkel (2024)',
      apa7: 'Øverhaug, O. M. S., Laue, J., Vis, S. A., & Risør, M. B. (2024). ‘There’s a will, but not a way’: Norwegian GPs’ experiences of collaboration with child welfare services – a grounded theory study. BMC Primary Care, 25(36). https://doi.org/10.1186/s12875-024-02269-9',
      harvard: 'Øverhaug, O.M.S., Laue, J., Vis, S.A. and Risør, M.B. (2024) ‘There’s a will, but not a way’: Norwegian GPs’ experiences of collaboration with child welfare services – a grounded theory study, BMC Primary Care, 25(36), p. 36. Available at: https://doi.org/10.1186/s12875-024-02269-9.'
    },
    {
      id: 'ref-2',
      author: 'Sahota, R., Porwal, A., Wadhwa, N., Sharma, A., Ranjan, R., Santhanam, D., Soni, M., Bandhu, A., Bottomley, C., Marchant, T., & Das, A.',
      year: 2026,
      title: 'Maternal nutrition practices and behaviours in the context of a Cash-Plus intervention: a qualitative study in Rajasthan, India',
      journal: 'Global Health Action',
      volume: '19 (1)',
      pages: '2693447',
      doi: '10.1080/16549716.2026.2693447',
      category: 'Nyere forskningsartikkel (2026)',
      apa7: 'Sahota, R., Porwal, A., Wadhwa, N., Sharma, A., Ranjan, R., Santhanam, D., Soni, M., Bandhu, A., Bottomley, C., Marchant, T., & Das, A. (2026). Maternal nutrition practices and behaviours in the context of a Cash-Plus intervention: a qualitative study in Rajasthan, India. Global Health Action, 19(1), 2693447. https://doi.org/10.1080/16549716.2026.2693447',
      harvard: 'Sahota, R. et al. (2026) ‘Maternal nutrition practices and behaviours in the context of a Cash-Plus intervention: a qualitative study in Rajasthan, India’, Global Health Action, 19(1), p. 2693447. Available at: https://doi.org/10.1080/16549716.2026.2693447.'
    },
    {
      id: 'ref-3',
      author: 'Corbin, J., & Strauss, A.',
      year: 2015,
      title: 'Basics of qualitative research: Techniques and procedures for developing grounded theory (4th ed.)',
      publisher: 'Sage Publications',
      category: 'Metodebolker & Faglitteratur (Klassisk/Grunnleggende)',
      apa7: 'Corbin, J., & Strauss, A. (2015). Basics of qualitative research: Techniques and procedures for developing grounded theory (4th ed.). Sage Publications.',
      harvard: 'Corbin, J. and Strauss, A. (2015) Basics of qualitative research: Techniques and procedures for developing grounded theory. 4th edn. Los Angeles: Sage Publications.'
    },
    {
      id: 'ref-4',
      author: 'Lincoln, Y. S., & Guba, E. G.',
      year: 1985,
      title: 'Naturalistic inquiry',
      publisher: 'Sage Publications',
      category: 'Metodebolker & Faglitteratur (Klassisk/Grunnleggende)',
      apa7: 'Lincoln, Y. S., & Guba, E. G. (1985). Naturalistic inquiry. Sage Publications.',
      harvard: 'Lincoln, Y.S. and Guba, E.G. (1985) Naturalistic inquiry. Beverly Hills: Sage Publications.'
    },
    {
      id: 'ref-5',
      author: 'Malterud, K.',
      year: 2017,
      title: 'Kvalitative forskningsmetoder for medisin og helsefag (4. utg.)',
      publisher: 'Universitetsforlaget',
      category: 'Metodebolker & Faglitteratur (Norsk helsefag)',
      apa7: 'Malterud, K. (2017). Kvalitative forskningsmetoder for medisin og helsefag (4. utg.). Universitetsforlaget.',
      harvard: 'Malterud, K. (2017) Kvalitative forskningsmetoder for medisin og helsefag. 4. utg. Oslo: Universitetsforlaget.'
    },
    {
      id: 'ref-6',
      author: 'Gittell, J. H.',
      year: 2009,
      title: 'High performance healthcare: Using the power of relationships to achieve quality, efficiency and resilience',
      publisher: 'McGraw-Hill',
      category: 'Organisasjons- og samarbeidsteori',
      apa7: 'Gittell, J. H. (2009). High performance healthcare: Using the power of relationships to achieve quality, efficiency and resilience. McGraw-Hill.',
      harvard: 'Gittell, J.H. (2009) High performance healthcare: Using the power of relationships to achieve quality, efficiency and resilience. New York: McGraw-Hill.'
    },
    {
      id: 'ref-7',
      author: 'Tong, A., Sainsbury, P., & Craig, J.',
      year: 2007,
      title: 'Consolidated criteria for reporting qualitative research (COREQ): A 32-item checklist for interviews and focus groups',
      journal: 'International Journal for Quality in Health Care',
      volume: '19 (6)',
      pages: '349–357',
      doi: '10.1093/intqhc/mzl042',
      category: 'Rapporteringsstandarder',
      apa7: 'Tong, A., Sainsbury, P., & Craig, J. (2007). Consolidated criteria for reporting qualitative research (COREQ): A 32-item checklist for interviews and focus groups. International Journal for Quality in Health Care, 19(6), 349–357. https://doi.org/10.1093/intqhc/mzl042',
      harvard: 'Tong, A., Sainsbury, P. and Craig, J. (2007) ‘Consolidated criteria for reporting qualitative research (COREQ): A 32-item checklist for interviews and focus groups’, International Journal for Quality in Health Care, 19(6), pp. 349–357. Available at: https://doi.org/10.1093/intqhc/mzl042.'
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bibliografi & Faglitteratur (APA 7 & Harvard)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Komplett oversikt over nyere forskningsartikler og klassisk/moderne faglitteratur anvendt i analysene.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveStyle('apa7')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStyle === 'apa7' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            APA 7. utgave (Standard)
          </button>
          <button
            onClick={() => setActiveStyle('harvard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStyle === 'harvard' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harvard-stil
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {references.map((ref) => {
          const citationText = activeStyle === 'apa7' ? ref.apa7 : ref.harvard;
          return (
            <div key={ref.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {ref.category}
                </span>
                <button
                  onClick={() => handleCopy(citationText, ref.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
                >
                  {copiedId === ref.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier referanse</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-sm text-slate-800 font-mono bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {citationText}
              </p>

              {ref.doi && (
                <div className="flex items-center space-x-1 text-xs text-indigo-600 font-medium">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    DOI: {ref.doi}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
