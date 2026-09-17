import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PACSViewport from './components/PACSViewport';
import TriageClinicalPanel from './components/TriageClinicalPanel';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  const handleAnalyze = async (file, previewUrl) => {
    setIsLoading(true);
    setError(null);
    setUploadedPreview(previewUrl);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        const res = await fetch(previewUrl);
        const blob = await res.blob();
        formData.append('file', blob, 'sample_radiograph.png');
      } else {
        throw new Error('No valid image file selected to analyze.');
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Analysis execution failed' }));
        throw new Error(errData.detail || 'Failed to complete X-ray analysis.');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Error executing model inference:", err);
      setError(err.message || 'An unexpected error occurred during triage analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setUploadedPreview(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      
      {/* 1. Top Minimal Navigation Bar */}
      <Navbar />

      {/* 2. Main Two-Column PACS Workstation Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Global Error Banner */}
        {error && (
          <div className="lg:col-span-12 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 underline font-medium hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Left Column: Viewport & Image Controls (55% width -> 7 cols on 12 grid) */}
        <div className="lg:col-span-7 flex flex-col">
          <PACSViewport
            originalImage={analysisResult?.original_image_base64 || uploadedPreview}
            gradcamOverlay={analysisResult?.gradcam_overlay_base64}
            dominantQuadrant={analysisResult?.dominant_quadrant}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Triage & Clinical Documentation (45% width -> 5 cols on 12 grid) */}
        <div className="lg:col-span-5 flex flex-col">
          <TriageClinicalPanel
            analysisData={analysisResult}
            isLoading={isLoading}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-3 text-center text-[11px] text-zinc-600 no-print">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <span>PneumoScan Clinical Workstation &copy; {new Date().getFullYear()}</span>
          <span className="font-mono">EfficientNet-B0 &bull; MC Dropout (n=15) &bull; Gemini 2.5 Flash</span>
        </div>
      </footer>

    </div>
  );
}
