import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, RefreshCw, Copy, StopCircle, Edit2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onEdit: (content: string) => void;
}

const LOADING_STAGES = [
  "Analyzing your request...",
  "Planning your journey...",
  "Finding the best options...",
  "Building your itinerary...",
  "Finalizing your trip..."
];

export default function ChatPanel({
  messages,
  input,
  setInput,
  isLoading,
  onSubmit,
  onStop,
  onRegenerate,
  onEdit
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, loadingIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % LOADING_STAGES.length);
      }, 2500); // Change text every 2.5 seconds
    } else {
      setLoadingIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-[450px] lg:w-[500px] flex flex-col h-full bg-card/95 backdrop-blur-2xl border-l border-border relative z-20 shadow-2xl">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">TripPlanner AI</h2>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={() => {}} 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-secondary border border-border' 
                  : 'bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-secondary-foreground" /> : <Sparkles className="w-4 h-4 text-accent-foreground" />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={`px-5 py-3.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-accent text-accent-foreground rounded-tr-sm shadow-md'
                    : 'bg-muted/50 border border-border text-foreground rounded-tl-sm backdrop-blur-md prose max-w-none prose-p:leading-relaxed dark:prose-invert prose-pre:bg-muted prose-pre:border prose-pre:border-border'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (isLoading ? '...' : '')}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Actions (visible on hover) */}
                <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {msg.role === 'agent' && msg.content && (
                    <>
                      <button 
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-semantic" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {messages[messages.length - 1].id === msg.id && !isLoading && (
                        <button 
                          onClick={onRegenerate}
                          className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors"
                          title="Regenerate response"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                  {msg.role === 'user' && !isLoading && (
                    <button 
                      onClick={() => onEdit(msg.content)}
                      className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors"
                      title="Edit prompt"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Premium Animated Loading State */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/20 rounded-2xl rounded-tl-sm text-accent text-sm font-medium backdrop-blur-md overflow-hidden relative min-w-[220px]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={loadingIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute left-10 whitespace-nowrap"
                  >
                    {LOADING_STAGES[loadingIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-background via-background to-transparent">
        <form onSubmit={onSubmit} className="relative flex items-end bg-card border border-border focus-within:border-accent/50 focus-within:bg-card/80 rounded-2xl transition-all shadow-lg backdrop-blur-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder="Ask anything about travel..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground p-4 max-h-32 focus:outline-none resize-none custom-scrollbar text-sm"
            rows={1}
            disabled={isLoading} // Allow stopping
          />
          <div className="p-2 shrink-0 flex items-center">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-10 h-10 bg-red-semantic/10 hover:bg-red-semantic/20 text-red-semantic rounded-xl flex items-center justify-center transition-colors"
                title="Stop generation"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 bg-accent hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground rounded-xl flex items-center justify-center transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
          TripPlanner AI can make mistakes. Verify important travel details.
        </p>
      </div>
    </div>
  );
}
