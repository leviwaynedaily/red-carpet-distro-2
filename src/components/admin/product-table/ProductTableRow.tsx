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
  product: Product & { categories?: string[] };
  visibleColumns: string[];
  isEditing: boolean;
  editValues: Partial<Product> & { categories?: string[] };
  categories?: { id: string; name: string; }[];
  onEditStart: (product: Product & { categories?: string[] }) => Promise<void>;
  onEditSave: () => Promise<void>;
  onEditCancel: () => void;
  onEditChange: (values: Partial<Product> & { categories?: string[] }) => void;
  onDelete: (id: string) => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  onMediaClick: (type: "image" | "video", url: string) => void;
  isUploading?: { isUploading: boolean; status: string };
}

export function ProductTableRow({
  product,
  visibleColumns,
  isEditing,
  editValues,
  categories,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  onMediaUpload,
  onDeleteMedia,
  onMediaClick,
  isUploading,
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
            isEditing={isEditing}
            editValues={editValues}
            onEditChange={onEditChange}
            onMediaClick={onMediaClick}
            onDeleteMedia={onDeleteMedia}
            onMediaUpload={onMediaUpload}
            isUploading={isUploading}
          />
        ))}
        <ProductTableActions
          productId={product.id}
          isEditing={isEditing}
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