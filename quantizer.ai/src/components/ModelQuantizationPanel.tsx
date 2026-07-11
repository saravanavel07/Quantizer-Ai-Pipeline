import React, { useState, useMemo } from 'react';
import { Layers, HelpCircle, RefreshCw, Sliders, ChevronRight } from 'lucide-react';
import { QuantizationType, WeightLayer } from '../types';

interface ModelQuantizationPanelProps {
  activeQuantization: QuantizationType;
  onChangeQuantization: (quant: QuantizationType) => void;
}

// Generate static sample bell curve weights to simulate actual layer weights
function generateBellCurve(pointsCount = 40): number[] {
  const weights: number[] = [];
  for (let i = 0; i < pointsCount; i++) {
    const x = (i - pointsCount / 2) / (pointsCount / 10);
    // Gaussian formula
    const y = Math.exp(-0.5 * x * x);
    weights.push(y);
  }
  return weights;
}

export default function ModelQuantizationPanel({
  activeQuantization,
  onChangeQuantization,
}: ModelQuantizationPanelProps) {
  const [clippingLimit, setClippingLimit] = useState<number>(2.4); // maximum clip range
  const [calibrationMode, setCalibrationMode] = useState<'symmetric' | 'asymmetric'>('symmetric');
  const [selectedLayer, setSelectedLayer] = useState<string>('Conv2d_Layer1.weight');

  // Mathematical variables for scale & zero-point calculation based on bits
  const bits = activeQuantization === 'FP32' ? 32 : activeQuantization === 'FP16' ? 16 : activeQuantization === 'INT8' ? 8 : 4;
  
  const formulaInfo = useMemo(() => {
    const qMin = calibrationMode === 'symmetric' ? -(Math.pow(2, bits - 1)) : 0;
    const qMax = calibrationMode === 'symmetric' ? (Math.pow(2, bits - 1) - 1) : Math.pow(2, bits) - 1;
    const scale = bits >= 16 ? 'N/A' : ((2 * clippingLimit) / (qMax - qMin)).toFixed(5);
    const zeroPoint = bits >= 16 ? 'N/A' : (calibrationMode === 'symmetric' ? 0 : Math.round(qMin + clippingLimit / Number(scale)));
    
    // Simulating KL-divergence (error rate) based on bits and clipping range
    // Over-clipping (too low clippingLimit) cuts peak distribution. Under-clipping (too high) causes poor resolution.
    // Optimal clipping for normal bell curve is usually around 2.0 - 2.5
    let klDivergence = 0;
    if (bits < 16) {
      const clipDistFromOpt = Math.abs(clippingLimit - 2.2);
      klDivergence = 0.005 + (clipDistFromOpt * 0.08) + (bits === 4 ? 0.35 : 0.04);
    }
    
    return { qMin, qMax, scale, zeroPoint, klDivergence: klDivergence.toFixed(4) };
  }, [bits, clippingLimit, calibrationMode]);

  // Generate dynamic weight data for visualization
  const weightDistribution = useMemo(() => {
    const original = generateBellCurve(50);
    
    // Map floating weights to quantized slots
    return original.map((val, idx) => {
      const xVal = ((idx - 25) / 10); // goes -2.5 to 2.5
      const isClipped = Math.abs(xVal) > clippingLimit;
      
      let quantizedVal = val;
      if (isClipped) {
        quantizedVal = 0.05; // squashed value
      } else if (bits < 16) {
        // Apply stepped values to simulate low bit widths
        const stepsCount = bits === 8 ? 16 : 4;
        quantizedVal = Math.round(val * stepsCount) / stepsCount;
      }

      return {
        index: idx,
        xVal: Number(xVal.toFixed(2)),
        originalVal: val,
        quantizedVal: quantizedVal,
        clipped: isClipped
      };
    });
  }, [clippingLimit, bits]);

  // Comparative mock model size stats
  const sizeStats = useMemo(() => {
    const baseMb = 142.5; // FP32 weights size
    const currentMb = (baseMb * bits) / 32;
    return {
      baseMb,
      currentMb: currentMb.toFixed(1),
      savingsPct: (100 - (bits / 32) * 100).toFixed(0)
    };
  }, [bits]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Quantization Engine & Calibration Panel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimize weights bits compression vs reconstruction error (KL-divergence loss).
          </p>
        </div>
        
        {/* Tab-select for target Quantization */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
          {(['FP32', 'FP16', 'INT8', 'INT4'] as QuantizationType[]).map((q) => (
            <button
              id={`quant-tab-${q}`}
              key={q}
              onClick={() => onChangeQuantization(q)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                activeQuantization === q
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calibration & Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Layer Select */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2.5 font-display">Target Weights Layer</h3>
            <div className="space-y-1.5">
              {[
                'Conv2d_Layer1.weight',
                'Conv2d_Layer2.weight',
                'GAN_Generator.dense.weight',
                'GAN_Discriminator.conv1.weight'
              ].map((layer) => (
                <button
                  key={layer}
                  onClick={() => setSelectedLayer(layer)}
                  className={`w-full text-left text-[11px] font-mono px-2.5 py-1.5 rounded-md flex items-center justify-between border transition-all ${
                    selectedLayer === layer
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{layer}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Quantization Settings */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3.5 font-display flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              Calibration Config
            </h3>

            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setCalibrationMode('symmetric')}
                className={`py-1.5 text-[10px] font-mono rounded-lg border transition-all cursor-pointer text-center ${
                  calibrationMode === 'symmetric'
                    ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Symmetric (Clip: [-α, α])
              </button>
              <button
                onClick={() => setCalibrationMode('asymmetric')}
                className={`py-1.5 text-[10px] font-mono rounded-lg border transition-all cursor-pointer text-center ${
                  calibrationMode === 'asymmetric'
                    ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Asymmetric (Clip: [β, α])
              </button>
            </div>

            {/* Threshold Slider (only interactive if quantized) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">Clipping Boundary (α):</span>
                <span className="text-indigo-400 font-bold">{clippingLimit.toFixed(2)} σ</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={clippingLimit}
                onChange={(e) => setClippingLimit(parseFloat(e.target.value))}
                disabled={activeQuantization === 'FP32'}
                className="w-full accent-indigo-500 bg-slate-900 h-1 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-500 leading-relaxed">
                {activeQuantization === 'FP32' 
                  ? "Calibration disabled in FP32 precision modes."
                  : "Optimize boundary (α) to balance clipping saturation vs step truncation resolutions."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Graphical Weight Histograms & Math formulas */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          
          {/* Sizing comparisons and mathematical outputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">Model Size Savings</span>
              <span className="text-lg font-bold text-emerald-400 font-display mt-0.5 block">-{sizeStats.savingsPct}%</span>
              <span className="text-[10px] font-mono text-slate-400">{sizeStats.currentMb} MB / {sizeStats.baseMb} MB</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">Quantization Scale (S)</span>
              <span className="text-lg font-bold text-indigo-300 font-display mt-0.5 block">{formulaInfo.scale}</span>
              <span className="text-[10px] font-mono text-slate-400">Zero Point (ZP): {formulaInfo.zeroPoint}</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">Reconstruction Noise</span>
              <span className="text-lg font-bold font-display mt-0.5 block text-amber-400">{formulaInfo.klDivergence}</span>
              <span className="text-[10px] font-mono text-slate-400">KL Divergence Error</span>
            </div>
          </div>

          {/* SVG Histograms */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                Weight Probability Distribution Function [W(x)]
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {selectedLayer}
              </span>
            </div>

            {/* Pure SVG Histogram representing neural weights distribution */}
            <div className="relative w-full h-[150px] mt-2">
              <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                {/* Zero baseline line */}
                <line x1="0" y1="130" x2="500" y2="130" stroke="#1e293b" strokeWidth="1" />
                
                {/* Middle zero weight marker */}
                <line x1="250" y1="10" x2="250" y2="135" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                <text x="250" y="145" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">w_avg = 0.0</text>

                {/* Left/Right clipping boundaries indicators */}
                {activeQuantization !== 'FP32' && (
                  <>
                    {/* Left clipping bounds */}
                    <line 
                      x1={250 - (clippingLimit * 80)} 
                      y1="5" 
                      x2={250 - (clippingLimit * 80)} 
                      y2="130" 
                      stroke="#f59e0b" 
                      strokeWidth="1.5" 
                    />
                    <text x={250 - (clippingLimit * 80)} y="145" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      {calibrationMode === 'symmetric' ? `-${clippingLimit.toFixed(1)}σ` : 'β'}
                    </text>
                    {/* Left clipping shade */}
                    <rect 
                      x="0" 
                      y="5" 
                      width={250 - (clippingLimit * 80)} 
                      height="125" 
                      fill="rgba(245, 158, 11, 0.05)" 
                    />

                    {/* Right clipping bounds */}
                    <line 
                      x1={250 + (clippingLimit * 80)} 
                      y1="5" 
                      x2={250 + (clippingLimit * 80)} 
                      y2="130" 
                      stroke="#f59e0b" 
                      strokeWidth="1.5" 
                    />
                    <text x={250 + (clippingLimit * 80)} y="145" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      +{clippingLimit.toFixed(1)}σ
                    </text>
                    {/* Right clipping shade */}
                    <rect 
                      x={250 + (clippingLimit * 80)} 
                      y="5" 
                      width={250 - (clippingLimit * 80)} 
                      height="125" 
                      fill="rgba(245, 158, 11, 0.05)" 
                    />
                  </>
                )}

                {/* Original weight weights path (smooth blue line) */}
                <path
                  d={weightDistribution.map((pt, i) => {
                    const x = (i * 500) / (weightDistribution.length - 1);
                    const y = 130 - (pt.originalVal * 110);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  opacity="0.35"
                />

                {/* Quantized/Stepped Weights bars (vertical segments) */}
                {weightDistribution.map((pt, i) => {
                  const x = (i * 500) / (weightDistribution.length - 1);
                  const y = 130 - (pt.quantizedVal * 110);
                  const isClipped = pt.clipped && activeQuantization !== 'FP32';

                  return (
                    <rect
                      key={i}
                      x={x - 3}
                      y={y}
                      width="6"
                      height={130 - y}
                      fill={isClipped ? '#f59e0b' : '#6366f1'}
                      opacity={isClipped ? 0.3 : 0.8}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Color key legends */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-sky-400 rounded"></span> FP32 Float Distribution
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded"></span> Quantized Integer Steps
                </span>
                {activeQuantization !== 'FP32' && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded opacity-50"></span> Saturation Clipping Area
                  </span>
                )}
              </div>

              {/* Mathematical Equation presentation */}
              <div className="text-right text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                {"$$q = \\text{clamp}\\left(\\left\\lfloor \\frac{w}{S} \\right\\rceil + ZP, q_{\\text{min}}, q_{\\text{max}}\\right)$$" }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
