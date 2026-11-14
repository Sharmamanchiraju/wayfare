import { motion } from 'framer-motion';
import { Sparkles, MapPin, CloudRain, Calculator, Plane, ArrowRight } from 'lucide-react';

export default function Dashboard({ onStart }: { onStart: (query: string) => void }) {
  
  const features = [
    { icon: Plane, title: 'Real-time Flights', desc: 'Finds optimal routes and live pricing' },
    { icon: CloudRain, title: 'Weather Forecast', desc: 'Checks 7-day weather for your dates' },
    { icon: MapPin, title: 'Smart Routing', desc: 'Creates logical daily itineraries' },
    { icon: Calculator, title: 'Budget Tracking', desc: 'Estimates costs for all activities' },
  ];

  const handleSuggestionClick = (query: string) => {
    onStart(query);
  };

  return (
    <div className="flex-1 h-full relative overflow-y-auto custom-scrollbar flex flex-col bg-background text-foreground">
      {/* Background Hero */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
        {/* Subtle mesh background using theme accent colors */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-accent/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-10 max-w-5xl mx-auto w-full mt-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border text-accent text-sm font-medium mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Your AI Travel Workspace
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Where will your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">journey</span> take you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your dream trip. I'll analyze flights, check the weather, and craft a personalized itinerary optimized just for you.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-16"
        >
          {features.map((feat, idx) => (
            <div key={idx} className="bg-card/50 border border-border backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:bg-muted hover:border-accent/30 group">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feat.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Prompts to encourage interaction */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-2xl text-center"
        >
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-widest font-semibold">Try asking about</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "A romantic weekend in Kyoto...",
              "Backpacking across Europe on a budget...",
              "A 5-day adventure in Patagonia...",
              "Best food spots in Tokyo for 3 days..."
            ].map((suggestion, idx) => (
              <button 
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-5 py-2.5 rounded-full bg-card/50 border border-border text-muted-foreground text-sm hover:bg-accent/10 hover:text-foreground hover:border-accent/30 transition-all flex items-center gap-2 shadow-sm"
              >
                {suggestion}
                <ArrowRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
