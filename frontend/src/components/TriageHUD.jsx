import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, Target, HelpCircle } from 'lucide-react';

export default function TriageHUD({ data }) {
  if (!data) return null;

  const {
    prediction,
    mean_probability,
    epistemic_variance,
    triage_status,
    dominant_quadrant,
  } = data;

  const isPneumonia = prediction === 'PNEUMONIA';
  const isSafe = triage_status === 'SAFE_FOR_TRIAGE';
  const probPct = (mean_probability * 100).toFixed(1);

  return (
    <div className="space-y-4">
      
      {/* Triage Banner Alert (Top HUD) */}
      <div
        className={`rounded-2xl p-4 border flex flex-col md:flex-row items-center justify-between gap-4 transition-all shadow-xl ${
          isSafe
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/50 border-amber-500/40 text-amber-200 glow-red'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
              isSafe
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
            }`}
          >
            {isSafe ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
                Triage Safety Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                  isSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {isSafe ? 'SAFE FOR TRIAGE' : 'FLAGGED FOR MANUAL REVIEW'}
              </span>
            </div>
            <p className="text-sm font-medium mt-0.5">
              {isSafe
                ? `Model uncertainty variance (${epistemic_variance.toFixed(6)}) <= 0.0200 threshold. Cleared for standard clinical workflow.`
                : `Model uncertainty variance (${epistemic_variance.toFixed(6)}) > 0.0200 threshold. MANDATORY radiologist review required.`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs opacity-75 font-mono">Epistemic Variance</div>
          <div className="text-lg font-bold font-mono text-white">
            {epistemic_variance.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Metrics HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Primary Diagnosis */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-semibold">Primary Diagnosis</span>
            <Activity className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black tracking-tight ${
                  isPneumonia ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {prediction}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({isPneumonia ? 'Consolidation Detected' : 'No Acute Infiltrates'})
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Confidence Score</span>
                <span className="font-semibold text-white">{probPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-full ${
                    isPneumonia
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${probPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Epistemic Uncertainty */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-semibold">Epistemic Uncertainty</span>
            <HelpCircle className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {epistemic_variance.toFixed(6)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (MC Dropout Var)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calculated over 15 stochastic MC forward passes. Safety cutoff threshold is <code className="text-sky-300 font-mono">0.0200</code>.
            </p>
          </div>
        </div>

        {/* Card 3: Dominant Quadrant Attribution */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-semibold">Focal Attribution</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white mb-1">
              {dominant_quadrant}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Grad-CAM spatial heatmap integration identifies peak activation within this anatomical quadrant.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
