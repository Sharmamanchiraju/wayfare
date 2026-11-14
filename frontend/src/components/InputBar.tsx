import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
  onClearChat?: () => void;
}

export default function InputBar({ onSendMessage, isSending, onClearChat }: InputBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-muted/10 border-t-[0.5px] border-card-border shrink-0">
      <form onSubmit={handleSubmit} className="flex gap-2.5 items-center relative">
        {onClearChat && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClearChat}
            className="h-10 w-10 p-0 text-muted-foreground hover:text-red-semantic hover:bg-red-semantic/10"
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </Button>
        )}
        
        <div className="flex-1">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Ask TripPlanner to plan your trip..."
            className="flex-1"
          />
        </div>
        
        <Button
          type="submit"
          variant="solid"
          disabled={!input.trim() || isSending}
          loading={isSending}
          className="h-10 px-4 gap-1.5 shadow-xs shrink-0"
        >
          {!isSending && <Send size={15} />}
          <span>Send</span>
        </Button>
      </form>
    </div>
  );
}
