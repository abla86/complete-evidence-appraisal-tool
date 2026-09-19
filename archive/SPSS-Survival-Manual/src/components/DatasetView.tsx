import React, { useState, useRef, useMemo } from "react";
import { Dataset, VariableMeta, MeasurementLevel, VariableValidationReport } from "../types";
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
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Info,
} from "lucide-react";
import {
  exportDatasetToExcel,
  triggerPrint,
  exportValidationReportToExcel,
  exportValidationReportToWord,
} from "../utils/exportUtils";
import { validateDatasetHealth } from "../utils/validationEngine";

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
  const [issueFilter, setIssueFilter] = useState<"all" | "error" | "warning">("all");
  const [selectedVarQuality, setSelectedVarQuality] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute dataset health report via validation engine
  const healthReport = useMemo(
    () => validateDatasetHealth(currentDataset),
    [currentDataset]
  );

  const variableReportsList = useMemo(
    () =>
      Object.values(
        healthReport.variableReports
      ) as VariableValidationReport[],
    [healthReport]
  );

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

            <button
              onClick={() => exportDatasetToExcel(currentDataset)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
              title="Last ned rådata og variabeloversikt som Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Eksporter Excel (.xlsx)</span>
            </button>

            <button
              onClick={triggerPrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
              title="Skriv ut eller lagre som PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Skriv ut / PDF</span>
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
        <div className="space-y-6">
          {/* Health Score Overview Hero */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold font-mono text-lg shrink-0 border ${
                    healthReport.healthScore >= 80
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : healthReport.healthScore >= 60
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span>{healthReport.healthScore}</span>
                  <span className="text-[9px] uppercase tracking-wider font-sans font-normal text-slate-500">
                    /100
                  </span>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Datakvalitet & Valideringsscore
                    </h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        healthReport.healthScore >= 80
                          ? "bg-emerald-100 text-emerald-800"
                          : healthReport.healthScore >= 60
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {healthReport.healthScore >= 80
                        ? "Høy datakvalitet (Klar for analyse)"
                        : healthReport.healthScore >= 60
                        ? "Moderat kvalitet (Advarsler identifisert)"
                        : "Kritiske feil (Må renses før analyse)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Systematisk screening basert på anbefalingene i <em>SPSS Survival Manual</em> (Pallant, 2020) og Tabachnick & Fidell. Kontrollerer for ulogiske verdier, missing-mønstre, uteliggere og brudd på normalfordeling.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Export Validation Report */}
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <button
                  onClick={() => exportValidationReportToWord(healthReport)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
                  title="Last ned valideringsrapport i Word (.doc)"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Word (.doc)</span>
                </button>

                <button
                  onClick={() => exportValidationReportToExcel(healthReport)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
                  title="Last ned fullstendig datakontroll i Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  onClick={triggerPrint}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
                  title="Skriv ut eller lagre som PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-700" />
                  <span>Skriv ut / PDF</span>
                </button>
              </div>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px]">Totale observasjoner</span>
                <div className="font-bold text-slate-900 text-base font-mono mt-0.5">
                  N = {healthReport.totalRows}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Godkjente sjekker</span>
                </span>
                <div className="font-bold text-emerald-800 text-base font-mono mt-0.5">
                  {healthReport.passedChecksCount}
                </div>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-amber-700 text-[11px] flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Metodiske advarsler</span>
                </span>
                <div className="font-bold text-amber-800 text-base font-mono mt-0.5">
                  {healthReport.warningsCount}
                </div>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
                <span className="text-rose-700 text-[11px] flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Kritiske feil</span>
                </span>
                <div className="font-bold text-rose-800 text-base font-mono mt-0.5">
                  {healthReport.errorsCount}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Issues Center */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Valideringsavvik & Tiltak ({healthReport.issues.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Filtrer etter alvorlighetsgrad for å inspisere spesifikke metodiske utfordringer.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIssueFilter("all")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    issueFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Alle ({healthReport.issues.length})
                </button>
                <button
                  onClick={() => setIssueFilter("error")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    issueFilter === "error"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Feil ({healthReport.errorsCount})
                </button>
                <button
                  onClick={() => setIssueFilter("warning")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    issueFilter === "warning"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  Advarsler ({healthReport.warningsCount})
                </button>
              </div>
            </div>

            {healthReport.issues.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">
                  Ingen dataproblemer funnet!
                </h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Datasettet har ingen manglende data, urealistiske tastefeil eller ekstreme uteliggere. Du kan trygt fortsette til testvalg og analyse.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {healthReport.issues
                  .filter((iss) => (issueFilter === "all" ? true : iss.severity === issueFilter))
                  .map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                        issue.severity === "error"
                          ? "bg-rose-50/60 border-rose-200 text-rose-950"
                          : "bg-amber-50/60 border-amber-200 text-amber-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              issue.severity === "error"
                                ? "bg-rose-200 text-rose-900"
                                : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {issue.severity === "error" ? "Kritisk feil" : "Metodisk advarsel"}
                          </span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {issue.variableName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-sans">
                            ({issue.type})
                          </span>
                        </div>
                      </div>

                      <p className="font-semibold text-slate-900 text-xs">
                        {issue.message}
                      </p>

                      <p className="text-slate-700 text-xs leading-relaxed">
                        {issue.details}
                      </p>

                      <div className="pt-2 border-t border-slate-200/60 flex items-start space-x-1.5 text-xs text-slate-900">
                        <span className="font-bold text-emerald-800 shrink-0">
                          SPSS Anbefaling:
                        </span>
                        <span className="text-slate-800">{issue.recommendation}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Statistical Distribution & Normality Validation Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">
                  Deskriptiv & Normalfordelingsscreening (Pallant Kap. 6)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Kriterium: |Z_skjev| ≤ 2.58 (p &gt; .01)
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-sans">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Variabel</th>
                    <th className="p-2.5 border-r border-slate-200">Nivå</th>
                    <th className="p-2.5 border-r border-slate-200">Gyldig N</th>
                    <th className="p-2.5 border-r border-slate-200">Missing</th>
                    <th className="p-2.5 border-r border-slate-200">Min – Maks</th>
                    <th className="p-2.5 border-r border-slate-200">Gj.snitt (SD)</th>
                    <th className="p-2.5 border-r border-slate-200">Skjevhet (z)</th>
                    <th className="p-2.5 border-r border-slate-200">Kurtose (z)</th>
                    <th className="p-2.5 border-r border-slate-200">Normalfordeling</th>
                    <th className="p-2.5">Uteliggere</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {variableReportsList.map((vr) => (
                    <tr key={vr.variableName} className="hover:bg-slate-50/80">
                      <td className="p-2.5 border-r border-slate-200 font-semibold font-sans text-slate-900">
                        {vr.variableName}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-sans uppercase text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {vr.level}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200">{vr.n}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        {vr.missingCount > 0 ? (
                          <span className="text-amber-600 font-medium font-sans">
                            {vr.missingCount} ({vr.missingPercentage}%)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-sans">0 (0%)</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {vr.min !== undefined ? `${vr.min} – ${vr.max}` : "–"}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {vr.mean !== undefined ? `${vr.mean} (${vr.sd})` : "–"}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {vr.skewness !== undefined ? (
                          <span
                            className={
                              Math.abs(vr.zSkew || 0) > 2.58
                                ? "text-amber-700 font-bold"
                                : "text-slate-700"
                            }
                          >
                            {vr.skewness} (z={vr.zSkew})
                          </span>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {vr.kurtosis !== undefined ? (
                          <span
                            className={
                              Math.abs(vr.zKurtosis || 0) > 2.58
                                ? "text-amber-700 font-bold"
                                : "text-slate-700"
                            }
                          >
                            {vr.kurtosis} (z={vr.zKurtosis})
                          </span>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-sans">
                        {vr.level === "scale" ? (
                          vr.isNormallyDistributed ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tilfredsstillende</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-700 text-[11px] font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Skjev (|z| &gt; 2.58)</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">Kategorisk</span>
                        )}
                      </td>
                      <td className="p-2.5 font-sans">
                        {vr.outliersCount > 0 ? (
                          <span className="text-amber-700 font-bold font-mono">
                            {vr.outliersCount} (|z| &gt; 2.58)
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px]">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Outlier Drilldown */}
            {variableReportsList.some(
              (vr) => vr.outliersCount > 0
            ) && (
              <div className="p-4 bg-amber-50/70 border-t border-amber-200 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Detaljer om identifiserte uteliggere (Outliers)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {variableReportsList
                    .filter((vr) => vr.outliersCount > 0)
                    .map((vr) => (
                      <div
                        key={vr.variableName}
                        className="bg-white p-3 rounded-lg border border-amber-200 space-y-1 font-mono text-[11px]"
                      >
                        <div className="font-sans font-semibold text-slate-900 text-xs">
                          {vr.variableName}: {vr.outliersCount} uteliggere
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {vr.outlierIndices?.map((outl, oIdx) => (
                            <li
                              key={oIdx}
                              className="py-1 flex items-center justify-between text-slate-700"
                            >
                              <span>Rad #{outl.row} (SPSS ID)</span>
                              <span className="font-bold">
                                Verdi: {outl.value} (z = {outl.zScore})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
