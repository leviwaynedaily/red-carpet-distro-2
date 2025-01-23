import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { updateRootColors } from "@/utils/colorUtils";
import { convertToWebP } from "@/utils/imageUtils";
import { ColorSettings } from "./settings/ColorSettings";
import { LogoSettings } from "./settings/LogoSettings";
import { DescriptionSettings } from "./settings/DescriptionSettings";
import { OpenGraphSettings } from "./settings/OpenGraphSettings";
import { PWASettings } from "./pwa/PWASettings";
import { WelcomeInstructions } from "./settings/WelcomeInstructions";
import { PasswordSettings } from "./settings/PasswordSettings";
import type { PWAIcon } from "@/types/site-settings";

const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

interface WelcomeInstructionsType {
  title: string;
  subtitle: string;
  guidelines: string;
}

type SiteSettingsType = {
  id: string;
  logo_url: string;
  logo_url_webp?: string;
  favicon_url: string;
  favicon_png_url?: string;
  pwa_name: string;
  pwa_description: string;
  pwa_theme_color: string;
  pwa_background_color: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  storefront_password: string;
  admin_password: string;
  pwa_short_name: string;
  pwa_display: string;
  pwa_orientation: string;
  pwa_scope: string;
  pwa_start_url: string;
  pwa_icons: PWAIcon[];
  pwa_desktop_screenshot?: string;
  pwa_mobile_screenshot?: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_image_webp: string;
  og_url: string;
  show_site_logo: boolean;
  show_site_description: boolean;
  site_description: string;
  header_color: string;
  header_opacity: number;
  toolbar_color: string;
  toolbar_opacity: number;
  welcome_instructions: WelcomeInstructionsType;
  background_color: string;
  background_opacity: number;
};

function isWelcomeInstructions(value: any): value is WelcomeInstructionsType {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.title === 'string' &&
    typeof value.subtitle === 'string' &&
    typeof value.guidelines === 'string'
  );
}

