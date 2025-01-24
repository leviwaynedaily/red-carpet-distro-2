import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Product = Tables<"products">;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  onSave,
}: AddProductDialogProps) {
  const isMobile = useIsMobile();
  const [values, setValues] = useState<Partial<Product>>({
    name: "",
    description: "",
    strain: "",
    stock: 0,
    regular_price: 0,
    shipping_price: 0,
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleSave = () => {
    if (!values.name) {
      toast.error("Product name is required");
      return;
    }
    if (!videoUrl) {
      toast.error("Video is required");
      return;
    }
    onSave({ ...values, video_url: videoUrl });
    setValues({
      name: "",
      description: "",
      strain: "",
      stock: 0,
      regular_price: 0,
      shipping_price: 0,
    });
    setVideoUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "max-w-2xl p-4 pt-8" : "max-w-2xl"}>
        <DialogHeader className={isMobile ? "mb-2" : ""}>
          <DialogTitle className={isMobile ? "text-lg" : ""}>Add New Product</DialogTitle>
        </DialogHeader>
        <div className={`grid ${isMobile ? 'gap-3' : 'gap-4'} py-2`}>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </div>
          
          <div className="grid gap-1.5">
            <Label htmlFor="strain">Strain</Label>
            <Input
              id="strain"
              value={values.strain}
              onChange={(e) => setValues({ ...values, strain: e.target.value })}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              className={isMobile ? "h-16" : ""}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Video</Label>
            <div className="flex items-center gap-2">
              <FileUpload
                onUploadComplete={(url) => setVideoUrl(url)}
                accept="video/*"
                bucket="media"
                folderPath="products/temp"
                fileName="video"
                className="w-8"
                buttonContent={<Upload className="h-4 w-4" />}
              />
              {videoUrl && (
                <span className="text-sm text-muted-foreground">
                  Video uploaded successfully
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={values.stock?.toString()}
                onChange={(e) => setValues({ ...values, stock: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="regular_price">Price</Label>
              <Input
                id="regular_price"
                type="number"
                step="0.01"
                value={values.regular_price?.toString()}
                onChange={(e) => setValues({ ...values, regular_price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="shipping_price">Shipping Price</Label>
            <Input
              id="shipping_price"
              type="number"
              step="0.01"
              value={values.shipping_price?.toString()}
              onChange={(e) => setValues({ ...values, shipping_price: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size={isMobile ? "sm" : "default"}>
            Cancel
          </Button>
          <Button onClick={handleSave} size={isMobile ? "sm" : "default"}>
            Add Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}