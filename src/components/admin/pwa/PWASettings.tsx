import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PWAScreenshots } from "./PWAScreenshots";
import { PWAManualUpload } from "./PWAManualUpload";
import { PWAAutoGenerate } from "./PWAAutoGenerate";
import { PWAManifestInfo } from "./PWAManifestInfo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PWAIcon } from "@/types/site-settings";

interface PWASettingsProps {
  settings: any;
  onSettingChange: (name: string, value: any) => void;
}

export function PWASettings({ settings, onSettingChange }: PWASettingsProps) {
  const handleIconsUpdate = (icons: PWAIcon[]) => {
    console.log('Updating PWA icons:', icons);
    onSettingChange('pwa_icons', icons);
  };

  const generateManifest = async () => {
    try {
      console.log('Generating manifest.json...');
      
      const manifest = {
        id: "/",
        name: settings.pwa_name || "Palmtree Smokes",
        short_name: settings.pwa_short_name || "Palmtree",
        description: settings.pwa_description || "Premium cannabis products",
        start_url: settings.pwa_start_url || "/",
        display: settings.pwa_display || "standalone",
        background_color: settings.pwa_background_color || "#ffffff",
        theme_color: settings.pwa_theme_color || "#000000",
        orientation: settings.pwa_orientation || "portrait",
        scope: settings.pwa_scope || "/",
        categories: ["shopping", "lifestyle", "health"],
        prefer_related_applications: false,
        icons: settings.pwa_icons?.map((icon: PWAIcon) => ({
          src: icon.src,
          sizes: icon.sizes,
          type: icon.type || "image/png",
          purpose: icon.purpose || "any"
        })) || [],
        screenshots: [
          settings.pwa_desktop_screenshot && {
            src: settings.pwa_desktop_screenshot,
            sizes: "1920x1080",
            type: "image/webp",
            form_factor: "wide"
          },
          settings.pwa_mobile_screenshot && {
            src: settings.pwa_mobile_screenshot,
            sizes: "1080x1920",
            type: "image/webp",
            form_factor: "narrow"
          }
        ].filter(Boolean)
      };

      // Convert manifest to Blob
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });

      // Upload to Supabase Storage in the static bucket
      const { error: uploadError } = await supabase.storage
        .from('static')
        .upload('manifest.json', manifestBlob, {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('static')
        .getPublicUrl('manifest.json');

      console.log('Manifest generated and uploaded successfully:', publicUrl);
      toast.success('Manifest file generated and uploaded successfully');
    } catch (error) {
      console.error('Error generating manifest:', error);
      toast.error('Failed to generate manifest file');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">PWA Settings</h3>
        <Button onClick={generateManifest}>
          Generate Manifest
        </Button>
      </div>

      <Tabs defaultValue="screenshots" className="w-full">
        <TabsList>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
          <TabsTrigger value="auto">Auto Generate</TabsTrigger>
          <TabsTrigger value="manifest">Manifest Info</TabsTrigger>
        </TabsList>

        <TabsContent value="screenshots" className="mt-4">
          <PWAScreenshots
            desktopScreenshot={settings.pwa_desktop_screenshot || null}
            mobileScreenshot={settings.pwa_mobile_screenshot || null}
            onDesktopUpload={(url) => onSettingChange('pwa_desktop_screenshot', url)}
            onMobileUpload={(url) => onSettingChange('pwa_mobile_screenshot', url)}
          />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <PWAManualUpload
            icons={settings.pwa_icons || []}
            onIconsUpdate={handleIconsUpdate}
          />
        </TabsContent>

        <TabsContent value="auto" className="mt-4">
          <PWAAutoGenerate
            onIconsGenerated={handleIconsUpdate}
          />
        </TabsContent>

        <TabsContent value="manifest" className="mt-4">
          <PWAManifestInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}