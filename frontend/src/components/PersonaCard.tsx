import { motion } from 'framer-motion';
import { PlaneTakeoff, Edit2, Trash2, Map, Wallet, Clock, Tag } from 'lucide-react';
import { Persona } from '@/hooks/usePersonas';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onDelete: (id: number) => void;
  onUseForTrip: (persona: Persona) => void;
}

const styleIcons: Record<string, string> = {
  luxury: '🍾',
  budget: '🎒',
  adventure: '🧗‍♂️',
  cultural: '🏛️',
  general: '🌍',
};

export default function PersonaCard({ persona, onEdit, onDelete, onUseForTrip }: PersonaCardProps) {
  const icon = styleIcons[persona.travel_style?.toLowerCase()] || styleIcons.general;

  // Map travel styles to semantic badge variants
  const getBadgeVariant = (style: string) => {
    switch (style.toLowerCase()) {
      case 'luxury': return 'accent';
      case 'budget': return 'warning';
      case 'adventure': return 'success';
      case 'cultural': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col relative border-[0.5px] border-card-border bg-card text-card-foreground shadow-xs group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl border border-border">
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight">{persona.name}</h3>
                <Badge variant={getBadgeVariant(persona.travel_style)} className="mt-1">
                  {persona.travel_style}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => onEdit(persona)}
                className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-foreground"
                title="Edit Persona"
              >
                <Edit2 size={14} />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => onDelete(persona.id)}
                className="h-8 w-8 p-0 rounded-md text-red-semantic hover:bg-red-semantic/10 hover:text-red-semantic"
                title="Delete Persona"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <div className="space-y-2.5 mb-6 flex-grow relative z-10 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet size={15} className="text-muted-foreground/75" />
              <span>Budget: <strong className="text-foreground">${persona.budget_min || 0} - ${persona.budget_max || 'Uncapped'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={15} className="text-muted-foreground/75" />
              <span>Duration: <strong className="text-foreground">{persona.trip_duration || '?'} days</strong></span>
            </div>
            {persona.preferred_destination && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Map size={15} className="text-muted-foreground/75" />
                <span>Prefers: <strong className="text-foreground">{persona.preferred_destination}</strong></span>
              </div>
            )}
            {persona.description && (
              <div className="flex items-start gap-2 text-muted-foreground text-xs mt-3 pt-3 border-t border-border/60">
                <Tag size={13} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{persona.description}</span>
              </div>
            )}
          </div>

          <Button
            onClick={() => onUseForTrip(persona)}
            variant="solid"
            className="w-full mt-auto justify-center gap-2 h-10"
          >
            <PlaneTakeoff size={16} />
            <span>Plan Trip with this Persona</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
