'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* ========================================
   PHONE MOCKUP COMPONENT
   Premium iPhone mockup with animated conversation
   showing Quick Replies as a core feature.
   With Instagram branding for clarity.
   ======================================== */

type MessageType = {
  id: number;
  type: 'incoming' | 'outgoing' | 'quick-reply-selection';
  text: string;
  quickReplies?: string[];
  delay: number;
};

// Slower animation timing for better readability
const conversationFlow: MessageType[] = [
  {
    id: 1,
    type: 'incoming',
    text: 'Hi! Hätte gern einen Tisch für 2 heute Abend',
    delay: 800,
  },
  {
    id: 2,
    type: 'outgoing',
    text: 'Gerne! Welche Uhrzeit passt euch?',
    quickReplies: ['18:00', '19:00', '20:00'],
    delay: 3000,
  },
  {
    id: 3,
    type: 'quick-reply-selection',
    text: '19:00',
    delay: 6000,
  },
  {
    id: 4,
    type: 'outgoing',
    text: 'Perfekt! Auf welchen Namen?',
    delay: 7500,
  },
  {
    id: 5,
    type: 'incoming',
    text: 'Lisa Müller',
    delay: 10000,
  },
  {
    id: 6,
    type: 'outgoing',
    text: 'Reserviert! Tisch für 2, 19:00 Uhr. Bis später!',
    quickReplies: ['Danke!', 'Ändern'],
    delay: 12000,
  },
];

