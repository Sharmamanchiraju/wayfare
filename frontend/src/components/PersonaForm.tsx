import { useState, useEffect } from 'react';
import { Persona } from '@/hooks/usePersonas';
import { Modal, Input, Button } from '@/components/ui';

interface PersonaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Persona>) => void;
  initialData?: Persona | null;
  isLoading: boolean;
}

export default function PersonaForm({ isOpen, onClose, onSubmit, initialData, isLoading }: PersonaFormProps) {
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    travel_style: 'General',
    budget_min: 0,
    budget_max: 5000,
    trip_duration: 7,
    description: '',
    preferred_destination: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        travel_style: 'General',
        budget_min: 0,
        budget_max: 5000,
        trip_duration: 7,
        description: '',
        preferred_destination: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Edit Persona' : 'Create New Persona'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Input
            label="Persona Name *"
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Budget Backpacker Bob"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Travel Style *</label>
            <select
              required
              value={formData.travel_style || 'General'}
              onChange={(e) => setFormData({...formData, travel_style: e.target.value})}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-foreground transition-all cursor-pointer"
            >
              <option value="General">General 🌍</option>
              <option value="Budget">Budget 🎒</option>
              <option value="Luxury">Luxury 🍾</option>
              <option value="Adventure">Adventure 🧗‍♂️</option>
              <option value="Cultural">Cultural 🏛️</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Input
              label="Duration (days)"
              type="number"
              min="1"
              value={formData.trip_duration || ''}
              onChange={(e) => setFormData({...formData, trip_duration: parseInt(e.target.value) || undefined})}
              placeholder="7"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Input
              label="Min Budget ($)"
              type="number"
              min="0"
              value={formData.budget_min || 0}
              onChange={(e) => setFormData({...formData, budget_min: parseInt(e.target.value) || 0})}
            />
          </div>
          <div className="space-y-1.5">
            <Input
              label="Max Budget ($)"
              type="number"
              min="0"
              value={formData.budget_max || ''}
              onChange={(e) => setFormData({...formData, budget_max: parseInt(e.target.value) || undefined})}
              placeholder="5000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Input
            label="Preferred Destination"
            type="text"
            value={formData.preferred_destination || ''}
            onChange={(e) => setFormData({...formData, preferred_destination: e.target.value})}
            placeholder="e.g. Europe, Beach, Mountains"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Additional Notes</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-all"
            placeholder="Likes window seats, hates early mornings..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t-[0.5px] border-card-border mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            loading={isLoading}
            className="h-10 px-5"
          >
            {initialData ? 'Save Changes' : 'Create Persona'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
