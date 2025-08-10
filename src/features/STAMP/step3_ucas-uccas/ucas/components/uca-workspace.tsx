import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Grid3x3,
  TableIcon,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  ArrowUpDown,
  ChevronDown,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { cn } from '@/lib/utils';
import { UnsafeControlAction, Controller, ControlAction, UCAType } from '@/types/types';
import EnterpriseUCAMatrix from './enterprise-uca-matrix';

interface UCAWorkspaceProps {
  ucas: UnsafeControlAction[];
  controllers: Controller[];
  controlActions: ControlAction[];
  selectedController: string | null;
  selectedControlAction: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateUCA: (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => void;
  onEditUCA: (uca: UnsafeControlAction) => void;
  onSelectControlAction: (id: string | null) => void;
}

// Type definitions for better type safety
type UCATypeLabelMap = Record<UCAType, string>;
type UCATypeColorMap = Record<UCAType, string>;

const UCA_TYPE_LABELS: UCATypeLabelMap = {
  [UCAType.NotProvided]: 'Not Provided',
  [UCAType.ProvidedUnsafe]: 'Provided',
  [UCAType.TooEarly]: 'Too Early',
  [UCAType.TooLate]: 'Too Late',
  [UCAType.WrongOrder]: 'Wrong Order',
  [UCAType.TooLong]: 'Too Long',
  [UCAType.TooShort]: 'Too Short',
} as const;

const UCA_TYPE_COLORS: UCATypeColorMap = {
  [UCAType.NotProvided]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  [UCAType.ProvidedUnsafe]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  [UCAType.TooEarly]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  [UCAType.TooLate]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  [UCAType.WrongOrder]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  [UCAType.TooLong]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  [UCAType.TooShort]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
} as const;

const UCAWorkspace: React.FC<UCAWorkspaceProps> = ({
  ucas,
  controllers,
  controlActions,
  selectedController,
  selectedControlAction,
  searchQuery,
  onSearchChange,
  onCreateUCA,
  onEditUCA,
  onSelectControlAction,
}) => {
  const { deleteUCA, addUCA, hazards } = useAnalysisContext();
  const [showTableView, setShowTableView] = useState(false);

  // Memoized helper functions for better performance
  const getControllerName = useCallback(
    (id: string) => {
      return controllers.find(c => c.id === id)?.name || 'Unknown';
    },
    [controllers]
  );

  const getControlActionName = useCallback(
    (id: string) => {
      const action = controlActions.find(ca => ca.id === id);
      return action ? `${action.verb} ${action.object}` : 'Unknown';
    },
    [controlActions]
  );

  const getHazardCodes = useCallback(
    (hazardIds: string[]) => {
      return hazardIds.map(id => {
        const hazard = hazards.find(h => h.id === id);
        return hazard?.code || 'Unknown';
      });
    },
    [hazards]
  );

  // Memoized UCA formatter with improved type safety
  const formatUCA = useCallback(
    (uca: UnsafeControlAction) => {
      const controller = getControllerName(uca.controllerId);
      const action = getControlActionName(uca.controlActionId);
      const hazardCodes = getHazardCodes(uca.hazardIds).join(', ');

      // Define type phrases with better mapping
      const TYPE_PHRASES: Record<UCAType, string> = {
        [UCAType.NotProvided]: 'does not provide',
        [UCAType.ProvidedUnsafe]: 'provides',
        [UCAType.TooEarly]: 'provides',
        [UCAType.TooLate]: 'provides',
        [UCAType.WrongOrder]: 'provides',
        [UCAType.TooLong]: 'provides',
        [UCAType.TooShort]: 'provides',
      };

      // Define timing modifiers
      const TIMING_MODIFIERS: Partial<Record<UCAType, string>> = {
        [UCAType.TooEarly]: ' too early',
        [UCAType.TooLate]: ' too late',
        [UCAType.WrongOrder]: ' in wrong order',
        [UCAType.TooLong]: ' for too long',
        [UCAType.TooShort]: ' for too short',
      };

      const typePhrase = TYPE_PHRASES[uca.ucaType] || 'provides';
      const timingModifier = TIMING_MODIFIERS[uca.ucaType] || '';

      return `${uca.code}: ${controller} ${typePhrase} ${action}${timingModifier} while ${uca.context} [${hazardCodes}]`;
    },
    [getControllerName, getControlActionName, getHazardCodes]
  );

  // Enhanced data type for the table
  interface UCATableData {
    id: string;
    uca: string;
    type: UCAType;
    typeLabel: string;
    controller: string;
    controlAction: string;
    context: string;
    hazards: string[];
    hazardString: string;
    originalData: UnsafeControlAction;
  }

  // Export types for selected UCAs
  interface SelectedUCAs {
    [key: string]: boolean;
  }

  const tableData = useMemo<UCATableData[]>(() => {
    return ucas.map(uca => ({
      id: uca.id,
      uca: formatUCA(uca),
      type: uca.ucaType,
      typeLabel: UCA_TYPE_LABELS[uca.ucaType],
      controller: getControllerName(uca.controllerId),
      controlAction: getControlActionName(uca.controlActionId),
      context: uca.context,
      hazards: getHazardCodes(uca.hazardIds),
      hazardString: getHazardCodes(uca.hazardIds).join(', '),
      originalData: uca,
    }));
  }, [ucas, controllers, controlActions, hazards]);

  // Data table state with better typing
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<SelectedUCAs>({});

  // Column definitions for the data table
  const columns: ColumnDef<UCATableData>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'uca',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            UCA
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="max-w-xl font-mono text-sm">{row.getValue('uca')}</div>,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Type
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const type = row.original.type;
        const label = row.original.typeLabel;
        return (
          <Badge variant="secondary" className={cn('text-xs', UCA_TYPE_COLORS[type])}>
            {label}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'controller',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Controller
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('controller')}</div>,
      size: 150,
    },
    {
      accessorKey: 'controlAction',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Control Action
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('controlAction')}</div>,
      size: 150,
    },
    {
      accessorKey: 'context',
      header: 'Context',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="truncate text-sm">{row.getValue('context')}</div>
        </div>
      ),
    },
    {
      accessorKey: 'hazards',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Hazards
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const hazards = row.original.hazards;
        return (
          <div className="flex flex-wrap gap-1">
            {hazards.map((code, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {code}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return row.original.hazardString.toLowerCase().includes(value.toLowerCase());
      },
      size: 120,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const uca = row.original.originalData;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditUCA(uca)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const { id, code, ...ucaData } = uca;
                  addUCA(ucaData);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteUCA(uca.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="space-y-3 border-b p-3 lg:space-y-4 lg:p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search UCAs by description, context, or code..."
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                if (showTableView) {
                  table.setGlobalFilter(e.target.value);
                }
              }}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTableView(!showTableView)}
              className={cn(!showTableView && 'bg-blue-50 dark:bg-blue-950/30')}
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Matrix View
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowTableView(!showTableView)}
              className={cn(showTableView && 'bg-blue-50 dark:bg-blue-950/30')}
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Table View
            </Button>

            {showTableView && table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedRows = table.getFilteredSelectedRowModel().rows;
                  const selectedCount = selectedRows.length;

                  if (
                    confirm(`Delete ${selectedCount} selected UCA${selectedCount > 1 ? 's' : ''}?`)
                  ) {
                    selectedRows.forEach(row => {
                      deleteUCA(row.original.id);
                    });
                    table.resetRowSelection();
                  }
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )}

            <Button onClick={() => onCreateUCA()}>Add UCA</Button>
          </div>
        </div>

        {/* Quick filters for selected controller/action */}
        {(selectedController || selectedControlAction) && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Filtering by:</span>
              {selectedController && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Controller: {getControllerName(selectedController)}
                  <button
                    onClick={() => onSelectControlAction(null)}
                    className="ml-1 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedControlAction && (
                <Badge variant="secondary">
                  Action: {getControlActionName(selectedControlAction)}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {tableData.length} UCA{tableData.length !== 1 ? 's' : ''} shown
            </span>
          </div>
        )}
      </div>

      {/* UCA View - Matrix or Table */}
      {showTableView ? (
        <div className="flex flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        return (
                          <TableHead
                            key={header.id}
                            style={{
                              width: header.getSize() !== 150 ? header.getSize() : undefined,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn(
                          'cursor-pointer transition-colors',
                          'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        )}
                        onClick={() => onEditUCA(row.original.originalData)}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            onClick={
                              cell.column.id === 'select' || cell.column.id === 'actions'
                                ? e => e.stopPropagation()
                                : undefined
                            }
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No UCAs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground text-sm">
                  {table.getFilteredSelectedRowModel().rows.length} of{' '}
                  {table.getFilteredRowModel().rows.length} row(s) selected
                </p>
                <div className="text-muted-foreground text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EnterpriseUCAMatrix
          controllers={controllers}
          controlActions={controlActions}
          ucas={ucas}
          selectedController={selectedController}
          onSelectControlAction={onSelectControlAction}
          onCreateUCA={onCreateUCA}
        />
      )}
    </div>
  );
};

export default UCAWorkspace;
