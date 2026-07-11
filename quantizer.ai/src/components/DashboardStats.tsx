import React from 'react';
import { Cpu, Zap, Activity, HardDrive, ShieldCheck, FolderLock, Sparkles, CheckCircle2 } from 'lucide-react';
import { PipelineConfig, FederatedNode } from '../types';

interface DashboardStatsProps {
  config: PipelineConfig;
  nodes: FederatedNode[];
  currentRound: number;
  avgLatency: number;
  authedUser?: string | null;
  isAiOptimizerActive?: boolean;
  optimizerMode?: string;
  externalConnection?: 'Online' | 'Synchronizing' | 'Offline';
  lastPrediction?: { label: string; confidence: number } | null;
}

export default function DashboardStats({
  config,
  nodes,
  currentRound,
  avgLatency,
  authedUser = null,
  isAiOptimizerActive = false,
  optimizerMode = 'balanced',
  externalConnection = 'Online',
  lastPrediction = null
}: DashboardStatsProps) {
  // Calculators
  const bitWidth = config.activeQuantization === 'FP32' ? 32 : config.activeQuantization === 'FP16' ? 16 : config.activeQuantization === 'INT8' ? 8 : 4;
  const compressionRatio = (32 / bitWidth).toFixed(1);
  const sizeReductionPercent = Math.round((1 - (bitWidth / 32)) * 100);

  // Power Consumption
  const activeNodes = nodes.filter(n => n.status !== 'offline');
  const totalPowerMw = activeNodes.reduce((sum, n) => sum + n.power, 0);
  // Power savings comparison vs standard FP32 desktop GPU server (typically ~250,000 mW baseline)
  const powerSavingsPct = Math.round((1 - (totalPowerMw / (activeNodes.length * 15000 + 1000))) * 100);

  // Total samples processed
  const totalSamples = nodes.reduce((sum, n) => sum + n.samplesProcessed, 0);

  // Communication size estimate saved
  const originalSizeMb = 100;
  const compressedSizeMb = (originalSizeMb * bitWidth) / 32;
  const syncCount = Math.max(1, Math.ceil(currentRound / (config.syncFrequency || 5)));
  const baselineTotalMb = originalSizeMb * activeNodes.length * currentRound;
  
  // We only transmit during sync rounds, and compress the payload
  const compressionRatioMultiplier = 1 - ((config.communicationCompression || 85) / 100);
  const actualTransmittedMb = compressedSizeMb * compressionRatioMultiplier * activeNodes.length * syncCount;
  
  const totalBandwidthSavedGb = (Math.max(0, baselineTotalMb - actualTransmittedMb) / 1024).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* 1. Model Compression Card */}
      <div id="stat-card-compression" className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-sky-500/40 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Model Compression</p>
              {isAiOptimizerActive && (
                <span className="bg-sky-500/10 text-sky-400 text-[8px] px-1.5 py-0.5 rounded font-bold font-mono">
                  AI
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold font-display text-white mt-1">{compressionRatio}x</h3>
          </div>
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
            <HardDrive className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between">
            <span className="text-sky-400 font-medium">-{sizeReductionPercent}% Storage</span>
            <span>{config.activeQuantization} Format</span>
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-1 text-[9px]">
            <span>Sparsification:</span>
            <span className="text-sky-300 font-bold">{config.communicationCompression || 85}%</span>
          </div>
        </div>
      </div>

      {/* 2. Inference Latency & Caching Card */}
      <div id="stat-card-latency" className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Avg Edge Latency</p>
              <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold font-mono">
                Cached
              </span>
            </div>
            <h3 className="text-2xl font-bold font-display text-white mt-1">{avgLatency} ms</h3>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Cpu className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between">
            <span className="text-emerald-400 font-medium">{(1000 / avgLatency).toFixed(0)} FPS Inference</span>
            <span className="truncate max-w-[80px]">{config.cnnModel}</span>
          </div>
          <div className="flex flex-col border-t border-slate-850 pt-1 text-[9px]">
            <div className="flex justify-between">
              <span>Backbone Model:</span>
              <span className="text-slate-300 font-bold truncate max-w-[80px]">{config.cnnModel}</span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-850/50">
              <span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px]">Prediction:</span>
              <span className="text-emerald-300 font-bold truncate max-w-[100px]" title={lastPrediction ? `${lastPrediction.label} (${Math.round(lastPrediction.confidence * 100)}%)` : "No active inference"}>
                {lastPrediction ? `${lastPrediction.label.split(' ')[0]} (${Math.round(lastPrediction.confidence * 100)}%)` : "No active inference"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Account Directories & Isolation Card */}
      <div id="stat-card-user-dir" className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/40 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Account Storage</p>
            <h3 className="text-base font-bold font-mono text-white mt-1 truncate max-w-[140px]">
              {authedUser ? `./uploads/${authedUser}` : "Guest Sandbox"}
            </h3>
          </div>
          <div className={`p-2 rounded-lg ${authedUser ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
            <FolderLock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between">
            <span className={authedUser ? "text-indigo-400 font-bold" : "text-amber-500"}>
              {authedUser ? "Directory Isolated" : "Credentials Required"}
            </span>
            <span>SECURE</span>
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-1 text-[9px]">
            <span>System Access:</span>
            <span className={authedUser ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {authedUser ? "Authorized" : "Read-Only"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Federated Sync Card */}
      <div id="stat-card-rounds" className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Federated Sync</p>
            <h3 className="text-2xl font-bold font-display text-white mt-1">Round #{currentRound}</h3>
          </div>
          <div className={`p-2 rounded-lg ${
            externalConnection === 'Synchronizing' ? 'bg-amber-500/10 text-amber-400 animate-bounce' : 'bg-purple-500/10 text-purple-400'
          }`}>
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between items-center">
            <span className="text-purple-400 font-medium">Synced: {totalSamples.toLocaleString()} samples</span>
            <span className={`w-2 h-2 rounded-full ${
              externalConnection === 'Online' ? 'bg-emerald-400 animate-pulse' :
              externalConnection === 'Synchronizing' ? 'bg-amber-400 animate-bounce' : 'bg-rose-500'
            }`} />
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-1 text-[9px]">
            <span>Sync Strategy:</span>
            <span className="text-purple-300 font-bold">{config.aggregationStrategy}</span>
          </div>
        </div>
      </div>

      {/* 5. Differential Privacy & Multipliers Card */}
      <div id="stat-card-privacy" className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-teal-500/40 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Privacy Multipliers</p>
            <h3 className="text-2xl font-bold font-display text-white mt-1">ζ={config.zeta || 1.8}</h3>
          </div>
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between">
            <span className="text-teal-400 font-medium">σ Noise: {config.noiseMultiplier}x</span>
            <span>DP Guarded</span>
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-1 text-[9px]">
            <span>Tuner Mode:</span>
            <span className="text-teal-300 font-bold uppercase">{isAiOptimizerActive ? optimizerMode : "Manual"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

