import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  action: (selectedIds: string[]) => void | Promise<void>;
}

interface BulkActionsToolbarProps {
  selectedIds: string[];
  totalSelected: number;
  onClearSelection: () => void;
  table: string;
  customActions?: BulkAction[];
  exportColumns?: string[];
  exportFileName?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedIds,
  totalSelected,
  onClearSelection,
  table,
  customActions = [],
  exportColumns,
  exportFileName
}) => {
  const { exportSelected, isExporting } = useDataExport();

  const handleExport = () => {
    exportSelected({
      table,
      selectedIds,
      columns: exportColumns,
      fileName: exportFileName
    });
  };

  if (totalSelected === 0) return null;

  const defaultActions: BulkAction[] = [
    {
      key: 'export',
      label: 'Exportar Selecionados',
      icon: Download,
      action: handleExport
    }
  ];

  const allActions = [...defaultActions, ...customActions];
  const primaryActions = allActions.slice(0, 2);
  const secondaryActions = allActions.slice(2);

  return (
    <div className="flex items-center justify-between p-4 bg-admin-content-bg border border-admin-border rounded-lg mb-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-sm text-admin-table-text font-medium">
          {totalSelected} {totalSelected === 1 ? 'item selecionado' : 'itens selecionados'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-admin-muted-foreground hover:text-admin-table-text"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar seleção
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {primaryActions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={() => action.action(selectedIds)}
            disabled={action.key === 'export' ? isExporting : false}
            className="text-admin-table-text border-admin-border"
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.key === 'export' && isExporting ? 'Exportando...' : action.label}
          </Button>
        ))}

        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-admin-table-text border-admin-border">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-admin-content-bg border-admin-border">
              {secondaryActions.map((action, index) => (
                <DropdownMenuItem
                  key={action.key}
                  onClick={() => action.action(selectedIds)}
                  className="text-admin-table-text hover:bg-gray-800 cursor-pointer"
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default BulkActionsToolbar;