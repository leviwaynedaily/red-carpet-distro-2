import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const updateProductFields = async (productId: string, updates: Record<string, any>) => {
  try {
    console.log('Updating product:', productId, 'with updates:', updates);
    
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) throw error;
    
    console.log('Product updated successfully');
    toast.success('Product updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Failed to update product');
    return false;
  }
};

// Update specific product to remove a category
export const removeProductCategory = async (productId: string, categoryId: string) => {
  try {
    console.log('Removing category:', categoryId, 'from product:', productId);
    
    const { error: deleteError } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId)
      .eq('category_id', categoryId);

    if (deleteError) throw deleteError;

    console.log('Category removed successfully');
    toast.success('Category removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing category:', error);
    toast.error('Failed to remove category');
    return false;
  }
};