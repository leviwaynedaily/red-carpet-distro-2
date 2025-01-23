import React, { useState } from 'react';
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { PWAIcon } from "@/types/site-settings";

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

interface PWAAutoGenerateProps {
  onIconsGenerated: (icons: PWAIcon[]) => void;
}

export function PWAAutoGenerate({ onIconsGenerated }: PWAAutoGenerateProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const createMaskableVersion = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, size: number) => {
    const maskableCanvas = document.createElement('canvas');
    const maskableCtx = maskableCanvas.getContext('2d');
    if (!maskableCtx) return null;

    maskableCanvas.width = size;
    maskableCanvas.height = size;

    const padding = size * 0.1;
    const imageSize = size - (padding * 2);

    maskableCtx.fillStyle = 'white';
    maskableCtx.fillRect(0, 0, size, size);
    maskableCtx.drawImage(canvas, padding, padding, imageSize, imageSize);

    return maskableCanvas;
  };

  const uploadToStorage = async (blob: Blob, size: number, type: 'any' | 'maskable', format: 'png' | 'webp') => {
    const filename = `icon-${size}${type === 'maskable' ? '-maskable' : ''}.${format}`;
    const filePath = `pwa/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: format === 'webp' ? 'image/webp' : 'image/png'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const processAndUploadImage = async (file: File) => {
    try {
      setIsProcessing(true);
      console.log('Starting image processing...');

      const sourceCanvas = document.createElement('canvas');
      const sourceCtx = sourceCanvas.getContext('2d');
      if (!sourceCtx) throw new Error('Could not get canvas context');

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const generatedIcons: PWAIcon[] = [];

      for (const size of PWA_SIZES) {
        console.log(`Processing size: ${size}x${size}`);

        sourceCanvas.width = size;
        sourceCanvas.height = size;
        sourceCtx.clearRect(0, 0, size, size);
        sourceCtx.drawImage(img, 0, 0, size, size);

        const maskableCanvas = createMaskableVersion(sourceCanvas, sourceCtx, size);
        if (!maskableCanvas) continue;

        // Process regular icon
        const regularBlob = await new Promise<Blob>(resolve => 
          sourceCanvas.toBlob(blob => resolve(blob!), 'image/png')
        );
        const regularWebPBlob = await new Promise<Blob>(resolve => 
          sourceCanvas.toBlob(blob => resolve(blob!), 'image/webp')
        );

        // Process maskable icon
        const maskableBlob = await new Promise<Blob>(resolve => 
          maskableCanvas.toBlob(blob => resolve(blob!), 'image/png')
        );
        const maskableWebPBlob = await new Promise<Blob>(resolve => 
          maskableCanvas.toBlob(blob => resolve(blob!), 'image/webp')
        );

        // Upload all versions
        const regularPngUrl = await uploadToStorage(regularBlob, size, 'any', 'png');
        const regularWebpUrl = await uploadToStorage(regularWebPBlob, size, 'any', 'webp');
        const maskablePngUrl = await uploadToStorage(maskableBlob, size, 'maskable', 'png');
        const maskableWebpUrl = await uploadToStorage(maskableWebPBlob, size, 'maskable', 'webp');

        // Add regular icon
        generatedIcons.push({
          src: regularPngUrl,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
          webp: regularWebpUrl
        });

        // Add maskable icon
        generatedIcons.push({
          src: maskablePngUrl,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'maskable',
          webp: maskableWebpUrl
        });
      }

      onIconsGenerated(generatedIcons);
      toast.success('All PWA icons generated and uploaded successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process and upload PWA icons');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Single PWA Icon (512x512 PNG)</Label>
        <p className="text-sm text-muted-foreground">
          Upload a single 512x512 PNG image and we'll automatically generate all required sizes and formats
        </p>
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing and uploading icons...</span>
          </div>
        ) : (
          <FileUpload
            onUploadComplete={(url) => {
              fetch(url)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'icon.png', { type: 'image/png' });
                  processAndUploadImage(file);
                })
                .catch(error => {
                  console.error('Error fetching uploaded file:', error);
                  toast.error('Failed to process uploaded file');
                });
            }}
            accept="image/png"
            folderPath="pwa"
            fileName="original"
          />
        )}
      </div>
    </div>
  );
}