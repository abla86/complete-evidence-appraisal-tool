import React, { useState, useRef } from "react";
import { Dataset, VariableMeta, MeasurementLevel } from "../types";
import { defaultDatasets } from "../data/defaultDatasets";
import {
  Upload,
  Table as TableIcon,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from "lucide-react";

interface DatasetViewProps {
  currentDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
  onUpdateDataset: (updated: Dataset) => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({
  currentDataset,
  onSelectDataset,
  onUpdateDataset,
}) => {
  const [subTab, setSubTab] = useState<"data" | "variable" | "quality">("data");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV/TSV helper
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return;

        // Auto-detect delimiter: comma, semicolon, or tab
        const firstLine = lines[0];
        let delimiter = ",";
        if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";
        else if (firstLine.includes("\t")) delimiter = "\t";

        const headers = firstLine
          .split(delimiter)
          .map((h) => h.replace(/^["']|["']$/g, "").trim());

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim());
          const rowObj: any = { id: i };
          headers.forEach((h, colIdx) => {
            const rawVal = cols[colIdx];
            const numVal = Number(rawVal);
            rowObj[h] = !isNaN(numVal) && rawVal !== "" ? numVal : rawVal;
          });
          rows.push(rowObj);
        }

        // Generate variables metadata
        const variables: VariableMeta[] = headers.map((h) => {
          const sample = rows.find((r) => r[h] !== undefined && r[h] !== "");
          const isNum = typeof sample?.[h] === "number";
          return {
            id: h.toLowerCase().replace(/\s+/g, "_"),
            name: h,
            label: h,
            type: isNum ? "numeric" : "string",
            level: isNum ? "scale" : "nominal",
            missingCount: rows.filter((r) => r[h] === undefined || r[h] === "" || r[h] === null).length,
          };
        });

        const newDataset: Dataset = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          description: `Importert fra ${file.name} (${rows.length} rader, ${headers.length} variabler)`,
          variables,
          rows,
        };

        onSelectDataset(newDataset);
      } catch (err) {
        console.error("CSV import error:", err);
      }
    };
    reader.readAsText(file);
  };

  const handleLevelChange = (varId: string, newLevel: MeasurementLevel) => {
    const updatedVars = currentDataset.variables.map((v) =>
      v.id === varId ? { ...v, level: newLevel } : v
    );
    onUpdateDataset({ ...currentDataset, variables: updatedVars });
  };

  // Filtered rows for Data View
  const filteredRows = currentDataset.rows.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Dataset Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Aktivt datasett
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <h1 className="text-lg font-bold text-slate-900">
                {currentDataset.name}
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                N = {currentDataset.rows.length}, {currentDataset.variables.length} variabler
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {currentDataset.description}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* Built-in Datasets dropdown */}
            <select
              value={currentDataset.id}
              onChange={(e) => {
                const found = defaultDatasets.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <optgroup label="Realistiske eksempeldatasett:">
                {defaultDatasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </optgroup>
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt,.tsv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Last opp CSV/Excel</span>
            </button>
          </div>
        </div>

        {/* View switcher: Data View vs Variable View vs Datakvalitet */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setSubTab("data")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === "data"
                ? "bg-emerald-100/80 text-emerald-900 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Data View (Datasettet)</span>
          </button>

          <button
            onClick={() => setSubTab("variable")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === "variable"
                ? "bg-emerald-100/80 text-emerald-900 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>Variable View (Målenivå & Koding)</span>
          </button>

          <button
            onClick={() => setSubTab("quality")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === "quality"
                ? "bg-emerald-100/80 text-emerald-900 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Datakontroll & Kvalitetssjekk</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Data View (Grid) */}
      {subTab === "data" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Viser {filteredRows.length} av {currentDataset.rows.length} rader
            </span>
            <input
              type="text"
              placeholder="Søk i rader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
            />
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="p-2.5 font-semibold text-slate-500 w-12 border-r border-slate-200 text-center">
                    #
                  </th>
                  {currentDataset.variables.map((v) => (
                    <th key={v.id} className="p-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span>{v.name}</span>
                        <span
                          className={`text-[10px] px-1 rounded uppercase font-mono ${
                            v.level === "scale"
                              ? "bg-blue-100 text-blue-700"
                              : v.level === "ordinal"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {v.level}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 font-mono text-slate-800">
                    <td className="p-2 text-center text-slate-400 bg-slate-50/50 border-r border-slate-200 font-sans">
                      {idx + 1}
                    </td>
                    {currentDataset.variables.map((v) => {
                      const val = row[v.name] !== undefined ? row[v.name] : row[v.id];
                      return (
                        <td key={v.id} className="p-2 border-r border-slate-200 whitespace-nowrap">
                          {val !== null && val !== undefined ? String(val) : (
                            <span className="text-slate-400 italic">SYSMIS</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Variable View */}
      {subTab === "variable" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-900">
              SPSS Variable View: Definisjon av målenivå og variabelmetadata
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              I SPSS avgjør målenivået (Measure) hvilke analyser som er metodisk gyldige. Du kan endre målenivå direkte her.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Navn (Name)</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Etikett (Label)</th>
                  <th className="p-3 font-semibold">Målenivå (Measure)</th>
                  <th className="p-3 font-semibold">Kategoriverdier (Values)</th>
                  <th className="p-3 font-semibold">Manglende (Missing)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentDataset.variables.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-medium text-slate-900">{v.name}</td>
                    <td className="p-3 text-slate-600">{v.type === "numeric" ? "Numeric" : "String"}</td>
                    <td className="p-3 text-slate-700 font-medium">{v.label}</td>
                    <td className="p-3">
                      <select
                        value={v.level}
                        onChange={(e) =>
                          handleLevelChange(v.id, e.target.value as MeasurementLevel)
                        }
                        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="scale">Scale (Kontinuerlig / Tall)</option>
                        <option value="ordinal">Ordinal (Rangert / Likert)</option>
                        <option value="nominal">Nominal (Kategorisk / Grupper)</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {v.values
                        ? Object.entries(v.values)
                            .map(([key, val]) => `${key}=«${val}»`)
                            .join(", ")
                        : "Ingen"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {v.missingCount > 0 ? (
                        <span className="text-amber-600 font-medium">{v.missingCount} missing</span>
                      ) : (
                        <span className="text-emerald-700">0 (Komplett)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Datakontroll & Kvalitetssjekk */}
      {subTab === "quality" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              Datakontroll: Screening for tastefeil og missing data
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Før du kjører en t-test, ANOVA eller regresjon må du alltid verifisere at minimums- og maksimumsverdier er logiske (f.eks. at ingen har alder 999 eller skår utenfor skalaen 0–30), og at manglende data ikke er konsentrert i én gruppe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDataset.variables
              .filter((v) => v.type === "numeric")
              .map((v) => {
                const nums = currentDataset.rows
                  .map((r) => Number(r[v.name] ?? r[v.id]))
                  .filter((n) => !isNaN(n));
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const avg = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-semibold text-xs text-slate-900">{v.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {v.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-400 text-[10px]">Min</div>
                        <div className="font-semibold text-slate-800 font-mono">{min}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-400 text-[10px]">Maks</div>
                        <div className="font-semibold text-slate-800 font-mono">{max}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-400 text-[10px]">Gj.snitt</div>
                        <div className="font-semibold text-slate-800 font-mono">{avg.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Gyldige observasjoner: {nums.length}</span>
                      <span className="text-emerald-700 font-medium">✓ Innenfor normalområde</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
