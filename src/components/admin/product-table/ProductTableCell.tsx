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

type Product = Tables<"products">;

interface ProductTableCellProps {
  column: string;
  product: Product & { categories?: string[] };
  isEditing: boolean;
  editValues: Partial<Product> & { categories?: string[] };
  categories?: { id: string; name: string; }[];
  onEditChange: (values: Partial<Product> & { categories?: string[] }) => void;
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
  categories,
  onEditChange,
  onMediaClick,
  onDeleteMedia,
  onImageUpload,
  onVideoUpload,
}: ProductTableCellProps) {
  // Fetch current product categories
  const { data: productCategories } = useQuery({
    queryKey: ['product_categories', product.id],
    queryFn: async () => {
      console.log('ProductTableCell: Fetching categories for product:', product.id);
      const { data, error } = await supabase
        .from('product_categories')
        .select('categories(name)')
        .eq('product_id', product.id);

      if (error) {
        console.error('ProductTableCell: Error fetching product categories:', error);
        throw error;
      }

      const categoryNames = data.map(pc => pc.categories?.name).filter(Boolean) as string[];
      console.log('ProductTableCell: Retrieved categories:', categoryNames);
      return categoryNames;
    },
    enabled: isEditing,
  });

  const handleInputChange = (field: keyof Product, value: string | number | string[]) => {
    console.log('ProductTableCell: Updating field:', field, 'with value:', value);
    onEditChange({ ...editValues, [field]: value });
  };

  const handleCategoryChange = (categoryName: string) => {
    console.log('ProductTableCell: Category selected:', categoryName);
    const currentCategories = editValues.categories || productCategories || [];
    const newCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter(cat => cat !== categoryName)
      : [...currentCategories, categoryName];
    
    onEditChange({ ...editValues, categories: newCategories });
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick?.('image', product.image_url!);
                  }}
                  tabIndex={isEditing ? 0 : -1}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </Button>
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
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-md">
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick?.('video', product.video_url!);
                  }}
                  tabIndex={isEditing ? 0 : -1}
                >
                  <Play className="h-4 w-4" />
                </Button>
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

      case 'categories':
        return isEditing ? (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Select
                  value={editValues.categories?.includes(category.name) ? category.name : undefined}
                  onValueChange={() => handleCategoryChange(category.name)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={category.name} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={category.name}>{category.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <div>{product.categories?.join(", ") || '-'}</div>
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