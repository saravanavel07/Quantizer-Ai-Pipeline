import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Upload, 
  User as UserIcon, 
  Lock, 
  UserPlus, 
  FolderLock, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  FileImage, 
  Cpu, 
  Trash2, 
  Network, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { QuantizationType, UserUpload, FederatedNode } from '../types';

interface DataFeedManagerProps {
  activeQuantization: QuantizationType;
  cnnModel: string;
  targetTask: string;
  nodes: FederatedNode[];
  onSyncNodeSamples: (nodeId: string, samplesAdded: number, accuracyGained: number, lossReduction: number) => void;
  onSetSystemAlert: (msg: string) => void;
  onAuthChange?: (username: string | null) => void;
}

// Preset systems scan samples for instant click-and-ingest testing
const INGEST_PRESETS = [
  {
    name: "semiconductor_wafer_scan_902.jpg",
    task: "Industrial Microchip Semiconductor Scanner",
    description: "Silicon micro-wafer thermal scan showing microchip cell cluster matrix.",
    base64Fake: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnwGBygAB4A4+zQAAAABJRU5ErkJggg==",
    previewUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=250&auto=format&fit=crop"
  },
  {
    name: "canopy_leaf_fluorescence_311.jpg",
    task: "Agricultural Crop Hyperspectral Scan",
    description: "Chlorophyll fluorescence scan tracking nitrogen saturation levels.",
    base64Fake: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnwGBygAB4A4+zQAAAABJRU5ErkJggg==",
    previewUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=250&auto=format&fit=crop"
  },
  {
    name: "petri_pathogen_growth_048.jpg",
    task: "Medical Cellular Pathology Bio-Scanner",
    description: "Neoplastic bio-growth scanning tracking colony distribution densities.",
    base64Fake: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnwGBygAB4A4+zQAAAABJRU5ErkJggg==",
    previewUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=250&auto=format&fit=crop"
  },
  {
    name: "solar_cell_leakage_105.jpg",
    task: "Solar Photovoltaic Grid Leakage Scan",
    description: "Thermal infrared scan pinpointing high-resistance structural cracks.",
    base64Fake: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnwGBygAB4A4+zQAAAABJRU5ErkJggg==",
    previewUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=250&auto=format&fit=crop"
  }
];

