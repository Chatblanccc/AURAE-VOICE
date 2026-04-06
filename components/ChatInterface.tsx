'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Settings, RotateCcw, User, Bot } from 'lucide-react';

export const ChatInterface = () => {
  const { messages, addMessage, isLoading, setLoading, settings, clearMessages } = useChatStore();
  const { isListening, transcript, startListening, setTranscript } = useSpeechToText();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    addMessage({ role: 'user', content });
    setInputValue('');
    setTranscript('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content }],
          settings,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextEncoder();
      let assistantMessage = '';

      // Initialize assistant message
      addMessage({ role: 'assistant', content: '' });
      
      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              assistantMessage += content;
              
              // Update the last message (the assistant one)
              useChatStore.setState((state) => {
                const newMessages = [...state.messages];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return { messages: newMessages };
              });
            } catch (e) {
              console.error('Error parsing chunk', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background border-x shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SpeakStar</h1>
            <p className="text-xs text-muted-foreground capitalize">{settings.proficiency} • {settings.topic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={clearMessages} title="Reset Chat">
            <RotateCcw size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-card border rounded-tl-none'
            }`}>
              {msg.content || (isLoading && msg.role === 'assistant' ? "Thinking..." : "")}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role !== 'assistant' && (
           <div className="flex items-start gap-3 flex-row">
             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
               <Bot size={18} />
             </div>
             <div className="bg-card border rounded-2xl rounded-tl-none p-3 text-sm animate-pulse">
               Typing...
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <footer className="p-4 border-t bg-card/50">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-background border rounded-2xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[44px] max-h-32 text-sm transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className={`absolute right-2 bottom-1.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}
              onClick={() => startListening()}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
          </div>
          <Button 
            className="rounded-full w-11 h-11 shrink-0" 
            size="icon"
            onClick={() => handleSend(inputValue)}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </footer>
    </div>
  );
};
