import { Tables } from "@/integrations/supabase/types";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { ProductEditDialog } from "./ProductEditDialog";
import { useState } from "react";
import { toast } from "sonner";

type Product = Tables<"products">;

interface ProductMobileGridProps {
  products: Product[];
  onEditStart: (product: Product) => Promise<void>;
  onEditSave: () => Promise<void>;
  onEditCancel: () => void;
  onEditChange: (values: Partial<Product>) => void;
  editingProduct: string | null;
  editValues: Partial<Product>;
  onDelete: (id: string) => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  onMediaClick: (type: "image" | "video", url: string) => void;
}

export function ProductMobileGrid({
  products,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  editingProduct,
  editValues,
  onDelete,
  onMediaUpload,
  onDeleteMedia,
  onMediaClick,
}: ProductMobileGridProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = async (product: Product) => {
    console.log('ProductMobileGrid: Starting edit for product:', product.id);
    setSelectedProduct(product);
    await onEditStart(product);
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    console.log('ProductMobileGrid: Saving edit for product:', selectedProduct?.id);
    setIsSaving(true);
    try {
      await onEditSave();
      setShowEditDialog(false);
      setSelectedProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductMobileGrid: Error saving product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    console.log('ProductMobileGrid: Canceling edit');
    onEditCancel();
    setShowEditDialog(false);
    setSelectedProduct(null);
  };

  const handleDelete = (id: string) => {
    console.log('ProductMobileGrid: Deleting product:', id);
    onDelete(id);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <AdminProductCard
            key={product.id}
            {...product}
            onUpdate={() => {
              console.log('ProductMobileGrid: Update clicked for product:', product.id);
              handleEditStart(product);
            }}
            onDelete={(id) => {
              console.log('ProductMobileGrid: Delete clicked for product:', id);
              handleDelete(id);
            }}
            onEdit={() => {
              console.log('ProductMobileGrid: Edit clicked for product:', product.id);
              handleEditStart(product);
            }}
            data-product-id={product.id}
          />
        ))}
      </div>

      {selectedProduct && (
        <ProductEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          product={selectedProduct}
          editValues={editValues}
          onEditChange={onEditChange}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          onMediaUpload={onMediaUpload}
          onDeleteMedia={onDeleteMedia}
          isSaving={isSaving}
        />
      )}
    </>
  );
}