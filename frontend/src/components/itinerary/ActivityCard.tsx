import { motion } from 'framer-motion';
import { Clock, MapPin, DollarSign, Info } from 'lucide-react';
import { Badge } from '@/components/ui';

interface ActivityProps {
  activity: any;
  index: number;
}

export default function ActivityCard({ activity, index }: ActivityProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.25 }}
      className="relative pl-5 pb-5 border-l border-border last:border-transparent last:pb-0 text-left"
    >
      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-[0.5px] border-card shadow-xs" />
      
      <div className="bg-card border-[0.5px] border-card-border rounded-lg p-5 hover:bg-muted/20 transition-all shadow-xs">
        <div className="flex justify-between items-start mb-3 gap-3">
          <h4 className="font-bold text-foreground text-base tracking-tight leading-tight">{activity.name}</h4>
          {activity.time && (
            <Badge variant="accent" className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 shrink-0 select-none">
              <Clock size={12} />
              {activity.time}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {activity.description || activity.type}
        </p>

        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground select-none">
          {(activity.cost_usd || activity.cost_local) && (
            <span className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-accent" />
              {activity.cost_usd ? `$${activity.cost_usd}` : activity.cost_local}
            </span>
          )}
          
          {(activity.lat || activity.lng) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-muted-foreground/80" />
              Mappable Location
            </span>
          )}
          
          {activity.duration && (
            <span className="flex items-center gap-1.5">
              <Info size={14} className="text-muted-foreground/80" />
              {activity.duration}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
