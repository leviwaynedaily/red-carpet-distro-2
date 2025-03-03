import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Play, Upload, Trash2, Image, X, Loader2 } from "lucide-react";
import { formatPrice } from "@/utils/formatPrice";
import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { addVersionToUrl } from "@/utils/mediaUtils";

type Product = Tables<"products">;

export interface ProductTableCellProps {
  key: string;
  column: string;
  product: Product;
  isEditing: boolean;
  editValues: Partial<Product>;
  onEditChange: (values: Partial<Product>) => void;
  onMediaUpload?: (productId: string, file: File) => Promise<void>;
  onDeleteMedia?: (productId: string, type: "image" | "video") => void;
  onMediaClick?: (type: "image" | "video", url: string) => void;
  isUploading?: { isUploading: boolean; status: string };
}

export function ProductTableCell({
  column,
  product,
  isEditing,
  editValues,
  onEditChange,
  onMediaUpload,
  onDeleteMedia,
  onMediaClick,
  isUploading,
}: ProductTableCellProps) {
  const handleInputChange = (field: keyof Product, value: string | number) => {
    console.log('ProductTableCell: Updating field:', field, 'with value:', value);
    onEditChange({ ...editValues, [field]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextInput = e.shiftKey 
        ? e.currentTarget.parentElement?.previousElementSibling?.querySelector('input')
        : e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
      if (nextInput instanceof HTMLElement) {
        nextInput.focus();
      }
    }
  };

  const renderCell = (): ReactNode => {
    switch (column) {
      case 'name':
      case 'strain':
      case 'description':
        return isEditing ? (
          <Input
            value={editValues[column as keyof Product]?.toString() || ''}
            onChange={(e) => handleInputChange(column as keyof Product, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          />
        ) : (
          product[column as keyof Product]?.toString() || '-'
        );

      case 'image':
        return (
          <div className="relative">
            {isUploading?.isUploading ? (
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                <div className="absolute -bottom-6 whitespace-nowrap text-xs text-gray-500">
                  {isUploading.status}
                </div>
              </div>
            ) : (
              <>
                {product.image_url ? (
                  <div className="relative group">
                    <img
                      src={addVersionToUrl(product.image_url)}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded-lg cursor-pointer"
                      onClick={() => onMediaClick?.("image", product.image_url!)}
                    />
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 hidden group-hover:flex"
                        onClick={() => onDeleteMedia?.(product.id, "image")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : isEditing ? (
                  <FileUpload
                    onUploadComplete={(file) => onMediaUpload?.(product.id, file)}
                    accept="image/*"
                    bucket="media"
                    className="w-[120px]"
                    skipUpload={true}
                  />
                ) : null}
              </>
            )}
          </div>
        );

      case 'video_url':
        return (
          <div className="relative">
            {isUploading?.isUploading ? (
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                <div className="absolute -bottom-6 whitespace-nowrap text-xs text-gray-500">
                  {isUploading.status}
                </div>
              </div>
            ) : (
              <div className="relative group">
                {product.video_url && (
                  <div className="relative">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer"
                         onClick={() => onMediaClick?.("video", product.video_url!)}>
                      <Play className="h-6 w-6 text-gray-400" />
                    </div>
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 hidden group-hover:flex"
                        onClick={() => onDeleteMedia?.(product.id, "video")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                {isEditing && !product.video_url && (
                  <FileUpload
                    onUploadComplete={(file) => onMediaUpload?.(product.id, file)}
                    accept="video/*"
                    bucket="media"
                    className="w-[120px]"
                    skipUpload={true}
                  />
                )}
              </div>
            )}
          </div>
        );

      case 'stock':
        return isEditing ? (
          <Input
            type="number"
            value={editValues.stock?.toString() || '0'}
            onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          />
        ) : (
          product.stock?.toString() || '-'
        );

      case 'regular_price':
      case 'shipping_price':
        return isEditing ? (
          <Input
            type="number"
            value={editValues[column as keyof Product]?.toString() || '0'}
            onChange={(e) => handleInputChange(column as keyof Product, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          />
        ) : (
          formatPrice(product[column as keyof Product] as number)
        );

      default:
        return null;
    }
  };

  return (
    <TableCell onClick={(e) => e.stopPropagation()}>
      {renderCell()}
    </TableCell>
  );
}