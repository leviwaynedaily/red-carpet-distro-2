import { CategoryForm } from "./categories/CategoryForm";
import { CategoryList } from "./categories/CategoryList";
import { useQueryClient } from "@tanstack/react-query";

interface CategoryManagementProps {
  onCategoryChange?: () => void;
}

export function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const queryClient = useQueryClient();

  const handleCategoryAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    onCategoryChange?.();
  };

  const handleCategoryChanged = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    onCategoryChange?.();
  };

  return (
    <div className="space-y-4">
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      <CategoryList onCategoryChange={handleCategoryChanged} />
    </div>
  );
}