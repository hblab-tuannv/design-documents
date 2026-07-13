'use client'

import { useTranslations } from '@fuma-translate/react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type CellProps = { children?: ReactNode; style?: CSSProperties }
type RowData = { tds: ReactElement<CellProps>[]; texts: string[] }

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node))
    return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function childrenOf(node: ReactNode): ReactNode[] {
  return isValidElement(node)
    ? Children.toArray((node.props as { children?: ReactNode }).children)
    : []
}

function findByTag(nodes: ReactNode[], tag: string): ReactElement<CellProps>[] {
  return nodes.filter(
    (node): node is ReactElement<CellProps> =>
      isValidElement(node) && node.type === tag,
  )
}

function compareText(a: string, b: string): number {
  const na = Number(a.replaceAll(',', ''))
  const nb = Number(b.replaceAll(',', ''))
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb))
    return na - nb
  return a.localeCompare(b, undefined, { numeric: true })
}

export function DataTable(props: ComponentProps<'table'>) {
  // translations are defined in lib/layout.shared.tsx under "(data table)"
  const t = useTranslations({ note: 'data table' })
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const parsed = useMemo(() => {
    const sections = Children.toArray(props.children)
    const thead = findByTag(sections, 'thead')[0]
    const tbody = findByTag(sections, 'tbody')[0]
    const headerRow = thead ? findByTag(childrenOf(thead), 'tr')[0] : undefined
    const headers = headerRow ? findByTag(childrenOf(headerRow), 'th') : []
    const rows: RowData[] = tbody
      ? findByTag(childrenOf(tbody), 'tr').map((tr) => {
          const tds = findByTag(childrenOf(tr), 'td')
          return { tds, texts: tds.map((td) => textOf(td).trim()) }
        })
      : []
    return { headers, labels: headers.map((th) => textOf(th).trim()), rows }
  }, [props.children])

  const columns = useMemo<ColumnDef<RowData>[]>(
    () =>
      parsed.headers.map(
        (th, i): ColumnDef<RowData> => ({
          id: String(i),
          accessorFn: (row) => row.texts[i] ?? '',
          sortingFn: (a, b, id) =>
            compareText(a.getValue<string>(id), b.getValue<string>(id)),
          header: ({ column }) => (
            <Button
              variant='ghost'
              className='-ml-2.5'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              {th.props.children}
              <ArrowUpDown />
            </Button>
          ),
          cell: ({ row }) => {
            const td = row.original.tds[i]
            return <div style={td?.props.style}>{td?.props.children}</div>
          },
        }),
      ),
    [parsed.headers],
  )

  const table = useReactTable({
    data: parsed.rows,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter, columnVisibility },
    initialState: { pagination: { pageSize: 10 } },
  })

  if (parsed.headers.length === 0)
    return (
      <div className='prose-no-margin relative my-6 overflow-auto'>
        <table {...props} />
      </div>
    )

  return (
    <div className='not-prose w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder={t('Filter...')}
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant='outline' className='ml-auto'>
                {t('Columns')} <ChevronDown />
              </Button>
            }
          />
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {parsed.labels[Number(column.id)] || column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className='px-4'>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='px-4'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {t('No results.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between px-2 py-4'>
        <div className='flex-1 text-muted-foreground text-sm'>
          {t('{count} of {total} row(s)', {
            variables: {
              count: String(table.getFilteredRowModel().rows.length),
              total: String(parsed.rows.length),
            },
          })}
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='font-medium text-sm'>{t('Rows per page')}</p>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size='sm' className='w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-[100px] items-center justify-center font-medium text-sm'>
            {t('Page {page} of {total}', {
              variables: {
                page: String(table.getState().pagination.pageIndex + 1),
                total: String(table.getPageCount()),
              },
            })}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='icon'
              className='hidden lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>{t('Go to first page')}</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>{t('Go to previous page')}</span>
              <ChevronLeft />
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>{t('Go to next page')}</span>
              <ChevronRight />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='hidden lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>{t('Go to last page')}</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
