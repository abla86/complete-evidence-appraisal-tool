import React, { useState } from 'react';
import { ArticleData } from '../types';
import { CheckSquare, Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface CustomChecklistViewProps {
  selectedArticle: ArticleData;
}

interface ChecklistItem {
  id: string;
  criterion: string;
  category: string;
  checked: boolean;
  notes: string;
}

export const CustomChecklistView: React.FC<CustomChecklistViewProps> = ({ selectedArticle }) => {
  const [checklistName, setChecklistName] = useState<string>('CASP Kvalitativ sjekkliste (Tilpasset)');
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', criterion: 'Er formålet med studien klart formulert?', category: 'Formål', checked: true, notes: 'Tydelig og presist angitt i introduksjonen.' },
    { id: '2', criterion: 'Er det kvalitative designet egnet for forskningsspørsmålet?', category: 'Design', checked: true, notes: 'Grounded theory / semistrukturerte intervjuer egnet for subjektive erfaringer.' },
    { id: '3', criterion: 'Er utvalgsmetoden hensiktsmessig for å belyse problemstillingen?', category: 'Utvalg', checked: true, notes: 'Målrettet utvalg med god variasjon.' },
    { id: '4', criterion: 'Er datainnsamlingen utført på en tillitsvekkende måte?', category: 'Data', checked: true, notes: 'Intervjuer med opptak og transkripsjon.' },
    { id: '5', criterion: 'Er det tatt hensyn til forskerens rolle og refleksivitet?', category: 'Refleksivitet', checked: true, notes: 'Åpenhet om forskerposisjon og tverrfaglig drøfting.' },
    { id: '6', criterion: 'Er etiske godkjenninger og samtykke ivaretatt?', category: 'Etikk', checked: true, notes: 'REK-godkjenning og skriftlig samtykke foreligger.' },
    { id: '7', criterion: 'Er dataanalysen grundig og systematisk beskrevet?', category: 'Analyse', checked: true, notes: 'Koding og kategorisering fulgt i tråd med anerkjent metode.' },
    { id: '8', criterion: 'Er funnene klare og koblet til teoretisk rammeverk?', category: 'Funn', checked: true, notes: 'Klare begreper og gode sitater.' }
  ]);

  const [newCriterion, setNewCriterion] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Generelt');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterion.trim()) return;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        criterion: newCriterion,
        category: newCategory,
        checked: false,
        notes: ''
      }
    ]);
    setNewCriterion('');
  };

  const handleToggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setItems(items.map(item => item.id === id ? { ...item, notes } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const scorePercentage = Math.round((checkedCount / (items.length || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-2">
            Egendefinerte Sjekklister & Standarder (CASP / COREQ / SRQR)
          </span>
          <h2 className="text-xl font-bold text-slate-900">Skreddersydd Sjekkliste for {selectedArticle.title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Tilpass dine egne sjekklistekriterier, sjekk av oppfyllelse og dokumenter metodisk kvalitet i sanntid.
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-700">{scorePercentage}%</div>
          <div className="text-xs font-semibold text-indigo-900">Oppfyllelsesgrad ({checkedCount}/{items.length})</div>
        </div>
      </div>

      {/* Add new checklist item form */}
      <form onSubmit={handleAddItem} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Legg til eget kriterium i sjekklisten</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            placeholder="F.eks. Er generaliserbarheten drøftet i konklusjonen?"
            className="md:col-span-2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
          <div className="flex space-x-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              aria-label="Kategori for nytt sjekklistekriterium"
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden flex-1"
            >
              <option value="Formål">Formål</option>
              <option value="Design">Design</option>
              <option value="Utvalg">Utvalg</option>
              <option value="Data">Data</option>
              <option value="Analyse">Analyse</option>
              <option value="Etikk">Etikk</option>
              <option value="Generelt">Generelt</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-1 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Legg til</span>
            </button>
          </div>
        </div>
      </form>

      {/* Checklist items list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        <div className="p-4 bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center">
          <span>Kriterium & Kategori</span>
          <span>Status & Evaluering</span>
        </div>

        {items.map((item) => (
          <div key={item.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggleItem(item.id)}
                aria-label={`Marker kriterium ${item.criterion} som oppfylt`}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className={`text-sm font-semibold ${item.checked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                    {item.criterion}
                  </span>
                </div>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                  placeholder="Legg til egne notater, sitater eller begrunnelse..."
                  aria-label={`Notater for kriterium ${item.criterion}`}
                  className="w-full text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden mt-1"
                />
              </div>
            </div>

            <button
              onClick={() => handleDeleteItem(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Slett kriterium"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
