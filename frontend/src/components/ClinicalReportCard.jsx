import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, Printer, Edit3, Save, Sparkles } from 'lucide-react';

export default function ClinicalReportCard({ reportText }) {
  const [reportContent, setReportContent] = useState(reportText || '');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if new reportText comes from parent
  React.useEffect(() => {
    if (reportText) {
      setReportContent(reportText);
    }
  }, [reportText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
      
      {/* Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>Gemini Clinical Radiology Report</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold uppercase flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> AI Consultation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Structured 4-section medical consultation report generated via Gemini 2.5 Flash
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsEditing(!isEditing)}
            type="button"
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
          >
            {isEditing ? (
              <>
                <Save className="h-3.5 w-3.5 text-emerald-400" />
                <span>Save Note</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5 text-sky-400" />
                <span>Edit Report</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            type="button"
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Body */}
      {isEditing ? (
        <div className="space-y-2">
          <label className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <span>Clinical Note Editing Mode (Markdown format supported):</span>
          </label>
          <textarea
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      ) : (
        <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 bg-slate-950/60 p-6 rounded-xl border border-slate-800/80">
          <ReactMarkdown
            components={{
              h3: ({ children }) => (
                <h3 className="text-base font-bold text-sky-400 border-b border-slate-800/80 pb-1.5 mt-4 mb-2 flex items-center gap-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="mb-3 text-slate-300">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-300">{children}</ul>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
              code: ({ children }) => (
                <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono text-xs">
                  {children}
                </code>
              ),
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            }}
          >
            {reportContent}
          </ReactMarkdown>
        </div>
      )}

      {/* Medical Footer */}
      <div className="pt-2 text-[11px] text-slate-500 flex justify-between items-center no-print">
        <span>Report Generated: {new Date().toLocaleString()}</span>
        <span>PneumoScan AI Diagnostic Assistance Engine</span>
      </div>

    </div>
  );
}
