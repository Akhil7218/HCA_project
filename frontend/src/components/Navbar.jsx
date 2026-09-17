import React, { useState, useEffect } from 'react';
import { Activity, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const [health, setHealth] = useState({ status: 'checking', device: 'CPU' });

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
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-50">
      {/* Brand & PACS Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            PneumoScan <span className="text-zinc-400 font-normal">Clinical PACS</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block"></div>

        {/* Connection Status Badge */}
        {health.status === 'online' ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PACS Connected &bull; Model Ready</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-amber-400">
            <AlertCircle className="h-3 w-3" />
            <span>{health.status === 'checking' ? 'Connecting to API...' : 'Backend Offline'}</span>
          </div>
        )}
      </div>

      {/* Workstation Technical Metadata */}
      <div className="hidden md:flex items-center gap-5 text-xs text-zinc-400 font-mono-tabular">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-zinc-500" />
          <span>EfficientNet-B0</span>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800"></div>
        <div>
          Device: <span className="text-zinc-200 font-semibold">{health.device.toUpperCase()}</span>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800"></div>
        <div>
          Latency: <span className="text-emerald-400 font-semibold">&lt;400ms</span>
        </div>
      </div>
    </header>
  );
}
