# Hearth 🔥

> *You don't have to go through this alone.*

Hearth is a front-end emotional support group matching application. It connects people going through similar difficulties — grief, depression, addiction recovery, anxiety, loneliness, and more — into small (4–6 person), safety-first guided group chat rooms.

## Features

- **Conversational Check-in** — A 5-question, typed-response emotional assessment
- **Safety-first Matching** — Algorithm balances distress levels, never groups all high-distress users together
- **Room Onboarding** — Gentle guidelines and a grounding prompt before entering a room
- **4-Phase Guided Chat** — Arrival → Sharing → Reflection → Close, with phase timers and turn-taking nudges
- **Crisis Safety Scanner** — Detects self-harm language and shows resources inline before the message is sent
- **Advice Mode Toggle** — Off by default; signaled to other members when enabled
- **Private Journal** — Between-session reflections stored locally
- **Moderation Dashboard** — Admin view of flagged crisis events with action buttons

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, fully client-side)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI Slider](https://www.radix-ui.com/)
- [Lucide React](https://lucide.dev/)

All data is stored in `localStorage` — no backend, no database, no accounts required.

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── checkin/              # Emotional check-in (typed responses)
│   ├── matching/             # Matching loading screen
│   ├── room/[id]/
│   │   ├── page.tsx          # Group chat room (4-phase flow)
│   │   └── onboarding/       # 30-second soft landing
│   ├── profile/              # User identity + bookmarks
│   ├── journal/              # Private journaling
│   └── admin/                # Moderation dashboard
├── components/
│   └── CrisisBanner.tsx      # Inline crisis resources component
└── lib/
    ├── matching.ts           # Safety-first matching algorithm
    ├── safety.ts             # Crisis keyword scanner
    └── phases.ts             # Chat phase state machine
```

## Safety Disclaimer

Hearth is a peer support tool and **does not replace professional therapy or crisis services**.

- **Crisis line:** Call or text **988** (Suicide & Crisis Lifeline)
- **Crisis Text Line:** Text **HOME** to **741741**
- **Emergency:** Call **911**
