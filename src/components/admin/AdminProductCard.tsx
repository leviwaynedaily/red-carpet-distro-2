import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Trash2, Image } from "lucide-react";

interface AdminProductCardProps {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  strain?: string;
  stock?: number;
  regular_price?: number;
  shipping_price?: number;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  'data-product-id'?: string;
}

export const AdminProductCard = ({
  id,
  name,
  description,
  image_url,
  strain,
  stock,
  regular_price,
  shipping_price,
  onDelete,
  onEdit,
  'data-product-id': dataProductId,
}: AdminProductCardProps) => {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('AdminProductCard: Edit clicked for product:', id);
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('AdminProductCard: Delete clicked for product:', id);
    onDelete(id);
  };

  return (
    <Card 
      className="overflow-hidden"
      data-product-id={dataProductId}
    >
      <CardHeader className="p-0 relative aspect-square">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-8 h-8"
            onClick={handleEdit}
            aria-label="Edit product"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="rounded-full w-8 h-8"
            onClick={handleDelete}
            aria-label="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-bold truncate">{name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{description}</p>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          {strain && <div>Strain: {strain}</div>}
          {stock !== undefined && <div>Stock: {stock}</div>}
          {regular_price !== undefined && <div>Price: {formatPrice(regular_price)}</div>}
          {shipping_price !== undefined && <div>Shipping: {formatPrice(shipping_price)}</div>}
        </div>
      </CardContent>
    </Card>
  );
};