import { Tables } from "@/integrations/supabase/types";
import { TableRow } from "@/components/ui/table";
import { ProductTableCell } from "./ProductTableCell";
import { ProductTableActions } from "./ProductTableActions";
import { ProductEditDialog } from "./ProductEditDialog";
import { ProductFullScreenEdit } from "./ProductFullScreenEdit";
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type Product = Tables<"products">;

export interface ProductTableRowProps {
  product: Product;
  editingProduct: string | null;
  editValues: Partial<Product>;
  visibleColumns: string[];
  onEditStart: (product: Product) => Promise<void>;
  onEditSave: () => Promise<void>;
  onEditCancel: () => void;
  onEditChange: (values: Partial<Product>) => void;
  onDelete: (id: string) => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  onMediaClick: (type: "image" | "video", url: string) => void;
}

export function ProductTableRow({
  product,
  visibleColumns,
  editingProduct,
  editValues,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  onMediaUpload,
  onDeleteMedia,
  onMediaClick,
}: ProductTableRowProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

  const handleEdit = () => {
    console.log('ProductTableRow: Starting edit for product:', product.id);
    onEditStart(product);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    console.log('ProductTableRow: Saving product:', product.id);
    setIsSaving(true);
    try {
      await onEditSave();
      setShowEditDialog(false);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductTableRow: Error saving product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('ProductTableRow: Canceling edit');
    onEditCancel();
    setShowEditDialog(false);
  };

  return (
    <>
      <TableRow key={product.id}>
        {visibleColumns.map((column) => (
          <ProductTableCell
            key={column}
            column={column}
            product={product}
            isEditing={editingProduct === product.id}
            editValues={editValues}
            onEditChange={onEditChange}
            onMediaClick={onMediaClick}
            onDeleteMedia={onDeleteMedia}
            onMediaUpload={onMediaUpload}
          />
        ))}
        <ProductTableActions
          productId={product.id}
          isEditing={editingProduct === product.id}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={onDelete}
        />
      </TableRow>

      {showEditDialog && (
        isMobile ? (
          <ProductFullScreenEdit
            product={product}
            editValues={editValues}
            onEditChange={onEditChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onMediaUpload={onMediaUpload}
            onDeleteMedia={onDeleteMedia}
            isSaving={isSaving}
          />
        ) : (
          <ProductEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            product={product}
            editValues={editValues}
            onEditChange={onEditChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onMediaUpload={onMediaUpload}
            onDeleteMedia={onDeleteMedia}
            isSaving={isSaving}
          />
        )
      )}
    </>
  );
}