# Federated Quantized GAN-CNN Edge Platform

An advanced, full-stack simulation and management dashboard for decentralized federated learning pipelines. This platform enables real-time tuning, auditing, and visualization of edge node systems training locally and contributing quantized parameters to a central server, backed by Differential Privacy guarantees and high-reasoning Gemini AI models.

---

## 🌟 Key Features

### 1. Federated Node Registry & Orbital Map
- **Orbital Spatial Telemetry**: Interactive, animated radar-style coordinate system showcasing edge nodes orbiting the central aggregation server.
- **Dynamic Filter Controls**: Real-time filter system to instantly isolate edge nodes by status (`All`, `Online`, `Idle`, or `Offline`).
- **Edge Node Ingestion**: Instantly register new devices (e.g., *NVIDIA Jetson AGX*, *Raspberry Pi 5*) with designated hardware quantization targets (INT8, FP16, INT4).

### 2. Gemini Multimodal AI & Grounding Suite
- **Live Search Grounding**: Real-time web lookup or Google Maps grounding using `gemini-3.5-flash` to pull authoritative technical references and coordinates directly.
- **Vocal Speech Capture**: Dynamic browser microphone capture and streaming transcription for speech-to-text queries.
- **Edge GAN Synthesizer**: Generates high-fidelity simulated hardware scan imagery using `gemini-3.1-flash-image` and writes the outputs directly to user-isolated persistent directories.
- **Video Stream Audit**: Time-series conveyor/drone video stream audits and anomaly classification using `gemini-3.1-pro-preview`.

### 3. High Thinking Mode Advisor
- **Deep Reasoning Engine**: Activates `gemini-3.1-pro-preview` with **High Thinking Level** (`ThinkingLevel.HIGH`) to solve hyper-complex optimization challenges in federated systems.
- **JSON Structured Auditing**: Automatically parses system configurations, active node weights, and learning rate schedules to return optimized hyperparameter guidelines.

### 4. GAN-CNN Quantization & Pipeline Visualizer
- **Interactive Training Dashboard**: Simulates localized gradient steps, aggregation cycles, and accuracy metrics over multiple training epochs.
- **Compression & Sparsification**: Custom sliders for active learning rate ($\eta$), noise multipliers ($\sigma$) for Differential Privacy, and communication sparsification budgets.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Express, Node.js, TypeScript, ESBuild.
- **AI/ML Engine**: Official Google `@google/genai` TypeScript SDK utilizing `gemini-3.5-flash` and `gemini-3.1-pro-preview` models.
- **Data Isolation**: Structured client workspace uploads stored under `./data/uploads/` partitioned by local auth sessions.

---

## 🚀 Getting Started

### 1. Prerequisites
Define your server-side API keys in a `.env` file at the root of your project:
```env
# .env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Installation
Install all backend and client-side dependencies:
```bash
npm install
```

### 3. Running the App
Start the unified full-stack dev server (Express + Vite) on port `3000`:
```bash
npm run dev
```

### 4. Build & Production Start
Compile both client static assets and the server-side entry point, and execute the production server:
```bash
npm run build
npm run start
```

---

## 📂 File Architecture

- `/server.ts` - Express backend with custom API routes, Vite middleware configurations, and Gemini integrations.
- `/src/App.tsx` - Root application dashboard with tab navigation, telemetry banners, and central state coordinators.
- `/src/components/` - Highly modular interactive UI components:
  - `FederatedNodeMap.tsx` - Orbital visualization panel with live node filtering.
  - `AiGroundingAssistant.tsx` - Tabbed multimodal suite for grounding, voice, video, and image synthesis.
  - `AiAdvisorPanel.tsx` - Advisor report card matching High Thinking Gemini audits.
  - `GanCnnPipelineVisualizer.tsx` - Continuous canvas training loop charts.
  - `ModelQuantizationPanel.tsx` - Sparsification slider panels.
- `/src/types.ts` - Standardized TypeScript type systems, states, and telemetry interfaces.
