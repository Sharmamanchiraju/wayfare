import { motion } from 'framer-motion';
import { CloudRain, Plane, MapPin, CheckCircle2, Wrench } from 'lucide-react';

interface ToolFeedbackProps {
  toolName: string;
  args?: any;
}

export default function ToolFeedback({ toolName, args }: ToolFeedbackProps) {
  const getToolInfo = () => {
    switch (toolName) {
      case 'check_weather':
        return {
          icon: <CloudRain className="text-sky-500" size={14} />,
          text: `Checking weather for ${args?.city_name || 'destination'}`,
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400'
        };
      case 'find_flights':
        return {
          icon: <Plane className="text-accent" size={14} />,
          text: `Finding flights to ${args?.destination || 'destination'}`,
          bg: 'bg-accent/10 border-accent/20 text-accent'
        };
      case 'find_attractions':
        return {
          icon: <MapPin className="text-accent" size={14} />,
          text: `Discovering attractions in ${args?.city_name || 'destination'}`,
          bg: 'bg-accent/10 border-accent/20 text-accent'
        };
      case 'submit_final_itinerary':
        return {
          icon: <CheckCircle2 className="text-accent" size={14} />,
          text: `Finalizing detailed itinerary...`,
          bg: 'bg-accent/10 border-accent/20 text-accent'
        };
      default:
        return {
          icon: <Wrench className="text-muted-foreground" size={14} />,
          text: `Using tool: ${toolName}`,
          bg: 'bg-muted border-border text-muted-foreground'
        };
    }
  };

  const { icon, text, bg } = getToolInfo();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-md border-[0.5px] ${bg} text-xs font-semibold w-fit mb-1.5 shadow-xs`}
    >
      {icon}
      <span>{text}</span>
    </motion.div>
  );
}
