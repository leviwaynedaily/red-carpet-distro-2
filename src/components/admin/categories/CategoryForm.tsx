import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CategoryForm({ onCategoryAdded }: { onCategoryAdded: () => void }) {
  const [newCategory, setNewCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      setIsSubmitting(true);
      console.log("CategoryForm: Adding new category:", newCategory);
      
      const { error } = await supabase
        .from("categories")
        .insert([{ name: newCategory.trim() }]);

      if (error) {
        console.error("CategoryForm: Error adding category:", error);
        if (error.code === '23505') {
          toast.error("A category with this name already exists");
        } else {
          toast.error("Failed to add category");
        }
        return;
      }

      console.log("CategoryForm: Category added successfully");
      toast.success("Category added successfully");
      setNewCategory("");
      onCategoryAdded();
    } catch (error) {
      console.error("CategoryForm: Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAddCategory} className="flex gap-2">
      <Input
        placeholder="New category name"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        className="flex-1"
        disabled={isSubmitting}
      />
      <Button type="submit" disabled={isSubmitting}>
        <Plus className="mr-2 h-4 w-4" />
        Add Category
      </Button>
    </form>
  );
}