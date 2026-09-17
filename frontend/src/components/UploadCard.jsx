import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, X, Play, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function UploadCard({ onAnalyze, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !['png', 'jpg', 'jpeg'].includes(fileExt)) {
      setError('Invalid file format. Please upload a PNG, JPG, or JPEG chest radiograph.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl && !previewUrl.startsWith('data:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setError('Please select or upload a chest radiograph image first.');
      return;
    }
    onAnalyze(selectedFile, previewUrl);
  };

  // Helper to generate a realistic synthetic radiograph data URI for sample testing
  const createSampleXray = (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Dark ribcage gradient background
    const bgGrad = ctx.createRadialGradient(200, 200, 20, 200, 200, 220);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.7, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 400);

    // Lung field outlines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    
    // Right lung
    ctx.beginPath();
    ctx.ellipse(130, 200, 60, 120, -0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.stroke();

    // Left lung
    ctx.beginPath();
    ctx.ellipse(270, 200, 60, 120, 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.stroke();

    // Spine and rib bones simulation
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(200, 40);
    ctx.lineTo(200, 360);
    ctx.stroke();

    // Rib arcs
    for (let y = 100; y <= 300; y += 35) {
      ctx.beginPath();
      ctx.arc(200, y, 70, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(200, y, 70, 1.2 * Math.PI, 1.8 * Math.PI, false);
      ctx.stroke();
    }

    if (type === 'PNEUMONIA') {
      // Right Upper Lobe dense cloud opacity consolidation
      const cloudGrad = ctx.createRadialGradient(130, 140, 5, 130, 140, 55);
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      cloudGrad.addColorStop(0.5, 'rgba(226, 232, 240, 0.6)');
      cloudGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(130, 140, 55, 0, 2 * Math.PI);
      ctx.fill();
    }

    canvas.toBlob((blob) => {
      const file = new File([blob], `sample_${type.toLowerCase()}_xray.png`, { type: 'image/png' });
      handleFile(file);
    }, 'image/png');
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileImage className="h-5 w-5 text-sky-400" />
          <span>Upload Chest Radiograph</span>
        </h2>
        <span className="text-xs text-slate-400">Supported formats: PNG, JPG, JPEG</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Drag-and-Drop Area */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[240px] ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-900/40 bg-slate-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
          />

          <div className="h-16 w-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-8 w-8 text-sky-400" />
          </div>

          <p className="text-sm font-medium text-slate-200 mb-1">
            Drag and drop X-ray radiograph here, or <span className="text-sky-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 max-w-md">
            Single-view PA/AP projection standard DICOM/PNG export. Max file size: 10MB.
          </p>
        </div>
      ) : (
        /* Image Preview Area */
        <div className="relative rounded-xl border border-slate-700/60 bg-slate-950 p-4 flex flex-col md:flex-row items-center gap-6">
          <div className="relative h-56 w-56 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 shadow-lg group">
            <img
              src={previewUrl}
              alt="Chest X-Ray Preview"
              className="h-full w-full object-cover"
            />
            <button
              onClick={handleClear}
              type="button"
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-rose-600 flex items-center justify-center backdrop-blur-md transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 w-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Image Loaded
                </span>
                <span className="text-xs text-slate-400 truncate max-w-xs">
                  {selectedFile ? selectedFile.name : 'Sample Radiograph'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Radiograph is preprocessed and ready for 15-sample MC Dropout uncertainty calculation and Grad-CAM feature attribution.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                type="button"
                className="flex-1 min-w-[180px] py-3 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Execute AI Triage Analysis</span>
              </button>
              <button
                onClick={handleClear}
                type="button"
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Demo Samples Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
          <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
          <span>Don't have an X-ray handy? Try a sample:</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => createSampleXray('PNEUMONIA')}
            disabled={isLoading}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors font-medium flex items-center gap-1"
          >
            + Sample Pneumonia X-Ray
          </button>
          <button
            onClick={() => createSampleXray('NORMAL')}
            disabled={isLoading}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium flex items-center gap-1"
          >
            + Sample Normal X-Ray
          </button>
        </div>
      </div>

    </div>
  );
}