export default function PhoneMockup() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [activeQuickReplies, setActiveQuickReplies] = useState<number | null>(null);
  const [selectedQuickReply, setSelectedQuickReply] = useState<{ messageId: number; reply: string } | null>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const resetAnimation = useCallback(() => {
    setVisibleMessages([]);
    setActiveQuickReplies(null);
    setSelectedQuickReply(null);
    setShowTyping(false);
  }, []);

  useEffect(() => {
    resetAnimation();
    const timeouts: NodeJS.Timeout[] = [];

    conversationFlow.forEach((message, index) => {
      // Show typing indicator before outgoing messages
      if (message.type === 'outgoing' && index > 0) {
        const typingTimeout = setTimeout(() => {
          setShowTyping(true);
        }, message.delay - 1200);
        timeouts.push(typingTimeout);
      }

      const messageTimeout = setTimeout(() => {
        setShowTyping(false);

        if (message.type === 'quick-reply-selection') {
          // Find the previous message with quick replies
          const prevMessage = conversationFlow[index - 1];
          if (prevMessage?.quickReplies) {
            // Show selection animation
            setSelectedQuickReply({ messageId: prevMessage.id, reply: message.text });
            // Hide quick replies after selection
            setTimeout(() => {
              setActiveQuickReplies(null);
              setVisibleMessages((prev) => [...prev, message.id]);
            }, 800);
          }
        } else {
          setVisibleMessages((prev) => [...prev, message.id]);

          // Show quick replies if present
          if (message.quickReplies) {
            setTimeout(() => {
              setActiveQuickReplies(message.id);
              setSelectedQuickReply(null);
            }, 500);
          }
        }
      }, message.delay);
      timeouts.push(messageTimeout);
    });

    // Restart loop - longer pause at the end
    const restartTimeout = setTimeout(() => {
      setCycleKey((prev) => prev + 1);
    }, 18000);
    timeouts.push(restartTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [cycleKey, resetAnimation]);

  const getMessage = (id: number) => conversationFlow.find((m) => m.id === id);

  // Auto-scroll to bottom when messages or quick replies change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleMessages, activeQuickReplies]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Subtle glow behind phone - reduced blur for mobile performance */}
      <div className="absolute h-[300px] w-[220px] rounded-[60px] bg-gradient-to-b from-indigo-500/15 via-violet-500/10 to-transparent blur-[40px] sm:h-[400px] sm:w-[300px] sm:from-indigo-500/20 sm:blur-[60px]" />

      {/* Phone Frame */}
      <div className="relative w-[260px] sm:w-[280px] md:w-[300px]">
        {/* Side Buttons - hidden on smallest screens */}
        <div className="absolute -left-[3px] top-[100px] hidden h-8 w-[3px] rounded-l-sm bg-zinc-700 sm:block" />
        <div className="absolute -left-[3px] top-[140px] hidden h-14 w-[3px] rounded-l-sm bg-zinc-700 sm:block" />
        <div className="absolute -left-[3px] top-[200px] hidden h-14 w-[3px] rounded-l-sm bg-zinc-700 sm:block" />
        <div className="absolute -right-[3px] top-[160px] hidden h-20 w-[3px] rounded-r-sm bg-zinc-700 sm:block" />

        {/* Phone Body */}
        <div className="relative overflow-hidden rounded-[40px] border-[2px] border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 sm:rounded-[45px] sm:border-[3px]">
          {/* Screen */}
          <div className="relative h-[500px] overflow-hidden bg-zinc-950 sm:h-[540px] md:h-[580px]">
            {/* Subtle screen reflection */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />

            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-3 z-20 flex h-[26px] w-[90px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
              <div className="h-[5px] w-[5px] rounded-full bg-zinc-800" />
            </div>

            {/* Status Bar */}
            <div className="relative z-10 flex items-center justify-between px-7 pt-4">
              <span className="text-[12px] font-semibold text-white">9:41</span>
              <div className="flex items-center gap-[5px]">
                <div className="flex items-end gap-[2px]">
                  <div className="h-[3px] w-[2px] rounded-sm bg-white" />
                  <div className="h-[5px] w-[2px] rounded-sm bg-white" />
                  <div className="h-[7px] w-[2px] rounded-sm bg-white" />
                  <div className="h-[9px] w-[2px] rounded-sm bg-white" />
                </div>
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C7.5 3 3.75 4.95 1 8l1.5 1.5C4.75 6.75 8.25 5 12 5s7.25 1.75 9.5 4.5L23 8c-2.75-3.05-6.5-5-11-5zm0 4c-3 0-5.75 1.35-7.5 3.5L6 12c1.25-1.5 3.25-2.5 6-2.5s4.75 1 6 2.5l1.5-1.5C17.75 8.35 15 7 12 7zm0 4c-1.75 0-3.25.75-4.5 2L9 14.5c.75-.75 1.75-1 3-1s2.25.25 3 1L16.5 13c-1.25-1.25-2.75-2-4.5-2zm0 4c-1 0-1.75.5-2.25 1L12 18l2.25-2c-.5-.5-1.25-1-2.25-1z"/>
                </svg>
                <div className="flex items-center">
                  <div className="h-[10px] w-[20px] rounded-[2px] border border-white p-[1px]">
                    <div className="h-full w-[70%] rounded-[1px] bg-white" />
                  </div>
                  <div className="ml-[1px] h-[3px] w-[1px] rounded-r-sm bg-white" />
                </div>
              </div>
            </div>

            {/* Instagram DM Header with Instagram Logo as Profile */}
            <div className="relative z-10 mt-3 flex items-center justify-between border-b border-white/5 px-4 pb-3">
              <div className="flex items-center gap-3">
                <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/5">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="relative">
                  {/* Instagram Logo as Profile Picture */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Ristorante Milano</p>
                  <p className="text-[10px] text-emerald-400">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="relative z-10 h-[310px] space-y-2 overflow-y-auto px-3 py-2 pb-0 sm:h-[340px] sm:space-y-2.5 sm:py-3 sm:pb-0 md:h-[380px] md:pb-0 no-scrollbar"
            >
              {conversationFlow.map((message) => {
                if (!visibleMessages.includes(message.id)) return null;
                if (message.type === 'quick-reply-selection') {
                  // Render as incoming message (user selected this)
                  return (
                    <div
                      key={message.id}
                      className="flex justify-start opacity-0 animate-[messageSlideIn_0.6s_ease_forwards]"
                    >
                      <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-zinc-800 px-3.5 py-2 text-[13px] text-white">
                        {message.text}
                      </div>
                    </div>
                  );
                }

                const isOutgoing = message.type === 'outgoing';
                const showQuickReplies = activeQuickReplies === message.id && message.quickReplies;
                const isQuickReplySelected = selectedQuickReply?.messageId === message.id;

                return (
                  <div key={message.id}>
                    <div
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} opacity-0 animate-[messageSlideIn_0.6s_ease_forwards]`}
                    >
                      <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                        isOutgoing
                          ? 'rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                          : 'rounded-bl-md bg-zinc-800 text-white'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>

                  {/* Quick Replies */}
                  {showQuickReplies && (
                      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                        {message.quickReplies!.map((reply, idx) => {
                          const isSelected = isQuickReplySelected && selectedQuickReply?.reply === reply;
                          return (
                            <button
                              key={reply}
                              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-300 opacity-0 animate-[quickReplyIn_0.5s_ease_forwards] ${
                                isSelected
                                  ? 'scale-105 border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                  : 'border-zinc-700 bg-zinc-800/80 text-white hover:border-zinc-600 hover:bg-zinc-700'
                              }`}
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              {reply}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {showTyping && (
                <div className="flex justify-end opacity-0 animate-[messageSlideIn_0.4s_ease_forwards]">
                  <div className="flex items-center gap-1 rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500/80 to-violet-500/80 px-3.5 py-2.5">
                    <span className="h-1.5 w-1.5 animate-[typingDot_1.4s_infinite] rounded-full bg-white/80" />
                    <span className="h-1.5 w-1.5 animate-[typingDot_1.4s_infinite_0.2s] rounded-full bg-white/80" />
                    <span className="h-1.5 w-1.5 animate-[typingDot_1.4s_infinite_0.4s] rounded-full bg-white/80" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/5 bg-zinc-950/95 px-3 py-2.5 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="flex flex-1 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                  <span className="text-[12px] text-zinc-500">Nachricht...</span>
                </div>
                <button className="text-zinc-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
