import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { IconStatus } from "../pwa/IconStatus";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { convertToWebP } from "@/utils/imageUtils";

interface LogoSettingsProps {
  settings: {
    show_site_logo: boolean;
    logo_url: string;
    logo_url_webp?: string;
    favicon_url: string;
    favicon_png_url?: string;
    favicon_webp_url?: string;
  };
  onSettingChange: (name: string, value: any) => void;
}

export function LogoSettings({ settings, onSettingChange }: LogoSettingsProps) {
  const handleLogoUpload = async (url: string) => {
    console.log('Handling logo upload:', { url });
    
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
        throw settingsError;
      }

      if (!settings?.id) {
        throw new Error('No settings record found');
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const originalFile = new File([blob], 'logo.png', { type: 'image/png' });

      console.log('Converting to WebP...');
      const { webpBlob } = await convertToWebP(originalFile);
      const webpFile = new File([webpBlob], 'logo.webp', { type: 'image/webp' });

      console.log('Uploading WebP version...');
      const { data: webpUpload, error: webpError } = await supabase.storage
        .from('media')
        .upload('sitesettings/logo.webp', webpFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (webpError) {
        console.error('Error uploading WebP version:', webpError);
        throw webpError;
      }

      console.log('WebP version uploaded successfully');

      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          logo_url: url,
          logo_url_webp: `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/logo.webp`
        })
        .eq('id', settings.id);

      if (updateError) {
        console.error('Error updating site settings:', updateError);
        throw updateError;
      }

      onSettingChange('logo_url', url);
      onSettingChange('logo_url_webp', `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/logo.webp`);

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error in handleLogoUpload:', error);
      toast.error('Failed to process logo upload');
    }
  };

  const handleFaviconUpload = async (url: string) => {
    console.log('Handling favicon upload:', { url });
    
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
        throw settingsError;
      }

      if (!settings?.id) {
        throw new Error('No settings record found');
      }

      // Fetch the original file
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create PNG version
      const pngFile = new File([blob], 'favicon.png', { type: 'image/png' });
      
      // Convert to WebP
      console.log('Converting to WebP...');
      const { webpBlob } = await convertToWebP(pngFile);
      const webpFile = new File([webpBlob], 'favicon.webp', { type: 'image/webp' });

      // Convert to ICO (using PNG as ICO)
      const icoFile = new File([blob], 'favicon.ico', { type: 'image/x-icon' });

      // Upload all versions
      console.log('Uploading all versions...');
      
      // Upload ICO version
      const { error: icoError } = await supabase.storage
        .from('media')
        .upload('sitesettings/favicon.ico', icoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (icoError) {
        console.error('Error uploading ICO version:', icoError);
        throw icoError;
      }

      // Upload PNG version
      const { error: pngError } = await supabase.storage
        .from('media')
        .upload('sitesettings/favicon.png', pngFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (pngError) {
        console.error('Error uploading PNG version:', pngError);
        throw pngError;
      }

      // Upload WebP version
      const { error: webpError } = await supabase.storage
        .from('media')
        .upload('sitesettings/favicon.webp', webpFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (webpError) {
        console.error('Error uploading WebP version:', webpError);
        throw webpError;
      }

      const icoUrl = `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/favicon.ico`;
      const pngUrl = `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/favicon.png`;
      const webpUrl = `https://nzqdkelbytkvvwdgywja.supabase.co/storage/v1/object/public/media/sitesettings/favicon.webp`;

      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          favicon_url: icoUrl,
          favicon_png_url: pngUrl,
          favicon_webp_url: webpUrl
        })
        .eq('id', settings.id);

      if (updateError) {
        console.error('Error updating site settings:', updateError);
        throw updateError;
      }

      onSettingChange('favicon_url', icoUrl);
      onSettingChange('favicon_png_url', pngUrl);
      onSettingChange('favicon_webp_url', webpUrl);

      toast.success('Favicon uploaded successfully');
    } catch (error) {
      console.error('Error in handleFaviconUpload:', error);
      toast.error('Failed to process favicon upload');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show_site_logo"
            checked={settings.show_site_logo}
            onCheckedChange={(checked) => onSettingChange('show_site_logo', checked)}
          />
          <Label htmlFor="show_site_logo">Show Site Logo</Label>
        </div>

        <Label>Logo</Label>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {settings.logo_url && (
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="w-32 h-32 object-contain rounded-md mb-2"
                />
              </div>
              <div className="ml-4">
                <IconStatus 
                  status={{
                    png: !!settings.logo_url,
                    webp: !!settings.logo_url_webp
                  }}
                />
              </div>
            </div>
          )}
          <div className="p-4">
            <FileUpload
              onUploadComplete={handleLogoUpload}
              accept="image/*"
              folderPath="sitesettings"
              fileName="logo"
            />
          </div>
        </div>

        <Label>Favicon</Label>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {settings.favicon_url && (
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <img
                  src={settings.favicon_url}
                  alt="Favicon"
                  className="w-16 h-16 object-contain rounded-md mb-2"
                />
              </div>
              <div className="ml-4">
                <IconStatus 
                  status={{
                    ico: !!settings.favicon_url,
                    png: !!settings.favicon_png_url,
                    webp: !!settings.favicon_webp_url
                  }}
                />
              </div>
            </div>
          )}
          <div className="p-4">
            <FileUpload
              onUploadComplete={handleFaviconUpload}
              accept="image/*"
              folderPath="sitesettings"
              fileName="favicon"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}