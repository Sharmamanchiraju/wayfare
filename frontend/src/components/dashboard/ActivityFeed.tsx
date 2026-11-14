import { useRouter } from 'next/navigation';
import { MapPin, Heart, Check, Plus } from 'lucide-react';
import { ActivityItemType } from '@/hooks/useActivity';
import { Card, CardContent } from '@/components/ui';

interface ActivityFeedProps {
  activities: ActivityItemType[];
  hasMore: boolean;
  onLoadMore: () => void;
  compact?: boolean;
}

export default function ActivityFeed({ activities, hasMore, onLoadMore, compact = false }: ActivityFeedProps) {
  const router = useRouter();

  const getActivityIcon = (type: ActivityItemType['type']) => {
    switch (type) {
      case 'update':
        return { icon: <MapPin size={12} />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/15' };
      case 'save':
        return { icon: <Heart size={12} />, color: 'bg-red-500/10 text-red-500 border-red-500/15' };
      case 'budget':
        return { icon: <Check size={12} />, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15' };
      case 'complete':
      case 'create':
      default:
        return { icon: <Plus size={12} />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/15' };
    }
  };

  const handleItemClick = (tripId?: number) => {
    if (tripId) {
      router.push(tripId < 100 ? `/trips/${tripId}` : `/trips/1`);
    }
  };

  const list = (
    <div className={compact ? 'divide-y divide-border/30' : 'space-y-1'}>
      {activities.map((act) => {
        const config = getActivityIcon(act.type);
        return (
          <div
            key={act.id}
            onClick={() => handleItemClick(act.tripId)}
            className={`flex gap-2.5 items-start hover:bg-muted/40 transition-colors cursor-pointer select-none group ${compact ? 'px-4 py-2.5' : 'p-2 rounded-lg'}`}
          >
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-accent transition-colors truncate">
                {act.text}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-none">{act.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (compact) return list;

  return (
    <Card className="border-[0.5px] border-card-border bg-card shadow-xs">
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-center select-none">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Recent Activity</h4>
          {hasMore && (
            <button onClick={onLoadMore} className="text-xs text-accent font-bold hover:underline cursor-pointer">
              View all
            </button>
          )}
        </div>
        {list}
        {hasMore && (
          <button onClick={onLoadMore} className="w-full text-center py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors cursor-pointer">
            Load more
          </button>
        )}
      </CardContent>
    </Card>
  );
}