export function SiteSettings() {

  const [settings, setSettings] = useState<SiteSettingsType>({
    id: "",
    logo_url: "",
    logo_url_webp: "",
    favicon_url: "",
    favicon_png_url: "",
    pwa_name: "",
    pwa_description: "",
    pwa_theme_color: "",
    pwa_background_color: "",
    primary_color: "#FF69B4",
    secondary_color: "#00A86B",
    font_family: "",
    storefront_password: "",
    admin_password: "",
    pwa_short_name: "",
    pwa_display: "standalone",
    pwa_orientation: "portrait",
    pwa_scope: "/",
    pwa_start_url: "/",
    pwa_icons: [],
    pwa_desktop_screenshot: "",
    pwa_mobile_screenshot: "",
    og_title: "",
    og_description: "",
    og_image: "",
    og_image_webp: "",
    og_url: "https://palmtreesmokes.com",
    show_site_logo: true,
    show_site_description: true,
    site_description: "Welcome to Palmtree Smokes, your premium destination for quality cannabis products. Browse our carefully curated selection below.",
    header_color: "#FFFFFF",
    header_opacity: 1.0,
    toolbar_color: "#FFFFFF",
    toolbar_opacity: 1.0,
    welcome_instructions: {
      title: "Welcome to Palmtree Smokes",
      subtitle: "Please take a moment to review our store guidelines:",
      guidelines: ""
    },
    background_color: "#FFFFFF",
    background_opacity: 1.0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    updateRootColors({
      primary: settings.primary_color,
      secondary: settings.secondary_color,
      background: settings.pwa_background_color,
      foreground: settings.pwa_theme_color,
    });
  }, [
    settings.primary_color,
    settings.secondary_color,
    settings.pwa_background_color,
    settings.pwa_theme_color,
  ]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();

      if (error) throw error;
      
      if (data) {
        const parsedIcons = Array.isArray(data.pwa_icons) 
          ? data.pwa_icons.map((icon: any) => ({
              src: icon.src || "",
              sizes: icon.sizes || "",
              type: icon.type || "",
              purpose: icon.purpose || 'any',
              webp: icon.webp || ''
            }))
          : [];

        const defaultWelcomeInstructions: WelcomeInstructionsType = {
          title: "Welcome to Palmtree Smokes",
          subtitle: "Please take a moment to review our store guidelines:",
          guidelines: ""
        };

        const welcomeInstructions = isWelcomeInstructions(data.welcome_instructions)
          ? data.welcome_instructions
          : defaultWelcomeInstructions;

        setSettings({
          ...data,
          pwa_icons: parsedIcons,
          welcome_instructions: welcomeInstructions
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const handleSettingChange = (name: string, value: any) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabaseSettings = {
        ...settings,
        welcome_instructions: {
          title: settings.welcome_instructions.title,
          subtitle: settings.welcome_instructions.subtitle,
          guidelines: settings.welcome_instructions.guidelines
        }
      };

      const { error } = await supabase
        .from("site_settings")
        .update(supabaseSettings)
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Settings updated successfully");
      
      const ogImageMeta = document.querySelector('meta[property="og:image"]');
      const ogUrlMeta = document.querySelector('meta[property="og:url"]');
      
      if (ogImageMeta) {
        const ogImageUrl = `https://fwsdoiaodphgyeteafbq.supabase.co/storage/v1/object/public/media/sitesettings/og-image.png`;
        console.log('Setting og:image meta tag to:', ogImageUrl);
        ogImageMeta.setAttribute('content', ogImageUrl);
      }
      
      if (ogUrlMeta && settings.og_url) {
        console.log('Setting og:url meta tag to:', settings.og_url);
        ogUrlMeta.setAttribute('content', settings.og_url);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const handlePWAIconUpload = async (url: string, size: number) => {
    console.log('Handling PWA icon upload:', { url, size });
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (!settingsData?.id) {
        throw new Error('No settings record found');
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const originalFile = new File([blob], 'icon.png', { type: 'image/png' });

      console.log('Converting to WebP...');
      const { webpBlob } = await convertToWebP(originalFile);
      const webpFile = new File([webpBlob], 'icon.webp', { type: 'image/webp' });

      const webpPath = `pwa/icons/icon-${size}x${size}.webp`;
      const { data: webpUpload, error: webpError } = await supabase.storage
        .from('media')
        .upload(webpPath, webpFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (webpError) throw webpError;

      const webpUrl = `https://fwsdoiaodphgyeteafbq.supabase.co/storage/v1/object/public/media/${webpPath}`;

      const newIcon: PWAIcon = {
        src: url,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any',
        webp: webpUrl
      };

      const currentIcons = Array.isArray(settingsData.pwa_icons) 
        ? (settingsData.pwa_icons as PWAIcon[])
        : [];
      const updatedIcons = [...currentIcons, newIcon];

      const { error: updateError } = await supabase
        .from('site_settings')
        .update({ pwa_icons: updatedIcons })
        .eq('id', settingsData.id);

      if (updateError) throw updateError;

      setSettings(prev => ({
        ...prev,
        pwa_icons: updatedIcons
      }));

      toast.success('PWA icon uploaded successfully');
    } catch (error) {
      console.error('Error in handlePWAIconUpload:', error);
      toast.error('Failed to process PWA icon upload');
    }
  };

  return (
    <div className="w-full max-w-6xl pl-6 mt-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="w-full h-auto flex-wrap gap-2 bg-background border p-2">
            <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
            <TabsTrigger value="site" className="flex-1">Site Settings</TabsTrigger>
            <TabsTrigger value="welcome" className="flex-1">Welcome</TabsTrigger>
            <TabsTrigger value="passwords" className="flex-1">Passwords</TabsTrigger>
            <TabsTrigger value="pwa" className="flex-1">PWA Settings</TabsTrigger>
            <TabsTrigger value="og" className="flex-1">Open Graph</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="colors" className="space-y-4">
              <ColorSettings 
                settings={settings} 
                onSettingChange={handleSettingChange} 
              />
            </TabsContent>

            <TabsContent value="site">
              <div className="space-y-4">
                <LogoSettings 
                  settings={settings}
                  onSettingChange={handleSettingChange}
                />
                <DescriptionSettings 
                  settings={settings}
                  onSettingChange={handleSettingChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="welcome" className="space-y-4">
              <WelcomeInstructions
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </TabsContent>

            <TabsContent value="passwords" className="space-y-4">
              <PasswordSettings
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </TabsContent>

            <TabsContent value="pwa" className="space-y-6">
              <PWASettings
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </TabsContent>

            <TabsContent value="og" className="space-y-4">
              <OpenGraphSettings 
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </TabsContent>
          </div>
        </Tabs>

        <Button type="submit" className="w-full">
          Save Settings
        </Button>
      </form>
    </div>
  );
}
