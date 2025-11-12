/**
 * 📊 TABEL VERBETERINGEN GUIDE
 * 
 * Deze guide toont hoe je de tabellen in ReservationsManager en EventManager
 * kunt verbeteren met moderne features zoals sortering, filtering en pagination.
 * 
 * We gebruiken @tanstack/react-table (v8) - een krachtige, headless table library.
 */

// ============================================================
// INSTALLATIE
// ============================================================
/*
  npm install @tanstack/react-table
  
  @tanstack/react-table is:
  - Headless (geen styling, volledige controle)
  - TypeScript-first
  - Zeer performant
  - Ondersteunt sorting, filtering, pagination, grouping, etc.
*/

// ============================================================
// VOORBEELD 1: Basis Sortable Table met @tanstack/react-table
// ============================================================

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Reservation } from '../types';
import { formatCurrency, formatDate, cn } from '../utils';

interface ReservationsTableProps {
  reservations: Reservation[];
  onViewDetails: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onConfirm: (reservation: Reservation) => void;
  onReject: (reservation: Reservation) => void;
}

export function ReservationsTable({
  reservations,
  onViewDetails,
  onEdit,
  onConfirm,
  onReject
}: ReservationsTableProps) {
  // State voor sorting, filtering en pagination
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  // Definieer kolommen
  const columns = useMemo<ColumnDef<Reservation>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Datum',
        cell: ({ getValue }) => formatDate(getValue() as Date),
        sortingFn: 'datetime',
        enableColumnFilter: false
      },
      {
        accessorKey: 'companyName',
        header: 'Bedrijf',
        cell: ({ getValue }) => (
          <div className="font-medium text-text-primary max-w-xs truncate">
            {getValue() as string}
          </div>
        ),
        filterFn: 'includesString'
      },
      {
        accessorKey: 'contactPerson',
        header: 'Contactpersoon',
        cell: ({ getValue }) => getValue() as string,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <div className="text-sm text-text-secondary max-w-xs truncate">
            {getValue() as string}
          </div>
        ),
        filterFn: 'includesString'
      },
      {
        accessorKey: 'numberOfPersons',
        header: 'Personen',
        cell: ({ getValue }) => (
          <div className="text-center font-semibold">
            {getValue() as number}
          </div>
        ),
        sortingFn: 'basic',
        filterFn: 'inNumberRange'
      },
      {
        accessorKey: 'totalPrice',
        header: 'Totaal',
        cell: ({ getValue }) => (
          <div className="font-medium text-primary-500">
            {formatCurrency(getValue() as number)}
          </div>
        ),
        sortingFn: 'basic'
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue, row }) => {
          const status = getValue() as Reservation['status'];
          return <StatusBadge status={status} />;
        },
        filterFn: 'equals'
      },
      {
        id: 'actions',
        header: 'Acties',
        cell: ({ row }) => (
          <ReservationActions
            reservation={row.original}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onConfirm={onConfirm}
            onReject={onReject}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false
      }
    ],
    [onViewDetails, onEdit, onConfirm, onReject]
  );

  // Initialiseer table instance
  const table = useReactTable({
    data: reservations,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Pagination configuratie
    manualPagination: false,
    pageCount: -1 // Auto-berekend
  });

  return (
    <div className="space-y-4">
      {/* Quick Filters (boven tabel) */}
      <div className="flex items-center gap-4 flex-wrap">
        <QuickSearch
          value={(table.getColumn('companyName')?.getFilterValue() as string) ?? ''}
          onChange={(value) =>
            table.getColumn('companyName')?.setFilterValue(value)
          }
          placeholder="Zoek bedrijf..."
        />
        
        <StatusFilter
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        />

        <PersonsFilter
          onChange={(min, max) =>
            table.getColumn('numberOfPersons')?.setFilterValue([min, max])
          }
        />

        {/* Reset filters */}
        {(columnFilters.length > 0 || sorting.length > 0) && (
          <button
            onClick={() => {
              table.resetColumnFilters();
              table.resetSorting();
            }}
            className="px-3 py-2 text-sm text-text-muted hover:text-text-primary border border-border-default rounded-lg hover:border-border-strong transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-modal border-b border-border-default">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-2',
                            header.column.getCanSort() && 'cursor-pointer select-none hover:text-primary-500'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          
                          {/* Sort indicator */}
                          {header.column.getCanSort() && (
                            <span className="text-text-muted">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronsUpDown className="w-4 h-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    Geen reserveringen gevonden
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-bg-hover transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-text-secondary">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination table={table} />
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

// Status Badge Component
function StatusBadge({ status }: { status: Reservation['status'] }) {
  const styles = {
    confirmed: 'bg-success-500/20 text-success-400 border-success-500/30',
    pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    waitlist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cancelled: 'bg-error-500/20 text-error-400 border-error-500/30',
    rejected: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    'checked-in': 'bg-info-500/20 text-info-400 border-info-500/30'
  } as const;

  const labels = {
    confirmed: 'Bevestigd',
    pending: 'In Afwachting',
    waitlist: 'Wachtlijst',
    cancelled: 'Geannuleerd',
    rejected: 'Afgewezen',
    'checked-in': 'Ingecheckt'
  } as const;

  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-medium border inline-block',
      styles[status] || styles.pending
    )}>
      {labels[status] || status}
    </span>
  );
}

// Quick Search Component
function QuickSearch({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

// Status Filter Dropdown
function StatusFilter({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 bg-bg-input border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      <option value="all">Alle statussen</option>
      <option value="pending">In Afwachting</option>
      <option value="confirmed">Bevestigd</option>
      <option value="waitlist">Wachtlijst</option>
      <option value="cancelled">Geannuleerd</option>
      <option value="rejected">Afgewezen</option>
      <option value="checked-in">Ingecheckt</option>
    </select>
  );
}

// Persons Range Filter
function PersonsFilter({
  onChange
}: {
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  const handleChange = () => {
    onChange(
      min ? parseInt(min) : null,
      max ? parseInt(max) : null
    );
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={min}
        onChange={(e) => {
          setMin(e.target.value);
          handleChange();
        }}
        placeholder="Min personen"
        className="w-32 px-3 py-2 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-text-muted">-</span>
      <input
        type="number"
        value={max}
        onChange={(e) => {
          setMax(e.target.value);
          handleChange();
        }}
        placeholder="Max personen"
        className="w-32 px-3 py-2 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}

// Table Pagination Component
function TablePagination({ table }: { table: any }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-bg-modal border-t border-border-default">
      {/* Info */}
      <div className="text-sm text-text-muted">
        Toont {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} tot{' '}
        {Math.min(
          (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
          table.getFilteredRowModel().rows.length
        )}{' '}
        van {table.getFilteredRowModel().rows.length} resultaten
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {[10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize} per pagina
            </option>
          ))}
        </select>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>
          
          <span className="px-4 py-1.5 text-sm text-text-primary">
            Pagina {table.getState().pagination.pageIndex + 1} van {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}

// Reservation Actions Component
function ReservationActions({
  reservation,
  onViewDetails,
  onEdit,
  onConfirm,
  onReject
}: {
  reservation: Reservation;
  onViewDetails: (r: Reservation) => void;
  onEdit: (r: Reservation) => void;
  onConfirm: (r: Reservation) => void;
  onReject: (r: Reservation) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onViewDetails(reservation)}
        className="p-1.5 text-info-400 hover:bg-info-500/10 rounded transition-colors"
        title="Bekijk details"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      
      <button
        onClick={() => onEdit(reservation)}
        className="p-1.5 text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
        title="Bewerken"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {reservation.status === 'pending' && (
        <>
          <button
            onClick={() => onConfirm(reservation)}
            className="p-1.5 text-success-400 hover:bg-success-500/10 rounded transition-colors"
            title="Bevestigen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          
          <button
            onClick={() => onReject(reservation)}
            className="p-1.5 text-error-400 hover:bg-error-500/10 rounded transition-colors"
            title="Afwijzen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// VOORBEELD 2: Geavanceerde Column Filters (in header)
// ============================================================

/*
  Voor nog meer controle kun je filters direct in de kolom headers plaatsen:
*/

function ColumnHeaderWithFilter({
  column,
  title
}: {
  column: any;
  title: string;
}) {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div className="space-y-2">
      {/* Sort control */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-primary-500"
        onClick={column.getToggleSortingHandler()}
      >
        <span>{title}</span>
        {column.getIsSorted() === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        )}
      </div>

      {/* Filter input (optioneel zichtbaar) */}
      {column.getCanFilter() && showFilter && (
        <input
          type="text"
          value={(column.getFilterValue() ?? '') as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={`Filter ${title.toLowerCase()}...`}
          className="w-full px-2 py-1 text-xs bg-bg-input border border-border-default rounded"
        />
      )}
    </div>
  );
}

// ============================================================
// TIPS & BEST PRACTICES
// ============================================================

/*
  1. PERFORMANCE:
     - Gebruik useMemo voor column definitions
     - Gebruik React.memo voor row components als je duizenden rows hebt
     - Overweeg virtualization (@tanstack/react-virtual) voor >1000 rows

  2. ACCESSIBILITY:
     - Voeg aria-labels toe aan sorteer knoppen
     - Gebruik semantic HTML (<table>, <thead>, <tbody>)
     - Test keyboard navigation

  3. UX:
     - Bewaar filter/sort state in URL params voor deelbare links
     - Toon loading state tijdens data fetch
     - Voeg "rows per page" selector toe
     - Implementeer "jump to page" functionaliteit

  4. STYLING:
     - Gebruik sticky header voor lange tabellen
     - Highlight gesorteerde kolom
     - Zebra striping voor leesbaarheid
     - Hover effect op rows

  5. MOBILE:
     - Maak tabel horizontaal scrollbaar
     - Overweeg card layout voor kleine schermen
     - Hide non-essential columns op mobile
*/
