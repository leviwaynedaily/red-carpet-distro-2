import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { convertToWebP } from "@/utils/imageUtils";

interface OpenGraphSettingsProps {
  settings: {
    id: string;
    og_image: string;
    og_image_webp?: string;
  };
  onSettingChange: (name: string, value: any) => void;
}

export function OpenGraphSettings({ settings, onSettingChange }: OpenGraphSettingsProps) {
  const handleOgImageUpload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const originalFile = new File([blob], 'og-image.png', { type: 'image/png' });

      console.log('Converting to WebP...');
      const { webpBlob } = await convertToWebP(originalFile);
      const webpFile = new File([webpBlob], 'og-image.webp', { type: 'image/webp' });

      console.log('Uploading WebP version...');
      const { data: webpUpload, error: webpError } = await supabase.storage
        .from('media')
        .upload('sitesettings/og-image.webp', webpFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (webpError) throw webpError;

      const webpUrl = `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/og-image.webp`;

      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          og_image: url,
          og_image_webp: webpUrl
        })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      onSettingChange('og_image', url);
      onSettingChange('og_image_webp', webpUrl);

      toast.success('OG image uploaded successfully');
    } catch (error) {
      console.error('Error in handleOgImageUpload:', error);
      toast.error('Failed to process OG image upload');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Graph Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label>OG Image</Label>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {settings.og_image && (
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <img
                  src={settings.og_image}
                  alt="OG Image"
                  className="w-32 h-32 object-contain rounded-md mb-2"
                />
              </div>
            </div>
          )}
          <div className="p-4">
            <FileUpload
              onUploadComplete={handleOgImageUpload}
              accept="image/*"
              folderPath="sitesettings"
              fileName="og-image"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}