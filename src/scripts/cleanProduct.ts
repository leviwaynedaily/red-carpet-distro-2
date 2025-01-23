import { supabase } from "@/integrations/supabase/client";
import { removeProductCategory } from "../utils/productUtils";

const cleanProduct = async () => {
  try {
    console.log('Starting product cleanup...');
    
    // Remove 'oil' category from product ca1323
    await removeProductCategory('ca1323', 'oil');
    
    // Clear the strain 'cloud'
    const { error: updateError } = await supabase
      .from('products')
      .update({ strain: null })
      .eq('id', 'ca1323');

    if (updateError) throw updateError;
    
    console.log('Product cleanup completed successfully');
  } catch (error) {
    console.error('Error during product cleanup:', error);
  }
};

// Execute the cleanup
cleanProduct();