import React, { useState, useEffect, useMemo } from 'react';
import { Eye, HelpCircle, Activity, Play, Zap, Terminal, Shuffle, Sliders, AlertTriangle, Upload, CheckCircle2, XCircle, Plus, Trash2, FileText, Database, ArrowRight, Layers } from 'lucide-react';
import { QuantizationType, PipelineStepState, CnnModelType } from '../types';

interface SampleDataRow {
  id: string;
  actual: string;
  predicted: string;
  confidence: number;
}

interface GanCnnPipelineVisualizerProps {
  activeQuantization: QuantizationType;
  cnnModel: CnnModelType;
  targetTask: string;
  onChangeTask: (task: string) => void;
  onInferenceResult?: (result: { label: string; confidence: number } | null) => void;
}

interface TaskPreset {
  id: string;
  name: string;
  description: string;
  rawLabel: string;
  ganLabel: string;
  cnnClasses: string[];
  gridColor: string;
}

const TASK_PRESETS: TaskPreset[] = [
  {
    id: 'industrial',
    name: 'Industrial Microchip Semiconductor Scanner',
    description: 'Scanning wafer microstructures at the edge for fractures or defect classification.',
    rawLabel: 'Noisy Electron Microscope Scan (Raw)',
    ganLabel: 'Denoised Pristine Wafer Reconstruction (GAN Output)',
    cnnClasses: ['Class-A (Flawless Wafer)', 'Class-B (Micro-Fracturing)', 'Class-C (Surface Contamination)'],
    gridColor: 'text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'agriculture',
    name: 'Precision Crop Satellite Canopy Scanner',
    description: 'Satellite imagery processing for localized plant hydration and disease index.',
    rawLabel: 'Sparse Spectral Satellite Imagery',
    ganLabel: 'Super-Resolved Synthetic Leaf Canopy',
    cnnClasses: ['Hydrated Leaf Canopy', 'Severe Nitrogen Deficiency', 'Water-Scarcity Sere-Weed'],
    gridColor: 'text-teal-400 bg-teal-500/10'
  },
  {
    id: 'medical',
    name: 'Bio-Microscopy Cell Histopathology Classifier',
    description: 'Cell biopsy slides enhancement and malignancy segment detection.',
    rawLabel: 'Low-Exposure Fluorescent Cellular Slide',
    ganLabel: 'Synthesized High-Contrast Cell Segment',
    cnnClasses: ['Healthy Tissue Mitosis', 'Carcinoma Neoplastic Growth', 'Bacterial Pathogen Strain-X'],
    gridColor: 'text-rose-400 bg-rose-500/10'
  }
];

