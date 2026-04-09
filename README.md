# SpeakStar — AI English Tutor

An AI-powered English conversation practice assistant built with **Next.js**, featuring voice input/output, a casual AI companion persona, and spontaneous real-world English challenges woven naturally into conversation.

## Features

- **Voice Conversation** — Speak in English (or Chinese) and get a spoken English reply via Web Speech API
- **Text Input** — Type messages as a fallback (required in mainland China where Google speech services are blocked)
- **Bilingual Understanding** — Alex understands Chinese input and always replies in natural English
- **Casual AI Persona** — "Alex", a 25-year-old Californian living in Shanghai, chats like a real friend — not a tutor
- **Spontaneous English Challenges** — Alex naturally drops real-world scenarios into conversation to help you practice (e.g., "how would you describe that in English?") and corrects mistakes implicitly
- **Responsive UI** — Desktop two-column layout + mobile full-screen voice-first layout
- **Hermès Orange × Dark Gray** design theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| AI API | Moonshot AI (Kimi) — `api.moonshot.cn` |
| Speech Input | Web Speech API (`SpeechRecognition`) |
| Speech Output | Web Speech API (`SpeechSynthesis`) |
| State | Zustand |
| Styling | Tailwind CSS |
| Icons | Lucide React |

## Getting Started on a New Machine

### 1. Prerequisites

Make sure you have **Node.js 18+** installed. You can check with:

```bash
node -v
```

If not installed, download it from [nodejs.org](https://nodejs.org).

### 2. Clone the repository

```bash
git clone https://github.com/Chatblanccc/AI-English-Tutor.git
cd AI-English-Tutor
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
# On macOS / Linux
cp .env.example .env.local

# On Windows (PowerShell)
Copy-Item .env.example .env.local
```

Then open `.env.local` and fill in your API key:

```env
KIMI_API_KEY=your_moonshot_api_key_here
KIMI_API_URL=https://api.moonshot.cn/v1
```

> **Where to get a Kimi API key:** Sign up at [platform.moonshot.cn](https://platform.moonshot.cn), then go to API Keys to create one.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app is ready.

### 6. Build for production (optional)

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/chat/route.ts     # AI chat API endpoint (Kimi streaming)
│   ├── layout.tsx            # Root layout with fonts
│   └── page.tsx              # Entry page
├── components/
│   └── VoiceInterface.tsx    # Main UI component (voice + text)
├── hooks/
│   ├── useSpeechToText.ts    # Web Speech API — recognition
│   └── useTextToSpeech.ts    # Web Speech API — synthesis
├── store/
│   └── useChatStore.ts       # Zustand global state
├── types/
│   └── index.ts              # TypeScript types
└── .env.local                # ← create this yourself (not committed)
```

## Notes

- **Voice recognition requires Google services** — in mainland China, the mic button may return a `network` error. Use the keyboard button to type instead.
- **Browser support** — Chrome and Edge are recommended for the best Web Speech API experience. Safari has limited support.
- The AI reply is always in English regardless of input language.

## License

MIT

❤❤❤
