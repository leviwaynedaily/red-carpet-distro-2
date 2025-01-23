import { Tables } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductTableRow } from "./ProductTableRow";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Product = Tables<"products">;

interface ProductTableProps {
  products: (Product & { categories?: string[] })[];
  editingProduct: string | null;
  editValues: Partial<Product> & { categories?: string[] };
  categories?: { id: string; name: string; }[];
  visibleColumns: string[];
  onEditStart: (product: Product & { categories?: string[] }) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (values: Partial<Product> & { categories?: string[] }) => void;
  onDelete: (id: string) => void;
  onImageUpload: (productId: string, url: string) => void;
  onVideoUpload: (productId: string, url: string) => void;
  onDeleteMedia: (productId: string, type: 'image' | 'video') => void;
  onMediaClick: (type: 'image' | 'video', url: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}

export function ProductTable({
  products,
  visibleColumns,
  editingProduct,
  editValues,
  categories,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  onImageUpload,
  onVideoUpload,
  onDeleteMedia,
  onMediaClick,
  sortConfig,
  onSort,
}: ProductTableProps) {
  const COLUMNS = [
    { key: "name", label: "Name", sortable: true },
    { key: "strain", label: "Strain", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "image", label: "Image", sortable: false },
    { key: "video_url", label: "Video", sortable: false },
    { key: "categories", label: "Categories", sortable: false },
    { key: "stock", label: "Stock", sortable: true },
    { key: "regular_price", label: "Price", sortable: true },
    { key: "shipping_price", label: "Shipping", sortable: true },
  ];

  // Fetch categories
  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.filter(col => visibleColumns.includes(col.key)).map((column) => (
              <TableHead key={column.key}>
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => onSort(column.key)}
                    className="h-8 flex items-center gap-1 hover:bg-transparent"
                  >
                    {column.label}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              visibleColumns={visibleColumns}
              isEditing={editingProduct === product.id}
              editValues={editValues}
              categories={categories || fetchedCategories}
              onEditStart={onEditStart}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onEditChange={onEditChange}
              onDelete={onDelete}
              onImageUpload={onImageUpload}
              onVideoUpload={onVideoUpload}
              onDeleteMedia={onDeleteMedia}
              onMediaClick={onMediaClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}