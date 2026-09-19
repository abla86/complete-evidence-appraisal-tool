import React, { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { StatisticalTestInfo, OutputInterpretation } from "../types";
import {
  exportToDocx,
  exportToPdf,
  exportToCsv,
} from "../utils/apaExportEngine";
import { DataExportModal } from "./DataExportModal";

interface ExportButtonGroupProps {
  testInfo: StatisticalTestInfo;
  results?: any;
  datasetName: string;
  apaNarrative: string;
  interpretation?: OutputInterpretation;
  assumptions?: {
    name: string;
    status: "met" | "warning" | "violated" | "passed";
    measuredValue?: string;
    threshold?: string;
    explanation: string;
  }[];
  compact?: boolean;
}

export const ExportButtonGroup: React.FC<ExportButtonGroupProps> = ({
  testInfo,
  results,
  datasetName,
  apaNarrative,
  interpretation,
  assumptions,
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | "csv" | null>(null);

  const payload = {
    reportType: "analysis" as const,
    testInfo,
    results,
    datasetName,
    apaNarrative,
    interpretation,
    assumptions,
    includeTable: true,
    includeInterpretation: true,
    includeAssumptions: true,
    includeSpssGuide: true,
    language: "no" as const,
  };

  const handleQuickPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting("pdf");
    try {
      await exportToPdf(payload);
    } finally {
      setIsExporting(null);
    }
  };

  const handleQuickDocx = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting("docx");
    try {
      await exportToDocx(payload);
    } finally {
      setIsExporting(null);
    }
  };

  const handleQuickCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting("csv");
    try {
      exportToCsv(payload);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
        {/* PDF Button */}
        <button
          onClick={handleQuickPdf}
          disabled={isExporting !== null}
          title="Last ned standardisert APA 7 PDF-rapport"
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5 text-rose-600" />
          <span>{isExporting === "pdf" ? "Lager..." : "PDF (APA 7)"}</span>
        </button>

        {/* Word (.docx) Button */}
        <button
          onClick={handleQuickDocx}
          disabled={isExporting !== null}
          title="Last ned redigerbar Word-fil (.docx) med ekte APA-tabeller"
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>{isExporting === "docx" ? "Lager..." : "Word (.docx)"}</span>
        </button>

        {/* CSV Button */}
        <button
          onClick={handleQuickCsv}
          disabled={isExporting !== null}
          title="Last ned statistiske tabeller og nøkkeltall i CSV"
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isExporting === "csv" ? "Lager..." : "CSV"}</span>
        </button>

        {/* Customize / Full Options Modal Trigger */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{compact ? "Eksportmodul" : "Tilpass APA 7 Eksport"}</span>
        </button>
      </div>

      {/* Modal */}
      <DataExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        testInfo={testInfo}
        results={results}
        datasetName={datasetName}
        apaNarrative={apaNarrative}
        interpretation={interpretation}
        assumptions={assumptions}
      />
    </>
  );
};