export default function DataFeedManager({
  activeQuantization,
  cnnModel,
  targetTask,
  nodes,
  onSyncNodeSamples,
  onSetSystemAlert,
  onAuthChange
}: DataFeedManagerProps) {
  // Auth state
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authedToken, setAuthedToken] = useState<string | null>(localStorage.getItem('q_auth_token'));
  const [authedUser, setAuthedUser] = useState<string | null>(localStorage.getItem('q_auth_user'));
  const [authError, setAuthError] = useState<string | null>(null);
  
  // App uploads state
  const [userFiles, setUserFiles] = useState<UserUpload[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<any | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'node-1');
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [uploadingState, setUploadingState] = useState<'idle' | 'reading' | 'uploading' | 'processing'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-authenticate on load
  useEffect(() => {
    if (authedToken) {
      fetchUserFiles(authedToken);
      if (onAuthChange) {
        onAuthChange(authedUser);
      }
    }
  }, [authedToken]);

  const fetchUserFiles = async (token: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/user-images', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Map to match interface UserUpload
          const formatted: UserUpload[] = data.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            username: authedUser || '',
            filepath: f.filepath,
            fileSizeBytes: f.fileSizeBytes,
            timestamp: f.timestamp,
            predictions: f.meta?.predictions || [],
            inferenceTimeMs: f.meta?.inferenceTimeMs || 0,
            quantizationErrorPct: f.meta?.quantizationErrorPct || 0,
            modelName: f.meta?.modelName || 'MobileNet-V3',
            quantization: f.meta?.quantization || 'INT8',
            associatedNodeId: f.meta?.associatedNodeId || 'node-1'
          }));
          setUserFiles(formatted);
        }
      } else {
        // Token expired or invalid
        handleLogOut();
      }
    } catch (err) {
      console.error("Error reading isolated user files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!username.trim() || !password.trim()) {
      setAuthError("Please fill in all security credentials.");
      return;
    }

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      localStorage.setItem('q_auth_token', data.token);
      localStorage.setItem('q_auth_user', data.username);
      setAuthedToken(data.token);
      setAuthedUser(data.username);
      if (onAuthChange) {
        onAuthChange(data.username);
      }
      setUsername('');
      setPassword('');
      onSetSystemAlert(`Welcome ${data.username}! Secure account directory mounted.`);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('q_auth_token');
    localStorage.removeItem('q_auth_user');
    setAuthedToken(null);
    setAuthedUser(null);
    if (onAuthChange) {
      onAuthChange(null);
    }
    setUserFiles([]);
    setActiveAnalysis(null);
    onSetSystemAlert("Securely unmounted user storage directories.");
  };

  const handleFileUpload = async (file: File, base64Content: string) => {
    if (!authedToken) return;
    setUploadingState('uploading');
    
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authedToken}`
        },
        body: JSON.stringify({
          imageName: file.name,
          base64Data: base64Content,
          quantization: activeQuantization,
          modelName: cnnModel,
          task: targetTask,
          associatedNodeId: selectedNodeId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Image ingest process failed.");
      }

      onSetSystemAlert(`Securely saved scan ${file.name} to directories and triggered quantized inference.`);
      setActiveAnalysis({
        fileName: file.name,
        ...data.analysis
      });

      // Synchronize output with the federated node registry for telemetry monitoring
      const targetNode = nodes.find(n => n.id === selectedNodeId);
      const nodeName = targetNode ? targetNode.name : "Selected Edge Client";
      
      // Calculate gains based on quantization mode
      const accuracyGain = activeQuantization === 'FP32' ? 0.005 : activeQuantization === 'FP16' ? 0.004 : activeQuantization === 'INT8' ? 0.002 : 0.001;
      const lossReduction = activeQuantization === 'FP32' ? 0.04 : activeQuantization === 'FP16' ? 0.03 : activeQuantization === 'INT8' ? 0.015 : 0.005;
      
      onSyncNodeSamples(selectedNodeId, 1, accuracyGain, lossReduction);
      onSetSystemAlert(`Synced processed outputs with federated node: ${nodeName}. Telemetry monitoring online.`);

      // Refresh files list
      fetchUserFiles(authedToken);
    } catch (err: any) {
      onSetSystemAlert(`Upload Failure: ${err.message}`);
    } finally {
      setUploadingState('idle');
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onSetSystemAlert("Unsupported scan format. Please upload valid image files.");
      return;
    }
    setUploadingState('reading');
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Content = e.target?.result as string;
      if (base64Content) {
        handleFileUpload(file, base64Content);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger quick preset ingestion
  const handleIngestPreset = async (preset: typeof INGEST_PRESETS[0]) => {
    if (!authedToken) {
      onSetSystemAlert("Authentication required. Please log in first.");
      return;
    }
    
    setUploadingState('processing');
    onSetSystemAlert(`Simulating secure edge capture and streaming ${preset.name} to server...`);
    
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authedToken}`
        },
        body: JSON.stringify({
          imageName: preset.name,
          base64Data: preset.base64Fake,
          quantization: activeQuantization,
          modelName: cnnModel,
          task: preset.task,
          associatedNodeId: selectedNodeId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Preset upload failed.");
      }

      setActiveAnalysis({
        fileName: preset.name,
        ...data.analysis,
        customUrl: preset.previewUrl
      });

      // Synchronize with federated telemetry
      const accuracyGain = activeQuantization === 'FP32' ? 0.006 : activeQuantization === 'FP16' ? 0.005 : activeQuantization === 'INT8' ? 0.003 : 0.001;
      const lossReduction = activeQuantization === 'FP32' ? 0.05 : activeQuantization === 'FP16' ? 0.045 : activeQuantization === 'INT8' ? 0.02 : 0.008;
      
      onSyncNodeSamples(selectedNodeId, 1, accuracyGain, lossReduction);
      onSetSystemAlert(`Ingested preset ${preset.name} securely into account directory. Refreshed node weights.`);

      // Refresh files list
      fetchUserFiles(authedToken);
    } catch (err: any) {
      onSetSystemAlert(`Preset Ingest Error: ${err.message}`);
    } finally {
      setUploadingState('idle');
    }
  };

  const handleSecureDelete = async (fileName: string) => {
    if (!authedToken) return;
    try {
      const res = await fetch(`/api/user-images/${fileName}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authedToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        onSetSystemAlert(`File deleted from private directory: ${fileName}`);
        fetchUserFiles(authedToken);
        if (activeAnalysis?.fileName === fileName) {
          setActiveAnalysis(null);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      onSetSystemAlert(`Deletion Error: ${e.message}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            Quantizer.AI Data Feed & Secure Directory Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest real-time telemetry scans directly into user-isolated server storage folders for quantized execution.
          </p>
        </div>

        {authedUser && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <FolderLock className="h-3.5 w-3.5 text-emerald-400" />
              Directory: <span className="text-white font-bold">./data/uploads/{authedUser}/</span>
            </span>
            <button
              onClick={handleLogOut}
              className="text-xs font-semibold bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 hover:border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Unmount Storage
            </button>
          </div>
        )}
      </div>

      {/* Guest Authentication Screen */}
      {!authedToken ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex justify-between border-b border-slate-850 pb-2.5">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setAuthError(null); }}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 ${!isRegisterMode ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}
                >
                  Mount Private Folder
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setAuthError(null); }}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 ${isRegisterMode ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}
                >
                  Create Secure Directory
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Secure Username ID</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. saravanavel"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Private Auth Secret</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-mono flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/15"
                >
                  {isRegisterMode ? <UserPlus className="h-4 w-4" /> : <FolderLock className="h-4 w-4" />}
                  <span>{isRegisterMode ? "Generate Isolated Directory" : "Mount Isolated Directory"}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-center space-y-4">
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-display flex items-center gap-2">
                <FolderLock className="text-indigo-400 h-4 w-4" />
                Directory Isolation & Privacy Protocol
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                By mounting an isolated account directory, you secure absolute boundary limits over edge system telemetry:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex gap-2">
                  <HardDrive className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-[10.5px] font-bold text-slate-300 leading-tight">Private Storage Enclaves</h4>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 font-mono">Mapped dynamically onto physical paths: <code className="text-indigo-400 text-[8.5px]">./data/uploads/{`{user}`}/</code></p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex gap-2">
                  <FolderLock className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-[10.5px] font-bold text-slate-300 leading-tight">Zero-Trust Directory Bounds</h4>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 font-mono">Strict verification blocks other accounts from sniffing files or metadata.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/10 border border-indigo-900/30 rounded-lg flex items-center gap-2 text-[10px] text-indigo-400 font-mono">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Use baseline profile <strong className="text-indigo-300 font-bold">saravanavel / password123</strong> for immediate directory verification.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Workspace Active view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Upload controls, presets selection */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Real Drag & Drop Zone */}
            <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 text-center transition-all relative flex flex-col items-center justify-center min-h-[140px]">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingState !== 'idle'}
              />
              <Upload className="h-7 w-7 text-indigo-400 mb-2 animate-pulse" />
              <p className="text-xs text-slate-300 font-bold">Stream Real-Time System Image</p>
              <p className="text-[9px] text-slate-500 mt-1">Select file or drag & drop (JPEG, PNG, WEBP)</p>
              {uploadingState === 'reading' && <p className="text-[9px] text-amber-400 mt-2 font-mono">Reading files binary...</p>}
              {uploadingState === 'uploading' && <p className="text-[9px] text-indigo-400 mt-2 font-mono animate-bounce">Storing inside ./data/uploads/{authedUser}/</p>}
            </div>

            {/* Target Node & presets Selection */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-display uppercase tracking-wider">
                  <Network className="h-3.5 w-3.5 text-teal-400" />
                  Federated Target Synchronization
                </span>
                <span className="text-[9px] font-mono text-teal-400 bg-teal-950/30 border border-teal-900/30 px-2 py-0.5 rounded">
                  Node Telemetry Registry
                </span>
              </div>
              
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1.5">Edge Client Destination</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.device.split(' (')[0]})</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-500 leading-normal mt-1">
                  Upload feeds sync directly with this node's weights, increasing samples, decreasing loss, and training the global model!
                </p>
              </div>
            </div>

            {/* Instant Scan Presets */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider">
                Instant System Captures (Simulation Presets)
              </h4>
              <p className="text-[9.5px] text-slate-500">
                Click any telemetry capture below to simulate real-time edge hardware collection and instantly write to the backend storage folder.
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                {INGEST_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleIngestPreset(preset)}
                    disabled={uploadingState !== 'idle'}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-left transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-16 w-full rounded overflow-hidden relative mb-1.5">
                      <img
                        src={preset.previewUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/30" />
                    </div>
                    <span className="text-[9.5px] font-bold text-white block truncate leading-tight">{preset.name}</span>
                    <span className="text-[8px] text-slate-500 block truncate font-mono mt-0.5">{preset.task.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Panel: Real-time Dashboard results */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl" />
              
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-display mb-4 flex items-center gap-1.5">
                <BarChart3 className="text-indigo-400 h-4 w-4" />
                Live Ingested Edge Classification & Quantized Analysis
              </h3>

              {!activeAnalysis ? (
                <div className="py-12 text-center text-slate-600 font-mono text-[10.5px] space-y-2">
                  <Cpu className="h-7 w-7 text-slate-800 mx-auto animate-pulse" />
                  <p>Inference pipeline ready. Stream an image scan or trigger an instant capture preset.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-3 rounded-lg border border-slate-850 gap-2">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-indigo-400 tracking-wider">Active Streamed File</span>
                      <p className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <FileImage className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        {activeAnalysis.fileName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] font-mono uppercase text-slate-500 tracking-wider">Quantization Format</span>
                      <span className="bg-indigo-950/50 border border-indigo-900 text-indigo-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded block mt-0.5">
                        {activeAnalysis.quantization} Precision
                      </span>
                    </div>
                  </div>

                  {/* predictions confidence bars */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold flex justify-between">
                      <span>Real-Time Inference Predictions</span>
                      <span className="text-indigo-400">Task-Driven</span>
                    </h4>

                    <div className="space-y-2.5">
                      {activeAnalysis.predictions.map((pred: any, i: number) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10.5px] font-mono">
                            <span className="text-slate-300 font-bold">{pred.label}</span>
                            <span className="text-white font-bold">{(pred.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className={`h-full bg-gradient-to-r ${i === 0 ? 'from-indigo-500 to-sky-400' : 'from-slate-700 to-slate-600'}`}
                              style={{ width: `${pred.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compression stats & latency comparisons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    
                    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
                      <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Inference Latency</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-display text-white">{activeAnalysis.inferenceTimeMs}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ms</span>
                      </div>
                      
                      <div className="mt-2 h-1 bg-slate-950 rounded-full overflow-hidden">
                        {/* Compare current latency to standard FP32 latency (48ms) */}
                        <div 
                          className="h-full bg-amber-400" 
                          style={{ width: `${(activeAnalysis.inferenceTimeMs / 48) * 100}%` }}
                        />
                      </div>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-1">FP32 Baseline: 48ms</p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
                      <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Data Compression</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-display text-emerald-400">
                          {((1 - (activeAnalysis.compressedSizeBytes / activeAnalysis.fileSizeBytes)) * 100).toFixed(0)}%
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono">saving</span>
                      </div>
                      
                      <div className="mt-2 flex justify-between text-[8px] font-mono text-slate-500">
                        <span>{(activeAnalysis.fileSizeBytes / 1024).toFixed(0)}K raw</span>
                        <span>{(activeAnalysis.compressedSizeBytes / 1024).toFixed(0)}K q</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
                      <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Quantization Loss</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-display text-indigo-300">
                          {activeAnalysis.quantizationErrorPct.toFixed(2)}%
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono">RMSD</span>
                      </div>
                      <span className="mt-2 block text-[8px] font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 px-1.5 py-0.5 rounded text-center truncate">
                        {activeAnalysis.quantizationErrorPct < 2.0 ? "Calibration Solid" : "Marginal Noise degradation"}
                      </span>
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Ingested private files database */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-850 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <FolderLock className="h-3.5 w-3.5 text-indigo-400" />
                  Your Isolated Directory Registry
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {userFiles.length} file{userFiles.length !== 1 && 's'} securely stored
                </span>
              </div>

              <div className="max-h-[190px] overflow-y-auto">
                {loadingFiles ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-[10px]">
                    <RefreshCw className="h-5 w-5 text-indigo-400 mx-auto animate-spin mb-1.5" />
                    <span>Loading secure data directories...</span>
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-[10px] space-y-2">
                    <Database className="h-6 w-6 text-slate-700 mx-auto" />
                    <p>Isolated directory currently empty. Upload real system image files above.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-500 uppercase text-[8.5px] border-b border-slate-850 sticky top-0">
                        <th className="p-2.5">File Name</th>
                        <th className="p-2.5">Original Size</th>
                        <th className="p-2.5">Format Mapped</th>
                        <th className="p-2.5">Top Inference Predict</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {userFiles.map((file) => {
                        const topPred = file.predictions[0] 
                          ? `${file.predictions[0].label.split(' (')[0]} (${(file.predictions[0].confidence * 100).toFixed(0)}%)`
                          : "Processing Required";
                        
                        return (
                          <tr key={file.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-2.5 font-bold text-slate-200 truncate max-w-[150px]" title={file.name}>
                              {file.name}
                            </td>
                            <td className="p-2.5">{(file.fileSizeBytes / 1024).toFixed(1)} KB</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400">
                                {file.quantization} / {file.modelName}
                              </span>
                            </td>
                            <td className="p-2.5 text-indigo-300 font-bold truncate max-w-[150px]" title={topPred}>
                              {topPred}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleSecureDelete(file.name)}
                                className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                                title="Securely delete from disk folder"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
