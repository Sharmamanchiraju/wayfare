import { useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import InputBar from './InputBar';
import { Card, Alert } from '@/components/ui';

interface ChatInterfaceProps {
  tripId: number;
}

export default function ChatInterface({ tripId }: ChatInterfaceProps) {
  const { messages, isLoading, isSending, error, sendMessage } = useChat(tripId);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[calc(100vh-8rem)] bg-card rounded-xl border border-border/80">
        <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading conversation history...</p>
      </div>
    );
  }

  return (
    <Card className="flex-grow flex flex-col relative h-[calc(100vh-8rem)] border-[0.5px] border-card-border bg-card shadow-sm overflow-hidden">
      {/* Top Bar for Chat */}
      <div className="h-14 border-b border-card-border flex items-center px-5 bg-muted/15 shrink-0 select-none">
        <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
        <span className="text-sm font-semibold text-foreground">TripPlanner AI Chat</span>
      </div>

      {error && (
        <div className="p-4 border-b border-card-border shrink-0 z-20">
          <Alert variant="error">
            Failed to connect or send message. Please try again.
          </Alert>
        </div>
      )}

      {/* Message List */}
      <MessageList messages={messages} isSending={isSending} />

      {/* Input Area */}
      <InputBar onSendMessage={sendMessage} isSending={isSending} />
    </Card>
  );
}
