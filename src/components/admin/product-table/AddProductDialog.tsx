import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

type Product = Tables<"products">;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => Promise<boolean>;
  isSaving?: boolean;
}

export function AddProductDialog({
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: AddProductDialogProps) {
  const isMobile = useIsMobile();
  const [values, setValues] = useState<Partial<Product>>({
    name: "",
    description: "",
    strain: "",
    stock: 0,
    regular_price: 0,
    shipping_price: 0,
    image_url: "",
    video_url: "",
  });

  const handleVideoUpload = async (url: string) => {
    try {
      // Create a video element to generate thumbnail
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
        video.load();
      });

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.95);
      });

      // Generate a unique filename for the thumbnail
      const timestamp = Date.now();
      const thumbnailPath = `products/temp/thumbnail-${timestamp}.webp`;

      // Upload the thumbnail to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(thumbnailPath, blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded thumbnail
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(thumbnailPath);

      const thumbnailUrl = publicUrlData.publicUrl;

      // Update the form values with both video and thumbnail URLs
      setValues(prev => ({
        ...prev,
        video_url: url,
        image_url: thumbnailUrl,
      }));

      toast.success('Video and thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error handling video upload:', error);
      toast.error('Failed to process video upload');
      // Still set the video URL even if thumbnail generation fails
      setValues(prev => ({
        ...prev,
        video_url: url,
      }));
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!values.name) {
        toast.error("Product name is required");
        return;
      }

      if (!values.strain) {
        toast.error("Strain name is required");
        return;
      }

      if (!values.image_url && !values.video_url) {
        toast.error("Either an image or video is required");
        return;
      }

      // Log the values being sent
      console.log("Attempting to save product with values:", values);
      
      // Ensure numeric values are properly parsed
      const productData = {
        ...values,
        stock: values.stock || 0,
        regular_price: values.regular_price || 0,
        shipping_price: values.shipping_price || 0,
      };

      const success = await onSave(productData);
      console.log("Save result:", success);

      if (success) {
        toast.success("Product added successfully");
        setValues({
          name: "",
          description: "",
          strain: "",
          stock: 0,
          regular_price: 0,
          shipping_price: 0,
          image_url: "",
          video_url: "",
        });
      } else {
        // If onSave returns false, show error
        toast.error("Failed to add product. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("An error occurred while saving the product");
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (isSaving) return; // Prevent closing while saving
        if (!newOpen) {
          // Reset form when closing
          setValues({
            name: "",
            description: "",
            strain: "",
            stock: 0,
            regular_price: 0,
            shipping_price: 0,
            image_url: "",
            video_url: "",
          });
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent 
        className={`
          ${isMobile ? 'w-full h-[95vh] max-w-none md:h-auto md:max-w-2xl p-3' : 'max-w-2xl p-6'} 
          overflow-y-auto
        `}
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside while saving
          if (isSaving) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className={isMobile ? 'mb-2 space-y-1' : 'mb-4'}>
          <DialogTitle className="text-lg">Add New Product</DialogTitle>
          <p className="text-xs text-muted-foreground">Fields marked with * are required</p>
        </DialogHeader>
        <div className={`grid ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className="grid gap-1">
            <Label htmlFor="name" className="flex items-center gap-1 text-sm">
              Name<span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              disabled={isSaving}
              placeholder="Enter product name"
              className={`h-8 text-sm ${!values.name ? "border-destructive" : ""}`}
            />
            {!values.name && (
              <p className="text-xs text-destructive">Required</p>
            )}
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="strain" className="flex items-center gap-1 text-sm">
              Strain<span className="text-destructive">*</span>
            </Label>
            <Input
              id="strain"
              value={values.strain}
              onChange={(e) => setValues({ ...values, strain: e.target.value })}
              disabled={isSaving}
              placeholder="Enter strain name"
              className={`h-8 text-sm ${!values.strain ? "border-destructive" : ""}`}
            />
            {!values.strain && (
              <p className="text-xs text-destructive">Required</p>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              disabled={isSaving}
              placeholder="Enter product description"
              className={`${isMobile ? 'min-h-[40px] text-sm' : 'min-h-[100px]'}`}
            />
          </div>

          <div className={`grid grid-cols-3 gap-2`}>
            <div className="grid gap-1">
              <Label htmlFor="stock" className="text-sm">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={values.stock?.toString()}
                onChange={(e) => setValues({ ...values, stock: parseInt(e.target.value) })}
                disabled={isSaving}
                min="0"
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="regular_price" className="text-sm">Price</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="regular_price"
                  type="number"
                  step="0.01"
                  value={values.regular_price?.toString()}
                  onChange={(e) => setValues({ ...values, regular_price: parseFloat(e.target.value) })}
                  disabled={isSaving}
                  min="0"
                  placeholder="0.00"
                  className="pl-5 h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="shipping_price" className="text-sm">Shipping</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="shipping_price"
                  type="number"
                  step="0.01"
                  value={values.shipping_price?.toString()}
                  onChange={(e) => setValues({ ...values, shipping_price: parseFloat(e.target.value) })}
                  disabled={isSaving}
                  min="0"
                  placeholder="0.00"
                  className="pl-5 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="flex items-center gap-1 text-sm">
              Media<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground">(Image or Video)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {values.image_url && (
                    <img
                      src={values.image_url}
                      alt="Product"
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  )}
                  <FileUpload
                    onUploadComplete={(url) => setValues({ ...values, image_url: url })}
                    accept="image/*"
                    bucket="media"
                    folderPath="products/temp"
                    fileName="image"
                    className="w-8"
                    buttonContent={<Upload className={`h-4 w-4 ${isSaving ? 'opacity-50' : ''}`} />}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {/* Show thumbnail preview for video */}
                  {values.video_url && values.image_url && (
                    <>
                      <img
                        src={values.image_url}
                        alt="Video thumbnail"
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <video
                        src={values.video_url}
                        className="hidden" // Hide video element but keep for reference
                      />
                    </>
                  )}
                  <FileUpload
                    onUploadComplete={handleVideoUpload}
                    accept="video/*"
                    bucket="media"
                    folderPath="products/temp"
                    fileName="video"
                    className="w-8"
                    buttonContent={<Upload className={`h-4 w-4 ${isSaving ? 'opacity-50' : ''}`} />}
                  />
                </div>
                {values.video_url && (
                  <p className="text-xs text-muted-foreground mt-1">Video uploaded with preview image</p>
                )}
              </div>
            </div>
            {!values.image_url && !values.video_url && (
              <p className="text-xs text-destructive">Required</p>
            )}
          </div>
        </div>
        <div className={`flex justify-end gap-2 ${isMobile ? 'sticky bottom-0 bg-background py-2 border-t mt-2' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="h-8 text-sm">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !values.name || !values.strain || (!values.image_url && !values.video_url)}
            className="h-8 text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Product'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}