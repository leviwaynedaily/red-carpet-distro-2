import { Tables } from "@/integrations/supabase/types";
import { AdminProductCard } from "../AdminProductCard";
import { ProductTableCell } from "./ProductTableCell";
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
  uploadingMedia: { [key: string]: { isUploading: boolean; status: string } };
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
  uploadingMedia,
}: ProductMobileGridProps) {
  const handleEditStart = async (product: Product) => {
    console.log('ProductMobileGrid: Starting edit for product:', product.id);
    await onEditStart(product);
  };

  const handleDelete = (id: string) => {
    console.log('ProductMobileGrid: Deleting product:', id);
    onDelete(id);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <div key={product.id} className="bg-white p-4 rounded-lg shadow">
          <AdminProductCard
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
        </div>
      ))}
    </div>
  );
}