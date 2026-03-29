# Sera | Life, Handled.

Sera is a calm, intelligent operating layer for the administrative overhead of modern life. It is designed to offload the mental burden of "life-admin"—the messy, fragmented, and often draining tasks that keep a household running.

## The Problem
Life-admin is a universal tax on our time and mental energy. From disputing an insurance claim and tracking medical follow-ups to managing school applications and utility renewals, the cognitive load is immense. Most people manage this with a fragile mix of mental notes, scattered emails, and generic "to-do" lists that lack context.

## Who it is for
Sera is built for individuals and families who are "time-poor but responsibility-rich." It is for the primary caregiver managing a household, the busy professional navigating complex personal logistics, and anyone who feels the weight of a never-ending administrative backlog.

## Current Product Surfaces
Sera is currently in its early stages, focusing on the core pillars of life-coordination:

*   **Intelligence Feed (Home)**: A proactive dashboard that surfaces what needs your attention now, from upcoming deadlines to Sera's latest insights.
*   **Ask Sera (Command Center)**: A natural language interface that understands intent. You can describe a complex situation (e.g., "I need to track a dental reimbursement"), and Sera will propose a multi-step plan to resolve it.
*   **Document Intelligence**: A secure repository for the letters and forms that usually sit on the kitchen counter. Sera extracts deadlines, providers, and next steps automatically.
*   **Case Management**: For multi-step life events that don't fit into a simple checkbox—like an insurance claim or a school application. Track every note, document, and status change in one place.
*   **Family Workspace**: A shared environment for households to delegate tasks, sync on appointments, and maintain a single source of truth for family logistics.

## Architecture Overview
Sera is built as a modern, full-stack application designed for real-time coordination and high-trust data handling.

*   **Frontend**: A responsive Single Page Application (SPA) built with **React 19** and **Vite**. We use **Tailwind CSS** for a premium, minimal aesthetic and **Framer Motion** for calm, fluid transitions.
*   **Backend**: A lightweight **Express** server that handles API routing and serves the frontend via Vite middleware in development.
*   **Intelligence Layer**: Powered by **Google Gemini**. We use LLMs for intent parsing in the chat interface and structured data extraction from uploaded documents.
*   **Persistence & Real-time**: **Firebase Firestore** provides the real-time data layer, ensuring that family members stay in sync instantly. **Firebase Authentication** handles secure user identity.

## Tech Stack
*   **Core**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS 4, Lucide React (Icons)
*   **Animation**: Framer Motion / Motion
*   **Database/Auth**: Firebase (Firestore, Auth)
*   **AI**: @google/genai (Gemini 3.1 Flash/Pro)
*   **Utilities**: date-fns, sonner (Toasts), zod (Validation)
*   **Testing**: Vitest

## Setup Instructions

### Prerequisites
- Node.js (v20+)
- A Firebase project
- A Gemini API Key (from Google AI Studio)

### Local Development
1.  **Clone and Install**:
    ```bash
    npm install
    ```
2.  **Environment Configuration**:
    Create a `.env` file based on `.env.example`:
    ```env
    GEMINI_API_KEY=your_key_here
    ```
3.  **Firebase Configuration**:
    Populate `firebase-applet-config.json` with your Firebase project credentials.
4.  **Start the Server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## Testing
To run the test suite:
```bash
npm run test
```

## Environment Variables
*   `GEMINI_API_KEY`: Required for all AI-driven features (intent parsing, document extraction).
*   `APP_URL`: Used for self-referential links and OAuth callbacks (automatically handled in AI Studio).

## Roadmap
- [ ] **Deep Integrations**: Direct sync with Gmail and Google Calendar to capture admin at the source.
- [ ] **Human-in-the-Loop**: Escalation paths for complex tasks that require a human touch (e.g., making a phone call).
- [ ] **Financial Intelligence**: Tracking reimbursements and disputed charges directly through bank feeds.
- [ ] **Sera for Caregivers**: Specialized workflows for managing the lives of elderly parents or dependents.

## Current Limitations
*   **Manual Verification**: While Sera's document extraction is highly accurate, we recommend a quick review of extracted deadlines.
*   **Limited Integrations**: Currently, data must be brought into Sera (via chat or upload). Direct "read" access to external accounts is in development.
*   **Mobile Web**: The experience is responsive but optimized for desktop-grade administration. A native mobile experience is not yet available.

## Product Direction
We believe the future of personal productivity isn't a better "to-do list"—it's an agent that understands the *context* of your life and takes the work off your plate. Sera is moving toward a world where life-admin doesn't just feel managed; it feels handled.

---
*Sera | Built for the modern household.*
