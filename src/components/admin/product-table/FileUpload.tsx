import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  accept: string;
  bucket: string;
  onUploadComplete: (file: File) => void;
  className?: string;
}

export function FileUpload({ accept, bucket, onUploadComplete, className }: FileUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onUploadComplete(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <Input
      type="file"
      accept={accept}
      onChange={handleFileChange}
      className={cn("cursor-pointer", className)}
    />
  );
} 