const PRESET_DATASETS: Record<string, SampleDataRow[]> = {
  industrial: [
    { id: 'SMP-01', actual: 'Class-A (Flawless Wafer)', predicted: 'Class-A (Flawless Wafer)', confidence: 0.98 },
    { id: 'SMP-02', actual: 'Class-B (Micro-Fracturing)', predicted: 'Class-B (Micro-Fracturing)', confidence: 0.94 },
    { id: 'SMP-03', actual: 'Class-C (Surface Contamination)', predicted: 'Class-C (Surface Contamination)', confidence: 0.89 },
    { id: 'SMP-04', actual: 'Class-A (Flawless Wafer)', predicted: 'Class-A (Flawless Wafer)', confidence: 0.96 },
    { id: 'SMP-05', actual: 'Class-B (Micro-Fracturing)', predicted: 'Class-A (Flawless Wafer)', confidence: 0.51 },
    { id: 'SMP-06', actual: 'Class-C (Surface Contamination)', predicted: 'Class-C (Surface Contamination)', confidence: 0.91 },
    { id: 'SMP-07', actual: 'Class-A (Flawless Wafer)', predicted: 'Class-A (Flawless Wafer)', confidence: 0.99 },
    { id: 'SMP-08', actual: 'Class-B (Micro-Fracturing)', predicted: 'Class-B (Micro-Fracturing)', confidence: 0.88 },
    { id: 'SMP-09', actual: 'Class-C (Surface Contamination)', predicted: 'Class-B (Micro-Fracturing)', confidence: 0.45 },
    { id: 'SMP-10', actual: 'Class-A (Flawless Wafer)', predicted: 'Class-A (Flawless Wafer)', confidence: 0.93 }
  ],
  agriculture: [
    { id: 'AGR-01', actual: 'Hydrated Leaf Canopy', predicted: 'Hydrated Leaf Canopy', confidence: 0.97 },
    { id: 'AGR-02', actual: 'Severe Nitrogen Deficiency', predicted: 'Severe Nitrogen Deficiency', confidence: 0.93 },
    { id: 'AGR-03', actual: 'Water-Scarcity Sere-Weed', predicted: 'Water-Scarcity Sere-Weed', confidence: 0.91 },
    { id: 'AGR-04', actual: 'Hydrated Leaf Canopy', predicted: 'Severe Nitrogen Deficiency', confidence: 0.48 },
    { id: 'AGR-05', actual: 'Severe Nitrogen Deficiency', predicted: 'Severe Nitrogen Deficiency', confidence: 0.95 },
    { id: 'AGR-06', actual: 'Water-Scarcity Sere-Weed', predicted: 'Water-Scarcity Sere-Weed', confidence: 0.87 },
    { id: 'AGR-07', actual: 'Hydrated Leaf Canopy', predicted: 'Hydrated Leaf Canopy', confidence: 0.98 },
    { id: 'AGR-08', actual: 'Water-Scarcity Sere-Weed', predicted: 'Hydrated Leaf Canopy', confidence: 0.52 }
  ],
  medical: [
    { id: 'MED-01', actual: 'Healthy Tissue Mitosis', predicted: 'Healthy Tissue Mitosis', confidence: 0.99 },
    { id: 'MED-02', actual: 'Carcinoma Neoplastic Growth', predicted: 'Carcinoma Neoplastic Growth', confidence: 0.96 },
    { id: 'MED-03', actual: 'Bacterial Pathogen Strain-X', predicted: 'Bacterial Pathogen Strain-X', confidence: 0.94 },
    { id: 'MED-04', actual: 'Carcinoma Neoplastic Growth', predicted: 'Carcinoma Neoplastic Growth', confidence: 0.91 },
    { id: 'MED-05', actual: 'Healthy Tissue Mitosis', predicted: 'Healthy Tissue Mitosis', confidence: 0.97 },
    { id: 'MED-06', actual: 'Bacterial Pathogen Strain-X', predicted: 'Healthy Tissue Mitosis', confidence: 0.42 },
    { id: 'MED-07', actual: 'Carcinoma Neoplastic Growth', predicted: 'Bacterial Pathogen Strain-X', confidence: 0.58 },
    { id: 'MED-08', actual: 'Bacterial Pathogen Strain-X', predicted: 'Bacterial Pathogen Strain-X', confidence: 0.95 },
    { id: 'MED-09', actual: 'Healthy Tissue Mitosis', predicted: 'Healthy Tissue Mitosis', confidence: 0.98 }
  ]
};

