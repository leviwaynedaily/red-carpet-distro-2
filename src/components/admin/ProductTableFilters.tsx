import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Download, Plus, Settings2, Upload, MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Column {
  key: string;
  label: string;
}

interface ProductTableFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  columns: Column[];
  visibleColumns: string[];
  onColumnToggle: (columnKey: string) => void;
  showColumnToggle?: boolean;
  onAddProduct: () => void;
  onExport: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
}

export function ProductTableFilters({
  searchQuery,
  onSearchChange,
  columns,
  visibleColumns,
  onColumnToggle,
  showColumnToggle = true,
  onAddProduct,
  onExport,
  onImport,
  onDownloadTemplate,
}: ProductTableFiltersProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-[300px]"
        />
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumns.includes(column.key)}
                  onCheckedChange={() => onColumnToggle(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {isMobile ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={onAddProduct} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onDownloadTemplate} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
            <Button onClick={onImport} variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={onAddProduct} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </>
        )}
      </div>
    </div>
  );
}