import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Link2,
  Check
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../../types';

interface KnowledgeGraphModuleProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onAddNode: (node: Omit<GraphNode, 'id'>) => void;
  onAddEdge: (edge: Omit<GraphEdge, 'id'>) => void;
}

const TYPE_COLORS: Record<GraphNode['type'], { bg: string; text: string; fill: string; stroke: string }> = {
  ARTICLE: { bg: 'bg-blue-500/20', text: 'text-blue-300', fill: '#1d4ed8', stroke: '#60a5fa' },
  CONCEPT: { bg: 'bg-purple-500/20', text: 'text-purple-300', fill: '#6d28d9', stroke: '#a78bfa' },
  METHOD: { bg: 'bg-amber-500/20', text: 'text-amber-300', fill: '#b45309', stroke: '#fbbf24' },
  CLINICAL_ENDPOINT: { bg: 'bg-rose-500/20', text: 'text-rose-300', fill: '#be123c', stroke: '#fb7185' },
  AUTHOR: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', fill: '#047857', stroke: '#34d399' }
};

export const KnowledgeGraphModule: React.FC<KnowledgeGraphModuleProps> = ({
  nodes,
  edges,
  onAddNode,
  onAddEdge
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('n2');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);

  // Form states
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<GraphNode['type']>('CONCEPT');
  const [newDetails, setNewDetails] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Filtered nodes
  const visibleNodes = nodes.filter(
    (n) => filterType === 'ALL' || n.type === filterType
  );
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  const connectedEdges = edges.filter(
    (e) => e.source === selectedNodeId || e.target === selectedNodeId
  );

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onAddNode({
      label: newLabel,
      type: newType,
      x: 350 + Math.floor(Math.random() * 150) - 75,
      y: 220 + Math.floor(Math.random() * 150) - 75,
      details: newDetails || 'Brukerdefinert kunnskapsnode i ResearchForge OS.'
    });
    setNewLabel('');
    setNewDetails('');
    setShowAddNodeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            Knowledge Graph OS (Relasjonsmotor)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Grafbasert kobling mellom forskningsartikler, metoder, forfattere og kliniske prosesselementer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom ut"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom inn"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded ml-0.5"
              title="Tilbakestill zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowAddNodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Ny Node
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-1">Filtrer noder:</span>
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-200 text-slate-900 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Alle ({nodes.length})
        </button>
        {(['ARTICLE', 'CONCEPT', 'METHOD', 'CLINICAL_ENDPOINT', 'AUTHOR'] as const).map(
          (t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterType === t
                  ? `${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text} border border-current font-bold`
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          )
        )}
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Graph View */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 relative overflow-hidden min-h-[460px] flex items-center justify-center">
          <svg
            viewBox="0 0 740 500"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Background Grid Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {visibleEdges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source);
              const tgt = nodes.find((n) => n.id === edge.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                selectedNodeId === edge.source || selectedNodeId === edge.target;

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? '#60a5fa' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={isHighlighted ? 'none' : '3,3'}
                  />
                  {/* Midpoint Label */}
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 4}
                    fill={isHighlighted ? '#93c5fd' : '#64748b'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((node) => {
              const colors = TYPE_COLORS[node.type];
              const isSelected = selectedNodeId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer transition-transform duration-150 hover:scale-110"
                >
                  <circle
                    r={isSelected ? 22 : 18}
                    fill={colors.fill}
                    stroke={isSelected ? '#ffffff' : colors.stroke}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="filter drop-shadow-md"
                  />
                  <text
                    y={32}
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize="10"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.label.length > 20
                      ? `${node.label.substring(0, 18)}...`
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    TYPE_COLORS[selectedNode.type].bg
                  } ${TYPE_COLORS[selectedNode.type].text}`}
                >
                  {selectedNode.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">ID: {selectedNode.id}</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">{selectedNode.label}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedNode.details}
                </p>
              </div>

              {/* Connected Relationships */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  Tilknyttede relasjoner ({connectedEdges.length})
                </h5>

                {connectedEdges.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Ingen aktive kanter koblet.</p>
                ) : (
                  <div className="space-y-2">
                    {connectedEdges.map((edge) => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const otherNode = nodes.find((n) => n.id === otherId);
                      const isOutgoing = edge.source === selectedNode.id;

                      return (
                        <div
                          key={edge.id}
                          className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-blue-400 font-semibold mr-1">
                              {isOutgoing ? '➜' : '⬅'} [{edge.label}]
                            </span>
                            <span className="text-white font-medium">
                              {otherNode?.label || otherId}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {otherNode?.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
              <Info className="w-8 h-8 text-slate-600 mb-2" />
              Velg en node i grafen for å se detaljer, relasjoner og egenskaper.
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Grafmotor: In-Memory Directed</span>
            <span className="text-emerald-400">O(V + E) Traversering</span>
          </div>
        </div>
      </div>

      {/* Modal: Create Node */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Opprett Kunnskapsnode</h3>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nodenavn / Etikett *</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="F.eks. Triage-algoritme v4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as GraphNode['type'])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CONCEPT">CONCEPT (Begrep/Prinsipp)</option>
                  <option value="ARTICLE">ARTICLE (Forskningsartikkel)</option>
                  <option value="METHOD">METHOD (Klinisk/Teknisk metode)</option>
                  <option value="CLINICAL_ENDPOINT">CLINICAL_ENDPOINT (Klinisk forløpspunkt)</option>
                  <option value="AUTHOR">AUTHOR (Forsker/Arkitekt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beskrivelse / Detaljer</label>
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Hva representerer denne noden i forskningskonteksten?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Legg til node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
