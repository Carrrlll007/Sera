# Sera | Life Handled

Sera is a calm AI life-admin assistant that helps individuals and families manage the messy administrative burden of everyday life.

## The Problem
Life admin is universal, fragmented, and emotionally draining. From healthcare appointments and school forms to insurance claims and utility disputes, the cognitive load of managing a household is a major source of stress.

## The Solution
Sera acts as a personal operating layer between you and these messy systems. It doesn't just remind you; it organizes, executes, and resolves tasks.

## Key Features
- **Ask Sera**: A natural language command center that understands your life context and takes real action.
- **Intelligent Documents**: Upload any letter or form; Sera extracts the deadlines, providers, and next steps.
- **Case Management**: Track multi-step processes like reimbursements or applications from start to finish.
- **Family Coordination**: A shared workspace for households to delegate responsibilities and stay in sync.
- **Proactive Guidance**: Sera nudges you when something has been waiting too long or needs preparation.

## Architecture
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express + Vite Middleware
- **AI**: Google Gemini (Intent parsing, Document extraction)
- **Database**: Firebase Firestore (Real-time sync, secure rules)
- **Auth**: Firebase Authentication (Google Login)

## Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure Firebase in `firebase-applet-config.json`.
4. Set `GEMINI_API_KEY` in your environment.
5. Start development server: `npm run dev`

## Roadmap
- [ ] Deep integration with email and calendars.
- [ ] Human-in-the-loop escalation for complex calls/forms.
- [ ] Advanced marketplace for vetted local support.
- [ ] B2B distribution for employee caregiver benefits.

---
*Sera helps life feel handled.*
