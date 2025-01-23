import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordSettingsProps {
  settings: {
    storefront_password: string | null;
    admin_password: string | null;
  };
  onSettingChange: (name: string, value: any) => void;
}

export const PasswordSettings = ({
  settings,
  onSettingChange,
}: PasswordSettingsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="storefront_password">Storefront Password</Label>
        <Input
          id="storefront_password"
          type="password"
          value={settings.storefront_password || ""}
          onChange={(e) => onSettingChange("storefront_password", e.target.value)}
          placeholder="Enter storefront password"
        />
        <p className="text-sm text-muted-foreground">
          This password is required to access the storefront
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin_password">Admin Password</Label>
        <Input
          id="admin_password"
          type="password"
          value={settings.admin_password || ""}
          onChange={(e) => onSettingChange("admin_password", e.target.value)}
          placeholder="Enter admin password"
        />
        <p className="text-sm text-muted-foreground">
          This password is required to access the admin panel
        </p>
      </div>
    </div>
  );
};