<div align="center">

# ⚙️ Quantizer.ai

<a href="https://readme-typing-svg.demolab.com"><img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=28&pause=1000&color=7C5CFC&center=true&vCenter=true&width=900&lines=Explore+the+edge+AI+pipeline.;Model+compression+meets+federated+simulation.;Measure.+Optimize.+Understand." alt="Animated Quantizer.ai tagline" /></a>

**An interactive dashboard for exploring federated edge-AI workflows, model quantization, and operational trade-offs.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-99.6%25-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 99.6%" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8A2BE2?style=for-the-badge&logo=googlegemini" alt="Google Gemini AI" />
</p>

</div>

---

## Overview

Quantizer.ai is a full-stack TypeScript application that brings edge-device monitoring, quantization controls, AI-assisted analysis, and model-pipeline visualization into one interactive workspace. It is designed for experimentation and decision support: training rounds and some inference outputs are simulated, and should not be interpreted as measured production results.

## Highlights

- **Federated node dashboard** — explore distributed node states and simulated orchestration.
- **Quantization controls** — compare FP32, FP16, INT8, and INT4 trade-offs in model size, latency, and accuracy.
- **GAN/CNN pipeline visualization** — inspect an illustrative model workflow and inference outputs.
- **Metrics and telemetry** — view simulated training metrics and save or retrieve round logs.
- **Gemini-powered assistance** — request optimization guidance, grounding, transcription, and image/video analysis when a Gemini API key is configured.
- **Interactive product UI** — motion-driven React components and charts for exploring pipeline configuration.
- **Local image workflows** — upload and manage images through the application’s authenticated API.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide React |
| Backend | Node.js, Express, TypeScript, `tsx` |
| AI integration | Google Gemini through `@google/genai` |
| App services | Firebase SDK |
| Build tooling | Vite, esbuild, TypeScript |

## Architecture

```text
Browser (React + Vite)
  ├─ Federated node map and dashboard metrics
  ├─ Quantization controls and pipeline visualizer
  ├─ AI advisor and grounding assistant
  └─ Image and telemetry workflows
           │ HTTP / JSON
           ▼
Express API (TypeScript)
  ├─ Authentication and user image endpoints
  ├─ Simulation, inference, and telemetry endpoints
  └─ Gemini-backed features (optional)
           │
           ├─ Gemini API, when configured
           └─ Local simulation fallbacks
```

## Getting Started

### Requirements

- Node.js 18 or later
- npm
- A Google Gemini API key for Gemini-powered features (optional; local fallbacks are available for several features)

### Install and run

```bash
git clone https://github.com/saravanavel07/Quantizer-Ai-Pipeline.git
cd Quantizer-Ai-Pipeline/quantizer.ai
npm install
```

Create a `.env` file in `quantizer.ai/`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the development server:

```bash
npm run dev
```

The Express server listens on port **3000**. Open <http://localhost:3000>.

### Production build

```bash
npm run build
npm start
```

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Express server with Vite development middleware |
| `npm run build` | Build the frontend and bundle the server |
| `npm start` | Run the production server from `dist/server.cjs` |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run clean` | Remove generated build output |

## API Overview

The Express server provides endpoints for the following workflows. Some endpoints require a bearer token; Gemini-backed endpoints require `GEMINI_API_KEY` for live AI responses and may use local fallback behavior where implemented.

| Endpoint | Purpose |
|---|---|
| `GET /api/status` | Check application and Gemini configuration status |
| `POST /api/auth/register` | Register an in-memory user session |
| `POST /api/auth/login` | Sign in and receive a bearer token |
| `GET /api/auth/me` | Get the authenticated username |
| `POST /api/simulate-round` | Generate a simulated federated training round |
| `POST /api/process-inference` | Generate pipeline inference output |
| `POST /api/advisor/evaluate` | Request optimization guidance |
| `POST /api/advisor/deep-evaluate` | Request a deeper optimization report |
| `POST /api/telemetry/log` | Save a telemetry round |
| `GET /api/telemetry/logs` | List saved telemetry rounds |
| `POST /api/gemini/grounding` | Request grounded search or map assistance |
| `POST /api/gemini/transcribe` | Transcribe submitted audio |

Additional image, upload, and analysis routes are implemented in `server.ts`.

## Project Structure

```text
Quantizer-Ai-Pipeline/
└── quantizer.ai/
    ├── src/
    │   ├── components/
    │   ├── App.tsx
    │   ├── firebase.ts
    │   ├── main.tsx
    │   ├── index.css
    │   └── types.ts
    ├── index.html
    ├── package.json
    ├── server.ts
    ├── tsconfig.json
    ├── vite.config.ts
    └── README.md
```

The dashboard includes components for the AI advisor, grounding assistant, metrics, data feeds, federated nodes, GAN/CNN pipeline visualization, and quantization controls.

## Engineering Skills Demonstrated

- Full-stack application development with React, TypeScript, Node.js, and Express
- Dashboard and data-visualization UX design
- REST API design and frontend/backend integration
- Third-party generative AI API integration with fallback handling
- Simulation-oriented modeling of quantization and federated-learning concepts
- File handling, telemetry persistence, and environment-based configuration
- TypeScript tooling, Vite development workflows, and esbuild production bundling

## Security and Production Notes

This repository is an experimental application, not a production-ready authentication or federated-training platform. The current server uses in-memory user and token storage and includes hard-coded demo credentials. **Do not deploy it with real user data as-is.** Before production use, replace demo authentication with a secure identity provider, hash and securely store passwords, use robust session/token management, validate and limit uploads, and review all API routes and data-storage behavior.

Simulation metrics, predictions, and fallback outputs are illustrative. Validate any model-performance or privacy claims against real workloads and appropriate testing before making deployment decisions.

## License

No open-source license is declared in the project metadata at the time this README was written. Review the repository’s licensing terms before reusing or distributing the code.

## Acknowledgements

Quantizer.ai explores the intersection of federated learning, edge AI, model quantization, and AI-assisted system design.