export default function GanCnnPipelineVisualizer({
  activeQuantization,
  cnnModel,
  targetTask,
  onChangeTask,
  onInferenceResult
}: GanCnnPipelineVisualizerProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('industrial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inferenceData, setInferenceData] = useState<PipelineStepState | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0); // 0: Idle, 1: Raw, 2: GAN, 3: CNN Complete

  const activePreset = TASK_PRESETS.find(p => p.id === selectedPresetId) || TASK_PRESETS[0];

  // Live Dataset Ingestion & Evaluation State
  const [userSamples, setUserSamples] = useState<SampleDataRow[]>([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Manual creation form state
  const [newId, setNewId] = useState('');
  const [newActual, setNewActual] = useState('');
  const [newPredicted, setNewPredicted] = useState('');
  const [newConfidence, setNewConfidence] = useState(0.95);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActual, setEditActual] = useState('');
  const [editPredicted, setEditPredicted] = useState('');
  const [editConfidence, setEditConfidence] = useState(0.95);

  // Set default manual forms actual/predicted states on load/preset change
  useEffect(() => {
    if (activePreset) {
      setNewActual(activePreset.cnnClasses[0]);
      setNewPredicted(activePreset.cnnClasses[0]);
    }
  }, [selectedPresetId]);

  // Fetch or simulate inference pipelines
  const triggerInference = async () => {
    setIsProcessing(true);
    setInferenceData(null);
    setActiveStep(1); // Starting RAW

    try {
      const response = await fetch('/api/process-inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: activePreset.name,
          quantization: activeQuantization,
          modelName: cnnModel
        })
      });
      const data = await response.json();

      // Timed state progression to simulate scanning animation
      setTimeout(() => {
        setActiveStep(2); // Progress to GAN
        setTimeout(() => {
          setActiveStep(3); // CNN completed
          const preds = data.predictions || [
            { label: activePreset.cnnClasses[0], confidence: 0.95 },
            { label: activePreset.cnnClasses[1], confidence: 0.04 },
            { label: activePreset.cnnClasses[2], confidence: 0.01 }
          ];
          setInferenceData({
            rawImage: '',
            ganGeneratedImage: '',
            cnnFeatureMap: '',
            predictions: preds,
            inferenceTimeMs: data.inferenceTimeMs || 12,
            quantizationErrorPct: data.quantizationErrorPct || 1.4
          });
          setIsProcessing(false);
          if (onInferenceResult) {
            onInferenceResult(preds[0]);
          }
        }, 1200);
      }, 1000);

    } catch (err) {
      console.error("Error trigger inference:", err);
      // Fallback
      setActiveStep(3);
      const preds = [
        { label: activePreset.cnnClasses[0], confidence: 0.92 },
        { label: activePreset.cnnClasses[1], confidence: 0.06 },
        { label: activePreset.cnnClasses[2], confidence: 0.02 }
      ];
      setInferenceData({
        rawImage: '',
        ganGeneratedImage: '',
        cnnFeatureMap: '',
        predictions: preds,
        inferenceTimeMs: activeQuantization === 'INT8' ? 14 : activeQuantization === 'INT4' ? 6 : 45,
        quantizationErrorPct: activeQuantization === 'INT8' ? 1.5 : activeQuantization === 'INT4' ? 7.2 : 0
      });
      setIsProcessing(false);
      if (onInferenceResult) {
        onInferenceResult(preds[0]);
      }
    }
  };

  useEffect(() => {
    // Sync external Task state when user selects preset
    onChangeTask(activePreset.name);
    triggerInference();
  }, [selectedPresetId, activeQuantization, cnnModel]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-5 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Activity className="text-teal-400 h-5 w-5" />
            Quantized GAN-CNN Active Inference Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decentralized GAN generator outputs crisp synthetic images, then CNN makes low-latency edge assessments.
          </p>
        </div>

        {/* Task presets dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Target Task:</span>
          <select
            id="select-target-preset"
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="bg-slate-950 border border-slate-850 text-xs text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
          >
            {TASK_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name.split(' Scanner')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description preset panel */}
      <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs text-slate-400 font-mono mb-6 flex justify-between items-center gap-4">
        <span><strong className="text-slate-300">Pipeline Focus:</strong> {activePreset.description}</span>
        <button
          id="btn-re-inference"
          onClick={triggerInference}
          disabled={isProcessing}
          className="shrink-0 flex items-center gap-1 text-[10px] bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-2.5 py-1 rounded border border-teal-500/20 transition-all font-bold uppercase cursor-pointer disabled:opacity-50"
        >
          <Shuffle className="h-3 w-3" />
          Trigger Frame
        </button>
      </div>

      {/* Pipeline Stages Visual Flow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Stage 1: Raw Sensor Capture */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          {/* Scanline grid overlay */}
          <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,transparent,rgba(0,0,0,0.4)) pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Stage 01: Input Signal</span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">EDGE SENSOR</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-300 font-display mb-1">{activePreset.rawLabel}</h3>
          </div>

          {/* SVG representation of original noisy scan */}
          <div className="bg-slate-900 h-[180px] rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center my-4">
            <svg viewBox="0 0 200 180" className="w-full h-full">
              {/* Noise matrix simulation */}
              <defs>
                <pattern id="noise-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect width="10" height="10" fill="#0f172a" />
                  <circle cx="2" cy="2" r="1.5" fill="#1e293b" opacity="0.6" />
                  <circle cx="7" cy="6" r="1" fill="#334155" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="200" height="180" fill="url(#noise-pattern)" />

              {/* Grid map overlay */}
              <g stroke="#334155" strokeWidth="0.5" opacity="0.15">
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`lh-${i}`} x1="0" y1={i * 25} x2="200" y2={i * 25} />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`lv-${i}`} x1={i * 22} y1="0" x2={i * 22} y2="180" />
                ))}
              </g>

              {/* Noisy/Sparse signal graphic */}
              <path
                d={selectedPresetId === 'industrial' 
                  ? "M 40,90 Q 70,60 100,120 T 160,50" 
                  : selectedPresetId === 'agriculture'
                  ? "M 20,40 C 60,60 120,20 180,140 M 40,150 C 90,80 150,160 160,30"
                  : "M 100,90 C 80,40 40,80 100,140 C 160,80 120,40 100,90"
                }
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeDasharray="4,8"
                className="animate-pulse"
              />

              {/* Reticle indicator */}
              <g stroke="#475569" strokeWidth="1" fill="none">
                <circle cx="100" cy="90" r="25" strokeDasharray="3,3" />
                <line x1="100" y1="55" x2="100" y2="125" />
                <line x1="65" y1="90" x2="135" y2="90" />
              </g>
            </svg>

            {/* Simulated overlay stats */}
            <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400 border border-slate-800">
              RX_SAMP_RATE: 1.2 GS/s
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
            Raw signals gathered from edge nodes. High entropy, low clarity, signal-to-noise ratio: -12.4dB.
          </div>
        </div>

        {/* Stage 2: Quantized GAN Generator */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
          {/* Active laser sweep during processing */}
          {activeStep === 1 && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-12 w-full translate-y-0 animate-[ping_2s_infinite] pointer-events-none" />
          )}

          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Stage 02: Generator</span>
              <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-850 text-cyan-400 rounded text-[9px] font-mono font-bold">
                GAN MODEL
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-300 font-display mb-1">{activePreset.ganLabel}</h3>
          </div>

          {/* SVG representing GAN enhancement / reconstruction */}
          <div className="bg-slate-900 h-[180px] rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center my-4">
            <svg viewBox="0 0 200 180" className="w-full h-full">
              <rect width="200" height="180" fill="#090d16" />

              {/* Grid Map overlay */}
              <g stroke="#1e293b" strokeWidth="0.5" opacity="0.3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`lh2-${i}`} x1="0" y1={i * 15} x2="200" y2={i * 15} />
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line key={`lv2-${i}`} x1={i * 15} y1="0" x2={i * 15} y2="180" />
                ))}
              </g>

              {/* GAN Reconstruction rendering */}
              {activeStep >= 2 ? (
                <>
                  <path
                    d={selectedPresetId === 'industrial' 
                      ? "M 40,90 Q 70,60 100,120 T 160,50" 
                      : selectedPresetId === 'agriculture'
                      ? "M 20,40 C 60,60 120,20 180,140 M 40,150 C 90,80 150,160 160,30"
                      : "M 100,90 C 80,40 40,80 100,140 C 160,80 120,40 100,90"
                    }
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="3.5"
                    className="shadow-glow"
                  />
                  {/* Additional details generated */}
                  {selectedPresetId === 'industrial' && (
                    <circle cx="100" cy="120" r="4" fill="#f59e0b" className="animate-ping" />
                  )}
                  {selectedPresetId === 'medical' && (
                    <g fill="#f43f5e" opacity="0.8">
                      <circle cx="100" cy="90" r="12" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                      <circle cx="95" cy="85" r="3" />
                      <circle cx="104" cy="95" r="2" />
                    </g>
                  )}
                  {selectedPresetId === 'agriculture' && (
                    <path d="M 120,20 Q 130,40 150,40" stroke="#14b8a6" strokeWidth="1.5" />
                  )}

                  {/* Processing Sweep line */}
                  {isProcessing && (
                    <line x1="0" y1="10" x2="200" y2="10" stroke="#22d3ee" strokeWidth="2" className="animate-[bounce_2s_infinite]" />
                  )}
                </>
              ) : (
                <text x="100" y="90" fill="#475569" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Awaiting Generator Sync...
                </text>
              )}
            </svg>

            {/* Dynamic performance overlay */}
            <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 border border-slate-800">
              RECON_BIAS: +0.0234
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
            Quantized {activeQuantization} generator creates crisp synthetic frames. Loss reduction: -32dB.
          </div>
        </div>

        {/* Stage 3: Quantized CNN Classifier */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-violet-400 font-bold uppercase">Stage 03: Classifier</span>
              <span className="px-2 py-0.5 bg-violet-950 border border-violet-850 text-violet-400 rounded text-[9px] font-mono font-bold">
                {cnnModel}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-300 font-display mb-1">CNN Saliency Activation & Classes</h3>
          </div>

          {/* Inference results terminal area */}
          <div className="my-4 bg-slate-900 border border-slate-800 rounded-lg p-3 min-h-[180px] flex flex-col justify-between">
            {activeStep === 3 && inferenceData ? (
              <div className="space-y-3 font-mono text-[10px] text-slate-300">
                {/* Active scan status */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-slate-400">
                  <span>LATENCY:</span>
                  <span className="text-emerald-400 font-bold">{inferenceData.inferenceTimeMs} ms</span>
                </div>

                {/* Saliency prediction results */}
                <div className="space-y-2">
                  <p className="text-[9px] text-slate-500 uppercase">Class Probabilities:</p>
                  {inferenceData.predictions.map((pred, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className={i === 0 ? "text-slate-200 font-bold" : "text-slate-400"}>{pred.label}</span>
                        <span className={i === 0 ? "text-emerald-400 font-bold" : "text-slate-400"}>{(pred.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-800'}`}
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error factor warning block */}
                {activeQuantization === 'INT4' && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-500 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Accuracy degradation warning under INT4.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                <Terminal className="h-6 w-6 text-slate-700 animate-pulse" />
                <p className="text-[10px] font-mono text-slate-500 mt-2">Running pipeline passes...</p>
                <p className="text-[9px] text-slate-600">Awaiting Conv layers activations</p>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
            Classification inference is executed locally inside the edge device. Error Rate: {inferenceData?.quantizationErrorPct || '0.0'}%.
          </div>
        </div>
      </div>

      {/* PIPELINE STAGE: QUANTIZER AFFINE EQUATIONS BOARD */}
      <div className="mt-6 bg-slate-900 border border-slate-850 p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-display">Inference Pipeline Quantizer Equations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Uniform Affine Mapping configurations for converting model parameters from Float32 to Sub-Byte.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          
          {/* Base Quantization Function */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">01. Dynamic Quantization Formula</span>
              <p className="text-[11px] text-slate-400 mt-1">Converts real-valued weights $w$ to quantized integer tokens $q$ using a Scale factor ($S$) and Zero-Point ($ZP$).</p>
            </div>
            <div className="my-3 py-2 px-3 bg-slate-900 border border-slate-800 rounded text-center font-mono text-xs text-emerald-400 font-bold select-all">
              {"q = clamp( ⌊ w / S ⌉ + ZP, q_min, q_max )"}
            </div>
            <div className="text-[9.5px] font-mono text-slate-500">
              Where ⌊ · ⌉ denotes round-to-nearest-integer, and q_min, q_max represent the boundaries of target precision ({activeQuantization}).
            </div>
          </div>

          {/* Symmetric Uniform Mapping */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">02. Symmetric Mapping (Clip [-α, α])</span>
              <p className="text-[11px] text-slate-400 mt-1">Symmetric calibration centers the quantization grid around zero, rendering the zero-point $ZP = 0$ perfectly.</p>
            </div>
            <div className="my-3 space-y-1.5 font-mono text-[10.5px] text-slate-300">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex justify-between">
                <span className="text-slate-500">Scale factor (S):</span>
                <span className="text-amber-400 font-bold">S = α / q_max</span>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex justify-between">
                <span className="text-slate-500">Zero Point (ZP):</span>
                <span className="text-amber-400 font-bold">ZP = 0</span>
              </div>
            </div>
            <div className="text-[9.5px] font-mono text-slate-500">
              Minimizes hardware computational complexity. Best for weights distributions centered closely around zero.
            </div>
          </div>

          {/* Asymmetric Uniform Mapping */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">03. Asymmetric Mapping (Clip [β, α])</span>
              <p className="text-[11px] text-slate-400 mt-1">Asymmetric calibration maps clipping boundaries $[\beta, \alpha]$ dynamically to exploit non-symmetrical ranges.</p>
            </div>
            <div className="my-3 space-y-1.5 font-mono text-[10.5px] text-slate-300">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex justify-between">
                <span className="text-slate-500">Scale factor (S):</span>
                <span className="text-cyan-400 font-bold">S = (α - β) / (q_max - q_min)</span>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex justify-between">
                <span className="text-slate-500">Zero Point (ZP):</span>
                <span className="text-cyan-400 font-bold">ZP = round(-β / S) + q_min</span>
              </div>
            </div>
            <div className="text-[9.5px] font-mono text-slate-500">
              Preserves maximum resolution. Recommended for highly skewed activation functions like ReLU.
            </div>
          </div>

        </div>
      </div>

      {/* OWN SYSTEM DATA INTEGRATION: LIVE INGESTION & ACCURACY VALIDATOR */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Database className="text-indigo-400 h-4 w-4" />
              Own System Data: Dataset Ingestion & Accuracy Evaluator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect your own dataset (CSV or JSON format) to calculate model classification accuracy under the {activeQuantization} format.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (PRESET_DATASETS[selectedPresetId]) {
                  setUserSamples(PRESET_DATASETS[selectedPresetId]);
                  setUploadStatus({ success: true, message: `Re-loaded default preset dataset with ${PRESET_DATASETS[selectedPresetId].length} rows.` });
                }
              }}
              className="text-[10px] font-mono bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Reset to Preset Baseline
            </button>
            <button
              onClick={() => setUserSamples([])}
              className="text-[10px] font-mono bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* Data Upload Drag-and-Drop Mock & Input Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left panel: upload controls and manual add form */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Upload Zone */}
            <div className="bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all relative text-center">
              <input
                id="own-dataset-upload"
                type="file"
                accept=".csv,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    if (!text) return;
                    try {
                      if (file.name.endsWith('.json')) {
                        const parsed = JSON.parse(text);
                        if (Array.isArray(parsed)) {
                          const formatted = parsed.map((item: any, idx: number) => ({
                            id: item.id || `VAL-${idx + 1}`,
                            actual: item.actual || item.actualClass || activePreset.cnnClasses[0],
                            predicted: item.predicted || item.predictedClass || activePreset.cnnClasses[0],
                            confidence: typeof item.confidence === 'number' ? item.confidence : 0.90
                          }));
                          setUserSamples(formatted);
                          setUploadStatus({ success: true, message: `Successfully loaded ${formatted.length} samples from JSON.` });
                        } else {
                          setUploadStatus({ success: false, message: "JSON must be an array of samples containing 'actual', 'predicted', 'confidence'." });
                        }
                      } else {
                        // CSV Parser
                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                        const samples: SampleDataRow[] = [];
                        const startIdx = (lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('actual')) ? 1 : 0;
                        for (let i = startIdx; i < lines.length; i++) {
                          const parts = lines[i].split(',').map(p => p.trim());
                          if (parts.length >= 2) {
                            samples.push({
                              id: parts[0] || `SAMP-${i}`,
                              actual: parts[1] || activePreset.cnnClasses[0],
                              predicted: parts[2] || parts[1] || activePreset.cnnClasses[0],
                              confidence: parts[3] ? parseFloat(parts[3]) || 0.95 : 0.95
                            });
                          }
                        }
                        if (samples.length > 0) {
                          setUserSamples(samples);
                          setUploadStatus({ success: true, message: `Successfully loaded ${samples.length} samples from CSV.` });
                        } else {
                          setUploadStatus({ success: false, message: "Could not parse CSV. Format: ID, ActualClass, PredictedClass, Confidence" });
                        }
                      }
                    } catch (err) {
                      setUploadStatus({ success: false, message: "Error parsing dataset file." });
                    }
                  };
                  reader.readAsText(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-6 w-6 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-300 font-bold">Upload Custom Evaluation Dataset</p>
              <p className="text-[10px] text-slate-500 mt-1">Supports JSON (array of items) or CSV files</p>
              <p className="text-[9px] text-indigo-500 mt-2 font-mono">Format: SampleID, ActualLabel, PredictedLabel, Confidence</p>
            </div>

            {/* Paste Area Toggle */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Paste Raw Delimited Text
                </span>
                <button
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  [{showPasteArea ? 'Hide' : 'Expand'}]
                </button>
              </div>

              {showPasteArea && (
                <div className="space-y-3">
                  <textarea
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    placeholder="SAMP-101, Class-A (Flawless Wafer), Class-A (Flawless Wafer), 0.97&#10;SAMP-102, Class-B (Micro-Fracturing), Class-A (Flawless Wafer), 0.54"
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      try {
                        const lines = pasteInput.split('\n').map(l => l.trim()).filter(Boolean);
                        const samples: SampleDataRow[] = [];
                        lines.forEach((line, idx) => {
                          const parts = line.split(',').map(p => p.trim());
                          if (parts.length >= 2) {
                            samples.push({
                              id: parts[0] || `PASTE-${idx + 1}`,
                              actual: parts[1] || activePreset.cnnClasses[0],
                              predicted: parts[2] || parts[1] || activePreset.cnnClasses[0],
                              confidence: parts[3] ? parseFloat(parts[3]) || 0.95 : 0.95
                            });
                          }
                        });
                        if (samples.length > 0) {
                          setUserSamples(samples);
                          setUploadStatus({ success: true, message: `Successfully parsed ${samples.length} pasted samples.` });
                          setPasteInput('');
                          setShowPasteArea(false);
                        } else {
                          setUploadStatus({ success: false, message: "Format error. Expected comma-separated: ID, ActualClass, PredictedClass, Confidence" });
                        }
                      } catch (err) {
                        setUploadStatus({ success: false, message: "Error parsing pasted text." });
                      }
                    }}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Parse Paste Stream
                  </button>
                </div>
              )}

              {/* Upload Status Alert */}
              {uploadStatus && (
                <div className={`mt-3 p-2 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                  uploadStatus.success 
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                }`}>
                  {uploadStatus.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{uploadStatus.message}</span>
                </div>
              )}
            </div>

            {/* Manual Insert Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newId.trim()) return;
                const row: SampleDataRow = {
                  id: newId,
                  actual: newActual || activePreset.cnnClasses[0],
                  predicted: newPredicted || activePreset.cnnClasses[0],
                  confidence: newConfidence
                };
                setUserSamples(prev => [...prev, row]);
                setNewId('');
                setUploadStatus({ success: true, message: `Added custom sample row: ${row.id}` });
              }}
              className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3"
            >
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-display">Add Custom Evaluation Entry</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1 font-mono">Sample ID</label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. S-901"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1 font-mono">Confidence</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1.0"
                    required
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(parseFloat(e.target.value))}
                    placeholder="0.95"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1 font-mono">Actual Label</label>
                  <select
                    value={newActual}
                    onChange={(e) => setNewActual(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {activePreset.cnnClasses.map((cls, idx) => (
                      <option key={`act-opt-${idx}`} value={cls}>{cls.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1 font-mono">Predicted Label</label>
                  <select
                    value={newPredicted}
                    onChange={(e) => setNewPredicted(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {activePreset.cnnClasses.map((cls, idx) => (
                      <option key={`pred-opt-${idx}`} value={cls}>{cls.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Inject Sample Entry</span>
              </button>
            </form>

          </div>

          {/* Right panel: Live validation stats & Confusion Matrix */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Real-time stats display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center relative overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">Ingested Samples</span>
                <span className="text-2xl font-bold font-display text-white">{userSamples.length}</span>
                <p className="text-[9px] text-slate-500 font-mono mt-1">Unique systems inputs</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center relative overflow-hidden">
                {/* Simulated accuracy based on matches & quantization mode precision degradation */}
                {(() => {
                  const isMatch = (s: SampleDataRow) => {
                    const baseMatch = s.actual === s.predicted;
                    if (!baseMatch) return false;
                    
                    if (activeQuantization === 'INT4') {
                      const hash = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      if (s.confidence < 0.95 && hash % 3 === 0) {
                        return false; // INT4 quantization degradation
                      }
                    } else if (activeQuantization === 'INT8') {
                      const hash = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      if (s.confidence < 0.85 && hash % 5 === 0) {
                        return false; // INT8 minor precision loss
                      }
                    }
                    return true;
                  };

                  const total = userSamples.length;
                  const matches = userSamples.filter(isMatch).length;
                  const accuracy = total > 0 ? (matches / total) * 100 : 100.0;
                  
                  return (
                    <>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">Calculated Accuracy</span>
                      <span className={`text-2xl font-bold font-display ${accuracy >= 90 ? 'text-emerald-400' : accuracy >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {accuracy.toFixed(1)}%
                      </span>
                      <p className="text-[9px] text-indigo-400 font-mono mt-1">({matches} correct / {total} total)</p>
                    </>
                  );
                })()}
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center relative overflow-hidden">
                {(() => {
                  const total = userSamples.length;
                  const avgConfidence = total > 0 ? (userSamples.reduce((sum, s) => sum + s.confidence, 0) / total) * 100 : 0;
                  const quantizationLoss = activeQuantization === 'FP32' ? 0.0 : activeQuantization === 'FP16' ? 0.2 : activeQuantization === 'INT8' ? 1.5 : 8.8;
                  
                  return (
                    <>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">Average Confidence</span>
                      <span className="text-2xl font-bold font-display text-indigo-300">
                        {avgConfidence.toFixed(0)}%
                      </span>
                      <p className="text-[9px] text-amber-500 font-mono mt-1">Quantization Loss: -{quantizationLoss}%</p>
                    </>
                  );
                })()}
              </div>

            </div>

            {/* Confusion Matrix visualizer */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display mb-3">
                Live Confusion Matrix Plot (Ingested Custom System)
              </h4>

              {(() => {
                const classes = activePreset.cnnClasses;
                
                const isMatch = (s: SampleDataRow) => {
                  const baseMatch = s.actual === s.predicted;
                  if (!baseMatch) return false;
                  
                  if (activeQuantization === 'INT4') {
                    const hash = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    if (s.confidence < 0.95 && hash % 3 === 0) {
                      return false; // INT4 quantization degradation
                    }
                  } else if (activeQuantization === 'INT8') {
                    const hash = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    if (s.confidence < 0.85 && hash % 5 === 0) {
                      return false; // INT8 minor precision loss
                    }
                  }
                  return true;
                };

                const matrix: Record<string, Record<string, number>> = {};
                classes.forEach(c1 => {
                  matrix[c1] = {};
                  classes.forEach(c2 => {
                    matrix[c1][c2] = 0;
                  });
                });

                userSamples.forEach(s => {
                  const act = classes.includes(s.actual) ? s.actual : classes[0];
                  let effPred = classes.includes(s.predicted) ? s.predicted : classes[0];
                  
                  if (!isMatch(s)) {
                    const alternatives = classes.filter(c => c !== act);
                    if (alternatives.length > 0) {
                      const hash = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      effPred = alternatives[hash % alternatives.length];
                    }
                  }

                  if (matrix[act] && matrix[act][effPred] !== undefined) {
                    matrix[act][effPred]++;
                  }
                });

                return (
                  <div className="space-y-4">
                    {/* Matrix Grid layout */}
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-center">
                      <div className="bg-transparent flex items-center justify-center text-slate-500 font-bold">
                        Actual \ Pred
                      </div>
                      {classes.map((cls, i) => (
                        <div key={`head-${i}`} className="bg-slate-900 border border-slate-800 p-1.5 rounded text-indigo-300 font-bold truncate" title={cls}>
                          {cls.substring(0, 10)}...
                        </div>
                      ))}

                      {classes.map((actCls, actIdx) => (
                        <React.Fragment key={`row-${actIdx}`}>
                          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded text-left text-slate-400 font-bold truncate" title={actCls}>
                            {actCls.substring(0, 10)}...
                          </div>
                          {classes.map((predCls, predIdx) => {
                            const count = matrix[actCls]?.[predCls] || 0;
                            const isDiagonal = actCls === predCls;
                            return (
                              <div
                                key={`cell-${actIdx}-${predIdx}`}
                                className={`p-2.5 rounded border transition-all flex flex-col justify-center items-center ${
                                  count > 0 
                                    ? isDiagonal 
                                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 font-bold' 
                                      : 'bg-rose-950/40 border-rose-500/30 text-rose-400 font-bold animate-pulse'
                                    : 'bg-slate-900 border-slate-850 text-slate-600'
                                }`}
                              >
                                <span>{count}</span>
                                {count > 0 && (
                                  <span className="text-[8px] font-mono font-normal opacity-70 mt-0.5">
                                    {isDiagonal ? 'Hit' : 'Miss'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-[9px] text-slate-500 font-mono leading-relaxed">
                      * Correct predictions reside on the main diagonal (Hit). Off-diagonal cells indicate incorrect classifications (Miss) or quantization shifts under {activeQuantization} precision constraints.
                    </p>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>

        {/* Live Scrollable Dataset Registry table */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-850 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Ingested System Samples Database
            </span>
            <span className="text-[9px] text-indigo-400 font-mono">
              Double check accurate tags or customize rows to test boundary stability
            </span>
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            {userSamples.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-[10px] space-y-2">
                <Database className="h-6 w-6 text-slate-700 mx-auto animate-pulse" />
                <p>No telemetry rows loaded. Connect your custom system dataset above or load baseline.</p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 uppercase text-[9px] border-b border-slate-850 sticky top-0">
                    <th className="p-3">Sample ID</th>
                    <th className="p-3">Actual Classification</th>
                    <th className="p-3">Predicted Classification</th>
                    <th className="p-3 text-center">Confidence</th>
                    <th className="p-3 text-center">Simulated Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {userSamples.map((s) => {
                    const isEditing = editingId === s.id;
                    
                    const isMatch = (row: SampleDataRow) => {
                      const baseMatch = row.actual === row.predicted;
                      if (!baseMatch) return false;
                      
                      if (activeQuantization === 'INT4') {
                        const hash = row.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        if (row.confidence < 0.95 && hash % 3 === 0) {
                          return false; // INT4 quantization degradation
                        }
                      } else if (activeQuantization === 'INT8') {
                        const hash = row.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        if (row.confidence < 0.85 && hash % 5 === 0) {
                          return false; // INT8 minor precision loss
                        }
                      }
                      return true;
                    };

                    const passed = isMatch(s);

                    return (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-slate-200">{s.id}</td>
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editActual}
                              onChange={(e) => setEditActual(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded p-1 text-[10px] text-white font-mono focus:outline-none"
                            >
                              {activePreset.cnnClasses.map((cls, idx) => (
                                <option key={`edit-act-${idx}`} value={cls}>{cls}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400">{s.actual}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editPredicted}
                              onChange={(e) => setEditPredicted(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded p-1 text-[10px] text-white font-mono focus:outline-none"
                            >
                              {activePreset.cnnClasses.map((cls, idx) => (
                                <option key={`edit-pred-${idx}`} value={cls}>{cls}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400">{s.predicted}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1.0"
                              value={editConfidence}
                              onChange={(e) => setEditConfidence(parseFloat(e.target.value))}
                              className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-[10px] text-white font-mono text-center focus:outline-none"
                            />
                          ) : (
                            <span className="text-indigo-400 font-bold">{(s.confidence * 100).toFixed(0)}%</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {passed ? (
                            <span className="px-2 py-0.5 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-md flex items-center justify-center gap-1 w-20 mx-auto">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pass</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950/30 border border-rose-500/20 text-rose-400 text-[9px] font-bold rounded-md flex items-center justify-center gap-1 w-20 mx-auto" title={s.actual !== s.predicted ? "Initial mismatch in label tags" : "Precision degraded under active quantization compression"}>
                              <XCircle className="h-3 w-3" />
                              <span>{s.actual !== s.predicted ? 'Mismatch' : 'Comp. Drop'}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isEditing ? (
                              <button
                                onClick={() => {
                                  setUserSamples(prev => prev.map(row => row.id === s.id ? {
                                    ...row,
                                    actual: editActual,
                                    predicted: editPredicted,
                                    confidence: editConfidence
                                  } : row));
                                  setEditingId(null);
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold uppercase cursor-pointer"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(s.id);
                                  setEditActual(s.actual);
                                  setEditPredicted(s.predicted);
                                  setEditConfidence(s.confidence);
                                }}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded border border-slate-800 text-[9px] font-bold uppercase cursor-pointer"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => setUserSamples(prev => prev.filter(row => row.id !== s.id))}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
  );
}
