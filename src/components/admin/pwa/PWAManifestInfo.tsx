import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function PWAManifestInfo() {
  const [manifestUrl, setManifestUrl] = useState<string>('');
  const [manifestContent, setManifestContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchManifestInfo();
  }, []);

  const fetchManifestInfo = async () => {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('static')
        .getPublicUrl('manifest.json');

      setManifestUrl(publicUrl);

      const response = await fetch(publicUrl);
      const content = await response.json();
      const formattedContent = JSON.stringify(content, null, 2);
      setManifestContent(formattedContent);
      setEditedContent(formattedContent);
    } catch (error) {
      console.error('Error fetching manifest info:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(manifestContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(manifestContent);
    setHasChanges(false);
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(value !== manifestContent);
  };

  const handleSave = async () => {
    try {
      // Validate JSON
      JSON.parse(editedContent);

      // Convert to Blob
      const manifestBlob = new Blob([editedContent], {
        type: 'application/json'
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('static')
        .upload('manifest.json', manifestBlob, {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setManifestContent(editedContent);
      setIsEditing(false);
      setHasChanges(false);
      toast.success('Manifest file updated successfully');
      
      // Refresh the display
      await fetchManifestInfo();
    } catch (error) {
      console.error('Error saving manifest:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      } else {
        toast.error('Failed to save manifest file');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          The manifest.json file is stored in the static bucket and referenced in index.html.
          Current manifest URL: <code className="bg-muted px-1 rounded">{manifestUrl}</code>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Manifest Content:</h4>
          <div className="space-x-2">
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline">
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!hasChanges}
                  variant={hasChanges ? "default" : "outline"}
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="font-mono text-sm h-[400px]"
          />
        ) : (
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <pre className="text-sm">
              {manifestContent}
            </pre>
          </ScrollArea>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Index.html Reference:</h4>
        <ScrollArea className="h-[100px] w-full rounded-md border p-4">
          <pre className="text-sm">
{`<link rel="manifest" href="${manifestUrl}">`}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}