# PromptPilot | Project Architecture & Component Guide

PromptPilot is a high-performance **Autonomous AI Orchestrator** designed to route user missions to the most effective global intelligence platforms.

## 1. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19, ShadCN UI, Tailwind CSS
- **AI Engine**: Genkit 1.x (Google Generative AI)
- **Backend**: Firebase (Firestore, Authentication, App Hosting)
- **Icons**: Lucide-React

## 2. Core Intelligence (The Brain)

### The Orchestrator Model
The "Brain" of this application is **Gemini 2.5 Flash**. It is configured in `src/ai/genkit.ts`. This model was chosen for its high-speed reasoning and deep understanding of other AI models' capabilities.

### Agentic Routing Logic
Routing is not hardcoded. It happens dynamically in `src/ai/flows/analyze-task-and-generate-prompt.ts`:
1. **Fleet Knowledge**: The app imports the "Fleet" (supported AIs) from `src/lib/ai-data.ts`.
2. **Analysis**: Gemini 2.5 Flash reads your mission and compares it against the descriptions and categories of the Fleet.
3. **Selection**: It identifies the target model (e.g., "This mission requires high artistic fidelity, routing to Midjourney").
4. **Engineering**: It then acts as an expert engineer to write a prompt specific to that target's syntax and parameters.

## 3. Component Map

### A. Intelligence Units (Server-Side)
Located in `src/ai/flows/`:
- **`analyze-task-and-generate-prompt.ts`**: The primary router. Handles the fleet selection and prompt engineering.
- **`refine-prompt-flow.ts`**: Handles iteration logic when users provide feedback.
- **`execute-with-gemma.ts`**: A secondary fast-execution engine for quick text-based responses.

### B. The Frontend (Tabbed Interface)
Located in `src/components/prompt-pilot/`:
- **`HomeTab.tsx`**: The Mission Control Center. Users describe objectives here. It coordinates the routing animation and result display.
- **`HistoryTab.tsx`**: A real-time log of every mission, synced via Firebase.
- **`DirectoryTab.tsx`**: The encyclopedia of the "Fleet." It lists capabilities and allows users to suggest new models.
- **`SettingsTab.tsx`**: User profile management and privacy controls (e.g., Wipe History).

### C. Data & State
- **`src/lib/ai-data.ts`**: The source of truth for all supported AIs. Update this file to add new models to the orchestrator's knowledge.
- **`src/firebase/non-blocking-updates.tsx`**: A specific pattern that ensures the app feels "instant" by not awaiting database writes before updating the UI.

## 4. How the Mission Workflow Works
1. **Input**: User describes a goal in `HomeTab`.
2. **Routing**: The orchestrator selects the best AI (e.g., Midjourney for images, Mistral for code).
3. **Engineering**: The orchestrator writes the perfect prompt for that specific AI.
4. **Delivery**: The user receives a tactical briefing and the prompt.
5. **Manual Execution**: The user copies the prompt and clicks "Launch" to use it in the target AI's actual interface.

## 5. UI & Styling
- **Theme**: Deep navy background with cyan/blue glow effects (`globals.css`).
- **Glassmorphism**: Components use a custom `.glass-panel` class for a translucent, high-tech look.
- **Legibility**: Inputs are locked to pure white text with `!important` rules to ensure visibility against the dark background.