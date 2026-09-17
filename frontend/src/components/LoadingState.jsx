import React, { useState, useEffect } from 'react';
import { Activity, Brain, Sparkles, Shield, Cpu } from 'lucide-react';

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Preprocessing Radiograph Tensor", desc: "Resizing to 224x224 & normalizing channel distributions", icon: Cpu },
    { title: "Executing 15 MC Dropout Forward Passes", desc: "Sampling stochastic model weights to measure epistemic uncertainty", icon: Brain },
    { title: "Computing Epistemic Variance & Grad-CAM", desc: "Attributing focal feature saliency across anatomical lung quadrants", icon: Activity },
    { title: "Invoking Gemini 2.5 Flash GenAI Model", desc: "Synthesizing formal 4-section clinical radiology report", icon: Sparkles },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl max-w-xl mx-auto text-center space-y-6 relative overflow-hidden">
      
      {/* Laser Scan line effect */}
      <div className="animate-scanline"></div>

      {/* Pulsing Central Spinner */}
      <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-sky-400 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin"></div>
        <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 shadow-lg">
          <Activity className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Executing Uncertainty-Aware AI Analysis...
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Please wait while PyTorch tensor pipeline computes MC Dropout variance and Gemini generates report
        </p>
      </div>

      {/* Step Progress List */}
      <div className="space-y-3 text-left max-w-md mx-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                isActive
                  ? 'bg-sky-500/10 border-sky-500/30 text-white scale-[1.02]'
                  : isDone
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  : 'opacity-40 border-transparent text-slate-600'
              }`}
            >
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? '✓' : <Icon className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold">{step.title}</div>
                <div className="text-[11px] text-slate-400">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
