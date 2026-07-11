import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, ShieldAlert, Cpu, CheckSquare, MessageSquare, RefreshCw, ChevronRight } from 'lucide-react';
import { PipelineConfig, FederatedNode, AdvisorRecommendation } from '../types';

interface AiAdvisorPanelProps {
  config: PipelineConfig;
  nodes: FederatedNode[];
  onApplySuggestedStep: (action: string) => void;
  isSimulating: boolean;
}

export default function AiAdvisorPanel({
  config,
  nodes,
  onApplySuggestedStep,
  isSimulating,
}: AiAdvisorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AdvisorRecommendation | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(true);
  const [aiChatLogs, setAiChatLogs] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: "I am your Quantizer.AI federated pipeline optimization assistant. Tap 'Refresh System Audit' or ask me a custom question, such as 'How can I prevent generator collapse when quantizing to INT4?'."
    }
  ]);

  // Execute server-side Gemini evaluation
  const fetchAdvisorEvaluation = async () => {
    setLoading(true);
    try {
      const endpoint = isThinkingMode ? '/api/advisor/deep-evaluate' : '/api/advisor/evaluate';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, nodes }),
      });
      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error("Failed to fetch advisor report:", error);
      // Fallback metrics
      setRecommendation({
        summary: "Unable to secure a connection to the Gemini API server. Review your local secrets setup or proceed with local heuristic audits.",
        nodesScore: 82,
        quantizationAnalysis: "INT8 reduces weight storage footprints by 75% with minor accuracy degradation. Apply symmetric scale factors to minimize rounding noise.",
        ganStabilityIndex: 70,
        differentialPrivacyReport: `DP multiplier is at ${config.noiseMultiplier}. This safeguards local node gradients during parameter exchanges but may restrict CNN convergence.`,
        suggestedSteps: [
          "Swap CNN backbone to MobileNet-V3 for extra edge acceleration.",
          "Add 3 more edge nodes to smooth gradient aggregation gradients.",
          "Scale learning rate down to 0.001 to prevent weights blowups."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when dependencies mount or config changes drastically
  useEffect(() => {
    fetchAdvisorEvaluation();
  }, [config.activeQuantization, config.aggregationStrategy, nodes.length, isThinkingMode]);

  // Handle custom question submits
  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;

    const userText = customQuestion;
    setAiChatLogs(prev => [...prev, { sender: 'user', text: userText }]);
    setCustomQuestion('');
    setLoading(true);

    try {
      // Prompt construction for conversational advice
      const userPrompt = `
Context:
Active task: ${config.targetTask}
Quantization setting: ${config.activeQuantization}
Aggregation strategy: ${config.aggregationStrategy}
CNN model: ${config.cnnModel}
Nodes: ${nodes.length} online.

Question: ${userText}

Provide a short (max 3-sentence) highly technical, concise advice. Do not use markdown headers, just plain text.`;

      const response = await fetch('/api/advisor/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...config, targetTask: userPrompt }, // pass prompt in target task for analysis simplicity
          nodes
        })
      });

      const data = await response.json();
      // If summary is available, push it as conversational response
      const answer = data.summary || "I processed your pipeline state. Make sure to optimize calibration scales to avoid weights divergence.";
      setAiChatLogs(prev => [...prev, { sender: 'assistant', text: answer }]);

    } catch (err) {
      setAiChatLogs(prev => [...prev, { sender: 'assistant', text: "Error contacting the server. Try ensuring your GEMINI_API_KEY is configured." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Gemini AI Federated Optimization Advisor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time server-side Gemini auditing of model convergence, quantization scales, and privacy guarantees.
          </p>
        </div>
        <button
          id="btn-refresh-audit"
          onClick={fetchAdvisorEvaluation}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Run Audit"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Scores & recommendations */}
        <div className="lg:col-span-7 space-y-4">
          {recommendation ? (
            <>
              {/* Score widgets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Topology Score</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{recommendation.nodesScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${recommendation.nodesScore}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-mono">Decentralized network balance, node bandwidth & latency limits.</p>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">GAN Stability Index</span>
                    <span className={`text-xs font-bold font-mono ${recommendation.ganStabilityIndex > 60 ? 'text-indigo-400' : 'text-amber-500 animate-pulse'}`}>
                      {recommendation.ganStabilityIndex}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${recommendation.ganStabilityIndex}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-mono">Estimation of adversarial convergence under bit compression.</p>
                </div>
              </div>

              {/* Summary narrative */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed space-y-3">
                <p>
                  <strong className="text-white font-display flex items-center gap-1.5">
                    <BrainCircuit className="h-4 w-4 text-indigo-400 shrink-0" />
                    Neural Auditor Summary
                  </strong>
                  {recommendation.summary}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-900 text-[11px]">
                  <div>
                    <h4 className="font-bold text-indigo-300 font-display mb-1">Quantization Audit:</h4>
                    <p className="text-slate-400 leading-normal font-mono text-[10px]">{recommendation.quantizationAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-300 font-display mb-1">Privacy & Security:</h4>
                    <p className="text-slate-400 leading-normal font-mono text-[10px]">{recommendation.differentialPrivacyReport}</p>
                  </div>
                </div>
              </div>

              {/* Clickable AI Recommendations */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 font-display">
                  Apply Recommended Optimization Action Items:
                </h3>
                <div className="space-y-2">
                  {recommendation.suggestedSteps.map((step, i) => (
                    <button
                      id={`apply-recommendation-step-${i}`}
                      key={i}
                      onClick={() => onApplySuggestedStep(step)}
                      className="w-full text-left text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/55 p-3 rounded-xl flex items-center justify-between group transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-4 w-4 text-indigo-400 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-300 group-hover:text-white font-mono text-[11px]">{step}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[260px] bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-xs text-slate-500 font-mono">Running federated systems analysis...</span>
            </div>
          )}
        </div>

        {/* Right pane: Conversational AI advisor console */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between h-[410px]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 font-display flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Weights & Aggregation Debugger
            </h3>

            {/* Chat list */}
            <div className="space-y-3 h-[290px] overflow-y-auto pr-1">
              {aiChatLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                    log.sender === 'user'
                      ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 ml-auto'
                      : 'bg-slate-900 text-slate-300 border border-slate-850 mr-auto'
                  }`}
                >
                  {log.text}
                </div>
              ))}
              {loading && (
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-xs text-slate-500 font-mono animate-pulse mr-auto">
                  Thinking...
                </div>
              )}
            </div>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2 mt-4 border-t border-slate-900 pt-3">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Ask: 'How to stabilize INT4 GANs?'"
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono placeholder-slate-600"
            />
            <button
              id="btn-submit-advisor-q"
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
