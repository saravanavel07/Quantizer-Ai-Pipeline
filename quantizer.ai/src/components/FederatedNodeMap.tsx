import React, { useState } from 'react';
import { Server, Wifi, WifiOff, Plus, Play, Info, Cpu, Battery, Power, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { FederatedNode, QuantizationType, NodeStatusType } from '../types';

function Sparkline({ data, color, title }: { data: number[]; color: string; title: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  
  const points = data.map((val, idx) => {
    const x = (idx * width) / (data.length - 1);
    const y = height - 2 - ((val - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] text-slate-500 uppercase tracking-tight">{title}</span>
      <svg width={width} height={height} className="overflow-visible mt-1">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
        />
        <circle
          cx={width}
          cy={height - 2 - ((data[data.length - 1] - min) / range) * (height - 4)}
          r="2"
          fill={color}
        />
      </svg>
    </div>
  );
}

interface FederatedNodeMapProps {
  nodes: FederatedNode[];
  onToggleNodeStatus: (id: string) => void;
  onAddNode: (node: Omit<FederatedNode, 'id' | 'samplesProcessed'>) => void;
  onUpdateNodeQuant: (id: string, quant: QuantizationType) => void;
  isSimulating: boolean;
  aggregationStrategy: string;
  globalModelAccuracy: number;
  onSimulateDrop?: (id: string) => void;
  onRetrainNode?: (id: string) => void;
}

export default function FederatedNodeMap({
  nodes,
  onToggleNodeStatus,
  onAddNode,
  onUpdateNodeQuant,
  isSimulating,
  aggregationStrategy,
  globalModelAccuracy,
  onSimulateDrop,
  onRetrainNode,
}: FederatedNodeMapProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDevice, setNewNodeDevice] = useState('Jetson Orin Nano');
  const [newNodeQuant, setNewNodeQuant] = useState<QuantizationType>('INT8');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Online' | 'Idle' | 'Offline'>('All');

  const filteredNodes = nodes.filter((node) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Online') return node.status !== 'offline';
    if (statusFilter === 'Idle') return node.status === 'idle';
    if (statusFilter === 'Offline') return node.status === 'offline';
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    // Simulate starting stats based on device selected
    let latency = 25;
    let power = 5200; // mW
    let bandwidth = 85;

    if (newNodeDevice.includes('Coral')) {
      latency = 12;
      power = 1800;
      bandwidth = 110;
    } else if (newNodeDevice.includes('STM32')) {
      latency = 180;
      power = 120;
      bandwidth = 5;
    } else if (newNodeDevice.includes('iPhone')) {
      latency = 18;
      power = 3400;
      bandwidth = 140;
    }

    onAddNode({
      name: newNodeName,
      device: newNodeDevice,
      status: 'idle',
      quantization: newNodeQuant,
      localLoss: 0.65,
      accuracy: 0.72,
      latency,
      bandwidth,
      power,
      batteryLevel: Math.floor(Math.random() * 40) + 60,
    });

    setNewNodeName('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Server className="h-5 w-5 text-sky-400" />
            Federated Topology Map & Node Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decentralized edge devices training locally and submitting quantized parameters.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">Filter Status:</span>
            <select
              id="node-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Nodes</option>
              <option value="Online">Online</option>
              <option value="Idle">Idle</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <button
            id="btn-add-edge-node"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isSimulating}
            className="flex items-center justify-center gap-1 text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-medium px-3 py-1.5 rounded-lg border border-sky-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Register Edge Node
          </button>
        </div>
      </div>

      {/* Register Node Drawer/Modal */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-5 animate-fade-in">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 font-display">New Device Calibration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Node Identifier</label>
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="e.g. Node-Alpha"
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Target SoC/SoM</label>
              <select
                value={newNodeDevice}
                onChange={(e) => setNewNodeDevice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
              >
                <option value="Jetson Orin Nano">NVIDIA Jetson Orin Nano (8W)</option>
                <option value="Google Coral Edge TPU">Coral Edge TPU (M.2)</option>
                <option value="STM32H7 MCU">STM32H7 ARM Cortex-M7 (0.2W)</option>
                <option value="iPhone Neural Engine">Apple iPhone Neural Engine</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Local Model Quantization</label>
              <select
                value={newNodeQuant}
                onChange={(e) => setNewNodeQuant(e.target.value as QuantizationType)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
              >
                <option value="FP32">Full Precision (FP32)</option>
                <option value="FP16">Half Precision (FP16)</option>
                <option value="INT8">Quantized Integer (INT8)</option>
                <option value="INT4">Sub-Byte Quantized (INT4)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Calibrate & Mount
            </button>
          </div>
        </form>
      )}

      {/* Network Topology Visualizer Area */}
      <div className="relative bg-slate-950 border border-slate-850 rounded-xl h-[280px] w-full overflow-hidden mb-6 flex items-center justify-center">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient(ellipse_at_center,transparent_20%,#020617) opacity-80 pointer-events-none"></div>

        {/* Active Strategy Optimization Overlay info */}
        <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 max-w-[195px] text-[9px] font-mono text-slate-400 leading-relaxed pointer-events-none z-20 space-y-1">
          <p className="text-slate-300 font-bold uppercase text-[10px] tracking-wide mb-1 border-b border-slate-900 pb-1 flex items-center gap-1">
            <Info className="h-3 w-3 text-sky-400" /> Variance Manager
          </p>
          <div>Strategy: <span className="text-sky-400 font-bold">{aggregationStrategy}</span></div>
          <p className="text-[8px] text-slate-400">
            {aggregationStrategy === 'FedAvg' && "Simple Averaging: Susceptible to high multi-device accuracy variance (STM32 vs iPhone)."}
            {aggregationStrategy === 'FedProx' && "Proximal regularization: Restricts client weights drift. Aligns and minimizes variance across mobile & cloud."}
            {aggregationStrategy === 'FedAMP' && "Attentive multi-tasking: Tailors parameters dynamically. Reduces multi-device accuracy variance to <2.5%."}
          </p>
        </div>

        {/* Central Server Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20 border border-sky-400 animate-pulse">
            <Server className="h-8 w-8 text-white" />
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs font-bold text-white tracking-wide font-display uppercase">Federated Coordinator</p>
            <p className="text-[9px] font-mono text-sky-400">FedAvg Server [Active]</p>
          </div>
        </div>

        {/* Local Edge Nodes orbiting around server */}
        {filteredNodes.map((node, index) => {
          const total = filteredNodes.length;
          // Calculate polar coordinates for spatial layout
          const angle = (index * (2 * Math.PI)) / total;
          const radius = 105; // orbit radius
          const x = Math.sin(angle) * radius;
          const y = Math.cos(angle) * radius;

          const isOnline = node.status !== 'offline';
          const isAnomalous = isOnline && (node.accuracy < globalModelAccuracy - 0.05);

          return (
            <div
              key={node.id}
              className="absolute z-10 transition-all duration-500"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {/* Connection Lane Vector SVG */}
              <svg className="absolute overflow-visible pointer-events-none" style={{ left: 16, top: 16, transform: 'translate(-50%, -50%)' }}>
                <line
                  x1={-x}
                  y1={-y}
                  x2={0}
                  y2={0}
                  stroke={isOnline ? (isAnomalous ? '#f43f5e' : isSimulating ? '#38bdf8' : '#334155') : '#1e293b'}
                  strokeWidth={isAnomalous ? "2.5" : "1.5"}
                  strokeDasharray={isAnomalous ? "2,2" : isSimulating && isOnline ? "5,5" : "none"}
                  className={isAnomalous ? "animate-pulse" : isSimulating && isOnline ? "animate-[dash_10s_linear_infinite]" : ""}
                />
              </svg>

              {/* Node Circle */}
              <div
                id={`node-orbital-${node.id}`}
                onClick={() => onToggleNodeStatus(node.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-300 relative group ${
                  isOnline
                    ? isAnomalous
                      ? 'bg-rose-950/90 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/50 animate-pulse scale-105'
                      : node.status === 'training'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 scale-110'
                      : node.status === 'aggregating'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/20 scale-110'
                      : 'bg-slate-900 border-slate-700 hover:border-sky-400 text-slate-300'
                    : 'bg-slate-950 border-slate-900 text-slate-600 filter grayscale'
                }`}
              >
                <Cpu className="h-5 w-5" />
                {/* Microstatus Dot */}
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isOnline
                    ? isAnomalous
                      ? 'bg-rose-500 animate-pulse'
                      : node.status === 'training'
                      ? 'bg-amber-500 animate-ping'
                      : node.status === 'aggregating'
                      ? 'bg-purple-500 animate-bounce'
                      : 'bg-emerald-500'
                    : 'bg-rose-500'
                }`} />

                {/* Tooltip on Orbit hover */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-800 px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {node.name} ({node.device})
                  <br />
                  <span className="text-slate-400">Status: {isAnomalous ? 'ANOMALY DETECTED' : node.status} | Quant: {node.quantization}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Anomalous Nodes System Core Alerts Panel */}
      {(() => {
        const anomalousNodes = nodes.filter(n => n.status !== 'offline' && n.accuracy < globalModelAccuracy - 0.05);
        if (anomalousNodes.length === 0) return null;
        return (
          <div className="mb-6 p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-lg shadow-rose-500/5 animate-fade-in">
            <div className="flex gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 flex items-center justify-center h-9 w-9">
                <AlertCircle className="h-5 w-5 text-rose-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  System Core Alert: {anomalousNodes.length} Edge {anomalousNodes.length === 1 ? 'Node' : 'Nodes'} Diverging
                </h3>
                <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">
                  The local accuracy of <strong className="text-rose-200 font-bold">{anomalousNodes.map(n => n.name).join(', ')}</strong> has suddenly dropped below the global model average of <span className="text-white font-mono font-bold">{(globalModelAccuracy * 100).toFixed(1)}%</span>. Surface a direct retrain or recalibration prompt to restore model weights.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto shrink-0 self-end md:self-auto">
              <button
                onClick={() => {
                  anomalousNodes.forEach(n => onRetrainNode?.(n.id));
                }}
                className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-[spin_3s_linear_infinite]" />
                <span>Recalibrate All Divergent Nodes</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Node Registry List */}
      {filteredNodes.length === 0 ? (
        <div className="text-center py-8 bg-slate-950 border border-slate-850 rounded-xl w-full">
          <p className="text-sm font-mono text-slate-500">No nodes found matching the status "{statusFilter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
          const isOnline = node.status !== 'offline';
          const isAnomalous = isOnline && (node.accuracy < globalModelAccuracy - 0.05);
          return (
            <div
              id={`node-card-${node.id}`}
              key={node.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isOnline
                  ? isAnomalous
                    ? 'bg-rose-950/15 border-rose-500 hover:border-rose-450 shadow-md shadow-rose-500/5'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <div className={`p-2 rounded-lg ${isOnline ? (isAnomalous ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400') : 'bg-slate-900 text-slate-500'}`}>
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                        {node.name}
                        {isAnomalous && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{node.device}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleNodeStatus(node.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isOnline
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/25'
                      }`}
                      title={isOnline ? "Simulate Connection Drop" : "Power Up Node"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isOnline ? (
                  <div className="mt-3 space-y-2 border-t border-slate-900 pt-2.5">
                    {/* Grid stats */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Quantization:</span>
                        <select
                          value={node.quantization}
                          onChange={(e) => onUpdateNodeQuant(node.id, e.target.value as QuantizationType)}
                          className="bg-slate-900 text-sky-400 border border-slate-800 px-1 py-0.5 rounded text-[9px] font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="FP32">FP32</option>
                          <option value="FP16">FP16</option>
                          <option value="INT8">INT8</option>
                          <option value="INT4">INT4</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Latency:</span>
                        <span className="text-slate-200 font-semibold">{node.latency} ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Local Loss:</span>
                        <span className="text-amber-400">{node.localLoss.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Accuracy:</span>
                        <span className={`${isAnomalous ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'} flex items-center gap-1`}>
                          {(node.accuracy * 100).toFixed(1)}%
                          {isAnomalous && <span title="Divergent from average" className="text-[10px]">⚠️</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Power SoC:</span>
                        <span className="text-slate-200">{(node.power / 1000).toFixed(2)} W</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Bandwidth:</span>
                        <span className="text-slate-200">{node.bandwidth} Mbps</span>
                      </div>
                    </div>

                    {/* Battery representation */}
                    {node.batteryLevel !== undefined && (
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                        <Battery className={`h-3 w-3 ${node.batteryLevel < 25 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                        <span>Edge Power Source Battery: {node.batteryLevel}%</span>
                      </div>
                    )}

                    {/* Telemetry Curves (Accuracy, Loss, Latency trends) */}
                    {node.history && (
                      <div className="bg-slate-900/60 rounded-lg p-2 mt-2 flex justify-between border border-slate-800/40 animate-fade-in">
                        <Sparkline data={node.history.accuracy} color="#10b981" title="Acc Curve" />
                        <Sparkline data={node.history.loss} color="#f59e0b" title="Loss Curve" />
                        <Sparkline data={node.history.latency} color="#3b82f6" title="Latency" />
                      </div>
                    )}

                    {/* Micro task progression bar */}
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          node.status === 'training'
                            ? 'bg-amber-500 w-2/3 animate-pulse'
                            : node.status === 'aggregating'
                            ? 'bg-purple-500 w-full'
                            : 'bg-emerald-500 w-1/4'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col items-center justify-center py-4 text-center">
                    <WifiOff className="h-6 w-6 text-slate-700 animate-pulse" />
                    <p className="text-[10px] font-mono text-slate-500 mt-1">Node Disconnected</p>
                    <p className="text-[9px] text-slate-600">No telemetry or parameters exchanged</p>
                  </div>
                )}
              </div>

              {/* Anomaly Detection Controls and prompts */}
              {isOnline && (
                <div className="mt-3 pt-2.5 border-t border-slate-900/60">
                  {isAnomalous ? (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col gap-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[9px] font-mono text-rose-300">
                        <span className="flex items-center gap-1 font-bold">
                          <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />
                          Deficit: -{((globalModelAccuracy - node.accuracy) * 100).toFixed(1)}%
                        </span>
                        <span className="text-slate-500">Avg: {(globalModelAccuracy * 100).toFixed(1)}%</span>
                      </div>
                      <button
                        onClick={() => onRetrainNode?.(node.id)}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-[9px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer shadow-md shadow-rose-500/15 flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-2.5 w-2.5 animate-[spin_4s_linear_infinite]" />
                        <span>Recalibrate & Retrain</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSimulateDrop?.(node.id)}
                      className="w-full py-1 bg-slate-900 hover:bg-slate-850 hover:text-rose-400 text-slate-500 border border-slate-850 hover:border-rose-900/40 rounded text-[9px] font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Simulate sudden local accuracy drop to trigger auto-alerting logic"
                    >
                      <AlertTriangle className="h-3 w-3 text-slate-600 group-hover:text-rose-500" />
                      <span>Simulate Accuracy Drop</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
