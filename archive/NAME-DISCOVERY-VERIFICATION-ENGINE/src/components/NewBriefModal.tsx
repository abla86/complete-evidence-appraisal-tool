import React, { useState } from 'react';
import { X, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { EntityType, MarketJurisdiction, NamingBrief } from '../types/index.js';

interface NewBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (brief: NamingBrief) => Promise<void>;
  isCreating: boolean;
}

export function NewBriefModal({ isOpen, onClose, onCreate, isCreating }: NewBriefModalProps) {
  const [title, setTitle] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('company');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [targetAudience, setTargetAudience] = useState('Founders, Developers & Enterprises');
  const [market, setMarket] = useState<MarketJurisdiction>('Norway');
  const [desiredTone, setDesiredTone] = useState<NamingBrief['desiredTone']>('nordic');
  const [desiredLength, setDesiredLength] = useState<NamingBrief['desiredLength']>('short');
  const [pronunciationPreference, setPronunciationPreference] = useState('easy');
  const [wordType, setWordType] = useState<NamingBrief['wordType']>('invented');
  const [wordsToInclude, setWordsToInclude] = useState('');
  const [wordsToAvoid, setWordsToAvoid] = useState('tech, cloud, flow, hub, labs');
  const [lettersToAvoid, setLettersToAvoid] = useState('');
  const [conceptsToCommunicate, setConceptsToCommunicate] = useState('clarity, precision, trust, resilience');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    const brief: NamingBrief = {
      title: title.trim(),
      entityType,
      description: description.trim(),
      industry: industry.trim(),
      targetAudience: targetAudience.trim(),
      market,
      languages: market === 'Norway' ? ['en', 'no'] : ['en'],
      desiredTone,
      desiredLength,
      pronunciationPreference,
      wordType,
      wordsToInclude: wordsToInclude.split(',').map(s => s.trim()).filter(Boolean),
      wordsToAvoid: wordsToAvoid.split(',').map(s => s.trim()).filter(Boolean),
      lettersToAvoid: lettersToAvoid.split(',').map(s => s.trim()).filter(Boolean),
      conceptsToCommunicate: conceptsToCommunicate.split(',').map(s => s.trim()).filter(Boolean),
    };

    await onCreate(brief);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                New Naming Brief
              </h3>
              <p className="text-xs text-slate-400">
                Define the requirements and linguistic boundaries for discovery & screening
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Title & Entity Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Project Title / Brand Initiative *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Next-Gen Nordic FinTech Infrastructure"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Entity Type
              </label>
              <select
                aria-label="Entity Type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="company">Company</option>
                <option value="product">Product</option>
                <option value="platform">Platform</option>
                <option value="application">Application</option>
                <option value="service">Service</option>
                <option value="brand">Brand</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Description & Purpose *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the product or company actually does, its core value proposition, and competitive distinction..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Industry & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Industry / Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., FinTech, Clean Energy, SaaS"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Enterprise B2B, Nordic SMEs"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Market Jurisdiction & Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Primary Market
              </label>
              <select
                aria-label="Target Market Jurisdiction"
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketJurisdiction)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Norway">Norway (Brønnøysund & .no)</option>
                <option value="Nordic">Nordic Region</option>
                <option value="Europe">Europe (EUIPO)</option>
                <option value="USA">United States (USPTO)</option>
                <option value="Global">Global Market</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Desired Tone
              </label>
              <select
                aria-label="Desired Tone"
                value={desiredTone}
                onChange={(e) => setDesiredTone(e.target.value as NamingBrief['desiredTone'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="nordic">Nordic (Clean, Organic)</option>
                <option value="minimal">Minimalist</option>
                <option value="premium">Premium / Luxury</option>
                <option value="technical">Technical / Precision</option>
                <option value="creative">Creative / Evocative</option>
                <option value="futuristic">Futuristic</option>
                <option value="trustworthy">Trustworthy</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Length Preference
              </label>
              <select
                aria-label="Length Preference"
                value={desiredLength}
                onChange={(e) => setDesiredLength(e.target.value as NamingBrief['desiredLength'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="short">Short (4–6 chars)</option>
                <option value="medium">Medium (7–9 chars)</option>
                <option value="any">Any Length</option>
              </select>
            </div>
          </div>

          {/* Concepts to Communicate */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Concepts & Metaphors to Evoke (comma-separated)
            </label>
            <input
              type="text"
              value={conceptsToCommunicate}
              onChange={(e) => setConceptsToCommunicate(e.target.value)}
              placeholder="e.g., speed, clarity, bedrock, precision"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Words to Avoid & Letters to Avoid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1 text-rose-300">
                Words to Avoid (comma-separated)
              </label>
              <input
                type="text"
                value={wordsToAvoid}
                onChange={(e) => setWordsToAvoid(e.target.value)}
                placeholder="tech, cloud, flow, hub, labs"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1 text-rose-300">
                Letters to Avoid (comma-separated)
              </label>
              <input
                type="text"
                value={lettersToAvoid}
                onChange={(e) => setLettersToAvoid(e.target.value)}
                placeholder="e.g., q, z, x"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium px-5 py-2 rounded-lg transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create & Launch Pipeline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
