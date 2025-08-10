import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClearFilters: () => void;
}

const FilterControls = ({ searchTerm, onSearchChange, filters, onClearFilters }: FilterControlsProps) => {
  const hasActiveFilters = searchTerm || filters.some(filter => filter.value !== 'all');

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-64">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar em todos os campos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-48">
            <Label htmlFor={filter.key}>{filter.label}</Label>
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger id={filter.key}>
                <SelectValue placeholder={`Filtrar por ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} className="flex items-center gap-2">
            <X size={16} />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;