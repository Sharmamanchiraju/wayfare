import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolFeedback from './ToolFeedback';
import { Message } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  
  if (message.role === 'tool') return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 border ${
        isUser 
          ? 'bg-accent/10 border-accent/25 text-accent' 
          : 'bg-muted border-border text-muted-foreground'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool Calls Rendering */}
        {!isUser && message.tool_calls && message.tool_calls.calls && (
          <div className="mb-1.5 flex flex-col gap-1">
            {message.tool_calls.calls.map((call: any, idx: number) => (
              <ToolFeedback key={idx} toolName={call.tool} args={call.args} />
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className={`relative px-4 py-3 rounded-lg border-[0.5px] ${
          isUser
            ? 'bg-primary text-primary-foreground border-primary shadow-xs rounded-tr-xs'
            : 'bg-card text-foreground border-card-border shadow-xs rounded-tl-xs'
        }`}>
          {message.isOptimistic && (
            <div className="absolute -left-5 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-muted border-t-accent rounded-full animate-spin" />
            </div>
          )}
          
          <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border max-w-none text-sm break-words font-sans prose-code:font-mono prose-code:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;
