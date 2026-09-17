import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Server, Brain } from 'lucide-react';

export default function Header() {
  const [health, setHealth] = useState({ status: 'checking', device: '' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealth({ status: 'online', device: data.device || 'CPU' });
        } else {
          setHealth({ status: 'offline', device: '' });
        }
      } catch (err) {
        setHealth({ status: 'offline', device: '' });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-sky-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                PneumoScan <span className="text-sky-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full">
                v1.0 Clinical
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Uncertainty-Aware Pneumonia Triage & Radiology Consultation
            </p>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Backbone Model */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <Brain className="h-3.5 w-3.5 text-indigo-400" />
            <span>EfficientNet-B0 + MC Dropout (n=15)</span>
          </div>

          {/* GenAI Engine */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Gemini 2.5 Flash</span>
          </div>

          {/* Server Health Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            {health.status === 'online' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                API Ready ({health.device.toUpperCase()})
              </span>
            ) : health.status === 'checking' ? (
              <span className="text-amber-400">Connecting...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                Backend Offline
              </span>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
