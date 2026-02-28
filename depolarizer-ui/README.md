# Depolarizer UI (Bridge)

Original Bridge UI wired to the Depolarizer backend.

## Setup

1. **Start the depolarizer backend** (in project root):

   ```bash
   cd /path/to/BullHacks
   python depolarizer/server.py
   ```

   Server runs on http://localhost:5042

2. **Install and run the UI**:

   ```bash
   cd depolarizer-ui
   npm install
   cp .env.local.example .env.local  # optional, defaults to localhost:5042
   npm run dev
   ```

   UI runs on http://localhost:3000

3. Open http://localhost:3000 and complete the quiz (10 political Q&A + stance MCQ + city).

## Flow

- **Onboarding** → 10 political text questions + Q11 stance MCQ + city
- **Dashboard** → Top match (75%+ similar, different political stance)
- **Matches** → All depolarizer matches
- **Match profile** → Detail view + Start Chat
