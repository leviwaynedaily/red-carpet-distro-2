import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface CategoryListProps {
  onCategoryChange?: () => void;
}

export function CategoryList({ onCategoryChange }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: categories, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Tables<"categories">[];
    },
  });

  const handleEditStart = (category: Tables<"categories">) => {
    setEditingId(category.id);
    setEditValue(category.name);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleEditSave = async (id: string) => {
    try {
      console.log('CategoryList: Saving category edit:', { id, name: editValue });
      const { error } = await supabase
        .from('categories')
        .update({ name: editValue })
        .eq('id', id);

      if (error) throw error;

      console.log('CategoryList: Category updated successfully');
      toast.success("Category updated successfully");
      setEditingId(null);
      setEditValue("");
      refetch();
      onCategoryChange?.();
    } catch (error) {
      console.error('CategoryList: Error updating category:', error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      console.log('CategoryList: Starting category deletion:', id);
      
      // Delete the category (cascade will handle product_categories relationships)
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      console.log('CategoryList: Category deleted successfully');
      toast.success("Category deleted successfully");
      refetch();
      onCategoryChange?.();
    } catch (error) {
      console.error('CategoryList: Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Categories</h3>
      <div className="space-y-2">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border"
          >
            {editingId === category.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditSave(category.id)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEditCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span>{category.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditStart(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}