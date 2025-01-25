import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { convertToWebP, isImageFile } from "@/utils/imageUtils";

interface FileUploadProps {
  onUploadComplete?: ((url: string) => void) | ((file: File) => void) | ((file: File) => Promise<void>);
  onUpload?: (url: string) => void;
  onDelete?: () => void;
  accept?: string;
  bucket?: string;
  folderPath?: string;
  fileName?: string;
  className?: string;
  buttonContent?: React.ReactNode;
  value?: string;
  skipUpload?: boolean;
}

export function FileUpload({ 
  onUploadComplete,
  onUpload,
  onDelete,
  accept = "image/*",
  bucket = "media",
  folderPath = "",
  fileName,
  className,
  buttonContent = "Upload File",
  value,
  skipUpload = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      console.log('🚀 Starting file upload process:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folderPath,
        bucket
      });

      if (skipUpload && onUploadComplete) {
        try {
          // Ensure we're calling it as a function that accepts a File
          const uploadFn = onUploadComplete as (file: File) => Promise<void>;
          await uploadFn(file);
          toast.success('File processed successfully');
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Failed to process file');
        } finally {
          setIsUploading(false);
        }
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const finalFileName = fileName 
        ? `${fileName}.${fileExt}`
        : `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const filePath = folderPath 
        ? `${folderPath}/${finalFileName}`.replace(/\/+/g, '/') 
        : finalFileName;

      console.log('📁 Uploading file to path:', filePath);

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Error uploading original file:', uploadError);
        throw uploadError;
      }

      console.log('✅ Original file uploaded successfully:', data);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('🔗 File public URL:', publicUrl);

      if (isImageFile(file)) {
        try {
          console.log('🔄 Starting WebP conversion');
          const { webpBlob } = await convertToWebP(file);
          const webpPath = `${folderPath}/${fileName || file.name.split('.')[0]}.webp`;

          console.log('📤 Uploading WebP version to:', webpPath);

          const { error: webpError } = await supabase.storage
            .from(bucket)
            .upload(webpPath, webpBlob, {
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: true
            });

          if (webpError) {
            console.error('⚠️ WebP upload error:', webpError);
          } else {
            console.log('✅ WebP version uploaded successfully');
          }
        } catch (webpError) {
          console.error('⚠️ WebP conversion failed:', webpError);
        }
      }

      if (onUploadComplete) {
        (onUploadComplete as (url: string) => void)(publicUrl);
      }
      if (onUpload) onUpload(publicUrl);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="relative"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            buttonContent
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={accept}
            disabled={isUploading}
          />
        </Button>
        {value && onDelete && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDelete}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}