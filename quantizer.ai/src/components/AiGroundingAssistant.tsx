import React, { useState, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Mic, 
  MicOff,
  Sparkles, 
  Video, 
  Play, 
  CheckCircle2, 
  Image as ImageIcon, 
  Cpu, 
  Globe, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Clock,
  Navigation
} from 'lucide-react';
import { QuantizationType } from '../types';

interface AiGroundingAssistantProps {
  authedUser: string | null;
  activeQuantization: QuantizationType;
  onSetSystemAlert: (msg: string) => void;
  onNewImageGenerated: () => void; // Trigger refresh of isolated directory
}

const VIDEO_PRESETS = [
  { id: 'vid-1', name: 'Silicon Wafer Conveyer Automated Camera Stream', duration: '12s', quality: '1080p 60fps' },
  { id: 'vid-2', name: 'Agricultural Crop Hyperspectral Scan Drone Reel', duration: '24s', quality: '4K HDR' },
  { id: 'vid-3', name: 'Petri-Dish Cellular Neo-Pathology Slide Sequence', duration: '18s', quality: '720p Micro' }
];

export default function AiGroundingAssistant({
  authedUser,
  activeQuantization,
  onSetSystemAlert,
  onNewImageGenerated
}: AiGroundingAssistantProps) {
  const [activeTab, setActiveTab] = useState<'grounding' | 'voice' | 'gan' | 'video'>('grounding');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'search' | 'maps'>('search');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Audio Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState('');
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // GAN Image Generator state
  const [ganPrompt, setGanPrompt] = useState('High precision semiconductor wafer micro-cracks under thermal infrared stress');
  const [generatingGan, setGeneratingGan] = useState(false);
  const [ganSuccessFile, setGanSuccessFile] = useState<string | null>(null);

  // Video Analysis state
  const [selectedVideo, setSelectedVideo] = useState(VIDEO_PRESETS[0].name);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [videoReport, setVideoReport] = useState<string | null>(null);

  // Handle Grounding API (Google Search / Google Maps)
  const handleGroundingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    setSearchResult(null);
    setSearchSources([]);

    try {
      const res = await fetch('/api/gemini/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, mode: searchMode })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data.text);
        setSearchSources(data.sources || []);
        onSetSystemAlert(`Grounding insights loaded using model gemini-3.5-flash with Google ${searchMode === 'maps' ? 'Maps' : 'Search'}.`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      onSetSystemAlert(`Grounding Error: ${err.message}`);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Start browser audio recording
  const startRecording = async () => {
    setAudioTranscription('');
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendAudioToTranscribe(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks to release microphone lock
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onSetSystemAlert("Microphone capture active... Speak now to transcribe.");
    } catch (err: any) {
      onSetSystemAlert(`Audio Capture Failed: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToTranscribe = async (base64Audio: string) => {
    setLoadingTranscription(true);
    try {
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, mimeType: 'audio/webm' })
      });
      const data = await res.json();
      if (res.ok) {
        setAudioTranscription(data.text);
        setSearchQuery(data.text); // Populate into Search Input
        onSetSystemAlert(`Audio securely transcribed: "${data.text}"`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      onSetSystemAlert(`Transcription failed: ${err.message}`);
    } finally {
      setLoadingTranscription(false);
    }
  };

  // GAN Synthesis Ingestion
  const handleGanGenerate = async () => {
    if (!authedUser) {
      onSetSystemAlert("Authentication required. Please log in to your secure directory workspace tab first.");
      return;
    }
    setGeneratingGan(true);
    setGanSuccessFile(null);
    onSetSystemAlert("Emulating edge synthetic generator with gemini-3.1-flash-image...");

    try {
      // Get auth token from local storage
      const token = localStorage.getItem('q_auth_token');
      const res = await fetch('/api/gemini/generate-gan-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: ganPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setGanSuccessFile(data.filename);
        onNewImageGenerated(); // trigger dashboard file list refresh
        onSetSystemAlert("Success! Synthetic training frame saved to your private directory ./data/uploads/");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      onSetSystemAlert(`GAN Synthesis Error: ${err.message}`);
    } finally {
      setGeneratingGan(false);
    }
  };

  // Video Content Audit Analyzer
  const handleVideoAnalyze = async () => {
    setAnalyzingVideo(true);
    setVideoReport(null);
    onSetSystemAlert(`Parsing video streams for: '${selectedVideo}' using gemini-3.1-pro-preview...`);

    try {
      const res = await fetch('/api/gemini/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetName: selectedVideo })
      });
      const data = await res.json();
      if (res.ok) {
        setVideoReport(data.analysis);
        onSetSystemAlert("Video anomaly audit analysis successfully generated.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      onSetSystemAlert(`Video Analysis Error: ${err.message}`);
    } finally {
      setAnalyzingVideo(false);
    }
  };

  return (
    <div id="ai-grounding-assistant-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Gemini Multimodal AI & Grounding Suite
          </h2>
          <p className="text-[11px] text-slate-400">
            Harness real-time Google Grounding, high-precision video audit, and synthetic GAN generative models.
          </p>
        </div>
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveTab('grounding')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${activeTab === 'grounding' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Grounding
          </button>
          <button 
            onClick={() => setActiveTab('voice')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Voice Mic
          </button>
          <button 
            onClick={() => setActiveTab('gan')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${activeTab === 'gan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            GAN Synthesizer
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${activeTab === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Video Audit
          </button>
        </div>
      </div>

      {/* Tab Content 1: Grounding Search */}
      {activeTab === 'grounding' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Live Real-time Search Grounding
              </span>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSearchMode('search')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${searchMode === 'search' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Web Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('maps')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${searchMode === 'maps' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                >
                  Google Maps
                </button>
              </div>
            </div>

            <form onSubmit={handleGroundingSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchMode === 'maps' ? "e.g., NVIDIA L4 edge data centers in California" : "e.g., standard quantization bits error rates for FP16 vs INT8 in 2026"}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loadingSearch}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                {loadingSearch ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>{searchMode === 'maps' ? "Map" : "Search"}</span>
              </button>
            </form>
          </div>

          {/* Results display */}
          {searchResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-850 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Grounded Report Generated (gemini-3.5-flash)
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Live API Grounding Active
                </span>
              </div>
              
              <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {searchResult}
              </p>

              {searchSources.length > 0 && (
                <div className="pt-2 border-t border-slate-850">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Citations & Grounded Sources</span>
                  <div className="flex flex-wrap gap-2">
                    {searchSources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded flex items-center gap-1 hover:border-indigo-500/30 transition-all"
                      >
                        <Globe className="h-2.5 w-2.5" />
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Voice Mic Assistant */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 text-center flex flex-col items-center justify-center py-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-bold">
                Voice Query Transcription Engine
              </span>
              <p className="text-[11px] text-slate-400">
                Click microphone, speak federated queries, and Gemini 3.5-flash will translate voice into searchable text.
              </p>
            </div>

            <div className="relative">
              {isRecording && (
                <div className="absolute -inset-2.5 bg-teal-500/20 rounded-full animate-ping" />
              )}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-14 w-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${isRecording ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'}`}
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              {isRecording ? "Capturing real-time audio input..." : "Click to activate vocal sensor"}
            </span>

            {loadingTranscription && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Streaming speech bytes to Gemini API transcriber...</span>
              </div>
            )}

            {audioTranscription && (
              <div className="w-full text-left bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Transcribed Text Speech Output</span>
                <p className="text-xs font-mono text-teal-300 font-bold">
                  "{audioTranscription}"
                </p>
                <button
                  onClick={() => {
                    setSearchQuery(audioTranscription);
                    setActiveTab('grounding');
                    handleGroundingSubmit();
                  }}
                  className="text-[9px] font-mono bg-teal-950/40 hover:bg-teal-900/40 border border-teal-900/40 text-teal-400 px-2 py-1 rounded cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Navigation className="h-3 w-3" />
                  Feed directly into Google Grounding Search
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 3: GAN Synthetic Generator */}
      {activeTab === 'gan' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                Edge GAN Synthetic Frame Synthesis
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Model: gemini-3.1-flash-image
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Synthetic Prompt Generation Input</label>
                <textarea
                  value={ganPrompt}
                  onChange={(e) => setGanPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
                  placeholder="Describe edge hardware image to synthesize"
                />
              </div>

              <button
                type="button"
                onClick={handleGanGenerate}
                disabled={generatingGan}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generatingGan ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                <span>{generatingGan ? "Synthesizing Image Pattern..." : "Ingest Synthetic GAN Frame to Private Folder"}</span>
              </button>
            </div>
          </div>

          {ganSuccessFile && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">Synthesis Saved Successfully!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Written: <strong className="text-white">./data/uploads/{authedUser}/{ganSuccessFile}</strong></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Video Content Audit */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Video className="h-3.5 w-3.5 text-teal-400" />
                Automated Video Stream Audit Anomaly Classifier
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Model: gemini-3.1-pro-preview
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Target Video Stream Preset</label>
                <div className="space-y-1.5">
                  {VIDEO_PRESETS.map((vid) => (
                    <button
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid.name)}
                      className={`w-full text-left p-2 rounded-lg border text-xs font-mono flex justify-between items-center cursor-pointer transition-all ${selectedVideo === vid.name ? 'bg-indigo-950/30 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <span className="font-bold truncate max-w-[170px]">{vid.name}</span>
                      <span className="text-[9px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                        {vid.duration}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-center flex flex-col justify-center items-center space-y-2">
                <Video className="h-6 w-6 text-indigo-400 animate-pulse" />
                <h4 className="text-[11px] font-mono font-bold text-slate-200">Active Camera Feed Feed Ready</h4>
                <p className="text-[9.5px] text-slate-500 max-w-[200px]">
                  Gemini Pro will review the complete timeline to identify microscopic fractures and grid loss.
                </p>
                <button
                  type="button"
                  onClick={handleVideoAnalyze}
                  disabled={analyzingVideo}
                  className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  {analyzingVideo ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  <span>{analyzingVideo ? "Reviewing Timeline..." : "Run Video Audit"}</span>
                </button>
              </div>
            </div>
          </div>

          {videoReport && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                Gemini Pro Temporal Video Audit report:
              </span>
              <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {videoReport}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
