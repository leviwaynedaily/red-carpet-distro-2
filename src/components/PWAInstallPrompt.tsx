import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface PWAInstallPromptProps {
  deferredPrompt: any;
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ deferredPrompt, onClose }) => {
  console.log('PWAInstallPrompt: Rendering install prompt component');

  const handleInstall = async () => {
    console.log('PWAInstallPrompt: Install button clicked');
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWAInstallPrompt: User choice result:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: "Installing PWA",
            description: "Thank you for installing our app!",
          });
        }
      } catch (error) {
        console.error('PWAInstallPrompt: Error showing install prompt:', error);
      }
    }
    onClose();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Install Palmtree Smokes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Install our app for a better experience
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Not now
          </Button>
          <Button
            onClick={handleInstall}
            className="flex-1"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;