import React, { useState, useRef } from 'react';
import { Upload, Sliders, Grid, RefreshCw, Eye, Layers, Columns, Image as ImageIcon, Sparkles, Play, AlertCircle } from 'lucide-react';

export default function PACSViewport({
  originalImage,
  gradcamOverlay,
  dominantQuadrant,
  onAnalyze,
  onReset,
  isLoading,
}) {
  const [opacity, setOpacity] = useState(0.85);
  const [viewMode, setViewMode] = useState('overlay'); // 'original' | 'overlay' | 'split'
  const [showQuadrantGrid, setShowQuadrantGrid] = useState(true);
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
      setError('Invalid file format. Upload a PNG, JPG, or JPEG radiograph.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
    onReset();
  };

  const handleSubmit = () => {
    if (!selectedFile && !previewUrl) {
      setError('Please select or upload a chest radiograph first.');
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

    // Ribcage background
    const bgGrad = ctx.createRadialGradient(200, 200, 20, 200, 200, 220);
    bgGrad.addColorStop(0, '#18181b');
    bgGrad.addColorStop(0.7, '#09090b');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 400);

    // Lung outlines
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.ellipse(130, 200, 60, 120, -0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(270, 200, 60, 120, 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.stroke();

    // Spine
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.2)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(200, 40);
    ctx.lineTo(200, 360);
    ctx.stroke();

    // Ribs
    for (let y = 100; y <= 300; y += 35) {
      ctx.beginPath();
      ctx.arc(200, y, 70, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(200, y, 70, 1.2 * Math.PI, 1.8 * Math.PI, false);
      ctx.stroke();
    }

    if (type === 'PNEUMONIA') {
      const cloudGrad = ctx.createRadialGradient(130, 140, 5, 130, 140, 55);
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      cloudGrad.addColorStop(0.5, 'rgba(228, 228, 231, 0.6)');
      cloudGrad.addColorStop(1, 'rgba(161, 161, 170, 0)');
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

  const activeImage = originalImage || previewUrl;
  const activeOverlay = gradcamOverlay;

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Viewport Top Toolbar */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
            DICOM Viewport
          </span>
          {activeImage && (
            <span className="text-zinc-500 truncate max-w-[160px] font-mono">
              {selectedFile?.name || 'PA/AP Chest Radiograph'}
            </span>
          )}
        </div>

        {/* View Mode Switcher Pill */}
        {activeOverlay ? (
          <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center gap-0.5">
            <button
              onClick={() => setViewMode('original')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 text-[11px] ${
                viewMode === 'original'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Original</span>
            </button>

            <button
              onClick={() => setViewMode('overlay')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 text-[11px] ${
                viewMode === 'overlay'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3 w-3 text-sky-400" />
              <span>Saliency Overlay</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 text-[11px] ${
                viewMode === 'split'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns className="h-3 w-3 text-indigo-400" />
              <span>Split View</span>
            </button>
          </div>
        ) : null}

        {/* Control Tools */}
        <div className="flex items-center gap-2">
          {activeImage && (
            <button
              onClick={() => setShowQuadrantGrid(!showQuadrantGrid)}
              type="button"
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                showQuadrantGrid
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
              title="Toggle Quadrant Grid"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
          )}

          {activeImage && (
            <button
              onClick={handleClear}
              type="button"
              className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Scan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Content Area */}
      <div className="flex-1 pacs-viewport relative min-h-[420px] flex items-center justify-center p-4">
        
        {error && (
          <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {!activeImage ? (
          /* Empty / Upload Trigger View */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-md border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-zinc-400 bg-zinc-900/60'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              className="hidden"
            />
            <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-200 mb-1">
              Select or Drop Chest Radiograph DICOM/Image
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Supports standard PA/AP single-view PNG, JPG, or JPEG format up to 10MB.
            </p>
          </div>
        ) : (
          /* Image Display Canvas */
          <div className="w-full h-full flex items-center justify-center relative">
            
            {viewMode === 'split' && activeOverlay ? (
              /* Split View Mode */
              <div className="grid grid-cols-2 gap-3 w-full h-full max-h-[460px]">
                <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black">
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300">
                    Original PA/AP View
                  </span>
                  <img src={activeImage} alt="Original Radiograph" className="w-full h-full object-contain" />
                </div>
                <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black">
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-rose-400">
                    Grad-CAM Saliency
                  </span>
                  <img src={activeOverlay} alt="Saliency Overlay" className="w-full h-full object-contain" />
                </div>
              </div>
            ) : (
              /* Single Stacked View (Original or Blended Overlay) */
              <div className="relative max-w-lg aspect-square w-full rounded-lg overflow-hidden bg-black border border-zinc-800 shadow-xl">
                
                {/* Base Image */}
                <img
                  src={activeImage}
                  alt="Radiograph"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Saliency Heatmap Layer */}
                {activeOverlay && viewMode === 'overlay' && (
                  <img
                    src={activeOverlay}
                    alt="Grad-CAM Overlay"
                    className="absolute inset-0 w-full h-full object-contain transition-opacity duration-75"
                    style={{ opacity: opacity }}
                  />
                )}

                {/* Anatomical Quadrants Grid */}
                {showQuadrantGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2">
                    <div
                      className={`border-r border-b border-zinc-700/40 p-2 text-[10px] font-mono text-zinc-400 ${
                        dominantQuadrant === 'Right Upper Lobe' ? 'bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500 ring-inset text-rose-300 font-semibold' : ''
                      }`}
                    >
                      RUL (Right Upper Lobe)
                    </div>
                    <div
                      className={`border-b border-zinc-700/40 p-2 text-[10px] font-mono text-zinc-400 ${
                        dominantQuadrant === 'Left Upper Lobe' ? 'bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500 ring-inset text-rose-300 font-semibold' : ''
                      }`}
                    >
                      LUL (Left Upper Lobe)
                    </div>
                    <div
                      className={`border-r border-zinc-700/40 p-2 text-[10px] font-mono text-zinc-400 flex items-end ${
                        dominantQuadrant === 'Right Lower Lobe' ? 'bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500 ring-inset text-rose-300 font-semibold' : ''
                      }`}
                    >
                      RLL (Right Lower Lobe)
                    </div>
                    <div
                      className={`p-2 text-[10px] font-mono text-zinc-400 flex items-end ${
                        dominantQuadrant === 'Left Lower Lobe' ? 'bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500 ring-inset text-rose-300 font-semibold' : ''
                      }`}
                    >
                      LLL (Left Lower Lobe)
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Viewport Bottom Controls Bar */}
      <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Opacity Slider (shown when overlay is active) */}
        {activeOverlay && viewMode === 'overlay' ? (
          <div className="flex items-center gap-3 w-full sm:w-72">
            <Sliders className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono-tabular">
                <span>Heatmap Opacity</span>
                <span className="text-zinc-200 font-semibold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
              />
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 text-[11px] font-mono">
            {activeImage && !activeOverlay ? 'Click Execute Triage Analysis to run model inference' : 'PACS Viewport Standby'}
          </div>
        )}

        {/* Action Controls & Sample Presets */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!activeOverlay && activeImage ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              type="button"
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-zinc-950" />
              <span>Execute Triage Analysis</span>
            </button>
          ) : null}

          {!activeImage ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 hidden sm:inline">Try preset sample:</span>
              <button
                onClick={() => createSampleXray('PNEUMONIA')}
                type="button"
                className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-rose-400 text-[11px] font-medium transition-colors"
              >
                + Pneumonia X-Ray
              </button>
              <button
                onClick={() => createSampleXray('NORMAL')}
                type="button"
                className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 text-[11px] font-medium transition-colors"
              >
                + Normal X-Ray
              </button>
            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
}
