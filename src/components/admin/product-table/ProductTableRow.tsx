import { Tables } from "@/integrations/supabase/types";
import { TableRow } from "@/components/ui/table";
import { ProductTableCell } from "./ProductTableCell";
import { ProductTableActions } from "./ProductTableActions";
import { ProductEditDialog } from "./ProductEditDialog";
import { ProductFullScreenEdit } from "./ProductFullScreenEdit";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Product = Tables<"products">;

interface ProductTableRowProps {
  product: Product & { categories?: string[] };
  visibleColumns: string[];
  isEditing: boolean;
  editValues: Partial<Product> & { categories?: string[] };
  categories?: { id: string; name: string; }[];
  onEditStart: (product: Product & { categories?: string[] }) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (values: Partial<Product> & { categories?: string[] }) => void;
  onDelete: (id: string) => void;
  onImageUpload: (productId: string, url: string) => void;
  onVideoUpload: (productId: string, url: string) => void;
  onDeleteMedia: (productId: string, type: 'image' | 'video') => void;
  onMediaClick: (type: 'image' | 'video', url: string) => void;
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
  onImageUpload,
  onVideoUpload,
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
    console.log('ProductTableRow: New categories:', editValues.categories);
    
    setIsSaving(true);
    try {
      // First, delete existing category associations
      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', product.id);

      if (deleteError) throw deleteError;

      // Then, insert new category associations if there are any categories selected
      if (editValues.categories && editValues.categories.length > 0) {
        // Get category IDs for the selected category names
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .in('name', editValues.categories);

        if (categoryError) throw categoryError;

        if (categoryData && categoryData.length > 0) {
          // Create unique category associations
          const uniqueAssociations = categoryData.map(category => ({
            product_id: product.id,
            category_id: category.id
          }));

          // Use upsert instead of insert to handle potential duplicates
          const { error: insertError } = await supabase
            .from('product_categories')
            .upsert(uniqueAssociations, { 
              onConflict: 'product_id,category_id',
              ignoreDuplicates: true 
            });

          if (insertError) throw insertError;
        }
      }

      await onEditSave();
      setShowEditDialog(false);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductTableRow: Error saving categories:', error);
      toast.error('Failed to update product categories');
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
            isEditing={false}
            editValues={editValues}
            categories={categories}
            onEditChange={onEditChange}
            onMediaClick={onMediaClick}
            onDeleteMedia={onDeleteMedia}
            onImageUpload={onImageUpload}
            onVideoUpload={onVideoUpload}
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
            categories={categories}
            onEditChange={onEditChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onImageUpload={onImageUpload}
            onVideoUpload={onVideoUpload}
            onDeleteMedia={onDeleteMedia}
            isSaving={isSaving}
          />
        ) : (
          <ProductEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            product={product}
            editValues={editValues}
            categories={categories}
            onEditChange={onEditChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onImageUpload={onImageUpload}
            onVideoUpload={onVideoUpload}
            onDeleteMedia={onDeleteMedia}
            isSaving={isSaving}
          />
        )
      )}
    </>
  );
}