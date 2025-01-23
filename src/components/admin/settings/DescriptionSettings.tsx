import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionSettingsProps {
  settings: {
    show_site_description: boolean;
    site_description: string;
  };
  onSettingChange: (name: string, value: any) => void;
}

export function DescriptionSettings({ settings, onSettingChange }: DescriptionSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show_site_description"
            checked={settings.show_site_description}
            onCheckedChange={(checked) =>
              onSettingChange('show_site_description', checked)
            }
          />
          <Label htmlFor="show_site_description">Show Site Description</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_description">Site Description</Label>
          <Textarea
            id="site_description"
            value={settings.site_description}
            onChange={(e) =>
              onSettingChange('site_description', e.target.value)
            }
            placeholder="Enter site description"
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}