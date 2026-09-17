import React, { useState } from 'react';
import { Eye, Layers, Sliders, Grid, Maximize2 } from 'lucide-react';

export default function SaliencyViewer({ originalImage, gradcamOverlay, dominantQuadrant }) {
  const [opacity, setOpacity] = useState(0.8); // 0 to 1
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' | 'side-by-side'
  const [showQuadrantGrid, setShowQuadrantGrid] = useState(true);

  if (!originalImage && !gradcamOverlay) return null;

  const displayOriginal = originalImage || gradcamOverlay;
  const displayOverlay = gradcamOverlay || originalImage;

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl">
      
      {/* Header & Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-sky-400" />
            <span>Interactive Grad-CAM Saliency Viewer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize deep learning activation maps highlighting anatomical features driving classification
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('overlay')}
              type="button"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'overlay'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Blended Overlay</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              type="button"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'side-by-side'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            onClick={() => setShowQuadrantGrid(!showQuadrantGrid)}
            type="button"
            className={`p-2 rounded-xl border transition-colors ${
              showQuadrantGrid
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Anatomical Quadrant Grid Overlay"
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      {viewMode === 'overlay' ? (
        /* Single Interactive Stacked Canvas with Opacity Slider */
        <div className="space-y-4">
          <div className="relative mx-auto max-w-lg aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
            
            {/* Base Layer: Original Radiograph */}
            <img
              src={displayOriginal}
              alt="Original Radiograph"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Overlay Layer: Grad-CAM Heatmap */}
            <img
              src={displayOverlay}
              alt="Grad-CAM Saliency Overlay"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-75"
              style={{ opacity: opacity }}
            />

            {/* Optional Anatomical Quadrants Grid */}
            {showQuadrantGrid && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2">
                <div
                  className={`border-r border-b border-sky-400/30 p-2 text-[11px] font-semibold text-sky-300 bg-sky-950/10 ${
                    dominantQuadrant === 'Right Upper Lobe' ? 'bg-rose-500/20 border-rose-400/60 ring-2 ring-rose-400 ring-inset' : ''
                  }`}
                >
                  Right Upper Lobe (RUL)
                </div>
                <div
                  className={`border-b border-sky-400/30 p-2 text-[11px] font-semibold text-sky-300 bg-sky-950/10 ${
                    dominantQuadrant === 'Left Upper Lobe' ? 'bg-rose-500/20 border-rose-400/60 ring-2 ring-rose-400 ring-inset' : ''
                  }`}
                >
                  Left Upper Lobe (LUL)
                </div>
                <div
                  className={`border-r border-sky-400/30 p-2 text-[11px] font-semibold text-sky-300 bg-sky-950/10 flex items-end ${
                    dominantQuadrant === 'Right Lower Lobe' ? 'bg-rose-500/20 border-rose-400/60 ring-2 ring-rose-400 ring-inset' : ''
                  }`}
                >
                  Right Lower Lobe (RLL)
                </div>
                <div
                  className={`p-2 text-[11px] font-semibold text-sky-300 bg-sky-950/10 flex items-end ${
                    dominantQuadrant === 'Left Lower Lobe' ? 'bg-rose-500/20 border-rose-400/60 ring-2 ring-rose-400 ring-inset' : ''
                  }`}
                >
                  Left Lower Lobe (LLL)
                </div>
              </div>
            )}
          </div>

          {/* Interactive Opacity Controls */}
          <div className="max-w-md mx-auto bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <Sliders className="h-4 w-4 text-sky-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span>Heatmap Opacity</span>
                <span className="font-mono text-sky-400">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Dual View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Original */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Original Radiograph</span>
              <span className="text-slate-500 font-normal">Standard PA/AP View</span>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
              <img
                src={displayOriginal}
                alt="Original Radiograph"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Card 2: Grad-CAM Overlay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Grad-CAM Color Heatmap</span>
              <span className="text-rose-400 font-mono">Focal: {dominantQuadrant}</span>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
              <img
                src={displayOverlay}
                alt="Grad-CAM Overlay"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

        </div>
      )}

      {/* Heatmap Colormap Scale Legend */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">Grad-CAM Feature Activation Intensity Spectrum:</span>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-slate-400 font-mono">Baseline (0.0)</span>
          <div className="h-3.5 w-48 rounded-md bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-red-600 border border-slate-700"></div>
          <span className="text-rose-400 font-semibold font-mono">High Focal (1.0)</span>
        </div>
      </div>

    </div>
  );
}
