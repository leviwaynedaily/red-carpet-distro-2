import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { FileUpload } from "@/components/ui/file-upload";
import { Upload, Trash2, Loader2, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Product = Tables<"products">;

export interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  editValues: Partial<Product>;
  onEditChange: (values: Partial<Product>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  isSaving?: boolean;
}

// Add timestamp to URLs to prevent caching
const addVersionToUrl = (url: string) => {
  if (!url) return url;
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
};

export function ProductEditDialog({
  open,
  onOpenChange,
  product,
  editValues,
  onEditChange,
  onSave,
  onCancel,
  onMediaUpload,
  onDeleteMedia,
  isSaving = false,
}: ProductEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Image</Label>
            <div className="mt-2">
              {editValues.image_url ? (
                <div className="relative group">
                  <img
                    src={addVersionToUrl(editValues.image_url)}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 absolute top-2 right-2"
                    onClick={() => onDeleteMedia(product.id, 'image')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={async (file: File) => {
                    try {
                      await onMediaUpload(product.id, file);
                    } catch (error) {
                      console.error('Error uploading media:', error);
                    }
                  }}
                  accept="image/*"
                  bucket="media"
                  className="w-full"
                  skipUpload={true}
                />
              )}
            </div>
          </div>

          <div>
            <Label>Video</Label>
            <div className="mt-2">
              {editValues.video_url ? (
                <div className="relative group">
                  {editValues.image_url ? (
                    <div className="relative">
                      <img
                        src={addVersionToUrl(editValues.image_url)}
                        alt={`${product.name} preview`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <video
                      src={addVersionToUrl(editValues.video_url)}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 absolute top-2 right-2"
                    onClick={() => onDeleteMedia(product.id, 'video')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={async (file: File) => {
                    try {
                      await onMediaUpload(product.id, file);
                    } catch (error) {
                      console.error('Error uploading media:', error);
                    }
                  }}
                  accept="video/*"
                  bucket="media"
                  className="w-full"
                  skipUpload={true}
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editValues.name || ''}
                onChange={(e) => onEditChange({ ...editValues, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="strain">Strain</Label>
              <Input
                id="strain"
                value={editValues.strain || ''}
                onChange={(e) => onEditChange({ ...editValues, strain: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editValues.description || ''}
                onChange={(e) => onEditChange({ ...editValues, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={editValues.stock?.toString() || '0'}
                onChange={(e) => onEditChange({ ...editValues, stock: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="regular_price">Regular Price</Label>
              <Input
                id="regular_price"
                type="number"
                step="0.01"
                value={editValues.regular_price?.toString() || '0'}
                onChange={(e) => onEditChange({ ...editValues, regular_price: parseFloat(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipping_price">Shipping Price</Label>
              <Input
                id="shipping_price"
                type="number"
                step="0.01"
                value={editValues.shipping_price?.toString() || '0'}
                onChange={(e) => onEditChange({ ...editValues, shipping_price: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}