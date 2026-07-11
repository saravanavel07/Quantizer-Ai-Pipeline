import React, { useState, useEffect } from 'react';
import { Cpu, Server, Play, RefreshCw, Layers, ShieldCheck, Activity, Info, Network, AlertCircle, Wifi, Clock, Database, Download } from 'lucide-react';
import { FederatedNode, PipelineConfig, SimulationHistoryPoint, QuantizationType, AggregationStrategy, CnnModelType } from './types';
import DashboardStats from './components/DashboardStats';
import FederatedNodeMap from './components/FederatedNodeMap';
import ModelQuantizationPanel from './components/ModelQuantizationPanel';
import GanCnnPipelineVisualizer from './components/GanCnnPipelineVisualizer';
import AiAdvisorPanel from './components/AiAdvisorPanel';
import MetricsChart from './components/MetricsChart';
import DataFeedManager from './components/DataFeedManager';

// Seed Initial Edge Nodes
const INITIAL_NODES: FederatedNode[] = [
  {
    id: 'node-1',
    name: 'Node-Alpha (Primary)',
    device: 'NVIDIA Jetson Orin Nano (8W)',
    status: 'idle',
    quantization: 'INT8',
    localLoss: 0.2814,
    accuracy: 0.825,
    latency: 12,
    bandwidth: 95,
    power: 4800, // mW
    samplesProcessed: 12400,
    batteryLevel: 98,
    nodeType: 'edge',
    history: {
      loss: [0.65, 0.48, 0.35, 0.2814],
      accuracy: [0.68, 0.74, 0.79, 0.825],
      latency: [15, 14, 12, 12]
    }
  },
  {
    id: 'node-2',
    name: 'Node-Beta (Micro)',
    device: 'Google Coral Edge TPU (M.2)',
    status: 'idle',
    quantization: 'INT8',
    localLoss: 0.2985,
    accuracy: 0.813,
    latency: 8,
    bandwidth: 112,
    power: 1600, // mW
    samplesProcessed: 9800,
    batteryLevel: 85,
    nodeType: 'edge',
    history: {
      loss: [0.71, 0.53, 0.41, 0.2985],
      accuracy: [0.65, 0.71, 0.77, 0.813],
      latency: [10, 9, 8, 8]
    }
  },
  {
    id: 'node-3',
    name: 'Node-Gamma (Mobile)',
    device: 'Apple iPhone Neural Engine',
    status: 'idle',
    quantization: 'FP16',
    localLoss: 0.1843,
    accuracy: 0.886,
    latency: 22,
    bandwidth: 145,
    power: 3200, // mW
    samplesProcessed: 14800,
    batteryLevel: 72,
    nodeType: 'mobile',
    history: {
      loss: [0.55, 0.38, 0.26, 0.1843],
      accuracy: [0.72, 0.79, 0.84, 0.886],
      latency: [26, 24, 22, 22]
    }
  },
  {
    id: 'node-4',
    name: 'Node-Delta (LowPower)',
    device: 'STM32H7 ARM Cortex-M7 (0.2W)',
    status: 'offline',
    quantization: 'INT4',
    localLoss: 0.5412,
    accuracy: 0.642,
    latency: 125,
    bandwidth: 4.5,
    power: 110, // mW
    samplesProcessed: 1200,
    batteryLevel: 100,
    nodeType: 'edge',
    history: {
      loss: [0.85, 0.72, 0.61, 0.5412],
      accuracy: [0.51, 0.56, 0.61, 0.642],
      latency: [135, 130, 125, 125]
    }
  },
  {
    id: 'node-5',
    name: 'Node-Epsilon (Cloud Aggregator)',
    device: 'NVIDIA L4 Tensor Core GPU (75W)',
    status: 'idle',
    quantization: 'FP32',
    localLoss: 0.1145,
    accuracy: 0.942,
    latency: 4,
    bandwidth: 950,
    power: 65000, // mW
    samplesProcessed: 54000,
    batteryLevel: 100,
    nodeType: 'cloud',
    history: {
      loss: [0.45, 0.28, 0.18, 0.1145],
      accuracy: [0.81, 0.87, 0.91, 0.942],
      latency: [5, 4, 4, 4]
    }
  }
];

// Seed initial training metrics progression
const INITIAL_HISTORY: SimulationHistoryPoint[] = [
  { round: 0, globalLoss: 0.8541, ganLossG: 1.6241, ganLossD: 0.4215, cnnAccuracy: 0.6840, compressionRatio: 4, avgLatency: 24 },
  { round: 1, globalLoss: 0.5412, ganLossG: 1.4820, ganLossD: 0.3841, cnnAccuracy: 0.7580, compressionRatio: 4, avgLatency: 22 },
  { round: 2, globalLoss: 0.3521, ganLossG: 1.2542, ganLossD: 0.3204, cnnAccuracy: 0.8120, compressionRatio: 4, avgLatency: 21 },
  { round: 3, globalLoss: 0.2214, ganLossG: 1.1025, ganLossD: 0.2811, cnnAccuracy: 0.8450, compressionRatio: 4, avgLatency: 20 }
];

