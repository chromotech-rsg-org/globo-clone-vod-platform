
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';

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
  dateRange?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
}

const FilterControls = ({ searchTerm, onSearchChange, filters, onClearFilters, dateRange }: FilterControlsProps) => {
  const hasActiveFilters = searchTerm || filters.some(filter => filter.value !== 'all') || 
    (dateRange && (dateRange.from || dateRange.to));

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-64">
          <Label htmlFor="search" className="text-white">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar em todos os campos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-black border-green-600/30 text-white placeholder:text-gray-400 focus:border-green-500"
          />
        </div>
        
        {/* Date Range Filters */}
        {dateRange && (
          <>
            <div className="min-w-40">
              <Label htmlFor="date-from" className="text-white">Data Início</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date-from"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => dateRange.onFromChange(e.target.value)}
                  className="pl-10 bg-black border-green-600/30 text-white focus:border-green-500"
                />
              </div>
            </div>
            <div className="min-w-40">
              <Label htmlFor="date-to" className="text-white">Data Fim</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => dateRange.onToChange(e.target.value)}
                className="bg-black border-green-600/30 text-white focus:border-green-500"
              />
            </div>
          </>
        )}
        
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-48">
            <Label htmlFor={filter.key} className="text-white">{filter.label}</Label>
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger id={filter.key} className="bg-black border-green-600/30 text-white focus:border-green-500">
                <SelectValue placeholder={`Filtrar por ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-600/30">
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-white hover:bg-green-600/20">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <X size={16} />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
