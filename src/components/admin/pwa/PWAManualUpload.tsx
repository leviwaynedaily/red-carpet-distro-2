import React from 'react';
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconStatus } from "./IconStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PWAIcon } from "@/types/site-settings";

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

interface PWAManualUploadProps {
  icons: PWAIcon[];
  onIconsUpdate: (icons: PWAIcon[]) => void;
}

export function PWAManualUpload({ icons, onIconsUpdate }: PWAManualUploadProps) {
  const handleIconUpload = async (url: string, size: number, purpose: 'any' | 'maskable') => {
    try {
      console.log(`Uploading ${size}x${size} ${purpose} icon`);
      
      // Fetch the uploaded file
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create file names for both PNG and WebP versions
      const filename = `icon-${size}${purpose === 'maskable' ? '-maskable' : ''}`;
      const pngPath = `pwa/${filename}.png`;
      const webpPath = `pwa/${filename}.webp`;

      // Upload PNG version
      const { error: pngError } = await supabase.storage
        .from('media')
        .upload(pngPath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (pngError) throw pngError;

      // Convert to WebP and upload
      const webpBlob = await new Promise<Blob>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = size;
          canvas.height = size;
          ctx?.drawImage(img, 0, 0, size, size);
          canvas.toBlob(blob => resolve(blob!), 'image/webp', 0.9);
        };
        
        img.src = URL.createObjectURL(blob);
      });

      const { error: webpError } = await supabase.storage
        .from('media')
        .upload(webpPath, webpBlob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (webpError) throw webpError;

      // Get public URLs
      const { data: { publicUrl: pngUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(pngPath);

      const { data: { publicUrl: webpUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(webpPath);

      // Update icons array
      const newIcon: PWAIcon = {
        src: pngUrl,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose,
        webp: webpUrl
      };

      const updatedIcons = [...icons.filter(icon => 
        !(icon.sizes === `${size}x${size}` && icon.purpose === purpose)
      ), newIcon];

      onIconsUpdate(updatedIcons);
      toast.success(`${size}x${size} ${purpose} icon uploaded successfully`);
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error(`Failed to upload ${size}x${size} ${purpose} icon`);
    }
  };

  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="space-y-8">
        {PWA_SIZES.map(size => {
          const sizeIcons = icons?.filter(icon => icon.sizes === `${size}x${size}`) || [];
          const regularIcon = sizeIcons.find(icon => icon.purpose === 'any');
          const maskableIcon = sizeIcons.find(icon => icon.purpose === 'maskable');

          return (
            <div key={size} className="space-y-4">
              <h4 className="font-medium text-lg border-b pb-2">{size}x{size}</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium">Regular Icon</h5>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-white rounded-lg border p-2 flex items-center justify-center">
                      {regularIcon && (
                        <img 
                          src={regularIcon.src} 
                          alt={`${size}x${size} regular`}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <FileUpload
                        onUploadComplete={(url) => handleIconUpload(url, size, 'any')}
                        accept="image/png"
                        folderPath="pwa"
                        fileName={`icon-${size}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h5 className="font-medium">Maskable Icon</h5>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-white rounded-lg border p-2 flex items-center justify-center">
                      {maskableIcon && (
                        <img 
                          src={maskableIcon.src} 
                          alt={`${size}x${size} maskable`}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <FileUpload
                        onUploadComplete={(url) => handleIconUpload(url, size, 'maskable')}
                        accept="image/png"
                        folderPath="pwa"
                        fileName={`icon-${size}-maskable`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}