import { ToolLoopAgent, tool, InferAgentUIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const kimi = createOpenAI({
  baseURL: 'https://api.moonshot.cn/v1',
  apiKey: process.env.KIMI_API_KEY ?? '',
});

// ── Tools ──────────────────────────────────────────────────────────────────────

const explainVocabulary = tool({
  description:
    'Look up a word or phrase and return its definition, pronunciation tip, and example sentences. ' +
    'Use this when the user asks about a word, or when you want to highlight an interesting expression from the conversation.',
  inputSchema: z.object({
    word: z.string().describe('The English word or phrase to explain'),
    partOfSpeech: z
      .enum(['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom', 'other'])
      .optional()
      .describe('Grammatical category, if known'),
  }),
  execute: async ({ word, partOfSpeech }) => {
    // Structured vocabulary card returned to the model and displayed in UI
    return {
      word,
      partOfSpeech: partOfSpeech ?? 'word',
      // The model will fill in the explanation itself after seeing this tool result
      note: `Provide a concise definition of "${word}" and 2 natural example sentences at the user's level.`,
    };
  },
});

const correctGrammar = tool({
  description:
    'Flag a grammar or usage mistake and provide a natural correction. ' +
    'Use this to gently correct the user without interrupting the flow of conversation — just like a native speaker friend would.',
  inputSchema: z.object({
    original: z.string().describe("The user's original (incorrect) sentence or phrase"),
    corrected: z.string().describe('The corrected version in natural English'),
    explanation: z
      .string()
      .describe('A short, friendly explanation of why the correction is needed (1 sentence)'),
  }),
  execute: async ({ original, corrected, explanation }) => {
    return { original, corrected, explanation };
  },
});

const issueChallenge = tool({
  description:
    'Issue a spontaneous, fun language challenge. ' +
    'Drop this into conversation naturally when the moment feels right — not every message. ' +
    'Do NOT label it a "challenge" or "exercise" in your spoken reply; just weave it in.',
  inputSchema: z.object({
    type: z
      .enum(['fill-in-blank', 'describe-this', 'translate-to-english', 'use-in-sentence', 'pronunciation'])
      .describe('Type of challenge'),
    prompt: z.string().describe('The challenge prompt shown to the user'),
    hint: z.string().optional().describe('Optional hint if the challenge is hard'),
    targetWord: z.string().optional().describe('The word or phrase being practised'),
  }),
  execute: async ({ type, prompt, hint, targetWord }) => {
    return { type, prompt, hint, targetWord };
  },
});

// ── Agent ──────────────────────────────────────────────────────────────────────

export const tutorAgent = new ToolLoopAgent({
  model: kimi.chat('moonshot-v1-8k'),
  instructions: `You are Alex, a 25-year-old guy from California, living in Shanghai for work. You're voice chatting with a Chinese friend who wants to get better at English — but this is NOT a class. It's just two friends hanging out and talking.

## Who you are
- Chill, funny, genuinely curious about people. A little sarcastic sometimes but always warm.
- You love basketball, street food, random YouTube rabbit holes, bad movies, and people-watching.
- You've lived in Shanghai long enough to get Chinese culture references, but you still find things surprising.
- You talk like a real person: "gonna", "wanna", "kinda", "tbh", "nah", "wait what", "that's actually wild", "dude", "haha", "oh man".

## How you talk
- Keep it SHORT. 1–3 sentences per reply. Voice chat pace, not essay pace.
- Never open with "Great!", "Excellent!", "Of course!", "Certainly!", "That's a great question!" — ever.
- Don't repeat back what they just said.
- Don't always end with a question — sometimes just react, like a real person would.
- If they speak Chinese, understand it and reply in English naturally.
- Never use bullet points, lists, or structured explanations in your spoken reply.

## Using your tools
- Use correctGrammar silently when you spot a mistake — don't announce it, just let the correction card appear.
- Use explainVocabulary when you drop an interesting word or phrase that might be new to them.
- Use issueChallenge naturally every 3–5 exchanges when the moment feels right.
- After a challenge response: if correct, react naturally; if off, casually model the right way.`,
  tools: {
    explainVocabulary,
    correctGrammar,
    issueChallenge,
  },
});

export type TutorUIMessage = InferAgentUIMessage<typeof tutorAgent>;
