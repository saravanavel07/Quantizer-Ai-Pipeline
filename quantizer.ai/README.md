# Quantizer.ai

A professional AI-powered federated learning and model optimization platform for designing, monitoring, and improving quantized edge intelligence systems.

## Featured Components

These are the core UI and intelligence modules that drive the experience of Quantizer.ai:

- AI Advisor Panel — intelligent optimization guidance and AI-driven recommendations
- AI Grounding Assistant — grounded technical reasoning and decision support
- Federated Node Map — distributed edge-device visualization across the network
- Model Quantization Panel — compression strategy tuning and tradeoff analysis
- Metrics Chart — live performance, accuracy, and efficiency analytics
- Dashboard Stats — summary metrics for system health and operational insights
- Data Feed Manager — data stream orchestration and monitoring
- GAN/CNN Pipeline Visualizer — model pipeline and architecture visualization

Quantizer.ai is a full-stack web application that simulates a distributed AI infrastructure across edge devices, model quantization workflows, and operational decision-making. It is designed to help researchers, engineers, and AI teams evaluate how compression strategies, bandwidth constraints, and privacy-aware training decisions affect performance in real-world edge deployments.

## Overview

Modern edge AI systems are not just about model accuracy—they also depend on:

- device health and uptime across distributed nodes
- communication constraints and data privacy tradeoffs
- hardware-aware model compression
- latency and performance optimization
- real-time monitoring and intelligent recommendations

Quantizer.ai brings these concerns into one interactive dashboard, allowing users to explore how AI workloads behave under real operational constraints.

## Key Features

### 1. Federated learning simulation
- Visualize edge devices and node states in a distributed environment
- Monitor online, idle, and offline devices
- Simulate multi-node AI orchestration and infrastructure behavior
- Customize hardware and inference profiles for edge deployment scenarios

### 2. Quantization analysis
- Compare model compression strategies such as INT8, FP16, and INT4
- Evaluate tradeoffs between accuracy, efficiency, and latency
- Understand how quantization changes model robustness and performance
- Tune parameters for real-world optimization planning

### 3. AI-assisted guidance
- Integrate Gemini-powered AI reasoning for intelligent recommendations
- Use voice-enabled browser input for conversational interactions
- Explore synthetic inspection workflows and AI-based analysis support
- Review optimization guidance in a decision-support dashboard

### 4. Full-stack product experience
- React-based user interface with animated visual analytics
- Express server for backend orchestration and API integration
- Firebase-ready configuration for app services and data handling
- TypeScript-first development workflow for maintainability and scalability

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- CSS / Tailwind-style styling
- Lucide icons and motion-driven UI components

### Backend
- Node.js
- Express
- TypeScript

### AI & Data Services
- Google Gemini via @google/genai
- Firebase
- dotenv for environment configuration

### Tooling
- Vite
- esbuild
- TypeScript compiler
- npm package management

## Architecture

The application follows a practical product-style architecture:

- Frontend UI for monitoring and interactions
- Backend API layer for orchestration and data processing
- AI service integration for recommendations and analysis
- Firebase configuration for app integration and persistence options
- TypeScript-based development system to keep the project structured and scalable

## Project Structure

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

## Getting Started

### Prerequisites

Before running the project, ensure you have:

- Node.js 18 or later
- npm
- A Google Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/saravanavel07/Quantizer-Ai-Pipeline.git
cd Quantizer-Ai-Pipeline/quantizer.ai
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the app locally

```bash
npm run dev
```

This starts the development environment for the application.

### Production build

```bash
npm run build
npm run start
```

## Available Scripts

```json
{
  "dev": "tsx server.ts",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs",
  "clean": "rm -rf dist server.js",
  "lint": "tsc --noEmit"
}
```

## Tools and Skills Used

This project was built using a modern AI-assisted development workflow and a strong stack of engineering skills.

### Development tools
- GitHub for repository management and version control
- VS Code for application development
- GitHub Copilot for AI-assisted coding and productivity support
- npm for dependency and script management

### Skills applied
- Full-stack web development
- React application architecture
- TypeScript development
- Node.js and Express backend integration
- API integration with Gemini AI
- Firebase configuration and app services setup
- UI/UX dashboard design for operational analytics
- Model optimization and quantization analysis concepts
- Prompt engineering and AI-assisted workflow design
- Product-style dashboard implementation and simulation logic

### AI workflow used
- AI-assisted code generation and refactoring
- Architecture brainstorming and feature planning
- Debugging support and implementation validation
- Rapid prototyping for an intelligent dashboard experience

## Use Cases

- Explore distributed AI deployment patterns across edge devices
- Compare quantization strategies before real-world production rollout
- Analyze efficiency, accuracy, and latency tradeoffs in model design
- Use AI-powered recommendations to guide optimization decisions
- Present operational dashboards for federated or edge intelligence systems

## Future Enhancements

Potential next steps for the project include:

- richer real-time analytics and metrics visualizations
- more advanced federated training simulation controls
- improved AI recommendation models and explainability
- expanded device and deployment configuration scenarios
- deployment support for production hosting and CI/CD

## License

This repository does not currently declare an open-source license in its project metadata. If you plan to reuse or distribute this project publicly, it is recommended to add a suitable license before publishing.

## Acknowledgements

This project was created to explore the intersection of:

- federated learning
- edge AI systems
- model quantization
- AI-assisted system design
- intelligent monitoring and decision support

Quantizer.ai demonstrates how modern AI tooling and product thinking can be combined to design smarter, more operationally aware edge intelligence systems.

---

Built with a professional AI-assisted development workflow to support research, experimentation, and practical system design in edge AI optimization.
