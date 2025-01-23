import { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";

function App() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('App: Captured beforeinstallprompt event');
      setDeferredPrompt(window.deferredPrompt);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if we already have a deferred prompt
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('App: Fetching site settings...');
        
        // First check if Supabase client is properly initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        // Test connection to Supabase
        const { data: testData, error: testError } = await supabase
          .from('site_settings')
          .select('id')
          .limit(1)
          .single();

        if (testError) {
          console.error('App: Error testing Supabase connection:', testError);
          throw testError;
        }

        console.log('App: Supabase connection successful, fetching favicon settings');

        const { data: settings, error } = await supabase
          .from('site_settings')
          .select('favicon_url, favicon_webp_url, favicon_png_url')
          .single();

        if (error) {
          console.error('App: Error fetching favicon settings:', error);
          throw error;
        }

        if (settings) {
          console.log('App: Successfully fetched favicon settings:', settings);
          
          // Set WebP favicon with PNG fallback
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = settings.favicon_url;
          document.getElementsByTagName('head')[0].appendChild(link);

          // Set PNG favicon
          if (settings.favicon_png_url) {
            console.log('App: Setting PNG favicon:', settings.favicon_png_url);
            const pngLink = document.createElement('link');
            pngLink.type = 'image/png';
            pngLink.rel = 'icon';
            pngLink.href = settings.favicon_png_url;
            document.getElementsByTagName('head')[0].appendChild(pngLink);
          }

          // Set WebP favicon
          if (settings.favicon_webp_url) {
            console.log('App: Setting WebP favicon:', settings.favicon_webp_url);
            const webpLink = document.createElement('link');
            webpLink.type = 'image/webp';
            webpLink.rel = 'icon';
            webpLink.href = settings.favicon_webp_url;
            document.getElementsByTagName('head')[0].appendChild(webpLink);
          }
        }
      } catch (error) {
        console.error('App: Critical error fetching site settings:', error);
        toast.error('Failed to load site settings. Please refresh the page or contact support if the issue persists.');
      }
    };

    fetchSettings();
  }, []);

  const handleCloseInstallPrompt = () => {
    console.log('App: Closing install prompt');
    setShowInstallPrompt(false);
  };

  return (
    <>
      <RouterProvider router={router} />
      {showInstallPrompt && deferredPrompt && (
        <PWAInstallPrompt
          deferredPrompt={deferredPrompt}
          onClose={handleCloseInstallPrompt}
        />
      )}
      <Toaster />
      <SonnerToaster position="top-center" />
    </>
  );
}

export default App;