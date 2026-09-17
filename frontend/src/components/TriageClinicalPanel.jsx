import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ShieldCheck, AlertTriangle, Activity, Copy, Check, Printer, Edit3, Save, Sparkles, FileText, Target } from 'lucide-react';

export default function TriageClinicalPanel({ analysisData, isLoading }) {
  const [reportContent, setReportContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync report content when new analysis completes
  React.useEffect(() => {
    if (analysisData?.clinical_report) {
      setReportContent(analysisData.clinical_report);
    }
  }, [analysisData?.clinical_report]);

  const handleCopy = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="h-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-10 w-10 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Executing Clinical Triage Analysis...</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs font-mono">
            Evaluating 15 MC Dropout stochastic forward passes & generating Gemini radiology consultation report.
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="h-full bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 flex flex-col items-center justify-center text-center text-zinc-500">
        <FileText className="h-8 w-8 text-zinc-700 mb-3" />
        <h4 className="text-sm font-semibold text-zinc-400">Workstation Standby</h4>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
          Select or upload a chest radiograph in the PACS Viewport to initiate uncertainty-aware triage & radiology impression.
        </p>
      </div>
    );
  }

  const {
    prediction,
    mean_probability,
    epistemic_variance,
    triage_status,
    dominant_quadrant,
  } = analysisData;

  const isPneumonia = prediction === 'PNEUMONIA';
  const isSafe = triage_status === 'SAFE_FOR_TRIAGE';
  const probPct = (mean_probability * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Triage Assessment Banner (Top) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        
        {/* Verdict Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold font-mono">
              Diagnosis Verdict:
            </span>
            <span
              className={`px-3 py-1 rounded-md text-sm font-bold tracking-tight border ${
                isPneumonia
                  ? 'bg-rose-950/80 text-rose-200 border-rose-800/80'
                  : 'bg-emerald-950/80 text-emerald-200 border-emerald-800/80'
              }`}
            >
              {prediction}
            </span>
          </div>

          {/* Probability Percentage */}
          <div className="text-right font-mono-tabular">
            <span className="text-xs text-zinc-400">Mean Confidence: </span>
            <span className="text-sm font-bold text-zinc-100">{probPct}%</span>
          </div>
        </div>

        {/* Prominent Warning Banner (rendered ONLY when model uncertainty variance > 0.02) */}
        {!isSafe && (
          <div className="p-3.5 rounded-lg border flex items-center gap-3 text-xs bg-rose-950/40 border-rose-800/60 text-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-[11px] uppercase tracking-wide">
                High Uncertainty — Queued for Radiologist Review
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Epistemic model variance ({epistemic_variance.toFixed(6)}) exceeds safety threshold (&gt; 0.0200). Mandatory radiologist verification required.
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Summary Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono-tabular">
          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-500 uppercase">Probability</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5">{probPct}%</div>
          </div>

          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-500 uppercase">MC Variance</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5">{epistemic_variance.toFixed(6)}</div>
          </div>

          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-500 uppercase">Focal Quadrant</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5 truncate" title={dominant_quadrant}>
              {dominant_quadrant}
            </div>
          </div>
        </div>

      </div>

      {/* 2. Tabbed / Clean Radiology Impression (Bottom) */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between overflow-hidden">
        
        {/* Card Header Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Gemini Radiology Impression
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setIsEditing(!isEditing)}
              type="button"
              className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors flex items-center gap-1 text-[11px]"
            >
              <Edit3 className="h-3 w-3 text-zinc-400" />
              <span>{isEditing ? 'Save' : 'Edit Report'}</span>
            </button>

            <button
              onClick={handleCopy}
              type="button"
              className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors flex items-center gap-1 text-[11px]"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-zinc-400" />
              )}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium transition-colors flex items-center gap-1 text-[11px]"
            >
              <Printer className="h-3 w-3" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-3">
          {isEditing ? (
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              rows={12}
              className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          ) : (
            <div className="prose prose-invert max-w-none text-zinc-300 text-xs leading-relaxed space-y-3 font-sans">
              <ReactMarkdown
                components={{
                  h3: ({ children }) => (
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-1 mt-3 mb-1.5">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="mb-2 text-zinc-300 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1.5 text-zinc-300">{children}</ul>,
                  li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-zinc-950 border border-zinc-800 px-1 py-0.5 rounded text-zinc-200 font-mono text-[11px]">
                      {children}
                    </code>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                }}
              >
                {reportContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex justify-between items-center no-print">
          <span>AI Clinical Decision Support Engine &bull; Gemini 2.5 Flash</span>
          <span>Verified Workstation Output</span>
        </div>

      </div>

    </div>
  );
}
