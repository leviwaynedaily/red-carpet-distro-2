import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type ProductWithCategories = Tables<"products"> & { categories: string[] };

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductWithCategories[]> => {
      console.log('useProducts: Starting to fetch all products');
      
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          product_categories!left (
            categories!left (
              name
            )
          )
        `);

      if (productsError) {
        console.error('useProducts: Error fetching products:', productsError);
        throw productsError;
      }

      console.log('useProducts: Raw products data:', productsData);

      // Transform the data to include categories array
      const transformedProducts = productsData.map(product => ({
        ...product,
        categories: product.product_categories
          ?.map(pc => pc.categories?.name)
          .filter(Boolean) || []
      }));

      console.log('useProducts: Transformed products:', transformedProducts);
      return transformedProducts;
    },
  });
};