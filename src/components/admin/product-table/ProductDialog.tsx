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

export interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  product?: Product;
  editValues: Partial<Product>;
  onEditChange: (values: Partial<Product>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onMediaUpload: (productId: string, file: File) => Promise<void>;
  onDeleteMedia: (productId: string, type: "image" | "video") => void;
  onMediaClick?: (type: "image" | "video", url: string) => void;
  isSaving?: boolean;
}

// Add timestamp to URLs to prevent caching
const addVersionToUrl = (url: string) => {
  if (!url) return url;
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
};

export function ProductDialog({
  open,
  onOpenChange,
  mode,
  product,
  editValues,
  onEditChange,
  onSave,
  onCancel,
  onMediaUpload,
  onDeleteMedia,
  onMediaClick,
  isSaving = false,
}: ProductDialogProps) {
  const productId = mode === 'edit' ? product?.id : 'temp';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Product' : 'Edit Product'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Form Fields */}
          <div className="grid gap-4">
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

            <div className="grid grid-cols-3 gap-4">
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

          {/* Media Section - Now at the bottom */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Media</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Image</Label>
                <div className="relative group w-24">
                  {editValues.image_url ? (
                    <div className="relative">
                      <img
                        src={addVersionToUrl(editValues.image_url)}
                        alt={editValues.name || 'Product'}
                        className="h-24 w-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => onMediaClick?.("image", editValues.image_url!)}
                      />
                    </div>
                  ) : (
                    <FileUpload
                      onUploadComplete={async (file: File) => {
                        try {
                          await onMediaUpload(productId, file);
                        } catch (error) {
                          console.error('Error uploading media:', error);
                        }
                      }}
                      accept="image/*"
                      bucket="media"
                      className="w-24 h-24"
                      skipUpload={true}
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 absolute -top-2 -right-2 hidden group-hover:flex"
                    onClick={() => onDeleteMedia(productId, 'image')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Video</Label>
                <div className="relative group w-24">
                  {editValues.video_url ? (
                    <div className="relative">
                      {editValues.image_url ? (
                        <div className="relative">
                          <img
                            src={addVersionToUrl(editValues.image_url)}
                            alt={`${editValues.name || 'Product'} preview`}
                            className="h-24 w-24 object-cover rounded-lg cursor-pointer"
                            onClick={() => onMediaClick?.("video", editValues.video_url!)}
                          />
                        </div>
                      ) : (
                        <video
                          src={addVersionToUrl(editValues.video_url)}
                          className="h-24 w-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => onMediaClick?.("video", editValues.video_url!)}
                        />
                      )}
                    </div>
                  ) : (
                    <FileUpload
                      onUploadComplete={async (file: File) => {
                        try {
                          await onMediaUpload(productId, file);
                        } catch (error) {
                          console.error('Error uploading media:', error);
                        }
                      }}
                      accept="video/*"
                      bucket="media"
                      className="w-24 h-24"
                      skipUpload={true}
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 absolute -top-2 -right-2 hidden group-hover:flex"
                    onClick={() => onDeleteMedia(productId, 'video')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
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
              mode === 'add' ? 'Add Product' : 'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}