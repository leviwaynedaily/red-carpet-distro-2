import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Play, X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { addVersionToUrl } from "@/utils/mediaUtils";

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
  const [uploadingMedia, setUploadingMedia] = useState<{ isUploading: boolean; status: string }>({ 
    isUploading: false, 
    status: '' 
  });

  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                URL.revokeObjectURL(url);
                video.remove();
                resolve(blob);
              } else {
                reject(new Error('Failed to create thumbnail blob'));
              }
            },
            'image/webp',
            0.8
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          video.remove();
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        video.remove();
        reject(new Error('Error loading video'));
      };

      video.src = url;
    });
  };

  const handleMediaUpload = async (file: File) => {
    console.log('AddProductDialog: Uploading media');
    setUploadingMedia({ isUploading: true, status: 'Starting upload...' });

    try {
      const isImage = file.type.startsWith('image/');
      const extension = isImage ? 'webp' : file.name.split('.').pop() || 'mp4';
      const tempId = Date.now().toString(); // Temporary ID for file organization
      const fileName = `products/temp/${tempId}.${extension}`;

      // If it's a video, generate thumbnail first
      let thumbnailUrl = null;
      if (!isImage) {
        try {
          setUploadingMedia({ isUploading: true, status: 'Generating thumbnail...' });
          const thumbnailBlob = await generateThumbnail(file);
          
          setUploadingMedia({ isUploading: true, status: 'Uploading thumbnail...' });
          const thumbnailPath = `products/temp/${tempId}-thumbnail.webp`;
          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('media')
            .upload(thumbnailPath, thumbnailBlob);

          if (thumbnailError) throw thumbnailError;

          thumbnailUrl = supabase.storage
            .from('media')
            .getPublicUrl(thumbnailData.path).data.publicUrl;
        } catch (thumbnailError) {
          console.error('Failed to generate thumbnail:', thumbnailError);
          toast.error('Failed to generate video thumbnail, but will continue with video upload');
        }
      }

      // Upload the main media file
      setUploadingMedia({ 
        isUploading: true, 
        status: isImage ? 'Uploading image...' : 'Uploading video...' 
      });

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      const mediaUrl = supabase.storage
        .from('media')
        .getPublicUrl(data.path).data.publicUrl;

      // Update the form values
      setValues(prev => ({
        ...prev,
        video_url: !isImage ? mediaUrl : prev.video_url,
        image_url: isImage ? mediaUrl : thumbnailUrl || prev.image_url,
      }));

      toast.success(isImage ? 'Image uploaded successfully' : 'Video uploaded successfully');
    } catch (error) {
      console.error('AddProductDialog: Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploadingMedia({ isUploading: false, status: '' });
    }
  };

  const handleDeleteMedia = (type: 'image' | 'video') => {
    setValues(prev => ({
      ...prev,
      [type === 'image' ? 'image_url' : 'video_url']: '',
    }));
    toast.success('Media removed');
  };

  const handleMediaClick = (type: "image" | "video", url: string) => {
    window.open(url, "_blank");
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
          {/* Media Upload Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                Image<span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                {uploadingMedia.isUploading ? (
                  <div className="h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                    <div className="text-xs text-gray-500">{uploadingMedia.status}</div>
                  </div>
                ) : (
                  <>
                    {values.image_url ? (
                      <div className="relative group">
                        <img
                          src={addVersionToUrl(values.image_url)}
                          alt="Product preview"
                          className="h-32 w-full object-cover rounded-lg cursor-pointer"
                          onClick={() => handleMediaClick("image", values.image_url!)}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 hidden group-hover:flex"
                          onClick={() => handleDeleteMedia("image")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <FileUpload
                        onUploadComplete={handleMediaUpload}
                        accept="image/*"
                        bucket="media"
                        className="w-full h-32"
                        skipUpload={true}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Video</Label>
              <div className="relative">
                {uploadingMedia.isUploading ? (
                  <div className="h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                    <div className="text-xs text-gray-500">{uploadingMedia.status}</div>
                  </div>
                ) : (
                  <>
                    {values.video_url && (
                      <div className="relative group">
                        {values.image_url ? (
                          <div className="relative">
                            <img
                              src={addVersionToUrl(values.image_url)}
                              alt="Video preview"
                              className="h-32 w-full object-cover rounded-lg cursor-pointer"
                              onClick={() => handleMediaClick("video", values.video_url!)}
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer"
                               onClick={() => handleMediaClick("video", values.video_url!)}>
                            <Play className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 hidden group-hover:flex"
                          onClick={() => handleDeleteMedia("video")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {!values.video_url && (
                      <FileUpload
                        onUploadComplete={handleMediaUpload}
                        accept="video/*"
                        bucket="media"
                        className="w-full h-32"
                        skipUpload={true}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rest of the form fields */}
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
                value={values.stock}
                onChange={(e) => setValues({ ...values, stock: parseInt(e.target.value) || 0 })}
                disabled={isSaving}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="regular_price" className="text-sm">Price</Label>
              <Input
                id="regular_price"
                type="number"
                value={values.regular_price}
                onChange={(e) => setValues({ ...values, regular_price: parseFloat(e.target.value) || 0 })}
                disabled={isSaving}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="shipping_price" className="text-sm">Shipping</Label>
              <Input
                id="shipping_price"
                type="number"
                value={values.shipping_price}
                onChange={(e) => setValues({ ...values, shipping_price: parseFloat(e.target.value) || 0 })}
                disabled={isSaving}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}