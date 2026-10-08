# Quantizer.ai

AI-native federated learning dashboard for designing, monitoring, and optimizing quantized edge intelligence pipelines.

Quantizer.ai is a full-stack web platform that simulates a multi-node distributed AI infrastructure where you can orchestrate edge devices, analyze model compression tradeoffs, inspect performance telemetry, and use Gemini-powered assistants to ground decisions in live technical context.

## Why this project exists

Modern edge AI systems need more than a training loop. They need operational visibility, hardware-aware optimization, and actionable guidance across:

- federated learning node health
- model quantization tradeoffs
- communication and privacy constraints
- real-time analytics for accuracy and efficiency
- AI-assisted debugging and recommendation

This project brings those concerns into a single interactive workspace.

## Core capabilities

### 1. Federated node operations
- Visualize edge devices on an orbital dashboard
- Filter nodes by online, idle, and offline states
- Register simulated hardware such as Jetson, Raspberry Pi, and accelerator-based devices
- Inspect quantization targets like INT8, FP16, and INT4

### 2. AI-powered analysis
- Ground technical decisions with Gemini-based live search and map lookups
- Capture voice input from the browser for conversational prompts
- Use image synthesis and audit workflows for synthetic inspection data
- Review reasoning-driven optimization guidance in a high-thinking mode

### 3. Quantization and pipeline intelligence
- Tune learning rate, noise multiplier, and communication sparsification controls
- Simulate training epochs and observe downstream accuracy trends
- Explore how compression impacts latency, robustness, and downstream performance
- Track metrics from model optimization in a visual dashboard

### 4. Full-stack app experience
- React frontend with animated data panels and dashboards
- Express backend for API orchestration and model integration
- Firebase configuration support for app services and persistence
- Vite-based development workflow with TypeScript-first code structure

## Tech stack

- Frontend: React, Vite, TypeScript, CSS
- Backend: Node.js, Express, TypeScript
- AI integration: Google Gemini via @google/genai
- Data/runtime: Firebase, dotenv
- Build tools: Vite, esbuild, TypeScript

## Project structure

```text
quantizer.ai/
├── index.html
├── package.json
├── package-lock.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── firebase-applet-config.json
├── metadata.json
├── src/
│   ├── App.tsx
│   ├── firebase.ts
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   └── components/
│       ├── AiAdvisorPanel.tsx
│       ├── AiGroundingAssistant.tsx
│       ├── DashboardStats.tsx
│       ├── DataFeedManager.tsx
│       ├── FederatedNodeMap.tsx
│       ├── GanCnnPipelineVisualizer.tsx
│       ├── MetricsChart.tsx
│       └── ModelQuantizationPanel.tsx
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Google Gemini API key

Create a `.env` file at the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

This starts the app with the Express backend and Vite frontend in a single development workflow.

### Production build

```bash
npm run build
npm run start
```

## Important scripts

```json
{
  "dev": "tsx server.ts",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs",
  "lint": "tsc --noEmit"
}
```

## Example use cases

- Explore a federated AI deployment across edge nodes
- Tune model compression strategies before production rollout
- Use AI guidance to compare quantization choices across workloads
- Monitor how bandwidth and privacy constraints change optimization decisions
- Audit distributed model performance with visual analytics

## Notes

This repository is designed as a simulation and product-style dashboard rather than a production deployment package. It is ideal for experimentation, prototype demos, and AI-assisted optimization workflows.

## License

This project does not currently declare a license in the repository metadata. If you plan to reuse or distribute it, add an appropriate open-source license before publishing.

## Acknowledgements

Built for research and experimentation around:

- federated learning
- edge AI optimization
- model quantization
- AI-assisted systems design

---

Quantizer.ai blends distributed systems thinking with interactive AI tooling to help teams reason about the operational realities of modern edge intelligence.
