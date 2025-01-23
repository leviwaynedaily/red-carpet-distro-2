interface FileStatus {
  png?: boolean;
  webp?: boolean;
  ico?: boolean;
}

interface IconStatusProps {
  status: FileStatus;
}

import { Check, X } from "lucide-react";

export function IconStatus({ status }: IconStatusProps) {
  return (
    <div className="space-y-2">
      {Object.entries(status).map(([format, exists]) => (
        <div key={format} className="flex items-center gap-2">
          {exists ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground uppercase">{format}</span>
        </div>
      ))}
    </div>
  );
}