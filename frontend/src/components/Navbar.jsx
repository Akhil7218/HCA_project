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
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            PneumoScan <span className="text-zinc-400 font-normal">Clinical PACS</span>
          </span>
        </div>
      </div>
    </header>
  );
}
