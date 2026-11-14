import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Message } from '@/hooks/useChat';
import { motion } from 'framer-motion';

interface MessageListProps {
  messages: Message[];
  isSending: boolean;
}

export default function MessageList({ messages, isSending }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl mb-4"
        >
          ✨
        </motion.div>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          Tell me about your dream trip. Where do you want to go, and what do you want to do?
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-6">
      {messages.map((msg, index) => (
        <MessageBubble key={msg.id || `local-${index}`} message={msg} />
      ))}
      
      {isSending && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 text-muted-foreground text-xs ml-10"
        >
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>TripPlanner is thinking...</span>
        </motion.div>
      )}
      
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
