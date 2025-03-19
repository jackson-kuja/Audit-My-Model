import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../pages/Dashboard';

// Shadcn UI components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  render?: (row: Task) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  onRowClick?: (id: string) => void;
}

export function DataTable<T extends Task>({ data, columns, onRowClick }: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: number) => {
    setRowsPerPage(value);
    setPage(0);
  };

  const handleRowClick = (id: string) => {
    if (onRowClick) {
      onRowClick(id);
    } else {
      navigate(`/audit/${id}`);
    }
  };

  // For pagination
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Calculate total pages
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.id}
                  className={column.align === 'right' ? 'text-right' : 
                           column.align === 'center' ? 'text-center' : 'text-left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow 
                  key={row.id} 
                  onClick={() => handleRowClick(row.id)}
                  className="cursor-pointer hover:bg-accent"
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column.id} 
                      className={column.align === 'right' ? 'text-right' : 
                               column.align === 'center' ? 'text-center' : 'text-left'}
                    >
                      {column.render ? column.render(row) : (row as any)[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Custom Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, data.length)} of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeRowsPerPage(5)}
              className={rowsPerPage === 5 ? "bg-accent" : ""}
            >
              5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeRowsPerPage(10)}
              className={rowsPerPage === 10 ? "bg-accent" : ""}
            >
              10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeRowsPerPage(25)}
              className={rowsPerPage === 25 ? "bg-accent" : ""}
            >
              25
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {page + 1} of {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 