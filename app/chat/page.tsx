import { Suspense } from 'react';
import { VoiceInterface } from '@/components/VoiceInterface';

function ChatFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

export default function ChatPage() {
  return (
    <main className="min-h-[100dvh] w-full">
      <Suspense fallback={<ChatFallback />}>
        <VoiceInterface />
      </Suspense>
    </main>
  );
}