export default function App() {
  // ----------------------------------------------------
  // Local React State
  // ----------------------------------------------------
  const [config, setConfig] = useState<PipelineConfig>({
    activeQuantization: 'INT8',
    nodesCount: 4,
    rounds: 20,
    learningRate: 0.025, // Stable value between 0.01 - 0.05
    aggregationStrategy: 'FedAvg',
    cnnModel: 'MobileNet-V3',
    noiseMultiplier: 1.2,
    targetTask: 'Industrial Microchip Semiconductor Scanner',
    zeta: 1.8,
    syncFrequency: 5,
    communicationCompression: 85
  });

  const [nodes, setNodes] = useState<FederatedNode[]>(INITIAL_NODES);
  const [history, setHistory] = useState<SimulationHistoryPoint[]>(INITIAL_HISTORY);
  const [currentRound, setCurrentRound] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'nodes' | 'pipeline' | 'quantization' | 'advisor' | 'feed'>('nodes');
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState<boolean>(false);
  const [authedUser, setAuthedUser] = useState<string | null>(localStorage.getItem('q_auth_user'));

  // AI Optimizer & Auto-Caching States
  const [isAiOptimizerActive, setIsAiOptimizerActive] = useState<boolean>(true);
  const [optimizerMode, setOptimizerMode] = useState<'balanced' | 'accuracy' | 'latency' | 'privacy'>('balanced');
  const [isAutoCachingEnabled, setIsAutoCachingEnabled] = useState<boolean>(true);
  const [latestPrediction, setLatestPrediction] = useState<{ label: string; confidence: number } | null>(null);

  // Dynamic Real-time Telemetry state
  const [telemetry, setTelemetry] = useState({
    cpu: 24,
    gpu: 68,
    memory: 12.1,
    bandwidth: 142.8
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const cpuDelta = (Math.random() - 0.5) * 4;
        const gpuDelta = (Math.random() - 0.5) * 6;
        const memDelta = (Math.random() - 0.5) * 0.1;
        const bandDelta = (Math.random() - 0.5) * 12;

        return {
          cpu: Math.max(15, Math.min(95, Math.round(prev.cpu + cpuDelta))),
          gpu: Math.max(20, Math.min(100, Math.round(prev.gpu + gpuDelta))),
          memory: Math.max(8, Math.min(16, parseFloat((prev.memory + memDelta).toFixed(1)))),
          bandwidth: Math.max(50, Math.min(999, parseFloat((prev.bandwidth + bandDelta).toFixed(1))))
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Data Feed Connection telemetry states
  const [lastFeedUpdate, setLastFeedUpdate] = useState<string>("02:45:00 AM");
  const [externalConnection, setExternalConnection] = useState<'Online' | 'Synchronizing' | 'Offline'>('Online');

  const handleSyncNodeSamples = (nodeId: string, samplesAdded: number, accuracyGained: number, lossReduction: number) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastFeedUpdate(timeString);
    setExternalConnection('Synchronizing');
    setTimeout(() => {
      setExternalConnection('Online');
    }, 800);

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          samplesProcessed: n.samplesProcessed + samplesAdded,
          accuracy: Math.min(0.995, n.accuracy + accuracyGained),
          localLoss: Math.max(0.012, n.localLoss - lossReduction)
        };
      }
      return n;
    }));
  };

  // Trigger manual data feed/sync
  const handleFeedData = async () => {
    if (externalConnection === 'Synchronizing') return;
    setExternalConnection('Synchronizing');
    setSystemAlert("Establishing socket handshake... Ingesting fresh edge weights telemetry.");
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastFeedUpdate(timeString);
    setExternalConnection('Online');
    setSystemAlert(`Success: Ingested fresh calibration data from external edge nodes at ${timeString}.`);
    
    // Randomly update local nodes to represent the newly digested feed
    setNodes(prev => prev.map(n => {
      if (n.status === 'offline') return n;
      return {
        ...n,
        samplesProcessed: n.samplesProcessed + Math.floor(Math.random() * 150) + 50,
        accuracy: Math.min(0.99, n.accuracy + 0.002)
      };
    }));
  };

  // Check backend server status
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'online') {
          setBackendReady(true);
        }
      })
      .catch(() => {
        console.warn("Backend server not fully synced. Applet running in robust client-side standalone execution mode.");
      });
  }, []);

  // AI Optimizer auto-tuning logic
  useEffect(() => {
    if (!isAiOptimizerActive) return;

    let targetQuant: QuantizationType = 'INT8';
    let targetLR = 0.025;
    let targetNoise = 1.2;
    let targetZeta = 1.8;

    if (optimizerMode === 'balanced') {
      targetQuant = 'INT8';
      targetLR = 0.025;
      targetNoise = 1.2;
      targetZeta = 1.8;
    } else if (optimizerMode === 'accuracy') {
      targetQuant = 'FP16';
      targetLR = 0.015;
      targetNoise = 0.6;
      targetZeta = 2.4;
    } else if (optimizerMode === 'latency') {
      targetQuant = 'INT4';
      targetLR = 0.035;
      targetNoise = 1.8;
      targetZeta = 1.2;
    } else if (optimizerMode === 'privacy') {
      targetQuant = 'INT8';
      targetLR = 0.020;
      targetNoise = 3.5;
      targetZeta = 0.8;
    }

    setConfig(prev => ({
      ...prev,
      activeQuantization: targetQuant,
      learningRate: targetLR,
      noiseMultiplier: targetNoise,
      zeta: targetZeta
    }));
  }, [isAiOptimizerActive, optimizerMode]);

  // Compute stats on fly
  const baseAvgLatency = config.activeQuantization === 'INT4' ? 6 : config.activeQuantization === 'INT8' ? 14 : config.activeQuantization === 'FP16' ? 24 : 52;
  const avgLatency = isAutoCachingEnabled ? Math.round(baseAvgLatency * 0.65) : baseAvgLatency;

  // ----------------------------------------------------
  // Callback Handlers
  // ----------------------------------------------------

  // Toggle local nodes online/offline
  const handleToggleNodeStatus = (id: string) => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id === id) {
          const isTurningOn = node.status === 'offline';
          return {
            ...node,
            status: isTurningOn ? 'idle' : 'offline',
            // Set typical connection parameter bounds
            latency: isTurningOn ? (node.device.includes('STM32') ? 180 : 20) : 0,
            power: isTurningOn ? (node.device.includes('STM32') ? 110 : 3500) : 0
          };
        }
        return node;
      })
    );
  };

  // Hot-mount registered edge devices
  const handleAddNode = (newNode: Omit<FederatedNode, 'id' | 'samplesProcessed'>) => {
    const nextId = `node-${nodes.length + 1}`;
    const formattedNode: FederatedNode = {
      ...newNode,
      id: nextId,
      samplesProcessed: 0
    };
    setNodes(prev => [...prev, formattedNode]);
    setConfig(prev => ({ ...prev, nodesCount: prev.nodesCount + 1 }));
    setSystemAlert(`Registered and calibrated node: ${newNode.name}`);
  };

  // Alter single-node local quantization format
  const handleUpdateNodeQuant = (id: string, quant: QuantizationType) => {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, quantization: quant } : n))
    );
  };

  // Simulate a sudden accuracy drop on an edge node compared to the global model average
  const handleSimulateDrop = (nodeId: string) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          const globalModelAccuracy = history[history.length - 1]?.cnnAccuracy || 0.845;
          const targetAccuracy = Math.max(0.42, Math.min(globalModelAccuracy - 0.18, n.accuracy - 0.25));
          setSystemAlert(`Anomaly Alert: Injected artificial accuracy drop on ${n.name}. Accuracy reduced to ${(targetAccuracy * 100).toFixed(1)}%.`);
          return {
            ...n,
            accuracy: targetAccuracy,
            localLoss: Math.min(2.0, n.localLoss + 0.45),
            status: 'idle'
          };
        }
        return n;
      })
    );
  };

  // Retrain or recalibrate a specific node to restore its accuracy above the global average
  const handleRetrainNode = (nodeId: string) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          const globalModelAccuracy = history[history.length - 1]?.cnnAccuracy || 0.845;
          const targetAccuracy = Math.min(0.985, Math.max(globalModelAccuracy + 0.02, 0.885));
          setSystemAlert(`Success: Recalibrated and retrained ${n.name}. Telemetry parameters corrected. Local accuracy restored to ${(targetAccuracy * 100).toFixed(1)}%.`);
          return {
            ...n,
            accuracy: targetAccuracy,
            localLoss: Math.max(0.05, n.localLoss - 0.38),
            status: 'idle'
          };
        }
        return n;
      })
    );
  };

  // Sync global pipeline settings
  const handleUpdateConfig = (updates: Partial<PipelineConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Run full Federated Training round (Involves Express Server + Gemini endpoint)
  const handleRunFederatedRound = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    // Filter active edge nodes participating in training
    const activeClients = nodes.filter(n => n.status !== 'offline');
    if (activeClients.length === 0) {
      setSystemAlert("Execution halted: Register or power up at least 1 edge node in your topology.");
      setIsSimulating(false);
      return;
    }

    // Step 1: Simulate edge node processing
    setNodes(prev =>
      prev.map(n => (n.status !== 'offline' ? { ...n, status: 'training' } : n))
    );

    // Timeout delay to simulate local local GPU/NPU weights optimizations
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Step 2: Signal parameter uploads to aggregate server
    setNodes(prev =>
      prev.map(n => (n.status !== 'offline' ? { ...n, status: 'aggregating' } : n))
    );

    try {
      const nextRound = currentRound + 1;
      const response = await fetch('/api/simulate-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          currentRound: nextRound,
          history
        })
      });

      if (!response.ok) {
        throw new Error("Aggregation failed");
      }

      const stepResult: SimulationHistoryPoint = await response.json();

      // Step 3: Successfully aggregated parameters
      setHistory(prev => [...prev, stepResult]);
      setCurrentRound(nextRound);

      // Auto-export telemetry JSON log to server-side directory
      try {
        await fetch('/api/telemetry/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round: nextRound,
            globalLoss: stepResult.globalLoss,
            ganLossG: stepResult.ganLossG,
            ganLossD: stepResult.ganLossD,
            cnnAccuracy: stepResult.cnnAccuracy,
            compressionRatio: stepResult.compressionRatio,
            avgLatency: stepResult.avgLatency,
            config,
            nodes
          })
        });
      } catch (e) {
        console.warn("Failed to log telemetry to server-side directory:", e);
      }

      // Auto-download telemetry JSON log client-side for immediate user monitoring
      try {
        const logContent = {
          round: nextRound,
          globalLoss: stepResult.globalLoss,
          ganLossG: stepResult.ganLossG,
          ganLossD: stepResult.ganLossD,
          cnnAccuracy: stepResult.cnnAccuracy,
          compressionRatio: stepResult.compressionRatio,
          avgLatency: stepResult.avgLatency,
          config,
          nodes,
          timestamp: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logContent, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `telemetry-round-${nextRound}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSystemAlert(`Success: Federated Round ${nextRound} aggregated seamlessly. Telemetry log 'telemetry-round-${nextRound}.json' exported automatically.`);
      } catch (e) {
        console.warn("Failed to download telemetry file:", e);
        setSystemAlert(`Success: Federated Round ${nextRound} aggregated seamlessly. Telemetry log saved on server.`);
      }

      // Update Node parameters representing convergence improvements
      setNodes(prev =>
        prev.map(n => {
          if (n.status === 'offline') return n;
          const randomDrop = Math.random() * 0.04;
          const nextLoss = Math.max(0.01, n.localLoss - 0.04 - randomDrop);
          const nextAccuracy = Math.min(0.995, n.accuracy + 0.015 + randomDrop);
          
          // Latency can fluctuate slightly
          const latencyDelta = Math.floor(Math.random() * 3) - 1;
          const nextLatency = Math.max(1, n.latency + latencyDelta);
          
          const currentHist = n.history || { loss: [n.localLoss], accuracy: [n.accuracy], latency: [n.latency] };
          return {
            ...n,
            status: 'completed',
            localLoss: nextLoss,
            accuracy: nextAccuracy,
            latency: nextLatency,
            samplesProcessed: n.samplesProcessed + Math.floor(Math.random() * 800) + 1200,
            history: {
              loss: [...currentHist.loss, nextLoss].slice(-8),
              accuracy: [...currentHist.accuracy, nextAccuracy].slice(-8),
              latency: [...currentHist.latency, nextLatency].slice(-8)
            }
          };
        })
      );

      // Delay to return idle state
      setTimeout(() => {
        setNodes(prev =>
          prev.map(n => (n.status === 'completed' ? { ...n, status: 'idle' } : n))
        );
      }, 1000);

    } catch (err) {
      console.error(err);
      setSystemAlert("Federated aggregation failure. Check server connections.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Wipe statistics logs
  const handleResetSimulation = () => {
    setCurrentRound(3);
    setHistory(INITIAL_HISTORY);
    setNodes(INITIAL_NODES);
    setSystemAlert("Federated learning logs wiped. Initialized baseline models.");
  };

  // Apply suggestions clicked in Gemini Advisor panel (Completing the AI-to-State loop)
  const handleApplySuggestedStep = (action: string) => {
    const text = action.toLowerCase();
    let appliedMessage = "Applied Optimization: ";

    if (text.includes('mobilenet-v3')) {
      handleUpdateConfig({ cnnModel: 'MobileNet-V3' });
      appliedMessage += "Set CNN backbone to MobileNet-V3 (Highly optimized for edge latency).";
    } else if (text.includes('resnet-18')) {
      handleUpdateConfig({ cnnModel: 'ResNet-18' });
      appliedMessage += "Set CNN backbone to ResNet-18 (Enhanced feature classification).";
    } else if (text.includes('efficientnet-b0')) {
      handleUpdateConfig({ cnnModel: 'EfficientNet-B0' });
      appliedMessage += "Set CNN backbone to EfficientNet-B0 (Excellent performance balance).";
    } else if (text.includes('int8')) {
      handleUpdateConfig({ activeQuantization: 'INT8' });
      appliedMessage += "Quantization scaled to INT8 (Optimal bandwidth/accuracy tradeoffs).";
    } else if (text.includes('int4')) {
      handleUpdateConfig({ activeQuantization: 'INT4' });
      appliedMessage += "Quantization scaled to INT4 (Sub-byte compression, maximum acceleration).";
    } else if (text.includes('fp16')) {
      handleUpdateConfig({ activeQuantization: 'FP16' });
      appliedMessage += "Quantization scaled to FP16 half-precision.";
    } else if (text.includes('fedprox')) {
      handleUpdateConfig({ aggregationStrategy: 'FedProx' });
      appliedMessage += "Federated aggregation strategy set to FedProx (Handles client drift).";
    } else if (text.includes('fedavg')) {
      handleUpdateConfig({ aggregationStrategy: 'FedAvg' });
      appliedMessage += "Federated aggregation strategy set to FedAvg.";
    } else if (text.includes('learning rate') || text.includes('0.001')) {
      handleUpdateConfig({ learningRate: 0.001 });
      appliedMessage += "Learning rate scaled down to 0.001 to prevent parameter explosions.";
    } else if (text.includes('noise') || text.includes('differential')) {
      handleUpdateConfig({ noiseMultiplier: 2.5 });
      appliedMessage += "Differential Privacy noise increased to 2.5x to reinforce data security.";
    } else if (text.includes('node') || text.includes('add')) {
      // Hot add node via suggestion
      handleAddNode({
        name: `Node-Omega-${Math.floor(Math.random() * 90) + 10}`,
        device: 'Google Coral Edge TPU (M.2)',
        status: 'idle',
        quantization: 'INT8',
        localLoss: 0.612,
        accuracy: 0.731,
        latency: 12,
        bandwidth: 120,
        power: 1800,
        batteryLevel: 95
      });
      appliedMessage += "Registered high-efficiency Coral Edge TPU node.";
    } else {
      appliedMessage += "Processed and optimized training calibrations.";
    }

    setSystemAlert(appliedMessage);
  };

  // Export current simulation history and node registry data as downloadable JSON
  const handleExportTelemetry = () => {
    try {
      const telemetryData = {
        exportedAt: new Date().toISOString(),
        pipelineConfig: config,
        currentRound,
        externalConnectionState: externalConnection,
        lastDataFeedUpdate: lastFeedUpdate,
        nodeRegistry: nodes.map(n => ({
          id: n.id,
          name: n.name,
          device: n.device,
          status: n.status,
          quantization: n.quantization,
          localLoss: n.localLoss,
          accuracy: n.accuracy,
          samplesProcessed: n.samplesProcessed,
          latency: n.latency,
          bandwidth: n.bandwidth,
          power: n.power,
          batteryLevel: n.batteryLevel
        })),
        simulationHistory: history
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(telemetryData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `quantizer_ai_telemetry_round_${currentRound}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSystemAlert("Success: Compiled and downloaded portable telemetry data JSON.");
    } catch (error) {
      console.error("Export telemetry error:", error);
      setSystemAlert("Error: Failed to compile or download telemetry data.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Top Professional Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 h-14 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-base">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-display uppercase tracking-widest text-white">Quantizer.AI</span>
                <span className="text-slate-500 font-mono text-xs">v4.2.0-stable</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">Federated Quantized GAN-CNN Pipeline Deck</p>
            </div>
          </div>

          {/* System status node pill, feed updates, and connection status */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Last Feed Update Display */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
              <Clock className="h-3 w-3 text-indigo-400 animate-pulse" />
              <span>Feed Updated: <span className="text-white font-bold">{lastFeedUpdate}</span></span>
            </div>

            {/* External Data Connection Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono">
              <span className={`w-2 h-2 rounded-full ${
                externalConnection === 'Online' ? 'bg-emerald-400 animate-pulse' :
                externalConnection === 'Synchronizing' ? 'bg-amber-400 animate-bounce' : 'bg-rose-500'
              }`} />
              <span className="text-slate-400 hidden lg:inline">Connection:</span>
              <span className={`font-bold ${
                externalConnection === 'Online' ? 'text-emerald-400' :
                externalConnection === 'Synchronizing' ? 'text-amber-400' : 'text-rose-500'
              }`}>
                {externalConnection}
              </span>
            </div>

            {/* Feed Data Action Button */}
            <button
              id="btn-feed-data-trigger"
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-[10px] font-mono rounded-lg transition-all cursor-pointer shadow-md"
            >
              <Database className="h-3 w-3 text-indigo-200" />
              <span>Feed Data</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 hidden lg:block"></div>

            {/* Global parameters status indicators */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold leading-none">Global Throughput</p>
                <p className="text-xs font-mono text-indigo-400 mt-0.5">142.8k req/s</p>
              </div>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold leading-none">Avg. Latency</p>
                <p className="text-xs font-mono text-indigo-400 mt-0.5">12.4ms</p>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono">
              <span className={`w-2 h-2 rounded-full ${backendReady ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{backendReady ? "Core Engine Active" : "Offline Sandbox"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* Render Alert toasts if triggered */}
        {systemAlert && (
          <div className="mb-5 bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 flex justify-between items-center text-xs text-sky-300 font-mono">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-sky-400" />
              <span>{systemAlert}</span>
            </div>
            <button
              onClick={() => setSystemAlert(null)}
              className="text-sky-500 hover:text-white font-bold ml-2 cursor-pointer"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Dynamic Key Performance Indicator Cards */}
        <DashboardStats
          config={config}
          nodes={nodes}
          currentRound={currentRound}
          avgLatency={avgLatency}
          authedUser={authedUser}
          isAiOptimizerActive={isAiOptimizerActive}
          optimizerMode={optimizerMode}
          externalConnection={externalConnection}
          lastPrediction={latestPrediction}
        />

        {/* Dual Layout: Config deck & interactive panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Pipeline Control deck (Orchestration settings) */}
          <section className="lg:col-span-3 space-y-6">
            
            {/* AI Auto-Tune Optimizer & Telemetry HUD Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-display flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  AI Auto-Tuner
                </h2>
                {/* Active Switch */}
                <button
                  id="btn-toggle-ai-optimizer"
                  type="button"
                  onClick={() => setIsAiOptimizerActive(!isAiOptimizerActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAiOptimizerActive ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                  title="Toggle AI Autotuner Optimization Engine"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAiOptimizerActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isAiOptimizerActive ? (
                <div className="space-y-3 text-xs font-mono">
                  {/* Optimizer Targets Selector */}
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Tuning Target Priority</label>
                    <select
                      id="select-optimizer-mode"
                      value={optimizerMode}
                      onChange={(e) => setOptimizerMode(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 text-[11px] text-white px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    >
                      <option value="balanced">Balanced Tradeoffs</option>
                      <option value="accuracy">Accuracy-First (FP16/0.015 η)</option>
                      <option value="latency">Low-Latency (INT4/0.035 η)</option>
                      <option value="privacy">Privacy-Max (Noise 3.5x)</option>
                    </select>
                  </div>

                  {/* Dynamic tuning parameters display */}
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 text-[9px] text-slate-400 leading-normal space-y-1">
                    <p className="text-indigo-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                      AI Tuning State: Active
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-900 pt-1 mt-1">
                      <div>Scheme: <strong className="text-white">{config.activeQuantization}</strong></div>
                      <div>LR η: <strong className="text-white">{config.learningRate}</strong></div>
                      <div>Noise σ: <strong className="text-white">{config.noiseMultiplier}x</strong></div>
                      <div>DP ζ: <strong className="text-white">{config.zeta || 1.8}</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-mono">
                  AI Auto-Tuning engine is currently inactive. Set pipeline parameters manually below.
                </p>
              )}

              {/* Auto-Caching Control */}
              <div className="border-t border-slate-850 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight block">Inference Auto-Caching</span>
                  <span className="text-[9px] text-slate-500 font-mono block">Reduces latency & draw</span>
                </div>
                <button
                  id="btn-toggle-auto-caching"
                  type="button"
                  onClick={() => setIsAutoCachingEnabled(!isAutoCachingEnabled)}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutoCachingEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                  title="Toggle hardware-accelerated auto-caching"
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAutoCachingEnabled ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Live Telemetry monitor with progress bars */}
              <div className="border-t border-slate-850 pt-3 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Live Node Telemetry Monitor</span>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">CPU LOAD</span>
                    <span className="text-indigo-300 font-bold">{telemetry.cpu}%</span>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${telemetry.cpu}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">GPU LOAD</span>
                    <span className="text-sky-300 font-bold">{telemetry.gpu}%</span>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${telemetry.gpu}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">MEM LOAD</span>
                    <span className="text-amber-300 font-bold">{telemetry.memory} GB</span>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(telemetry.memory / 16) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">BANDWIDTH</span>
                    <span className="text-emerald-300 font-bold">{telemetry.bandwidth} Mbps</span>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(telemetry.bandwidth / 1000) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 font-display flex items-center gap-1.5">
                <Network className="h-4 w-4 text-sky-400" />
                Pipeline Orchestrator
              </h2>

              <div className="space-y-4">
                {/* Aggregation choice */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Fed Aggregation</label>
                  <select
                    id="select-aggregation"
                    value={config.aggregationStrategy}
                    onChange={(e) => handleUpdateConfig({ aggregationStrategy: e.target.value as AggregationStrategy })}
                    className="w-full bg-slate-950 border border-slate-850 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    <option value="FedAvg">Federated Averaging (FedAvg)</option>
                    <option value="FedProx">Proximal Regularization (FedProx)</option>
                    <option value="FedAMP">Attentive Multi-Task (FedAMP)</option>
                  </select>
                </div>

                {/* CNN Backbone model select */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">CNN Backbone Model</label>
                  <select
                    id="select-cnn-backbone"
                    value={config.cnnModel}
                    onChange={(e) => handleUpdateConfig({ cnnModel: e.target.value as CnnModelType })}
                    className="w-full bg-slate-950 border border-slate-850 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    <option value="MobileNet-V3">MobileNet-V3 (Highly Compressed)</option>
                    <option value="ResNet-18">ResNet-18 (Robust Depth)</option>
                    <option value="EfficientNet-B0">EfficientNet-B0 (Highly Accurate)</option>
                  </select>
                </div>

                {/* Slider for learning rate */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Learning Rate (η)</span>
                    <span className="text-indigo-400 font-bold">{isAiOptimizerActive ? `${config.learningRate} (AI Auto-Tuned)` : config.learningRate}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.05"
                    step="0.005"
                    value={config.learningRate}
                    onChange={(e) => handleUpdateConfig({ learningRate: parseFloat(e.target.value) })}
                    disabled={isAiOptimizerActive}
                    className={`w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg ${isAiOptimizerActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <p className="text-[9px] text-slate-500 leading-normal mt-1">
                    Stable zone is 0.01 to 0.05. Controls localized edge optimization step sizes.
                  </p>
                </div>

                {/* Slider for privacy budget (zeta) */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Privacy Budget (ζ)</span>
                    <span className="text-indigo-400 font-bold">{isAiOptimizerActive ? `${config.zeta || 1.8} (AI Auto-Tuned)` : (config.zeta || 1.8)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={config.zeta || 1.8}
                    onChange={(e) => handleUpdateConfig({ zeta: parseFloat(e.target.value) })}
                    disabled={isAiOptimizerActive}
                    className={`w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg ${isAiOptimizerActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <p className="text-[9px] text-slate-500 leading-normal mt-1">
                    Fine-tune DP clipping boundaries. Balances raw model validation accuracy vs strict privacy.
                  </p>
                </div>

                {/* Slider for differential privacy */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">DP Noise Multiplier (σ)</span>
                    <span className="text-indigo-400 font-bold">{isAiOptimizerActive ? `${config.noiseMultiplier}x (AI Auto-Tuned)` : `${config.noiseMultiplier}x`}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="5.0"
                    step="0.1"
                    value={config.noiseMultiplier}
                    onChange={(e) => handleUpdateConfig({ noiseMultiplier: parseFloat(e.target.value) })}
                    disabled={isAiOptimizerActive}
                    className={`w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg ${isAiOptimizerActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <p className="text-[9px] text-slate-500 leading-normal mt-1">
                    Gaussian noise added to aggregated weights before server distribution.
                  </p>
                </div>

                {/* Slider for sync frequency */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Sync Freq (Epochs)</span>
                    <span className="text-indigo-400 font-bold">{config.syncFrequency || 5} e</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={config.syncFrequency || 5}
                    onChange={(e) => handleUpdateConfig({ syncFrequency: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-500 leading-normal mt-1">
                    Sync models every N epochs to scale down network communication overhead.
                  </p>
                </div>

                {/* Slider for communication compression */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Comm. Compression</span>
                    <span className="text-indigo-400 font-bold">{config.communicationCompression || 85}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={config.communicationCompression || 85}
                    onChange={(e) => handleUpdateConfig({ communicationCompression: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-500 leading-normal mt-1">
                    Sparsifies model gradient updates before peer transmission to save edge bandwidth.
                  </p>
                </div>
              </div>

              {/* Launcher panel buttons */}
              <div className="mt-6 space-y-2 border-t border-slate-800 pt-4">
                <button
                  id="btn-run-fed-round"
                  onClick={handleRunFederatedRound}
                  disabled={isSimulating}
                  className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  {isSimulating ? "Optimizing Epochs..." : "Run Federated Round"}
                </button>

                <button
                  id="btn-reset-simulator"
                  onClick={handleResetSimulation}
                  disabled={isSimulating}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Logs Baseline
                </button>

                <button
                  id="btn-export-telemetry"
                  onClick={handleExportTelemetry}
                  disabled={isSimulating}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Telemetry JSON
                </button>
              </div>
            </div>

            {/* Quick architectural reference note */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 text-[10px] text-slate-500 space-y-2 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-400 font-display">
                <AlertCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>GAN-CNN Synthesis</span>
              </div>
              <p>
                Edge clients train localized GAN weights to capture raw visual distributions without leaking original camera/sensor files, generating clean synthetic frames for secondary fast classification.
              </p>
            </div>
          </section>

          {/* Right panel: Workspace widgets containing active visualizer tabs */}
          <section className="lg:col-span-9 space-y-6">
            {/* Elegant Tab layout selectors */}
            <nav className="flex border-b border-slate-800 bg-slate-900/40 p-1 rounded-xl">
              <button
                id="tab-btn-nodes"
                onClick={() => setActiveTab('nodes')}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'nodes'
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="h-4 w-4 text-sky-400" />
                Topology Map
              </button>
              <button
                id="tab-btn-pipeline"
                onClick={() => setActiveTab('pipeline')}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'pipeline'
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-4 w-4 text-teal-400" />
                Pipeline Inference
              </button>
              <button
                id="tab-btn-quantization"
                onClick={() => setActiveTab('quantization')}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'quantization'
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="h-4 w-4 text-indigo-400" />
                Math Quantizer
              </button>
              <button
                id="tab-btn-advisor"
                onClick={() => setActiveTab('advisor')}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'advisor'
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-violet-400" />
                AI Optimization Advisor
              </button>
              <button
                id="tab-btn-feed"
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'feed'
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="h-4 w-4 text-rose-400" />
                Data Ingest & Accounts
              </button>
            </nav>

            {/* Dynamic Rendering based on active tab selection */}
            <div className="transition-all duration-300">
              {activeTab === 'nodes' && (
                <FederatedNodeMap
                  nodes={nodes}
                  onToggleNodeStatus={handleToggleNodeStatus}
                  onAddNode={handleAddNode}
                  onUpdateNodeQuant={handleUpdateNodeQuant}
                  isSimulating={isSimulating}
                  aggregationStrategy={config.aggregationStrategy}
                  globalModelAccuracy={history[history.length - 1]?.cnnAccuracy || 0.845}
                  onSimulateDrop={handleSimulateDrop}
                  onRetrainNode={handleRetrainNode}
                />
              )}

              {activeTab === 'pipeline' && (
                <GanCnnPipelineVisualizer
                  activeQuantization={config.activeQuantization}
                  cnnModel={config.cnnModel}
                  targetTask={config.targetTask}
                  onChangeTask={(task) => handleUpdateConfig({ targetTask: task })}
                  onInferenceResult={setLatestPrediction}
                />
              )}

              {activeTab === 'quantization' && (
                <ModelQuantizationPanel
                  activeQuantization={config.activeQuantization}
                  onChangeQuantization={(q) => handleUpdateConfig({ activeQuantization: q })}
                />
              )}

              {activeTab === 'advisor' && (
                <AiAdvisorPanel
                  config={config}
                  nodes={nodes}
                  onApplySuggestedStep={handleApplySuggestedStep}
                  isSimulating={isSimulating}
                />
              )}

              {activeTab === 'feed' && (
                <DataFeedManager
                  activeQuantization={config.activeQuantization}
                  cnnModel={config.cnnModel}
                  targetTask={config.targetTask}
                  nodes={nodes}
                  onSyncNodeSamples={handleSyncNodeSamples}
                  onSetSystemAlert={setSystemAlert}
                  onAuthChange={setAuthedUser}
                />
              )}
            </div>

            {/* Always show visual training logs history curves at bottom to unify context */}
            <MetricsChart history={history} />
          </section>
        </div>
      </main>

      {/* Footer Status Bar with High Density design theme */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 text-[10px] font-mono text-slate-500 mt-8">
        <div className="flex gap-4">
          <span>CLUSTER ID: <span className="text-slate-300">q-alpha-x902</span></span>
          <span className="hidden sm:inline">REGION: <span className="text-slate-300">AWS-GLOBAL-1</span></span>
          <span className="text-emerald-500 font-bold">● STABLE CONTEXT</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> CPU {telemetry.cpu}%</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> GPU {telemetry.gpu}%</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> MEM {telemetry.memory}GB</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> NET {telemetry.bandwidth} Mb/s</span>
          <span className="ml-4 text-slate-600 hidden lg:inline">SECURE PIPELINE (AES-256)</span>
        </div>
      </footer>
    </div>
  );
}
