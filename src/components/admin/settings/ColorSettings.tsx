import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ColorSettingsProps {
  settings: {
    primary_color: string;
    secondary_color: string;
    pwa_theme_color: string;
    pwa_background_color: string;
    header_color: string;
    header_opacity: number;
    toolbar_color: string;
    toolbar_opacity: number;
    background_color: string;
    background_opacity: number;
  };
  onSettingChange: (name: string, value: string | number) => void;
}

export function ColorSettings({ settings, onSettingChange }: ColorSettingsProps) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingChange(name, value);
    
    if (name.includes('color')) {
      toast.success('Color updated! Save to make permanent.', {
        description: `${name.replace('_', ' ')} changed to ${value}`,
      });
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>, opacityType: string) => {
    const value = parseFloat(e.target.value);
    onSettingChange(`${opacityType}_opacity`, value);
    
    toast.success(`${opacityType} opacity updated! Save to make permanent.`, {
      description: `${opacityType} opacity changed to ${Math.round(value * 100)}%`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Colors</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                value={settings.primary_color}
                onChange={handleColorChange}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">
                {settings.primary_color}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="secondary_color"
                name="secondary_color"
                type="color"
                value={settings.secondary_color}
                onChange={handleColorChange}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">
                {settings.secondary_color}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pwa_theme_color">Theme Color (Foreground)</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="pwa_theme_color"
                name="pwa_theme_color"
                type="color"
                value={settings.pwa_theme_color}
                onChange={handleColorChange}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">
                {settings.pwa_theme_color}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pwa_background_color">PWA Background Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="pwa_background_color"
                name="pwa_background_color"
                type="color"
                value={settings.pwa_background_color}
                onChange={handleColorChange}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">
                {settings.pwa_background_color}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="background_color">Page Background Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="background_color"
                name="background_color"
                type="color"
                value={settings.background_color}
                onChange={handleColorChange}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">
                {settings.background_color}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background_opacity">Background Opacity</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="background_opacity"
                name="background_opacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.background_opacity}
                onChange={(e) => handleOpacityChange(e, 'background')}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground w-12">
                {Math.round(settings.background_opacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_color">Header Color</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="header_color"
              name="header_color"
              type="color"
              value={settings.header_color}
              onChange={handleColorChange}
              className="w-20 h-10"
            />
            <span className="text-sm text-muted-foreground">
              {settings.header_color}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_opacity">Header Opacity</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="header_opacity"
              name="header_opacity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.header_opacity}
              onChange={(e) => handleOpacityChange(e, 'header')}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground w-12">
              {Math.round(settings.header_opacity * 100)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toolbar_color">Toolbar Color</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="toolbar_color"
              name="toolbar_color"
              type="color"
              value={settings.toolbar_color}
              onChange={handleColorChange}
              className="w-20 h-10"
            />
            <span className="text-sm text-muted-foreground">
              {settings.toolbar_color}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toolbar_opacity">Toolbar Opacity</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="toolbar_opacity"
              name="toolbar_opacity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.toolbar_opacity}
              onChange={(e) => handleOpacityChange(e, 'toolbar')}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground w-12">
              {Math.round(settings.toolbar_opacity * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Color Preview</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}