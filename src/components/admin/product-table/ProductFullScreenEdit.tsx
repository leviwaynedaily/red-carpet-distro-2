import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileUpload } from "@/components/ui/file-upload";

type Product = Tables<"products">;

interface ProductFullScreenEditProps {
  product: Product;
  editValues: Partial<Product>;
  onEditChange: (values: Partial<Product>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  isSaving?: boolean;
}

export function ProductFullScreenEdit({
  product,
  editValues,
  onEditChange,
  onSave,
  onCancel,
  onMediaUpload,
  onDeleteMedia,
  isSaving,
}: ProductFullScreenEditProps) {
  const isMobile = useIsMobile();

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Edit Product</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6 pb-24">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editValues.name || ""}
              onChange={(e) => onEditChange({ ...editValues, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editValues.description || ""}
              onChange={(e) => onEditChange({ ...editValues, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strain">Strain</Label>
            <Input
              id="strain"
              value={editValues.strain || ""}
              onChange={(e) => onEditChange({ ...editValues, strain: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Media</Label>
            <div className="space-y-4">
              <div>
                <Label>Image</Label>
                <FileUpload
                  accept="image/*"
                  onUploadComplete={(file) => onMediaUpload(product.id, file)}
                  onDelete={() => onDeleteMedia(product.id, "image")}
                  value={editValues.image_url}
                  skipUpload={true}
                />
              </div>
              <div>
                <Label>Video</Label>
                <FileUpload
                  accept="video/*"
                  onUploadComplete={(file) => onMediaUpload(product.id, file)}
                  onDelete={() => onDeleteMedia(product.id, "video")}
                  value={editValues.video_url}
                  skipUpload={true}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regular_price">Price</Label>
              <Input
                id="regular_price"
                type="number"
                value={editValues.regular_price || ""}
                onChange={(e) =>
                  onEditChange({
                    ...editValues,
                    regular_price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_price">Shipping</Label>
              <Input
                id="shipping_price"
                type="number"
                value={editValues.shipping_price || ""}
                onChange={(e) =>
                  onEditChange({
                    ...editValues,
                    shipping_price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={editValues.stock || ""}
              onChange={(e) =>
                onEditChange({
                  ...editValues,
                  stock: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}