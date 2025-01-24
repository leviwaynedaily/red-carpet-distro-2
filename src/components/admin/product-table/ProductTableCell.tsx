import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Play, Upload, Trash2, Image } from "lucide-react";
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

type Product = Tables<"products"> & {
  media?: {
    original: string;
    webp: string;
  };
};

interface ProductTableCellProps {
  column: string;
  product: Product;
  isEditing: boolean;
  editValues: Partial<Product>;
  onEditChange: (values: Partial<Product>) => void;
  onMediaClick?: (type: 'image' | 'video', url: string) => void;
  onDeleteMedia?: (productId: string, type: 'image' | 'video') => void;
  onImageUpload?: (productId: string, url: string) => void;
  onVideoUpload?: (productId: string, url: string) => void;
}

export function ProductTableCell({
  column,
  product,
  isEditing,
  editValues,
  onEditChange,
  onMediaClick,
  onDeleteMedia,
  onImageUpload,
  onVideoUpload,
}: ProductTableCellProps) {
  const handleInputChange = (field: keyof Product, value: string | number | string[]) => {
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {product.image_url ? (
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick?.('image', product.image_url!);
                  }}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-md" />
                </div>
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMedia?.(product.id, 'image');
                    }}
                    tabIndex={0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              isEditing && (
                <div className="relative w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md">
                  <Image className="h-6 w-6 text-gray-400" />
                </div>
              )
            )}
            {isEditing && (
              <FileUpload
                onUploadComplete={(url) => onImageUpload?.(product.id, url)}
                accept="image/*"
                bucket="media"
                folderPath={`products/${product.id}`}
                fileName="image"
                className="w-8"
                buttonContent={<Upload className="h-4 w-4" />}
              />
            )}
          </div>
        );

      case 'video_url':
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {product.video_url && (
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick?.('video', product.video_url!);
                  }}
                >
                  <img
                    src={product.media?.webp || product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors rounded-md">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMedia?.(product.id, 'video');
                    }}
                    tabIndex={0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {isEditing && (
              <FileUpload
                onUploadComplete={(url) => onVideoUpload?.(product.id, url)}
                accept="video/*"
                bucket="media"
                folderPath={`products/${product.id}`}
                fileName="video"
                className="w-8"
                buttonContent={<Upload className="h-4 w-4" />}
              />
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
          product.stock?.toString() || '0'
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