import React, { useState } from 'react';
import { ArticleData } from '../types';
import { Globe, Search, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, BookOpen } from 'lucide-react';

interface ReferenceVerifierViewProps {
  selectedArticle: ArticleData;
}

interface VerificationResult {
  verified: boolean;
  verificationDetails: string;
  recentStudies: Array<{
    title: string;
    authors: string;
    year: number;
    journal: string;
    doi?: string;
    apa7: string;
    relevance: string;
  }>;
}

export const ReferenceVerifierView: React.FC<ReferenceVerifierViewProps> = ({ selectedArticle }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/verify-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: selectedArticle.title,
          authors: selectedArticle.authors
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Kunne ikke verifisere referanser.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Nettverkfeil under verifisering.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-2">
            Google Search API • Live kildeverifisering & Oppdatering
          </span>
          <h2 className="text-xl font-bold text-slate-900">Sjekk og Oppdater Referanser for {selectedArticle.title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Bruk live Google-søk til å verifisere artikkeltittel, DOI og finne nyere relaterte studier (2024–2026) for å sikre at litteraturlisten er oppdatert.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Søker på nettet...</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>Verifiser og finn nyere studier</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Verification status card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${result.verified ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                {result.verified ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {result.verified ? 'Artikkelen er verifisert i åpne registre' : 'Delvis verifisering / Manuell sjekk anbefalt'}
                </h3>
                <p className="text-xs text-slate-500">Søkt via Google Search API mot vitenskapelige databaser.</p>
              </div>
            </div>

            <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
              {result.verificationDetails}
            </p>
          </div>

          {/* Recent related studies */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Nyere relaterte studier (Anbefalt for litteraturlisten)</span>
            </h3>

            <div className="space-y-4">
              {result.recentStudies?.map((study, idx) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                      {study.year} • {study.journal}
                    </span>
                    {study.doi && (
                      <a
                        href={`https://doi.org/${study.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 font-medium hover:underline flex items-center space-x-1"
                      >
                        <span>DOI: {study.doi}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{study.title}</h4>
                  <p className="text-xs text-slate-600 font-medium">Forfattere: {study.authors}</p>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800">
                    <span className="font-bold text-indigo-700 block mb-1">APA 7 Referanse:</span>
                    {study.apa7}
                  </div>

                  <p className="text-xs text-slate-600 italic">
                    <strong className="text-slate-700 font-sans not-italic">Relevans:</strong> {study.relevance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
