import { useRouter } from 'next/navigation';
import { Bookmark, Check, Circle, Trash2 } from 'lucide-react';
import { ChatHistoryItemType } from '@/hooks/useChatHistory';

interface ChatHistoryItemProps {
  item: ChatHistoryItemType;
  onDelete: (id: number) => void;
}

export default function ChatHistoryItem({ item, onDelete }: ChatHistoryItemProps) {
  const router = useRouter();

  const getStatusIcon = () => {
    switch (item.status) {
      case 'in progress':
        return <Circle size={10} className="fill-blue-500 text-blue-500" />;
      case 'completed':
        return <Check size={12} className="text-emerald-500 font-black" />;
      case 'saved':
      default:
        return <Bookmark size={12} className="text-amber-500 fill-amber-500" />;
    }
  };

  const handleItemClick = () => {
    // If it's a real trip in DB, navigate to it. Otherwise, mock go to first active.
    if (item.id < 100) {
      router.push(`/trips/${item.id}`);
    } else {
      router.push(`/trips/1`); // fallback dashboard chat simulator
    }
  };

  return (
    <div className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors select-none">
      <button 
        onClick={handleItemClick}
        className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
      >
        <span className="shrink-0">{getStatusIcon()}</span>
        <div className="truncate flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-slate-200">{item.destination}</p>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{item.dates}</p>
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-750 text-slate-500 hover:text-red-semantic rounded transition-all cursor-pointer"
        title="Delete history"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
