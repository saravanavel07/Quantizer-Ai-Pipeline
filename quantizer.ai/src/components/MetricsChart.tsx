import React, { useMemo } from 'react';
import { LineChart, Activity, ShieldCheck, Gauge } from 'lucide-react';
import { SimulationHistoryPoint } from '../types';

interface MetricsChartProps {
  history: SimulationHistoryPoint[];
}

export default function MetricsChart({ history }: MetricsChartProps) {
  // If history is empty, provide a fallback visual state
  const isHistoryEmpty = history.length === 0;

  // Let's create a visual baseline history points array if empty to keep it beautiful
  const activeHistory = useMemo(() => {
    if (history.length > 0) return history;
    // Default baseline curves for startup
    return Array.from({ length: 6 }).map((_, i) => {
      const x = i;
      const factor = Math.exp(-x * 0.4);
      return {
        round: x,
        globalLoss: 0.9 * factor + 0.1,
        ganLossG: 1.5 * Math.exp(-x * 0.1) + 0.1,
        ganLossD: 0.3 * factor + 0.2 + 0.1 * Math.sin(x),
        cnnAccuracy: 0.65 + 0.3 * (1 - factor),
        compressionRatio: 4,
        avgLatency: 24,
      };
    });
  }, [history]);

  // Max-Min calculations for coordinate mapping
  const limits = useMemo(() => {
    const roundsCount = activeHistory.length;
    const maxLoss = Math.max(...activeHistory.map(h => Math.max(h.globalLoss, h.ganLossG, h.ganLossD)), 1.5);
    const minLoss = 0;
    const maxAcc = 1.0;
    const minAcc = 0.5;

    return { roundsCount, maxLoss, minLoss, maxAcc, minAcc };
  }, [activeHistory]);

  // Helper to map weight values to SVG viewbox coordinates (width: 500, height: 180)
  const getCoordinates = (index: number, val: number, isAccuracy = false) => {
    const total = activeHistory.length - 1 || 1;
    const x = (index / total) * 440 + 35; // margin left 35, width 440
    
    let y = 150;
    if (isAccuracy) {
      const range = limits.maxAcc - limits.minAcc;
      const ratio = (val - limits.minAcc) / range;
      y = 150 - ratio * 130; // margin bottom 30, height 130
    } else {
      const range = limits.maxLoss - limits.minLoss;
      const ratio = (val - limits.minLoss) / range;
      y = 150 - ratio * 130;
    }
    
    return { x, y };
  };

  // Generate SVG path coordinate strings
  const lossPathD = useMemo(() => {
    return activeHistory.map((pt, i) => {
      const { x, y } = getCoordinates(i, pt.globalLoss);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [activeHistory, limits]);

  const ganGPathD = useMemo(() => {
    return activeHistory.map((pt, i) => {
      const { x, y } = getCoordinates(i, pt.ganLossG);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [activeHistory, limits]);

  const ganDPathD = useMemo(() => {
    return activeHistory.map((pt, i) => {
      const { x, y } = getCoordinates(i, pt.ganLossD);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [activeHistory, limits]);

  const accPathD = useMemo(() => {
    return activeHistory.map((pt, i) => {
      const { x, y } = getCoordinates(i, pt.cnnAccuracy, true);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [activeHistory, limits]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 pb-4 mb-5 border-b border-slate-800">
        <LineChart className="text-indigo-400 h-5 w-5" />
        Decentralized Aggregation & Optimization Curves
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Chart: Dual Losses (Global Aggregated Loss, GAN G vs D) */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">Adversarial Convergence</span>
              <h3 className="text-xs font-semibold text-slate-300 font-display">Federated & GAN Training Losses</h3>
            </div>
            {isHistoryEmpty && (
              <span className="text-[9px] font-mono bg-slate-900 border border-slate-850 text-slate-500 px-2 py-0.5 rounded animate-pulse">
                SIMULATION BLUEPRINT
              </span>
            )}
          </div>

          <div className="relative h-[180px] w-full mt-2">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="35" y1="150" x2="475" y2="150" stroke="#1e293b" strokeWidth="1" />
              <line x1="35" y1="85" x2="475" y2="85" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="35" y1="20" x2="475" y2="20" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="3,3" />

              {/* Y Axis Ticks */}
              <text x="25" y="152" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">0.0</text>
              <text x="25" y="88" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">{(limits.maxLoss / 2).toFixed(1)}</text>
              <text x="25" y="23" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">{limits.maxLoss.toFixed(1)}</text>

              {/* X Axis Ticks (Rounds) */}
              {activeHistory.map((pt, i) => {
                const { x } = getCoordinates(i, pt.globalLoss);
                return (
                  <g key={`xtick-${i}`}>
                    <line x1={x} y1="150" x2={x} y2="154" stroke="#1e293b" />
                    <text x={x} y="165" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">R{pt.round}</text>
                  </g>
                );
              })}

              {/* Loss Lines */}
              {/* Global aggregate loss (deep sky blue) */}
              <path d={lossPathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              
              {/* GAN G loss (amber) */}
              <path d={ganGPathD} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
              
              {/* GAN D loss (fuchsia) */}
              <path d={ganDPathD} fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="4,2" />

              {/* Node highlights */}
              {activeHistory.map((pt, i) => {
                const coordLoss = getCoordinates(i, pt.globalLoss);
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={coordLoss.x}
                    cy={coordLoss.y}
                    r="4"
                    fill="#38bdf8"
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>

          {/* Chart key legends */}
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 pt-3 border-t border-slate-900 mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-sky-400 rounded-sm inline-block"></span> Global FedAvg Loss
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t border-dashed border-amber-500 inline-block"></span> GAN Generator Loss
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t border-dotted border-pink-500 inline-block"></span> GAN Discriminator Loss
            </span>
          </div>
        </div>

        {/* Right Chart: CNN test precision accuracy */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">Precision Tracking</span>
              <h3 className="text-xs font-semibold text-slate-300 font-display">Aggregated CNN Validation Accuracy</h3>
            </div>
          </div>

          <div className="relative h-[180px] w-full mt-2">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="35" y1="150" x2="475" y2="150" stroke="#1e293b" strokeWidth="1" />
              <line x1="35" y1="85" x2="475" y2="85" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="35" y1="20" x2="475" y2="20" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="3,3" />

              {/* Y Axis Ticks */}
              <text x="25" y="152" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">{(limits.minAcc * 100).toFixed(0)}%</text>
              <text x="25" y="88" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">{((limits.minAcc + (limits.maxAcc - limits.minAcc) / 2) * 100).toFixed(0)}%</text>
              <text x="25" y="23" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">{(limits.maxAcc * 100).toFixed(0)}%</text>

              {/* X Axis Ticks (Rounds) */}
              {activeHistory.map((pt, i) => {
                const { x } = getCoordinates(i, pt.cnnAccuracy, true);
                return (
                  <g key={`xtick2-${i}`}>
                    <line x1={x} y1="150" x2={x} y2="154" stroke="#1e293b" />
                    <text x={x} y="165" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">R{pt.round}</text>
                  </g>
                );
              })}

              {/* Accuracy line */}
              <path d={accPathD} fill="none" stroke="#10b981" strokeWidth="2.5" />

              {/* Accuracy dots */}
              {activeHistory.map((pt, i) => {
                const coordAcc = getCoordinates(i, pt.cnnAccuracy, true);
                return (
                  <circle
                    key={`dot2-${i}`}
                    cx={coordAcc.x}
                    cy={coordAcc.y}
                    r="4"
                    fill="#10b981"
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>

          {/* Chart key legends */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-3 border-t border-slate-900 mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-emerald-500 rounded-sm inline-block"></span> Validation Top-1 Accuracy
            </span>
            <span className="text-slate-400">
              Max Convergence Accuracy: <strong className="text-emerald-400">{(Math.max(...activeHistory.map(h => h.cnnAccuracy)) * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
